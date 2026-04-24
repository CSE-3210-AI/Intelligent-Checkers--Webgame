import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const toneToVariant = {
  primary: "default",
  secondary: "secondary",
  danger: "destructive",
};

function CyberButton({ tone = "primary", className, variant, ...props }) {
  return (
    <Button
      variant={variant ?? toneToVariant[tone] ?? "default"}
      className={cn("CyberButton", className)}
      {...props}
    />
  );
}

const CyberPanel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("CyberPanel rounded-2xl border", className)}
    {...props}
  />
));
CyberPanel.displayName = "CyberPanel";

const CyberText = React.forwardRef(({ as: Comp = "p", tone = "body", className, ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      "CyberText",
      tone === "heading" && "CyberText--heading",
      tone === "label" && "CyberText--label",
      className
    )}
    {...props}
  />
));
CyberText.displayName = "CyberText";

const CyberDialog = Dialog;
const CyberDialogTrigger = DialogTrigger;
const CyberDialogContent = React.forwardRef(({ className, ...props }, ref) => (
  <DialogContent ref={ref} className={cn("CyberDialog", className)} {...props} />
));
CyberDialogContent.displayName = "CyberDialogContent";
const CyberDialogHeader = DialogHeader;
const CyberDialogFooter = DialogFooter;
const CyberDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogTitle ref={ref} className={cn("CyberText CyberText--heading", className)} {...props} />
));
CyberDialogTitle.displayName = "CyberDialogTitle";
const CyberDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogDescription ref={ref} className={cn("CyberText", className)} {...props} />
));
CyberDialogDescription.displayName = "CyberDialogDescription";
const CyberDialogClose = DialogClose;

export {
  CyberButton,
  CyberPanel,
  CyberText,
  CyberDialog,
  CyberDialogTrigger,
  CyberDialogContent,
  CyberDialogHeader,
  CyberDialogFooter,
  CyberDialogTitle,
  CyberDialogDescription,
  CyberDialogClose,
};
