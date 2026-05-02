---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте правила найменування версій і періодичність випусків
summary: Лінії випуску, контрольний список оператора, валідаційні бокси, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-02T12:52:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: e867d5b50be29f95db3a0e3301cc017b1985f88f063d832cbc8fdfa14c0e866b
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали релізів:

- стабільний: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- бета: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного виправного релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-попереднього релізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний просунутий стабільний реліз npm
- `beta` означає поточну ціль встановлення beta
- Стабільні та стабільні виправні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлитися на `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку mac резервують для стабільного релізу, якщо це явно не запитано

## Ритм релізів

- Релізи рухаються спершу через beta
- Стабільний реліз іде лише після перевірки останньої beta
- Супровідники зазвичай відгалужують релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура релізу, погодження, облікові дані та нотатки з відновлення
  призначені лише для супровідників

## Контрольний список оператора релізу

Цей контрольний список є публічною формою релізного процесу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
релізному посібнику лише для супровідників.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт запушено,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте їх, запуште та виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце версії для запланованого тегу, запустіть
   `pnpm plugins:sync`, щоб публіковані Plugin-пакети мали спільну релізну
   версію та метадані сумісності, а потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тегу
   для preflight лише з перевіркою дозволено повний 40-символьний SHA релізної гілки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   релізної гілки, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих релізних тестових середовищ: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте в релізній гілці та перезапустіть найменший збійний
   файл, канал, завдання workflow, профіль пакета, provider або allowlist моделей, що
   доводить виправлення. Перезапускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спершу публікує всі публіковані Plugin-пакети в npm, другим кроком публікує той самий
   набір у ClawHub, а потім просуває підготовлений preflight-артефакт OpenClaw npm
   з dist-tag `beta`. Після публікації запустіть приймальну перевірку пакета після публікації
   проти опублікованого пакета `openclaw@YYYY.M.D-beta.N` або `openclaw@beta`.
   Якщо запушена або опублікована beta потребує виправлення, створіть наступний `-beta.N`;
   не видаляйте й не переписуйте стару beta.
10. Для стабільного релізу продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази перевірки. Публікація стабільного npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight-артефакт через
    `preflight_run_id`; готовність стабільного релізу macOS також вимагає
    запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть перевірник npm після публікації, необов’язковий автономний
    E2E Telegram для опублікованого npm, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Release preflight

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку перевірки
  пакування
- Запустіть `pnpm plugins:sync` після підвищення кореневої версії та перед тегуванням. Він
  оновлює версії публікованих пакетів Plugin, метадані сумісності OpenClaw peer/API,
  метадані збірки та заготовки журналів змін Plugin відповідно до версії релізу
  ядра. `pnpm plugins:sync:check` — це немутуючий релізний запобіжник;
  workflow публікації завершується помилкою перед будь-якою зміною registry, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед затвердженням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` із release
  checks. Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E має також підтвердити опублікований npm-пакет. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  перевірка відповідає опублікованому npm-пакету, без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне побічне підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`
  для пакування довіреної гілки/тега/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS-тарбола з обов’язковим
  SHA-256; або `source=artifact` для тарбола, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата в
  `package-under-test`, повторно використовує release scheduler Docker E2E проти цього
  тарбола і може запускати Telegram QA проти того самого тарбола з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes містять `published-upgrade-survivor`, артефакт пакета є кандидатом, а
  `published_upgrade_survivor_baseline` вибирає опубліковану базову версію.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/каналу/агента, мережі Gateway і перезавантаження конфігурації
  - `package`: lanes пакета/оновлення/Plugin, нативні для артефакту, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI-покриття
  для релізного кандидата. Ручні CI dispatches обходять changed scoping
  і примусово запускають Linux Node shards, bundled-plugin shards, контракти каналів,
  сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час перевірки релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви
  trace span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Запустіть `OpenClaw Release Publish` для мутуючої послідовності публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікується
  тег, досяжний з main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, і залишайте стандартну область публікації Plugin
  `all-publishable`, якщо ви не виконуєте навмисний сфокусований ремонт. Workflow
  послідовно виконує публікацію Plugin npm, публікацію Plugin ClawHub і публікацію OpenClaw
  npm, щоб пакет ядра не був опублікований раніше за свої зовнішні
  Plugin-и.
- Релізні перевірки тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає шлюз mock parity QA Lab плюс швидкий
  live-профіль Matrix і Telegram QA lane перед затвердженням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує оренди
  облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Cross-OS runtime-перевірка встановлення й оновлення є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` напряму
- Цей поділ навмисний: реальний шлях npm-релізу має бути коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки залишаються у власній
  lane, щоб не затримувати й не блокувати публікацію
- Релізні перевірки, що містять секрети, слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт досяжний з гілки OpenClaw або релізного тега
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без потреби в запушеному тезі
- Цей SHA-шлях призначений лише для перевірки й не може бути просунутий у реальну публікацію
- У SHA-режимі workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все ще потребує справжнього релізного тега
- Обидва workflow тримають реальний шлях публікації та просування на GitHub-hosted
  runners, тоді як немутуючий шлях перевірки може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane release checks
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед затвердженням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення опублікованого registry
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові запуски maintainer можуть опускати Convex vars і передавати три
  env-облікові дані `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи за замовчуванням використовують `beta`
  - стабільна npm-публікація може явно цілитися в `latest` через workflow input
  - мутація npm dist-tag на основі token тепер міститься в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` призначений лише для перевірки; коли тег існує лише в
    release branch, але workflow запускається з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - реальний приватний mac publish має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторної
    збірки
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix шлях оновлення з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- npm release preflight завершується закритою помилкою, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковані entrypoints Plugin і
  метадані пакета присутні в установленому registry layout. Реліз, який
  постачає відсутні runtime payloads Plugin, провалює postpublish verifier і
  не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  candidate update tarball, тому installer e2e ловить випадкове роздування pack
  перед шляхом release publish
- Якщо релізна робота торкалася CI planning, manifests часу extension або
  test matrices extension, перегенеруйте й перегляньте planner-owned
  outputs matrix `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед затвердженням, щоб release notes не
  описували застарілий CI layout
- Готовність стабільного macOS-релізу також включає поверхні updater:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після публікації
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї версії релізу

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Для підтвердження pinned commit на гілці, що швидко рухається, використовуйте
helper, щоб кожен child workflow запускався з тимчасової гілки, зафіксованої на цільовому
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен child workflow `headSha`
відповідає цілі, а потім видаляє тимчасову гілку. Це запобігає випадковому підтвердженню
новішого child run з `main`.

Для перевірки release branch або tag запускайте його з довіреного workflow ref `main`
і передавайте release branch або tag як `ref`:

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
окремий package Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгортає install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, Package Acceptance з Telegram package QA, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальне
зведення verifier містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб release
manager міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
повної матриці етапів, точних назв workflow job, відмінностей між профілями stable і full,
артефактів і ручок сфокусованого перезапуску.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу release-гілку або тег. Окремого input workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомому `main`;
сирі commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший критичний для релізу OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для схвалення релізу
- `full`: stable плюс широкий advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт як у
release-path Docker checks, так і в Package Acceptance. Це тримає всі
package-facing boxes на тих самих байтах і уникає повторних package builds.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org variable, інакше `openai/gpt-5.4`, бо ця lane
перевіряє package install, onboarding, gateway startup і один live agent turn,
а не бенчмарк найповільнішої моделі за замовчуванням. Ширша live provider
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

Не використовуйте повну парасольку як перший перезапуск після сфокусованого виправлення. Якщо один box
падає, використовуйте failed child workflow, job, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повну парасольку знову лише тоді,
коли виправлення змінило спільну release orchestration або зробило попередній all-box evidence
застарілим. Фінальний verifier парасольки повторно перевіряє записані child workflow run
ids, тому після успішного перезапуску child workflow перезапускайте лише failed
`Verify full validation` parent job.

Для обмеженого відновлення передайте `rerun_group` у парасольку. `all` — це справжній
release-candidate run, `ci` запускає лише normal CI child, `plugin-prerelease`
запускає лише release-only plugin child, `release-checks` запускає кожен release
box, а вужчі release groups — `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані перезапуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all runs
із `release_profile=full` використовують release-checks package artifact.

### Vitest

Vitest box — це ручний `CI` child workflow. Ручний CI навмисно
обходить changed scoping і примусово запускає normal test graph для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: "чи пройшло source tree повний normal test suite?"
Це не те саме, що release-path product validation. Evidence, який треба зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному target SHA
- назви failed або slow shards із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує performance analysis

Запускайте manual CI напряму лише тоді, коли релізу потрібен deterministic normal CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
`install-smoke` workflow. Він валідовує release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- full install smoke з увімкненим slow Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що запускаються як окремі install-smoke
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
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед перезапуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
перезапуску всіх release chunks. Згенеровані rerun commands включають попередні
`package_artifact_run_id` і prepared Docker image inputs, коли доступні, щоб
failed lane могла повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від Vitest і механіки Docker
package.

Release QA Lab coverage включає:

- mock parity gate, що порівнює OpenAI candidate lane з baseline Opus 4.6
  за допомогою agentic parity pack
- fast live Matrix QA profile із використанням environment `qa-live-shared`
- live Telegram QA lane із використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує explicit local proof

Використовуйте цей box, щоб відповісти: "чи реліз поводиться коректно в QA scenarios і
live channel flows?" Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час схвалення релізу. Full Matrix coverage залишається доступним як
ручний sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідовує
package inventory, записує package version і SHA-256 та тримає
workflow harness ref окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: запакувати довірену `package_ref` branch, tag або full commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA проти того самого resolved tarball. Це GitHub-native
replacement для більшості package/update coverage, що раніше потребувало
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
віддавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Вичерпна published update migration з кожного stable package `2026.4.23+` —
це окремий manual `Update Migration` workflow, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Packages до
`2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих
у npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований package `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші packages
мають задовольняти modern package contracts; ті самі прогалини провалюють release
validation.

Використовуйте ширші профілі Package Acceptance, коли release question стосується
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

- `smoke`: швидкі package install/channel/agent, gateway network і config
  reload lanes
- `package`: install/update/plugin package contracts без live ClawHub; це release-check
  default
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих перезапусків

Для підтвердження Telegram для пакета-кандидата увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у лейн Telegram; окремий
workflow Telegram і далі приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` — це звичайна мутувальна точка входу для публікації.
Вона оркеструє trusted-publisher workflows у порядку, потрібному релізу:

1. Взяти release tag і визначити його commit SHA.
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

Використовуйте нижчорівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release`
лише для цільового ремонту або повторної публікації. Для ремонту вибраного plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish` або запустіть дочірній workflow безпосередньо, коли
пакет OpenClaw не можна публікувати.

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі контрольовані оператором вхідні дані:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний workflow-branch commit SHA для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збирання/пакування, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий на справжньому шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm tag для шляху публікації; стандартно `beta`

`OpenClaw Release Publish` приймає такі контрольовані оператором вхідні дані:

- `tag`: обов’язковий release tag; уже має існувати
- `preflight_run_id`: id успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm tag для пакета OpenClaw
- `plugin_publish_scope`: стандартно `all-publishable`; використовуйте `selected` лише
  для цільового ремонту
- `plugins`: розділені комами імена пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: стандартно `true`; встановлюйте `false` лише коли використовуєте
  workflow як оркестратор ремонту тільки для plugins

`OpenClaw Release Checks` приймає такі контрольовані оператором вхідні дані:

- `ref`: branch, tag або повний commit SHA для валідації. Перевірки із секретами
  вимагають, щоб розв’язаний commit був досяжний із branch OpenClaw або
  release tag.

Правила:

- Стабільні й корекційні tags можна публікувати або до `beta`, або до `latest`
- Beta prerelease tags можна публікувати лише до `beta`
- Для `OpenClaw NPM Release` вхідний повний commit SHA дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди виконують
  лише валідацію
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи tag можна використовувати поточний повний commit SHA workflow branch
     для пробного запуску preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спершу beta, або `latest` лише
   коли навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібне звичайне CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний тестовий граф, запустіть
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
   self-healing синхронізації перемістити `beta` пізніше

Мутація dist-tag розміщена в приватному repo з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний repo зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і шлях просування beta-first
задокументованими та видимими для операторів.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, виконуйте будь-які
команди 1Password CLI (`op`) лише всередині виділеної tmux-сесії. Не викликайте `op`
безпосередньо з основної shell агента; утримання його всередині tmux робить prompts,
alerts і обробку OTP спостережуваними та запобігає повторюваним host alerts.

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
