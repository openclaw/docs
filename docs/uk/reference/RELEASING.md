---
read_when:
    - Пошук визначень публічних каналів релізів
    - Запуск перевірки релізу або приймального тестування пакета
    - Шукаєте іменування версій і періодичність випусків
summary: Канали релізів, контрольний список оператора, середовища валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-04T06:33:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- стабільний: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- бета: теги попередніх випусків, які публікуються в npm `beta`
- розробка: рухома вершина `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія корекційного стабільного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початковий нуль до місяця або дня
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та корекційні стабільні випуски типово публікуються в npm `beta`; оператори випуску можуть явно націлити їх на `latest` або просунути перевірену бета-збірку пізніше
- Кожен стабільний випуск OpenClaw постачає npm-пакет і застосунок macOS разом;
  бета-випуски зазвичай спершу перевіряють і публікують шлях npm/package, а
  збирання/підпис/нотаризацію застосунку Mac залишають для стабільного випуску, якщо це явно не запитано

## Каденція випусків

- Випуски рухаються спершу через бета-версію
- Стабільний випуск іде лише після перевірки останньої бета-версії
- Мейнтейнери зазвичай відгалужують випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже надіслано або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення чи повторного створення старого бета-тега
- Детальна процедура випуску, погодження, облікові дані та нотатки з відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора випуску

Цей контрольний список є публічною формою потоку випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкоту залишаються в
ранбуку випуску лише для мейнтейнерів.

1. Почніть із поточного `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і переконайтеся, що поточний CI `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте його, надішліть і виконайте rebase/pull
   ще раз перед відгалуженням.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу з випуску
   безпосередньо в `main`.
5. Підніміть версію в кожному потрібному місці для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб публіковані пакети Plugin мали спільну версію випуску
   й метадані сумісності, а потім виконайте локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   для перевірки лише попередньої перевірки дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте це в гілці випуску й перезапустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або список дозволених моделей, який
   доводить виправлення. Перезапускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії створіть тег `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спершу публікує всі публіковані пакети Plugin в npm, потім публікує той самий
   набір у ClawHub як npm-pack tarballs ClawPack, а потім просуває
   підготовлений артефакт попередньої перевірки OpenClaw npm з відповідним dist-tag. Після
   публікації запустіть post-publish package
   acceptance проти опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований попередній випуск потребує виправлення,
   створіть наступний відповідний номер попереднього випуску; не видаляйте й не переписуйте старий
   попередній випуск.
10. Для стабільного випуску продовжуйте лише після того, як перевірена бета-версія або кандидат у випуск матиме
    потрібні докази перевірки. Стабільна публікація npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність стабільного випуску macOS також вимагає
    запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
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
  релізні артефакти `dist/*` і бандл Control UI існували для кроку валідації
  пакування
- Запустіть `pnpm plugins:sync` після підняття кореневої версії та перед тегуванням. Він
  оновлює версії публікованих пакетів Plugin, метадані сумісності OpenClaw peer/API,
  метадані збірки та заготовки журналів змін Plugin відповідно до версії основного
  релізу. `pnpm plugins:sync:check` — це немодифікуючий релізний запобіжник;
  workflow публікації завершується помилкою до будь-якої зміни реєстру, якщо цей крок
  було забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для smoke-перевірки встановлення, приймання пакета, Docker
  наборів для релізного шляху, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  ліній. З `release_profile=full` і `rerun_group=all` він також запускає пакетний
  Telegram E2E проти артефакту `release-package-under-test` із release checks. Передайте
  `npm_telegram_package_spec` після публікації, коли той самий Telegram E2E має також
  підтвердити опублікований npm-пакет. Передайте `package_acceptance_package_spec` після
  публікації, коли Package Acceptance має виконати свою матрицю пакета/оновлення проти
  відвантаженого npm-пакета замість артефакту, зібраного з SHA. Передайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що валідація
  відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен додатковий бічний доказ
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`, щоб
  запакувати довірену гілку/тег/SHA `package_ref` з поточним harness `workflow_ref`;
  `source=url` для HTTPS tarball з обов’язковим SHA-256; або `source=artifact` для
  tarball, завантаженого іншим запуском GitHub Actions. Workflow розв’язує кандидата в
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані Docker
  лінії містять `published-upgrade-survivor`, артефакт пакета є кандидатом, а
  `published_upgrade_survivor_baseline` вибирає опубліковану базову версію.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: лінії встановлення/каналу/агента, мережі Gateway і перезавантаження конфігурації
  - `package`: лінії пакета/оновлення/Plugin, нативні для артефакту, без OpenWebUI або live ClawHub
  - `product`: профіль пакета плюс MCP-канали, очищення cron/субагентів,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker релізного шляху з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для кандидата релізу. Ручні запуски CI обходять scoped-перевірки зміненого та примусово
  запускають Linux Node shards, bundled-plugin shards, контракти каналів, сумісність
  Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills,
  Windows, macOS, Android і лінії Control UI i18n.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace span,
  обмежені атрибути та редагування вмісту/ідентифікаторів без потреби в Opik, Langfuse
  або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Запустіть `OpenClaw Release Publish` для модифікуючої послідовності публікації після
  появи тегу. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікуєте тег,
  досяжний з main), передайте release tag і успішний OpenClaw npm `preflight_run_id`,
  і залишайте стандартну область публікації Plugin `all-publishable`, якщо ви навмисно
  не виконуєте сфокусоване виправлення. Workflow серіалізує публікацію Plugin у npm,
  публікацію Plugin у ClawHub і публікацію OpenClaw у npm, щоб основний пакет не був
  опублікований раніше за свої зовнішні Plugin.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає lane mock parity QA Lab плюс швидкий live
  профіль Matrix і Telegram QA lane перед схваленням релізу. Live lanes використовують
  середовище `qa-live-shared`; Telegram також використовує оренди облікових даних Convex
  CI. Запустіть ручний workflow `QA-Lab - All Lanes` з `matrix_profile=all` і
  `matrix_shards=true`, коли потрібен повний інвентар Matrix transport, media та E2EE
  паралельно.
- Крос-ОС валідація встановлення та оновлення runtime є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  повторно використовуваний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Це розділення навмисне: реальний шлях npm-релізу має бути коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки
  залишаються у власній lane, щоб не затримувати й не блокувати публікацію
- Release checks із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт досяжний з гілки OpenClaw або release tag
- validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги pushed tag
- Цей шлях SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки метаданих
  пакета; реальна публікація все одно потребує реального release tag
- Обидва workflow зберігають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як немодифікуючий шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane release checks
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити шлях встановлення з
  опублікованого registry у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased pool облікових даних Telegram.
  Локальні одноразові перевірки maintainer можуть пропустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke з машини maintainer, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Helper виконує Parallels npm update/fresh-target validation, запускає `NPM Telegram Beta E2E`, опитує точний workflow run, завантажує artifact і друкує Telegram report.
- Maintainers можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожен merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases за замовчуванням переходять у `beta`
  - stable npm publish може явно цілитися в `latest` через workflow input
  - мутація token-based npm dist-tag тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    для безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    public repo зберігає лише OIDC-only publish
  - public `macOS Release` призначений лише для валідації; коли tag існує лише в
    release branch, але workflow запускається з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені artifacts замість повторної
    перебудови
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення
  на базовому stable payload
- npm release preflight fails closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню browser dashboard
- Post-publish verification також перевіряє наявність published plugin entrypoints і
  package metadata у встановленому registry layout. Реліз, який відвантажує відсутні
  plugin runtime payloads, провалює postpublish verifier і не може бути promoted до `latest`.
- `pnpm test:install:smoke` також застосовує budget npm pack `unpackedSize` до
  candidate update tarball, тож installer e2e ловить випадкове pack bloat
  до release publish path
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, згенеруйте повторно й перегляньте planner-owned
  `plugin-prerelease-extension-shard` matrix outputs з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes
  не описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї release version

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Для доказу pinned commit на швидкозмінній гілці використовуйте
helper, щоб кожен дочірній workflow запускався з тимчасової гілки, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен дочірній workflow `headSha`
відповідає target, а потім видаляє тимчасову гілку. Це запобігає випадковому
підтвердженню новішого дочірнього запуску `main`.

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
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, пов’язаних із
пакетом, і запускає окремий package Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгалужується на install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, Package Acceptance з Telegram package QA, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all дочірній
`npm_telegram` також має бути успішним; поза full/all його пропускають, якщо
не було надано опублікований `npm_telegram_package_spec`. Фінальний підсумок
верифікатора містить таблиці найповільніших завдань для кожного дочірнього
запуску, щоб release manager міг бачити поточний критичний шлях без
завантаження логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation), щоб отримати
повну матрицю етапів, точні назви завдань workflow, відмінності між профілями
stable і full, артефакти та дескриптори для сфокусованих повторних запусків.
Дочірні workflows запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу release-гілку або тег. Окремого input для workflow-ref у Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для proof точного коміту на рухомому `main`;
raw commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити pinned тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для схвалення релізу
- `full`: stable плюс broad advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
визначити цільовий ref як `release-package-under-test`, і повторно використовує
цей артефакт як у release-path Docker checks, так і в Package Acceptance. Це
тримає всі package-facing boxes на тих самих байтах і уникає повторних збірок
пакета. Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org variable, інакше `openai/gpt-5.4`, бо ця lane
доводить встановлення пакета, onboarding, запуск gateway і один live agent turn,
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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну umbrella як перший повторний запуск після сфокусованого виправлення. Якщо один box
падає, використовуйте невдалий child workflow, job, Docker lane, package profile, model
provider або QA lane для наступного proof. Запускайте повну umbrella знову лише тоді, коли
виправлення змінило спільну release orchestration або зробило попередні all-box evidence
застарілими. Фінальний verifier umbrella повторно перевіряє записані child workflow run
ids, тому після успішного повторного запуску child workflow повторно запускайте тільки failed
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` в umbrella. `all` є справжнім
release-candidate run, `ci` запускає тільки normal CI child, `plugin-prerelease`
запускає тільки release-only plugin child, `release-checks` запускає кожен release
box, а вужчі release groups: `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all runs
з `release_profile=full` використовують package artifact із release-checks.

### Vitest

Vitest box — це manual `CI` child workflow. Manual CI навмисно
обходить changed scoping і примусово запускає normal test graph для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: "чи source tree пройшло full normal test suite?"
Це не те саме, що release-path product validation. Evidence, які слід зберігати:

- підсумок `Full Release Validation`, що показує URL запущеного `CI` run
- `CI` run зелений на точному target SHA
- назви failed або slow shards із CI jobs під час розслідування regressions
- Vitest timing artifacts, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує performance analysis

Запускайте manual CI напряму лише тоді, коли релізу потрібен deterministic normal CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він валідує release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- full install smoke з увімкненим slow Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що працюють як окремі install-smoke
  shards
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- OpenWebUI coverage усередині chunk `plugins-runtime-services`, коли це запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` through
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` на reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані rerun commands включають попередні
`package_artifact_run_id` і prepared Docker image inputs, коли вони доступні, тому
failed lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремо від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity lane, що порівнює OpenAI candidate lane з Opus 4.6
  baseline за допомогою agentic parity pack
- fast live Matrix QA profile з використанням environment `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного local proof

Використовуйте цей box, щоб відповісти: "чи реліз поводиться коректно в QA scenarios і
live channel flows?" Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час схвалення релізу. Full Matrix coverage залишається доступним як
manual sharded QA-Lab run, а не як default release-critical lane.

### Пакет

Package box — це installable-product gate. Він підкріплений
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує package version і SHA-256, а також тримає
workflow harness ref окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: запакувати довірену `package_ref` branch, tag або full commit SHA
  з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
prepared release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA проти того самого resolved tarball. Upgrade matrix охоплює кожен stable npm-published baseline від `2026.4.23` до `latest`; використовуйте
Package Acceptance з `source=npm` для вже shipped candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
публікацією. Це GitHub-native
заміна більшості package/update coverage, яка раніше потребувала
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
віддавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation:
[Testing updates and plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Exhaustive published update migration з кожного stable пакета `2026.4.23+` є
окремим manual workflow `Update Migration`, а не частиною Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Packages through
`2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих
в npm: private QA inventory entries missing from the tarball, missing
`gateway install --wrapper`, missing patch files in the tarball-derived git
fixture, missing persisted `update.channel`, legacy plugin install-record
locations, missing marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований package `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Later packages
мають відповідати modern package contracts; ті самі gaps провалюють release
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

- `smoke`: швидкі лінії встановлення пакета/каналу/агента, мережі Gateway і перезавантаження конфігурації
- `package`: контракти встановлення/оновлення/пакета Plugin без живого ClawHub; це типовий варіант для release-check
- `product`: `package` плюс MCP-канали, очищення cron/субагентів, вебпошук OpenAI і OpenWebUI
- `full`: фрагменти Docker release-path з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для підтвердження Telegram для пакета-кандидата увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у лінію Telegram; автономний
Telegram workflow і далі приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` — звичайна точка входу для змінювальної публікації. Вона
оркеструє workflow trusted-publisher у порядку, потрібному релізу:

1. Забрати тег релізу й визначити його commit SHA.
2. Перевірити, що тег досяжний з `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тією самою областю дії та SHA.
6. Запустити `OpenClaw NPM Release` з тегом релізу, npm dist-tag і
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

Використовуйте нижчорівневі workflow `Plugin NPM Release` і `Plugin ClawHub Release`
лише для цільового виправлення або повторної публікації. Для виправлення вибраного Plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish` або запустіть дочірній workflow напряму, коли
пакет OpenClaw не слід публікувати.

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакування, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий у справжньому шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типовий — `beta`

`OpenClaw Release Publish` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег релізу; має вже існувати
- `preflight_run_id`: id успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm-тег для пакета OpenClaw
- `plugin_publish_scope`: типовий — `all-publishable`; використовуйте `selected` лише
  для цільових робіт із виправлення
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типовий — `true`; задавайте `false` лише коли використовуєте
  workflow як оркестратор виправлення лише для Plugin

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: гілка, тег або повний commit SHA для валідації. Перевірки із секретами
  вимагають, щоб розв’язаний commit був досяжний з гілки OpenClaw або
  тегу релізу.

Правила:

- Стабільні й корекційні теги можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease-теги можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` введення повного commit SHA дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди виконують лише валідацію
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Коли готуєте стабільний npm-реліз:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До існування тегу можна використати поточний повний commit SHA гілки workflow
     для пробного preflight-запуску лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на гілці релізу, тезі релізу або повному
   commit SHA, коли потрібні звичайний CI плюс живий кеш промптів, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує зовнішні Plugin до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для просування цієї стабільної версії з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо до `latest`, а `beta`
   має одразу вказувати на ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Зміна dist-tag розміщена в приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це робить і шлях прямої публікації, і шлях просування beta-first
задокументованими та видимими для операторів.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; утримання цього всередині tmux робить запити,
сповіщення й обробку OTP видимими та запобігає повторним host-сповіщенням.

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
