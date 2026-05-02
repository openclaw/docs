---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти за областю дії, парасолькові релізні перевірки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T06:28:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03258176c6672355abf335bfcb2a962c0ddc62605aaeaba1f60f513d03bce2d4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lane, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне scoped-обмеження й розгортають повний граф для release candidate та широкої валідації. Android lane залишаються opt-in через `include_android`. Release-only покриття plugin міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only зміни, змінені scopes, змінені extensions і будує CI manifest              | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і audit workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Audit production lockfile без залежностей щодо npm advisories                                | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для unused-file                    | Node-релевантні зміни              |
| `build-artifacts`                | Build `dist/`, Control UI, built-artifact checks і повторно використовувані downstream artifacts | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-релевантні зміни              |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes              | Node-релевантні зміни              |
| `check`                          | Sharded еквівалент основного local gate: prod types, lint, guards, test types і strict smoke | Node-релевантні зміни              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-релевантні зміни              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-релевантні зміни              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки broken-link                                              | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Зміни, релевантні Python-skill     |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-релевантні зміни           |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                            | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс один debug APK build                                | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна Codex оптимізація повільних тестів після trusted activity                            | Успіх Main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було superseded. Automatic CI concurrency key має versioned формат (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби кожна scoped area змінилася.

- **CI workflow edits** валідують Node CI graph плюс workflow linting, але самі собою не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, selected cheap core-test fixture edits і narrow plugin contract helper/test-routing edits** використовують fast Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє безпосередньо.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; unrelated source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node test розділено або збалансовано так, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts працюють як три weighted shards, small core unit lanes об’єднані в пари, auto-reply працює як чотири balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої small independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже збудовано.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з BuildConfig flags для SMS/call-log, уникаючи duplicate debug APK packaging job на кожному Android-релевантному push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до latest Knip version, із вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings від Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий unreviewed unused file або залишає stale allowlist entry, зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## ClawSweeper activity forwarding

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge від активності репозиторію OpenClaw до ClawSweeper. Він не check out і не виконує untrusted pull request code. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatches компактні `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних issue і pull request review requests;
- `clawsweeper_comment` для явних ClawSweeper commands у issue comments;
- `clawsweeper_commit_review` для commit-level review requests на push у `main`;
- `github_activity` для загальної GitHub activity, яку ClawSweeper agent може inspect.

Lane `github_activity` пересилає лише normalized metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, коли вони наявні. Вона навмисно уникає пересилання повного webhook body. Receiving workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який posts normalized event до OpenClaw Gateway hook для ClawSweeper agent.

General activity — це observation, а не delivery-by-default. ClawSweeper agent отримує Discord target у своєму prompt і має post до `#clawsweeper` лише тоді, коли event є surprising, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають призводити до `NO_REPLY`.

Сприймайте GitHub titles, comments, bodies, review text, branch names і commit messages як untrusted data на всьому цьому path. Вони є input для summarization і triage, а не інструкціями для workflow або agent runtime.

## Ручні dispatches

Manual CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують unique concurrency group, тому release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає trusted caller змогу запускати цей graph проти branch, tag або full commit SHA, використовуючи workflow file із selected dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, верифікатори агрегатів тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; передперевірка install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі для 32 vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## Повна валідація релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для релізних доказів Plugin/пакетів/статичних артефактів/Docker, а також запускає `OpenClaw Release Checks` для install smoke, приймання пакетів, наборів Docker для релізного шляху, live/E2E, OpenWebUI, паритету QA Lab, Matrix і доріжок Telegram. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти артефакту `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму доріжку пакета Telegram проти опублікованого npm-пакета.

Див. [повну валідацію релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
ручок для сфокусованого повторного запуску.

`OpenClaw Release Publish` — це ручний змінювальний workflow релізу. Запускайте його
з `release/YYYY.M.D` або `main` після того, як існує тег релізу, і після того, як
передперевірка OpenClaw npm успішно завершилася. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх публікованих пакетів Plugin, запускає
`Plugin ClawHub Release` для того самого SHA релізу, і лише після цього запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

Для доказу зафіксованого коміту на швидко змінюваній гілці використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs запуску workflow GitHub мають бути гілками або тегами, а не сирими SHA комітів. Helper
надсилає тимчасову гілку `release-ci/<sha>-...` на цільовий SHA,
запускає `Full Release Validation` з цього зафіксованого ref, перевіряє, що кожен дочірній
workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку, коли запуск
завершується. Парасольковий верифікатор також завершується з помилкою, якщо будь-який дочірній workflow виконувався на
іншому SHA.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні
релізні workflow типово використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку дорадчу матрицю provider/media.

- `minimum` залишає найшвидші критичні для релізу доріжки OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку дорадчу матрицю provider/media.

Парасолька записує id запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапустили і він став зеленим, перезапустіть лише батьківське завдання верифікатора, щоб оновити результат парасольки й підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного повного дочірнього CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожного дочірнього релізного запуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це тримає повторний запуск невдалого релізного бокса обмеженим після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в Docker workflow live/E2E релізного шляху, і в шард приймання пакета. Це зберігає байти пакета узгодженими між релізними боксами й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який він
уже запустив, коли батьківський запуск скасовано, тому новіша валідація main
не стоїть за застарілим двогодинним запуском release-check. Валідація гілки/тега релізу
та сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-filtered завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені шарди audio/video media та provider-filtered шарди music

Це зберігає те саме файлове покриття, водночас полегшуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні шарди live media запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; завдання media лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live-набори на звичайних раннерах Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-підкріплені live-шарди моделей/backend використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Workflow live-релізу один раз збирає й публікує цей образ, а потім Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скриптів, нижчі за timeout job workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну Docker-ціль із джерельного коду, запуск релізу налаштований неправильно й марнуватиме реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє дерево джерельного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Jobs

1. `resolve_package` checkout-ить `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розгалужує ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; standalone Telegram dispatch усе ще може встановити опубліковану npm spec.
4. `summary` провалює workflow, якщо визначення пакета, Docker-приймання або опційна Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний commit SHA. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або release tag, встановлює залежності у detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов'язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його варто надавати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це коміт джерела, який пакується, коли `source=ref`. Це дозволяє поточному тестовому harness перевіряти старіші довірені коміти джерела без запуску старої workflow-логіки.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов'язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття plugin, щоб перевірка опублікованого пакета не залежала від live-доступності ClawHub. Опційна Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, із шляхом опублікованої npm spec, залишеним для standalone dispatches.

Окрему політику тестування оновлень і plugin, включно з локальними командами,
Docker lanes, входами Package Acceptance, типовими налаштуваннями релізу й triage збоїв,
див. у [Тестування оновлень і plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає перевірки міграції пакета, оновлення, очищення застарілих залежностей plugin, offline plugin, plugin-update і Telegram на тому самому визначеному package tarball. Крос-OS release checks усе ще покривають OS-специфічне onboarding, installer і поведінку платформи; продуктову перевірку package/update слід починати з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один baseline опублікованого пакета за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає резервний опублікований baseline, за замовчуванням `openclaw@latest`; команди rerun для failed-lane зберігають цей baseline. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розширити lane на deduped history matrix: останні шість stable-релізів, `2026.4.23` і останній stable-реліз перед `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для конфігурації Feishu, збережених bootstrap/persona файлів, tilde log paths і застарілих legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання стосується вичерпного очищення опублікованих оновлень, а не звичайної широти Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline через вбудований рецепт команд `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після запуску Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли він заданий, інакше `openai/gpt-5.5`, щоб install і gateway proof залишалися на пріоритетній GPT-5 тестовій моделі.

### Legacy compatibility windows

Package Acceptance має обмежені legacy-compatibility windows для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати subcase persistence для `gateway install --wrapper`, коли пакет не expose-ить цей flag;
- `update-channel-switch` може prune-ити відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти міграцію config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про local build metadata stamp files, які вже були випущені. Пізніші пакети мають задовольняти сучасні контракти; ті самі умови призводять до failure, а не warn або skip.

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

Під час debugging failed package acceptance run почніть із summary `resolve_package`, щоб підтвердити package source, version і SHA-256. Потім огляньте child run `docker_acceptance` і його Docker artifacts: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings і rerun commands. Віддавайте перевагу rerun failed package profile або точних Docker lanes замість rerun повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власний job `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/package surfaces, змін bundled plugin package/manifest або core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Source-only зміни bundled plugin, test-only edits і docs-only edits не резервують Docker workers. Fast path один раз збирає root Dockerfile image, перевіряє CLI, запускає agents delete shared-workspace CLI smoke, запускає container gateway-network e2e, перевіряє bundled extension build arg і запускає bounded bundled-plugin Docker profile під 240-секундним aggregate command timeout (Docker run кожного scenario обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для nightly scheduled runs, manual dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекав за root image smokes.

`main` pushes (включно з merge commits) не примушують full path; коли changed-scope logic запитала б full coverage на push, workflow залишає fast Docker smoke і лишає full install smoke для nightly або release validation.

Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`. Він запускається за nightly schedule і з workflow release checks, а manual dispatches `Install Smoke` можуть opt into it, але pull requests і `main` pushes — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lanes;
- functional image, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner лише виконує вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                 | Типове значення | Призначення                                                                                                      |
| -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних ліній.                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів хвостового пулу, чутливого до провайдерів.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Обмеження одночасних live-ліній, щоб провайдери не вмикали throttling.                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Обмеження одночасних ліній встановлення npm.                                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Обмеження одночасних багатосервісних ліній.                                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Інтервал між стартами ліній, щоб уникати штормів створення в Docker daemon; задайте `0`, щоб вимкнути інтервал. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут на лінію (120 хвилин); вибрані live/хвостові лінії використовують жорсткіші обмеження.       |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset           | `1` друкує план планувальника без запуску ліній.                                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset           | Розділений комами точний список ліній; пропускає cleanup smoke, щоб агенти могли відтворити одну збійну лінію.  |

Лінія, важча за її ефективне обмеження, все ще може стартувати з порожнього пулу, а потім працює самостійно, доки не звільнить місткість. Локальний агрегат попередньо перевіряє Docker, видаляє застарілі OpenClaw E2E-контейнери, виводить статус активних ліній, зберігає таймінги ліній для впорядкування від найдовших до найкоротших і типово припиняє планувати нові pooled-лінії після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття package, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт package з поточного запуску, або завантажує артефакт package з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й пушить bare/functional GHCR Docker E2E-образи з тегом package digest через кеш Docker-шарів Blacksmith, коли плану потрібні лінії з установленим package; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи з package digest замість перебудови. Pull Docker-образів повторюється з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторювався, а не споживав більшу частину критичного шляху CI.

### Частини release-path

Release Docker-покриття запускає менші jobs із chunks з `OPENCLAW_SKIP_DOCKER_BUILD=1`, тож кожен chunk підтягує лише потрібний йому тип образу й виконує кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними alias для plugin/runtime. Alias лінії `install-e2e` залишається агрегатним manual rerun alias для обох ліній встановлювача провайдера.

OpenWebUI входить до `plugins-runtime-services`, коли повне release-path покриття його запитує, і зберігає окремий chunk `openwebui` лише для dispatch, присвячених тільки OpenWebUI. Лінії оновлення bundled-channel повторюють запуск один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` з logs ліній, таймінгами, `summary.json`, `failures.json`, фазовими таймінгами, JSON плану планувальника, таблицями повільних ліній і командами rerun для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує налагодження збійної лінії одним targeted Docker job і готує, завантажує або повторно використовує артефакт package для цього запуску; якщо вибрана лінія є live Docker-лінією, targeted job локально збирає live-test image для цього rerun. Згенеровані для кожної лінії GitHub-команди rerun включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, тож збійна лінія може повторно використати точний package і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Попередній реліз Plugin

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, pushes у `main` і standalone manual CI dispatches не запускають цей suite. Він балансує тести bundled plugin між вісьмома extension workers; ці extension shard jobs запускають до двох груп plugin config одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткових CI jobs. Release-only Docker prerelease path групує targeted Docker lanes у невеликі групи, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має окремі CI-лінії поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і manual dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб contract каналу був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, бо QA parity окремо покриває поведінку memory; provider connectivity покривається окремими suites live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед approval релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невеликий report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна насправді не зачіпає QA runtime, model-pack parity або surface, яким володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test розглядайте це як optional signal і дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass security scanner, а не повним sweep репозиторію. Daily, manual і non-draft pull request guard runs сканують Actions workflow code плюс JavaScript/TypeScript surfaces із найвищим ризиком за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard лишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до PR defaults.

### Категорії безпеки

| Категорія                                        | Surface                                                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Core channel implementation contracts плюс channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і Plugin SDK SSRF policy surfaces                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust surfaces package contract Plugin SDK |

### Platform-specific security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує dependency build results із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Утримується поза daily defaults, бо macOS build домінує runtime навіть коли clean.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у agent command/model/tool execution і reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є навчальними/ітераційними хуками для запуску одного якісного сегмента ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`           | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                                 |
| `/codeql-critical-quality/config-boundary`             | Схема конфігурації, міграція, нормалізація та контракти введення-виведення                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Схеми протоколу Gateway і контракти методів сервера                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`    | Контракти реалізації основного каналу та вбудованого канального plugin                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`      | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація автовідповідей і черги, а також runtime-контракти площини керування ACP                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, допоміжні засоби нагляду за процесами й контракти вихідної доставки                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`     | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми SDK пам’яті Plugin, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів журналів і CLI-контракти doctor для сеансів |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/нарізання/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сеансу/потоку |
| `/codeql-critical-quality/provider-runtime-boundary`   | Нормалізація каталогу моделей, автентифікація й виявлення провайдерів, реєстрація runtime провайдерів, типові налаштування/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`            | Початкове завантаження Control UI, локальна персистентність, потоки керування Gateway і runtime-контракти площини керування завданнями                                              |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Runtime-контракти основного web fetch/search, media IO, розуміння медіа, image-generation і media-generation                                                                         |
| `/codeql-critical-quality/plugin-boundary`             | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опублікований package-side вихідний код Plugin SDK і допоміжні засоби контрактів пакетів plugin                                                                                     |

Якість залишається окремо від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації в узгодженості з нещодавно доданими змінами. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли за останню годину було створено інший непропущений запуск Docs Agent. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей щоденний шлюз активності. Лінія збирає згрупований звіт продуктивності Vitest для всього набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для всього набору й відхиляє зміни, які зменшують базову кількість успішних тестів. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а повний звіт після агента для всього набору має пройти перед тим, як щось буде закомічено. Коли `main` просувається до того, як bot push потрапляє в репозиторій, лінія ребейзить перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму позицію безпеки drop-sudo, що й docs agent.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний workflow для мейнтейнерів для очищення дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR злито і що кожен дублікат має або спільне referenced issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check-gates і маршрутизація змін

Логіка локальних changed-lane розміщена в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- зміни core production запускають typecheck core prod і core test, а також core lint/guards;
- зміни лише core test запускають лише typecheck core test і core lint;
- зміни extension production запускають typecheck extension prod і extension test, а також extension lint;
- зміни лише extension test запускають typecheck extension test і extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test розміщена в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе, редагування source віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Спільна конфігурація доставки group-room є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна спільного default падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й віддавайте перевагу свіжому прогрітому box для широкого доказу. Перед тим як витрачати повільний gate на box, який був повторно використаний, протермінований або щойно повідомив про несподівано великий sync, спочатку запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість налагодження збою product test. Для навмисних PR із великими видаленнями задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який лишається у фазі sync понад п’ять хвилин без post-sync output. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diffs.

Crabbox — це repo-owned другий шлях remote-box для Linux proof, коли Blacksmith недоступний або коли власна хмарна потужність є кращою. Прогрійте box, hydrate його через project workflow, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` володіє типовими налаштуваннями provider, sync і GitHub Actions hydration. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і non-secret environment handoff, який пізніші команди `crabbox run --id <cbx_id>` source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
