---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймального тестування пакета
    - Пошук схеми іменування версій і періодичності
summary: Канали випуску, контрольний список оператора, валідаційні бокси, іменування версій і каденція
title: Політика випусків
x-i18n:
    generated_at: "2026-05-01T02:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb56568bf860ba9eae47df71c5c1ebefe9eb9ae05ac4706dbb425772ff6cdcaa
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали релізів:

- stable: теговані релізи, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: передрелізні теги, які публікуються в npm `beta`
- dev: рухома верхівка `main`

## Найменування версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця чи дня
- `latest` означає поточний просунутий стабільний npm-реліз
- `beta` означає поточну ціль встановлення beta
- Стабільні та стабільні коригувальні релізи типово публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку Mac залишають для стабільних релізів, якщо це не запитано явно

## Частота релізів

- Релізи рухаються спершу через beta
- Стабільний реліз іде лише після перевірки останньої beta
- Maintainers зазвичай готують релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка релізу й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було надіслано або опубліковано й він потребує виправлення, maintainers створюють
  наступний тег `-beta.N` замість видалення чи повторного створення старого beta-тега
- Докладна процедура релізу, затвердження, облікові дані та нотатки щодо відновлення
  доступні лише maintainers

## Контрольний список оператора релізу

Цей контрольний список описує публічну форму процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкату залишаються в
релізному runbook лише для maintainers.

1. Почніть із поточної `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити з неї гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте їх, надішліть і зробіть rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Підніміть версію в кожному потрібному місці для запланованого тега, потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   для попередньої перевірки лише з метою валідації дозволено повний 40-символьний SHA релізної гілки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   релізної гілки, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих релізних тестових боксів: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не проходить, виправте на релізній гілці й повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або allowlist моделей, що
   доводить виправлення. Повторно запускайте весь umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   приймання пакета після публікації проти опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для стабільного релізу продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази валідації. Стабільна npm-публікація повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність стабільного релізу macOS
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm-перевірку після публікації, необов’язковий автономний
    published-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Попередня перевірка релізу

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та меж архітектури були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для етапу перевірки
  пакування
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker
  release-path, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  lanes. Указуйте `npm_telegram_package_spec` лише після публікації пакета,
  коли також має виконатися післяпублікаційний Telegram E2E. Указуйте
  `evidence_package_spec`, коли приватний звіт із доказами має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен доказ side-channel
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` із поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow резолвить кандидата до
  `package-under-test`, повторно використовує планувальник Docker E2E release проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes для install/channel/agent, мережі Gateway і перезавантаження конфігурації
  - `package`: lanes для artifact-native package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: chunks Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для релізного кандидата. Ручні dispatch CI обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Це перевіряє
  QA-lab через локальний OTLP/HTTP-приймач і верифікує експортовані назви trace
  span, обмежені атрибути та редагування content/identifier без потреби в
  Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Релізні перевірки тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity gate QA Lab плюс швидкий
  live-профіль Matrix і lane Telegram QA перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує leases облікових даних Convex CI.
  Запускайте ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Cross-OS runtime-валідація встановлення та оновлення є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Це розділення навмисне: тримайте реальний npm release path коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у
  власній lane, щоб вони не затримували й не блокували публікацію
- Релізні перевірки з секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  резолвлений коміт доступний з гілки OpenClaw або релізного тегу
- Validation-only передрелізна перевірка `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тегу
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у реальну публікацію
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно потребує справжнього релізного тегу
- Обидва workflow тримають реальні шляхи публікації та promotion на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-релізу більше не чекає на окрему lane релізних перевірок
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з опублікованого registry
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding установленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased pool облікових даних Telegram.
  Локальні одноразові запуски maintainer можуть опустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму післяпублікаційну перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається після кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути запущений з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи за замовчуванням ідуть у `beta`
  - стабільний npm publish може явно цілити в `latest` через input workflow
  - token-based мутація npm dist-tag тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` є validation-only; коли тег існує лише в
    релізній гілці, але workflow запускається з `main`, установіть
    `public_release_branch=release/YYYY.M.D`
  - реальний приватний mac publish має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторного
    їх збирання
- Для стабільних correction-релізів на кшталт `YYYY.M.D-N` післяпублікаційний verifier
  також перевіряє той самий шлях оновлення temp-prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- Передрелізна перевірка npm-релізу fails closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню браузерну панель
- Післяпублікаційна перевірка також перевіряє, що встановлення з опублікованого registry
  містить непорожні runtime deps bundled Plugin під кореневим layout `dist/*`.
  Реліз, який постачається з відсутніми або порожніми payload залежностей bundled Plugin,
  провалює postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` на
  candidate update tarball, тому installer e2e ловить випадкове pack bloat
  до release publish path
- Якщо релізна робота торкалася планування CI, timing manifests розширень або
  matrices тестів розширень, перегенеруйте й перегляньте outputs matrix
  `plugin-prerelease-extension-shard`, якими володіє planner, з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий layout CI
- Готовність стабільного macOS-релізу також включає поверхні updater:
  - GitHub release має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічної Sparkle build floor
    для цієї release version

## Релізні тестові бокси

`Full Release Validation` — це спосіб для операторів запускати всі передрелізні тести з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте релізну
гілку, тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow резолвить target ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
опційно запускає standalone післяпублікаційний Telegram E2E, коли
`npm_telegram_package_spec` установлено. Потім `OpenClaw Release Checks` fan out
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як successful, а будь-який опційний
дочірній `npm_telegram` є або successful, або навмисно skipped. Фінальний
verifier summary містить таблиці slowest-job для кожного дочірнього запуску, щоб release
manager міг бачити поточний critical path без завантаження logs.
Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для
повної matrix stage, точних назв job workflow, відмінностей stable і full profile,
артефактів і handles для сфокусованого повторного запуску.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу релізну гілку або тег. Немає окремого input workflow-ref для Full Release Validation;
вибирайте довірений harness, вибираючи ref запуску workflow.

Використовуйте `release_profile`, щоб вибрати широту live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс стабільне покриття provider/backend для схвалення релізу
- `full`: stable плюс широке покриття advisory provider/media

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз резолвити target
ref як `release-package-under-test`, і повторно використовує цей артефакт як у
release-path Docker checks, так і в Package Acceptance. Це утримує всі
package-facing бокси на тих самих байтах і уникає повторних build пакета.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org variable, інакше `openai/gpt-5.4-mini`, бо ця lane
підтверджує install пакета, onboarding, запуск Gateway і один live agent turn,
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

Не використовуйте повний umbrella-процес як перший повторний запуск після сфокусованого виправлення. Якщо один блок
не проходить, використовуйте невдалий дочірній workflow, job, Docker-лану, профіль package, model
provider або QA-лану для наступного доказу. Запускайте повний umbrella-процес знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази для всіх блоків
застарілими. Фінальний верифікатор umbrella-процесу повторно перевіряє записані ідентифікатори запусків дочірніх workflow,
тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдалий
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до umbrella-процесу. `all` є справжнім
запуском release candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише дочірній процес plugin тільки для релізу, `release-checks` запускає кожен релізний
блок, а вужчі релізні групи — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`, коли
надано окрему package Telegram-лану.

### Vitest

Блок Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
обходить changed scoping і примусово запускає звичайний граф тестів для release
candidate: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність Node 22,
`check`, `check-additional`, build smoke, перевірки документації, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей блок, щоб відповісти на запитання: «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що продуктова валідація release path. Докази, які слід зберегти:

- підсумок `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному цільовому SHA
- назви невдалих або повільних шардів із CI jobs під час дослідження регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не потрібні Docker, QA Lab, live, cross-OS або package-блоки:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він валідує release candidate через упаковані
Docker-середовища, а не лише тести на рівні вихідного коду.

Релізне покриття Docker включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що запускаються як окремі install-smoke
  шарди
- repository E2E-лани
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` і
  `bundled-channels-contracts`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли його запитано
- розділені лани залежностей bundled-channel між channel-smoke, update-target
  і setup/runtime contract chunks замість одного великого bundled-channel job
- розділені лани встановлення/видалення bundled plugin
  від `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker-артефакти перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з логами лан, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану scheduler і командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступно, тому
невдала лана може повторно використати той самий tarball і GHCR images.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це агентний
поведінковий і channel-level релізний gate, окремий від Vitest і Docker
package mechanics.

Релізне покриття QA Lab включає:

- mock parity gate, що порівнює OpenAI candidate lane з baseline Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли релізній телеметрії потрібен явний локальний доказ

Використовуйте цей блок, щоб відповісти на запитання: «чи поводиться реліз правильно у QA scenarios і
live channel flows?» Зберігайте URL артефактів для parity, Matrix і Telegram
лан під час затвердження релізу. Повне покриття Matrix залишається доступним як
ручний sharded QA-Lab run, а не стандартна release-critical lane.

### Package

Блок Package — це gate installable-product. Його підтримують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує версію package і SHA-256, а також тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна release
  version OpenClaw
- `source=ref`: запакувати довірену `package_ref` branch, tag або повний commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажити HTTPS `.tgz` з обов'язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Release-path Docker chunks покривають
перекривні лани install, update і plugin-update; Package Acceptance зберігає
artifact-native bundled-channel compat, offline plugin fixtures і Telegram
package QA для того самого resolved tarball. Це GitHub-native
заміна більшості покриття package/update, яке раніше потребувало
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Поблажливість legacy package-acceptance навмисно обмежена в часі. Packages до
`2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих
у npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній збережений `update.channel`, legacy plugin install-record
locations, відсутнє marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований package `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші packages
мають задовольняти сучасні package contracts; ті самі gaps провалюють release
validation.

Використовуйте ширші Package Acceptance profiles, коли release question стосується
фактичного installable package:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Поширені package profiles:

- `smoke`: швидкі package install/channel/agent, gateway network і config
  reload lanes
- `package`: install/update/plugin package contracts без live ClawHub; це стандарт release-check
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
resolved tarball `package-under-test` у Telegram lane; окремий
Telegram workflow усе ще приймає опубліковану npm spec для post-publish checks.

## Вхідні дані NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором input:

- `tag`: обов'язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA workflow-branch для validation-only preflight
- `preflight_only`: `true` для лише validation/build/package, `false` для
  справжнього publish path
- `preflight_run_id`: обов'язковий на справжньому publish path, щоб workflow повторно використовував
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для publish path; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором input:

- `ref`: branch, tag або повний commit SHA для валідації. Secret-bearing checks
  вимагають, щоб resolved commit був доступний з branch OpenClaw або
  release tag.

Правила:

- Stable і correction tags можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` input повного commit SHA дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  validation-only
- Справжній publish path має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням publish

## Послідовність stable npm release

Під час підготовки stable npm release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До існування tag можна використати поточний повний workflow-branch commit
     SHA для validation-only dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first flow або `latest` лише
   тоді, коли ви навмисно хочете direct stable publish
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram coverage з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний test graph, натомість запустіть
   ручний workflow `CI` на release ref
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для promotion цієї stable version з `beta` до `latest`
8. Якщо реліз навмисно опубліковано напряму в `latest`, а `beta`
   має негайно перейти на той самий stable build, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable version, або дозвольте його scheduled
   self-healing sync перемістити `beta` пізніше

Мутація dist-tag живе в приватному repo з міркувань безпеки, тому що вона все ще
потребує `NPM_TOKEN`, тоді як публічний repo зберігає OIDC-only publish.

Це залишає і direct publish path, і beta-first promotion path
задокументованими та видимими для оператора.

Якщо супровіднику доводиться повертатися до локальної автентифікації npm, запускайте будь-які команди 1Password CLI (`op`) лише всередині окремої сесії tmux. Не викликайте `op` безпосередньо з основної оболонки агента; утримання його всередині tmux робить запити, сповіщення й обробку OTP видимими та запобігає повторним сповіщенням хоста.

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

Супровідники використовують приватну документацію щодо випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
