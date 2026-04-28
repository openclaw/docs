---
read_when:
    - Центр усунення проблем направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи експлуатаційного посібника, побудовані за симптомами, з точними командами
sidebarTitle: Troubleshooting
summary: Поглиблений експлуатаційний посібник з усунення проблем для Gateway, каналів, автоматизації, Nodes і браузера
title: Усунення проблем
x-i18n:
    generated_at: "2026-04-27T14:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a78c619b3a80588d09162666754f9b99cfb2454884675fb7c23bb9854bd0b27
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Ця сторінка — поглиблений експлуатаційний посібник. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете пройти швидкий потік первинної діагностики.

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
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації або сервісів.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису і, де підтримується, результати probe/audit, наприклад `works` або `audit ok`.

## Роздвоєні встановлення і захист від новішої конфігурації

Використовуйте це, коли сервіс gateway неочікувано зупиняється після оновлення або коли в журналах видно, що один двійковий файл `openclaw` старіший за версію, яка востаннє записувала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть переглядати конфігурацію, записану новішою версією OpenClaw, але зміни процесів і сервісів відмовляються продовжуватися зі старішого двійкового файла. До заблокованих дій належать запуск, зупинка, перезапуск і видалення сервісу gateway, примусове перевстановлення сервісу, запуск gateway у режимі сервісу та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Виправте PATH">
    Виправте `PATH`, щоб `openclaw` вказував на новіше встановлення, а потім повторіть дію.
  </Step>
  <Step title="Перевстановіть сервіс gateway">
    Перевстановіть потрібний сервіс gateway з новішого встановлення:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Приберіть застарілі обгортки">
    Приберіть застарілі записи системного пакета або старі записи-обгортки, які все ще вказують на старий двійковий файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного пониження версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залишайте цю змінну невстановленою.
</Warning>

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Зверніть увагу на таке:

- У вибраної моделі Anthropic Opus/Sonnet встановлено `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити завершуються помилкою лише для довгих сеансів/запусків моделі, яким потрібен шлях 1M beta.

Варіанти виправлення:

<Steps>
  <Step title="Вимкніть context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
  </Step>
  <Step title="Використайте облікові дані з потрібними правами">
    Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
  </Step>
  <Step title="Налаштуйте резервні моделі">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли Anthropic відхиляє запити з довгим контекстом.
  </Step>
</Steps>

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний backend проходить прямі probe-запити, але запуски агента завершуються помилкою

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw завершуються помилкою лише на звичайних ходах агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Зверніть увагу на таке:

- прямі малі виклики успішні, але запуски OpenClaw завершуються помилкою лише на більших prompts
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим базовим ID моделі
- помилки backend про те, що `messages[].content` має очікувати рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з локальним OpenAI-сумісним backend
- аварії backend, що виникають лише за більшої кількості токенів у prompt або з повними prompts середовища виконання агента

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `model_not_found` з локальним сервером у стилі MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` має значення `"openai-completions"` для backend `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є базовим локальним ID провайдера. Вибирайте його один раз із префіксом провайдера, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; сам запис у каталозі має залишатися як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend завершив запит Chat Completions, але не повернув видимий користувачу текст відповіді асистента для цього ходу. OpenClaw один раз повторює безпечні для відтворення порожні OpenAI-сумісні ходи; сталі збої зазвичай означають, що backend видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - прямі малі запити успішні, але запуски агентів OpenClaw завершуються аварією backend/моделі (наприклад, Gemma на деяких збірках `inferrs`) → імовірно, транспорт OpenClaw уже налаштований правильно; проблема в тому, що backend не справляється з більшим форматом prompt середовища виконання агента.
    - після вимкнення tools кількість збоїв зменшується, але вони не зникають → схеми tools були частиною навантаження, але залишкова проблема все ще пов’язана з місткістю моделі/сервера вищого рівня або з багом backend.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Встановіть `compat.requiresStringContent: true` для backend Chat Completions, що підтримують лише рядковий вміст.
    2. Встановіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти поверхню схем tools OpenClaw.
    3. Де можливо, зменште навантаження на prompt: менший bootstrap робочого простору, коротша історія сеансу, легша локальна модель або backend із кращою підтримкою довгого контексту.
    4. Якщо малі прямі запити продовжують працювати, а ходи агента OpenClaw усе ще аварійно завершуються всередині backend, розглядайте це як обмеження сервера/моделі вищого рівня й подайте туди відтворюваний приклад із прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але відповідей немає, перевірте маршрутизацію й політики, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Зверніть увагу на таке:

- Сполучення очікує на розгляд для відправників у DM.
- Обмеження згадок у групі (`requireMention`, `mentionPatterns`).
- Невідповідності списків дозволених каналів/груп.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення групи ігнорується, доки немає згадки.
- `pairing request` → відправника потрібно схвалити.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [Усунення проблем із каналами](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Сполучення](/uk/channels/pairing)

## Підключення Dashboard control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Зверніть увагу на таке:

- Правильний URL probe і URL dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Ознаки підключення / автентифікації">
    - `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з browser-origin не з local loopback без явного списку дозволених джерел).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або використав застарілу часову мітку) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
    - Це повторення з кешованим токеном використовує той самий кешований набір областей дії, збережений разом із токеном сполученого пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають свій запитаний набір областей дії.
    - Поза цим шляхом повторної спроби пріоритет автентифікації під час підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, далі збережений токен пристрою, а потім bootstrap-токен.
    - В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються ще до того, як обмежувач зафіксує збій. Тому друга одночасна хибна повторна спроба від того самого клієнта може показати `retry later` замість двох звичайних невідповідностей.
    - `too many failed authentication attempts (retry later)` від loopback-клієнта browser-origin → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інше localhost-джерело використовує окремий bucket.
    - повторюваний `unauthorized` після цієї повторної спроби → розсинхронізація спільного токена/токена пристрою; оновіть конфігурацію токена і за потреби повторно схваліть/ротуйте токен пристрою.
    - `gateway connect failed:` → неправильна ціль host/port/url.

  </Accordion>
</AccordionGroup>

### Швидка карта кодів деталей автентифікації

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталей                  | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                              | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштування Control UI.                                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації gateway.                                                                                                                                   | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені області дії; виклики з явним `deviceToken` / `scopes` зберігають запитані області дії. Якщо збій не зникає, виконайте [контрольний список відновлення при розсинхронізації токенів](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для конкретного пристрою застарів або був відкликаний.                                                                                                                      | Ротуйте або повторно схваліть токен пристрою за допомогою [CLI devices](/uk/cli/devices), а потім перепідключіться.                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на значення `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть запит, що очікує на розгляд: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Підвищення області дії/ролі використовують той самий потік після того, як ви переглянете запитуваний доступ.                                                            |

<Note>
Прямі loopback backend RPC, автентифіковані спільним токеном/паролем gateway, не повинні залежати від базового рівня областей дії сполученого пристрою в CLI. Якщо subagents або інші внутрішні виклики все ще завершуються помилкою `scope-upgrade`, перевірте, що викликач використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примушує явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо в журналах видно помилки nonce/signature, оновіть клієнт, що підключається, і перевірте його:

<Steps>
  <Step title="Дочекайтеся connect.challenge">
    Клієнт чекає на `connect.challenge`, виданий gateway.
  </Step>
  <Step title="Підпишіть payload">
    Клієнт підписує payload, прив’язаний до challenge.
  </Step>
  <Step title="Надішліть nonce пристрою">
    Клієнт надсилає `connect.params.device.nonce` з тим самим challenge nonce.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхиляється:

- сеанси з токеном сполученого пристрою можуть керувати лише **власним** пристроєм, якщо викликач також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті області дії operator, які сеанс викликача вже має

Пов’язане:

- [Конфігурація](/uk/gateway/configuration) (режими автентифікації gateway)
- [Control UI](/uk/web/control-ui)
- [Пристрої](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth)

## Сервіс Gateway не запущений

Використовуйте це, коли сервіс установлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також перевіряє сервіси на рівні системи
```

Зверніть увагу на таке:

- `Runtime: stopped` із підказками щодо коду виходу.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти портів/слухачів.
- Додаткові встановлення launchd/systemd/schtasks, якщо використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у вашій конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову записати очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації gateway (токен/пароль або trusted-proxy, якщо налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні юніти launchd/systemd/schtasks. У більшості конфігурацій на одній машині має працювати один gateway; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → існує системний юніт systemd, тоді як сервіс рівня користувача відсутній. Видаліть або вимкніть дублікат, перш ніж дозволяти doctor встановити сервіс користувача, або встановіть `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо системний юніт є запланованим супервізором.
    - `Gateway service port does not match current gateway config` → установлений супервізор усе ще фіксує старий `--port`. Виконайте `openclaw doctor --fix` або `openclaw gateway install --force`, а потім перезапустіть сервіс gateway.

  </Accordion>
</AccordionGroup>

Пов’язане:

- [Фонове виконання і process tool](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню відому справну конфігурацію

Використовуйте це, коли Gateway запускається, але в журналах сказано, що він відновив `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Зверніть увагу на таке:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Файл `openclaw.json.clobbered.*` із часовою міткою поруч з активною конфігурацією
- Системна подія main-agent, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилена конфігурація не пройшла перевірку під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої перевіреної справної копії.
    - Наступний хід main-agent отримає попередження не переписувати відхилену конфігурацію бездумно.
    - Якщо всі помилки перевірки були в межах `plugins.entries.<id>...`, OpenClaw не відновлюватиме весь файл. Локальні збої Plugin залишаються помітними, а не пов’язані з ними користувацькі налаштування лишаються в активній конфігурації.

  </Accordion>
  <Accordion title="Перевірка і виправлення">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Поширені ознаки">
    - `.clobbered.*` існує → зовнішнє пряме редагування або читання під час запуску було відновлено.
    - `.rejected.*` існує → запис конфігурації, що належить OpenClaw, не пройшов перевірки схеми або clobber-перевірки до фіксації.
    - `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було визнано пошкодженим, бо він утратив поля або розмір порівняно з останньою відомою справною резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив замасковані заповнювачі секретів, наприклад `***`.

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
- [Конфігурація: сувора перевірка](/uk/gateway/configuration#strict-validation)
- [Doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` чогось досягає, але все одно виводить блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Зверніть увагу на таке:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи стосується попередження SSH fallback, кількох gateway, відсутніх областей дії або нерозв’язаних auth ref.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіло більше однієї цілі. Зазвичай це означає навмисну конфігурацію з кількома gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення вдалося, але детальний RPC обмежено областями дії; сполучіть ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібне сполучення/схвалення перед звичайним доступом operator.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → матеріал автентифікації був недоступний у цьому шляху команди для цілі, що завершилася помилкою.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключений, але повідомлення не проходять

Якщо стан каналу — connected, але потік повідомлень не працює, зосередьтеся на політиках, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Зверніть увагу на таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Список дозволених груп і вимоги до згадок.
- Відсутні дозволи/області дії API каналу.

Поширені ознаки:

- `mention required` → повідомлення ігнорується через політику згадок у групі.
- `pairing` / сліди запитів на схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією/дозволами каналу.

Пов’язане:

- [Усунення проблем із каналами](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустилися чи не виконали доставку, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Зверніть увагу на таке:

- Cron увімкнено і наявний час наступного пробудження.
- Статус історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → збій тіку планувальника; перевірте помилки файлів/журналів/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але на цей тік жодне із завдань не підлягає виконанню.
    - `heartbeat: unknown accountId` → недійсний ID облікового запису для цілі доставки Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat була визначена як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного агента) має значення `block`.

  </Accordion>
</AccordionGroup>

Пов’язане:

- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Заплановані завдання: усунення проблем](/uk/automation/cron-jobs#troubleshooting)

## Node сполучений, але tool не працює

Якщо node сполучений, але tools не працюють, ізолюйте стан переднього плану, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Зверніть увагу на таке:

- Node онлайн з очікуваними можливостями.
- Надані дозволи ОС для камери/мікрофона/локації/екрана.
- Стан схвалень exec і списку дозволених команд.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано списком дозволених команд.

Пов’язане:

- [Схвалення exec](/uk/tools/exec-approvals)
- [Усунення проблем Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Не працює інструмент браузера

Використовуйте це, коли дії browser tool завершуються помилкою, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Зверніть увагу на таке:

- Чи встановлено `plugins.allow` і чи містить воно `browser`.
- Чинний шлях до виконуваного файла браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Ознаки Plugin / виконуваного файла">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований browser Plugin виключено через `plugins.allow`.
    - browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажувався.
    - `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний або неприпустимий порт.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні gateway відсутня залежність середовища виконання `playwright-core` для вбудованого browser Plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть gateway. Знімки ARIA і базові знімки сторінки все ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селекторами та експорт PDF залишаться недоступними.

  </Accordion>
  <Accordion title="Ознаки Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг приєднатися до вибраного каталогу даних браузера. Відкрийте сторінку inspect браузера, увімкніть віддалене налагодження, тримайте браузер відкритим, схваліть перший запит на приєднання, а потім повторіть спробу. Якщо стан входу в обліковий запис не потрібен, віддайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → для профілю приєднання Chrome MCP немає відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний з хоста gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → для профілю лише з приєднанням немає досяжної цілі, або HTTP endpoint відповів, але WebSocket CDP усе одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Ознаки element / screenshot / upload">
    - `fullPage is not supported for element screenshots` → запит на знімок екрана поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks завантаження файлів Chrome MCP потребують snapshot ref, а не CSS-селекторів.
    - `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте по одному завантаженню за виклик.
    - `existing-session dialog handling does not support timeoutMs.` → hooks діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
    - `existing-session type does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session, або використайте керований/CDP-профіль браузера, коли потрібен власний timeout.
    - `existing-session evaluate does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session, або використайте керований/CDP-профіль браузера, коли потрібен власний timeout.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або сирого профілю CDP.
    - застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або віддаленого CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активний сеанс керування і звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

  </Accordion>
</AccordionGroup>

Пов’язане:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення проблем браузера](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення спричинені дрейфом конфігурації або суворішими типовими налаштуваннями, які тепер примусово застосовуються.

<AccordionGroup>
  <Accordion title="1. Змінилася поведінка автентифікації та перевизначення URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений gateway, тоді як ваш локальний сервіс справний.
    - Явні виклики `--url` не повертаються до збережених облікових даних.

    Поширені ознаки:

    - `gateway connect failed:` → неправильна ціль URL.
    - `unauthorized` → endpoint досяжний, але автентифікація неправильна.

  </Accordion>
  <Accordion title="2. Обмеження прив’язки та автентифікації стали суворішими">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Для прив’язок не до loopback (`lan`, `tailnet`, `custom`) потрібен чинний шлях автентифікації gateway: спільний токен/пароль або правильно налаштоване розгортання `trusted-proxy` не для loopback.
    - Старі ключі, як-от `gateway.token`, не замінюють `gateway.auth.token`.

    Поширені ознаки:

    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації gateway.
    - `Connectivity probe: failed` коли середовище виконання працює → gateway живий, але недоступний із поточною автентифікацією/URL.

  </Accordion>
  <Accordion title="3. Змінився стан сполучення та ідентичності пристрою">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Запити на схвалення пристроїв, що очікують на розгляд, для dashboard/nodes.
    - Запити на схвалення DM-сполучення, що очікують на розгляд, після змін політики або ідентичності.

    Поширені ознаки:

    - `device identity required` → не виконано автентифікацію пристрою.
    - `pairing required` → відправник/пристрій має бути схвалений.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу і середовище виконання все ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [Автентифікація](/uk/gateway/authentication)
- [Фонове виконання і process tool](/uk/gateway/background-process)
- [Сполучення під керуванням Gateway](/uk/gateway/pairing)

## Пов’язане

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Експлуатаційний посібник Gateway](/uk/gateway)
