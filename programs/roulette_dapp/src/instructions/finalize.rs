use anchor_lang::prelude::*;

use crate::constants::{self, BET_SEED};
use crate::states::{Bet, Color};
use crate::BetError;

pub fn _finalize_bet(ctx: Context<FinalizeBet>) -> Result<()> {
    let clock = Clock::get()?;
    let bet = &mut ctx.accounts.bet;

    require!(
        ctx.accounts.bet_authority.key() == bet.bet_authority.key(),
        BetError::UnauthorizedSigner,
    );

    let mut bet_won = false;
    let random_number = xorshift64(clock.slot) % (constants::MAX_NUMBER + 1);

    bet.random_number = random_number;

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

    if bet.is_even == (random_number % 2 == 0) {
        bet_won = true
    }

    if bet.is_black == (random_color.unwrap() == Color::Black) {
        bet_won = true
    }

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
            &[bet.bet_number as u8],
            &[bet.is_black as u8],
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
