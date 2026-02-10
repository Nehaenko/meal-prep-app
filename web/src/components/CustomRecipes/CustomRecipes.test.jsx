import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CustomRecipesPage from "./CustomRecipesPage";

const createCustomRecipeMock = vi.fn();
const deleteCustomRecipeMock = vi.fn();
const addToPlannerMock = vi.fn();
const removeFromPlannerMock = vi.fn();
const createShoppingListMock = vi.fn();
const deleteShoppingListMock = vi.fn();
let customRecipesState = [];
let queryMock;

vi.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({
    query: (...args) => queryMock(...args),
  }),
}));

vi.mock("../../state/CustomRecipesContext", () => ({
  useCustomRecipes: () => customRecipesState,
}));

vi.mock("../../state/PlannerContext", () => ({
  usePlanner: () => ({
    plannerItems: [],
    loading: false,
    addToPlanner: addToPlannerMock,
    removeFromPlanner: removeFromPlannerMock,
  }),
}));

vi.mock("../../state/ShoppingListContext", () => ({
  useShoppingLists: () => ({
    shoppingLists: [],
    loading: false,
    createShoppingList: createShoppingListMock,
    deleteShoppingList: deleteShoppingListMock,
  }),
}));

vi.mock("../../state/LoadingContext", () => ({
  useLoading: () => ({ withLoading: (promise) => promise }),
}));

describe("Custom Recipes Page", () => {
  beforeEach(() => {
    createCustomRecipeMock.mockReset();
    deleteCustomRecipeMock.mockReset();
    addToPlannerMock.mockReset();
    removeFromPlannerMock.mockReset();
    createShoppingListMock.mockReset();
    deleteShoppingListMock.mockReset();
    queryMock = vi.fn();
    customRecipesState = {
      customRecipes: [],
      loading: false,
      saving: false,
      createCustomRecipe: createCustomRecipeMock,
      deleteCustomRecipe: deleteCustomRecipeMock,
    };
  });

  it("renders empty custom recipes page", () => {
    render(
      <MemoryRouter initialEntries={["/custom-recipes"]}>
        <CustomRecipesPage />
      </MemoryRouter>,
    );

    const emptyStateText = screen.getByTestId("empty-custom-recipes");
    expect(emptyStateText).toHaveTextContent(
      "No custom recipes yet. Add your first one above.",
    );
  });

  it("submits a new custom recipe from the form", async () => {
    const user = userEvent.setup();
    customRecipesState.customRecipes = [
      {
        id: "custom-1",
        title: "Existing Recipe",
        ingredients: ["salt"],
        steps: ["boil"],
      },
    ];
    createCustomRecipeMock.mockResolvedValue({
      id: "custom-2",
      title: "New Recipe",
    });

    render(
      <MemoryRouter initialEntries={["/custom-recipes"]}>
        <CustomRecipesPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByPlaceholderText(/e.g. sunday roast chicken/i),
      "New Recipe",
    );
    await user.type(
      screen.getByPlaceholderText(/ingredient name/i),
      "Tomato",
    );
    await user.type(screen.getByPlaceholderText(/0/i), "2");
    await user.type(screen.getByPlaceholderText(/e.g. g/i), "pcs");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    await user.type(
      screen.getByPlaceholderText(/one step per line/i),
      "Chop tomatoes\nMix with salt",
    );

    await user.click(screen.getByRole("button", { name: /save recipe/i }));

    await waitFor(() =>
      expect(createCustomRecipeMock).toHaveBeenCalledWith({
        title: "New Recipe",
        image: null,
        ingredients: ["2 pcs Tomato"],
        steps: ["Chop tomatoes", "Mix with salt"],
      }),
    );
    expect(screen.queryByText(/add a recipe/i)).not.toBeInTheDocument();
  });

  it("resets the form fields", async () => {
    const user = userEvent.setup();
    customRecipesState.customRecipes = [
      { id: "custom-1", title: "Existing Recipe", ingredients: [], steps: [] },
    ];

    render(
      <MemoryRouter initialEntries={["/custom-recipes"]}>
        <CustomRecipesPage />
      </MemoryRouter>,
    );

    const titleInput = screen.getByPlaceholderText(
      /e.g. sunday roast chicken/i,
    );
    await user.type(titleInput, "Reset Me");
    await user.type(
      screen.getByPlaceholderText(/ingredient name/i),
      "Onion",
    );
    await user.click(screen.getByRole("button", { name: /^add$/i }));
    await user.type(
      screen.getByPlaceholderText(/one step per line/i),
      "Slice onion",
    );

    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(titleInput).toHaveValue("");
    expect(
      screen.getByPlaceholderText(/one step per line/i),
    ).toHaveValue("");
    expect(screen.queryByText(/onion/i)).not.toBeInTheDocument();
  });

  it("shows delete, planner, and shopping list actions", async () => {
    const user = userEvent.setup();
    customRecipesState.customRecipes = [
      {
        id: "custom-1",
        title: "Recipe One",
        ingredients: ["salt"],
        steps: ["mix"],
      },
    ];

    render(
      <MemoryRouter initialEntries={["/custom-recipes"]}>
        <CustomRecipesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add to planner/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add to shopping list/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(deleteCustomRecipeMock).toHaveBeenCalledWith("custom-1");
  });

  it("toggles the form visibility with the hide form button", async () => {
    const user = userEvent.setup();
    customRecipesState.customRecipes = [
      { id: "custom-1", title: "Existing Recipe", ingredients: [], steps: [] },
    ];

    render(
      <MemoryRouter initialEntries={["/custom-recipes"]}>
        <CustomRecipesPage />
      </MemoryRouter>,
    );

    const toggleButton = screen.getByRole("button", { name: /hide form/i });
    await user.click(toggleButton);

    expect(screen.queryByText(/add a recipe/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add recipe/i }),
    ).toBeInTheDocument();
  });
});
