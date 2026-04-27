---
read_when:
    - Шукаєте публічні визначення каналів релізу
    - Запуск перевірки релізу або приймання пакета
    - Шукаєте іменування версій і каденцію
summary: Смуги релізу, контрольний список оператора, середовища перевірки, іменування версій і каденція
title: Політика релізів
x-i18n:
    generated_at: "2026-04-27T12:55:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 344606e845ab48966188b5031572dcbb827001b5c0e0f9be657f3a0e6d307835
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні смуги релізу:

- stable: релізи з тегами, які типово публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: пререлізні теги, які публікуються в npm `beta`
- dev: рухома голова `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-пререлізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль установлення beta
- Stable і stable-коригувальні релізи типово публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і macOS-застосунком;
  beta-релізи зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збірка/підпис/нотаризація mac-застосунку зарезервовані для stable, якщо це явно не запитано

## Каденція релізів

- Релізи рухаються за принципом beta-first
- Stable виходить лише після перевірки останньої beta
- Мейнтейнери зазвичай випускають релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура релізу, затвердження, облікові дані та нотатки з відновлення —
  лише для мейнтейнерів

## Контрольний список оператора релізу

Цей контрольний список — публічна форма потоку релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного rollback залишаються в
закритому runbook релізу для мейнтейнерів.

1. Почніть із поточної `main`: підтягніть останні зміни, підтвердьте, що цільовий commit запушено,
   і підтвердьте, що поточний CI `main` достатньо зелений, щоб від нього відгалужуватися.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії commit за допомогою
   `/changelog`, зберігайте записи орієнтованими на користувача, закомітьте це, запуште і ще раз виконайте rebase/pull перед відгалуженням.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу над релізом
   безпосередньо на `main`.
5. Підвищте версії в усіх потрібних місцях для запланованого тега, потім виконайте
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тег ще не існує,
   для preflight лише з метою перевірки дозволений повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі тести перед релізом через `Full Release Validation` для
   гілки релізу, тега або повного SHA commit. Це єдина ручна точка входу
   для чотирьох великих середовищ тестування релізу: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте проблему в гілці релізу й повторно запустіть найменший проблемний
   файл, lane, job workflow, профіль package, allowlist провайдера або модель, що доводить виправлення. Повторно запускайте повну umbrella-перевірку лише тоді, коли змінена поверхня робить попередні докази неактуальними.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім запустіть
   post-publish package acceptance проти опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо запушена або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте і не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або release candidate матиме
    необхідні докази перевірки. Stable-публікація в npm повторно використовує успішний
    артефакт preflight через `preflight_run_id`; готовність stable-релізу для macOS
    також потребує запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть verifier після публікації npm, опційний окремий
    E2E для Telegram з опублікованого npm, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повної відповідної секції `CHANGELOG.md`, і кроки оголошення релізу.

## Preflight релізу

- Запускайте `pnpm check:test-types` перед release preflight, щоб TypeScript у тестах
  лишався покритим поза швидшим локальним gate `pnpm check`
- Запускайте `pnpm check:architecture` перед release preflight, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза швидшим локальним gate
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і пакет Control UI існували для кроку
  перевірки pack
- Запускайте ручний workflow `Full Release Validation` перед затвердженням релізу, щоб
  запустити всі середовища тестування перед релізом з однієї точки входу. Він приймає branch,
  tag або повний SHA commit, dispatch-ить ручний `CI` і dispatch-ить
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  smugs. Передавайте `npm_telegram_package_spec` лише після того, як пакет уже
  опубліковано і також має виконатися post-publish Telegram E2E. Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте ручний workflow `Package Acceptance`, коли вам потрібен побічний доказ
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірений branch/tag/SHA `package_ref` з поточним harness `workflow_ref`;
  `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, вивантаженого іншим запуском GitHub
  Actions. Workflow зводить кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler проти цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Типові профілі:
  - `smoke`: smugs install/channel/agent, gateway network і config reload
  - `package`: artifact-native smugs package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP channels, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: Docker release-path частини з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для цільового повторного запуску
- Запускайте ручний workflow `CI` безпосередньо, коли вам потрібне лише повне стандартне CI-
  покриття для кандидата релізу. Ручний dispatch CI оминає changed scoping і примусово запускає Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність з Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python Skills, Windows, macOS, Android і Control UI i18n
  smugs.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke`, коли перевіряєте телеметрію релізу. Він виконує
  `qa-lab` через локальний приймач OTLP/HTTP і перевіряє експортовані імена trace
  span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс fast
  live Matrix profile і Telegram QA lane перед затвердженням релізу. Live-
  smugs використовують середовище `qa-live-shared`; Telegram також використовує оренду
  облікових даних Convex CI. Запускайте ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли хочете повний паралельний
  інвентар транспорту, медіа та E2EE Matrix.
- Кросплатформна перевірка встановлення й оновлення середовища виконання є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які безпосередньо викликають
  повторно використовуваний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримати справжній шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки лишаються у
  власній smugs, щоб не затримувати й не блокувати публікацію
- Перевірки релізу, що містять секрети, слід dispatch-ити через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети лишалися під контролем
- `OpenClaw Release Checks` приймає branch, tag або повний SHA commit, якщо
  розв’язаний commit досяжний з гілки OpenClaw або тега релізу
- Валідаційний preflight workflow `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA commit гілки workflow без потреби в запушеному тегі
- Цей шлях SHA призначений лише для валідації і не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки метаданих
  package; реальна публікація все одно потребує справжнього тега релізу
- Обидва workflow зберігають справжній шлях публікації та просування на GitHub-hosted
  runners, тоді як незмінюваний шлях валідації може використовувати більші
  Linux-ранери Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з обома секретами workflow `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Preflight npm-релізу більше не чекає на окрему smugu release checks
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед затвердженням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction version), щоб перевірити шлях установлення з опублікованого реєстру
  у свіжому тимчасовому prefix
- Після публікації beta запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити онбординг установленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Для локальних разових перевірок мейнтейнера можна не вказувати змінні Convex і передавати три
  облікові дані `OPENCLAW_QA_TELEGRAM_*` через env безпосередньо.
- Мейнтейнери можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожен merge.
- Автоматизація релізів мейнтейнерів тепер використовує preflight-then-promote:
  - справжня публікація npm має пройти успішний npm `preflight_run_id`
  - справжню публікацію npm слід dispatch-ити з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable npm-релізи типово націлюються на `beta`
  - stable-публікація npm може явно націлювати `latest` через вхід workflow
  - зміна npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` — лише для валідації
  - справжня приватна публікація mac має пройти успішні приватні
    `preflight_run_id` і `validate_run_id` для mac
  - справжні шляхи публікації просувають підготовлені артефакти замість того, щоб збирати
    їх знову
- Для stable correction-релізів на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення у тимчасовому prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні релізи не могли тихо залишити старіші глобальні встановлення на
  базовому stable payload
- Preflight npm-релізу завершується з помилкою за принципом fail closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожню браузерну панель керування
- Post-publish перевірка також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні runtime deps вбудованих plugin у кореневому макеті `dist/*`.
  Реліз, який постачається з відсутніми або порожніми payload залежностей
  вбудованих plugin, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також забезпечує дотримання бюджету `unpackedSize` npm pack для
  tarball кандидата на оновлення, тож installer e2e виявляє випадкове роздуття pack
  до шляху публікації релізу
- Якщо робота над релізом торкалася планування CI, маніфестів часу extension або
  матриць тестів extension, перед затвердженням згенеруйте й перегляньте виходи матриць workflow
  `checks-node-extensions`, що належать planner, з `.github/workflows/ci.yml`,
  щоб нотатки релізу не описували застарілу схему CI
- Готовність stable-релізу для macOS також включає поверхні оновлювача:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - запакований застосунок має зберігати не-debug bundle id, непорожню
    URL-адресу стрічки Sparkle і `CFBundleVersion` на рівні або вище канонічної межі збірки Sparkle
    для цієї версії релізу

## Середовища тестування релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі тести перед релізом з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте release
branch, tag або повний SHA commit як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both
```

Workflow розв’язує цільовий ref, dispatch-ить ручний `CI` з
`target_ref=<release-ref>`, dispatch-ить `OpenClaw Release Checks` і
за потреби dispatch-ить окремий post-publish Telegram E2E, коли
встановлено `npm_telegram_package_spec`. `OpenClaw Release Checks` потім розгалужується на
install smoke, кросплатформні перевірки релізу, Docker-покриття release-path live/E2E,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли у зведенні `Full Release Validation`
`normal_ci` і `release_checks` позначені як успішні, а будь-який опційний дочірній
`npm_telegram` або успішний, або навмисно пропущений.
Дочірні workflow dispatch-яться з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу release branch або tag. Окремого входу workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.

Використовуйте такі варіанти залежно від етапу релізу:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both

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
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну umbrella-перевірку як перший повторний запуск після цільового виправлення. Якщо одне середовище
не проходить, використовуйте проблемний дочірній workflow, job, Docker-smugu, профіль package, model
provider або QA lane для наступного доказу. Повторно запускайте повну umbrella лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази по всіх середовищах
неактуальними. Фінальний verifier umbrella повторно перевіряє записані run id дочірніх workflow,
тож після успішного повторного запуску дочірнього workflow повторно запускайте лише проблемний
батьківський job `Verify full validation`.

### Vitest

Середовище Vitest — це дочірній ручний workflow `CI`. Ручний CI навмисно
оминає changed scoping і примусово запускає звичайний граф тестів для кандидата релізу:
Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22,
`check`, `check-additional`, build smoke, docs checks, Python Skills, Windows, macOS, Android і Control UI i18n.

Використовуйте це середовище, щоб відповісти на запитання «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що перевірка продукту за шляхом релізу. Докази, які слід зберегти:

- Зведення `Full Release Validation`, яке показує URL запущеного `CI`
- Зелений запуск `CI` на точному цільовому SHA
- Назви проблемних або повільних shard із job CI під час дослідження регресій
- Артефакти часу виконання Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI безпосередньо лише тоді, коли релізу потрібне детерміноване звичайне CI, але
не потрібні Docker-, QA Lab-, live-, cross-OS- або package-середовища:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Середовище Docker живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також workflow release-mode
`install-smoke`. Воно перевіряє кандидата релізу через запаковані
Docker-середовища, а не лише через тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повний install smoke з увімкненим повільним smoke глобального встановлення Bun
- E2E-smugs репозиторію
- Docker-частини release-path: `core`, `package-update`, `plugins-runtime` і
  `bundled-channels`
- покриття OpenWebUI всередині частини `plugins-runtime`, коли це запитано
- розділені смуги залежностей bundled-channel у власній частині `bundled-channels`
  замість послідовної all-in-one smugs bundled-channel
- розділені smugs встановлення/видалення bundled plugin
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-7`
- live/E2E-набори провайдерів і Docker-покриття live-моделей, коли release checks
  включають live-набори

Використовуйте Docker-артефакти перед повторним запуском. Release-path scheduler вивантажує
`.artifacts/docker-tests/` з логами smugs, `summary.json`, `failures.json`,
часами фаз, JSON-планом scheduler і командами повторного запуску. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у повторно використовуваному workflow live/E2E замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередній
`package_artifact_run_id` і підготовлені входи Docker image, коли вони доступні, тож
невдала smuga може повторно використати той самий tarball і образи GHCR.

### QA Lab

Середовище QA Lab також є частиною `OpenClaw Release Checks`. Це агентний
рівень поведінки та релізний gate на рівні каналів, окремий від Vitest і Docker-
механіки пакета.

Покриття QA Lab для релізу включає:

- mock parity gate, який порівнює lane-кандидат OpenAI з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- fast-профіль live Matrix QA із середовищем `qa-live-shared`
- live Telegram QA lane з орендою облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального доказу

Використовуйте це середовище, щоб відповісти на питання «чи поводиться реліз правильно в QA-сценаріях і
live-потоках каналів?» Під час затвердження релізу зберігайте URL артефактів для smugs parity, Matrix і Telegram.
Повне покриття Matrix лишається доступним як ручний шардований запуск QA-Lab, а не як типова критична для релізу lane.

### Package

Середовище Package — це gate придатного до встановлення продукту. Воно базується на
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата до tarball `package-under-test`, який споживає Docker E2E, перевіряє
інвентар пакета, фіксує версію пакета та SHA-256 і тримає
workflow harness ref окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу
  OpenClaw
- `source=ref`: запакувати довірений branch, tag або повний SHA commit `package_ref`
  із вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, вивантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Docker-частини release-path покривають
смужки install, update і plugin-update, що перетинаються; Package Acceptance зберігає
artifact-native bundled-channel compat, offline-фікстури plugin і Telegram
package QA проти того самого розв’язаного tarball. Це нативна для GitHub
заміна для більшості покриття package/update, яке раніше вимагало
Parallels. Кросплатформні release checks усе ще важливі для специфічного для ОС онбордингу,
інсталятора й платформної поведінки, але валідація продукту package/update має
віддавати перевагу Package Acceptance.

Застаріла поблажливість package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин метаданих, уже опублікованих
у npm: приватні записи інвентарю QA, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch-файли в git-
фікстурі, похідній від tarball, відсутній збережений `update.channel`, застарілі розташування install-record
plugin, відсутнє збереження install-record marketplace і міграція метаданих config
під час `plugins update`. Пакети після `2026.4.25` мають задовольняти
сучасні контракти пакета; ті самі прогалини призводять до збою перевірки релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
фактичного пакета, придатного до встановлення:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Типові профілі пакета:

- `smoke`: швидкі smugs встановлення пакета/каналу/агента, gateway network і config
  reload
- `package`: контракти package install/update/plugin без live ClawHub; це типове значення перевірки релізу
- `product`: `package` плюс MCP channels, cron/subagent cleanup, OpenAI web
  search і OpenWebUI
- `full`: Docker-частини release-path з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для доказу Telegram на основі кандидата пакета ввімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у Telegram lane; окремий
workflow Telegram усе ще приймає опублікований npm spec для post-publish перевірок.

## Входи workflow npm

`OpenClaw NPM Release` приймає такі керовані оператором входи:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, ним також може бути поточний
  повний 40-символьний SHA commit гілки workflow для preflight лише з метою валідації
- `preflight_only`: `true` для лише validation/build/package, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий npm-tag для шляху публікації; типове значення `beta`

`OpenClaw Release Checks` приймає такі керовані оператором входи:

- `ref`: branch, tag або повний SHA commit для перевірки. Перевірки, що містять секрети,
  вимагають, щоб розв’язаний commit був досяжний з гілки OpenClaw або
  тега релізу.

Правила:

- Stable і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний SHA commit дозволений лише тоді, коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тег ще не існує, можна використовувати поточний повний commit
     SHA гілки workflow для dry run preflight-workflow лише з метою валідації
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   тоді, коли навмисно хочете прямої stable-публікації
3. Запустіть `Full Release Validation` на гілці релізу, тегі релізу або повному
   SHA commit, коли вам потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз вийшов у `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо реліз навмисно публікувався безпосередньо в `latest` і `beta`
   має негайно наслідувати ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте запланованій
   самовідновлювальній синхронізації просунути `beta` пізніше

Зміна dist-tag розміщена в приватному репозиторії з міркувань безпеки, тому що вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає як шлях прямої публікації, так і шлях просування beta-first задокументованими
й видимими для оператора.

Якщо мейнтейнеру потрібно повернутися до локальної npm-автентифікації, виконуйте будь-які команди 1Password
CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
безпосередньо з основної shell-сесії агента; використання лише в tmux робить prompts,
сповіщення та обробку OTP спостережуваними й запобігає повторним сповіщенням хоста.

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

Мейнтейнери використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
