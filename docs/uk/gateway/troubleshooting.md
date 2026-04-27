---
read_when:
    - Центр усунення несправностей направив вас сюди для глибшої діагностики
    - Вам потрібні стабільні розділи runbook на основі симптомів із точними командами
sidebarTitle: Troubleshooting
summary: Детальний runbook з усунення несправностей для Gateway, каналів, автоматизації, Node і browser
title: Усунення несправностей
x-i18n:
    generated_at: "2026-04-27T12:51:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ebc72b537f34dfb0dcc8b2e56014bc6a573f46835b65b9953e2edfe403bc5ca
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Ця сторінка — детальний runbook. Почніть із [/help/troubleshooting](/uk/help/troubleshooting), якщо спочатку хочете швидкий потік тріажу.

## Сходинки команд

Спочатку виконайте ці команди, у такому порядку:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Очікувані ознаки здорового стану:

- `openclaw gateway status` показує `Runtime: running`, `Connectivity probe: ok` і рядок `Capability: ...`.
- `openclaw doctor` не повідомляє про блокувальні проблеми конфігурації/сервісу.
- `openclaw channels status --probe` показує живий стан транспорту для кожного облікового запису та, де підтримується, результати probe/audit, такі як `works` або `audit ok`.

## Роздвоєні інсталяції та захист від новішої конфігурації

Використовуйте це, коли сервіс gateway неочікувано зупиняється після оновлення або журнали показують, що один бінарний файл `openclaw` старіший за версію, яка востаннє записувала `openclaw.json`.

OpenClaw позначає записи конфігурації через `meta.lastTouchedVersion`. Команди лише для читання все ще можуть переглядати конфігурацію, записану новішою версією OpenClaw, але зміни процесу та сервісу відмовляються продовжуватися зі старішого бінарного файла. До заблокованих дій належать запуск, зупинка, перезапуск і видалення сервісу gateway, примусове перевстановлення сервісу, запуск gateway у режимі сервісу та очищення порту через `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Виправте PATH">
    Виправте `PATH`, щоб `openclaw` вказував на новішу інсталяцію, а потім повторіть дію.
  </Step>
  <Step title="Перевстановіть сервіс gateway">
    Перевстановіть потрібний сервіс gateway з новішої інсталяції:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Видаліть застарілі wrapper">
    Видаліть застарілі записи системного пакета або старого wrapper, які все ще вказують на старий бінарний файл `openclaw`.
  </Step>
</Steps>

<Warning>
Лише для навмисного зниження версії або аварійного відновлення встановіть `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` для однієї конкретної команди. Для звичайної роботи залишайте його невстановленим.
</Warning>

## Anthropic 429: для довгого контексту потрібне додаткове використання

Використовуйте це, коли журнали/помилки містять: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Шукайте таке:

- Вибрана модель Anthropic Opus/Sonnet має `params.context1m: true`.
- Поточний credential Anthropic не має права на використання довгого контексту.
- Запити падають лише на довгих сесіях/запусках моделі, яким потрібен beta-шлях 1M.

Варіанти виправлення:

<Steps>
  <Step title="Вимкніть context1m">
    Вимкніть `context1m` для цієї моделі, щоб повернутися до звичайного вікна контексту.
  </Step>
  <Step title="Використайте credential із правом доступу">
    Використайте credential Anthropic, який має право на запити з довгим контекстом, або перейдіть на ключ Anthropic API.
  </Step>
  <Step title="Налаштуйте fallback-моделі">
    Налаштуйте fallback-моделі, щоб запуски продовжувалися, коли запити Anthropic із довгим контекстом відхиляються.
  </Step>
</Steps>

Пов’язане:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і вартість](/uk/reference/token-use)
- [Чому я бачу HTTP 429 від Anthropic?](/uk/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Локальний OpenAI-сумісний backend проходить прямі probe, але запуски agent падають

Використовуйте це, коли:

- `curl ... /v1/models` працює
- крихітні прямі виклики `/v1/chat/completions` працюють
- запуски моделі в OpenClaw падають лише на звичайних кроках agent

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Шукайте таке:

- прямі крихітні виклики успішні, але запуски OpenClaw падають лише на більших prompt
- помилки `model_not_found` або 404, хоча прямий `/v1/chat/completions`
  працює з тим самим bare id моделі
- помилки backend про те, що `messages[].content` очікує рядок
- періодичні попередження `incomplete turn detected ... stopReason=stop payloads=0` з локальним OpenAI-сумісним backend
- збої backend, які з’являються лише за більшої кількості prompt-токенів або повних prompt середовища виконання agent

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `model_not_found` з локальним сервером у стилі MLX/vLLM → перевірте, що `baseUrl` містить `/v1`, `api` дорівнює `"openai-completions"` для backend `/v1/chat/completions`, а `models.providers.<provider>.models[].id` — це bare локальний id provider. Вибирайте його один раз із префіксом provider, наприклад `mlx/mlx-community/Qwen3-30B-A3B-6bit`; запис каталогу лишайте як `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend відхиляє структуровані частини контенту Chat Completions. Виправлення: встановіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend завершив запит Chat Completions, але не повернув видимого для користувача тексту assistant для цього кроку. OpenClaw один раз повторює порожні OpenAI-сумісні кроки, безпечні для відтворення; сталі збої зазвичай означають, що backend повертає порожній/нетекстовий контент або пригнічує текст фінальної відповіді.
    - прямі крихітні запити проходять, але запуски agent в OpenClaw падають зі збоями backend/model (наприклад, Gemma на деяких збірках `inferrs`) → транспорт OpenClaw, імовірно, вже налаштований правильно; backend падає на більшій формі prompt середовища виконання agent.
    - після вимкнення tools збої зменшуються, але не зникають → schema tools були частиною навантаження, але решта проблеми все ще пов’язана з можливостями upstream model/server або з помилкою backend.
  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Установіть `compat.requiresStringContent: true` для backend Chat Completions, які приймають лише рядки.
    2. Установіть `compat.supportsTools: false` для моделей/backend, які не можуть надійно обробляти поверхню schema tools OpenClaw.
    3. Зменшіть тиск prompt, де можливо: менший bootstrap workspace, коротша історія сесії, легша локальна модель або backend із сильнішою підтримкою довгого контексту.
    4. Якщо прямі крихітні запити й далі проходять, а кроки agent в OpenClaw все ще падають усередині backend, вважайте це обмеженням upstream server/model і створіть там repro із прийнятною формою payload.
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

Шукайте таке:

- Очікується pairing для відправників у DM.
- Ворота згадування в групі (`requireMention`, `mentionPatterns`).
- Невідповідності allowlist для каналу/групи.

Поширені сигнатури:

- `drop guild message (mention required` → повідомлення в групі ігнорується, доки не буде згадки.
- `pairing request` → відправник потребує схвалення.
- `blocked` / `allowlist` → відправника/канал було відфільтровано політикою.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Групи](/uk/channels/groups)
- [Pairing](/uk/channels/pairing)

## Підключення Dashboard control UI

Коли dashboard/control UI не підключається, перевірте URL, режим auth і припущення щодо безпечного контексту.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Шукайте таке:

- Правильний probe URL і dashboard URL.
- Невідповідність режиму auth/token між клієнтом і gateway.
- Використання HTTP там, де потрібна ідентичність пристрою.

<AccordionGroup>
  <Accordion title="Сигнатури підключення / auth">
    - `device identity required` → небезпечний контекст або відсутня auth пристрою.
    - `origin not allowed` → `Origin` браузера відсутній у `gateway.controlUi.allowedOrigins` (або ви підключаєтеся з origin браузера не через loopback без явного allowlist).
    - `device nonce required` / `device nonce mismatch` → клієнт не завершує challenge-based потік auth пристрою (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → клієнт підписав неправильний payload (або використав застарілий timestamp) для поточного handshake.
    - `AUTH_TOKEN_MISMATCH` з `canRetryWithDeviceToken=true` → клієнт може виконати одну довірену повторну спробу з кешованим device token.
    - Ця повторна спроба з кешованим token повторно використовує кешований набір scope, збережений разом із paired device token. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають запитаний набір scope.
    - Поза цим шляхом повторної спроби пріоритет auth підключення такий: спочатку явний shared token/password, потім явний `deviceToken`, потім збережений device token, потім bootstrap token.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для тієї самої пари `{scope, ip}` серіалізуються до того, як limiter зафіксує збій. Тому дві погані одночасні повторні спроби від того самого клієнта можуть показати `retry later` на другій спробі замість двох звичайних невідповідностей.
    - `too many failed authentication attempts (retry later)` від loopback-клієнта з browser-origin → повторні збої з того самого нормалізованого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
    - повторюване `unauthorized` після цієї повторної спроби → розсинхронізація shared token/device token; оновіть конфігурацію token і за потреби повторно схваліть/ротуйте device token.
    - `gateway connect failed:` → неправильний host/port/url призначення.
  </Accordion>
</AccordionGroup>

### Коротка карта кодів деталей auth

Використовуйте `error.details.code` з відповіді збійного `connect`, щоб вибрати наступну дію:

| Код деталей                 | Значення                                                                                                                                                                                       | Рекомендована дія                                                                                                                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Клієнт не надіслав обов’язковий спільний token.                                                                                                                                                | Вставте/задайте token у клієнті й повторіть спробу. Для шляхів dashboard: `openclaw config get gateway.auth.token`, потім вставте його в налаштуваннях Control UI.                                                                                                                     |
| `AUTH_TOKEN_MISMATCH`       | Спільний token не збігся з token auth gateway.                                                                                                                                                 | Якщо `canRetryWithDeviceToken=true`, дозвольте одну довірену повторну спробу. Повторні спроби з кешованим token повторно використовують збережені схвалені scope; виклики з явними `deviceToken` / `scopes` зберігають запитаний набір scope. Якщо збій не зникає, виконайте [контрольний список відновлення після розсинхронізації token](/uk/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Кешований token для конкретного пристрою застарів або відкликаний.                                                                                                                            | Ротуйте/повторно схваліть token пристрою за допомогою [CLI devices](/uk/cli/devices), потім підключіться знову.                                                                                                                                                                            |
| `PAIRING_REQUIRED`          | Ідентичність пристрою потребує схвалення. Перевірте `error.details.reason` на `not-paired`, `scope-upgrade`, `role-upgrade` або `metadata-upgrade` і використовуйте `requestId` / `remediationHint`, якщо вони є. | Схваліть очікуваний запит: `openclaw devices list`, потім `openclaw devices approve <requestId>`. Оновлення scope/role використовують той самий потік після того, як ви перевірите запитаний доступ.                                                                                  |

<Note>
Прямі loopback backend RPC, автентифіковані спільним token/password gateway, не повинні залежати від базового набору scope paired-device у CLI. Якщо subagents або інші внутрішні виклики все ще падають із `scope-upgrade`, перевірте, що виклик використовує `client.id: "gateway-client"` і `client.mode: "backend"` та не примушує явний `deviceIdentity` або token пристрою.
</Note>

Перевірка міграції auth пристрою v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Якщо журнали показують помилки nonce/signature, оновіть клієнт, що підключається, і перевірте таке:

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

Якщо `openclaw devices rotate` / `revoke` / `remove` неочікувано заборонено:

- сесії token paired-device можуть керувати лише **власним** пристроєм, якщо виклик також не має `operator.admin`
- `openclaw devices rotate --scope ...` може запитувати лише ті scope operator, які сесія виклику вже має

Пов’язане:

- [Конфігурація](/uk/gateway/configuration) (режими auth gateway)
- [Control UI](/uk/web/control-ui)
- [Devices](/uk/cli/devices)
- [Віддалений доступ](/uk/gateway/remote)
- [Auth довіреного proxy](/uk/gateway/trusted-proxy-auth)

## Сервіс Gateway не запущений

Використовуйте це, коли сервіс установлено, але процес не залишається запущеним.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # також перевіряє системні сервіси
```

Шукайте таке:

- `Runtime: stopped` з підказками щодо виходу.
- Невідповідність конфігурації сервісу (`Config (cli)` vs `Config (service)`).
- Конфлікти порту/listener.
- Додаткові інсталяції launchd/systemd/schtasks, коли використовується `--deep`.
- Підказки для очищення `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → локальний режим gateway не ввімкнено, або файл конфігурації було пошкоджено й він втратив `gateway.mode`. Виправлення: установіть `gateway.mode="local"` у вашій конфігурації або повторно запустіть `openclaw onboard --mode local` / `openclaw setup`, щоб знову проставити очікувану конфігурацію локального режиму. Якщо ви запускаєте OpenClaw через Podman, типовий шлях до конфігурації — `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → non-loopback bind без коректного шляху auth gateway (token/password або trusted-proxy, якщо налаштовано).
    - `another gateway instance is already listening` / `EADDRINUSE` → конфлікт порту.
    - `Other gateway-like services detected (best effort)` → існують застарілі або паралельні одиниці launchd/systemd/schtasks. У більшості конфігурацій слід тримати один gateway на машину; якщо вам дійсно потрібно більше одного, ізолюйте порти + config/state/workspace. Див. [/gateway#multiple-gateways-same-host](/uk/gateway#multiple-gateways-same-host).
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Фонове виконання та process tool](/uk/gateway/background-process)
- [Конфігурація](/uk/gateway/configuration)
- [Doctor](/uk/gateway/doctor)

## Gateway відновив останню коректну конфігурацію

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
- Файл `openclaw.json.clobbered.*` з часовою міткою поруч з активною конфігурацією
- Подію системи main-agent, що починається з `Config recovery warning`

<AccordionGroup>
  <Accordion title="Що сталося">
    - Відхилена конфігурація не пройшла валідацію під час запуску або гарячого перезавантаження.
    - OpenClaw зберіг відхилений payload як `.clobbered.*`.
    - Активну конфігурацію було відновлено з останньої перевіреної last-known-good копії.
    - Наступний крок main-agent отримує попередження не переписувати сліпо відхилену конфігурацію.
    - Якщо всі проблеми валідації були в `plugins.entries.<id>...`, OpenClaw не відновлював би весь файл. Локальні збої plugin залишаються помітними, тоді як не пов’язані налаштування користувача лишаються в активній конфігурації.
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
    - Існує `.clobbered.*` → було відновлено зовнішнє пряме редагування або читання під час запуску.
    - Існує `.rejected.*` → запис конфігурації, який належав OpenClaw, не пройшов schema або перевірки clobber перед комітом.
    - `Config write rejected:` → запис намагався прибрати обов’язкову структуру, різко зменшити файл або зберегти невалідну конфігурацію.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` або `size-drop-vs-last-good:*` → під час запуску поточний файл було розцінено як clobbered, бо він втратив поля або розмір порівняно з резервною last-known-good копією.
    - `Config last-known-good promotion skipped` → кандидат містив редаговані заповнювачі секретів, такі як `***`.
  </Accordion>
  <Accordion title="Варіанти виправлення">
    1. Залиште відновлену активну конфігурацію, якщо вона правильна.
    2. Скопіюйте лише потрібні ключі з `.clobbered.*` або `.rejected.*`, а потім застосуйте їх через `openclaw config set` або `config.patch`.
    3. Перед перезапуском виконайте `openclaw config validate`.
    4. Якщо редагуєте вручну, зберігайте повну конфігурацію JSON5, а не лише частковий об’єкт, який хотіли змінити.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Config](/uk/cli/config)
- [Конфігурація: гаряче перезавантаження](/uk/gateway/configuration#config-hot-reload)
- [Конфігурація: сувора валідація](/uk/gateway/configuration#strict-validation)
- [Doctor](/uk/gateway/doctor)

## Попередження probe Gateway

Використовуйте це, коли `openclaw gateway probe` до чогось дістається, але все одно друкує блок попередження.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Шукайте таке:

- `warnings[].code` і `primaryTargetId` у JSON-виводі.
- Чи стосується попередження SSH fallback, кількох gateway, відсутніх scope або нерозв’язаних auth ref.

Поширені сигнатури:

- `SSH tunnel failed to start; falling back to direct probes.` → налаштування SSH не вдалося, але команда все одно спробувала прямі налаштовані/loopback-цілі.
- `multiple reachable gateways detected` → відповіла більш ніж одна ціль. Зазвичай це означає навмисне налаштування кількох gateway або застарілі/дубльовані listeners.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → підключення спрацювало, але детальний RPC обмежено scope; виконайте pairing ідентичності пристрою або використайте credentials з `operator.read`.
- `Capability: pairing-pending` або `gateway closed (1008): pairing required` → gateway відповів, але цьому клієнту все ще потрібен pairing/схвалення перед звичайним доступом operator.
- нерозв’язане попередження SecretRef у тексті `gateway.auth.*` / `gateway.remote.*` → матеріал auth був недоступний на цьому шляху команди для збійної цілі.

Пов’язане:

- [Gateway](/uk/cli/gateway)
- [Кілька gateway на одному хості](/uk/gateway#multiple-gateways-same-host)
- [Віддалений доступ](/uk/gateway/remote)

## Канал підключено, але повідомлення не проходять

Якщо стан каналу — connected, але передавання повідомлень не працює, зосередьтеся на політиці, дозволах і правилах доставлення, специфічних для каналу.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Шукайте таке:

- Політика DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist групи та вимоги до згадок.
- Відсутні дозволи/scopes API каналу.

Поширені сигнатури:

- `mention required` → повідомлення ігнорується політикою згадки в групі.
- `pairing` / сліди очікування схвалення → відправника не схвалено.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → проблема auth/дозволів каналу.

Пов’язане:

- [Усунення несправностей каналів](/uk/channels/troubleshooting)
- [Discord](/uk/channels/discord)
- [Telegram](/uk/channels/telegram)
- [WhatsApp](/uk/channels/whatsapp)

## Доставка Cron і Heartbeat

Якщо Cron або Heartbeat не запустилися чи не були доставлені, спочатку перевірте стан планувальника, а потім ціль доставлення.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Шукайте таке:

- Cron увімкнено й присутній наступний запуск.
- Стан історії запусків завдання (`ok`, `skipped`, `error`).
- Причини пропуску Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Поширені сигнатури">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron вимкнено.
    - `cron: timer tick failed` → збій tick планувальника; перевірте помилки файлів/журналів/середовища виконання.
    - `heartbeat skipped` з `reason=quiet-hours` → поза вікном активних годин.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожні рядки / markdown-заголовки, тому OpenClaw пропускає виклик моделі.
    - `heartbeat skipped` з `reason=no-tasks-due` → `HEARTBEAT.md` містить блок `tasks:`, але на цей tick жодне завдання не заплановане.
    - `heartbeat: unknown accountId` → недійсний id облікового запису для цілі доставлення Heartbeat.
    - `heartbeat skipped` з `reason=dm-blocked` → ціль Heartbeat була визначена як призначення у стилі DM, тоді як `agents.defaults.heartbeat.directPolicy` (або перевизначення для конкретного agent) установлено в `block`.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)
- [Заплановані завдання: усунення несправностей](/uk/automation/cron-jobs#troubleshooting)

## Node paired, але tool не працює

Якщо Node paired, але tools не працюють, ізолюйте стан foreground, дозволів і схвалення.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Шукайте таке:

- Node online з очікуваними capabilities.
- Надані дозволи ОС для camera/mic/location/screen.
- Стан схвалень exec і allowlist.

Поширені сигнатури:

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок Node має бути на передньому плані.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → бракує дозволу ОС.
- `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано через allowlist.

Пов’язане:

- [Схвалення exec](/uk/tools/exec-approvals)
- [Усунення несправностей Node](/uk/nodes/troubleshooting)
- [Nodes](/uk/nodes/index)

## Помилка browser tool

Використовуйте це, коли дії browser tool не працюють, хоча сам gateway справний.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Шукайте таке:

- Чи встановлено `plugins.allow` і чи містить він `browser`.
- Коректний шлях до виконуваного файла browser.
- Досяжність профілю CDP.
- Доступність локального Chrome для профілів `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Сигнатури plugin / виконуваного файла">
    - `unknown command "browser"` або `unknown command 'browser'` → вбудований browser plugin виключено через `plugins.allow`.
    - browser tool відсутній / недоступний, хоча `browser.enabled=true` → `plugins.allow` виключає `browser`, тому plugin так і не завантажився.
    - `Failed to start Chrome CDP on port` → не вдалося запустити процес browser.
    - `browser.executablePath not found` → налаштований шлях недійсний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему, наприклад `file:` або `ftp:`.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний або позадіапазонний порт.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → поточна інсталяція gateway не має вбудованої runtime-залежності `playwright-core` для browser plugin; виконайте `openclaw doctor --fix`, а потім перезапустіть gateway. ARIA snapshots і базові знімки сторінки все ще можуть працювати, але навігація, AI-знімки, знімки елементів за CSS-селекторами та експорт PDF залишаються недоступними.
  </Accordion>
  <Accordion title="Сигнатури Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session Chrome MCP ще не зміг під’єднатися до вибраного каталогу даних browser. Відкрийте сторінку інспектування browser, увімкніть remote debugging, залиште browser відкритим, схваліть перший запит на підключення, а потім повторіть спробу. Якщо стан входу не потрібен, віддайте перевагу керованому профілю `openclaw`.
    - `No Chrome tabs found for profile="user"` → профіль підключення Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштований віддалений endpoint CDP недосяжний з хоста gateway.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль лише для приєднання не має досяжної цілі, або HTTP endpoint відповів, але WebSocket CDP усе одно не вдалося відкрити.
  </Accordion>
  <Accordion title="Сигнатури element / screenshot / upload">
    - `fullPage is not supported for element screenshots` → запит screenshot змішав `--full-page` з `--ref` або `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → виклики screenshot для Chrome MCP / `existing-session` мають використовувати захоплення сторінки або `--ref` зі snapshot, а не CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks завантаження у Chrome MCP потребують refs зі snapshot, а не CSS selectors.
    - `existing-session file uploads currently support one file at a time.` → для профілів Chrome MCP надсилайте одне завантаження за виклик.
    - `existing-session dialog handling does not support timeoutMs.` → hooks діалогів у профілях Chrome MCP не підтримують перевизначення timeout.
    - `existing-session type does not support timeoutMs overrides.` → не використовуйте `timeoutMs` для `act:type` у профілях `profile="user"` / existing-session Chrome MCP, або використовуйте керований/CDP-профіль browser, якщо потрібен власний timeout.
    - `existing-session evaluate does not support timeoutMs overrides.` → не використовуйте `timeoutMs` для `act:evaluate` у профілях `profile="user"` / existing-session Chrome MCP, або використовуйте керований/CDP-профіль browser, якщо потрібен власний timeout.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` поки що потребує керованого browser або сирого профілю CDP.
    - застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну сесію керування та скинути стан емуляції Playwright/CDP без перезапуску всього gateway.
  </Accordion>
</AccordionGroup>

Пов’язане:

- [Browser (керований OpenClaw)](/uk/tools/browser)
- [Усунення несправностей browser](/uk/tools/browser-linux-troubleshooting)

## Якщо ви оновилися і щось раптово зламалося

Більшість збоїв після оновлення — це дрейф конфігурації або жорсткіші значення за замовчуванням, які тепер примусово застосовуються.

<AccordionGroup>
  <Accordion title="1. Змінилася поведінка auth і перевизначення URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Що перевірити:

    - Якщо `gateway.mode=remote`, виклики CLI можуть бути спрямовані на remote, тоді як ваш локальний сервіс працює нормально.
    - Явні виклики `--url` не використовують fallback до збережених credentials.

    Поширені сигнатури:

    - `gateway connect failed:` → неправильний URL цілі.
    - `unauthorized` → endpoint досяжний, але auth неправильна.

  </Accordion>
  <Accordion title="2. Захист bind і auth став суворішим">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Що перевірити:

    - Non-loopback bind (`lan`, `tailnet`, `custom`) потребують коректного шляху auth gateway: спільної auth через token/password або правильно налаштованого non-loopback розгортання `trusted-proxy`.
    - Старі ключі на кшталт `gateway.token` не замінюють `gateway.auth.token`.

    Поширені сигнатури:

    - `refusing to bind gateway ... without auth` → non-loopback bind без коректного шляху auth gateway.
    - `Connectivity probe: failed` при запущеному runtime → gateway працює, але недоступний з поточними auth/url.

  </Accordion>
  <Accordion title="3. Змінився стан pairing та ідентичності пристрою">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Що перевірити:

    - Очікувані схвалення пристроїв для dashboard/nodes.
    - Очікувані схвалення pairing для DM після зміни політики або ідентичності.

    Поширені сигнатури:

    - `device identity required` → auth пристрою не виконано.
    - `pairing required` → відправник/пристрій має бути схвалений.

  </Accordion>
</AccordionGroup>

Якщо конфігурація сервісу і runtime все ще не збігаються після перевірок, перевстановіть метадані сервісу з того самого каталогу profile/state:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Пов’язане:

- [Автентифікація](/uk/gateway/authentication)
- [Фонове виконання та process tool](/uk/gateway/background-process)
- [Pairing під керуванням Gateway](/uk/gateway/pairing)

## Пов’язане

- [Doctor](/uk/gateway/doctor)
- [FAQ](/uk/help/faq)
- [Runbook Gateway](/uk/gateway)
