"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChartNoAxesCombined, Copy, House, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatInput } from "@/lib/calculator";
import { calculateMortgage, type MortgageMode } from "@/lib/mortgage";

const rubles = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 6 });
const configs: { mode: MortgageMode; title: string; description: string; labels: string[]; defaults: string[]; resultLabel: string }[] = [
  { mode: "part", title: "Рассчитать первоначальный взнос", description: "Узнайте сумму ПВ исходя из стоимости ОН и %ПВ", labels: ["Стоимость объекта, ₽", "Первоначальный взнос, %"], defaults: ["", "20,1"], resultLabel: "Сумма первоначального взноса" },
  { mode: "whole", title: "Рассчитать бюджет по ПВ", description: "Определите бюджет по первоначальному взносу", labels: ["Сумма первоначального взноса, ₽", "Первоначальный взнос, %"], defaults: ["", "20,1"], resultLabel: "Стоимость объекта недвижимости" },
  { mode: "adjustment", title: "Рассчитать стоимость при частичном ПВ", description: "Рассчитайте стоимость ОН с учетом ЧПВ клиента и необходимого %ПВ", labels: ["Стоимость объекта, ₽", "Сумма первоначального взноса, ₽", "Необходимый первоначальный взнос, %"], defaults: ["", "", "20,1"], resultLabel: "Стоимость с расчётной корректировкой" },
];

const formulas: Record<MortgageMode, string> = {
  part: "Стоимость ОН × % ПВ",
  whole: "Сумма ПВ × 100 ÷ % ПВ",
  adjustment: "Стоимость ОН × 100 ÷ (100 − недостающий % ПВ)",
};

const themes = {
  part: { background: "bg-[#FCEBEA]", accent: "text-[#A94442]", border: "border-[#F3DAD8]", link: "border-[#F3DAD8] bg-[#FFFAFA] text-[#A94442] hover:bg-[#FCEBEA]" },
  whole: { background: "bg-[#FBF4E5]", accent: "text-[#80682F]", border: "border-[#E7DDC8]", link: "border-[#E7DDC8] bg-[#FBF4E5] text-[#80682F] hover:bg-[#F5EBD4]" },
  adjustment: { background: "bg-[#EAF2FB]", accent: "text-[#536A84]", border: "border-[#D6E2F0]", link: "border-[#D6E2F0] bg-[#EAF2FB] text-[#536A84] hover:bg-[#DFEAF7]" },
};

function MortgageInput({ id, label, value, money, suffix, placeholder, onChange }: { id: string; label: string; value: string; money: boolean; suffix?: string; placeholder: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const cursor = useRef<number | null>(null);
  const [, render] = useState(0);
  useLayoutEffect(() => {
    if (cursor.current !== null) { ref.current?.setSelectionRange(cursor.current, cursor.current); cursor.current = null; }
  });
  return <div><label htmlFor={id} className="mb-3 block text-sm font-semibold">{label}</label><div className="relative"><input id={id} ref={ref} value={value} inputMode="decimal" enterKeyHint="done" autoComplete="off" placeholder={placeholder} onFocus={event => { if (money && value === "0") event.currentTarget.select(); }} onClick={event => { if (money && value === "0") event.currentTarget.select(); }} onKeyDown={event => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.blur(); }
  }} onChange={event => {
    const raw = event.target.value;
    const position = event.target.selectionStart ?? raw.length;
    const significant = raw.slice(0, position).replace(/\s/g, "").length;
    const next = money ? formatInput(raw) : raw;
    let index = 0, count = 0;
    while (index < next.length && count < significant) { if (!/\s/.test(next[index])) count++; index++; }
    cursor.current = index; onChange(next); render(n => n + 1);
  }} className={`h-[54px] w-full rounded-xl border border-[#E4E8ED] bg-[#F7F8FA] px-4 ${suffix ? "pr-11" : ""} text-lg font-medium tabular-nums outline-none placeholder:text-sm placeholder:font-normal placeholder:text-[#8993A2] focus:border-[#E83C35] focus:ring-4 focus:ring-[#E83C35]/10`} />{suffix && <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-[#7B8797]">{suffix}</span>}</div></div>;
}

function MortgageCard({ config }: { config: typeof configs[number] }) {
  const [values, setValues] = useState(config.defaults);
  const result = calculateMortgage(config.mode, values);
  const Icon = config.mode === "part" ? Wallet : config.mode === "adjustment" ? ChartNoAxesCombined : House;
  const adjustment = config.mode === "adjustment";
  const downPayment = adjustment && result.status === "ok" ? calculateMortgage("part", [String(result.total), values[2]]) : null;
  const theme = themes[config.mode];
  const copy = async () => {
    if (result.status !== "ok") return;
    try { await navigator.clipboard.writeText(`${rubles.format(result.total)} ₽`); toast.success("Сумма скопирована в буфер обмена"); }
    catch { toast.error("Не удалось скопировать сумму. Выделите и скопируйте её вручную."); }
  };
  return <section id={`mortgage-${config.mode}`} tabIndex={-1} aria-labelledby={`mortgage-${config.mode}-title`} className={`min-w-0 scroll-mt-6 rounded-3xl border border-[#EBEEF2] bg-white p-6 outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#26364A] sm:p-8 ${adjustment ? "lg:col-span-2" : ""}`}>
    <div className="mb-4 flex items-center gap-3"><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${theme.background} ${theme.accent}`}><Icon className="size-5" /></span><h2 id={`mortgage-${config.mode}-title`} className="text-xl font-semibold leading-snug tracking-tight">{config.title}</h2></div>
    <p className="mb-6 text-sm leading-relaxed text-[#748195]">{config.description}</p>
    <div className={adjustment ? "grid min-w-0 gap-6 lg:grid-cols-2" : ""}>
      <div className="space-y-4">{config.labels.map((label, index) => <MortgageInput key={label} id={`mortgage-${config.mode}-${index}`} label={label} value={values[index]} money={index === 0 || (adjustment && index === 1)} suffix={index === config.labels.length - 1 ? "%" : "₽"} placeholder={index === config.labels.length - 1 ? "Введите число" : index === 0 && config.mode !== "whole" ? "Введите стоимость" : "Введите сумму"} onChange={value => setValues(previous => previous.map((old, i) => i === index ? value : old))} />)}</div>
      <div aria-live="polite" aria-atomic="true" className={`min-w-0 rounded-2xl border p-5 ${theme.background} ${theme.border} ${adjustment ? "" : "mt-5"}`}>
        <div className="flex items-start justify-between gap-3"><p className="text-xs font-medium leading-relaxed text-[#6E7886]">{result.status === "sufficient" ? "Первоначальный взнос" : config.resultLabel}</p><button type="button" disabled={result.status !== "ok"} onClick={copy} aria-label={`Скопировать: ${config.title}`} className={`shrink-0 rounded-lg p-1 outline-offset-2 hover:bg-white/60 focus-visible:outline-2 disabled:opacity-30 ${theme.accent}`}><Copy className="size-4" /></button></div>
        <output data-testid={`mortgage-result-${config.mode}`} className={`mt-3 block break-words ${result.status === "sufficient" ? "text-base sm:text-lg" : "text-[32px]"} font-semibold leading-tight tracking-tight tabular-nums ${theme.accent}`}>{result.status === "ok" ? <span className="whitespace-nowrap">{rubles.format(result.total)} ₽</span> : result.status === "sufficient" ? <><span data-testid="mortgage-sufficient-percent" className="block whitespace-nowrap text-base font-bold sm:text-lg">У клиента {percent.format(result.clientPercent)}% ПВ</span></> : "-"}</output>
        {result.status === "ok" && adjustment && <dl className={`mt-5 space-y-3 border-t pt-4 text-xs ${theme.border}`}><div className="flex flex-wrap justify-between gap-2"><dt className="text-[#6E7886]">Первоначальный взнос у клиента</dt><dd data-testid="mortgage-client-percent" className="font-medium">{percent.format(result.clientPercent!)} %</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-[#6E7886]">Сколько % ПВ не хватает для ипотеки</dt><dd data-testid="mortgage-missing-percent" className="font-medium">{percent.format(result.missingPercent!)} %</dd></div></dl>}
        <p role={result.status === "error" ? "alert" : undefined} className={`mt-3 break-words text-xs leading-relaxed ${result.status === "error" ? "text-[#A94442]" : "text-[#6E7886]"}`}>{result.status === "error" ? result.message : result.status === "empty" ? "Заполните все поля для расчёта" : result.status === "sufficient" ? "Корректировка стоимости не требуется." : <>{config.mode === "part" ? result.formula.replace(/ ÷ 100$/, "%") : result.formula} = <span className="whitespace-nowrap">{rubles.format(result.total)} ₽</span></>}</p>
        {result.status === "ok" && <p data-testid={`mortgage-formula-explanation-${config.mode}`} className="mt-2 break-words text-xs leading-relaxed text-[#6E7886]">{formulas[config.mode]}</p>}
        {downPayment && <div className={`mt-4 border-t pt-4 ${theme.border}`}>
          <p className="text-xs font-medium text-[#6E7886]">Сумма первоначального взноса</p>
          <output data-testid="mortgage-adjustment-down-payment" className={`mt-2 block text-xl font-semibold tabular-nums ${theme.accent}`}>
            {downPayment.status === "ok" ? <span className="whitespace-nowrap">{rubles.format(downPayment.total)} ₽</span> : "-"}
          </output>
          {downPayment.status === "ok" && <p data-testid="mortgage-down-payment-formula" className="mt-3 break-words text-xs leading-relaxed text-[#6E7886]">{downPayment.formula} = <span className="whitespace-nowrap">{rubles.format(downPayment.total)} ₽</span></p>}
          {downPayment.status === "error" && <p role="alert" className="mt-2 text-xs text-[#A94442]">{downPayment.message}</p>}
        </div>}
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EBEEF2] pt-4"><p className="text-xs text-[#748195]">Автоматический расчёт</p><button type="button" aria-label={`Сбросить: ${config.title}`} onClick={() => setValues(previous => previous.map((value, i) => i === previous.length - 1 ? value : ""))} className="flex items-center gap-1.5 rounded-md py-1 text-xs font-medium text-[#647184] outline-offset-4 hover:text-[#E83C35] focus-visible:outline-2"><RotateCcw className="size-3.5" />Сбросить</button></div>
  </section>;
}

export function MortgageCalculators() {
  const [activeMode, setActiveMode] = useState<MortgageMode | null>("part");
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let previousY = window.scrollY;
    const resetOnReturn = () => {
      const currentY = window.scrollY;
      const navigation = navigationRef.current;
      if (currentY <= previousY && navigation && navigation.getClientRects().length > 0 && navigation.getBoundingClientRect().top >= 0) {
        setActiveMode(null);
      }
      previousY = currentY;
    };
    window.addEventListener("scroll", resetOnReturn, { passive: true });
    return () => window.removeEventListener("scroll", resetOnReturn);
  }, []);
  return <div><div className="mb-5 lg:hidden"><nav ref={navigationRef} aria-label="Выберите нужный расчёт" className="grid grid-cols-[.7fr_1fr_1.25fr] border-b border-[#E4E8ED]">{configs.map(config => <a key={config.mode} href={`#mortgage-${config.mode}`} aria-label={config.title} aria-current={activeMode === config.mode ? "location" : undefined} onClick={event => {
    event.preventDefault();
    setActiveMode(config.mode);
    const target = document.getElementById(`mortgage-${config.mode}`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }} className={`inline-flex min-h-11 min-w-0 items-center justify-center whitespace-nowrap border-b-2 px-[3px] py-2 text-sm leading-5 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#26364A] ${activeMode === config.mode ? "border-[#E83C35] text-[#26364A]" : "border-transparent text-[#647184] hover:border-[#C5CDD8] hover:text-[#26364A]"}`}>{config.mode === "part" ? "Взнос" : config.mode === "whole" ? "Бюджет" : "Частичный ПВ"}</a>)}</nav></div><div className="grid items-start gap-6 lg:grid-cols-2">{configs.map(config => <MortgageCard key={config.mode} config={config} />)}</div>
    <section aria-label="Округление расчётов" className="mt-8 rounded-3xl border border-[#EBEEF2] bg-white p-6 sm:p-8">
      <p className="-mx-3 text-center text-[11px] leading-loose text-[#7B8797] min-[375px]:text-xs sm:mx-0 sm:text-sm"><span className="block whitespace-nowrap">Расчёт без промежуточного округления</span><span className="block whitespace-nowrap">Итог округляется вверх до целого рубля</span></p>
    </section>
  </div>;
}
