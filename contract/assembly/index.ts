import { Context, logging, storage, RNG, ContractPromiseBatch, PersistentMap, u128 } from 'near-sdk-as'

import { AccountId, ONE_NEAR, asNEAR, toYocto, Amount } from "../utils";

@nearBindgen
export class Lottery {
  private chance: f64 = 0.5;
  private fee: f64 = 0.035;
  private feeWallet: string = "fees.woothugg.near";
  private teamWallet: string = "team.woothugg.near";

  explain(): string {
    return "Players have a " + (this.chance * 100).toString() + "% chance of winning.";
  }

  @mutateState()
  play(): bool {
    logging.log("Received " + Context.attachedDeposit.toString());

    if (Context.attachedDeposit < (toYocto(1 +  this.fee))) {
      logging.log("You need to deposit at least 1 NEAR + 0.03 NEAR fee to play.");
      return false;
    }

    let amount: Amount = u128.div(u128.mul(Context.attachedDeposit, u128.from(1000)), u128.from(1035))

    if (amount > toYocto(2)) {
      amount = toYocto(2);
    }
    logging.log("Wagering : " + amount.toString());

    const rng = new RNG<u32>(1, u32.MAX_VALUE);
    const roll = rng.next();
    logging.log("roll: " + roll.toString());
    const won = roll <= <u32>(<f64>u32.MAX_VALUE * this.chance);

    const signer = Context.sender;

    const to_fees = ContractPromiseBatch.create(this.feeWallet);
    to_fees.transfer(u128.div(u128.mul(amount, u128.from(3)), u128.from(100)));

    const to_team = ContractPromiseBatch.create(this.teamWallet);
    to_team.transfer(u128.div(amount, u128.from(400)));
    if (won) {
      logging.log("You won!");
    
      const to_winner = ContractPromiseBatch.create(signer);
      to_winner.transfer(u128.mul(amount, u128.from(2)));

      return true;
    }
    logging.log("You lost!");
    return false;

  }

  @mutateState()
  configure(chance: f64): void {
    assert(Context.sender == "woothugg.near", "Chance must be within range (0..1]");
    assert(chance >= 0.000000001 && chance <= 1, "Chance must be within range (0..1]");
    this.chance = chance;
    logging.log(this.explain());
  }

}