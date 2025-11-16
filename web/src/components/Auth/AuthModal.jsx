import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useState } from "react";
import { useAuth } from "../../state/AuthContext";
import FormComponent from "../ui/Form";

export default function AuthModal() {
  const { logIn, signUp, fetchCurrentUser } = useAuth();
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");

  async function logInHandler(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const email = fd.get("email-login");
    const password = fd.get("password-login");

    try {
      await logIn(String(email), String(password));
      await fetchCurrentUser();
    } catch (error) {
      setLoginError(error.message);
      setTimeout(() => setLoginError(""), 3000);
    }
  }

  async function signUpHandler(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const email = fd.get("email-signup");
    const password = fd.get("password-signup");

    try {
      await signUp(String(email), String(password));
      await fetchCurrentUser();
    } catch (error) {
      setSignupError(error.message);
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
