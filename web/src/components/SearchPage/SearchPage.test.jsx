import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const fakeData = {
  searchRecipes: {
    items: [],
    totalPages: 1,
    totalResults: 0,
    page: 1,
  },
};

let mockLazyState = { data: null, loading: false, error: null };
const runSearchMock = vi.fn();
const withLoadingMock = vi.fn((promise) => Promise.resolve(promise));

vi.mock("@apollo/client/react", () => ({
  useLazyQuery: () => [runSearchMock, mockLazyState],
}));

vi.mock("../../state/LoadingContext", () => ({
  useLoading: () => ({ withLoading: withLoadingMock }),
}));

vi.mock("../../state/PlannerContext", () => ({
  usePlanner: () => ({
    plannerItems: [],
    loading: false,
    addToPlanner: vi.fn(),
    removeFromPlanner: vi.fn(),
    clearPlanner: vi.fn(),
  }),
}));

// Mock GraphQL document so Vite/Vitest doesn't try to load the real .gql file
vi.mock("../../graphql", () => ({ SearchRecipes: {} }));

import SearchPage from "./SearchPage";

beforeEach(() => {
  runSearchMock.mockReset();
  runSearchMock.mockResolvedValue({ data: fakeData });
  withLoadingMock.mockClear();
  mockLazyState = { data: null, loading: false, error: null };
});

describe("SearchPage", () => {
  it("collects ingredients and triggers search with normalized tokens", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/search ingredients/i);
    await user.type(input, "Chicken, Garlic");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(withLoadingMock).toHaveBeenCalledTimes(1);
    expect(runSearchMock).toHaveBeenCalledWith({
      variables: { ingredients: ["chicken", "garlic"], page: 1 },
    });

    expect(screen.getByText("chicken")).toBeInTheDocument();
    expect(screen.getByText("garlic")).toBeInTheDocument();
  });

  it("renders results summary and cards when search data is available", () => {
    const populated = {
      searchRecipes: {
        items: [
          { id: "1", title: "Smoky Chili", image: "/chili.jpg" },
          { id: "2", title: "Fresh Salad", image: "/salad.jpg" },
        ],
        totalPages: 2,
        totalResults: 18,
        page: 2,
      },
    };
    mockLazyState = { data: populated, loading: false, error: null };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Showing 11-12 of 18 recipes/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Smoky Chili")).toBeInTheDocument();
    expect(screen.getByText("Fresh Salad")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });
});
