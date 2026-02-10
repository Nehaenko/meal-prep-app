if (!Array.prototype.findLastIndex) {
  Object.defineProperty(Array.prototype, "findLastIndex", {
    value(predicate, thisArg) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (predicate.call(thisArg, this[i], i, this)) return i;
      }
      return -1;
    },
  });
}

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AddToPlannerButton from "../ActionElements/AddToPlannerButton";
import Planner from "./Planner";

const addToPlannerMock = vi.fn();
const removeFromPlannerMock = vi.fn();
const clearPlanner = vi.fn();
const createShoppingListMock = vi.fn();
const fetchShoppingListsMock = vi.fn();
const setDraftPlanMock = vi.fn();
let plannerState;
let shoppingListState;
let prepPlanState;
let queryMock;
let mutateMock;
let navigateMock;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../graphql", () => ({
  Recipe: {},
  GeneratePrepPlan: {},
}));

vi.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({
    query: (...args) => queryMock(...args),
    mutate: (...args) => mutateMock(...args),
  }),
}));

vi.mock("../../state/LoadingContext", () => ({
  useLoading: () => ({
    withLoading: (promise) => promise,
  }),
}));

vi.mock("../../state/PlannerContext", () => ({
  usePlanner: () => plannerState,
}));

vi.mock("../../state/ShoppingListContext", () => ({
  useShoppingLists: () => shoppingListState,
}));

vi.mock("../../state/PrepPlansContext", () => ({
  usePrepPlans: () => prepPlanState,
}));

describe("Planner flows", () => {
  beforeEach(() => {
    addToPlannerMock.mockReset();
    addToPlannerMock.mockResolvedValue();
    removeFromPlannerMock.mockReset();
    removeFromPlannerMock.mockResolvedValue();
    clearPlanner.mockReset();
    clearPlanner.mockResolvedValue();
    createShoppingListMock.mockReset();
    createShoppingListMock.mockResolvedValue();
    fetchShoppingListsMock.mockReset();
    fetchShoppingListsMock.mockResolvedValue();
    setDraftPlanMock.mockReset();

    queryMock = vi.fn(({ variables }) =>
      Promise.resolve({
        data: {
          recipe: {
            id: variables.id,
            title: `Recipe ${variables.id}`,
            image: `/images/${variables.id}.jpg`,
            summary: `Summary for ${variables.id}`,
          },
        },
      })
    );

    mutateMock = vi.fn();
    navigateMock = vi.fn();

    plannerState = {
      plannerItems: [],
      loading: false,
      addToPlanner: addToPlannerMock,
      removeFromPlanner: removeFromPlannerMock,
      clearPlanner: clearPlanner,
    };

    shoppingListState = {
      shoppingLists: [],
      createShoppingList: createShoppingListMock,
      fetchShoppingLists: fetchShoppingListsMock,
    };

    prepPlanState = {
      setDraftPlan: setDraftPlanMock,
    };
  });

  it("adds recipe to planner when not already present", async () => {
    const user = userEvent.setup();
    const recipe = { id: "abc123", title: "Test Recipe" };

    render(<AddToPlannerButton recipe={recipe} />);

    const button = screen.getByRole("button", { name: /add to planner/i });
    await user.click(button);

    expect(addToPlannerMock).toHaveBeenCalledWith([
      { recipeId: "abc123", servings: 1 },
    ]);
    await waitFor(() =>
      expect(button).toHaveTextContent(/remove from planner/i)
    );
  });

  it("removes recipe from planner when it is already added", async () => {
    plannerState.plannerItems = [
      { id: "plan-1", recipeId: "abc123", servings: 2 },
    ];
    const user = userEvent.setup();
    const recipe = { id: "abc123", title: "Test Recipe" };

    render(<AddToPlannerButton recipe={recipe} />);

    const button = screen.getByRole("button", { name: /remove from planner/i });
    await user.click(button);

    expect(removeFromPlannerMock).toHaveBeenCalledWith("abc123");
    await waitFor(() => expect(button).toHaveTextContent(/add to planner/i));
  });

  it("shows planner items with fetched recipe details", async () => {
    plannerState.plannerItems = [
      { id: "plan-1", recipeId: "abc123", servings: 3, createdAt: "today" },
    ];

    render(
      <MemoryRouter initialEntries={["/planner"]}>
        <Planner />
      </MemoryRouter>
    );

    expect(queryMock).toHaveBeenCalledWith({
      query: {},
      variables: { id: "abc123" },
      fetchPolicy: "cache-first",
    });

    await waitFor(() =>
      expect(screen.getByText("Recipe abc123")).toBeInTheDocument()
    );
    expect(screen.getByText(/Servings: 3/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Recipe abc123" })).toHaveAttribute(
      "src",
      "/images/abc123.jpg"
    );
  });

  it("clear all planner items", async () => {
    const user = userEvent.setup();
    plannerState.plannerItems = [
      { id: "plan-1", recipeId: "abc123", servings: 2 },
    ];
    clearPlanner.mockImplementation(async () => {
      // simulate context update after clearing
      plannerState = { ...plannerState, plannerItems: [] };
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={["/planner"]}>
        <Planner />
      </MemoryRouter>
    );

    await user.click(screen.getByTestId("clear_planner"));
    rerender(
      <MemoryRouter initialEntries={["/planner"]}>
        <Planner />
      </MemoryRouter>
    );

    expect(clearPlanner).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(screen.getByTestId("planner_empty")).toBeInTheDocument()
    );
  });

  it("generates a prep plan when a recipe is selected", async () => {
    const user = userEvent.setup();
    plannerState.plannerItems = [
      { id: "plan-1", recipeId: "abc123", servings: 2 },
    ];
    const steps = [
      { order: 1, description: "Chop vegetables", appliesToRecipeIds: ["abc123"] },
    ];
    mutateMock.mockResolvedValue({
      data: { generatePrepPlan: steps },
    });

    render(
      <MemoryRouter initialEntries={["/planner"]}>
        <Planner />
      </MemoryRouter>
    );

    const generateButton = screen.getByRole("button", {
      name: /generate prep steps/i,
    });

    await waitFor(() => expect(generateButton).toBeEnabled());
    await user.click(generateButton);

    expect(mutateMock).toHaveBeenCalledWith({
      mutation: {},
      variables: { recipeIds: ["abc123"] },
    });
    expect(setDraftPlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recipeIds: ["abc123"],
        steps,
        createdAt: expect.any(String),
      })
    );
    expect(navigateMock).toHaveBeenCalledWith("/prep-plan");
  });
});
