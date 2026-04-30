---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте перевірку GitHub Actions, що завершується з помилкою.
    - Ви координуєте запуск або повторний запуск перевірки релізу
summary: Граф завдань CI, гейти області дії, парасолькові групи випуску та еквіваленти локальних команд
title: CI-конвеєр
x-i18n:
    generated_at: "2026-04-30T05:31:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82f6a98ad0066bd6c7804b025e9ec024f4e76f9f5964e39573fee1212bad99fa
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінилися лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для кандидатів на реліз і широкої валідації. Лінії Android залишаються опційними через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Plugin Prerelease`](#plugin-prerelease) і запускається лише з [`Full Release Validation`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в docs, змінені області, змінені розширення та будує маніфест CI          | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей щодо npm advisories                                | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких security-завдань                                            | Завжди для нечернеткових push і PR |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist невикористаних файлів       | Зміни, релевантні для Node         |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані артефакти нижче за потоком | Зміни, релевантні для Node         |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от перевірки bundled/plugin-contract/protocol             | Зміни, релевантні для Node         |
| `checks-fast-contracts-channels` | Sharded-перевірки контрактів каналів зі стабільним агрегованим результатом перевірки         | Зміни, релевантні для Node         |
| `checks-node-core-test`          | Шарди основних Node-тестів, без ліній каналів, bundled, contract і extension                 | Зміни, релевантні для Node         |
| `check`                          | Sharded-еквівалент головного локального gate: production-типи, lint, guards, test types і strict smoke | Зміни, релевантні для Node         |
| `check-additional`               | Архітектура, boundary, guards поверхні extension, package-boundary і gateway-watch шарди     | Зміни, релевантні для Node         |
| `build-smoke`                    | Smoke-тести зібраного CLI та smoke startup-memory                                            | Зміни, релевантні для Node         |
| `checks`                         | Верифікатор для channel-тестів зібраних артефактів                                          | Зміни, релевантні для Node         |
| `checks-node-compat-node22`      | Лінія збірки та smoke для сумісності з Node 22                                               | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування docs, lint і перевірки битих посилань                                          | Docs змінено                       |
| `skills-python`                  | Ruff + pytest для Skills із Python-підтримкою                                                | Зміни, релевантні для Python Skills |
| `checks-windows`                 | Windows-специфічні тести процесів/шляхів плюс регресії спільних runtime import specifier    | Зміни, релевантні для Windows      |
| `macos-node`                     | Лінія TypeScript-тестів macOS зі спільними зібраними артефактами                             | Зміни, релевантні для macOS        |
| `macos-swift`                    | Swift lint, збірка й тести для застосунку macOS                                             | Зміни, релевантні для macOS        |
| `android`                        | Android unit-тести для обох flavor плюс одна збірка debug APK                                | Зміни, релевантні для Android      |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх Main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи на важчі завдання матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати щойно спільна збірка готова.
4. Важчі платформні та runtime-лінії розгортаються після цього: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати витіснені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Сприймайте це як шум CI, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки шардів використовують `!cancelled() && always()`, тож вони все одно повідомляють нормальні збої шардів, але не стають у чергу після того, як увесь workflow уже витіснено. Автоматичний concurrency key CI версіонований (`CI-v7-*`), щоб GitHub-side zombie у старій queue group не міг нескінченно блокувати новіші main-запуски. Ручні запуски повного suite використовують `CI-manual-v1-*` і не скасовують запуски, що вже виконуються.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає changed-scope detection і змушує маніфест preflight поводитися так, ніби кожна scoped area змінилася.

- **Редагування CI workflow** валідують граф Node CI плюс linting workflow, але самі по собі не примушують Windows, Android або macOS native builds; ці платформні лінії залишаються обмеженими змінами platform source.
- **Редагування лише CI routing, вибрані дешеві редагування core-test fixture і вузькі редагування plugin contract helper/test-routing** використовують швидкий Node-only шлях маніфесту: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, channel contracts, повні core shards, bundled-plugin shards і додаткові guard matrices, коли зміна обмежена routing або helper surfaces, які fast task перевіряє напряму.
- **Windows Node checks** обмежені Windows-специфічними wrappers процесів/шляхів, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, що виконують цю лінію; непов’язані зміни source, plugin, install-smoke і test-only залишаються на Linux Node lanes.

Найповільніші сімейства Node-тестів розділені або збалансовані, щоб кожне завдання залишалося малим без надмірного резервування runners: channel contracts запускаються як три weighted shards, малі core unit lanes об’єднані в пари, auto-reply запускається як чотири balanced workers (із reply subtree, розділеним на шарди agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs розподілені між наявними source-only agentic Node jobs замість очікування built artifacts. Широкі browser, QA, media та miscellaneous plugin tests використовують свої dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries з назвою CI shard, щоб `.artifacts/vitest-shard-timings.json` міг відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює runtime topology architecture від gateway watch coverage; boundary guard shard запускає свої малі independent guards паралельно всередині одного завдання. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test lane все одно компілює flavor із SMS/call-log BuildConfig flags, водночас уникаючи дубльованого debug APK packaging job на кожному Android-relevant push.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies` (production-прохід Knip лише для залежностей, pinned до найновішої версії Knip, із вимкненим minimum release age pnpm для `dlx` install) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip із `scripts/deadcode-unused-files.allowlist.mjs`. Guard невикористаних файлів падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий allowlist entry, зберігаючи intentional dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично розв’язати.

## Ручні dispatches

Ручні CI dispatches запускають той самий job graph, що й звичайний CI, але примусово вмикають кожну scoped lane не для Android: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Самостійні ручні CI dispatches запускають Android лише з `include_android=true`; повна релізна парасолька вмикає Android, передаючи `include_android=true`. Plugin prerelease static checks, release-only shard `agentic-plugins`, повний extension batch sweep і plugin prerelease Docker lanes виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим release-validation gate.

Ручні запуски використовують унікальну concurrency group, щоб повний suite release-candidate не скасовувався іншим push або PR run на тому самому ref. Опційний input `target_ref` дає довіреному caller змогу запустити цей graph проти branch, tag або full commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Виконавець                       | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання й агрегати безпеки (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованих компонентів, шардовані перевірки контрактів каналів, шарди `check`, крім lint, шарди й агрегати `check-additional`, агреговані верифікатори тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди Linux Node test, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж заощаджували); install-smoke Docker builds (вартість часу в черзі для 32-vCPU була більшою, ніж заощадження)                                                                                                                                                                                                                                                                                  |
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

## Повна перевірка релізу

`Full Release Validation` — це ручний парасольковий workflow для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний workflow `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження Plugin/package/static/Docker і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram lanes. Він також може запустити післяпублікаційний workflow `NPM Telegram Beta E2E`, коли вказано специфікацію опублікованого пакета.

`release_profile` керує широтою live/provider, що передається до release checks:

- `minimum` залишає найшвидші критичні для релізу OpenAI/core lanes.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультативну матрицю provider/media.

Парасольковий workflow записує ідентифікатори запущених дочірніх прогонів, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх прогонів і додає таблиці найповільніших завдань для кожного дочірнього прогону. Якщо дочірній workflow перезапущено і він став зеленим, перезапустіть лише батьківське завдання-верифікатор, щоб оновити результат і підсумок таймінгів парасолькового workflow.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для кандидата на реліз, `ci` лише для звичайного дочірнього повного CI, `release-checks` для кожного релізного дочірнього завдання або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` або `npm-telegram` у парасольковому workflow. Це зберігає повторний запуск невдалого релізного середовища обмеженим після сфокусованого виправлення.

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати вибраний ref у tarball `release-package-under-test`, а потім передає цей артефакт і до Docker workflow live/E2E release-path, і до шарда package acceptance. Це зберігає байти пакета узгодженими між релізними середовищами та уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live та E2E шарди

Дочірній релізний live/E2E зберігає широке нативне покриття `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені шарди media audio/video і provider-filtered шарди music

Це зберігає те саме файлове покриття, водночас спрощуючи повторний запуск і діагностику повільних збоїв live provider. Агреговані назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються чинними для ручних одноразових перезапусків.

Нативні live media шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному workflow `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live suites на звичайних Blacksmith runners — container jobs є неправильним місцем для запуску вкладених Docker tests.

Docker-backed live model/backend шарди використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow один раз збирає й пушить цей образ, після чого Docker live model, gateway, CLI backend, ACP bind і Codex harness шарди запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди незалежно перебудовують повну source Docker target, релізний прогін налаштовано неправильно, і він марнуватиме wall clock на дублікати збирання образів.

## Приймання пакета

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальований пакет OpenClaw як продукт?» Це відрізняється від звичайного CI: звичайний CI перевіряє дерево вихідного коду, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі застосовують після встановлення або оновлення.

### Завдання

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і виводить source, workflow ref, package ref, version, SHA-256 та profile у GitHub step summary.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Reusable workflow завантажує цей артефакт, перевіряє інвентар tarball, за потреби готує package-digest Docker images і запускає вибрані Docker lanes проти цього пакета замість пакування checkout workflow. Коли profile вибирає кілька цільових `docker_lanes`, reusable workflow один раз готує пакет і спільні образи, а потім розгалужує ці lanes як паралельні цільові Docker jobs з унікальними артефактами.
3. `package_telegram` за потреби викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не дорівнює `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав його; окремий запуск Telegram усе ще може встановити опубліковану npm spec.
4. `summary` робить workflow невдалим, якщо package resolution, Docker acceptance або необов’язковий Telegram lane завершилися невдало.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію випуску OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку, тег або повний SHA коміту `package_ref`. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або тегу випуску, встановлює залежності у відокремленому робочому дереві та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` є обов’язковим.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто вказувати для артефактів, що поширюються зовнішньо.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/обв’язки, який запускає тест. `package_ref` — це початковий коміт, який пакується, коли `source=ref`. Це дає змогу поточній тестовій обв’язці перевіряти старіші довірені початкові коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти шляху випуску з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugins, щоб перевірка опублікованого пакета не залежала від доступності live ClawHub. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях специфікації опублікованого npm збережено для самостійних dispatch-запусків.

Перевірки випуску викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти шляху випуску покривають лінії package/update/plugin, що перетинаються; Package Acceptance зберігає artifact-native перевірку сумісності bundled-channel, офлайн-plugin і proof Telegram для того самого розв’язаного tarball пакета. Перевірки випуску для різних ОС і далі покривають специфічне для ОС onboarding, installer і поведінку платформи; продуктову перевірку package/update слід починати з Package Acceptance. Лінії Windows packaged та installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override із сирого абсолютного шляху Windows. OpenAI cross-OS agent-turn smoke за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли задано, інакше `openai/gpt-5.4-mini`, щоб proof встановлення та Gateway залишався швидким і детермінованим.

### Вікна сумісності зі спадковими версіями

Package Acceptance має обмежені вікна сумісності зі спадковими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні QA-записи в `dist/postinstall-inventory.json` можуть вказувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок persistence для `gateway install --wrapper`, коли пакет не надає цей прапорець;
- `update-channel-switch` може відкидати відсутні `pnpm.patchedDependencies` із fake git fixture, похідного від tarball, і може логувати відсутній збережений `update.channel`;
- plugin smokes можуть читати спадкові розташування install-record або приймати відсутню persistence marketplace install-record;
- `plugin-update` може дозволяти міграцію metadata конфігурації, водночас і далі вимагаючи, щоб поведінка install record і no-reinstall залишалася незмінною.

Опублікований пакет `2026.4.26` також може попереджати про файли stamp метаданих локальної збірки, які вже були відвантажені. Пізніші пакети мають відповідати сучасним контрактам; ті самі умови спричиняють failure замість warning або skip.

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

Під час налагодження невдалого запуску package acceptance починайте зі зведення `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перегляньте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної перевірки випуску.

## Install smoke

Окремий workflow `Install Smoke` повторно використовує той самий scope script через власне завдання `preflight`. Він розділяє smoke-покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull requests, що торкаються Docker/package surfaces, змін у пакеті/маніфесті bundled plugin або core plugin/channel/gateway/Plugin SDK surfaces, які виконують Docker smoke jobs. Зміни лише в source bundled plugin, редагування лише тестів і редагування лише документації не резервують Docker workers. Швидкий шлях один раз збирає image root Dockerfile, перевіряє CLI, запускає CLI smoke для agents delete shared-workspace, запускає container gateway-network e2e, перевіряє build arg bundled extension і запускає обмежений Docker-профіль bundled-plugin у межах 240-секундного агрегованого timeout команди (Docker run кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update coverage для нічних scheduled runs, ручних dispatches, workflow-call release checks і pull requests, які справді торкаються installer/package/Docker surfaces. У full mode install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і fast bundled-plugin Docker E2E як окремі завдання, щоб installer work не очікувала за root image smokes.

Push до `main` (зокрема merge commits) не примушують до full path; коли логіка changed-scope просила б full coverage для push, workflow зберігає fast Docker smoke і залишає full install smoke для nightly або release validation.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за nightly schedule і з release checks workflow, а ручні dispatches `Install Smoke` можуть явно його ввімкнути, але pull requests і push до `main` — ні. QR і installer Docker tests зберігають власні install-focused Dockerfiles.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні images `scripts/e2e/Dockerfile`:

- bare Node/Git runner для installer/update/plugin-dependency lines;
- functional image, який встановлює той самий tarball у `/app` для normal functionality lanes.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка planner — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Scheduler вибирає image для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштовувані параметри

| Змінна                                 | За замовчуванням | Призначення                                                                                   |
| -------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10               | Кількість слотів main-pool для звичайних ліній.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10               | Кількість слотів tail-pool, чутливого до provider.                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                | Ліміт одночасних live-ліній, щоб providers не throttled.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10               | Ліміт одночасних ліній npm install.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                | Ліміт одночасних multi-service ліній.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000             | Інтервал між стартами ліній, щоб уникнути create storms Docker daemon; задайте `0` без інтервалу. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000          | Резервний timeout для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші обмеження. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset            | `1` друкує scheduler plan без запуску ліній.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset            | Список точних ліній, розділений комами; пропускає cleanup smoke, щоб agents могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, все одно може стартувати з порожнього pool, а потім виконується сама, доки не звільнить capacity. Локальні aggregate preflights перевіряють Docker, видаляють застарілі OpenClaw E2E containers, виводять status активних ліній, зберігають lane timings для longest-first ordering і за замовчуванням припиняють планувати нові pooled lanes після першої failure.

### Багаторазовий live/E2E workflow

Багаторазовий live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credential потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує current-run package artifact, або завантажує package artifact з `package_artifact_run_id`; перевіряє inventory tarball; збирає і пушить package-digest-tagged bare/functional GHCR Docker E2E images через Docker layer cache Blacksmith, коли план потребує package-installed lanes; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість rebuild. Docker image pulls повторюються з обмеженим 180-секундним timeout на спробу, щоб завислий registry/cache stream швидко повторювався, а не поглинав більшість critical path CI.

### Фрагменти шляху випуску

Release Docker coverage запускає менші chunked jobs з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен chunk забирав лише потрібний йому image kind і виконував кілька ліній через той самий weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні Docker-фрагменти релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових повторних запусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім смуги `install-e2e` залишається агрегованим псевдонімом ручного повторного запуску для обох смуг інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені смуги `bundled-channel-*` і `bundled-channel-update-*` замість послідовної універсальної смуги `bundled-channel-deps`.

OpenWebUI включається до `plugins-runtime-services`, коли повне покриття шляху релізу цього потребує, і зберігає окремий фрагмент `openwebui` лише для dispatch лише OpenWebUI. Смуги оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент завантажує `.artifacts/docker-tests/` з журналами смуг, таймінгами, `summary.json`, `failures.json`, фазовими таймінгами, JSON плану планувальника, таблицями повільних смуг і командами повторного запуску для кожної смуги. Вхід `docker_lanes` workflow запускає вибрані смуги проти підготовлених образів замість завдань фрагментів, що обмежує налагодження збійної смуги одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана смуга є живою Docker-смугою, цільове завдання локально збирає образ live-test для цього повторного запуску. Згенеровані команди повторного запуску GitHub для кожної смуги містять `package_artifact_run_id`, `package_artifact_name` і входи підготовленого образу, коли ці значення існують, щоб збійна смуга могла повторно використати точний пакет і образи зі збійного запуску.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Запланований live/E2E workflow щодня запускає повний Docker-набір шляху релізу.

## Попередній випуск Plugin

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий workflow, який запускається `Full Release Validation` або явно оператором. Звичайні pull request, push у `main` і самостійні ручні dispatch CI не вмикають цей набір. Він балансує тести bundled plugin між вісьмома extension-воркерами; ці shard-завдання extension запускають до двох груп конфігурації plugin одночасно з одним Vitest-воркером на групу та більшим heap Node, щоб насичені імпортами пакети plugin не створювали додаткових CI-завдань.

## QA Lab

QA Lab має окремі CI-смуги поза основним workflow зі smart-scope.

- Workflow `Parity gate` запускається для відповідних змін PR і ручного dispatch; він збирає приватний QA runtime і порівнює mock-агентні пакети GPT-5.5 і Opus 4.6.
- Workflow `QA-Lab - All Lanes` запускається щоночі на `main` і через ручний dispatch; він розгортає mock parity gate, live Matrix-смугу, а також live Telegram і Discord-смуги як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Перевірки релізу запускають Matrix і Telegram live transport-смуги з детермінованим mock-провайдером і mock-кваліфікованими моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук пам’яті, оскільки QA parity окремо покриває поведінку пам’яті; підключення провайдерів покривають окремі набори live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних gate, додаючи `--fail-fast` лише коли checked-out CLI це підтримує. Стандарт CLI і ручний вхід workflow залишаються `all`; ручний dispatch `matrix_profile=all` завжди розбиває повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу смуги QA Lab перед затвердженням релізу; його QA parity gate запускає candidate і baseline пакети як паралельні завдання смуг, потім завантажує обидва артефакти в невелике report-завдання для фінального parity-порівняння.

Не ставте шлях landing PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-test розглядайте це як необов’язковий сигнал і спирайтеся на scoped CI/check докази.

## CodeQL

Workflow `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним оглядом репозиторію. Щоденні, ручні та guard-запуски pull request не в стані draft сканують код Actions workflow і найризикованіші JavaScript/TypeScript-поверхні за допомогою security-запитів високої впевненості, відфільтрованих до високої/критичної `security-severity`.

Guard pull request залишається легким: він запускається лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src` і виконує ту саму security-матрицю високої впевненості, що й запланований workflow. Android і macOS CodeQL не входять до стандартних PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і baseline gateway                                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel, а також channel plugin runtime, Gateway, Plugin SDK, secrets, точки дотику audit                   |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, розбір IP, network guard, web-fetch і поверхні SSRF-політики Plugin SDK                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, помічники виконання процесів, outbound delivery і agent tool-execution gates                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Поверхні довіри Plugin install, loader, manifest, registry, runtime-dependency staging, source-loading і контракту пакета Plugin SDK |

### Платформоспецифічні security shards

- `CodeQL Android Critical Security` — запланований Android security shard. Вручну збирає Android-застосунок для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Завантажує в `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security shard. Вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, відфільтровує результати dependency build із завантаженого SARIF і завантажує в `/codeql-critical-security/macos`. Тримається поза щоденними стандартними запусками, бо збірка macOS домінує runtime навіть у чистому стані.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний shard не для безпеки. Він запускає лише error-severity, non-security JavaScript/TypeScript quality-запити по вузьких високовартісних поверхнях на меншому Blacksmith Linux runner. Його guard pull request навмисно менший за запланований profile: PR не в draft запускають лише відповідні shards `channel-runtime-boundary`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary` і `plugin-sdk-package-contract` для змін channel runtime, gateway protocol/server-method, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK або package-contract. Зміни конфігурації CodeQL і quality workflow запускають усі сім PR quality shards.

Ручний dispatch приймає:

```
profile=all|channel-runtime-boundary|gateway-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі profiles є навчальними/ітераційними hooks для запуску одного quality shard ізольовано.

| Категорія                                               | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron і код security boundary gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization і IO contracts                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protocol schemas і server method contracts                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації core channel                                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Command execution, model/provider dispatch, auto-reply dispatch і queues, а також runtime contracts ACP control-plane                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та tool bridges, process supervision helpers і outbound delivery contracts                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, glue активації memory runtime і команди memory doctor                                        |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply queue internals, session delivery queues, outbound session binding/delivery helpers, diagnostic event/log bundle surfaces і session doctor CLI contracts   |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues і session/thread binding helpers                |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth and discovery, provider runtime registration, provider defaults/catalogs і web/search/fetch/embedding registries       |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flows і runtime contracts task control-plane                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation і media-generation runtime contracts                                                       |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface і Plugin SDK entrypoint contracts                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковане package-side джерело Plugin SDK і помічники контракту plugin package                                                                                 |

Якість залишається окремою від безпеки, щоб якісні знахідки можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і вбудованих plugin слід додавати назад як обмежену або розділену подальшу роботу лише після того, як вузькі профілі матимуть стабільний час виконання та сигнал.

## Робочі процеси обслуговування

### Агент документації

Робочий процес `Docs Agent` — це керована подіями лінія обслуговування Codex для підтримання наявної документації узгодженою з нещодавно включеними змінами. Він не має чистого розкладу: успішний запуск CI після push не від бота на `main` може його запустити, а ручний dispatch може виконати його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено протягом останньої години. Коли він виконується, він переглядає діапазон комітів від попереднього непропущеного SHA джерела Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені від останнього проходу документації.

### Агент продуктивності тестів

Робочий процес `Test Performance Agent` — це керована подіями лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний запуск CI після push не від бота на `main` може його запустити, але він пропускається, якщо інший виклик workflow-run уже виконувався або виконується цього дня UTC. Ручний dispatch обходить цей щоденний шлюз активності. Лінія створює згрупований звіт продуктивності повного набору Vitest, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору й відхиляє зміни, які зменшують базову кількість тестів, що проходять. Якщо базова лінія має тести, що падають, Codex може виправляти лише очевидні збої, а звіт повного набору після агента має пройти перед тим, як будь-що буде закомічено. Коли `main` просувається до того, як push бота потрапить у репозиторій, лінія ребейзить перевірений патч, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі патчі пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб дія Codex могла зберігати ту саму позицію безпеки drop-sudo, що й агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для очищення дублікатів після включення змін. За замовчуванням він працює в dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед змінами в GitHub він перевіряє, що включений PR змерджено і що кожен дублікат має або спільне посилання на issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні перевірочні шлюзи та маршрутизація змін

Локальна логіка changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний перевірочний шлюз суворіший щодо архітектурних меж, ніж ширша платформа CI:

- зміни основного production-коду запускають typecheck для core prod і core test плюс core lint/guards;
- зміни лише в тестах ядра запускають лише typecheck core test плюс core lint;
- зміни production-коду розширень запускають typecheck extension prod і extension test плюс extension lint;
- зміни лише в тестах розширень запускають typecheck extension test плюс extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck розширень, бо розширення залежать від цих контрактів ядра (проходи розширень Vitest залишаються явною тестовою роботою);
- зміни версій лише в release metadata запускають цільові перевірки версії/config/root-dependency;
- невідомі зміни root/config безпечно переходять до всіх ліній перевірок.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі зміни тестів запускають самі себе, зміни джерел віддають перевагу явним мапінгам, потім sibling-тестам і залежним через import-graph. Спільна конфігурація доставлення group-room є одним із явних мапінгів: зміни в конфігурації visible-reply для групи, режимі доставлення відповіді з джерела або системному prompt інструмента повідомлень проходять через core reply tests плюс регресії доставлення Discord і Slack, щоб зміна спільного значення за замовчуванням упала до першого push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна настільки широка на рівні harness, що дешевий зіставлений набір не є надійним proxy.

## Валідація Testbox

Запускайте Testbox із кореня репозиторію й надавайте перевагу свіжому прогрітому box для широкого доказу. Перш ніж витрачати повільний шлюз на box, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спочатку запустіть `pnpm testbox:sanity` всередині box.

Sanity-перевірка швидко падає, коли обов’язкові кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що стан віддаленої синхронізації не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість налагодження збою продуктового тесту. Для навмисних PR із великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад п’ять хвилин без виводу після синхронізації. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
