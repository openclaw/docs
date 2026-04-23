---
read_when:
    - Проєктування помічника онбордингу для macOS
    - Реалізація налаштування auth або ідентичності
sidebarTitle: 'Onboarding: macOS App'
summary: Початковий потік налаштування OpenClaw (macOS app)
title: Онбординг (macOS app)
x-i18n:
    generated_at: "2026-04-23T21:12:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5c0c0e7402e18ee58b504b9cb3424b0998cff7630ba40844f4ef825abff9192
    source_path: start/onboarding.md
    workflow: 15
---

Цей документ описує **поточний** потік першого налаштування. Мета —
забезпечити плавний досвід “day 0”: вибрати, де працює Gateway, підключити auth, запустити
майстер і дати агенту виконати початкове налаштування самостійно.
Загальний огляд шляхів онбордингу див. в [Onboarding Overview](/uk/start/onboarding-overview).

<Steps>
<Step title="Підтвердьте попередження macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Підтвердьте пошук локальних мереж">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Вітання й повідомлення про безпеку">
<Frame caption="Прочитайте показане повідомлення про безпеку й ухваліть відповідне рішення">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Модель довіри безпеки:

- Типово OpenClaw — це персональний агент: одна межа довіреного оператора.
- Спільні/багатокористувацькі сценарії вимагають жорсткого обмеження (розділяйте межі довіри, мінімізуйте доступ до tools і дотримуйтеся [Security](/uk/gateway/security)).
- Локальний онбординг тепер типово задає для нових конфігурацій `tools.profile: "coding"`, щоб у свіжих локальних налаштуваннях зберігалися tools файлової системи/runtime без примусового використання необмеженого профілю `full`.
- Якщо ввімкнено hooks/webhooks або інші подачі ненадійного вмісту, використовуйте сильний сучасний рівень моделі та зберігайте сувору політику tools/sandboxing.

</Step>
<Step title="Local vs Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Де працює **Gateway**?

- **На цьому Mac (Local only):** онбординг може налаштувати auth і записати credentials
  локально.
- **Remote (через SSH/Tailnet):** онбординг **не** налаштовує локальну auth;
  облікові дані мають уже існувати на хості gateway.
- **Налаштувати пізніше:** пропустити setup і залишити app неналаштованим.

<Tip>
**Порада щодо auth Gateway:**

- Тепер майстер генерує **token** навіть для loopback, тож локальні WS-clients повинні проходити автентифікацію.
- Якщо ви вимкнете auth, підключитися зможе будь-який локальний процес; використовуйте це лише на повністю довірених машинах.
- Для доступу з кількох машин або прив’язки не до loopback використовуйте **token**.

</Tip>
</Step>
<Step title="Дозволи">
<Frame caption="Виберіть, які дозволи ви хочете надати OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Під час онбордингу запитуються дозволи TCC, потрібні для:

- Automation (AppleScript)
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>Цей крок необов’язковий</Info>
  App може встановити глобальний CLI `openclaw` через npm, pnpm або bun.
  Він спочатку надає перевагу npm, потім pnpm, потім bun, якщо це єдиний виявлений
  package manager. Для runtime Gateway рекомендованим шляхом лишається Node.
</Step>
<Step title="Onboarding Chat (виділена сесія)">
  Після налаштування app відкриває окрему сесію onboarding chat, щоб агент міг
  представитися й підказати наступні кроки. Це відокремлює інструкції першого запуску
  від вашої звичайної розмови. Див. [Bootstrapping](/uk/start/bootstrapping), щоб
  зрозуміти, що відбувається на хості gateway під час першого запуску агента.
</Step>
</Steps>
