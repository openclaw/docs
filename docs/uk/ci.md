---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI було або не було запущене
    - Ви налагоджуєте перевірку GitHub Actions, яка не проходить
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, гейти області дії, релізні парасолькові перевірки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T06:10:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e137eff9234d8a6beb559c5367de0c75f42b892dd69148e86feb7d68c49bf437
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається для кожного push у `main` і кожного pull request. Job `preflight` класифікує diff і вимикає витратні lanes, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне scoped-виконання та розгортають повний graph для release candidates і широкої перевірки. Android lanes залишаються opt-in через `include_android`. Покриття Plugin лише для release міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд Pipeline

| Job                              | Призначення                                                                                   | Коли запускається                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє docs-only зміни, змінені scopes, змінені extensions і будує CI manifest              | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                    | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Production lockfile audit без залежностей щодо npm advisories                                 | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий aggregate для швидких security jobs                                              | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production Knip dependency-only pass плюс guard allowlist невикористаних файлів              | Node-релевантні зміни              |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built artifacts і reusable downstream artifacts         | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux correctness lanes, як-от bundled/plugin-contract/protocol checks                 | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Sharded channel contract checks зі стабільним aggregate check result                          | Node-релевантні зміни              |
| `checks-node-core-test`          | Core Node test shards, крім channel, bundled, contract і extension lanes                      | Node-релевантні зміни              |
| `check`                          | Sharded еквівалент головного local gate: prod types, lint, guards, test types і strict smoke  | Node-релевантні зміни              |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shards     | Node-релевантні зміни              |
| `build-smoke`                    | Built-CLI smoke tests і startup-memory smoke                                                  | Node-релевантні зміни              |
| `checks`                         | Verifier для built-artifact channel tests                                                     | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Node 22 compatibility build і smoke lane                                                      | Ручний CI dispatch для releases    |
| `check-docs`                     | Docs formatting, lint і перевірки broken links                                                | Змінено docs                       |
| `skills-python`                  | Ruff + pytest для Python-backed skills                                                        | Python-skill-релевантні зміни      |
| `checks-windows`                 | Windows-specific process/path tests плюс shared runtime import specifier regressions          | Windows-релевантні зміни           |
| `macos-node`                     | macOS TypeScript test lane з використанням shared built artifacts                             | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, build і tests для macOS app                                                       | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс одна debug APK build                                 | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після trusted activity                             | Успіх Main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які lanes взагалі існують. Логіка `docs-scope` і `changed-scope` є steps усередині цього job, а не окремими jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix jobs.
3. `build-artifacts` перекривається зі швидкими Linux lanes, щоб downstream consumers могли стартувати одразу після готовності shared build.
4. Важчі platform і runtime lanes розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені jobs як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI noise, якщо найновіший run для того самого ref також не падає. Aggregate shard checks використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні shard failures, але не стають у чергу після того, як весь workflow уже був витіснений. Automatic CI concurrency key версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг безстроково блокувати новіші main runs. Ручні full-suite runs використовують `CI-manual-v1-*` і не скасовують in-progress runs.

## Scope і routing

Логіка scope міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає changed-scope detection і змушує preflight manifest поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** перевіряють Node CI graph плюс workflow linting, але самі собою не форсують Windows, Android або macOS native builds; ці platform lanes залишаються scoped до platform source changes.
- **CI routing-only edits, selected cheap core-test fixture edits і narrow plugin contract helper/test-routing edits** використовують швидкий Node-only manifest path: `preflight`, security і один task `checks-fast-core`. Цей path пропускає build artifacts, Node 22 compatibility, channel contracts, full core shards, bundled-plugin shards і additional guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** scoped до Windows-specific process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, що виконують цей lane; непов’язані source, plugin, install-smoke і test-only changes залишаються на Linux Node lanes.

Найповільніші сімейства Node tests розділено або збалансовано, щоб кожен job залишався малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, small core unit lanes об’єднані парами, auto-reply запускається як чотири balanced workers (із reply subtree, розділеним на agent-runner, dispatch і commands/state-routing shards), а agentic gateway/plugin configs розподілено між наявними source-only agentic Node jobs замість очікування built artifacts. Broad browser, QA, media і miscellaneous plugin tests використовують свої dedicated Vitest configs замість shared plugin catch-all. Include-pattern shards записують timing entries із назвою CI shard, тому `.artifacts/vitest-shard-timings.json` може відрізнити whole config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards concurrently в одному job. Gateway watch, channel tests і core support-boundary shard запускаються concurrently всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` вже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, уникаючи duplicate debug APK packaging job для кожного Android-relevant push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, pinned до latest Knip version, із вимкненим pnpm minimum release age для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює Knip production unused-file findings із `scripts/deadcode-unused-files.allowlist.mjs`. Unused-file guard падає, коли PR додає новий нерецензований unused file або залишає stale allowlist entry, водночас зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Ручні dispatches

Ручні CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожен non-Android scoped lane: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Standalone manual CI dispatches запускають Android лише з `include_android=true`; full release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, full extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Manual runs використовують унікальну concurrency group, тому release-candidate full suite не скасовується іншим push або PR run на тому самому ref. Optional input `target_ref` дає trusted caller змогу запустити цей graph для branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                      | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, сегментовані перевірки контрактів каналів, сегменти `check`, крім lint, сегменти й агрегати `check-additional`, верифікатори агрегатів тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші сегменти розширень, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, сегменти тестів Linux Node, сегменти тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час черги 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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

## Повна валідація релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає вручну workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження Plugin/пакетів/статичних артефактів/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram-ліній. Він також може запускати після публікації workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`release_profile` керує шириною live/provider, переданою в release checks:

- `minimum` залишає найшвидші критичні для релізу OpenAI/core лінії.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку advisory-матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного дочірнього full CI, `release-checks` для кожного релізного дочірнього запуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це утримує перезапуск невдалого релізного box у межах після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і в live/E2E release-path Docker workflow, і в сегмент package acceptance. Це зберігає байти пакета узгодженими між релізними box і уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live та E2E-сегменти

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані сегменти через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- відфільтровані за provider завдання `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- розділені audio/video сегменти media та відфільтровані за provider сегменти music

Це зберігає те саме файлове покриття, водночас спрощуючи перезапуск і діагностику повільних збоїв live provider. Агреговані назви сегментів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media-сегменти працюють у `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте live-набори з Docker на звичайних runner Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Live-сегменти моделей/backend на базі Docker використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає та публікує цей образ один раз, після чого Docker live model, Gateway, CLI backend, ACP bind і сегменти Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці сегменти самостійно перебудовують повну Docker-ціль source, release run налаштований неправильно й марнуватиме реальний час на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей інстальований пакет OpenClaw як продукт?» Він відрізняється від звичайного CI: звичайний CI валідує дерево source, тоді як package acceptance валідує один tarball через той самий Docker E2E harness, який користувачі запускають після інсталяції або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 і profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, валідує інвентар tarball, готує Docker-образи package-digest за потреби та запускає вибрані Docker-лінії проти цього пакета замість пакування workflow checkout. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow готує пакет і спільні образи один раз, а потім розгортає ці лінії як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав один; окремий запуск Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` провалює workflow, якщо package resolution, Docker acceptance або опційна Telegram-лінія завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable версій.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або з релізного тегу, встановлює залежності у від’єднаному worktree та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його слід надавати для артефактів, якими діляться зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає поточному тестовому harness змогу перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні фрагменти release-path Docker з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує offline-покриття plugins, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої специфікації npm збережено для автономних запусків.

Релізні перевірки викликають Package Acceptance із `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Фрагменти Docker release-path покривають перекривні лінії package/update/plugin; Package Acceptance зберігає artifact-native підтвердження сумісності bundled-channel, offline plugin і Telegram для того самого розв’язаного tarball пакета. Cross-OS релізні перевірки й далі покривають OS-специфічну адаптацію, інсталятор і поведінку платформи; перевірку product для package/update слід починати з Package Acceptance. Лінії Windows packaged та installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows. Cross-OS agent-turn smoke для OpenAI за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо він заданий, інакше `openai/gpt-5.4-mini`, щоб підтвердження встановлення та Gateway залишалося швидким і детермінованим.

### Вікна сумісності зі спадщиною

Package Acceptance має обмежені вікна сумісності зі спадщиною для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, не включені до tarball;
- `doctor-switch` може пропустити підвипадок persistence для `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` із фейкового git fixture, отриманого з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати застарілі розташування install-record або приймати відсутню persistence marketplace install-record;
- `plugin-update` може дозволяти міграцію metadata конфігурації, водночас і далі вимагаючи, щоб install record і поведінка без перевстановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про файли stamp metadata локального build, які вже були поставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови завершуються помилкою, а не попередженням чи пропуском.

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

Під час налагодження невдалого запуску package acceptance почніть із підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю package або точних Docker-ліній замість повторного запуску повної релізної перевірки.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/package поверхонь, змін package/manifest у bundled plugin або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише source у bundled plugin, зміни лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає image root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin у межах 240-секундного сукупного timeout команди (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install та installer Docker/update покриття для нічних запланованих запусків, ручних dispatches, workflow-call релізних перевірок і pull requests, які справді торкаються installer/package/Docker поверхонь. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі jobs, щоб робота installer не чекала за root image smokes.

Пуші в `main` (зокрема merge commits) не примушують запускати повний шлях; коли логіка changed-scope вимагала б повного покриття під час push, workflow зберігає fast Docker smoke і залишає full install smoke для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо керується через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow релізних перевірок, а ручні dispatches `Install Smoke` можуть увімкнути його, але pull requests і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні images `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний image, який встановлює той самий tarball у `/app` для звичайних функціональних ліній.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає image для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | Значення за замовчуванням | Призначення                                                                                       |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів main-pool для звичайних ліній.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-pool, чутливого до provider.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live-ліній, щоб providers не застосовували throttling.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних ліній npm install.                                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних multi-service ліній.                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникнути create storms Docker daemon; задайте `0`, щоб вимкнути stagger. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний timeout для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план scheduler без запуску ліній.                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Локальний aggregate виконує preflight Docker, видаляє застарілі OpenClaw E2E containers, виводить status активних ліній, зберігає таймінги ліній для впорядкування longest-first і за замовчуванням припиняє планувати нові pooled лінії після першої помилки.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує `scripts/test-docker-all.mjs --plan-json`, які package, image kind, live image, lane і credential coverage потрібні. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, або завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає та пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує ліній із установленим package; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Docker image pulls повторюються з обмеженим 180-секундним timeout на спробу, щоб завислий registry/cache stream швидко повторився замість споживання більшої частини критичного шляху CI.

### Фрагменти release-path

Релізне Docker-покриття запускає менші chunked jobs із `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому kind image і виконував кілька ліній через той самий зважений scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні фрагменти Docker для випуску: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами для plugin/runtime. Псевдонім смуги `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох смуг інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені смуги `bundled-channel-*` і `bundled-channel-update-*` замість послідовної універсальної смуги `bundled-channel-deps`.

OpenWebUI включається в `plugins-runtime-services`, коли повне покриття шляху випуску цього вимагає, і зберігає окремий фрагмент `openwebui` лише для dispatch-запусків, що стосуються тільки OpenWebUI. Смуги оновлення bundled-channel повторюють спробу один раз для тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` із журналами смуг, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Вхід workflow `docker_lanes` запускає вибрані смуги проти підготовлених образів замість завдань фрагментів, що обмежує налагодження невдалої смуги одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є live Docker-смугою, цільове завдання локально збирає образ live-test для такого повторного запуску. Згенеровані команди GitHub для повторного запуску окремих смуг містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала смуга могла повторно використати точні пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір для шляху випуску.

## Попередній випуск Plugin

`Plugin Prerelease` — це дорожче покриття продукту/пакета, тому воно є окремим workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, push до `main` і окремі ручні CI dispatch-запуски залишають цей набір вимкненим. Він балансує тести bundled plugin між вісьмома extension workers; ці shard-завдання розширень запускають до двох груп конфігурації plugin одночасно з одним Vitest worker на групу й більшим heap Node, щоб насичені імпортами пакети plugin не створювали додаткових CI-завдань.

## QA Lab

QA Lab має виділені CI-смуги поза основним smart-scoped workflow.

- Workflow `Parity gate` запускається для відповідних змін PR і ручного dispatch; він збирає приватний runtime QA та порівнює агентні пакети mock GPT-5.5 і Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і під час ручного dispatch; він розгортає mock parity gate, live-смугу Matrix і live-смуги Telegram та Discord як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Перевірки випуску запускають live transport-смуги Matrix і Telegram із детермінованим mock provider та mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live model і звичайного запуску provider-plugin. Live transport gateway вимикає пошук пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; зв’язність провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і release-gate запусків, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Стандартне значення CLI і ручний вхід workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди ділить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для випуску смуги QA Lab перед затвердженням випуску; його QA parity gate запускає кандидатні та базові пакети як паралельні lane-завдання, а потім завантажує обидва артефакти в невелике report-завдання для фінального порівняння parity.

Не ставте шлях landing для PR за `Parity gate`, якщо зміна фактично не торкається runtime QA, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і спирайтеся на scoped CI/check докази.

## CodeQL

Workflow `CodeQL` навмисно є вузьким первинним сканером безпеки, а не повним скануванням репозиторію. Щоденні, ручні й guard-запуски для non-draft pull request сканують код Actions workflow плюс найризиковіші поверхні JavaScript/TypeScript за допомогою high-confidence security queries, відфільтрованих до high/critical `security-severity`.

Guard для pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і виконує ту саму high-confidence security matrix, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базова лінія gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel плюс runtime channel plugin, gateway, Plugin SDK, secrets, audit touchpoints                         |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні core SSRF, IP parsing, network guard, web-fetch і політики SSRF у Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, process execution helpers, outbound delivery і agent tool-execution gates                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри для install plugin, loader, manifest, registry, runtime-dependency staging, source-loading і package contract Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Збирає Android app вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Збирає macOS app вручну для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Залишається поза щоденними стандартними запускми, оскільки macOS build домінує час виконання навіть коли чистий.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security shard. Він запускає лише error-severity, non-security JavaScript/TypeScript quality queries на вузьких high-value поверхнях на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: non-draft PR запускають лише відповідні shards `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у auth/secrets/sandbox/security code, channel runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни CodeQL config і quality workflow запускають усі десять PR quality shards.

Ручний dispatch приймає:

```
profile=all|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі — це teaching/iteration hooks для запуску одного quality shard ізольовано.

| Категорія                                                | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Код межі безпеки автентифікації, секретів, sandbox, cron і Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основних каналів                                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, маршрутизація моделей/провайдерів, маршрутизація та черги автовідповідей, а також runtime-контракти control plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, runtime-фасади пам’яті, псевдоніми SDK пам’яті Plugin, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сеансів, допоміжні засоби прив’язування/доставки вихідних сеансів, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сеансів |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Вхідна маршрутизація відповідей SDK Plugin, допоміжні засоби payload/розбиття на частини/runtime для відповідей, параметри відповіді каналу, черги доставки та допоміжні засоби прив’язування сеансів/потоків             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, стандартні налаштування/каталоги провайдерів і реєстри web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Завантаження Control UI, локальне збереження, потоки керування Gateway і runtime-контракти control plane задач                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Контракти runtime для основних web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint SDK Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований вихідний код SDK Plugin з боку пакета та допоміжні засоби контракту пакета plugin                                                                                      |

Якість залишається окремою від безпеки, щоб знахідки якості можна було планувати, вимірювати, вимикати або розширювати без розмивання сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси супроводу

### Агент документації

Робочий процес `Docs Agent` — це подієво-керована лінія супроводу Codex для підтримання наявної документації узгодженою з нещодавно landed змінами. Він не має суто розкладу: успішний CI-запуск для неботівського push на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він запускається, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це подієво-керована лінія супроводу Codex для повільних тестів. Він не має суто розкладу: успішний CI-запуск для неботівського push на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього UTC-дня. Ручний dispatch обходить цей денний gate активності. Лінія будує згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо baseline має тести, що падають, Codex може виправляти лише очевидні помилки, а звіт повного набору після агента має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде landed, лінія робить rebase перевіреного patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберегти таку саму drop-sudo позицію безпеки, як агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що landed PR злито і що кожен дублікат має або спільну referenced issue, або перетин змінених hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і маршрутизація змін

Логіка локальних changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий scope платформи CI:

- зміни core production запускають typecheck core prod і core test плюс core lint/guards;
- зміни лише core test запускають тільки typecheck core test плюс core lint;
- зміни extension production запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише extension test запускають typecheck extension test плюс extension lint;
- зміни публічного SDK Plugin або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core contracts (sweeps Vitest для extension залишаються явною тестовою роботою);
- metadata-only підняття версії для релізу запускають цільові перевірки version/config/root-dependency;
- невідомі root/config зміни безпечно падають до всіх check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе, редагування вихідного коду віддають перевагу явним mappings, потім sibling tests і залежним з import graph. Конфігурація доставки спільної group-room є одним із явних mappings: зміни до конфігурації visible-reply групи, режиму доставки source reply або system prompt message-tool маршрутизуються через core reply tests плюс регресії доставки Discord і Slack, щоб зміна спільного default впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки широка для harness, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію і віддавайте перевагу свіжому warmed box для широкого proof. Перед витрачанням повільного gate на box, який був повторно використаний, протермінований або щойно повідомив про неочікувано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root files, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що стан remote sync не є надійною копією PR; зупиніть цей box і warm свіжий замість debug збою product test. Для навмисних PR з великим видаленням встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі sync понад п’ять хвилин без post-sync output. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих local diffs.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
