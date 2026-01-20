import {getApiKey, NetworkName} from "../constants";
import {
  createIndexerUnavailableError,
  isIndexerUnavailableMessage,
  ResponseErrorType,
} from "./client";
import {getGraphqlURI} from "./hooks/useGraphqlClient";

type GraphqlError = {
  message?: string;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: GraphqlError[];
};

function buildIndexerUnavailableError(message?: string) {
  if (isIndexerUnavailableMessage(message)) {
    return createIndexerUnavailableError();
  }
  return {
    type: ResponseErrorType.UNHANDLED,
    message,
  };
}

export async function fetchIndexerGraphql<T>(
  networkName: NetworkName,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const graphqlUrl = getGraphqlURI(networkName);
  if (!graphqlUrl) {
    throw createIndexerUnavailableError();
  }

  const apiKey = getApiKey(networkName);
  let response: Response;
  try {
    response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? {authorization: `Bearer ${apiKey}`} : {}),
      },
      body: JSON.stringify({query, variables}),
    });
  } catch {
    throw createIndexerUnavailableError();
  }

  const payload = (await response.json()) as GraphqlResponse<T>;
  if (!response.ok) {
    const message =
      payload?.errors?.map((entry) => entry.message).join(" ") ??
      response.statusText;
    throw buildIndexerUnavailableError(message);
  }

  if (payload.errors?.length) {
    const message = payload.errors.map((entry) => entry.message).join(" ");
    throw buildIndexerUnavailableError(message);
  }

  if (!payload.data) {
    throw buildIndexerUnavailableError("Indexer response missing data.");
  }

  return payload.data;
}
