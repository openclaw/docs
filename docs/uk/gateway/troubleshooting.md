---
read_when:
    - Центр усунення несправностей спрямував вас сюди для глибшої діагностики
    - Потрібні стабільні розділи операційного посібника на основі симптомів із точними командами
sidebarTitle: Troubleshooting
summary: Поглиблений операційний посібник з усунення несправностей для Gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-05-01T20:37:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ця сторінка є докладним операційним посібником. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу хочете пройти швидкий процес діагностики.

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
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації чи служби.
- `openclaw channels status --probe` показує актуальний статус транспорту для кожного облікового запису та, де підтримується, результати перевірки/аудиту, як-от `works` або `audit ok`.

## Розсинхронізовані інсталяції та захист від новішої конфігурації

Використовуйте це, коли служба Gateway несподівано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записувала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть переглядати конфігурацію, записану новішою версією OpenClaw, але операції, що змінюють процеси й служби, відмовляються продовжувати роботу зі старішого бінарного файлу. Заблоковані дії включають запуск, зупинку, перезапуск і видалення служби Gateway, примусове перевстановлення служби, запуск Gateway у режимі служби та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Виправте PATH">
    Виправте `PATH`, щоб `openclaw` вказував на новішу інсталяцію, а потім повторно виконайте дію.
  </Step>
  <Step title="Перевстановіть службу Gateway">
    Перевстановіть потрібну службу Gateway із новішої інсталяції:

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
Лише для навмисного зниження версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для нормальної роботи залишайте її невстановленою.
</Warning>

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте:

- Обрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточні облікові дані Anthropic не придатні для використання довгого контексту.
- Запити завершуються помилкою лише в довгих сесіях/запусках моделей, яким потрібен beta-шлях 1M.

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

Пов’язано:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний бекенд проходить прямі перевірки, але запуски агента завершуються помилкою

Використовуйте це, коли:

- `curl ... /v1/models` працює
- малі прямі виклики `/v1/chat/completions` працюють
- запуски моделей OpenClaw завершуються помилкою лише під час звичайних ходів агента

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте:

- малі прямі виклики успішні, але запуски OpenClaw завершуються помилкою лише на більших промптах
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим ідентифікатором моделі без префікса
- помилки бекенду про те, що `messages[].content` очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з OpenAI-сумісним локальним бекендом
- збої бекенду, які з’являються лише за більшої кількості токенів промпту або повних промптів середовища виконання агента

<AccordionGroup>
  <Accordion title="Поширені ознаки">
    - `model_not_found` з локальним сервером у стилі MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` має значення `"openai-completions"` для бекендів `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є локальним ідентифікатором провайдера без префікса. Виберіть її один раз із префіксом провайдера, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; залиште запис каталогу як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → бекенд відхиляє структуровані частини вмісту Chat Completions. Виправлення: установіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → бекенд завершив запит Chat Completions, але не повернув видимого користувачу тексту асистента для цього ходу. OpenClaw один раз повторює порожні OpenAI-сумісні ходи, безпечні для повторного відтворення; сталі збої зазвичай означають, що бекенд видає порожній/нетекстовий вміст або пригнічує текст фінальної відповіді.
    - малі прямі запити успішні, але запуски агента OpenClaw завершуються збоями бекенду/моделі (наприклад Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, вже налаштований правильно; бекенд не справляється з більшою формою промпту середовища виконання агента.
    - збоїв стає менше після вимкнення інструментів, але вони не зникають → схеми інструментів були частиною навантаження, але залишкова проблема все ще полягає в обмеженнях моделі/сервера вище за стеком або помилці бекенду.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Установіть `compat.requiresStringContent: true` для бекендів Chat Completions, що підтримують лише рядковий вміст.
    2. Установіть `compat.supportsTools: false` для моделей/бекендів, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
    3. Зменште навантаження промпту, де це можливо: менша початкова ініціалізація робочої області, коротша історія сесії, легша локальна модель або бекенд із кращою підтримкою довгого контексту.
    4. Якщо малі прямі запити й далі проходять, а ходи агента OpenClaw все ще падають усередині бекенду, вважайте це обмеженням upstream-сервера/моделі та подайте туди відтворення з прийнятою формою корисного навантаження.
  </Accordion>
</AccordionGroup>

Пов’язано:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні кінцеві точки](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але нічого не відповідає, перевірте маршрутизацію й політику, перш ніж щось перепідключати.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте:

- Очікується сполучення для відправників приватних повідомлень.
- Обмеження групових згадок (`requireMention`, `mentionPatterns`).
- Невідповідності списку дозволених каналів/груп.

Поширені ознаки:

- `drop guild message (mention required` → групове повідомлення ігнорується до згадки.
- `pairing request` → відправник потребує схвалення.
- `blocked` / `allowlist` → відправника/канал відфільтровано політикою.

Пов’язано:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Сполучення](/uk/channels/pairing)

## Підключення панелі керування

Коли панель або інтерфейс керування не підключається, перевірте URL, режим автентифікації та припущення щодо захищеного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте:

- Правильні URL перевірки та панелі керування.
- Невідповідність режиму автентифікації/токена між клієнтом і Gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Ознаки підключення / автентифікації">
    - `device identity required` → незахищений контекст або відсутня автентифікація пристрою.
    - `origin not allowed` → браузерний `Origin` відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з браузерного origin не через loopback без явного списку дозволених).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує процес автентифікації пристрою на основі перевірочного виклику (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильне корисне навантаження (або застарілу часову мітку) для поточного узгодження.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим токеном пристрою.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений зі сполученим токеном пристрою. Викликачі з явним `deviceToken` / явними `scopes` натомість зберігають запитаний набір scope.
    - Поза цим шляхом повторної спроби пріоритет автентифікації connect такий: спершу явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як обмежувач зафіксує збій. Тому дві невдалі одночасні повторні спроби від одного клієнта можуть показати `retry later` на другій спробі замість двох звичайних невідповідностей.
    - `too many failed authentication attempts (retry later)` від loopback-клієнта з браузерним origin → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий лімітний сегмент.
    - повторювані `unauthorized` після цієї повторної спроби → розсинхронізація спільного токена/токена пристрою; оновіть конфігурацію токена та за потреби повторно схваліть/ротуйту токен пристрою.
    - `gateway connect failed:` → неправильна ціль хоста/порту/URL.

  </Accordion>
</AccordionGroup>

### Швидка мапа кодів деталей автентифікації

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код подробиць                | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                              | Вставте/задайте токен у клієнті та повторіть спробу. Для шляхів панелі: `openclaw config get gateway.auth.token`, потім вставте його в налаштування Control UI.                                                                                                                          |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з auth-токеном gateway.                                                                                                                                             | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scopes; виклики з явними `deviceToken` / `scopes` зберігають запитані scopes. Якщо помилка лишається, виконайте [контрольний список відновлення після дрейфу токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен окремого пристрою застарів або був відкликаний.                                                                                                                               | Ротуйте/повторно схваліть токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), потім під’єднайтеся знову.                                                                                                                                                                          |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/ролі використовують той самий потік після того, як ви переглянете запитаний доступ.                                                                                   |

<Note>
Прямі backend RPC через loopback, автентифіковані спільним токеном/паролем gateway, не мають залежати від базової лінії scope для спареного пристрою в CLI. Якщо subagents або інші внутрішні виклики все ще завершуються помилкою `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примусово задає явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції автентифікації пристроїв v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що під’єднується, і перевірте його:

<Steps>
  <Step title="Дочекайтеся connect.challenge">
    Клієнт чекає на виданий gateway `connect.challenge`.
  </Step>
  <Step title="Підпишіть payload">
    Клієнт підписує payload, прив’язаний до challenge.
  </Step>
  <Step title="Надішліть nonce пристрою">
    Клієнт надсилає `connect.params.device.nonce` з тим самим nonce challenge.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхилено:

- сесії з токеном спареного пристрою можуть керувати лише **своїм власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише scopes оператора, які сесія виклику вже має

Пов’язано:

- [Конфігурація](/uk/gateway/configuration) (режими автентифікації gateway)
- [Control UI](/uk/web/control-ui)
- [Пристрої](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація довіреного проксі](/uk/gateway/trusted-proxy-auth)

## Служба Gateway не працює

Використовуйте це, коли службу встановлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Шукайте:

- `Runtime: stopped` з підказками щодо виходу.
- Невідповідність конфігурації служби (`Config (cli)` проти `Config (service)`).
- Конфлікти порту/listener.
- Додаткові встановлення launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → режим локального gateway не ввімкнено, або файл конфігурації було перезаписано й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб повторно проставити очікувану конфігурацію local-mode. Якщо ви запускаєте OpenClaw через Podman, типовий шлях конфігурації — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язування не до loopback без дійсного шляху автентифікації gateway (token/password або trusted-proxy, де налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні units launchd/systemd/schtasks. У більшості налаштувань має бути один gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + конфігурацію/стан/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → існує systemd system unit, тоді як служба рівня користувача відсутня. Видаліть або вимкніть дублікат, перш ніж дозволити doctor встановити користувацьку службу, або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо system unit є запланованим супервізором.
    - `Gateway service port does not match current gateway config` → встановлений supervisor досі закріплює старий `--port`. Запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, потім перезапустіть службу gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Фоновий exec і process tool](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню відому справну конфігурацію

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
- Файл `openclaw.json.clobbered.*` з часовою міткою поруч з активною конфігурацією
- Системну подію main-agent, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої валідованої копії last-known-good.
    - Наступний хід main-agent отримує попередження не переписувати відхилену конфігурацію наосліп.
    - Якщо всі проблеми валідації були під `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні збої Plugin лишаються помітними, тоді як непов’язані користувацькі налаштування залишаються в активній конфігурації.

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
    - `.clobbered.*` існує → зовнішнє пряме редагування або читання під час запуску було відновлено.
    - `.rejected.*` існує → запис конфігурації, керований OpenClaw, не пройшов перевірки схеми або clobber перед комітом.
    - `Config write rejected:` → запис намагався видалити обов’язкову форму, різко зменшити файл або зберегти недійсну конфігурацію.
    - `Rejected validation details:` → журнал відновлення або повідомлення main-agent містить шлях схеми, що спричинив відновлення, наприклад `agents.defaults.execution` або `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → запуск обробив поточний файл як clobbered, бо він втратив поля або розмір порівняно з резервною копією last-known-good.
    - `Config last-known-good promotion skipped` → кандидат містив відредаговані placeholder-и секретів, як-от `***`.

  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Залиште відновлену активну конфігурацію, якщо вона правильна.
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

## Попередження probe для Gateway

Використовуйте це, коли `openclaw gateway probe` досягає чогось, але все ще друкує блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження SSH fallback, кількох gateways, відсутніх scopes або нерозв’язаних auth refs.

Поширені сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback targets.
- `multiple reachable gateways detected` → відповіло більше ніж одне target. Зазвичай це означає навмисне налаштування multi-gateway або застарілі/дубльовані listeners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але detail RPC обмежено scope; спаруйте ідентичність пристрою або використайте credentials з `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → підключення спрацювало, але повний набір діагностичних RPC вичерпав час очікування або завершився помилкою. Вважайте це досяжним Gateway з погіршеною діагностикою; порівняйте `connect.ok` і `connect.rpcOk` у виводі `--json`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту ще потрібне pairing/approval перед звичайним операторським доступом.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → auth material був недоступний у цьому шляху команди для target, що зазнав збою.

Пов’язано:

- [Gateway](/uk/cli/gateway)
- [Кілька gateways на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал під’єднано, повідомлення не передаються

Якщо стан каналу — під’єднано, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставки, специфічних для каналу.

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
- Відсутні дозволи/області доступу API каналу.

Поширені сигнатури:

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

- Cron увімкнено, і є наступне пробудження.
- Статус історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → збій такту планувальника; перевірте помилки файлів/журналів/середовища виконання.
    - `heartbeat skipped` with `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` with `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` with `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися під час цього такту.
    - `heartbeat: unknown accountId` → недійсний id облікового запису для цілі доставки Heartbeat.
    - `heartbeat skipped` with `reason=dm-blocked` → ціль Heartbeat визначено як призначення типу DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для окремого агента) встановлено на `block`.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Заплановані завдання: усунення несправностей](/uk/automation/cron-jobs#troubleshooting)

## Node спарено, інструмент не працює

Якщо Node спарено, але інструменти не працюють, ізолюйте стан переднього плану, дозволів і схвалень.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Шукайте:

- Node онлайн з очікуваними можливостями.
- Надання дозволів ОС для камери/мікрофона/геолокації/екрана.
- Схвалення exec і стан allowlist.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команда заблокована allowlist.

Пов’язано:

- [Схвалення exec](/uk/tools/exec-approvals)
- [Усунення несправностей Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Інструмент браузера не працює

Використовуйте це, коли дії інструмента браузера не вдаються, хоча сам Gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте:

- Чи встановлено `plugins.allow` і чи включає він `browser`.
- Дійсний шлях до виконуваного файлу браузера.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Сигнатури Plugin / виконуваного файлу">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований Plugin браузера виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, коли `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
    - `Failed to start Chrome CDP on port` → процес браузера не вдалося запустити.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний порт або порт поза діапазоном.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточна інсталяція Gateway не має основної залежності середовища виконання браузера; перевстановіть або оновіть OpenClaw, а потім перезапустіть Gateway. Знімки ARIA та базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селектором і експорт PDF залишаються недоступними.

  </Accordion>
  <Accordion title="Сигнатури Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку інспектування браузера, увімкніть віддалене налагодження, залиште браузер відкритим, схваліть перший запит на під’єднання, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль під’єднання Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з хоста Gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для під’єднання не має досяжної цілі, або HTTP-кінцева точка відповіла, але WebSocket CDP усе одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Сигнатури елемента / знімка екрана / завантаження">
    - `fullPage is not supported for element screenshots` → запит знімка екрана змішав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам завантаження Chrome MCP потрібні refs зі знімків, а не CSS-селектори.
    - `existing-session file uploads currently support one file at a time.` → надсилайте по одному завантаженню за виклик у профілях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення часу очікування.
    - `existing-session type does not support timeoutMs overrides.` → опустіть `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен власний час очікування.
    - `existing-session evaluate does not support timeoutMs overrides.` → опустіть `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використовуйте керований/CDP-профіль браузера, коли потрібен власний час очікування.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або сирого CDP-профілю.
    - застарілі перевизначення viewport / темного режиму / locale / офлайн-режиму в профілях лише для під’єднання або віддалених CDP-профілях → запустіть `openclaw browser stop --browser-profile <name>`, щоб закрити активний сеанс керування й звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.

  </Accordion>
</AccordionGroup>

Пов’язано:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися, і щось раптово зламалося

Більшість збоїв після оновлення спричинені розбіжностями конфігурації або суворішими стандартними налаштуваннями, які тепер застосовуються.

<AccordionGroup>
  <Accordion title="1. Поведінка автентифікації та перевизначення URL змінилася">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть націлюватися на віддалений сервіс, тоді як ваш локальний сервіс працює нормально.
    - Явні виклики `--url` не повертаються до збережених облікових даних.

    Поширені сигнатури:

    - `gateway connect failed:` → неправильна ціль URL.
    - `unauthorized` → кінцева точка досяжна, але автентифікація неправильна.

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

    - Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації Gateway: автентифікації спільним токеном/паролем або правильно налаштованого розгортання `trusted-proxy` не для loopback.
    - Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

    Поширені сигнатури:

    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації Gateway.
    - `Connectivity probe: failed`, коли середовище виконання працює → Gateway живий, але недоступний з поточною автентифікацією/url.

  </Accordion>
  <Accordion title="3. Стан pairing і ідентичності пристрою змінився">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Очікувані схвалення пристроїв для панелі керування/Nodes.
    - Очікувані схвалення DM pairing після змін політики або ідентичності.

    Поширені сигнатури:

    - `device identity required` → автентифікацію пристрою не задоволено.
    - `pairing required` → відправника/пристрій має бути схвалено.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу й середовище виконання після перевірок усе ще не збігаються, перевстановіть метадані сервісу з того самого профілю/каталогу стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язано:

- [Автентифікація](/uk/gateway/authentication)
- [Фоновий exec і інструмент процесу](/uk/gateway/background-process)
- [Pairing, керований Gateway](/uk/gateway/pairing)

## Пов’язано

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Runbook Gateway](/uk/gateway)
