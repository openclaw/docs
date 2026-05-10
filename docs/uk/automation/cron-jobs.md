---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (Webhook, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, Webhook і тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-05-10T19:21:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може доставляти результат назад у канал чату або кінцеву точку webhook.

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

- Cron виконується **всередині процесу Gateway** (не всередині моделі).
- Визначення завдань зберігаються в `~/.openclaw/cron/jobs.json`, тому розклади не втрачаються після перезапусків.
- Стан виконання під час роботи зберігається поруч у `~/.openclaw/cron/jobs-state.json`. Якщо ви відстежуєте визначення cron у git, відстежуйте `jobs.json` і додайте `jobs-state.json` до gitignore.
- Після розділення старіші версії OpenClaw можуть читати `jobs.json`, але можуть вважати завдання новими, оскільки runtime-поля тепер живуть у `jobs-state.json`.
- Коли `jobs.json` редагується під час роботи Gateway або коли він зупинений, OpenClaw порівнює змінені поля розкладу з метаданими очікуваних runtime-слотів і очищає застарілі значення `nextRunAtMs`. Перезаписи лише форматування або лише порядку ключів зберігають очікуваний слот.
- Усі виконання cron створюють записи [фонового завдання](/uk/automation/tasks).
- Під час запуску Gateway прострочені ізольовані завдання ходу агента переплановуються за межі вікна підключення каналу замість негайного повторного відтворення, тому запуск Discord/Telegram і налаштування нативних команд залишаються швидкими після перезапусків.
- Одноразові завдання (`--at`) за замовчуванням автоматично видаляються після успішного виконання.
- Ізольовані запуски cron за принципом best-effort закривають відстежувані вкладки браузера/процеси для їхньої сесії `cron:<jobId>` після завершення запуску, щоб від’єднана автоматизація браузера не залишала осиротілі процеси.
- Ізольовані запуски cron, які отримують вузький дозвіл на самоочищення cron, усе ще можуть читати статус планувальника, самофільтрований список свого поточного завдання та історію запусків цього завдання, щоб перевірки статусу/heartbeat могли переглядати власний розклад без ширшого доступу до змін cron.
- Ізольовані запуски cron також захищаються від застарілих відповідей-підтверджень. Якщо перший результат є лише проміжним оновленням статусу (`on it`, `pulling everything together` і подібні підказки), а жоден дочірній запуск субагента більше не відповідає за фінальну відповідь, OpenClaw один раз повторно запитує фактичний результат перед доставкою.
- Ізольовані запуски cron надають перевагу структурованим метаданим відмови у виконанні з вбудованого запуску, а потім повертаються до відомих фінальних маркерів підсумку/виводу, як-от `SYSTEM_RUN_DENIED` і `INVALID_REQUEST`, щоб заблокована команда не звітувалася як успішний запуск.
- Ізольовані запуски cron також трактують помилки агента на рівні запуску як помилки завдання, навіть коли payload відповіді не створено, тому збої моделі/провайдера збільшують лічильники помилок і запускають сповіщення про збій замість очищення завдання як успішного.
- Коли ізольоване завдання ходу агента досягає `timeoutSeconds`, cron перериває базовий запуск агента й дає йому коротке вікно для очищення. Якщо запуск не завершує обробку, очищення, яким володіє Gateway, примусово очищає володіння сесією цього запуску до того, як cron зафіксує тайм-аут, щоб чергова робота чату не залишилася за застарілою сесією обробки.
- Якщо ізольований хід агента зависає до запуску runner або до першого виклику моделі, cron записує тайм-аут, специфічний для фази, наприклад `setup timed out before runner start` або `stalled before first model call (last phase: context-engine)`. Ці watchdog-механізми охоплюють вбудованих провайдерів і CLI-backed провайдерів до фактичного запуску їхнього зовнішнього CLI-процесу, а також обмежуються незалежно від довгих значень `timeoutSeconds`, щоб збої cold-start/auth/context проявлялися швидко, а не чекали повного бюджету завдання.

<a id="maintenance"></a>

<Note>
Звіряння завдань для cron спершу належить runtime, а вже потім спирається на довговічну історію: активне cron-завдання залишається живим, доки runtime cron усе ще відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірньої сесії все ще існує. Коли runtime припиняє володіти завданням і минає 5-хвилинне пільгове вікно, перевірки обслуговування переглядають збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця довговічна історія показує термінальний результат, журнал завдань фіналізується на його основі; інакше обслуговування, яким володіє Gateway, може позначити завдання як `lost`. Офлайн-аудит CLI може відновлюватися з довговічної історії, але він не трактує власний порожній внутрішньопроцесний набір активних завдань як доказ того, що cron-запуск, яким володіє Gateway, зник.
</Note>

## Типи розкладів

| Тип     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова часова мітка (ISO 8601 або відносна, як-от `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | 5-польовий або 6-польовий вираз cron з необов’язковим `--tz` |

Часові мітки без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за місцевим настінним часом.

Повторювані вирази на початку години автоматично розподіляються з відхиленням до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### День місяця й день тижня використовують логіку OR

Вирази Cron розбираються [croner](https://github.com/Hexagon/croner). Коли поля дня місяця й дня тижня обидва не є wildcard, croner збігається, коли збігається **будь-яке** з полів, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. OpenClaw тут використовує стандартну OR-поведінку Croner. Щоб вимагати виконання обох умов, використовуйте модифікатор дня тижня `+` у Croner (`0 9 15 * +1`) або плануйте за одним полем і перевіряйте інше в prompt чи команді завдання.

## Стилі виконання

| Стиль           | Значення `--session` | Виконується в            | Найкраще для                    |
| --------------- | -------------------- | ------------------------ | ------------------------------- |
| Основна сесія   | `main`               | Наступний хід heartbeat  | Нагадування, системні події     |
| Ізольований     | `isolated`           | Виділена `cron:<jobId>`  | Звіти, фонові рутинні завдання  |
| Поточна сесія   | `current`            | Прив’язується під час створення | Періодична робота з урахуванням контексту |
| Власна сесія    | `session:custom-id`  | Постійна іменована сесія | Workflow, що будуються на історії |

<AccordionGroup>
  <Accordion title="Основна сесія, ізольована й власна">
    Завдання **основної сесії** додають системну подію в чергу та необов’язково пробуджують heartbeat (`--wake now` або `--wake next-heartbeat`). Ці системні події не подовжують свіжість щоденного/idle скидання для цільової сесії. **Ізольовані** завдання запускають виділений хід агента зі свіжою сесією. **Власні сесії** (`session:xxx`) зберігають контекст між запусками, уможливлюючи workflow на кшталт щоденних стендапів, що спираються на попередні підсумки.
  </Accordion>
  <Accordion title="Що означає «свіжа сесія» для ізольованих завдань">
    Для ізольованих завдань «свіжа сесія» означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні вподобання, як-от налаштування thinking/fast/verbose, мітки та явні вибрані користувачем перевизначення моделі/auth, але не успадковує навколишній контекст розмови зі старішого рядка cron: маршрутизацію каналу/групи, політику надсилання чи черги, elevation, походження або ACP runtime binding. Використовуйте `current` або `session:<id>`, коли періодичне завдання має навмисно будуватися на тому самому контексті розмови.
  </Accordion>
  <Accordion title="Runtime-очищення">
    Для ізольованих завдань runtime-teardown тепер включає best-effort очищення браузера для цієї cron-сесії. Збої очищення ігноруються, щоб фактичний результат cron усе одно мав пріоритет.

    Ізольовані запуски cron також звільняють будь-які bundled MCP runtime instances, створені для завдання, через спільний шлях runtime-cleanup. Це відповідає тому, як main-session і custom-session MCP clients згортаються, тому ізольовані cron-завдання не залишають stdio дочірні процеси або довгоживучі MCP-з’єднання між запусками.

  </Accordion>
  <Accordion title="Субагент і доставка в Discord">
    Коли ізольовані запуски cron оркеструють субагентів, доставка також надає перевагу фінальному виводу нащадка над застарілим проміжним текстом батьківського запуску. Якщо нащадки все ще виконуються, OpenClaw придушує це часткове батьківське оновлення замість його оголошення.

    Для текстових цілей оголошень Discord OpenClaw надсилає канонічний фінальний текст асистента один раз замість повторного відтворення і потокових/проміжних текстових payload, і фінальної відповіді. Медіа та структуровані payload Discord усе ще доставляються як окремі payload, щоб вкладення й компоненти не відкидалися.

  </Accordion>
</AccordionGroup>

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов’язковий для ізольованого).
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

`--model` використовує вибрану дозволену модель як основну модель цього завдання. Це не те саме, що перевизначення `/model` для чат-сесії: налаштовані fallback chains усе ще застосовуються, коли основна модель завдання дає збій. Якщо запитана модель не дозволена або її неможливо resolve, cron завершує запуск явною помилкою валідації замість тихого fallback до вибору agent/default model для завдання.

Завдання Cron також можуть містити payload-level `fallbacks`. Коли він присутній, цей список замінює налаштований fallback chain для завдання. Використовуйте `fallbacks: []` у payload/API завдання, коли потрібен суворий cron-запуск, який пробує лише вибрану модель. Якщо завдання має `--model`, але не має ані payload, ані налаштованих fallbacks, OpenClaw передає явне порожнє fallback override, щоб основна модель агента не додавалася як прихована додаткова ціль повторної спроби.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі Gmail hook (коли запуск прийшов із Gmail і це перевизначення дозволене)
2. Per-job payload `model`
3. Збережене користувачем перевизначення моделі cron-сесії
4. Вибір agent/default model

Швидкий режим також дотримується resolved live selection. Якщо вибрана конфігурація моделі має `params.fastMode`, ізольований cron використовує це за замовчуванням. Збережене перевизначення сесії `fastMode` усе ще має пріоритет над конфігурацією в будь-якому напрямку.

Якщо ізольований запуск потрапляє на handoff live model-switch, cron повторює спробу з переключеним провайдером/моделлю й зберігає цей live selection для активного запуску перед повторною спробою. Коли switch також несе новий auth profile, cron також зберігає це перевизначення auth profile для активного запуску. Повторні спроби обмежені: після початкової спроби плюс 2 switch retries cron переривається замість нескінченного циклу.

Перш ніж ізольований запуск cron увійде до runner агента, OpenClaw перевіряє доступні локальні кінцеві точки провайдерів для налаштованих провайдерів `api: "ollama"` і `api: "openai-completions"`, у яких `baseUrl` є loopback, приватною мережею або `.local`. Якщо ця кінцева точка недоступна, запуск записується як `skipped` із чіткою помилкою провайдера/моделі замість початку виклику моделі. Результат для кінцевої точки кешується на 5 хвилин, тому багато запланованих завдань, що використовують той самий недоступний локальний сервер Ollama, vLLM, SGLang або LM Studio, спільно використовують одну невелику перевірку замість створення шквалу запитів. Пропущені запуски через попередню перевірку провайдера не збільшують backoff для помилок виконання; увімкніть `failureAlert.includeSkipped`, якщо хочете повторні сповіщення про пропуски.

## Доставка й вивід

| Режим     | Що відбувається                                                                 |
| ---------- | ------------------------------------------------------------------------------- |
| `announce` | Резервно доставляє фінальний текст до цілі, якщо агент його не надіслав         |
| `webhook`  | Надсилає payload події завершення методом POST на URL                           |
| `none`     | Немає резервної доставки runner                                                 |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`; прямі виклики RPC/config також можуть передавати `delivery.threadId` як рядок або число. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). ID кімнат Matrix чутливі до регістру; використовуйте точний ID кімнати або форму `room:!room:server` з Matrix.

Коли доставка announce використовує `channel: "last"` або пропускає `channel`, ціль із префіксом провайдера, наприклад `telegram:123`, може вибрати канал до того, як cron повернеться до історії сесії або одного налаштованого каналу. Лише префікси, оголошені завантаженим plugin, є селекторами провайдера. Якщо `delivery.channel` задано явно, префікс цілі має називати того самого провайдера; наприклад, `channel: "whatsapp"` із `to: "telegram:123"` відхиляється замість того, щоб дозволити WhatsApp інтерпретувати ID Telegram як номер телефону. Префікси типу цілі та сервісу, як-от `channel:<id>`, `user:<id>`, `imessage:<handle>` і `sms:<number>`, лишаються синтаксисом цілі, що належить каналу, а не селекторами провайдера.

Для ізольованих завдань доставка в чат є спільною. Якщо доступний маршрут чату, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає до налаштованої/поточної цілі, OpenClaw пропускає резервний announce. Інакше `announce`, `webhook` і `none` керують лише тим, що runner робить із фінальною відповіддю після ходу агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену живу ціль доставки для резервного маршруту announce. Внутрішні ключі сесії можуть бути в нижньому регістрі; цілі доставки провайдера не реконструюються з цих ключів, коли доступний поточний контекст чату.

Неявна доставка announce використовує налаштовані allowlist каналів, щоб перевіряти та перенаправляти застарілі цілі. Схвалення DM зі сховища пар не є отримувачами резервної автоматизації; задайте `delivery.to` або налаштуйте запис `allowFrom` каналу, коли заплановане завдання має проактивно надсилати до DM.

Сповіщення про помилки йдуть окремим шляхом призначення:

- `cron.failureDestination` задає глобальне типове призначення для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо не задано жодного з них і завдання вже доставляється через `announce`, сповіщення про помилки тепер повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань із `sessionTarget="isolated"`, якщо основний режим доставки не є `webhook`.
- `failureAlert.includeSkipped: true` вмикає для завдання або глобальної політики сповіщень cron повторні сповіщення про пропущені запуски. Пропущені запуски мають окремий лічильник послідовних пропусків, тому вони не впливають на backoff для помилок виконання.

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

Gateway може відкривати HTTP Webhook endpoints для зовнішніх тригерів. Увімкніть у config:

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

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ставить системну подію в чергу для основної сесії:

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Користувацькі назви hook розв’язуються через `hooks.mappings` у config. Mappings можуть перетворювати довільні payloads на дії `wake` або `agent` за допомогою шаблонів або перетворень коду.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте кінцеві точки hook за loopback, tailnet або довіреним reverse proxy.

- Використовуйте окремий токен hook; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Задайте `hooks.allowedAgentIds`, щоб обмежити явну маршрутизацію `agentId`.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сесії, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити допустимі форми ключів сесій.
- Payloads hook типово обгортаються межами безпеки.

</Warning>

## Інтеграція Gmail PubSub

Підключіть тригери inbox Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічної кінцевої точки HTTPS.
</Note>

### Налаштування майстром (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує config `hooks.gmail`, вмикає preset Gmail і використовує Tailscale Funnel для push endpoint.

### Автозапуск Gateway

Коли `hooks.enabled=true` і `hooks.gmail.account` задано, Gateway запускає `gog gmail watch serve` під час boot і автоматично поновлює watch. Задайте `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися.

### Ручне одноразове налаштування

<Steps>
  <Step title="Select the GCP project">
    Виберіть проєкт GCP, якому належить OAuth client, що використовується `gog`:

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
Примітка про перевизначення моделі:

- `openclaw cron add|edit --model ...` змінює вибрану модель завдання.
- Якщо модель дозволена, саме цей провайдер/модель доходить до ізольованого запуску агента.
- Якщо вона не дозволена або її неможливо розв’язати, cron завершує запуск помилкою з явною помилкою валідації.
- Налаштовані fallback chains усе ще застосовуються, бо cron `--model` є основною моделлю завдання, а не перевизначенням `/model` сесії.
- Payload `fallbacks` замінює налаштовані fallbacks для цього завдання; `fallbacks: []` вимикає fallback і робить запуск strict.
- Простий `--model` без явного або налаштованого списку fallback не переходить до основної моделі агента як прихована додаткова ціль повторної спроби.

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

`maxConcurrentRuns` обмежує як scheduled cron dispatch, так і виконання ізольованих ходів агента. Ізольовані ходи агента cron внутрішньо використовують виділену lane виконання `cron-nested` у черзі, тому збільшення цього значення дає незалежним cron LLM runs змогу просуватися паралельно, а не лише запускати свої зовнішні cron wrappers. Спільна не-cron lane `nested` цим налаштуванням не розширюється.

Runtime state sidecar виводиться з `cron.store`: сховище `.json`, як-от `~/clawd/cron/jobs.json`, використовує `~/clawd/cron/jobs-state.json`, тоді як шлях сховища без суфікса `.json` додає `-state.json`.

Якщо ви вручну редагуєте `jobs.json`, не додавайте `jobs-state.json` до source control. OpenClaw використовує цей sidecar для pending slots, active markers, metadata останнього запуску та schedule identity, яка повідомляє scheduler, коли зовні відредагованому завданню потрібен свіжий `nextRunAtMs`.

Вимкнути cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Повторна спроба одноразового запуску**: тимчасові помилки (rate limit, overload, network, server error) повторюються до 3 разів з exponential backoff. Постійні помилки вимикають негайно.

    **Повторна спроба періодичного запуску**: exponential backoff (від 30s до 60m) між повторними спробами. Backoff скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (типово `24h`) очищає записи ізольованих run-session. `cron.runLog.maxBytes` / `cron.runLog.keepLines` автоматично очищають файли run-log.
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
    - Перевірте `cron.enabled` і змінну середовища `OPENCLAW_SKIP_CRON`.
    - Переконайтеся, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) порівняно з часовим поясом хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено з `openclaw cron run <jobId> --due`, і час виконання завдання ще не настав.

  </Accordion>
  <Accordion title="Cron спрацював, але доставки немає">
    - Режим доставки `none` означає, що резервне надсилання через runner не очікується. Агент усе ще може надсилати напряму за допомогою інструмента `message`, коли доступний маршрут чату.
    - Відсутня або недійсна ціль доставки (`channel`/`to`) означає, що вихідне надсилання було пропущено.
    - Для Matrix скопійовані або застарілі завдання з ідентифікаторами кімнат `delivery.to` у нижньому регістрі можуть не спрацювати, бо ідентифікатори кімнат Matrix чутливі до регістру. Відредагуйте завдання, указавши точне значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише мовчазний токен (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряму вихідну доставку, а також пригнічує резервний шлях зведення в черзі, тому нічого не публікується назад у чат.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` з попереднім чатом або явний канал/ціль).

  </Accordion>
  <Accordion title="Cron або Heartbeat, схоже, заважає переходу /new-style">
    - Актуальність щоденного й неактивного скидання не базується на `updatedAt`; див. [Керування сеансами](/uk/concepts/session#session-lifecycle).
    - Пробудження Cron, запуски Heartbeat, сповіщення exec і службовий облік Gateway можуть оновлювати рядок сеансу для маршрутизації/статусу, але вони не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сеансу transcript JSONL, якщо файл усе ще доступний. Застарілі неактивні рядки без `lastInteractionAt` використовують цей відновлений час початку як базову точку неактивності.

  </Accordion>
  <Accordion title="Підводні камені часових поясів">
    - Cron без `--tz` використовує часовий пояс хоста Gateway.
    - Розклади `at` без часового поясу вважаються UTC.
    - Heartbeat `activeHours` використовує налаштоване визначення часового поясу.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація й завдання](/uk/automation) — усі механізми автоматизації стисло
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні ходи головного сеансу
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
