use anchor_lang::prelude::*;

pub const BET_LEN: usize = 32 + 1 + 1 + 1 + 1 + 32;

#[account]
pub struct Bet {
    pub bet_authority: Pubkey,
    pub bet_number: u8,
    pub is_black: bool,
    pub is_even: bool,
    pub bump: u8,
    pub bet_won: bool,
    pub random_number: u8,
}

#[derive(PartialEq)]
pub enum Color {
    Red,
    Black,
    Green,
}
