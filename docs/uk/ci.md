---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, перевірки за областю, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T06:19:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c3a5319bb95ac871fb5ec78d0fc859af05f122b18722a878ecf359ab5e96a9a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для release candidates і широкої валідації. Android lanes залишаються опційними через `include_android`. Покриття Plugin лише для release міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені extensions і будує CI manifest           | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і audit workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Audit production lockfile без залежностей щодо npm advisories                                | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                             | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production Knip прохід лише для залежностей плюс guard allowlist невикористаних файлів       | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і багаторазові downstream artifacts     | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded перевірки channel contract зі стабільним aggregate check result                      | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Core Node test shards, окрім channel, bundled, contract і extension lanes                    | Зміни, релевантні для Node         |
| `check`                          | Sharded еквівалент головного local gate: prod types, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards    | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                 | Зміни, релевантні для Node         |
| `checks`                         | Verifier для built-artifact channel tests                                                    | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                     | Ручний CI dispatch для releases    |
| `check-docs`                     | Форматування docs, lint і перевірки broken links                                             | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions         | Зміни, релевантні для Windows      |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                            | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                      | Зміни, релевантні для macOS        |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна Codex оптимізація slow-test після trusted activity                                   | Main CI success або manual dispatch |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps усередині цього job, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко завершуються з помилкою, не чекаючи важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати щойно shared build буде готовий.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як CI noise, якщо найновіший run для того самого ref також не завершується помилкою. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні shard failures, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний CI concurrency key версійований (`CI-v7-*`), щоб zombie на стороні GitHub у старій queue group не міг безкінечно блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Область і routing

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожну scoped area було змінено.

- **Редагування CI workflow** перевіряють Node CI graph плюс workflow linting, але самі по собі не примушують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, вибрані дешеві core-test fixture edits і вузькі plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і одне завдання `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші Node test families розділено або збалансовано, щоб кожен job залишався малим без надмірного резервування runners: channel contracts виконуються як три weighted shards, small core unit lanes поєднуються парами, auto-reply запускається як чотири balanced workers (з reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподіляються між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries з використанням CI shard name, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої small independent guards паралельно всередині одного job. Gateway watch, channel tests і core support-boundary shard виконуються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor з SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job під час кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до найновішої версії Knip, з вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard завершується помилкою, коли PR додає новий unreviewed unused file або залишає stale allowlist entry, зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Ручні dispatches

Ручні CI dispatches запускають той самий job graph, що й normal CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` запускає окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, щоб release-candidate full suite не скасовувався іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає змогу trusted caller запустити цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                      | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованого набору, сегментовані перевірки контрактів каналів, сегменти `check`, окрім lint, сегменти й агрегати `check-additional`, агреговані перевірки тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла ставати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші сегменти розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, сегменти тестів Linux Node, сегменти тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, що 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі для 32 vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                               |
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
```

## Повна валідація випуску

`Full Release Validation` — це ручний парасольковий workflow для "запустити все перед випуском". Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для release-only доказів Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, приймання пакета, наборів шляхів випуску Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram. Він також може запускати workflow `NPM Telegram Beta E2E` після публікації, коли надано специфікацію опублікованого пакета.

`release_profile` керує шириною live/provider, що передається в перевірки випуску:

- `minimum` залишає найшвидші критичні для випуску лінії OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку матрицю advisory provider/media.

Парасольковий workflow записує ідентифікатори запущених дочірніх виконань, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх виконань і додає таблиці найповільніших завдань для кожного дочірнього виконання. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання перевірки, щоб оновити результат парасолькового workflow і підсумок часу.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата випуску, `ci` лише для звичайного повного дочірнього CI, `release-checks` для кожного дочірнього випуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольковому workflow. Це утримує перезапуск збійного release box у межах після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E Docker workflow шляху випуску, і в сегмент приймання пакета. Це зберігає байти пакета узгодженими між release box і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live та E2E сегменти

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані сегменти через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- фільтровані за provider завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені media-сегменти audio/video і фільтровані за provider music-сегменти

Це зберігає те саме файлове покриття, водночас полегшуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви сегментів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media-сегменти працюють у `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних runner Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live model/backend segments використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Workflow live release збирає й публікує цей образ один раз, після чого Docker live model, gateway, CLI backend, ACP bind і Codex harness сегменти запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці сегменти незалежно перебудовують повну source Docker target, release run налаштовано неправильно, і він марнуватиме wall clock на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання таке: "чи працює цей встановлюваний пакет OpenClaw як продукт?" Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як приймання пакета перевіряє один tarball через той самий Docker E2E harness, який користувачі виконують після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить джерело, workflow ref, package ref, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker lanes проти цього пакета замість пакування workflow checkout. Коли профіль вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгортає ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` опціонально викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав його; самостійний Telegram dispatch усе ще може встановити опубліковану npm-специфікацію.
4. `summary` провалює workflow, якщо розв’язання пакета, Docker acceptance або опціональна Telegram lane завершилися збоєм.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію випуску OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або з тегу випуску, встановлює залежності у від’єднаному робочому дереві та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надати для артефактів, які поширюються назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/обв’язки, який запускає тест. `package_ref` — це коміт джерела, який пакується, коли `source=ref`. Це дає змогу поточній тестовій обв’язці перевіряти старі довірені коміти джерела без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти шляху випуску з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття Plugin, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова смуга Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях специфікації опублікованого npm зберігається для окремих ручних запусків.

Перевірки випуску викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти шляху випуску покривають смуги package/update/plugin, що перетинаються; Package Acceptance зберігає артефактно-нативну сумісність bundled-channel, офлайн Plugin і доказ Telegram для того самого розв’язаного tarball пакета. Перевірки випуску на різних ОС і далі покривають специфічні для ОС onboarding, інсталятор і поведінку платформи; перевірку продукту package/update слід починати з Package Acceptance. Смуги Windows packaged та installer fresh також перевіряють, що встановлений пакет може імпортувати перевизначення browser-control із сирого абсолютного шляху Windows. Smoke OpenAI agent-turn на різних ОС типово використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли він заданий, інакше `openai/gpt-5.4-mini`, щоб доказ встановлення й Gateway залишався швидким і детермінованим.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені вікна сумісності зі спадковими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може вилучати відсутні `pnpm.patchedDependencies` із фіктивної git-фікстури, отриманої з tarball, і може логувати відсутній збережений `update.channel`;
- smoke-тести Plugin можуть читати спадкові розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, але все одно вимагати, щоб install record і поведінка без перевстановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампів метаданих збірки, які вже були доставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням чи пропуском.

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

Під час налагодження невдалого запуску приймання пакета починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи смуг, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-смуг замість повторного запуску повної перевірки випуску.

## Smoke встановлення

Окремий workflow `Install Smoke` повторно використовує той самий scope-скрипт через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, які торкаються поверхонь Docker/package, змін пакетів/маніфестів bundled Plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke-завдання. Зміни лише джерела bundled Plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним тайм-аутом команди 240 секунд (кожен Docker-запуск сценарію обмежений окремо).
- **Повний шлях** зберігає встановлення QR-пакета та Docker/update-покриття інсталятора для нічних запланованих запусків, ручних dispatch, workflow-call перевірок випуску та pull request, які справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR smoke-образ кореневого Dockerfile, а потім запускає встановлення QR-пакета, smoke-тести кореневого Dockerfile/gateway, smoke-тести installer/update і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала за smoke-тестами кореневого образу.

Пуші в `main` (зокрема merge-коміти) не примушують повний шлях; коли логіка changed-scope запитувала б повне покриття під час push, workflow залишає швидкий Docker smoke і передає повний install smoke нічній або релізній перевірці.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow перевірок випуску, а ручні dispatch `Install Smoke` можуть увімкнути його, але pull request і пуші в `main` — ні. QR і Docker-тести інсталятора зберігають власні Dockerfile, зосереджені на встановленні.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test образ, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- мінімальний runner Node/Git для смуг installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних функціональних смуг.

Визначення Docker-смуг містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної смуги за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає смуги з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштовувані параметри

| Змінна                                | Типово  | Призначення                                                                                   |
| ------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`     | 10      | Кількість слотів основного пулу для звичайних смуг.                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-пулу, чутливого до провайдерів.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`      | 9       | Ліміт паралельних live-смуг, щоб провайдери не throttled.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`       | 10      | Ліміт паралельних смуг встановлення npm.                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`   | 7       | Ліміт паралельних багатосервісних смуг.                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами смуг, щоб уникати штормів створення Docker daemon; задайте `0`, щоб вимкнути затримку. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` | 7200000 | Резервний тайм-аут на смугу (120 хвилин); вибрані live/tail-смуги використовують жорсткіші ліміти. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`         | unset   | `1` виводить план планувальника без запуску смуг.                                             |
| `OPENCLAW_DOCKER_ALL_LANES`           | unset   | Розділений комами точний список смуг; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу смугу. |

Смуга, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім виконується сама, доки не звільнить місткість. Локальні сукупні preflight перевіряють Docker, видаляють застарілі контейнери OpenClaw E2E, виводять статус активних смуг, зберігають таймінги смуг для впорядкування від найдовших і типово припиняють планувати нові pooled-смуги після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, яке покриття пакета, типу образу, live-образу, смуги та облікових даних потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і підсумки. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє інвентар tarball; збирає та публікує позначені digest пакета bare/functional GHCR Docker E2E образи через Docker layer cache Blacksmith, коли план потребує смуг із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest образи замість повторної збірки. Docker image pulls повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий registry/cache stream швидко повторився, а не спожив більшу частину критичного шляху CI.

### Фрагменти шляху випуску

Docker-покриття випуску запускає менші chunked-завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу й виконував кілька смуг через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні фрагменти Docker для релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` через `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами Plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим ручним псевдонімом повторного запуску для обох ліній інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*` замість послідовної універсальної лінії `bundled-channel-deps`.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття релізного шляху цього потребує, і зберігає окремий фрагмент `openwebui` лише для диспетчеризацій, що стосуються тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід `docker_lanes` робочого процесу запускає вибрані лінії проти підготовлених образів замість завдань фрагментів, що утримує налагодження невдалих ліній у межах одного цільового Docker-завдання та готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає образ live-тесту для цього повторного запуску. Згенеровані для кожної лінії команди повторного запуску GitHub містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований робочий процес live/E2E щодня запускає повний Docker-набір релізного шляху.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям продукту/пакета, тому це окремий робочий процес, який запускається `Full Release Validation` або явним оператором. Звичайні pull requests, пуші в `main` і окремі ручні запускання CI тримають цей набір вимкненим. Він балансує тести bundled Plugin між вісьмома extension workers; ці завдання сегментів extension запускають до двох груп конфігурації Plugin одночасно з одним Vitest worker на групу та більшим heap Node, щоб batch-и Plugin з інтенсивним імпортом не створювали додаткових CI-завдань.

## QA Lab

QA Lab має виділені CI-лінії поза основним workflow зі smart-scoped.

- Робочий процес `Parity gate` запускається на відповідні зміни PR і ручну диспетчеризацію; він збирає приватний runtime QA та порівнює agentic packs mock GPT-5.5 і Opus 4.6.
- Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручної диспетчеризації; він розгортає mock parity gate, live Matrix-лінію та live Telegram і Discord-лінії як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Релізні перевірки запускають live transport-лінії Matrix і Telegram з детермінованим mock-провайдером і mock-qualified моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport gateway вимикає пошук у пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gate-ів, додаючи `--fail-fast` лише тоді, коли checkout-нутий CLI це підтримує. Типове значення CLI і вхід ручного workflow залишаються `all`; ручна диспетчеризація `matrix_profile=all` завжди шардить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає релізно-критичні лінії QA Lab перед схваленням релізу; його QA parity gate запускає candidate і baseline packs як паралельні завдання ліній, а потім завантажує обидва артефакти в невелике report-завдання для фінального порівняння parity.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не зачіпає QA runtime, parity model-pack або поверхню, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і натомість спирайтеся на evidence зі scoped CI/check.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним sweep репозиторію. Щоденні, ручні та guard-запуски для non-draft pull request сканують код workflow Actions плюс найбільш ризикові поверхні JavaScript/TypeScript із high-confidence security queries, відфільтрованими до high/critical `security-severity`.

Guard для pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять до PR-типових значень.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і gateway baseline                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації основного каналу плюс runtime Plugin каналу, gateway, Plugin SDK, secrets, audit touchpoints                      |
| `/codeql-security-high/network-ssrf-boundary`     | Основні поверхні SSRF, IP parsing, network guard, web-fetch і політики SSRF Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для встановлення Plugin, loader, manifest, registry, runtime-dependency staging, source-loading і package contract Plugin SDK |

### Платформозалежні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Вручну збирає Android app для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Вручну збирає macOS app для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза щоденними типовими значеннями, бо macOS build домінує runtime навіть коли він чистий.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний shard безпеки, що не стосується security. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value поверхнях на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований profile: non-draft PR запускають лише відповідні shards `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у config schema/migration/IO code, auth/secrets/sandbox/security code, channel runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни конфігурації CodeQL і quality workflow запускають усі одинадцять PR quality shards.

Ручна диспетчеризація приймає:

```
profile=all|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є hooks для навчання/ітерації, щоб запускати один quality shard ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, пісочниці, Cron і Gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основних каналів                                                                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація й черги автовідповідей, а також runtime-контракти площини керування ACP                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, помічники нагляду за процесами та контракти вихідної доставки                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади runtime пам’яті, псевдоніми SDK пам’яті Plugin, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сеансів, помічники прив’язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сеансів |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Вхідна диспетчеризація відповідей Plugin SDK, помічники payload/chunking/runtime для відповідей, параметри відповідей каналів, черги доставки та помічники прив’язування сеансів/потоків |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація й виявлення провайдерів, реєстрація runtime провайдерів, стандартні налаштування/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Завантаження Control UI, локальне збереження, потоки керування Gateway і runtime-контракти площини керування завданнями                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти runtime для основних web fetch/search, media IO, розуміння медіа, image-generation і media-generation                                                           |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане джерело Plugin SDK на боці пакета та помічники контрактів пакетів plugin                                                                                     |

Якість залишається окремо від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати, не затемнюючи сигнал безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це подієво-керована гілка обслуговування Codex для підтримання наявної документації в узгодженому стані з нещодавно внесеними змінами. Вона не має чистого розкладу: успішний CI-запуск non-bot push на `main` може її запустити, а ручний dispatch може запустити її напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Під час запуску вона переглядає діапазон комітів від попереднього непропущеного вихідного SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це подієво-керована гілка обслуговування Codex для повільних тестів. Вона не має чистого розкладу: успішний CI-запуск non-bot push на `main` може її запустити, але вона пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього дня за UTC. Ручний dispatch обходить цей денний запобіжник активності. Гілка створює grouped-звіт продуктивності Vitest для повного набору, дозволяє Codex вносити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, що зменшують базову кількість прохідних тестів. Якщо базова лінія має failing тести, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти, перш ніж щось буде закомічено. Коли `main` просувається до того, як bot push потрапить у репозиторій, гілка перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму позицію безпеки drop-sudo, що й docs agent.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний workflow для maintainer після-land очищення дублікатів. За замовчуванням він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед зміною GitHub він перевіряє, що landed PR злито, і що кожен дублікат має або спільну згадану issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація змін

Локальна логіка changed-lane міститься в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope CI-платформи:

- зміни core production запускають typecheck core prod і core test, а також core lint/guards;
- зміни лише core test запускають тільки typecheck core test і core lint;
- зміни extension production запускають typecheck extension prod і extension test, а також extension lint;
- зміни лише extension test запускають typecheck extension test і extension lint;
- зміни public Plugin SDK або plugin-contract розширюються до typecheck extensions, бо extensions залежать від цих core контрактів (sweeps Vitest extensions залишаються явною тестовою роботою);
- version bumps лише release metadata запускають цільові перевірки version/config/root-dependency;
- невідомі зміни root/config безпечно падають до всіх check lanes.

Локальна маршрутизація changed-test міститься в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерел віддають перевагу явним мапінгам, потім sibling tests і залежним з import-graph. Shared group-room delivery config є одним із явних мапінгів: зміни до group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб спільна зміна за замовчуванням падала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки широка на рівні harness, що дешевий mapped set не є надійним проксі.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію й віддавайте перевагу свіжому warmed box для широкого proof. Перед витрачанням повільного gate на box, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root файли, такі як `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість того, щоб налагоджувати збій product test. Для навмисних PR з великим видаленням встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без post-sync output. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diffs.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
