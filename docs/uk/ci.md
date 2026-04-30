---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується невдало
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, гейти областей, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T18:11:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push у `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані ділянки. Ручні запуски `workflow_dispatch` навмисно оминають розумне обмеження scope і розгортають повний граф для release candidates і широкої валідації. Android lanes залишаються opt-in через `include_android`. Покриття plugin, призначене лише для релізів, живе в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                         | Коли запускається                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені scopes, змінені extensions і будує CI manifest                    | Завжди на non-draft pushes і PRs   |
| `security-scm-fast`              | Виявлення private key і аудит workflow через `zizmor`                                                | Завжди на non-draft pushes і PRs   |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                        | Завжди на non-draft pushes і PRs   |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                                     | Завжди на non-draft pushes і PRs   |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist для unused-file                            | Node-релевантні зміни              |
| `build-artifacts`                | Збирає `dist/`, Control UI, перевірки built-artifact і reusable downstream artifacts                  | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                        | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                                 | Node-релевантні зміни              |
| `checks-node-core-test`          | Core Node test shards, без channel, bundled, contract і extension lanes                              | Node-релевантні зміни              |
| `check`                          | Sharded main local gate equivalent: prod types, lint, guards, test types і strict smoke              | Node-релевантні зміни              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards            | Node-релевантні зміни              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                         | Node-релевантні зміни              |
| `checks`                         | Verifier для built-artifact channel tests                                                            | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                             | Manual CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки broken-link                                                      | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                               | Python-skill-релевантні зміни      |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions                 | Windows-релевантні зміни           |
| `macos-node`                     | macOS TypeScript test lane із використанням shared built artifacts                                   | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                              | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                        | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                                    | Main CI success або manual dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати, щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все одно повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було витіснено. Автоматичний CI concurrency key версіонований (`CI-v7-*`), тому GitHub-side zombie у старій queue group не може нескінченно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Scope logic живе в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** валідують Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, selected cheap core-test fixture edits і narrow plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і один task `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє безпосередньо.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділені або збалансовані, щоб кожне job залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes спарені, auto-reply запускається як чотири balanced workers (з reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої невеликі independent guards concurrently всередині одного job. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job під час кожного Android-релевантного push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до latest Knip version, з вимкненим pnpm minimum release age для `dlx` install) і `pnpm deadcode:unused-files`, який порівнює Knip production unused-file findings із `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий непереглянутий unused file або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Ручні dispatches

Manual CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тому release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає trusted caller змогу запустити цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконувач                        | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованого пакета, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, агреговані перевіряльники тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; попередня перевірка install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували дорожче, ніж заощаджували); Docker-збірки install-smoke (час у черзі для 32-vCPU коштував дорожче, ніж заощаджував)                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` в `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` в `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |

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

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізних перевірок Plugin/пакета/статичних файлів/Docker, а також запускає `OpenClaw Release Checks` для install smoke, приймання пакета, наборів release-path для Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram-ліній. Він також може запускати post-publish workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`release_profile` керує шириною live/provider, що передається до релізних перевірок:

- `minimum` залишає найшвидші критичні для релізу лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку рекомендаційну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх виконань, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх виконань і додає таблиці найповільніших завдань для кожного дочірнього виконання. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання перевіряльника, щоб оновити результат парасольки й підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `release-checks` для кожного релізного дочірнього завдання або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це обмежує перезапуск невдалого релізного блока після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і до live/E2E Docker workflow release-path, і до шарда приймання пакета. Це зберігає байти пакета узгодженими між релізними блоками й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live- та E2E-шарди

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- завдання `native-live-src-gateway-profiles`, відфільтровані за provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені шарди аудіо/відео media та шарди music, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск і діагностику повільних збоїв live provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-підкріплені live-набори на звичайних runner Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-підкріплені шарди live model/backend використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й публікує цей образ один раз, після чого шарди Docker live model, gateway, CLI backend, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну вихідну Docker-ціль, релізний запуск налаштовано неправильно, і він марнуватиме настінний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після встановлення або оновлення.

### Завдання

1. `resolve_package` отримує `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумок кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-лінії проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow один раз готує пакет і спільні образи, а потім розгортає ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав один; окремий запуск Telegram усе ще може встановити опубліковану специфікацію npm.
4. `summary` позначає workflow як невдалий, якщо розв’язання пакета, Docker-приймання або необов’язкова Telegram-лінія завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Розв’язувач отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або тегу релізу, встановлює залежності у від’єднаному робочому дереві та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для артефактів, що поширюються назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/обв’язки, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточній тестовій обв’язці перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти Docker шляху релізу з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, щоб перевірка опублікованого пакета не залежала від доступності ClawHub наживо. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях специфікації опублікованого npm зберігається для автономних запусків.

Перевірки релізу викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти шляху релізу покривають лінії package/update/plugin, що перетинаються; Package Acceptance зберігає нативну для артефакта перевірку сумісності bundled-channel, офлайн-Plugin і доказ Telegram проти того самого розв’язаного tarball пакета. Крос-OS перевірки релізу й далі покривають специфічні для ОС onboarding, installer і поведінку платформи; перевірку продукту package/update слід починати з Package Acceptance. Свіжі лінії Windows packaged та installer також перевіряють, що встановлений пакет може імпортувати browser-control override з необробленого абсолютного шляху Windows. Димовий тест OpenAI крос-OS agent-turn за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його встановлено, інакше `openai/gpt-5.4-mini`, щоб доказ встановлення та Gateway залишався швидким і детермінованим.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені вікна сумісності зі спадковими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` із фіктивної git-фікстури, отриманої з tarball, і може логувати відсутній збережений `update.channel`;
- димові тести Plugin можуть читати спадкові розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні stamp-файли метаданих збірки, які вже були доставлені. Пізніші пакети мають задовольняти сучасні контракти; ті самі умови призводять до помилки замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` та його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної перевірки релізу.

## Димовий тест встановлення

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення scope через власне завдання `preflight`. Він розділяє димове покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що торкаються поверхонь Docker/package, змін пакета/маніфесту bundled Plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють завдання Docker smoke. Зміни лише вихідного коду bundled Plugin, правки лише тестів і правки лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає димовий тест CLI видалення agents shared-workspace, запускає container gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin під сукупним тайм-аутом команди 240 секунд (кожен Docker-запуск сценарію обмежений окремо).
- **Повний шлях** зберігає QR package install та installer Docker/update покриття для нічних запланованих запусків, ручних запусків, workflow-call перевірок релізу та pull request, що справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один GHCR образ smoke кореневого Dockerfile для цільового SHA, а потім запускає QR package install, димові тести кореневого Dockerfile/gateway, димові тести installer/update і швидкий Docker E2E bundled-plugin як окремі завдання, щоб робота installer не чекала за димовими тестами кореневого образу.

Push у `main` (зокрема merge-коміти) не примушують повний шлях; коли логіка changed-scope на push запитувала б повне покриття, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки.

Повільний димовий тест Bun global install image-provider окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `Install Smoke` можуть увімкнути його, але pull request і push у `main` — ні. QR і installer Docker tests зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний образ live-test, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Параметри налаштування

| Змінна                                | Типове значення | Призначення                                                                                   |
| ------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10              | Кількість слотів основного пулу для звичайних ліній.                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10              | Кількість слотів хвостового пулу, чутливого до провайдерів.                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9               | Ліміт одночасних live-ліній, щоб провайдери не throttling.                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10              | Ліміт одночасних ліній встановлення npm.                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7               | Ліміт одночасних multi-service ліній.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000            | Інтервал між стартами ліній, щоб уникнути шквалу create у Docker daemon; встановіть `0`, щоб вимкнути stagger. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000         | Резервний тайм-аут на лінію (120 хвилин); вибрані live/tail лінії використовують жорсткіші межі. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset           | `1` друкує план планувальника без запуску ліній.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset           | Список точних ліній, розділених комами; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить місткість. Локальний агрегат виконує preflight Docker, видаляє застарілі контейнери OpenClaw E2E, виводить статус активних ліній, зберігає таймінги ліній для впорядкування longest-first і за замовчуванням припиняє планувати нові pooled-лінії після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає й пушить package-digest-tagged bare/functional GHCR Docker E2E образи через Docker layer cache Blacksmith, коли план потребує ліній із установленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні образи package-digest замість перебудови. Docker image pulls повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторювався, а не споживав більшість критичного шляху CI.

### Фрагменти шляху релізу

Docker-покриття релізу запускає менші фрагментовані завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу й виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох ліній інсталятора провайдерів. Фрагмент `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну лінію `bundled-channel-deps` «усе в одному».

OpenWebUI включається в `plugins-runtime-services`, коли цього вимагає повне покриття релізного шляху, і зберігає окремий фрагмент `openwebui` лише для запусків, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент вивантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід `docker_lanes` workflow запускає вибрані лінії на підготовлених образах замість завдань фрагментів, що обмежує налагодження невдалої лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає live-test образ для цього повторного запуску. Згенеровані команди GitHub повторного запуску для кожної лінії містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker-артефакти та вивести об’єднані/цільові команди повторного запуску для кожної лінії
pnpm test:docker:timings <summary>   # підсумки повільних ліній і критичного шляху фаз
```

Запланований live/E2E workflow щодня запускає повний Docker-набір релізного шляху.

## Передреліз Plugin

`Plugin Prerelease` має дорожче покриття продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push до `main` і автономні ручні запуски CI не вмикають цей набір. Він балансує тести bundled plugin між вісьмома працівниками розширень; ці завдання шардів розширень запускають до двох груп конфігурацій plugin одночасно з одним працівником Vitest на групу та більшим heap Node, щоб насичені імпортами пакети plugin не створювали додаткових CI-завдань.

## QA Lab

QA Lab має окремі CI-лінії поза основним workflow з розумним визначенням області.

- Workflow `Parity gate` запускається для відповідних змін PR і ручного запуску; він збирає приватний QA runtime і порівнює агентні пакети mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і вручну; він розгортає mock parity gate, live Matrix-лінію, а також live-лінії Telegram і Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують оренди Convex.

Релізні перевірки запускають live transport-лінії Matrix і Telegram із детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і ручний вхід workflow залишаються `all`; ручний запуск `matrix_profile=all` завжди ділить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критично важливі для релізу лінії QA Lab перед схваленням релізу; його QA parity gate запускає кандидатні та базові пакети як паралельні завдання ліній, а потім завантажує обидва артефакти в мале звітне завдання для фінального порівняння parity.

Не ставте шлях злиття PR за `Parity gate`, якщо зміна насправді не торкається QA runtime, parity пакетів моделей або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і спирайтеся на scoped CI/check докази.

## CodeQL

Workflow `CodeQL` навмисно є вузьким першим проходом сканера безпеки, а не повним скануванням репозиторію. Щоденні, ручні та guard-запуски для non-draft pull request сканують код Actions workflow плюс найризикованіші JavaScript/TypeScript поверхні високодостовірними запитами безпеки, відфільтрованими до високого/критичного `security-severity`.

Guard для pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і запускає ту саму високодостовірну матрицю безпеки, що й запланований workflow. Android і macOS CodeQL не входять у типові PR-перевірки.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, секрети, sandbox, cron і базовий gateway                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core-каналів плюс runtime channel plugin, gateway, Plugin SDK, секрети, точки аудиту                              |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, розбір IP, network guard, web-fetch і поверхні політики SSRF у Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, помічники виконання процесів, outbound delivery і gate виконання інструментів агентом                                      |
| `/codeql-security-high/plugin-trust-boundary`     | Встановлення Plugin, loader, manifest, registry, підготовка runtime-dependency, source-loading і довірчі поверхні контракту пакета Plugin SDK |

### Платформозалежні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Вивантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, відфільтровує результати збірки залежностей із вивантаженого SARIF і вивантажує під `/codeql-critical-security/macos`. Залишається поза щоденними типовими запусками, оскільки macOS-збірка домінує за часом виконання навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний shard безпеки, не пов’язаний із security. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: non-draft PR запускають лише відповідні shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді виконання команд/моделей/інструментів агента та reply dispatch, коді схеми/міграції/IO конфігурації, коді auth/secrets/sandbox/security, runtime core-каналів і bundled channel plugin, protocol/server-method Gateway, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality shards.

Ручний запуск приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`          | Автентифікація, секрети, пісочниця, Cron і код межі безпеки Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`            | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`   | Схеми протоколу Gateway і контракти серверних методів                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`   | Контракти реалізації основного каналу та вбудованого Plugin каналу                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`     | Виконання команд, маршрутизація моделі/провайдера, маршрутизація й черги автовідповідей, а також runtime-контракти площини керування ACP                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`    | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми SDK Plugin пам’яті, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішні механізми черги відповідей, черги доставки сесій, допоміжні засоби прив’язування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і CLI-контракти doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`   | Маршрутизація вхідних відповідей SDK Plugin, допоміжні засоби payload/розбиття на фрагменти/runtime для відповідей, параметри відповідей каналу, черги доставки та допоміжні засоби прив’язування сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`  | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, типові значення/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`           | Початкове завантаження керівного UI, локальне збереження, потоки керування Gateway і runtime-контракти площини керування задачами                                   |
| `/codeql-critical-quality/web-media-runtime-boundary` | Runtime-контракти основних web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                       |
| `/codeql-critical-quality/plugin-boundary`            | Контракти завантажувача, реєстру, публічної поверхні та точок входу SDK Plugin                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Опублікований вихідний код SDK Plugin на стороні пакета та допоміжні засоби контрактів пакетів Plugin                                                               |

Якість залишається окремою від безпеки, щоб знахідки щодо якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як обмежену або шардовану подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Агент документації

Робочий процес `Docs Agent` — це керована подіями лінія обслуговування Codex для підтримання наявної документації узгодженою з нещодавно інтегрованими змінами. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики через workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один щогодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це керована подіями лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цю денну перевірку активності. Лінія будує згрупований звіт продуктивності Vitest для всього набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт для всього набору й відхиляє зміни, що зменшують базову кількість тестів, які проходять. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а звіт для всього набору після агента має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде інтегровано, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати таку саму безпечну позицію drop-sudo, як агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для очищення дублікатів після інтеграції. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що інтегрований PR змерджено і що кожен дублікат має або спільне згадане issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні контрольні гейти та маршрутизація змін

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широка область CI-платформи:

- зміни core production запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише core test запускають тільки typecheck core test плюс core lint;
- зміни extension production запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише extension test запускають typecheck extension test плюс extension lint;
- зміни публічного SDK Plugin або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів (прогони Vitest для extension залишаються явною тестовою роботою);
- metadata-only version bumps для релізу запускають цільові перевірки версії/конфігурації/root-dependency;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе, зміни вихідного коду віддають перевагу явним зіставленням, потім sibling tests і залежним елементам import-graph. Shared group-room delivery config є одним із явних зіставлень: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб зміна спільного типового значення падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки широка для harness, що дешевий зіставлений набір не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із кореня репозиторію та віддавайте перевагу свіжому прогрітому box для широкого підтвердження. Перед витрачанням повільного gate на box, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко завершується з помилкою, коли обов’язкові root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість налагодження збою продуктового тесту. Для навмисних PR із великим видаленням установіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без output після sync. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
