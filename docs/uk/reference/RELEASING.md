---
read_when:
    - Пошук визначень публічних каналів релізу
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте схему найменування версій і періодичність випусків
summary: Канали випуску, контрольний список оператора, валідаційні бокси, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-29T21:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні гілки релізів:

- stable: теговані релізи, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: передрелізні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія корекційного стабільного релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця або дня
- `latest` означає поточний просунутий стабільний npm-реліз
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та корекційні стабільні релізи типово публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  бета-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку macOS залишають для стабільного релізу, якщо це явно не запитано

## Періодичність релізів

- Релізи рухаються спочатку через бета-версію
- Стабільний реліз виходить лише після перевірки найновішої бета-версії
- Мейнтейнери зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу й виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже надіслано або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N`, а не видаляють чи перестворюють старий бета-тег
- Детальна процедура релізу, схвалення, облікові дані та нотатки щодо відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора релізу

Цей контрольний список описує публічну форму потоку релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
релізному runbook лише для мейнтейнерів.

1. Почніть із поточного `main`: підтягніть найновіші зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте його, надішліть і ще раз зробіть rebase/pull
   перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Підвищте версію в кожному обов’язковому місці для запланованого тегу, потім виконайте
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тегу
   повний 40-символьний SHA релізної гілки дозволений для preflight лише для перевірки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   релізної гілки, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ релізу: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте в релізній гілці й повторно запустіть найменший невдалий
   файл, гілку, завдання workflow, профіль пакета, провайдера або allowlist моделей, що
   доводить виправлення. Повторно запускайте весь umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   post-publish package acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    необхідні докази перевірки. Публікація stable в npm повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність stable-релізу macOS
    також вимагає запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий автономний
    published-npm Telegram E2E, коли потрібен post-publish доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Preflight релізу

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту й архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку
  валідації пакування
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker
  для release-path, live/E2E, OpenWebUI, parity QA Lab, Matrix і Telegram
  lanes. Надавайте `npm_telegram_package_spec` лише після публікації пакета
  й коли також має запуститися післяпублікаційний Telegram E2E. Надавайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен додатковий доказ
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`
  для пакування довіреної гілки/тега/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball із обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском
  GitHub Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує планувальник Docker E2E release
  проти цього tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes для install/channel/agent, мережі gateway і перезавантаження конфігурації
  - `package`: artifact-native lanes для package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    вебпошук OpenAI і OpenWebUI
  - `full`: chunks Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для кандидата релізу. Ручні запускання CI обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і верифікує експортовані назви trace
  span, обмежені атрибути та редагування content/identifier без потреби в
  Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Релізні перевірки тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity gate QA Lab плюс швидкий
  live профіль Matrix і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media й E2EE inventory паралельно.
- Кросплатформна runtime-валідація встановлення та оновлення є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте справжній шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, а повільніші live-перевірки лишайте у
  власній lane, щоб вони не затримували й не блокували публікацію
- Релізні перевірки з секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт доступний з гілки OpenClaw або релізного тега
- validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тега
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у справжню публікацію
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; справжня публікація все одно потребує справжнього релізного тега
- Обидва workflow тримають справжній шлях публікації й промоції на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane релізних перевірок
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити шлях встановлення з опублікованого registry
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і справжній Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу leased Telegram credentials.
  Локальні одноразові запуски maintainer можуть пропустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запустити ту саму післяпублікаційну перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація maintainer release тепер використовує preflight-then-promote:
  - справжня npm publish має пройти успішний npm `preflight_run_id`
  - справжня npm publish має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи за замовчуванням спрямовані на `beta`
  - stable npm publish може явно націлювати `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` є validation-only
  - справжня private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - справжні шляхи publish просувають підготовлені артефакти замість повторного
    їх збирання
- Для стабільних корекційних релізів на кшталт `YYYY.M.D-N` післяпублікаційний верифікатор
  також перевіряє той самий temp-prefix шлях оновлення з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- npm release preflight fail-closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожню браузерну панель керування
- Післяпублікаційна верифікація також перевіряє, що встановлення з опублікованого registry
  містить непорожні runtime deps bundled plugin у кореневому layout `dist/*`.
  Реліз, що постачається з відсутніми або порожніми payloads залежностей bundled plugin,
  провалює postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет `unpackedSize` npm pack для
  candidate update tarball, тож installer e2e ловить випадкове pack bloat
  до шляху release publish
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, згенеруйте повторно й перегляньте належні planner
  виходи matrix `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає поверхні updater:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічної Sparkle build floor
    для цієї release version

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні тести з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте release
branch, tag або повний commit SHA як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow розв’язує target ref, запускає manual `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
опційно запускає окремий post-publish Telegram E2E, коли
`npm_telegram_package_spec` задано. Далі `OpenClaw Release Checks` розгалужується на
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск є прийнятним лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні, а будь-який опційний
дочірній `npm_telegram` або успішний, або навмисно пропущений. Фінальний
verifier summary містить таблиці найповільніших job для кожного дочірнього запуску, щоб release
manager бачив поточний critical path без завантаження logs.
Child workflows запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте довірений harness, вибираючи workflow run ref.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс broad advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати target
ref як `release-package-under-test`, і повторно використовує цей artifact в обох
release-path Docker checks і Package Acceptance. Це тримає всі
package-facing boxes на тих самих байтах і уникає повторних збірок пакета.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
repo/org variable задано, інакше `openai/gpt-5.4-mini`, бо ця lane
доводить package install, onboarding, gateway startup і один live agent turn,
а не benchmark найповільнішої default model. Ширша live provider
matrix лишається місцем для model-specific coverage.

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

Не використовуйте повний парасольковий набір як перший повторний запуск після сфокусованого виправлення. Якщо один блок
падає, для наступного підтвердження використовуйте невдалий дочірній workflow, job, Docker-лінію, профіль пакета, постачальника
моделі або QA-лінію. Запускайте повний парасольковий набір знову лише тоді, коли
виправлення змінило спільну release-оркестрацію або зробило попередні докази всіх блоків
застарілими. Фінальний перевірник парасолькового набору повторно перевіряє записані ідентифікатори запусків
дочірніх workflow, тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдалий
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` у парасольковий набір. `all` є справжнім
запуском release candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only дочірній workflow для Plugin, `release-checks` запускає кожен release-блок,
а вужчі release-групи: `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`, коли
надано окрему package Telegram-лінію.

### Vitest

Блок Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
обходить changed scoping і примусово запускає звичайний граф тестів для release
candidate: Linux Node shards, shards для вбудованих Plugin, контракти каналів, сумісність із Node 22,
`check`, `check-additional`, build smoke, перевірки документації, Python
Skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей блок, щоб відповісти: "чи пройшло дерево вихідного коду повний звичайний набір тестів?"
Це не те саме, що продуктова валідація release-шляху. Докази, які треба зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shards із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли release потребує детермінованого звичайного CI, але
не Docker, QA Lab, live, cross-OS або package-блоків:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker-блок розміщений у `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у release-mode
workflow `install-smoke`. Він перевіряє release candidate через запаковані
Docker-середовища, а не лише тести на рівні вихідного коду.

Release Docker-покриття включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання smoke-образу кореневого Dockerfile за цільовим SHA, із QR,
  root/gateway та installer/Bun smoke jobs, що запускаються як окремі install-smoke
  shards
- репозиторні E2E-лінії
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
- розділені лінії залежностей вбудованих каналів між channel-smoke, update-target
  і setup/runtime contract chunks замість одного великого bundled-channel job
- розділені лінії встановлення/видалення вбудованих Plugin
  від `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E набори постачальників і Docker live model-покриття, коли release checks
  включають live-набори

Використовуйте Docker-артефакти перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` із журналами ліній, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану scheduler і командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені Docker image inputs, коли вони доступні, тож
невдала лінія може повторно використати той самий tarball і GHCR images.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це agentic
поведінковий і канальний release gate, окремий від Vitest і Docker
механіки пакування.

Release QA Lab-покриття включає:

- mock parity gate, що порівнює candidate-лінію OpenAI з baseline Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile із використанням середовища `qa-live-shared`
- live Telegram QA-лінію з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей блок, щоб відповісти: "чи поводиться release коректно в QA-сценаріях і
live-потоках каналів?" Зберігайте URL артефактів для parity, Matrix і Telegram
ліній під час схвалення release. Повне Matrix-покриття залишається доступним як
ручний sharded QA-Lab запуск, а не як стандартна release-critical лінія.

### Package

Блок Package — це gate інстальованого продукту. Його підтримують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
інвентар пакета, записує версію пакета й SHA-256, а також тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна release-версія OpenClaw
- `source=ref`: запакувати довірену гілку `package_ref`, tag або повний commit SHA
  із вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Release-path Docker chunks покривають
перехресні лінії install, update і plugin-update; Package Acceptance зберігає
artifact-native сумісність вбудованих каналів, offline Plugin fixtures і Telegram
package QA для того самого resolved tarball. Це GitHub-native
заміна більшості package/update-покриття, яке раніше вимагало
Parallels. Cross-OS release checks і надалі важливі для OS-специфічного onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакети до
`2026.4.25` включно можуть використовувати compatibility path для прогалин у metadata, уже опублікованих
до npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у git
fixture, похідній від tarball, відсутній збережений `update.channel`, legacy plugin install-record
locations, відсутнє збереження marketplace install-record і config metadata
migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про локальні build metadata stamp files, які вже були випущені. Пізніші пакети
мають відповідати сучасним package contracts; ті самі прогалини провалюють release
validation.

Використовуйте ширші Package Acceptance profiles, коли release-питання стосується
реального інстальованого пакета:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Поширені package profiles:

- `smoke`: швидкі лінії package install/channel/agent, gateway network і config
  reload
- `package`: install/update/plugin package contracts без live ClawHub; це release-check
  default
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
resolved tarball `package-under-test` у Telegram-лінію; окремий
Telegram workflow і надалі приймає опубліковану npm spec для post-publish checks.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі контрольовані оператором inputs:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, ним також може бути поточний
  повний 40-символьний workflow-branch commit SHA для validation-only preflight
- `preflight_only`: `true` для validation/build/package only, `false` для
  справжнього publish path
- `preflight_run_id`: обов’язковий на справжньому publish path, щоб workflow повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для publish path; типово `beta`

`OpenClaw Release Checks` приймає такі контрольовані оператором inputs:

- `ref`: гілка, tag або повний commit SHA для перевірки. Перевірки з secrets
  вимагають, щоб resolved commit був досяжним з OpenClaw branch або
  release tag.

Правила:

- Stable і correction tags можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` input повного commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  тільки validation-only
- Справжній publish path має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням publish

## Послідовність стабільного npm release

Під час створення стабільного npm release:

1. Запустіть `OpenClaw NPM Release` із `preflight_only=true`
   - До існування tag можна використати поточний повний workflow-branch commit
     SHA для validation-only dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first flow або `latest` лише
   коли ви навмисно хочете прямий stable publish
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібне звичайне CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram coverage з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний test graph, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо release потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю stable version з `beta` до `latest`
8. Якщо release навмисно опубліковано напряму в `latest`, а `beta`
   має негайно вказувати на той самий stable build, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable version, або дозвольте його запланованій
   self-healing sync перенести `beta` пізніше

Мутація dist-tag розміщена в приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає publish лише через OIDC.

Це зберігає і direct publish path, і beta-first promotion path
задокументованими та видимими для оператора.

Якщо супровіднику доводиться повернутися до локальної автентифікації npm, запускайте будь-які команди 1Password CLI (`op`) лише всередині виділеного сеансу tmux. Не викликайте `op` безпосередньо з основної оболонки агента; утримання його всередині tmux робить запити, сповіщення та обробку OTP видимими й запобігає повторним сповіщенням хоста.

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

Супровідники використовують приватну документацію релізу в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
