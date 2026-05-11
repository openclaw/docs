---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook і тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-05-11T20:20:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента у відповідний час і може доставляти результат назад у канал чату або endpoint webhook.

## Швидкий старт

<Steps>
  <Step title="Add a one-shot reminder">
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
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Як працює Cron

- Cron працює **всередині процесу Gateway** (а не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не втрачають розклади.
- Стан виконання runtime зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json` і додайте `jobs-state.json` до gitignore.
- Після розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть вважати завдання новими, бо поля runtime тепер зберігаються в `jobs-state.json`.
- Коли `jobs.json` редагують під час роботи Gateway або коли його зупинено, OpenClaw порівнює змінені поля розкладу з метаданими очікуваного runtime-слота й очищає застарілі значення `nextRunAtMs`. Перезапис лише форматування або лише порядку ключів зберігає очікуваний слот.
- Усі виконання cron створюють записи [фонового завдання](/uk/automation/tasks).
- Під час запуску Gateway прострочені ізольовані завдання agent-turn переплановуються за межі вікна підключення каналу, а не відтворюються негайно, тому запуск Discord/Telegram і налаштування нативних команд залишаються чуйними після перезапусків.
- Одноразові завдання (`--at`) типово автоматично видаляються після успішного виконання.
- Ізольовані запускі cron за принципом best-effort закривають відстежувані вкладки браузера/процеси для їхньої сесії `cron:<jobId>` після завершення запуску, тож від’єднана браузерна автоматизація не залишає осиротілі процеси.
- Ізольовані запускі cron, які отримують вузький дозвіл на самоочищення cron, усе ще можуть читати статус планувальника, самофільтрований список свого поточного завдання та історію запусків цього завдання, тож перевірки статусу/Heartbeat можуть інспектувати власний розклад без ширшого доступу до зміни cron.
- Ізольовані запускі cron також захищаються від застарілих відповідей-підтверджень. Якщо перший результат є лише проміжним оновленням статусу (`on it`, `pulling everything together` і подібні підказки), і жоден descendant subagent run більше не відповідає за фінальну відповідь, OpenClaw один раз повторно запитує фактичний результат перед доставкою.
- Ізольовані запускі cron спершу віддають перевагу структурованим метаданим відмови у виконанні з вбудованого запуску, а потім повертаються до відомих маркерів фінального підсумку/виводу, як-от `SYSTEM_RUN_DENIED` і `INVALID_REQUEST`, щоб заблоковану команду не було повідомлено як успішний запуск.
- Ізольовані запускі cron також трактують збої агента на рівні запуску як помилки завдання, навіть коли payload відповіді не створено, тож збої моделі/провайдера збільшують лічильники помилок і запускають сповіщення про збій замість очищення завдання як успішного.
- Коли ізольоване завдання agent-turn досягає `timeoutSeconds`, cron перериває базовий запуск агента й надає йому коротке вікно для очищення. Якщо запуск не завершує спорожнення, очищення під керуванням Gateway примусово очищає ownership сесії цього запуску перед тим, як cron запише timeout, тож поставлена в чергу робота чату не залишається за застарілою сесією обробки.
- Якщо ізольований agent-turn зависає до запуску runner або до першого виклику моделі, cron записує timeout, специфічний для фази, наприклад `setup timed out before runner start` або `stalled before first model call (last phase: context-engine)`. Ці watchdog-и покривають вбудованих провайдерів і провайдерів на основі CLI до фактичного запуску їхнього зовнішнього процесу CLI та обмежуються незалежно від довгих значень `timeoutSeconds`, щоб збої cold-start/auth/context проявлялися швидко, а не чекали повного бюджету завдання.

<a id="maintenance"></a>

<Note>
Звіряння завдань для cron спершу належить runtime, а вже потім підкріплюється durable history: активне завдання cron залишається живим, поки runtime cron усе ще відстежує це завдання як запущене, навіть якщо старий рядок дочірньої сесії все ще існує. Щойно runtime припиняє володіти завданням і спливає 5-хвилинне grace window, maintenance перевіряє збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця durable history показує термінальний результат, task ledger фіналізується на її основі; інакше maintenance під керуванням Gateway може позначити завдання як `lost`. Offline CLI audit може відновитися з durable history, але не трактує власний порожній in-process active-job set як доказ того, що cron-запуск під керуванням Gateway зник.
</Note>

## Типи розкладів

| Тип     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова timestamp (ISO 8601 або відносна, як-от `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | 5-польовий або 6-польовий cron-вираз з необов’язковим `--tz` |

Timestamp-и без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним wall-clock часом.

Повторювані вирази на початку години автоматично розносяться до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово встановити точний час, або `--stagger 30s` для явного вікна.

### Day-of-month і day-of-week використовують логіку OR

Cron-вирази розбираються [croner](https://github.com/Hexagon/croner). Коли поля day-of-month і day-of-week обидва не є wildcard, croner збігається, коли збігається **будь-яке** з полів, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. OpenClaw тут використовує типову поведінку OR від Croner. Щоб вимагати обидві умови, використовуйте модифікатор day-of-week `+` від Croner (`0 9 15 * +1`) або плануйте за одним полем, а інше перевіряйте в prompt чи команді завдання.

## Стилі виконання

| Стиль          | Значення `--session` | Виконується в           | Найкраще для                         |
| -------------- | -------------------- | ----------------------- | ------------------------------------ |
| Основна сесія  | `main`               | Наступний Heartbeat turn | Нагадування, системні події          |
| Ізольований    | `isolated`           | Виділений `cron:<jobId>` | Звіти, фонові службові роботи        |
| Поточна сесія  | `current`            | Прив’язується під час створення | Повторювана робота з урахуванням контексту |
| Власна сесія   | `session:custom-id`  | Постійна іменована сесія | Workflows, що будуються на історії   |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Завдання **основної сесії** ставлять системну подію в чергу та необов’язково пробуджують Heartbeat (`--wake now` або `--wake next-heartbeat`). Ці системні події не подовжують свіжість daily/idle reset для цільової сесії. **Ізольовані** завдання запускають виділений agent turn зі свіжою сесією. **Власні сесії** (`session:xxx`) зберігають контекст між запусками, уможливлюючи workflows на кшталт щоденних стендапів, що будуються на попередніх підсумках.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Для ізольованих завдань "fresh session" означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні налаштування, як-от параметри thinking/fast/verbose, мітки та явні вибрані користувачем перевизначення моделі/auth, але не успадковує навколишній контекст розмови зі старішого рядка cron: маршрутизацію channel/group, політику send або queue, elevation, origin чи прив’язку ACP runtime. Використовуйте `current` або `session:<id>`, коли повторюване завдання має навмисно будуватися на тому самому контексті розмови.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Для ізольованих завдань teardown runtime тепер включає best-effort очищення браузера для цієї сесії cron. Збої очищення ігноруються, щоб фактичний результат cron все одно мав пріоритет.

    Ізольовані запускі cron також dispose-ять будь-які bundled MCP runtime instances, створені для завдання, через спільний шлях runtime-cleanup. Це відповідає тому, як teardown-яться MCP clients основної сесії та власної сесії, тож ізольовані завдання cron не витікають stdio child processes або довгоживучі MCP connections між запусками.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Коли ізольовані запускі cron оркеструють subagents, доставка також віддає перевагу фінальному descendant output над застарілим проміжним текстом батьківського запуску. Якщо descendants усе ще виконуються, OpenClaw пригнічує це часткове батьківське оновлення замість того, щоб оголошувати його.

    Для текстових announce targets Discord OpenClaw надсилає канонічний фінальний текст асистента один раз замість повторного відтворення і streamed/intermediate text payloads, і фінальної відповіді. Media та structured Discord payloads усе ще доставляються як окремі payloads, щоб attachments і components не було втрачено.

  </Accordion>
</AccordionGroup>

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов’язково для ізольованих).
</ParamField>
<ParamField path="--model" type="string">
  Перевизначення моделі; використовує вибрану дозволену модель для завдання.
</ParamField>
<ParamField path="--thinking" type="string">
  Перевизначення рівня thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Пропустити ін’єкцію bootstrap-файлів workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які інструменти може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель як primary model цього завдання. Це не те саме, що перевизначення `/model` для chat-session: налаштовані fallback chains усе ще застосовуються, коли primary завдання зазнає збою. Якщо запитана модель не дозволена або її не можна resolve-ити, cron завершує запуск із явною validation error замість мовчазного fallback до agent/default model selection завдання.

Завдання Cron також можуть переносити payload-level `fallbacks`. Коли вони присутні, цей список замінює налаштований fallback chain для завдання. Використовуйте `fallbacks: []` у payload/API завдання, коли потрібен строгий запуск cron, що пробує лише вибрану модель. Якщо завдання має `--model`, але не має ані payload, ані налаштованих fallbacks, OpenClaw передає явне порожнє fallback override, щоб agent primary не додавалася як прихована додаткова retry target.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі Gmail hook (коли запуск надійшов із Gmail і це перевизначення дозволене)
2. Per-job payload `model`
3. Збережене вибране користувачем перевизначення моделі сесії cron
4. Agent/default model selection

Fast mode також відповідає resolved live selection. Якщо конфігурація вибраної моделі має `params.fastMode`, ізольований cron типово використовує це. Збережене перевизначення сесії `fastMode` усе ще має пріоритет над config в обох напрямках.

Якщо ізольований запуск натрапляє на handoff live model-switch, cron повторює спробу з переключеним provider/model і зберігає цей live selection для активного запуску перед повтором. Коли switch також несе новий auth profile, cron зберігає й це перевизначення auth profile для активного запуску. Retries обмежені: після початкової спроби плюс 2 switch retries cron перериває виконання замість нескінченного циклу.

Перш ніж ізольований запуск Cron входить до runner агента, OpenClaw перевіряє досяжні локальні endpoint-и провайдерів для налаштованих провайдерів `api: "ollama"` і `api: "openai-completions"`, у яких `baseUrl` є loopback, приватною мережею або `.local`. Якщо цей endpoint недоступний, запуск записується як `skipped` із чіткою помилкою провайдера/моделі замість початку виклику моделі. Результат endpoint-а кешується на 5 хвилин, тому багато запланованих завдань, які використовують той самий непрацюючий локальний сервер Ollama, vLLM, SGLang або LM Studio, спільно використовують одну невелику перевірку замість створення шквалу запитів. Пропущені запуски через provider-preflight не збільшують backoff помилок виконання; увімкніть `failureAlert.includeSkipped`, коли вам потрібні повторні сповіщення про пропуски.

## Доставка й вивід

| Режим      | Що відбувається                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Fallback-доставка фінального тексту до цілі, якщо агент не надіслав його |
| `webhook`  | POST payload події завершення до URL                                |
| `none`     | Немає fallback-доставки runner-а                                         |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форумів Telegram використовуйте `-1001234567890:topic:123`; прямі RPC/config-виклики також можуть передавати `delivery.threadId` як рядок або число. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). ID кімнат Matrix чутливі до регістру; використовуйте точний ID кімнати або форму `room:!room:server` з Matrix.

Коли доставка announce використовує `channel: "last"` або пропускає `channel`, ціль із префіксом провайдера, наприклад `telegram:123`, може вибрати канал до того, як Cron повернеться до історії сесії або одного налаштованого каналу. Лише префікси, оголошені завантаженим plugin, є селекторами провайдера. Якщо `delivery.channel` задано явно, префікс цілі має називати того самого провайдера; наприклад, `channel: "whatsapp"` із `to: "telegram:123"` відхиляється замість того, щоб дозволити WhatsApp інтерпретувати ID Telegram як номер телефону. Префікси типу цілі та сервісу, як-от `channel:<id>`, `user:<id>`, `imessage:<handle>` і `sms:<number>`, залишаються синтаксисом цілі, яким володіє канал, а не селекторами провайдера.

Для ізольованих завдань доставка в чат є спільною. Якщо доступний маршрут чату, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає до налаштованої/поточної цілі, OpenClaw пропускає fallback announce. Інакше `announce`, `webhook` і `none` керують лише тим, що runner робить із фінальною відповіддю після ходу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену live-ціль доставки для fallback-маршруту announce. Внутрішні ключі сесій можуть бути в нижньому регістрі; цілі доставки провайдера не реконструюються з цих ключів, коли доступний поточний контекст чату.

Неявна доставка announce використовує налаштовані allowlist-и каналів, щоб перевіряти й перенаправляти застарілі цілі. Схвалення DM pairing-store не є отримувачами fallback-автоматизації; задайте `delivery.to` або налаштуйте запис `allowFrom` каналу, коли заплановане завдання має проактивно надсилати в DM.

Сповіщення про збої йдуть окремим шляхом призначення:

- `cron.failureDestination` задає глобальне значення за замовчуванням для сповіщень про збої.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо не задано жодне з них і завдання вже доставляє через `announce`, сповіщення про збої тепер fallback-переходять до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний режим доставки не є `webhook`.
- `failureAlert.includeSkipped: true` вмикає для завдання або глобальної політики сповіщень Cron повторні сповіщення про пропущені запуски. Пропущені запуски ведуть окремий лічильник послідовних пропусків, тож вони не впливають на backoff помилок виконання.

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

## Webhook-и

Gateway може надавати HTTP endpoint-и Webhook для зовнішніх trigger-ів. Увімкніть у config:

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

Кожен запит має містити token hook-а через header:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Token-и в query string відхиляються.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Додати system event до черги для основної сесії:

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
    Користувацькі назви hook-ів розв’язуються через `hooks.mappings` у config. Зіставлення можуть перетворювати довільні payload-и на дії `wake` або `agent` за допомогою шаблонів або code transforms.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте endpoint-и hook-ів за loopback, tailnet або довіреним reverse proxy.

- Використовуйте виділений token hook-а; не перевикористовуйте auth token-и gateway.
- Тримайте `hooks.path` на виділеному subpath; `/` відхиляється.
- Задайте `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані caller-ом.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити допустимі форми ключів сесій.
- Payload-и hook-ів за замовчуванням обгортаються safety boundaries.

</Warning>

## Інтеграція Gmail PubSub

Під’єднайте trigger-и вхідних Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічного HTTPS endpoint-а.
</Note>

### Налаштування майстром (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує config `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для push endpoint-а.

### Автозапуск Gateway

Коли `hooks.enabled=true` і `hooks.gmail.account` задано, Gateway запускає `gog gmail watch serve` під час boot і автоматично поновлює watch. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися.

### Одноразове ручне налаштування

<Steps>
  <Step title="Виберіть проєкт GCP">
    Виберіть проєкт GCP, якому належить OAuth client, що використовується `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Створіть topic і надайте Gmail доступ до push">
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
- Якщо модель дозволена, саме цей provider/model доходить до ізольованого запуску агента.
- Якщо вона не дозволена або не може бути розв’язана, Cron завершує запуск з явною помилкою валідації.
- Налаштовані fallback chains усе одно застосовуються, бо cron `--model` є основною моделлю завдання, а не перевизначенням `/model` сесії.
- Payload `fallbacks` замінює налаштовані fallback-и для цього завдання; `fallbacks: []` вимикає fallback і робить запуск strict.
- Простий `--model` без явного або налаштованого списку fallback-ів не переходить до основної моделі агента як прихована додаткова ціль повторної спроби.

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

`maxConcurrentRuns` обмежує як dispatch запланованих Cron, так і виконання ізольованих ходів агента. Ізольовані ходи cron-агента внутрішньо використовують виділену lane виконання черги `cron-nested`, тому збільшення цього значення дає незалежним cron LLM-запускам змогу просуватися паралельно, а не лише запускати їхні зовнішні cron wrapper-и. Спільна не-cron lane `nested` цим параметром не розширюється.

Runtime state sidecar виводиться з `cron.store`: store `.json`, наприклад `~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, тоді як шлях store без суфікса `.json` додає `-state.json`.

Якщо ви редагуєте `jobs.json` вручну, не додавайте `jobs-state.json` до source control. OpenClaw використовує цей sidecar для pending slots, active markers, метаданих останнього запуску та schedule identity, який повідомляє scheduler-у, коли зовнішньо відредагованому завданню потрібен свіжий `nextRunAtMs`.

Вимкнути Cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Одноразова повторна спроба**: transient errors (rate limit, overload, network, server error) повторюються до 3 разів з exponential backoff. Permanent errors вимикають одразу.

    **Повторювана повторна спроба**: exponential backoff (від 30s до 60m) між повторними спробами. Backoff скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Обслуговування">
    `cron.sessionRetention` (типово `24h`) очищає ізольовані записи сеансів виконання. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли журналів виконання.
  </Accordion>
</AccordionGroup>

## Усунення неполадок

### Драбина команд

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
  <Accordion title="Cron не спрацьовує">
    - Перевірте `cron.enabled` і змінну середовища `OPENCLAW_SKIP_CRON`.
    - Переконайтеся, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) порівняно з часовим поясом хоста.
    - `reason: not-due` у виводі виконання означає, що ручне виконання було перевірено за допомогою `openclaw cron run <jobId> --due`, і час завдання ще не настав.

  </Accordion>
  <Accordion title="Cron спрацював, але доставки немає">
    - Режим доставки `none` означає, що резервне надсилання через runner не очікується. Агент усе ще може надсилати напряму за допомогою інструмента `message`, коли доступний маршрут чату.
    - Відсутня або недійсна ціль доставки (`channel`/`to`) означає, що вихідне повідомлення було пропущено.
    - Для Matrix скопійовані або застарілі завдання з ідентифікаторами кімнат `delivery.to` у нижньому регістрі можуть не спрацювати, оскільки ідентифікатори кімнат Matrix чутливі до регістру. Відредагуйте завдання до точного значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку заблоковано обліковими даними.
    - Якщо ізольоване виконання повертає лише тихий токен (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряму вихідну доставку, а також пригнічує резервний шлях зведення в черзі, тому нічого не публікується назад у чат.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` із попереднім чатом або явний канал/ціль).

  </Accordion>
  <Accordion title="Cron або Heartbeat, схоже, перешкоджає переходу /new-style">
    - Актуальність щоденного та простою скидання не базується на `updatedAt`; див. [Керування сеансами](/uk/concepts/session#session-lifecycle).
    - Пробудження Cron, виконання Heartbeat, сповіщення exec і службові записи Gateway можуть оновлювати рядок сеансу для маршрутизації/статусу, але вони не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сеансу в transcript JSONL, якщо файл усе ще доступний. Застарілі рядки простою без `lastInteractionAt` використовують цей відновлений час початку як базову точку простою.

  </Accordion>
  <Accordion title="Підводні камені часових поясів">
    - Cron без `--tz` використовує часовий пояс хоста Gateway.
    - Розклади `at` без часового поясу трактуються як UTC.
    - Heartbeat `activeHours` використовує налаштоване визначення часового поясу.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — усі механізми автоматизації стисло
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні ходи основного сеансу
- [Часовий пояс](/uk/concepts/timezone) — налаштування часового поясу
