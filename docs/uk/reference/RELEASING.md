---
read_when:
    - Шукаю визначення публічних каналів релізу
    - Запуск валідації релізу або приймання пакета
    - Шукаю іменування версій і каденс
summary: Лейни релізу, контрольний список оператора, блоки валідації, іменування версій і каденс
title: Політика релізу
x-i18n:
    generated_at: "2026-04-27T21:05:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3ff3c7887c59005a977522e3a0e80ea3458e29d12f6976397b0749d8001d914
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні лейни релізу:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги передрелізів, які публікуються в npm `beta`
- dev: рухома голова `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального stable-релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте провідні нулі до місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable-релізи та коригувальні stable-релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно вибрати `latest` або просунути перевірену beta-збірку пізніше
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спочатку проходять валідацію та публікацію шляху npm/package, а
  збірка/підпис/нотаризація застосунку macOS зарезервовані для stable, якщо явно не запитано

## Каденс релізів

- Релізи рухаються за схемою beta-first
- Stable іде лише після валідації останньої beta
- Мейнтейнери зазвичай роблять релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб валідація релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тегу
- Детальна процедура релізу, погодження, облікові дані та примітки щодо відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора релізу

Цей контрольний список — публічний контур процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату
залишаються в runbook релізу лише для мейнтейнерів.

1. Почніть з поточної `main`: отримайте останні зміни, підтвердьте, що цільовий коміт запушено,
   і що поточний CI для `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте це, запуште і
   ще раз виконайте rebase/pull перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу з релізом
   безпосередньо в `main`.
5. Оновіть кожне обов’язкове місце з версією для запланованого тегу, а потім виконайте
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тегу
   для preflight лише з метою валідації дозволено повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки релізу, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих блоків тестування релізу: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте проблему в гілці релізу і повторно запустіть найменший невдалий
   файл, лейн, завдання workflow, профіль пакета, allowlist провайдера або моделі, який
   підтверджує виправлення. Повторно запускайте повну парасольку лише тоді, коли змінена поверхня
   робить попередні докази неактуальними.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім запустіть
   post-publish package acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо запушена або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте і не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або кандидат на реліз матиме
    необхідні докази валідації. Stable-публікація в npm повторно використовує успішний
    артефакт preflight через `preflight_run_id`; готовність stable-релізу для macOS
    також вимагає упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть верифікатор npm після публікації, необов’язковий окремий
    Telegram E2E для опублікованого npm, коли потрібен доказ каналу після публікації,
    просування dist-tag за потреби, примітки GitHub release/prerelease з
    повної відповідної секції `CHANGELOG.md`, а також кроки
    оголошення релізу.

## Preflight релізу

- Запускайте `pnpm check:test-types` перед release preflight, щоб TypeScript для тестів
  залишався покритим поза швидшим локальним gate `pnpm check`
- Запускайте `pnpm check:architecture` перед release preflight, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза швидшим локальним gate
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і бандл Control UI існували для кроку
  валідації pack
- Запускайте ручний workflow `Full Release Validation` перед погодженням релізу, щоб
  запустити всі блоки передрелізного тестування з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, викликає вручну `CI` і викликає
  `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker
  для шляху релізу, live/E2E, OpenWebUI, QA Lab parity, Matrix і лейнів
  Telegram. Вказуйте `npm_telegram_package_spec` лише після того, як пакет уже
  опубліковано і також має виконуватися Telegram E2E після публікації. Вказуйте
  `evidence_package_spec`, коли приватний звіт доказів має підтверджувати, що
  валідація відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте ручний workflow `Package Acceptance`, коли потрібен побічний доказ
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб упакувати довірену гілку/тег/SHA `package_ref` з поточним harness
  `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує планувальник Docker E2E шляху релізу для цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: лейни install/channel/agent, мережі Gateway і перезавантаження конфігурації
  - `package`: артефактно-нативні лейни пакета/оновлення/Plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс канали MCP, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: частини Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для цільового повторного запуску
- Запускайте ручний workflow `CI` безпосередньо, коли потрібне лише повне звичайне покриття
  CI для кандидата на реліз. Ручний запуск CI оминає changed scoping і примусово запускає
  Linux Node shards, shards bundled-plugin, контракти каналів, сумісність Node 22, `check`,
  `check-additional`, build smoke, перевірки документації, Python Skills, Windows, macOS, Android і
  лейни i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час валідації телеметрії релізу. Це проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace span,
  обмежені атрибути та редагування вмісту/ідентифікаторів без потреби в
  Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate разом із швидким
  live-профілем Matrix і лейном Telegram QA перед погодженням релізу. Live-лейни використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
  Запускайте ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний паралельний інвентар
  транспорту, медіа та E2EE Matrix.
- Крос-ОС валідація встановлення та оновлення під час виконання є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` безпосередньо
- Цей поділ навмисний: зберігайте справжній шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному лейні, щоб не затримувати й не блокувати публікацію
- Перевірки релізу, що використовують секрети, слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт досяжний з гілки OpenClaw або тега релізу
- Валідаційний preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без вимоги запушеного тегу
- Цей шлях із SHA призначений лише для валідації і не може бути підвищений до справжньої публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; справжня публікація все одно вимагає реального тега релізу
- Обидва workflows залишають справжній шлях публікації та просування на GitHub-hosted
  runners, тоді як немутуючий шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий лейн перевірок релізу
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед погодженням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з
  опублікованого реєстру в новому тимчасовому префіксі
- Після публікації beta запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і справжній Telegram E2E
  проти опублікованого npm-пакета, використовуючи спільний пул орендованих облікових даних Telegram.
  Для локальних одноразових перевірок мейнтейнера можна не вказувати змінні Convex і передати
  безпосередньо три env-облікові дані `OPENCLAW_QA_TELEGRAM_*`.
- Мейнтейнери можуть запускати ту саму перевірку після публікації через GitHub Actions за допомогою
  ручного workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається після кожного merge.
- Автоматизація релізів мейнтейнера тепер використовує схему preflight-then-promote:
  - справжня публікація в npm має пройти успішний npm `preflight_run_id`
  - справжню публікацію в npm слід запускати з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable npm-релізи за замовчуванням використовують `beta`
  - stable-публікація в npm може явно націлюватися на `latest` через вхідні дані workflow
  - мутація npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - справжня приватна публікація mac має пройти успішні приватні `preflight_run_id`
    і `validate_run_id` для mac
  - справжні шляхи публікації просувають підготовлені артефакти замість їх повторного збирання
- Для коригувальних stable-релізів на кшталт `YYYY.M.D-N` верифікатор після публікації
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб корекції релізу не могли непомітно залишити старі глобальні встановлення на
  базовому stable-навантаженні
- npm release preflight завершується із закритою помилкою, якщо tarball не містить і `dist/control-ui/index.html`,
  і непорожнє навантаження `dist/control-ui/assets/`, щоб ми знову не
  випустили порожню браузерну панель керування
- Перевірка після публікації також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні runtime-залежності bundled Plugin у кореневому
  макеті `dist/*`. Реліз, який постачається з відсутнім або порожнім навантаженням
  залежностей bundled Plugin, не проходить верифікатор після публікації і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет `unpackedSize` для npm pack
  у tarball кандидата на оновлення, щоб installer e2e виявляв випадкове збільшення
  пакета до шляху публікації релізу
- Якщо робота над релізом торкалася планування CI, маніфестів часу extension або
  матриць тестів extension, перед погодженням заново згенеруйте й перегляньте
  матричні виводи `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб примітки до релізу не описували застарілу схему CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - GitHub release має зрештою містити упаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - упакований застосунок має зберігати non-debug bundle id, непорожню
    Sparkle feed URL і `CFBundleVersion` на рівні або вище канонічного мінімального build-рівня Sparkle
    для цієї версії релізу

## Блоки тестування релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести
з однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте
гілку релізу, тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow визначає цільовий ref, викликає вручну `CI` з
`target_ref=<release-ref>`, викликає `OpenClaw Release Checks` і
за потреби викликає окремий Telegram E2E після публікації, коли
встановлено `npm_telegram_package_spec`. Далі `OpenClaw Release Checks` розгалужує
install smoke, крос-ОС перевірки релізу, live/E2E покриття Docker release-path,
Package Acceptance із Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск є прийнятним лише тоді, коли у підсумку `Full Release Validation`
показано `normal_ci` і `release_checks` як успішні, а будь-який необов’язковий дочірній
`npm_telegram` або успішний, або навмисно пропущений.
Дочірні workflows викликаються з довіреного ref, що запускає `Full Release
Validation`, зазвичай `--ref main`, навіть якщо цільовий `ref` вказує на
старішу гілку релізу або тег. Окремого входу workflow-ref для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Валідувати неопубліковану гілку кандидата на реліз.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both

# Валідувати точний запушений коміт.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Після публікації beta додати Telegram E2E для опублікованого пакета.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну парасольку як перший повторний запуск після точкового виправлення. Якщо один блок
не пройшов, використовуйте невдалий дочірній workflow, job, Docker lane, профіль пакета, модель
провайдера або QA-лейн для наступного підтвердження. Повторно запускайте повну парасольку лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази для всіх блоків
неактуальними. Фінальний верифікатор парасольки повторно перевіряє записані run id дочірніх workflow,
тож після успішного повторного запуску дочірнього workflow повторно запускайте лише
невдалий батьківський job `Verify full validation`.

### Vitest

Блок Vitest — це дочірній ручний workflow `CI`. Ручний CI навмисно
оминає changed scoping і примусово запускає звичайний тестовий граф для
кандидата на реліз: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android і i18n для Control UI.

Використовуйте цей блок, щоб відповісти на запитання «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що валідація продукту на шляху релізу. Докази, які слід зберігати:

- підсумок `Full Release Validation`, що показує URL запущеного прогону `CI`
- зелений прогін `CI` на точному цільовому SHA
- назви shard-ів, що впали або працювали повільно, із job-ів CI під час дослідження регресій
- артефакти часу Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI безпосередньо лише тоді, коли релізу потрібен детермінований звичайний CI, але
не потрібні блоки Docker, QA Lab, live, cross-OS або Package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker знаходиться в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також через workflow
`install-smoke` у режимі релізу. Він валідовує кандидата на реліз через упаковані
середовища Docker, а не лише через тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повний install smoke з увімкненим повільним smoke глобального встановлення Bun
- лейни E2E для репозиторію
- частини Docker для шляху релізу: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b` і
  `bundled-channels`
- покриття OpenWebUI всередині частини `plugins-runtime-core`, коли це запитано
- розділені лейни залежностей bundled-channel у власній частині `bundled-channels`
  замість послідовного all-in-one лейна bundled-channel
- розділені лейни встановлення/видалення bundled Plugin
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-7`
- live/E2E набори провайдерів і покриття live-моделей Docker, коли перевірки релізу
  включають live-набори

Використовуйте артефакти Docker перед повторним запуском. Планувальник шляху релізу
вивантажує `.artifacts/docker-tests/` з логами лейнів, `summary.json`, `failures.json`,
часом фаз, JSON плану планувальника та командами повторного запуску. Для точкового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable workflow live/E2E замість
повторного запуску всіх частин релізу. Згенеровані команди повторного запуску включають попередній
`package_artifact_run_id` і підготовлені вхідні дані образів Docker, коли вони доступні, щоб
лейн, що впав, міг повторно використати той самий tarball і образи GHCR.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це gate
агентної поведінки та поведінки на рівні каналів для релізу, окремий від механіки пакетів Vitest і Docker.

Покриття QA Lab для релізу включає:

- mock parity gate, що порівнює кандидатний лейн OpenAI з базовим рівнем Opus 4.6
  за допомогою пакета agentic parity
- швидкий live-профіль Matrix QA з використанням середовища `qa-live-shared`
- live-лейн Telegram QA з орендою облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального підтвердження

Використовуйте цей блок, щоб відповісти на запитання «чи правильно поводиться реліз у QA-сценаріях і
live-потоках каналів?» Під час погодження релізу зберігайте URL артефактів для лейнів parity, Matrix і Telegram.
Повне покриття Matrix залишається доступним як ручний шардований запуск QA-Lab, а не
як типовий критичний для релізу лейн.

### Package

Блок Package — це gate для встановлюваного продукту. Його підтримують
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата в tarball `package-under-test`, який споживає Docker E2E, валідовує
інвентар пакета, записує версію пакета і SHA-256 та зберігає
ref harness workflow окремо від ref джерела пакета.

Підтримувані джерела кандидата:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: упакувати довірену гілку, тег або повний SHA коміту `package_ref`
  з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, вивантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Частини Docker для шляху релізу покривають
лейни встановлення, оновлення та оновлення Plugin, що перетинаються; Package Acceptance
зберігає артефактно-нативну сумісність bundled-channel, офлайн-фікстури Plugin і Telegram
package QA проти того самого визначеного tarball. Це GitHub-native
заміна для більшості покриття package/update, яке раніше вимагало
Parallels. Cross-OS перевірки релізу все ще важливі для специфічної для ОС поведінки onboarding,
інсталятора та платформи, але валідація продукту package/update має
віддавати перевагу Package Acceptance.

Історична поблажливість package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих
у npm: приватні записи інвентарю QA, відсутні в tarball; відсутній
`gateway install --wrapper`; відсутні patch-файли у git-фікстурі, похідній від tarball;
відсутній збережений `update.channel`; історичні розташування install-record для Plugin;
відсутнє збереження install-record marketplace; і міграція метаданих конфігурації під час `plugins update`.
Пакети після `2026.4.25` мають відповідати сучасним контрактам пакета;
ті самі прогалини призводять до провалу валідації релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
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

- `smoke`: швидкі лейни package install/channel/agent, мережі Gateway і
  перезавантаження конфігурації
- `package`: контракти package install/update/plugin без live ClawHub; це типовий варіант release-check
- `product`: `package` плюс канали MCP, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: частини Docker шляху релізу з OpenWebUI
- `custom`: точний список `docker_lanes` для точкових повторних запусків

Для доказу Telegram для кандидата пакета вмикайте `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
визначений tarball `package-under-test` у лейн Telegram; окремий
workflow Telegram як і раніше приймає специфікацію опублікованого npm для перевірок після публікації.

## Вхідні параметри workflow npm

`OpenClaw NPM Release` приймає такі вхідні параметри, контрольовані оператором:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з метою валідації
- `preflight_only`: `true` лише для валідації/збирання/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі вхідні параметри, контрольовані оператором:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки, що використовують секрети,
  вимагають, щоб визначений коміт був досяжний з гілки OpenClaw або
  тега релізу.

Правила:

- Stable- і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` вхідний повний SHA коміту дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані, перш ніж публікація продовжиться

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тегу можна використовувати поточний повний SHA коміту гілки workflow
     для dry run workflow preflight лише з метою валідації
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви навмисно хочете пряму stable-публікацію
3. Запустіть `Full Release Validation` для гілки релізу, тега релізу або повного
   SHA коміту, коли потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо навмисно потрібен лише детермінований звичайний тестовий граф, замість цього запустіть
   ручний workflow `CI` для ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо реліз навмисно був опублікований безпосередньо в `latest`, а `beta`
   має одразу слідувати за тією ж stable-збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його запланованій
   self-healing синхронізації перемістити `beta` пізніше

Мутація dist-tag живе в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і шлях просування beta-first
задокументованими та видимими для оператора.

Якщо мейнтейнеру доводиться повертатися до локальної npm-автентифікації, виконуйте будь-які команди
1Password CLI (`op`) лише в окремій сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; запуск усередині tmux робить prompts,
alerts і обробку OTP спостережуваними та запобігає повторним сповіщенням на хості.

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

Мейнтейнери використовують приватну документацію релізу в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізу](/uk/install/development-channels)
