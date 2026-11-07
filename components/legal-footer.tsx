"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="font-semibold text-[#26364A]">{title}</h3><div className="mt-1 space-y-2">{children}</div></div>;
}

function AuthorContact() {
  return <a href="https://t.me/svdemidenko" target="_blank" rel="noopener noreferrer" className="text-[#26364A] underline underline-offset-2">Telegram: @svdemidenko</a>;
}

export function LegalFooter() {
  return <div className="mt-5 border-t border-[#DDE3EB] pt-4 text-[#748195] sm:mt-7 sm:pt-5">
    <div className="flex flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="max-w-[680px] text-right sm:text-left">
        <p className="text-[11px] leading-5 sm:text-xs">© 2026 Автор: Светлана Демиденко</p>
      </div>
      <Dialog>
        <DialogTrigger asChild><button type="button" className="w-fit max-w-full shrink-0 rounded-sm text-right text-[11px] leading-[1.6] no-underline transition-colors hover:text-[#26364A] focus-visible:outline-2 focus-visible:outline-offset-4 sm:max-w-[300px] lg:max-w-none lg:whitespace-nowrap">Условия использования и политика конфиденциальности</button></DialogTrigger>
        <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 px-5 pt-6 pb-4 pr-10 sm:px-7 sm:pr-12">
            <DialogTitle className="text-left text-lg leading-snug text-[#26364A] sm:text-xl">Условия использования и политика конфиденциальности</DialogTitle>
            <DialogDescription className="text-left text-xs leading-relaxed">SD | Калькулятор</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-6 text-sm leading-relaxed text-[#536175] sm:px-7" tabIndex={0} aria-label="Текст условий и политики">
            <section aria-labelledby="legal-terms" className="space-y-4">
              <h2 id="legal-terms" className="text-base font-semibold text-[#26364A]">Условия использования</h2>
              <LegalSection title="1. Назначение приложения">
                <p>«SD | Калькулятор» предназначено для предварительного расчёта комиссии по сделкам с недвижимостью, партнёрского вознаграждения, первоначального взноса, аннуитетных платежей и суммы кредита по заданному платежу. Автор - Светлана Демиденко. Пользователю безвозмездно предоставляется неисключительное право пользоваться официальной версией приложения для личных и профессиональных расчётов и делиться их результатами.</p>
              </LegalSection>
              <LegalSection title="2. Условия расчётов">
                <p>Результаты носят справочный характер и не являются публичной офертой, предусмотренной статьёй 437 ГК РФ, одобрением кредита или гарантией выплаты. Фактические условия определяются соответствующими договорами. Пользователь самостоятельно проверяет исходные данные и применимость тарифов.</p>
                <p>Партнёрское вознаграждение рассчитывается от итоговой комиссии с учётом выбранной скидки, без учёта налогов и иных удержаний. Кредитный расчёт не включает все возможные расходы и особенности банковского договора.</p>
                
              </LegalSection>
              <LegalSection title="3. Авторские права">
                <p>Права на код и оригинальные материалы приложения охраняются законодательством Российской Федерации в пределах прав, принадлежащих Автору. Без разрешения правообладателя запрещены распространение переработанных копий, присвоение авторства и удаление сведений об авторе для выдачи приложения за собственное, кроме случаев, допускаемых законом. Права на сторонние компоненты определяются их лицензиями.</p>
              </LegalSection>
              <LegalSection title="4. Ответственность и обращения">
                <p>Автор не гарантирует отсутствие технических ошибок и совпадение предварительного расчёта с фактическими условиями сделки или кредита. Ответственность определяется законом; обязательные права пользователя сохраняются. По вопросам работы приложения и использования материалов: <AuthorContact />.</p>
              </LegalSection>
            </section>
            <section aria-labelledby="legal-privacy" className="mt-7 space-y-4 border-t border-[#E4E8ED] pt-6">
              <h2 id="legal-privacy" className="text-base font-semibold text-[#26364A]">Политика конфиденциальности</h2>
              <LegalSection title="Персональные данные">
                <p>Сайт не запрашивает персональные данные и не требует регистрации. Данные, которые пользователь вводит в калькуляторы, используются для выполнения расчётов.</p>
              </LegalSection>
            </section>
          </div>
          <div className="shrink-0 border-t border-[#E4E8ED] px-5 py-3 sm:px-7"><DialogClose asChild><button type="button" className="min-h-10 rounded-xl bg-[#26364A] px-5 text-sm font-medium text-white outline-offset-4 focus-visible:outline-2">Понятно</button></DialogClose></div>
        </DialogContent>
      </Dialog>
    </div>
  </div>;
}
