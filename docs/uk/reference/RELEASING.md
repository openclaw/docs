---
read_when:
    - Шукаю визначення публічних каналів релізів
    - Шукаю назви версій і періодичність
summary: Публічні канали релізів, назви версій і періодичність
title: Політика релізів
x-i18n:
    generated_at: "2026-04-10T23:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca613d094c93670c012f0b79720fad0d5d85be802f54b0acb7a8f22aca5bde12
    source_path: reference/RELEASING.md
    workflow: 15
---

# Політика релізів

OpenClaw має три публічні канали релізів:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запрошено
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно вибрати `latest` або пізніше просунути перевірену beta-збірку
- Кожен реліз OpenClaw постачається разом із npm-пакетом і застосунком для macOS

## Періодичність релізів

- Релізи спочатку проходять через beta
- Stable іде лише після перевірки найновішої beta
- Детальна процедура релізу, затвердження, облікові дані та нотатки щодо відновлення
  доступні лише для мейнтейнерів

## Передрелізна перевірка

- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і збірка Control UI існували для кроку
  перевірки пакування
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Передрелізна перевірка npm для main-гілки також запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  перед пакуванням tarball, використовуючи обидва секрети воркфлоу:
  `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Перед затвердженням запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction-тег)
- Після публікації в npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction-версію), щоб перевірити опублікований шлях
  встановлення з реєстру в новому тимчасовому префіксі
- Автоматизація релізів для мейнтейнерів тепер використовує схему preflight-then-promote:
  - справжня публікація в npm має пройти успішний npm `preflight_run_id`
  - stable npm-релізи за замовчуванням ідуть у `beta`
  - stable npm-публікацію можна явно націлити на `latest` через вхідні параметри воркфлоу
  - stable npm-просування з `beta` до `latest` усе ще доступне як явний ручний режим у довіреному воркфлоу `OpenClaw NPM Release`
  - для цього режиму просування все одно потрібен дійсний `NPM_TOKEN` у середовищі `npm-release`, оскільки керування npm `dist-tag` виконується окремо від trusted publishing
  - публічний `macOS Release` призначений лише для валідації
  - справжня приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - справжні шляхи публікації просувають підготовлені артефакти замість того, щоб
    повторно збирати їх знову
- Для stable-коригувальних релізів на кшталт `YYYY.M.D-N`, post-publish verifier
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні релізи не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-навантаженні
- Передрелізна перевірка npm завершується з відмовою за замовчуванням, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню панель браузера
- Якщо робота над релізом зачіпала планування CI, маніфести таймінгу розширень або
  матриці тестування розширень, перед затвердженням згенеруйте наново й перегляньте
  виходи матриці воркфлоу `checks-node-extensions`, якими володіє planner, з `.github/workflows/ci.yml`,
  щоб нотатки до релізу не описували застарілу структуру CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - GitHub-реліз зрештою має містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має після публікації вказувати на новий stable zip
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion`, не нижчий за канонічний мінімальний рівень збірки Sparkle
    для цієї версії релізу

## Вхідні параметри воркфлоу NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, якими керує оператор:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`
- `preflight_only`: `true` лише для валідації/збирання/пакування, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий на справжньому шляху публікації, щоб воркфлоу повторно використав
  підготовлений tarball з успішного передрелізного запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`
- `promote_beta_to_latest`: `true`, щоб пропустити публікацію і перемістити вже опубліковану
  stable-збірку `beta` до `latest`

Правила:

- Stable і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час передрелізної перевірки;
  воркфлоу перевіряє ці метадані перед продовженням публікації
- Режим просування має використовувати stable або correction-тег, `preflight_only=false`,
  порожній `preflight_run_id` і `npm_dist_tag=beta`
- Режим просування також вимагає дійсний `NPM_TOKEN` у середовищі `npm-release`,
  оскільки `npm dist-tag add` усе ще потребує звичайної npm-автентифікації

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку, або `latest` лише
   якщо ви свідомо хочете прямої stable-публікації
3. Збережіть успішний `preflight_run_id`
4. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
5. Якщо реліз потрапив у `beta`, пізніше запустіть `OpenClaw NPM Release` з
   тим самим stable `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   порожнім `preflight_run_id` і `npm_dist_tag=beta`, коли захочете перемістити цю
   опубліковану збірку до `latest`

Режим просування все ще вимагає затвердження середовища `npm-release` і
дійсного `NPM_TOKEN` у цьому середовищі.

Це залишає як шлях прямої публікації, так і beta-first шлях просування
задокументованими та видимими для оператора.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують приватну документацію з релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.
