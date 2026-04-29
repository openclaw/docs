---
read_when:
    - Пошук визначень загальнодоступних каналів випуску
    - Запуск перевірки релізу або приймального тестування пакета
    - Пошук правил іменування версій і періодичності випусків
summary: Релізні лінії, контрольний список оператора, бокси валідації, іменування версій і каденція
title: Політика випусків
x-i18n:
    generated_at: "2026-04-29T10:40:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815c4bffe7930384584533e934996592114af510ebd775fc873086d63c74203f
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні гілки релізів:

- stable: позначені тегами релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- beta: передрелізні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального стабільного релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця чи дня
- `latest` означає поточний просунутий стабільний npm-реліз
- `beta` означає поточну ціль встановлення beta
- Стабільні та коригувальні стабільні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлитися на `latest` або пізніше просунути перевірену beta-збірку
- Кожен стабільний реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризація Mac-застосунку лишаються для стабільних релізів, якщо їх явно не запитано

## Частота релізів

- Релізи рухаються спочатку через beta
- Стабільний реліз виходить лише після перевірки останньої beta
- Мейнтейнери зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення чи повторного створення старого beta-тега
- Докладна процедура релізу, схвалення, облікові дані та нотатки з відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора релізу

Цей контрольний список є публічною формою релізного процесу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і подробиці екстреного відкату лишаються в
релізному runbook лише для мейнтейнерів.

1. Почніть із поточного `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити з нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувачів, закомітьте їх, надішліть і виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тега, потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   повний 40-символьний SHA релізної гілки дозволений для попередньої перевірки лише з метою валідації.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   релізної гілки, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих релізних тестових середовищ: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте в релізній гілці й повторно запустіть найменший невдалий
   файл, гілку, завдання workflow, профіль пакета, провайдера або allowlist моделей, що
   доводить виправлення. Повторно запускайте повну umbrella-перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta позначте тегом `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   post-publish package acceptance проти опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для стабільного релізу продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази перевірки. Стабільна npm-публікація повторно використовує успішний
    артефакт попередньої перевірки через `preflight_run_id`; готовність стабільного релізу macOS
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий автономний
    published-npm Telegram E2E, коли потрібен post-publish доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Попередня перевірка релізу

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів імпортів і архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані релізні артефакти `dist/*` і бандл Control UI існували для кроку валідації пакування
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб запустити всі передрелізні test boxes з однієї точки входу. Він приймає гілку, тег або повний SHA коміту, запускає ручний `CI` і запускає `OpenClaw Release Checks` для install smoke, package acceptance, наборів release-path для Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram lanes. Надавайте `npm_telegram_package_spec` лише після публікації пакета, коли також потрібно виконати post-publish Telegram E2E. Надавайте `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що валідація відповідає опублікованому npm-пакету, не примушуючи запускати Telegram E2E. Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен доказ із побічного каналу для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`, щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub Actions. Workflow визначає кандидата як `package-under-test`, повторно використовує планувальник Docker E2E релізу для цього tarball і може запускати Telegram QA для того самого tarball з `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/каналу/агента, мережі Gateway і перезавантаження конфігурації
  - `package`: lanes пакета/оновлення/Plugin, нативні для артефакта, без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent, вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI для кандидата релізу. Ручні запуски CI обходять changed scoping і примусово вмикають Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, перевірки документації, Python skills, Windows, macOS, Android і lanes Control UI i18n.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він проганяє QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані назви trace span, обмежені атрибути та редагування вмісту/ідентифікаторів без потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Релізні перевірки тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity gate QA Lab плюс швидкий live Matrix profile і Telegram QA lane перед схваленням релізу. Live lanes використовують середовище `qa-live-shared`; Telegram також використовує оренди облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix transport, media та E2EE паралельно.
- Cross-OS runtime-валідація встановлення й оновлення є частиною публічних `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: реальний npm release path має залишатися коротким, детермінованим і сфокусованим на артефактах, тоді як повільніші live checks залишаються у власній lane, щоб не затримувати й не блокувати публікацію
- Релізні перевірки із секретами слід запускати через `Full Release Validation` або з workflow ref `main`/release, щоб логіка workflow і секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо визначений коміт досяжний з гілки OpenClaw або релізного тегу
- validation-only preflight `OpenClaw NPM Release` також приймає поточний повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тегу
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у реальну публікацію
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки метаданих пакета; реальна публікація все одно потребує справжнього релізного тегу
- Обидва workflow залишають реальний шлях публікації й просування на GitHub-hosted runners, тоді як немутаційний шлях валідації може використовувати більші Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow-секретів `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane релізних перевірок
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити опублікований шлях встановлення з registry у свіжому тимчасовому префіксі
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram. Локальні одноразові запуски мейнтейнерів можуть опускати змінні Convex і передавати три облікові дані env `OPENCLAW_QA_TELEGRAM_*` напряму.
- Мейнтейнери можуть запустити таку саму post-publish перевірку з GitHub Actions через ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і не запускається на кожному merge.
- Релізна автоматизація мейнтейнерів тепер використовує preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має запускатися з тієї самої гілки `main` або `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи типово використовують `beta`
  - стабільна npm-публікація може явно цілитися в `latest` через workflow input
  - token-based мутація npm dist-tag тепер розміщена в `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` з міркувань безпеки, оскільки `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` є validation-only
  - реальна приватна mac publish має пройти успішні приватні mac `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість повторної перебудови
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier також перевіряє той самий шлях оновлення temp-prefix з `YYYY.M.D` до `YYYY.M.D-N`, щоб release corrections не могли непомітно залишити старі глобальні встановлення на базовому stable payload
- npm release preflight fails closed, якщо tarball не містить і `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`, щоб ми знову не відправили порожню браузерну dashboard
- Post-publish verification також перевіряє, що опубліковане встановлення з registry містить непорожні runtime-залежності bundled plugin під кореневою розкладкою `dist/*`. Реліз, який постачається з відсутніми або порожніми dependency payloads bundled plugin, не проходить postpublish verifier і не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет `unpackedSize` npm pack для candidate update tarball, щоб installer e2e виявляв випадкове роздування пакета до release publish path
- Якщо релізна робота торкнулася планування CI, timing manifests розширень або test matrices розширень, регенеруйте й перегляньте outputs matrix `plugin-prerelease-extension-shard`, якими володіє planner, з `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не описували застарілий layout CI
- Готовність стабільного macOS-релізу також включає поверхні updater:
  - GitHub release має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після publish
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor для цієї релізної версії

## Релізні test boxes

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте релізну гілку, тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow визначає target ref, запускає ручний `CI` з `target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і за потреби запускає автономний post-publish Telegram E2E, коли задано `npm_telegram_package_spec`. Потім `OpenClaw Release Checks` розгалужується на install smoke, cross-OS release checks, live/E2E Docker release-path coverage, Package Acceptance з Telegram package QA, паритет QA Lab, live Matrix і live Telegram. Повний запуск є прийнятним лише тоді, коли summary `Full Release Validation` показує `normal_ci` і `release_checks` як успішні, а будь-який необов’язковий child `npm_telegram` або успішний, або навмисно пропущений. Фінальна verifier summary містить таблиці найповільніших jobs для кожного child run, щоб release manager міг бачити поточний critical path без завантаження логів.
Child workflows запускаються з довіреного ref, який виконує `Full Release Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на старішу релізну гілку або тег. Окремого workflow-ref input для Full Release Validation немає; обирайте довірений harness, обираючи workflow run ref.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс стабільне покриття provider/backend для схвалення релізу
- `full`: stable плюс широке advisory покриття provider/media

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити target ref як `release-package-under-test`, і повторно використовує цей артефакт як у Docker checks release-path, так і в Package Acceptance. Це утримує всі package-facing boxes на тих самих байтах і уникає повторних збірок пакета.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Валідуйте неопубліковану гілку кандидата релізу.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Валідуйте точний запушений коміт.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Після публікації beta додайте Telegram E2E для опублікованого пакета.
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
зазнає збою, використовуйте невдалий дочірній робочий процес, завдання, Docker-ланку, профіль пакета, постачальника
моделі або QA-ланку для наступного підтвердження. Запускайте повну парасольку знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази з усіх боксів
застарілими. Фінальний перевіряльник парасольки повторно перевіряє записані id запусків дочірніх робочих процесів,
тому після успішного повторного запуску дочірнього робочого процесу повторно запустіть лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` — це справжній
запуск реліз-кандидата, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише релізний дочірній процес плагіна, `release-checks` запускає кожен релізний
бокс, а вужчі релізні групи — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`, коли надано
окрему пакетну Telegram-ланку.

### Vitest

Бокс Vitest — це ручний дочірній робочий процес `CI`. Ручний CI навмисно
оминає звуження за змінами та примусово запускає звичайний тестовий граф для реліз-кандидата:
Linux Node-шарди, шарди вбудованих плагінів, контракти каналів, сумісність із Node 22,
`check`, `check-additional`, build smoke, перевірки документації, Python Skills, Windows,
macOS, Android і i18n Control UI.

Використовуйте цей бокс, щоб відповісти на запитання: "чи пройшло дерево вихідного коду повний звичайний набір тестів?"
Це не те саме, що продуктова валідація релізного шляху. Докази, які потрібно зберігати:

- зведення `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних шардів із завдань CI під час дослідження регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не потрібні Docker, QA Lab, live, cross-OS або пакетні бокси:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Бокс Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у релізному режимі робочого процесу
`install-smoke`. Він перевіряє реліз-кандидат через пакетовані
Docker-середовища, а не лише тести на рівні вихідного коду.

Релізне Docker-покриття включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- E2E-ланки репозиторію
- Docker-фрагменти релізного шляху: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` і
  `bundled-channels-contracts`
- покриття OpenWebUI всередині фрагмента `plugins-runtime-services`, коли його запитано
- розділені ланки залежностей вбудованих каналів між channel-smoke, update-target
  і фрагментами контрактів setup/runtime замість одного великого завдання для вбудованих каналів
- розділені ланки встановлення/видалення вбудованих плагінів
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-23`
- live/E2E-набори постачальників і Docker live-покриття моделей, коли релізні перевірки
  включають live-набори

Використовуйте Docker-артефакти перед повторним запуском. Планувальник релізного шляху завантажує
`.artifacts/docker-tests/` із журналами ланок, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника та командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у багаторазовому live/E2E-робочому процесі замість
повторного запуску всіх релізних фрагментів. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені вхідні дані Docker-образів, коли вони доступні, щоб
невдала ланка могла повторно використати той самий tarball і GHCR-образи.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це релізний гейт
агентної поведінки та рівня каналів, окремий від механіки пакетів Vitest і Docker.

Релізне покриття QA Lab включає:

- mock parity gate, що порівнює кандидатну ланку OpenAI з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA-профіль із використанням середовища `qa-live-shared`
- live Telegram QA-ланку з використанням оренд облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли релізній телеметрії потрібне явне локальне підтвердження

Використовуйте цей бокс, щоб відповісти на запитання: "чи поводиться реліз правильно в QA-сценаріях і
live-потоках каналів?" Зберігайте URL артефактів для ланок parity, Matrix і Telegram
під час схвалення релізу. Повне Matrix-покриття залишається доступним як
ручний шардований запуск QA-Lab, а не типова релізно-критична ланка.

### Пакет

Бокс Package — це гейт інстальованого продукту. Він спирається на
`Package Acceptance` і резолвер
`scripts/resolve-openclaw-package-candidate.mjs`. Резолвер нормалізує
кандидат у tarball `package-under-test`, який споживає Docker E2E, перевіряє
інвентар пакета, записує версію пакета та SHA-256 і тримає ref обв'язки
робочого процесу окремо від ref вихідного коду пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна релізна
  версія OpenClaw
- `source=ref`: запакувати довірену гілку `package_ref`, тег або повний commit SHA
  з вибраною обв'язкою `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов'язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Docker-фрагменти релізного шляху покривають
перетин ланок install, update і plugin-update; Package Acceptance зберігає
артефактно-нативну сумісність вбудованих каналів, офлайн-фікстури плагінів і Telegram
package QA щодо того самого розв'язаного tarball. Це GitHub-нативна
заміна більшої частини покриття package/update, яке раніше вимагало
Parallels. Cross-OS release checks усе ще важливі для OS-специфічного onboarding,
інсталятора та поведінки платформи, але продуктова валідація package/update має
віддавати перевагу Package Acceptance.

Пом'якшення legacy package-acceptance навмисно обмежене в часі. Пакети до
`2026.4.25` включно можуть використовувати шлях сумісності для прогалин метаданих, уже опублікованих
у npm: приватні QA-записи інвентарю, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball,
відсутній збережений `update.channel`, legacy-розташування install-record плагінів,
відсутня сталість marketplace install-record і міграція метаданих config
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про локальні файли штампу метаданих збірки, які вже були відвантажені. Пізніші пакети
мають відповідати сучасним контрактам пакета; ті самі прогалини провалюють релізну
валідацію.

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

Поширені профілі пакета:

- `smoke`: швидкі ланки встановлення пакета/каналу/агента, gateway-мережі та
  перезавантаження config
- `package`: контракти install/update/plugin package без live ClawHub; це типовий варіант release-check
- `product`: `package` плюс MCP-канали, cron/очищення subagent, OpenAI web
  search і OpenWebUI
- `full`: Docker-фрагменти релізного шляху з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram-підтвердження увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Робочий процес передає
розв'язаний tarball `package-under-test` у Telegram-ланку; окремий
Telegram-робочий процес і далі приймає опубліковану npm-специфікацію для post-publish-перевірок.

## Вхідні дані робочого процесу NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов'язковий релізний тег, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки робочого процесу для preflight лише з валідацією
- `preflight_only`: `true` лише для validation/build/package, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов'язковий на справжньому шляху публікації, щоб робочий процес повторно використовував
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типово `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: гілка, тег або повний commit SHA для валідації. Перевірки із секретами
  вимагають, щоб розв'язаний коміт був досяжним із гілки OpenClaw або
  релізного тегу.

Правила:

- Стабільні та корекційні теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` вхідний повний commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  лише валідаційні
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  робочий процес перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного npm-релізу

Під час випуску стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` із `preflight_only=true`
   - До створення тегу можна використати поточний повний commit SHA гілки робочого процесу
     для валідаційного dry run preflight-робочого процесу
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first-потоку або `latest` лише
   тоді, коли ви навмисно хочете прямої стабільної публікації
3. Запустіть `Full Release Validation` на релізній гілці, релізному тегу або повному
   commit SHA, коли потрібне звичайне CI-покриття плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного робочого процесу
4. Якщо вам навмисно потрібен лише детермінований звичайний тестовий граф, запустіть
   ручний робочий процес `CI` на релізному ref
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використовуйте приватний
   робочий процес `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано прямо в `latest` і `beta`
   має негайно вказувати на ту саму стабільну збірку, використовуйте той самий приватний
   робочий процес, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   self-healing-синхронізації перемістити `beta` пізніше

Мутація dist-tag живе у приватному репозиторії з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і шлях beta-first-просування
задокументованими та видимими для оператора.

Якщо мейнтейнер мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині виділеної tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; утримання цього всередині tmux робить prompts,
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

Супровідники використовують приватну документацію до релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний регламент виконання.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
