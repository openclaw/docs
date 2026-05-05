---
read_when:
    - Пошук визначень публічних каналів релізів
    - Запуск валідації релізу або приймання пакета
    - Шукаєте іменування версій і частоту випусків
summary: Канали випуску, контрольний список оператора, валідаційні бокси, найменування версій і каденція
title: Політика випусків
x-i18n:
    generated_at: "2026-05-05T05:04:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw має три публічні релізні гілки:

- стабільна: теговані релізи, які типово публікуються в npm `beta`, або в npm `latest` за явним запитом
- бета: передрелізні теги, які публікуються в npm `beta`
- розробницька: рухома вершина `main`

## Іменування версій

- Версія стабільного релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія стабільного виправного релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія бета-передрелізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця або дня
- `latest` означає поточний просунутий стабільний реліз npm
- `beta` означає поточну ціль встановлення бета-версії
- Стабільні та стабільні виправні релізи типово публікуються в npm `beta`; оператори релізу можуть явно вибрати `latest` або пізніше просунути перевірену бета-збірку
- Кожен стабільний реліз OpenClaw постачається разом із npm-пакетом і застосунком для macOS;
  бета-релізи зазвичай спершу перевіряють і публікують шлях npm/пакета, а
  збирання/підписування/нотаризація Mac-застосунку лишаються для стабільного релізу, якщо інше не запитано явно

## Ритм релізів

- Релізи спершу проходять через бета-версію
- Стабільний реліз виходить лише після перевірки останньої бета-версії
- Супровідники зазвичай створюють релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу й виправлення не блокували нову
  розробку в `main`
- Якщо бета-тег уже надіслано або опубліковано й він потребує виправлення, супровідники створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого бета-тега
- Детальна процедура релізу, схвалення, облікові дані та нотатки з відновлення
  доступні лише супровідникам

## Контрольний список оператора релізу

Цей контрольний список описує публічну форму релізного потоку. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і подробиці аварійного відкату залишаються в
релізному довіднику лише для супровідників.

1. Почніть із поточного `main`: отримайте останні зміни, підтвердьте, що цільовий коміт надіслано,
   і підтвердьте, що поточний CI для `main` достатньо зелений, щоб створити від нього гілку.
2. Перепишіть верхній розділ `CHANGELOG.md` з реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувачів, закомітьте, надішліть зміни й виконайте rebase/pull
   ще раз перед створенням гілки.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте протерміновану
   сумісність лише тоді, коли шлях оновлення лишається покритим, або зафіксуйте, чому її
   навмисно збережено.
4. Створіть `release/YYYY.M.D` з поточного `main`; не виконуйте звичайну релізну роботу
   безпосередньо в `main`.
5. Оновіть кожне потрібне місце з версією для запланованого тегу, запустіть
   `pnpm plugins:sync`, щоб пакети Plugin, які можна публікувати, мали спільну релізну
   версію й метадані сумісності, а потім запустіть локальну детерміновану попередню перевірку:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` і
   `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До існування тегу
   повний 40-символьний SHA релізної гілки дозволений для попередньої перевірки лише з метою валідації.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   релізної гілки, тегу або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих релізних тестових блоків: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не проходить, виправте в релізній гілці й повторно запустіть найменший невдалий
   файл, гілку перевірки, завдання workflow, профіль пакета, провайдера або allowlist моделей, що
   доводить виправлення. Повторно запускайте повну парасолькову перевірку лише тоді, коли змінена поверхня робить
   попередні докази застарілими.
9. Для бета-версії створіть тег `vYYYY.M.D-beta.N`, а потім запустіть `OpenClaw Release Publish` з
   відповідної гілки `release/YYYY.M.D`. Він перевіряє `pnpm plugins:sync:check`,
   спершу публікує всі пакети Plugin, які можна публікувати, в npm, другими публікує той самий
   набір у ClawHub як tarball-и ClawPack npm-pack, а потім просуває
   підготовлений артефакт попередньої перевірки OpenClaw npm з відповідним dist-tag. Після
   публікації запустіть приймальну перевірку пакета після публікації
   для опублікованого пакета `openclaw@YYYY.M.D-beta.N` або
   `openclaw@beta`. Якщо надісланий або опублікований передреліз потребує виправлення,
   створіть наступний відповідний номер передрелізу; не видаляйте й не переписуйте старий
   передреліз.
10. Для стабільного релізу продовжуйте лише після того, як перевірена бета-версія або release candidate матиме
    потрібні докази перевірки. Стабільна публікація npm також проходить через
    `OpenClaw Release Publish`, повторно використовуючи успішний артефакт попередньої перевірки через
    `preflight_run_id`; готовність стабільного релізу macOS також потребує
    упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого `appcast.xml` у `main`.
11. Після публікації запустіть перевірку npm після публікації, необов’язковий окремий
    Telegram E2E для опублікованого npm, коли потрібне підтвердження каналу після публікації,
    просування dist-tag за потреби, нотатки GitHub для релізу/передрелізу з
    повного відповідного розділу `CHANGELOG.md` і кроки оголошення релізу.

## Попередня перевірка релізу

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб тестовий TypeScript залишався
  покритим поза швидшим локальним шлюзом `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки циклів
  імпортів і архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  релізні артефакти `dist/*` і пакет Control UI існували для етапу перевірки
  пакування
- Запустіть `pnpm plugins:sync` після підвищення кореневої версії та перед створенням тегу. Він
  оновлює версії пакетів плагінів, доступних для публікації, метадані сумісності
  OpenClaw peer/API, метадані збірки та заготовки журналів змін плагінів, щоб вони відповідали версії
  основного релізу. `pnpm plugins:sync:check` — це немутуючий релізний захист;
  робочий процес публікації завершується помилкою до будь-якої зміни реєстру, якщо цей крок було
  забуто.
- Запустіть ручний робочий процес `Full Release Validation` перед схваленням релізу, щоб
  запустити всі передрелізні тестові бокси з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, запускає ручний `CI` і запускає
  `OpenClaw Release Checks` для перевірки встановлення, приймання пакета, міжплатформових
  перевірок пакета, паритету QA Lab, Matrix і Telegram-ліній. Стабільні/типові запуски
  тримають вичерпні live/E2E та Docker-витримку релізного шляху за
  `run_release_soak=true`; `release_profile=full` примусово вмикає витримку. З
  `release_profile=full` і `rerun_group=all` він також запускає пакетний Telegram
  E2E проти артефакту `release-package-under-test` із перевірок релізу.
  Надайте `npm_telegram_package_spec` після публікації, коли той самий
  Telegram E2E має також підтвердити опублікований npm-пакет. Надайте
  `package_acceptance_package_spec` після публікації, коли Package Acceptance
  має запускати свою матрицю пакета/оновлення проти відвантаженого npm-пакета замість
  артефакту, зібраного із SHA. Надайте
  `evidence_package_spec`, коли приватний звіт доказів має підтвердити, що
  валідація відповідає опублікованому npm-пакету, без примусового запуску Telegram E2E.
  Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запустіть ручний робочий процес `Package Acceptance`, коли потрібне побічне підтвердження
  для кандидата пакета, поки релізна робота триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб упакувати довірену гілку/тег/SHA `package_ref` з поточною
  обв’язкою `workflow_ref`; `source=url` для HTTPS-тарбола з обов’язковим
  SHA-256; або `source=artifact` для тарбола, завантаженого іншим запуском GitHub
  Actions. Робочий процес розв’язує кандидата до
  `package-under-test`, повторно використовує релізний планувальник Docker E2E проти цього
  тарбола та може запускати Telegram QA проти того самого тарбола з
  `telegram_mode=mock-openai` або `telegram_mode=live-frontier`. Коли
  вибрані Docker-лінії включають `published-upgrade-survivor`, артефакт пакета
  є кандидатом, а `published_upgrade_survivor_baseline` вибирає
  опубліковану базову версію. `update-restart-auth` використовує пакет-кандидат як
  встановлений CLI і як package-under-test, щоб перевірити керований шлях перезапуску
  команди оновлення кандидата.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Поширені профілі:
  - `smoke`: лінії встановлення/каналу/агента, мережі gateway і перезавантаження конфігурації
  - `package`: нативні для артефакту лінії пакета/оновлення/перезапуску/плагіна без OpenWebUI або live ClawHub
  - `product`: профіль пакета плюс MCP-канали, очищення cron/subagent,
    вебпошук OpenAI та OpenWebUI
  - `full`: фрагменти Docker релізного шляху з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запустіть ручний робочий процес `CI` напряму, коли потрібне лише повне звичайне CI
  покриття для релізного кандидата. Ручні запускання CI обходять змінене
  обмеження області та примусово вмикають Linux Node-шарди, шарди bundled-plugin, контракти каналів,
  сумісність Node 22, `check`, `check-additional`, перевірку збірки,
  перевірки документації, Python skills, Windows, macOS, Android і Control UI i18n
  лінії.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запустіть `pnpm qa:otel:smoke` під час валідації релізної телеметрії. Він перевіряє
  QA-lab через локальний OTLP/HTTP-приймач і підтверджує експортовані назви
  trace span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Запустіть `OpenClaw Release Publish` для мутуючої послідовності публікації після того, як
  тег існує. Запускайте його з `release/YYYY.M.D` (або `main`, коли публікуєте
  тег, досяжний з main), передайте релізний тег і успішний OpenClaw npm
  `preflight_run_id`, і залишайте типовий обсяг публікації плагінів
  `all-publishable`, якщо ви не запускаєте навмисне сфокусоване виправлення. Робочий
  процес серіалізує публікацію plugin npm, публікацію plugin ClawHub і публікацію OpenClaw
  npm, щоб основний пакет не було опубліковано перед його зовнішніми
  плагінами.
- Перевірки релізу тепер виконуються в окремому ручному робочому процесі:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає лінію QA Lab mock parity плюс швидкий
  live-профіль Matrix і лінію Telegram QA перед схваленням релізу. Live
  лінії використовують середовище `qa-live-shared`; Telegram також використовує оренди
  облікових даних Convex CI. Запустіть ручний робочий процес `QA-Lab - All Lanes` з
  `matrix_profile=all` і `matrix_shards=true`, коли потрібен повний інвентар
  транспорту Matrix, медіа та E2EE паралельно.
- Міжплатформова валідація встановлення та оновлення під час виконання є частиною публічних
  `OpenClaw Release Checks` і `Full Release Validation`, які напряму викликають
  повторно використовуваний робочий процес
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримайте реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у своїй
  власній лінії, щоб вони не затримували й не блокували публікацію
- Релізні перевірки з секретами слід запускати через `Full Release
Validation` або з ref робочого процесу `main`/release, щоб логіка робочого процесу та
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, доки
  розв’язаний коміт досяжний з гілки OpenClaw або релізного тегу
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки робочого процесу без вимоги запушеного тегу
- Цей SHA-шлях призначений лише для валідації й не може бути підвищений до реальної публікації
- У SHA-режимі робочий процес синтезує `v<package.json version>` лише для
  перевірки метаданих пакета; реальна публікація все одно потребує справжнього релізного тегу
- Обидва робочі процеси тримають справжній шлях публікації та просування на GitHub-hosted
  runner, тоді як немутуючий шлях валідації може використовувати більші
  Linux runner Blacksmith
- Цей робочий процес запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох секретів робочого процесу `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-релізу більше не чекає на окрему лінію перевірок релізу
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction тег) перед схваленням
- Після публікації npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction версію), щоб перевірити шлях встановлення з опублікованого реєстру
  у свіжому тимчасовому префіксі
- Після beta-публікації запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і справжній Telegram E2E
  проти опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Локальні одноразові запускання супровідників можуть опустити змінні Convex і передати три
  облікові дані середовища `OPENCLAW_QA_TELEGRAM_*` напряму.
- Щоб запустити повну beta-перевірку після публікації з машини супровідника, використовуйте `pnpm release:beta-smoke -- --beta betaN`. Допоміжний скрипт запускає валідацію Parallels npm update/fresh-target, запускає `NPM Telegram Beta E2E`, опитує точний запуск робочого процесу, завантажує артефакт і друкує звіт Telegram.
- Супровідники можуть запустити ту саму перевірку після публікації з GitHub Actions через
  ручний робочий процес `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається під час кожного merge.
- Автоматизація релізів супровідників тепер використовує preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальну npm-публікацію має бути запущено з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний передрелізний запуск
  - стабільні npm-релізи типово публікуються в `beta`
  - стабільна npm-публікація може явно націлюватися на `latest` через вхідні дані робочого процесу
  - мутація npm dist-tag на основі токена тепер живе в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, бо `npm dist-tag add` досі потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` є лише валідаційним; коли тег існує лише на
    релізній гілці, але робочий процес запущено з `main`, задайте
    `public_release_branch=release/YYYY.M.D`
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторної
    їх збірки
- Для стабільних корекційних релізів на кшталт `YYYY.M.D-N` післяпублікаційний верифікатор
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб корекції релізу не могли непомітно залишити старіші глобальні встановлення на
  базовому стабільному payload
- Передрелізна перевірка npm-релізу завершується закритою помилкою, якщо tarball не містить одночасно
  `dist/control-ui/index.html` і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не відвантажили порожню browser dashboard
- Післяпублікаційна верифікація також перевіряє, що опубліковані точки входу плагінів і
  метадані пакета присутні у встановленому макеті реєстру. Реліз, який
  відвантажує відсутні plugin runtime payloads, провалює postpublish verifier і
  не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет npm pack `unpackedSize` до
  tarball кандидата оновлення, тож installer e2e ловить випадкове роздуття пакета
  до шляху публікації релізу
- Якщо релізна робота торкалася планування CI, маніфестів часу розширень або
  матриць тестів розширень, згенеруйте заново й перегляньте керовані планувальником
  матричні виводи `plugin-prerelease-extension-shard` з
  `.github/workflows/plugin-prerelease.yml` перед схваленням, щоб release notes не
  описували застарілий макет CI
- Готовність стабільного macOS-релізу також включає поверхні оновлювача:
  - GitHub-реліз має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` на `main` має вказувати на новий стабільний zip після публікації
  - запакований застосунок має зберігати не-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімуму Sparkle build
    для цієї версії релізу

## Релізні тестові бокси

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні тести з
однієї точки входу. Для доказу закріпленого коміту на гілці, що швидко рухається, використовуйте
допоміжний скрипт, щоб кожен дочірній робочий процес запускався з тимчасової гілки, зафіксованої на цільовому
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Допоміжний скрипт пушить `release-ci/<sha>-...`, запускає `Full Release Validation`
з цієї гілки з `ref=<sha>`, перевіряє, що `headSha` кожного дочірнього робочого процесу
відповідає цілі, а потім видаляє тимчасову гілку. Це запобігає випадковому підтвердженню
новішого дочірнього запуску `main`.

Для валідації релізної гілки або тегу запускайте її з довіреного ref робочого процесу `main`
і передавайте релізну гілку або тег як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow визначає цільовий ref, запускає ручний `CI` з
`target_ref=<release-ref>`, запускає `OpenClaw Release Checks`, готує
батьківський артефакт `release-package-under-test` для перевірок, пов’язаних із
пакетом, і запускає автономний пакетний Telegram E2E, коли `release_profile=full` з
`rerun_group=all` або коли задано `npm_telegram_package_spec`. Після цього `OpenClaw Release
Checks` розгалужується на install smoke, міжплатформні release checks, live/E2E Docker
покриття шляху релізу, коли ввімкнено soak, Package Acceptance з Telegram
package QA, паритет QA Lab, live Matrix і live Telegram. Повний запуск прийнятний лише тоді, коли
зведення `Full Release Validation`
показує `normal_ci` і `release_checks` як успішні. У режимі full/all
дочірній `npm_telegram` також має бути успішним; поза full/all його пропускають,
якщо не було надано опублікований `npm_telegram_package_spec`. Фінальне
зведення verifier містить таблиці найповільніших завдань для кожного дочірнього запуску, щоб release
manager міг бачити поточний критичний шлях без завантаження логів.
Див. [Повна валідація релізу](/uk/reference/full-release-validation), щоб отримати
повну матрицю етапів, точні назви завдань workflow, відмінності між профілями stable і full,
артефакти та ручки для фокусованих повторних запусків.
Дочірні workflows запускаються з довіреного ref, який виконує `Full Release
Validation`, зазвичай `--ref main`, навіть коли цільовий `ref` вказує на
старішу release-гілку або тег. Окремого workflow-ref input для Full Release Validation
немає; вибирайте довірений harness, вибираючи ref запуску workflow.
Не використовуйте `--ref main -f ref=<sha>` для доказу точного коміту на рухомому `main`;
сирі commit SHA не можуть бути workflow dispatch refs, тому використовуйте
`pnpm ci:full-release --sha <sha>`, щоб створити закріплену тимчасову гілку.

Використовуйте `release_profile`, щоб вибрати ширину live/provider:

- `minimum`: найшвидший release-critical OpenAI/core live і Docker шлях
- `stable`: minimum плюс stable provider/backend покриття для схвалення релізу
- `full`: stable плюс широке advisory provider/media покриття

Використовуйте `run_release_soak=true` зі `stable`, коли release-blocking lanes
зелені й потрібен вичерпний live/E2E, Docker шлях релізу та
обмежений sweep published upgrade-survivor перед просуванням. Цей sweep охоплює
останні чотири stable пакети плюс закріплені базові версії `2026.4.23` і `2026.5.2`
плюс старіше покриття `2026.4.15`, з видаленням дубльованих baseline і
шардуванням кожної baseline в окреме завдання Docker runner. `full` передбачає
`run_release_soak=true`.

`OpenClaw Release Checks` використовує довірений workflow ref, щоб один раз визначити цільовий
ref як `release-package-under-test`, і повторно використовує цей артефакт у cross-OS,
Package Acceptance і release-path Docker перевірках, коли виконується soak. Це утримує
всі package-facing boxes на тих самих байтах і уникає повторних збірок пакетів.
Cross-OS OpenAI install smoke використовує `OPENCLAW_CROSS_OS_OPENAI_MODEL`, коли
задано змінну repo/org, інакше `openai/gpt-5.4`, оскільки ця lane
доводить встановлення пакета, onboarding, запуск Gateway і один live agent turn,
а не вимірює найповільнішу модель за замовчуванням. Ширша live provider
matrix залишається місцем для model-specific покриття.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну umbrella як перший повторний запуск після фокусованого виправлення. Якщо один box
падає, використовуйте невдалий дочірній workflow, job, Docker lane, package profile, model
provider або QA lane для наступного доказу. Запускайте повну umbrella знову лише тоді, коли
виправлення змінило спільну release orchestration або зробило попередні all-box докази
застарілими. Фінальний verifier umbrella повторно перевіряє записані child workflow run
ids, тому після успішного повторного запуску child workflow перезапустіть лише невдале
батьківське завдання `Verify full validation`.

Для обмеженого відновлення передайте `rerun_group` до umbrella. `all` — це справжній
запуск release-candidate, `ci` запускає лише звичайний дочірній CI, `plugin-prerelease`
запускає лише release-only дочірній Plugin, `release-checks` запускає кожен release
box, а вужчі release groups — це `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` і `npm-telegram`.
Фокусовані повторні запуски `npm-telegram` потребують `npm_telegram_package_spec`; запуски full/all
з `release_profile=full` використовують артефакт пакета release-checks. Фокусовані
cross-OS повторні запуски можуть додати `cross_os_suite_filter=windows/packaged-upgrade` або
інший OS/suite filter. Помилки QA release-check є advisory; помилка лише в QA
не блокує валідацію релізу.

### Vitest

Vitest box — це ручний дочірній workflow `CI`. Manual CI навмисно
обходить changed scoping і примусово запускає звичайний test graph для release
candidate: Linux Node shards, bundled-Plugin shards, channel contracts, сумісність Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android і Control UI i18n.

Використовуйте цей box, щоб відповісти на питання: «чи пройшло дерево вихідного коду повний звичайний набір тестів?»
Це не те саме, що release-path product validation. Докази, які слід зберегти:

- зведення `Full Release Validation`, що показує URL запущеного `CI` run
- зелений `CI` run на точному цільовому SHA
- назви невдалих або повільних shards із CI jobs під час розслідування регресій
- артефакти таймінгів Vitest, як-от `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте manual CI напряму лише тоді, коли релізу потрібен детермінований normal CI, але
не потрібні Docker, QA Lab, live, cross-OS або package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box живе в `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, плюс release-mode
workflow `install-smoke`. Він перевіряє release candidate через packaged
Docker environments, а не лише source-level tests.

Release Docker coverage включає:

- повний install smoke з увімкненим повільним Bun global install smoke
- підготовку/повторне використання root Dockerfile smoke image за target SHA, з QR,
  root/Gateway і installer/Bun smoke jobs, що виконуються як окремі install-smoke
  shards
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` і `plugins-runtime-install-h`
- покриття OpenWebUI всередині chunk `plugins-runtime-services`, коли його запитано
- розділені bundled Plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` through
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites і Docker live model coverage, коли release checks
  включають live suites

Використовуйте Docker artifacts перед повторним запуском. Release-path scheduler завантажує
`.artifacts/docker-tests/` з lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON і командами повторного запуску. Для фокусованого відновлення
використовуйте `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow замість
повторного запуску всіх release chunks. Згенеровані команди повторного запуску включають попередній
`package_artifact_run_id` і підготовлені Docker image inputs, коли вони доступні, тож
невдала lane може повторно використати той самий tarball і GHCR images.

### QA Lab

QA Lab box також є частиною `OpenClaw Release Checks`. Це agentic
behavior і channel-level release gate, окремий від механіки пакетів Vitest і Docker.

Release QA Lab coverage включає:

- mock parity lane, що порівнює candidate lane OpenAI з baseline Opus 4.6
  за допомогою agentic parity pack
- fast live Matrix QA profile, що використовує середовище `qa-live-shared`
- live Telegram QA lane, що використовує Convex CI credential leases
- `pnpm qa:otel:smoke`, коли release telemetry потребує явного локального доказу

Використовуйте цей box, щоб відповісти на питання: «чи реліз поводиться правильно у QA scenarios і
live channel flows?» Зберігайте artifact URLs для parity, Matrix і Telegram
lanes під час схвалення релізу. Повне Matrix coverage залишається доступним як
ручний sharded QA-Lab run, а не як стандартна release-critical lane.

### Пакет

Package box — це installable-product gate. Він спирається на
`Package Acceptance` і resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver нормалізує
candidate у tarball `package-under-test`, який споживає Docker E2E, перевіряє
package inventory, записує package version і SHA-256, а також тримає
workflow harness ref окремо від package source ref.

Підтримувані candidate sources:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна OpenClaw release
  version
- `source=ref`: упакувати довірену `package_ref` гілку, тег або повний commit SHA
  з вибраним `workflow_ref` harness
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим GitHub Actions run

`OpenClaw Release Checks` запускає Package Acceptance із `source=artifact`,
підготовленим release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance утримує migration, update,
configured-auth update restart, stale Plugin dependency cleanup, offline Plugin
fixtures, Plugin update і Telegram package QA на одному й тому самому resolved
tarball. Blocking release checks використовують стандартну latest published package
baseline; `run_release_soak=true` або
`release_profile=full` розширює це до кожної stable npm-published baseline від
`2026.4.23` до `latest` плюс reported-issue fixtures. Використовуйте
Package Acceptance із `source=npm` для вже випущеного candidate або
`source=ref`/`source=artifact` для SHA-backed local npm tarball перед
публікацією. Це GitHub-native
заміна більшості package/update покриття, яке раніше потребувало
Parallels. Cross-OS release checks досі важливі для OS-specific onboarding,
installer і platform behavior, але package/update product validation має
віддавати перевагу Package Acceptance.

Канонічний checklist для update і Plugin validation —
[Тестування оновлень і Plugins](/uk/help/testing-updates-plugins). Використовуйте його, коли
вирішуєте, яка local, Docker, Package Acceptance або release-check lane доводить
зміну Plugin install/update, doctor cleanup або published-package migration.
Вичерпна published update migration з кожного stable пакета `2026.4.23+` є
окремим ручним workflow `Update Migration`, а не частиною Full Release CI.

Застаріла поблажливість приймання пакетів навмисно обмежена в часі. Пакети до
`2026.4.25` включно можуть використовувати шлях сумісності для прогалин у метаданих, уже опублікованих
в npm: приватні записи інвентарю QA, відсутні в tarball, відсутній
`gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball,
відсутній збережений `update.channel`, застарілі розташування записів установлення Plugin,
відсутнє збереження записів установлення marketplace, а також міграція метаданих конфігурації
під час `plugins update`. Опублікований пакет `2026.4.26` може попереджати
про локальні файли штампів метаданих збірки, які вже були поставлені. Пізніші пакети
мають задовольняти сучасні контракти пакетів; ті самі прогалини провалюють
валідацію релізу.

Використовуйте ширші профілі приймання пакетів, коли питання релізу стосується
фактичного встановлюваного пакета:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Поширені профілі пакетів:

- `smoke`: швидкі lanes установлення пакета/каналу/агента, мережі Gateway і
  перезавантаження конфігурації
- `package`: контракти пакета install/update/restart/plugin без live
  ClawHub; це стандарт для перевірки релізу
- `product`: `package` плюс канали MCP, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: фрагменти release-path Docker з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для package-candidate доказу Telegram увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у прийманні пакетів. Workflow передає
розв’язаний tarball `package-under-test` у lane Telegram; окремий
workflow Telegram усе ще приймає опубліковану npm-специфікацію для post-publish перевірок.

## Автоматизація публікації релізу

`OpenClaw Release Publish` є звичайною змінювальною точкою входу для публікації. Вона
оркеструє trusted-publisher workflows у порядку, потрібному релізу:

1. Перевірити release tag і розв’язати його commit SHA.
2. Переконатися, що tag досяжний із `main` або `release/*`.
3. Запустити `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` з `publish_scope=all-publishable` і
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` з тим самим scope і SHA.
6. Dispatch `OpenClaw NPM Release` з release tag, npm dist-tag і
   збереженим `preflight_run_id`.

Приклад публікації beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільна публікація до стандартного beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Стабільне просування безпосередньо до `latest` є явним:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Використовуйте нижчерівневі workflows `Plugin NPM Release` і `Plugin ClawHub Release`
лише для сфокусованого виправлення або повторної публікації. Для виправлення вибраного Plugin передайте
`plugin_publish_scope=selected` і `plugins=@openclaw/name` до
`OpenClaw Release Publish`, або запускайте дочірній workflow напряму, коли
пакет OpenClaw не потрібно публікувати.

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий release tag, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для validation-only preflight
- `preflight_only`: `true` для лише валідації/збірки/пакування, `false` для
  справжнього шляху публікації
- `preflight_run_id`: обов’язковий на справжньому шляху публікації, щоб workflow повторно використовував
  підготовлений tarball з успішного preflight-запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Publish` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий release tag; має вже існувати
- `preflight_run_id`: id успішного preflight-запуску `OpenClaw NPM Release`;
  обов’язковий, коли `publish_openclaw_npm=true`
- `npm_dist_tag`: цільовий npm-тег для пакета OpenClaw
- `plugin_publish_scope`: за замовчуванням `all-publishable`; використовуйте `selected` лише
  для сфокусованих виправлень
- `plugins`: розділені комами назви пакетів `@openclaw/*`, коли
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: за замовчуванням `true`; установлюйте `false` лише коли використовуєте
  workflow як оркестратор виправлення тільки для Plugin

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, tag або повний commit SHA для валідації. Перевірки з секретами
  вимагають, щоб розв’язаний commit був досяжний з гілки OpenClaw або
  release tag.
- `run_release_soak`: opt in до вичерпного live/E2E, Docker release-path і
  all-since upgrade-survivor soak на стабільних/стандартних перевірках релізу. Це примусово
  вмикається через `release_profile=full`.

Правила:

- Стабільні та корекційні теги можуть публікуватися або до `beta`, або до `latest`
- Beta prerelease теги можуть публікуватися лише до `beta`
- Для `OpenClaw NPM Release` введення повного commit SHA дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди є
  лише валідаційними
- Справжній шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані, перш ніж продовжити публікацію

## Послідовність стабільного npm-релізу

Коли готуєте стабільний npm-реліз:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Перш ніж tag існує, можна використати поточний повний commit SHA гілки workflow
     для validation-only dry run preflight workflow
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   коли ви навмисно хочете пряму стабільну публікацію
3. Запустіть `Full Release Validation` на release branch, release tag або повному
   commit SHA, коли вам потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і покриття Telegram з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестів, запустіть
   ручний workflow `CI` на release ref натомість
5. Збережіть успішний `preflight_run_id`
6. Запустіть `OpenClaw Release Publish` з тим самим `tag`, тим самим `npm_dist_tag`
   і збереженим `preflight_run_id`; він публікує externalized plugins до npm
   і ClawHub перед просуванням npm-пакета OpenClaw
7. Якщо реліз потрапив до `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю стабільну версію з `beta` до `latest`
8. Якщо реліз навмисно опубліковано безпосередньо до `latest`, а `beta`
   має негайно наслідувати ту саму стабільну збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на стабільну версію, або дозвольте його запланованій
   self-healing синхронізації перемістити `beta` пізніше

Мутація dist-tag живе в приватному репозиторії з міркувань безпеки, бо вона все ще
вимагає `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це залишає як шлях прямої публікації, так і шлях beta-first просування
задокументованими й видимими для оператора.

Якщо maintainer змушений повернутися до локальної npm-автентифікації, запускайте будь-які команди 1Password
CLI (`op`) лише всередині виділеної сесії tmux. Не викликайте `op`
напряму з основної оболонки агента; утримання його всередині tmux робить prompts,
alerts і обробку OTP спостережуваними та запобігає повторним alerts хоста.

## Публічні посилання

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
для фактичного runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
