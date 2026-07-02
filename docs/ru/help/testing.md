---
read_when:
    - Запуск тестов локально или в CI
    - Добавление регрессионных тестов для ошибок моделей/провайдеров
    - Отладка поведения Gateway и агента
summary: 'Набор для тестирования: модульные, e2e и live-наборы, Docker-раннеры и что покрывает каждый тест'
title: Тестирование
x-i18n:
    generated_at: "2026-07-02T08:36:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

В OpenClaw есть три набора тестов Vitest (unit/integration, e2e, live) и небольшой набор
Docker-раннеров. Этот документ — руководство «как мы тестируем»:

- Что покрывает каждый набор (и что он намеренно _не_ покрывает).
- Какие команды запускать для типичных рабочих процессов (локально, перед push, при отладке).
- Как live-тесты находят учетные данные и выбирают модели/провайдеров.
- Как добавлять регрессионные тесты для реальных проблем моделей/провайдеров.

<Note>
**QA-стек (`qa-lab`, `qa-channel`, live transport lanes)** документирован отдельно:

- [Обзор QA](/ru/concepts/qa-e2e-automation) - архитектура, поверхность команд, авторинг сценариев.
- [Matrix QA](/ru/concepts/qa-matrix) - справочник для `pnpm openclaw qa matrix`.
- [Оценочная карта зрелости](/ru/maturity/scorecard) - как свидетельства release QA поддерживают решения о стабильности и LTS.
- [QA-канал](/ru/channels/qa-channel) - синтетический транспортный Plugin, используемый сценариями из репозитория.

Эта страница описывает запуск обычных наборов тестов и Docker/Parallels-раннеров. Раздел про QA-специфичные раннеры ниже ([QA-специфичные раннеры](#qa-specific-runners)) перечисляет конкретные вызовы `qa` и ссылается обратно на приведенные выше материалы.
</Note>

## Быстрый старт

В большинстве случаев:

- Полная проверка (ожидается перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Более быстрый локальный запуск всего набора на машине с запасом ресурсов: `pnpm test:max`
- Прямой цикл наблюдения Vitest: `pnpm test:watch`
- Прямое указание файла теперь также маршрутизирует пути расширений/каналов: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- При работе над одной ошибкой сначала предпочитайте целевые запуски.
- QA-сайт на базе Docker: `pnpm qa:lab:up`
- QA-lane на базе Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Когда вы меняете тесты или хотите дополнительной уверенности:

- Проверка покрытия: `pnpm test:coverage`
- Набор E2E: `pnpm test:e2e`

## Временные каталоги тестов

Предпочитайте общие вспомогательные функции из `test/helpers/temp-dir.ts` для временных каталогов,
принадлежащих тестам. Они делают владение явным и оставляют очистку в том же
жизненном цикле теста:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` намеренно не предоставляет ручной метод очистки; Vitest
владеет очисткой после каждого теста. Существующие низкоуровневые вспомогательные функции остаются для тестов,
которые еще не были перенесены, но новые и мигрированные тесты должны использовать
трекер с автоматической очисткой. Избегайте нового использования ручных `makeTempDir`, `cleanupTempDirs` или
`createTempDirTracker`, а также новых прямых вызовов `fs.mkdtemp*` в тестах,
если конкретный случай явно не проверяет сырое поведение временного каталога. Добавляйте проверяемый
разрешающий комментарий с конкретной причиной, когда тесту намеренно нужен прямой временный
каталог:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Для видимости миграции `node scripts/report-test-temp-creations.mjs` сообщает о
новом прямом создании временных каталогов и новом ручном использовании общих вспомогательных функций в добавленных строках diff,
не блокируя существующие стили очистки. Его область файлов намеренно
следует той же классификации тестовых путей, которую использует `scripts/changed-lanes.mjs`,
вместо поддержки отдельной эвристики имен файлов test-helper, при этом пропуская
саму реализацию общей вспомогательной функции. `check:changed` запускает этот отчет для
измененных тестовых путей как предупреждающий сигнал CI; находки являются предупреждающими
аннотациями GitHub, а не ошибками.

При отладке реальных провайдеров/моделей (требуются реальные учетные данные):

- Live-набор (модели + Gateway tool/image-зонды): `pnpm test:live`
- Целевой тихий запуск одного live-файла: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Отчеты о производительности рантайма: отправьте `OpenClaw Performance` с
  `live_openai_candidate=true` для реального turn агента `openai/gpt-5.5` или
  `deep_profile=true` для артефактов CPU/heap/trace Kova. Ежедневные запланированные запуски
  публикуют артефакты lane для mock-provider, deep-profile и GPT 5.5 в
  `openclaw/clawgrit-reports`, когда настроен `CLAWGRIT_REPORTS_TOKEN`. Отчет
  mock-provider также включает числа по запуску Gateway на уровне исходного кода, памяти,
  нагрузке Plugin, повторяющемуся hello-loop fake-model и старту CLI.
- Docker live-проверка моделей: `pnpm test:docker:live-models`
  - Каждая выбранная модель теперь выполняет текстовый turn плюс небольшой зонд в стиле чтения файла.
    Модели, чьи метаданные объявляют вход `image`, также выполняют крошечный image turn.
    Отключайте дополнительные зонды через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` или
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` при изоляции отказов провайдера.
  - Покрытие CI: ежедневные `OpenClaw Scheduled Live And E2E Checks` и ручные
    `OpenClaw Release Checks` оба вызывают переиспользуемый workflow live/E2E с
    `include_live_suites: true`, что включает отдельные Docker live model
    matrix-задачи, разделенные по провайдеру.
  - Для сфокусированных повторных запусков CI отправьте `OpenClaw Live And E2E Checks (Reusable)`
    с `include_live_suites: true` и `live_models_only: true`.
  - Добавляйте новые высокосигнальные секреты провайдеров в `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` и его
    запланированные/release вызывающие workflow.
- Нативный smoke-тест Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Запускает Docker live lane против пути app-server Codex, привязывает синтетический
    Slack DM через `/codex bind`, выполняет `/codex fast` и
    `/codex permissions`, затем проверяет обычный ответ и маршрут вложения изображения
    через нативную привязку Plugin вместо ACP.
- Smoke-тест app-server harness Codex: `pnpm test:docker:live-codex-harness`
  - Запускает turn агента Gateway через принадлежащий Plugin app-server harness Codex,
    проверяет `/codex status` и `/codex models`, а по умолчанию выполняет зонды image,
    cron MCP, sub-agent и Guardian. Отключайте зонд sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` при изоляции других отказов
    app-server Codex. Для сфокусированной проверки sub-agent отключите остальные зонды:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Это завершает работу после зонда sub-agent, если не установлен
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke-тест установки Codex по требованию: `pnpm test:docker:codex-on-demand`
  - Устанавливает упакованный tarball OpenClaw в Docker, запускает onboarding с OpenAI API-key
    и проверяет, что Plugin Codex и зависимость `@openai/codex`
    были по требованию загружены в корень управляемого npm-проекта.
- Smoke-тест live-зависимости инструмента Plugin: `pnpm test:docker:live-plugin-tool`
  - Упаковывает fixture Plugin с реальной зависимостью `slugify`, устанавливает его через
    `npm-pack:`, проверяет зависимость под корнем управляемого npm-проекта,
    затем просит live-модель OpenAI вызвать инструмент Plugin и вернуть скрытый
    slug.
- Smoke-тест команды спасения Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in проверка belt-and-suspenders для поверхности команды спасения message-channel.
    Она выполняет `/crestodian status`, ставит в очередь постоянное изменение модели,
    отвечает `/crestodian yes` и проверяет путь записи audit/config.
- Docker smoke-тест планировщика Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускает Crestodian в контейнере без конфигурации с фейковым Claude CLI в `PATH`
    и проверяет, что fuzzy planner fallback переводится в аудированную типизированную
    запись конфигурации.
- Docker smoke-тест первого запуска Crestodian: `pnpm test:docker:crestodian-first-run`
  - Начинает с пустого каталога состояния OpenClaw, проверяет современную onboard-точку входа
    Crestodian, применяет записи setup/model/agent/Discord Plugin + SecretRef,
    валидирует конфигурацию и проверяет audit-записи. Тот же путь настройки Ring 0
    также покрыт в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke-тест стоимости Moonshot/Kimi: с установленным `MOONSHOT_API_KEY` выполните
  `openclaw models list --provider moonshot --json`, затем выполните изолированный
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  против `moonshot/kimi-k2.6`. Проверьте, что JSON сообщает Moonshot/K2.6, а
  transcript ассистента сохраняет нормализованный `usage.cost`.

<Tip>
Когда нужен только один падающий случай, предпочитайте сужать live-тесты с помощью allowlist env vars, описанных ниже.
</Tip>

## QA-специфичные раннеры

Эти команды находятся рядом с основными наборами тестов, когда нужен реализм QA-lab:

CI запускает QA Lab в выделенных workflow. Agentic parity вложен под
`QA-Lab - All Lanes` и release validation, а не является отдельным PR workflow.
Для широкой валидации следует использовать `Full Release Validation` с
`rerun_group=qa-parity` или QA-группу release-checks. Стабильные/default release
checks держат исчерпывающий live/Docker soak за `run_release_soak=true`; профиль
`full` принудительно включает soak. `QA-Lab - All Lanes`
запускается каждую ночь на `main` и из ручного dispatch с mock parity lane, live
Matrix lane, Convex-managed live Telegram lane и Convex-managed live Discord
lane как параллельными задачами. Запланированный QA и release checks передают Matrix
`--profile fast` явно, тогда как Matrix CLI и вход ручного workflow
по умолчанию остаются `all`; ручной dispatch может разделить `all` на задачи
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` и `e2ee-cli`. `OpenClaw Release
Checks` запускает parity плюс быстрые Matrix и Telegram lanes перед release
approval, используя `mock-openai/gpt-5.5` для release transport checks, чтобы они оставались
детерминированными и избегали обычного запуска provider-plugin. Эти live transport
gateways отключают memory search; поведение памяти остается покрытым наборами
QA parity.

Full release live media shards используют
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, где уже есть
`ffmpeg` и `ffprobe`. Docker live model/backend shards используют общий образ
`ghcr.io/openclaw/openclaw-live-test:<sha>`, собранный один раз для выбранного
коммита, затем получают его с `OPENCLAW_SKIP_DOCKER_BUILD=1` вместо пересборки
внутри каждого shard.

- `pnpm openclaw qa suite`
  - Запускает сценарии QA из репозитория напрямую на хосте.
  - Записывает артефакты верхнего уровня `qa-evidence.json`, `qa-suite-summary.json` и
    `qa-suite-report.md` для выбранного набора сценариев, включая
    выборки смешанных потоков, сценариев Vitest и Playwright.
  - При запуске через `pnpm openclaw qa run --qa-profile <profile>` встраивает
    скоркард выбранного профиля таксономии в тот же `qa-evidence.json`.
    `smoke-ci` записывает облегченные доказательства, задает `evidenceMode: "slim"` и пропускает
    `execution` для каждой записи. `release` покрывает курируемый срез готовности к релизу;
    `all` выбирает все активные категории зрелости и предназначен для явных запусков рабочего процесса
    Profile Evidence, когда нужен полный артефакт скоркарда.
  - По умолчанию запускает несколько выбранных сценариев параллельно с изолированными
    рабочими процессами Gateway. Для `qa-channel` по умолчанию используется параллелизм 4 (ограниченный
    числом выбранных сценариев). Используйте `--concurrency <count>`, чтобы настроить число
    рабочих процессов, или `--concurrency 1` для старого последовательного прохода.
  - Завершается с ненулевым кодом, если любой сценарий завершается с ошибкой. Используйте `--allow-failures`, когда
    вам нужны артефакты без аварийного кода выхода.
  - Поддерживает режимы провайдера `live-frontier`, `mock-openai` и `aimock`.
    `aimock` запускает локальный сервер провайдера на базе AIMock для экспериментального
    покрытия фикстур и моков протокола, не заменяя ориентированный на сценарии
    проход `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Ищет по идентификаторам сценариев, заголовкам, поверхностям, идентификаторам покрытия, ссылкам на документацию, ссылкам на код,
    plugins и требованиям провайдеров, затем выводит совпадающие цели набора.
  - Используйте это перед запуском QA Lab, когда вам известно затронутое поведение или путь к файлу,
    но неизвестен минимальный сценарий. Это только рекомендация; все равно выбирайте мок,
    live, Multipass, Matrix или доказательство транспорта исходя из изменяемого поведения.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускает live-набор испытаний plugin OpenAI Kitchen Sink через QA Lab. Он
    устанавливает внешний пакет Kitchen Sink, проверяет инвентарь поверхности plugin SDK,
    проверяет `/healthz` и `/readyz`, записывает доказательства CPU/RSS
    Gateway, выполняет live-ход OpenAI и проверяет состязательную диагностику.
    Требует live-аутентификации OpenAI, например `OPENAI_API_KEY`. В гидратированных сессиях Testbox
    он автоматически подгружает live-auth профиль Testbox, когда присутствует помощник
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускает бенчмарк запуска Gateway плюс небольшой пакет мок-сценариев QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) и записывает объединенную сводку наблюдений CPU
    в `.artifacts/gateway-cpu-scenarios/`.
  - По умолчанию помечает только устойчивые наблюдения высокой загрузки CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), поэтому короткие всплески при запуске записываются как метрики
    и не выглядят как регрессия с многоминутной полной загрузкой Gateway.
  - Использует собранные артефакты `dist`; сначала выполните сборку, если в checkout еще нет
    свежего runtime-вывода.
- `pnpm openclaw qa suite --runner multipass`
  - Запускает тот же набор QA внутри одноразовой Linux-VM Multipass.
  - Сохраняет то же поведение выбора сценариев, что и `qa suite` на хосте.
  - Переиспользует те же флаги выбора провайдера/модели, что и `qa suite`.
  - Live-запуски передают поддерживаемые входные данные QA auth, практичные для гостя:
    ключи провайдеров на основе env, путь к live-конфигу провайдера QA и `CODEX_HOME`,
    когда он присутствует.
  - Каталоги вывода должны оставаться внутри корня репозитория, чтобы гость мог записывать обратно через
    смонтированное рабочее пространство.
  - Записывает обычный отчет QA + сводку, а также журналы Multipass в
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускает Docker-сайт QA для QA-работы в операторском стиле.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Собирает npm-тарбол из текущего checkout, устанавливает его глобально в
    Docker, выполняет неинтерактивный onboarding с API-ключом OpenAI, по умолчанию настраивает Telegram,
    проверяет, что упакованный runtime plugin загружается без исправления зависимостей при запуске,
    запускает doctor и выполняет один локальный ход агента против
    мокированного endpoint OpenAI.
  - Используйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, чтобы запустить тот же проход packaged-install
    с Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускает детерминированный Docker-smoke собранного приложения для встроенных transcript runtime-контекста.
    Он проверяет, что скрытый runtime-контекст OpenClaw сохраняется как
    непоказываемое custom message вместо утечки в видимый ход пользователя,
    затем подготавливает затронутый сломанный JSONL сессии и проверяет, что
    `openclaw doctor --fix` переписывает его в активную ветку с резервной копией.
- `pnpm test:docker:npm-telegram-live`
  - Устанавливает пакет-кандидат OpenClaw в Docker, выполняет onboarding установленного пакета,
    настраивает Telegram через установленный CLI, затем переиспользует
    live-проход Telegram QA с этим установленным пакетом как SUT Gateway.
  - Обертка монтирует из checkout только исходники harness `qa-lab`; установленный пакет
    владеет `dist`, `openclaw/plugin-sdk` и runtime bundled plugin,
    поэтому проход не смешивает plugins из текущего checkout с тестируемым пакетом.
  - По умолчанию используется `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` или
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, чтобы тестировать разрешенный локальный тарбол вместо
    установки из registry.
  - По умолчанию выводит повторяющиеся замеры времени RTT в `qa-evidence.json` с
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Переопределите
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` или
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, чтобы настроить RTT-запуск.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` принимает разделенный запятыми список
    идентификаторов проверок Telegram QA для выборки; если он не задан, проверка по умолчанию,
    поддерживающая RTT, — `telegram-mentioned-message-reply`.
  - Использует те же env-учетные данные Telegram или источник учетных данных Convex, что и
    `pnpm openclaw qa telegram`. Для автоматизации CI/релизов задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` и секрет роли. Если
    `OPENCLAW_QA_CONVEX_SITE_URL` и секрет роли Convex присутствуют в CI,
    Docker-обертка выбирает Convex автоматически.
  - Обертка проверяет env учетных данных Telegram или Convex на хосте перед
    работой Docker build/install. Устанавливайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    только при намеренной отладке настройки до учетных данных.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` переопределяет общий
    `OPENCLAW_QA_CREDENTIAL_ROLE` только для этого прохода. Когда выбраны учетные данные Convex
    и роль не задана, обертка использует `ci` в CI и
    `maintainer` вне CI.
  - GitHub Actions предоставляет этот проход как ручной maintainer workflow
    `NPM Telegram Beta E2E`. Он не запускается при merge. Workflow использует
    окружение `qa-live-shared` и аренды учетных данных Convex CI.
- GitHub Actions также предоставляет `Package Acceptance` для дополнительного продуктового доказательства
  по одному пакету-кандидату. Он принимает доверенный ref, опубликованную npm spec,
  HTTPS URL тарбола плюс SHA-256 или artifact тарбола из другого запуска, загружает
  нормализованный `openclaw-current.tgz` как `package-under-test`, затем запускает
  существующий планировщик Docker E2E с профилями проходов smoke, package, product, full или custom.
  Задайте `telegram_mode=mock-openai` или `live-frontier`, чтобы запустить
  workflow Telegram QA с тем же artifact `package-under-test`.
  - Последнее beta продуктовое доказательство:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказательство точного URL тарбола требует digest и использует политику безопасности публичных URL:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private зеркала тарболов используют явную политику trusted-source:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` читает `.github/package-trusted-sources.json` из доверенного ref workflow и не принимает учетные данные URL или обход private-network через вход workflow. Если именованная политика объявляет bearer auth, настройте фиксированный секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Artifact-доказательство скачивает artifact тарбола из другого запуска Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Упаковывает и устанавливает текущую сборку OpenClaw в Docker, запускает Gateway
    с настроенным OpenAI, затем включает bundled channel/plugins через правки config.
  - Проверяет, что discovery при настройке оставляет ненастроенные скачиваемые plugins отсутствующими,
    первое настроенное исправление doctor явно устанавливает каждый отсутствующий скачиваемый
    plugin, а второй перезапуск не выполняет скрытое исправление зависимостей.
  - Также устанавливает известный старый npm baseline, включает Telegram перед запуском
    `openclaw update --tag <candidate>` и проверяет, что post-update doctor кандидата
    очищает legacy-мусор зависимостей plugin без postinstall-исправления со стороны harness.
- `pnpm test:parallels:npm-update`
  - Запускает native smoke обновления packaged-install на гостях Parallels. Каждая
    выбранная платформа сначала устанавливает запрошенный baseline-пакет, затем запускает
    установленную команду `openclaw update` в том же госте и проверяет
    установленную версию, статус обновления, готовность Gateway и один локальный ход агента.
  - Используйте `--platform macos`, `--platform windows` или `--platform linux` при
    итерациях на одном госте. Используйте `--json` для пути к artifact сводки и
    статуса по каждому проходу.
  - Проход OpenAI по умолчанию использует `openai/gpt-5.5` для live-доказательства хода агента.
    Передайте `--model <provider/model>` или задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, когда намеренно проверяете другую
    модель OpenAI.
  - Оборачивайте долгие локальные запуски в host timeout, чтобы зависания транспорта Parallels не
    поглотили оставшееся окно тестирования:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записывает вложенные журналы проходов в `/tmp/openclaw-parallels-npm-update.*`.
    Изучите `windows-update.log`, `macos-update.log` или `linux-update.log`,
    прежде чем считать внешнюю обертку зависшей.
  - Обновление Windows может проводить 10–15 минут в post-update doctor и работе по
    обновлению пакета на холодном госте; это все еще штатно, когда вложенный debug-журнал npm
    продвигается.
  - Не запускайте эту агрегирующую обертку параллельно с отдельными smoke-проходами Parallels
    macOS, Windows или Linux. Они разделяют состояние VM и могут конфликтовать при
    восстановлении snapshot, раздаче пакетов или состоянии guest Gateway.
  - Post-update доказательство запускает обычную поверхность bundled plugin, потому что
    capability facades, такие как speech, image generation и media
    understanding, загружаются через bundled runtime APIs, даже когда сам ход агента
    проверяет только простой текстовый ответ.

- `pnpm openclaw qa aimock`
  - Запускает только локальный сервер провайдера AIMock для прямого smoke-тестирования протокола.
- `pnpm openclaw qa matrix`
  - Запускает live-линию QA Matrix против одноразового homeserver Tuwunel на базе Docker. Только для source-checkout — пакетные установки не поставляют `qa-lab`.
  - Полный CLI, каталог профилей/сценариев, переменные окружения и структура артефактов: [QA Matrix](/ru/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускает live-линию QA Telegram против реальной приватной группы, используя токены driver и SUT-бота из окружения.
  - Требует `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` и `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Идентификатор группы должен быть числовым идентификатором чата Telegram.
  - Поддерживает `--credential-source convex` для общих pooled-учетных данных. По умолчанию используйте режим env или задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, чтобы включить pooled-аренды.
  - Настройки по умолчанию покрывают canary, mention gating, адресацию команд, `/status`, упомянутые ответы bot-to-bot и ответы core native command. Настройки `mock-openai` по умолчанию также покрывают детерминированные регрессии цепочки ответов и потоковой передачи финального сообщения Telegram. Используйте `--list-scenarios` для опциональных проверок, таких как `session_status`.
  - Завершается с ненулевым кодом, если любой сценарий завершается ошибкой. Используйте `--allow-failures`, когда нужны артефакты без кода завершения с ошибкой.
  - Требует двух разных ботов в одной приватной группе, при этом SUT-бот должен иметь Telegram-имя пользователя.
  - Для стабильного наблюдения bot-to-bot включите режим Bot-to-Bot Communication Mode в `@BotFather` для обоих ботов и убедитесь, что driver-бот может наблюдать групповой трафик ботов.
  - Записывает отчет QA Telegram, сводку и `qa-evidence.json` в `.artifacts/qa-e2e/...`. Сценарии с ответами включают RTT от запроса отправки driver до наблюдаемого ответа SUT.

`Mantis Telegram Live` — это обертка PR-доказательств вокруг этой линии. Она запускает
candidate ref с Telegram-учетными данными, арендованными через Convex, отображает отредактированный QA
отчет/пакет доказательств в браузере рабочего стола Crabbox, записывает MP4-доказательство,
генерирует GIF с обрезкой по движению, загружает пакет артефактов и публикует inline PR
доказательства через Mantis GitHub App, когда задан `pr_number`. Мейнтейнеры могут
запустить ее из Actions UI через `Mantis Scenario` (`scenario_id:
telegram-live`) или напрямую из комментария к pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` — это агентная native-обертка Telegram Desktop
before/after для визуального доказательства PR. Запустите ее из Actions UI с
произвольными `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) или из комментария PR:

```text
@openclaw-mantis telegram desktop proof
```

Агент Mantis читает PR, решает, какое видимое в Telegram поведение доказывает
изменение, запускает линию real-user Crabbox Telegram Desktop proof на baseline и
candidate refs, повторяет итерации, пока native GIF-файлы не станут полезными, пишет парный
манифест `motionPreview` и публикует ту же 2-колоночную GIF-таблицу через
Mantis GitHub App, когда задан `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Арендует или переиспользует рабочий стол Linux Crabbox, устанавливает native Telegram Desktop, настраивает OpenClaw с арендованным токеном Telegram SUT-бота, запускает gateway и записывает screenshot/MP4-доказательства с видимого рабочего стола VNC.
  - По умолчанию использует `--credential-source convex`, поэтому workflow нужны только секреты брокера Convex. Используйте `--credential-source env` с теми же переменными `OPENCLAW_QA_TELEGRAM_*`, что и `pnpm openclaw qa telegram`.
  - Telegram Desktop все еще требует входа/профиля пользователя. Токен бота настраивает только OpenClaw. Используйте `--telegram-profile-archive-env <name>` для base64-архива профиля `.tgz` или используйте `--keep-lease` и один раз войдите вручную через VNC.
  - Записывает `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` и `telegram-desktop-builder.mp4` в выходной каталог.

Live transport lanes используют один стандартный контракт, чтобы новые транспорты не расходились; матрица покрытия по линиям находится в [обзоре QA → Покрытие live-транспортов](/ru/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — это широкий синтетический набор и не является частью этой матрицы.

### Общие учетные данные Telegram через Convex (v1)

Когда `--credential-source convex` (или `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) включен для
QA live-транспорта, QA lab получает эксклюзивную аренду из пула на базе Convex, отправляет Heartbeat для этой
аренды, пока линия выполняется, и освобождает аренду при завершении работы. Название раздела появилось до
поддержки Discord, Slack и WhatsApp; контракт аренды общий для разных типов.

Эталонный scaffold проекта Convex:

- `qa/convex-credential-broker/`

Обязательные переменные окружения:

- `OPENCLAW_QA_CONVEX_SITE_URL` (например, `https://your-deployment.convex.site`)
- Один секрет для выбранной роли:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Выбор роли учетных данных:
  - CLI: `--credential-role maintainer|ci`
  - Значение env по умолчанию: `OPENCLAW_QA_CREDENTIAL_ROLE` (по умолчанию `ci` в CI, иначе `maintainer`)

Опциональные переменные окружения:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (по умолчанию `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (по умолчанию `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (по умолчанию `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (по умолчанию `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (по умолчанию `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (опциональный trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` разрешает loopback URL Convex `http://` только для локальной разработки.

`OPENCLAW_QA_CONVEX_SITE_URL` должен использовать `https://` при штатной работе.

Административные команды мейнтейнера (pool add/remove/list) требуют именно
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелперы для мейнтейнеров:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Используйте `doctor` перед live-запусками, чтобы проверить URL сайта Convex, секреты брокера,
префикс endpoint, HTTP-таймаут и доступность admin/list без вывода
значений секретов. Используйте `--json` для машиночитаемого вывода в скриптах и CI
утилитах.

Контракт endpoint по умолчанию (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запрос: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успех: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Исчерпано/доступно для повтора: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Успех: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успех: `{ status: "ok" }` (или пустой `2xx`)
- `POST /release`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успех: `{ status: "ok" }` (или пустой `2xx`)
- `POST /admin/add` (только секрет мейнтейнера)
  - Запрос: `{ kind, actorId, payload, note?, status? }`
  - Успех: `{ status: "ok", credential }`
- `POST /admin/remove` (только секрет мейнтейнера)
  - Запрос: `{ credentialId, actorId }`
  - Успех: `{ status: "ok", changed, credential }`
  - Защита активной аренды: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (только секрет мейнтейнера)
  - Запрос: `{ kind?, status?, includePayload?, limit? }`
  - Успех: `{ status: "ok", credentials, count }`

Форма payload для типа Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` должен быть строкой с числовым идентификатором чата Telegram.
- `admin/add` проверяет эту форму для `kind: "telegram"` и отклоняет некорректные payload.

Форма payload для типа Telegram real-user:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` и `telegramApiId` должны быть числовыми строками.
- `tdlibArchiveSha256` и `desktopTdataArchiveSha256` должны быть SHA-256 hex-строками.
- `kind: "telegram-user"` зарезервирован для workflow Mantis Telegram Desktop proof. Обычные линии QA Lab не должны получать его.

Проверяемые брокером multi-channel payload:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Линии Slack также могут арендовать данные из пула, но валидация payload Slack сейчас
живет в runner QA Slack, а не в брокере. Используйте
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
для строк Slack.

### Добавление канала в QA

Архитектура и имена scenario-helper для новых адаптеров каналов находятся в [обзоре QA → Добавление канала](/ru/concepts/qa-e2e-automation#adding-a-channel). Минимальная планка: реализовать transport runner на общей host seam `qa-lab`, объявить `qaRunners` в манифесте Plugin, смонтировать как `openclaw qa <runner>` и написать сценарии в `qa/scenarios/`.

## Наборы тестов (что где запускается)

Думайте о наборах как о «возрастающей реалистичности» (и растущей нестабильности/стоимости):

### Unit / integration (по умолчанию)

- Команда: `pnpm test`
- Config: нецелевые запуски используют набор shards `vitest.full-*.config.ts` и могут разворачивать multi-project shards в конфиги по проектам для параллельного планирования
- Файлы: инвентари core/unit в `src/**/*.test.ts`, `packages/**/*.test.ts` и `test/**/*.test.ts`; unit-тесты UI запускаются в выделенном shard `unit-ui`
- Scope:
  - Чистые unit-тесты
  - In-process integration-тесты (Gateway auth, routing, tooling, parsing, config)
  - Детерминированные регрессии известных ошибок
- Ожидания:
  - Запускается в CI
  - Реальные ключи не требуются
  - Должен быть быстрым и стабильным
  - Тесты resolver и public-surface loader должны доказывать широкое fallback-поведение `api.js` и
    `runtime-api.js` с сгенерированными tiny plugin fixtures, а не
    реальными API исходного кода bundled plugin. Реальные загрузки API Plugin относятся к
    contract/integration-наборам, которыми владеет Plugin.

Политика native-зависимостей:

- Установки тестов по умолчанию пропускают optional native Discord opus builds. Discord voice использует bundled `libopus-wasm`, а `@discordjs/opus` остается отключенным в `allowBuilds`, чтобы локальные тесты и линии Testbox не компилировали native addon.
- Сравнивайте производительность native opus в benchmark-репозитории `libopus-wasm`, а не в стандартных циклах установки/тестирования OpenClaw. Не устанавливайте `@discordjs/opus` в `true` в default `allowBuilds`; это заставляет несвязанные циклы install/test компилировать native code.

<AccordionGroup>
  <Accordion title="Проекты, shards и scoped lanes">

    - Нецелевой запуск `pnpm test` выполняет двенадцать меньших конфигураций шардов (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) вместо одного огромного нативного процесса корневого проекта. Это снижает пиковое RSS на загруженных машинах и не дает задачам auto-reply/расширений лишать ресурсов несвязанные наборы тестов.
    - `pnpm test --watch` по-прежнему использует нативный граф проектов корневого `vitest.config.ts`, потому что цикл наблюдения с несколькими шардами непрактичен.
    - `pnpm test`, `pnpm test:watch` и `pnpm test:perf:imports` сначала направляют явные цели файлов/каталогов через область действия соответствующих дорожек, поэтому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` избегает полной цены запуска корневого проекта.
    - `pnpm test:changed` по умолчанию разворачивает измененные пути git в дешевые дорожки с ограниченной областью: прямые изменения тестов, соседние файлы `*.test.ts`, явные сопоставления исходников и локальные зависимые элементы графа импортов. Изменения конфигурации/настройки/пакетов не запускают широкий прогон тестов, если явно не использовать `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — обычный умный локальный контрольный рубеж для узких изменений. Он классифицирует diff на core, тесты core, расширения, тесты расширений, приложения, документацию, метаданные релиза, live-инструменты Docker и tooling, затем запускает соответствующие команды typecheck, lint и guard. Он не запускает тесты Vitest; для доказательства тестами вызывайте `pnpm test:changed` или явный `pnpm test <target>`. Изменения только версий в метаданных релиза запускают целевые проверки версий/конфигурации/корневых зависимостей с guard, который отклоняет изменения пакетов за пределами поля версии верхнего уровня.
    - Изменения live Docker ACP harness запускают сфокусированные проверки: синтаксис shell для live Docker auth-скриптов и пробный прогон планировщика live Docker. Изменения `package.json` включаются только когда diff ограничен `scripts["test:docker:live-*"]`; изменения зависимостей, экспортов, версий и другой поверхности пакета по-прежнему используют более широкие guards.
    - Легкие по импортам unit-тесты из agents, commands, plugins, auto-reply helpers, `plugin-sdk` и похожих областей чистых утилит направляются через дорожку `unit-fast`, которая пропускает `test/setup-openclaw-runtime.ts`; файлы с состоянием или тяжелой runtime-логикой остаются на существующих дорожках.
    - Выбранные исходные файлы helpers из `plugin-sdk` и `commands` также сопоставляют прогоны changed-mode с явными соседними тестами в этих легких дорожках, поэтому изменения helpers не перезапускают весь тяжелый набор для этого каталога.
    - `auto-reply` имеет отдельные buckets для helpers верхнего уровня core, интеграционных тестов верхнего уровня `reply.*` и поддерева `src/auto-reply/reply/**`. CI дополнительно разделяет поддерево reply на шарды agent-runner, dispatch и commands/state-routing, чтобы один тяжелый по импортам bucket не владел всем хвостом Node.
    - Обычный CI для PR/main намеренно пропускает пакетный sweep расширений и релизный шард `agentic-plugins`. Полная валидация релиза запускает отдельный дочерний workflow `Plugin Prerelease` для этих тяжелых по Plugin/расширениям наборов на release candidates.

  </Accordion>

  <Accordion title="Покрытие встроенного runner">

    - Когда вы меняете входные данные обнаружения message-tool или runtime-контекст
      compaction, сохраняйте оба уровня покрытия.
    - Добавляйте сфокусированные регрессии helpers для границ чистой маршрутизации и
      нормализации.
    - Поддерживайте работоспособность интеграционных наборов встроенного runner:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` и
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Эти наборы проверяют, что scoped ids и поведение compaction по-прежнему проходят
      через реальные пути `run.ts` / `compact.ts`; тесты только для helpers
      не являются достаточной заменой этим интеграционным путям.

  </Accordion>

  <Accordion title="Пул Vitest и значения изоляции по умолчанию">

    - Базовая конфигурация Vitest по умолчанию использует `threads`.
    - Общая конфигурация Vitest фиксирует `isolate: false` и использует
      неизолированный runner во всех корневых проектах, e2e и live-конфигурациях.
    - Корневая UI-дорожка сохраняет свою настройку `jsdom` и optimizer, но тоже
      работает на общем неизолированном runner.
    - Каждый шард `pnpm test` наследует те же значения по умолчанию `threads` + `isolate: false`
      из общей конфигурации Vitest.
    - `scripts/run-vitest.mjs` по умолчанию добавляет `--no-maglev` для дочерних
      процессов Node Vitest, чтобы снизить churn компиляции V8 во время больших локальных прогонов.
      Установите `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, чтобы сравнить со стандартным
      поведением V8.
    - `scripts/run-vitest.mjs` завершает явные не-watch прогоны Vitest после
      5 минут без вывода stdout или stderr. Установите
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, чтобы отключить watchdog для
      намеренно тихого исследования.

  </Accordion>

  <Accordion title="Быстрая локальная итерация">

    - `pnpm changed:lanes` показывает, какие архитектурные дорожки вызывает diff.
    - pre-commit hook занимается только форматированием. Он заново добавляет отформатированные файлы в индекс и
      не запускает lint, typecheck или тесты.
    - Явно запускайте `pnpm check:changed` перед передачей работы или push, когда вам
      нужен умный локальный контрольный рубеж.
    - `pnpm test:changed` по умолчанию маршрутизируется через дешевые дорожки с ограниченной областью. Используйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только когда агент
      решает, что изменение harness, конфигурации, пакета или контракта действительно требует более широкого
      покрытия Vitest.
    - `pnpm test:max` и `pnpm test:changed:max` сохраняют то же поведение
      маршрутизации, просто с более высоким лимитом workers.
    - Локальное автомасштабирование workers намеренно консервативно и снижает нагрузку,
      когда средняя нагрузка хоста уже высокая, поэтому несколько одновременных
      прогонов Vitest по умолчанию наносят меньше ущерба.
    - Базовая конфигурация Vitest помечает проекты/конфигурационные файлы как
      `forceRerunTriggers`, чтобы rerun в changed-mode оставался корректным при изменении
      тестовой проводки.
    - Конфигурация оставляет `OPENCLAW_VITEST_FS_MODULE_CACHE` включенным на поддерживаемых
      хостах; установите `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, если хотите
      одно явное расположение кеша для прямого профилирования.

  </Accordion>

  <Accordion title="Отладка производительности">

    - `pnpm test:perf:imports` включает отчет Vitest о длительности импортов плюс
      вывод import-breakdown.
    - `pnpm test:perf:imports:changed` ограничивает тот же вид профилирования
      файлами, измененными с `origin/main`.
    - Данные времени шардов записываются в `.artifacts/vitest-shard-timings.json`.
      Прогоны всей конфигурации используют путь конфигурации как ключ; CI-шарды
      include-pattern добавляют имя шарда, чтобы отфильтрованные шарды можно было отслеживать
      отдельно.
    - Когда один горячий тест по-прежнему тратит большую часть времени на стартовые импорты,
      держите тяжелые зависимости за узким локальным швом `*.runtime.ts` и
      мокайте этот шов напрямую вместо deep-import runtime helpers только
      для передачи их через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` сравнивает маршрутизированный
      `test:changed` с нативным путем корневого проекта для этого закоммиченного
      diff и печатает wall time плюс максимальное RSS в macOS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркует текущее
      грязное дерево, направляя список измененных файлов через
      `scripts/test-projects.mjs` и корневую конфигурацию Vitest.
    - `pnpm test:perf:profile:main` записывает CPU-профиль main-thread для
      накладных расходов запуска Vitest/Vite и transform.
    - `pnpm test:perf:profile:runner` записывает CPU+heap-профили runner для
      unit-набора с отключенным файловым параллелизмом.

  </Accordion>
</AccordionGroup>

### Стабильность (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфигурация: `vitest.gateway.config.ts`, принудительно один worker
- Область:
  - Запускает настоящий loopback Gateway с диагностикой, включенной по умолчанию
  - Прогоняет синтетический churn сообщений gateway, памяти и больших payload через путь диагностических событий
  - Запрашивает `diagnostics.stability` через Gateway WS RPC
  - Покрывает helpers сохранения диагностического stability bundle
  - Проверяет, что recorder остается ограниченным, синтетические RSS samples остаются ниже pressure budget, а глубины per-session очередей снова опускаются до нуля
- Ожидания:
  - Безопасно для CI и не требует ключей
  - Узкая дорожка для последующей работы над регрессиями стабильности, а не замена полного набора Gateway

### E2E (агрегат repo)

- Команда: `pnpm test:e2e`
- Область:
  - Запускает gateway smoke E2E-дорожку
  - Запускает mocked Control UI browser E2E-дорожку
- Ожидания:
  - Безопасно для CI и не требует ключей
  - Требует установленный Playwright Chromium

### E2E (gateway smoke)

- Команда: `pnpm test:e2e:gateway`
- Конфигурация: `vitest.e2e.config.ts`
- Файлы: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` и E2E-тесты bundled-plugin в `extensions/`
- Runtime defaults:
  - Использует Vitest `threads` с `isolate: false`, как и остальная часть repo.
  - Использует adaptive workers (CI: до 2, локально: по умолчанию 1).
  - По умолчанию работает в silent mode, чтобы снизить накладные расходы консольного I/O.
- Полезные переопределения:
  - `OPENCLAW_E2E_WORKERS=<n>` для принудительного числа workers (ограничено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного включения подробного консольного вывода.
- Область:
  - Сквозное поведение Gateway с несколькими экземплярами
  - Поверхности WebSocket/HTTP, pairing node и более тяжелая сетевая часть
- Ожидания:
  - Запускается в CI (когда включено в pipeline)
  - Реальные ключи не требуются
  - Больше движущихся частей, чем в unit-тестах (может быть медленнее)

### E2E (mocked browser Control UI)

- Команда: `pnpm test:ui:e2e`
- Конфигурация: `test/vitest/vitest.ui-e2e.config.ts`
- Файлы: `ui/src/**/*.e2e.test.ts`
- Область:
  - Запускает Vite Control UI
  - Управляет настоящей страницей Chromium через Playwright
  - Заменяет Gateway WebSocket детерминированными in-browser mocks
- Ожидания:
  - Запускается в CI как часть `pnpm test:e2e`
  - Реальные Gateway, агенты или provider keys не требуются
  - Browser dependency должна присутствовать (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Повторно использует активный локальный OpenShell gateway
  - Создает sandbox из временного локального Dockerfile
  - Проверяет OpenShell backend OpenClaw через реальные `sandbox ssh-config` + SSH exec
  - Проверяет поведение remote-canonical filesystem через sandbox fs bridge
- Ожидания:
  - Только opt-in; не входит в стандартный прогон `pnpm test:e2e`
  - Требует локальный CLI `openshell` плюс рабочий Docker daemon
  - Требует активный локальный OpenShell gateway и его источник конфигурации
  - Использует изолированные `HOME` / `XDG_CONFIG_HOME`, затем уничтожает тестовый sandbox
- Полезные переопределения:
  - `OPENCLAW_E2E_OPENSHELL=1` для включения теста при ручном запуске более широкого e2e-набора
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для указания нестандартного CLI binary или wrapper script
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` для предоставления зарегистрированной конфигурации gateway изолированному тесту
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` для переопределения Docker gateway IP, используемого host policy fixture

### Live (реальные providers + реальные models)

- Команда: `pnpm test:live`
- Конфигурация: `vitest.live.config.ts`
- Файлы: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` и live-тесты встроенных Plugin в `extensions/`
- По умолчанию: **включено** через `pnpm test:live` (задает `OPENCLAW_LIVE_TEST=1`)
- Область:
  - "Этот провайдер/модель действительно работает _сегодня_ с реальными учетными данными?"
  - Выявлять изменения формата провайдера, особенности вызова инструментов, проблемы аутентификации и поведение при лимитах частоты запросов
- Ожидания:
  - По замыслу не стабильно для CI (реальные сети, реальные политики провайдеров, квоты, сбои)
  - Стоит денег / использует лимиты частоты запросов
  - Предпочтительно запускать суженные подмножества, а не "все"
- Live-запуски используют уже экспортированные API-ключи и подготовленные профили аутентификации.
- По умолчанию live-запуски все еще изолируют `HOME` и копируют конфигурацию/материалы аутентификации во временный тестовый домашний каталог, чтобы unit-фикстуры не могли изменить ваш реальный `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` только когда вам намеренно нужно, чтобы live-тесты использовали ваш реальный домашний каталог.
- `pnpm test:live` по умолчанию работает в более тихом режиме: он сохраняет вывод прогресса `[live] ...` и приглушает bootstrap-логи gateway/сообщения Bonjour. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, если хотите вернуть полные стартовые логи.
- Ротация API-ключей (зависит от провайдера): задайте `*_API_KEYS` в формате с запятыми/точками с запятой или `*_API_KEY_1`, `*_API_KEY_2` (например, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) либо переопределение для конкретного live-запуска через `OPENCLAW_LIVE_*_KEY`; тесты повторяют попытки при ответах о лимите частоты запросов.
- Вывод прогресса/Heartbeat:
  - Live-наборы теперь выводят строки прогресса в stderr, чтобы долгие вызовы провайдеров были видимо активны, даже когда захват консоли Vitest работает тихо.
  - `vitest.live.config.ts` отключает перехват консоли Vitest, поэтому строки прогресса провайдера/gateway сразу передаются потоком во время live-запусков.
  - Настраивайте Heartbeat прямых моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Настраивайте Heartbeat gateway/проб через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Какой набор запускать?

Используйте эту таблицу решений:

- Редактирование логики/тестов: запускайте `pnpm test` (и `pnpm test:coverage`, если вы изменили многое)
- Изменение сетевого взаимодействия gateway / протокола WS / сопряжения: добавьте `pnpm test:e2e`
- Отладка "мой бот недоступен" / сбоев, зависящих от провайдера / вызова инструментов: запускайте суженный `pnpm test:live`

## Live-тесты (затрагивающие сеть)

О live-матрице моделей, smoke-тестах CLI-бэкенда, smoke-тестах ACP, harness сервера приложения Codex и всех live-тестах медиапровайдеров (Deepgram, BytePlus, ComfyUI, изображения, музыка, видео, media harness), а также об обработке учетных данных для live-запусков см. [Тестирование live-наборов](/ru/help/testing-live). Специальный чеклист для обновлений и проверки Plugin см. в [Тестирование обновлений и Plugin](/ru/help/testing-updates-plugins).

## Docker-раннеры (необязательные проверки "работает в Linux")

Эти Docker-раннеры делятся на две группы:

- Раннеры live-моделей: `test:docker:live-models` и `test:docker:live-gateway` запускают только соответствующий live-файл с ключами профилей внутри Docker-образа репозитория (`src/agents/models.profiles.live.test.ts` и `src/gateway/gateway-models.profiles.live.test.ts`), монтируя ваш локальный каталог конфигурации, рабочую область и необязательный env-файл профиля. Соответствующие локальные точки входа: `test:live:models-profiles` и `test:live:gateway-profiles`.
- Docker live-раннеры при необходимости сохраняют собственные практические ограничения:
  `test:docker:live-models` по умолчанию использует отобранный поддерживаемый набор с высоким сигналом, а
  `test:docker:live-gateway` по умолчанию использует `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` и
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Задайте `OPENCLAW_LIVE_MAX_MODELS`
  или env-переменные gateway, когда явно нужен меньший предел или более широкий скан.
- `test:docker:all` один раз собирает live Docker-образ через `test:docker:live-build`, один раз упаковывает OpenClaw как npm-tarball через `scripts/package-openclaw-for-docker.mjs`, затем собирает/переиспользует два образа `scripts/e2e/Dockerfile`. Базовый образ - это только Node/Git-раннер для направлений install/update/plugin-dependency; эти направления монтируют предварительно собранный tarball. Функциональный образ устанавливает тот же tarball в `/app` для направлений функциональности собранного приложения. Определения Docker-направлений находятся в `scripts/lib/docker-e2e-scenarios.mjs`; логика планировщика находится в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` выполняет выбранный план. Агрегатор использует взвешенный локальный планировщик: `OPENCLAW_DOCKER_ALL_PARALLELISM` управляет слотами процессов, а ограничения ресурсов не дают тяжелым live-, npm-install- и multi-service-направлениям стартовать всем одновременно. Если одно направление тяжелее активных ограничений, планировщик все равно может запустить его, когда пул пуст, а затем держит его единственным запущенным, пока снова не появится доступная емкость. Значения по умолчанию: 10 слотов, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` и `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; настраивайте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` или `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` только когда Docker-хост имеет больший запас ресурсов. Раннер по умолчанию выполняет preflight Docker, удаляет устаревшие OpenClaw E2E-контейнеры, печатает статус каждые 30 секунд, сохраняет тайминги успешных направлений в `.artifacts/docker-tests/lane-timings.json` и использует эти тайминги, чтобы в последующих запусках начинать с более долгих направлений. Используйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, чтобы вывести взвешенный манифест направлений без сборки или запуска Docker, либо `node scripts/test-docker-all.mjs --plan-json`, чтобы вывести CI-план для выбранных направлений, потребностей в пакете/образе и учетных данных.
- `Package Acceptance` - это нативный для GitHub пакетный gate для проверки "работает ли этот устанавливаемый tarball как продукт?" Он определяет один кандидатный пакет из `source=npm`, `source=ref`, `source=url` или `source=artifact`, загружает его как `package-under-test`, затем запускает переиспользуемые Docker E2E-направления против именно этого tarball вместо повторной упаковки выбранного ref. Профили упорядочены по широте охвата: `smoke`, `package`, `product` и `full`. См. [Тестирование обновлений и Plugin](/ru/help/testing-updates-plugins) для контракта пакетов/обновлений/Plugin, матрицы выживания опубликованных обновлений, релизных значений по умолчанию и разбора сбоев.
- Проверки сборки и релиза запускают `scripts/check-cli-bootstrap-imports.mjs` после tsdown. Защита проходит по статическому собранному графу от `dist/entry.js` и `dist/cli/run-main.js` и падает, если стартовые импорты до dispatch команды подтягивают зависимости пакетов, такие как Commander, prompt UI, undici или логирование, до dispatch команды; она также удерживает встроенный gateway run chunk в рамках бюджета и отклоняет статические импорты известных холодных путей gateway. Smoke-тест упакованного CLI также покрывает корневую справку, справку onboard, справку doctor, статус, схему config и команду списка моделей.
- Устаревшая совместимость Package Acceptance ограничена `2026.4.25` (включая `2026.4.25-beta.*`). До этого порога harness допускает только пробелы метаданных отгруженного пакета: пропущенные приватные записи QA inventory, отсутствующий `gateway install --wrapper`, отсутствующие patch-файлы в git-фикстуре, полученной из tarball, отсутствующий сохраненный `update.channel`, устаревшие расположения install-record для Plugin, отсутствующее сохранение install-record marketplace и миграцию метаданных config во время `plugins update`. Для пакетов после `2026.4.25` эти пути являются строгими сбоями.
- Раннеры container smoke: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` и `test:docker:config-reload` запускают один или несколько реальных контейнеров и проверяют интеграционные пути более высокого уровня.
- Docker/Bash E2E-направления, которые устанавливают упакованный tarball OpenClaw через `scripts/lib/openclaw-e2e-instance.sh`, ограничивают `npm install` значением `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (по умолчанию `600s`; задайте `0`, чтобы отключить wrapper для отладки).

Docker-раннеры live-моделей также bind-монтируют только нужные домашние каталоги аутентификации CLI (или все поддерживаемые, когда запуск не сужен), затем копируют их в домашний каталог контейнера перед запуском, чтобы OAuth внешнего CLI мог обновлять токены без изменения хранилища аутентификации хоста:

- Прямые модели: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; по умолчанию покрывает Claude, Codex и Gemini, со строгим покрытием Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` и `pnpm test:docker:live-acp-bind:opencode`)
- Smoke CLI-бэкенда: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness сервера приложения Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-тесты наблюдаемости: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` и `pnpm qa:observability:smoke` - это приватные QA-направления для source-checkout. Они намеренно не входят в пакетные Docker-направления релиза, потому что npm-tarball не включает QA Lab.
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Мастер onboarding (TTY, полное scaffold-создание): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent для npm-tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально устанавливает упакованный tarball OpenClaw в Docker, настраивает OpenAI через onboarding с env-ref и по умолчанию Telegram, запускает doctor и выполняет один mocked OpenAI agent turn. Переиспользуйте предварительно собранный tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустите пересборку на хосте через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` или переключите канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` или `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Релизная дымовая проверка пользовательского сценария: `pnpm test:docker:release-user-journey` глобально устанавливает упакованный tarball OpenClaw в чистый домашний каталог Docker, запускает первичную настройку, настраивает имитированный провайдер OpenAI, выполняет ход агента, устанавливает и удаляет внешние плагины, настраивает ClickClack для локальной фикстуры, проверяет исходящие и входящие сообщения, перезапускает Gateway и запускает doctor.
- Релизная дымовая проверка типизированной первичной настройки: `pnpm test:docker:release-typed-onboarding` устанавливает упакованный tarball, проводит `openclaw onboard` через настоящий TTY, настраивает OpenAI как провайдер со ссылкой на переменную окружения, проверяет, что исходный ключ не сохраняется, и запускает имитированный ход агента.
- Релизная дымовая проверка медиа/памяти: `pnpm test:docker:release-media-memory` устанавливает упакованный tarball, проверяет понимание изображения из вложения PNG, вывод генерации изображений, совместимый с OpenAI, припоминание через поиск в памяти и сохранение припоминания после перезапуска Gateway.
- Релизная дымовая проверка пользовательского сценария обновления: `pnpm test:docker:release-upgrade-user-journey` по умолчанию устанавливает новейшую опубликованную базовую версию, более старую, чем кандидатный tarball, настраивает состояние провайдера/плагина/ClickClack на опубликованном пакете, обновляет его до кандидатного tarball, затем повторно запускает основной сценарий агента/плагина/канала. Если более старой опубликованной базовой версии нет, повторно используется кандидатная версия. Переопределите базовую версию через `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Релизная дымовая проверка marketplace плагинов: `pnpm test:docker:release-plugin-marketplace` устанавливает из локального marketplace-фикстуры, обновляет установленный плагин, удаляет его и проверяет, что CLI плагина исчезает, а метаданные установки очищены.
- Дымовая проверка установки Skills: `pnpm test:docker:skill-install` глобально устанавливает упакованный tarball OpenClaw в Docker, отключает установку загруженных архивов в конфигурации, получает текущий live slug Skills из ClawHub через поиск, устанавливает его с помощью `openclaw skills install` и проверяет установленный Skills вместе с метаданными источника/блокировки `.clawhub`.
- Дымовая проверка переключения канала обновлений: `pnpm test:docker:update-channel-switch` глобально устанавливает упакованный tarball OpenClaw в Docker, переключается с пакетного `stable` на git `dev`, проверяет сохраненный канал и работу плагина после обновления, затем переключается обратно на пакетный `stable` и проверяет статус обновления.
- Дымовая проверка выживания после обновления: `pnpm test:docker:upgrade-survivor` устанавливает упакованный tarball OpenClaw поверх грязной фикстуры старого пользователя с агентами, конфигурацией каналов, allowlist плагинов, устаревшим состоянием зависимостей плагинов и существующими файлами workspace/session. Она запускает обновление пакета и неинтерактивный doctor без live-ключей провайдера или канала, затем запускает loopback Gateway и проверяет сохранение конфигурации/состояния, а также бюджеты запуска/статуса.
- Дымовая проверка выживания после обновления опубликованной версии: `pnpm test:docker:published-upgrade-survivor` по умолчанию устанавливает `openclaw@latest`, подготавливает реалистичные файлы существующего пользователя, настраивает эту базовую версию встроенным рецептом команд, проверяет итоговую конфигурацию, обновляет опубликованную установку до кандидатного tarball, запускает неинтерактивный doctor, записывает `.artifacts/upgrade-survivor/summary.json`, затем запускает loopback Gateway и проверяет настроенные намерения, сохранение состояния, запуск, `/healthz`, `/readyz` и бюджеты статуса RPC. Переопределите одну базовую версию через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросите агрегирующий планировщик развернуть точные локальные базовые версии через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, например `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, и развернуть фикстуры в форме issues через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, например `reported-issues`; набор reported-issues включает `configured-plugin-installs` для автоматического ремонта установки внешнего плагина OpenClaw. Package Acceptance предоставляет их как `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` и `published_upgrade_survivor_scenarios`, разрешает метатокены базовых версий, такие как `last-stable-4` или `all-since-2026.4.23`, а Full Release Validation расширяет пакетный gate релизного soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Дымовая проверка runtime-контекста сессии: `pnpm test:docker:session-runtime-context` проверяет сохранение скрытого runtime-контекста transcript и ремонт doctor для затронутых дублирующихся веток prompt-rewrite.
- Дымовая проверка глобальной установки Bun: `bash scripts/e2e/bun-global-install-smoke.sh` упаковывает текущее дерево, устанавливает его через `bun install -g` в изолированный домашний каталог и проверяет, что `openclaw infer image providers --json` возвращает встроенных провайдеров изображений вместо зависания. Повторно используйте заранее собранный tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустите сборку на хосте через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` или скопируйте `dist/` из собранного Docker-образа через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Дымовая проверка установщика в Docker: `bash scripts/test-install-sh-docker.sh` использует один общий npm-кэш для своих root-, update- и direct-npm-контейнеров. Дымовая проверка обновления по умолчанию берет npm `latest` как стабильную базовую версию перед обновлением до кандидатного tarball. Переопределите локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` или через вход `update_baseline_version` workflow Install Smoke на GitHub. Проверки установщика без root используют изолированный npm-кэш, чтобы записи кэша, принадлежащие root, не маскировали поведение локальной пользовательской установки. Установите `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, чтобы повторно использовать кэш root/update/direct-npm между локальными повторными запусками.
- CI Install Smoke пропускает дублирующее глобальное обновление direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без этой переменной окружения, когда нужно покрытие прямого `npm install -g`.
- Дымовая проверка CLI удаления агентами общего workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) по умолчанию собирает образ корневого Dockerfile, подготавливает двух агентов с одним workspace в изолированном домашнем каталоге контейнера, запускает `agents delete --json` и проверяет валидный JSON, а также поведение сохраненного workspace. Повторно используйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Сеть Gateway (два контейнера, аутентификация WS + здоровье): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Дымовая проверка снимков Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) собирает исходный E2E-образ плюс слой Chromium, запускает Chromium с raw CDP, выполняет `browser doctor --deep` и проверяет, что снимки ролей CDP покрывают URL ссылок, кликабельные элементы, повышенные из cursor, ссылки iframe и метаданные frame.
- Регрессия OpenAI Responses web_search с минимальным reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускает имитированный сервер OpenAI через Gateway, проверяет, что `web_search` повышает `reasoning.effort` с `minimal` до `low`, затем принудительно вызывает отклонение схемы провайдера и проверяет, что исходная деталь появляется в журналах Gateway.
- Мост канала MCP (заполненный Gateway + stdio-мост + дымовая проверка raw notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-инструменты набора OpenClaw (настоящий stdio MCP-сервер + дымовая проверка allow/deny встроенного профиля OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (скрипт: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Очистка MCP для Cron/subagent (настоящий Gateway + teardown stdio MCP child после изолированных запусков cron и одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Плагины (дымовая проверка установки/обновления для локального пути, `file:`, npm registry с hoisted-зависимостями, malformed метаданных npm-пакета, git moving refs, ClawHub kitchen-sink, обновлений marketplace и включения/инспекции Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установите `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, чтобы пропустить блок ClawHub, или переопределите пару package/runtime по умолчанию для kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` и `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест использует герметичный локальный сервер фикстуры ClawHub.
- Дымовая проверка неизмененного обновления плагина: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Дымовая проверка матрицы жизненного цикла плагина: `pnpm test:docker:plugin-lifecycle-matrix` устанавливает упакованный tarball OpenClaw в пустой контейнер, устанавливает npm-плагин, переключает включение/отключение, обновляет и откатывает его через локальный npm registry, удаляет установленный код, затем проверяет, что uninstall все еще удаляет устаревшее состояние, одновременно записывая метрики RSS/CPU для каждой фазы жизненного цикла.
- Дымовая проверка метаданных перезагрузки конфигурации: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Плагины: `pnpm test:docker:plugins` покрывает дымовую проверку установки/обновления для локального пути, `file:`, npm registry с hoisted-зависимостями, git moving refs, фикстур ClawHub, обновлений marketplace и включения/инспекции Claude-bundle. `pnpm test:docker:plugin-update` покрывает поведение неизмененного обновления для установленных плагинов. `pnpm test:docker:plugin-lifecycle-matrix` покрывает отслеживаемые по ресурсам установку npm-плагина, включение, отключение, обновление, откат и удаление при отсутствующем коде.

Чтобы вручную предварительно собрать и повторно использовать общий функциональный образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Переопределения образов для конкретных наборов, такие как `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, все равно имеют приоритет, когда заданы. Когда `OPENCLAW_SKIP_DOCKER_BUILD=1` указывает на удаленный общий образ, скрипты скачивают его, если он еще не локальный. Docker-тесты QR и установщика сохраняют собственные Dockerfile, потому что они проверяют поведение пакета/установки, а не общий runtime собранного приложения.

Средства выполнения Docker для live-моделей также монтируют текущий checkout в режиме только для чтения и
подготавливают его во временном рабочем каталоге внутри контейнера. Это сохраняет runtime-образ
компактным, при этом Vitest запускается именно на вашем локальном исходном коде/конфигурации.
Шаг подготовки пропускает крупные локальные кэши и выходные артефакты сборки приложений, такие как
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а также локальные для приложения каталоги `.build` или
выходные каталоги Gradle, чтобы live-запуски Docker не тратили минуты на копирование
артефактов, зависящих от конкретной машины.
Они также задают `OPENCLAW_SKIP_CHANNELS=1`, чтобы live-проверки gateway не запускали
реальные рабочие процессы каналов Telegram/Discord/и т. д. внутри контейнера.
`test:docker:live-models` по-прежнему запускает `pnpm test:live`, поэтому также передавайте
`OPENCLAW_LIVE_GATEWAY_*`, когда нужно сузить или исключить live-покрытие gateway
из этой Docker-линии.
`test:docker:openwebui` — это более высокоуровневая проверка совместимости: она запускает
контейнер Gateway OpenClaw с включенными HTTP-эндпоинтами, совместимыми с OpenAI,
запускает закрепленный контейнер Open WebUI против этого gateway, выполняет вход через
Open WebUI, проверяет, что `/api/models` предоставляет `openclaw/default`, затем отправляет
реальный chat-запрос через прокси `/api/chat/completions` Open WebUI.
Задайте `OPENWEBUI_SMOKE_MODE=models` для CI-проверок релизного пути, которые должны останавливаться
после входа в Open WebUI и обнаружения моделей, не ожидая завершения live-модели.
Первый запуск может быть заметно медленнее, потому что Docker может понадобиться загрузить
образ Open WebUI, а Open WebUI может понадобиться завершить собственную настройку холодного старта.
Эта линия ожидает пригодный ключ live-модели. Передайте его через окружение процесса,
подготовленные профили авторизации или явный `OPENCLAW_PROFILE_FILE`.
Успешные запуски печатают небольшой JSON payload вроде `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` намеренно детерминирован и не требует реальной
учетной записи Telegram, Discord или iMessage. Он загружает контейнер Gateway с начальными данными,
запускает второй контейнер, который порождает `openclaw mcp serve`, затем
проверяет маршрутизированное обнаружение разговоров, чтение transcript, метаданные вложений,
поведение очереди live-событий, маршрутизацию исходящей отправки и уведомления каналов +
разрешений в стиле Claude через реальный stdio MCP bridge. Проверка уведомлений
инспектирует сырые stdio MCP frames напрямую, чтобы smoke-проверка подтверждала то, что
bridge действительно испускает, а не только то, что случайно показывает конкретный клиентский SDK.
`test:docker:agent-bundle-mcp-tools` детерминирован и не требует ключа live-модели.
Он собирает Docker-образ репозитория, запускает реальный stdio MCP probe server
внутри контейнера, материализует этот сервер через встроенный bundle
MCP runtime OpenClaw, выполняет tool, затем проверяет, что `coding` и `messaging` сохраняют
tools `bundle-mcp`, а `minimal` и `tools.deny: ["bundle-mcp"]` их фильтруют.
`test:docker:cron-mcp-cleanup` детерминирован и не требует ключа live-модели.
Он запускает Gateway с начальными данными и реальным stdio MCP probe server, выполняет
изолированный cron turn и одноразовый дочерний turn `sessions_spawn`, затем проверяет,
что дочерний процесс MCP завершается после каждого запуска.

Ручная smoke-проверка ACP plain-language thread (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Сохраните этот скрипт для regression/debug workflow. Он может снова понадобиться для проверки маршрутизации ACP thread, поэтому не удаляйте его.

Полезные env vars:

- `OPENCLAW_CONFIG_DIR=...` (по умолчанию: `~/.openclaw`) монтируется в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (по умолчанию: `~/.openclaw/workspace`) монтируется в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` монтируется и подгружается перед запуском тестов
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, чтобы проверить только env vars, подгруженные из `OPENCLAW_PROFILE_FILE`, с временными каталогами config/workspace и без внешних CLI-монтирований auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (по умолчанию: `~/.cache/openclaw/docker-cli-tools`) монтируется в `/home/node/.npm-global` для кэшированных установок CLI внутри Docker
- Внешние каталоги/файлы auth для CLI под `$HOME` монтируются в режиме только для чтения под `/host-auth...`, затем копируются в `/home/node/...` перед запуском тестов
  - Каталоги по умолчанию: `.minimax`
  - Файлы по умолчанию: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Суженные запуски провайдеров монтируют только нужные каталоги/файлы, выведенные из `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Переопределите вручную с помощью `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` или списка через запятую вроде `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, чтобы сузить запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, чтобы фильтровать провайдеров внутри контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, чтобы повторно использовать существующий образ `openclaw:local-live` для повторных запусков, которым не нужна пересборка
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы гарантировать, что credentials берутся из хранилища профилей (а не из env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, чтобы выбрать модель, предоставляемую gateway для smoke-проверки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, чтобы переопределить prompt проверки nonce, используемый smoke-проверкой Open WebUI
- `OPENWEBUI_IMAGE=...`, чтобы переопределить закрепленный tag образа Open WebUI

## Проверка документации

Запускайте проверки документации после правок docs: `pnpm check:docs`.
Запускайте полную проверку anchors Mintlify, когда также нужны проверки заголовков внутри страниц: `pnpm docs:check-links:anchors`.

## Офлайн-регрессия (безопасно для CI)

Это регрессии "real pipeline" без реальных провайдеров:

- Вызов tools через Gateway (mock OpenAI, реальный gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Мастер Gateway (WS `wizard.start`/`wizard.next`, запись config + принудительный auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Оценки надежности агента (skills)

У нас уже есть несколько CI-безопасных тестов, которые ведут себя как "agent reliability evals":

- Mock tool-calling через реальный gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, которые проверяют wiring сессии и эффекты config (`src/gateway/gateway.test.ts`).

Чего все еще не хватает для skills (см. [Skills](/ru/tools/skills)):

- **Принятие решений:** когда skills перечислены в prompt, выбирает ли агент правильный skill (или избегает нерелевантных)?
- **Соблюдение требований:** читает ли агент `SKILL.md` перед использованием и следует ли обязательным шагам/аргументам?
- **Контракты workflow:** многоходовые сценарии, которые проверяют порядок tools, перенос истории сессии и границы sandbox.

Будущие evals должны сначала оставаться детерминированными:

- Scenario runner с mock providers для проверки tool calls + order, чтения skill files и session wiring.
- Небольшой набор сценариев, сфокусированных на skills (использовать или избегать, gating, prompt injection).
- Необязательные live evals (opt-in, env-gated) только после появления CI-безопасного набора.

## Contract tests (форма plugin и channel)

Contract tests проверяют, что каждый зарегистрированный plugin и channel соответствует своему
контракту interface. Они перебирают все обнаруженные plugins и запускают набор
assertions формы и поведения. Стандартная unit-линия `pnpm test` намеренно
пропускает эти общие seam- и smoke-файлы; запускайте команды contract явно,
когда затрагиваете общие поверхности channel или provider.

### Команды

- Все contracts: `pnpm test:contracts`
- Только channel contracts: `pnpm test:contracts:channels`
- Только provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Расположены в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базовая форма plugin (id, name, capabilities)
- **setup** - Контракт мастера настройки
- **session-binding** - Поведение привязки сессии
- **outbound-payload** - Структура payload сообщения
- **inbound** - Обработка входящих сообщений
- **actions** - Обработчики действий channel
- **threading** - Обработка thread ID
- **directory** - Directory/roster API
- **group-policy** - Принудительное применение политики группы

### Provider status contracts

Расположены в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Пробы статуса channel
- **registry** - Форма registry plugin

### Provider contracts

Расположены в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт auth flow
- **auth-choice** - Выбор/selection auth
- **catalog** - API каталога моделей
- **discovery** - Обнаружение plugin
- **loader** - Загрузка plugin
- **runtime** - Provider runtime
- **shape** - Форма/interface plugin
- **wizard** - Мастер настройки

### Когда запускать

- После изменения exports или subpaths plugin-sdk
- После добавления или изменения channel или provider plugin
- После refactoring регистрации или обнаружения plugin

Contract tests запускаются в CI и не требуют реальных API keys.

## Добавление регрессий (руководство)

Когда вы исправляете проблему provider/model, обнаруженную в live:

- По возможности добавьте CI-безопасную регрессию (mock/stub provider или захват точного преобразования формы запроса)
- Если это по своей природе только live-проблема (rate limits, политики auth), оставьте live test узким и opt-in через env vars
- Предпочитайте нацеливаться на самый маленький слой, который ловит bug:
  - ошибка conversion/replay запроса provider → прямой models test
  - ошибка pipeline gateway session/history/tool → gateway live smoke или CI-безопасный gateway mock test
- Guardrail обхода SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` выводит один выбранный target для каждого класса SecretRef из registry metadata (`listSecretTargetRegistryEntries()`), затем проверяет, что exec ids с traversal-сегментами отклоняются.
  - Если вы добавляете новое семейство target `includeInPlan` SecretRef в `src/secrets/target-registry-data.ts`, обновите `classifyTargetClass` в этом тесте. Тест намеренно падает на неклассифицированных target ids, чтобы новые классы нельзя было молча пропустить.

## Связанные разделы

- [Тестирование live](/ru/help/testing-live)
- [Тестирование обновлений и plugins](/ru/help/testing-updates-plugins)
- [CI](/ru/ci)
