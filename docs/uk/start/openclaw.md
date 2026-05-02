---
read_when:
    - Початкове налаштування нового екземпляра асистента
    - Аналіз наслідків для безпеки та дозволів
summary: Повний посібник із запуску OpenClaw як персонального асистента із застереженнями щодо безпеки
title: Налаштування персонального асистента
x-i18n:
    generated_at: "2026-05-02T21:28:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f6087d0756c98741166135df8b915eb5a0803b23e68e486d2d25ec98d4dca79
    source_path: start/openclaw.md
    workflow: 16
---

# Створення персонального асистента з OpenClaw

OpenClaw — це самостійно розгорнутий Gateway, який підключає Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo та інші сервіси до AI-агентів. У цьому посібнику описано налаштування «персонального асистента»: окремий номер WhatsApp, який працює як ваш постійно доступний AI-асистент.

## ⚠️ Спершу безпека

Ви розміщуєте агента в позиції, де він може:

- виконувати команди на вашій машині (залежно від вашої політики інструментів)
- читати/записувати файли у вашому робочому просторі
- надсилати повідомлення назовні через WhatsApp/Telegram/Discord/Mattermost та інші вбудовані канали

Починайте консервативно:

- Завжди задавайте `channels.whatsapp.allowFrom` (ніколи не запускайте доступ «для всього світу» на своєму персональному Mac).
- Використовуйте окремий номер WhatsApp для асистента.
- Heartbeat тепер за замовчуванням запускається кожні 30 хвилин. Вимкніть його, доки не довірятимете налаштуванню, встановивши `agents.defaults.heartbeat.every: "0m"`.

## Передумови

- OpenClaw встановлено й початково налаштовано — див. [Початок роботи](/uk/start/getting-started), якщо ви ще цього не зробили
- Другий номер телефону (SIM/eSIM/передплачений) для асистента

## Налаштування з двома телефонами (рекомендовано)

Вам потрібно ось це:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Якщо ви прив’яжете свій персональний WhatsApp до OpenClaw, кожне повідомлення для вас стане «вхідними даними агента». Це рідко саме те, що вам потрібно.

## Швидкий старт за 5 хвилин

1. З’єднайте WhatsApp Web (покаже QR; відскануйте його телефоном асистента):

```bash
openclaw channels login
```

2. Запустіть Gateway (залиште його працювати):

```bash
openclaw gateway --port 18789
```

3. Додайте мінімальну конфігурацію в `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Тепер надішліть повідомлення на номер асистента зі свого телефону зі списку дозволених.

Коли початкове налаштування завершиться, OpenClaw автоматично відкриє панель керування й виведе чисте посилання (без токена). Якщо панель керування попросить автентифікацію, вставте налаштований спільний секрет у налаштування Control UI. Початкове налаштування за замовчуванням використовує токен (`gateway.auth.token`), але автентифікація паролем теж працює, якщо ви перемкнули `gateway.auth.mode` на `password`. Щоб відкрити пізніше: `openclaw dashboard`.

## Надайте агенту робочий простір (AGENTS)

OpenClaw читає робочі інструкції та «пам’ять» зі свого каталогу робочого простору.

За замовчуванням OpenClaw використовує `~/.openclaw/workspace` як робочий простір агента й автоматично створить його (разом зі стартовими `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) під час налаштування або першого запуску агента. `BOOTSTRAP.md` створюється лише тоді, коли робочий простір абсолютно новий (він не має з’являтися знову після видалення). `MEMORY.md` необов’язковий (не створюється автоматично); якщо він присутній, його завантажують для звичайних сесій. Сесії підагентів додають лише `AGENTS.md` і `TOOLS.md`.

<Tip>
Ставтеся до цієї папки як до пам’яті OpenClaw і зробіть її git-репозиторієм (бажано приватним), щоб ваші `AGENTS.md` і файли пам’яті мали резервну копію. Якщо git встановлено, абсолютно нові робочі простори ініціалізуються автоматично.
</Tip>

```bash
openclaw setup
```

Повна схема робочого простору + посібник із резервного копіювання: [Робочий простір агента](/uk/concepts/agent-workspace)
Робочий процес пам’яті: [Пам’ять](/uk/concepts/memory)

Необов’язково: виберіть інший робочий простір за допомогою `agents.defaults.workspace` (підтримує `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Якщо ви вже постачаєте власні файли робочого простору з репозиторію, можете повністю вимкнути створення bootstrap-файлів:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## Конфігурація, яка перетворює це на «асистента»

OpenClaw за замовчуванням має хороше налаштування асистента, але зазвичай варто підлаштувати:

- персону/інструкції в [`SOUL.md`](/uk/concepts/soul)
- стандартні параметри мислення (за потреби)
- Heartbeat (коли ви почнете йому довіряти)

Приклад:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Сесії та пам’ять

- Файли сесій: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Метадані сесій (використання токенів, останній маршрут тощо): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (застаріле: `~/.openclaw/sessions/sessions.json`)
- `/new` або `/reset` запускає нову сесію для цього чату (налаштовується через `resetTriggers`). Якщо надіслати окремо, OpenClaw підтвердить скидання без виклику моделі.
- `/compact [instructions]` стискає контекст сесії та повідомляє про залишковий бюджет контексту.

## Heartbeat (проактивний режим)

За замовчуванням OpenClaw запускає Heartbeat кожні 30 хвилин із підказкою:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Встановіть `agents.defaults.heartbeat.every: "0m"`, щоб вимкнути.

- Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб заощадити виклики API.
- Якщо файл відсутній, Heartbeat усе одно запускається, а модель вирішує, що робити.
- Якщо агент відповідає `HEARTBEAT_OK` (необов’язково з коротким доповненням; див. `agents.defaults.heartbeat.ackMaxChars`), OpenClaw пригнічує вихідну доставку для цього Heartbeat.
- За замовчуванням доставку Heartbeat до цілей у стилі DM `user:<id>` дозволено. Встановіть `agents.defaults.heartbeat.directPolicy: "block"`, щоб пригнітити доставку до прямих цілей, залишивши запуски Heartbeat активними.
- Heartbeat запускає повні ходи агента — коротші інтервали витрачають більше токенів.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Медіа на вході й виході

Вхідні вкладення (зображення/аудіо/документи) можна передати вашій команді через шаблони:

- `{{MediaPath}}` (локальний шлях до тимчасового файла)
- `{{MediaUrl}}` (псевдо-URL)
- `{{Transcript}}` (якщо транскрибування аудіо ввімкнено)

Вихідні вкладення від агента: додайте `MEDIA:<path-or-url>` в окремому рядку (без пробілів). Приклад:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw витягує їх і надсилає як медіа разом із текстом.

Поведінка локальних шляхів дотримується тієї самої моделі довіри для читання файлів, що й агент:

- Якщо `tools.fs.workspaceOnly` має значення `true`, вихідні локальні шляхи `MEDIA:` залишаються обмеженими тимчасовим коренем OpenClaw, кешем медіа, шляхами робочого простору агента та файлами, згенерованими в пісочниці.
- Якщо `tools.fs.workspaceOnly` має значення `false`, вихідні `MEDIA:` можуть використовувати локальні файли хоста, які агенту вже дозволено читати.
- Локальні шляхи можуть бути абсолютними, відносними до робочого простору або відносними до домашнього каталогу з `~/`.
- Надсилання локальних файлів хоста все одно дозволяє лише медіа та безпечні типи документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на секрети, не вважаються медіа, придатними для надсилання.

Це означає, що згенеровані зображення/файли поза робочим простором тепер можуть надсилатися, коли ваша політика fs уже дозволяє таке читання, без повторного відкриття довільної ексфільтрації текстових вкладень із хоста.

## Контрольний список операцій

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

Журнали розташовані в `/tmp/openclaw/` (за замовчуванням: `openclaw-YYYY-MM-DD.log`).

## Наступні кроки

- WebChat: [WebChat](/uk/web/webchat)
- Операції Gateway: [Runbook Gateway](/uk/gateway)
- Cron + пробудження: [Завдання Cron](/uk/automation/cron-jobs)
- Компаньйон у рядку меню macOS: [Застосунок OpenClaw для macOS](/uk/platforms/macos)
- Застосунок вузла для iOS: [Застосунок для iOS](/uk/platforms/ios)
- Застосунок вузла для Android: [Застосунок для Android](/uk/platforms/android)
- Стан Windows: [Windows (WSL2)](/uk/platforms/windows)
- Стан Linux: [Застосунок для Linux](/uk/platforms/linux)
- Безпека: [Безпека](/uk/gateway/security)

## Пов’язане

- [Початок роботи](/uk/start/getting-started)
- [Налаштування](/uk/start/setup)
- [Огляд каналів](/uk/channels)
