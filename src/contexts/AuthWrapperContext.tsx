import {
  createContext,
  ReactNode,
  useMemo,
  useEffect,
  useRef,
  useState,
} from "react";
import { Client, subscriptionExchange, Provider, fetchExchange } from "urql";
import { createClient as createWSClient } from "graphql-ws";
import { useAuth } from "react-oidc-context";
import Config from "../config";
import { authExchange } from "@urql/exchange-auth";

type AuthWrapperContextType = {};

const AuthWrapperContext = createContext<AuthWrapperContextType>({});

type AuthWrapperProviderProps = {
  children: ReactNode;
};

const AuthWrapperProvider = ({ children }: AuthWrapperProviderProps) => {
  const auth = useAuth();
  const [userLoaded, setUserLoaded] = useState<boolean>(false);
  const accessToken = useRef<string | null>(null);

  // HACK. This is done because we do not want to create a new client,
  // because if we do make a new client, the whole website refreshes everytime
  // a new user is being loaded.
  useEffect(() => {
    if (auth.user) {
      accessToken.current = auth.user.access_token;
      setUserLoaded(true);
    }
  }, [auth.user]);

  const client = useMemo(() => {
    if (!userLoaded) {
      return null;
    }

    if (!accessToken.current) {
      return null;
    }

    const subscriptionClient = createWSClient({
      url: `${Config.API_GATEWAY_WS_URI}/graphql`,
      lazy: false,
      // Keep reconnecting for as long as the page is open.
      retryAttempts: Infinity,
      shouldRetry: () => true,
      connectionParams: async () => {
        return {
          Authorization: `Bearer ${accessToken.current}`,
        };
      },
    });

    const client = new Client({
      url: `${Config.API_GATEWAY_HTTP_URI}/graphql`,
      requestPolicy: "network-only",
      // urql defaults to GET for queries, which the API rejects as CSRF protection.
      preferGetMethod: false,
      exchanges: [
        authExchange(async (utils) => {
          return {
            addAuthToOperation: (operation) => {
              if (!accessToken.current) {
                return operation;
              }

              return utils.appendHeaders(operation, {
                Authorization: `Bearer ${accessToken.current}`,
              });
            },
            didAuthError: (error) => {
              return error.graphQLErrors.some(
                (e) => e.extensions?.code === "ACCESS_DENIED",
              );
            },
            refreshAuth: async () => {
              // The token is renewed by react-oidc-context and kept up to date
              // in accessToken, so the retried operation picks up the new token.
            },
          };
        }),
        fetchExchange,
        subscriptionExchange({
          forwardSubscription: (request) => {
            const input = { ...request, query: request.query || "" };
            return {
              subscribe: (sink) => {
                const unsubscribe = subscriptionClient.subscribe(input, sink);
                return { unsubscribe };
              },
            };
          },
        }),
      ],
    });

    return client;
  }, [userLoaded]);

  if (auth.isLoading) {
    return <></>;
  }

  if (auth.error) {
    return <div>Failed to authorize the user: {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated) {
    auth.signinRedirect();
  }

  if (client === null) {
    return <></>;
  }

  return (
    <AuthWrapperContext.Provider value={{}}>
      <Provider value={client}>{children}</Provider>
    </AuthWrapperContext.Provider>
  );
};

export { AuthWrapperContext, AuthWrapperProvider };
