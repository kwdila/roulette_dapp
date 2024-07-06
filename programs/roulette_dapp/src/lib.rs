use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod states;

pub use constants::*;
pub use errors::*;
pub use instructions::*;
pub use states::*;

declare_id!("A1xnrB222HUHzpmMC8q7CrKZST3tDtJtEm14u8mhaGwq");

#[program]
pub mod roulette_dapp {
    use super::*;

    pub fn initialize(
        ctx: Context<InitializeBet>,
        bet_type: BetType,
        bet_number: Option<u8>,
    ) -> Result<()> {
        _initialize_bet(ctx, bet_type, bet_number)
    }

    pub fn finalize(ctx: Context<FinalizeBet>) -> Result<()> {
        _finalize_bet(ctx)
    }
}
