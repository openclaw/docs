---
read_when:
    - Перше налаштування з нуля
    - Вам потрібен найшвидший шлях до робочого чату
summary: Установіть OpenClaw і запустіть свій перший чат за кілька хвилин.
title: Початок роботи
x-i18n:
    generated_at: "2026-06-28T20:45:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

Установіть OpenClaw, запустіть початкове налаштування й поспілкуйтеся зі своїм AI-асистентом — усе це
приблизно за 5 хвилин. Наприкінці у вас буде запущений Gateway, налаштована автентифікація
та робочий сеанс чату.

## Що вам потрібно

- **Node.js** — рекомендовано Node 24 (Node 22.19+ також підтримується)
- **API-ключ** від постачальника моделей (Anthropic, OpenAI, Google тощо) — початкове налаштування запросить його

<Tip>
Перевірте версію Node за допомогою `node --version`.
**Користувачі Windows:** нативний застосунок Windows Hub — найпростіший шлях для настільного комп’ютера. Інсталятор
PowerShell і шляхи Gateway у WSL2 також підтримуються. Див. [Windows](/uk/platforms/windows).
Потрібно встановити Node? Див. [Налаштування Node](/uk/install/node).
</Tip>

## Швидке налаштування

<Steps>
  <Step title="Установіть OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Процес інсталяційного скрипта"
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

    Майстер проведе вас через вибір постачальника моделей, встановлення API-ключа
    та налаштування Gateway. QuickStart зазвичай займає лише кілька хвилин, але
    вхід до постачальника, сполучення каналу, встановлення демона, мережеві завантаження, Skills
    або необов’язкові плагіни можуть подовжити повне початкове налаштування. Необов’язкові
    кроки можна пропустити й повернутися до них пізніше за допомогою `openclaw configure`.

    Див. [Початкове налаштування (CLI)](/uk/start/wizard) для повної довідки.

  </Step>
  <Step title="Перевірте, що Gateway запущено">
    ```bash
    openclaw gateway status
    ```

    Ви маєте побачити, що Gateway прослуховує порт 18789.

  </Step>
  <Step title="Відкрийте панель керування">
    ```bash
    openclaw dashboard
    ```

    Це відкриє Control UI у вашому браузері. Якщо він завантажився, усе працює.

  </Step>
  <Step title="Надішліть перше повідомлення">
    Введіть повідомлення в чаті Control UI, і ви маєте отримати відповідь AI.

    Хочете натомість спілкуватися з телефона? Найшвидший канал для налаштування —
    [Telegram](/uk/channels/telegram) (потрібен лише токен бота). Див. [Канали](/uk/channels)
    для всіх варіантів.

  </Step>
</Steps>

<Accordion title="Розширено: змонтуйте власну збірку Control UI">
  Якщо ви підтримуєте локалізовану або налаштовану збірку панелі керування, вкажіть
  `gateway.controlUi.root` на каталог, що містить ваші зібрані статичні
  ресурси та `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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
  <Card title="Сполучення й безпека" href="/uk/channels/pairing" icon="shield">
    Контролюйте, хто може надсилати повідомлення вашому агенту.
  </Card>
  <Card title="Налаштуйте Gateway" href="/uk/gateway/configuration" icon="settings">
    Моделі, інструменти, пісочниця та розширені налаштування.
  </Card>
  <Card title="Перегляньте інструменти" href="/uk/tools" icon="wrench">
    Браузер, exec, вебпошук, Skills і плагіни.
  </Card>
</Columns>

<Accordion title="Розширено: змінні середовища">
  Якщо ви запускаєте OpenClaw як службовий обліковий запис або хочете власні шляхи:

- `OPENCLAW_HOME` — домашній каталог для внутрішнього визначення шляхів
- `OPENCLAW_STATE_DIR` — перевизначити каталог стану
- `OPENCLAW_CONFIG_PATH` — перевизначити шлях до файлу конфігурації

Повна довідка: [Змінні середовища](/uk/help/environment).
</Accordion>

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Огляд каналів](/uk/channels)
- [Налаштування](/uk/start/setup)
