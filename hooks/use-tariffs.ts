"use client";
import {useState} from 'react';
import {DEFAULT_TARIFFS,type TariffSnapshot} from '@/lib/tariffs';

export const TARIFF_ORIGIN='';

// Tariffs are part of the deployed application. No Supabase requests are made
// when visitors open calculators or perform calculations.
export function useTariffs(){
 const [tariffs] = useState<TariffSnapshot>(DEFAULT_TARIFFS);
 const status = 'Тарифы из версии сайта';
 return {tariffs,status};
}
