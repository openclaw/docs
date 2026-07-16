---
read_when:
    - Початкове налаштування з нуля
    - Вам потрібен найшвидший шлях до робочого чату
summary: Установіть OpenClaw і розпочніть свій перший чат за лічені хвилини.
title: Початок роботи
x-i18n:
    generated_at: "2026-07-16T18:35:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Встановіть OpenClaw, виконайте початкове налаштування та почніть спілкуватися зі своїм ШІ-асистентом приблизно за 5
хвилин. У результаті ви матимете запущений Gateway, налаштовану автентифікацію та
робочий сеанс чату.

## Що вам знадобиться

- **Node.js 22.22.3+, 24.15+ або 25.9+** (24 — рекомендована версія за замовчуванням)
- **Ключ API** від постачальника моделей (Anthropic, OpenAI, Google тощо) — майстер початкового налаштування запропонує його ввести

<Tip>
Перевірте версію Node за допомогою `node --version`.
**Для користувачів Windows:** нативний застосунок Windows Hub — найпростіший варіант для настільного комп’ютера. Також
підтримуються інсталятор PowerShell і запуск Gateway через WSL2. Див. [Windows](/uk/platforms/windows).
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
  alt="Процес виконання інсталяційного скрипту"
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
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --install-daemon
    ```

    Майстер допоможе вибрати постачальника моделей, указати ключ API
    та налаштувати Gateway. QuickStart зазвичай триває лише кілька хвилин, але
    вхід до облікового запису постачальника, підключення каналу, встановлення демона, мережеві завантаження, Skills
    або додаткові plugins можуть подовжити повне початкове налаштування. Пропустіть необов’язкові
    кроки та поверніться до них пізніше за допомогою `openclaw configure`.

    Повний довідник див. у розділі [Початкове налаштування (CLI)](/uk/start/wizard).

  </Step>
  <Step title="Переконайтеся, що Gateway працює">
    ```bash
    openclaw gateway status
    ```

    Має з’явитися повідомлення, що Gateway прослуховує порт 18789.

  </Step>
  <Step title="Відкрийте панель керування">
    ```bash
    openclaw dashboard
    ```

    Команда відкриє Control UI у браузері. Якщо сторінка завантажилася, усе працює.

  </Step>
  <Step title="Надішліть перше повідомлення">
    Введіть повідомлення в чаті Control UI — у відповідь має надійти повідомлення від ШІ.

    Бажаєте натомість спілкуватися з телефона? Найшвидше налаштувати канал
    [Telegram](/uk/channels/telegram) (потрібен лише токен бота). Усі варіанти наведено в розділі [Канали](/uk/channels).

  </Step>
</Steps>

<Accordion title="Розширені можливості: підключення власної збірки Control UI">
  Якщо ви підтримуєте локалізовану або налаштовану збірку панелі керування, укажіть для
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

## Подальші дії

<Columns>
  <Card title="Підключити канал" href="/uk/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo та інші.
  </Card>
  <Card title="Підключення та безпека" href="/uk/channels/pairing" icon="shield">
    Визначте, хто може надсилати повідомлення вашому агенту.
  </Card>
  <Card title="Налаштувати Gateway" href="/uk/gateway/configuration" icon="settings">
    Моделі, інструменти, пісочниця та розширені налаштування.
  </Card>
  <Card title="Переглянути інструменти" href="/uk/tools" icon="wrench">
    Браузер, виконання команд, вебпошук, Skills і plugins.
  </Card>
</Columns>

<Accordion title="Розширені можливості: змінні середовища">
  Якщо ви запускаєте OpenClaw від імені службового облікового запису або хочете використовувати власні шляхи:

- `OPENCLAW_HOME` — домашній каталог для внутрішнього визначення шляхів
- `OPENCLAW_STATE_DIR` — перевизначає каталог стану
- `OPENCLAW_CONFIG_PATH` — перевизначає шлях до файлу конфігурації

Повний довідник: [Змінні середовища](/uk/help/environment).
</Accordion>

## Пов’язані матеріали

- [Огляд встановлення](/uk/install)
- [Огляд каналів](/uk/channels)
- [Налаштування](/uk/start/setup)
