import { createRoot } from "react-dom/client";
import client from "./lib/apolloClient";
import { ApolloProvider } from "@apollo/client/react";
import { AuthProvider } from "./state/AuthContext";
import { LoadingProvider } from "./state/LoadingContext.jsx";
import { PlannerProvider } from "./state/PlannerContext.jsx";
import { FavouritesProvider } from "./state/FavouriesContext.jsx";
import { ShoppingListProvider } from "./state/ShoppingListContext.jsx";
import { PrepPlansProvider } from "./state/PrepPlansContext.jsx";
import { CustomRecipesProvider } from "./state/CustomRecipesContext.jsx";
import { BrowserRouter } from "react-router";
import "animate.css";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <AuthProvider>
      <PlannerProvider>
        <FavouritesProvider>
          <ShoppingListProvider>
            <PrepPlansProvider>
              <CustomRecipesProvider>
                <LoadingProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </LoadingProvider>
              </CustomRecipesProvider>
            </PrepPlansProvider>
          </ShoppingListProvider>
        </FavouritesProvider>
      </PlannerProvider>
    </AuthProvider>
  </ApolloProvider>
);
