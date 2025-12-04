import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MealPage from "./MealPage";

const fakeRecipe = {
  id: "mealdb:123",
  title: "Test Meal",
  summary: "Tasty",
  image: "http://example.com/img.jpg",
  ingredients: ["1 cup rice", "2 tbsp oil"],
  steps: ["Boil water", "Add rice"],
  source: "themealdb",
};

vi.mock("../../graphql", () => ({
  Recipe: {},
}));

const fetchRecipeMock = vi.fn(() => Promise.resolve({ data: { recipe: fakeRecipe } }));

vi.mock("@apollo/client/react", () => ({
  useLazyQuery: () => [
    fetchRecipeMock,
    { data: { recipe: fakeRecipe }, loading: false, error: null },
  ],
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: fakeRecipe.id }),
    useLocation: () => ({ state: { results: null } }),
  };
});

vi.mock("../../state/LoadingContext", () => ({
  useLoading: () => ({
    withLoading: (promise) => promise,
  }),
}));

describe("MealPage component", () => {
  it("renders recipe data", () => {
    fetchRecipeMock.mockClear();
    render(<MealPage />);

    expect(screen.getByText("Test Meal")).toBeInTheDocument();
    expect(screen.getByAltText("Test Meal")).toHaveAttribute(
      "src",
      "http://example.com/img.jpg"
    );
    expect(screen.getByText("1 cup rice")).toBeInTheDocument();
    expect(screen.getByText("Boil water")).toBeInTheDocument();
  });
});
