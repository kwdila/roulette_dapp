use anchor_lang::prelude::*;
use num_traits::*;

use crate::constants::{self, BET_SEED};
use crate::states::{Bet, Color};
use crate::{BetError, BetType::*};

pub fn _finalize_bet(ctx: Context<FinalizeBet>) -> Result<()> {
    let clock = Clock::get()?;
    let bet = &mut ctx.accounts.bet;

    require_keys_eq!(
        ctx.accounts.bet_authority.key(),
        bet.bet_authority.key(),
        BetError::UnauthorizedSigner
    );

    let random_number = xorshift64(clock.slot) % (constants::MAX_NUMBER + 1);

    bet.random_number = Some(random_number);

    msg!("Random number is: {}", random_number);

    let random_color: Result<Color> = match random_number {
        2 | 4 | 6 | 8 | 10 | 11 | 13 | 15 | 17 | 20 | 22 | 24 | 26 | 28 | 29 | 31 | 33 | 35 => {
            Ok(Color::Black)
        }
        1 | 3 | 5 | 7 | 9 | 12 | 14 | 16 | 18 | 19 | 21 | 23 | 25 | 27 | 30 | 32 | 34 | 36 => {
            Ok(Color::Red)
        }
        0 => Ok(Color::Green), // 0 is green
        _ => Err(BetError::RandomnessNotResolved.into()),
    };

    let bet_won = match bet.bet_type {
        Straightup => bet.bet_number.unwrap() == random_number,
        Odd => random_number % 2 == 1,
        Even => random_number % 2 == 0,
        Black => random_color.unwrap() == Color::Black,
        Red => random_color.unwrap() == Color::Red,
        Low => random_number < 19,
        High => random_number > 18,
    };

    bet.bet_won = bet_won;

    if bet_won {
        msg!("Bet won!");
    } else {
        msg!("Bet lost!");
    }

    Ok(())
}

#[derive(Accounts)]
pub struct FinalizeBet<'info> {
    #[account(
        mut,
        seeds = [
            bet_authority.key().as_ref(),
            BET_SEED.as_bytes(),
            &[bet.bet_type.to_u8().unwrap()]
        ],
        bump = bet.bump,
    )]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub bet_authority: Signer<'info>,
}

pub fn xorshift64(seed: u64) -> u8 {
    let mut x = seed;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    x as u8
}
