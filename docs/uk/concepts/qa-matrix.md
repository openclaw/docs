---
read_when:
    - Локальний запуск pnpm openclaw qa matrix
    - Додавання або вибір сценаріїв QA Matrix
    - Тріаж збоїв, тайм-аутів або завислого очищення Matrix QA
summary: 'Довідник супровідника для live QA-лінії Matrix на базі Docker: CLI, профілі, змінні середовища, сценарії та вихідні артефакти.'
title: QA матриці
x-i18n:
    generated_at: "2026-07-04T20:43:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

QA-лінія Matrix запускає вбудований Plugin `@openclaw/matrix` проти одноразового домашнього сервера Tuwunel у Docker, із тимчасовими обліковими записами driver, SUT і observer та попередньо створеними кімнатами. Це покриття Matrix із реальним транспортом наживо.

Це інструментарій лише для мейнтейнерів. Пакетовані релізи OpenClaw навмисно не містять `qa-lab`, тому `openclaw qa` доступна лише з вихідного checkout. Вихідні checkout завантажують вбудований runner напряму - крок встановлення Plugin не потрібен.

Ширший контекст фреймворку QA див. в [огляді QA](/uk/concepts/qa-e2e-automation).

## Швидкий старт

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Звичайний `pnpm openclaw qa matrix` запускає `--profile all` і не зупиняється після першої помилки. Використовуйте `--profile fast --fail-fast` для релізного gate; розбийте каталог на шарди за допомогою `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, коли запускаєте повний інвентар паралельно.

## Що робить лінія

1. Створює одноразовий домашній сервер Tuwunel у Docker (типовий образ `ghcr.io/matrix-construct/tuwunel:v1.5.1`, ім'я сервера `matrix-qa.test`, порт `28008`) за обмеженим засобом запису запитів/відповідей із редагуванням чутливих даних.
2. Реєструє трьох тимчасових користувачів - `driver` (надсилає вхідний трафік), `sut` (обліковий запис OpenClaw Matrix, що тестується), `observer` (захоплення стороннього трафіку).
3. Заповнює кімнати, потрібні для вибраних сценаріїв (main, threading, media, restart, secondary, allowlist, E2EE, verification DM тощо).
4. Запускає substrate-neutral пробу протоколу `matrix-qa-v1` проти записаної межі Tuwunel. Модульні тести доводять контракт проби з фікстурою протоколу Matrix; канонічний хост адаптера транспорту QA у [#99707](https://github.com/openclaw/openclaw/pull/99707) володіє реальним підключенням цілі Crabline.
5. Запускає дочірній OpenClaw Gateway із реальним Plugin Matrix, обмеженим обліковим записом SUT; `qa-channel` у дочірній процес не завантажується.
6. Послідовно запускає сценарії, спостерігаючи події через клієнти Matrix driver/observer і виводячи очікування маршруту/стану із записаного трафіку.
7. Зупиняє домашній сервер, записує звіт і артефакти доказів, а потім завершує роботу.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Поширені прапорці

| Прапорець             | Типове значення                              | Опис                                                                                                                                             |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                       | Профіль сценаріїв. Див. [Профілі](#profiles).                                                                                                    |
| `--fail-fast`         | вимкнено                                    | Зупинитися після першої невдалої перевірки або сценарію.                                                                                         |
| `--scenario <id>`     | -                                           | Запустити лише цей сценарій. Можна повторювати. Див. [Сценарії](#scenarios).                                                                      |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Куди записуються звіти, зведення, інвентар маршрутів/станів, спостережені події та вихідний журнал. Відносні шляхи розв'язуються відносно `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                             | Корінь репозиторію під час виклику з нейтрального робочого каталогу.                                                                              |
| `--sut-account <id>`  | `sut`                                       | Ідентифікатор облікового запису Matrix у конфігурації QA Gateway.                                                                                 |

### Прапорці провайдера

Лінія використовує реальний транспорт Matrix, але провайдер моделі налаштовується:

| Прапорець                | Типове значення | Опис                                                                                                                                      |
| ------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` для детермінованої mock-диспетчеризації або `live-frontier` для живих frontier-провайдерів. Застарілий псевдонім `live-openai` усе ще працює. |
| `--model <ref>`          | типове значення провайдера | Основний ref `provider/model`.                                                                                                            |
| `--alt-model <ref>`      | типове значення провайдера | Альтернативний ref `provider/model`, коли сценарії перемикаються посеред запуску.                                                          |
| `--fast`                 | вимкнено        | Увімкнути швидкий режим провайдера там, де він підтримується.                                                                              |

Matrix QA не приймає `--credential-source` або `--credential-role`. Лінія локально створює одноразових користувачів; спільного пулу облікових даних для оренди немає.

## Профілі

Вибраний профіль визначає, які сценарії запускаються.

| Профіль         | Для чого використовувати                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (типово)  | Повний каталог. Повільний, але вичерпний.                                                                                                                                                                                             |
| `fast`          | Підмножина для релізного gate, яка перевіряє контракт живого транспорту: canary, mention gating, блок allowlist, форму відповіді, відновлення після restart, thread follow-up, ізоляцію thread, спостереження reaction і доставку metadata exec approval. |
| `transport`     | Сценарії threading, DM, кімнат, autojoin, mention/allowlist, approval і reaction на рівні транспорту.                                                                                                                                  |
| `media`         | Покриття вкладень image, audio, video, PDF, EPUB.                                                                                                                                                                                     |
| `e2ee-smoke`    | Мінімальне покриття E2EE - базова зашифрована відповідь, thread follow-up, успішний bootstrap.                                                                                                                                         |
| `e2ee-deep`     | Вичерпні сценарії E2EE для state-loss, backup, key і recovery.                                                                                                                                                                         |
| `e2ee-cli`      | Сценарії CLI `openclaw matrix encryption setup` і `verify *`, що виконуються через QA harness.                                                                                                                                         |

Точне зіставлення міститься в `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Сценарії

Повний список ідентифікаторів сценаріїв - це union `MatrixQaScenarioId` у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Категорії включають:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming і перебіг інструментів - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*` (metadata exec/plugin, chunked fallback, deny reactions, threads і routing `target: "both"`)
- restart і replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot і allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (базова відповідь, thread follow-up, bootstrap, життєвий цикл recovery key, варіанти state-loss, поведінка server backup, device hygiene, перевірка SAS / QR / DM, restart, редагування артефактів)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup, ідемпотентне setup, помилка bootstrap, життєвий цикл recovery-key, multi-account, gateway-reply round-trip, self-verification)

Передайте `--scenario <id>` (можна повторювати), щоб запустити вибраний вручну набір; поєднуйте з `--profile all`, щоб ігнорувати gating профілю.

## Змінні середовища

| Змінна                                  | Типове значення                           | Ефект                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 хв)                         | Жорстка верхня межа для всього запуску.                                                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Межа для початкової контрольної відповіді. Release CI збільшує її на спільних раннерах, щоб повільний перший цикл Gateway не завершився помилкою до початку покриття сценаріїв.              |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Тихе вікно для негативних перевірок відсутності відповіді. Обмежується до `≤` тайм-ауту запуску.                                                                                              |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Межа для завершення роботи Docker. Поверхні помилок містять команду відновлення `docker compose ... down --remove-orphans`.                                                                   |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Перевизначає образ homeserver під час перевірки з іншою версією Tuwunel.                                                                                                                       |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | увімкнено                                 | `0` вимикає рядки прогресу `[matrix-qa] ...` у stderr. `1` примусово вмикає їх.                                                                                                                |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | відредаговано                             | `1` зберігає тіло повідомлення та `formatted_body` у `matrix-qa-observed-events.json`. Типово редагує дані, щоб артефакти CI залишалися безпечними.                                         |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | вимкнено                                  | `1` пропускає детермінований `process.exit` після запису артефактів. Типово вихід примусовий, бо нативні crypto-дескриптори matrix-js-sdk можуть утримувати event loop активним після завершення артефактів. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | не задано                                 | Коли задано зовнішнім запускником (наприклад, `scripts/run-node.mjs`), Matrix QA повторно використовує цей шлях журналу замість запуску власного tee.                                        |

## Вихідні артефакти

Записуються в `--output-dir`:

- `matrix-qa-report.md` - Markdown-звіт протоколу (що пройшло, не пройшло, було пропущено і чому).
- `matrix-qa-summary.json` - Структурований підсумок, придатний для парсингу CI та дашбордів.
- `matrix-qa-route-state-manifest.json` - Динамічний інвентар `matrix-qa-v1`, індексований за id сценарію. Він фіксує відредаговані форми маршрутів/тіл, порядок запитів, спостережені повторні спроби, помилки, безперервність sync-token, а також сімейства станів пристроїв/ключів/медіа/резервних копій, спостережені під час цього запуску. Це виконуваний доказ, а не зафіксований у репозиторії baseline.
- `matrix-qa-observed-events.json` - Спостережені події Matrix від клієнтів драйвера й спостерігача. Тіла редагуються, якщо не задано `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; метадані схвалення підсумовуються з вибраними безпечними полями та обрізаним попереднім переглядом команди.
- `matrix-qa-output.log` - Об’єднані stdout/stderr із запуску. Якщо задано `OPENCLAW_RUN_NODE_OUTPUT_LOG`, натомість повторно використовується журнал зовнішнього запускника.

Типовий каталог виводу: `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, щоб послідовні запуски не перезаписували один одного.

## Поради з тріажу

- **Запуск зависає ближче до кінця:** нативні crypto-дескриптори `matrix-js-sdk` можуть пережити harness. Типово після запису артефактів примусово виконується чистий `process.exit`; якщо ви зняли `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, очікуйте, що процес затримається.
- **Помилка очищення:** знайдіть надруковану команду відновлення (виклик `docker compose ... down --remove-orphans`) і виконайте її вручну, щоб звільнити порт homeserver.
- **Нестабільні вікна негативних перевірок у CI:** зменште `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (типово 8 с), коли CI швидкий; збільште його на повільних спільних раннерах.
- **Потрібні відредаговані тіла для звіту про помилку:** перезапустіть із `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` і додайте `matrix-qa-observed-events.json`. Вважайте отриманий артефакт чутливим.
- **Інша версія Tuwunel:** спрямуйте `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` на версію, що тестується. Lane перевіряє лише закріплений типовий образ.

## Контракт живого транспорту

Matrix — одна з трьох lane живого транспорту (Matrix, Telegram, Discord), які спільно використовують єдиний контрольний список контракту, визначений у [Огляд QA → Покриття живого транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` залишається широким синтетичним набором і навмисно не входить до цієї матриці.

## Пов’язане

- [Огляд QA](/uk/concepts/qa-e2e-automation) - загальний стек QA і контракт живого транспорту
- [QA Channel](/uk/channels/qa-channel) - синтетичний адаптер каналу для сценаріїв, підтримуваних репозиторієм
- [Тестування](/uk/help/testing) - запуск тестів і додавання покриття QA
- [Matrix](/uk/channels/matrix) - плагін каналу, що тестується
