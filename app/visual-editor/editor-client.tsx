"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Picked = { tag: string; text: string; color: string; background: string; fontSize: string };
const PREVIEW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function VisualEditorPage() {
  const frame = useRef<HTMLIFrameElement>(null);
  const selected = useRef<HTMLElement | null>(null);
  const previousOutline = useRef("");
  const [item, setItem] = useState<Picked | null>(null);
  const [notice, setNotice] = useState("Нажмите на любой элемент сайта слева, чтобы выбрать его");
  const [textValue, setTextValue] = useState("");
  const [color, setColor] = useState("#26364A");
  const [background, setBackground] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState("16");
  const [mode, setMode] = useState<"select" | "test">("select");

  const attachPicker = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    if (mode === "select") {
      doc.body.addEventListener("click", onPreviewClick, true);
      doc.addEventListener("mouseover", onPreviewHover, true);
      doc.addEventListener("mouseout", onPreviewOut, true);
    } else {
      doc.body.removeEventListener("click", onPreviewClick, true);
      doc.removeEventListener("mouseover", onPreviewHover, true);
      doc.removeEventListener("mouseout", onPreviewOut, true);
    }
    setNotice("Предпросмотр готов. Нажмите на текст, кнопку или блок.");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function onPreviewHover(event: Event) {
    const el = event.target as HTMLElement;
    if (!el || el === selected.current || el.closest("[data-editor-ui]")) return;
    el.style.cursor = "crosshair";
  }
  function onPreviewOut(event: Event) {
    const el = event.target as HTMLElement;
    if (el && el !== selected.current) el.style.cursor = "";
  }
  function onPreviewClick(event: Event) {
    const el = event.target as HTMLElement;
    if (!el || el.closest("[data-editor-ui]")) return;
    event.preventDefault();
    event.stopPropagation();
    if (selected.current) selected.current.style.outline = previousOutline.current;
    selected.current = el;
    previousOutline.current = el.style.outline;
    el.style.outline = "2px solid #E83C35";
    const style = frame.current?.contentWindow?.getComputedStyle(el);
    const next = {
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 160),
      color: rgbToHex(style?.color || "rgb(38,54,74)"),
      background: rgbToHex(style?.backgroundColor || "rgb(255,255,255)"),
      fontSize: style?.fontSize.replace("px", "") || "16",
    };
    setItem(next);
    setTextValue(next.text);
    setColor(next.color);
    setBackground(next.background);
    setFontSize(next.fontSize);
    setNotice("Выбран элемент: " + next.tag);
  }
  function rgbToHex(value: string) {
    const parts = value.match(/\d+/g);
    if (!parts || parts.length < 3) return "#FFFFFF";
    return "#" + parts.slice(0, 3).map(n => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  function applyChanges() {
    const el = selected.current;
    if (!el) return;
    if (textValue !== item?.text && el.children.length === 0) el.textContent = textValue;
    el.style.color = color;
    el.style.backgroundColor = background;
    el.style.fontSize = fontSize + "px";
    setNotice("Изменения показаны в предпросмотре. Исходный сайт не затронут.");
  }
  function clearSelection() {
    if (selected.current) selected.current.style.outline = previousOutline.current;
    selected.current = null;
    setItem(null);
    setNotice("Выбор снят. Нажмите на другой элемент.");
  }

  useEffect(() => () => {
    const doc = frame.current?.contentDocument;
    doc?.body?.removeEventListener("click", onPreviewClick, true);
    doc?.removeEventListener("mouseover", onPreviewHover, true);
    doc?.removeEventListener("mouseout", onPreviewOut, true);
  }, []);

  return <main className="min-h-screen bg-[#eef1f5] text-[#26364a]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe4eb] bg-white px-5 py-4">
      <div><h1 className="text-xl font-bold">Визуальный редактор SD</h1><p className="text-sm text-[#748195]">Тестовый режим — изменения не сохраняются на сайте</p></div>
      <div className="flex items-center gap-2"><a href={`${PREVIEW_BASE_PATH}/`} className="rounded-xl border border-[#dfe4eb] px-4 py-2 text-sm font-medium hover:bg-[#f5f7fa]">Открыть сайт отдельно ↗</a><button onClick={async () => { await fetch("/api/developer/session", { method: "DELETE" }); window.location.href = "/developer"; }} className="rounded-xl border border-[#dfe4eb] px-4 py-2 text-sm font-medium hover:bg-[#f5f7fa]">Выйти</button></div>
    </header>
    <div className="grid min-h-[calc(100vh-81px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-[70vh] p-3 sm:p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-[#748195]"><span>ПРЕДПРОСМОТР САЙТА</span><span>Нажимайте на элементы для выбора</span></div>
        <div className="h-[75vh] overflow-hidden rounded-2xl border border-[#dfe4eb] bg-white shadow-sm">
          <iframe ref={frame} src={`${PREVIEW_BASE_PATH}/`} title="Предпросмотр сайта SD" onLoad={attachPicker} className="h-full w-full border-0" />
        </div>
      </section>
      <aside className="border-t border-[#dfe4eb] bg-white p-5 lg:border-t-0 lg:border-l">
        <h2 className="text-base font-semibold">Настройки элемента</h2>
        <p className="mt-2 rounded-xl bg-[#f5f7fa] p-3 text-xs leading-5 text-[#647184]">{notice}</p>
        {item ? <div className="mt-5 space-y-4">
          <div className="text-xs text-[#748195]">Тип элемента: <b className="text-[#26364a]">{item.tag}</b></div>
          <label className="block text-sm font-medium">Текст
            <textarea value={textValue} onChange={e => setTextValue(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-[#dfe4eb] p-2 text-sm font-normal outline-none focus:border-[#e83c35]" />
          </label>
          <label className="flex items-center justify-between text-sm">Цвет текста <input aria-label="Цвет текста" type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded border-0" /></label>
          <label className="flex items-center justify-between text-sm">Цвет фона <input aria-label="Цвет фона" type="color" value={background} onChange={e => setBackground(e.target.value)} className="h-9 w-14 cursor-pointer rounded border-0" /></label>
          <label className="block text-sm">Размер текста: <b>{fontSize} px</b><input type="range" min="10" max="48" value={fontSize} onChange={e => setFontSize(e.target.value)} className="mt-2 w-full accent-[#e83c35]" /></label>
          <button onClick={applyChanges} className="w-full rounded-xl bg-[#e83c35] px-4 py-3 text-sm font-semibold text-white hover:bg-[#c92f29]">Применить в предпросмотре</button>
          <button onClick={clearSelection} className="w-full rounded-xl border border-[#dfe4eb] px-4 py-2 text-sm hover:bg-[#f5f7fa]">Снять выделение</button>
        </div> : <div className="mt-5 rounded-xl border border-dashed border-[#dfe4eb] p-5 text-center text-sm leading-6 text-[#748195]">После выбора элемента здесь появятся доступные настройки.</div>}
        <p className="mt-6 text-xs leading-5 text-[#8993a2]">Изменения действуют только в предпросмотре. В режиме «Выбрать элемент» можно редактировать оформление, а в режиме «Проверить сайт» — пользоваться кнопками и калькуляторами.</p>
      </aside>
    </div>
  </main>;
}
