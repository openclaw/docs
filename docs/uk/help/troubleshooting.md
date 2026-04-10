---
read_when:
    - OpenClaw не працює, і вам потрібен найшвидший шлях до виправлення
    - Вам потрібен процес первинної діагностики, перш ніж переходити до детальних інструкцій
summary: Центр усунення несправностей OpenClaw за симптомами
title: Загальне усунення несправностей
x-i18n:
    generated_at: "2026-04-10T20:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16b38920dbfdc8d4a79bbb5d6fab2c67c9f218a97c36bb4695310d7db9c4614a
    source_path: help/troubleshooting.md
    workflow: 15
---

# Усунення несправностей

Якщо у вас є лише 2 хвилини, використайте цю сторінку як початкову точку діагностики.

## Перші 60 секунд

Запустіть цю точну послідовність команд у вказаному порядку:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Хороший результат в одному рядку:

- `openclaw status` → показує налаштовані канали та відсутність очевидних помилок автентифікації.
- `openclaw status --all` → повний звіт наявний і ним можна поділитися.
- `openclaw gateway probe` → очікувана ціль gateway доступна (`Reachable: yes`). `RPC: limited - missing scope: operator.read` означає погіршену діагностику, а не збій підключення.
- `openclaw gateway status` → `Runtime: running` і `RPC probe: ok`.
- `openclaw doctor` → немає блокувальних помилок конфігурації або сервісу.
- `openclaw channels status --probe` → доступний gateway повертає поточний
  стан транспорту для кожного облікового запису разом із результатами probe/audit, такими як `works` або `audit ok`; якщо
  gateway недоступний, команда переходить до зведень лише за конфігурацією.
- `openclaw logs --follow` → стабільна активність, без повторюваних фатальних помилок.

## Anthropic long context 429

Якщо ви бачите:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
перейдіть до [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Локальний OpenAI-compatible бекенд працює напряму, але не працює в OpenClaw

Якщо ваш локальний або самостійно розміщений `/v1` бекенд відповідає на малі прямі
перевірки `/v1/chat/completions`, але завершується помилкою в `openclaw infer model run` або під час звичайних
ходів агента:

1. Якщо помилка згадує, що `messages[].content` очікує рядок, встановіть
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Якщо бекенд усе ще не працює лише під час ходів агента OpenClaw, встановіть
   `models.providers.<provider>.models[].compat.supportsTools: false` і повторіть спробу.
3. Якщо крихітні прямі виклики все ще працюють, але більші запити OpenClaw призводять до збою
   бекенда, розглядайте решту проблеми як обмеження моделі/сервера на стороні джерела
   і перейдіть до детальної інструкції:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Не вдається встановити плагін через відсутні openclaw extensions

Якщо встановлення завершується помилкою `package.json missing openclaw.extensions`, пакет плагіна
використовує стару структуру, яку OpenClaw більше не приймає.

Виправлення в пакеті плагіна:

1. Додайте `openclaw.extensions` до `package.json`.
2. Спрямуйте записи на зібрані runtime-файли (зазвичай `./dist/index.js`).
3. Повторно опублікуйте плагін і знову виконайте `openclaw plugins install <package>`.

Приклад:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Довідка: [Архітектура плагінів](/uk/plugins/architecture)

## Дерево рішень

```mermaid
flowchart TD
  A[OpenClaw не працює] --> B{Що ламається першим}
  B --> C[Немає відповідей]
  B --> D[Dashboard або Control UI не підключається]
  B --> E[Gateway не запускається або сервіс не запущено]
  B --> F[Канал підключається, але повідомлення не проходять]
  B --> G[Cron або heartbeat не спрацював чи не доставив]
  B --> H[Node з'єднано, але інструмент camera canvas screen exec не працює]
  B --> I[Не працює інструмент браузера]

  C --> C1[/Розділ Немає відповідей/]
  D --> D1[/Розділ Control UI/]
  E --> E1[/Розділ Gateway/]
  F --> F1[/Розділ Потік каналу/]
  G --> G1[/Розділ Автоматизація/]
  H --> H1[/Розділ Інструменти node/]
  I --> I1[/Розділ Браузер/]
```

<AccordionGroup>
  <Accordion title="Немає відповідей">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Хороший результат виглядає так:

    - `Runtime: running`
    - `RPC probe: ok`
    - Ваш канал показує підключений транспорт і, де це підтримується, `works` або `audit ok` у `channels status --probe`
    - Відправника показано як схваленого (або політика DM є відкритою/зі списком дозволених)

    Поширені сигнатури в логах:

    - `drop guild message (mention required` → обмеження за згадкою заблокувало повідомлення в Discord.
    - `pairing request` → відправник не схвалений і очікує схвалення DM pairing.
    - `blocked` / `allowlist` у логах каналу → відправник, кімната або група відфільтровані.

    Детальні сторінки:

    - [/gateway/troubleshooting#no-replies](/uk/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/uk/channels/troubleshooting)
    - [/channels/pairing](/uk/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard або Control UI не підключається">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Хороший результат виглядає так:

    - `Dashboard: http://...` показано в `openclaw gateway status`
    - `RPC probe: ok`
    - У логах немає циклу автентифікації

    Поширені сигнатури в логах:

    - `device identity required` → HTTP/незахищений контекст не може завершити автентифікацію пристрою.
    - `origin not allowed` → `Origin` браузера не дозволений для цілі gateway у Control UI.
    - `AUTH_TOKEN_MISMATCH` із підказками повторної спроби (`canRetryWithDeviceToken=true`) → одна повторна спроба з довіреним токеном пристрою може виконуватися автоматично.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із прив’язаним
      токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають
      свій запитаний набір scope.
    - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого
      `{scope, ip}` серіалізуються до того, як limiter фіксує збій, тож
      друга одночасна невдала повторна спроба вже може показати `retry later`.
    - `too many failed authentication attempts (retry later)` з браузерного origin localhost → повторні
      невдалі спроби з того самого `Origin` тимчасово блокуються; інший origin localhost використовує окремий bucket.
    - повторювані `unauthorized` після цієї повторної спроби → неправильний токен/пароль, невідповідність режиму автентифікації або застарілий токен прив’язаного пристрою.
    - `gateway connect failed:` → UI націлений на неправильний URL/порт або gateway недоступний.

    Детальні сторінки:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/uk/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/uk/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway не запускається або сервіс встановлено, але він не запущений">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Хороший результат виглядає так:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `RPC probe: ok`

    Поширені сигнатури в логах:

    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → режим gateway є remote, або у файлі конфігурації відсутня позначка локального режиму, і його слід відновити.
    - `refusing to bind gateway ... without auth` → прив’язування не до loopback без дійсного шляху автентифікації gateway (токен/пароль або trusted-proxy, якщо налаштовано).
    - `another gateway instance is already listening` або `EADDRINUSE` → порт уже зайнято.

    Детальні сторінки:

    - [/gateway/troubleshooting#gateway-service-not-running](/uk/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/uk/gateway/background-process)
    - [/gateway/configuration](/uk/gateway/configuration)

  </Accordion>

  <Accordion title="Канал підключається, але повідомлення не проходять">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Хороший результат виглядає так:

    - Транспорт каналу підключений.
    - Перевірки pairing/allowlist проходять.
    - Згадки виявляються там, де це потрібно.

    Поширені сигнатури в логах:

    - `mention required` → обмеження за згадкою в групі заблокувало обробку.
    - `pairing` / `pending` → відправник DM ще не схвалений.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → проблема з токеном дозволів каналу.

    Детальні сторінки:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/uk/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/uk/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron або heartbeat не спрацював чи не доставив">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Хороший результат виглядає так:

    - `cron.status` показує, що його ввімкнено, і вказує наступне пробудження.
    - `cron runs` показує нещодавні записи `ok`.
    - Heartbeat увімкнено, і він не поза активними годинами.

    Поширені сигнатури в логах:

    - `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
    - `heartbeat skipped` з `reason=quiet-hours` → поза налаштованими активними годинами.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожній каркас або лише заголовки.
    - `heartbeat skipped` з `reason=no-tasks-due` → режим завдань `HEARTBEAT.md` активний, але жоден із інтервалів завдань ще не настав.
    - `heartbeat skipped` з `reason=alerts-disabled` → усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені).
    - `requests-in-flight` → основна лінія зайнята; пробудження heartbeat було відкладено.
    - `unknown accountId` → цільовий обліковий запис доставки heartbeat не існує.

    Детальні сторінки:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/uk/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/uk/gateway/heartbeat)

    </Accordion>

    <Accordion title="Node з'єднано, але інструмент не працює: camera canvas screen exec">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Хороший результат виглядає так:

      - Node вказано як підключений і прив’язаний для ролі `node`.
      - Для команди, яку ви викликаєте, наявна capability.
      - Для інструмента надано потрібний стан дозволів.

      Поширені сигнатури в логах:

      - `NODE_BACKGROUND_UNAVAILABLE` → переведіть застосунок node на передній план.
      - `*_PERMISSION_REQUIRED` → дозвіл ОС було відхилено або його бракує.
      - `SYSTEM_RUN_DENIED: approval required` → схвалення exec очікує підтвердження.
      - `SYSTEM_RUN_DENIED: allowlist miss` → команда відсутня у списку дозволених для exec.

      Детальні сторінки:

      - [/gateway/troubleshooting#node-paired-tool-fails](/uk/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/uk/nodes/troubleshooting)
      - [/tools/exec-approvals](/uk/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec раптом почав вимагати схвалення">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      Що змінилося:

      - Якщо `tools.exec.host` не задано, значенням за замовчуванням є `auto`.
      - `host=auto` розв’язується в `sandbox`, коли активне sandbox runtime, і в `gateway` у протилежному разі.
      - `host=auto` відповідає лише за маршрутизацію; поведінка "YOLO" без запиту зумовлюється `security=full` разом із `ask=off` на gateway/node.
      - У `gateway` і `node` незадане `tools.exec.security` за замовчуванням має значення `full`.
      - Незадане `tools.exec.ask` за замовчуванням має значення `off`.
      - Результат: якщо ви бачите схвалення, якийсь локальний для хоста або для сеансу policy посилив exec порівняно з поточними значеннями за замовчуванням.

      Відновити поточну типову поведінку без схвалення:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Безпечніші альтернативи:

      - Встановіть лише `tools.exec.host=gateway`, якщо вам потрібна просто стабільна маршрутизація хоста.
      - Використовуйте `security=allowlist` разом із `ask=on-miss`, якщо хочете виконання на хості, але все ще бажаєте перевірку у випадках промаху по allowlist.
      - Увімкніть режим sandbox, якщо хочете, щоб `host=auto` знову розв’язувався в `sandbox`.

      Поширені сигнатури в логах:

      - `Approval required.` → команда очікує на `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → очікує схвалення для node-host exec.
      - `exec host=sandbox requires a sandbox runtime for this session` → неявно або явно вибрано sandbox, але режим sandbox вимкнено.

      Детальні сторінки:

      - [/tools/exec](/uk/tools/exec)
      - [/tools/exec-approvals](/uk/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/uk/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="Не працює інструмент браузера">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      Хороший результат виглядає так:

      - Статус браузера показує `running: true` і вибраний браузер/профіль.
      - `openclaw` запускається, або `user` може бачити локальні вкладки Chrome.

      Поширені сигнатури в логах:

      - `unknown command "browser"` або `unknown command 'browser'` → задано `plugins.allow`, і воно не містить `browser`.
      - `Failed to start Chrome CDP on port` → не вдалося запустити локальний Chrome CDP на порту.
      - `browser.executablePath not found` → указаний шлях до виконуваного файла неправильний.
      - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему.
      - `browser.cdpUrl has invalid port` → налаштований URL CDP має неправильний або неприпустимий порт.
      - `No Chrome tabs found for profile="user"` → у профілі приєднання Chrome MCP немає відкритих локальних вкладок Chrome.
      - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недоступна з цього хоста.
      - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль attach-only не має живої цілі CDP.
      - застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активний сеанс керування й скинути стан емуляції без перезапуску gateway.

      Детальні сторінки:

      - [/gateway/troubleshooting#browser-tool-fails](/uk/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/uk/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — поширені запитання
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting) — проблеми, пов’язані з gateway
- [Doctor](/uk/gateway/doctor) — автоматизовані перевірки стану та виправлення
- [Усунення несправностей каналів](/uk/channels/troubleshooting) — проблеми з підключенням каналів
- [Усунення несправностей автоматизації](/uk/automation/cron-jobs#troubleshooting) — проблеми з cron і heartbeat
