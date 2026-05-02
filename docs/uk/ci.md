---
read_when:
    - Вам потрібно з'ясувати, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, контрольні перевірки за областю, релізні набори та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T01:24:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7312e6367d24a5f61546fa84c3a281124d463821332ae11ac7bbbbab83cb8d4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять smart scoping і розгортають повний граф для release candidates і широкої валідації. Android lanes залишаються opt-in через `include_android`. Покриття Plugin лише для release міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені scopes, змінені extensions і будує CI manifest            | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Production lockfile audit без залежностей щодо npm advisories                                | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий aggregate для fast security jobs                                                | Завжди для non-draft pushes і PRs  |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів              | Node-relevant changes              |
| `build-artifacts`                | Будує `dist/`, Control UI, built-artifact checks і reusable downstream artifacts              | Node-relevant changes              |
| `checks-fast-core`               | Fast Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                  | Node-relevant changes              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                         | Node-relevant changes              |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                     | Node-relevant changes              |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types і strict smoke      | Node-relevant changes              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Node-relevant changes              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Node-relevant changes              |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Node-relevant changes              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Manual CI dispatch for releases    |
| `check-docs`                     | Docs formatting, lint і broken-link checks                                                   | Docs changed                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Python-skill-relevant changes      |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Windows-relevant changes           |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                            | macOS-relevant changes             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | macOS-relevant changes             |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                               | Android-relevant changes           |
| `test-performance-agent`         | Щоденна оптимізація Codex slow-test після trusted activity                                   | Main CI success або manual dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається з fast Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тож вони все одно повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже був замінений. Автоматичний CI concurrency key версіонований (`CI-v7-*`), тож GitHub-side zombie у старій queue group не може безкінечно блокувати новіші main runs. Manual full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби змінилась кожна scoped area.

- **Зміни CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують запускати Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, selected cheap core-test fixture edits і narrow plugin contract helper/test-routing edits** використовують fast Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє безпосередньо.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші Node test families розділені або збалансовані, щоб кожне завдання залишалося невеликим без надмірного резервування runners: channel contracts запускаються як три weighted shards, small core unit lanes об’єднані в пари, auto-reply запускається як чотири balanced workers (із розбиттям reply subtree на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої small independent guards паралельно в одному job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з BuildConfig flags для SMS/call-log, уникаючи дублювання debug APK packaging job на кожному Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий неперевірений unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може розв’язати статично.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не виконує checkout і не запускає ненадійний pull request code. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає compact `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних issue і pull request review requests;
- `clawsweeper_comment` для явних команд ClawSweeper у issue comments;
- `clawsweeper_commit_review` для commit-level review requests на `main` pushes;
- `github_activity` для загальної GitHub activity, яку ClawSweeper agent може перевіряти.

Lane `github_activity` пересилає лише normalized metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, коли вони присутні. Він навмисно не пересилає повне webhook body. Receiving workflow в `openclaw/clawsweeper` — `.github/workflows/github-activity.yml`, який публікує normalized event до OpenClaw Gateway hook для ClawSweeper agent.

General activity — це observation, а не delivery-by-default. ClawSweeper agent отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише коли подія є несподіваною, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають завершуватися `NO_REPLY`.

Сприймайте GitHub titles, comments, bodies, review text, branch names і commit messages як ненадійні дані в усьому цьому path. Це input для summarization і triage, а не instructions для workflow або agent runtime.

## Manual dispatches

Manual CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` із увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не скасовувався іншим push або PR run на тому самому ref. Опціональний input `target_ref` дає trusted caller змогу запускати цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколів/контрактів/вбудованого, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди та агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщений у GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди extension, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час у черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` — це ручний парасольковий workflow для "запустити все перед релізом". Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, release-path наборів Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і каналів Telegram. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти артефакта `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити той самий пакетний канал Telegram проти опублікованого npm-пакета.

Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
цільових ідентифікаторів повторного запуску.

`release_profile` керує шириною live/provider, що передається в release checks. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку консультативну матрицю provider/media.

- `minimum` зберігає найшвидші критичні для релізу канали OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх виконань, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх виконань і додає таблиці найповільніших завдань для кожного дочірнього виконання. Якщо дочірній workflow перезапущено і він став зеленим, повторно запустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного повного дочірнього CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожного дочірнього release або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольці. Це утримує повторний запуск невдалого release box у межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до live/E2E Docker workflow release-path, і до шарда package acceptance. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський запуск скасовано, тому новіша валідація main
не стоїть позаду застарілого двогодинного запуску release-check. Валідація release branch/tag
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

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
- розділені медіа-шарди audio/video і provider-filtered шарди music

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агрегатні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіа-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних раннерах Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed шарди live model/backend використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й пушить цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і шарди Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker шарди мають явні обмеження `timeout` на рівні скрипта нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну ціль source Docker, release run неправильно налаштований і марнуватиме wall clock на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання таке: "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI валідує дерево джерел, тоді як package acceptance валідує один tarball через той самий Docker E2E harness, який користувачі використовують після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, ref workflow, ref пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-доріжки для цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розподіляє ці доріжки як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance визначив пакет; окремий dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow помилкою, якщо визначення пакета, Docker acceptance або необов’язкова доріжка Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для acceptance опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA commit. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний commit досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для артефактів, поширених назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/тестового harness, який запускає тест. `package_ref` — це початковий commit, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старіші довірені початкові commit без запуску старої логіки workflow.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти release-path Docker з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття Plugin, щоб перевірка опублікованого пакета не залежала від живої доступності ClawHub. Необов’язкова доріжка Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для окремих dispatch.

Спеціальну політику тестування оновлень і Plugin, зокрема локальні команди,
Docker-доріжки, inputs Package Acceptance, типові значення релізу та triage збоїв,
див. у [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це зберігає перевірки міграції пакета, оновлення, очищення застарілих залежностей Plugin, offline Plugin, plugin-update і Telegram на одному визначеному tarball пакета. Cross-OS release checks і надалі покривають специфічні для ОС onboarding, інсталятор і поведінку платформи; product-валидацію пакета/оновлення слід починати з Package Acceptance. Docker-доріжка `published-upgrade-survivor` перевіряє один базовий опублікований пакет за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опублікований baseline, типово `openclaw@latest`; команди повторного запуску невдалих доріжок зберігають цей baseline. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розгорнути доріжку в deduped матрицю історії: останні шість stable-релізів, `2026.4.23` і останній stable-реліз до `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розгорнути ті самі baselines у fixtures, сформовані за issues, для конфігурації Feishu, збережених bootstrap/persona файлів, шляхів логів із tilde і застарілих коренів залежностей Plugin. Окремий workflow `Update Migration` використовує Docker-доріжку `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній ширині Full Release CI. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну доріжку з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована доріжка налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після запуску Gateway. Windows-доріжки packaged і installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного Windows-шляху. Cross-OS smoke агентного turn OpenAI типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли задано, інакше `openai/gpt-5.5`, тож install і gateway proof залишаються на бажаній тестовій моделі GPT-5.

### Вікна legacy-сумісності

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може видаляти відсутні `pnpm.patchedDependencies` з підробленого git fixture, отриманого з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smoke можуть читати legacy-розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволити міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без повторного встановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли штампа метаданих локальної збірки, які вже були випущені. Пізніші пакети мають задовольняти сучасні контракти; ті самі умови спричиняють помилку, а не попередження чи пропуск.

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

Під час debug невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи доріжок, timings фаз і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-доріжок замість повторного запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/package surfaces, змін пакетів/маніфестів bundled Plugin або core plugin/channel/gateway/Plugin SDK surfaces, які перевіряють Docker smoke jobs. Зміни лише вихідного коду bundled Plugin, лише тестові правки та правки лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений bundled-plugin Docker profile під сукупним timeout команди 240 секунд (Docker run кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і Docker/update покриття інсталятора для нічних scheduled runs, ручних dispatch, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекав за root image smokes.

Push у `main` (зокрема merge commits) не примушують повний шлях; коли логіка changed-scope вимагала б повне покриття для push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull requests і push у `main` — ні. QR і installer Docker tests зберігають власні Dockerfiles, зосереджені на install.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для доріжок installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker-доріжок розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожної доріжки за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає доріжки з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                                            |
| ------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних lane.                                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів tail-пулу, чутливого до провайдерів.                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Обмеження паралельних live lane, щоб провайдери не застосовували throttling.                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Обмеження паралельних lane встановлення npm.                                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Обмеження паралельних multi-service lane.                                                                              |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Затримка між стартами lane, щоб уникнути хвиль створення в daemon Docker; задайте `0`, щоб вимкнути затримку.          |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут на lane (120 хвилин); вибрані live/tail lane використовують жорсткіші обмеження.                   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не задано       | `1` друкує план планувальника без запуску lane.                                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | не задано       | Розділений комами точний список lane; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу lane.          |

Lane, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить ємність. Локальний агрегат виконує попередні перевірки Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних lane, зберігає тривалості lane для впорядкування від найдовших до найкоротших і типово припиняє планувати нові pooled lane після першого збою.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, які package, image kind, live image, lane і покриття облікових даних потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує lane з установленим package; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker images повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшу частину критичного шляху CI.

### Фрагменти release-path

Покриття Release Docker запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому image kind і виконував кілька lane через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегатними псевдонімами Plugin/runtime. Псевдонім lane `install-e2e` залишається агрегатним псевдонімом ручного повторного запуску для обох lane встановлювача провайдера.

OpenWebUI входить до `plugins-runtime-services`, коли повне покриття release-path його запитує, і зберігає окремий chunk `openwebui` лише для dispatches, призначених тільки для OpenWebUI. Lane оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен chunk завантажує `.artifacts/docker-tests/` з журналами lane, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних lane і командами повторного запуску для кожної lane. Input workflow `docker_lanes` запускає вибрані lane проти підготовлених images замість chunk jobs, що обмежує налагодження невдалої lane одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана lane є live Docker lane, цільовий job збирає live-test image локально для цього повторного запуску. Згенеровані для кожної lane команди повторного запуску GitHub містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених images, коли ці значення існують, тож невдала lane може повторно використати точні package і images з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker artifacts і надрукувати об’єднані/по-lane цільові команди повторного запуску
pnpm test:docker:timings <summary>   # підсумки повільних lane і критичного шляху фаз
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явно оператором. Звичайні pull requests, push до `main` і окремі ручні CI dispatches не вмикають цей suite. Він балансує тести bundled Plugin між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу та більшим heap Node, щоб batches Plugin з важкими imports не створювали додаткових CI jobs. Release-only Docker prerelease path групує цільові Docker lane невеликими групами, щоб не резервувати десятки runners для jobs тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має окремі CI lane поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і manual dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт channel був ізольований від затримки live model і звичайного startup provider Plugin. Live transport Gateway вимикає memory search, оскільки QA parity окремо покриває поведінку memory; connectivity провайдера покривають окремі suites live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI і input manual workflow залишаються `all`; manual dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу lane QA Lab перед затвердженням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невеликий report job для фінального parity comparison.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, model-pack parity або поверхню, якою володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test розглядайте це як необов’язковий сигнал і спирайтеся на scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep repository. Щоденні, manual і non-draft pull request guard runs сканують код Actions workflow плюс найризикованіші поверхні JavaScript/TypeScript за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до типових PR defaults.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron і baseline Gateway                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс runtime channel Plugin, Gateway, Plugin SDK, secrets, audit touchpoints                       |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і поверхні SSRF policy Plugin SDK                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і gates виконання tools агентом                                            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust surfaces package contract Plugin SDK      |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — weekly/manual macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишається поза daily defaults, бо macOS build домінує runtime навіть коли чистий.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries по вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді agent command/model/tool execution і reply dispatch, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel Plugin runtime, Gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, Plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є hooks для навчання/ітерації, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого Plugin каналів                                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація та черги автовідповідей, а також runtime-контракти керівного рівня ACP                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади runtime пам’яті, псевдоніми SDK пам’яті Plugin, зв’язувальний код активації runtime пам’яті та команди doctor пам’яті                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня реалізація черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor сеансів |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Вхідна диспетчеризація відповідей Plugin SDK, допоміжні засоби payload/розбиття на фрагменти/runtime для відповідей, параметри відповідей каналів, черги доставки та допоміжні засоби прив’язування сеансів/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, стандартні параметри/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap керівного UI, локальне збереження, керівні потоки Gateway і runtime-контракти керівного рівня завдань                                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти основного web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане вихідне дерево Plugin SDK на боці пакета та допоміжні засоби контрактів пакетів plugin                                                                     |

Якість залишається окремою від безпеки, щоб висновки щодо якості можна було планувати, вимірювати, вимикати або розширювати без розмивання сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід додавати назад як обмежену або шардовану подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси супроводу

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована смуга супроводу Codex для підтримання наявної документації в узгодженості з нещодавно заландженими змінами. Він не має чистого розкладу: успішний CI-запуск після push не-бота в `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики через workflow-run пропускаються, коли `main` уже пішов далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована смуга супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск після push не-бота в `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей добовий бар’єр активності. Смуга будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість прохідних тестів. Якщо базова лінія має failing tests, Codex може виправляти лише очевидні failures, а звіт повного набору після агента має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push потрапляє в репозиторій, смуга rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати таку саму безпечну позицію drop-sudo, як docs agent.

### Дублікати PR після merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR змержено і що кожен дублікат має або спільне referenced issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- зміни core production запускають typecheck core prod і core test, а також core lint/guards;
- зміни лише core test запускають тільки typecheck core test і core lint;
- зміни extension production запускають typecheck extension prod і extension test, а також extension lint;
- зміни лише extension test запускають typecheck extension test і extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові version/config/root-dependency checks;
- невідомі зміни root/config безпечно падають до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, зміни source віддають перевагу явним мапінгам, потім sibling tests і import-graph dependents. Конфігурація shared group-room delivery є одним з явних мапінгів: зміни до group visible-reply config, source reply delivery mode або системного prompt message-tool маршрутизуються через core reply tests плюс регресії доставки Discord і Slack, щоб зміна shared default впала ще до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із кореня репозиторію і для широкого proof віддавайте перевагу свіжій warmed box. Перед витрачанням повільного gate на box, яку було повторно використано, термін якої сплив або яка щойно повідомила про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли зникли обов’язкові root files на кшталт `pnpm-lock.yaml` або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цю box і прогрійте свіжу замість налагодження product test failure. Для навмисних PR із великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без post-sync output. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diffs.

Crabbox — це другий, repo-owned шлях remote-box для Linux proof, коли Blacksmith недоступний або коли бажаніша owned cloud capacity. Прогрійте box, hydrate її через project workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає provider, sync і стандартні параметри GitHub Actions hydration. Вона виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість sync maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, fetch `origin/main` і non-secret environment handoff, який пізніші команди `crabbox run --id <cbx_id>` підвантажують як source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
