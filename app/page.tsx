"use client";

import Image from "next/image";
import localFont from "next/font/local";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { ArrowLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, HousePlus, KeyRound, WalletCards, Calculator, House, Instagram, Sparkles, History, Settings, type LucideIcon } from "lucide-react";
import { CommissionCalculator } from "@/components/commission-calculator";
import { MortgageCalculators } from "@/components/mortgage-calculators";
import { LegalFooter } from "@/components/legal-footer";
import { LoanCalculator } from "@/components/loan-calculator";
import type { Operation } from "@/lib/calculator";
import { useTariffs } from "@/hooks/use-tariffs";

const navigationFont = localFont({ src: "../public/fonts/OnestVariable.ttf", display: "swap", weight: "100 900" });
const headingFont = localFont({ src: "../public/fonts/MontserratVariable.ttf", display: "swap", weight: "100 900" });
const publicAsset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

type Screen = "home" | "commission" | "mortgage";
const titles = { commission: "Комиссия", mortgage: "Ипотека" };

function NavigationRow({ title, icon: Icon, red, onClick }: { title: string; icon: LucideIcon; red?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`group flex min-h-16 w-full min-w-0 items-center gap-3 px-4 py-2 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:min-h-[84px] sm:gap-4 sm:px-4 sm:py-5 max-sm:[@media(max-height:650px)]:min-h-14 max-sm:[@media(max-height:650px)]:gap-2 max-sm:[@media(max-height:650px)]:px-3 max-sm:[@media(max-height:650px)]:py-1.5 ${red ? "bg-white hover:bg-[#FFF7F6] focus-visible:outline-[#A72A25]" : "bg-white hover:bg-[#F5F7FA] focus-visible:outline-[#26364A]"} text-[#26364A]`}>
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] border transition-colors sm:size-12 max-sm:[@media(max-height:650px)]:size-9 ${red ? "border-transparent bg-[#FCEBEA] text-[#E83C35] group-hover:bg-[#F9DFDD]" : "border-transparent bg-[#EEF1F5] text-[#26364A] group-hover:bg-[#E4E9F0]"}`}><Icon aria-hidden="true" className="size-[23px] sm:size-6" strokeWidth={1.7} /></span>
    <span className="min-w-0 flex-1 text-sm font-medium leading-5 tracking-normal sm:text-base sm:leading-relaxed max-sm:[@media(max-height:650px)]:text-[13px] max-sm:[@media(max-height:650px)]:leading-[18px]">{title}</span>
    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors max-sm:[@media(max-height:650px)]:size-5 text-[#8993A2] group-hover:bg-white group-hover:text-[#26364A]`}><ChevronRight aria-hidden="true" className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5" /></span>
  </button>;
}

export default function Home() {
  const { tariffs, status: tariffStatus } = useTariffs();
  const [screen, setScreen] = useState<Screen>("home");
  const [operation, setOperation] = useState<Operation>("sale");
  const [mortgageTab, setMortgageTab] = useState<"downpayment" | "loan">("downpayment");
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let listener: { remove: () => Promise<void> } | undefined;
    App.addListener("backButton", ({ canGoBack }) => {
      if (screen !== "home") {
        // Android system back gesture/button should return to the app's home screen.
        setScreen("home");
        window.history.replaceState({ ...window.history.state, sdScreen: "home" }, "");
        window.scrollTo({ top: 0, behavior: "instant" });
      } else if (!canGoBack) {
        void App.exitApp();
      } else {
        window.history.back();
      }
    }).then(handle => {
      if (active) listener = handle;
      else void handle.remove();
    });
    return () => {
      active = false;
      if (listener) void listener.remove();
    };
  }, [screen]);
  useEffect(() => {
    // Keep calculator navigation in the same document, preserving all input state.
    window.history.replaceState({ ...window.history.state, sdScreen: "home" }, "");
    const onBack = (event: PopStateEvent) => {
      const next = event.state?.sdScreen;
      setScreen(next === "commission" || next === "mortgage" ? next : "home");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);
  const navigate = (next: Screen, calculator?: Operation | "downpayment" | "loan") => {
    if (next === "home" && screen !== "home" && (window.history.state?.sdScreen === "commission" || window.history.state?.sdScreen === "mortgage")) {
      window.history.back();
      return;
    }
    if (next === "commission") setOperation(calculator === "purchase" ? "purchase" : "sale");
    if (next === "mortgage") setMortgageTab(calculator === "loan" ? "loan" : "downpayment");
    if (next !== screen) window.history.pushState({ ...window.history.state, sdScreen: next }, "");
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return <div className={`min-h-screen bg-[#F5F7FA] text-[#26364A] ${screen === "home" ? "max-sm:flex max-sm:min-h-dvh max-sm:flex-col" : ""}`}>
    <header className="border-b border-[#E7EBF0] bg-white">
      <div className="mx-auto flex min-h-20 max-w-[1200px] flex-nowrap items-center justify-between gap-x-2 px-4 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-4 sm:gap-x-4 sm:px-8 max-sm:min-h-16 max-sm:pt-[calc(.75rem+env(safe-area-inset-top,0px))] max-sm:pb-3">
        <a href="#" onClick={event => { event.preventDefault(); navigate("home"); }} aria-label="Калькулятор SD - главная" className="flex shrink-0 items-center gap-1 rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#E83C35] sm:gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md min-[375px]:size-8 sm:size-10"><Image src={publicAsset("/images/sd-calculator-logo.png")} alt="Логотип SD" width={40} height={40} unoptimized className="size-full object-contain" /></span>
          <span className="whitespace-nowrap text-[13px] font-semibold tracking-tight min-[375px]:text-sm sm:text-[18px]">SvDemidenko</span>
        </a>
        <div className="ml-auto flex shrink-0 items-center gap-2 min-[375px]:gap-2.5 sm:gap-3">
          <div className="flex w-fit items-center gap-1 whitespace-nowrap rounded-full border border-[#F3C7C5] bg-[#FCEBEA] px-2 py-[5px] text-left text-[9px] font-medium leading-[14px] text-[#A94442] min-[375px]:text-[10px] sm:gap-1.5 sm:px-[15px] sm:py-[7.5px] sm:text-[11.25px] sm:leading-[18px]"><Sparkles aria-hidden="true" className="size-2.5 shrink-0 text-[#E83C35] sm:size-3" />Alpha Team</div>
          <span title="История" aria-label="История" className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#E7EBF0] bg-white text-[#26364A] sm:size-10"><History aria-hidden="true" className="size-[17px] sm:size-5" strokeWidth={1.8} /></span>
          <span title="Настройки" aria-label="Настройки" className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#E7EBF0] bg-white text-[#26364A] sm:size-10"><Settings aria-hidden="true" className="size-[17px] sm:size-5" strokeWidth={1.8} /></span>
        </div>
      </div>
    </header>
    <main className={`mx-auto max-w-[1200px] px-5 pb-14 sm:px-8 ${screen === "home" ? "pt-6 sm:pt-8 max-sm:w-full max-sm:flex-1 max-sm:pt-3 max-sm:pb-4 max-sm:[@media(max-height:650px)]:pb-2" : "pt-3 sm:pt-6"}`}>
      {screen === "home" && <div className="mb-8 translate-y-3 text-center max-sm:mb-4 max-sm:[@media(max-height:650px)]:mb-3 max-sm:[@media(max-height:650px)]:translate-y-2"><h1 className="text-[40px] font-bold tracking-[-0.045em] sm:text-[54px] max-sm:text-[32px] max-sm:[@media(max-height:650px)]:text-[28px]">Калькулятор <span className="text-[#E83C35]">SD</span></h1><p className="mt-1 text-[13px] text-[#748195] sm:mt-2 sm:text-base">Выберите раздел для расчёта</p></div>}
      {screen !== "home" && <div className="mb-4 flex items-center justify-between gap-3"><button type="button" onClick={() => navigate("home")} className="inline-flex min-h-10 items-center gap-2 rounded-lg py-2 text-sm font-medium text-[#647184] hover:text-[#E83C35] focus-visible:outline-2 focus-visible:outline-offset-4"><ArrowLeft className="size-4" />На главный экран</button><h1 className="text-xl font-semibold tracking-tight sm:text-3xl">{titles[screen]}</h1></div>}
      {screen === "home" && <div className={`${navigationFont.className} mx-auto max-w-[900px] space-y-4 sm:space-y-7 max-sm:pt-[clamp(0px,calc((100dvh-568px)*0.18),32px)] max-sm:[@media(max-height:650px)]:space-y-3`}>
        <section aria-labelledby="home-commission-title" className="overflow-hidden rounded-2xl border border-[#F0DBD9] bg-white shadow-[0_4px_20px_#26364A05]">
          <h2 id="home-commission-title" className={`${headingFont.className} bg-[#E83C35] px-4 py-2 text-[15px] leading-4 font-semibold tracking-normal text-white sm:px-5 sm:py-3 sm:text-base sm:leading-5`}>Комиссия</h2>
          <div>
            <NavigationRow title="Расчёт комиссии при продаже" icon={HousePlus} red onClick={() => navigate("commission", "sale")} />
            <div className="mr-4 ml-[68px] border-t border-[#EBEEF2] sm:mr-5 sm:ml-[80px]" />
            <NavigationRow title="Расчёт комиссии при покупке" icon={KeyRound} red onClick={() => navigate("commission", "purchase")} />
          </div>
        </section>
        <section aria-labelledby="home-mortgage-title" className="overflow-hidden rounded-2xl border border-[#E1E6ED] bg-white shadow-[0_4px_20px_#26364A05]">
          <h2 id="home-mortgage-title" className={`${headingFont.className} bg-[#26364A] px-4 py-2 text-[15px] leading-4 font-semibold tracking-normal text-white sm:px-5 sm:py-3 sm:text-base sm:leading-5`}>Ипотека</h2>
          <div>
            <NavigationRow title="Расчёт по первоначальному взносу" icon={WalletCards} onClick={() => navigate("mortgage", "downpayment")} />
            <div className="mr-4 ml-[68px] border-t border-[#EBEEF2] sm:mr-5 sm:ml-[80px]" />
            <NavigationRow title="Кредитный калькулятор" icon={Calculator} onClick={() => navigate("mortgage", "loan")} />
          </div>
        </section>
      </div>}
      {screen === "commission" && <div role="group" aria-label="Калькуляторы комиссии" className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-[#E4E8ED] bg-[#EEF1F5] p-1.5">
        {(["sale", "purchase"] as const).map(value => <button key={value} type="button" aria-pressed={operation === value} onClick={() => setOperation(value)} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E83C35] sm:text-base ${operation === value ? value === "sale" ? "bg-[#E83C35] text-white shadow-sm" : "bg-[#26364A] text-white shadow-sm" : "bg-white text-[#647184] hover:bg-[#FFF7F6]"}`}>{value === "sale" ? <ArrowUpRight className="size-5 shrink-0" /> : <ArrowDownLeft className="size-5 shrink-0" />}{value === "sale" ? "Продажа" : "Покупка"}</button>)}
      </div>}
      {screen === "mortgage" && <div role="group" aria-label="Калькуляторы ипотеки" className="mb-4 grid grid-cols-2 gap-1.5 rounded-[14px] border border-[#E4E8ED] bg-[#EEF1F5] p-1 sm:flex sm:gap-2 sm:overflow-x-auto sm:rounded-2xl sm:p-1.5">
        {(["downpayment", "loan"] as const).map(value => <button key={value} type="button" aria-pressed={mortgageTab === value} onClick={() => setMortgageTab(value)} className={`flex min-h-[60px] min-w-0 items-center justify-center gap-1.5 text-balance rounded-[10px] px-1.5 py-2 text-sm leading-[19px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#26364A] sm:min-h-14 sm:min-w-max sm:flex-1 sm:gap-2 sm:whitespace-nowrap sm:rounded-xl sm:px-4 sm:py-3 sm:text-base ${mortgageTab === value ? value === "downpayment" ? "bg-[#E83C35] text-white shadow-sm" : "bg-[#26364A] text-white shadow-sm" : "bg-white text-[#647184] hover:bg-[#F7F8FA]"}`}>{value === "downpayment" ? <House className="size-[18px] shrink-0 sm:size-5" /> : <Calculator className="size-[18px] shrink-0 sm:size-5" />}<span>{value === "downpayment" ? <><span className="sm:hidden">Расчёт по ПВ</span><span className="hidden sm:inline">Расчёт по первоначальному взносу</span></> : "Кредитный калькулятор"}</span></button>)}
      </div>}
      <div hidden={screen !== "commission"}><CommissionCalculator operation={operation} tariffs={tariffs} tariffStatus={tariffStatus} /></div>
      <div hidden={screen !== "mortgage" || mortgageTab !== "loan"}><LoanCalculator /></div>
      <div hidden={screen !== "mortgage" || mortgageTab !== "downpayment"}><MortgageCalculators /></div>
    </main>
    <footer className={`mx-auto max-w-[1200px] px-5 pb-7 sm:px-8 ${screen === "home" ? "max-sm:w-full max-sm:pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]" : ""}`}>
      <div className={`flex w-full flex-col items-center justify-center gap-4 border px-4 sm:gap-5 ${screen === "home" ? "mx-auto mt-0 max-w-[900px] rounded-2xl border-[#E4E8ED] bg-white py-5 max-sm:py-2 sm:mt-6 sm:py-6" : "rounded-3xl border-[#F3DAD8] bg-[#FFF7F6] py-2 sm:py-3"}`}>
        <div className="flex items-center justify-center gap-4 sm:gap-6">
        <div className="relative shrink-0">
          <Image src={publicAsset("/images/svdemidenko-portrait-v3.png")} alt="Портрет SvDemidenko" width={512} height={512} unoptimized className={`block aspect-square size-20 shrink-0 rounded-full border-[3px] border-white object-contain object-center shadow-sm sm:size-28 ${screen === "home" ? "max-sm:size-14 max-sm:[@media(max-height:650px)]:size-12" : ""}`} />
        </div>
        <div className="min-w-0 text-left">
          <nav aria-label="Социальные сети" className="flex items-center gap-0 sm:gap-1">
            {[
              { name: "Instagram", href: "https://www.instagram.com/svdemidenko/", icon: "instagram" },
              { name: "MAX", href: "https://max.ru/u/f9LHodD0cOK4HS3ILV9kidFm5zkxzt0iRbfZYiViC9zB7MF8pvVrcAskwJk", icon: "max" },
              { name: "ВКонтакте", href: "https://vk.ru/lanaomsk", icon: "vk" },
              { name: "Telegram", href: "https://t.me/svdemidenko", icon: "telegram" },
            ].map(social => <a key={social.icon} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.name} title={social.name} className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[#647184] outline-offset-2 transition-colors hover:bg-white hover:text-[#26364A] focus-visible:outline-2 focus-visible:outline-[#A94442] min-[375px]:size-11">{social.icon === "instagram" ? <Instagram aria-hidden="true" className="size-7" strokeWidth={1.7} /> : <Image src={publicAsset(`/images/social-${social.icon}.svg`)} alt="" width={28} height={28} unoptimized className="size-7" />}</a>)}
          </nav>
        </div>
        </div>
      </div>
      <LegalFooter />
    </footer>
  </div>;
}
