---
read_when:
    - Запуск або налаштування CLI onboarding
    - Налаштування нової машини
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI onboarding: покрокове налаштування gateway, workspace, каналів і Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-23T21:12:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

CLI onboarding — це **рекомендований** спосіб налаштування OpenClaw на macOS,
Linux або Windows (через WSL2; це настійно рекомендується).
Він налаштовує локальний Gateway або підключення до віддаленого Gateway, а також канали, Skills
і типові параметри workspace в одному покроковому потоці.

```bash
openclaw onboard
```

<Info>
Найшвидший перший чат: відкрийте Control UI (налаштування каналів не потрібне). Запустіть
`openclaw dashboard` і спілкуйтеся в браузері. Документація: [Dashboard](/uk/web/dashboard).
</Info>

Щоб перевизначити налаштування пізніше:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive`.
</Note>

<Tip>
CLI onboarding включає крок web search, де можна вибрати provider,
наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG або Tavily. Деякі providers потребують
API-ключ, тоді як інші працюють без ключа. Це також можна налаштувати пізніше через
`openclaw configure --section web`. Документація: [Web tools](/uk/tools/web).
</Tip>

## QuickStart vs Advanced

Onboarding починається з вибору **QuickStart** (типові значення) або **Advanced** (повний контроль).

<Tabs>
  <Tab title="QuickStart (типові значення)">
    - Локальний gateway (loopback)
    - Типовий workspace (або наявний workspace)
    - Порт Gateway **18789**
    - Auth Gateway **Token** (генерується автоматично, навіть на loopback)
    - Типова політика інструментів для нових локальних налаштувань: `tools.profile: "coding"` (наявний явний profile зберігається)
    - Типова ізоляція DM: локальний onboarding записує `session.dmScope: "per-channel-peer"`, якщо значення не задано. Докладніше: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals)
    - Експозиція Tailscale **Off**
    - Telegram + WhatsApp DM типово використовують **allowlist** (вам запропонують ввести свій номер телефону)

  </Tab>
  <Tab title="Advanced (повний контроль)">
    - Показує кожен крок (mode, workspace, gateway, channels, daemon, skills).

  </Tab>
</Tabs>

## Що налаштовує onboarding

**Локальний режим (типово)** проводить вас через такі кроки:

1. **Модель/Auth** — виберіть будь-який підтримуваний потік provider/auth (API key, OAuth або ручний auth, специфічний для provider), включно з Custom Provider
   (OpenAI-compatible, Anthropic-compatible або Unknown auto-detect). Виберіть типову модель.
   Примітка щодо безпеки: якщо цей агент виконуватиме інструменти або оброблятиме вміст webhook/hooks, надавайте перевагу найсильнішій доступній моделі останнього покоління й зберігайте сувору політику інструментів. Слабші/старіші рівні легше піддаються prompt injection.
   Для неінтерактивних запусків `--secret-input-mode ref` зберігає в auth profiles посилання на env замість plaintext-значень API-ключів.
   У неінтерактивному режимі `ref` env var provider має бути задана; передавання inline-прапорців ключів без цієї env var завершується швидкою помилкою.
   В інтерактивних запусках вибір режиму посилання на секрет дає змогу вказати або змінну середовища, або налаштоване посилання provider (`file` або `exec`), із швидкою попередньою перевіркою перед збереженням.
   Для Anthropic інтерактивний onboarding/configure пропонує **Anthropic Claude CLI** як бажаний локальний шлях і **Anthropic API key** як рекомендований production-шлях. Anthropic setup-token також залишається доступним як підтримуваний шлях token-auth.
2. **Workspace** — розташування для файлів агента (типово `~/.openclaw/workspace`). Ініціалізує bootstrap-файли.
3. **Gateway** — порт, bind-адреса, режим auth, експозиція Tailscale.
   В інтерактивному режимі token можна вибрати типове збереження plaintext token або перейти на SecretRef.
   Шлях SecretRef токена в неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — вбудовані та bundled чат-канали, такі як BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp та інші.
5. **Daemon** — установлює LaunchAgent (macOS), systemd user unit (Linux/WSL2) або нативний Windows Scheduled Task із резервним варіантом через Startup-folder поточного користувача.
   Якщо auth токеном потребує токен, а `gateway.auth.token` керується через SecretRef, встановлення демона перевіряє його, але не зберігає розв’язаний токен у plaintext у метаданих середовища supervisor service.
   Якщо auth токеном потребує токен, а налаштований SecretRef токена не розв’язується, встановлення демона блокується з практичними вказівками.
   Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення демона блокується, доки mode не буде задано явно.
6. **Health check** — запускає Gateway і перевіряє, що він працює.
7. **Skills** — установлює рекомендовані Skills і необов’язкові залежності.

<Note>
Повторний запуск onboarding **не** стирає нічого, якщо ви явно не виберете **Reset** (або не передасте `--reset`).
CLI `--reset` типово охоплює config, credentials і sessions; використовуйте `--reset-scope full`, щоб включити workspace.
Якщо config невалідна або містить legacy keys, onboarding просить спочатку запустити `openclaw doctor`.
</Note>

**Віддалений режим** налаштовує лише локальний клієнт для підключення до Gateway в іншому місці.
Він **не** встановлює і не змінює нічого на віддаленому хості.

## Додати ще одного агента

Використовуйте `openclaw agents add <name>`, щоб створити окремого агента з власними workspace,
sessions і auth profiles. Запуск без `--workspace` запускає onboarding.

Що це налаштовує:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примітки:

- Типові workspace мають вигляд `~/.openclaw/workspace-<agentId>`.
- Додайте `bindings`, щоб маршрутизувати вхідні повідомлення (onboarding може зробити це).
- Неінтерактивні прапорці: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Повний довідник

Докладні покрокові розбори та результати запису в config див. у
[Довіднику з налаштування CLI](/uk/start/wizard-cli-reference).
Неінтерактивні приклади див. у [CLI Automation](/uk/start/wizard-cli-automation).
Глибший технічний довідник, включно з деталями RPC, див. у
[Onboarding Reference](/uk/reference/wizard).

## Пов’язана документація

- Довідник команд CLI: [`openclaw onboard`](/uk/cli/onboard)
- Огляд onboarding: [Огляд onboarding](/uk/start/onboarding-overview)
- Onboarding застосунку macOS: [Onboarding](/uk/start/onboarding)
- Ритуал першого запуску агента: [Bootstrap агента](/uk/start/bootstrapping)
