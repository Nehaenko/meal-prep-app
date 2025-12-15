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
  HeartIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AuthModal from "./Auth/AuthModal";
import { useAuth } from "../state/AuthContext";
import { usePlanner } from "../state/PlannerContext";
import { useFavourites } from "../state/FavouriesContext";

const nav = [
  { name: "Search", href: "/", icon: MagnifyingGlassIcon },
  { name: "Planner", href: "/planner", icon: CalendarDaysIcon },
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
    "linear-gradient(135deg, #1f7a46, #2eb872)",
    "linear-gradient(135deg, #165b3a, #1f7a46)",
    "linear-gradient(135deg, #0f3b2e, #2eb872)",
    "linear-gradient(135deg, #1f3326, #2eb872)",
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

function BottomNav({ avatar, onAvatar, plannerCount, favouritesCount }) {
  return (
    <nav className="md:hidden fixed inset-x-4 bottom-5 z-40">
      <div className="relative rounded-3xl bg-white/95 px-5 py-4 shadow-xl ring-1 ring-black/5 backdrop-blur">
        <div className="flex items-center justify-between">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cx(
                "flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive ? "bg-[var(--green-200)] text-[var(--green-900)]" : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
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
                isActive ? "bg-[var(--green-200)] text-[var(--green-900)]" : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
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
          <span className="w-14" aria-hidden />
          <NavLink
            to="/favourites"
            className={({ isActive }) =>
              cx(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive ? "bg-[var(--green-200)] text-[var(--green-900)]" : "text-[var(--ink-700)] hover:bg-[var(--sand-100)]"
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
          <AvatarBadge avatar={avatar} size="sm" onClick={onAvatar} />
        </div>
        <NavLink
          to="/"
          aria-label="Add meal"
          className="absolute inset-x-0 -top-7 flex justify-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green-700)] text-white shadow-[0_12px_40px_rgba(31,122,70,0.35)] transition hover:translate-y-[-2px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 4v8m0 8V12m0 0H4m4 0h4m4-8v4m0 8V8m0 0h-4m4 0h4"
              />
            </svg>
          </div>
        </NavLink>
      </div>
    </nav>
  );
}

export default function Header() {
  const { user, loading, logOut } = useAuth();
  const mustAuth = !loading && !user;
  const { plannerItems } = usePlanner();
  const { favouritesItems } = useFavourites();
  const plannerCount = plannerItems?.length ?? 0;
  const favouritesCount = favouritesItems?.length ?? 0;
  const [sheetOpen, setSheetOpen] = useState(false);
  const avatar = useMemo(
    () => getAnimalAvatar(user?.email ?? "guest"),
    [user?.email]
  );

  return (
    <header className="relative z-30 mb-4">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between rounded-2xl bg-white/90 px-3 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--ink-900)] hover:bg-[var(--sand-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]"
            onClick={() => setSheetOpen(true)}
            aria-label="Open navigation"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--green-700)]">
              Meal Prep
            </p>
            <p className="text-xl font-extrabold text-[var(--ink-900)] leading-tight">
              Let&apos;s eat better.
            </p>
            <p className="text-sm font-medium text-[var(--muted-400)]">
              Nutritious food, easy search.
            </p>
          </div>

          <AvatarBadge avatar={avatar} onClick={() => setSheetOpen(true)} />
        </div>

        <div className="mt-3 hidden gap-2 sm:flex">
          {nav.map((item) => (
            <NavPill
              key={item.name}
              item={item}
              badge={
                item.name === "Planner"
                  ? plannerCount || undefined
                  : item.name === "Favourites"
                  ? favouritesCount || undefined
                  : undefined
              }
            />
          ))}

          {user ? (
            <button
              type="button"
              onClick={logOut}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[var(--sand-100)] px-4 py-2 text-sm font-semibold text-[var(--ink-700)] hover:bg-[var(--sand-50)]"
            >
              Sign out
            </button>
          ) : (
            !loading && (
              <span className="ml-auto text-sm font-semibold text-[var(--ink-700)]">
                Please sign in
              </span>
            )
          )}
        </div>
      </div>

      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        <div className="fixed inset-0 flex justify-start">
          <DialogPanel className="relative h-full w-80 max-w-[80vw] rounded-r-3xl bg-white/95 px-5 py-6 shadow-2xl ring-1 ring-black/5 backdrop-blur">
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
                  {item.name === "Favourites" && favouritesCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--green-700)] px-2 text-[0.7rem] font-bold text-white">
                      {favouritesCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="mt-6 border-t border-[var(--sand-100)] pt-4 space-y-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[var(--ink-700)] transition hover:bg-[var(--sand-100)]"
              >
                <Squares2X2Icon className="h-5 w-5" />
                <span>Discover categories</span>
              </button>
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
        avatar={avatar}
        onAvatar={() => setSheetOpen(true)}
        plannerCount={plannerCount}
        favouritesCount={favouritesCount}
      />

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
