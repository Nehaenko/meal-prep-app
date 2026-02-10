import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import {
  Bars3Icon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { IoAddOutline } from "react-icons/io5";
import AuthModal from "./Auth/AuthModal";
import { useAuth } from "../state/AuthContext";
import { usePlanner } from "../state/PlannerContext";
import { useFavourites } from "../state/FavouritesContext";
import { useShoppingLists } from "../state/ShoppingListContext";
import { usePrepPlans } from "../state/PrepPlansContext";
import { useCustomRecipes } from "../state/CustomRecipesContext";

const nav = [
  { name: "Search", href: "/", icon: MagnifyingGlassIcon },
  { name: "Planner", href: "/planner", icon: CalendarDaysIcon },
  { name: "Shopping list", href: "/shopping-list", icon: ClipboardDocumentListIcon },
  { name: "My recipes", href: "/my-recipes", icon: PencilSquareIcon },
  { name: "Prep plan", href: "/prep-plan", icon: SparklesIcon },
  { name: "Favourites", href: "/favourites", icon: HeartIcon },
];

const cx = (...c) => c.filter(Boolean).join(" ");

function hashString(str) {
  return str
    .split("")
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0);
}

function getAnimalAvatar(seed) {
  const animals = ["🦊", "🦁", "🦉", "🐢", "🐻", "🐰", "🦔", "🦜", "🦄"];
  const colors = [
    "linear-gradient(145deg, #d9f2e4, #bfe9d4)",
    "linear-gradient(145deg, #d9f2e4, #c7ecd8)",
    "linear-gradient(145deg, #d9f2e4, #cfeede)",
    "linear-gradient(145deg, #d9f2e4, #bfe9d4)",
  ];
  const hash = hashString(seed || "guest");
  return {
    emoji: animals[hash % animals.length],
    background: colors[hash % colors.length],
    seed,
  };
}

function AvatarBadge({ avatar, size = "md", onClick }) {
  const sizes = {
    sm: "h-9 w-9 text-lg",
    md: "h-11 w-11 text-xl",
    lg: "h-14 w-14 text-2xl",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center rounded-full text-white shadow-md ring-2 ring-white/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--green-200)] transition",
        sizes[size]
      )}
      style={{ backgroundImage: avatar.background }}
      aria-label="Open menu"
    >
      <span aria-hidden>{avatar.emoji}</span>
    </button>
  );
}

function NavPill({ item, badge }) {
  return (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      className={({ isActive }) =>
        cx(
          "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-[var(--green-200)] text-[var(--ink-900)] shadow-sm"
            : "text-[var(--ink-700)] hover:bg-white hover:shadow-sm"
        )
      }
    >
      <item.icon className="h-4 w-4" />
      <span>{item.name}</span>
      {badge ? (
        <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--green-700)] px-2 text-[0.7rem] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}

function BottomNav({
  plannerCount,
  favouritesCount,
  shoppingCount,
  prepCount,
  hasPrepDraft,
  customCount,
}) {
  return (
    <nav className="fixed inset-x-4 bottom-5 z-40">
      <div className="relative rounded-3xl bg-white/95 px-5 py-4 shadow-xl ring-1 ring-black/5 backdrop-blur">
        <div className="flex items-center justify-between">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cx(
                "flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive
                  ? "bg-[var(--green-200)] text-[var(--green-900)]"
                  : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
              )
            }
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </NavLink>
          <NavLink
            to="/planner"
            className={({ isActive }) =>
              cx(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive
                  ? "bg-[var(--green-200)] text-[var(--green-900)]"
                  : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
              )
            }
            aria-label="Planner"
          >
            <CalendarDaysIcon className="h-5 w-5" />
            {plannerCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--green-700)] px-1 text-[0.6rem] font-bold text-white">
                {plannerCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/shopping-list"
            className={({ isActive }) =>
              cx(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive
                  ? "bg-[var(--green-200)] text-[var(--green-900)]"
                  : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
              )
            }
            aria-label="Shopping list"
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            {shoppingCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--green-700)] px-1 text-[0.6rem] font-bold text-white">
                {shoppingCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/my-recipes"
            className={({ isActive }) =>
              cx(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive
                  ? "bg-[var(--green-200)] text-[var(--green-900)]"
                  : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
              )
            }
            aria-label="My recipes"
          >
            <IoAddOutline className="h-6 w-6" />
            {customCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--green-700)] px-1 text-[0.6rem] font-bold text-white">
                {customCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/favourites"
            className={({ isActive }) =>
              cx(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive
                  ? "bg-[var(--green-200)] text-[var(--green-900)]"
                  : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
              )
            }
            aria-label="Favourites"
          >
            <HeartIcon className="h-5 w-5" />
            {favouritesCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--green-700)] px-1 text-[0.6rem] font-bold text-white">
                {favouritesCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/prep-plan"
            className={({ isActive }) =>
              cx(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive || hasPrepDraft
                  ? "bg-[var(--green-200)] text-[var(--green-900)]"
                  : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
              )
            }
            aria-label="Prep plan"
          >
            <SparklesIcon className="h-5 w-5" />
            {prepCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--green-700)] px-1 text-[0.6rem] font-bold text-white">
                {prepCount}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default function Header() {
  const { user, loading, initialized, logOut } = useAuth();
  const mustAuth = initialized && !user;
  const { plannerItems } = usePlanner();
  const { favouritesItems } = useFavourites();
  const { shoppingLists } = useShoppingLists();
  const { prepPlans, draftPlan } = usePrepPlans();
  const { customRecipes } = useCustomRecipes();
  const plannerCount = plannerItems?.length ?? 0;
  const favouritesCount = favouritesItems?.length ?? 0;
  const shoppingCount =
    shoppingLists?.reduce((acc, list) => acc + (list.items?.length ?? 0), 0) ??
    0;
  const customCount = customRecipes?.length ?? 0;
  const hasPrepDraft = (draftPlan?.steps?.length ?? 0) > 0;
  const prepCount = hasPrepDraft ? 1 : prepPlans?.length ?? 0;
  const [sheetOpen, setSheetOpen] = useState(false);
  const avatar = useMemo(
    () => getAnimalAvatar(user?.email ?? "guest"),
    [user?.email]
  );

  return (
    <header className="relative z-30 mb-4">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center rounded-2xl bg-white/90 px-3 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur mt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--ink-900)] hover:bg-[var(--sand-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]"
              onClick={() => setSheetOpen(true)}
              aria-label="Open navigation"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-3 text-left">
              <svg
                viewBox="0 0 512 512"
                className="h-9 w-9"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="meal-logo-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--green-700)" />
                    <stop offset="100%" stopColor="var(--green-500)" />
                  </linearGradient>
                </defs>
                <path
                  d="M479.55 96h-91.06l8.92-35.66 38.32-13.05c8.15-2.77 13-11.43 10.65-19.71a16 16 0 0 0-20.54-10.73l-47 16a16 16 0 0 0-10.36 11.27L355.51 96H224.45c-8.61 0-16 6.62-16.43 15.23A16 16 0 0 0 224 128h2.75l1 8.66A8.3 8.3 0 0 0 236 144c39 0 73.66 10.9 100.12 31.52A121.9 121.9 0 0 1 371 218.07a123.4 123.4 0 0 1 10.12 29.51 7.83 7.83 0 0 0 3.29 4.88 72 72 0 0 1 26.38 86.43 7.92 7.92 0 0 0-.15 5.53A96 96 0 0 1 416 376c0 22.34-7.6 43.63-21.4 59.95a80.12 80.12 0 0 1-28.78 21.67 8 8 0 0 0-4.21 4.37 108.19 108.19 0 0 1-17.37 29.86 2.5 2.5 0 0 0 1.9 4.11h49.21a48.22 48.22 0 0 0 47.85-44.14L477.4 128h2.6a16 16 0 0 0 16-16.77c-.42-8.61-7.84-15.23-16.45-15.23z"
                  fill="url(#meal-logo-gradient)"
                />
                <path
                  d="M108.69 320a23.87 23.87 0 0 1 17 7l15.51 15.51a4 4 0 0 0 5.66 0L162.34 327a23.87 23.87 0 0 1 17-7h196.58a8 8 0 0 0 8.08-7.92V312a40.07 40.07 0 0 0-32-39.2c-.82-29.69-13-54.54-35.51-72C295.67 184.56 267.85 176 236 176h-72c-68.22 0-114.43 38.77-116 96.8A40.07 40.07 0 0 0 16 312a8 8 0 0 0 8 8zm77.25 32a8 8 0 0 0-5.66 2.34l-22.14 22.15a20 20 0 0 1-28.28 0l-22.14-22.15a8 8 0 0 0-5.66-2.34h-69.4a15.93 15.93 0 0 0-15.76 13.17A65.22 65.22 0 0 0 16 376c0 30.59 21.13 55.51 47.26 56 2.43 15.12 8.31 28.78 17.16 39.47C93.51 487.28 112.54 496 134 496h132c21.46 0 40.49-8.72 53.58-24.55 8.85-10.69 14.73-24.35 17.16-39.47 26.13-.47 47.26-25.39 47.26-56a65.22 65.22 0 0 0-.9-10.83A15.93 15.93 0 0 0 367.34 352z"
                  fill="url(#meal-logo-gradient)"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-[var(--muted-400)]">
                  Plan meals with ease!
                </p>
              </div>
            </div>
          </div>

          <div className="ml-auto">
            <AvatarBadge avatar={avatar} onClick={() => setSheetOpen(true)} />
          </div>
        </div>
      </div>

      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 backdrop-blur-sm transition-opacity duration-150 data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 flex justify-start">
          <DialogPanel
            transition
            className="relative h-full w-80 max-w-[80vw] rounded-r-3xl bg-white/95 px-5 py-6 shadow-2xl ring-1 ring-black/5 backdrop-blur transition duration-150 ease-out data-[closed]:opacity-0 data-[closed]:-translate-x-3 data-[closed]:ease-in data-[closed]:duration-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AvatarBadge avatar={avatar} size="lg" />
                <div className="leading-tight">
                  <p className="text-base font-bold text-[var(--ink-900)]">
                    {user?.email ? user.email.split("@")[0] : "Guest chef"}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-400)]">
                    {user?.email ?? "Sign in to save favourites"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-700)] hover:bg-[var(--sand-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-2">
              {nav.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === "/"}
                  onClick={() => setSheetOpen(false)}
                  className={({ isActive }) =>
                    cx(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition",
                      isActive
                        ? "bg-[var(--green-200)] text-[var(--ink-900)]"
                        : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.name === "Planner" && plannerCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--green-700)] px-2 text-[0.7rem] font-bold text-white">
                      {plannerCount}
                    </span>
                  )}
                  {item.name === "Shopping list" && shoppingCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--green-700)] px-2 text-[0.7rem] font-bold text-white">
                      {shoppingCount}
                    </span>
                  )}
                  {item.name === "My recipes" && customCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--green-700)] px-2 text-[0.7rem] font-bold text-white">
                      {customCount}
                    </span>
                  )}
                  {item.name === "Prep plan" && prepCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--green-700)] px-2 text-[0.7rem] font-bold text-white">
                      {prepCount}
                    </span>
                  )}
                  {item.name === "Favourites" && favouritesCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--green-700)] px-2 text-[0.7rem] font-bold text-white">
                      {favouritesCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="mt-6 border-t border-[var(--sand-100)] pt-4 space-y-2">
              {user ? (
                <button
                  type="button"
                  onClick={logOut}
                  className="flex w-full items-center justify-between rounded-xl bg-[var(--green-200)] px-4 py-3 font-semibold text-[var(--ink-900)] transition hover:brightness-105"
                >
                  Log out
                  <XMarkIcon className="h-4 w-4" />
                </button>
              ) : (
                !loading && (
                  <span className="block text-sm font-semibold text-[var(--ink-700)]">
                    Please sign in to save your meals.
                  </span>
                )
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <BottomNav
        plannerCount={plannerCount}
        favouritesCount={favouritesCount}
        shoppingCount={shoppingCount}
        prepCount={prepCount}
        hasPrepDraft={hasPrepDraft}
        customCount={customCount}
      />

      {mustAuth && (
        <Dialog open onClose={() => {}} className="relative z-50">
          <DialogBackdrop className="auth-modal-backdrop fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="auth-modal max-w-lg w-full space-y-4 rounded-lg border bg-white p-6 text-black">
              <AuthModal />
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </header>
  );
}
