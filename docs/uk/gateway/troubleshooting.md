---
read_when:
    - Центр усунення проблем спрямував вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи сценарію на основі симптомів із точними командами
sidebarTitle: Troubleshooting
summary: Поглиблений сценарій усунення проблем для Gateway, каналів, автоматизації, Node і браузера
title: Усунення проблем
x-i18n:
    generated_at: "2026-04-27T10:59:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5723c7feb3390e77a8e05c7cd105431928077edef4f513fa5a165785ea0782ce
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Ця сторінка — поглиблений сценарій. Якщо спочатку вам потрібен швидкий потік тріажу, почніть із [/help/troubleshooting](/uk/help/troubleshooting).

## Послідовність команд

Спочатку виконайте ці команди в такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/служб.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису та, де це підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Розщеплені встановлення та захист від новішої конфігурації

Використовуйте це, коли служба Gateway неочікувано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записувала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть перевіряти конфігурацію, записану новішим OpenClaw, але мутації процесів і служб відмовляються продовжуватися зі старішого бінарного файла. До заблокованих дій належать запуск, зупинка, перезапуск і видалення служби Gateway, примусове перевстановлення служби, запуск Gateway у режимі служби та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Виправте PATH">
    Виправте `PATH`, щоб `openclaw` вказував на новіше встановлення, а потім повторно виконайте дію.
  </Step>
  <Step title="Перевстановіть службу Gateway">
    Перевстановіть потрібну службу Gateway з новішого встановлення:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Видаліть застарілі обгортки">
    Видаліть застарілі записи системного пакета або старі обгортки, які все ще вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного пониження версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи лишайте цю змінну невстановленою.
</Warning>

## Для довгого контексту Anthropic 429 потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте таке:

- У вибраної моделі Anthropic Opus/Sonnet є `params.context1m: true`.
- Поточні облікові дані Anthropic не дають права на використання довгого контексту.
- Запити падають лише на довгих сесіях/запусках моделей, яким потрібен бета-шлях 1M.

Варіанти виправлення:

<Steps>
  <Step title="Вимкніть context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
  </Step>
  <Step title="Використовуйте облікові дані, що дають право доступу">
    Використовуйте облікові дані Anthropic, які дають право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
  </Step>
  <Step title="Налаштуйте резервні моделі">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і вартість](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний backend, сумісний з OpenAI, проходить прямі probe, але запуски агента падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw падають лише на звичайних ходах агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте таке:

- прямі малі виклики успішні, але запуски OpenClaw падають лише на більших промптах
- помилки backend про `messages[].content`, яке очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` із локальним backend, сумісним з OpenAI
- збої backend, які з’являються лише за більшої кількості токенів промпту або з повними промптами середовища виконання агента

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `messages[...].content: invalid type: sequence, expected a string` → backend відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend завершив запит Chat Completions, але не повернув жодного видимого для користувача тексту асистента для цього ходу. OpenClaw один раз повторює безпечні для відтворення порожні ходи OpenAI-compatible; стійкі збої зазвичай означають, що backend видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - прямі малі запити успішні, але запуски агента OpenClaw падають через збої backend/моделі (наприклад Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, уже налаштований правильно; проблема в тому, що backend не справляється з більшою формою промпту середовища виконання агента.
    - збоїв стає менше після вимкнення інструментів, але вони не зникають → схеми інструментів були частиною навантаження, але решта проблеми все одно полягає в обмеженні upstream-моделі/сервера або в багу backend.
  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Встановіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядки.
    2. Встановіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
    3. Зменште навантаження промпту, де це можливо: менше початкове завантаження workspace, коротша історія сесії, легша локальна модель або backend із кращою підтримкою довгого контексту.
    4. Якщо прямі малі запити й далі проходять, а ходи агента OpenClaw все ще спричиняють збій усередині backend, вважайте це upstream-обмеженням сервера/моделі й подайте туди відтворюваний приклад із прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [Ендпойнти, сумісні з OpenAI](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але ніхто не відповідає, перевірте маршрутизацію та політики, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте таке:

- Очікує pairing для відправників DM.
- Перевірка згадок у групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → групове повідомлення ігнорується, доки не буде згадки.
- `pairing request` → відправника потрібно схвалити.
- `blocked` / `allowlist` → відправник/канал був відфільтрований політикою.

Пов’язане:

- [Усунення проблем каналу](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Сполучення](/uk/channels/pairing)

## Підключення панелі керування / UI control

Коли dashboard/control UI не може підключитися, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте таке:

- Правильні probe URL і dashboard URL.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Ознаки підключення / автентифікації">
    - `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з browser origin не на loopback без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або застарілу часову мітку) для поточного рукостискання.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із pairing-токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають запитаний ними набір scope.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як limiter зафіксує збій. Тому дві хибні одночасні повторні спроби від того самого клієнта можуть показати `retry later` на другій спробі замість двох звичайних невідповідностей.
    - `too many failed authentication attempts (retry later)` від loopback-клієнта з browser origin → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий контейнер лімітів.
    - повторювані `unauthorized` після цієї повторної спроби → розходження shared token/device token; за потреби оновіть конфігурацію токена і повторно схваліть/ротуйте токен пристрою.
    - `gateway connect failed:` → неправильний цільовий host/port/url.
  </Accordion>
</AccordionGroup>

### Швидка мапа кодів деталей автентифікації

Використовуйте `error.details.code` із невдалого відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                              | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, а потім вставте його в налаштування Control UI.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації Gateway.                                                                                                                                   | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scope; виклики з явним `deviceToken` / `scopes` зберігають запитані scope. Якщо проблема лишається, виконайте [контрольний список відновлення при розходженні токенів](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для пристрою застарів або був відкликаний.                                                                                                                                   | Ротуйте/повторно схваліть токен пристрою за допомогою [devices CLI](/uk/cli/devices), а потім підключіться знову.                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, якщо вони присутні. | Схваліть очікувальний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Для оновлень scope/ролі використовується той самий потік після того, як ви переглянете запитаний доступ.                                                                         |

<Note>
Прямі loopback backend RPC, автентифіковані спільним токеном/паролем Gateway, не повинні залежати від базового набору scope сполученого пристрою в CLI. Якщо subagents або інші внутрішні виклики все ще падають із `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примушує явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції auth v2 пристроїв:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте його:

<Steps>
  <Step title="Дочекайтеся connect.challenge">
    Клієнт чекає на `connect.challenge`, виданий Gateway.
  </Step>
  <Step title="Підпишіть payload">
    Клієнт підписує payload, прив’язаний до challenge.
  </Step>
  <Step title="Надішліть nonce пристрою">
    Клієнт надсилає `connect.params.device.nonce` із тим самим challenge nonce.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхиляється:

- сесії токена сполученого пристрою можуть керувати лише **власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті operator scope, які сесія виклику вже має

Пов’язане:

- [Конфігурація](/uk/gateway/configuration) (режими автентифікації Gateway)
- [Control UI](/uk/web/control-ui)
- [Пристрої](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth)

## Служба Gateway не запущена

Використовуйте це, коли службу встановлено, але процес не лишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також перевіряє служби на системному рівні
```

Шукайте таке:

- `Runtime: stopped` із підказками про завершення.
- Невідповідність конфігурації служби (`Config (cli)` проти `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові встановлення launchd/systemd/schtasks при використанні `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: встановіть `gateway.mode="local"` у своїй конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб знову записати очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, шлях конфігурації за замовчуванням — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації Gateway (токен/пароль або trusted-proxy, де налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні одиниці launchd/systemd/schtasks. У більшості конфігурацій слід тримати один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Фонове виконання та інструмент процесу](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню відому справну конфігурацію

Використовуйте це, коли Gateway запускається, але журнали повідомляють, що він відновив `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Шукайте таке:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Файл із часовою міткою `openclaw.json.clobbered.*` поруч з активною конфігурацією
- Системну подію головного агента, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої перевіреної справної копії.
    - Наступний хід головного агента отримує попередження не переписувати відхилену конфігурацію всліпу.
    - Якщо всі проблеми валідації були в межах `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні збої плагіна лишаються явними, а не пов’язані користувацькі налаштування зберігаються в активній конфігурації.
  </Accordion>
  <Accordion title="Перевірка та виправлення">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Поширені ознаки">
    - існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
    - існує `.rejected.*` → запис конфігурації, ініційований OpenClaw, не пройшов перевірки схеми або clobber перед комітом.
    - `Config write rejected:` → запис намагався прибрати обов’язкову форму, різко зменшити файл або зберегти невалідну конфігурацію.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було розпізнано як clobbered, бо він втратив поля або розмір порівняно з останньою відомою справною резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив редаговані заповнювачі секретів, як-от `***`.
  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Залиште відновлену активну конфігурацію, якщо вона правильна.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
    3. Запустіть `openclaw config validate` перед перезапуском.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Config](/uk/cli/config)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Конфігурація: сувора валідація](/uk/gateway/configuration#strict-validation)
- [Doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно показує блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження SSH fallback, кількох Gateway, відсутніх scope або нерозв’язаних auth ref.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисну конфігурацію з кількома Gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежено scope; виконайте pairing ідентичності пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним доступом оператора.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → матеріал автентифікації був недоступний у цьому шляху команди для цільової системи, що не вдалася.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька Gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключений, але повідомлення не проходять

Якщо стан каналу — підключено, але потік повідомлень не працює, зосередьтеся на політиках, дозволах і специфічних для каналу правилах доставки.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте таке:

- Політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist груп і вимоги до згадок.
- Відсутні дозволи/scopes API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується політикою згадки в групі.
- `pairing` / сліди очікувального схвалення → відправник не схвалений.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема автентифікації/дозволів каналу.

Пов’язане:

- [Усунення проблем каналу](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставив повідомлення, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте таке:

- Cron увімкнено, і присутнє наступне пробудження.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/журналів/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне завдання не має виконуватися на цьому тіку.
    - `heartbeat: unknown accountId` → недійсний ідентифікатор облікового запису для цілі доставки Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat було визначено як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для агента) має значення `block`.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Заплановані завдання: усунення проблем](/uk/automation/cron-jobs#troubleshooting)

## Node сполучено, але інструмент не працює

Якщо Node сполучено, але інструменти не працюють, ізолюйте стан переднього плану, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Шукайте таке:

- Node у мережі з очікуваними можливостями.
- Надані дозволи ОС для camera/mic/location/screen.
- Стан схвалень exec і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікує схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано через allowlist.

Пов’язане:

- [Схвалення exec](/uk/tools/exec-approvals)
- [Усунення проблем Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Інструмент браузера не працює

Використовуйте це, коли дії інструмента браузера не працюють, хоча сам Gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте таке:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Чинний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Наявність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Ознаки плагіна / виконуваного файла">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований плагін браузера виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому плагін ніколи не завантажувався.
    - `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний або неприпустимий порт.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточне встановлення Gateway не має залежності середовища виконання `playwright-core` вбудованого плагіна браузера; запустіть `openclaw doctor --fix`, а потім перезапустіть Gateway. Знімки ARIA й базові знімки сторінки все ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селекторами та експорт PDF лишаються недоступними.
  </Accordion>
  <Accordion title="Ознаки Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку перевірки браузера, увімкніть remote debugging, тримайте браузер відкритим, схваліть перший запит на підключення, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → у профілі приєднання Chrome MCP немає відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений ендпойнт CDP недосяжний із хоста Gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → для профілю лише приєднання немає досяжної цілі, або HTTP-ендпойнт відповів, але CDP WebSocket все одно не вдалося відкрити.
  </Accordion>
  <Accordion title="Ознаки елементів / знімків / вивантаження">
    - `fullPage is not supported for element screenshots` → запит на знімок екрана поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана для Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хуки вивантаження файлів Chrome MCP потребують посилань зі знімків, а не CSS-селекторів.
    - `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте по одному вивантаженню за виклик.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
    - `existing-session type does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP `existing-session`, або використовуйте керований/CDP-профіль браузера, коли потрібен власний timeout.
    - `existing-session evaluate does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP `existing-session`, або використовуйте керований/CDP-профіль браузера, коли потрібен власний timeout.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого браузера або сирого профілю CDP.
    - застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керовану сесію та звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення проблем браузера](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися і щось раптом зламалося

Більшість збоїв після оновлення — це дрейф конфігурації або суворіші значення за замовчуванням, які тепер застосовуються.

<AccordionGroup>
  <Accordion title="1. Змінилася поведінка автентифікації та перевизначення URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений екземпляр, хоча ваша локальна служба справна.
    - Явні виклики `--url` не переходять у резервний режим на збережені облікові дані.

    Поширені ознаки:

    - `gateway connect failed:` → неправильна ціль URL.
    - `unauthorized` → ендпойнт досяжний, але автентифікація неправильна.

  </Accordion>
  <Accordion title="2. Захисні обмеження прив’язки й автентифікації стали суворішими">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують чинного шляху автентифікації Gateway: спільний токен/пароль або правильно налаштоване розгортання `trusted-proxy` не на loopback.
    - Старі ключі, як-от `gateway.token`, не замінюють `gateway.auth.token`.

    Поширені ознаки:

    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації Gateway.
    - `Connectivity probe: failed` за запущеного середовища виконання → Gateway живий, але недоступний із поточними auth/url.

  </Accordion>
  <Accordion title="3. Змінився стан pairing та ідентичності пристрою">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Очікувальні схвалення пристроїв для dashboard/nodes.
    - Очікувальні схвалення DM pairing після змін політики або ідентичності.

    Поширені ознаки:

    - `device identity required` → автентифікацію пристрою не виконано.
    - `pairing required` → відправника/пристрій потрібно схвалити.

  </Accordion>
</AccordionGroup>

Якщо конфігурація служби та середовище виконання все ще не збігаються після перевірок, перевстановіть метадані служби з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [Автентифікація](/uk/gateway/authentication)
- [Фонове виконання та інструмент процесу](/uk/gateway/background-process)
- [Pairing, кероване Gateway](/uk/gateway/pairing)

## Пов’язане

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Сценарій Gateway](/uk/gateway)
