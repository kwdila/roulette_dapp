use anchor_lang::prelude::*;

#[error_code]
pub enum BetError {
    #[msg("Bet Number must be between 0 and 36")]
    InvalidBetNumber,
    #[msg("The caller does not have bet authority")]
    UnauthorizedSigner,
    #[msg("Could not get random number value")]
    RandomnessNotResolved,
    #[msg("StraightUp BetType Requires bet_number parameter")]
    MissingBetTypeParameter,
    #[msg("This bet is already Initialized")]
    AlreadyInitialized,
    #[msg("Not enough Sol balance to Initialize specified bet amount")]
    InsufficientFunds,
    #[msg("Bet Either Is not Initialized Or Finished")]
    BetNotInitialized,
}
