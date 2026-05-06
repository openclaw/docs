---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаю іменування версій і періодичність випусків
summary: Канали випусків, контрольний список оператора, середовища валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-06T09:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні release-канали:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного корекційного релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний promoted стабільний npm-реліз
- `beta` означає поточну beta-ціль встановлення
- Стабільні та стабільні корекційні релізи за замовчуванням публікуються в npm `beta`; release-оператори можуть явно вибрати `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку для Mac залишають для stable, якщо це не запитано явно

## Каденція релізів

- Релізи рухаються спершу через beta
- Stable виходить лише після перевірки останньої beta
- Maintainers зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб валідація релізу й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег було запушено або опубліковано й він потребує виправлення, maintainers створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура релізу, погодження, облікові дані та нотатки з відновлення
  доступні лише maintainers

## Чекліст release-оператора

Цей чекліст є публічною формою release-процесу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного rollback залишаються в
release runbook лише для maintainers.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт запушено,
   і переконайтеся, що поточний CI `main` достатньо зелений, щоб створювати від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте це, запуште й виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну release-роботу
   безпосередньо в `main`.
5. Підніміть версію в кожному потрібному місці для запланованого тегу, запустіть
   `pnpm plugins:sync`, щоб publishable plugin-пакети мали спільну release-версію
   й metadata сумісності, потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тегу
   повний 40-символьний SHA release-гілки дозволений для validation-only
   preflight. Збережіть успішний `preflight_run_id`.
7. Запустіть усі pre-release тести через `Full Release Validation` для
   release-гілки, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих release test boxes: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не проходить, виправте в release-гілці й повторно запустіть найменший failed
   файл, lane, workflow job, package profile, provider або список дозволених моделей, що
   доводить виправлення. Повторно запускайте повну umbrella-перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   паралельно dispatch-ить усі publishable plugin-пакети в npm і той самий набір у
   ClawHub, а потім просуває підготовлений preflight-артефакт OpenClaw npm
   з відповідним dist-tag одразу після успішної публікації plugin у npm.
   Публікація в ClawHub усе ще може виконуватися, поки OpenClaw npm публікується, але
   release publish workflow не завершується, доки обидва шляхи публікації plugin і
   шлях публікації OpenClaw npm не завершаться успішно. Після публікації запустіть
   post-publish package
   acceptance проти опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо запушений або опублікований prerelease потребує виправлення,
   створіть наступний відповідний prerelease-номер; не видаляйте й не переписуйте старий
   prerelease.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    необхідні докази валідації. Публікація stable в npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight-артефакт через
    `preflight_run_id`; готовність stable-релізу macOS також вимагає
    запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий standalone
    published-npm Telegram E2E, коли потрібен post-publish доказ каналу,
    просування dist-tag за потреби, GitHub release/prerelease notes з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Release preflight

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript
  залишався покритим поза швидшим локальним гейтом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і меж архітектури були зеленими поза швидшим локальним гейтом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку
  валідації пакування
- Запустіть `pnpm plugins:sync` після bump версії в корені й перед тегуванням. Він
  оновлює версії пакетів публіковних plugin, метадані сумісності з peer/API
  OpenClaw, метадані збірки та заготовки changelog plugin, щоб вони відповідали версії
  релізу ядра. `pnpm plugins:sync:check` є немутувальним релізним запобіжником;
  workflow публікації завершується помилкою до будь-якої мутації реєстру, якщо цей крок
  було забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні test boxes з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS
  package checks, parity QA Lab, Matrix і Telegram lanes. Стабільні/типові запуски
  тримають вичерпні live/E2E та Docker release-path soak за
  `run_release_soak=true`; `release_profile=full` примусово вмикає soak. З
  `release_profile=full` і `rerun_group=all` він також запускає package Telegram
  E2E проти артефакта `release-package-under-test` із release checks.
  Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E має також підтвердити опублікований npm-пакет. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має запускати свою матрицю package/update проти доставленого npm-пакета замість
  артефакта, зібраного з SHA. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен side-channel proof
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`
  для пакування довіреної гілки/тега/SHA `package_ref` з поточною обв’язкою
  `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow резолвить кандидата в
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes містять `published-upgrade-survivor`, артефакт пакета є кандидатом, а
  `published_upgrade_survivor_baseline` вибирає опублікований baseline.
  `update-restart-auth` використовує пакет кандидата і як встановлений CLI, і як package-under-test,
  щоб перевірити managed restart path команди update кандидата.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: install/channel/agent, gateway network і config reload lanes
  - `package`: artifact-native package/update/restart/plugin lanes без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне нормальне покриття CI
  для кандидата релізу. Ручні dispatch CI оминають changed scoping
  і примусово вмикають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і верифікує експортовані назви trace
  span, bounded attributes і редагування content/identifier без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним релізом з тегом
- Запустіть `OpenClaw Release Publish` для мутувальної послідовності публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікуєте
  тег, досяжний з main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, і залишайте типовий scope публікації plugin
  `all-publishable`, якщо свідомо не виконуєте сфокусований repair. Workflow
  серіалізує npm-публікацію plugin, публікацію plugin у ClawHub і npm-публікацію OpenClaw,
  щоб core package не було опубліковано перед його externalized
  plugins.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity lane QA Lab плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media та E2EE inventory паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний шлях npm release коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у власній
  lane, щоб вони не затримували й не блокували publish
- Release checks із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  resolved commit досяжний з гілки OpenClaw або release tag
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-branch без потреби в запушеному тегу
- Цей шлях SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  package metadata; реальна публікація все одно потребує справжнього release tag
- Обидва workflows тримають реальний publish і promotion path на GitHub-hosted
  runners, тоді як немутувальний validation path може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити шлях встановлення з опублікованого registry
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити installed-package onboarding, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased Telegram credential
  pool. Локальні одноразові запуски maintainer можуть опускати Convex vars і передавати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke з машини maintainer, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Helper запускає Parallels npm update/fresh-target validation, dispatch `NPM Telegram Beta E2E`, опитує точний workflow run, завантажує artifact і друкує Telegram report.
- Maintainers можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно тільки ручний і
  не запускається на кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути dispatched з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases типово використовують `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - token-based npm dist-tag mutation тепер розташовано в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    public repo зберігає OIDC-only publish
  - public `macOS Release` є validation-only; коли tag існує лише на
    release branch, але workflow dispatched з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість того, щоб збирати
    їх знову
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight fail-closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не доставили порожній browser dashboard
- Post-publish verification також перевіряє, що entrypoints опублікованих plugin і
  package metadata присутні у встановленій registry layout. Реліз, який
  доставляє відсутні runtime payloads plugin, провалює postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також enforce npm pack budget `unpackedSize` для
  candidate update tarball, тому installer e2e ловить випадкове pack bloat
  до release publish path
- Якщо release work торкалася CI planning, extension timing manifests або
  extension test matrices, regenerated і review planner-owned
  outputs матриці `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має зрештою містити packaged `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - packaged app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї release version

## Релізні test boxes

`Full Release Validation` — це спосіб, яким operators запускають усі pre-release tests з
однієї точки входу. Для доказу pinned commit на гілці, що швидко рухається, використовуйте
helper, щоб кожен child workflow запускався з тимчасової гілки, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен child workflow `headSha`
відповідає target, а потім видаляє тимчасову гілку. Це запобігає випадковому підтвердженню
новішого child run `main`.

Для валідації release branch або tag запускайте його з довіреного workflow
ref `main` і передавайте release branch або tag як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow розв’язує цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, орієнтованих
на пакети, і запускає окремий пакетний Telegram E2E, коли
`release_profile=full` з `rerun_group=all` або коли задано
`npm_telegram_package_spec`. Потім `OpenClaw Release Checks` розгалужується на
install smoke, крос-OS перевірки релізу, live/E2E Docker-покриття релізного
шляху, коли soak увімкнено, Package Acceptance з Telegram package QA, parity QA
Lab, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation` показує `normal_ci` і `release_checks` як
успішні. У режимі full/all дочірній `npm_telegram` також має бути успішним; поза
full/all його пропускають, якщо не було надано опублікований
`npm_telegram_package_spec`. Підсумкове зведення верифікатора містить таблиці
найповільніших завдань для кожного дочірнього запуску, щоб менеджер релізу міг
бачити поточний критичний шлях без завантаження логів.
Див. [Повну валідацію релізу](/uk/reference/full-release-validation) для повної
матриці етапів, точних назв завдань workflow, відмінностей між профілями stable
і full, артефактів і ручок для сфокусованих повторних запусків.
Дочірні workflow запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на старішу
релізну гілку або тег. Окремого input для workflow-ref у Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для точного підтвердження коміту на
рухомому `main`; сирі commit SHA не можуть бути ref для workflow dispatch, тому
використовуйте `pnpm ci:full-release --sha <sha>`, щоб створити закріплену
тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший релізно-критичний шлях OpenAI/core live і Docker
- `stable`: minimum плюс стабільне provider/backend-покриття для схвалення релізу
- `full`: stable плюс широке advisory-покриття provider/media

Використовуйте `run_release_soak=true` зі `stable`, коли реліз-блокувальні лінії
зелені й потрібен вичерпний live/E2E, Docker релізний шлях і обмежений sweep
published upgrade-survivor перед просуванням. Цей sweep покриває останні чотири
стабільні пакети плюс закріплені baseline `2026.4.23` і `2026.5.2`, а також
старіше покриття `2026.4.15`, з видаленими дубльованими baseline, і кожен
baseline розбито в окреме завдання Docker runner. `full` передбачає
`run_release_soak=true`.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
розв’язати цільовий ref як `release-package-under-test`, і повторно використовує
цей артефакт у крос-OS, Package Acceptance і Docker-перевірках релізного шляху,
коли запускається soak. Це тримає всі package-facing бокси на тих самих байтах і
уникає повторних збірок пакета. Крос-OS OpenAI install smoke використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли змінна repo/org задана, інакше
`openai/gpt-5.4`, бо ця лінія доводить установлення пакета, onboarding, запуск
Gateway і один live agent turn, а не benchmark найповільнішої моделі за
замовчуванням. Ширша live provider matrix лишається місцем для
model-specific-покриття.

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну парасольку як перший повторний запуск після
сфокусованого виправлення. Якщо один бокс падає, використовуйте failed child
workflow, job, Docker lane, package profile, model provider або QA lane для
наступного доказу. Запускайте повну парасольку знову лише тоді, коли виправлення
змінило спільну релізну оркестрацію або зробило попередні all-box докази
застарілими. Підсумковий верифікатор парасольки повторно перевіряє записані
ідентифікатори дочірніх workflow run, тому після успішного повторного запуску
дочірнього workflow повторно запускайте лише невдале батьківське завдання
`Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` у парасольку. `all` є
справжнім запуском release-candidate, `ci` запускає лише дочірній normal CI,
`plugin-prerelease` запускає лише release-only plugin child, `release-checks`
запускає кожен release box, а вужчі release groups: `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані повторні запуски `npm-telegram` потребують
`npm_telegram_package_spec`; full/all запуски з `release_profile=full`
використовують package artifact із release-checks. Сфокусовані крос-OS повторні
запуски можуть додати `cross_os_suite_filter=windows/packaged-upgrade` або інший
OS/suite filter. Збої QA release-check є advisory; QA-only збій не блокує
валідацію релізу.

### Vitest

Бокс Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно обходить
changed scoping і примусово запускає звичайний граф тестів для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей бокс, щоб відповісти: "чи пройшло дерево джерел повний
звичайний набір тестів?" Це не те саме, що product validation релізного шляху.
Докази, які потрібно зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному цільовому SHA
- назви failed або slow shards із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує performance analysis

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований
normal CI, але не потрібні Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Бокс Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode workflow
`install-smoke`. Він валідує release candidate через packaged Docker
environments, а не лише source-level tests.

Release Docker coverage включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA,
  із QR, root/gateway та installer/Bun smoke jobs, що виконуються як окремі
  install-smoke shards
- repository E2E lanes
- Docker chunks релізного шляху: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- OpenWebUI coverage всередині chunk `plugins-runtime-services`, коли це
  запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте артефакти Docker перед повторним запуском. Scheduler релізного
шляху завантажує `.artifacts/docker-tests/` з lane logs, `summary.json`,
`failures.json`, phase timings, scheduler plan JSON і командами повторного
запуску. Для сфокусованого відновлення використовуйте
`docker_lanes=<lane[,lane]>` на reusable live/E2E workflow замість повторного
запуску всіх release chunks. Згенеровані команди повторного запуску містять
попередні `package_artifact_run_id` і prepared Docker image inputs, коли вони
доступні, тож невдала lane може повторно використати той самий tarball і GHCR
images.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це agentic behavior і
channel-level release gate, окремий від Vitest і механіки Docker package.

Release QA Lab coverage включає:

- mock parity lane, що порівнює OpenAI candidate lane з Opus 4.6 baseline за
  допомогою agentic parity pack
- fast live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей бокс, щоб відповісти: "чи поводиться реліз правильно в QA
scenarios і live channel flows?" Зберігайте artifact URLs для parity, Matrix і
Telegram lanes під час схвалення релізу. Повне Matrix coverage лишається
доступним як ручний sharded QA-Lab run, а не default release-critical lane.

### Пакет

Бокс Package — це gate installable-product. Його підтримують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує candidate
у tarball `package-under-test`, який споживає Docker E2E, валідує package
inventory, записує package version і SHA-256 та тримає workflow harness ref
окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна release version
  OpenClaw
- `source=ref`: запакувати довірену гілку `package_ref`, тег або повний commit
  SHA з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
prepared release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update,
configured-auth update restart, stale plugin dependency cleanup, offline plugin
fixtures, plugin update і Telegram package QA проти того самого resolved
tarball. Blocking release checks використовують default latest published package
baseline; `run_release_soak=true` або `release_profile=full` розширює це до
кожного stable npm-published baseline від `2026.4.23` до `latest` плюс
reported-issue fixtures. Використовуйте Package Acceptance з `source=npm` для
вже shipped candidate або `source=ref`/`source=artifact` для SHA-backed local npm
tarball перед публікацією. Це GitHub-native заміна більшості package/update
coverage, яке раніше потребувало Parallels. Крос-OS release checks усе ще
важливі для OS-specific onboarding, installer і platform behavior, але
package/update product validation має віддавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation:
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте
його, коли вирішуєте, яка local, Docker, Package Acceptance або release-check
lane доводить plugin install/update, doctor cleanup або published-package
migration change. Вичерпна published update migration з кожного stable
`2026.4.23+` package — це окремий ручний workflow `Update Migration`, а не
частина Full Release CI.

Застаріла поблажливість package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин метаданих, уже опублікованих
до npm: приватні записи інвентарю QA, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch-файли у git-fixture, похідній від tarball,
відсутній збережений `update.channel`, застарілі розташування install-record для plugin,
відсутнє збереження marketplace install-record, а також міграція метаданих конфігурації
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про локальні stamp-файли метаданих збірки, які вже були випущені. Пізніші пакети
мають відповідати сучасним контрактам пакетів; ті самі прогалини провалюють валідацію
релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
фактичного встановлюваного пакета:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Поширені профілі пакетів:

- `smoke`: швидкі лінії встановлення пакета, каналу й агента, мережі Gateway та
  перезавантаження конфігурації
- `package`: контракти встановлення, оновлення, перезапуску та package-контракти plugin без live
  ClawHub; це типовий профіль release-check
- `product`: `package` плюс MCP-канали, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: фрагменти release-path Docker з OpenWebUI
- `custom`: точний список `docker_lanes` для зосереджених повторних запусків

Для package-candidate підтвердження Telegram увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у Telegram lane; окремий
Telegram workflow і далі приймає опубліковану npm spec для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною змінювальною точкою входу для публікації. Вона
оркеструє trusted-publisher workflow у потрібному для релізу порядку:

1. Отримує release tag і визначає його commit SHA.
2. Перевіряє, що tag досяжний із `main` або `release/*`.
3. Запускає `pnpm plugins:sync:check`.
4. Диспетчеризує `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Диспетчеризує `Plugin ClawHub Release` з тим самим scope і SHA.
6. Диспетчеризує `OpenClaw NPM Release` з release tag, npm dist-tag і
   збереженим `preflight_run_id`.

Приклад публікації beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільна публікація до типового beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Пряме просування стабільного релізу до `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте нижчорівневі workflow `Plugin NPM Release` і `Plugin ClawHub Release`
лише для зосередженого виправлення або повторної публікації. Для виправлення вибраного plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish`, або диспетчеризуйте дочірній workflow напряму, коли
пакет OpenClaw не має публікуватися.

## Вхідні дані NPM workflow

`OpenClaw NPM Release` приймає такі вхідні дані, керовані оператором:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA workflow-branch лише для валідаційного preflight
- `preflight_only`: `true` лише для валідації, збірки та пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для шляху публікації; типово `beta`

`OpenClaw Release Publish` приймає такі вхідні дані, керовані оператором:

- `tag`: обов’язковий release tag; має вже існувати
- `preflight_run_id`: успішний preflight run id `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm tag для пакета OpenClaw
- `plugin_publish_scope`: типово `all-publishable`; використовуйте `selected` лише
  для зосередженого виправлення
- `plugins`: розділені комами імена пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типово `true`; задавайте `false` лише тоді, коли використовуєте workflow
  як оркестратор виправлень лише для plugin

`OpenClaw Release Checks` приймає такі вхідні дані, керовані оператором:

- `ref`: branch, tag або повний commit SHA для валідації. Перевірки із секретами
  вимагають, щоб розв’язаний commit був досяжний з OpenClaw branch або
  release tag.
- `run_release_soak`: увімкнути вичерпні live/E2E, release-path Docker і
  all-since upgrade-survivor soak на stable/default release checks. Примусово
  вмикається через `release_profile=full`.

Правила:

- Stable і correction tags можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease tags можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` вхідний повний commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди виконують
  лише валідацію
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Перш ніж tag існуватиме, можна використати поточний повний commit SHA
     workflow-branch для валідаційного dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   тоді, коли навмисно потрібна пряма стабільна публікація
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує externalized plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив до `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно був опублікований напряму до `latest`, а `beta`
   має негайно вказувати на ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   self-healing sync пізніше перемістити `beta`

Мутація dist-tag живе у приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це робить і шлях прямої публікації, і шлях просування beta-first
задокументованими та видимими для операторів.

Якщо maintainer має повернутися до локальної npm-аутентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
напряму з основної shell агента; утримання цього всередині tmux робить prompts,
alerts і обробку OTP видимими та запобігає повторним host alerts.

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

Maintainers використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
