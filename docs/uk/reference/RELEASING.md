---
read_when:
    - Шукаєте визначення публічних каналів випусків
    - Шукаєте найменування версій і частоту випусків
summary: Публічні канали випусків, найменування версій і частота випусків
title: Політика випусків
x-i18n:
    generated_at: "2026-04-14T03:06:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3eaf9f1786b8c9fd4f5a9c657b623cb69d1a485958e1a9b8f108511839b63587
    source_path: reference/RELEASING.md
    workflow: 15
---

# Політика випусків

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома голова `main`

## Найменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-виправлення: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте провідні нулі до місяця або дня
- `latest` означає поточний підвищений до stable npm-випуск
- `beta` означає поточну ціль встановлення beta
- Stable і stable-виправлення за замовчуванням публікуються в npm `beta`; оператори випусків можуть явно націлюватися на `latest` або пізніше підвищити перевірену beta-збірку
- Кожен випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS

## Частота випусків

- Випуски спочатку проходять через beta
- Stable іде лише після перевірки найновішої beta
- Детальна процедура випуску, схвалення, облікові дані та примітки щодо відновлення
  доступні лише мейнтейнерам

## Передрелізна перевірка

- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і пакет Control UI існували для етапу
  перевірки pack
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- Цей поділ навмисний: зберігайте реальний шлях npm-випуску коротким,
  детермінованим і зосередженим на артефактах, а повільніші live-перевірки нехай залишаються
  в окремому каналі, щоб вони не затримували й не блокували публікацію
- Перевірки випуску мають запускатися з workflow ref `main`, щоб логіка
  workflow і секрети залишалися канонічними
- Цей workflow приймає або наявний тег випуску, або поточний повний
  40-символьний SHA коміту `main`
- У режимі SHA коміту він приймає лише поточний HEAD `origin/main`; для
  старіших комітів випуску використовуйте тег випуску
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту `main` без потреби у відправленому тегу
- Цей шлях із SHA призначений лише для валідації і не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно вимагає справжнього тегу випуску
- Обидва workflow зберігають реальний шлях публікації та підвищення на GitHub-hosted
  runners, тоді як шлях валідації без змін може використовувати більші
  Linux runners Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва workflow-секрети `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-випуску більше не очікує на окремий канал перевірок випуску
- Перед схваленням запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/тег виправлення)
- Після npm-публікації запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/версію виправлення), щоб перевірити шлях встановлення
  опублікованого реєстру в новому тимчасовому префіксі
- Автоматизація випусків мейнтейнерів тепер використовує модель preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - stable npm-випуски за замовчуванням націлюються на `beta`
  - stable npm-публікація може явно націлюватися на `latest` через вхід workflow
  - підвищення stable npm з `beta` до `latest` усе ще доступне як явний ручний режим у довіреному workflow `OpenClaw NPM Release`
  - прямі stable-публікації також можуть запускати явний режим синхронізації dist-tag, який
    спрямовує і `latest`, і `beta` на вже опубліковану stable-версію
  - ці режими dist-tag усе ще потребують дійсного `NPM_TOKEN` у середовищі `npm-release`, тому що керування npm `dist-tag` є окремим від trusted publishing
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації підвищують підготовлені артефакти замість їх
    повторного збирання
- Для stable-виправлень на кшталт `YYYY.M.D-N` перевірник після публікації
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб виправлення випуску не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-пакеті
- Передрелізна перевірка npm-випуску завершується fail closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожнє навантаження `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню браузерну панель керування
- `pnpm test:install:smoke` також застосовує бюджет `unpackedSize` npm pack до
  tarball кандидата на оновлення, тому e2e перевірка встановлювача виявляє випадкове роздуття пакета
  до шляху публікації випуску
- Якщо робота над випуском торкалася планування CI, маніфестів таймінгу розширень або
  матриць тестування розширень, перед схваленням повторно згенеруйте й перегляньте
  виходи матриці workflow `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб примітки до випуску не описували застарілу структуру CI
- Готовність stable-випуску macOS також охоплює поверхні оновлювача:
  - GitHub-випуск має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - запакований застосунок має зберігати не-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімального значення Sparkle build
    для цієї версії випуску

## Вхідні параметри NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту `main` для передрелізної перевірки лише для валідації
- `preflight_only`: `true` для лише валідації/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску передрелізної перевірки
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`
- `promote_beta_to_latest`: `true`, щоб пропустити публікацію і перемістити вже опубліковану
  stable-збірку `beta` на `latest`
- `sync_stable_dist_tags`: `true`, щоб пропустити публікацію і спрямувати і `latest`, і
  `beta` на вже опубліковану stable-версію

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: наявний тег випуску або поточний повний 40-символьний коміт `main`
  SHA для перевірки

Правила:

- Stable і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Повний вхід SHA коміту дозволено лише коли `preflight_only=true`
- Режим SHA коміту для перевірок випуску також вимагає поточний HEAD `origin/main`
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час передрелізної перевірки;
  workflow перевіряє ці метадані, перш ніж публікація продовжиться
- Режим підвищення має використовувати stable або correction-тег, `preflight_only=false`,
  порожній `preflight_run_id` і `npm_dist_tag=beta`
- Режим синхронізації dist-tag має використовувати stable або correction-тег,
  `preflight_only=false`, порожній `preflight_run_id`, `npm_dist_tag=latest`
  і `promote_beta_to_latest=false`
- Режими підвищення та синхронізації dist-tag також вимагають дійсний `NPM_TOKEN`, тому що
  `npm dist-tag add` усе ще потребує звичайної npm-автентифікації; trusted publishing покриває
  лише шлях публікації пакета

## Послідовність stable npm-випуску

Під час створення stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тегу ви можете використовувати поточний повний SHA `main`
     для dry run передрелізного workflow лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   якщо ви навмисно хочете прямої stable-публікації
3. Запустіть `OpenClaw Release Checks` окремо з тим самим тегом або
   повним поточним SHA `main`, якщо вам потрібне live-покриття prompt cache
   - Це навмисно окремо, щоб live-покриття залишалося доступним без
     повторного прив’язування довготривалих або нестабільних перевірок до workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо випуск опинився в `beta`, пізніше запустіть `OpenClaw NPM Release` з тим самим
   stable `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   порожнім `preflight_run_id` і `npm_dist_tag=beta`, коли ви захочете перемістити цю
   опубліковану збірку на `latest`
7. Якщо випуск було навмисно опубліковано безпосередньо в `latest`, а `beta`
   має слідувати за тією ж stable-збіркою, запустіть `OpenClaw NPM Release` з тим самим
   stable `tag`, `sync_stable_dist_tags=true`, `promote_beta_to_latest=false`,
   `preflight_only=false`, порожнім `preflight_run_id` і `npm_dist_tag=latest`

Режими підвищення та синхронізації dist-tag усе ще потребують схвалення середовища `npm-release`
і дійсного `NPM_TOKEN`, доступного для цього запуску workflow.

Це зберігає як прямий шлях публікації, так і beta-first шлях підвищення
задокументованими та видимими для операторів.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують приватну документацію з випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.
