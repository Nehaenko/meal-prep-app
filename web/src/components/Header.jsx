import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";
import AuthModal from "./Auth/AuthModal";
import { useAuth } from "../state/AuthContext";
import { usePlanner } from "../state/PlannerContext";
import { useFavourites } from "../state/FavouriesContext";

const nav = [
  { name: "Search", href: "/" },
  { name: "Planner", href: "/planner" },
  { name: "Favourites", href: "/favourites" },
];

const cx = (...c) => c.filter(Boolean).join(" ");

export default function Header() {
  const { user, loading, logOut } = useAuth();
  const mustAuth = !loading && !user;
  const { plannerItems } = usePlanner();
  const { favouritesItems } = useFavourites();
  const plannerCount = plannerItems?.length ?? 0;
  const favouritesCount = favouritesItems?.length ?? 0;

  return (
    <header className="relative">
      <Disclosure
        as="nav"
        className="relative bg-gray-800/50 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10"
      >
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  <DisclosureButton
                    className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500"
                    aria-label="Open main menu"
                  >
                    {open ? (
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    )}
                  </DisclosureButton>
                </div>

                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex shrink-0 items-center">
                    <img
                      alt="MealPrep"
                      src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                      className="h-8 w-auto"
                    />
                  </div>

                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-1">
                      {nav.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          className={({ isActive }) =>
                            cx(
                              isActive
                                ? "bg-gray-950/50 text-white"
                                : "text-gray-300 hover:bg-white/5 hover:text-white",
                              "rounded-md px-3 py-2 text-sm font-medium flex items-center gap-2"
                            )
                          }
                          end={item.href === "/"}
                        >
                          <span>{item.name}</span>
                          {item.name === "Planner" && plannerCount > 0 && (
                            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-500 px-2 text-xs font-semibold text-white">
                              {plannerCount}
                            </span>
                          )}
                          {item.name === "Favourites" &&
                            favouritesCount > 0 && (
                              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-500 px-2 text-xs font-semibold text-white">
                                {favouritesCount}
                              </span>
                            )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex sm:items-center">
                  {user ? (
                    <Menu as="div" className="relative ml-3">
                      <MenuButton className="relative flex items-center gap-2 rounded-full px-2 py-1 text-sm text-gray-200 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                        {/* email only on desktop */}
                        <span className="truncate max-w-40 cursor-pointer">
                          {user.email}
                        </span>
                      </MenuButton>
                      <MenuItems
                        transition
                        className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 outline -outline-offset-1 outline-white/10 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                      >
                        <MenuItem>
                          <button
                            onClick={logOut}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:outline-hidden"
                          >
                            Sign out
                          </button>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  ) : (
                    !loading &&
                    !user && (
                      <span className="text-gray-300 text-sm px-2">
                        Please sign in
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <DisclosurePanel className="sm:hidden">
              <div className="space-y-1 px-2 pt-2 pb-3">
                {nav.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as={NavLink}
                    to={item.href}
                    end={item.href === "/"}
                    className={({ isActive }) =>
                      cx(
                        isActive
                          ? "bg-gray-950/50 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white",
                        "block rounded-md px-3 py-2 text-base font-medium flex items-center gap-2"
                      )
                    }
                  >
                    <span>{item.name}</span>
                    {item.name === "Planner" && plannerCount > 0 && (
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-500 px-2 text-xs font-semibold text-white">
                        {plannerCount}
                      </span>
                    )}
                    {item.name === "Favourites" && favouritesCount > 0 && (
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-500 px-2 text-xs font-semibold text-white">
                        {favouritesCount}
                      </span>
                    )}
                  </DisclosureButton>
                ))}

                {/* Mobile-only sign out */}
                {user && (
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <DisclosureButton
                      as="button"
                      onClick={logOut}
                      className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                    >
                      Sign out
                    </DisclosureButton>
                  </div>
                )}
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>

      {mustAuth && (
        <Dialog open onClose={() => {}} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="max-w-lg w-full space-y-4 rounded-lg border bg-white p-6 text-black">
              <AuthModal />
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </header>
  );
}
