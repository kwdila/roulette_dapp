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
  const betType_bob1 = { straightup: {} };

  const betNumber_bob2 = 37;

  const betNumber_bob3 = 0;

  describe("Initialize Bet", async () => {
    it("Cannot initialize bet with bet numbet larger than 36", async () => {
      await airdrop(provider.connection, bob.publicKey);
      const [bet_pkey, bet_bump] = getBetAddress(
        bob.publicKey,
        betType_bob1,
        program.programId
      );
      let should_fail = "This Should Fail";
      try {
        const [bet_pkey, bet_bump] = getBetAddress(
          bob.publicKey,
          betType_bob1,
          program.programId
        );

        await program.methods
          .initialize(betType_bob1, betNumber_bob2)
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
    it("Bet initialized!", async () => {
      await airdrop(provider.connection, bob.publicKey);
      const [bet_pkey, bet_bump] = getBetAddress(
        bob.publicKey,
        betType_bob1,
        program.programId
      );

      await program.methods
        .initialize(betType_bob1, betNumber_bob1)
        .accounts({
          bet: bet_pkey,
          betAuthority: bob.publicKey,
        })
        .signers([bob])
        .rpc({ skipPreflight: true });

      await checkBet(
        program,
        bet_pkey,
        bob.publicKey,
        betNumber_bob1,
        bet_bump
      );
    });
  });
  describe("Finalize Bet", async () => {
    it("Bet Finalized", async () => {
      await airdrop(provider.connection, bob.publicKey);
      const [bet_pkey, bet_bump] = getBetAddress(
        bob.publicKey,
        betType_bob1,
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
        bet_bump
      );
      await checkRandom(program, bet_pkey, betType_bob1, betNumber_bob1);
    });
  });
});

function getBetAddress(
  author: PublicKey,
  betType: { [key: string]: {} },
  programID: PublicKey
) {
  assert.strictEqual(
    Object.keys(betType)[0],
    "straightup",
    "Unexpected BetType"
  );
  return PublicKey.findProgramAddressSync(
    [
      author.toBuffer(),
      anchor.utils.bytes.utf8.encode(BET_SEED),
      new anchor.BN(0).toArrayLike(Buffer), //0 for straightup bettype
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

  if (bump) {
    assert.strictEqual(betData.bump, bump);
  }
}

async function checkRandom(
  program: anchor.Program<RouletteDapp>,
  bet: anchor.web3.PublicKey,
  betType: { [key: string]: {} },
  betNumber?: number
) {
  let betData = await program.account.bet.fetch(bet);
  let betTypeString = Object.keys(betType)[0];

  if (betTypeString == "straightup" && betData.randomNumber == betNumber) {
    assert.strictEqual(
      true,
      betData.betWon,
      "Bet should be won but is was not"
    );
  }

  if (betTypeString == "black" && betData.randomColor[0] == "black") {
    assert.strictEqual(
      true,
      betData.betWon,
      "Bet should be won but is was not"
    );
  }
}
