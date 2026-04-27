---
read_when:
    - Шукаю визначення публічних каналів випуску
    - Шукаю іменування версій і частоту випусків
summary: Публічні канали випуску, іменування версій і частота випусків
title: Політика випусків
x-i18n:
    generated_at: "2026-04-27T03:28:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b6e0306f07ceec860ad2cce6bd6bb6a6d52fc8a87e9fa7acd3f48b963fb2bcb
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні канали випуску:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: пререлізні теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-пререлізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду до місяця або дня
- `latest` означає поточний просунутий stable-випуск npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно вибрати `latest` або просунути перевірену beta-збірку пізніше
- Кожен stable-випуск OpenClaw постачається разом як npm-пакет і застосунок macOS;
  beta-випуски зазвичай спочатку проходять валідацію та публікацію шляху npm/package, а
  збірка/підпис/нотаризація macOS-застосунку резервується для stable, якщо явно не запитано

## Частота випусків

- Випуски спочатку проходять через beta
- Stable іде лише після того, як останню beta перевірено
- Підтримувачі зазвичай роблять випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже запушено або опубліковано і він потребує виправлення, підтримувачі створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, погодження, облікові дані та примітки з відновлення
  доступні лише підтримувачам

## Передрелізна перевірка

- Запускайте `pnpm check:test-types` перед передрелізною перевіркою, щоб покриття тестового TypeScript
  зберігалося поза швидшим локальним бар’єром `pnpm check`
- Запускайте `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза швидшим локальним бар’єром
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і збірка Control UI існували для кроку
  валідації pack
- Запускайте вручну workflow `Full Release Validation` перед погодженням випуску,
  коли вам потрібен увесь набір перевірок випуску з однієї точки входу. Він
  приймає гілку, тег або повний SHA коміту, запускає вручну `CI` і
  запускає `OpenClaw Release Checks` для install smoke, наборів Docker release-path,
  live/E2E, OpenWebUI, паритету QA Lab, а також каналів Matrix і Telegram.
  Вказуйте `npm_telegram_package_spec` лише після того, як пакет уже опубліковано
  і також потрібно запустити Telegram E2E після публікації.
  Приклад: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте вручну workflow `Package Acceptance`, коли хочете отримати побічне підтвердження
  для кандидата в пакет, поки робота над випуском триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії випуску; `source=ref`
  щоб упакувати довірену гілку/тег/SHA; `source=url` для HTTPS tarball з
  обов’язковим SHA-256; або `source=artifact` для tarball, завантаженого
  іншим запуском GitHub Actions. Workflow зіставляє кандидата з
  `package-under-test`, повторно використовує планувальник Docker E2E release щодо цього
  tarball і за бажанням може запускати Telegram QA для опублікованого npm.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product`
  Типові профілі:
  - `smoke`: канали install/channel/agent, gateway network і канали перезавантаження конфігурації
  - `package`: канали package/update/plugin без OpenWebUI
  - `product`: профіль package плюс MCP-канали, очищення cron/subagent,
    OpenAI web search і OpenWebUI
  - `full`: частини Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для цільового повторного запуску
- Запускайте вручну workflow `CI` напряму, коли вам потрібне лише повне звичайне покриття
  CI для кандидата в реліз. Ручні запуски CI обходять changed-scoping і примусово
  запускають Linux Node shards, bundled-plugin shards, channel contracts,
  сумісність з Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python Skills, Windows, macOS, Android і канали i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час перевірки телеметрії випуску. Команда проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace span,
  обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає шлюз паритету QA Lab mock, а також live
  канали QA Matrix і Telegram перед погодженням випуску. Live-канали використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Кросплатформна перевірка встановлення й оновлення під час виконання запускається з
  приватного caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Це розділення навмисне: воно зберігає реальний шлях npm-випуску коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному каналі, щоб не затримувати й не блокувати публікацію
- Перевірки випуску, що містять секрети, слід запускати через `Full Release
Validation` або з ref workflow `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  визначений коміт досяжний з гілки OpenClaw або тега випуску
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби в запушеному тегі
- Цей шлях SHA призначено лише для валідації, і його не можна просунути до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; справжня публікація все одно вимагає справжнього тега випуску
- Обидва workflow зберігають реальний шлях публікації та просування на GitHub-hosted
  runners, тоді як незмінювальний шлях валідації може використовувати більші
  Linux runners Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва секрети workflow `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm release більше не чекає окремого каналу перевірок випуску
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед погодженням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з
  опублікованого реєстру в новому тимчасовому префіксі
- Після beta-публікації запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити онбординг установленого пакета, налаштування Telegram і реальний Telegram E2E
  щодо опублікованого npm-пакета з використанням спільного орендованого пулу
  облікових даних Telegram. Для локальних одноразових запусків підтримувачі можуть
  пропустити змінні Convex і передати напряму три змінні середовища
  `OPENCLAW_QA_TELEGRAM_*`.
- Підтримувачі можуть запускати ту саму перевірку після публікації з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно лише ручний і не запускається
  при кожному merge.
- Автоматизація випусків підтримувачів тепер використовує схему preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - реальна публікація в npm має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable npm-випуски за замовчуванням використовують `beta`
  - stable npm-публікація може явно націлюватися на `latest` через вхід workflow
  - зміна npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторного
    їх збирання
- Для stable-коригувальних випусків, таких як `YYYY.M.D-N`, верифікатор після публікації
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні випуски не могли непомітно залишити старі глобальні встановлення
  на базовому stable-навантаженні
- Передрелізна перевірка npm release завершується із закритою відмовою, якщо tarball не містить
  і `dist/control-ui/index.html`, і непорожнє навантаження `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню браузерну панель
- Перевірка після публікації також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні runtime-залежності вбудованих plugins у кореневому макеті
  `dist/*`. Випуск, що постачається з відсутнім або порожнім навантаженням
  залежностей вбудованих plugins, не проходить верифікатор після публікації і не може бути
  просунутий до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет `unpackedSize` для npm pack щодо
  tarball кандидата на оновлення, тож installer e2e виявляє випадкове роздування pack
  до шляху публікації випуску
- Якщо робота над випуском торкалася планування CI, маніфестів таймінгу extensions або
  матриць тестування extensions, перед погодженням згенеруйте заново та перегляньте
  виходи матриці workflow `checks-node-extensions`, якими керує planner, з `.github/workflows/ci.yml`,
  щоб примітки до випуску не описували застарілий макет CI
- Готовність stable-випуску macOS також охоплює поверхні оновлювача:
  - GitHub release має зрештою містити упаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - упакований застосунок має зберігати не-debug bundle id, непорожню
    URL-адресу стрічки Sparkle і `CFBundleVersion` на рівні не нижче за канонічний поріг
    збірки Sparkle для цієї версії випуску

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для передрелізної перевірки лише для валідації
- `preflight_only`: `true` для лише валідації/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску передрелізної перевірки
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки з секретами
  вимагають, щоб визначений коміт був досяжний з гілки OpenClaw або
  тега випуску.

Правила:

- Stable і correction теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний SHA коміту дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що й під час передрелізної перевірки;
  workflow перевіряє ці метадані до продовження публікації

## Послідовність stable npm-випуску

Під час створення stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До створення тега можна використовувати поточний повний SHA коміту гілки workflow
     для dry run передрелізного workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   тоді, коли ви навмисно хочете прямої stable-публікації
3. Запустіть `Full Release Validation` на гілці випуску, тегі випуску або повному
   SHA коміту, коли вам потрібні звичайний CI плюс покриття live prompt cache, Docker, QA Lab,
   Matrix і Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   натомість ручний workflow `CI` на ref випуску
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо випуск потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо випуск навмисно опубліковано напряму в `latest`, а `beta`
   має одразу наслідувати ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його
   запланованій self-healing синхронізації перемістити `beta` пізніше

Зміна dist-tag розміщена в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і beta-first шлях просування
задокументованими та видимими для оператора.

Якщо підтримувачу доведеться перейти на локальну npm-автентифікацію, будь-які команди
CLI 1Password (`op`) слід запускати лише в окремій сесії tmux. Не викликайте `op`
напряму з основної оболонки агента; запуск усередині tmux робить запити,
сповіщення та обробку OTP видимими й запобігає повторним сповіщенням на хості.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Підтримувачі використовують приватну документацію випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали випуску](/uk/install/development-channels)
