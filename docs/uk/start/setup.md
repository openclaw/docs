---
read_when:
    - Налаштування нового комп’ютера
    - Ви хочете «найновіше й найкраще», не ламаючи свою особисту конфігурацію
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-05-03T16:15:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
Якщо ви налаштовуєте вперше, почніть із [Початку роботи](/uk/start/getting-started).
Докладніше про онбординг див. у [Онбординг (CLI)](/uk/start/wizard).
</Note>

## TL;DR

Виберіть робочий процес налаштування залежно від того, як часто ви хочете отримувати оновлення і чи хочете запускати Gateway самостійно:

- **Адаптація живе поза репозиторієм:** тримайте свою конфігурацію і робочий простір у `~/.openclaw/openclaw.json` і `~/.openclaw/workspace/`, щоб оновлення репозиторію їх не зачіпали.
- **Стабільний робочий процес (рекомендовано для більшості):** установіть застосунок macOS і дозвольте йому запускати вбудований Gateway.
- **Робочий процес на передньому краї (розробка):** запустіть Gateway самостійно через `pnpm gateway:watch`, а потім дозвольте застосунку macOS під’єднатися в локальному режимі.

## Передумови (із вихідного коду)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.14+`, досі підтримується)
- `pnpm` потрібен для checkout-ів вихідного коду. OpenClaw завантажує вбудовані Plugin з пакетів pnpm workspace
  `extensions/*` у режимі розробки, тому кореневий `npm install`
  не готує повне дерево вихідного коду.
- Docker (необов’язково; лише для контейнеризованого налаштування/e2e — див. [Docker](/uk/install/docker))

## Стратегія адаптації (щоб оновлення не шкодили)

Якщо ви хочете «100% під мене» _і_ прості оновлення, тримайте свої налаштування в:

- **Конфігурація:** `~/.openclaw/openclaw.json` (JSON/схоже на JSON5)
- **Робочий простір:** `~/.openclaw/workspace` (skills, prompts, memories; зробіть його приватним git-репозиторієм)

Один раз виконайте початкове налаштування:

```bash
openclaw setup
```

Зсередини цього репозиторію використовуйте локальну точку входу CLI:

```bash
openclaw setup
```

Якщо у вас ще немає глобального встановлення, запустіть через `pnpm openclaw setup`.

## Запуск Gateway із цього репозиторію

Після `pnpm build` ви можете запустити упакований CLI напряму:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний робочий процес (спершу застосунок macOS)

1. Установіть і запустіть **OpenClaw.app** (рядок меню).
2. Завершіть контрольний список онбордингу/дозволів (запити TCC).
3. Переконайтеся, що Gateway має режим **Local** і працює (застосунок керує ним).
4. Під’єднайте поверхні (приклад: WhatsApp):

```bash
openclaw channels login
```

5. Перевірка працездатності:

```bash
openclaw health
```

Якщо онбординг недоступний у вашій збірці:

- Запустіть `openclaw setup`, потім `openclaw channels login`, а потім запустіть Gateway вручну (`openclaw gateway`).

## Робочий процес на передньому краї (Gateway у терміналі)

Мета: працювати над TypeScript Gateway, отримувати hot reload і тримати UI застосунку macOS під’єднаним.

### 0) (Необов’язково) Запускайте застосунок macOS також із вихідного коду

Якщо ви також хочете застосунок macOS на передньому краї:

```bash
./scripts/restart-mac.sh
```

### 1) Запустіть dev Gateway

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` запускає або перезапускає процес спостереження Gateway в іменованій tmux
сесії й автоматично приєднується з інтерактивних терміналів. Неінтерактивні оболонки залишаються
від’єднаними й виводять `tmux attach -t openclaw-gateway-watch-main`; використовуйте
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, щоб інтерактивний запуск
залишався від’єднаним, або `pnpm gateway:watch:raw` для режиму спостереження на передньому плані. Спостерігач
перезавантажується за релевантних змін у вихідному коді, конфігурації та метаданих вбудованих Plugin. Якщо
відстежуваний Gateway завершується під час запуску, `gateway:watch` один раз запускає
`openclaw doctor --fix --non-interactive` і повторює спробу; встановіть
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, щоб вимкнути цей dev-only прохід виправлення.
`pnpm openclaw setup` — це одноразовий крок ініціалізації локальної конфігурації/робочого простору для свіжого checkout.
`pnpm gateway:watch` не перебудовує `dist/control-ui`, тому повторно запускайте `pnpm ui:build` після змін у `ui/` або використовуйте `pnpm ui:dev` під час розробки Control UI.

### 2) Спрямуйте застосунок macOS на запущений Gateway

У **OpenClaw.app**:

- Режим підключення: **Local**
  Застосунок під’єднається до запущеного gateway на налаштованому порту.

### 3) Перевірте

- Статус Gateway у застосунку має показувати **«Використовується наявний gateway …»**
- Або через CLI:

```bash
openclaw health
```

### Поширені пастки

- **Неправильний порт:** Gateway WS за замовчуванням використовує `ws://127.0.0.1:18789`; тримайте застосунок і CLI на одному порту.
- **Де зберігається стан:**
  - Стан channel/provider: `~/.openclaw/credentials/`
  - Профілі автентифікації моделей: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сесії: `~/.openclaw/agents/<agentId>/sessions/`
  - Журнали: `/tmp/openclaw/`

## Карта зберігання облікових даних

Використовуйте це під час налагодження автентифікації або вирішення, що резервувати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен Telegram bot**: конфігурація/env або `channels.telegram.tokenFile` (лише звичайний файл; симлінки відхиляються)
- **Токен Discord bot**: конфігурація/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: конфігурація/env (`channels.slack.*`)
- **Дозвільні списки сполучення**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (обліковий запис за замовчуванням)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (облікові записи не за замовчуванням)
- **Профілі автентифікації моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Корисне навантаження секретів із файловим бекендом (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Безпека](/uk/gateway/security#credential-storage-map).

## Оновлення (без руйнування вашого налаштування)

- Тримайте `~/.openclaw/workspace` і `~/.openclaw/` як «ваші речі»; не кладіть особисті prompts/конфігурацію в репозиторій `openclaw`.
- Оновлення вихідного коду: `git pull` + `pnpm install` + продовжуйте використовувати `pnpm gateway:watch`.

## Linux (systemd user service)

Встановлення Linux використовують **користувацьку** службу systemd. За замовчуванням systemd зупиняє користувацькі
служби під час виходу/простою, що завершує Gateway. Онбординг намагається ввімкнути
lingering для вас (може запитати sudo). Якщо він усе ще вимкнений, запустіть:

```bash
sudo loginctl enable-linger $USER
```

Для серверів, що мають працювати постійно або з кількома користувачами, розгляньте **системну** службу замість
користувацької служби (lingering не потрібен). Див. [Gateway runbook](/uk/gateway) для нотаток systemd.

## Пов’язані документи

- [Gateway runbook](/uk/gateway) (прапорці, нагляд, порти)
- [Конфігурація Gateway](/uk/gateway/configuration) (схема конфігурації + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (теги відповіді + налаштування replyToMode)
- [Налаштування асистента OpenClaw](/uk/start/openclaw)
- [Застосунок macOS](/uk/platforms/macos) (життєвий цикл gateway)
