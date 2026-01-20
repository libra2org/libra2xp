import React, {useEffect, useState} from "react";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import {getApiKey, NetworkName} from "../../constants";
import {useGlobalState} from "../../global-config/GlobalConfig";

function getIsGraphqlClientSupportedFor(networkName: NetworkName): boolean {
  const graphqlUri = getGraphqlURI(networkName);
  return typeof graphqlUri === "string" && graphqlUri.length > 0;
}

function getIndexerBaseUrl(networkName: NetworkName): string | undefined {
  const defaultIndexer =
    import.meta.env.VITE_INDEXER_URL ??
    import.meta.env.INDEXER_URL ??
    import.meta.env.VITE_LIBRA2_INDEXER_HTTP ??
    "https://indexer.libra2.org";

  if (networkName === "local" || networkName === "localnet") {
    return (
      import.meta.env.VITE_LIBRA2_LOCAL_INDEXER_HTTP ??
      import.meta.env.LIBRA2_LOCAL_INDEXER_HTTP ??
      defaultIndexer
    );
  }

  return defaultIndexer;
}

export function getGraphqlURI(networkName: NetworkName): string | undefined {
  const baseUrl = getIndexerBaseUrl(networkName);
  if (!baseUrl) return undefined;

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  if (
    normalizedBase.endsWith("/v1/graphql") ||
    normalizedBase.endsWith("/graphql")
  ) {
    return normalizedBase;
  }

  return `${normalizedBase}/v1/graphql`;
}

function getGraphqlClient(
  networkName: NetworkName,
): ApolloClient<NormalizedCacheObject> {
  const apiKey = getApiKey(networkName);
  // Middleware to attach the authorization token.
  const authMiddleware = new ApolloLink((operation, forward) => {
    operation.setContext(({headers = {}}) => ({
      headers: {
        ...headers,
        ...(apiKey ? {authorization: `Bearer ${apiKey}`} : {}),
      },
    }));
    return forward(operation);
  });

  const httpLink = new HttpLink({
    uri: getGraphqlURI(networkName),
  });

  return new ApolloClient({
    link: ApolloLink.from([authMiddleware, httpLink]),
    cache: new InMemoryCache(),
  });
}

export function useGetGraphqlClient() {
  const [state] = useGlobalState();
  const [graphqlClient, setGraphqlClient] = useState<
    ApolloClient<NormalizedCacheObject>
  >(getGraphqlClient(state.network_name));

  useEffect(() => {
    setGraphqlClient(getGraphqlClient(state.network_name));
  }, [state.network_name]);

  return graphqlClient;
}

type GraphqlClientProviderProps = {
  children: React.ReactNode;
};

export function GraphqlClientProvider({children}: GraphqlClientProviderProps) {
  const graphqlClient = useGetGraphqlClient();

  return <ApolloProvider client={graphqlClient}>{children}</ApolloProvider>;
}

export function useGetIsGraphqlClientSupported(): boolean {
  const [state] = useGlobalState();
  return getIsGraphqlClientSupportedFor(state.network_name);
}
