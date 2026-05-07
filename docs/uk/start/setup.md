---
read_when:
    - Налаштування нового комп’ютера
    - Вам потрібне «найновіше + найкраще» без ризику зламати вашу особисту конфігурацію
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-05-07T15:13:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
Якщо ви налаштовуєте вперше, почніть із [Початку роботи](/uk/start/getting-started).
Докладніше про онбординг див. у [Онбординг (CLI)](/uk/start/wizard).
</Note>

## Коротко

Виберіть робочий процес налаштування залежно від того, як часто ви хочете отримувати оновлення і чи хочете запускати Gateway самостійно:

- **Персоналізація живе поза репозиторієм:** тримайте конфігурацію й робочий простір у `~/.openclaw/openclaw.json` і `~/.openclaw/workspace/`, щоб оновлення репозиторію їх не зачіпали.
- **Стабільний робочий процес (рекомендовано для більшості):** установіть застосунок macOS і дозвольте йому запускати вбудований Gateway.
- **Робочий процес переднього краю (dev):** запустіть Gateway самостійно через `pnpm gateway:watch`, а потім дозвольте застосунку macOS під’єднатися в режимі Local.

## Передумови (з вихідного коду)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.16+`, усе ще підтримується)
- `pnpm` потрібен для checkout-ів із вихідного коду. OpenClaw завантажує вбудовані плагіни з
  пакетів робочого простору pnpm `extensions/*` у dev-режимі, тому кореневий `npm install`
  не готує все дерево вихідного коду.
- Docker (необов’язково; лише для контейнеризованого налаштування/e2e - див. [Docker](/uk/install/docker))

## Стратегія персоналізації (щоб оновлення не шкодили)

Якщо ви хочете "100% tailored to me" _і_ прості оновлення, тримайте свою кастомізацію в:

- **Конфігурація:** `~/.openclaw/openclaw.json` (JSON/майже JSON5)
- **Робочий простір:** `~/.openclaw/workspace` (skills, prompts, memories; зробіть його приватним git-репозиторієм)

Одноразове початкове налаштування:

```bash
openclaw setup
```

Зсередини цього репозиторію використовуйте локальний вхід CLI:

```bash
openclaw setup
```

Якщо глобальної інсталяції ще немає, запустіть через `pnpm openclaw setup`.

## Запуск Gateway із цього репозиторію

Після `pnpm build` можна запускати запакований CLI напряму:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний робочий процес (спершу застосунок macOS)

1. Установіть і запустіть **OpenClaw.app** (рядок меню).
2. Пройдіть контрольний список онбордингу/дозволів (підказки TCC).
3. Переконайтеся, що Gateway має режим **Local** і працює (ним керує застосунок).
4. Під’єднайте поверхні (приклад: WhatsApp):

```bash
openclaw channels login
```

5. Перевірка справності:

```bash
openclaw health
```

Якщо онбординг недоступний у вашій збірці:

- Запустіть `openclaw setup`, потім `openclaw channels login`, а тоді запустіть Gateway вручну (`openclaw gateway`).

## Робочий процес переднього краю (Gateway у терміналі)

Мета: працювати над TypeScript Gateway, отримувати гаряче перезавантаження й тримати UI застосунку macOS під’єднаним.

### 0) (Необов’язково) Запустіть застосунок macOS теж із вихідного коду

Якщо ви також хочете застосунок macOS на передньому краї:

```bash
./scripts/restart-mac.sh
```

### 1) Запустіть dev Gateway

```bash
pnpm install
# Лише перший запуск (або після скидання локальної конфігурації/робочого простору OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` запускає або перезапускає процес стеження Gateway в іменованій tmux
сесії та автоматично під’єднується з інтерактивних терміналів. Неінтерактивні shell-и залишаються
від’єднаними й друкують `tmux attach -t openclaw-gateway-watch-main`; використовуйте
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, щоб інтерактивний запуск залишався
від’єднаним, або `pnpm gateway:watch:raw` для режиму стеження на передньому плані. Watcher
перезавантажується за релевантних змін вихідного коду, конфігурації та метаданих вбудованих плагінів. Якщо
спостережуваний Gateway завершується під час запуску, `gateway:watch` один раз виконує
`openclaw doctor --fix --non-interactive` і пробує знову; задайте
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, щоб вимкнути цей dev-only прохід відновлення.
`pnpm openclaw setup` — це одноразовий крок ініціалізації локальної конфігурації/робочого простору для свіжого checkout-а.
`pnpm gateway:watch` не перебудовує `dist/control-ui`, тому повторно запустіть `pnpm ui:build` після змін у `ui/` або використовуйте `pnpm ui:dev` під час розробки Control UI.

### 2) Спрямуйте застосунок macOS на ваш запущений Gateway

В **OpenClaw.app**:

- Режим підключення: **Local**
  Застосунок під’єднається до запущеного gateway на налаштованому порту.

### 3) Перевірка

- Статус Gateway у застосунку має показувати **"Using existing gateway …"**
- Або через CLI:

```bash
openclaw health
```

### Типові пастки

- **Неправильний порт:** Gateway WS за замовчуванням використовує `ws://127.0.0.1:18789`; тримайте застосунок і CLI на одному порту.
- **Де зберігається стан:**
  - Стан каналу/провайдера: `~/.openclaw/credentials/`
  - Профілі автентифікації моделей: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сесії: `~/.openclaw/agents/<agentId>/sessions/`
  - Логи: `/tmp/openclaw/`

## Мапа зберігання облікових даних

Використовуйте це під час налагодження автентифікації або коли вирішуєте, що резервно копіювати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен бота Telegram**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; символічні посилання відхиляються)
- **Токен бота Discord**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Allowlist-и сполучення**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (обліковий запис за замовчуванням)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (облікові записи не за замовчуванням)
- **Профілі автентифікації моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Файловий payload секретів (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Безпека](/uk/gateway/security#credential-storage-map).

## Оновлення (без руйнування вашого налаштування)

- Тримайте `~/.openclaw/workspace` і `~/.openclaw/` як "ваші речі"; не кладіть особисті prompts/config у репозиторій `openclaw`.
- Оновлення вихідного коду: `git pull` + `pnpm install` + продовжуйте використовувати `pnpm gateway:watch`.

## Linux (користувацький сервіс systemd)

Інсталяції Linux використовують **користувацький** сервіс systemd. За замовчуванням systemd зупиняє користувацькі
сервіси під час logout/idle, що завершує Gateway. Онбординг намагається увімкнути
lingering для вас (може попросити sudo). Якщо його досі вимкнено, виконайте:

```bash
sudo loginctl enable-linger $USER
```

Для серверів always-on або багатокористувацьких серверів розгляньте **системний** сервіс замість
користувацького сервісу (lingering не потрібен). Див. [runbook Gateway](/uk/gateway) для нотаток щодо systemd.

## Пов’язані документи

- [runbook Gateway](/uk/gateway) (прапорці, супервізія, порти)
- [Конфігурація Gateway](/uk/gateway/configuration) (схема конфігурації + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (теги відповіді + налаштування replyToMode)
- [Налаштування асистента OpenClaw](/uk/start/openclaw)
- [Застосунок macOS](/uk/platforms/macos) (життєвий цикл gateway)
