"use client";

export function get_status_color(status: string | null | undefined) {
  if (status === "success") return "green";
  else if (status === "info") return "blue";
  else if (status === "warning") return "orange";
  else if (status === "danger") return "red";
  else return "text.secondary";
}
