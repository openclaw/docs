---
read_when:
    - Пошук визначень загальнодоступних каналів релізів
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте правила іменування версій і періодичність випусків
summary: Релізні канали, контрольний список оператора, блоки валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-30T21:58:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2270223edb41f3c3731ad44fd6f8c8876e9908933bb61eddd350e344e0160121
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- стабільний: позначені тегами випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest` за явним запитом
- бета: передрелізні теги, які публікуються в npm `beta`
- розробницький: рухома верхівка `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного виправного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний випуск npm
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та стабільні виправні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний випуск OpenClaw постачає npm-пакет і застосунок macOS разом;
  бета-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризація застосунку Mac залишаються для стабільного випуску, якщо не запитано явно

## Частота випусків

- Випуски рухаються спочатку через бета-версію
- Стабільний випуск іде лише після перевірки найновішої бета-версії
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже було надіслано або опубліковано і він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого бета-тега
- Детальна процедура випуску, затвердження, облікові дані та нотатки з відновлення
  доступні лише супровідникам

## Контрольний список оператора випуску

Цей контрольний список описує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
інструкції з випуску лише для супровідників.

1. Почніть із поточного `main`: отримайте найновіші зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, зафіксуйте їх комітом, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу з випуску
   безпосередньо в `main`.
5. Підвищте версію в кожному потрібному місці для запланованого тега, потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   для попередньої перевірки лише з метою валідації дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ випуску: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте в гілці випуску та повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або список дозволених моделей, який
   доводить виправлення. Повторно запускайте повну парасолькову перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   post-publish package acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована бета-версія потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару бета-версію.
10. Для стабільного випуску продовжуйте лише після того, як перевірена бета-версія або кандидат випуску має
    потрібні докази валідації. Стабільна публікація npm повторно використовує успішний
    артефакт попередньої перевірки через `preflight_run_id`; готовність стабільного випуску macOS
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий автономний
    published-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку валідації
  пакета
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, приймання пакета, наборів Docker
  для релізного шляху, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  lanes. Надавайте `npm_telegram_package_spec` лише після публікації пакета,
  коли також має виконатися післяпублікаційний Telegram E2E. Надавайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету, без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне підтвердження
  побічним каналом для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує планувальник Docker E2E release проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes інсталяції/каналу/агента, мережі Gateway і перезавантаження конфігурації
  - `package`: lanes пакета/оновлення/Plugin, нативні для артефакта, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, cron/очищення subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для кандидата релізу. Ручні CI-запуски оминають changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування контенту/ідентифікаторів без потреби
  в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Релізні перевірки тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity gate QA Lab плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує оренду
  облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Міжплатформна runtime-валідація інсталяції й оновлення входить до публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` напряму
- Цей поділ навмисний: реальний npm release path має залишатися коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки залишаються
  у власній lane, щоб не затримувати й не блокувати публікацію
- Релізні перевірки, що містять секрети, слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  розв’язаний коміт доступний з гілки OpenClaw або релізного тегу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тегу
- Цей SHA path призначений лише для валідації та не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає справжнього релізного тегу
- Обидва workflow тримають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як немутуючий шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane релізних перевірок
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити опублікований шлях інсталяції
  registry у свіжому тимчасовому префіксі
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих Telegram-облікових
  даних. Локальні одноразові запуски maintainer можуть опускати Convex vars і передавати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму післяпублікаційну перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не виконується під час кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальна npm publish має пройти успішний npm `preflight_run_id`
  - реальна npm publish має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases за замовчуванням спрямовуються до `beta`
  - stable npm publish може явно цілитися в `latest` через workflow input
  - token-based mutation npm dist-tag тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    для безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає OIDC-only publish
  - публічний `macOS Release` є validation-only; коли tag існує лише в
    release branch, але workflow запускається з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальна private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість повторного
    rebuilding
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях upgrade в temp-prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старі глобальні інсталяції на
  базовому stable payload
- npm release preflight fails closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожній браузерний dashboard
- Post-publish verification також перевіряє, що опублікована registry install
  містить непорожні runtime deps bundled plugin під кореневим layout `dist/*`.
  Реліз, який постачається з відсутніми або порожніми dependency payloads bundled plugin,
  провалює postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет npm pack `unpackedSize` до
  candidate update tarball, тому installer e2e ловить випадкове pack bloat
  до release publish path
- Якщо релізна робота торкнулася CI planning, extension timing manifests або
  extension test matrices, перегенеруйте й перегляньте належні planner
  outputs matrix `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї release version

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте release
branch, tag або повний commit SHA як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow розв’язує target ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
за потреби запускає окремий post-publish Telegram E2E, коли
`npm_telegram_package_spec` задано. Далі `OpenClaw Release Checks` розгортає
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск є прийнятним лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні, а будь-який optional
`npm_telegram` child є або успішним, або навмисно пропущеним. Фінальний
verifier summary містить таблиці slowest-job для кожного child run, щоб release
manager міг бачити поточний critical path без завантаження logs.
Child workflows запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте довірений harness через вибір workflow run ref.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс широкий advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати target
ref як `release-package-under-test`, і повторно використовує цей artifact як у
release-path Docker checks, так і в Package Acceptance. Це тримає всі
package-facing boxes на тих самих bytes і уникає повторних package builds.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
repo/org variable задано, інакше `openai/gpt-5.4-mini`, бо ця lane
підтверджує package install, onboarding, запуск Gateway і один live agent turn,
а не benchmark найповільнішої default model. Ширша live provider
matrix залишається місцем для model-specific coverage.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну парасольку як перший повторний запуск після цільового виправлення. Якщо один блок
завершується невдало, використайте невдалий дочірній workflow, job, Docker-лінію, профіль пакета, модельного
провайдера або QA-лінію для наступного підтвердження. Запускайте повну парасольку знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази з усіх блоків
застарілими. Фінальний верифікатор парасольки повторно перевіряє записані run
ids дочірніх workflow, тож після успішного повторного запуску дочірнього workflow повторно запустіть лише невдалий
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` у парасольку. `all` — це справжній
запуск release candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише релізний дочірній Plugin, `release-checks` запускає кожен релізний
блок, а вужчі релізні групи — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`, коли
надано окрему пакетну Telegram-лінію.

### Vitest

Блок Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
оминає scoped перевірку змін і примусово запускає звичайний граф тестів для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей блок, щоб відповісти: «чи пройшло дерево джерельного коду повний звичайний набір тестів?»
Це не те саме, що валідація продукту на релізному шляху. Докази, які слід зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному цільовому SHA
- назви невдалих або повільних shard із CI jobs під час розслідування регресій
- артефакти часу виконання Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  run потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли реліз потребує детермінованого звичайного CI, але
не блоків Docker, QA Lab, live, cross-OS або package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у релізному режимі
workflow `install-smoke`. Він валідує release candidate через упаковані
Docker-середовища, а не лише тести на рівні джерельного коду.

Релізне Docker-покриття включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, з QR,
  root/gateway та installer/Bun smoke jobs, що виконуються як окремі install-smoke
  shards
- repository E2E lanes
- релізні Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` і
  `bundled-channels-contracts`
- покриття OpenWebUI всередині chunk `plugins-runtime-services` за запитом
- розділені bundled-channel dependency lanes між channel-smoke, update-target
  і setup/runtime contract chunks замість одного великого bundled-channel job
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker-артефакти перед повторним запуском. Релізний планувальник завантажує
`.artifacts/docker-tests/` із lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і командами повторного запуску. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх релізних chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені Docker image inputs, коли вони доступні, тож
невдала lane може повторно використати той самий tarball і GHCR images.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це агентний
поведінковий і канальний релізний gate, окремий від механіки пакетів Vitest і Docker.

Релізне покриття QA Lab включає:

- mock parity gate, що порівнює кандидатну OpenAI lane з baseline Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile із використанням середовища `qa-live-shared`
- live Telegram QA lane із Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального підтвердження

Використовуйте цей блок, щоб відповісти: «чи коректно поводиться реліз у QA-сценаріях і
live channel flows?» Зберігайте URL артефактів для parity, Matrix і Telegram
lanes під час затвердження релізу. Повне Matrix-покриття лишається доступним як
ручний sharded QA-Lab run, а не стандартна release-critical lane.

### Package

Блок Package — це gate для installable-product. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата в tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує package version і SHA-256 та тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: пакує довірену гілку `package_ref`, tag або повний commit SHA
  з вибраним harness `workflow_ref`
- `source=url`: завантажує HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Релізні Docker chunks покривають
перетинні install, update і plugin-update lanes; Package Acceptance зберігає
artifact-native bundled-channel compat, offline plugin fixtures і Telegram
package QA проти того самого resolved tarball. Це GitHub-native
заміна більшості package/update coverage, що раніше вимагала
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але product validation для package/update має
надавати перевагу Package Acceptance.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакети до
`2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих
у npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про local build metadata stamp files, які вже були випущені. Пізніші пакети
мають відповідати сучасним package contracts; ті самі прогалини провалюють release
validation.

Використовуйте ширші профілі Package Acceptance, коли релізне питання стосується
фактичного installable package:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Поширені профілі package:

- `smoke`: швидкі package install/channel/agent, gateway network і config
  reload lanes
- `package`: install/update/plugin package contracts без live ClawHub; це стандарт
  release-check
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для Telegram-підтвердження package-candidate увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
resolved tarball `package-under-test` у Telegram lane; окремий
Telegram workflow все ще приймає опублікований npm spec для post-publish checks.

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі operator-controlled inputs:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-character workflow-branch commit SHA для validation-only preflight
- `preflight_only`: `true` для validation/build/package only, `false` для
  реального publish path
- `preflight_run_id`: обов’язковий у реальному publish path, щоб workflow повторно використовував
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для publish path; стандартно `beta`

`OpenClaw Release Checks` приймає такі operator-controlled inputs:

- `ref`: гілка, tag або повний commit SHA для валідації. Перевірки із секретами
  вимагають, щоб resolved commit був досяжний з гілки OpenClaw або
  release tag.

Правила:

- Stable і correction tags можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` введення full commit SHA дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  validation-only
- Реальний publish path має використовувати той самий `npm_dist_tag`, що й під час preflight;
  workflow перевіряє, що metadata перед publish далі відповідає цьому

## Послідовність stable npm release

Під час підготовки stable npm release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи tag можна використати поточний повний workflow-branch commit
     SHA для validation-only dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first flow або `latest` лише
   коли навмисно хочете прямий stable publish
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібні normal CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram coverage з одного manual workflow
4. Якщо навмисно потрібен лише deterministic normal test graph, запустіть
   manual `CI` workflow на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow, щоб просунути цю stable version з `beta` до `latest`
8. Якщо реліз навмисно опубліковано напряму в `latest`, а `beta`
   має негайно слідувати за тією самою stable build, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable version, або дозвольте його запланованій
   self-healing sync перемістити `beta` пізніше

Мутація dist-tag живе у приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає OIDC-only publish.

Це зберігає і direct publish path, і beta-first promotion path
задокументованими та видимими для оператора.

Якщо maintainer мусить вдатися до локальної автентифікації npm, запускайте будь-які команди 1Password
CLI (`op`) лише всередині спеціального сеансу tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить запити,
сповіщення й обробку OTP спостережуваними та запобігає повторним сповіщенням хоста.

## Публічні посилання

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers використовують приватну документацію щодо випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного регламенту виконання.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
