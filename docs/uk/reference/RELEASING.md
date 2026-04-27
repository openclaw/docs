---
read_when:
    - Шукаю визначення публічних каналів релізу
    - Виконання валідації релізу або перевірки прийнятності пакета
    - Шукаю іменування версій і частоту випусків
summary: Релізні напрямки, контрольний список оператора, блоки валідації, іменування версій і частота випусків
title: Політика релізів
x-i18n:
    generated_at: "2026-04-27T22:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d007af3cf645d1dd84013e686b7a0513fa97f58a5ad1c5758b70a7c93e2458f4
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні напрями релізу:

- stable: релізи з тегами, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього релізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте ведучі нулі до місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спочатку проходять валідацію та публікацію шляху npm/package, а
  збірка/підпис/нотаризація застосунку macOS зарезервовані для stable, якщо інше не запитано явно

## Частота випусків релізів

- Релізи спочатку проходять через beta
- Stable виходить лише після валідації останньої beta
- Мейнтейнери зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб валідація релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура релізу, погодження, облікові дані та примітки щодо відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора релізу

Цей контрольний список описує публічну форму процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату залишаються
в доступному лише мейнтейнерам runbook релізів.

1. Почніть із поточної `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт запушено,
   і що поточний CI для `main` достатньо зелений, щоб від нього відгалужуватися.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте це, запуште й ще раз виконайте rebase/pull перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` із поточної `main`; не виконуйте звичайну роботу над релізом
   безпосередньо в `main`.
5. Оновіть усі потрібні місця з версіями для запланованого тега, а потім виконайте
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тег ще не існує,
   для preflight-лише валідації дозволено використовувати повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки релізу, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих блоків тестування релізу: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте проблему в гілці релізу й повторно запустіть найменший збійний
   файл, напрям, завдання workflow, профіль пакета, allowlist провайдера або моделі, який
   підтверджує виправлення. Повторно запускайте повну загальну перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім виконайте
   перевірку прийнятності пакета після публікації для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо запушена або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або кандидат у реліз має
    потрібні докази валідації. Stable-публікація в npm повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність stable-релізу для macOS
    також вимагає наявності запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть верифікатор npm після публікації, за потреби —
    необов’язковий окремий Telegram E2E для опублікованого npm, коли потрібне підтвердження каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub release/prerelease з
    повної відповідної секції `CHANGELOG.md` і кроки оголошення релізу.

## Preflight релізу

- Перед preflight релізу запускайте `pnpm check:test-types`, щоб TypeScript для тестів
  залишався покритим поза межами швидшого локального етапу `pnpm check`
- Перед preflight релізу запускайте `pnpm check:architecture`, щоб ширші перевірки
  циклів імпорту й архітектурних меж були зеленими поза межами швидшого локального етапу
- Перед `pnpm release:check` запускайте `pnpm build && pnpm ui:build`, щоб очікувані
  артефакти релізу `dist/*` і пакет Control UI існували для кроку
  валідації pack
- Перед затвердженням релізу запускайте вручну workflow `Full Release Validation`,
  щоб запустити всі передрелізні тестові блоки з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, вручну запускає `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, наборів
  release-path для Docker, live/E2E, OpenWebUI, паритету QA Lab, напрямів Matrix і Telegram.
  Указуйте `npm_telegram_package_spec` лише після того, як пакет уже
  опубліковано й також потрібно запустити Telegram E2E після публікації. Указуйте
  `evidence_package_spec`, коли приватний звіт про докази має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте вручну workflow `Package Acceptance`, коли потрібен побічний доказ
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточним harness
  `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого з іншого запуску GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує планувальник Docker E2E release для цього
  tarball і може запускати Telegram QA для того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Типові профілі:
  - `smoke`: напрями install/channel/agent, мережа gateway і перезавантаження конфігурації
  - `package`: нативні для артефакта напрями package/update/plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс канали MCP, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: частини Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для цільового повторного запуску
- Запускайте вручну workflow `CI` безпосередньо, коли потрібне лише повне покриття
  звичайного CI для кандидата релізу. Ручний запуск CI обходить змінене scope і
  примусово запускає Linux Node shards, shards bundled-plugin, channel
  contracts, сумісність з Node 22, напрями `check`, `check-additional`, build smoke,
  docs checks, Python Skills, Windows, macOS, Android і Control UI i18n.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час валідації телеметрії релізу. Це перевіряє
  QA-lab через локальний приймач OTLP/HTTP і валідує експортовані назви trace span,
  обмежені атрибути та редагування content/identifier без
  потреби в Opik, Langfuse чи іншому зовнішньому збирачі.
- Перед кожним тегованим релізом запускайте `pnpm release:check`
- Тепер перевірки релізу виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate і швидкий
  live-профіль Matrix та напрям Telegram QA перед затвердженням релізу. Live-напрями використовують середовище `qa-live-shared`; Telegram також використовує оренду CI-облікових даних Convex. Запускайте вручну workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний паралельний
  інвентар транспорту, медіа й E2EE для Matrix.
- Кросплатформна валідація встановлення й оновлення під час виконання входить до публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Такий поділ навмисний: зберігайте реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки лишаються у
  власному напрямі, щоб не затримувати й не блокувати публікацію
- Перевірки релізу, що використовують секрети, слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow та
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  визначений коміт досяжний з гілки OpenClaw або тега релізу
- Валідаційний preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби в запушеному тегі
- Цей шлях через SHA призначений лише для валідації й не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає реального тега релізу
- Обидва workflow зберігають реальний шлях публікації й просування на GitHub-hosted
  runners, тоді як шлях валідації без змін стану може використовувати більші
  Linux runners від Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Preflight npm-релізу більше не очікує завершення окремого напряму release checks
- Перед затвердженням запускайте
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег)
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з
  опублікованого реєстру в новому тимчасовому prefix
- Після beta-публікації запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  для опублікованого npm-пакета з використанням спільного пулу орендованих Telegram-облікових даних.
  Для одноразових локальних запусків мейнтейнера можна не вказувати змінні Convex і передати напряму три
  облікові дані середовища `OPENCLAW_QA_TELEGRAM_*`.
- Мейнтейнери можуть запускати ту саму перевірку після публікації з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно доступний лише вручну й
  не запускається після кожного merge.
- Автоматизація релізів для мейнтейнерів тепер використовує схему preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - реальна публікація в npm має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable-релізи npm за замовчуванням націлені на `beta`
  - stable-публікація в npm може явно націлювати `latest` через вхідні параметри workflow
  - зміна npm dist-tag на основі токена тепер розташована в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість їх повторної збірки
- Для stable-коригувальних релізів на кшталт `YYYY.M.D-N` верифікатор після публікації
  також перевіряє той самий шлях оновлення через тимчасовий prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні релізи не могли непомітно залишити старі глобальні встановлення на
  базовому stable-навантаженні
- Preflight npm-релізу завершується з відмовою за замовчуванням, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню браузерну панель
- Верифікація після публікації також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні runtime deps bundled plugin у кореневому
  layout `dist/*`. Реліз, який постачається з відсутніми або порожніми payload
  залежностей bundled plugin, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет `unpackedSize` npm pack до
  tarball кандидата оновлення, тож installer e2e виявляє випадкове збільшення pack
  ще до шляху публікації релізу
- Якщо робота над релізом зачіпала планування CI, маніфести часу для extension або
  матриці тестів extension, перед затвердженням регенеруйте й перегляньте керовані планувальником
  виходи матриці workflow `checks-node-extensions` з `.github/workflows/ci.yml`,
  щоб нотатки релізу не описували застарілу структуру CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - GitHub release має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має після публікації вказувати на новий stable zip
  - запакований застосунок має зберігати non-debug bundle id, непорожній feed
    URL для Sparkle і `CFBundleVersion` на рівні canonical Sparkle build floor
    або вище для цієї версії релізу

## Тестові блоки релізу

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

Workflow визначає цільовий ref, запускає вручну `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
за потреби запускає окремий Telegram E2E після публікації, коли
встановлено `npm_telegram_package_spec`. Далі `OpenClaw Release Checks` розгалужує
install smoke, кросплатформні перевірки релізу, live/E2E покриття Docker release-path,
Package Acceptance з Telegram package QA, паритет QA Lab, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні, а будь-який необов’язковий дочірній
`npm_telegram` або успішний, або навмисно пропущений.
Дочірні workflow запускаються з довіреного ref, на якому виконується `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` указує на
старішу гілку релізу або тег. Окремого параметра workflow-ref для Full Release Validation
немає; обирайте довірений harness, обираючи ref запуску workflow.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Валідація неопублікованої гілки кандидата релізу.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both

# Валідація точного запушеного коміту.
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

Не використовуйте повну загальну перевірку як перший повторний запуск після цільового виправлення. Якщо один блок
не проходить, використовуйте збійний дочірній workflow, job, Docker-напрям, профіль пакета, модельного
провайдера або QA-напрям для наступного підтвердження. Повторно запускайте повну загальну перевірку лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази по всіх блоках
застарілими. Фінальний верифікатор загальної перевірки повторно перевіряє записані run id дочірніх workflow,
тому після успішного повторного запуску дочірнього workflow повторно запускайте лише збійне
батьківське job `Verify full validation`.

Для обмеженого відновлення передайте в загальний workflow `rerun_group`. `all` — це справжній
запуск кандидата на реліз, `ci` запускає лише дочірній звичайний CI, `release-checks` запускає
кожен блок релізу, а вужчі групи релізу — це `install-smoke`,
`cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і
`npm-telegram`, коли передано окремий напрям Telegram для пакета.

### Vitest

Блок Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
обходить scope змін і примусово запускає звичайний граф тестів для кандидата на реліз:
Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей блок, щоб відповісти на запитання «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що валідація продукту за release-path. Докази, які слід зберігати:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви shard із помилками або повільних shard із job CI під час дослідження регресій
- артефакти часу Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не потрібні блоки Docker, QA Lab, live, cross-OS або package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker розташований у `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також у workflow
`install-smoke` у режимі релізу. Він валідовує кандидата на реліз через запаковані
середовища Docker, а не лише тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- напрями E2E для репозиторію
- частини Docker release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-b` і `bundled-channels-contracts`
- покриття OpenWebUI всередині частини `plugins-runtime-core`, коли це запитано
- розділені напрями залежностей bundled-channel між частинами channel-smoke, update-target
  і setup/runtime contract замість одного великого job bundled-channel
- розділені напрями встановлення/видалення bundled plugin
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-7`
- набори live/E2E для провайдерів і покриття live-моделей Docker, коли перевірки релізу
  включають live-набори

Використовуйте артефакти Docker перед повторним запуском. Планувальник release-path вивантажує
`.artifacts/docker-tests/` з логами напрямів, `summary.json`, `failures.json`,
часом фаз, JSON плану планувальника та командами повторного запуску. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable workflow live/E2E замість
повторного запуску всіх частин релізу. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені вхідні параметри образів Docker, коли вони доступні, тож
напрям із помилкою може повторно використати той самий tarball і образи GHCR.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це релізний gate для
агентної поведінки та поведінки на рівні каналів, окремий від механіки пакетів Vitest і Docker.

Покриття QA Lab для релізу включає:

- mock parity gate, який порівнює напрям кандидата OpenAI з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- швидкий live-профіль QA для Matrix з середовищем `qa-live-shared`
- live-напрям QA для Telegram з орендою облікових даних CI у Convex
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального підтвердження

Використовуйте цей блок, щоб відповісти на запитання «чи реліз поводиться правильно в QA-сценаріях і
live-потоках каналів?» Під час затвердження релізу зберігайте URL артефактів для
напрямів parity, Matrix і Telegram. Повне покриття Matrix лишається доступним як
ручний шардований запуск QA-Lab, а не як напрям за замовчуванням, критичний для релізу.

### Package

Блок Package — це gate для встановлюваного продукту. Він базується на
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата в tarball `package-under-test`, який споживає Docker E2E, валідовує
інвентар пакета, записує версію пакета й SHA-256 та зберігає ref harness workflow
окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: запакувати довірену гілку, тег або повний SHA коміту `package_ref`
  із вибраним harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, вивантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Частини Docker release-path покривають
перетинні напрями install, update і plugin-update; Package Acceptance зберігає
нативну для артефакта сумісність bundled-channel, офлайн-фікстури плагінів і Telegram package QA для того самого визначеного tarball. Це нативна для GitHub
заміна більшості покриття package/update, яке раніше вимагало
Parallels. Кросплатформні перевірки релізу все ще важливі для специфічної для ОС
поведінки onboarding, installer і платформи, але валідація продукту package/update повинна
віддавати перевагу Package Acceptance.

Історична поблажливість package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин у метаданих, уже
опублікованих у npm: приватні записи QA inventory, відсутні в tarball,
відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, похідній від tarball,
відсутній збережений `update.channel`, історичні розташування install-record
для плагінів, відсутність збереження marketplace install-record і
міграція метаданих конфігурації під час `plugins update`. Пакети після `2026.4.25` повинні відповідати
сучасним контрактам пакета; ті самі прогалини призведуть до помилки валідації релізу.

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

- `smoke`: швидкі напрями встановлення package/channel/agent, мережі gateway і
  перезавантаження конфігурації
- `package`: контракти package install/update/plugin без live ClawHub; це типовий варіант release-check
- `product`: `package` плюс канали MCP, очищення cron/subagent, OpenAI web
  search і OpenWebUI
- `full`: частини Docker release-path з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для підтвердження Telegram для кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає tarball
визначеного `package-under-test` у напрям Telegram; окремий workflow
Telegram усе ще приймає специфікацію опублікованого npm для перевірок після публікації.

## Вхідні параметри workflow npm

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight, призначеного лише для валідації
- `preflight_only`: `true` для лише валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий для реального шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий тег npm для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки, що використовують секрети,
  вимагають, щоб визначений коміт був досяжний із гілки OpenClaw або
  тега релізу.

Правила:

- Теги stable і correction можуть публікуватися як у `beta`, так і в `latest`
- Теги beta prerelease можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані, перш ніж продовжити публікацію

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тег ще не існує, ви можете використовувати поточний повний SHA коміту
     гілки workflow для dry-run валідації preflight workflow
2. Оберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   тоді, коли ви навмисно хочете напряму опублікувати stable
3. Запустіть `Full Release Validation` для гілки релізу, тега релізу або повного
   SHA коміту, коли вам потрібні звичайний CI, live prompt cache, Docker, QA Lab,
   Matrix і Telegram coverage з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` для ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо реліз навмисно було одразу опубліковано в `latest`, а `beta`
   має одразу вказувати на ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його
   запланованій self-healing синхронізації перемістити `beta` пізніше

Зміна dist-tag розташована в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає як шлях прямої публікації, так і шлях просування beta-first
задокументованими й видимими для оператора.

Якщо мейнтейнеру доведеться повернутися до локальної автентифікації npm, запускайте будь-які команди
1Password CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; запуск усередині tmux робить запити,
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

Мейнтейнери використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
