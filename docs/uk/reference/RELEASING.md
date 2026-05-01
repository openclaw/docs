---
read_when:
    - Шукаємо визначення публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте іменування версій і періодичність випусків
summary: Канали випусків, контрольний список оператора, валідаційні бокси, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-01T20:49:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9897d7388f9110f291a62a908c95b58abe099be688d6a398c28dc368059e163f
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: позначені тегами випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: теги передрелізів, які публікуються в npm `beta`
- dev: рухома голова `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія корекційного стабільного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початковий нуль до місяця або дня
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну beta-ціль установлення
- Стабільні та корекційні стабільні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно націлити `latest` або просунути перевірену beta-збірку пізніше
- Кожен стабільний випуск OpenClaw постачає npm-пакет і застосунок macOS разом;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збірку/підпис/нотаризацію застосунку macOS залишають для stable, якщо це явно не запитано

## Частота випусків

- Випуски рухаються спочатку через beta
- Stable виходить лише після перевірки останньої beta
- Мейнтейнери зазвичай роблять випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було надіслано або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура випуску, затвердження, облікові дані та нотатки з відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора випуску

Цей контрольний список є публічною формою процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
runbook випуску лише для мейнтейнерів.

1. Почніть із поточного `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте його, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно залишено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу з випуску
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце версії для запланованого тега, потім запустіть
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   для validation-only preflight дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка завершується невдало, виправте в гілці випуску й повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, provider або allowlist моделей, що
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   post-publish package acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або кандидат на випуск має
    потрібні докази перевірки. Публікація stable npm повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність stable macOS-випуску
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий автономний
    published-npm Telegram E2E, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Release preflight

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки
  циклів імпорту та архітектурних меж були green поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і bundle Control UI існували для кроку
  валідації пакування
- Запустіть ручний workflow `Full Release Validation` перед затвердженням релізу, щоб
  запустити всі передрелізні test boxes з однієї точки входу. Він приймає branch,
  tag або повний commit SHA, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. Передавайте `npm_telegram_package_spec` лише після того, як пакет
  опубліковано і також має виконатися post-publish Telegram E2E. Передавайте
  `evidence_package_spec`, коли приватний evidence report має довести, що
  validation відповідає опублікованому npm package, без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне side-channel підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб спакувати довірений branch/tag/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим GitHub
  Actions run. Workflow resolve-ить кандидата в
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/channel/agent, мережі gateway і перезавантаження config
  - `package`: artifact-native package/update/plugin lanes без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  coverage для release candidate. Ручні CI dispatches обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації release telemetry. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і верифікує експортовані trace
  span names, обмежені attributes та редагування content/identifier без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним tagged release
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс швидкий
  live Matrix profile і Telegram QA lane перед затвердженням релізу. Live
  lanes використовують environment `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media і E2EE inventory паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримати справжній npm release path коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у своєму
  власному lane, щоб вони не затримували й не блокували publish
- Secret-bearing release checks слід dispatch-ити через `Full Release
Validation` або з workflow ref `main`/release, щоб workflow logic і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає branch, tag або повний commit SHA, якщо
  resolved commit reachable з OpenClaw branch або release tag
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний workflow-branch commit SHA без вимоги pushed tag
- Цей SHA path є validation-only і не може бути promoted у справжній publish
- У SHA mode workflow синтезує `v<package.json version>` лише для
  package metadata check; справжній publish усе ще потребує справжнього release tag
- Обидва workflows тримають справжній publish і promotion path на GitHub-hosted
  runners, тоді як немутувальний validation path може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед затвердженням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити published registry
  install path у свіжому temp prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити installed-package onboarding, Telegram setup і справжній Telegram E2E
  проти опублікованого npm package з використанням shared leased Telegram credential
  pool. Локальні одноразові maintainer запуски можуть опустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запустити ту саму post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно manual-only і
  не запускається при кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - справжній npm publish має пройти успішний npm `preflight_run_id`
  - справжній npm publish має бути dispatched з того самого branch `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases default to `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - token-based npm dist-tag mutation тепер міститься в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    для безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    public repo зберігає OIDC-only publish
  - public `macOS Release` є validation-only; коли tag існує лише на
    release branch, але workflow dispatched з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - справжній private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - справжні publish paths promote підготовлені артефакти замість повторного
    rebuilding
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight fails closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню browser dashboard
- Post-publish verification також перевіряє, що published plugin entrypoints і
  package metadata присутні в installed registry layout. Реліз, який
  відвантажує відсутні plugin runtime payloads, провалює postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також enforce-ить budget `unpackedSize` npm pack на
  candidate update tarball, тож installer e2e виявляє випадкове pack bloat
  до release publish path
- Якщо release work торкнулася CI planning, extension timing manifests або
  extension test matrices, regenerate і review planner-owned
  `plugin-prerelease-extension-shard` matrix outputs з
  `.github/workflows/plugin-prerelease.yml` перед затвердженням, щоб release notes не
  описували stale CI layout
- Stable macOS release readiness також включає updater surfaces:
  - GitHub release має зрештою містити packaged `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - packaged app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї release version

## Release test boxes

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні tests з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте release
branch, tag або повний commit SHA як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow resolve-ить target ref, dispatch-ить ручний `CI` з
`target_ref=<release-ref>`, dispatch-ить `OpenClaw Release Checks` і
опційно dispatch-ить standalone post-publish Telegram E2E, коли
`npm_telegram_package_spec` задано. Потім `OpenClaw Release Checks` fan out-ить
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний run прийнятний лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як successful, а будь-який optional
child `npm_telegram` або successful, або intentionally skipped. Final
verifier summary містить slowest-job tables для кожного child run, щоб release
manager міг бачити поточний critical path без завантаження logs.
Див. [Full release validation](/uk/reference/full-release-validation) для
повної stage matrix, точних workflow job names, відмінностей stable та full profile,
artifacts і focused rerun handles.
Child workflows dispatch-яться з trusted ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старіший release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте trusted harness, вибираючи workflow run ref.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс широке advisory provider/media coverage

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз визначити цільове посилання як `release-package-under-test`, і повторно використовує цей артефакт як у Docker-перевірках release-path, так і в Прийнятності пакета. Це утримує всі box-и, що працюють із пакетами, на тих самих байтах і уникає повторних збірок пакета. Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли задано змінну repo/org, інакше `openai/gpt-5.5`, тому що ця lane підтверджує встановлення пакета, onboarding, запуск gateway і один live agent turn, а не бенчмарк найповільнішої моделі за замовчуванням. Ширша матриця live provider лишається місцем для покриття, специфічного для моделей.

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

Не використовуйте повний umbrella як перший повторний запуск після цільового виправлення. Якщо один box падає, використовуйте невдалий дочірній workflow, job, Docker lane, профіль пакета, провайдера моделі або QA lane для наступного підтвердження. Запускайте повний umbrella знову лише тоді, коли виправлення змінило спільну release orchestration або зробило попередні докази з усіх box-ів застарілими. Фінальний verifier umbrella повторно перевіряє записані ідентифікатори запусків дочірніх workflow, тому після успішного повторного запуску дочірнього workflow перезапускайте лише невдалий батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до umbrella. `all` — це справжній запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease` запускає лише release-only дочірній plugin, `release-checks` запускає кожен release box, а вужчі release-групи — це `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`, коли надано автономну package Telegram lane.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Ручний CI навмисно обходить changed scoping і примусово запускає звичайний граф тестів для release candidate: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти на запитання «чи пройшло дерево вихідного коду повний звичайний набір тестів?» Це не те саме, що release-path product validation. Докази, які слід зберігати:

- summary `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shard-ів із CI jobs під час розслідування регресій
- артефакти таймінгу Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але не потрібні Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через `openclaw-live-and-e2e-checks-reusable.yml`, а також у release-mode workflow `install-smoke`. Він перевіряє release candidate через упаковані Docker-середовища, а не лише через тести рівня вихідного коду.

Покриття release Docker включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, із QR, root/gateway та installer/Bun smoke jobs, що запускаються як окремі install-smoke shards
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли це запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker-артефакти перед повторним запуском. Release-path scheduler завантажує `.artifacts/docker-tests/` із lane logs, `summary.json`, `failures.json`, phase timings, scheduler plan JSON і командами повторного запуску. Для цільового відновлення використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередній `package_artifact_run_id` і prepared Docker image inputs, коли вони доступні, тож невдала lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic behavior і channel-level release gate, окремий від Vitest і Docker package mechanics.

Покриття release QA Lab включає:

- mock parity gate, що порівнює OpenAI candidate lane з базовою лінією Opus 4.6 за допомогою agentic parity pack
- fast live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей box, щоб відповісти на запитання «чи реліз поводиться правильно у QA scenarios і live channel flows?» Зберігайте URL артефактів для parity, Matrix і Telegram lanes під час схвалення релізу. Повне Matrix coverage лишається доступним як ручний sharded QA-Lab run, а не як default release-critical lane.

### Пакет

Package box — це gate для installable-product. Він спирається на `Package Acceptance` і resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє package inventory, записує версію пакета й SHA-256 та тримає workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: запакувати довірену гілку `package_ref`, tag або full commit SHA з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Прийнятність пакета з `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=plugins-offline plugin-update` і `telegram_mode=mock-openai`. Release-path Docker chunks покривають перетин install, update і plugin-update lanes; Прийнятність пакета зберігає offline plugin fixtures, plugin update і Telegram package QA проти того самого resolved tarball. Це GitHub-native заміна більшої частини package/update coverage, яке раніше потребувало Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding, installer і platform behavior, але package/update product validation має віддавати перевагу Прийнятності пакета.

Поблажливість legacy package-acceptance навмисно обмежена в часі. Пакети до `2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих у npm: приватні QA inventory entries, відсутні в tarball, відсутній `gateway install --wrapper`, відсутні patch files у tarball-derived git fixture, відсутній persisted `update.channel`, legacy plugin install-record locations, відсутнє marketplace install-record persistence і config metadata migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати про local build metadata stamp files, які вже були shipped. Пізніші пакети мають задовольняти сучасні package contracts; ті самі прогалини провалюють release validation.

Використовуйте ширші профілі Прийнятності пакета, коли release question стосується фактичного installable package:

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
- `package`: install/update/plugin package contracts без live ClawHub; це default для release-check
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або `telegram_mode=live-frontier` у Прийнятності пакета. Workflow передає resolved tarball `package-under-test` у Telegram lane; автономний Telegram workflow усе ще приймає published npm spec для post-publish checks.

## Вхідні параметри NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний workflow-branch commit SHA для validation-only preflight
- `preflight_only`: `true` для лише validation/build/package, `false` для
  справжнього publish path
- `preflight_run_id`: обов’язковий у справжньому publish path, щоб workflow повторно використав prepared tarball з успішного preflight run
- `npm_dist_tag`: npm target tag для publish path; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, tag або full commit SHA для перевірки. Перевірки із секретами вимагають, щоб resolved commit був досяжний із гілки OpenClaw або release tag.

Правила:

- Stable і correction tags можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` full commit SHA input дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди лише validation-only
- Справжній publish path має використовувати той самий `npm_dist_tag`, що використовувався під час preflight; workflow перевіряє ці metadata перед продовженням publish

## Послідовність stable npm release

Під час створення stable npm release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До створення тега можна використати поточний повний SHA коміту гілки
     workflow для сухого запуску перевірки лише preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спершу beta або `latest` лише
   тоді, коли ви навмисно хочете пряме стабільне публікування
3. Запустіть `Full Release Validation` на гілці релізу, тезі релізу або повному
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker,
   QA Lab, Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість
   запустіть ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` ще раз із `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо в `latest`, а `beta`
   має негайно наслідувати той самий стабільний білд, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag розміщена в приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікування лише через OIDC.

Це зберігає як шлях прямого публікування, так і шлях просування спершу через beta
задокументованими та видимими для оператора.

Якщо мейнтейнер мусить повернутися до локальної автентифікації npm, запускайте будь-які
команди CLI 1Password (`op`) лише всередині окремого сеансу tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить підказки,
сповіщення та обробку OTP спостережуваними й запобігає повторним сповіщенням хоста.

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

Мейнтейнери використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
