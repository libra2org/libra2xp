export enum ResponseErrorType {
  NOT_FOUND = "Not Found",
  INVALID_INPUT = "Invalid Input",
  UNHANDLED = "Unhandled",
  TOO_MANY_REQUESTS = "Too Many Requests",
  INDEXER_UNAVAILABLE = "Indexer Unavailable",
}

export type ResponseError = {type: ResponseErrorType; message?: string};

export const INDEXER_UNAVAILABLE_MESSAGE =
  "This network’s RPC does not expose indexed account data. Please ensure the Indexer endpoint is configured (INDEXER_URL).";

const INDEXER_UNAVAILABLE_MATCHES = [
  "indexer reader doesn't exist",
  "db indexer reader is not available",
  "internal statekeys index is not enabled",
  "internal event index is not enabled",
  "interal transaction by account index is not enabled",
  "indexer reader",
];

export function isIndexerUnavailableMessage(message?: string): boolean {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return INDEXER_UNAVAILABLE_MATCHES.some((match) => lowered.includes(match));
}

export function createIndexerUnavailableError(): ResponseError {
  return {
    type: ResponseErrorType.INDEXER_UNAVAILABLE,
    message: INDEXER_UNAVAILABLE_MESSAGE,
  };
}

export async function withResponseError<T>(promise: Promise<T>): Promise<T> {
  return await promise.catch((error) => {
    console.error("ERROR!", error, typeof error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);

    if (typeof error == "object" && "status" in error) {
      // This is a request!
      error = error as Response;
      if (error.status === 404) {
        throw {type: ResponseErrorType.NOT_FOUND};
      }
    }
    if (isIndexerUnavailableMessage(errorMessage)) {
      throw createIndexerUnavailableError();
    }

    if (
      errorMessage
        .toLowerCase()
        .includes(ResponseErrorType.TOO_MANY_REQUESTS.toLowerCase())
    ) {
      throw {
        type: ResponseErrorType.TOO_MANY_REQUESTS,
      };
    }

    throw {
      type: ResponseErrorType.UNHANDLED,
      message: errorMessage,
    };
  });
}
