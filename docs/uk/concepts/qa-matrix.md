---
read_when:
    - Локальний запуск `pnpm openclaw qa matrix`
    - Додавання або вибір сценаріїв Matrix QA
    - Тріаж збоїв Matrix QA, тайм-аутів або завислого очищення
summary: 'Довідник для супровідників щодо live QA-лейну Matrix на базі Docker: CLI, профілі, змінні середовища, сценарії та вихідні артефакти.'
title: Matrix QA
x-i18n:
    generated_at: "2026-04-27T20:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55fcacd1348b681ef9e550d3f4cdf7c5ed3a2cb8d0df6d93b8ac025ec3280329
    source_path: concepts/qa-matrix.md
    workflow: 15
---

QA-лейн Matrix запускає вбудований Plugin `@openclaw/matrix` проти тимчасового homeserver Tuwunel у Docker із тимчасовими обліковими записами driver, SUT і observer, а також із попередньо створеними кімнатами. Це live-покриття Matrix із реальним транспортом.

Це інструментарій лише для супровідників. Паковані релізи OpenClaw навмисно не містять `qa-lab`, тому `openclaw qa` доступний лише з checkout вихідного коду. Checkout вихідного коду завантажують вбудований runner напряму — окремий крок встановлення Plugin не потрібен.

Для ширшого контексту QA-фреймворку див. [Огляд QA](/uk/concepts/qa-e2e-automation).

## Швидкий старт

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Звичайний `pnpm openclaw qa matrix` запускає `--profile all` і не зупиняється на першій помилці. Використовуйте `--profile fast --fail-fast` як релізний gate; розподіляйте каталог через `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, коли запускаєте весь набір паралельно.

## Що робить лейн

1. Розгортає тимчасовий homeserver Tuwunel у Docker (типовий образ `ghcr.io/matrix-construct/tuwunel:v1.5.1`, назва сервера `matrix-qa.test`, порт `28008`).
2. Реєструє трьох тимчасових користувачів — `driver` (надсилає вхідний трафік), `sut` (обліковий запис OpenClaw Matrix, що тестується), `observer` (захоплення стороннього трафіку).
3. Створює кімнати, потрібні для вибраних сценаріїв (main, threading, media, restart, secondary, allowlist, E2EE, verification DM тощо).
4. Запускає дочірній Gateway OpenClaw із реальним Plugin Matrix, обмеженим обліковим записом SUT; `qa-channel` у дочірньому процесі не завантажується.
5. Послідовно виконує сценарії, спостерігаючи за подіями через Matrix-клієнти driver/observer.
6. Зупиняє homeserver, записує артефакти звіту й підсумку, а потім завершує роботу.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Поширені прапорці

| Прапорець            | Типове значення                              | Опис                                                                                                                    |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                        | Профіль сценаріїв. Див. [Профілі](#profiles).                                                                           |
| `--fail-fast`         | вимкнено                                     | Зупинитися після першої невдалої перевірки або сценарію.                                                                |
| `--scenario <id>`     | —                                            | Запустити лише цей сценарій. Можна вказувати кілька разів. Див. [Сценарії](#scenarios).                                |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Куди записуються звіти, підсумок, спостережені події та вихідний журнал. Відносні шляхи обчислюються від `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                              | Корінь репозиторію під час виклику з нейтрального робочого каталогу.                                                    |
| `--sut-account <id>`  | `sut`                                        | Ідентифікатор облікового запису Matrix у конфігурації QA Gateway.                                                       |

### Прапорці провайдера

Лейн використовує реальний транспорт Matrix, але провайдер моделі можна налаштувати:

| Прапорець               | Типове значення | Опис                                                                                                                                            |
| ----------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` для детермінованого mock-dispatch або `live-frontier` для live frontier-провайдерів. Історичний псевдонім `live-openai` також працює. |
| `--model <ref>`          | типове для провайдера | Основне посилання `provider/model`.                                                                                                        |
| `--alt-model <ref>`      | типове для провайдера | Альтернативне посилання `provider/model`, коли сценарії перемикаються посеред запуску.                                                   |
| `--fast`                 | вимкнено        | Увімкнути швидкий режим провайдера там, де він підтримується.                                                                                  |

Matrix QA не приймає `--credential-source` або `--credential-role`. Лейн локально створює тимчасових користувачів; спільного пулу облікових даних для оренди немає.

## Профілі

Вибраний профіль визначає, які сценарії запускатимуться.

| Профіль         | Використання                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (типово)  | Повний каталог. Повільно, але вичерпно.                                                                                                                                                         |
| `fast`          | Підмножина для релізного gate, яка перевіряє контракт live-транспорту: canary, gating згадок, блокування allowlist, форма відповіді, відновлення після restart, продовження треду, ізоляція треду, спостереження за реакціями. |
| `transport`     | Сценарії транспортного рівня для threading, DM, room, autojoin, mention/allowlist.                                                                                                            |
| `media`         | Покриття вкладень image, audio, video, PDF, EPUB.                                                                                                                                              |
| `e2ee-smoke`    | Мінімальне покриття E2EE — базова зашифрована відповідь, продовження треду, успішний bootstrap.                                                                                                |
| `e2ee-deep`     | Вичерпні сценарії E2EE для втрати стану, резервних копій, ключів і відновлення.                                                                                                                |
| `e2ee-cli`      | CLI-сценарії `openclaw matrix encryption setup` і `verify *`, що запускаються через QA harness.                                                                                                |

Точне зіставлення міститься у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Сценарії

Повний список ідентифікаторів сценаріїв — це union `MatrixQaScenarioId` у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Категорії включають:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- верхній рівень / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming і перебіг інструментів — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- маршрутизація — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- реакції — `matrix-reaction-*`
- restart і replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- gating згадок і allowlist — `matrix-mention-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (базова відповідь, продовження треду, bootstrap, життєвий цикл recovery key, варіанти втрати стану, поведінка резервного копіювання сервера, гігієна пристроїв, верифікація SAS / QR / DM, restart, редагування артефактів)
- E2EE CLI — `matrix-e2ee-cli-*` (налаштування шифрування, ідемпотентне налаштування, збій bootstrap, життєвий цикл recovery key, кілька облікових записів, round-trip відповіді Gateway, self-verification)

Передайте `--scenario <id>` (можна вказувати кілька разів), щоб запустити вибраний набір; поєднуйте з `--profile all`, щоб ігнорувати gating профілю.

## Змінні середовища

| Змінна                                 | Типове значення                           | Дія                                                                                                                                                                                            |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 хв)                         | Жорстка верхня межа для всього запуску.                                                                                                                                                        |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Вікно тиші для негативних перевірок на відсутність відповіді. Обмежується значенням `≤` тайм-ауту запуску.                                                                                     |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Межа для teardown Docker. Повідомлення про збої включають recovery-команду `docker compose ... down --remove-orphans`.                                                                        |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Перевизначає образ homeserver під час перевірки з іншою версією Tuwunel.                                                                                                                       |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | увімкнено                                 | `0` вимикає рядки поступу `[matrix-qa] ...` у stderr. `1` примусово вмикає їх.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redacted                                  | `1` зберігає тіло повідомлення і `formatted_body` у `matrix-qa-observed-events.json`. Типово дані редагуються, щоб артефакти CI були безпечними.                                             |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | вимкнено                                  | `1` пропускає детермінований `process.exit` після запису артефактів. Типова поведінка примусово завершує процес, оскільки native crypto handle із matrix-js-sdk можуть утримувати event loop активним після завершення запису артефактів. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | не задано                                 | Якщо цю змінну задає зовнішній launcher (наприклад, `scripts/run-node.mjs`), Matrix QA повторно використовує цей шлях журналу замість запуску власного tee.                                   |

## Вихідні артефакти

Записуються до `--output-dir`:

- `matrix-qa-report.md` — Markdown-звіт протоколу (що пройшло, не пройшло, було пропущено і чому).
- `matrix-qa-summary.json` — структурований підсумок, придатний для розбору в CI та для dashboard.
- `matrix-qa-observed-events.json` — спостережені події Matrix від клієнтів driver і observer. Тіла повідомлень редагуються, якщо не задано `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`.
- `matrix-qa-output.log` — об’єднаний stdout/stderr із запуску. Якщо задано `OPENCLAW_RUN_NODE_OUTPUT_LOG`, натомість повторно використовується журнал зовнішнього launcher.

Типовий каталог виводу — `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, тому послідовні запуски не перезаписують один одного.

## Поради для тріажу

- **Запуск зависає наприкінці:** native crypto handle із `matrix-js-sdk` можуть жити довше за harness. Типова поведінка примусово виконує чистий `process.exit` після запису артефактів; якщо ви встановили `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, очікуйте, що процес може зависнути.
- **Помилка очищення:** знайдіть надруковану recovery-команду (виклик `docker compose ... down --remove-orphans`) і запустіть її вручну, щоб звільнити порт homeserver.
- **Нестабільні вікна негативних перевірок у CI:** зменште `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (типово 8 с), коли CI працює швидко; збільшуйте його на повільних спільних runner.
- **Потрібні неретаговані тіла повідомлень для bug report:** перезапустіть із `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` і додайте `matrix-qa-observed-events.json`. Вважайте отриманий артефакт чутливим.
- **Інша версія Tuwunel:** вкажіть у `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` версію, яка тестується. У лейні зафіксовано лише типовий pinned-образ.

## Контракт live-транспорту

Matrix — один із трьох live-транспортних лейнів (Matrix, Telegram, Discord), які використовують спільний контрольний список контракту, визначений у [Огляд QA → Покриття live-транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` залишається широким синтетичним набором і навмисно не входить до цієї матриці.

## Пов’язане

- [Огляд QA](/uk/concepts/qa-e2e-automation) — загальний стек QA і контракт live-транспорту
- [QA Channel](/uk/channels/qa-channel) — адаптер синтетичного каналу для сценаріїв на базі репозиторію
- [Тестування](/uk/help/testing) — запуск тестів і додавання покриття QA
- [Matrix](/uk/channels/matrix) — Plugin каналу, що тестується
