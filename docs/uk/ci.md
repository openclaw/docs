---
read_when:
    - Потрібно зрозуміти, чому завдання CI виконалося або не виконалося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, перевірки області, релізні парасольки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-05-04T22:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88d0f7f6cd61d550ec399e8250f685929637cd28638e77aa5a5558775767cac6
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження scope і розгортають повний граф для release candidates і широкої валідації. Android lanes залишаються opt-in через `include_android`. Release-only покриття plugins живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або через явний ручний dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                                  | Коли запускається                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `preflight`                      | Виявляє docs-only зміни, змінені scopes, змінені extensions і збирає CI manifest                             | Завжди для non-draft pushes і PRs |
| `security-scm-fast`              | Виявлення private keys і аудит workflow через `zizmor`                                                       | Завжди для non-draft pushes і PRs |
| `security-dependency-audit`      | Production lockfile audit без залежностей на основі npm advisories                                           | Завжди для non-draft pushes і PRs |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                                             | Завжди для non-draft pushes і PRs |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для unused files                                   | Node-релевантні зміни             |
| `build-artifacts`                | Збірка `dist/`, Control UI, built-artifact checks і reusable downstream artifacts                            | Node-релевантні зміни             |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                                | Node-релевантні зміни             |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                                         | Node-релевантні зміни             |
| `checks-node-core-test`          | Core Node test shards, за винятком channel, bundled, contract і extension lanes                              | Node-релевантні зміни             |
| `check`                          | Sharded еквівалент main local gate: prod types, lint, guards, test types і strict smoke                      | Node-релевантні зміни             |
| `check-additional`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і gateway watch              | Node-релевантні зміни             |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                                 | Node-релевантні зміни             |
| `checks`                         | Verifier для built-artifact channel tests                                                                    | Node-релевантні зміни             |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                                     | Ручний CI dispatch для releases   |
| `check-docs`                     | Форматування docs, lint і broken-link checks                                                                 | Змінено docs                      |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                                       | Python-skill-релевантні зміни     |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions                         | Windows-релевантні зміни          |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                                           | macOS-релевантні зміни            |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                                      | macOS-релевантні зміни            |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                                | Android-релевантні зміни          |
| `test-performance-agent`         | Щоденна Codex оптимізація slow-test після trusted activity                                                   | Main CI success або manual dispatch |
| `openclaw-performance`           | Щоденні/on-demand Kova runtime performance reports із mock-provider, deep-profile і GPT 5.4 live lanes       | Scheduled і manual dispatch       |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати superseded jobs як `cancelled`, коли новіший push потрапляє до того самого PR або ref `main`. Вважайте це шумом CI, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже був superseded. Automatic CI concurrency key версіонований (`CI-v7-*`), тому GitHub-side zombie в старій queue group не може нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожну scoped area було змінено.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані так, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts виконуються як три weighted shards, core unit fast/support lanes виконуються окремо, core runtime infra розділено між state і process/config shards, auto-reply запускається як balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/server configs розділено між chat/auth/model/http-plugin/runtime/startup lanes замість очікування на built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard list розподілено по чотирьох matrix shards, кожен із яких паралельно запускає вибрані independent guards і друкує per-check timings, включно з `pnpm prompt:snapshots:check`, щоб Codex runtime happy-path prompt drift був прив’язаний до PR, який його спричинив. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, водночас уникаючи duplicate debug APK packaging job на кожному Android-релевантному push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, із вимкненим pnpm minimum release age для `dlx` install) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий unreviewed unused file або залишає stale allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Переспрямування активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` є target-side bridge з активності репозиторію OpenClaw до ClawSweeper. Він не виконує checkout і не запускає ненадійний pull request code. Workflow створює GitHub App token із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatches compact `repository_dispatch` payloads до `openclaw/clawsweeper`.

Workflow має чотири lanes:

- `clawsweeper_item` для точних issue і pull request review requests;
- `clawsweeper_comment` для явних команд ClawSweeper в issue comments;
- `clawsweeper_commit_review` для commit-level review requests на `main` pushes;
- `github_activity` для загальної GitHub activity, яку агент ClawSweeper може inspect.

Lane `github_activity` пересилає лише normalized metadata: event type, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, якщо вони є. Він навмисно уникає пересилання повного webhook body. Receiving workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який публікує normalized event до hook OpenClaw Gateway для агента ClawSweeper.

Загальна активність є observation, а не delivery-by-default. Агент ClawSweeper отримує Discord target у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли event є несподіваним, actionable, risky або operationally useful. Routine opens, edits, bot churn, duplicate webhook noise і normal review traffic мають призводити до `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages ненадійними даними на всьому цьому path. Вони є input для summarization і triage, а не інструкціями для workflow або agent runtime.

## Ручні dispatches

Ручні dispatch CI запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped lane не для Android: Linux Node shards, bundled-Plugin shards, контракти каналів, сумісність із Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS і Control UI i18n. Окремі ручні dispatch CI запускають лише Android з `include_android=true`; повна release-umbrella вмикає Android, передаючи `include_android=true`. Передвипускні статичні перевірки Plugin, release-only shard `agentic-plugins`, повний пакетний sweep розширень і передвипускні Docker lanes для Plugin виключено з CI. Передвипускний Docker suite запускається лише тоді, коли `Full Release Validation` dispatch окремого workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, тому повний suite реліз-кандидата не скасовується іншим push або PR run на тому самому ref. Необовʼязковий input `target_ref` дає змогу довіреному виклику запустити цей граф для branch, tag або повного commit SHA, використовуючи файл workflow з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі security jobs і aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки protocol/contract/bundled, sharded перевірки контрактів каналів, shards `check`, окрім lint, shards і aggregates `check-additional`, aggregate verifiers тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб Blacksmith matrix могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші shards розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                   |
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

`OpenClaw Performance` — це workflow продуктивності продукту/runtime. Він запускається щодня на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний dispatch зазвичай benchmark workflow ref. Установіть `target_ref`, щоб benchmark release tag або іншу branch із поточною реалізацією workflow. Опубліковані paths звітів і latest pointers keyed by tested ref, а кожен `index.md` фіксує tested ref/SHA, workflow ref/SHA, Kova ref, profile, lane auth mode, model, repeat count і scenario filters.

Workflow встановлює OCM із pinned release і Kova з `openclaw/Kova` на pinned input `kova_ref`, а потім запускає три lanes:

- `mock-provider`: діагностичні scenarios Kova проти local-build runtime з deterministic fake OpenAI-compatible auth.
- `mock-deep-profile`: CPU/heap/trace profiling для startup, gateway і hotspots agent-turn.
- `live-gpt54`: справжній turn агента OpenAI `openai/gpt-5.4`, пропускається, коли `OPENAI_API_KEY` недоступний.

Lane mock-provider також запускає OpenClaw-native source probes після проходу Kova: gateway boot timing і memory для default, hook і startup cases із 50 Plugin; повторювані mock-OpenAI цикли hello `channel-chat-baseline`; і CLI startup commands проти booted gateway. Markdown summary source probe розміщено в `source/index.md` у bundle звіту, поруч із raw JSON.

Кожна lane завантажує GitHub artifacts. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, workflow також commits `report.json`, `report.md`, bundles, `index.md` і source-probe artifacts у `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний pointer tested-ref записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна валідація релізу

`Full Release Validation` — це ручний umbrella workflow для «запустити все перед релізом». Він приймає branch, tag або повний commit SHA, dispatch ручний workflow `CI` із цією target, dispatch `Plugin Prerelease` для release-only proof Plugin/package/static/Docker і dispatch `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS package checks, QA Lab parity, Matrix і Telegram lanes. Stable/default runs тримають exhaustive live/E2E і Docker release-path coverage за `run_release_soak=true`; `release_profile=full` примусово вмикає це soak coverage, щоб broad advisory validation залишалася broad. З `rerun_group=all` і `release_profile=full` він також запускає `NPM Telegram Beta E2E` проти artifact `release-package-under-test` з release checks. Після publishing передайте `npm_telegram_package_spec`, щоб rerun тієї самої Telegram package lane проти published npm package.

Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для
stage matrix, точних назв jobs workflow, відмінностей profile, artifacts і
focused rerun handles.

`OpenClaw Release Publish` — це ручний mutating release workflow. Dispatch його
з `release/YYYY.M.D` або `main` після того, як release tag існує, і після того, як
OpenClaw npm preflight успішно завершився. Він перевіряє `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` для всіх publishable packages Plugin, dispatch
`Plugin ClawHub Release` для того самого release SHA, і лише потім dispatch
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

GitHub workflow dispatch refs мають бути branches або tags, а не raw commit SHAs.
Helper pushes тимчасову branch `release-ci/<sha>-...` на target SHA,
dispatch `Full Release Validation` з цього pinned ref, перевіряє, що кожен child
workflow `headSha` збігається з target, і видаляє тимчасову branch після завершення
run. Umbrella verifier також fails, якщо будь-який child workflow запустився на
іншому SHA.

`release_profile` керує широтою live/provider, що передається до перевірок випуску. Ручні робочі процеси випуску за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли ви навмисно хочете широку консультативну матрицю provider/media. `run_release_soak` керує тим, чи перевірки стабільного/типового випуску запускають вичерпний live/E2E та Docker soak для шляху випуску; `full` примусово вмикає soak.

- `minimum` залишає найшвидші критичні для випуску лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Парасольковий робочий процес записує ідентифікатори запущених дочірніх виконань, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх виконань і додає таблиці найповільніших завдань для кожного дочірнього виконання. Якщо дочірній робочий процес перезапущено і він стає зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат парасолькового робочого процесу та підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата випуску, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього передрелізу plugin, `release-checks` для кожного дочірнього випуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольковому робочому процесі. Це зберігає перезапуск невдалої коробки випуску обмеженим після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання робочого процесу, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт до cross-OS перевірок і Package Acceptance, а також до live/E2E Docker-робочого процесу шляху випуску, коли запускається soak-покриття. Це зберігає байти пакета узгодженими між коробками випуску та уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

Дублікати виконань `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий робочий процес. Батьківський монітор скасовує будь-який дочірній робочий процес, який
він уже запустив, коли батьківський скасовано, тому новіша перевірка main
не чекає за застарілим двогодинним виконанням release-check. Перевірка гілки/тегу випуску
та цільові групи перезапуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- завдання `native-live-src-gateway-profiles` з фільтрацією за provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені audio/video шарди media та шарди music з фільтрацією за provider

Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск і діагностику повільних збоїв live provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному робочим процесом `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють ці бінарні файли перед налаштуванням. Тримайте Docker-backed live набори на звичайних Blacksmith runners — контейнерні завдання є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live model/backend шарди використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає та пушить цей образ один раз, після чого Docker live model, provider-sharded gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker шарди Gateway мають явні обмеження `timeout` на рівні скриптів нижче за тайм-аут завдання робочого процесу, щоб завислий контейнер або шлях очищення швидко завершувався з помилкою, а не споживав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну source Docker target, виконання випуску налаштоване неправильно і марнуватиме реальний час на дублікати збірок образу.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання таке: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі виконують після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, посилання робочого процесу, посилання пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний робочий процес завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує package-digest Docker-образи і запускає вибрані Docker лінії проти цього пакета замість пакування checkout робочого процесу. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний робочий процес готує пакет і спільні образи один раз, а потім розгортає ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав його; окремий dispatch Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує робочий процес з помилкою, якщо розв’язання пакета, Docker acceptance або необов’язкова лінія Telegram завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію випуску OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованого передрелізу/стабільного випуску.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілок репозиторію або тегу випуску, встановлює залежності у відокремленому worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код робочого процесу/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старіші довірені коміти вихідного коду без запуску старої логіки робочого процесу.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker chunks шляху випуску з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin покриття, щоб перевірка опублікованого пакета не залежала від live доступності ClawHub. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації зберігається для окремих dispatch.

Для спеціальної політики тестування оновлень і plugin, включно з локальними командами,
Docker лініями, входами Package Acceptance, типовими значеннями випуску та тріажем збоїв,
див. [Тестування оновлень і plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом пакета випуску, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це тримає перевірку міграції пакета, оновлення, очищення застарілих залежностей plugin, відновлення встановлення налаштованого plugin, offline plugin, plugin-update і Telegram на тому самому розв’язаному tarball пакета. Встановіть `package_acceptance_package_spec` у Full Release Validation або OpenClaw Release Checks, щоб запустити ту саму матрицю проти вже доставленого npm-пакета замість артефакту, зібраного з SHA. Cross-OS release checks все ще покривають специфічну для ОС поведінку onboarding, installer і platform; перевірка продукту package/update має починатися з Package Acceptance. Docker лінія `published-upgrade-survivor` перевіряє один опублікований baseline пакета за запуск у блокувальному шляху випуску. У Package Acceptance розв’язаний tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback опублікований baseline, за замовчуванням `openclaw@latest`; команди перезапуску невдалих ліній зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` встановлює `published_upgrade_survivor_baselines=all-since-2026.4.23` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на всі стабільні npm-випуски від `2026.4.23` до `latest` і issue-shaped fixtures для конфігурації Feishu, збережених файлів bootstrap/persona, встановлень налаштованих OpenClaw plugin, tilde шляхів журналів і застарілих коренів залежностей legacy plugin. Окремий робочий процес `Update Migration` використовує Docker лінію `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає у вичерпному очищенні опублікованих оновлень, а не у звичайній широті Full Release CI. Локальні агреговані запуски можуть передавати точні специфікації пакетів через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, зберігати одну лінію з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, як-от `openclaw@2026.4.15`, або встановити `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для матриці сценаріїв. Опублікована лінія налаштовує baseline за допомогою вбудованого рецепта команди `openclaw config set`, записує кроки рецепта в `summary.json` і перевіряє `/healthz`, `/readyz`, а також статус RPC після запуску Gateway. Windows packaged і installer fresh лінії також перевіряють, що встановлений пакет може імпортувати browser-control override з сирого абсолютного Windows-шляху. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його встановлено, інакше `openai/gpt-5.4`, тому install і gateway proof залишаються на тестовій моделі GPT-5, уникаючи типових значень GPT-4.x.

### Вікна legacy сумісності

Package Acceptance має обмежені вікна legacy сумісності для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропустити підвипадок збереження `gateway install --wrapper`, коли пакет не експонує цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати legacy розташування install-record або приймати відсутність збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію metadata конфігурації, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні stamp-файли build metadata, які вже були доставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, журнали lane, таймінги фаз і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes, а не повторному запуску повної валідації релізу.

## Інсталяційний smoke-тест

Окремий робочий процес `Install Smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які змінюють поверхні Docker/пакетів, зміни пакетів/маніфестів bundled plugin або поверхні ядра plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише вихідного коду bundled plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає smoke-тест CLI для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним таймаутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update покриття для нічних запланованих запусків, ручних dispatch, workflow-call release checks і pull request, які справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR-образ root Dockerfile smoke для цільового SHA, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота installer не чекала за root image smokes.

Пуші в `main` (включно з merge-комітами) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, робочий процес залишає швидкий Docker smoke і передає повний install smoke нічному запуску або валідації релізу.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з робочого процесу release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` не роблять цього. QR і installer Docker-тести зберігають власні Dockerfile, орієнтовані на інсталяцію.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- чистий Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних lanes.

Визначення Docker lane розміщені в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типово  | Призначення                                                                                   |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних lanes.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-пулу, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live lanes, щоб провайдери не throttled.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних lanes для npm install.                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних multi-service lanes.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами lanes, щоб уникнути хвиль create у Docker daemon; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний таймаут на lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску lanes.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Список точних lanes через кому; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний ліміт, все одно може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальні сукупні preflight перевіряють Docker, видаляють застарілі OpenClaw E2E-контейнери, виводять статус активних lanes, зберігають таймінги lanes для впорядкування longest-first і за замовчуванням зупиняють планування нових pooled lanes після першої помилки.

### Багаторазовий live/E2E робочий процес

Багаторазовий live/E2E робочий процес запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, lane і облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і зведення. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та пушить bare/functional GHCR Docker E2E-образи з тегом package digest через Docker layer cache Blacksmith, коли план потребує lanes із встановленим пакетом; і повторно використовує передані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим 180-секундним таймаутом на спробу, щоб завислий registry/cache stream швидко повторювався, а не забирав більшість критичного шляху CI.

### Частини release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний тип образу й виконував кілька lanes через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні release Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate plugin/runtime aliases. Lane alias `install-e2e` залишається aggregate manual rerun alias для обох provider installer lanes.

OpenWebUI включається в `plugins-runtime-services`, коли повне release-path coverage запитує його, і зберігає окремий chunk `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Bundled-channel update lanes повторюють спробу один раз у разі тимчасових npm network failures.

Кожен chunk завантажує `.artifacts/docker-tests/` з журналами lanes, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями slow-lane і командами повторного запуску для кожної lane. Input робочого процесу `docker_lanes` запускає вибрані lanes проти підготовлених образів замість chunk jobs, що обмежує налагодження failed-lane одним цільовим Docker job і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана lane є live Docker lane, цільове job збирає live-test образ локально для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної lane містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, щоб невдала lane могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E робочий процес щодня запускає повний release-path Docker suite.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим product/package coverage, тому це окремий робочий процес, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і автономні ручні CI dispatch не вмикають цей suite. Він балансує bundled plugin tests між вісьмома extension workers; ці extension shard jobs запускають до двох plugin config groups одночасно з одним Vitest worker на групу та більшим Node heap, щоб import-heavy plugin batches не створювали додаткові CI jobs. Release-only Docker prerelease path групує цільові Docker lanes у невеликі групи, щоб не резервувати десятки runners для завдань тривалістю від однієї до трьох хвилин.

## QA Lab

QA Lab має виділені CI lanes поза основним smart-scoped workflow. Agentic parity вкладений у широкі QA та release harnesses, а не є окремим PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має йти разом із широким validation run.

- Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і під час manual dispatch; він розгортає mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають Matrix і Telegram live transport lanes з deterministic mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб channel contract був ізольований від live model latency і звичайного startup provider-plugin. Live transport gateway вимикає memory search, бо QA parity окремо покриває поведінку memory; provider connectivity покривається окремими live model, native provider і Docker provider suites.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише тоді, коли checked-out CLI підтримує це. CLI default і manual workflow input залишаються `all`; manual dispatch `matrix_profile=all` завжди шардить повне Matrix coverage на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед release approval; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у невелике report job для фінального parity comparison.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб розглядати parity як required status.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким сканером безпеки першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та захисні запуски для non-draft pull request сканують код Actions workflow, а також найризикованіші поверхні JavaScript/TypeScript за допомогою високонадійних запитів безпеки, відфільтрованих до високого/критичного `security-severity`.

Захист pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму високонадійну матрицю безпеки, що й запланований workflow. Android і macOS CodeQL не входять до типових PR-запусків.

### Категорії безпеки

| Категорія                                        | Поверхня                                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Автентифікація, секрети, sandbox, cron і базовий рівень Gateway                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основних каналів плюс runtime плагіна каналу, Gateway, Plugin SDK, секрети, точки дотику аудиту                 |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні SSRF, розбору IP, мережевого захисту, web-fetch і політики SSRF у Plugin SDK                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, допоміжні засоби виконання процесів, вихідна доставка та шлюзи виконання інструментів агентом                            |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, завантажувача, маніфесту, реєстру, встановлення package-manager, завантаження джерел і контракту пакета Plugin SDK |

### Платформоспецифічні фрагменти безпеки

- `CodeQL Android Critical Security` — запланований Android-фрагмент безпеки. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS-фрагмент безпеки. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збирання залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишений поза щоденними типовими запусканнями, бо збирання macOS домінує за runtime навіть коли все чисто.

### Категорії критичної якості

`CodeQL Critical Quality` — відповідний фрагмент не для безпеки. Він виконує лише запити якості JavaScript/TypeScript з error-severity, не пов’язані з безпекою, на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його захист pull request навмисно менший за запланований профіль: non-draft PR запускають лише відповідні фрагменти `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента та диспетчеризації відповідей, коді схем/міграцій/IO конфігурації, коді автентифікації/секретів/sandbox/безпеки, runtime основного каналу й вбудованого Plugin каналу, протоколі Gateway/server-method, runtime пам’яті/SDK-зв’язуванні, MCP/процесах/вихідній доставці, runtime провайдера/каталозі моделей, діагностиці сеансів/чергах доставки, завантажувачі Plugin, Plugin SDK/контракті пакета або runtime відповідей Plugin SDK. Зміни конфігурації CodeQL і workflow якості запускають усі дванадцять PR-фрагментів якості.

Ручний dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є навчальними/ітераційними хуками для запуску одного фрагмента якості ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, sandbox, cron і Gateway                                                                                                   |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та IO-контракти                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та вбудованого Plugin каналу                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація й черги автовідповідей, а також runtime-контракти контрольної площини ACP                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, допоміжні засоби нагляду за процесами й контракти вихідної доставки                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади runtime пам’яті, псевдоніми Plugin SDK для пам’яті, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні частини черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні діагностичних подій/log bundle і CLI-контракти session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Вхідна диспетчеризація відповідей Plugin SDK, допоміжні засоби payload/chunking/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сеансу/потоку |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та discovery провайдера, реєстрація runtime провайдера, типові налаштування/каталоги провайдера та реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальна персистентність, контрольні потоки Gateway і runtime-контракти контрольної площини завдань                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні runtime-контракти web fetch/search, media IO, розуміння медіа, image-generation і media-generation                                                          |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint Plugin SDK                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковані package-side джерела Plugin SDK і допоміжні засоби контракту пакета плагіна                                                                             |

Якість залишається окремо від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих плагінів слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Workflow для обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації відповідно до нещодавно змерджених змін. Він не має чистого розкладу: успішний CI-запуск non-bot push на `main` може його запустити, а manual dispatch може запускати його напряму. Workflow-run виклики пропускаються, коли `main` уже просунувся далі або коли інший non-skipped запуск Docs Agent був створений протягом останньої години. Коли він виконується, він переглядає діапазон комітів від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний запуск може покрити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск non-bot push на `main` може його запустити, але він пропускається, якщо інший workflow-run виклик уже виконувався або виконується цього UTC-дня. Manual dispatch обходить цей денний activity gate. Лінія будує full-suite grouped Vitest performance report, дозволяє Codex робити лише невеликі coverage-preserving виправлення продуктивності тестів замість широких рефакторингів, потім повторно запускає full-suite report і відхиляє зміни, що зменшують базову кількість успішних тестів. Якщо baseline має failing tests, Codex може виправляти лише очевидні збої, а after-agent full-suite report має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push потрапить у репозиторій, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму drop-sudo safety posture, що й docs agent.

### Дублікати PR після merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land duplicate cleanup. Типово він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR змерджено і що кожен дублікат має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна changed-lane логіка міститься в `scripts/changed-lanes.mjs` і виконується `scripts/check-changed.mjs`. Цей local check gate суворіший щодо архітектурних меж, ніж широкий platform scope CI:

- зміни production-коду core запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише core test запускають тільки typecheck core test плюс core lint;
- зміни production-коду extension запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише extension test запускають typecheck extension test плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів (Vitest extension sweeps залишаються explicit test work);
- metadata-only version bumps релізу запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальний changed-test routing міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі редагування тестів запускають самі себе, редагування джерел віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config є одним із явних mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна shared default падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію і для широкого підтвердження надавайте перевагу свіжому прогрітому боксу. Перш ніж витрачати повільний гейт на бокс, який було повторно використано, строк дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині боксу.

Sanity-перевірка швидко завершується з помилкою, коли зникли потрібні кореневі файли, як-от `pnpm-lock.yaml`, або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей бокс і прогрійте свіжий замість налагодження збою продуктового тесту. Для PR із навмисними масовими видаленнями задайте `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Задайте `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше значення в мілісекундах для незвично великих локальних diff.

Crabbox — це репозиторна обгортка для віддалених боксів, призначена для maintainer Linux-підтверджень. Використовуйте її, коли перевірка занадто широка для локального циклу редагування, коли важливий паритет із CI або коли підтвердження потребує секретів, Docker, пакетних доріжок, повторно використовуваних боксів чи віддалених журналів. Звичайний бекенд OpenClaw — `blacksmith-testbox`; власні потужності AWS/Hetzner є fallback на випадок збоїв Blacksmith, проблем із квотами або явного тестування власних потужностей.

Перед першим запуском перевірте обгортку з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Репозиторна обгортка відмовляється від застарілого бінарного файлу Crabbox, який не оголошує `blacksmith-testbox`. Передавайте provider явно, навіть якщо `.crabbox.yaml` має типові значення для owned-cloud.

Гейт змін:

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

Точковий повторний запуск тесту:

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

Прочитайте фінальний JSON-підсумок. Корисні поля: `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Одноразові запуски Crabbox на базі Blacksmith мають автоматично зупиняти Testbox; якщо запуск перервано або cleanup незрозумілий, перегляньте активні бокси й зупиніть лише ті бокси, які створили ви:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Використовуйте повторне використання лише тоді, коли вам навмисно потрібні кілька команд на тому самому hydrated-боксі:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо зламаним шаром є Crabbox, але сам Blacksmith працює, використайте direct Blacksmith як вузький fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Переходьте до власних потужностей Crabbox лише коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власні потужності є явною метою:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` володіє типовими значеннями provider, синхронізації та GitHub Actions hydration для owned-cloud доріжок. Він виключає локальний `.git`, щоб hydrated checkout Actions зберігав власні віддалені Git metadata замість синхронізації maintainer-local remotes і object stores, а також виключає локальні артефакти runtime/build, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і передачею несекретного середовища для owned-cloud команд `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
