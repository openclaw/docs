---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущено
    - Ви налагоджуєте перевірку GitHub Actions, яка завершується помилкою
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти за областю дії, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T21:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для реліз-кандидатів і широкої валідації. Лінії Android залишаються опціональними через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Plugin передреліз`](#plugin-prerelease) і запускається лише з [`Повна валідація релізу`](#full-release-validation) або через явний ручний запуск.

## Огляд конвеєра

| Завдання                        | Призначення                                                                                                         | Коли запускається                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і формує CI-маніфест                         | Завжди для нечернеткових push і PR        |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                          | Завжди для нечернеткових push і PR        |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                                          | Завжди для нечернеткових push і PR        |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                                                    | Завжди для нечернеткових push і PR        |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс захист allowlist невикористаних файлів                             | Зміни, релевантні для Node                |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і багаторазові downstream-артефакти                       | Зміни, релевантні для Node                |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol перевірки                                    | Зміни, релевантні для Node                |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                              | Зміни, релевантні для Node                |
| `checks-node-core-test`          | Шарди тестів Core Node, без channel, bundled, contract і extension ліній                                             | Зміни, релевантні для Node                |
| `check`                          | Шардований еквівалент основного локального gate: prod-типи, lint, guards, test-типи та суворий smoke                | Зміни, релевантні для Node                |
| `check-additional`               | Архітектура, межі, drift знімків prompt, guards поверхні extension, межі package і шарди gateway-watch              | Зміни, релевантні для Node                |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke запускової пам’яті                                                                | Зміни, релевантні для Node                |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                                                  | Зміни, релевантні для Node                |
| `checks-node-compat-node22`      | Збірка сумісності Node 22 і smoke-лінія                                                                             | Ручний запуск CI для релізів              |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                          | Змінилася документація                    |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                                             | Зміни, релевантні для Python Skills       |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс регресії shared runtime import specifier                          | Зміни, релевантні для Windows             |
| `macos-node`                     | Лінія тестів TypeScript для macOS із використанням спільних зібраних артефактів                                     | Зміни, релевантні для macOS               |
| `macos-swift`                    | Swift lint, збірка і тести для macOS app                                                                            | Зміни, релевантні для macOS               |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                                       | Зміни, релевантні для Android             |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                                | Успіх Main CI або ручний запуск           |
| `openclaw-performance`           | Щоденні/на вимогу звіти продуктивності runtime Kova з mock-provider, deep-profile і GPT 5.4 live-лініями            | Запланований і ручний запуск              |

## Порядок швидкого завершення при помилці

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shard використовують `!cancelled() && always()`, тому вони й далі повідомляють про звичайні помилки shard, але не стають у чергу після того, як весь workflow уже було замінено. Автоматичний ключ конкурентності CI версіонований (`CI-v7-*`), тому GitHub-side zombie у старій групі черги не може безстроково блокувати новіші main-запуски. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Ручний запуск пропускає виявлення changed-scope і змушує preflight-маніфест поводитися так, ніби змінилася кожна scoped-область.

- **Зміни CI workflow** перевіряють граф Node CI плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform лінії залишаються обмеженими змінами platform source.
- **Зміни лише маршрутизації CI, вибрані дешеві зміни fixture core-test і вузькі зміни helper/test-routing контрактів Plugin** використовують швидкий шлях Node-only маніфесту: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper поверхнями, які швидке завдання безпосередньо перевіряє.
- **Windows Node checks** обмежені специфічними для Windows process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни source, Plugin, install-smoke і лише test залишаються на Linux Node лініях.

Найповільніші родини Node tests розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runner: channel contracts виконуються як три зважені shard, малі core unit лінії об’єднуються парами, auto-reply запускається як чотири збалансовані workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування на built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із використанням назви CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards одночасно всередині одного job, включно з `pnpm prompt:snapshots:check`, щоб drift happy-path prompt Codex був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard виконуються одночасно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test лінія все одно компілює flavor з BuildConfig flags для SMS/call-log, уникаючи дубльованого завдання пакування debug APK для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, прив’язаний до найновішої версії Knip, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production findings Knip щодо невикористаних файлів із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist, водночас зберігаючи навмисні dynamic Plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Переспрямування активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side мостом з активності репозиторію OpenClaw у ClawSweeper. Він не checkout і не виконує недовірений код pull request. Workflow створює token GitHub App із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає compact `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для commit-level review requests на push у `main`;
- `github_activity` для загальної активності GitHub, яку agent ClawSweeper може перевіряти.

Лінія `github_activity` переспрямовує лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони є. Вона навмисно уникає переспрямування повного webhook body. Receiving workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує нормалізовану подію в OpenClaw Gateway hook для agent ClawSweeper.

Загальна активність — це спостереження, а не delivery-by-default. Agent ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише коли подія несподівана, actionable, ризикована або операційно корисна. Рутинні opens, edits, bot churn, duplicate webhook noise і нормальний review traffic мають призводити до `NO_REPLY`.

Вважайте titles, comments, bodies, review text, branch names і commit messages GitHub недовіреними даними в усьому цьому шляху. Це вхідні дані для summarization і triage, а не інструкції для workflow або agent runtime.

## Ручні запуски

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android із `include_android=true`; повна release-парасоля вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease для Plugin, release-only shard `agentic-plugins`, повний batch sweep для extension і Docker lanes для prerelease Plugin виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, тому повний suite release-candidate не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному виклику змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі protocol/contract/bundled checks, sharded channel contract checks, shards `check`, окрім lint, shards і aggregates `check-additional`, Node test aggregate verifiers, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші extension shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shards, bundled Plugin test shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо CPU-sensitive, щоб 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks fallback до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Продуктивність OpenClaw

`OpenClaw Performance` — це workflow продуктивності product/runtime. Він запускається щодня на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із pinned release і Kova з pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з deterministic fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для startup, Gateway і hotspots agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає source probes, нативні для OpenClaw, після проходу Kova: gateway boot timing і memory у default, hook і 50-plugin startup cases; repeated mock-OpenAI `channel-chat-baseline` hello loops; і CLI startup commands проти booted Gateway. Markdown summary source probe міститься в `source/index.md` у report bundle, а raw JSON розміщений поруч.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts в `openclaw/clawgrit-reports` під `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний branch pointer записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна перевірка release

`Full Release Validation` — це ручний umbrella workflow для "запустити все перед release". Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` з цим target, запускає `Plugin Prerelease` для release-only plugin/package/static/Docker proof і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Із `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` із release checks. Після publishing передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повна перевірка release](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow jobs, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запускайте його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того,
як OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable Plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для proof pinned commit на branch, що швидко змінюється, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs. Helper
пушить тимчасовий branch `release-ci/<sha>-...` на target SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з target, і видаляє тимчасовий branch, коли run
завершується. Umbrella verifier також завершується помилкою, якщо будь-який child workflow запускався на
іншому SHA.

`release_profile` керує широтою live/provider, що передається до release checks. Ручні
release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку advisory provider/media matrix.

- `minimum` зберігає найшвидші OpenAI/core release-critical lanes.
- `stable` додає stable provider/backend set.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує ids запущених child runs, а фінальне завдання `Verify full validation` повторно перевіряє поточні conclusions child runs і додає slowest-job tables для кожного child run. Якщо child workflow перезапускається й стає зеленим, перезапустіть лише parent verifier job, щоб оновити umbrella result і timing summary.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного дочірнього завдання повного CI, `plugin-prerelease` лише для дочірнього завдання передрелізу Plugin, `release-checks` для кожного дочірнього релізного завдання або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на парасольковому запуску. Це утримує повторний запуск невдалого релізного середовища в обмежених межах після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і workflow Docker для релізного шляху live/E2E, і шарду приймання пакета. Це зберігає байти пакета узгодженими між релізними середовищами та уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий запуск. Батьківський монітор скасовує будь-який дочірній workflow, який
уже було ним запущено, коли батьківський запуск скасовано, тому новіша валідація main
не чекає за застарілим двогодинним запуском release-check. Валідація релізної гілки/тегу
та сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній релізний live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- відфільтровані за провайдерами завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені шарди аудіо/відео медіа та відфільтровані за провайдерами музичні шарди

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live-провайдерів. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live-шарди медіа запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіа-завдання лише перевіряють ці бінарні файли перед налаштуванням. Тримайте live-набори з Docker-підтримкою на звичайних раннерах Blacksmith — контейнерні завдання не підходять для запуску вкладених Docker-тестів.

Live-шарди моделей/бекендів із Docker-підтримкою використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для вибраного коміту. Релізний live workflow збирає й публікує цей образ один раз, після чого Docker live-шарди моделі, відшардованого за провайдерами Gateway, CLI-бекенду, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скрипта нижче за таймаут завдання workflow, щоб завислий контейнер або шлях очищення завершувався помилкою швидко, а не витрачав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну Docker-ціль джерел, релізний запуск налаштований неправильно й марнуватиме настінний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує дерево джерел, тоді як приймання пакета валідує один tarball через той самий Docker E2E harness, який користувачі виконують після встановлення або оновлення.

### Завдання

1. `resolve_package` отримує `workflow_ref`, розв’язує один кандидат пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, валідує інвентар tarball, за потреби готує Docker-образи з digest пакета та запускає вибрані Docker-доріжки проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгортає ці доріжки як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язало його; автономний dispatch Telegram усе ще може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо розв’язання пакета, Docker-приймання або необов’язкова доріжка Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` або точну релізну версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих передрелізних/стабільних версій.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або релізного тегу, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це коміт джерел, який пакується, коли `source=ref`. Це дає поточному тестовому harness змогу валідувати старіші довірені коміти джерел без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, щоб валідація опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова доріжка Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для автономних dispatch-запусків.

Для спеціальної політики тестування оновлень і Plugin, зокрема локальних команд,
Docker-доріжок, вхідних параметрів Package Acceptance, релізних значень за замовчуванням і тріажу збоїв,
див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance із `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це зберігає міграцію пакета, оновлення, очищення застарілих залежностей Plugin, відновлення встановлення налаштованого Plugin, офлайн Plugin, plugin-update і Telegram-доказ на тому самому розв’язаному tarball пакета. Встановіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти відвантаженого npm-пакета замість артефакта, зібраного за SHA. Cross-OS release checks усе ще покривають специфічні для ОС onboarding, інсталятор і поведінку платформи; продуктову валідацію пакета/оновлення слід починати з Package Acceptance. Docker-доріжка `published-upgrade-survivor` валідує одну базову лінію опублікованого пакета за запуск. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає резервну опубліковану базову лінію, за замовчуванням `openclaw@latest`; команди повторного запуску невдалих доріжок зберігають цю базову лінію. Встановіть `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожен стабільний npm-реліз від `2026.4.23` до `latest`; `release-history` залишається доступним для ширшого ручного вибіркового тестування зі старішою початковою датою. Встановіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі базові лінії на fixture-сценарії у формі issues для конфігурації Feishu, збережених bootstrap/persona-файлів, встановлень налаштованих Plugin OpenClaw, шляхів журналів із тильдою та застарілих коренів залежностей legacy Plugin. Окремий workflow `Update Migration` використовує Docker-доріжку `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованого оновлення, а не в нормальній ширині Full Release CI. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну доріжку з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована доріжка налаштовує базову лінію за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після старту Gateway. Свіжі доріжки пакета Windows і інсталятора також перевіряють, що встановлений пакет може імпортувати override browser-control із сирого абсолютного шляху Windows. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено, інакше `openai/gpt-5.4`, тому доказ встановлення й Gateway залишається на тестовій моделі GPT-5, уникаючи значень за замовчуванням GPT-4.x.

### Вікна сумісності з legacy

Package Acceptance має обмежені вікна сумісності з legacy для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` із fake git fixture, отриманої з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy-розташування записів встановлення або приймати відсутність збереження запису встановлення marketplace;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб запис встановлення та поведінка без перевстановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампа метаданих збірки, які вже були відвантажені. Пізніші пакети мають задовольняти сучасні контракти; ті самі умови призводять до помилки, а не попередження чи пропуску.

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

Під час налагодження невдалого запуску приймання пакета почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної валідації релізу.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що зачіпають поверхні Docker/пакетів, зміни пакетів/маніфестів вбудованих Plugin або поверхні core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду вбудованих Plugin, редагування лише тестів і редагування лише документації не резервують Docker-працівників. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI-smoke видалення agents для спільного робочого простору, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення та запускає обмежений Docker-профіль вбудованого Plugin із сукупним таймаутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає встановлення QR-пакета та Docker/update-покриття інсталятора для нічних запланованих запусків, ручних запусків, release-перевірок через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR-образ smoke кореневого Dockerfile для цільового SHA, потім запускає встановлення QR-пакета, smokes кореневого Dockerfile/Gateway, smokes інсталятора/update і швидкий Docker E2E для вбудованого Plugin як окремі завдання, щоб робота інсталятора не чекала за smokes кореневого образу.

Пуші в `main` (включно з merge-комітами) не примушують повний шлях; коли логіка зміненої області вимагала б повного покриття на push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або release-валідації.

Повільний Bun global install image-provider smoke окремо обмежується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release-перевірок, а ручні запуски `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` цього не роблять. QR і installer Docker-тести зберігають власні Dockerfile, сфокусовані на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm-tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для ліній звичайної функціональності.

Визначення Docker-ліній розташовані в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника - у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типово  | Призначення                                                                                   |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів хвостового пулу, чутливого до провайдерів.                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження паралельних live-ліній, щоб провайдери не застосовували throttle.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Обмеження паралельних ліній встановлення npm.                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження паралельних multi-service ліній.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути шквалів створення Docker daemon; задайте `0`, щоб її вимкнути. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші межі. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску ліній.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Точний список ліній через кому; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює самостійно, доки не звільнить місткість. Локальні сукупні preflight перевіряють Docker, видаляють застарілі OpenClaw E2E-контейнери, виводять статус активних ліній, зберігають таймінги ліній для впорядкування за принципом найдовші спершу та типово припиняють планувати нові pooled-лінії після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і підсумки. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує GHCR Docker E2E-образи bare/functional із тегом digest пакета через Docker layer cache Blacksmith, коли плану потрібні лінії з установленим пакетом; і повторно використовує надані входи `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи digest пакета замість повторної збірки. Pull Docker-образів повторюється з обмеженим 180-секундним таймаутом на спробу, щоб завислий потік registry/cache швидко повторювався замість споживання більшої частини критичного шляху CI.

### Частини release-path

Release Docker-покриття запускає менші розбиті на частини завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожна частина підтягувала лише потрібний тип образу та виконувала кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker-частини: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається сукупним ручним псевдонімом повторного запуску для обох ліній інсталятора провайдера.

OpenWebUI додається до `plugins-runtime-services`, коли цього вимагає повне release-path-покриття, і зберігає окрему частину `openwebui` лише для запусків тільки OpenWebUI. Лінії оновлення bundled-channel повторюються один раз у разі тимчасових мережевих помилок npm.

Кожна частина завантажує `.artifacts/docker-tests/` із журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість завдань частин, що обмежує налагодження невдалої лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані для кожної лінії команди повторного запуску GitHub містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір release-path.

## Plugin Prerelease

`Plugin Prerelease` - це дорожче product/package-покриття, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і самостійні ручні CI-запуски тримають цей набір вимкненим. Він балансує тести вбудованих Plugin між вісьмома працівниками розширень; ці shard-завдання розширень запускають до двох груп конфігурації Plugin одночасно з одним Vitest-працівником на групу та більшим Node heap, щоб import-heavy партії Plugin не створювали додаткових CI-завдань. Release-only Docker prerelease path групує цільові Docker-лінії невеликими групами, щоб уникнути резервування десятків runner для завдань тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI-лінії поза основним smart-scoped workflow. Agentic parity вкладена під широкі QA та release harnesses, а не є окремим PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має йти разом із широким валідаційним запуском.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним запуском; він розгортає mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release-перевірки запускають Matrix і Telegram live transport lanes із детермінованим mock-провайдером і mock-qualified моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук пам'яті, бо QA parity окремо покриває поведінку пам'яті; підключення провайдерів покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і release-гейтів, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI та ручний вхід workflow залишаються `all`; ручний запуск `matrix_profile=all` завжди шардить повне Matrix-покриття на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед approval релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane-завдання, потім завантажує обидва артефакти в невелике report-завдання для фінального parity-порівняння.

Для звичайних PR дотримуйтеся доказів scoped CI/check замість того, щоб вважати parity обов'язковим статусом.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним обходом репозиторію. Щоденні, ручні та захисні запуски для pull request не в чернетці сканують код робочих процесів Actions, а також поверхні JavaScript/TypeScript із найвищим ризиком за допомогою високонадійних security-запитів, відфільтрованих до високого/критичного рівня `security-severity`.

Захист pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму високонадійну security-матрицю, що й запланований робочий процес. Android і macOS CodeQL не входять до стандартних налаштувань PR.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базовий рівень gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основних каналів, а також runtime Plugin каналу, gateway, Plugin SDK, secrets і точки дотику audit            |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні SSRF, розбору IP, network guard, web-fetch і політики SSRF у Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, помічники виконання процесів, outbound delivery і шлюзи виконання agent tool                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, loader, manifest, registry, package-manager install, source-loading і контракту пакета Plugin SDK |

### Платформозалежні security-шарди

- `CodeQL Android Critical Security` — запланований Android security-шард. Збирає застосунок Android вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує результати під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security-шард. Збирає застосунок macOS вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує результати під `/codeql-critical-security/macos`. Тримається поза щоденними стандартними налаштуваннями, бо збірка macOS домінує за часом виконання навіть коли чиста.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний не-security шард. Він запускає лише error-severity, не-security JavaScript/TypeScript quality-запити на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: PR не в чернетці запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/model/tool агента та диспетчеризації відповідей, схемі config/migration/IO-коді, auth/secrets/sandbox/security-коді, runtime основного каналу й bundled channel plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни конфігурації CodeQL і workflow якості запускають усі дванадцять quality-шардів PR.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це hooks для навчання/ітерації, щоб запускати один quality-шард ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron і код security boundary gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Контракти схеми config, migration, normalization і IO                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми Gateway protocol і контракти server method                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу й bundled channel plugin                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація model/provider, диспетчеризація та черги auto-reply, а також runtime-контракти ACP control-plane                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers і tool bridges, помічники нагляду за процесами та контракти outbound delivery                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасади memory runtime, псевдоніми memory Plugin SDK, зв’язувальний код активації memory runtime і команди memory doctor                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки session, помічники binding/delivery для outbound session, поверхні diagnostic event/log bundle і контракти CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і помічники session/thread binding              |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація model catalog, provider auth and discovery, реєстрація provider runtime, provider defaults/catalogs і web/search/fetch/embedding registries          |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальне збереження, потоки керування gateway і runtime-контракти task control-plane                                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні runtime-контракти web fetch/search, media IO, media understanding, image-generation і media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований вихідний код Plugin SDK на боці пакета й помічники контракту пакета plugin                                                                          |

Quality залишається окремо від security, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без розмивання security-сигналу. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації узгодженою з нещодавно внесеними змінами. Він не має чистого розкладу: успішний CI-запуск non-bot push на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск non-bot push на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей daily activity gate. Лінія будує grouped performance report повного Vitest suite, дозволяє Codex робити лише невеликі fixes продуктивності тестів зі збереженням coverage замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline кількість passing tests. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед тим, як щось буде закомічено. Коли `main` просувається до того, як bot push потрапляє в репозиторій, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action могла зберігати ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після Merge

Робочий процес `Duplicate PRs After Merge` — це ручний workflow для maintainer для post-land cleanup дублікатів. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR merged і що кожен duplicate має або спільну referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і routing змін

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широка scope CI-платформи:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають тільки core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі редагування tests запускають самі себе, source edits надають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб спільна default change провалилася до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Перевірка Testbox

Запускайте Testbox з кореня репозиторію й для широкого підтвердження віддавайте перевагу свіжому прогрітому боксу. Перш ніж витрачати повільний gate на бокс, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спочатку виконайте `pnpm testbox:sanity` усередині боксу.

Sanity-перевірка швидко завершується з помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і прогрійте свіжий замість того, щоб налагоджувати збій тесту продукту. Для навмисних PR із великою кількістю видалень задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий, керований репозиторієм шлях віддаленого боксу для підтвердження в Linux, коли Blacksmith недоступний або коли краще використати власну хмарну місткість. Прогрійте бокс, гідруйте його через workflow проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає типові параметри провайдера, синхронізації та гідратації GitHub Actions. Він виключає локальний `.git`, щоб гідрований checkout Actions зберігав власні віддалені Git-метадані замість синхронізації локальних remotes і сховищ об’єктів мейнтейнера, а також виключає локальні runtime/build-артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, fetch `origin/main` і передачу несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` використовують як source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
