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
              <LegalSection title="Авторство и права на материалы">
                <p>Автор проекта «SD | Калькулятор» и созданных для него оригинальных материалов - Светлана Демиденко. Авторство и право автора на имя охраняются законом и не могут быть присвоены другому лицу.</p>
                <p>Исходный код, оригинальный дизайн, тексты и другие материалы проекта охраняются авторским правом. Их копирование, переработка, распространение, публикация или использование в составе другого продукта допускаются только с разрешения правообладателя, кроме случаев, прямо предусмотренных законом. Права на сторонние библиотеки и компоненты принадлежат их правообладателям и регулируются соответствующими лицензиями.</p>
                <p>Пользователь вправе пользоваться приложением для выполнения собственных расчётов и делиться полученными результатами. Это не предоставляет права на копирование самого приложения или его материалов.</p>
              </LegalSection>
              <LegalSection title="Назначение расчётов">
                <p>Результаты калькуляторов носят информационный характер. Они не заменяют условия договора, решение банка или индивидуальный расчёт сторон сделки.</p>
              </LegalSection>
              <LegalSection title="Связь с автором">
                <p>По вопросам авторства, использования материалов и работы приложения: <AuthorContact />.</p>
              </LegalSection>
            </section>
            <section aria-labelledby="legal-privacy" className="mt-7 space-y-4 border-t border-[#E4E8ED] pt-6">
              <h2 id="legal-privacy" className="text-base font-semibold text-[#26364A]">Политика конфиденциальности</h2>
              <LegalSection title="Какие данные обрабатывает приложение">
                <p>Регистрация не требуется. Значения, которые пользователь вводит в калькуляторы, а также история расчётов и настройки сохраняются локально на его устройстве в хранилище браузера или приложения. Эти данные не отправляются автору и не используются для идентификации пользователя.</p>
                <p>При обращении к сайту хостинг-провайдер может автоматически обрабатывать технические данные запроса, например IP-адрес, дату и время обращения, сведения о браузере и запрошенной странице, для доставки содержимого сайта и обеспечения его безопасности. Такие данные обрабатываются в соответствии с правилами провайдера.</p>
              </LegalSection>
              <LegalSection title="Хранение и удаление">
                <p>Локальную историю можно удалить средствами приложения. Очистка данных браузера или удаление приложения также может привести к удалению сохранённых расчётов и настроек.</p>
              </LegalSection>
              <LegalSection title="Обращения по вопросам данных">
                <p>По вопросам обработки персональных данных можно обратиться автору: <AuthorContact />.</p>
              </LegalSection>
            </section>
          </div>
          <div className="shrink-0 border-t border-[#E4E8ED] px-5 py-3 sm:px-7"><DialogClose asChild><button type="button" className="min-h-10 rounded-xl bg-[#26364A] px-5 text-sm font-medium text-white outline-offset-4 focus-visible:outline-2">Понятно</button></DialogClose></div>
        </DialogContent>
      </Dialog>
    </div>
  </div>;
}
