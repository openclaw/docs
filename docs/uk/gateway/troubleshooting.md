---
read_when:
    - Центр усунення несправностей скерував вас сюди для глибшої діагностики
    - Потрібні стабільні розділи інструкції з реагування на основі симптомів із точними командами
sidebarTitle: Troubleshooting
summary: Поглиблений плейбук з усунення несправностей для Gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-28T20:56:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ad4332803ad43f90e793fba71a0fce874b63cb4d4711c6a308ecfa030257cb3
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ця сторінка є детальним посібником виконання. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу потрібен швидкий процес тріажу.

## Послідовність команд

Спершу виконайте їх у такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації чи сервісу.
- `openclaw channels status --probe` показує поточний стан транспорту для кожного облікового запису, а де підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Розділені встановлення та захист від новішої конфігурації

Використовуйте це, коли сервіс Gateway несподівано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть переглядати конфігурацію, записану новішим OpenClaw, але зміни процесів і сервісів відмовляються продовжуватися зі старішого бінарного файла. Заблоковані дії включають запуск, зупинку, перезапуск, видалення сервісу Gateway, примусове перевстановлення сервісу, запуск Gateway у режимі сервісу та очищення порту через `gateway --force`.

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
  <Step title="Перевстановіть сервіс gateway">
    Перевстановіть потрібний сервіс Gateway із новішого встановлення:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Видаліть застарілі обгортки">
    Видаліть застарілий системний пакет або старі записи обгорток, які все ще вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного відкату версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залишайте це значення невстановленим.
</Warning>

## Для довгого контексту Anthropic 429 потрібне додаткове використання

Використовуйте це, коли журнали або помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити падають лише під час довгих сесій або запусків моделей, яким потрібен шлях 1M beta.

Варіанти виправлення:

<Steps>
  <Step title="Вимкніть context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного контекстного вікна.
  </Step>
  <Step title="Використайте допустимі облікові дані">
    Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
  </Step>
  <Step title="Налаштуйте резервні моделі">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язано:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі перевірки, але запуски агента не вдаються

Використовуйте це, коли:

- `curl ... /v1/models` працює
- крихітні прямі виклики `/v1/chat/completions` працюють
- запуски моделі OpenClaw не вдаються лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте таке:

- прямі крихітні виклики успішні, але запуски OpenClaw не вдаються лише на більших промптах
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим простим ідентифікатором моделі
- помилки бекенду про те, що `messages[].content` очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з OpenAI-сумісним локальним бекендом
- збої бекенду, що з’являються лише з більшими кількостями prompt-token або повними промптами середовища виконання агента

<AccordionGroup>
  <Accordion title="Типові сигнатури">
    - `model_not_found` з локальним сервером у стилі MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` є `"openai-completions"` для бекендів `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є простим локальним ідентифікатором провайдера. Виберіть його один раз із префіксом провайдера, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; залиште запис каталогу як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → бекенд відхиляє структуровані частини вмісту Chat Completions. Виправлення: установіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → бекенд завершив запит Chat Completions, але не повернув видимий користувачу текст асистента для цього ходу. OpenClaw один раз повторює replay-safe порожні OpenAI-сумісні ходи; сталі збої зазвичай означають, що бекенд видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - прямі крихітні запити успішні, але запуски агента OpenClaw падають зі збоями бекенду/моделі (наприклад, Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, вже правильний; бекенд падає на більшій формі prompt середовища виконання агента.
    - збоїв стає менше після вимкнення інструментів, але вони не зникають → схеми інструментів були частиною навантаження, але решта проблеми все ще належить до місткості висхідної моделі/сервера або помилки бекенду.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Установіть `compat.requiresStringContent: true` для бекендів Chat Completions, які підтримують лише рядки.
    2. Установіть `compat.supportsTools: false` для моделей/бекендів, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
    3. Зменште навантаження промпта, де це можливо: менший bootstrap робочого простору, коротша історія сесії, легша локальна модель або бекенд із сильнішою підтримкою довгого контексту.
    4. Якщо крихітні прямі запити й надалі проходять, а ходи агента OpenClaw усе ще падають усередині бекенду, розглядайте це як обмеження висхідного сервера/моделі й подайте туди відтворення з прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язано:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні кінцеві точки](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але нічого не відповідає, перевірте маршрутизацію та політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте таке:

- Очікується pairing для відправників DM.
- Обмеження згадок у групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Типові сигнатури:

- `drop guild message (mention required` → групове повідомлення ігнорується до згадки.
- `pairing request` → відправник потребує схвалення.
- `blocked` / `allowlist` → відправника/канал відфільтровано політикою.

Пов’язано:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Pairing](/uk/channels/pairing)

## Підключення Dashboard control UI

Коли Dashboard/control UI не підключається, перевірте URL, режим автентифікації та припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте таке:

- Правильний URL перевірки та URL dashboard.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Сигнатури підключення / автентифікації">
    - `device identity required` → небезпечний контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → браузерний `Origin` не входить до `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з не-loopback походження браузера без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based потік автентифікації пристрою (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або застарілу часову мітку) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений із paired токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають запитаний набір scope.
    - Поза цим шляхом повторної спроби пріоритет автентифікації connect такий: спершу явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються перед тим, як limiter записує збій. Тому дві погані одночасні повторні спроби від того самого клієнта можуть показати `retry later` під час другої спроби замість двох простих невідповідностей.
    - `too many failed authentication attempts (retry later)` від браузерного loopback-клієнта → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інше походження localhost використовує окремий bucket.
    - повторне `unauthorized` після цієї повторної спроби → розсинхронізація спільного токена/токена пристрою; оновіть конфігурацію токена та повторно схваліть/ротіруйте токен пристрою за потреби.
    - `gateway connect failed:` → неправильний хост/порт/ціль url.

  </Accordion>
</AccordionGroup>

### Швидка мапа кодів деталей автентифікації

Використайте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код подробиць                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                                 | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів панелі: `openclaw config get gateway.auth.token`, потім вставте його в налаштування Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації Gateway.                                                                                                                                               | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені затверджені області доступу; виклики з явним `deviceToken` / `scopes` зберігають запитані області доступу. Якщо помилка лишається, виконайте [контрольний список відновлення після розходження токенів](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен окремого пристрою застарів або відкликаний.                                                                                                                                                 | Ротуйте/повторно затвердьте токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), потім підключіться знову.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує затвердження. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, коли вони наявні. | Затвердьте запит в очікуванні: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення області доступу/ролі використовують той самий процес після перегляду запитаного доступу.                                                                                                               |

<Note>
Прямі RPC бекенду через loopback, автентифіковані спільним токеном/паролем Gateway, не мають залежати від базової області доступу спареного пристрою CLI. Якщо субагенти або інші внутрішні виклики все ще завершуються помилкою `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примушує явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції автентифікації пристроїв v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте його:

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

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхилено:

- сеанси токенів спарених пристроїв можуть керувати лише **власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише операторські області доступу, які вже має сеанс виклику

Пов’язане:

- [Конфігурація](/uk/gateway/configuration) (режими автентифікації Gateway)
- [Control UI](/uk/web/control-ui)
- [Пристрої](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth)

## Служба Gateway не працює

Використовуйте це, коли службу встановлено, але процес не утримується запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Шукайте:

- `Runtime: stopped` із підказками щодо завершення.
- Невідповідність конфігурації служби (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки з очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або файл конфігурації було перезаписано й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях конфігурації: `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації Gateway (токен/пароль або trusted-proxy, якщо налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні одиниці launchd/systemd/schtasks. Більшість налаштувань мають тримати один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → існує системна одиниця systemd, тоді як служба рівня користувача відсутня. Видаліть або вимкніть дублікат перед тим, як дозволяти doctor встановити користувацьку службу, або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо системна одиниця є очікуваним супервізором.
    - `Gateway service port does not match current gateway config` → встановлений супервізор досі фіксує старий `--port`. Запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, потім перезапустіть службу Gateway.

  </Accordion>
</AccordionGroup>

Пов’язане:

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
- Файл `openclaw.json.clobbered.*` із часовою міткою поруч з активною конфігурацією
- Системну подію main-agent, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої валідованої копії last-known-good.
    - Наступний хід main-agent отримує попередження не переписувати відхилену конфігурацію наосліп.
    - Якщо всі проблеми валідації були під `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні для Plugin збої залишаються помітними, тоді як непов’язані користувацькі налаштування лишаються в активній конфігурації.

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
    - Існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
    - Існує `.rejected.*` → запис конфігурації, яким керує OpenClaw, не пройшов перевірки схеми або перезапису перед комітом.
    - `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → запуск розцінив поточний файл як пошкоджений перезаписом, бо він втратив поля або розмір порівняно з резервною копією last-known-good.
    - `Config last-known-good promotion skipped` → кандидат містив відредаговані placeholders секретів, як-от `***`.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Залиште відновлену активну конфігурацію, якщо вона правильна.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, потім застосуйте їх через `openclaw config set` або `config.patch`.
    3. Запустіть `openclaw config validate` перед перезапуском.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Config](/uk/cli/config)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Конфігурація: строга валідація](/uk/gateway/configuration#strict-validation)
- [Doctor](/uk/gateway/doctor)

## Попередження проби Gateway

Використовуйте це, коли `openclaw gateway probe` досягає чогось, але все одно друкує блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи попередження стосується fallback SSH, кількох Gateway, відсутніх областей доступу або нерозв’язаних посилань автентифікації.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіло більше ніж одна ціль. Зазвичай це означає навмисне налаштування з кількома Gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але detail RPC обмежено областю доступу; спаруйте ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → підключення спрацювало, але повний набір діагностичних RPC перевищив час очікування або завершився помилкою. Вважайте це досяжним Gateway із погіршеною діагностикою; порівняйте `connect.ok` і `connect.rpcOk` у виводі `--json`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне спарювання/затвердження перед звичайним операторським доступом.
- нерозв’язаний текст попередження SecretRef `gateway.auth.*` / `gateway.remote.*` → матеріали автентифікації були недоступні в цьому шляху команди для цілі, що не пройшла.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька Gateway на тому самому хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, повідомлення не проходять

Якщо стан каналу підключений, але потік повідомлень зупинений, зосередьтеся на політиці, дозволах і специфічних для каналу правилах доставки.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте:

- Політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- Список дозволених груп і вимоги щодо згадок.
- Відсутні дозволи/області доступу API каналу.

Поширені ознаки:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- `pairing` / трасування очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією або дозволами каналу.

Пов’язано:

- [Усунення проблем із каналами](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставка Cron і Heartbeat

Якщо cron або heartbeat не запустився чи не доставив повідомлення, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте:

- Cron увімкнено, і наступне пробудження наявне.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
    - `cron: timer tick failed` → збій такту планувальника; перевірте помилки файлів, журналів або середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися на цьому такті.
    - `heartbeat: unknown accountId` → недійсний ідентифікатор облікового запису для цілі доставки Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat зіставлено з призначенням типу DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для окремого агента) встановлено на `block`.

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
- Надання дозволів ОС для камери, мікрофона, геолокації й екрана.
- Схвалення exec і стан allowlist.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → exec-схвалення очікується.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язано:

- [Exec-схвалення](/uk/tools/exec-approvals)
- [Усунення проблем із Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Інструмент браузера не працює

Використовуйте це, коли дії інструмента браузера не виконуються, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Дійсний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Сигнатури Plugin / виконуваного файлу">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований browser plugin виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, тоді як `browser.enabled=true` → `plugins.allow` виключає `browser`, тому plugin ніколи не завантажився.
    - `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштована CDP-URL-адреса використовує непідтримувану схему, наприклад `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштована CDP-URL-адреса має неправильний порт або порт поза діапазоном.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточне встановлення gateway не має залежності середовища виконання `playwright-core` для вбудованого browser plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть gateway. ARIA-знімки й базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селектором і експорт PDF залишаються недоступними.

  </Accordion>
  <Accordion title="Сигнатури Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP ще не зміг приєднатися до вибраної теки даних браузера. Відкрийте сторінку інспектування браузера, увімкніть віддалене налагодження, залиште браузер відкритим, схваліть перший запит на приєднання, потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена CDP-кінцева точка недосяжна з хоста gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для приєднання не має досяжної цілі, або HTTP-кінцева точка відповіла, але CDP WebSocket усе одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Сигнатури елемента / знімка екрана / завантаження">
    - `fullPage is not supported for element screenshots` → запит знімка екрана поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам завантаження Chrome MCP потрібні посилання зі знімків, а не CSS-селектори.
    - `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення тайм-ауту.
    - `existing-session type does not support timeoutMs overrides.` → опустіть `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використайте керований/CDP-профіль браузера, коли потрібен власний тайм-аут.
    - `existing-session evaluate does not support timeoutMs overrides.` → опустіть `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використайте керований/CDP-профіль браузера, коли потрібен власний тайм-аут.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або сирого CDP-профілю.
    - застарілі перевизначення viewport / dark-mode / locale / offline у профілях лише для приєднання або віддалених CDP-профілях → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування й звільнити стан емуляції Playwright/CDP без перезапуску всього gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення проблем із браузером](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися, і щось раптово зламалося

Більшість збоїв після оновлення спричинена дрейфом конфігурації або суворішими типовими значеннями, які тепер застосовуються.

<AccordionGroup>
  <Accordion title="1. Поведінка автентифікації та перевизначення URL змінилася">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на віддалений endpoint, тоді як ваш локальний сервіс справний.
    - Явні виклики `--url` не повертаються до збережених облікових даних.

    Поширені сигнатури:

    - `gateway connect failed:` → неправильна цільова URL-адреса.
    - `unauthorized` → endpoint досяжний, але автентифікація неправильна.

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

    - Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації gateway: автентифікації спільним токеном/паролем або правильно налаштованого розгортання `trusted-proxy` не до loopback.
    - Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

    Поширені сигнатури:

    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації gateway.
    - `Connectivity probe: failed`, поки середовище виконання працює → gateway активний, але недоступний із поточною автентифікацією/URL.

  </Accordion>
  <Accordion title="3. Стан pairing і ідентичності пристрою змінився">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Очікувані схвалення пристроїв для dashboard/nodes.
    - Очікувані схвалення DM pairing після змін політики або ідентичності.

    Поширені сигнатури:

    - `device identity required` → автентифікацію пристрою не задоволено.
    - `pairing required` → відправника/пристрій потрібно схвалити.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу й середовище виконання все ще не узгоджуються після перевірок, перевстановіть метадані сервісу з тієї самої теки профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язано:

- [Автентифікація](/uk/gateway/authentication)
- [Фоновий exec і інструмент процесу](/uk/gateway/background-process)
- [Pairing, яким володіє Gateway](/uk/gateway/pairing)

## Пов’язано

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Gateway runbook](/uk/gateway)
