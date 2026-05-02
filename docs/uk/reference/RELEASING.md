---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте іменування версій і періодичність випусків
summary: Лінії випуску, контрольний список оператора, середовища перевірки, іменування версій і періодичність
title: Політика релізів
x-i18n:
    generated_at: "2026-05-02T18:57:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18cee58dcad91e24c0d76622a9ed1568f93e4e2c51deae9ad06ccc7feb831d3a
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має чотири публічні канали релізів:

- stable: позначені тегами релізи, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- alpha: prerelease-теги, які публікуються в npm `alpha`
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального стабільного релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія alpha prerelease: `YYYY.M.D-alpha.N`
  - Git-тег: `vYYYY.M.D-alpha.N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний npm-реліз
- `alpha` означає поточну ціль встановлення alpha
- `beta` означає поточну ціль встановлення beta
- Стабільні та коригувальні стабільні релізи типово публікуються в npm `beta`; оператори релізу можуть явно вибрати `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний реліз OpenClaw постачає npm-пакет і застосунок macOS разом;
  beta-релізи зазвичай спершу перевіряють і публікують шлях npm/package, а
  збірку/підпис/нотаризацію застосунку mac залишають для stable, якщо це явно не запитано

## Частота релізів

- Релізи рухаються спершу через beta
- Stable виходить лише після перевірки останньої beta
- Мейнтейнери зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка релізу й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано й потрібне виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура релізу, затвердження, облікові дані та нотатки з відновлення
  доступні лише мейнтейнерам

## Чекліст оператора релізу

Цей чекліст описує публічну форму процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
runbook релізу лише для мейнтейнерів.

1. Почніть із поточної `main`: отримайте найновіші зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створювати від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувачів, закомітьте його, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Підніміть версію в кожному потрібному місці для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб публіковні пакети Plugin мали спільну версію релізу
   й метадані сумісності, потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тега немає,
   повний 40-символьний SHA гілки релізу дозволений для preflight лише з метою перевірки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі pre-release тести через `Full Release Validation` для
   гілки релізу, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих релізних тестових наборів: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте це в гілці релізу й повторно запустіть найменший невдалий
   файл, канал, workflow job, профіль пакета, провайдера або allowlist моделі, який
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для alpha або beta позначте `vYYYY.M.D-alpha.N` або `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спершу публікує всі публіковні пакети Plugin в npm, другим кроком публікує той самий
   набір у ClawHub, а потім просуває підготовлений preflight-артефакт OpenClaw npm
   з відповідним dist-tag. Після публікації запустіть post-publish package
   acceptance для опублікованого пакета `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` або `openclaw@beta`. Якщо надісланий або
   опублікований prerelease потребує виправлення, створіть наступний відповідний номер prerelease;
   не видаляйте й не переписуйте старий prerelease.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази перевірки. Публікація stable в npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight-артефакт через
    `preflight_run_id`; готовність stable-релізу macOS також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов'язковий standalone
    published-npm Telegram E2E, коли потрібен post-publish доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Release preflight

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та меж архітектури були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку перевірки
  пакування
- Запустіть `pnpm plugins:sync` після підвищення версії в корені й перед створенням тега. Він
  оновлює версії пакетів публіковних Plugin, метадані сумісності з OpenClaw peer/API,
  метадані збірки та заготовки журналів змін Plugin, щоб вони відповідали версії
  релізу ядра. `pnpm plugins:sync:check` — це немутуючий релізний запобіжник;
  workflow публікації завершується з помилкою перед будь-якою зміною реєстру, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед затвердженням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, диспетчеризує ручний `CI` і диспетчеризує
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` із release
  checks. Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E має також підтвердити опублікований npm-пакет. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має запускати свою матрицю package/update проти відвантаженого npm-пакета замість
  артефакту, зібраного з SHA. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен доказ через побічний канал
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS-тарболу з обов’язковим
  SHA-256; або `source=artifact` для тарболу, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата в
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  тарболу й може запускати Telegram QA проти того самого тарболу з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes для install/channel/agent, мережі Gateway і перезавантаження конфігурації
  - `package`: artifact-native lanes для package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для релізного кандидата. Ручні dispatch CI оминають changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність із Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke`, коли перевіряєте релізну телеметрію. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Запустіть `OpenClaw Release Publish` для мутуючої послідовності публікації після того, як
  тег існує. Dispatch його з `release/YYYY.M.D` (або `main`, коли публікуєте
  тег, досяжний із main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, і залишайте типовий scope публікації Plugin
  `all-publishable`, якщо тільки ви навмисно не запускаєте сфокусоване виправлення. Workflow
  серіалізує npm-публікацію Plugin, публікацію Plugin у ClawHub і npm-публікацію OpenClaw,
  щоб core package не було опубліковано перед його зовнішніми
  Plugin.
- Release checks тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає шлюз QA Lab mock parity плюс швидкий
  live Matrix profile і Telegram QA lane перед затвердженням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує leases облікових даних Convex CI.
  Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` напряму
- Це розділення навмисне: тримайте справжній npm release path коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у своїй
  окремій lane, щоб вони не затримували й не блокували публікацію
- Release checks, що містять секрети, слід dispatch через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  розв’язаний коміт досяжний із гілки OpenClaw або релізного тега
- validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тега
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у справжню публікацію
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; справжня публікація все одно потребує справжнього релізного тега
- Обидва workflow залишають справжній шлях публікації та promotion на GitHub-hosted
  runners, тоді як немутуючий шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  із використанням обох workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane release checks
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед затвердженням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити опублікований шлях встановлення з реєстру
  у свіжому тимчасовому префіксі
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased Telegram credential
  pool. Разові локальні запуски maintainer можуть опустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish check із GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - справжній npm publish має пройти успішний npm `preflight_run_id`
  - справжній npm publish має бути dispatch з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases типово використовують `beta`
  - stable npm publish може явно таргетувати `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає OIDC-only publish
  - публічний `macOS Release` призначений лише для валідації; коли тег існує лише в
    release branch, але workflow dispatch з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - справжній private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - справжні publish paths просувають підготовлені артефакти замість повторної
    їх збірки
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- npm release preflight fail closed, якщо тарбол не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню браузерну dashboard
- Post-publish verification також перевіряє, що опубліковані entrypoints Plugin і
  метадані пакета присутні в установленому layout реєстру. Реліз, який
  відвантажує відсутні runtime payloads Plugin, провалює postpublish verifier і
  не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  candidate update tarball, тож installer e2e ловить випадкове роздуття пакета
  перед release publish path
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, регенеруйте та перегляньте planner-owned
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед затвердженням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після publish
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї релізної версії

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні тести з
однієї точки входу. Для доказу pinned commit на швидкозмінній гілці використовуйте
helper, щоб кожен child workflow запускався з тимчасової гілки, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, dispatch `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен child workflow `headSha`
відповідає target, а потім видаляє тимчасову гілку. Це запобігає випадковому
доведенню новішого child run `main`.

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

Робочий процес визначає цільовий ref, запускає вручну `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
окремий Telegram E2E для пакета, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгалужується на install smoke, крос-ОС перевірки релізу, live/E2E Docker
покриття release-path, Package Acceptance з Telegram package QA, паритет QA Lab,
live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли у зведенні
`Full Release Validation`
показано успішні `normal_ci` і `release_checks`. У режимі full/all дочірній
`npm_telegram` також має бути успішним; поза full/all його пропускають, якщо не
було надано опублікований `npm_telegram_package_spec`. Підсумкове зведення
верифікатора містить таблиці найповільніших завдань для кожного дочірнього запуску,
щоб менеджер релізу міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation) для повної
матриці етапів, точних назв завдань workflow, відмінностей між профілями stable і full,
артефактів і дескрипторів для сфокусованих повторних запусків.
Дочірні workflow запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на старішу
релізну гілку або тег. Окремого вхідного параметра workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомому `main`;
сирі SHA комітів не можуть бути ref для workflow dispatch, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший критичний для релізу OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend покриття для схвалення релізу
- `full`: stable плюс широке консультативне покриття provider/media

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт як у
release-path Docker перевірках, так і в Package Acceptance. Це утримує всі
package-facing boxes на тих самих байтах і уникає повторних збірок пакета.
Крос-ОС OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли задано
змінну repo/org, інакше `openai/gpt-5.4`, оскільки ця lane
доводить встановлення пакета, onboarding, запуск Gateway і один live agent turn,
а не бенчмарк найповільнішої моделі за замовчуванням. Ширша live provider
матриця лишається місцем для покриття, специфічного для моделей.

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

Не використовуйте повний umbrella як перший повторний запуск після сфокусованого виправлення. Якщо один box
завершився невдало, використовуйте невдалий дочірній workflow, завдання, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повний umbrella знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні all-box докази
застарілими. Підсумковий верифікатор umbrella повторно перевіряє записані ids запусків дочірніх workflow,
тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` в umbrella. `all` — це справжній
запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише дочірній plugin для релізу, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all запуски
з `release_profile=full` використовують артефакт пакета release-checks.

### Vitest

Vitest box — це дочірній workflow ручного `CI`. Ручний CI навмисно
оминає changed scoping і примусово запускає звичайний тестовий граф для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: "чи пройшло дерево вихідного коду повний звичайний тестовий набір?"
Це не те саме, що release-path product validation. Докази, які варто зберегти:

- зведення `Full Release Validation`, яке показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shard із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли реліз потребує детермінованого звичайного CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box міститься в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він валідує release candidate через packaged
Docker environments, а не лише через source-level tests.

Release Docker coverage включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, із QR,
  root/gateway та installer/Bun smoke jobs, що працюють як окремі install-smoke
  shards
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- OpenWebUI coverage всередині chunk `plugins-runtime-services`, коли запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` through
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте артефакти Docker перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані rerun commands включають попередні
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступно, тож
невдала lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це агентний
behavior і channel-level release gate, окремий від Vitest і механіки Docker
package.

Release QA Lab coverage включає:

- mock parity gate, що порівнює кандидатну OpenAI lane з Opus 4.6
  baseline за допомогою agentic parity pack
- швидкий live Matrix QA profile із середовищем `qa-live-shared`
- live Telegram QA lane з Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей box, щоб відповісти: "чи реліз поводиться коректно в QA scenarios і
live channel flows?" Зберігайте URL артефактів для parity, Matrix і Telegram
lanes під час схвалення релізу. Повне Matrix coverage лишається доступним як
ручний sharded QA-Lab run, а не як release-critical lane за замовчуванням.

### Пакет

Package box — це gate installable-product. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата в tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує package version і SHA-256 та тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна release
  version OpenClaw
- `source=ref`: пакує довірену гілку `package_ref`, тег або повний SHA коміту
  з вибраним harness `workflow_ref`
- `source=url`: завантажує HTTPS `.tgz` з обов'язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance утримує migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA на тому самому resolved tarball. Upgrade matrix покриває кожен stable npm-published baseline від `2026.4.23` до `latest`; використовуйте
Package Acceptance з `source=npm` для вже відвантаженого кандидата або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
публікацією. Це GitHub-native
заміна більшості package/update coverage, яке раніше вимагало
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Канонічний чеклист для update і plugin validation:
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Вичерпна published update migration з кожного stable пакета `2026.4.23+` — це
окремий ручний workflow `Update Migration`, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих
у npm: private QA inventory entries, яких немає в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній збережений `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про local build metadata stamp files, які вже були відвантажені. Пізніші пакети
мають задовольняти modern package contracts; ті самі gaps провалюють release
validation.

Використовуйте ширші Package Acceptance profiles, коли release question стосується
фактичного installable package:

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

- `smoke`: швидкі package install/channel/agent, gateway network і config
  reload lanes
- `package`: install/update/plugin package contracts без live ClawHub; це release-check
  default
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для підтвердження Telegram для пакета-кандидата увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у lane Telegram; окремий
workflow Telegram і надалі приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною мутувальною точкою входу для публікації. Він
оркеструє workflow trusted-publisher у порядку, потрібному релізу:

1. Взяти release tag і визначити його commit SHA.
2. Перевірити, що tag досяжний з `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тією самою областю й SHA.
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

Приклад публікації alpha:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

Стабільна публікація до стандартного beta dist-tag:

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

Використовуйте нижчорівневі workflow `Plugin NPM Release` і `Plugin ClawHub Release`
лише для цільового ремонту або повторної публікації. Для ремонту вибраного Plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish`, або запускайте дочірній workflow безпосередньо, коли
пакет OpenClaw не слід публікувати.

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі вхідні дані, керовані оператором:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1`, або
  `v2026.4.2-alpha.1` чи `v2026.4.2-beta.1`; коли `preflight_only=true`, ним також може бути поточний
  повний 40-символьний commit SHA гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm tag для шляху публікації; стандартно `beta`

`OpenClaw Release Publish` приймає такі введення, керовані оператором:

- `tag`: обов’язковий тег випуску; має вже існувати
- `preflight_run_id`: ідентифікатор успішного попереднього запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий тег npm для пакета OpenClaw
- `plugin_publish_scope`: за замовчуванням `all-publishable`; використовуйте `selected` лише
  для цільових робіт із виправлення
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: за замовчуванням `true`; установлюйте `false` лише тоді, коли використовуєте
  робочий процес як оркестратор виправлення лише для Plugin

`OpenClaw Release Checks` приймає такі введення, керовані оператором:

- `ref`: гілка, тег або повний SHA коміту для перевірки. Перевірки із секретами
  вимагають, щоб розв’язаний коміт був досяжний з гілки OpenClaw або
  тегу випуску.

Правила:

- Стабільні та коригувальні теги можуть публікуватися або в `beta`, або в `latest`
- Альфа-теги попередніх випусків можуть публікуватися лише в `alpha`
- Бета-теги попередніх випусків можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` введення повного SHA коміту дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для перевірки
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час попередньої перевірки;
  робочий процес перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного випуску npm

Під час підготовки стабільного випуску npm:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До створення тегу можна використати поточний повний SHA коміту гілки робочого процесу
     для dry run робочого процесу попередньої перевірки лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   тоді, коли навмисно потрібна пряма стабільна публікація
3. Запустіть `Full Release Validation` для гілки випуску, тегу випуску або повного
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного робочого процесу
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний робочий процес `CI` на ref випуску
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує зовнішні Plugin в npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо випуск потрапив у `beta`, використайте приватний робочий процес
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо випуск навмисно опубліковано безпосередньо в `latest`, а `beta`
   має негайно вказувати на той самий стабільний білд, використайте той самий приватний
   робочий процес, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Зміна dist-tag живе в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це робить як шлях прямої публікації, так і шлях просування beta-first
задокументованими й видимими для оператора.

Якщо супровіднику потрібно повернутися до локальної автентифікації npm, запускайте будь-які команди 1Password
CLI (`op`) лише всередині виділеної сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання цього всередині tmux робить запити,
сповіщення та обробку OTP спостережуваними й запобігає повторним сповіщенням хоста.

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

Супровідники використовують приватну документацію випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
