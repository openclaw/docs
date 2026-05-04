---
read_when:
    - Шукаємо визначення публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте іменування версій і періодичність випусків
summary: Релізні лінії, контрольний список оператора, середовища валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-04T22:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc9b8f82deb90c57c7777480013a5ee956d1123e0b16134daf90a94bc82952cb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: передрелізні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний просунутий стабільний випуск npm
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та стабільні коригувальні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  бета-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збірку/підпис/нотаризацію застосунку mac залишають для стабільного випуску, якщо це явно не запитано

## Частота випусків

- Випуски рухаються спочатку через beta
- Stable виходить лише після перевірки останньої beta
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано і потрібне виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, затвердження, облікові дані та нотатки з відновлення
  призначені лише для супровідників

## Контрольний список оператора випуску

Цей контрольний список є публічною формою процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкоту залишаються в
release runbook лише для супровідників.

1. Почніть із поточного `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте його, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно залишено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Збільште версію в усіх обов’язкових місцях для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб публіковні пакети Plugin мали спільну версію випуску
   та метадані сумісності, потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   повний 40-символьний SHA гілки випуску дозволено для preflight лише з метою перевірки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових блоків випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка завершується невдало, виправте проблему в гілці випуску та повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Повторно запускайте весь umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спочатку публікує всі публіковні пакети Plugin в npm, потім публікує той самий
   набір у ClawHub як tarball-и ClawPack npm-pack, а потім просуває
   підготовлений preflight-артефакт OpenClaw npm з відповідним dist-tag. Після
   публікації запустіть приймальну перевірку пакета після публікації
   для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований передреліз потребує виправлення,
   створіть наступний відповідний номер передрелізу; не видаляйте і не перезаписуйте старий
   передреліз.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    необхідні докази перевірки. Публікація stable npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight-артефакт через
    `preflight_run_id`; готовність стабільного випуску macOS також вимагає
    запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть npm-перевірник після публікації, необов’язковий автономний
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
- Запустіть `pnpm plugins:sync` після підвищення версії в корені й перед тегуванням. Він
  оновлює версії пакетів придатних до публікації plugin, метадані сумісності
  OpenClaw peer/API, метадані збірки та заготовки журналів змін plugin, щоб вони відповідали
  версії основного релізу. `pnpm plugins:sync:check` — це немодифікувальний релізний запобіжник;
  workflow публікації завершується помилкою до будь-якої мутації реєстру, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, між-ОС
  перевірок пакетів, паритету QA Lab, Matrix і Telegram lanes. Стабільні/типові запуски
  тримають вичерпні live/E2E та Docker release-path soak за
  `run_release_soak=true`; `release_profile=full` примусово вмикає soak. З
  `release_profile=full` і `rerun_group=all` він також запускає package Telegram
  E2E проти артефакту `release-package-under-test` із release checks.
  Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E має також підтвердити опублікований npm-пакет. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має виконати свою матрицю package/update проти відвантаженого npm-пакета замість
  артефакту, зібраного за SHA. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен side-channel доказ
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes включають `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/каналу/агента, мережі Gateway і перезавантаження конфігурації
  - `package`: artifact-native lanes package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для релізного кандидата. Ручні запуски CI обходять
  changed scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запустіть `pnpm release:check` перед кожним тегованим релізом
- Запустіть `OpenClaw Release Publish` для мутувальної послідовності публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікуєте
  тег, досяжний із main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, і залишайте типовий scope публікації plugin
  `all-publishable`, якщо ви навмисно не виконуєте сфокусоване виправлення. Workflow
  серіалізує npm-публікацію plugin, публікацію plugin у ClawHub і npm-публікацію OpenClaw,
  щоб основний пакет не був опублікований раніше за його зовнішні
  plugins.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity lane QA Lab плюс швидкий
  live-профіль Matrix і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує оренди
  облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Між-ОС валідація runtime встановлення й оновлення є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  багаторазовий workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний шлях npm-релізу коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки залишаються у своїй
  lane, щоб вони не затримували й не блокували публікацію
- Release checks із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  resolved commit досяжний із гілки OpenClaw або релізного тегу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тегу
- Цей шлях SHA є лише validation-only і не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно потребує справжнього релізного тегу
- Обидва workflow тримають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний тег beta/correction) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну версію beta/correction), щоб перевірити шлях встановлення
  опублікованого registry у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові maintainer-запуски можуть пропустити змінні Convex і передати три
  env-облікові дані `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke з машини maintainer, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Helper запускає Parallels-валідацію npm update/fresh-target, запускає `NPM Telegram Beta E2E`, опитує точний workflow run, завантажує артефакт і друкує Telegram-звіт.
- Maintainers можуть запустити ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожному merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути запущений із тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи типово спрямовані на `beta`
  - стабільний npm publish може явно спрямовуватися на `latest` через input workflow
  - token-based мутація npm dist-tag тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` є validation-only; коли тег існує лише в
    релізній гілці, але workflow запускається з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальний приватний mac publish має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths підвищують підготовлені артефакти замість повторної
    їх збірки
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях temp-prefix upgrade з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому стабільному payload
- npm release preflight завершується закритою помилкою, якщо tarball не містить обох
  `dist/control-ui/index.html` і непорожнього payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковані entrypoints plugin і
  метадані package присутні в установленому registry layout. Реліз, який
  відвантажує відсутні runtime payloads plugin, провалює postpublish verifier і
  не може бути підвищений до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  candidate update tarball, щоб installer e2e ловив випадкове роздуття пакування
  до release publish path
- Якщо релізна робота торкнулася планування CI, manifests timing extension або
  матриць тестів extension, перегенеруйте й перегляньте planner-owned
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність стабільного macOS-релізу також включає updater surfaces:
  - GitHub release має врешті містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожню URL Sparkle feed
    і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї версії релізу

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні тести з
однієї точки входу. Для доказу pinned commit на швидко змінюваній гілці використовуйте
helper, щоб кожен дочірній workflow запускався з тимчасової гілки, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен дочірній workflow `headSha`
збігається з target, а потім видаляє тимчасову гілку. Це запобігає випадковому
підтвердженню нового дочірнього запуску `main`.

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

Робочий процес визначає цільовий ref, запускає manual `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, орієнтованих на пакет, і
запускає автономний package Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгортається на install smoke, cross-OS release checks, live/E2E Docker
покриття release-path, коли soak увімкнено, Package Acceptance з Telegram
package QA, QA Lab parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all він пропускається,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальне
зведення verifier містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб release
manager міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна release validation](/uk/reference/full-release-validation), щоб отримати
повну матрицю етапів, точні назви workflow job, відмінності між stable і full profile,
артефакти та ручки сфокусованого повторного запуску.
Дочірні workflow запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для exact commit proof на рухомій `main`;
raw commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову branch.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс широке advisory provider/media coverage

Використовуйте `run_release_soak=true` зі `stable`, коли release-blocking lanes
зелені й потрібен вичерпний live/E2E, Docker release-path і
all-since-2026.4.23 upgrade-survivor sweep перед promotion. `full` передбачає
`run_release_soak=true`.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт у cross-OS,
Package Acceptance та release-path Docker checks, коли виконується soak. Це утримує
всі package-facing boxes на тих самих байтах і уникає повторних package builds.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
repo/org variable задана, інакше `openai/gpt-5.4`, оскільки ця lane
доводить package install, onboarding, запуск gateway і один live agent turn,
а не бенчмаркує найповільнішу default model. Ширша live provider
matrix залишається місцем для model-specific coverage.

Використовуйте ці варіанти залежно від етапу release:

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

Не використовуйте повну umbrella як перший повторний запуск після сфокусованого виправлення. Якщо один box
завершується помилкою, використовуйте failed child workflow, job, Docker lane, package profile, model
provider або QA lane для наступного proof. Запускайте повну umbrella знову лише тоді,
коли виправлення змінило shared release orchestration або зробило попередні all-box evidence
застарілими. Фінальний verifier umbrella повторно перевіряє записані ids запусків child workflow,
тому після успішного повторного запуску child workflow повторно запустіть лише failed
`Verify full validation` parent job.

Для обмеженого відновлення передайте `rerun_group` до umbrella. `all` — це справжній
release-candidate run, `ci` запускає лише normal CI child, `plugin-prerelease`
запускає лише release-only Plugin child, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all runs
з `release_profile=full` використовують package artifact із release-checks.

### Vitest

Vitest box — це manual `CI` child workflow. Manual CI навмисно
обходить changed scoping і примусово запускає normal test graph для release
candidate: Linux Node shards, bundled-Plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: "чи пройшло source tree повний normal test suite?"
Це не те саме, що release-path product validation. Evidence, яку потрібно зберегти:

- зведення `Full Release Validation`, що показує dispatched `CI` run URL
- зелений `CI` run на точному target SHA
- назви failed або slow shards із CI jobs під час дослідження regressions
- Vitest timing artifacts, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує performance analysis

Запускайте manual CI напряму лише тоді, коли release потребує deterministic normal CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також release-mode
workflow `install-smoke`. Він перевіряє release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- full install smoke з увімкненим slow Bun global install smoke
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
- розділені bundled Plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані rerun commands включають попередні
`package_artifact_run_id` і prepared Docker image inputs, коли доступні, тож
failed lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity lane, що порівнює candidate lane OpenAI з baseline Opus 4.6
  за допомогою agentic parity pack
- fast live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує explicit local proof

Використовуйте цей box, щоб відповісти: "чи поводиться release правильно у QA scenarios і
live channel flows?" Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час схвалення release. Full Matrix coverage лишається доступним як
manual sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Його підтримують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
package inventory, записує package version і SHA-256 та утримує
workflow harness ref окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: pack довірену `package_ref` branch, tag або full commit SHA
  з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance утримує migration, update, stale
Plugin dependency cleanup, offline Plugin fixtures, Plugin update і Telegram
package QA проти того самого resolved tarball. Blocking release checks використовують
default latest published package baseline; `run_release_soak=true` або
`release_profile=full` розширює до кожного stable npm-published baseline від
`2026.4.23` до `latest` плюс reported-issue fixtures. Використовуйте
Package Acceptance із `source=npm` для вже shipped candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
publish. Це GitHub-native
заміна для більшої частини package/update coverage, яка раніше потребувала
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
віддавати перевагу Package Acceptance.

Канонічний checklist для update і Plugin validation —
[Тестування updates і Plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
Plugin install/update, doctor cleanup або published-package migration change.
Вичерпна published update migration з кожного stable package `2026.4.23+` —
це окремий manual workflow `Update Migration`, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Packages до
`2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих
у npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy Plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований package `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші packages
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

- `smoke`: швидкі лани встановлення пакета/каналу/агента, мережі Gateway і
  перезавантаження конфігурації
- `package`: контракти встановлення/оновлення/пакета Plugin без живого ClawHub; це типовий
  варіант для release-check
- `product`: `package` плюс MCP-канали, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: фрагменти Docker release-path з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для Telegram-підтвердження кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у Telegram-лан; окремий
Telegram workflow і далі приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` — звичайна мутувальна точка входу для публікації. Вона
оркеструє workflows trusted-publisher у порядку, потрібному для релізу:

1. Взяти release tag і визначити його commit SHA.
2. Перевірити, що tag досяжний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` з тим самим scope і SHA.
6. Dispatch `OpenClaw NPM Release` з release tag, npm dist-tag і
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

Стабільне просування безпосередньо до `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте нижчорівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release`
лише для сфокусованого ремонту або повторної публікації. Для ремонту вибраного Plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish` або запустіть дочірній workflow напряму, коли
пакет OpenClaw не можна публікувати.

## Вхідні дані NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний workflow-branch commit SHA для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/build/package, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm tag для шляху публікації; типово `beta`

`OpenClaw Release Publish` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий release tag; має вже існувати
- `preflight_run_id`: id успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm tag для пакета OpenClaw
- `plugin_publish_scope`: типово `all-publishable`; використовуйте `selected` лише
  для сфокусованого ремонтного завдання
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типово `true`; установлюйте `false` лише під час використання
  workflow як оркестратора ремонту лише для plugins

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: branch, tag або повний commit SHA для валідації. Перевірки із секретами
  вимагають, щоб розв’язаний commit був досяжний з branch OpenClaw або
  release tag.
- `run_release_soak`: увімкнути вичерпні live/E2E, Docker release-path і
  all-since upgrade-survivor soak на стабільних/типових release checks. Примусово
  вмикається через `release_profile=full`.

Правила:

- Стабільні та корекційні tags можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease tags можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` введення повного commit SHA дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  лише валідаційні
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи tag можна використати поточний повний workflow-branch commit
     SHA для валідаційного пробного запуску preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли навмисно потрібна пряма стабільна публікація
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує зовнішні plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив на `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо до `latest`, а `beta`
   має негайно вказувати на той самий стабільний build, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   self-healing синхронізації пізніше перемістити `beta`

Мутація dist-tag розміщена в приватному repo з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний repo зберігає публікацію лише через OIDC.

Це робить і шлях прямої публікації, і шлях просування beta-first
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині виділеної tmux session. Не викликайте `op`
напряму з головного agent shell; утримання цього всередині tmux робить prompts,
alerts і обробку OTP спостережуваними та запобігає повторним alerts хоста.

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

Maintainers використовують приватну release-документацію в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
