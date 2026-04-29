---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-04-29T15:58:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента у потрібний час і може доставляти результат назад у канал чату або кінцеву точку webhook.

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
- Після розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть вважати завдання новими, бо поля runtime тепер містяться в `jobs-state.json`.
- Коли `jobs.json` редагується під час роботи або зупинки Gateway, OpenClaw порівнює змінені поля розкладу з метаданими очікуваного runtime-слота й очищує застарілі значення `nextRunAtMs`. Суто форматування або переписування лише порядку ключів зберігають очікуваний слот.
- Усі виконання cron створюють записи [фонового завдання](/uk/automation/tasks).
- Під час запуску Gateway прострочені ізольовані завдання agent-turn переплановуються за межі вікна підключення каналу, а не відтворюються негайно, тому запуск Discord/Telegram і налаштування нативних команд залишаються чуйними після перезапусків.
- Одноразові завдання (`--at`) за замовчуванням автоматично видаляються після успішного виконання.
- Ізольовані запуски cron за можливості закривають відстежувані вкладки/процеси браузера для свого сеансу `cron:<jobId>` після завершення запуску, щоб від'єднана автоматизація браузера не залишала осиротілих процесів.
- Ізольовані запуски cron також захищаються від застарілих відповідей-підтверджень. Якщо перший результат є лише проміжним оновленням стану (`on it`, `pulling everything together` і подібні підказки), а жоден дочірній запуск субагента вже не відповідає за фінальну відповідь, OpenClaw один раз повторно запитує фактичний результат перед доставкою.
- Ізольовані запуски cron спершу віддають перевагу структурованим метаданим відмови у виконанні з вбудованого запуску, а потім переходять до відомих маркерів фінального підсумку/виводу, таких як `SYSTEM_RUN_DENIED` і `INVALID_REQUEST`, щоб заблокована команда не повідомлялася як успішний запуск.
- Ізольовані запуски cron також трактують збої агента на рівні запуску як помилки завдання, навіть коли payload відповіді не створено, тому збої моделі/провайдера збільшують лічильники помилок і запускають сповіщення про збій, а не очищують завдання як успішне.
- Коли ізольоване завдання agent-turn досягає `timeoutSeconds`, cron перериває базовий запуск агента й дає йому коротке вікно для очищення. Якщо запуск не завершує спорожнення, очищення, яким володіє Gateway, примусово очищує володіння сеансом цього запуску до того, як cron запише тайм-аут, щоб робота з черги чату не залишалася за застарілим сеансом обробки.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron спершу належить runtime, а потім спирається на довготривалу історію: активне завдання cron залишається live, доки runtime cron ще відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірнього сеансу ще існує. Щойно runtime перестає володіти завданням і 5-хвилинне пільгове вікно спливає, обслуговування перевіряє збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця довготривала історія показує термінальний результат, журнал завдань фіналізується з нього; інакше обслуговування, яким володіє Gateway, може позначити завдання як `lost`. Офлайн-аудит CLI може відновлюватися з довготривалої історії, але він не трактує власний порожній in-process набір активних завдань як доказ того, що запуск cron, яким володіє Gateway, зник.
</Note>

## Типи розкладів

| Тип     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова позначка часу (ISO 8601 або відносна, як-от `20m`) |
| `every` | `--every`     | Фіксований інтервал                                    |
| `cron`  | `--cron`      | 5-польовий або 6-польовий вираз cron з необов'язковим `--tz` |

Позначки часу без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним настінним часом.

Повторювані вирази на початку години автоматично розподіляються з розкидом до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### День місяця й день тижня використовують логіку OR

Вирази cron розбираються за допомогою [croner](https://github.com/Hexagon/croner). Коли поля дня місяця й дня тижня обидва не є шаблонами, croner збігається, коли збігається **будь-яке** з полів, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5-6 разів на місяць замість 0-1 разу на місяць. OpenClaw тут використовує стандартну поведінку OR від Croner. Щоб вимагати виконання обох умов, використовуйте модифікатор дня тижня `+` від Croner (`0 9 15 * +1`) або плануйте за одним полем і перевіряйте інше у prompt чи команді завдання.

## Стилі виконання

| Стиль           | Значення `--session` | Виконується в             | Найкраще для                    |
| --------------- | -------------------- | ------------------------- | ------------------------------- |
| Основний сеанс  | `main`               | Наступний heartbeat turn  | Нагадування, системні події     |
| Ізольований     | `isolated`           | Виділений `cron:<jobId>`  | Звіти, фонові службові роботи   |
| Поточний сеанс  | `current`            | Прив'язаний під час створення | Періодична робота з урахуванням контексту |
| Власний сеанс   | `session:custom-id`  | Постійний іменований сеанс | Робочі процеси, що спираються на історію |

<AccordionGroup>
  <Accordion title="Основний сеанс, ізольований і власний">
    Завдання **основного сеансу** ставлять системну подію в чергу й за потреби пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). Ці системні події не подовжують свіжість щоденного/idle-скидання для цільового сеансу. **Ізольовані** завдання виконують виділений agent turn зі свіжим сеансом. **Власні сеанси** (`session:xxx`) зберігають контекст між запусками, уможливлюючи робочі процеси на кшталт щоденних стендапів, що спираються на попередні підсумки.
  </Accordion>
  <Accordion title="Що означає «свіжий сеанс» для ізольованих завдань">
    Для ізольованих завдань «свіжий сеанс» означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні налаштування, як-от параметри thinking/fast/verbose, мітки та явні вибрані користувачем перевизначення моделі/автентифікації, але не успадковує навколишній контекст розмови зі старішого рядка cron: маршрутизацію каналу/групи, політику надсилання або черги, підвищення, origin чи прив'язку ACP runtime. Використовуйте `current` або `session:<id>`, коли повторюване завдання має навмисно спиратися на той самий контекст розмови.
  </Accordion>
  <Accordion title="Очищення runtime">
    Для ізольованих завдань демонтаж runtime тепер включає best-effort очищення браузера для цього сеансу cron. Помилки очищення ігноруються, щоб фактичний результат cron все одно мав пріоритет.

    Ізольовані запуски cron також утилізують будь-які bundled MCP runtime instances, створені для завдання, через спільний шлях runtime-cleanup. Це відповідає тому, як демонтуються MCP-клієнти основного сеансу й власного сеансу, тому ізольовані завдання cron не залишають stdio дочірні процеси або довгоживучі MCP-з'єднання між запусками.

  </Accordion>
  <Accordion title="Субагент і доставка Discord">
    Коли ізольовані запуски cron оркеструють субагентів, доставка також віддає перевагу фінальному виводу нащадка над застарілим проміжним текстом батьківського запуску. Якщо нащадки ще виконуються, OpenClaw пригнічує це часткове оновлення батьківського запуску замість того, щоб оголошувати його.

    Для текстових цілей оголошення Discord OpenClaw надсилає канонічний фінальний текст асистента один раз замість повторного відтворення і streamed/intermediate текстових payload, і фінальної відповіді. Медіа та структуровані payload Discord все ще доставляються як окремі payload, щоб вкладення й компоненти не губилися.

  </Accordion>
</AccordionGroup>

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов'язковий для ізольованого).
</ParamField>
<ParamField path="--model" type="string">
  Перевизначення моделі; використовує вибрану дозволену модель для завдання.
</ParamField>
<ParamField path="--thinking" type="string">
  Перевизначення рівня thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Пропустити ін'єкцію bootstrap-файла робочої області.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які інструменти може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель як основну модель цього завдання. Це не те саме, що перевизначення `/model` сеансу чату: налаштовані ланцюжки fallback все ще застосовуються, коли основна модель завдання зазнає збою. Якщо запитана модель не дозволена або не може бути визначена, cron завершує запуск із явною помилкою валідації замість тихого fallback до вибору моделі агента/за замовчуванням для завдання.

Завдання Cron також можуть містити `fallbacks` на рівні payload. Коли він присутній, цей список замінює налаштований ланцюжок fallback для завдання. Використовуйте `fallbacks: []` у payload/API завдання, коли потрібен строгий запуск cron, який пробує лише вибрану модель. Якщо завдання має `--model`, але не має fallback ні в payload, ні в конфігурації, OpenClaw передає явне порожнє перевизначення fallback, щоб основна модель агента не додавалася як прихована додаткова ціль повторної спроби.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі Gmail hook (коли запуск надійшов із Gmail і це перевизначення дозволене)
2. `model` у payload конкретного завдання
3. Збережене вибране користувачем перевизначення моделі сеансу cron
4. Вибір моделі агента/за замовчуванням

Fast mode також наслідує resolved live selection. Якщо конфігурація вибраної моделі має `params.fastMode`, ізольований cron використовує це за замовчуванням. Збережене перевизначення `fastMode` сеансу все одно має пріоритет над конфігурацією в будь-якому напрямку.

Якщо ізольований запуск потрапляє на live model-switch handoff, cron повторює спробу з перемкненим провайдером/моделлю і зберігає цей live selection для активного запуску перед повторною спробою. Коли перемикання також містить новий auth profile, cron також зберігає це перевизначення auth profile для активного запуску. Повторні спроби обмежені: після початкової спроби плюс 2 повторних спроб перемикання cron переривається замість нескінченного циклу.

Перед тим як ізольований запуск cron входить у runner агента, OpenClaw перевіряє доступні локальні кінцеві точки провайдерів для налаштованих провайдерів `api: "ollama"` і `api: "openai-completions"`, чий `baseUrl` є loopback, private-network або `.local`. Якщо ця кінцева точка не працює, запуск записується як `skipped` із чіткою помилкою провайдера/моделі замість початку виклику моделі. Результат кінцевої точки кешується на 5 хвилин, тому багато прострочених завдань, що використовують той самий непрацюючий локальний сервер Ollama, vLLM, SGLang або LM Studio, ділять одну невелику перевірку замість створення шторму запитів. Пропущені provider-preflight запуски не збільшують backoff помилок виконання; увімкніть `failureAlert.includeSkipped`, якщо хочете повторювані сповіщення про пропуск.

## Доставка й вивід

| Режим      | Що відбувається                                                    |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Fallback-доставляє фінальний текст до цілі, якщо агент не надіслав |
| `webhook`  | POST payload події завершення на URL                               |
| `none`     | Немає fallback-доставки runner                                     |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`; прямі виклики RPC/config також можуть передавати `delivery.threadId` як рядок або число. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). Ідентифікатори кімнат Matrix чутливі до регістру; використовуйте точний ID кімнати або форму `room:!room:server` з Matrix.

Для ізольованих завдань доставка в чат є спільною. Якщо маршрут чату доступний, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає до налаштованої/поточної цілі, OpenClaw пропускає резервне оголошення. Інакше `announce`, `webhook` і `none` керують лише тим, що runner робить із фінальною відповіддю після ходу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену поточну ціль доставки для резервного маршруту оголошення. Внутрішні ключі сесій можуть бути в нижньому регістрі; цілі доставки провайдера не реконструюються з цих ключів, коли доступний поточний контекст чату.

Сповіщення про збої використовують окремий шлях призначення:

- `cron.failureDestination` задає глобальне значення за замовчуванням для сповіщень про збої.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо жодне з них не задано, а завдання вже доставляє через `announce`, сповіщення про збої тепер повертаються до цієї основної цілі оголошення.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний режим доставки не є `webhook`.
- `failureAlert.includeSkipped: true` вмикає для завдання або глобальної політики сповіщень cron повторні сповіщення про пропущені запуски. Пропущені запуски ведуть окремий лічильник послідовних пропусків, тому вони не впливають на backoff помилок виконання.

## Приклади CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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

## Webhooks

Gateway може відкривати HTTP Webhook-ендпоїнти для зовнішніх тригерів. Увімкніть у config:

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
    Додайте системну подію до черги для основної сесії:

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
    Запустіть ізольований хід агента:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Поля: `message` (обов’язкове), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Власні назви hook розв’язуються через `hooks.mappings` у config. Mappings можуть перетворювати довільні payloads на дії `wake` або `agent` за допомогою шаблонів чи перетворень коду.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте hook-ендпоїнти за local loopback, tailnet або довіреним reverse proxy.

- Використовуйте виділений токен hook; не перевикористовуйте токени автентифікації Gateway.
- Тримайте `hooks.path` на виділеному підшляху; `/` відхиляється.
- Задайте `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Залишайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити допустимі форми ключів сесій.
- Payloads hook за замовчуванням обгортаються межами безпеки.

</Warning>

## Інтеграція Gmail PubSub

Під’єднайте тригери вхідної скриньки Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічного HTTPS-ендпоїнта.
</Note>

### Налаштування майстром (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує config `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для push-ендпоїнта.

### Автозапуск Gateway

Коли `hooks.enabled=true` і задано `hooks.gmail.account`, Gateway запускає `gog gmail watch serve` під час завантаження та автоматично поновлює watch. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися.

### Ручне одноразове налаштування

<Steps>
  <Step title="Select the GCP project">
    Виберіть проєкт GCP, якому належить клієнт OAuth, що використовується `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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
- Якщо модель дозволена, точний provider/model доходить до ізольованого запуску агента.
- Якщо вона не дозволена або не може бути розв’язана, cron завершує запуск з явною помилкою валідації.
- Налаштовані fallback chains усе ще застосовуються, бо cron `--model` є основним значенням завдання, а не перевизначенням сесії `/model`.
- Payload `fallbacks` замінює налаштовані fallbacks для цього завдання; `fallbacks: []` вимикає fallback і робить запуск строгим.
- Звичайний `--model` без явного або налаштованого списку fallback не переходить до основної моделі агента як мовчазна додаткова ціль повторної спроби.

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

`maxConcurrentRuns` обмежує як диспетчеризацію запланованих cron, так і виконання ізольованого ходу агента. Ізольовані ходи cron-агента внутрішньо використовують виділену смугу виконання черги `cron-nested`, тому збільшення цього значення дає змогу незалежним cron-запускам LLM просуватися паралельно, а не лише запускати їхні зовнішні cron-обгортки. Спільна не-cron смуга `nested` цим налаштуванням не розширюється.

Sidecar стану runtime виводиться з `cron.store`: сховище `.json`, як-от `~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, а шлях сховища без суфікса `.json` додає `-state.json`.

Якщо ви вручну редагуєте `jobs.json`, не додавайте `jobs-state.json` до системи контролю версій. OpenClaw використовує цей sidecar для pending slots, active markers, метаданих останнього запуску та ідентичності розкладу, яка повідомляє scheduler, коли зовнішньо відредаговане завдання потребує нового `nextRunAtMs`.

Вимкнути cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Повторна спроба одноразового завдання**: тимчасові помилки (ліміт частоти, перевантаження, мережа, помилка сервера) повторюються до 3 разів з експоненційним backoff. Постійні помилки вимикають негайно.

    **Повторна спроба повторюваного завдання**: експоненційний backoff (від 30 с до 60 хв) між повторними спробами. Backoff скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (за замовчуванням `24h`) очищує записи ізольованих run-session. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищують файли run-log.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

### Сходи команд

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
  <Accordion title="Cron not firing">
    - Перевірте `cron.enabled` і змінну середовища `OPENCLAW_SKIP_CRON`.
    - Переконайтеся, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) порівняно з часовим поясом host.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, і час завдання ще не настав.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Режим доставки `none` означає, що резервне надсилання runner не очікується. Агент усе ще може надсилати напряму через інструмент `message`, коли доступний маршрут чату.
    - Відсутня/недійсна ціль доставки (`channel`/`to`) означає, що вихідне надсилання було пропущено.
    - Для Matrix скопійовані або legacy завдання з ідентифікаторами кімнат `delivery.to` у нижньому регістрі можуть завершуватися помилкою, бо ідентифікатори кімнат Matrix чутливі до регістру. Відредагуйте завдання до точного значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише мовчазний токен (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряму вихідну доставку, а також пригнічує резервний шлях зведення в черзі, тому в чат нічого не публікується.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` з попереднім чатом або явний канал/ціль).

  </Accordion>
  <Accordion title="Здається, Cron або heartbeat заважає перенесенню /new-style">
    - Свіжість щоденного та неактивного скидання не базується на `updatedAt`; див. [Керування сеансами](/uk/concepts/session#session-lifecycle).
    - Пробудження Cron, запуски heartbeat, сповіщення exec і службові оновлення gateway можуть оновлювати рядок сеансу для маршрутизації/статусу, але вони не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сеансу transcript JSONL, якщо файл досі доступний. Застарілі неактивні рядки без `lastInteractionAt` використовують цей відновлений час початку як базовий рівень неактивності.

  </Accordion>
  <Accordion title="Підводні камені часових поясів">
    - Cron без `--tz` використовує часовий пояс хоста gateway.
    - Розклади `at` без часового поясу трактуються як UTC.
    - Heartbeat `activeHours` використовує налаштоване визначення часового поясу.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — усі механізми автоматизації стисло
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні ходи основного сеансу
- [Часовий пояс](/uk/concepts/timezone) — налаштування часового поясу
