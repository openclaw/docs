---
read_when:
    - Локальний запуск pnpm openclaw qa matrix
    - Додавання або вибір сценаріїв QA Matrix
    - Тріаж збоїв Matrix QA, тайм-аутів або очищення, що зависло
summary: 'Довідник для супровідників щодо live QA-лінії Matrix на базі Docker: CLI, профілі, змінні середовища, сценарії та вихідні артефакти.'
title: QA Matrix
x-i18n:
    generated_at: "2026-05-06T02:40:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

QA-лінія Matrix запускає вбудований Plugin `@openclaw/matrix` проти одноразового homeserver Tuwunel у Docker, з тимчасовими обліковими записами driver, SUT і observer, а також попередньо заповненими кімнатами. Це live-покриття Matrix з реальним транспортом.

Це інструментарій лише для супровідників. Пакетовані релізи OpenClaw навмисно не містять `qa-lab`, тому `openclaw qa` доступний лише з вихідного checkout. Вихідні checkout завантажують вбудований runner напряму - крок установлення Plugin не потрібен.

Ширший контекст QA-фреймворку див. в [огляді QA](/uk/concepts/qa-e2e-automation).

## Швидкий старт

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Звичайний `pnpm openclaw qa matrix` запускає `--profile all` і не зупиняється після першої помилки. Використовуйте `--profile fast --fail-fast` для релізного gate; розподіляйте каталог за допомогою `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, коли запускаєте повний інвентар паралельно.

## Що робить лінія

1. Підіймає одноразовий homeserver Tuwunel у Docker (типовий образ `ghcr.io/matrix-construct/tuwunel:v1.5.1`, ім'я сервера `matrix-qa.test`, порт `28008`).
2. Реєструє трьох тимчасових користувачів - `driver` (надсилає вхідний трафік), `sut` (обліковий запис OpenClaw Matrix, що тестується), `observer` (захоплення стороннього трафіку).
3. Заповнює кімнати, потрібні вибраним сценаріям (main, threading, media, restart, secondary, allowlist, E2EE, verification DM тощо).
4. Запускає дочірній OpenClaw gateway зі справжнім Plugin Matrix, обмеженим обліковим записом SUT; `qa-channel` у дочірньому процесі не завантажується.
5. Послідовно запускає сценарії, спостерігаючи події через Matrix-клієнти driver/observer.
6. Зупиняє homeserver, записує артефакти звіту й підсумку, потім завершує роботу.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Поширені прапорці

| Прапорець             | Типове значення                             | Опис                                                                                                                        |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Профіль сценаріїв. Див. [Профілі](#profiles).                                                                              |
| `--fail-fast`         | вимкнено                                     | Зупинитися після першої невдалої перевірки або сценарію.                                                                    |
| `--scenario <id>`     | -                                             | Запустити лише цей сценарій. Можна повторювати. Див. [Сценарії](#scenarios).                                                |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Куди записуються звіти, підсумок, спостережені події та журнал виводу. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Корінь репозиторію під час запуску з нейтрального робочого каталогу.                                                        |
| `--sut-account <id>`  | `sut`                                         | Ідентифікатор облікового запису Matrix у конфігурації QA gateway.                                                           |

### Прапорці провайдера

Лінія використовує справжній транспорт Matrix, але провайдер моделі можна налаштувати:

| Прапорець                | Типове значення          | Опис                                                                                                                                           |
| ------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`          | `mock-openai` для детермінованої mock-диспетчеризації або `live-frontier` для live frontier провайдерів. Legacy-псевдонім `live-openai` ще працює. |
| `--model <ref>`          | типове значення провайдера | Основний ref `provider/model`.                                                                                                                 |
| `--alt-model <ref>`      | типове значення провайдера | Альтернативний ref `provider/model`, коли сценарії перемикаються посеред запуску.                                                              |
| `--fast`                 | вимкнено                 | Увімкнути швидкий режим провайдера, де він підтримується.                                                                                       |

Matrix QA не приймає `--credential-source` або `--credential-role`. Лінія локально створює одноразових користувачів; спільного пулу облікових даних для оренди немає.

## Профілі

Вибраний профіль визначає, які сценарії запускаються.

| Профіль         | Для чого використовувати                                                                                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (типовий) | Повний каталог. Повільно, але вичерпно.                                                                                                                                                                                                       |
| `fast`          | Підмножина для релізного gate, що перевіряє live-контракт транспорту: canary, mention gating, блокування allowlist, форму відповіді, відновлення після рестарту, thread follow-up, ізоляцію thread, спостереження reaction і доставку metadata exec approval. |
| `transport`     | Сценарії transport-level threading, DM, room, autojoin, mention/allowlist, approval і reaction.                                                                                                                                              |
| `media`         | Покриття вкладень image, audio, video, PDF, EPUB.                                                                                                                                                                                            |
| `e2ee-smoke`    | Мінімальне покриття E2EE - базова зашифрована відповідь, thread follow-up, успішний bootstrap.                                                                                                                                                |
| `e2ee-deep`     | Вичерпні сценарії втрати стану E2EE, backup, ключів і відновлення.                                                                                                                                                                           |
| `e2ee-cli`      | CLI-сценарії `openclaw matrix encryption setup` і `verify *`, керовані через QA harness.                                                                                                                                                     |

Точне зіставлення міститься в `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Сценарії

Повний список ідентифікаторів сценаріїв - це union `MatrixQaScenarioId` у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Категорії охоплюють:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming і перебіг інструментів - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*` (metadata exec/plugin, chunked fallback, deny reactions, threads і routing `target: "both"`)
- restart і replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot і allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (базова відповідь, thread follow-up, bootstrap, життєвий цикл recovery key, варіанти втрати стану, поведінка server backup, гігієна пристроїв, верифікація SAS / QR / DM, restart, редагування артефактів)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup, ідемпотентний setup, помилка bootstrap, життєвий цикл recovery-key, multi-account, gateway-reply round-trip, self-verification)

Передайте `--scenario <id>` (можна повторювати), щоб запустити вручну вибраний набір; поєднуйте з `--profile all`, щоб ігнорувати фільтрацію профілю.

## Змінні середовища

| Змінна                                 | Типове значення                           | Вплив                                                                                                                                                                                                 |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 хв)                         | Жорстка верхня межа для всього запуску.                                                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Межа для початкової canary-відповіді. Release CI збільшує її на спільних раннерах, щоб повільний перший хід gateway не завершувався помилкою до початку покриття сценаріїв.                          |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Тихе вікно для негативних перевірок відсутності відповіді. Обмежується до `≤` таймауту запуску.                                                                                                       |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Межа для демонтажу Docker. Поверхні помилок містять команду відновлення `docker compose ... down --remove-orphans`.                                                                                   |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Перевизначає образ homeserver під час перевірки з іншою версією Tuwunel.                                                                                                                              |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | увімкнено                                 | `0` вимикає рядки прогресу `[matrix-qa] ...` у stderr. `1` примусово вмикає їх.                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | заредактовано                             | `1` зберігає тіло повідомлення та `formatted_body` у `matrix-qa-observed-events.json`. Типово редагується, щоб артефакти CI залишалися безпечними.                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | вимкнено                                  | `1` пропускає детермінований `process.exit` після запису артефакту. Типово вихід примусовий, бо native crypto handles matrix-js-sdk можуть утримувати цикл подій живим після завершення артефакту. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | не задано                                 | Коли задано зовнішнім launcher (наприклад, `scripts/run-node.mjs`), Matrix QA повторно використовує цей шлях журналу замість запуску власного tee.                                                     |

## Вихідні артефакти

Записуються в `--output-dir`:

- `matrix-qa-report.md` - Markdown-звіт протоколу (що пройшло, завершилося помилкою, було пропущено і чому).
- `matrix-qa-summary.json` - Структурований підсумок, придатний для парсингу CI та dashboards.
- `matrix-qa-observed-events.json` - Спостережені події Matrix від клієнтів драйвера й observer. Тіла редагуються, якщо не задано `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; метадані схвалення підсумовуються з вибраними безпечними полями та скороченим попереднім переглядом команди.
- `matrix-qa-output.log` - Об’єднані stdout/stderr із запуску. Якщо задано `OPENCLAW_RUN_NODE_OUTPUT_LOG`, натомість повторно використовується журнал зовнішнього launcher.

Типовий каталог виводу — `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, щоб послідовні запуски не перезаписували один одного.

## Поради з тріажу

- **Запуск зависає ближче до кінця:** native crypto handles `matrix-js-sdk` можуть жити довше за harness. Типово виконується примусовий чистий `process.exit` після запису артефакту; якщо ви скасували `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, очікуйте, що процес затримається.
- **Помилка cleanup:** знайдіть надруковану команду відновлення (виклик `docker compose ... down --remove-orphans`) і запустіть її вручну, щоб звільнити порт homeserver.
- **Нестабільні вікна негативних перевірок у CI:** зменште `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (типово 8 с), коли CI швидкий; збільшуйте його на повільних спільних раннерах.
- **Потрібні заредактовані тіла для звіту про bug:** запустіть повторно з `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` і долучіть `matrix-qa-observed-events.json`. Вважайте отриманий артефакт чутливим.
- **Інша версія Tuwunel:** спрямуйте `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` на версію, що тестується. Лейн перевіряє лише закріплений типовий образ.

## Контракт живого транспорту

Matrix — один із трьох live transport lanes (Matrix, Telegram, Discord), які мають спільний список перевірок контракту, визначений у [огляді QA → Покриття живого транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` залишається широким синтетичним набором і навмисно не входить до цієї matrix.

## Пов’язане

- [Огляд QA](/uk/concepts/qa-e2e-automation) - загальний стек QA та контракт живого транспорту
- [QA Channel](/uk/channels/qa-channel) - синтетичний channel adapter для сценаріїв, підкріплених репозиторієм
- [Тестування](/uk/help/testing) - запуск тестів і додавання покриття QA
- [Matrix](/uk/channels/matrix) - channel plugin, що тестується
