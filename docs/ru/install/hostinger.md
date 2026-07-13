---
read_when:
    - Настройка OpenClaw на Hostinger
    - Ищете управляемый VPS для OpenClaw
    - Использование OpenClaw в Hostinger с установкой в один клик
summary: Размещение OpenClaw на Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-13T19:53:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Запустите постоянный OpenClaw Gateway на [Hostinger](https://www.hostinger.com/openclaw) — либо как управляемое развертывание **1-Click**, либо установив его на **VPS**, который вы администрируете самостоятельно.

## Предварительные требования

- Учетная запись Hostinger ([регистрация](https://www.hostinger.com/openclaw))
- Около 5–10 минут

## Вариант A: OpenClaw в один клик

Hostinger управляет инфраструктурой, Docker и автоматическими обновлениями. Это самый быстрый способ запустить экземпляр.

<Steps>
  <Step title="Покупка и запуск">
    1. На [странице OpenClaw от Hostinger](https://www.hostinger.com/openclaw) выберите тариф Managed OpenClaw и завершите оформление заказа.

    <Note>
    При оформлении заказа можно выбрать предоплаченные кредиты **Ready-to-Use AI**, которые мгновенно интегрируются в OpenClaw: внешние учетные записи и API-ключи других поставщиков не требуются. Вы сможете сразу начать общение. Также во время настройки можно указать собственный ключ Anthropic, OpenAI, Google Gemini или xAI.
    </Note>

  </Step>

  <Step title="Выбор канала обмена сообщениями">
    Выберите один или несколько каналов для подключения:

    - **WhatsApp** — отсканируйте QR-код, показанный в мастере настройки.
    - **Telegram** — вставьте токен бота, полученный от [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Завершение установки">
    Нажмите **Finish**, чтобы развернуть экземпляр. Когда он будет готов, откройте панель управления OpenClaw через раздел **OpenClaw Overview** в hPanel.
  </Step>

</Steps>

## Вариант B: OpenClaw на VPS

Этот вариант предоставляет больше контроля над сервером. Hostinger развертывает OpenClaw через Docker на вашем VPS; управление осуществляется с помощью **Docker Manager** в hPanel.

<Steps>
  <Step title="Покупка VPS">
    1. На [странице OpenClaw от Hostinger](https://www.hostinger.com/openclaw) выберите тариф OpenClaw on VPS и завершите оформление заказа.

    <Note>
    При оформлении заказа можно выбрать предоплаченные кредиты **Ready-to-Use AI**, которые мгновенно интегрируются в OpenClaw, поэтому вы сможете начать общение без внешних учетных записей и API-ключей других поставщиков.
    </Note>

  </Step>

  <Step title="Настройка OpenClaw">
    После подготовки VPS заполните поля конфигурации:

    - **Gateway token** — создается автоматически; сохраните его для дальнейшего использования.
    - **WhatsApp number** — ваш номер с кодом страны (необязательно).
    - **Telegram bot token** — токен от [BotFather](https://t.me/BotFather) (необязательно).
    - **API keys** — требуются, только если при оформлении заказа вы не выбрали кредиты Ready-to-Use AI.

  </Step>

  <Step title="Запуск OpenClaw">
    Нажмите **Deploy**. После запуска откройте панель управления OpenClaw из hPanel, нажав **Open**.
  </Step>

</Steps>

Просмотр журналов, перезапуск и обновление выполняются через интерфейс Docker Manager в hPanel. Чтобы обновить систему, нажмите **Update** в Docker Manager для загрузки последнего образа.

## Проверка настройки

Отправьте сообщение «Привет» своему ассистенту через подключенный канал. OpenClaw ответит и поможет задать первоначальные предпочтения.

## Устранение неполадок

**Панель управления не загружается** — подождите несколько минут, пока завершится подготовка контейнера, а затем проверьте журналы Docker Manager в hPanel.

**Контейнер Docker постоянно перезапускается** — откройте журналы Docker Manager и найдите ошибки конфигурации (отсутствующие токены, недействительные API-ключи).

**Бот Telegram не отвечает** — если требуется сопряжение личных сообщений, неизвестный отправитель вместо ответа получит короткий код сопряжения. Подтвердите его в чате панели управления OpenClaw или с помощью `openclaw pairing approve telegram <CODE>`, если у вас есть доступ к оболочке контейнера. См. раздел [Сопряжение](/ru/channels/pairing).

## Дальнейшие действия

- [Каналы](/ru/channels) — подключите Telegram, WhatsApp, Discord и другие каналы
- [Конфигурация Gateway](/ru/gateway/configuration) — все параметры конфигурации

## Связанные материалы

- [Обзор установки](/ru/install)
- [Хостинг на VPS](/ru/vps)
- [DigitalOcean](/ru/install/digitalocean)
