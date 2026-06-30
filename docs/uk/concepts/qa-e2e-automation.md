---
read_when:
    - Розуміння того, як узгоджується стек QA
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв, підтримуваних репозиторієм
    - Створення QA-автоматизації з вищим рівнем реалістичності навколо панелі керування Gateway
summary: 'Огляд стека QA: qa-lab, qa-channel, сценарії, підтримувані репозиторієм, live-лінії транспорту, транспортні адаптери та звітність.'
title: Огляд QA
x-i18n:
    generated_at: "2026-06-30T14:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у реалістичніший,
схожий на канал спосіб, ніж це може зробити один модульний тест.

Поточні складові:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, потоку,
  реакції, редагування та видалення.
- `extensions/qa-lab`: інтерфейс налагоджувача та шина QA для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту звіту Markdown.
- `extensions/qa-matrix`, майбутні runner-плагіни: адаптери живих транспортів, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових
  QA-сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до й після для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази для PR.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
псевдоніми скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA без `--qa-profile`; runner профілю зрілості на основі таксономії з `--qa-profile smoke-ci`, `--qa-profile release` або `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Запускає сценарії з репозиторію проти QA gateway lane. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Виводить інвентар покриття YAML-сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                               |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує agentic-звіт про паритет або використовує `--runtime-axis --token-efficiency`, щоб записати звіти про паритет runtime Codex-vs-OpenClaw і ефективність токенів з одного підсумку пари runtime.                                         |
| `qa character-eval`                                 | Запускає QA-сценарій персонажа на кількох живих моделях зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запускає одноразовий prompt проти вибраної lane провайдера/моделі.                                                                                                                                                                                                          |
| `qa ui`                                             | Запускає інтерфейс налагоджувача QA та локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Збирає попередньо підготовлений Docker-образ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                                                                                                    |
| `qa up`                                             | Збирає QA-сайт, запускає стек на основі Docker, виводить URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запускає лише сервер AIMock-провайдера.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запускає лише сценарно-обізнаний сервер провайдера `mock-openai`.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Lane живого транспорту проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Lane живого транспорту проти реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Lane живого транспорту проти реального приватного каналу Discord guild.                                                                                                                                                                                                       |
| `qa slack`                                          | Lane живого транспорту проти реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Lane живого транспорту проти реальних облікових записів WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Runner перевірки до й після для помилок живого транспорту з доказами status-reactions у Discord, desktop/browser smoke у Crabbox і smoke Slack-in-VNC. Див. [Mantis](/uk/concepts/mantis) і [Runbook Mantis Slack Desktop](/uk/concepts/mantis-slack-desktop-runbook). |

Підкріплений профілем `qa run` читає membership з `taxonomy.yaml`, а потім передає
розвʼязані сценарії через `qa suite`. `--surface` і
`--category` фільтрують вибраний профіль замість визначення окремих lanes.
Отриманий `qa-evidence.json` містить підсумок scorecard профілю з
кількістю вибраних категорій і відсутніми coverage IDs; окремі записи доказів
залишаються джерелом істини для тестів, ролей покриття та результатів.
Coverage IDs функцій таксономії є точними цілями доказу, а не псевдонімами. Основне
покриття сценарію задовольняє відповідні IDs; вторинне покриття залишається дорадчим.
Coverage IDs використовують форму dotted `namespace.behavior` з lowercase
alphanumeric/dash сегментами; IDs профілю, поверхні та категорії все ще можуть використовувати
наявні dashed або dotted taxonomy IDs.
Slim evidence пропускає `execution` для кожного запису та встановлює `evidenceMode: "slim"`;
`smoke-ci` за замовчуванням використовує slim, а `--evidence-mode full` відновлює повні записи:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Використовуйте `smoke-ci` для детермінованого доказу профілю з mock-провайдерами моделей і
локальними серверами провайдерів Crabline. Використовуйте `release` для доказу Stable/LTS проти живих
каналів. Використовуйте `all` лише для явних запусків доказів повної таксономії; він вибирає
кожну активну категорію зрілості й може бути переданий через workflow `QA Profile
Evidence` з `qa_profile=all`. Коли команді також потрібен кореневий профіль OpenClaw,
ставте кореневий профіль перед QA-командою:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Потік оператора

Поточний потік оператора QA — це двопанельний QA-сайт:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його за допомогою:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає gateway lane на основі Docker і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу та записувати, що спрацювало, не спрацювало або
залишилося заблокованим.

Для швидшої ітерації інтерфейсу QA Lab без перебудови Docker-образу щоразу
запустіть стек із bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mounts
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при змінах, а браузер автоматично перезавантажується, коли змінюється
hash ресурсу QA Lab.

Для локального OpenTelemetry signal smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP receiver, запускає QA-сценарій `otel-trace-smoke`
з увімкненим plugin `diagnostics-otel`, а потім перевіряє, що traces,
metrics і logs експортовано. Він декодує експортовані protobuf trace spans
і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, latest GenAI semantic-convention
model-call span, `openclaw.context.assembled` і `openclaw.message.delivery`
мають бути присутні. Smoke примусово встановлює
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, тому model-call
span має використовувати назву `{gen_ai.operation.name} {gen_ai.request.model}`;
model calls не мають експортувати `StreamAbandoned` під час успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Raw OTLP
payloads не мають містити prompt sentinel, response sentinel або QA session
key. Він записує `otel-smoke-summary.json` поруч з artifacts QA suite.

Для OpenTelemetry smoke на основі collector запустіть:

```bash
pnpm qa:otel:collector-smoke
```

Ця lane ставить реальний Docker-контейнер OpenTelemetry Collector перед
тим самим локальним receiver. Використовуйте її, коли змінюєте endpoint wiring, сумісність
collector або поведінку експорту OTLP, яку in-process receiver міг би замаскувати.

Для захищеного Prometheus scrape smoke запустіть:

```bash
pnpm qa:prometheus:smoke
```

Цей псевдонім запускає QA-сценарій `docker-prometheus-smoke` з увімкненим
`diagnostics-prometheus`, перевіряє, що неавтентифіковані зчитування відхиляються,
а потім перевіряє, що автентифіковане зчитування містить критично важливі для релізу сімейства метрик
без вмісту підказок, вмісту відповідей, сирих діагностичних ідентифікаторів, токенів автентифікації
або локальних шляхів.

Щоб запустити обидві перевірки спостережуваності одну за одною, використайте:

```bash
pnpm qa:observability:smoke
```

Для гілки OpenTelemetry з колектором плюс захищеної перевірки зчитування Prometheus
використайте:

```bash
pnpm qa:observability:collector-smoke
```

QA спостережуваності залишається доступним лише з вихідного checkout. npm-архів навмисно не містить
QA Lab, тому Docker-гілки пакетного релізу не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` або
`pnpm qa:observability:smoke` зі зібраного вихідного checkout під час зміни
інструментування діагностики.

Для транспортно-реальної гілки перевірки Matrix, яка не потребує облікових даних провайдера моделей,
запустіть швидкий профіль із детермінованим mock-провайдером OpenAI:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Для live-frontier гілки провайдера явно надайте OpenAI-сумісні облікові дані:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, змінні середовища та схема артефактів для цієї гілки наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона розгортає одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає справжній Matrix Plugin усередині дочірнього QA Gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-підсумок, артефакт спостережених подій і об'єднаний журнал виводу в `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії охоплюють транспортну поведінку, яку модульні тести не можуть довести наскрізно: фільтрацію за згадками, політики allow-bot, списки дозволених, відповіді верхнього рівня та в тредах, маршрутизацію DM, обробку реакцій, приглушення вхідних редагувань, дедуплікацію повторного відтворення після перезапуску, відновлення після переривання homeserver, доставку метаданих схвалення, обробку медіа та потоки ініціалізації/відновлення/перевірки Matrix E2EE. Профіль CLI для E2EE також проводить `openclaw matrix encryption setup` і команди перевірки через той самий одноразовий homeserver перед перевіркою відповідей Gateway.

Discord також має Mantis-only opt-in сценарії для відтворення помилок. Використовуйте
`--scenario discord-status-reactions-tool-only` для явної часової лінії реакцій статусу
або `--scenario discord-thread-reply-filepath-attachment`, щоб створити
справжній тред Discord і перевірити, що `message.thread-reply` зберігає вкладення
`filePath`. Ці сценарії не входять до стандартної live-гілки Discord,
бо це проби відтворення «до/після», а не широке покриття перевірки.
Робочий процес Mantis для вкладень у треді також може додати відео-свідчення
Discord Web від залогіненого користувача, коли `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` або
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` налаштовано в QA-середовищі.
Цей профіль переглядача призначений лише для візуального захоплення; рішення
pass/fail усе одно надходить від Discord REST oracle.

CI використовує ту саму поверхню команд у `.github/workflows/qa-live-transports-convex.yml`.
Заплановані та стандартні ручні запуски виконують швидкий профіль Matrix з
QA-наданими обліковими даними live-frontier, `--fast` і
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручне `matrix_profile=all` розгалужується
на п'ять шардів профілю.

Для транспортно-реальних гілок перевірки Telegram, Discord, Slack і WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Вони націлені на вже наявний реальний канал із двома ботами або обліковими записами (driver + SUT). Обов'язкові змінні середовища, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані нижче в [довіднику QA для Telegram, Discord, Slack і WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Для повного запуску Slack desktop VM із VNC-рятуванням виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує desktop/browser машину Crabbox, запускає live-гілку Slack
усередині VM, відкриває Slack Web у VNC-браузері, захоплює робочий стіл і
копіює `slack-qa/`, `slack-desktop-smoke.png` і `slack-desktop-smoke.mp4`,
коли відеозахоплення доступне, назад до каталогу артефактів Mantis. Оренди Crabbox
desktop/browser заздалегідь надають інструменти захоплення та допоміжні
пакети для браузера/native-build, тому сценарій має встановлювати fallback лише на старіших
орендах. Mantis звітує про загальний і пофазний час у
`mantis-slack-desktop-smoke-report.md`, щоб повільні запуски показували, куди пішов час:
на прогрів оренди, отримання облікових даних, віддалене налаштування чи копіювання артефактів. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC;
повторно використані оренди також підтримують прогрітим кеш pnpm store Crabbox. Стандартний
`--hydrate-mode source` перевіряє з вихідного checkout і запускає install/build
усередині VM. Використовуйте `--hydrate-mode prehydrated` лише тоді, коли повторно використаний віддалений
workspace уже має `node_modules` і зібраний `dist/`; цей режим пропускає
дорогий крок install/build і fail-closed, якщо workspace не готовий.
З `--gateway-setup` Mantis залишає постійний OpenClaw Slack Gateway
запущеним усередині VM на порту `38973`; без нього команда запускає звичайну
bot-to-bot гілку Slack QA і завершується після захоплення артефактів.

Щоб довести нативний UI схвалення Slack із desktop-доказами, запустіть режим
контрольних точок схвалення Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Цей режим взаємовиключний із `--gateway-setup`. Він запускає сценарії схвалення Slack,
відхиляє id сценаріїв, які не є сценаріями схвалення, чекає на кожному pending і
resolved стані схвалення, рендерить спостережене повідомлення Slack API у
`approval-checkpoints/<scenario>-pending.png` і
`approval-checkpoints/<scenario>-resolved.png`, а потім падає, якщо будь-яка контрольна точка,
доказ повідомлення, підтвердження або відрендерений знімок екрана відсутні чи порожні.
Холодні CI-оренди все ще можуть показувати вхід у Slack у `slack-desktop-smoke.png`;
зображення контрольних точок схвалення є візуальним доказом для цієї гілки.

Операторський checklist, команда dispatch для GitHub workflow, контракт evidence-comment,
таблиця вибору hydrate-mode, інтерпретація часу та кроки обробки відмов наведені в [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook).

Для desktop-завдання в стилі agent/CV запустіть:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` орендує або повторно використовує desktop/browser машину Crabbox, запускає
`crabbox record --while`, керує видимим браузером через вкладений
`visual-driver`, захоплює `visual-task.png`, запускає `openclaw infer image describe`
для знімка екрана, коли вибрано `--vision-mode image-describe`, і
записує `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` і `mantis-visual-task-report.md`.
Коли встановлено `--expect-text`, vision-підказка просить структурований JSON-вердикт
і проходить лише тоді, коли модель повідомляє позитивний видимий доказ; негативна
відповідь, яка лише цитує цільовий текст, провалює assertion.
Використовуйте `--vision-mode metadata` для перевірки без моделі, яка доводить desktop,
browser, screenshot і video plumbing без виклику провайдера розуміння зображень.
Запис є обов'язковим артефактом для `visual-task`; якщо Crabbox не записує
непорожній `visual-task.mp4`, завдання падає навіть тоді, коли visual driver
пройшов. У разі відмови Mantis зберігає оренду для VNC, якщо завдання ще не
пройшло і `--keep-lease` не було встановлено.

Перед використанням pooled live облікових даних запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє середовище брокера Convex, валідовує налаштування endpoint і перевіряє досяжність admin/list, коли присутній maintainer secret. Для секретів він повідомляє лише статус set/missing.

## Покриття live-транспортів

Гілки live-транспортів мають один спільний контракт замість того, щоб кожна вигадувала власну форму списку сценаріїв. `qa-channel` є широким синтетичним набором product-behavior і не входить до матриці покриття live-транспортів.

Ранери live-транспортів мають імпортувати спільні id сценаріїв, допоміжні засоби
baseline-покриття та helper вибору сценаріїв з
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Гілка    | Канаркова перевірка | Фільтрація за згадками | Бот-до-бота | Блокування allowlist | Відповідь верхнього рівня | Відповідь із цитатою | Відновлення після перезапуску | Продовження треду | Ізоляція треду | Спостереження реакцій | Команда довідки | Реєстрація нативної команди |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

Це зберігає `qa-channel` як широкий набір product-behavior, тоді як Matrix,
Telegram та інші live-транспорти мають один явний checklist транспортного контракту.

Для одноразової гілки Linux VM без залучення Docker у QA-шлях запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжого гостя Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
підсумок назад у `.artifacts/qa-e2e/...` на host.
Вона повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Запуски suite на host і Multipass за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими Gateway workers. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість worker, або `--concurrency 1` для послідовного виконання.
Використовуйте `--pack personal-agent`, щоб запустити benchmark pack персонального асистента. Селектор
pack є адитивним із повторюваними прапорцями `--scenario`: явні сценарії
запускаються першими, потім сценарії pack запускаються в порядку pack із видаленими дублікатами.
Використовуйте `--pack observability`, коли власний QA-runner уже надає
налаштування колектора OpenTelemetry і хоче вибрати сценарії перевірки
діагностики OpenTelemetry і Prometheus разом.
Команда завершується з ненульовим кодом, коли будь-який сценарій падає. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду виходу з помилкою.
Live-запуски передають підтримувані QA auth inputs, які практичні для
гостя: env-based provider keys, шлях конфігурації QA live provider і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб гість
міг записувати назад через змонтований workspace.

## Довідник QA для Telegram, Discord, Slack і WhatsApp

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і підготовку homeserver на базі Docker. Telegram, Discord, Slack і WhatsApp працюють із уже наявними реальними транспортами, тому їхній довідник наведено тут.

### Спільні прапорці CLI

Ці лінії реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапорець                            | Типове значення                                   | Опис                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | -                                                 | Запустити лише цей сценарій. Можна повторювати.                                                                                                          |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Куди записуються звіти, підсумки, докази, артефакти, специфічні для транспорту, і вихідний журнал. Відносні шляхи розв’язуються відносно `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                   | Корінь репозиторію під час виклику з нейтрального cwd.                                                                                                   |
| `--sut-account <id>`                 | `sut`                                             | Тимчасовий ідентифікатор облікового запису в конфігурації QA Gateway.                                                                                    |
| `--provider-mode <mode>`             | `live-frontier`                                   | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                                                                |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                        | Посилання на основну/альтернативну модель.                                                                                                               |
| `--fast`                             | вимкнено                                          | Швидкий режим провайдера, де підтримується.                                                                                                              |
| `--credential-source <env\|convex>`  | `env`                                             | Див. [пул облікових даних Convex](#convex-credential-pool).                                                                                              |
| `--credential-role <maintainer\|ci>` | `ci` у CI, інакше `maintainer`                    | Роль, що використовується, коли `--credential-source convex`.                                                                                            |

Кожна лінія завершується з ненульовим кодом у разі будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення з помилкою.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома окремими ботами (driver + SUT). Бот SUT повинен мати ім’я користувача Telegram; спостереження бот-до-бота найкраще працює, коли обидва боти мають увімкнений **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові змінні env, коли `--credential-source env`:

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

Неявний типовий набір завжди охоплює canary, фільтрацію згадок, відповіді нативних команд, адресацію команд і групові відповіді бот-до-бота. Типові значення `mock-openai` також включають детерміновані перевірки ланцюга відповідей і потокової передачі фінального повідомлення. `telegram-current-session-status-tool` залишається opt-in, оскільки він стабільний лише коли виконується безпосередньо після canary, а не після довільних відповідей нативних команд. Використовуйте `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, щоб вивести поточний поділ на типові/необов’язкові сценарії з regression refs.

Вихідні артефакти:

- `telegram-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок live-транспорту, зокрема поля профілю, покриття, провайдера, каналу, артефактів, результату та RTT.

Пакетні запуски Telegram використовують той самий контракт облікових даних Telegram. Повторюване вимірювання RTT є частиною звичайної пакетної live-лінії Telegram; розподіл RTT згортається в `qa-evidence.json` у `result.timing` для вибраної перевірки RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Коли встановлено `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, пакетна live-обгортка орендує облікові дані `kind: "telegram"`, експортує орендовані env групи/driver/SUT-бота в запуск встановленого пакета, надсилає Heartbeat для оренди й звільняє її під час завершення. Пакетна обгортка типово використовує 20 перевірок RTT для `telegram-mentioned-message-reply`, тайм-аут RTT 30 с і роль Convex `maintainer` поза CI, коли вибрано Convex. Перевизначте `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` або `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, щоб налаштувати вимірювання RTT без створення окремої команди RTT або специфічного для Telegram формату підсумку.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний канал гільдії Discord із двома ботами: driver-ботом, керованим harness, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Discord Plugin. Перевіряє обробку згадок каналу, те, що SUT-бот зареєстрував нативну команду `/help` у Discord, і opt-in сценарії доказів Mantis.

Обов’язкові змінні env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - має збігатися з ідентифікатором користувача SUT-бота, поверненим Discord (інакше лінія швидко завершується з помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` вибирає голосовий/stage-канал для `discord-voice-autojoin`; без нього сценарій вибирає перший видимий голосовий/stage-канал для SUT-бота.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in голосовий сценарій. Запускається самостійно, вмикає `channels.discord.voice.autoJoin` і перевіряє, що поточний голосовий стан SUT-бота в Discord є цільовим голосовим/stage-каналом. Облікові дані Convex Discord можуть включати необов’язковий `voiceChannelId`; інакше runner виявляє перший видимий голосовий/stage-канал у гільдії.
- `discord-status-reactions-tool-only` - opt-in сценарій Mantis. Запускається самостійно, бо перемикає SUT на always-on, tool-only відповіді гільдії з `messages.statusReactions.enabled=true`, потім захоплює часову шкалу реакцій REST і візуальні артефакти HTML/PNG. Звіти Mantis before/after також зберігають надані сценарієм MP4-артефакти як `baseline.mp4` і `candidate.mp4`.

Запустіть сценарій автоматичного приєднання до голосового каналу Discord явно:

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
- `qa-evidence.json` - записи доказів для перевірок live-транспорту.
- `discord-qa-observed-messages.json` - тіла редагуються, якщо не встановлено `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій статусних реакцій.

### QA Slack

```bash
pnpm openclaw qa slack
```

Націлено на один реальний приватний канал Slack із двома окремими ботами: driver-ботом, керованим harness, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Slack Plugin.

Обов’язкові змінні env, коли `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необов’язково:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` вмикає контрольні точки візуального затвердження для Mantis. Runner записує `<scenario>.pending.json` і `<scenario>.resolved.json`, а потім очікує відповідні файли `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` перевизначає тайм-аут підтвердження контрольної точки. Типове значення — `120000`.

Сценарії (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opt-in сценарій нативного exec-затвердження Slack. Запитує exec-затвердження через Gateway, перевіряє, що повідомлення Slack має нативні кнопки затвердження, розв’язує його й перевіряє оновлення Slack після розв’язання.
- `slack-approval-plugin-native` - opt-in сценарій нативного Plugin-затвердження Slack. Вмикає пересилання exec- і Plugin-затверджень разом, щоб події Plugin не пригнічувалися маршрутизацією exec-затверджень, а потім перевіряє той самий pending/resolved шлях нативного інтерфейсу Slack.

Вихідні артефакти:

- `slack-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок live-транспорту.
- `slack-qa-observed-messages.json` - тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - лише коли Mantis задає `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; містить JSON контрольних точок, JSON підтверджень і знімки екрана pending/resolved.

#### Налаштування робочого простору Slack

Лінії потрібні дві окремі програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` - ідентифікатор `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` - токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` - токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від driver, щоб її ідентифікатор користувача-бота був окремим.
- `sutAppToken` - токен рівня програми (`xapp-...`) програми SUT з `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання production-робочого простору.

Маніфест SUT нижче навмисно звужує production-встановлення вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених live-набором QA Slack. Для налаштування production-каналу так, як його бачать користувачі, див. [швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо лінії потрібні два різні ідентифікатори користувачів-ботів в одному робочому просторі.

**1. Створіть програму Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Створити новий застосунок_ → _З маніфесту_ → виберіть QA-робочу область, вставте наведений нижче маніфест, а потім _Установити в робочу область_:

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) - це стане `driverBotToken`. Драйверу потрібно лише надсилати повідомлення та ідентифікувати себе; без подій і без Socket Mode.

**2. Створіть застосунок SUT**

Повторіть _Створити новий застосунок → З маніфесту_ в тій самій робочій області. Цей QA-застосунок навмисно використовує вужчу версію production-маніфесту вбудованого Slack plugin (`extensions/slack/src/setup-shared.ts:10`): області доступу та події для реакцій опущено, бо live-набір Slack QA ще не покриває обробку реакцій.

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

- _Установити в робочу область_ → скопіюйте _Bot User OAuth Token_ → це стане `sutBotToken`.
- _Основна інформація → Токени рівня застосунку → Згенерувати токен і області доступу_ → додайте область `connections:write` → збережіть → скопіюйте значення `xapp-...` → це стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання одного застосунку для обох одразу зламає mention-gating.

**3. Створіть канал**

У QA-робочій області створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів зсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _інформація про канал → Про канал → Channel ID_ - це стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тож читання історії в harness усе одно працюватиме.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або заповніть спільний пул Convex, щоб CI та інші maintainers могли брати їх в оренду.

Для пулу Convex запишіть чотири поля у JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Коли `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` експортовано у вашій оболонці, зареєструйте та перевірте:

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

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує, що `slack-canary` і `slack-mention-gating` мають статус `pass`. Якщо lane зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або кожен рядок уже орендовано - `qa credentials list --kind slack --status all --json` покаже, який саме випадок.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Цільові облікові записи - два спеціальні акаунти WhatsApp Web: акаунт драйвера, яким керує
harness, і SUT-акаунт, запущений дочірнім OpenClaw gateway через
вбудований WhatsApp plugin.

Обов’язкові змінні середовища, коли використовується `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Необов’язково:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` вмикає групові сценарії, як-от
  `whatsapp-mention-gating` і `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` зберігає тіла повідомлень в
  артефактах спостережених повідомлень.

Каталог сценаріїв (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Базова перевірка та груповий gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Native-команди: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Поведінка відповідей і фінального виводу: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Вхідні медіа та структуровані повідомлення: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Вони надсилають реальні події WhatsApp із зображеннями, аудіо,
  документами, локаціями, контактами та стікерами через драйвер.
- Покриття вихідного Gateway і дій повідомлень:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Покриття контролю доступу: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Native-схвалення: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Реакції статусу: `whatsapp-status-reactions`.

Наразі каталог містить 36 сценаріїв. Стандартний lane `live-frontier`
залишено малим - 10 сценаріїв для швидкого smoke-покриття. Стандартний
lane `mock-openai` запускає 31 детермінований сценарій через реальний транспорт WhatsApp,
мокаючи лише вивід моделі. Сценарії схвалення та кілька важчих або блокувальних перевірок
залишаються явними за ідентифікатором сценарію.

Драйвер WhatsApp QA спостерігає структуровані live-події (`text`, `media`,
`location`, `reaction` і `poll`) і може активно надсилати медіа, опитування,
контакти, локації та стікери. QA Lab імпортує цей драйвер через
поверхню пакета `@openclaw/whatsapp/api.js`, а не звертається до приватних
runtime-файлів WhatsApp. Вміст повідомлень за замовчуванням редагується. Покриття вихідних
опитувань і завантаження файлів проходить через детерміновані Gateway-виклики `poll` і
`message.action`, а не лише через tool invocation з model prompt.

Вихідні артефакти:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - записи доказів для перевірок live-транспорту.
- `whatsapp-qa-observed-messages.json` - тіла відредаговано, якщо не задано `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Пул облікових даних Convex

Telegram, Discord, Slack і WhatsApp lanes можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом усього запуску та звільняє її під час завершення роботи. Типи пулу: `"telegram"`, `"discord"`, `"slack"` і `"whatsapp"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` має бути числовим рядком chat-id.
- Реальний користувач Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - лише доказ Mantis Telegram Desktop. Звичайні lanes QA Lab не мають отримувати цей тип.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - номери телефонів мають бути різними рядками E.164.

Workflow доказу Mantis Telegram Desktop утримує одну ексклюзивну оренду Convex
`telegram-user` для драйвера TDLib CLI і свідка Telegram Desktop,
а потім звільняє її після публікації доказу.

Коли PR потребує детермінованого візуального diff, Mantis може використати ту саму відповідь mock-моделі
на `main` і на PR head, поки змінюється formatter або delivery layer Telegram.
Стандартні параметри захоплення налаштовано для PR-коментарів: стандартний клас Crabbox,
desktop-запис 24fps, motion GIF 24fps і ширина preview 1920px.
Коментарі до/після мають публікувати чистий bundle, який містить лише
потрібні GIF.

Slack lanes також можуть використовувати пул. Перевірки форми Slack payload зараз живуть у Slack QA runner, а не в broker; використовуйте `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` з ідентифікатором Slack-каналу на кшталт `Cxxxxxxxxxx`. Див. [Налаштування Slack-робочої області](#setting-up-the-slack-workspace) щодо підготовки застосунку та областей доступу.

Операційні змінні середовища та endpoint-контракт Convex broker описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує багатоканальному пулу; семантика оренди спільна для всіх типів).

## Seeds на основі репозиторію

Seed-ресурси розміщено в `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Вони навмисно зберігаються в git, щоб QA-план був видимий і людям, і
agent.

`qa-lab` має залишатися універсальним YAML runner для сценаріїв. Кожен YAML-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- top-level `title`
- metadata `scenario`
- необов’язкові category, capability, lane і risk metadata в `scenario`
- docs і code refs в `scenario`
- необов’язкові plugin requirements в `scenario`
- необов’язковий gateway config patch в `scenario`
- виконуваний top-level `flow` для flow-сценаріїв або `scenario.execution.kind` /
  `scenario.execution.path` для сценаріїв Vitest і Playwright

Багаторазова поверхня runtime, що підтримує `flow`, може залишатися узагальненою
та наскрізною. Наприклад, YAML-сценарії можуть поєднувати помічники на боці транспорту
з помічниками на боці браузера, які керують вбудованим Control UI через шов
Gateway `browser.request`, не додаючи спеціалізований runner.

Файли сценаріїв слід групувати за можливістю продукту, а не за папкою
дерева вихідного коду. Зберігайте стабільні ID сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для трасованості реалізації.

Базовий список має залишатися достатньо широким, щоб покривати:

- чати DM і каналів
- поведінку тредів
- життєвий цикл дій із повідомленнями
- cron callbacks
- пригадування пам’яті
- перемикання моделей
- передачу subagent
- читання repo та docs
- одне невелике завдання збірки, як-от Lobster Invaders

## Mock-lanes провайдерів

`qa suite` має дві локальні mock-lanes провайдерів:

- `mock-openai` — це сценарно-обізнаний mock OpenClaw. Він залишається стандартною
  детермінованою mock-lane для QA на основі repo та parity gates.
- `aimock` запускає сервер провайдера на основі AIMock для експериментального protocol,
  fixture, record/replay та chaos coverage. Він є додатковим і не
  замінює dispatcher сценаріїв `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми стандартними значеннями, запуском локального сервера, конфігурацією моделі gateway,
потребами staging auth-profile та прапорцями можливостей live/mock. Спільний код suite і
gateway має маршрутизуватися через registry провайдерів, а не розгалужуватися за
назвами провайдерів.

## Transport adapters

`qa-lab` володіє узагальненим транспортним швом для YAML QA-сценаріїв. `qa-channel` є
синтетичним стандартом. `crabline` запускає локальні сервери у формі провайдера та виконує
звичайні channel plugins OpenClaw проти них. `live` зарезервовано для реальних
облікових даних провайдера та зовнішніх каналів.

На архітектурному рівні поділ такий:

- `qa-lab` володіє узагальненим виконанням сценаріїв, конкурентністю worker, записом артефактів і звітністю.
- Transport adapter володіє gateway config, readiness, inbound і outbound observation, transport actions та нормалізованим transport state.
- YAML-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову поверхню runtime, яка їх виконує.

### Додавання каналу

Додавання каналу до YAML QA-системи потребує реалізації каналу плюс
пакет сценаріїв, який перевіряє контракт каналу. Для smoke CI coverage додайте
відповідний локальний provider server Crabline і відкрийте його через driver `crabline`.

Не додавайте новий верхньорівневий корінь QA-команди, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільною механікою host:

- коренем команди `openclaw qa`
- запуском і teardown suite
- конкурентністю worker
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється readiness
- як інжектяться inbound events
- як спостерігаються outbound messages
- як відкриваються transcripts і нормалізований transport state
- як виконуються transport-backed actions
- як обробляється transport-specific reset або cleanup

Мінімальна планка прийняття для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте transport-specific механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої root command. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте YAML-сценарії у тематичних директоріях `qa/scenarios/`.
6. Використовуйте узагальнені помічники сценаріїв для нових сценаріїв.
7. Підтримуйте наявні compatibility aliases, якщо repo не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, тримайте її в тому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте узагальнений helper замість channel-specific branch у `suite.ts`.
- Якщо поведінка має сенс лише для одного transport, залиште сценарій transport-specific і зробіть це явним у контракті сценарію.

### Назви помічників сценаріїв

Бажані узагальнені помічники для нових сценаріїв:

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

Compatibility aliases залишаються доступними для наявних сценаріїв - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - але нові сценарії слід писати з узагальненими назвами. Aliases існують, щоб уникнути одномоментної міграції, а не як модель на майбутнє.

## Звітність

`qa-lab` експортує Markdown-звіт protocol зі спостереженої bus timeline.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up сценарії варто додати

Для інвентаризації доступних сценаріїв - корисної під час оцінювання follow-up work або підключення нового transport - запустіть `pnpm openclaw qa coverage` (додайте `--json` для machine-readable output).
Коли вибираєте сфокусований proof для зміненої поведінки або file path, запустіть `pnpm openclaw qa coverage --match <query>`.
Match-звіт шукає scenario metadata, docs refs, code refs, coverage IDs, plugins і provider requirements, а потім друкує відповідні цілі `qa suite --scenario ...`.
Кожен запуск `qa suite` записує верхньорівневі артефакти `qa-evidence.json`,
`qa-suite-summary.json` і `qa-suite-report.md` для вибраного
набору сценаріїв. Сценарії, які оголошують `execution.kind: vitest` або
`execution.kind: playwright`, запускають відповідний test path і також записують
логи для кожного сценарію. Сценарії, які оголошують `execution.kind: script`, запускають
producer доказів за `execution.path` через `node --import tsx` (з
розгортанням `${outputDir}` і `${scenarioId}` у `execution.args`); producer
записує власний `qa-evidence.json`, записи якого імпортуються у suite
output, а шляхи артефактів розв’язуються відносно цього producer
`qa-evidence.json`. Коли до `qa suite` доходять через
`qa run --qa-profile`, той самий `qa-evidence.json` також містить підсумок
profile scorecard для вибраних категорій taxonomy.
Сприймайте це як допомогу для discovery, а не заміну gate; вибраному сценарію все одно потрібні правильний provider mode, live transport, Multipass, Testbox або release lane для поведінки, що тестується.
Для контексту scorecard див. [Maturity scorecard](/uk/maturity/scorecard).

Для перевірок характеру та стилю запустіть той самий сценарій на кількох live model
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

Команда запускає дочірні процеси локального QA gateway, а не Docker. Character eval
сценарії мають задавати persona через `SOUL.md`, а потім виконувати звичайні user turns,
як-от chat, workspace help і small file tasks. Candidate model не слід
повідомляти, що її оцінюють. Команда зберігає кожен повний
transcript, записує базову статистику запуску, а потім просить judge models у fast mode з
reasoning `xhigh`, де це підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: judge prompt все одно отримує
кожен transcript і run status, але candidate refs замінюються нейтральними
labels, як-от `candidate-01`; report зіставляє rankings назад із реальними refs після
parsing.
Candidate runs за замовчуванням використовують `high` thinking, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного candidate inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
global fallback, а старіша форма `--model-thinking <provider/model=level>` збережена
для compatibility.
OpenAI candidate refs за замовчуванням використовують fast mode, щоб priority processing застосовувався там,
де провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому candidate або judge потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються у report для benchmark analysis, але judge prompts явно вказують
не ранжувати за швидкістю.
Запуски candidate і judge model обидва за замовчуванням мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли provider limits або локальний gateway
pressure роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли `--model` не передано.
Коли `--judge-model` не передано, judges за замовчуванням використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-8,thinking=high`.

## Пов’язані docs

- [Matrix QA](/uk/concepts/qa-matrix)
- [Maturity scorecard](/uk/maturity/scorecard)
- [Personal agent benchmark pack](/uk/concepts/personal-agent-benchmark-pack)
- [QA Channel](/uk/channels/qa-channel)
- [Testing](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
