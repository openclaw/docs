---
read_when:
    - Запуск тестов локально или в CI
    - Добавление регрессионных тестов для ошибок моделей/провайдеров
    - Отладка поведения Gateway и агента
summary: 'Набор для тестирования: модульные/e2e/live-наборы, Docker-раннеры и что покрывает каждый тест'
title: Тестирование
x-i18n:
    generated_at: "2026-07-04T03:59:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

В OpenClaw есть три набора тестов Vitest (модульные/интеграционные, e2e, live) и небольшой набор
Docker-раннеров. Этот документ — руководство «как мы тестируем»:

- Что покрывает каждый набор (и что он намеренно _не_ покрывает).
- Какие команды запускать для распространенных рабочих процессов (локально, перед push, при отладке).
- Как live-тесты находят учетные данные и выбирают модели/провайдеров.
- Как добавлять регрессии для реальных проблем моделей/провайдеров.

<Note>
**Стек QA (qa-lab, qa-channel, live transport lanes)** документирован отдельно:

- [Обзор QA](/ru/concepts/qa-e2e-automation) - архитектура, поверхность команд, написание сценариев.
- [Matrix QA](/ru/concepts/qa-matrix) - справочник по `pnpm openclaw qa matrix`.
- [Карта зрелости](/ru/maturity/scorecard) - как доказательства QA для релиза поддерживают решения о стабильности и LTS.
- [QA channel](/ru/channels/qa-channel) - синтетический транспортный плагин, используемый сценариями, поддерживаемыми репозиторием.

На этой странице описан запуск обычных наборов тестов и Docker/Parallels-раннеров. Раздел ниже, посвященный QA-раннерам ([QA-specific runners](#qa-specific-runners)), перечисляет конкретные вызовы `qa` и ссылается на приведенные выше справочные материалы.
</Note>

## Быстрый старт

В большинстве дней:

- Полный gate (ожидается перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Более быстрый локальный запуск полного набора на машине с достаточными ресурсами: `pnpm test:max`
- Прямой цикл наблюдения Vitest: `pnpm test:watch`
- Прямое нацеливание на файл теперь также маршрутизирует пути extensions/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- При итерации над одним сбоем сначала предпочитайте целевые запуски.
- QA-сайт на базе Docker: `pnpm qa:lab:up`
- QA-lane на базе Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Когда вы меняете тесты или хотите дополнительной уверенности:

- Gate покрытия: `pnpm test:coverage`
- Набор E2E: `pnpm test:e2e`

## Временные каталоги тестов

Предпочитайте общие helpers в `test/helpers/temp-dir.ts` для временных
каталогов, принадлежащих тестам. Они явно обозначают владение и удерживают очистку в том же
жизненном цикле теста:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` намеренно не предоставляет ручного метода очистки; Vitest
владеет очисткой после каждого теста. Существующие низкоуровневые helpers остаются для тестов, которые
еще не перенесены, но новые и мигрированные тесты должны использовать автоматически очищающийся
tracker. Избегайте нового использования ручных `makeTempDir`, `cleanupTempDirs` или
`createTempDirTracker`, а также новых прямых вызовов `fs.mkdtemp*` в тестах,
если случай явно не проверяет исходное поведение временных каталогов. Добавляйте проверяемый
разрешающий комментарий с конкретной причиной, когда тесту намеренно нужен прямой временный
каталог:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Для видимости миграции `node scripts/report-test-temp-creations.mjs` сообщает
о новом прямом создании временных каталогов и новом ручном использовании общих helpers в добавленных строках diff
без блокировки существующих стилей очистки. Его файловая область намеренно
следует той же классификации путей тестов, что используется `scripts/changed-lanes.mjs`,
вместо поддержки отдельной эвристики имен файлов test-helper, пропуская при этом
саму реализацию общего helper. `check:changed` запускает этот отчет для
измененных тестовых путей как CI-сигнал только с предупреждениями; находки являются предупреждающими
аннотациями GitHub, а не сбоями.

При отладке реальных провайдеров/моделей (требуются реальные учетные данные):

- Live-набор (модели + gateway tool/image probes): `pnpm test:live`
- Запуск одного live-файла в тихом режиме: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Отчеты о производительности runtime: запустите `OpenClaw Performance` с
  `live_openai_candidate=true` для реального agent turn `openai/gpt-5.5` или
  `deep_profile=true` для артефактов CPU/heap/trace Kova. Ежедневные запланированные запуски
  публикуют артефакты mock-provider, deep-profile и GPT 5.5 lane в
  `openclaw/clawgrit-reports`, когда настроен `CLAWGRIT_REPORTS_TOKEN`.
  Отчет mock-provider также включает числа source-level gateway boot, memory,
  plugin-pressure, повторяющегося fake-model hello-loop и запуска CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Каждая выбранная модель теперь выполняет текстовый turn плюс небольшой probe в стиле чтения файла.
    Модели, метаданные которых объявляют вход `image`, также выполняют крошечный image turn.
    Отключайте дополнительные probes с помощью `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` или
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` при изоляции сбоев провайдера.
  - Покрытие CI: ежедневные `OpenClaw Scheduled Live And E2E Checks` и ручные
    `OpenClaw Release Checks` оба вызывают переиспользуемый workflow live/E2E с
    `include_live_suites: true`, который включает отдельные Docker live model
    matrix jobs, шардированные по провайдерам.
  - Для сфокусированных повторных запусков CI запустите `OpenClaw Live And E2E Checks (Reusable)`
    с `include_live_suites: true` и `live_models_only: true`.
  - Добавляйте новые высокосигнальные секреты провайдеров в `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` и его
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускает Docker live lane против пути app-server Codex, привязывает синтетический
    Slack DM с `/codex bind`, проверяет `/codex fast` и
    `/codex permissions`, затем проверяет обычный ответ и маршрут вложения изображения
    через native plugin binding вместо ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускает gateway agent turns через принадлежащий Plugin app-server harness Codex,
    проверяет `/codex status` и `/codex models` и по умолчанию выполняет probes image,
    cron MCP, sub-agent и Guardian. Отключайте sub-agent probe с помощью
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` при изоляции других сбоев Codex
    app-server. Для сфокусированной проверки sub-agent отключите другие probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Это завершает выполнение после sub-agent probe, если не задано
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Устанавливает упакованный tarball OpenClaw в Docker, запускает onboarding с API-ключом OpenAI
    и проверяет, что Plugin Codex плюс зависимость `@openai/codex`
    были загружены по требованию в корень управляемого npm-проекта.
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - Упаковывает fixture-плагин с реальной зависимостью `slugify`, устанавливает его через
    `npm-pack:`, проверяет зависимость под корнем управляемого npm-проекта,
    затем просит live-модель OpenAI вызвать plugin tool и вернуть скрытый
    slug.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in проверка с запасом для поверхности команды rescue в message-channel.
    Она проверяет `/crestodian status`, ставит в очередь постоянное изменение модели,
    отвечает `/crestodian yes` и проверяет путь записи audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускает Crestodian в контейнере без config с фейковым Claude CLI в `PATH`
    и проверяет, что fuzzy planner fallback преобразуется в аудированную типизированную
    запись config.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Начинает с пустого каталога состояния OpenClaw, проверяет современный onboard
    entrypoint Crestodian, применяет записи setup/model/agent/Discord plugin + SecretRef,
    валидирует config и проверяет audit entries. Тот же путь настройки Ring 0
    также покрыт в QA Lab с помощью
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: с заданным `MOONSHOT_API_KEY` выполните
  `openclaw models list --provider moonshot --json`, затем запустите изолированный
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  против `moonshot/kimi-k2.6`. Проверьте, что JSON сообщает Moonshot/K2.6 и
  transcript assistant сохраняет нормализованный `usage.cost`.

<Tip>
Когда нужен только один падающий случай, предпочитайте сужать live-тесты через env vars allowlist, описанные ниже.
</Tip>

## QA-специфичные раннеры

Эти команды находятся рядом с основными наборами тестов, когда нужен реализм QA-lab:

CI запускает QA Lab в выделенных workflows. Agentic parity вложен под
`QA-Lab - All Lanes` и release validation, а не является самостоятельным PR workflow.
Для широкой валидации следует использовать `Full Release Validation` с
`rerun_group=qa-parity` или группу QA release-checks. Стабильные/default release
checks держат исчерпывающий live/Docker soak за `run_release_soak=true`; профиль
`full` принудительно включает soak. `QA-Lab - All Lanes`
запускается каждую ночь на `main` и из ручного dispatch с mock parity lane, live
Matrix lane, Convex-managed live Telegram lane и Convex-managed live Discord
lane как параллельными jobs. Scheduled QA и release checks явно передают Matrix
`--profile fast`, тогда как Matrix CLI и manual workflow input
по умолчанию остаются `all`; ручной dispatch может шардировать `all` на jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` и `e2ee-cli`. `OpenClaw Release
Checks` запускает parity плюс быстрые Matrix и Telegram lanes перед утверждением релиза,
используя `mock-openai/gpt-5.5` для проверок release transport, чтобы они оставались
детерминированными и избегали обычного запуска provider-plugin. Эти live transport
gateways отключают поиск памяти; поведение памяти остается покрытым наборами QA parity.

Full release live media shards используют
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, где уже есть
`ffmpeg` и `ffprobe`. Docker live model/backend shards используют общий образ
`ghcr.io/openclaw/openclaw-live-test:<sha>`, собранный один раз для выбранного
commit, затем извлекают его с `OPENCLAW_SKIP_DOCKER_BUILD=1` вместо повторной сборки
внутри каждого shard.

- `pnpm openclaw qa suite`
  - Запускает сценарии QA из репозитория напрямую на хосте.
  - Записывает артефакты верхнего уровня `qa-evidence.json`, `qa-suite-summary.json` и
    `qa-suite-report.md` для выбранного набора сценариев, включая выборки
    сценариев смешанных потоков, Vitest и Playwright.
  - При запуске через `pnpm openclaw qa run --qa-profile <profile>` встраивает
    скоркарту выбранного таксономического профиля в тот же `qa-evidence.json`.
    `smoke-ci` записывает облегченные доказательства, что задает
    `evidenceMode: "slim"` и пропускает `execution` для каждой записи. `release`
    покрывает курируемый срез готовности к релизу; `all` выбирает все активные
    категории зрелости и предназначен для явных запусков рабочего процесса QA
    Profile Evidence, когда нужен полный артефакт скоркарты.
  - По умолчанию запускает несколько выбранных сценариев параллельно с изолированными
    рабочими процессами gateway. `qa-channel` по умолчанию использует параллелизм 4
    (ограниченный числом выбранных сценариев). Используйте `--concurrency <count>`,
    чтобы настроить число рабочих процессов, или `--concurrency 1` для старой
    последовательной дорожки.
  - Завершается с ненулевым кодом, если любой сценарий завершается неудачно.
    Используйте `--allow-failures`, когда нужны артефакты без кода выхода,
    указывающего на ошибку.
  - Поддерживает режимы провайдера `live-frontier`, `mock-openai` и `aimock`.
    `aimock` запускает локальный сервер провайдера на базе AIMock для
    экспериментального покрытия фикстур и моков протокола, не заменяя
    учитывающую сценарии дорожку `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Ищет по ID сценариев, заголовкам, поверхностям, ID покрытия, ссылкам на
    документацию, ссылкам на код, плагинам и требованиям к провайдерам, затем
    выводит подходящие цели набора.
  - Используйте это перед запуском QA Lab, когда известно измененное поведение
    или путь к файлу, но неизвестен минимальный сценарий. Это только рекомендация;
    все равно выбирайте mock, live, Multipass, Matrix или транспортное доказательство
    исходя из изменяемого поведения.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускает полный живой прогон плагина OpenAI Kitchen Sink через QA Lab. Он
    устанавливает внешний пакет Kitchen Sink, проверяет инвентарь поверхности
    SDK плагинов, проверяет `/healthz` и `/readyz`, записывает доказательства
    CPU/RSS gateway, запускает живой ход OpenAI и проверяет состязательную
    диагностику. Требует живую авторизацию OpenAI, например `OPENAI_API_KEY`.
    В подготовленных сессиях Testbox он автоматически подключает live-auth
    профиль Testbox, когда присутствует помощник `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускает бенч запуска gateway плюс небольшой mock-набор сценариев QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) и записывает объединенную сводку наблюдений
    CPU в `.artifacts/gateway-cpu-scenarios/`.
  - По умолчанию отмечает только устойчивые наблюдения высокой загрузки CPU
    (`--cpu-core-warn` плюс `--hot-wall-warn-ms`), поэтому короткие всплески при
    запуске записываются как метрики и не выглядят как регрессия, при которой
    gateway на несколько минут занимает процессор.
  - Использует собранные артефакты `dist`; сначала запустите сборку, если в
    checkout еще нет свежего runtime-вывода.
- `pnpm openclaw qa suite --runner multipass`
  - Запускает тот же набор QA внутри одноразовой Linux-VM Multipass.
  - Сохраняет то же поведение выбора сценариев, что и `qa suite` на хосте.
  - Повторно использует те же флаги выбора провайдера/модели, что и `qa suite`.
  - Живые прогоны передают поддерживаемые входные данные QA-авторизации, практичные
    для гостевой системы: ключи провайдера из env, путь к конфигу живого
    провайдера QA и `CODEX_HOME`, если он присутствует.
  - Каталоги вывода должны оставаться внутри корня репозитория, чтобы гостевая
    система могла записывать обратно через смонтированную рабочую область.
  - Записывает обычный отчет QA и сводку плюс логи Multipass в
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускает Docker-сайт QA для QA-работы в операторском стиле.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Собирает npm tarball из текущего checkout, устанавливает его глобально в
    Docker, запускает неинтерактивный onboarding с API-ключом OpenAI, по
    умолчанию настраивает Telegram, проверяет, что упакованный runtime плагинов
    загружается без исправления зависимостей при запуске, запускает doctor и
    выполняет один локальный ход агента против замоканного endpoint OpenAI.
  - Используйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, чтобы запустить ту же
    дорожку packaged-install с Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускает детерминированный Docker smoke для собранного приложения для
    встроенных транскриптов runtime-контекста. Он проверяет, что скрытый
    runtime-контекст OpenClaw сохраняется как непоказываемое пользовательское
    сообщение, а не просачивается в видимый пользовательский ход, затем добавляет
    затронутый сломанный session JSONL и проверяет, что `openclaw doctor --fix`
    переписывает его в активную ветку с резервной копией.
- `pnpm test:docker:npm-telegram-live`
  - Устанавливает пакет-кандидат OpenClaw в Docker, запускает onboarding
    установленного пакета, настраивает Telegram через установленный CLI, затем
    повторно использует живую дорожку Telegram QA с этим установленным пакетом
    как SUT Gateway.
  - Обертка монтирует из checkout только исходники harness `qa-lab`; установленный
    пакет владеет `dist`, `openclaw/plugin-sdk` и runtime встроенных плагинов,
    поэтому дорожка не подмешивает плагины текущего checkout в тестируемый пакет.
  - По умолчанию используется `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`;
    задайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` или
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, чтобы вместо установки из реестра протестировать
    разрешенный локальный tarball.
  - По умолчанию выводит повторяющиеся RTT-тайминги в `qa-evidence.json` с
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Переопределите
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` или
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, чтобы настроить RTT-прогон.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` принимает разделенный запятыми список
    ID проверок Telegram QA для выборки; если он не задан, проверка по умолчанию
    с поддержкой RTT — `telegram-mentioned-message-reply`.
  - Использует те же Telegram env-учетные данные или источник учетных данных
    Convex, что и `pnpm openclaw qa telegram`. Для CI/релизной автоматизации
    задайте `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` и секрет роли. Если
    `OPENCLAW_QA_CONVEX_SITE_URL` и секрет роли Convex присутствуют в CI,
    Docker-обертка выбирает Convex автоматически.
  - Обертка проверяет env учетных данных Telegram или Convex на хосте до работы
    сборки/установки Docker. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    только при намеренной отладке настройки до учетных данных.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` переопределяет общий
    `OPENCLAW_QA_CREDENTIAL_ROLE` только для этой дорожки. Когда выбраны учетные
    данные Convex и роль не задана, обертка использует `ci` в CI и
    `maintainer` вне CI.
  - GitHub Actions предоставляет эту дорожку как ручной maintainer workflow
    `NPM Telegram Beta E2E`. Она не запускается при merge. Workflow использует
    окружение `qa-live-shared` и аренды учетных данных Convex CI.
- GitHub Actions также предоставляет `Package Acceptance` для побочного
  продуктового доказательства по одному пакету-кандидату. Он принимает доверенный
  ref, опубликованную npm-спецификацию, HTTPS URL tarball плюс SHA-256 или
  артефакт tarball из другого запуска, загружает нормализованный
  `openclaw-current.tgz` как `package-under-test`, затем запускает существующий
  планировщик Docker E2E с профилями дорожек smoke, package, product, full или
  custom. Задайте `telegram_mode=mock-openai` или `live-frontier`, чтобы запустить
  workflow Telegram QA против того же артефакта `package-under-test`.
  - Доказательство последней beta product:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказательство точного URL tarball требует digest и использует публичную
  политику безопасности URL:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private зеркала tarball используют явную политику доверенного источника:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` читает `.github/package-trusted-sources.json` из доверенного
ref workflow и не принимает учетные данные URL или workflow-input обход частной
сети. Если именованная политика объявляет bearer auth, настройте фиксированный
секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Доказательство артефактом скачивает артефакт tarball из другого запуска Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Упаковывает и устанавливает текущую сборку OpenClaw в Docker, запускает Gateway
    с настроенным OpenAI, затем включает встроенные каналы/плагины через правки
    конфига.
  - Проверяет, что setup discovery оставляет ненастроенные скачиваемые плагины
    отсутствующими, первое настроенное исправление doctor явно устанавливает
    каждый отсутствующий скачиваемый плагин, а второй restart не запускает
    скрытое исправление зависимостей.
  - Также устанавливает известную более старую npm baseline, включает Telegram
    перед запуском `openclaw update --tag <candidate>` и проверяет, что
    post-update doctor кандидата очищает мусор зависимостей legacy-плагинов без
    postinstall-исправления на стороне harness.
- `pnpm test:parallels:npm-update`
  - Запускает native smoke обновления packaged-install по гостевым системам
    Parallels. Каждая выбранная платформа сначала устанавливает запрошенный
    baseline-пакет, затем запускает установленную команду `openclaw update` в той
    же гостевой системе и проверяет установленную версию, статус обновления,
    готовность gateway и один локальный ход агента.
  - Используйте `--platform macos`, `--platform windows` или `--platform linux`
    при итерациях на одной гостевой системе. Используйте `--json` для пути к
    артефакту сводки и статуса каждой дорожки.
  - Дорожка OpenAI по умолчанию использует `openai/gpt-5.5` для живого
    доказательства хода агента. Передайте `--model <provider/model>` или задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, когда намеренно проверяете другую модель
    OpenAI.
  - Оборачивайте долгие локальные прогоны в host timeout, чтобы зависания
    транспорта Parallels не заняли остаток окна тестирования:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записывает вложенные логи дорожек в `/tmp/openclaw-parallels-npm-update.*`.
    Проверьте `windows-update.log`, `macos-update.log` или `linux-update.log`,
    прежде чем считать внешнюю обертку зависшей.
  - Обновление Windows может тратить от 10 до 15 минут на post-update doctor и
    работу обновления пакетов на холодной гостевой системе; это все еще штатно,
    если вложенный npm debug log продвигается.
  - Не запускайте эту aggregate-обертку параллельно с отдельными smoke-дорожками
    Parallels macOS, Windows или Linux. Они совместно используют состояние VM и
    могут конфликтовать при восстановлении snapshot, обслуживании пакетов или
    состоянии guest gateway.
  - Post-update доказательство запускает обычную поверхность встроенных плагинов,
    потому что capability facades, такие как речь, генерация изображений и
    понимание медиа, загружаются через встроенные runtime API, даже когда сам ход
    агента проверяет только простой текстовый ответ.

- `pnpm openclaw qa aimock`
  - Запускает только локальный сервер провайдера AIMock для прямого smoke-тестирования протокола.
- `pnpm openclaw qa matrix`
  - Запускает live-ветку QA для Matrix на одноразовом homeserver Tuwunel на базе Docker. Только для исходного checkout — пакетные установки не поставляют `qa-lab`.
  - Полная CLI, каталог профилей/сценариев, env vars и структура артефактов: [QA Matrix](/ru/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускает live-ветку QA для Telegram в реальной приватной группе, используя токены бота-драйвера и SUT-бота из env.
  - Требует `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` и `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Идентификатор группы должен быть числовым идентификатором чата Telegram.
  - Поддерживает `--credential-source convex` для общих credentials из пула. По умолчанию используйте режим env или задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, чтобы включить pooled leases.
  - Defaults охватывают canary, mention gating, адресацию команд, `/status`, упомянутые ответы bot-to-bot и ответы основных native-команд. Defaults `mock-openai` также покрывают детерминированные регрессии reply-chain и streaming финального сообщения Telegram. Используйте `--list-scenarios` для optional probes, таких как `session_status`.
  - Завершается с ненулевым кодом, если какой-либо сценарий завершается неудачно. Используйте `--allow-failures`, когда нужны артефакты без кода завершения с ошибкой.
  - Требует двух разных ботов в одной приватной группе, при этом SUT-бот должен предоставлять имя пользователя Telegram.
  - Для стабильного наблюдения bot-to-bot включите Bot-to-Bot Communication Mode в `@BotFather` для обоих ботов и убедитесь, что бот-драйвер может наблюдать bot-трафик группы.
  - Записывает отчет QA Telegram, сводку и `qa-evidence.json` в `.artifacts/qa-e2e/...`. Сценарии с ответами включают RTT от запроса отправки драйвера до наблюдаемого ответа SUT.

`Mantis Telegram Live` — это PR-evidence wrapper вокруг этой ветки. Он запускает candidate ref с credentials Telegram, арендованными через Convex, отображает отредактированный QA report/evidence bundle в настольном браузере Crabbox, записывает MP4 evidence, генерирует GIF с обрезкой по движению, загружает artifact bundle и публикует встроенное PR evidence через Mantis GitHub App, когда задан `pr_number`. Maintainers могут запустить его из Actions UI через `Mantis Scenario` (`scenario_id:
telegram-live`) или напрямую из комментария к pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` — это agentic native Telegram Desktop before/after wrapper для визуального доказательства PR. Запустите его из Actions UI с freeform `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) или из комментария к PR:

```text
@openclaw-mantis telegram desktop proof
```

Агент Mantis читает PR, решает, какое видимое в Telegram поведение доказывает изменение, запускает real-user Crabbox Telegram Desktop proof lane на baseline и candidate refs, повторяет до тех пор, пока native GIFs не станут полезными, записывает парный манифест `motionPreview` и публикует ту же 2-колоночную GIF-таблицу через Mantis GitHub App, когда задан `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Арендует или повторно использует рабочий стол Crabbox Linux, устанавливает native Telegram Desktop, настраивает OpenClaw с арендованным токеном Telegram SUT-бота, запускает Gateway и записывает screenshot/MP4 evidence с видимого рабочего стола VNC.
  - По умолчанию использует `--credential-source convex`, поэтому workflow нужен только broker secret Convex. Используйте `--credential-source env` с теми же переменными `OPENCLAW_QA_TELEGRAM_*`, что и `pnpm openclaw qa telegram`.
  - Telegram Desktop все еще требует пользовательский login/profile. Токен бота настраивает только OpenClaw. Используйте `--telegram-profile-archive-env <name>` для base64 `.tgz` archive профиля или используйте `--keep-lease` и один раз войдите вручную через VNC.
  - Записывает `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` и `telegram-desktop-builder.mp4` в выходной каталог.

Live-ветки транспорта используют один стандартный контракт, чтобы новые транспорты не расходились; матрица покрытия по веткам находится в [обзоре QA → покрытие live-транспорта](/ru/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — это широкий синтетический suite и не входит в эту матрицу.

### Общие credentials Telegram через Convex (v1)

Когда `--credential-source convex` (или `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) включен для live transport QA, QA lab получает exclusive lease из пула на базе Convex, отправляет heartbeats для этого lease, пока ветка выполняется, и освобождает lease при завершении работы. Название раздела появилось до поддержки Discord, Slack и WhatsApp; lease contract общий для всех видов.

Эталонный scaffold проекта Convex:

- `qa/convex-credential-broker/`

Обязательные env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (например, `https://your-deployment.convex.site`)
- Один secret для выбранной роли:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Выбор credential role:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (по умолчанию `ci` в CI, иначе `maintainer`)

Необязательные env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optional trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` разрешает loopback `http://` URL Convex только для локальной разработки.

`OPENCLAW_QA_CONVEX_SITE_URL` должен использовать `https://` при нормальной работе.

Maintainer admin commands (pool add/remove/list) require
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` specifically.

CLI helpers for maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` before live runs to check the Convex site URL, broker secrets,
endpoint prefix, HTTP timeout, and admin/list reachability without printing
secret values. Use `--json` for machine-readable output in scripts and CI
utilities.

Default endpoint contract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Success: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }` (or empty `2xx`)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }` (or empty `2xx`)
- `POST /admin/add` (maintainer secret only)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove` (maintainer secret only)
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (maintainer secret only)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Payload shape for Telegram kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` must be a numeric Telegram chat id string.
- `admin/add` validates this shape for `kind: "telegram"` and rejects malformed payloads.

Payload shape for Telegram real-user kind:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, and `telegramApiId` must be numeric strings.
- `tdlibArchiveSha256` and `desktopTdataArchiveSha256` must be SHA-256 hex strings.
- `kind: "telegram-user"` is reserved for the Mantis Telegram Desktop proof workflow. Generic QA Lab lanes must not acquire it.

Broker-validated multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes can also lease from the pool, but Slack payload validation currently
lives in the Slack QA runner rather than the broker. Use
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
for Slack rows.

### Adding a channel to QA

The architecture and scenario-helper names for new channel adapters live in [QA overview → Adding a channel](/ru/concepts/qa-e2e-automation#adding-a-channel). The minimum bar: implement the transport runner on the shared `qa-lab` host seam, declare `qaRunners` in the plugin manifest, mount as `openclaw qa <runner>`, and author scenarios under `qa/scenarios/`.

## Test suites (what runs where)

Think of the suites as "increasing realism" (and increasing flakiness/cost):

### Unit / integration (default)

- Command: `pnpm test`
- Config: untargeted runs use the `vitest.full-*.config.ts` shard set and may expand multi-project shards into per-project configs for parallel scheduling
- Files: core/unit inventories under `src/**/*.test.ts`, `packages/**/*.test.ts`, and `test/**/*.test.ts`; UI unit tests run in the dedicated `unit-ui` shard
- Scope:
  - Pure unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Deterministic regressions for known bugs
- Expectations:
  - Runs in CI
  - No real keys required
  - Should be fast and stable
  - Resolver and public-surface loader tests must prove broad `api.js` and
    `runtime-api.js` fallback behavior with generated tiny plugin fixtures, not
    real bundled plugin source APIs. Real plugin API loads belong in
    plugin-owned contract/integration suites.

Native dependency policy:

- Default test installs skip optional native Discord opus builds. Discord voice uses bundled `libopus-wasm`, and `@discordjs/opus` stays disabled in `allowBuilds` so local tests and Testbox lanes do not compile the native addon.
- Compare native opus performance in the `libopus-wasm` benchmark repo, not in default OpenClaw install/test loops. Do not set `@discordjs/opus` to `true` in the default `allowBuilds`; that makes unrelated install/test loops compile native code.

<AccordionGroup>
  <Accordion title="Проекты, shards и scoped lanes">

    - Ненацеленный `pnpm test` запускает двенадцать меньших конфигураций шардов (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) вместо одного огромного нативного процесса корневого проекта. Это снижает пиковый RSS на загруженных машинах и не дает работе auto-reply/расширений вытеснять несвязанные наборы тестов.
    - `pnpm test --watch` по-прежнему использует нативный граф проектов корневого `vitest.config.ts`, потому что цикл наблюдения с несколькими шардами непрактичен.
    - `pnpm test`, `pnpm test:watch` и `pnpm test:perf:imports` сначала направляют явные цели файлов/каталогов через scoped lanes, поэтому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` избегает полной платы за запуск корневого проекта.
    - `pnpm test:changed` по умолчанию разворачивает измененные git-пути в дешевые scoped lanes: прямые правки тестов, соседние файлы `*.test.ts`, явные сопоставления исходников и локальные зависимые элементы графа импортов. Правки конфигурации, настройки и пакетов не запускают тесты широко, если только вы явно не используете `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — обычный умный локальный контрольный шаг для узких изменений. Он классифицирует diff на core, тесты core, расширения, тесты расширений, приложения, документацию, метаданные релиза, live Docker tooling и tooling, а затем запускает соответствующие команды typecheck, lint и guard. Он не запускает тесты Vitest; для доказательства тестами вызовите `pnpm test:changed` или явный `pnpm test <target>`. Изменения только метаданных релиза с повышением версии запускают целевые проверки версий, конфигурации и корневых зависимостей, с guard, который отклоняет изменения пакетов вне верхнеуровневого поля версии.
    - Правки live Docker ACP harness запускают сфокусированные проверки: синтаксис shell для live Docker auth-скриптов и dry-run live Docker scheduler. Изменения `package.json` включаются только когда diff ограничен `scripts["test:docker:live-*"]`; правки зависимостей, экспортов, версии и других поверхностей пакета по-прежнему используют более широкие guards.
    - Легкие по импорту unit-тесты из agents, commands, plugins, auto-reply helpers, `plugin-sdk` и похожих областей чистых утилит направляются через lane `unit-fast`, который пропускает `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файлы остаются на существующих lanes.
    - Выбранные исходные файлы helper в `plugin-sdk` и `commands` также сопоставляют changed-mode запуски с явными соседними тестами в этих легких lanes, поэтому правки helper не перезапускают весь тяжелый набор для этого каталога.
    - У `auto-reply` есть отдельные buckets для верхнеуровневых core helpers, верхнеуровневых интеграционных тестов `reply.*` и поддерева `src/auto-reply/reply/**`. CI дополнительно делит поддерево reply на шарды agent-runner, dispatch и commands/state-routing, чтобы один import-heavy bucket не владел всем хвостом Node.
    - Обычный CI для PR/main намеренно пропускает batch sweep расширений и release-only шард `agentic-plugins`. Full Release Validation запускает отдельный дочерний workflow `Plugin Prerelease` для этих насыщенных plugin/extension наборов на релиз-кандидатах.

  </Accordion>

  <Accordion title="Покрытие встроенного runner">

    - Когда вы меняете входы обнаружения message-tool или runtime-контекст Compaction,
      сохраняйте оба уровня покрытия.
    - Добавляйте сфокусированные регрессии helper для чистых границ маршрутизации и нормализации.
    - Поддерживайте исправность интеграционных наборов встроенного runner:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` и
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Эти наборы проверяют, что scoped ids и поведение Compaction по-прежнему проходят
      через реальные пути `run.ts` / `compact.ts`; тесты только helper не являются
      достаточной заменой этим интеграционным путям.

  </Accordion>

  <Accordion title="Пул Vitest и значения изоляции по умолчанию">

    - Базовая конфигурация Vitest по умолчанию использует `threads`.
    - Общая конфигурация Vitest фиксирует `isolate: false` и использует
      неизолированный runner в корневых проектах, e2e и live-конфигурациях.
    - Корневой UI lane сохраняет свою настройку `jsdom` и optimizer, но тоже работает на
      общем неизолированном runner.
    - Каждый шард `pnpm test` наследует те же значения по умолчанию `threads` + `isolate: false`
      из общей конфигурации Vitest.
    - `scripts/run-vitest.mjs` по умолчанию добавляет `--no-maglev` для дочерних Node-процессов
      Vitest, чтобы снизить churn компиляции V8 во время больших локальных запусков.
      Установите `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, чтобы сравнить со стандартным
      поведением V8.
    - `scripts/run-vitest.mjs` завершает явные non-watch запуски Vitest после
      5 минут без вывода в stdout или stderr. Установите
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, чтобы отключить watchdog для
      намеренно тихого расследования.

  </Accordion>

  <Accordion title="Быстрая локальная итерация">

    - `pnpm changed:lanes` показывает, какие архитектурные lanes запускает diff.
    - Pre-commit hook выполняет только форматирование. Он повторно добавляет отформатированные файлы в индекс и
      не запускает lint, typecheck или тесты.
    - Запускайте `pnpm check:changed` явно перед handoff или push, когда вам
      нужен умный локальный контрольный шаг.
    - `pnpm test:changed` по умолчанию направляет через дешевые scoped lanes. Используйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только когда агент
      решает, что правка harness, конфигурации, пакета или контракта действительно требует более широкого
      покрытия Vitest.
    - `pnpm test:max` и `pnpm test:changed:max` сохраняют то же поведение маршрутизации,
      только с более высоким лимитом workers.
    - Локальное авто-масштабирование workers намеренно консервативно и снижает нагрузку,
      когда средняя нагрузка хоста уже высока, поэтому несколько одновременных
      запусков Vitest по умолчанию наносят меньше ущерба.
    - Базовая конфигурация Vitest помечает проекты/конфигурационные файлы как
      `forceRerunTriggers`, чтобы changed-mode перезапуски оставались корректными при изменении
      тестовой проводки.
    - Конфигурация держит `OPENCLAW_VITEST_FS_MODULE_CACHE` включенным на поддерживаемых
      хостах; установите `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, если хотите
      одно явное расположение кэша для прямого профилирования.

  </Accordion>

  <Accordion title="Отладка производительности">

    - `pnpm test:perf:imports` включает отчет Vitest о длительности импортов плюс
      вывод import-breakdown.
    - `pnpm test:perf:imports:changed` ограничивает тот же вид профилирования
      файлами, измененными с `origin/main`.
    - Данные времени шардов записываются в `.artifacts/vitest-shard-timings.json`.
      Запуски всей конфигурации используют путь конфигурации как ключ; include-pattern CI
      шарды добавляют имя шарда, чтобы отфильтрованные шарды можно было отслеживать
      отдельно.
    - Когда один горячий тест все еще тратит большую часть времени на стартовые импорты,
      держите тяжелые зависимости за узкой локальной границей `*.runtime.ts` и
      мокайте эту границу напрямую вместо deep-import runtime helpers только
      чтобы передать их через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` сравнивает маршрутизированный
      `test:changed` с нативным путем корневого проекта для этого зафиксированного
      diff и печатает wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркает текущее
      грязное дерево, направляя список измененных файлов через
      `scripts/test-projects.mjs` и корневую конфигурацию Vitest.
    - `pnpm test:perf:profile:main` записывает CPU-профиль main-thread для
      накладных расходов запуска и трансформаций Vitest/Vite.
    - `pnpm test:perf:profile:runner` записывает CPU+heap профили runner для
      unit-набора с отключенным файловым параллелизмом.

  </Accordion>
</AccordionGroup>

### Стабильность (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфигурация: `vitest.gateway.config.ts`, принудительно один worker
- Область:
  - Запускает реальный loopback Gateway с диагностикой, включенной по умолчанию
  - Прогоняет синтетический churn сообщений gateway, памяти и больших payload через путь диагностических событий
  - Запрашивает `diagnostics.stability` через Gateway WS RPC
  - Покрывает helpers сохранения диагностического stability bundle
  - Проверяет, что recorder остается ограниченным, синтетические RSS-выборки остаются ниже бюджета давления, а глубины очередей по сессиям возвращаются к нулю
- Ожидания:
  - Безопасно для CI и не требует ключей
  - Узкий lane для follow-up по регрессиям стабильности, не замена полному набору Gateway

### E2E (агрегат репозитория)

- Команда: `pnpm test:e2e`
- Область:
  - Запускает gateway smoke E2E lane
  - Запускает mocked Control UI browser E2E lane
- Ожидания:
  - Безопасно для CI и не требует ключей
  - Требует установленного Playwright Chromium

### E2E (gateway smoke)

- Команда: `pnpm test:e2e:gateway`
- Конфигурация: `vitest.e2e.config.ts`
- Файлы: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` и E2E-тесты bundled-plugin в `extensions/`
- Runtime значения по умолчанию:
  - Использует Vitest `threads` с `isolate: false`, как и остальная часть репозитория.
  - Использует adaptive workers (CI: до 2, локально: 1 по умолчанию).
  - По умолчанию работает в silent mode, чтобы снизить накладные расходы console I/O.
- Полезные переопределения:
  - `OPENCLAW_E2E_WORKERS=<n>` для принудительного числа workers (ограничено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного включения подробного консольного вывода.
- Область:
  - Сквозное поведение gateway с несколькими экземплярами
  - Поверхности WebSocket/HTTP, сопряжение node и более тяжелая сеть
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
  - Заменяет Gateway WebSocket детерминированными in-browser моками
- Ожидания:
  - Запускается в CI как часть `pnpm test:e2e`
  - Реальный Gateway, agents или provider keys не требуются
  - Браузерная зависимость должна присутствовать (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Повторно использует активный локальный OpenShell gateway
  - Создает sandbox из временного локального Dockerfile
  - Проверяет backend OpenShell в OpenClaw через реальные `sandbox ssh-config` + SSH exec
  - Проверяет remote-canonical поведение файловой системы через sandbox fs bridge
- Ожидания:
  - Только opt-in; не является частью стандартного запуска `pnpm test:e2e`
  - Требует локальный CLI `openshell` плюс рабочий Docker daemon
  - Требует активный локальный OpenShell gateway и его источник конфигурации
  - Использует изолированные `HOME` / `XDG_CONFIG_HOME`, затем уничтожает тестовый sandbox
- Полезные переопределения:
  - `OPENCLAW_E2E_OPENSHELL=1` для включения теста при ручном запуске более широкого e2e-набора
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для указания нестандартного CLI binary или wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` для предоставления зарегистрированной конфигурации gateway изолированному тесту
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` для переопределения Docker gateway IP, используемого host policy fixture

### Live (реальные providers + реальные модели)

- Команда: `pnpm test:live`
- Конфигурация: `vitest.live.config.ts`
- Файлы: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` и live-тесты встроенных Plugin в `extensions/`
- По умолчанию: **включено** через `pnpm test:live` (задает `OPENCLAW_LIVE_TEST=1`)
- Область:
  - "Этот провайдер/модель действительно работает _сегодня_ с реальными учетными данными?"
  - Выявлять изменения формата провайдера, особенности вызова инструментов, проблемы аутентификации и поведение лимитов частоты
- Ожидания:
  - По замыслу не стабильно для CI (реальные сети, реальные политики провайдеров, квоты, сбои)
  - Стоит денег / использует лимиты частоты
  - Предпочитайте запускать суженные подмножества вместо "всего"
- Live-запуски используют уже экспортированные API-ключи и подготовленные профили аутентификации.
- По умолчанию live-запуски по-прежнему изолируют `HOME` и копируют материалы конфигурации/аутентификации во временный тестовый домашний каталог, чтобы unit-фикстуры не могли изменить ваш реальный `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` только когда вам намеренно нужно, чтобы live-тесты использовали ваш реальный домашний каталог.
- `pnpm test:live` по умолчанию работает в более тихом режиме: он сохраняет вывод прогресса `[live] ...` и подавляет журналы начальной загрузки gateway/шум Bonjour. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, если хотите вернуть полные журналы запуска.
- Ротация API-ключей (зависит от провайдера): задайте `*_API_KEYS` в формате с запятыми/точками с запятой или `*_API_KEY_1`, `*_API_KEY_2` (например, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) либо переопределение для конкретного live-запуска через `OPENCLAW_LIVE_*_KEY`; тесты повторяют попытку при ответах о лимите частоты.
- Вывод прогресса/Heartbeat:
  - Live-наборы теперь выводят строки прогресса в stderr, чтобы долгие вызовы провайдера были явно активны даже при тихом перехвате консоли Vitest.
  - `vitest.live.config.ts` отключает перехват консоли Vitest, чтобы строки прогресса провайдера/gateway сразу передавались во время live-запусков.
  - Настраивайте Heartbeat прямых моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Настраивайте Heartbeat gateway/проб через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Какой набор мне запускать?

Используйте эту таблицу решений:

- Правка логики/тестов: запускайте `pnpm test` (и `pnpm test:coverage`, если вы многое изменили)
- Изменение сетевого взаимодействия gateway / протокола WS / сопряжения: добавьте `pnpm test:e2e`
- Отладка "мой бот не работает" / сбоев конкретного провайдера / вызова инструментов: запускайте суженный `pnpm test:live`

## Live-тесты (с обращением к сети)

Для live-матрицы моделей, smoke-тестов CLI-бэкенда, smoke-тестов ACP, harness
сервера приложения Codex и всех live-тестов media-провайдеров (Deepgram, BytePlus, ComfyUI, изображения,
музыка, видео, media harness), а также обработки учетных данных для live-запусков, см.
[Тестирование live-наборов](/ru/help/testing-live). Отдельный контрольный список обновлений и
валидации Plugin см. в
[Тестирование обновлений и plugins](/ru/help/testing-updates-plugins).

## Docker-раннеры (необязательные проверки "работает в Linux")

Эти Docker-раннеры делятся на две группы:

- Раннеры live-моделей: `test:docker:live-models` и `test:docker:live-gateway` запускают только свой соответствующий live-файл ключей профилей внутри Docker-образа репозитория (`src/agents/models.profiles.live.test.ts` и `src/gateway/gateway-models.profiles.live.test.ts`), монтируя ваш локальный каталог конфигурации, рабочую область и необязательный env-файл профиля. Соответствующие локальные точки входа: `test:live:models-profiles` и `test:live:gateway-profiles`.
- Docker live-раннеры при необходимости сохраняют собственные практические ограничения:
  `test:docker:live-models` по умолчанию использует отобранный поддерживаемый набор с высоким сигналом, а
  `test:docker:live-gateway` по умолчанию задает `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` и
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Задайте `OPENCLAW_LIVE_MAX_MODELS`
  или env-переменные gateway, когда вам явно нужен меньший лимит или более широкий проход.
- `test:docker:all` один раз собирает live Docker-образ через `test:docker:live-build`, один раз упаковывает OpenClaw как npm tarball через `scripts/package-openclaw-for-docker.mjs`, затем собирает/переиспользует два образа `scripts/e2e/Dockerfile`. Базовый образ — это только раннер Node/Git для направлений установки/обновления/зависимостей Plugin; эти направления монтируют заранее собранный tarball. Функциональный образ устанавливает тот же tarball в `/app` для направлений функциональности собранного приложения. Определения Docker-направлений находятся в `scripts/lib/docker-e2e-scenarios.mjs`; логика планировщика — в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` выполняет выбранный план. Агрегатор использует взвешенный локальный планировщик: `OPENCLAW_DOCKER_ALL_PARALLELISM` управляет слотами процессов, а лимиты ресурсов не дают тяжелым live-, npm-install- и multi-service-направлениям стартовать всем одновременно. Если отдельное направление тяжелее активных лимитов, планировщик все равно может запустить его, когда пул пуст, и затем оставляет его выполняться в одиночку, пока снова не появится емкость. Значения по умолчанию: 10 слотов, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` и `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; настраивайте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` или `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` только когда у Docker-хоста есть больший запас ресурсов. Раннер по умолчанию выполняет предварительную проверку Docker, удаляет устаревшие контейнеры OpenClaw E2E, печатает статус каждые 30 секунд, сохраняет тайминги успешных направлений в `.artifacts/docker-tests/lane-timings.json` и использует эти тайминги, чтобы в последующих запусках сначала стартовали более долгие направления. Используйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, чтобы напечатать взвешенный манифест направлений без сборки или запуска Docker, или `node scripts/test-docker-all.mjs --plan-json`, чтобы напечатать CI-план для выбранных направлений, потребностей в пакетах/образах и учетных данных.
- `Package Acceptance` — это встроенный в GitHub пакетный gate для вопроса "работает ли этот устанавливаемый tarball как продукт?" Он разрешает один кандидатный пакет из `source=npm`, `source=ref`, `source=url` или `source=artifact`, загружает его как `package-under-test`, затем запускает переиспользуемые Docker E2E-направления против ровно этого tarball вместо повторной упаковки выбранного ref. Профили упорядочены по широте: `smoke`, `package`, `product` и `full`. См. [Тестирование обновлений и plugins](/ru/help/testing-updates-plugins) для контракта пакета/обновления/Plugin, матрицы опубликованных upgrade-survivor, release-значений по умолчанию и разбора сбоев.
- Проверки сборки и release запускают `scripts/check-cli-bootstrap-imports.mjs` после tsdown. Guard обходит статический собранный граф от `dist/entry.js` и `dist/cli/run-main.js` и завершает работу с ошибкой, если начальная загрузка до dispatch команды импортирует зависимости пакетов, такие как Commander, UI подсказок, undici или логирование, до dispatch команды; он также удерживает встроенный chunk запуска gateway в пределах бюджета и отклоняет статические импорты известных холодных путей gateway. Packaged CLI smoke также покрывает корневую справку, справку onboard, справку doctor, status, схему config и команду списка моделей.
- Legacy-совместимость Приемки пакета ограничена `2026.4.25` (включая `2026.4.25-beta.*`). До этой даты включительно harness допускает только пробелы метаданных отгруженного пакета: опущенные приватные записи QA inventory, отсутствие `gateway install --wrapper`, отсутствие patch-файлов в git-фикстуре, полученной из tarball, отсутствие сохраненного `update.channel`, legacy-расположения install-record Plugin, отсутствие сохранения marketplace install-record и миграцию метаданных config во время `plugins update`. Для пакетов после `2026.4.25` эти пути являются строгими сбоями.
- Раннеры container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` и `test:docker:config-reload` запускают один или несколько реальных контейнеров и проверяют интеграционные пути более высокого уровня.
- Docker/Bash E2E-направления, которые устанавливают упакованный OpenClaw tarball через `scripts/lib/openclaw-e2e-instance.sh`, ограничивают `npm install` значением `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (по умолчанию `600s`; задайте `0`, чтобы отключить wrapper для отладки).

Docker-раннеры live-моделей также bind-mount только нужные домашние каталоги аутентификации CLI (или все поддерживаемые, когда запуск не сужен), затем копируют их в домашний каталог контейнера перед запуском, чтобы OAuth внешнего CLI мог обновлять токены без изменения хранилища аутентификации хоста:

- Прямые модели: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; по умолчанию покрывает Claude, Codex и Gemini, со строгим покрытием Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` и `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke-тесты: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` и `pnpm qa:observability:smoke` — это приватные QA-направления из исходного checkout. Они намеренно не входят в package Docker release-направления, потому что npm tarball не включает QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Мастер onboarding (TTY, полный scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` устанавливает упакованный OpenClaw tarball глобально в Docker, настраивает OpenAI через onboarding с env-ref и Telegram по умолчанию, запускает doctor и выполняет один mocked OpenAI agent turn. Переиспользуйте заранее собранный tarball с `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустите host rebuild с `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` или переключите канал с `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` либо `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Дымовой тест пользовательского пути релиза: `pnpm test:docker:release-user-journey` глобально устанавливает упакованный tarball OpenClaw в чистом домашнем каталоге Docker, запускает onboarding, настраивает имитированный провайдер OpenAI, выполняет ход агента, устанавливает/удаляет внешние плагины, настраивает ClickClack на локальную фикстуру, проверяет исходящие/входящие сообщения, перезапускает Gateway и запускает doctor.
- Дымовой тест типизированного onboarding релиза: `pnpm test:docker:release-typed-onboarding` устанавливает упакованный tarball, проводит `openclaw onboard` через реальный TTY, настраивает OpenAI как провайдер env-ref, проверяет, что сырой ключ не сохраняется, и выполняет имитированный ход агента.
- Дымовой тест медиа/памяти релиза: `pnpm test:docker:release-media-memory` устанавливает упакованный tarball, проверяет понимание изображения из PNG-вложения, вывод генерации изображений, совместимый с OpenAI, recall поиска по памяти и сохранение recall после перезапуска Gateway.
- Дымовой тест пользовательского пути обновления релиза: `pnpm test:docker:release-upgrade-user-journey` по умолчанию устанавливает новейшую опубликованную базовую версию старше tarball-кандидата, настраивает состояние провайдера/плагина/ClickClack на опубликованном пакете, обновляет до tarball-кандидата, затем повторно запускает основной путь агента/плагина/канала. Если более старой опубликованной базовой версии нет, используется версия кандидата. Переопределите базовую версию через `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Дымовой тест маркетплейса плагинов релиза: `pnpm test:docker:release-plugin-marketplace` устанавливает из локальной фикстуры маркетплейса, обновляет установленный плагин, удаляет его и проверяет, что CLI плагина исчезает, а метаданные установки очищаются.
- Дымовой тест установки Skill: `pnpm test:docker:skill-install` глобально устанавливает упакованный tarball OpenClaw в Docker, отключает установки загруженных архивов в конфигурации, находит текущий live slug Skill из ClawHub через поиск, устанавливает его с помощью `openclaw skills install` и проверяет установленный Skill, а также метаданные происхождения/lock `.clawhub`.
- Дымовой тест переключения канала обновлений: `pnpm test:docker:update-channel-switch` глобально устанавливает упакованный tarball OpenClaw в Docker, переключается с пакетного `stable` на git `dev`, проверяет сохраненный канал и работу плагинов после обновления, затем переключается обратно на пакетный `stable` и проверяет статус обновления.
- Дымовой тест выживания при обновлении: `pnpm test:docker:upgrade-survivor` устанавливает упакованный tarball OpenClaw поверх загрязненной фикстуры старого пользователя с агентами, конфигурацией канала, allowlist плагинов, устаревшим состоянием зависимостей плагинов и существующими файлами workspace/session. Он запускает обновление пакета и неинтерактивный doctor без live-провайдера или ключей канала, затем запускает loopback Gateway и проверяет сохранение конфигурации/состояния, а также бюджеты запуска/статуса.
- Дымовой тест выживания при опубликованном обновлении: `pnpm test:docker:published-upgrade-survivor` по умолчанию устанавливает `openclaw@latest`, засевает реалистичные файлы существующего пользователя, настраивает эту базовую версию встроенным рецептом команд, проверяет итоговую конфигурацию, обновляет эту опубликованную установку до tarball-кандидата, запускает неинтерактивный doctor, записывает `.artifacts/upgrade-survivor/summary.json`, затем запускает loopback Gateway и проверяет настроенные намерения, сохранение состояния, запуск, `/healthz`, `/readyz` и бюджеты статуса RPC. Переопределите одну базовую версию через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросите агрегирующий планировщик развернуть точные локальные базовые версии через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, например `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, и разверните issue-подобные фикстуры через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, например `reported-issues`; набор reported-issues включает `configured-plugin-installs` для автоматического восстановления установки внешнего плагина OpenClaw. Package Acceptance предоставляет их как `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` и `published_upgrade_survivor_scenarios`, разрешает метатокены базовых версий, такие как `last-stable-4` или `all-since-2026.4.23`, а Full Release Validation расширяет пакетный gate release-soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Дымовой тест runtime-контекста сессии: `pnpm test:docker:session-runtime-context` проверяет сохранение скрытого transcript runtime-контекста и ремонт doctor затронутых дублирующихся веток prompt-rewrite.
- Дымовой тест глобальной установки Bun: `bash scripts/e2e/bun-global-install-smoke.sh` упаковывает текущее дерево, устанавливает его через `bun install -g` в изолированном домашнем каталоге и проверяет, что `openclaw infer image providers --json` возвращает встроенных провайдеров изображений, а не зависает. Повторно используйте заранее собранный tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустите сборку на хосте через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` или скопируйте `dist/` из собранного образа Docker через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Дымовой тест установщика Docker: `bash scripts/test-install-sh-docker.sh` использует один общий кэш npm для контейнеров root, update и direct-npm. Дымовой тест обновления по умолчанию использует npm `latest` как стабильную базовую версию перед обновлением до tarball-кандидата. Переопределите локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` или через вход `update_baseline_version` workflow Install Smoke на GitHub. Проверки установщика без root сохраняют изолированный кэш npm, чтобы записи кэша, принадлежащие root, не скрывали поведение локальной пользовательской установки. Установите `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, чтобы повторно использовать кэш root/update/direct-npm между локальными повторными запусками.
- Install Smoke CI пропускает дублирующее глобальное обновление direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без этой env, когда требуется покрытие прямого `npm install -g`.
- Дымовой тест CLI удаления агентами общего workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) по умолчанию собирает образ из корневого Dockerfile, засевает двух агентов с одним workspace в изолированном домашнем каталоге контейнера, запускает `agents delete --json` и проверяет валидный JSON, а также поведение с сохраненным workspace. Повторно используйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Сеть Gateway (два контейнера, аутентификация WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Дымовой тест снимка Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) собирает исходный E2E-образ плюс слой Chromium, запускает Chromium с сырым CDP, выполняет `browser doctor --deep` и проверяет, что снимки ролей CDP покрывают URL ссылок, кликабельные элементы, повышенные из курсора, iframe refs и метаданные фреймов.
- Регрессия минимального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускает имитированный сервер OpenAI через Gateway, проверяет, что `web_search` повышает `reasoning.effort` с `minimal` до `low`, затем принудительно вызывает отказ схемы провайдера и проверяет, что сырая detail появляется в логах Gateway.
- Мост каналов MCP (засеянный Gateway + stdio-мост + дымовой тест сырого notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-инструменты bundle OpenClaw (реальный stdio MCP-сервер + дымовой тест allow/deny встроенного профиля OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (скрипт: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Очистка Cron/subagent MCP (реальный Gateway + демонтаж stdio MCP-дочернего процесса после изолированных запусков cron и одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (дымовой тест установки/обновления для локального пути, `file:`, npm registry с hoisted dependencies, некорректных метаданных npm-пакета, движущихся git refs, ClawHub kitchen-sink, обновлений marketplace и enable/inspect Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установите `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, чтобы пропустить блок ClawHub, или переопределите пару package/runtime kitchen-sink по умолчанию через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` и `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест использует герметичный локальный сервер фикстуры ClawHub.
- Дымовой тест обновления Plugin без изменений: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Дымовой тест матрицы жизненного цикла Plugin: `pnpm test:docker:plugin-lifecycle-matrix` устанавливает упакованный tarball OpenClaw в пустом контейнере, устанавливает npm-плагин, переключает enable/disable, обновляет и откатывает его через локальный npm registry, удаляет установленный код, затем проверяет, что uninstall по-прежнему удаляет устаревшее состояние, одновременно записывая метрики RSS/CPU для каждой фазы жизненного цикла.
- Дымовой тест metadata перезагрузки конфигурации: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` покрывает дымовые тесты установки/обновления для локального пути, `file:`, npm registry с hoisted dependencies, git moving refs, фикстур ClawHub, обновлений marketplace и enable/inspect Claude-bundle. `pnpm test:docker:plugin-update` покрывает поведение обновления без изменений для установленных плагинов. `pnpm test:docker:plugin-lifecycle-matrix` покрывает установку npm-плагина с отслеживанием ресурсов, enable, disable, upgrade, downgrade и uninstall при отсутствующем коде.

Чтобы вручную предварительно собрать и повторно использовать общий функциональный образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Переопределения образов для конкретных suite, такие как `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, по-прежнему имеют приоритет, если заданы. Когда `OPENCLAW_SKIP_DOCKER_BUILD=1` указывает на удаленный общий образ, скрипты загружают его, если он еще не доступен локально. QR- и installer Docker-тесты сохраняют собственные Dockerfile, потому что они проверяют поведение пакета/установки, а не общий runtime собранного приложения.

Live-model Docker-раннеры также bind-mount текущий checkout в режиме только для чтения и
помещают его во временный рабочий каталог внутри контейнера. Это сохраняет runtime-образ
компактным, но при этом запускает Vitest именно с вашим локальным исходным кодом и конфигурацией.
Шаг подготовки пропускает крупные локальные кэши и выходные артефакты сборки приложений, такие как
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а также локальные для приложения каталоги `.build` или
выходные каталоги Gradle, чтобы live-запуски Docker не тратили минуты на копирование
артефактов, специфичных для машины.
Они также задают `OPENCLAW_SKIP_CHANNELS=1`, чтобы live-пробы Gateway не запускали
настоящие воркеры каналов Telegram/Discord/и т. д. внутри контейнера.
`test:docker:live-models` по-прежнему запускает `pnpm test:live`, поэтому также передавайте
`OPENCLAW_LIVE_GATEWAY_*`, когда нужно сузить или исключить live-покрытие Gateway
из этой Docker-дорожки.
`test:docker:openwebui` — это высокоуровневый compatibility smoke-тест: он запускает
контейнер Gateway OpenClaw с включенными HTTP-эндпоинтами, совместимыми с OpenAI,
запускает закрепленный контейнер Open WebUI для этого Gateway, выполняет вход через
Open WebUI, проверяет, что `/api/models` предоставляет `openclaw/default`, затем отправляет
настоящий chat-запрос через прокси `/api/chat/completions` Open WebUI.
Установите `OPENWEBUI_SMOKE_MODE=models` для CI-проверок release-пути, которые должны останавливаться
после входа в Open WebUI и обнаружения модели, не ожидая завершения live-модели.
Первый запуск может быть заметно медленнее, потому что Docker может потребоваться загрузить
образ Open WebUI, а Open WebUI может потребоваться завершить собственную настройку cold-start.
Эта дорожка ожидает пригодный live-ключ модели. Предоставьте его через окружение процесса,
подготовленные профили авторизации или явный `OPENCLAW_PROFILE_FILE`.
Успешные запуски выводят небольшой JSON payload вроде `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` намеренно детерминирован и не требует настоящей учетной записи
Telegram, Discord или iMessage. Он загружает seeded-контейнер Gateway,
запускает второй контейнер, который порождает `openclaw mcp serve`, затем
проверяет маршрутизированное обнаружение бесед, чтение транскриптов, метаданные вложений,
поведение очереди live-событий, маршрутизацию исходящей отправки, а также уведомления каналов +
разрешений в стиле Claude через настоящий stdio MCP bridge. Проверка уведомлений
напрямую инспектирует raw stdio MCP frames, поэтому smoke-тест валидирует то, что
bridge фактически испускает, а не только то, что случайно показывает конкретный client SDK.
`test:docker:agent-bundle-mcp-tools` детерминирован и не требует live-ключа
модели. Он собирает Docker-образ репозитория, запускает настоящий stdio MCP probe server
внутри контейнера, материализует этот сервер через embedded OpenClaw bundle
MCP runtime, выполняет инструмент, затем проверяет, что `coding` и `messaging` сохраняют
инструменты `bundle-mcp`, а `minimal` и `tools.deny: ["bundle-mcp"]` их фильтруют.
`test:docker:cron-mcp-cleanup` детерминирован и не требует live-ключа модели.
Он запускает seeded Gateway с настоящим stdio MCP probe server, выполняет
изолированный cron turn и одноразовый дочерний turn `sessions_spawn`, затем проверяет,
что дочерний процесс MCP завершается после каждого запуска.

Ручной ACP plain-language thread smoke-тест (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Сохраняйте этот скрипт для workflows регрессии/отладки. Он может снова понадобиться для проверки маршрутизации ACP thread, поэтому не удаляйте его.

Полезные переменные окружения:

- `OPENCLAW_CONFIG_DIR=...` (по умолчанию: `~/.openclaw`) монтируется в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (по умолчанию: `~/.openclaw/workspace`) монтируется в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` монтируется и загружается перед запуском тестов
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, чтобы проверить только переменные окружения, загруженные из `OPENCLAW_PROFILE_FILE`, используя временные каталоги конфигурации/рабочей области и без внешних монтирований авторизации CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (по умолчанию: `~/.cache/openclaw/docker-cli-tools`) монтируется в `/home/node/.npm-global` для кэшированных установок CLI внутри Docker
- Внешние каталоги/файлы авторизации CLI в `$HOME` монтируются в режиме только для чтения в `/host-auth...`, затем копируются в `/home/node/...` перед запуском тестов
  - Каталоги по умолчанию: `.minimax`
  - Файлы по умолчанию: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Суженные запуски провайдеров монтируют только нужные каталоги/файлы, выведенные из `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Переопределите вручную с помощью `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` или списка через запятую, например `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, чтобы сузить запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, чтобы фильтровать провайдеров внутри контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, чтобы повторно использовать существующий образ `openclaw:local-live` для повторных запусков, которым не нужна пересборка
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы убедиться, что учетные данные поступают из хранилища профилей (а не из окружения)
- `OPENCLAW_OPENWEBUI_MODEL=...`, чтобы выбрать модель, предоставляемую Gateway для smoke-теста Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, чтобы переопределить prompt проверки nonce, используемый smoke-тестом Open WebUI
- `OPENWEBUI_IMAGE=...`, чтобы переопределить закрепленный тег образа Open WebUI

## Проверка документации

Запускайте проверки документации после правок документации: `pnpm check:docs`.
Запускайте полную проверку anchors Mintlify, когда также нужны проверки внутристраничных заголовков: `pnpm docs:check-links:anchors`.

## Offline-регрессия (безопасно для CI)

Это регрессии "настоящего pipeline" без настоящих провайдеров:

- Tool calling Gateway (mock OpenAI, настоящий Gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Мастер Gateway (WS `wizard.start`/`wizard.next`, запись config + принудительная auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Evals надежности агента (skills)

У нас уже есть несколько CI-безопасных тестов, которые ведут себя как "evals надежности агента":

- Mock tool-calling через настоящий Gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end workflows мастера, которые валидируют привязку сессии и эффекты config (`src/gateway/gateway.test.ts`).

Чего все еще не хватает для Skills (см. [Skills](/ru/tools/skills)):

- **Принятие решений:** когда Skills перечислены в prompt, выбирает ли агент правильный skill (или избегает нерелевантных)?
- **Соблюдение требований:** читает ли агент `SKILL.md` перед использованием и следует ли обязательным шагам/аргументам?
- **Контракты workflow:** многоходовые сценарии, которые проверяют порядок инструментов, перенос истории сессии и границы sandbox.

Будущие evals сначала должны оставаться детерминированными:

- Scenario runner с mock-провайдерами для проверки tool calls + порядка, чтения файлов skill и привязки сессии.
- Небольшой набор сценариев, сфокусированных на skills (использовать или избегать, gating, prompt injection).
- Необязательные live evals (opt-in, gated env) только после того, как будет готов CI-безопасный набор.

## Contract tests (форма Plugin и канала)

Contract tests проверяют, что каждый зарегистрированный Plugin и канал соответствует своему
контракту интерфейса. Они проходят по всем обнаруженным Plugin и запускают набор
проверок формы и поведения. Дорожка unit по умолчанию `pnpm test` намеренно
пропускает эти общие seam- и smoke-файлы; запускайте contract-команды явно,
когда затрагиваете общие поверхности каналов или провайдеров.

### Команды

- Все contracts: `pnpm test:contracts`
- Только channel contracts: `pnpm test:contracts:channels`
- Только provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Расположены в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базовая форма Plugin (id, name, capabilities)
- **setup** - Контракт мастера настройки
- **session-binding** - Поведение привязки сессии
- **outbound-payload** - Структура payload сообщения
- **inbound** - Обработка входящих сообщений
- **actions** - Обработчики действий канала
- **threading** - Обработка ID thread
- **directory** - API directory/roster
- **group-policy** - Применение групповой политики

### Provider status contracts

Расположены в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Пробы статуса канала
- **registry** - Форма реестра Plugin

### Provider contracts

Расположены в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт auth flow
- **auth-choice** - Выбор/селекция auth
- **catalog** - API каталога моделей
- **discovery** - Обнаружение Plugin
- **loader** - Загрузка Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/интерфейс Plugin
- **wizard** - Мастер настройки

### Когда запускать

- После изменения экспортов или subpaths plugin-sdk
- После добавления или изменения канала либо provider Plugin
- После рефакторинга регистрации или обнаружения Plugin

Contract tests запускаются в CI и не требуют настоящих API-ключей.

## Добавление регрессий (рекомендации)

Когда вы исправляете проблему провайдера/модели, обнаруженную в live:

- Добавьте CI-безопасную регрессию, если возможно (mock/stub provider или захват точного преобразования формы запроса)
- Если это по сути только live-сценарий (rate limits, политики auth), держите live-тест узким и opt-in через переменные окружения
- Предпочитайте нацеливаться на самый маленький слой, который ловит баг:
  - баг преобразования/повтора запроса провайдера → прямой тест моделей
  - баг pipeline Gateway session/history/tool → Gateway live smoke или CI-безопасный mock-тест Gateway
- Guardrail обхода SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` выводит одну sampled target для каждого класса SecretRef из метаданных реестра (`listSecretTargetRegistryEntries()`), затем проверяет, что exec ids с traversal-сегментами отклоняются.
  - Если вы добавляете новое target family SecretRef с `includeInPlan` в `src/secrets/target-registry-data.ts`, обновите `classifyTargetClass` в этом тесте. Тест намеренно падает на неклассифицированных target ids, чтобы новые классы нельзя было молча пропустить.

## Связанное

- [Тестирование live](/ru/help/testing-live)
- [Тестирование обновлений и plugins](/ru/help/testing-updates-plugins)
- [CI](/ru/ci)
