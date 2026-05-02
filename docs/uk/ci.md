---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, контрольні перевірки за обсягом, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T06:53:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінилися лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для реліз-кандидатів і широкої валідації. Android-лінії залишаються опційними через `include_android`. Покриття Plugin лише для релізу розміщене в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує CI manifest   | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                            | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів              | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і багаторазові downstream artifacts      | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol checks                 | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                      | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Core Node test shards, без channel, bundled, contract і extension ліній                      | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node    |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                  | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                     | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності Node 22 і smoke-лінія                                                       | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                      | Документація змінилася             |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                            | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Windows-специфічні тести процесів/шляхів плюс спільні регресії runtime import specifier      | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane зі спільними built artifacts                                       | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                       | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                 | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                             | Успіх Main CI або manual dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream consumers могли стартувати щойно спільна збірка готова.
4. Важчі platform і runtime лінії розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як CI-шум, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно звітують про нормальні shard failures, але не стають у чергу після того, як весь workflow уже витіснено. Автоматичний CI concurrency key має версію (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Область і routing

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає виявлення changed-scope і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються прив’язаними до змін platform source.
- **Редагування лише CI routing, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, сумісність Node 22, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task напряму виконує.
- **Windows Node checks** обмежені Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю лінію; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші Node test families розділені або збалансовані, щоб кожне завдання лишалося малим без надмірного резервування runners: channel contracts виконуються як три weighted shards, малі core unit lanes поєднані парами, auto-reply працює як чотири balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із назвою CI shard, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards конкурентно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи водночас duplicate debug APK packaging job для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на найновішій версії Knip, з вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, зберігаючи водночас intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує ненадійний код pull request. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів commit-level review на push до `main`;
- `github_activity` для загальної GitHub activity, яку агент ClawSweeper може оглянути.

Лінія `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони є. Вона навмисно уникає пересилання повного webhook body. Receiving workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає normalized event до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має писати до `#clawsweeper` лише коли event є несподіваним, actionable, ризиковим або операційно корисним. Рутинні opens, edits, bot churn, duplicate webhook noise і normal review traffic мають давати `NO_REPLY`.

Сприймайте GitHub titles, comments, bodies, review text, branch names і commit messages як ненадійні дані на всьому цьому path. Вони є input для summarization і triage, а не інструкціями для workflow або agent runtime.

## Ручні dispatches

Manual CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatch окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не скасовувався іншим push або PR run на тому самому ref. Опційний input `target_ref` дає trusted caller змогу запустити цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованого, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди плагінів, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тож 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

## Локальні еквіваленти

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

## Повна валідація релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження Plugin/пакетів/статичних артефактів/Docker, а також запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suite, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lane. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти артефакту `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити той самий Telegram package lane проти опублікованого npm-пакета.

Див. [повну валідацію релізу](/uk/reference/full-release-validation), щоб переглянути
матрицю етапів, точні назви завдань workflow, відмінності профілів, артефакти та
ідентифікатори для сфокусованих повторних запусків.

`OpenClaw Release Publish` — це ручний workflow релізу, який змінює стан. Запускайте його
з `release/YYYY.M.D` або `main` після того, як існує тег релізу і після успішного
OpenClaw npm preflight. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх публікованих пакетів Plugin, запускає
`Plugin ClawHub Release` для того самого SHA релізу і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для підтвердження за закріпленим комітом на гілці, що швидко рухається, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути гілками або тегами, а не сирими SHA комітів.
Helper пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` із цього закріпленого ref, перевіряє, що кожен дочірній
workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку після завершення
запуску. Парасольковий верифікатор також падає, якщо будь-який дочірній workflow виконувався на
іншому SHA.

`release_profile` керує шириною live/provider, що передається в release checks. Ручні
release workflows типово використовують `stable`; використовуйте `full` лише тоді, коли
навмисно потрібна широка advisory provider/media matrix.

- `minimum` залишає найшвидші критичні для релізу OpenAI/core lanes.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory provider/media matrix.

Парасолька записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні результати дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання верифікатора, щоб оновити результат парасольки та підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного повного дочірнього CI, `plugin-prerelease` лише для дочірнього plugin prerelease, `release-checks` для кожного дочірнього release, або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на парасольці. Це утримує повторний запуск невдалого release box обмеженим після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E release-path Docker workflow, і в package acceptance shard. Це зберігає однакові байти пакета між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
витісняють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який він
уже запустив, коли батьківський запуск скасовано, тож новіша валідація main
не стоїть за застарілим двогодинним запуском release-check. Валідація release branch/tag
і сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- відфільтровані за provider завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені media audio/video шарди та відфільтровані за provider music шарди

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви шард `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Native live media шарди виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Підтримувані Docker шард-и live-моделей/бекендів використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Робочий процес live-релізу збирає й публікує цей образ один раз, після чого шард-и Docker live-моделі, provider-sharded Gateway, бекенду CLI, прив’язки ACP і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шард-и Gateway мають явні обмеження `timeout` на рівні скриптів нижче за тайм-аут завдання робочого процесу, щоб завислий контейнер або шлях очищення швидко завершувався помилкою, а не споживав увесь бюджет release-check. Якщо ці шард-и самостійно перебудовують повну ціль Docker з вихідного коду, запуск релізу налаштований неправильно й марнуватиме реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний робочий процес завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування checkout робочого процесу. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний робочий процес готує пакет і спільні образи один раз, а потім розгалужує ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; автономний dispatch Telegram все ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує робочий процес помилкою, якщо визначення пакета, Docker acceptance або необов’язкова Telegram lane завершилися помилкою.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності в detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто вказувати для артефактів, поширених назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це коміт вихідного коду, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старі довірені коміти вихідного коду без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin coverage, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних dispatch.

Докладну політику тестування оновлень і plugin, включно з локальними командами,
Docker lanes, вхідними даними Package Acceptance, типовими параметрами релізу й triage помилок,
див. у [Тестування оновлень і plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає перевірки міграції пакета, оновлення, очищення застарілої plugin-залежності, offline plugin, plugin-update і Telegram на одному й тому самому визначеному package tarball. Cross-OS release checks все ще покривають специфічну для ОС поведінку onboarding, installer і platform; перевірку продукту package/update слід починати з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один базовий опублікований пакет за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback базовий опублікований пакет, типово `openclaw@latest`; команди повторного запуску failed-lane зберігають цю baseline. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розширити lane на дедупліковану матрицю історії: останні шість stable-релізів, `2026.4.23` і останній stable-реліз перед `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baseline на issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona-файлів, шляхів журналів із tilde та застарілих коренів legacy plugin-залежностей. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній широті Full Release CI. Локальні aggregate-запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована lane налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його задано, інакше `openai/gpt-5.5`, тож install і gateway proof залишаються на бажаній тестовій моделі GPT-5.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні записи QA в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок persistence `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може прибирати відсутні `pnpm.patchedDependencies` з fake git fixture, отриманої з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти міграцію metadata config, усе ще вимагаючи, щоб install record і no-reinstall behavior лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні build metadata stamp files, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію й SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, phase timings і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого package profile або точних Docker lanes замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/package surfaces, змін bundled plugin package/manifest або surfaces core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає root Dockerfile image, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає обмежений bundled-plugin Docker profile під 240-секундним aggregate command timeout (кожен Docker run сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі завдання, щоб installer work не чекав за root image smokes.

Пуші в `main` (включно з merge commits) не примушують запуск повного шляху; коли логіка changed-scope запитала б повне покриття на push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а manual `Install Smoke` dispatches можуть увімкнути його, але pull requests і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для normal functionality lanes.

Визначення Docker-ланів містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner лише виконує вибраний план. Планувальник вибирає образ для кожного лану за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лани з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                 | Типово  | Призначення                                                                                          |
| -------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ланів.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів хвостового пулу, чутливого до провайдерів.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження одночасних live-ланів, щоб провайдери не застосовували throttling.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Обмеження одночасних ланів установлення npm.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження одночасних ланів із кількома сервісами.                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ланів, щоб уникнути сплесків створення в Docker daemon; установіть `0` без неї. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут для кожного лану (120 хвилин); вибрані live/tail лани використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` виводить план планувальника без запуску ланів.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Точний список ланів, розділених комами; пропускає cleanup smoke, щоб агенти могли відтворити один збійний лан. |

Лан, важчий за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сам, доки не звільнить місткість. Локальний агрегатор попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ланів, зберігає таймінги ланів для впорядкування від найдовших і за замовчуванням припиняє планувати нові лани в пулі після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, який пакет, тип образу, live-образ, лан і покриття облікових даних потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summary. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує позначені digest пакета bare/functional GHCR Docker E2E образи через кеш Docker-шарів Blacksmith, коли план потребує ланів з установленим пакетом; і повторно використовує надані вхідні значення `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з digest пакета замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторювався, а не займав більшість критичного шляху CI.

### Фрагменти release-шляху

Release Docker coverage запускає менші фрагментовані jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу й виконував кілька ланів через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні Docker-фрагменти release — це `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами Plugin/runtime. Псевдонім лану `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох ланів інсталяторів провайдерів.

OpenWebUI включається в `plugins-runtime-services`, коли це запитує повне покриття release-path, і зберігає окремий фрагмент `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Лани оновлення bundled-channel повторюються один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент вивантажує `.artifacts/docker-tests/` із журналами ланів, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ланів і командами повторного запуску для кожного лану. Вхідне значення workflow `docker_lanes` запускає вибрані лани проти підготовлених образів замість chunk jobs, що обмежує debugging збійного лану одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибраний лан є live Docker ланом, цільовий job збирає образ live-тесту локально для цього повторного запуску. Згенеровані для кожного лану команди повторного запуску GitHub містять `package_artifact_run_id`, `package_artifact_name` і вхідні значення підготовлених образів, коли ці значення існують, щоб збійний лан міг повторно використати точний пакет і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір release-path.

## Передреліз Plugin

`Plugin Prerelease` — це дорожче покриття product/package, тому він є окремим workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, push у `main` і автономні ручні CI dispatch не запускають цей набір. Він балансує тести bundled Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу та більшим heap Node, щоб насичені import пакети Plugin не створювали додаткових CI jobs. Docker prerelease path лише для release групує цільові Docker-лани в малі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має dedicated CI лани поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і ручного dispatch; він збирає приватний QA runtime і порівнює агентні пакети mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгалужує mock parity gate, live Matrix лан і live Telegram та Discord лани як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport лани з детермінованим mock провайдером і mock-qualified моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук у пам’яті, бо QA parity окремо покриває поведінку пам’яті; підключення провайдерів покривають окремі live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checkout CLI це підтримує. Типове значення CLI і ручне вхідне значення workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардує повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab лани перед схваленням release; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в малий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit tests вважайте це необов’язковим сигналом і дотримуйтеся доказів scoped CI/check.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Daily, manual і non-draft pull request guard runs сканують Actions workflow code плюс найризиковіші JavaScript/TypeScript поверхні з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс channel Plugin runtime, Gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні SSRF policy Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                               |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust surfaces контракту package Plugin SDK   |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Вивантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із вивантаженого SARIF і вивантажує під `/codeql-critical-security/macos`. Залишається поза daily defaults, бо macOS build домінує runtime навіть коли clean.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у agent command/model/tool execution і reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel Plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є навчальними/ітераційними hooks для запуску одного якісного shard ізольовано.

| Категорія                                               | Поверхня                                                                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації каналів ядра та вбудованих Plugin каналів                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація й черги автовідповідей, а також runtime-контракти control plane ACP                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, помічники нагляду за процесами та контракти вихідної доставки                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам'яті, runtime-фасади пам'яті, псевдоніми Plugin SDK для пам'яті, зв'язувальний код runtime-активації пам'яті та команди doctor для пам'яті                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сеансів, помічники прив'язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів логів і CLI-контракти doctor для сеансів |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, помічники payload/chunking/runtime для відповідей, параметри відповідей каналів, черги доставки та помічники прив'язування сеансів/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, defaults/каталоги провайдерів і реєстри web/search/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальне збереження, control flows Gateway і runtime-контракти control plane завдань                                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти runtime для core web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                                  |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side вихідний код Plugin SDK і помічники контракту пакета Plugin                                                                                         |

Якість залишається окремою від безпеки, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як scoped або sharded follow-up роботу лише після того, як вузькі профілі матимуть стабільні runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво-керована lane обслуговування Codex для підтримання наявної документації узгодженою з нещодавно злитими змінами. Він не має чистого розкладу: успішний CI run після non-bot push на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший non-skipped run Docs Agent було створено протягом останньої години. Коли він виконується, він переглядає діапазон комітів від попереднього non-skipped source SHA Docs Agent до поточного `main`, тож один погодинний run може охопити всі зміни main, накопичені від останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована lane обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI run після non-bot push на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей щоденний activity gate. Lane будує згрупований performance report Vitest для всього suite, дозволяє Codex робити лише малі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, які зменшують базову кількість прохідних тестів. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а full-suite report після агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається до того, як bot push буде злитий, lane rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб action Codex міг зберегти ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після Merge

Workflow `Duplicate PRs After Merge` — це manual maintainer workflow для очищення дублікатів після land. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область CI platform:

- production-зміни ядра запускають typecheck core prod і core test плюс core lint/guards;
- test-only зміни ядра запускають лише typecheck core test плюс core lint;
- production-зміни Plugin запускають typecheck extension prod і extension test плюс extension lint;
- test-only зміни Plugin запускають typecheck extension test плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck Plugin, бо Plugin залежать від цих core-контрактів (Vitest extension sweeps залишаються явною тестовою роботою);
- release metadata-only version bumps запускають цільові перевірки версії/конфігурації/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі правки тестів запускають самі себе, правки вихідного коду спершу віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із явних mappings: зміни group visible-reply config, source reply delivery mode або system prompt message-tool проходять через core reply tests плюс регресії доставки Discord і Slack, щоб спільна зміна default упала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із кореня репозиторію та віддавайте перевагу свіжому warmed box для широкого proof. Перед витрачанням повільного gate на box, який був reused, expired або щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли required root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і warm-ніть свіжий замість налагодження product test failure. Для навмисних PR із великим видаленням встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п'ять хвилин без post-sync output. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це repo-owned другий remote-box path для Linux proof, коли Blacksmith недоступний або коли бажаніша owned cloud capacity. Warm-ніть box, hydrate-ніть його через project workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` володіє defaults провайдера, sync і GitHub Actions hydration. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, і виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і non-secret environment handoff, який пізніші команди `crabbox run --id <cbx_id>` source-ять.

## Пов'язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
