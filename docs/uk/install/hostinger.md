---
read_when:
    - Налаштування OpenClaw на Hostinger
    - Шукаєте керований VPS для OpenClaw
    - Використання 1-Click OpenClaw на Hostinger
summary: Розмістіть OpenClaw на Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-24T03:18:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Запустіть постійний Gateway OpenClaw на [Hostinger](https://www.hostinger.com/openclaw) через кероване розгортання **1-Click** або встановлення на **VPS**.

## Передумови

- обліковий запис Hostinger ([реєстрація](https://www.hostinger.com/openclaw))
- приблизно 5–10 хвилин

## Варіант A: 1-Click OpenClaw

Найшвидший спосіб почати. Hostinger бере на себе інфраструктуру, Docker і автоматичні оновлення.

<Steps>
  <Step title="Придбайте та запустіть">
    1. На [сторінці Hostinger OpenClaw](https://www.hostinger.com/openclaw) виберіть план Managed OpenClaw і завершіть оформлення.

    <Note>
    Під час оформлення ви можете вибрати кредити **Ready-to-Use AI**, які попередньо придбані та миттєво інтегровані всередині OpenClaw — жодних зовнішніх облікових записів чи API keys від інших провайдерів не потрібно. Ви можете одразу почати спілкування. Або ж під час налаштування вкажіть власний ключ від Anthropic, OpenAI, Google Gemini або xAI.
    </Note>

  </Step>

  <Step title="Виберіть канал обміну повідомленнями">
    Виберіть один або кілька каналів для підключення:

    - **WhatsApp** -- відскануйте QR-код, показаний у майстрі налаштування.
    - **Telegram** -- вставте токен бота з [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Завершіть установлення">
    Натисніть **Finish**, щоб розгорнути екземпляр. Коли все буде готово, відкрийте панель OpenClaw через **OpenClaw Overview** у hPanel.
  </Step>

</Steps>

## Варіант B: OpenClaw на VPS

Більше контролю над вашим сервером. Hostinger розгортає OpenClaw через Docker на вашому VPS, а ви керуєте ним через **Docker Manager** у hPanel.

<Steps>
  <Step title="Придбайте VPS">
    1. На [сторінці Hostinger OpenClaw](https://www.hostinger.com/openclaw) виберіть план OpenClaw on VPS і завершіть оформлення.

    <Note>
    Під час оформлення ви можете вибрати кредити **Ready-to-Use AI** — вони попередньо придбані та миттєво інтегровані в OpenClaw, тож ви можете почати спілкування без жодних зовнішніх облікових записів чи API keys від інших провайдерів.
    </Note>

  </Step>

  <Step title="Налаштуйте OpenClaw">
    Коли VPS буде підготовлено, заповніть поля конфігурації:

    - **Gateway token** -- генерується автоматично; збережіть його для подальшого використання.
    - **Номер WhatsApp** -- ваш номер із кодом країни (необов’язково).
    - **Токен Telegram-бота** -- з [BotFather](https://t.me/BotFather) (необов’язково).
    - **API keys** -- потрібні лише якщо під час оформлення ви не вибрали кредити Ready-to-Use AI.

  </Step>

  <Step title="Запустіть OpenClaw">
    Натисніть **Deploy**. Коли все запрацює, відкрийте панель OpenClaw з hPanel, натиснувши **Open**.
  </Step>

</Steps>

Журнали, перезапуски та оновлення керуються безпосередньо через інтерфейс Docker Manager у hPanel. Щоб оновити, натисніть **Update** у Docker Manager — це завантажить останній образ.

## Перевірте своє налаштування

Надішліть "Hi" своєму помічнику в підключеному каналі. OpenClaw відповість і проведе вас через початкові налаштування.

## Усунення несправностей

**Панель не завантажується** -- Зачекайте кілька хвилин, поки контейнер завершить підготовку. Перевірте журнали Docker Manager у hPanel.

**Docker-контейнер постійно перезапускається** -- Відкрийте журнали Docker Manager і пошукайте помилки конфігурації (відсутні токени, недійсні API keys).

**Telegram-бот не відповідає** -- Надішліть повідомлення з вашим кодом спарювання безпосередньо з Telegram як повідомлення у вашому чаті OpenClaw, щоб завершити підключення.

## Наступні кроки

- [Канали](/uk/channels) -- підключіть Telegram, WhatsApp, Discord тощо
- [Конфігурація Gateway](/uk/gateway/configuration) -- усі параметри конфігурації

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Хостинг VPS](/uk/vps)
- [DigitalOcean](/uk/install/digitalocean)
