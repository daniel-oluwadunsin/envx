import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export type AxiosErrorShape = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function errorHandler<T = AxiosErrorShape | string>(error: any): T {
  const extractedError =
    typeof error === "object" && "response" in error
      ? error.response?.data?.message ||
        error.response?.data?.error ||
        error.message
      : error;

  toast.error(String(extractedError) || "An unknown error occurred");

  throw extractedError as T;
}
