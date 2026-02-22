import { useState, useEffect } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "/graphql";

export default function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        await fetch(apiUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: "{ __typename }" }),
        });
        if (active) setOnline(true);
      } catch {
        if (active) setOnline(false);
      }
    };

    const handleOnline = () => check();
    const handleOffline = () => setOnline(false);

    check();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const id = setInterval(check, 15000);

    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
