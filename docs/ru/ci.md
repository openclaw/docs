---
read_when:
    - Вам нужно понять, почему задание CI было запущено или не было запущено
    - Вы отлаживаете падающую проверку GitHub Actions
    - Вы координируете запуск или повторный запуск проверки релиза
    - Вы меняете диспетчеризацию ClawSweeper или пересылку активности GitHub
summary: Граф заданий CI, шлюзы области, релизные зонтики и локальные эквиваленты команд
title: Конвейер CI
x-i18n:
    generated_at: "2026-07-04T06:43:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускается при каждом push в `main` и для каждого pull request. Канонические
push в `main` сначала проходят 90-секундное окно допуска на размещенном runner.
Существующая группа конкурентности `CI` отменяет ожидающий запуск, когда поступает
более новый commit, поэтому последовательные merge не регистрируют каждый полную
матрицу Blacksmith. Pull request и ручные dispatch пропускают ожидание. Затем job
`preflight` классифицирует diff и отключает затратные lanes, когда изменились
только несвязанные области. Ручные запуски `workflow_dispatch` намеренно обходят
умное ограничение области и разворачивают полный граф для release candidate и
широкой проверки. Android lanes остаются opt-in через `include_android`. Покрытие
Plugin только для релизов находится в отдельном workflow [`Предрелиз Plugin`](#plugin-prerelease)
и запускается только из [`Полной проверки релиза`](#full-release-validation)
или явного ручного dispatch.

## Обзор pipeline

| Job                                | Назначение                                                                                                      | Когда запускается                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `preflight`                        | Обнаруживает изменения только в docs, измененные области, измененные extensions и собирает манифест CI          | Всегда для не-draft push и PR                          |
| `runner-admission`                 | Размещенный 90-секундный debounce для канонических push в `main` перед регистрацией работы Blacksmith           | Каждый запуск CI; sleep только для канонических push в `main` |
| `security-fast`                    | Обнаружение приватных ключей, audit измененных workflow через `zizmor` и audit production lockfile              | Всегда для не-draft push и PR                          |
| `check-dependencies`               | Production-проход Knip только по зависимостям плюс guard allowlist неиспользуемых файлов                        | Изменения, относящиеся к Node                          |
| `build-artifacts`                  | Сборка `dist/`, Control UI, smoke-проверки встроенного CLI, проверки встроенных артефактов и переиспользуемые artifacts | Изменения, относящиеся к Node                          |
| `checks-fast-core`                 | Быстрые Linux lanes корректности, такие как bundled, protocol, QA Smoke CI и проверки маршрутизации CI          | Изменения, относящиеся к Node                          |
| `checks-fast-contracts-plugins-*`  | Две шардированные проверки контрактов plugin                                                                    | Изменения, относящиеся к Node                          |
| `checks-fast-contracts-channels-*` | Две шардированные проверки контрактов channel                                                                   | Изменения, относящиеся к Node                          |
| `checks-node-core-*`               | Шарды тестов Core Node, исключая channel, bundled, contract и extension lanes                                   | Изменения, относящиеся к Node                          |
| `check-*`                          | Шардированный эквивалент основного локального gate: prod types, lint, guards, test types и strict smoke         | Изменения, относящиеся к Node                          |
| `check-additional-*`               | Architecture, шардированный boundary/prompt drift, guards для extension, package boundary и runtime topology    | Изменения, относящиеся к Node                          |
| `checks-node-compat-node22`        | Сборка совместимости Node 22 и smoke lane                                                                       | Ручной dispatch CI для релизов                         |
| `check-docs`                       | Форматирование docs, lint и проверки битых ссылок                                                               | Изменились docs                                        |
| `skills-python`                    | Ruff + pytest для Skills на базе Python                                                                         | Изменения, относящиеся к Python Skills                 |
| `checks-windows`                   | Специфичные для Windows тесты процессов/путей плюс общие regression для runtime import specifier                | Изменения, относящиеся к Windows                       |
| `macos-node`                       | macOS TypeScript test lane с использованием общих собранных artifacts                                          | Изменения, относящиеся к macOS                         |
| `macos-swift`                      | Swift lint, build и tests для приложения macOS                                                                  | Изменения, относящиеся к macOS                         |
| `ios-build`                        | Генерация Xcode project плюс сборка приложения iOS для simulator                                               | Изменения iOS app, shared app kit или Swabble          |
| `android`                          | Android unit tests для обоих flavors плюс одна сборка debug APK                                                | Изменения, относящиеся к Android                       |
| `test-performance-agent`           | Ежедневная оптимизация медленных тестов Codex после доверенной активности                                       | Успех main CI или ручной dispatch                      |
| `openclaw-performance`             | Ежедневные/по требованию отчеты Kova runtime performance с mock-provider, deep-profile и live lanes GPT 5.5     | Scheduled и ручной dispatch                            |

## Порядок fail-fast

1. `runner-admission` ожидает только канонические push в `main`; более новый push отменяет запуск до регистрации Blacksmith.
2. `preflight` решает, какие lanes вообще существуют. Логика `docs-scope` и `changed-scope` — это шаги внутри этой job, а не отдельные jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` и `skills-python` быстро падают, не ожидая более тяжелых jobs матрицы artifacts и platform.
4. `build-artifacts` пересекается с быстрыми Linux lanes, чтобы downstream consumers могли стартовать сразу после готовности общей сборки.
5. После этого разворачиваются более тяжелые platform и runtime lanes: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` и `android`.

GitHub может помечать замененные jobs как `cancelled`, когда более новый push поступает в тот же PR или ref `main`. Считайте это шумом CI, если самый новый запуск для того же ref не падает. Matrix jobs используют `fail-fast: false`, а `build-artifacts` сообщает о сбоях embedded channel, core-support-boundary и gateway-watch напрямую вместо постановки в очередь крошечных verifier jobs. Автоматический ключ конкурентности CI версионирован (`CI-v7-*`), чтобы GitHub-side zombie в старой группе очереди не мог бесконечно блокировать новые main runs. Ручные запуски full-suite используют `CI-manual-v1-*` и не отменяют выполняющиеся runs.

Используйте `pnpm ci:timings`, `pnpm ci:timings:recent` или `node scripts/ci-run-timings.mjs <run-id>`, чтобы суммировать wall time, queue time, самые медленные jobs, failures и барьер fanout `pnpm-store-warmup` из GitHub Actions. CI также загружает ту же сводку run как artifact `ci-timings-summary`. Для времени сборки проверьте шаг `Build dist` в job `build-artifacts`: `pnpm build:ci-artifacts` печатает `[build-all] phase timings:` и включает `ui:build`; job также загружает artifact `startup-memory`.

Для запусков pull request terminal job timing-summary запускает helper из доверенной базовой ревизии перед передачей `GH_TOKEN` в `gh run view`. Это удерживает tokened query вне кода, контролируемого branch, при этом все еще суммируя текущий CI run pull request.

## Контекст PR и доказательства

PR внешних contributors запускают gate контекста PR и доказательств из
`.github/workflows/real-behavior-proof.yml`. Workflow checkout доверенного
base commit и оценивает только тело PR; он не выполняет код из
branch contributor.

Gate применяется к авторам PR, которые не являются owners, members,
collaborators или bots репозитория. Он проходит, когда тело PR содержит авторские
разделы `What Problem This Solves` и `Evidence`. Доказательством может быть сфокусированный
test, результат CI, screenshot, recording, terminal output, live observation,
redacted log или artifact link. Тело предоставляет intent и полезную проверку;
reviewers проверяют код, tests и CI, чтобы оценить корректность.

Когда check падает, обновите тело PR вместо отправки еще одного code commit.

## Область и маршрутизация

Логика области находится в `scripts/ci-changed-scope.mjs` и покрыта unit tests в `src/scripts/ci-changed-scope.test.ts`. Ручной dispatch пропускает обнаружение changed-scope и заставляет preflight manifest вести себя так, будто изменилась каждая scoped area.

- **Правки CI workflow** проверяют граф Node CI плюс workflow linting, но сами по себе не форсируют native builds Windows, iOS, Android или macOS; эти platform lanes остаются ограниченными изменениями platform source.
- **Проверка корректности workflow** запускает `actionlint`, `zizmor` по всем YAML-файлам workflow, guard интерполяции composite-action и guard conflict-marker. PR-scoped job `security-fast` также запускает `zizmor` по измененным workflow files, чтобы workflow security findings падали рано в основном графе CI.
- **Docs при push в `main`** проверяются отдельным workflow `Docs` с тем же mirror docs ClawHub, который используется CI, поэтому смешанные push code+docs не ставят дополнительно в очередь шард CI `check-docs`. Pull request и ручной CI по-прежнему запускают `check-docs` из CI, когда изменились docs.
- **TUI PTY** запускается в Linux Node shard `checks-node-core-runtime-tui-pty` для изменений TUI. Shard запускает `test/vitest/vitest.tui-pty.config.ts` с `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, поэтому он покрывает как детерминированный fixture lane `TuiBackend`, так и более медленный smoke `tui --local`, который mock только внешний model endpoint.
- **Правки только маршрутизации CI, выбранные дешевые правки core-test fixtures и узкие правки helper/test-routing для plugin contract** используют быстрый путь манифеста только для Node: `preflight`, security и одну задачу `checks-fast-core`. Этот путь пропускает build artifacts, совместимость Node 22, channel contracts, полные core shards, bundled-plugin shards и дополнительные guard matrices, когда изменение ограничено routing или helper surfaces, которые fast task проверяет напрямую.
- **Проверки Windows Node** ограничены специфичными для Windows wrappers процессов/путей, helpers npm/pnpm/UI runner, config package manager и поверхностями CI workflow, которые выполняют этот lane; несвязанные изменения source, plugin, install-smoke и test-only остаются на Linux Node lanes.

Самые медленные семейства тестов Node разделены или сбалансированы так, чтобы каждое задание оставалось небольшим без избыточного резервирования раннеров: контракты Plugin и контракты каналов запускаются как два взвешенных шарда с поддержкой Blacksmith и стандартным откатом на раннер GitHub, быстрые/вспомогательные дорожки core unit запускаются отдельно, инфраструктура core runtime разделена между state, process/config, shared и тремя доменными шардами cron, auto-reply запускается как сбалансированные воркеры (с разделением поддерева reply на шарды agent-runner, dispatch и commands/state-routing), а конфигурации agentic gateway/server разделены по дорожкам chat/auth/model/http-plugin/runtime/startup вместо ожидания собранных артефактов. Затем обычный CI упаковывает только изолированные инфраструктурные шарды include-pattern в детерминированные пакеты максимум по 64 тестовых файла, уменьшая матрицу Node без объединения неизолированных наборов command/cron, stateful agents-core или gateway/server; тяжелые фиксированные наборы остаются на 8 vCPU, а пакетированные дорожки и дорожки с меньшим весом используют 4 vCPU. Pull request в каноническом репозитории используют дополнительный компактный план допуска: те же группы на конфигурацию запускаются в изолированных подпроцессах внутри текущего плана Linux Node из 34 заданий, поэтому один PR не регистрирует полную матрицу Node из более чем 70 заданий. Push в `main`, ручные dispatch и release gates сохраняют полную матрицу. Широкие браузерные, QA, медийные и прочие тесты Plugin используют свои выделенные конфигурации Vitest вместо общего catch-all для Plugin. Шарды include-pattern записывают временные записи с именем шарда CI, поэтому `.artifacts/vitest-shard-timings.json` может отличать целую конфигурацию от отфильтрованного шарда. `check-additional-*` держит вместе compile/canary-работу на границах пакетов и отделяет архитектуру топологии runtime от покрытия gateway watch; список boundary guard распределен в один шард с высокой нагрузкой на prompt и один объединенный шард для оставшихся полос guard, причем каждый параллельно запускает выбранные независимые guard и печатает времена по каждой проверке. Дорогая проверка дрейфа prompt snapshot для успешного пути Codex запускается как отдельное дополнительное задание только для ручного CI и изменений, влияющих на prompt, поэтому обычные несвязанные изменения Node не ждут холодной генерации prompt snapshot, а boundary-шарды остаются сбалансированными, при этом prompt drift все еще привязан к PR, который его вызвал; тот же флаг пропускает генерацию prompt snapshot Vitest внутри шарда core support-boundary для собранных артефактов. Gateway watch, тесты каналов и шард core support-boundary запускаются параллельно внутри `build-artifacts` после того, как `dist/` и `dist-runtime/` уже собраны.

После допуска канонический Linux CI разрешает до 24 параллельных заданий тестов Node и
12 для меньших дорожек fast/check; Windows и Android остаются на двух, потому что
эти пулы раннеров уже.

Компактный план PR создает 18 заданий Node для текущего набора: группы
whole-config пакетируются в изолированных подпроцессах с тайм-аутом пакета 120 минут,
а группы include-pattern используют тот же ограниченный бюджет заданий.

Android CI запускает и `testPlayDebugUnitTest`, и `testThirdPartyDebugUnitTest`, а затем собирает Play debug APK. У варианта third-party нет отдельного source set или manifest; его дорожка unit-test все равно компилирует flavor с флагами BuildConfig для SMS/call-log, избегая при этом дублирующего задания упаковки debug APK при каждом push, затрагивающем Android.

Шард `check-dependencies` запускает `pnpm deadcode:dependencies` (production-проход Knip только по зависимостям, закрепленный на последней версии Knip, с отключенным минимальным возрастом релиза pnpm для установки `dlx`) и `pnpm deadcode:unused-files`, который сравнивает production-находки Knip по неиспользуемым файлам с `scripts/deadcode-unused-files.allowlist.mjs`. Guard неиспользуемых файлов падает, когда PR добавляет новый непроверенный неиспользуемый файл или оставляет устаревшую запись allowlist, сохраняя при этом намеренные динамические поверхности Plugin, сгенерированные поверхности, build, live-test и package bridge, которые Knip не может разрешить статически.

## Пересылка активности ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — это мост на стороне целевого репозитория из активности репозитория OpenClaw в ClawSweeper. Он не делает checkout и не выполняет недоверенный код pull request. Workflow создает токен GitHub App из `CLAWSWEEPER_APP_PRIVATE_KEY`, затем отправляет компактные payload `repository_dispatch` в `openclaw/clawsweeper`.

Workflow имеет четыре дорожки:

- `clawsweeper_item` для точных запросов review issue и pull request;
- `clawsweeper_comment` для явных команд ClawSweeper в комментариях issue;
- `clawsweeper_commit_review` для запросов review на уровне commit при push в `main`;
- `github_activity` для общей активности GitHub, которую агент ClawSweeper может проверить.

Дорожка `github_activity` пересылает только нормализованные метаданные: тип события, действие, участника, репозиторий, номер элемента, URL, заголовок, состояние и короткие выдержки для комментариев или review, когда они есть. Она намеренно не пересылает полный body Webhook. Принимающий workflow в `openclaw/clawsweeper` — это `.github/workflows/github-activity.yml`, который публикует нормализованное событие в hook OpenClaw Gateway для агента ClawSweeper.

Общая активность — это наблюдение, а не доставка по умолчанию. Агент ClawSweeper получает цель Discord в своем prompt и должен публиковать в `#clawsweeper` только когда событие неожиданное, требует действия, рискованное или операционно полезное. Рутинные открытия, правки, шум ботов, дублирующий шум Webhook и обычный трафик review должны приводить к `NO_REPLY`.

Считайте заголовки GitHub, комментарии, bodies, текст review, имена веток и сообщения commit недоверенными данными на всем этом пути. Это входные данные для суммаризации и triage, а не инструкции для workflow или runtime агента.

## Ручные dispatch

Ручные dispatch CI запускают тот же граф заданий, что и обычный CI, но принудительно включают каждую не-Android scoped-дорожку: шарды Linux Node, шарды bundled-plugin, шарды контрактов Plugin и каналов, совместимость Node 22, `check-*`, `check-additional-*`, smoke-проверки собранных артефактов, проверки docs, Python skills, Windows, macOS, сборку iOS и Control UI i18n. Отдельные ручные dispatch CI запускают Android только с `include_android=true`; общий full release umbrella включает Android, передавая `include_android=true`. Статические проверки prerelease для Plugin, release-only шард `agentic-plugins`, полный пакетный sweep extension и Docker-дорожки prerelease для Plugin исключены из CI. Набор Docker prerelease запускается только когда `Full Release Validation` отправляет отдельный workflow `Plugin Prerelease` с включенным gate release-validation.

Ручные запуски используют уникальную группу concurrency, поэтому полный набор release-candidate не отменяется другим push или запуском PR на той же ссылке. Необязательный input `target_ref` позволяет доверенному вызывающему запустить этот граф на ветке, теге или полном SHA commit, используя файл workflow из выбранной dispatch-ссылки.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Раннеры

| Раннер                          | Задания                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Ручной dispatch CI и откаты для неканонического репозитория, сканы качества CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs вне CI и preflight install-smoke, чтобы матрица Blacksmith могла вставать в очередь раньше                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, более легкие шарды extension, `checks-fast-core` кроме QA Smoke CI, шарды контрактов Plugin/channel, большинство пакетированных/более легких шардов Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, выбранные шарды `check-additional-*` и `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Сохраненные тяжелые наборы Linux Node, тяжелые по boundary/extension шарды `check-additional-*` и `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` в CI и Testbox, `check-lint` (достаточно чувствителен к CPU, чтобы 8 vCPU стоили больше, чем экономили); Docker-сборки install-smoke (время очереди 32-vCPU стоило больше, чем экономило)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; форки откатываются на `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` и `ios-build` на `openclaw/openclaw`; форки откатываются на `macos-26`                                                                                                                                                                                                                     |

## Бюджет регистрации раннеров

Текущий bucket регистрации раннеров GitHub для OpenClaw сообщает о 10 000 регистраций self-hosted
раннеров за 5 минут в `ghx api rate_limit`. Повторно проверяйте
`actions_runner_registration` перед каждым проходом настройки, потому что GitHub может изменить
этот bucket. Лимит общий для всех регистраций раннеров Blacksmith в
организации `openclaw`, поэтому добавление еще одной установки Blacksmith не добавляет
новый bucket.

Считайте labels Blacksmith дефицитным ресурсом для контроля burst. Задания, которые
только маршрутизируют, уведомляют, суммируют, выбирают шарды или запускают короткие сканы CodeQL, должны
оставаться на раннерах, размещенных GitHub, если у них нет измеренных специфичных для Blacksmith
потребностей. Любая новая матрица Blacksmith, больший `max-parallel` или высокочастотный
workflow должны показывать свой worst-case счетчик регистраций и держать целевой уровень организации
ниже примерно 60% live bucket. При текущем bucket в 10 000 регистраций
это означает рабочую цель в 6 000 регистраций, оставляя запас для
параллельных репозиториев, повторов и наложения burst.

CI канонического репозитория сохраняет Blacksmith как путь раннера по умолчанию для обычных запусков push и pull-request. `workflow_dispatch` и запуски неканонического репозитория используют раннеры, размещенные GitHub, но обычные канонические запуски сейчас не проверяют состояние очереди Blacksmith и не откатываются автоматически на labels, размещенные GitHub, когда Blacksmith недоступен.

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

`OpenClaw Performance` — это рабочий процесс производительности продукта/среды выполнения. Он ежедневно запускается на `main`, а также может быть запущен вручную:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручной запуск обычно выполняет бенчмарк для ref рабочего процесса. Укажите `target_ref`, чтобы выполнить бенчмарк для тега релиза или другой ветки с текущей реализацией рабочего процесса. Пути опубликованных отчетов и указатели на последние версии ключуются по тестируемому ref, а каждый `index.md` записывает тестируемые ref/SHA, ref/SHA рабочего процесса, ref Kova, профиль, режим авторизации lane, модель, число повторов и фильтры сценариев.

Рабочий процесс устанавливает OCM из закрепленного релиза и Kova из `openclaw/Kova` по закрепленному входному параметру `kova_ref`, затем запускает три lane:

- `mock-provider`: диагностические сценарии Kova против локально собранной среды выполнения с детерминированной фиктивной OpenAI-совместимой аутентификацией.
- `mock-deep-profile`: профилирование CPU/heap/trace для горячих точек запуска, gateway и хода агента.
- `live-openai-candidate`: реальный ход агента OpenAI `openai/gpt-5.5`, пропускается, когда `OPENAI_API_KEY` недоступен.

Lane mock-provider также запускает нативные исходные пробы OpenClaw после прохода Kova: время запуска gateway и память для случаев запуска по умолчанию, с hook и с 50 плагинами; RSS импорта встроенных плагинов, повторяющиеся mock-OpenAI циклы приветствия `channel-chat-baseline`, команды запуска CLI против загруженного gateway и smoke-пробу производительности состояния SQLite. Когда для тестируемого ref доступен предыдущий опубликованный исходный отчет mock-provider, исходная сводка сравнивает текущие значения RSS и heap с этим baseline и помечает большие увеличения RSS как `watch`. Markdown-сводка исходной пробы находится в `source/index.md` в наборе отчета, рядом с ней находится необработанный JSON.

Каждый lane загружает артефакты GitHub. Когда настроен `CLAWGRIT_REPORTS_TOKEN`, рабочий процесс также коммитит `report.json`, `report.md`, наборы, `index.md` и артефакты исходных проб в `openclaw/clawgrit-reports` в `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Текущий указатель tested-ref записывается как `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Полная валидация релиза

`Full Release Validation` — это ручной зонтичный рабочий процесс для «запустить все перед релизом». Он принимает ветку, тег или полный SHA коммита, запускает ручной рабочий процесс `CI` с этой целью, запускает `Plugin Prerelease` для релизных доказательств плагинов/пакетов/статики/Docker и запускает `OpenClaw Release Checks` для install smoke, acceptance пакетов, кросс-ОС проверок пакетов, рендеринга maturity scorecard по evidence профиля QA, паритета QA Lab, Matrix и lane Telegram. Профили stable и full всегда включают исчерпывающее live/E2E и Docker soak-покрытие релизного пути; beta-профиль может подключить его через `run_release_soak=true`. Канонический пакетный Telegram E2E запускается внутри Package Acceptance, поэтому полный кандидат не запускает дублирующий live poller. После публикации передайте `release_package_spec`, чтобы повторно использовать выпущенный npm-пакет во всех release checks, Package Acceptance, Docker, cross-OS и Telegram без пересборки. Используйте `npm_telegram_package_spec` только для сфокусированного повторного запуска Telegram на опубликованном пакете. Live package lane плагина Codex по умолчанию использует то же выбранное состояние: опубликованный `release_package_spec=openclaw@<tag>` выводит `codex_plugin_spec=npm:@openclaw/codex@<tag>`, а запуски по SHA/артефакту упаковывают `extensions/codex` из выбранного ref. Явно задайте `codex_plugin_spec` для пользовательских источников плагина, таких как спецификации `npm:`, `npm-pack:` или `git:`.

См. [полную валидацию релиза](/ru/reference/full-release-validation) для
матрицы стадий, точных имен заданий рабочего процесса, различий профилей,
артефактов и идентификаторов сфокусированных повторных запусков.

`OpenClaw Release Publish` — это ручной изменяющий рабочий процесс релиза.
Запускайте его из `release/YYYY.M.PATCH` или `main` после существования тега
релиза и после успешного OpenClaw npm preflight. Он проверяет
`pnpm plugins:sync:check`, запускает `Plugin NPM Release` для всех публикуемых
пакетов плагинов, запускает `Plugin ClawHub Release` для того же SHA релиза и
только затем запускает `OpenClaw NPM Release` с сохраненным `preflight_run_id`.
Stable-публикация также требует точный `windows_node_tag`; рабочий процесс
проверяет исходный Windows-релиз и сравнивает его установщики x64/ARM64 с
одобренным кандидатом входным параметром `windows_node_installer_digests`
перед любым дочерним publish, затем продвигает и проверяет те же закрепленные
digest установщиков плюс точный сопутствующий asset и контракт checksum перед
публикацией черновика GitHub-релиза.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для доказательства закрепленного коммита в быстро меняющейся ветке используйте
helper вместо `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Dispatch refs рабочих процессов GitHub должны быть ветками или тегами, а не сырыми SHA коммитов. Helper отправляет временную ветку `release-ci/<sha>-...` на целевой SHA, запускает `Full Release Validation` из этого закрепленного ref, проверяет, что каждый дочерний workflow `headSha` совпадает с целью, и удаляет временную ветку после завершения run. Зонтичный verifier также завершается с ошибкой, если какой-либо дочерний рабочий процесс запускался на другом SHA.

`release_profile` управляет шириной live/provider, передаваемой в release checks. Ручные рабочие процессы релиза по умолчанию используют `stable`; используйте `full` только когда намеренно нужна широкая advisory-матрица provider/media. Stable и full release checks всегда запускают исчерпывающее live/E2E и Docker soak релизного пути; beta-профиль может подключить это через `run_release_soak=true`.

- `minimum` сохраняет самые быстрые критичные для релиза OpenAI/core lane.
- `stable` добавляет стабильный набор provider/backend.
- `full` запускает широкую advisory-матрицу provider/media.

Зонтичный рабочий процесс записывает id запущенных дочерних run, а финальное задание `Verify full validation` повторно проверяет текущие conclusions дочерних run и добавляет таблицы самых медленных заданий для каждого дочернего run. Если дочерний рабочий процесс перезапущен и стал зеленым, перезапустите только parent verifier job, чтобы обновить результат зонтичного рабочего процесса и сводку timings.

Для восстановления `Full Release Validation` и `OpenClaw Release Checks` принимают `rerun_group`. Используйте `all` для release candidate, `ci` только для обычного дочернего full CI, `plugin-prerelease` только для дочернего plugin prerelease, `release-checks` для каждого дочернего release или более узкую группу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` или `npm-telegram` на зонтичном рабочем процессе. Это удерживает повторный запуск failed release box ограниченным после сфокусированного исправления. Для одного failed cross-OS lane сочетайте `rerun_group=cross-os` с `cross_os_suite_filter`, например `windows/packaged-upgrade`; длинные cross-OS команды выводят Heartbeat-строки, а сводки packaged-upgrade включают timings по фазам. QA release-check lane являются advisory, кроме стандартного gate покрытия runtime tool, который блокирует, когда обязательные динамические инструменты OpenClaw расходятся с summary стандартного tier или исчезают из него.

`OpenClaw Release Checks` использует доверенный ref рабочего процесса, чтобы один раз разрешить выбранный ref в tarball `release-package-under-test`, затем передает этот artifact в cross-OS checks и Package Acceptance, а также в live/E2E релизный Docker workflow, когда запускается soak-покрытие. Это сохраняет байты пакета согласованными между release boxes и избегает переупаковки одного и того же candidate в нескольких дочерних заданиях. Для live lane npm-плагина Codex release checks либо передают соответствующую опубликованную спецификацию плагина, выведенную из `release_package_spec`, либо передают предоставленный оператором `codex_plugin_spec`, либо оставляют вход пустым, чтобы Docker-скрипт упаковал Codex-плагин выбранного checkout.

Дублирующие runs `Full Release Validation` для `ref=main` и `rerun_group=all`
заменяют более старый зонтичный run. Родительский монитор отменяет любой
дочерний рабочий процесс, который он уже запустил, когда родитель отменен,
поэтому новая main validation не стоит в очереди за устаревшим двухчасовым
release-check run. Валидация release branch/tag и сфокусированные группы
повторных запусков сохраняют `cancel-in-progress: false`.

## Live- и E2E-шарды

Дочерний release live/E2E сохраняет широкое нативное покрытие `pnpm test:live`, но запускает его как именованные шарды через `scripts/test-live-shard.mjs` вместо одного последовательного задания:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered задания `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- разделенные media audio/video шарды и provider-filtered music шарды

Это сохраняет то же покрытие файлов, одновременно упрощая повторный запуск и диагностику медленных live-сбоев provider. Имена aggregate-шардов `native-live-extensions-o-z`, `native-live-extensions-media` и `native-live-extensions-media-music` остаются действительными для ручных одноразовых повторных запусков.

Нативные live media-шарды запускаются в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, собранном рабочим процессом `Live Media Runner Image`. Этот image предустанавливает `ffmpeg` и `ffprobe`; media jobs только проверяют binaries перед setup. Держите Docker-backed live suites на обычных Blacksmith runners — container jobs не подходят для запуска вложенных Docker-тестов.

Живые шарды модели/бэкенда на базе Docker используют отдельный общий образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для каждого выбранного коммита. Рабочий процесс живого релиза собирает и отправляет этот образ один раз, после чего живые шарды Docker для модели, разделенного по провайдерам Gateway, CLI-бэкенда, привязки ACP и Codex harness запускаются с `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарды Gateway имеют явные ограничения `timeout` на уровне скриптов ниже тайм-аута задания рабочего процесса, чтобы зависший контейнер или путь очистки быстро завершались ошибкой, а не расходовали весь бюджет release-check. Если эти шарды самостоятельно пересобирают полный исходный Docker target, релизный запуск настроен неверно и будет тратить реальное время на дублирующиеся сборки образов.

## Приемка пакета

Используйте `Package Acceptance`, когда вопрос звучит так: «работает ли этот устанавливаемый пакет OpenClaw как продукт?» Это отличается от обычного CI: обычный CI проверяет дерево исходников, а приемка пакета проверяет один tarball через тот же Docker E2E harness, который используют пользователи после установки или обновления.

### Задания

1. `resolve_package` извлекает `workflow_ref`, выбирает одного кандидата пакета, записывает `.artifacts/docker-e2e-package/openclaw-current.tgz`, записывает `.artifacts/docker-e2e-package/package-candidate.json`, загружает оба файла как артефакт `package-under-test` и выводит источник, workflow ref, package ref, версию, SHA-256 и профиль в сводке шага GitHub.
2. `docker_acceptance` вызывает `openclaw-live-and-e2e-checks-reusable.yml` с `ref=workflow_ref` и `package_artifact_name=package-under-test`. Переиспользуемый рабочий процесс скачивает этот артефакт, проверяет инвентарь tarball, при необходимости подготавливает Docker-образы с digest пакета и запускает выбранные Docker lanes против этого пакета вместо упаковки checkout рабочего процесса. Когда профиль выбирает несколько целевых `docker_lanes`, переиспользуемый рабочий процесс подготавливает пакет и общие образы один раз, затем распределяет эти lanes как параллельные целевые Docker-задания с уникальными артефактами.
3. `package_telegram` опционально вызывает `NPM Telegram Beta E2E`. Он запускается, когда `telegram_mode` не равен `none`, и устанавливает тот же артефакт `package-under-test`, если приемка пакета выбрала его; автономный dispatch Telegram все еще может установить опубликованную npm-спецификацию.
4. `summary` завершает рабочий процесс с ошибкой, если разрешение пакета, Docker-приемка или опциональный Telegram lane завершились ошибкой.

### Источники кандидатов

- `source=npm` принимает только `openclaw@beta`, `openclaw@latest` или точную версию релиза OpenClaw, например `openclaw@2026.4.27-beta.2`. Используйте это для приемки опубликованных prerelease/stable версий.
- `source=ref` упаковывает доверенную ветку, тег или полный SHA коммита `package_ref`. Resolver извлекает ветки/теги OpenClaw, проверяет, что выбранный коммит достижим из истории ветки репозитория или тега релиза, устанавливает зависимости в отсоединенном worktree и упаковывает его с помощью `scripts/package-openclaw-for-docker.mjs`.
- `source=url` скачивает публичный HTTPS `.tgz`; `package_sha256` обязателен. Этот путь отклоняет учетные данные в URL, нестандартные HTTPS-порты, частные/внутренние/специальные hostnames или разрешенные IP-адреса, а также перенаправления за пределы той же публичной политики безопасности.
- `source=trusted-url` скачивает HTTPS `.tgz` из именованной политики доверенного источника в `.github/package-trusted-sources.json`; `package_sha256` и `trusted_source_id` обязательны. Используйте это только для enterprise-зеркал или частных репозиториев пакетов, принадлежащих мейнтейнерам, которым нужны настроенные hosts, порты, префиксы путей, redirect hosts или разрешение private-network. Если политика объявляет bearer auth, рабочий процесс использует фиксированный секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; учетные данные, встроенные в URL, все равно отклоняются.
- `source=artifact` скачивает один `.tgz` из `artifact_run_id` и `artifact_name`; `package_sha256` необязателен, но его следует указывать для внешне распространяемых артефактов.

Держите `workflow_ref` и `package_ref` раздельно. `workflow_ref` — это доверенный код рабочего процесса/harness, который запускает тест. `package_ref` — это исходный коммит, который упаковывается при `source=ref`. Это позволяет текущему тестовому harness проверять более старые доверенные исходные коммиты без запуска старой логики рабочего процесса.

### Профили набора

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — полные Docker-фрагменты release-path с OpenWebUI
- `custom` — точные `docker_lanes`; требуется, когда `suite_profile=custom`

Профиль `package` использует offline-покрытие plugins, чтобы проверка опубликованного пакета не зависела от доступности живого ClawHub. Опциональный Telegram lane переиспользует артефакт `package-under-test` в `NPM Telegram Beta E2E`, при этом путь опубликованной npm-спецификации сохраняется для автономных dispatch.

См. [Тестирование обновлений и plugins](/ru/help/testing-updates-plugins) для отдельной политики тестирования обновлений и plugins, включая локальные команды, Docker lanes, входные данные приемки пакета, релизные значения по умолчанию и триаж отказов.

Релизные проверки вызывают приемку пакета с `source=artifact`, подготовленным артефактом релизного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` и `telegram_mode=mock-openai`. Это удерживает миграцию пакета, обновление, установку live ClawHub skill, очистку устаревшей зависимости plugin, восстановление установки настроенного plugin, offline plugin, plugin-update и Telegram-доказательство на одном и том же разрешенном package tarball. Задайте `release_package_spec` в Full Release Validation или OpenClaw Release Checks после публикации beta, чтобы запустить ту же матрицу против отгруженного npm-пакета без пересборки; задавайте `package_acceptance_package_spec` только когда приемке пакета нужен пакет, отличный от остальной релизной проверки. Кросс-OS релизные проверки все еще покрывают OS-специфическое onboarding, установщик и поведение платформы; продуктовую проверку пакета/обновления следует начинать с приемки пакета. Docker lane `published-upgrade-survivor` проверяет один опубликованный базовый пакет за запуск в блокирующем release path. В приемке пакета разрешенный tarball `package-under-test` всегда является кандидатом, а `published_upgrade_survivor_baseline` выбирает fallback-опубликованную базовую версию, по умолчанию `openclaw@latest`; команды повторного запуска отказавшего lane сохраняют эту базовую версию. Full Release Validation с `run_release_soak=true` или `release_profile=full` задает `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` и `published_upgrade_survivor_scenarios=reported-issues`, чтобы расширить покрытие на четыре последние stable npm-релиза плюс закрепленные релизы границы plugin-совместимости и issue-образные fixtures для конфигурации Feishu, сохраненных bootstrap/persona-файлов, настроенных установок OpenClaw plugin, путей логов с тильдой и устаревших корней зависимостей legacy plugin. Выборки multi-baseline published-upgrade survivor шардингом разделяются по baseline на отдельные целевые задания Docker runner. Отдельный рабочий процесс `Update Migration` использует Docker lane `update-migration` с `all-since-2026.4.23` и `plugin-deps-cleanup`, когда нужен исчерпывающий cleanup опубликованных обновлений, а не обычная широта Full Release CI. Локальные агрегированные запуски могут передавать точные package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, оставлять один lane через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, например `openclaw@2026.4.15`, или задавать `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матрицы сценариев. Опубликованный lane настраивает baseline с запеченным рецептом команды `openclaw config set`, записывает шаги рецепта в `summary.json` и проверяет `/healthz`, `/readyz`, а также статус RPC после запуска Gateway. Свежие Windows lanes для packaged и installer также проверяют, что установленный пакет может импортировать browser-control override из необработанного абсолютного Windows-пути. OpenAI cross-OS agent-turn smoke по умолчанию использует `OPENCLAW_CROSS_OS_OPENAI_MODEL`, если он задан, иначе `openai/gpt-5.5`, чтобы доказательство установки и gateway оставалось на тестовой модели GPT-5 и избегало значений по умолчанию GPT-4.x.

### Окна legacy-совместимости

Приемка пакета имеет ограниченные окна legacy-совместимости для уже опубликованных пакетов. Пакеты до `2026.4.25` включительно, включая `2026.4.25-beta.*`, могут использовать путь совместимости:

- известные частные QA-записи в `dist/postinstall-inventory.json` могут указывать на файлы, не включенные в tarball;
- `doctor-switch` может пропускать subcase сохранения `gateway install --wrapper`, когда пакет не предоставляет этот флаг;
- `update-channel-switch` может удалять отсутствующие pnpm `patchedDependencies` из fake git fixture, созданной из tarball, и может логировать отсутствующий сохраненный `update.channel`;
- plugin smokes могут читать legacy-местоположения install-record или принимать отсутствие сохранения marketplace install-record;
- `plugin-update` может разрешать миграцию метаданных конфигурации, при этом по-прежнему требуя, чтобы install record и поведение без переустановки оставались неизменными.

Опубликованный пакет `2026.4.26` также может предупреждать о файлах штампов метаданных локальной сборки, которые уже были отгружены. Более поздние пакеты должны соответствовать современным контрактам; те же условия приводят к ошибке, а не к предупреждению или пропуску.

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

При отладке неудачного запуска приемки пакета начните со сводки `resolve_package`, чтобы подтвердить источник пакета, версию и SHA-256. Затем проверьте дочерний запуск `docker_acceptance` и его Docker-артефакты: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lanes, тайминги фаз и команды повторного запуска. Предпочитайте повторный запуск отказавшего профиля пакета или точных Docker lanes вместо повторного запуска полной релизной проверки.

## Проверка установки

Отдельный рабочий процесс `Install Smoke` переиспользует тот же scope-скрипт через собственное задание `preflight`. Он разделяет smoke-покрытие на `run_fast_install_smoke` и `run_full_install_smoke`.

- **Быстрый путь** запускается для pull request, которые затрагивают поверхности Docker/пакетов, изменения пакетов/манифестов встроенных Plugin, либо поверхности ядра Plugin/каналов/gateway/Plugin SDK, которые проверяются заданиями Docker smoke. Изменения встроенных Plugin только в исходном коде, правки только тестов и правки только документации не резервируют Docker-воркеры. Быстрый путь один раз собирает образ корневого Dockerfile, проверяет CLI, запускает CLI smoke для удаления agents shared-workspace, запускает container gateway-network e2e, проверяет аргумент сборки встроенного расширения и запускает ограниченный Docker-профиль встроенного Plugin с совокупным таймаутом команды 240 секунд (Docker-запуск каждого сценария ограничен отдельно).
- **Полный путь** сохраняет установку QR-пакета и Docker/update-покрытие установщика для ночных запланированных запусков, ручных dispatch-запусков, release checks через workflow-call и pull request, которые действительно затрагивают поверхности установщика/пакета/Docker. В полном режиме install-smoke подготавливает или повторно использует один smoke-образ GHCR корневого Dockerfile для целевого SHA, затем запускает установку QR-пакета, smoke-проверки корневого Dockerfile/gateway, smoke-проверки установщика/update и быстрый Docker E2E для встроенного Plugin как отдельные задания, чтобы работа установщика не ожидала за smoke-проверками корневого образа.

Пуши в `main` (включая merge-коммиты) не принуждают к полному пути; когда логика changed-scope запросила бы полное покрытие при пуше, workflow сохраняет быстрый Docker smoke и оставляет полный install smoke для ночной или релизной валидации.

Медленный Bun global install image-provider smoke отдельно ограничен через `run_bun_global_install_smoke`. Он запускается по ночному расписанию и из workflow release checks, а ручные dispatch-запуски `Install Smoke` могут включить его явно, но pull request и пуши в `main` не запускают его. Обычный PR CI по-прежнему запускает быстрый регрессионный путь Bun launcher для изменений, связанных с Node. Docker-тесты QR и установщика сохраняют собственные Dockerfile, сфокусированные на установке.

## Локальный Docker E2E

`pnpm test:docker:all` предварительно собирает один общий live-test образ, один раз упаковывает OpenClaw как npm tarball и собирает два общих образа `scripts/e2e/Dockerfile`:

- минимальный раннер Node/Git для путей установщика/update/plugin-dependency;
- функциональный образ, который устанавливает тот же tarball в `/app` для обычных функциональных путей.

Определения Docker-путей находятся в `scripts/lib/docker-e2e-scenarios.mjs`, логика планировщика находится в `scripts/lib/docker-e2e-plan.mjs`, а раннер выполняет только выбранный план. Планировщик выбирает образ для каждого пути через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` и `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, затем запускает пути с `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Настраиваемые параметры

| Переменная                             | По умолчанию | Назначение                                                                                         |
| -------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10           | Количество слотов основного пула для обычных путей.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Количество слотов хвостового пула для путей, чувствительных к провайдерам.                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9            | Лимит одновременных live-путей, чтобы провайдеры не начали throttling.                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5            | Лимит одновременных путей установки npm.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7            | Лимит одновременных много-сервисных путей.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Задержка между стартами путей, чтобы избежать всплесков создания в Docker daemon; задайте `0`, чтобы отключить задержку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000      | Резервный таймаут на путь (120 минут); выбранные live/tail пути используют более строгие ограничения. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано    | `1` печатает план планировщика без запуска путей.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано    | Список точных путей через запятую; пропускает cleanup smoke, чтобы agents могли воспроизвести один сбойный путь. |

Путь, который тяжелее своего эффективного лимита, всё равно может стартовать из пустого пула, затем выполняется в одиночку, пока не освободит емкость. Локальный совокупный запуск предварительно проверяет Docker, удаляет устаревшие контейнеры OpenClaw E2E, выводит статус активных путей, сохраняет длительности путей для сортировки от самых долгих и по умолчанию прекращает планировать новые pooled-пути после первого сбоя.

### Переиспользуемый workflow live/E2E

Переиспользуемый workflow live/E2E спрашивает у `scripts/test-docker-all.mjs --plan-json`, какое покрытие пакета, типа образа, live-образа, пути и учетных данных требуется. Затем `scripts/docker-e2e.mjs` преобразует этот план в outputs и summaries GitHub. Он либо упаковывает OpenClaw через `scripts/package-openclaw-for-docker.mjs`, скачивает артефакт пакета текущего запуска, либо скачивает артефакт пакета из `package_artifact_run_id`; проверяет inventory tarball; собирает и публикует bare/functional Docker E2E образы GHCR с тегами по digest пакета через Docker layer cache Blacksmith, когда плану нужны пути с установленным пакетом; и повторно использует переданные inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` или существующие package-digest образы вместо пересборки. Pull Docker-образов повторяется с ограниченным 180-секундным таймаутом на попытку, чтобы зависший поток registry/cache быстро повторялся вместо того, чтобы занимать большую часть критического пути CI.

### Чанки релизного пути

Релизное Docker-покрытие запускает меньшие chunked-задания с `OPENCLAW_SKIP_DOCKER_BUILD=1`, чтобы каждый chunk подтягивал только нужный ему тип образа и выполнял несколько путей через тот же взвешенный планировщик:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Текущие релизные Docker-чанки: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` и `plugins-runtime-install-a` через `plugins-runtime-install-h`. `package-update-openai` включает live-путь пакета Plugin Codex, который устанавливает кандидатный пакет OpenClaw, устанавливает Plugin Codex из `codex_plugin_spec` или tarball с той же ref при явном одобрении установки Codex CLI, запускает preflight Codex CLI, затем запускает несколько OpenClaw agent turns в той же сессии против OpenAI. `plugins-runtime-core`, `plugins-runtime` и `plugins-integrations` остаются агрегированными алиасами Plugin/runtime. Алиас пути `install-e2e` остается агрегированным ручным алиасом повторного запуска для обоих provider installer путей.

OpenWebUI включается в `plugins-runtime-services`, когда это запрашивает полное release-path покрытие, и сохраняет отдельный chunk `openwebui` только для dispatch-запусков только OpenWebUI. Пути обновления bundled-channel повторяются один раз при временных сетевых сбоях npm.

Каждый chunk загружает `.artifacts/docker-tests/` с логами путей, длительностями, `summary.json`, `failures.json`, длительностями фаз, JSON плана планировщика, таблицами медленных путей и командами повторного запуска по каждому пути. Input workflow `docker_lanes` запускает выбранные пути на подготовленных образах вместо chunk-заданий, что удерживает отладку сбойного пути в рамках одного целевого Docker-задания и подготавливает, скачивает или повторно использует артефакт пакета для этого запуска; если выбранный путь является live Docker-путем, целевое задание локально собирает live-test образ для этого повторного запуска. Сгенерированные команды GitHub для повторного запуска по каждому пути включают `package_artifact_run_id`, `package_artifact_name` и inputs подготовленных образов, когда эти значения существуют, чтобы сбойный путь мог повторно использовать точный пакет и образы из сбойного запуска.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланированный workflow live/E2E ежедневно запускает полный release-path Docker suite.

## Предварительный выпуск Plugin

`Plugin Prerelease` — более дорогое покрытие продукта/пакетов, поэтому это отдельный workflow, запускаемый через `Full Release Validation` или явным оператором. Обычные pull request, пуши в `main` и самостоятельные ручные dispatch-запуски CI держат этот suite выключенным. Он распределяет тесты встроенных Plugin по восьми extension-воркерам; эти задания shard-расширений запускают до двух групп конфигурации Plugin одновременно с одним Vitest worker на группу и увеличенной heap Node, чтобы import-heavy батчи Plugin не создавали дополнительные задания CI. Релизный Docker prerelease путь группирует целевые Docker-пути в небольшие группы, чтобы не резервировать десятки раннеров под задания на одну-три минуты. Workflow также загружает информационный артефакт `plugin-inspector-advisory` из `@openclaw/plugin-inspector`; находки inspector являются входными данными для triage и не меняют блокирующий gate Plugin Prerelease.

## QA Lab

QA Lab имеет выделенные CI-пути вне основного smart-scoped workflow. Agentic parity вложен в широкие QA- и релизные harness, а не является самостоятельным PR workflow. Используйте `Full Release Validation` с `rerun_group=qa-parity`, когда parity должен идти вместе с широким валидационным запуском.

- Workflow `QA-Lab - All Lanes` запускается каждую ночь на `main` и при ручном dispatch; он разворачивает mock parity путь, live Matrix путь, а также live Telegram и Discord пути как параллельные задания. Live-задания используют окружение `qa-live-shared`, а Telegram/Discord используют Convex leases.

Release checks запускают live transport пути Matrix и Telegram с детерминированным mock-провайдером и моделями, квалифицированными как mock (`mock-openai/gpt-5.5` и `mock-openai/gpt-5.5-alt`), чтобы контракт канала был изолирован от задержки live-модели и обычного startup provider-plugin. Live transport gateway отключает memory search, потому что QA parity отдельно покрывает поведение памяти; connectivity провайдера покрывается отдельными suites live model, native provider и Docker provider.

Matrix использует `--profile fast` для запланированных и релизных gates, добавляя `--fail-fast` только когда checked-out CLI поддерживает это. Значение CLI по умолчанию и input ручного workflow остаются `all`; ручной dispatch `matrix_profile=all` всегда shard-ит полное Matrix-покрытие на задания `transport`, `media`, `e2ee-smoke`, `e2ee-deep` и `e2ee-cli`.

`OpenClaw Release Checks` также запускает критичные для релиза QA Lab пути перед одобрением релиза; его gate QA parity запускает candidate и baseline packs как параллельные задания путей, затем скачивает оба артефакта в небольшое report-задание для финального сравнения parity.

Для обычных PR следуйте scoped CI/check evidence вместо того, чтобы считать parity обязательным статусом.

## CodeQL

Workflow `CodeQL` намеренно является узким first-pass security scanner, а не полным sweep репозитория. Ежедневные, ручные и guard-запуски недрафтовых pull request сканируют код Actions workflow плюс наиболее рискованные поверхности JavaScript/TypeScript с high-confidence security queries, отфильтрованными по high/critical `security-severity`.

Guard pull request остается легким: он стартует только для изменений в `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` или process-owning runtime-путях встроенных Plugin, и запускает ту же high-confidence security matrix, что и запланированный workflow. Android и macOS CodeQL не входят в PR defaults.

### Категории безопасности

| Категория                                         | Поверхность                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, секреты, песочница, cron и базовая линия gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Контракты реализации базовых каналов, а также среда выполнения Plugin каналов, gateway, Plugin SDK, секреты и точки аудита           |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхности политик SSRF в ядре, разбора IP, сетевой защиты, web-fetch и Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-серверы, помощники выполнения процессов, исходящая доставка и шлюзы выполнения инструментов агентом                               |
| `/codeql-security-high/process-exec-boundary`     | Локальная оболочка, помощники запуска процессов, среды выполнения комплектных Plugin, владеющие подпроцессами, и связка workflow-скриптов |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхности доверия установки Plugin, загрузчика, манифеста, реестра, установки через менеджер пакетов, загрузки исходников и пакетного контракта Plugin SDK |

### Платформенно-специфичные security-шарды

- `CodeQL Android Critical Security` — запланированный Android security-шард. Собирает Android-приложение вручную для CodeQL на минимальном Linux-раннере Blacksmith, который проходит sanity-проверку workflow. Загружает данные в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — еженедельный/ручной macOS security-шард. Собирает macOS-приложение вручную для CodeQL на Blacksmith macOS, отфильтровывает результаты сборки зависимостей из загружаемого SARIF и загружает данные в `/codeql-critical-security/macos`. Держится вне ежедневных значений по умолчанию, потому что сборка macOS доминирует во времени выполнения даже при чистом проходе.

### Категории Critical Quality

`CodeQL Critical Quality` — соответствующий не-security-шард. Он запускает только JavaScript/TypeScript-запросы качества с severity error и без security по узким высокоценным поверхностям на Linux-раннерах GitHub-hosted, чтобы сканирования качества не расходовали бюджет регистрации раннеров Blacksmith. Его защита pull request намеренно меньше, чем запланированный профиль: для не-draft PR запускаются только соответствующие шарды `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` и `plugin-sdk-reply-runtime` при изменениях кода выполнения команд/моделей/инструментов агентом и диспетчеризации ответов, схемы config/миграции/IO, auth/секретов/песочницы/security, среды выполнения базовых каналов и комплектных Plugin каналов, протокола gateway/server-method, связки memory runtime/SDK, MCP/process/исходящей доставки, среды выполнения provider/каталога моделей, диагностики session/очередей доставки, загрузчика Plugin, Plugin SDK/package-contract или среды выполнения ответов Plugin SDK. Изменения конфигурации CodeQL и quality workflow запускают все двенадцать PR-шардов качества.

Ручной dispatch принимает:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Узкие профили — это хуки для обучения/итераций, позволяющие запускать один quality-шард изолированно.

| Категория                                              | Поверхность                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код security-границы Auth, секретов, песочницы, cron и gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Схема config, миграция, нормализация и IO-контракты                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схемы протокола Gateway и контракты методов сервера                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракты реализации базовых каналов и комплектных Plugin каналов                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Выполнение команд, диспетчеризация model/provider, диспетчеризация auto-reply и очереди, а также контракты runtime плоскости управления ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-серверы и мосты инструментов, помощники надзора за процессами и контракты исходящей доставки                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасады memory runtime, псевдонимы memory Plugin SDK, связка активации memory runtime и команды memory doctor                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутренности очереди ответов, очереди доставки session, помощники привязки/доставки исходящих session, поверхности диагностических событий/пакетов логов и CLI-контракты session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризация входящих ответов Plugin SDK, payload ответов/chunking/runtime-помощники, параметры ответов канала, очереди доставки и помощники привязки session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормализация каталога моделей, auth и discovery provider, регистрация provider runtime, значения по умолчанию/каталоги provider и реестры web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Инициализация Control UI, локальное сохранение, потоки управления gateway и runtime-контракты плоскости управления задачами                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, понимание медиа, генерация изображений и runtime-контракты генерации медиа                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Контракты загрузчика, реестра, public-surface и точки входа Plugin SDK                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Исходники опубликованной пакетной стороны Plugin SDK и помощники контракта пакета Plugin                                                                            |

Quality остается отдельно от security, чтобы findings качества можно было планировать, измерять, отключать или расширять, не размывая security-сигнал. Расширение CodeQL для Swift, Python и комплектных Plugin следует возвращать как scoped или sharded follow-up работу только после того, как узкие профили получат стабильное время выполнения и сигнал.

## Workflow обслуживания

### Docs Agent

Workflow `Docs Agent` — это событийная maintenance-линия Codex для поддержания существующей документации в соответствии с недавно попавшими изменениями. У нее нет чистого расписания: успешный CI-запуск push не от бота на `main` может ее запустить, а ручной dispatch может запустить ее напрямую. Вызовы workflow-run пропускаются, когда `main` уже продвинулся или когда за последний час был создан другой непропущенный запуск Docs Agent. Когда она запускается, она проверяет диапазон коммитов от предыдущего непропущенного source SHA Docs Agent до текущего `main`, поэтому один почасовой запуск может покрыть все изменения main, накопленные с последнего прохода документации.

### Test Performance Agent

Workflow `Test Performance Agent` — это событийная maintenance-линия Codex для медленных тестов. У нее нет чистого расписания: успешный CI-запуск push не от бота на `main` может ее запустить, но она пропускается, если другой вызов workflow-run уже запускался или выполняется в эти UTC-сутки. Ручной dispatch обходит этот дневной gate активности. Линия строит сгруппированный Vitest-отчет производительности полного набора, позволяет Codex делать только небольшие сохраняющие покрытие исправления производительности тестов вместо широких рефакторингов, затем повторно запускает отчет полного набора и отклоняет изменения, которые уменьшают базовое число проходящих тестов. Сгруппированный отчет фиксирует wall time по config и max RSS на Linux и macOS, поэтому сравнение до/после показывает дельты памяти тестов рядом с дельтами длительности. Если в базовой линии есть падающие тесты, Codex может исправлять только очевидные отказы, а отчет полного набора после работы агента должен пройти до коммита. Когда `main` продвигается до того, как bot push попадает в репозиторий, линия делает rebase проверенного patch, повторно запускает `pnpm check:changed` и повторяет push; конфликтующие устаревшие patch пропускаются. Она использует GitHub-hosted Ubuntu, чтобы действие Codex могло сохранять ту же drop-sudo safety posture, что и docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — это ручной workflow для maintainer после попадания изменений, очищающий дубликаты. По умолчанию он работает в dry-run и закрывает только явно перечисленные PR, когда `apply=true`. Перед изменением GitHub он проверяет, что попавший PR смержен и что у каждого дубликата есть либо общая referenced issue, либо пересекающиеся измененные hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальные check gates и маршрутизация changed

Локальная логика changed-lane находится в `scripts/changed-lanes.mjs` и выполняется `scripts/check-changed.mjs`. Этот локальный check gate строже к архитектурным границам, чем широкий охват платформы CI:

- изменения production core запускают typecheck core prod и core test, а также core lint/guards;
- изменения только тестов core запускают только typecheck core test и core lint;
- изменения production extension запускают typecheck extension prod и extension test, а также extension lint;
- изменения только тестов extension запускают typecheck extension test и extension lint;
- изменения публичного Plugin SDK или plugin-contract расширяются до typecheck extension, потому что extensions зависят от этих core-контрактов (свипы Vitest extension остаются явной тестовой работой);
- version bumps только release metadata запускают целевые проверки version/config/root-dependency;
- неизвестные изменения root/config fail safe во все check lanes.

Локальная маршрутизация changed-test находится в `scripts/test-projects.test-support.mjs` и намеренно дешевле, чем `check:changed`: прямые правки тестов запускают сами себя, правки исходников предпочитают явные mappings, затем sibling tests и import-graph dependents. Shared group-room delivery config — один из явных mappings: изменения group visible-reply config, source reply delivery mode или message-tool system prompt проходят через core reply tests плюс регрессии доставки Discord и Slack, чтобы изменение общего значения по умолчанию падало до первого PR push. Используйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только когда изменение настолько охватывает harness, что дешевый mapped set не является надежным proxy.

## Валидация Testbox

Crabbox — принадлежащая репозиторию обертка для удаленных машин, используемая мейнтейнерами для проверки в Linux. Используйте ее
из корня репозитория, когда проверка слишком широка для локального цикла правок, когда важен
паритет с CI или когда для подтверждения нужны секреты, Docker, package lanes,
переиспользуемые машины или удаленные логи. Обычный бэкенд OpenClaw —
`blacksmith-testbox`; собственные мощности AWS/Hetzner используются как резерв на случай сбоев Blacksmith,
проблем с квотами или явного тестирования на собственной мощности.

Запуски Blacksmith через Crabbox прогревают, занимают, синхронизируют, запускают, формируют отчет и очищают
одноразовые Testbox. Встроенная sanity-проверка синхронизации быстро завершается с ошибкой, когда обязательные
корневые файлы, такие как `pnpm-lock.yaml`, исчезают или когда `git status --short`
показывает не менее 200 отслеживаемых удалений. Для PR с намеренным массовым удалением задайте
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для удаленной команды.

Crabbox также завершает локальный вызов Blacksmith CLI, который остается в
фазе синхронизации больше пяти минут без вывода после синхронизации. Задайте
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, чтобы отключить этот предохранитель, или используйте большее
значение в миллисекундах для необычно больших локальных diff.

Перед первым запуском проверьте обертку из корня репозитория:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обертка репозитория отказывается работать с устаревшим бинарным файлом Crabbox, который не объявляет `blacksmith-testbox`. Передавайте провайдера явно, хотя в `.crabbox.yaml` есть значения по умолчанию для собственного облака. В worktree Codex или связанных/разреженных checkout избегайте локального скрипта `pnpm crabbox:run`, потому что pnpm может согласовывать зависимости до запуска Crabbox; вместо этого вызывайте node-обертку напрямую:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Запуски через Blacksmith требуют Crabbox 0.22.0 или новее, чтобы обертка получала текущее поведение синхронизации, очереди и очистки Testbox. При использовании соседнего checkout пересоберите игнорируемый локальный бинарный файл перед работой с замерами времени или подтверждением:

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

Прочитайте итоговую JSON-сводку. Полезные поля: `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` и `totalMs`. Для делегированных
запусков Blacksmith Testbox код выхода обертки Crabbox и JSON-сводка являются
результатом команды. Связанный запуск GitHub Actions отвечает за hydration и keepalive; он
может завершиться как `cancelled`, когда Testbox остановлен извне после того, как SSH-команда
уже вернулась. Считайте это артефактом очистки/статуса, если только
`exitCode` обертки не ненулевой или вывод команды не показывает упавший тест.
Одноразовые запуски Crabbox через Blacksmith должны останавливать Testbox автоматически;
если запуск прерван или очистка неясна, проверьте текущие машины и остановите только
те машины, которые создали вы:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Используйте переиспользование только тогда, когда вам намеренно нужны несколько команд на одной hydrated-машине:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Если сломан слой Crabbox, но сам Blacksmith работает, используйте прямой
Blacksmith только для диагностики, такой как `list`, `status` и очистка. Исправьте
путь Crabbox, прежде чем считать прямой запуск Blacksmith мейнтейнерским подтверждением.

Если `blacksmith testbox list --all` и `blacksmith testbox status` работают, но новые
warmup остаются в `queued` без IP или URL запуска Actions через пару минут,
считайте это давлением со стороны провайдера Blacksmith, очереди, биллинга или лимитов организации. Остановите
созданные вами queued id, не запускайте дополнительные Testbox и перенесите подтверждение на
путь собственной мощности Crabbox ниже, пока кто-то проверяет dashboard Blacksmith,
биллинг и лимиты организации.

Переходите на собственную мощность Crabbox только когда Blacksmith недоступен, ограничен квотами, не имеет нужного окружения или собственная мощность является явной целью:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

При давлении на AWS избегайте `class=beast`, если задаче действительно не нужен CPU уровня 48xlarge. Запрос `beast` начинается со 192 vCPU и является самым простым способом упереться в региональную квоту EC2 Spot или On-Demand Standard. Принадлежащий репозиторию `.crabbox.yaml` по умолчанию использует `standard`, несколько регионов мощности и `capacity.hints: true`, чтобы арендованные через брокер AWS lease печатали выбранный регион/рынок, давление квот, резервный переход на Spot и предупреждения о классе под высоким давлением. Используйте `fast` для более тяжелых широких проверок, `large` только после того, как standard/fast недостаточно, и `beast` только для исключительных CPU-bound lanes, таких как полный набор тестов или Docker-матрицы всех Plugin, явная release/blocker-валидация или профилирование производительности с большим числом ядер. Не используйте `beast` для `pnpm check:changed`, сфокусированных тестов, работы только с документацией, обычного lint/typecheck, небольших E2E-репро или triage сбоя Blacksmith. Используйте `--market on-demand` для диагностики мощности, чтобы колебания рынка Spot не смешивались с сигналом.

`.crabbox.yaml` задает значения по умолчанию для провайдера, синхронизации и hydration GitHub Actions для lanes собственного облака. Он исключает локальный `.git`, чтобы hydrated checkout Actions сохранял собственные удаленные Git-метаданные вместо синхронизации локальных remotes мейнтейнера и хранилищ объектов, а также исключает локальные runtime/build-артефакты, которые никогда не должны передаваться. `.github/workflows/crabbox-hydrate.yml` отвечает за checkout, настройку Node/pnpm, получение `origin/main` и передачу несекретного окружения для команд собственного облака `crabbox run --id <cbx_id>`.

## Связанные материалы

- [Обзор установки](/ru/install)
- [Каналы разработки](/ru/install/development-channels)
