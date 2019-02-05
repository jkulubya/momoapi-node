import { AxiosInstance } from "axios";

import Collections from "./collections";
import Disbursements from "./disbursements";
import Users from "./users";

import {
  authorizeCollections,
  authorizeDisbursements,
  createTokenRefresher,
  TokenRefresher
} from "./auth";
import { createAuthClient, createClient } from "./client";
import {
  validateGlobalConfig,
  validateProductConfig,
  validateSubscriptionConfig
} from "./validate";

import {
  Config,
  Environment,
  GlobalConfig,
  ProductConfig,
  SubscriptionConfig
} from "./types";

type MomoClientCreator = (config?: GlobalConfig) => MomoClient;

interface MomoClient {
  Collections(productConfig: ProductConfig): Collections;
  Disbursements(productConfig: ProductConfig): Disbursements;
  Users(subscription: SubscriptionConfig): Users;
}

const defaultGlobalConfig: GlobalConfig = {
  baseUrl: "https://ericssonbasicapi2.azure-api.net",
  environment: Environment.SANDBOX
};

export = (globalConfig: GlobalConfig): MomoClient => {
  validateGlobalConfig(globalConfig);

  return {
    Collections(productConfig: ProductConfig): Collections {
      validateProductConfig(productConfig);

      const config: Config = {
        ...defaultGlobalConfig,
        ...globalConfig,
        ...productConfig
      };

      const client: AxiosInstance = createAuthClient(
        createTokenRefresher(authorizeCollections, config),
        createClient(config)
      );
      return new Collections(client);
    },

    Disbursements(productConfig: ProductConfig): Disbursements {
      const config: Config = {
        ...defaultGlobalConfig,
        ...globalConfig,
        ...productConfig
      };

      const client: AxiosInstance = createAuthClient(
        createTokenRefresher(authorizeDisbursements, config),
        createClient(config)
      );

      return new Disbursements(client);
    },

    Users(subscriptionConfig: SubscriptionConfig): Users {
      validateSubscriptionConfig(subscriptionConfig);

      const config: GlobalConfig & SubscriptionConfig = {
        ...defaultGlobalConfig,
        ...globalConfig,
        ...subscriptionConfig
      };

      const client: AxiosInstance = createClient(config);

      return new Users(client);
    }
  };
};
