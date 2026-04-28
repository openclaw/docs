---
read_when:
    - Центр усунення несправностей спрямував вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи операційного посібника на основі симптомів із точними командами
sidebarTitle: Troubleshooting
summary: Поглиблений посібник з усунення несправностей Gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-28T11:14:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73743b962f3a44f52ac766f0a5879ed1e10bdce7e7ec7b34053e826a6e77e6f1
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ця сторінка — детальний runbook. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу потрібен швидкий потік triage.

## Драбина команд

Спочатку виконайте їх у такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки справного стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/служби.
- `openclaw channels status --probe` показує живий транспортний статус для кожного облікового запису і, де підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Split brain встановлення та захист новішої конфігурації

Використовуйте це, коли служба Gateway несподівано зупиняється після оновлення або в журналах видно, що один бінарний файл `openclaw` старіший за версію, яка востаннє записала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть інспектувати конфігурацію, записану новішим OpenClaw, але мутації процесів і служб відмовляються продовжувати роботу зі старішого бінарного файлу. Заблоковані дії охоплюють запуск, зупинку, перезапуск, видалення служби Gateway, примусове перевстановлення служби, запуск Gateway у режимі служби та очищення портів через `gateway --force`.

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
  <Step title="Перевстановіть службу Gateway">
    Перевстановіть потрібну службу Gateway з новішого встановлення:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Видаліть застарілі wrapper-и">
    Видаліть застарілий системний пакет або старі записи wrapper-ів, які все ще вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного downgrade або аварійного відновлення задайте `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залиште це незаданим.
</Warning>

## Для довгого контексту Anthropic 429 вимагає додаткового використання

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити падають лише в довгих сесіях/запусках моделей, яким потрібен beta-шлях 1M.

Варіанти виправлення:

<Steps>
  <Step title="Вимкніть context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного контекстного вікна.
  </Step>
  <Step title="Використайте придатні облікові дані">
    Використайте облікові дані Anthropic, які придатні для запитів із довгим контекстом, або перейдіть на API-ключ Anthropic.
  </Step>
  <Step title="Налаштуйте резервні моделі">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язано:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний backend проходить прямі probe-и, але запуски agent падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- крихітні прямі виклики `/v1/chat/completions` працюють
- Запуски моделей OpenClaw падають лише на звичайних ходах agent

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте таке:

- прямі крихітні виклики успішні, але запуски OpenClaw падають лише на більших prompt-ах
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим bare model id
- помилки backend про те, що `messages[].content` очікує рядок
- переривчасті попередження `incomplete turn detected ... stopReason=stop payloads=0` з OpenAI-сумісним локальним backend
- аварійні падіння backend, які з’являються лише з більшими кількостями prompt-token або повними runtime prompt-ами agent

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `model_not_found` з локальним сервером у стилі MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` має значення `"openai-completions"` для backend-ів `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є bare provider-local id. Виберіть його з префіксом provider один раз, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; залиште запис каталогу як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend відхиляє структуровані частини вмісту Chat Completions. Виправлення: задайте `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend завершив запит Chat Completions, але не повернув видимого для користувача тексту assistant для цього ходу. OpenClaw один раз повторює replay-safe порожні OpenAI-сумісні ходи; сталі збої зазвичай означають, що backend видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - прямі крихітні запити успішні, але запуски OpenClaw agent падають через аварії backend/моделі (наприклад Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, уже правильний; backend падає на більшій формі prompt-а agent-runtime.
    - збої зменшуються після вимкнення tools, але не зникають → схеми tools були частиною навантаження, але решта проблеми все ще в upstream ємності моделі/сервера або в помилці backend.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Задайте `compat.requiresStringContent: true` для backend-ів Chat Completions, які підтримують лише рядки.
    2. Задайте `compat.supportsTools: false` для моделей/backend-ів, які не можуть надійно обробляти поверхню схем tools OpenClaw.
    3. Зменште тиск prompt-а там, де можливо: менший bootstrap робочого простору, коротша історія сесії, легша локальна модель або backend із сильнішою підтримкою довгого контексту.
    4. Якщо крихітні прямі запити й далі проходять, а ходи OpenClaw agent усе ще падають усередині backend, трактуйте це як upstream обмеження сервера/моделі та подайте туди repro з прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язано:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але нічого не відповідає, перевірте routing і policy, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте таке:

- Pairing очікує для відправників DM.
- Обмеження згадування в групах (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені сигнатури:

- `drop guild message (mention required` → групове повідомлення ігнорується до згадування.
- `pairing request` → відправник потребує схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано policy.

Пов’язано:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Pairing](/uk/channels/pairing)

## Підключення dashboard control UI

Коли dashboard/control UI не підключається, перевірте URL, режим auth і припущення щодо secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте таке:

- Правильний probe URL і dashboard URL.
- Невідповідність режиму auth/token між client і gateway.
- Використання HTTP там, де потрібна device identity.

<AccordionGroup>
  <Accordion title="Сигнатури підключення / auth">
    - `device identity required` → non-secure context або відсутній device auth.
    - `origin not allowed` → browser `Origin` не в `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з non-loopback browser origin без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → client не завершує challenge-based device auth flow (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client підписав неправильний payload (або застарілий timestamp) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → client може виконати одну trusted retry із cached device token.
    - Ця cached-token retry повторно використовує cached scope set, збережений із paired device token. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають свій запитаний scope set.
    - Поза цим retry path пріоритет connect auth такий: спочатку явний shared token/password, потім явний `deviceToken`, потім stored device token, потім bootstrap token.
    - На async шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як limiter записує failure. Тому дві погані одночасні retry з того самого client можуть показати `retry later` на другій спробі замість двох звичайних mismatch.
    - `too many failed authentication attempts (retry later)` від browser-origin loopback client → повторні збої з того самого normalized `Origin` тимчасово locked out; інший localhost origin використовує окремий bucket.
    - повторні `unauthorized` після цієї retry → drift shared token/device token; оновіть конфігурацію token і за потреби повторно approve/rotate device token.
    - `gateway connect failed:` → неправильний target host/port/url.

  </Accordion>
</AccordionGroup>

### Коротка мапа detail codes auth

Використайте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Детальний код                | Значення                                                                                                                                                                                     | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                             | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів панелі керування: `openclaw config get gateway.auth.token`, потім вставте його в налаштування Control UI.                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації Gateway.                                                                                                                                  | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені затверджені області доступу; виклики з явними `deviceToken` / `scopes` зберігають запитані області доступу. Якщо помилка не зникає, виконайте [контрольний список відновлення після розсинхронізації токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для окремого пристрою застарів або відкликаний.                                                                                                                             | Ротуйте/повторно затвердьте токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), потім під’єднайтеся знову.                                                                                                                                                                      |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує затвердження. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, коли вони є. | Затвердьте запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення області доступу/ролі використовують той самий процес після перегляду запитаного доступу.                                                                                 |

<Note>
Прямі RPC бекенду через loopback, автентифіковані спільним токеном/паролем Gateway, не мають залежати від базового набору областей доступу спарених пристроїв CLI. Якщо підагентам або іншим внутрішнім викликам і далі не вдається виконатися з `scope-upgrade`, перевірте, що викликач використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примусово задає явний `deviceIdentity` або токен пристрою.
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
    Клієнт надсилає `connect.params.device.nonce` з тим самим nonce challenge.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` несподівано відхилено:

- сеанси токена спареного пристрою можуть керувати лише **власним** пристроєм, якщо викликач також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише операторські області доступу, які вже має сеанс викликача

Пов’язане:

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

- `Runtime: stopped` з підказками щодо коду виходу.
- Невідповідність конфігурації сервісу (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки з очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або файл конфігурації було перезаписано й він утратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб повторно записати очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, стандартний шлях конфігурації: `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації Gateway (токен/пароль або довірений проксі, де його налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні юніти launchd/systemd/schtasks. Більшість налаштувань мають використовувати один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочий простір. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → існує системний юніт systemd, тоді як сервіс рівня користувача відсутній. Видаліть або вимкніть дублікат, перш ніж дозволяти doctor встановити користувацький сервіс, або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо системний юніт є потрібним супервізором.
    - `Gateway service port does not match current gateway config` → установлений супервізор і далі фіксує старий `--port`. Запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, потім перезапустіть сервіс Gateway.

  </Accordion>
</AccordionGroup>

Пов’язане:

- [Фонове виконання та інструмент процесів](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню справну конфігурацію

Використовуйте це, коли Gateway запускається, але журнали кажуть, що він відновив `openclaw.json`.

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
- файл `openclaw.json.clobbered.*` з позначкою часу поряд з активною конфігурацією
- системну подію головного агента, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилена конфігурація не пройшла перевірку під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої валідованої останньої справної копії.
    - Наступний хід головного агента отримує попередження не переписувати відхилену конфігурацію наосліп.
    - Якщо всі проблеми перевірки були в `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні збої Plugin залишаються помітними, тоді як непов’язані користувацькі налаштування залишаються в активній конфігурації.

  </Accordion>
  <Accordion title="Перевірте та виправте">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Поширені ознаки">
    - `.clobbered.*` існує → зовнішню пряму правку або читання під час запуску було відновлено.
    - `.rejected.*` існує → запис конфігурації, який належить OpenClaw, не пройшов перевірку схеми або перевірки на clobber перед комітом.
    - `Config write rejected:` → запис намагався вилучити обов’язкову структуру, різко зменшити файл або зберегти недійсну конфігурацію.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → запуск вважав поточний файл перезаписаним, бо він утратив поля або розмір порівняно з останньою справною резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив відредаговані заповнювачі секретів, як-от `***`.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Залиште відновлену активну конфігурацію, якщо вона правильна.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, потім застосуйте їх за допомогою `openclaw config set` або `config.patch`.
    3. Запустіть `openclaw config validate` перед перезапуском.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Config](/uk/cli/config)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Конфігурація: строга перевірка](/uk/gateway/configuration#strict-validation)
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
- Чи попередження стосується резервного SSH, кількох Gateway, відсутніх областей доступу або нерозв’язаних посилань автентифікації.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіло більше ніж одна ціль. Зазвичай це означає навмисне налаштування кількох Gateway або застарілі/дубльовані слухачі.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але detail RPC обмежено областями доступу; спаруйте ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту ще потрібне спарення/затвердження перед звичайним операторським доступом.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → матеріал автентифікації був недоступний у цьому шляху команди для цілі, що не спрацювала.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька Gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал під’єднано, але повідомлення не проходять

Якщо стан каналу під’єднаний, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставлення, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте:

- політику DM (`pairing`, `allowlist`, `open`, `disabled`).
- allowlist групи й вимоги щодо згадки.
- відсутні дозволи/області доступу API каналу.

Поширені ознаки:

- `mention required` → повідомлення проігноровано політикою згадок групи.
- `pairing` / сліди очікування затвердження → відправника не затверджено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема автентифікації/дозволів каналу.

Пов’язане:

- [Усунення несправностей каналу](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставлення Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставив повідомлення, спочатку перевірте стан планувальника, а потім ціль доставки.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте:

- Cron увімкнено, і наступне пробудження присутнє.
- Статус історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
    - `cron: timer tick failed` → збій тику планувальника; перевірте помилки файлів/журналів/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має настати під час цього тику.
    - `heartbeat: unknown accountId` → недійсний ідентифікатор облікового запису для цілі доставки Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat розпізнано як DM-призначення, коли `agents.defaults.heartbeat.directPolicy` (або перевизначення для агента) встановлено на `block`.

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
- Дозволи ОС для камери/мікрофона/геолокації/екрана.
- Стан схвалень exec і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команда заблокована allowlist.

Пов’язано:

- [Схвалення exec](/uk/tools/exec-approvals)
- [Усунення несправностей Node](/uk/nodes/troubleshooting)
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

Шукайте:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Дійсний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Наявність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Ознаки Plugin / виконуваного файлу">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований browser plugin виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, коли `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
    - `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, як-от `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний або позадіапазонний порт.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточна інсталяція Gateway не має runtime-залежності `playwright-core` вбудованого browser plugin; запустіть `openclaw doctor --fix`, а потім перезапустіть Gateway. Знімки ARIA та базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селектором і експорт PDF залишаються недоступними.

  </Accordion>
  <Accordion title="Ознаки Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку інспектування браузера, увімкніть віддалене налагодження, тримайте браузер відкритим, схваліть перший запит на під’єднання, а потім повторіть спробу. Якщо стан входу не потрібен, надайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль під’єднання Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з хоста Gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для під’єднання не має досяжної цілі, або HTTP-кінцева точка відповіла, але CDP WebSocket усе одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Ознаки елемента / знімка / завантаження">
    - `fullPage is not supported for element screenshots` → запит знімка поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам завантаження Chrome MCP потрібні посилання зі знімка, а не CSS-селектори.
    - `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення таймауту.
    - `existing-session type does not support timeoutMs overrides.` → пропустіть `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використайте керований/CDP-профіль браузера, коли потрібен власний таймаут.
    - `existing-session evaluate does not support timeoutMs overrides.` → пропустіть `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використайте керований/CDP-профіль браузера, коли потрібен власний таймаут.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` все ще потребує керованого браузера або raw CDP-профілю.
    - застарілі перевизначення viewport / dark-mode / locale / offline у профілях лише для під’єднання або віддалених CDP-профілях → запустіть `openclaw browser stop --browser-profile <name>`, щоб закрити активний сеанс керування й звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення несправностей браузера в Linux](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися, і щось раптово зламалося

Більшість збоїв після оновлення спричинені дрейфом конфігурації або тим, що тепер застосовуються суворіші типові значення.

<AccordionGroup>
  <Accordion title="1. Поведінка перевизначення автентифікації та URL змінилася">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть націлюватися на віддалений Gateway, тоді як ваш локальний сервіс справний.
    - Явні виклики `--url` не повертаються до збережених облікових даних.

    Поширені ознаки:

    - `gateway connect failed:` → неправильна ціль URL.
    - `unauthorized` → кінцева точка досяжна, але автентифікація неправильна.

  </Accordion>
  <Accordion title="2. Обмеження bind і auth стали суворішими">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Bind не через loopback (`lan`, `tailnet`, `custom`) потребує дійсного шляху автентифікації Gateway: автентифікації спільним токеном/паролем або правильно налаштованого розгортання non-loopback `trusted-proxy`.
    - Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

    Поширені ознаки:

    - `refusing to bind gateway ... without auth` → bind не через loopback без дійсного шляху автентифікації Gateway.
    - `Connectivity probe: failed`, коли runtime запущений → Gateway живий, але недоступний з поточними auth/url.

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

    Поширені ознаки:

    - `device identity required` → автентифікацію пристрою не задоволено.
    - `pairing required` → відправника/пристрій має бути схвалено.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу й runtime усе ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого профілю/каталогу стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язано:

- [Автентифікація](/uk/gateway/authentication)
- [Фоновий exec та інструмент процесів](/uk/gateway/background-process)
- [Спарювання, яким володіє Gateway](/uk/gateway/pairing)

## Пов’язано

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Runbook Gateway](/uk/gateway)
