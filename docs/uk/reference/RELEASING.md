---
read_when:
    - Шукаємо визначення публічних каналів випуску
    - Запуск валідації релізу або приймання пакета
    - Пошук правил іменування версій і періодичності випусків
summary: Канали випусків, контрольний список оператора, середовища валідації, назви версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-05T01:33:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали релізів:

- stable: позначені тегами релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального стабільного релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія попереднього beta-релізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початковий нуль до місяця або дня
- `latest` означає поточний просунутий стабільний npm-реліз
- `beta` означає поточну ціль beta-встановлення
- Стабільні та коригувальні стабільні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний реліз OpenClaw постачає npm-пакет і застосунок macOS разом;
  beta-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку Mac залишають для стабільного релізу, якщо це не запитано явно

## Періодичність релізів

- Релізи рухаються спершу через beta
- Стабільний реліз виходить лише після перевірки останньої beta
- Мейнтейнери зазвичай готують релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура релізу, погодження, облікові дані та нотатки з відновлення
  призначені лише для мейнтейнерів

## Контрольний список оператора релізу

Цей контрольний список показує публічну форму процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкоту залишаються в
релізному runbook лише для мейнтейнерів.

1. Почніть із поточного `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте їх, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тега, виконайте
   `pnpm plugins:sync`, щоб публіковні Plugin-пакети мали спільну релізну
   версію та метадані сумісності, а потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   для preflight лише з перевіркою дозволено повний 40-символьний SHA релізної гілки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   релізної гілки, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих релізних тестових блоків: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте в релізній гілці та повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдер або allowlist моделей, який
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте `vYYYY.M.D-beta.N`, а потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спершу публікує всі публіковні Plugin-пакети в npm, потім публікує той самий
   набір у ClawHub як npm-pack tarball-и ClawPack, а потім просуває
   підготовлений preflight-артефакт npm OpenClaw з відповідним dist-tag. Після
   публікації запустіть post-publish package
   acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований попередній реліз потребує виправлення,
   створіть наступний відповідний номер попереднього релізу; не видаляйте й не переписуйте старий
   попередній реліз.
10. Для стабільного релізу продовжуйте лише після того, як перевірена beta або release candidate матиме
    потрібні докази перевірки. Публікація стабільного релізу в npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight-артефакт через
    `preflight_run_id`; готовність стабільного релізу macOS також вимагає
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть post-publish verifier для npm, необов’язковий standalone
    published-npm Telegram E2E, коли потрібен post-publish доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Preflight релізу

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку
  валідації пакування
- Запустіть `pnpm plugins:sync` після підняття кореневої версії та перед тегуванням. Він
  оновлює версії публікованих пакетів plugin, метадані сумісності
  peer/API OpenClaw, метадані збірки та заготовки журналу змін plugin відповідно до версії
  основного релізу. `pnpm plugins:sync:check` — це немутуючий релізний запобіжник;
  workflow публікації завершується помилкою до будь-якої мутації реєстру, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, крос-OS
  перевірок пакетів, паритету QA Lab, Matrix і Telegram lanes. Стабільні/типові запуски
  тримають вичерпні live/E2E та Docker soak для релізного шляху за
  `run_release_soak=true`; `release_profile=full` примусово вмикає soak. З
  `release_profile=full` і `rerun_group=all` він також запускає package Telegram
  E2E проти артефакту `release-package-under-test` з release checks.
  Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E також має підтвердити опублікований npm-пакет. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має запустити свою матрицю package/update проти відвантаженого npm-пакета замість
  артефакту, зібраного з SHA. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне побічне підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запустити Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: install/channel/agent, gateway network і config reload lanes
  - `package`: package/update/plugin lanes, нативні для артефакту, без OpenWebUI або live ClawHub
  - `product`: package-профіль плюс MCP channels, очищення cron/subagent,
    OpenAI web search і OpenWebUI
  - `full`: Docker-фрагменти релізного шляху з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для кандидата релізу. Ручні CI dispatches обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP-приймач і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Запустіть `OpenClaw Release Publish` для мутуючої послідовності публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікуєте
  тег, досяжний з main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, і залиште типовий scope публікації plugin
  `all-publishable`, якщо ви навмисно не запускаєте сфокусоване виправлення. Workflow
  серіалізує npm-публікацію plugin, публікацію plugin у ClawHub і npm-публікацію OpenClaw,
  щоб основний пакет не було опубліковано раніше за його винесені назовні
  plugins.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity lane плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Крос-OS валідація runtime для install і upgrade є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  повторно використовуваний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у своїй
  lane, щоб вони не затримували й не блокували публікацію
- Релізні перевірки із секретами слід запускати через `Full Release
Validation` або з ref workflow `main`/release, щоб логіка workflow і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт досяжний з гілки OpenClaw або релізного тегу
- validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тегу
- Цей шлях SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає справжнього релізного тегу
- Обидва workflows тримають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як немутуючий шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити опублікований registry
  install path у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding установленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного орендованого пулу Telegram credentials.
  Локальні одноразові запуски maintainer можуть опускати Convex vars і передавати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke з машини maintainer, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Helper запускає Parallels npm update/fresh-target validation, dispatches `NPM Telegram Beta E2E`, polls exact workflow run, downloads artifact і prints Telegram report.
- Maintainers можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожному merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи типово спрямовуються на `beta`
  - стабільна npm-публікація може явно націлюватися на `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний repo залишає OIDC-only publish
  - публічний `macOS Release` є validation-only; коли тег існує лише на
    release branch, але workflow запущено з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи publish просувають підготовлені артефакти замість повторного
    їх rebuild
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight fails closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковані entrypoints plugin і
  package metadata присутні в установленій registry layout. Реліз, який
  відвантажує відсутні runtime payloads plugin, провалює postpublish verifier і
  не може бути підвищений до `latest`.
- `pnpm test:install:smoke` також забезпечує budget `unpackedSize` npm pack для
  candidate update tarball, щоб installer e2e ловив випадкове pack bloat
  до релізного publish path
- Якщо релізна робота торкнулася CI planning, extension timing manifests або
  extension test matrices, згенеруйте заново й перегляньте planner-owned
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність стабільного macOS release також включає updater surfaces:
  - GitHub release має завершитися з упакованими `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - упакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічної Sparkle build floor
    для цієї release version

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні тести з
однієї точки входу. Для доказу pinned commit на швидкозмінній гілці використовуйте
helper, щоб кожен child workflow запускався з тимчасової гілки, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен child workflow `headSha`
збігається з target, а потім видаляє тимчасову гілку. Це уникає випадкового підтвердження
новішого child run з `main`.

Для валідації release branch або tag запускайте це з довіреного workflow
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
батьківський артефакт `release-package-under-test` для перевірок, пов’язаних із пакетом, і
запускає автономний package Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгортає install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, коли soak увімкнено, Package Acceptance з Telegram
package QA, QA Lab parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальне
зведення перевіряча містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб release
manager міг бачити поточний критичний шлях без завантаження журналів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation) щодо
повної матриці етапів, точних назв завдань workflow, відмінностей між профілями stable і full,
артефактів і дескрипторів цільового повторного запуску.
Дочірні workflow запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу release branch або tag. Окремого input workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного commit на рухомому `main`;
raw commit SHAs не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову branch.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical шлях OpenAI/core live і Docker
- `stable`: minimum плюс stable provider/backend coverage для схвалення релізу
- `full`: stable плюс широке advisory provider/media coverage

Використовуйте `run_release_soak=true` зі `stable`, коли release-blocking lanes
зелені й потрібен вичерпний live/E2E, Docker release-path і
all-since-2026.4.23 upgrade-survivor sweep перед просуванням. `full` передбачає
`run_release_soak=true`.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт у cross-OS,
Package Acceptance і release-path Docker checks, коли виконується soak. Це тримає
всі package-facing boxes на тих самих байтах і уникає повторних збірок package.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org variable, інакше `openai/gpt-5.4`, оскільки ця lane
доводить package install, onboarding, gateway startup і один live agent turn,
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

Не використовуйте повну парасольку як перший повторний запуск після цільового виправлення. Якщо один box
зазнає невдачі, використовуйте невдалий дочірній workflow, job, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повну парасольку знову лише тоді, коли
виправлення змінило спільну orchestration релізу або зробило попередні all-box evidence
застарілими. Фінальний перевіряч парасольки повторно перевіряє записані child workflow run
ids, тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` — це справжній
release-candidate run, `ci` запускає лише дочірній normal CI, `plugin-prerelease`
запускає лише release-only plugin child, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Цільові повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all runs
з `release_profile=full` використовують package artifact release-checks. Цільові
cross-OS reruns можуть додати `cross_os_suite_filter=windows/packaged-upgrade` або
інший OS/suite filter. Помилки QA release-check є advisory; QA-only
failure не блокує release validation.

### Vitest

Vitest box — це дочірній workflow manual `CI`. Manual CI навмисно
оминає changed scoping і примусово запускає normal test graph для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти на запитання "чи пройшло source tree повний normal test suite?"
Це не те саме, що release-path product validation. Evidence, які слід зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному target SHA
- назви failed або slow shard із CI jobs під час розслідування регресій
- артефакти timing Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  run потребує performance analysis

Запускайте manual CI напряму лише тоді, коли релізу потрібен deterministic normal CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box міститься в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він валідує release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- повний install smoke з увімкненим slow Bun global install smoke
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
- split bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` through
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` на reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані rerun commands включають попередні
`package_artifact_run_id` і prepared Docker image inputs, коли вони доступні, тому
невдала lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремо від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity lane, що порівнює OpenAI candidate lane з Opus 4.6
  baseline за допомогою agentic parity pack
- fast live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного local proof

Використовуйте цей box, щоб відповісти на запитання "чи реліз поводиться правильно в QA scenarios і
live channel flows?" Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час схвалення релізу. Full Matrix coverage залишається доступним як
manual sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує package version і SHA-256, а також тримає
workflow harness ref окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: pack довірену `package_ref` branch, tag або full commit SHA
  з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`, підготовленим
release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance утримує migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA проти того самого resolved tarball. Blocking release checks використовують
default latest published package baseline; `run_release_soak=true` або
`release_profile=full` розширює це до кожного stable npm-published baseline від
`2026.4.23` до `latest` плюс reported-issue fixtures. Використовуйте
Package Acceptance з `source=npm` для вже shipped candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
publish. Це GitHub-native
заміна більшості package/update coverage, яка раніше вимагала
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Exhaustive published update migration з кожного stable package `2026.4.23+` є
окремим manual workflow `Update Migration`, а не частиною Full Release CI.

Legacy package-acceptance leniency навмисно обмежено в часі. Packages до
`2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих
до npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутній marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований package `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші packages
мають задовольняти modern package contracts; ті самі gaps провалюють release
validation.

Використовуйте ширші profiles Package Acceptance, коли release question стосується
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

Поширені профілі пакетів:

- `smoke`: швидкі напрями встановлення пакета/каналу/агента, мережі gateway і
  перезавантаження конфігурації
- `package`: контракти встановлення/оновлення/пакета Plugin без живого ClawHub; це стандартний профіль
  перевірки релізу
- `product`: `package` плюс канали MCP, очищення cron/субагентів, вебпошук OpenAI
  і OpenWebUI
- `full`: частини Docker release-path з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для підтвердження Telegram для пакета-кандидата увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у напрям Telegram; окремий
workflow Telegram усе ще приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною мутувальною точкою входу для публікації. Вона
оркеструє workflow довіреного публікатора в порядку, потрібному для релізу:

1. Отримати release tag і визначити його commit SHA.
2. Перевірити, що тег досяжний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тим самим scope і SHA.
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

Стабільна публікація в стандартний beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільне просування безпосередньо в `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте нижчорівневі workflow `Plugin NPM Release` і `Plugin ClawHub Release`
лише для цільового виправлення або повторної публікації. Для виправлення вибраного plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish`, або запустіть дочірній workflow напряму, коли
пакет OpenClaw не має публікуватися.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний workflow-branch commit SHA для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий тег npm для шляху публікації; стандартно `beta`

`OpenClaw Release Publish` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий release tag; уже має існувати
- `preflight_run_id`: id успішного preflight run `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий тег npm для пакета OpenClaw
- `plugin_publish_scope`: стандартно `all-publishable`; використовуйте `selected` лише
  для цільових робіт із виправлення
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: стандартно `true`; встановлюйте `false` лише під час використання
  workflow як оркестратора виправлення лише для plugin

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, тег або повний commit SHA для валідації. Перевірки з секретами
  вимагають, щоб визначений commit був досяжний із гілки OpenClaw або
  release tag.
- `run_release_soak`: увімкнення вичерпного live/E2E, Docker release-path і
  all-since upgrade-survivor soak для stable/default release checks. Це примусово
  вмикається через `release_profile=full`.

Правила:

- Стабільні й корекційні теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` вхідний повний commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тегу можна використати поточний повний commit SHA workflow-branch
     для пробного запуску preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли навмисно потрібна пряма стабільна публікація
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує externalized plugins у npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано напряму в `latest`, а `beta`
   має негайно слідувати за тією самою стабільною збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації пізніше перемістити `beta`

Мутація dist-tag розміщена в приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це залишає і прямий шлях публікації, і шлях просування beta-first
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди CLI 1Password
(`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
напряму з основної agent shell; утримання цього всередині tmux робить prompts,
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
