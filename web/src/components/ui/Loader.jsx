// src/components/CookingLoader.jsx
export default function Loader({
  label = "",
  center = "fixed",
  dim = true,
  z = "z-50",
}) {
  const base =
    center === "fixed"
      ? `fixed inset-0 ${z} grid place-items-center ${dim ? "bg-white/70" : ""}`
      : center === "absolute"
      ? `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${z}`
      : "";

  return (
    <div role="status" aria-live="polite" className={base}>
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-gray-700">
        <svg
          width="140"
          height="120"
          viewBox="0 0 140 120"
          aria-hidden="true"
          className="drop-shadow-sm"
        >
          <rect
            x="10"
            y="92"
            width="120"
            height="10"
            rx="5"
            className="fill-gray-300"
          />
          <g className="animate-sizzle">
            <ellipse
              cx="40"
              cy="97"
              rx="10"
              ry="4"
              className="fill-orange-400"
            />
            <ellipse
              cx="70"
              cy="97"
              rx="10"
              ry="4"
              className="fill-orange-400"
            />
            <ellipse
              cx="100"
              cy="97"
              rx="10"
              ry="4"
              className="fill-orange-400"
            />
          </g>
          <rect
            x="25"
            y="45"
            width="90"
            height="45"
            rx="10"
            className="fill-gray-700"
          />
          <rect
            x="22"
            y="40"
            width="96"
            height="8"
            rx="4"
            className="fill-gray-600"
          />
          <rect
            x="14"
            y="52"
            width="10"
            height="22"
            rx="5"
            className="fill-gray-600"
          />
          <rect
            x="116"
            y="52"
            width="10"
            height="22"
            rx="5"
            className="fill-gray-600"
          />
          <rect
            x="28"
            y="52"
            width="84"
            height="6"
            rx="3"
            className="fill-emerald-400"
          />
          <circle
            cx="55"
            cy="70"
            r="3"
            className="fill-emerald-300 animate-bubble"
          />
          <circle
            cx="80"
            cy="78"
            r="2.8"
            className="fill-emerald-300 animate-bubble2"
          />
          <circle
            cx="95"
            cy="72"
            r="2.4"
            className="fill-emerald-300 animate-bubble3"
          />
          <circle
            cx="68"
            cy="74"
            r="2.2"
            className="fill-emerald-300 animate-bubble4"
          />
          <path
            d="M45 38 C40 30, 50 24, 45 16"
            className="stroke-gray-400 fill-none stroke-[2] animate-steam"
            strokeLinecap="round"
          />
          <path
            d="M70 38 C65 30, 75 24, 70 16"
            className="stroke-gray-400 fill-none stroke-[2] animate-steam delay-200"
            strokeLinecap="round"
          />
          <path
            d="M95 38 C90 30, 100 24, 95 16"
            className="stroke-gray-400 fill-none stroke-[2] animate-steam delay-300"
            strokeLinecap="round"
          />
        </svg>

        {label ? (
          <p className="text-sm font-medium text-gray-600">{label}</p>
        ) : null}

        <style>{`
          @keyframes bubbleUp { 0%{transform:translateY(0) scale(1);opacity:.9}
            60%{opacity:.9} 100%{transform:translateY(-18px) scale(.7);opacity:0} }
          @keyframes steamRise { 0%{transform:translateY(0) translateX(0);opacity:0}
            20%{opacity:.5} 100%{transform:translateY(-14px) translateX(2px);opacity:0} }
          @keyframes sizzle { 0%,100%{opacity:.75;transform:scaleX(1)}
            50%{opacity:1;transform:scaleX(1.08)} }
          .animate-bubble{animation:bubbleUp 1.4s ease-in-out infinite}
          .animate-bubble2{animation:bubbleUp 1.6s ease-in-out infinite .2s}
          .animate-bubble3{animation:bubbleUp 1.8s ease-in-out infinite .35s}
          .animate-bubble4{animation:bubbleUp 1.5s ease-in-out infinite .5s}
          .animate-steam{animation:steamRise 1.8s ease-in-out infinite}
          .delay-200{animation-delay:.2s} .delay-300{animation-delay:.3s}
          .animate-sizzle{animation:sizzle 1.2s ease-in-out infinite; transform-origin:70px 97px}
        `}</style>
      </div>
    </div>
  );
}
