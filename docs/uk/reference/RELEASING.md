---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск валідації релізу або приймання пакета
    - Пошук відомостей про найменування версій і періодичність випусків
summary: Релізні доріжки, контрольний список оператора, середовища валідації, іменування версій і ритм
title: Політика випусків
x-i18n:
    generated_at: "2026-05-03T18:32:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний просунутий стабільний випуск npm
- `beta` означає поточну ціль встановлення beta
- Стабільні та стабільні коригувальні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або просунути перевірену збірку beta пізніше
- Кожен стабільний випуск OpenClaw постачає пакет npm і застосунок macOS разом;
  beta-випуски зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку mac залишають для stable, якщо це явно не запитано

## Періодичність випусків

- Випуски рухаються спершу через beta
- Stable виходить лише після перевірки останньої beta
- Maintainers зазвичай готують випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо тег beta було надіслано або опубліковано і він потребує виправлення, maintainers створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого тегу beta
- Детальна процедура випуску, затвердження, облікові дані та нотатки з відновлення
  доступні лише maintainers

## Контрольний список оператора випуску

Цей контрольний список є публічною формою процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і подробиці екстреного відкату залишаються в
runbook випуску лише для maintainers.

1. Почніть з поточної `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити з нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте їх, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть кожне обов’язкове місце з версією для запланованого тегу, запустіть
   `pnpm plugins:sync`, щоб придатні до публікації пакети Plugin мали спільну версію випуску
   та метадані сумісності, потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тегу
   повний 40-символьний SHA гілки випуску дозволений для validation-only
   preflight. Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте в гілці випуску й повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, provider або allowlist моделей, який
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спершу публікує всі придатні до публікації пакети Plugin в npm, потім публікує той самий
   набір у ClawHub як tarball-и ClawPack npm-pack, а далі просуває
   підготовлений артефакт preflight npm OpenClaw з відповідним dist-tag. Після
   публікації запустіть post-publish package
   acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований попередній випуск потребує виправлення,
   створіть наступний відповідний номер попереднього випуску; не видаляйте і не переписуйте старий
   попередній випуск.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate матиме
    потрібні докази перевірки. Публікація stable npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт preflight через
    `preflight_run_id`; готовність stable macOS-випуску також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий standalone
    published-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Preflight випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку
  валідації пакування
- Запустіть `pnpm plugins:sync` після підняття версії в корені та перед створенням тега. Він
  оновлює версії пакетів публіковних plugins, метадані сумісності OpenClaw peer/API,
  метадані збірки та заготовки журналів змін plugins, щоб вони відповідали версії
  основного релізу. `pnpm plugins:sync:check` — це немутувальний релізний запобіжник;
  workflow публікації завершується з помилкою до будь-якої мутації реєстру, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suite, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакта `release-package-under-test` із release
  checks. Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E також має підтвердити опублікований npm-пакет. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має запускати свою матрицю package/update проти доставленого npm-пакета замість
  артефакта, зібраного з SHA. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли вам потрібне побічне підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes містять `published-upgrade-survivor`, артефакт пакета є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опубліковану базову версію.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes для install/channel/agent, мережі Gateway і перезавантаження конфігурації
  - `package`: artifact-native lanes для package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли вам потрібне лише повне звичайне CI
  покриття для кандидата релізу. Ручні dispatch CI обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Запустіть `OpenClaw Release Publish` для мутувальної послідовності публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікуєте
  тег, досяжний з main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, а scope публікації plugins за замовчуванням
  `all-publishable` залишайте, якщо тільки ви навмисно не виконуєте сфокусований ремонт. Workflow
  серіалізує публікацію plugin npm, публікацію plugin ClawHub і публікацію OpenClaw
  npm, щоб основний пакет не було опубліковано перед його екстерналізованими
  plugins.
- Release checks тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity lane плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує leases облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли вам потрібна повна інвентаризація Matrix
  transport, media та E2EE паралельно.
- Cross-OS валідація runtime для встановлення та оновлення є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  багаторазовий workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live checks залишаються у своєму
  окремому lane, щоб вони не затримували й не блокували публікацію
- Release checks із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  розв’язаний коміт досяжний з гілки OpenClaw або релізного тега
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без вимоги запушеного тега
- Цей шлях SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно потребує справжнього релізного тега
- Обидва workflows тримають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий lane release checks
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити шлях встановлення з опублікованого registry
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і справжній Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased pool облікових даних Telegram.
  Локальні одноразові перевірки maintainer можуть пропускати Convex vars і передавати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальна npm publish має пройти успішний npm `preflight_run_id`
  - реальна npm publish має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи за замовчуванням спрямовуються на `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - token-based мутація npm dist-tag тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає publish лише через OIDC
  - публічний `macOS Release` призначений лише для валідації; коли тег існує лише в
    release branch, але workflow запускається з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторної
    їхньої збірки
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- npm release preflight завершується закрито, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не доставили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковані entrypoints plugins і
  package metadata присутні у встановленому registry layout. Реліз, який
  доставляє відсутні runtime payloads plugins, провалює postpublish verifier і
  не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет npm pack `unpackedSize` до
  candidate update tarball, тож installer e2e ловить випадкове роздування пакета
  до шляху release publish
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, перед схваленням перегенеруйте й перегляньте outputs матриці
  `plugin-prerelease-extension-shard`, якими володіє planner, з
  `.github/workflows/plugin-prerelease.yml`, щоб release notes не описували
  застарілий CI layout
- Готовність стабільного macOS release також включає updater surfaces:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічної Sparkle build floor
    для цієї версії релізу

## Релізні тестові бокси

`Full Release Validation` — це спосіб, у який оператори запускають усі передрелізні тести з
однієї точки входу. Для pinned commit proof на швидкозмінній гілці використовуйте
helper, щоб кожен дочірній workflow запускався з тимчасової гілки, зафіксованої на цільовому
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен дочірній workflow `headSha`
відповідає цільовому, а потім видаляє тимчасову гілку. Це запобігає випадковому підтвердженню
новішого дочірнього запуску `main`.

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

Робочий процес визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, пов’язаних із
пакунком, і запускає автономний package Telegram E2E, коли `release_profile=full`
з `rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгалужується на install smoke, cross-OS release checks, покриття
release-path для live/E2E Docker, Package Acceptance з package QA для Telegram,
QA Lab parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді,
коли підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all дочірній
`npm_telegram` також має бути успішним; поза full/all його пропускають, якщо не
було надано опублікований `npm_telegram_package_spec`. Підсумок фінального
верифікатора містить таблиці найповільніших завдань для кожного дочірнього
запуску, щоб менеджер релізу міг бачити поточний критичний шлях без завантаження
логів.
Див. [Повна перевірка релізу](/uk/reference/full-release-validation) для повної
матриці етапів, точних назв завдань workflow, відмінностей між профілями stable
і full, артефактів і цільових ідентифікаторів повторного запуску.
Дочірні workflow запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на старішу
release-гілку або тег. Окремого вхідного параметра workflow-ref для Full Release
Validation немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомій
`main`; сирі commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для схвалення релізу
- `full`: stable плюс broad advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
визначити цільовий ref як `release-package-under-test`, і повторно використовує
цей артефакт як у release-path Docker checks, так і в Package Acceptance. Це
утримує всі package-facing box на однакових байтах і уникає повторних збірок
пакунка.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org variable, інакше `openai/gpt-5.4`, тому що ця lane доводить
інсталяцію пакунка, onboarding, запуск Gateway і один live agent turn, а не
бенчмарк найповільнішої моделі за замовчуванням. Ширша матриця live provider
залишається місцем для model-specific coverage.

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

Не використовуйте повну umbrella як перший повторний запуск після цільового
виправлення. Якщо один box не проходить, використовуйте failed child workflow,
job, Docker lane, package profile, model provider або QA lane для наступного
доказу. Запускайте повну umbrella знову лише тоді, коли виправлення змінило
спільну release orchestration або зробило попередні all-box докази застарілими.
Фінальний верифікатор umbrella повторно перевіряє записані ідентифікатори
запусків дочірніх workflow, тому після успішного повторного запуску дочірнього
workflow повторно запускайте лише failed parent job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до umbrella. `all` є справжнім
запуском release-candidate, `ci` запускає лише дочірній normal CI,
`plugin-prerelease` запускає лише release-only plugin child, `release-checks`
запускає кожен release box, а вужчі release groups — це `install-smoke`,
`cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і
`npm-telegram`.
Цільові повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`;
full/all запуски з `release_profile=full` використовують package artifact із
release-checks.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Ручний CI навмисно обходить
changed scoping і примусово виконує звичайний test graph для release candidate:
Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: «чи пройшло дерево вихідного коду повний
звичайний набір тестів?» Це не те саме, що release-path product validation.
Докази, які слід зберегти:

- підсумок `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному цільовому SHA
- назви failed або slow shard із CI jobs під час дослідження регресій
- артефакти часу Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте manual CI напряму лише тоді, коли релізу потрібен deterministic normal
CI, але не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box міститься в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також release-mode workflow
`install-smoke`. Він перевіряє release candidate через packaged Docker
environments, а не лише source-level tests.

Release Docker coverage включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що виконуються як окремі install-smoke
  shards
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- OpenWebUI coverage всередині chunk `plugins-runtime-services`, коли це запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler
завантажує `.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані rerun commands включають
попередній `package_artifact_run_id` і підготовлені Docker image inputs, коли
вони доступні, тому failed lane може повторно використати той самий tarball і
GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це release gate для
agentic behavior і channel-level, окремий від Vitest і Docker package mechanics.

Release QA Lab coverage включає:

- mock parity lane, що порівнює OpenAI candidate lane з Opus 4.6 baseline за
  допомогою agentic parity pack
- fast live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей box, щоб відповісти: «чи поводиться реліз правильно в QA
scenarios і live channel flows?» Зберігайте URL артефактів для parity, Matrix і
Telegram lanes під час схвалення релізу. Full Matrix coverage залишається
доступним як ручний sharded QA-Lab run, а не як default release-critical lane.

### Пакунок

Package box — це gate для installable-product. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує candidate
у tarball `package-under-test`, який споживає Docker E2E, перевіряє package
inventory, записує package version і SHA-256, а також тримає workflow harness ref
окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: пакує довірену `package_ref` branch, tag або full commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажує HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA проти того самого resolved tarball. Матриця upgrade охоплює кожен stable npm-published baseline від `2026.4.23` до `latest`; використовуйте
Package Acceptance з `source=npm` для вже випущеного candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
публікацією. Це GitHub-native
заміна для більшості package/update coverage, що раніше вимагало Parallels.
Cross-OS release checks усе ще важливі для OS-specific onboarding, installer і
platform behavior, але package/update product validation має надавати перевагу
Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування оновлень і плагінів](/uk/help/testing-updates-plugins). Використовуйте
його, коли вирішуєте, яка local, Docker, Package Acceptance або release-check
lane доводить plugin install/update, doctor cleanup або published-package
migration change.
Вичерпна published update migration з кожного stable пакунка `2026.4.23+` є
окремим ручним workflow `Update Migration`, а не частиною Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакунки до
`2026.4.25` включно можуть використовувати compatibility path для metadata gaps,
уже опублікованих у npm: private QA inventory entries, відсутні в tarball,
відсутній `gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований пакунок `2026.4.26` може
попереджати про local build metadata stamp files, які вже були випущені. Пізніші
пакунки мають задовольняти modern package contracts; ті самі gaps провалюють
release validation.

Використовуйте ширші Package Acceptance profiles, коли release question стосується
реального installable package:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Поширені package profiles:

- `smoke`: швидке встановлення пакета/каналу/агента, мережа Gateway і смуги перезавантаження конфігурації
- `package`: контракти встановлення/оновлення/пакета Plugin без live ClawHub; це типовий release-check
- `product`: `package` плюс канали MCP, очищення cron/subagent, вебпошук OpenAI і OpenWebUI
- `full`: частини шляху Docker-релізу з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для підтвердження кандидата пакета в Telegram увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у смугу Telegram; окремий
workflow Telegram усе ще приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною мутувальною точкою входу для публікації. Він
оркеструє workflows довіреного видавця в порядку, потрібному релізу:

1. Отримати release tag і визначити його commit SHA.
2. Перевірити, що tag досяжний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тією самою областю дії та SHA.
6. Запустити `OpenClaw NPM Release` з release tag, npm dist-tag і
   збереженим `preflight_run_id`.

Приклад публікації beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільна публікація в типовий beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільне просування безпосередньо до `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте нижчорівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release`
лише для цільового ремонту або повторної публікації. Для ремонту вибраного Plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish` або запустіть дочірній workflow напряму, коли
пакет OpenClaw не має бути опублікований.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, керовані оператором:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для preflight лише з перевіркою
- `preflight_only`: `true` для лише перевірки/збірки/пакування, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий на справжньому шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типово `beta`

`OpenClaw Release Publish` приймає такі вхідні параметри, керовані оператором:

- `tag`: обов’язковий release tag; уже має існувати
- `preflight_run_id`: id успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm-тег для пакета OpenClaw
- `plugin_publish_scope`: типово `all-publishable`; використовуйте `selected` лише
  для цільового ремонту
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типово `true`; встановлюйте `false` лише коли використовуєте
  workflow як оркестратор ремонту тільки Plugin

`OpenClaw Release Checks` приймає такі вхідні параметри, керовані оператором:

- `ref`: гілка, tag або повний commit SHA для перевірки. Перевірки,
  що містять секрети, вимагають, щоб розв’язаний коміт був досяжний з гілки OpenClaw або
  release tag.

Правила:

- Стабільні та корекційні tags можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease tags можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` введення повного commit SHA дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  лише перевіряють
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи tag можна використати поточний повний commit SHA гілки workflow
     для пробного запуску preflight workflow лише з перевіркою
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли вам потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує зовнішні plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив у `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо до `latest` і `beta`
   має негайно вказувати на ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag розміщена в приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і шлях beta-first promotion
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині спеціальної сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить prompts,
alerts і обробку OTP спостережуваними та запобігає повторним alerts на хості.

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
