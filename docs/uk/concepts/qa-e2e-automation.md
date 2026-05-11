---
read_when:
    - Розуміння того, як компоненти QA-стека працюють разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання сценаріїв QA на основі репозиторію
    - Побудова реалістичнішої автоматизації забезпечення якості навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, лінії живого транспорту, транспортні адаптери та звітування.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-11T20:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw у реалістичніший,
канально-орієнтований спосіб, ніж це може зробити один unit-тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI дебагера та QA-шина для спостереження за транскриптом,
  ін’єкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner plugins: адаптери live-транспортів, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до та після live-верифікації для багів, яким
  потрібні реальні транспорти, знімки браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                                                                                                        |
| `qa suite`                                          | Запустити сценарії з репозиторію проти QA gateway lane. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Вивести markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                           |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати agentic-звіт про паритет.                                                                                                                                                                                          |
| `qa character-eval`                                 | Запустити character QA scenario на кількох live-моделях зі звітом від оцінювача. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраної lane провайдера/моделі.                                                                                                                                                                                                          |
| `qa ui`                                             | Запустити QA debugger UI і локальну QA-шину (аліас: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений QA Docker image.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                                                                                                    |
| `qa up`                                             | Зібрати QA site, запустити Docker-backed stack, вивести URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запустити лише сервер AIMock provider.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише scenario-aware сервер `mock-openai` provider.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live transport lane проти одноразового Tuwunel homeserver. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                                                                                                                       |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner перевірки до та після для багів live-транспортів, з доказами статус-реакцій Discord, smoke-перевіркою Crabbox desktop/browser і smoke-перевіркою Slack-in-VNC. Див. [Mantis](/uk/concepts/mantis) і [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook). |

## Потік оператора

Поточний QA operator flow — це QA site з двома панелями:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний transcript і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA site, запускає Docker-backed gateway lane і відкриває сторінку
QA Lab, де оператор або automation loop може дати агенту QA-місію,
спостерігати реальну поведінку каналу та записати, що спрацювало, не спрацювало або
залишилося заблокованим.

Для швидшої ітерації QA Lab UI без перебудови Docker image щоразу
запустіть стек із bind-mounted QA Lab bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` утримує Docker services на попередньо зібраному image і bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при зміні, а браузер автоматично перезавантажується, коли змінюється hash ресурсу QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує
QA-сценарій `otel-trace-smoke` з увімкненим plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не мають експортувати `StreamAbandoned` на успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч із артефактами QA suite.

Observability QA лишається доступним лише з source checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не виконують команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout, коли змінюєте diagnostics
instrumentation.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повна CLI-довідка, каталог профілів/сценаріїв, env vars і структура артефактів для цієї lane наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона створює одноразовий Tuwunel homeserver у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix plugin усередині дочірнього QA gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, артефакт observed-events і об’єднаний output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії покривають transport behavior, яку unit-тести не можуть довести end to end: mention gating, allow-bot policies, allowlists, top-level і threaded replies, DM routing, reaction handling, inbound edit suppression, restart replay dedupe, homeserver interruption recovery, approval metadata delivery, media handling і Matrix E2EE bootstrap/recovery/verification flows. Профіль E2EE CLI також проганяє `openclaw matrix encryption setup` і команди верифікації через той самий одноразовий homeserver перед перевіркою gateway replies.

Discord також має Mantis-only opt-in сценарії для відтворення багів. Використовуйте
`--scenario discord-status-reactions-tool-only` для явного timeline статус-реакцій
або `--scenario discord-thread-reply-filepath-attachment`, щоб створити
реальний Discord thread і перевірити, що `message.thread-reply` зберігає
attachment `filePath`. Ці сценарії не входять до default live Discord lane,
бо це before/after repro probes, а не широке smoke coverage.
Thread-attachment Mantis workflow також може додати logged-in Discord Web
witness video, коли `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` або
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` налаштовано в QA
environment. Цей viewer profile призначений лише для visual capture; рішення pass/fail
і далі надходить від Discord REST oracle.

CI використовує ту саму command surface у `.github/workflows/qa-live-transports-convex.yml`. Scheduled і default manual runs виконують fast Matrix profile з live frontier credentials, `--fast` і `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Manual `matrix_profile=all` розгалужується на п’ять profile shards, щоб exhaustive catalog міг виконуватися паралельно, зберігаючи по одному artifact directory на shard.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома bots (driver + SUT). Необхідні env vars, списки сценаріїв, output artifacts і Convex credential pool задокументовані в [довідці QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM із резервним доступом через VNC виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує Crabbox машину з робочим столом/браузером, запускає Slack live lane
усередині VM, відкриває Slack Web у браузері VNC, захоплює робочий стіл і
копіює `slack-qa/`, `slack-desktop-smoke.png` та `slack-desktop-smoke.mp4`,
коли захоплення відео доступне, назад до каталогу артефактів Mantis. Оренди Crabbox
для робочого столу/браузера одразу надають інструменти захоплення та допоміжні
пакети для браузера/нативної збірки, тому сценарій має встановлювати резервні
варіанти лише на старіших орендах. Mantis звітує про загальний час і час за фазами в
`mantis-slack-desktop-smoke-report.md`, щоб повільні запуски показували, чи час пішов на
прогрів оренди, отримання облікових даних, віддалене налаштування або копіювання артефактів. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC;
повторно використані оренди також зберігають прогрітим кеш pnpm store у Crabbox. Типовий
`--hydrate-mode source` перевіряє з вихідного checkout і запускає встановлення/збірку
всередині VM. Використовуйте `--hydrate-mode prehydrated` лише коли повторно використаний віддалений
workspace уже має `node_modules` і зібраний `dist/`; цей режим пропускає
дорогий крок встановлення/збірки та завершується відмовою, коли workspace не готовий.
З `--gateway-setup` Mantis залишає постійний OpenClaw Slack gateway
запущеним усередині VM на порту `38973`; без нього команда запускає звичайний
bot-to-bot Slack QA lane і завершується після захоплення артефактів.

Контрольний список оператора, команда dispatch для GitHub workflow, контракт коментаря з доказами,
таблиця вибору hydrate-mode, інтерпретація часу та кроки обробки збоїв
містяться в [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook).

Для desktop-завдання у стилі agent/CV виконайте:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` орендує або повторно використовує Crabbox машину з робочим столом/браузером, запускає
`crabbox record --while`, керує видимим браузером через вкладений
`visual-driver`, захоплює `visual-task.png`, запускає `openclaw infer image describe`
для знімка екрана, коли вибрано `--vision-mode image-describe`, і
записує `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` та `mantis-visual-task-report.md`.
Коли задано `--expect-text`, vision prompt просить структурований JSON
вердикт і проходить лише тоді, коли модель повідомляє про позитивний видимий доказ; негативна
відповідь, яка лише цитує цільовий текст, провалює перевірку.
Використовуйте `--vision-mode metadata` для smoke без моделі, який доводить роботу робочого столу,
браузера, знімка екрана та відеоінфраструктури без виклику провайдера
розуміння зображень. Запис є обов’язковим артефактом для `visual-task`; якщо Crabbox не записує
непорожній `visual-task.mp4`, завдання завершується з помилкою навіть тоді, коли visual driver
пройшов. У разі збою Mantis зберігає оренду для VNC, якщо завдання ще не
пройшло і `--keep-lease` не було задано.

Перед використанням pooled live credentials виконайте:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує налаштування endpoint і перевіряє досяжність admin/list, коли присутній секрет maintainer. Він повідомляє для секретів лише статус set/missing.

## Покриття live transport

Live transport lanes використовують один спільний контракт замість того, щоб кожен винаходив власну форму списку сценаріїв. `qa-channel` є широким синтетичним набором перевірок поведінки продукту й не входить до матриці покриття live transport.

| Lane     | Canary | Гейтинг згадки | Bot-to-bot | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у thread | Ізоляція thread | Спостереження за реакціями | Команда help | Реєстрація нативної команди |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

Це зберігає `qa-channel` як широкий набір перевірок поведінки продукту, тоді як Matrix,
Telegram і майбутні live transports використовують один явний контрольний список
transport-contract.

Для одноразового Linux VM lane без залучення Docker до QA path виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий Multipass guest, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA report і
summary назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Запуски suite на host і Multipass виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers за замовчуванням. `qa-channel` типово має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість workers, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій завершується з помилкою. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду виходу, що позначає помилку.
Live-запуски передають підтримувані QA auth inputs, які практичні для
guest: env-based provider keys, шлях QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб guest
міг записувати назад через змонтований workspace.

## Довідка QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed homeserver provisioning. Telegram, Discord і Slack менші - кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів - тому їхня довідка міститься тут.

### Спільні прапорці CLI

Ці lanes реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапорець                                  | Типове значення                                                         | Опис                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/summary/observed messages і output log. Відносні шляхи розв’язуються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | Тимчасовий account id усередині QA gateway config.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                                  |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                                                | Основні/альтернативні model refs.                                                                                         |
| `--fast`                              | вимкнено                                                             | Швидкий режим провайдера, де підтримується.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | Див. [пул облікових даних Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                              | Роль, що використовується, коли `--credential-source convex`.                                                                          |

Кожен lane завершується з ненульовим кодом у разі будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу, що позначає помилку.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома окремими ботами (driver + SUT). SUT bot повинен мати Telegram username; bot-to-bot observation працює найкраще, коли обидва боти мають увімкнений **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - числовий chat id (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов’язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в observed-message artifacts (типово редагує).

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

Неявний типовий набір завжди покриває canary, mention gating, native command replies, command addressing і bot-to-bot group replies. Типові значення `mock-openai` також включають детерміновані перевірки reply-chain і final-message streaming. `telegram-current-session-status-tool` залишається opt-in, бо він стабільний лише коли виконується в thread безпосередньо після canary, а не після довільних native command replies. Використовуйте `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, щоб вивести поточний поділ default/optional з regression refs.

Вихідні артефакти:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - включає per-reply RTT (driver send → observed SUT reply), починаючи з canary.
- `telegram-qa-observed-messages.json` - тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний приватний канал Discord guild із двома ботами: driver bot, яким керує harness, і SUT bot, запущений child OpenClaw gateway через bundled Discord plugin. Перевіряє обробку згадок каналу, що SUT bot зареєстрував нативну команду `/help` у Discord, і opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - має відповідати id користувача SUT-бота, який повертає Discord (інакше лінія швидко завершується з помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` вибирає голосовий/сценічний канал для `discord-voice-autojoin`; без нього сценарій вибирає перший видимий голосовий/сценічний канал для SUT-бота.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - голосовий сценарій із явним увімкненням. Запускається самостійно, вмикає `channels.discord.voice.autoJoin` і перевіряє, що поточний голосовий стан SUT-бота в Discord є цільовим голосовим/сценічним каналом. Облікові дані Convex для Discord можуть містити необов’язковий `voiceChannelId`; інакше runner виявляє перший видимий голосовий/сценічний канал у гільдії.
- `discord-status-reactions-tool-only` - сценарій Mantis із явним увімкненням. Запускається самостійно, бо перемикає SUT на постійні відповіді в гільдії лише через інструменти з `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу REST-реакцій плюс візуальні артефакти HTML/PNG. Звіти Mantis до/після також зберігають надані сценарієм MP4-артефакти як `baseline.mp4` і `candidate.mp4`.

Запустіть сценарій автоматичного приєднання до голосового каналу Discord явно:

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
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Вихідні артефакти:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - тіла заредаговано, якщо не задано `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій реакцій статусу.

### QA Slack

```bash
pnpm openclaw qa slack
```

Націлюється на один реальний приватний канал Slack із двома окремими ботами: драйвер-ботом, яким керує тестовий стенд, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Slack Plugin.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необов’язково:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Вихідні артефакти:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - тіла заредаговано, якщо не задано `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Налаштування робочого простору Slack

Лінії потрібні два окремі застосунки Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` - id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` - токен бота (`xoxb-...`) застосунку **Driver**.
- `sutBotToken` - токен бота (`xoxb-...`) застосунку **SUT**, який має бути окремим застосунком Slack від драйвера, щоб id користувача його бота був іншим.
- `sutAppToken` - токен рівня застосунку (`xapp-...`) застосунку SUT з `connections:write`, який використовується Socket Mode, щоб застосунок SUT міг отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання робочого простору production.

Маніфест SUT нижче навмисно звужує production-інсталяцію вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених live-набором QA Slack. Для налаштування production-каналу так, як його бачать користувачі, див. [Швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо лінії потрібні два різні id користувачів-ботів в одному робочому просторі.

**1. Створіть застосунок Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть робочий простір QA, вставте наведений нижче маніфест, потім _Install to Workspace_:

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) - він стане `driverBotToken`. Драйверу потрібно лише публікувати повідомлення й ідентифікувати себе; без подій, без Socket Mode.

**2. Створіть застосунок SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Цей QA-застосунок навмисно використовує вужчу версію production-маніфесту вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`): scopes і події реакцій пропущено, бо live-набір QA Slack ще не охоплює обробку реакцій.

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

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні id користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє driver і SUT за id користувача; повторне використання одного застосунку для обох негайно провалить mention-gating.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів ізсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте id `Cxxxxxxxxxx` з _channel info → About → Channel ID_ - він стане `channelId`. Публічний канал підходить; якщо використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тому читання історії тестовим стендом усе одно успішно працюватиме.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші мейнтейнери могли орендувати їх.

Для пулу Convex запишіть чотири поля у файл JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

З експортованими у вашій оболонці `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` зареєструйте й перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте end to end**

Запустіть лінію локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через брокер:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо лінія зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, то пул порожній або кожен рядок орендовано - `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Лінії Telegram, Discord, Slack і WhatsApp можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає для неї Heartbeat протягом виконання запуску й звільняє її під час завершення. Види пулу: `"telegram"`, `"discord"`, `"slack"` і `"whatsapp"`.

Форми payload, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` має бути числовим рядком chat-id.
- Реальний користувач Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - одна ексклюзивна оренда burner-account, яку використовують і TDLib CLI driver, і візуальний свідок Telegram Desktop.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - номери телефонів мають бути різними рядками E.164.

Для візуального proof Telegram з реальним користувачем надавайте перевагу утримуваній сесії Crabbox:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` утримує одну ексклюзивну оренду Convex `telegram-user` і для TDLib CLI
driver, і для свідка Telegram Desktop, запускає запис робочого столу та залишає
Crabbox живим для довільних кроків відтворення, керованих агентом. Агенти можуть використовувати `send`,
`run`, `screenshot` і `status`, доки не будуть задоволені, потім `finish`
збирає знімок екрана, відео, обрізане за рухом відео/GIF, виходи TDLib probe
і логи перед звільненням облікових даних. `publish --session <file> --pr
<number>` за замовчуванням коментує лише motion GIF; `--full-artifacts` є
явним увімкненням для логів і JSON-виходу. Стандартна команда `probe` залишається
скороченням з однієї команди для швидких smoke-перевірок `/status`.

Використовуйте `--mock-response-file <path>`, коли PR потребує детермінованого візуального diff:
ту саму відповідь mock-моделі можна запускати на `main` і на голові PR, поки змінюється
форматер Telegram або шар доставки. Типові параметри захоплення налаштовані для коментарів PR:
стандартний клас Crabbox, запис робочого столу 24fps, GIF із рухом 24fps і
ширина прев'ю 1920px. Коментарі before/after мають публікувати чистий пакет, що
містить лише потрібні GIF.

Лінії Slack також можуть використовувати пул. Перевірки форми payload Slack наразі живуть у Slack QA runner, а не в брокері; використовуйте `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, з ідентифікатором каналу Slack на кшталт `Cxxxxxxxxxx`. Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) для підготовки застосунку й scope.

Операційні змінні середовища та контракт кінцевої точки брокера Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує багатоканальному пулу; семантика lease спільна для всіх kind).

## Сіди з репозиторія

Ресурси seed живуть у `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимим і людям, і
агенту.

`qa-lab` має залишатися універсальним markdown runner. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов'язкові метадані категорії, capability, лінії та ризику
- посилання на документацію й код
- необов'язкові вимоги до plugin
- необов'язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, markdown-сценарії можуть поєднувати transport-side
helper-и з browser-side helper-ами, які керують вбудованим Control UI через
шов Gateway `browser.request` без додавання runner для окремого випадку.

Файли сценаріїв слід групувати за можливістю продукту, а не за папкою дерева
джерел. Зберігайте ID сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для трасованості реалізації.

Базовий список має залишатися достатньо широким, щоб покривати:

- DM і чат каналу
- поведінку тредів
- життєвий цикл дій із повідомленнями
- callbacks Cron
- пригадування пам'яті
- перемикання моделі
- передачу subagent
- читання репозиторія та документації
- одне невелике завдання збірки, як-от Lobster Invaders

## Mock-лінії провайдера

`qa suite` має дві локальні mock-лінії провайдера:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається типовою
  детермінованою mock-лінією для QA з репозиторія та parity gates.
- `aimock` запускає AIMock-backed сервер провайдера для експериментального protocol,
  fixture, record/replay і chaos coverage. Це доповнення, яке не
  замінює scenario dispatcher `mock-openai`.

Реалізація ліній провайдера живе в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми типовими параметрами, запуском локального сервера, конфігурацією моделі Gateway,
потребами staging auth-profile, а також прапорцями live/mock capability. Спільний код suite і
Gateway має маршрутизуватися через registry провайдерів, а не розгалужуватися за
іменами провайдерів.

## Transport adapters

`qa-lab` володіє універсальним transport seam для markdown QA-сценаріїв. `qa-channel` є першим adapter на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На архітектурному рівні поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, worker concurrency, записом артефактів і звітністю.
- Transport adapter володіє конфігурацією Gateway, готовністю, inbound і outbound спостереженням, transport actions і нормалізованим transport state.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown QA-системи потребує рівно двох речей:

1. Transport adapter для каналу.
2. Пак сценаріїв, що перевіряє контракт каналу.

Не додавайте новий top-level корінь QA-команди, коли спільний host `qa-lab` може володіти потоком.

`qa-lab` володіє спільною host-механікою:

- корінь команди `openclaw qa`
- запуск і teardown suite
- worker concurrency
- запис артефактів
- генерація звітів
- виконання сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins володіють transport contract:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього transport
- як перевіряється готовність
- як injected inbound events
- як observed outbound messages
- як відкриваються transcripts і нормалізований transport state
- як виконуються transport-backed actions
- як обробляється transport-specific reset або cleanup

Мінімальна планка впровадження для нового каналу:

1. Зберігайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте transport-specific механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючу кореневу команду. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI та виконання runner мають залишатися за окремими entrypoints.
5. Створюйте або адаптуйте markdown-сценарії в тематичних директоріях `qa/scenarios/`.
6. Використовуйте універсальні scenario helpers для нових сценаріїв.
7. Зберігайте наявні compatibility aliases робочими, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розмістіть її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова capability, яку може використовувати більше ніж один канал, додайте універсальний helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного transport, залиште сценарій transport-specific і явно вкажіть це в контракті сценарію.

### Назви scenario helper

Бажані універсальні helper-и для нових сценаріїв:

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

Compatibility aliases залишаються доступними для наявних сценаріїв - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - але нові сценарії слід писати з універсальними назвами. Aliases існують, щоб уникнути одночасної міграції всього набору, а не як модель на майбутнє.

## Звітність

`qa-lab` експортує Markdown-звіт протоколу зі спостереженої bus timeline.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не вдалося
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Щоб отримати інвентар доступних сценаріїв - корисний під час оцінки подальшої роботи або підключення нового transport - запустіть `pnpm openclaw qa coverage` (додайте `--json` для machine-readable output).

Для перевірок характеру й стилю запустіть той самий сценарій на кількох live model
refs і запишіть judged Markdown report:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Команда запускає дочірні процеси локального QA Gateway, а не Docker. Сценарії character eval
мають задавати persona через `SOUL.md`, а потім виконувати звичайні ходи користувача,
як-от чат, допомогу з workspace і невеликі файлові завдання. Candidate model не має
знати, що її оцінюють. Команда зберігає кожен повний
transcript, записує базову статистику запуску, а потім просить judge models у fast mode з
reasoning `xhigh`, де підтримується, ранжувати запуски за природністю, vibe і humor.
Використовуйте `--blind-judge-models`, коли порівнюєте провайдерів: judge prompt усе ще отримує
кожен transcript і run status, але candidate refs замінюються нейтральними
мітками на кшталт `candidate-01`; звіт зіставляє rankings назад із реальними refs після
парсингу.
Candidate runs типово використовують thinking `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначайте конкретного candidate inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` збережена
для сумісності.
OpenAI candidate refs типово використовують fast mode, щоб priority processing застосовувався там, де
провайдер його підтримує. Додавайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому candidate або judge потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються у звіт для benchmark analysis, але judge prompts явно кажуть
не ранжувати за швидкістю.
Запуски candidate і judge models обидва типово мають concurrency 16. Зменшуйте
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера або тиск на локальний Gateway
роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval типово використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли `--model` не передано.
Коли `--judge-model` не передано, judges типово використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов'язана документація

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
