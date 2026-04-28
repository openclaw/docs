---
read_when:
    - Локальний запуск pnpm openclaw qa matrix
    - Додавання або вибір QA-сценаріїв Matrix
    - Тріаж збоїв Matrix QA, тайм-аутів або завислого очищення
summary: 'Довідник для супровідників щодо живої QA-доріжки Matrix на базі Docker: CLI, профілі, змінні середовища, сценарії та вихідні артефакти.'
title: QA Matrix
x-i18n:
    generated_at: "2026-04-28T11:09:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6282e8a65fb5af46a67f8240d5a9ce095e614b6cc68621745ffe79cf88a5131f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Лейн Matrix QA запускає вбудований `@openclaw/matrix` plugin проти одноразового homeserver Tuwunel у Docker, з тимчасовими обліковими записами driver, SUT і observer, а також підготовленими кімнатами. Це покриття Matrix із реальним live-транспортом.

Це інструментарій лише для мейнтейнерів. Пакетовані релізи OpenClaw навмисно не містять `qa-lab`, тому `openclaw qa` доступний лише з checkout вихідного коду. Checkout вихідного коду завантажує вбудований runner напряму — крок встановлення plugin не потрібен.

Ширший контекст QA framework див. в [огляді QA](/uk/concepts/qa-e2e-automation).

## Швидкий старт

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Звичайний `pnpm openclaw qa matrix` запускає `--profile all` і не зупиняється після першої помилки. Використовуйте `--profile fast --fail-fast` для release gate; розділяйте каталог на шарди за допомогою `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, коли запускаєте повний inventory паралельно.

## Що робить лейн

1. Створює одноразовий homeserver Tuwunel у Docker (стандартний образ `ghcr.io/matrix-construct/tuwunel:v1.5.1`, ім’я сервера `matrix-qa.test`, порт `28008`).
2. Реєструє трьох тимчасових користувачів — `driver` (надсилає вхідний трафік), `sut` (обліковий запис OpenClaw Matrix, що тестується), `observer` (перехоплення трафіку третьої сторони).
3. Готує кімнати, потрібні вибраним сценаріям (основну, для threading, media, restart, secondary, allowlist, E2EE, verification DM тощо).
4. Запускає дочірній OpenClaw gateway зі справжнім Matrix plugin, обмеженим обліковим записом SUT; `qa-channel` не завантажується в дочірньому процесі.
5. Виконує сценарії послідовно, спостерігаючи події через Matrix clients driver/observer.
6. Зупиняє homeserver, записує artifacts зі звітом і підсумком, потім завершує роботу.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Поширені прапорці

| Прапорець             | Стандартно                                    | Опис                                                                                                                        |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Профіль сценаріїв. Див. [Профілі](#profiles).                                                                               |
| `--fail-fast`         | off                                           | Зупинитися після першої невдалої перевірки або сценарію.                                                                    |
| `--scenario <id>`     | —                                             | Запустити лише цей сценарій. Можна повторювати. Див. [Сценарії](#scenarios).                                                |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Куди записуються звіти, підсумок, спостережені події та output log. Відносні шляхи обчислюються відносно `--repo-root`.     |
| `--repo-root <path>`  | `process.cwd()`                               | Корінь репозиторію під час виклику з нейтрального робочого каталогу.                                                        |
| `--sut-account <id>`  | `sut`                                         | Ідентифікатор облікового запису Matrix у конфігурації QA gateway.                                                           |

### Прапорці провайдера

Лейн використовує справжній транспорт Matrix, але model provider можна налаштувати:

| Прапорець                | Стандартно       | Опис                                                                                                                                            |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` для deterministic mock dispatch або `live-frontier` для live frontier providers. Legacy alias `live-openai` досі працює.          |
| `--model <ref>`          | provider default | Основний ref `provider/model`.                                                                                                                  |
| `--alt-model <ref>`      | provider default | Альтернативний ref `provider/model`, коли сценарії перемикаються посеред виконання.                                                             |
| `--fast`                 | off              | Увімкнути fast mode провайдера, де це підтримується.                                                                                            |

Matrix QA не приймає `--credential-source` або `--credential-role`. Лейн створює одноразових користувачів локально; спільного credential pool для lease немає.

## Профілі

Вибраний профіль визначає, які сценарії запускатимуться.

| Профіль         | Для чого використовувати                                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (default) | Повний каталог. Повільний, але вичерпний.                                                                                                                                                                                                       |
| `fast`          | Підмножина для release gate, яка перевіряє live transport contract: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation і delivery metadata для exec approval.      |
| `transport`     | Сценарії transport-level threading, DM, room, autojoin, mention/allowlist, approval і reaction.                                                                                                                                                 |
| `media`         | Покриття вкладень image, audio, video, PDF, EPUB.                                                                                                                                                                                               |
| `e2ee-smoke`    | Мінімальне покриття E2EE — базова зашифрована відповідь, thread follow-up, успішний bootstrap.                                                                                                                                                  |
| `e2ee-deep`     | Вичерпні сценарії E2EE для state-loss, backup, key і recovery.                                                                                                                                                                                  |
| `e2ee-cli`      | CLI-сценарії `openclaw matrix encryption setup` і `verify *`, керовані через QA harness.                                                                                                                                                        |

Точне зіставлення міститься в `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Сценарії

Повний список ідентифікаторів сценаріїв — це union `MatrixQaScenarioId` у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Категорії охоплюють:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming і tool progress — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- approvals — `matrix-approval-*` (exec/plugin metadata, chunked fallback, deny reactions, threads і routing `target: "both"`)
- restart і replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot і allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (basic reply, thread follow-up, bootstrap, recovery key lifecycle, state-loss variants, server backup behavior, device hygiene, SAS / QR / DM verification, restart, artifact redaction)
- E2EE CLI — `matrix-e2ee-cli-*` (encryption setup, idempotent setup, bootstrap failure, recovery-key lifecycle, multi-account, gateway-reply round-trip, self-verification)

Передайте `--scenario <id>` (можна повторювати), щоб запустити вручну вибраний набір; поєднуйте з `--profile all`, щоб ігнорувати profile gating.

## Змінні середовища

| Змінна                                  | Стандартно                                | Ефект                                                                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 хв)                         | Жорстка верхня межа для всього запуску.                                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Quiet window для негативних no-reply assertions. Обмежується до `≤` timeout запуску.                                                                                                                    |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Обмеження для Docker teardown. Failure surfaces містять recovery-команду `docker compose ... down --remove-orphans`.                                                                                   |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Перевизначає образ homeserver під час перевірки з іншою версією Tuwunel.                                                                                                                               |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | on                                        | `0` вимикає progress lines `[matrix-qa] ...` у stderr. `1` примусово вмикає їх.                                                                                                                         |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redacted                                  | `1` зберігає message body і `formatted_body` у `matrix-qa-observed-events.json`. Типово дані редагуються, щоб CI artifacts залишалися безпечними.                                                     |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | off                                       | `1` пропускає deterministic `process.exit` після запису artifacts. Типово вихід примусовий, бо native crypto handles matrix-js-sdk можуть утримувати event loop живим після завершення artifacts.     |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | unset                                     | Коли встановлено зовнішнім launcher (наприклад, `scripts/run-node.mjs`), Matrix QA повторно використовує цей шлях log замість запуску власного tee.                                                     |

## Output artifacts

Записуються до `--output-dir`:

- `matrix-qa-report.md` — звіт протоколу у Markdown (що пройшло, не пройшло, було пропущено і чому).
- `matrix-qa-summary.json` — структурований підсумок, придатний для парсингу в CI та панелей моніторингу.
- `matrix-qa-observed-events.json` — спостережені події Matrix від клієнтів драйвера й спостерігача. Тіла редагуються, якщо не встановлено `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; метадані затвердження узагальнюються з вибраними безпечними полями та скороченим попереднім переглядом команди.
- `matrix-qa-output.log` — об’єднані stdout/stderr із запуску. Якщо встановлено `OPENCLAW_RUN_NODE_OUTPUT_LOG`, натомість повторно використовується журнал зовнішнього запускача.

Типовий каталог виводу — `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, тому послідовні запуски не перезаписують один одного.

## Поради з тріажу

- **Запуск зависає ближче до кінця:** нативні криптографічні дескриптори `matrix-js-sdk` можуть пережити harness. Типова поведінка примусово виконує чистий `process.exit` після запису артефактів; якщо ви скасували `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, очікуйте, що процес залишатиметься активним.
- **Помилка очищення:** знайдіть надруковану команду відновлення (виклик `docker compose ... down --remove-orphans`) і запустіть її вручну, щоб звільнити порт homeserver.
- **Нестабільні вікна негативних тверджень у CI:** зменште `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (типово 8 с), коли CI швидкий; збільште його на повільних спільних runner-ах.
- **Потрібні відредаговані тіла для звіту про ваду:** перезапустіть із `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` і додайте `matrix-qa-observed-events.json`. Вважайте отриманий артефакт чутливим.
- **Інша версія Tuwunel:** спрямуйте `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` на версію, що тестується. Lane перевіряє лише закріплений типовий образ.

## Контракт live-транспорту

Matrix — один із трьох lane live-транспорту (Matrix, Telegram, Discord), які спільно використовують єдиний контрольний список контракту, визначений у [огляді QA → Покриття live-транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` залишається широким синтетичним набором і навмисно не є частиною цієї матриці.

## Пов’язане

- [Огляд QA](/uk/concepts/qa-e2e-automation) — загальний стек QA та контракт live-транспорту
- [Канал QA](/uk/channels/qa-channel) — синтетичний адаптер каналу для сценаріїв, підтримуваних репозиторієм
- [Тестування](/uk/help/testing) — запуск тестів і додавання покриття QA
- [Matrix](/uk/channels/matrix) — плагін каналу, що тестується
