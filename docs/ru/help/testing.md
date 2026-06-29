---
read_when:
    - Запуск тестов локально или в CI
    - Добавление регрессионных тестов для ошибок моделей и провайдеров
    - Отладка поведения Gateway и агента
summary: 'Набор для тестирования: модульные, e2e и live-наборы, Docker-раннеры и что покрывает каждый тест'
title: Тестирование
x-i18n:
    generated_at: "2026-06-28T23:03:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw имеет три набора Vitest (unit/integration, e2e, live) и небольшой набор
Docker-раннеров. Этот документ — руководство «как мы тестируем»:

- Что покрывает каждый набор (и что он намеренно _не_ покрывает).
- Какие команды запускать для типичных рабочих процессов (локально, перед push, при отладке).
- Как live-тесты находят учетные данные и выбирают модели/провайдеров.
- Как добавлять регрессионные тесты для реальных проблем моделей/провайдеров.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документирован отдельно:

- [Обзор QA](/ru/concepts/qa-e2e-automation) - архитектура, поверхность команд, написание сценариев.
- [Matrix QA](/ru/concepts/qa-matrix) - справочник по `pnpm openclaw qa matrix`.
- [Карточка зрелости](/ru/maturity/scorecard) - как доказательства release QA поддерживают решения о стабильности и LTS.
- [QA channel](/ru/channels/qa-channel) - синтетический transport plugin, используемый сценариями из репозитория.

Эта страница описывает запуск обычных тестовых наборов и Docker/Parallels-раннеров. Раздел ниже для QA-специфичных раннеров ([QA-специфичные раннеры](#qa-specific-runners)) перечисляет конкретные вызовы `qa` и ссылается обратно на приведенные выше материалы.
</Note>

## Быстрый старт

В большинстве случаев:

- Полная проверка (ожидается перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Более быстрый локальный запуск полного набора на мощной машине: `pnpm test:max`
- Прямой цикл наблюдения Vitest: `pnpm test:watch`
- Прямое указание файла теперь также маршрутизирует пути extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- При итерации над одним отказом сначала предпочитайте целевые запуски.
- Docker-backed QA-сайт: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Когда вы меняете тесты или хотите дополнительной уверенности:

- Проверка покрытия: `pnpm test:coverage`
- Набор E2E: `pnpm test:e2e`

## Временные каталоги тестов

Предпочитайте общие вспомогательные функции из `test/helpers/temp-dir.ts` для временных каталогов,
принадлежащих тестам. Они явно задают владение и удерживают очистку в том же
жизненном цикле теста:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Используйте `makeTempDir(tempDirs, prefix)` и `cleanupTempDirs(tempDirs)`, когда тест
уже владеет массивом или набором путей. Избегайте новых прямых вызовов `fs.mkdtemp*` в
тестах, если конкретный случай явно не проверяет поведение сырого temp-dir. Добавляйте
проверяемый комментарий-разрешение с конкретной причиной, когда тесту намеренно нужен
прямой временный каталог:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Для видимости миграции `node scripts/report-test-temp-creations.mjs` сообщает о
создании новых прямых temp-dir в добавленных строках diff, не блокируя существующие
стили очистки. Его область файлов намеренно следует той же классификации test-path,
которую использует `scripts/changed-lanes.mjs`, вместо поддержки отдельной эвристики
имен файлов test-helper, при этом пропуская саму реализацию общего helper.
`check:changed` запускает этот отчет для измененных test paths как warning-only CI
сигнал; находки являются предупреждающими аннотациями GitHub, а не отказами.

При отладке реальных провайдеров/моделей (требуются реальные учетные данные):

- Live-набор (модели + gateway tool/image probes): `pnpm test:live`
- Тихо запустить один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Отчеты о производительности runtime: отправьте `OpenClaw Performance` с
  `live_openai_candidate=true` для реального agent turn `openai/gpt-5.5` или
  `deep_profile=true` для артефактов CPU/heap/trace Kova. Ежедневные запланированные запуски
  публикуют артефакты mock-provider, deep-profile и GPT 5.5 lane в
  `openclaw/clawgrit-reports`, когда настроен `CLAWGRIT_REPORTS_TOKEN`. Отчет
  mock-provider также включает source-level gateway boot, memory,
  plugin-pressure, повторяющиеся fake-model hello-loop и числа запуска CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Каждая выбранная модель теперь выполняет текстовый turn плюс небольшой probe в стиле чтения файла.
    Модели, чьи метаданные объявляют вход `image`, также выполняют небольшой image turn.
    Отключайте дополнительные probes с `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` или
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` при изоляции отказов провайдера.
  - Покрытие CI: ежедневные `OpenClaw Scheduled Live And E2E Checks` и ручные
    `OpenClaw Release Checks` оба вызывают переиспользуемый live/E2E workflow с
    `include_live_suites: true`, который включает отдельные Docker live model
    matrix jobs, шардированные по провайдеру.
  - Для сфокусированных повторных запусков CI отправьте `OpenClaw Live And E2E Checks (Reusable)`
    с `include_live_suites: true` и `live_models_only: true`.
  - Добавляйте новые высокосигнальные секреты провайдера в `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` и его
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускает Docker live lane против пути Codex app-server, привязывает синтетический
    Slack DM через `/codex bind`, выполняет `/codex fast` и
    `/codex permissions`, затем проверяет обычный ответ и маршрут image attachment
    через native plugin binding вместо ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускает gateway agent turns через принадлежащий Plugin Codex app-server harness,
    проверяет `/codex status` и `/codex models` и по умолчанию выполняет probes для image,
    cron MCP, sub-agent и Guardian. Отключите sub-agent probe с
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` при изоляции других отказов Codex
    app-server. Для сфокусированной проверки sub-agent отключите остальные probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Это завершится после sub-agent probe, если только
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` не задан.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Устанавливает упакованный tarball OpenClaw в Docker, запускает onboarding с OpenAI API-key
    и проверяет, что Codex plugin плюс зависимость `@openai/codex`
    были по требованию загружены в корень управляемого npm-проекта.
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - Упаковывает fixture plugin с реальной зависимостью `slugify`, устанавливает его через
    `npm-pack:`, проверяет зависимость под корнем управляемого npm-проекта,
    затем просит live-модель OpenAI вызвать plugin tool и вернуть скрытый
    slug.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in проверка «belt-and-suspenders» для поверхности message-channel rescue command.
    Она выполняет `/crestodian status`, ставит в очередь постоянное изменение модели,
    отвечает `/crestodian yes` и проверяет путь записи audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускает Crestodian в контейнере без конфигурации с фальшивым Claude CLI в `PATH`
    и проверяет, что fuzzy planner fallback преобразуется в аудированную типизированную
    запись config.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартует с пустого state dir OpenClaw, проверяет современную onboard
    entrypoint Crestodian, применяет записи setup/model/agent/Discord plugin + SecretRef,
    валидирует config и проверяет audit entries. Тот же путь настройки Ring 0
    также покрыт в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: при установленном `MOONSHOT_API_KEY` выполните
  `openclaw models list --provider moonshot --json`, затем запустите изолированный
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  против `moonshot/kimi-k2.6`. Проверьте, что JSON сообщает Moonshot/K2.6 и
  transcript ассистента сохраняет нормализованный `usage.cost`.

<Tip>
Когда нужен только один падающий случай, предпочитайте сужать live-тесты через allowlist env vars, описанные ниже.
</Tip>

## QA-специфичные раннеры

Эти команды находятся рядом с основными наборами тестов, когда вам нужен реализм QA-lab:

CI запускает QA Lab в выделенных workflows. Agentic parity вложен в
`QA-Lab - All Lanes` и release validation, а не является отдельным PR workflow.
Для широкой валидации следует использовать `Full Release Validation` с
`rerun_group=qa-parity` или группу QA release-checks. Стабильные/default release
checks держат exhaustive live/Docker soak за `run_release_soak=true`; профиль
`full` принудительно включает soak. `QA-Lab - All Lanes`
запускается nightly на `main` и из manual dispatch с mock parity lane, live
Matrix lane, Convex-managed live Telegram lane и Convex-managed live Discord
lane как параллельными jobs. Scheduled QA и release checks передают Matrix
`--profile fast` явно, тогда как Matrix CLI и ручной workflow input
по умолчанию остаются `all`; manual dispatch может шардировать `all` в jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` и `e2ee-cli`. `OpenClaw Release
Checks` запускает parity плюс fast Matrix и Telegram lanes перед release
approval, используя `mock-openai/gpt-5.5` для release transport checks, чтобы они оставались
детерминированными и избегали обычного provider-plugin startup. Эти live transport
gateways отключают memory search; поведение memory остается покрытым QA parity
suites.

Full release live media shards используют
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, где уже есть
`ffmpeg` и `ffprobe`. Docker live model/backend shards используют общий образ
`ghcr.io/openclaw/openclaw-live-test:<sha>`, собранный один раз на выбранный
commit, затем загружают его с `OPENCLAW_SKIP_DOCKER_BUILD=1` вместо пересборки
внутри каждого shard.

- `pnpm openclaw qa suite`
  - Запускает QA-сценарии, поддерживаемые репозиторием, напрямую на хосте.
  - Записывает верхнеуровневые артефакты `qa-evidence.json`, `qa-suite-summary.json` и
    `qa-suite-report.md` для выбранного набора сценариев, включая
    подборки смешанных flow, Vitest и Playwright-сценариев.
  - При запуске через `pnpm openclaw qa run --qa-profile <profile>` встраивает
    оценочную карту выбранного профиля таксономии в тот же `qa-evidence.json`.
    `smoke-ci` записывает сокращенные доказательства, что задает `evidenceMode: "slim"` и опускает
    `execution` для каждой записи. `release` покрывает курируемый срез готовности к релизу;
    `all` выбирает каждую активную категорию зрелости и предназначен для явных запусков workflow
    QA Profile Evidence, когда нужен полный артефакт оценочной карты.
  - По умолчанию запускает несколько выбранных сценариев параллельно с изолированными
    Gateway-воркерами. Для `qa-channel` по умолчанию используется параллелизм 4 (ограниченный
    числом выбранных сценариев). Используйте `--concurrency <count>`, чтобы настроить число
    воркеров, или `--concurrency 1` для старой последовательной ветки.
  - Завершается с ненулевым кодом, если любой сценарий завершается ошибкой. Используйте `--allow-failures`, когда
    нужны артефакты без ошибочного кода выхода.
  - Поддерживает режимы поставщика `live-frontier`, `mock-openai` и `aimock`.
    `aimock` запускает локальный сервер поставщика на базе AIMock для экспериментального
    покрытия фикстур и mock-протокола без замены сценарно-ориентированной
    ветки `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Ищет ID сценариев, заголовки, поверхности, ID покрытия, ссылки на docs, ссылки на код,
    plugins и требования к поставщикам, затем выводит совпадающие цели набора.
  - Используйте это перед запуском QA Lab, когда вы знаете затронутое поведение или путь к файлу,
    но не самый маленький сценарий. Это только рекомендация; все равно выбирайте mock,
    live, Multipass, Matrix или транспортное доказательство исходя из изменяемого поведения.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускает live-испытание OpenAI Kitchen Sink plugin через QA Lab. Оно
    устанавливает внешний пакет Kitchen Sink, проверяет инвентарь поверхности plugin SDK,
    проверяет `/healthz` и `/readyz`, записывает доказательства CPU/RSS
    Gateway, выполняет live-ход OpenAI и проверяет состязательную диагностику.
    Требуется live-аутентификация OpenAI, например `OPENAI_API_KEY`. В гидратированных
    сессиях Testbox автоматически подгружается live-auth профиль Testbox, когда
    присутствует helper `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускает бенч запуска Gateway плюс небольшой пакет mock-сценариев QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) и записывает сводку комбинированных
    наблюдений CPU в `.artifacts/gateway-cpu-scenarios/`.
  - По умолчанию помечает только устойчивые наблюдения высокой загрузки CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), поэтому короткие всплески при запуске записываются как метрики
    и не выглядят как регрессия с многоминутной полной загрузкой Gateway.
  - Использует собранные артефакты `dist`; сначала выполните сборку, если в checkout еще нет
    свежего runtime-вывода.
- `pnpm openclaw qa suite --runner multipass`
  - Запускает тот же QA-набор внутри одноразовой Linux VM Multipass.
  - Сохраняет то же поведение выбора сценариев, что и `qa suite` на хосте.
  - Повторно использует те же флаги выбора поставщика/модели, что и `qa suite`.
  - Live-запуски пробрасывают поддерживаемые входные данные QA-аутентификации, практичные для гостя:
    env-ключи поставщиков, путь к live-конфигурации поставщика QA и `CODEX_HOME`
    при наличии.
  - Выходные каталоги должны оставаться под корнем репозитория, чтобы гость мог записывать обратно через
    смонтированное рабочее пространство.
  - Записывает обычный QA-отчет и сводку плюс логи Multipass в
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускает QA-сайт на базе Docker для QA-работы в стиле оператора.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Собирает npm tarball из текущего checkout, глобально устанавливает его в
    Docker, запускает неинтерактивный онбординг с API-ключом OpenAI, по умолчанию настраивает Telegram,
    проверяет, что упакованный runtime plugin загружается без исправления зависимостей при запуске,
    запускает doctor и выполняет один локальный агентский ход против
    mock-эндпоинта OpenAI.
  - Используйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, чтобы запустить ту же ветку
    packaged-install с Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускает детерминированный Docker-smoke собранного приложения для встроенных расшифровок runtime-контекста.
    Он проверяет, что скрытый runtime-контекст OpenClaw сохраняется как
    неотображаемое пользовательское сообщение, а не просачивается в видимый пользовательский ход,
    затем добавляет затронутый сломанный session JSONL и проверяет, что
    `openclaw doctor --fix` переписывает его в активную ветку с резервной копией.
- `pnpm test:docker:npm-telegram-live`
  - Устанавливает кандидатный пакет OpenClaw в Docker, запускает онбординг установленного пакета,
    настраивает Telegram через установленный CLI, затем повторно использует
    live-ветку QA Telegram с этим установленным пакетом как тестируемым Gateway.
  - Обертка монтирует из checkout только исходники harness `qa-lab`; установленный
    пакет владеет `dist`, `openclaw/plugin-sdk` и bundled plugin
    runtime, поэтому ветка не смешивает plugins из текущего checkout с тестируемым
    пакетом.
  - По умолчанию используется `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` или
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, чтобы вместо установки из registry тестировать разрешенный
    локальный tarball.
  - По умолчанию выводит повторяющееся RTT-время в `qa-evidence.json` с
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Переопределите
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` или
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, чтобы настроить RTT-запуск.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` принимает разделенный запятыми список
    ID QA-проверок Telegram для выборки; если не задано, проверка по умолчанию с поддержкой RTT —
    `telegram-mentioned-message-reply`.
  - Использует те же Telegram env-учетные данные или источник учетных данных Convex, что и
    `pnpm openclaw qa telegram`. Для CI/релизной автоматизации задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` и секрет роли. Если
    `OPENCLAW_QA_CONVEX_SITE_URL` и секрет роли Convex присутствуют в CI,
    Docker-обертка автоматически выбирает Convex.
  - Обертка проверяет env учетных данных Telegram или Convex на хосте перед
    работой Docker build/install. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    только при намеренной отладке настройки до учетных данных.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` переопределяет общий
    `OPENCLAW_QA_CREDENTIAL_ROLE` только для этой ветки. Когда выбраны учетные данные Convex
    и роль не задана, обертка использует `ci` в CI и
    `maintainer` вне CI.
  - GitHub Actions предоставляет эту ветку как ручной maintainer workflow
    `NPM Telegram Beta E2E`. Она не запускается при merge. Workflow использует
    окружение `qa-live-shared` и аренды учетных данных Convex CI.
- GitHub Actions также предоставляет `Package Acceptance` для побочного продуктового доказательства
  по одному кандидатному пакету. Он принимает доверенный ref, опубликованную npm-спецификацию,
  HTTPS URL tarball плюс SHA-256 или tarball-артефакт из другого запуска, загружает
  нормализованный `openclaw-current.tgz` как `package-under-test`, затем запускает
  существующий Docker E2E scheduler с профилями веток smoke, package, product, full или custom.
  Задайте `telegram_mode=mock-openai` или `live-frontier`, чтобы запустить
  QA workflow Telegram против того же артефакта `package-under-test`.
  - Доказательство продукта для последней beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказательство по точному URL tarball требует digest и использует публичную политику безопасности URL:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private tarball-зеркала используют явную политику доверенного источника:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` читает `.github/package-trusted-sources.json` из доверенного ref workflow и не принимает учетные данные URL или workflow-input обход private-network. Если именованная политика объявляет bearer auth, настройте фиксированный секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Доказательство артефакта скачивает tarball-артефакт из другого запуска Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Упаковывает и устанавливает текущую сборку OpenClaw в Docker, запускает Gateway
    с настроенным OpenAI, затем включает bundled channel/plugins через изменения config.
  - Проверяет, что discovery настройки оставляет ненастроенные скачиваемые plugins отсутствующими,
    первое настроенное исправление doctor явно устанавливает каждый отсутствующий скачиваемый
    plugin, а второй рестарт не запускает скрытое исправление зависимостей.
  - Также устанавливает известный более старый npm baseline, включает Telegram перед запуском
    `openclaw update --tag <candidate>` и проверяет, что post-update doctor кандидата
    очищает legacy-мусор зависимостей plugin без
    postinstall-исправления со стороны harness.
- `pnpm test:parallels:npm-update`
  - Запускает native packaged-install update smoke по гостям Parallels. Каждая
    выбранная платформа сначала устанавливает запрошенный baseline-пакет, затем запускает
    установленную команду `openclaw update` в том же госте и проверяет
    установленную версию, статус обновления, готовность Gateway и один локальный
    агентский ход.
  - Используйте `--platform macos`, `--platform windows` или `--platform linux` при
    итерациях на одном госте. Используйте `--json` для пути к сводному артефакту и
    статуса каждой ветки.
  - Ветка OpenAI по умолчанию использует `openai/gpt-5.5` для доказательства live
    агентского хода. Передайте `--model <provider/model>` или задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, когда намеренно проверяете другую
    модель OpenAI.
  - Оборачивайте долгие локальные запуски в host timeout, чтобы зависания транспорта Parallels не
    поглощали оставшееся окно тестирования:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записывает вложенные логи веток в `/tmp/openclaw-parallels-npm-update.*`.
    Изучите `windows-update.log`, `macos-update.log` или `linux-update.log`,
    прежде чем считать, что внешняя обертка зависла.
  - Обновление Windows может провести 10–15 минут в post-update doctor и работе
    обновления пакета на холодном госте; это все еще штатно, когда вложенный npm
    debug log продвигается.
  - Не запускайте эту агрегирующую обертку параллельно с отдельными smoke-ветками Parallels
    macOS, Windows или Linux. Они совместно используют состояние VM и могут конфликтовать при
    восстановлении snapshot, раздаче пакета или состоянии гостевого Gateway.
  - Post-update proof запускает обычную поверхность bundled plugin, потому что
    capability-фасады, такие как речь, генерация изображений и понимание медиа,
    загружаются через bundled runtime APIs, даже когда сам агентский ход
    проверяет только простой текстовый ответ.

- `pnpm openclaw qa aimock`
  - Запускает только локальный сервер провайдера AIMock для прямого дымового
    тестирования протокола.
- `pnpm openclaw qa matrix`
  - Запускает live QA-линию Matrix на одноразовом homeserver Tuwunel на базе Docker. Только для checkout исходного кода - пакетные установки не поставляют `qa-lab`.
  - Полный CLI, каталог профилей/сценариев, переменные окружения и структура артефактов: [Matrix QA](/ru/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускает live QA-линию Telegram в реальной приватной группе, используя токены бота-драйвера и SUT-бота из env.
  - Требует `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` и `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Идентификатор группы должен быть числовым Telegram chat id.
  - Поддерживает `--credential-source convex` для общих пуловых учетных данных. По умолчанию используйте режим env или задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, чтобы включить пуловые аренды.
  - Значения по умолчанию покрывают canary, шлюз упоминаний, адресацию команд, `/status`, ответы бота боту с упоминанием и ответы на базовые нативные команды. Значения `mock-openai` по умолчанию также покрывают детерминированные регрессии цепочек ответов и стриминга финального сообщения Telegram. Используйте `--list-scenarios` для дополнительных проб, таких как `session_status`.
  - Завершается с ненулевым кодом, если какой-либо сценарий падает. Используйте `--allow-failures`, когда вам
    нужны артефакты без ошибочного кода выхода.
  - Требует двух разных ботов в одной приватной группе, при этом SUT-бот должен иметь Telegram username.
  - Для стабильного наблюдения бот-бот включите Bot-to-Bot Communication Mode в `@BotFather` для обоих ботов и убедитесь, что бот-драйвер может наблюдать трафик ботов в группе.
  - Записывает отчет Telegram QA, сводку и `qa-evidence.json` в `.artifacts/qa-e2e/...`. Сценарии с ответами включают RTT от запроса отправки драйвера до наблюдаемого ответа SUT.

`Mantis Telegram Live` — это PR-обертка доказательств вокруг этой линии. Она запускает
candidate ref с Telegram учетными данными, арендованными через Convex, рендерит отредактированный QA
отчет/пакет доказательств в desktop browser Crabbox, записывает MP4-доказательство,
генерирует GIF с обрезкой по движению, загружает пакет артефактов и публикует встроенное PR
доказательство через Mantis GitHub App, когда задан `pr_number`. Maintainers могут
запустить ее из Actions UI через `Mantis Scenario` (`scenario_id:
telegram-live`) или напрямую из комментария к pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` — это agentic-обертка нативного Telegram Desktop
до/после для визуального PR-доказательства. Запустите ее из Actions UI с
произвольными `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) или из комментария к PR:

```text
@openclaw-mantis telegram desktop proof
```

Агент Mantis читает PR, решает, какое видимое в Telegram поведение доказывает
изменение, запускает real-user Crabbox Telegram Desktop proof lane на baseline и
candidate refs, итерирует, пока нативные GIF не станут полезными, записывает парный
манифест `motionPreview` и публикует ту же 2-колоночную GIF-таблицу через
Mantis GitHub App, когда задан `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Арендует или повторно использует Linux desktop Crabbox, устанавливает нативный Telegram Desktop, настраивает OpenClaw с арендованным токеном Telegram SUT-бота, запускает gateway и записывает screenshot/MP4-доказательство с видимого VNC desktop.
  - По умолчанию использует `--credential-source convex`, поэтому workflows нужен только secret брокера Convex. Используйте `--credential-source env` с теми же переменными `OPENCLAW_QA_TELEGRAM_*`, что и `pnpm openclaw qa telegram`.
  - Telegram Desktop все равно требует user login/profile. Токен бота настраивает только OpenClaw. Используйте `--telegram-profile-archive-env <name>` для base64 `.tgz` архива профиля или используйте `--keep-lease` и один раз войдите вручную через VNC.
  - Записывает `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` и `telegram-desktop-builder.mp4` в выходной каталог.

Live transport lanes используют один стандартный контракт, чтобы новые транспорты не расходились; матрица покрытия для каждой линии находится в [обзоре QA → Покрытие live transport](/ru/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — это широкий синтетический набор и не является частью этой матрицы.

### Общие учетные данные Telegram через Convex (v1)

Когда `--credential-source convex` (или `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) включен для
live transport QA, QA lab получает эксклюзивную аренду из пула на базе Convex, отправляет Heartbeat для этой
аренды, пока линия выполняется, и освобождает аренду при завершении. Название раздела появилось до
поддержки Discord, Slack и WhatsApp; контракт аренды общий для всех видов.

Reference scaffold проекта Convex:

- `qa/convex-credential-broker/`

Обязательные env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (например `https://your-deployment.convex.site`)
- Один secret для выбранной роли:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Выбор роли учетных данных:
  - CLI: `--credential-role maintainer|ci`
  - Env по умолчанию: `OPENCLAW_QA_CREDENTIAL_ROLE` (по умолчанию `ci` в CI, иначе `maintainer`)

Необязательные env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (по умолчанию `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (по умолчанию `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (по умолчанию `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (по умолчанию `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (по умолчанию `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необязательный trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` разрешает loopback URL Convex `http://` только для локальной разработки.

`OPENCLAW_QA_CONVEX_SITE_URL` должен использовать `https://` при обычной работе.

Административные команды maintainer (добавить/удалить/список пула) требуют
именно `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Используйте `doctor` перед live-запусками, чтобы проверить URL сайта Convex, broker secrets,
endpoint prefix, HTTP timeout и доступность admin/list без вывода
секретных значений. Используйте `--json` для машинно-читаемого вывода в scripts и CI
utilities.

Контракт endpoint по умолчанию (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запрос: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успех: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Исчерпано/можно повторить: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Успех: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успех: `{ status: "ok" }` (или пустой `2xx`)
- `POST /release`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успех: `{ status: "ok" }` (или пустой `2xx`)
- `POST /admin/add` (только maintainer secret)
  - Запрос: `{ kind, actorId, payload, note?, status? }`
  - Успех: `{ status: "ok", credential }`
- `POST /admin/remove` (только maintainer secret)
  - Запрос: `{ credentialId, actorId }`
  - Успех: `{ status: "ok", changed, credential }`
  - Защита активной аренды: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (только maintainer secret)
  - Запрос: `{ kind?, status?, includePayload?, limit? }`
  - Успех: `{ status: "ok", credentials, count }`

Форма payload для вида Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` должен быть числовой строкой Telegram chat id.
- `admin/add` проверяет эту форму для `kind: "telegram"` и отклоняет malformed payloads.

Форма payload для вида Telegram real-user:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` и `telegramApiId` должны быть числовыми строками.
- `tdlibArchiveSha256` и `desktopTdataArchiveSha256` должны быть hex-строками SHA-256.
- `kind: "telegram-user"` зарезервирован для workflow доказательства Mantis Telegram Desktop. Generic QA Lab lanes не должны его получать.

Проверяемые брокером multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes также могут арендовать из пула, но проверка Slack payload сейчас
находится в Slack QA runner, а не в брокере. Используйте
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
для строк Slack.

### Добавление канала в QA

Архитектура и имена scenario-helper для новых адаптеров каналов находятся в [обзоре QA → Добавление канала](/ru/concepts/qa-e2e-automation#adding-a-channel). Минимальный уровень: реализовать transport runner на общем host seam `qa-lab`, объявить `qaRunners` в манифесте Plugin, смонтировать как `openclaw qa <runner>` и написать сценарии в `qa/scenarios/`.

## Наборы тестов (что где запускается)

Думайте о наборах как о «возрастающей реалистичности» (и возрастающей нестабильности/стоимости):

### Unit / integration (по умолчанию)

- Команда: `pnpm test`
- Конфигурация: нецелевые запуски используют набор shard `vitest.full-*.config.ts` и могут разворачивать multi-project shards в per-project configs для параллельного планирования
- Файлы: core/unit inventories в `src/**/*.test.ts`, `packages/**/*.test.ts` и `test/**/*.test.ts`; UI unit tests запускаются в выделенном shard `unit-ui`
- Область:
  - Pure unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерминированные регрессии для известных багов
- Ожидания:
  - Запускается в CI
  - Не требует реальных ключей
  - Должно быть быстрым и стабильным
  - Тесты resolver и public-surface loader должны доказывать широкое fallback-поведение `api.js` и
    `runtime-api.js` с generated tiny plugin fixtures, а не
    реальными API исходного кода bundled plugin. Реальные загрузки plugin API относятся к
    plugin-owned contract/integration suites.

Политика native dependency:

- Установки тестов по умолчанию пропускают optional native Discord opus builds. Discord voice использует bundled `libopus-wasm`, а `@discordjs/opus` остается отключенным в `allowBuilds`, чтобы локальные тесты и Testbox lanes не компилировали native addon.
- Сравнивайте производительность native opus в benchmark repo `libopus-wasm`, а не в default install/test loops OpenClaw. Не задавайте `@discordjs/opus` в `true` в default `allowBuilds`; это заставляет unrelated install/test loops компилировать native code.

<AccordionGroup>
  <Accordion title="Проекты, shards и scoped lanes">

    - Нецелевой `pnpm test` запускает двенадцать меньших конфигураций шардов (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) вместо одного огромного нативного процесса корневого проекта. Это снижает пиковый RSS на загруженных машинах и не дает работе auto-reply/расширений лишать ресурсов несвязанные наборы тестов.
    - `pnpm test --watch` по-прежнему использует нативный граф проектов корневого `vitest.config.ts`, потому что цикл наблюдения с несколькими шардами непрактичен.
    - `pnpm test`, `pnpm test:watch` и `pnpm test:perf:imports` сначала направляют явные цели файлов/каталогов через области с ограниченным охватом, поэтому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не платит полную цену запуска корневого проекта.
    - `pnpm test:changed` по умолчанию разворачивает измененные git-пути в дешевые области с ограниченным охватом: прямые изменения тестов, соседние файлы `*.test.ts`, явные сопоставления исходников и локальные зависимые узлы графа импортов. Изменения конфигурации/настройки/пакетов не запускают широкие тесты, если только вы явно не используете `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — обычный умный локальный контроль для узких изменений. Он классифицирует diff на core, тесты core, extensions, тесты extension, apps, docs, метаданные релиза, live Docker tooling и tooling, затем запускает соответствующие команды typecheck, lint и guard. Он не запускает тесты Vitest; для тестового подтверждения вызовите `pnpm test:changed` или явный `pnpm test <target>`. Повышения версий только в метаданных релиза запускают целевые проверки версий/конфигурации/корневых зависимостей, с guard, который отклоняет изменения пакета вне поля версии верхнего уровня.
    - Изменения live Docker ACP harness запускают сфокусированные проверки: синтаксис shell для live Docker auth scripts и dry-run планировщика live Docker. Изменения `package.json` включаются только когда diff ограничен `scripts["test:docker:live-*"]`; изменения зависимостей, exports, версии и других поверхностей пакета по-прежнему используют более широкие guard-проверки.
    - Легкие по импортам unit-тесты из agents, commands, plugins, auto-reply helpers, `plugin-sdk` и похожих областей чистых утилит направляются через область `unit-fast`, которая пропускает `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файлы остаются в существующих областях.
    - Выбранные исходные файлы helper из `plugin-sdk` и `commands` также сопоставляют changed-mode запуски с явными соседними тестами в этих легких областях, поэтому изменения helper избегают повторного запуска полного тяжелого набора для этого каталога.
    - `auto-reply` имеет отдельные корзины для core helpers верхнего уровня, integration-тестов `reply.*` верхнего уровня и поддерева `src/auto-reply/reply/**`. CI дополнительно делит поддерево reply на шарды agent-runner, dispatch и commands/state-routing, чтобы одна корзина с тяжелыми импортами не владела всем хвостом Node.
    - Обычный PR/main CI намеренно пропускает пакетный прогон extensions и release-only шард `agentic-plugins`. Full Release Validation запускает отдельный дочерний workflow `Plugin Prerelease` для этих plugin/extension-heavy наборов на релиз-кандидатах.

  </Accordion>

  <Accordion title="Покрытие встроенного исполнителя">

    - Когда вы изменяете входные данные обнаружения message-tool или runtime-контекст compaction,
      сохраняйте оба уровня покрытия.
    - Добавляйте сфокусированные регрессии helper для границ чистой маршрутизации и нормализации.
    - Поддерживайте работоспособность integration-наборов встроенного исполнителя:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` и
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Эти наборы проверяют, что scoped ids и поведение compaction по-прежнему проходят
      через реальные пути `run.ts` / `compact.ts`; тесты только helper
      не являются достаточной заменой для этих integration-путей.

  </Accordion>

  <Accordion title="Пул Vitest и значения изоляции по умолчанию">

    - Базовая конфигурация Vitest по умолчанию использует `threads`.
    - Общая конфигурация Vitest фиксирует `isolate: false` и использует
      неизолированный runner во всех корневых проектах, e2e и live-конфигурациях.
    - Корневая UI-область сохраняет свою настройку `jsdom` и optimizer, но тоже работает на
      общем неизолированном runner.
    - Каждый шард `pnpm test` наследует те же значения по умолчанию `threads` + `isolate: false`
      из общей конфигурации Vitest.
    - `scripts/run-vitest.mjs` по умолчанию добавляет `--no-maglev` для дочерних Node-процессов
      Vitest, чтобы уменьшить V8 compile churn во время больших локальных запусков.
      Установите `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, чтобы сравнить со стандартным поведением V8.
    - `scripts/run-vitest.mjs` завершает явные не-watch запуски Vitest после
      5 минут без вывода в stdout или stderr. Установите
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, чтобы отключить watchdog для
      намеренно тихого исследования.

  </Accordion>

  <Accordion title="Быстрая локальная итерация">

    - `pnpm changed:lanes` показывает, какие архитектурные области запускает diff.
    - Pre-commit hook выполняет только форматирование. Он заново добавляет отформатированные файлы в индекс и
      не запускает lint, typecheck или тесты.
    - Запускайте `pnpm check:changed` явно перед передачей работы или push, когда вам
      нужен умный локальный контроль.
    - `pnpm test:changed` по умолчанию направляет выполнение через дешевые области с ограниченным охватом. Используйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только когда агент
      решает, что изменение harness, конфигурации, пакета или контракта действительно требует более широкого
      покрытия Vitest.
    - `pnpm test:max` и `pnpm test:changed:max` сохраняют то же поведение маршрутизации,
      только с более высоким лимитом workers.
    - Локальное авто-масштабирование workers намеренно консервативно и отступает,
      когда средняя нагрузка хоста уже высокая, поэтому несколько параллельных
      запусков Vitest по умолчанию наносят меньше ущерба.
    - Базовая конфигурация Vitest помечает проекты/конфигурационные файлы как
      `forceRerunTriggers`, чтобы rerun в changed-mode оставался корректным при изменении
      test wiring.
    - Конфигурация оставляет `OPENCLAW_VITEST_FS_MODULE_CACHE` включенным на поддерживаемых
      хостах; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, если вам нужно
      одно явное расположение кэша для прямого профилирования.

  </Accordion>

  <Accordion title="Отладка производительности">

    - `pnpm test:perf:imports` включает отчет Vitest о длительности импортов плюс
      вывод import-breakdown.
    - `pnpm test:perf:imports:changed` ограничивает то же представление профилирования
      файлами, измененными с `origin/main`.
    - Данные таймингов шардов записываются в `.artifacts/vitest-shard-timings.json`.
      Запуски всей конфигурации используют путь конфигурации как ключ; include-pattern CI
      shards добавляют имя шарда, чтобы filtered shards можно было отслеживать
      отдельно.
    - Когда один горячий тест все еще тратит большую часть времени на стартовые импорты,
      держите тяжелые зависимости за узким локальным швом `*.runtime.ts` и
      мокайте этот шов напрямую вместо deep-import runtime helpers только
      чтобы передать их через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` сравнивает маршрутизированный
      `test:changed` с нативным путем корневого проекта для этого зафиксированного
      diff и печатает wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркит текущее
      dirty tree, направляя список измененных файлов через
      `scripts/test-projects.mjs` и корневую конфигурацию Vitest.
    - `pnpm test:perf:profile:main` записывает CPU-профиль main-thread для
      startup Vitest/Vite и накладных расходов transform.
    - `pnpm test:perf:profile:runner` записывает CPU+heap профили runner для
      unit-набора с отключенным file parallelism.

  </Accordion>
</AccordionGroup>

### Стабильность (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфигурация: `vitest.gateway.config.ts`, принудительно один worker
- Область:
  - Запускает реальный loopback Gateway с diagnostics, включенной по умолчанию
  - Прогоняет синтетический churn gateway message, memory и large-payload через diagnostic event path
  - Запрашивает `diagnostics.stability` через Gateway WS RPC
  - Покрывает helpers persistence диагностического stability bundle
  - Проверяет, что recorder остается ограниченным, синтетические RSS-образцы остаются ниже pressure budget, а глубины очередей per-session возвращаются к нулю
- Ожидания:
  - Безопасно для CI и не требует ключей
  - Узкая область для follow-up по stability-regression, не замена полному Gateway suite

### E2E (repo aggregate)

- Команда: `pnpm test:e2e`
- Область:
  - Запускает область gateway smoke E2E
  - Запускает mocked Control UI browser E2E область
- Ожидания:
  - Безопасно для CI и не требует ключей
  - Требует установленный Playwright Chromium

### E2E (gateway smoke)

- Команда: `pnpm test:e2e:gateway`
- Конфигурация: `vitest.e2e.config.ts`
- Файлы: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` и E2E-тесты bundled-plugin в `extensions/`
- Runtime defaults:
  - Использует Vitest `threads` с `isolate: false`, как и остальная часть репозитория.
  - Использует adaptive workers (CI: до 2, локально: по умолчанию 1).
  - По умолчанию работает в silent mode, чтобы уменьшить накладные расходы console I/O.
- Полезные переопределения:
  - `OPENCLAW_E2E_WORKERS=<n>` для принудительного задания числа workers (ограничено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного включения подробного console output.
- Область:
  - End-to-end поведение multi-instance gateway
  - Поверхности WebSocket/HTTP, pairing узлов и более тяжелая сеть
- Ожидания:
  - Запускается в CI (когда включено в pipeline)
  - Реальные ключи не требуются
  - Больше движущихся частей, чем в unit-тестах (может быть медленнее)

### E2E (Control UI mocked browser)

- Команда: `pnpm test:ui:e2e`
- Конфигурация: `test/vitest/vitest.ui-e2e.config.ts`
- Файлы: `ui/src/**/*.e2e.test.ts`
- Область:
  - Запускает Vite Control UI
  - Прогоняет реальную страницу Chromium через Playwright
  - Заменяет Gateway WebSocket детерминированными in-browser mocks
- Ожидания:
  - Запускается в CI как часть `pnpm test:e2e`
  - Реальные Gateway, agents или provider keys не требуются
  - Browser dependency должна присутствовать (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Повторно использует активный локальный OpenShell gateway
  - Создает sandbox из временного локального Dockerfile
  - Проверяет backend OpenShell в OpenClaw через реальные `sandbox ssh-config` + SSH exec
  - Проверяет remote-canonical поведение файловой системы через sandbox fs bridge
- Ожидания:
  - Только opt-in; не входит в запуск `pnpm test:e2e` по умолчанию
  - Требует локальный CLI `openshell` плюс рабочий Docker daemon
  - Требует активный локальный OpenShell gateway и его config source
  - Использует изолированные `HOME` / `XDG_CONFIG_HOME`, затем уничтожает test sandbox
- Полезные переопределения:
  - `OPENCLAW_E2E_OPENSHELL=1` для включения теста при ручном запуске более широкого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для указания нестандартного CLI binary или wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` для предоставления registered gateway config изолированному тесту
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` для переопределения Docker gateway IP, используемого host policy fixture

### Live (реальные providers + реальные models)

- Команда: `pnpm test:live`
- Конфигурация: `vitest.live.config.ts`
- Файлы: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` и live-тесты bundled-plugin в `extensions/`
- По умолчанию: **включено** через `pnpm test:live` (задает `OPENCLAW_LIVE_TEST=1`)
- Область:
  - «Этот провайдер/модель действительно работает _сегодня_ с реальными учетными данными?»
  - Выявлять изменения формата провайдера, особенности вызова инструментов, проблемы аутентификации и поведение rate limit
- Ожидания:
  - По замыслу не стабильно для CI (реальные сети, реальные политики провайдеров, квоты, сбои)
  - Стоит денег / использует rate limit
  - Предпочитайте запускать суженные подмножества вместо «всего»
- Live-запуски используют уже экспортированные API-ключи и подготовленные профили аутентификации.
- По умолчанию live-запуски все равно изолируют `HOME` и копируют конфигурацию/материалы аутентификации во временный тестовый home, чтобы unit-фикстуры не могли изменить ваш реальный `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` только когда вам намеренно нужно, чтобы live-тесты использовали ваш реальный домашний каталог.
- `pnpm test:live` по умолчанию работает в более тихом режиме: он оставляет вывод прогресса `[live] ...` и приглушает bootstrap-логи gateway/шум Bonjour. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, если хотите вернуть полные логи запуска.
- Ротация API-ключей (зависит от провайдера): задайте `*_API_KEYS` в формате с запятыми/точками с запятой или `*_API_KEY_1`, `*_API_KEY_2` (например, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) либо override для конкретного live-запуска через `OPENCLAW_LIVE_*_KEY`; тесты повторяют попытку при ответах rate limit.
- Вывод прогресса/heartbeat:
  - Live-наборы теперь выводят строки прогресса в stderr, чтобы долгие вызовы провайдеров были заметно активны даже когда захват консоли Vitest тихий.
  - `vitest.live.config.ts` отключает перехват консоли Vitest, поэтому строки прогресса provider/gateway сразу передаются потоком во время live-запусков.
  - Настраивайте direct-model heartbeat с помощью `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Настраивайте gateway/probe heartbeat с помощью `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Какой набор запускать?

Используйте эту таблицу решений:

- Правите логику/тесты: запускайте `pnpm test` (и `pnpm test:coverage`, если изменили многое)
- Затрагиваете сетевое взаимодействие gateway / протокол WS / pairing: добавьте `pnpm test:e2e`
- Отлаживаете «мой бот не работает» / ошибки конкретного провайдера / вызов инструментов: запускайте суженный `pnpm test:live`

## Live-тесты (затрагивающие сеть)

Для live-матрицы моделей, smoke-тестов CLI backend, smoke-тестов ACP, harness Codex app-server
и всех live-тестов media-provider (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), а также обработки учетных данных для live-запусков, см.
[Тестирование live-наборов](/ru/help/testing-live). Специальный чеклист для обновлений и
валидации plugins см. в
[Тестирование обновлений и plugins](/ru/help/testing-updates-plugins).

## Docker runners (необязательные проверки «работает в Linux»)

Эти Docker runners делятся на две группы:

- Live-model runners: `test:docker:live-models` и `test:docker:live-gateway` запускают только соответствующий live-файл profile-key внутри Docker-образа репозитория (`src/agents/models.profiles.live.test.ts` и `src/gateway/gateway-models.profiles.live.test.ts`), монтируя ваш локальный каталог конфигурации, workspace и необязательный файл env профиля. Соответствующие локальные entrypoints: `test:live:models-profiles` и `test:live:gateway-profiles`.
- Docker live runners сохраняют собственные практические ограничения там, где нужно:
  `test:docker:live-models` по умолчанию использует curated поддерживаемый high-signal набор, а
  `test:docker:live-gateway` по умолчанию задает `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` и
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Задайте `OPENCLAW_LIVE_MAX_MODELS`
  или env vars gateway, когда вам явно нужен меньший лимит или более широкий scan.
- `test:docker:all` один раз собирает live Docker-образ через `test:docker:live-build`, один раз упаковывает OpenClaw как npm tarball через `scripts/package-openclaw-for-docker.mjs`, затем собирает/повторно использует два образа `scripts/e2e/Dockerfile`. Bare-образ — это только runner Node/Git для lanes install/update/plugin-dependency; эти lanes монтируют заранее собранный tarball. Functional-образ устанавливает тот же tarball в `/app` для lanes функциональности собранного приложения. Определения Docker lanes находятся в `scripts/lib/docker-e2e-scenarios.mjs`; логика planner — в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` выполняет выбранный plan. Агрегатор использует weighted локальный scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` управляет слотами процессов, а resource caps не дают тяжелым live, npm-install и multi-service lanes запускаться всем сразу. Если один lane тяжелее активных caps, scheduler все равно может запустить его, когда pool пуст, и затем держит его запущенным в одиночку, пока снова не появится capacity. Значения по умолчанию: 10 слотов, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` и `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; настраивайте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` или `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` только когда у Docker host есть больший запас ресурсов. Runner по умолчанию выполняет Docker preflight, удаляет устаревшие контейнеры OpenClaw E2E, печатает status каждые 30 секунд, сохраняет timings успешных lanes в `.artifacts/docker-tests/lane-timings.json` и использует эти timings, чтобы в последующих запусках сначала стартовали более долгие lanes. Используйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, чтобы вывести weighted lane manifest без сборки или запуска Docker, либо `node scripts/test-docker-all.mjs --plan-json`, чтобы вывести CI plan для выбранных lanes, требований к package/image и учетных данных.
- `Package Acceptance` — это нативный для GitHub package gate для проверки «работает ли этот устанавливаемый tarball как продукт?». Он определяет один candidate package из `source=npm`, `source=ref`, `source=url` или `source=artifact`, загружает его как `package-under-test`, затем запускает reusable Docker E2E lanes против именно этого tarball вместо повторной упаковки выбранного ref. Профили упорядочены по широте: `smoke`, `package`, `product` и `full`. Контракт package/update/plugin, матрицу published-upgrade survivor, release defaults и triage сбоев см. в [Тестирование обновлений и plugins](/ru/help/testing-updates-plugins).
- Проверки build и release запускают `scripts/check-cli-bootstrap-imports.mjs` после tsdown. Guard проходит статический собранный graph от `dist/entry.js` и `dist/cli/run-main.js` и падает, если pre-dispatch startup импортирует package dependencies, такие как Commander, prompt UI, undici или logging, до command dispatch; он также удерживает bundled gateway run chunk в рамках budget и отклоняет static imports известных холодных gateway paths. Packaged CLI smoke также покрывает root help, onboard help, doctor help, status, config schema и команду model-list.
- Legacy-совместимость Package Acceptance ограничена `2026.4.25` (включая `2026.4.25-beta.*`). До этой cutoff-даты harness допускает только пробелы metadata shipped-package: пропущенные приватные QA inventory entries, отсутствующий `gateway install --wrapper`, отсутствующие patch files в tarball-derived git fixture, отсутствующий persisted `update.channel`, legacy locations plugin install-record, отсутствующее сохранение marketplace install-record и миграцию config metadata во время `plugins update`. Для packages после `2026.4.25` эти paths являются строгими failures.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` и `test:docker:config-reload` запускают один или несколько реальных контейнеров и проверяют интеграционные paths более высокого уровня.
- Docker/Bash E2E lanes, которые устанавливают упакованный tarball OpenClaw через `scripts/lib/openclaw-e2e-instance.sh`, ограничивают `npm install` значением `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (по умолчанию `600s`; задайте `0`, чтобы отключить wrapper для отладки).

Live-model Docker runners также bind-mount только нужные homes аутентификации CLI (или все поддерживаемые, когда запуск не сужен), затем копируют их в home контейнера перед запуском, чтобы external-CLI OAuth мог обновлять tokens, не изменяя хранилище аутентификации host:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; по умолчанию покрывает Claude, Codex и Gemini, со строгим покрытием Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` и `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` и `pnpm qa:observability:smoke` — приватные QA lanes для source-checkout. Они намеренно не входят в package Docker release lanes, потому что npm tarball не включает QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Мастер onboarding (TTY, полный scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально устанавливает упакованный tarball OpenClaw в Docker, настраивает OpenAI через env-ref onboarding плюс Telegram по умолчанию, запускает doctor и выполняет один mocked turn агента OpenAI. Повторно используйте заранее собранный tarball с `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустите host rebuild с `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` или переключите канал с `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` или `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke-тест пользовательского пути релиза: `pnpm test:docker:release-user-journey` глобально устанавливает упакованный tarball OpenClaw в чистом домашнем каталоге Docker, запускает онбординг, настраивает смоделированного провайдера OpenAI, выполняет ход агента, устанавливает/удаляет внешние plugins, настраивает ClickClack на локальную фикстуру, проверяет исходящие/входящие сообщения, перезапускает Gateway и запускает doctor.
- Smoke-тест типизированного онбординга релиза: `pnpm test:docker:release-typed-onboarding` устанавливает упакованный tarball, проводит `openclaw onboard` через настоящий TTY, настраивает OpenAI как провайдера со ссылкой на переменную окружения, проверяет, что сырой ключ не сохраняется, и запускает смоделированный ход агента.
- Smoke-тест медиа/памяти релиза: `pnpm test:docker:release-media-memory` устанавливает упакованный tarball, проверяет понимание изображения из вложения PNG, вывод генерации изображений, совместимый с OpenAI, воспроизведение из поиска памяти и сохранение воспроизведения после перезапуска Gateway.
- Smoke-тест пользовательского пути обновления релиза: `pnpm test:docker:release-upgrade-user-journey` по умолчанию устанавливает новейшую опубликованную базовую версию, более старую, чем tarball кандидата, настраивает состояние провайдера/plugin/ClickClack в опубликованном пакете, обновляет его до tarball кандидата, затем повторно запускает основной путь агента/plugin/канала. Если более старая опубликованная базовая версия отсутствует, повторно используется версия кандидата. Переопределите базовую версию с помощью `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke-тест marketplace plugins релиза: `pnpm test:docker:release-plugin-marketplace` устанавливает из локальной фикстуры marketplace, обновляет установленный plugin, удаляет его и проверяет, что CLI plugin исчезает, а метаданные установки очищаются.
- Smoke-тест установки Skills: `pnpm test:docker:skill-install` глобально устанавливает упакованный tarball OpenClaw в Docker, отключает в конфиге установки загруженных архивов, получает текущий live slug Skills ClawHub из поиска, устанавливает его через `openclaw skills install` и проверяет установленный Skills плюс метаданные происхождения/lock `.clawhub`.
- Smoke-тест переключения канала обновлений: `pnpm test:docker:update-channel-switch` глобально устанавливает упакованный tarball OpenClaw в Docker, переключается с пакета `stable` на git `dev`, проверяет сохраненный канал и работу plugin после обновления, затем переключается обратно на пакет `stable` и проверяет статус обновления.
- Smoke-тест сохранения при обновлении: `pnpm test:docker:upgrade-survivor` устанавливает упакованный tarball OpenClaw поверх грязной фикстуры старого пользователя с агентами, конфигом канала, allowlist plugins, устаревшим состоянием зависимостей plugin и существующими файлами workspace/session. Он запускает обновление пакета и неинтерактивный doctor без live-провайдера или ключей канала, затем запускает loopback Gateway и проверяет сохранение конфига/состояния, а также бюджеты запуска/статуса.
- Smoke-тест сохранения при обновлении с опубликованной версии: `pnpm test:docker:published-upgrade-survivor` по умолчанию устанавливает `openclaw@latest`, создает реалистичные файлы существующего пользователя, настраивает эту базовую версию с помощью встроенного рецепта команд, валидирует получившийся конфиг, обновляет опубликованную установку до tarball кандидата, запускает неинтерактивный doctor, записывает `.artifacts/upgrade-survivor/summary.json`, затем запускает loopback Gateway и проверяет настроенные intents, сохранение состояния, запуск, `/healthz`, `/readyz` и бюджеты статуса RPC. Переопределите одну базовую версию с помощью `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросите агрегирующий планировщик развернуть точные локальные базовые версии через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, например `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, и развернуть фикстуры в форме issues через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, например `reported-issues`; набор reported-issues включает `configured-plugin-installs` для автоматического ремонта установок внешних plugins OpenClaw. Приемка пакета предоставляет их как `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` и `published_upgrade_survivor_scenarios`, разрешает мета-токены базовых версий, такие как `last-stable-4` или `all-since-2026.4.23`, а Полная валидация релиза расширяет пакетный gate release-soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Smoke-тест runtime context сессии: `pnpm test:docker:session-runtime-context` проверяет сохранение скрытого runtime context в транскрипте и ремонт через doctor затронутых дублированных веток prompt-rewrite.
- Smoke-тест глобальной установки Bun: `bash scripts/e2e/bun-global-install-smoke.sh` упаковывает текущее дерево, устанавливает его через `bun install -g` в изолированном домашнем каталоге и проверяет, что `openclaw infer image providers --json` возвращает встроенных провайдеров изображений, а не зависает. Повторно используйте заранее собранный tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустите сборку на хосте через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` или скопируйте `dist/` из собранного Docker-образа через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-тест установщика в Docker: `bash scripts/test-install-sh-docker.sh` использует один npm-кеш совместно для root-, update- и direct-npm-контейнеров. Smoke-тест обновления по умолчанию использует npm `latest` как стабильную базовую версию перед обновлением до tarball кандидата. Переопределите локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` или через вход `update_baseline_version` workflow Install Smoke на GitHub. Проверки установщика без root используют изолированный npm-кеш, чтобы записи кеша, принадлежащие root, не маскировали поведение локальной установки пользователя. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, чтобы повторно использовать кеш root/update/direct-npm между локальными повторными запусками.
- CI Install Smoke пропускает дублирующее глобальное обновление direct-npm с `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без этой переменной окружения, когда нужно покрытие прямого `npm install -g`.
- Smoke-тест CLI удаления агентами общего workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) по умолчанию собирает образ из корневого Dockerfile, создает двух агентов с одним workspace в изолированном домашнем каталоге контейнера, запускает `agents delete --json` и проверяет корректный JSON плюс поведение с сохраненным workspace. Повторно используйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Сетевое взаимодействие Gateway (два контейнера, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) собирает исходный E2E-образ плюс слой Chromium, запускает Chromium с сырым CDP, выполняет `browser doctor --deep` и проверяет, что snapshots ролей CDP покрывают URL ссылок, кликабельные элементы, повышенные курсором, refs iframe и метаданные frame.
- Регрессия минимального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускает смоделированный сервер OpenAI через Gateway, проверяет, что `web_search` повышает `reasoning.effort` с `minimal` до `low`, затем принудительно вызывает reject схемы провайдера и проверяет, что сырая detail появляется в логах Gateway.
- Мост MCP-каналов (предзаполненный Gateway + stdio bridge + smoke-тест сырого notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP tools комплекта OpenClaw (настоящий stdio MCP server + smoke-тест embedded-профиля OpenClaw allow/deny): `pnpm test:docker:agent-bundle-mcp-tools` (скрипт: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Очистка Cron/subagent MCP (настоящий Gateway + завершение дочернего stdio MCP после изолированных запусков cron и одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-тест установки/обновления для локального пути, `file:`, npm registry с hoisted-зависимостями, некорректных метаданных npm-пакета, движущихся git refs, kitchen-sink ClawHub, обновлений marketplace и включения/инспекции Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, чтобы пропустить блок ClawHub, или переопределите стандартную пару package/runtime kitchen-sink с помощью `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` и `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест использует герметичный локальный сервер фикстуры ClawHub.
- Smoke-тест неизмененного обновления plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест матрицы lifecycle plugin: `pnpm test:docker:plugin-lifecycle-matrix` устанавливает упакованный tarball OpenClaw в пустой контейнер, устанавливает npm plugin, переключает enable/disable, обновляет и откатывает его через локальный npm registry, удаляет установленный код, затем проверяет, что uninstall все равно удаляет устаревшее состояние, одновременно логируя метрики RSS/CPU для каждой фазы lifecycle.
- Smoke-тест метаданных перезагрузки конфига: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` покрывает smoke-тест установки/обновления для локального пути, `file:`, npm registry с hoisted-зависимостями, движущихся git refs, фикстур ClawHub, обновлений marketplace и включения/инспекции Claude-bundle. `pnpm test:docker:plugin-update` покрывает поведение неизмененного обновления для установленных plugins. `pnpm test:docker:plugin-lifecycle-matrix` покрывает отслеживаемые по ресурсам установку, включение, отключение, обновление, откат и удаление при отсутствующем коде для npm plugin.

Чтобы вручную предварительно собрать и повторно использовать общий функциональный образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Переопределения образов для конкретных наборов, такие как `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, все равно имеют приоритет, если заданы. Когда `OPENCLAW_SKIP_DOCKER_BUILD=1` указывает на удаленный общий образ, скрипты скачивают его, если он еще не доступен локально. Docker-тесты QR и установщика сохраняют собственные Dockerfile, потому что они валидируют поведение пакета/установки, а не общий runtime собранного приложения.

Запуски Docker с живыми моделями также монтируют текущий checkout только для чтения и
размещают его во временном рабочем каталоге внутри контейнера. Это сохраняет runtime-образ
компактным, но при этом запускает Vitest именно против вашего локального исходного кода/конфигурации.
На этапе размещения пропускаются крупные локальные кэши и выходные данные сборки приложений, такие как
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а также локальные для приложений каталоги вывода `.build` или
Gradle, чтобы живые Docker-запуски не тратили минуты на копирование
машинно-специфичных артефактов.
Они также задают `OPENCLAW_SKIP_CHANNELS=1`, чтобы живые проверки gateway не запускали
реальные worker’ы каналов Telegram/Discord/etc. внутри контейнера.
`test:docker:live-models` по-прежнему запускает `pnpm test:live`, поэтому также передавайте
`OPENCLAW_LIVE_GATEWAY_*`, когда нужно сузить или исключить живое покрытие gateway
из этой Docker-линии.
`test:docker:openwebui` — это более высокоуровневый smoke-тест совместимости: он запускает
контейнер OpenClaw gateway с включенными HTTP-endpoint’ами, совместимыми с OpenAI,
запускает закрепленный контейнер Open WebUI против этого gateway, выполняет вход через
Open WebUI, проверяет, что `/api/models` предоставляет `openclaw/default`, затем отправляет
реальный chat-запрос через прокси Open WebUI `/api/chat/completions`.
Задайте `OPENWEBUI_SMOKE_MODE=models` для CI-проверок release-пути, которые должны останавливаться
после входа в Open WebUI и обнаружения модели, не ожидая завершения живой модели.
Первый запуск может быть заметно медленнее, потому что Docker может потребоваться загрузить
образ Open WebUI, а Open WebUI может потребоваться завершить собственную настройку холодного старта.
Эта линия ожидает пригодный ключ живой модели. Предоставьте его через окружение процесса,
подготовленные auth-профили или явный `OPENCLAW_PROFILE_FILE`.
Успешные запуски печатают небольшой JSON payload вида `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` намеренно детерминирован и не требует
реальной учетной записи Telegram, Discord или iMessage. Он запускает seeded Gateway
контейнер, запускает второй контейнер, который порождает `openclaw mcp serve`, затем
проверяет обнаружение маршрутизируемых разговоров, чтение transcripts, metadata вложений,
поведение очереди live events, маршрутизацию outbound send и уведомления каналов +
разрешений в стиле Claude через реальный stdio MCP bridge. Проверка уведомлений
инспектирует сырые stdio MCP frames напрямую, поэтому smoke-тест валидирует то, что
bridge фактически испускает, а не только то, что случайно показывает конкретный client SDK.
`test:docker:agent-bundle-mcp-tools` детерминирован и не требует ключ живой
модели. Он собирает Docker-образ репозитория, запускает реальный stdio MCP probe server
внутри контейнера, материализует этот server через встроенный OpenClaw bundle
MCP runtime, выполняет tool, затем проверяет, что `coding` и `messaging` сохраняют
tools `bundle-mcp`, а `minimal` и `tools.deny: ["bundle-mcp"]` их фильтруют.
`test:docker:cron-mcp-cleanup` детерминирован и не требует ключ живой модели.
Он запускает seeded Gateway с реальным stdio MCP probe server, выполняет
изолированный cron turn и одноразовый дочерний turn `sessions_spawn`, затем проверяет,
что MCP child process завершается после каждого запуска.

Ручной ACP smoke-тест thread’а на естественном языке (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Сохраните этот script для regression/debug workflow. Он может снова понадобиться для проверки маршрутизации ACP thread, поэтому не удаляйте его.

Полезные env vars:

- `OPENCLAW_CONFIG_DIR=...` (по умолчанию: `~/.openclaw`) монтируется в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (по умолчанию: `~/.openclaw/workspace`) монтируется в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` монтируется и source’ится перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для проверки только env vars, sourced из `OPENCLAW_PROFILE_FILE`, с временными config/workspace dirs и без внешних CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (по умолчанию: `~/.cache/openclaw/docker-cli-tools`) монтируется в `/home/node/.npm-global` для кэшированных CLI installs внутри Docker
- Внешние CLI auth dirs/files под `$HOME` монтируются только для чтения под `/host-auth...`, затем копируются в `/home/node/...` перед началом tests
  - Каталоги по умолчанию: `.minimax`
  - Файлы по умолчанию: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Суженные provider-запуски монтируют только нужные dirs/files, inferred из `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Переопределите вручную с `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` или списком через запятую, например `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для сужения запуска
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фильтрации providers внутри контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного использования существующего образа `openclaw:local-live` при rerun’ах, которым не нужна пересборка
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` чтобы гарантировать, что credentials приходят из profile store (не из env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для выбора модели, предоставляемой gateway для Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` для переопределения nonce-check prompt, используемого Open WebUI smoke
- `OPENWEBUI_IMAGE=...` для переопределения закрепленного tag образа Open WebUI

## Проверка документации

Запускайте проверки документации после правок docs: `pnpm check:docs`.
Запускайте полную проверку anchors Mintlify, когда нужны также проверки in-page headings: `pnpm docs:check-links:anchors`.

## Offline regression (безопасно для CI)

Это regressions «реального pipeline» без реальных providers:

- Gateway tool calling (mock OpenAI, реальный gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записывает config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

У нас уже есть несколько безопасных для CI tests, которые ведут себя как "agent reliability evals":

- Mock tool-calling через реальный gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, которые проверяют session wiring и config effects (`src/gateway/gateway.test.ts`).

Чего еще не хватает для skills (см. [Skills](/ru/tools/skills)):

- **Принятие решений:** когда skills перечислены в prompt, выбирает ли agent правильный skill (или избегает нерелевантных)?
- **Соблюдение требований:** читает ли agent `SKILL.md` перед использованием и следует ли обязательным steps/args?
- **Workflow contracts:** многоходовые scenarios, которые проверяют порядок tools, перенос session history и sandbox boundaries.

Будущие evals должны в первую очередь оставаться детерминированными:

- Scenario runner с mock providers для проверки tool calls + order, чтения skill file и session wiring.
- Небольшой набор skill-focused scenarios (использовать vs избегать, gating, prompt injection).
- Опциональные live evals (opt-in, env-gated) только после появления безопасного для CI набора.

## Contract tests (plugin и shape канала)

Contract tests проверяют, что каждый зарегистрированный plugin и канал соответствует своему
interface contract. Они проходят по всем обнаруженным plugins и запускают набор
assertions формы и поведения. Стандартная unit-линия `pnpm test` намеренно
пропускает эти общие seam- и smoke-файлы; запускайте contract-команды явно,
когда меняете общие channel или provider surfaces.

### Команды

- Все contracts: `pnpm test:contracts`
- Только channel contracts: `pnpm test:contracts:channels`
- Только provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Расположены в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базовая форма plugin (id, name, capabilities)
- **setup** - Контракт setup wizard
- **session-binding** - Поведение session binding
- **outbound-payload** - Структура message payload
- **inbound** - Обработка inbound message
- **actions** - Channel action handlers
- **threading** - Обработка thread ID
- **directory** - Directory/roster API
- **group-policy** - Принудительное применение group policy

### Provider status contracts

Расположены в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Форма plugin registry

### Provider contracts

Расположены в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Обнаружение plugin
- **loader** - Загрузка plugin
- **runtime** - Provider runtime
- **shape** - Форма/interface plugin
- **wizard** - Setup wizard

### Когда запускать

- После изменения plugin-sdk exports или subpaths
- После добавления или изменения channel или provider plugin
- После refactoring plugin registration или discovery

Contract tests запускаются в CI и не требуют реальных API keys.

## Добавление regressions (руководство)

Когда вы исправляете provider/model issue, обнаруженную в live:

- По возможности добавьте безопасную для CI regression (mock/stub provider или capture точного request-shape transformation)
- Если это по сути live-only (rate limits, auth policies), держите live test узким и opt-in через env vars
- Предпочитайте самый маленький слой, который ловит bug:
  - bug преобразования/replay provider request → direct models test
  - bug gateway session/history/tool pipeline → gateway live smoke или безопасный для CI gateway mock test
- Guardrail обхода SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` выводит одну sampled target для каждого класса SecretRef из registry metadata (`listSecretTargetRegistryEntries()`), затем утверждает, что exec ids с traversal segments отклоняются.
  - Если вы добавляете новое семейство SecretRef target `includeInPlan` в `src/secrets/target-registry-data.ts`, обновите `classifyTargetClass` в этом test. Test намеренно падает на неклассифицированных target ids, чтобы новые classes нельзя было тихо пропустить.

## Связанные разделы

- [Testing live](/ru/help/testing-live)
- [Testing updates and plugins](/ru/help/testing-updates-plugins)
- [CI](/ru/ci)
