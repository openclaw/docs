---
read_when:
    - Налаштування нового комп’ютера
    - Вам потрібне «найновіше й найкраще», не ламаючи власне налаштування
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-06-27T18:22:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Якщо ви налаштовуєте вперше, почніть із [Початку роботи](/uk/start/getting-started).
Докладніше про онбординг див. [Онбординг (CLI)](/uk/start/wizard).
</Note>

## Коротко

Виберіть процес налаштування залежно від того, як часто ви хочете отримувати оновлення і чи хочете запускати Gateway самостійно:

- **Персоналізація живе поза репозиторієм:** зберігайте конфігурацію та робочу область у `~/.openclaw/openclaw.json` і `~/.openclaw/workspace/`, щоб оновлення репозиторію їх не зачіпали.
- **Стабільний процес (рекомендовано для більшості):** встановіть застосунок macOS і дозвольте йому запускати вбудований Gateway.
- **Процес на передньому краї (dev):** запускайте Gateway самостійно через `pnpm gateway:watch`, а потім дозвольте застосунку macOS під’єднатися в локальному режимі.

## Передумови (із вихідного коду)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.19+`, усе ще підтримується)
- `pnpm` потрібен для checkout-ів вихідного коду. OpenClaw завантажує вбудовані plugins із пакетів робочої області pnpm `extensions/*` у режимі розробки, тому кореневий `npm install` не готує повне дерево вихідного коду.
- Docker (необов’язково; лише для контейнеризованого налаштування/e2e - див. [Docker](/uk/install/docker))

## Стратегія персоналізації (щоб оновлення не шкодили)

Якщо ви хочете «100% персоналізовано для мене» _і_ прості оновлення, зберігайте свої налаштування в:

- **Конфігурація:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Робоча область:** `~/.openclaw/workspace` (skills, prompts, memories; зробіть її приватним git-репозиторієм)

Одноразова ініціалізація:

```bash
openclaw setup
```

Зсередини цього репозиторію використовуйте локальну точку входу CLI:

```bash
openclaw setup
```

Якщо глобального встановлення ще немає, запустіть через `pnpm openclaw setup`.

## Запуск Gateway із цього репозиторію

Після `pnpm build` можна запускати запакований CLI напряму:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний процес (спочатку застосунок macOS)

1. Встановіть і запустіть **OpenClaw.app** (панель меню).
2. Виконайте контрольний список онбордингу/дозволів (запити TCC).
3. Переконайтеся, що Gateway має режим **Local** і працює (ним керує застосунок).
4. Під’єднайте поверхні (приклад: WhatsApp):

```bash
openclaw channels login
```

5. Перевірка працездатності:

```bash
openclaw health
```

Якщо онбординг недоступний у вашій збірці:

- Запустіть `openclaw setup`, потім `openclaw channels login`, потім запустіть Gateway вручну (`openclaw gateway`).

## Процес на передньому краї (Gateway у терміналі)

Мета: працювати над TypeScript Gateway, отримати гаряче перезавантаження, тримати UI застосунку macOS під’єднаним.

### 0) (Необов’язково) Запустіть застосунок macOS також із вихідного коду

Якщо ви також хочете застосунок macOS на передньому краї:

```bash
./scripts/restart-mac.sh
```

### 1) Запустіть dev Gateway

```bash
pnpm install
# Лише перший запуск (або після скидання локальної конфігурації/робочої області OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` запускає або перезапускає процес спостереження Gateway в іменованій сесії tmux і автоматично під’єднується з інтерактивних терміналів. Неінтерактивні оболонки залишаються від’єднаними й друкують `tmux attach -t openclaw-gateway-watch-main`; використовуйте `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, щоб інтерактивний запуск лишався від’єднаним, або `pnpm gateway:watch:raw` для режиму спостереження на передньому плані. Спостерігач перезавантажується при релевантних змінах вихідного коду, конфігурації та метаданих вбудованих plugins. Якщо спостережуваний Gateway завершується під час запуску, `gateway:watch` один раз запускає `openclaw doctor --fix --non-interactive` і повторює спробу; задайте `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, щоб вимкнути цей dev-only прохід виправлення.
`pnpm openclaw setup` — це одноразовий крок ініціалізації локальної конфігурації/робочої області для свіжого checkout-а.
`pnpm gateway:watch` не перебудовує `dist/control-ui`, тому повторно запустіть `pnpm ui:build` після змін у `ui/` або використовуйте `pnpm ui:dev` під час розробки Control UI.

### 2) Спрямуйте застосунок macOS на запущений Gateway

У **OpenClaw.app**:

- Режим підключення: **Local**
  Застосунок під’єднається до запущеного gateway на налаштованому порту.

### 3) Перевірте

- Статус Gateway у застосунку має показувати **"Using existing gateway …"**
- Або через CLI:

```bash
openclaw health
```

### Поширені пастки

- **Неправильний порт:** Gateway WS типово використовує `ws://127.0.0.1:18789`; тримайте застосунок і CLI на одному порту.
- **Де живе стан:**
  - Стан каналу/провайдера: `~/.openclaw/credentials/`
  - Профілі автентифікації моделі: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сесії: `~/.openclaw/agents/<agentId>/sessions/`
  - Журнали: `/tmp/openclaw/`

## Мапа зберігання облікових даних

Використовуйте це під час налагодження автентифікації або вирішення, що резервно копіювати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен бота Telegram**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; символічні посилання відхиляються)
- **Токен бота Discord**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Списки дозволених для pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (обліковий запис за замовчуванням)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (облікові записи не за замовчуванням)
- **Профілі автентифікації моделі**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Корисне навантаження секретів на основі файлу (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Безпека](/uk/gateway/security#credential-storage-map).

## Оновлення (без руйнування вашого налаштування)

- Тримайте `~/.openclaw/workspace` і `~/.openclaw/` як «ваші речі»; не кладіть особисті prompts/config у репозиторій `openclaw`.
- Оновлення вихідного коду: `git pull` + `pnpm install` + продовжуйте використовувати `pnpm gateway:watch`.

## Linux (користувацький сервіс systemd)

Встановлення Linux використовують **користувацький** сервіс systemd. Типово systemd зупиняє користувацькі сервіси під час виходу з системи/бездіяльності, що завершує Gateway. Онбординг намагається ввімкнути lingering для вас (може попросити sudo). Якщо це все ще вимкнено, запустіть:

```bash
sudo loginctl enable-linger $USER
```

Для серверів, що мають працювати постійно або для кількох користувачів, розгляньте **системний** сервіс замість користувацького (lingering не потрібен). Див. [runbook Gateway](/uk/gateway) для приміток щодо systemd.

## Пов’язані документи

- [runbook Gateway](/uk/gateway) (прапорці, супервізія, порти)
- [Конфігурація Gateway](/uk/gateway/configuration) (схема конфігурації + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (reply tags + налаштування replyToMode)
- [Налаштування асистента OpenClaw](/uk/start/openclaw)
- [Застосунок macOS](/uk/platforms/macos) (життєвий цикл gateway)
