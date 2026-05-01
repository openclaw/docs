---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки випуску або приймання пакета
    - Шукаєте правила іменування версій і ритм випусків
summary: Канали випуску, контрольний список оператора, середовища перевірки, найменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-05-01T23:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e915840070324f7614c993d20490f0bf4c9b266c57ce74eddfc461e019d3dc07
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- стабільний: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest`, коли це явно запитано
- бета: передвипускні теги, які публікуються в npm `beta`
- розробницький: рухома вершина `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передвипуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний npm-випуск
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та стабільні коригувальні випуски типово публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або просунути перевірену бета-збірку пізніше
- Кожен стабільний випуск OpenClaw постачає npm-пакет і застосунок macOS разом;
  бета-випуски зазвичай спершу перевіряють і публікують шлях npm/package, а
  збирання/підпис/нотаризацію застосунку mac залишають для стабільних випусків, якщо це явно не запитано

## Періодичність випусків

- Випуски рухаються спершу через бета-канал
- Стабільний випуск іде лише після перевірки останньої бета-версії
- Супровідники зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже надіслано або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого бета-тега
- Детальна процедура випуску, погодження, облікові дані та нотатки з відновлення
  доступні лише супровідникам

## Контрольний список оператора випуску

Цей контрольний список показує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкотування залишаються в
посібнику з випуску лише для супровідників.

1. Почніть із поточного `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створювати від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, зберігайте записи орієнтованими на користувача, закомітьте його, надішліть його та виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Підвищте версію в кожному потрібному місці для запланованого тега, потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До створення тега
   для перевіркової попередньої перевірки дозволено повний 40-символьний SHA гілки випуску.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки випуску, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих тестових середовищ випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте в гілці випуску та повторно запустіть найменший невдалий
   файл, канал, завдання workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Повторно запускайте повну парасолькову перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії поставте тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   приймальну перевірку пакета після публікації для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована бета-версія потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару бета-версію.
10. Для стабільного випуску продовжуйте лише після того, як перевірена бета-версія або кандидат випуску матиме
    потрібні докази перевірки. Публікація стабільного npm повторно використовує успішний
    артефакт попередньої перевірки через `preflight_run_id`; готовність стабільного випуску macOS
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть верифікатор npm після публікації, необов’язковий самостійний
    E2E Telegram для опублікованого npm, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Попередня перевірка випуску

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпорту та архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для кроку валідації
  пакування
- Запустіть ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для перевірки встановлення, приймання пакета, наборів
  релізного шляху Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  lanes. З `release_profile=full` і `rerun_group=all` він також запускає пакетний
  Telegram E2E для артефакту `release-package-under-test` з релізних перевірок.
  Надайте `npm_telegram_package_spec` після публікації, коли той самий Telegram E2E
  також має підтвердити опублікований npm-пакет. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібен побічний доказ
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним harness
  `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим SHA-256; або
  `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує релізний планувальник Docker E2E для цього
  tarball і може запускати Telegram QA для того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker lanes містять `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опублікований базовий рівень.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/каналу/агента, мережі Gateway і перезавантаження конфігурації
  - `package`: нативні для артефакту lanes пакета/оновлення/Plugin без OpenWebUI або live ClawHub
  - `product`: профіль пакета плюс канали MCP, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: фрагменти релізного шляху Docker з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для кандидата релізу. Ручні запуски CI обходять changed scoping і примусово запускають
  Linux Node shards, bundled-plugin shards, контракти каналів,
  сумісність Node 22, `check`, `check-additional`, перевірку збірки,
  перевірки документації, Python Skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він перевіряє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Релізні перевірки тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity gate QA Lab плюс швидкий
  live-профіль Matrix і lane Telegram QA перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує leases
  облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Крос-ОС валідація встановлення й оновлення runtime є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` напряму
- Це розділення навмисне: тримати реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у власній
  lane, щоб вони не затримували й не блокували публікацію
- Релізні перевірки з секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт досяжний з гілки OpenClaw або релізного тегу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без вимоги запушеного тегу
- Цей шлях SHA є лише валідаційним і не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно потребує справжнього релізного тегу
- Обидва workflow тримають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane релізних перевірок
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з опублікованого registry
  у свіжому тимчасовому prefix
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  для опублікованого npm-пакета з використанням спільного пулу leased облікових даних Telegram.
  Локальні одноразові запуски maintainers можуть опускати Convex vars і передавати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожному merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути запущений з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - стабільні npm-релізи за замовчуванням спрямовуються на `beta`
  - стабільний npm publish може явно націлюватися на `latest` через workflow input
  - мутація npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    для безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` є лише валідаційним; коли тег існує лише на
    релізній гілці, але workflow запускається з `main`, встановіть
    `public_release_branch=release/YYYY.M.D`
  - реальний приватний mac publish має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи publish просувають підготовлені артефакти замість того, щоб збирати
    їх знову
- Для стабільних correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення temp-prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші глобальні встановлення на
  базовому стабільному payload
- npm release preflight fails closed, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не поставили порожній браузерний dashboard
- Post-publish verification також перевіряє, що опубліковані entrypoints Plugin і
  метадані пакета присутні в установленому registry layout. Реліз, який
  постачає відсутні runtime payloads Plugin, провалює postpublish verifier і
  не може бути promoted до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  candidate update tarball, тож installer e2e ловить випадкове роздуття пакета
  до шляху release publish
- Якщо релізна робота торкалася планування CI, extension timing manifests або
  extension test matrices, повторно згенеруйте й перегляньте planner-owned
  matrix outputs `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність стабільного релізу macOS також включає поверхні оновлювача:
  - GitHub release має врешті містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий стабільний zip після publish
  - запакований app має зберігати non-debug bundle id, непорожню Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї версії релізу

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте релізну
гілку, тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow розв’язує target ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і запускає
окремий пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. `OpenClaw Release
Checks` далі розгалужується на перевірку встановлення, cross-OS release checks, live/E2E Docker
release-path coverage, Package Acceptance з Telegram package QA, паритет QA Lab,
live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
summary `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальний
verifier summary містить таблиці slowest-job для кожного дочірнього запуску, тож release
manager може бачити поточний critical path без завантаження логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation) для
повної матриці етапів, точних назв job workflow, відмінностей між stable і full profile,
артефактів і ручок для сфокусованого повторного запуску.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу релізну гілку або тег. Окремого input workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для схвалення релізу
- `full`: stable плюс broad advisory provider/media coverage

`OpenClaw Release Checks` використовує довірене посилання workflow, щоб один раз розв’язати цільове посилання як `release-package-under-test`, і повторно використовує цей артефакт як у Docker-перевірках release-path, так і в Package Acceptance. Це утримує всі package-facing бокси на тих самих байтах і уникає повторних збірок пакета. Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли змінну repo/org задано, інакше `openai/gpt-5.5`, бо ця лінія доводить установлення пакета, onboarding, запуск Gateway і один live agent turn, а не бенчмарк найповільнішої стандартної моделі. Ширша матриця live provider залишається місцем для покриття, специфічного для моделей.

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

Не використовуйте повну парасольку як перший повторний запуск після сфокусованого виправлення. Якщо один бокс падає, використайте невдалий дочірній workflow, job, Docker-лінію, профіль пакета, provider моделі або QA-лінію для наступного доказу. Запускайте повну парасольку знову лише тоді, коли виправлення змінило спільну оркестрацію релізу або зробило попередні докази з усіх боксів застарілими. Фінальний верифікатор парасольки повторно перевіряє записані ids запусків дочірніх workflow, тож після успішного повторного запуску дочірнього workflow повторно запустіть лише невдалий батьківський job `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до парасольки. `all` — це справжній запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease` запускає лише release-only дочірній Plugin, `release-checks` запускає кожен релізний бокс, а вужчі релізні групи — це `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`. Сфокусовані повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; повні/all запуски з `release_profile=full` використовують артефакт пакета release-checks.

### Vitest

Бокс Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно обходить changed scoping і примусово запускає звичайний граф тестів для release candidate: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей бокс, щоб відповісти: «чи пройшло дерево вихідного коду повний звичайний набір тестів?» Це не те саме, що product validation на release-path. Докази, які потрібно зберегти:

- зведення `Full Release Validation`, що показує URL відправленого запуску `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shard із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але не Docker, QA Lab, live, cross-OS або package бокси:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Бокс Docker живе в `OpenClaw Release Checks` через `openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode workflow `install-smoke`. Він перевіряє release candidate через запаковані Docker-середовища, а не лише тести на рівні вихідного коду.

Покриття Release Docker включає:

- повний install smoke із увімкненим повільним Bun global install smoke
- підготовку/повторне використання smoke image кореневого Dockerfile за цільовим SHA, з QR, root/gateway та installer/Bun smoke jobs, що запускаються як окремі install-smoke shards
- repository E2E lanes
- Docker chunks release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли його запитано
- розділені лінії встановлення/видалення bundled plugin
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker-артефакти перед повторним запуском. Планувальник release-path завантажує `.artifacts/docker-tests/` з логами ліній, `summary.json`, `failures.json`, таймінгами фаз, JSON плану планувальника та командами повторного запуску. Для сфокусованого відновлення використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередні `package_artifact_run_id` і prepared Docker image inputs, коли доступні, тож невдала лінія може повторно використати той самий tarball і GHCR images.

### QA Lab

Бокс QA Lab також є частиною `OpenClaw Release Checks`. Це agentic behavior і channel-level release gate, окремий від Vitest і механіки Docker package.

Покриття Release QA Lab включає:

- mock parity gate, що порівнює OpenAI candidate lane з Opus 4.6 baseline за допомогою agentic parity pack
- швидкий live Matrix QA profile з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей бокс, щоб відповісти: «чи поводиться реліз правильно у QA scenarios і live channel flows?» Зберігайте URL артефактів для parity, Matrix і Telegram lanes під час схвалення релізу. Повне покриття Matrix залишається доступним як ручний sharded QA-Lab run, а не стандартна release-critical lane.

### Пакет

Бокс Package — це installable-product gate. Він підтримується `Package Acceptance` і resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє package inventory, записує версію пакета і SHA-256 та тримає workflow harness ref окремо від package source ref.

Підтримувані джерела candidate:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: pack довірену `package_ref` branch, tag або full commit SHA з вибраним `workflow_ref` harness
- `source=url`: download HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance з `source=artifact`, підготовленим артефактом release package, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` і `telegram_mode=mock-openai`. Package Acceptance тримає migration, update, stale Plugin dependency cleanup, offline Plugin fixtures, Plugin update і Telegram package QA проти того самого розв’язаного tarball. Це GitHub-native заміна для більшості покриття package/update, яке раніше вимагало Parallels. Cross-OS release checks досі важливі для OS-specific onboarding, installer і platform behavior, але product validation package/update має віддавати перевагу Package Acceptance.

Канонічний checklist для update і Plugin validation —
[Тестування оновлень і Plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить plugin install/update, doctor cleanup або published-package migration change. Вичерпна published update migration з кожного stable пакета `2026.4.23+` — це окремий ручний workflow `Update Migration`, а не частина Full Release CI.

Legacy package-acceptance leniency навмисно обмежена в часі. Пакети до `2026.4.25` можуть використовувати compatibility path для metadata gaps, уже опублікованих в npm: private QA inventory entries, відсутні в tarball, відсутній `gateway install --wrapper`, відсутні patch files у tarball-derived git fixture, відсутній збережений `update.channel`, legacy plugin install-record locations, відсутня marketplace install-record persistence і config metadata migration під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати про local build metadata stamp files, які вже були відвантажені. Пізніші пакети мають відповідати сучасним package contracts; ті самі прогалини провалюють release validation.

Використовуйте ширші профілі Package Acceptance, коли релізне питання стосується фактичного installable package:

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

- `smoke`: швидкі package install/channel/agent, gateway network і config reload lanes
- `package`: контракти install/update/plugin package без live ClawHub; це стандарт release-check
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або `telegram_mode=live-frontier` у Package Acceptance. Workflow передає розв’язаний tarball `package-under-test` у Telegram lane; standalone Telegram workflow досі приймає published npm spec для post-publish checks.

## Вхідні параметри NPM workflow

`OpenClaw NPM Release` приймає такі operator-controlled inputs:

- `tag`: обов’язковий release tag, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний workflow-branch commit SHA для validation-only preflight
- `preflight_only`: `true` для validation/build/package only, `false` для
  справжнього publish path
- `preflight_run_id`: обов’язковий на справжньому publish path, щоб workflow повторно використовував
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для publish path; стандартно `beta`

`OpenClaw Release Checks` приймає такі operator-controlled inputs:

- `ref`: branch, tag або full commit SHA для перевірки. Secret-bearing checks
  потребують, щоб розв’язаний commit був reachable з OpenClaw branch або
  release tag.

Правила:

- Stable і correction tags можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` вхідний full commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  validation-only
- Справжній publish path має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє, що metadata before publish продовжується

## Послідовність stable npm release

Під час підготовки stable npm release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тегу можна використати поточний повний SHA коміту гілки workflow
     для пробного запуску workflow попередньої перевірки лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного потоку спочатку `beta`, або `latest` лише
   коли ви навмисно хочете виконати пряму стабільну публікацію
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   SHA коміту, коли вам потрібне звичайне CI разом із покриттям live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` ще раз із `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив на `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо в `latest`, а `beta`
   має негайно відповідати тій самій стабільній збірці, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   самовідновлюваній синхронізації перемістити `beta` пізніше

Мутація dist-tag розташована в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає як шлях прямої публікації, так і шлях просування спочатку через beta
задокументованими й видимими для оператора.

Якщо maintainer мусить повернутися до локальної автентифікації npm, запускайте будь-які команди 1Password
CLI (`op`) лише всередині окремої сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; утримання його всередині tmux робить prompts,
alerts і обробку OTP видимими та запобігає повторним alerts хоста.

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
