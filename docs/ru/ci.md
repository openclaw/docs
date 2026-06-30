---
read_when:
    - Вам нужно понять, почему задание CI запустилось или не запустилось
    - Вы отлаживаете неуспешную проверку GitHub Actions
    - Вы координируете прогон или повторный прогон проверки релиза
    - Вы изменяете диспетчеризацию ClawSweeper или перенаправление активности GitHub
summary: Граф заданий CI, проверки области действия, зонтичные релизы и локальные эквиваленты команд
title: Конвейер CI
x-i18n:
    generated_at: "2026-06-30T14:15:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускается при каждом push в `main` и для каждого pull request. Канонические
push в `main` сначала проходят через 90-секундное окно допуска hosted-runner.
Существующая concurrency group `CI` отменяет ожидающий запуск, когда появляется более новый
commit, поэтому последовательные merge не регистрируют каждый полную матрицу Blacksmith.
Pull request и ручные dispatch пропускают ожидание. Затем job `preflight`
классифицирует diff и отключает затратные lanes, когда изменились только несвязанные
области. Ручные запуски `workflow_dispatch` намеренно обходят умное
ограничение scope и разворачивают полный граф для release candidate и широкой
валидации. Android lanes остаются opt-in через `include_android`. Покрытие плагинов
только для релиза находится в отдельном workflow [`Plugin Prerelease`](#plugin-prerelease)
и запускается только из [`Full Release Validation`](#full-release-validation)
или явного ручного dispatch.

## Обзор pipeline

| Job                                | Назначение                                                                                                   | Когда запускается                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Обнаруживает изменения только в docs, измененные scopes, измененные extensions и строит CI manifest                   | Всегда на non-draft push и PR                  |
| `runner-admission`                 | Hosted 90-секундный debounce для канонических push в `main` перед регистрацией работы Blacksmith                | Каждый запуск CI; sleep только на канонических push в `main` |
| `security-fast`                    | Обнаружение private key, аудит измененных workflow через `zizmor` и аудит production lockfile                 | Всегда на non-draft push и PR                  |
| `check-dependencies`               | Production Knip dependency-only pass плюс guard allowlist для неиспользуемых файлов                                 | Изменения, релевантные Node                               |
| `build-artifacts`                  | Сборка `dist/`, Control UI, smoke checks built-CLI, embedded built-artifact checks и reusable artifacts | Изменения, релевантные Node                               |
| `checks-fast-core`                 | Быстрые Linux correctness lanes, такие как bundled, protocol, QA Smoke CI и проверки CI-routing                | Изменения, релевантные Node                               |
| `checks-fast-contracts-plugins-*`  | Две sharded проверки контрактов плагинов                                                                        | Изменения, релевантные Node                               |
| `checks-fast-contracts-channels-*` | Две sharded проверки контрактов каналов                                                                       | Изменения, релевантные Node                               |
| `checks-node-core-*`               | Shards тестов core Node, исключая channel, bundled, contract и extension lanes                          | Изменения, релевантные Node                               |
| `check-*`                          | Sharded эквивалент основного локального gate: prod types, lint, guards, test types и strict smoke                | Изменения, релевантные Node                               |
| `check-additional-*`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary и runtime topology     | Изменения, релевантные Node                               |
| `checks-node-compat-node22`        | Сборка совместимости Node 22 и smoke lane                                                                | Ручной CI dispatch для релизов                     |
| `check-docs`                       | Форматирование docs, lint и проверки broken links                                                             | Изменились docs                                        |
| `skills-python`                    | Ruff + pytest для Skills на базе Python                                                                    | Изменения, релевантные Python skills                       |
| `checks-windows`                   | Специфичные для Windows тесты process/path плюс регрессии shared runtime import specifier                      | Изменения, релевантные Windows                            |
| `macos-node`                       | macOS TypeScript test lane с использованием общих built artifacts                                               | Изменения, релевантные macOS                              |
| `macos-swift`                      | Swift lint, build и tests для приложения macOS                                                            | Изменения, релевантные macOS                              |
| `ios-build`                        | Генерация Xcode project плюс simulator build приложения iOS                                                 | Приложение iOS, shared app kit или изменения Swabble         |
| `android`                          | Android unit tests для обоих flavors плюс одна debug APK build                                              | Изменения, релевантные Android                            |
| `test-performance-agent`           | Ежедневная оптимизация медленных тестов Codex после trusted activity                                                 | Успех Main CI или ручной dispatch                  |
| `openclaw-performance`             | Ежедневные/on-demand отчеты производительности Kova runtime с mock-provider, deep-profile и GPT 5.5 live lanes | Scheduled и ручной dispatch                       |

## Порядок fail-fast

1. `runner-admission` ждет только канонические push в `main`; более новый push отменяет запуск до регистрации Blacksmith.
2. `preflight` решает, какие lanes вообще существуют. Логика `docs-scope` и `changed-scope` является шагами внутри этого job, а не отдельными jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` и `skills-python` быстро завершаются с ошибкой, не ожидая более тяжелые jobs матрицы artifacts и platform.
4. `build-artifacts` перекрывается с быстрыми Linux lanes, чтобы downstream consumers могли стартовать сразу после готовности общей сборки.
5. Более тяжелые platform и runtime lanes разворачиваются после этого: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` и `android`.

GitHub может помечать замененные jobs как `cancelled`, когда более новый push попадает в тот же PR или ref `main`. Считайте это шумом CI, если только самый новый запуск для того же ref также не падает. Matrix jobs используют `fail-fast: false`, а `build-artifacts` сообщает failures embedded channel, core-support-boundary и gateway-watch напрямую вместо постановки в очередь небольших verifier jobs. Автоматический ключ concurrency CI версионирован (`CI-v7-*`), чтобы GitHub-side zombie в старой queue group не мог бесконечно блокировать более новые main runs. Ручные запуски полного suite используют `CI-manual-v1-*` и не отменяют уже выполняющиеся runs.

Используйте `pnpm ci:timings`, `pnpm ci:timings:recent` или `node scripts/ci-run-timings.mjs <run-id>`, чтобы суммировать wall time, queue time, самые медленные jobs, failures и fanout barrier `pnpm-store-warmup` из GitHub Actions. CI также загружает ту же сводку запуска как artifact `ci-timings-summary`. Для timing сборки проверьте шаг `Build dist` в job `build-artifacts`: `pnpm build:ci-artifacts` печатает `[build-all] phase timings:` и включает `ui:build`; job также загружает artifact `startup-memory`.

Для запусков pull request терминальный job timing-summary запускает helper из trusted base revision перед передачей `GH_TOKEN` в `gh run view`. Это удерживает tokened query вне кода, контролируемого branch, и при этом суммирует текущий CI run pull request.

## Контекст PR и evidence

PR внешних contributors запускают gate контекста PR и evidence из
`.github/workflows/real-behavior-proof.yml`. Workflow делает checkout trusted
base commit и оценивает только body PR; он не выполняет код из branch
contributor.

Gate применяется к авторам PR, которые не являются repository owners, members,
collaborators или bots. Он проходит, когда body PR содержит авторские разделы
`What Problem This Solves` и `Evidence`. Evidence может быть focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log или artifact link. Body предоставляет intent и полезную validation;
reviewers проверяют code, tests и CI, чтобы оценить correctness.

Когда check fails, обновите body PR вместо push еще одного code commit.

## Scope и routing

Логика scope находится в `scripts/ci-changed-scope.mjs` и покрыта unit tests в `src/scripts/ci-changed-scope.test.ts`. Ручной dispatch пропускает changed-scope detection и заставляет preflight manifest работать так, как если бы изменилась каждая scoped area.

- **Правки CI workflow** валидируют граф Node CI плюс workflow linting, но сами по себе не форсируют Windows, iOS, Android или macOS native builds; эти platform lanes остаются ограниченными изменениями platform source.
- **Проверка корректности workflow** запускает `actionlint`, `zizmor` по всем workflow YAML files, composite-action interpolation guard и conflict-marker guard. PR-scoped job `security-fast` также запускает `zizmor` по измененным workflow files, чтобы findings безопасности workflow падали рано в основном графе CI.
- **Docs при push в `main`** проверяются standalone workflow `Docs` с тем же ClawHub docs mirror, который используется CI, поэтому смешанные code+docs push не ставят дополнительно shard CI `check-docs` в очередь. Pull requests и ручной CI по-прежнему запускают `check-docs` из CI, когда docs изменились.
- **TUI PTY** запускается в Linux Node shard `checks-node-core-runtime-tui-pty` для изменений TUI. Shard запускает `test/vitest/vitest.tui-pty.config.ts` с `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, поэтому покрывает как deterministic lane fixture `TuiBackend`, так и более медленный smoke `tui --local`, который mock только external model endpoint.
- **Правки только CI routing, выбранные дешевые правки core-test fixtures и узкие правки plugin contract helper/test-routing** используют быстрый manifest path только для Node: `preflight`, security и единственную задачу `checks-fast-core`. Этот path пропускает build artifacts, совместимость Node 22, channel contracts, полные core shards, bundled-plugin shards и дополнительные guard matrices, когда изменение ограничено routing или helper surfaces, которые fast task проверяет напрямую.
- **Windows Node checks** ограничены специфичными для Windows wrappers process/path, helpers npm/pnpm/UI runner, config package manager и surfaces CI workflow, которые выполняют этот lane; unrelated source, plugin, install-smoke и test-only changes остаются на Linux Node lanes.

Самые медленные семейства тестов Node разделены или сбалансированы так, чтобы каждая задача оставалась небольшой без чрезмерного резервирования раннеров: контракты Plugin и контракты каналов запускаются как два взвешенных шарда с поддержкой Blacksmith каждый со стандартным резервным GitHub-раннером, быстрые/вспомогательные линии core unit выполняются отдельно, инфраструктура core runtime разделена между state, process/config, shared и тремя доменными шардами cron, auto-reply запускается как сбалансированные воркеры (при этом поддерево reply разделено на шарды agent-runner, dispatch и commands/state-routing), а agentic gateway/server configs разделены по линиям chat/auth/model/http-plugin/runtime/startup вместо ожидания собранных артефактов. Затем обычный CI упаковывает только изолированные infra-шарды с include-паттернами в детерминированные пакеты максимум по 64 тестовых файла, сокращая матрицу Node без объединения неизолированных наборов command/cron, stateful agents-core или gateway/server; тяжелые фиксированные наборы остаются на 8 vCPU, а пакетные и менее тяжелые линии используют 4 vCPU. Pull requests в каноническом репозитории используют дополнительный компактный admission-план: те же группы по конфигурациям запускаются в изолированных подпроцессах внутри текущего Linux Node-плана из 34 задач, поэтому один PR не регистрирует полную Node-матрицу из более чем 70 задач. Пуши в `main`, ручные dispatch-запуски и release gates сохраняют полную матрицу. Широкие браузерные, QA, media и прочие тесты Plugin используют свои выделенные конфигурации Vitest вместо общего plugin catch-all. Include-pattern-шарды записывают записи таймингов с именем CI-шарда, поэтому `.artifacts/vitest-shard-timings.json` может отличать целую конфигурацию от отфильтрованного шарда. `check-additional-*` держит package-boundary compile/canary-работу вместе и отделяет архитектуру runtime topology от покрытия gateway watch; список boundary guard распределен полосами на один prompt-heavy-шард и один объединенный шард для остальных guard-полос, каждый из которых запускает выбранные независимые guards параллельно и печатает тайминги по каждой проверке. Дорогая проверка drift для Codex happy-path prompt snapshot запускается как отдельная additional-задача только для ручного CI и изменений, влияющих на prompt, поэтому обычные несвязанные изменения Node не ждут холодной генерации prompt snapshot, а boundary-шарды остаются сбалансированными, при этом prompt drift по-прежнему привязан к PR, который его вызвал; тот же флаг пропускает генерацию prompt snapshot Vitest внутри built-artifact core support-boundary-шарда. Gateway watch, тесты каналов и core support-boundary-шард запускаются параллельно внутри `build-artifacts` после того, как `dist/` и `dist-runtime/` уже собраны.

После допуска канонический Linux CI разрешает до 24 одновременных задач тестов Node и
12 для меньших fast/check-линий; Windows и Android остаются на двух, потому что
эти пулы раннеров уже.

Компактный PR-план создает 18 задач Node для текущего набора: группы whole-config
объединяются в пакеты в изолированных подпроцессах с batch-timeout 120 минут,
а include-pattern-группы используют тот же ограниченный бюджет задач.

Android CI запускает и `testPlayDebugUnitTest`, и `testThirdPartyDebugUnitTest`, а затем собирает Play debug APK. У third-party flavor нет отдельного source set или manifest; его линия unit-test все равно компилирует flavor с BuildConfig-флагами SMS/call-log, избегая при этом дублирующей задачи упаковки debug APK при каждом Android-релевантном пуше.

Шард `check-dependencies` запускает `pnpm deadcode:dependencies` (production Knip-проход только по зависимостям, закрепленный на последней версии Knip, с отключенным минимальным возрастом релиза pnpm для установки через `dlx`) и `pnpm deadcode:unused-files`, который сравнивает production-находки Knip по неиспользуемым файлам с `scripts/deadcode-unused-files.allowlist.mjs`. Guard неиспользуемых файлов падает, когда PR добавляет новый непроверенный неиспользуемый файл или оставляет устаревшую запись allowlist, при этом сохраняя намеренные поверхности динамических Plugin, сгенерированные, сборочные, live-test и package bridge, которые Knip не может разрешить статически.

## Пересылка активности ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — это целевой мост из активности репозитория OpenClaw в ClawSweeper. Он не выполняет checkout и не запускает недоверенный код pull request. Workflow создает токен GitHub App из `CLAWSWEEPER_APP_PRIVATE_KEY`, затем отправляет компактные payload `repository_dispatch` в `openclaw/clawsweeper`.

У workflow есть четыре линии:

- `clawsweeper_item` для точных запросов на проверку issue и pull request;
- `clawsweeper_comment` для явных команд ClawSweeper в комментариях issue;
- `clawsweeper_commit_review` для запросов проверки на уровне commit при пушах в `main`;
- `github_activity` для общей активности GitHub, которую агент ClawSweeper может инспектировать.

Линия `github_activity` пересылает только нормализованные метаданные: тип события, действие, actor, репозиторий, номер элемента, URL, заголовок, состояние и короткие фрагменты комментариев или review, если они есть. Она намеренно избегает пересылки полного тела webhook. Принимающий workflow в `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`; он отправляет нормализованное событие в OpenClaw Gateway hook для агента ClawSweeper.

Общая активность — это наблюдение, а не доставка по умолчанию. Агент ClawSweeper получает цель Discord в своем prompt и должен писать в `#clawsweeper` только когда событие неожиданное, требует действия, рискованное или операционно полезное. Обычные открытия, правки, bot churn, шум дублирующихся webhook и обычный review-трафик должны приводить к `NO_REPLY`.

Считайте заголовки GitHub, комментарии, bodies, текст review, имена веток и сообщения commit недоверенными данными на всем этом пути. Это входные данные для суммаризации и triage, а не инструкции для workflow или runtime агента.

## Ручные dispatch-запуски

Ручные CI dispatch-запуски выполняют тот же граф задач, что и обычный CI, но принудительно включают каждую не-Android scoped-линию: Linux Node-шарды, шарды bundled-plugin, шарды контрактов Plugin и каналов, совместимость Node 22, `check-*`, `check-additional-*`, smoke checks собранных артефактов, проверки документации, Python Skills, Windows, macOS, сборку iOS и Control UI i18n. Самостоятельные ручные CI dispatch-запуски выполняют Android только с `include_android=true`; полный release umbrella включает Android, передавая `include_android=true`. Статические проверки plugin prerelease, release-only-шард `agentic-plugins`, полный extension batch sweep и plugin prerelease Docker-линии исключены из CI. Набор Docker prerelease запускается только когда `Full Release Validation` dispatch-запускает отдельный workflow `Plugin Prerelease` с включенным release-validation gate.

Ручные запуски используют уникальную concurrency group, поэтому полный набор release-candidate не отменяется другим пушем или PR-запуском на той же ref. Необязательный вход `target_ref` позволяет доверенному вызывающему запустить этот граф для ветки, тега или полного commit SHA, используя файл workflow из выбранной dispatch-ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Раннеры

| Раннер                          | Задачи                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ручной CI dispatch и fallback для неканонических репозиториев, CodeQL JavaScript/actions quality scans, workflow-sanity, labeler, auto-response, docs workflows вне CI и install-smoke preflight, чтобы матрица Blacksmith могла встать в очередь раньше                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, менее тяжелые extension-шарды, `checks-fast-core`, шарды контрактов Plugin/каналов, большинство bundled/менее тяжелых Linux Node-шардов, `check-guards`, `check-prod-types`, `check-test-types`, выбранные шарды `check-additional-*` и `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Сохраненные тяжелые наборы Linux Node, boundary/extension-heavy-шарды `check-additional-*` и `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (достаточно чувствителен к CPU, чтобы 8 vCPU стоили больше, чем экономили); Docker-сборки install-smoke (время очереди 32-vCPU стоило больше, чем экономило)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` в `openclaw/openclaw`; форки используют fallback на `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` и `ios-build` в `openclaw/openclaw`; форки используют fallback на `macos-26`                                                                                                                                                                                                  |

## Бюджет регистрации раннеров

Текущий bucket регистрации GitHub-раннеров OpenClaw сообщает 10 000 регистраций self-hosted
раннеров за 5 минут в `ghx api rate_limit`. Перепроверяйте
`actions_runner_registration` перед каждым проходом настройки, потому что GitHub может изменить
этот bucket. Лимит общий для всех регистраций Blacksmith-раннеров в организации
`openclaw`, поэтому добавление еще одной установки Blacksmith не добавляет
новый bucket.

Считайте Blacksmith labels дефицитным ресурсом для контроля burst. Задачи, которые
только маршрутизируют, уведомляют, суммаризируют, выбирают шарды или запускают короткие CodeQL scans, должны
оставаться на GitHub-hosted раннерах, если у них нет измеренной Blacksmith-specific
потребности. Любая новая матрица Blacksmith, больший `max-parallel` или high-frequency
workflow должны показывать свой worst-case count регистраций и удерживать target уровня org
ниже примерно 60% live bucket. При текущем bucket в 10 000 регистраций
это означает operational target в 6 000 регистраций, оставляя запас для
параллельных репозиториев, повторов и перекрытия burst.

CI канонического репозитория сохраняет Blacksmith как default runner path для обычных запусков push и pull-request. `workflow_dispatch` и запуски неканонических репозиториев используют GitHub-hosted раннеры, но обычные канонические запуски сейчас не проверяют здоровье очереди Blacksmith и не выполняют автоматический fallback на GitHub-hosted labels, когда Blacksmith недоступен.

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

`OpenClaw Performance` — это рабочий процесс производительности продукта/среды выполнения. Он ежедневно запускается на `main` и может быть запущен вручную:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручной запуск обычно выполняет бенчмарки для ref рабочего процесса. Задайте `target_ref`, чтобы протестировать тег релиза или другую ветку с текущей реализацией рабочего процесса. Пути опубликованных отчетов и указатели на последние версии привязаны к тестируемому ref, а каждый `index.md` фиксирует тестируемый ref/SHA, ref/SHA рабочего процесса, ref Kova, профиль, режим авторизации lane, модель, число повторов и фильтры сценариев.

Рабочий процесс устанавливает OCM из закрепленного релиза и Kova из `openclaw/Kova` по закрепленному входному параметру `kova_ref`, затем запускает три lane:

- `mock-provider`: диагностические сценарии Kova против локально собранной среды выполнения с детерминированной фиктивной OpenAI-совместимой авторизацией.
- `mock-deep-profile`: профилирование CPU/heap/trace для горячих точек запуска, Gateway и хода агента.
- `live-openai-candidate`: реальный ход агента OpenAI `openai/gpt-5.5`, пропускается, когда `OPENAI_API_KEY` недоступен.

Lane mock-provider также запускает нативные исходные пробы OpenClaw после прохода Kova: время запуска Gateway и память в сценариях запуска по умолчанию, с hook и с 50 Plugin; RSS импорта bundled Plugin, повторяющиеся циклы приветствия mock-OpenAI `channel-chat-baseline`, команды запуска CLI против запущенного Gateway и пробу производительности smoke для состояния SQLite. Когда предыдущий опубликованный исходный отчет mock-provider доступен для тестируемого ref, исходная сводка сравнивает текущие значения RSS и heap с этим baseline и помечает крупные увеличения RSS как `watch`. Markdown-сводка исходной пробы находится в `source/index.md` в наборе отчетов, рядом с ней лежит необработанный JSON.

Каждый lane загружает артефакты GitHub. Когда настроен `CLAWGRIT_REPORTS_TOKEN`, рабочий процесс также коммитит `report.json`, `report.md`, bundles, `index.md` и артефакты исходных проб в `openclaw/clawgrit-reports` по пути `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Текущий указатель тестируемого ref записывается как `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Полная проверка релиза

`Full Release Validation` — это ручной зонтичный рабочий процесс для «запустить все перед релизом». Он принимает ветку, тег или полный SHA коммита, запускает ручной рабочий процесс `CI` с этой целью, запускает `Plugin Prerelease` для релизного доказательства Plugin/пакетов/статики/Docker и запускает `OpenClaw Release Checks` для install smoke, приемки пакета, кросс-ОС проверок пакетов, рендеринга maturity scorecard из доказательств QA-профиля, паритета QA Lab, Matrix и lane Telegram. Стабильный и полный профили всегда включают исчерпывающее live/E2E и Docker soak-покрытие пути релиза; beta-профиль может включить его через `run_release_soak=true`. Канонический пакетный Telegram E2E запускается внутри Package Acceptance, поэтому полный кандидат не запускает дублирующий live poller. После публикации передайте `release_package_spec`, чтобы повторно использовать опубликованный npm-пакет во всех release checks, Package Acceptance, Docker, cross-OS и Telegram без пересборки. Используйте `npm_telegram_package_spec` только для сфокусированного повторного запуска Telegram с опубликованным пакетом. Live-lane пакета Plugin Codex по умолчанию использует то же выбранное состояние: опубликованный `release_package_spec=openclaw@<tag>` выводит `codex_plugin_spec=npm:@openclaw/codex@<tag>`, а запуски по SHA/артефакту пакуют `extensions/codex` из выбранного ref. Задайте `codex_plugin_spec` явно для пользовательских источников Plugin, таких как спецификации `npm:`, `npm-pack:` или `git:`.

См. [Полная проверка релиза](/ru/reference/full-release-validation) для матрицы этапов, точных имен заданий рабочего процесса, различий профилей, артефактов и дескрипторов сфокусированных повторных запусков.

`OpenClaw Release Publish` — это ручной изменяющий рабочий процесс релиза. Запускайте его из `release/YYYY.M.PATCH` или `main` после создания тега релиза и после успешного preflight OpenClaw npm. Он проверяет `pnpm plugins:sync:check`, запускает `Plugin NPM Release` для всех публикуемых пакетов Plugin, запускает `Plugin ClawHub Release` для того же SHA релиза и только затем запускает `OpenClaw NPM Release` с сохраненным `preflight_run_id`. Стабильная публикация также требует точный `windows_node_tag`; рабочий процесс проверяет исходный релиз Windows и сравнивает его установщики x64/ARM64 с входным параметром `windows_node_installer_digests`, утвержденным для кандидата, перед любым дочерним publish, затем продвигает и проверяет те же закрепленные digest установщиков плюс точный сопутствующий asset и контракт checksum перед публикацией черновика релиза GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для доказательства закрепленного коммита на быстро меняющейся ветке используйте helper вместо `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs для dispatch рабочего процесса GitHub должны быть ветками или тегами, а не необработанными SHA коммитов. Helper отправляет временную ветку `release-ci/<sha>-...` на целевой SHA, запускает `Full Release Validation` из этого закрепленного ref, проверяет, что `headSha` каждого дочернего рабочего процесса совпадает с целевым, и удаляет временную ветку после завершения запуска. Зонтичный verifier также падает, если любой дочерний рабочий процесс выполнялся на другом SHA.

`release_profile` управляет широтой live/provider, передаваемой в release checks. Ручные рабочие процессы релиза по умолчанию используют `stable`; используйте `full` только когда намеренно нужна широкая консультативная матрица provider/media. Stable и full release checks всегда запускают исчерпывающий live/E2E и Docker release-path soak; beta-профиль может включить это через `run_release_soak=true`.

- `minimum` оставляет самые быстрые критичные для релиза lane OpenAI/core.
- `stable` добавляет стабильный набор provider/backend.
- `full` запускает широкую консультативную матрицу provider/media.

Зонтичный процесс записывает идентификаторы запущенных дочерних run, а финальное задание `Verify full validation` повторно проверяет текущие результаты дочерних run и добавляет таблицы самых медленных заданий для каждого дочернего run. Если дочерний рабочий процесс перезапущен и стал зеленым, перезапустите только родительское задание verifier, чтобы обновить результат зонтичного процесса и сводку timings.

Для восстановления и `Full Release Validation`, и `OpenClaw Release Checks` принимают `rerun_group`. Используйте `all` для кандидата релиза, `ci` только для обычного дочернего full CI, `plugin-prerelease` только для дочернего plugin prerelease, `release-checks` для каждого дочернего release, либо более узкую группу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` или `npm-telegram` в зонтичном процессе. Это ограничивает повторный запуск провалившегося release box после сфокусированного исправления. Для одного провалившегося cross-OS lane сочетайте `rerun_group=cross-os` с `cross_os_suite_filter`, например `windows/packaged-upgrade`; длинные cross-OS команды выводят строки Heartbeat, а сводки packaged-upgrade включают timings по фазам. QA release-check lane являются консультативными, кроме стандартного gate покрытия runtime tool, который блокирует, когда обязательные динамические tools OpenClaw смещаются или исчезают из сводки standard tier.

`OpenClaw Release Checks` использует доверенный ref рабочего процесса, чтобы один раз разрешить выбранный ref в tarball `release-package-under-test`, затем передает этот артефакт в cross-OS checks и Package Acceptance, а также в live/E2E release-path Docker workflow, когда выполняется soak-покрытие. Это сохраняет одинаковые байты пакета во всех release box и избегает повторной упаковки одного кандидата в нескольких дочерних заданиях. Для live-lane npm-Plugin Codex release checks либо передают соответствующую опубликованную спецификацию Plugin, выведенную из `release_package_spec`, либо передают заданный оператором `codex_plugin_spec`, либо оставляют input пустым, чтобы Docker-скрипт упаковал Plugin Codex из выбранного checkout.

Дублирующиеся запуски `Full Release Validation` для `ref=main` и `rerun_group=all` заменяют более старый зонтичный запуск. Родительский монитор отменяет любой дочерний рабочий процесс, который он уже запустил, когда родитель отменяется, поэтому новая проверка main не стоит за устаревшим двухчасовым запуском release-check. Проверка ветки/тега релиза и сфокусированные группы повторного запуска сохраняют `cancel-in-progress: false`.

## Live и E2E shards

Дочерний release live/E2E сохраняет широкое нативное покрытие `pnpm test:live`, но запускает его как именованные shards через `scripts/test-live-shard.mjs` вместо одного последовательного задания:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- задания `native-live-src-gateway-profiles`, отфильтрованные по provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- разделенные audio/video shards для media и music shards, отфильтрованные по provider

Это сохраняет то же файловое покрытие и одновременно упрощает повторный запуск и диагностику медленных live-сбоев provider. Агрегированные имена shards `native-live-extensions-o-z`, `native-live-extensions-media` и `native-live-extensions-media-music` остаются действительными для ручных одноразовых повторных запусков.

Нативные live media shards запускаются в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, собранном рабочим процессом `Live Media Runner Image`. Этот image предварительно устанавливает `ffmpeg` и `ffprobe`; media jobs только проверяют binaries перед setup. Держите Docker-backed live suites на обычных runners Blacksmith — container jobs являются неподходящим местом для запуска вложенных Docker tests.

Шарды live-моделей и backend на базе Docker используют отдельный общий образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для каждого выбранного коммита. Live release workflow собирает и публикует этот образ один раз, после чего шарды Docker live model, provider-sharded gateway, CLI backend, ACP bind и Codex harness запускаются с `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарды Gateway имеют явные ограничения `timeout` на уровне скриптов ниже тайм-аута задания workflow, чтобы зависший контейнер или путь очистки быстро завершался ошибкой, а не расходовал весь бюджет release-check. Если эти шарды независимо пересобирают полный исходный Docker target, release-запуск настроен неправильно и будет тратить реальное время на дублирующие сборки образа.

## Приемка пакета

Используйте `Package Acceptance`, когда вопрос звучит как «работает ли этот устанавливаемый пакет OpenClaw как продукт?». Это отличается от обычного CI: обычный CI проверяет дерево исходного кода, а приемка пакета проверяет один tarball через тот же Docker E2E harness, который пользователи задействуют после установки или обновления.

### Задания

1. `resolve_package` извлекает `workflow_ref`, определяет один кандидат пакета, записывает `.artifacts/docker-e2e-package/openclaw-current.tgz`, записывает `.artifacts/docker-e2e-package/package-candidate.json`, загружает оба файла как артефакт `package-under-test` и выводит источник, workflow ref, package ref, версию, SHA-256 и профиль в сводку шага GitHub.
2. `docker_acceptance` вызывает `openclaw-live-and-e2e-checks-reusable.yml` с `ref=workflow_ref` и `package_artifact_name=package-under-test`. Переиспользуемый workflow скачивает этот артефакт, проверяет инвентарь tarball, при необходимости подготавливает Docker-образы package-digest и запускает выбранные Docker lanes для этого пакета вместо упаковки checkout workflow. Когда профиль выбирает несколько целевых `docker_lanes`, переиспользуемый workflow подготавливает пакет и общие образы один раз, а затем распределяет эти lanes как параллельные целевые Docker-задания с уникальными артефактами.
3. `package_telegram` опционально вызывает `NPM Telegram Beta E2E`. Он запускается, когда `telegram_mode` не равен `none`, и устанавливает тот же артефакт `package-under-test`, если Package Acceptance определила пакет; автономный Telegram dispatch по-прежнему может установить опубликованную npm-спецификацию.
4. `summary` завершает workflow ошибкой, если определение пакета, Docker-приемка или опциональный Telegram lane завершились ошибкой.

### Источники кандидата

- `source=npm` принимает только `openclaw@beta`, `openclaw@latest` или точную версию релиза OpenClaw, например `openclaw@2026.4.27-beta.2`. Используйте это для приемки опубликованных prerelease/stable версий.
- `source=ref` упаковывает доверенную ветку, тег или полный SHA коммита `package_ref`. Resolver получает ветки/теги OpenClaw, проверяет, что выбранный коммит достижим из истории веток репозитория или release tag, устанавливает зависимости в detached worktree и упаковывает его с помощью `scripts/package-openclaw-for-docker.mjs`.
- `source=url` скачивает публичный HTTPS `.tgz`; `package_sha256` обязателен. Этот путь отклоняет учетные данные в URL, нестандартные HTTPS-порты, частные/внутренние/специальные имена хостов или разрешенные IP-адреса, а также перенаправления за пределы той же публичной политики безопасности.
- `source=trusted-url` скачивает HTTPS `.tgz` из именованной политики trusted-source в `.github/package-trusted-sources.json`; `package_sha256` и `trusted_source_id` обязательны. Используйте это только для maintainer-owned корпоративных зеркал или частных репозиториев пакетов, которым нужны настроенные хосты, порты, префиксы путей, хосты перенаправления или разрешение адресов в частной сети. Если политика объявляет bearer auth, workflow использует фиксированный секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; учетные данные, встроенные в URL, все равно отклоняются.
- `source=artifact` скачивает один `.tgz` из `artifact_run_id` и `artifact_name`; `package_sha256` необязателен, но его следует указывать для внешне передаваемых артефактов.

Держите `workflow_ref` и `package_ref` раздельно. `workflow_ref` — это доверенный код workflow/harness, который запускает тест. `package_ref` — это исходный коммит, который упаковывается при `source=ref`. Это позволяет текущему тестовому harness проверять более старые доверенные исходные коммиты без запуска старой логики workflow.

### Профили набора

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — полные части Docker release-path с OpenWebUI
- `custom` — точные `docker_lanes`; обязательно, когда `suite_profile=custom`

Профиль `package` использует offline-покрытие Plugin, чтобы проверка опубликованного пакета не зависела от доступности live ClawHub. Опциональный Telegram lane переиспользует артефакт `package-under-test` в `NPM Telegram Beta E2E`, при этом путь опубликованной npm-спецификации сохраняется для автономных dispatch.

Описание специальной политики тестирования обновлений и Plugin, включая локальные команды,
Docker lanes, входные параметры Package Acceptance, release-значения по умолчанию и разбор ошибок,
см. в [Тестирование обновлений и Plugin](/ru/help/testing-updates-plugins).

Release checks вызывают Package Acceptance с `source=artifact`, подготовленным артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` и `telegram_mode=mock-openai`. Это удерживает миграцию пакета, обновление, live-установку Skills из ClawHub, очистку stale-plugin-dependency, repair установки configured-plugin, offline Plugin, plugin-update и Telegram proof на одном и том же разрешенном package tarball. Задайте `release_package_spec` в Full Release Validation или OpenClaw Release Checks после публикации beta, чтобы запустить ту же матрицу для поставленного npm-пакета без пересборки; задавайте `package_acceptance_package_spec` только когда Package Acceptance нужен пакет, отличный от остальной release validation. Cross-OS release checks по-прежнему покрывают OS-specific onboarding, installer и platform behavior; проверку продукта для package/update следует начинать с Package Acceptance. Docker lane `published-upgrade-survivor` проверяет один опубликованный базовый пакет за запуск в блокирующем release path. В Package Acceptance разрешенный tarball `package-under-test` всегда является кандидатом, а `published_upgrade_survivor_baseline` выбирает fallback published baseline, по умолчанию `openclaw@latest`; команды повторного запуска failed-lane сохраняют этот baseline. Full Release Validation с `run_release_soak=true` или `release_profile=full` задает `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` и `published_upgrade_survivor_scenarios=reported-issues`, чтобы расширить покрытие на четыре последние stable npm release плюс закрепленные boundary releases для plugin-compatibility и issue-shaped fixtures для конфигурации Feishu, сохраненных bootstrap/persona files, установок configured OpenClaw Plugin, путей логов с tilde и устаревших корней зависимостей legacy Plugin. Выборки multi-baseline published-upgrade survivor шардируются по baseline в отдельные целевые Docker runner jobs. Отдельный workflow `Update Migration` использует Docker lane `update-migration` с `all-since-2026.4.23` и `plugin-deps-cleanup`, когда вопрос состоит в исчерпывающей очистке published update, а не в обычной широте Full Release CI. Локальные aggregate-запуски могут передавать точные package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, оставлять один lane с `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, например `openclaw@2026.4.15`, или задавать `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матрицы сценариев. Published lane настраивает baseline с baked-рецептом команды `openclaw config set`, записывает шаги рецепта в `summary.json` и проверяет `/healthz`, `/readyz`, а также статус RPC после запуска Gateway. Windows packaged и installer fresh lanes также проверяют, что установленный пакет может импортировать browser-control override из raw absolute Windows path. OpenAI cross-OS agent-turn smoke по умолчанию использует `OPENCLAW_CROSS_OS_OPENAI_MODEL`, если он задан, иначе `openai/gpt-5.5`, так что proof установки и Gateway остается на тестовой модели GPT-5, избегая значений GPT-4.x по умолчанию.

### Окна совместимости с legacy

Package Acceptance имеет ограниченные окна legacy-compatibility для уже опубликованных пакетов. Пакеты до `2026.4.25` включительно, включая `2026.4.25-beta.*`, могут использовать compatibility path:

- известные private QA entries в `dist/postinstall-inventory.json` могут указывать на файлы, исключенные из tarball;
- `doctor-switch` может пропустить подслучай persistence для `gateway install --wrapper`, когда пакет не предоставляет этот флаг;
- `update-channel-switch` может удалить отсутствующие pnpm `patchedDependencies` из fake git fixture, полученной из tarball, и может записать в лог отсутствующий persisted `update.channel`;
- plugin smokes могут читать legacy install-record locations или принимать отсутствующую persistence для marketplace install-record;
- `plugin-update` может разрешить миграцию config metadata, при этом по-прежнему требуя, чтобы install record и no-reinstall behavior оставались неизменными.

Опубликованный пакет `2026.4.26` также может выдавать предупреждения для файлов local build metadata stamp, которые уже были поставлены. Более поздние пакеты должны соответствовать современным контрактам; те же условия завершаются ошибкой, а не предупреждением или пропуском.

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

При отладке неудачного запуска package acceptance начните со сводки `resolve_package`, чтобы подтвердить источник пакета, версию и SHA-256. Затем изучите дочерний запуск `docker_acceptance` и его Docker-артефакты: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lane, phase timings и команды повторного запуска. Предпочитайте повторный запуск failed package profile или точных Docker lanes вместо повторного запуска full release validation.

## Установочный smoke

Отдельный workflow `Install Smoke` переиспользует тот же scope script через собственное задание `preflight`. Он разделяет smoke-покрытие на `run_fast_install_smoke` и `run_full_install_smoke`.

- **Быстрый путь** запускается для pull request, затрагивающих поверхности Docker/пакетов, изменения пакетов/манифестов встроенных plugin, а также поверхности core plugin/каналов/gateway/Plugin SDK, которые проверяют Docker smoke jobs. Изменения только исходного кода встроенных plugin, правки только тестов и правки только документации не резервируют Docker workers. Быстрый путь один раз собирает образ корневого Dockerfile, проверяет CLI, запускает CLI smoke для удаления agents shared-workspace, запускает container gateway-network e2e, проверяет build arg встроенного extension и запускает ограниченный Docker-профиль bundled-plugin с совокупным таймаутом команды 240 секунд (Docker run каждого сценария ограничен отдельно).
- **Полный путь** сохраняет покрытие QR package install и installer Docker/update для ночных запланированных запусков, ручных dispatch, release checks через workflow-call и pull request, которые действительно затрагивают поверхности installer/package/Docker. В полном режиме install-smoke подготавливает или повторно использует один smoke-образ GHCR корневого Dockerfile для целевого SHA, затем запускает QR package install, smoke для корневого Dockerfile/gateway, smoke для installer/update и быстрый Docker E2E для bundled-plugin как отдельные jobs, чтобы работа installer не ждала smoke для корневого образа.

Пуши в `main` (включая merge commits) не принуждают к полному пути; когда логика changed-scope запросила бы полное покрытие при push, workflow сохраняет быстрый Docker smoke и оставляет полный install smoke для ночной или release-валидации.

Медленный Bun global install image-provider smoke отдельно ограничен `run_bun_global_install_smoke`. Он запускается по ночному расписанию и из workflow release checks, а ручные dispatch `Install Smoke` могут включить его явно, но pull request и push в `main` не запускают его. Обычная PR CI по-прежнему запускает быстрый регрессионный lane Bun launcher для изменений, относящихся к Node. Docker-тесты QR и installer сохраняют собственные Dockerfile, сфокусированные на установке.

## Локальный Docker E2E

`pnpm test:docker:all` предварительно собирает один общий образ live-test, один раз упаковывает OpenClaw как npm tarball и собирает два общих образа `scripts/e2e/Dockerfile`:

- минимальный runner Node/Git для lanes installer/update/plugin-dependency;
- функциональный образ, который устанавливает тот же tarball в `/app` для обычных функциональных lanes.

Определения Docker lane находятся в `scripts/lib/docker-e2e-scenarios.mjs`, логика планировщика находится в `scripts/lib/docker-e2e-plan.mjs`, а runner выполняет только выбранный план. Планировщик выбирает образ для каждого lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` и `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, затем запускает lanes с `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Настраиваемые параметры

| Переменная                            | Значение по умолчанию | Назначение                                                                                              |
| ------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                    | Число слотов основного пула для обычных lanes.                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                    | Число слотов хвостового пула, чувствительного к провайдерам.                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                     | Лимит параллельных live lanes, чтобы провайдеры не включали throttling.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5                     | Лимит параллельных lanes установки npm.                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                     | Лимит параллельных multi-service lanes.                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000                  | Задержка между стартами lanes, чтобы избежать всплесков create в Docker daemon; задайте `0` без задержки. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000               | Резервный таймаут на lane (120 минут); выбранные live/tail lanes используют более жесткие лимиты.       |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset                 | `1` печатает план планировщика без запуска lanes.                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset                 | Точный список lanes через запятую; пропускает cleanup smoke, чтобы agents могли воспроизвести один упавший lane. |

Lane тяжелее своего эффективного лимита все равно может стартовать из пустого пула, затем выполняется один, пока не освободит емкость. Локальный агрегированный запуск предварительно проверяет Docker, удаляет устаревшие контейнеры OpenClaw E2E, выводит статус активных lanes, сохраняет времена lanes для сортировки longest-first и по умолчанию прекращает планировать новые pooled lanes после первого сбоя.

### Переиспользуемый workflow live/E2E

Переиспользуемый workflow live/E2E спрашивает у `scripts/test-docker-all.mjs --plan-json`, какое покрытие package, kind образа, live image, lane и credentials требуется. Затем `scripts/docker-e2e.mjs` преобразует этот план в GitHub outputs и summaries. Он либо упаковывает OpenClaw через `scripts/package-openclaw-for-docker.mjs`, скачивает package artifact текущего run, либо скачивает package artifact из `package_artifact_run_id`; проверяет inventory tarball; собирает и публикует package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, когда плану нужны lanes с установленным package; и повторно использует переданные inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` или существующие package-digest images вместо пересборки. Загрузки Docker images повторяются с ограниченным таймаутом 180 секунд на попытку, чтобы зависший поток registry/cache быстро повторялся, а не занимал большую часть критического пути CI.

### Фрагменты release-path

Docker-покрытие release запускает меньшие jobs по фрагментам с `OPENCLAW_SKIP_DOCKER_BUILD=1`, чтобы каждый фрагмент подтягивал только нужный kind образа и выполнял несколько lanes через тот же взвешенный планировщик:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Текущие Docker-фрагменты release — `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` и от `plugins-runtime-install-a` до `plugins-runtime-install-h`. `package-update-openai` включает live lane package Plugin Codex, который устанавливает кандидатный package OpenClaw, устанавливает Plugin Codex из `codex_plugin_spec` или tarball того же ref с явным разрешением на установку Codex CLI, запускает preflight Codex CLI, затем выполняет несколько turns OpenClaw agent в той же сессии против OpenAI. `plugins-runtime-core`, `plugins-runtime` и `plugins-integrations` остаются агрегированными алиасами plugin/runtime. Алиас lane `install-e2e` остается агрегированным ручным алиасом повторного запуска для обоих lanes provider installer.

OpenWebUI включается в `plugins-runtime-services`, когда это запрашивает полное покрытие release-path, и сохраняет отдельный фрагмент `openwebui` только для dispatch, относящихся только к OpenWebUI. Lanes обновления bundled-channel повторяют запуск один раз при временных сетевых сбоях npm.

Каждый фрагмент загружает `.artifacts/docker-tests/` с логами lanes, timings, `summary.json`, `failures.json`, phase timings, JSON плана планировщика, таблицами slow-lane и командами rerun для каждого lane. Input workflow `docker_lanes` запускает выбранные lanes против подготовленных images вместо chunk jobs, что удерживает отладку упавшего lane в пределах одного целевого Docker job и подготавливает, скачивает или повторно использует package artifact для этого run; если выбранный lane является live Docker lane, целевой job локально собирает live-test image для этого rerun. Сгенерированные GitHub-команды rerun для каждого lane включают `package_artifact_run_id`, `package_artifact_name` и inputs подготовленных images, когда эти значения существуют, чтобы упавший lane мог повторно использовать точный package и images из упавшего run.

```bash
pnpm test:docker:rerun <run-id>      # скачать Docker artifacts и вывести объединенные/целевые команды rerun для каждого lane
pnpm test:docker:timings <summary>   # summaries slow-lane и phase critical-path
```

Запланированный workflow live/E2E ежедневно запускает полный Docker-набор release-path.

## Предрелиз Plugin

`Plugin Prerelease` — более дорогое product/package покрытие, поэтому это отдельный workflow, запускаемый `Full Release Validation` или явным оператором. Обычные pull request, push в `main` и самостоятельные ручные dispatch CI держат этот suite выключенным. Он балансирует тесты встроенных plugin по восьми extension workers; эти jobs extension shard запускают до двух групп конфигураций plugin одновременно с одним Vitest worker на группу и увеличенной Node heap, чтобы import-heavy batches plugin не создавали дополнительные CI jobs. Путь Docker prerelease только для release группирует целевые Docker lanes небольшими группами, чтобы не резервировать десятки runners для jobs на одну-три минуты. Workflow также загружает информационный artifact `plugin-inspector-advisory` из `@openclaw/plugin-inspector`; findings inspector являются входными данными для triage и не меняют блокирующий gate Plugin Prerelease.

## QA Lab

QA Lab имеет выделенные CI lanes вне основного workflow smart-scoped. Agentic parity вложен в широкие QA и release harnesses, а не является самостоятельным PR workflow. Используйте `Full Release Validation` с `rerun_group=qa-parity`, когда parity должен идти вместе с широким validation run.

- Workflow `QA-Lab - All Lanes` запускается каждую ночь на `main` и при ручном dispatch; он разворачивает mock parity lane, live Matrix lane, а также live Telegram и Discord lanes как параллельные jobs. Live jobs используют environment `qa-live-shared`, а Telegram/Discord используют Convex leases.

Release checks запускают live transport lanes Matrix и Telegram с детерминированным mock provider и mock-qualified models (`mock-openai/gpt-5.5` и `mock-openai/gpt-5.5-alt`), чтобы contract канала был изолирован от задержки live model и обычного запуска provider-plugin. Live transport gateway отключает memory search, потому что QA parity отдельно покрывает поведение memory; подключение provider покрывается отдельными suites live model, native provider и Docker provider.

Matrix использует `--profile fast` для scheduled и release gates, добавляя `--fail-fast` только когда checked-out CLI поддерживает это. CLI default и input ручного workflow остаются `all`; ручной dispatch `matrix_profile=all` всегда делит полное покрытие Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` и `e2ee-cli`.

`OpenClaw Release Checks` также запускает критичные для release lanes QA Lab до approval release; его gate QA parity запускает candidate и baseline packs как параллельные lane jobs, затем скачивает оба artifacts в небольшой report job для финального сравнения parity.

Для обычных PR следуйте scoped CI/check evidence вместо того, чтобы считать parity обязательным status.

## CodeQL

Workflow `CodeQL` намеренно является узким security scanner первого прохода, а не полным sweep репозитория. Ежедневные, ручные и non-draft guard runs pull request сканируют Actions workflow code плюс наиболее рискованные поверхности JavaScript/TypeScript с high-confidence security queries, отфильтрованными до high/critical `security-severity`.

Guard pull request остается легким: он запускается только для изменений в `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` или `src` и выполняет ту же high-confidence security matrix, что и scheduled workflow. Android и macOS CodeQL остаются вне PR defaults.

### Категории безопасности

| Категория                                        | Поверхность                                                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`        | Auth, secrets, sandbox, Cron и базовый уровень Gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary` | Контракты реализации основного канала, а также runtime Plugin канала, Gateway, Plugin SDK, secrets и точки соприкосновения аудита   |
| `/codeql-security-high/network-ssrf-boundary`    | Поверхности core SSRF, разбора IP, network guard, web-fetch и политики SSRF в Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-серверы, помощники выполнения процессов, исходящая доставка и шлюзы выполнения инструментов агента                              |
| `/codeql-security-high/plugin-trust-boundary`    | Поверхности доверия для установки Plugin, загрузчика, манифеста, реестра, установки через менеджер пакетов, загрузки исходников и пакетного контракта Plugin SDK |

### Платформенно-специфичные security shards

- `CodeQL Android Critical Security` — запланированный security shard для Android. Вручную собирает Android-приложение для CodeQL на самом маленьком Linux-раннере Blacksmith, принятом проверкой корректности workflow. Загружает под `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — еженедельный/ручной security shard для macOS. Вручную собирает macOS-приложение для CodeQL на Blacksmith macOS, отфильтровывает результаты сборки зависимостей из загружаемого SARIF и загружает под `/codeql-critical-security/macos`. Оставлен вне ежедневных значений по умолчанию, потому что сборка macOS доминирует по времени выполнения даже в чистом состоянии.

### Категории Critical Quality

`CodeQL Critical Quality` — соответствующий не-security shard. Он выполняет только JavaScript/TypeScript-запросы качества с серьезностью error и без security по узким ценным поверхностям на GitHub-hosted Linux-раннерах, чтобы сканирование качества не расходовало бюджет регистрации раннеров Blacksmith. Его guard для pull request намеренно меньше запланированного профиля: недрафтовые PR запускают только соответствующие shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` и `plugin-sdk-reply-runtime` для изменений в коде выполнения агентских команд/моделей/инструментов и диспетчеризации ответов, схемы config/миграций/IO, auth/secrets/sandbox/security, основного канала и runtime встроенного Plugin канала, протокола Gateway/серверных методов, memory runtime/связующего кода SDK, MCP/process/исходящей доставки, provider runtime/каталога моделей, диагностики session/очередей доставки, загрузчика Plugin, Plugin SDK/пакетного контракта или runtime ответов Plugin SDK. Изменения config CodeQL и workflow качества запускают все двенадцать quality shards для PR.

Ручной запуск принимает:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Узкие профили — это точки обучения/итерации для запуска одного quality shard изолированно.

| Категория                                               | Поверхность                                                                                                                                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код границы безопасности Auth, secrets, sandbox, Cron и Gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Контракты схемы config, миграции, нормализации и IO                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схемы протокола Gateway и контракты серверных методов                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракты реализации основного канала и встроенного Plugin канала                                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Контракты выполнения команд, диспетчеризации моделей/provider, диспетчеризации auto-reply и очередей, а также runtime control-plane ACP                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-серверы и мосты инструментов, помощники надзора за процессами и контракты исходящей доставки                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасады memory runtime, псевдонимы memory Plugin SDK, связующий код активации memory runtime и команды memory doctor                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутренности очереди ответов, очереди доставки session, помощники привязки/доставки исходящих session, поверхности диагностических events/log bundle и контракты CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризация входящих ответов Plugin SDK, helpers payload/chunking/runtime ответов, параметры ответа канала, очереди доставки и helpers привязки session/thread    |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормализация каталога моделей, auth и discovery provider, регистрация provider runtime, defaults/catalogs provider, а также реестры web/search/fetch/embedding        |
| `/codeql-critical-quality/ui-control-plane`             | Загрузка Control UI, local persistence, control flows Gateway и runtime-контракты task control-plane                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракты runtime для core web fetch/search, media IO, понимания media, генерации изображений и media-generation                                                      |
| `/codeql-critical-quality/plugin-boundary`              | Контракты загрузчика, реестра, публичной поверхности и entrypoint Plugin SDK                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубликованные package-side исходники Plugin SDK и helpers контракта пакета Plugin                                                                                    |

Quality остается отдельно от security, чтобы findings качества можно было планировать, измерять, отключать или расширять без размывания security-сигнала. Расширение CodeQL для Swift, Python и встроенных Plugin следует возвращать как scoped или sharded follow-up работу только после того, как узкие профили получат стабильное время выполнения и сигнал.

## Workflow обслуживания

### Docs Agent

Workflow `Docs Agent` — это событийно-управляемая maintenance lane Codex для поддержания существующих docs в соответствии с недавно влитыми изменениями. У нее нет чистого расписания: успешный CI run для non-bot push на `main` может ее запустить, а manual dispatch может запустить ее напрямую. Вызовы workflow-run пропускаются, когда `main` уже продвинулся дальше или когда другой непропущенный run Docs Agent был создан за последний час. Когда workflow выполняется, он проверяет диапазон коммитов от предыдущего непропущенного source SHA Docs Agent до текущего `main`, поэтому один часовой run может покрыть все изменения main, накопленные с момента последнего прохода по docs.

### Test Performance Agent

Workflow `Test Performance Agent` — это событийно-управляемая maintenance lane Codex для медленных тестов. У нее нет чистого расписания: успешный CI run для non-bot push на `main` может ее запустить, но она пропускается, если другой вызов workflow-run уже выполнялся или выполняется в этот UTC-день. Manual dispatch обходит этот дневной activity gate. Lane строит grouped Vitest performance report для полного набора, позволяет Codex вносить только небольшие сохраняющие покрытие исправления производительности тестов вместо широких рефакторингов, затем повторно запускает full-suite report и отклоняет изменения, уменьшающие базовое число проходящих тестов. Grouped report записывает wall time по каждому config и max RSS на Linux и macOS, поэтому сравнение before/after показывает дельты памяти тестов рядом с дельтами длительности. Если в baseline есть падающие тесты, Codex может исправлять только очевидные сбои, а after-agent full-suite report должен пройти до того, как что-либо будет закоммичено. Когда `main` продвигается до того, как push бота попадает в репозиторий, lane ребейзит проверенный patch, повторно запускает `pnpm check:changed` и повторяет push; конфликтующие устаревшие patches пропускаются. Она использует GitHub-hosted Ubuntu, чтобы action Codex мог сохранять ту же safety posture drop-sudo, что и docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — это ручной maintainer workflow для очистки duplicate после landing. По умолчанию он выполняется в dry-run и закрывает только явно перечисленные PR, когда `apply=true`. Перед изменением GitHub он проверяет, что landed PR влит и что у каждого duplicate есть либо общая referenced issue, либо пересекающиеся changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальные check gates и changed routing

Локальная логика changed-lane находится в `scripts/changed-lanes.mjs` и выполняется через `scripts/check-changed.mjs`. Этот локальный check gate строже в отношении архитектурных границ, чем широкий platform scope CI:

- изменения production core запускают typecheck core prod и core test, а также core lint/guards;
- изменения только в тестах core запускают только typecheck core test и core lint;
- изменения production extension запускают typecheck extension prod и extension test, а также extension lint;
- изменения только в тестах extension запускают typecheck extension test и extension lint;
- изменения public Plugin SDK или plugin-contract расширяются до typecheck extension, потому что extensions зависят от этих core contracts (Vitest extension sweeps остаются явной test work);
- metadata-only bumps версий release запускают targeted проверки version/config/root-dependency;
- неизвестные изменения root/config fail safe во все check lanes.

Локальный changed-test routing находится в `scripts/test-projects.test-support.mjs` и намеренно дешевле, чем `check:changed`: прямые правки тестов запускают сами себя, правки source предпочитают явные mappings, затем sibling tests и import-graph dependents. Shared group-room delivery config — один из явных mappings: изменения group visible-reply config, source reply delivery mode или message-tool system prompt проходят через core reply tests плюс регрессии доставки Discord и Slack, чтобы изменение shared default падало до первого push PR. Используйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только когда изменение достаточно широко затрагивает harness, и дешевый mapped set не является надежным proxy.

## Валидация Testbox

Crabbox — это принадлежащая репозиторию обертка remote-box для maintainer Linux proof. Используйте ее
из корня репозитория, когда check слишком широкий для локального edit loop, когда важен
паритет с CI или когда proof требует secrets, Docker, package lanes,
reusable boxes или remote logs. Обычный backend OpenClaw —
`blacksmith-testbox`; принадлежащие capacity AWS/Hetzner служат fallback для outages Blacksmith,
проблем с quota или явного тестирования owned-capacity.

Crabbox-backed Blacksmith запускает подготовку, получает, синхронизирует, выполняет, формирует отчет и очищает
одноразовые Testbox. Встроенная проверка корректности синхронизации быстро завершается с ошибкой, когда обязательные
корневые файлы, такие как `pnpm-lock.yaml`, исчезают или когда `git status --short`
показывает как минимум 200 отслеживаемых удалений. Для PR с намеренным массовым удалением задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для удаленной команды.

Crabbox также завершает локальный вызов Blacksmith CLI, который остается на
этапе синхронизации более пяти минут без вывода после синхронизации. Задайте
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, чтобы отключить эту защиту, или используйте большее
значение в миллисекундах для необычно больших локальных diff.

Перед первым запуском проверьте wrapper из корня репозитория:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper репозитория отклоняет устаревший бинарный файл Crabbox, который не объявляет `blacksmith-testbox`. Передавайте provider явно, даже если `.crabbox.yaml` содержит значения по умолчанию для owned-cloud. В рабочих деревьях Codex или связанных/разреженных checkout избегайте локального скрипта `pnpm crabbox:run`, потому что pnpm может согласовать зависимости до запуска Crabbox; вместо этого вызывайте node wrapper напрямую:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Запуски через Blacksmith требуют Crabbox 0.22.0 или новее, чтобы wrapper получал текущее поведение синхронизации, очереди и очистки Testbox. При использовании соседнего checkout пересоберите игнорируемый локальный бинарный файл перед замерами времени или работой с доказательствами:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Измененный gate:

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

Точечный повторный запуск теста:

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

Полный suite:

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
запусков Blacksmith Testbox код выхода wrapper Crabbox и JSON-сводка являются
результатом команды. Связанный запуск GitHub Actions отвечает за hydration и keepalive; он
может завершиться как `cancelled`, когда Testbox остановлен извне после того, как SSH-команда
уже вернулась. Считайте это артефактом очистки/статуса, если только
`exitCode` wrapper не является ненулевым или вывод команды не показывает упавший тест.
Одноразовые запуски Crabbox через Blacksmith должны останавливать Testbox автоматически;
если запуск прерван или очистка неясна, проверьте активные box и остановите только
те box, которые создали вы:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Используйте reuse только тогда, когда вам намеренно нужно выполнить несколько команд на одном hydrated box:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Если сломанным слоем является Crabbox, но сам Blacksmith работает, используйте прямой
Blacksmith только для диагностики, такой как `list`, `status` и очистка. Исправьте
путь Crabbox, прежде чем считать прямой запуск Blacksmith доказательством maintainer.

Если `blacksmith testbox list --all` и `blacksmith testbox status` работают, но новые
warmup остаются в `queued` без IP или URL запуска Actions через пару минут,
считайте это давлением со стороны provider Blacksmith, очереди, биллинга или лимитов org. Остановите
созданные вами queued id, не запускайте больше Testbox и перенесите доказательство на
путь собственной емкости Crabbox ниже, пока кто-то проверяет dashboard Blacksmith,
биллинг и лимиты org.

Переходите на собственную емкость Crabbox только когда Blacksmith недоступен, ограничен квотой, не имеет нужного окружения или собственная емкость явно является целью:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

При давлении на AWS избегайте `class=beast`, если задаче действительно не нужен CPU класса 48xlarge. Запрос `beast` начинается с 192 vCPU и является самым простым способом упереться в региональную квоту EC2 Spot или On-Demand Standard. Принадлежащий репозиторию `.crabbox.yaml` по умолчанию использует `standard`, несколько регионов емкости и `capacity.hints: true`, поэтому брокерованные аренды AWS печатают выбранный регион/market, давление квоты, fallback Spot и предупреждения о классе с высоким давлением. Используйте `fast` для более тяжелых широких проверок, `large` только после того, как standard/fast недостаточны, и `beast` только для исключительных CPU-bound lanes, таких как full-suite или all-plugin Docker matrices, явная проверка release/blocker либо профилирование производительности с большим числом ядер. Не используйте `beast` для `pnpm check:changed`, точечных тестов, docs-only работы, обычного lint/typecheck, небольших E2E repro или triage сбоя Blacksmith. Используйте `--market on-demand` для диагностики емкости, чтобы колебания рынка Spot не смешивались с сигналом.

`.crabbox.yaml` задает значения по умолчанию для provider, синхронизации и hydration GitHub Actions для owned-cloud lanes. Он исключает локальный `.git`, чтобы hydrated checkout Actions сохранял собственные удаленные Git-метаданные вместо синхронизации локальных remotes и object stores maintainer, и исключает локальные runtime/build артефакты, которые никогда не должны передаваться. `.github/workflows/crabbox-hydrate.yml` отвечает за checkout, настройку Node/pnpm, получение `origin/main` и передачу несекретного окружения для команд owned-cloud `crabbox run --id <cbx_id>`.

## Связанное

- [Обзор установки](/ru/install)
- [Каналы разработки](/ru/install/development-channels)
