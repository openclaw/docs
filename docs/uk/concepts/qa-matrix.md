---
read_when:
    - Запуск pnpm openclaw qa matrix локально
    - Додавання або вибір QA-сценаріїв Matrix
    - Тріаж збоїв Matrix QA, тайм-аутів або завислого очищення
summary: 'Довідник для супровідників щодо live-лінії QA Matrix на базі Docker: CLI, профілі, змінні середовища, сценарії та вихідні артефакти.'
title: Матричне QA
x-i18n:
    generated_at: "2026-04-29T05:57:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Лінія QA Matrix запускає вбудований Plugin `@openclaw/matrix` із одноразовим homeserver Tuwunel у Docker, з тимчасовими обліковими записами driver, SUT і observer та попередньо заповненими кімнатами. Це живе покриття Matrix із реальним транспортом.

Це інструменти лише для супровідників. Пакетовані релізи OpenClaw навмисно не містять `qa-lab`, тому `openclaw qa` доступний лише з checkout вихідного коду. Checkout вихідного коду завантажує вбудований засіб запуску напряму — крок встановлення Plugin не потрібен.

Ширший контекст фреймворку QA див. в [огляді QA](/uk/concepts/qa-e2e-automation).

## Швидкий старт

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Звичайний `pnpm openclaw qa matrix` запускає `--profile all` і не зупиняється після першої помилки. Використовуйте `--profile fast --fail-fast` для релізного gate; розбийте каталог на шарди за допомогою `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, коли запускаєте весь інвентар паралельно.

## Що робить лінія

1. Готує одноразовий homeserver Tuwunel у Docker (образ за замовчуванням `ghcr.io/matrix-construct/tuwunel:v1.5.1`, ім’я сервера `matrix-qa.test`, порт `28008`).
2. Реєструє трьох тимчасових користувачів — `driver` (надсилає вхідний трафік), `sut` (обліковий запис OpenClaw Matrix, що тестується), `observer` (захоплення стороннього трафіку).
3. Заповнює кімнати, потрібні для вибраних сценаріїв (main, threading, media, restart, secondary, allowlist, E2EE, verification DM тощо).
4. Запускає дочірній Gateway OpenClaw зі справжнім Matrix Plugin, обмеженим обліковим записом SUT; `qa-channel` у дочірньому процесі не завантажується.
5. Виконує сценарії послідовно, спостерігаючи події через Matrix-клієнти driver/observer.
6. Зупиняє homeserver, записує артефакти звіту й підсумку, потім завершує роботу.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Поширені прапорці

| Прапорець             | За замовчуванням                            | Опис                                                                                                                           |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | Профіль сценаріїв. Див. [Профілі](#profiles).                                                                                  |
| `--fail-fast`         | вимкнено                                      | Зупинитися після першої невдалої перевірки або сценарію.                                                                       |
| `--scenario <id>`     | —                                             | Запустити лише цей сценарій. Можна повторювати. Див. [Сценарії](#scenarios).                                                   |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Куди записуються звіти, підсумок, спостережені події та журнал виводу. Відносні шляхи визначаються відносно `--repo-root`.    |
| `--repo-root <path>`  | `process.cwd()`                               | Корінь репозиторію під час виклику з нейтрального робочого каталогу.                                                           |
| `--sut-account <id>`  | `sut`                                         | Ідентифікатор облікового запису Matrix у конфігурації QA Gateway.                                                              |

### Прапорці провайдера

Лінія використовує справжній транспорт Matrix, але провайдера моделі можна налаштувати:

| Прапорець                | За замовчуванням | Опис                                                                                                                                          |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` для детермінованої mock-диспетчеризації або `live-frontier` для живих передових провайдерів. Застарілий alias `live-openai` досі працює. |
| `--model <ref>`          | стандарт провайдера | Основне посилання `provider/model`.                                                                                                        |
| `--alt-model <ref>`      | стандарт провайдера | Альтернативне посилання `provider/model`, коли сценарії перемикаються посеред виконання.                                                   |
| `--fast`                 | вимкнено         | Увімкнути швидкий режим провайдера, де він підтримується.                                                                                     |

Matrix QA не приймає `--credential-source` або `--credential-role`. Лінія локально створює одноразових користувачів; немає спільного пулу облікових даних, з якого можна брати lease.

## Профілі

Вибраний профіль визначає, які сценарії виконуються.

| Профіль         | Для чого використовувати                                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (default) | Повний каталог. Повільний, але вичерпний.                                                                                                                                                                                                        |
| `fast`          | Підмножина для релізного gate, що перевіряє контракт живого транспорту: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation і доставку метаданих exec approval. |
| `transport`     | Сценарії потоків, DM, кімнат, autojoin, mention/allowlist, approval і реакцій на рівні транспорту.                                                                                                                                               |
| `media`         | Покриття вкладень із зображеннями, аудіо, відео, PDF, EPUB.                                                                                                                                                                                      |
| `e2ee-smoke`    | Мінімальне покриття E2EE — базова зашифрована відповідь, thread follow-up, успішний bootstrap.                                                                                                                                                   |
| `e2ee-deep`     | Вичерпні сценарії E2EE для втрати стану, backup, ключів і відновлення.                                                                                                                                                                           |
| `e2ee-cli`      | Сценарії CLI `openclaw matrix encryption setup` і `verify *`, що виконуються через QA harness.                                                                                                                                                   |

Точне зіставлення міститься в `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Сценарії

Повний список ідентифікаторів сценаріїв — це union `MatrixQaScenarioId` у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Категорії включають:

- потоки — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- верхній рівень / DM / кімната — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming і прогрес інструментів — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- медіа — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- маршрутизація — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- реакції — `matrix-reaction-*`
- approvals — `matrix-approval-*` (метадані exec/Plugin, chunked fallback, реакції deny, потоки та маршрутизація `target: "both"`)
- restart і replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot і allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (базова відповідь, thread follow-up, bootstrap, життєвий цикл recovery key, варіанти втрати стану, поведінка server backup, гігієна пристроїв, перевірка SAS / QR / DM, restart, редагування артефактів)
- E2EE CLI — `matrix-e2ee-cli-*` (налаштування шифрування, ідемпотентне налаштування, помилка bootstrap, життєвий цикл recovery-key, кілька облікових записів, round-trip gateway-reply, self-verification)

Передайте `--scenario <id>` (можна повторювати), щоб запустити вручну вибраний набір; поєднуйте з `--profile all`, щоб ігнорувати фільтрацію профілю.

## Змінні середовища

| Змінна                                  | Типове значення                          | Ефект                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 хв)                         | Жорстка верхня межа для всього запуску.                                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Межа для початкової canary-відповіді. Release CI збільшує її на спільних раннерах, щоб повільний перший хід gateway не завершувався помилкою до початку покриття сценаріїв.                            |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Тихе вікно для негативних тверджень про відсутність відповіді. Обмежується до `≤` таймауту запуску.                                                                                                     |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Межа для демонтажу Docker. Поверхні помилок містять команду відновлення `docker compose ... down --remove-orphans`.                                                                                    |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Перевизначає образ homeserver під час перевірки з іншою версією Tuwunel.                                                                                                                               |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | увімкнено                                 | `0` вимикає рядки прогресу `[matrix-qa] ...` у stderr. `1` примусово вмикає їх.                                                                                                                        |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | відредаговано                             | `1` зберігає тіло повідомлення та `formatted_body` у `matrix-qa-observed-events.json`. Типово редагує їх, щоб CI-артефакти залишалися безпечними.                                                       |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | вимкнено                                  | `1` пропускає детермінований `process.exit` після запису артефакту. Типово вихід примусовий, бо нативні crypto-дескриптори matrix-js-sdk можуть тримати цикл подій активним після завершення артефакту. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | не задано                                 | Коли задано зовнішнім запускачем (наприклад, `scripts/run-node.mjs`), Matrix QA повторно використовує цей шлях журналу замість запуску власного tee.                                                    |

## Вихідні артефакти

Записуються до `--output-dir`:

- `matrix-qa-report.md` — протокольний звіт Markdown (що пройшло, не пройшло, було пропущено і чому).
- `matrix-qa-summary.json` — структурований підсумок, придатний для парсингу CI та панелей моніторингу.
- `matrix-qa-observed-events.json` — спостережені події Matrix від клієнтів драйвера й observer. Тіла редагуються, якщо не задано `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; метадані схвалення підсумовуються з вибраними безпечними полями та скороченим попереднім переглядом команди.
- `matrix-qa-output.log` — об’єднані stdout/stderr із запуску. Якщо задано `OPENCLAW_RUN_NODE_OUTPUT_LOG`, натомість повторно використовується журнал зовнішнього запускника.

Типова директорія виводу — `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, тому послідовні запуски не перезаписують один одного.

## Поради з тріажу

- **Запуск зависає ближче до кінця:** нативні crypto-дескриптори `matrix-js-sdk` можуть пережити harness. Типово після запису артефакту примусово виконується чистий `process.exit`; якщо ви прибрали `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, очікуйте, що процес затримається.
- **Помилка очищення:** знайдіть надруковану команду відновлення (виклик `docker compose ... down --remove-orphans`) і виконайте її вручну, щоб звільнити порт homeserver.
- **Нестабільні вікна негативних тверджень у CI:** зменште `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (типово 8 с), коли CI швидкий; збільште його на повільних спільних раннерах.
- **Потрібні відредаговані тіла для звіту про помилку:** повторіть запуск із `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` і додайте `matrix-qa-observed-events.json`. Вважайте отриманий артефакт чутливим.
- **Інша версія Tuwunel:** спрямуйте `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` на версію, що тестується. Lane перевіряє лише закріплений типовий образ.

## Контракт живого транспорту

Matrix — один із трьох live transport lanes (Matrix, Telegram, Discord), що спільно використовують єдиний контрольний список контракту, визначений у [огляді QA → покриття живого транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` залишається широким синтетичним набором і навмисно не є частиною цієї матриці.

## Пов’язане

- [Огляд QA](/uk/concepts/qa-e2e-automation) — загальний стек QA і контракт живого транспорту
- [QA Channel](/uk/channels/qa-channel) — синтетичний адаптер каналу для сценаріїв, підтримуваних репозиторієм
- [Тестування](/uk/help/testing) — запуск тестів і додавання покриття QA
- [Matrix](/uk/channels/matrix) — Plugin каналу, що тестується
