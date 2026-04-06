---
read_when:
    - Запуск або налаштування онбордингу CLI
    - Налаштування нової машини
sidebarTitle: 'Onboarding: CLI'
summary: 'Онбординг CLI: покрокове налаштування gateway, workspace, каналів і Skills'
title: Онбординг (CLI)
x-i18n:
    generated_at: "2026-04-06T15:31:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6773b07afa8babf1b5ac94d857063d08094a962ee21ec96ca966e99ad57d107d
    source_path: start/wizard.md
    workflow: 15
---

# Онбординг (CLI)

Онбординг CLI — це **рекомендований** спосіб налаштування OpenClaw на macOS,
Linux або Windows (через WSL2; наполегливо рекомендовано).
Він налаштовує локальний Gateway або підключення до віддаленого Gateway, а також канали, Skills
і стандартні параметри workspace в одному покроковому сценарії.

```bash
openclaw onboard
```

<Info>
Найшвидший перший чат: відкрийте Control UI (налаштування каналу не потрібне). Виконайте
`openclaw dashboard` і спілкуйтеся в браузері. Документація: [Dashboard](/web/dashboard).
</Info>

Щоб змінити налаштування пізніше:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive`.
</Note>

<Tip>
Онбординг CLI включає крок вебпошуку, де можна вибрати провайдера,
такого як Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG або Tavily. Деяким провайдерам потрібен
API key, а інші працюють без ключа. Це також можна налаштувати пізніше через
`openclaw configure --section web`. Документація: [Web tools](/uk/tools/web).
</Tip>

## QuickStart чи Advanced

Онбординг починається з вибору **QuickStart** (типові значення) або **Advanced** (повний контроль).

<Tabs>
  <Tab title="QuickStart (типові значення)">
    - Локальний gateway (loopback)
    - Workspace за замовчуванням (або наявний workspace)
    - Порт gateway **18789**
    - Автентифікація gateway **Token** (генерується автоматично, навіть для loopback)
    - Типова політика інструментів для нових локальних налаштувань: `tools.profile: "coding"` (наявний явно заданий профіль зберігається)
    - Типове ізолювання DM: локальний онбординг записує `session.dmScope: "per-channel-peer"`, якщо значення не встановлено. Докладніше: [CLI Setup Reference](/uk/start/wizard-cli-reference#outputs-and-internals)
    - Експозиція Tailscale **Вимкнена**
    - Telegram і WhatsApp DM за замовчуванням мають режим **allowlist** (вам запропонують вказати ваш номер телефону)
  </Tab>
  <Tab title="Advanced (повний контроль)">
    - Відкриває всі кроки (режим, workspace, gateway, канали, daemon, Skills).
  </Tab>
</Tabs>

## Що налаштовує онбординг

**Локальний режим (за замовчуванням)** проводить вас через такі кроки:

1. **Модель/автентифікація** — виберіть будь-який підтримуваний сценарій провайдера/автентифікації (API key, OAuth або ручна автентифікація, специфічна для провайдера), включно з Custom Provider
   (OpenAI-compatible, Anthropic-compatible або Unknown auto-detect). Виберіть модель за замовчуванням.
   Примітка щодо безпеки: якщо цей агент виконуватиме інструменти або оброблятиме вміст webhook/hooks, віддавайте перевагу найсильнішій доступній моделі останнього покоління та зберігайте сувору політику інструментів. Слабші/старіші рівні легше піддаються prompt injection.
   Для неінтерактивних запусків `--secret-input-mode ref` зберігає env-backed refs у профілях автентифікації замість відкритих значень API key.
   У неінтерактивному режимі `ref` змінна середовища провайдера має бути встановлена; передавання вбудованих прапорців ключів без цієї env var призводить до негайної помилки.
   В інтерактивних запусках вибір режиму secret reference дозволяє вказати або змінну середовища, або налаштований ref провайдера (`file` або `exec`), із швидкою попередньою перевіркою перед збереженням.
   Для Anthropic інтерактивний onboarding/configure пропонує **Anthropic Claude CLI** як бажаний локальний шлях і **Anthropic API key** як рекомендований шлях для production. Anthropic setup-token також залишається доступним як підтримуваний шлях автентифікації токеном.
2. **Workspace** — розташування для файлів агента (за замовчуванням `~/.openclaw/workspace`). Створює початкові bootstrap-файли.
3. **Gateway** — порт, bind address, режим автентифікації, експозиція Tailscale.
   В інтерактивному режимі token виберіть стандартне зберігання токена у відкритому вигляді або увімкніть SecretRef.
   Неінтерактивний шлях SecretRef для token: `--gateway-token-ref-env <ENV_VAR>`.
4. **Канали** — вбудовані та комплектні чат-канали, такі як BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp тощо.
5. **Daemon** — встановлює LaunchAgent (macOS), systemd user unit (Linux/WSL2) або нативне Windows Scheduled Task із резервним варіантом через Startup folder для кожного користувача.
   Якщо для token auth потрібен token, а `gateway.auth.token` керується через SecretRef, встановлення daemon перевіряє його, але не зберігає визначений token у метаданих середовища сервісу supervisor.
   Якщо для token auth потрібен token, а налаштований token SecretRef не визначається, встановлення daemon блокується з практичними вказівками.
   Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, встановлення daemon блокується, доки режим не буде явно задано.
6. **Перевірка працездатності** — запускає Gateway і перевіряє, що він працює.
7. **Skills** — установлює рекомендовані Skills і необов’язкові залежності.

<Note>
Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Reset** (або не передасте `--reset`).
CLI `--reset` за замовчуванням скидає config, credentials і sessions; використовуйте `--reset-scope full`, щоб також включити workspace.
Якщо config недійсний або містить застарілі ключі, онбординг попросить вас спочатку виконати `openclaw doctor`.
</Note>

**Віддалений режим** налаштовує лише локальний клієнт для підключення до Gateway в іншому місці.
Він **не** встановлює та не змінює нічого на віддаленому хості.

## Додати ще одного агента

Використовуйте `openclaw agents add <name>`, щоб створити окремого агента з власними workspace,
sessions і профілями автентифікації. Запуск без `--workspace` запускає онбординг.

Що він встановлює:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примітки:

- Workspace за замовчуванням мають формат `~/.openclaw/workspace-<agentId>`.
- Додайте `bindings`, щоб маршрутизувати вхідні повідомлення (онбординг може це зробити).
- Неінтерактивні прапорці: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Повний довідник

Докладні покрокові розбори й результати config див. у
[CLI Setup Reference](/uk/start/wizard-cli-reference).
Неінтерактивні приклади див. у [CLI Automation](/uk/start/wizard-cli-automation).
Глибший технічний довідник, включно з деталями RPC, див. у
[Onboarding Reference](/uk/reference/wizard).

## Пов’язана документація

- Довідник команд CLI: [`openclaw onboard`](/cli/onboard)
- Огляд онбордингу: [Onboarding Overview](/uk/start/onboarding-overview)
- Онбординг застосунку macOS: [Onboarding](/uk/start/onboarding)
- Ритуал першого запуску агента: [Agent Bootstrapping](/uk/start/bootstrapping)
