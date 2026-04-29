---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки випуску або приймання пакета
    - Шукаємо іменування версій і періодичність випусків
summary: Релізні лінії, контрольний список оператора, бокси валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-29T11:37:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc944cc72f61226363cd6684c1b4830c518874da21bcf8127d365772275f17f7
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: позначені тегами випуски, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія корекційного стабільного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія попереднього beta-випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початковий нуль до місяця або дня
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль встановлення beta
- Стабільні та корекційні стабільні випуски типово публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний випуск OpenClaw постачає npm-пакет і застосунок macOS разом;
  beta-випуски зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризація застосунку Mac зарезервовані для стабільних випусків, якщо не запитано явно

## Періодичність випусків

- Випуски рухаються спочатку через beta
- Стабільний випуск іде лише після перевірки останньої beta
- Супровідники зазвичай відгалужують випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було надіслано або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура випуску, погодження, облікові дані та нотатки з відновлення
  доступні лише супровідникам

## Контрольний список оператора випуску

Цей контрольний список описує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і подробиці екстреного відкату залишаються в
інструкції з випуску лише для супровідників.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте це, надішліть зміни й виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Підніміть версію в кожному обов’язковому місці для запланованого тега, потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   повний 40-символьний SHA гілки випуску дозволений для попередньої перевірки лише з метою валідації.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA-лабораторія і Package.
8. Якщо валідація не пройшла, виправте в гілці випуску й повторно запустіть найменший файл,
   канал, завдання workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   післяпублікаційне приймання пакета для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для стабільного випуску продовжуйте лише після того, як перевірена beta або кандидат у випуск матиме
    необхідні докази валідації. Публікація стабільного npm повторно використовує успішний
    артефакт попередньої перевірки через `preflight_run_id`; готовність стабільного macOS-випуску
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm-перевірник після публікації, необов’язковий автономний
    опублікований-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub-випуску/попереднього випуску з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним бар’єром `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і меж архітектури були зеленими поза швидшим локальним бар’єром
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку
  валідації пакування
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові boxes з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suite’ів, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  lanes. Надавайте `npm_telegram_package_spec` лише після публікації пакета
  і коли post-publish Telegram E2E також має виконатися. Надавайте
  `evidence_package_spec`, коли приватний evidence-звіт має довести, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне side-channel підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб упакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском
  GitHub Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler для цього
  tarball і може запускати Telegram QA для того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes інсталяції/channel/agent, Gateway-мережі та перезавантаження config
  - `package`: package/update/plugin lanes, прив’язані до артефакта, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, очищення cron/subagent,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне
  CI-покриття для релізного кандидата. Ручні CI dispatch обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python Skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke`, коли валідуєте релізну телеметрію. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування content/identifier без потреби в
  Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media і E2EE inventory паралельно.
- Cross-OS валідація інсталяції та оновлення runtime є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Це розділення навмисне: тримайте реальний npm release path коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у власному
  lane, щоб вони не затримували і не блокували publish
- Release checks із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт доступний з гілки OpenClaw або релізного тегу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби в запушеному тегу
- Цей SHA path призначений лише для валідації і не може бути просунутий у реальний publish
- У SHA mode workflow синтезує `v<package.json version>` лише для
  перевірки package metadata; реальний publish все ще потребує справжнього release tag
- Обидва workflows тримають реальний publish і promotion path на GitHub-hosted
  runners, тоді як немутувальний validation path може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити published registry
  install path у свіжому temp prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити installed-package onboarding, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased Telegram credential
  pool. Локальні одноразові maintainer-запуски можуть пропустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати таку саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути запущений з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm releases за замовчуванням використовують `beta`
  - стабільний npm publish може явно цілитися в `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    public repo зберігає OIDC-only publish
  - публічний `macOS Release` є лише validation-only
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість повторного
    їх rebuild
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight fails closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожній browser dashboard
- Post-publish verification також перевіряє, що published registry install
  містить непорожні bundled plugin runtime deps під root layout `dist/*`.
  Реліз, який виходить із відсутніми або порожніми bundled plugin
  dependency payloads, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет npm pack `unpackedSize` для
  candidate update tarball, щоб installer e2e ловив випадкове pack bloat
  до release publish path
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, згенеруйте заново і перегляньте planner-owned
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність стабільного macOS release також охоплює updater surfaces:
  - GitHub release має зрештою містити packaged `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - packaged app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї release version

## Релізні тестові boxes

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

Workflow розв’язує target ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
опційно запускає standalone post-publish Telegram E2E, коли
`npm_telegram_package_spec` задано. `OpenClaw Release Checks` далі розгалужується на
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні, а будь-який optional
child `npm_telegram` або успішний, або навмисно пропущений. Фінальний
verifier summary містить таблиці slowest-job для кожного child run, щоб release
manager міг бачити поточний critical path без завантаження logs.
Child workflows запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте довірений harness, вибираючи workflow run ref.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс широке advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз розв’язати target
ref як `release-package-under-test`, і повторно використовує цей артефакт і в
release-path Docker checks, і в Package Acceptance. Це тримає всі
package-facing boxes на тих самих байтах і уникає повторних package builds.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
repo/org variable задано, інакше `openai/gpt-5.4-mini`, бо цей lane
доводить package install, onboarding, запуск Gateway і один live agent turn,
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

Не використовуйте повну парасольку як перший повторний запуск після сфокусованого виправлення. Якщо один бокс
зазнає невдачі, використайте невдалий дочірній workflow, job, Docker lane, профіль пакета, модельного
провайдера або QA lane для наступного підтвердження. Запускайте повну парасольку знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази з усіх боксів
застарілими. Фінальний перевіряльник парасольки повторно перевіряє записані ідентифікатори запусків дочірніх workflow,
тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдалий
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` — це справжній
запуск release candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише релізний дочірній plugin, `release-checks` запускає кожен релізний
бокс, а вужчі релізні групи — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`, коли
надано автономний package Telegram lane.

### Vitest

Бокс Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
оминає scoped перевірки змін і примусово запускає звичайний граф тестів для release
candidate: шарди Linux Node, шарди bundled-plugin, контракти каналів, сумісність Node 22,
`check`, `check-additional`, build smoke, перевірки docs, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей бокс, щоб відповісти на запитання «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що продуктова валідація release path. Докази, які треба зберегти:

- summary `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних шардів із CI jobs під час дослідження регресій
- артефакти таймінгу Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не потрібні бокси Docker, QA Lab, live, cross-OS або package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Бокс Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він валідує release candidate через packaged
Docker-середовища, а не лише через тести рівня вихідного коду.

Покриття релізного Docker включає:

- повний install smoke з увімкненим повільним Bun global install smoke
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
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли це запитано
- розділені dependency lanes bundled-channel між channel-smoke, update-target
  і setup/runtime contract chunks замість одного великого bundled-channel job
- розділені lanes встановлення/видалення bundled plugin
  від `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker-артефакти перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, JSON плану scheduler і командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх релізних chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені inputs Docker image, коли вони доступні, щоб
невдалий lane міг повторно використати той самий tarball і GHCR images.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це agentic
behavior і релізний gate рівня каналів, окремий від Vitest і Docker
package mechanics.

Покриття релізного QA Lab включає:

- mock parity gate, що порівнює candidate lane OpenAI з baseline Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли релізній телеметрії потрібне явне локальне підтвердження

Використовуйте цей бокс, щоб відповісти на запитання «чи реліз поводиться правильно у QA-сценаріях і
live channel flows?» Зберігайте URL артефактів для lanes parity, Matrix і Telegram
під час затвердження релізу. Повне покриття Matrix залишається доступним як
ручний sharded QA-Lab run, а не стандартний release-critical lane.

### Пакет

Бокс Package — це gate інстальованого продукту. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує версію пакета та SHA-256 і тримає
ref workflow harness окремо від ref вихідного коду пакета.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: пакує довірену `package_ref` branch, tag або повний commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажує HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Release-path Docker chunks покривають
перекривні lanes install, update і plugin-update; Package Acceptance зберігає
artifact-native bundled-channel compat, offline plugin fixtures і Telegram
package QA щодо того самого resolved tarball. Це GitHub-native
заміна більшості покриття package/update, яке раніше вимагало
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але продуктова валідація package/update має
надавати перевагу Package Acceptance.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакети до
`2026.4.25` включно можуть використовувати compatibility path для прогалин metadata, уже опублікованих
до npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній збережений `update.channel`, legacy plugin install-record
locations, відсутнє marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші пакети
мають відповідати сучасним package contracts; ті самі прогалини провалюють release
validation.

Використовуйте ширші профілі Package Acceptance, коли релізне питання стосується
фактичного інстальованого пакета:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Поширені профілі package:

- `smoke`: швидкі lanes package install/channel/agent, gateway network і config
  reload
- `package`: контракти install/update/plugin package без live ClawHub; це стандарт release-check
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
resolved tarball `package-under-test` до Telegram lane; автономний
Telegram workflow усе ще приймає опублікований npm spec для post-publish checks.

## NPM workflow inputs

`OpenClaw NPM Release` приймає ці operator-controlled inputs:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, він також може бути поточним
  повним 40-символьним commit SHA workflow branch для validation-only preflight
- `preflight_only`: `true` для validation/build/package only, `false` для
  справжнього publish path
- `preflight_run_id`: обов’язковий у справжньому publish path, щоб workflow повторно використовував
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для publish path; за замовчуванням `beta`

`OpenClaw Release Checks` приймає ці operator-controlled inputs:

- `ref`: branch, tag або повний commit SHA для валідації. Secret-bearing checks
  вимагають, щоб resolved commit був reachable з OpenClaw branch або
  release tag.

Правила:

- Stable і correction tags можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease tags можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` input повного commit SHA дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  validation-only
- Справжній publish path має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє, що metadata перед publish продовжує відповідати

## Послідовність стабільного npm-релізу

Під час випуску стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До створення tag можна використовувати поточний повний workflow-branch commit
     SHA для validation-only dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first flow або `latest` лише
   коли ви навмисно хочете direct stable publish
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram coverage з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив до `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано напряму до `latest`, а `beta`
   має негайно вказувати на той самий stable build, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable version, або дозвольте його scheduled
   self-healing sync перемістити `beta` пізніше

Мутація dist-tag живе в приватному repo з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як public repo зберігає OIDC-only publish.

Це зберігає і direct publish path, і beta-first promotion path
задокументованими та видимими для оператора.

Якщо супровіднику доводиться повертатися до локальної автентифікації npm, виконуйте будь-які команди CLI 1Password (`op`) лише всередині окремого сеансу tmux. Не викликайте `op` безпосередньо з основної оболонки агента; утримання цього всередині tmux робить запити, сповіщення й обробку OTP спостережуваними та запобігає повторним сповіщенням хоста.

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

Супровідники використовують приватну документацію щодо випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний покроковий регламент.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
