---
read_when:
    - Шукаю визначення публічних каналів випусків
    - Шукаю назви версій і періодичність
summary: Публічні канали випусків, назви версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-27T00:40:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32ec1b74f2f3277bdf92da1874625064d09f21245d99b64c183a8bd08f6d4e4a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні канали випусків:

- stable: позначені тегами випуски, які типово публікуються в npm як `beta`, або в npm як `latest`, якщо це явно запрошено
- beta: пререлізні теги, які публікуються в npm як `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-пререлізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний підвищений stable-випуск npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні випуски типово публікуються в npm як `beta`; оператори випуску можуть явно націлити `latest` або пізніше підвищити перевірену beta-збірку
- Кожен stable-випуск OpenClaw постачається разом як npm-пакет і застосунок macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збірка/підпис/нотаризація macOS-застосунку зарезервовані для stable, якщо
  інше не запрошено явно

## Періодичність випусків

- Випуски спочатку проходять через beta
- Stable іде лише після перевірки найновішої beta
- Зазвичай мейнтейнери нарізають випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано і він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, погодження, облікові дані та примітки з
  відновлення доступні лише для мейнтейнерів

## Передстартова перевірка випуску

- Запускайте `pnpm check:test-types` перед передстартовою перевіркою випуску, щоб
  тестовий TypeScript залишався покритим поза швидшим локальним шлюзом `pnpm check`
- Запускайте `pnpm check:architecture` перед передстартовою перевіркою випуску, щоб
  ширші перевірки циклів імпорту та меж архітектури були зеленими поза швидшим локальним шлюзом
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і пакет Control UI існували для кроку
  перевірки pack
- Запускайте ручний воркфлоу `CI` перед погодженням випуску, коли потрібне повне
  стандартне покриття CI для кандидата на випуск. Ручні запуски CI обходять
  changed-scoping і примусово вмикають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність з Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android і канали i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час перевірки телеметрії випуску. Це проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace span,
  обмежені атрибути та редагування вмісту/ідентифікаторів без потреби в
  Opik, Langfuse чи іншому зовнішньому збирачі.
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер запускаються в окремому ручному воркфлоу:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає QA Lab mock parity gate, а також live
  канали QA для Matrix і Telegram перед погодженням випуску. Live-канали використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Кросплатформна перевірка встановлення та оновлення під час виконання запускається з
  приватного caller-воркфлоу
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний воркфлоу
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: зберігати реальний шлях npm-випуску коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному каналі, щоб не затримувати і не блокувати публікацію
- Перевірки випуску потрібно запускати з ref воркфлоу `main` або з
  ref воркфлоу `release/YYYY.M.D`, щоб логіка воркфлоу і секрети залишалися під контролем
- Цей воркфлоу приймає або наявний тег випуску, або поточний повний 40-символьний commit SHA гілки воркфлоу
- У режимі commit-SHA він приймає лише поточний HEAD гілки воркфлоу; для старіших
  commit випуску використовуйте тег випуску
- Передстартова перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний commit SHA гілки воркфлоу без вимоги запушеного тега
- Цей шлях SHA призначений лише для валідації і не може бути підвищений до реальної публікації
- У режимі SHA воркфлоу синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно потребує реального тега випуску
- Обидва воркфлоу залишають реальний шлях публікації та підвищення на GitHub-hosted
  runner-ах, тоді як немутувальний шлях валідації може використовувати більші
  Blacksmith Linux runner-и
- Цей воркфлоу запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва секрети воркфлоу `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передстартова перевірка npm-випуску більше не чекає на окремий канал перевірок випуску
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед погодженням
- Після npm-публікації запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з
  опублікованого реєстру в новому тимчасовому префіксі
- Після beta-публікації запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити онбординг встановленого пакета, налаштування Telegram і реальний Telegram E2E
  для опублікованого npm-пакета, використовуючи спільний пул орендованих Telegram-облікових даних.
  Для локальних одноразових запусків мейнтейнера можна опустити змінні Convex і передати
  безпосередньо три облікові дані env `OPENCLAW_QA_TELEGRAM_*`.
- Мейнтейнери можуть запускати ту саму післяпублікаційну перевірку з GitHub Actions через
  ручний воркфлоу `NPM Telegram Beta E2E`. Він навмисно лише ручний і не запускається при кожному merge.
- Автоматизація випусків для мейнтейнерів тепер використовує модель preflight-then-promote:
  - реальна npm-публікація повинна пройти успішний npm `preflight_run_id`
  - реальна npm-публікація повинна запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight-run
  - stable npm-випуски типово націлюються на `beta`
  - stable npm-публікацію можна явно націлити на `latest` через вхідні дані воркфлоу
  - мутація npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація повинна пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації підвищують уже підготовлені артефакти замість їх повторного збирання
- Для stable-коригувальних випусків на кшталт `YYYY.M.D-N` післяпублікаційний верифікатор
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригування випуску не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-пакеті
- Передстартова перевірка npm-випуску завершується із забороною за замовчуванням, якщо tarball не містить
  одночасно `dist/control-ui/index.html` і непорожнє навантаження `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню панель браузера
- Післяпублікаційна перевірка також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні bundled plugin runtime dependencies у кореневому
  макеті `dist/*`. Випуск, що постачається з відсутнім або порожнім навантаженням
  залежностей bundled plugin, не проходить postpublish verifier і не може бути підвищений
  до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет `unpackedSize` для npm pack
  на candidate update tarball, тож installer e2e виявляє випадкове роздування pack
  до шляху публікації випуску
- Якщо робота над випуском торкалася планування CI, маніфестів таймінгу extensions або
  матриць тестів extensions, перед погодженням згенеруйте й перегляньте керовані planner-ом
  виходи матриці воркфлоу `checks-node-extensions` з `.github/workflows/ci.yml`,
  щоб примітки до випуску не описували застарілий макет CI
- Готовність stable-випуску macOS також включає поверхні оновлювача:
  - GitHub-випуск зрештою повинен містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації повинен вказувати на новий stable zip
  - запакований застосунок повинен зберігати bundle id не для debug, непорожню
    Sparkle feed URL і `CFBundleVersion`, не нижчий за канонічний поріг збірки Sparkle
    для цієї версії випуску

## Вхідні дані воркфлоу NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1`, або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки воркфлоу для передстартової перевірки лише для валідації
- `preflight_only`: `true` для лише валідації/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий для реального шляху публікації, щоб воркфлоу повторно використав
  підготовлений tarball з успішного передстартового запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типове значення — `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: наявний тег випуску або поточний повний 40-символьний commit
  SHA `main` для валідації при запуску з `main`; з гілки випуску використовуйте
  наявний тег випуску або поточний повний 40-символьний commit SHA гілки випуску

Правила:

- Stable і correction теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди призначений лише для валідації і також приймає
  поточний commit SHA гілки воркфлоу
- Режим commit-SHA для перевірок випуску також вимагає поточний HEAD гілки воркфлоу
- Реальний шлях публікації повинен використовувати той самий `npm_dist_tag`, що й під час передстартової перевірки;
  воркфлоу перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-випуску

Під час створення stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використати поточний повний commit
     SHA гілки воркфлоу для dry-run передстартового воркфлоу лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first процесу або `latest` лише
   коли ви свідомо хочете прямої stable-публікації
3. Запустіть ручний воркфлоу `CI` на ref випуску, коли хочете повне стандартне покриття CI
   замість розумного scoped merge-покриття
4. Окремо запустіть `OpenClaw Release Checks` з тим самим тегом або
   повним поточним commit SHA гілки воркфлоу, коли хочете live-покриття prompt cache,
   QA Lab parity, Matrix і Telegram
   - Це окремо навмисно, щоб live-покриття залишалося доступним без
     повторного зв’язування довгих або нестабільних перевірок із воркфлоу публікації
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо випуск потрапив у `beta`, використайте приватний
   воркфлоу `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю stable-версію з `beta` до `latest`
8. Якщо випуск навмисно був одразу опублікований у `latest`, а `beta`
   має відразу наслідувати ту саму stable-збірку, використайте той самий приватний
   воркфлоу, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його запланованій
   self-healing синхронізації оновити `beta` пізніше

Мутація dist-tag розміщена в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і beta-first шлях підвищення одночасно
задокументованими та видимими для оператора.

Якщо мейнтейнеру доводиться перейти до локальної npm-автентифікації, запускайте будь-які команди
1Password CLI (`op`) лише всередині окремої tmux-сесії. Не викликайте `op`
безпосередньо з основної оболонки агента; запуск усередині tmux робить запити,
сповіщення та обробку OTP видимими й запобігає повторним сповіщенням на хості.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують приватну документацію випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
