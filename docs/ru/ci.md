---
read_when:
    - Вам нужно понять, почему задание CI было или не было запущено
    - Вы отлаживаете сбой проверки GitHub Actions
    - Вы координируете запуск или повторный запуск проверки релиза
    - Вы изменяете диспетчеризацию ClawSweeper или пересылку активности GitHub
summary: Граф заданий CI, шлюзы области действия, зонтичные проверки релиза и эквивалентные локальные команды
title: Конвейер CI
x-i18n:
    generated_at: "2026-07-04T18:12:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускается при каждом push в `main` и для каждого pull request. Канонические
push в `main` сначала проходят через 90-секундное окно допуска hosted-runner.
Существующая concurrency group `CI` отменяет ожидающий запуск, когда появляется более новый
коммит, поэтому последовательные merge не регистрируют каждый полную матрицу Blacksmith.
Pull request и ручные dispatch пропускают ожидание. Затем job `preflight`
классифицирует diff и отключает дорогие lanes, когда изменились только несвязанные
области. Ручные запуски `workflow_dispatch` намеренно обходят умное
ограничение scope и разворачивают полный граф для release candidate и широкой
валидации. Android lanes остаются opt-in через `include_android`. Покрытие Plugin
только для релизов находится в отдельном workflow [`Предрелиз Plugin`](#plugin-prerelease)
и запускается только из [`Полной валидации релиза`](#full-release-validation)
или явного ручного dispatch.

## Обзор Pipeline

| Job                                | Назначение                                                                                                   | Когда запускается                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Обнаруживает изменения только в docs, измененные scopes, измененные extensions и собирает CI manifest                   | Всегда для non-draft push и PR                  |
| `runner-admission`                 | Hosted 90-секундный debounce для канонических push в `main` перед регистрацией работы Blacksmith                | Каждый запуск CI; sleep только для канонических push в `main` |
| `security-fast`                    | Обнаружение приватных ключей, аудит измененных workflow через `zizmor` и аудит production lockfile                 | Всегда для non-draft push и PR                  |
| `check-dependencies`               | Production Knip dependency-only pass плюс guard allowlist неиспользуемых файлов                                 | Изменения, относящиеся к Node                               |
| `build-artifacts`                  | Сборка `dist/`, Control UI, smoke-проверки built-CLI, проверки встроенных build artifacts и переиспользуемые artifacts | Изменения, относящиеся к Node                               |
| `checks-fast-core`                 | Быстрые Linux lanes корректности, такие как bundled, protocol, QA Smoke CI и проверки CI routing                | Изменения, относящиеся к Node                               |
| `checks-fast-contracts-plugins-*`  | Две шардированные проверки контрактов Plugin                                                                        | Изменения, относящиеся к Node                               |
| `checks-fast-contracts-channels-*` | Две шардированные проверки контрактов каналов                                                                       | Изменения, относящиеся к Node                               |
| `checks-node-core-*`               | Шарды тестов core Node, исключая channel, bundled, contract и extension lanes                          | Изменения, относящиеся к Node                               |
| `check-*`                          | Шардированный эквивалент основного локального gate: prod types, lint, guards, test types и strict smoke                | Изменения, относящиеся к Node                               |
| `check-additional-*`               | Architecture, шардированный boundary/prompt drift, extension guards, package boundary и runtime topology     | Изменения, относящиеся к Node                               |
| `checks-node-compat-node22`        | Сборка совместимости Node 22 и smoke lane                                                                | Ручной CI dispatch для релизов                     |
| `check-docs`                       | Форматирование docs, lint и проверки broken links                                                             | Изменились docs                                        |
| `skills-python`                    | Ruff + pytest для Skills на базе Python                                                                    | Изменения, относящиеся к Python Skills                       |
| `checks-windows`                   | Windows-специфичные тесты process/path плюс общие регрессии runtime import specifier                      | Изменения, относящиеся к Windows                            |
| `macos-node`                       | macOS TypeScript test lane с использованием общих built artifacts                                               | Изменения, относящиеся к macOS                              |
| `macos-swift`                      | Swift lint, build и tests для macOS app                                                            | Изменения, относящиеся к macOS                              |
| `ios-build`                        | Генерация Xcode project плюс сборка iOS app simulator                                                 | iOS app, общий app kit или изменения Swabble         |
| `android`                          | Android unit tests для обоих flavors плюс одна сборка debug APK                                              | Изменения, относящиеся к Android                            |
| `test-performance-agent`           | Ежедневная оптимизация медленных тестов Codex после доверенной активности                                                 | Успех main CI или ручной dispatch                  |
| `openclaw-performance`             | Ежедневные/on-demand отчеты производительности Kova runtime с mock-provider, deep-profile и GPT 5.5 live lanes | Запланированный и ручной dispatch                       |

## Порядок Fail-fast

1. `runner-admission` ждет только канонические push в `main`; более новый push отменяет запуск до регистрации Blacksmith.
2. `preflight` решает, какие lanes вообще существуют. Логика `docs-scope` и `changed-scope` является шагами внутри этой job, а не отдельными jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` и `skills-python` быстро падают, не ожидая более тяжелых artifact и platform matrix jobs.
4. `build-artifacts` перекрывается с быстрыми Linux lanes, чтобы downstream consumers могли стартовать сразу после готовности общей сборки.
5. Более тяжелые platform и runtime lanes после этого расходятся веером: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` и `android`.

GitHub может помечать superseded jobs как `cancelled`, когда более новый push попадает в тот же PR или ref `main`. Считайте это шумом CI, если только самый новый запуск для того же ref тоже не падает. Matrix jobs используют `fail-fast: false`, а `build-artifacts` сообщает о сбоях embedded channel, core-support-boundary и gateway-watch напрямую, вместо того чтобы ставить в очередь маленькие verifier jobs. Автоматический ключ concurrency CI версионирован (`CI-v7-*`), поэтому GitHub-side zombie в старой queue group не может бесконечно блокировать более новые main runs. Ручные запуски full-suite используют `CI-manual-v1-*` и не отменяют in-progress runs.

Используйте `pnpm ci:timings`, `pnpm ci:timings:recent` или `node scripts/ci-run-timings.mjs <run-id>`, чтобы суммировать wall time, queue time, самые медленные jobs, сбои и fanout barrier `pnpm-store-warmup` из GitHub Actions. CI также загружает ту же сводку запуска как artifact `ci-timings-summary`. Для времени сборки проверьте шаг `Build dist` в job `build-artifacts`: `pnpm build:ci-artifacts` печатает `[build-all] phase timings:` и включает `ui:build`; job также загружает artifact `startup-memory`.

Для запусков pull request terminal timing-summary job запускает helper из доверенной base revision перед передачей `GH_TOKEN` в `gh run view`. Это удерживает tokened query вне кода, контролируемого branch, но все равно суммирует текущий CI run pull request.

## Контекст и evidence PR

PR внешних contributors запускают gate контекста PR и evidence из
`.github/workflows/real-behavior-proof.yml`. Workflow checkout доверенный
base commit и оценивает только тело PR; он не выполняет код из
branch contributor.

Gate применяется к авторам PR, которые не являются owners, members,
collaborators или bots репозитория. Он проходит, когда тело PR содержит authored
разделы `What Problem This Solves` и `Evidence`. Evidence может быть focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log или artifact link. Тело предоставляет intent и полезную validation;
reviewers проверяют код, tests и CI, чтобы оценить correctness.

Когда check падает, обновите тело PR вместо push еще одного code commit.

## Scope и routing

Логика scope находится в `scripts/ci-changed-scope.mjs` и покрыта unit tests в `src/scripts/ci-changed-scope.test.ts`. Ручной dispatch пропускает changed-scope detection и заставляет preflight manifest вести себя так, будто изменилась каждая scoped area.

- **Правки CI workflow** валидируют граф Node CI плюс workflow linting, но сами по себе не форсируют Windows, iOS, Android или macOS native builds; эти platform lanes остаются scoped к изменениям platform source.
- **Workflow Sanity** запускает `actionlint`, `zizmor` по всем workflow YAML files, composite-action interpolation guard и conflict-marker guard. PR-scoped job `security-fast` также запускает `zizmor` по измененным workflow files, чтобы workflow security findings падали рано в основном графе CI.
- **Docs при push в `main`** проверяются отдельным workflow `Docs` с тем же mirror docs ClawHub, который использует CI, поэтому смешанные code+docs push не ставят также в очередь CI shard `check-docs`. Pull request и ручной CI все еще запускают `check-docs` из CI, когда docs изменились.
- **TUI PTY** запускается в Linux Node shard `checks-node-core-runtime-tui-pty` для изменений TUI. Shard запускает `test/vitest/vitest.tui-pty.config.ts` с `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, поэтому он покрывает и deterministic fixture lane `TuiBackend`, и более медленный smoke `tui --local`, который mock только external model endpoint.
- **Правки только CI routing, выбранные дешевые правки core-test fixture и узкие правки plugin contract helper/test-routing** используют быстрый Node-only manifest path: `preflight`, security и одну task `checks-fast-core`. Этот path пропускает build artifacts, совместимость Node 22, channel contracts, полные core shards, bundled-plugin shards и дополнительные guard matrices, когда изменение ограничено routing или helper surfaces, которые fast task проверяет напрямую.
- **Windows Node checks** scoped к Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config и surfaces CI workflow, которые выполняют эту lane; несвязанные source, plugin, install-smoke и test-only changes остаются на Linux Node lanes.

Самые медленные семейства тестов Node разделены или сбалансированы так, чтобы каждое задание оставалось небольшим без избыточного резервирования раннеров: контракты Plugin и контракты каналов запускаются как два взвешенных шарда с поддержкой Blacksmith и стандартным резервным вариантом на раннере GitHub, быстрые и вспомогательные дорожки core unit запускаются отдельно, инфраструктура core runtime разделена между state, process/config, shared и тремя доменными cron-шардами, auto-reply запускается как сбалансированные воркеры (с разделением поддерева reply на шарды agent-runner, dispatch и commands/state-routing), а конфигурации agentic gateway/server разделены по дорожкам chat/auth/model/http-plugin/runtime/startup вместо ожидания собранных артефактов. Затем обычный CI упаковывает только изолированные infra-шарды с include-шаблонами в детерминированные пакеты максимум по 64 тестовых файла, сокращая матрицу Node без объединения неизолированных command/cron, stateful agents-core или наборов gateway/server; тяжелые фиксированные наборы остаются на 8 vCPU, а пакетированные и менее тяжелые дорожки используют 4 vCPU. Pull request в каноническом репозитории используют дополнительный компактный план допуска: те же группы по конфигурациям запускаются в изолированных подпроцессах внутри текущего плана Linux Node из 34 заданий, поэтому один PR не регистрирует полную матрицу Node из более чем 70 заданий. Push в `main`, ручные dispatch и release gates сохраняют полную матрицу. Широкие browser, QA, media и разные тесты Plugin используют свои выделенные конфигурации Vitest вместо общего plugin catch-all. Include-шарды записывают записи таймингов с именем CI-шарда, поэтому `.artifacts/vitest-shard-timings.json` может отличать целую конфигурацию от отфильтрованного шарда. `check-additional-*` держит compile/canary-работу границ пакетов вместе и отделяет архитектуру runtime topology от покрытия gateway watch; список boundary guard распределен в один prompt-heavy шард и один объединенный шард для остальных полос guard, каждый запускает выбранные независимые guard параллельно и печатает тайминги по каждой проверке. Дорогая проверка drift снимков prompt для счастливого пути Codex запускается как отдельное дополнительное задание только для ручного CI и изменений, влияющих на prompt, поэтому обычные несвязанные изменения Node не ждут холодной генерации снимков prompt, а boundary-шарды остаются сбалансированными, при этом drift prompt все равно привязан к PR, который его вызвал; тот же флаг пропускает генерацию Vitest-снимков prompt внутри шарда core support-boundary для собранных артефактов. Gateway watch, тесты каналов и шард core support-boundary запускаются параллельно внутри `build-artifacts` после того, как `dist/` и `dist-runtime/` уже собраны.

После допуска канонический Linux CI разрешает до 24 одновременных заданий тестов Node и
12 для меньших fast/check-дорожек; Windows и Android остаются на двух, потому что
эти пулы раннеров уже.

Компактный план PR создает 18 заданий Node для текущего набора: группы whole-config
объединяются в пакеты в изолированных подпроцессах с 120-минутным таймаутом пакета,
а группы include-pattern используют тот же ограниченный бюджет заданий.

Android CI запускает и `testPlayDebugUnitTest`, и `testThirdPartyDebugUnitTest`, а затем собирает Play debug APK. У third-party flavor нет отдельного набора исходников или манифеста; его дорожка unit-test все равно компилирует flavor с флагами BuildConfig для SMS/call-log, при этом избегая дублирующего задания упаковки debug APK при каждом push, связанном с Android.

Шард `check-dependencies` запускает `pnpm deadcode:dependencies` (production-проход Knip только по зависимостям, закрепленный на последней версии Knip, с отключенным минимальным возрастом релиза pnpm для установки через `dlx`) и `pnpm deadcode:unused-files`, который сравнивает production-находки Knip по неиспользуемым файлам с `scripts/deadcode-unused-files.allowlist.mjs`. Guard неиспользуемых файлов падает, когда PR добавляет новый непроверенный неиспользуемый файл или оставляет устаревшую запись allowlist, сохраняя при этом намеренные dynamic plugin, generated, build, live-test и package bridge поверхности, которые Knip не может разрешить статически.

## Пересылка активности ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — это мост на стороне целевого репозитория из активности репозитория OpenClaw в ClawSweeper. Он не выполняет checkout и не запускает недоверенный код pull request. Workflow создает токен GitHub App из `CLAWSWEEPER_APP_PRIVATE_KEY`, затем отправляет компактные payload `repository_dispatch` в `openclaw/clawsweeper`.

У workflow четыре дорожки:

- `clawsweeper_item` для точных запросов проверки issue и pull request;
- `clawsweeper_comment` для явных команд ClawSweeper в комментариях issue;
- `clawsweeper_commit_review` для запросов проверки на уровне commit при push в `main`;
- `github_activity` для общей активности GitHub, которую агент ClawSweeper может проинспектировать.

Дорожка `github_activity` пересылает только нормализованные метаданные: тип события, действие, actor, репозиторий, номер элемента, URL, заголовок, состояние и короткие выдержки из комментариев или review, если они есть. Она намеренно не пересылает полный webhook body. Принимающий workflow в `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`, он отправляет нормализованное событие в hook OpenClaw Gateway для агента ClawSweeper.

Общая активность — это наблюдение, а не доставка по умолчанию. Агент ClawSweeper получает целевой Discord в своем prompt и должен публиковать в `#clawsweeper` только когда событие неожиданное, требующее действия, рискованное или операционно полезное. Обычные открытия, правки, шум от ботов, дублирующий webhook-шум и обычный review-трафик должны приводить к `NO_REPLY`.

Рассматривайте заголовки GitHub, комментарии, bodies, текст review, имена веток и сообщения commit как недоверенные данные на всем этом пути. Это входные данные для суммаризации и triage, а не инструкции для workflow или runtime агента.

## Ручные dispatch

Ручные dispatch CI запускают тот же граф заданий, что и обычный CI, но принудительно включают каждую scoped-дорожку не для Android: шарды Linux Node, шарды bundled-plugin, шарды контрактов Plugin и каналов, совместимость Node 22, `check-*`, `check-additional-*`, smoke-проверки собранных артефактов, проверки документации, Python Skills, Windows, macOS, iOS build и Control UI i18n. Автономные ручные dispatch CI запускают Android только с `include_android=true`; полный release umbrella включает Android, передавая `include_android=true`. Статические проверки plugin prerelease, release-only шард `agentic-plugins`, полный sweep пакетной проверки extension и Docker-дорожки plugin prerelease исключены из CI. Docker prerelease suite запускается только когда `Full Release Validation` отправляет отдельный workflow `Plugin Prerelease` с включенным gate release-validation.

Ручные запуски используют уникальную concurrency group, чтобы полный набор release-candidate не был отменен другим push или PR-запуском на том же ref. Необязательный input `target_ref` позволяет доверенному вызывающему запустить этот граф для ветки, тега или полного commit SHA, используя файл workflow из выбранного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Ежемесячный путь extended-stable только для npm — исключение: отправьте оба dispatch, preflight `OpenClaw NPM
Release` и `Full Release Validation`, из точной ветки
`extended-stable/YYYY.M.33`, сохраните их run ID и передайте оба ID в
прямой запуск публикации npm. См. [Ежемесячная публикация extended-stable
только для npm](/ru/reference/RELEASING#monthly-npm-only-extended-stable-publication), где указаны
команды, точные требования к identity, registry readback и процедура
repair selector. Этот путь не отправляет dispatch для plugin, macOS, Windows, GitHub
Release, private dist-tag или публикации на других платформах.

## Раннеры

| Раннер                          | Задания                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Ручной CI dispatch и резервные варианты для неканонических репозиториев, quality scans CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, docs workflows вне CI и install-smoke preflight, чтобы матрица Blacksmith могла встать в очередь раньше                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, менее тяжелые шарды extension, `checks-fast-core` кроме QA Smoke CI, шарды контрактов plugin/channel, большинство bundled/менее тяжелых шардов Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, выбранные шарды `check-additional-*` и `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Сохраненные тяжелые наборы Linux Node, boundary/extension-heavy шарды `check-additional-*` и `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` в CI и Testbox, `check-lint` (достаточно чувствителен к CPU, поэтому 8 vCPU стоили больше, чем экономили); Docker-сборки install-smoke (время ожидания в очереди на 32 vCPU стоило больше, чем экономило)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; forks используют резервный `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` и `ios-build` на `openclaw/openclaw`; forks используют резервный `macos-26`                                                                                                                                                                                                                     |

## Бюджет регистрации раннеров

Текущий bucket регистрации раннеров GitHub в OpenClaw сообщает 10 000 регистраций
self-hosted раннеров за 5 минут в `ghx api rate_limit`. Перепроверяйте
`actions_runner_registration` перед каждым проходом настройки, потому что GitHub может изменить
этот bucket. Лимит общий для всех регистраций раннеров Blacksmith в организации
`openclaw`, поэтому добавление еще одной установки Blacksmith не добавляет
новый bucket.

Считайте labels Blacksmith дефицитным ресурсом для контроля burst. Задания, которые
только маршрутизируют, уведомляют, суммаризируют, выбирают шарды или запускают короткие сканирования CodeQL,
должны оставаться на GitHub-hosted раннерах, если у них нет измеренных Blacksmith-specific
потребностей. Любая новая матрица Blacksmith, больший `max-parallel` или высокочастотный
workflow должны показывать worst-case число регистраций и удерживать целевой показатель на уровне организации
ниже примерно 60% живого bucket. При текущем bucket в 10 000 регистраций
это означает операционную цель в 6 000 регистраций, оставляя запас для
параллельных репозиториев, retry и пересечения burst.

CI канонического репозитория сохраняет Blacksmith как путь раннера по умолчанию для обычных запусков push и pull-request. `workflow_dispatch` и запуски неканонических репозиториев используют GitHub-hosted раннеры, но обычные канонические запуски сейчас не проверяют состояние очереди Blacksmith и автоматически не переключаются на GitHub-hosted labels, когда Blacksmith недоступен.

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

`OpenClaw Performance` — это рабочий процесс производительности продукта и среды выполнения. Он ежедневно запускается на `main`, а также может быть запущен вручную:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручной запуск обычно измеряет производительность ref рабочего процесса. Укажите `target_ref`, чтобы измерить производительность тега релиза или другой ветки с текущей реализацией рабочего процесса. Пути опубликованных отчетов и указатели latest ключуются по проверяемому ref, а каждый `index.md` записывает проверяемые ref/SHA, ref/SHA рабочего процесса, ref Kova, профиль, режим авторизации lane, модель, число повторов и фильтры сценариев.

Рабочий процесс устанавливает OCM из закрепленного релиза и Kova из `openclaw/Kova` по закрепленному входному параметру `kova_ref`, затем запускает три lane:

- `mock-provider`: диагностические сценарии Kova против локально собранной среды выполнения с детерминированной фиктивной OpenAI-совместимой авторизацией.
- `mock-deep-profile`: профилирование CPU/heap/trace для горячих точек запуска, Gateway и agent-turn.
- `live-openai-candidate`: реальный agent turn OpenAI `openai/gpt-5.5`, пропускается, когда `OPENAI_API_KEY` недоступен.

Lane mock-provider также запускает нативные исходные пробы OpenClaw после прохода Kova: время загрузки Gateway и память для случаев запуска по умолчанию, с хуком и с 50 Plugin; RSS импорта встроенных Plugin, повторяющиеся циклы приветствия mock-OpenAI `channel-chat-baseline`, команды запуска CLI против загруженного Gateway и smoke-пробу производительности состояния SQLite. Когда для проверяемого ref доступен предыдущий опубликованный исходный отчет mock-provider, исходная сводка сравнивает текущие значения RSS и heap с этим baseline и помечает большие увеличения RSS как `watch`. Markdown-сводка исходной пробы находится в `source/index.md` в пакете отчета, рядом с сырым JSON.

Каждый lane загружает артефакты GitHub. Когда настроен `CLAWGRIT_REPORTS_TOKEN`, рабочий процесс также коммитит `report.json`, `report.md`, пакеты, `index.md` и артефакты исходных проб в `openclaw/clawgrit-reports` по пути `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Текущий указатель tested-ref записывается как `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Полная проверка релиза

`Full Release Validation` — это ручной зонтичный рабочий процесс для «запустить все перед релизом». Он принимает ветку, тег или полный SHA коммита, запускает ручной рабочий процесс `CI` с этой целью, запускает `Plugin Prerelease` для релизных доказательств Plugin/package/static/Docker и запускает `OpenClaw Release Checks` для install smoke, package acceptance, кросс-OS проверок пакетов, рендеринга maturity scorecard из доказательств профиля QA, паритета QA Lab, Matrix и Telegram lanes. Профили stable и full всегда включают исчерпывающее live/E2E и Docker soak-покрытие релизного пути; профиль beta может включить его через `run_release_soak=true`. Канонический package Telegram E2E запускается внутри Package Acceptance, поэтому полный кандидат не запускает дублирующий live poller. После публикации передайте `release_package_spec`, чтобы повторно использовать поставленный npm-пакет во всех release checks, Package Acceptance, Docker, cross-OS и Telegram без пересборки. Используйте `npm_telegram_package_spec` только для сфокусированного повторного запуска Telegram с опубликованным пакетом. Live package lane Plugin Codex по умолчанию использует то же выбранное состояние: опубликованный `release_package_spec=openclaw@<tag>` выводит `codex_plugin_spec=npm:@openclaw/codex@<tag>`, а запуски по SHA/артефакту упаковывают `extensions/codex` из выбранного ref. Явно задайте `codex_plugin_spec` для пользовательских источников Plugin, таких как спецификации `npm:`, `npm-pack:` или `git:`.

См. [Полная проверка релиза](/ru/reference/full-release-validation), где приведены
матрица стадий, точные имена job рабочего процесса, различия профилей, артефакты и
дескрипторы для сфокусированных повторных запусков.

`OpenClaw Release Publish` — это ручной изменяющий рабочий процесс релиза. Запускайте его
из `release/YYYY.M.PATCH` или `main` после появления тега релиза и после успешного
preflight OpenClaw npm. Он проверяет `pnpm plugins:sync:check`,
запускает `Plugin NPM Release` для всех публикуемых пакетов Plugin, запускает
`Plugin ClawHub Release` для того же SHA релиза и только после этого запускает
`OpenClaw NPM Release` с сохраненным `preflight_run_id`. Публикация stable также
требует точный `windows_node_tag`; рабочий процесс проверяет исходный релиз Windows
и сравнивает его установщики x64/ARM64 с одобренным кандидатом входным параметром
`windows_node_installer_digests` перед любым дочерним publish, затем продвигает
и проверяет те же закрепленные digest установщиков, а также точный сопутствующий asset
и контракт checksum перед публикацией черновика релиза GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для доказательства закрепленного коммита на быстро меняющейся ветке используйте helper вместо
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs запуска рабочего процесса GitHub должны быть ветками или тегами, а не сырыми SHA коммитов.
Helper отправляет временную ветку `release-ci/<sha>-...` на целевой SHA,
запускает `Full Release Validation` из этого закрепленного ref, проверяет, что каждый дочерний
workflow `headSha` совпадает с целью, и удаляет временную ветку, когда
запуск завершен. Зонтичный verifier также падает, если какой-либо дочерний рабочий процесс был запущен на
другом SHA.

`release_profile` управляет широтой live/provider, передаваемой в release checks. Ручные
рабочие процессы релиза по умолчанию используют `stable`; используйте `full` только когда
намеренно нужна широкая консультативная матрица provider/media. Release checks stable и full
всегда запускают исчерпывающее live/E2E и Docker soak релизного пути;
профиль beta может включить это через `run_release_soak=true`.

- `minimum` оставляет самые быстрые OpenAI/core критичные для релиза lanes.
- `stable` добавляет стабильный набор provider/backend.
- `full` запускает широкую консультативную матрицу provider/media.

Зонтичный процесс записывает id запущенных дочерних запусков, а финальная job `Verify full validation` повторно проверяет текущие заключения дочерних запусков и добавляет таблицы самых медленных job для каждого дочернего запуска. Если дочерний рабочий процесс перезапущен и стал green, перезапустите только родительскую job verifier, чтобы обновить зонтичный результат и сводку времени.

Для восстановления и `Full Release Validation`, и `OpenClaw Release Checks` принимают `rerun_group`. Используйте `all` для кандидата релиза, `ci` только для обычного дочернего full CI, `plugin-prerelease` только для дочернего plugin prerelease, `release-checks` для каждого дочернего release или более узкую группу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` или `npm-telegram` на зонтичном процессе. Это ограничивает повторный запуск неудачного release box после сфокусированного исправления. Для одного неудачного cross-OS lane объедините `rerun_group=cross-os` с `cross_os_suite_filter`, например `windows/packaged-upgrade`; длинные cross-OS команды выводят строки Heartbeat, а сводки packaged-upgrade включают тайминги по фазам. QA release-check lanes являются консультативными, кроме стандартного gate покрытия runtime tools, который блокирует, когда обязательные динамические tools OpenClaw расходятся или исчезают из сводки standard tier.

`OpenClaw Release Checks` использует доверенный ref рабочего процесса, чтобы один раз разрешить выбранный ref в tarball `release-package-under-test`, затем передает этот артефакт в cross-OS checks и Package Acceptance, а также в Docker workflow live/E2E релизного пути, когда выполняется soak-покрытие. Это сохраняет байты пакета согласованными между release boxes и избегает повторной упаковки одного и того же кандидата в нескольких дочерних jobs. Для live lane npm-Plugin Codex release checks либо передают подходящую опубликованную спецификацию Plugin, выведенную из `release_package_spec`, либо передают предоставленную оператором `codex_plugin_spec`, либо оставляют вход пустым, чтобы Docker script упаковал Plugin Codex из выбранного checkout.

Дублирующие запуски `Full Release Validation` для `ref=main` и `rerun_group=all`
заменяют более старый зонтичный процесс. Родительский monitor отменяет любой дочерний рабочий процесс, который
он уже запустил, когда отменяется родитель, поэтому более новая проверка main
не стоит в очереди за устаревшим двухчасовым запуском release-check. Проверка release branch/tag
и сфокусированные группы повторного запуска сохраняют `cancel-in-progress: false`.

## Live- и E2E-шарды

Дочерний release live/E2E сохраняет широкое нативное покрытие `pnpm test:live`, но запускает его как именованные шарды через `scripts/test-live-shard.mjs` вместо одной последовательной job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles`, отфильтрованные по provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- разделенные аудио/видео media-шарды и music-шарды, отфильтрованные по provider

Это сохраняет то же покрытие файлов, при этом делая медленные отказы live provider проще для повторного запуска и диагностики. Имена агрегированных шардов `native-live-extensions-o-z`, `native-live-extensions-media` и `native-live-extensions-media-music` остаются действительными для ручных одноразовых повторных запусков.

Нативные live media-шарды запускаются в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, собранном рабочим процессом `Live Media Runner Image`. Этот image предварительно устанавливает `ffmpeg` и `ffprobe`; media jobs только проверяют бинарные файлы перед setup. Держите Docker-backed live suites на обычных Blacksmith runners — container jobs не подходят для запуска вложенных Docker tests.

Docker-шарды живых моделей/бэкендов используют отдельный общий образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для каждого выбранного коммита. Workflow живого релиза один раз собирает и отправляет этот образ, после чего Docker-шарды живой модели, Gateway с шардингом по провайдерам, CLI-бэкенда, ACP bind и Codex harness запускаются с `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарды Gateway несут явные ограничения `timeout` на уровне скриптов ниже таймаута задания workflow, чтобы зависший контейнер или путь очистки быстро завершался ошибкой, а не расходовал весь бюджет release-check. Если эти шарды независимо пересобирают полный исходный Docker-таргет, запуск релиза настроен неверно и потратит реальное время на дублирующиеся сборки образов.

## Приемка пакета

Используйте `Package Acceptance`, когда вопрос звучит так: «работает ли этот устанавливаемый пакет OpenClaw как продукт?» Это отличается от обычного CI: обычный CI проверяет дерево исходного кода, тогда как приемка пакета проверяет один tarball через тот же Docker E2E harness, который пользователи запускают после установки или обновления.

### Задания

1. `resolve_package` выполняет checkout `workflow_ref`, определяет один кандидат пакета, записывает `.artifacts/docker-e2e-package/openclaw-current.tgz`, записывает `.artifacts/docker-e2e-package/package-candidate.json`, загружает оба файла как артефакт `package-under-test` и выводит источник, workflow ref, package ref, версию, SHA-256 и профиль в сводку шага GitHub.
2. `docker_acceptance` вызывает `openclaw-live-and-e2e-checks-reusable.yml` с `ref=workflow_ref` и `package_artifact_name=package-under-test`. Переиспользуемый workflow скачивает этот артефакт, проверяет инвентарь tarball, при необходимости готовит Docker-образы с digest пакета и запускает выбранные Docker-каналы против этого пакета вместо упаковки checkout workflow. Когда профиль выбирает несколько таргетированных `docker_lanes`, переиспользуемый workflow один раз готовит пакет и общие образы, а затем разветвляет эти каналы в параллельные таргетированные Docker-задания с уникальными артефактами.
3. `package_telegram` опционально вызывает `NPM Telegram Beta E2E`. Он запускается, когда `telegram_mode` не равен `none`, и устанавливает тот же артефакт `package-under-test`, если приемка пакета определила его; автономный dispatch Telegram по-прежнему может установить опубликованную npm-спецификацию.
4. `summary` завершает workflow с ошибкой, если определение пакета, Docker-приемка или опциональный канал Telegram завершились ошибкой.

### Источники кандидатов

- `source=npm` принимает только `openclaw@beta`, `openclaw@latest` или точную версию релиза OpenClaw, например `openclaw@2026.4.27-beta.2`. Используйте это для приемки опубликованных prerelease/stable.
- `source=ref` упаковывает доверенную ветку, тег или полный SHA коммита `package_ref`. Resolver получает ветки/теги OpenClaw, проверяет, что выбранный коммит достижим из истории веток репозитория или тега релиза, устанавливает зависимости в detached worktree и упаковывает его с помощью `scripts/package-openclaw-for-docker.mjs`.
- `source=url` скачивает публичный HTTPS `.tgz`; `package_sha256` обязателен. Этот путь отклоняет учетные данные в URL, нестандартные HTTPS-порты, частные/внутренние/специального назначения имена хостов или разрешенные IP-адреса, а также редиректы за пределы той же публичной политики безопасности.
- `source=trusted-url` скачивает HTTPS `.tgz` из именованной политики доверенного источника в `.github/package-trusted-sources.json`; `package_sha256` и `trusted_source_id` обязательны. Используйте это только для принадлежащих сопровождающим корпоративных зеркал или частных репозиториев пакетов, которым нужны настроенные хосты, порты, префиксы путей, хосты редиректов или разрешение в частной сети. Если политика объявляет bearer-аутентификацию, workflow использует фиксированный секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; учетные данные, встроенные в URL, по-прежнему отклоняются.
- `source=artifact` скачивает один `.tgz` из `artifact_run_id` и `artifact_name`; `package_sha256` необязателен, но его следует указывать для внешне распространяемых артефактов.

Держите `workflow_ref` и `package_ref` раздельно. `workflow_ref` — это доверенный код workflow/harness, который запускает тест. `package_ref` — это исходный коммит, который упаковывается при `source=ref`. Это позволяет текущему тестовому harness проверять более старые доверенные исходные коммиты без запуска старой логики workflow.

### Профили набора

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — полные Docker-чанки release-path с OpenWebUI
- `custom` — точные `docker_lanes`; обязательно, когда `suite_profile=custom`

Профиль `package` использует offline-покрытие plugin, чтобы проверка опубликованного пакета не зависела от доступности живого ClawHub. Опциональный канал Telegram переиспользует артефакт `package-under-test` в `NPM Telegram Beta E2E`, при этом путь опубликованной npm-спецификации сохраняется для автономных dispatch.

Для выделенной политики тестирования обновлений и plugin, включая локальные команды,
Docker-каналы, входные данные приемки пакета, релизные значения по умолчанию и триаж сбоев,
см. [Тестирование обновлений и plugin](/ru/help/testing-updates-plugins).

Release checks вызывают приемку пакета с `source=artifact`, подготовленным артефактом релизного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` и `telegram_mode=mock-openai`. Это удерживает миграцию пакета, обновление, живую установку skill из ClawHub, очистку устаревших зависимостей plugin, восстановление установки настроенного plugin, offline plugin, plugin-update и доказательство Telegram на одном и том же разрешенном tarball пакета. Установите `release_package_spec` в Full Release Validation или OpenClaw Release Checks после публикации беты, чтобы запустить ту же матрицу против отгруженного npm-пакета без пересборки; устанавливайте `package_acceptance_package_spec` только когда приемке пакета нужен пакет, отличный от остальной проверки релиза. Кросс-OS release checks по-прежнему покрывают OS-специфичные onboarding, installer и поведение платформы; продуктовую проверку package/update следует начинать с приемки пакета. Docker-канал `published-upgrade-survivor` проверяет один опубликованный базовый пакет за запуск в блокирующем релизном пути. В приемке пакета разрешенный tarball `package-under-test` всегда является кандидатом, а `published_upgrade_survivor_baseline` выбирает fallback опубликованной baseline, по умолчанию `openclaw@latest`; команды повторного запуска сбойного канала сохраняют эту baseline. Full Release Validation с `run_release_soak=true` или `release_profile=full` устанавливает `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` и `published_upgrade_survivor_scenarios=reported-issues`, чтобы расширить проверку на четыре последние stable npm-релиза плюс зафиксированные релизы границ совместимости plugin и fixtures в форме issues для конфигурации Feishu, сохраненных файлов bootstrap/persona, установок настроенного OpenClaw plugin, путей логов с tilde и устаревших корней зависимостей legacy plugin. Выборки published-upgrade survivor с несколькими baseline шардируются по baseline в отдельные таргетированные Docker runner jobs. Отдельный workflow `Update Migration` использует Docker-канал `update-migration` с `all-since-2026.4.23` и `plugin-deps-cleanup`, когда вопрос заключается в исчерпывающей очистке опубликованных обновлений, а не в обычной широте Full Release CI. Локальные агрегированные запуски могут передавать точные спецификации пакетов через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, оставлять один канал с `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, например `openclaw@2026.4.15`, или устанавливать `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матрицы сценариев. Опубликованный канал настраивает baseline с помощью встроенного рецепта команды `openclaw config set`, записывает шаги рецепта в `summary.json` и проверяет `/healthz`, `/readyz`, а также статус RPC после запуска Gateway. Windows-каналы fresh для packaged и installer также проверяют, что установленный пакет может импортировать переопределение browser-control из необработанного абсолютного пути Windows. Кросс-OS smoke agent-turn OpenAI по умолчанию использует `OPENCLAW_CROSS_OS_OPENAI_MODEL`, если он задан, иначе `openai/gpt-5.5`, поэтому доказательство установки и Gateway остается на тестовой модели GPT-5, избегая значений по умолчанию GPT-4.x.

### Окна legacy-совместимости

Приемка пакета имеет ограниченные окна legacy-совместимости для уже опубликованных пакетов. Пакеты до `2026.4.25` включительно, включая `2026.4.25-beta.*`, могут использовать путь совместимости:

- известные частные записи QA в `dist/postinstall-inventory.json` могут указывать на файлы, не включенные в tarball;
- `doctor-switch` может пропустить подпроверку сохранения `gateway install --wrapper`, когда пакет не предоставляет этот флаг;
- `update-channel-switch` может удалить отсутствующие pnpm `patchedDependencies` из fake git fixture, полученной из tarball, и может логировать отсутствующий сохраненный `update.channel`;
- smoke-тесты plugin могут читать legacy-расположения install-record или принимать отсутствие сохранения marketplace install-record;
- `plugin-update` может разрешать миграцию метаданных конфигурации, при этом по-прежнему требуя, чтобы install record и поведение без переустановки оставались неизменными.

Опубликованный пакет `2026.4.26` также может предупреждать о файлах stamp локальных build metadata, которые уже были отгружены. Более поздние пакеты должны удовлетворять современным контрактам; те же условия завершаются ошибкой вместо предупреждения или пропуска.

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

При отладке сбойного запуска приемки пакета начните со сводки `resolve_package`, чтобы подтвердить источник пакета, версию и SHA-256. Затем изучите дочерний запуск `docker_acceptance` и его Docker-артефакты: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи каналов, timings фаз и команды повторного запуска. Предпочитайте повторный запуск сбойного профиля пакета или точных Docker-каналов вместо повторного запуска полной проверки релиза.

## Install smoke

Отдельный workflow `Install Smoke` переиспользует тот же скрипт области через собственное задание `preflight`. Он разделяет smoke-покрытие на `run_fast_install_smoke` и `run_full_install_smoke`.

- **Быстрый путь** выполняется для pull request, которые затрагивают поверхности Docker/пакетов, изменения пакета/манифеста встроенного Plugin либо поверхности core Plugin/каналов/gateway/Plugin SDK, проверяемые Docker smoke-задачами. Изменения только в исходном коде встроенного Plugin, правки только тестов и правки только документации не резервируют Docker-воркеры. Быстрый путь один раз собирает образ корневого Dockerfile, проверяет CLI, запускает smoke CLI удаления agents shared-workspace, выполняет container gateway-network e2e, проверяет build arg встроенного расширения и запускает ограниченный Docker-профиль встроенного Plugin с совокупным тайм-аутом команды 240 секунд (Docker-запуск каждого сценария ограничен отдельно).
- **Полный путь** сохраняет покрытие установки QR-пакета и Docker/update установщика для ночных запусков по расписанию, ручных dispatch-запусков, release checks через workflow-call и pull request, которые действительно затрагивают поверхности установщика/пакетов/Docker. В полном режиме install-smoke подготавливает или повторно использует один smoke-образ корневого Dockerfile GHCR для целевого SHA, затем запускает установку QR-пакета, smoke-проверки корневого Dockerfile/gateway, smoke-проверки установщика/update и быстрый Docker E2E для встроенного Plugin как отдельные задачи, чтобы работа установщика не ждала за smoke-проверками корневого образа.

Пуши в `main` (включая merge-коммиты) не принуждают полный путь; когда логика changed-scope запрашивала бы полное покрытие при пуше, workflow сохраняет быстрый Docker smoke и оставляет полный install smoke для ночной или релизной валидации.

Медленный smoke Bun global install для image-provider отдельно управляется флагом `run_bun_global_install_smoke`. Он запускается по ночному расписанию и из workflow release checks, а ручные dispatch-запуски `Install Smoke` могут включить его, но pull request и пуши в `main` этого не делают. Обычный PR CI по-прежнему запускает быстрый регрессионный lane Bun launcher для изменений, релевантных Node. QR и Docker-тесты установщика сохраняют собственные Dockerfile, ориентированные на установку.

## Локальный Docker E2E

`pnpm test:docker:all` предварительно собирает один общий live-test образ, один раз упаковывает OpenClaw как npm-тарбол и собирает два общих образа `scripts/e2e/Dockerfile`:

- базовый Node/Git runner для lane установщика/update/plugin-dependency;
- функциональный образ, который устанавливает тот же тарбол в `/app` для обычных функциональных lane.

Определения Docker lane находятся в `scripts/lib/docker-e2e-scenarios.mjs`, логика планировщика находится в `scripts/lib/docker-e2e-plan.mjs`, а runner выполняет только выбранный план. Планировщик выбирает образ для каждого lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` и `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, затем запускает lane с `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Настройки

| Переменная                            | По умолчанию | Назначение                                                                                         |
| ------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10           | Число слотов основного пула для обычных lane.                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Число слотов tail-пула, чувствительного к провайдерам.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9            | Лимит одновременных live lane, чтобы провайдеры не начинали throttling.                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 5            | Лимит одновременных lane установки npm.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7            | Лимит одновременных multi-service lane.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Задержка между стартами lane, чтобы избежать всплесков создания в Docker daemon; задайте `0`, чтобы отключить задержку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000      | Резервный тайм-аут на lane (120 минут); выбранные live/tail lane используют более строгие лимиты. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | не задано    | `1` печатает план планировщика без запуска lane.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`           | не задано    | Список точных lane через запятую; пропускает cleanup smoke, чтобы agents могли воспроизвести один упавший lane. |

Lane, более тяжелый, чем его эффективный лимит, все еще может стартовать из пустого пула, затем выполняется в одиночку, пока не освободит емкость. Локальный совокупный запуск выполняет preflight Docker, удаляет устаревшие контейнеры OpenClaw E2E, выводит статус активных lane, сохраняет времена lane для сортировки longest-first и по умолчанию прекращает планирование новых pooled lane после первого сбоя.

### Переиспользуемый workflow live/E2E

Переиспользуемый workflow live/E2E запрашивает у `scripts/test-docker-all.mjs --plan-json`, какое покрытие пакета, вида образа, live-образа, lane и учетных данных требуется. Затем `scripts/docker-e2e.mjs` преобразует этот план в GitHub outputs и summaries. Он либо упаковывает OpenClaw через `scripts/package-openclaw-for-docker.mjs`, скачивает артефакт пакета из текущего запуска, либо скачивает артефакт пакета из `package_artifact_run_id`; валидирует inventory тарбола; собирает и пушит bare/functional Docker E2E образы GHCR с тегами по digest пакета через Docker layer cache Blacksmith, когда плану нужны lane с установленным пакетом; и повторно использует переданные inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` или существующие образы по digest пакета вместо пересборки. Pull Docker-образов повторяется с ограниченным тайм-аутом 180 секунд на попытку, чтобы зависший поток registry/cache быстро повторился, а не занял большую часть критического пути CI.

### Фрагменты релизного пути

Релизное Docker-покрытие запускает меньшие фрагментированные задачи с `OPENCLAW_SKIP_DOCKER_BUILD=1`, чтобы каждый фрагмент скачивал только нужный ему вид образа и выполнял несколько lane через тот же взвешенный планировщик:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Текущие релизные Docker-фрагменты: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` и от `plugins-runtime-install-a` до `plugins-runtime-install-h`. `package-update-openai` включает live lane пакета Codex Plugin, который устанавливает кандидатный пакет OpenClaw, устанавливает Codex Plugin из `codex_plugin_spec` или тарбола той же ref с явным подтверждением установки Codex CLI, запускает preflight Codex CLI, затем выполняет несколько turns OpenClaw agent в той же сессии против OpenAI. `plugins-runtime-core`, `plugins-runtime` и `plugins-integrations` остаются aggregate-алиасами plugin/runtime. Алиас lane `install-e2e` остается совокупным ручным алиасом повторного запуска для обоих lane установщика провайдера.

OpenWebUI включается в `plugins-runtime-services`, когда полное покрытие release-path запрашивает его, и сохраняет отдельный фрагмент `openwebui` только для dispatch-запусков только OpenWebUI. Lane обновления встроенных каналов повторяют попытку один раз при временных сетевых сбоях npm.

Каждый фрагмент загружает `.artifacts/docker-tests/` с логами lane, timings, `summary.json`, `failures.json`, фазовыми timings, JSON плана планировщика, таблицами slow-lane и командами повторного запуска для каждого lane. Input workflow `docker_lanes` запускает выбранные lane против подготовленных образов вместо chunk-задач, что ограничивает отладку упавшего lane одной целевой Docker-задачей и подготавливает, скачивает или повторно использует артефакт пакета для этого запуска; если выбранный lane является live Docker lane, целевая задача локально собирает live-test образ для этого повторного запуска. Сгенерированные GitHub-команды повторного запуска для каждого lane включают `package_artifact_run_id`, `package_artifact_name` и inputs подготовленных образов, когда эти значения существуют, чтобы упавший lane мог повторно использовать точный пакет и образы из упавшего запуска.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланированный workflow live/E2E ежедневно запускает полный Docker-набор release-path.

## Plugin Prerelease

`Plugin Prerelease` — более дорогое покрытие продукта/пакетов, поэтому это отдельный workflow, запускаемый `Full Release Validation` или явным оператором. Обычные pull request, пуши в `main` и автономные ручные dispatch-запуски CI не включают этот набор. Он балансирует тесты встроенных Plugin между восемью воркерами расширений; эти shard-задачи расширений запускают до двух групп конфигураций Plugin одновременно с одним Vitest worker на группу и увеличенной heap Node, чтобы import-heavy пакеты Plugin не создавали дополнительные CI-задачи. Релизный Docker prerelease path группирует целевые Docker lane небольшими группами, чтобы не резервировать десятки runners для задач длительностью от одной до трех минут. Workflow также загружает информационный артефакт `plugin-inspector-advisory` из `@openclaw/plugin-inspector`; findings инспектора являются входными данными для triage и не меняют блокирующий gate Plugin Prerelease.

## QA Lab

QA Lab имеет выделенные CI lane вне основного smart-scoped workflow. Agentic parity вложен в широкие QA и релизные harnesses, а не является отдельным PR workflow. Используйте `Full Release Validation` с `rerun_group=qa-parity`, когда parity должен выполняться вместе с широким validation run.

- Workflow `QA-Lab - All Lanes` запускается каждую ночь на `main` и при ручном dispatch; он разворачивает mock parity lane, live Matrix lane, а также live Telegram и Discord lane как параллельные задачи. Live-задачи используют окружение `qa-live-shared`, а Telegram/Discord используют Convex leases.

Release checks запускают live transport lane Matrix и Telegram с детерминированным mock provider и mock-qualified моделями (`mock-openai/gpt-5.5` и `mock-openai/gpt-5.5-alt`), чтобы контракт канала был изолирован от задержки live model и обычного старта provider-plugin. Live transport gateway отключает memory search, потому что QA parity отдельно покрывает поведение memory; connectivity провайдера покрывается отдельными наборами live model, native provider и Docker provider.

Matrix использует `--profile fast` для scheduled и release gates, добавляя `--fail-fast` только когда checked-out CLI поддерживает это. CLI default и input ручного workflow остаются `all`; ручной dispatch `matrix_profile=all` всегда шардирует полное покрытие Matrix на задачи `transport`, `media`, `e2ee-smoke`, `e2ee-deep` и `e2ee-cli`.

`OpenClaw Release Checks` также запускает release-critical lane QA Lab перед approval релиза; его QA parity gate запускает candidate и baseline packs как параллельные lane-задачи, затем скачивает оба артефакта в небольшую report-задачу для финального сравнения parity.

Для обычных PR следуйте scoped CI/check evidence вместо того, чтобы считать parity обязательным статусом.

## CodeQL

Workflow `CodeQL` намеренно является узким security scanner первого прохода, а не полным sweep репозитория. Ежедневные, ручные и guard-запуски недрафтовых pull request сканируют код Actions workflow плюс JavaScript/TypeScript поверхности с наибольшим риском, используя high-confidence security queries, отфильтрованные до high/critical `security-severity`.

Guard pull request остается легким: он стартует только для изменений в `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` или путях runtime встроенного Plugin, владеющих process, и запускает ту же high-confidence security matrix, что и scheduled workflow. Android и macOS CodeQL не входят в PR defaults.

### Категории безопасности

| Категория                                        | Поверхность                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Базовая поверхность Auth, секретов, песочницы, Cron и Gateway                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Контракты реализации каналов ядра, а также среда выполнения Plugin каналов, Gateway, Plugin SDK, секреты, точки аудита             |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхности политики SSRF ядра, разбора IP, сетевой защиты, web-fetch и SSRF в Plugin SDK                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-серверы, помощники выполнения процессов, исходящая доставка и шлюзы выполнения инструментов агента                             |
| `/codeql-security-high/process-exec-boundary`     | Локальная оболочка, помощники запуска процессов, среды выполнения комплектных Plugin, владеющие подпроцессами, и связующий код сценариев workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхности доверия установки Plugin, загрузчика, манифеста, реестра, установки через пакетный менеджер, загрузки исходников и пакетного контракта Plugin SDK |

### Платформо-зависимые security-шарды

- `CodeQL Android Critical Security` — запланированный Android security-шард. Собирает Android-приложение вручную для CodeQL на минимальном Linux-раннере Blacksmith, допустимом проверкой корректности workflow. Загружает данные в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — еженедельный/ручной macOS security-шард. Собирает macOS-приложение вручную для CodeQL на Blacksmith macOS, отфильтровывает результаты сборки зависимостей из загружаемого SARIF и загружает данные в `/codeql-critical-security/macos`. Оставлен вне ежедневных значений по умолчанию, потому что сборка macOS доминирует по времени выполнения даже при чистом результате.

### Категории Critical Quality

`CodeQL Critical Quality` — соответствующий не-security шард. Он запускает только quality-запросы JavaScript/TypeScript с severity error и без security-тематики по узким высокоценным поверхностям на Linux-раннерах GitHub-hosted, чтобы quality-сканирования не расходовали бюджет регистрации раннеров Blacksmith. Его guard для pull request намеренно меньше запланированного профиля: для non-draft PR запускаются только соответствующие шарды `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` и `plugin-sdk-reply-runtime` для изменений кода выполнения команд/моделей/инструментов агента и диспетчеризации ответов, кода схемы/миграций/IO конфигурации, кода auth/секретов/песочницы/security, ядра каналов и комплектной среды выполнения Plugin каналов, протокола Gateway/методов сервера, связующего кода memory runtime/SDK, MCP/process/исходящей доставки, среды выполнения provider/каталога моделей, диагностики сессий/очередей доставки, загрузчика Plugin, Plugin SDK/пакетного контракта или среды выполнения ответов Plugin SDK. Изменения конфигурации CodeQL и quality-workflow запускают все двенадцать quality-шардов PR.

Ручной запуск принимает:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Узкие профили — это хуки для обучения/итерации, позволяющие запускать один quality-шард изолированно.

| Категория                                              | Поверхность                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код границы безопасности Auth, секретов, песочницы, Cron и Gateway                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Схема конфигурации, миграция, нормализация и IO-контракты                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схемы протокола Gateway и контракты методов сервера                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракты реализации каналов ядра и комплектных Plugin каналов                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Выполнение команд, диспетчеризация моделей/provider, диспетчеризация и очереди автоответов, а также контракты среды выполнения control plane ACP                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-серверы и мосты инструментов, помощники надзора за процессами и контракты исходящей доставки                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасады memory runtime, псевдонимы memory Plugin SDK, связующий код активации memory runtime и команды memory doctor                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутренности очереди ответов, очереди доставки сессий, помощники привязки/доставки исходящих сессий, поверхности диагностических событий/пакетов логов и CLI-контракты session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризация входящих ответов Plugin SDK, помощники payload/нарезки/runtime для ответов, параметры ответов каналов, очереди доставки и помощники привязки сессий/потоков |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормализация каталога моделей, auth и discovery provider, регистрация среды выполнения provider, значения по умолчанию/каталоги provider и реестры web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальная персистентность, потоки управления Gateway и контракты среды выполнения task control plane                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракты среды выполнения core web fetch/search, media IO, понимания медиа, генерации изображений и генерации медиа                                             |
| `/codeql-critical-quality/plugin-boundary`              | Контракты загрузчика, реестра, публичной поверхности и точки входа Plugin SDK                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Исходный код Plugin SDK на стороне опубликованного пакета и помощники контракта пакета Plugin                                                                     |

Quality остается отделенным от security, чтобы quality-находки можно было планировать, измерять, отключать или расширять без затемнения security-сигнала. Расширение CodeQL для Swift, Python и комплектных Plugin следует возвращать как scoped- или шардированную последующую работу только после того, как узкие профили получат стабильное время выполнения и сигнал.

## Workflow обслуживания

### Docs Agent

Workflow `Docs Agent` — событийно-управляемая линия обслуживания Codex для поддержания существующей документации в соответствии с недавно влитыми изменениями. У него нет чистого расписания: успешный CI-запуск после non-bot push в `main` может запустить его, а ручной dispatch может запустить его напрямую. Вызовы workflow-run пропускаются, когда `main` уже продвинулся дальше или когда за последний час был создан другой непропущенный запуск Docs Agent. При запуске он проверяет диапазон коммитов от предыдущего исходного SHA непропущенного Docs Agent до текущего `main`, так что один ежечасный запуск может покрыть все изменения main, накопленные с последнего прохода по документации.

### Test Performance Agent

Workflow `Test Performance Agent` — событийно-управляемая линия обслуживания Codex для медленных тестов. У него нет чистого расписания: успешный CI-запуск после non-bot push в `main` может запустить его, но он пропускается, если другой вызов workflow-run уже выполнялся или выполняется в этот UTC-день. Ручной dispatch обходит этот дневной gate активности. Линия строит сгруппированный отчет производительности Vitest для полного набора, позволяет Codex вносить только небольшие исправления производительности тестов с сохранением покрытия вместо широких рефакторингов, затем повторно запускает отчет полного набора и отклоняет изменения, уменьшающие базовое количество проходящих тестов. Сгруппированный отчет записывает wall time по конфигурациям и максимальный RSS на Linux и macOS, поэтому сравнение до/после показывает дельты памяти тестов рядом с дельтами длительности. Если в baseline есть падающие тесты, Codex может исправлять только очевидные сбои, а отчет полного набора после агента должен проходить до фиксации чего-либо в коммите. Когда `main` продвигается до того, как bot push попадает в репозиторий, линия делает rebase проверенного патча, повторно запускает `pnpm check:changed` и повторяет push; конфликтующие устаревшие патчи пропускаются. Она использует GitHub-hosted Ubuntu, чтобы Codex action мог сохранять ту же позицию безопасности drop-sudo, что и docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — ручной maintainer workflow для очистки дубликатов после landing. По умолчанию он работает в dry-run и закрывает только явно перечисленные PR, когда `apply=true`. Перед изменением GitHub он проверяет, что landed PR влит и что каждый дубликат имеет либо общую referenced issue, либо пересекающиеся измененные hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальные check-gates и маршрутизация изменений

Локальная логика changed-lane находится в `scripts/changed-lanes.mjs` и выполняется `scripts/check-changed.mjs`. Этот локальный check gate строже относится к архитектурным границам, чем широкий платформенный scope CI:

- изменения production-кода ядра запускают typecheck core prod и core test, а также core lint/guards;
- изменения только тестов ядра запускают только typecheck core test и core lint;
- изменения production-кода extension запускают typecheck extension prod и extension test, а также extension lint;
- изменения только тестов extension запускают typecheck extension test и extension lint;
- изменения публичного Plugin SDK или plugin-contract расширяются до typecheck extension, потому что extensions зависят от этих контрактов ядра (обходы Vitest для extension остаются явной тестовой работой);
- version bumps только release metadata запускают целевые проверки version/config/root-dependency;
- неизвестные изменения root/config fail-safe направляются во все check lanes.

Локальная маршрутизация changed-test находится в `scripts/test-projects.test-support.mjs` и намеренно дешевле, чем `check:changed`: прямые изменения тестов запускают сами себя, изменения исходников предпочитают явные mappings, затем sibling tests и dependents из import graph. Общая конфигурация доставки group-room — один из явных mappings: изменения видимой группе конфигурации reply, режима доставки source reply или системного prompt message-tool проходят через тесты core reply плюс регрессии доставки Discord и Slack, чтобы изменение общего значения по умолчанию падало до первого PR push. Используйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только когда изменение настолько широко затрагивает harness, что дешевый mapped set не является надежным proxy.

## Валидация Testbox

Crabbox — это принадлежащая репозиторию обертка для удаленных машин, используемая мейнтейнерами для подтверждения в Linux. Используйте ее
из корня репозитория, когда проверка слишком широка для локального цикла редактирования, когда важен
паритет с CI, или когда подтверждению нужны секреты, Docker, пакетные линии,
переиспользуемые машины или удаленные логи. Обычный backend OpenClaw —
`blacksmith-testbox`; собственные мощности AWS/Hetzner — это резервный вариант на случай сбоев Blacksmith,
проблем с квотами или явного тестирования на собственных мощностях.

Запуски Blacksmith через Crabbox прогревают, резервируют, синхронизируют, запускают, формируют отчет и очищают
одноразовые Testbox. Встроенная проверка корректности синхронизации быстро завершается ошибкой, когда обязательные
корневые файлы, такие как `pnpm-lock.yaml`, исчезают или когда `git status --short`
показывает не менее 200 отслеживаемых удалений. Для PR с намеренными массовыми удалениями задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для удаленной команды.

Crabbox также завершает локальный вызов Blacksmith CLI, который остается на этапе
синхронизации более пяти минут без вывода после синхронизации. Задайте
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, чтобы отключить эту защиту, или используйте большее
значение в миллисекундах для необычно больших локальных diff.

Перед первым запуском проверьте обертку из корня репозитория:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обертка репозитория отклоняет устаревший бинарник Crabbox, который не объявляет `blacksmith-testbox`. Передавайте provider явно, даже если в `.crabbox.yaml` есть значения по умолчанию для собственного облака. В рабочих деревьях Codex или связанных/разреженных checkout избегайте локального скрипта `pnpm crabbox:run`, потому что pnpm может согласовать зависимости до запуска Crabbox; вместо этого вызывайте node-обертку напрямую:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Запуски на базе Blacksmith требуют Crabbox 0.22.0 или новее, чтобы обертка получала текущее поведение синхронизации, очереди и очистки Testbox. При использовании соседнего checkout пересоберите игнорируемый локальный бинарник перед замерами времени или работой с подтверждением:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Проверка измененных файлов:

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

Повторный запуск сфокусированного теста:

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

Полный набор:

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

Прочитайте итоговую JSON-сводку. Полезные поля: `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` и `totalMs`. Для делегированных
запусков Blacksmith Testbox код выхода обертки Crabbox и JSON-сводка являются
результатом команды. Связанный запуск GitHub Actions отвечает за гидратацию и keepalive; он
может завершиться как `cancelled`, когда Testbox останавливают извне после того, как SSH-команда
уже вернулась. Считайте это артефактом очистки/статуса, если только
`exitCode` обертки не ненулевой или вывод команды не показывает упавший тест.
Одноразовые запуски Crabbox на базе Blacksmith должны останавливать Testbox автоматически;
если запуск прерван или очистка неясна, проверьте живые машины и останавливайте только
те машины, которые создали вы:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Используйте повторное использование только когда вам намеренно нужно несколько команд на одной и той же гидратированной машине:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Если сломанным слоем является Crabbox, но сам Blacksmith работает, используйте прямой
Blacksmith только для диагностики, такой как `list`, `status` и очистка. Исправьте
путь Crabbox, прежде чем считать прямой запуск Blacksmith мейнтейнерским подтверждением.

Если `blacksmith testbox list --all` и `blacksmith testbox status` работают, но новые
прогревы остаются в `queued` без IP или URL запуска Actions через пару минут,
считайте это нагрузкой на provider Blacksmith, очередь, биллинг или лимит организации. Остановите
созданные вами queued id, не запускайте новые Testbox и перенесите подтверждение на
путь собственных мощностей Crabbox ниже, пока кто-то проверяет панель Blacksmith,
биллинг и лимиты организации.

Переходите на собственные мощности Crabbox только когда Blacksmith недоступен, ограничен квотой, не имеет нужного окружения или собственные мощности являются явной целью:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

При нагрузке на AWS избегайте `class=beast`, если задаче действительно не нужен CPU класса 48xlarge. Запрос `beast` начинается со 192 vCPU и является самым простым способом упереться в региональную квоту EC2 Spot или On-Demand Standard. Принадлежащий репозиторию `.crabbox.yaml` по умолчанию использует `standard`, несколько регионов мощностей и `capacity.hints: true`, чтобы брокерские аренды AWS выводили выбранные регион/рынок, нагрузку на квоты, fallback на Spot и предупреждения о классах с высокой нагрузкой. Используйте `fast` для более тяжелых широких проверок, `large` только после того, как standard/fast недостаточно, и `beast` только для исключительных CPU-bound линий, таких как полный набор тестов или Docker-матрицы всех plugins, явная release/blocker-валидация или профилирование производительности с большим числом ядер. Не используйте `beast` для `pnpm check:changed`, сфокусированных тестов, работы только с документацией, обычного lint/typecheck, небольших E2E-репродукций или triage сбоя Blacksmith. Используйте `--market on-demand` для диагностики мощностей, чтобы колебания рынка Spot не смешивались с сигналом.

`.crabbox.yaml` отвечает за значения по умолчанию для provider, синхронизации и гидратации GitHub Actions в линиях собственного облака. Он исключает локальный `.git`, чтобы гидратированный checkout Actions сохранял собственные удаленные Git-метаданные вместо синхронизации локальных для мейнтейнера remotes и object stores, а также исключает локальные runtime/build-артефакты, которые никогда не должны передаваться. `.github/workflows/crabbox-hydrate.yml` отвечает за checkout, настройку Node/pnpm, fetch `origin/main` и передачу несекретного окружения для команд собственного облака `crabbox run --id <cbx_id>`.

## Связанное

- [Обзор установки](/ru/install)
- [Каналы разработки](/ru/install/development-channels)
