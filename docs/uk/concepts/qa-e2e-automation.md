---
read_when:
    - Розуміння того, як узгоджуються компоненти стеку QA
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання сценаріїв QA на основі репозиторію
    - Створення QA-автоматизації з вищою реалістичністю навколо панелі Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії з репозиторійною підтримкою, live transport lanes, транспортні адаптери та звітування.'
title: Огляд QA
x-i18n:
    generated_at: "2026-07-01T08:29:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у реалістичніший,
канально-орієнтований спосіб, ніж це може зробити один unit-тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, потоку,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача і шина QA для спостереження за транскриптом,
  інжектування вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні плагіни раннера: адаптери live-транспорту, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання і базових
  сценаріїв QA.
- [Mantis](/uk/concepts/mantis): перевірка до і після live-верифікації для помилок, яким
  потрібні реальні транспорти, скриншоти браузера, стан VM і PR-докази.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA без `--qa-profile`; раннер профілю зрілості на основі таксономії з `--qa-profile smoke-ci`, `--qa-profile release` або `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Запустити сценарії з репозиторію проти лінії QA Gateway. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Вивести інвентар покриття YAML-сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                               |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати агентний звіт паритету або використати `--runtime-axis --token-efficiency`, щоб записати звіти паритету runtime Codex-vs-OpenClaw і ефективності токенів з одного підсумку пари runtime.                                         |
| `qa character-eval`                                 | Запустити character QA-сценарій на кількох live-моделях зі звітом оцінювання. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запустити одноразовий промпт проти вибраної лінії провайдера/моделі.                                                                                                                                                                                                          |
| `qa ui`                                             | Запустити UI налагоджувача QA і локальну шину QA (аліас: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений Docker-образ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA-дашборда + лінії Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Зібрати QA-сайт, запустити Docker-backed стек, вивести URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запустити лише сервер провайдера AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише сервер провайдера `mock-openai`, що враховує сценарії.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Лінія live-транспорту проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Лінія live-транспорту проти реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Лінія live-транспорту проти реального приватного каналу гільдії Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Лінія live-транспорту проти реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Лінія live-транспорту проти реальних облікових записів WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Раннер перевірки до і після для помилок live-транспорту, з доказами статус-реакцій Discord, desktop/browser smoke Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis) і [Runbook Mantis Slack Desktop](/uk/concepts/mantis-slack-desktop-runbook). |

`qa run` на основі профілю читає належність із `taxonomy.yaml`, а потім передає
розв'язані сценарії через `qa suite`. `--surface` і
`--category` фільтрують вибраний профіль замість визначення окремих ліній.
Отриманий `qa-evidence.json` містить підсумок scorecard профілю з
кількістю вибраних категорій і відсутніми ID покриття; окремі записи доказів
залишаються джерелом істини для тестів, ролей покриття і результатів.
ID покриття функцій таксономії є точними цілями доказів, а не псевдонімами. Первинне
покриття сценаріїв виконує відповідні ID; вторинне покриття залишається дорадчим.
ID покриття використовують форму з крапками `namespace.behavior` із сегментами
нижнього регістру з літер/цифр/дефісів; ID профілю, поверхні та категорії все ще можуть використовувати
наявні дефісні або крапкові ID таксономії.
Стислі докази опускають `execution` для кожного запису і встановлюють `evidenceMode: "slim"`;
`smoke-ci` типово використовує стислий режим, а `--evidence-mode full` відновлює повні записи:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Використовуйте `smoke-ci` для детермінованого доказу профілю з mock-провайдерами моделей і
локальними серверами провайдерів Crabline. Використовуйте `release` для доказу Stable/LTS проти live
каналів. Використовуйте `all` лише для явних запусків доказів повної таксономії; він вибирає
кожну активну категорію зрілості й може передаватися через workflow `QA Profile
Evidence` з `qa_profile=all`. Коли команді також потрібен кореневий профіль OpenClaw,
розмістіть кореневий профіль перед командою QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Потік оператора

Поточний потік оператора QA — це двопанельний QA-сайт:

- Ліворуч: дашборд Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Docker-backed лінію Gateway і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати за реальною поведінкою каналу і записати, що спрацювало, що не вдалося або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без повторної збірки Docker-образу щоразу
запустіть стек із bind-mounted бандлом QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі й bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей бандл при зміні, а браузер автоматично перезавантажується, коли змінюється
хеш ресурсів QA Lab.

Для локального OpenTelemetry signal smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP receiver, виконує QA-сценарій `otel-trace-smoke`
з увімкненим плагіном `diagnostics-otel`, а потім перевіряє, що трасування,
метрики й логи експортовано. Він декодує експортовані protobuf trace spans
і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, span виклику моделі за найновішою GenAI semantic-convention,
`openclaw.context.assembled` і `openclaw.message.delivery`
мають бути присутні. Smoke примусово встановлює
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, тому span виклику моделі
має використовувати назву `{gen_ai.operation.name} {gen_ai.request.model}`;
виклики моделі не мають експортувати `StreamAbandoned` на успішних ходах; сирі diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза трасуванням. Сирі OTLP
payloads не мають містити prompt sentinel, response sentinel або ключ QA-сесії.
Він записує `otel-smoke-summary.json` поруч з артефактами QA suite.

Для OpenTelemetry smoke з collector запустіть:

```bash
pnpm qa:otel:collector-smoke
```

Ця лінія ставить реальний Docker-контейнер OpenTelemetry Collector перед
тим самим локальним receiver. Використовуйте її, коли змінюєте підключення endpoint,
сумісність collector або поведінку експорту OTLP, яку in-process receiver міг би замаскувати.

Для захищеного Prometheus scrape smoke запустіть:

```bash
pnpm qa:prometheus:smoke
```

Цей псевдонім запускає QA-сценарій `docker-prometheus-smoke` з увімкненим
`diagnostics-prometheus`, перевіряє, що неавтентифіковані scrapes відхиляються,
а потім перевіряє, що автентифікований scrape містить критично важливі для релізу
сімейства метрик без вмісту промптів, вмісту відповідей, сирих діагностичних
ідентифікаторів, токенів автентифікації або локальних шляхів.

Щоб запустити обидва observability-smoke послідовно, використайте:

```bash
pnpm qa:observability:smoke
```

Для OpenTelemetry-лінії з колектором і захищеного Prometheus scrape smoke,
використайте:

```bash
pnpm qa:observability:collector-smoke
```

Observability QA залишається доступним лише з вихідного checkout. npm tarball
навмисно не містить QA Lab, тому package Docker release lanes не запускають
команди `qa`. Використовуйте `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`
або `pnpm qa:observability:smoke` зі зібраного вихідного checkout під час зміни
інструментації діагностики.

Для транспортно-реальної Matrix smoke-лінії, яка не потребує облікових даних
model-provider, запустіть швидкий профіль із детермінованим mock OpenAI provider:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Для live-frontier provider lane явно надайте OpenAI-сумісні облікові дані:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і структура артефактів для цієї лінії містяться в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він розгортає одноразовий Tuwunel homeserver у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає справжній Matrix plugin усередині дочірнього QA gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-підсумок, артефакт observed-events і об’єднаний журнал виводу в `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії покривають транспортну поведінку, яку unit-тести не можуть довести end to end: mention gating, allow-bot policies, allowlists, top-level і threaded replies, DM routing, reaction handling, inbound edit suppression, restart replay dedupe, homeserver interruption recovery, approval metadata delivery, media handling, а також потоки Matrix E2EE bootstrap/recovery/verification. Профіль E2EE CLI також проганяє `openclaw matrix encryption setup` і команди verification через той самий одноразовий homeserver перед перевіркою відповідей gateway.

Discord також має Mantis-only opt-in сценарії для відтворення помилок. Використовуйте
`--scenario discord-status-reactions-tool-only` для явної часової шкали status reaction
або `--scenario discord-thread-reply-filepath-attachment`, щоб створити
справжній Discord thread і перевірити, що `message.thread-reply` зберігає
вкладення `filePath`. Ці сценарії не входять до стандартної live Discord lane,
бо це before/after repro probes, а не широке smoke-покриття.
Thread-attachment Mantis workflow також може додати відео-свідчення Discord Web
від залогіненого користувача, коли `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` або
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` налаштовано в QA
середовищі. Цей viewer profile призначений лише для візуального захоплення; рішення
pass/fail усе одно надходить від Discord REST oracle.

CI використовує ту саму поверхню команд у `.github/workflows/qa-live-transports-convex.yml`.
Заплановані й стандартні ручні запуски виконують швидкий Matrix profile з
QA-наданими live-frontier credentials, `--fast` і
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручний `matrix_profile=all`
розгалужується на п’ять profile shards.

Для транспортно-реальних Telegram, Discord, Slack і WhatsApp smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Вони націлені на попередньо наявний реальний канал із двома ботами або акаунтами (driver + SUT). Обов’язкові env vars, списки сценаріїв, вихідні артефакти й Convex credential pool задокументовані в [довіднику QA для Telegram, Discord, Slack і WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) нижче.

Для повного запуску Slack desktop VM із VNC rescue виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує desktop/browser машину Crabbox, запускає Slack live lane
усередині VM, відкриває Slack Web у VNC browser, захоплює desktop і копіює
`slack-qa/`, `slack-desktop-smoke.png` і `slack-desktop-smoke.mp4`, коли
video capture доступний, назад до каталогу артефактів Mantis. Crabbox
desktop/browser leases заздалегідь надають capture tools і browser/native-build helper
packages, тому сценарій має встановлювати fallback лише на старіших
leases. Mantis повідомляє загальний і пофазний час у
`mantis-slack-desktop-smoke-report.md`, щоб повільні запуски показували, куди
пішов час: lease warmup, credential acquisition, remote setup або artifact copy.
Повторно використовуйте `--lease-id <cbx_...>` після ручного входу в Slack Web
через VNC; повторно використані leases також зберігають теплим pnpm store cache
Crabbox. Стандартний `--hydrate-mode source` перевіряє з вихідного checkout і
запускає install/build усередині VM. Використовуйте `--hydrate-mode prehydrated`
лише коли повторно використаний remote workspace уже має `node_modules` і
зібраний `dist/`; цей режим пропускає дорогий крок install/build і fail closed,
коли workspace не готовий. З `--gateway-setup` Mantis залишає постійний
OpenClaw Slack gateway запущеним усередині VM на порту `38973`; без нього
команда запускає звичайну bot-to-bot Slack QA lane і завершується після
artifact capture.

Щоб довести native Slack approval UI з desktop evidence, запустіть Mantis approval
checkpoint mode:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Цей режим взаємовиключний із `--gateway-setup`. Він запускає Slack
approval scenarios, відхиляє non-approval scenario ids, очікує на кожному pending і
resolved approval state, рендерить спостережене Slack API message у
`approval-checkpoints/<scenario>-pending.png` і
`approval-checkpoints/<scenario>-resolved.png`, а потім завершується з помилкою,
якщо будь-який checkpoint, message evidence, acknowledgement або rendered screenshot
відсутній чи порожній. Cold CI leases усе ще можуть показувати Slack sign-in у
`slack-desktop-smoke.png`; approval checkpoint images є візуальним proof для цієї lane.

Operator checklist, команда GitHub workflow dispatch, evidence-comment
contract, hydrate-mode decision table, timing interpretation і кроки failure
handling містяться в [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook).

Для desktop task у стилі agent/CV запустіть:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` орендує або повторно використовує desktop/browser машину Crabbox,
запускає `crabbox record --while`, керує видимим browser через вкладений
`visual-driver`, захоплює `visual-task.png`, запускає `openclaw infer image describe`
для screenshot, коли вибрано `--vision-mode image-describe`, і записує
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` і `mantis-visual-task-report.md`.
Коли встановлено `--expect-text`, vision prompt запитує структурований JSON
verdict і проходить лише тоді, коли модель повідомляє про позитивні видимі докази;
негативна відповідь, яка лише цитує цільовий текст, провалює assertion.
Використовуйте `--vision-mode metadata` для no-model smoke, що доводить desktop,
browser, screenshot і video plumbing без виклику image-understanding
provider. Recording є обов’язковим артефактом для `visual-task`; якщо Crabbox не
записує непорожній `visual-task.mp4`, завдання завершується з помилкою навіть
коли visual driver пройшов. У разі помилки Mantis зберігає lease для VNC, якщо
завдання ще не пройшло і `--keep-lease` не було встановлено.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє Convex broker env, валідовує налаштування endpoint і перевіряє admin/list reachability, коли присутній maintainer secret. Для secrets він повідомляє лише статус set/missing.

## Live transport coverage

Live transport lanes мають один спільний контракт замість того, щоб кожна вигадувала власну форму списку сценаріїв. `qa-channel` є широким synthetic product-behavior suite і не є частиною live transport coverage matrix.

Live transport runners мають імпортувати спільні scenario ids, baseline
coverage helpers і scenario-selection helper з
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Quote reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

Це зберігає `qa-channel` як широкий product-behavior suite, тоді як Matrix,
Telegram та інші live transports мають один явний transport-contract checklist.

Для одноразової Linux VM lane без залучення Docker до QA path запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий Multipass guest, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA report і
summary назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму scenario-selection behavior, що й `qa suite`
на host. Host і Multipass suite runs за замовчуванням виконують кілька вибраних
сценаріїв паралельно з ізольованими gateway workers. `qa-channel` за замовчуванням
має concurrency 4, обмежену кількістю вибраних сценаріїв. Використовуйте
`--concurrency <count>`, щоб налаштувати worker count, або `--concurrency 1`
для serial execution.
Використовуйте `--pack personal-agent`, щоб запустити personal assistant benchmark pack. Pack
selector є additive з повторюваними прапорцями `--scenario`: explicit scenarios
запускаються першими, потім pack scenarios запускаються в pack order із видаленням
duplicates.
Використовуйте `--pack observability`, коли custom QA runner уже надає
OpenTelemetry collector setup і хоче вибрати OpenTelemetry та Prometheus
diagnostics smoke scenarios разом.
Команда завершується з ненульовим кодом, коли будь-який сценарій не проходить.
Використовуйте `--allow-failures`, коли потрібні артефакти без failing exit code.
Live runs передають підтримувані QA auth inputs, практичні для guest:
env-based provider keys, QA live provider config path і `CODEX_HOME`, коли він
присутній. Тримайте `--output-dir` під коренем репозиторію, щоб guest міг
записувати назад через змонтований workspace.

## Довідник QA для Telegram, Discord, Slack і WhatsApp

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-забезпечення homeserver. Telegram, Discord, Slack і WhatsApp запускаються проти попередньо наявних реальних транспортів, тому їхній довідник розміщено тут.

### Спільні прапорці CLI

Ці смуги реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапорець                             | Типове значення                                    | Опис                                                                                                                                                                |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Запустити лише цей сценарій. Можна повторювати.                                                                                                                     |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Куди записуються звіти, зведення, докази, специфічні для транспорту артефакти та вихідний журнал. Відносні шляхи розв’язуються відносно `--repo-root`.             |
| `--repo-root <path>`                  | `process.cwd()`                                    | Корінь репозиторію під час виклику з нейтрального cwd.                                                                                                              |
| `--sut-account <id>`                  | `sut`                                              | Тимчасовий ідентифікатор облікового запису в конфігурації QA Gateway.                                                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` або `live-frontier` (застарілий `live-openai` усе ще працює).                                                                                         |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                         | Посилання на основну/альтернативну модель.                                                                                                                          |
| `--fast`                              | вимкнено                                           | Швидкий режим провайдера там, де підтримується.                                                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                              | Див. [пул облікових даних Convex](#convex-credential-pool).                                                                                                         |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                     | Роль, що використовується, коли `--credential-source convex`.                                                                                                       |

Кожна смуга завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення як помилкового.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома окремими ботами (драйвер + SUT). SUT-бот має мати ім’я користувача Telegram; спостереження бот-до-бота працює найкраще, коли для обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - числовий ідентифікатор чату (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Сценарії (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Неявний типовий набір завжди охоплює canary, gating згадок, відповіді нативних команд, адресацію команд і групові відповіді бот-до-бота. Типові значення `mock-openai` також включають детерміновані перевірки ланцюжка відповідей і потокової передачі фінального повідомлення. `telegram-current-session-status-tool` залишається опційним, бо він стабільний лише коли запускається в потоці безпосередньо після canary, а не після довільних відповідей нативних команд. Використайте `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, щоб надрукувати поточний поділ типових/опційних сценаріїв із regression refs.

Вихідні артефакти:

- `telegram-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок живого транспорту, включно з полями профілю, покриття, провайдера, каналу, артефактів, результату та RTT.

Пакетні запуски Telegram використовують той самий контракт облікових даних Telegram. Повторне вимірювання RTT є частиною звичайної пакетної живої смуги Telegram; розподіл RTT згортається в `qa-evidence.json` у `result.timing` для вибраної перевірки RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Коли встановлено `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, пакетна жива обгортка орендує облікові дані `kind: "telegram"`, експортує env орендованих групи/драйвера/SUT-бота в запуск установленого пакета, надсилає Heartbeat для оренди та звільняє її під час завершення. Пакетна обгортка типово виконує 20 перевірок RTT для `telegram-mentioned-message-reply`, має 30-секундний тайм-аут RTT і роль Convex `maintainer` поза CI, коли вибрано Convex. Перевизначте `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` або `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, щоб налаштувати вимірювання RTT без створення окремої команди RTT або специфічного для Telegram формату зведення.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний приватний канал гільдії Discord із двома ботами: ботом-драйвером, керованим harness, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Discord plugin. Перевіряє обробку згадок каналу, що SUT-бот зареєстрував нативну команду `/help` у Discord, а також опційні сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - має збігатися з ідентифікатором користувача SUT-бота, поверненим Discord (інакше смуга швидко завершується помилкою).

Опційно:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` вибирає голосовий/stage-канал для `discord-voice-autojoin`; без нього сценарій вибирає перший видимий голосовий/stage-канал для SUT-бота.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - опційний голосовий сценарій. Запускається самостійно, вмикає `channels.discord.voice.autoJoin` і перевіряє, що поточний голосовий стан SUT-бота в Discord є цільовим голосовим/stage-каналом. Облікові дані Discord у Convex можуть містити опційний `voiceChannelId`; інакше runner виявляє перший видимий голосовий/stage-канал у гільдії.
- `discord-status-reactions-tool-only` - опційний сценарій Mantis. Запускається самостійно, бо перемикає SUT у режим постійно ввімкнених відповідей гільдії лише інструментами з `messages.statusReactions.enabled=true`, а потім збирає часову шкалу REST-реакцій плюс візуальні артефакти HTML/PNG. Звіти Mantis до/після також зберігають MP4-артефакти, надані сценарієм, як `baseline.mp4` і `candidate.mp4`.

Запустіть сценарій автоматичного приєднання до голосу Discord явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Запустіть сценарій статусних реакцій Mantis явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Вихідні артефакти:

- `discord-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок живого транспорту.
- `discord-qa-observed-messages.json` - тіла редагуються, якщо не встановлено `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій статусних реакцій.

### QA Slack

```bash
pnpm openclaw qa slack
```

Націлюється на один реальний приватний канал Slack із двома окремими ботами: ботом-драйвером, керованим harness, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Slack plugin.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Опційно:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` вмикає візуальні контрольні точки схвалення для Mantis. Runner записує `<scenario>.pending.json` і `<scenario>.resolved.json`, а потім очікує відповідні файли `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` перевизначає тайм-аут підтвердження контрольної точки. Типове значення — `120000`.

Сценарії (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - опційний сценарій нативного схвалення exec у Slack. Запитує схвалення exec через Gateway, перевіряє, що повідомлення Slack має нативні кнопки схвалення, розв’язує його та перевіряє розв’язане оновлення Slack.
- `slack-approval-plugin-native` - опційний сценарій нативного схвалення plugin у Slack. Вмикає переспрямування схвалень exec і plugin разом, щоб події plugin не пригнічувалися маршрутизацією схвалень exec, а потім перевіряє той самий шлях нативного UI Slack pending/resolved.

Вихідні артефакти:

- `slack-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок живого транспорту.
- `slack-qa-observed-messages.json` - тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - лише коли Mantis встановлює `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; містить JSON контрольних точок, JSON підтверджень і знімки екрана pending/resolved.

#### Налаштування робочого простору Slack

Смузі потрібні дві окремі програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` - ідентифікатор `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; смуга публікує повідомлення під час кожного запуску.
- `driverBotToken` - токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` - токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від драйвера, щоб її ідентифікатор користувача-бота був іншим.
- `sutAppToken` - токен рівня програми (`xapp-...`) програми SUT з `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання виробничого робочого простору.

Наведений нижче маніфест SUT навмисно звужує виробниче встановлення вбудованого Slack plugin (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених живим набором QA Slack. Для налаштування виробничого каналу таким, яким його бачать користувачі, див. [швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо смузі потрібні два різні ідентифікатори користувачів-ботів в одному робочому просторі.

**1. Створіть програму Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть робочий простір QA, вставте наведений нижче маніфест, а потім _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) - це стане `driverBotToken`. Драйверу потрібно лише публікувати повідомлення й ідентифікувати себе; події та Socket Mode не потрібні.

**2. Створіть застосунок SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Цей застосунок QA навмисно використовує вужчу версію виробничого маніфесту вбудованого Slack-плагіна (`extensions/slack/src/setup-shared.ts:10`): області доступу й події для реакцій пропущені, бо live-набір QA для Slack ще не покриває обробку реакцій.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Після того як Slack створить застосунок, виконайте дві дії на його сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → це стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте область доступу `connections:write` → збережіть → скопіюйте значення `xapp-...` → це стане `sutAppToken`.

Переконайтеся, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання одного застосунку для обох одразу зламає фільтрацію згадок.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів із самого каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ - це стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тому читання історії в harness усе одно працюватиме.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші мейнтейнери могли брати їх в оренду.

Для пулу Convex запишіть чотири поля у JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Коли `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` експортовано у вашій shell, зареєструйте й перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте end to end**

Запустіть лінію локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний прогін завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує статус `pass` для `slack-canary` і `slack-mention-gating`. Якщо лінія зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або всі рядки вже орендовані - `qa credentials list --kind slack --status all --json` покаже, що саме.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Цілиться у два спеціальні облікові записи WhatsApp Web: обліковий запис драйвера, яким керує
harness, і обліковий запис SUT, який запускає дочірній OpenClaw gateway через
вбудований плагін WhatsApp.

Обов’язкові змінні середовища, коли використовується `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Необов’язково:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` вмикає групові сценарії, як-от
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, сценарії групових дій, медіа й опитувань, а також
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` зберігає тіла повідомлень в
  артефактах observed-message.

Каталог сценаріїв (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Базова перевірка й групова фільтрація: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Нативні команди: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Поведінка відповідей і фінального виводу: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Дії з повідомленнями на шляху користувача: `whatsapp-agent-message-action-react` починається з
  реального DM від драйвера, дозволяє моделі викликати інструмент `message` і спостерігає
  нативну реакцію WhatsApp. `whatsapp-agent-message-action-upload-file` використовує
  ту саму позицію для `message(action=upload-file)` і спостерігає нативні
  медіа WhatsApp. `whatsapp-group-agent-message-action-react` і
  `whatsapp-group-agent-message-action-upload-file` доводять ті самі видимі для користувача
  дії в реальній групі WhatsApp.
- Груповий fanout: `whatsapp-broadcast-group-fanout` починається з одного згаданого
  повідомлення групи WhatsApp і перевіряє окремі видимі відповіді від `main` і
  `qa-second`.
- Групова активація: `whatsapp-group-activation-always` змінює реальну групову
  сесію на `/activation always`, доводить, що групове повідомлення без згадки будить
  агента, а потім відновлює `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  засіває відповідь бота, надсилає нативну цитовану відповідь на неї без явної
  згадки та перевіряє, що агент прокидається з цього контексту відповіді.
- Вхідні медіа й структуровані повідомлення: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Вони надсилають реальні події WhatsApp із зображеннями, аудіо, документами, локаціями, контактами, стікерами
  та реакціями через драйвер.
- Прямі перевірки контракту Gateway:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Вони навмисно обходять prompting моделі та
  доводять детерміновані контракти Gateway/каналу `send`, `poll` і `message.action`.
- Покриття контролю доступу: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Нативні схвалення: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Реакції статусу: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Наразі каталог містить 50 сценаріїв. Стандартна лінія `live-frontier`
залишається малою - 10 сценаріїв для швидкого smoke-покриття. Стандартна
лінія `mock-openai` запускає 44 детерміновані сценарії через реальний транспорт WhatsApp,
мокаючи лише вивід моделі. Сценарії схвалень і кілька важчих або блокувальних перевірок
залишаються явними за ідентифікатором сценарію.

Драйвер WhatsApp QA спостерігає структуровані live-події (`text`, `media`,
`location`, `reaction` і `poll`) і може активно надсилати медіа, опитування,
контакти, локації та стікери. QA Lab імпортує цей драйвер через
поверхню пакета `@openclaw/whatsapp/api.js`, а не звертається до приватних
runtime-файлів WhatsApp. Для групових спостережень `fromJid` є JID групи, тоді як
`participantJid` і `fromPhoneE164` ідентифікують учасника-відправника. Вміст
повідомлень за замовчуванням редагується. Прямі перевірки Gateway
для опитування, upload-file, медіа, групового опитування, групових медіа й reply-shape є перевірками контракту транспорту/API;
вони не трактуються як доказ того, що користувацький prompt змусив агента вибрати
ту саму дію. Доказ дії на шляху користувача походить зі сценаріїв, як-от
`whatsapp-agent-message-action-react` і
`whatsapp-group-agent-message-action-react`, де драйвер надсилає звичайне
повідомлення WhatsApp, а QA Lab спостерігає отриманий нативний артефакт WhatsApp.
Звіти WhatsApp включають позицію кожного сценарію (`user-path`, `direct-gateway`
або `native-approval`), щоб докази не можна було помилково сприйняти як сильніший контракт,
ніж вони фактично доводять.

Вихідні артефакти:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок live-транспорту.
- `whatsapp-qa-observed-messages.json` - тіла редагуються, якщо не задано `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Пул облікових даних Convex

Лінії Telegram, Discord, Slack і WhatsApp можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає для неї Heartbeat протягом виконання й звільняє її під час завершення. Типи пулу: `"telegram"`, `"discord"`, `"slack"` і `"whatsapp"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` має бути числовим рядком chat-id.
- Реальний користувач Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - лише доказ Mantis Telegram Desktop. Загальні лінії QA Lab не повинні отримувати цей kind.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - номери телефонів мають бути різними рядками E.164.

Робочий процес доказу Mantis Telegram Desktop утримує одну ексклюзивну оренду Convex
`telegram-user` і для TDLib CLI driver, і для свідка Telegram Desktop,
а потім звільняє її після публікації доказу.

Коли PR потребує детермінованого візуального diff, Mantis може використовувати ту саму відповідь mock-моделі
на `main` і на head PR, поки змінюється форматер Telegram або шар доставлення.
Типові параметри захоплення налаштовані для коментарів PR: стандартний клас Crabbox,
запис desktop із 24fps, motion GIF із 24fps і ширина preview 1920px.
Коментарі before/after мають публікувати чистий bundle, що містить лише
потрібні GIF.

Лінії Slack також можуть використовувати pool. Перевірки форми payload Slack наразі живуть у Slack QA runner, а не в broker; використовуйте `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, з id каналу Slack на кшталт `Cxxxxxxxxxx`. Див. [Налаштування workspace Slack](#setting-up-the-slack-workspace) для provisioning app і scope.

Операційні env vars і контракт endpoint Convex broker живуть у [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує multi-channel pool; семантика оренди спільна для всіх kind).

## Seeds із repo

Seed assets живуть у `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
agent.

`qa-lab` має залишатися загальним runner сценаріїв YAML. Кожен YAML-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- top-level `title`
- metadata `scenario`
- необов’язкові metadata category, capability, lane і risk у `scenario`
- refs docs і code у `scenario`
- необов’язкові requirements Plugin у `scenario`
- необов’язковий patch config Gateway у `scenario`
- виконуваний top-level `flow` для flow-сценаріїв або `scenario.execution.kind` /
  `scenario.execution.path` для сценаріїв Vitest і Playwright

Повторно використовувана runtime-поверхня, на якій базується `flow`, може залишатися загальною
і наскрізною. Наприклад, YAML-сценарії можуть поєднувати helpers транспортного боку
з helpers браузерного боку, які керують вбудованим Control UI через
seam Gateway `browser.request` без додавання special-case runner.

Файли сценаріїв слід групувати за product capability, а не за папкою source tree.
Зберігайте scenario IDs стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для traceability реалізації.

Baseline-список має залишатися достатньо широким, щоб покривати:

- DM і channel chat
- поведінку thread
- lifecycle message action
- callbacks cron
- memory recall
- перемикання model
- handoff subagent
- читання repo і docs
- одне невелике build-завдання, таке як Lobster Invaders

## Лінії provider mock

`qa suite` має дві локальні лінії provider mock:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається типовою
  детермінованою mock-лінією для repo-backed QA і parity gates.
- `aimock` запускає provider server на базі AIMock для експериментального protocol,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює dispatcher сценаріїв `mock-openai`.

Реалізація provider-lane живе в `extensions/qa-lab/src/providers/`.
Кожен provider володіє своїми defaults, запуском local server, config model Gateway,
потребами staging auth-profile і flags live/mock capability. Спільний код suite і
gateway має маршрутизувати через registry provider, а не розгалужуватися за
іменами provider.

## Transport adapters

`qa-lab` володіє загальним transport seam для YAML QA scenarios. `qa-channel` є
синтетичним default. `crabline` запускає локальні provider-shaped servers і виконує
звичайні channel plugins OpenClaw проти них. `live` зарезервовано для реальних
облікових даних provider і зовнішніх channels.

На рівні архітектури поділ такий:

- `qa-lab` володіє загальним виконанням scenario, concurrency worker, записом artifacts і reporting.
- Transport adapter володіє config Gateway, readiness, inbound і outbound observation, transport actions і нормалізованим transport state.
- YAML scenario files у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає повторно використовувану runtime-поверхню, яка їх виконує.

### Додавання channel

Додавання channel до YAML QA system потребує реалізації channel плюс
scenario pack, який перевіряє контракт channel. Для smoke CI coverage додайте
відповідний local provider server Crabline і expose його через driver `crabline`.

Не додавайте новий top-level QA command root, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільною host-механікою:

- command root `openclaw qa`
- startup і teardown suite
- worker concurrency
- запис artifact
- генерація report
- виконання scenario
- compatibility aliases для старіших scenarios `qa-channel`

Runner plugins володіють transport contract:

- як `openclaw qa <runner>` mount під спільним root `qa`
- як gateway configured для цього transport
- як перевіряється readiness
- як inject inbound events
- як observe outbound messages
- як expose transcripts і normalized transport state
- як виконуються transport-backed actions
- як обробляється transport-specific reset або cleanup

Мінімальна планка adoption для нового channel:

1. Залиште `qa-lab` власником спільного root `qa`.
2. Реалізуйте transport runner на shared host seam `qa-lab`.
3. Тримайте transport-specific mechanics всередині runner plugin або channel harness.
4. Mount runner як `openclaw qa <runner>` замість реєстрації конкурентної root command. Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте YAML scenarios у themed directories `qa/scenarios/`.
6. Використовуйте generic scenario helpers для нових scenarios.
7. Зберігайте наявні compatibility aliases робочими, якщо repo не виконує intentional migration.

Правило ухвалення рішення суворе:

- Якщо behavior можна виразити один раз у `qa-lab`, помістіть його в `qa-lab`.
- Якщо behavior залежить від одного channel transport, тримайте його в цьому runner plugin або plugin harness.
- Якщо scenario потребує нової capability, яку може використовувати більше ніж один channel, додайте generic helper замість channel-specific branch у `suite.ts`.
- Якщо behavior має сенс лише для одного transport, залиште scenario transport-specific і явно зафіксуйте це в scenario contract.

### Імена scenario helper

Бажані generic helpers для нових scenarios:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Compatibility aliases залишаються доступними для наявних scenarios - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - але нові scenarios слід author із generic names. Aliases існують, щоб уникнути flag-day migration, а не як модель на майбутнє.

## Reporting

`qa-lab` експортує Markdown protocol report зі спостережуваної bus timeline.
Report має відповідати:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up scenarios варто додати

Для inventory доступних scenarios - корисно під час оцінювання follow-up work або wiring нового transport - виконайте `pnpm openclaw qa coverage` (додайте `--json` для machine-readable output).
Коли вибираєте focused proof для touched behavior або file path, виконайте `pnpm openclaw qa coverage --match <query>`.
Match report шукає metadata scenario, docs refs, code refs, coverage IDs, plugins і provider requirements, а потім друкує відповідні targets `qa suite --scenario ...`.
Кожен запуск `qa suite` записує top-level artifacts `qa-evidence.json`,
`qa-suite-summary.json` і `qa-suite-report.md` для вибраного
scenario set. Scenarios, які оголошують `execution.kind: vitest` або
`execution.kind: playwright`, виконують відповідний test path і також записують
per-scenario logs. Scenarios, які оголошують `execution.kind: script`, запускають
evidence producer у `execution.path` через `node --import tsx` (з
`${outputDir}` і `${scenarioId}`, розгорнутими в `execution.args`); producer
записує власний `qa-evidence.json`, чиї entries імпортуються в suite
output і чиї artifact paths resolve відносно цього producer
`qa-evidence.json`. Коли до `qa suite` доходять через
`qa run --qa-profile`, той самий `qa-evidence.json` також містить summary
profile scorecard для вибраних taxonomy categories.
Сприймайте це як discovery aid, а не як заміну gate; вибраному scenario все ще потрібен правильний provider mode, live transport, Multipass, Testbox або release lane для behavior under test.
Для контексту scorecard див. [Maturity scorecard](/uk/maturity/scorecard).

Для перевірок character і style запустіть той самий scenario на кількох live model
refs і запишіть judged Markdown report:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Команда запускає локальні дочірні процеси QA Gateway, а не Docker. Сценарії оцінювання персонажа мають задавати персону через `SOUL.md`, а потім виконувати звичайні користувацькі ходи, як-от чат, допомога з робочим простором і невеликі файлові завдання. Моделі-кандидату не слід повідомляти, що її оцінюють. Команда зберігає кожен повний транскрипт, записує базову статистику запуску, а потім просить моделі-судді у швидкому режимі з міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, настроєм і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: підказка для судді все одно отримує кожен транскрипт і статус запуску, але референси кандидатів замінюються нейтральними мітками, як-от `candidate-01`; після розбору звіт зіставляє рейтинги назад із реальними референсами.
Запуски кандидатів за замовчуванням використовують мислення `high`, із `medium` для GPT-5.5 та `xhigh` для старіших референсів оцінювання OpenAI, які це підтримують. Перевизначте конкретного кандидата вбудовано за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` досі задає глобальний резервний варіант, а старішу форму `--model-thinking <provider/model=level>` збережено для сумісності.
Референси кандидатів OpenAI за замовчуванням використовують швидкий режим, тож пріоритетна обробка застосовується там, де провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` вбудовано, коли окремому кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли потрібно примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалості роботи кандидатів і суддів записуються у звіт для аналізу бенчмарків, але підказки для суддів явно вказують не ранжувати за швидкістю.
Запуски моделей-кандидатів і моделей-суддів за замовчуванням мають паралельність 16. Зменшуйте `--concurrency` або `--judge-concurrency`, коли обмеження провайдера або навантаження на локальний Gateway роблять запуск надто шумним.
Коли не передано жодної моделі-кандидата через `--model`, оцінювання персонажа за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` та
`google/gemini-3.1-pro-preview`, якщо не передано `--model`.
Коли не передано `--judge-model`, судді за замовчуванням використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-8,thinking=high`.

## Пов’язана документація

- [Matrix QA](/uk/concepts/qa-matrix)
- [Картка оцінювання зрілості](/uk/maturity/scorecard)
- [Пакет бенчмарків персонального агента](/uk/concepts/personal-agent-benchmark-pack)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
