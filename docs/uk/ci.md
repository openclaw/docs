---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, перевірки за областю, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-05-02T15:57:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9687e386ce6beb96df10b57b43616af5366f231bd603e575ec20df386671564f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI виконується під час кожного push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі гілки, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для кандидатів на реліз і широкої валідації. Android-гілки залишаються опціональними через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається тільки з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                        | Призначення                                                                                                           | Коли виконується                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і формує CI-маніфест                          | Завжди для нечернеткових push і PR            |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                           | Завжди для нечернеткових push і PR            |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                                         | Завжди для нечернеткових push і PR            |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                                                      | Завжди для нечернеткових push і PR            |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс захист allowlist невикористаних файлів                              | Зміни, релевантні Node                        |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і багаторазові downstream-артефакти                        | Зміни, релевантні Node                        |
| `checks-fast-core`               | Швидкі Linux-гілки коректності, як-от перевірки bundled/plugin-contract/protocol                                     | Зміни, релевантні Node                        |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                                 | Зміни, релевантні Node                        |
| `checks-node-core-test`          | Шарди тестів Core Node, за винятком гілок каналів, bundled, contract і extension                                     | Зміни, релевантні Node                        |
| `check`                          | Sharded-еквівалент головного локального gate: production-типи, lint, guards, test types і strict smoke               | Зміни, релевантні Node                        |
| `check-additional`               | Шарди архітектури, boundary, extension-surface guards, package-boundary і gateway-watch                              | Зміни, релевантні Node                        |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті запуску                                                          | Зміни, релевантні Node                        |
| `checks`                         | Верифікатор тестів каналів зібраних артефактів                                                                        | Зміни, релевантні Node                        |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-гілка                                                                             | Ручний CI dispatch для релізів                |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                           | Змінено документацію                          |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                                                    | Зміни, релевантні Python-Skills               |
| `checks-windows`                 | Windows-специфічні тести процесів/шляхів плюс регресії спільних runtime import specifier                            | Зміни, релевантні Windows                     |
| `macos-node`                     | Гілка TypeScript-тестів macOS із використанням спільних зібраних артефактів                                          | Зміни, релевантні macOS                       |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                                                       | Зміни, релевантні macOS                       |
| `android`                        | Android unit tests для обох flavor плюс одна збірка debug APK                                                        | Зміни, релевантні Android                     |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                                | Успіх Main CI або ручний dispatch             |
| `openclaw-performance`           | Щоденні/за запитом Kova runtime звіти продуктивності з гілками mock-provider, deep-profile і GPT 5.4 live           | Запланований і ручний dispatch                |

## Порядок fail-fast

1. `preflight` вирішує, які гілки взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-гілками, щоб downstream-споживачі могли стартувати щойно спільна збірка готова.
4. Після цього розгортаються важчі platform і runtime гілки: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні збої шардів, але не стають у чергу після того, як увесь workflow уже був замінений. Автоматичний ключ конкурентності CI версіонований (`CI-v7-*`), тому GitHub-side zombie у старій групі черги не може безстроково блокувати новіші main-запуски. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка областей міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає виявлення changed-scope і змушує preflight-маніфест поводитися так, ніби змінилися всі scoped області.

- **Правки CI workflow** валідують Node CI-граф плюс linting workflow, але самі по собі не примушують Windows, Android або macOS native builds; ці platform-гілки залишаються обмеженими змінами platform source.
- **Правки лише маршрутизації CI, вибрані дешеві правки core-test fixture і вузькі правки helper/test-routing для plugin contract** використовують швидкий Node-only шлях маніфесту: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність із Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові матриці guard, коли зміна обмежена routing або helper surfaces, які швидке завдання напряму перевіряє.
- **Windows Node checks** обмежені Windows-специфічними wrappers процесів/шляхів, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цю гілку; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node гілках.

Найповільніші родини Node-тестів розділено або збалансовано так, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts виконуються як три зважені шарди, малі core unit lanes об’єднані парами, auto-reply виконується як чотири збалансовані workers (із reply subtree, розділеним на шарди agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із назвою CI shard, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards конкурентно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard виконуються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test гілка все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи дубльованого debug APK packaging job для кожного Android-relevant push.

Шард `check-dependencies` виконує `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на найновішій версії Knip, із вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, зберігаючи водночас intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Перенаправлення активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не check out і не виконує недовірений код pull request. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім відправляє компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири гілки:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для commit-level review requests на push до `main`;
- `github_activity` для загальної активності GitHub, яку може перевіряти агент ClawSweeper.

Гілка `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони наявні. Вона навмисно уникає пересилання повного webhook body. Приймальний workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує нормалізовану подію до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія є несподіваною, actionable, risky або operationally useful. Рутинні opens, edits, bot churn, duplicate webhook noise і normal review traffic мають завершуватися `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages недовіреними даними на всьому цьому шляху. Вони є input для summarization і triage, а не інструкціями для workflow або agent runtime.

## Ручні dispatches

Ручні запускі CI виконують той самий граф завдань, що й звичайна CI, але примусово вмикають кожну scoped lane, не пов’язану з Android: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запускі CI виконують лише Android із `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки prerelease Plugin, release-only шард `agentic-plugins`, повний batch sweep розширень і Docker lanes prerelease Plugin виключено з CI. Набір Docker prerelease запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запускі використовують унікальну concurrency group, тому повний набір release-candidate не скасовується іншим push або PR run на тому самому ref. Необов’язковий вхід `target_ref` дає довіреному викликачеві змогу запускати цей граф для гілки, тега або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди та агрегати `check-additional`, перевіряльники агрегатів Node tests, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node tests, шарди bundled plugin tests, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він щодня запускається на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із закріпленого релізу та Kova із закріпленого входу `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фейковою OpenAI-compatible auth.
- `mock-deep-profile`: профілювання CPU/heap/trace для startup, Gateway і гарячих точок agent-turn.
- `live-gpt54`: реальний turn агента OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Кожна lane завантажує GitHub artifacts. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також комітить `report.json`, `report.md`, bundles і `index.md` до `openclaw/clawgrit-reports` у `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний branch pointer записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна перевірка релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для release-only proof Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повну перевірку релізу](/uk/reference/full-release-validation), щоб отримати
stage matrix, точні назви завдань workflow, відмінності профілів, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запускайте його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA, і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для proof закріпленого коміту на швидко змінюваній гілці використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути гілками або тегами, а не сирими SHA комітів. Helper пушить тимчасову гілку `release-ci/<sha>-...` на цільовий SHA, запускає `Full Release Validation` із цього закріпленого ref, перевіряє, що кожен child workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку, коли run завершується. Umbrella verifier також завершується з помилкою, якщо будь-який child workflow виконувався на іншому SHA.

`release_profile` керує шириною live/provider, що передається в release checks. Ручні release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку advisory provider/media matrix.

- `minimum` залишає найшвидші OpenAI/core release-critical lanes.
- `stable` додає stable provider/backend set.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує ids запущених child runs, а фінальне завдання `Verify full validation` повторно перевіряє поточні conclusions child runs і додає таблиці slowest-job для кожного child run. Якщо child workflow перезапущено і він став зеленим, перезапустіть лише parent verifier job, щоб оновити результат umbrella і підсумок timings.

Для відновлення `Full Release Validation` і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для реліз-кандидата, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього попереднього релізу plugin, `release-checks` для кожного дочірнього релізу або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` в umbrella. Це утримує повторний запуск невдалого релізного середовища в обмежених межах після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і workflow Docker для live/E2E релізного шляху, і shard приймання пакета. Це зберігає однакові байти пакета в усіх релізних середовищах і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже надіслав, коли батьківський workflow скасовано, тому новіша валідація main
не стоїть за застарілим двогодинним запуском release-check. Валідація гілки/тега релізу
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live і E2E shards

Дочірній live/E2E для релізу зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- завдання `native-live-src-gateway-profiles`, відфільтровані за провайдером
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені shards аудіо/відео для медіа та shards музики, відфільтровані за провайдером

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live-провайдерів. Агреговані назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються дійсними для ручних одноразових повторних запусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіа-завдання лише перевіряють двійкові файли перед налаштуванням. Залишайте live-набори з Docker-підтримкою на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Live shards моделей/backend з Docker-підтримкою використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Workflow live-релізу збирає й публікує цей образ один раз, після чого Docker live shards для моделі, Gateway за провайдерами, backend CLI, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker shards Gateway мають явні обмеження `timeout` на рівні скриптів, нижчі за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав, а не споживав увесь бюджет release-check. Якщо ці shards перебудовують повну source Docker target незалежно, релізний запуск налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево source, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі застосовують після встановлення або оновлення.

### Завдання

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє інвентар tarball, готує Docker-образи package-digest за потреби й запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав один; окремий dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо розв’язання пакета, Docker acceptance або опційна Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну релізну версію OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або релізного тега, встановлює залежності у від’єднаному worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` є опційним, але його слід надавати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старіші довірені source commits без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні chunks Docker релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття plugins, щоб валідація опублікованого пакета не залежала від live-доступності ClawHub. Опційна Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для окремих dispatches.

Для спеціальної політики тестування оновлень і plugins, зокрема локальних команд,
Docker lanes, inputs Package Acceptance, релізних defaults і triage збоїв,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це зберігає перевірку міграції пакета, оновлення, очищення застарілих залежностей plugins, відновлення встановлення налаштованих plugins, offline plugins, plugin-update і Telegram на тому самому розв’язаному package tarball. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і поведінку платформи; продуктова валідація package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один baseline опублікованого пакета за запуск. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Встановіть `published_upgrade_survivor_baselines=release-history`, щоб розширити lane на дедупліковану матрицю історії: останні шість stable releases, `2026.4.23` і останній stable release перед `2026-03-15`. Встановіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для конфігурації Feishu, збережених файлів bootstrap/persona, встановлень налаштованих plugins OpenClaw, tilde log paths і застарілих legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання стосується вичерпного очищення опублікованого оновлення, а не звичайної широти Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Published lane налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після запуску Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли він заданий, інакше `openai/gpt-5.4`, тож доказ встановлення й Gateway залишається на тестовій моделі GPT-5, уникаючи defaults GPT-4.x.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні записи QA у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` з підробленої git fixture, виведеної з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy locations install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію config metadata, водночас усе ще вимагаючи, щоб install record і поведінка no-reinstall залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампів metadata збірки, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови призводять до збою, а не до попередження чи пропуску.

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

Коли налагоджуєте невдалий запуск приймання пакета, починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної валідації релізу.

## Smoke-перевірка встановлення

Окремий робочий процес `Install Smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які зачіпають Docker/package поверхні, зміни пакетів/маніфестів bundled plugin або core plugin/channel/gateway/Plugin SDK поверхні, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді bundled plugin, правки лише тестів і правки лише документації не резервують Docker-воркери. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents у спільному робочому просторі, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений bundled-plugin Docker profile із 240-секундним сукупним таймаутом команди (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update покриття для нічних запланованих запусків, ручних запусків, release checks через workflow-call і pull request, які справді зачіпають installer/package/Docker поверхні. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб installer-робота не чекала за root image smokes.

Пуші в `main` (включно з merge commits) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, робочий процес зберігає швидкий Docker smoke і залишає повний install smoke для нічного запуску або release validation.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з робочого процесу release checks, а ручні запуски `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` ні. QR і installer Docker tests зберігають власні Dockerfile, орієнтовані на встановлення.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для normal functionality lanes.

Визначення Docker lane розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типово  | Призначення                                                                                  |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних lanes.                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-пулу, чутливого до провайдерів.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження паралельних live lanes, щоб провайдери не throttled.                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Обмеження паралельних npm install lanes.                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження паралельних multi-service lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами lanes, щоб уникнути create storms Docker daemon; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут для кожної lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` виводить план планувальника без запуску lanes.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список lanes; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить capacity. Локальний aggregate виконує preflight Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних lanes, зберігає таймінги lanes для longest-first ordering і за замовчуванням припиняє планувати нові pooled lanes після першої помилки.

### Багаторазовий live/E2E робочий процес

Багаторазовий live/E2E робочий процес запитує `scripts/test-docker-all.mjs --plan-json`, які package, image kind, live image, lane і credential coverage потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Docker image pulls повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий потік registry/cache швидко повторився, а не спожив більшість критичного шляху CI.

### Чанки release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk тягнув лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases. Alias lane `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI входить до `plugins-runtime-services`, коли повне release-path coverage запитує його, і зберігає окремий chunk `openwebui` лише для OpenWebUI-only dispatches. Bundled-channel update lanes повторюються один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` з lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables і per-lane rerun commands. Input робочого процесу `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що обмежує налагодження failed-lane одним цільовим Docker job і готує, завантажує або повторно використовує package artifact для цього запуску; якщо вибрана lane є live Docker lane, цільове завдання локально збирає live-test image для цього rerun. Згенеровані per-lane GitHub rerun commands включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала lane могла повторно використати точний package і images з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E робочий процес щодня запускає повний release-path Docker suite.

## Передреліз Plugin

`Plugin Prerelease` — дорожче product/package coverage, тому це окремий робочий процес, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і окремі ручні CI dispatches тримають цей suite вимкненим. Він балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на group і більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для одно-трихвилинних jobs.

## QA Lab

QA Lab має dedicated CI lanes поза основним smart-scoped workflow.

- Робочий процес `Parity gate` запускається за відповідних PR-змін і ручного dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, бо QA parity окремо покриває memory behavior; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI підтримує це. CLI default і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди шардить повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невелике report job для фінального parity comparison.

Не ставте PR landing path за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, model-pack parity або поверхню, якою володіє parity workflow. Для звичайних channel, config, docs або unit-test fixes вважайте це optional signal і спирайтеся на scoped CI/check evidence.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким first-pass security scanner, а не повним repository sweep. Daily, manual і non-draft pull request guard runs сканують Actions workflow code плюс найризикованіші JavaScript/TypeScript surfaces з high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й scheduled workflow. Android і macOS CodeQL залишаються поза PR defaults.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron і базова лінія Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу, а також середовище виконання Plugin каналу, Gateway, Plugin SDK, secrets, точки аудиту       |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні політики SSRF, розбору IP, мережевого захисту, web-fetch і SSRF у Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Сервери MCP, помічники виконання процесів, вихідна доставка та шлюзи виконання інструментів агента                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, завантажувача, маніфесту, реєстру, встановлення через package-manager, завантаження джерел і контракту пакета Plugin SDK |

### Платформо-специфічні безпекові шарди

- `CodeQL Android Critical Security` — запланований безпековий шард Android. Збирає застосунок Android вручну для CodeQL на найменшому Blacksmith Linux runner, який приймає перевірка коректності workflow. Завантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний безпековий шард macOS. Збирає застосунок macOS вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує в `/codeql-critical-security/macos`. Тримається поза щоденними стандартними перевірками, бо збірка macOS домінує за часом виконання навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний небезпековий шард. Він запускає лише JavaScript/TypeScript-запити якості з рівнем серйозності error і безпекою не пов'язані, на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: для PR не в статусі draft запускаються лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для коду виконання команд/моделей/інструментів агента й dispatch відповіді, коду схеми/міграції/IO конфігурації, коду auth/secrets/sandbox/security, основного каналу та середовища виконання вбудованого Plugin каналу, протоколу Gateway/методу сервера, memory runtime/SDK glue, MCP/process/вихідної доставки, provider runtime/каталогу моделей, діагностики сесій/черг доставки, завантажувача Plugin, Plugin SDK/контракту пакета або змін у середовищі виконання відповідей Plugin SDK. Зміни конфігурації CodeQL і workflow якості запускають усі дванадцять quality-шардів PR.

Ручний запуск приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це hooks для навчання/ітерацій, щоб запускати один quality-шард ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, Cron і код безпекової межі Gateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого Plugin каналу                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, dispatch моделі/провайдера, dispatch і черги auto-reply, а також runtime-контракти control-plane ACP                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP та мости інструментів, помічники нагляду за процесами й контракти вихідної доставки                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, фасади memory runtime, псевдоніми memory Plugin SDK, glue активації memory runtime і команди memory doctor                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сесій, помічники прив'язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів логів і контракти CLI session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch вхідних відповідей Plugin SDK, payload/chunking/runtime-помічники відповідей, параметри відповідей каналів, черги доставки та помічники прив'язування сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, auth і виявлення провайдера, реєстрація provider runtime, defaults/каталоги провайдера та реєстри web/search/fetch/embedding       |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальна персистентність, control flows Gateway і runtime-контракти task control-plane                                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні runtime-контракти web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                      |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковані джерела Plugin SDK на боці пакета та помічники контракту пакета Plugin                                                                               |

Quality тримається окремо від security, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без затемнення безпекового сигналу. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Workflow супроводу

### Docs Agent

Workflow `Docs Agent` — це подієво-керований lane супроводу Codex для підтримання наявної документації узгодженою з нещодавно внесеними змінами. Він не має чистого розкладу: успішний CI-запуск push від не-бота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики через workflow-run пропускаються, коли `main` уже зсунувся або коли за останню годину вже було створено інший непропущений запуск Docs Agent. Коли він запускається, він переглядає діапазон комітів від попереднього SHA джерела непропущеного Docs Agent до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керований lane супроводу Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push від не-бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже запускався або виконується цього UTC-дня. Ручний dispatch обходить цей денний activity gate. Lane збирає згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких refactors, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість прохідних тестів. Якщо в базовій лінії є failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед тим, як щось буде закомічено. Коли `main` просувається до того, як bot push потрапить у репозиторій, lane rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб action Codex могла зберегти ту саму drop-sudo safety posture, що й docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це ручний workflow maintainer для cleanup дублікатів після landing. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR змарджений і що кожен duplicate має або спільну referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий platform scope CI:

- зміни core production запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише core tests запускають тільки typecheck core test плюс core lint;
- зміни extension production запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише extension tests запускають typecheck extension test плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерел віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Конфігурація shared group-room delivery — один з явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt маршрутизуються через core reply tests плюс delivery regressions Discord і Slack, щоб shared default change зламався до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію і віддавайте перевагу свіжому warmed box для broad proof. Перед витрачанням повільного gate на box, який був reused, expired або щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є trustworthy copy PR; зупиніть цей box і warmed fresh one замість debugging product test failure. Для навмисних PR із large-deletion встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається на етапі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий, належний репозиторію шлях віддаленого бокса для підтвердження в Linux, коли Blacksmith недоступний або коли бажано використовувати власну хмарну місткість. Прогрійте бокс, гідруйте його через workflow проєкту, а потім виконуйте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає типові параметри провайдера, синхронізації та гідрації GitHub Actions. Він виключає локальний `.git`, щоб гідрований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних для мейнтейнера remotes і сховищ об’єктів, а також виключає локальні артефакти виконання/збирання, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` використовують як джерело.

## Пов’язане

- [Огляд інсталяції](/uk/install)
- [Канали розробки](/uk/install/development-channels)
