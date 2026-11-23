import { queryOptions } from "@tanstack/react-query";
import { storesService } from "./stores.service";
import type { StoreFilters } from "./types";

export const featuredStoresQuery = () => queryOptions({ queryKey: ["stores", "featured"], queryFn: storesService.featured });
export const storesQuery = (f: StoreFilters) => queryOptions({ queryKey: ["stores", f], queryFn: () => storesService.list(f) });
