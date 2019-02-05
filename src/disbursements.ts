import { AxiosInstance } from "axios";
import uuid from "uuid/v4";

import {
  AccountBalance,
  PartyIdType,
  TransactionFailure,
  TransactionStatus
} from "./types";
import { validateTransfer } from "./validate";

export interface PayoutRequest {
  /**
   * Amount that will be debited from the payer account.
   */
  amount: string;

  /**
   * ISO4217 Currency
   */
  currency: string;

  /**
   * External id is used as a reference to the transaction.
   * External id is used for reconciliation.
   * The external id will be included in transaction history report.
   * External id is not required to be unique.
   */
  externalId?: string;

  /**
   * Party identifies a account holder in the wallet platform.
   * Party consists of two parameters, type and partyId.
   * Each type have its own validation of the partyId
   *   MSISDN - Mobile Number validated according to ITU-T E.164. Validated with IsMSISDN
   *   EMAIL - Validated to be a valid e-mail format. Validated with IsEmail
   *   PARTY_CODE - UUID of the party. Validated with IsUuid
   */
  payee: {
    partyIdType: PartyIdType;
    partyId: string;
  };

  /**
   * Message that will be written in the payer transaction history message field.
   */
  payerMessage?: string;
  /**
   * Message that will be written in the payee transaction history note field.
   */
  payeeNote?: string;
  /**
   * URL to the server where the callback should be sent.
   */
  callbackUrl?: string;
}

export interface Transfer {
  /**
   * Amount that will be debited from the payer account.
   */
  amount: string;

  /**
   * ISO4217 Currency
   */
  currency: string;

  /**
   * Financial transactionIdd from mobile money manager.
   * Used to connect to the specific financial transaction made in the account
   */
  financialTransactionId: string;

  /**
   * External id is used as a reference to the transaction.
   * External id is used for reconciliation.
   * The external id will be included in transaction history report.
   * External id is not required to be unique.
   */
  externalId: string;

  /**
   * Party identifies a account holder in the wallet platform.
   * Party consists of two parameters, type and partyId.
   * Each type have its own validation of the partyId
   *   MSISDN - Mobile Number validated according to ITU-T E.164. Validated with IsMSISDN
   *   EMAIL - Validated to be a valid e-mail format. Validated with IsEmail
   *   PARTY_CODE - UUID of the party. Validated with IsUuid
   */
  payee: {
    partyIdType: "MSISDN";
    partyId: string;
  };
  status: TransactionStatus;
  reason?: TransactionFailure;
}

export default class Disbursements {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Transfer operation is used to transfer an amount from the owner’s
   * account to a payee account.
   * Status of the transaction can be validated by using the
   *
   * @param paymentRequest
   */
  public transfer({
    callbackUrl,
    ...payoutRequest
  }: PayoutRequest): Promise<string> {
    return validateTransfer(payoutRequest).then(() => {
      const referenceId: string = uuid();
      return this.client
        .post<void>("/disbursement/v1_0/transfer", payoutRequest, {
          headers: {
            "X-Reference-Id": referenceId,
            ...(callbackUrl ? { "X-Callback-Url": callbackUrl } : {})
          }
        })
        .then(response => console.log(response.config))
        .then(() => referenceId);
    });
  }

  /**
   * This method is used to get the Transaction object.
   *
   * @param referenceId the value returned from `transfer`
   */
  public getTransaction(referenceId: string): Promise<Transfer> {
    return this.client
      .get<Transfer>(`/disbursement/v1_0/transfer/${referenceId}`)
      .then(response => response.data);
  }

  /**
   * Get the balance of the account.
   */
  public getBalance(): Promise<AccountBalance> {
    return this.client
      .get<AccountBalance>("/disbursement/v1_0/account/balance")
      .then(response => response.data);
  }

  /**
   * This method is used to check if an account holder is registered and active in the system.
   *
   * @param id Specifies the type of the party ID. Allowed values [msisdn, email, party_code].
   *   accountHolderId should explicitly be in small letters.
   *
   * @param type The party number. Validated according to the party ID type (case Sensitive).
   *   msisdn - Mobile Number validated according to ITU-T E.164. Validated with IsMSISDN
   *   email - Validated to be a valid e-mail format. Validated with IsEmail
   *   party_code - UUID of the party. Validated with IsUuid
   */
  public isPayerActive(
    id: string,
    type: PartyIdType = PartyIdType.MSISDN
  ): Promise<string> {
    return this.client
      .get<string>(`/disbursement/v1_0/accountholder/${type}/${id}/active`)
      .then(response => response.data);
  }
}
