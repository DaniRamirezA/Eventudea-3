import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ComponentProps } from "react";

const buttonVariants = cva("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: { default: "bg-[#165238] text-white hover:bg-[#103d2b]", outline: "border border-[#cfe2d5] bg-[#f1f9f4] text-[#103d2b]", ghost: "text-[#165238] hover:bg-[#f1f9f4]" } },
  defaultVariants: { variant: "default" },
});
export function Button({ className, variant, asChild = false, ...props }: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={twMerge(clsx(buttonVariants({ variant }), className))} {...props} />;
}
