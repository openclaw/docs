---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск валідації релізу або приймання пакета
    - Шукаєте інформацію про іменування версій і періодичність випусків
summary: Релізні доріжки, контрольний список оператора, валідаційні бокси, іменування версій і ритм
title: Політика випусків
x-i18n:
    generated_at: "2026-05-02T22:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- стабільний: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- бета: теги попередніх випусків, які публікуються в npm `beta`
- розробницький: рухома голова `main`

## Іменування версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний підвищений стабільний npm-випуск
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та стабільні коригувальні випуски типово публікуються в npm `beta`; оператори випуску можуть явно націлити `latest` або пізніше підвищити перевірену бета-збірку
- Кожен стабільний випуск OpenClaw постачається разом із npm-пакетом і застосунком для macOS;
  бета-випуски зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію застосунку для Mac залишають для стабільного випуску, якщо це не запитано явно

## Каденція випусків

- Випуски рухаються спершу через бета-версію
- Стабільний випуск виходить лише після перевірки останньої бета-версії
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже було надіслано або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого бета-тега
- Детальна процедура випуску, затвердження, облікові дані та примітки щодо відновлення
  призначені лише для супровідників

## Контрольний список оператора випуску

Цей контрольний список описує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються в
інструкції з випуску лише для супровідників.

1. Почніть із поточної `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб створювати від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте його, надішліть і ще раз виконайте rebase/pull
   перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тега, запустіть
   `pnpm plugins:sync`, щоб опубліковані пакети Plugin мали спільну версію випуску
   та метадані сумісності, а потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тега
   повний 40-символьний SHA гілки випуску дозволено для попередньої перевірки лише з метою валідації.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ випуску: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не проходить, виправте в гілці випуску та повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Повторно запускайте весь umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії створіть тег `vYYYY.M.D-beta.N`, потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спершу публікує всі опубліковані пакети Plugin в npm, потім публікує той самий
   набір у ClawHub, а далі підвищує підготовлений артефакт попередньої перевірки OpenClaw npm
   з відповідним dist-tag. Після публікації запустіть післяпублікаційне приймання пакета
   для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований попередній випуск потребує виправлення,
   створіть наступний відповідний номер попереднього випуску; не видаляйте й не переписуйте старий
   попередній випуск.
10. Для стабільного випуску продовжуйте лише після того, як перевірена бета-версія або реліз-кандидат матиме
    потрібні докази валідації. Публікація стабільного npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність стабільного випуску для macOS також вимагає наявності
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть післяпублікаційний перевіряльник npm, необов’язковий автономний
    E2E для опублікованого npm Telegram, коли потрібен післяпублікаційний доказ каналу,
    підвищення dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і пакет Control UI існували для кроку перевірки
  пакування
- Запустіть `pnpm plugins:sync` після підняття версії в корені та перед тегуванням. Він
  оновлює версії пакетів публіковних plugin, метадані сумісності OpenClaw peer/API,
  метадані збірки та заготовки журналів змін plugin відповідно до версії основного
  релізу. `pnpm plugins:sync:check` є незмінювальним релізним запобіжником;
  workflow публікації завершується помилкою перед будь-якою зміною реєстру, якщо цей крок було
  забуто.
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для smoke-перевірки встановлення, приймання пакета, наборів
  release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає package
  Telegram E2E проти артефакту `release-package-under-test` із перевірок релізу.
  Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E також має підтвердити опублікований npm-пакет. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має запускати свою матрицю пакетів/оновлень проти доставленого npm-пакета замість
  артефакту, зібраного з SHA. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен доказ стороннім каналом
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`
  для пакування довіреної гілки/тега/SHA `package_ref` з поточним
  каркасом `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском
  GitHub Actions. Workflow зіставляє кандидата з
  `package-under-test`, повторно використовує планувальник Docker E2E release проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли вибрані
  Docker lanes містять `published-upgrade-survivor`, артефакт пакета є кандидатом, а
  `published_upgrade_survivor_baseline` вибирає опублікований базовий рівень.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/каналу/агента, мережі Gateway і перезавантаження конфігурації
  - `package`: lanes пакета/оновлення/plugin, нативні для артефакту, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для кандидата релізу. Ручні запуски CI обходять changed scoping і примусово запускають
  Linux Node shards, shards bundled-plugin, контрактні перевірки каналів,
  сумісність Node 22, `check`, `check-additional`, smoke-збірку,
  перевірки документації, Python skills, Windows, macOS, Android і lanes i18n
  Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час перевірки релізної телеметрії. Він проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без потреби в
  Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Запустіть `OpenClaw Release Publish` для послідовності змінювальної публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікується
  тег, досяжний з main), передайте тег релізу та успішний OpenClaw npm
  `preflight_run_id`, і залишайте типовий обсяг публікації plugin
  `all-publishable`, якщо навмисно не запускаєте сфокусоване виправлення. Workflow
  серіалізує публікацію plugin npm, публікацію plugin ClawHub і публікацію OpenClaw
  npm, щоб основний пакет не було опубліковано раніше за його зовнішні
  plugin.
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає lane паритету QA Lab mock плюс швидкий
  live-профіль Matrix і lane Telegram QA перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує оренди облікових даних Convex CI.
  Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Cross-OS перевірка встановлення та оновлення runtime є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  повторно використовуваний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте справжній шлях npm-релізу коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки залишаються у власному
  lane, щоб вони не затримували й не блокували публікацію
- Релізні перевірки з секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  зіставлений коміт досяжний з гілки OpenClaw або релізного тега
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-branch без вимоги надісланого тега
- Цей шлях SHA призначений лише для валідації та не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все ще потребує справжнього релізного тега
- Обидва workflow залишають шлях реальної публікації та просування на GitHub-hosted
  runners, тоді як незмінювальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-релізу більше не чекає на окремий lane release checks
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після публікації npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити шлях встановлення з опублікованого реєстру
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і справжній Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові запуски maintainer можуть опускати Convex vars і передавати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainer можуть запускати ту саму післяпублікаційну перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи типово йдуть у `beta`
  - стабільна npm-публікація може явно націлюватися на `latest` через workflow input
  - token-based зміна npm dist-tag тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації; коли тег існує лише в
    release branch, але workflow запускається з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - справжня приватна публікація mac має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - шляхи реальної публікації просувають підготовлені артефакти замість повторної
    їх збірки
- Для стабільних корекційних релізів на кшталт `YYYY.M.D-N` післяпублікаційний verifier
  також перевіряє той самий шлях оновлення temp-prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб корекції релізу не могли непомітно залишити старіші глобальні встановлення на
  базовому стабільному payload
- Передрелізна перевірка npm-релізу завершується помилкою за замовчуванням, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не доставили порожню browser dashboard
- Післяпублікаційна перевірка також перевіряє, що опубліковані entrypoints plugin і
  метадані пакета присутні в установленому макеті реєстру. Реліз, який
  доставляє відсутні runtime payloads plugin, провалює postpublish verifier і
  не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  кандидатного tarball оновлення, щоб installer e2e ловив випадкове роздуття пакета
  перед шляхом публікації релізу
- Якщо релізна робота зачепила планування CI, timing manifests plugin або
  матриці тестів plugin, перегенеруйте та перегляньте outputs матриці
  `plugin-prerelease-extension-shard`, що належить planner, з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий макет CI
- Готовність стабільного macOS-релізу також включає поверхні updater:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після публікації
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного нижнього порога Sparkle build
    для цієї версії релізу

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні тести з
однієї точки входу. Для доказу pinned commit на гілці, що швидко рухається, використовуйте
helper, щоб кожен дочірній workflow запускався з тимчасової гілки, зафіксованої на цільовому
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper надсилає `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що кожен дочірній workflow `headSha`
збігається з цільовим, а потім видаляє тимчасову гілку. Це запобігає випадковому
доведенню новішого дочірнього запуску `main`.

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

Робочий процес визначає цільовий ref, запускає manual `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
окремий package Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. `OpenClaw Release
Checks` далі розгалужується на install smoke, cross-OS release checks, live/E2E Docker
покриття release-path, Package Acceptance з Telegram package QA, QA Lab
parity, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all він пропускається,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальне
зведення verifier містить таблиці найповільніших job для кожного дочірнього запуску, щоб release
manager міг бачити поточний критичний шлях без завантаження журналів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
повної матриці етапів, точних назв workflow job, відмінностей між stable і full profile,
артефактів і ручок для focused rerun.
Дочірні workflow запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу release branch або tag. Окремого input для workflow-ref Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу exact commit на рухомій `main`;
raw commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову branch.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для схвалення релізу
- `full`: stable плюс broad advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити target
ref як `release-package-under-test`, і повторно використовує цей артефакт у
release-path Docker checks і Package Acceptance. Це тримає всі
package-facing boxes на тих самих bytes і уникає повторних package builds.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано repo/org variable, інакше `openai/gpt-5.4`, тому що ця lane
доводить package install, onboarding, gateway startup і один live agent turn,
а не benchmark найповільнішої default model. Ширша live provider
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

Не використовуйте повну umbrella як перший rerun після focused fix. Якщо один box
падає, використовуйте failed child workflow, job, Docker lane, package profile, model
provider або QA lane для наступного proof. Запускайте повну umbrella знову лише тоді, коли
fix змінив спільну release orchestration або зробив попередні all-box evidence
застарілими. Фінальний verifier umbrella повторно перевіряє записані child workflow run
ids, тому після успішного rerun дочірнього workflow повторно запускайте лише failed
parent job `Verify full validation`.

Для обмеженого recovery передайте `rerun_group` в umbrella. `all` — це справжній
release-candidate run, `ci` запускає лише normal CI child, `plugin-prerelease`
запускає лише release-only plugin child, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Focused `npm-telegram` reruns потребують `npm_telegram_package_spec`; full/all runs
з `release_profile=full` використовують release-checks package artifact.

### Vitest

Vitest box — це manual `CI` child workflow. Manual CI навмисно
обходить changed scoping і примусово запускає normal test graph для release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти: "чи source tree пройшов full normal test suite?"
Це не те саме, що release-path product validation. Evidence, які слід зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному target SHA
- назви failed або slow shard з CI jobs під час розслідування regressions
- Vitest timing artifacts, як-от `.artifacts/vitest-shard-timings.json`, коли
  run потребує performance analysis

Запускайте manual CI напряму лише тоді, коли релізу потрібен deterministic normal CI, але
не Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
`install-smoke` workflow. Він валідує release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- full install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, із QR,
  root/gateway та installer/Bun smoke jobs, що запускаються як окремі install-smoke
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
  `bundled-plugin-install-uninstall-0` through
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед rerun. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і rerun commands. Для focused recovery
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Generated rerun commands включають попередні
`package_artifact_run_id` і prepared Docker image inputs, коли вони доступні, щоб
failed lane могла повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від Vitest і Docker
package mechanics.

Release QA Lab coverage включає:

- mock parity lane, що порівнює OpenAI candidate lane з Opus 4.6
  baseline, використовуючи agentic parity pack
- fast live Matrix QA profile, що використовує environment `qa-live-shared`
- live Telegram QA lane, що використовує Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного local proof

Використовуйте цей box, щоб відповісти: "чи реліз поводиться правильно у QA scenarios і
live channel flows?" Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час схвалення релізу. Full Matrix coverage лишається доступним як
manual sharded QA-Lab run, а не default release-critical lane.

### Package

Package box — це installable-product gate. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, валідує
package inventory, записує package version і SHA-256 та тримає
workflow harness ref окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: pack довірену `package_ref` branch, tag або full commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: download HTTPS `.tgz` з обов'язковим `package_sha256`
- `source=artifact`: reuse `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`,
prepared release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` і
`telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale
plugin dependency cleanup, offline plugin fixtures, plugin update і Telegram
package QA проти того самого resolved tarball. Upgrade matrix покриває кожен stable npm-published baseline від `2026.4.23` до `latest`; використовуйте
Package Acceptance з `source=npm` для вже shipped candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
publish. Це GitHub-native
заміна більшої частини package/update coverage, яка раніше потребувала
Parallels. Cross-OS release checks усе ще важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
віддавати перевагу Package Acceptance.

Канонічний checklist для update і plugin validation —
[Тестування updates і plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
plugin install/update, doctor cleanup або published-package migration change.
Exhaustive published update migration з кожного stable package `2026.4.23+` —
це окремий manual `Update Migration` workflow, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Packages до
`2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих
до npm: private QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній persisted `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і config metadata
migration під час `plugins update`. Опублікований package `2026.4.26` може warn
про local build metadata stamp files, які вже були shipped. Пізніші packages
мають відповідати modern package contracts; ті самі gaps провалюють release
validation.

Використовуйте ширші Package Acceptance profiles, коли release question стосується
справжнього installable package:

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
- `custom`: точний список `docker_lanes` для focused reruns

Для доказу Telegram для пакета-кандидата увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Прийнятті пакета. Робочий процес передає
розв’язаний tarball `package-under-test` у лінію Telegram; окремий робочий
процес Telegram і далі приймає опубліковану npm-специфікацію для перевірок
після публікації.

## Автоматизація публікації випуску

`OpenClaw Release Publish` є звичайною змінювальною точкою входу для публікації. Він
оркеструє робочі процеси довіреного видавця в порядку, потрібному для випуску:

1. Отримати тег випуску та визначити SHA його коміту.
2. Перевірити, що тег доступний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Запустити `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Запустити `Plugin ClawHub Release` з тим самим scope і SHA.
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

Стабільна публікація до типового beta dist-tag:

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
лише для цілеспрямованого виправлення або повторної публікації. Для виправлення вибраного Plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish` або запустіть дочірній робочий процес напряму, коли
пакет OpenClaw не має бути опублікований.

## Вхідні дані робочого процесу NPM

`OpenClaw NPM Release` приймає такі контрольовані оператором вхідні дані:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки робочого процесу для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб робочий процес повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типово `beta`

`OpenClaw Release Publish` приймає такі контрольовані оператором вхідні дані:

- `tag`: обов’язковий тег випуску; має вже існувати
- `preflight_run_id`: ідентифікатор успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm-тег для пакета OpenClaw
- `plugin_publish_scope`: типово `all-publishable`; використовуйте `selected` лише
  для цілеспрямованого виправлення
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: типово `true`; встановлюйте `false` лише під час використання
  робочого процесу як оркестратора виправлення лише для Plugin

`OpenClaw Release Checks` приймає такі контрольовані оператором вхідні дані:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки із секретами
  вимагають, щоб розв’язаний коміт був доступний із гілки OpenClaw або
  тегу випуску.

Правила:

- Стабільні та коригувальні теги можуть публікуватися або до `beta`, або до `latest`
- Теги beta prerelease можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` введення повного SHA коміту дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  лише валідаційні
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  робочий процес перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-випуску

Під час створення стабільного npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До існування тегу можна використати поточний повний SHA коміту гілки робочого процесу
     для пробного preflight-запуску лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на гілці випуску, тегу випуску або повному
   SHA коміту, коли потрібне звичайне CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного робочого процесу
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний робочий процес `CI` на ref випуску натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує externalized plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо випуск потрапив у `beta`, використайте приватний робочий процес
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для просування цієї стабільної версії з `beta` до `latest`
8. Якщо випуск навмисно опубліковано безпосередньо до `latest`, а `beta`
   має негайно слідувати за тією самою стабільною збіркою, використайте той самий приватний
   робочий процес, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag розташована в приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і прямий шлях публікації, і шлях просування beta-first
задокументованими та видимими для оператора.

Якщо maintainer має повернутися до локальної npm-автентифікації, запускайте будь-які команди
1Password CLI (`op`) лише всередині окремого сеансу tmux. Не викликайте `op`
безпосередньо з основної shell агента; утримання його всередині tmux робить prompts,
сповіщення та обробку OTP видимими й запобігає повторним сповіщенням хоста.

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
