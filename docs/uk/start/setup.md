---
read_when:
    - Налаштування нового комп’ютера
    - Вам потрібне «найновіше й найкраще», не ламаючи особисте налаштування
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-05-02T01:10:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
Якщо налаштовуєте вперше, почніть із [Початок роботи](/uk/start/getting-started).
Докладніше про онбординг див. [Онбординг (CLI)](/uk/start/wizard).
</Note>

## TL;DR

Виберіть сценарій налаштування залежно від того, як часто ви хочете отримувати оновлення та чи хочете запускати Gateway самостійно:

- **Індивідуальні налаштування живуть поза репозиторієм:** тримайте конфігурацію та робочий простір у `~/.openclaw/openclaw.json` і `~/.openclaw/workspace/`, щоб оновлення репозиторію їх не зачіпали.
- **Стабільний сценарій (рекомендовано для більшості):** установіть macOS-застосунок і дозвольте йому запускати вбудований Gateway.
- **Найновіший сценарій (розробка):** запускайте Gateway самостійно через `pnpm gateway:watch`, а потім дозвольте macOS-застосунку під’єднатися в локальному режимі.

## Передумови (з вихідного коду)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.14+`, досі підтримується)
- `pnpm` потрібен для checkout-ів вихідного коду. OpenClaw завантажує вбудовані plugins із пакетів робочого простору pnpm
  `extensions/*` у режимі розробки, тому кореневий `npm install` не готує повне дерево вихідного коду.
- Docker (необов’язково; лише для контейнеризованого налаштування/e2e — див. [Docker](/uk/install/docker))

## Стратегія індивідуального налаштування (щоб оновлення не шкодили)

Якщо вам потрібне “100% налаштовано під мене” _і_ прості оновлення, тримайте свої зміни тут:

- **Конфігурація:** `~/.openclaw/openclaw.json` (JSON/подібний до JSON5)
- **Робочий простір:** `~/.openclaw/workspace` (Skills, промпти, спогади; зробіть його приватним git-репозиторієм)

Початкове налаштування один раз:

```bash
openclaw setup
```

Зсередини цього репозиторію використовуйте локальний CLI-вхід:

```bash
openclaw setup
```

Якщо глобального встановлення ще немає, запустіть через `pnpm openclaw setup`.

## Запуск Gateway із цього репозиторію

Після `pnpm build` можна запускати упакований CLI напряму:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний сценарій (спочатку macOS-застосунок)

1. Установіть і запустіть **OpenClaw.app** (рядок меню).
2. Завершіть чекліст онбордингу/дозволів (TCC-запити).
3. Переконайтеся, що Gateway має режим **Local** і запущений (застосунок ним керує).
4. Під’єднайте поверхні (приклад: WhatsApp):

```bash
openclaw channels login
```

5. Перевірка справності:

```bash
openclaw health
```

Якщо онбординг недоступний у вашій збірці:

- Запустіть `openclaw setup`, потім `openclaw channels login`, а потім запустіть Gateway вручну (`openclaw gateway`).

## Найновіший сценарій (Gateway у терміналі)

Мета: працювати над TypeScript Gateway, отримувати гаряче перезавантаження й тримати UI macOS-застосунку під’єднаним.

### 0) (Необов’язково) Запустіть macOS-застосунок також із вихідного коду

Якщо ви також хочете використовувати найновішу версію macOS-застосунку:

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

`gateway:watch` запускає або перезапускає процес спостереження Gateway в іменованій tmux-сесії
та автоматично під’єднується з інтерактивних терміналів. Неінтерактивні оболонки лишаються
від’єднаними й виводять `tmux attach -t openclaw-gateway-watch-main`; використовуйте
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, щоб залишити інтерактивний запуск
від’єднаним, або `pnpm gateway:watch:raw` для режиму спостереження на передньому плані. Спостерігач
перезавантажується за релевантних змін вихідного коду, конфігурації та метаданих вбудованих plugins.
`pnpm openclaw setup` — це одноразовий крок ініціалізації локальної конфігурації/робочого простору для свіжого checkout.
`pnpm gateway:watch` не перебудовує `dist/control-ui`, тому повторно запустіть `pnpm ui:build` після змін у `ui/` або використовуйте `pnpm ui:dev` під час розробки Control UI.

### 2) Спрямуйте macOS-застосунок на ваш запущений Gateway

У **OpenClaw.app**:

- Режим підключення: **Local**
  Застосунок під’єднається до запущеного gateway на налаштованому порту.

### 3) Перевірте

- Статус Gateway у застосунку має показувати **“Using existing gateway …”**
- Або через CLI:

```bash
openclaw health
```

### Поширені пастки

- **Неправильний порт:** Gateway WS типово використовує `ws://127.0.0.1:18789`; тримайте застосунок і CLI на одному порту.
- **Де зберігається стан:**
  - Стан каналу/провайдера: `~/.openclaw/credentials/`
  - Профілі автентифікації моделі: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сесії: `~/.openclaw/agents/<agentId>/sessions/`
  - Логи: `/tmp/openclaw/`

## Мапа зберігання облікових даних

Використовуйте це під час налагодження автентифікації або вирішення, що резервувати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен бота Telegram**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; symlink-и відхиляються)
- **Токен бота Discord**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Списки дозволів для спарювання**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (типовий обліковий запис)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (нетипові облікові записи)
- **Профілі автентифікації моделі**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload секретів на базі файла (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Безпека](/uk/gateway/security#credential-storage-map).

## Оновлення (без руйнування вашого налаштування)

- Тримайте `~/.openclaw/workspace` і `~/.openclaw/` як “ваші речі”; не кладіть особисті промпти/конфігурацію в репозиторій `openclaw`.
- Оновлення вихідного коду: `git pull` + `pnpm install` + продовжуйте використовувати `pnpm gateway:watch`.

## Linux (служба systemd користувача)

Встановлення Linux використовують **користувацьку** службу systemd. Типово systemd зупиняє користувацькі
служби під час виходу/простою, що завершує Gateway. Онбординг намагається ввімкнути
lingering для вас (може запросити sudo). Якщо він досі вимкнений, запустіть:

```bash
sudo loginctl enable-linger $USER
```

Для серверів із постійною роботою або кількома користувачами розгляньте **системну** службу замість
користувацької служби (lingering не потрібен). Див. [runbook Gateway](/uk/gateway) для приміток systemd.

## Пов’язані документи

- [runbook Gateway](/uk/gateway) (прапорці, нагляд, порти)
- [Конфігурація Gateway](/uk/gateway/configuration) (схема конфігурації + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (теги відповіді + налаштування replyToMode)
- [Налаштування асистента OpenClaw](/uk/start/openclaw)
- [macOS-застосунок](/uk/platforms/macos) (життєвий цикл gateway)
