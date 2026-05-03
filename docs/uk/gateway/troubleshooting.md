---
read_when:
    - Центр усунення несправностей скерував вас сюди для глибшої діагностики
    - Потрібні стабільні розділи операційного посібника на основі симптомів із точними командами
sidebarTitle: Troubleshooting
summary: Поглиблений регламент усунення несправностей для Gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-05-03T17:12:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ця сторінка — докладний runbook. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу потрібен швидкий потік тріажу.

## Драбина команд

Спершу виконайте ці команди в такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації чи служби.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису і, де підтримується, результати проби/аудиту, як-от `works` або `audit ok`.

## Split brain-встановлення й захист від новішої конфігурації

Використовуйте це, коли служба Gateway несподівано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записувала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть перевіряти конфігурацію, записану новішим OpenClaw, але мутації процесів і служб відмовляються продовжувати роботу зі старішого бінарного файла. Заблоковані дії включають запуск, зупинку, перезапуск, видалення служби Gateway, примусове перевстановлення служби, запуск Gateway у режимі служби та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Виправте PATH">
    Виправте `PATH`, щоб `openclaw` указував на новіше встановлення, а потім повторно виконайте дію.
  </Step>
  <Step title="Перевстановіть службу Gateway">
    Перевстановіть потрібну службу Gateway із новішого встановлення:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Видаліть застарілі обгортки">
    Видаліть застарілі записи системного пакета або старої обгортки, які досі вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного відкату версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залиште це значення невстановленим.
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
- Запити падають лише в довгих сесіях/запусках моделі, яким потрібен beta-шлях 1M.

Варіанти виправлення:

<Steps>
  <Step title="Вимкніть context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного контекстного вікна.
  </Step>
  <Step title="Використайте придатні облікові дані">
    Використайте облікові дані Anthropic, придатні для запитів із довгим контекстом, або перейдіть на API-ключ Anthropic.
  </Step>
  <Step title="Налаштуйте резервні моделі">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі проби, але запуски агента падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- крихітні прямі виклики `/v1/chat/completions` працюють
- Запуски моделей OpenClaw падають лише на звичайних ходах агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте:

- прямі крихітні виклики успішні, але запуски OpenClaw падають лише на більших промптах
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим простим ідентифікатором моделі
- помилки бекенду про те, що `messages[].content` очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з OpenAI-сумісним локальним бекендом
- падіння бекенду, які з’являються лише з більшою кількістю prompt-токенів або повними промптами runtime агента

<AccordionGroup>
  <Accordion title="Типові ознаки">
    - `model_not_found` із локальним сервером у стилі MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` є `"openai-completions"` для бекендів `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є простим локальним ідентифікатором провайдера. Виберіть його один раз із префіксом провайдера, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; запис каталогу залиште як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → бекенд відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → бекенд завершив запит Chat Completions, але не повернув видимого користувачу тексту асистента для цього ходу. OpenClaw один раз повторює replay-safe порожні OpenAI-сумісні ходи; сталі збої зазвичай означають, що бекенд видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - прямі крихітні запити успішні, але запуски агента OpenClaw падають через аварії бекенду/моделі (наприклад Gemma в деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, уже правильний; бекенд падає на більшій формі промпта runtime агента.
    - збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів були частиною навантаження, але залишкова проблема все ще в місткості upstream-моделі/сервера або помилці бекенду.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Установіть `compat.requiresStringContent: true` для бекендів Chat Completions, які приймають лише рядки.
    2. Установіть `compat.supportsTools: false` для моделей/бекендів, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
    3. За можливості зменште навантаження промпта: менший bootstrap робочої області, коротша історія сесії, легша локальна модель або бекенд із сильнішою підтримкою довгого контексту.
    4. Якщо крихітні прямі запити й далі проходять, а ходи агента OpenClaw досі падають усередині бекенду, розглядайте це як upstream-обмеження сервера/моделі й подайте туди відтворення з прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але нічого не відповідає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте:

- Очікуване сполучення для відправників DM.
- Обмеження згадками в групах (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Типові ознаки:

- `drop guild message (mention required` → групове повідомлення ігнорується до згадки.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Сполучення](/uk/channels/pairing)

## Підключення dashboard control UI

Коли dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо захищеного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте:

- Правильний URL проби та URL dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Ознаки підключення / автентифікації">
    - `device identity required` → незахищений контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → браузерний `Origin` відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з не-loopback походження браузера без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або застарілу часову мітку) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом зі сполученим токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають запитаний набір scope.
    - За межами цього шляху повторної спроби пріоритет автентифікації connect такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як обмежувач записує збій. Тому дві погані одночасні повторні спроби від того самого клієнта можуть показати `retry later` на другій спробі замість двох простих невідповідностей.
    - `too many failed authentication attempts (retry later)` від browser-origin loopback-клієнта → повторні збої від того самого нормалізованого `Origin` тимчасово заблоковані; інше localhost-походження використовує окремий bucket.
    - повторні `unauthorized` після цієї повторної спроби → розходження спільного токена/токена пристрою; оновіть конфігурацію токена й за потреби повторно схваліть/ротируйте токен пристрою.
    - `gateway connect failed:` → неправильний хост/порт/url-ціль.

  </Accordion>
</AccordionGroup>

### Швидка мапа detail-кодів автентифікації

Використайте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталі                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав потрібний спільний токен.                                                                                                                                                 | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте в налаштування Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації Gateway.                                                                                                                                               | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені області доступу; явні виклики з `deviceToken` / `scopes` зберігають запитані області доступу. Якщо помилка не зникає, виконайте [контрольний список відновлення після розсинхронізації токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для окремого пристрою застарів або був відкликаний.                                                                                                                                                 | Ротуйте/повторно схваліть токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), потім підключіться знову.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, коли вони присутні. | Схваліть очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення областей доступу/ролей використовують той самий потік після перегляду запитаного доступу.                                                                                                               |

<Note>
Прямі loopback RPC бекенду, автентифіковані спільним токеном/паролем Gateway, не повинні залежати від базової лінії областей доступу сполученого пристрою CLI. Якщо subagents або інші внутрішні виклики все ще завершуються помилкою `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примусово задає явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції автентифікації пристроїв v2:

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
    Клієнт надсилає `connect.params.device.nonce` з тим самим challenge nonce.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` несподівано відхилено:

- сесії з токеном сполученого пристрою можуть керувати лише **своїм власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише операторські області доступу, які вже має сесія виклику

Пов’язано:

- [Конфігурація](/uk/gateway/configuration) (режими автентифікації Gateway)
- [Control UI](/uk/web/control-ui)
- [Пристрої](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth)

## Сервіс Gateway не запущено

Використовуйте це, коли сервіс установлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Шукайте:

- `Runtime: stopped` із підказками щодо виходу.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або файл конфігурації було перезаписано й він утратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у своїй конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб повторно проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях конфігурації: `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації Gateway (токен/пароль або trusted-proxy, де налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні юніти launchd/systemd/schtasks. Більшість налаштувань має тримати один Gateway на машину; якщо вам потрібно більше ніж один, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → існує системний юніт systemd, тоді як сервіс рівня користувача відсутній. Видаліть або вимкніть дублікат перед тим, як дозволити doctor установити користувацький сервіс, або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо системний юніт є потрібним supervisor.
    - `Gateway service port does not match current gateway config` → установлений supervisor усе ще фіксує старий `--port`. Запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, потім перезапустіть сервіс Gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Фонове виконання та process tool](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відхилив недійсну конфігурацію

Використовуйте це, коли запуск Gateway завершується помилкою `Invalid config` або журнали гарячого перезавантаження кажуть,
що недійсну зміну пропущено.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Шукайте:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Файл `openclaw.json.rejected.*` із позначкою часу поруч з активною конфігурацією
- Файл `openclaw.json.clobbered.*` із позначкою часу, якщо `doctor --fix` відремонтував зламане пряме редагування

<AccordionGroup>
  <Accordion title="Що сталося">
    - Конфігурація не пройшла валідацію під час запуску, гарячого перезавантаження або запису, яким володіє OpenClaw.
    - Запуск Gateway завершується закрито замість переписування `openclaw.json`.
    - Гаряче перезавантаження пропускає недійсні зовнішні редагування та залишає поточну runtime-конфігурацію активною.
    - Записи, якими володіє OpenClaw, відхиляють недійсні/руйнівні payload перед commit і зберігають `.rejected.*`.
    - `openclaw doctor --fix` володіє ремонтом. Він може видалити не-JSON префікси або відновити останню відому справну копію, зберігаючи відхилений payload як `.clobbered.*`.

  </Accordion>
  <Accordion title="Перевірка та ремонт">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Поширені сигнатури">
    - `.clobbered.*` існує → doctor зберіг зламане зовнішнє редагування під час ремонту активної конфігурації.
    - `.rejected.*` існує → запис конфігурації, яким володіє OpenClaw, не пройшов перевірки схеми або clobber перед commit.
    - `Config write rejected:` → запис намагався прибрати потрібну структуру, різко зменшити файл або зберегти недійсну конфігурацію.
    - `config reload skipped (invalid config):` → пряме редагування не пройшло валідацію та було проігнороване запущеним Gateway.
    - `Invalid config at ...` → запуск завершився помилкою до завантаження сервісів Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → запис, яким володіє OpenClaw, було відхилено, бо він утратив поля або розмір порівняно з останньою відомою справною резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив замасковані placeholders секретів, як-от `***`.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Запустіть `openclaw doctor --fix`, щоб doctor відремонтував конфігурацію з префіксом/clobbered або відновив останню відому справну.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, потім застосуйте їх за допомогою `openclaw config set` або `config.patch`.
    3. Запустіть `openclaw config validate` перед перезапуском.
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
- Чи стосується попередження fallback SSH, кількох Gateway, відсутніх областей доступу або нерозв’язаних посилань автентифікації.

Поширені сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіло більше ніж одна ціль. Зазвичай це означає навмисне налаштування з кількома Gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але detail RPC обмежений областями доступу; сполучіть ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → підключення спрацювало, але повний набір діагностичних RPC перевищив час очікування або завершився помилкою. Розглядайте це як досяжний Gateway із деградованою діагностикою; порівняйте `connect.ok` і `connect.rpcOk` у виводі `--json`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне сполучення/схвалення перед звичайним операторським доступом.
- нерозв’язаний текст попередження SecretRef `gateway.auth.*` / `gateway.remote.*` → матеріал автентифікації був недоступний у цьому шляху команди для невдалої цілі.

Пов’язано:

- [Gateway](/uk/cli/gateway)
- [Кілька Gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, повідомлення не надходять

Якщо стан каналу підключено, але потік повідомлень не працює, зосередьтеся на політиках, дозволах і правилах доставки, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist груп і вимоги щодо згадок.
- Відсутні дозволи/області доступу API каналу.

Поширені сигнатури:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- `pairing` / трасування очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема автентифікації/дозволів каналу.

Пов’язано:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не виконав доставку, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте:

- Cron увімкнено, і наявне наступне пробудження.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → збій такту планувальника; перевірте помилки файлів/журналів/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися на цьому такті.
    - `heartbeat: unknown accountId` → недійсний ідентифікатор облікового запису для цілі доставки Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначено як призначення в стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для агента) встановлено в `block`.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Заплановані завдання: усунення несправностей](/uk/automation/cron-jobs#troubleshooting)

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
- Схвалення виконання й стан allowlist.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення виконання.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язано:

- [Схвалення виконання](/uk/tools/exec-approvals)
- [Усунення несправностей Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Не працює інструмент браузера

Використовуйте це, коли дії інструмента браузера не працюють, хоча сам Gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте:

- Чи встановлено `plugins.allow` і чи містить воно `browser`.
- Дійсний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Наявність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Сигнатури Plugin / виконуваного файлу">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований Plugin браузера виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
    - `Failed to start Chrome CDP on port` → процес браузера не вдалося запустити.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштована CDP URL-адреса використовує непідтримувану схему, як-от `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштована CDP URL-адреса має неправильний порт або порт поза допустимим діапазоном.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → у поточному встановленні Gateway бракує основної залежності середовища виконання браузера; перевстановіть або оновіть OpenClaw, а потім перезапустіть Gateway. ARIA-знімки й базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селектором і експорт PDF залишаються недоступними.

  </Accordion>
  <Accordion title="Сигнатури Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку інспектування браузера, увімкніть віддалене налагодження, тримайте браузер відкритим, схваліть перший запит на під’єднання, а потім повторіть спробу. Якщо стан входу не потрібен, надайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль під’єднання Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена CDP-крапка недосяжна з хоста Gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для під’єднання не має досяжної цілі, або HTTP-крапка відповіла, але CDP WebSocket все одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Сигнатури елемента / знімка екрана / завантаження">
    - `fullPage is not supported for element screenshots` → запит знімка екрана поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам завантаження Chrome MCP потрібні посилання зі знімка, а не CSS-селектори.
    - `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення тайм-ауту.
    - `existing-session type does not support timeoutMs overrides.` → пропустіть `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен власний тайм-аут.
    - `existing-session evaluate does not support timeoutMs overrides.` → пропустіть `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен власний тайм-аут.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або сирого CDP-профілю.
    - застарілі перевизначення viewport / темного режиму / локалі / офлайн-режиму в attach-only або віддалених CDP-профілях → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активний сеанс керування та звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися, і щось раптово зламалося

Більшість збоїв після оновлення спричинені дрейфом конфігурації або суворішими типовими параметрами, які тепер застосовуються.

<AccordionGroup>
  <Accordion title="1. Поведінка автентифікації та перевизначення URL змінилася">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть спрямовуватися на віддалений сервіс, тоді як ваш локальний сервіс працює нормально.
    - Явні виклики з `--url` не повертаються до збережених облікових даних.

    Поширені сигнатури:

    - `gateway connect failed:` → неправильна ціль URL.
    - `unauthorized` → кінцева точка досяжна, але автентифікація неправильна.

  </Accordion>
  <Accordion title="2. Обмеження прив’язування й автентифікації стали суворішими">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Прив’язування не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації Gateway: автентифікації за спільним токеном/паролем або правильно налаштованого розгортання `trusted-proxy` не через loopback.
    - Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

    Поширені сигнатури:

    - `refusing to bind gateway ... without auth` → прив’язування не до loopback без дійсного шляху автентифікації Gateway.
    - `Connectivity probe: failed`, коли середовище виконання працює → Gateway активний, але недоступний з поточною автентифікацією/URL.

  </Accordion>
  <Accordion title="3. Стан спарення та ідентичності пристрою змінився">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Очікувані схвалення пристроїв для панелі керування/nodes.
    - Очікувані схвалення спарення DM після змін політики або ідентичності.

    Поширені сигнатури:

    - `device identity required` → автентифікація пристрою не задоволена.
    - `pairing required` → відправника/пристрій потрібно схвалити.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу й середовище виконання все ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого профілю/каталогу стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язано:

- [Автентифікація](/uk/gateway/authentication)
- [Фонове виконання та інструмент процесів](/uk/gateway/background-process)
- [Спарення, кероване Gateway](/uk/gateway/pairing)

## Пов’язано

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Runbook Gateway](/uk/gateway)
