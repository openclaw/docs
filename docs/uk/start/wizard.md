---
read_when:
    - Запуск або налаштування онбордингу CLI
    - Налаштування нового комп’ютера
sidebarTitle: 'Onboarding: CLI'
summary: 'Онбординг CLI: кероване налаштування Gateway, робочого простору, каналів і Skills'
title: Початкове налаштування (CLI)
x-i18n:
    generated_at: "2026-05-06T06:20:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding — це **рекомендований** спосіб налаштувати OpenClaw на macOS,
Linux або Windows (через WSL2; наполегливо рекомендовано).
Він налаштовує локальний Gateway або підключення до віддаленого Gateway, а також канали, Skills
і типові параметри робочого простору в одному керованому процесі.

```bash
openclaw onboard
```

<Info>
Найшвидший перший чат: відкрийте Control UI (налаштування каналу не потрібне). Виконайте
`openclaw dashboard` і спілкуйтеся в браузері. Документація: [Dashboard](/uk/web/dashboard).
</Info>

Щоб переналаштувати пізніше:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive`.
</Note>

<Tip>
CLI onboarding містить крок вебпошуку, де можна вибрати провайдера,
наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG або Tavily. Деякі провайдери потребують
API-ключ, а інші працюють без ключа. Це також можна налаштувати пізніше за допомогою
`openclaw configure --section web`. Документація: [Web tools](/uk/tools/web).
</Tip>

## Швидкий старт проти розширеного режиму

Onboarding починається з **Швидкого старту** (типові параметри) або **Розширеного режиму** (повний контроль).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Локальний gateway (loopback)
    - Типовий робочий простір (або наявний робочий простір)
    - Порт Gateway **18789**
    - Автентифікація Gateway **Token** (згенерований автоматично, навіть на loopback)
    - Типова політика інструментів для нових локальних налаштувань: `tools.profile: "coding"` (наявний явно заданий профіль зберігається)
    - Типова ізоляція DM: локальний onboarding записує `session.dmScope: "per-channel-peer"`, якщо значення не задано. Докладніше: [CLI Setup Reference](/uk/start/wizard-cli-reference#outputs-and-internals)
    - Експонування Tailscale **вимкнено**
    - DM у Telegram + WhatsApp типово використовують **список дозволених** (вам буде запропоновано ввести номер телефону)

  </Tab>
  <Tab title="Advanced (full control)">
    - Показує кожен крок (режим, робочий простір, gateway, канали, daemon, Skills).

  </Tab>
</Tabs>

## Що налаштовує onboarding

**Локальний режим (типовий)** проводить вас через такі кроки:

1. **Модель/автентифікація** — виберіть будь-якого підтримуваного провайдера або потік автентифікації (API-ключ, OAuth або ручну автентифікацію, специфічну для провайдера), включно з Custom Provider
   (сумісний з OpenAI, сумісний з Anthropic або автоматичне визначення Unknown). Виберіть типову модель.
   Примітка щодо безпеки: якщо цей агент запускатиме інструменти або оброблятиме вміст webhook/hooks, віддавайте перевагу найсильнішій доступній моделі останнього покоління та тримайте політику інструментів суворою. Слабші/старіші рівні легше піддаються prompt-injection.
   Для неінтерактивних запусків `--secret-input-mode ref` зберігає посилання на основі змінних середовища в профілях автентифікації замість відкритих значень API-ключів.
   У неінтерактивному режимі `ref` змінна середовища провайдера має бути задана; передавання inline-прапорів ключа без цієї змінної середовища швидко завершується помилкою.
   В інтерактивних запусках вибір режиму посилання на секрет дає змогу вказати або змінну середовища, або налаштоване посилання провайдера (`file` чи `exec`), зі швидкою попередньою перевіркою перед збереженням.
   Для Anthropic інтерактивний onboarding/configure пропонує **Anthropic Claude CLI** як бажаний локальний шлях і **Anthropic API key** як рекомендований production-шлях. Anthropic setup-token також залишається доступним як підтримуваний шлях автентифікації за токеном.
2. **Робочий простір** — розташування файлів агента (типово `~/.openclaw/workspace`). Заповнює початкові bootstrap-файли.
3. **Gateway** — порт, адреса прив’язки, режим автентифікації, експонування Tailscale.
   В інтерактивному режимі токена виберіть типове зберігання токена у відкритому тексті або перейдіть на SecretRef.
   Шлях SecretRef для неінтерактивного токена: `--gateway-token-ref-env <ENV_VAR>`.
4. **Канали** — вбудовані та включені чат-канали, як-от BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp тощо.
5. **Daemon** — встановлює LaunchAgent (macOS), користувацький systemd unit (Linux/WSL2) або нативне Windows Scheduled Task із резервним варіантом у Startup-folder для кожного користувача.
   Якщо автентифікація токеном потребує токена, а `gateway.auth.token` керується через SecretRef, встановлення daemon перевіряє його, але не зберігає розв’язаний токен у метаданих середовища служби supervisor.
   Якщо автентифікація токеном потребує токена, а налаштований token SecretRef не розв’язано, встановлення daemon блокується з практичними вказівками.
   Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення daemon блокується, доки режим не буде задано явно.
6. **Перевірка стану** — запускає Gateway і перевіряє, що він працює.
7. **Skills** — встановлює рекомендовані Skills і необов’язкові залежності.

<Note>
Повторний запуск onboarding **не** видаляє нічого, якщо ви явно не виберете **Скидання** (або не передасте `--reset`).
CLI `--reset` типово охоплює конфігурацію, облікові дані та сеанси; використовуйте `--reset-scope full`, щоб включити робочий простір.
Якщо конфігурація недійсна або містить застарілі ключі, onboarding попросить спочатку виконати `openclaw doctor`.
</Note>

**Віддалений режим** лише налаштовує локальний клієнт для підключення до Gateway в іншому місці.
Він **не** встановлює й не змінює нічого на віддаленому хості.

## Додати іншого агента

Використовуйте `openclaw agents add <name>`, щоб створити окремого агента з власним робочим простором,
сеансами та профілями автентифікації. Запуск без `--workspace` запускає onboarding.

Що він задає:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примітки:

- Типові робочі простори відповідають `~/.openclaw/workspace-<agentId>`.
- Додайте `bindings`, щоб маршрутизувати вхідні повідомлення (onboarding може це зробити).
- Неінтерактивні прапори: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Повний довідник

Докладний покроковий розбір і вихідні дані конфігурації дивіться в
[CLI Setup Reference](/uk/start/wizard-cli-reference).
Неінтерактивні приклади дивіться в [CLI Automation](/uk/start/wizard-cli-automation).
Поглиблений технічний довідник, включно з деталями RPC, дивіться в
[Onboarding Reference](/uk/reference/wizard).

## Пов’язані документи

- Довідник команд CLI: [`openclaw onboard`](/uk/cli/onboard)
- Огляд onboarding: [Onboarding Overview](/uk/start/onboarding-overview)
- Onboarding застосунку macOS: [Onboarding](/uk/start/onboarding)
- Ритуал першого запуску агента: [Agent Bootstrapping](/uk/start/bootstrapping)
