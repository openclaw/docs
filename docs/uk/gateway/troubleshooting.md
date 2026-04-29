---
read_when:
    - Центр усунення несправностей спрямував вас сюди для поглибленої діагностики
    - Вам потрібні стабільні розділи операційного посібника, орієнтовані на симптоми, з точними командами.
sidebarTitle: Troubleshooting
summary: Поглиблений посібник з усунення несправностей для Gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-29T09:12:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ця сторінка є докладним операційним посібником. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу потрібен швидкий потік діагностики.

## Командна драбина

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
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації або сервісу.
- `openclaw channels status --probe` показує активний статус транспорту для кожного облікового запису і, де підтримується, результати перевірки/аудиту, як-от `works` або `audit ok`.

## Розділені встановлення й захист від новішої конфігурації

Використовуйте це, коли сервіс Gateway несподівано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть перевіряти конфігурацію, записану новішим OpenClaw, але мутації процесів і сервісів відмовляються продовжувати роботу зі старішого бінарного файлу. Заблоковані дії включають запуск, зупинку, перезапуск, видалення сервісу Gateway, примусове перевстановлення сервісу, запуск Gateway у сервісному режимі та очищення порту `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Виправте PATH">
    Виправте `PATH`, щоб `openclaw` вказував на новіше встановлення, потім повторно виконайте дію.
  </Step>
  <Step title="Перевстановіть сервіс Gateway">
    Перевстановіть потрібний сервіс Gateway із новішого встановлення:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Видаліть застарілі обгортки">
    Видаліть застарілі системні пакети або старі записи обгорток, які все ще вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного пониження версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залишайте це значення невстановленим.
</Warning>

## Anthropic 429 вимагає додаткового використання для довгого контексту

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не мають права на використання довгого контексту.
- Запити падають лише в довгих сесіях/запусках моделі, яким потрібен шлях 1M beta.

Варіанти виправлення:

<Steps>
  <Step title="Вимкніть context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
  </Step>
  <Step title="Використайте придатні облікові дані">
    Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на API-ключ Anthropic.
  </Step>
  <Step title="Налаштуйте резервні моделі">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі перевірки, але запуски агента падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- Запуски моделей OpenClaw падають лише під час звичайних кроків агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте:

- прямі малі виклики успішні, але запуски OpenClaw падають лише на більших промптах
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим простим ідентифікатором моделі
- помилки бекенду про те, що `messages[].content` очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з OpenAI-сумісним локальним бекендом
- збої бекенду, які з’являються лише за більшої кількості токенів промпта або повних промптів середовища виконання агента

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `model_not_found` з локальним сервером у стилі MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` дорівнює `"openai-completions"` для бекендів `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є простим локальним для провайдера ідентифікатором. Виберіть його один раз із префіксом провайдера, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; запис каталогу залиште як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → бекенд відхиляє структуровані частини вмісту Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → бекенд завершив запит Chat Completions, але не повернув видимого користувачу тексту асистента для цього кроку. OpenClaw один раз повторює безпечні для відтворення порожні OpenAI-сумісні кроки; сталі збої зазвичай означають, що бекенд видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - прямі малі запити успішні, але запуски агента OpenClaw падають через збої бекенду/моделі (наприклад Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, уже налаштований правильно; бекенд падає на більшій формі промпта середовища виконання агента.
    - збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів були частиною навантаження, але решта проблеми все ще в місткості верхньорівневої моделі/сервера або в помилці бекенду.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Встановіть `compat.requiresStringContent: true` для бекендів Chat Completions, які підтримують лише рядки.
    2. Встановіть `compat.supportsTools: false` для моделей/бекендів, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
    3. Зменште навантаження промпта, де це можливо: менший початковий контекст робочої області, коротша історія сесії, легша локальна модель або бекенд із сильнішою підтримкою довгого контексту.
    4. Якщо малі прямі запити й надалі проходять, а кроки агента OpenClaw усе ще падають усередині бекенду, розглядайте це як обмеження верхньорівневого сервера/моделі й подайте туди відтворення з прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні кінцеві точки](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але ніщо не відповідає, перевірте маршрутизацію й політику, перш ніж перепідключати будь-що.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте:

- Очікування сполучення для відправників DM.
- Обмеження згадкою в групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені сигнатури:

- `drop guild message (mention required` → групове повідомлення ігнорується до згадки.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [Діагностика каналів](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Сполучення](/uk/channels/pairing)

## Підключення керівного інтерфейсу панелі керування

Коли панель керування/керівний інтерфейс не підключається, перевірте URL, режим автентифікації та припущення щодо захищеного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте:

- Правильний URL перевірки й URL панелі керування.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Сигнатури підключення / автентифікації">
    - `device identity required` → незахищений контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → браузерний `Origin` відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з браузерного джерела не через loopback без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує потік автентифікації пристрою на основі виклику (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або застарілу часову мітку) для поточного рукостискання.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір областей, збережений із токеном сполученого пристрою. Виклики з явним `deviceToken` / явними `scopes` зберігають свій запитаний набір областей.
    - Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як обмежувач зафіксує збій. Тому дві погані паралельні повторні спроби від того самого клієнта можуть показати `retry later` на другій спробі замість двох простих невідповідностей.
    - `too many failed authentication attempts (retry later)` від браузерного loopback-клієнта → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інше localhost-джерело використовує окремий bucket.
    - повторне `unauthorized` після цієї повторної спроби → розходження спільного токена/токена пристрою; оновіть конфігурацію токена й за потреби повторно схваліть/ротируйте токен пристрою.
    - `gateway connect failed:` → неправильний хост/порт/ціль URL.

  </Accordion>
</AccordionGroup>

### Швидка мапа кодів деталей автентифікації

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталі                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                                 | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштування Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з auth-токеном Gateway.                                                                                                                                               | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені затверджені scopes; явні виклики `deviceToken` / `scopes` зберігають запитані scopes. Якщо помилка не зникає, виконайте [контрольний список відновлення після розсинхронізації токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен окремого пристрою застарів або був відкликаний.                                                                                                                                                 | Ротуйте/повторно затвердьте токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), потім підключіться знову.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує затвердження. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використайте `requestId` / `remediationHint`, якщо вони наявні. | Затвердьте очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/ролі використовують той самий процес після перегляду запитаного доступу.                                                                                                               |

<Note>
Прямі RPC до backend через loopback, автентифіковані спільним токеном/паролем Gateway, не мають залежати від базового scope спареного пристрою CLI. Якщо subagents або інші внутрішні виклики все ще завершуються помилкою `scope-upgrade`, перевірте, що викликач використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примусово задає явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції автентифікації пристроїв v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/підпису, оновіть клієнт, що підключається, і перевірте його:

<Steps>
  <Step title="Дочекатися connect.challenge">
    Клієнт чекає на виданий Gateway `connect.challenge`.
  </Step>
  <Step title="Підписати payload">
    Клієнт підписує payload, прив’язаний до challenge.
  </Step>
  <Step title="Надіслати nonce пристрою">
    Клієнт надсилає `connect.params.device.nonce` з тим самим challenge nonce.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхилено:

- сесії з токеном спареного пристрою можуть керувати лише **власним** пристроєм, якщо викликач також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише операторські scopes, які вже має сесія викликача

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

- `Runtime: stopped` з підказками коду завершення.
- Невідповідність конфігурації служби (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/слухача.
- Додаткові інсталяції launchd/systemd/schtasks, коли використано `--deep`.
- Підказки з очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим Gateway не ввімкнено, або файл конфігурації було перезаписано й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у конфігурації або повторно виконайте `openclaw onboard --mode local` / `openclaw setup`, щоб відновити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях конфігурації — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації Gateway (токен/пароль або trusted-proxy, де налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні одиниці launchd/systemd/schtasks. У більшості налаштувань має бути один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/робочу область. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → існує системна одиниця systemd, тоді як служба рівня користувача відсутня. Видаліть або вимкніть дублікат, перш ніж дозволити doctor встановити користувацьку службу, або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо системна одиниця є очікуваним супервізором.
    - `Gateway service port does not match current gateway config` → встановлений супервізор усе ще фіксує старий `--port`. Виконайте `openclaw doctor --fix` або `openclaw gateway install --force`, потім перезапустіть службу Gateway.

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
- Файл `openclaw.json.clobbered.*` з часовою міткою поруч з активною конфігурацією
- Системну подію main-agent, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої валідованої last-known-good копії.
    - Наступний хід main-agent отримує попередження не переписувати відхилену конфігурацію наосліп.
    - Якщо всі проблеми валідації були під `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні збої Plugin залишаються помітними, тоді як непов’язані користувацькі налаштування залишаються в активній конфігурації.

  </Accordion>
  <Accordion title="Перевірити та виправити">
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
    - `.rejected.*` існує → запис конфігурації, ініційований OpenClaw, не пройшов схему або перевірки clobber перед комітом.
    - `Config write rejected:` → запис намагався вилучити потрібну форму, різко зменшити файл або зберегти невалідну конфігурацію.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → запуск розцінив поточний файл як перезаписаний, бо він втратив поля або розмір порівняно з last-known-good резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив відредаговані заповнювачі секретів, наприклад `***`.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Залиште відновлену активну конфігурацію, якщо вона правильна.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, потім застосуйте їх через `openclaw config set` або `config.patch`.
    3. Виконайте `openclaw config validate` перед перезапуском.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язано:

- [Config](/uk/cli/config)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Конфігурація: сувора валідація](/uk/gateway/configuration#strict-validation)
- [Doctor](/uk/gateway/doctor)

## Попередження Gateway probe

Використовуйте це, коли `openclaw gateway probe` досягає чогось, але все одно друкує блок попереджень.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте:

- `warnings[].code` і `primaryTargetId` у виводі JSON.
- Чи попередження стосується резервного SSH, кількох Gateway, відсутніх scopes або нерозв’язаних auth refs.

Поширені ознаки:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіла більш ніж одна ціль. Зазвичай це означає навмисне налаштування з кількома Gateway або застарілих/дубльованих слухачів.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежено scope; спарте ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → підключення спрацювало, але повний набір діагностичних RPC перевищив час очікування або завершився помилкою. Розглядайте це як досяжний Gateway з погіршеною діагностикою; порівняйте `connect.ok` і `connect.rpcOk` у виводі `--json`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне pairing/затвердження перед звичайним операторським доступом.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → auth-матеріал був недоступний у цьому шляху команди для невдалої цілі.

Пов’язано:

- [Gateway](/uk/cli/gateway)
- [Кілька Gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, повідомлення не проходять

Якщо стан каналу підключений, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставлення, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist груп і вимоги до згадок.
- Відсутні дозволи/scopes API каналу.

Поширені ознаки:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- `pairing` / трасування очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією/дозволами каналу.

Пов’язано:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
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

Шукайте:

- Cron увімкнено, і наступне пробудження наявне.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → збій такту планувальника; перевірте помилки файлів/логів/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки Markdown, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має бути виконане на цьому такті.
    - `heartbeat: unknown accountId` → недійсний ідентифікатор облікового запису для цілі доставки Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначено як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для окремого агента) встановлено на `block`.

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
- Стан схвалень виконання і списку дозволеного.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення виконання.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано списком дозволеного.

Пов’язано:

- [Схвалення виконання](/uk/tools/exec-approvals)
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
  <Accordion title="Сигнатури Plugin / виконуваного файлу">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований браузерний Plugin виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, коли `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
    - `Failed to start Chrome CDP on port` → процес браузера не вдалося запустити.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштована URL-адреса CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштована URL-адреса CDP має неправильний або поза межами діапазону порт.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточна інсталяція Gateway не має runtime-залежності `playwright-core` із вбудованого браузерного Plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть Gateway. Знімки ARIA та базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селектором і експорт PDF залишаються недоступними.

  </Accordion>
  <Accordion title="Сигнатури Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку інспектування браузера, увімкніть віддалене налагодження, залиште браузер відкритим, схваліть перший запит на під’єднання, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль під’єднання Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з хоста Gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для під’єднання не має досяжної цілі, або HTTP-кінцева точка відповіла, але WebSocket CDP усе одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Сигнатури елемента / знімка екрана / завантаження">
    - `fullPage is not supported for element screenshots` → запит знімка екрана поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам завантаження Chrome MCP потрібні посилання зі знімка, а не CSS-селектори.
    - `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження на виклик у профілях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення таймауту.
    - `existing-session type does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен власний таймаут.
    - `existing-session evaluate does not support timeoutMs overrides.` → не вказуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен власний таймаут.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` досі потребує керованого браузера або raw CDP-профілю.
    - застарілі перевизначення viewport / темного режиму / локалі / офлайн-режиму в профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керувальну сесію та звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися й щось раптом зламалося

Більшість збоїв після оновлення спричинені дрейфом конфігурації або суворішими типовими налаштуваннями, які тепер застосовуються.

<AccordionGroup>
  <Accordion title="1. Поведінка автентифікації та перевизначення URL змінилася">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть націлюватися на віддалений сервіс, тоді як ваш локальний сервіс справний.
    - Явні виклики з `--url` не повертаються до збережених облікових даних.

    Поширені сигнатури:

    - `gateway connect failed:` → неправильна цільова URL-адреса.
    - `unauthorized` → кінцева точка досяжна, але автентифікація неправильна.

  </Accordion>
  <Accordion title="2. Обмеження bind та автентифікації стали суворішими">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації Gateway: автентифікації спільним токеном/паролем або правильно налаштованого розгортання `trusted-proxy` не до loopback.
    - Старі ключі, як-от `gateway.token`, не замінюють `gateway.auth.token`.

    Поширені сигнатури:

    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації Gateway.
    - `Connectivity probe: failed`, коли середовище виконання запущене → Gateway працює, але недоступний із поточною автентифікацією/URL.

  </Accordion>
  <Accordion title="3. Стан спарення та ідентичності пристрою змінився">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Очікувані схвалення пристроїв для панелі керування/Nodes.
    - Очікувані схвалення DM-спарення після змін політики або ідентичності.

    Поширені сигнатури:

    - `device identity required` → автентифікацію пристрою не задоволено.
    - `pairing required` → відправника/пристрій потрібно схвалити.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу та runtime все ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

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
