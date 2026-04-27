---
read_when:
    - Шукаю визначення публічних каналів релізу
    - Запуск валідації релізу або приймання пакета
    - Шукаю іменування версій та каденцію
summary: Гілки релізу, контрольний список оператора, блоки валідації, іменування версій та каденція
title: Політика релізів
x-i18n:
    generated_at: "2026-04-27T03:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf9e521f825f02fc9682f2c96f6b0d96c3a78277324756e94114c40c516e5c1c
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні гілки релізу:

- stable: позначені тегами релізи, які типово публікуються в npm як `beta`, або в npm як `latest`, якщо це явно запитано
- beta: prerelease-теги, які публікуються в npm як `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні релізи типово публікуються в npm як `beta`; оператори релізу можуть явно націлити `latest` або просунути перевірену beta-збірку пізніше
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спочатку проходять валідацію та публікацію шляху npm/package, а збірка/підпис/нотаризація застосунку macOS зарезервовані для stable, якщо інше не запитано явно

## Каденція релізів

- Релізи спочатку проходять через beta
- Stable виходить лише після валідації останньої beta
- Супровідники зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб валідація релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або перевідтворення старого beta-тега
- Детальна процедура релізу, погодження, облікові дані та примітки щодо відновлення
  призначені лише для супровідників

## Контрольний список оператора релізу

Цей контрольний список є публічним виглядом потоку релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату
залишаються в runbook релізів лише для супровідників.

1. Почніть із поточної `main`: отримайте останні зміни, підтвердьте, що цільовий коміт запушено,
   і що поточний CI для `main` достатньо зелений, щоб відгалузитися від нього.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте їх, запуште й ще раз зробіть rebase/pull перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу над релізом
   безпосередньо в `main`.
5. Оновіть усі потрібні місця версій для запланованого тега, а потім виконайте
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тега ще не існує,
   для preflight-валидації дозволено повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть `Full Release Validation` для гілки релізу, тега або повного SHA коміту. Це
   узагальнений запуск для чотирьох великих блоків тестування релізу: Vitest,
   Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте проблему в гілці релізу й повторно запустіть найменший
   файл, гілку, завдання workflow, профіль пакета, провайдера або allowlist моделі, який
   підтверджує виправлення. Повторно запускайте весь узагальнений процес лише тоді, коли змінена поверхня
   робить попередні докази неактуальними.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім запустіть
   post-publish package acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо запушена або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або кандидат релізу матиме
    потрібні докази валідації. Публікація stable в npm повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність stable-релізу macOS
    також вимагає запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть npm post-publish verifier, необов’язковий published-npm
    Telegram E2E, просування dist-tag за потреби, примітки GitHub release/prerelease
    з повної відповідної секції `CHANGELOG.md` і кроки оголошення релізу.

## Preflight релізу

- Запускайте `pnpm check:test-types` перед preflight релізу, щоб TypeScript для тестів
  залишався покритим поза межами швидшого локального шлюзу `pnpm check`
- Запускайте `pnpm check:architecture` перед preflight релізу, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза межами швидшого локального шлюзу
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і бандл Control UI існували для кроку
  валідації pack
- Запускайте ручний workflow `Full Release Validation` перед схваленням релізу,
  коли вам потрібен увесь набір валідації релізу з однієї точки входу. Він
  приймає гілку, тег або повний SHA коміту, запускає ручний `CI`, і
  запускає `OpenClaw Release Checks` для install smoke, package acceptance,
  Docker-наборів шляху релізу, live/E2E, OpenWebUI, паритету QA Lab, Matrix і
  гілок Telegram.
  Вказуйте `npm_telegram_package_spec` лише після того, як пакет уже опубліковано
  і також слід запустити post-publish Telegram E2E.
  Приклад: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте ручний workflow `Package Acceptance`, коли вам потрібен боковий доказ
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб зібрати pack із довіреної гілки/тега/SHA `package_ref` разом із поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow зводить кандидата до
  `package-under-test`, повторно використовує планувальник Docker E2E шляху релізу для цього
  tarball і за потреби може також запускати Telegram QA для опублікованого npm.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product`
  Поширені профілі:
  - `smoke`: гілки install/channel/agent, мережі gateway і перезавантаження конфігурації
  - `package`: гілки package/update/plugin без OpenWebUI
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: Docker-фрагменти шляху релізу з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запускайте ручний workflow `CI` безпосередньо, коли вам потрібне лише повне покриття
  звичайного CI для кандидата релізу. Ручний запуск CI обходить changed-scoping
  і примусово запускає Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність із Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python Skills, Windows, macOS, Android і гілки
  i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час валідації телеметрії релізу. Це проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє назви експортованих trace span,
  обмежені атрибути та редагування контенту/ідентифікаторів без потреби в
  Opik, Langfuse або іншому зовнішньому збирачі.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає шлюз mock parity для QA Lab і live
  гілки QA для Matrix і Telegram перед схваленням релізу. Live-гілки використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Крос-ОС валідація встановлення та оновлення під час виконання запускається з
  приватного викликаючого workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Це розділення навмисне: зберігайте реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власній гілці, щоб вони не затримували й не блокували публікацію
- Перевірки релізу, що містять секрети, слід запускати через `Full Release
Validation` або з ref workflow `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт досяжний з гілки OpenClaw або тега релізу
- Preflight лише для валідації в `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби в запушеному тезі
- Цей шлях із SHA призначений лише для валідації і не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає справжнього тега релізу
- Обидва workflow зберігають реальний шлях публікації та просування на
  runner’ах GitHub-hosted, тоді як немутуючий шлях валідації може використовувати
  більші Linux-runner’и Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва секрети workflow `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Preflight npm-релізу більше не чекає на окрему гілку перевірок релізу
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction-тег) перед схваленням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction-версію), щоб перевірити шлях встановлення з
  опублікованого реєстру в новому тимчасовому префіксі
- Після beta-публікації запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  для опублікованого npm-пакета з використанням спільного орендованого пулу облікових даних Telegram.
  Локальні одноразові перевірки супровідника можуть не вказувати змінні Convex і напряму передавати три
  облікові дані середовища `OPENCLAW_QA_TELEGRAM_*`.
- Супровідники можуть запускати ту саму post-publish перевірку через GitHub Actions за допомогою
  ручного workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається при кожному merge.
- Автоматизація релізів супровідників тепер використовує preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight-запуск
  - stable npm-релізи типово націлені на `beta`
  - stable npm-публікація може явно націлювати `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість їх повторної збірки
- Для stable-коригувальних релізів на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення з тимчасовим префіксом від `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні релізи не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-навантаженні
- Preflight npm-релізу завершується із закритою помилкою, якщо tarball не містить і `dist/control-ui/index.html`,
  і непорожнє навантаження `dist/control-ui/assets/`, щоб ми знову не випустили
  порожню панель керування в браузері
- Post-publish verification також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні runtime-залежності bundled plugin у кореневому
  макеті `dist/*`. Реліз, який постачається з відсутнім або порожнім навантаженням
  залежностей bundled plugin, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також забезпечує дотримання бюджету `unpackedSize` npm pack
  для tarball кандидата оновлення, щоб installer e2e виявляв випадкове роздуття pack
  до шляху публікації релізу
- Якщо робота над релізом торкалася планування CI, маніфестів часу виконання extension або
  матриць тестування extension, перед схваленням перегенеруйте й перегляньте виходи матриці workflow
  `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб примітки до релізу не описували застарілий макет CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - GitHub release зрештою має містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімального build-рівня Sparkle
    для цієї версії релізу

## Блоки тестування релізу

`Full Release Validation` — це ручний узагальнений workflow, який оператори використовують,
коли хочуть отримати всю валідацію релізу з однієї точки входу:

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
за потреби запускає post-publish Telegram E2E, якщо
встановлено `npm_telegram_package_spec`. Повний запуск прийнятний лише тоді, коли обидва
дочірні workflow успішні або в зведенні зафіксовано навмисно пропущений необов’язковий дочірній workflow.

### Vitest

Блок Vitest — це дочірній ручний workflow `CI`. Ручний CI навмисно
обходить changed scoping і примусово запускає звичайний граф тестування для кандидата
релізу: Linux Node shards, bundled-plugin shards, channel contracts, сумісність із Node 22,
`check`, `check-additional`, build smoke, перевірки документації, Python
Skills, Windows, macOS, Android та i18n для Control UI.

Використовуйте цей блок, щоб відповісти на запитання: «чи пройшло дерево вихідного коду весь звичайний
набір тестів?»
Це не те саме, що валідація продукту на шляху релізу. Докази, які слід зберігати:

- зведення `Full Release Validation`, що показує URL запущеного `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви невдалих або повільних shard із завдань CI під час розслідування регресій
- артефакти таймінгу Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  для запуску потрібен аналіз продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker-, QA Lab-, live-, cross-OS- або package-блоки:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker знаходиться в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також через workflow
`install-smoke` у режимі релізу. Він перевіряє кандидата релізу через запаковані
Docker-середовища, а не лише через тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повний install smoke з увімкненим повільним smoke глобального встановлення Bun
- E2E-гілки репозиторію
- Docker-фрагменти шляху релізу: `core`, `package-update` і
  `plugins-integrations`
- покриття OpenWebUI всередині фрагмента plugins/integrations
- набори live/E2E провайдерів і покриття live-моделей Docker, коли перевірки релізу
  включають live-набори

Використовуйте Docker-артефакти перед повторним запуском. Планувальник шляху релізу завантажує
`.artifacts/docker-tests/` із журналами гілок, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника та командами повторного запуску. Для цілеспрямованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у повторно використовуваному workflow live/E2E замість
повторного запуску всіх фрагментів релізу.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це шлюз поведінки агента
та каналів на рівні релізу, окремий від механіки пакетів Vitest і Docker.

Покриття QA Lab для релізу включає:

- шлюз mock parity, який порівнює гілку кандидата OpenAI з базовим рівнем Opus 4.6
  за допомогою пакета agentic parity
- live QA-гілку Matrix з використанням середовища `qa-live-shared`
- live QA-гілку Telegram з використанням оренди облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального підтвердження

Використовуйте цей блок, щоб відповісти на запитання: «чи правильно поводиться реліз у QA-сценаріях і
live-потоках каналів?» Зберігайте URL артефактів для гілок parity, Matrix і Telegram
під час схвалення релізу.

### Package

Блок Package — це шлюз інстальованого продукту. Його основою є
`Package Acceptance` і резолвер
`scripts/resolve-openclaw-package-candidate.mjs`. Резолвер нормалізує
кандидата до tarball `package-under-test`, який споживається Docker E2E, перевіряє
інвентар пакета, фіксує версію пакета та SHA-256 і тримає ref harness workflow окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: зібрати pack із довіреної гілки, тега або повного SHA коміту `package_ref`
  за допомогою вибраного harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>` і `suite_profile=package`. Цей профіль охоплює
контракти пакетів install, update і plugin та є нативною для GitHub
заміною більшості покриття package/update, яке раніше вимагало
Parallels. Крос-ОС перевірки релізу все ще важливі для специфічного для ОС onboarding,
installer і поведінки платформи, але валідація продукту package/update має
надавати перевагу Package Acceptance.

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

- `smoke`: швидкі гілки встановлення пакета/channel/agent, мережі gateway і
  перезавантаження конфігурації
- `package`: контракти пакетів install/update/plugin; це стандартний
  варіант для перевірок релізу
- `product`: `package` плюс MCP-канали, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: Docker-фрагменти шляху релізу з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для post-publish підтвердження beta використовуйте `source=npm` з точним beta-пакетом або
`openclaw@beta`. Увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` лише для опублікованих npm-пакетів, оскільки цей
шлях повторно використовує workflow Telegram E2E для published-npm.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий тег npm для шляху публікації; типове значення — `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки, що містять секрети,
  вимагають, щоб визначений коміт був досяжний із гілки OpenClaw або
  тега релізу.

Правила:

- Stable- і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta-prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` вхідний повний SHA коміту дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані, перш ніж продовжити публікацію

## Послідовність stable npm-релізу

Під час створення stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тега ще не існує, ви можете використовувати поточний повний SHA коміту
     гілки workflow для dry run preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   тоді, коли ви навмисно хочете прямої stable-публікації
3. Запустіть `Full Release Validation` для гілки релізу, тега релізу або повного
   SHA коміту, коли вам потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестування, натомість запустіть
   ручний workflow `CI` для ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо реліз навмисно було опубліковано безпосередньо в `latest` і `beta`
   має одразу слідувати за тією самою stable-збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його
   запланованій самовідновній синхронізації оновити `beta` пізніше

Мутація dist-tag знаходиться в приватному репозиторії з міркувань безпеки, оскільки вона все ще
вимагає `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає як шлях прямої публікації, так і шлях beta-first просування
задокументованими та видимими для оператора.

Якщо супровіднику потрібно перейти до локальної npm-автентифікації, запускайте будь-які команди
1Password CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; запуск у tmux робить запити,
сповіщення й обробку OTP видимими та запобігає повторним сповіщенням хоста.

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

Супровідники використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізу](/uk/install/development-channels)
