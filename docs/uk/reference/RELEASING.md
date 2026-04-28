---
read_when:
    - Шукаю визначення публічних каналів релізу
    - Запуск валідації релізу або перевірки прийнятності пакета
    - Шукаю іменування версій та каденцію
summary: Лейни релізу, контрольний список оператора, блоки валідації, іменування версій та каденція
title: Політика релізів
x-i18n:
    generated_at: "2026-04-28T02:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cb80b42227c6c9347a8f0b5d86b9a101be337fd77eeba8548b3490c8f8addc0
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні лейни релізу:

- stable: теговані релізи, які типово публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: пререлізні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-пререлізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте провідні нулі до місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable- і stable-коригувальні релізи типово публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і застосунком для macOS;
  beta-релізи зазвичай спочатку проходять валідацію та публікацію шляху npm/package, а
  збірка/підписання/нотаризація застосунку для macOS зарезервовані для stable, якщо інше не запитано явно

## Каденція релізів

- Релізи спочатку проходять через beta
- Stable іде лише після валідації останньої beta
- Супровідники зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб валідація релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано і він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Докладна процедура релізу, погодження, облікові дані та примітки щодо відновлення
  доступні лише супровідникам

## Контрольний список оператора релізу

Цей контрольний список — публічна форма потоку релізу. Приватні облікові дані,
підписання, нотаризація, відновлення dist-tag і деталі аварійного відкоту
залишаються в призначеному лише для супровідників runbook релізу.

1. Почніть із поточної `main`: отримайте останні зміни, підтвердьте, що цільовий коміт запушено,
   і що поточний CI для `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте це, запуште,
   а потім ще раз виконайте rebase/pull перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу над релізом
   безпосередньо в `main`.
5. Оновіть усі потрібні місця з версіями для запланованого тега, а потім запустіть
   локальний детермінований попередній прогін:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тег ще не існує,
   для preflight-лише валідації дозволено повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести за допомогою `Full Release Validation` для
   гілки релізу, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих блоків тестування релізу: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте проблему в гілці релізу та повторно запустіть найменший невдалий
   файл, лейн, завдання workflow, профіль пакета, allowlist провайдера або моделі, що
   доводить виправлення. Повторно запускайте повну загальну перевірку лише тоді, коли змінена поверхня
   робить попередні докази застарілими.
9. Для beta: створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім запустіть
   перевірку прийнятності пакета після публікації для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо запушена або опублікована beta потребує виправлення, створюйте
   наступний `-beta.N`; не видаляйте і не переписуйте стару beta.
10. Для stable: продовжуйте лише після того, як перевірена beta або кандидат у реліз має
    потрібні докази валідації. Stable-публікація в npm повторно використовує успішний
    артефакт preflight через `preflight_run_id`; готовність stable-релізу для macOS
    також вимагає запакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть засіб перевірки npm після публікації, за потреби
    окремий Telegram E2E для опублікованого npm, коли потрібне підтвердження каналу після публікації,
    просування dist-tag за потреби, примітки GitHub release/prerelease з
    повної відповідної секції `CHANGELOG.md`, а також кроки оголошення релізу.

## Попередній прогін релізу

- Запускайте `pnpm check:test-types` перед попереднім прогоном релізу, щоб TypeScript для тестів
  залишався покритим поза межами швидшого локального gate `pnpm check`
- Запускайте `pnpm check:architecture` перед попереднім прогоном релізу, щоб ширші перевірки
  циклів імпорту та архітектурних меж були зеленими поза межами швидшого локального gate
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і збірка Control UI існували для кроку
  валідації pack
- Запускайте вручну workflow `Full Release Validation` перед погодженням релізу, щоб
  запустити всі блоки передрелізного тестування з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає вручну `CI` і запускає
  `OpenClaw Release Checks` для перевірки встановлення, перевірки прийнятності пакета, наборів
  релізного шляху Docker, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram
  лейнів. Надавайте `npm_telegram_package_spec` лише після того, як пакет уже було
  опубліковано і також має виконуватися Telegram E2E після публікації. Надавайте
  `evidence_package_spec`, коли приватний звіт-доказ має підтвердити, що
  валідація відповідає опублікованому npm-пакету без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте вручну workflow `Package Acceptance`, коли потрібен бічний доказ
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточною
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує планувальник Docker E2E релізного шляху для цього
  tarball і може запускати Telegram QA для того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: лейни встановлення/каналу/агента, мережі gateway і перезавантаження конфігурації
  - `package`: артефактно-нативні лейни пакета/оновлення/Plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: частини Docker релізного шляху з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для цільового повторного запуску
- Запускайте вручну workflow `CI` безпосередньо, коли вам потрібне лише повне покриття
  звичайного CI для кандидата на реліз. Ручний запуск CI обходить обмеження changed
  і примусово запускає Linux Node shards, shards bundled-plugin, контракти каналів,
  сумісність із Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python Skills, Windows, macOS, Android і
  лейни i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke`, коли перевіряєте телеметрію релізу. Це проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє назви експортованих trace span,
  обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає gate паритету QA Lab mock плюс швидкий
  live-профіль Matrix і лейн Telegram QA перед погодженням релізу. Live-лейни використовують середовище `qa-live-shared`; Telegram також використовує оренду облікових
  даних Convex CI. Запускайте вручну workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли вам потрібен повний інвентар
  транспорту, медіа та E2EE для Matrix у паралельному режимі.
- Крос-ОС валідація встановлення та оновлення під час виконання є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` безпосередньо
- Такий поділ навмисний: зберігайте справжній шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у
  власному лейні, щоб не затримувати й не блокувати публікацію
- Перевірки релізу, які використовують секрети, слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися під контролем
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт досяжний з гілки OpenClaw або релізного тега
- Валідаційний preflight `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без вимоги запушеного тега
- Цей шлях із SHA призначений лише для валідації і не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає справжнього релізного тега
- Обидва workflow зберігають реальний шлях публікації та просування на GitHub-hosted
  runners, тоді як шлях валідації без змінних дій може використовувати більші
  Linux runners від Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва секрети workflow: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Попередній прогін npm-релізу більше не очікує на окремий лейн перевірок релізу
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction-тег) перед погодженням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction-версію), щоб перевірити шлях встановлення
  з опублікованого реєстру в новому тимчасовому prefix
- Після публікації beta запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити онбординг встановленого пакета, налаштування Telegram і справжній Telegram E2E
  для опублікованого npm-пакета з використанням спільного пулу орендованих облікових
  даних Telegram. Для локальних одноразових запусків супровідники можуть не вказувати Convex-змінні і передавати три
  облікові дані `OPENCLAW_QA_TELEGRAM_*` напряму через env.
- Супровідники можуть запускати ту саму перевірку після публікації з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно доступний лише вручну і
  не запускається після кожного merge.
- Автоматизація релізів супровідників тепер використовує preflight-then-promote:
  - справжня публікація в npm має пройти успішний npm `preflight_run_id`
  - справжню публікацію в npm потрібно запускати з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight-запуск
  - stable-релізи npm типово йдуть у `beta`
  - stable-публікація в npm може явно націлювати `latest` через вхід workflow
  - зміна npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - справжня приватна публікація для mac має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторного
    їх збирання
- Для stable-коригувальних релізів на кшталт `YYYY.M.D-N` засіб перевірки після публікації
  також перевіряє той самий шлях оновлення в тимчасовому prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні релізи не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-пакеті
- Попередній прогін npm-релізу завершується із закритою відмовою, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній вміст `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню dashboard для браузера
- Перевірка після публікації також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні залежності runtime для bundled plugin у кореневому
  макеті `dist/*`. Реліз, який постачається з відсутнім або порожнім корисним
  навантаженням залежностей bundled plugin, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також контролює бюджет `unpackedSize` для npm pack у
  tarball-кандидаті на оновлення, тож installer e2e виявляє випадкове роздування pack
  до шляху публікації релізу
- Якщо робота над релізом торкалася планування CI, маніфестів таймінгу розширень або
  матриць тестів розширень, перед погодженням регенеруйте та перегляньте
  виходи матриці workflow `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб примітки до релізу не описували застарілу структуру CI
- Готовність stable-релізу для macOS також включає поверхні оновлювача:
  - GitHub release має містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімального build-рівня Sparkle
    для цієї версії релізу

## Блоки тестування релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте гілку релізу,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow визначає цільовий ref, запускає вручну `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks` і
за потреби запускає окремий Telegram E2E після публікації, коли
встановлено `npm_telegram_package_spec`. Далі `OpenClaw Release Checks` розгалужує
перевірку встановлення, крос-ОС перевірки релізу, покриття live/E2E Docker релізного шляху,
Package Acceptance з Telegram package QA, паритет QA Lab, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні, а будь-який необов’язковий
дочірній `npm_telegram` є або успішним, або навмисно пропущеним. Фінальний підсумок verifier
містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб менеджер релізу міг
бачити поточний критичний шлях без завантаження логів.
Дочірні workflow запускаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть якщо цільовий `ref` вказує на
старішу release-гілку або тег. Окремого входу workflow-ref для Full Release Validation
немає; вибирайте довірену harness, вибираючи ref запуску workflow.

Використовуйте `release_profile`, щоб вибрати ширину покриття live/provider:

- `minimum`: найшвидший релізно-критичний live- та Docker-шлях для OpenAI/core
- `stable`: minimum плюс stable-покриття провайдерів/бекендів для погодження релізу
- `full`: stable плюс широке дорадче покриття провайдерів/медіа

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз
визначити цільовий ref як `release-package-under-test`, і повторно використовує цей
артефакт і в Docker-перевірках релізного шляху, і в Package Acceptance. Це зберігає всі
пакетно-орієнтовані блоки на тих самих байтах і запобігає повторним збіркам пакета.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Валідація неопублікованої гілки кандидата на реліз.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

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
не пройшов, для наступного підтвердження використовуйте збійний дочірній workflow, job, Docker-лейн, профіль пакета, модельного
провайдера або QA-лейн. Повторно запускайте повну загальну перевірку лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази для всіх блоків
застарілими. Фінальний verifier загальної перевірки повторно перевіряє записані run id дочірніх workflow,
тому після успішного повторного запуску дочірнього workflow повторно запускайте лише збійний
батьківський job `Verify full validation`.

Для обмеженого відновлення передавайте в загальну перевірку `rerun_group`. `all` — це справжній
запуск кандидата на реліз, `ci` запускає лише звичайний дочірній CI, `release-checks` запускає
кожен релізний блок, а вужчі групи релізу — це `install-smoke`,
`cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і
`npm-telegram`, коли надано окремий лейн Telegram для пакета.

### Vitest

Блок Vitest — це ручний дочірній workflow `CI`. Ручний CI навмисно
обходить обмеження changed і примусово запускає звичайний граф тестів для
кандидата на реліз: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android і лейни i18n для Control UI.

Використовуйте цей блок, щоб відповісти на запитання: «Чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що валідація продукту на шляху релізу. Докази, які слід зберігати:

- підсумок `Full Release Validation`, що показує URL запущеного виконання `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви shards CI jobs, що впали або були повільними, під час розслідування регресій
- артефакти таймінгу Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI напряму лише тоді, коли релізу потрібен детермінований звичайний CI, але
не потрібні Docker-, QA Lab-, live-, cross-OS- або package-блоки:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker знаходиться в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також через workflow
`install-smoke` у режимі релізу. Він валідує кандидата на реліз через упаковані
Docker-середовища, а не лише тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повний install smoke з увімкненим повільним smoke для глобального встановлення Bun
- лейни repository E2E
- частини Docker релізного шляху: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-b` і `bundled-channels-contracts`
- покриття OpenWebUI всередині частини `plugins-runtime-core`, коли це запитано
- розділені лейни залежностей bundled-channel між channel-smoke, update-target
  і частинами setup/runtime contract замість одного великого job для bundled-channel
- розділені лейни встановлення/видалення bundled plugin
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-7`
- набори live/E2E провайдерів і покриття live-моделей Docker, коли перевірки релізу
  включають live-набори

Використовуйте артефакти Docker перед повторним запуском. Планувальник релізного шляху
завантажує `.artifacts/docker-tests/` з логами лейнів, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника та командами повторного запуску. Для цільового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable workflow live/E2E замість
повторного запуску всіх частин релізу. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені вхідні дані Docker image, коли вони доступні, тож
збійний лейн може повторно використати той самий tarball і GHCR image.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це релізний gate для
агентної поведінки та поведінки на рівні каналів, окремий від механіки пакетів Vitest і Docker.

Покриття QA Lab для релізу включає:

- gate mock parity, який порівнює лейн кандидата OpenAI з базовим
  рівнем Opus 4.6, використовуючи набір agentic parity
- швидкий live-профіль QA для Matrix, який використовує середовище `qa-live-shared`
- live-лейн Telegram QA з використанням оренди облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального підтвердження

Використовуйте цей блок, щоб відповісти на запитання: «Чи поводиться реліз правильно в QA-сценаріях і
live-потоках каналів?» Зберігайте URL артефактів для лейнів parity, Matrix і Telegram
під час погодження релізу. Повне покриття Matrix залишається доступним як ручний шардований запуск QA-Lab, а не як стандартний релізно-критичний лейн.

### Package

Блок Package — це gate для продукту, який можна встановити. Він базується на
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
кандидата у tarball `package-under-test`, який споживає Docker E2E, валідує
інвентар пакета, записує версію пакета та SHA-256 і тримає ref harness workflow
окремо від ref джерела пакета.

Підтримувані джерела кандидата:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: запакувати довірену гілку, тег або повний SHA коміту `package_ref`
  з вибраною harness `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Частини Docker релізного шляху покривають
перетинні лейни встановлення, оновлення та оновлення plugin; Package Acceptance зберігає
артефактно-нативну сумісність bundled-channel, офлайнові фікстури plugin і Telegram package QA для того самого визначеного tarball. Це нативна для GitHub
заміна більшої частини покриття package/update, яке раніше вимагало
Parallels. Крос-ОС перевірки релізу все ще важливі для ОС-специфічної поведінки онбордингу,
встановлювача та платформи, але для валідації продукту package/update слід
надавати перевагу Package Acceptance.

Попередня поблажливість package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих
в npm: приватні записи інвентарю QA, яких бракує в tarball; відсутній
`gateway install --wrapper`; відсутні patch-файли у git-фікстурі, похідній від tarball;
відсутній збережений `update.channel`; застарілі розташування записів встановлення plugin;
відсутнє збереження записів встановлення marketplace; і міграція метаданих конфігурації під час `plugins update`. Пакети після `2026.4.25` мають відповідати сучасним контрактам пакета; ті самі прогалини призводять до провалу валідації релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується реального пакета, який можна встановити:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Поширені профілі пакета:

- `smoke`: швидкі лейни встановлення пакета/каналу/агента, мережі gateway і
  перезавантаження конфігурації
- `package`: контракти пакета для встановлення/оновлення/plugin без live ClawHub; це стандарт
  для release-check
- `product`: `package` плюс MCP-канали, очищення cron/subagent, веб-
  пошук OpenAI і OpenWebUI
- `full`: частини Docker релізного шляху з OpenWebUI
- `custom`: точний список `docker_lanes` для цільових повторних запусків

Для підтвердження Telegram для кандидата пакета вмикайте `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
визначений tarball `package-under-test` у Telegram-лейн; окремий
workflow Telegram як і раніше приймає опубліковану npm-специфікацію для перевірок після публікації.

## Входи workflow npm

`OpenClaw NPM Release` приймає такі керовані оператором входи:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типово `beta`

`OpenClaw Release Checks` приймає такі керовані оператором входи:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки, що містять секрети,
  вимагають, щоб визначений коміт був досяжний із гілки OpenClaw або
  релізного тега.

Правила:

- Stable- і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` введення повного SHA коміту дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-релізу

Під час створення stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тег ще не існує, ви можете використати поточний повний SHA коміту
     гілки workflow для dry run workflow preflight лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви навмисно хочете пряму stable-публікацію
3. Запустіть `Full Release Validation` для гілки релізу, релізного тега або повного
   SHA коміту, коли хочете отримати звичайний CI плюс live prompt cache, Docker, QA Lab,
   покриття Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` для ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використовуйте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо реліз був навмисно опублікований одразу в `latest`, а `beta`
   має відразу слідувати за тією самою stable-збіркою, використовуйте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його
   запланованій self-healing-синхронізації перемістити `beta` пізніше

Зміна dist-tag винесена в приватний репозиторій з міркувань безпеки, оскільки вона досі
вимагає `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це забезпечує, що і шлях прямої публікації, і шлях просування beta-first
обидва задокументовані та видимі оператору.

Якщо супровіднику доводиться перейти до локальної npm-автентифікації, запускайте будь-які команди
1Password CLI (`op`) лише в окремій tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; виконання всередині tmux робить запити,
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

Супровідники використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізу](/uk/install/development-channels)
