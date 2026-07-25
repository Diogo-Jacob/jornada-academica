"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type PasswordInputProps =
  React.InputHTMLAttributes<HTMLInputElement> & {
    iconClassName?: string;
  };

export function PasswordInput({
  className = "",
  iconClassName = "text-[#6fb6cf]",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Lock
        className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${iconClassName}`}
      />

      <Input
        {...props}
        type={showPassword ? "text" : "password"}
        className={`pr-11 pl-10 ${className}`}
      />

      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[#6fb6cf] transition hover:bg-white/10 hover:text-white"
        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      >
        {showPassword ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}