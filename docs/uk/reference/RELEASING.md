---
read_when:
    - Шукаю визначення публічних каналів релізу
    - Запуск валідації релізу або перевірки прийнятності пакета
    - Шукаю найменування версій і каденцію
summary: Релізні лінії, контрольний список оператора, поля валідації, найменування версій і каденція
title: Політика релізів
x-i18n:
    generated_at: "2026-04-27T19:39:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ad73d75e54bd21cb740b64af0b33cc9d38283de8917544d5795990d3f0aacb6
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні лінії релізів:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Найменування версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія виправного стабільного релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-попереднього релізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний опублікований стабільний npm-реліз
- `beta` означає поточну ціль інсталяції бета-версії
- Стабільні та виправні стабільні релізи за замовчуванням публікуються в npm `beta`; оператори релізів можуть явно націлити `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний реліз OpenClaw постачається разом із npm-пакетом і застосунком для macOS;
  бета-релізи зазвичай спочатку проходять валідацію та публікацію шляху npm/package, а
  збірка/підпис/нотаризація застосунку для macOS зарезервовані для stable, якщо це не запитано явно

## Каденція релізів

- Релізи спочатку проходять через beta
- Stable іде лише після того, як найновішу beta валідовано
- Супровідники зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб валідація релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й потрібне виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або перевідтворення старого beta-тега
- Детальна процедура релізу, схвалення, облікові дані та примітки щодо відновлення
  доступні лише для супровідників

## Контрольний список оператора релізу

Цей контрольний список — публічна форма процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату
залишаються в закритому для супровідників runbook релізів.

1. Почніть із поточної `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт запушено,
   і що поточний CI для `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залишайте записи орієнтованими на користувача, закомітьте це, запуште
   і ще раз виконайте rebase/pull перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте прострочену
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому її
   навмисно залишено.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу з релізом
   безпосередньо в `main`.
5. Оновіть усі необхідні місця з версією для запланованого тега, потім виконайте
   локальний детермінований попередній прогін:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. Поки тега ще немає,
   для preflight лише з метою валідації дозволено повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки релізу, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих полів тестування релізу: Vitest, Docker, QA Lab і Package.
8. Якщо валідація не пройшла, виправте проблему в гілці релізу і перезапустіть найменший збоєвий
   файл, лінію, завдання workflow, профіль пакета, allowlist провайдера або моделі, який
   доводить виправлення. Повторно запускайте повний umbrella лише тоді, коли змінена поверхня
   робить попередні докази неактуальними.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім запустіть
   post-publish package acceptance для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо запушена або опублікована beta потребує виправлення, створюйте
   наступний `-beta.N`; не видаляйте і не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або кандидат на реліз має
    потрібні докази валідації. Стабільна публікація в npm повторно використовує успішний
    preflight-артефакт через `preflight_run_id`; готовність stable-релізу для macOS
    також вимагає упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть верифікатор npm після публікації, за потреби —
    окремий Telegram E2E для опублікованого npm, коли вам потрібне підтвердження каналу після публікації,
    за потреби просування dist-tag, нотатки GitHub release/prerelease з
    повної відповідної секції `CHANGELOG.md`, а також кроки
    анонсу релізу.

## Попередній прогін релізу

- Запускайте `pnpm check:test-types` перед попереднім прогоном релізу, щоб TypeScript для тестів
  залишався покритим поза межами швидшого локального бар’єра `pnpm check`
- Запускайте `pnpm check:architecture` перед попереднім прогоном релізу, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза межами швидшого локального бар’єра
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і зібраний Control UI існували для кроку
  валідації pack
- Запускайте ручний workflow `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні поля тестування з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, викликає ручний `CI` і викликає
  `OpenClaw Release Checks` для install smoke, package acceptance, наборів Docker
  шляху релізу, live/E2E, OpenWebUI, QA Lab parity, Matrix і Telegram
  ліній. Вказуйте `npm_telegram_package_spec` лише після того, як пакет уже було
  опубліковано і також має запускатися Telegram E2E після публікації. Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте ручний workflow `Package Acceptance`, коли вам потрібне додаткове підтвердження
  для кандидата пакета, поки триває робота над релізом. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` з поточною
  обв’язкою `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує планувальник Docker E2E шляху релізу для цього
  tarball і може запускати Telegram QA проти того самого tarball з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: лінії install/channel/agent, мережі gateway і перезавантаження конфігурації
  - `package`: нативні для артефакта лінії пакета/оновлення/Plugin без OpenWebUI або live ClawHub
  - `product`: профіль package плюс канали MCP, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: частини Docker шляху релізу з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запускайте ручний workflow `CI` безпосередньо, коли вам потрібне лише повне нормальне
  покриття CI для кандидата релізу. Ручний виклик CI обходить обмеження changed
  і примусово запускає Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність з Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python Skills, Windows, macOS, Android і лінії i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час валідації телеметрії релізу. Це проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace span,
  обмежені атрибути та редагування вмісту/ідентифікаторів без потреби в
  Opik, Langfuse або іншому зовнішньому збирачі.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate і швидкий
  live Matrix profile та лінію Telegram QA перед схваленням релізу. Live
  лінії використовують середовище `qa-live-shared`; Telegram також використовує оренду
  облікових даних Convex CI. Запускайте ручний workflow `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли вам потрібен повний інвентар
  Matrix transport, media та E2EE паралельно.
- Крос-ОС валідація install і upgrade під час виконання є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які викликають
  повторно використовуваний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` безпосередньо
- Такий поділ навмисний: реальний шлях npm-релізу має залишатися коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власній лінії, щоб не затримувати і не блокувати публікацію
- Перевірки релізу, що використовують секрети, слід запускати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт досяжний з гілки OpenClaw або тега релізу
- Попередній прогін `OpenClaw NPM Release` лише для валідації також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без вимоги запушеного тега
- Цей шлях із SHA призначений лише для валідації й не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає реального тега релізу
- Обидва workflows зберігають реальний шлях публікації та просування на GitHub-hosted
  runners, тоді як незмінний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох секретів workflow `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Попередній прогін npm release більше не чекає на окрему лінію release checks
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед схваленням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях інсталяції
  з опублікованого реєстру в чистому тимчасовому prefix
- Після публікації beta запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета з використанням спільного орендованого пулу
  облікових даних Telegram. Для разових локальних запусків супровідники можуть не вказувати змінні Convex
  і передавати три облікові дані через env `OPENCLAW_QA_TELEGRAM_*` безпосередньо.
- Супровідники можуть запускати ту саму перевірку після публікації з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно є лише ручним
  і не запускається після кожного merge.
- Автоматизація релізів супровідників тепер використовує preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - реальна публікація в npm має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - стабільні npm-релізи за замовчуванням спрямовані в `beta`
  - стабільна публікація в npm може явно націлювати `latest` через input workflow
  - зміна npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна публікація для mac має пройти успішні приватні
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість їх повторної збірки
- Для виправних стабільних релізів на кшталт `YYYY.M.D-N` верифікатор після публікації
  також перевіряє той самий шлях оновлення в тимчасовому prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб виправні релізи не могли непомітно залишати старі глобальні інсталяції на
  базовому стабільному payload
- Попередній прогін npm release завершується з відмовою за замовчуванням, якщо tarball не містить
  і `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню панель браузера
- Перевірка після публікації також перевіряє, що інсталяція з опублікованого реєстру
  містить непорожні runtime-залежності bundled Plugin у кореневому макеті
  `dist/*`. Реліз, який постачається з відсутніми або порожніми payload залежностей
  bundled Plugin, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет `unpackedSize` для `npm pack`
  до tarball кандидата на оновлення, тому installer e2e виявляє випадкове роздуття pack
  до шляху публікації релізу
- Якщо робота над релізом зачепила планування CI, маніфести часу розширень або
  матриці тестів розширень, перед схваленням заново згенеруйте й перегляньте
  матричні результати workflow `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб примітки до релізу не описували застарілу структуру CI
- Готовність stable-релізу для macOS також включає поверхні оновлювача:
  - GitHub release має врешті містити упаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - упакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімального Sparkle build
    для цієї версії релізу

## Поля тестування релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте гілку релізу,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both
```

Workflow визначає цільовий ref, викликає ручний `CI` з
`target_ref=<release-ref>`, викликає `OpenClaw Release Checks` і
за потреби викликає окремий Telegram E2E після публікації, коли
встановлено `npm_telegram_package_spec`. Потім `OpenClaw Release Checks` розгалужує
install smoke, крос-ОС release checks, live/E2E покриття Docker шляху релізу,
Package Acceptance з Telegram QA для пакета, QA Lab parity, live Matrix і
live Telegram. Повний запуск прийнятний лише тоді, коли підсумок `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні, а будь-який необов’язковий дочірній
`npm_telegram` або успішний, або навмисно пропущений.
Дочірні workflows викликаються з довіреного ref, який запускає `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на старішу
гілку або тег релізу. Окремого input workflow-ref для Full Release Validation
немає; вибирайте довірену обв’язку, вибираючи ref запуску workflow.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Валідовувати неопубліковану гілку кандидата релізу.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both

# Валідовувати точний запушений коміт.
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
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повний umbrella як перший повторний запуск після точкового виправлення. Якщо одне поле
не проходить, використовуйте збійний дочірній workflow, job, Docker lane, профіль
пакета, провайдера моделі або QA lane для наступного підтвердження. Повторно запускайте повний
umbrella лише тоді, коли виправлення змінило спільну оркестрацію релізу або
зробило попередні докази для всіх полів неактуальними. Фінальний верифікатор umbrella
повторно перевіряє записані run id дочірніх workflows, тому після успішного повторного запуску
дочірнього workflow повторно запускайте лише збійний батьківський job
`Verify full validation`.

### Vitest

Поле Vitest — це дочірній workflow ручного `CI`. Ручний CI навмисно
обходить обмеження changed і примусово запускає звичайний граф тестів для
кандидата релізу: Linux Node shards, bundled-plugin shards, channel contracts, сумісність з Node 22,
`check`, `check-additional`, build smoke, перевірки документації, Python
Skills, Windows, macOS, Android і i18n для Control UI.

Використовуйте це поле, щоб відповісти на запитання «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що валідація продукту на шляху релізу. Докази, які слід зберігати:

- Підсумок `Full Release Validation`, що показує URL запущеного `CI`
- Зелений запуск `CI` на точному цільовому SHA
- Назви збійних або повільних shard із job `CI` під час розслідування регресій
- Артефакти таймінгів Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI безпосередньо лише тоді, коли релізу потрібен детермінований звичайний CI, але
не Docker, QA Lab, live, крос-ОС або package поля:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Поле Docker розміщене в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також через workflow
`install-smoke` у режимі релізу. Воно валідовує кандидата релізу через упаковані
Docker-середовища, а не лише через тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- репозиторні E2E-лінії
- Docker-частини шляху релізу: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-core`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b` і
  `bundled-channels`
- покриття OpenWebUI всередині частини `plugins-runtime-core`, якщо це запитано
- розділені лінії залежностей bundled-channel у власній частині `bundled-channels`
  замість послідовної all-in-one bundled-channel лінії
- розділені лінії встановлення/видалення bundled Plugin
  `bundled-plugin-install-uninstall-0` до
  `bundled-plugin-install-uninstall-7`
- набори live/E2E для провайдерів і покриття live-моделей Docker, коли release checks
  включають live-набори

Використовуйте артефакти Docker перед повторним запуском. Планувальник шляху релізу
вивантажує `.artifacts/docker-tests/` з журналами ліній, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника і командами повторного запуску. Для точкового відновлення
використовуйте `docker_lanes=<lane[,lane]>` у повторно використовуваному workflow live/E2E замість
повторного запуску всіх частин релізу. Згенеровані команди повторного запуску включають попередні
`package_artifact_run_id` і підготовлені input образів Docker, коли вони доступні, тому
збійна лінія може повторно використати той самий tarball і образи GHCR.

### QA Lab

Поле QA Lab також є частиною `OpenClaw Release Checks`. Це релізний бар’єр для
агентної поведінки та рівня каналів, окремий від механіки пакетів Vitest і Docker.

Покриття QA Lab для релізу включає:

- mock parity gate, який порівнює лінію кандидата OpenAI з базовим рівнем Opus 4.6
  за допомогою agentic parity pack
- швидкий live Matrix QA profile із середовищем `qa-live-shared`
- live Telegram QA lane з орендою облікових даних Convex CI
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального підтвердження

Використовуйте це поле, щоб відповісти на запитання «чи правильно поводиться реліз у QA-сценаріях і
live-потоках каналів?» Під час схвалення релізу зберігайте URL артефактів для ліній parity, Matrix і Telegram.
Повне покриття Matrix залишається доступним як ручний шардований запуск QA-Lab, а не як
типова критична для релізу лінія.

### Package

Поле Package — це бар’єр для продукту, який можна інсталювати. Воно базується на
`Package Acceptance` і резолвері
`scripts/resolve-openclaw-package-candidate.mjs`. Резолвер нормалізує
кандидата в tarball `package-under-test`, який споживає Docker E2E, валідовує
інвентар пакета, записує версію пакета і SHA-256 та зберігає
ref обв’язки workflow окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: запакувати довірену гілку, тег або повний SHA коміту `package_ref`
  з вибраною обв’язкою `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, вивантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` і
`telegram_mode=mock-openai`. Docker-частини шляху релізу покривають
лінії install, update і plugin-update, що перетинаються; Package Acceptance зберігає
нативну для артефактів сумісність bundled-channel, офлайн-фікстури Plugin і Telegram
package QA проти того самого визначеного tarball. Це GitHub-native
заміна для більшості покриття package/update, яке раніше вимагало
Parallels. Крос-ОС release checks усе ще важливі для специфічної для ОС адаптації,
інсталятора та поведінки платформи, але для валідації package/update продукту слід
надавати перевагу Package Acceptance.

Історична поблажливість package-acceptance навмисно обмежена в часі. Пакети до
`2026.4.25` можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих
в npm: приватні записи інвентарю QA, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch-файли у git-фікстурі, похідній від tarball,
відсутній збережений `update.channel`, застарілі розташування записів встановлення Plugin,
відсутність збереження записів встановлення marketplace і міграція метаданих конфігурації під час
`plugins update`. Пакети після `2026.4.25` повинні відповідати сучасним контрактам пакета;
ті самі прогалини призводять до провалу валідації релізу.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
реального пакета, який можна встановити:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Поширені профілі пакета:

- `smoke`: швидкі лінії інсталяції package/channel/agent, мережі gateway і
  перезавантаження конфігурації
- `package`: контракти package для install/update/plugin без live ClawHub; це типовий варіант для release-check
- `product`: `package` плюс канали MCP, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: Docker-частини шляху релізу з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для Telegram-підтвердження кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
визначений tarball `package-under-test` у Telegram lane; окремий
workflow Telegram, як і раніше, приймає опубліковану npm-специфікацію для перевірок після публікації.

## Вхідні параметри workflow npm

`OpenClaw NPM Release` приймає такі керовані оператором input:

- `tag`: обов’язковий тег релізу, такий як `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` лише для валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow повторно використовував
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором input:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки, що використовують секрети,
  вимагають, щоб визначений коміт був досяжним із гілки OpenClaw або
  тега релізу.

Правила:

- Теги stable і correction можуть публікуватися або в `beta`, або в `latest`
- Теги beta prerelease можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` input у вигляді повного SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані, перш ніж публікація продовжиться

## Послідовність stable npm-релізу

Під час створення stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тега ще немає, ви можете використовувати поточний повний SHA коміту гілки workflow
     для dry run workflow preflight лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first процесу або `latest` лише
   коли ви навмисно хочете прямої stable-публікації
3. Запустіть `Full Release Validation` на гілці релізу, тегу релізу або повному
   SHA коміту, коли вам потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram покриття з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використовуйте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо реліз навмисно було опубліковано одразу в `latest` і `beta`
   має негайно наслідувати ту саму stable-збірку, використовуйте той самий приватний
   workflow, щоб націлити обидва dist-tag на stable-версію, або дозвольте його запланованій
   self-healing синхронізації пересунути `beta` пізніше

Зміна dist-tag розміщена в приватному репозиторії з міркувань безпеки, тому що вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це робить як шлях прямої публікації, так і шлях beta-first просування
задокументованими та видимими для оператора.

Якщо супровіднику доводиться перейти до локальної npm-автентифікації, виконуйте будь-які команди
1Password CLI (`op`) лише в межах окремої tmux-сесії. Не викликайте `op`
безпосередньо з основної оболонки агента; запуск усередині tmux робить запити,
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

Супровідники використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
