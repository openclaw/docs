---
read_when:
    - Шукаю визначення публічних каналів релізу
    - Запуск валідації релізу або приймання пакета
    - Шукаю іменування версій і каденцію
summary: Лейни релізу, контрольний список оператора, блоки валідації, іменування версій та каденція
title: Політика релізів
x-i18n:
    generated_at: "2026-04-27T04:17:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6308b39a6711a60dd1be441b202c565273df772f5256f6b531067ac41c6466f2
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні лейни релізу:

- stable: релізи з тегами, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома голова `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального stable-релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable- і коригувальні stable-релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або просунути перевірену beta-збірку пізніше
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спочатку проходять валідацію та публікацію шляху npm/package, а
  збірка/підпис/нотаризація застосунку macOS зарезервовані для stable, якщо інше не запитано явно

## Каденція релізів

- Релізи спочатку рухаються через beta
- Stable іде лише після валідації останньої beta
- Супровідники зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб валідація релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано і він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тегу
- Детальна процедура релізу, погодження, облікові дані та примітки щодо відновлення
  доступні лише супровідникам

## Контрольний список оператора релізу

Цей контрольний список описує публічну форму процесу релізу. Приватні облікові дані,
підпис, нотаризація, відновлення dist-tag і деталі аварійного відкоту залишаються в
закритому для супровідників runbook релізу.

1. Почніть з поточної `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт уже запушено,
   і що поточний CI `main` достатньо зелений, щоб відгалузитися від нього.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте це, запуште і ще раз зробіть rebase/pull перед створенням гілки.
3. Перегляньте записи про сумісність релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно залишено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу над релізом
   безпосередньо в `main`.
5. Оновіть усі потрібні місця з версіями для запланованого тегу, потім виконайте
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тег ще не існує,
   для preflight лише з валідацією дозволено повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести за допомогою `Full Release Validation` для
   гілки релізу, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих блоків тестування релізу: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте проблему в гілці релізу і повторно запустіть найменший
   файл, лейн, завдання workflow, профіль пакета, provider або allowlist моделі, який
   підтверджує виправлення. Повторно запускайте повний umbrella лише тоді, коли змінена поверхня
   робить попередні докази застарілими.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім виконайте
   post-publish приймання пакета для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо запушена або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте і не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або кандидат на реліз матиме
    потрібні докази валідації. Stable-публікація в npm повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність stable-релізу macOS
    також вимагає упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий окремий
    Telegram E2E для published-npm, коли вам потрібне post-publish підтвердження каналу,
    просування dist-tag за потреби, GitHub release/prerelease notes з
    повної відповідної секції `CHANGELOG.md`, а також кроки
    оголошення релізу.

## Preflight релізу

- Запускайте `pnpm check:test-types` перед preflight релізу, щоб тестовий TypeScript
  залишався покритим поза межами швидшого локального гейта `pnpm check`
- Запускайте `pnpm check:architecture` перед preflight релізу, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза межами швидшого локального гейта
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і бандл Control UI існували для кроку
  валідації pack
- Запускайте ручний workflow `Full Release Validation` перед погодженням релізу, щоб
  запустити всі блоки передрелізного тестування з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для install smoke, package acceptance, наборів
  release-path Docker, live/E2E, OpenWebUI, паритету QA Lab, лейнів Matrix і Telegram.
  Вказуйте `npm_telegram_package_spec` лише після того, як пакет уже було
  опубліковано і також потрібно запустити post-publish Telegram E2E. Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте ручний workflow `Package Acceptance`, коли вам потрібне додаткове підтвердження
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб упакувати довірену гілку/тег/SHA `package_ref` з поточним
  стендом `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow резолвить кандидата в
  `package-under-test`, повторно використовує Docker E2E release scheduler для цього
  tarball і може запускати Telegram QA для того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: install/channel/agent, лейни мережі gateway і перезавантаження конфігурації
  - `package`: лейни package/update/plugin без OpenWebUI
  - `product`: профіль package плюс MCP-канали, cron/subagent cleanup,
    OpenAI web search і OpenWebUI
  - `full`: чанки Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запускайте ручний workflow `CI` напряму, коли вам потрібне лише повне покриття
  звичайного CI для кандидата на реліз. Ручний запуск CI обходить changed-scoping
  і примусово вмикає Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність з Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і лейни i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час валідації телеметрії релізу. Це проганяє
  QA-lab через локальний OTLP/HTTP receiver і перевіряє імена експортованих trace span,
  обмежені атрибути та редагування content/identifier без потреби в
  Opik, Langfuse або іншому зовнішньому collector.
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate плюс live
  лейни Matrix і Telegram перед погодженням релізу. Live-лейни використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Cross-OS валідація встановлення й оновлення під час виконання запускається з
  приватного caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: зберігати реальний шлях npm-релізу коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному лейні, щоб не затримувати й не блокувати публікацію
- Перевірки релізу, що використовують секрети, слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  резолвлений коміт досяжний з гілки OpenClaw або тегу релізу
- Validation-only preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби в запушеному тезі
- Цей шлях через SHA призначений лише для валідації і не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно потребує справжнього тегу релізу
- Обидва workflow зберігають реальний шлях публікації та просування на GitHub-hosted
  runners, тоді як шлях валідації без мутацій може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох секретів workflow: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Preflight npm-релізу більше не чекає на окремий лейн перевірок релізу
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед погодженням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з
  опублікованого реєстру в новому тимчасовому prefix
- Після beta-публікації запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  для опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові перевірки супровідника можуть не вказувати змінні Convex і передавати три
  облікові дані env `OPENCLAW_QA_TELEGRAM_*` напряму.
- Супровідники можуть запускати таку саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно доступний лише вручну і
  не запускається для кожного merge.
- Автоматизація релізів супровідників тепер використовує preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable npm-релізи за замовчуванням ідуть у `beta`
  - stable npm-публікація може явно націлюватися на `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість того, щоб збирати
    їх знову
- Для stable correction релізів на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення у тимчасовому prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб корекції релізу не могли непомітно залишити старі глобальні встановлення на
  базовому stable payload
- Preflight npm-релізу завершується fail closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожнє наповнення `dist/control-ui/assets/`,
  щоб ми знову не відправили порожню панель браузера
- Post-publish перевірка також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні залежності виконання bundled plugin у кореневому
  layout `dist/*`. Реліз, що постачається з відсутнім або порожнім payload
  залежностей bundled plugin, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет `unpackedSize` для npm pack
  у tarball кандидата на оновлення, щоб installer e2e ловив випадкове роздуття pack
  до шляху публікації релізу
- Якщо робота над релізом зачепила планування CI, extension timing manifests або
  матриці тестів extension, перед погодженням повторно згенеруйте та перегляньте
  workflow matrix outputs `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб release notes не описували застарілу структуру CI
- Готовність stable-релізу macOS також включає поверхні updater:
  - GitHub release має в підсумку містити упаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - упакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімуму Sparkle build
    для цієї версії релізу

## Блоки тестування релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести
з однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте
гілку релізу, тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both
```

Workflow резолвить цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
за потреби запускає окремий post-publish Telegram E2E, коли
вказано `npm_telegram_package_spec`. Далі `OpenClaw Release Checks` розгалужується на
install smoke, cross-OS release checks, live/E2E покриття Docker release-path,
Package Acceptance з Telegram package QA, паритет QA Lab, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли в підсумку `Full Release Validation`
`normal_ci` і `release_checks` позначені як успішні, а будь-який необов’язковий дочірній
`npm_telegram` або успішний, або навмисно пропущений.

Використовуйте ці варіанти залежно від стадії релізу:

```bash
# Валідувати неопубліковану гілку кандидата на реліз.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# Валідувати точний запушений коміт.
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
завалився, використовуйте проблемний дочірній workflow, job, Docker-лейн, профіль пакета, model
provider або QA-лейн для наступного підтвердження. Повторно запускайте повний umbrella лише тоді,
коли виправлення змінило спільну оркестрацію релізу або зробило попередні докази для всіх блоків
застарілими.

### Vitest

Блок Vitest — це дочірній workflow ручного `CI`. Ручний CI навмисно
обходить changed-scoping і примусово вмикає звичайний граф тестування для
кандидата на реліз: Linux Node shards, bundled-plugin shards, channel contracts, сумісність з Node 22,
`check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android і i18n для Control UI.

Використовуйте цей блок, щоб відповісти на запитання: «чи пройшло дерево джерел повний звичайний набір тестів?»
Це не те саме, що продуктова валідація шляху релізу. Докази, які слід зберігати:

- підсумок `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- імена shard, що впали або були повільними, із CI jobs під час дослідження регресій
- артефакти таймінгу Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker, QA Lab, live, cross-OS або package-блоки:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker знаходиться в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також через workflow
`install-smoke` у режимі релізу. Він валідує кандидата на реліз через упаковані
Docker-середовища, а не лише через тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повний install smoke з увімкненим повільним smoke глобального встановлення Bun
- E2E-лейни репозиторію
- чанки Docker для release-path: `core`, `package-update` і
  `plugins-integrations`
- покриття OpenWebUI всередині чанка plugins/integrations
- live/E2E набори provider і покриття Docker live model, коли перевірки релізу
  включають live-набори

Використовуйте артефакти Docker перед повторним запуском. Планувальник release-path
завантажує `.artifacts/docker-tests/` з логами лейнів, `summary.json`, `failures.json`,
таймінгами фаз, JSON-планом scheduler і командами для повторного запуску. Для точкового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable workflow live/E2E замість
повторного запуску всіх чанків релізу.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це гейт
агентної поведінки та поведінки на рівні каналів для релізу, окремий від механіки пакетів Vitest і Docker.

Покриття QA Lab для релізу включає:

- mock parity gate, який порівнює кандидатний лейн OpenAI з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- live-лейн Matrix QA з використанням середовища `qa-live-shared`
- live-лейн Telegram QA з використанням оренди облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального підтвердження

Використовуйте цей блок, щоб відповісти на запитання: «чи поводиться реліз правильно в QA-сценаріях і
live-потоках каналів?» Під час погодження релізу зберігайте URL артефактів для лейнів parity, Matrix і Telegram.

### Package

Блок Package — це гейт інстальованого продукту. Він працює на основі
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата в tarball `package-under-test`, який споживає Docker E2E, валідує
інвентар пакета, фіксує версію пакета і SHA-256 та тримає
ref стенда workflow окремо від ref джерела пакета.

Підтримувані джерела кандидата:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: упакувати довірену гілку, тег або повний SHA коміту `package_ref`
  з вибраним стендом `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=package` і
`telegram_mode=mock-openai`. Цей профіль покриває контракти install, update, plugin
package і Telegram package QA для того самого резолвленого tarball,
і є нативною для GitHub заміною більшості покриття package/update,
яке раніше вимагало Parallels. Cross-OS перевірки релізу все ще важливі для
специфічної для ОС поведінки onboarding, installer і платформи, але продуктова валідація
package/update має надавати перевагу Package Acceptance.

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

Поширені профілі пакетів:

- `smoke`: швидкі лейни встановлення package/channel/agent, мережі gateway і
  перезавантаження конфігурації
- `package`: контракти install/update/plugin package; це значення за замовчуванням
  для release-check
- `product`: `package` плюс канали MCP, очищення cron/subagent, OpenAI web
  search і OpenWebUI
- `full`: чанки Docker release-path з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для підтвердження Telegram для кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
резолвлений tarball `package-under-test` у Telegram-лейн; окремий
workflow Telegram, як і раніше, приймає специфікацію опублікованого npm для post-publish перевірок.

## Входи workflow npm

`OpenClaw NPM Release` приймає такі входи, керовані оператором:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для validation-only preflight
- `preflight_only`: `true` для лише валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий для реального шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі входи, керовані оператором:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки, що використовують секрети,
  вимагають, щоб резолвлений коміт був досяжним із гілки OpenClaw або
  тегу релізу.

Правила:

- Stable- і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` вхід повного SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  лише валідаційними
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані, перш ніж продовжити публікацію

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тег ще не існує, ви можете використовувати поточний повний SHA коміту гілки workflow
     для validation-only dry run workflow preflight
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви свідомо хочете прямої stable-публікації
3. Запустіть `Full Release Validation` для гілки релізу, тегу релізу або повного
   SHA коміту, коли вам потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо реліз навмисно був одразу опублікований у `latest` і `beta`
   має одразу слідувати за тією самою stable-збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його запланованій
   self-healing синхронізації пересунути `beta` пізніше

Мутація dist-tag знаходиться в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це дозволяє задокументувати і зробити видимими для оператора як шлях прямої публікації,
так і шлях beta-first просування.

Якщо супровіднику доведеться повернутися до локальної автентифікації npm, запускайте будь-які команди
1Password CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
безпосередньо з основної оболонки агента; виконання всередині tmux робить prompts,
alerts і обробку OTP видимими та запобігає повторним alert на хості.

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

Супровідники використовують приватну документацію релізу в
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізу](/uk/install/development-channels)
