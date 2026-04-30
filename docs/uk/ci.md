---
read_when:
    - Потрібно зрозуміти, чому завдання CI запустилося або не запустилося.
    - Ви налагоджуєте невдалу перевірку GitHub Actions
    - Ви координуєте запуск або повторний запуск перевірки релізу
summary: Граф завдань CI, контрольні перевірки за областю дії, релізні парасолькові перевірки та локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-30T06:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 256d47dacac7d5c49c8ad614fba2efdd94332d69903d8b70c653775b28bc3fd5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI запускається під час кожного push до `main` і для кожного pull request. Завдання `preflight` класифікує diff і вимикає дорогі лінії, коли змінено лише непов’язані області. Ручні запуски `workflow_dispatch` навмисно обходять розумне обмеження області й розгортають повний граф для release candidate та широкої валідації. Лінії Android залишаються опціональними через `include_android`. Покриття Plugin лише для релізів міститься в окремому workflow [`Попередній випуск Plugin`](#plugin-prerelease) і запускається лише з [`Повної валідації релізу`](#full-release-validation) або явного ручного dispatch.

## Огляд pipeline

| Завдання                         | Призначення                                                                                  | Коли запускається                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Виявляє зміни лише в документації, змінені області, змінені розширення та будує маніфест CI  | Завжди для нечернеткових push і PR |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                   | Завжди для нечернеткових push і PR |
| `security-dependency-audit`      | Аудит production lockfile без залежностей проти npm advisories                               | Завжди для нечернеткових push і PR |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                             | Завжди для нечернеткових push і PR |
| `check-dependencies`             | Production-прохід Knip лише для залежностей плюс guard allowlist для невикористаних файлів   | Node-релевантні зміни              |
| `build-artifacts`                | Збірка `dist/`, Control UI, перевірки зібраних артефактів і повторно використовувані downstream-артефакти | Node-релевантні зміни              |
| `checks-fast-core`               | Швидкі Linux-лінії коректності, як-от bundled/plugin-contract/protocol перевірки             | Node-релевантні зміни              |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом перевірки       | Node-релевантні зміни              |
| `checks-node-core-test`          | Шарди тестів core Node, без ліній каналів, bundled, контрактів і розширень                   | Node-релевантні зміни              |
| `check`                          | Шардований еквівалент основного локального gate: production-типи, lint, guards, test types і strict smoke | Node-релевантні зміни              |
| `check-additional`               | Шарди архітектури, boundary, extension-surface guards, package-boundary і gateway-watch      | Node-релевантні зміни              |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke для пам’яті запуску                                        | Node-релевантні зміни              |
| `checks`                         | Verifier для тестів каналів зібраних артефактів                                              | Node-релевантні зміни              |
| `checks-node-compat-node22`      | Лінія збірки й smoke для сумісності з Node 22                                                | Ручний CI dispatch для релізів     |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                   | Змінено документацію               |
| `skills-python`                  | Ruff + pytest для skills із Python-підтримкою                                                | Python-skill-релевантні зміни      |
| `checks-windows`                 | Специфічні для Windows тести process/path плюс регресії спільних runtime import specifier    | Windows-релевантні зміни           |
| `macos-node`                     | Лінія TypeScript-тестів macOS із використанням спільних зібраних артефактів                  | macOS-релевантні зміни             |
| `macos-swift`                    | Swift lint, збірка й тести для macOS app                                                     | macOS-релевантні зміни             |
| `android`                        | Android unit tests для обох flavors плюс одна збірка debug APK                               | Android-релевантні зміни           |
| `test-performance-agent`         | Щоденна оптимізація повільних тестів Codex після довіреної активності                        | Успіх main CI або ручний dispatch  |

## Порядок fail-fast

1. `preflight` вирішує, які лінії взагалі існують. Логіка `docs-scope` і `changed-scope` є кроками всередині цього завдання, а не окремими завданнями.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` швидко падають, не чекаючи важчих завдань матриці артефактів і платформ.
3. `build-artifacts` перекривається зі швидкими Linux-лініями, щоб downstream-споживачі могли стартувати одразу після готовності спільної збірки.
4. Після цього розгортаються важчі платформні та runtime-лінії: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

GitHub може позначати замінені завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це CI-шумом, якщо найновіший запуск для того самого ref також не падає. Агреговані перевірки шардів використовують `!cancelled() && always()`, тому вони все ще повідомляють звичайні помилки шардів, але не стають у чергу після того, як увесь workflow уже було замінено. Автоматичний ключ concurrency для CI версіонований (`CI-v7-*`), тож zombie з боку GitHub у старій групі черги не може нескінченно блокувати новіші запуски main. Ручні запуски повного набору використовують `CI-manual-v1-*` і не скасовують запуски, що виконуються.

## Область і маршрутизація

Логіка області міститься в `scripts/ci-changed-scope.mjs` і покрита unit tests у `src/scripts/ci-changed-scope.test.ts`. Ручний dispatch пропускає виявлення changed-scope і змушує маніфест preflight діяти так, ніби змінилася кожна scoped-область.

- **Зміни CI workflow** валідовують граф Node CI плюс workflow linting, але самі по собі не примушують запускати native-збірки Windows, Android або macOS; ці платформні лінії залишаються обмеженими змінами платформного коду.
- **Зміни лише маршрутизації CI, вибрані дешеві зміни fixtures core-test і вузькі helper/test-routing зміни контрактів Plugin** використовують швидкий Node-only шлях маніфесту: `preflight`, security і одне завдання `checks-fast-core`. Цей шлях пропускає build artifacts, сумісність Node 22, контракти каналів, повні core shards, bundled-plugin shards і додаткові guard-матриці, коли зміна обмежена routing або helper surfaces, які швидке завдання перевіряє напряму.
- **Windows Node перевірки** обмежені специфічними для Windows wrappers process/path, npm/pnpm/UI runner helpers, конфігурацією package manager і поверхнями CI workflow, що виконують цю лінію; непов’язані source, Plugin, install-smoke і test-only зміни залишаються на Linux Node лініях.

Найповільніші сімейства Node-тестів розділені або збалансовані так, щоб кожне завдання лишалося малим без надмірного резервування runners: контракти каналів запускаються як три зважені шарди, малі core unit лінії поєднані в пари, auto-reply запускається як чотири збалансовані workers (із reply subtree, розділеним на шарди agent-runner, dispatch і commands/state-routing), а agentic gateway/plugin configs рознесені між наявними source-only agentic Node jobs замість очікування build artifacts. Широкі browser, QA, media і miscellaneous plugin tests використовують власні dedicated Vitest configs замість спільного plugin catch-all. Include-pattern shards записують timing entries із використанням назви CI shard, тож `.artifacts/vitest-shard-timings.json` може відрізнити цілий config від filtered shard. `check-additional` тримає package-boundary compile/canary work разом і відокремлює архітектуру runtime topology від gateway watch coverage; boundary guard shard запускає свої невеликі незалежні guards паралельно в одному завданні. Gateway watch, channel tests і core support-boundary shard запускаються паралельно всередині `build-artifacts` після того, як `dist/` і `dist-runtime/` уже зібрані.

Android CI запускає і `testPlayDebugUnitTest`, і `testThirdPartyDebugUnitTest`, а потім збирає Play debug APK. Third-party flavor не має окремого source set або manifest; його unit-test лінія все одно компілює flavor із прапорцями BuildConfig для SMS/call-log, уникаючи дубльованого debug APK packaging job для кожного Android-релевантного push.

Шард `check-dependencies` запускає `pnpm deadcode:dependencies` (production Knip dependency-only pass, закріплений на найновішій версії Knip, із вимкненим мінімальним віком релізу pnpm для встановлення `dlx`) і `pnpm deadcode:unused-files`, який порівнює production unused-file findings Knip з `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file падає, коли PR додає новий непереглянутий невикористаний файл або залишає застарілий allowlist entry, водночас зберігаючи навмисні dynamic plugin, generated, build, live-test і package bridge surfaces, які Knip не може статично resolve.

## Ручні dispatches

Ручні CI dispatches запускають той самий граф завдань, що й звичайний CI, але примусово вмикають кожну non-Android scoped lane: Linux Node shards, bundled-plugin shards, контракти каналів, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS і Control UI i18n. Самостійні ручні CI dispatches запускають Android лише з `include_android=true`; повна release umbrella вмикає Android, передаючи `include_android=true`. Static checks для plugin prerelease, release-only shard `agentic-plugins`, повний batch sweep розширень і Docker lanes для plugin prerelease виключені з CI. Docker prerelease suite запускається лише тоді, коли `Full Release Validation` dispatches окремий workflow `Plugin Prerelease` з увімкненим gate release-validation.

Ручні запуски використовують унікальну concurrency group, тому повний набір release-candidate не скасовується іншим push або PR run на тому самому ref. Опціональний input `target_ref` дає довіреному caller змогу запускати цей граф проти branch, tag або повного commit SHA, використовуючи workflow file з вибраного dispatch ref.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Середовище виконання             | Завдання                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, швидкі завдання безпеки та агрегати (`security-scm-fast`, `security-dependency-audit`, `security-fast`), швидкі перевірки протоколу/контрактів/вбудованого набору, шардовані перевірки контрактів каналів, шарди `check`, окрім lint, шарди й агрегати `check-additional`, верифікатори агрегатів тестів Node, перевірки документації, Python Skills, workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, легші шарди Plugin, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` і `check-test-types`                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, шарди тестів Linux Node, шарди тестів вбудованих Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (достатньо чутливий до CPU, тому 8 vCPU коштували більше, ніж економили); Docker-збірки install-smoke (час черги для 32-vCPU коштував більше, ніж економив)                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` в `openclaw/openclaw`; форки повертаються до `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |
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

`Full Release Validation` — це ручний парасольковий робочий процес для «запустити все перед релізом». Він приймає гілку, тег або повний SHA коміту, запускає ручний робочий процес `CI` з цією ціллю, запускає `Plugin Prerelease` для релізного підтвердження Plugin/пакета/статичних ресурсів/Docker, а також запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram-смуг. Він також може запускати післяпублікаційний робочий процес `NPM Telegram Beta E2E`, коли надано специфікацію опублікованого пакета.

`release_profile` керує шириною live/provider, що передається в release checks:

- `minimum` залишає найшвидші критичні для релізу смуги OpenAI/ядра.
- `stable` додає стабільний набір provider/backend.
- `full` запускає широку консультаційну матрицю provider/media.

Парасолька записує ідентифікатори запущених дочірніх прогонів, а фінальне завдання `Verify full validation` повторно перевіряє поточні висновки дочірніх прогонів і додає таблиці найповільніших завдань для кожного дочірнього прогону. Якщо дочірній робочий процес перезапущено і він став зеленим, перезапустіть лише батьківське завдання verifier, щоб оновити результат парасольки та підсумок таймінгів.

Для відновлення і `Full Release Validation`, і `OpenClaw Release Checks` приймають `rerun_group`. Використовуйте `all` для release candidate, `ci` лише для звичайної дочірньої повної CI, `release-checks` для кожної релізної дочірньої перевірки або вужчу групу: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` чи `npm-telegram` у парасольці. Це зберігає перезапуск невдалого релізного боксу обмеженим після цільового виправлення.

`OpenClaw Release Checks` використовує довірене посилання робочого процесу, щоб один раз розв’язати вибране посилання в tarball `release-package-under-test`, а потім передає цей артефакт і в Docker-робочий процес release-path live/E2E, і в шард package acceptance. Це зберігає байти пакета узгодженими між релізними боксами та уникає повторного пакування того самого кандидата в кількох дочірніх завданнях.

## Live та E2E-шарди

Дочірній release live/E2E зберігає широке покриття нативного `pnpm test:live`, але запускає його як іменовані шарди через `scripts/test-live-shard.mjs` замість одного послідовного завдання:

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
- розділені audio/video-шарди media та provider-filtered music-шарди

Це зберігає те саме покриття файлів, водночас спрощуючи перезапуск і діагностику повільних live-збоїв provider. Агрегатні назви шардів `native-live-extensions-o-z`, `native-live-extensions-media` і `native-live-extensions-media-music` залишаються дійсними для ручних одноразових перезапусків.

Нативні live media-шарди запускаються в `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, зібраному робочим процесом `Live Media Runner Image`. Цей образ попередньо встановлює `ffmpeg` і `ffprobe`; media-завдання лише перевіряють бінарні файли перед налаштуванням. Тримайте Docker-backed live-набори на звичайних раннерах Blacksmith — container jobs є неправильним місцем для запуску вкладених Docker-тестів.

Docker-backed live-шарди model/backend використовують окремий спільний образ `ghcr.io/openclaw/openclaw-live-test:<sha>` для кожного вибраного коміту. Live release workflow збирає й публікує цей образ один раз, після чого Docker live model, gateway, CLI backend, ACP bind і шарди Codex harness запускаються з `OPENCLAW_SKIP_DOCKER_BUILD=1`. Якщо ці шарди самостійно перебудовують повну Docker-ціль source, релізний прогін налаштовано неправильно, і він марнуватиме реальний час на дубльовані збірки образів.

## Package Acceptance

Використовуйте `Package Acceptance`, коли питання звучить так: «чи працює цей інстальовний пакет OpenClaw як продукт?» Він відрізняється від звичайної CI: звичайна CI перевіряє дерево source, тоді як package acceptance перевіряє один tarball через той самий Docker E2E harness, який користувачі запускають після встановлення або оновлення.

### Завдання

1. `resolve_package` checkout-ить `workflow_ref`, розв’язує одного кандидата пакета, записує `.artifacts/docker-e2e-package/openclaw-current.tgz`, записує `.artifacts/docker-e2e-package/package-candidate.json`, завантажує обидва як артефакт `package-under-test` і друкує source, workflow ref, package ref, version, SHA-256 та profile у підсумку кроку GitHub.
2. `docker_acceptance` викликає `openclaw-live-and-e2e-checks-reusable.yml` з `ref=workflow_ref` і `package_artifact_name=package-under-test`. Повторно використовуваний робочий процес завантажує цей артефакт, перевіряє інвентар tarball, готує Docker-образи package-digest за потреби та запускає вибрані Docker-смуги проти цього пакета замість пакування checkout робочого процесу. Коли profile вибирає кілька цільових `docker_lanes`, повторно використовуваний робочий процес готує пакет і спільні образи один раз, а потім розгортає ці смуги як паралельні цільові Docker-завдання з унікальними артефактами.
3. `package_telegram` опційно викликає `NPM Telegram Beta E2E`. Він запускається, коли `telegram_mode` не є `none`, і встановлює той самий артефакт `package-under-test`, якщо Package Acceptance розв’язав його; автономний запуск Telegram все ще може встановити опубліковану npm-специфікацію.
4. `summary` завершує робочий процес з помилкою, якщо розв’язання пакета, Docker acceptance або опційна смуга Telegram зазнали невдачі.

### Джерела кандидатів

- `source=npm` приймає лише `openclaw@beta`, `openclaw@latest` або точну версію релізу OpenClaw, як-от `openclaw@2026.4.27-beta.2`. Використовуйте це для приймання опублікованих beta/stable.
- `source=ref` пакує довірену гілку `package_ref`, тег або повний SHA коміту. Резолвер отримує гілки/теги OpenClaw, перевіряє, що вибраний коміт досяжний з історії гілки репозиторію або тега релізу, встановлює залежності у відокремленому робочому дереві та пакує його за допомогою `scripts/package-openclaw-for-docker.mjs`.
- `source=url` завантажує HTTPS `.tgz`; `package_sha256` обов’язковий.
- `source=artifact` завантажує один `.tgz` з `artifact_run_id` і `artifact_name`; `package_sha256` необов’язковий, але його варто надавати для артефактів, що поширюються назовні.

Тримайте `workflow_ref` і `package_ref` окремо. `workflow_ref` — це довірений код workflow/обв’язки, який запускає тест. `package_ref` — це початковий коміт, який пакується, коли `source=ref`. Це дає поточній тестовій обв’язці змогу перевіряти старі довірені початкові коміти без запуску старої логіки workflow.

### Профілі наборів

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` плюс `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — повні Docker-фрагменти шляху релізу з OpenWebUI
- `custom` — точні `docker_lanes`; обов’язково, коли `suite_profile=custom`

Профіль `package` використовує офлайн-покриття plugin, щоб перевірка опублікованого пакета не залежала від доступності ClawHub наживо. Необов’язкова лінія Telegram повторно використовує артефакт `package-under-test` у `NPM Telegram Beta E2E`, а шлях опублікованої npm-специфікації збережено для автономних запусків.

Перевірки релізу викликають Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` і `telegram_mode=mock-openai`. Docker-фрагменти шляху релізу покривають суміжні лінії package/update/plugin; Package Acceptance зберігає артефактно-нативну сумісність bundled-channel, офлайн plugin і доказ Telegram для того самого розв’язаного tarball пакета. Cross-OS перевірки релізу й далі покривають специфічні для ОС onboarding, інсталятор і поведінку платформи; продуктову перевірку package/update слід починати з Package Acceptance. Windows-лінії packaged та installer fresh також перевіряють, що встановлений пакет може імпортувати browser-control override з необробленого абсолютного шляху Windows. Cross-OS димовий тест OpenAI agent-turn за замовчуванням використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, якщо задано, інакше `openai/gpt-5.4-mini`, тож доказ інсталяції та Gateway лишається швидким і детермінованим.

### Вікна сумісності зі старими версіями

Package Acceptance має обмежені вікна сумісності зі старими версіями для вже опублікованих пакетів. Пакети до `2026.4.25` включно, зокрема `2026.4.25-beta.*`, можуть використовувати шлях сумісності:

- відомі приватні записи QA у `dist/postinstall-inventory.json` можуть указувати на файли, пропущені в tarball;
- `doctor-switch` може пропускати підвипадок збереження `gateway install --wrapper`, коли пакет не відкриває цей прапорець;
- `update-channel-switch` може видаляти відсутні `pnpm.patchedDependencies` з фіктивної git-фікстури, отриманої з tarball, і може логувати відсутній збережений `update.channel`;
- димові тести plugin можуть читати старі розташування install-record або приймати відсутнє збереження marketplace install-record;
- `plugin-update` може дозволяти міграцію метаданих конфігурації, водночас усе ще вимагаючи, щоб install record і поведінка без повторної інсталяції лишалися незмінними.

Опублікований пакет `2026.4.26` також може попереджати про локальні stamp-файли метаданих збірки, які вже були відвантажені. Пізніші пакети мають задовольняти сучасні контракти; ті самі умови завершуються помилкою замість попередження або пропуску.

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

Під час налагодження невдалого запуску package acceptance починайте з підсумку `resolve_package`, щоб підтвердити джерело пакета, версію та SHA-256. Потім перевірте дочірній запуск `docker_acceptance` і його Docker-артефакти: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи ліній, таймінги фаз і команди повторного запуску. Віддавайте перевагу повторному запуску невдалого профілю пакета або точних Docker-ліній замість повторного запуску повної перевірки релізу.

## Димовий тест інсталяції

Окремий workflow `Install Smoke` повторно використовує той самий скрипт визначення області через власне завдання `preflight`. Він розділяє димове покриття на `run_fast_install_smoke` і `run_full_install_smoke`.

- **Швидкий шлях** запускається для pull request, що торкаються поверхонь Docker/package, змін bundled plugin package/manifest або поверхонь core plugin/channel/gateway/Plugin SDK, які перевіряють Docker smoke jobs. Зміни лише початкового коду bundled plugin, редагування лише тестів і зміни лише документації не резервують Docker workers. Швидкий шлях один раз збирає образ root Dockerfile, перевіряє CLI, запускає CLI-димовий тест agents delete shared-workspace, запускає контейнерний gateway-network e2e, перевіряє аргумент збірки bundled extension і запускає обмежений Docker-профіль bundled-plugin із сукупним тайм-аутом команди 240 секунд (Docker-запуск кожного сценарію обмежено окремо).
- **Повний шлях** зберігає QR package install і installer Docker/update покриття для нічних запланованих запусків, ручних запусків, workflow-call перевірок релізу та pull request, які справді торкаються поверхонь installer/package/Docker. У повному режимі install-smoke готує або повторно використовує один target-SHA GHCR root Dockerfile smoke image, а потім запускає QR package install, root Dockerfile/gateway smokes, installer/update smokes і швидкий bundled-plugin Docker E2E як окремі завдання, щоб робота інсталятора не чекала за root image smokes.

Пуші в `main` (зокрема merge-коміти) не примушують повний шлях; коли логіка changed-scope вимагала б повного покриття на push, workflow зберігає швидкий Docker smoke і лишає повний install smoke для нічної або релізної перевірки.

Повільний Bun global install image-provider smoke окремо керується `run_bun_global_install_smoke`. Він запускається за нічним розкладом і з workflow перевірок релізу, а ручні запуски `Install Smoke` можуть явно ввімкнути його, але pull request і пуші в `main` — ні. QR і installer Docker tests зберігають власні інсталяційно-орієнтовані Dockerfile.

## Локальний Docker E2E

`pnpm test:docker:all` попередньо збирає один спільний live-test image, один раз пакує OpenClaw як npm tarball і збирає два спільні образи `scripts/e2e/Dockerfile`:

- bare Node/Git runner для ліній installer/update/plugin-dependency;
- функціональний образ, який встановлює той самий tarball у `/app` для ліній звичайної функціональності.

Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`, логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`, а runner виконує лише вибраний план. Планувальник вибирає образ для кожної лінії за допомогою `OPENCLAW_DOCKER_E2E_BARE_IMAGE` і `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, а потім запускає лінії з `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Налаштовувані параметри

| Змінна                                | За замовчуванням | Призначення                                                                                   |
| ------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Кількість слотів основного пулу для звичайних ліній.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Кількість слотів хвостового пулу, чутливого до provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Ліміт одночасних live-ліній, щоб providers не застосовували throttle.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Ліміт одночасних ліній npm install.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Ліміт одночасних multi-service ліній.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Затримка між стартами ліній, щоб уникати create storms демона Docker; задайте `0`, щоб вимкнути затримку.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Резервний тайм-аут для кожної лінії (120 хвилин); вибрані live/tail лінії використовують жорсткіші ліміти.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` друкує план планувальника без запуску ліній.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Розділений комами точний список ліній; пропускає cleanup smoke, щоб агенти могли відтворити одну невдалу лінію. |

Лінія, важча за свій ефективний ліміт, усе ще може стартувати з порожнього пулу, а потім працює сама, доки не звільнить ємність. Локальні сукупні preflight перевіряють Docker, видаляють застарілі OpenClaw E2E-контейнери, виводять статус active-lane, зберігають таймінги ліній для впорядкування longest-first і за замовчуванням припиняють планувати нові pooled лінії після першої помилки.

### Повторно використовуваний live/E2E workflow

Повторно використовуваний live/E2E workflow запитує в `scripts/test-docker-all.mjs --plan-json`, яке покриття package, image kind, live image, lane і credentials потрібне. Потім `scripts/docker-e2e.mjs` перетворює цей план на GitHub outputs і summaries. Він або пакує OpenClaw через `scripts/package-openclaw-for-docker.mjs`, завантажує артефакт пакета з поточного запуску, або завантажує артефакт пакета з `package_artifact_run_id`; перевіряє inventory tarball; збирає та пушить bare/functional GHCR Docker E2E образи з тегом package-digest через Docker layer cache Blacksmith, коли план потребує ліній із встановленим пакетом; і повторно використовує надані inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` або наявні package-digest images замість повторної збірки. Завантаження Docker image повторюються з обмеженим 180-секундним тайм-аутом на спробу, щоб завислий stream registry/cache швидко повторювався замість споживання більшої частини критичного шляху CI.

### Фрагменти шляху релізу

Docker-покриття релізу запускає менші фрагментовані завдання з `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб кожен фрагмент завантажував лише потрібний йому тип образу та виконував кілька ліній через той самий зважений планувальник:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Поточні фрагменти Docker для релізу: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, від `plugins-runtime-install-a` до `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` і `bundled-channels-contracts`. Агрегований фрагмент `bundled-channels` залишається доступним для ручних одноразових перезапусків, а `plugins-runtime-core`, `plugins-runtime` і `plugins-integrations` залишаються агрегованими псевдонімами plugin/runtime. Псевдонім лінії `install-e2e` залишається агрегованим псевдонімом ручного перезапуску для обох ліній інсталяторів провайдерів. Фрагмент `bundled-channels` запускає розділені лінії `bundled-channel-*` і `bundled-channel-update-*`, а не послідовну універсальну лінію `bundled-channel-deps`.

OpenWebUI включається до `plugins-runtime-services`, коли це запитує повне покриття шляху релізу, і зберігає окремий фрагмент `openwebui` лише для диспетчеризацій тільки для OpenWebUI. Лінії оновлення bundled-channel повторюють спробу один раз у разі тимчасових мережевих збоїв npm.

Кожен фрагмент вивантажує `.artifacts/docker-tests/` з логами ліній, таймінгами, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника, таблицями повільних ліній і командами перезапуску для кожної лінії. Вхід `docker_lanes` робочого процесу запускає вибрані лінії з підготовленими образами замість завдань фрагментів, що обмежує налагодження невдалих ліній одним цільовим Docker-завданням і готує, завантажує або повторно використовує артефакт пакета для цього запуску; якщо вибрана лінія є live Docker-лінією, цільове завдання локально збирає образ live-test для цього перезапуску. Згенеровані команди GitHub для перезапуску окремих ліній містять `package_artifact_run_id`, `package_artifact_name` і входи підготовлених образів, коли ці значення існують, щоб невдала лінія могла повторно використати точний пакет і образи з невдалого запуску.

```bash
pnpm test:docker:rerun <run-id>      # завантажити Docker-артефакти й надрукувати комбіновані/полінійні цільові команди перезапуску
pnpm test:docker:timings <summary>   # зведення повільних ліній і критичного шляху фаз
```

Запланований live/E2E робочий процес щодня запускає повний Docker-набір шляху релізу.

## Передреліз Plugin

`Plugin Prerelease` є дорожчим покриттям product/package, тому це окремий робочий процес, який запускається `Full Release Validation` або явно оператором. Звичайні pull request, надсилання до `main` і автономні ручні CI-диспетчеризації не вмикають цей набір. Він балансує тести вбудованих плагінів між вісьмома extension-працівниками; ці завдання extension-шардів запускають до двох груп конфігурації плагінів одночасно з одним Vitest-працівником на групу та більшим heap Node, щоб import-heavy пакети плагінів не створювали додаткових CI-завдань.

## QA Lab

QA Lab має окремі CI-лінії поза основним smart-scoped робочим процесом.

- Робочий процес `Parity gate` запускається для відповідних змін PR і ручної диспетчеризації; він збирає приватний QA runtime і порівнює agentic-пакети mock GPT-5.5 і Opus 4.6.
- Робочий процес `QA-Lab - All Lanes` запускається щоночі на `main` і за ручною диспетчеризацією; він розгортає mock parity gate, live Matrix-лінію, а також live Telegram і Discord-лінії як паралельні завдання. Live-завдання використовують середовище `qa-live-shared`, а Telegram/Discord використовують Convex leases.

Перевірки релізу запускають Matrix і Telegram live transport-лінії з детермінованим mock-провайдером і mock-qualified моделями (`mock-openai/gpt-5.5` і `mock-openai/gpt-5.5-alt`), щоб контракт каналу був ізольований від затримки live-моделі та звичайного запуску provider-plugin. Live transport Gateway вимикає пошук пам’яті, бо QA parity окремо покриває поведінку пам’яті; підключення провайдера покривається окремими наборами live model, native provider і Docker provider.

Matrix використовує `--profile fast` для запланованих і релізних гейтів, додаючи `--fail-fast` лише тоді, коли checked-out CLI це підтримує. Типове значення CLI і вхід ручного робочого процесу залишаються `all`; ручна диспетчеризація `matrix_profile=all` завжди шардить повне покриття Matrix на завдання `transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`.

`OpenClaw Release Checks` також запускає критичні для релізу лінії QA Lab перед затвердженням релізу; його QA parity gate запускає кандидатний і базовий пакети як паралельні завдання ліній, а потім завантажує обидва артефакти в невелике завдання звіту для фінального порівняння parity.

Не ставте шлях landing для PR за `Parity gate`, якщо зміна фактично не торкається QA runtime, parity model-pack або поверхні, якою володіє parity workflow. Для звичайних виправлень каналів, конфігурації, документації або unit-тестів вважайте це необов’язковим сигналом і спирайтеся на scoped CI/check-докази.

## CodeQL

Робочий процес `CodeQL` навмисно є вузьким security scanner першого проходу, а не повним скануванням репозиторію. Щоденні, ручні та non-draft guard-запуски pull request сканують код Actions workflow і найризиковіші поверхні JavaScript/TypeScript з high-confidence security-запитами, відфільтрованими до high/critical `security-severity`.

Guard для pull request залишається легким: він стартує лише для змін у `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` або `src`, і запускає ту саму high-confidence security matrix, що й запланований робочий процес. Android і macOS CodeQL не входять до типових PR-запусків.

### Категорії безпеки

| Категорія                                         | Поверхня                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron і базова лінія gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Контракти реалізації core channel, а також channel plugin runtime, gateway, Plugin SDK, secrets, audit touchpoints                    |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, парсинг IP, network guard, web-fetch і поверхні SSRF-політики Plugin SDK                                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-сервери, помічники виконання процесів, outbound delivery і agent tool-execution gates                                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin install, loader, manifest, registry, runtime-dependency staging, source-loading і trust-поверхні контракту package Plugin SDK |

### Платформозалежні security-шарди

- `CodeQL Android Critical Security` — запланований Android security-шард. Вручну збирає Android-застосунок для CodeQL на найменшому Blacksmith Linux runner, прийнятому workflow sanity. Вивантажує під `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — щотижневий/ручний macOS security-шард. Вручну збирає macOS-застосунок для CodeQL на Blacksmith macOS, фільтрує результати збірки залежностей із вивантаженого SARIF і вивантажує під `/codeql-critical-security/macos`. Залишається поза щоденними типовими запускками, бо збірка macOS домінує за часом виконання навіть коли все чисто.

### Категорії Critical Quality

`CodeQL Critical Quality` — відповідний non-security шард. Він запускає лише error-severity non-security JavaScript/TypeScript quality-запити на вузьких high-value поверхнях на меншому Blacksmith Linux runner. Його guard для pull request навмисно менший за запланований профіль: non-draft PR запускають лише відповідні шарди `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` і `plugin-sdk-reply-runtime` для змін у коді config schema/migration/IO, auth/secrets/sandbox/security, core channel і bundled channel plugin runtime, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract або Plugin SDK reply runtime. Зміни конфігурації CodeQL і quality workflow запускають усі одинадцять PR quality-шардів.

Ручна диспетчеризація приймає:

```
profile=all|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Вузькі профілі є teaching/iteration hooks для запуску одного quality-шарда ізольовано.

| Категорія                                              | Поверхня                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, секрети, sandbox, Cron і код межі безпеки Gateway                                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Схема конфігурації, міграція, нормалізація та контракти IO                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Схеми протоколу Gateway і контракти методів сервера                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Контракти реалізації основного каналу та bundled channel Plugin                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Виконання команд, диспетчеризація моделей/провайдерів, диспетчеризація автовідповідей і черги, а також runtime-контракти площини керування ACP                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-сервери та містки інструментів, допоміжні засоби нагляду за процесами й контракти вихідної доставки                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK хоста памʼяті, runtime-фасади памʼяті, псевдоніми SDK памʼяті для Plugin, звʼязувальний код активації runtime памʼяті та команди doctor для памʼяті          |
| `/codeql-critical-quality/session-diagnostics-boundary` | Внутрішня реалізація черги відповідей, черги доставки сесій, допоміжні засоби привʼязування/доставки вихідних сесій, поверхні діагностичних подій/пакетів журналів і контракти CLI doctor для сесій |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Диспетчеризація вхідних відповідей Plugin SDK, допоміжні засоби для payload відповідей/розбиття на фрагменти/runtime, параметри відповідей каналу, черги доставки та допоміжні засоби привʼязування сесій/тредів |
| `/codeql-critical-quality/provider-runtime-boundary`    | Нормалізація каталогу моделей, автентифікація й виявлення провайдерів, runtime-реєстрація провайдерів, типові налаштування/каталоги провайдерів, а також реєстри web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Початкове завантаження Control UI, локальна сталість, потоки керування Gateway і runtime-контракти площини керування задачами                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Основні runtime-контракти web fetch/search, media IO, розуміння медіа, генерації зображень і генерації медіа                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Контракти завантажувача, реєстру, публічної поверхні та точок входу Plugin SDK                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Опубліковані джерела Plugin SDK на боці пакета та допоміжні засоби контрактів пакетів Plugin                                                                      |

Якість залишається окремою від безпеки, щоб знахідки щодо якості можна було планувати, вимірювати, вимикати або розширювати без затемнення сигналу безпеки. Розширення CodeQL для Swift, Python і bundled-plugin слід додавати назад як scoped або sharded подальшу роботу лише після того, як вузькі профілі матимуть стабільні runtime і сигнал.

## Робочі процеси обслуговування

### Docs Agent

Робочий процес `Docs Agent` — це керована подіями лінія обслуговування Codex для підтримання наявної документації у відповідності до нещодавно влитих змін. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, а ручний запуск може виконати його напряму. Виклики workflow-run пропускаються, коли `main` уже просунувся далі або коли інший непропущений запуск Docs Agent було створено за останню годину. Коли він виконується, він переглядає діапазон комітів від попереднього непропущеного вихідного SHA Docs Agent до поточного `main`, тож один погодинний запуск може охопити всі зміни main, накопичені з часу останнього проходу документації.

### Test Performance Agent

Робочий процес `Test Performance Agent` — це керована подіями лінія обслуговування Codex для повільних тестів. Він не має чистого розкладу: успішний CI-запуск push не від бота на `main` може його запустити, але він пропускається, якщо інший workflow-run уже виконувався або виконується цього UTC-дня. Ручний запуск обходить цей щоденний шлюз активності. Лінія створює згрупований звіт продуктивності Vitest для повного набору, дозволяє Codex робити лише невеликі виправлення продуктивності тестів зі збереженням покриття замість широких рефакторингів, потім повторно запускає звіт повного набору та відхиляє зміни, які зменшують базову кількість прохідних тестів. Якщо в базовому стані є тести, що падають, Codex може виправляти лише очевидні збої, а післяагентський звіт повного набору має пройти перед будь-яким комітом. Коли `main` просувається до того, як bot push потрапляє в репозиторій, лінія перебазовує перевірений patch, повторно запускає `pnpm check:changed` і повторює push; конфліктні застарілі patch пропускаються. Вона використовує GitHub-hosted Ubuntu, щоб action Codex міг зберігати таку саму безпечну позицію drop-sudo, як і агент документації.

### Дублікати PR після злиття

Робочий процес `Duplicate PRs After Merge` — це ручний робочий процес мейнтейнера для очищення дублікатів після влиття. Типово він працює в режимі dry-run і закриває лише явно перелічені PR, коли `apply=true`. Перед внесенням змін у GitHub він перевіряє, що влитий PR справді змерджено, і що кожен дублікат має або спільне посилання на issue, або перекривні змінені hunks.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Локальні шлюзи перевірок і маршрутизація змін

Логіка локальних changed-lane живе в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Цей локальний шлюз перевірки суворіший щодо архітектурних меж, ніж широкий обсяг CI-платформи:

- зміни production-коду core запускають typecheck core prod і core test, а також core lint/guards;
- зміни лише в тестах core запускають тільки typecheck core test і core lint;
- зміни production-коду extension запускають typecheck extension prod і extension test, а також extension lint;
- зміни лише в тестах extension запускають typecheck extension test і extension lint;
- зміни публічного Plugin SDK або plugin-contract розширюються до typecheck extension, бо extensions залежать від цих core-контрактів (Vitest-перевірки extension залишаються явною тестовою роботою);
- версійні bump лише release metadata запускають цільові перевірки версій/config/root-dependency;
- невідомі зміни root/config з міркувань безпеки переходять на всі check lanes.

Локальна маршрутизація changed-test живе в `scripts/test-projects.test-support.mjs` і навмисно дешевша за `check:changed`: прямі редагування тестів запускають самі себе, редагування джерел віддають перевагу явним мапінгам, потім sibling tests і залежним від import-graph. Спільна конфігурація доставки group-room є одним із явних мапінгів: зміни до конфігурації group visible-reply, режиму доставки source reply або системного prompt message-tool проходять через основні тести відповідей плюс регресії доставки Discord і Slack, щоб зміна спільного дефолту падала ще до першого push PR. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли зміна достатньо широка для harness, що дешевий mapped set не є надійним proxy.

## Валідація Testbox

Запускайте Testbox з кореня репозиторію та віддавайте перевагу свіжому warmed box для широкого доказу. Перш ніж витрачати повільний шлюз на box, який було повторно використано, термін дії якого минув або який щойно повідомив про неочікувано велику синхронізацію, спершу запустіть `pnpm testbox:sanity` всередині box.

Sanity-перевірка швидко падає, коли потрібні кореневі файли, як-от `pnpm-lock.yaml`, зникли або коли `git status --short` показує щонайменше 200 відстежуваних видалень. Зазвичай це означає, що віддалений стан синхронізації не є надійною копією PR; зупиніть цей box і прогрійте свіжий замість того, щоб налагоджувати збій продуктового тесту. Для PR із навмисними великими видаленнями встановіть `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` для цього sanity-запуску.

`pnpm testbox:run` також завершує локальний виклик Blacksmith CLI, який залишається у фазі синхронізації понад пʼять хвилин без post-sync виводу. Встановіть `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, щоб вимкнути цей guard, або використайте більше значення в мілісекундах для незвично великих локальних diff.

## Повʼязане

- [Огляд установлення](/uk/install)
- [Канали розробки](/uk/install/development-channels)
