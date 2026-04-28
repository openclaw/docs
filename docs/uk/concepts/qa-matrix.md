---
read_when:
    - Локальний запуск `pnpm openclaw qa matrix`
    - Додавання або вибір сценаріїв Matrix QA
    - Тріаж збоїв Matrix QA, тайм-аутів або завислого очищення
summary: 'Довідник для супровідників щодо live QA-лейну Matrix на основі Docker: CLI, профілі, змінні середовища, сценарії та артефакти виводу.'
title: Matrix QA
x-i18n:
    generated_at: "2026-04-28T03:20:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 440c24f2f1b19331f6800bb3224075f718c2429688bb023e96c59f3d3e4c4932
    source_path: concepts/qa-matrix.md
    workflow: 15
---

Лейн Matrix QA запускає вбудований Plugin `@openclaw/matrix` проти тимчасового homeserver Tuwunel у Docker, з тимчасовими обліковими записами driver, SUT і observer, а також попередньо створеними кімнатами. Це live-покриття реального транспортного рівня для Matrix.

Це інструментарій лише для супровідників. Паковані релізи OpenClaw навмисно не містять `qa-lab`, тому `openclaw qa` доступний лише з checkout вихідного коду. Checkout вихідного коду завантажують вбудований раннер напряму — окремий крок встановлення Plugin не потрібен.

Для ширшого контексту QA-фреймворку див. [огляд QA](/uk/concepts/qa-e2e-automation).

## Швидкий старт

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Звичайний `pnpm openclaw qa matrix` запускає `--profile all` і не зупиняється після першої помилки. Використовуйте `--profile fast --fail-fast` як релізний gate; розбивайте каталог за допомогою `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, коли запускаєте повний набір паралельно.

## Що робить лейн

1. Розгортає тимчасовий homeserver Tuwunel у Docker (типовий образ `ghcr.io/matrix-construct/tuwunel:v1.5.1`, ім’я сервера `matrix-qa.test`, порт `28008`).
2. Реєструє трьох тимчасових користувачів — `driver` (надсилає вхідний трафік), `sut` (обліковий запис Matrix OpenClaw, що тестується), `observer` (захоплення стороннього трафіку).
3. Створює кімнати, потрібні для вибраних сценаріїв (основна, для тредів, медіа, перезапуску, додаткова, allowlist, E2EE, verification DM тощо).
4. Запускає дочірній Gateway OpenClaw із реальним Plugin Matrix, обмеженим обліковим записом SUT; `qa-channel` у дочірній процес не завантажується.
5. Послідовно виконує сценарії, спостерігаючи за подіями через Matrix-клієнти driver/observer.
6. Зупиняє homeserver, записує артефакти звіту та підсумку, потім завершує роботу.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Поширені прапорці

| Прапорець            | Типове значення                              | Опис                                                                                                                        |
| -------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                       | Профіль сценаріїв. Див. [Профілі](#profiles).                                                                               |
| `--fail-fast`        | вимкнено                                     | Зупинитися після першої невдалої перевірки або сценарію.                                                                    |
| `--scenario <id>`    | —                                            | Запустити лише цей сценарій. Можна вказувати кілька разів. Див. [Сценарії](#scenarios).                                    |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Куди записуються звіти, підсумок, спостережені події та журнал виводу. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>` | `process.cwd()`                              | Корінь репозиторію при запуску з нейтрального робочого каталогу.                                                            |
| `--sut-account <id>` | `sut`                                        | Ідентифікатор облікового запису Matrix у конфігурації QA Gateway.                                                           |

### Прапорці провайдера

Лейн використовує реальний транспорт Matrix, але провайдер моделі можна налаштувати:

| Прапорець               | Типове значення | Опис                                                                                                                                             |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` для детермінованого mock-диспетчування або `live-frontier` для live frontier-провайдерів. Історичний псевдонім `live-openai` також працює. |
| `--model <ref>`         | типове значення провайдера | Основне посилання `provider/model`.                                                                                               |
| `--alt-model <ref>`     | типове значення провайдера | Альтернативне посилання `provider/model` для сценаріїв, де перемикання відбувається під час виконання.                            |
| `--fast`                | вимкнено        | Увімкнути швидкий режим провайдера там, де він підтримується.                                                                                   |

Matrix QA не приймає `--credential-source` або `--credential-role`. Лейн локально створює тимчасових користувачів; спільного пулу облікових даних для оренди немає.

## Профілі

Вибраний профіль визначає, які сценарії будуть запущені.

| Профіль         | Коли використовувати                                                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (типовий) | Повний каталог. Повільно, але вичерпно.                                                                                                                                                                                               |
| `fast`          | Підмножина для релізного gate, яка перевіряє live-контракт транспортного рівня: canary, фільтрацію згадок, блокування allowlist, форму відповіді, відновлення після перезапуску, продовження треду, ізоляцію треду, спостереження реакцій і доставку метаданих approval exec. |
| `transport`     | Сценарії транспортного рівня для тредів, DM, кімнат, autojoin, згадок/allowlist, approval та реакцій.                                                                                                                                |
| `media`         | Покриття вкладень image, audio, video, PDF, EPUB.                                                                                                                                                                                     |
| `e2ee-smoke`    | Мінімальне покриття E2EE — базова зашифрована відповідь, продовження треду, успішний bootstrap.                                                                                                                                      |
| `e2ee-deep`     | Вичерпні сценарії E2EE для втрати стану, резервних копій, ключів і відновлення.                                                                                                                                                      |
| `e2ee-cli`      | CLI-сценарії `openclaw matrix encryption setup` і `verify *`, керовані через QA harness.                                                                                                                                             |

Точне зіставлення міститься у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Сценарії

Повний список ідентифікаторів сценаріїв — це union `MatrixQaScenarioId` у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Категорії включають:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming і перебіг інструментів — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- approvals — `matrix-approval-*` (метадані exec/Plugin, chunked fallback, deny reactions, threads і маршрутизація `target: "both"`)
- restart і replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- фільтрація згадок і allowlists — `matrix-mention-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (базова відповідь, продовження треду, bootstrap, життєвий цикл recovery key, варіанти втрати стану, поведінка резервної копії сервера, hygiene пристроїв, перевірка SAS / QR / DM, перезапуск, редагування артефактів)
- E2EE CLI — `matrix-e2ee-cli-*` (налаштування шифрування, ідемпотентне налаштування, помилка bootstrap, життєвий цикл recovery key, кілька облікових записів, повний цикл gateway-reply, self-verification)

Передайте `--scenario <id>` (можна повторювати), щоб запустити вручну вибраний набір; поєднуйте з `--profile all`, щоб ігнорувати фільтрацію за профілем.

## Змінні середовища

| Змінна                                 | Типове значення                            | Ефект                                                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`        | `1800000` (30 хв)                          | Жорстка верхня межа для всього запуску.                                                                                                                                                          |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Вікно тиші для негативних перевірок відсутності відповіді. Обмежується значенням `≤` тайм-ауту запуску.                                                                                        |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Межа часу для teardown Docker. Серед видимих збоїв — команда відновлення `docker compose ... down --remove-orphans`.                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`     | `ghcr.io/matrix-construct/tuwunel:v1.5.1`  | Перевизначає образ homeserver під час перевірки з іншою версією Tuwunel.                                                                                                                        |
| `OPENCLAW_QA_MATRIX_PROGRESS`          | увімкнено                                  | `0` вимикає рядки поступу `[matrix-qa] ...` у stderr. `1` примусово вмикає їх.                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`   | відредаговано                              | `1` зберігає тіло повідомлення та `formatted_body` у `matrix-qa-observed-events.json`. Типова поведінка — редагування, щоб артефакти CI залишалися безпечними.                                 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | вимкнено                                  | `1` пропускає детермінований `process.exit` після запису артефактів. Типова поведінка примусово завершує процес, оскільки native crypto-дескриптори `matrix-js-sdk` можуть утримувати event loop активним після завершення запису артефактів. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`         | не задано                                  | Якщо ця змінна встановлена зовнішнім запускальником (наприклад, `scripts/run-node.mjs`), Matrix QA повторно використовує цей шлях до журналу замість запуску власного `tee`.                  |

## Артефакти виводу

Записуються до `--output-dir`:

- `matrix-qa-report.md` — Markdown-звіт протоколу (що пройшло, що впало, що було пропущено і чому).
- `matrix-qa-summary.json` — структурований підсумок, придатний для парсингу в CI та дашбордів.
- `matrix-qa-observed-events.json` — спостережені події Matrix від клієнтів driver і observer. Тіла повідомлень редагуються, якщо не встановлено `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; метадані approval подаються як зведення з вибраними безпечними полями та скороченим попереднім переглядом команди.
- `matrix-qa-output.log` — об’єднаний stdout/stderr із запуску. Якщо встановлено `OPENCLAW_RUN_NODE_OUTPUT_LOG`, замість цього повторно використовується журнал зовнішнього запускальника.

Типовий каталог виводу — `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, тому послідовні запуски не перезаписують один одного.

## Поради щодо тріажу

- **Запуск зависає ближче до завершення:** native crypto-дескриптори `matrix-js-sdk` можуть жити довше за harness. Типова поведінка примусово виконує чистий `process.exit` після запису артефактів; якщо ви встановили `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, очікуйте, що процес буде зависати.
- **Помилка очищення:** знайдіть надруковану команду відновлення (виклик `docker compose ... down --remove-orphans`) і виконайте її вручну, щоб звільнити порт homeserver.
- **Нестабільні вікна негативних перевірок у CI:** зменште `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (типово 8 с), якщо CI швидкий; збільште його на повільних спільних runners.
- **Потрібні неретаговані тіла повідомлень для звіту про помилку:** перезапустіть із `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` і додайте `matrix-qa-observed-events.json`. Вважайте отриманий артефакт чутливим.
- **Інша версія Tuwunel:** вкажіть у `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` версію, яку тестуєте. У репозиторії зафіксовано лише типове закріплене значення образу.

## Live-контракт транспортного рівня

Matrix — один із трьох live-лейнів транспортного рівня (Matrix, Telegram, Discord), які використовують спільний контрольний список контракту, визначений у [Огляд QA → Live-покриття транспортного рівня](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` залишається широким синтетичним набором і навмисно не входить до цієї матриці.

## Пов’язане

- [Огляд QA](/uk/concepts/qa-e2e-automation) — загальний стек QA і live-контракт транспортного рівня
- [QA Channel](/uk/channels/qa-channel) — синтетичний адаптер каналу для сценаріїв на основі репозиторію
- [Тестування](/uk/help/testing) — запуск тестів і додавання QA-покриття
- [Matrix](/uk/channels/matrix) — Plugin каналу, що тестується
