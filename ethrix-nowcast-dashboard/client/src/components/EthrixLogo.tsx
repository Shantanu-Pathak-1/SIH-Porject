import React from "react";

interface EthrixLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function EthrixLogo({
  className = "",
  size = 38,
  showText = false,
}: EthrixLogoProps) {
  if (showText) {
    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`}>
        <img
          src="/ethrix-logo.svg"
          alt="Ethrix-Nowcast Logo"
          width={size}
          height={size}
          className="shrink-0 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-base font-serif font-bold tracking-wider text-white">
              ETHRIX
            </span>
            <span className="text-sm font-mono font-bold tracking-wider text-emerald-400">
              -NOWCAST
            </span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400/80 tracking-wider mt-1">
            HYPER-LOCAL NOWCASTING · 2–6H EARLY WARNING
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src="/ethrix-logo.svg"
      alt="Ethrix-Nowcast Logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.35)] ${className}`}
    />
  );
}
