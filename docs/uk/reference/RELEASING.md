---
read_when:
    - Шукаєте публічні визначення каналів релізу
    - Запуск валідації релізу або package acceptance
    - Шукаєте іменування версій і cadence
summary: Релізні lanes, контрольний список оператора, блоки валідації, іменування версій і cadence
title: Політика релізів
x-i18n:
    generated_at: "2026-04-27T06:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 166dbb4e3c2772a4bd73fb9d95dfb810036aefc06eb7ca37d6b7cb5ce1c0ec57
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні релізні lanes:

- stable: теговані релізи, які типово публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома голова `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія correction-релізу для stable: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний підвищений stable-реліз у npm
- `beta` означає поточну ціль встановлення beta
- Stable і correction-релізи stable типово публікуються в npm `beta`; оператори релізу можуть явно вибрати `latest` або пізніше підвищити перевірену beta-збірку
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і macOS-застосунком;
  beta-релізи зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збирання/pідпис/notarize macOS-застосунку резервується для stable, якщо інше не запитано явно

## Cadence релізів

- Релізи спочатку проходять через beta
- Stable іде лише після перевірки останньої beta
- Maintainer-и зазвичай роблять релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб валідація релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було pushed або published і він потребує виправлення, maintainers роблять
  наступний тег `-beta.N` замість видалення або перевідтворення старого beta-тега
- Детальна процедура релізу, схвалення, credentials і примітки щодо відновлення
  доступні лише для maintainer-ів

## Контрольний список оператора релізу

Цей контрольний список — публічна форма процесу релізу. Приватні credentials,
підписування, notarization, відновлення dist-tag і деталі аварійного rollback
залишаються в runbook релізів лише для maintainer-ів.

1. Почніть із поточного `main`: підтягніть останні зміни, переконайтеся, що цільовий commit уже pushed,
   і що поточний CI для `main` достатньо зелений, щоб від нього відгалужуватися.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії commit через
   `/changelog`, збережіть записи орієнтованими на користувача, закомітьте це, запуште й ще раз виконайте rebase/pull перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення все ще покрито, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` із поточного `main`; не виконуйте звичайну роботу релізу
   безпосередньо в `main`.
5. Оновіть усі обов’язкові місця версії для потрібного тега, а потім запустіть
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   для валідаційного preflight дозволено повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки релізу, тега або повного commit SHA. Це єдина ручна точка входу
   для чотирьох великих блоків перевірки релізу: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не проходить, виправте проблему в гілці релізу й повторно запустіть найменший збійний
   файл, lane, job workflow, профіль package, provider або allowlist моделі, який
   доводить виправлення. Повторно запускайте повний umbrella лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta: створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім запустіть
   post-publish package acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо pushed або published beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для stable: продовжуйте лише після того, як перевірена beta або release candidate матиме
    необхідні докази валідації. Stable-публікація в npm повторно використовує успішний
    артефакт preflight через `preflight_run_id`; готовність stable macOS-релізу
    також вимагає запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, за потреби окремий
    published-npm Telegram E2E, коли вам потрібен доказ каналу після публікації,
    підвищення dist-tag, коли це потрібно, GitHub release/prerelease notes з
    повної відповідної секції `CHANGELOG.md`, а також кроки оголошення релізу.

## Preflight релізу

- Запускайте `pnpm check:test-types` перед preflight релізу, щоб TypeScript тестів
  залишався покритим поза швидшою локальною перевіркою `pnpm check`
- Запускайте `pnpm check:architecture` перед preflight релізу, щоб ширші перевірки
  циклів імпорту й архітектурних меж були зеленими поза швидшою локальною перевіркою
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і bundle Control UI існували для кроку
  валідації pack
- Запускайте ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі блоки передрелізного тестування з однієї точки входу. Він приймає гілку,
  тег або повний commit SHA, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, Docker
  release-path наборів, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  lanes. Передавайте `npm_telegram_package_spec` лише після того, як пакет уже
  опубліковано і також потрібно запустити post-publish Telegram E2E. Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте ручний workflow `Package Acceptance`, коли вам потрібен побічний доказ
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball із обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата до
  `package-under-test`, повторно використовує Docker E2E release scheduler для цього
  tarball і може запускати Telegram QA для того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: lanes встановлення/каналу/агента, мережі gateway і перезавантаження конфігурації
  - `package`: artifact-native lanes package/update/Plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: Docker release-path chunks з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для цільового повторного запуску
- Запускайте ручний workflow `CI` напряму, коли вам потрібне лише повне звичайне CI
  покриття для кандидата на реліз. Ручні запуски CI обходять changed
  scoping і примусово вмикають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python Skills, Windows, macOS, Android і локалізацію Control UI i18n
  lanes.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke`, коли перевіряєте телеметрію релізу. Це проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace
  spans, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse чи іншому зовнішньому collector
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Release checks тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity gate QA Lab плюс швидкий
  live Matrix profile і Telegram QA lane перед схваленням релізу. Live
  lanes використовують середовище `qa-live-shared`; Telegram також використовує оренду
  credentials Convex CI. Запускайте ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли вам потрібен повний паралельний
  інвентар транспорту, media і E2EE для Matrix.
- Cross-OS валідація встановлення й оновлення під час виконання є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  повторно використовуваний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` напряму
- Цей поділ є навмисним: тримайте реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки лишаються у
  власному lane, щоб не затримувати й не блокувати публікацію
- Release checks, які містять secrets, слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  secrets залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний commit SHA, якщо
  визначений commit досяжний із гілки OpenClaw або тега релізу
- Валідаційний preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний commit SHA гілки workflow без вимоги наявності
  pushed-тега
- Шлях із SHA є лише валідаційним і не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно потребує справжнього тега релізу
- Обидва workflows зберігають реальний шлях публікації й просування на GitHub-hosted
  runner-ах, тоді як шлях без змін стану для валідації може використовувати більші
  Blacksmith Linux runner-и
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий lane release checks
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед схваленням
- Після npm publish запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення
  опублікованого реєстрового пакета в новому тимчасовому префіксі
- Після beta publish запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  для опублікованого npm-пакета з використанням спільного пулу орендованих Telegram credentials.
  Локальні одноразові запуски maintainer-ів можуть не використовувати змінні Convex і передавати напряму
  три env credentials `OPENCLAW_QA_TELEGRAM_*`.
- Maintainer-и можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається при кожному merge.
- Автоматизація релізів maintainer-ів тепер використовує preflight-then-promote:
  - реальна npm publish має пройти успішний npm `preflight_run_id`
  - реальна npm publish має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable npm-релізи типово йдуть у `beta`
  - stable npm publish може явно націлюватися на `latest` через вхід workflow
  - зміна npm dist-tag на основі токена тепер міститься в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` є лише валідаційним
  - реальна приватна mac-публікація має пройти успішні приватні
    `preflight_run_id` і `validate_run_id` для mac
  - реальні шляхи публікації просувають підготовлені артефакти замість їх повторного збирання
- Для stable correction-релізів на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб correction-релізи не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- npm release preflight завершується з блокуванням, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожнього payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню browser dashboard
- Post-publish verification також перевіряє, що встановлення опублікованого пакета з реєстру
  містить непорожні залежності runtime вбудованих Plugin у кореневому layout
  `dist/*`. Реліз, який постачається з відсутнім або порожнім payload
  залежностей вбудованих Plugin, не проходить postpublish verifier і не може бути підвищений
  до `latest`.
- `pnpm test:install:smoke` також контролює бюджет `unpackedSize` для npm pack
  на tarball кандидата оновлення, тож installer e2e відловлює випадкове роздуття pack
  до шляху publish релізу
- Якщо робота над релізом торкалася планування CI, маніфестів таймінгів розширень або
  матриць тестів розширень, перегенеруйте й перегляньте керовані планувальником
  виходи матриці workflow `checks-node-extensions` з `.github/workflows/ci.yml`
  перед схваленням, щоб примітки до релізу не описували застарілу схему CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - GitHub release має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після publish
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище за канонічну нижню межу збірки Sparkle
    для цієї версії релізу

## Блоки тестування релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести
з однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте
гілку релізу, тег або повний commit SHA як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both
```

Workflow визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
за бажанням запускає окремий post-publish Telegram E2E, коли
задано `npm_telegram_package_spec`. Потім `OpenClaw Release Checks` розгортає
install smoke, cross-OS release checks, live/E2E Docker release-path coverage,
Package Acceptance з Telegram package QA, QA Lab parity, live Matrix і
live Telegram. Повний запуск є прийнятним лише тоді, коли summary `Full Release Validation`
показує успішні `normal_ci` і `release_checks`, а будь-який необов’язковий дочірній
`npm_telegram` є або успішним, або навмисно пропущеним.

Використовуйте ці варіанти залежно від стадії релізу:

```bash
# Перевірити неопубліковану гілку кандидата на реліз.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# Перевірити точний pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# Після публікації beta додати Telegram E2E для опублікованого пакета.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повний umbrella як перший повторний запуск після точкового виправлення. Якщо один блок
не проходить, використовуйте збійний дочірній workflow, job, Docker lane, package
profile, model provider або QA lane для наступного доказу. Повторно запускайте весь umbrella
лише тоді, коли виправлення змінило спільну оркестрацію релізу або зробило попередні
докази по всіх блоках застарілими.

### Vitest

Блок Vitest — це дочірній ручний workflow `CI`. Ручний CI навмисно
обходить changed scoping і примусово вмикає звичайний граф тестування для
кандидата на реліз: Linux Node shards, bundled-plugin shards, channel contracts, сумісність Node 22,
`check`, `check-additional`, build smoke, перевірки документації, Python
Skills, Windows, macOS, Android і локалізацію Control UI i18n.

Використовуйте цей блок, щоб відповісти на запитання «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що валідація продукту на шляху релізу. Докази, які варто зберігати:

- summary `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви shard-ів CI jobs, що впали або працювали повільно, під час дослідження регресій
- артефакти таймінгів Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли для релізу потрібен детермінований звичайний CI, але
не потрібні Docker, QA Lab, live, cross-OS або package блоки:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker розміщений у `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також через workflow
`install-smoke` у режимі релізу. Він перевіряє кандидата на реліз через
упаковані Docker-середовища, а не лише через тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повний install smoke з увімкненим повільним smoke для глобального встановлення Bun
- repository E2E lanes
- Docker chunks шляху релізу: `core`, `package-update` і
  `plugins-integrations`
- покриття OpenWebUI всередині chunk `plugins-integrations`, коли це запитано
- розділені lanes залежностей bundled-channel всередині `plugins-integrations`
  замість послідовного all-in-one lane bundled-channel
- live/E2E набори провайдерів і покриття live-моделей Docker, коли release checks
  включають live-набори

Використовуйте Docker-артефакти перед повторним запуском. Планувальник шляху релізу завантажує
`.artifacts/docker-tests/` з логами lanes, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника і командами повторного запуску. Для точкового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у повторно використовуваному workflow live/E2E замість
повторного запуску всіх chunks релізу. Згенеровані команди повторного запуску містять попередні
`package_artifact_run_id` і підготовлені вхідні параметри Docker-образів, коли вони доступні, щоб
збійний lane міг повторно використати той самий tarball і GHCR-образи.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це релізна перевірка
агентної поведінки та роботи на рівні каналів, окрема від механіки пакетів
Vitest і Docker.

Покриття QA Lab для релізу включає:

- mock parity gate, який порівнює lane кандидата OpenAI з базовим
  Opus 4.6 за допомогою agentic parity pack
- швидкий live-профіль Matrix QA з використанням середовища `qa-live-shared`
- live Telegram QA lane з використанням орендованих credentials Convex CI
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального підтвердження

Використовуйте цей блок, щоб відповісти на запитання «чи реліз поводиться правильно в QA-сценаріях і
live-потоках каналів?» Під час схвалення релізу зберігайте URL артефактів для parity, Matrix і Telegram
lanes. Повне покриття Matrix лишається доступним як ручний шардований запуск QA-Lab, а не як типовий критичний для релізу lane.

### Package

Блок Package — це перевірка інстальованого продукту. Він реалізований через
`Package Acceptance` і резолвер
`scripts/resolve-openclaw-package-candidate.mjs`. Резолвер нормалізує
кандидата до tarball `package-under-test`, який споживає Docker E2E, перевіряє
inventory пакета, записує версію пакета та SHA-256 і тримає
ref harness workflow окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу
  OpenClaw
- `source=ref`: запакувати довірену гілку, тег або повний commit SHA `package_ref`
  з вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=package` і
`telegram_mode=mock-openai`. Цей профіль покриває встановлення, оновлення, контракти пакетів Plugin через офлайнові fixture-и Plugin і Telegram package QA
для того самого визначеного tarball. Це GitHub-native заміна для більшості
покриття package/update, яке раніше вимагало Parallels. Cross-OS
перевірки релізу все ще важливі для специфічної для ОС поведінки onboarding, installer і платформи, але перевірку продукту package/update слід віддавати
Package Acceptance.

Legacy-поблажливість package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин у метаданих, які вже були опубліковані
в npm: приватні QA-записи inventory, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch-файли у похідному від tarball git
fixture, відсутній збережений `update.channel`, legacy-розташування install-record
Plugin, відсутність збереження install-record marketplace і міграція метаданих конфігурації під час `plugins update`. Пакети після `2026.4.25` мають задовольняти
сучасні package-контракти; ті самі прогалини призводять до помилки валідації релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
реального інстальованого пакета:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Поширені package-профілі:

- `smoke`: швидкі lanes встановлення пакета/каналу/агента, мережі gateway і
  перезавантаження конфігурації
- `package`: контракти package/update/Plugin пакета без live ClawHub; це типове значення
  для release-check
- `product`: `package` плюс MCP-канали, очищення cron/subagent, OpenAI web
  search і OpenWebUI
- `full`: Docker chunks шляху релізу з OpenWebUI
- `custom`: точний список `docker_lanes` для точкових повторних запусків

Для Telegram-доказу кандидата пакета ввімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
визначений tarball `package-under-test` у Telegram lane; окремий
Telegram workflow все ще приймає опубліковану npm-специфікацію для post-publish перевірок.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, керовані оператором:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для валідаційного preflight
- `preflight_only`: `true` лише для валідації/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий для реального шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типово `beta`

`OpenClaw Release Checks` приймає такі вхідні параметри, керовані оператором:

- `ref`: гілка, тег або повний commit SHA для перевірки. Перевірки, що містять secrets,
  вимагають, щоб визначений commit був досяжний з гілки OpenClaw або
  тега релізу.

Правила:

- Stable і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  лише валідаційними
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використовувати поточний повний commit
     SHA гілки workflow для валідаційного dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first процесу або `latest` лише
   коли ви свідомо хочете пряму stable-публікацію
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   commit SHA, коли вам потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram-покриття з одного ручного workflow
4. Якщо вам свідомо потрібен лише детермінований звичайний граф тестування, запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw NPM Release` ще раз з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз опубліковано в `beta`, використовуйте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю stable-версію з `beta` до `latest`
8. Якщо реліз свідомо опубліковано одразу в `latest`, а `beta`
   має одразу вказувати на ту саму stable-збірку, використовуйте той самий приватний
   workflow, щоб обидва dist-tag указували на stable-версію, або дозвольте його
   запланованій self-healing синхронізації оновити `beta` пізніше

Зміна dist-tag знаходиться в приватному репозиторії з міркувань безпеки, тому що вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це дозволяє зберегти як шлях прямої публікації, так і beta-first шлях просування
задокументованими й видимими для оператора.

Якщо maintainer мусить перейти на локальну автентифікацію npm, запускайте будь-які команди
1Password CLI (`op`) лише всередині окремої сесії tmux. Не викликайте `op`
напряму з основної оболонки агента; виконання всередині tmux робить prompts,
alerts і обробку OTP видимими та запобігає повторним alerts на хості.

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

Maintainer-и використовують приватну документацію з релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізу](/uk/install/development-channels)
