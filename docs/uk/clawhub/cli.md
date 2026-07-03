---
read_when:
    - Використання CLI ClawHub
    - Налагодження встановлення, оновлення або публікування
summary: 'Довідник CLI: команди, прапорці, конфігурація та поведінка файла блокування.'
x-i18n:
    generated_at: "2026-07-03T09:56:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Пакет CLI: `clawhub`, виконуваний файл: `clawhub`.

Встановіть його глобально за допомогою npm або pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Потім перевірте його:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Глобальні прапорці

- `--workdir <dir>`: робочий каталог (типово: cwd; повертається до робочого простору Clawdbot, якщо налаштовано)
- `--dir <dir>`: каталог встановлення у workdir (типово: `skills`)
- `--site <url>`: базова URL-адреса для входу через браузер (типово: `https://clawhub.ai`)
- `--registry <url>`: базова URL-адреса API (типово: виявлена, інакше `https://clawhub.ai`)
- `--no-input`: вимкнути запити

Еквіваленти змінних середовища:

- `CLAWHUB_SITE` (застарілий `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (застарілий `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (застарілий `CLAWDHUB_WORKDIR`)

### HTTP-проксі

CLI враховує стандартні змінні середовища HTTP-проксі для систем за
корпоративними проксі або в обмежених мережах:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Коли задано будь-яку з цих змінних, CLI спрямовує вихідні запити через
указаний проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується, щоб обійти проксі для
певних хостів або доменів.

Це потрібно в системах, де прямі вихідні з'єднання заблоковані
(наприклад, Docker-контейнери, Hetzner VPS з інтернетом лише через проксі,
корпоративні брандмауери).

Приклад:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Коли жодна змінна проксі не задана, поведінка не змінюється (прямі з'єднання).

## Файл конфігурації

Зберігає ваш API-токен + кешовану URL-адресу реєстру.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` або `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Застарілий резервний шлях: якщо `clawhub/config.json` ще не існує, але `clawdhub/config.json` існує, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застарілий `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- Типово: відкриває браузер на `<site>/cli/auth` і завершує через callback local loopback.
- Без графічного інтерфейсу: `clawhub login --token clh_...`
- Віддалений/безголовий інтерактивний режим: `clawhub login --device` виводить код і чекає, поки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `token`

- Виводить збережений API-токен у stdout.
- Корисно для передавання локального токена входу в команди налаштування секретів CI через pipe.

### `star <skill>` / `unstar <skill>`

- Додає/видаляє skill з ваших виділених.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Вивід містить slug skill, handle власника, відображувану назву та оцінку релевантності.
- Пошук віддає перевагу точним збігам токенів slug/назви перед популярністю завантажень. Окремий токен slug, як-от `map`, збігається з `personal-map` сильніше, ніж підрядок усередині `amap`.
- Популярність є невеликим попереднім фактором ранжування, а не гарантією верхньої позиції.
- Якщо skill має з'являтися, але не з'являється, виконайте `clawhub inspect @owner/slug` після входу, щоб перевірити видимі власнику діагностики модерації перед перейменуванням метаданих.

### `explore`

- Показує найновіші skills через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` desc).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|rating|downloads|trending` (типово: newest). Застарілі псевдоніми сортування встановлення все ще працюють для сумісності.
  - `--json` (машиночитний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізається до 50 символів).

### `inspect @owner/slug`

- Отримує метадані skill і файли версії без встановлення.
- `--version <version>`: перевірити конкретну версію (типово: latest).
- `--tag <tag>`: перевірити позначену тегом версію (наприклад, `latest`).
- `--versions`: показати історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для показу (1-200).
- `--files`: показати файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машиночитний вивід.

### `install @owner/slug`

- Визначає найновішу версію для вказаного власника та skill.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені skills; спочатку виконайте `clawhub unpin <skill>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застарілий `.clawdhub`)

### `uninstall <skill>`

- Видаляє `<workdir>/<dir>/<slug>` і видаляє запис lockfile.
- Надсилає телеметрію за принципом best-effort під час входу, щоб поточні лічильники встановлень можна було
  деактивувати.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): вимагає `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`).
- Показує `pinned` поруч зі skills, замороженими за допомогою `clawhub pin`, включно з необов'язковою причиною.

### `pin <skill>`

- Позначає встановлений skill як закріплений у lockfile.
- `--reason <text>` записує, чому skill заморожено.
- Закріплені skills пропускаються `update --all` і відхиляються прямим `update <skill>`.
- Закріплені skills також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <skill>`

- Видаляє закріплення lockfile зі встановленого skill, щоб майбутні оновлення могли його змінювати.

### `update [@owner/slug]` / `update --all`

- Обчислює fingerprint із локальних файлів.
- Якщо fingerprint збігається з відомою версією: без запиту.
- Якщо fingerprint не збігається:
  - типово відмовляється
  - перезаписує з `--force` (або за запитом, якщо інтерактивно)
- Закріплені skills ніколи не оновлюються через `--force`.
- `update <skill>` швидко завершується помилкою для закріплених skills і підказує спочатку виконати `clawhub unpin <skill>`.
- `update --all` пропускає закріплені slugs і виводить підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Порівнює fingerprint локального bundle з ClawHub і завершується успішно, коли
  вміст уже опубліковано.
- Нові skills типово отримують `1.0.0`; змінені skills типово отримують наступну patch
  версію.
- `--version <version>` явно вибирає версію та публікує навіть тоді, коли
  вміст збігається з наявною версією.
- `--dry-run` визначає публікацію без завантаження; `--json` виводить
  машиночитний результат.
- `--owner <handle>` публікує під handle видавця org/user, коли
  actor має доступ видавця.
- `--migrate-owner` переміщує наявний skill до `--owner` під час публікації нової
  версії. Потрібен доступ admin/owner для обох видавців.
- Поведінку власника та перевірки пояснено в `docs/publishing.md`.
- Публікація skill означає, що його випущено під `MIT-0` на ClawHub.
- Опубліковані skills можна безкоштовно використовувати, змінювати та повторно поширювати без зазначення авторства.
- ClawHub не підтримує платні skills або ціноутворення для окремих skills.
- Застарілий псевдонім: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Багаторазовий workflow ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
викликає `skill publish` для одного `skill_path` або для кожної безпосередньої папки skill
під `root` (типово: `skills`). Він пропускає незмінені skills і використовує
таку саму автоматичну поведінку patch-версії.

Установіть `dry_run: true`, щоб переглянути без токена. Реальні публікації потребують
секрету `clawhub_token`.

### `sync`

- Сканує поточний workdir, налаштований каталог skills і будь-які
  папки `--root <dir>` на наявність локальних папок skill, що містять `SKILL.md` або
  `skill.md`.
- Порівнює fingerprint кожного локального skill з ClawHub і публікує лише нові або
  змінені skills.
- Нові skills публікуються як `1.0.0`; змінені skills типово публікуються з наступною patch-версією.
  Використовуйте `--bump minor|major` для пакетів оновлень, які мають перейти на
  більший крок semver.
- `--dry-run` показує план публікації без завантаження; `--json` виводить
  машиночитний план.
- `--all` публікує кожен новий або змінений skill без запиту. Без
  `--all` інтерактивні термінали дають змогу вибрати skills для публікації.
- `--owner <handle>` публікує під handle видавця org/user, коли
  actor має доступ видавця.
- `sync` є лише односторонньою публікацією. Він не встановлює, не оновлює, не завантажує та не
  повідомляє телеметрію встановлень/завантажень.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Вимагає `clawhub login`.
- Запускає ClawHub ClawScan через `POST /api/v1/skills/-/scan`, потім опитує, доки сканування не стане термінальним.
- Сканування асинхронні та можуть потребувати часу для завершення. Поки вони в черзі, спінер термінала показує поточну пріоритезовану позицію сканування та скільки сканувань попереду.
- Опубліковані сканування потребують доступу власника або керування видавцем. Модератори/admins можуть використовувати той самий бекенд через `clawhub-admin`.
- `--update` чинний лише з `--slug`; він записує успішні результати опублікованого сканування назад до вибраної версії.
- `--output <file.zip>` завантажує повний архів звіту з `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.
- `--json` виводить повну відповідь опитування для автоматизації.
- Сканування локальних шляхів більше не підтримуються. Завантажте нову версію, потім використайте `scan download`, щоб отримати збережені результати сканування для цієї поданої версії.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Вимагає `clawhub login`.
- Завантажує збережений ZIP-звіт сканування для поданої версії skill або plugin, включно з версіями, які були заблоковані або приховані перевірками безпеки ClawHub.
- Завантаження skill використовують slug skill і типово мають `--kind skill`.
- Завантаження plugin використовують назву пакета та потребують `--kind plugin`.
- `--version` обов'язковий, щоб автори перевірили точну подану версію, яку ClawHub заблокував.
- `--output <file.zip>` вибирає шлях призначення.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub постачає офіційний багаторазовий workflow за адресою
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml)
для репозиторіїв skills і репозиторіїв каталогів.

Типове налаштування каталогу:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Примітки:

- `root` типово має значення `skills` для репозиторіїв каталогів.
- Передайте `skill_path: skills/review-helper`, щоб обробити одну папку skill.
- `owner` відповідає прапорцю CLI `--owner`; пропустіть його, щоб публікувати як автентифікований користувач.
- Публікація skills V1 використовує `clawhub_token`; довірена публікація GitHub OIDC наразі доступна лише для пакетів.

### `delete <skill>`

- Без `--version` м’яко видаляє skill (власник, модератор або адміністратор).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда виводить час завершення резервування.
- `--version <version>` остаточно видаляє одну належну вам не найновішу версію через fail-closed,
  специфічний для версії маршрут.
  Видалені версії не можна відновити або опублікувати повторно. Опублікуйте заміну перед видаленням
  поточної найновішої версії. Працівники платформи не обходять право власності для цього потоку лише для версій.
- `--reason <text>` записує примітку модерації для м’якого видалення всього skill та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <skill>`

- Відновлює прихований skill (власник, модератор або адміністратор).
- Відновлення версії не передбачено; остаточно видалені версії не можна відновити.
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує примітку модерації для skill та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <skill>`

- Приховує skill (власник, модератор або адміністратор).
- Псевдонім для `delete`.

### `unhide <skill>`

- Скасовує приховування skill (власник, модератор або адміністратор).
- Псевдонім для `undelete`.

### `skill rename <skill> <new-name>`

- Перейменовує належний вам skill і зберігає попередній slug як псевдонім перенаправлення.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source> <target>`

- Об’єднує один належний вам skill з іншим належним вам skill.
- Вихідний slug перестає відображатися публічно й стає псевдонімом перенаправлення до цільового.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Робочий процес передавання права власності.
- Передавання на дескриптори користувачів створює запит в очікуванні, який одержувач приймає.
- Передавання на дескриптори організацій/видавців застосовується негайно лише тоді, коли виконавець має
  адміністративний доступ і до поточного власника, і до цільового видавця.
- Підкоманди:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Кінцеві точки:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Переглядає або шукає в уніфікованому каталозі пакетів через `GET /api/v1/packages` і `GET /api/v1/packages/search`.
- Використовуйте це для plugins та інших записів сімейства пакетів; `search` верхнього рівня залишається поверхнею пошуку skill.
- Прапорці:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, типово: 25)
  - `--json`

Приклади:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Отримує метадані пакета без встановлення.
- Використовуйте це для метаданих plugin, сумісності, перевірки, джерела та перегляду версій/файлів.
- `--version <version>`: перевірити конкретну версію (типово: latest).
- `--tag <tag>`: перевірити версію з тегом (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; обмеження 200 КБ).
- `--json`: машинозчитуваний вивід.

### `package download <name>`

- Визначає версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує артефакт із `downloadUrl` резолвера.
- Перевіряє ClawHub SHA-256 для всіх артефактів.
- Для артефактів ClawPack npm-pack також перевіряє цілісність npm `sha512`,
  npm shasum і назву/версію `package.json` архіву tarball.
- Застарілі ZIP-версії завантажуються через застарілий ZIP-маршрут.
- Прапорці:
  - `--version <version>`: завантажити конкретну версію.
  - `--tag <tag>`: завантажити версію з тегом (типово: `latest`).
  - `-o, --output <path>`: вихідний файл або каталог.
  - `--force`: перезаписати наявний вихідний файл.
  - `--json`: машинозчитуваний вивід.

Приклади:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Обчислює ClawHub SHA-256, цілісність npm `sha512` і npm shasum для локального
  артефакту.
- З `--package` визначає очікувані метадані з ClawHub і порівнює
  локальний файл із метаданими опублікованого артефакту.
- З прямими прапорцями дайджесту перевіряє без мережевого запиту.
- Прапорці:
  - `--package <name>`: назва пакета для визначення очікуваних метаданих артефакту.
  - `--version <version>` або `--tag <tag>`: очікувана версія пакета.
  - `--sha256 <hex>`: очікуваний ClawHub SHA-256.
  - `--npm-integrity <sri>`: очікувана цілісність npm.
  - `--npm-shasum <sha1>`: очікуваний npm shasum.
  - `--json`: машинозчитуваний вивід.

Приклади:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Запускає вбудований у ClawHub CLI Plugin Inspector для локальної папки пакета plugin.
- За замовчуванням виконує офлайн/статичну валідацію без пошуку або імпорту локального
  checkout OpenClaw.
- Критичні помилки сумісності завершуються ненульовим кодом. Попередження лише виводяться, але
  завершуються нульовим кодом.
- Прапорці:
  - `--out <dir>`: записати звіти Plugin Inspector у цей каталог.
  - `--openclaw <path>`: перевіряти щодо явного локального checkout OpenClaw.
  - `--runtime`: увімкнути захоплення виконання; імпортує код plugin.
  - `--allow-execute`: дозволити захоплення виконання в ізольованому робочому просторі.
  - `--no-mock-sdk`: вимкнути імітований OpenClaw SDK під час захоплення виконання.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package validate ./example-plugin
```

Якщо валідація повідомляє про знахідку пакета, маніфесту, імпорту SDK або артефакту, див.
[виправлення валідації Plugin](/clawhub/plugin-validation-fixes), а потім повторно запустіть команду.

### `package delete <name>`

- Без `--version` м’яко видаляє пакет і всі випуски.
- `--version <version>` остаточно видаляє один належний вам не найновіший випуск через fail-closed,
  специфічний для версії маршрут.
  Видалені версії не можна відновити або опублікувати повторно. Опублікуйте заміну перед видаленням
  поточної найновішої версії. Цей потік лише для версій потребує власника пакета або адміністратора
  видавця організації; працівники платформи не обходять право власності на пакет.
- М’яке видалення всього пакета потребує власника пакета, власника/адміністратора видавця організації, модератора
  платформи або адміністратора платформи.
- Прапорці:
  - `--version <version>`: остаточно видалити одну не найновішу версію.
  - `--yes`: пропустити підтвердження.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Відновлює м’яко видалений пакет і випуски.
- Відновлення версії не передбачено; остаточно видалені версії не можна відновити.
- Потребує власника пакета, власника/адміністратора видавця організації, модератора платформи
  або адміністратора платформи.
- Викликає `POST /api/v1/packages/{name}/undelete`.
- Прапорці:
  - `--yes`: пропустити підтвердження.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Передає пакет іншому видавцю.
- Потребує адміністративного доступу і до поточного власника пакета, і до цільового
  видавця, якщо це не виконує адміністратор платформи.
- Назви пакетів зі scope мають передаватися відповідному власнику scope.
- Викликає `POST /api/v1/packages/{name}/transfer`.
- Прапорці:
  - `--to <owner>`: дескриптор цільового видавця.
  - `--reason <text>`: необов’язкова причина для аудиту.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Автентифікована команда для повідомлення модераторам про пакет.
- Викликає `POST /api/v1/packages/{name}/report`.
- Повідомлення діють на рівні пакета, можуть бути прив’язані до версії та стають видимими
  модераторам для перегляду.
- Повідомлення самі собою не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета для прив’язки до повідомлення.
  - `--reason <text>`: обов’язкова причина повідомлення.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда власника для перевірки видимості модерації пакета.
- Викликає `GET /api/v1/packages/{name}/moderation`.
- Показує поточний стан сканування пакета, кількість відкритих повідомлень, стан ручної
  модерації найновішого випуску, стан блокування завантаження та причини модерації.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Перевіряє, чи готовий пакет до майбутнього використання OpenClaw.
- Викликає `GET /api/v1/packages/{name}/readiness`.
- Повідомляє про блокери для офіційного статусу, доступності ClawPack, дайджесту артефакту,
  походження джерела, сумісності з OpenClaw, цільових хостів, метаданих середовища
  та стану сканування.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Показує орієнтований на оператора стан міграції для пакета, який може замінити
  вбудований OpenClaw plugin.
- Викликає ту саму обчислювану кінцеву точку готовності, що й `package readiness`, але виводить
  стан, орієнтований на міграцію, найновішу версію, стан офіційного пакета, перевірки та
  блокери.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Створює видавця-організацію, що належить автентифікованому користувачу.
- Дескриптор нормалізується до нижнього регістру й може передаватися з `@` або без нього.
- Новостворені видавці-організації типово не є довіреними/офіційними.
- Завершується помилкою, якщо дескриптор уже використовується наявним видавцем, користувачем або зарезервованим маршрутом.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Публікує Plugin коду або bundle Plugin через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний npm-pack tarball ClawPack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  справжніх маркерів bundle OpenClaw, як-от `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` обробляються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для валідації та
  попереднього заповнення метаданих.
- Папки code-plugin пакуються в npm tarball ClawPack перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки bundle-plugin і далі
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, розв’язаного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли origin remote вказує на GitHub.
- Зовнішні Plugins коду мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як fallback для валідації публікації.
- `--dry-run` попередньо показує розв’язане корисне навантаження публікації без завантаження.
- `--json` виводить машинозчитуваний результат для CI.
- `--owner <handle>` публікує під handle видавця користувача або організації, коли актор має доступ видавця.
- Імена scoped packages мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендований локальний процес

Спочатку використайте `--dry-run`, щоб підтвердити розв’язані метадані пакета й
атрибуцію джерела перед створенням реального релізу:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процес для локальної папки

Для Plugins коду публікація папки збирає й завантажує артефакт ClawPack з
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім Plugins коду потрібна невелика кількість метаданих OpenClaw у
`package.json`. Цього мінімального маніфесту достатньо для успішної публікації:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Обов’язкові поля:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Примітки:

- `package.json.version` — це версія релізу вашого пакета, але вона не використовується як
  fallback для валідації сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
  ClawHub може показувати їх, коли вони наявні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — це необов’язкові додаткові поля, якщо ви хочете опублікувати
  докладніші метадані сумісності.
- Якщо ви використовуєте старіший реліз CLI `clawhub`, оновіть його перед публікацією, щоб
  локальні preflight-перевірки виконувалися перед завантаженням.
- Якщо валідація повідомляє код виправлення, див.
  [Виправлення валідації Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub також постачає офіційний reusable workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)
для репозиторіїв Plugin.

Типове налаштування caller:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Примітки:

- Reusable workflow за замовчуванням встановлює `source` як репозиторій caller.
- Для monorepos передайте `source_path`, щоб workflow опублікував папку пакета Plugin,
  наприклад `source_path: extensions/codex`.
- Закріпіть reusable workflow на стабільному тегу або повному SHA коміту. Не запускайте публікацію релізу з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI залишався без побічних ефектів.
- Реальні публікації слід обмежити довіреними подіями, як-от `workflow_dispatch` або push тегів.
- Довірена публікація без секрету працює лише на `workflow_dispatch`; push тегів усе одно потребує `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, недовірених пакетів або аварійних публікацій.
- Workflow завантажує JSON-результат як артефакт і надає його як outputs workflow.

### `package trusted-publisher get <name>`

- Показує конфігурацію довіреного видавця GitHub Actions для пакета.
- Використовуйте це після встановлення конфігурації, щоб підтвердити репозиторій, ім’я файлу workflow
  і необов’язкове закріплення середовища.
- Прапорці:
  - `--json`: машинозчитуваний результат.

Приклад:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Прикріплює або замінює конфігурацію довіреного видавця GitHub Actions для наявного
  пакета.
- Пакет спершу має бути створений через звичайну ручну або token-authenticated
  публікацію `clawhub package publish`.
- Після встановлення конфігурації майбутні підтримувані публікації GitHub Actions можуть використовувати
  OIDC/довірену публікацію без довготривалого токена ClawHub.
- `--repository <repo>` має бути `owner/repo`.
- `--workflow-filename <file>` має відповідати імені файлу workflow у
  `.github/workflows/`.
- `--environment <name>` є необов’язковим. Коли налаштовано, середовище GitHub Actions
  у claim OIDC має точно збігатися.
- ClawHub перевіряє налаштований репозиторій GitHub під час виконання цієї команди.
  Публічні репозиторії можна перевірити через публічні метадані GitHub. Приватні
  репозиторії потребують, щоб ClawHub мав доступ GitHub до цього репозиторію, наприклад
  через майбутню інсталяцію GitHub App ClawHub або іншу авторизовану
  інтеграцію GitHub.
- Прапорці:
  - `--repository <repo>`: репозиторій GitHub, наприклад `openclaw/example-plugin`.
  - `--workflow-filename <file>`: ім’я файлу workflow, наприклад `package-publish.yml`.
  - `--environment <name>`: необов’язкове середовище GitHub Actions із точним збігом.
  - `--json`: машинозчитуваний результат.

Приклад:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Видаляє конфігурацію довіреного видавця з пакета.
- Використовуйте це як rollback, якщо workflow, репозиторій або закріплення середовища потрібно
  вимкнути або створити заново.
- Майбутні реальні публікації мають використовувати звичайну authenticated publishing, доки конфігурацію
  не буде встановлено знову.
- Прапорці:
  - `--json`: машинозчитуваний результат.

Приклад:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Телеметрія інсталяції

- Надсилається після `clawhub install <slug>` за умови входу в систему, якщо не встановлено
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- Звітування виконується за принципом best-effort. Команди інсталяції не завершуються з помилкою, якщо телеметрія
  недоступна.
- Докладніше: `docs/telemetry.md`.
