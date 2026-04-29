---
read_when:
    - Налаштування нового комп’ютера
    - Ви хочете «найновіше + найкраще», не ламаючи свою особисту конфігурацію
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-04-29T08:49:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Якщо ви налаштовуєте вперше, почніть із [Початку роботи](/uk/start/getting-started).
Докладніше про onboarding див. у [Onboarding (CLI)](/uk/start/wizard).
</Note>

## Коротко

Оберіть процес налаштування залежно від того, як часто ви хочете отримувати оновлення та чи хочете запускати Gateway самостійно:

- **Персоналізація живе поза репозиторієм:** тримайте конфігурацію й робочий простір у `~/.openclaw/openclaw.json` та `~/.openclaw/workspace/`, щоб оновлення репозиторію їх не зачіпали.
- **Стабільний процес (рекомендовано для більшості):** установіть застосунок macOS і дозвольте йому запускати вбудований Gateway.
- **Найновіший процес (dev):** запускайте Gateway самостійно через `pnpm gateway:watch`, а потім під’єднайте застосунок macOS у локальному режимі.

## Передумови (із вихідного коду)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.14+`, усе ще підтримується)
- Бажано `pnpm` (або Bun, якщо ви навмисно використовуєте [процес Bun](/uk/install/bun))
- Docker (необов’язково; лише для контейнеризованого налаштування/e2e — див. [Docker](/uk/install/docker))

## Стратегія персоналізації (щоб оновлення не заважали)

Якщо вам потрібно «100% під мене» _і_ прості оновлення, тримайте налаштування в:

- **Конфігурація:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Робочий простір:** `~/.openclaw/workspace` (Skills, промпти, пам’ять; зробіть його приватним git-репозиторієм)

Виконайте початкове налаштування один раз:

```bash
openclaw setup
```

Усередині цього репозиторію використовуйте локальний вхід CLI:

```bash
openclaw setup
```

Якщо глобальної інсталяції ще немає, запустіть через `pnpm openclaw setup` (або `bun run openclaw setup`, якщо використовуєте процес Bun).

## Запуск Gateway із цього репозиторію

Після `pnpm build` можна запускати упакований CLI напряму:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний процес (спочатку застосунок macOS)

1. Установіть і запустіть **OpenClaw.app** (рядок меню).
2. Пройдіть контрольний список onboarding/дозволів (підказки TCC).
3. Переконайтеся, що Gateway має режим **Local** і запущений (ним керує застосунок).
4. Під’єднайте поверхні (приклад: WhatsApp):

```bash
openclaw channels login
```

5. Перевірка справності:

```bash
openclaw health
```

Якщо onboarding недоступний у вашій збірці:

- Запустіть `openclaw setup`, потім `openclaw channels login`, а потім запустіть Gateway вручну (`openclaw gateway`).

## Найновіший процес (Gateway у терміналі)

Мета: працювати над TypeScript Gateway, отримувати гаряче перезавантаження й тримати UI застосунку macOS під’єднаним.

### 0) (Необов’язково) Також запустіть застосунок macOS із вихідного коду

Якщо ви також хочете застосунок macOS на найновішій версії:

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

`gateway:watch` запускає або перезапускає процес спостереження Gateway в іменованій tmux
сесії та автоматично під’єднується з інтерактивних терміналів. Неінтерактивні оболонки лишаються
від’єднаними й друкують `tmux attach -t openclaw-gateway-watch-main`; використовуйте
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, щоб інтерактивний запуск
лишався від’єднаним, або `pnpm gateway:watch:raw` для режиму спостереження на передньому плані. Спостерігач
перезавантажується за релевантних змін вихідного коду, конфігурації та метаданих вбудованих plugins.
`pnpm openclaw setup` — це одноразовий крок ініціалізації локальної конфігурації/робочого простору для свіжого checkout.
`pnpm gateway:watch` не перебудовує `dist/control-ui`, тому після змін у `ui/` повторно запустіть `pnpm ui:build` або використовуйте `pnpm ui:dev` під час розробки Control UI.

Якщо ви навмисно використовуєте процес Bun, еквівалентні команди такі:

```bash
bun install
# Лише перший запуск (або після скидання локальної конфігурації/робочого простору OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Спрямуйте застосунок macOS на запущений Gateway

У **OpenClaw.app**:

- Режим підключення: **Local**
  Застосунок під’єднається до запущеного gateway на налаштованому порту.

### 3) Перевірте

- Статус Gateway у застосунку має показувати **«Using existing gateway …»**
- Або через CLI:

```bash
openclaw health
```

### Поширені пастки

- **Неправильний порт:** Gateway WS за замовчуванням використовує `ws://127.0.0.1:18789`; тримайте застосунок і CLI на одному порту.
- **Де зберігається стан:**
  - Стан каналу/провайдера: `~/.openclaw/credentials/`
  - Профілі автентифікації моделей: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Сесії: `~/.openclaw/agents/<agentId>/sessions/`
  - Логи: `/tmp/openclaw/`

## Карта зберігання облікових даних

Використовуйте це під час налагодження автентифікації або вирішення, що резервувати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен бота Telegram**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; symlinks відхиляються)
- **Токен бота Discord**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Списки дозволів для pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (обліковий запис за замовчуванням)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (облікові записи не за замовчуванням)
- **Профілі автентифікації моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload секретів із файловим бекендом (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Безпека](/uk/gateway/security#credential-storage-map).

## Оновлення (без руйнування вашого налаштування)

- Тримайте `~/.openclaw/workspace` і `~/.openclaw/` як «ваші речі»; не кладіть особисті промпти/конфігурацію в репозиторій `openclaw`.
- Оновлення вихідного коду: `git pull` + вибраний вами крок інсталяції менеджера пакетів (`pnpm install` за замовчуванням; `bun install` для процесу Bun) + продовжуйте використовувати відповідну команду `gateway:watch`.

## Linux (користувацький сервіс systemd)

Інсталяції Linux використовують **користувацький** сервіс systemd. За замовчуванням systemd зупиняє користувацькі
сервіси під час виходу/простою, що завершує Gateway. Onboarding намагається ввімкнути
lingering для вас (може попросити sudo). Якщо він досі вимкнений, запустіть:

```bash
sudo loginctl enable-linger $USER
```

Для серверів із постійною роботою або кількома користувачами розгляньте **системний** сервіс замість
користувацького сервісу (lingering не потрібен). Див. [runbook Gateway](/uk/gateway) щодо приміток systemd.

## Пов’язані документи

- [runbook Gateway](/uk/gateway) (прапорці, supervision, порти)
- [Конфігурація Gateway](/uk/gateway/configuration) (схема конфігурації + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (reply tags + налаштування replyToMode)
- [Налаштування помічника OpenClaw](/uk/start/openclaw)
- [Застосунок macOS](/uk/platforms/macos) (життєвий цикл gateway)
