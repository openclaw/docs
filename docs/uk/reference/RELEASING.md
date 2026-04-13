---
read_when:
    - Шукаєте визначення публічних каналів випусків
    - Шукаєте іменування версій і періодичність
summary: Публічні канали випусків, іменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-13T13:04:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdc32839447205d74ba7a20a45fbac8e13b199174b442a1e260e3fce056c63da
    source_path: reference/RELEASING.md
    workflow: 15
---

# Політика випусків

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома голова `main`

## Іменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця або дня
- `latest` означає поточний просунутий stable-випуск npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні випуски типово публікуються в npm `beta`; оператори випусків можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS

## Періодичність випусків

- Випуски спочатку проходять через beta
- Stable з’являється лише після того, як останню beta перевірено
- Детальна процедура випуску, затвердження, облікові дані та примітки щодо відновлення
  доступні лише для супровідників

## Передрелізна перевірка

- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб для кроку
  перевірки пакування існували очікувані артефакти випуску `dist/*` і бандл
  Control UI
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- Такий поділ навмисний: реальний шлях npm-випуску має залишатися коротким,
  детермінованим і зосередженим на артефактах, а повільніші live-перевірки мають
  залишатися у власному каналі, щоб не затримувати й не блокувати публікацію
- Перевірки випуску потрібно запускати з workflow ref `main`, щоб логіка
  workflow і секрети залишалися канонічними
- Цей workflow приймає або наявний тег випуску, або поточний повний
  40-символьний SHA коміту `main`
- У режимі SHA коміту він приймає лише поточний HEAD `origin/main`; для
  старіших комітів випуску використовуйте тег випуску
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає
  поточний повний 40-символьний SHA коміту `main` без потреби у вже запушеному тезі
- Цей шлях через SHA призначений лише для валідації й не може бути просунутий
  до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно потребує реального тега випуску
- Обидва workflow залишають реальний шлях публікації та просування на runners,
  розміщених GitHub, тоді як шлях валідації без змін може використовувати
  більші Linux runners від Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow-секретів `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-випуску більше не чекає на окремий канал перевірок випуску
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/коригувальний тег) перед затвердженням
- Після публікації в npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/коригувальну версію), щоб перевірити опублікований шлях
  встановлення з реєстру в новому тимчасовому префіксі
- Автоматизація випусків для супровідників тепер використовує модель preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - stable npm-випуски типово спрямовуються в `beta`
  - stable публікація в npm може явно націлювати `latest` через вхід workflow
  - stable просування npm з `beta` до `latest` усе ще доступне як явний ручний режим у довіреному workflow `OpenClaw NPM Release`
  - прямі stable-публікації також можуть запускати явний режим синхронізації dist-tag, який
    спрямовує і `latest`, і `beta` на вже опубліковану stable-версію
  - ці режими dist-tag усе ще потребують дійсного `NPM_TOKEN` у середовищі `npm-release`, оскільки керування npm `dist-tag` є окремим від trusted publishing
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість того, щоб
    знову їх перебудовувати
- Для stable-коригувальних випусків, таких як `YYYY.M.D-N`, post-publish verifier
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні випуски не могли непомітно залишити старіші глобальні встановлення
  на базовому stable-корисному навантаженні
- Передрелізна перевірка npm-випуску завершується безпечною відмовою, якщо tarball не містить
  і `dist/control-ui/index.html`, і непорожнє корисне навантаження `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню браузерну панель
- Якщо робота над випуском торкалася планування CI, маніфестів таймінгу розширень або
  матриць тестування розширень, перед затвердженням регенеруйте й перегляньте
  виходи матриці workflow `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб примітки до випуску не описували застарілу схему CI
- Готовність stable-випуску macOS також охоплює поверхні оновлювача:
  - GitHub-випуск має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має після публікації вказувати на новий stable zip
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімального Sparkle build
    для цієї версії випуску

## Входи NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором входи:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту `main` для передрелізної перевірки лише для валідації
- `preflight_only`: `true` лише для валідації/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного передрелізного запуску
- `npm_dist_tag`: цільовий тег npm для шляху публікації; типове значення — `beta`
- `promote_beta_to_latest`: `true`, щоб пропустити публікацію й перемістити вже опубліковану
  stable-збірку з `beta` на `latest`
- `sync_stable_dist_tags`: `true`, щоб пропустити публікацію й спрямувати і `latest`, і
  `beta` на вже опубліковану stable-версію

`OpenClaw Release Checks` приймає такі керовані оператором входи:

- `ref`: наявний тег випуску або поточний повний 40-символьний SHA коміту `main`
  для перевірки

Правила:

- Stable і коригувальні теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Повний вхідний SHA коміту дозволено лише коли `preflight_only=true`
- Режим SHA коміту для перевірок випуску також вимагає поточного HEAD `origin/main`
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час передрелізної перевірки;
  workflow перевіряє ці метадані перед продовженням публікації
- Режим просування має використовувати stable або коригувальний тег, `preflight_only=false`,
  порожній `preflight_run_id` і `npm_dist_tag=beta`
- Режим синхронізації dist-tag має використовувати stable або коригувальний тег,
  `preflight_only=false`, порожній `preflight_run_id`, `npm_dist_tag=latest`,
  і `promote_beta_to_latest=false`
- Режими просування та синхронізації dist-tag також потребують дійсного `NPM_TOKEN`, тому що
  `npm dist-tag add` усе ще вимагає звичайної npm-автентифікації; trusted publishing покриває
  лише шлях публікації пакета

## Послідовність stable npm-випуску

Під час підготовки stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Перш ніж тег з’явиться, ви можете використати поточний повний SHA коміту `main` для
     dry run передрелізного workflow лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   тоді, коли ви навмисно хочете прямої stable-публікації
3. Окремо запустіть `OpenClaw Release Checks` із тим самим тегом або
   повним поточним SHA `main`, якщо вам потрібне live-покриття prompt cache
   - Це навмисно окремо, щоб live-покриття залишалося доступним без
     повторного зв’язування довготривалих або нестабільних перевірок із workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо випуск потрапив у `beta`, пізніше запустіть `OpenClaw NPM Release` із тим самим
   stable `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   порожнім `preflight_run_id` і `npm_dist_tag=beta`, коли захочете перемістити цю
   опубліковану збірку в `latest`
7. Якщо випуск навмисно було опубліковано безпосередньо в `latest`, а `beta`
   має вказувати на ту саму stable-збірку, запустіть `OpenClaw NPM Release` із тим самим
   stable `tag`, `sync_stable_dist_tags=true`, `promote_beta_to_latest=false`,
   `preflight_only=false`, порожнім `preflight_run_id` і `npm_dist_tag=latest`

Режими просування та синхронізації dist-tag усе ще потребують затвердження середовища `npm-release`
і дійсного `NPM_TOKEN`, доступного для цього запуску workflow.

Це зберігає як шлях прямої публікації, так і шлях beta-first просування
задокументованими й видимими для оператора.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Супровідники використовують приватну документацію з випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.
