---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки релізу або приймання пакета
    - Пошук іменування версій і періодичності випусків
summary: Канали випуску, контрольний список оператора, середовища валідації, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-28T11:24:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4bd434932d33d2eefb71c82e2349e370ab2d39f470dba3ff8ffe9a4c317c2191
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали релізів:

- стабільний: позначені тегами релізи, які типово публікуються в npm `beta`, або в npm `latest` за явним запитом
- бета: передрелізні теги, які публікуються в npm `beta`
- розробницький: рухома головна версія `main`

## Назви версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний просунутий стабільний npm-реліз
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та стабільні коригувальні релізи типово публікуються в npm `beta`; оператори релізу можуть явно вибрати `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний реліз OpenClaw постачається разом з npm-пакетом і macOS-застосунком;
  бета-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризацію mac-застосунку лишають для стабільного релізу, якщо це не запитано явно

## Періодичність релізів

- Релізи рухаються спершу через бета-версію
- Стабільний реліз виходить лише після перевірки останньої бета-версії
- Мейнтейнери зазвичай роблять релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу й виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже запушено або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення чи повторного створення старого бета-тега
- Докладна процедура релізу, погодження, облікові дані та нотатки щодо відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора релізу

Цей контрольний список показує публічну форму процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і подробиці аварійного відкату залишаються в
релізному регламенті лише для мейнтейнерів.

1. Почніть із поточного `main`: підтягніть останні зміни, переконайтеся, що цільовий коміт запушено,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб відгалузитися від нього.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте, запуште й виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно зберігають.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Підвищте версію в усіх потрібних місцях для запланованого тега, потім запустіть
   локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   для перевірочної попередньої валідації дозволено повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки релізу, тега або повного SHA коміта. Це єдина ручна точка входу
   для чотирьох великих релізних тестових блоків: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте проблему в гілці релізу й перезапустіть найменший невдалий
   файл, канал, job workflow, профіль пакета, провайдера або allowlist моделі, що
   доводить виправлення. Перезапускайте повну парасолькову перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   post-publish приймання пакета для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо запушена або опублікована бета потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару бета-версію.
10. Для стабільного релізу продовжуйте лише після того, як перевірена бета або реліз-кандидат матиме
    потрібні докази валідації. Стабільна npm-публікація повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність стабільного macOS-релізу
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, за потреби додатковий автономний
    опублікований-npm Telegram E2E, коли потрібен post-publish доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Попередня перевірка релізу

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку
  валідації пакування
- Запустіть ручний workflow `Full Release Validation` перед затвердженням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для перевірки встановлення, приймання пакета, наборів
  release-path для Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  lane-ів. Надавайте `npm_telegram_package_spec` лише після того, як пакет було
  опубліковано і також має виконатися post-publish Telegram E2E. Надавайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний workflow `Package Acceptance`, коли потрібне side-channel підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow резолвить кандидата в
  `package-under-test`, повторно використовує планувальник Docker E2E release проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lane-и встановлення/channel/agent, мережі Gateway і перезавантаження конфігурації
  - `package`: artifact-native lane-и пакета/оновлення/Plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: chunks Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний workflow `CI` напряму, коли потрібне лише повне звичайне покриття CI
  для кандидата релізу. Ручні CI dispatch обходять changed scoping
  і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python skills, Windows, macOS, Android і lane-и i18n
  Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke`, коли валідуєте релізну телеметрію. Він перевіряє
  QA-lab через локальний OTLP/HTTP receiver і верифікує експортовані назви trace
  span, обмежені атрибути та редагування контенту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Релізні перевірки тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity gate QA Lab плюс швидкий
  live-профіль Matrix і lane Telegram QA перед затвердженням релізу. Live
  lane-и використовують середовище `qa-live-shared`; Telegram також використовує оренди
  облікових даних Convex CI. Запустіть ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар
  транспорту Matrix, медіа та E2EE паралельно.
- Крос-OS валідація встановлення й оновлення runtime є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  перевикористовуваний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний шлях npm-релізу коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки залишаються у
  власному lane, щоб вони не затримували й не блокували публікацію
- Релізні перевірки з секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  резолвлений коміт доступний з гілки OpenClaw або релізного тегу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-branch без вимоги запушеного тегу
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у реальну публікацію
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно вимагає реального релізного тегу
- Обидва workflow залишають реальний шлях публікації та просування на GitHub-hosted
  runners, тоді як немутуючий шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-релізу більше не чекає на окремий lane релізних перевірок
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед затвердженням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з опублікованого registry
  у свіжому тимчасовому префіксі
- Після beta publish запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові запуски maintainer-ів можуть опустити змінні Convex і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainer-и можуть запустити ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається при кожному merge.
- Автоматизація релізів maintainer-ів тепер використовує preflight-then-promote:
  - реальна npm publish має пройти успішний npm `preflight_run_id`
  - реальна npm publish має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases за замовчуванням використовують `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - мутація npm dist-tag на основі токена тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` все ще потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає лише OIDC publish
  - публічний `macOS Release` є лише validation-only
  - реальний приватний mac publish має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість того, щоб повторно
    їх збирати
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старі глобальні встановлення на
  базовому stable payload
- Передрелізна перевірка npm-релізу fails closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожню browser dashboard
- Post-publish verification також перевіряє, що встановлення з опублікованого registry
  містить непорожні bundled plugin runtime deps під кореневою структурою `dist/*`.
  Реліз, який постачається з відсутніми або порожніми bundled plugin
  dependency payloads, не проходить postpublish verifier і не може бути promoted
  to `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет npm pack `unpackedSize` для
  candidate update tarball, щоб installer e2e ловив випадкове pack bloat
  до release publish path
- Якщо релізна робота зачепила планування CI, timing manifests розширень або
  test matrices розширень, згенеруйте заново й перегляньте належні planner-у
  workflow matrix outputs `checks-node-extensions` з `.github/workflows/ci.yml`
  перед затвердженням, щоб release notes не описували застарілий layout CI
- Готовність stable macOS release також включає поверхні updater:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований застосунок має зберігати non-debug bundle id, непорожню Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї релізної версії

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow резолвить target ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
опціонально запускає standalone post-publish Telegram E2E, коли
`npm_telegram_package_spec` встановлено. Потім `OpenClaw Release Checks` розгортає
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як successful, а будь-який опціональний
child `npm_telegram` або successful, або навмисно skipped. Фінальний
verifier summary містить таблиці slowest-job для кожного child run, щоб release
manager міг бачити поточний critical path без завантаження logs.
Child workflows запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу release branch або tag. Окремого Full Release Validation
workflow-ref input немає; вибирайте довірений harness, вибираючи workflow run ref.

Використовуйте `release_profile`, щоб вибрати live/provider breadth:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для release approval
- `full`: stable плюс широкий advisory provider/media coverage

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз резолвити target
ref як `release-package-under-test`, і повторно використовує цей артефакт як у
release-path Docker checks, так і в Package Acceptance. Це тримає всі
package-facing boxes на тих самих байтах і уникає повторних package builds.

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

Не використовуйте повну парасольку як перший повторний запуск після сфокусованого виправлення. Якщо один бокс
падає, використайте невдалий дочірній робочий процес, завдання, Docker-лінію, профіль пакета, модельного
провайдера або QA-лінію для наступного доказу. Запускайте повну парасольку знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази всіх боксів
застарілими. Фінальний верифікатор парасольки повторно перевіряє записані ідентифікатори запусків
дочірніх робочих процесів, тож після успішного повторного запуску дочірнього робочого процесу повторно запустіть лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` у парасольку. `all` — це справжній
запуск реліз-кандидата, `ci` запускає лише звичайний дочірній CI, `release-checks` запускає
кожен релізний бокс, а вужчі релізні групи — це `install-smoke`,
`cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і
`npm-telegram`, коли надано окрему Telegram-лінію пакета.

### Vitest

Vitest-бокс — це ручний дочірній робочий процес `CI`. Ручний CI навмисно
оминає змінену область і примусово запускає звичайний граф тестів для реліз-кандидата:
Linux Node-шарди, шарди вбудованих Plugin, контракти каналів, сумісність із Node 22,
`check`, `check-additional`, build smoke, перевірки документації, Python
skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей бокс, щоб відповісти на запитання "чи пройшло дерево джерел повний звичайний набір тестів?"
Це не те саме, що продуктова валідація релізного шляху. Докази, які треба зберігати:

- зведення `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних шардів із CI-завдань під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI безпосередньо лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker, QA Lab, live, cross-OS або пакетні бокси:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker-бокс живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у релізному режимі робочого процесу
`install-smoke`. Він валідує реліз-кандидата через упаковані
Docker-середовища, а не лише через тести рівня джерел.

Релізне Docker-покриття включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- репозиторні E2E-лінії
- Docker-чанки релізного шляху: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-b` і `bundled-channels-contracts`
- покриття OpenWebUI всередині чанка `plugins-runtime-core`, коли запитано
- розділені лінії залежностей вбудованих каналів між channel-smoke, update-target
  і чанками setup/runtime contract замість одного великого завдання bundled-channel
- розділені лінії встановлення/видалення вбудованих Plugin
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-7`
- live/E2E-набори провайдерів і Docker live model-покриття, коли release checks
  включають live-набори

Використовуйте Docker-артефакти перед повторним запуском. Планувальник релізного шляху завантажує
`.artifacts/docker-tests/` з логами ліній, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника та командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у багаторазовому live/E2E-робочому процесі замість
повторного запуску всіх релізних чанків. Згенеровані команди повторного запуску включають попередній
`package_artifact_run_id` і підготовлені Docker image inputs, коли доступні, тож
невдала лінія може повторно використати той самий tarball і GHCR-образи.

### QA Lab

QA Lab-бокс також є частиною `OpenClaw Release Checks`. Це агентний
релізний gate поведінки та рівня каналів, окремий від Vitest і Docker
пакетної механіки.

Релізне QA Lab-покриття включає:

- mock parity gate, що порівнює кандидатну лінію OpenAI з базовою Opus 4.6
  за допомогою пакета agentic parity
- швидкий live Matrix QA-профіль із використанням середовища `qa-live-shared`
- live Telegram QA-лінію з використанням оренд облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли релізна телеметрія потребує явного локального доказу

Використовуйте цей бокс, щоб відповісти на запитання "чи реліз поводиться правильно в QA-сценаріях і
live-потоках каналів?" Зберігайте URL артефактів для ліній parity, Matrix і Telegram
під час схвалення релізу. Повне Matrix-покриття лишається доступним як
ручний шардований запуск QA-Lab, а не як стандартна реліз-критична лінія.

### Пакет

Package-бокс — це gate встановлюваного продукту. Він підтримується
`Package Acceptance` і резолвером
`scripts/resolve-openclaw-package-candidate.mjs`. Резолвер нормалізує
кандидат у tarball `package-under-test`, який споживає Docker E2E, валідує
інвентар пакета, записує версію пакета та SHA-256 і тримає
ref обв'язки робочого процесу окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: запакувати довірену гілку `package_ref`, тег або повний commit SHA
  з вибраною обв'язкою `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов'язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Docker-чанки релізного шляху покривають
перекривні лінії встановлення, оновлення та plugin-update; Package Acceptance зберігає
artifact-native compat для bundled-channel, offline-фікстури Plugin і Telegram
package QA проти того самого resolved tarball. Це GitHub-native
заміна більшості покриття package/update, яке раніше вимагало
Parallels. Cross-OS release checks досі важливі для OS-специфічного onboarding,
інсталятора та поведінки платформи, але продуктова валідація package/update має
надавати перевагу Package Acceptance.

Застарілу поблажливість package-acceptance навмисно обмежено в часі. Пакети до
`2026.4.25` включно можуть використовувати шлях сумісності для metadata gaps, уже опублікованих
у npm: приватні записи QA-інвентаря, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у git-фікстурі, похідній від tarball,
відсутній persisted `update.channel`, застарілі розташування install-record Plugin,
відсутнє persistence marketplace install-record і міграція config metadata
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про stamp-файли metadata локального build, які вже були shipped. Пізніші пакети
мають задовольняти сучасні package contracts; ті самі прогалини провалюють релізну
валідацію.

Використовуйте ширші профілі Package Acceptance, коли релізне питання стосується
реального встановлюваного пакета:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Поширені профілі пакета:

- `smoke`: швидкі лінії встановлення пакета/каналу/агента, gateway network і config
  reload
- `package`: контракти install/update/plugin package без live ClawHub; це стандарт
  release-check
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker-чанки релізного шляху з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Робочий процес передає resolved
tarball `package-under-test` у Telegram-лінію; окремий
Telegram-робочий процес досі приймає опубліковану npm spec для post-publish checks.

## Вхідні дані робочого процесу NPM

`OpenClaw NPM Release` приймає ці керовані оператором вхідні дані:

- `tag`: обов'язковий релізний тег, як-от `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA workflow-branch для preflight лише з валідацією
- `preflight_only`: `true` для validation/build/package only, `false` для
  справжнього publish path
- `preflight_run_id`: обов'язковий на справжньому publish path, щоб робочий процес повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий тег npm для publish path; стандартно `beta`

`OpenClaw Release Checks` приймає ці керовані оператором вхідні дані:

- `ref`: гілка, тег або повний commit SHA для валідації. Перевірки з секретами
  вимагають, щоб resolved commit був досяжним з гілки OpenClaw або
  релізного тегу.

Правила:

- Stable і correction tags можуть публікуватися в `beta` або `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` введення повного commit SHA дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  лише валідаційні
- Справжній publish path має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  робочий процес перевіряє ці metadata перед продовженням publish

## Послідовність стабільного npm-релізу

Під час створення стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До існування тега можна використати поточний повний commit SHA workflow-branch
     для validation-only dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first flow або `latest` лише
   коли ви навмисно хочете прямий stable publish
3. Запустіть `Full Release Validation` на release branch, release tag або full
   commit SHA, коли хочете нормальний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram coverage з одного ручного workflow
4. Якщо вам навмисно потрібен лише deterministic normal test graph, натомість запустіть
   ручний workflow `CI` на release ref
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow, щоб просунути цю stable version з `beta` до `latest`
8. Якщо реліз навмисно опубліковано прямо в `latest`, а `beta`
   має негайно вказувати на той самий stable build, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable version, або дозвольте його scheduled
   self-healing sync перемістити `beta` пізніше

Мутація dist-tag живе в приватному репозиторії з міркувань безпеки, бо вона досі
вимагає `NPM_TOKEN`, тоді як публічний репозиторій зберігає OIDC-only publish.

Це робить і direct publish path, і beta-first promotion path задокументованими
та видимими для оператора.

Якщо maintainer має повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині dedicated tmux session. Не викликайте `op`
безпосередньо з main agent shell; утримання цього всередині tmux робить prompts,
alerts і OTP handling видимими та запобігає повторним host alerts.

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

Супровідники використовують приватну документацію щодо випуску в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичної інструкції виконання.

## Пов’язане

- [Канали випуску](/uk/install/development-channels)
