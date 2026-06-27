"use client";

import { useMemo } from "react";
import QRCode from "react-qr-code";

type QrJoinProps = {
  size?: number;
  label?: string;
  className?: string;
  showUrl?: boolean;
};

export function QrJoin({
  size = 160,
  label = "📱 Scan to jump in!",
  className = "",
  showUrl = true,
}: QrJoinProps) {
  const joinUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }, []);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="qr-frame animate-bounce-soft">
        <QRCode
          value={joinUrl}
          size={size}
          bgColor="#ffffff"
          fgColor="#2d1b4e"
          level="M"
        />
      </div>
      <p className="font-display mt-4 text-center text-lg font-bold text-accent">
        {label}
      </p>
      {showUrl && (
        <p className="mt-1 max-w-[240px] truncate text-center text-xs font-bold text-foreground/45">
          {joinUrl}
        </p>
      )}
    </div>
  );
}
