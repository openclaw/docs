---
read_when:
    - Перше налаштування з нуля
    - Ви хочете якнайшвидше налаштувати робочий чат
summary: Установіть OpenClaw і запустіть свій перший чат за лічені хвилини.
title: Початок роботи
x-i18n:
    generated_at: "2026-07-12T13:42:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Встановіть OpenClaw, виконайте початкове налаштування та почніть спілкуватися зі своїм ШІ-асистентом приблизно за 5
хвилин. У результаті ви матимете запущений Gateway, налаштовану автентифікацію та
робочий сеанс чату.

## Що вам потрібно

- **Node.js 22.19+, 23.11+ або 24+** (24 — рекомендована версія за замовчуванням)
- **Ключ API** від постачальника моделей (Anthropic, OpenAI, Google тощо) — майстер початкового налаштування запропонує ввести його

<Tip>
Перевірте версію Node за допомогою `node --version`.
**Користувачам Windows:** нативний застосунок Windows Hub — найпростіший варіант для настільного комп’ютера. Також
підтримуються інсталятор PowerShell і використання Gateway у WSL2. Див. [Windows](/uk/platforms/windows).
Потрібно встановити Node? Див. [Налаштування Node](/uk/install/node).
</Tip>

## Швидке налаштування

<Steps>
  <Step title="Встановіть OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Процес роботи сценарію встановлення"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Інші способи встановлення (Docker, Nix, npm): [Встановлення](/uk/install).
    </Note>

  </Step>
  <Step title="Виконайте початкове налаштування">
    ```bash
    openclaw onboard --install-daemon
    ```

    Майстер допоможе вам вибрати постачальника моделей, задати ключ API
    та налаштувати Gateway. QuickStart зазвичай триває лише кілька хвилин, але
    вхід до облікового запису постачальника, пов’язування каналу, встановлення фонової служби, мережеві завантаження, Skills
    або необов’язкові Plugin можуть подовжити повне початкове налаштування. Пропустіть необов’язкові
    кроки та поверніться до них пізніше за допомогою `openclaw configure`.

    Повний довідник див. у розділі [Початкове налаштування (CLI)](/uk/start/wizard).

  </Step>
  <Step title="Переконайтеся, що Gateway працює">
    ```bash
    openclaw gateway status
    ```

    Ви маєте побачити, що Gateway прослуховує порт 18789.

  </Step>
  <Step title="Відкрийте панель керування">
    ```bash
    openclaw dashboard
    ```

    Ця команда відкриє інтерфейс керування у вашому браузері. Якщо він завантажився, усе працює.

  </Step>
  <Step title="Надішліть перше повідомлення">
    Введіть повідомлення в чаті інтерфейсу керування — у відповідь ви маєте отримати повідомлення від ШІ.

    Хочете натомість спілкуватися з телефона? Найшвидше налаштувати канал
    [Telegram](/uk/channels/telegram) (потрібен лише токен бота). Усі варіанти див. у розділі [Канали](/uk/channels).

  </Step>
</Steps>

<Accordion title="Розширені можливості: підключення власної збірки інтерфейсу керування">
  Якщо ви підтримуєте локалізовану або налаштовану збірку панелі керування, вкажіть у
  `gateway.controlUi.root` каталог, що містить зібрані статичні
  ресурси та `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Скопіюйте зібрані статичні файли до цього каталогу.
```

Потім задайте:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Перезапустіть Gateway і знову відкрийте панель керування:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Що робити далі

<Columns>
  <Card title="Підключіть канал" href="/uk/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo та інші.
  </Card>
  <Card title="Пов’язування та безпека" href="/uk/channels/pairing" icon="shield">
    Керуйте тим, хто може надсилати повідомлення вашому агенту.
  </Card>
  <Card title="Налаштуйте Gateway" href="/uk/gateway/configuration" icon="settings">
    Моделі, інструменти, пісочниця та розширені налаштування.
  </Card>
  <Card title="Перегляньте інструменти" href="/uk/tools" icon="wrench">
    Браузер, виконання команд, вебпошук, Skills і Plugin.
  </Card>
</Columns>

<Accordion title="Розширені можливості: змінні середовища">
  Якщо ви запускаєте OpenClaw від імені службового облікового запису або хочете використовувати власні шляхи:

- `OPENCLAW_HOME` — домашній каталог для внутрішнього визначення шляхів
- `OPENCLAW_STATE_DIR` — перевизначення каталогу стану
- `OPENCLAW_CONFIG_PATH` — перевизначення шляху до файлу конфігурації

Повний довідник: [Змінні середовища](/uk/help/environment).
</Accordion>

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Огляд каналів](/uk/channels)
- [Налаштування](/uk/start/setup)
