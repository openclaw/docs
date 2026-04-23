---
read_when:
    - Шукаєте визначення публічних каналів релізів
    - Шукаєте схему найменування версій і cadence
summary: Публічні канали релізів, схема найменування версій і cadence
title: Політика релізів
x-i18n:
    generated_at: "2026-04-23T21:09:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f65638c0a1ddd1467bda7e5e2242935796edaca077a25b70d4227cc900471a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні лінії релізів:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Найменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- Версія correction-релізу stable: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- Не додавайте leading zero до місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable і correction-релізи stable за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлити їх на `latest` або пізніше просунути перевірену beta-збірку
- Кожен stable-реліз OpenClaw одночасно постачає npm package і застосунок macOS;
  beta-релізи зазвичай спочатку перевіряють і публікують шлях npm/package, а
  build/sign/notarize застосунку macOS резервується для stable, якщо це не запитано явно

## Cadence релізів

- Релізи рухаються за схемою beta-first
- Stable виходить лише після перевірки найновішої beta
- Супровідники зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу й виправлення не блокували нову
  розробку в `main`
- Якщо beta tag уже був pushed або published і потребує виправлення, супровідники створюють
  наступний tag `-beta.N` замість видалення або перевідтворення старого beta tag
- Детальна процедура релізу, схвалення, облікові дані та примітки з відновлення
  доступні лише супровідникам

## Preflight релізу

- Запустіть `pnpm check:test-types` перед preflight релізу, щоб TypeScript тестів
  залишався покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед preflight релізу, щоб ширші перевірки
  циклів import-ів і архітектурних меж були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і bundle Control UI існували для кроку
  перевірки pack
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає mock parity gate QA Lab плюс live
  lane-и QA Matrix і Telegram перед схваленням релізу. Live lane-и використовують
  environment `qa-live-shared`; Telegram також використовує lease-облікові дані Convex CI.
- Cross-OS перевірка runtime встановлення та оновлення запускається з
  приватного caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає reusable public workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ є навмисним: зберігати справжній шлях npm release коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки
  залишаються у власному lane, щоб не затримувати й не блокувати публікацію
- Перевірки релізу мають запускатися з workflow ref `main` або з
  workflow ref `release/YYYY.M.D`, щоб логіка workflow і secrets залишалися
  контрольованими
- Цей workflow приймає або наявний release tag, або поточний повний
  40-символьний commit SHA гілки workflow
- У режимі commit-SHA він приймає лише поточний HEAD гілки workflow;
  для старіших commit-ів релізу використовуйте release tag
- Preflight лише для валідації в `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний commit SHA гілки workflow без потреби в pushed tag
- Цей шлях SHA призначений лише для валідації й не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки metadata package; реальна публікація все одно потребує справжнього release tag
- Обидва workflow зберігають справжній шлях publish і promotion на GitHub-hosted
  runner-ах, тоді як шлях валідації без мутацій може використовувати більші
  Linux runner-и Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням workflow secret-ів `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окремий lane release checks
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction tag) перед схваленням
- Після npm publish запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити опублікований шлях
  встановлення з registry у свіжому temp prefix
- Автоматизація релізів супровідників тепер використовує preflight-then-promote:
  - справжній npm publish має пройти успішний npm `preflight_run_id`
  - справжній npm publish має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm-релізи за замовчуванням націлюються на `beta`
  - stable npm publish може явно націлюватися на `latest` через workflow input
  - мутація npm dist-tag на основі token тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний repo зберігає publish лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - справжній приватний publish mac має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - справжні шляхи publish просувають уже підготовлені артефакти замість повторного їх збирання
- Для correction-релізів stable на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення через temp-prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб correction-релізи не могли непомітно залишити старіші global installs на
  базовому stable payload
- npm release preflight завершується fail-closed, якщо tarball не включає і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми більше не випустили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковане встановлення з registry
  містить непорожні bundled runtime deps Plugin-ів у кореневому layout `dist/*`.
  Реліз, який постачається з відсутнім або порожнім payload залежностей bundled Plugin-ів,
  не проходить postpublish verifier і не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також контролює бюджет `unpackedSize` npm pack
  для candidate update tarball, тож installer e2e виявляє випадкове роздуття pack
  до шляху публікації релізу
- Якщо робота над релізом торкалася планування CI, маніфестів часу extension або
  матриць тестів extension, перед схваленням згенеруйте й перевірте керовані planner-ом
  виходи workflow matrix `checks-node-extensions` із `.github/workflows/ci.yml`,
  щоб примітки до релізу не описували застарілий layout CI
- Готовність stable-релізу macOS також включає поверхні updater:
  - GitHub release має в підсумку містити упаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - упакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімального build floor Sparkle
    для цієї версії релізу

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, які контролює оператор:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для preflight лише з валідацією
- `preflight_only`: `true` для лише валідації/build/package, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий для справжнього шляху publish, щоб workflow повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm tag для шляху publish; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі вхідні параметри, які контролює оператор:

- `ref`: наявний release tag або поточний повний 40-символьний commit
  SHA `main` для валідації при запуску з `main`; із release branch використовуйте
  наявний release tag або поточний повний 40-символьний commit
  SHA release branch

Правила:

- Stable і correction tag-и можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease tag-и можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний вхідний commit SHA дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди призначений лише для валідації і також приймає
  поточний commit SHA гілки workflow
- Режим commit-SHA для release checks також вимагає поточний HEAD гілки workflow
- Справжній шлях publish має використовувати той самий `npm_dist_tag`, що й під час preflight;
  workflow перевіряє цю metadata перед продовженням publish

## Послідовність stable npm release

Під час створення stable npm release:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи tag можна використовувати поточний повний commit
     SHA гілки workflow для dry run preflight workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   тоді, коли свідомо хочете прямий stable publish
3. Окремо запустіть `OpenClaw Release Checks` з тим самим tag або
   повним поточним commit SHA гілки workflow, коли вам потрібне покриття
   live prompt cache, QA Lab parity, Matrix і Telegram
   - Це навмисно окремо, щоб live coverage залишалося доступним без
     повторного зв’язування довгих або flaky-перевірок із workflow publish
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
7. Якщо реліз навмисно опубліковано напряму в `latest`, а `beta`
   має одразу слідувати за тією самою stable-збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag-и на stable-версію, або дозвольте його запланованій
   самовідновлюваній синхронізації перемістити `beta` пізніше

Мутація dist-tag живе в приватному repo з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний repo зберігає publish лише через OIDC.

Це зберігає і шлях прямої публікації, і шлях beta-first promotion задокументованими та видимими для оператора.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Супровідники використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.
