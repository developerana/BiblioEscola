import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza texto para buscas: remove acentos e ignora maiúsculas/minúsculas.
 * Ex: "Ação" e "acao" são considerados iguais.
 */
export function normalizeText(text: string | null | undefined): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Verifica se `text` contém `query`, ignorando acentos e capitalização. */
export function textMatches(text: string | null | undefined, query: string): boolean {
  return normalizeText(text).includes(normalizeText(query));
}
