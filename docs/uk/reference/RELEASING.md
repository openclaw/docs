---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Пошук інформації про найменування версій і періодичність випусків
summary: Лінії релізів, контрольний список оператора, валідаційні бокси, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-01T20:41:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c764896371f67abdf7b7e85605f03136d4ed905cb74b73b56fe8c5965e84883
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: передрелізні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального стабільного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль встановлення beta
- Стабільні та коригувальні стабільні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно вказати `latest` або просунути перевірену beta-збірку пізніше
- Кожен стабільний випуск OpenClaw постачає npm-пакет і macOS-застосунок разом;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризація mac-застосунку резервуються для стабільного випуску, якщо інше не запитано явно

## Періодичність випусків

- Випуски рухаються спочатку через beta
- Стабільний випуск іде лише після перевірки найновішої beta
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було надіслано або опубліковано і він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, схвалення, облікові дані та примітки з відновлення
  доступні лише супровідникам

## Контрольний список оператора випуску

Цей контрольний список описує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкату залишаються в
runbook випуску лише для супровідників.

1. Почніть із поточної `main`: отримайте найновіші зміни, підтвердьте, що цільовий коміт надіслано,
   і переконайтеся, що поточна CI `main` достатньо зелена, щоб відгалузитися від неї.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувачів, закомітьте його, надішліть його та виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тегу, потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тегу
   повний 40-символьний SHA гілки випуску дозволено для попередньої перевірки лише з метою валідації.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не проходить, виправте в гілці випуску та повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Повторно запускайте весь umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   приймання пакета після публікації проти опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для стабільного випуску продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази валідації. Публікація стабільного npm повторно використовує успішний
    артефакт попередньої перевірки через `preflight_run_id`; готовність стабільного macOS-випуску
    також вимагає запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm-верифікатор після публікації, необов'язковий окремий
    опублікований-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і меж архітектури були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку
  перевірки пакування
- Запустіть ручний workflow `Full Release Validation` перед затвердженням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. Надавайте `npm_telegram_package_spec` лише після публікації пакета
  і коли післяпублікаційний Telegram E2E також має бути запущений. Надавайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  перевірка відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне side-channel підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler для цього
  tarball і може запускати Telegram QA для того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Типові профілі:
  - `smoke`: lanes для install/channel/agent, gateway network і config reload
  - `package`: artifact-native lanes для package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для кандидата релізу. Ручні dispatch для CI обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke`, коли перевіряєте релізну telemetry. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування content/identifier без потреби в
  Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає gate mock parity QA Lab плюс швидкий
  live Matrix profile і Telegram QA lane перед затвердженням релізу. Live
  lanes використовують environment `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media та E2EE inventory паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Це розділення навмисне: реальний npm release path має бути коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live checks лишаються у власному
  lane, щоб вони не затримували й не блокували publish
- Release checks із секретами слід dispatch через `Full Release
Validation` або з workflow ref `main`/release, щоб workflow logic і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт доступний з гілки OpenClaw або release tag
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow branch без потреби у pushed tag
- Цей SHA path призначений лише для validation і не може бути підвищений до реального publish
- У SHA mode workflow синтезує `v<package.json version>` лише для
  перевірки package metadata; реальний publish усе ще потребує реального release tag
- Обидва workflows тримають реальний publish і promotion path на GitHub-hosted
  runners, тоді як немутуючий validation path може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед approval
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити published registry
  install path у свіжому temp prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding установленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased Telegram credential
  pool. Локальні одноразові запуски maintainer можуть пропустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати таку саму post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути dispatch з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases за замовчуванням спрямовані на `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій тримає OIDC-only publish
  - публічний `macOS Release` є validation-only; коли tag існує лише на
    release branch, але workflow запускається з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість повторного
    rebuilding
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно лишити старіші global installs на
  базовому stable payload
- npm release preflight fail-closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожню browser dashboard
- Post-publish verification також перевіряє, що published plugin entrypoints і
  package metadata присутні в установленому registry layout. Реліз, у якому
  відсутні plugin runtime payloads, не проходить postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет npm pack `unpackedSize` для
  candidate update tarball, щоб installer e2e ловив випадкове pack bloat
  до release publish path
- Якщо release work торкнулася CI planning, extension timing manifests або
  extension test matrices, згенеруйте повторно та перегляньте planner-owned
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед approval, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - packaged app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї release version

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні тести з
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

Workflow розв’язує target ref, dispatch manual `CI` з
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks` і
за потреби dispatch standalone post-publish Telegram E2E, коли
`npm_telegram_package_spec` встановлено. Далі `OpenClaw Release Checks` розгалужує
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні, а будь-який optional
child `npm_telegram` або успішний, або навмисно skipped. Final
verifier summary містить таблиці slowest-job для кожного child run, щоб release
manager міг бачити поточний critical path без завантаження logs.
Див. [Full release validation](/uk/reference/full-release-validation) для
повної stage matrix, точних workflow job names, відмінностей між stable і full profile,
artifacts і focused rerun handles.
Child workflows запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте trusted harness, вибираючи workflow run ref.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс широке advisory provider/media coverage

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз визначити цільове посилання як `release-package-under-test`, і повторно використовує цей артефакт як у Docker-перевірках release-path, так і в Package Acceptance. Це тримає всі бокси, що працюють із пакетом, на тих самих байтах і уникає повторних збірок пакета. Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли змінна repo/org задана, інакше `openai/gpt-5.4-mini`, тому що ця lane доводить встановлення пакета, onboarding, запуск gateway і один live agent turn, а не бенчмарк найповільнішої типової моделі. Ширша live provider matrix залишається місцем для model-specific покриття.

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

Не використовуйте повну парасольку як перший повторний запуск після сфокусованого виправлення. Якщо один box падає, використовуйте failed child workflow, job, Docker lane, package profile, model provider або QA lane для наступного доказу. Запускайте повну парасольку знову лише тоді, коли виправлення змінило спільну release orchestration або зробило попередні all-box докази застарілими. Фінальний verifier парасольки повторно перевіряє записані child workflow run ids, тому після успішного повторного запуску child workflow повторно запускайте лише failed parent job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` — це справжній release-candidate run, `ci` запускає лише normal CI child, `plugin-prerelease` запускає лише release-only plugin child, `release-checks` запускає кожен release box, а вужчі release groups — це `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`, коли надано standalone package Telegram lane.

### Vitest

Vitest box — це ручний child workflow `CI`. Manual CI навмисно обходить changed scoping і примусово запускає normal test graph для release candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: «чи пройшло source tree повний normal test suite?» Це не те саме, що release-path product validation. Докази, які треба зберегти:

- summary `Full Release Validation`, що показує dispatched `CI` run URL
- `CI` run зелений на exact target SHA
- назви failed або slow shards із CI jobs під час розслідування регресій
- артефакти Vitest timing, такі як `.artifacts/vitest-shard-timings.json`, коли run потребує аналізу продуктивності

Запускайте manual CI напряму лише тоді, коли релізу потрібен deterministic normal CI, але не потрібні Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через `openclaw-live-and-e2e-checks-reusable.yml`, а також у release-mode workflow `install-smoke`. Він перевіряє release candidate через packaged Docker environments, а не лише source-level tests.

Покриття release Docker включає:

- full install smoke з увімкненим slow Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, з QR, root/gateway і installer/Bun smoke jobs, що запускаються як окремі install-smoke shards
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
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує `.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`, phase timings, scheduler plan JSON і rerun commands. Для сфокусованого відновлення використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість повторного запуску всіх release chunks. Згенеровані rerun commands включають попередні `package_artifact_run_id` і prepared Docker image inputs, коли вони доступні, тому failed lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic behavior і channel-level release gate, окремий від Vitest і Docker package mechanics.

Покриття release QA Lab включає:

- mock parity gate, що порівнює OpenAI candidate lane з Opus 4.6 baseline за допомогою agentic parity pack
- fast live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного local proof

Використовуйте цей box, щоб відповісти: «чи реліз поводиться правильно у QA scenarios і live channel flows?» Зберігайте artifact URLs для parity, Matrix і Telegram lanes під час схвалення релізу. Full Matrix coverage залишається доступним як manual sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Він підтримується `Package Acceptance` і resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє package inventory, записує package version і SHA-256, а також тримає workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або exact OpenClaw release
  version
- `source=ref`: пакує trusted `package_ref` branch, tag або full commit SHA
  із вибраним harness `workflow_ref`
- `source=url`: завантажує HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=plugins-offline plugin-update` і `telegram_mode=mock-openai`. Release-path Docker chunks покривають overlapping install, update і plugin-update lanes; Package Acceptance тримає offline plugin fixtures, plugin update і Telegram package QA на тому самому resolved tarball. Це GitHub-native заміна для більшості package/update coverage, яке раніше вимагало Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding, installer і platform behavior, але package/update product validation має віддавати перевагу Package Acceptance.

Legacy package-acceptance leniency навмисно обмежена в часі. Packages до `2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих у npm: private QA inventory entries, відсутні в tarball, відсутній `gateway install --wrapper`, відсутні patch files у tarball-derived git fixture, відсутній persisted `update.channel`, legacy plugin install-record locations, відсутня marketplace install-record persistence і config metadata migration під час `plugins update`. Опублікований package `2026.4.26` може попереджати про local build metadata stamp files, які вже були поставлені. Пізніші packages мають відповідати modern package contracts; ті самі gaps провалюють release validation.

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

- `smoke`: quick package install/channel/agent, gateway network і config
  reload lanes
- `package`: install/update/plugin package contracts без live ClawHub; це release-check
  default
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для focused reruns

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або `telegram_mode=live-frontier` у Package Acceptance. Workflow передає resolved tarball `package-under-test` у Telegram lane; standalone Telegram workflow усе ще приймає published npm spec для post-publish checks.

## Вхідні дані NPM workflow

`OpenClaw NPM Release` приймає ці operator-controlled inputs:

- `tag`: обов’язковий release tag, такий як `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  full 40-character workflow-branch commit SHA для validation-only preflight
- `preflight_only`: `true` для validation/build/package only, `false` для
  real publish path
- `preflight_run_id`: обов’язковий на real publish path, щоб workflow повторно використовував
  prepared tarball з successful preflight run
- `npm_dist_tag`: npm target tag для publish path; типово `beta`

`OpenClaw Release Checks` приймає ці operator-controlled inputs:

- `ref`: branch, tag або full commit SHA для перевірки. Secret-bearing checks
  вимагають, щоб resolved commit був reachable з OpenClaw branch або
  release tag.

Правила:

- Stable і correction tags можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` full commit SHA input дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  validation-only
- Real publish path має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням publish

## Послідовність stable npm release

Коли готуєте stable npm release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тегу можна використати поточний повний SHA коміту гілки робочого процесу
     для пробного запуску робочого процесу попередньої перевірки лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку, де спочатку йде beta, або `latest` лише
   коли ви навмисно хочете прямої стабільної публікації
3. Запустіть `Full Release Validation` на релізній гілці, релізному тегу або повному
   SHA коміту, коли потрібні звичайний CI разом із live-кешем промптів, Docker, QA Lab,
   Matrix і покриттям Telegram з одного ручного робочого процесу
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний робочий процес `CI` на релізному ref
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   робочий процес, щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо в `latest`, а `beta`
   має негайно слідувати за тією самою стабільною збіркою, використайте той самий приватний
   робочий процес, щоб спрямувати обидва dist-теги на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Зміна dist-тегу живе в приватному репозиторії з міркувань безпеки, тому що для неї досі
потрібен `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає прямий шлях публікації й шлях просування, де спочатку йде beta, одночасно
задокументованими та видимими для оператора.

Якщо супровіднику доводиться повернутися до локальної автентифікації npm, виконуйте будь-які команди 1Password
CLI (`op`) лише всередині виділеної сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить промпти,
сповіщення й обробку OTP спостережуваними та запобігає повторним сповіщенням хоста.

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
як фактичний runbook.

## Пов’язане

- [Релізні канали](/uk/install/development-channels)
