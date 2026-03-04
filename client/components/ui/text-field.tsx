import { cn } from "@/lib/utils";
import React, {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactElement,
} from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  LabelProps?: LabelHTMLAttributes<HTMLLabelElement>;
  InputProps?: InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>;
  helperText?: string;
  helperTextProps?: HTMLAttributes<HTMLHeadingElement>;
  multiline?: boolean;
  inputSuffix?: ReactElement;
}

export default function TextField({
  InputProps,
  label,
  helperText,
  helperTextProps,
  multiline,
  LabelProps,
  inputSuffix,
  ...props
}: Props) {
  return (
    <div {...props} className={`flex gap-1 flex-col w-full ${props.className}`}>
      {label && (
        <label
          {...LabelProps}
          htmlFor={InputProps?.id}
          className={`text-[.9rem] font-light ${LabelProps?.className}`}
        >
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        {multiline ? (
          <textarea
            {...InputProps}
            className={cn(
              "w-full h-[150px] px-2 py-[.65rem] outline-none text-[#444] text-[.8rem] border-2 border-gray-600 focus:border-mainLight resize-none",
              InputProps?.className,
            )}
          />
        ) : (
          <input
            {...InputProps}
            className={cn(
              "w-full px-2 py-[.65rem] outline-none text-[#444] text-[.8rem] border-2 border-gray-600 focus:border-mainLight",
              InputProps?.className,
            )}
          />
        )}
        {inputSuffix}
      </div>

      {helperText && (
        <p
          {...helperTextProps}
          className={`pl-2 text-red-500 text-[.8rem] ${helperTextProps?.className}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
