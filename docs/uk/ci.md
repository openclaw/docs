---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти області дії, парасольки релізів і локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-04T04:57:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі напрями, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають увесь граф для release candidate і широкої валідації. Android-напрями залишаються опційними через `include_android`. Покриття plugin лише для релізів живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                               | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені extensions і будує маніфест CI                        | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                                | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                             | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий aggregate для швидких security-завдань                                                       | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів                          | Node-релевантні зміни              |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built artifacts і reusable downstream artifacts                     | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux-напрями коректності, як-от bundled/plugin-contract/protocol checks                           | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                                  | Node-релевантні зміни              |
| `checks-node-core-test`          | Shards тестів Core Node, крім channel, bundled, contract і extension напрямів                             | Node-релевантні зміни              |
| `check`                          | Sharded еквівалент основного локального gate: prod types, lint, guards, test types і strict smoke         | Node-релевантні зміни              |
| `check-additional`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і gateway watch           | Node-релевантні зміни              |
| `build-smoke`                    | Smoke-тести built-CLI і startup-memory smoke                                                              | Node-релевантні зміни              |
| `checks`                         | Verifier для built-artifact channel tests                                                                 | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-напрям                                                               | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки broken links                                                          | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на Python                                                                        | Python-skill-релевантні зміни      |
| `checks-windows`                 | Windows-специфічні тести process/path плюс спільні регресії runtime import specifier                     | Windows-релевантні зміни           |
| `macos-node`                     | macOS TypeScript test lane з використанням спільних built artifacts                                       | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                                   | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                                            | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна Codex оптимізація повільних тестів після trusted activity                                         | Main CI success або manual dispatch |
| `openclaw-performance`           | Щоденні/on-demand звіти продуктивності runtime Kova з mock-provider, deep-profile і GPT 5.4 live lanes    | Scheduled і manual dispatch        |

## Порядок fail-fast

1. `preflight` вирішує, які напрями взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи на важчі завдання artifacts і platform matrix.
3. `build-artifacts` виконується паралельно зі швидкими Linux-напрямами, щоб downstream consumers могли стартувати одразу, щойно спільна збірка готова.
4. Важчі platform і runtime напрями розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший запуск для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні shard failures, але не стають у чергу після того, як увесь workflow уже витіснено. Автоматичний concurrency key CI має версію (`CI-v7-*`), тож GitHub-side zombie у старій queue group не може безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують runs, що вже виконуються.

## Область і маршрутизація

Логіка області живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Зміни CI workflow** валідовують Node CI graph плюс workflow linting, але самі по собі не примушують запускати Windows, Android або macOS native builds; ці platform lanes залишаються scoped до змін platform source.
- **CI routing-only edits, selected cheap core-test fixture edits і narrow plugin contract helper/test-routing edits** використовують fast Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task безпосередньо перевіряє.
- **Windows Node checks** scoped до Windows-специфічних process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цей lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node test розділено або збалансовано, щоб кожне завдання залишалося невеликим без надмірного резервування runners: channel contracts запускаються як три weighted shards, core unit fast/support lanes запускаються окремо, core runtime infra розділено між state і process/config shards, auto-reply запускається як balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/server configs розділено між chat/auth/model/http-plugin/runtime/startup lanes замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard list розподілено смугами на чотири matrix shards, кожен із яких паралельно запускає selected independent guards і друкує per-check timings, включно з `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane усе одно компілює flavor з SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job під час кожного Android-релевантного push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, зберігаючи при цьому intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може розв’язати статично.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — це target-side bridge від активності repository OpenClaw до ClawSweeper. Він не checkout і не виконує untrusted pull request code. Workflow створює GitHub App token з `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім надсилає компактні payloads `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири напрями:

- `clawsweeper_item` для точних issue і pull request review requests;
- `clawsweeper_comment` для явних команд ClawSweeper у issue comments;
- `clawsweeper_commit_review` для commit-level review requests на push до `main`;
- `github_activity` для загальної GitHub activity, яку агент ClawSweeper може inspect.

Lane `github_activity` пересилає лише нормалізовані metadata: event type, action, actor, repository, item number, URL, title, state і short excerpts для comments або reviews, коли вони наявні. Він навмисно не пересилає повне webhook body. Receiving workflow у `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає normalized event до OpenClaw Gateway hook для агента ClawSweeper.

Загальна активність — це спостереження, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія є несподіваною, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають приводити до `NO_REPLY`.

Сприймайте GitHub titles, comments, bodies, review text, branch names і commit messages як untrusted data на всьому цьому шляху. Це input для summarization і triage, а не інструкції для workflow або agent runtime.

## Ручні dispatches

Ручні запуски CI виконують той самий граф завдань, що й звичайний CI, але примусово вмикають кожну не-Android scoped lane: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS і Control UI i18n. Автономні ручні запуски CI виконують лише Android із `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Статичні перевірки передрелізу Plugin, релізний шард `agentic-plugins`, повний пакетний sweep розширень і Docker lanes для передрелізу Plugin виключені з CI. Набір Docker-перевірок передрелізу запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну групу concurrency, щоб повний набір release-candidate не скасовувався іншим push або PR-запуском на тому самому ref. Необов’язковий input `target_ref` дає змогу довіреному викликачеві запустити цей граф для гілки, тегу або повного SHA коміту, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ранери

| Ранер                            | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки й агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/bundled, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, верифікатори агрегатів тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі на 32 vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; forks повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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

`OpenClaw Performance` — це workflow продуктивності продукту/середовища виконання. Він щодня запускається на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай benchmark-ить workflow ref. Установіть `target_ref`, щоб benchmark-ити релізний тег або іншу гілку з поточною реалізацією workflow. Опубліковані шляхи звітів і latest pointers індексуються за протестованим ref, а кожен `index.md` записує протестовані ref/SHA, workflow ref/SHA, Kova ref, profile, режим автентифікації lane, модель, кількість повторів і фільтри сценаріїв.

Workflow встановлює OCM із pinned release і Kova з `openclaw/Kova` на pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні сценарії Kova проти runtime локальної збірки з детермінованою фальшивою OpenAI-compatible автентифікацією.
- `mock-deep-profile`: профілювання CPU/heap/trace для startup, gateway і hotspots agent-turn.
- `live-gpt54`: реальний agent turn OpenAI `openai/gpt-5.4`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає нативні для OpenClaw source probes після проходу Kova: вимірювання часу завантаження Gateway і пам’яті для випадків запуску default, hook і 50-plugin; повторювані mock-OpenAI hello-цикли `channel-chat-baseline`; і команди запуску CLI проти завантаженого Gateway. Markdown-зведення source probe міститься в `source/index.md` у bundle звіту, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також комітить `report.json`, `report.md`, bundles, `index.md` і artifacts source-probe в `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний pointer tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` із цією ціллю, запускає `Plugin Prerelease` для релізних доказів plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, Docker release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після публікації передайте `npm_telegram_package_spec`, щоб повторно запустити ту саму lane пакета Telegram проти опублікованого npm-пакета.

Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
матриці етапів, точних назв завдань workflow, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Запускайте його
з `release/YYYY.M.D` або `main` після того, як релізний тег існує, і після того,
як preflight OpenClaw npm успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
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

Для pinned commit proof на гілці, що швидко рухається, використовуйте helper замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs мають бути гілками або тегами, а не raw commit SHAs. Helper
пушить тимчасову гілку `release-ci/<sha>-...` на цільовому SHA,
запускає `Full Release Validation` з цього pinned ref, перевіряє, що кожен дочірній
workflow `headSha` відповідає цілі, і видаляє тимчасову гілку після завершення
запуску. Umbrella verifier також падає, якщо будь-який дочірній workflow виконувався на
іншому SHA.

`release_profile` керує широтою live/provider, що передається до перевірок випуску. Ручні workflows випуску за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка консультативна матриця provider/media.

- `minimum` залишає найшвидші критичні для випуску лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх прогонів, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх прогонів і додає таблиці найповільніших завдань для кожного дочірнього прогону. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат парасольки та підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайного повного дочірнього CI, `plugin-prerelease` лише для дочірнього попереднього випуску Plugin, `release-checks` для кожного дочірнього випуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це утримує повторний запуск невдалої release box обмеженим після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до Docker workflow live/E2E шляху випуску, і до shard приймання пакета. Це зберігає байти пакета узгодженими між release boxes і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати прогонів `Full Release Validation` для `ref=main` і `rerun_group=all` заміщують старішу парасольку. Батьківський монітор скасовує будь-який дочірній workflow, який він уже запустив, коли батьківський прогін скасовано, тому новіша валідація main не чекає за застарілим двогодинним прогоном release-check. Валідація release branch/tag і сфокусовані групи повторного запуску зберігають `cancel-in-progress: false`.

## Live та E2E-шарди

Дочірній release live/E2E зберігає широке native покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені audio/video media шарди та provider-filtered music шарди

Це зберігає те саме покриття файлів, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Native live media шарди виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає і публікує цей образ, після чого Docker live model, provider-sharded Gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway Docker шарди мають явні script-level обмеження `timeout`, нижчі за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався з помилкою, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, release run налаштовано неправильно, і він марнуватиме wall clock на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі задіюють після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 та профіль у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, валідує інвентар tarball, готує Docker images package-digest за потреби та запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли профіль вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він виконується, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав пакет; автономний Telegram dispatch усе ще може встановлювати опубліковану npm spec.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або необов’язкова Telegram lane завершилися з помилкою.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну release version OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable.
- `source=ref` пакує довірену гілку, tag або повний commit SHA `package_ref`. Resolver fetches OpenClaw branches/tags, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або release tag, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який виконує тест. `package_ref` — це source commit, який пакується, коли `source=ref`. Це дає поточному test harness змогу валідувати старіші довірені source commits без запуску старої workflow logic.

### Профілі suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin coverage, щоб валідація опублікованого пакета не залежала від live доступності ClawHub. Необов’язкова Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm spec збережено для автономних dispatches.

Про спеціальну політику тестування оновлень і Plugin, включно з локальними командами, Docker lanes, inputs Package Acceptance, release defaults і triage збоїв, див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Це тримає package migration, update, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update і Telegram proof на тому самому розв’язаному package tarball. Установіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти вже доставленого npm package замість SHA-built artifact. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` валідує одну published package baseline за прогін. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цю baseline. Установіть `published_upgrade_survivor_baselines=all-since-2026.4.23`, щоб розширити Full Release CI на кожен stable npm release від `2026.4.23` до `latest`; `release-history` залишається доступним для ручного ширшого sampling зі старішим pre-date anchor. Установіть `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити ті самі baselines на issue-shaped fixtures для Feishu config, preserved bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths і stale legacy plugin dependency roots. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає в exhaustive published update cleanup, а не у звичайній широті Full Release CI. Локальні aggregate runs можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Published lane налаштовує baseline із вбудованим рецептом команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений package може імпортувати browser-control override із raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо встановлено, інакше `openai/gpt-5.4`, щоб proof встановлення і Gateway залишався на GPT-5 test model, уникаючи GPT-4.x defaults.

### Вікна застарілої сумісності

Package Acceptance має обмежені вікна legacy-compatibility для вже опублікованих packages. Packages до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі private QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити subcase збереження `gateway install --wrapper`, коли package не exposes цей flag;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, похідної від tarball, і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутнє marketplace install-record persistence;
- `plugin-update` може дозволяти config metadata migration, усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований package `2026.4.26` також може попереджати про local build metadata stamp files, які вже були доставлені. Пізніші packages мають відповідати modern contracts; ті самі умови завершуються помилкою замість warn або skip.

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

Під час налагодження невдалого запуску перевірки прийнятності пакета починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної валідації релізу.

## Димова перевірка встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він розділяє димове покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що торкаються Docker/пакетних поверхонь, змін пакета/маніфесту вбудованого plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker-димові завдання. Зміни лише вихідного коду вбудованого plugin, редагування лише тестів і редагування лише документації не резервують Docker-воркерів. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI-димову перевірку видалення agents спільного робочого простору, запускає container gateway-network e2e, перевіряє аргумент збирання вбудованого розширення та запускає обмежений Docker-профіль вбудованого plugin із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** залишає QR-встановлення пакета та Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call перевірок релізу та pull request, які справді торкаються поверхонь інсталятора/пакета/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR-димовий образ кореневого Dockerfile для цільового SHA, потім запускає QR-встановлення пакета, димові перевірки кореневого Dockerfile/Gateway, димові перевірки інсталятора/оновлення та швидкий Docker E2E для вбудованого plugin як окремі завдання, щоб робота інсталятора не чекала за димовими перевірками кореневого образу.

Пуші в `main` (включно з merge commit) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття на push, workflow зберігає швидку Docker-димову перевірку й залишає повну димову перевірку встановлення для нічної або релізної валідації.

Повільна Bun global install image-provider димова перевірка окремо керується `run_bun_global_install_smoke`. Вона запускається за нічним розкладом і з workflow перевірок релізу, а ручні dispatch `Install Smoke` можуть увімкнути її, але pull request і пуші в `main` - ні. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий runner Node/Git для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника - у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типово  | Призначення                                                                                   |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10      | Кількість слотів main-pool для звичайних ліній.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10     | Кількість слотів tail-pool, чутливих до провайдера.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9       | Ліміт одночасних live-ліній, щоб провайдери не застосовували throttling.                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10      | Ліміт одночасних ліній npm install.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7       | Ліміт одночасних multi-service ліній.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000   | Затримка між стартами ліній, щоб уникнути штормів створення Docker daemon; встановіть `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000 | Резервний тайм-аут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset   | `1` друкує план планувальника без запуску ліній.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальні сукупні preflight-перевірки перевіряють Docker, видаляють застарілі OpenClaw E2E-контейнери, виводять статус активних ліній, зберігають таймінги ліній для впорядкування longest-first і за замовчуванням припиняють планування нових pooled ліній після першого збою.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує artifact пакета з поточного запуску, або завантажує artifact пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й публікує package-digest-tagged bare/functional GHCR Docker E2E образи через Docker layer cache Blacksmith, коли план потребує ліній із установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Pull Docker-образів повторюється з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий потік registry/cache швидко повторився, а не спожив більшість критичного шляху CI.

### Фрагменти релізного шляху

Релізне Docker-покриття запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk підтягував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються сукупними псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається сукупним ручним псевдонімом повторного запуску для обох provider installer ліній.

OpenWebUI включається в `plugins-runtime-services`, коли повне release-path покриття запитує його, і зберігає окремий chunk `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Лінії оновлення вбудованих каналів повторюють спробу один раз для тимчасових npm мережевих збоїв.

Кожен chunk завантажує `.artifacts/docker-tests/` із журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість chunk jobs, що обмежує налагодження невдалих ліній одним цільовим Docker-завданням і готує, завантажує або повторно використовує artifact пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання збирає live-test образ локально для цього повторного запуску. Згенеровані для кожної лінії команди GitHub повторного запуску включають `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний release-path Docker suite.

## Plugin Prerelease

`Plugin Prerelease` - дорожче продуктове/пакетне покриття, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і автономні ручні CI dispatch не запускають цей suite. Він балансує тести вбудованих plugin між вісьмома воркерами розширень; ці extension shard jobs запускають до двох груп конфігурації plugin одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy пакети plugin не створювали додаткових CI jobs. Релізний Docker prerelease path групує цільові Docker-лінії малими групами, щоб не резервувати десятки runner для завдань тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI-лінії поза основним smart-scoped workflow. Agentic parity вкладена в широкі QA та релізні harness, а не є автономним PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має йти разом із широким запуском валідації.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну через dispatch; він розгортає mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Перевірки релізу запускають Matrix і Telegram live transport lanes із детермінованим mock provider і mock-qualified моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від live model latency і звичайного запуску provider-plugin. Live transport gateway вимикає memory search, тому що QA parity окремо покриває поведінку пам'яті; підключення provider покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI підтримує це. Типове значення CLI і manual workflow input залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix-покриття на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у мале report job для фінального порівняння parity.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб трактувати parity як обов'язковий статус.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким security-сканером першого проходу, а не повним sweep усього репозиторію. Щоденні, ручні та guard-запуски для нечернеткових pull request сканують код робочих процесів Actions, а також поверхні JavaScript/TypeScript із найвищим ризиком, використовуючи високодостовірні security-запити, відфільтровані до високого/критичного `security-severity`.

Guard для pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму високодостовірну security-матрицю, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Security категорії

| Категорія                                        | Поверхня                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базова поверхня gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс runtime channel plugin, gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні core SSRF, парсингу IP, network guard, web-fetch і SSRF-політик Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helpers виконання процесів, outbound delivery і agent tool-execution gates                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для Plugin install, loader, manifest, registry, package-manager install, source-loading і package contract Plugin SDK |

### Платформозалежні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує в `/codeql-critical-security/macos`. Тримається поза щоденними стандартними запускми, бо macOS build домінує runtime навіть коли чистий.

### Critical Quality категорії

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality-запити на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: нечернеткові PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання agent command/model/tool і reply dispatch, коді config schema/migration/IO, коді auth/secrets/sandbox/security, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни в CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код boundary для Auth, secrets, sandbox, cron і gateway security                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Контракти config schema, migration, normalization і IO                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми Gateway protocol і контракти server method                                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації core channel і bundled channel plugin                                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Контракти command execution, model/provider dispatch, auto-reply dispatch і queues, а також ACP control-plane runtime                                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers і tool bridges, helpers нагляду за процесами та контракти outbound delivery                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue і memory doctor commands                                             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, helpers outbound session binding/delivery, поверхні diagnostic event/log bundle і контракти session doctor CLI          |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, helpers reply payload/chunking/runtime, channel reply options, delivery queues і helpers session/thread binding                       |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth і discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding registries                |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flows і контракти task control-plane runtime                                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти core web fetch/search, media IO, media understanding, image-generation і media-generation runtime                                                             |
| `/codeql-critical-quality/plugin-boundary`              | Контракти loader, registry, public-surface і entrypoint Plugin SDK                                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований package-side вихідний код Plugin SDK і helpers plugin package contract                                                                                    |

Quality залишається окремо від security, щоб quality-знахідки можна було планувати, вимірювати, вимикати або розширювати без затемнення security-сигналу. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільні runtime і signal.

## Maintenance workflows

### Docs Agent

Workflow `Docs Agent` — це event-driven Codex maintenance lane для підтримання наявних docs узгодженими з нещодавно landed changes. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, а manual dispatch може запустити його напряму. Workflow-run invocations пропускаються, коли `main` уже зрушив далі або коли інший non-skipped Docs Agent run був створений за останню годину. Коли він запускається, він переглядає commit range від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один hourly run може охопити всі main changes, накопичені з останнього docs pass.

### Test Performance Agent

Workflow `Test Performance Agent` — це event-driven Codex maintenance lane для повільних tests. Він не має чистого розкладу: успішний non-bot push CI run на `main` може його запустити, але він пропускається, якщо інший workflow-run invocation уже запускався або виконується цього UTC-дня. Manual dispatch обходить цей daily activity gate. Lane будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving test performance fixes замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, що зменшують passing baseline test count. Якщо baseline має failing tests, Codex може виправити лише obvious failures, а after-agent full-suite report має пройти, перш ніж щось буде committed. Коли `main` просувається до того, як bot push landed, lane rebases validated patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Він використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати таку саму drop-sudo safety posture, як docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це manual maintainer workflow для post-land duplicate cleanup. За замовчуванням він dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR merged і що кожен duplicate має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates і changed routing

Local changed-lane logic міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий CI platform scope:

- core production changes запускають core prod і core test typecheck плюс core lint/guards;
- core test-only changes запускають лише core test typecheck плюс core lint;
- extension production changes запускають extension prod і extension test typecheck плюс extension lint;
- extension test-only changes запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються explicit test work);
- release metadata-only version bumps запускають targeted version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Local changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі test edits запускають самі себе, source edits віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із explicit mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб shared default change впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна настільки harness-wide, що cheap mapped set не є надійним proxy.

## Testbox validation

Запускайте Testbox із кореня репозиторію та віддавайте перевагу свіжій прогрітій машині для широкого підтвердження. Перш ніж витрачати повільну перевірку на машині, яку повторно використали, термін дії якої минув або яка щойно повідомила про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині цієї машини.

Перевірка sanity швидко завершується з помилкою, коли зникли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цю машину й прогрійте нову, замість того щоб налагоджувати збій продуктового тесту. Для PR з навмисним великим видаленням задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього запуску sanity.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff-ів.

Crabbox — це обгортка для віддалених машин, що належить репозиторію, для maintainer-підтверджень у Linux. Використовуйте її, коли перевірка занадто широка для локального циклу редагування, коли важлива відповідність CI, або коли підтвердження потребує секретів, Docker, пакетних lane-ів, повторно використовуваних машин чи віддалених логів. Звичайний бекенд OpenClaw — `blacksmith-testbox`; власні потужності AWS/Hetzner є fallback для збоїв Blacksmith, проблем із квотами або явного тестування на власних потужностях.

Перед першим запуском перевірте обгортку з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обгортка репозиторію відхиляє застарілий бінарний файл Crabbox, який не рекламує `blacksmith-testbox`. Передавайте provider явно, навіть якщо `.crabbox.yaml` має типові значення owned-cloud.

Перевірка змін:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Сфокусований повторний запуск тесту:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Повний набір:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Прочитайте фінальний JSON-підсумок. Корисні поля: `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Одноразові запуски Crabbox на базі Blacksmith мають автоматично зупиняти Testbox; якщо запуск перервано або очищення незрозуміле, перегляньте активні машини й зупиніть лише ті, які створили ви:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Використовуйте повторне використання лише тоді, коли вам навмисно потрібно кілька команд на тій самій гідратованій машині:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо зламаним шаром є Crabbox, але сам Blacksmith працює, використайте прямий Blacksmith як вузький fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Переходьте до власних потужностей Crabbox лише тоді, коли Blacksmith недоступний, обмежений квотами, не має потрібного середовища або власні потужності є явною метою:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` визначає типові значення provider, синхронізації та гідратації GitHub Actions для owned-cloud lane-ів. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені Git-метадані замість синхронізації локальних maintainer-remotes і сховищ об’єктів, а також виключає локальні runtime/build-артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` відповідає за checkout, налаштування Node/pnpm, отримання `origin/main` і передавання несекретного середовища для owned-cloud команд `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
