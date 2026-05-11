---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск валідації релізу або приймання пакета
    - Шукаєте найменування версій і періодичність випусків
summary: Канали випусків, контрольний список оператора, блоки валідації, іменування версій і періодичність
title: Політика релізів
x-i18n:
    generated_at: "2026-05-11T20:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- стабільний: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- бета: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія корекційного стабільного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія попереднього бета-випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та корекційні стабільні випуски типово публікуються в npm `beta`; оператори випуску можуть явно вибрати `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  бета-випуски зазвичай спершу перевіряють і публікують шлях npm/package, а
  збирання/підпис/нотаризацію застосунку Mac залишають для стабільного випуску, якщо це явно не запитано

## Каденція випусків

- Випуски рухаються спочатку через бета-канал
- Стабільний випуск іде лише після перевірки останньої бета-версії
- Мейнтейнери зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже було надіслано або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого бета-тега
- Детальна процедура випуску, погодження, облікові дані та нотатки з відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора випуску

Цей контрольний список є публічною формою процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкату залишаються в
runbook випусків лише для мейнтейнерів.

1. Почніть із поточного `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і переконайтеся, що CI поточного `main` достатньо зелений, щоб створювати від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте це, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тега, потім запустіть
   `pnpm release:prep`. Це оновить версії plugins, інвентар plugins, схему
   конфігурації, метадані конфігурації вбудованих каналів, базову лінію документації конфігурації, експорти Plugin SDK
   і базову лінію API Plugin SDK у правильному порядку. Закомітьте будь-які згенеровані
   розбіжності перед тегуванням. Потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   для перевірки лише preflight дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передвипускові тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не вдалася, виправте це в гілці випуску й повторно запустіть найменший невдалий
   файл, lane, завдання workflow, профіль package, провайдера або allowlist моделі, який
   доводить виправлення. Повторно запускайте повну umbrella-перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії створіть тег `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   паралельно відправляє всі придатні до публікації пакети plugins в npm і той самий набір у
   ClawHub, а потім просуває підготовлений preflight-артефакт OpenClaw npm
   з відповідним dist-tag, щойно публікація plugins в npm завершиться успішно.
   Після успішного завершення дочірнього процесу публікації OpenClaw npm він створює або оновлює
   відповідну сторінку GitHub release/prerelease з повного відповідного
   розділу `CHANGELOG.md`. Стабільні випуски, опубліковані в npm `latest`, стають
   останнім випуском GitHub; стабільні підтримувальні випуски, залишені в npm `beta`,
   створюються з GitHub `latest=false`.
   Публікація ClawHub усе ще може тривати, поки публікується OpenClaw npm, але
   workflow публікації випуску одразу виводить ID дочірніх запусків. Типово він
   не чекає на ClawHub після його відправлення, тому доступність OpenClaw npm
   не блокується повільнішими погодженнями ClawHub або роботою registry; встановіть
   `wait_for_clawhub=true`, коли ClawHub має блокувати завершення workflow. Шлях
   ClawHub повторює спроби після тимчасових збоїв встановлення залежностей CLI, публікує
   plugins, що пройшли preview, навіть коли одна preview-комірка нестабільна, і завершується
   перевіркою registry для кожної очікуваної версії plugin, щоб часткові публікації
   залишалися видимими та придатними для повторної спроби. Після публікації запустіть
   післяпублікаційне приймання package
   проти опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований prerelease потребує виправлення,
   створіть наступний відповідний номер prerelease; не видаляйте й не переписуйте старий
   prerelease.
10. Для стабільного випуску продовжуйте лише після того, як перевірена бета-версія або release candidate має
    потрібні докази перевірки. Публікація стабільного npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight-артефакт через
    `preflight_run_id`; готовність стабільного випуску macOS також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
    Приватний workflow публікації macOS автоматично публікує підписаний appcast у публічний
    `main` після перевірки release-артефактів; якщо захист гілки блокує
    прямий push, він відкриває або оновлює PR для appcast.
11. Після публікації запустіть npm-перевіряльник після публікації, необов’язковий автономний
    опублікований-npm Telegram E2E, коли потрібен післяпублікаційний доказ каналу,
    просування dist-tag, коли потрібно, перевірте згенеровану сторінку GitHub release
    і виконайте кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед попередньою перевіркою релізу, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним бар’єром `pnpm check`
- Запустіть `pnpm check:architecture` перед попередньою перевіркою релізу, щоб ширші перевірки циклів
  імпорту та архітектурних меж були успішними поза швидшим локальним бар’єром
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку перевірки
  пакування
- Запустіть `pnpm release:prep` після підвищення версії в корені та перед створенням тегу. Він
  запускає кожен детермінований релізний генератор, який зазвичай розходиться після зміни
  версії/конфігурації/API: версії плагінів, інвентар плагінів, базову схему конфігурації,
  метадані конфігурації вбудованих каналів, базову лінію документації конфігурації, експорти SDK
  плагінів і базову лінію API SDK плагінів. `pnpm release:check` повторно запускає ці
  запобіжники в режимі перевірки та повідомляє про кожен виявлений збій згенерованого відхилення за один
  прохід перед запуском перевірок релізу пакета.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові середовища з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, міжплатформних
  перевірок пакетів, паритету QA Lab, Matrix і Telegram-гілок. Стабільні/типові запуски
  тримають вичерпні live/E2E та Docker release-path soak за
  `run_release_soak=true`; `release_profile=full` примусово вмикає soak. З
  `release_profile=full` і `rerun_group=all` він також запускає package Telegram
  E2E проти артефакту `release-package-under-test` із релізних перевірок.
  Надайте `release_package_spec` після публікації бета-версії, щоб повторно використати випущений
  npm-пакет у release checks, Package Acceptance і package Telegram
  E2E без повторного збирання релізного tarball. Надавайте
  `npm_telegram_package_spec` лише тоді, коли Telegram має використовувати інший
  опублікований пакет, ніж решта релізної перевірки. Надайте
  `package_acceptance_package_spec`, коли Package Acceptance має використовувати
  інший опублікований пакет, ніж специфікація релізного пакета. Надайте
  `evidence_package_spec`, коли приватний звіт із доказами має довести, що
  перевірка відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен доказ через додатковий канал
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker-гілки містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опубліковану базову лінію. `update-restart-auth` використовує пакет-кандидат як
  встановлений CLI і як package-under-test, щоб перевірити керований шлях перезапуску
  команди оновлення кандидата.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: install/channel/agent, мережа Gateway і гілки перезавантаження конфігурації
  - `package`: package/update/restart/plugin-гілки, нативні для артефакту, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс канали MCP, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для кандидата релізу. Ручні запуски CI обходять changed scoping
  і примусово запускають шарди Linux Node, шарди вбудованих плагінів, контракти каналів,
  сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python Skills, Windows, macOS, Android і Control UI i18n
  гілки.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час перевірки релізної телеметрії. Він перевіряє
  QA-lab через локальний OTLP/HTTP-приймач і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запустіть `pnpm release:check` перед кожним релізом із тегом
- Запустіть `OpenClaw Release Publish` для змінної послідовності публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікуєте тег,
  досяжний з main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, і залиште типовий scope публікації плагінів
  `all-publishable`, якщо ви навмисно не виконуєте сфокусоване виправлення. Workflow
  серіалізує публікацію плагінів у npm, публікацію плагінів у ClawHub і публікацію OpenClaw
  у npm, щоб основний пакет не був опублікований перед своїми зовнішніми
  плагінами.
- Релізні перевірки тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity lane плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live-гілки
  використовують середовище `qa-live-shared`; Telegram також використовує оренди облікових даних Convex CI.
  Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media і E2EE паралельно.
- Міжплатформна перевірка встановлення та runtime-оновлення є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний шлях релізу npm коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у власній
  гілці, щоб вони не затримували й не блокували публікацію
- Релізні перевірки із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт досяжний з гілки OpenClaw або релізного тегу
- Попередня перевірка validation-only `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги до надісланого тегу
- Цей шлях SHA призначений лише для перевірки й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно потребує справжнього релізного тегу
- Обидва workflow тримають реальний шлях публікації та просування на GitHub-hosted
  runner, тоді як незмінний шлях перевірки може використовувати більші
  Blacksmith Linux runner
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Попередня перевірка npm-релізу більше не чекає на окрему гілку релізних перевірок
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний бета/корекційний тег) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну бета/корекційну версію), щоб перевірити шлях встановлення з опублікованого реєстру
  у свіжому тимчасовому префіксі
- Після публікації бета-версії запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові запуски maintainers можуть опускати змінні Convex і передавати три
  env-облікові дані `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke з машини maintainer, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Helper запускає Parallels npm update/fresh-target validation, запускає `NPM Telegram Beta E2E`, опитує точний workflow run, завантажує артефакт і друкує звіт Telegram.
- Maintainers можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальна публікація npm має пройти успішний npm `preflight_run_id`
  - реальна публікація npm має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи типово йдуть у `beta`
  - стабільна публікація npm може явно таргетувати `latest` через workflow input
  - мутація npm dist-tag на основі токена тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` є validation-only; коли тег існує лише в
    релізній гілці, але workflow запускається з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальна приватна публікація mac має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторного
    їх збирання
- Для стабільних корекційних релізів на кшталт `YYYY.M.D-N`, post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб релізні корекції не могли непомітно залишити старіші глобальні встановлення на
  базовому стабільному payload
- Попередня перевірка npm-релізу завершується відмовою, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковані entrypoints плагінів і
  метадані пакета присутні у встановленій registry layout. Реліз, який
  постачає відсутні runtime payloads плагінів, провалює postpublish verifier і
  не може бути підвищений до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет npm pack `unpackedSize` на
  candidate update tarball, тож installer e2e ловить випадкове збільшення пакета
  до шляху публікації релізу
- Якщо релізна робота торкалася планування CI, timing manifests розширень або
  test matrices розширень, перегенеруйте й перегляньте керовані planner
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий layout CI
- Готовність стабільного macOS-релізу також включає поверхні updater:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий стабільний zip після публікації; приватний
    workflow публікації macOS комітить його автоматично або відкриває appcast
    PR, коли прямий push заблокований
  - запакований застосунок має зберігати non-debug bundle id, непорожній URL Sparkle feed
    і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї версії релізу

## Релізні тестові середовища

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Для доказу pinned commit на швидкозмінній гілці використовуйте
helper, щоб кожен дочірній workflow запускався з тимчасової гілки, зафіксованої на цільовому
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Допоміжний інструмент надсилає `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен дочірній workflow `headSha`
відповідає цілі, а потім видаляє тимчасову гілку. Це запобігає випадковому підтвердженню
дочірнього запуску новішої `main`.

Для перевірки релізної гілки або тегу запускайте його з довіреного workflow `main`
ref і передавайте релізну гілку або тег як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, орієнтованих на пакет, і
запускає окремий package Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `release_package_spec` чи
`npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгалужується на install smoke, cross-OS release checks, live/E2E Docker
покриття релізного шляху, коли soak увімкнено, Package Acceptance з Telegram
package QA, паритет QA Lab, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `release_package_spec` або `npm_telegram_package_spec`.
Фінальний
підсумок верифікатора містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб релізний
менеджер міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна перевірка релізу](/uk/reference/full-release-validation), щоб отримати
повну матрицю етапів, точні назви завдань workflow, відмінності між профілями stable і full,
артефакти та точкові засоби повторного запуску.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу релізну гілку або тег. Окремого input для workflow-ref у Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для підтвердження точного commit на рухомій `main`;
сирі SHA commit не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший релізно-критичний live шлях OpenAI/core і Docker
- `stable`: minimum плюс стабільне покриття provider/backend для схвалення релізу
- `full`: stable плюс широке advisory покриття provider/media

Використовуйте `run_release_soak=true` зі `stable`, коли реліз-блокувальні lanes
зелені й потрібна вичерпна live/E2E, Docker release-path і
обмежена перевірка published upgrade-survivor перед просуванням. Ця перевірка покриває
останні чотири стабільні пакети плюс закріплені baseline `2026.4.23` і `2026.5.2`
плюс старіше покриття `2026.4.15`, з видаленими дублікатами baseline і
кожним baseline, розбитим в окреме завдання Docker runner. `full` передбачає
`run_release_soak=true`.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт у cross-OS,
Package Acceptance і release-path Docker перевірках, коли виконується soak. Це тримає
всі package-facing середовища на тих самих байтах і уникає повторних збірок пакета.
Після того як beta вже є в npm, задайте `release_package_spec=openclaw@YYYY.M.D-beta.N`,
щоб release checks один раз завантажили відвантажений пакет, витягнули його build source
SHA з `dist/build-info.json` і повторно використали цей артефакт для cross-OS,
Package Acceptance, release-path Docker і package Telegram lanes.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано змінну repo/org, інакше `openai/gpt-5.4`, бо ця lane
підтверджує встановлення пакета, onboarding, запуск Gateway і один live turn агента,
а не бенчмарк найповільнішої моделі за замовчуванням. Ширша live provider
matrix залишається місцем для покриття, специфічного для моделей.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну парасольку як перший повторний запуск після точкового виправлення. Якщо одне середовище
падає, використовуйте невдалий дочірній workflow, завдання, Docker lane, профіль пакета, model
provider або QA lane для наступного підтвердження. Запускайте повну парасольку знову лише тоді,
коли виправлення змінило спільну релізну оркестрацію або зробило попередні докази для всіх середовищ
застарілими. Фінальний верифікатор парасольки повторно перевіряє записані run
ids дочірніх workflow, тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` — це справжній
запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only дочірній plugin, `release-checks` запускає всі release
середовища, а вужчі релізні групи — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Точкові повторні запуски `npm-telegram` потребують `release_package_spec` або
`npm_telegram_package_spec`; запуски full/all з `release_profile=full` використовують
package artifact із release-checks. Точкові
повторні запуски cross-OS можуть додати `cross_os_suite_filter=windows/packaged-upgrade` або
інший фільтр OS/suite. Помилки QA release-check є advisory; помилка лише в QA
не блокує перевірку релізу.

### Vitest

Середовище Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
оминає changed scoping і примусово запускає звичайний тестовий граф для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте це середовище, щоб відповісти: "чи пройшло дерево джерел повний звичайний набір тестів?"
Це не те саме, що product validation релізного шляху. Докази, які слід зберігати:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shard із завдань CI під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker, QA Lab, live, cross-OS або package середовища:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Середовище Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у release-mode
workflow `install-smoke`. Воно перевіряє release candidate через packaged
Docker середовища, а не лише тести на рівні джерел.

Покриття Release Docker включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання smoke image root Dockerfile за цільовим SHA, з QR,
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
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` із логами lanes, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану scheduler і командами повторного запуску. Для точкового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередній
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступні, щоб
невдала lane могла повторно використати той самий tarball і GHCR images.

### QA Lab

Середовище QA Lab також є частиною `OpenClaw Release Checks`. Це агентний
behavior і channel-level release gate, окремий від Vitest і механіки Docker
package.

Покриття Release QA Lab включає:

- mock parity lane, що порівнює candidate lane OpenAI з baseline Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального підтвердження

Використовуйте це середовище, щоб відповісти: "чи поводиться реліз коректно в QA scenarios і
live channel flows?" Зберігайте URL артефактів для parity, Matrix і Telegram
lanes під час схвалення релізу. Повне Matrix coverage залишається доступним як
ручний sharded QA-Lab run, а не default release-critical lane.

### Пакет

Середовище Package — це installable-product gate. Його забезпечують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
package inventory, записує package version і SHA-256, а також тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: пакує довірену `package_ref` гілку, тег або повний commit SHA
  з вибраним harness `workflow_ref`
- `source=url`: завантажує HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update,
configured-auth update restart, live ClawHub skill install, stale plugin dependency cleanup, offline plugin
fixtures, plugin update і Telegram package QA проти того самого resolved
tarball. Блокувальні release checks використовують default latest published package
baseline; `run_release_soak=true` або
`release_profile=full` розширює це до кожного stable npm-published baseline від
`2026.4.23` до `latest` плюс reported-issue fixtures. Використовуйте
Package Acceptance із `source=npm` для вже відвантаженого candidate або
`source=ref`/`source=artifact` для локального npm tarball, підкріпленого SHA, перед
публікацією. Це GitHub-native
заміна більшості package/update coverage, яке раніше вимагало
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Канонічний контрольний список для перевірки оновлень і Plugin —
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте його,
коли вирішуєте, яка локальна, Docker, Package Acceptance або release-check гілка підтверджує
встановлення/оновлення Plugin, очищення doctor або зміну міграції опублікованого пакета.
Вичерпна міграція опублікованих оновлень з кожного стабільного пакета `2026.4.23+` є
окремим ручним workflow `Update Migration`, а не частиною Full Release CI.

Послаблення для legacy package-acceptance навмисно обмежене в часі. Пакети до
`2026.4.25` включно можуть використовувати шлях сумісності для прогалин у metadata, вже опублікованих
у npm: приватні записи QA inventory, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній збережений `update.channel`, legacy розташування install-record
для plugin, відсутнє збереження marketplace install-record, а також міграція config metadata
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про локальні файли штампа build metadata, які вже були випущені. Пізніші пакети
мають відповідати сучасним контрактам пакетів; ті самі прогалини провалюють
валідацію release.

Використовуйте ширші профілі Package Acceptance, коли питання release стосується
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

- `smoke`: швидкі гілки встановлення пакета/channel/agent, gateway network і перезавантаження
  config
- `package`: контракти встановлення/оновлення/перезапуску/plugin package, а також live-підтвердження встановлення
  Skills із ClawHub; це стандартний release-check
- `product`: `package` плюс MCP channels, очищення cron/subagent, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path фрагменти з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у Telegram lane; окремий
Telegram workflow досі приймає опубліковану npm spec для post-publish перевірок.

## Автоматизація публікації release

`OpenClaw Release Publish` є звичайною мутуючою точкою входу для публікації. Вона
оркеструє trusted-publisher workflows у порядку, потрібному release:

1. Checkout release tag і визначення його commit SHA.
2. Перевірка, що tag досяжний із `main` або `release/*`.
3. Запуск `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` з тим самим scope і SHA.
6. Dispatch `OpenClaw NPM Release` з release tag, npm dist-tag і
   збереженим `preflight_run_id`.

Приклад beta-публікації:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stable-публікація до стандартного beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stable-просування безпосередньо до `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте нижчерівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release`
лише для сфокусованого repair або republish. Для repair вибраного plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish` або dispatch дочірній workflow напряму, коли
пакет OpenClaw не має публікуватися.

## Вхідні параметри NPM workflow

`OpenClaw NPM Release` приймає такі operator-controlled inputs:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний workflow-branch commit SHA для validation-only preflight
- `preflight_only`: `true` для лише validation/build/package, `false` для
  реального publish path
- `preflight_run_id`: обов’язковий у реальному publish path, щоб workflow повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для publish path; стандартно `beta`

`OpenClaw Release Publish` приймає такі operator-controlled inputs:

- `tag`: обов’язковий release tag; має вже існувати
- `preflight_run_id`: успішний preflight run id `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm tag для пакета OpenClaw
- `plugin_publish_scope`: стандартно `all-publishable`; використовуйте `selected` лише
  для сфокусованого repair
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: стандартно `true`; установлюйте `false` лише коли використовуєте
  workflow як оркестратор repair лише для plugin

`OpenClaw Release Checks` приймає такі operator-controlled inputs:

- `ref`: branch, tag або повний commit SHA для валідації. Перевірки з secrets
  вимагають, щоб розв’язаний commit був досяжний з OpenClaw branch або
  release tag.
- `run_release_soak`: вмикає вичерпний live/E2E, Docker release-path і
  all-since upgrade-survivor soak для stable/default release checks. Примусово
  вмикається через `release_profile=full`.

Правила:

- Stable і correction tags можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease tags можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` повний commit SHA input дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  validation-only
- Реальний publish path має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням публікації

## Послідовність stable npm release

Під час створення stable npm release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До існування tag можна використовувати поточний повний workflow-branch commit
     SHA для validation-only dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first flow або `latest` лише
   коли навмисно хочете пряму stable-публікацію
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram coverage з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний test graph, запустіть
   ручний workflow `CI` на release ref
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує externalized plugins до npm
   і ClawHub перед просуванням OpenClaw npm package
7. Якщо release потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable version з `beta` до `latest`
8. Якщо release навмисно опубліковано безпосередньо до `latest`, а `beta`
   має негайно вказувати на той самий stable build, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable version, або дозвольте його scheduled
   self-healing sync перемістити `beta` пізніше

Мутація dist-tag живе в приватному repo з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний repo зберігає OIDC-only publish.

Це робить і direct publish path, і beta-first promotion path
задокументованими та видимими для оператора.

Якщо maintainer має повернутися до локальної npm authentication, запускайте будь-які команди 1Password
CLI (`op`) лише всередині dedicated tmux session. Не викликайте `op`
напряму з main agent shell; утримання його всередині tmux робить prompts,
alerts і OTP handling видимими та запобігає повторним host alerts.

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

Maintainers використовують приватну release documentation у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Release channels](/uk/install/development-channels)
