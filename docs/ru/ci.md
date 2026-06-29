---
read_when:
    - Вам нужно понять, почему задание CI запустилось или не запустилось
    - Вы отлаживаете сбой проверки GitHub Actions
    - Вы координируете запуск или повторный запуск проверки релиза
    - Вы изменяете диспетчеризацию ClawSweeper или пересылку активности GitHub
summary: Граф заданий CI, проверки области действия, релизные зонтичные задания и локальные эквиваленты команд
title: CI-конвейер
x-i18n:
    generated_at: "2026-06-28T22:38:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

CI OpenClaw запускается при каждом push в `main` и для каждого pull request. Канонические
push в `main` сначала проходят 90-секундное окно допуска на hosted-runner.
Существующая группа конкурентности `CI` отменяет ожидающий запуск, когда появляется более новый
commit, поэтому последовательные merge не регистрируют каждый полную матрицу Blacksmith.
Pull request и ручные dispatch пропускают ожидание. Затем задание `preflight`
классифицирует diff и отключает затратные направления, когда изменились только несвязанные
области. Ручные запуски `workflow_dispatch` намеренно обходят умное
ограничение области и разворачивают полный граф для release candidate и широкой
валидации. Направления Android остаются opt-in через `include_android`. Покрытие Plugin,
предназначенное только для релизов, находится в отдельном workflow [`предрелизная проверка Plugin`](#plugin-prerelease)
и запускается только из [`полной валидации релиза`](#full-release-validation)
или при явном ручном dispatch.

## Обзор pipeline

| Задание                            | Назначение                                                                                                | Когда запускается                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Обнаруживает изменения только в документации, измененные области, измененные extensions и строит манифест CI | Всегда для нечерновых push и PR                    |
| `runner-admission`                 | Hosted 90-секундный debounce для канонических push в `main` перед регистрацией работы Blacksmith         | Каждый запуск CI; sleep только для канонических push в `main` |
| `security-fast`                    | Обнаружение приватных ключей, аудит измененных workflow через `zizmor` и аудит production lockfile        | Всегда для нечерновых push и PR                    |
| `check-dependencies`               | Production-проход Knip только по зависимостям плюс guard allowlist неиспользуемых файлов                  | Изменения, относящиеся к Node                      |
| `build-artifacts`                  | Сборка `dist/`, Control UI, smoke-проверки собранного CLI, проверки встроенных артефактов сборки и переиспользуемые артефакты | Изменения, относящиеся к Node                      |
| `checks-fast-core`                 | Быстрые Linux-направления корректности, такие как bundled, protocol, QA Smoke CI и проверки CI-routing    | Изменения, относящиеся к Node                      |
| `checks-fast-contracts-plugins-*`  | Две sharded-проверки контрактов Plugin                                                                    | Изменения, относящиеся к Node                      |
| `checks-fast-contracts-channels-*` | Две sharded-проверки контрактов channel                                                                   | Изменения, относящиеся к Node                      |
| `checks-node-core-*`               | Шарды тестов Core Node, исключая направления channel, bundled, contract и extension                       | Изменения, относящиеся к Node                      |
| `check-*`                          | Sharded-эквивалент основного локального gate: production-типы, lint, guards, test types и strict smoke    | Изменения, относящиеся к Node                      |
| `check-additional-*`               | Архитектура, sharded-проверки boundary/prompt drift, guards для extension, package boundary и runtime topology | Изменения, относящиеся к Node                      |
| `checks-node-compat-node22`        | Сборка совместимости с Node 22 и smoke-направление                                                        | Ручной CI dispatch для релизов                     |
| `check-docs`                       | Форматирование документации, lint и проверки битых ссылок                                                | Изменена документация                              |
| `skills-python`                    | Ruff + pytest для Skills на базе Python                                                                   | Изменения, относящиеся к Python Skills             |
| `checks-windows`                   | Специфичные для Windows тесты процессов/путей плюс регрессии общих runtime import specifier              | Изменения, относящиеся к Windows                   |
| `macos-node`                       | Направление тестов TypeScript на macOS с использованием общих собранных артефактов                       | Изменения, относящиеся к macOS                     |
| `macos-swift`                      | Swift lint, сборка и тесты приложения macOS                                                               | Изменения, относящиеся к macOS                     |
| `ios-build`                        | Генерация проекта Xcode плюс сборка приложения iOS для симулятора                                        | Приложение iOS, общий app kit или изменения Swabble |
| `android`                          | Unit-тесты Android для обеих flavor плюс одна сборка debug APK                                           | Изменения, относящиеся к Android                   |
| `test-performance-agent`           | Ежедневная оптимизация медленных тестов Codex после доверенной активности                                | Успешный CI на main или ручной dispatch            |
| `openclaw-performance`             | Ежедневные/по требованию отчеты производительности runtime Kova с mock-provider, deep-profile и live-направлениями GPT 5.5 | Запланированный и ручной dispatch                  |

## Порядок fail-fast

1. `runner-admission` ожидает только для канонических push в `main`; более новый push отменяет запуск до регистрации Blacksmith.
2. `preflight` решает, какие направления вообще существуют. Логика `docs-scope` и `changed-scope` является шагами внутри этого задания, а не отдельными заданиями.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` и `skills-python` быстро падают, не ожидая более тяжелых заданий матрицы артефактов и платформ.
4. `build-artifacts` выполняется параллельно с быстрыми Linux-направлениями, чтобы downstream-потребители могли стартовать сразу после готовности общей сборки.
5. Более тяжелые платформенные и runtime-направления разворачиваются после этого: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` и `android`.

GitHub может помечать superseded-задания как `cancelled`, когда более новый push появляется в том же PR или ref `main`. Считайте это шумом CI, если только самый новый запуск для того же ref также не падает. Matrix-задания используют `fail-fast: false`, а `build-artifacts` сообщает о сбоях embedded channel, core-support-boundary и gateway-watch напрямую, вместо того чтобы ставить в очередь маленькие задания-верификаторы. Автоматический ключ конкурентности CI версионирован (`CI-v7-*`), чтобы GitHub-side zombie в старой группе очереди не мог бесконечно блокировать более новые запуски main. Ручные запуски полного набора используют `CI-manual-v1-*` и не отменяют уже выполняющиеся запуски.

Используйте `pnpm ci:timings`, `pnpm ci:timings:recent` или `node scripts/ci-run-timings.mjs <run-id>`, чтобы суммировать wall time, queue time, самые медленные задания, сбои и fanout-барьер `pnpm-store-warmup` из GitHub Actions. CI также загружает ту же сводку запуска как артефакт `ci-timings-summary`. Для времени сборки проверьте шаг `Build dist` задания `build-artifacts`: `pnpm build:ci-artifacts` печатает `[build-all] phase timings:` и включает `ui:build`; задание также загружает артефакт `startup-memory`.

Для запусков pull request терминальное задание timing-summary запускает helper из доверенной базовой ревизии перед передачей `GH_TOKEN` в `gh run view`. Это удерживает запрос с токеном вне кода, контролируемого branch, и при этом суммирует текущий CI-запуск pull request.

## Контекст PR и доказательства

PR внешних contributors запускают gate контекста PR и доказательств из
`.github/workflows/real-behavior-proof.yml`. Workflow выполняет checkout доверенного
base commit и оценивает только тело PR; он не выполняет код из
branch contributor.

Gate применяется к авторам PR, которые не являются владельцами repository, members,
collaborators или bots. Он проходит, когда тело PR содержит авторские разделы
`What Problem This Solves` и `Evidence`. Доказательством может быть focused
test, результат CI, screenshot, recording, terminal output, live observation,
redacted log или ссылка на artifact. Тело предоставляет намерение и полезную валидацию;
reviewers проверяют код, тесты и CI, чтобы оценить корректность.

Когда проверка падает, обновите тело PR вместо отправки еще одного code commit.

## Область и маршрутизация

Логика scope находится в `scripts/ci-changed-scope.mjs` и покрыта unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Ручной dispatch пропускает обнаружение changed-scope и заставляет манифест preflight работать так, как будто изменилась каждая scoped-область.

- **Правки CI workflow** валидируют граф Node CI плюс workflow linting, но сами по себе не принуждают сборки Windows, iOS, Android или нативные сборки macOS; эти платформенные направления остаются scoped к изменениям платформенного исходного кода.
- **Workflow Sanity** запускает `actionlint`, `zizmor` по всем YAML-файлам workflow, guard интерполяции composite-action и guard conflict-marker. PR-scoped задание `security-fast` также запускает `zizmor` по измененным workflow-файлам, чтобы findings безопасности workflow падали рано в основном графе CI.
- **Документация при push в `main`** проверяется standalone workflow `Docs` с тем же зеркалом документации ClawHub, которое использует CI, поэтому смешанные push code+docs не ставят также в очередь shard CI `check-docs`. Pull request и ручной CI по-прежнему запускают `check-docs` из CI, когда изменилась документация.
- **TUI PTY** запускается в Linux Node shard `checks-node-core-runtime-tui-pty` для изменений TUI. Shard запускает `test/vitest/vitest.tui-pty.config.ts` с `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, поэтому покрывает как детерминированное направление fixture `TuiBackend`, так и более медленный smoke `tui --local`, который mock-ает только внешний model endpoint.
- **Правки только CI routing, выбранные дешевые правки core-test fixture и узкие правки helper/test-routing для контракта Plugin** используют быстрый путь манифеста только для Node: `preflight`, security и одну задачу `checks-fast-core`. Этот путь пропускает build artifacts, совместимость Node 22, channel contracts, полные core shards, bundled-plugin shards и дополнительные guard matrices, когда изменение ограничено routing- или helper-поверхностями, которые быстрая задача проверяет напрямую.
- **Проверки Windows Node** scoped к специфичным для Windows оберткам процессов/путей, helper для npm/pnpm/UI runner, конфигурации package manager и поверхностям CI workflow, которые выполняют это направление; несвязанные изменения source, Plugin, install-smoke и только тестовые изменения остаются на направлениях Linux Node.

Самые медленные семейства тестов Node разделены или сбалансированы так, чтобы каждое задание оставалось небольшим без чрезмерного резервирования раннеров: контракты плагинов и контракты каналов запускаются как два взвешенных шарда с поддержкой Blacksmith каждый, со стандартным резервным вариантом на раннере GitHub; быстрые/вспомогательные линии core unit запускаются отдельно; инфраструктура core runtime разделена между state, process/config, shared и тремя доменными cron-шардами; auto-reply запускается как сбалансированные воркеры (с разделением поддерева reply на шарды agent-runner, dispatch и commands/state-routing), а конфигурации agentic gateway/server разделены по линиям chat/auth/model/http-plugin/runtime/startup вместо ожидания собранных артефактов. Затем обычный CI упаковывает только изолированные infra-шарды по include-паттернам в детерминированные пакеты максимум по 64 тестовых файла, уменьшая матрицу Node без объединения неизолированных наборов command/cron, stateful agents-core или gateway/server; тяжелые фиксированные наборы остаются на 8 vCPU, а пакетированные и менее тяжелые линии используют 4 vCPU. Pull request в каноническом репозитории используют дополнительный компактный план допуска: те же группы для каждой конфигурации запускаются в изолированных подпроцессах внутри текущего 34-заданийного плана Linux Node, поэтому один PR не регистрирует полную матрицу Node из более чем 70 заданий. Пуши в `main`, ручные dispatch-запуски и release gates сохраняют полную матрицу. Широкие браузерные, QA, медиа- и прочие тесты плагинов используют свои выделенные конфигурации Vitest вместо общего catch-all для плагинов. Include-pattern-шарды записывают тайминги с использованием имени CI-шарда, поэтому `.artifacts/vitest-shard-timings.json` может отличать целую конфигурацию от отфильтрованного шарда. `check-additional-*` держит package-boundary compile/canary работу вместе и отделяет runtime topology architecture от gateway watch coverage; список boundary guard распределен полосами на один prompt-heavy шард и один объединенный шард для оставшихся guard stripes, каждый из которых параллельно запускает выбранные независимые guards и печатает тайминги по каждой проверке. Дорогая проверка дрейфа prompt snapshot для счастливого пути Codex запускается как отдельное дополнительное задание только для ручного CI и изменений, влияющих на prompt, поэтому обычные несвязанные изменения Node не ждут холодной генерации prompt snapshot, а boundary-шарды остаются сбалансированными, при этом prompt drift все еще привязан к PR, который его вызвал; тот же флаг пропускает генерацию prompt snapshot Vitest внутри built-artifact core support-boundary шарда. Gateway watch, тесты каналов и core support-boundary шард запускаются параллельно внутри `build-artifacts` после того, как `dist/` и `dist-runtime/` уже собраны.

После допуска канонический Linux CI разрешает до 24 одновременных заданий тестов Node и
12 для меньших быстрых/check-линий; Windows и Android остаются на двух, потому что
эти пулы раннеров уже.

Компактный план PR создает 18 заданий Node для текущего набора: группы whole-config
пакетируются в изолированных подпроцессах с 120-минутным тайм-аутом пакета,
а include-pattern-группы используют тот же ограниченный бюджет заданий.

Android CI запускает и `testPlayDebugUnitTest`, и `testThirdPartyDebugUnitTest`, а затем собирает Play debug APK. У third-party flavor нет отдельного source set или manifest; его линия unit-test все равно компилирует flavor с флагами BuildConfig для SMS/call-log, избегая при этом дублирующего задания упаковки debug APK при каждом Android-релевантном push.

Шард `check-dependencies` запускает `pnpm deadcode:dependencies` (production-проход Knip только по зависимостям, закрепленный на последней версии Knip, с отключенным минимальным возрастом релиза pnpm для установки `dlx`) и `pnpm deadcode:unused-files`, который сравнивает production-находки Knip по неиспользуемым файлам с `scripts/deadcode-unused-files.allowlist.mjs`. Guard неиспользуемых файлов падает, когда PR добавляет новый непроверенный неиспользуемый файл или оставляет устаревшую запись allowlist, сохраняя при этом намеренные поверхности dynamic plugin, generated, build, live-test и package bridge, которые Knip не может статически разрешить.

## Пересылка активности ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — это мост на стороне целевого репозитория от активности репозитория OpenClaw к ClawSweeper. Он не выполняет checkout и не запускает недоверенный код pull request. Workflow создает токен GitHub App из `CLAWSWEEPER_APP_PRIVATE_KEY`, затем отправляет компактные payload `repository_dispatch` в `openclaw/clawsweeper`.

Workflow имеет четыре линии:

- `clawsweeper_item` для точных запросов на ревью issue и pull request;
- `clawsweeper_comment` для явных команд ClawSweeper в комментариях issue;
- `clawsweeper_commit_review` для запросов ревью на уровне commit при push в `main`;
- `github_activity` для общей активности GitHub, которую агент ClawSweeper может проверить.

Линия `github_activity` пересылает только нормализованные метаданные: тип события, действие, actor, репозиторий, номер элемента, URL, заголовок, состояние и короткие фрагменты комментариев или ревью, если они есть. Она намеренно не пересылает полное тело webhook. Принимающий workflow в `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`; он публикует нормализованное событие в hook OpenClaw Gateway для агента ClawSweeper.

Общая активность — это наблюдение, а не доставка по умолчанию. Агент ClawSweeper получает цель Discord в своем prompt и должен публиковать в `#clawsweeper` только тогда, когда событие неожиданное, требует действия, рискованное или операционно полезное. Обычные открытия, правки, активность ботов, шум дублирующихся webhook и нормальный поток ревью должны приводить к `NO_REPLY`.

Рассматривайте заголовки, комментарии, тела, текст ревью, имена веток и сообщения commit GitHub как недоверенные данные на всем этом пути. Это входные данные для суммаризации и triage, а не инструкции для workflow или runtime агента.

## Ручные dispatch-запуски

Ручные dispatch-запуски CI выполняют тот же граф заданий, что и обычный CI, но принудительно включают каждую scoped-линию, кроме Android: Linux Node shards, bundled-plugin shards, plugin and channel contract shards, совместимость Node 22, `check-*`, `check-additional-*`, built-artifact smoke checks, проверки документации, Python Skills, Windows, macOS, сборку iOS и Control UI i18n. Отдельные ручные dispatch-запуски CI запускают Android только с `include_android=true`; полный release umbrella включает Android, передавая `include_android=true`. Plugin prerelease static checks, release-only шард `agentic-plugins`, полный batch sweep расширений и plugin prerelease Docker lanes исключены из CI. Docker prerelease suite запускается только тогда, когда `Full Release Validation` запускает отдельный workflow `Plugin Prerelease` с включенным gate release-validation.

Ручные запуски используют уникальную concurrency group, поэтому полный набор release-candidate не отменяется другим push или PR run на том же ref. Необязательный ввод `target_ref` позволяет доверенному вызывающему запустить этот граф для ветки, тега или полного commit SHA, используя файл workflow из выбранного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Раннеры

| Раннер                          | Задания                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Ручной dispatch CI и резервные варианты для неканонических репозиториев, quality scans CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, docs workflows вне CI и install-smoke preflight, чтобы матрица Blacksmith могла встать в очередь раньше                 |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, менее тяжелые шарды расширений, `checks-fast-core`, шарды контрактов плагинов/каналов, большинство bundled/lower-weight Linux Node shards, `check-guards`, `check-prod-types`, `check-test-types`, выбранные шарды `check-additional-*` и `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Сохраненные тяжелые наборы Linux Node, boundary/extension-heavy шарды `check-additional-*` и `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (достаточно CPU-чувствителен, чтобы 8 vCPU стоили дороже, чем экономили); install-smoke Docker builds (время ожидания в очереди 32-vCPU стоило дороже, чем экономило)                                                                                 |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` в `openclaw/openclaw`; форки откатываются на `macos-15`                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` и `ios-build` в `openclaw/openclaw`; форки откатываются на `macos-26`                                                                                                                                                                                                  |

## Бюджет регистрации раннеров

Текущий bucket регистрации раннеров GitHub для OpenClaw допускает 3 000 регистраций
self-hosted раннеров за 5 минут. Лимит общий для всех регистраций раннеров Blacksmith
в организации `openclaw`, поэтому добавление еще одной установки Blacksmith
не добавляет новый bucket.

Считайте labels Blacksmith дефицитным ресурсом для управления burst. Задания, которые
только маршрутизируют, уведомляют, суммаризируют, выбирают шарды или запускают короткие сканирования CodeQL,
должны оставаться на GitHub-hosted раннерах, если у них нет измеренных Blacksmith-specific
потребностей. Любая новая матрица Blacksmith, больший `max-parallel` или высокочастотный
workflow должны показывать свой worst-case registration count и удерживать org-level
цель ниже 2 000 регистраций за 5 минут, оставляя запас для параллельных
репозиториев и повторно запущенных заданий.

CI канонического репозитория сохраняет Blacksmith как путь раннеров по умолчанию для обычных push и pull-request запусков. `workflow_dispatch` и запуски неканонических репозиториев используют GitHub-hosted раннеры, но обычные канонические запуски сейчас не проверяют состояние очереди Blacksmith и не откатываются автоматически на GitHub-hosted labels, когда Blacksmith недоступен.

## Локальные эквиваленты

```bash
pnpm changed:lanes                            # проверить локальный классификатор измененных lanes для origin/main...HEAD
pnpm check:changed                            # умный локальный контрольный gate: измененные typecheck/lint/guards по boundary lane
pnpm check                                    # быстрый локальный gate: prod tsgo + шардированный lint + параллельные быстрые guards
pnpm check:test-types
pnpm check:timed                              # тот же gate с замерами времени по этапам
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # тесты vitest
pnpm test:changed                             # дешевые умные измененные цели Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # форматирование docs + lint + битые ссылки
pnpm build                                    # собрать dist, когда важны проверки CI artifact/smoke
pnpm ios:build                                # сгенерировать и собрать проект приложения iOS
pnpm ci:timings                               # свести последний CI-запуск push в origin/main
pnpm ci:timings:recent                        # сравнить последние успешные CI-запуски main
node scripts/ci-run-timings.mjs <run-id>      # свести wall time, queue time и самые медленные jobs
node scripts/ci-run-timings.mjs --latest-main # игнорировать шум issue/comment и выбрать CI push в origin/main
node scripts/ci-run-timings.mjs --recent 10   # сравнить последние успешные CI-запуски main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Производительность OpenClaw

`OpenClaw Performance` — это workflow производительности продукта/runtime. Он ежедневно запускается на `main` и может быть запущен вручную:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручной запуск обычно выполняет бенчмарк ref workflow. Задайте `target_ref`, чтобы выполнить бенчмарк release tag или другой ветки с текущей реализацией workflow. Пути опубликованных отчетов и указатели на последние версии ключуются по тестируемому ref, а каждый `index.md` записывает тестируемые ref/SHA, ref/SHA workflow, Kova ref, профиль, режим auth lane, модель, число повторов и фильтры сценариев.

Workflow устанавливает OCM из закрепленного релиза и Kova из `openclaw/Kova` по закрепленному входу `kova_ref`, затем запускает три lanes:

- `mock-provider`: диагностические сценарии Kova против runtime локальной сборки с детерминированной поддельной OpenAI-совместимой auth.
- `mock-deep-profile`: профилирование CPU/heap/trace для горячих точек startup, gateway и agent-turn.
- `live-openai-candidate`: реальный agent turn OpenAI `openai/gpt-5.5`, пропускается, когда `OPENAI_API_KEY` недоступен.

Lane mock-provider также запускает нативные для OpenClaw пробы исходников после прохода Kova: время загрузки Gateway и память для случаев запуска default, hook и 50-plugin; RSS импорта bundled Plugin, повторяющиеся mock-OpenAI hello-циклы `channel-chat-baseline`, команды запуска CLI против загруженного Gateway и smoke-пробу производительности состояния SQLite. Когда предыдущий опубликованный исходный отчет mock-provider доступен для тестируемого ref, сводка исходных проб сравнивает текущие значения RSS и heap с этим baseline и помечает крупные увеличения RSS как `watch`. Markdown-сводка исходных проб находится в `source/index.md` в комплекте отчета, рядом с ней расположен raw JSON.

Каждая lane загружает GitHub artifacts. Когда настроен `CLAWGRIT_REPORTS_TOKEN`, workflow также коммитит `report.json`, `report.md`, комплекты, `index.md` и artifacts исходных проб в `openclaw/clawgrit-reports` в `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Текущий указатель tested-ref записывается как `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Полная проверка релиза

`Full Release Validation` — это ручной umbrella workflow для «запустить все перед релизом». Он принимает ветку, tag или полный commit SHA, запускает ручной workflow `CI` с этой целью, запускает `Plugin Prerelease` для proof Plugin/package/static/Docker только для релиза и запускает `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, rendering maturity scorecard из evidence профиля QA, parity QA Lab, Matrix и Telegram lanes. Профили stable и full всегда включают исчерпывающее live/E2E и Docker release-path soak coverage; профиль beta может включить его через `run_release_soak=true`. Канонический package Telegram E2E выполняется внутри Package Acceptance, поэтому полный candidate не запускает дублирующий live poller. После публикации передайте `release_package_spec`, чтобы повторно использовать поставленный npm package во всех release checks, Package Acceptance, Docker, cross-OS и Telegram без пересборки. Используйте `npm_telegram_package_spec` только для сфокусированного повторного запуска Telegram с опубликованным пакетом. Live package lane Codex Plugin по умолчанию использует то же выбранное состояние: опубликованный `release_package_spec=openclaw@<tag>` выводит `codex_plugin_spec=npm:@openclaw/codex@<tag>`, а SHA/artifact-запуски упаковывают `extensions/codex` из выбранного ref. Задайте `codex_plugin_spec` явно для пользовательских источников Plugin, таких как specs `npm:`, `npm-pack:` или `git:`.

См. [полную проверку релиза](/ru/reference/full-release-validation) для
матрицы этапов, точных имен workflow jobs, различий профилей, artifacts и
handles сфокусированных повторных запусков.

`OpenClaw Release Publish` — это ручной изменяющий release workflow. Запускайте его
из `release/YYYY.M.PATCH` или `main` после того, как release tag существует и
после успешного OpenClaw npm preflight. Он проверяет `pnpm plugins:sync:check`,
запускает `Plugin NPM Release` для всех публикуемых packages Plugin, запускает
`Plugin ClawHub Release` для того же release SHA и только затем запускает
`OpenClaw NPM Release` с сохраненным `preflight_run_id`. Публикация stable также
требует точный `windows_node_tag`; workflow проверяет исходный Windows release
и сравнивает его x64/ARM64 installers с одобренным candidate входом
`windows_node_installer_digests` перед любым дочерним publish, затем продвигает
и проверяет те же закрепленные installer digests плюс точный companion asset
и checksum contract перед публикацией черновика GitHub release.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для proof закрепленного commit на быстро меняющейся ветке используйте helper вместо
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs dispatch для GitHub workflow должны быть ветками или tags, а не raw commit SHA. Этот
helper отправляет временную ветку `release-ci/<sha>-...` на целевой SHA,
запускает `Full Release Validation` из этого закрепленного ref, проверяет, что каждый дочерний
workflow `headSha` совпадает с целью, и удаляет временную ветку после завершения
запуска. Umbrella verifier также завершится ошибкой, если любой дочерний workflow выполнялся на
другом SHA.

`release_profile` управляет широтой live/provider, передаваемой в release checks. Ручные
release workflows по умолчанию используют `stable`; используйте `full` только когда
намеренно нужен широкий advisory provider/media matrix. Stable и full
release checks всегда запускают исчерпывающий live/E2E и Docker release-path soak;
профиль beta может включить его через `run_release_soak=true`.

- `minimum` оставляет самые быстрые критичные для релиза OpenAI/core lanes.
- `stable` добавляет стабильный набор provider/backend.
- `full` запускает широкий advisory provider/media matrix.

Umbrella записывает ids запущенных дочерних run, а финальный job `Verify full validation` повторно проверяет текущие conclusions дочерних run и добавляет таблицы самых медленных jobs для каждого дочернего run. Если дочерний workflow перезапущен и стал зеленым, перезапустите только parent verifier job, чтобы обновить результат umbrella и сводку timings.

Для восстановления `Full Release Validation` и `OpenClaw Release Checks` принимают `rerun_group`. Используйте `all` для release candidate, `ci` только для обычного дочернего полного CI, `plugin-prerelease` только для дочернего plugin prerelease, `release-checks` для каждого дочернего release или более узкую группу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` или `npm-telegram` в umbrella. Это сохраняет повторный запуск failed release box ограниченным после сфокусированного исправления. Для одной failed cross-OS lane сочетайте `rerun_group=cross-os` с `cross_os_suite_filter`, например `windows/packaged-upgrade`; длинные cross-OS команды выводят строки heartbeat, а сводки packaged-upgrade включают timings по фазам. QA release-check lanes являются advisory, кроме стандартного runtime tool coverage gate, который блокирует, когда обязательные динамические инструменты OpenClaw drift или исчезают из сводки standard tier.

`OpenClaw Release Checks` использует trusted workflow ref, чтобы один раз разрешить выбранный ref в tarball `release-package-under-test`, затем передает этот artifact в cross-OS checks и Package Acceptance, а также в live/E2E release-path Docker workflow, когда выполняется soak coverage. Это сохраняет bytes package согласованными между release boxes и избегает повторной упаковки одного и того же candidate в нескольких дочерних jobs. Для live lane Codex npm-plugin release checks либо передают matching published plugin spec, выведенный из `release_package_spec`, либо передают предоставленный оператором `codex_plugin_spec`, либо оставляют вход пустым, чтобы Docker script упаковал Codex Plugin выбранного checkout.

Дублирующиеся запуски `Full Release Validation` для `ref=main` и `rerun_group=all`
заменяют более старую umbrella. Parent monitor отменяет любой дочерний workflow, который
он уже запустил, когда parent отменен, поэтому более новая validation main
не ждет за устаревшим двухчасовым release-check run. Проверка release branch/tag
и сфокусированные rerun groups сохраняют `cancel-in-progress: false`.

## Live и E2E shards

Дочерний release live/E2E сохраняет широкое нативное покрытие `pnpm test:live`, но запускает его как именованные shards через `scripts/test-live-shard.mjs` вместо одного serial job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered jobs `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- разделенные shards media audio/video и provider-filtered music shards

Это сохраняет то же файловое покрытие и при этом упрощает повторный запуск и диагностику медленных live provider failures. Совокупные имена shards `native-live-extensions-o-z`, `native-live-extensions-media` и `native-live-extensions-media-music` остаются действительными для ручных разовых reruns.

Нативные live media shards запускаются в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, собранном workflow `Live Media Runner Image`. Этот image предварительно устанавливает `ffmpeg` и `ffprobe`; media jobs только проверяют binaries перед setup. Держите Docker-backed live suites на обычных Blacksmith runners — container jobs являются неподходящим местом для запуска nested Docker tests.

Docker-шарды для live-моделей и бэкендов используют отдельный общий образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для каждого выбранного коммита. Workflow live-релиза собирает и отправляет этот образ один раз, после чего Docker-шарды live-модели, provider-шардированного Gateway, CLI-бэкенда, ACP bind и Codex harness запускаются с `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарды Gateway имеют явные ограничения `timeout` на уровне скриптов ниже тайм-аута задания workflow, чтобы зависший контейнер или путь очистки быстро завершался ошибкой, а не расходовал весь бюджет release-check. Если эти шарды самостоятельно пересобирают полный Docker-таргет исходного кода, release-запуск настроен неверно и будет тратить фактическое время на дублирующие сборки образов.

## Приемка пакета

Используйте `Package Acceptance`, когда вопрос звучит так: «работает ли этот устанавливаемый пакет OpenClaw как продукт?» Это отличается от обычного CI: обычный CI проверяет дерево исходного кода, а приемка пакета проверяет один tarball через тот же Docker E2E harness, который пользователи задействуют после установки или обновления.

### Задания

1. `resolve_package` выполняет checkout `workflow_ref`, определяет одного кандидата пакета, записывает `.artifacts/docker-e2e-package/openclaw-current.tgz`, записывает `.artifacts/docker-e2e-package/package-candidate.json`, загружает оба файла как артефакт `package-under-test` и печатает источник, workflow ref, package ref, версию, SHA-256 и профиль в summary шага GitHub.
2. `docker_acceptance` вызывает `openclaw-live-and-e2e-checks-reusable.yml` с `ref=workflow_ref` и `package_artifact_name=package-under-test`. Переиспользуемый workflow скачивает этот артефакт, проверяет инвентарь tarball, при необходимости подготавливает Docker-образы package-digest и запускает выбранные Docker lanes с этим пакетом вместо упаковки checkout workflow. Когда профиль выбирает несколько targeted `docker_lanes`, переиспользуемый workflow подготавливает пакет и общие образы один раз, затем разветвляет эти lanes в параллельные targeted Docker-задания с уникальными артефактами.
3. `package_telegram` опционально вызывает `NPM Telegram Beta E2E`. Он запускается, когда `telegram_mode` не равен `none`, и устанавливает тот же артефакт `package-under-test`, если Package Acceptance определила пакет; самостоятельный dispatch Telegram все еще может устанавливать опубликованную npm-спецификацию.
4. `summary` завершает workflow ошибкой, если разрешение пакета, Docker-приемка или опциональный Telegram lane завершились ошибкой.

### Источники кандидатов

- `source=npm` принимает только `openclaw@beta`, `openclaw@latest` или точную версию релиза OpenClaw, например `openclaw@2026.4.27-beta.2`. Используйте это для приемки опубликованных prerelease/stable версий.
- `source=ref` упаковывает доверенную ветку, тег или полный SHA коммита из `package_ref`. Resolver получает ветки/теги OpenClaw, проверяет, что выбранный коммит достижим из истории ветки репозитория или release tag, устанавливает зависимости в detached worktree и упаковывает его с помощью `scripts/package-openclaw-for-docker.mjs`.
- `source=url` скачивает публичный HTTPS `.tgz`; `package_sha256` обязателен. Этот путь отклоняет учетные данные в URL, нестандартные HTTPS-порты, частные/внутренние/специального назначения hostnames или разрешенные IP-адреса, а также редиректы за пределы той же публичной политики безопасности.
- `source=trusted-url` скачивает HTTPS `.tgz` из именованной trusted-source policy в `.github/package-trusted-sources.json`; `package_sha256` и `trusted_source_id` обязательны. Используйте это только для принадлежащих мейнтейнерам enterprise-зеркал или частных репозиториев пакетов, которым нужны настроенные hosts, ports, prefixes путей, redirect hosts или private-network resolution. Если policy объявляет bearer auth, workflow использует фиксированный secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; учетные данные, встроенные в URL, по-прежнему отклоняются.
- `source=artifact` скачивает один `.tgz` из `artifact_run_id` и `artifact_name`; `package_sha256` необязателен, но его следует указывать для внешне распространяемых артефактов.

Держите `workflow_ref` и `package_ref` раздельно. `workflow_ref` — это доверенный код workflow/harness, который запускает тест. `package_ref` — исходный коммит, который упаковывается при `source=ref`. Это позволяет текущему test harness проверять более старые доверенные коммиты исходного кода без запуска старой логики workflow.

### Профили набора

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — полные chunks Docker release-path с OpenWebUI
- `custom` — точные `docker_lanes`; обязательно, когда `suite_profile=custom`

Профиль `package` использует offline-покрытие plugin, чтобы проверка опубликованного пакета не зависела от доступности live ClawHub. Опциональный Telegram lane переиспользует артефакт `package-under-test` в `NPM Telegram Beta E2E`, при этом путь опубликованной npm-спецификации сохранен для самостоятельных dispatch.

Для отдельной политики тестирования обновлений и plugin, включая локальные команды,
Docker lanes, входные данные Package Acceptance, release defaults и triage сбоев,
см. [Тестирование обновлений и plugin](/ru/help/testing-updates-plugins).

Release checks вызывают Package Acceptance с `source=artifact`, подготовленным артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` и `telegram_mode=mock-openai`. Это удерживает проверку миграции пакета, обновления, установки live ClawHub skill, очистки stale-plugin-dependency, восстановления установки configured-plugin, offline plugin, plugin-update и Telegram на одном и том же разрешенном package tarball. Задайте `release_package_spec` в Full Release Validation или OpenClaw Release Checks после публикации beta, чтобы запустить ту же матрицу против отгруженного npm-пакета без пересборки; задавайте `package_acceptance_package_spec` только когда Package Acceptance нужен пакет, отличающийся от остальной release validation. Cross-OS release checks по-прежнему покрывают OS-specific onboarding, installer и platform behavior; product validation пакета/обновления должна начинаться с Package Acceptance. Docker lane `published-upgrade-survivor` проверяет один опубликованный package baseline на запуск в блокирующем release path. В Package Acceptance разрешенный tarball `package-under-test` всегда является кандидатом, а `published_upgrade_survivor_baseline` выбирает fallback опубликованный baseline, по умолчанию `openclaw@latest`; команды rerun для failed-lane сохраняют этот baseline. Full Release Validation с `run_release_soak=true` или `release_profile=full` задает `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` и `published_upgrade_survivor_scenarios=reported-issues`, чтобы расширить проверку на четыре последних stable npm-релиза плюс закрепленные plugin-compatibility boundary releases и issue-shaped fixtures для конфигурации Feishu, сохраненных файлов bootstrap/persona, установок configured OpenClaw plugin, путей логов с tilde и stale legacy plugin dependency roots. Multi-baseline published-upgrade survivor selections шардируются по baseline в отдельные targeted Docker runner jobs. Отдельный workflow `Update Migration` использует Docker lane `update-migration` с `all-since-2026.4.23` и `plugin-deps-cleanup`, когда вопрос заключается в исчерпывающей очистке опубликованных обновлений, а не в обычной широте Full Release CI. Локальные aggregate runs могут передавать точные спецификации пакетов через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, оставлять один lane с `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, например `openclaw@2026.4.15`, или задавать `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матрицы сценариев. Опубликованный lane настраивает baseline с baked-рецептом команды `openclaw config set`, записывает шаги рецепта в `summary.json` и проверяет `/healthz`, `/readyz`, а также RPC status после запуска Gateway. Windows lanes для packaged и fresh installer также проверяют, что установленный пакет может импортировать browser-control override из raw absolute Windows path. OpenAI cross-OS agent-turn smoke по умолчанию использует `OPENCLAW_CROSS_OS_OPENAI_MODEL`, если он задан, иначе `openai/gpt-5.5`, поэтому доказательство установки и gateway остается на тестовой модели GPT-5, избегая дефолтов GPT-4.x.

### Окна legacy-совместимости

Package Acceptance имеет ограниченные окна legacy-совместимости для уже опубликованных пакетов. Пакеты до `2026.4.25` включительно, включая `2026.4.25-beta.*`, могут использовать путь совместимости:

- известные private QA entries в `dist/postinstall-inventory.json` могут указывать на файлы, отсутствующие в tarball;
- `doctor-switch` может пропускать subcase persistence для `gateway install --wrapper`, когда пакет не предоставляет этот flag;
- `update-channel-switch` может удалять отсутствующие pnpm `patchedDependencies` из fake git fixture, полученной из tarball, и может логировать отсутствующий persisted `update.channel`;
- plugin smokes могут читать legacy install-record locations или принимать отсутствие marketplace install-record persistence;
- `plugin-update` может разрешать миграцию config metadata, при этом по-прежнему требуя, чтобы install record и no-reinstall behavior оставались неизменными.

Опубликованный пакет `2026.4.26` также может выдавать предупреждения для local build metadata stamp files, которые уже были отгружены. Более поздние пакеты должны соответствовать современным контрактам; те же условия завершаются ошибкой, а не предупреждением или пропуском.

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

При отладке неудачного запуска приемки пакета начните с summary `resolve_package`, чтобы подтвердить источник пакета, версию и SHA-256. Затем изучите child run `docker_acceptance` и его Docker-артефакты: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings и rerun commands. Предпочитайте повторный запуск failed package profile или точных Docker lanes вместо повторного запуска полной release validation.

## Install smoke

Отдельный workflow `Install Smoke` переиспользует тот же scope script через собственное задание `preflight`. Он разделяет smoke-покрытие на `run_fast_install_smoke` и `run_full_install_smoke`.

- **Быстрый путь** запускается для pull requests, затрагивающих поверхности Docker/пакетов, изменения пакетов/манифестов встроенных plugins либо поверхности core plugin/channel/gateway/Plugin SDK, которые проверяют Docker smoke-задания. Изменения только исходного кода встроенных plugins, правки только тестов и правки только документации не резервируют Docker workers. Быстрый путь один раз собирает образ корневого Dockerfile, проверяет CLI, запускает CLI smoke для удаления agents shared-workspace, запускает container gateway-network e2e, проверяет build arg встроенного extension и запускает ограниченный Docker-профиль встроенного plugin с общим тайм-аутом команды 240 секунд (Docker-запуск каждого сценария ограничен отдельно).
- **Полный путь** сохраняет покрытие QR package install и installer Docker/update для ночных запусков по расписанию, ручных dispatch, release checks через workflow-call и pull requests, которые действительно затрагивают поверхности installer/package/Docker. В полном режиме install-smoke подготавливает или переиспользует один smoke-образ GHCR root Dockerfile для целевого SHA, затем запускает QR package install, root Dockerfile/gateway smokes, installer/update smokes и быстрый Docker E2E встроенного plugin как отдельные задания, чтобы работа installer не ждала за smoke-проверками корневого образа.

Push в `main` (включая merge commits) не принуждают к полному пути; когда логика changed-scope запрашивала бы полное покрытие при push, workflow сохраняет быстрый Docker smoke и оставляет полный install smoke для ночной или release-валидации.

Медленный Bun global install image-provider smoke отдельно ограничен через `run_bun_global_install_smoke`. Он запускается по ночному расписанию и из workflow release checks, а ручные dispatch `Install Smoke` могут включить его, но pull requests и push в `main` не запускают его. Обычный PR CI по-прежнему запускает быстрый regression lane Bun launcher для изменений, релевантных Node. QR и installer Docker tests сохраняют собственные install-focused Dockerfile.

## Локальный Docker E2E

`pnpm test:docker:all` предварительно собирает один общий live-test образ, один раз упаковывает OpenClaw как npm tarball и собирает два общих образа `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lanes;
- функциональный образ, который устанавливает тот же tarball в `/app` для обычных functionality lanes.

Определения Docker lanes находятся в `scripts/lib/docker-e2e-scenarios.mjs`, логика планировщика находится в `scripts/lib/docker-e2e-plan.mjs`, а runner выполняет только выбранный план. Планировщик выбирает образ для каждого lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` и `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, затем запускает lanes с `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Настраиваемые параметры

| Переменная                            | По умолчанию | Назначение                                                                                         |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Количество слотов основного пула для обычных lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Количество слотов tail-пула, чувствительного к providers.                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Лимит одновременных live lanes, чтобы providers не применяли throttling.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Лимит одновременных npm install lanes.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Лимит одновременных multi-service lanes.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Задержка между стартами lanes, чтобы избежать всплесков создания в Docker daemon; задайте `0`, чтобы отключить задержку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервный тайм-аут на lane (120 минут); выбранные live/tail lanes используют более строгие лимиты. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано | `1` печатает план планировщика без запуска lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано | Список точных lanes через запятую; пропускает cleanup smoke, чтобы agents могли воспроизвести один упавший lane. |

Lane, более тяжелый, чем его эффективный лимит, все равно может стартовать из пустого пула, затем выполняется один, пока не освободит емкость. Локальный aggregate выполняет preflight Docker, удаляет устаревшие контейнеры OpenClaw E2E, выводит статус активных lanes, сохраняет timings lanes для сортировки longest-first и по умолчанию прекращает планировать новые pooled lanes после первого сбоя.

### Переиспользуемый live/E2E workflow

Переиспользуемый live/E2E workflow спрашивает у `scripts/test-docker-all.mjs --plan-json`, какое покрытие package, image kind, live image, lane и credentials требуется. Затем `scripts/docker-e2e.mjs` преобразует этот план в GitHub outputs и summaries. Он либо упаковывает OpenClaw через `scripts/package-openclaw-for-docker.mjs`, либо скачивает package artifact текущего run, либо скачивает package artifact из `package_artifact_run_id`; проверяет inventory tarball; собирает и публикует package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, когда плану нужны package-installed lanes; и переиспользует переданные inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` или существующие package-digest images вместо пересборки. Pull Docker images повторяются с ограниченным тайм-аутом 180 секунд на попытку, чтобы зависший поток registry/cache быстро повторился, а не потребил большую часть критического пути CI.

### Чанки release path

Release Docker coverage запускает меньшие chunked jobs с `OPENCLAW_SKIP_DOCKER_BUILD=1`, чтобы каждый chunk скачивал только нужный ему image kind и выполнял несколько lanes через тот же взвешенный планировщик:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Текущие release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` и `plugins-runtime-install-a` через `plugins-runtime-install-h`. `package-update-openai` включает live Codex plugin package lane, который устанавливает candidate package OpenClaw, устанавливает Codex plugin из `codex_plugin_spec` или same-ref tarball с явным одобрением установки Codex CLI, запускает preflight Codex CLI, затем выполняет несколько turns agent OpenClaw в той же session против OpenAI. `plugins-runtime-core`, `plugins-runtime` и `plugins-integrations` остаются aggregate aliases для plugin/runtime. Alias lane `install-e2e` остается aggregate manual rerun alias для обоих provider installer lanes.

OpenWebUI включается в `plugins-runtime-services`, когда это запрашивает полное покрытие release-path, и сохраняет отдельный chunk `openwebui` только для dispatches, относящихся только к OpenWebUI. Bundled-channel update lanes повторяются один раз при transient npm network failures.

Каждый chunk загружает `.artifacts/docker-tests/` с lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables и командами rerun для каждого lane. Input workflow `docker_lanes` запускает выбранные lanes на подготовленных images вместо chunk jobs, что удерживает отладку failed-lane в рамках одного целевого Docker job и подготавливает, скачивает или переиспользует package artifact для этого run; если выбранный lane является live Docker lane, целевое job локально собирает live-test image для этого rerun. Сгенерированные команды GitHub rerun для каждого lane включают `package_artifact_run_id`, `package_artifact_name` и inputs подготовленных images, когда эти значения существуют, чтобы failed lane мог переиспользовать точные package и images из упавшего run.

```bash
pnpm test:docker:rerun <run-id>      # скачать Docker artifacts и вывести объединенные/поштучные целевые команды rerun
pnpm test:docker:timings <summary>   # сводки slow-lane и phase critical-path
```

Scheduled live/E2E workflow ежедневно запускает полный release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` — более дорогое покрытие product/package, поэтому это отдельный workflow, запускаемый `Full Release Validation` или явным оператором. Обычные pull requests, push в `main` и standalone manual CI dispatches держат этот suite выключенным. Он балансирует тесты встроенных plugins между восемью extension workers; эти extension shard jobs запускают до двух plugin config groups одновременно с одним Vitest worker на группу и увеличенной Node heap, чтобы import-heavy plugin batches не создавали дополнительные CI jobs. Release-only Docker prerelease path группирует целевые Docker lanes малыми группами, чтобы не резервировать десятки runners для заданий на одну-три минуты. Workflow также загружает информационный artifact `plugin-inspector-advisory` из `@openclaw/plugin-inspector`; findings inspector являются входными данными для triage и не меняют блокирующий gate Plugin Prerelease.

## QA Lab

QA Lab имеет выделенные CI lanes вне основного smart-scoped workflow. Agentic parity вложен в широкие QA и release harnesses, а не является standalone PR workflow. Используйте `Full Release Validation` с `rerun_group=qa-parity`, когда parity должен идти вместе с broad validation run.

- Workflow `QA-Lab - All Lanes` запускается каждую ночь на `main` и при manual dispatch; он разветвляет mock parity lane, live Matrix lane, а также live Telegram и Discord lanes как parallel jobs. Live jobs используют environment `qa-live-shared`, а Telegram/Discord используют Convex leases.

Release checks запускают Matrix и Telegram live transport lanes с deterministic mock provider и mock-qualified models (`mock-openai/gpt-5.5` и `mock-openai/gpt-5.5-alt`), чтобы channel contract был изолирован от live model latency и обычного startup provider-plugin. Live transport gateway отключает memory search, потому что QA parity отдельно покрывает memory behavior; provider connectivity покрывается отдельными live model, native provider и Docker provider suites.

Matrix использует `--profile fast` для scheduled и release gates, добавляя `--fail-fast` только когда checked-out CLI поддерживает его. CLI default и input manual workflow остаются `all`; manual dispatch `matrix_profile=all` всегда разбивает полное Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` и `e2ee-cli`.

`OpenClaw Release Checks` также запускает release-critical QA Lab lanes перед release approval; его QA parity gate запускает candidate и baseline packs как parallel lane jobs, затем скачивает оба artifacts в небольшое report job для итогового сравнения parity.

Для обычных PRs следуйте scoped CI/check evidence вместо того, чтобы считать parity обязательным status.

## CodeQL

Workflow `CodeQL` намеренно является узким first-pass security scanner, а не полным sweep repository. Daily, manual и non-draft pull request guard runs сканируют Actions workflow code плюс наиболее рискованные JavaScript/TypeScript surfaces с high-confidence security queries, отфильтрованными до high/critical `security-severity`.

Pull request guard остается легким: он стартует только для изменений в `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` или `src` и запускает ту же high-confidence security matrix, что и scheduled workflow. Android и macOS CodeQL остаются вне PR defaults.

### Категории безопасности

| Категория                                        | Поверхность                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Базовый уровень auth, секретов, sandbox, Cron и Gateway                                                                             |
| `/codeql-security-high/channel-runtime-boundary`  | Контракты реализации каналов ядра, а также среда выполнения Plugin каналов, Gateway, Plugin SDK, секреты и точки аудита            |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхности ядра для SSRF, разбора IP, сетевой защиты, web-fetch и политики SSRF в Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-серверы, вспомогательные средства выполнения процессов, исходящая доставка и шлюзы выполнения инструментов агентом             |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхности доверия для установки Plugin, загрузчика, манифеста, реестра, установки через пакетный менеджер, загрузки исходников и контракта пакета Plugin SDK |

### Платформенные security-шарды

- `CodeQL Android Critical Security` — запланированный Android security-шард. Собирает Android-приложение вручную для CodeQL на минимальном Blacksmith Linux runner, допустимом проверкой корректности workflow. Загружает результаты в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — еженедельный/ручной macOS security-шард. Собирает macOS-приложение вручную для CodeQL на Blacksmith macOS, отфильтровывает результаты сборки зависимостей из загружаемого SARIF и загружает результаты в `/codeql-critical-security/macos`. Оставлен вне ежедневных значений по умолчанию, потому что сборка macOS доминирует по времени выполнения даже в чистом состоянии.

### Категории Critical Quality

`CodeQL Critical Quality` — соответствующий не-security шард. Он запускает только JavaScript/TypeScript quality-запросы с severity error и без security над узкими высокоценными поверхностями на GitHub-hosted Linux runners, чтобы quality-сканирования не расходовали бюджет регистрации Blacksmith runners. Его guard для pull request намеренно меньше запланированного профиля: для не-draft PR запускаются только соответствующие шарды `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` и `plugin-sdk-reply-runtime` для изменений в коде выполнения команд/моделей/инструментов агентом и диспетчеризации ответов, схеме config/миграции/IO, auth/секретах/sandbox/security-коде, канале ядра и среде выполнения встроенного Plugin канала, протоколе Gateway/server-method, runtime памяти/связке SDK, MCP/process/outbound delivery, provider runtime/каталоге моделей, диагностике сессий/очередях доставки, загрузчике Plugin, Plugin SDK/контракте пакета или среде выполнения ответов Plugin SDK. Изменения конфигурации CodeQL и quality-workflow запускают все двенадцать PR quality-шардов.

Ручной dispatch принимает:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Узкие профили — это хуки для обучения и итераций, позволяющие запускать один quality-шард изолированно.

| Категория                                              | Поверхность                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код security-границы auth, секретов, sandbox, Cron и Gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Контракты схемы config, миграции, нормализации и IO                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схемы протокола Gateway и контракты server method                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракты реализации канала ядра и встроенного Plugin канала                                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Контракты выполнения команд, диспетчеризации model/provider, диспетчеризации auto-reply и очередей, а также runtime control-plane ACP                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-серверы и мосты инструментов, вспомогательные средства надзора за процессами и контракты исходящей доставки                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасады memory runtime, псевдонимы memory Plugin SDK, связка активации memory runtime и команды memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутреннее устройство очереди ответов, очереди доставки сессий, вспомогательные средства привязки/доставки исходящих сессий, поверхности diagnostic event/log bundle и контракты CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризация входящих ответов Plugin SDK, вспомогательные средства payload/chunking/runtime для ответов, параметры ответов каналов, очереди доставки и вспомогательные средства привязки session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормализация каталога моделей, auth и discovery provider, регистрация provider runtime, defaults/catalogs provider и реестры web/search/fetch/embedding          |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальное сохранение, control flows Gateway и runtime-контракты task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракты runtime для core web fetch/search, media IO, понимания media, image-generation и media-generation                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Контракты загрузчика, реестра, публичной поверхности и entrypoint Plugin SDK                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубликованные исходники Plugin SDK на стороне пакета и вспомогательные средства контракта пакета plugin                                                          |

Quality остаётся отдельно от security, чтобы quality-находки можно было планировать, измерять, отключать или расширять без размывания security-сигнала. Расширение CodeQL для Swift, Python и встроенных plugin следует возвращать только как scoped или sharded последующую работу после того, как узкие профили получат стабильные runtime и сигнал.

## Workflow сопровождения

### Docs Agent

Workflow `Docs Agent` — это событийная линия сопровождения Codex для поддержания существующей документации в соответствии с недавно попавшими изменениями. У него нет чистого расписания: успешный CI-запуск push от не-bot на `main` может его запустить, а ручной dispatch может запустить его напрямую. Вызовы workflow-run пропускаются, когда `main` уже ушёл дальше или когда другой не пропущенный запуск Docs Agent был создан за последний час. Когда он запускается, он проверяет диапазон коммитов от предыдущего не пропущенного исходного SHA Docs Agent до текущего `main`, поэтому один почасовой запуск может покрыть все изменения main, накопленные с момента последнего прохода по документации.

### Test Performance Agent

Workflow `Test Performance Agent` — это событийная линия сопровождения Codex для медленных тестов. У него нет чистого расписания: успешный CI-запуск push от не-bot на `main` может его запустить, но он пропускается, если другой вызов workflow-run уже запускался или выполняется в этот UTC-день. Ручной dispatch обходит этот дневной activity gate. Линия строит grouped performance report Vitest для полного набора, позволяет Codex вносить только небольшие performance-исправления тестов с сохранением покрытия вместо широких рефакторингов, затем повторно запускает full-suite report и отклоняет изменения, которые уменьшают базовое количество проходящих тестов. Grouped report записывает wall time и max RSS по config на Linux и macOS, поэтому сравнение до/после показывает дельты памяти тестов рядом с дельтами длительности. Если в baseline есть падающие тесты, Codex может исправлять только очевидные сбои, а after-agent full-suite report должен пройти до коммита чего-либо. Когда `main` продвигается до того, как bot push попадает в репозиторий, линия rebases проверенный patch, повторно запускает `pnpm check:changed` и пробует push снова; конфликтующие устаревшие patches пропускаются. Она использует GitHub-hosted Ubuntu, чтобы Codex action мог сохранять ту же позицию безопасности drop-sudo, что и docs agent.

### Дублирующие PR после merge

Workflow `Duplicate PRs After Merge` — это ручной maintainer workflow для очистки дубликатов после попадания изменений. По умолчанию он работает в dry-run и закрывает только явно перечисленные PR, когда `apply=true`. Перед изменением GitHub он проверяет, что попавший PR смержен и что у каждого дубликата есть либо общая referenced issue, либо пересекающиеся изменённые hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальные check gates и changed routing

Локальная логика changed-lane находится в `scripts/changed-lanes.mjs` и выполняется через `scripts/check-changed.mjs`. Этот локальный check gate строже к архитектурным границам, чем широкий platform scope CI:

- production-изменения ядра запускают core prod и core test typecheck плюс core lint/guards;
- изменения только в тестах ядра запускают только core test typecheck плюс core lint;
- production-изменения extensions запускают extension prod и extension test typecheck плюс extension lint;
- изменения только в тестах extensions запускают extension test typecheck плюс extension lint;
- изменения public Plugin SDK или plugin-contract расширяются до typecheck extensions, потому что extensions зависят от этих контрактов ядра (Vitest extension sweeps остаются явной тестовой работой);
- version bumps только в release metadata запускают targeted version/config/root-dependency checks;
- неизвестные изменения root/config fail safe во все check lanes.

Локальный changed-test routing находится в `scripts/test-projects.test-support.mjs` и намеренно дешевле, чем `check:changed`: прямые изменения тестов запускают сами себя, изменения исходников предпочитают явные mappings, затем sibling tests и import-graph dependents. Shared group-room delivery config — один из явных mappings: изменения group visible-reply config, source reply delivery mode или message-tool system prompt проходят через core reply tests плюс регрессии доставки Discord и Slack, чтобы изменение shared default падало до первого PR push. Используйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только когда изменение достаточно широко затрагивает harness, чтобы дешёвый mapped set не был надёжным proxy.

## Валидация Testbox

Crabbox — это принадлежащая репозиторию обёртка remote-box для maintainer Linux proof. Используйте её
из корня репозитория, когда check слишком широк для локального edit loop, когда важен
паритет с CI или когда proof требует секретов, Docker, package lanes,
переиспользуемых boxes или remote logs. Обычный backend OpenClaw —
`blacksmith-testbox`; собственные мощности AWS/Hetzner являются fallback при сбоях Blacksmith,
проблемах квот или явном тестировании на собственной capacity.

Запуски Blacksmith через Crabbox подготавливают, захватывают, синхронизируют, запускают, формируют отчет и очищают
одноразовые Testbox. Встроенная проверка корректности синхронизации быстро завершается с ошибкой, когда обязательные
корневые файлы, например `pnpm-lock.yaml`, исчезают или когда `git status --short`
показывает не менее 200 отслеживаемых удалений. Для PR с намеренным массовым удалением задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для удаленной команды.

Crabbox также завершает локальный вызов Blacksmith CLI, который остается на этапе
синхронизации более пяти минут без вывода после синхронизации. Задайте
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, чтобы отключить эту защиту, или используйте большее
значение в миллисекундах для необычно больших локальных diff.

Перед первым запуском проверьте wrapper из корня репозитория:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper репозитория отклоняет устаревший бинарный файл Crabbox, который не объявляет `blacksmith-testbox`. Передавайте provider явно, даже если `.crabbox.yaml` содержит настройки owned-cloud по умолчанию. В рабочих деревьях Codex или связанных/разреженных checkout избегайте локального скрипта `pnpm crabbox:run`, потому что pnpm может сверить зависимости до запуска Crabbox; вместо этого вызывайте node wrapper напрямую:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Запуски через Blacksmith требуют Crabbox 0.22.0 или новее, чтобы wrapper получал текущее поведение синхронизации, очереди и очистки Testbox. При использовании соседнего checkout пересоберите игнорируемый локальный бинарный файл перед замерами времени или проверочной работой:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Гейт изменений:

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

Повторный запуск точечного теста:

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
запусков Blacksmith Testbox код выхода wrapper Crabbox и сводка JSON являются
результатом команды. Связанный запуск GitHub Actions отвечает за hydration и keepalive; он
может завершиться как `cancelled`, когда Testbox остановлен извне после того, как команда SSH
уже вернулась. Считайте это артефактом очистки/статуса, если только
`exitCode` wrapper не ненулевой или вывод команды не показывает упавший тест.
Одноразовые запуски Crabbox через Blacksmith должны автоматически останавливать Testbox;
если запуск прерван или очистка неясна, проверьте живые boxes и остановите только
те boxes, которые создали вы:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Используйте повторное использование только когда вам намеренно нужно выполнить несколько команд на одном и том же hydrated box:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Если Crabbox является сломанным слоем, но сам Blacksmith работает, используйте прямой
Blacksmith только для диагностики, например `list`, `status` и очистки. Исправьте
путь Crabbox, прежде чем считать прямой запуск Blacksmith проверочным доказательством maintainer.

Если `blacksmith testbox list --all` и `blacksmith testbox status` работают, но новые
warmup остаются в `queued` без IP или URL запуска Actions спустя пару минут,
считайте это давлением со стороны provider Blacksmith, очереди, биллинга или лимита организации. Остановите
созданные вами queued ids, не запускайте новые Testbox и перенесите proof на
путь owned Crabbox capacity ниже, пока кто-то проверяет dashboard Blacksmith,
биллинг и лимиты организации.

Переходите на owned Crabbox capacity только когда Blacksmith недоступен, ограничен квотой, не имеет нужного окружения или owned capacity явно является целью:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

При давлении AWS избегайте `class=beast`, если задаче действительно не нужен CPU уровня 48xlarge. Запрос `beast` начинается со 192 vCPU и является самым простым способом упереться в региональную квоту EC2 Spot или On-Demand Standard. Репозиторный `.crabbox.yaml` по умолчанию задает `standard`, несколько регионов capacity и `capacity.hints: true`, поэтому brokered AWS leases выводят выбранные регион/market, давление квот, fallback Spot и предупреждения о классе под высоким давлением. Используйте `fast` для более тяжелых широких проверок, `large` только после того, как standard/fast недостаточно, и `beast` только для исключительных CPU-bound lanes, например full-suite или all-plugin Docker matrices, явной release/blocker validation или high-core performance profiling. Не используйте `beast` для `pnpm check:changed`, точечных тестов, docs-only работы, обычных lint/typecheck, небольших E2E repro или triage сбоя Blacksmith. Используйте `--market on-demand` для диагностики capacity, чтобы колебания рынка Spot не смешивались с сигналом.

`.crabbox.yaml` владеет настройками provider, sync и GitHub Actions hydration по умолчанию для owned-cloud lanes. Он исключает локальный `.git`, чтобы hydrated Actions checkout сохранял собственные remote Git metadata вместо синхронизации maintainer-local remotes и object stores, и исключает локальные runtime/build artifacts, которые никогда не должны передаваться. `.github/workflows/crabbox-hydrate.yml` владеет checkout, настройкой Node/pnpm, получением `origin/main` и передачей несекретного окружения для owned-cloud команд `crabbox run --id <cbx_id>`.

## Связанные материалы

- [Обзор установки](/ru/install)
- [Каналы разработки](/ru/install/development-channels)
