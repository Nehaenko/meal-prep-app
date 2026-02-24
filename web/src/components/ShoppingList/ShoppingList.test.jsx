import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ShoppingListPage from "./ShoppingListPage";

const createShoppingListMock = vi.fn();
const updateShoppingListMock = vi.fn();
const clearShoppingListsMock = vi.fn();
let shoppingListState = [];
let queryMock;

vi.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({
    query: (...args) => queryMock(...args),
  }),
}));

vi.mock("../../state/ShoppingListContext", () => ({
  useShoppingLists: () => shoppingListState,
}));

vi.mock("../../state/LoadingContext", () => ({
  useLoading: () => ({ withLoading: (promise) => promise }),
}));

describe("Shopping List Page", () => {
  beforeEach(() => {
    createShoppingListMock.mockReset();
    updateShoppingListMock.mockReset();
    clearShoppingListsMock.mockReset();
    queryMock = vi.fn();

    shoppingListState = {
      shoppingLists: [],
      loading: false,
      saving: false,
      createShoppingList: createShoppingListMock,
      updateShoppingList: updateShoppingListMock,
      clearShoppingLists: clearShoppingListsMock,
    };
  });

  it("renders empty shopping list page", () => {
    render(
      <MemoryRouter initialEntries={["/shopping-list"]}>
        <ShoppingListPage />
      </MemoryRouter>,
    );

    const savedPlansText = screen.getByTestId("empty-shopping-list");
    expect(savedPlansText).toHaveTextContent("Your shopping list is empty.");
  });

  it("adds an item to the shopping list via manual entry", async () => {
    const user = userEvent.setup();
    createShoppingListMock.mockResolvedValue({
      id: "manual-1",
      recipeId: "manual",
      items: [],
    });
    updateShoppingListMock.mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={["/shopping-list"]}>
        <ShoppingListPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByPlaceholderText(/ingredient name/i),
      "Tomato",
    );
    await user.type(screen.getByPlaceholderText(/qty/i), "2");
    await user.type(screen.getByPlaceholderText(/unit/i), "pcs");

    await user.click(screen.getByRole("button", { name: /add item/i }));

    expect(createShoppingListMock).toHaveBeenCalledWith("manual");
    expect(updateShoppingListMock).toHaveBeenCalledWith("manual-1", [
      { name: "Tomato", quantity: 2, unit: "pcs", note: undefined },
    ]);
  });

  it("shows aggregated data from mock api shopping lists", async () => {
    shoppingListState.shoppingLists = [
      {
        id: "list-1",
        recipeId: "r1",
        title: "Pasta",
        items: [{ name: "tomato", quantity: 2, unit: "pcs" }],
      },
      {
        id: "list-2",
        recipeId: "r2",
        title: "Salad",
        items: [{ name: "tomato", quantity: 1, unit: "pcs" }],
      },
    ];

    render(
      <MemoryRouter initialEntries={["/shopping-list"]}>
        <ShoppingListPage />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("empty-shopping-list")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Tomato/i)).toBeInTheDocument(),
    );
    expect(screen.getByText("3 pcs")).toBeInTheDocument();
    expect(screen.getByText(/Needed for: Pasta, Salad/i)).toBeInTheDocument();
  });

  it("supports edit and remove actions for a recipe item", async () => {
    const user = userEvent.setup();
    shoppingListState.shoppingLists = [
      {
        id: "list-1",
        recipeId: "r1",
        title: "Pasta",
        items: [{ name: "tomato", quantity: 2, unit: "pcs" }],
      },
    ];
    updateShoppingListMock.mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={["/shopping-list"]}>
        <ShoppingListPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const nameInput = screen.getByDisplayValue(/tomato/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Cherry tomato");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(updateShoppingListMock).toHaveBeenCalledWith("list-1", [
      { name: "Cherry tomato", quantity: 2, unit: "pcs" },
    ]);

    const [firstItem] = screen.getAllByRole("listitem");
    await user.click(within(firstItem).getByRole("button", { name: /remove/i }));
    expect(updateShoppingListMock).toHaveBeenCalledWith("list-1", []);
  });
});
