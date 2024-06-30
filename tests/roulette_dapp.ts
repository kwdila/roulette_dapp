import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RouletteDapp } from "../target/types/roulette_dapp";

import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

const BET_SEED = "BET_SEED";

describe("roulette_dapp", () => {
  const provider = anchor.AnchorProvider.local("http://127.0.0.1:8899");
  anchor.setProvider(provider);

  const program = anchor.workspace.RouletteDapp as Program<RouletteDapp>;

  const bob = anchor.web3.Keypair.generate();
  const alice = anchor.web3.Keypair.generate();

  const betNumber_bob1 = 30;
  const isBlack_bob1 = false;

  const betNumber_bob2 = 37;
  const isBlack_bob2 = true;

  const betNumber_bob3 = 0;
  const isBlack_bob3 = false;

  describe("Initialize Bet", async () => {
    it("Bet initialized!", async () => {
      await airdrop(provider.connection, bob.publicKey);
      const [bet_pkey, bet_bump] = getBetAddress(
        betNumber_bob1,
        isBlack_bob1,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .initialize(betNumber_bob1, isBlack_bob1)
        .accounts({
          bet: bet_pkey,
          betAuthority: bob.publicKey,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkBet(
        program,
        bet_pkey,
        bob.publicKey,
        betNumber_bob1,
        isBlack_bob1,
        bet_bump
      );
    });
    it("Cannot initialize bet with bet numbet larger than 36", async () => {
      let should_fail = "This Should Fail";
      try {
        const [bet_pkey, bet_bump] = getBetAddress(
          betNumber_bob2,
          isBlack_bob2,
          bob.publicKey,
          program.programId
        );

        await program.methods
          .initialize(betNumber_bob2, isBlack_bob2)
          .accounts({
            bet: bet_pkey,
            betAuthority: bob.publicKey,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(err.error.errorCode.code, "InvalidBetNumber");
        should_fail = "Failed";
      }
      assert.strictEqual(should_fail, "Failed");
    });
  });
  describe("Finalize Bet", async () => {
    it("Bet Finalized", async () => {
      await airdrop(provider.connection, bob.publicKey);
      const [bet_pkey, bet_bump] = getBetAddress(
        betNumber_bob1,
        isBlack_bob1,
        bob.publicKey,
        program.programId
      );

      await program.methods
        .finalize()
        .accounts({
          bet: bet_pkey,
          betAuthority: bob.publicKey,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      await checkBet(
        program,
        bet_pkey,
        bob.publicKey,
        betNumber_bob1,
        isBlack_bob1,
        bet_bump
      );
      await checkRandom(program, bet_pkey, betNumber_bob1, isBlack_bob1);
    });
  });
});

function getBetAddress(
  betNumber: number,
  isBlack: boolean,
  author: PublicKey,
  programID: PublicKey
) {
  const colorBuffer = Buffer.alloc(1);
  colorBuffer[0] = isBlack ? 1 : 0; // 1 for black, 0 for red

  return PublicKey.findProgramAddressSync(
    [
      author.toBuffer(),
      anchor.utils.bytes.utf8.encode(BET_SEED),
      new anchor.BN(betNumber).toArrayLike(Buffer),
      colorBuffer,
    ],
    programID
  );
}

async function airdrop(
  connection: any,
  address: any,
  amount = 100 * LAMPORTS_PER_SOL
) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}
async function checkBet(
  program: anchor.Program<RouletteDapp>,
  bet: anchor.web3.PublicKey,
  betAuthority: anchor.web3.PublicKey,
  betNumber: number,
  isBlack: boolean,
  bump: number
) {
  let betData = await program.account.bet.fetch(bet);

  if (betAuthority) {
    assert.strictEqual(
      betData.betAuthority.toString(),
      betAuthority.toString()
    );
  }

  if (betNumber) {
    assert.strictEqual(betData.betNumber, betNumber);
  }

  if (isBlack) {
    assert.strictEqual(betData.isBlack, isBlack);
  }

  if (bump) {
    assert.strictEqual(betData.bump, bump);
  }
}

async function checkRandom(
  program: anchor.Program<RouletteDapp>,
  bet: anchor.web3.PublicKey,
  betNumber: number,
  isBlack: boolean
) {
  let betData = await program.account.bet.fetch(bet);

  if (betNumber == betData.randomNumber) {
    assert.strictEqual(true, betData.betWon);
  }

  if (betNumber % 2 == 0 && betData.randomNumber % 2 == 0) {
    assert.strictEqual(true, betData.betWon);
  }
}
