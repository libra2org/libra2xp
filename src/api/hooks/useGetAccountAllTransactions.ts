import {gql, useQuery as useGraphqlQuery} from "@apollo/client";
import {useGetIsGraphqlClientSupported} from "./useGraphqlClient";
import {tryStandardizeAddress} from "../../utils";
import {
  createIndexerUnavailableError,
  isIndexerUnavailableMessage,
  ResponseError,
  ResponseErrorType,
} from "../client";

const ACCOUNT_TRANSACTIONS_COUNT_QUERY = gql`
  query AccountTransactionsCount($address: String) {
    move_resources_aggregate(
      where: {address: {_eq: $address}}
      distinct_on: transaction_version
    ) {
      aggregate {
        count
      }
    }
  }
`;

export function useGetAccountAllTransactionCount(address: string): {
  count?: number;
  error?: ResponseError;
} {
  // whenever talking to the indexer, the address needs to fill in leading 0s
  // for example: 0x123 => 0x000...000123  (61 0s before 123)
  const addr64Hash = tryStandardizeAddress(address);
  const isGraphqlClientSupported = useGetIsGraphqlClientSupported();

  const {loading, error, data} = useGraphqlQuery(
    ACCOUNT_TRANSACTIONS_COUNT_QUERY,
    {variables: {address: addr64Hash}, skip: !isGraphqlClientSupported},
  );

  if (!isGraphqlClientSupported) {
    return {error: createIndexerUnavailableError()};
  }

  if (!addr64Hash || loading) {
    return {};
  }

  if (error) {
    const message = error.message;
    return isIndexerUnavailableMessage(message)
      ? {error: createIndexerUnavailableError()}
      : {error: {type: ResponseErrorType.UNHANDLED, message}};
  }

  if (!data) {
    return {};
  }

  return {count: data.move_resources_aggregate?.aggregate?.count};
}

const ACCOUNT_TRANSACTIONS_QUERY = gql`
  query AccountTransactionsData($address: String, $limit: Int, $offset: Int) {
    account_transactions(
      where: {account_address: {_eq: $address}}
      order_by: {transaction_version: desc}
      limit: $limit
      offset: $offset
    ) {
      transaction_version
    }
  }
`;

export function useGetAccountAllTransactionVersions(
  address: string,
  limit: number,
  offset?: number,
): {versions: number[]; error?: ResponseError} {
  const addr64Hash = tryStandardizeAddress(address);
  const isGraphqlClientSupported = useGetIsGraphqlClientSupported();

  const {loading, error, data} = useGraphqlQuery(ACCOUNT_TRANSACTIONS_QUERY, {
    variables: {address: addr64Hash, limit: limit, offset: offset},
    skip: !isGraphqlClientSupported,
  });

  if (!isGraphqlClientSupported) {
    return {versions: [], error: createIndexerUnavailableError()};
  }

  if (!addr64Hash || loading) {
    return {versions: []};
  }

  if (error) {
    const message = error.message;
    return isIndexerUnavailableMessage(message)
      ? {versions: [], error: createIndexerUnavailableError()}
      : {versions: [], error: {type: ResponseErrorType.UNHANDLED, message}};
  }

  if (!data) {
    return {versions: []};
  }

  return {
    versions: data.account_transactions.map(
      (resource: {transaction_version: number}) => {
        return resource.transaction_version;
      },
    ),
  };
}
