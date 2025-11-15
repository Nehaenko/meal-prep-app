import { createRoot } from 'react-dom/client'
import client from "./lib/apolloClient";
import { ApolloProvider } from "@apollo/client/react";
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
