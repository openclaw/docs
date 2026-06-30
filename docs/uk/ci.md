---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск перевірки релізу
    - Ви змінюєте диспетчеризацію ClawSweeper або пересилання активності GitHub
summary: Граф завдань CI, гейти області дії, релізні парасольки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-06-30T14:22:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push до `main` і кожного pull request. Канонічні
push до `main` спершу проходять через 90-секундне вікно допуску hosted-runner.
Наявна concurrency group `CI` скасовує цей run в очікуванні, коли з’являється новіший
commit, тому послідовні merge не реєструють кожен повну матрицю Blacksmith.
Pull request і ручні dispatch пропускають очікування. Далі job `preflight`
класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані
ділянки. Ручні run `workflow_dispatch` навмисно обходять smart
scoping і розгортають повний graph для release candidates і широкої
валідації. Android lanes залишаються opt-in через `include_android`. Покриття
Plugin лише для релізів живе в окремому workflow [`Передреліз Plugin`](#plugin-prerelease)
і запускається тільки з [`Повної валідації релізу`](#full-release-validation)
або явного ручного dispatch.

## Огляд pipeline

| Job                                | Призначення                                                                                               | Коли запускається                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `preflight`                        | Виявляє зміни лише в docs, змінені scopes, змінені extensions і збирає CI manifest                        | Завжди для non-draft push і PR                     |
| `runner-admission`                 | Hosted 90-секундний debounce для канонічних push до `main` перед реєстрацією роботи Blacksmith            | Кожен CI run; sleep лише для канонічних push до `main` |
| `security-fast`                    | Виявлення приватних ключів, аудит змінених workflow через `zizmor` і аудит production lockfile            | Завжди для non-draft push і PR                     |
| `check-dependencies`               | Production Knip pass лише для залежностей плюс guard allowlist для невикористаних файлів                  | Node-релевантні зміни                              |
| `build-artifacts`                  | Збірка `dist/`, Control UI, built-CLI smoke checks, перевірки вбудованих build artifacts і reusable artifacts | Node-релевантні зміни                              |
| `checks-fast-core`                 | Швидкі Linux lanes коректності, як-от bundled, protocol, QA Smoke CI і перевірки CI-routing               | Node-релевантні зміни                              |
| `checks-fast-contracts-plugins-*`  | Дві sharded перевірки Plugin contract                                                                     | Node-релевантні зміни                              |
| `checks-fast-contracts-channels-*` | Дві sharded перевірки channel contract                                                                    | Node-релевантні зміни                              |
| `checks-node-core-*`               | Core Node test shards, за винятком channel, bundled, contract і extension lanes                           | Node-релевантні зміни                              |
| `check-*`                          | Sharded еквівалент основного local gate: prod types, lint, guards, test types і strict smoke              | Node-релевантні зміни                              |
| `check-additional-*`               | Architecture, sharded boundary/prompt drift, extension guards, package boundary і runtime topology        | Node-релевантні зміни                              |
| `checks-node-compat-node22`        | Node 22 compatibility build і smoke lane                                                                  | Ручний CI dispatch для релізів                     |
| `check-docs`                       | Форматування docs, lint і перевірки broken links                                                          | Docs змінено                                       |
| `skills-python`                    | Ruff + pytest для Skills на базі Python                                                                   | Зміни, релевантні для Python Skills                |
| `checks-windows`                   | Windows-специфічні process/path tests плюс спільні регресії runtime import specifier                      | Windows-релевантні зміни                           |
| `macos-node`                       | macOS TypeScript test lane з використанням спільних built artifacts                                       | macOS-релевантні зміни                             |
| `macos-swift`                      | Swift lint, build і tests для застосунку macOS                                                            | macOS-релевантні зміни                             |
| `ios-build`                        | Генерація Xcode project плюс simulator build iOS app                                                      | iOS app, shared app kit або зміни Swabble          |
| `android`                          | Android unit tests для обох flavors плюс одна debug APK build                                             | Android-релевантні зміни                           |
| `test-performance-agent`           | Щоденна оптимізація повільних test Codex після довіреної активності                                       | Успіх main CI або ручний dispatch                  |
| `openclaw-performance`             | Щоденні/on-demand звіти Kova runtime performance з mock-provider, deep-profile і GPT 5.5 live lanes       | Запланований і ручний dispatch                     |

## Порядок fail-fast

1. `runner-admission` чекає лише для канонічних push до `main`; новіший push скасовує run перед реєстрацією Blacksmith.
2. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps усередині цього job, а не окремими jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix jobs.
4. `build-artifacts` накладається на швидкі Linux lanes, щоб downstream consumers могли стартувати щойно спільний build готовий.
5. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` і `android`.

GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший run для того самого ref також не падає. Matrix jobs використовують `fail-fast: false`, а `build-artifacts` повідомляє про збої embedded channel, core-support-boundary і gateway-watch напряму, замість постановки в чергу дрібних verifier jobs. Автоматичний CI concurrency key версіонований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

Використовуйте `pnpm ci:timings`, `pnpm ci:timings:recent` або `node scripts/ci-run-timings.mjs <run-id>`, щоб підсумувати wall time, queue time, найповільніші jobs, failures і fanout barrier `pnpm-store-warmup` з GitHub Actions. CI також завантажує той самий run summary як artifact `ci-timings-summary`. Для build timing перевірте step `Build dist` у job `build-artifacts`: `pnpm build:ci-artifacts` друкує `[build-all] phase timings:` і містить `ui:build`; job також завантажує artifact `startup-memory`.

Для pull request runs terminal timing-summary job запускає helper з довіреної base revision перед передаванням `GH_TOKEN` до `gh run view`. Це тримає tokened query поза кодом, контрольованим branch, і водночас підсумовує поточний CI run pull request.

## PR context і evidence

PR зовнішніх contributors запускають gate PR context і evidence з
`.github/workflows/real-behavior-proof.yml`. Workflow checkout довірений
base commit і оцінює лише PR body; він не виконує код із
contributor branch.

Gate застосовується до PR authors, які не є repository owners, members,
collaborators або bots. Він проходить, коли PR body містить authored
sections `What Problem This Solves` і `Evidence`. Evidence може бути focused
test, CI result, screenshot, recording, terminal output, live observation,
redacted log або artifact link. Body надає intent і корисну validation;
reviewers перевіряють code, tests і CI, щоб оцінити correctness.

Коли check падає, оновіть PR body замість push ще одного code commit.

## Scope і routing

Scope logic живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest діяти так, ніби змінено кожну scoped area.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, iOS, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **Workflow Sanity** запускає `actionlint`, `zizmor` для всіх workflow YAML files, composite-action interpolation guard і conflict-marker guard. PR-scoped job `security-fast` також запускає `zizmor` для змінених workflow files, щоб findings workflow security падали рано в основному CI graph.
- **Docs на push до `main`** перевіряються standalone workflow `Docs` із тим самим ClawHub docs mirror, який використовує CI, тому змішані code+docs push не ставлять додатково в чергу CI shard `check-docs`. Pull requests і manual CI все ще запускають `check-docs` із CI, коли docs змінено.
- **TUI PTY** запускається в Linux Node shard `checks-node-core-runtime-tui-pty` для змін TUI. Shard запускає `test/vitest/vitest.tui-pty.config.ts` з `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, тому покриває як deterministic fixture lane `TuiBackend`, так і повільніший smoke `tui --local`, що mock лише external model endpoint.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування Plugin contract helper/test-routing** використовують швидкий Node-only manifest path: `preflight`, security і єдине завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, що виконують цей lane; непов’язані source, Plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства тестів Node розділено або збалансовано так, щоб кожне завдання залишалося невеликим без надмірного резервування runner-ів: контракти plugin і контракти каналів запускаються як два зважені шарди з підтримкою Blacksmith і стандартним резервним варіантом GitHub runner, швидкі/допоміжні лінії core unit запускаються окремо, core runtime infra розділено між state, process/config, shared і трьома доменними шардами cron, auto-reply запускається як збалансовані workers (із піддеревом reply, розділеним на шарди agent-runner, dispatch і commands/state-routing), а agentic gateway/server configs розділено між лініями chat/auth/model/http-plugin/runtime/startup замість очікування на зібрані артефакти. Потім звичайний CI пакує лише ізольовані шарди include-pattern infra у детерміновані пакети щонайбільше по 64 тестові файли, зменшуючи матрицю Node без об’єднання неізольованих наборів command/cron, stateful agents-core або gateway/server; важкі фіксовані набори залишаються на 8 vCPU, тоді як пакетовані та менш навантажені лінії використовують 4 vCPU. Pull request-и в канонічному репозиторії використовують додатковий компактний план допуску: ті самі групи per-config запускаються в ізольованих підпроцесах у межах поточного плану Linux Node на 34 завдання, тому один PR не реєструє повну матрицю Node із понад 70 завдань. Push-и в `main`, ручні dispatch-и та release gates зберігають повну матрицю. Широкі browser, QA, media та різні plugin tests використовують свої виділені конфігурації Vitest замість спільного catch-all для plugin. Шарди include-pattern записують entries часу з назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізняти цілу конфігурацію від відфільтрованого shard. `check-additional-*` тримає разом compile/canary роботи на межах package і відокремлює runtime topology architecture від gateway watch coverage; список boundary guard розподілено на один prompt-heavy shard і один комбінований shard для решти guard stripes, кожен запускає вибрані незалежні guards паралельно й друкує час для кожної перевірки. Дорога перевірка дрейфу prompt snapshot для happy-path Codex запускається як окреме додаткове завдання лише для manual CI і змін, що впливають на prompt, тому звичайні не пов’язані зміни Node не чекають за холодною генерацією prompt snapshot, а boundary shards залишаються збалансованими, поки prompt drift усе ще прив’язано до PR, який його спричинив; той самий прапорець пропускає генерацію prompt snapshot Vitest усередині shard core support-boundary зі зібраними артефактами. Gateway watch, тести каналів і shard core support-boundary запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Після допуску канонічний Linux CI дозволяє до 24 одночасних тестових завдань Node і
12 для менших ліній fast/check; Windows і Android залишаються на двох, бо
ці пули runner-ів вужчі.

Компактний план PR видає 18 завдань Node для поточного набору: групи
whole-config пакетуються в ізольованих підпроцесах із 120-хвилинним timeout пакета,
тоді як групи include-pattern спільно використовують той самий обмежений бюджет завдань.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його лінія unit-test усе одно компілює flavor з прапорцями BuildConfig для SMS/call-log, уникаючи дубльованого завдання пакування debug APK під час кожного Android-релевантного push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, прив’язаний до останньої версії Knip, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production findings Knip щодо unused-file із `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Пересилання активності ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` — це цільовий bridge з активності репозиторію OpenClaw до ClawSweeper. Він не checkout-ить і не виконує ненадійний код pull request. Workflow створює токен GitHub App із `CLAWSWEEPER_APP_PRIVATE_KEY`, а потім dispatch-ить компактні payload-и `repository_dispatch` до `openclaw/clawsweeper`.

Workflow має чотири лінії:

- `clawsweeper_item` для точних запитів review issue і pull request;
- `clawsweeper_comment` для явних команд ClawSweeper у коментарях issue;
- `clawsweeper_commit_review` для запитів review на рівні commit під час push-ів у `main`;
- `github_activity` для загальної активності GitHub, яку агент ClawSweeper може перевіряти.

Лінія `github_activity` пересилає лише нормалізовані metadata: тип події, action, actor, repository, item number, URL, title, state і короткі excerpts для comments або reviews, якщо вони є. Вона навмисно не пересилає повне тіло webhook. Приймальний workflow в `openclaw/clawsweeper` — це `.github/workflows/github-activity.yml`, який надсилає нормалізовану подію до hook OpenClaw Gateway для агента ClawSweeper.

Загальна активність — це спостереження, а не delivery-by-default. Агент ClawSweeper отримує ціль Discord у своєму prompt і має публікувати в `#clawsweeper` лише тоді, коли подія несподівана, actionable, ризикована або операційно корисна. Звичайні opens, edits, bot churn, дубльований webhook noise і нормальний review traffic мають давати `NO_REPLY`.

Вважайте GitHub titles, comments, bodies, review text, branch names і commit messages ненадійними даними на всьому цьому шляху. Вони є input для summarization і triage, а не інструкціями для workflow або agent runtime.

## Ручні dispatch-и

Manual CI dispatch-и запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну scoped lane, крім Android: Linux Node shards, bundled-plugin shards, plugin і channel contract shards, сумісність Node 22, `check-*`, `check-additional-*`, smoke checks зібраних артефактів, docs checks, Python skills, Windows, macOS, iOS build і Control UI i18n. Окремі manual CI dispatch-и запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatch-ить окремий workflow `Plugin Prerelease` із увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, щоб повний набір release-candidate не було скасовано іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному caller змогу запускати цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner-и

| Runner                          | Завдання                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manual CI dispatch і fallbacks для неканонічних репозиторіїв, CodeQL JavaScript/actions quality scans, workflow-sanity, labeler, auto-response, docs workflows поза CI, а також install-smoke preflight, щоб матриця Blacksmith могла ставати в чергу раніше                         |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, менш навантажені extension shards, `checks-fast-core`, plugin/channel contract shards, більшість bundled/lower-weight Linux Node shards, `check-guards`, `check-prod-types`, `check-test-types`, вибрані shards `check-additional-*` і `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Збережені важкі Linux Node suites, boundary/extension-heavy shards `check-additional-*` і `android`                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (достатньо CPU-sensitive, що 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (час черги 32-vCPU коштував більше, ніж заощаджував)                                                                                            |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` на `openclaw/openclaw`; forks повертаються до `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` і `ios-build` на `openclaw/openclaw`; forks повертаються до `macos-26`                                                                                                                                                                                                 |

## Бюджет реєстрації runner-ів

Поточний bucket реєстрації GitHub runner-ів OpenClaw повідомляє про 10 000 self-hosted
runner registrations за 5 хвилин у `ghx api rate_limit`. Повторно перевіряйте
`actions_runner_registration` перед кожним tuning pass, оскільки GitHub може змінити
цей bucket. Ліміт спільний для всіх реєстрацій Blacksmith runner в організації
`openclaw`, тому додавання ще однієї інсталяції Blacksmith не додає
новий bucket.

Сприймайте labels Blacksmith як дефіцитний ресурс для burst control. Завдання, які
лише маршрутизують, сповіщають, підсумовують, вибирають shards або запускають короткі CodeQL scans, мають
залишатися на GitHub-hosted runners, якщо вони не мають виміряних Blacksmith-specific
потреб. Будь-яка нова матриця Blacksmith, більший `max-parallel` або високочастотний
workflow має показувати свій worst-case registration count і тримати org-level
target нижче приблизно 60% від live bucket. Із поточним bucket на 10 000 реєстрацій
це означає operating target у 6 000 реєстрацій, залишаючи запас для
одночасних репозиторіїв, retries і burst overlap.

CI канонічного репозиторію зберігає Blacksmith як типовий шлях runner для звичайних push і pull-request runs. `workflow_dispatch` і runs у неканонічних репозиторіях використовують GitHub-hosted runners, але звичайні canonical runs наразі не перевіряють queue health Blacksmith і автоматично не переходять на GitHub-hosted labels, коли Blacksmith недоступний.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` — це робочий процес продуктивності продукту/середовища виконання. Він запускається щодня на `main` і може запускатися вручну:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ручний запуск зазвичай вимірює продуктивність посилання робочого процесу. Установіть `target_ref`, щоб виміряти продуктивність тега релізу або іншої гілки з поточною реалізацією робочого процесу. Шляхи опублікованих звітів і вказівники на найновіші версії прив’язуються до протестованого посилання, а кожен `index.md` фіксує протестоване посилання/SHA, посилання/SHA робочого процесу, посилання Kova, профіль, режим автентифікації смуги, модель, кількість повторів і фільтри сценаріїв.

Робочий процес установлює OCM із закріпленого релізу та Kova з `openclaw/Kova` на закріпленому вхідному значенні `kova_ref`, а потім запускає три смуги:

- `mock-provider`: діагностичні сценарії Kova проти локально зібраного середовища виконання з детермінованою фальшивою OpenAI-сумісною автентифікацією.
- `mock-deep-profile`: профілювання CPU/heap/trace для гарячих точок запуску, Gateway та ходу агента.
- `live-openai-candidate`: реальний хід агента OpenAI `openai/gpt-5.5`, який пропускається, коли `OPENAI_API_KEY` недоступний.

Смуга mock-provider також запускає власні проби джерел OpenClaw після проходу Kova: час завантаження Gateway і пам’ять у випадках запуску за замовчуванням, із хуком і з 50 плагінами; RSS імпорту вбудованих плагінів, повторювані цикли привітання mock-OpenAI `channel-chat-baseline`, команди запуску CLI проти завантаженого Gateway і пробу продуктивності SQLite state smoke. Коли попередній опублікований звіт джерел mock-provider доступний для протестованого посилання, підсумок джерел порівнює поточні значення RSS і heap з цим базовим рівнем і позначає великі збільшення RSS як `watch`. Markdown-підсумок проби джерел розміщується в `source/index.md` у пакеті звіту, а поруч із ним лежить сирий JSON.

Кожна смуга завантажує артефакти GitHub. Коли налаштовано `CLAWGRIT_REPORTS_TOKEN`, робочий процес також комітить `report.json`, `report.md`, пакети, `index.md` і артефакти проб джерел у `openclaw/clawgrit-reports` під `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Поточний вказівник протестованого посилання записується як `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий робочий процес для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний робочий процес `CI` з цією ціллю, запускає `Plugin Prerelease` для доказів лише для релізу щодо плагінів/пакетів/статики/Docker і запускає `OpenClaw Release Checks` для install smoke, приймання пакета, перевірок пакетів між ОС, рендерингу scorecard зрілості з доказів профілю QA, паритету QA Lab, Matrix і смуг Telegram. Стабільний і повний профілі завжди включають вичерпне live/E2E та Docker-покриття витримки релізного шляху; бета-профіль може ввімкнути це через `run_release_soak=true`. Канонічний package Telegram E2E запускається всередині Package Acceptance, тому повний кандидат не запускає дубльований live poller. Після публікації передайте `release_package_spec`, щоб повторно використати випущений пакет npm у release checks, Package Acceptance, Docker, перевірках між ОС і Telegram без повторного збирання. Використовуйте `npm_telegram_package_spec` лише для сфокусованого повторного запуску Telegram з опублікованим пакетом. Смуга live package для плагіна Codex за замовчуванням використовує той самий вибраний стан: опублікований `release_package_spec=openclaw@<tag>` виводить `codex_plugin_spec=npm:@openclaw/codex@<tag>`, тоді як запуски SHA/артефактів пакують `extensions/codex` з вибраного посилання. Установіть `codex_plugin_spec` явно для користувацьких джерел плагіна, як-от специфікацій `npm:`, `npm-pack:` або `git:`.

Див. [повну перевірку релізу](/uk/reference/full-release-validation), щоб отримати
матрицю етапів, точні назви завдань робочого процесу, відмінності профілів, артефакти та
ідентифікатори для сфокусованих повторних запусків.

`OpenClaw Release Publish` — це ручний робочий процес релізу, що вносить зміни. Запускайте його
з `release/YYYY.M.PATCH` або `main` після того, як тег релізу вже існує, і після того, як
попередня перевірка OpenClaw npm успішно завершилася. Він перевіряє `pnpm plugins:sync:check`,
запускає `Plugin NPM Release` для всіх пакетів плагінів, які можна публікувати, запускає
`Plugin ClawHub Release` для того самого SHA релізу, і лише після цього запускає
`OpenClaw NPM Release` зі збереженим `preflight_run_id`. Стабільна публікація також
вимагає точний `windows_node_tag`; робочий процес перевіряє вихідний реліз Windows
і порівнює його інсталятори x64/ARM64 із затвердженим кандидатом вхідним значенням
`windows_node_installer_digests` перед будь-яким дочірнім процесом публікації, а потім просуває
і перевіряє ті самі закріплені дайджести інсталятора плюс точний супровідний артефакт
і контракт контрольної суми перед публікацією чернетки релізу GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Для підтвердження зафіксованого коміту на гілці, що швидко змінюється, використовуйте допоміжний скрипт замість
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Посилання для GitHub workflow dispatch мають бути гілками або тегами, а не необробленими SHA комітів. Допоміжний скрипт надсилає тимчасову гілку `release-ci/<sha>-...` на цільовий SHA, запускає `Full Release Validation` із цього зафіксованого посилання, перевіряє, що `headSha` кожного дочірнього workflow збігається з ціллю, і видаляє тимчасову гілку після завершення запуску. Парасольковий верифікатор також завершується помилкою, якщо будь-який дочірній workflow виконувався на іншому SHA.

`release_profile` керує широтою live/провайдерів, що передається в перевірки релізу. Ручні workflow релізу за замовчуванням використовують `stable`; використовуйте `full` лише тоді, коли навмисно потрібна широка рекомендаційна матриця провайдерів/медіа. Перевірки стабільного й повного релізу завжди запускають вичерпний live/E2E та Docker soak для шляху релізу; бета-профіль може увімкнути це через `run_release_soak=true`.

- `minimum` залишає найшвидші критичні для релізу лінії OpenAI/ядра.
- `stable` додає стабільний набір провайдерів/бекендів.
- `full` запускає широку рекомендаційну матрицю провайдерів/медіа.

Парасольковий workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено й він стає зеленим, перезапустіть лише батьківське завдання верифікатора, щоб оновити парасольковий результат і зведення часу виконання.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `plugin-prerelease` лише для дочірнього передрелізу Plugin, `release-checks` для кожного дочірнього релізу або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольковому workflow. Це утримує перезапуск невдалого релізного блоку в межах після цільового виправлення. Для однієї невдалої cross-OS лінії поєднайте `rerun_group=cross-os` із `cross_os_suite_filter`, наприклад `windows/packaged-upgrade`; довгі cross-OS команди виводять рядки Heartbeat, а зведення packaged-upgrade містять таймінги для кожної фази. QA лінії release-check є рекомендаційними, окрім стандартного шлюзу покриття runtime-інструментів, який блокує, коли потрібні динамічні інструменти OpenClaw зміщуються або зникають зі зведення стандартного рівня.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт у cross-OS перевірки та приймання пакетів, а також у Docker workflow live/E2E шляху релізу, коли виконується soak-покриття. Це зберігає байти пакета узгодженими між релізними блоками й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях. Для live-лінії npm-plugin Codex перевірки релізу або передають відповідну опубліковану специфікацію Plugin, похідну від `release_package_spec`, або передають надану оператором `codex_plugin_spec`, або залишають вхід порожнім, щоб Docker-скрипт спакував Plugin Codex із вибраного checkout.

Дублікати запусків `Full Release Validation` для `ref=main` і `rerun_group=all`
замінюють старіший парасольковий запуск. Батьківський монітор скасовує будь-який дочірній workflow, який він уже запустив, коли батьківський запуск скасовано, тому новіша валідація main не простоює за застарілим двогодинним запуском release-check. Валідація релізних гілок/тегів і цільові групи перезапуску зберігають `cancel-in-progress: false`.

## Live та E2E шарди

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
- розділені аудіо/відео шарди медіа та музичні шарди, відфільтровані за провайдером

Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск і діагностику повільних збоїв live-провайдерів. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live медіа-шарди виконуються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, створеному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; медіа-завдання лише перевіряють бінарні файли перед налаштуванням. Залишайте live-набори з підтримкою Docker на звичайних раннерах Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live model/backend shards використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Робочий процес live-релізу збирає й публікує цей образ один раз, після чого Docker-шарди live-моделі, provider-sharded gateway, CLI backend, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Docker-шарди Gateway мають явні обмеження `timeout` на рівні скрипта нижче за timeout завдання workflow, щоб завислий контейнер або шлях очищення швидко завершувався помилкою, а не витрачав увесь бюджет release-check. Якщо ці шарди незалежно перебудовують повну ціль Docker для вихідного коду, запуск релізу налаштовано неправильно, і він витрачатиме фактичний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як "чи працює цей інстальований пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, визначає один кандидат пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгалужує ці lanes як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance визначило його; автономний запуск Telegram все ще може встановлювати опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо визначення пакета, Docker-приймання або опційний Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих prerelease/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Resolver отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує публічний HTTPS `.tgz`; `package_sha256` є обов'язковим. Цей шлях відхиляє облікові дані в URL, нестандартні HTTPS-порти, приватні/внутрішні/спеціального призначення hostnames або resolved IPs, а також перенаправлення поза тією самою публічною політикою безпеки.
- `source=trusted-url` завантажує HTTPS `.tgz` з іменованої політики trusted-source у `.github/package-trusted-sources.json`; `package_sha256` і `trusted_source_id` є обов'язковими. Використовуйте це лише для enterprise mirrors або приватних репозиторіїв пакетів, якими володіють maintainers і яким потрібні налаштовані hosts, ports, path prefixes, redirect hosts або private-network resolution. Якщо політика оголошує bearer auth, workflow використовує фіксований секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; облікові дані, вбудовані в URL, усе одно відхиляються.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` опційний, але його слід надавати для зовнішньо поширених артефактів.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному test harness перевіряти старі довірені коміти вихідного коду без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов'язково, коли `suite_profile=custom`

Профіль `package` використовує offline plugin coverage, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Опційний Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних запусків.

Для спеціальної політики тестування оновлень і plugin, включно з локальними командами,
Docker lanes, входами Package Acceptance, релізними типовими значеннями та triage збоїв,
див. [Тестування оновлень і plugin](/uk/help/testing-updates-plugins).

Release checks викликають Package Acceptance з `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` і `telegram_mode=mock-openai`. Це тримає міграцію пакета, оновлення, live ClawHub skill install, очищення stale-plugin-dependency, repair встановлення configured-plugin, offline plugin, plugin-update і Telegram proof на тому самому визначеному tarball пакета. Установіть `release_package_spec` у Full Release Validation або OpenClaw Release Checks після публікації beta, щоб запустити ту саму матрицю проти доставленого npm-пакета без перебудови; установлюйте `package_acceptance_package_spec` лише тоді, коли Package Acceptance потрібен інший пакет, ніж решті release validation. Cross-OS release checks усе ще покривають OS-specific onboarding, installer і platform behavior; product validation для package/update має починатися з Package Acceptance. Docker lane `published-upgrade-survivor` перевіряє один базовий опублікований пакет на запуск у blocking release path. У Package Acceptance визначений tarball `package-under-test` завжди є кандидатом, а `published_upgrade_survivor_baseline` вибирає fallback published baseline, за замовчуванням `openclaw@latest`; команди повторного запуску failed-lane зберігають цей baseline. Full Release Validation з `run_release_soak=true` або `release_profile=full` встановлює `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` і `published_upgrade_survivor_scenarios=reported-issues`, щоб розширити перевірку на чотири останні stable npm releases плюс закріплені plugin-compatibility boundary releases і issue-shaped fixtures для Feishu config, збережених bootstrap/persona files, налаштованих установлень OpenClaw plugin, tilde log paths і stale legacy plugin dependency roots. Multi-baseline published-upgrade survivor selections шардяться за baseline в окремі targeted Docker runner jobs. Окремий workflow `Update Migration` використовує Docker lane `update-migration` з `all-since-2026.4.23` і `plugin-deps-cleanup`, коли питання полягає в exhaustive published update cleanup, а не у звичайній широті Full Release CI. Локальні агреговані запуски можуть передавати точні package specs через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, залишати один lane з `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, наприклад `openclaw@2026.4.15`, або встановлювати `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` для scenario matrix. Опублікований lane налаштовує baseline за допомогою вбудованого command recipe `openclaw config set`, записує кроки recipe в `summary.json` і перевіряє `/healthz`, `/readyz`, а також RPC status після старту Gateway. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з raw absolute Windows path. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли його встановлено, інакше `openai/gpt-5.5`, тож доказ install і gateway залишається на тестовій моделі GPT-5, уникаючи типових значень GPT-4.x.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені legacy-compatibility windows для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати compatibility path:

- відомі приватні QA entries у `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені з tarball;
- `doctor-switch` може пропустити підвипадок persistence `gateway install --wrapper`, коли пакет не надає цей flag;
- `update-channel-switch` може обрізати відсутні pnpm `patchedDependencies` з tarball-derived fake git fixture і може логувати відсутній persisted `update.channel`;
- plugin smokes можуть читати legacy install-record locations або приймати відсутню marketplace install-record persistence;
- `plugin-update` може дозволяти міграцію config metadata, водночас усе ще вимагаючи, щоб install record і no-reinstall behavior залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про local build metadata stamp files, які вже були доставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням або пропуском.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings і rerun commands. Надавайте перевагу повторному запуску failed package profile або точних Docker lanes замість повторного запуску full release validation.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke coverage на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які торкаються поверхонь Docker/пакетів, змін пакета/маніфесту вбудованого Plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють завдання Docker smoke. Зміни лише у вихідному коді вбудованого Plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg вбудованого розширення та запускає обмежений Docker-профіль вбудованого Plugin із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежується окремо).
- **Повний шлях** зберігає покриття встановлення QR-пакета та Docker/update інсталятора для нічних запланованих запусків, ручних dispatch, release checks через workflow-call і pull request, які справді торкаються поверхонь інсталятора/пакетів/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR root Dockerfile smoke-образ для цільового SHA, а потім запускає встановлення QR-пакета, root Dockerfile/gateway smoke, installer/update smoke і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала за smoke-перевірками кореневого образу.

Push до `main` (зокрема merge commit) не примушують повний шлях; коли логіка changed-scope запитала б повне покриття під час push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної валідації.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow release checks, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і push до `main` цього не роблять. Звичайний PR CI все одно запускає швидку регресійну лінію Bun launcher для змін, релевантних Node. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- базовий Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії через `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Типово  | Призначення                                                                                                      |
| ------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-пулу, чутливого до провайдерів.                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження одночасних live-ліній, щоб провайдери не застосовували throttling.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Обмеження одночасних ліній встановлення npm.                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження одночасних multi-service ліній.                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути шквалів створення в Docker daemon; установіть `0`, щоб вимкнути її.    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження.   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску ліній.                                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за своє ефективне обмеження, все ще може стартувати з порожнього пулу, а потім виконуватися самостійно, доки не звільнить місткість. Локальний сукупний запуск виконує preflight Docker, видаляє застарілі OpenClaw E2E контейнери, виводить статус активних ліній, зберігає тривалість ліній для впорядкування від найдовших до найкоротших і типово припиняє планувати нові pooled лінії після першого збою.

### Багаторазовий workflow live/E2E

Багаторазовий workflow live/E2E запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, лінії та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує artifact пакета поточного запуску, або завантажує artifact пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та надсилає package-digest-tagged bare/functional GHCR Docker E2E образи через Docker layer cache Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Завантаження Docker-образів повторюються з обмеженим тайм-аутом 180 секунд на спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшу частину критичного шляху CI.

### Фрагменти релізного шляху

Релізне Docker-покриття запускає менші розбиті на фрагменти завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний тип образу та виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Поточні релізні Docker-фрагменти: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` і від `plugins-runtime-install-a` до `plugins-runtime-install-h`. `package-update-openai` містить live-лінію пакета Codex plugin, яка встановлює кандидатний пакет OpenClaw, встановлює Codex plugin з `codex_plugin_spec` або same-ref tarball з явним схваленням встановлення Codex CLI, запускає preflight Codex CLI, а потім запускає кілька same-session OpenClaw agent turns проти OpenAI. `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються aggregate alias для plugin/runtime. Alias лінії `install-e2e` залишається aggregate manual rerun alias для обох provider installer ліній.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття release-path цього вимагає, і зберігає окремий фрагмент `openwebui` лише для dispatch, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюються один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з журналами ліній, тривалістю, `summary.json`, `failures.json`, тривалістю фаз, JSON плану планувальника, таблицями повільних ліній і командами rerun для кожної лінії. Input workflow `docker_lanes` запускає вибрані лінії на підготовлених образах замість chunk jobs, що обмежує debugging невдалої лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує artifact пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання збирає live-test образ локально для цього rerun. Згенеровані GitHub-команди rerun для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і inputs підготовлених образів, коли ці значення існують, тож невдала лінія може повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований workflow live/E2E щодня запускає повний Docker-набір release-path.

## Plugin Prerelease

`Plugin Prerelease` — дорожче покриття продукту/пакетів, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push до `main` і автономні ручні CI dispatch не запускають цей набір. Він балансує тести вбудованих plugin між вісьмома extension workers; ці extension shard jobs запускають до двох груп конфігурації plugin одночасно з одним Vitest worker на групу та більшим heap Node, щоб import-heavy пакети plugin не створювали додаткові CI jobs. Релізний Docker prerelease path пакетно запускає цільові Docker-лінії малими групами, щоб не резервувати десятки runners для завдань на одну-три хвилини. Workflow також завантажує інформаційний artifact `plugin-inspector-advisory` з `@openclaw/plugin-inspector`; findings інспектора є вхідними даними для triage і не змінюють blocking gate `Plugin Prerelease`.

## QA Lab

QA Lab має виділені CI-лінії поза основним smart-scoped workflow. Agentic parity вкладено під широкі QA та release harnesses, а не винесено в окремий PR workflow. Використовуйте `Full Release Validation` з `rerun_group=qa-parity`, коли parity має виконуватися разом із широким validation run.

- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну через dispatch; він розгортає mock parity lane, live Matrix lane, а також live Telegram і Discord lanes як паралельні jobs. Live jobs використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Release checks запускають live transport lanes Matrix і Telegram з детермінованим mock provider і mock-qualified models (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт channel був ізольований від затримки live model і звичайного startup provider-plugin. Live transport gateway вимикає memory search, бо QA parity окремо покриває поведінку пам’яті; provider connectivity покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для scheduled і release gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI та input ручного workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне Matrix-покриття на jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає release-critical QA Lab lanes перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні lane jobs, а потім завантажує обидва artifacts у мале report job для фінального порівняння parity.

Для звичайних PR дотримуйтеся scoped CI/check evidence замість того, щоб вважати parity обов’язковим статусом.

## CodeQL

Workflow `CodeQL` навмисно є вузьким first-pass сканером безпеки, а не повним обходом репозиторію. Щоденні, ручні та non-draft pull request guard runs сканують код Actions workflow і найризикованіші поверхні JavaScript/TypeScript за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Pull request guard залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять у типові PR-запуски.

### Категорії безпеки

| Категорія                                          | Поверхня                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, секрети, sandbox, cron і базова лінія gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу плюс runtime Plugin каналу, gateway, Plugin SDK, секрети, точки дотику аудиту              |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні політик Core SSRF, розбору IP, мережевого захисту, web-fetch і Plugin SDK SSRF                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, помічники виконання процесів, вихідна доставка та шлюзи виконання інструментів агентом                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри встановлення Plugin, завантажувача, маніфесту, реєстру, встановлення через менеджер пакетів, завантаження джерел і пакетного контракту Plugin SDK |

### Специфічні для платформ security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому перевіркою коректності workflow. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишається поза щоденними стандартними запусками, бо збірка macOS домінує за часом виконання навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний не-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries для вузьких високоцінних поверхонь на GitHub-hosted Linux runners, щоб quality scans не витрачали бюджет реєстрації Blacksmith runner. Його guard для pull request навмисно менший за запланований профіль: non-draft PRs запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агентом і диспетчеризації відповідей, коді схеми/міграції/IO config, коді auth/секретів/sandbox/security, runtime основного каналу та bundled channel Plugin, протоколі Gateway/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, runtime provider/model catalog, session diagnostics/delivery queues, завантажувачі Plugin, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Manual dispatch приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є хуками навчання/ітерації для запуску одного quality shard ізольовано.

| Категорія                                                | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки Auth, секретів, sandbox, cron і gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Контракти схеми config, міграції, нормалізації та IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel Plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація model/provider, диспетчеризація й черги auto-reply, а також runtime-контракти ACP control-plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та мости інструментів, помічники нагляду за процесами й контракти вихідної доставки                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, aliases memory Plugin SDK, glue активації memory runtime і команди memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми reply queue, session delivery queues, помічники outbound session binding/delivery, поверхні diagnostic event/log bundle і session doctor CLI contracts |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, reply payload/chunking/runtime helpers, параметри відповіді каналу, delivery queues і помічники session/thread binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація model catalog, auth і discovery provider, реєстрація provider runtime, provider defaults/catalogs і реєстри web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, локальне збереження, control flows Gateway і runtime-контракти task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти runtime для core web fetch/search, media IO, media understanding, image-generation і media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, public-surface і entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело Plugin SDK на боці пакета та помічники контракту пакета Plugin                                                                                      |

Quality залишається окремо від security, щоб findings якості можна було планувати, вимірювати, вимикати або розширювати без затемнення security signal. Розширення Swift, Python і bundled-plugin CodeQL слід додавати назад як scoped або sharded follow-up work лише після того, як вузькі профілі матимуть стабільний runtime і signal.

## Maintenance workflows

### Docs Agent

Workflow `Docs Agent` — це подієво-керована смуга супроводу Codex для підтримання наявної документації в узгодженому стані з нещодавно landed changes. Вона не має чистого розкладу: успішний non-bot push CI run на `main` може її запустити, а manual dispatch може запустити її напряму. Workflow-run invocations пропускаються, коли `main` уже просунувся далі або коли інший non-skipped Docs Agent run було створено протягом останньої години. Коли вона виконується, то переглядає діапазон commit від попереднього non-skipped Docs Agent source SHA до поточного `main`, тож один погодинний run може покрити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована смуга супроводу Codex для повільних тестів. Вона не має чистого розкладу: успішний non-bot push CI run на `main` може її запустити, але вона пропускається, якщо інший workflow-run invocation уже виконувався або виконується в цей UTC-день. Manual dispatch обходить цей щоденний activity gate. Смуга будує згрупований звіт продуктивності Vitest для full-suite, дозволяє Codex робити лише невеликі fixes продуктивності тестів зі збереженням coverage замість широких refactors, потім повторно запускає full-suite report і відхиляє зміни, які зменшують baseline кількість passing tests. Згрупований звіт записує wall time per-config і max RSS на Linux і macOS, тому порівняння before/after показує дельти пам’яті тестів поруч із дельтами тривалості. Якщо baseline має failing tests, Codex може виправляти лише очевидні failures, а after-agent full-suite report має пройти перед тим, як щось буде committed. Коли `main` просувається перед тим, як bot push потрапить у репозиторій, смуга rebases validated patch, повторно запускає `pnpm check:changed` і retry push; конфліктні stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберігати ту саму drop-sudo safety posture, що й docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для post-land duplicate cleanup. За замовчуванням він працює в dry-run і закриває лише явно перелічені PRs, коли `apply=true`. Перед мутацією GitHub він перевіряє, що landed PR merged і що кожен duplicate має або спільне referenced issue, або overlapping changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates and changed routing

Локальна changed-lane logic живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей local check gate суворіший щодо architecture boundaries, ніж широкий platform scope CI:

- production changes core запускають core prod і core test typecheck плюс core lint/guards;
- core test-only changes запускають лише core test typecheck плюс core lint;
- extension production changes запускають extension prod і extension test typecheck плюс extension lint;
- extension test-only changes запускають extension test typecheck плюс extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною test work);
- release metadata-only version bumps запускають цільові version/config/root-dependency checks;
- unknown root/config changes fail safe до всіх check lanes.

Local changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі зміни тестів запускають самі себе, зміни source віддають перевагу explicit mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config — одне з explicit mappings: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс Discord і Slack delivery regressions, щоб зміна shared default падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли зміна достатньо harness-wide, що cheap mapped set не є надійним proxy.

## Testbox validation

Crabbox — це repo-owned remote-box wrapper для maintainer Linux proof. Використовуйте його
з repo root, коли check занадто широкий для локального edit loop, коли важлива
CI parity, або коли proof потребує secrets, Docker, package lanes,
reusable boxes чи remote logs. Звичайний OpenClaw backend —
`blacksmith-testbox`; owned AWS/Hetzner capacity є fallback для Blacksmith
outages, quota issues або explicit owned-capacity testing.

Запуски Blacksmith через Crabbox прогрівають, резервують, синхронізують, запускають, звітують і очищають
одноразові Testbox. Вбудована перевірка коректності синхронізації завершується швидко з помилкою, коли обов’язкові
кореневі файли, як-от `pnpm-lock.yaml`, зникають або коли `git status --short`
показує щонайменше 200 відстежуваних видалень. Для PR із навмисним великим видаленням установіть
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для віддаленої команди.

Crabbox також завершує локальний виклик CLI Blacksmith, який лишається у фазі
синхронізації понад п’ять хвилин без виводу після синхронізації. Установіть
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей захист, або використайте більше
значення в мілісекундах для незвично великих локальних diff.

Перед першим запуском перевірте обгортку з кореня репозиторію:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Обгортка репозиторію відхиляє застарілий бінарний файл Crabbox, який не оголошує `blacksmith-testbox`. Передайте provider явно, навіть якщо `.crabbox.yaml` має типові значення owned-cloud. У worktree Codex або зв’язаних/розріджених checkout уникайте локального скрипта `pnpm crabbox:run`, бо pnpm може узгоджувати залежності до запуску Crabbox; натомість викликайте node-обгортку напряму:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Запуски через Blacksmith потребують Crabbox 0.22.0 або новішого, щоб обгортка отримувала поточну поведінку синхронізації, черги й очищення Testbox. Під час використання сусіднього checkout перебудуйте ігнорований локальний бінарний файл перед вимірюванням часу або доказовою роботою:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
```

Повторний запуск цільових тестів:

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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

Прочитайте фінальний JSON-підсумок. Корисні поля: `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` і `totalMs`. Для делегованих
запусків Blacksmith Testbox код виходу обгортки Crabbox і JSON-підсумок є
результатом команди. Пов’язаний запуск GitHub Actions відповідає за гідратацію та keepalive; він
може завершитися як `cancelled`, коли Testbox зупинено ззовні після того, як SSH-команда
вже повернулася. Вважайте це артефактом очищення/статусу, якщо тільки
`exitCode` обгортки не є ненульовим або вивід команди не показує невдалий тест.
Одноразові запуски Crabbox через Blacksmith мають автоматично зупиняти Testbox;
якщо запуск перервано або очищення неясне, перевірте live-бокси й зупиняйте лише
ті бокси, які ви створили:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Використовуйте повторне використання лише тоді, коли навмисно потрібні кілька команд на тому самому гідратованому боксі:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Якщо зламаним шаром є Crabbox, але сам Blacksmith працює, використовуйте прямий
Blacksmith лише для діагностики, як-от `list`, `status` і очищення. Виправте
шлях Crabbox, перш ніж вважати прямий запуск Blacksmith доказом для мейнтейнера.

Якщо `blacksmith testbox list --all` і `blacksmith testbox status` працюють, але нові
warmup лишаються `queued` без IP або URL запуску Actions після кількох хвилин,
вважайте це тиском provider Blacksmith, черги, білінгу або лімітів org. Зупиніть
queued-ідентифікатори, які ви створили, не запускайте більше Testbox і перенесіть доказ на
шлях власної потужності Crabbox нижче, поки хтось перевіряє dashboard Blacksmith,
білінг і ліміти org.

Переходьте на власну потужність Crabbox лише тоді, коли Blacksmith недоступний, обмежений квотою, не має потрібного середовища або власна потужність є явною метою:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Під тиском AWS уникайте `class=beast`, якщо завданню справді не потрібен CPU класу 48xlarge. Запит `beast` стартує зі 192 vCPU і є найпростішим способом упертися в регіональну квоту EC2 Spot або On-Demand Standard. Репозиторійний `.crabbox.yaml` типово використовує `standard`, кілька регіонів потужності та `capacity.hints: true`, тож посередницькі AWS-оренди друкують вибраний регіон/ринок, тиск квоти, fallback Spot і попередження про класи під високим тиском. Використовуйте `fast` для важчих широких перевірок, `large` лише після того, як standard/fast недостатньо, а `beast` лише для виняткових CPU-bound lanes, як-от повний набір або Docker-матриці всіх plugins, явна валідація release/blocker або профілювання продуктивності з великою кількістю ядер. Не використовуйте `beast` для `pnpm check:changed`, цільових тестів, роботи лише з документацією, звичайного lint/typecheck, малих E2E-відтворень або triage збою Blacksmith. Використовуйте `--market on-demand` для діагностики потужності, щоб коливання ринку Spot не змішувалося із сигналом.

`.crabbox.yaml` володіє типовими значеннями provider, синхронізації та гідратації GitHub Actions для owned-cloud lanes. Він виключає локальний `.git`, щоб гідратований checkout Actions зберігав власні віддалені метадані Git замість синхронізації локальних для мейнтейнера remotes і сховищ об’єктів, а також виключає локальні runtime/build-артефакти, які ніколи не слід передавати. `.github/workflows/crabbox-hydrate.yml` володіє checkout, налаштуванням Node/pnpm, fetch `origin/main` і передаванням несекретного середовища для owned-cloud команд `crabbox run --id <cbx_id>`.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
