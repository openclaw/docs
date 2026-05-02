---
read_when:
    - Потрібно з’ясувати, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, контрольні перевірки за областю, парасолькові релізні процеси та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-02T04:47:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2da3014e67b8d2d4bb4c1c9d4c6134eed29309bb176544864df568809ae3ac7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI виконується під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для реліз-кандидатів і широкої валідації. Android lanes залишаються опціональними через `include_android`. Покриття plugin лише для релізів живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається тільки з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує CI manifest   | Завжди для non-draft push і PR    |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR    |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для non-draft push і PR    |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                          | Завжди для non-draft push і PR    |
| `check-dependencies`             | Production Knip dependency-only pass і guard allowlist невикористаних файлів                 | Зміни, релевантні до Node         |
| `build-artifacts`                | Збирання `dist/`, Control UI, перевірки built-artifact і повторно використовувані downstream artifacts | Зміни, релевантні до Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Зміни, релевантні до Node         |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Зміни, релевантні до Node         |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                     | Зміни, релевантні до Node         |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні до Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні до Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні до Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні до Node         |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Ручний CI dispatch для релізів    |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                      | Змінено документацію              |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                           | Зміни, релевантні до Python-skill |
| `checks-windows`                 | Windows-specific process/path tests і shared runtime import specifier regressions            | Зміни, релевантні до Windows      |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                            | Зміни, релевантні до macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | Зміни, релевантні до macOS        |
| `android`                        | Android unit tests для обох flavors і одне debug APK build                                   | Зміни, релевантні до Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх main CI або manual dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або `main` ref. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже витіснено. Automatic CI concurrency key версіонований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Область і маршрутизація

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилася кожна scoped area.

- **Редагування CI workflow** валідують Node CI graph і workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **CI routing-only edits, вибрані cheap core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують fast Node-only manifest path: `preflight`, security і одну задачу `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task вправляє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, що виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, small core unit lanes об’єднані в пари, auto-reply запускається як чотири balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards конкурентно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи дублюючого debug APK packaging job під час кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на останній версії Knip, з вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings від Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge від активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує недовірений код pull request. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch компактні `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів commit-level review на push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може inspect.

Lane `github_activity` пересилає лише normalized metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, коли вони є. Він навмисно уникає пересилання повного webhook body. Receiving workflow у `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`, який публікує normalized event до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність — це observation, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` тільки тоді, коли подія є несподіваною, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають приводити до `NO_REPLY`.

Ставтеся до GitHub titles, comments, bodies, review text, branch names і commit messages як до недовірених даних у всьому цьому path. Це input для summarization і triage, а не instructions для workflow або agent runtime.

## Manual dispatches

Manual CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android тільки з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatch окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не було скасовано іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному caller змогу запустити цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані перевіряльники тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; передперевірка install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла раніше ставати в чергу |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

## Локальні відповідники

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження Plugin/пакета/статики/Docker і запускає `OpenClaw Release Checks` для install smoke, приймання пакета, наборів Docker release-path, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram lane. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти артефакту `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm-пакета.

Див. [Повну перевірку релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
дескрипторів цільових повторних запусків.

Для підтвердження закріпленого коміту на гілці, що швидко змінюється, використовуйте помічник замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs для dispatch workflow GitHub мають бути гілками або тегами, а не сирими SHA комітів.
Помічник пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` із цього закріпленого ref, перевіряє, що кожен дочірній
workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку, коли
запуск завершується. Парасольковий перевіряльник також падає, якщо будь-який дочірній workflow працював на
іншому SHA.

`release_profile` керує шириною live/provider, що передається в release checks. Ручні
release workflows типово використовують `stable`; застосовуйте `full` лише коли ви
свідомо хочете широку advisory provider/media матрицю.

- `minimum` зберігає найшвидші критичні для релізу OpenAI/core lane.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory provider/media матрицю.

Парасолька записує id запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow перезапущено й він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього full CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного release child або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує повторний запуск збійного release box у межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E release-path Docker workflow, і в package acceptance shard. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський скасовано, тож новіша main validation
не стоїть за застарілим двогодинним release-check run. Перевірки release branch/tag
і цільові rerun groups зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs`, а не як одне послідовне завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered `native-live-src-gateway-profiles` jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені медіашарди audio/video і provider-filtered шарди music

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media shards працюють у `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіазавдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs не підходять для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й пушить цей образ один раз, потім Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні script-level обмеження `timeout`, нижчі за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, release run неправильно налаштований і марнуватиме wall clock на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальовний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після встановлення або оновлення.

### Завдання

1. `resolve_package` робить checkout `workflow_ref`, визначає один кандидат пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Багаторазовий workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes для цього пакета замість пакування workflow checkout. Коли профіль вибирає кілька цільових `docker_lanes`, багаторазовий workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance визначив його; автономний Telegram dispatch усе ще може встановити опублікований npm spec.
4. `summary` позначає workflow як невдалий, якщо визначення пакета, Docker acceptance або опційний Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний commit SHA. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або release tag, встановлює залежності в detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його слід надавати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний commit, який пакується, коли `source=ref`. Це дає поточному тестовому harness змогу перевіряти старі довірені commits вихідного коду без запуску старої workflow-логіки.

### Профілі набору

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks шляху релізу з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття plugin, щоб перевірка опублікованого пакета не залежала від live-доступності ClawHub. Опційний Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованого npm spec збережено для автономних dispatches.

Для спеціальної політики тестування оновлень і plugin, зокрема локальних команд,
Docker lanes, входів Package Acceptance, release defaults і triage збоїв,
див. [Тестування оновлень і plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає перевірки міграції пакета, оновлення, очищення застарілих залежностей plugin, offline plugin, plugin-update і Telegram на одному визначеному package tarball. Cross-OS release checks усе ще покривають OS-специфічний onboarding, installer і поведінку платформи; product validation для package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один baseline опублікованого пакета за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опублікований baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розширити lane до дедуплікованої матриці історії: останні шість stable-релізів, `2026.4.23` і останній stable-реліз перед `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для конфігурації Feishu, збережених файлів bootstrap/persona, шляхів журналів із тильдою та застарілих коренів legacy-залежностей plugin. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованого оновлення, а не у звичайній ширині Full Release CI. Локальні aggregate-запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати один lane через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Опублікований lane налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його встановлено, інакше `openai/gpt-5.5`, щоб докази встановлення й gateway залишалися на бажаній тестовій моделі GPT-5.

### Вікна legacy-сумісності

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати subcase persistence `gateway install --wrapper`, коли пакет не експонує цей flag;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` із fake git fixture, похідного від tarball, і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутність marketplace install-record persistence;
- `plugin-update` може дозволяти міграцію config metadata, водночас вимагаючи, щоб install record і поведінка no-reinstall залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли local build metadata stamp, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

### Приклади

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
  -f package_ref=release/YYYY.M.D \
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

Під час debugging невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію і SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings і rerun commands. Віддавайте перевагу повторному запуску невдалого package profile або точних Docker lanes замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Fast path** запускається для pull requests, які торкаються Docker/package surfaces, змін package/manifest для bundled plugin або core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Source-only зміни bundled plugin, test-only edits і docs-only edits не резервують Docker workers. Fast path один раз збирає root Dockerfile image, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений bundled-plugin Docker profile під 240-секундним aggregate command timeout (Docker run кожного scenario обмежений окремо).
- **Full path** зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі завдання, щоб installer work не чекав за root image smokes.

Пуші в `main` (зокрема merge commits) не примушують full path; коли changed-scope logic вимагала б full coverage на push, workflow зберігає fast Docker smoke і залишає full install smoke для нічної або release validation.

Повільний Bun global install image-provider smoke окремо обмежений через `run_bun_global_install_smoke`. Він запускається за нічним schedule і з release checks workflow, а manual `Install Smoke` dispatches можуть opt into it, але pull requests і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, пакує OpenClaw один раз як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lanes;
- functional image, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker lane розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, planner logic — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає image для кожного lane через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                 | Типово | Призначення                                                                                   |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10     | Кількість слотів основного пулу для звичайних ліній.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Кількість слотів хвостового пулу, чутливого до провайдерів.                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9      | Обмеження одночасних live-ліній, щоб провайдери не застосовували throttling.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10     | Обмеження одночасних ліній встановлення npm.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7      | Обмеження одночасних багатосервісних ліній.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Затримка між стартами ліній, щоб уникати сплесків створення в демонові Docker; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут для кожної лінії (120 хвилин); вибрані live/хвостові лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset  | `1` виводить план планувальника без запуску ліній.                                            |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset  | Розділений комами точний список ліній; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за своє ефективне обмеження, усе ще може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить місткість. Локальний агрегатор виконує попередні перевірки Docker, видаляє застарілі E2E-контейнери OpenClaw, виводить статус активних ліній, зберігає часові показники ліній для впорядкування від найдовших до найкоротших і за замовчуванням припиняє планувати нові pooled-лінії після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, який пакет, тип образу, live-образ, лінія та покриття облікових даних потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує позначені digest пакета bare/functional образи GHCR Docker E2E через Docker layer cache Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторного збирання. Завантаження Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторювався, а не споживав більшість критичного шляху CI.

### Фрагменти release-path

Покриття Release Docker запускає менші розбиті на фрагменти jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу та виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні фрагменти Release Docker: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, а також від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними aliases для plugin/runtime. Alias лінії `install-e2e` залишається агрегатним manual rerun alias для обох ліній інсталяторів провайдерів.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття release-path його запитує, і зберігає окремий фрагмент `openwebui` лише для OpenWebUI-only dispatches. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих помилок npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` із логами ліній, часовими показниками, `summary.json`, `failures.json`, часовими показниками фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість jobs фрагментів, що обмежує налагодження невдалої лінії одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільовий job локально збирає live-test образ для цього повторного запуску. Згенеровані для кожної лінії команди GitHub rerun включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний набір Docker release-path.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, push-и в `main` і самостійні manual CI dispatches тримають цей набір вимкненим. Він балансує тести bundled plugin між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурації plugin одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy партії plugin не створювали додаткових CI jobs. Release-only Docker prerelease path групує цільові Docker-лінії в невеликі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має окремі CI-лінії поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і manual dispatch; він збирає приватний QA runtime і порівнює agentic packs mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через manual dispatch; він розгалужує mock parity gate, live Matrix-лінію, а також live Telegram і Discord лінії як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають live transport-лінії Matrix і Telegram з детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб contract каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає пошук пам’яті, бо QA parity окремо покриває поведінку пам’яті; підключення провайдерів покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI та input manual workflow залишаються `all`; manual dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical лінії QA Lab перед схваленням release; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невеликий report job для фінального порівняння parity.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, model-pack parity або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів вважайте це optional signal і дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Daily, manual і non-draft pull request guard runs сканують Actions workflow code плюс JavaScript/TypeScript поверхні з найвищим ризиком за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`        | Auth, secrets, sandbox, cron і gateway baseline                                                                                      |
| `/codeql-security-high/channel-runtime-boundary` | Core channel implementation contracts плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                   |
| `/codeql-security-high/network-ssrf-boundary`    | Core SSRF, IP parsing, network guard, web-fetch і поверхні SSRF policy Plugin SDK                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                               |
| `/codeql-security-high/plugin-trust-boundary`    | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust surfaces package contract Plugin SDK     |

### Platform-specific security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза daily defaults, бо macOS build домінує за часом виконання навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries над вузькими high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для agent command/model/tool execution і reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або змін Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є teaching/iteration hooks для запуску одного quality shard в ізоляції.

| Категорія                                               | Поверхня                                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, Cron і код межі безпеки Gateway                                                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel plugin                                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація й черги автоматичних відповідей, а також runtime-контракти control plane ACP                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми Plugin SDK для пам’яті, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сеансів |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime для відповідей, параметри відповідей каналів, черги доставки та допоміжні засоби прив’язування сеансів/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація й виявлення провайдерів, реєстрація runtime провайдерів, стандартні налаштування/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Завантаження Control UI, локальне збереження, потоки керування Gateway і runtime-контракти control plane завдань                                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти runtime для основних web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                               |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований пакетний код Plugin SDK і допоміжні засоби контрактів пакетів plugin                                                                                              |

Якість залишається окремою від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без розмивання сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід повертати як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси супроводу

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована лінія супроводу Codex для підтримання наявної документації узгодженою з нещодавно внесеними змінами. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, а ручний запуск може виконати його напряму. Виклики через workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він виконується, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тому один щогодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована лінія супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, але він пропускається, якщо інший workflow-run виклик уже виконувався або виконується цього UTC-дня. Ручний запуск обходить цей денний gate активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість успішних тестів. Якщо в baseline є тести з помилками, Codex може виправляти лише очевидні збої, а післяагентський звіт повного набору має пройти перед будь-яким комітом. Коли `main` просувається вперед до того, як bot push буде внесено, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму безпечну позицію drop-sudo, що й docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес супровідників для очищення дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змарджено і що кожен duplicate має або спільну referenced issue, або hunks змін, що перетинаються.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають лише core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config безпечно переходять у всі check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, зміни source віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config — один із явних mappings: зміни до group visible-reply config, source reply delivery mode або system prompt message-tool проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна shared default падала ще до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із кореня репозиторію та віддавайте перевагу свіжому warmed box для широкого proof. Перед тим як витрачати повільний gate на box, який повторно використовували, у якого сплив строк дії або який щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і прогрійте новий замість debug product test failure. Для навмисних PR із великими deletions задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без post-sync output. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diffs.

Crabbox — це repo-owned другий шлях remote-box для Linux proof, коли Blacksmith недоступний або коли власна cloud capacity є кращою. Прогрійте box, hydrate його через project workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` володіє defaults для provider, sync і GitHub Actions hydration. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не мають передаватися. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і передачею non-secret environment, яку пізніші команди `crabbox run --id <cbx_id>` source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
