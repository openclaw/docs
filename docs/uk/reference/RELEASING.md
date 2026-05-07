---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймального тестування пакета
    - Шукаєте правила іменування версій і графік випусків
    - Планування ліній щомісячної підтримки або LTS-випусків
summary: Канали релізів, контрольний список оператора, валідаційні бокси, найменування версій, заплановані щомісячні лінії підтримки та каденція
title: Політика випусків
x-i18n:
    generated_at: "2026-05-07T01:53:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома верхівка `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія застарілого коригувального стабільного випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початковий нуль до місяця або дня
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль установлення beta
- Стабільні та застарілі коригувальні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-випуски зазвичай спершу перевіряють і публікують npm/package-шлях, а
  збирання/підписування/нотаризацію застосунку Mac залишають для стабільних випусків, якщо інше явно не запитано

### Заплановане щомісячне версіонування підтримки

OpenClaw ще не має LTS або щомісячного каналу підтримки. Супровідники
працюють над щомісячними лініями підтримки, сумісними із SemVer, але поточні
канали оновлень, що постачаються сьогодні, усе ще є `stable`, `beta` і `dev`.

Запланована форма версії: `YYYY.M.PATCH`:

- `YYYY` — це рік.
- `M` — це місячна лінія випуску, без початкового нуля.
- `PATCH` збільшується в межах цієї місячної лінії й може зростати настільки, наскільки потрібно.

Наприклад, `2026.6.0`, `2026.6.1` і `2026.6.2` усі були б у червневій
лінії 2026 року. Майбутній щомісячний dist-tag підтримки, як-от `stable-2026-6` або
`lts-2026-6`, може вказувати на цю лінію, тоді як `latest` і надалі швидко рухатиметься.

Ця майбутня модель замінює потребу в нових коригувальних випусках `YYYY.M.D-N`.
Наявні застарілі коригувальні версії залишаються розпізнаваними, щоб старіші пакети та
шляхи оновлення продовжували працювати.

## Каденція випусків

- Випуски рухаються спершу через beta
- Stable іде лише після перевірки останньої beta
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура випуску, затвердження, облікові дані та нотатки з відновлення
  доступні лише супровідникам

## Контрольний список оператора випуску

Цей контрольний список є публічною формою потоку випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
runbook випуску лише для супровідників.

1. Почніть із поточного `main`: витягніть останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте його, надішліть його й виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу з випуску
   безпосередньо в `main`.
5. Підвищте версію в кожному потрібному місці для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб пакети Plugin, доступні для публікації, мали спільну версію випуску
   та метадані сумісності, потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   для перевірки-only попередньої перевірки дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте в гілці випуску й повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або allowlist моделей, що
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   паралельно відправляє всі пакети Plugin, доступні для публікації, у npm і той самий набір у
   ClawHub, а потім просуває підготовлений артефакт попередньої перевірки OpenClaw npm
   з відповідним dist-tag, щойно публікація Plugin в npm успішно завершується.
   Публікація в ClawHub усе ще може виконуватися, поки OpenClaw npm публікується, але
   workflow публікації випуску не завершується, доки обидва шляхи публікації Plugin і
   шлях публікації OpenClaw npm не завершаться успішно. Після публікації запустіть
   післяпублікаційне приймання пакета
   для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований попередній випуск потребує виправлення,
   створіть наступний відповідний номер попереднього випуску; не видаляйте й не перезаписуйте старий
   попередній випуск.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази перевірки. Публікація stable в npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність stable-випуску macOS також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть післяпублікаційний перевіряльник npm, необов’язковий окремий
    E2E Telegram для опублікованого npm, коли вам потрібен післяпублікаційний доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізним preflight, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізним preflight, щоб ширші перевірки циклів
  імпортів і архітектурних меж були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і bundle Control UI існували для кроку валідації
  pack
- Запустіть `pnpm plugins:sync` після bump версії в корені та перед тегуванням. Він
  оновлює версії пакетів Plugin, які можна публікувати, metadata сумісності
  OpenClaw peer/API, build metadata і stub-и changelog Plugin відповідно до
  версії core-релізу. `pnpm plugins:sync:check` є немутувальним release guard;
  publish workflow падає до будь-якої мутації registry, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу,
  щоб запустити всі передрелізні test boxes з однієї точки входу. Він приймає
  branch, tag або повний commit SHA, dispatch-ить ручний `CI` і dispatch-ить
  `OpenClaw Release Checks` для install smoke, package acceptance, cross-OS
  package checks, QA Lab parity, Matrix і Telegram lanes. Stable/default runs
  тримають вичерпні live/E2E і Docker release-path soak за
  `run_release_soak=true`; `release_profile=full` примусово вмикає soak. З
  `release_profile=full` і `rerun_group=all` він також запускає package Telegram
  E2E проти артефакту `release-package-under-test` з release checks.
  Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E має також підтвердити опублікований npm-пакет. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має виконати свою package/update matrix проти відвантаженого npm-пакета
  замість артефакту, зібраного з SHA. Надайте
  `evidence_package_spec`, коли приватний evidence report має підтвердити, що
  валідація відповідає опублікованому npm-пакету, без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне side-channel
  підтвердження для package candidate, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`
  для pack довіреного branch/tag/SHA `package_ref` з поточним harness
  `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим GitHub
  Actions run. Workflow resolve-ить candidate у
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, package
  artifact є candidate, а `published_upgrade_survivor_baseline` вибирає
  опублікований baseline. `update-restart-auth` використовує candidate package як
  встановлений CLI і як package-under-test, щоб перевірити managed restart path
  команди update candidate.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені profiles:
  - `smoke`: install/channel/agent, gateway network і config reload lanes
  - `package`: artifact-native package/update/restart/plugin lanes без OpenWebUI або live ClawHub
  - `product`: package profile плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого rerun
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  coverage для release candidate. Ручні CI dispatch-и обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, Node 22 compatibility, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації release telemetry. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і верифікує експортовані імена trace
  span, bounded attributes і редагування content/identifier без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним tagged release
- Запустіть `OpenClaw Release Publish` для мутувальної послідовності publish після того, як
  tag існує. Dispatch-іть його з `release/YYYY.M.D` (або `main`, коли публікується
  tag, reachable з main), передайте release tag і успішний OpenClaw npm
  `preflight_run_id`, і залишайте стандартний plugin publish scope
  `all-publishable`, якщо ви не запускаєте свідомо сфокусований repair. Workflow
  серіалізує plugin npm publish, plugin ClawHub publish і OpenClaw
  npm publish, щоб core package не був опублікований раніше за свої externalized
  plugins.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity lane плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний Matrix
  transport, media і E2EE inventory паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` напряму
- Цей поділ навмисний: тримайте реальний npm release path коротким,
  deterministic і зосередженим на artifact, тоді як повільніші live checks залишаються у власному
  lane, щоб вони не затримували й не блокували publish
- Release checks, що містять secrets, слід dispatch-ити через `Full Release
Validation` або з workflow ref `main`/release, щоб workflow logic і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає branch, tag або повний commit SHA, якщо
  resolved commit reachable з branch OpenClaw або release tag
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний workflow-branch commit SHA без вимоги pushed tag
- Цей SHA path призначений лише для validation і не може бути promoted у реальний publish
- У SHA mode workflow синтезує `v<package.json version>` лише для
  package metadata check; real publish усе одно вимагає реального release tag
- Обидва workflows залишають реальний publish і promotion path на GitHub-hosted
  runners, тоді як немутувальний validation path може використовувати більші
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
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити installed-package onboarding, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного leased Telegram credential
  pool. Локальні одноразові запуски maintainer-ів можуть опустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повний post-publish beta smoke з машини maintainer-а, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Helper запускає Parallels npm update/fresh-target validation, dispatch-ить `NPM Telegram Beta E2E`, poll-ить точний workflow run, завантажує artifact і друкує Telegram report.
- Maintainer-и можуть запустити той самий post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно manual-only і
  не виконується на кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - real npm publish має пройти успішний npm `preflight_run_id`
  - real npm publish має бути dispatched з того самого branch `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases за замовчуванням використовують `beta`
  - stable npm publish може цілитися в `latest` явно через workflow input
  - token-based npm dist-tag mutation тепер міститься в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    public repo зберігає OIDC-only publish
  - public `macOS Release` є validation-only; коли tag існує лише на
    release branch, але workflow dispatched з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - real private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - real publish paths promote-ять підготовлені artifacts замість того, щоб rebuild-ити
    їх знову
- Для legacy stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight fail-иться closed, якщо tarball не містить обидва
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожній browser dashboard
- Post-publish verification також перевіряє, що published plugin entrypoints і
  package metadata присутні у встановленому registry layout. Release, який
  відвантажує відсутні plugin runtime payloads, провалює postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також enforce-ить budget npm pack `unpackedSize` на
  candidate update tarball, тому installer e2e ловить випадкове pack bloat
  до release publish path
- Якщо release work торкалася CI planning, extension timing manifests або
  extension test matrices, regenerate і review planner-owned
  outputs matrix `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має зрештою містити packaged `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - packaged app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї release version

## Release test boxes

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні tests з
однієї точки входу. Для pinned commit proof на branch, що швидко рухається, використовуйте
helper, щоб кожен child workflow запускався з тимчасового branch, зафіксованого на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper push-ить `release-ci/<sha>-...`, dispatch-ить `Full Release Validation`
з цього branch з `ref=<sha>`, перевіряє, що кожен child workflow `headSha`
відповідає target, а потім видаляє тимчасовий branch. Це запобігає випадковому підтвердженню
новішого child run з `main`.

Для validation release branch або tag запускайте його з довіреного workflow
ref `main` і передавайте release branch або tag як `ref`:

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
батьківський артефакт `release-package-under-test` для перевірок, орієнтованих
на пакет, і запускає окремий пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Далі `OpenClaw Release
Checks` розгалужується на install smoke, міжплатформні перевірки релізу,
live/E2E Docker-покриття шляху релізу, коли ввімкнено soak, Package Acceptance з
пакетним QA Telegram, QA Lab parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальний
підсумок verifier містить таблиці найповільніших завдань для кожного дочірнього
запуску, щоб release manager міг бачити поточний критичний шлях без завантаження
логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation), щоб переглянути
повну матрицю етапів, точні назви завдань workflow, відмінності між профілями
stable і full, артефакти та цільові механізми повторного запуску.
Дочірні workflows запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` указує на
старішу релізну гілку або тег. Окремого workflow-ref входу для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для точного доказу коміту на рухомому `main`;
сирі SHA комітів не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити зафіксовану тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider-покриття:

- `minimum`: найшвидший релізно-критичний live і Docker шлях OpenAI/core
- `stable`: minimum плюс стабільне покриття provider/backend для схвалення релізу
- `full`: stable плюс широке advisory-покриття provider/media

Використовуйте `run_release_soak=true` зі `stable`, коли релізно-блокувальні лінії
зелені й потрібен вичерпний live/E2E, Docker release-path і
обмежений sweep published upgrade-survivor перед просуванням. Цей sweep покриває
останні чотири stable-пакети плюс зафіксовані базові лінії `2026.4.23` і `2026.5.2`
плюс старіше покриття `2026.4.15`, із вилученими дубльованими базовими лініями та
шардуванням кожної базової лінії в окреме завдання Docker runner. `full` передбачає
`run_release_soak=true`.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test` і повторно використовує цей артефакт у cross-OS,
Package Acceptance і Docker-перевірках release-path, коли виконується soak. Це утримує
всі бокси, орієнтовані на пакет, на тих самих байтах і уникає повторних збірок пакета.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
змінну repo/org задано, інакше `openai/gpt-5.4`, бо ця лінія
доводить інсталяцію пакета, onboarding, запуск Gateway і один live-хід агента,
а не бенчмарк найповільнішої моделі за замовчуванням. Ширша live-матриця provider
залишається місцем для model-specific покриття.

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

Не використовуйте повну парасольку як перший повторний запуск після цільового виправлення. Якщо один box
падає, використовуйте невдалий дочірній workflow, завдання, Docker-лінію, профіль пакета, model
provider або QA-лінію для наступного доказу. Запускайте повну парасольку знову лише тоді,
коли виправлення змінило спільну оркестрацію релізу або зробило попередні докази all-box
застарілими. Фінальний verifier парасольки повторно перевіряє записані id запусків дочірніх workflow,
тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` у парасольку. `all` є справжнім
запуском release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only дочірній Plugin, `release-checks` запускає кожен release
box, а вужчі релізні групи: `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Цільові повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; запуски full/all
з `release_profile=full` використовують пакетний артефакт release-checks. Цільові
cross-OS повторні запуски можуть додавати `cross_os_suite_filter=windows/packaged-upgrade` або
інший фільтр OS/suite. Невдачі QA release-check є advisory; QA-only
невдача не блокує валідацію релізу.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Ручний CI навмисно
оминає changed scoping і примусово запускає звичайний тестовий граф для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти на запитання "чи пройшло дерево вихідного коду повний звичайний набір тестів?"
Це не те саме, що product validation release-path. Докази, які слід зберігати:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних шардів із завдань CI під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у release-mode
workflow `install-smoke`. Він валідовує release candidate через packaged
Docker-середовища, а не лише source-level тести.

Покриття Release Docker включає:

- повний install smoke із увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за цільовим SHA, де QR,
  root/gateway і installer/Bun smoke завдання виконуються як окремі install-smoke
  shards
- E2E-лінії репозиторію
- Docker chunks release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли його запитано
- розділені bundled Plugin install/uninstall лінії
  `bundled-plugin-install-uninstall-0` through
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model покриття, коли release checks
  включають live suites

Використовуйте артефакти Docker перед повторним запуском. Планувальник release-path завантажує
`.artifacts/docker-tests/` з логами ліній, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника та командами повторного запуску. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені входи Docker image, коли доступні, щоб
невдала лінія могла повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Покриття Release QA Lab включає:

- лінію mock parity, що порівнює OpenAI candidate lane з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile із використанням середовища `qa-live-shared`
- live Telegram QA lane із використанням оренд облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей box, щоб відповісти на запитання "чи реліз поводиться правильно у QA-сценаріях і
live channel flows?" Зберігайте URL артефактів для parity, Matrix і Telegram
ліній під час схвалення релізу. Повне покриття Matrix залишається доступним як
ручний sharded QA-Lab run, а не як стандартна release-critical лінія.

### Пакет

Package box — це gate інстальованого продукту. Він спирається на
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідовує
інвентар пакета, записує версію пакета та SHA-256 і зберігає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: pack довірену гілку `package_ref`, тег або повний SHA коміту
  з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов'язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance із `source=artifact`,
підготовленим артефактом релізного пакета, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance утримує migration, update,
configured-auth update restart, stale Plugin dependency cleanup, offline Plugin
fixtures, Plugin update і Telegram package QA на тому самому визначеному
tarball. Блокувальні release checks використовують стандартну latest published package
baseline; `run_release_soak=true` або
`release_profile=full` розширює покриття до кожної stable npm-published baseline від
`2026.4.23` до `latest` плюс reported-issue fixtures. Використовуйте
Package Acceptance із `source=npm` для вже випущеного candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
публікацією. Це GitHub-native
заміна для більшості package/update покриття, яке раніше потребувало
Parallels. Cross-OS release checks досі важливі для OS-specific onboarding,
installer і platform behavior, але product validation package/update має
надавати перевагу Package Acceptance.

Канонічний checklist для update і Plugin validation:
[Тестування оновлень і плагінів](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка локальна, Docker, Package Acceptance або release-check лінія доводить
Plugin install/update, doctor cleanup або published-package migration change.
Вичерпна published update migration з кожного stable пакета `2026.4.23+` є
окремим ручним workflow `Update Migration`, а не частиною Full Release CI.

Поблажливість для застарілого приймання пакетів навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих
у npm: приватні записи інвентарю QA, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні файли patch у git-фікстурі, отриманій із tarball,
відсутній збережений `update.channel`, застарілі розташування записів встановлення Plugin,
відсутнє збереження записів встановлення marketplace та міграція метаданих конфігурації
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про локальні файли штампів метаданих збірки, які вже були випущені. Пізніші пакети
мають відповідати сучасним контрактам пакетів; ті самі прогалини спричиняють помилку
перевірки релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
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

- `smoke`: швидкі lanes для встановлення пакета, каналу й агента, мережі Gateway та
  перезавантаження конфігурації
- `package`: контракти встановлення, оновлення, перезапуску й пакета Plugin без live
  ClawHub; це стандарт для перевірки релізу
- `product`: `package` плюс канали MCP, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: фрагменти Docker release-path з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate доказу Telegram увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у lane Telegram; окремий workflow
Telegram і далі приймає опубліковану npm-специфікацію для післяпублікаційних перевірок.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною мутувальною точкою входу для публікації. Вона
оркеструє workflow trusted-publisher у порядку, потрібному релізу:

1. Отримати release tag і визначити його commit SHA.
2. Перевірити, що tag досяжний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тим самим scope і SHA.
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

Використовуйте нижчорівневі workflow `Plugin NPM Release` і `Plugin ClawHub Release`
лише для сфокусованого ремонту або повторної публікації. Для ремонту вибраного Plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish`, або запустіть дочірній workflow напряму, коли
пакет OpenClaw не потрібно публікувати.

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow лише для validation-only preflight
- `preflight_only`: `true` лише для перевірки, збірки й пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Publish` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий release tag; має вже існувати
- `preflight_run_id`: успішний run id preflight `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm tag для пакета OpenClaw
- `plugin_publish_scope`: за замовчуванням `all-publishable`; використовуйте `selected` лише
  для сфокусованого ремонту
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: за замовчуванням `true`; встановлюйте `false` лише коли використовуєте
  workflow як оркестратор ремонту тільки для Plugin

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: branch, tag або повний commit SHA для перевірки. Перевірки із секретами
  вимагають, щоб розв’язаний commit був досяжний із гілки OpenClaw або
  release tag.
- `run_release_soak`: увімкнути вичерпні live/E2E, Docker release-path і
  all-since upgrade-survivor soak для стабільних/стандартних перевірок релізу. Це примусово
  вмикається `release_profile=full`.

Правила:

- Stable і correction tags можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease tags можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` введення повного commit SHA дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  validation-only
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Коли готуєте стабільний npm-реліз:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До створення tag можна використати поточний повний commit SHA гілки workflow
     для validation-only dry run workflow preflight
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує зовнішні Plugin в npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для просування цієї стабільної версії з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо до `latest`, а `beta`
   має негайно вказувати на ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag розташована в приватному repo з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний repo зберігає публікацію лише через OIDC.

Це зберігає і прямий шлях публікації, і шлях beta-first promotion
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині спеціальної сесії tmux. Не викликайте `op`
безпосередньо з основного shell агента; утримання його всередині tmux робить prompts,
alerts і обробку OTP спостережуваними та запобігає повторним host alerts.

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
