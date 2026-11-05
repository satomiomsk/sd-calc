"use client";
import {useCallback,useEffect,useState} from 'react';
import {DEFAULT_TARIFFS,validateTariffs,type TariffSnapshot} from '@/lib/tariffs';
export const TARIFF_ORIGIN='';
const KEY='sd-preview-bundled-tariffs-v1';
export function useTariffs(){
 const [tariffs,setTariffs]=useState<TariffSnapshot>(DEFAULT_TARIFFS);
 const [status,setStatus]=useState('Встроенные условия');
 const refresh=useCallback(async()=>{
  const url='/api/tariffs';
  try{const res=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!res.ok)throw new Error();const snapshot:unknown=await res.json();validateTariffs(snapshot);setTariffs(snapshot);try{localStorage.setItem(KEY,JSON.stringify(snapshot));setStatus(snapshot.version === 0 ? 'Встроенные условия' : 'Условия обновлены');}catch{setStatus('Условия обновлены, но не сохранены на устройстве');}}
  catch{setStatus('Нет обновления - используются сохранённые условия');}
 },[]);
 useEffect(()=>{try{const value=localStorage.getItem(KEY);if(value){const snapshot:unknown=JSON.parse(value);validateTariffs(snapshot);setTariffs(snapshot);}}catch{/* Keep bundled tariffs if storage is unavailable or corrupted. */}void refresh();const onVisible=()=>{if(document.visibilityState==='visible')void refresh();};const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},300000);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',onVisible);return()=>{clearInterval(timer);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',onVisible);};},[refresh]);
 return {tariffs,status};
}
