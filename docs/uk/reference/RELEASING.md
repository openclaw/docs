---
read_when:
    - Шукаєте визначення публічних каналів випусків
    - Шукаєте назви версій і частоту випусків
summary: Публічні канали випусків, назви версій і частота випусків
title: Політика випусків
x-i18n:
    generated_at: "2026-04-20T14:13:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281b3fd1764c60cb35a25a12c338595020d7c04bcb662e96c4131193a0607537
    source_path: reference/RELEASING.md
    workflow: 15
---

# Політика випусків

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія стабільного випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія випуску стабільного виправлення: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний стабільний випуск npm, який було підвищено
- `beta` означає поточну ціль встановлення beta
- Стабільні випуски та випуски стабільних виправлень за замовчуванням публікуються в npm `beta`; оператори випусків можуть явно націлюватися на `latest` або підвищити перевірену beta-збірку пізніше
- Кожен випуск OpenClaw одночасно постачає npm package і застосунок macOS

## Частота випусків

- Випуски спочатку проходять через beta
- Stable з’являється лише після перевірки останньої beta
- Детальна процедура випуску, затвердження, облікові дані та примітки щодо відновлення доступні
  лише для супроводжувачів

## Попередня перевірка випуску

- Виконайте `pnpm check:test-types` перед попередньою перевіркою випуску, щоб тестовий TypeScript лишався
  охопленим поза швидшим локальним бар’єром `pnpm check`
- Виконайте `pnpm check:architecture` перед попередньою перевіркою випуску, щоб ширші перевірки
  циклів імпорту та меж архітектури були успішними поза швидшим локальним бар’єром
- Виконайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і bundle Control UI існували для кроку
  перевірки pack
- Виконуйте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- Крос-ОС перевірка встановлення та оновлення під час виконання запускається з
  приватного caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: він зберігає справжній шлях випуску npm коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному каналі, щоб не затримувати і не блокувати публікацію
- Перевірки випуску мають запускатися з посилання workflow `main`, щоб
  логіка workflow і секрети лишалися канонічними
- Цей workflow приймає або наявний тег випуску, або поточний повний
  40-символьний SHA коміту `main`
- У режимі SHA коміту він приймає лише поточний HEAD `origin/main`; використовуйте
  тег випуску для старіших комітів випуску
- Попередня перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту `main` без вимоги вже запушеного тега
- Цей шлях SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки метаданих
  package; реальна публікація все одно потребує реального тега випуску
- Обидва workflow зберігають реальний шлях публікації та підвищення на GitHub-hosted
  runners, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow secrets `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Попередня перевірка випуску npm більше не чекає на окремий канал перевірок випуску
- Виконайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний тег beta/виправлення) перед затвердженням
- Після публікації в npm виконайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну версію beta/виправлення), щоб перевірити опублікований шлях
  встановлення з реєстру в новому тимчасовому prefix
- Автоматизація випусків супроводжувачів тепер використовує схему preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - стабільні випуски npm за замовчуванням спрямовуються в `beta`
  - стабільна публікація npm може явно націлюватися на `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна публікація mac має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації підвищують уже підготовлені артефакти замість повторного
    їх збирання
- Для стабільних випусків виправлень на кшталт `YYYY.M.D-N` постпублікаційний верифікатор
  також перевіряє той самий шлях оновлення через тимчасовий prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб стабільні виправлення не могли непомітно залишати старі глобальні встановлення на
  базовому стабільному payload
- Попередня перевірка випуску npm завершується з помилкою за замовчуванням, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню панель браузера
- `pnpm test:install:smoke` також примусово застосовує бюджет npm pack `unpackedSize` до
  tarball кандидата на оновлення, щоб e2e перевірка інсталятора виявляла випадкове
  роздуття pack до шляху публікації випуску
- Якщо робота над випуском торкалася планування CI, маніфестів часу extension або
  матриць тестів extension, перед затвердженням заново згенеруйте та перегляньте
  виходи матриці workflow `checks-node-extensions`, якими керує planner, з `.github/workflows/ci.yml`,
  щоб примітки до випуску не описували застарілу структуру CI
- Готовність стабільного випуску macOS також включає поверхні оновлювача:
  - GitHub release має врешті містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - запакований застосунок має зберігати не-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion`, не нижчий за канонічний мінімум Sparkle build
    для цієї версії випуску

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту `main` для попередньої перевірки лише з валідацією
- `preflight_only`: `true` для лише валідації/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску попередньої перевірки
- `npm_dist_tag`: цільовий тег npm для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: наявний тег випуску або поточний повний 40-символьний SHA коміту `main`
  для валідації

Правила:

- Stable і correction теги можуть публікуватися або в `beta`, або в `latest`
- Теги beta prerelease можуть публікуватися лише в `beta`
- Повний SHA коміту дозволений лише коли `preflight_only=true`
- Режим SHA коміту для перевірок випуску також вимагає поточний HEAD `origin/main`
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що й під час попередньої перевірки;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність стабільного випуску npm

Під час створення стабільного випуску npm:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тег ще не існує, ви можете використати поточний повний SHA коміту `main` для
     dry run попередньої перевірки workflow лише з валідацією
2. Оберіть `npm_dist_tag=beta` для звичайного beta-first потоку, або `latest` лише
   якщо ви навмисно хочете пряму стабільну публікацію
3. Запустіть `OpenClaw Release Checks` окремо з тим самим тегом або
   повним поточним SHA `main`, коли вам потрібне live-покриття prompt cache
   - Це навмисно окремо, щоб live-покриття лишалося доступним без
     повторного зв’язування довгих або нестабільних перевірок із workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Запустіть `OpenClaw NPM Release` знову з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо випуск потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю стабільну версію з `beta` до `latest`
7. Якщо випуск навмисно було одразу опубліковано в `latest` і `beta`
   має відразу слідувати за тією самою стабільною збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його плановій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag живе в приватному репозиторії з міркувань безпеки, тому що вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це робить як шлях прямої публікації, так і шлях beta-first promotion
задокументованими та видимими для операторів.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Супроводжувачі використовують приватну документацію щодо випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.
