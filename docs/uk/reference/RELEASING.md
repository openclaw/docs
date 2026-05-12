---
read_when:
    - Пошук визначень публічних каналів релізів
    - Запуск валідації релізу або приймання пакета
    - Пошук схеми іменування версій і періодичності випусків
summary: Канали випуску, контрольний список оператора, блоки перевірки, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-12T08:46:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: передрелізні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного корекційного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Передрелізна beta-версія: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль встановлення beta
- Стабільні та стабільні корекційні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно націлити їх на `latest` або просунути перевірену beta-збірку пізніше
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збирання/підпис/нотаризацію mac-застосунку залишають для стабільного випуску, якщо це явно не запитано

## Каденція випусків

- Випуски рухаються спочатку через beta
- Стабільний випуск іде лише після перевірки останньої beta
- Maintainer-и зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було надіслано або опубліковано й він потребує виправлення, maintainer-и створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, погодження, облікові дані та нотатки з відновлення
  доступні лише maintainer-ам

## Контрольний список оператора випуску

Цей контрольний список є публічною формою процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
runbook випуску лише для maintainer-ів.

1. Почніть із поточного `main`: отримайте найновіші зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте його, надішліть його та виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Підвищте кожне потрібне місце з версією для запланованого тега, потім виконайте
   `pnpm release:prep`. Це оновлює версії Plugin, інвентар Plugin,
   схему конфігурації, метадані конфігурації вбудованих каналів, базову лінію документації конфігурації, експорти Plugin SDK
   і базову лінію API Plugin SDK у правильному порядку. Закомітьте будь-який згенерований
   дрейф перед тегуванням. Потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тега не існує,
   повний 40-символьний SHA гілки випуску дозволено для preflight лише з метою перевірки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не вдається, виправте в гілці випуску та повторно запустіть найменший невдалий
   файл, канал, workflow job, профіль пакета, provider або allowlist моделі, що
   доводить виправлення. Повторно запускайте повний umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   паралельно надсилає всі публіковані пакети Plugin до npm і той самий набір до
   ClawHub, а потім просуває підготовлений preflight-артефакт OpenClaw npm
   з відповідним dist-tag, щойно публікація Plugin в npm завершується успішно.
   Після успішного завершення дочірнього процесу публікації OpenClaw npm він створює або оновлює
   відповідну сторінку GitHub release/prerelease з повного відповідного
   розділу `CHANGELOG.md`. Стабільні випуски, опубліковані в npm `latest`, стають
   найновішим випуском GitHub; стабільні maintenance-випуски, залишені в npm `beta`,
   створюються з GitHub `latest=false`.
   Публікація ClawHub може ще тривати, поки публікується OpenClaw npm, але
   workflow публікації випуску одразу виводить ідентифікатори дочірніх запусків. За замовчуванням він
   не чекає на ClawHub після його dispatch, тому доступність OpenClaw npm
   не блокується повільнішими погодженнями ClawHub або роботою registry; встановіть
   `wait_for_clawhub=true`, коли ClawHub має блокувати завершення workflow. Шлях
   ClawHub повторює тимчасові збої встановлення CLI-залежностей, публікує
   Plugin-и, що пройшли preview, навіть коли одна preview-комірка має нестабільний збій, і завершується
   перевіркою registry для кожної очікуваної версії Plugin, щоб часткові публікації
   залишалися видимими та придатними для повтору. Після публікації виконайте
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   для перевірки GitHub prerelease, npm dist-tag `beta`, цілісності npm,
   опублікованого шляху встановлення, точних версій ClawHub, артефактів ClawHub і висновків дочірніх
   workflow однією командою. Додайте `--rerun-failed-clawhub`, коли
   sidecar ClawHub завершився невдало лише в job-ах, які можна повторити, і його слід повторно запустити на місці.
   Потім запустіть post-publish package acceptance проти опублікованого
   пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований prerelease потребує виправлення,
   створіть наступний відповідний номер prerelease; не видаляйте й не переписуйте старий
   prerelease.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази перевірки. Публікація stable в npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight-артефакт через
    `preflight_run_id`; готовність стабільного випуску macOS також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
    Приватний workflow публікації macOS автоматично публікує підписаний appcast у публічний
    `main` після перевірки release assets; якщо branch protection блокує
    прямий push, він відкриває або оновлює PR appcast.
11. Після публікації запустіть npm post-publish verifier, опційний автономний
    published-npm Telegram E2E, коли вам потрібен післяпублікаційний доказ каналу,
    просування dist-tag за потреби, перевірте згенеровану сторінку GitHub release
    і виконайте кроки оголошення випуску.

## Release preflight

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript
  залишався покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і меж архітектури були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку перевірки
  пакування
- Запустіть `pnpm release:prep` після підвищення версії в корені й перед тегуванням. Він
  запускає кожен детермінований релізний генератор, який часто розходиться після
  зміни версії/конфігурації/API: версії Plugin, інвентар Plugin, схему базової
  конфігурації, метадані конфігурації вбудованих каналів, базову лінію документації
  конфігурації, експорти plugin SDK і базову лінію API plugin SDK. `pnpm release:check` повторно запускає ці
  захисні перевірки в режимі перевірки та повідомляє про кожен знайдений збій
  дрейфу згенерованих файлів за один прохід перед запуском перевірок релізу пакета.
- Запустіть ручний workflow `Full Release Validation` перед затвердженням релізу, щоб
  запустити всі передрелізні тестові середовища з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, приймання пакета, крос-ОС
  перевірок пакета, паритету QA Lab, Matrix і Telegram lanes. Стабільні/типові запуски
  тримають вичерпні live/E2E і Docker release-path soak за
  `run_release_soak=true`; `release_profile=full` примусово вмикає soak. З
  `release_profile=full` і `rerun_group=all` він також запускає package Telegram
  E2E проти артефакту `release-package-under-test` з release checks.
  Надайте `release_package_spec` після публікації beta, щоб повторно використати відвантажений
  npm-пакет у release checks, Package Acceptance і package Telegram
  E2E без перебудови релізного tarball. Надайте
  `npm_telegram_package_spec` лише тоді, коли Telegram має використовувати інший
  опублікований пакет, ніж решта release validation. Надайте
  `package_acceptance_package_spec`, коли Package Acceptance має використовувати
  інший опублікований пакет, ніж специфікація релізного пакета. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має довести, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен побічний доказ
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опубліковану базову лінію. `update-restart-auth` використовує пакет-кандидат як
  встановлений CLI і як package-under-test, тож він перевіряє
  managed restart path команди оновлення кандидата.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/каналу/агента, мережі Gateway і перезавантаження конфігурації
  - `package`: artifact-native lanes пакета/оновлення/перезапуску/Plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для релізного кандидата. Ручні запуски CI обходять scoped changed
  і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і верифікує експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запустіть `pnpm release:check` перед кожним тегованим релізом
- Запустіть `OpenClaw Release Publish` для mutating publish sequence після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікуєте
  тег, досяжний з main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, і зберігайте типовий scope публікації Plugin
  `all-publishable`, якщо ви не виконуєте навмисний сфокусований repair. Workflow
  серіалізує публікацію Plugin в npm, публікацію Plugin в ClawHub і публікацію OpenClaw
  в npm, щоб основний пакет не був опублікований раніше за свої
  зовнішні plugins.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає lane mock parity QA Lab плюс швидкий
  live-профіль Matrix і Telegram QA lane перед затвердженням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує оренди
  облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media і E2EE паралельно.
- Крос-ОС валідація встановлення та runtime оновлення є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Це розділення навмисне: тримайте реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live checks залишаються у своїй
  окремій lane, щоб вони не затримували й не блокували publish
- Release checks із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт досяжний з гілки OpenClaw або релізного тегу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-branch без вимоги запушеного тегу
- Цей шлях SHA призначений лише для валідації та не може бути підвищений до реального publish
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальний publish усе одно потребує справжнього релізного тегу
- Обидва workflows тримають реальний шлях publish і promotion на GitHub-hosted
  runners, тоді як немутуючий шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane release checks
- Перед локальним тегуванням релізного кандидата запустіть
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. Helper
  запускає швидкі релізні guardrails, перевірки релізу Plugin npm/ClawHub, build,
  UI build і `release:openclaw:npm:check` у порядку, який виявляє поширені
  помилки, що блокують затвердження, до запуску workflow публікації GitHub.
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед затвердженням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити шлях встановлення
  з опублікованого registry у свіжий temp prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові запуски maintainer можуть пропустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke з машини maintainer, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Helper запускає Parallels npm update/fresh-target validation, запускає `NPM Telegram Beta E2E`, опитує точний workflow run, завантажує артефакт і друкує звіт Telegram.
- Maintainers можуть запускати ту саму post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases типово використовують `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - token-based мутація npm dist-tag тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    для безпеки, тому що `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає publish лише через OIDC
  - публічний `macOS Release` є validation-only; коли тег існує лише на
    release branch, але workflow запускається з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальний приватний mac publish має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths підвищують підготовлені артефакти замість того, щоб перебудовувати
    їх знову
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення temp-prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- npm release preflight fail-closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню браузерну dashboard
- Post-publish verification також перевіряє, що опубліковані entrypoints Plugin і
  метадані пакета присутні у встановленому registry layout. Реліз, який
  відвантажує відсутні runtime payloads Plugin, провалює postpublish verifier і
  не може бути підвищений до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет `unpackedSize` npm pack для
  candidate update tarball, тож installer e2e виявляє випадкове pack bloat
  до release publish path
- Якщо релізна робота торкалася планування CI, timing manifests extension або
  test matrices extension, перегенеруйте й перегляньте outputs матриці
  `plugin-prerelease-extension-shard`, що належать planner, з
  `.github/workflows/plugin-prerelease.yml` перед затвердженням, щоб release notes не
  описували застарілий CI layout
- Stable macOS release readiness також включає updater surfaces:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після publish; приватний
    macOS publish workflow комітить його автоматично або відкриває appcast
    PR, коли direct push заблоковано
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї релізної версії

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Для доказу за зафіксованим комітом у гілці, що швидко
змінюється, використовуйте допоміжний скрипт, щоб кожен дочірній workflow
запускався з тимчасової гілки, зафіксованої на цільовому SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Допоміжний скрипт пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що `headSha` кожного дочірнього workflow
збігається з цільовим, а потім видаляє тимчасову гілку. Це запобігає випадковому
доказу дочірнього запуску з новішого `main`.

Для перевірки релізної гілки або тега запустіть його з довіреного workflow ref
`main` і передайте релізну гілку або тег як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow розв’язує цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, орієнтованих
на пакет, і запускає автономний пакетний Telegram E2E, коли
`release_profile=full` з `rerun_group=all` або коли задано
`release_package_spec` чи `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгалужується на install smoke, крос-OS релізні перевірки, live/E2E
Docker покриття релізного шляху, коли ввімкнено soak, Package Acceptance з
Telegram package QA, QA Lab parity, live Matrix і live Telegram. Повний запуск
прийнятний лише тоді, коли зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all дочірній
`npm_telegram` також має бути успішним; поза full/all його пропускають, якщо
не було надано опублікований `release_package_spec` або
`npm_telegram_package_spec`. Фінальне зведення верифікатора містить таблиці
найповільніших job для кожного дочірнього запуску, щоб release manager бачив
поточний критичний шлях без завантаження логів.
Див. [Повна релізна перевірка](/uk/reference/full-release-validation) для повної
матриці етапів, точних назв workflow job, відмінностей між профілями stable і
full, артефактів і цільових ручок повторного запуску.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу релізну гілку або тег. Окремого input для workflow-ref у Full Release
Validation немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для точного доказу коміту на рухомому `main`;
сирі commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити зафіксовану тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший критичний для релізу OpenAI/core live і Docker шлях
- `stable`: minimum плюс стабільне покриття provider/backend для схвалення релізу
- `full`: stable плюс широке консультативне покриття provider/media

Використовуйте `run_release_soak=true` зі `stable`, коли release-blocking лінії
зелені й вам потрібні вичерпні live/E2E, Docker релізний шлях і
обмежений sweep виживання опублікованих upgrade перед просуванням. Цей sweep
покриває останні чотири stable пакети плюс зафіксовані базові лінії `2026.4.23`
і `2026.5.2` плюс старіше покриття `2026.4.15`, з видаленими дубльованими
базовими лініями, і кожна базова лінія шардиться в окремий Docker runner job.
`full` передбачає `run_release_soak=true`.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
розв’язати цільовий ref як `release-package-under-test`, і повторно використовує
цей артефакт у крос-OS, Package Acceptance і Docker перевірках релізного шляху,
коли запускається soak. Це тримає всі бокси, орієнтовані на пакет, на тих самих
байтах і уникає повторних збірок пакета.
Після того як beta вже є на npm, задайте `release_package_spec=openclaw@YYYY.M.D-beta.N`,
щоб релізні перевірки один раз завантажили відвантажений пакет, витягнули SHA
джерела збірки з `dist/build-info.json` і повторно використали цей артефакт для
крос-OS, Package Acceptance, Docker релізного шляху й пакетних Telegram ліній.
Крос-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано змінну repo/org, інакше `openai/gpt-5.4`, бо ця лінія доводить
встановлення пакета, onboarding, запуск gateway і один live agent turn, а не
бенчмарк найповільнішої моделі за замовчуванням. Ширша live provider matrix
залишається місцем для модель-специфічного покриття.

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

Не використовуйте повну парасольку як перший повторний запуск після цільового
виправлення. Якщо один бокс падає, використовуйте збійний дочірній workflow,
job, Docker лінію, профіль пакета, модельного provider або QA лінію для
наступного доказу. Запускайте повну парасольку знову лише тоді, коли виправлення
змінило спільну релізну оркестрацію або зробило попередній доказ усіх боксів
застарілим. Фінальний верифікатор парасольки повторно перевіряє записані id
дочірніх workflow run, тому після успішного повторного запуску дочірнього
workflow повторно запускайте лише збійний батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` у парасольку. `all` — це
справжній запуск release-candidate, `ci` запускає лише дочірній normal CI,
`plugin-prerelease` запускає лише release-only plugin child, `release-checks`
запускає кожен релізний бокс, а вужчі релізні групи — це `install-smoke`,
`cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Цільові повторні запуски `npm-telegram` потребують `release_package_spec` або
`npm_telegram_package_spec`; full/all запуски з `release_profile=full`
використовують пакетний артефакт release-checks. Цільові крос-OS повторні
запуски можуть додати `cross_os_suite_filter=windows/packaged-upgrade` або
інший OS/suite фільтр. Збої QA release-check є консультативними; збій лише QA
не блокує релізну перевірку.

### Vitest

Бокс Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно обходить
changed scoping і примусово запускає звичайний test graph для реліз-кандидата:
Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22,
`check`, `check-additional`, build smoke, docs checks, Python skills, Windows,
macOS, Android і Control UI i18n.

Використовуйте цей бокс, щоб відповісти: «чи пройшло дерево джерел повний
звичайний набір тестів?» Це не те саме, що перевірка продукту релізного шляху.
Докази, які слід зберігати:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному цільовому SHA
- назви збійних або повільних shards із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований
звичайний CI, але не Docker, QA Lab, live, крос-OS або пакетні бокси:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Бокс Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс workflow `install-smoke` у
release-mode. Він перевіряє реліз-кандидат через пакетовані Docker середовища,
а не лише тести рівня джерел.

Релізне Docker покриття включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання smoke image root Dockerfile за цільовим SHA,
  з QR, root/gateway і installer/Bun smoke jobs, що запускаються як окремі
  install-smoke shards
- repository E2E лінії
- Docker chunks релізного шляху: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли запитано
- розділені лінії встановлення/видалення bundled plugin
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли релізні перевірки
  включають live suites

Використовуйте Docker артефакти перед повторним запуском. Планувальник
релізного шляху завантажує `.artifacts/docker-tests/` з логами ліній,
`summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника і
командами повторного запуску. Для цільового відновлення використовуйте
`docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість повторного
запуску всіх релізних chunks. Згенеровані команди повторного запуску включають
попередні `package_artifact_run_id` і підготовлені Docker image inputs, коли
доступні, щоб збійна лінія могла повторно використати той самий tarball і GHCR
images.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це agentic behavior і
channel-level release gate, окремий від Vitest і Docker механіки пакетів.

Релізне QA Lab покриття включає:

- mock parity лінію, що порівнює OpenAI candidate lane з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли релізній telemetry потрібен явний локальний доказ

Використовуйте цей бокс, щоб відповісти: «чи реліз поводиться коректно в QA
сценаріях і live channel flows?» Зберігайте URL артефактів для parity, Matrix і
Telegram ліній під час схвалення релізу. Повне Matrix покриття залишається
доступним як ручний шардований QA-Lab запуск, а не як стандартна
release-critical лінія.

### Пакет

Бокс Package — це gate встановлюваного продукту. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує кандидата
в tarball `package-under-test`, який споживає Docker E2E, перевіряє package
inventory, записує версію пакета й SHA-256, і тримає ref workflow harness
окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна релізна версія OpenClaw
- `source=ref`: запакувати довірену `package_ref` гілку, тег або повний commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає перевірку прийнятності пакетів із `source=artifact`, підготовленим артефактом релізного пакета, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai`. Перевірка прийнятності пакетів утримує міграцію, оновлення, перезапуск оновлення з налаштованою автентифікацією, живе встановлення Skills із ClawHub, очищення застарілих залежностей Plugin, автономні фікстури Plugin, оновлення Plugin і QA пакета Telegram відносно того самого розв’язаного tarball. Блокувальні релізні перевірки використовують стандартну базову лінію останнього опублікованого пакета; `run_release_soak=true` або `release_profile=full` розширює її до кожної стабільної базової лінії, опублікованої в npm, від `2026.4.23` до `latest`, а також фікстур повідомлених проблем. Використовуйте перевірку прийнятності пакетів із `source=npm` для вже випущеного кандидата або `source=ref`/`source=artifact` для локального npm tarball, підкріпленого SHA, перед публікацією. Це нативна для GitHub заміна більшої частини покриття пакетів і оновлень, яке раніше вимагало Parallels. Крос-ОС релізні перевірки все ще важливі для специфічного для ОС онбордингу, інсталятора та поведінки платформи, але продуктова валідація пакетів і оновлень має віддавати перевагу перевірці прийнятності пакетів.

Канонічний чекліст для валідації оновлень і Plugin —
[Тестування оновлень і Plugin](/uk/help/testing-updates-plugins). Використовуйте його, коли вирішуєте, яка локальна, Docker, перевірка прийнятності пакетів або релізна смуга доводить зміну встановлення/оновлення Plugin, очищення doctor або міграції опублікованого пакета. Вичерпна міграція опублікованих оновлень з кожного стабільного пакета `2026.4.23+` є окремим ручним workflow `Update Migration`, а не частиною Full Release CI.

Поблажливість застарілої перевірки прийнятності пакетів навмисно обмежена в часі. Пакети до `2026.4.25` включно можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих у npm: приватні записи QA-інвентарю, відсутні в tarball, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, застарілі розташування install-record для Plugin, відсутнє збереження install-record маркетплейсу та міграція метаданих конфігурації під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати про локальні файли штампів метаданих збірки, які вже були випущені. Пізніші пакети мають відповідати сучасним контрактам пакетів; ті самі прогалини провалюють релізну валідацію.

Використовуйте ширші профілі перевірки прийнятності пакетів, коли релізне питання стосується фактичного встановлюваного пакета:

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

- `smoke`: швидкі смуги встановлення пакета/каналу/агента, мережі Gateway і перезавантаження конфігурації
- `package`: контракти встановлення/оновлення/перезапуску/пакета Plugin плюс живе підтвердження встановлення Skills із ClawHub; це стандарт релізної перевірки
- `product`: `package` плюс MCP-канали, очищення cron/subagent, вебпошук OpenAI і OpenWebUI
- `full`: Docker-частини релізного шляху з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для підтвердження Telegram кандидата пакета увімкніть `telegram_mode=mock-openai` або `telegram_mode=live-frontier` у перевірці прийнятності пакетів. Workflow передає розв’язаний tarball `package-under-test` у смугу Telegram; окремий workflow Telegram усе ще приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною мутувальною точкою входу для публікації. Він оркеструє trusted-publisher workflows у порядку, потрібному релізу:

1. Отримати релізний тег і розв’язати його commit SHA.
2. Перевірити, що тег досяжний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` із `publish_scope=all-publishable` і `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тим самим scope і SHA.
6. Запустити `OpenClaw NPM Release` із релізним тегом, npm dist-tag і збереженим `preflight_run_id`.

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

Використовуйте низькорівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release` лише для сфокусованого ремонту або повторної публікації. Для ремонту вибраного Plugin передайте `plugin_publish_scope=selected` і `plugins=@openclaw/name` до `OpenClaw Release Publish` або запустіть дочірній workflow напряму, коли пакет OpenClaw не має публікуватися.

## Вхідні параметри NPM workflow

`OpenClaw NPM Release` приймає такі контрольовані оператором вхідні параметри:

- `tag`: обов’язковий релізний тег, як-от `v2026.4.2`, `v2026.4.2-1` або `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний повний 40-символьний commit SHA гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакування, `false` для реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm tag для шляху публікації; стандартно `beta`

`OpenClaw Release Publish` приймає такі контрольовані оператором вхідні параметри:

- `tag`: обов’язковий релізний тег; має вже існувати
- `preflight_run_id`: ідентифікатор успішного preflight-запуску `OpenClaw NPM Release`; обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm tag для пакета OpenClaw
- `plugin_publish_scope`: стандартно `all-publishable`; використовуйте `selected` лише для сфокусованого ремонту
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли `plugin_publish_scope=selected`
- `publish_openclaw_npm`: стандартно `true`; встановлюйте `false` лише коли використовуєте workflow як оркестратор ремонту тільки для Plugin
- `wait_for_clawhub`: стандартно `false`, щоб доступність npm не блокувалася sidecar ClawHub; встановлюйте `true` лише коли завершення workflow має включати завершення ClawHub

`OpenClaw Release Checks` приймає такі контрольовані оператором вхідні параметри:

- `ref`: гілка, тег або повний commit SHA для валідації. Перевірки із секретами вимагають, щоб розв’язаний commit був досяжний із гілки OpenClaw або релізного тегу.
- `run_release_soak`: увімкнення вичерпного live/E2E, Docker release-path і all-since upgrade-survivor soak на стабільних/стандартних релізних перевірках. Примусово вмикається через `release_profile=full`.

Правила:

- Стабільні та корекційні теги можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease теги можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` введення повного commit SHA дозволене лише коли `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є лише валідаційними
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight; workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Коли готуєте стабільний npm-реліз:

1. Запустіть `OpenClaw NPM Release` із `preflight_only=true`
   - До появи тегу можна використати поточний повний commit SHA гілки workflow для сухого запуску preflight workflow лише з валідацією
2. Оберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише коли навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на релізній гілці, релізному тегу або повному commit SHA, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab, Matrix і Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть ручний workflow `CI` на релізному ref
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`; він публікує екстерналізовані Plugin до npm і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив на `beta`, використовуйте приватний workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`, щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо до `latest` і `beta` має негайно вказувати на ту саму стабільну збірку, використовуйте той самий приватний workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій self-healing синхронізації пізніше перемістити `beta`

Мутація dist-tag живе в приватному репозиторії з міркувань безпеки, бо вона все ще потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це залишає і шлях прямої публікації, і шлях beta-first просування задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password CLI (`op`) лише всередині виділеної tmux-сесії. Не викликайте `op` напряму з основної agent shell; утримання цього всередині tmux робить prompts, сповіщення й обробку OTP видимими та запобігає повторним host alerts.

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

Maintainers використовують приватну релізну документацію в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Релізні канали](/uk/install/development-channels)
