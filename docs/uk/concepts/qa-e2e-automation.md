---
read_when:
    - Розуміння того, як узгоджено працює стек QA
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова QA-автоматизації з вищим рівнем реалізму навколо панелі Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, live-лінії транспорту, транспортні адаптери та звітування.'
title: Огляд QA
x-i18n:
    generated_at: "2026-06-27T17:28:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw реалістичнішим,
канально-орієнтованим способом, ніж це може зробити один модульний тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача й шина QA для спостереження за транскриптом,
  ін’єкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner-плагіни: адаптери live-транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до й після live-верифікації для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази для PR.

## Поверхня команд

Кожен QA-потік виконується під `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA без `--qa-profile`; runner профілю зрілості на основі таксономії з `--qa-profile smoke-ci`, `--qa-profile release` або `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Запустити сценарії з репозиторію проти lane QA gateway. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Вивести YAML-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                               |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати агентний звіт паритету або використати `--runtime-axis --token-efficiency`, щоб записати звіти про паритет runtime Codex-vs-OpenClaw і токен-ефективність з одного підсумку runtime-пари.                                         |
| `qa character-eval`                                 | Запустити QA-сценарій персонажа на кількох live-моделях із оціненим звітом. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраного lane провайдера/моделі.                                                                                                                                                                                                          |
| `qa ui`                                             | Запустити UI налагоджувача QA і локальну QA-шину (аліас: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений Docker-образ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                                                                                                    |
| `qa up`                                             | Зібрати QA-сайт, запустити стек на Docker і вивести URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запустити лише сервер провайдера AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише сценарно-обізнаний сервер провайдера `mock-openai`.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live transport lane проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Live transport lane проти реального приватного каналу guild Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Live transport lane проти реальних облікових записів WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Runner перевірки до й після для помилок live-транспорту з доказами статус-реакцій Discord, Crabbox desktop/browser smoke і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis) і [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook). |

`qa run` на основі профілю читає належність із `taxonomy.yaml`, а потім передає
розв’язані сценарії через `qa suite`. `--surface` і
`--category` фільтрують вибраний профіль замість визначення окремих lanes.
Отриманий `qa-evidence.json` містить підсумок scorecard профілю з
кількостями вибраних категорій і відсутніми ID покриття; окремі записи evidence
залишаються джерелом істини для тестів, ролей покриття та результатів.
ID покриття функцій таксономії є точними цілями доказу, а не аліасами. Основне
покриття сценаріїв задовольняє відповідні ID; вторинне покриття лишається дорадчим.
ID покриття використовують dotted-форму `namespace.behavior` із сегментами
нижнього регістру з літер/цифр/дефісів; ID профілю, поверхні та категорії все ще можуть
використовувати наявні dashed або dotted ID таксономії.
Slim evidence пропускає `execution` для кожного запису і встановлює `evidenceMode: "slim"`;
`smoke-ci` типово використовує slim, а `--evidence-mode full` відновлює повні записи:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Використовуйте `smoke-ci` для детермінованого доказу профілю з mock-провайдерами моделей і
fake-серверами провайдерів Crabline. Використовуйте `release` для proof Stable/LTS проти live
каналів. Використовуйте `all` лише для явних запусків evidence повної таксономії; він вибирає
кожну активну категорію зрілості й може передаватися через workflow `QA Profile
Evidence` з `qa_profile=all`. Коли команда також потребує кореневого профілю OpenClaw,
розмістіть кореневий профіль перед QA-командою:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Операторський потік

Поточний операторський QA-потік — це двопанельний QA-сайт:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Docker-backed gateway lane і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати за реальною поведінкою каналу й записати, що спрацювало, що не вдалося або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без повторного збирання Docker-образу щоразу
запустіть стек із bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі й bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при зміні, а браузер автоматично перезавантажується, коли змінюється hash
ресурсів QA Lab.

Для локального OpenTelemetry signal smoke виконайте:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP receiver, виконує QA-сценарій `otel-trace-smoke`
з увімкненим plugin `diagnostics-otel`, а потім перевіряє, що traces,
metrics і logs експортовано. Він декодує експортовані protobuf trace spans
і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, latest GenAI semantic-convention
model-call span, `openclaw.context.assembled` і `openclaw.message.delivery`
мають бути присутні. Smoke примусово встановлює
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, тому model-call
span має використовувати назву `{gen_ai.operation.name} {gen_ai.request.model}`;
model calls не повинні експортувати `StreamAbandoned` на успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Raw OTLP
payloads не повинні містити prompt sentinel, response sentinel або QA session
key. Він записує `otel-smoke-summary.json` поруч з артефактами QA suite.

Для collector-backed OpenTelemetry smoke виконайте:

```bash
pnpm qa:otel:collector-smoke
```

Цей lane ставить реальний Docker-контейнер OpenTelemetry Collector перед тим самим
локальним receiver. Використовуйте його, коли змінюєте wiring endpoint, сумісність collector
або поведінку експорту OTLP, яку in-process receiver міг би замаскувати.

Для захищеного Prometheus scrape smoke виконайте:

```bash
pnpm qa:prometheus:smoke
```

Цей псевдонім запускає QA-сценарій `docker-prometheus-smoke` з увімкненим
`diagnostics-prometheus`, перевіряє, що неавтентифіковані scrape-запити
відхиляються, а потім перевіряє, що автентифікований scrape містить критично
важливі для релізу сімейства метрик без вмісту промптів, вмісту відповідей,
необроблених діагностичних ідентифікаторів, токенів автентифікації або
локальних шляхів.

Щоб запустити обидва smoke-тести observability послідовно, використайте:

```bash
pnpm qa:observability:smoke
```

Для OpenTelemetry-лінії з колектором і захищеного Prometheus scrape smoke
використайте:

```bash
pnpm qa:observability:collector-smoke
```

Observability QA залишається лише для source-checkout. npm tarball навмисно не
містить QA Lab, тому Docker-лінії пакетного релізу не запускають команди `qa`.
Використовуйте `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` або
`pnpm qa:observability:smoke` із зібраного source-checkout, коли змінюєте
інструментацію діагностики.

Для transport-real Matrix smoke-лінії, якій не потрібні облікові дані
model-provider, запустіть швидкий профіль із детермінованим mock OpenAI
провайдером:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Для live-frontier provider-лінії явно надайте OpenAI-сумісні облікові дані:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Повна довідка CLI, каталог профілів/сценаріїв, env vars і структура артефактів для цієї лінії наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона розгортає одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає справжній Matrix plugin у дочірньому QA gateway, обмеженому цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-зведення, артефакт observed-events і об'єднаний журнал виводу в `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії покривають поведінку транспорту, яку unit-тести не можуть довести end to end: mention gating, allow-bot-політики, allowlists, відповіді верхнього рівня й у тредах, маршрутизацію DM, обробку реакцій, придушення вхідних редагувань, дедуплікацію replay після перезапуску, відновлення після переривання homeserver, доставку approval metadata, обробку медіа та потоки bootstrap/recovery/verification для Matrix E2EE. Профіль E2EE CLI також проганяє `openclaw matrix encryption setup` і команди verification через той самий одноразовий homeserver перед перевіркою відповідей gateway.

Discord також має opt-in сценарії лише для Mantis для відтворення багів. Використовуйте
`--scenario discord-status-reactions-tool-only` для явного таймлайну status reaction
або `--scenario discord-thread-reply-filepath-attachment`, щоб створити
справжній тред Discord і перевірити, що `message.thread-reply` зберігає
вкладення `filePath`. Ці сценарії не входять до стандартної live Discord-лінії,
бо це before/after repro probes, а не широке smoke-покриття.
Mantis workflow для thread-attachment також може додати відео-свідчення
з увійденого Discord Web, коли `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` або
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` налаштовано в QA-середовищі.
Цей viewer profile використовується лише для візуального захоплення; рішення
pass/fail усе ще надходить від Discord REST oracle.

CI використовує ту саму командну поверхню в `.github/workflows/qa-live-transports-convex.yml`.
Заплановані та стандартні ручні запуски виконують швидкий профіль Matrix із
QA-наданими live-frontier обліковими даними, `--fast` і
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручний `matrix_profile=all`
розгалужується на п'ять profile shards.

Для transport-real Telegram, Discord, Slack і WhatsApp smoke-ліній:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Вони націлені на вже наявний справжній канал із двома ботами або обліковими записами (driver + SUT). Обов'язкові env vars, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані нижче в [довідці QA для Telegram, Discord, Slack і WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Для повного запуску Slack desktop VM із VNC rescue запустіть:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує Crabbox desktop/browser машину, запускає Slack live lane
усередині VM, відкриває Slack Web у VNC-браузері, захоплює desktop і копіює
`slack-qa/`, `slack-desktop-smoke.png` і `slack-desktop-smoke.mp4`, коли
відеозахоплення доступне, назад у каталог артефактів Mantis. Crabbox
desktop/browser leases заздалегідь надають інструменти захоплення та допоміжні
пакети browser/native-build, тому сценарій має встановлювати fallback-и лише на
старіших leases. Mantis повідомляє загальні й пофазові timings у
`mantis-slack-desktop-smoke-report.md`, щоб повільні запуски показували, чи час
пішов на lease warmup, отримання облікових даних, remote setup або копіювання
артефактів. Повторно використовуйте `--lease-id <cbx_...>` після ручного входу
в Slack Web через VNC; reused leases також тримають Crabbox pnpm store cache
розігрітим. Типовий `--hydrate-mode source` перевіряє із source checkout і
запускає install/build усередині VM. Використовуйте `--hydrate-mode prehydrated`
лише коли повторно використаний remote workspace уже має `node_modules` і
зібраний `dist/`; цей режим пропускає дорогий крок install/build і fail closed,
коли workspace не готовий. З `--gateway-setup` Mantis залишає постійний
OpenClaw Slack gateway запущеним усередині VM на порту `38973`; без нього
команда запускає звичайну bot-to-bot Slack QA lane і виходить після захоплення
артефактів.

Щоб довести нативний Slack approval UI з desktop evidence, запустіть режим
Mantis approval checkpoint:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Цей режим взаємовиключний із `--gateway-setup`. Він запускає Slack approval
scenarios, відхиляє не-approval scenario ids, чекає на кожен pending і resolved
approval state, рендерить спостережене повідомлення Slack API у
`approval-checkpoints/<scenario>-pending.png` і
`approval-checkpoints/<scenario>-resolved.png`, а потім завершується з помилкою,
якщо будь-який checkpoint, message evidence, acknowledgement або rendered
screenshot відсутній чи порожній. Cold CI leases усе ще можуть показувати
Slack sign-in у `slack-desktop-smoke.png`; approval checkpoint images є
візуальним proof для цієї лінії.

Operator checklist, команда GitHub workflow dispatch, evidence-comment
contract, hydrate-mode decision table, timing interpretation і кроки failure
handling наведені в [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook).

Для desktop task у стилі agent/CV запустіть:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` орендує або повторно використовує Crabbox desktop/browser машину,
запускає `crabbox record --while`, керує видимим браузером через вкладений
`visual-driver`, захоплює `visual-task.png`, запускає `openclaw infer image describe`
для screenshot, коли вибрано `--vision-mode image-describe`, і записує
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` і `mantis-visual-task-report.md`.
Коли встановлено `--expect-text`, vision prompt просить структурований JSON
verdict і проходить лише тоді, коли модель повідомляє позитивний видимий proof;
негативна відповідь, яка лише цитує цільовий текст, провалює assertion.
Використовуйте `--vision-mode metadata` для no-model smoke, який доводить
desktop, browser, screenshot і video plumbing без виклику image-understanding
provider. Recording є обов'язковим артефактом для `visual-task`; якщо Crabbox не
записує непорожній `visual-task.mp4`, task завершується з помилкою, навіть коли
visual driver пройшов. У разі failure Mantis зберігає lease для VNC, якщо task
ще не пройшов і `--keep-lease` не було встановлено.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідує налаштування endpoint і перевіряє досяжність admin/list, коли maintainer secret присутній. Він повідомляє лише статус set/missing для secrets.

## Покриття live transport

Live transport lanes мають один спільний контракт замість того, щоб кожна винаходила власну форму списку сценаріїв. `qa-channel` є широким синтетичним набором product-behavior і не є частиною матриці live transport coverage.

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

Це зберігає `qa-channel` як широкий набір product-behavior, тоді як Matrix,
Telegram та інші live transports спільно використовують один явний
transport-contract checklist.

Для одноразової Linux VM-лінії без залучення Docker у QA path запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий Multipass guest, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA report і
summary назад у `.artifacts/qa-e2e/...` на host.
Вона повторно використовує ту саму scenario-selection behavior, що й `qa suite`
на host. Host і Multipass suite runs типово виконують кілька вибраних сценаріїв
паралельно з ізольованими gateway workers. `qa-channel` типово має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`
для налаштування кількості workers або `--concurrency 1` для serial execution.
Використовуйте `--pack personal-agent`, щоб запустити personal assistant
benchmark pack. Pack selector є additive з повторюваними прапорцями
`--scenario`: explicit scenarios запускаються першими, потім pack scenarios
запускаються в pack order із видаленими дублікатами.
Використовуйте `--pack observability`, коли custom QA runner уже надає
OpenTelemetry collector setup і хоче вибрати разом smoke scenarios для
OpenTelemetry і Prometheus diagnostics.
Команда завершується з ненульовим кодом, коли будь-який scenario fails.
Використовуйте `--allow-failures`, коли потрібні артефакти без failing exit code.
Live runs передають підтримувані QA auth inputs, які практичні для guest:
env-based provider keys, QA live provider config path і `CODEX_HOME`, коли він
присутній. Тримайте `--output-dir` під коренем репозиторію, щоб guest міг
записувати назад через mounted workspace.

## Довідник QA для Telegram, Discord, Slack і WhatsApp

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і підготовку homeserver на базі Docker. Telegram, Discord, Slack і WhatsApp працюють із уже наявними реальними транспортами, тому їхній довідник розміщено тут.

### Спільні прапорці CLI

Ці лінії реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапорець                            | Типове значення                                   | Опис                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | -                                                 | Запустити лише цей сценарій. Можна повторювати.                                                                                                     |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Куди записуються звіти, підсумки, докази, специфічні для транспорту артефакти й журнал виводу. Відносні шляхи обчислюються від `--repo-root`.       |
| `--repo-root <path>`                 | `process.cwd()`                                   | Корінь репозиторію під час запуску з нейтрального cwd.                                                                                              |
| `--sut-account <id>`                 | `sut`                                             | Тимчасовий id облікового запису в конфігурації QA gateway.                                                                                          |
| `--provider-mode <mode>`             | `live-frontier`                                   | `mock-openai` або `live-frontier` (застарілий `live-openai` усе ще працює).                                                                          |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                        | Посилання на основну/альтернативну модель.                                                                                                          |
| `--fast`                             | вимкнено                                          | Швидкий режим провайдера, де підтримується.                                                                                                         |
| `--credential-source <env\|convex>`  | `env`                                             | Див. [пул облікових даних Convex](#convex-credential-pool).                                                                                         |
| `--credential-role <maintainer\|ci>` | `ci` у CI, інакше `maintainer`                    | Роль, що використовується, коли `--credential-source convex`.                                                                                        |

Кожна лінія завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу, що означає помилку.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома різними ботами (driver + SUT). SUT bot повинен мати ім’я користувача Telegram; спостереження bot-to-bot найкраще працює, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - числовий chat id (рядок).
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

Неявний типовий набір завжди охоплює canary, фільтрацію за згадками, відповіді на нативні команди, адресацію команд і відповіді bot-to-bot у групі. Типові значення `mock-openai` також включають детерміновані перевірки ланцюжка відповідей і потокового передавання фінального повідомлення. `telegram-current-session-status-tool` залишається опціональним, бо він стабільний лише коли запускається в потоці безпосередньо після canary, а не після довільних відповідей нативних команд. Використайте `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, щоб надрукувати поточний поділ на типові/опціональні сценарії з regression refs.

Артефакти виводу:

- `telegram-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок live-транспорту, включно з полями профілю, покриття, провайдера, каналу, артефактів, результату та RTT.

Пакетні запуски Telegram використовують той самий контракт облікових даних Telegram. Повторне вимірювання RTT є частиною звичайної пакетної live-лінії Telegram; розподіл RTT вбудовується в `qa-evidence.json` у `result.timing` для вибраної перевірки RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Коли встановлено `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, пакетна live-обгортка орендує облікові дані `kind: "telegram"`, експортує орендовані env групи/driver/SUT bot у запуск установленого пакета, надсилає Heartbeat оренди та звільняє її під час завершення. Пакетна обгортка типово використовує 20 перевірок RTT для `telegram-mentioned-message-reply`, таймаут RTT 30 с і роль Convex `maintainer` поза CI, коли вибрано Convex. Перевизначте `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` або `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, щоб налаштувати вимірювання RTT без створення окремої команди RTT чи специфічного для Telegram формату підсумку.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний канал guild Discord із двома ботами: driver bot, яким керує harness, і SUT bot, запущений дочірнім OpenClaw gateway через вбудований Discord plugin. Перевіряє обробку згадок у каналі, те, що SUT bot зареєстрував нативну команду `/help` у Discord, а також опціональні сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - має збігатися з id користувача SUT bot, поверненим Discord (інакше лінія швидко завершується помилкою).

Опціонально:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах observed-message.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` вибирає голосовий/stage канал для `discord-voice-autojoin`; без нього сценарій вибирає перший видимий голосовий/stage канал для SUT bot.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - опціональний голосовий сценарій. Запускається окремо, вмикає `channels.discord.voice.autoJoin` і перевіряє, що поточний голосовий стан SUT bot у Discord є цільовим голосовим/stage каналом. Облікові дані Discord у Convex можуть містити опціональний `voiceChannelId`; інакше runner знаходить перший видимий голосовий/stage канал у guild.
- `discord-status-reactions-tool-only` - опціональний сценарій Mantis. Запускається окремо, бо перемикає SUT на постійно ввімкнені відповіді guild лише через tool із `messages.statusReactions.enabled=true`, потім збирає timeline реакцій REST і візуальні артефакти HTML/PNG. Звіти Mantis before/after також зберігають надані сценарієм MP4-артефакти як `baseline.mp4` і `candidate.mp4`.

Запустіть сценарій автоматичного підключення Discord до голосового каналу явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Запустіть сценарій реакцій статусу Mantis явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Артефакти виводу:

- `discord-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок live-транспорту.
- `discord-qa-observed-messages.json` - тіла редагуються, якщо не встановлено `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій status-reaction.

### QA Slack

```bash
pnpm openclaw qa slack
```

Націлено на один реальний приватний канал Slack із двома різними ботами: driver bot, яким керує harness, і SUT bot, запущений дочірнім OpenClaw gateway через вбудований Slack plugin.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Опціонально:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах observed-message.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` вмикає візуальні контрольні точки схвалення для Mantis. Runner записує `<scenario>.pending.json` і `<scenario>.resolved.json`, а потім очікує відповідні файли `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` перевизначає таймаут підтвердження контрольної точки. Типове значення — `120000`.

Сценарії (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - опціональний сценарій нативного схвалення exec у Slack. Запитує схвалення exec через gateway, перевіряє, що повідомлення Slack має нативні кнопки схвалення, вирішує його та перевіряє вирішене оновлення Slack.
- `slack-approval-plugin-native` - опціональний сценарій нативного схвалення plugin у Slack. Вмикає пересилання схвалень exec і plugin разом, щоб події plugin не пригнічувалися маршрутизацією схвалень exec, а потім перевіряє той самий pending/resolved шлях нативного UI Slack.

Артефакти виводу:

- `slack-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок live-транспорту.
- `slack-qa-observed-messages.json` - тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - лише коли Mantis встановлює `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; містить JSON контрольних точок, JSON підтверджень і скриншоти pending/resolved.

#### Налаштування робочого простору Slack

Лінії потрібні два різні застосунки Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` - id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` - token бота (`xoxb-...`) застосунку **Driver**.
- `sutBotToken` - token бота (`xoxb-...`) застосунку **SUT**, який має бути окремим застосунком Slack від driver, щоб його id користувача бота був іншим.
- `sutAppToken` - token рівня застосунку (`xapp-...`) застосунку SUT із `connections:write`, який використовується Socket Mode, щоб застосунок SUT міг отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання production workspace.

Наведений нижче маніфест SUT навмисно звужує production install вбудованого Slack plugin (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених live-набором QA Slack. Для налаштування production-channel так, як його бачать користувачі, див. [швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо лінії потрібні два різні id користувачів ботів в одному робочому просторі.

**1. Створіть застосунок Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть робочий простір QA, вставте такий маніфест, потім _Install to Workspace_:

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) - це стане `driverBotToken`. Драйверу потрібно лише публікувати повідомлення та ідентифікувати себе; без подій і без Socket Mode.

**2. Створіть застосунок SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Цей QA-застосунок навмисно використовує вужчу версію виробничого маніфесту bundled Slack Plugin (`extensions/slack/src/setup-shared.ts:10`): scopes і події реакцій пропущені, бо live-набір QA Slack поки не покриває обробку реакцій.

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
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → це стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання одного застосунку для обох одразу зламає mention-gating.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів ізсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ - це стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тож читання історії в harness усе одно будуть успішними.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте env vars для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші maintainers могли брати їх в оренду.

Для пулу Convex запишіть чотири поля у JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Після експорту `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` у вашій оболонці зареєструйте та перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте end to end**

Запустіть lane локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно менше ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо lane зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, то пул або порожній, або кожен рядок орендований - `qa credentials list --kind slack --status all --json` покаже, який саме випадок.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Націлюється на два виділені облікові записи WhatsApp Web: обліковий запис драйвера, яким керує harness, і обліковий запис SUT, який запускає дочірній OpenClaw gateway через bundled WhatsApp Plugin.

Обов'язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Необов'язково:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` вмикає групові сценарії, як-от
  `whatsapp-mention-gating` і `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` зберігає тіла повідомлень в
  observed-message артефактах.

Каталог сценаріїв (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Базова перевірка й груповий gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Нативні команди: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Поведінка відповідей і фінального виводу: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Вхідні медіа та структуровані повідомлення: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Вони надсилають реальні події WhatsApp image, audio,
  document, location, contact і sticker через драйвер.
- Покриття вихідного Gateway і дій із повідомленнями:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Покриття контролю доступу: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Нативні approvals: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Реакції статусу: `whatsapp-status-reactions`.

Наразі каталог містить 36 сценаріїв. Стандартна lane `live-frontier` залишається невеликою: 10 сценаріїв для швидкого smoke-покриття. Стандартна lane `mock-openai` запускає 31 детермінований сценарій через реальний транспорт WhatsApp, мокуючи лише вивід моделі. Сценарії approval і кілька важчих або блокувальних перевірок залишаються явними за ідентифікатором сценарію.

QA-драйвер WhatsApp спостерігає структуровані live-події (`text`, `media`,
`location`, `reaction` і `poll`) та може активно надсилати медіа, polls,
contacts, locations і stickers. QA Lab імпортує цей драйвер через поверхню пакета
`@openclaw/whatsapp/api.js`, а не звертається до приватних runtime-файлів
WhatsApp. Вміст повідомлень типово редагується. Покриття вихідних
poll і upload-file проходить через детерміновані виклики Gateway `poll` і
`message.action`, а не лише через model-prompt-only tool invocation.

Вихідні артефакти:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - evidence-записи для перевірок live-транспорту.
- `whatsapp-qa-observed-messages.json` - тіла редагуються, якщо не задано `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Пул облікових даних Convex

Lane-и Telegram, Discord, Slack і WhatsApp можуть орендувати облікові дані зі спільного пулу Convex замість читання env vars вище. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає для неї Heartbeat протягом виконання запуску та звільняє її під час завершення роботи. Види пулу: `"telegram"`, `"discord"`, `"slack"` і `"whatsapp"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` має бути числовим рядком chat-id.
- Реальний користувач Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - лише для proof Mantis Telegram Desktop. Загальні lane-и QA Lab не повинні отримувати цей kind.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - номери телефонів мають бути різними рядками E.164.

Workflow proof Mantis Telegram Desktop утримує одну ексклюзивну Convex-оренду
`telegram-user` і для TDLib CLI-драйвера, і для свідка Telegram Desktop,
а потім звільняє її після публікації proof.

Коли PR потребує детермінованого візуального diff, Mantis може використовувати одну й ту саму відповідь mock-моделі на `main` і на head PR, поки змінюється formatter або delivery layer Telegram. Стандартні capture-налаштування оптимізовані для коментарів PR: стандартний клас Crabbox, 24fps desktop recording, 24fps motion GIF і ширина preview 1920px. Коментарі before/after мають публікувати чистий bundle, що містить лише заплановані GIF-и.

Lane-и Slack також можуть використовувати пул. Перевірки форми Slack payload наразі живуть у Slack QA runner, а не в broker; використовуйте `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, з ідентифікатором каналу Slack на кшталт `Cxxxxxxxxxx`. Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) для provisioning застосунку й scopes.

Операційні env vars і контракт endpoint Convex broker описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує багатоканальному пулу; семантика оренди спільна для всіх kinds).

## Seeds із репозиторію

Seed-ресурси містяться в `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і агенту.

`qa-lab` має залишатися загальним runner для YAML-сценаріїв. Кожен YAML-файл сценарію є джерелом істини для одного тестового запуску й має визначати:

- верхньорівневий `title`
- метадані `scenario`
- необов'язкові метадані category, capability, lane і risk у `scenario`
- посилання на docs і code у `scenario`
- необов'язкові вимоги до Plugin у `scenario`
- необов'язковий patch конфігурації gateway у `scenario`
- виконуваний верхньорівневий `flow` для flow-сценаріїв або `scenario.execution.kind` /
  `scenario.execution.path` для сценаріїв Vitest і Playwright

Багаторазова runtime-поверхня, на якій працює `flow`, може залишатися узагальненою
і наскрізною. Наприклад, YAML-сценарії можуть поєднувати допоміжні засоби
транспортного боку з допоміжними засобами браузерного боку, які керують вбудованим Control UI через
шов Gateway `browser.request`, не додаючи спеціалізований runner.

Файли сценаріїв слід групувати за продуктовою можливістю, а не за папкою
дерева джерел. Зберігайте стабільні ID сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чати DM і каналів
- поведінку тредів
- життєвий цикл дій повідомлень
- cron-зворотні виклики
- пригадування пам’яті
- перемикання моделей
- передавання підлеглому агенту
- читання репозиторію та документації
- одне невелике завдання збірки, наприклад Lobster Invaders

## Макетні лінії провайдерів

`qa suite` має дві локальні макетні лінії провайдерів:

- `mock-openai` — сценарно-обізнаний макет OpenClaw. Він залишається стандартною
  детермінованою макетною лінією для QA на основі репозиторію та parity-гейтів.
- `aimock` запускає AIMock-backed сервер провайдера для експериментального протоколу,
  fixture, record/replay і chaos-покриття. Він є додатковим і не
  замінює сценарний диспетчер `mock-openai`.

Реалізація ліній провайдерів міститься в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми стандартними значеннями, запуском локального сервера, конфігурацією моделі gateway,
потребами підготовки auth-профілю та прапорцями live/mock можливостей. Спільний код suite і
gateway має маршрутизуватися через реєстр провайдерів, а не розгалужуватися за
назвами провайдерів.

## Транспортні адаптери

`qa-lab` володіє узагальненим транспортним швом для YAML QA-сценаріїв. `qa-channel` є
синтетичним стандартом. `crabline` запускає локальні сервери у формі провайдера й виконує
звичайні channel plugins OpenClaw проти них. `live` зарезервовано для реальних
облікових даних провайдера та зовнішніх каналів.

На рівні архітектури поділ такий:

- `qa-lab` володіє узагальненим виконанням сценаріїв, паралельністю workers, записом артефактів і звітуванням.
- Транспортний адаптер володіє конфігурацією gateway, готовністю, спостереженням за вхідними та вихідними даними, транспортними діями й нормалізованим транспортним станом.
- YAML-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до YAML QA-системи потребує реалізації каналу плюс
пакета сценаріїв, який перевіряє контракт каналу. Для smoke-покриття в CI додайте
відповідний Crabline fake provider server і відкрийте його через driver `crabline`.

Не додавайте новий корінь QA-команд верхнього рівня, коли спільний host `qa-lab` може володіти потоком.

`qa-lab` володіє спільною механікою host:

- коренем команди `openclaw qa`
- запуском і teardown suite
- паралельністю workers
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- сумісними alias для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway конфігурується для цього транспорту
- як перевіряється готовність
- як інжектяться вхідні події
- як спостерігаються вихідні повідомлення
- як відкриваються transcript і нормалізований транспортний стан
- як виконуються дії, backed by transport
- як обробляється транспортно-специфічне скидання або cleanup

Мінімальна планка впровадження для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host-шві `qa-lab`.
3. Тримайте транспортно-специфічну механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої root-команди. Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте YAML-сценарії в тематичних директоріях `qa/scenarios/`.
6. Використовуйте узагальнені допоміжні засоби сценаріїв для нових сценаріїв.
7. Зберігайте працездатність наявних сумісних alias, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішень суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розмістіть її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте узагальнений helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій transport-specific і явно зафіксуйте це в контракті сценарію.

### Назви helper сценаріїв

Бажані узагальнені helper для нових сценаріїв:

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

Сумісні alias залишаються доступними для наявних сценаріїв - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - але для написання нових сценаріїв слід використовувати узагальнені назви. Alias існують, щоб уникнути flag-day міграції, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостереженої timeline bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up сценарії варто додати

Для інвентаризації доступних сценаріїв - корисної під час оцінювання follow-up роботи або підключення нового транспорту - виконайте `pnpm openclaw qa coverage` (додайте `--json` для машинозчитуваного виводу).
Коли вибираєте сфокусований доказ для зміненої поведінки або шляху файлу, виконайте `pnpm openclaw qa coverage --match <query>`.
Звіт match шукає в метаданих сценаріїв, docs refs, code refs, coverage IDs, plugins і вимогах провайдерів, а потім друкує відповідні цілі `qa suite --scenario ...`.
Кожен запуск `qa suite` записує top-level артефакти `qa-evidence.json`,
`qa-suite-summary.json` і `qa-suite-report.md` для вибраного
набору сценаріїв. Сценарії, які оголошують `execution.kind: vitest` або
`execution.kind: playwright`, запускають відповідний тестовий шлях і також записують
логи для кожного сценарію. Сценарії, які оголошують `execution.kind: script`, запускають
виробника доказів за `execution.path` через `node --import tsx` (із
розгортанням `${outputDir}` і `${scenarioId}` у `execution.args`); виробник
записує власний `qa-evidence.json`, записи якого імпортуються у вивід suite,
а шляхи артефактів розв’язуються відносно цього
`qa-evidence.json` виробника. Коли до `qa suite` доходять через
`qa run --qa-profile`, той самий `qa-evidence.json` також містить summary scorecard профілю для вибраних категорій таксономії.
Сприймайте це як допомогу для discovery, а не як заміну gate; вибраний сценарій усе ще потребує правильного режиму провайдера, live transport, Multipass, Testbox або release lane для поведінки, що тестується.
Для контексту scorecard див. [Maturity scorecard](/uk/maturity/scorecard).

Для перевірок характеру та стилю запустіть той самий сценарій на кількох live model
refs і запишіть оцінений Markdown-звіт:

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

Команда запускає дочірні процеси локального QA gateway, а не Docker. Сценарії character eval
мають задавати persona через `SOUL.md`, а потім виконувати звичайні користувацькі turns,
як-от чат, допомога з workspace і невеликі файлові завдання. Candidate model не слід
повідомляти, що її оцінюють. Команда зберігає кожен повний
transcript, записує базову статистику запуску, а потім просить judge models у fast mode з
reasoning `xhigh`, де це підтримується, ранжувати запуски за природністю, vibe і гумором.
Використовуйте `--blind-judge-models`, коли порівнюєте провайдерів: judge prompt усе ще отримує
кожен transcript і статус запуску, але candidate refs замінюються нейтральними
мітками, як-от `candidate-01`; звіт зіставляє ранжування назад із реальними refs після
парсингу.
Candidate runs стандартно використовують thinking `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного candidate inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старішу форму `--model-thinking <provider/model=level>` збережено
для сумісності.
OpenAI candidate refs стандартно використовують fast mode, щоб priority processing застосовувався там,
де провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому candidate або judge потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються у звіті для benchmark-аналізу, але judge prompts явно кажуть
не ранжувати за швидкістю.
Запуски candidate і judge models обидва стандартно мають concurrency 16. Зменшуйте
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера або локальний тиск на gateway
роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval стандартно використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли `--judge-model` не передано, judges стандартно використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-8,thinking=high`.

## Пов’язана документація

- [Matrix QA](/uk/concepts/qa-matrix)
- [Maturity scorecard](/uk/maturity/scorecard)
- [Personal agent benchmark pack](/uk/concepts/personal-agent-benchmark-pack)
- [QA Channel](/uk/channels/qa-channel)
- [Testing](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
