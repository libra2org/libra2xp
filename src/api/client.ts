export enum ResponseErrorType {
  NOT_FOUND = "Not Found",
  INVALID_INPUT = "Invalid Input",
  UNHANDLED = "Unhandled",
  TOO_MANY_REQUESTS = "Too Many Requests",
  INDEXER_UNAVAILABLE = "Indexer Unavailable",
}

export type ResponseError = {type: ResponseErrorType; message?: string};

export async function withResponseError<T>(promise: Promise<T>): Promise<T> {
  return await promise.catch((error) => {
    console.error("ERROR!", error, typeof error);
    const message = typeof error === "string" ? error : error?.message;
    if (typeof error == "object" && "status" in error) {
      // This is a request!
      error = error as Response;
      if (error.status === 404) {
        throw {type: ResponseErrorType.NOT_FOUND};
      }
    }
    if (message?.toLowerCase().includes("indexer reader doesn't exist")) {
      throw {
        type: ResponseErrorType.INDEXER_UNAVAILABLE,
        message:
          "Indexer backend is unavailable. Please ensure the indexer service is running for this network or try again later.",
      };
    }

    if (
      message
        ?.toLowerCase()
        .includes(ResponseErrorType.TOO_MANY_REQUESTS.toLowerCase())
    ) {
      throw {
        type: ResponseErrorType.TOO_MANY_REQUESTS,
      };
    }

    throw {
      type: ResponseErrorType.UNHANDLED,
      message: error.toString(),
    };
  });
}
