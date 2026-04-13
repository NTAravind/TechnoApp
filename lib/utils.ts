import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  style: "currency",
  minimumFractionDigits: 0,
})

export function fcurrency(amount: number) {
  return CURRENCY_FORMATTER.format(amount)
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

export function fnumber(number: number) {
  return NUMBER_FORMATTER.format(number)
}
