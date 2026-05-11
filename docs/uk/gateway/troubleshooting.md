---
read_when:
    - Центр усунення несправностей спрямував вас сюди для глибшої діагностики.
    - Вам потрібні стабільні розділи інструкції з реагування на основі симптомів із точними командами.
sidebarTitle: Troubleshooting
summary: Поглиблений посібник з усунення несправностей для Gateway, каналів, автоматизації, вузлів і браузера
title: Усунення несправностей
x-i18n:
    generated_at: "2026-05-11T20:40:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ця сторінка є докладним runbook. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спершу потрібен швидкий потік triage.

## Послідовність команд

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
- `openclaw channels status --probe` показує live-стан транспорту для кожного облікового запису та, де підтримується, результати probe/audit, як-от `works` або `audit ok`.

## Розділені інсталяції та захист новішої конфігурації

Використовуйте це, коли служба Gateway несподівано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записала `openclaw.json`.

OpenClaw позначає записи конфігурації за допомогою `meta.lastTouchedVersion`. Команди лише для читання все ще можуть переглядати конфігурацію, записану новішим OpenClaw, але зміни процесів і служб відмовляються продовжувати роботу зі старішого бінарного файлу. Заблоковані дії включають запуск, зупинку, перезапуск і видалення служби Gateway, примусове перевстановлення служби, запуск Gateway у режимі служби та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Виправте `PATH`, щоб `openclaw` вказував на новішу інсталяцію, потім повторно виконайте дію.
  </Step>
  <Step title="Reinstall the gateway service">
    Перевстановіть потрібну службу Gateway з новішої інсталяції:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Видаліть застарілий системний пакет або старі записи wrapper, які досі вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного downgrade або аварійного відновлення задайте `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї команди. Для звичайної роботи залишайте це незаданим.
</Warning>

## Символічне посилання Skill пропущено як вихід за межі шляху

Використовуйте це, коли журнали містять:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw розглядає кожен корінь Skill як межу ізоляції. Символічне посилання в
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` або
`~/.openclaw/skills` пропускається, коли його реальна ціль визначається поза цим коренем,
якщо ціль не є явно довіреною.

Перевірте посилання:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Якщо ціль навмисна, налаштуйте і прямий корінь Skill, і
дозволену ціль символічного посилання:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Потім запустіть нову сесію або зачекайте, доки watcher Skills оновиться. Перезапустіть
Gateway, якщо запущений процес старіший за зміну конфігурації.

Не використовуйте широкі цілі, як-от `~`, `/` або всю синхронізовану теку проєкту.
Обмежуйте `allowSymlinkTargets` реальним коренем Skill, що містить довірені
каталоги `SKILL.md`.

Пов’язано:

- [Конфігурація Skills](/uk/tools/skills-config#symlinked-sibling-repos)
- [Приклади конфігурації](/uk/gateway/configuration-examples#symlinked-sibling-skill-repo)

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
- Запити не проходять лише в довгих сесіях/запусках моделі, яким потрібен beta-шлях 1M.

Варіанти виправлення:

<Steps>
  <Step title="Disable context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного контекстного вікна.
  </Step>
  <Step title="Use an eligible credential">
    Використайте облікові дані Anthropic, які мають право на запити з довгим контекстом, або перейдіть на API-ключ Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Налаштуйте резервні моделі, щоб запуски продовжувалися, коли запити Anthropic з довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язано:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний backend проходить прямі probe, але запуски agent не вдаються

Використовуйте це, коли:

- `curl ... /v1/models` працює
- крихітні прямі виклики `/v1/chat/completions` працюють
- Запуски моделей OpenClaw не вдаються лише на звичайних ходах agent

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
  працює з тим самим bare model id
- помилки backend про те, що `messages[].content` очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з OpenAI-сумісним локальним backend
- збої backend, які з’являються лише з більшими кількостями prompt-токенів або повними prompt runtime agent

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` з локальним сервером у стилі MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` має значення `"openai-completions"` для backend `/v1/chat/completions`, а `models.providers.<provider>.models[].id` є bare provider-local id. Виберіть його з префіксом provider один раз, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; залиште запис каталогу як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend відхиляє структуровані частини вмісту Chat Completions. Виправлення: задайте `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` або дозволені ключі повідомлень, як-от `["role","content"]` → backend відхиляє replay metadata у стилі OpenAI у повідомленнях Chat Completions. Виправлення: задайте `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend завершив запит Chat Completions, але не повернув видимий користувачу текст assistant для цього ходу. OpenClaw один раз повторює replay-safe порожні OpenAI-сумісні ходи; постійні збої зазвичай означають, що backend видає порожній/нетекстовий вміст або пригнічує текст final-answer.
    - прямі крихітні запити успішні, але запуски agent OpenClaw не вдаються зі збоями backend/моделі (наприклад Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, вже правильний; backend не справляється з більшою формою prompt runtime agent.
    - збої зменшуються після вимкнення інструментів, але не зникають → схеми інструментів були частиною навантаження, але решта проблеми все ще є upstream-пропускною здатністю моделі/сервера або bug backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Задайте `compat.requiresStringContent: true` для backend Chat Completions, які приймають лише рядки.
    2. Задайте `compat.strictMessageKeys: true` для строгих backend Chat Completions, які приймають лише `role` і `content` у кожному повідомленні.
    3. Задайте `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти поверхню схем інструментів OpenClaw.
    4. Зменште навантаження prompt, де можливо: менший bootstrap workspace, коротша історія сесії, легша локальна модель або backend із сильнішою підтримкою довгого контексту.
    5. Якщо крихітні прямі запити й далі проходять, а ходи agent OpenClaw усе ще падають усередині backend, розглядайте це як upstream-обмеження сервера/моделі та подайте туди repro з прийнятою формою payload.
  </Accordion>
</AccordionGroup>

Пов’язано:

- [Конфігурація](/uk/gateway/configuration)
- [Локальні моделі](/uk/gateway/local-models)
- [OpenAI-сумісні endpoints](/uk/gateway/configuration-reference#openai-compatible-endpoints)

## Немає відповідей

Якщо канали працюють, але нічого не відповідає, перевірте routing і policy, перш ніж повторно підключати будь-що.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Шукайте:

- Pairing pending для відправників DM.
- Обмеження згадок у групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist каналу/групи.

Поширені ознаки:

- `drop guild message (mention required` → повідомлення групи ігнорується до згадки.
- `pairing request` → відправнику потрібне схвалення.
- `blocked` / `allowlist` → відправник/канал був відфільтрований policy.

Пов’язано:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Pairing](/uk/channels/pairing)

## Підключення dashboard control UI

Коли dashboard/control UI не підключається, перевірте URL, режим auth і припущення secure context.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте:

- Правильні probe URL і dashboard URL.
- Невідповідність режиму auth/token між клієнтом і Gateway.
- Використання HTTP там, де потрібна device identity.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → незахищений контекст або відсутня device auth.
    - `origin not allowed` → browser `Origin` не входить до `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з browser origin не-loopback без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based flow device auth (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або застарілий timestamp) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим device token.
    - Ця повторна спроба cached-token повторно використовує кешований набір scope, збережений із paired device token. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають свій запитаний набір scope.
    - `AUTH_SCOPE_MISMATCH` → device token розпізнано, але його схвалені scopes не покривають цей connect request; повторно виконайте pairing або схваліть запитаний scope contract замість ротації спільного gateway token.
    - Поза цим retry path пріоритет auth для connect такий: спершу явний shared token/password, потім явний `deviceToken`, потім збережений device token, потім bootstrap token.
    - На async Tailscale Serve Control UI path невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як limiter записує збій. Тому дві погані одночасні повторні спроби від того самого клієнта можуть показати `retry later` на другій спробі замість двох простих mismatch.
    - `too many failed authentication attempts (retry later)` від browser-origin loopback client → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
    - повторне `unauthorized` після цієї retry → розходження shared token/device token; оновіть конфігурацію token і за потреби повторно схваліть/ротируйте device token.
    - `gateway connect failed:` → неправильний target host/port/url.

  </Accordion>
</AccordionGroup>

### Швидка мапа detail codes auth

Використовуйте `error.details.code` з невдалої відповіді `connect`, щоб вибрати наступну дію:

| Код деталі                  | Значення                                                                                                                                                                                      | Рекомендована дія                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Клієнт не надіслав обов’язковий спільний токен.                                                                                                                                                 | Вставте/задайте токен у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштування Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Спільний токен не збігся з токеном автентифікації Gateway.                                                                                                                                               | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим токеном повторно використовують збережені схвалені scopes; виклики з явними `deviceToken` / `scopes` зберігають запитані scopes. Якщо помилка не зникає, виконайте [контрольний список відновлення після дрейфу токена](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований токен для пристрою застарів або був відкликаний.                                                                                                                                                 | Оновіть/повторно схваліть токен пристрою за допомогою [CLI пристроїв](/uk/cli/devices), потім підключіться повторно.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Токен пристрою чинний, але його схвалена роль/scopes не покривають цей запит на підключення.                                                                                                       | Повторно спаруйте пристрій або схваліть запитаний контракт scope; не трактуйте це як дрейф спільного токена.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade`, і використовуйте `requestId` / `remediationHint`, коли вони наявні. | Схваліть запит, що очікує: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/ролі використовують той самий потік після того, як ви переглянете запитаний доступ.                                                                                                               |

<Note>
Прямі backend RPC через loopback, автентифіковані спільним токеном/паролем Gateway, не мають залежати від базової лінії scope спарованого пристрою CLI. Якщо субагенти або інші внутрішні виклики все ще завершуються помилкою `scope-upgrade`, перевірте, що викликач використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примусово задає явний `deviceIdentity` або токен пристрою.
</Note>

Перевірка міграції автентифікації пристрою v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте його:

<Steps>
  <Step title="Wait for connect.challenge">
    Клієнт чекає на виданий Gateway `connect.challenge`.
  </Step>
  <Step title="Sign the payload">
    Клієнт підписує payload, прив’язаний до challenge.
  </Step>
  <Step title="Send the device nonce">
    Клієнт надсилає `connect.params.device.nonce` з тим самим challenge nonce.
  </Step>
</Steps>

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано відхилено:

- сесії токена спарованого пристрою можуть керувати лише **власним** пристроєм, якщо викликач також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише операторські scopes, які вже має сесія викликача

Пов’язане:

- [Конфігурація](/uk/gateway/configuration) (режими автентифікації Gateway)
- [Control UI](/uk/web/control-ui)
- [Пристрої](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Автентифікація довіреного proxy](/uk/gateway/trusted-proxy-auth)

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
- Конфлікти порту/listener.
- Додаткові встановлення launchd/systemd/schtasks, коли використано `--deep`.
- Підказки очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → режим локального Gateway не ввімкнено, або файл конфігурації було перезаписано й він втратив `gateway.mode`. Виправлення: задайте `gateway.mode="local"` у вашій конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб повторно проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, стандартний шлях конфігурації — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації Gateway (токен/пароль або trusted-proxy, де налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні одиниці launchd/systemd/schtasks. Більшість налаштувань мають тримати один Gateway на машину; якщо вам справді потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` від doctor → існує системний unit systemd, тоді як служба рівня користувача відсутня. Видаліть або вимкніть дублікат, перш ніж дозволяти doctor встановити користувацьку службу, або задайте `OPENCLAW_SERVICE_REPAIR_POLICY=external`, якщо системний unit є очікуваним supervisor.
    - `Gateway service port does not match current gateway config` → встановлений supervisor досі фіксує старий `--port`. Запустіть `openclaw doctor --fix` або `openclaw gateway install --force`, потім перезапустіть службу Gateway.

  </Accordion>
</AccordionGroup>

Пов’язане:

- [Фонове виконання та process tool](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відхилив недійсну конфігурацію

Використовуйте це, коли запуск Gateway завершується помилкою `Invalid config` або журнали hot reload кажуть,
що недійсне редагування було пропущено.

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
- Файл `openclaw.json.rejected.*` з часовою міткою поруч з активною конфігурацією
- Файл `openclaw.json.clobbered.*` з часовою міткою, якщо `doctor --fix` відремонтував зламане пряме редагування

<AccordionGroup>
  <Accordion title="What happened">
    - Конфігурація не пройшла валідацію під час запуску, hot reload або запису, яким володіє OpenClaw.
    - Запуск Gateway аварійно завершується замість переписування `openclaw.json`.
    - Hot reload пропускає недійсні зовнішні редагування та зберігає поточну runtime-конфігурацію активною.
    - Записи, якими володіє OpenClaw, відхиляють недійсні/деструктивні payloads до commit і зберігають `.rejected.*`.
    - `openclaw doctor --fix` відповідає за repair. Він може видалити не-JSON префікси або відновити останню відому справну копію, зберігши відхилений payload як `.clobbered.*`.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` існує → doctor зберіг зламане зовнішнє редагування під час ремонту активної конфігурації.
    - `.rejected.*` існує → запис конфігурації, яким володіє OpenClaw, не пройшов перевірки схеми або clobber до commit.
    - `Config write rejected:` → запис намагався видалити обов’язкову форму, різко зменшити файл або зберегти недійсну конфігурацію.
    - `config reload skipped (invalid config):` → пряме редагування не пройшло валідацію та було проігнороване запущеним Gateway.
    - `Invalid config at ...` → запуск завершився помилкою до старту служб Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → запис, яким володіє OpenClaw, було відхилено, бо він втратив поля або розмір порівняно з останньою відомою справною резервною копією.
    - `Config last-known-good promotion skipped` → кандидат містив замасковані placeholder секретів, як-от `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Запустіть `openclaw doctor --fix`, щоб doctor відремонтував конфігурацію з префіксом/clobbered або відновив last-known-good.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, потім застосуйте їх через `openclaw config set` або `config.patch`.
    3. Запустіть `openclaw config validate` перед перезапуском.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який ви хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Config](/uk/cli/config)
- [Конфігурація: hot reload](/uk/gateway/configuration#config-hot-reload)
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

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи попередження стосується SSH fallback, кількох Gateway, відсутніх scopes або нерозв’язаних auth refs.

Поширені сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback цілі.
- `multiple reachable gateways detected` → відповіла більш ніж одна ціль. Зазвичай це означає навмисне налаштування з кількома Gateway або застарілі/дубльовані listeners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежено scope; спаруйте ідентичність пристрою або використайте облікові дані з `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → підключення спрацювало, але повний набір діагностичних RPC перевищив час очікування або завершився помилкою. Трактуйте це як досяжний Gateway із погіршеною діагностикою; порівняйте `connect.ok` і `connect.rpcOk` у виводі `--json`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → Gateway відповів, але цьому клієнту все ще потрібне pairing/схвалення перед звичайним операторським доступом.
- нерозв’язаний текст попередження `gateway.auth.*` / `gateway.remote.*` SecretRef → auth material був недоступний у цьому шляху команди для цілі, що завершилася помилкою.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, але повідомлення не надходять

Якщо стан каналу підключений, але потік повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставлення, специфічних для каналу.

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
- Відсутні дозволи/області API каналу.

Поширені ознаки:

- `mention required` → повідомлення проігноровано політикою згадок у групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема з автентифікацією/дозволами каналу.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставлення Cron і Heartbeat

Якщо Cron або Heartbeat не запустився чи не доставив повідомлення, спочатку перевірте стан планувальника, а потім ціль доставлення.

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
  <Accordion title="Поширені ознаки">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → збій такту планувальника; перевірте помилки файлів/журналу/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / заголовки markdown, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але жодне із завдань не має виконуватися під час цього такту.
    - `heartbeat: unknown accountId` → недійсний ідентифікатор облікового запису для цілі доставлення Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat визначено як DM-призначення, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для агента) має значення `block`.

  </Accordion>
</AccordionGroup>

Пов’язане:

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

- Node онлайн із очікуваними можливостями.
- Дозволи ОС для камери/мікрофона/локації/екрана.
- Стан exec-схвалень і allowlist.

Поширені ознаки:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → відсутній дозвіл ОС.
- `SYSTEM_RUN_DENIED: approval required` → exec-схвалення очікує.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано allowlist.

Пов’язане:

- [Exec-схвалення](/uk/tools/exec-approvals)
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
- Досяжність CDP-профілю.
- Наявність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Ознаки Plugin / виконуваного файлу">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований Plugin браузера виключено через `plugins.allow`.
    - інструмент браузера відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому Plugin ніколи не завантажився.
    - `Failed to start Chrome CDP on port` → не вдалося запустити процес браузера.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований CDP URL використовує непідтримувану схему, наприклад `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований CDP URL має неправильний порт або порт поза допустимим діапазоном.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточне встановлення gateway не має основної залежності браузерного runtime; перевстановіть або оновіть OpenClaw, а потім перезапустіть Gateway. ARIA-знімки й базові знімки сторінок усе ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селекторами та експорт PDF залишаються недоступними.

  </Accordion>
  <Accordion title="Ознаки Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ще не зміг під’єднатися до вибраного каталогу даних браузера. Відкрийте сторінку інспектування браузера, увімкніть віддалене налагодження, залиште браузер відкритим, схваліть перший запит на під’єднання, а потім повторіть спробу. Якщо стан входу не потрібен, краще використовуйте керований профіль `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль під’єднання Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена CDP-кінцева точка недосяжна з хоста Gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для під’єднання не має досяжної цілі, або HTTP-кінцева точка відповіла, але CDP WebSocket усе одно не вдалося відкрити.

  </Accordion>
  <Accordion title="Ознаки елемента / знімка екрана / завантаження">
    - `fullPage is not supported for element screenshots` → запит знімка екрана поєднав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики знімків екрана Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі знімка, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → хукам завантаження Chrome MCP потрібні refs зі знімків, а не CSS-селектори.
    - `existing-session file uploads currently support one file at a time.` → надсилайте одне завантаження за виклик у профілях Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → хуки діалогів у профілях Chrome MCP не підтримують перевизначення тайм-ауту.
    - `existing-session type does not support timeoutMs overrides.` → пропустіть `timeoutMs` для `act:type` у профілях `profile="user"` / Chrome MCP existing-session або використайте керований/CDP-профіль браузера, коли потрібен власний тайм-аут.
    - `existing-session evaluate does not support timeoutMs overrides.` → пропустіть `timeoutMs` для `act:evaluate` у профілях `profile="user"` / Chrome MCP existing-session або використайте керований/CDP-профіль браузера, коли потрібен власний тайм-аут.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` усе ще потребує керованого браузера або raw CDP-профілю.
    - застарілі перевизначення області перегляду / темного режиму / локалі / офлайн-режиму в профілях лише для під’єднання або віддалених CDP-профілях → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активний сеанс керування й звільнити стан емуляції Playwright/CDP без перезапуску всього Gateway.

  </Accordion>
</AccordionGroup>

Пов’язане:

- [Браузер (керований OpenClaw)](/uk/tools/browser)
- [Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися й щось раптово зламалося

Більшість поломок після оновлення спричинені розходженням конфігурації або суворішими стандартними значеннями, які тепер застосовуються.

<AccordionGroup>
  <Accordion title="1. Поведінка перевизначення автентифікації та URL змінилася">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть націлюватися на віддалений сервіс, тоді як ваш локальний сервіс працює нормально.
    - Явні виклики `--url` не повертаються до збережених облікових даних.

    Поширені ознаки:

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

    - Прив’язки не до loopback (`lan`, `tailnet`, `custom`) потребують дійсного шляху автентифікації Gateway: автентифікації спільним токеном/паролем або правильно налаштованого розгортання non-loopback `trusted-proxy`.
    - Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

    Поширені ознаки:

    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без дійсного шляху автентифікації Gateway.
    - `Connectivity probe: failed`, поки runtime працює → Gateway живий, але недоступний із поточною автентифікацією/URL.

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

    Поширені ознаки:

    - `device identity required` → автентифікацію пристрою не задоволено.
    - `pairing required` → відправника/пристрій має бути схвалено.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу й runtime після перевірок усе ще не узгоджуються, перевстановіть метадані сервісу з того самого каталогу профілю/стану:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [Автентифікація](/uk/gateway/authentication)
- [Фоновий exec та інструмент процесів](/uk/gateway/background-process)
- [Pairing, яким керує Gateway](/uk/gateway/pairing)

## Пов’язане

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Runbook Gateway](/uk/gateway)
