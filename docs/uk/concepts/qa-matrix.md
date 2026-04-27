---
read_when:
    - Локальний запуск `pnpm openclaw qa matrix`
    - Додавання або вибір сценаріїв QA Matrix
    - Діагностика збоїв, тайм-аутів або завислого очищення в QA Matrix
summary: 'Довідка для супровідників щодо live QA-каналу Matrix на базі Docker: CLI, профілі, змінні середовища, сценарії та вихідні артефакти.'
title: QA Matrix
x-i18n:
    generated_at: "2026-04-27T17:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b49528cafbdc1b3ca52b6dce9f5d98e806032c1d8fea49e1c49190982dd5767
    source_path: concepts/qa-matrix.md
    workflow: 15
---

QA-канал Matrix запускає вбудований Plugin `@openclaw/matrix` на одноразовому homeserver Tuwunel у Docker, із тимчасовими обліковими записами driver, SUT і observer та попередньо створеними кімнатами. Це live-покриття реального транспорту для Matrix.

Це інструментарій лише для супровідників. Пакетні релізи OpenClaw навмисно не містять `qa-lab`, тому `openclaw qa` доступний лише з checkout вихідного коду. Checkout вихідного коду завантажують вбудований runner безпосередньо — окремий крок встановлення plugin не потрібен.

Для ширшого контексту QA-фреймворку див. [огляд QA](/uk/concepts/qa-e2e-automation).

## Швидкий старт

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Звичайний `pnpm openclaw qa matrix` запускає `--profile all` і не зупиняється після першої помилки. Використовуйте `--profile fast --fail-fast` для релізного gate; розбивайте каталог через `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, коли запускаєте повний інвентар паралельно.

## Що робить цей канал

1. Розгортає одноразовий homeserver Tuwunel у Docker (типовий образ `ghcr.io/matrix-construct/tuwunel:v1.5.1`, назва сервера `matrix-qa.test`, порт `28008`).
2. Реєструє трьох тимчасових користувачів — `driver` (надсилає вхідний трафік), `sut` (обліковий запис OpenClaw Matrix, що тестується), `observer` (захоплення трафіку третьої сторони).
3. Створює кімнати, потрібні для вибраних сценаріїв (основна, для тредів, медіа, перезапуску, вторинна, allowlist, E2EE, DM для верифікації тощо).
4. Запускає дочірній Gateway OpenClaw із реальним plugin Matrix, обмеженим обліковим записом SUT; `qa-channel` у дочірньому процесі не завантажується.
5. Послідовно виконує сценарії, спостерігаючи події через клієнти Matrix driver/observer.
6. Зупиняє homeserver, записує артефакти звіту та підсумку, а потім завершує роботу.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Поширені прапорці

| Прапорець            | Типове значення                               | Опис                                                                                                                  |
| -------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                        | Профіль сценаріїв. Див. [Профілі](#profiles).                                                                         |
| `--fail-fast`        | вимкнено                                      | Зупинитися після першої перевірки або сценарію, що завершилися помилкою.                                             |
| `--scenario <id>`    | —                                             | Запустити лише цей сценарій. Можна вказувати повторно. Див. [Сценарії](#scenarios).                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Куди записуються звіти, підсумок, спостережені події та журнал виводу. Відносні шляхи обчислюються від `--repo-root`. |
| `--repo-root <path>` | `process.cwd()`                               | Корінь репозиторію, якщо запуск виконується з нейтрального робочого каталогу.                                        |
| `--sut-account <id>` | `sut`                                         | Ідентифікатор облікового запису Matrix у конфігурації QA Gateway.                                                    |

### Прапорці провайдера

Канал використовує реальний транспорт Matrix, але провайдер моделі можна налаштувати:

| Прапорець               | Типове значення | Опис                                                                                                                                          |
| ----------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` для детермінованого mock-виклику або `live-frontier` для live frontier-провайдерів. Застарілий псевдонім `live-openai` теж і далі працює. |
| `--model <ref>`         | типове значення провайдера | Основне посилання `provider/model`.                                                                                              |
| `--alt-model <ref>`     | типове значення провайдера | Альтернативне посилання `provider/model` для сценаріїв, у яких відбувається перемикання посеред виконання.                      |
| `--fast`                | вимкнено        | Увімкнути швидкий режим провайдера, якщо він підтримується.                                                                                  |

Matrix QA не приймає `--credential-source` або `--credential-role`. Канал локально створює одноразових користувачів; спільного пулу облікових даних для оренди немає.

## Профілі

Вибраний профіль визначає, які сценарії запускатимуться.

| Профіль        | Призначення                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (типово) | Повний каталог. Повільно, але вичерпно.                                                                                                                                                      |
| `fast`         | Підмножина для релізного gate, яка перевіряє контракт live-транспорту: canary, фільтрацію mention, блокування allowlist, форму reply, відновлення після restart, подальшу відповідь у thread, ізоляцію thread, спостереження за reaction. |
| `transport`    | Сценарії рівня транспорту для threading, DM, room, autojoin, mention/allowlist.                                                                                                             |
| `media`        | Покриття вкладень image, audio, video, PDF, EPUB.                                                                                                                                           |
| `e2ee-smoke`   | Мінімальне покриття E2EE — базова зашифрована reply, подальша відповідь у thread, успішний bootstrap.                                                                                      |
| `e2ee-deep`    | Вичерпні сценарії E2EE для втрати стану, резервного копіювання, ключів і відновлення.                                                                                                       |
| `e2ee-cli`     | Сценарії CLI `openclaw matrix encryption setup` і `verify *`, що запускаються через QA harness.                                                                                             |

Точне зіставлення визначено в `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Сценарії

Повний список ідентифікаторів сценаріїв — це union `MatrixQaScenarioId` у `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Категорії включають:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- restart and replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating and allowlists — `matrix-mention-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (basic reply, thread follow-up, bootstrap, lifecycle ключа відновлення, варіанти втрати стану, поведінка резервного копіювання на сервері, гігієна пристроїв, SAS / QR / DM verification, restart, редагування артефактів)
- E2EE CLI — `matrix-e2ee-cli-*` (налаштування шифрування, ідемпотентне налаштування, помилка bootstrap, lifecycle recovery-key, кілька облікових записів, повний цикл gateway-reply, self-verification)

Передавайте `--scenario <id>` (можна повторювати), щоб запустити вибраний вручну набір; поєднуйте з `--profile all`, щоб ігнорувати фільтрацію за профілем.

## Змінні середовища

| Змінна                                 | Типове значення                           | Ефект                                                                                                                                                                                          |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 хв)                         | Жорстка верхня межа для всього запуску.                                                                                                                                                        |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Вікно тиші для негативних перевірок відсутності відповіді. Обмежується значенням `≤` тайм-ауту запуску.                                                                                       |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Межа часу для згортання Docker. У разі помилки поверхня збоїв включає recovery-команду `docker compose ... down --remove-orphans`.                                                            |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Перевизначає образ homeserver під час перевірки з іншою версією Tuwunel.                                                                                                                       |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | увімкнено                                 | `0` вимикає рядки прогресу `[matrix-qa] ...` у stderr. `1` примусово вмикає їх.                                                                                                                |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | редаговано                                | `1` зберігає тіло повідомлення та `formatted_body` у `matrix-qa-observed-events.json`. Типово дані редагуються, щоб артефакти CI залишалися безпечними.                                      |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | вимкнено                                  | `1` пропускає детермінований `process.exit` після запису артефактів. Типова поведінка примусово завершує процес, оскільки нативні crypto-хендли `matrix-js-sdk` можуть утримувати event loop активним після завершення запису артефактів. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | не встановлено                            | Якщо цю змінну встановив зовнішній launcher (наприклад, `scripts/run-node.mjs`), Matrix QA повторно використовує цей шлях до журналу замість запуску власного tee.                            |

## Вихідні артефакти

Записуються в `--output-dir`:

- `matrix-qa-report.md` — протокольний звіт у Markdown (що пройшло, що не пройшло, що було пропущено і чому).
- `matrix-qa-summary.json` — структурований підсумок, придатний для розбору в CI та інформаційних панелях.
- `matrix-qa-observed-events.json` — спостережені події Matrix від клієнтів driver і observer. Тіла повідомлень редагуються, якщо не встановлено `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`.
- `matrix-qa-output.log` — об’єднаний stdout/stderr запуску. Якщо встановлено `OPENCLAW_RUN_NODE_OUTPUT_LOG`, натомість повторно використовується журнал зовнішнього launcher.

Типовий каталог виводу — `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, тому послідовні запуски не перезаписують один одного.

## Поради з діагностики

- **Запуск зависає ближче до завершення:** нативні crypto-хендли `matrix-js-sdk` можуть жити довше за harness. Типова поведінка примусово викликає чистий `process.exit` після запису артефактів; якщо ви встановили `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, очікуйте, що процес може зависнути.
- **Помилка очищення:** знайдіть надруковану recovery-команду (виклик `docker compose ... down --remove-orphans`) і виконайте її вручну, щоб звільнити порт homeserver.
- **Нестабільні вікна негативних перевірок у CI:** зменшіть `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (типово 8 с), якщо CI працює швидко; збільшуйте його на повільних спільних runner.
- **Потрібні нередаговані тіла повідомлень для звіту про помилку:** перезапустіть із `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` і додайте `matrix-qa-observed-events.json`. Вважайте отриманий артефакт чутливим.
- **Інша версія Tuwunel:** вкажіть у `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` версію, яку потрібно перевірити. У репозиторії зафіксовано лише типовий pinned-образ.

## Контракт live-транспорту

Matrix — один із трьох каналів live-транспорту (Matrix, Telegram, Discord), які використовують спільний контрольний список контракту, визначений у [Огляд QA → Покриття live-транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` залишається широким синтетичним набором тестів і навмисно не входить до цієї матриці.

## Пов’язані матеріали

- [Огляд QA](/uk/concepts/qa-e2e-automation) — загальний стек QA і контракт live-транспорту
- [QA Channel](/uk/channels/qa-channel) — адаптер синтетичного каналу для сценаріїв на базі репозиторію
- [Тестування](/uk/help/testing) — запуск тестів і додавання QA-покриття
- [Matrix](/uk/channels/matrix) — plugin каналу, що тестується
