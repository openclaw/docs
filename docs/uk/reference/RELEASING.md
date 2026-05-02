---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте правила іменування версій і періодичність випусків
summary: Релізні лінії, контрольний список оператора, бокси валідації, іменування версій і ритм
title: Політика випусків
x-i18n:
    generated_at: "2026-05-02T06:28:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97554cdf9ac79080a7b371afe0a0c8288a6ca53729abb42401399dca24a12067
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні гілки релізів:

- stable: релізи з тегами, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього релізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний підвищений стабільний реліз npm
- `beta` означає поточну ціль установлення beta
- Стабільні та стабільні коригувальні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно вибрати `latest` або пізніше підвищити перевірену збірку beta
- Кожен стабільний реліз OpenClaw постачає npm-пакет і застосунок macOS разом;
  beta-релізи зазвичай спочатку перевіряють і публікують шлях npm/package, а
  складання/підписування/нотаризацію застосунку Mac залишають для стабільних релізів, якщо це явно не запитано

## Періодичність релізів

- Релізи рухаються спочатку через beta
- Стабільний реліз виходить лише після перевірки останньої beta
- Мейнтейнери зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано і він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура релізу, затвердження, облікові дані та нотатки щодо відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора релізу

Цей контрольний список є публічною формою процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкату залишаються в
runbook релізів лише для мейнтейнерів.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб створювати від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте його, надішліть його, і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому вона
   навмисно зберігається.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над релізом
   безпосередньо в `main`.
5. Підвищте кожне потрібне місце версії для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб пакети Plugin, придатні для публікації, мали спільну версію релізу
   та метадані сумісності, потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тег не існує,
   повний 40-символьний SHA гілки релізу дозволено для попередньої перевірки лише з метою валідації.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки релізу, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ релізу: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте проблему в гілці релізу та повторно запустіть найменший невдалий
   файл, гілку, job workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Повторно запускайте повну umbrella-перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta поставте тег `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спочатку публікує всі пакети Plugin, придатні для публікації, в npm, другим кроком публікує той самий
   набір у ClawHub, а потім підвищує підготовлений артефакт попередньої перевірки OpenClaw npm
   з dist-tag `beta`. Після публікації запустіть post-publish package
   acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або `openclaw@beta`.
   Якщо надіслана або опублікована beta потребує виправлення, створіть наступний `-beta.N`;
   не видаляйте і не переписуйте стару beta.
10. Для стабільного релізу продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази валідації. Публікація стабільного npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність стабільного релізу macOS також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий окремий
    published-npm Telegram E2E, коли вам потрібен post-publish доказ каналу,
    підвищення dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Попередня перевірка релізу

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та меж архітектури були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і bundle Control UI існували для етапу валідації
  pack
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові boxes з однієї точки входу. Він приймає гілку,
  tag або повний commit SHA, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` з release
  checks. Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E також має підтвердити опублікований npm package. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm package, без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен side-channel доказ
  для package candidate, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної release version; `source=ref`,
  щоб упакувати довірену гілку/tag/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим GitHub
  Actions run. Workflow resolves candidate to
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes містять `published-upgrade-survivor`, package artifact є candidate,
  а `published_upgrade_survivor_baseline` вибирає published baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: install/channel/agent, gateway network і config reload lanes
  - `package`: artifact-native package/update/plugin lanes без OpenWebUI або live ClawHub
  - `product`: package profile плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для release candidate. Ручні CI dispatches bypass changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, Node 22 compatibility, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації release telemetry. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені attributes і редагування content/identifier без потреби в
  Opik, Langfuse або іншому зовнішньому collector.
- Запустіть `pnpm release:check` перед кожним tagged release
- Запустіть `OpenClaw Release Publish` для mutating publish sequence після того, як
  tag існує. Dispatch його з `release/YYYY.M.D` (або `main`, коли публікується
  main-reachable tag), передайте release tag і успішний OpenClaw npm
  `preflight_run_id`, і залиште default plugin publish scope
  `all-publishable`, якщо ви не виконуєте навмисний focused repair. Workflow
  serializes plugin npm publish, plugin ClawHub publish і OpenClaw
  npm publish, щоб core package не було опубліковано перед його externalized
  plugins.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс fast
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media і E2EE inventory паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний npm release path коротким,
  deterministic і artifact-focused, тоді як повільніші live checks залишаються у власному
  lane, щоб вони не затримували й не блокували publish
- Secret-bearing release checks слід dispatch через `Full Release
Validation` або з `main`/release workflow ref, щоб workflow logic і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, tag або повний commit SHA, якщо
  resolved commit reachable з OpenClaw branch або release tag
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний workflow-branch commit SHA без потреби в pushed tag
- Цей SHA path призначений лише для валідації й не може бути promoted у реальний publish
- У SHA mode workflow synthesizes `v<package.json version>` лише для
  package metadata check; реальний publish усе ще потребує справжнього release tag
- Обидва workflows тримають реальний publish і promotion path на GitHub-hosted
  runners, тоді як non-mutating validation path може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити published registry
  install path у свіжому temp prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити installed-package onboarding, Telegram setup і реальний Telegram E2E
  проти опублікованого npm package, використовуючи shared leased Telegram credential
  pool. Локальні одноразові maintainer runs можуть пропускати Convex vars і передавати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно manual-only і
  не запускається на кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути dispatched з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases default to `beta`
  - stable npm publish може явно цілитися в `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    для безпеки, бо `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    public repo keeps OIDC-only publish
  - public `macOS Release` є validation-only; коли tag існує лише на
    release branch, але workflow dispatched з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths promote prepared artifacts замість того, щоб rebuilding
    them again
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  base stable payload
- npm release preflight fails closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і non-empty payload `dist/control-ui/assets/`,
  щоб ми знову не shipped empty browser dashboard
- Post-publish verification також перевіряє, що published plugin entrypoints і
  package metadata присутні в installed registry layout. Реліз, який
  ships missing plugin runtime payloads, fails postpublish verifier і
  не може бути promoted to `latest`.
- `pnpm test:install:smoke` також enforces npm pack `unpackedSize` budget on
  candidate update tarball, щоб installer e2e catches accidental pack bloat
  перед release publish path
- Якщо release work touched CI planning, extension timing manifests або
  extension test matrices, regenerate and review planner-owned
  `plugin-prerelease-extension-shard` matrix outputs from
  `.github/workflows/plugin-prerelease.yml` перед approval, щоб release notes не
  описували stale CI layout
- Stable macOS release readiness також includes updater surfaces:
  - GitHub release має в підсумку містити packaged `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` on `main` має point at new stable zip after publish
  - packaged app має keep non-debug bundle id, non-empty Sparkle feed
    URL і `CFBundleVersion` на або вище canonical Sparkle build floor
    for that release version

## Release test boxes

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні тести з
однієї точки входу. Для pinned commit proof на швидко змінюваній гілці використовуйте
helper, щоб кожен child workflow запускався з тимчасової гілки, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper pushes `release-ci/<sha>-...`, dispatches `Full Release Validation`
from that branch with `ref=<sha>`, verifies every child workflow `headSha`
matches the target, then deletes the temporary branch. This avoids proving a
newer `main` child run by accident.

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

Робочий процес визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
окремий пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release
Checks` розгортає install smoke, cross-OS release checks, live/E2E Docker
coverage для release path, Package Acceptance з QA пакета Telegram, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all він пропускається,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальне
зведення verifier містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб release
manager міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
повної матриці етапів, точних назв завдань workflow, відмінностей між stable і full профілями,
артефактів і ручок для сфокусованого повторного запуску.
Дочірні workflow запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу релізну гілку або тег. Окремого input workflow-ref для Full Release Validation
немає; обирайте довірений harness, обираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомому `main`;
сирі SHA комітів не можуть бути refs для workflow dispatch, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для затвердження релізу
- `full`: stable плюс широке advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт як у
release-path Docker checks, так і в Package Acceptance. Це утримує всі
package-facing бокси на тих самих байтах і уникає повторних збірок пакета.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
змінну repo/org задано, інакше `openai/gpt-5.5`, оскільки ця lane
доводить встановлення пакета, onboarding, запуск gateway і один live agent turn,
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

Не використовуйте повну umbrella як перший повторний запуск після сфокусованого виправлення. Якщо один box
падає, використовуйте невдалий дочірній workflow, job, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повну umbrella знову лише тоді, коли
виправлення змінило спільну release orchestration або зробило попередній all-box evidence
застарілим. Фінальний verifier umbrella повторно перевіряє записані child workflow run
ids, тому після успішного повторного запуску child workflow повторно запускайте лише невдалий
батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` в umbrella. `all` — це справжній
запуск release candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only plugin child, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Сфокусовані повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; запуски full/all
з `release_profile=full` використовують артефакт пакета release-checks.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Ручний CI навмисно
обходить changed scoping і примусово виконує звичайний тестовий граф для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: "чи пройшло дерево джерел повний звичайний набір тестів?"
Це не те саме, що release-path product validation. Докази, які слід зберігати:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному цільовому SHA
- назви невдалих або повільних shard із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він перевіряє release candidate через упаковані
Docker середовища, а не лише тести рівня джерел.

Release Docker coverage включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, з QR,
  root/gateway і installer/Bun smoke jobs, що виконуються як окремі install-smoke
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
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker артефакти перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з логами lane, `summary.json`, `failures.json`,
таймінгами фаз, scheduler plan JSON і командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступні, щоб
невдала lane могла повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity gate, що порівнює OpenAI candidate lane з Opus 4.6
  baseline за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей box, щоб відповісти: "чи поводиться реліз коректно у QA сценаріях і
live channel flows?" Зберігайте URL артефактів для parity, Matrix і Telegram
lanes під час затвердження релізу. Повне Matrix coverage залишається доступним як
ручний sharded QA-Lab run, а не release-critical lane за замовчуванням.

### Пакет

Package box — це installable-product gate. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
інвентар пакета, записує версію пакета та SHA-256 і тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна release
  version OpenClaw
- `source=ref`: пакувати довірену `package_ref` branch, tag або full commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance утримує migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA проти того самого resolved tarball. Це GitHub-native
заміна більшої частини package/update coverage, яка раніше потребувала
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Exhaustive published update migration з кожного stable пакета `2026.4.23+` — це
окремий ручний workflow `Update Migration`, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих
до npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутній marketplace install-record persistence і config metadata
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

- `smoke`: quick package install/channel/agent, gateway network і config
  reload lanes
- `package`: install/update/plugin package contracts без live ClawHub; це release-check
  default
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для підтвердження пакета-кандидата Telegram увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у доріжку Telegram; окремий
workflow Telegram досі приймає опубліковану npm-специфікацію для перевірок
після публікації.

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі вхідні дані, керовані оператором:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий тег npm для шляху публікації; типове значення `beta`

`OpenClaw Release Checks` приймає такі вхідні дані, керовані оператором:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки, що містять
  secrets, вимагають, щоб розв’язаний коміт був досяжний з гілки OpenClaw або
  релізного тегу.

Правила:

- Стабільні та корекційні теги можна публікувати або в `beta`, або в `latest`
- Beta-теги prerelease можна публікувати лише в `beta`
- Для `OpenClaw NPM Release` вхідний повний SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці metadata перед продовженням публікації

## Послідовність стабільного npm-релізу

Коли готуєте стабільний npm-реліз:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До створення тегу можна використовувати поточний повний SHA коміту гілки workflow
     для пробного запуску preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спочатку в beta або `latest` лише
   коли ви навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на релізній гілці, релізному тегу або повному
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано напряму в `latest`, а `beta`
   має негайно вказувати на ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Зміна dist-tag розміщена у приватному repo з міркувань безпеки, оскільки вона досі
потребує `NPM_TOKEN`, тоді як публічний repo зберігає публікацію лише через OIDC.

Це робить і шлях прямої публікації, і шлях просування спочатку через beta
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині виділеної tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; утримання його всередині tmux робить prompts,
alerts і обробку OTP видимими та запобігає повторним сповіщенням хоста.

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
