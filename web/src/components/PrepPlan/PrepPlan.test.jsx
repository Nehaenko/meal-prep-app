import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PrepPlanPage from "./PrepPlanPage";

const savePrepPlanMock = vi.fn();
const deletePrepPlanMock = vi.fn();
const clearDraftPlanMock = vi.fn();
let prepState = [];
let queryMock;

vi.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({
    query: (...args) => queryMock(...args),
  }),
}));

vi.mock("../../state/PrepPlansContext", () => ({
  usePrepPlans: () => prepState,
}));

vi.mock("../../state/LoadingContext", () => ({
  useLoading: () => ({ start: vi.fn(), stop: vi.fn() }),
}));

describe("Prep Plan Page", () => {
  beforeEach(() => {
    savePrepPlanMock.mockReset();
    deletePrepPlanMock.mockReset();
    clearDraftPlanMock.mockReset();
    queryMock = vi.fn(({ variables }) =>
      Promise.resolve({
        data: {
          recipe: {
            id: variables.id,
            title: `Recipe ${variables.id}`,
          },
        },
      }),
    );

    prepState = {
      prepPlans: [],
      loading: false,
      saving: false,
      draftPlan: null,
      clearDraftPlan: clearDraftPlanMock,
      savePrepPlan: savePrepPlanMock,
      deletePrepPlan: deletePrepPlanMock,
    };
  });

  it("renders empty prep plan page", () => {
    render(
      <MemoryRouter initialEntries={["/prep-plan"]}>
        <PrepPlanPage />
      </MemoryRouter>,
    );

    const savedPlansText = screen.getByTestId("saved-plans-count");
    expect(savedPlansText).toHaveTextContent("0 saved plans");
  });

  it("saves the draft prep plan", async () => {
    const user = userEvent.setup();
    prepState.draftPlan = {
      recipeIds: ["r1", "r2"],
      steps: [
        { order: 1, description: "Chop onions", appliesToRecipeIds: ["r1"] },
      ],
    };
    savePrepPlanMock.mockResolvedValue(true);

    render(
      <MemoryRouter initialEntries={["/prep-plan"]}>
        <PrepPlanPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /recipe r1/i })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /save plan/i }));

    await waitFor(() =>
      expect(savePrepPlanMock).toHaveBeenCalledWith({
        title: "Recipe r1, Recipe r2",
        recipeIds: ["r1", "r2"],
        steps: [
          { order: 1, description: "Chop onions", appliesToRecipeIds: ["r1"] },
        ],
      }),
    );
  });

  it("deletes a saved prep plan", async () => {
    const user = userEvent.setup();
    prepState.prepPlans = [
      {
        id: "plan-1",
        title: "Weekly plan",
        recipeIds: ["r1"],
        steps: [{ order: 1, description: "Step 1" }],
      },
    ];

    render(
      <MemoryRouter initialEntries={["/prep-plan"]}>
        <PrepPlanPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(deletePrepPlanMock).toHaveBeenCalledWith("plan-1");
  });
});
