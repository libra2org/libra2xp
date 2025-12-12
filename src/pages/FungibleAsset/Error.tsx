import React from "react";
import {ResponseError, ResponseErrorType} from "../../api/client";
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
          Fungible asset not found: {address}.
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
        <Alert severity="error" sx={{overflowWrap: "break-word"}}>
          Indexer service unavailable. Please ensure the indexer reader for this
          network is running and caught up, then try again.
          <br />
          {error.message}
        </Alert>
      );
    case ResponseErrorType.UNHANDLED:
      if (address) {
        return (
          <Alert severity="error">
            Unknown error ({error.type}) fetching a fungible asset {address}:
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
    case ResponseErrorType.INDEXER_UNAVAILABLE:
      return (
        <Alert severity="error">
          The indexer service for this network is currently unavailable. Please
          ensure it is running or try again later once it has caught up.
        </Alert>
      );
    case ResponseErrorType.TOO_MANY_REQUESTS:
      return (
        <Alert severity="error">
          Too many requests. Please try again 5 minutes later.
        </Alert>
      );
  }
}
