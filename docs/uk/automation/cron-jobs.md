---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook-и, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-04-25T05:54:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента у потрібний час і може повертати результат назад у канал чату або на endpoint Webhook.

## Швидкий старт

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## Як працює cron

- Cron працює **всередині процесу Gateway** (а не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не призводять до втрати розкладів.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json`, а `jobs-state.json` додайте до gitignore.
- Після цього розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть вважати завдання новими, оскільки поля стану виконання тепер розміщені в `jobs-state.json`.
- Усі виконання cron створюють записи [фонових завдань](/uk/automation/tasks).
- Одноразові завдання (`--at`) автоматично видаляються після успішного виконання за замовчуванням.
- Ізольовані запуски cron після завершення виконання в режимі best-effort закривають відстежувані вкладки/процеси браузера для своєї сесії `cron:<jobId>`, щоб відокремлена автоматизація браузера не залишала після себе осиротілі процеси.
- Ізольовані запуски cron також захищаються від застарілих відповідей-підтверджень. Якщо
  перший результат — це лише проміжне оновлення статусу (`on it`, `pulling everything
together` та подібні підказки), і жоден дочірній запуск субагента більше не
  відповідає за фінальну відповідь, OpenClaw повторно формує запит один раз, щоб отримати фактичний
  результат перед доставкою.

<a id="maintenance"></a>

Узгодження завдань для cron належить рантайму: активне завдання cron залишається активним, доки
рантайм cron усе ще відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірньої сесії все ще існує.
Щойно рантайм перестає володіти завданням і завершується 5-хвилинне вікно очікування, обслуговування може
позначити завдання як `lost`.

## Типи розкладу

| Тип     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова позначка часу (ISO 8601 або відносна, як-от `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | Вираз cron із 5 або 6 полів з необов’язковим `--tz`     |

Позначки часу без часового поясу обробляються як UTC. Додайте `--tz America/New_York` для планування за локальним часом.

Повторювані вирази на початку кожної години автоматично зсуваються до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### День місяця і день тижня використовують логіку OR

Вирази cron парсяться за допомогою [croner](https://github.com/Hexagon/croner). Коли і поле дня місяця, і поле дня тижня не є wildcard, croner знаходить збіг, коли **збігається будь-яке** з полів, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. OpenClaw тут використовує типову OR-поведінку Croner. Щоб вимагати виконання обох умов, використовуйте модифікатор дня тижня `+` у Croner (`0 9 15 * +1`) або плануйте за одним полем, а іншу умову перевіряйте в prompt чи команді вашого завдання.

## Стилі виконання

| Стиль          | Значення `--session` | Виконується в            | Найкраще підходить для          |
| -------------- | -------------------- | ------------------------ | ------------------------------- |
| Main session   | `main`               | Наступний цикл heartbeat | Нагадувань, системних подій     |
| Isolated       | `isolated`           | Виділений `cron:<jobId>` | Звітів, фонових завдань         |
| Current session | `current`           | Прив’язується під час створення | Повторюваної роботи з контекстом |
| Custom session | `session:custom-id`  | Постійна іменована сесія | Процесів, що спираються на історію |

Завдання **Main session** ставлять системну подію в чергу та за потреби пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). Завдання **Isolated** запускають окремий цикл агента з новою сесією. **Custom sessions** (`session:xxx`) зберігають контекст між запусками, що дає змогу реалізувати процеси на кшталт щоденних стендапів, які спираються на попередні підсумки.

Для ізольованих завдань “нова сесія” означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні налаштування, як-от параметри thinking/fast/verbose, мітки та явні користувацькі перевизначення model/auth, але не успадковує фоновий контекст розмови зі старішого рядка cron: маршрутизацію channel/group, політику send або queue, elevation, origin чи прив’язку рантайму ACP. Використовуйте `current` або `session:<id>`, коли повторюване завдання має навмисно спиратися на той самий контекст розмови.

Для ізольованих завдань завершення рантайму тепер також включає best-effort очищення браузера для цієї сесії cron. Помилки очищення ігноруються, тому фактичний результат cron все одно має пріоритет.

Ізольовані запуски cron також звільняють усі вбудовані екземпляри рантайму MCP, створені для цього завдання, через спільний шлях очищення рантайму. Це відповідає тому, як для main-session і custom-session закриваються клієнти MCP, тож ізольовані завдання cron не залишають після себе дочірні stdio-процеси або довготривалі MCP-з’єднання між запусками.

Коли ізольовані запуски cron оркеструють субагентів, під час доставки також
надається перевага фінальному виводу нащадка, а не застарілому проміжному тексту батьківського процесу. Якщо нащадки все ще
виконуються, OpenClaw пригнічує це часткове батьківське оновлення замість того, щоб його оголошувати.

Для текстових announce-цілей у Discord OpenClaw надсилає канонічний фінальний
текст асистента один раз, замість того щоб повторно відтворювати і streamed/intermediate text payloads,
і фінальну відповідь. Медіа та структуровані payload-и Discord, як і раніше, доставляються окремими payload-ами, щоб не втрачати вкладення та компоненти.

### Параметри payload для ізольованих завдань

- `--message`: текст prompt (обов’язковий для isolated)
- `--model` / `--thinking`: перевизначення model і рівня thinking
- `--light-context`: пропустити ін’єкцію bootstrap-файла робочого простору
- `--tools exec,read`: обмежити, які tools може використовувати завдання

`--model` використовує вибрану дозволену model для цього завдання. Якщо запитана model
не дозволена, cron записує попередження в лог і повертається до вибору model агента/типової
model для цього завдання. Налаштовані ланцюжки fallback, як і раніше, застосовуються, але звичайне
перевизначення model без явного списку fallback для конкретного завдання більше не додає основну model
агента як приховану додаткову ціль для повторної спроби.

Пріоритет вибору model для ізольованих завдань такий:

1. Перевизначення model у Gmail hook (коли запуск походить із Gmail і це перевизначення дозволене)
2. `model` у payload конкретного завдання
3. Збережене користувачем перевизначення model для сесії cron
4. Типовий вибір model агента

Режим fast також дотримується визначеного активного вибору. Якщо конфігурація вибраної model
має `params.fastMode`, ізольований cron використовує його за замовчуванням. Збережене для сесії
перевизначення `fastMode` усе одно має пріоритет над конфігурацією в обидва боки.

Якщо під час ізольованого запуску відбувається жива передача на іншу model, cron повторює спробу з
перемкненим provider/model і зберігає цей активний вибір для поточного запуску
перед повторною спробою. Якщо перемикання також містить новий auth profile, cron зберігає
і це перевизначення auth profile для поточного запуску. Кількість повторних спроб обмежена:
після початкової спроби плюс 2 повторні спроби після перемикання cron перериває роботу, а не зациклюється безкінечно.

## Доставка і вивід

| Режим     | Що відбувається                                                      |
| --------- | -------------------------------------------------------------------- |
| `announce` | Резервно доставляє фінальний текст до цілі, якщо агент його не надіслав |
| `webhook`  | Надсилає event payload завершення через POST на URL                  |
| `none`     | Без резервної доставки від runner                                    |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`. Для цілей Slack/Discord/Mattermost слід використовувати явні префікси (`channel:<id>`, `user:<id>`).

Для ізольованих завдань доставка в чат є спільною. Якщо маршрут чату доступний,
агент може використовувати tool `message`, навіть коли завдання використовує `--no-deliver`. Якщо
агент надсилає повідомлення до налаштованої/поточної цілі, OpenClaw пропускає резервне announce.
В іншому разі `announce`, `webhook` і `none` лише керують тим, що runner робить із фінальною відповіддю після циклу агента.

Сповіщення про помилки мають окремий шлях призначення:

- `cron.failureDestination` задає глобальне типове значення для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо не задано ні перше, ні друге, і завдання вже доставляє через `announce`, сповіщення про помилки тепер резервно надсилаються до цієї основної announce-цілі.
- `delivery.failureDestination` підтримується лише для завдань із `sessionTarget="isolated"`, якщо основний режим доставки не `webhook`.

## Приклади CLI

Одноразове нагадування (main session):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Повторюване ізольоване завдання з доставкою:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Ізольоване завдання з перевизначенням model і thinking:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook-и

Gateway може надавати HTTP endpoint-и Webhook для зовнішніх тригерів. Увімкніть це в конфігурації:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Автентифікація

Кожен запит має містити токен hook через заголовок:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Токени в query string відхиляються.

### POST /hooks/wake

Поставити системну подію в чергу для main session:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (обов’язково): опис події
- `mode` (необов’язково): `now` (типово) або `next-heartbeat`

### POST /hooks/agent

Запустити ізольований цикл агента:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Поля: `message` (обов’язково), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Mapped hooks (POST /hooks/\<name\>)

Власні імена hook розв’язуються через `hooks.mappings` у конфігурації. Mappings можуть перетворювати довільні payload-и на дії `wake` або `agent` за допомогою шаблонів або кодових перетворень.

### Безпека

- Тримайте endpoint-и hook за loopback, tailnet або довіреним reverse proxy.
- Використовуйте окремий токен hook; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Установіть `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Залишайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, які вибирає викликач.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесії.
- Payload-и hook за замовчуванням обгортаються межами безпеки.

## Інтеграція Gmail PubSub

Підключіть тригери поштової скриньки Gmail до OpenClaw через Google PubSub.

**Передумови**: CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічного HTTPS endpoint.

### Налаштування через майстер (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає Gmail preset і використовує Tailscale Funnel для push endpoint.

### Автозапуск Gateway

Коли `hooks.enabled=true` і задано `hooks.gmail.account`, Gateway під час запуску виконує `gog gmail watch serve` і автоматично поновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися від цього.

### Ручне одноразове налаштування

1. Виберіть проєкт GCP, якому належить OAuth client, що використовується `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Створіть topic і надайте Gmail доступ для push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Запустіть watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Перевизначення model для Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Керування завданнями

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Примітка щодо перевизначення model:

- `openclaw cron add|edit --model ...` змінює вибрану model завдання.
- Якщо model дозволена, саме цей provider/model потрапляє до ізольованого
  запуску агента.
- Якщо вона не дозволена, cron виводить попередження і повертається до вибору
  model агента/типової model для цього завдання.
- Налаштовані ланцюжки fallback, як і раніше, застосовуються, але звичайне перевизначення `--model`
  без явного списку fallback для конкретного завдання більше не переходить до основної
  model агента як до тихої додаткової цілі повторної спроби.

## Конфігурація

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Sidecar стану рантайму виводиться з `cron.store`: сховище `.json`, наприклад
`~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, тоді як до шляху сховища
без суфікса `.json` додається `-state.json`.

Вимкнення cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

**Повтор одноразового завдання**: тимчасові помилки (rate limit, перевантаження, мережа, server error) повторюються до 3 разів з експоненційною затримкою. Постійні помилки вимикаються негайно.

**Повторюваний повтор**: експоненційна затримка (від 30 с до 60 хв) між повторними спробами. Затримка скидається після наступного успішного запуску.

**Обслуговування**: `cron.sessionRetention` (типово `24h`) очищає записи сесій ізольованих запусків. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли журналів запусків.

## Усунення несправностей

### Послідовність команд

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron не спрацьовує

- Перевірте `cron.enabled` і змінну середовища `OPENCLAW_SKIP_CRON`.
- Переконайтеся, що Gateway працює безперервно.
- Для розкладів `cron` перевірте часовий пояс (`--tz`) відносно часового поясу хоста.
- `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено командою `openclaw cron run <jobId> --due`, і час виконання завдання ще не настав.

### Cron спрацював, але доставки немає

- Режим доставки `none` означає, що резервне надсилання з боку runner не очікується. Агент
  усе одно може надсилати напряму за допомогою tool `message`, коли маршрут чату доступний.
- Відсутня/некоректна ціль доставки (`channel`/`to`) означає, що вихідне надсилання було пропущено.
- Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку заблоковано обліковими даними.
- Якщо ізольований запуск повертає лише silent token (`NO_REPLY` / `no_reply`),
  OpenClaw пригнічує пряме вихідне надсилання, а також резервний
  шлях queued summary, тому назад у чат нічого не публікується.
- Якщо агент має сам написати користувачеві, перевірте, що завдання має придатний
  маршрут (`channel: "last"` із попереднім чатом або явний channel/target).

### Нюанси часових поясів

- Cron без `--tz` використовує часовий пояс хоста gateway.
- Розклади `at` без часового поясу обробляються як UTC.
- Heartbeat `activeHours` використовує налаштоване визначення часового поясу.

## Пов’язане

- [Automation & Tasks](/uk/automation) — усі механізми автоматизації з одного погляду
- [Background Tasks](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні цикли main-session
- [Timezone](/uk/concepts/timezone) — конфігурація часового поясу
