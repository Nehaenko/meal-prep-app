import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useState } from "react";
import { useAuth } from "../../state/AuthContext";
import FormComponent from "../ui/Form";

export default function AuthModal() {
  const { logIn, signUp, fetchCurrentUser } = useAuth();
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const passwordRequirements =
    "Password must be at least 8 characters and include 1 number and 1 special character.";

  const meetsPasswordRequirements = (value) =>
    /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);

  async function logInHandler(event) {
    event.preventDefault();
    setLoginError("");
    const fd = new FormData(event.currentTarget);
    const email = fd.get("email-login");
    const password = fd.get("password-login");

    try {
      await logIn(String(email), String(password));
      await fetchCurrentUser();
    } catch (error) {
      setLoginError(error?.message || "Unable to log in.");
    }
  }

  async function signUpHandler(event) {
    event.preventDefault();
    setSignupError("");
    const fd = new FormData(event.currentTarget);
    const email = fd.get("email-signup");
    const password = fd.get("password-signup");

    try {
      if (!meetsPasswordRequirements(String(password ?? ""))) {
        setSignupError(passwordRequirements);
        setTimeout(() => setSignupError(""), 3000);
        return;
      }
      await signUp(String(email), String(password));
      await fetchCurrentUser();
    } catch (error) {
      setSignupError(error?.message || "Unable to create account.");
      setTimeout(() => setSignupError(""), 3000);
    }
  }

  return (
    <>
      <TabGroup className="z-10">
        <TabList className="flex space-x-4 pb-2 mb-4">
          <Tab
            data-testid="login_tab"
            className="data-hover:cursor-pointer data-selected:border-b-2 data-selected:border-blue-500"
          >
            Sign In
          </Tab>
          <Tab
            data-testid="create_account_tab"
            className="data-hover:cursor-pointer data-selected:border-b-2 data-selected:border-blue-500"
          >
            Create An Account
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <FormComponent
              onSubmit={logInHandler}
              error={loginError}
              type="login"
            />
          </TabPanel>
          <TabPanel>
            <FormComponent
              onSubmit={signUpHandler}
              error={signupError}
              type="signup"
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </>
  );
}
