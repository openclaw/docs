---
read_when:
    - Шукаєте визначення публічних каналів релізів
    - Шукаєте іменування версій і cadence
summary: Публічні канали релізів, іменування версій і cadence
title: Політика релізів
x-i18n:
    generated_at: "2026-04-24T18:13:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні канали релізів:

- stable: релізи з тегами, які типово публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-релізу з виправленням: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте провідні нулі до місяця або дня
- `latest` означає поточний підвищений stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable-релізи та stable-релізи з виправленнями типово публікуються в npm `beta`; оператори релізів можуть явно націлити їх на `latest` або пізніше підвищити перевірену beta-збірку
- Кожен stable-реліз OpenClaw постачається разом як npm-пакет і застосунок macOS;
  beta-релізи зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збірка/sign/notarize застосунку macOS зарезервовані для stable, якщо інше не запитано явно

## Ритм релізів

- Релізи спочатку проходять через beta
- Stable іде лише після перевірки найновішої beta
- Maintainer-и зазвичай роблять релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було відправлено або опубліковано й потрібне виправлення, maintainer-и створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура релізу, схвалення, облікові дані й нотатки щодо відновлення
  доступні лише maintainer-ам

## Передрелізна перевірка

- Запускайте `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript
  залишався покритим поза швидшим локальним бар’єром `pnpm check`
- Запускайте `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки
  циклів імпорту та архітектурних меж були зеленими поза швидшим локальним бар’єром
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і bundle Control UI існували для кроку
  перевірки pack
- Запускайте `pnpm release:check` перед кожним релізом із тегом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає бар’єр макетної паритетності QA Lab плюс live-
  канали QA Matrix і Telegram перед схваленням релізу. Live-канали використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Крос-ОС перевірка встановлення та оновлення під час виконання запускається з
  приватного workflow-ініціатора
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає багаторазово використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: залишити реальний шлях релізу npm коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у
  власному каналі, щоб вони не затримували й не блокували публікацію
- Перевірки релізу мають запускатися з workflow ref `main` або з
  workflow ref `release/YYYY.M.D`, щоб логіка workflow і секрети залишалися
  контрольованими
- Цей workflow приймає або наявний релізний тег, або поточний повний
  40-символьний SHA коміту гілки workflow
- У режимі commit-SHA він приймає лише поточний HEAD гілки workflow; використовуйте
  релізний тег для старіших релізних комітів
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби у відправленому тегі
- Цей шлях SHA є лише валідаційним і не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає справжнього релізного тега
- Обидва workflow залишають реальний шлях публікації та підвищення на runners GitHub-hosted, тоді як шлях валідації без змін може використовувати більші
  Linux runners Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох секретів workflow `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm більше не чекає на окремий канал перевірок релізу
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний тег beta/виправлення) перед схваленням
- Після публікації npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну версію beta/виправлення), щоб перевірити шлях встановлення
  з опублікованого реєстру в новому тимчасовому prefix
- Після публікації beta запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  щодо опублікованого npm-пакета з використанням спільного пулу
  орендованих облікових даних Telegram. Локальні одноразові перевірки maintainer-а можуть опустити змінні Convex і передати три
  облікові дані env `OPENCLAW_QA_TELEGRAM_*` напряму.
- Maintainer-и можуть запускати ту саму післяпублікаційну перевірку з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається при кожному merge.
- Автоматизація релізів maintainer-ів тепер використовує схему preflight-then-promote:
  - реальна публікація npm повинна пройти успішний npm `preflight_run_id`
  - реальна публікація npm має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск передрелізної перевірки
  - stable npm-релізи типово націлюються на `beta`
  - stable npm-публікація може явно націлюватися на `latest` через вхід workflow
  - зміна npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` — лише валідаційний
  - реальна приватна публікація mac повинна пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації підвищують підготовлені артефакти замість повторної
    їх збірки
- Для stable-релізів із виправленням на кшталт `YYYY.M.D-N` післяпублікаційний верифікатор
  також перевіряє той самий шлях оновлення в тимчасовому prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб виправлення релізу не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-payload
- Передрелізна перевірка npm завершується fail-closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню панель керування в браузері
- Післяпублікаційна перевірка також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні bundled plugin runtime deps у кореневому layout `dist/*`.
  Реліз, який постачається без payload залежностей bundled plugin або з порожнім payload,
  не проходить after-postpublish verifier і не може бути підвищений
  до `latest`.
- `pnpm test:install:smoke` також контролює бюджет `unpackedSize` для npm pack у
  кандидатному tarball оновлення, щоб e2e інсталятора виявляв випадкове роздуття pack
  до шляху публікації релізу
- Якщо робота над релізом зачепила планування CI, маніфести часу extension або
  матриці тестів extension, перед схваленням заново згенеруйте й перегляньте
  матричні виводи workflow `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб нотатки релізу не описували застарілу схему CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - реліз GitHub зрештою має містити пакетовані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - пакетований застосунок має зберігати non-debug bundle id, непорожній URL
    каналу Sparkle і `CFBundleVersion` не нижче за канонічну межу збірки Sparkle
    для цієї версії релізу

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, якими керує оператор:

- `tag`: обов’язковий релізний тег, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для валідаційної передрелізної перевірки
- `preflight_only`: `true` лише для валідації/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску передрелізної перевірки
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типово `beta`

`OpenClaw Release Checks` приймає такі вхідні параметри, якими керує оператор:

- `ref`: наявний релізний тег або поточний повний 40-символьний SHA коміту `main`
  для перевірки при запуску з `main`; з гілки релізу використовуйте
  наявний релізний тег або поточний повний 40-символьний SHA коміту гілки релізу

Правила:

- Stable-теги й теги виправлень можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний вхід commit SHA дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди лише валідаційний і також приймає
  поточний SHA коміту гілки workflow
- Режим commit-SHA для перевірок релізу також вимагає поточний HEAD гілки workflow
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що й під час передрелізної перевірки;
  workflow перевіряє ці метадані до продовження публікації

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використати поточний повний SHA коміту гілки workflow
     для валідаційного dry run передрелізного workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   коли навмисно хочете пряму stable-публікацію
3. Окремо запустіть `OpenClaw Release Checks` з тим самим тегом або
   повним поточним SHA коміту гілки workflow, коли вам потрібні live-перевірки prompt cache,
   паритетності QA Lab, Matrix і Telegram
   - Це окремо навмисно, щоб live-покриття залишалося доступним без
     повторного зв’язування довготривалих або нестабільних перевірок із workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо реліз потрапив у `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю stable-версію з `beta` до `latest`
7. Якщо реліз навмисно було опубліковано одразу в `latest` і `beta`
   має відразу слідувати тій самій stable-збірці, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його запланованій
   self-healing-синхронізації перемістити `beta` пізніше

Зміна dist-tag винесена в приватний репозиторій з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає OIDC-only publish.

Це зберігає і шлях прямої публікації, і шлях beta-first підвищення
документованими та видимими для оператора.

Якщо maintainer змушений повернутися до локальної npm-автентифікації, запускайте будь-які команди CLI
1Password (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
безпосередньо з основної оболонки агента; виконання лише всередині tmux робить запити,
сповіщення й обробку OTP спостережуваними та запобігає повторним сповіщенням хоста.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer-и використовують приватну документацію з релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
