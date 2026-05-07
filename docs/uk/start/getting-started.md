---
read_when:
    - Початкове налаштування з нуля
    - Вам потрібен найшвидший шлях до робочого чату
summary: Встановіть OpenClaw і запустіть свій перший чат за кілька хвилин.
title: Початок роботи
x-i18n:
    generated_at: "2026-05-07T15:13:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

Install OpenClaw, запустіть онбординг і поспілкуйтеся зі своїм AI-помічником — усе приблизно за 5 хвилин. Наприкінці у вас буде запущений Gateway, налаштована автентифікація та робочий сеанс чату.

## Що вам потрібно

- **Node.js** — рекомендовано Node 24 (Node 22.16+ також підтримується)
- **API-ключ** від постачальника моделей (Anthropic, OpenAI, Google тощо) — онбординг попросить вас його ввести

<Tip>
Перевірте свою версію Node за допомогою `node --version`.
**Користувачі Windows:** підтримуються як нативна Windows, так і WSL2. WSL2 стабільніша й рекомендована для повного досвіду. Див. [Windows](/uk/platforms/windows).
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
  alt="Процес сценарію встановлення"
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
    Інші способи встановлення (Docker, Nix, npm): [Установлення](/uk/install).
    </Note>

  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --install-daemon
    ```

    Майстер проведе вас через вибір постачальника моделей, встановлення API-ключа та налаштування Gateway. Це займає приблизно 2 хвилини.

    Повний довідник див. у [Онбординг (CLI)](/uk/start/wizard).

  </Step>
  <Step title="Перевірте, що Gateway запущено">
    ```bash
    openclaw gateway status
    ```

    Ви маєте побачити, що Gateway слухає порт 18789.

  </Step>
  <Step title="Відкрийте панель керування">
    ```bash
    openclaw dashboard
    ```

    Це відкриє інтерфейс керування у вашому браузері. Якщо він завантажується, усе працює.

  </Step>
  <Step title="Надішліть своє перше повідомлення">
    Введіть повідомлення в чаті інтерфейсу керування, і ви маєте отримати відповідь AI.

    Хочете натомість спілкуватися з телефону? Найшвидший канал для налаштування —
    [Telegram](/uk/channels/telegram) (потрібен лише токен бота). Усі варіанти див. у [Канали](/uk/channels).

  </Step>
</Steps>

<Accordion title="Додатково: змонтуйте спеціальну збірку інтерфейсу керування">
  Якщо ви підтримуєте локалізовану або налаштовану збірку панелі керування, укажіть
  `gateway.controlUi.root` на каталог, який містить зібрані статичні
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

Перезапустіть gateway і знову відкрийте панель керування:

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
  <Card title="Сполучення та безпека" href="/uk/channels/pairing" icon="shield">
    Контролюйте, хто може надсилати повідомлення вашому агенту.
  </Card>
  <Card title="Налаштуйте Gateway" href="/uk/gateway/configuration" icon="settings">
    Моделі, інструменти, sandbox і додаткові налаштування.
  </Card>
  <Card title="Перегляньте інструменти" href="/uk/tools" icon="wrench">
    Браузер, exec, вебпошук, skills і plugins.
  </Card>
</Columns>

<Accordion title="Додатково: змінні середовища">
  Якщо ви запускаєте OpenClaw як службовий обліковий запис або хочете використовувати власні шляхи:

- `OPENCLAW_HOME` — домашній каталог для внутрішнього визначення шляхів
- `OPENCLAW_STATE_DIR` — перевизначити каталог стану
- `OPENCLAW_CONFIG_PATH` — перевизначити шлях до конфігураційного файла

Повний довідник: [Змінні середовища](/uk/help/environment).
</Accordion>

## Пов’язане

- [Огляд установлення](/uk/install)
- [Огляд каналів](/uk/channels)
- [Налаштування](/uk/start/setup)
