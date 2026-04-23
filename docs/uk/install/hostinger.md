---
read_when:
    - Налаштування OpenClaw на Hostinger
    - Пошук керованого VPS для OpenClaw
    - Використання 1-Click OpenClaw на Hostinger
summary: Розгорнути OpenClaw на Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T20:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: d172dd313dd29c0d642839f412e0672db7037146bd1ca2e0b092a351731bd32e
    source_path: install/hostinger.md
    workflow: 15
---

Запустіть постійний Gateway OpenClaw на [Hostinger](https://www.hostinger.com/openclaw) через **1-Click** кероване розгортання або встановлення на **VPS**.

## Передумови

- Обліковий запис Hostinger ([реєстрація](https://www.hostinger.com/openclaw))
- Приблизно 5-10 хвилин

## Варіант A: 1-Click OpenClaw

Найшвидший спосіб почати. Hostinger бере на себе інфраструктуру, Docker і автоматичні оновлення.

<Steps>
  <Step title="Придбайте й запустіть">
    1. На [сторінці Hostinger OpenClaw](https://www.hostinger.com/openclaw) виберіть план Managed OpenClaw і завершіть оформлення.

    <Note>
    Під час оформлення ви можете вибрати кредити **Ready-to-Use AI**, які попередньо придбані й миттєво інтегруються в OpenClaw — без потреби у зовнішніх облікових записах або API-ключах інших провайдерів. Ви можете одразу почати спілкування. Або ж під час налаштування можна вказати власний ключ від Anthropic, OpenAI, Google Gemini або xAI.
    </Note>

  </Step>

  <Step title="Виберіть канал повідомлень">
    Виберіть один або кілька каналів для підключення:

    - **WhatsApp** — відскануйте QR-код, показаний у майстрі налаштування.
    - **Telegram** — вставте токен бота з [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Завершіть встановлення">
    Натисніть **Finish**, щоб розгорнути екземпляр. Коли все буде готово, відкрийте панель керування OpenClaw через **OpenClaw Overview** в hPanel.
  </Step>

</Steps>

## Варіант B: OpenClaw на VPS

Більше контролю над вашим сервером. Hostinger розгортає OpenClaw через Docker на вашому VPS, а керування відбувається через **Docker Manager** в hPanel.

<Steps>
  <Step title="Придбайте VPS">
    1. На [сторінці Hostinger OpenClaw](https://www.hostinger.com/openclaw) виберіть план OpenClaw on VPS і завершіть оформлення.

    <Note>
    Під час оформлення ви можете вибрати кредити **Ready-to-Use AI** — вони попередньо придбані й миттєво інтегруються в OpenClaw, тож ви можете почати спілкування без зовнішніх облікових записів або API-ключів інших провайдерів.
    </Note>

  </Step>

  <Step title="Налаштуйте OpenClaw">
    Коли VPS буде підготовлено, заповніть поля конфігурації:

    - **Gateway token** — генерується автоматично; збережіть його для подальшого використання.
    - **Номер WhatsApp** — ваш номер із кодом країни (необов’язково).
    - **Токен бота Telegram** — із [BotFather](https://t.me/BotFather) (необов’язково).
    - **API-ключі** — потрібні лише в тому разі, якщо під час оформлення ви не вибрали кредити Ready-to-Use AI.

  </Step>

  <Step title="Запустіть OpenClaw">
    Натисніть **Deploy**. Коли все запрацює, відкрийте панель керування OpenClaw з hPanel, натиснувши **Open**.
  </Step>

</Steps>

Журнали, перезапуски та оновлення керуються безпосередньо через інтерфейс Docker Manager в hPanel. Щоб оновити, натисніть **Update** у Docker Manager — це завантажить найновіший образ.

## Перевірте налаштування

Надішліть "Hi" своєму помічнику в підключеному каналі. OpenClaw відповість і проведе вас через початкові налаштування.

## Усунення несправностей

**Панель керування не завантажується** — зачекайте кілька хвилин, поки контейнер завершить підготовку. Перевірте журнали Docker Manager в hPanel.

**Docker-контейнер постійно перезапускається** — відкрийте журнали Docker Manager і знайдіть помилки конфігурації (відсутні токени, невалідні API-ключі).

**Бот Telegram не відповідає** — надішліть повідомлення з кодом pairing із Telegram безпосередньо як повідомлення у ваш чат OpenClaw, щоб завершити підключення.

## Наступні кроки

- [Канали](/uk/channels) — підключіть Telegram, WhatsApp, Discord та інші
- [Конфігурація Gateway](/uk/gateway/configuration) — усі параметри конфігурації
