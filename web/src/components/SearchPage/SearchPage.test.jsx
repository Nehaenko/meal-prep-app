import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const runSearchMock = vi.fn();
let mockLazyState = { data: null, loading: false, error: null };
let withLoadingMock = vi.fn((promise) => promise);

vi.mock("@apollo/client/react", () => ({
  useLazyQuery: vi.fn(() => [runSearchMock, mockLazyState]),
}));

// Mock GraphQL document so Vite/Vitest doesn't try to load the real .gql file
vi.mock("../../graphql", () => ({ SearchRecipes: {} }));

vi.mock("../../state/LoadingContext", () => ({
  useLoading: vi.fn(() => ({
    withLoading: withLoadingMock,
  })),
}));

import SearchPage from "./SearchPage";

beforeEach(() => {
  runSearchMock.mockReset();
  withLoadingMock = vi.fn((promise) => promise);
  mockLazyState = { data: null, loading: false, error: null };
});

describe("SearchPage", () => {
  it("collects ingredients and triggers search with normalized tokens", async () => {
    const user = userEvent.setup();
    render(<SearchPage />);

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
    mockLazyState = {
      data: {
        searchRecipes: {
          items: [
            { id: "1", title: "Smoky Chili", image: "/chili.jpg" },
            { id: "2", title: "Fresh Salad", image: "/salad.jpg" },
          ],
          totalPages: 2,
          totalResults: 18,
          page: 2,
        },
      },
      loading: false,
      error: null,
    };

    render(<SearchPage />);

    expect(
      screen.getByText(/Showing 11-12 of 18 recipes/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Smoky Chili")).toBeInTheDocument();
    expect(screen.getByText("Fresh Salad")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });
});
