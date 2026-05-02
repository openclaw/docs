---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки випуску або приймального тестування пакета
    - Шукаєте інформацію про іменування версій і періодичність випусків
summary: Канали випуску, контрольний список оператора, бокси валідації, іменування версій і ритм
title: Політика випусків
x-i18n:
    generated_at: "2026-05-02T17:33:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d58ea2416a3c1e129e5167c20b1c8c55eca581c9f811efee5722b5dfd336a85d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має чотири публічні гілки випусків:

- стабільна: теговані випуски, які за замовчуванням публікуються до npm `beta`, або до npm `latest`, коли це явно запитано
- альфа: передвипускні теги, які публікуються до npm `alpha`
- бета: передвипускні теги, які публікуються до npm `beta`
- розробницька: рухома верхівка `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія альфа-передвипуску: `YYYY.M.D-alpha.N`
  - Git-тег: `vYYYY.M.D-alpha.N`
- Версія бета-передвипуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний випуск npm
- `alpha` означає поточну ціль встановлення alpha
- `beta` означає поточну ціль встановлення beta
- Стабільні та стабільні коригувальні випуски за замовчуванням публікуються до npm `beta`; оператори випуску можуть явно вказати ціль `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку macOS залишають для стабільного випуску, якщо це не запитано явно

## Періодичність випусків

- Випуски рухаються спочатку через beta
- Стабільний випуск виходить лише після перевірки останньої beta
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура випуску, затвердження, облікові дані та нотатки щодо відновлення
  доступні лише супровідникам

## Контрольний список оператора випуску

Цей контрольний список описує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі екстреного відкату залишаються в
інструкції з випусків, доступній лише супровідникам.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт надіслано,
   і переконайтеся, що поточний CI для `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте його, надішліть його та ще раз виконайте rebase/pull
   перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб публіковані пакети Plugin мали спільну версію випуску
   та метадані сумісності, потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   для попередньої перевірки лише з метою валідації дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте в гілці випуску та перезапустіть найменший невдалий
   файл, лінію, завдання workflow, профіль пакета, провайдер або allowlist моделі, який
   доводить виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для alpha або beta позначте `vYYYY.M.D-alpha.N` або `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спочатку публікує всі публіковані пакети Plugin до npm, потім публікує той самий
   набір до ClawHub, а тоді просуває підготовлений артефакт попередньої перевірки npm OpenClaw
   з відповідним dist-tag. Після публікації запустіть післяпублікаційну перевірку прийнятності пакета
   для опублікованого пакета `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` або `openclaw@beta`. Якщо надісланий або
   опублікований передвипуск потребує виправлення, створіть наступний відповідний номер передвипуску;
   не видаляйте й не переписуйте старий передвипуск.
10. Для стабільного випуску продовжуйте лише після того, як перевірена beta або кандидат у випуск матиме
    потрібні докази валідації. Публікація стабільного npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність стабільного випуску macOS також вимагає
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть npm-перевірку після публікації, необов’язковий автономний
    E2E опублікованого npm для Telegram, коли потрібне післяпублікаційне підтвердження каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення
    випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед попередньою перевіркою релізу, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед попередньою перевіркою релізу, щоб ширші перевірки циклів
  імпортів і архітектурних меж були успішними поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і збірка Control UI існували для кроку
  перевірки пакування
- Запустіть `pnpm plugins:sync` після підвищення кореневої версії та перед тегуванням. Він
  оновлює версії пакетів публіковних plugin, метадані сумісності
  OpenClaw peer/API, метадані збірки та заготовки журналів змін plugin відповідно до версії
  релізу core. `pnpm plugins:sync:check` є немодифікувальним релізним запобіжником;
  publish workflow завершується помилкою до будь-якої зміни реєстру, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker
  release-path, live/E2E, OpenWebUI, parity QA Lab, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` із release
  checks. Укажіть `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E також має підтвердити опублікований пакет npm. Укажіть
  `evidence_package_spec`, коли приватний evidence report має підтвердити, що
  валідація відповідає опублікованому пакету npm без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне side-channel підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`
  щоб запакувати довірену гілку/тег/SHA `package_ref` із поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes містять `published-upgrade-survivor`, артефакт пакета є кандидатом, а
  `published_upgrade_survivor_baseline` вибирає опублікований baseline.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/channel/agent, gateway network і перезавантаження config
  - `package`: package/update/plugin lanes, нативні для артефакту, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для кандидата релізу. Ручні CI dispatches обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Запустіть `OpenClaw Release Publish` для послідовності модифікувальної публікації після того, як
  тег існує. Dispatch виконуйте з `release/YYYY.M.D` (або `main`, коли публікуєте
  тег, досяжний з main), передайте release tag і успішний OpenClaw npm
  `preflight_run_id`, і залишайте стандартний scope публікації plugin
  `all-publishable`, якщо ви навмисно не запускаєте сфокусований repair. Workflow
  серіалізує plugin npm publish, plugin ClawHub publish і OpenClaw
  npm publish, щоб core package не було опубліковано перед його externalized
  plugins.
- Release checks тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує Convex CI
  credential leases. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримати реальний шлях npm release коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у власному
  lane, щоб вони не затримували й не блокували publish
- Secret-bearing release checks слід dispatch через `Full Release
Validation` або з `main`/release workflow ref, щоб логіка workflow і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  розв’язаний коміт досяжний з гілки OpenClaw або release tag
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-branch без потреби в pushed tag
- Цей шлях SHA призначений лише для валідації й не може бути promoted у реальний publish
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальний publish усе ще потребує справжнього release tag
- Обидва workflows зберігають реальний шлях publish і promotion на GitHub-hosted
  runners, тоді як немодифікувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий release checks lane
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити опублікований registry
  install path у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити installed-package onboarding, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm package з використанням спільного пулу leased Telegram credential.
  Локальні разові запуски maintainers можуть пропустити Convex vars і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish check з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожному merge.
- Maintainer release automation тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути dispatched з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases за замовчуванням спрямовуються до `beta`
  - stable npm publish може явно таргетувати `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає OIDC-only publish
  - публічний `macOS Release` є validation-only; коли тег існує лише на
    release branch, але workflow dispatched з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальний private mac publish має пройти успішний private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths promote підготовлені артефакти замість повторної
    їхньої перебудови
- Для stable correction releases на кшталт `YYYY.M.D-N`, post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight fails closed, якщо tarball не містить обидва
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожній browser dashboard
- Post-publish verification також перевіряє, що entrypoints опублікованих plugin і
  package metadata присутні в установленому registry layout. Реліз, який
  постачає відсутні plugin runtime payloads, провалює postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет npm pack `unpackedSize` до
  candidate update tarball, щоб installer e2e ловив випадкове pack bloat
  до release publish path
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, згенеруйте заново й перегляньте planner-owned
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає updater surfaces:
  - GitHub release має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї release version

## Релізні тестові бокси

`Full Release Validation` — це спосіб, у який operators запускають усі передрелізні тести з
однієї точки входу. Для pinned commit proof на швидкозмінній гілці використовуйте
helper, щоб кожен child workflow запускався з тимчасової гілки, зафіксованої на target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що `headSha` кожного child workflow
збігається з target, а потім видаляє тимчасову гілку. Це уникає випадкового підтвердження
новішого child run з `main`.

Для валідації release branch або tag запускайте його з довіреного workflow
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

Робочий процес визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
окремий package Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Далі `OpenClaw Release
Checks` розгортається на install smoke, cross-OS release checks, live/E2E Docker
release-path покриття, Package Acceptance з Telegram package QA, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропущено,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальне
зведення верифікатора містить таблиці найповільніших завдань для кожного
дочірнього запуску, щоб менеджер релізу бачив поточний критичний шлях без
завантаження логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
повної матриці етапів, точних назв завдань workflow, відмінностей між stable і full профілями,
артефактів і цільових механізмів повторного запуску.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу релізну гілку або тег. Окремого входу Full Release Validation
workflow-ref немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомій `main`;
raw commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend покриття для затвердження релізу
- `full`: stable плюс broad advisory provider/media покриття

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
визначити цільовий ref як `release-package-under-test`, і повторно використовує
цей артефакт як у release-path Docker перевірках, так і в Package Acceptance.
Це утримує всі package-facing boxes на тих самих байтах і уникає повторних збірок пакета.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org змінну, інакше `openai/gpt-5.4`, бо ця lane доводить
встановлення пакета, onboarding, запуск Gateway і один live agent turn,
а не бенчмарк найповільнішої моделі за замовчуванням. Ширша live provider
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

Не використовуйте повну парасольку як перший повторний запуск після цільового виправлення. Якщо один box
падає, використовуйте failed child workflow, job, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повну парасольку знову лише тоді,
коли виправлення змінило спільну release orchestration або зробило попередній all-box доказ
застарілим. Фінальний верифікатор парасольки повторно перевіряє записані child workflow run
ids, тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` — це реальний
запуск release-candidate, `ci` запускає лише нормальний дочірній CI, `plugin-prerelease`
запускає лише release-only plugin child, `release-checks` запускає кожен release
box, а вужчі release groups — `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Цільові повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; full/all запуски
з `release_profile=full` використовують release-checks package artifact.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Manual CI навмисно
обходить changed scoping і примусово запускає нормальний test graph для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти на запитання: "чи пройшло дерево джерел повний нормальний набір тестів?"
Це не те саме, що release-path product validation. Докази, які слід зберігати:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- `CI` run зелений на точному target SHA
- назви невдалих або повільних shard із CI jobs під час розслідування регресій
- артефакти таймінгу Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте manual CI напряму лише тоді, коли реліз потребує детермінованого normal CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він валідує release candidate через упаковані
Docker середовища, а не лише source-level tests.

Release Docker coverage включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, з QR,
  root/gateway і installer/Bun smoke jobs як окремими install-smoke
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
phase timings, scheduler plan JSON і rerun commands. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` на reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і prepared Docker image inputs, коли доступні, тому
невдала lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремо від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity gate, що порівнює OpenAI candidate lane з Opus 4.6
  baseline за допомогою agentic parity pack
- швидкий live Matrix QA profile із використанням середовища `qa-live-shared`
- live Telegram QA lane із використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей box, щоб відповісти на запитання: "чи реліз поводиться правильно в QA scenarios і
live channel flows?" Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час затвердження релізу. Full Matrix coverage лишається доступним як
ручний sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує package version і SHA-256, і тримає
workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: запакувати довірену `package_ref` branch, tag або full commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA проти того самого resolved tarball. Це GitHub-native
заміна для більшості package/update coverage, що раніше потребувало
Parallels. Cross-OS release checks досі важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
надавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Exhaustive published update migration з кожного stable пакета `2026.4.23+` —
це окремий ручний workflow `Update Migration`, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих
до npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про local build metadata stamp files, які вже були shipped. Пізніші пакети
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
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для перевірки пакета-кандидата Telegram увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у lane Telegram; окремий
workflow Telegram досі приймає опубліковану специфікацію npm для перевірок після публікації.

## Автоматизація публікації випуску

`OpenClaw Release Publish` є звичайною мутувальною точкою входу для публікації. Він
оркеструє workflows довіреного публікатора в порядку, потрібному для випуску:

1. Отримати тег випуску та визначити SHA його коміту.
2. Перевірити, що тег досяжний з `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тією самою областю та SHA.
6. Запустити `OpenClaw NPM Release` з тегом випуску, npm dist-tag і
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

Використовуйте нижчерівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release`
лише для сфокусованого ремонту або повторної публікації. Для ремонту вибраного plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish`, або запустіть дочірній workflow напряму, коли
пакет OpenClaw не має публікуватися.

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-alpha.1` чи `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий тег npm для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Publish` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег випуску; має вже існувати
- `preflight_run_id`: ідентифікатор успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий тег npm для пакета OpenClaw
- `plugin_publish_scope`: за замовчуванням `all-publishable`; використовуйте `selected` лише
  для сфокусованого ремонту
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: за замовчуванням `true`; встановлюйте `false` лише під час використання
  workflow як оркестратора ремонту лише plugins

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки із секретами
  вимагають, щоб розв’язаний коміт був досяжний з гілки OpenClaw або
  тегу випуску.

Правила:

- Стабільні та коригувальні теги можуть публікуватися або до `beta`, або до `latest`
- Теги передвипуску alpha можуть публікуватися лише до `alpha`
- Теги передвипуску beta можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` вхідний повний SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що й під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного випуску npm

Під час підготовки стабільного випуску npm:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тегу можна використати поточний повний SHA коміту гілки workflow
     для dry run preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спершу beta, або `latest` лише
   коли ви навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на гілці випуску, тегу випуску або повному
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на ref випуску
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує зовнішні plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо випуск потрапив на `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для просування цієї стабільної версії з `beta` до `latest`
8. Якщо випуск навмисно опубліковано напряму до `latest`, а `beta`
   має негайно вказувати на ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag розміщена у приватному репозиторії з міркувань безпеки, бо вона досі
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і прямий шлях публікації, і шлях просування спершу beta
задокументованими та видимими для операторів.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди CLI 1Password (`op`)
лише всередині окремої tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; утримання цього в tmux робить prompts,
alerts і обробку OTP спостережуваними та запобігає повторним alert на хості.

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

Maintainers використовують приватну документацію випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
