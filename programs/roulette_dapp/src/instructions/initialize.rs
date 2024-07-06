use anchor_lang::prelude::*;
use num_traits::*;

use crate::states::{Bet,BetType};
use crate::errors::BetError;
use crate::constants::BET_SEED;

pub fn _initialize_bet(ctx: Context<InitializeBet>, bet_type:BetType, bet_number: Option<u8>) -> Result<()> {
    let bet = &mut ctx.accounts.bet;

    require!(bet.is_initialized != true,BetError::AlreadyInitialized);

    match bet_number {
        Some(num) => require!(num < 37, BetError::InvalidBetNumber),
        None => require!(bet_type != BetType::Straightup, BetError::MissingBetTypeParameter),
    }
    bet.bet_type = bet_type;
    
    bet.bet_number = bet_number;

    bet.bet_authority = ctx.accounts.bet_authority.key();
    bet.bump = ctx.bumps.bet;
    bet.bet_won = false;
    bet.is_initialized = true;

    bet.random_number = None;
    bet.random_color = None;

    Ok(())
}

#[derive(Accounts)]
#[instruction(bet_type:BetType,bet_number:Option<u8>)]
pub struct InitializeBet<'info> {
    #[account(
        init,
        payer  = bet_authority,
        space = 8 + Bet::INIT_SPACE,
        seeds = [
            bet_authority.key().as_ref(),
            BET_SEED.as_bytes(),
            &[bet_type.to_u8().unwrap()]
        ],
        bump    
    )]
    pub bet: Account<'info,Bet>,
    #[account(mut)]
    pub bet_authority: Signer<'info>,
    pub system_program: Program<'info,System>,
}

