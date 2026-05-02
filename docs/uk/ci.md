---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується помилкою
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти області дії, парасолькові релізні процеси та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-02T20:01:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для release candidate і широкої валідації. Лінії Android залишаються опційними через `include_android`. Покриття Plugin, призначене лише для релізів, міститься в окремому workflow [`Попередній реліз Plugin`](#plugin-prerelease) і запускається лише з [`Повної валідації релізу`](#full-release-validation) або через явний ручний dispatch.

## Огляд конвеєра

| Завдання                         | Призначення                                                                                               | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і створює CI-маніфест             | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за npm advisories                                               | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                                          | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist для невикористаних файлів               | Зміни, релевантні до Node          |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Зміни, релевантні до Node          |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol                          | Зміни, релевантні до Node          |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним агрегованим результатом перевірки                     | Зміни, релевантні до Node          |
| `checks-node-core-test`          | Shard’и тестів core Node, за винятком ліній channel, bundled, contract і extension                        | Зміни, релевантні до Node          |
| `check`                          | Sharded-еквівалент головного локального gate: production-типи, lint, guards, тестові типи і strict smoke  | Зміни, релевантні до Node          |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shard’и                | Зміни, релевантні до Node          |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke-тест startup-memory                                                     | Зміни, релевантні до Node          |
| `checks`                         | Верифікатор для тестів каналів зібраних артефактів                                                        | Зміни, релевантні до Node          |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-лінія                                                                 | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                                | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                                        | Зміни, релевантні до Python-skill  |
| `checks-windows`                 | Специфічні для Windows тести процесів/шляхів плюс регресії спільних runtime import specifier             | Зміни, релевантні до Windows       |
| `macos-node`                     | Лінія тестів TypeScript для macOS із використанням спільних зібраних артефактів                           | Зміни, релевантні до macOS         |
| `macos-swift`                    | Swift lint, збірка і тести для застосунку macOS                                                           | Зміни, релевантні до macOS         |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                             | Зміни, релевантні до Android       |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                                     | Успіх Main CI або ручний dispatch  |
| `openclaw-performance`           | Щоденні/на вимогу звіти Kova про продуктивність runtime з лініями mock-provider, deep-profile і GPT 5.4 live | Запланований і ручний dispatch  |

## Порядок швидкого завершення з помилкою

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` накладається на швидкі Linux-лінії, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Важчі платформні та runtime-лінії після цього розгортаються паралельно: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shard’ів використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні помилки shard’ів, але не стають у чергу після того, як увесь workflow уже витіснено. Автоматичний ключ concurrency CI версіонований (`CI-v7-*`), щоб zombie на боці GitHub у старій групі черги не міг безстроково блокувати новіші запуски main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає виявлення changed-scope і змушує preflight-маніфест діяти так, ніби змінено кожну scoped-ділянку.

- **Зміни CI workflow** перевіряють граф Node CI плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці платформні лінії залишаються обмеженими змінами платформного source.
- **Зміни лише маршрутизації CI, вибрані дешеві зміни fixture для core-test і вузькі зміни helper/test-routing для контрактів Plugin** використовують швидкий шлях маніфесту лише для Node: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, контракти каналів, повні core shard’и, shard’и bundled-plugin і додаткові guard-матриці, коли зміна обмежена routing або helper-поверхнями, які швидке завдання перевіряє напряму.
- **Windows Node checks** обмежені специфічними для Windows process/path wrappers, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, які виконують цю лінію; непов’язані зміни source, Plugin, install-smoke і test-only залишаються на Linux Node-лініях.

Найповільніші сімейства тестів Node розділені або збалансовані так, щоб кожне завдання залишалося малим без надмірного резервування runner’ів: контракти каналів запускаються як три зважені shard’и, малі core unit-лінії поєднані парами, auto-reply запускається як чотири збалансовані worker’и (з reply-піддеревом, розділеним на shard’и agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node-завданнями замість очікування зібраних артефактів. Широкі браузерні, QA, медіа та різні тести Plugin використовують свої окремі конфіги Vitest замість спільного plugin catch-all. Include-pattern shard’и записують timing entries з використанням назви CI shard, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити цілий конфіг від відфільтрованого shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; shard boundary guard запускає свої малі незалежні guards паралельно всередині одного завдання. Gateway watch, тести каналів і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test-лінія все одно компілює flavor з BuildConfig flags для SMS/call-log, уникаючи дубльованого debug APK packaging job під час кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production-прохід Knip лише для залежностей, закріплений на найновішій версії Knip, з вимкненим мінімальним віком релізу pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production-знахідки невикористаних файлів Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard невикористаних файлів падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий запис allowlist, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge поверхні, які Knip не може розв’язати статично.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є цільовим bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout’ить і не виконує недовірений код pull request. Workflow створює токен GitHub App з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch’ить компактні payload’и `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit у push до `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може перевіряти.

Лінія `github_activity` пересилає лише нормалізовані metadata: тип події, дію, actor, repository, номер item, URL, title, state і короткі excerpts для comments або reviews, якщо вони є. Вона навмисно уникає пересилання повного webhook body. Приймальний workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає нормалізовану подію до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність — це спостереження, а не delivery-by-default. Агент ClawSweeper отримує ціль Discord у своєму prompt і має постити в `#clawsweeper` лише тоді, коли подія є несподіваною, actionable, ризиковою або операційно корисною. Рутинні opens, edits, bot churn, duplicate webhook noise і звичайний review traffic мають давати результат `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages недовіреними даними в усьому цьому шляху. Це вхідні дані для summarization і triage, а не інструкції для workflow або agent runtime.

## Ручні dispatch’і

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android scoped lane: Linux Node shards, bundled-plugin shards, контракти каналів, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS і Control UI i18n. Окремі ручні запуски CI виконують лише Android із `include_android=true`; повна release-umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin, shard лише для релізу `agentic-plugins`, повний пакетний sweep розширень і Docker lanes передрелізу Plugin виключені з CI. Набір Docker-перевірок передрелізу запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну concurrency group, щоб повний набір release-candidate не скасовувався іншим push або PR-запуском на тому самому ref. Необов’язковий input `target_ref` дає довіреному виклику змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, sharded перевірки контрактів каналів, shards `check`, окрім lint, shards і aggregates `check-additional`, верифікатори aggregate тестів Node, перевірки документації, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші shards розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards тестів Linux Node, shards тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо CPU-чутливий, тому 8 vCPU коштували більше, ніж заощаджували); Docker builds install-smoke (час очікування в черзі 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він запускається щодня на `main` і може бути запущений вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow встановлює OCM із pinned release і Kova з pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фейковою OpenAI-compatible auth.
- `mock-deep-profile`: профілювання CPU/heap/trace для startup, gateway і hotspots agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: час boot gateway і пам’ять для default, hook і startup-випадків із 50 plugin; повторювані hello loops mock-OpenAI `channel-chat-baseline`; і CLI startup commands проти запущеного gateway. Markdown-зведення source probe міститься в `source/index.md` у report bundle, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли `CLAWGRIT_REPORTS_TOKEN` налаштовано, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts у `openclaw/clawgrit-reports` під `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Поточний branch pointer записується як `openclaw-performance/<ref>/latest-<lane>.json`.

## Повна перевірка релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає branch, tag або повний commit SHA, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для proof лише релізних plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` із release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму Telegram package lane проти опублікованого npm package.

Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для
stage matrix, точних назв workflow jobs, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запускайте його
з `release/YYYY.M.D` або `main` після створення release tag і після успішного
OpenClaw npm preflight. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх publishable plugin packages, запускає
`Plugin ClawHub Release` для того самого release SHA і лише потім запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Для pinned commit proof на branch, що швидко змінюється, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs. Helper
пушить тимчасовий branch `release-ci/<sha>-...` на target SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з target, і видаляє тимчасовий branch після
завершення run. Umbrella verifier також завершується помилкою, якщо будь-який child workflow виконувався на
іншому SHA.

`release_profile` керує широтою live/provider, що передається в release checks. Ручні
release workflows за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви
навмисно хочете широку advisory provider/media matrix.

- `minimum` зберігає найшвидші OpenAI/core release-critical lanes.
- `stable` додає стабільний provider/backend set.
- `full` запускає широку advisory provider/media matrix.

Umbrella записує ids запущених child runs, а фінальний job `Verify full validation` повторно перевіряє поточні conclusions child runs і додає таблиці slowest-job для кожного child run. Якщо child workflow перезапущено і він став green, перезапустіть лише parent verifier job, щоб оновити результат umbrella і timing summary.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього prerelease Plugin, `release-checks` для кожної дочірньої перевірки релізу або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` в umbrella. Це утримує повторний запуск невдалого релізного box обмеженим після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і до live/E2E Docker workflow релізного шляху, і до shard приймання пакета. Це зберігає байти пакета узгодженими між релізними box і уникає повторного пакування того самого кандидата в кількох дочірніх jobs.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший umbrella. Батьківський monitor скасовує будь-який дочірній workflow, який він
уже dispatch, коли батьківський workflow скасовано, тому новіша валідація main
не стоїть за застарілим двогодинним запуском release-check. Валідація release branch/tag
і цільові групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E shards

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані shards через `scripts/test-live-shard.mjs` замість одного послідовного job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles`, відфільтровані за provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені audio/video shards для media та music shards, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агрегатні назви shards `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні live media shards запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, створеному workflow `Live Media Runner Image`. Цей image попередньо встановлює `ffmpeg` і `ffprobe`; media jobs лише перевіряють binaries перед setup. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend shards використовують окремий спільний image `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного commit. Live release workflow один раз збирає й публікує цей image, а потім Docker live model, gateway із provider sharding, CLI backend, ACP bind і Codex harness shards запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker shards мають явні обмеження `timeout` на рівні script, нижчі за timeout workflow job, щоб завислий container або шлях cleanup швидко падав, а не споживав увесь бюджет release-check. Якщо ці shards незалежно перебудовують повну Docker target source, release run неправильно налаштований і марнуватиме wall clock на дубльовані image builds.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI валідує source tree, тоді як приймання пакета валідує один tarball через той самий Docker E2E harness, який користувачі проходять після встановлення або оновлення.

### Jobs

1. `resolve_package` checkout `workflow_ref`, розв’язує один кандидат пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, upload обидва як artifact `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей artifact, валідує inventory tarball, за потреби готує Docker images package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні images один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними artifacts.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не `none`, і встановлює той самий artifact `package-under-test`, коли Package Acceptance розв’язав один; standalone Telegram dispatch усе ще може встановити опублікований npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або опціональний Telegram lane завершилися невдачею.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` або точну release version OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable.
- `source=ref` пакує довірену branch, tag або повний commit SHA `package_ref`. Resolver fetch branches/tags OpenClaw, перевіряє, що вибраний commit reachable з repository branch history або release tag, встановлює deps у detached worktree і пакує його через `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опціональний, але його варто надати для externally shared artifacts.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає test. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає змогу поточному test harness валідувати старіші довірені source commits без запуску старої логіки workflow.

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks релізного шляху з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Profile `package` використовує offline покриття Plugin, щоб валідація опублікованого пакета не залежала від доступності live ClawHub. Опціональний Telegram lane повторно використовує artifact `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованого npm spec зберігається для standalone dispatches.

Для спеціальної політики тестування оновлень і Plugin, включно з локальними командами,
Docker lanes, inputs Package Acceptance, release defaults і triage збоїв,
див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance із `source=artifact`, підготовленим artifact release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає package migration, update, cleanup залежностей застарілих plugins, repair встановлення налаштованого Plugin, offline Plugin, plugin-update і proof Telegram на тому самому розв’язаному tarball пакета. Установіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму matrix проти shipped npm package замість SHA-built artifact. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; валідацію package/update product слід починати з Package Acceptance. Docker lane `published-upgrade-survivor` валідує один опублікований package baseline за run. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; failed-lane rerun commands зберігають цей baseline. Установіть `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожен stable npm release від `2026.4.23` до `latest`; `release-history` залишається доступним для ручної ширшої вибірки зі старішим pre-date anchor. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для Feishu config, збережених bootstrap/persona files, налаштованих встановлень OpenClaw Plugin, tilde log paths і stale legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання стосується exhaustive published update cleanup, а не звичайної ширини Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, тримати один lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, як-от `openclaw@2026.4.15`, або встановити `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline за допомогою baked command recipe `openclaw config set`, записує recipe steps у `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.4`, тож proof встановлення й Gateway залишається на GPT-5 test model, уникаючи GPT-4.x defaults.

### Вікна legacy compatibility

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати subcase persistence `gateway install --wrapper`, коли package не expose цей flag;
- `update-channel-switch` може prune відсутні `pnpm.patchedDependencies` із tarball-derived fake git fixture і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy locations install-record або приймати відсутню persistence marketplace install-record;
- `plugin-update` може дозволяти migration config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишались unchanged.

Опублікований package `2026.4.26` також може попереджати про локальні build metadata stamp files, які вже були shipped. Пізніші packages мають відповідати сучасним contracts; ті самі conditions fail замість warn або skip.

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

Під час налагодження невдалого запуску приймання пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його артефакти Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної валідації релізу.

## Інсталяційний smoke

Окремий workflow `Install Smoke` повторно використовує той самий скрипт області через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які зачіпають поверхні Docker/пакета, зміни пакета/маніфесту вбудованого plugin або поверхні core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише в джерельному коді вбудованого plugin, зміни лише в тестах і зміни лише в документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для видалення agents у shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки вбудованого розширення та запускає обмежений Docker-профіль bundled-plugin із сумарним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає QR package install і Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, release checks через workflow-call і pull request, які справді зачіпають поверхні installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR-образ root Dockerfile smoke для цільового SHA, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Push у `main` (зокрема merge commits) не примушують запускати повний шлях; коли логіка changed-scope вимагала б повного покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і push у `main` не запускають його. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на інсталяції.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- чистий Node/Git runner для lanes installer/update/plugin-dependency;
- функціональний образ, який інсталює той самий tarball у `/app` для lanes звичайної функціональності.

Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes із `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типове значення | Призначення                                                                                       |
| ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10              | Кількість слотів main-pool для звичайних lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Кількість слотів tail-pool для чутливих до провайдера lanes.                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9               | Обмеження одночасних live lanes, щоб провайдери не throttled.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10              | Обмеження одночасних lanes інсталяції npm.                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7               | Обмеження одночасних multi-service lanes.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Затримка між стартами lanes, щоб уникнути create storms у Docker daemon; встановіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000         | Резервний тайм-аут для lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | не встановлено  | `1` виводить план scheduler без запуску lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`           | не встановлено  | Розділений комами точний список lanes; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний ліміт, усе ще може стартувати з порожнього pool, а потім працює самостійно, доки не звільнить capacity. Локальний aggregate виконує preflight Docker, видаляє застарілі OpenClaw E2E containers, виводить статус active-lane, зберігає таймінги lanes для впорядкування longest-first і за замовчуванням припиняє планувати нові pooled lanes після першої помилки.

### Повторно використовуваний workflow live/E2E

Повторно використовуваний workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає та публікує package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Pull Docker images повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторився, а не спожив більшість критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний йому тип образу й виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і `plugins-runtime-install-a` через `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate aliases plugin/runtime. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI входить до `plugins-runtime-services`, коли повне покриття release-path запитує його, і зберігає окремий chunk `openwebui` лише для dispatches, що стосуються тільки OpenWebUI. Lanes оновлення bundled-channel повторюються один раз у разі transient npm network failures.

Кожен chunk вивантажує `.artifacts/docker-tests/` з журналами lanes, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану scheduler, таблицями slow-lane і командами повторного запуску для кожної lane. Input workflow `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що тримає налагодження failed-lane в межах одного цільового Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана lane є live Docker lane, цільове завдання локально збирає live-test image для цього rerun. Згенеровані GitHub-команди rerun для кожної lane містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, тож невдала lane може повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований workflow live/E2E щодня запускає повний release-path Docker suite.

## Попередній випуск Plugin

`Plugin Prerelease` — дорожче покриття product/package, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push у `main` і самостійні ручні CI dispatches тримають цей suite вимкненим. Він балансує тести bundled plugin між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для завдань тривалістю одну-три хвилини.

## QA Lab

QA Lab має окремі CI lanes поза основним smart-scoped workflow. Agentic parity вкладена в широкі QA та release harnesses, а не є окремим PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із широким validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручним dispatch; він розгортає mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують environment `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes із deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного provider-plugin startup. Live transport gateway вимикає memory search, бо QA parity окремо покриває memory behavior; provider connectivity покривається окремими suites live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI і ручний workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед approval релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невелике report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов’язковим status.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повною перевіркою репозиторію. Щоденні, ручні та захисні запуски для pull request без статусу draft сканують код Actions workflow, а також JavaScript/TypeScript-поверхні з найвищим ризиком за допомогою високодостовірних запитів безпеки, відфільтрованих до високого/критичного `security-severity`.

Захист pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і виконує ту саму високодостовірну матрицю безпеки, що й запланований робочий процес. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron і базова лінія Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу плюс runtime канального plugin, Gateway, Plugin SDK, secrets, точки дотику аудиту            |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні core SSRF, розбору IP, мережевого захисту, web-fetch і політики SSRF Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Сервери MCP, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агента                          |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри встановлення Plugin, loader, manifest, registry, встановлення package-manager, source-loading і контракту пакета Plugin SDK |

### Платформоспецифічні фрагменти безпеки

- `CodeQL Android Critical Security` — запланований фрагмент безпеки Android. Вручну збирає Android-застосунок для CodeQL на найменшому Blacksmith Linux runner, прийнятому перевіркою workflow sanity. Завантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний фрагмент безпеки macOS. Вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує в `/codeql-critical-security/macos`. Тримається поза щоденними стандартними запусками, бо збірка macOS домінує за часом виконання навіть коли проходить чисто.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний фрагмент безпеки. Він запускає лише error-severity, non-security JavaScript/TypeScript-запити якості на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: PR без статусу draft запускають лише відповідні фрагменти `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і диспетчеризації reply, схемі/міграції/IO конфігурації, auth/secrets/sandbox/security, runtime основного каналу й bundled channel plugin, Gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни конфігурації CodeQL і quality workflow запускають усі дванадцять PR quality shards.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є гачками для навчання/ітерації, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки Auth, secrets, sandbox, Cron і Gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти server method                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel plugin                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація model/provider, диспетчеризація auto-reply і черги, а також runtime-контракти control plane ACP                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і tool bridges, допоміжні засоби нагляду за процесами та контракти outbound delivery                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, aliases memory Plugin SDK, glue активації memory runtime і команди memory doctor                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні частини reply queue, session delivery queues, outbound session binding/delivery helpers, поверхні diagnostic event/log bundle і контракти session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers                |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація model catalog, provider auth і discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding registries          |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальна персистентність, control flows Gateway і runtime-контракти task control-plane                                         |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation і runtime-контракти media-generation                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side source Plugin SDK і допоміжні засоби контракту пакета plugin                                                                           |

Якість тримається окремо від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і signal.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієва lane обслуговування Codex для підтримання наявної документації у відповідності з нещодавно злитими змінами. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з моменту останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієва lane обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей щоденний activity gate. Lane створює full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, що зменшують baseline count тестів, які проходять. Якщо baseline має failing tests, Codex може виправити лише очевидні збої, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається перед тим, як bot push потрапить у репозиторій, lane rebase-ить validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати ту саму drop-sudo safety posture, що й docs agent.

### Duplicate PRs After Merge

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після land. За замовчуванням він працює як dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR злитий і що кожен дублікат має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Логіка локальних changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- production-зміни core запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише в core tests запускають лише core test typecheck плюс core lint;
- production-зміни extension запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише в extension tests запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- release metadata-only version bumps запускають цільові version/config/root-dependency checks;
- невідомі root/config changes fail safe до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна shared default впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо harness-wide, що cheap mapped set не є надійним proxy.

## Перевірка Testbox

Запускайте Testbox із кореня репозиторію та надавайте перевагу свіжому прогрітому боксу для широкої перевірки. Перш ніж витрачати повільну перевірку на бокс, який було повторно використано, строк дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині боксу.

Перевірка справності швидко завершується з помилкою, коли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і прогрійте свіжий, замість того щоб налагоджувати збій тесту продукту. Для PR із навмисними масовими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску перевірки справності.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це другий, керований репозиторієм шлях віддаленого боксу для перевірки в Linux, коли Blacksmith недоступний або коли бажано використати власну хмарну потужність. Прогрійте бокс, гідратуйте його через workflow проєкту, а потім запускайте команди через Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` визначає стандартні налаштування провайдера, синхронізації та гідратації GitHub Actions. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних remotes і сховищ об’єктів maintainer, а також виключає локальні артефакти виконання/збірки, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` визначає checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища, яке пізніші команди `crabbox run --id <cbx_id>` підтягують як source.

## Пов’язане

- [Огляд установлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
