import React from "react";
import {
  INDEXER_UNAVAILABLE_MESSAGE,
  ResponseError,
  ResponseErrorType,
} from "../../api/client";
import {Alert} from "@mui/material";

type ErrorProps = {
  error: ResponseError;
  address?: string;
};

export default function Error({error, address}: ErrorProps) {
  switch (error.type) {
    case ResponseErrorType.NOT_FOUND:
      return (
        <Alert severity="error" sx={{overflowWrap: "break-word"}}>
          {error.message}
          Account not found. Please take a look at the Coins and Token tabs. The
          account has never submitted a transaction, but it may still hold
          assets.
        </Alert>
      );
    case ResponseErrorType.INVALID_INPUT:
      return (
        <Alert severity="error">
          ({error.type}): {error.message}
        </Alert>
      );
    case ResponseErrorType.INDEXER_UNAVAILABLE:
      return (
        <Alert severity="info" sx={{overflowWrap: "break-word"}}>
          {INDEXER_UNAVAILABLE_MESSAGE} Please check your INDEXER_URL
          configuration.
        </Alert>
      );
    case ResponseErrorType.UNHANDLED:
      if (address) {
        return (
          <Alert severity="error">
            Unknown error ({error.type}) fetching an Account with address{" "}
            {address}:
            <br />
            {error.message}
            <br />
            Try again later
          </Alert>
        );
      } else {
        return (
          <Alert severity="error">
            Too many requests. Please try again 5 minutes later.
          </Alert>
        );
      }
    case ResponseErrorType.TOO_MANY_REQUESTS:
      return (
        <Alert severity="error">
          Too many requests. Please try again 5 minutes later.
        </Alert>
      );
  }
}
