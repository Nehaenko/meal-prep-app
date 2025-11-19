import { createRoot } from 'react-dom/client'
import client from "./lib/apolloClient";
import { ApolloProvider } from "@apollo/client/react";
import { AuthProvider } from "./state/AuthContext";
import { LoadingProvider } from './state/LoadingContext.jsx';
import { BrowserRouter } from "react-router";
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <AuthProvider>
      <LoadingProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LoadingProvider>
    </AuthProvider>
  </ApolloProvider>
);
