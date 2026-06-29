---
read_when:
    - Локальный запуск pnpm openclaw qa matrix
    - Добавление или выбор сценариев QA для Matrix
    - Диагностика сбоев QA Matrix, тайм-аутов или зависшей очистки
summary: 'Справочник для сопровождающих по Docker-backed live QA lane для Matrix: CLI, профили, env vars, сценарии и выходные артефакты.'
title: Matrix QA
x-i18n:
    generated_at: "2026-06-28T22:52:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Линия Matrix QA запускает встроенный Plugin `@openclaw/matrix` против одноразового homeserver Tuwunel в Docker, с временными учетными записями driver, SUT и observer, а также предварительно заполненными комнатами. Это покрытие для Matrix с реальным живым транспортом.

Это инструмент только для сопровождающих. Пакетные релизы OpenClaw намеренно не включают `qa-lab`, поэтому `openclaw qa` доступен только из исходного checkout. Исходные checkout загружают встроенный runner напрямую - шаг установки Plugin не требуется.

Более широкий контекст фреймворка QA см. в [обзоре QA](/ru/concepts/qa-e2e-automation).

## Быстрый старт

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Обычная команда `pnpm openclaw qa matrix` запускает `--profile all` и не останавливается при первом сбое. Используйте `--profile fast --fail-fast` для release gate; разбивайте каталог на шарды с `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` при параллельном запуске полного набора.

## Что делает линия

1. Поднимает одноразовый homeserver Tuwunel в Docker (образ по умолчанию `ghcr.io/matrix-construct/tuwunel:v1.5.1`, имя сервера `matrix-qa.test`, порт `28008`).
2. Регистрирует трех временных пользователей - `driver` (отправляет входящий трафик), `sut` (тестируемая учетная запись OpenClaw Matrix), `observer` (захват стороннего трафика).
3. Заполняет комнаты, требуемые выбранными сценариями (основная, треды, медиа, перезапуск, вторичная, allowlist, E2EE, DM для верификации и т. д.).
4. Запускает дочерний Gateway OpenClaw с реальным Matrix Plugin, ограниченным учетной записью SUT; `qa-channel` в дочернем процессе не загружается.
5. Последовательно запускает сценарии, наблюдая события через Matrix-клиенты driver/observer.
6. Останавливает homeserver, записывает артефакты отчета и сводки, затем завершает работу.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Общие флаги

| Флаг                  | По умолчанию                                | Описание                                                                                                                    |
| --------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                       | Профиль сценариев. См. [Профили](#profiles).                                                                                |
| `--fail-fast`         | выкл.                                       | Остановиться после первой неудачной проверки или сценария.                                                                  |
| `--scenario <id>`     | -                                           | Запустить только этот сценарий. Можно повторять. См. [Сценарии](#scenarios).                                                |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Куда записываются отчеты, сводка, наблюдаемые события и выходной лог. Относительные пути разрешаются относительно `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                             | Корень репозитория при запуске из нейтрального рабочего каталога.                                                           |
| `--sut-account <id>`  | `sut`                                       | ID учетной записи Matrix внутри конфигурации QA Gateway.                                                                    |

### Флаги провайдера

Линия использует реальный транспорт Matrix, но провайдер модели настраивается:

| Флаг                     | По умолчанию     | Описание                                                                                                                                 |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` для детерминированной mock-диспетчеризации или `live-frontier` для живых frontier-провайдеров. Устаревший alias `live-openai` все еще работает. |
| `--model <ref>`          | значение провайдера по умолчанию | Основной ref `provider/model`.                                                                                                           |
| `--alt-model <ref>`      | значение провайдера по умолчанию | Альтернативный ref `provider/model`, когда сценарии переключаются в середине запуска.                                                    |
| `--fast`                 | выкл.            | Включить быстрый режим провайдера там, где он поддерживается.                                                                            |

Matrix QA не принимает `--credential-source` или `--credential-role`. Линия локально подготавливает одноразовых пользователей; общего пула учетных данных для аренды нет.

## Профили

Выбранный профиль определяет, какие сценарии запускаются.

| Профиль         | Для чего использовать                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (по умолчанию) | Полный каталог. Медленно, но исчерпывающе.                                                                                                                                                                      |
| `fast`          | Подмножество для release gate, проверяющее контракт живого транспорта: canary, gating по упоминанию, блок allowlist, форму ответа, resume после перезапуска, продолжение треда, изоляцию тредов, наблюдение реакций и доставку метаданных exec approval. |
| `transport`     | Сценарии уровня транспорта для тредов, DM, комнат, autojoin, mention/allowlist, approval и реакций.                                                                                                                   |
| `media`         | Покрытие вложений изображений, аудио, видео, PDF, EPUB.                                                                                                                                                                |
| `e2ee-smoke`    | Минимальное покрытие E2EE - базовый зашифрованный ответ, продолжение треда, успешный bootstrap.                                                                                                                       |
| `e2ee-deep`     | Исчерпывающие сценарии E2EE для потери состояния, backup, ключей и восстановления.                                                                                                                                     |
| `e2ee-cli`      | Сценарии CLI `openclaw matrix encryption setup` и `verify *`, выполняемые через QA harness.                                                                                                                            |

Точное сопоставление находится в `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Сценарии

Полный список ID сценариев - это union `MatrixQaScenarioId` в `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Категории включают:

- треды - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- верхний уровень / DM / комната - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming и ход выполнения инструментов - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- медиа - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- маршрутизация - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- реакции - `matrix-reaction-*`
- approvals - `matrix-approval-*` (метаданные exec/plugin, chunked fallback, реакции deny, треды и маршрутизация `target: "both"`)
- перезапуск и replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- gating по упоминанию, bot-to-bot и allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (базовый ответ, продолжение треда, bootstrap, жизненный цикл recovery key, варианты потери состояния, поведение server backup, гигиена устройств, SAS / QR / DM-верификация, перезапуск, редактирование артефактов)
- E2EE CLI - `matrix-e2ee-cli-*` (настройка шифрования, идемпотентная настройка, сбой bootstrap, жизненный цикл recovery-key, несколько учетных записей, полный цикл gateway-reply, самоверификация)

Передайте `--scenario <id>` (можно повторять), чтобы запустить вручную выбранный набор; сочетайте с `--profile all`, чтобы игнорировать gating профиля.

## Переменные окружения

| Переменная                             | По умолчанию                              | Эффект                                                                                                                                                                                                 |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 мин)                        | Жесткая верхняя граница всего запуска.                                                                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Ограничение для начального canary-ответа. Release CI увеличивает его на общих раннерах, чтобы медленный первый ход Gateway не приводил к сбою до начала покрытия сценариев.                           |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Тихое окно для отрицательных проверок отсутствия ответа. Ограничивается значением `≤` тайм-аута запуска.                                                                                               |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Ограничение для остановки Docker. Сообщения о сбоях включают команду восстановления `docker compose ... down --remove-orphans`.                                                                        |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Переопределяет образ homeserver при проверке с другой версией Tuwunel.                                                                                                                                  |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | включено                                  | `0` отключает строки прогресса `[matrix-qa] ...` в stderr. `1` принудительно включает их.                                                                                                               |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | отредактировано                           | `1` сохраняет тело сообщения и `formatted_body` в `matrix-qa-observed-events.json`. По умолчанию данные редактируются, чтобы артефакты CI оставались безопасными.                                      |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | выключено                                 | `1` пропускает детерминированный `process.exit` после записи артефактов. По умолчанию выход выполняется принудительно, потому что нативные crypto-дескрипторы matrix-js-sdk могут удерживать event loop активным после завершения артефактов. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | не задано                                 | Если задано внешним запускателем (например, `scripts/run-node.mjs`), Matrix QA повторно использует этот путь к журналу вместо запуска собственного tee.                                                |

## Выходные артефакты

Записываются в `--output-dir`:

- `matrix-qa-report.md` - Markdown-отчет протокола (что прошло, завершилось с ошибкой, было пропущено и почему).
- `matrix-qa-summary.json` - структурированная сводка, подходящая для разбора в CI и панелей мониторинга.
- `matrix-qa-observed-events.json` - наблюдаемые события Matrix от клиентов драйвера и наблюдателя. Тела редактируются, если не задано `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; метаданные подтверждений суммируются с выбранными безопасными полями и усеченным предпросмотром команды.
- `matrix-qa-output.log` - объединенные stdout/stderr запуска. Если задано `OPENCLAW_RUN_NODE_OUTPUT_LOG`, вместо этого повторно используется журнал внешнего запускателя.

Каталог вывода по умолчанию: `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, поэтому последовательные запуски не перезаписывают друг друга.

## Советы по триажу

- **Запуск зависает ближе к концу:** нативные crypto-дескрипторы `matrix-js-sdk` могут жить дольше harness. По умолчанию после записи артефактов принудительно выполняется чистый `process.exit`; если вы сняли `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, ожидайте, что процесс задержится.
- **Ошибка очистки:** найдите напечатанную команду восстановления (вызов `docker compose ... down --remove-orphans`) и выполните ее вручную, чтобы освободить порт homeserver.
- **Нестабильные окна отрицательных проверок в CI:** уменьшите `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (по умолчанию 8 с), когда CI быстрый; увеличьте его на медленных общих раннерах.
- **Нужны отредактированные тела для отчета об ошибке:** перезапустите с `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` и приложите `matrix-qa-observed-events.json`. Считайте получившийся артефакт чувствительным.
- **Другая версия Tuwunel:** укажите в `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` тестируемую версию. Линия проверяет только закрепленный образ по умолчанию.

## Контракт живого транспорта

Matrix — одна из трех линий живого транспорта (Matrix, Telegram, Discord), которые используют единый контрольный список контракта, определенный в [обзоре QA → покрытие живого транспорта](/ru/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` остается широким синтетическим набором и намеренно не входит в эту матрицу.

## Связанные материалы

- [Обзор QA](/ru/concepts/qa-e2e-automation) - общий стек QA и контракт живого транспорта
- [QA Channel](/ru/channels/qa-channel) - синтетический адаптер канала для сценариев из репозитория
- [Тестирование](/ru/help/testing) - запуск тестов и добавление покрытия QA
- [Matrix](/ru/channels/matrix) - Plugin канала, находящийся под тестированием
