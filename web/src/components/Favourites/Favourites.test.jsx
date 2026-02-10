import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Favourites from "./Favourites";
import AddToFavouritesButton from "../ActionElements/AddToFavouritesButton";

const mockToggleFavourites = vi.fn();
let mockUseFavourites;

vi.mock("../../state/FavouritesContext", () => ({
  useFavourites: () => mockUseFavourites(),
}));

vi.mock("../ActionElements/AddToPlannerButton", () => ({
  default: ({ recipe }) => (
    <button data-testid={`add-planner-${recipe.id}`}>Add to planner</button>
  ),
}));

describe("Favourites page and actions", () => {
  beforeEach(() => {
    mockToggleFavourites.mockReset();
    mockUseFavourites = () => ({
      favouritesItems: [],
      loading: false,
      toggleFavourites: mockToggleFavourites,
    });
  });

  it("shows loading state", () => {
    mockUseFavourites = () => ({
      favouritesItems: [],
      loading: true,
      toggleFavourites: mockToggleFavourites,
    });

    render(
      <MemoryRouter>
        <Favourites />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading favourites/i)).toBeInTheDocument();
  });

  it("shows empty state when no favourites", () => {
    render(
      <MemoryRouter>
        <Favourites />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/your favourites list is empty/i)
    ).toBeInTheDocument();
  });

  it("renders favourites and allows removal", async () => {
    const user = userEvent.setup();
    const recipe = { id: "fav-1", title: "My Fav", summary: "Yum" };
    mockUseFavourites = () => ({
      favouritesItems: [recipe],
      loading: false,
      toggleFavourites: mockToggleFavourites,
    });

    render(
      <MemoryRouter>
        <Favourites />
      </MemoryRouter>
    );

    expect(screen.getByText("My Fav")).toBeInTheDocument();
    expect(screen.getByTestId("add-planner-fav-1")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /remove from favourites/i })
    );
    expect(mockToggleFavourites).toHaveBeenCalledWith("fav-1");
  });

  it("add button calls toggleFavourites when not already favourite", async () => {
    const user = userEvent.setup();
    const recipe = { id: "new-1", title: "New Recipe" };
    mockUseFavourites = () => ({
      favouritesItems: [],
      loading: false,
      toggleFavourites: mockToggleFavourites,
    });

    render(<AddToFavouritesButton recipe={recipe} />);

    const btn = screen.getByRole("button", { name: /add to favourites/i });
    await user.click(btn);

    expect(mockToggleFavourites).toHaveBeenCalledWith("new-1");
  });
});
