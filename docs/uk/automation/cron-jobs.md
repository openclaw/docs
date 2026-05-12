---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (webhooks, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-05-12T00:56:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може доставляти вивід назад у канал чату або кінцеву точку webhook.

## Швидкий старт

<Steps>
  <Step title="Додайте одноразове нагадування">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Перевірте свої завдання">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Перегляньте історію запусків">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Як працює cron

- Cron працює **всередині процесу Gateway** (не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не втрачають розклади.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json` і додайте `jobs-state.json` до gitignore.
- Після розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть сприймати завдання як нові, оскільки поля runtime тепер зберігаються в `jobs-state.json`.
- Коли `jobs.json` редагують під час роботи Gateway або коли його зупинено, OpenClaw порівнює змінені поля розкладу з метаданими pending runtime slot і очищає застарілі значення `nextRunAtMs`. Перезаписи, що змінюють лише форматування або порядок ключів, зберігають pending slot.
- Усі виконання cron створюють записи [фонового завдання](/uk/automation/tasks).
- Під час запуску Gateway прострочені ізольовані завдання agent-turn переплановуються за межі вікна підключення каналу, а не відтворюються негайно, тому запуск Discord/Telegram і налаштування native-command залишаються чутливими після перезапусків.
- Одноразові завдання (`--at`) типово автоматично видаляються після успішного виконання.
- Ізольовані запуски cron за принципом best-effort закривають відстежувані вкладки/процеси браузера для своєї сесії `cron:<jobId>` після завершення запуску, щоб від’єднана автоматизація браузера не залишала осиротілі процеси.
- Ізольовані запуски cron, які отримують вузький дозвіл cron self-cleanup grant, усе ще можуть читати статус планувальника, self-filtered список свого поточного завдання та історію запусків цього завдання, щоб перевірки статусу/Heartbeat могли переглядати власний розклад без ширшого доступу до мутацій cron.
- Ізольовані запуски cron також захищаються від застарілих відповідей-підтверджень. Якщо перший результат — це лише проміжне оновлення статусу (`on it`, `pulling everything together` і подібні підказки), і жоден дочірній subagent run більше не відповідає за фінальну відповідь, OpenClaw один раз повторно запитує фактичний результат перед доставкою.
- Ізольовані запуски cron надають перевагу структурованим метаданим execution-denial із вбудованого запуску, а потім повертаються до відомих маркерів фінального підсумку/виводу, як-от `SYSTEM_RUN_DENIED` і `INVALID_REQUEST`, тому заблокована команда не звітується як успішний запуск.
- Ізольовані запуски cron також розглядають помилки агента на рівні запуску як помилки завдання, навіть коли payload відповіді не створено, тому збої моделі/провайдера збільшують лічильники помилок і запускають сповіщення про збій замість того, щоб позначати завдання як успішне.
- Коли ізольоване завдання agent-turn досягає `timeoutSeconds`, cron перериває базовий запуск агента й надає йому коротке вікно очищення. Якщо запуск не завершує draining, очищення під керуванням Gateway примусово очищає право власності цієї сесії на запуск перед тим, як cron запише тайм-аут, щоб робота чату в черзі не залишилася за застарілою processing session.
- Якщо ізольований agent-turn зависає до старту runner або до першого виклику моделі, cron записує фазово-специфічний тайм-аут, як-от `setup timed out before runner start` або `stalled before first model call (last phase: context-engine)`. Ці watchdogs покривають вбудованих провайдерів і CLI-backed провайдерів до фактичного запуску їхнього зовнішнього CLI-процесу та обмежуються незалежно від довгих значень `timeoutSeconds`, щоб збої cold-start/auth/context проявлялися швидко, а не чекали повного бюджету завдання.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron насамперед належить runtime, а вже потім спирається на durable history: активне завдання cron залишається live, доки cron runtime усе ще відстежує це завдання як running, навіть якщо старий рядок child session ще існує. Щойно runtime припиняє володіти завданням і 5-хвилинне grace window спливає, перевірки обслуговування переглядають збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця durable history показує terminal result, ledger завдання фіналізується з неї; інакше обслуговування під керуванням Gateway може позначити завдання як `lost`. Offline CLI audit може відновитися з durable history, але він не вважає власний порожній in-process набір active-job доказом того, що запуск cron під керуванням Gateway зник.
</Note>

## Типи розкладів

| Вид     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова позначка часу (ISO 8601 або відносна, як `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | 5-польовий або 6-польовий cron-вираз з необов’язковим `--tz` |

Позначки часу без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним настінним часом.

Повторювані вирази на початку години автоматично розподіляються з відхиленням до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### Day-of-month і day-of-week використовують логіку OR

Cron-вирази розбираються за допомогою [croner](https://github.com/Hexagon/croner). Коли поля day-of-month і day-of-week обидва не є wildcard, croner вважає збігом ситуацію, коли збігається **будь-яке** з полів, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. OpenClaw тут використовує типову OR-поведінку Croner. Щоб вимагати обидві умови, використовуйте модифікатор day-of-week `+` у Croner (`0 9 15 * +1`) або плануйте за одним полем і перевіряйте інше в prompt чи команді вашого завдання.

## Стилі виконання

| Стиль          | Значення `--session` | Виконується в            | Найкраще для                         |
| -------------- | -------------------- | ------------------------ | ------------------------------------ |
| Основна сесія  | `main`               | Наступний Heartbeat turn | Нагадування, системні події          |
| Ізольований    | `isolated`           | Виділена `cron:<jobId>`  | Звіти, фонові робочі завдання        |
| Поточна сесія  | `current`            | Прив’язується під час створення | Контекстно-залежна повторювана робота |
| Власна сесія   | `session:custom-id`  | Постійна іменована сесія | Workflows, що будуються на історії   |

<AccordionGroup>
  <Accordion title="Основна сесія проти ізольованої проти власної">
    Завдання **основної сесії** додають системну подію в чергу та за потреби пробуджують Heartbeat (`--wake now` або `--wake next-heartbeat`). Ці системні події не продовжують свіжість daily/idle reset для цільової сесії. **Ізольовані** завдання виконують виділений agent turn зі свіжою сесією. **Власні сесії** (`session:xxx`) зберігають контекст між запусками, уможливлюючи workflows на кшталт щоденних standups, що будуються на попередніх підсумках.
  </Accordion>
  <Accordion title="Що означає 'fresh session' для ізольованих завдань">
    Для ізольованих завдань "fresh session" означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні налаштування, як-от thinking/fast/verbose settings, labels і явні вибрані користувачем model/auth overrides, але не успадковує навколишній контекст розмови зі старішого рядка cron: channel/group routing, send або queue policy, elevation, origin чи ACP runtime binding. Використовуйте `current` або `session:<id>`, коли повторюване завдання має навмисно будуватися на тому самому контексті розмови.
  </Accordion>
  <Accordion title="Очищення runtime">
    Для ізольованих завдань teardown runtime тепер включає best-effort очищення браузера для цієї cron-сесії. Збої очищення ігноруються, щоб фактичний результат cron усе одно мав пріоритет.

    Ізольовані запуски cron також звільняють будь-які bundled MCP runtime instances, створені для завдання, через спільний шлях runtime-cleanup. Це відповідає тому, як teardown виконується для MCP clients основної сесії та власної сесії, тому ізольовані cron-завдання не залишають stdio child processes або довготривалі MCP connections між запусками.

  </Accordion>
  <Accordion title="Доставка subagent і Discord">
    Коли ізольовані запуски cron оркеструють subagents, доставка також віддає перевагу фінальному виводу нащадка над застарілим проміжним текстом батьківського процесу. Якщо нащадки усе ще виконуються, OpenClaw пригнічує це часткове оновлення батьківського процесу замість того, щоб оголошувати його.

    Для text-only цілей оголошення Discord OpenClaw надсилає канонічний фінальний текст асистента один раз замість повторного відтворення і streamed/intermediate text payloads, і фінальної відповіді. Media та structured Discord payloads усе ще доставляються як окремі payloads, щоб attachments і components не втрачалися.

  </Accordion>
</AccordionGroup>

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов’язковий для isolated).
</ParamField>
<ParamField path="--model" type="string">
  Перевизначення моделі; використовує вибрану дозволену модель для завдання.
</ParamField>
<ParamField path="--thinking" type="string">
  Перевизначення рівня thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Пропустити ін’єкцію файлів bootstrap workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які tools може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель як основну модель цього завдання. Це не те саме, що перевизначення `/model` у chat-session: налаштовані fallback chains усе ще застосовуються, коли основна модель завдання дає збій. Якщо запитана модель не дозволена або не може бути resolved, cron завершує запуск з явною validation error замість мовчазного fallback до agent/default model selection завдання.

Cron-завдання також можуть містити `fallbacks` на рівні payload. Коли цей список присутній, він замінює налаштований fallback chain для завдання. Використовуйте `fallbacks: []` у job payload/API, коли потрібен строгий запуск cron, який пробує лише вибрану модель. Якщо завдання має `--model`, але не має ні payload fallbacks, ні configured fallbacks, OpenClaw передає явне порожнє fallback override, щоб agent primary не додавався як прихована додаткова retry target.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі Gmail hook (коли запуск надійшов із Gmail і це перевизначення дозволене)
2. Per-job payload `model`
3. Збережене вибране користувачем перевизначення моделі cron-сесії
4. Вибір agent/default model

Fast mode також відповідає resolved live selection. Якщо конфіг вибраної моделі має `params.fastMode`, isolated cron типово використовує його. Збережене перевизначення сесії `fastMode` усе ще має пріоритет над config в обох напрямках.

Якщо ізольований запуск потрапляє на live model-switch handoff, cron повторює спробу з перемкненим provider/model і зберігає цей live selection для активного запуску перед retry. Коли перемикання також містить новий auth profile, cron також зберігає це auth profile override для активного запуску. Повторні спроби обмежені: після початкової спроби плюс 2 switch retries cron перериває виконання замість нескінченного циклу.

Перш ніж ізольований запуск Cron увійде до runner агента, OpenClaw перевіряє доступні локальні кінцеві точки провайдера для налаштованих провайдерів `api: "ollama"` і `api: "openai-completions"`, у яких `baseUrl` є loopback, приватною мережею або `.local`. Якщо ця кінцева точка недоступна, запуск записується як `skipped` із чіткою помилкою провайдера/моделі замість початку виклику моделі. Результат кінцевої точки кешується на 5 хвилин, тому багато запланованих завдань, що використовують той самий недоступний локальний сервер Ollama, vLLM, SGLang або LM Studio, спільно використовують одну невелику перевірку замість створення шквалу запитів. Пропущені запуски provider-preflight не збільшують backoff помилок виконання; увімкніть `failureAlert.includeSkipped`, якщо потрібні повторні сповіщення про пропуск.

## Доставка та вивід

| Режим     | Що відбувається                                                   |
| --------- | ----------------------------------------------------------------- |
| `announce` | Резервно доставляє фінальний текст до цілі, якщо агент не надіслав його |
| `webhook`  | Надсилає POST із payload події завершення на URL                 |
| `none`     | Без резервної доставки runner                                    |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`; прямі RPC/config виклики також можуть передавати `delivery.threadId` як рядок або число. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). ID кімнат Matrix чутливі до регістру; використовуйте точний ID кімнати або форму `room:!room:server` з Matrix.

Коли доставка announce використовує `channel: "last"` або пропускає `channel`, ціль із префіксом провайдера, наприклад `telegram:123`, може вибрати канал до того, як Cron повернеться до історії сесії або одного налаштованого каналу. Лише префікси, оголошені завантаженим Plugin, є селекторами провайдера. Якщо `delivery.channel` задано явно, префікс цілі має називати того самого провайдера; наприклад, `channel: "whatsapp"` із `to: "telegram:123"` відхиляється замість того, щоб дозволити WhatsApp інтерпретувати Telegram ID як номер телефону. Префікси типу цілі та сервісу, як-от `channel:<id>`, `user:<id>`, `imessage:<handle>` і `sms:<number>`, залишаються синтаксисом цілей, яким володіє канал, а не селекторами провайдера.

Для ізольованих завдань доставка в чат є спільною. Якщо маршрут чату доступний, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає до налаштованої/поточної цілі, OpenClaw пропускає резервний announce. Інакше `announce`, `webhook` і `none` керують лише тим, що runner робить із фінальною відповіддю після ходу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену живу ціль доставки для резервного маршруту announce. Внутрішні ключі сесії можуть бути в нижньому регістрі; цілі доставки провайдера не реконструюються з цих ключів, коли доступний поточний контекст чату.

Неявна доставка announce використовує налаштовані allowlists каналів для валідації та перемаршрутизації застарілих цілей. Схвалення зі сховища пар DM не є одержувачами резервної автоматизації; задайте `delivery.to` або налаштуйте запис `allowFrom` каналу, коли заплановане завдання має проактивно надсилати в DM.

Сповіщення про помилки мають окремий шлях призначення:

- `cron.failureDestination` задає глобальне значення за замовчуванням для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо жодне не задано, а завдання вже доставляє через `announce`, сповіщення про помилки тепер повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний режим доставки не є `webhook`.
- `failureAlert.includeSkipped: true` вмикає для завдання або глобальної політики сповіщень Cron повторні сповіщення про пропущені запуски. Пропущені запуски ведуть окремий лічильник послідовних пропусків, тому вони не впливають на backoff помилок виконання.

## Приклади CLI

<Tabs>
  <Tab title="Одноразове нагадування">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Повторюване ізольоване завдання">
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
  </Tab>
  <Tab title="Перевизначення моделі та thinking">
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
  </Tab>
</Tabs>

## Webhook

Gateway може відкривати HTTP Webhook кінцеві точки для зовнішніх тригерів. Увімкніть у config:

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

Токени в рядку запиту відхиляються.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Додати системну подію до черги для основної сесії:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Опис події.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` або `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Запустити ізольований хід агента:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Поля: `message` (обов’язкове), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Зіставлені hooks (POST /hooks/<name>)">
    Власні назви hook розв’язуються через `hooks.mappings` у config. Зіставлення можуть перетворювати довільні payloads на дії `wake` або `agent` за допомогою шаблонів чи перетворень коду.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте кінцеві точки hook за loopback, tailnet або довіреним reverse proxy.

- Використовуйте окремий токен hook; не перевикористовуйте токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Задайте `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесій.
- Payloads hook за замовчуванням обгортаються межами безпеки.

</Warning>

## Інтеграція Gmail PubSub

Під’єднайте тригери вхідної пошти Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** `gcloud` CLI, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічної HTTPS кінцевої точки.
</Note>

### Налаштування майстром (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує config `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для push кінцевої точки.

### Автозапуск Gateway

Коли `hooks.enabled=true` і `hooks.gmail.account` задано, Gateway запускає `gog gmail watch serve` під час завантаження та автоматично поновлює watch. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися.

### Ручне одноразове налаштування

<Steps>
  <Step title="Виберіть проєкт GCP">
    Виберіть проєкт GCP, якому належить OAuth-клієнт, що використовується `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Створіть topic і надайте Gmail push-доступ">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Запустіть watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Перевизначення моделі Gmail

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

# Get one stored job as JSON
openclaw cron get <jobId>

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

<Note>
Примітка щодо перевизначення моделі:

- `openclaw cron add|edit --model ...` змінює вибрану модель завдання.
- Якщо модель дозволена, саме цей провайдер/модель доходить до ізольованого запуску агента.
- Якщо її не дозволено або неможливо розв’язати, Cron завершує запуск помилкою з явною помилкою валідації.
- Налаштовані ланцюги fallback усе ще застосовуються, бо Cron `--model` є основною моделлю завдання, а не перевизначенням `/model` сесії.
- Payload `fallbacks` замінює налаштовані fallbacks для цього завдання; `fallbacks: []` вимикає fallback і робить запуск суворим.
- Простий `--model` без явного або налаштованого списку fallback не переходить до основної моделі агента як мовчазної додаткової цілі повторної спроби.

</Note>

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

`maxConcurrentRuns` обмежує як заплановану диспетчеризацію Cron, так і виконання ізольованих ходів агента. Ізольовані агентські ходи Cron внутрішньо використовують виділену lane виконання черги `cron-nested`, тому збільшення цього значення дає незалежним LLM-запускам Cron просуватися паралельно, а не лише запускати їхні зовнішні wrappers Cron. Спільна lane `nested`, що не належить Cron, цим налаштуванням не розширюється.

Sidecar стану runtime виводиться з `cron.store`: сховище `.json`, як-от `~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, тоді як шлях сховища без суфікса `.json` додає `-state.json`.

Якщо ви редагуєте `jobs.json` вручну, не додавайте `jobs-state.json` до source control. OpenClaw використовує цей sidecar для pending slots, active markers, метаданих останнього запуску та ідентичності розкладу, яка повідомляє scheduler, коли зовнішньо відредагованому завданню потрібен свіжий `nextRunAtMs`.

Вимкнути Cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Одноразова повторна спроба**: тимчасові помилки (rate limit, перевантаження, мережа, помилка сервера) повторюються до 3 разів з експоненційним backoff. Постійні помилки вимикають негайно.

    **Повторна спроба для повторюваних завдань**: експоненційний backoff (від 30 с до 60 хв) між повторними спробами. Backoff скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Обслуговування">
    `cron.sessionRetention` (за замовчуванням `24h`) очищає ізольовані записи сеансів запуску. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли журналів запуску.
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Cron не запускається">
    - Перевірте `cron.enabled` і змінну середовища `OPENCLAW_SKIP_CRON`.
    - Переконайтеся, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) порівняно з часовим поясом хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, і час виконання завдання ще не настав.

  </Accordion>
  <Accordion title="Cron спрацював, але доставлення немає">
    - Режим доставлення `none` означає, що резервне надсилання runner не очікується. Агент усе ще може надсилати напряму за допомогою інструмента `message`, коли доступний маршрут чату.
    - Відсутня або недійсна ціль доставлення (`channel`/`to`) означає, що вихідне надсилання було пропущено.
    - Для Matrix скопійовані або застарілі завдання з ідентифікаторами кімнат `delivery.to`, перетвореними на нижній регістр, можуть не спрацювати, оскільки ідентифікатори кімнат Matrix чутливі до регістру. Змініть завдання на точне значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставлення було заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише тихий токен (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряме вихідне доставлення, а також резервний шлях підсумку в черзі, тому нічого не публікується назад у чат.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` із попереднім чатом або явний канал/ціль).

  </Accordion>
  <Accordion title="Cron або Heartbeat, схоже, перешкоджає переходу /new-style">
    - Актуальність щоденного та неактивного скидання не базується на `updatedAt`; див. [Керування сеансами](/uk/concepts/session#session-lifecycle).
    - Пробудження Cron, запуски Heartbeat, сповіщення exec і службове ведення Gateway можуть оновлювати рядок сеансу для маршрутизації/статусу, але вони не продовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сеансу transcript JSONL, якщо файл усе ще доступний. Застарілі неактивні рядки без `lastInteractionAt` використовують цей відновлений час початку як базову точку неактивності.

  </Accordion>
  <Accordion title="Нюанси часових поясів">
    - Cron без `--tz` використовує часовий пояс хоста Gateway.
    - Розклади `at` без часового поясу вважаються UTC.
    - Heartbeat `activeHours` використовує налаштоване визначення часового поясу.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація](/uk/automation) — усі механізми автоматизації одним поглядом
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні кроки головного сеансу
- [Часовий пояс](/uk/concepts/timezone) — налаштування часового поясу
