"use client";

import { useState } from "react";
import { DEFAULT_TARIFFS, type TariffSnapshot } from "@/lib/tariffs";

export function useTariffs() {
  const [tariffs] = useState<TariffSnapshot>(DEFAULT_TARIFFS);
  const status = "Тарифы из версии сайта";
  return { tariffs, status };
}
