---
read_when:
    - Шукаю визначення публічних каналів випусків
    - Шукаю іменування версій і періодичність
summary: Публічні канали випусків, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-27T03:47:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f2481413208fd227620980c48a2a3ef195be97926d240b0b350cc2ab649b91f
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний просунутий stable-випуск у npm
- `beta` означає поточну ціль установлення beta
- Stable і stable-коригувальні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно націлити їх на `latest` або просунути перевірену beta-збірку пізніше
- Кожен stable-випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збірка/підпис/нотаризація mac-застосунку зарезервовані для stable, якщо це не запитано явно

## Періодичність випусків

- Випуски рухаються за схемою beta-first
- Stable іде лише після того, як перевірено останню beta
- Супроводжувачі зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже запушено або опубліковано й його потрібно виправити, супроводжувачі створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, затвердження, облікові дані та примітки щодо відновлення
  доступні лише для супроводжувачів

## Передвипускова перевірка

- Запускайте `pnpm check:test-types` перед передвипусковою перевіркою, щоб TypeScript у тестах
  залишався покритим поза межами швидшого локального бар’єра `pnpm check`
- Запускайте `pnpm check:architecture` перед передвипусковою перевіркою, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза межами швидшого локального бар’єра
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і бандл Control UI існували для кроку
  перевірки pack
- Запускайте ручний workflow `Full Release Validation` перед затвердженням випуску,
  коли вам потрібен повний набір перевірок випуску з однієї точки входу. Він
  приймає гілку, тег або повний SHA коміту, диспетчеризує ручний `CI` і
  диспетчеризує `OpenClaw Release Checks` для install smoke, перевірки прийняття пакетів,
  наборів Docker release-path, live/E2E, OpenWebUI, паритету QA Lab, Matrix і
  каналів Telegram.
  Указуйте `npm_telegram_package_spec` лише після того, як пакет уже опубліковано
  і також має виконуватися post-publish Telegram E2E.
  Приклад: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте ручний workflow `Package Acceptance`, коли вам потрібен бічний доказ
  для кандидата пакета, поки робота над випуском триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії випуску; `source=ref`,
  щоб зібрати довірену гілку/тег/SHA `package_ref` із поточним
  harness `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow визначає кандидата як
  `package-under-test`, повторно використовує Docker E2E release scheduler для цього
  tarball і за потреби може також запускати Telegram QA для опублікованого npm.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product`
  Поширені профілі:
  - `smoke`: канали install/channel/agent, мережа Gateway і шляхи перезавантаження конфігурації
  - `package`: шляхи package/update/plugin без OpenWebUI
  - `product`: профіль package плюс канали MCP, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: чанки Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для цільового повторного запуску
- Запускайте ручний workflow `CI` напряму, коли вам потрібне лише повне стандартне
  покриття CI для кандидата у випуск. Ручні запуски CI обходять
  changed-обмеження й примусово запускають шардовані Linux Node, bundled-plugin shards,
  channel contracts, сумісність із Node 22, `check`, `check-additional`, build smoke,
  перевірки документації, Python Skills, Windows, macOS, Android і канали i18n для
  Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час перевірки телеметрії випуску. Це проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace span,
  обмежені атрибути, а також редагування вмісту/ідентифікаторів без потреби в
  Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate, а також live-
  канали QA для Matrix і Telegram перед затвердженням випуску. Live-канали використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Крос-ОС перевірка встановлення та оновлення під час виконання диспетчеризується з
  приватного workflow-джерела
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Такий поділ навмисний: зберегти реальний шлях npm-випуску коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному каналі, щоб не затримувати й не блокувати публікацію
- Перевірки випуску, що використовують секрети, слід диспетчеризувати через `Full Release
Validation` або з `main`/release workflow ref, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт досяжний з гілки OpenClaw або release-тега
- Передвипускова перевірка `OpenClaw NPM Release` у режимі лише валідації також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби в запушеному тезі
- Цей шлях через SHA призначений лише для валідації й не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки метаданих
  пакета; реальна публікація все одно потребує справжнього release-тега
- Обидва workflows залишають реальний шлях публікації й просування на GitHub-hosted
  runners, тоді як шлях немутувальної валідації може використовувати більші
  Linux runners Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва workflow secrets: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передвипускова перевірка npm більше не чекає на окремий канал release checks
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction-тег) перед затвердженням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction-версію), щоб перевірити шлях установлення з
  опублікованого реєстру в новому тимчасовому префіксі
- Після beta-публікації запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  для опублікованого npm-пакета, використовуючи спільний пул орендованих облікових даних Telegram.
  Для локальних одноразових перевірок супроводжувача можна не вказувати змінні Convex і передати напряму
  три облікові змінні середовища `OPENCLAW_QA_TELEGRAM_*`.
- Супроводжувачі можуть запускати ту саму post-publish перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно доступний лише вручну й
  не запускається на кожен merge.
- Автоматизація випусків супроводжувача тепер використовує схему preflight-then-promote:
  - реальна npm-публікація повинна пройти успішний npm `preflight_run_id`
  - реальна npm-публікація повинна бути диспетчеризована з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний передвипусковий запуск
  - stable npm-випуски за замовчуванням націлені на `beta`
  - stable npm-публікацію можна явно націлити на `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає лише OIDC-only publish
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація повинна пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторної
    збірки з нуля
- Для stable-коригувальних випусків на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні випуски не могли непомітно залишити старі глобальні встановлення на
  базовому stable-пакеті
- Передвипускова перевірка npm завершується з fail closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній вміст `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню панель керування в браузері
- Post-publish verification також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні runtime-залежності bundled plugin у кореневому
  макеті `dist/*`. Випуск, який постачається з відсутніми або порожніми
  payloads залежностей bundled plugin, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет `unpackedSize` для npm pack
  до candidate update tarball, тож installer e2e виявляє випадкове роздування pack
  до шляху публікації випуску
- Якщо робота над випуском зачіпала планування CI, маніфести таймінгів extension або
  матриці тестів extension, перед затвердженням регенеруйте й перегляньте
  workflow-матриці `checks-node-extensions`, що належать planner, з `.github/workflows/ci.yml`,
  щоб примітки до випуску не описували застарілу схему CI
- Готовність stable-випуску macOS також включає поверхні оновлювача:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - запакований застосунок має зберігати не-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного Sparkle build floor
    для цієї версії випуску

## Вхідні параметри NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий release-тег, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для передвипускової перевірки лише у режимі валідації
- `preflight_only`: `true` для лише валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий для реального шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного передвипускового запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, тег або повний SHA коміту для перевірки. Перевірки, що використовують секрети,
  вимагають, щоб визначений коміт був досяжний з гілки OpenClaw або
  release-тега.

Правила:

- Stable і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` вхідне значення у вигляді повного SHA коміту дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  лише валідаційними
- Реальний шлях публікації повинен використовувати той самий `npm_dist_tag`, який використовувався під час передвипускової перевірки;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-випуску

Коли створюєте stable npm-випуск:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використати поточний повний SHA коміту гілки workflow
     для dry run передвипускового workflow лише у режимі валідації
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   тоді, коли ви навмисно хочете прямої stable-публікації
3. Запустіть `Full Release Validation` на release-гілці, release-тезі або повному
   SHA коміту, коли вам потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, натомість запустіть
   ручний workflow `CI` на release ref
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо випуск було розміщено в `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо випуск навмисно було опубліковано безпосередньо в `latest` і `beta`
   має одразу слідувати за тією ж stable-збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його запланованій
   self-healing синхронізації перемістити `beta` пізніше

Мутація dist-tag живе в приватному репозиторії з міркувань безпеки, тому що вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає лише OIDC-only publish.

Це зберігає як шлях прямої публікації, так і шлях beta-first просування
задокументованими й видимими для оператора.

Якщо супроводжувачу доводиться повернутися до локальної npm-автентифікації, запускайте будь-які команди
CLI 1Password (`op`) лише всередині окремої сесії tmux. Не викликайте `op`
напряму з основної оболонки агента; виконання всередині tmux робить запити,
сповіщення й обробку OTP видимими та запобігає повторним сповіщенням хоста.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Супроводжувачі використовують приватну документацію з випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
