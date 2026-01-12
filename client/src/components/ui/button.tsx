import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-bounce font-display tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:bg-primary/90 hover:translate-y-[1px] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.2)] active:translate-y-[4px] active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:bg-destructive/90 hover:translate-y-[1px] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.2)] active:translate-y-[4px] active:shadow-none",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:bg-secondary/80 hover:translate-y-[1px] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.2)] active:translate-y-[4px] active:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        game: "text-2xl py-8 rounded-3xl border-4 border-black/10 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] active:translate-y-[8px] active:shadow-none transition-all duration-100",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-14 rounded-2xl px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
