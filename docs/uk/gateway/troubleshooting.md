---
read_when:
    - Центр усунення несправностей скерував вас сюди для глибшої діагностики
    - Потрібні стабільні розділи інструкції з реагування, побудовані за симптомами, з точними командами.
sidebarTitle: Troubleshooting
summary: Поглиблений посібник з усунення несправностей для Gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-30T21:18:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ця сторінка є докладним runbook. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу потрібен швидкий потік triage.

## Сходи команд

Спершу виконайте це, у такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації або служби.
- `openclaw channels status --probe` показує поточний статус транспорту для кожного облікового запису і, де підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Встановлення split brain і захист від новішої конфігурації

Використовуйте це, коли служба Gateway несподівано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записувала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть переглядати конфігурацію, записану новішим OpenClaw, але зміни процесів і служб відмовляються продовжувати роботу зі старішого бінарного файла. Заблоковані дії включають запуск, зупинку, перезапуск, видалення служби Gateway, примусове перевстановлення служби, запуск Gateway у режимі служби та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Виправте `PATH`, щоб `openclaw` розв’язувався до новішого встановлення, а потім повторно виконайте дію.
  </Step>
  <Step title="Reinstall the gateway service">
    Перевстановіть потрібну службу Gateway з новішого встановлення:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Видаліть застарілі записи системного пакета або старої обгортки, які все ще вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного downgrade або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залиште це невстановленим.
</Warning>

## Для довгого контексту Anthropic 429 потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити не вдаються лише в довгих сесіях/запусках моделі, яким потрібен шлях 1M beta.

Варіанти виправлення:

<Steps>
  <Step title="Disable context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного контекстного вікна.
  </Step>
  <Step title="Use an eligible credential">
    Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на API-ключ Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли Anthropic відхиляє запити з довгим контекстом.
  </Step>
</Steps>

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний backend проходить прямі probes, але запуски агента не вдаються

Використовуйте це, коли:

- `curl ... /v1/models` працює
- крихітні прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw не вдаються лише на звичайних ходах агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте:

- прямі крихітні виклики успішні, але запуски OpenClaw не вдаються лише на більших prompt
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим простим id моделі
- помилки backend про те, що `messages[].content` очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з OpenAI-сумісним локальним backend
- збої backend, які з’являються лише з більшими кількостями prompt-токенів або повними prompt runtime агента

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` з локальним сервером стилю MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` є `"openai-completions"` для backend `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є простим локальним id провайдера. Виберіть його з префіксом провайдера один раз, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; залиште запис каталогу як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend завершив запит Chat Completions, але не повернув видимий для користувача текст асистента для цього ходу. OpenClaw один раз повторює replay-safe порожні OpenAI-сумісні ходи; постійні збої зазвичай означають, що backend видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - прямі крихітні запити успішні, але запуски агентів OpenClaw не вдаються зі збоями backend/моделі (наприклад Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, вже правильний; backend не справляється з більшою формою prompt runtime агента.
    - збої зменшуються після вимкнення tools, але не зникають → схеми tools були частиною навантаження, але залишкова проблема все ще полягає в місткості upstream моделі/сервера або bug backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Встановіть `compat.requiresStringContent: true` для backend Chat Completions, які підтримують лише рядки.
    2. Встановіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти поверхню схем tools OpenClaw.
    3. Зменште навантаження prompt, де можливо: менший bootstrap робочого простору, коротша історія сесії, легша локальна модель або backend з кращою підтримкою довгого контексту.
    4. Якщо крихітні прямі запити й далі проходять, а ходи агента OpenClaw усе ще падають усередині backend, розглядайте це як обмеження upstream сервера/моделі й подайте туди repro з прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали активні, але нічого не відповідає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте:

- Pairing очікує на відправників DM.
- Обмеження згадування в групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені сигнатури:

- `drop guild message (mention required` → групове повідомлення ігнорується до згадування.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [Усунення проблем із каналами](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Pairing](/uk/channels/pairing)

## Підключення control UI панелі керування

Коли панель керування/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо захищеного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте:

- Правильний probe URL і URL панелі керування.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → незахищений контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → браузерний `Origin` не входить до `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з браузерного origin, що не є loopback, без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або застарілу timestamp) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з cached device token.
    - Ця повторна спроба з cached-token повторно використовує cached scope set, збережений із paired device token. Викликачі з явним `deviceToken` / явними `scopes` натомість зберігають свій запитаний scope set.
    - Поза цим шляхом повторної спроби пріоритет connect auth такий: спершу явний shared token/password, потім явний `deviceToken`, потім stored device token, потім bootstrap token.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як limiter записує збій. Тому дві погані одночасні повторні спроби від того самого клієнта можуть показати `retry later` на другій спробі замість двох звичайних невідповідностей.
    - `too many failed authentication attempts (retry later)` від браузерного loopback-клієнта origin → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
    - повторне `unauthorized` після цієї повторної спроби → розходження shared token/device token; оновіть конфігурацію token і за потреби повторно схваліть/оберніть device token.
    - `gateway connect failed:` → неправильний host/port/url target.

  </Accordion>
</AccordionGroup>

### Швидка мапа кодів деталей автентифікації

Використайте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталі                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав потрібний спільний токен.                                                                                                                                                 | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів панелі керування: `openclaw config get gateway.auth.token`, потім вставте в налаштування Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації Gateway.                                                                                                                                               | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені затверджені області; виклики з явними `deviceToken` / `scopes` зберігають запитані області. Якщо збій не зникає, виконайте [контрольний список відновлення після розсинхронізації токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен окремого пристрою застарів або був відкликаний.                                                                                                                                                 | Ротуйте/повторно затвердьте токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), потім підключіться повторно.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує затвердження. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, коли вони наявні. | Затвердьте запит в очікуванні: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення області/ролі використовують той самий процес після перегляду запитаного доступу.                                                                                                               |

<Note>
Прямі RPC бекенда через loopback, автентифіковані спільним токеном/паролем Gateway, не мають залежати від базового набору областей парного пристрою CLI. Якщо субагенти або інші внутрішні виклики все ще завершуються з `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примусово задає явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції автентифікації пристрою v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/підпису, оновіть клієнт, що підключається, і перевірте його:

<Steps>
  <Step title="Дочекайтеся connect.challenge">
    Клієнт чекає на виданий Gateway `connect.challenge`.
  </Step>
  <Step title="Підпишіть payload">
    Клієнт підписує payload, прив’язаний до challenge.
  </Step>
  <Step title="Надішліть nonce пристрою">
    Клієнт надсилає `connect.params.device.nonce` з тим самим nonce challenge.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхилено:

- сеанси токена парного пристрою можуть керувати лише **власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише операторські області, які сеанс виклику вже має

Пов’язано:

- [Конфігурація](/uk/gateway/configuration) (режими автентифікації Gateway)
- [Control UI](/uk/web/control-ui)
- [Пристрої](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth)

## Служба Gateway не запущена

Використовуйте це, коли службу встановлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Шукайте:

- `Runtime: stopped` з підказками щодо завершення.
- Невідповідність конфігурації служби (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові інсталяції launchd/systemd/schtasks, коли використано `--deep`.
- Підказки для очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або конфігураційний файл було перезаписано й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях конфігурації — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації Gateway (токен/пароль або довірений проксі, де налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні модулі launchd/systemd/schtasks. У більшості налаштувань слід мати один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочу область. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → системний модуль systemd існує, тоді як служба рівня користувача відсутня. Видаліть або вимкніть дублікат, перш ніж дозволити doctor встановити службу користувача, або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо системний модуль є запланованим супервізором.
    - `Gateway service port does not match current gateway config` → встановлений супервізор досі фіксує старий `--port`. Виконайте `openclaw doctor --fix` або `openclaw gateway install --force`, потім перезапустіть службу Gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Фонове виконання та інструмент процесів](/uk/gateway/background-process)
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

Шукайте:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Файл `openclaw.json.clobbered.*` з часовою позначкою поруч з активною конфігурацією
- Системну подію основного агента, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилену конфігурацію не вдалося провалідувати під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої провалідованої останньої відомої справної копії.
    - Наступний хід основного агента отримує попередження не переписувати відхилену конфігурацію наосліп.
    - Якщо всі проблеми валідації були під `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні для Plugin збої залишаються помітними, тоді як непов’язані налаштування користувача залишаються в активній конфігурації.

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
  <Accordion title="Поширені сигнатури">
    - `.clobbered.*` існує → було відновлено зовнішнє пряме редагування або читання під час запуску.
    - `.rejected.*` існує → запис конфігурації, керований OpenClaw, не пройшов перевірки схеми або clobber-перевірки перед commit.
    - `Config write rejected:` → запис намагався прибрати потрібну форму, різко зменшити файл або зберегти невалідну конфігурацію.
    - `Rejected validation details:` → журнал відновлення або сповіщення основного агента містить шлях схеми, що спричинив відновлення, наприклад `agents.defaults.execution` або `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → запуск розцінив поточний файл як перезаписаний, бо він втратив поля або розмір порівняно з останньою відомою справною резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив відредаговані placeholder секретів, як-от `***`.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Залиште відновлену активну конфігурацію, якщо вона правильна.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, потім застосуйте їх за допомогою `openclaw config set` або `config.patch`.
    3. Виконайте `openclaw config validate` перед перезапуском.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язано:

- [Config](/uk/cli/config)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Конфігурація: сувора валідація](/uk/gateway/configuration#strict-validation)
- [Doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` досягає чогось, але все одно друкує блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи попередження стосується резервного SSH, кількох Gateway, відсутніх областей або нерозв’язаних посилань автентифікації.

Поширені сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH зазнало збою, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіло більше ніж одна ціль. Зазвичай це означає навмисне налаштування кількох Gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежений областю; спаруйте ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → підключення спрацювало, але повний набір діагностичних RPC перевищив час очікування або завершився з помилкою. Розглядайте це як доступний Gateway з деградованою діагностикою; порівняйте `connect.ok` і `connect.rpcOk` у виводі `--json`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне спарювання/затвердження перед звичайним операторським доступом.
- нерозв’язаний текст попередження SecretRef `gateway.auth.*` / `gateway.remote.*` → матеріал автентифікації був недоступний у цьому шляху команди для невдалої цілі.

Пов’язано:

- [Gateway](/uk/cli/gateway)
- [Кілька Gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключений, але повідомлення не надходять

Якщо стан каналу — підключений, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Список дозволених для груп і вимоги до згадок.
- Відсутні дозволи/області API каналу.

Поширені сигнатури:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- `pairing` / трасування очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією/дозволами каналу.

Пов’язано:

- [Усунення проблем із каналами](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставився, спершу перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте:

- Cron увімкнено і присутній наступний час пробудження.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → такт планувальника не спрацював; перевірте помилки файлів/журналів/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися на цьому такті.
    - `heartbeat: unknown accountId` → недійсний ідентифікатор облікового запису для цілі доставки Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначено як призначення типу DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для окремого агента) встановлено на `block`.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Заплановані завдання: усунення проблем](/uk/automation/cron-jobs#troubleshooting)

## Node спарено, інструмент не працює

Якщо Node спарено, але інструменти не працюють, ізолюйте стан переднього плану, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Шукайте:

- Node онлайн з очікуваними можливостями.
- Надані дозволи ОС для камери/мікрофона/геолокації/екрана.
- Стан схвалень exec і списку дозволених.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано списком дозволених.

Пов’язано:

- [Схвалення exec](/uk/tools/exec-approvals)
- [Усунення проблем із Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Інструмент браузера не працює

Використовуйте це, коли дії інструмента браузера не працюють, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Дійсний шлях до виконуваного файла браузера.
- Доступність профілю CDP.
- Наявність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Сигнатури Plugin / виконуваного файла">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований plugin браузера виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, коли `browser.enabled=true` → `plugins.allow` виключає `browser`, тому plugin ніколи не завантажився.
    - `Failed to start Chrome CDP on port` → процес браузера не вдалося запустити.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, як-от `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний або позадіапазонний порт.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточна інсталяція Gateway не має залежності середовища виконання `playwright-core`, що входить до вбудованого browser plugin; запустіть `openclaw doctor --fix`, потім перезапустіть Gateway. ARIA-знімки та базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селектором і експорт PDF залишаються недоступними.

  </Accordion>
  <Accordion title="Сигнатури Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг приєднатися до вибраного каталогу даних браузера. Відкрийте сторінку інспектування браузера, увімкніть віддалене налагодження, тримайте браузер відкритим, схваліть перший запит на приєднання, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недоступна з хоста Gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для приєднання не має доступної цілі, або HTTP-кінцева точка відповіла, але CDP WebSocket усе одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Сигнатури елемента / знімка екрана / завантаження">
    - `fullPage is not supported for element screenshots` → запит знімка екрана поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам завантаження Chrome MCP потрібні посилання зі знімка, а не CSS-селектори.
    - `existing-session file uploads currently support one file at a time.` → надсилайте по одному завантаженню за виклик у профілях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення тайм-ауту.
    - `existing-session type does not support timeoutMs overrides.` → опустіть `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен власний тайм-аут.
    - `existing-session evaluate does not support timeoutMs overrides.` → опустіть `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен власний тайм-аут.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або raw CDP-профілю.
    - застарілі перевизначення viewport / темного режиму / локалі / offline у профілях attach-only або remote CDP → запустіть `openclaw browser stop --browser-profile <name>`, щоб закрити активний сеанс керування та звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення проблем із браузером](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися і щось раптово зламалося

Більшість поломок після оновлення спричинені дрейфом конфігурації або суворішими типовими налаштуваннями, які тепер застосовуються.

<AccordionGroup>
  <Accordion title="1. Поведінка автентифікації та перевизначення URL змінилася">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть спрямовуватися до віддаленого сервісу, хоча ваш локальний сервіс справний.
    - Явні виклики `--url` не повертаються до збережених облікових даних.

    Поширені сигнатури:

    - `gateway connect failed:` → неправильна ціль URL.
    - `unauthorized` → кінцева точка доступна, але автентифікація неправильна.

  </Accordion>
  <Accordion title="2. Обмеження bind і автентифікації стали суворішими">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Прив’язки не до local loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації Gateway: автентифікації спільним токеном/паролем або правильно налаштованого розгортання `trusted-proxy` не через local loopback.
    - Старі ключі, як-от `gateway.token`, не замінюють `gateway.auth.token`.

    Поширені сигнатури:

    - `refusing to bind gateway ... without auth` → прив’язка не до local loopback без дійсного шляху автентифікації Gateway.
    - `Connectivity probe: failed`, коли середовище виконання запущене → Gateway живий, але недоступний із поточними auth/url.

  </Accordion>
  <Accordion title="3. Стан спарювання та ідентичності пристрою змінився">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Очікувані схвалення пристроїв для dashboard/nodes.
    - Очікувані схвалення DM-спарювання після змін політики або ідентичності.

    Поширені сигнатури:

    - `device identity required` → автентифікацію пристрою не виконано.
    - `pairing required` → відправника/пристрій потрібно схвалити.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу й середовище виконання після перевірок усе ще не збігаються, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язано:

- [Автентифікація](/uk/gateway/authentication)
- [Фоновий exec і інструмент процесів](/uk/gateway/background-process)
- [Спарювання, кероване Gateway](/uk/gateway/pairing)

## Пов’язано

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Runbook Gateway](/uk/gateway)
