import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, { open, setOpen } as any)
          : child
      )}
    </div>
  )
}

const DropdownMenuTrigger = ({ 
  children, 
  asChild, 
  open, 
  setOpen 
}: { 
  children: React.ReactNode
  asChild?: boolean
  open?: boolean
  setOpen?: (open: boolean) => void
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen?.(!open)
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick } as any)
  }
  
  return (
    <button onClick={handleClick}>
      {children}
    </button>
  )
}

const DropdownMenuContent = ({ 
  children, 
  className, 
  align = "end",
  open,
  setOpen
}: { 
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  open?: boolean
  setOpen?: (open: boolean) => void
}) => {
  const alignClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0"
  }

  React.useEffect(() => {
    if (open) {
      const handleClickOutside = () => setOpen?.(false)
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      className={cn(
        "absolute top-full mt-1 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg z-50",
        alignClasses[align],
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

const DropdownMenuItem = ({ 
  children, 
  className, 
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
)

const DropdownMenuLabel = ({ 
  children, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  >
    {children}
  </div>
)

const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
