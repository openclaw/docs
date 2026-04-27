---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook-и, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook-и та тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-04-27T02:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccc139d66e9461fac4b4304496568e6216234616febef1e8f90d4897a4245378
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може повертати результат у чат-канал або до кінцевої точки Webhook.

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
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому перезапуски не призводять до втрати розкладів.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json` і додавайте `jobs-state.json` до gitignore.
- Після цього розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть трактувати завдання як нові, оскільки поля стану виконання тепер зберігаються в `jobs-state.json`.
- Усі виконання cron створюють записи [фонових завдань](/uk/automation/tasks).
- Одноразові завдання (`--at`) автоматично видаляються після успішного виконання за замовчуванням.
- Ізольовані запуски cron у межах best-effort закривають відстежувані вкладки/процеси браузера для своєї сесії `cron:<jobId>` після завершення запуску, щоб відокремлена автоматизація браузера не залишала процеси-сироти.
- Ізольовані запуски cron також захищаються від застарілих відповідей-підтверджень. Якщо перший результат — це лише проміжне оновлення стану (`on it`, `pulling everything together` та подібні підказки), і жоден дочірній запуск субагента більше не відповідає за фінальну відповідь, OpenClaw повторно надсилає запит один раз, щоб отримати фактичний результат перед доставкою.
- Ізольовані запуски cron класифікують відомі маркери відмови у виконанні у фінальному підсумку/виводі як помилки, зокрема маркери хоста на кшталт `SYSTEM_RUN_DENIED` і `INVALID_REQUEST`, щоб заблокована команда не позначалася як успішний запуск.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron насамперед належить до runtime, а вже потім спирається на стійку історію: активне завдання cron залишається активним, доки runtime cron усе ще відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірньої сесії все ще існує. Щойно runtime перестає володіти завданням і минає 5-хвилинне вікно пільгового часу, перевірки обслуговування аналізують збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця стійка історія показує термінальний результат, журнал завдань фіналізується на її основі; інакше обслуговування, що належить Gateway, може позначити завдання як `lost`. Офлайн-аудит CLI може відновитися зі стійкої історії, але він не розглядає власний порожній внутрішньопроцесний набір активних завдань як доказ того, що запуск cron, яким володіє Gateway, зник.
</Note>

## Типи розкладів

| Вид     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова позначка часу (ISO 8601 або відносна, як-от `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | Cron-вираз із 5 або 6 полів з необов’язковим `--tz`     |

Позначки часу без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним настінним часом.

Повторювані вирази на початок години автоматично зміщуються до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово встановити точний час, або `--stagger 30s` для явного вікна.

### День місяця і день тижня використовують логіку OR

Cron-вирази аналізуються за допомогою [croner](https://github.com/Hexagon/croner). Коли і поле дня місяця, і поле дня тижня не є wildcard, croner вважає збігом випадок, коли **збігається будь-яке** з цих полів, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Такий вираз спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. OpenClaw тут використовує стандартну OR-поведінку Croner. Щоб вимагати виконання обох умов, використовуйте модифікатор дня тижня `+` у Croner (`0 9 15 * +1`) або плануйте за одним полем, а інше перевіряйте в prompt або команді свого завдання.

## Стилі виконання

| Стиль           | Значення `--session` | Запускається в          | Найкраще підходить для          |
| --------------- | -------------------- | ----------------------- | ------------------------------- |
| Основна сесія   | `main`               | Наступний цикл Heartbeat | Нагадувань, системних подій     |
| Ізольований     | `isolated`           | Виділена `cron:<jobId>` | Звітів, фонових справ           |
| Поточна сесія   | `current`            | Прив’язується під час створення | Повторюваної роботи з урахуванням контексту |
| Користувацька сесія | `session:custom-id` | Постійна іменована сесія | Процесів, що спираються на історію |

<AccordionGroup>
  <Accordion title="Основна сесія vs ізольована vs користувацька">
    Завдання **основної сесії** ставлять у чергу системну подію та за потреби пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). Такі системні події не подовжують актуальність скидання за днем/простою для цільової сесії. **Ізольовані** завдання запускають окремий цикл агента зі свіжою сесією. **Користувацькі сесії** (`session:xxx`) зберігають контекст між запусками, що дає змогу реалізувати сценарії на кшталт щоденних стендапів, які спираються на попередні підсумки.
  </Accordion>
  <Accordion title="Що означає 'свіжа сесія' для ізольованих завдань">
    Для ізольованих завдань «свіжа сесія» означає новий ідентифікатор transcript/session для кожного запуску. OpenClaw може переносити безпечні налаштування, як-от параметри thinking/fast/verbose, мітки та явні обрані користувачем перевизначення моделі/автентифікації, але не успадковує фоновий контекст розмови зі старого рядка cron: маршрутизацію каналу/групи, політику надсилання або постановки в чергу, підвищення привілеїв, походження чи прив’язку runtime ACP. Використовуйте `current` або `session:<id>`, коли повторюване завдання має навмисно спиратися на той самий контекст розмови.
  </Accordion>
  <Accordion title="Очищення runtime">
    Для ізольованих завдань згортання runtime тепер включає best-effort очищення браузера для цієї cron-сесії. Помилки очищення ігноруються, тож фактичний результат cron усе одно має пріоритет.

    Ізольовані запуски cron також звільняють усі вбудовані екземпляри runtime MCP, створені для завдання, через спільний шлях очищення runtime. Це відповідає тому, як закриваються клієнти MCP для основної та користувацької сесій, тому ізольовані cron-завдання не витікають у stdio дочірні процеси або довготривалі MCP-з’єднання між запусками.

  </Accordion>
  <Accordion title="Доставка через субагента і Discord">
    Коли ізольовані запуски cron оркеструють субагентів, під час доставки також надається перевага фінальному виводу нащадка, а не застарілому проміжному тексту батьківського запуску. Якщо нащадки все ще виконуються, OpenClaw пригнічує це часткове оновлення батьківського запуску замість того, щоб оголошувати його.

    Для цілей оголошення Discord лише з текстом OpenClaw надсилає канонічний фінальний текст асистента один раз, замість того щоб повторно відтворювати і потокові/проміжні текстові payload-и, і фінальну відповідь. Медіа та структуровані payload-и Discord, як і раніше, доставляються окремо, щоб не втрачалися вкладення та компоненти.

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
  Пропустити ін’єкцію bootstrap-файлу робочого простору.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які інструменти може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель для цього завдання. Якщо запитана модель не дозволена, cron записує попередження в журнал і натомість повертається до вибору моделі агента/моделі за замовчуванням для цього завдання. Налаштовані ланцюжки fallback, як і раніше, застосовуються, але просте перевизначення моделі без явного списку fallback для конкретного завдання більше не додає основну модель агента як приховану додаткову ціль для повторної спроби.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі через Gmail hook (коли запуск прийшов із Gmail і це перевизначення дозволене)
2. `model` у payload конкретного завдання
3. Збережене перевизначення моделі cron-сесії, вибране користувачем
4. Вибір моделі агента/за замовчуванням

Режим fast також використовує визначений під час виконання вибір. Якщо конфігурація вибраної моделі має `params.fastMode`, ізольований cron використовує це значення за замовчуванням. Збережене в сесії перевизначення `fastMode` усе одно має пріоритет над конфігурацією в будь-який бік.

Якщо ізольований запуск натрапляє на live-передавання керування через перемикання моделі, cron виконує повторну спробу з перемкненим provider/model і зберігає цей live-вибір для активного запуску перед повторною спробою. Якщо перемикання також передає новий профіль автентифікації, cron також зберігає це перевизначення auth profile для активного запуску. Повторні спроби обмежені: після початкової спроби плюс 2 повторні спроби через перемикання cron переривається замість безкінечного циклу.

## Доставка і вивід

| Режим      | Що відбувається                                                     |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Резервно доставляє фінальний текст до цілі, якщо агент його не надіслав |
| `webhook`  | Надсилає payload завершеної події методом POST на URL               |
| `none`     | Без резервної доставки з боку виконавця                             |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки до каналу. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). Ідентифікатори кімнат Matrix чутливі до регістру; використовуйте точний room ID або форму `room:!room:server` із Matrix.

Для ізольованих завдань доставка до чату є спільною. Якщо маршрут чату доступний, агент може використовувати інструмент `message`, навіть коли для завдання використовується `--no-deliver`. Якщо агент надсилає повідомлення до налаштованої/поточної цілі, OpenClaw пропускає резервне оголошення. Інакше `announce`, `webhook` і `none` керують лише тим, що виконавець робить із фінальною відповіддю після циклу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену live-ціль доставки для маршруту резервного оголошення. Внутрішні ключі сесії можуть бути в нижньому регістрі; цілі доставки provider не реконструюються з цих ключів, коли доступний контекст поточного чату.

Сповіщення про помилки використовують окремий шлях призначення:

- `cron.failureDestination` задає глобальне значення за замовчуванням для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо не задано жодного з них, а завдання вже використовує доставку через `announce`, сповіщення про помилки тепер резервно надсилаються до тієї самої основної цілі оголошення.
- `delivery.failureDestination` підтримується лише для завдань із `sessionTarget="isolated"`, якщо тільки основний режим доставки не є `webhook`.

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
  <Tab title="Перевизначення моделі й thinking">
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

Gateway може відкривати HTTP-кінцеві точки Webhook для зовнішніх тригерів. Увімкніть у конфігурації:

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

Кожен запит має містити токен hook у заголовку:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Токени в рядку запиту відхиляються.

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
    Запускає ізольований цикл агента:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Поля: `message` (обов’язково), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Зіставлені hooks (POST /hooks/<name>)">
    Користувацькі назви hook-ів визначаються через `hooks.mappings` у конфігурації. Зіставлення можуть перетворювати довільні payload-и на дії `wake` або `agent` за допомогою шаблонів або перетворень коду.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте кінцеві точки hook-ів за loopback, tailnet або довіреним reverse proxy.

- Використовуйте окремий токен hook-ів; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Установіть `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Залишайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів сесій.
- Payload-и hook-ів за замовчуванням обгортаються межами безпеки.
  </Warning>

## Інтеграція Gmail PubSub

Підключіть тригери вхідної пошти Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічної кінцевої точки HTTPS.
</Note>

### Налаштування через майстер (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає пресет Gmail і використовує Tailscale Funnel для push-кінцевої точки.

### Автозапуск Gateway

Коли `hooks.enabled=true` і задано `hooks.gmail.account`, Gateway під час запуску запускає `gog gmail watch serve` і автоматично поновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися від цього.

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

### Перевизначення моделі для Gmail

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
- Якщо модель дозволена, саме цей provider/model передається до ізольованого запуску агента.
- Якщо вона не дозволена, cron видає попередження і повертається до вибору моделі агента/моделі за замовчуванням для завдання.
- Налаштовані ланцюжки fallback, як і раніше, застосовуються, але просте перевизначення `--model` без явного списку fallback для конкретного завдання більше не переходить до основної моделі агента як до мовчазної додаткової цілі повторної спроби.
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

Побічний файл стану runtime виводиться з `cron.store`: сховище `.json`, таке як `~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, тоді як до шляху сховища без суфікса `.json` додається `-state.json`.

Вимкнення cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Повтор для одноразових завдань**: тимчасові помилки (ліміт запитів, перевантаження, мережа, помилка сервера) повторюються до 3 разів з експоненційною затримкою. Постійні помилки одразу вимикають завдання.

    **Повтор для повторюваних завдань**: експоненційна затримка (від 30 с до 60 хв) між повторними спробами. Після наступного успішного запуску затримка скидається.

  </Accordion>
  <Accordion title="Обслуговування">
    `cron.sessionRetention` (типово `24h`) очищає записи сесій ізольованих запусків. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли журналів запусків.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

### Командна драбина

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
    - Підтвердьте, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) відносно часового поясу хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, але час виконання завдання ще не настав.
  </Accordion>
  <Accordion title="Cron спрацював, але доставки немає">
    - Режим доставки `none` означає, що резервне надсилання з боку виконавця не очікується. Агент усе ще може надсилати напряму за допомогою інструмента `message`, коли маршрут чату доступний.
    - Відсутня/некоректна ціль доставки (`channel`/`to`) означає, що вихідне надсилання було пропущено.
    - Для Matrix скопійовані або застарілі завдання з room ID у `delivery.to`, приведеними до нижнього регістру, можуть не працювати, оскільки room ID у Matrix чутливі до регістру. Відредагуйте завдання, вказавши точне значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише безшумний токен (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряме вихідне надсилання, а також резервний шлях підсумку в черзі, тож назад у чат нічого не публікується.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` з попереднім чатом або явний канал/ціль).
  </Accordion>
  <Accordion title="Здається, cron або heartbeat заважає ротації у стилі /new">
    - Актуальність щоденного скидання та скидання через простій не базується на `updatedAt`; див. [Керування сесіями](/uk/concepts/session#session-lifecycle).
    - Пробудження cron, запуски heartbeat, сповіщення exec і службові дії gateway можуть оновлювати рядок сесії для маршрутизації/стану, але вони не продовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сесії transcript JSONL, якщо файл усе ще доступний. Для застарілих рядків простою без `lastInteractionAt` цей відновлений час початку використовується як базова точка простою.
  </Accordion>
  <Accordion title="Особливості часових поясів">
    - Cron без `--tz` використовує часовий пояс хоста gateway.
    - Розклади `at` без часового поясу трактуються як UTC.
    - `activeHours` у Heartbeat використовує налаштоване визначення часового поясу.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація і завдання](/uk/automation) — огляд усіх механізмів автоматизації
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні цикли основної сесії
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
