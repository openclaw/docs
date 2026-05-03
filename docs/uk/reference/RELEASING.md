---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймального тестування пакета
    - Шукаєте іменування версій і періодичність випусків
summary: Релізні лінії, контрольний список оператора, валідаційні бокси, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-03T11:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: edfd7d6a17da68c76d7196856702c59d1e3c2749907f591fe18b4f9df2eb097d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest` за явним запитом
- beta: передвипускні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-передвипуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця чи дня
- `latest` означає поточний просунутий стабільний випуск npm
- `beta` означає поточну ціль встановлення beta
- Стабільні та стабільні коригувальні випуски типово публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний випуск OpenClaw постачається разом із пакетом npm і застосунком macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку mac залишають для стабільних випусків, якщо це явно не запитано

## Ритм випусків

- Випуски рухаються спочатку через beta
- Stable виходить лише після перевірки останньої beta
- Maintainers зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано і він потребує виправлення, maintainers створюють
  наступний тег `-beta.N` замість видалення чи повторного створення старого beta-тега
- Докладна процедура випуску, погодження, облікові дані та нотатки щодо відновлення
  доступні лише maintainers

## Контрольний список оператора випуску

Цей контрольний список описує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкату залишаються в
runbook випуску, доступному лише maintainers.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте їх, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Підвищте версію в кожному потрібному місці для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб пакети Plugin, придатні до публікації, мали спільну версію випуску
   та метадані сумісності, потім запустіть локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   повний 40-символьний SHA гілки випуску дозволений для preflight лише для перевірки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте в гілці випуску та повторно запустіть найменший файл,
   канал, завдання workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спочатку публікує всі придатні до публікації пакети Plugin у npm, потім публікує той самий
   набір у ClawHub, а після цього просуває підготовлений preflight-артефакт npm OpenClaw
   з відповідним dist-tag. Після публікації запустіть package
   acceptance після публікації для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований передвипуск потребує виправлення,
   створіть наступний відповідний номер передвипуску; не видаляйте й не переписуйте старий
   передвипуск.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази перевірки. Публікація stable в npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний preflight-артефакт через
    `preflight_run_id`; готовність стабільного випуску macOS також потребує
    запакованих `.zip`, `.dmg`, `.dSYM.zip` та оновленого `appcast.xml` у `main`.
11. Після публікації запустіть verifier npm після публікації, необов’язковий автономний
    E2E Telegram для опублікованого npm, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Preflight випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та меж архітектури були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і bundle Control UI існували для етапу
  перевірки пакування
- Запустіть `pnpm plugins:sync` після підняття версії в корені та перед тегуванням. Він
  оновлює версії публіковних пакетів plugin, метадані сумісності peer/API
  OpenClaw, метадані збірки та заготовки changelog plugin, щоб вони відповідали версії
  релізу core. `pnpm plugins:sync:check` — це немутуючий релізний запобіжник;
  workflow публікації завершується помилкою до будь-якої мутації registry, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні test boxes з однієї точки входу. Він приймає branch,
  tag або повний SHA commit, dispatch ручний `CI` і dispatch
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suite, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` із release
  checks. Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E має також підтвердити опублікований npm package. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має запускати свою матрицю package/update проти відвантаженого npm package замість
  артефакту, зібраного за SHA. Надайте
  `evidence_package_spec`, коли приватний evidence report має підтвердити, що
  валідація відповідає опублікованому npm package, без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне side-channel підтвердження
  для кандидата package, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб спакувати довірений branch/tag/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим run GitHub
  Actions. Workflow resolves кандидата в
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes включають `published-upgrade-survivor`, артефакт package є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes install/channel/agent, gateway network і config reload
  - `package`: artifact-native lanes package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: chunks Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого rerun
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для релізного кандидата. Ручні CI dispatches обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної telemetry. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані імена trace
  span, обмежені attributes і редагування content/identifier без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним tagged release
- Запустіть `OpenClaw Release Publish` для мутуючої послідовності публікації після того, як
  tag існує. Dispatch його з `release/YYYY.M.D` (або `main`, коли публікується
  tag, reachable з main), передайте release tag і успішний OpenClaw npm
  `preflight_run_id`, і залиште стандартну область публікації plugin
  `all-publishable`, якщо ви не виконуєте навмисно сфокусований repair. Цей
  workflow серіалізує plugin npm publish, plugin ClawHub publish і OpenClaw
  npm publish, щоб core package не було опубліковано раніше за його externalized
  plugins.
- Release checks тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity lane плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують environment `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media і E2EE inventory паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` напряму
- Цей поділ навмисний: зберігайте реальний шлях npm release коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у своєму
  окремому lane, щоб вони не затримували й не блокували publish
- Release checks із secrets слід dispatch через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає branch, tag або повний commit SHA, доки
  resolved commit reachable з OpenClaw branch або release tag
- validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA commit workflow-branch без потреби в pushed tag
- Цей шлях SHA призначений лише для validation і не може бути promoted у реальний publish
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки package metadata; реальний publish усе ще потребує справжнього release tag
- Обидва workflows тримають реальний шлях publish і promotion на GitHub-hosted
  runners, тоді як немутуючий validation path може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити опублікований шлях registry
  install у свіжому temp prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити installed-package onboarding, Telegram setup і реальний Telegram E2E
  проти опублікованого npm package з використанням спільного leased Telegram credential
  pool. Локальні одноразові запуски maintainer можуть omit Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно manual-only і
  не запускається на кожен merge.
- Автоматизація release для maintainer тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути dispatched з тієї самої branch `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases стандартно використовують `beta`
  - stable npm publish може явно target `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає OIDC-only publish
  - public `macOS Release` є validation-only; коли tag існує лише на
    release branch, але workflow dispatched з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths promote підготовлені артефакти замість повторної
    збірки
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight fails closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожній browser dashboard
- Post-publish verification також перевіряє, що опубліковані plugin entrypoints і
  package metadata присутні в установленому registry layout. Реліз, який
  відвантажує відсутні plugin runtime payloads, fails postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також забезпечує budget npm pack `unpackedSize` для
  candidate update tarball, тож installer e2e ловить випадкове pack bloat
  до release publish path
- Якщо release work торкалася CI planning, extension timing manifests або
  extension test matrices, згенеруйте повторно й перегляньте planner-owned
  outputs matrix `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має зрештою містити спаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - спакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї release version

## Release test boxes

`Full Release Validation` — це спосіб, яким operators запускають усі pre-release tests з
однієї точки входу. Для pinned commit proof на швидкозмінній branch використовуйте
helper, щоб кожен child workflow запускався з тимчасової branch, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper pushes `release-ci/<sha>-...`, dispatches `Full Release Validation`
з цієї branch з `ref=<sha>`, перевіряє, що кожен child workflow `headSha`
відповідає target, а потім видаляє тимчасову branch. Це запобігає випадковому підтвердженню
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

Робочий процес розв’язує цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, орієнтованих
на пакети, і запускає окремий пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгалужується на install smoke, кросплатформні релізні перевірки, live/E2E Docker
покриття релізного шляху, Package Acceptance з пакетним Telegram QA, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальний
підсумок верифікатора містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб release
manager міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна релізна валідація](/uk/reference/full-release-validation) для
повної матриці етапів, точних назв завдань workflow, відмінностей між stable і full
профілями, артефактів і точкових механізмів повторного запуску.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу релізну гілку або тег. Окремого входу Full Release Validation
workflow-ref немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомій `main`;
сирі SHA комітів не можуть бути refs для workflow dispatch, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker шлях
- `stable`: minimum плюс stable provider/backend покриття для затвердження релізу
- `full`: stable плюс широке advisory provider/media покриття

`OpenClaw Release Checks` використовує довірений ref workflow, щоб один раз розв’язати цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт як у
release-path Docker перевірках, так і в Package Acceptance. Це тримає всі
package-facing бокси на тих самих байтах і уникає повторних збірок пакета.
Кросплатформний OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org змінну, інакше `openai/gpt-5.4`, бо ця lane
доводить встановлення пакета, onboarding, запуск Gateway і один live agent turn,
а не бенчмаркує найповільнішу модель за замовчуванням. Ширша live provider
matrix лишається місцем для model-specific покриття.

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

Не використовуйте повну umbrella як перший повторний запуск після точкового виправлення. Якщо один box
падає, використовуйте невдалий дочірній workflow, job, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повну umbrella знову лише тоді,
коли виправлення змінило спільну релізну оркестрацію або зробило попередні all-box докази
застарілими. Фінальний верифікатор umbrella повторно перевіряє записані child workflow run
ids, тому після успішного повторного запуску дочірнього workflow перезапускайте лише невдалий
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до umbrella. `all` — це справжній
запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only дочірній Plugin, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Точкові повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all запуски
з `release_profile=full` використовують пакетний артефакт release-checks.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Ручний CI навмисно
обходить changed scoping і примусово запускає звичайний тестовий граф для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: «чи пройшло дерево source повний звичайний test suite?»
Це не те саме, що release-path продуктова валідація. Докази, які треба зберегти:

- підсумок `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному target SHA
- назви невдалих або повільних shards із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не потрібні Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він валідовує release candidate через упаковані
Docker середовища, а не лише source-level тести.

Release Docker покриття включає:

- повний install smoke з увімкненим повільним Bun global install smoke
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
- OpenWebUI покриття всередині chunk `plugins-runtime-services`, коли запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` through
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker артефакти перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для точкового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані rerun commands включають попередній
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступні, щоб
невдала lane могла повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це агентний
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Release QA Lab покриття включає:

- mock parity lane, що порівнює OpenAI candidate lane з Opus 4.6
  baseline за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного local proof

Використовуйте цей box, щоб відповісти: «чи реліз поводиться коректно в QA scenarios і
live channel flows?» Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час затвердження релізу. Повне Matrix покриття лишається доступним як
ручний sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Його підтримують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідовує
package inventory, записує package version і SHA-256 та тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: пакує довірену гілку `package_ref`, тег або повний commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажує HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA проти того самого розв’язаного tarball. Upgrade matrix покриває кожен stable npm-published baseline від `2026.4.23` до `latest`; використовуйте
Package Acceptance з `source=npm` для вже shipped candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
публікацією. Це GitHub-native
заміна для більшості package/update покриття, яке раніше вимагало
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування оновлень і Plugin](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Вичерпна published update migration з кожного stable пакета `2026.4.23+` — це
окремий ручний workflow `Update Migration`, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих
у npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші пакети
мають задовольняти сучасні package contracts; ті самі gaps провалюють release
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

- `smoke`: швидкі лінії встановлення пакета/каналу/агента, мережі Gateway та
  перезавантаження конфігурації
- `package`: контракти встановлення/оновлення/пакета Plugin без живого ClawHub; це типове значення
  release-check
- `product`: `package` плюс канали MCP, очищення cron/субагентів, вебпошук OpenAI
  та OpenWebUI
- `full`: фрагменти шляху Docker-релізу з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для підтвердження Telegram кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Робочий процес передає
розв’язаний tarball `package-under-test` у лінію Telegram; окремий робочий процес
Telegram все ще приймає опубліковану npm-специфікацію для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною змінною точкою входу для публікації. Він
оркеструє робочі процеси trusted-publisher у порядку, потрібному для релізу:

1. Витягнути тег релізу та визначити його SHA коміту.
2. Перевірити, що тег досяжний з `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тією самою областю та SHA.
6. Запустити `OpenClaw NPM Release` з тегом релізу, npm dist-tag і
   збереженим `preflight_run_id`.

Приклад публікації бета-версії:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільна публікація до типового бета-dist-tag:

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

Використовуйте нижчорівневі робочі процеси `Plugin NPM Release` і `Plugin ClawHub Release`
лише для сфокусованого виправлення або повторної публікації. Для виправлення вибраного plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish`, або запускайте дочірній робочий процес безпосередньо, коли
пакет OpenClaw не має бути опублікований.

## Вхідні дані робочого процесу NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки робочого процесу для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакета, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий у справжньому шляху публікації, щоб робочий процес повторно використовував
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типово `beta`

`OpenClaw Release Publish` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег релізу; має вже існувати
- `preflight_run_id`: ідентифікатор успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm-тег для пакета OpenClaw
- `plugin_publish_scope`: типово `all-publishable`; використовуйте `selected` лише
  для сфокусованого виправлення
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типово `true`; встановлюйте `false` лише під час використання
  робочого процесу як оркестратора виправлення тільки для plugin

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки із секретами
  вимагають, щоб визначений коміт був досяжний з гілки OpenClaw або
  тегу релізу.

Правила:

- Стабільні теги та теги виправлень можуть публікуватися або до `beta`, або до `latest`
- Бета-теги попереднього релізу можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` вхідний повний SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  лише валідаційними
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  робочий процес перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До існування тегу можна використати поточний повний SHA коміту гілки робочого процесу
     для валідаційного dry run робочого процесу preflight
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви навмисно хочете пряме стабільне публікування
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   SHA коміту, коли потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного робочого процесу
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний робочий процес `CI` на ref релізу натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує externalized plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив до `beta`, використовуйте приватний робочий процес
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для просування цієї стабільної версії з `beta` до `latest`
8. Якщо реліз навмисно опублікований безпосередньо до `latest`, а `beta`
   має негайно наслідувати ту саму стабільну збірку, використовуйте той самий приватний
   робочий процес, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   self-healing синхронізації перемістити `beta` пізніше

Зміна dist-tag розміщена в приватному репозиторії з міркувань безпеки, тому що вона все ще
вимагає `NPM_TOKEN`, тоді як публічний репозиторій зберігає OIDC-only публікацію.

Це робить як шлях прямої публікації, так і шлях beta-first просування
задокументованими та видимими для оператора.

Якщо супровідник мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині виділеної tmux-сесії. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання цього всередині tmux робить підказки,
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

Супровідники використовують приватну документацію релізу в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
