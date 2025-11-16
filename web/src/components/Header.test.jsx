import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

// ---- spies shared across tests
const logInSpy = vi.fn();
const signUpSpy = vi.fn();
const fetchMeSpy = vi.fn();

vi.mock("../state/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    logOut: vi.fn(),
    logIn: logInSpy,
    signUp: signUpSpy,
    fetchCurrentUser: fetchMeSpy,
  })),
}));

import Header from "../components/Header";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Header", () => {
  it("renders the auth modal when unauthenticated", async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const createAccountTab = screen.getByTestId("create_account_tab");
    const logInTab = screen.getByTestId("login_tab");
    expect(createAccountTab).toBeInTheDocument();

    await createAccountTab.click();
    expect(
      screen.getByRole("button", { name: /Create Account/i })
    ).toBeInTheDocument();

    await logInTab.click();
    expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
  });

  it("logIn action submits email/password and calls useAuth.logIn", async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    const dialog = screen.getByRole("dialog");
    const dlg = within(dialog);

    await user.type(dlg.getByTestId("login_email"), "alla@gmail.com");
    await user.type(dlg.getByTestId("login_password"), "test123");
    await user.click(dlg.getByRole("button", { name: /Log in/i }));

    expect(logInSpy).toHaveBeenCalledTimes(1);
    expect(logInSpy).toHaveBeenCalledWith("alla@gmail.com", "test123");
    expect(fetchMeSpy).toHaveBeenCalled();
  });

  it("logIn with non-existing email - error shown", async () => {
    logInSpy.mockRejectedValueOnce(new Error("Invalid email or password"));

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    const dlg = within(screen.getByRole("dialog"));

    await user.type(dlg.getByTestId("login_email"), "allaNonExist@gmail.com");
    await user.type(dlg.getByTestId("login_password"), "test123");
    await user.click(dlg.getByRole("button", { name: /log in/i }));

    expect(logInSpy).toHaveBeenCalledTimes(1);

    const logInError = await dlg.findByTestId("login_error");
    expect(logInError).toHaveTextContent(/invalid email or password/i);

    expect(fetchMeSpy).not.toHaveBeenCalled();
  });

  it("Sign Uo action submits email/password and calls useAuth.signUp", async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const user = userEvent.setup();
    const dlg = within(screen.getByRole("dialog"));
    
    const createAccountTab = screen.getByTestId("create_account_tab");
    expect(createAccountTab).toBeInTheDocument();

    await createAccountTab.click();

    await user.type(dlg.getByTestId("signup_email"), "allaTestSignUp@gmail.com");
    await user.type(dlg.getByTestId("signup_password"), "test123");
    await user.click(dlg.getByRole("button", { name: /Create Account/i }));

    expect(signUpSpy).toHaveBeenCalledTimes(1);
    expect(signUpSpy).toHaveBeenCalledWith(
      "allaTestSignUp@gmail.com",
      "test123"
    );
    expect(fetchMeSpy).toHaveBeenCalled();
  });
});
