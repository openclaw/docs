---
read_when:
    - Пошук визначень публічних каналів релізів
    - Запуск валідації релізу або приймального тестування пакета
    - Шукаєте інформацію про іменування версій і періодичність випусків
summary: Релізні канали, контрольний список оператора, середовища валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-02T04:48:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce380a8277e7c8764359e4ded86d1042dcb250691ac62fbee28651f20aa0580
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали релізів:

- стабільний: релізи з тегами, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- бета: передрелізні теги, які публікуються в npm `beta`
- розробницький: рухома вершина `main`

## Назви версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початковий нуль до місяця або дня
- `latest` означає поточний просунутий стабільний npm-реліз
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та стабільні коригувальні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлитися на `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  бета-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збірку/підпис/нотаризацію застосунку Mac резервують для стабільного релізу, якщо це не запитано явно

## Частота релізів

- Релізи рухаються спершу через бета-канал
- Стабільний реліз виходить лише після перевірки останньої бета-версії
- Мейнтейнери зазвичай готують релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб валідація релізу та виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже надіслано або опубліковано і він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення чи повторного створення старого бета-тега
- Детальна процедура релізу, затвердження, облікові дані та нотатки з відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора релізу

Цей контрольний список описує публічну форму релізного процесу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
релізному runbook лише для мейнтейнерів.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувачів, закомітьте його, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Збільште версію в кожному потрібному місці для запланованого тега, а потім запустіть
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   для валідаційного preflight дозволено повний 40-символьний SHA релізної гілки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   релізної гілки, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих релізних тестових боксів: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте в релізній гілці й повторно запустіть найменший невдалий
   файл, канал, job workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   post-publish package acceptance проти опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована бета-версія потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару бета-версію.
10. Для стабільного релізу продовжуйте лише після того, як перевірена бета-версія або release candidate матиме
    потрібні докази валідації. Публікація стабільного npm-релізу повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність стабільного релізу macOS
    також вимагає упаковані `.zip`, `.dmg`, `.dSYM.zip` і оновлений
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, за потреби опційний автономний
    published-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag, коли потрібно, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Release preflight

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку валідації
  пакування
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для інсталяційного smoke-тесту, приймання пакета, Docker
  наборів release-path, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  lane. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` із release checks.
  Надайте `npm_telegram_package_spec` після публікації, коли той самий Telegram E2E
  має також підтвердити опублікований npm-пакет. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету, без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне побічне підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`, щоб
  запакувати довірену гілку/тег/SHA `package_ref` з поточним harness
  `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим SHA-256; або
  `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes містять `published-upgrade-survivor`, артефакт пакета є кандидатом, а
  `published_upgrade_survivor_baseline` вибирає опубліковану базову версію.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Типові профілі:
  - `smoke`: lane для install/channel/agent, gateway network і config reload
  - `package`: lane для package/update/Plugin, нативні до артефакту, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: частини Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для release candidate. Ручні CI dispatch оминають changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і валідує експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним релізом з тегом
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  leases облікових даних. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media і E2EE паралельно.
- Cross-OS інсталяційна та upgrade runtime валідація є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний npm release path коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у своїй
  окремій lane, щоб не затримувати й не блокувати публікацію
- Release checks із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт доступний з гілки OpenClaw або релізного тегу
- validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги до запушеного тегу
- Цей шлях SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все ще потребує справжнього релізного тегу
- Обидва workflow залишають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити шлях інсталяції з опублікованого registry
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  для перевірки onboarding встановленого пакета, налаштування Telegram і реального Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased pool облікових даних Telegram.
  Локальні одноразові maintainer-запуски можуть пропустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається після кожного merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - реальна npm publish має пройти успішний npm `preflight_run_id`
  - реальна npm publish має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm releases за замовчуванням мають `beta`
  - стабільний npm publish може явно націлюватися на `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає OIDC-only publish
  - публічний `macOS Release` є validation-only; коли тег існує лише на
    release branch, але workflow запущено з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість повторної
    перебудови
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight завершується fail closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожній browser dashboard
- Post-publish verification також перевіряє, що опубліковані Plugin entrypoints і
  метадані пакета присутні в установленому registry layout. Реліз, який
  постачає відсутні runtime payloads Plugin, провалює postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  candidate update tarball, тож installer e2e ловить випадкове pack bloat
  до release publish path
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, згенеруйте повторно й перегляньте planner-owned
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність стабільного macOS release також включає updater surfaces:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї версії релізу

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Для підтвердження pinned commit на швидко змінюваній гілці використовуйте
helper, щоб кожен child workflow запускався з тимчасової гілки, зафіксованої на цільовому
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен child workflow `headSha`
відповідає цільовому, а потім видаляє тимчасову гілку. Це запобігає випадковому підтвердженню
новішого child run `main`.

Для валідації release branch або tag запустіть його з довіреного workflow
ref `main` і передайте release branch або tag як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Робочий процес визначає цільове посилання, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
окремий пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгортає перевірку встановлення, кросплатформні перевірки релізу,
live/E2E покриття релізного шляху Docker, Package Acceptance з QA пакета
Telegram, паритет QA Lab, live Matrix і live Telegram. Повний запуск прийнятний
лише тоді, коли зведення `Full Release Validation` показує `normal_ci` і
`release_checks` як успішні. У режимі full/all дочірній `npm_telegram` також має
бути успішним; поза full/all його пропускають, якщо не було надано опублікований
`npm_telegram_package_spec`. Фінальне зведення верифікатора містить таблиці
найповільніших завдань для кожного дочірнього запуску, щоб менеджер релізу міг
бачити поточний критичний шлях без завантаження логів.
Див. [Повну валідацію релізу](/uk/reference/full-release-validation), щоб отримати
повну матрицю етапів, точні назви завдань workflow, відмінності між stable і
full профілями, артефакти та цільові засоби повторного запуску.
Дочірні workflow запускаються з довіреного посилання, яке запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільове `ref` вказує на старішу
релізну гілку або тег. Окремого input для workflow-ref у Full Release Validation
немає; вибирайте довірену обв'язку, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомій
`main`; сирі SHA комітів не можуть бути refs для запуску workflow, тому
використовуйте `pnpm ci:full-release --sha <sha>`, щоб створити закріплену
тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший релізно-критичний OpenAI/core live і шлях Docker
- `stable`: minimum плюс stable покриття provider/backend для схвалення релізу
- `full`: stable плюс широке advisory покриття provider/media

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз
визначити цільовий ref як `release-package-under-test`, і повторно використовує
цей артефакт як у Docker-перевірках релізного шляху, так і в Package Acceptance.
Це тримає всі пакетно-орієнтовані бокси на тих самих байтах і уникає повторних
збірок пакета. Кросплатформна OpenAI перевірка встановлення використовує
`OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли задано змінну repo/org, інакше
`openai/gpt-5.5`, оскільки ця лінія доводить встановлення пакета, onboarding,
запуск Gateway і один live хід агента, а не бенчмарк найповільнішої стандартної
моделі. Ширша live матриця provider залишається місцем для model-specific
покриття.

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

Не використовуйте повну парасолькову перевірку як перший повторний запуск після
цільового виправлення. Якщо один бокс падає, для наступного доказу використайте
невдалий дочірній workflow, завдання, Docker-лінію, профіль пакета, model
provider або QA-лінію. Запускайте повну парасолькову перевірку знову лише тоді,
коли виправлення змінило спільну оркестрацію релізу або зробило попередні
докази all-box застарілими. Фінальний верифікатор парасольки повторно перевіряє
записані id запусків дочірніх workflow, тому після успішного повторного запуску
дочірнього workflow повторно запускайте лише невдале батьківське завдання
`Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` є
справжнім запуском release-candidate, `ci` запускає лише звичайний дочірній CI,
`plugin-prerelease` запускає лише релізний дочірній Plugin, `release-checks`
запускає кожен релізний бокс, а вужчі релізні групи: `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Цільові повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`;
full/all запуски з `release_profile=full` використовують артефакт пакета
release-checks.

### Vitest

Бокс Vitest є ручним дочірнім workflow `CI`. Ручний CI навмисно обходить
changed scoping і примусово запускає звичайний граф тестів для кандидата
релізу: Linux Node shards, shards bundled-plugin, контракти каналів,
сумісність Node 22, `check`, `check-additional`, build smoke, перевірки docs,
Python skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей бокс, щоб відповісти: «чи пройшло дерево вихідного коду
повний звичайний набір тестів?» Це не те саме, що продуктова валідація
релізного шляху. Докази, які слід зберігати:

- зведення `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shards із завдань CI під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований
звичайний CI, але не Docker, QA Lab, live, cross-OS або пакетні бокси:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Бокс Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у релізному workflow
`install-smoke`. Він валідує кандидата релізу через пакетовані середовища
Docker, а не лише тести рівня вихідного коду.

Релізне Docker-покриття містить:

- повну перевірку встановлення з увімкненою повільною Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA,
  із QR, root/gateway та installer/Bun smoke завданнями, що запускаються як
  окремі install-smoke shards
- repository E2E лінії
- Docker chunks релізного шляху: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли запитано
- розділені лінії встановлення/видалення bundled Plugin
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E набори provider і Docker live model покриття, коли release checks
  містять live suites

Використовуйте артефакти Docker перед повторним запуском. Планувальник
релізного шляху завантажує `.artifacts/docker-tests/` із логами ліній,
`summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника та
командами повторного запуску. Для цільового відновлення використовуйте
`docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість повторного
запуску всіх релізних chunks. Згенеровані команди повторного запуску містять
попередній `package_artifact_run_id` і prepared Docker image inputs, коли вони
доступні, щоб невдала лінія могла повторно використати той самий tarball і
GHCR images.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це релізний gate для
agentic поведінки та рівня каналів, окремий від Vitest і механіки пакетів
Docker.

Релізне покриття QA Lab містить:

- mock parity gate, що порівнює candidate lane OpenAI з baseline Opus 4.6 за
  допомогою agentic parity pack
- fast live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей бокс, щоб відповісти: «чи поводиться реліз правильно у QA
сценаріях і live channel flows?» Зберігайте URL артефактів для ліній parity,
Matrix і Telegram під час схвалення релізу. Повне покриття Matrix залишається
доступним як ручний sharded QA-Lab запуск, а не стандартна релізно-критична
лінія.

### Пакет

Бокс Package є gate installable-product. Він підтримується `Package Acceptance`
і resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver
нормалізує candidate у tarball `package-under-test`, який споживає Docker E2E,
валідує інвентар пакета, записує версію пакета та SHA-256 і тримає ref обв'язки
workflow окремо від ref джерела пакета.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: запакувати довірену гілку `package_ref`, тег або повний SHA
  коміту з вибраною обв'язкою `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов'язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском
  GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим артефактом релізного пакета, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update,
очищення застарілих залежностей Plugin, offline Plugin fixtures, plugin update і
QA пакета Telegram на тому самому визначеному tarball. Це GitHub-native заміна
для більшості package/update покриття, яке раніше потребувало Parallels.
Кросплатформні release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але продуктова валідація package/update має
віддавати перевагу Package Acceptance.

Канонічний checklist для валідації update і Plugin:
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте
його, коли вирішуєте, яка локальна, Docker, Package Acceptance або release-check
лінія доводить зміну встановлення/оновлення Plugin, doctor cleanup або
published-package migration. Вичерпна published update migration з кожного
stable пакета `2026.4.23+` є окремим ручним workflow `Update Migration`, а не
частиною Full Release CI.

Застаріла поблажливість package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` включно можуть використовувати шлях сумісності для metadata gaps,
уже опублікованих до npm: приватні записи QA inventory, відсутні в tarball,
відсутній `gateway install --wrapper`, відсутні patch files у tarball-derived
git fixture, відсутній збережений `update.channel`, застарілі розташування
plugin install-record, відсутня persistence marketplace install-record і config
metadata migration під час `plugins update`. Опублікований пакет `2026.4.26`
може попереджати про local build metadata stamp files, які вже були shipped.
Пізніші пакети мають задовольняти сучасні package contracts; ті самі gaps
провалюють release validation.

Використовуйте ширші профілі Package Acceptance, коли релізне питання стосується
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

- `smoke`: швидкі лінії package install/channel/agent, gateway network і config
  reload
- `package`: контракти install/update/plugin package без live ClawHub; це стандарт
  release-check
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker chunks релізного шляху з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для підтвердження Telegram кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
визначений tarball `package-under-test` у лінію Telegram; окремий
workflow Telegram досі приймає опубліковану специфікацію npm для перевірок після публікації.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, керовані оператором:

- `tag`: обов’язковий тег релізу, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий тег npm для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі вхідні параметри, керовані оператором:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки, що використовують секрети,
  вимагають, щоб визначений коміт був досяжний з гілки OpenClaw або
  тега релізу.

Правила:

- Стабільні й корекційні теги можуть публікуватися або в `beta`, або в `latest`
- Теги prerelease beta можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` введення повного SHA коміту дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди виконують
  лише валідацію
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тег ще не існує, можна використати поточний повний SHA коміту гілки workflow
     для пробного запуску preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спершу через beta або `latest` лише
   тоді, коли навмисно потрібна пряма стабільна публікація
3. Запустіть `Full Release Validation` на гілці релізу, тезі релізу або повному
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо в `latest` і `beta`
   має одразу вказувати на ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Зміна dist-tag розміщена в приватному репозиторії з міркувань безпеки, бо вона досі
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це робить і шлях прямої публікації, і шлях просування спершу через beta
задокументованими та видимими для оператора.

Якщо супровідник мусить повернутися до локальної автентифікації npm, запускайте будь-які команди 1Password
CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання цього всередині tmux робить запити,
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

Супровідники використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
