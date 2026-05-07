---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (вебхуків, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook і тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-05-07T01:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може доставляти результат назад у чат-канал або Webhook endpoint.

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

- Cron працює **всередині процесу Gateway** (не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не втрачають розклади.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json` і додайте `jobs-state.json` до gitignore.
- Після розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть трактувати завдання як нові, оскільки поля виконання тепер містяться в `jobs-state.json`.
- Коли `jobs.json` редагується під час роботи Gateway або коли його зупинено, OpenClaw порівнює змінені поля розкладу з метаданими очікуваного runtime slot і очищає застарілі значення `nextRunAtMs`. Перезаписи лише з форматуванням або зміною порядку ключів зберігають очікуваний slot.
- Усі виконання cron створюють записи [фонового завдання](/uk/automation/tasks).
- Під час запуску Gateway прострочені ізольовані завдання agent-turn переплановуються за межі вікна підключення каналу, а не відтворюються негайно, тому запуск Discord/Telegram і налаштування native-command залишаються responsive після перезапусків.
- Одноразові завдання (`--at`) за замовчуванням автоматично видаляються після успішного виконання.
- Ізольовані запуски cron у режимі best-effort закривають відстежувані вкладки браузера/процеси для їхньої сесії `cron:<jobId>` після завершення запуску, щоб від’єднана браузерна автоматизація не залишала осиротілі процеси.
- Ізольовані запуски cron, які отримують вузький дозвіл на самоочищення cron, усе ще можуть читати стан планувальника й самофільтрований список свого поточного завдання, тож перевірки status/heartbeat можуть оглядати власний розклад без ширшого доступу до мутацій cron.
- Ізольовані запуски cron також захищаються від застарілих підтверджувальних відповідей. Якщо перший результат — це лише проміжне оновлення стану (`on it`, `pulling everything together` і подібні підказки), і жоден descendant subagent run більше не відповідає за фінальну відповідь, OpenClaw один раз повторно запитує фактичний результат перед доставкою.
- Ізольовані запуски cron спершу надають перевагу структурованим метаданим відмови у виконанні з вбудованого запуску, а потім повертаються до відомих маркерів фінального summary/output, таких як `SYSTEM_RUN_DENIED` і `INVALID_REQUEST`, щоб заблокована команда не повідомлялася як успішний запуск.
- Ізольовані запуски cron також трактують збої агента на рівні запуску як помилки завдання навіть тоді, коли payload відповіді не створено, тому збої моделі/провайдера збільшують лічильники помилок і запускають сповіщення про збій замість того, щоб позначати завдання як успішне.
- Коли ізольоване завдання agent-turn досягає `timeoutSeconds`, cron перериває базовий запуск агента й надає йому коротке вікно для очищення. Якщо запуск не завершується, очищення, що належить Gateway, примусово очищає ownership сесії цього запуску перед тим, як cron запише timeout, тому робота чату в черзі не лишається за застарілою processing session.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron спершу належить runtime, а потім підкріплюється durable history: активне завдання cron залишається live, доки cron runtime усе ще відстежує це завдання як running, навіть якщо старий рядок дочірньої сесії ще існує. Щойно runtime припиняє володіти завданням і минає 5-хвилинне grace window, maintenance перевіряє збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця durable history показує terminal result, task ledger фіналізується з неї; інакше maintenance, що належить Gateway, може позначити завдання як `lost`. Offline CLI audit може відновитися з durable history, але не трактує власний порожній in-process active-job set як доказ того, що cron-запуск, який належить Gateway, зник.
</Note>

## Типи розкладів

| Вид     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова timestamp (ISO 8601 або relative, як-от `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | 5-польовий або 6-польовий cron expression з необов’язковим `--tz` |

Timestamp без timezone трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним wall-clock часом.

Повторювані вирази top-of-hour автоматично розподіляються з відхиленням до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### Day-of-month і day-of-week використовують логіку OR

Cron expressions розбираються за допомогою [croner](https://github.com/Hexagon/croner). Коли поля day-of-month і day-of-week обидва не є wildcard, croner збігається, коли **будь-яке** з полів збігається, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. Тут OpenClaw використовує типову OR-поведінку Croner. Щоб вимагати обидві умови, використовуйте modifier day-of-week Croner `+` (`0 9 15 * +1`) або плануйте за одним полем і перевіряйте інше в prompt чи command вашого завдання.

## Стилі виконання

| Стиль           | Значення `--session` | Де виконується          | Найкраще для                    |
| --------------- | -------------------- | ----------------------- | ------------------------------- |
| Main session    | `main`               | Наступний heartbeat turn | Нагадування, системні події     |
| Ізольований     | `isolated`           | Окремий `cron:<jobId>`  | Звіти, фонові операції          |
| Поточна сесія   | `current`            | Прив’язується під час створення | Повторювана робота з урахуванням контексту |
| Користувацька сесія | `session:custom-id` | Постійна іменована сесія | Workflows, що будуються на історії |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Завдання **Main session** додають системну подію в чергу й, за потреби, пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). Ці системні події не подовжують freshness daily/idle reset для цільової сесії. **Ізольовані** завдання виконують окремий agent turn зі свіжою сесією. **Користувацькі сесії** (`session:xxx`) зберігають контекст між запусками, що дає змогу workflows на кшталт daily standups будуватися на попередніх summary.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Для ізольованих завдань "fresh session" означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні preferences, як-от налаштування thinking/fast/verbose, labels і явно вибрані користувачем model/auth overrides, але не успадковує ambient conversation context зі старішого cron row: routing каналу/групи, send або queue policy, elevation, origin чи ACP runtime binding. Використовуйте `current` або `session:<id>`, коли recurring job має навмисно будуватися на тому самому conversation context.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Для ізольованих завдань runtime teardown тепер включає best-effort очищення браузера для цієї cron-сесії. Помилки очищення ігноруються, щоб фактичний результат cron усе одно мав пріоритет.

    Ізольовані запуски cron також dispose будь-які bundled MCP runtime instances, створені для завдання, через спільний шлях runtime-cleanup. Це відповідає тому, як main-session і custom-session MCP clients завершуються, тому ізольовані cron-завдання не залишають stdio child processes або довгоживучі MCP connections між запусками.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Коли ізольовані запуски cron оркеструють subagents, доставка також надає перевагу фінальному descendant output над застарілим проміжним текстом parent. Якщо descendants усе ще running, OpenClaw пригнічує це partial parent update замість того, щоб оголошувати його.

    Для текстових Discord announce targets OpenClaw надсилає canonical final assistant text один раз замість повторного відтворення як streamed/intermediate text payloads, так і фінальної відповіді. Media і structured Discord payloads усе ще доставляються як окремі payloads, щоб attachments і components не втрачалися.

  </Accordion>
</AccordionGroup>

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов’язковий для isolated).
</ParamField>
<ParamField path="--model" type="string">
  Model override; використовує вибрану allowed model для завдання.
</ParamField>
<ParamField path="--thinking" type="string">
  Перевизначення рівня thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Пропустити injection bootstrap-файлу workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які tools може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану allowed model як primary model цього завдання. Це не те саме, що chat-session override `/model`: налаштовані fallback chains усе ще застосовуються, коли job primary зазнає збою. Якщо requested model не дозволена або її неможливо resolve, cron завершує запуск з явною validation error замість тихого fallback до agent/default model selection завдання.

Якщо старіші або відредаговані вручну entries `jobs.json` зберігають `payload.model` як `"default"`, `"null"`, порожній рядок або JSON `null`, запустіть `openclaw doctor --fix`. Doctor видаляє ці invalid persisted override sentinels; runtime не підтримує їх як fallback aliases. Опустіть поле model, щоб використовувати normal agent/default model selection.

Cron-завдання також можуть містити payload-level `fallbacks`. Якщо вони присутні, цей список замінює configured fallback chain для завдання. Використовуйте `fallbacks: []` у payload/API завдання, коли потрібен strict cron run, який пробує лише selected model. Якщо завдання має `--model`, але не має ні payload fallbacks, ні configured fallbacks, OpenClaw передає явний empty fallback override, щоб agent primary не додавався як hidden extra retry target.

Пріоритет вибору моделі для ізольованих завдань:

1. Gmail hook model override (коли запуск надійшов із Gmail і цей override дозволений)
2. Per-job payload `model`
3. User-selected stored cron session model override
4. Agent/default model selection

Fast mode також слідує за resolved live selection. Якщо selected model config має `params.fastMode`, isolated cron використовує це за замовчуванням. Stored session override `fastMode` усе ще має пріоритет над config в обох напрямках.

Якщо isolated run натрапляє на live model-switch handoff, cron повторює спробу з switched provider/model і зберігає цей live selection для active run перед повторною спробою. Коли switch також несе новий auth profile, cron також зберігає цей auth profile override для active run. Повторні спроби обмежені: після initial attempt плюс 2 switch retries cron переривається замість нескінченного циклу.

Перед тим як isolated cron run увійде в agent runner, OpenClaw перевіряє reachable local provider endpoints для налаштованих провайдерів `api: "ollama"` і `api: "openai-completions"`, у яких `baseUrl` є loopback, private-network або `.local`. Якщо цей endpoint не працює, запуск записується як `skipped` з чіткою provider/model error замість початку model call. Endpoint result кешується на 5 хвилин, тому багато due jobs, що використовують той самий недоступний локальний сервер Ollama, vLLM, SGLang або LM Studio, ділять одну невелику перевірку замість створення request storm. Skipped provider-preflight runs не збільшують execution-error backoff; увімкніть `failureAlert.includeSkipped`, якщо хочете повторні skip notifications.

## Доставка й результат

| Режим     | Що відбувається                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Доставляє фінальний текст цілі резервним способом, якщо агент не надіслав |
| `webhook`  | Надсилає POST із payload завершеної події на URL                                |
| `none`     | Немає резервної доставки runner                                         |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`; прямі RPC/config-виклики також можуть передавати `delivery.threadId` як рядок або число. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). ID кімнат Matrix чутливі до регістру; використовуйте точний ID кімнати або форму `room:!room:server` з Matrix.

Коли доставка оголошення використовує `channel: "last"` або пропускає `channel`, ціль із префіксом провайдера, наприклад `telegram:123`, може вибрати канал до того, як cron повернеться до історії сесії або одного налаштованого каналу. Лише префікси, оголошені завантаженим plugin, є селекторами провайдера. Якщо `delivery.channel` вказано явно, префікс цілі має називати того самого провайдера; наприклад, `channel: "whatsapp"` з `to: "telegram:123"` відхиляється, а не дозволяє WhatsApp інтерпретувати Telegram ID як номер телефону. Префікси типу цілі та сервісу, як-от `channel:<id>`, `user:<id>`, `imessage:<handle>` і `sms:<number>`, залишаються синтаксисом цілей, що належить каналу, а не селекторами провайдера.

Для ізольованих завдань доставка в чат є спільною. Якщо доступний маршрут чату, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає до налаштованої/поточної цілі, OpenClaw пропускає резервне оголошення. Інакше `announce`, `webhook` і `none` керують лише тим, що runner робить із фінальною відповіддю після ходу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену живу ціль доставки для маршруту резервного оголошення. Внутрішні ключі сесії можуть бути в нижньому регістрі; цілі доставки провайдера не реконструюються з цих ключів, коли доступний поточний контекст чату.

Неявна доставка оголошення використовує налаштовані allowlist каналів для перевірки й перенаправлення застарілих цілей. Схвалення зі сховища пар DM не є одержувачами резервної автоматизації; установіть `delivery.to` або налаштуйте запис каналу `allowFrom`, коли заплановане завдання має проактивно надсилати в DM.

Сповіщення про помилки використовують окремий шлях призначення:

- `cron.failureDestination` задає глобальне типове значення для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо жодне не задано і завдання вже доставляє через `announce`, сповіщення про помилки тепер повертаються до цієї основної цілі оголошення.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний режим доставки не `webhook`.
- `failureAlert.includeSkipped: true` вмикає для завдання або глобальної політики сповіщень cron повторні сповіщення про пропущені запуски. Пропущені запуски ведуть окремий лічильник послідовних пропусків, тому вони не впливають на backoff помилок виконання.

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

Gateway може відкривати HTTP Webhook endpoint-и для зовнішніх тригерів. Увімкніть у config:

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

Кожен запит має містити hook token через заголовок:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Токени в query string відхиляються.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Додає системну подію в чергу для основної сесії:

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
    Запускає ізольований хід агента:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Поля: `message` (обов’язкове), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Зіставлені hooks (POST /hooks/<name>)">
    Користувацькі назви hook-ів розв’язуються через `hooks.mappings` у config. Зіставлення можуть перетворювати довільні payload-и на дії `wake` або `agent` за допомогою шаблонів чи code transforms.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте hook endpoint-и за loopback, tailnet або довіреним reverse proxy.

- Використовуйте окремий hook token; не використовуйте повторно auth token-и Gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Установіть `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесій.
- Payload-и hook-ів типово обгортаються межами безпеки.

</Warning>

## Інтеграція Gmail PubSub

Під’єднайте тригери вхідних Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** `gcloud` CLI, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічного HTTPS endpoint.
</Note>

### Налаштування майстром (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує config `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для push endpoint.

### Автозапуск Gateway

Коли `hooks.enabled=true` і задано `hooks.gmail.account`, Gateway запускає `gog gmail watch serve` під час boot і автоматично поновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися.

### Ручне одноразове налаштування

<Steps>
  <Step title="Виберіть проєкт GCP">
    Виберіть проєкт GCP, якому належить OAuth client, що використовується `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Створіть topic і надайте Gmail доступ для push">
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
- Якщо вона не дозволена або не може бути розв’язана, cron завершує запуск помилкою з явною помилкою перевірки.
- Налаштовані fallback chains усе одно застосовуються, бо cron `--model` є основною моделлю завдання, а не перевизначенням сесії `/model`.
- Payload `fallbacks` замінює налаштовані fallbacks для цього завдання; `fallbacks: []` вимикає fallback і робить запуск strict.
- Звичайний `--model` без явного або налаштованого fallback list не переходить до основної моделі агента як мовчазної додаткової цілі повторної спроби.

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

`maxConcurrentRuns` обмежує як заплановану диспетчеризацію cron, так і виконання ізольованого ходу агента. Ізольовані ходи агента cron внутрішньо використовують виділену execution lane черги `cron-nested`, тому збільшення цього значення дозволяє незалежним cron LLM-запускам просуватися паралельно, а не лише запускати їхні зовнішні cron wrappers. Спільна не-cron lane `nested` цим параметром не розширюється.

Sidecar runtime state виводиться з `cron.store`: `.json` store, як-от `~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, тоді як шлях store без суфікса `.json` додає `-state.json`.

Якщо ви вручну редагуєте `jobs.json`, не додавайте `jobs-state.json` до source control. OpenClaw використовує цей sidecar для pending slots, active markers, метаданих останнього запуску та schedule identity, яка повідомляє scheduler, коли зовні відредагованому завданню потрібен свіжий `nextRunAtMs`.

Вимкнути cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Одноразова повторна спроба**: transient errors (rate limit, overload, network, server error) повторюються до 3 разів з експоненційним backoff. Permanent errors вимикають одразу.

    **Повторна спроба для повторюваних завдань**: експоненційний backoff (від 30с до 60хв) між повторними спробами. Backoff скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Обслуговування">
    `cron.sessionRetention` (типово `24h`) очищає записи ізольованих run-session. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають run-log files.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

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
    - Перевірте `cron.enabled` і env var `OPENCLAW_SKIP_CRON`.
    - Переконайтеся, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте timezone (`--tz`) порівняно з timezone хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено за допомогою `openclaw cron run <jobId> --due`, і строк завдання ще не настав.

  </Accordion>
  <Accordion title="Cron спрацював, але доставлення немає">
    - Режим доставлення `none` означає, що резервне надсилання runner не очікується. Агент усе ще може надсилати напряму за допомогою інструмента `message`, коли доступний маршрут чату.
    - Відсутня або недійсна ціль доставлення (`channel`/`to`) означає, що вихідне повідомлення було пропущено.
    - Для Matrix скопійовані або застарілі завдання з ідентифікаторами кімнат `delivery.to` у нижньому регістрі можуть не спрацювати, оскільки ідентифікатори кімнат Matrix чутливі до регістру. Відредагуйте завдання до точного значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставлення було заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише мовчазний токен (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряме вихідне доставлення, а також резервний шлях підсумку в черзі, тому нічого не публікується назад у чат.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` з попереднім чатом або явний канал/ціль).

  </Accordion>
  <Accordion title="Cron або Heartbeat, схоже, перешкоджає переходу /new-style">
    - Свіжість щоденного та бездіяльного скидання не базується на `updatedAt`; див. [Керування сеансами](/uk/concepts/session#session-lifecycle).
    - Пробудження Cron, запуски Heartbeat, сповіщення exec і службові оновлення Gateway можуть оновлювати рядок сеансу для маршрутизації/статусу, але вони не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сеансу transcript JSONL, якщо файл усе ще доступний. Застарілі бездіяльні рядки без `lastInteractionAt` використовують цей відновлений час початку як базову точку бездіяльності.

  </Accordion>
  <Accordion title="Підводні камені часових поясів">
    - Cron без `--tz` використовує часовий пояс хоста Gateway.
    - Розклади `at` без часового поясу трактуються як UTC.
    - Heartbeat `activeHours` використовує налаштоване визначення часового поясу.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — усі механізми автоматизації одним поглядом
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань Cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні ходи основного сеансу
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
