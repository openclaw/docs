---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань безперервної інтеграції, межі області дії, релізні парасольки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-02T18:57:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8533e12d2ea99c6c342db46452bc448099c75e4bfc78edbb4b582118567421fd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для кандидатів на реліз і широкої валідації. Лінії Android залишаються opt-in через `include_android`. Покриття Plugin лише для релізів живе в окремому workflow [`Передреліз Plugin`](#plugin-prerelease) і запускається лише з [`Повної валідації релізу`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                               | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і збирає маніфест CI               | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без встановлення залежностей щодо npm advisories                                | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                                          | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів                    | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і багаторазові downstream-артефакти             | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol перевірки                          | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                      | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Shards основних тестів Node, без ліній каналів, bundled, contract і extension                             | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke         | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards                 | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI і startup-memory smoke                                                          | Зміни, релевантні для Node         |
| `checks`                         | Verifier для тестів каналів зібраних артефактів                                                           | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-лінія                                                                 | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                | Документацію змінено               |
| `skills-python`                  | Ruff + pytest для skills на базі Python                                                                   | Зміни, релевантні для Python skills |
| `checks-windows`                 | Windows-специфічні тести process/path плюс регресії спільних runtime import specifiers                    | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія TypeScript-тестів macOS із використанням спільних зібраних артефактів                               | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для застосунку macOS                                                            | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                             | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна Codex-оптимізація повільних тестів після довіреної активності                                     | Успіх Main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/on-demand звіти продуктивності Kova runtime з mock-provider, deep-profile і GPT 5.4 live lanes    | Запланований і ручний dispatch     |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих матричних завдань для артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати одразу після готовності спільної збірки.
4. Важчі платформні та runtime-лінії розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shards використовують `!cancelled() && always()`, тому вони й далі повідомляють звичайні збої shards, але не стають у чергу після того, як весь workflow уже замінено. Автоматичний ключ concurrency CI має версію (`CI-v7-*`), тому zombie з боку GitHub у старій queue group не може безстроково блокувати новіші запуски main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає виявлення changed-scope і змушує маніфест preflight діяти так, ніби кожну scoped area було змінено.

- **Зміни CI workflow** валідують граф Node CI плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці платформні лінії залишаються прив’язаними до змін платформного source.
- **CI routing-only edits, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий шлях маніфесту лише для Node: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** прив’язані до Windows-специфічних process/path wrappers, npm/pnpm/UI runner helpers, package manager config і поверхонь CI workflow, які виконують цю лінію; непов’язані source, plugin, install-smoke і test-only зміни залишаються на Linux Node lines.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts виконуються як три weighted shards, small core unit lanes об’єднані парами, auto-reply запускається як чотири збалансовані workers (із reply subtree, розділеним на shards agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і різні plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням імені CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; shard boundary guard запускає свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job на кожному Android-релевантному push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на latest Knip version, із вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий неперевірений unused file або залишає stale allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Перенаправлення активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не виконує checkout і не запускає недовірений код pull request. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім відправляє компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit у push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може перевірити.

Лінія `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, коли вони присутні. Вона навмисно уникає пересилання повного webhook body. Приймальний workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає нормалізовану event до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність є спостереженням, а не доставкою за замовчуванням. Агент ClawSweeper отримує Discord target у своєму prompt і має писати до `#clawsweeper` лише тоді, коли event є несподіваною, actionable, risky або operationally useful. Рутинні відкриття, edits, bot churn, duplicate webhook noise і звичайний review traffic мають завершуватися `NO_REPLY`.

Скрізь на цьому шляху вважайте GitHub titles, comments, bodies, review text, branch names і commit messages недовіреними даними. Це input для summarization і triage, а не instructions для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android lane з обмеженою областю: Linux Node шарди, шарди вбудованих Plugin, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS і i18n Control UI. Окремі ручні запуски CI виконують лише Android з `include_android=true`; повна релізна парасолька вмикає Android через передавання `include_android=true`. Статичні перевірки передрелізу Plugin, релізний шард `agentic-plugins`, повний пакетний sweep розширень і Docker lanes передрелізу Plugin виключені з CI. Передрелізний набір Docker запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate перевірки релізу.

Ручні запуски використовують унікальну групу конкурентності, щоб повний набір release-candidate не скасовувався іншим push або PR запуском на тому самому ref. Необов’язковий ввід `target_ref` дає довіреному виклику змогу запустити цей граф для гілки, тегу або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих пакетів, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди та агрегати `check-additional`, верифікатори агрегатів тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker збірки install-smoke (час очікування в черзі на 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                 |
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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Продуктивність OpenClaw

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він щодня запускається на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із закріпленого релізу та Kova із закріпленого вводу `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фейковою OpenAI-сумісною автентифікацією.
- `mock-deep-profile`: профілювання CPU/heap/trace для гарячих точок запуску, Gateway і agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає source probes, рідні для OpenClaw, після проходу Kova: час завантаження Gateway і пам’ять для типових випадків startup default, hook і 50 Plugin; повторювані mock-OpenAI цикли hello `channel-chat-baseline`; і команди запуску CLI проти завантаженого Gateway. Markdown-зведення source probe міститься в `source/index.md` у report bundle, поруч із сирим JSON.

Кожна lane завантажує GitHub artifacts. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і artifacts source-probe в `openclaw/clawgrit-reports` під `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний покажчик гілки записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна перевірка релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного proof Plugin/пакетів/статики/Docker, а також запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm пакета.

Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей профілів, artifacts і
цільових дескрипторів повторного запуску.

`OpenClaw Release Publish` — це ручний мутувальний релізний workflow. Запускайте його
з `release/YYYY.M.D` або `main` після того, як релізний тег уже існує і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх публіковних Plugin-пакетів, запускає
`Plugin ClawHub Release` для того самого SHA релізу і лише після цього запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для proof закріпленого коміту на гілці, що швидко змінюється, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути гілками або тегами, а не сирими SHA комітів. Helper
пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` із цього закріпленого ref, перевіряє, що кожен дочірній
workflow `headSha` збігається з ціллю, і видаляє тимчасову гілку після завершення
запуску. Umbrella verifier також завершується помилкою, якщо будь-який дочірній workflow виконувався на
іншому SHA.

`release_profile` керує шириною live/provider, що передається в release checks. Ручні
релізні workflows типово використовують `stable`; використовуйте `full` лише тоді, коли
навмисно потрібна широка advisory матриця provider/media.

- `minimum` залишає найшвидші критичні для релізу lanes OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory матрицю provider/media.

Umbrella записує ids запущених дочірніх run, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх run і додає таблиці найповільніших завдань для кожного дочірнього run. Якщо дочірній workflow запускають повторно і він стає green, повторно запустіть лише батьківське завдання verifier, щоб оновити результат umbrella і зведення часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього завдання повного CI, `plugin-prerelease` лише для дочірнього завдання попереднього релізу Plugin, `release-checks` для кожного дочірнього завдання релізу або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` на парасольковому запуску. Це обмежує повторний запуск невдалого релізного бокса після цілеспрямованого виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і до workflow Docker для live/E2E релізного шляху, і до шарда приймання пакета. Це зберігає байти пакета узгодженими між релізними боксами й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий запуск. Батьківський монітор скасовує будь-який дочірній workflow, який
він уже запустив, коли батьківський запуск скасовано, тож новіша валідація main
не чекає за застарілим двогодинним запуском release-check. Валідація релізної гілки/тега
та цілеспрямовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live- та E2E-шарди

Дочірній release live/E2E зберігає широке покриття нативного `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені шарди медіа audio/video та музичні шарди, відфільтровані за провайдером

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live-провайдерів. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` лишаються дійсними для ручних одноразових повторних запусків.

Нативні live-медіашарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. У цьому образі попередньо встановлено `ffmpeg` і `ffprobe`; медіазавдання лише перевіряють бінарні файли перед налаштуванням. Тримайте live-набори з Docker-підтримкою на звичайних раннерах Blacksmith — контейнерні завдання є неправильним місцем для запуску вкладених Docker-тестів.

Live-шарди моделей/backend із Docker-підтримкою використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Release live workflow збирає й публікує цей образ один раз, після чого Docker live model, gateway із шардингом за провайдерами, CLI backend, ACP bind і шарди Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker-шарди мають явні обмеження `timeout` на рівні скриптів нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко падав замість того, щоб споживати весь бюджет release-check. Якщо ці шарди незалежно перебудовують повну Docker-ціль із вихідного коду, релізний запуск налаштовано неправильно, і він марнуватиме час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі застосовують після встановлення або оновлення.

### Завдання

1. `resolve_package` отримує `workflow_ref`, розв’язує один кандидат пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-доріжки проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгортає ці доріжки як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав його; автономний dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо розв’язання пакета, Docker acceptance або необов’язкова доріжка Telegram зазнали збою.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованого попереднього/стабільного релізу.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тега, встановлює залежності у від’єднаному worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто вказувати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає поточному тестовому harness змогу перевіряти старіші довірені коміти вихідного коду без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, щоб валідація опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова доріжка Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для автономних dispatch.

Спеціальну політику тестування оновлень і Plugin, зокрема локальні команди,
Docker-доріжки, вхідні дані Package Acceptance, релізні значення за замовчуванням і тріаж збоїв,
див. у [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance із `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає перевірки міграції пакета, оновлення, очищення застарілих залежностей Plugin, repair встановлення налаштованого Plugin, офлайн Plugin, plugin-update і Telegram на одному й тому самому розв’язаному tarball пакета. Задайте `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти відвантаженого npm-пакета замість артефакта, зібраного за SHA. Cross-OS release checks усе ще покривають OS-специфічні onboarding, installer і platform behavior; продуктову валідацію пакета/оновлення слід починати з Package Acceptance. Docker-доріжка `published-upgrade-survivor` перевіряє одну baseline опублікованого пакета за запуск. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback baseline опублікованого пакета, за замовчуванням `openclaw@latest`; команди повторного запуску невдалої доріжки зберігають цю baseline. Задайте `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожен стабільний npm-реліз від `2026.4.23` до `latest`; `release-history` лишається доступним для ручної ширшої вибірки зі старішим pre-date anchor. Задайте `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для конфігурації Feishu, збережених файлів bootstrap/persona, встановлень налаштованих OpenClaw Plugin, шляхів логів із тильдою та застарілих коренів залежностей legacy Plugin. Окремий workflow `Update Migration` використовує Docker-доріжку `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній ширині Full Release CI. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну доріжку з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або задавати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована доріжка налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після запуску Gateway. Свіжі доріжки Windows packaged та installer також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control із необробленого абсолютного шляху Windows. Cross-OS smoke OpenAI agent-turn за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його задано, інакше `openai/gpt-5.4`, тож перевірка встановлення й Gateway лишається на тестовій моделі GPT-5, уникаючи значень за замовчуванням GPT-4.x.

### Вікна сумісності з legacy

Package Acceptance має обмежені вікна legacy-сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` із fake git fixture, похідної від tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy-розташування install-record або приймати відсутню persistence marketplace install-record;
- `plugin-update` може дозволяти міграцію metadata конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка no-reinstall лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампів build metadata, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови призводять до помилки, а не до попередження чи пропуску.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної валідації релізу.

## Інсталяційний smoke-тест

Окремий workflow `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які зачіпають поверхні Docker/пакета, зміни пакета/маніфесту вбудованого Plugin або поверхні ядра Plugin/каналу/Gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише у вихідному коді вбудованого Plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого розширення та виконує обмежений Docker-профіль вбудованого Plugin з агрегованим тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає покриття встановлення QR-пакета та Docker/update інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call перевірок релізу та pull request, які справді зачіпають поверхні інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR smoke-образ кореневого Dockerfile для цільового SHA, а потім запускає встановлення QR-пакета, smoke-перевірки кореневого Dockerfile/Gateway, smoke-перевірки інсталятора/update і швидкий Docker E2E для вбудованого Plugin як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Push до `main` (включно з merge commits) не примушує повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний Bun global install image-provider smoke окремо контролюється через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і push до `main` не запускають його. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на інсталяції.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | За замовчуванням | Призначення                                                                                  |
| ------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-пулу, чутливого до провайдерів.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження одночасних live-ліній, щоб провайдери не throttling.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Обмеження одночасних ліній npm install.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження одночасних multi-service ліній.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути create storm у Docker daemon; встановіть `0`, щоб вимкнути затримку.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску ліній.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, все одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальні агреговані preflight перевіряють Docker, видаляють застарілі OpenClaw E2E контейнери, виводять статус активних ліній, зберігають таймінги ліній для впорядкування від найдовших і за замовчуванням припиняють планувати нові pooled-лінії після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує bare/functional GHCR Docker E2E образи, позначені digest пакета, через кеш Docker-шарів Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Docker image pulls повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторювався замість споживання більшої частини критичного шляху CI.

### Фрагменти release-path

Релізне Docker-покриття запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу та виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні Docker chunks для релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох provider installer ліній.

OpenWebUI згортається в `plugins-runtime-services`, коли це запитує повне release-path покриття, і зберігає окремий chunk `openwebui` лише для dispatch, призначених тільки для OpenWebUI. Bundled-channel update лінії повторюються один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` із журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk-завдань, що обмежує налагодження невдалої лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker lane, цільове завдання локально збирає live-test образ для цього повторного запуску. Згенеровані GitHub-команди повторного запуску для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, тому невдала лінія може повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push до `main` і standalone manual CI dispatch не запускають цей suite. Він балансує тести вбудованих Plugin між вісьмома workers розширень; ці extension shard jobs запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy пакети Plugin не створювали додаткових CI jobs. Release-only Docker prerelease path пакетно запускає цільові Docker-лінії малими групами, щоб не резервувати десятки runners для завдань на одну-три хвилини.

## QA Lab

QA Lab має окремі CI-лінії поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається на відповідних змінах PR і manual dispatch; він збирає приватний QA runtime і порівнює mock GPT-5.5 та Opus 4.6 agentic packs.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і manual dispatch; він розгортає mock parity gate, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Перевірки релізу запускають Matrix і Telegram live transport lanes із детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` та `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport Gateway вимикає memory search, тому що QA parity окремо покриває поведінку пам'яті; provider connectivity покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і release gates, додаючи `--fail-fast` лише коли checked-out CLI підтримує це. CLI default і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу QA Lab lanes перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва артефакти в невелике report job для фінального parity comparison.

Не ставте шлях приземлення PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity набору моделей або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте його як необов’язковий сигнал і натомість спирайтеся на scoped CI/check evidence.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні, ручні та guard-запуски pull request не в draft-стані сканують код Actions workflow і найризикованіші JavaScript/TypeScript surfaces із security queries високої впевненості, відфільтрованими до високої/критичної `security-severity`.

Guard для pull request лишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму security matrix високої впевненості, що й scheduled workflow. Android і macOS CodeQL не входять у стандартні PR-запуски.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базова лінія gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс channel Plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, IP parsing, network guard, web-fetch і surfaces політики SSRF у Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helpers виконання процесів, outbound delivery і gates виконання agent tool                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, package-manager install, source-loading і trust surfaces контракту пакета Plugin SDK |

### Платформо-специфічні security shards

- `CodeQL Android Critical Security` — scheduled Android security shard. Будує Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Будує macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза щоденними defaults, бо macOS build домінує runtime навіть коли чистий.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких високовартісних surfaces на меншому Blacksmith Linux runner. Його pull request guard навмисно менший за scheduled profile: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у agent command/model/tool execution і reply dispatch code, config schema/migration/IO code, auth/secrets/sandbox/security code, core channel і bundled channel Plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles — це hooks для навчання/ітерації, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron і code межі безпеки gateway                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization і IO contracts                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas і server method contracts                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core channel і bundled channel Plugin implementation contracts                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane runtime contracts                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers і tool bridges, process supervision helpers і outbound delivery contracts                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts    |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers                 |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth і discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding registries          |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flows і task control-plane runtime contracts                                                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface і Plugin SDK entrypoint contracts                                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Published package-side Plugin SDK source і helpers контракту plugin package                                                                                       |

Quality тримається окремо від security, щоб quality findings можна було планувати, вимірювати, вимикати або розширювати, не затіняючи security signal. Swift, Python і bundled-plugin CodeQL expansion слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі profiles матимуть стабільні runtime і signal.

## Maintenance workflows

### Docs Agent

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявної документації узгодженою з нещодавно landed changes. Він не має pure schedule: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запускати його напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся вперед або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може покрити всі main changes, накопичені з останнього docs pass.

### Test Performance Agent

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних tests. Він не має pure schedule: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інша workflow-run invocation уже запускалася або виконується цього UTC day. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед будь-яким commit. Коли `main` просувається вперед до того, як bot push landed, lane rebase’ить validated patch, повторно запускає `pnpm check:changed` і повторює push; conflicting stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo safety posture, що й docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land duplicate cleanup. За замовчуванням він dry-run і закриває лише явно перелічені PRs, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR merged і що кожен duplicate має або shared referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates і changed routing

Local changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий scope CI platform:

- core production changes запускають core prod і core test typecheck плюс core lint/guards;
- core test-only changes запускають лише core test typecheck плюс core lint;
- extension production changes запускають extension prod і extension test typecheck плюс extension lint;
- extension test-only changes запускають extension test typecheck плюс extension lint;
- public Plugin SDK або plugin-contract changes розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps лишаються явною test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Маршрутизація локальних тестів за змінами міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерел віддають перевагу явним зіставленням, потім суміжним тестам і залежним елементам графа імпортів. Спільна конфігурація доставки для групових кімнат є одним із явних зіставлень: зміни конфігурації видимих відповідей у групі, режиму доставки відповідей із джерела або системного промпта інструмента повідомлень проходять через основні тести відповідей, а також регресії доставки Discord і Slack, щоб зміна спільного стандартного значення падала ще до першого push у PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо широка для всього harness, що дешевий зіставлений набір не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й віддавайте перевагу свіжій прогрітій коробці для широкого підтвердження. Перш ніж витрачати повільний gate на коробку, яку було повторно використано, термін дії якої минув або яка щойно повідомила про несподівано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині коробки.

Перевірка sanity швидко завершується помилкою, коли зникли потрібні кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цю коробку й прогрійте нову замість налагодження збою тестів продукту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей запобіжник, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий віддалений шлях коробок, яким володіє репозиторій, для підтвердження в Linux, коли Blacksmith недоступний або коли бажано використовувати власну хмарну місткість. Прогрійте коробку, гідратуйте її через workflow проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` керує стандартними значеннями provider, sync і гідратації GitHub Actions. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені Git-метадані замість синхронізації maintainer-local remotes і object stores, а також виключає локальні runtime/build артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` керує checkout, налаштуванням Node/pnpm, отриманням `origin/main` і передаванням несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` підключають як source.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
