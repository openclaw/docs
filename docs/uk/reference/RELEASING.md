---
read_when:
    - Шукаємо визначення публічних каналів випуску
    - Запуск валідації релізу або приймання пакета
    - Шукаємо правила іменування версій і періодичність випусків
summary: Канали релізів, контрольний список оператора, валідаційні середовища, іменування версій і періодичність
title: Політика релізів
x-i18n:
    generated_at: "2026-05-02T20:01:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має чотири публічні канали випусків:

- stable: позначені тегами випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- alpha: теги попередніх випусків, які публікуються в npm `alpha`
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального стабільного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія попереднього alpha-випуску: `YYYY.M.D-alpha.N`
  - Git-тег: `vYYYY.M.D-alpha.N`
- Версія попереднього beta-випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний випуск npm
- `alpha` означає поточну ціль встановлення alpha
- `beta` означає поточну ціль встановлення beta
- Стабільні та коригувальні стабільні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно вибрати `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку Mac залишають для стабільного випуску, якщо це не запитано явно

## Періодичність випусків

- Випуски рухаються спочатку через beta
- Стабільний випуск іде лише після перевірки останньої beta
- Мейнтейнери зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура випуску, затвердження, облікові дані та нотатки щодо відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора випуску

Цей контрольний список є публічною формою процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
інструкції з випуску, доступній лише мейнтейнерам.

1. Почніть із поточної `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте його, надішліть його та виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно залишено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу з випуску
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб придатні до публікації пакети Plugin мали спільну версію випуску
   й метадані сумісності, потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   повний 40-символьний SHA гілки випуску дозволено для попередньої перевірки лише з метою
   валідації. Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести за допомогою `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте в гілці випуску й повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або allowlist моделей, який
   доводить виправлення. Повторно запускайте повну обгортку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для alpha або beta позначте тегом `vYYYY.M.D-alpha.N` або `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спочатку публікує всі придатні до публікації пакети Plugin в npm, другим кроком публікує той самий
   набір у ClawHub, а потім просуває підготовлений артефакт попередньої перевірки OpenClaw npm
   з відповідним dist-tag. Після публікації запустіть післяпублікаційне приймання пакета
   для опублікованого пакета `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` або `openclaw@beta`. Якщо надісланий або
   опублікований попередній випуск потребує виправлення, створіть наступний відповідний номер попереднього випуску;
   не видаляйте й не переписуйте старий попередній випуск.
10. Для stable продовжуйте лише після того, як перевірена beta або реліз-кандидат матиме
    потрібні докази перевірки. Публікація стабільного npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність стабільного випуску macOS також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть післяпублікаційний перевірник npm, необов’язковий окремий
    E2E Telegram для опублікованого npm, коли потрібен післяпублікаційний доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед release preflight, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед release preflight, щоб ширші перевірки циклів
  імпорту та архітектурних меж були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  release-артефакти `dist/*` і bundle Control UI існували для кроку
  перевірки пакування
- Запустіть `pnpm plugins:sync` після підняття root-версії та перед тегуванням. Він
  оновлює версії publishable пакетів Plugin, metadata сумісності peer/API
  OpenClaw, build metadata і заглушки changelog Plugin, щоб вони відповідали core
  release version. `pnpm plugins:sync:check` є немутуючим release guard;
  publish workflow завершується помилкою перед будь-якою мутацією registry, якщо цей крок
  забули.
- Запустіть ручний workflow `Full Release Validation` перед release approval, щоб
  запустити всі pre-release test boxes з одного entrypoint. Він приймає branch,
  tag або повний commit SHA, dispatch-ить ручний `CI` і dispatch-ить
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` з release
  checks. Надайте `npm_telegram_package_spec` після publishing, коли той самий
  Telegram E2E має також довести опублікований npm package. Надайте
  `package_acceptance_package_spec` після publishing, коли Package Acceptance
  має запускати свою package/update matrix проти shipped npm package замість
  SHA-built artifact. Надайте
  `evidence_package_spec`, коли приватний evidence report має довести, що
  validation відповідає published npm package, не примушуючи Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен side-channel proof
  для package candidate, поки release work триває. Використовуйте `source=npm` для
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` або точної release version; `source=ref`
  щоб запакувати довірену `package_ref` branch/tag/SHA з поточним
  `workflow_ref` harness; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим GitHub
  Actions run. Workflow resolved candidate до
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, package
  artifact є candidate, а `published_upgrade_survivor_baseline` вибирає
  published baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені profiles:
  - `smoke`: lanes install/channel/agent, gateway network і config reload
  - `package`: package/update/plugin lanes, нативні для artifact, без OpenWebUI або live ClawHub
  - `product`: package profile плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для focused rerun
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  coverage для release candidate. Ручні CI dispatches bypass-ять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час validation release telemetry. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані trace
  span names, bounded attributes і redaction content/identifier без
  потреби в Opik, Langfuse або іншому external collector.
- Запускайте `pnpm release:check` перед кожним tagged release
- Запустіть `OpenClaw Release Publish` для мутуючої publish sequence після того, як
  tag існує. Dispatch-те його з `release/YYYY.M.D` (або `main`, коли publishing
  main-reachable tag), передайте release tag і successful OpenClaw npm
  `preflight_run_id`, і залишайте default Plugin publish scope
  `all-publishable`, якщо ви навмисно не запускаєте focused repair. Workflow
  серіалізує Plugin npm publish, Plugin ClawHub publish і OpenClaw
  npm publish, щоб core package не було опубліковано перед його externalized
  plugins.
- Release checks тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity lane плюс швидкий
  live Matrix profile і Telegram QA lane перед release approval. Live
  lanes використовують environment `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media та E2EE inventory паралельно.
- Cross-OS install і upgrade runtime validation є частиною public
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` напряму
- Цей поділ навмисний: тримайте реальний npm release path коротким,
  deterministic і artifact-focused, тоді як повільніші live checks залишаються у своїй
  власній lane, щоб вони не затримували або не блокували publish
- Release checks із secret слід dispatch-ити через `Full Release
Validation` або з workflow ref `main`/release, щоб workflow logic і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає branch, tag або повний commit SHA, доки
  resolved commit reachable з OpenClaw branch або release tag
- validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний workflow-branch commit SHA без вимоги pushed tag
- Цей SHA path є лише validation-only і не може бути promoted у реальний publish
- У SHA mode workflow синтезує `v<package.json version>` лише для
  перевірки package metadata; реальний publish усе ще потребує реального release tag
- Обидва workflows тримають реальний publish і promotion path на GitHub-hosted
  runners, тоді як немутуючий validation path може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед approval
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити published registry
  install path у свіжому temp prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити installed-package onboarding, Telegram setup і реальний Telegram E2E
  проти published npm package із використанням shared leased Telegram credential
  pool. Локальні одноразові maintainer-запуски можуть omit-ити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати той самий post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно manual-only і
  не запускається на кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - реальний npm publish має пройти successful npm `preflight_run_id`
  - реальний npm publish має бути dispatched з тієї самої branch `main` або
    `release/YYYY.M.D`, що й successful preflight run
  - stable npm releases за замовчуванням використовують `beta`
  - stable npm publish може target-ити `latest` явно через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    для безпеки, тому що `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    public repo зберігає OIDC-only publish
  - public `macOS Release` є validation-only; коли tag існує лише на
    release branch, але workflow dispatched з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти successful private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths promote-ять prepared artifacts замість повторного
    rebuild
- Для stable correction releases на кшталт `YYYY.M.D-N`, post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити older global installs на
  base stable payload
- npm release preflight fails closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не shipped порожній browser dashboard
- Post-publish verification також перевіряє, що published Plugin entrypoints і
  package metadata присутні в installed registry layout. Release, який
  ships missing Plugin runtime payloads, провалює postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє npm pack `unpackedSize` budget на
  candidate update tarball, тому installer e2e ловить accidental pack bloat
  перед release publish path
- Якщо release work зачепила CI planning, extension timing manifests або
  extension test matrices, regenerate і review planner-owned
  `plugin-prerelease-extension-shard` matrix outputs з
  `.github/workflows/plugin-prerelease.yml` перед approval, щоб release notes не
  описували stale CI layout
- Stable macOS release readiness також включає updater surfaces:
  - GitHub release має врешті містити packaged `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - packaged app має зберігати non-debug bundle id, non-empty Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї release version

## Release test boxes

`Full Release Validation` — це спосіб, яким operators запускають усі pre-release tests з
одного entrypoint. Для pinned commit proof на швидко змінюваній branch використовуйте
helper, щоб кожен child workflow запускався з тимчасової branch, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper pushes `release-ci/<sha>-...`, dispatch-ить `Full Release Validation`
з цієї branch з `ref=<sha>`, перевіряє, що кожен child workflow `headSha`
відповідає target, а потім видаляє тимчасову branch. Це запобігає випадковому доведенню
новішого child run `main`.

Для validation release branch або tag запустіть його з trusted workflow
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

Робочий процес визначає цільовий ref, запускає вручну `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
окремий пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгалужується на install smoke, кросплатформні перевірки релізу, live/E2E Docker
покриття release-path, Package Acceptance з QA пакета Telegram, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальне
зведення verifier містить таблиці найповільніших jobs для кожного дочірнього запуску,
щоб менеджер релізу міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна перевірка релізу](/uk/reference/full-release-validation), щоб переглянути
повну матрицю етапів, точні назви workflow jobs, відмінності між профілями stable і full,
артефакти та handles для сфокусованого повторного запуску.
Дочірні workflows запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` указує на
старішу release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для exact commit proof на рухомому `main`;
сирі commit SHA не можуть бути refs для workflow dispatch, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову branch.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для затвердження релізу
- `full`: stable плюс широке advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей artifact як у
release-path Docker checks, так і в Package Acceptance. Це тримає всі
package-facing boxes на тих самих байтах і уникає повторних package builds.
Кросплатформний OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org variable, інакше `openai/gpt-5.4`, бо цей lane
перевіряє package install, onboarding, запуск gateway і один live agent turn,
а не вимірює продуктивність найповільнішої default model. Ширша live provider
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
падає, використовуйте failed child workflow, job, Docker lane, package profile, model
provider або QA lane для наступного proof. Запускайте повну umbrella знову лише тоді,
коли виправлення змінило спільну release orchestration або зробило попередній all-box evidence
застарілим. Фінальний verifier umbrella повторно перевіряє записані child workflow run
ids, тому після успішного повторного запуску child workflow повторно запускайте лише failed
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` в umbrella. `all` — це справжній
release-candidate run, `ci` запускає лише normal CI child, `plugin-prerelease`
запускає лише release-only plugin child, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані `npm-telegram` reruns потребують `npm_telegram_package_spec`; full/all runs
з `release_profile=full` використовують package artifact з release-checks.

### Vitest

Vitest box — це дочірній workflow ручного `CI`. Ручний CI навмисно
оминає changed scoping і примусово запускає звичайний test graph для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти на питання: «чи пройшло source tree повний звичайний test suite?»
Це не те саме, що release-path product validation. Evidence, який варто зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному target SHA
- назви failed або slow shards з CI jobs під час розслідування regressions
- Vitest timing artifacts, як-от `.artifacts/vitest-shard-timings.json`, коли
  run потребує performance analysis

Запускайте ручний CI напряму лише тоді, коли релізу потрібен deterministic normal CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він перевіряє release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

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
- OpenWebUI coverage всередині chunk `plugins-runtime-services`, коли запитано
- розділені bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані rerun commands містять попередні
`package_artifact_run_id` і prepared Docker image inputs, коли доступні, щоб
failed lane міг повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це агентний
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity lane, що порівнює OpenAI candidate lane з Opus 4.6
  baseline за допомогою agentic parity pack
- fast live Matrix QA profile, що використовує середовище `qa-live-shared`
- live Telegram QA lane, що використовує Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує explicit local proof

Використовуйте цей box, щоб відповісти на питання: «чи поводиться реліз коректно в QA scenarios і
live channel flows?» Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час затвердження релізу. Full Matrix coverage залишається доступним як
ручний sharded QA-Lab run, а не як default release-critical lane.

### Package

Package box — це installable-product gate. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
package inventory, записує package version і SHA-256 та тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: пакує довірену `package_ref` branch, tag або повний commit SHA
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
package QA проти того самого resolved tarball. Upgrade matrix покриває кожен stable npm-published baseline від `2026.4.23` до `latest`; використовуйте
Package Acceptance з `source=npm` для вже shipped candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
publish. Це GitHub-native
заміна для більшості package/update coverage, що раніше вимагала
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
віддавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, який local, Docker, Package Acceptance або release-check lane підтверджує
plugin install/update, doctor cleanup або published-package migration change.
Exhaustive published update migration з кожного stable package `2026.4.23+` —
це окремий ручний workflow `Update Migration`, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Packages до
`2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих
у npm: private QA inventory entries, яких бракує в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований package `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші packages
мають відповідати сучасним package contracts; ті самі gaps провалюють release
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

- `smoke`: швидкі package install/channel/agent, gateway network і config
  reload lanes
- `package`: install/update/plugin package contracts без live ClawHub; це release-check
  default
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих reruns

Для доказу Telegram кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у lane Telegram; окремий workflow
Telegram досі приймає опубліковану специфікацію npm для перевірок після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною змінювальною точкою входу для публікації. Він
оркеструє workflow довіреного видавця в порядку, потрібному для релізу:

1. Виконати checkout тега релізу та визначити його SHA коміту.
2. Перевірити, що тег досяжний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тим самим scope і SHA.
6. Запустити `OpenClaw NPM Release` з тегом релізу, dist-tag npm і
   збереженим `preflight_run_id`.

Приклад публікації beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Приклад публікації alpha:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

Стабільна публікація в типовий dist-tag beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Пряме просування стабільної версії до `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте нижчерівневі workflow `Plugin NPM Release` і `Plugin ClawHub Release`
лише для цільового виправлення або повторної публікації. Для вибраного виправлення Plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish` або запустіть дочірній workflow напряму, коли пакет
OpenClaw не має публікуватися.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег релізу, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-alpha.1` чи `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакування, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий на справжньому шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий тег npm для шляху публікації; типово `beta`

`OpenClaw Release Publish` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег релізу; має вже існувати
- `preflight_run_id`: id успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий тег npm для пакета OpenClaw
- `plugin_publish_scope`: типово `all-publishable`; використовуйте `selected` лише
  для цільової роботи з виправлення
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типово `true`; установлюйте `false` лише коли використовуєте
  workflow як оркестратор виправлення лише для Plugin

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки з секретами
  вимагають, щоб розв’язаний коміт був досяжний з гілки OpenClaw або
  тега релізу.

Правила:

- Стабільні та корекційні теги можуть публікуватися або до `beta`, або до `latest`
- Alpha-передрелізні теги можуть публікуватися лише до `alpha`
- Beta-передрелізні теги можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` вхідний повний SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  лише для валідації
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час створення стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега можна використати поточний повний SHA коміту гілки workflow
     для пробного запуску preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спочатку в beta або `latest` лише
   коли ви навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує зовнішні plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано напряму до `latest`, а `beta`
   має одразу вказувати на ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   self-healing синхронізації перемістити `beta` пізніше

Зміна dist-tag розміщена в приватному repo з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний repo зберігає публікацію лише через OIDC.

Це залишає і шлях прямої публікації, і шлях просування спочатку в beta
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині виділеної tmux-сесії. Не викликайте `op`
напряму з основного shell агента; утримання його всередині tmux робить prompts,
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

Maintainers використовують приватну документацію релізу в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
