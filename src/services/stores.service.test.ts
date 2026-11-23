import { describe, expect, it } from "vitest";
import { STORES } from "@/data/mock";
import { filterStores } from "./stores.service";

describe("filterStores", () => {
  it("filters by emirate", () => {
    expect(filterStores(STORES, { emirate: "dubai" }).every((s) => s.emirate === "dubai")).toBe(true);
  });
  it("combines emirate and category", () => {
    expect(filterStores(STORES, { emirate: "sharjah", category: "bakery" }).map((s) => s.id).sort()).toEqual(["khobz-al-fareej", "maamoul-sara"]);
  });
  it("all mock stores are flagged as demo", () => {
    expect(STORES.every((s) => s.isDemo)).toBe(true);
  });
});
