---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується збоєм
    - Ви координуєте запуск або повторний запуск валідації релізу
summary: Граф завдань CI, шлюзи області, релізні парасольки та локальні еквіваленти команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T07:05:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

CI OpenClaw запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області та розгортають повний граф для release candidate і широкої валідації. Android-лінії залишаються opt-in через `include_android`. Покриття Plugin лише для релізу розміщене в окремому workflow [`Передреліз Plugin`](#plugin-prerelease) і запускається лише з [`Повної валідації релізу`](#full-release-validation) або через явний ручний dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені extensions і будує CI-маніфест   | Завжди для non-draft push і PR     |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для non-draft push і PR     |
| `security-dependency-audit`      | Аудит production lockfile без залежностей проти npm advisories                               | Завжди для non-draft push і PR     |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для non-draft push і PR     |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist для невикористаних файлів   | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки built-artifact і багаторазові downstream-артефакти     | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Shard-и тестів core Node, крім ліній channel, bundled, contract і extension                  | Зміни, релевантні для Node         |
| `check`                          | Sharded-еквівалент основного локального gate: prod-типи, lint, guards, test-типи і strict smoke | Зміни, релевантні для Node      |
| `check-additional`               | Architecture, boundary, extension-surface guards, package-boundary і gateway-watch shard-и   | Зміни, релевантні для Node         |
| `build-smoke`                    | Built-CLI smoke-тести і smoke для startup-memory                                             | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для built-artifact тестів каналів                                                | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Збірка сумісності з Node 22 і smoke-лінія                                                    | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки broken-link                                      | Документацію змінено              |
| `skills-python`                  | Ruff + pytest для Skills на базі Python                                                      | Зміни, релевантні для Python-skill |
| `checks-windows`                 | Windows-специфічні тести process/path плюс регресії shared runtime import specifier          | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія TypeScript-тестів macOS із використанням спільних built artifacts                      | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                               | Зміни, релевантні для macOS        |
| `android`                        | Android unit-тести для обох flavor-ів плюс одна debug APK збірка                             | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають без очікування важчих artifact і platform matrix завдань.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати щойно спільна збірка буде готова.
4. Після цього розгортаються важчі platform і runtime лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки shard-ів використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні збої shard-ів, але не стають у чергу після того, як увесь workflow уже витіснено. Автоматичний concurrency key CI версіонований (`CI-v7-*`), тож GitHub-side zombie у старій queue group не може безстроково блокувати новіші main-запуски. Ручні запуски повного suite використовують `CI-manual-v1-*` і не скасовують in-progress запуски.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Manual dispatch пропускає виявлення changed-scope і змушує preflight-маніфест поводитися так, ніби змінено кожну scoped-область.

- **Редагування CI workflow** перевіряють граф Node CI плюс workflow linting, але самі по собі не змушують запускати Windows, Android або macOS native builds; ці platform-лінії залишаються обмеженими змінами platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixtures і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only шлях маніфесту: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shard-и, bundled-plugin shard-и і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які швидке завдання перевіряє напряму.
- **Windows Node перевірки** обмежені Windows-специфічними process/path wrappers, npm/pnpm/UI runner helpers, package manager config і CI workflow surfaces, які виконують цю лінію; непов’язані зміни source, plugin, install-smoke і test-only залишаються на Linux Node лініях.

Найповільніші сімейства Node-тестів розділено або збалансовано, щоб кожне завдання залишалося малим без надмірного резервування runner-ів: channel contracts запускаються як три weighted shard-и, малі core unit лінії поєднані попарно, auto-reply запускається як чотири збалансовані worker-и (із reply subtree, розділеним на shard-и agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node завданнями замість очікування built artifacts. Широкі browser, QA, media і miscellaneous plugin тести використовують свої dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shard-и записують timing entries із використанням назви CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary роботу разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі незалежні guards конкурентно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard запускаються конкурентно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрано.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test лінія все ще компілює flavor із SMS/call-log BuildConfig flags, уникаючи дублювання debug APK packaging job під час кожного Android-релевантного push.

Shard `check-dependencies` запускає `pnpm deadcode:dependencies` (production-прохід Knip лише для залежностей, закріплений на найновішій версії Knip, із вимкненим minimum release age pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production-знахідки невикористаних файлів Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard для невикористаних файлів падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Ручні dispatch

Ручні CI dispatch запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну scoped-лінію, крім Android: Linux Node shard-и, bundled-plugin shard-и, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Окремі ручні CI dispatch запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker лінії виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatch-ить окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, тож повний suite для release candidate не скасовується іншим push або PR run на тому самому ref. Необов’язковий input `target_ref` дає довіреному caller змогу запустити цей граф для branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner-и

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, сегментовані перевірки контрактів каналів, сегменти `check`, крім lint, сегменти й агрегати `check-additional`, агрегатні верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; попередня перевірка install-smoke також використовує Ubuntu, розміщений на GitHub, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші сегменти plugins, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, сегменти тестів Linux Node, сегменти тестів вбудованих plugin, `android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, щоб 8 vCPU коштували більше, ніж заощаджували); Docker-збірки install-smoke (час очікування в черзі для 32-vCPU коштував більше, ніж заощаджував)                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` на `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |

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

`Full Release Validation` — це ручний об’єднувальний workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker release-path, live/E2E, OpenWebUI, parity QA Lab, Matrix і напрямків Telegram. Він також може запускати після публікації workflow `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`release_profile` керує широтою live/provider, що передається в release checks:

- `minimum` залишає найшвидші критичні для релізу напрями OpenAI/core.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку дорадчу матрицю provider/media.

Об’єднувальний workflow записує ідентифікатори запущених дочірніх запусків, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх запусків і додає таблиці найповільніших завдань для кожного дочірнього запуску. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання верифікатора, щоб оновити результат і підсумок часу об’єднувального workflow.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата релізу, `ci` лише для звичайного дочірнього повного CI, `release-checks` для кожного дочірнього релізного запуску або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` в об’єднувальному workflow. Це утримує повторний запуск невдалого релізного середовища обмеженим після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і до Docker workflow live/E2E release-path, і до сегмента package acceptance. Це зберігає байти пакета узгодженими між релізними середовищами й уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Сегменти Live та E2E

Дочірній release live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані сегменти через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені сегменти audio/video media та сегменти music, відфільтровані за provider

Це зберігає те саме файлове покриття, водночас полегшуючи повторний запуск і діагностику повільних збоїв live provider. Агрегатні назви сегментів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових повторних запусків.

Нативні сегменти live media запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; завдання media лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-підкріплені live-набори на звичайних виконавцях Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-підкріплені сегменти live model/backend використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Workflow live release один раз збирає й публікує цей образ, а потім сегменти Docker live model, Gateway, CLI backend, ACP bind і Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці сегменти незалежно перебудовують повну ціль source Docker, релізний запуск неправильно налаштований і витратить реальний час на дубльовані збірки образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить як «чи працює цей встановлюваний пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево джерел, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі використовують після встановлення або оновлення.

### Завдання

1. `resolve_package` виконує checkout `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує джерело, посилання workflow, посилання пакета, версію, SHA-256 і профіль у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний workflow завантажує цей артефакт, валідує інвентар tarball, за потреби готує Docker-образи package-digest і запускає вибрані Docker-напрями проти цього пакета замість пакування checkout workflow. Коли профіль вибирає кілька цільових `docker_lanes`, повторно використовуваний workflow готує пакет і спільні образи один раз, а потім розгалужує ці напрями як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` необов’язково викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, коли Package Acceptance розв’язав один; автономний запуск Telegram усе ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує workflow з помилкою, якщо розв’язання пакета, Docker acceptance або необов’язковий напрям Telegram завершилися збоєм.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, наприклад `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/стабільних версій.
- `source=ref` пакує довірену гілку, тег або повний commit SHA з `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або релізного тегу, встановлює залежності у detached worktree і пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надавати для артефактів, поширених зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/harness, який запускає тест. `package_ref` — це вихідний коміт, який пакується, коли `source=ref`. Це дає змогу поточному тестовому harness перевіряти старіші довірені вихідні коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти release-path з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugin, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова Telegram lane повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а опублікований шлях специфікації npm зберігається для автономних запусків.

Релізні перевірки викликають Package Acceptance із `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти release-path покривають перетин package/update/plugin lanes; Package Acceptance зберігає artifact-native перевірку сумісності bundled-channel, офлайн plugin і Telegram proof для того самого розв’язаного tarball пакета. Крос-OS релізні перевірки й далі покривають OS-специфічне onboarding, installer і platform behavior; package/update product validation має починатися з Package Acceptance. Windows packaged і installer fresh lanes також перевіряють, що встановлений пакет може імпортувати browser-control override з необробленого абсолютного Windows-шляху. Смоук OpenAI agent-turn для крос-OS за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо його задано, інакше `openai/gpt-5.4-mini`, щоб install і Gateway proof залишалися швидкими та детермінованими.

### Вікна сумісності із застарілими версіями

Package Acceptance має обмежені вікна сумісності із застарілими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені з tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може обрізати відсутні `pnpm.patchedDependencies` з fake git fixture, отриманого з tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати застарілі місця install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих config, і водночас усе ще вимагати, щоб install record і поведінка без повторного встановлення залишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні файли штампа build metadata, які вже були доставлені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови спричиняють помилку, а не попередження чи пропуск.

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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію і SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lanes, таймінги фаз і команди повторного запуску. Надавайте перевагу повторному запуску невдалого профілю пакета або точних Docker lanes замість повторного запуску повної релізної перевірки.

## Смоук-перевірка встановлення

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються поверхонь Docker/package, змін bundled plugin package/manifest або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише у вихідному коді bundled plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ кореневого Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним timeout команди 240 секунд (кожен Docker run сценарію обмежується окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних запланованих запусків, ручних dispatches, workflow-call release checks і pull requests, які справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі jobs, щоб installer work не чекав за root image smokes.

Пуші в `main` (включно з merge commits) не примушують повний шлях; коли changed-scope logic запросила б повне покриття на push, workflow зберігає швидкий Docker smoke і залишає повний install smoke для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо gated через `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow релізних перевірок, а ручні dispatches `Install Smoke` можуть увімкнути його, але pull requests і пуші в `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lanes;
- функціональний образ, який встановлює той самий tarball у `/app` для звичайних functionality lanes.

Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний plan. Scheduler вибирає образ для кожної lane за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає lanes з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштування

| Змінна                                | За замовчуванням | Призначення                                                                                          |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів main-pool для звичайних lanes.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів tail-pool, чутливого до провайдерів.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Обмеження паралельних live lanes, щоб провайдери не throttled.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Обмеження паралельних npm install lanes.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Обмеження паралельних multi-service lanes.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами lanes, щоб уникнути create storms Docker daemon; установіть `0`, щоб вимкнути затримку.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний timeout на lane (120 хвилин); вибрані live/tail lanes використовують жорсткіші обмеження.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план scheduler без запуску lanes.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список lanes; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу lane. |

Lane, важча за свій ефективний cap, усе ще може стартувати з порожнього pool, а потім працює сама, доки не звільнить capacity. Локальні aggregate preflights перевіряють Docker, видаляють застарілі OpenClaw E2E containers, виводять статус active-lane, зберігають таймінги lanes для впорядкування longest-first і за замовчуванням припиняють планувати нові pooled lanes після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credential потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей plan на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує package artifact поточного запуску, або завантажує package artifact з `package_artifact_run_id`; перевіряє tarball inventory; збирає і пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли plan потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Docker image pulls повторюються з обмеженим timeout 180 секунд на спробу, щоб завислий registry/cache stream швидко повторився, а не споживав більшу частину критичного шляху CI.

### Фрагменти release-path

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk завантажував лише потрібний image kind і виконував кілька lanes через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох ліній інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*` замість послідовної лінії «усе-в-одному» `bundled-channel-deps`.

OpenWebUI включається до `plugins-runtime-services`, коли це потрібно для повного покриття шляху релізу, і зберігає окремий фрагмент `openwebui` лише для диспетчеризацій тільки OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з журналами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами повторного запуску для кожної лінії. Вхід workflow `docker_lanes` запускає вибрані лінії проти підготовлених образів замість завдань фрагментів, що обмежує налагодження невдалої лінії одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди GitHub повторного запуску для кожної лінії включають `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати саме той пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір шляху релізу.

## Передреліз Plugin

`Plugin Prerelease` — дорожче покриття продукту/пакета, тому це окремий workflow, який запускається `Full Release Validation` або явним оператором. Звичайні pull request, пуші в `main` і окремі ручні диспетчеризації CI тримають цей набір вимкненим. Він балансує тести bundled plugin між вісьмома extension-воркерами; ці завдання шардів extension запускають до двох груп конфігурації plugin одночасно з одним Vitest-воркером на групу та більшим heap Node, щоб важкі на імпорти пакети plugin не створювали додаткових CI-завдань.

## QA Lab

QA Lab має виділені CI-лінії поза основним workflow зі smart-scope.

- Workflow `Parity gate` запускається на відповідних змінах PR і ручній диспетчеризації; він збирає приватний runtime QA і порівнює agentic-пакети mock GPT-5.5 та Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і за ручною диспетчеризацією; він розгалужує mock parity gate, live Matrix-лінію та live Telegram і Discord-лінії як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують lease-и Convex.

Перевірки релізу запускають live transport-лінії Matrix і Telegram з детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного старту provider-plugin. Live transport gateway вимикає пошук пам’яті, оскільки parity QA окремо покриває поведінку пам’яті; з’єднання провайдерів покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gates, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Типове значення CLI і ручний вхід workflow залишаються `all`; ручна диспетчеризація `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу лінії QA Lab перед затвердженням релізу; його QA parity gate запускає кандидатний і базовий пакети як паралельні завдання ліній, а потім завантажує обидва артефакти в невелике звітне завдання для фінального порівняння parity.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається runtime QA, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів розглядайте це як необов’язковий сигнал і дотримуйтеся доказів scoped CI/check.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security-сканером першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та guard-запуски для pull request не в draft сканують код Actions workflow плюс найризиковіші JavaScript/TypeScript-поверхні за допомогою security-запитів високої впевненості, відфільтрованих до high/critical `security-severity`.

Guard для pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security-матрицю, що й запланований workflow. Android і macOS CodeQL лишаються поза типовими PR-запусками.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, секрети, sandbox, cron і базова лінія gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core-каналу плюс runtime channel plugin, gateway, Plugin SDK, секрети, точки аудиту                              |
| `/codeql-security-high/network-ssrf-boundary`     | Поверхні core SSRF, парсингу IP, network guard, web-fetch і політики SSRF Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, helpers виконання процесів, outbound delivery і gates виконання інструментів агентом                                      |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри встановлення Plugin, loader, manifest, registry, runtime-dependency staging, source-loading і контракту пакета Plugin SDK |

### Платформоспецифічні security-шарди

- `CodeQL Android Critical Security` — запланований Android security-шард. Збирає Android-застосунок вручну для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security-шард. Збирає macOS-застосунок вручну для CodeQL на Blacksmith macOS, фільтрує результати збірки залежностей із завантаженого SARIF і завантажує під `/codeql-critical-security/macos`. Тримається поза щоденними типовими запусками, бо збірка macOS домінує час виконання навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний не-security шард. Він запускає лише error-severity, не-security JavaScript/TypeScript quality-запити на вузьких високоцінних поверхнях на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: PR не в draft запускають лише відповідні шарди `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін коду виконання agent command/model/tool і reply dispatch, коду config schema/migration/IO, коду auth/secrets/sandbox/security, core channel і runtime bundled channel plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або runtime reply Plugin SDK. Зміни CodeQL config і quality workflow запускають усі дванадцять PR quality-шардів.

Ручна диспетчеризація приймає:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є hooks для навчання/ітерації, щоб запускати один quality-шард ізольовано.

| Категорія                                             | Поверхня                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Автентифікація, секрети, пісочниця, Cron і код межі безпеки Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти серверних методів                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основних каналів і вбудованих Plugin каналів                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, маршрутизація моделей/провайдерів, маршрутизація й черги автовідповідей, а також runtime-контракти площини керування ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Сервери MCP і мости інструментів, допоміжні засоби нагляду за процесами та контракти вихідної доставки                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста пам’яті, фасади runtime пам’яті, псевдоніми SDK Plugin пам’яті, зв’язувальний код активації runtime пам’яті та команди doctor для пам’яті                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня логіка черги відповідей, черги доставки сесій, допоміжні засоби прив’язки/доставки вихідних сесій, поверхні діагностичних подій/пакетів логів і CLI-контракти doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Маршрутизація вхідних відповідей SDK Plugin, допоміжні засоби payload/розбиття на частини/runtime відповідей, параметри відповідей каналів, черги доставки та допоміжні засоби прив’язки сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація та виявлення провайдерів, реєстрація runtime провайдерів, типові налаштування/каталоги провайдерів і реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальне збереження, потоки керування Gateway і runtime-контракти площини керування завданнями                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Runtime-контракти основного web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та entrypoint SDK Plugin                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опублікований вихідний код SDK Plugin з боку пакета та допоміжні засоби контрактів пакетів Plugin                                                                  |

Якість залишається окремою від безпеки, щоб findings щодо якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих Plugin слід додавати назад як scoped або sharded follow-up роботу лише після того, як вузькі профілі матимуть стабільний runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Workflow `Docs Agent` — це подієво-керована лінія обслуговування Codex для підтримання наявної документації узгодженою з нещодавно landed змінами. Він не має чистого розкладу: успішний CI-запуск push без bot на `main` може його запустити, а ручний dispatch може запустити його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він працює, він переглядає діапазон комітів від попереднього непропущеного source SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з останнього проходу документації.

### Test Performance Agent

Workflow `Test Performance Agent` — це подієво-керована лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push без bot на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується в цей UTC-день. Ручний dispatch обходить цей щоденний activity gate. Лінія будує згрупований звіт продуктивності Vitest для повного набору тестів, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням coverage замість широких рефакторингів, потім повторно запускає звіт для повного набору та відхиляє зміни, які зменшують baseline кількість успішних тестів. Якщо baseline має failing тести, Codex може виправляти лише очевидні помилки, а after-agent звіт для повного набору має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push буде landed, лінія rebase-ить перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні stale patches пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб Codex action міг зберегти ту саму drop-sudo безпекову позицію, що й docs agent.

### Дублікати PR після merge

Workflow `Duplicate PRs After Merge` — це ручний maintainer workflow для очищення дублікатів після land. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що landed PR замержено і що кожен дублікат має або спільну referenced issue, або перекривні changed hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні check gates і changed routing

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний check gate суворіший щодо архітектурних меж, ніж широкий platform scope CI:

- зміни core production запускають core prod і core test typecheck плюс core lint/guards;
- зміни лише core test запускають тільки core test typecheck плюс core lint;
- зміни extension production запускають extension prod і extension test typecheck плюс extension lint;
- зміни лише extension test запускають extension test typecheck плюс extension lint;
- зміни публічного SDK Plugin або plugin-contract розширюються до extension typecheck, бо extensions залежать від цих core contracts (Vitest extension sweeps залишаються явною тестовою роботою);
- version bumps лише release metadata запускають targeted version/config/root-dependency checks;
- невідомі зміни root/config fail safe до всіх check lanes.

Локальний changed-test routing живе в `scripts/test-projects.test-support.mjs` і навмисно дешевший за `check:changed`: прямі правки тестів запускають самі себе, правки source віддають перевагу явним mappings, потім sibling tests і import-graph dependents. Shared group-room delivery config — одне з явних mappings: зміни group visible-reply config, source reply delivery mode або message-tool system prompt проходять через core reply tests плюс регресії доставки Discord і Slack, щоб shared default change впала до першого PR push. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки harness-wide, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із кореня repo і віддавайте перевагу свіжому warmed box для broad proof. Перед тим як витрачати повільний gate на box, який було перевикористано, термін дії якого минув або який щойно повідомив про несподівано великий sync, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity check швидко падає, коли потрібні root files, такі як `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 tracked deletions. Зазвичай це означає, що remote sync state не є надійною копією PR; зупиніть цей box і warm-ніть свіжий замість debugging product test failure. Для навмисних large-deletion PR установіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity run.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у sync phase понад п’ять хвилин без post-sync output. Установіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих local diffs.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
