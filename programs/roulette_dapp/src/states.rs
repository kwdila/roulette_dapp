use anchor_lang::prelude::*;
use num_derive::*;

pub const BET_LEN: usize = 32 + 2 + 1 + 1 + 2 + 2 + 1 + 1;

#[account]
pub struct Bet {
    pub bet_authority: Pubkey,

    pub bet_number: Option<u8>,

    pub bump: u8,

    pub bet_won: bool,

    pub random_number: Option<u8>,

    pub random_color: Option<Color>,

    pub bet_type: BetType,

    pub is_initialized: bool,
}

#[derive(PartialEq, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum Color {
    Red,
    Black,
    Green,
}

#[derive(
    PartialEq, Clone, AnchorSerialize, AnchorDeserialize, Copy, Eq, ToPrimitive, FromPrimitive,
)]
pub enum BetType {
    Straightup,
    High,
    Low,
    Red,
    Black,
    Odd,
    Even,
}
