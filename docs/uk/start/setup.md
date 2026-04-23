---
read_when:
    - Налаштування нової машини
    - Ви хочете «найновіше й найкраще» без ризику зламати своє особисте налаштування
summary: Розширене налаштування та робочі процеси розробки для OpenClaw
title: Налаштування
x-i18n:
    generated_at: "2026-04-23T21:12:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: adab2d265c52feb90db2532501d552e8e05a029d1c96f8f252f4b6f6f1effad9
    source_path: start/setup.md
    workflow: 15
---

<Note>
Якщо ви налаштовуєте систему вперше, почніть із [Початку роботи](/uk/start/getting-started).
Докладніше про onboarding див. в [Onboarding (CLI)](/uk/start/wizard).
</Note>

## TL;DR

- **Індивідуальне налаштування живе поза repo:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (config).
- **Стабільний робочий процес:** встановіть застосунок macOS; нехай він запускає bundled Gateway.
- **Bleeding edge workflow:** запускайте Gateway самостійно через `pnpm gateway:watch`, а потім нехай застосунок macOS підключається в режимі Local.

## Передумови (зі source)

- Рекомендовано Node 24 (Node 22 LTS, наразі `22.14+`, також підтримується)
- Бажано `pnpm` (або Bun, якщо ви свідомо використовуєте [робочий процес Bun](/uk/install/bun))
- Docker (необов’язково; лише для containerized setup/e2e — див. [Docker](/uk/install/docker))

## Стратегія індивідуального налаштування (щоб оновлення не шкодили)

Якщо ви хочете «100% налаштовано під мене» _і_ легкі оновлення, тримайте свої кастомізації в:

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompt-и, memory; зробіть його приватним git repo)

Одноразовий bootstrap:

```bash
openclaw setup
```

Із цього repo використовуйте локальний вхід CLI:

```bash
openclaw setup
```

Якщо у вас ще немає глобального встановлення, запускайте це через `pnpm openclaw setup` (або `bun run openclaw setup`, якщо використовуєте workflow Bun).

## Запуск Gateway з цього repo

Після `pnpm build` ви можете запускати packaged CLI напряму:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Стабільний робочий процес (спочатку застосунок macOS)

1. Встановіть і запустіть **OpenClaw.app** (menu bar).
2. Завершіть checklist onboarding/permissions (prompt-и TCC).
3. Переконайтеся, що Gateway у режимі **Local** і запущений (застосунок керує ним).
4. Прив’яжіть поверхні (приклад: WhatsApp):

```bash
openclaw channels login
```

5. Перевірка здорового стану:

```bash
openclaw health
```

Якщо onboarding недоступний у вашій збірці:

- Запустіть `openclaw setup`, потім `openclaw channels login`, а потім запустіть Gateway вручну (`openclaw gateway`).

## Bleeding edge workflow (Gateway у терміналі)

Мета: працювати над TypeScript Gateway, отримати hot reload і зберегти підключений UI застосунку macOS.

### 0) (Необов’язково) Запускайте також застосунок macOS зі source

Якщо ви також хочете мати застосунок macOS на bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Запустіть dev Gateway

```bash
pnpm install
# Лише під час першого запуску (або після скидання локальної config/workspace OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` запускає gateway у режимі watch і перезавантажує його при релевантних змінах source,
config і метаданих bundled Plugin-ів.
`pnpm openclaw setup` — це одноразовий крок ініціалізації локальної config/workspace для нового checkout.
`pnpm gateway:watch` не перебудовує `dist/control-ui`, тож після змін у `ui/` повторно запускайте `pnpm ui:build` або використовуйте `pnpm ui:dev` під час розробки UI Control.

Якщо ви свідомо використовуєте workflow Bun, еквівалентні команди такі:

```bash
bun install
# Лише під час першого запуску (або після скидання локальної config/workspace OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Спрямуйте застосунок macOS на ваш запущений Gateway

У **OpenClaw.app**:

- Режим підключення: **Local**
  Застосунок підключиться до запущеного gateway на налаштованому порту.

### 3) Перевірте

- У застосунку статус Gateway має показувати **“Using existing gateway …”**
- Або через CLI:

```bash
openclaw health
```

### Поширені пастки

- **Неправильний порт:** Gateway WS типово використовує `ws://127.0.0.1:18789`; тримайте застосунок і CLI на одному й тому самому порту.
- **Де живе стан:**
  - Стан channel/provider: `~/.openclaw/credentials/`
  - Профілі auth моделей: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions: `~/.openclaw/agents/<agentId>/sessions/`
  - Логи: `/tmp/openclaw/`

## Мапа зберігання облікових даних

Використовуйте це під час налагодження auth або коли вирішуєте, що резервно копіювати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен Telegram-бота**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; symlink-и відхиляються)
- **Токен Discord-бота**: config/env або SecretRef (provider-и env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Allowlist-и pairing:**
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (типовий акаунт)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (нетипові акаунти)
- **Профілі auth моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload секретів із файла (необов’язково)**: `~/.openclaw/secrets.json`
- **Застарілий імпорт OAuth**: `~/.openclaw/credentials/oauth.json`
  Докладніше: [Безпека](/uk/gateway/security#credential-storage-map).

## Оновлення (не ламаючи своє налаштування)

- Тримайте `~/.openclaw/workspace` і `~/.openclaw/` як «свої речі»; не кладіть персональні prompt-и/config у repo `openclaw`.
- Оновлення source: `git pull` + крок встановлення вашого package manager-а (`pnpm install` типово; `bun install` для workflow Bun) + продовжуйте використовувати відповідну команду `gateway:watch`.

## Linux (user service systemd)

Встановлення в Linux використовують systemd **user** service. Типово systemd зупиняє user
service під час logout/idle, що вбиває Gateway. Onboarding намагається ввімкнути
lingering за вас (може попросити sudo). Якщо його все ще вимкнено, виконайте:

```bash
sudo loginctl enable-linger $USER
```

Для завжди ввімкнених або multi-user server-ів розгляньте **system** service замість
user service (lingering не потрібен). Нотатки щодо systemd див. у [runbook Gateway](/uk/gateway).

## Пов’язані документи

- [Runbook Gateway](/uk/gateway) (прапорці, супервізія, порти)
- [Конфігурація Gateway](/uk/gateway/configuration) (схема config + приклади)
- [Discord](/uk/channels/discord) і [Telegram](/uk/channels/telegram) (reply tags + налаштування replyToMode)
- [Налаштування асистента OpenClaw](/uk/start/openclaw)
- [Застосунок macOS](/uk/platforms/macos) (життєвий цикл gateway)
