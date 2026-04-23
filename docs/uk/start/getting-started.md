---
read_when:
    - Перше налаштування з нуля
    - Вам потрібен найшвидший шлях до робочого чату
summary: Встановіть OpenClaw і запустіть свій перший чат за лічені хвилини.
title: Початок роботи
x-i18n:
    generated_at: "2026-04-23T21:11:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d50e37b2c1ee2aa6726316ceb06ca95fd2cee671196741c2eb34fddfc0b718c5
    source_path: start/getting-started.md
    workflow: 15
---

Встановіть OpenClaw, запустіть onboarding і почніть чат із вашим ШІ-асистентом — усе це
приблизно за 5 хвилин. Наприкінці у вас буде запущений Gateway, налаштована auth
і робоча chat-session.

## Що вам потрібно

- **Node.js** — рекомендовано Node 24 (також підтримується Node 22.14+)
- **API key** від provider-а моделей (Anthropic, OpenAI, Google тощо) — onboarding попросить його

<Tip>
Перевірте версію Node командою `node --version`.
**Користувачам Windows:** підтримуються і нативний Windows, і WSL2. WSL2 більш
стабільний і рекомендований для повного досвіду. Див. [Windows](/uk/platforms/windows).
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
  alt="Install Script Process"
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
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wizard проведе вас через вибір provider-а моделі, задання API key
    і налаштування Gateway. Це займає близько 2 хвилин.

    Повний довідник див. в [Onboarding (CLI)](/uk/start/wizard).

  </Step>
  <Step title="Перевірте, що Gateway запущений">
    ```bash
    openclaw gateway status
    ```

    Ви маєте побачити, що Gateway слухає порт 18789.

  </Step>
  <Step title="Відкрийте dashboard">
    ```bash
    openclaw dashboard
    ```

    Це відкриє UI Control у вашому браузері. Якщо він завантажується, значить усе працює.

  </Step>
  <Step title="Надішліть своє перше повідомлення">
    Введіть повідомлення в чаті UI Control, і ви маєте отримати відповідь від ШІ.

    Хочете спілкуватися з телефона? Найшвидший канал для налаштування —
    [Telegram](/uk/channels/telegram) (потрібен лише токен бота). Див. [Канали](/uk/channels)
    для всіх варіантів.

  </Step>
</Steps>

<Accordion title="Розширено: монтування кастомної збірки UI Control">
  Якщо ви підтримуєте локалізовану або кастомізовану збірку dashboard, спрямуйте
  `gateway.controlUi.root` на каталог, який містить зібрані статичні
  assets і `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Скопіюйте свої зібрані статичні файли в цей каталог.
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

Перезапустіть gateway і знову відкрийте dashboard:

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
  <Card title="Pairing і безпека" href="/uk/channels/pairing" icon="shield">
    Керуйте тим, хто може писати вашому агенту.
  </Card>
  <Card title="Налаштуйте Gateway" href="/uk/gateway/configuration" icon="settings">
    Моделі, інструменти, sandbox і розширені налаштування.
  </Card>
  <Card title="Перегляньте інструменти" href="/uk/tools" icon="wrench">
    Browser, exec, web search, Skills і Plugin-и.
  </Card>
</Columns>

<Accordion title="Розширено: змінні середовища">
  Якщо ви запускаєте OpenClaw як сервісний акаунт або хочете кастомні шляхи:

- `OPENCLAW_HOME` — домашній каталог для внутрішнього визначення шляхів
- `OPENCLAW_STATE_DIR` — перевизначити каталог стану
- `OPENCLAW_CONFIG_PATH` — перевизначити шлях до config-файла

Повний довідник: [Змінні середовища](/uk/help/environment).
</Accordion>
