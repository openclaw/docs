---
read_when:
    - Перше налаштування з нуля
    - Вам потрібен найшвидший шлях до робочого чату
summary: Установіть OpenClaw і запустіть свій перший чат за лічені хвилини.
title: Початок роботи
x-i18n:
    generated_at: "2026-06-27T18:21:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

Установіть OpenClaw, запустіть онбординг і спілкуйтеся зі своїм AI-асистентом — усе це
приблизно за 5 хвилин. У підсумку ви матимете запущений Gateway, налаштовану автентифікацію
і робочий сеанс чату.

## Що потрібно

- **Node.js** — рекомендовано Node 24 (Node 22.19+ також підтримується)
- **API-ключ** від провайдера моделей (Anthropic, OpenAI, Google тощо) — онбординг запросить його у вас

<Tip>
Перевірте версію Node за допомогою `node --version`.
**Користувачі Windows:** нативний застосунок Windows Hub — найпростіший настільний шлях. Інсталятор
PowerShell і шляхи WSL2 Gateway також підтримуються. Див. [Windows](/uk/platforms/windows).
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
  alt="Процес інсталяції скриптом"
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
    Інші способи інсталяції (Docker, Nix, npm): [Інсталяція](/uk/install).
    </Note>

  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --install-daemon
    ```

    Майстер проведе вас через вибір провайдера моделей, налаштування API-ключа
    і конфігурацію Gateway. Це займає приблизно 2 хвилини.

    Повну довідку див. у [Онбординг (CLI)](/uk/start/wizard).

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

    Це відкриє Control UI у вашому браузері. Якщо він завантажується, усе працює.

  </Step>
  <Step title="Надішліть перше повідомлення">
    Введіть повідомлення в чаті Control UI, і ви маєте отримати відповідь AI.

    Хочете натомість спілкуватися з телефона? Найшвидший канал для налаштування —
    [Telegram](/uk/channels/telegram) (потрібен лише токен бота). Усі варіанти див. у [Канали](/uk/channels).

  </Step>
</Steps>

<Accordion title="Розширено: змонтуйте власну збірку Control UI">
  Якщо ви підтримуєте локалізовану або кастомізовану збірку панелі керування, вкажіть
  для `gateway.controlUi.root` каталог, що містить зібрані статичні
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
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo тощо.
  </Card>
  <Card title="Сполучення та безпека" href="/uk/channels/pairing" icon="shield">
    Керуйте тим, хто може надсилати повідомлення вашому агенту.
  </Card>
  <Card title="Налаштуйте Gateway" href="/uk/gateway/configuration" icon="settings">
    Моделі, інструменти, sandbox і розширені налаштування.
  </Card>
  <Card title="Перегляньте інструменти" href="/uk/tools" icon="wrench">
    Браузер, exec, вебпошук, Skills і plugins.
  </Card>
</Columns>

<Accordion title="Розширено: змінні середовища">
  Якщо ви запускаєте OpenClaw як службовий обліковий запис або хочете власні шляхи:

- `OPENCLAW_HOME` — домашній каталог для внутрішнього визначення шляхів
- `OPENCLAW_STATE_DIR` — перевизначає каталог стану
- `OPENCLAW_CONFIG_PATH` — перевизначає шлях до файлу конфігурації

Повна довідка: [Змінні середовища](/uk/help/environment).
</Accordion>

## Пов’язане

- [Огляд інсталяції](/uk/install)
- [Огляд каналів](/uk/channels)
- [Налаштування](/uk/start/setup)
