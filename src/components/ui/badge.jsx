import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const base = "inline-flex items-center justify-center rounded-md border font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden";
const badgeVariants = cva(
  base,
  {
    variants: {
      variant: {
        default:
          "text-sm px-2 py-0.5 bg-blue-50 text-[#005787] border-blue-200 [a&]:hover:bg-[color:var(--action-500)/0.16]",
        secondary:
          "text-sm px-2 py-0.5 bg-blue-50 text-[#005787] border-blue-200 [a&]:hover:bg-[color:var(--action-500)/0.16]",
        destructive:
          "text-sm px-2 py-0.5 bg-destructive/10 text-destructive border-destructive/30",
        outline:
          "text-sm px-2 py-0.5 bg-blue-50 text-[#005787] border-blue-200 [a&]:hover:bg-[color:var(--action-500)/0.16]",
        active:
          "bg-green-100 text-green-800 border-green-300 text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }
