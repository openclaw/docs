---
read_when:
    - Пошук визначень публічних каналів релізів
    - Запуск валідації релізу або приймання пакета
    - Шукаєте правила найменування версій і ритм випусків
summary: Канали релізу, контрольний список оператора, середовища перевірки, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-01T23:10:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89274e9cbd5546b718517053e37574ceae53d4031d6ec02a033d250908e93bfd
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- стабільний: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- бета: передрелізні теги, які публікуються в npm `beta`
- розробницький: рухома вершина `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного корекційного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця або дня
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль бета-встановлення
- Стабільні та стабільні корекційні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або просунути перевірену бета-збірку пізніше
- Кожен стабільний випуск OpenClaw постачає npm-пакет і застосунок macOS разом;
  бета-випуски зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підпис/нотаризація застосунку Mac зарезервовані для стабільних випусків, якщо це явно не запитано

## Частота випусків

- Випуски рухаються спершу через бета-канал
- Стабільний випуск іде лише після перевірки останньої бети
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже було надіслано або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого бета-тега
- Детальна процедура випуску, затвердження, облікові дані та примітки з відновлення
  доступні лише супровідникам

## Контрольний список оператора випуску

Цей контрольний список показує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
інструкції випуску лише для супровідників.

1. Почніть із поточного `main`: завантажте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте це, надішліть і ще раз виконайте rebase/pull
   перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Підніміть версію в усіх потрібних місцях для запланованого тега, а потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   для попередньої перевірки лише з метою валідації дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести за допомогою `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте в гілці випуску та повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або список дозволених моделей, який
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бети позначте тегом `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім запустіть
   post-publish приймання пакета проти опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована бета потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару бету.
10. Для стабільного випуску продовжуйте лише після того, як перевірена бета або реліз-кандидат матиме
    потрібні докази перевірки. Стабільна публікація npm повторно використовує успішний
    артефакт попередньої перевірки через `preflight_run_id`; готовність стабільного випуску macOS
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий автономний
    опублікований-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, примітки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів імпортів
  і архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку перевірки
  пакування
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E для артефакта `release-package-under-test` з release
  checks. Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E також має перевірити опублікований npm-пакет. Надайте
  `evidence_package_spec`, коли приватний evidence report має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен side-channel доказ
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним harness
  `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим SHA-256; або
  `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow резолвить кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler для цього
  tarball і може запускати Telegram QA для того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes включають `published-upgrade-survivor`, артефакт пакета є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes для install/channel/agent, gateway network і config reload
  - `package`: lanes для artifact-native package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/субагентів,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для релізного кандидата. Ручні запуски CI обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke`, коли перевіряєте релізну телеметрію. Це проганяє
  QA-lab через локальний OTLP/HTTP-приймач і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Релізні перевірки тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує оренди облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібна повна інвентаризація Matrix
  transport, media та E2EE паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у власній
  lane, щоб не затримувати й не блокувати публікацію
- Релізні перевірки із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  резолвлений коміт доступний з гілки OpenClaw або релізного тегу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тегу
- Цей шлях SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно вимагає справжнього релізного тегу
- Обидва workflows тримають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як немутаційний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane release checks
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з опублікованого registry
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові запуски maintainers можуть опускати змінні Convex і передавати три
  env-облікові дані `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути запущений з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи за замовчуванням спрямовуються на `beta`
  - стабільний npm publish може явно націлюватися на `latest` через workflow input
  - мутація npm dist-tag на основі токена тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` призначений лише для валідації; коли тег існує лише в
    release branch, але workflow запускається з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - реальний приватний mac publish має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість того, щоб
    перебудовувати їх знову
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення з тимчасовим prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- npm release preflight fails closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковані plugin entrypoints і
  метадані пакета присутні у встановленому registry layout. Реліз, який
  постачає відсутні plugin runtime payloads, провалює postpublish verifier і
  не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет npm pack `unpackedSize` до
  candidate update tarball, тож installer e2e ловить випадкове роздування pack
  до шляху release publish
- Якщо релізна робота торкалася планування CI, manifests таймінгів extension або
  матриць тестів extension, регенеруйте й перегляньте outputs матриці
  `plugin-prerelease-extension-shard`, якими володіє planner, з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає surfaces оновлювача:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї релізної версії

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Запустіть його з довіреного workflow ref `main` і передайте release
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

Workflow резолвить target ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
standalone package Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли встановлено `npm_telegram_package_spec`. `OpenClaw Release
Checks` далі розгортається на install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, Package Acceptance з Telegram package QA, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
summary `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропущено,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальний
verifier summary містить таблиці найповільніших jobs для кожного дочірнього run, щоб release
manager міг бачити поточний критичний шлях без завантаження logs.
Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
повної stage matrix, точних назв workflow jobs, відмінностей stable versus full profile,
artifacts і handles для focused rerun.
Дочірні workflows запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу release branch або tag. Окремого input workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref workflow run.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс broad advisory provider/media coverage

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз визначити цільове посилання як `release-package-under-test`, і повторно використовує цей artifact як у Docker-перевірках release-path, так і в Package Acceptance. Це утримує всі package-facing boxes на тих самих байтах і уникає повторних збірок package.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли встановлено змінну repo/org, інакше `openai/gpt-5.5`, оскільки ця lane перевіряє package install, onboarding, Gateway startup і один live agent turn, а не benchmark найповільнішої моделі за замовчуванням. Ширша матриця live provider лишається місцем для model-specific coverage.

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

Не використовуйте повний umbrella як перший повторний запуск після сфокусованого виправлення. Якщо один box завершується з помилкою, використовуйте failed child workflow, job, Docker lane, package profile, model provider або QA lane для наступного доказу. Запускайте повний umbrella знову лише тоді, коли виправлення змінило shared release orchestration або зробило попередні all-box evidence застарілими. Фінальний verifier umbrella повторно перевіряє записані child workflow run ids, тож після успішного повторного запуску child workflow перезапустіть лише failed parent job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до umbrella. `all` — це справжній release-candidate run, `ci` запускає лише normal CI child, `plugin-prerelease` запускає лише release-only plugin child, `release-checks` запускає кожен release box, а вужчі release groups — це `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`. Сфокусовані повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all runs із `release_profile=full` використовують package artifact із release-checks.

### Vitest

Vitest box — це manual `CI` child workflow. Manual CI навмисно обходить changed scoping і примусово запускає normal test graph для release candidate: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: «чи пройшло source tree повний normal test suite?» Це не те саме, що release-path product validation. Evidence, які слід зберігати:

- summary `Full Release Validation`, що показує dispatched `CI` run URL
- зелений `CI` run на точному target SHA
- назви failed або slow shards із CI jobs під час розслідування regressions
- Vitest timing artifacts, як-от `.artifacts/vitest-shard-timings.json`, коли run потребує performance analysis

Запускайте manual CI напряму лише тоді, коли релізу потрібен deterministic normal CI, але не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box знаходиться в `OpenClaw Release Checks` через `openclaw-live-and-e2e-checks-reusable.yml`, а також release-mode workflow `install-smoke`. Він перевіряє release candidate через packaged Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- full install smoke з увімкненим slow Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, де QR, root/Gateway і installer/Bun smoke jobs запускаються як окремі install-smoke shards
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

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує `.artifacts/docker-tests/` із lane logs, `summary.json`, `failures.json`, phase timings, scheduler plan JSON і rerun commands. Для сфокусованого відновлення використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість повторного запуску всіх release chunks. Згенеровані rerun commands містять попередній `package_artifact_run_id` і prepared Docker image inputs, коли доступні, тому failed lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic behavior і channel-level release gate, окремий від Vitest і Docker package mechanics.

Release QA Lab coverage включає:

- mock parity gate, що порівнює candidate lane OpenAI з baseline Opus 4.6 за допомогою agentic parity pack
- fast live Matrix QA profile з використанням environment `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує explicit local proof

Використовуйте цей box, щоб відповісти: «чи реліз поводиться правильно в QA scenarios і live channel flows?» Зберігайте artifact URLs для parity, Matrix і Telegram lanes під час схвалення релізу. Full Matrix coverage лишається доступним як manual sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Він підтримується `Package Acceptance` і resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє package inventory, записує package version і SHA-256, а також тримає workflow harness ref окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release version
- `source=ref`: пакує довірені `package_ref` branch, tag або full commit SHA з вибраним harness `workflow_ref`
- `source=url`: завантажує HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance із `source=artifact`, підготовленим release package artifact, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram package QA проти того самого resolved tarball. Це GitHub-native replacement для більшої частини package/update coverage, яка раніше потребувала Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding, installer і platform behavior, але package/update product validation має надавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation — це
[Тестування оновлень і плагінів](/uk/help/testing-updates-plugins). Використовуйте його, коли вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить зміну plugin install/update, doctor cleanup або published-package migration.

Legacy package-acceptance leniency навмисно обмежено в часі. Packages до `2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих у npm: private QA inventory entries, яких бракує в tarball; відсутній `gateway install --wrapper`; відсутні patch files у tarball-derived git fixture; відсутній persisted `update.channel`; legacy plugin install-record locations; відсутня marketplace install-record persistence; і config metadata migration під час `plugins update`. Published package `2026.4.26` може попереджати про local build metadata stamp files, які вже були shipped. Пізніші packages мають відповідати modern package contracts; ті самі gaps провалюють release validation.

Використовуйте ширші Package Acceptance profiles, коли release question стосується фактичного installable package:

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

- `smoke`: швидкі package install/channel/agent, Gateway network і config reload lanes
- `package`: install/update/plugin package contracts без live ClawHub; це release-check
  default
- `product`: `package` плюс MCP channels, Cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих reruns

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або `telegram_mode=live-frontier` у Package Acceptance. Workflow передає resolved tarball `package-under-test` у Telegram lane; standalone Telegram workflow і далі приймає published npm spec для post-publish checks.

## Вхідні дані NPM workflow

`OpenClaw NPM Release` приймає такі operator-controlled inputs:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  full 40-character workflow-branch commit SHA для validation-only preflight
- `preflight_only`: `true` для лише validation/build/package, `false` для
  real publish path
- `preflight_run_id`: обов’язковий у real publish path, щоб workflow повторно використовував
  prepared tarball з успішного preflight run
- `npm_dist_tag`: npm target tag для publish path; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі operator-controlled inputs:

- `ref`: branch, tag або full commit SHA для перевірки. Secret-bearing checks
  вимагають, щоб resolved commit був доступний з OpenClaw branch або
  release tag.

Правила:

- Stable і correction tags можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` full commit SHA input дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  validation-only
- Real publish path має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням publish

## Послідовність стабільного npm-релізу

Під час створення stable npm release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До створення тегу можна використати поточний повний SHA коміту гілки workflow
     для сухого запуску лише валідації workflow передперевірки
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спочатку beta або `latest` лише
   тоді, коли ви навмисно хочете виконати безпосередню стабільну публікацію
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   SHA коміту, коли потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на посиланні релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив на `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо до `latest`, а `beta`
   має негайно слідувати за тією самою стабільною збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлюваній синхронізації перемістити `beta` пізніше

Зміна dist-tag розміщена в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це робить і шлях прямої публікації, і шлях просування спочатку beta
задокументованими та видимими для оператора.

Якщо maintainer має повернутися до локальної npm-автентифікації, виконуйте будь-які команди
1Password CLI (`op`) лише всередині окремої сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить підказки,
сповіщення й обробку OTP видимими та запобігає повторним сповіщенням хоста.

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

## Пов'язане

- [Канали релізів](/uk/install/development-channels)
