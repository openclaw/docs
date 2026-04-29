---
read_when:
    - Пошук визначень публічних каналів випуску
    - Запуск перевірки випуску або приймального тестування пакета
    - Шукаєте найменування версій і періодичність випусків
summary: Канали випуску, контрольний список оператора, валідаційні бокси, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-29T07:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84c8dcd13f247b5d136d8a675ce53ef12c68a7f7242d485fe4b55570105ef180
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні канали випусків:

- stable: випуски з тегами, які за замовчуванням публікуються в npm під `beta`, або в npm під `latest`, коли це явно запитано
- beta: prerelease-теги, які публікуються в npm під `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального stable-випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нуль на початку місяця чи дня
- `latest` означає поточний просунутий stable-випуск npm
- `beta` означає поточну ціль встановлення beta
- Stable і коригувальні stable-випуски за замовчуванням публікуються в npm під `beta`; оператори випуску можуть явно вибрати `latest` або пізніше просунути перевірену beta-збірку
- Кожен stable-випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/пакета, а
  збірка/підпис/нотаризація застосунку macOS зарезервовані для stable, якщо їх явно не запитано

## Ритм випусків

- Випуски рухаються спочатку через beta
- Stable іде лише після перевірки найновішої beta
- Maintainers зазвичай готують випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже надіслано або опубліковано й він потребує виправлення, maintainers створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, погодження, облікові дані й нотатки щодо відновлення
  доступні лише maintainers

## Контрольний список оператора випуску

Цей контрольний список описує публічну форму процесу випуску. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і подробиці аварійного відкату залишаються в
runbook випуску, доступному лише maintainers.

1. Почніть із поточного `main`: отримайте найновіші зміни, підтвердьте, що цільовий commit надіслано,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії commit за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, створіть commit, надішліть його й виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності випуску в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну роботу над випуском
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце версії для запланованого тегу, потім запустіть
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тегу немає,
   повний 40-символьний SHA гілки випуску дозволено для preflight лише з метою перевірки.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі pre-release тести через `Full Release Validation` для
   гілки випуску, тегу або повного SHA commit. Це єдина ручна точка входу
   для чотирьох великих тестових боксів випуску: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте проблему в гілці випуску й перезапустіть найменший невдалий
   файл, lane, workflow job, профіль пакета, provider або model allowlist, який
   доводить виправлення. Перезапускайте повну парасольку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, потім запустіть
   post-publish package acceptance проти опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо надіслана або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate має
    потрібні докази перевірки. Stable-публікація npm повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність stable-випуску macOS
    також вимагає упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий автономний
    published-npm Telegram E2E, коли потрібен post-publish доказ каналу,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення випуску.

## Preflight випуску

- Виконайте `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Виконайте `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і меж архітектури були зеленими поза швидшим локальним шлюзом
- Виконайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і бандл Control UI існували для кроку перевірки
  пакування
- Виконайте ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. Надавайте `npm_telegram_package_spec` лише після публікації пакета,
  коли також має запуститися післяпублікаційний Telegram E2E. Надавайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Виконайте ручний workflow `Package Acceptance`, коли потрібен побічний доказ
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної релізної версії; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним harness
  `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим SHA-256; або
  `source=artifact` для tarball, завантаженого іншим запуском GitHub Actions.
  Workflow резолвить кандидата в `package-under-test`, повторно використовує
  Docker E2E release scheduler проти цього tarball і може запускати Telegram QA
  проти того самого tarball з `telegram_mode=mock-openai` або
  `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Типові профілі:
  - `smoke`: install/channel/agent, gateway network і config reload lanes
  - `package`: artifact-native package/update/plugin lanes без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Виконайте ручний workflow `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для релізного кандидата. Ручні CI dispatch обходять changed
  scoping і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python skills, Windows, macOS, Android і Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Виконайте `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Це
  проганяє QA-lab через локальний OTLP/HTTP receiver і перевіряє експортовані
  назви trace span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Виконуйте `pnpm release:check` перед кожним релізом із тегом
- Релізні перевірки тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує оренди
  облікових даних Convex CI. Виконайте ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар Matrix
  transport, media та E2EE паралельно.
- Cross-OS install і upgrade runtime validation є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний npm release path коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live checks залишаються у
  власній lane, щоб вони не затримували й не блокували publish
- Релізні перевірки із секретами слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  розв’язаний коміт досяжний з гілки OpenClaw або релізного тегу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту workflow-гілки без вимоги запушеного тегу
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у реальний publish
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальний publish усе ще вимагає справжнього релізного тегу
- Обидва workflow залишають реальний шлях publish і promotion на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему lane релізних перевірок
- Виконайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish виконайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити published registry
  install path у свіжому тимчасовому префіксі
- Після beta publish виконайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити installed-package onboarding, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних
  Telegram. Локальні одноразові запуски maintainer можуть пропустити vars Convex і передати три
  env credentials `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainers можуть запускати ту саму післяпублікаційну перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів maintainer тепер використовує preflight-then-promote:
  - реальний npm publish має пройти успішний npm `preflight_run_id`
  - реальний npm publish має бути запущений з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm releases за замовчуванням використовують `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - token-based npm dist-tag mutation тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` призначений лише для валідації
  - реальний private mac publish має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні publish paths просувають підготовлені артефакти замість повторної
    їх перебудови
- Для stable correction releases на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий temp-prefix upgrade path з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб release corrections не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight закривається з помилкою, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожню браузерну панель керування
- Post-publish verification також перевіряє, що published registry install
  містить непорожні bundled Plugin runtime deps у кореневому layout `dist/*`.
  Реліз, який постачається з відсутніми або порожніми bundled Plugin
  dependency payloads, провалює postpublish verifier і не може бути promoted
  to `latest`.
- `pnpm test:install:smoke` також застосовує budget npm pack `unpackedSize` до
  candidate update tarball, щоб installer e2e ловив випадкове розростання pack
  до release publish path
- Якщо релізна робота торкалася CI planning, extension timing manifests або
  extension test matrices, перегенеруйте й перегляньте planner-owned
  `plugin-prerelease-extension-shard` matrix outputs з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий CI layout
- Готовність stable macOS release також включає поверхні updater:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий stable zip після publish
  - запакований app має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї релізної версії

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким operators запускають усі передрелізні тести з
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

Workflow резолвить target ref, запускає manual `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
опційно запускає standalone post-publish Telegram E2E, коли
`npm_telegram_package_spec` задано. Потім `OpenClaw Release Checks` розгалужується на
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли summary `Full Release Validation`
показує `normal_ci` і `release_checks` як successful, а будь-який optional
child `npm_telegram` або successful, або навмисно skipped. Фінальний
verifier summary містить таблиці slowest-job для кожного child run, щоб release
manager міг бачити поточний critical path без завантаження logs.
Child workflows запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли target `ref` вказує на
старішу release branch або tag. Окремого workflow-ref input для Full Release Validation
немає; вибирайте trusted harness, вибираючи workflow run ref.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker path
- `stable`: minimum плюс stable provider/backend coverage для схвалення релізу
- `full`: stable плюс широке advisory provider/media coverage

`OpenClaw Release Checks` використовує trusted workflow ref, щоб один раз розв’язати target
ref як `release-package-under-test` і повторно використовує цей артефакт як у
release-path Docker checks, так і в Package Acceptance. Це утримує всі
package-facing boxes на тих самих bytes і уникає повторних package builds.

Використовуйте ці варіанти залежно від стадії релізу:

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

Не використовуйте повну парасольку як перший повторний запуск після сфокусованого виправлення. Якщо один блок
зазнає невдачі, використовуйте невдалий дочірній workflow, завдання, Docker-лінію, профіль пакета, модельного
провайдера або QA-лінію для наступного підтвердження. Запускайте повну парасольку знову лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази з усіх блоків
застарілими. Фінальний перевірник парасольки повторно перевіряє записані ідентифікатори запусків дочірніх workflow,
тому після успішного повторного запуску дочірнього workflow повторно запускайте лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` у парасольку. `all` — це справжній
запуск release candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише релізний дочірній Plugin, `release-checks` запускає кожен релізний
блок, а вужчі релізні групи — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` та `npm-telegram`, коли
надано автономну Telegram-лінію пакета.

### Vitest

Блок Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
оминає changed scoping і примусово запускає звичайний тестовий граф для release
candidate: Linux Node-шарди, шарди bundled-plugin, контракти каналів, сумісність Node 22,
`check`, `check-additional`, build smoke, перевірки документації, Python
skills, Windows, macOS, Android і i18n Control UI.

Використовуйте цей блок, щоб відповісти на запитання: «чи пройшло дерево джерельного коду повний звичайний набір тестів?»
Це не те саме, що валідація продукту на релізному шляху. Докази, які потрібно зберегти:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних шардів із завдань CI під час дослідження регресій
- артефакти часу виконання Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли реліз потребує детермінованого звичайного CI, але
не Docker, QA Lab, live, cross-OS або package-блоків:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker-блок міститься в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у release-mode
workflow `install-smoke`. Він перевіряє release candidate через упаковані
Docker-середовища, а не лише через тести на рівні джерельного коду.

Покриття release Docker включає:

- повний install smoke із увімкненим повільним Bun global install smoke
- repository E2E-лінії
- release-path Docker-частини: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-b` і `bundled-channels-contracts`
- покриття OpenWebUI всередині частини `plugins-runtime-core`, коли запитано
- розділені лінії залежностей bundled-channel між channel-smoke, update-target
  і setup/runtime contract-частинами замість одного великого завдання bundled-channel
- розділені лінії встановлення/видалення bundled Plugin
  `bundled-plugin-install-uninstall-0` через
  `bundled-plugin-install-uninstall-7`
- live/E2E-набори провайдерів і Docker live-покриття моделей, коли release checks
  включають live-набори

Використовуйте Docker-артефакти перед повторним запуском. Release-path планувальник завантажує
`.artifacts/docker-tests/` із журналами ліній, `summary.json`, `failures.json`,
часами фаз, JSON плану планувальника та командами повторного запуску. Для сфокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх релізних частин. Згенеровані команди повторного запуску включають попередній
`package_artifact_run_id` і підготовлені входи Docker-образів, коли доступні, тож
невдала лінія може повторно використати той самий tarball і GHCR-образи.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це релізний gate для агентної
поведінки й рівня каналів, окремий від механіки пакетів Vitest і Docker.

Покриття release QA Lab включає:

- mock parity gate, що порівнює кандидатну лінію OpenAI з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile із використанням середовища `qa-live-shared`
- live Telegram QA lane із використанням Convex CI credential leases
- `pnpm qa:otel:smoke`, коли релізній телеметрії потрібне явне локальне підтвердження

Використовуйте цей блок, щоб відповісти на запитання: «чи поводиться реліз коректно в QA-сценаріях і
live-потоках каналів?» Зберігайте URL артефактів для parity, Matrix і Telegram
ліній під час схвалення релізу. Повне Matrix-покриття залишається доступним як
ручний шардований запуск QA-Lab, а не стандартна релізно-критична лінія.

### Package

Package-блок — це gate для інстальованого продукту. Він підтримується
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата в tarball `package-under-test`, який споживає Docker E2E, перевіряє
інвентар пакета, записує версію пакета та SHA-256 і тримає
ref harness workflow окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна релізна
  версія OpenClaw
- `source=ref`: пакує довірену гілку `package_ref`, тег або повний commit SHA
  з вибраним harness `workflow_ref`
- `source=url`: завантажує HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використовує `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance із `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Release-path Docker-частини покривають
перетинальні лінії встановлення, оновлення та plugin-update; Package Acceptance зберігає
artifact-native bundled-channel compat, offline Plugin fixtures і Telegram
package QA проти того самого resolved tarball. Це GitHub-native
заміна більшості покриття package/update, яке раніше потребувало
Parallels. Cross-OS release checks усе ще важливі для специфічних для ОС onboarding,
installer і platform behavior, але валідація продукту package/update має
віддавати перевагу Package Acceptance.

Поблажливість legacy package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` включно можуть використовувати compatibility path для metadata gaps, уже опублікованих
до npm: приватні QA inventory entries, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch files у tarball-derived git
fixture, відсутній збережений `update.channel`, legacy plugin install-record
locations, відсутня marketplace install-record persistence і міграція config metadata
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про local build metadata stamp files, які вже були поставлені. Пізніші пакети
мають відповідати сучасним package contracts; ті самі прогалини провалюють релізну
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

Поширені профілі пакетів:

- `smoke`: швидкі лінії встановлення пакета/каналу/агента, мережі Gateway і
  перезавантаження конфігурації
- `package`: контракти install/update/plugin package без live ClawHub; це стандарт
  release-check
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker release-path chunks з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate Telegram proof увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає resolved
tarball `package-under-test` у Telegram-лінію; автономний Telegram workflow
досі приймає опублікований npm spec для post-publish checks.

## Вхідні параметри NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий релізний тег, такий як `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA workflow-branch для validation-only preflight
- `preflight_only`: `true` для validation/build/package only, `false` для
  справжнього publish path
- `preflight_run_id`: обов’язковий на справжньому publish path, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm-тег для publish path; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, тег або повний commit SHA для перевірки. Secret-bearing checks
  вимагають, щоб resolved commit був досяжний з гілки OpenClaw або
  релізного тегу.

Правила:

- Стабільні та correction tags можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tags можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` введення повного commit SHA дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  тільки validation-only
- Справжній publish path має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє, що metadata перед publish продовжує відповідати

## Послідовність стабільного npm-релізу

Під час підготовки стабільного npm-релізу:

1. Запустіть `OpenClaw NPM Release` із `preflight_only=true`
   - До існування тегу можна використати поточний повний commit SHA workflow-branch
     для validation-only dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   тоді, коли навмисно хочете пряме стабільне опублікування
3. Запустіть `Full Release Validation` на релізній гілці, релізному тегу або повному
   commit SHA, коли потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram-покриття з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний тестовий граф, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано напряму в `latest`, а `beta`
   має негайно слідувати за тією самою стабільною збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   self-healing sync перемістити `beta` пізніше

Мутація dist-tag міститься в приватному repo з міркувань безпеки, бо вона все ще
потребує `NPM_TOKEN`, тоді як public repo зберігає OIDC-only publish.

Це робить і direct publish path, і beta-first promotion path
задокументованими та видимими для оператора.

Якщо maintainer мусить повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині dedicated tmux session. Не викликайте `op`
напряму з main agent shell; утримання його всередині tmux робить prompts,
alerts і OTP handling спостережуваними та запобігає повторним host alerts.

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

Супровідники використовують приватну документацію щодо випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний операційний посібник.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
