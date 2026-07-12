---
read_when:
    - Налаштування OpenClaw на Hostinger
    - Шукаєте керований VPS для OpenClaw
    - Використання OpenClaw від Hostinger, установленого одним клацанням миші
summary: Розміщення OpenClaw на Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T13:18:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Запустіть постійно активний OpenClaw Gateway на [Hostinger](https://www.hostinger.com/openclaw) — як кероване розгортання **1-Click** або як інсталяцію на **VPS**, яку ви адмініструєте самостійно.

## Передумови

- Обліковий запис Hostinger ([реєстрація](https://www.hostinger.com/openclaw))
- Приблизно 5–10 хвилин

## Варіант A: OpenClaw в 1-Click

Hostinger керує інфраструктурою, Docker і автоматичними оновленнями. Це найшвидший спосіб запустити екземпляр.

<Steps>
  <Step title="Придбання та запуск">
    1. На [сторінці OpenClaw від Hostinger](https://www.hostinger.com/openclaw) виберіть керований план OpenClaw і завершіть оформлення замовлення.

    <Note>
    Під час оформлення замовлення можна вибрати передплачені кредити **Ready-to-Use AI**, які миттєво інтегруються в OpenClaw. Облікові записи в інших постачальників або їхні ключі API не потрібні. Ви зможете одразу розпочати спілкування. Або під час налаштування надайте власний ключ від Anthropic, OpenAI, Google Gemini чи xAI.
    </Note>

  </Step>

  <Step title="Вибір каналу обміну повідомленнями">
    Виберіть один або кілька каналів для підключення:

    - **WhatsApp** — відскануйте QR-код, показаний у майстрі налаштування.
    - **Telegram** — вставте токен бота від [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Завершення встановлення">
    Натисніть **Finish**, щоб розгорнути екземпляр. Коли він буде готовий, відкрийте панель керування OpenClaw через **OpenClaw Overview** у hPanel.
  </Step>

</Steps>

## Варіант B: OpenClaw на VPS

Цей варіант надає більше контролю над сервером. Hostinger розгортає OpenClaw через Docker на вашому VPS, а ви керуєте ним через **Docker Manager** у hPanel.

<Steps>
  <Step title="Придбання VPS">
    1. На [сторінці OpenClaw від Hostinger](https://www.hostinger.com/openclaw) виберіть план OpenClaw на VPS і завершіть оформлення замовлення.

    <Note>
    Під час оформлення замовлення можна вибрати передплачені кредити **Ready-to-Use AI**. Вони миттєво інтегруються в OpenClaw, тому ви зможете розпочати спілкування без облікових записів в інших постачальників або їхніх ключів API.
    </Note>

  </Step>

  <Step title="Налаштування OpenClaw">
    Після підготовки VPS заповніть поля конфігурації:

    - **Gateway token** — генерується автоматично; збережіть його для подальшого використання.
    - **WhatsApp number** — ваш номер із кодом країни (необов’язково).
    - **Telegram bot token** — від [BotFather](https://t.me/BotFather) (необов’язково).
    - **API keys** — потрібні, лише якщо під час оформлення замовлення ви не вибрали кредити Ready-to-Use AI.

  </Step>

  <Step title="Запуск OpenClaw">
    Натисніть **Deploy**. Після запуску відкрийте панель керування OpenClaw у hPanel, натиснувши **Open**.
  </Step>

</Steps>

Журнали, перезапуски й оновлення доступні через інтерфейс Docker Manager у hPanel. Щоб оновити систему, натисніть **Update** у Docker Manager для завантаження найновішого образу.

## Перевірка налаштування

Надішліть «Привіт» своєму асистенту через підключений канал. OpenClaw відповість і допоможе налаштувати початкові параметри.

## Усунення несправностей

**Панель керування не завантажується** — зачекайте кілька хвилин, доки завершиться підготовка контейнера, а потім перевірте журнали Docker Manager у hPanel.

**Контейнер Docker постійно перезапускається** — відкрийте журнали Docker Manager і знайдіть помилки конфігурації, як-от відсутні токени або недійсні ключі API.

**Бот Telegram не відповідає** — якщо потрібне сполучення для особистих повідомлень, невідомий відправник замість відповіді отримає короткий код сполучення. Підтвердьте його в чаті панелі керування OpenClaw або виконайте `openclaw pairing approve telegram <CODE>`, якщо маєте доступ до оболонки контейнера. Див. [Сполучення](/uk/channels/pairing).

## Наступні кроки

- [Канали](/uk/channels) — підключіть Telegram, WhatsApp, Discord та інші сервіси
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Хостинг VPS](/uk/vps)
- [DigitalOcean](/uk/install/digitalocean)
