import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useApolloClient } from "@apollo/client/react";
import { Me, LogOut, Login, SignUp } from "../graphql/index";

const AuthContext = createContext(null);

function extractMessage(errOrArr) {
  const error = Array.isArray(errOrArr) ? errOrArr[0] : errOrArr;
  const graphQLErrors = error?.graphQLErrors?.[0]?.message;
  const networkError = error?.networkError?.message;
  const message = error?.message;
  return graphQLErrors || networkError || message || "Something went wrong";
}

export function AuthProvider({ children }) {
  const client = useApolloClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await client.query({
        query: Me,
        fetchPolicy: "network-only",
      });
      setUser(data.me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logOut = async () => {
    setLoading(true);
    await client.mutate({
      mutation: LogOut,
    });
    setUser(null);
    await client.resetStore();
    setLoading(false);
  };

  const logIn = async (email, password) => {
    try {
      setLoading(true);
      const res = await client.mutate({
        mutation: Login,
        variables: { email, password },
        errorPolicy: "all",
      });

      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));

      await fetchCurrentUser();
    } catch (err) {
      setLoading(false);
      throw new Error(extractMessage(err));
    }
  };

  const signUp = async (email, password) => {
    try {
      setLoading(true);
      const res = await client.mutate({
        mutation: SignUp,
        variables: { email, password },
        errorPolicy: "all",
      });

      const errs = res.errors ?? res.error?.errors;
      if (errs?.length) throw new Error(extractMessage(errs));

      await fetchCurrentUser();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw new Error(extractMessage(err));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, logOut, logIn, signUp, fetchCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
