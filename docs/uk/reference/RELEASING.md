---
read_when:
    - Шукаю визначення публічних каналів випусків
    - Шукаю іменування версій і частоту випусків
summary: Публічні канали випусків, іменування версій і частота випусків
title: Політика випусків
x-i18n:
    generated_at: "2026-04-20T12:31:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce04bd255ae5f13ff5088414c87e865fe56a8a0d0bf6ef6d8d84cb07ef65f18
    source_path: reference/RELEASING.md
    workflow: 15
---

# Політика випусків

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-випуску з виправленням: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний підвищений stable-випуск у npm
- `beta` означає поточну ціль встановлення beta
- Stable-випуски та stable-випуски з виправленнями за замовчуванням публікуються в npm `beta`; оператори випусків можуть явно націлити `latest` або пізніше підвищити перевірену beta-збірку
- Кожен випуск OpenClaw постачається разом як npm-пакет і macOS app

## Частота випусків

- Випуски спочатку проходять через beta
- Stable виходить лише після перевірки останньої beta
- Детальна процедура випуску, погодження, облікові дані та примітки щодо відновлення
  доступні лише для супроводжувачів

## Передрелізна перевірка

- Запускайте `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза межами швидшого локального циклу
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і пакет Control UI були наявні для кроку
  перевірки pack
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- Міжплатформна перевірка встановлення та оновлення під час виконання запускається з
  приватного workflow-джерела виклику
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Такий поділ навмисний: реальний шлях npm-випуску має залишатися коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному каналі, щоб не затримувати та не блокувати публікацію
- Перевірки випуску мають запускатися з workflow ref `main`, щоб логіка
  workflow та секрети залишалися канонічними
- Цей workflow приймає або наявний тег випуску, або поточний повний
  40-символьний SHA коміту `main`
- У режимі SHA коміту він приймає лише поточний HEAD `origin/main`; для
  старіших комітів випуску використовуйте тег випуску
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту `main` без вимоги наявності опублікованого тегу
- Цей шлях SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає реального тегу випуску
- Обидва workflow зберігають реальний шлях публікації та підвищення на GitHub-hosted
  runners, тоді як немутуючий шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва секрети workflow: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-випуску більше не чекає на окремий канал перевірок випуску
- Перед погодженням запускайте
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний тег beta/виправлення)
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну версію beta/виправлення), щоб перевірити опублікований шлях
  встановлення з реєстру в новому тимчасовому префіксі
- Автоматизація випусків супроводжувачів тепер використовує підхід preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - stable npm-випуски за замовчуванням націлені на `beta`
  - stable npm-публікацію можна явно націлити на `latest` через вхідні дані workflow
  - зміна npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає OIDC-only publish
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації підвищують уже підготовлені артефакти замість того, щоб
    знову їх перебудовувати
- Для stable-випусків з виправленнями на кшталт `YYYY.M.D-N` засіб перевірки після публікації
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб виправлення випусків не могли непомітно залишити старі глобальні встановлення на
  базовому stable-вмісті
- Передрелізна перевірка npm-випуску завершується помилкою за принципом fail closed, якщо tarball не містить
  одночасно `dist/control-ui/index.html` і непорожній вміст `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню панель браузера
- `pnpm test:install:smoke` також примусово перевіряє бюджет `unpackedSize` для npm pack
  на tarball кандидата на оновлення, щоб installer e2e виявляв випадкове збільшення pack
  до шляху публікації випуску
- Якщо робота над випуском зачепила планування CI, маніфести часу розширень або
  матриці тестування розширень, перед погодженням заново згенеруйте й перегляньте
  керовані planner виходи матриці workflow `checks-node-extensions` з `.github/workflows/ci.yml`,
  щоб примітки до випуску не описували застарілу структуру CI
- Готовність stable macOS release також включає поверхні оновлювача:
  - GitHub release має в результаті містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - запакований app має зберігати bundle id не для debug, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного порога збірки Sparkle
    для цієї версії випуску

## Вхідні дані NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту `main` для передрелізної перевірки лише для валідації
- `preflight_only`: `true` для лише валідації/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий для реального шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску передрелізної перевірки
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: наявний тег випуску або поточний повний 40-символьний коміт
  SHA для валідації

Правила:

- Stable і теги виправлень можуть публікуватися або в `beta`, або в `latest`
- Beta-теги попередніх випусків можуть публікуватися лише в `beta`
- Повний вхідний commit SHA дозволений лише коли `preflight_only=true`
- Режим commit-SHA для перевірок випуску також вимагає поточний HEAD `origin/main`
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час передрелізної перевірки;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-випуску

Під час створення stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тегу ви можете використати поточний повний SHA коміту `main` для
     dry run передрелізного workflow лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first процесу або `latest` лише
   коли ви навмисно хочете прямої stable-публікації
3. Запустіть окремо `OpenClaw Release Checks` з тим самим тегом або
   повним поточним SHA `main`, якщо вам потрібне live-покриття prompt cache
   - Це навмисно окремо, щоб live-покриття залишалося доступним без
     повторного зчеплення довготривалих або нестабільних перевірок із workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо випуск потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю stable-версію з `beta` до `latest`
7. Якщо випуск навмисно був одразу опублікований у `latest`, а `beta`
   має відразу наслідувати ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його запланованій
   self-healing синхронізації перемістити `beta` пізніше

Зміна dist-tag знаходиться в приватному репозиторії з міркувань безпеки, оскільки вона досі
вимагає `NPM_TOKEN`, тоді як публічний репозиторій зберігає OIDC-only publish.

Це зберігає як шлях прямої публікації, так і шлях підвищення beta-first
задокументованими й видимими для операторів.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Супроводжувачі використовують приватну документацію щодо випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичну інструкцію.
