---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте іменування версій і періодичність випусків
summary: Лінії релізів, контрольний список оператора, середовища валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-02T06:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- стабільний: теговані випуски, які типово публікуються до npm `beta` або до npm `latest` за явним запитом
- бета: передрелізні теги, які публікуються до npm `beta`
- розробницький: рухома вершина `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія корекційного стабільного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця або дня
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні й корекційні стабільні випуски типово публікуються до npm `beta`; оператори випуску можуть явно вибрати `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  бета-випуски зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку для Mac лишають для стабільного випуску, якщо немає явного запиту

## Періодичність випусків

- Випуски рухаються спершу через бета-канал
- Стабільний випуск з’являється лише після валідації останньої бета-версії
- Супровідники зазвичай готують випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб валідація випуску й виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже було відправлено або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого бета-тега
- Докладна процедура випуску, схвалення, облікові дані та нотатки щодо відновлення
  доступні лише супровідникам

## Контрольний список оператора випуску

Цей контрольний список описує публічну форму потоку випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
інструкції з випуску лише для супровідників.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт відправлено,
   і переконайтеся, що поточний CI для `main` достатньо зелений, щоб створювати від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувачів, закомітьте його, відправте й ще раз виконайте rebase/pull
   перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть усі потрібні місця з версіями для запланованого тегу, виконайте
   `pnpm plugins:sync`, щоб публіковні пакети Plugin мали спільну версію випуску
   й метадані сумісності, а потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тегу
   для валідаційної попередньої перевірки дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ випуску: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте в гілці випуску й повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або allowlist моделей, який
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії створіть тег `vYYYY.M.D-beta.N`, а потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спершу публікує всі публіковні пакети Plugin до npm, потім публікує той самий
   набір до ClawHub, а далі просуває підготовлений артефакт попередньої перевірки npm для OpenClaw
   з dist-tag `beta`. Після публікації запустіть post-publish приймання пакета
   для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або `openclaw@beta`.
   Якщо відправлена або опублікована бета-версія потребує виправлення, створіть наступний `-beta.N`;
   не видаляйте й не переписуйте стару бета-версію.
10. Для стабільного випуску продовжуйте лише після того, як перевірена бета-версія або release candidate має
    потрібні докази валідації. Публікація стабільної версії до npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність стабільного випуску для macOS також потребує
    запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, за потреби окремий
    опублікований-npm Telegram E2E, коли потрібен post-publish доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки
  циклів імпорту та архітектурних меж були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку
  валідації пакування
- Запустіть `pnpm plugins:sync` після bump версії в корені та перед тегуванням. Він
  оновлює версії пакетів publishable plugin, metadata сумісності OpenClaw peer/API,
  metadata збірки та заготовки changelog plugin, щоб вони відповідали core
  release version. `pnpm plugins:sync:check` є немутуючим release guard;
  publish workflow завершується помилкою до будь-якої зміни registry, якщо цей крок
  було забуто.
- Запустіть ручний workflow `Full Release Validation` перед release approval, щоб
  запустити всі передрелізні test boxes з однієї точки входу. Він приймає branch,
  tag або повний commit SHA, dispatches manual `CI` і dispatches
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` з release
  checks. Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E має також підтвердити опублікований npm package. Надайте
  `evidence_package_spec`, коли приватний evidence report має підтвердити, що
  валідація відповідає опублікованому npm package без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли вам потрібен side-channel proof
  для package candidate, поки release work триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної release version; `source=ref`,
  щоб запакувати trusted `package_ref` branch/tag/SHA з поточним
  `workflow_ref` harness; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, uploaded by another GitHub
  Actions run. Workflow resolves the candidate to
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  selected Docker lanes включають `published-upgrade-survivor`, package
  artifact є candidate, а `published_upgrade_survivor_baseline` вибирає
  published baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Типові profiles:
  - `smoke`: install/channel/agent, gateway network і config reload lanes
  - `package`: artifact-native package/update/plugin lanes без OpenWebUI або live ClawHub
  - `product`: package profile плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для focused rerun
- Запустіть ручний workflow `CI` напряму, коли вам потрібне лише повне нормальне CI
  coverage для release candidate. Manual CI dispatches bypass changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, Node 22 compatibility, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації release telemetry. Він запускає
  QA-lab через локальний OTLP/HTTP receiver і перевіряє exported trace
  span names, bounded attributes і редагування content/identifier без
  потреби в Opik, Langfuse чи іншому external collector.
- Запускайте `pnpm release:check` перед кожним tagged release
- Запустіть `OpenClaw Release Publish` для mutating publish sequence після того, як
  tag існує. Dispatch it from `release/YYYY.M.D` (або `main`, коли публікуєте
  main-reachable tag), передайте release tag і успішний OpenClaw npm
  `preflight_run_id`, і залиште default plugin publish scope
  `all-publishable`, якщо ви не запускаєте deliberate focused repair. Workflow
  serializes plugin npm publish, plugin ClawHub publish і OpenClaw
  npm publish, щоб core package не був опублікований перед своїми externalized
  plugins.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс fast
  live Matrix profile і Telegram QA lane перед release approval. Live
  lanes використовують environment `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли вам потрібен повний Matrix
  transport, media і E2EE inventory паралельно.
- Cross-OS install і upgrade runtime validation є частиною public
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей split навмисний: тримайте real npm release path коротким,
  deterministic і artifact-focused, тоді як повільніші live checks залишаються у своєму
  окремому lane, щоб вони не затримували і не блокували publish
- Secret-bearing release checks слід dispatch through `Full Release
Validation` або з `main`/release workflow ref, щоб workflow logic і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає branch, tag або full commit SHA, якщо
  resolved commit reachable from an OpenClaw branch або release tag
- `OpenClaw NPM Release` validation-only preflight також приймає поточний
  повний 40-character workflow-branch commit SHA без вимоги pushed tag
- Цей SHA path є validation-only і не може бути promoted into a real publish
- У SHA mode workflow synthesizes `v<package.json version>` лише для
  package metadata check; real publish усе ще вимагає real release tag
- Обидва workflows тримають real publish і promotion path на GitHub-hosted
  runners, тоді як non-mutating validation path може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає окремий release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед approval
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити published registry
  install path у fresh temp prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити installed-package onboarding, Telegram setup і real Telegram E2E
  проти published npm package за допомогою shared leased Telegram credential
  pool. Local maintainer one-offs можуть omit Convex vars і передавати три
  `OPENCLAW_QA_TELEGRAM_*` env credentials directly.
- Maintainers можуть запускати ту саму post-publish check з GitHub Actions через
  manual workflow `NPM Telegram Beta E2E`. Він навмисно manual-only і
  не виконується на кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - real npm publish must pass a successful npm `preflight_run_id`
  - real npm publish має dispatch from the same `main` або
    `release/YYYY.M.D` branch as the successful preflight run
  - stable npm releases default to `beta`
  - stable npm publish can target `latest` explicitly via workflow input
  - token-based npm dist-tag mutation now lives in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    for security, because `npm dist-tag add` still needs `NPM_TOKEN` while the
    public repo keeps OIDC-only publish
  - public `macOS Release` is validation-only; when a tag lives only on a
    release branch but the workflow is dispatched from `main`, set
    `public_release_branch=release/YYYY.M.D`
  - real private mac publish must pass successful private mac
    `preflight_run_id` and `validate_run_id`
  - real publish paths promote prepared artifacts instead of rebuilding
    them again
- For stable correction releases like `YYYY.M.D-N`, the post-publish verifier
  also checks the same temp-prefix upgrade path from `YYYY.M.D` to `YYYY.M.D-N`
  so release corrections cannot silently leave older global installs on the
  base stable payload
- npm release preflight fails closed unless the tarball includes both
  `dist/control-ui/index.html` and a non-empty `dist/control-ui/assets/` payload
  so we do not ship an empty browser dashboard again
- Post-publish verification also checks that published plugin entrypoints and
  package metadata are present in the installed registry layout. A release that
  ships missing plugin runtime payloads fails the postpublish verifier and
  cannot be promoted to `latest`.
- `pnpm test:install:smoke` also enforces the npm pack `unpackedSize` budget on
  the candidate update tarball, so installer e2e catches accidental pack bloat
  before the release publish path
- If the release work touched CI planning, extension timing manifests, or
  extension test matrices, regenerate and review the planner-owned
  `plugin-prerelease-extension-shard` matrix outputs from
  `.github/workflows/plugin-prerelease.yml` before approval so release notes do
  not describe a stale CI layout
- Stable macOS release readiness also includes the updater surfaces:
  - the GitHub release must end up with the packaged `.zip`, `.dmg`, and `.dSYM.zip`
  - `appcast.xml` on `main` must point at the new stable zip after publish
  - the packaged app must keep a non-debug bundle id, a non-empty Sparkle feed
    URL, and a `CFBundleVersion` at or above the canonical Sparkle build floor
    for that release version

## Release test boxes

`Full Release Validation` — це спосіб, яким operators запускають усі pre-release tests з
однієї точки входу. Для pinned commit proof на fast-moving branch використовуйте
helper, щоб кожен child workflow запускався з тимчасової branch, fixed at the target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper pushes `release-ci/<sha>-...`, dispatches `Full Release Validation`
from that branch with `ref=<sha>`, verifies every child workflow `headSha`
matches the target, then deletes the temporary branch. Це запобігає випадковому
підтвердженню newer `main` child run.

Для release branch або tag validation запускайте його з trusted `main` workflow
ref і передавайте release branch або tag як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Робочий процес визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
окремий пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Далі `OpenClaw Release
Checks` розгортається в install smoke, cross-OS release checks, live/E2E Docker
покриття release-path, Package Acceptance з Telegram package QA, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all дочірній
`npm_telegram` також має бути успішним; поза full/all він пропускається,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальний
підсумок verifier містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб release
manager міг бачити поточний критичний шлях без завантаження логів.
Див. [повну release validation](/uk/reference/full-release-validation), щоб отримати
повну матрицю етапів, точні назви завдань workflow, відмінності між профілями stable і full,
артефакти та вказівники для сфокусованих повторних запусків.
Дочірні workflows запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` указує на
старішу release-гілку або tag. Окремого вхідного параметра workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного commit на рухомій `main`;
raw commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend покриття для схвалення release
- `full`: stable плюс широке advisory provider/media покриття

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт як у
release-path Docker checks, так і в Package Acceptance. Це утримує всі
package-facing boxes на тих самих bytes і уникає повторних package builds.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org variable, інакше `openai/gpt-5.5`, тому що цей lane
доводить package install, onboarding, Gateway startup і один live agent turn,
а не benchmark найповільнішої default model. Ширша live provider
matrix лишається місцем для model-specific coverage.

Використовуйте ці варіанти залежно від етапу release:

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

Не використовуйте повний umbrella як перший повторний запуск після сфокусованого виправлення. Якщо один box
падає, використовуйте невдалий дочірній workflow, job, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повний umbrella знову лише тоді, коли
виправлення змінило спільну release orchestration або зробило попередні all-box докази
застарілими. Фінальний verifier umbrella повторно перевіряє записані child workflow run
ids, тому після успішного повторного запуску дочірнього workflow перезапустіть лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до umbrella. `all` є справжнім
release-candidate запуском, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only plugin child, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all runs
з `release_profile=full` використовують package artifact із release-checks.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Manual CI навмисно
оминає changed scoping і примусово запускає звичайний test graph для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти на питання «чи пройшло source tree повний звичайний test suite?»
Це не те саме, що release-path product validation. Докази, які слід зберегти:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shards із CI jobs під час розслідування regressions
- артефакти timing Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує performance analysis

Запускайте manual CI напряму лише тоді, коли release потребує deterministic normal CI, але
не потребує Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box знаходиться в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він перевіряє release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, з QR,
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
- OpenWebUI coverage всередині chunk `plugins-runtime-services`, коли це запитано
- розділені bundled plugin install/uninstall lanes
  від `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані rerun commands включають попередні
`package_artifact_run_id` і prepared Docker image inputs, коли вони доступні, щоб
невдалий lane міг повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity gate, що порівнює OpenAI candidate lane з Opus 4.6
  baseline, використовуючи agentic parity pack
- fast live Matrix QA profile, що використовує environment `qa-live-shared`
- live Telegram QA lane, що використовує Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує explicit local proof

Використовуйте цей box, щоб відповісти на питання «чи поводиться release правильно в QA scenarios і
live channel flows?» Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час схвалення release. Full Matrix coverage лишається доступним як
ручний sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Він спирається на
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
package inventory, записує package version і SHA-256 та тримає
workflow harness ref окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: pack довірену `package_ref` branch, tag або повний commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
prepared release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA на тому самому resolved tarball. Це GitHub-native
заміна для більшості package/update coverage, яке раніше вимагало
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
віддавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[тестування оновлень і плагінів](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, який local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Exhaustive published update migration з кожного stable package `2026.4.23+` є
окремим ручним workflow `Update Migration`, а не частиною Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Packages до
`2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих
до npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутній marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований package `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші packages
мають задовольняти modern package contracts; ті самі gaps провалюють release
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
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для підтвердження кандидата пакета Telegram увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у lane Telegram; окремий
workflow Telegram і далі приймає опубліковану npm-специфікацію для перевірок
після публікації.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною мутувальною точкою входу для публікації. Він
оркеструє workflows довіреного видавця в порядку, потрібному релізу:

1. Отримати release tag і визначити його commit SHA.
2. Перевірити, що tag доступний з `main` або `release/*`.
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

Stable-публікація до типового beta dist-tag:

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

Використовуйте нижчорівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release`
лише для цільового виправлення або повторної публікації. Для виправлення вибраного plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish`, або запустіть дочірній workflow напряму, коли
пакет OpenClaw не має бути опублікований.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, контрольовані оператором:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збирання/пакування, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий на справжньому шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm tag для шляху публікації; типово `beta`

`OpenClaw Release Publish` приймає такі вхідні параметри, контрольовані оператором:

- `tag`: обов’язковий release tag; має вже існувати
- `preflight_run_id`: id успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm tag для пакета OpenClaw
- `plugin_publish_scope`: типово `all-publishable`; використовуйте `selected` лише
  для цільового виправлення
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типово `true`; встановлюйте `false` лише коли використовуєте
  workflow як оркестратор виправлення лише plugins

`OpenClaw Release Checks` приймає такі вхідні параметри, контрольовані оператором:

- `ref`: гілка, tag або повний commit SHA для валідації. Перевірки з секретами
  вимагають, щоб розв’язаний commit був доступний з гілки OpenClaw або
  release tag.

Правила:

- Stable- та correction-теги можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease-теги можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` вхідний повний commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-релізу

Під час підготовки stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи tag можна використати поточний повний commit SHA гілки workflow
     для пробного запуску preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли навмисно потрібна пряма stable-публікація
3. Запустіть `Full Release Validation` на release-гілці, release tag або повному
   commit SHA, коли потрібно отримати звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує винесені назовні plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив на `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для просування цієї stable-версії з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо до `latest`, а `beta`
   має негайно вказувати на ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable-версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag розміщена в приватному repo з міркувань безпеки, оскільки вона досі
вимагає `NPM_TOKEN`, тоді як публічний repo зберігає публікацію лише через OIDC.

Це зберігає як шлях прямої публікації, так і шлях beta-first просування
задокументованими та видимими для оператора.

Якщо maintainer має повернутися до локальної npm-автентифікації, запускайте будь-які
команди 1Password CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання цього всередині tmux робить prompts,
сповіщення та обробку OTP спостережуваними й запобігає повторним сповіщенням host.

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
