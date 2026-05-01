---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймального тестування пакета
    - Пошук схеми іменування версій і періодичності випусків
summary: Канали випуску, контрольний список оператора, блоки перевірки, найменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-01T03:00:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
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
- Версія попереднього бета-випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте провідні нулі до місяця або дня
- `latest` означає поточний просунутий стабільний випуск npm
- `beta` означає поточну ціль установлення beta
- Стабільні та стабільні коригувальні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно вибрати `latest` як ціль або пізніше просунути перевірену збірку beta
- Кожен стабільний випуск OpenClaw постачає npm-пакет і застосунок macOS разом;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку mac залишають для стабільного випуску, якщо це не запитано явно

## Ритм випусків

- Випуски рухаються спочатку через beta
- Стабільний випуск іде лише після перевірки найновішої beta
- Мейнтейніри зазвичай готують випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було надіслано або опубліковано і він потребує виправлення, мейнтейніри створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура випуску, затвердження, облікові дані та нотатки щодо відновлення
  призначені лише для мейнтейнерів

## Контрольний список оператора випуску

Цей контрольний список є публічною формою потоку випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкату залишаються в
інструкції з випуску лише для мейнтейнерів.

1. Почніть із поточного `main`: завантажте найновіші зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити з нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте їх, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тега, а потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   для попередньої перевірки лише з метою валідації дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових блоків випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте в гілці випуску та повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдер або allowlist моделей, який
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   приймальну перевірку пакета після публікації проти опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте і не переписуйте стару beta.
10. Для стабільного випуску продовжуйте лише після того, як перевірена beta або кандидат на випуск має
    потрібні докази перевірки. Публікація стабільного npm повторно використовує успішний
    артефакт попередньої перевірки через `preflight_run_id`; готовність стабільного випуску macOS
    також потребує упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть перевіряльник npm після публікації, необов’язковий автономний
    published-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і збірка Control UI існували для етапу
  валідації пакування
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. Надавайте `npm_telegram_package_spec` лише після того, як пакет було
  опубліковано і має також виконатися post-publish Telegram E2E. Надавайте
  `evidence_package_spec`, коли приватний звіт із доказами має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне побічне підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`
  для пакування довіреної гілки/тега/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/каналу/агента, Gateway network і перезавантаження конфігурації
  - `package`: package/update/plugin lanes, нативні для артефакта, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для кандидата релізу. Ручні запуски CI обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Релізні перевірки тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний npm release path коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у
  власній lane, щоб вони не затримували й не блокували publish
- Релізні перевірки із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт доступний з гілки OpenClaw або release tag
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-branch без вимоги pushed tag
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у реальний publish
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальний publish усе ще потребує справжнього release tag
- Обидва workflows тримають реальний шлях publish і promotion на GitHub-hosted
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
  (або відповідну beta/correction version), щоб перевірити published registry
  install path у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити installed-package onboarding, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased Telegram credential
  pool. Локальні одноразові запуски maintainer можуть опустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається після кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути запущений з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases за замовчуванням спрямовуються на `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` є validation-only; коли тег існує лише в
    release branch, але workflow запускається з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість повторного
    їх rebuilding
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight завершується помилкою за замовчуванням, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не поставили порожню browser dashboard
- Post-publish verification також перевіряє, що published registry install
  містить непорожні bundled Plugin runtime deps у root layout `dist/*`.
  Реліз, який поставляється з відсутніми або порожніми payloads залежностей bundled Plugin,
  провалює postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет npm pack `unpackedSize` до
  candidate update tarball, тож installer e2e ловить випадкове pack bloat
  до release publish path
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, згенеруйте заново й перегляньте planner-owned
  `plugin-prerelease-extension-shard` matrix outputs з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має зрештою містити packaged `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - packaged app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї release version

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте release
branch, tag або full commit SHA як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow визначає target ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
опціонально запускає standalone post-publish Telegram E2E, коли
`npm_telegram_package_spec` задано. Потім `OpenClaw Release Checks` розгалужується на
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні, а будь-який опціональний
дочірній `npm_telegram` або успішний, або навмисно пропущений. Підсумок final
verifier містить таблиці найповільніших jobs для кожного child run, щоб release
manager міг бачити поточний critical path без завантаження logs.
Див. [Повну релізну валідацію](/uk/reference/full-release-validation) для
повної stage matrix, точних назв workflow jobs, відмінностей профілів stable і full,
артефактів і handles для сфокусованих повторних запусків.
Child workflows запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте довірений harness, вибираючи workflow run ref.

Використовуйте `release_profile`, щоб вибрати широту live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс широке advisory provider/media coverage

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз визначити цільове
посилання як `release-package-under-test`, і повторно використовує цей артефакт як у
Docker-перевірках release-path, так і в Package Acceptance. Це тримає всі
package-facing бокси на тих самих байтах і уникає повторних збірок пакета.
Крос-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано змінну репозиторію/організації, інакше `openai/gpt-5.4-mini`, тому що ця lane
перевіряє встановлення пакета, онбординг, запуск Gateway і один live agent turn,
а не бенчмаркує найповільнішу модель за замовчуванням. Ширша live provider
матриця залишається місцем для model-specific покриття.

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

Не використовуйте повну umbrella-перевірку як перший повторний запуск після сфокусованого виправлення. Якщо один бокс
падає, використовуйте для наступного підтвердження невдалий дочірній workflow, job, Docker lane, package profile, model
provider або QA lane. Запускайте повну umbrella-перевірку знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні all-box докази
застарілими. Фінальний верифікатор umbrella повторно перевіряє записані ідентифікатори запусків дочірніх workflow,
тому після успішного повторного запуску дочірнього workflow повторно запустіть лише невдалий
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до umbrella. `all` є справжнім
запуском release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only дочірній plugin, `release-checks` запускає кожен release
бокс, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`, коли
надано окрему package Telegram lane.

### Vitest

Бокс Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
обходить changed scoping і примусово запускає звичайний тестовий граф для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей бокс, щоб відповісти на запитання: «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що release-path валідація продукту. Докази, які слід зберегти:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shard з CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker, QA Lab, live, cross-OS або package бокси:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Бокс Docker знаходиться в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у release-mode
workflow `install-smoke`. Він валідує release candidate через запаковані
Docker-середовища, а не лише через source-level тести.

Покриття Release Docker включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що виконуються як окремі install-smoke
  shards
- repository E2E lanes
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
- розділені bundled-channel dependency lanes між channel-smoke, update-target
  і setup/runtime contract chunks замість одного великого bundled-channel job
- розділені lanes встановлення/видалення bundled plugin
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker-артефакти перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану scheduler і командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` на reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені вхідні Docker image, коли доступні, тож
невдала lane може повторно використати той самий tarball і GHCR images.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Покриття Release QA Lab включає:

- mock parity gate, що порівнює candidate lane OpenAI з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального підтвердження

Використовуйте цей бокс, щоб відповісти на запитання: «чи реліз поводиться коректно в QA scenarios і
live channel flows?» Зберігайте URL артефактів для parity, Matrix і Telegram
lanes під час затвердження релізу. Повне покриття Matrix залишається доступним як
ручний sharded QA-Lab run, а не як типова release-critical lane.

### Пакет

Бокс Package — це installable-product gate. Його забезпечують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує версію пакета й SHA-256 і тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна release
  версія OpenClaw
- `source=ref`: запакувати довірену гілку `package_ref`, tag або повний commit SHA
  з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Release-path Docker chunks покривають
перекривні install, update і plugin-update lanes; Package Acceptance зберігає
artifact-native bundled-channel compat, offline plugin fixtures і Telegram
package QA проти того самого визначеного tarball. Це GitHub-native
заміна для більшості package/update покриття, яке раніше вимагало
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
віддавати перевагу Package Acceptance.

Legacy package-acceptance leniency навмисно обмежено в часі. Пакети до
`2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих
до npm: приватні QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші пакети
мають відповідати modern package contracts; ті самі gaps провалюють release
validation.

Використовуйте ширші профілі Package Acceptance, коли release question стосується
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
- `package`: install/update/plugin package contracts без live ClawHub; це типовий release-check
  default
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
визначений tarball `package-under-test` у Telegram lane; окремий
Telegram workflow усе ще приймає опублікований npm spec для post-publish checks.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний workflow-branch commit SHA для validation-only preflight
- `preflight_only`: `true` для validation/build/package only, `false` для
  справжнього publish path
- `preflight_run_id`: обов’язковий у справжньому publish path, щоб workflow повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для publish path; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, tag або повний commit SHA для валідації. Перевірки з секретами
  вимагають, щоб визначений commit був досяжним з гілки OpenClaw або
  release tag.

Правила:

- Stable і correction tags можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease tags можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` повний commit SHA input дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  validation-only
- Справжній publish path має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням publish

## Послідовність stable npm release

Під час підготовки stable npm release:

1. Запустіть `OpenClaw NPM Release` із `preflight_only=true`
   - До появи тегу можна використати поточний повний SHA коміту гілки workflow
     для dry run лише з валідацією workflow передпольотної перевірки
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   тоді, коли ви навмисно хочете пряме стабільне публікування
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   SHA коміту, коли потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив на `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо в `latest`, а `beta`
   має негайно вказувати на той самий стабільний білд, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag міститься у приватному репозиторії з міркувань безпеки, оскільки вона досі
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікування лише через OIDC.

Це робить і шлях прямого публікування, і шлях beta-first просування
задокументованими та видимими для оператора.

Якщо мейнтейнеру потрібно повернутися до локальної автентифікації npm, виконуйте будь-які команди 1Password
CLI (`op`) лише всередині окремої сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить підказки,
сповіщення та обробку OTP видимими й запобігає повторним сповіщенням хоста.

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

Мейнтейнери використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
