---
read_when:
    - Вам нужно понять, почему задание CI было или не было запущено
    - Вы отлаживаете сбой проверки GitHub Actions
    - Вы координируете запуск или повторный запуск валидации релиза
    - Вы изменяете диспетчеризацию ClawSweeper или пересылку активности GitHub
summary: Граф заданий CI, шлюзы области, зонтичные release-процессы и локальные эквиваленты команд
title: Конвейер CI
x-i18n:
    generated_at: "2026-07-02T14:07:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускается при каждом push в `main` и для каждого pull request. Канонические
push в `main` сначала проходят 90-секундное окно допуска hosted-runner.
Существующая concurrency group `CI` отменяет этот ожидающий запуск, когда появляется более новый
commit, поэтому последовательные слияния не регистрируют каждое полную матрицу Blacksmith.
Pull requests и ручные dispatch пропускают ожидание. Затем job `preflight`
классифицирует diff и отключает дорогие lanes, когда изменились только несвязанные
области. Ручные запуски `workflow_dispatch` намеренно обходят умное
scoping и разворачивают полный граф для release candidates и широкой
проверки. Android lanes остаются opt-in через `include_android`. Покрытие Plugin
только для релизов находится в отдельном workflow [`Предрелиз Plugin`](#plugin-prerelease)
и запускается только из [`Полной проверки релиза`](#full-release-validation)
или явного ручного dispatch.

## Обзор pipeline

| Job                                | Назначение                                                                                                   | Когда запускается                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `preflight`                        | Обнаруживает изменения только в docs, измененные scopes, измененные extensions и собирает CI manifest         | Всегда для non-draft push и PR                           |
| `runner-admission`                 | Hosted 90-секундный debounce для канонических push в `main` перед регистрацией работы Blacksmith              | Каждый запуск CI; sleep только для канонических push в `main` |
| `security-fast`                    | Обнаружение приватных ключей, аудит измененных workflow через `zizmor` и аудит production lockfile            | Всегда для non-draft push и PR                           |
| `check-dependencies`               | Production-проход Knip только по зависимостям плюс guard allowlist для неиспользуемых файлов                  | Изменения, относящиеся к Node                            |
| `build-artifacts`                  | Сборка `dist/`, Control UI, smoke checks собранного CLI, проверки встроенных build artifacts и reusable artifacts | Изменения, относящиеся к Node                         |
| `checks-fast-core`                 | Быстрые Linux lanes корректности, такие как bundled, protocol, QA Smoke CI и проверки CI-routing              | Изменения, относящиеся к Node                            |
| `checks-fast-contracts-plugins-*`  | Две sharded проверки контрактов Plugin                                                                        | Изменения, относящиеся к Node                            |
| `checks-fast-contracts-channels-*` | Две sharded проверки контрактов channel                                                                       | Изменения, относящиеся к Node                            |
| `checks-node-core-*`               | Shards тестов core Node, исключая channel, bundled, contract и extension lanes                                | Изменения, относящиеся к Node                            |
| `check-*`                          | Sharded эквивалент основного локального gate: prod types, lint, guards, test types и strict smoke             | Изменения, относящиеся к Node                            |
| `check-additional-*`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary и runtime topology            | Изменения, относящиеся к Node                            |
| `checks-node-compat-node22`        | Сборка совместимости Node 22 и smoke lane                                                                     | Ручной CI dispatch для релизов                           |
| `check-docs`                       | Форматирование docs, lint и проверки broken links                                                             | Изменены docs                                            |
| `skills-python`                    | Ruff + pytest для Skills на базе Python                                                                       | Изменения, относящиеся к Python Skills                   |
| `checks-windows`                   | Специфичные для Windows тесты process/path плюс общие regressions import specifier runtime                    | Изменения, относящиеся к Windows                         |
| `macos-node`                       | macOS TypeScript test lane с использованием общих build artifacts                                            | Изменения, относящиеся к macOS                           |
| `macos-swift`                      | Swift lint, build и tests для приложения macOS                                                                | Изменения, относящиеся к macOS                           |
| `ios-build`                        | Генерация проекта Xcode плюс сборка приложения iOS для simulator                                             | Изменения приложения iOS, shared app kit или Swabble     |
| `android`                          | Android unit tests для обоих flavors плюс одна сборка debug APK                                              | Изменения, относящиеся к Android                         |
| `test-performance-agent`           | Ежедневная оптимизация медленных тестов Codex после trusted activity                                         | Успех main CI или ручной dispatch                        |
| `openclaw-performance`             | Ежедневные/on-demand отчеты производительности Kova runtime с mock-provider, deep-profile и live lanes GPT 5.5 | Scheduled и manual dispatch                           |

## Порядок fail-fast

1. `runner-admission` ждет только для канонических push в `main`; более новый push отменяет запуск до регистрации Blacksmith.
2. `preflight` решает, какие lanes вообще существуют. Логика `docs-scope` и `changed-scope` является шагами внутри этого job, а не отдельными jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` и `skills-python` быстро завершаются с ошибкой, не ожидая более тяжелых artifact и platform matrix jobs.
4. `build-artifacts` выполняется параллельно с быстрыми Linux lanes, чтобы downstream consumers могли стартовать, как только общая сборка готова.
5. Более тяжелые platform и runtime lanes разворачиваются после этого: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` и `android`.

GitHub может помечать superseded jobs как `cancelled`, когда более новый push появляется в том же PR или ref `main`. Считайте это шумом CI, если самый новый запуск для того же ref не завершается с ошибкой. Matrix jobs используют `fail-fast: false`, а `build-artifacts` сообщает о сбоях embedded channel, core-support-boundary и gateway-watch напрямую, вместо того чтобы ставить в очередь маленькие verifier jobs. Автоматический ключ concurrency CI версионирован (`CI-v7-*`), поэтому zombie на стороне GitHub в старой queue group не может бесконечно блокировать более новые main runs. Ручные full-suite runs используют `CI-manual-v1-*` и не отменяют выполняющиеся runs.

Используйте `pnpm ci:timings`, `pnpm ci:timings:recent` или `node scripts/ci-run-timings.mjs <run-id>`, чтобы суммировать wall time, queue time, самые медленные jobs, failures и fanout barrier `pnpm-store-warmup` из GitHub Actions. CI также загружает тот же run summary как artifact `ci-timings-summary`. Для build timing проверьте шаг `Build dist` в job `build-artifacts`: `pnpm build:ci-artifacts` печатает `[build-all] phase timings:` и включает `ui:build`; job также загружает artifact `startup-memory`.

Для запусков pull request terminal job timing-summary запускает helper из trusted base revision перед передачей `GH_TOKEN` в `gh run view`. Это удерживает tokened query вне кода, контролируемого branch, при этом все еще суммируя текущий CI run pull request.

## Контекст PR и доказательства

PR внешних contributors запускают gate контекста PR и доказательств из
`.github/workflows/real-behavior-proof.yml`. Workflow checkout trusted
base commit и оценивает только тело PR; он не выполняет код из
branch contributor.

Gate применяется к авторам PR, которые не являются owners, members,
collaborators или bots репозитория. Он проходит, когда тело PR содержит авторские
разделы `What Problem This Solves` и `Evidence`. Доказательством может быть focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log или artifact link. Тело предоставляет intent и полезную validation;
reviewers проверяют code, tests и CI, чтобы оценить correctness.

Когда check завершается с ошибкой, обновите тело PR вместо push еще одного code commit.

## Scope и routing

Логика scope находится в `scripts/ci-changed-scope.mjs` и покрыта unit tests в `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускает changed-scope detection и заставляет preflight manifest вести себя так, будто каждая scoped area изменилась.

- **Правки CI workflow** проверяют граф Node CI плюс workflow linting, но сами по себе не форсируют Windows, iOS, Android или macOS native builds; эти platform lanes остаются scoped к изменениям platform source.
- **Workflow Sanity** запускает `actionlint`, `zizmor` по всем workflow YAML files, composite-action interpolation guard и conflict-marker guard. PR-scoped job `security-fast` также запускает `zizmor` по измененным workflow files, чтобы workflow security findings быстро падали в основном CI graph.
- **Docs при push в `main`** проверяются самостоятельным workflow `Docs` с тем же docs mirror ClawHub, который использует CI, поэтому mixed code+docs push дополнительно не ставят в очередь shard CI `check-docs`. Pull requests и ручной CI все еще запускают `check-docs` из CI, когда изменились docs.
- **TUI PTY** запускается в Linux Node shard `checks-node-core-runtime-tui-pty` для изменений TUI. Shard запускает `test/vitest/vitest.tui-pty.config.ts` с `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, поэтому он покрывает как deterministic fixture lane `TuiBackend`, так и более медленный smoke `tui --local`, который mock только внешний model endpoint.
- **Правки только CI routing, выбранные дешевые core-test fixture edits и узкие plugin contract helper/test-routing edits** используют быстрый Node-only manifest path: `preflight`, security и одну task `checks-fast-core`. Этот path пропускает build artifacts, совместимость Node 22, channel contracts, full core shards, bundled-plugin shards и дополнительные guard matrices, когда изменение ограничено routing или helper surfaces, которые fast task проверяет напрямую.
- **Windows Node checks** scoped к специфичным для Windows process/path wrappers, npm/pnpm/UI runner helpers, package manager config и CI workflow surfaces, которые выполняют этот lane; unrelated source, plugin, install-smoke и test-only changes остаются на Linux Node lanes.

Самые медленные семейства тестов Node разделены или сбалансированы так, чтобы каждая job оставалась небольшой без избыточного резервирования раннеров: контракты Plugin и контракты каналов запускаются как две взвешенные шардированные группы на Blacksmith со стандартным запасным раннером GitHub, быстрые/support lanes для core unit запускаются отдельно, core runtime infra разделена между state, process/config, shared и тремя cron-доменными шардами, auto-reply запускается как сбалансированные workers (с разделением поддерева reply на шарды agent-runner, dispatch и commands/state-routing), а agentic gateway/server configs разделены по lanes chat/auth/model/http-plugin/runtime/startup вместо ожидания собранных артефактов. Затем обычный CI упаковывает только изолированные infra-шарды с include-pattern в детерминированные bundles максимум по 64 тестовых файла, сокращая матрицу Node без объединения неизолированных command/cron, stateful agents-core или gateway/server suites; тяжелые фиксированные suites остаются на 8 vCPU, а bundled и менее тяжелые lanes используют 4 vCPU. Pull requests в каноническом репозитории используют дополнительный компактный admission plan: те же группы per-config запускаются в изолированных подпроцессах внутри текущего 34-job Linux Node plan, поэтому один PR не регистрирует полную 70-plus-job Node matrix. Пуши в `main`, manual dispatches и release gates сохраняют полную матрицу. Широкие browser, QA, media и miscellaneous plugin tests используют свои выделенные конфигурации Vitest вместо общего plugin catch-all. Шарды include-pattern записывают timing entries с использованием имени CI shard, поэтому `.artifacts/vitest-shard-timings.json` может отличить целую config от отфильтрованного shard. `check-additional-*` держит package-boundary compile/canary work вместе и отделяет runtime topology architecture от gateway watch coverage; boundary guard list распределен полосами на один prompt-heavy shard и один combined shard для оставшихся guard stripes, каждый из которых запускает выбранные независимые guards параллельно и печатает timings для каждой проверки. Дорогая проверка drift для Codex happy-path prompt snapshot запускается как отдельная additional job только для manual CI и для изменений, влияющих на prompts, поэтому обычные несвязанные изменения Node не ждут холодную генерацию prompt snapshot, а boundary shards остаются сбалансированными, при этом prompt drift все еще привязан к PR, который его вызвал; тот же флаг пропускает Vitest-генерацию prompt snapshot внутри built-artifact core support-boundary shard. Gateway watch, channel tests и core support-boundary shard запускаются параллельно внутри `build-artifacts` после того, как `dist/` и `dist-runtime/` уже собраны.

После допуска канонический Linux CI разрешает до 24 одновременных Node test jobs и
12 для меньших fast/check lanes; Windows и Android остаются на двух, потому что
эти пулы раннеров уже.

Компактный PR plan создает 18 Node jobs для текущего suite: группы whole-config
батчатся в изолированных подпроцессах с 120-минутным batch timeout,
а группы include-pattern используют тот же ограниченный job budget.

Android CI запускает и `testPlayDebugUnitTest`, и `testThirdPartyDebugUnitTest`, а затем собирает Play debug APK. У third-party flavor нет отдельного source set или manifest; его unit-test lane все равно компилирует flavor с флагами BuildConfig для SMS/call-log, избегая при этом дублирующей debug APK packaging job при каждом push, связанном с Android.

Шард `check-dependencies` запускает `pnpm deadcode:dependencies` (production Knip dependency-only pass, закрепленный на последней версии Knip, с отключенным minimum release age pnpm для установки через `dlx`) и `pnpm deadcode:unused-files`, который сравнивает production unused-file findings Knip с `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падает, когда PR добавляет новый непроверенный unused file или оставляет устаревшую allowlist entry, сохраняя при этом намеренные dynamic plugin, generated, build, live-test и package bridge surfaces, которые Knip не может разрешить статически.

## Пересылка активности ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — это мост на целевой стороне от активности репозитория OpenClaw в ClawSweeper. Он не делает checkout и не выполняет недоверенный код pull request. Workflow создает GitHub App token из `CLAWSWEEPER_APP_PRIVATE_KEY`, затем dispatches компактные payloads `repository_dispatch` в `openclaw/clawsweeper`.

У workflow четыре lanes:

- `clawsweeper_item` для точных запросов на review issue и pull request;
- `clawsweeper_comment` для явных команд ClawSweeper в комментариях issue;
- `clawsweeper_commit_review` для запросов commit-level review при pushes в `main`;
- `github_activity` для общей активности GitHub, которую агент ClawSweeper может проверить.

Lane `github_activity` пересылает только нормализованные metadata: event type, action, actor, repository, item number, URL, title, state и короткие excerpts для comments или reviews, когда они есть. Он намеренно избегает пересылки полного webhook body. Принимающий workflow в `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`, который отправляет нормализованное событие в hook OpenClaw Gateway для агента ClawSweeper.

Общая активность — это observation, а не delivery-by-default. Агент ClawSweeper получает Discord target в своем prompt и должен публиковать в `#clawsweeper` только когда событие неожиданное, actionable, рискованное или операционно полезное. Рутинные opens, edits, bot churn, duplicate webhook noise и обычный review traffic должны приводить к `NO_REPLY`.

Считайте GitHub titles, comments, bodies, review text, branch names и commit messages недоверенными данными на всем этом пути. Это входные данные для summarization и triage, а не инструкции для workflow или agent runtime.

## Manual dispatches

Manual CI dispatches запускают тот же job graph, что и обычный CI, но принудительно включают каждую non-Android scoped lane: Linux Node shards, bundled-plugin shards, plugin and channel contract shards, совместимость Node 22, `check-*`, `check-additional-*`, built-artifact smoke checks, docs checks, Python skills, Windows, macOS, iOS build и Control UI i18n. Автономные manual CI dispatches запускают Android только с `include_android=true`; полный release umbrella включает Android, передавая `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, полный extension batch sweep и plugin prerelease Docker lanes исключены из CI. Docker prerelease suite запускается только когда `Full Release Validation` dispatches отдельный workflow `Plugin Prerelease` с включенным release-validation gate.

Manual runs используют уникальную concurrency group, поэтому полный suite для release-candidate не отменяется другим push или PR run на той же ref. Необязательный input `target_ref` позволяет доверенному caller запустить этот graph для branch, tag или полного commit SHA, используя workflow file из выбранного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Раннеры

| Раннер                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manual CI dispatch и fallbacks для неканонических репозиториев, сканирования качества CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, docs workflows вне CI и install-smoke preflight, чтобы матрица Blacksmith могла раньше встать в очередь                    |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, менее тяжелые extension shards, `checks-fast-core`, plugin/channel contract shards, большинство bundled/lower-weight Linux Node shards, `check-guards`, `check-prod-types`, `check-test-types`, выбранные shards `check-additional-*` и `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Сохраненные тяжелые Linux Node suites, boundary/extension-heavy shards `check-additional-*` и `android`                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (достаточно CPU-sensitive, чтобы 8 vCPU стоили больше, чем экономили); Docker builds install-smoke (32-vCPU queue time стоило больше, чем экономило)                                                                                                |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; forks откатываются на `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` и `ios-build` на `openclaw/openclaw`; forks откатываются на `macos-26`                                                                                                                                                                                                 |

## Бюджет регистрации раннеров

Текущий bucket GitHub runner-registration в OpenClaw сообщает 10 000 self-hosted
runner registrations за 5 минут в `ghx api rate_limit`. Повторно проверяйте
`actions_runner_registration` перед каждым tuning pass, потому что GitHub может изменить
этот bucket. Лимит общий для всех регистраций раннеров Blacksmith в организации
`openclaw`, поэтому добавление еще одной установки Blacksmith не добавляет
новый bucket.

Считайте labels Blacksmith дефицитным ресурсом для burst control. Jobs, которые
только маршрутизируют, уведомляют, summarize, выбирают shards или запускают короткие CodeQL scans, должны
оставаться на GitHub-hosted runners, если у них нет измеренных Blacksmith-specific
needs. Любая новая матрица Blacksmith, больший `max-parallel` или high-frequency
workflow должны показывать свой worst-case registration count и удерживать org-level
target ниже примерно 60% live bucket. При текущем bucket в 10 000 registrations
это означает operating target в 6 000 registrations, оставляя запас для
одновременных repositories, retries и burst overlap.

CI канонического репозитория сохраняет Blacksmith как default runner path для обычных push и pull-request runs. `workflow_dispatch` и runs неканонических репозиториев используют GitHub-hosted runners, но обычные canonical runs сейчас не проверяют Blacksmith queue health и не откатываются автоматически на GitHub-hosted labels, когда Blacksmith недоступен.

## Локальные эквиваленты

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Производительность OpenClaw

`OpenClaw Performance` — это рабочий процесс производительности продукта/среды выполнения. Он запускается ежедневно на `main`, а также может запускаться вручную:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручной запуск обычно выполняет бенчмарк для ref рабочего процесса. Задайте `target_ref`, чтобы выполнить бенчмарк для тега релиза или другой ветки с текущей реализацией рабочего процесса. Пути опубликованных отчетов и указатели latest ключуются по тестируемому ref, а каждый `index.md` фиксирует тестируемые ref/SHA, ref/SHA рабочего процесса, ref Kova, профиль, режим авторизации дорожки, модель, число повторов и фильтры сценариев.

Рабочий процесс устанавливает OCM из закрепленного релиза и Kova из `openclaw/Kova` по закрепленному вводу `kova_ref`, затем запускает три дорожки:

- `mock-provider`: диагностические сценарии Kova для локально собранной среды выполнения с детерминированной фейковой OpenAI-совместимой авторизацией.
- `mock-deep-profile`: профилирование CPU/heap/trace для горячих точек запуска, Gateway и хода агента.
- `live-openai-candidate`: реальный ход агента OpenAI `openai/gpt-5.5`, пропускается, если `OPENAI_API_KEY` недоступен.

Дорожка mock-provider также запускает исходные пробы, встроенные в OpenClaw, после прохода Kova: время запуска Gateway и память для случаев запуска по умолчанию, с хуком и с 50 плагинами; RSS импорта встроенного плагина, повторяющиеся циклы приветствия mock-OpenAI `channel-chat-baseline`, команды запуска CLI против запущенного Gateway и пробу производительности smoke для состояния SQLite. Если для тестируемого ref доступен предыдущий опубликованный исходный отчет mock-provider, исходная сводка сравнивает текущие значения RSS и heap с этим базовым уровнем и помечает крупные увеличения RSS как `watch`. Markdown-сводка исходной пробы находится в `source/index.md` в пакете отчета, рядом с сырым JSON.

Каждая дорожка загружает артефакты GitHub. Когда настроен `CLAWGRIT_REPORTS_TOKEN`, рабочий процесс также коммитит `report.json`, `report.md`, пакеты, `index.md` и артефакты исходных проб в `openclaw/clawgrit-reports` по пути `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Текущий указатель тестируемого ref записывается как `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Полная проверка релиза

`Full Release Validation` — это ручной зонтичный рабочий процесс для «запустить все перед релизом». Он принимает ветку, тег или полный SHA коммита, запускает ручной рабочий процесс `CI` с этой целью, запускает `Plugin Prerelease` для доказательств, относящихся только к релизу плагинов/пакетов/статики/Docker, и запускает `OpenClaw Release Checks` для install smoke, приемки пакетов, кросс-OS проверок пакетов, рендеринга maturity scorecard из доказательств QA-профиля, паритета QA Lab, Matrix и дорожек Telegram. Стабильный и полный профили всегда включают исчерпывающее покрытие live/E2E и soak для релизного пути Docker; бета-профиль может включить его через `run_release_soak=true`. Канонический package Telegram E2E выполняется внутри Package Acceptance, поэтому полный кандидат не запускает дублирующий live poller. После публикации передайте `release_package_spec`, чтобы повторно использовать поставленный npm-пакет во всех release checks, Package Acceptance, Docker, cross-OS и Telegram без пересборки. Используйте `npm_telegram_package_spec` только для сфокусированного повторного запуска Telegram с опубликованным пакетом. Live-дорожка пакета плагина Codex по умолчанию использует то же выбранное состояние: опубликованный `release_package_spec=openclaw@<tag>` выводит `codex_plugin_spec=npm:@openclaw/codex@<tag>`, а запуски по SHA/артефакту пакуют `extensions/codex` из выбранного ref. Задайте `codex_plugin_spec` явно для пользовательских источников плагина, таких как спецификации `npm:`, `npm-pack:` или `git:`.

См. [Полная проверка релиза](/ru/reference/full-release-validation) для
матрицы стадий, точных имен задач рабочего процесса, различий профилей, артефактов и
дескрипторов сфокусированного повторного запуска.

`OpenClaw Release Publish` — это ручной мутирующий рабочий процесс релиза. Запускайте его
из `release/YYYY.M.PATCH` или `main` после существования тега релиза и после того, как
preflight OpenClaw npm успешно завершился. Он проверяет `pnpm plugins:sync:check`,
запускает `Plugin NPM Release` для всех публикуемых пакетов плагинов, запускает
`Plugin ClawHub Release` для того же SHA релиза и только затем запускает
`OpenClaw NPM Release` с сохраненным `preflight_run_id`. Стабильная публикация также
требует точный `windows_node_tag`; рабочий процесс проверяет исходный релиз Windows
и сравнивает его установщики x64/ARM64 с одобренным кандидатом вводом
`windows_node_installer_digests` перед любым дочерним publish, затем продвигает
и проверяет те же закрепленные дайджесты установщиков плюс точный сопутствующий ассет
и контракт checksum перед публикацией черновика релиза GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для доказательства закрепленного коммита на быстро меняющейся ветке используйте помощник вместо
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs запуска рабочего процесса GitHub должны быть ветками или тегами, а не сырыми SHA коммитов. Этот
помощник пушит временную ветку `release-ci/<sha>-...` на целевом SHA,
запускает `Full Release Validation` из этого закрепленного ref, проверяет, что `headSha` каждого дочернего
рабочего процесса совпадает с целью, и удаляет временную ветку после завершения
запуска. Зонтичный проверяющий также падает, если любой дочерний рабочий процесс выполнялся на
другом SHA.

`release_profile` управляет широтой live/provider, передаваемой в проверки релиза. Ручные
рабочие процессы релиза по умолчанию используют `stable`; используйте `full` только когда вы
намеренно хотите широкую консультативную матрицу провайдеров/медиа. Стабильные и полные
проверки релиза всегда запускают исчерпывающий live/E2E и soak релизного пути Docker;
бета-профиль может включить это через `run_release_soak=true`.

- `minimum` оставляет самые быстрые критичные для релиза дорожки OpenAI/core.
- `stable` добавляет стабильный набор провайдеров/backend.
- `full` запускает широкую консультативную матрицу провайдеров/медиа.

Зонтичный процесс записывает идентификаторы запущенных дочерних запусков, а финальная задача `Verify full validation` повторно проверяет текущие результаты дочерних запусков и добавляет таблицы самых медленных задач для каждого дочернего запуска. Если дочерний рабочий процесс перезапущен и стал зеленым, перезапустите только родительскую задачу проверки, чтобы обновить зонтичный результат и сводку таймингов.

Для восстановления `Full Release Validation` и `OpenClaw Release Checks` принимают `rerun_group`. Используйте `all` для кандидата релиза, `ci` только для обычного дочернего полного CI, `plugin-prerelease` только для дочернего prerelease плагинов, `release-checks` для каждого дочернего release, либо более узкую группу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` или `npm-telegram` в зонтичном процессе. Это удерживает повторный запуск упавшего release-бокса ограниченным после сфокусированного исправления. Для одной упавшей cross-OS дорожки объедините `rerun_group=cross-os` с `cross_os_suite_filter`, например `windows/packaged-upgrade`; длинные cross-OS команды выводят строки Heartbeat, а сводки packaged-upgrade включают тайминги по фазам. Дорожки QA release-check являются консультативными, кроме стандартного gate покрытия runtime-инструментов, который блокирует, когда обязательные динамические инструменты OpenClaw отклоняются или исчезают из сводки стандартного уровня.

`OpenClaw Release Checks` использует доверенный ref рабочего процесса, чтобы один раз разрешить выбранный ref в tarball `release-package-under-test`, затем передает этот артефакт в cross-OS проверки и Package Acceptance, а также в live/E2E Docker workflow релизного пути, когда запускается soak-покрытие. Это сохраняет байты пакета согласованными между release-боксами и избегает перепаковки одного и того же кандидата в нескольких дочерних задачах. Для live-дорожки npm-плагина Codex проверки релиза либо передают совпадающую опубликованную спецификацию плагина, выведенную из `release_package_spec`, либо передают предоставленный оператором `codex_plugin_spec`, либо оставляют ввод пустым, чтобы Docker-скрипт упаковал плагин Codex из выбранного checkout.

Дублирующиеся запуски `Full Release Validation` для `ref=main` и `rerun_group=all`
заменяют более старый зонтичный запуск. Родительский монитор отменяет любой дочерний рабочий процесс,
который он уже запустил, когда родитель отменяется, поэтому более новая проверка main
не стоит за устаревшим двухчасовым запуском release-check. Проверка ветки/тега релиза
и сфокусированные группы повторного запуска сохраняют `cancel-in-progress: false`.

## Live и E2E шарды

Дочерний release live/E2E сохраняет широкое покрытие нативных `pnpm test:live`, но запускает его как именованные шарды через `scripts/test-live-shard.mjs`, а не одной последовательной задачей:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- отфильтрованные по провайдеру задачи `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- разделенные медиа-шарды audio/video и отфильтрованные по провайдеру music-шарды

Это сохраняет то же покрытие файлов, одновременно упрощая повторный запуск и диагностику медленных сбоев live-провайдеров. Агрегированные имена шардов `native-live-extensions-o-z`, `native-live-extensions-media` и `native-live-extensions-media-music` остаются действительными для ручных одноразовых повторных запусков.

Нативные live media шарды выполняются в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, собранном рабочим процессом `Live Media Runner Image`. Этот образ заранее устанавливает `ffmpeg` и `ffprobe`; media-задачи только проверяют бинарные файлы перед setup. Держите Docker-backed live suites на обычных раннерах Blacksmith — container jobs являются неподходящим местом для запуска вложенных Docker tests.

Docker-шарды live-моделей и бэкендов используют отдельный общий образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для каждого выбранного коммита. Релизный workflow live-сценариев собирает и публикует этот образ один раз, после чего Docker-шарды live-модели, сегментированного по провайдерам gateway, CLI-бэкенда, привязки ACP и Codex harness запускаются с `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарды Gateway имеют явные ограничения `timeout` на уровне скриптов ниже тайм-аута задания workflow, чтобы зависший контейнер или путь очистки быстро завершался с ошибкой, а не расходовал весь бюджет release-check. Если эти шарды независимо пересобирают полный исходный Docker target, релизный запуск настроен неправильно и будет тратить реальное время на повторные сборки образа.

## Приемка пакета

Используйте `Package Acceptance`, когда вопрос звучит как «работает ли этот устанавливаемый пакет OpenClaw как продукт?» Это отличается от обычного CI: обычный CI проверяет дерево исходного кода, а приемка пакета проверяет один tarball через тот же Docker E2E harness, который пользователи задействуют после установки или обновления.

### Задания

1. `resolve_package` извлекает `workflow_ref`, определяет одного кандидата пакета, записывает `.artifacts/docker-e2e-package/openclaw-current.tgz`, записывает `.artifacts/docker-e2e-package/package-candidate.json`, загружает оба как артефакт `package-under-test` и выводит источник, workflow ref, package ref, версию, SHA-256 и профиль в сводке шага GitHub.
2. `docker_acceptance` вызывает `openclaw-live-and-e2e-checks-reusable.yml` с `ref=workflow_ref` и `package_artifact_name=package-under-test`. Переиспользуемый workflow загружает этот артефакт, проверяет inventory tarball, при необходимости подготавливает Docker-образы package-digest и запускает выбранные Docker-ланы против этого пакета вместо упаковки checkout workflow. Когда профиль выбирает несколько целевых `docker_lanes`, переиспользуемый workflow подготавливает пакет и общие образы один раз, затем распределяет эти ланы как параллельные целевые Docker-задания с уникальными артефактами.
3. `package_telegram` опционально вызывает `NPM Telegram Beta E2E`. Он запускается, когда `telegram_mode` не равен `none`, и устанавливает тот же артефакт `package-under-test`, если Package Acceptance определила его; автономный Telegram dispatch по-прежнему может установить опубликованную npm-спецификацию.
4. `summary` завершает workflow с ошибкой, если разрешение пакета, Docker-приемка или опциональная Telegram-лана завершились неуспешно.

### Источники кандидатов

- `source=npm` принимает только `openclaw@beta`, `openclaw@latest` или точную версию релиза OpenClaw, например `openclaw@2026.4.27-beta.2`. Используйте это для приемки опубликованных prerelease/stable версий.
- `source=ref` упаковывает доверенную ветку, тег или полный SHA коммита `package_ref`. Resolver получает ветки/теги OpenClaw, проверяет, что выбранный коммит достижим из истории веток репозитория или релизного тега, устанавливает зависимости в detached worktree и упаковывает его с помощью `scripts/package-openclaw-for-docker.mjs`.
- `source=url` загружает публичный HTTPS `.tgz`; `package_sha256` обязателен. Этот путь отклоняет учетные данные в URL, нестандартные HTTPS-порты, частные/внутренние/специальные hostnames или разрешенные IP-адреса, а также перенаправления за пределы той же публичной политики безопасности.
- `source=trusted-url` загружает HTTPS `.tgz` из именованной политики trusted-source в `.github/package-trusted-sources.json`; `package_sha256` и `trusted_source_id` обязательны. Используйте это только для принадлежащих maintainers корпоративных зеркал или частных репозиториев пакетов, которым нужны настроенные hosts, порты, префиксы путей, hosts перенаправлений или разрешение частной сети. Если политика объявляет bearer auth, workflow использует фиксированный секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; учетные данные, встроенные в URL, по-прежнему отклоняются.
- `source=artifact` загружает один `.tgz` из `artifact_run_id` и `artifact_name`; `package_sha256` необязателен, но его следует передавать для артефактов, распространяемых внешне.

Держите `workflow_ref` и `package_ref` раздельно. `workflow_ref` — это доверенный код workflow/harness, который запускает тест. `package_ref` — исходный коммит, который упаковывается при `source=ref`. Это позволяет текущему тестовому harness проверять более старые доверенные исходные коммиты без запуска старой логики workflow.

### Профили наборов

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — полные chunks Docker release-path с OpenWebUI
- `custom` — точные `docker_lanes`; обязателен, когда `suite_profile=custom`

Профиль `package` использует offline-покрытие plugins, чтобы проверка опубликованного пакета не зависела от доступности live ClawHub. Опциональная Telegram-лана переиспользует артефакт `package-under-test` в `NPM Telegram Beta E2E`, а путь опубликованной npm-спецификации сохраняется для автономных dispatch.

Политику выделенного тестирования обновлений и plugins, включая локальные команды,
Docker-ланы, входы Package Acceptance, релизные значения по умолчанию и triage сбоев,
см. в [Тестирование обновлений и plugins](/ru/help/testing-updates-plugins).

Release checks вызывают Package Acceptance с `source=artifact`, подготовленным артефактом релизного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` и `telegram_mode=mock-openai`. Это сохраняет миграцию пакета, обновление, live-установку skill из ClawHub, очистку устаревшей зависимости plugin, repair установки настроенного plugin, offline plugin, plugin-update и Telegram-proof на одном и том же разрешенном tarball пакета. Задайте `release_package_spec` в Full Release Validation или OpenClaw Release Checks после публикации beta, чтобы запустить ту же матрицу против поставленного npm-пакета без пересборки; задавайте `package_acceptance_package_spec` только когда Package Acceptance нужен пакет, отличающийся от остальной релизной проверки. Cross-OS release checks по-прежнему покрывают OS-specific onboarding, installer и поведение платформы; product validation пакета/обновления должна начинаться с Package Acceptance. Docker-лана `published-upgrade-survivor` проверяет одну baseline опубликованного пакета за запуск в блокирующем release path. В Package Acceptance разрешенный tarball `package-under-test` всегда является кандидатом, а `published_upgrade_survivor_baseline` выбирает fallback опубликованную baseline, по умолчанию `openclaw@latest`; команды повторного запуска сбойной ланы сохраняют эту baseline. Full Release Validation с `run_release_soak=true` или `release_profile=full` задает `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` и `published_upgrade_survivor_scenarios=reported-issues`, чтобы расширить покрытие на четыре последние stable npm-релиза плюс закрепленные boundary-релизы plugin-compatibility и issue-shaped fixtures для конфигурации Feishu, сохраненных bootstrap/persona-файлов, установок настроенного OpenClaw plugin, путей логов с тильдой и устаревших корней зависимостей legacy plugin. Выборы published-upgrade survivor с несколькими baselines шардируются по baseline в отдельные целевые задания Docker runner. Отдельный workflow `Update Migration` использует Docker-лану `update-migration` с `all-since-2026.4.23` и `plugin-deps-cleanup`, когда вопрос состоит в исчерпывающей очистке опубликованного обновления, а не в обычной широте Full Release CI. Локальные агрегированные запуски могут передавать точные спецификации пакетов через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, оставлять одну лану с `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, например `openclaw@2026.4.15`, или задавать `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матрицы сценариев. Опубликованная лана настраивает baseline с зашитым рецептом команды `openclaw config set`, записывает шаги рецепта в `summary.json` и проверяет `/healthz`, `/readyz`, а также статус RPC после запуска Gateway. Свежие ланы Windows packaged и installer также проверяют, что установленный пакет может импортировать browser-control override из необработанного абсолютного пути Windows. Cross-OS agent-turn smoke для OpenAI по умолчанию использует `OPENCLAW_CROSS_OS_OPENAI_MODEL`, если он задан, иначе `openai/gpt-5.5`, поэтому proof установки и gateway остается на тестовой модели GPT-5, избегая значений по умолчанию GPT-4.x.

### Окна совместимости с legacy

Package Acceptance имеет ограниченные окна legacy-compatibility для уже опубликованных пакетов. Пакеты до `2026.4.25` включительно, включая `2026.4.25-beta.*`, могут использовать путь совместимости:

- известные частные QA-записи в `dist/postinstall-inventory.json` могут указывать на файлы, опущенные из tarball;
- `doctor-switch` может пропустить подпроверку сохранения `gateway install --wrapper`, когда пакет не предоставляет этот флаг;
- `update-channel-switch` может удалить отсутствующие pnpm `patchedDependencies` из fake git fixture, полученной из tarball, и может логировать отсутствующий сохраненный `update.channel`;
- plugin smokes могут читать legacy-местоположения install-record или принимать отсутствие сохранения marketplace install-record;
- `plugin-update` может разрешать миграцию metadata конфигурации, при этом по-прежнему требуя, чтобы install record и поведение без переустановки оставались неизменными.

Опубликованный пакет `2026.4.26` также может предупреждать о локальных файлах штампа build metadata, которые уже были поставлены. Более поздние пакеты должны удовлетворять современным контрактам; те же условия приводят к ошибке вместо предупреждения или пропуска.

### Примеры

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

При отладке сбойного запуска package acceptance начните со сводки `resolve_package`, чтобы подтвердить источник пакета, версию и SHA-256. Затем изучите дочерний запуск `docker_acceptance` и его Docker-артефакты: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи лан, тайминги фаз и команды повторного запуска. Предпочитайте повторный запуск сбойного профиля пакета или точных Docker-лан вместо повторного запуска полной релизной проверки.

## Install smoke

Отдельный workflow `Install Smoke` переиспользует тот же скрипт scope через собственное задание `preflight`. Он разделяет smoke-покрытие на `run_fast_install_smoke` и `run_full_install_smoke`.

- **Быстрый путь** выполняется для pull request, затрагивающих Docker/package-поверхности, изменения пакетов/манифестов встроенных Plugin или основные поверхности Plugin/канала/gateway/Plugin SDK, которые проверяют Docker smoke-задания. Изменения только исходного кода встроенных Plugin, правки только тестов и правки только документации не резервируют Docker workers. Быстрый путь один раз собирает образ корневого Dockerfile, проверяет CLI, запускает CLI smoke для удаления agents shared-workspace, запускает container gateway-network e2e, проверяет build arg встроенного расширения и запускает ограниченный Docker-профиль встроенного Plugin с суммарным тайм-аутом команды 240 секунд (Docker-запуск каждого сценария ограничен отдельно).
- **Полный путь** сохраняет покрытие QR package install и installer Docker/update для ночных запусков по расписанию, ручных запусков, release-проверок через workflow-call и pull request, которые действительно затрагивают installer/package/Docker-поверхности. В полном режиме install-smoke подготавливает или повторно использует один GHCR smoke-образ корневого Dockerfile для целевого SHA, затем запускает QR package install, root Dockerfile/gateway smokes, installer/update smokes и быстрый Docker E2E для встроенных Plugin как отдельные задания, чтобы работа installer не ждала за smoke-проверками корневого образа.

Push в `main` (включая merge-коммиты) не принуждает полный путь; когда логика changed-scope запросила бы полное покрытие для push, workflow сохраняет быстрый Docker smoke и оставляет полный install smoke для ночной или release-валидации.

Медленный Bun global install image-provider smoke отдельно ограничивается `run_bun_global_install_smoke`. Он запускается по ночному расписанию и из workflow release checks, а ручные запуски `Install Smoke` могут включить его, но pull request и push в `main` не запускают его. Обычный PR CI по-прежнему запускает быстрый регрессионный lane Bun launcher для изменений, релевантных Node. QR и installer Docker tests сохраняют собственные install-ориентированные Dockerfile.

## Локальный Docker E2E

`pnpm test:docker:all` предварительно собирает один общий live-test image, один раз упаковывает OpenClaw как npm tarball и собирает два общих образа `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lanes;
- функциональный образ, который устанавливает тот же tarball в `/app` для обычных functionality lanes.

Определения Docker lanes находятся в `scripts/lib/docker-e2e-scenarios.mjs`, логика планировщика находится в `scripts/lib/docker-e2e-plan.mjs`, а runner выполняет только выбранный план. Планировщик выбирает образ для каждого lane с помощью `OPENCLAW_DOCKER_E2E_BARE_IMAGE` и `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, затем запускает lanes с `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Настраиваемые параметры

| Переменная                            | По умолчанию | Назначение                                                                                         |
| ------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10           | Количество слотов основного пула для обычных lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Количество слотов tail-пула, чувствительного к провайдерам.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9            | Лимит одновременных live lanes, чтобы провайдеры не throttled.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5            | Лимит одновременных npm install lanes.                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7            | Лимит одновременных multi-service lanes.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Задержка между стартами lanes, чтобы избежать штормов создания Docker daemon; задайте `0`, чтобы отключить задержку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000      | Резервный тайм-аут на lane (120 минут); выбранные live/tail lanes используют более строгие лимиты. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset        | `1` печатает план планировщика без запуска lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset        | Точный список lanes через запятую; пропускает cleanup smoke, чтобы agents могли воспроизвести один сбойный lane. |

Lane, который тяжелее своего эффективного лимита, все равно может стартовать из пустого пула, затем выполняется один, пока не освободит capacity. Локальный агрегат предварительно проверяет Docker, удаляет устаревшие контейнеры OpenClaw E2E, выводит статус активных lanes, сохраняет timings lanes для сортировки longest-first и по умолчанию прекращает планирование новых pooled lanes после первого сбоя.

### Переиспользуемый live/E2E workflow

Переиспользуемый live/E2E workflow спрашивает у `scripts/test-docker-all.mjs --plan-json`, какое покрытие package, image kind, live image, lane и credentials требуется. Затем `scripts/docker-e2e.mjs` преобразует этот план в GitHub outputs и summaries. Он либо упаковывает OpenClaw через `scripts/package-openclaw-for-docker.mjs`, скачивает package artifact текущего запуска, либо скачивает package artifact из `package_artifact_run_id`; проверяет inventory tarball; собирает и публикует package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, когда плану нужны package-installed lanes; и повторно использует предоставленные inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` или существующие package-digest images вместо пересборки. Pull Docker images повторяется с ограниченным тайм-аутом 180 секунд на попытку, чтобы зависший registry/cache stream быстро повторялся, а не потреблял большую часть критического пути CI.

### Чанки release-пути

Release Docker coverage запускает меньшие chunked jobs с `OPENCLAW_SKIP_DOCKER_BUILD=1`, чтобы каждый chunk скачивал только нужный ему image kind и выполнял несколько lanes через тот же weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Текущие release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` и `plugins-runtime-install-a` through `plugins-runtime-install-h`. `package-update-openai` включает live lane package для Codex Plugin, который устанавливает candidate package OpenClaw, устанавливает Codex Plugin из `codex_plugin_spec` или same-ref tarball с явным разрешением на установку Codex CLI, запускает Codex CLI preflight, затем выполняет несколько OpenClaw agent turns в той же сессии против OpenAI. `plugins-runtime-core`, `plugins-runtime` и `plugins-integrations` остаются агрегатными alias для plugin/runtime. Alias lane `install-e2e` остается агрегатным ручным alias rerun для обоих provider installer lanes.

OpenWebUI включается в `plugins-runtime-services`, когда полное release-path coverage запрашивает его, и сохраняет отдельный chunk `openwebui` только для OpenWebUI-only dispatches. Bundled-channel update lanes повторяются один раз при временных npm network failures.

Каждый chunk загружает `.artifacts/docker-tests/` с lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables и командами rerun для каждого lane. Input workflow `docker_lanes` запускает выбранные lanes на подготовленных образах вместо chunk jobs, что ограничивает отладку сбойного lane одним целевым Docker job и подготавливает, скачивает или повторно использует package artifact для этого запуска; если выбранный lane является live Docker lane, целевое задание локально собирает live-test image для этого rerun. Сгенерированные GitHub rerun commands для каждого lane включают `package_artifact_run_id`, `package_artifact_name` и prepared image inputs, когда эти значения существуют, чтобы сбойный lane мог повторно использовать точный package и images из сбойного запуска.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланированный live/E2E workflow ежедневно запускает полный release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` — более дорогое product/package coverage, поэтому это отдельный workflow, запускаемый `Full Release Validation` или явным оператором. Обычные pull request, push в `main` и самостоятельные ручные CI dispatches не включают этот suite. Он балансирует тесты встроенных Plugin по восьми extension workers; эти extension shard jobs запускают до двух plugin config groups одновременно с одним Vitest worker на группу и большим Node heap, чтобы import-heavy plugin batches не создавали дополнительные CI jobs. Release-only Docker prerelease path пакетирует целевые Docker lanes небольшими группами, чтобы не резервировать десятки runners для заданий на одну-три минуты. Workflow также загружает informational artifact `plugin-inspector-advisory` из `@openclaw/plugin-inspector`; findings inspector являются входными данными triage и не меняют blocking gate Plugin Prerelease.

## QA Lab

QA Lab имеет выделенные CI lanes вне основного smart-scoped workflow. Agentic parity вложена в broad QA и release harnesses, а не является отдельным PR workflow. Используйте `Full Release Validation` с `rerun_group=qa-parity`, когда parity должна идти вместе с широким validation run.

- Workflow `QA-Lab - All Lanes` запускается ночью на `main` и при ручном dispatch; он разворачивает mock parity lane, live Matrix lane, а также live Telegram и Discord lanes как параллельные jobs. Live jobs используют environment `qa-live-shared`, а Telegram/Discord используют Convex leases.

Release checks запускают Matrix и Telegram live transport lanes с детерминированным mock provider и mock-qualified models (`mock-openai/gpt-5.5` и `mock-openai/gpt-5.5-alt`), чтобы channel contract был изолирован от live model latency и обычного provider-plugin startup. Live transport gateway отключает memory search, потому что QA parity отдельно покрывает поведение memory; provider connectivity покрывается отдельными live model, native provider и Docker provider suites.

Matrix использует `--profile fast` для scheduled и release gates, добавляя `--fail-fast` только когда checked-out CLI поддерживает это. CLI default и manual workflow input остаются `all`; ручной dispatch `matrix_profile=all` всегда shard-ит полное Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` и `e2ee-cli`.

`OpenClaw Release Checks` также запускает release-critical QA Lab lanes перед release approval; его QA parity gate запускает candidate и baseline packs как параллельные lane jobs, затем скачивает оба artifacts в небольшое report job для финального parity comparison.

Для обычных PR следуйте scoped CI/check evidence вместо того, чтобы считать parity обязательным статусом.

## CodeQL

Workflow `CodeQL` намеренно является узким first-pass security scanner, а не полным sweep репозитория. Daily, manual и non-draft pull request guard runs сканируют Actions workflow code и JavaScript/TypeScript-поверхности с наивысшим риском с помощью high-confidence security queries, отфильтрованных по high/critical `security-severity`.

Pull request guard остается легким: он стартует только для изменений в `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` или process-owning bundled plugin runtime paths, и запускает ту же high-confidence security matrix, что и scheduled workflow. Android и macOS CodeQL не входят в PR defaults.

### Категории безопасности

| Категория                                        | Поверхность                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Базовый уровень аутентификации, секретов, песочницы, Cron и Gateway                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Контракты реализации core-каналов, а также среда выполнения канального Plugin, Gateway, Plugin SDK, секреты и точки касания аудита |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхности core-SSRF, разбора IP, сетевой защиты, web-fetch и политики SSRF в Plugin SDK                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-серверы, помощники выполнения процессов, исходящая доставка и шлюзы выполнения инструментов агента                             |
| `/codeql-security-high/process-exec-boundary`     | Локальная оболочка, помощники запуска процессов, среды выполнения встроенных Plugin, владеющих подпроцессами, и связующий код сценариев workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхности доверия установки Plugin, загрузчика, манифеста, реестра, установки через менеджер пакетов, загрузки исходников и контракта пакета Plugin SDK |

### Платформо-специфичные security-шарды

- `CodeQL Android Critical Security` — запланированный Android security-шард. Собирает приложение Android вручную для CodeQL на минимальном Blacksmith Linux runner, допускаемом sanity-проверкой workflow. Загружает результаты в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — еженедельный/ручной macOS security-шард. Собирает приложение macOS вручную для CodeQL на Blacksmith macOS, отфильтровывает результаты сборки зависимостей из загружаемого SARIF и загружает результаты в `/codeql-critical-security/macos`. Оставлен вне ежедневных значений по умолчанию, потому что сборка macOS доминирует во времени выполнения даже при чистом проходе.

### Категории Critical Quality

`CodeQL Critical Quality` — соответствующий не-security шард. Он запускает только JavaScript/TypeScript quality-запросы с severity error и без security-категории по узким поверхностям высокой ценности на GitHub-hosted Linux runners, чтобы quality-сканирования не тратили бюджет регистрации Blacksmith runner. Его защита pull request намеренно меньше, чем запланированный профиль: для не-draft PR запускаются только соответствующие шарды `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` и `plugin-sdk-reply-runtime` для изменений в коде выполнения команд/моделей/инструментов агента и отправки ответов, коде схемы/миграции/IO конфигурации, коде аутентификации/секретов/песочницы/security, core-каналах и средах выполнения встроенных канальных Plugin, протоколе Gateway/серверных методах, связующем коде среды выполнения памяти/SDK, MCP/процессах/исходящей доставке, среде выполнения provider/каталоге моделей, диагностике сессий/очередях доставки, загрузчике Plugin, Plugin SDK/контракте пакета или среде выполнения ответов Plugin SDK. Изменения конфигурации CodeQL и quality workflow запускают все двенадцать PR quality-шардов.

Ручной запуск принимает:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Узкие профили — это точки обучения/итерации для изолированного запуска одного quality-шарда.

| Категория                                              | Поверхность                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код security-границы аутентификации, секретов, песочницы, Cron и Gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Контракты схемы конфигурации, миграции, нормализации и IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схемы протокола Gateway и контракты серверных методов                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракты реализации core-каналов и встроенных канальных Plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Выполнение команд, диспетчеризация моделей/provider, диспетчеризация и очереди автоответов, а также контракты среды выполнения ACP control-plane                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-серверы и мосты инструментов, помощники надзора за процессами и контракты исходящей доставки                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасады среды выполнения памяти, алиасы памяти в Plugin SDK, связующий код активации среды выполнения памяти и команды doctor для памяти         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутренности очереди ответов, очереди доставки сессий, помощники привязки/доставки исходящих сессий, поверхности диагностических событий/пакетов логов и контракты session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризация входящих ответов Plugin SDK, payload ответов/помощники chunking/среды выполнения, параметры ответов канала, очереди доставки и помощники привязки сессий/тредов |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормализация каталога моделей, аутентификация и обнаружение provider, регистрация среды выполнения provider, значения по умолчанию/каталоги provider и реестры web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Инициализация Control UI, локальное сохранение, control-потоки Gateway и контракты среды выполнения task control-plane                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, понимание медиа, генерация изображений и контракты среды выполнения генерации медиа                                             |
| `/codeql-critical-quality/plugin-boundary`              | Контракты загрузчика, реестра, публичной поверхности и entrypoint Plugin SDK                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубликованные исходники Plugin SDK на стороне пакета и помощники контракта пакета Plugin                                                                        |

Quality остается отдельно от security, чтобы quality-находки можно было планировать, измерять, отключать или расширять без затемнения security-сигнала. Расширение CodeQL для Swift, Python и встроенных Plugin следует вернуть как scoped или sharded последующую работу только после того, как узкие профили получат стабильное время выполнения и сигнал.

## Workflow обслуживания

### Docs Agent

Workflow `Docs Agent` — это событийная линия обслуживания Codex для поддержания существующей документации в соответствии с недавно попавшими изменениями. У нее нет чистого расписания: успешный CI-запуск не-bot push на `main` может ее запустить, а ручной запуск может выполнить ее напрямую. Вызовы workflow-run пропускаются, когда `main` уже продвинулся дальше или когда другой непропущенный запуск Docs Agent был создан за последний час. При запуске она проверяет диапазон коммитов от предыдущего непропущенного исходного SHA Docs Agent до текущего `main`, поэтому один почасовой запуск может покрыть все изменения main, накопленные с последнего прохода по документации.

### Test Performance Agent

Workflow `Test Performance Agent` — это событийная линия обслуживания Codex для медленных тестов. У нее нет чистого расписания: успешный CI-запуск не-bot push на `main` может ее запустить, но она пропускается, если другой вызов workflow-run уже выполнялся или выполняется в этот UTC-день. Ручной запуск обходит этот дневной шлюз активности. Линия собирает сгруппированный отчет производительности Vitest для полного набора, позволяет Codex вносить только небольшие исправления производительности тестов с сохранением покрытия вместо широких рефакторингов, затем повторно запускает отчет полного набора и отклоняет изменения, уменьшающие baseline-количество проходящих тестов. Сгруппированный отчет записывает wall time по конфигурациям и max RSS на Linux и macOS, поэтому сравнение до/после показывает дельты памяти тестов рядом с дельтами длительности. Если в baseline есть падающие тесты, Codex может исправлять только очевидные сбои, а отчет полного набора после агента должен проходить до коммита чего-либо. Когда `main` продвигается до того, как bot push попадет в репозиторий, линия перебазирует проверенный patch, повторно запускает `pnpm check:changed` и повторяет push; конфликтующие устаревшие patches пропускаются. Она использует GitHub-hosted Ubuntu, чтобы Codex action мог сохранять ту же safety-позицию drop-sudo, что и docs agent.

### Дублирующие PR после merge

Workflow `Duplicate PRs After Merge` — это ручной maintainer workflow для очистки дубликатов после попадания изменений. По умолчанию он работает в dry-run и закрывает только явно перечисленные PR, когда `apply=true`. Перед изменением GitHub он проверяет, что landed PR смержен и что у каждого дубликата есть либо общая referenced issue, либо пересекающиеся измененные hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальные check-гейты и маршрутизация изменений

Логика локальных changed-lanes находится в `scripts/changed-lanes.mjs` и выполняется через `scripts/check-changed.mjs`. Этот локальный check gate строже относится к архитектурным границам, чем широкий платформенный scope CI:

- изменения core production запускают typecheck core prod и core test, а также core lint/guards;
- изменения только core test запускают только typecheck core test и core lint;
- изменения extension production запускают typecheck extension prod и extension test, а также extension lint;
- изменения только extension test запускают typecheck extension test и extension lint;
- изменения публичного Plugin SDK или plugin-contract расширяются до typecheck extension, потому что extensions зависят от этих core-контрактов (Vitest extension sweeps остаются явной тестовой работой);
- version bumps только release metadata запускают целевые проверки version/config/root-dependency;
- неизвестные изменения root/config fail safe во все check lanes.

Локальная маршрутизация changed-test находится в `scripts/test-projects.test-support.mjs` и намеренно дешевле, чем `check:changed`: прямые правки тестов запускают сами себя, правки исходников предпочитают явные mapping, затем sibling tests и dependents из import graph. Общая конфигурация group-room delivery — один из явных mapping: изменения group visible-reply config, source reply delivery mode или system prompt message-tool маршрутизируются через core reply tests плюс регрессии доставки Discord и Slack, чтобы изменение общего значения по умолчанию падало до первого PR push. Используйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только когда изменение настолько широко затрагивает harness, что дешевый mapped set не является надежным proxy.

## Валидация Testbox

Crabbox — принадлежащая репозиторию обертка для remote-box, используемая мейнтейнерами для подтверждения в Linux. Используйте ее
из корня репозитория, когда проверка слишком широка для локального цикла правок, когда важен
паритет с CI или когда для подтверждения нужны секреты, Docker, package lanes,
переиспользуемые боксы или удаленные логи. Обычный backend OpenClaw —
`blacksmith-testbox`; собственные мощности AWS/Hetzner используются как fallback при сбоях Blacksmith,
проблемах с квотами или явном тестировании на собственных мощностях.

Запуски Blacksmith через Crabbox прогревают, резервируют, синхронизируют, запускают, формируют отчет и очищают
одноразовые Testbox. Встроенная sanity-проверка синхронизации быстро завершается с ошибкой, когда обязательные
корневые файлы, такие как `pnpm-lock.yaml`, исчезают или когда `git status --short`
показывает не менее 200 отслеживаемых удалений. Для PR с намеренным массовым удалением задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для удаленной команды.

Crabbox также завершает локальный вызов Blacksmith CLI, который остается в фазе
синхронизации более пяти минут без вывода после синхронизации. Задайте
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, чтобы отключить эту защиту, или используйте большее
значение в миллисекундах для необычно больших локальных diff.

Перед первым запуском проверьте обертку из корня репозитория:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обертка репозитория отклоняет устаревший бинарный файл Crabbox, который не объявляет `blacksmith-testbox`. Передавайте provider явно, хотя в `.crabbox.yaml` есть defaults для собственного облака. В worktree Codex или связанных/разреженных checkout избегайте локального скрипта `pnpm crabbox:run`, потому что pnpm может согласовывать зависимости до запуска Crabbox; вместо этого вызывайте node-обертку напрямую:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Запуски через Blacksmith требуют Crabbox 0.22.0 или новее, чтобы обертка получала текущее поведение синхронизации, очереди и очистки Testbox. При использовании соседнего checkout пересоберите игнорируемый локальный бинарный файл перед работой с таймингами или подтверждением:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Changed gate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Целевой перезапуск теста:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Полный набор тестов:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Прочитайте итоговую сводку JSON. Полезные поля: `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` и `totalMs`. Для делегированных
запусков Blacksmith Testbox код выхода обертки Crabbox и сводка JSON являются
результатом команды. Связанный запуск GitHub Actions отвечает за hydration и keepalive; он
может завершиться как `cancelled`, когда Testbox остановлен извне после того, как SSH-команда
уже вернулась. Считайте это артефактом очистки/статуса, если только
`exitCode` обертки не ненулевой или вывод команды не показывает упавший тест.
Одноразовые запуски Crabbox через Blacksmith должны автоматически останавливать Testbox;
если запуск прерван или очистка неясна, проверьте живые боксы и остановите только
те боксы, которые создали вы:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Используйте reuse только когда вам намеренно нужны несколько команд на одном hydrated боксе:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Если сломанным слоем является Crabbox, но сам Blacksmith работает, используйте прямой
Blacksmith только для диагностики, такой как `list`, `status` и очистка. Исправьте
путь Crabbox, прежде чем считать прямой запуск Blacksmith мейнтейнерским подтверждением.

Если `blacksmith testbox list --all` и `blacksmith testbox status` работают, но новые
warmup остаются в `queued` без IP или URL запуска Actions через пару минут,
считайте это давлением со стороны provider Blacksmith, очереди, биллинга или лимитов org. Остановите
созданные вами queued id, не запускайте больше Testbox и перенесите подтверждение на
путь собственной мощности Crabbox ниже, пока кто-то проверяет dashboard Blacksmith,
биллинг и лимиты org.

Переходите на собственные мощности Crabbox только когда Blacksmith недоступен, ограничен квотой, не имеет нужного окружения или собственные мощности явно являются целью:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

При давлении на AWS избегайте `class=beast`, если задаче действительно не нужен CPU уровня 48xlarge. Запрос `beast` начинается со 192 vCPU и является самым простым способом упереться в региональную квоту EC2 Spot или On-Demand Standard. Принадлежащий репозиторию `.crabbox.yaml` по умолчанию использует `standard`, несколько регионов мощности и `capacity.hints: true`, поэтому brokered AWS leases выводят выбранный регион/рынок, давление квот, fallback на Spot и предупреждения о классах с высокой нагрузкой. Используйте `fast` для более тяжелых широких проверок, `large` только после того, как standard/fast недостаточны, и `beast` только для исключительных CPU-bound lanes, таких как full-suite или all-plugin Docker matrices, явная release/blocker validation или high-core performance profiling. Не используйте `beast` для `pnpm check:changed`, целевых тестов, docs-only work, обычных lint/typecheck, небольших E2E repro или triage сбоя Blacksmith. Используйте `--market on-demand` для диагностики мощности, чтобы колебания рынка Spot не смешивались с сигналом.

`.crabbox.yaml` задает defaults provider, sync и GitHub Actions hydration для owned-cloud lanes. Он исключает локальный `.git`, чтобы hydrated checkout Actions сохранял собственные удаленные Git metadata вместо синхронизации maintainer-local remotes и object stores, и исключает локальные runtime/build artifacts, которые никогда не должны передаваться. `.github/workflows/crabbox-hydrate.yml` отвечает за checkout, настройку Node/pnpm, fetch `origin/main` и передачу несекретного окружения для команд owned-cloud `crabbox run --id <cbx_id>`.

## Связанные материалы

- [Обзор установки](/ru/install)
- [Каналы разработки](/ru/install/development-channels)
