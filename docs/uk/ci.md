---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить.
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти областей, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T12:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f773c5a8221e3e458373e80b689d66e8cc4243d0df63364a4766701c2f4344a4
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження scope і розгортають повний граф для release candidates і широкої валідації. Android lanes залишаються opt-in через `include_android`. Release-only покриття Plugin міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені scopes, змінені розширення та будує CI manifest           | Завжди для non-draft pushes і PRs  |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft pushes і PRs  |
| `security-dependency-audit`      | Production-аудит lockfile без залежностей за npm advisories                                  | Завжди для non-draft pushes і PRs  |
| `security-fast`                  | Обов’язковий агрегат для швидких security jobs                                               | Завжди для non-draft pushes і PRs  |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів       | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built artifacts і reusable downstream artifacts        | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                      | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Shards тестів Core Node, крім channel, bundled, contract і extension lanes                   | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного локального gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node     |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Ручний CI dispatch для releases    |
| `check-docs`                     | Форматування docs, lint і перевірки broken links                                             | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                       | Зміни, релевантні для Python skills |
| `checks-windows`                 | Windows-specific process/path tests плюс спільні регресії runtime import specifier           | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane з використанням спільних built artifacts                          | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                            | Успіх Main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps всередині цього job, а не standalone jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не очікуючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати одразу після готовності shared build.
4. Важчі platform і runtime lanes після цього розгортаються паралельно: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє на той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже superseded. Автоматичний CI concurrency key версійований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Scope logic міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **CI workflow edits** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **CI routing-only edits, selected cheap core-test fixture edits, and narrow plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, що виконують цю lane; unrelated source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожне job залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes поєднані парами, auto-reply запускається як чотири balanced workers (із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з SMS/call-log BuildConfig flags, водночас уникаючи дублювання debug APK packaging job для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до latest Knip version, з вимкненим pnpm minimum release age для `dlx` install) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий unreviewed unused file або залишає stale allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout і не виконує untrusted pull request code. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatches компактні `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних issue і pull request review requests;
- `clawsweeper_comment` для явних команд ClawSweeper в issue comments;
- `clawsweeper_commit_review` для commit-level review requests на `main` pushes;
- `github_activity` для загальної GitHub activity, яку ClawSweeper agent може inspect.

Lane `github_activity` пересилає лише normalized metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, коли вони наявні. Він навмисно уникає пересилання повного webhook body. Receiving workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який posts normalized event до OpenClaw Gateway hook для ClawSweeper agent.

General activity — це observation, а не delivery-by-default. ClawSweeper agent отримує Discord target у своєму prompt і має post до `#clawsweeper` лише тоді, коли event є surprising, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають завершуватися `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages untrusted data на всьому цьому path. Вони є input для summarization і triage, а не instructions для workflow або agent runtime.

## Ручні dispatches

Ручні CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не було скасовано іншим push або PR run на тому самому ref. Опційний input `target_ref` дає trusted caller змогу запускати цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Виконавці

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, сегментовані перевірки контрактів каналів, сегменти `check`, крім lint, сегменти й агрегати `check-additional`, агрегатні перевірники тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує Ubuntu, розміщений у GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші сегменти розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, сегменти тестів Linux Node, сегменти тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

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

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізних доказів Plugin/пакета/статичних файлів/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і напрямків Telegram. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти артефакта `release-package-under-test` з перевірок релізу. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити той самий напрям пакета Telegram проти опублікованого пакета npm.

Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, артефактів і
дескрипторів сфокусованого повторного запуску.

`OpenClaw Release Publish` — це ручний мутаційний workflow релізу. Запускайте його
з `release/YYYY.M.D` або `main` після того, як тег релізу існує і після того, як
попередня перевірка OpenClaw npm успішно завершилася. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх придатних до публікації пакетів Plugin, запускає
`Plugin ClawHub Release` для того самого SHA релізу, і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для доказу прив’язаного коміту на гілці, що швидко змінюється, використовуйте помічник замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Посилання dispatch для workflow GitHub мають бути гілками або тегами, а не сирими SHA комітів. Помічник надсилає тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` з цього прив’язаного ref, перевіряє, що кожен дочірній
workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку після завершення
запуску. Парасольковий перевірник також завершується помилкою, якщо будь-який дочірній workflow виконувався на
іншому SHA.

`release_profile` керує широтою live/provider, що передається до перевірок релізу. Ручні
workflow релізу типово використовують `stable`; використовуйте `full` лише тоді, коли
навмисно потрібна широка консультативна матриця provider/media.

- `minimum` залишає найшвидші критичні для релізу напрями OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Парасолька записує id запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він стає зеленим, перезапустіть лише завдання перевірника батьківського workflow, щоб оновити результат парасольки та підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата в реліз, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожного дочірнього релізного завдання або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` на парасольці. Це обмежує повторний запуск невдалого релізного блока після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до release-path Docker workflow live/E2E, і до сегмента package acceptance. Це зберігає байти пакета узгодженими між релізними блоками й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
витісняють старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який він
уже запустив, коли батьківський workflow скасовано, тому новіша перевірка main
не стоїть за застарілим двогодинним запуском release-check. Перевірка гілки/тега релізу
і сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Сегменти Live та E2E

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані сегменти через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- split media audio/video shards and provider-filtered music shards

Це зберігає те саме покриття файлів і водночас спрощує повторний запуск і діагностику повільних збоїв live provider. Агрегатні назви сегментів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media сегменти запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте live-набори з Docker-підтримкою на звичайних виконавцях Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Підкріплені Docker шарди live-моделі/бекенду використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Процес live-релізу один раз збирає й публікує цей образ, після чого Docker-шарди live-моделі, розшардованого за провайдерами Gateway, CLI-бекенду, ACP-прив’язки та Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скриптів нижче за таймаут завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався помилкою, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну Docker-ціль із вихідного коду, запуск релізу налаштовано неправильно, і він марнуватиме фактичний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 та профіль у зведенні кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` за бажанням викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначив його; автономний Telegram dispatch усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker-приймання або необов’язкова Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або з релізного тегу, встановлює залежності у відокремленому worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надавати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає поточному тестовому harness змогу перевіряти старі довірені коміти вихідного коду без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти release-path Docker з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugins, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для автономних dispatch.

Політику, спеціально призначену для тестування оновлень і plugins, включно з локальними командами,
Docker lanes, входами Package Acceptance, типовими значеннями релізу та тріажем помилок,
див. у [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає докази міграції пакета, оновлення, очищення застарілих залежностей plugins, офлайн-plugins, plugin-update і Telegram на одному й тому самому визначеному tarball пакета. Cross-OS release checks і далі покривають специфічні для ОС onboarding, інсталятор і поведінку платформи; перевірку продукту для пакета/оновлення слід починати з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один baseline опублікованого пакета за запуск. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback baseline опублікованого пакета, типово `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Установіть `published_upgrade_survivor_baselines=release-history`, щоб розширити lane на дедупліковану матрицю історії: останні шість stable-релізів, `2026.4.23` і останній stable-реліз перед `2026-03-15`. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-подібні fixtures для конфігурації Feishu, збережених файлів bootstrap/persona, шляхів логів із тильдою та застарілих коренів залежностей legacy plugins. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній широті Full Release CI. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, тримати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановити `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована lane налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після запуску Gateway. Свіжі lanes для Windows packaged та installer також перевіряють, що встановлений пакет може імпортувати override browser-control з сирого абсолютного шляху Windows. OpenAI cross-OS agent-turn smoke типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його задано, інакше `openai/gpt-5.4`, тож докази встановлення й Gateway залишаються на тестовій моделі GPT-5, уникаючи типових значень GPT-4.x.

### Вікна legacy-сумісності

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок persistence для `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може видаляти відсутні `pnpm.patchedDependencies` з отриманого з tarball фіктивного git fixture і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy-розташування install-record або приймати відсутність persistence для marketplace install-record;
- `plugin-update` може дозволяти міграцію metadata конфігурації, водночас і далі вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли stamp metadata локальної збірки, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови спричиняють помилку, а не попередження чи пропуск.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lanes, timings фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes, а не повторному запуску повної release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що зачіпають Docker/package surfaces, зміни пакетів/маніфестів bundled plugins або поверхні core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді bundled plugins, правки лише тестів і правки лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin під 240-секундним сукупним таймаутом команди (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull requests, які справді зачіпають installer/package/Docker surfaces. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала за root image smokes.

Пуші в `main` (включно з merge commits) не форсують повний шлях; коли логіка changed-scope вимагала б повного покриття на push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з release checks workflow, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull requests і пуші в `main` — ні. QR і installer Docker tests зберігають власні Dockerfiles, сфокусовані на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для lanes інсталятора/оновлення/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних lanes.

Docker-визначення ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner лише виконує вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                 | Стандартне значення | Призначення                                                                                                  |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                  | Кількість слотів основного пулу для звичайних ліній.                                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                  | Кількість слотів tail-пулу, чутливого до провайдерів.                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                   | Обмеження кількості одночасних live-ліній, щоб провайдери не throttled.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10                  | Обмеження кількості одночасних ліній встановлення npm.                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                   | Обмеження кількості одночасних багатосервісних ліній.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000                | Затримка між стартами ліній, щоб уникнути сплесків створення в Docker daemon; задайте `0`, щоб вимкнути її. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000             | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail-лінії використовують жорсткіші обмеження.       |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | не встановлено      | `1` виводить план планувальника без запуску ліній.                                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | не встановлено      | Список точних ліній, розділених комами; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім виконується самостійно, доки не звільнить ємність. Локальний aggregate попередньо перевіряє Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних ліній, зберігає тривалості ліній для впорядкування від найдовших до найкоротших і стандартно припиняє планувати нові pooled-лінії після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, виду образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на вихідні дані та підсумки GitHub. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує artifact пакета з поточного запуску, або завантажує artifact пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає та публікує bare/functional GHCR Docker E2E образи з тегами package-digest через кеш Docker-шарів Blacksmith, коли план потребує ліній із установленим пакетом; і повторно використовує надані вхідні дані `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторився, а не споживав більшість критичного шляху CI.

### Фрагменти release-path

Release Docker-покриття запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker-фрагменти: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` через `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate-псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається aggregate-псевдонімом ручного повторного запуску для обох ліній інсталяторів провайдерів.

OpenWebUI включається до `plugins-runtime-services`, коли цього вимагає повне release-path покриття, і зберігає окремий фрагмент `openwebui` лише для dispatch, призначених тільки для OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових npm network failures.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з журналами ліній, тривалостями, `summary.json`, `failures.json`, тривалостями фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхідні дані workflow `docker_lanes` запускають вибрані лінії проти підготовлених образів замість chunk-завдань, що обмежує налагодження невдалих ліній одним targeted Docker-завданням і готує, завантажує або повторно використовує artifact пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, targeted-завдання локально збирає live-test образ для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і prepared image inputs, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Scheduled live/E2E workflow щодня запускає повний release-path Docker-набір.

## Plugin Prerelease

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і автономні ручні CI dispatch не вмикають цей набір. Він балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy Plugin batches не створювали додаткових CI-завдань. Release-only Docker prerelease path групує targeted Docker-лінії в малі групи, щоб не резервувати десятки runners для завдань на одну-три хвилини.

## QA Lab

QA Lab має окремі CI-лінії поза головним smart-scoped workflow.

- Workflow `Parity gate` запускається при відповідних змінах у PR і ручному dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і при ручному dispatch; він розгортає mock parity gate, live Matrix-лінію, а також live Telegram і Discord-лінії як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider та mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає memory search, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдера покривають окремі live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Стандартне значення CLI і ручний workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix-покриття на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab-лінії перед approval релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невелике report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не торкається QA runtime, model-pack parity або поверхні, якою володіє parity workflow. Для звичайних виправлень channel, config, docs або unit-test розглядайте це як додатковий сигнал і дотримуйтеся scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним sweep репозиторію. Щоденні, ручні та non-draft pull request guard runs сканують код Actions workflow плюс JavaScript/TypeScript поверхні з найвищим ризиком за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL не входять до стандартних PR-перевірок.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`        | Auth, secrets, sandbox, cron і gateway baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary` | Core channel implementation contracts плюс channel Plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                |
| `/codeql-security-high/network-ssrf-boundary`    | Core SSRF, IP parsing, network guard, web-fetch і Plugin SDK SSRF policy surfaces                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                            |
| `/codeql-security-high/plugin-trust-boundary`    | Plugin install, loader, manifest, registry, package-manager install, source-loading і Plugin SDK package contract trust surfaces |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує dependency build results із завантаженого SARIF і завантажує в `/codeql-critical-security/macos`. Тримається поза щоденними стандартними перевірками, оскільки macOS build домінує за часом виконання навіть коли він чистий.

### Категорії Critical Quality

`CodeQL Critical Quality` є відповідним non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для agent command/model/tool execution і reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel Plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, Plugin loader, Plugin SDK/package-contract або змін Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є навчальними та ітераційними хуками для запуску одного якісного шарда ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, Cron і код межі безпеки Gateway                                                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого Plugin каналу                                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація model/provider, диспетчеризація автоматичних відповідей і черги, а також runtime-контракти площини керування ACP                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, допоміжні засоби нагляду за процесами й контракти вихідної доставки                                                                          |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста памʼяті, runtime-фасади памʼяті, псевдоніми памʼяті Plugin SDK, звʼязувальний код runtime-активації памʼяті та команди doctor для памʼяті                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сеансів, допоміжні засоби привʼязування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів логів і CLI-контракти session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби привʼязування сеансу/потоку |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, стандартні значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Ініціалізація Control UI, локальна персистентність, потоки керування Gateway і runtime-контракти площини керування завданнями                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти runtime для основних web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                               |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side вихідний код Plugin SDK і допоміжні засоби контрактів пакетів Plugin                                                                                 |

Якість залишається окремою від безпеки, щоб висновки щодо якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Агент документації

Робочий процес `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації у відповідності до нещодавно внесених змін. Він не має чистого розкладу: успішний CI-запуск після push не від бота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики від workflow-run пропускаються, коли `main` уже зсунувся вперед або коли протягом останньої години було створено інший непропущений запуск Docs Agent. Під час запуску він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск після push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується в цей UTC-день. Ручний dispatch обходить цей щоденний activity gate. Лінія будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо baseline має тести, що падають, Codex може виправляти лише очевидні збої, а after-agent звіт повного набору має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push потрапить у репозиторій, лінія rebases перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму drop-sudo позицію безпеки, що й агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес maintainer для очищення дублікатів після land. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR злитий і що кожен дублікат має або спільне referenced issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація змін

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка сфера платформи CI:

- зміни core production запускають typecheck core prod і core test, а також core lint/guards;
- зміни лише core test запускають тільки typecheck core test і core lint;
- зміни extension production запускають typecheck extension prod і extension test, а також extension lint;
- зміни лише extension test запускають typecheck extension test і extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extensions, бо extensions залежать від цих core contracts (Vitest extension sweeps лишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config безпечно провалюються до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе, редагування source надають перевагу явним mappings, потім sibling tests і import-graph dependents. Спільна конфігурація delivery для group-room є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна спільного стандартного значення падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо широка для harness і дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію та надавайте перевагу свіжій прогрітій box для широкого доказу. Перед витрачанням повільного gate на box, яку повторно використали, строк дії якої минув або яка щойно повідомила про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні кореневі файли, такі як `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цю box і прогрійте свіжу замість налагодження product test failure. Для навмисних PR із великим видаленням задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад пʼять хвилин без post-sync output. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diffs.

Crabbox — це repo-owned другий шлях remote-box для доказу на Linux, коли Blacksmith недоступний або коли власна cloud capacity бажаніша. Прогрійте box, hydrate її через project workflow, потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає стандартні параметри provider, sync і GitHub Actions hydration. Він виключає локальний `.git`, щоб hydrated Actions checkout зберігав власні remote Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build artifacts, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, fetch `origin/main` і non-secret environment handoff, який пізніші команди `crabbox run --id <cbx_id>` використовують як source.

## Повʼязане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
