---
read_when:
    - Запуск или исправление тестов
summary: Как запускать тесты локально (vitest) и когда использовать режимы force/coverage
title: Тесты
x-i18n:
    generated_at: "2026-06-28T23:46:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Полный набор для тестирования (наборы тестов, live, Docker): [Тестирование](/ru/help/testing)
- Проверка обновлений и пакетов Plugin: [Тестирование обновлений и Plugins](/ru/help/testing-updates-plugins)

- Обычный порядок локального тестирования:
  1. `pnpm test:changed` для подтверждения Vitest в области измененных файлов.
  2. `pnpm test <path-or-filter>` для одного файла, каталога или явной цели.
  3. `pnpm test` только когда намеренно нужен полный локальный набор Vitest.
- `pnpm test:force`: Завершает любой оставшийся процесс gateway, удерживающий стандартный порт управления, затем запускает полный набор Vitest с изолированным портом gateway, чтобы серверные тесты не конфликтовали с запущенным экземпляром. Используйте это, когда предыдущий запуск gateway оставил порт 18789 занятым.
- `pnpm test:coverage`: Запускает набор модульных тестов с покрытием V8 (через `vitest.unit.config.ts`). Это gate покрытия стандартной модульной дорожки, а не покрытие всех файлов всего репозитория. Пороги: 70% для строк/функций/операторов и 55% для ветвей. Поскольку `coverage.all` равен false, а стандартная дорожка ограничивает включения покрытия небыстрыми модульными тестами с соседними исходными файлами, gate измеряет исходный код, принадлежащий этой дорожке, а не каждый транзитивный импорт, который она случайно загружает.
- `pnpm test:coverage:changed`: Запускает модульное покрытие только для файлов, измененных относительно `origin/main`.
- `pnpm test:changed`: дешевый интеллектуальный запуск тестов по изменениям. Он запускает точные цели из прямых правок тестов, соседних файлов `*.test.ts`, явных сопоставлений исходного кода и локального графа импортов. Широкие изменения конфигурации/пакетов пропускаются, если они не сопоставляются с точными тестами.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: явный широкий запуск тестов по изменениям. Используйте его, когда правка тестового harness/конфигурации/пакета должна откатываться к более широкому поведению Vitest для измененных тестов.
- `pnpm changed:lanes`: показывает архитектурные дорожки, вызванные diff относительно `origin/main`.
- `pnpm check:changed`: по умолчанию вне CI делегирует в Crabbox/Testbox, затем запускает интеллектуальный измененный check gate для diff относительно `origin/main` внутри удаленного дочернего процесса. Он запускает typecheck, lint и guard-команды для затронутых архитектурных дорожек, но не запускает тесты Vitest. Для подтверждения тестами используйте `pnpm test:changed` или явный `pnpm test <target>`.
- Рабочие деревья Codex и связанные/разреженные checkout: избегайте прямых локальных `pnpm test*`, `pnpm check*` и `pnpm crabbox:run`, если вы не проверили, что pnpm не будет согласовывать зависимости. Для крошечного подтверждения по явному файлу используйте `node scripts/run-vitest.mjs <path-or-filter>`; для changed gates или широкого подтверждения используйте `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, чтобы pnpm выполнялся внутри Testbox.
- Подтверждение Testbox через Crabbox: используйте итоговые `exitCode` и timing JSON wrapper как результат команды. Делегированный запуск Blacksmith GitHub Actions может показывать `cancelled` после успешной SSH-команды, потому что Testbox останавливается извне keepalive action; перед тем как считать это ошибкой теста, проверьте summary wrapper и вывод команды.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: удерживает сериализацию тяжелых проверок внутри текущего рабочего дерева вместо общего Git-каталога для команд вроде `pnpm check:changed` и целевых `pnpm test ...`. Используйте это только на локальных хостах высокой мощности, когда намеренно запускаете независимые проверки в связанных рабочих деревьях.
- `pnpm test`: направляет явные цели файлов/каталогов через ограниченные дорожки Vitest. Запуски без целей являются подтверждением полного набора: они используют фиксированные группы shards, разворачиваются в leaf-конфигурации для локального параллельного выполнения и перед стартом печатают ожидаемый локальный fanout shards. Группа расширений всегда разворачивается в per-extension shard configs вместо одного огромного процесса root-project.
- Запуски test wrapper заканчиваются короткой сводкой `[test] passed|failed|skipped ... in ...`. Собственная строка длительности Vitest остается деталью по каждому shard.
- Общее тестовое состояние OpenClaw: используйте `src/test-utils/openclaw-test-state.ts` из Vitest, когда тесту нужен изолированный `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture конфигурации, workspace, каталог агента или хранилище auth-profile.
- `pnpm test:env-mutations:report`: неблокирующий отчет о тестах и harness, которые напрямую изменяют `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` или связанные env-ключи OpenClaw. Используйте его, чтобы найти кандидатов для миграции на общий helper тестового состояния.
- Замоканный E2E Control UI: используйте `pnpm test:ui:e2e` для дорожки Vitest + Playwright, которая запускает Vite Control UI и управляет настоящей страницей Chromium против замоканного Gateway WebSocket. Тесты находятся в `ui/src/**/*.e2e.test.ts`; общие mocks и элементы управления находятся в `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` включает эту дорожку. В рабочих деревьях Codex предпочитайте `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` для крошечного целевого подтверждения после установки зависимостей либо Testbox/Crabbox для более широкого GUI-подтверждения.
- Helpers для process E2E: используйте `test/helpers/openclaw-test-instance.ts`, когда Vitest E2E-тесту на уровне процесса нужен работающий Gateway, env CLI, захват логов и очистка в одном месте.
- PTY-тесты TUI: используйте `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` для быстрой PTY-дорожки с fake-backend. Используйте `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` или `pnpm tui:pty:test:watch --mode local` для более медленного smoke `tui --local`, который мокает только внешний model endpoint. Проверяйте стабильный видимый текст или вызовы fixture, а не сырые ANSI-снимки.
- Helpers Docker/Bash E2E: дорожки, которые source `scripts/lib/docker-e2e-image.sh`, могут передать `docker_e2e_test_state_shell_b64 <label> <scenario>` в контейнер и декодировать это с помощью `scripts/lib/openclaw-e2e-instance.sh`; multi-home scripts могут передать `docker_e2e_test_state_function_b64` и вызвать `openclaw_test_state_create <label> <scenario>` в каждом flow. Низкоуровневые callers могут использовать `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` для shell-фрагмента внутри контейнера или `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` для sourceable env-файла хоста. `--` перед `create` не дает новым runtime Node трактовать `--env-file` как флаг Node. Дорожки Docker/Bash, запускающие Gateway, могут source `scripts/lib/openclaw-e2e-instance.sh` внутри контейнера для разрешения entrypoint, запуска mock OpenAI, запуска Gateway на переднем/заднем плане, readiness probes, экспорта state env, дампов логов и очистки процессов.
- Полные, extension и include-pattern shard-запуски обновляют локальные данные таймингов в `.artifacts/vitest-shard-timings.json`; последующие whole-config запуски используют эти тайминги для балансировки медленных и быстрых shards. Include-pattern CI shards добавляют имя shard к ключу тайминга, что сохраняет видимость таймингов отфильтрованных shards без замены whole-config timing data. Установите `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, чтобы игнорировать локальный artifact таймингов.
- Выбранные тестовые файлы `plugin-sdk` и `commands` теперь направляются через выделенные легкие дорожки, которые оставляют только `test/setup.ts`, сохраняя runtime-heavy cases на их существующих дорожках.
- Исходные файлы с соседними тестами сопоставляются с этим соседним тестом перед откатом к более широким glob каталогов. Правки helpers в `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` и `src/plugins/contracts` используют локальный граф импортов, чтобы запускать импортирующие тесты вместо широкого запуска каждого shard, когда путь зависимости точен.
- `auto-reply` теперь также разделяется на три выделенные конфигурации (`core`, `top-level`, `reply`), чтобы reply harness не доминировал над более легкими top-level тестами статуса/токенов/helpers.
- Базовая конфигурация Vitest теперь по умолчанию использует `pool: "threads"` и `isolate: false`, а общий non-isolated runner включен во всех конфигурациях репозитория.
- `pnpm test:channels` запускает `vitest.channels.config.ts`.
- `pnpm test:extensions` и `pnpm test extensions` запускают все shards расширений/Plugin. Тяжелые channel plugins, browser Plugin и OpenAI выполняются как выделенные shards; остальные группы Plugin остаются пакетированными. Используйте `pnpm test extensions/<id>` для одной дорожки bundled Plugin.
- `pnpm test:perf:imports`: включает отчетность Vitest по import-duration и import-breakdown, при этом все еще используя маршрутизацию по ограниченным дорожкам для явных целей файлов/каталогов.
- `pnpm test:perf:imports:changed`: то же профилирование импортов, но только для файлов, измененных относительно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` измеряет производительность routed changed-mode path относительно нативного root-project run для того же закоммиченного git diff.
- `pnpm test:perf:changed:bench -- --worktree` измеряет производительность набора изменений текущего рабочего дерева без предварительного коммита.
- `pnpm test:perf:profile:main`: записывает CPU profile для основного потока Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: записывает CPU + heap profiles для unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: последовательно запускает каждую full-suite leaf-конфигурацию Vitest и записывает сгруппированные данные длительности плюс JSON/log artifacts по каждой конфигурации. Test Performance Agent использует это как baseline перед попыткой исправить медленные тесты.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: сравнивает сгруппированные отчеты после изменения, сфокусированного на производительности.
- `pnpm test:docker:timings <summary.json>` проверяет медленные Docker-дорожки после запуска Docker all; используйте `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, чтобы напечатать дешевые целевые команды перезапуска из тех же artifacts.
- Интеграция Gateway: включается явно через `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` или `pnpm test:gateway`.
- `pnpm test:e2e`: Запускает агрегированный E2E репозитория: end-to-end smoke-тесты gateway плюс замоканную browser E2E-дорожку Control UI.
- `pnpm test:e2e:gateway`: Запускает gateway end-to-end smoke-тесты (сопряжение нескольких экземпляров WS/HTTP/node). По умолчанию использует `threads` + `isolate: false` с адаптивными workers в `vitest.e2e.config.ts`; настройте через `OPENCLAW_E2E_WORKERS=<n>` и установите `OPENCLAW_E2E_VERBOSE=1` для подробных логов.
- `pnpm test:live`: Запускает live-тесты провайдеров (minimax/zai). Требует API keys и `LIVE=1` (или provider-specific `*_LIVE_TEST=1`), чтобы снять пропуск.
- `pnpm test:docker:all`: Собирает общий образ live-тестов, один раз упаковывает OpenClaw как npm-тарбол, собирает или переиспользует минимальный образ раннера Node/Git плюс функциональный образ, который устанавливает этот тарбол в `/app`, затем запускает smoke-линии Docker с `OPENCLAW_SKIP_DOCKER_BUILD=1` через взвешенный планировщик. Минимальный образ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) используется для линий установщика, обновления и зависимостей Plugin; эти линии монтируют заранее собранный тарбол вместо использования скопированных исходников репозитория. Функциональный образ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) используется для обычных линий функциональности собранного приложения. `scripts/package-openclaw-for-docker.mjs` — единственный локальный/CI упаковщик пакета; он проверяет тарбол и `dist/postinstall-inventory.json` перед тем, как Docker начнет их использовать. Определения линий Docker находятся в `scripts/lib/docker-e2e-scenarios.mjs`; логика планировщика находится в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` выполняет выбранный план. `node scripts/test-docker-all.mjs --plan-json` выводит принадлежащий планировщику CI-план для выбранных линий, типов образов, потребностей в пакетах/live-образах, сценариев состояния и проверок учетных данных без сборки или запуска Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` управляет слотами процессов и по умолчанию равен 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` управляет чувствительным к провайдерам tail-пулом и по умолчанию равен 10. Ограничения тяжелых линий по умолчанию равны `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` и `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; ограничения провайдеров по умолчанию допускают по одной тяжелой линии на провайдера через `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` и `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Используйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` или `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` для более крупных хостов. Если одна линия превышает эффективное ограничение веса или ресурсов на хосте с низким параллелизмом, она все равно может стартовать из пустого пула и будет выполняться одна, пока не освободит емкость. Запуски линий по умолчанию разнесены на 2 секунды, чтобы избежать локальных всплесков создания в демоне Docker; переопределите это через `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Раннер по умолчанию выполняет preflight-проверку Docker, очищает устаревшие E2E-контейнеры OpenClaw, каждые 30 секунд выводит статус активных линий, разделяет кэши CLI-инструментов провайдеров между совместимыми линиями, по умолчанию один раз повторяет временные сбои live-провайдеров (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) и сохраняет времена выполнения линий в `.artifacts/docker-tests/lane-timings.json` для сортировки от самых долгих в последующих запусках. Используйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, чтобы напечатать манифест линий без запуска Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` для настройки вывода статуса или `OPENCLAW_DOCKER_ALL_TIMINGS=0`, чтобы отключить повторное использование таймингов. Используйте `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` только для детерминированных/локальных линий или `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` только для линий live-провайдеров; псевдонимы пакета — `pnpm test:docker:local:all` и `pnpm test:docker:live:all`. Режим только live объединяет основные и tail live-линии в один пул с сортировкой от самых долгих, чтобы бакеты провайдеров могли совместно упаковывать работу Claude, Codex и Gemini. Раннер прекращает планировать новые pooled-линии после первого сбоя, если не задано `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, и у каждой линии есть резервный таймаут 120 минут, переопределяемый через `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; выбранные live/tail-линии используют более строгие ограничения для отдельных линий. Команды настройки Docker для CLI-бэкенда имеют собственный таймаут через `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (по умолчанию 180). Логи отдельных линий, `summary.json`, `failures.json` и тайминги фаз записываются в `.artifacts/docker-tests/<run-id>/`; используйте `pnpm test:docker:timings <summary.json>` для просмотра медленных линий и `pnpm test:docker:rerun <run-id|summary.json|failures.json>` для печати дешевых целевых команд повторного запуска.
- `pnpm test:docker:browser-cdp-snapshot`: Собирает исходный E2E-контейнер на базе Chromium, запускает raw CDP и изолированный Gateway, выполняет `browser doctor --deep` и проверяет, что снапшоты ролей CDP включают URL ссылок, продвинутые курсором кликабельные элементы, ссылки iframe и метаданные фреймов.
- `pnpm test:docker:skill-install`: Устанавливает упакованный тарбол OpenClaw в минимальный Docker-раннер, отключает `skills.install.allowUploadedArchives`, разрешает текущий slug Skills из live-поиска ClawHub, устанавливает его через `openclaw skills install` и проверяет `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` и `skills info --json`.
- Live-пробы CLI-бэкенда в Docker можно запускать как сфокусированные линии, например `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` или `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini имеет соответствующие псевдонимы `:resume` и `:mcp`.
- `pnpm test:docker:openwebui`: Запускает контейнеризованные OpenClaw + Open WebUI, выполняет вход через Open WebUI, проверяет `/api/models`, затем запускает реальный проксированный чат через `/api/chat/completions`. Требует пригодный ключ live-модели, загружает внешний образ Open WebUI и не ожидается таким же стабильным в CI, как обычные наборы unit/e2e.
- `pnpm test:docker:mcp-channels`: Запускает контейнер Gateway с seed-данными и второй клиентский контейнер, который порождает `openclaw mcp serve`, затем проверяет обнаружение маршрутизируемых разговоров, чтение транскриптов, метаданные вложений, поведение очереди live-событий, маршрутизацию исходящей отправки и уведомления каналов + разрешений в стиле Claude через реальный stdio-мост. Проверка уведомления Claude читает raw stdio MCP-фреймы напрямую, чтобы smoke отражал то, что мост действительно выводит.
- `pnpm test:docker:upgrade-survivor`: Устанавливает упакованный тарбол OpenClaw поверх загрязненной фикстуры старого пользователя, запускает обновление пакета плюс неинтерактивный doctor без ключей live-провайдера или канала, затем запускает loopback Gateway и проверяет, что агенты, конфигурация канала, allowlist Plugin, файлы workspace/session, устаревшее состояние зависимостей legacy Plugin, запуск и RPC-статус сохраняются.
- `pnpm test:docker:published-upgrade-survivor`: По умолчанию устанавливает `openclaw@latest`, наполняет реалистичные файлы существующего пользователя без ключей live-провайдера или канала, настраивает этот baseline встроенным рецептом команды `openclaw config set`, обновляет опубликованную установку до упакованного тарбола OpenClaw, запускает неинтерактивный doctor, записывает `.artifacts/upgrade-survivor/summary.json`, затем запускает loopback Gateway и проверяет, что настроенные intents, файлы workspace/session, устаревшая конфигурация Plugin и legacy-состояние зависимостей, запуск, `/healthz`, `/readyz` и RPC-статус сохраняются или корректно восстанавливаются. Переопределите один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, расширьте точную локальную матрицу через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, например `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, или добавьте фикстуры сценариев через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; набор reported-issues включает `configured-plugin-installs`, чтобы проверить, что настроенные внешние Plugin OpenClaw автоматически устанавливаются во время обновления, и `stale-source-plugin-shadow`, чтобы source-only тени Plugin не ломали запуск. Package Acceptance предоставляет их как `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` и `published_upgrade_survivor_scenarios`, а также разрешает meta baseline-токены, такие как `last-stable-4` или `all-since-2026.4.23`, перед передачей точных спецификаций пакетов линиям Docker.
- `pnpm test:docker:update-migration`: Запускает published-upgrade survivor harness в сценарии `plugin-deps-cleanup` с интенсивной очисткой, по умолчанию начиная с `openclaw@2026.4.23`. Отдельный workflow `Update Migration` расширяет эту линию с `baselines=all-since-2026.4.23`, чтобы каждый стабильный опубликованный пакет начиная с `.23` обновлялся до кандидата и доказывал очистку зависимостей настроенных Plugin вне Full Release CI.
- `pnpm test:docker:plugins`: Запускает smoke установок/обновлений для локального пути, `file:`, пакетов npm registry с hoisted-зависимостями, перемещаемых git-ссылок, фикстур ClawHub, обновлений marketplace и включения/инспекции Claude-bundle.

## Локальный PR gate

Для локальных проверок PR land/gate запустите:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Если `pnpm test` нестабилен на загруженном хосте, перезапустите один раз, прежде чем считать это регрессией, затем изолируйте с помощью `pnpm test <path/to/test>`. Для хостов с ограниченной памятью используйте:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Бенчмарк задержки моделей (локальные ключи)

Скрипт: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Использование:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Необязательные переменные окружения: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Промпт по умолчанию: "Ответьте одним словом: ok. Без пунктуации и лишнего текста."

Последний запуск (2025-12-31, 20 запусков):

- minimax: медиана 1279 мс (мин. 1114, макс. 2431)
- opus: медиана 2454 мс (мин. 1224, макс. 3170)

## Бенчмарк запуска CLI

Скрипт: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Использование:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Пресеты:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: оба пресета

Вывод включает `sampleCount`, среднее значение, p50, p95, мин./макс., распределение exit-code/сигналов и сводки max RSS для каждой команды. Необязательные `--cpu-prof-dir` / `--heap-prof-dir` записывают профили V8 для каждого запуска, чтобы измерение времени и сбор профилей использовали один и тот же harness.

Соглашения для сохраненного вывода:

- `pnpm test:startup:bench:smoke` записывает целевой smoke-артефакт в `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` записывает артефакт полного набора в `.artifacts/cli-startup-bench-all.json` с `runs=5` и `warmup=1`
- `pnpm test:startup:bench:update` обновляет зафиксированный baseline fixture в `test/fixtures/cli-startup-bench.json` с `runs=5` и `warmup=1`

Зафиксированный fixture:

- `test/fixtures/cli-startup-bench.json`
- Обновите с помощью `pnpm test:startup:bench:update`
- Сравните текущие результаты с fixture с помощью `pnpm test:startup:bench:check`

## Бенчмарк запуска Gateway

Скрипт: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

По умолчанию бенчмарк использует собранную точку входа CLI в `dist/entry.js`; перед использованием команд package-script запустите
`pnpm build`. Чтобы вместо этого измерить исходный
runner, передайте `--entry scripts/run-node.mjs` и храните эти результаты
отдельно от baseline для собранной точки входа.

Использование:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Идентификаторы случаев:

- `default`: обычный запуск Gateway.
- `skipChannels`: запуск Gateway с пропуском запуска каналов.
- `oneInternalHook`: один настроенный внутренний hook.
- `allInternalHooks`: все внутренние hooks.
- `fiftyPlugins`: 50 manifest plugins.
- `fiftyStartupLazyPlugins`: 50 startup-lazy manifest plugins.

Вывод включает первый вывод процесса, `/healthz`, `/readyz`, время лога HTTP listen,
время лога готовности Gateway, CPU time, CPU core ratio, max RSS, heap, метрики startup trace, задержку event-loop и подробные метрики таблицы поиска Plugin. Скрипт
включает `OPENCLAW_GATEWAY_STARTUP_TRACE=1` в окружении дочернего Gateway.

Считайте `/healthz` признаком liveness: HTTP-сервер может отвечать. Считайте `/readyz` признаком
usable readiness: startup plugin sidecars, каналы и ready-critical
post-attach work завершились. Startup hooks Gateway отправляются
асинхронно и не входят в гарантию readiness. Ready log time — это
внутренняя временная метка лога готовности Gateway; она полезна для атрибуции
на стороне процесса, но не заменяет внешний probe `/readyz`.

Используйте JSON-вывод или `--output` при сравнении изменений. Используйте `--cpu-prof-dir` только
после того, как trace output укажет на import, compile или CPU-bound работу, которую нельзя
объяснить одними phase timings. Не сравнивайте результаты source-runner с
результатами собранного `dist/entry.js` как один и тот же baseline.

## Бенчмарк перезапуска Gateway

Скрипт: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Бенчмарк перезапуска поддерживается только на macOS и Linux. Он использует SIGUSR1 для
in-process перезапусков и сразу завершается ошибкой на Windows.

По умолчанию бенчмарк использует собранную точку входа CLI в `dist/entry.js`; перед использованием команд package-script запустите
`pnpm build`. Чтобы вместо этого измерить исходный
runner, передайте `--entry scripts/run-node.mjs` и храните эти результаты
отдельно от baseline для собранной точки входа.

Использование:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Идентификаторы случаев:

- `skipChannels`: перезапуск с пропущенными каналами.
- `skipChannelsAcpxProbe`: перезапуск с пропущенными каналами и включенным ACPX startup probe.
- `skipChannelsNoAcpxProbe`: перезапуск с пропущенными каналами и выключенным ACPX startup probe.
- `default`: обычный перезапуск.
- `fiftyPlugins`: перезапуск с 50 manifest plugins.

Вывод включает следующий `/healthz`, следующий `/readyz`, downtime, timing готовности перезапуска,
CPU, RSS, метрики startup trace для процесса замены и метрики restart trace
для обработки сигнала, active-work drain, фаз закрытия, следующего запуска, timing готовности
и снимков памяти. Скрипт включает
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` и `OPENCLAW_GATEWAY_RESTART_TRACE=1` в
окружении дочернего Gateway.

Используйте этот бенчмарк, когда изменение затрагивает restart signaling, close handlers,
startup-after-restart, sidecar shutdown, service handoff или readiness после
перезапуска. Начинайте с `skipChannels`, когда изолируете механику Gateway от запуска каналов.
Используйте `default` или случаи с большим количеством Plugin только после того, как узкий случай объяснит
путь перезапуска.

Метрики trace — это подсказки для атрибуции, а не вердикты. Изменение перезапуска следует
оценивать по нескольким samples, соответствующему owner span, поведению `/healthz` и `/readyz`
и пользовательскому контракту перезапуска.

## Onboarding E2E (Docker)

Docker необязателен; это нужно только для контейнеризованных smoke tests onboarding.

Полный cold-start поток в чистом Linux-контейнере:

```bash
scripts/e2e/onboard-docker.sh
```

Этот скрипт управляет интерактивным мастером через pseudo-tty, проверяет файлы config/workspace/session, затем запускает gateway и выполняет `openclaw health`.

## Smoke-тест импорта QR (Docker)

Проверяет, что поддерживаемый QR runtime helper загружается в поддерживаемых Docker runtime Node (Node 24 по умолчанию, Node 22 совместим):

```bash
pnpm test:docker:qr
```

## Связанные материалы

- [Тестирование](/ru/help/testing)
- [Live-тестирование](/ru/help/testing-live)
- [Тестирование обновлений и plugins](/ru/help/testing-updates-plugins)
