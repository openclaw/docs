---
read_when:
    - Використання CLI ClawHub
    - Налагодження встановлення, оновлення або публікації
summary: 'Довідка CLI: команди, прапорці, конфігурація та поведінка файла блокування.'
x-i18n:
    generated_at: "2026-07-01T08:27:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4467e589a4892d513e4ca715b73a81147abb59cb7706b0068a11af6c95ea08f9
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Пакет CLI: `clawhub`, bin: `clawhub`.

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
- `--no-input`: вимкнути підказки

Еквіваленти змінних середовища:

- `CLAWHUB_SITE` (застаріле `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (застаріле `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (застаріле `CLAWDHUB_WORKDIR`)

### HTTP-проксі

CLI враховує стандартні змінні середовища HTTP-проксі для систем за
корпоративними проксі або в обмежених мережах:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Коли будь-яку з цих змінних задано, CLI спрямовує вихідні запити через
зазначений проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується для обходу проксі для
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

Коли змінну проксі не задано, поведінка не змінюється (прямі з'єднання).

## Файл конфігурації

Зберігає ваш API-токен + кешовану URL-адресу реєстру.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` або `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Застарілий резервний шлях: якщо `clawhub/config.json` ще не існує, але існує `clawdhub/config.json`, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застаріле `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- Типово: відкриває браузер за адресою `<site>/cli/auth` і завершує через зворотний виклик loopback.
- Без графічного інтерфейсу: `clawhub login --token clh_...`
- Віддалений/безголовий інтерактивний режим: `clawhub login --device` друкує код і чекає, доки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `token`

- Друкує збережений API-токен у stdout.
- Корисно для передавання локального токена входу в команди налаштування секретів CI.

### `star <skill>` / `unstar <skill>`

- Додає навичку до ваших виділених або вилучає її звідти.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Вивід містить slug навички, handle власника, відображувану назву та оцінку релевантності.
- Пошук надає перевагу точним збігам токенів slug/назви перед популярністю завантажень. Окремий токен slug, як-от `map`, відповідає `personal-map` сильніше, ніж підрядку всередині `amap`.
- Популярність є невеликим попереднім фактором ранжування, а не гарантією першого місця.
- Якщо навичка має з'явитися, але не з'являється, виконайте `clawhub inspect @owner/slug` після входу, щоб перевірити видиму власнику діагностику модерації перед перейменуванням метаданих.

### `explore`

- Перелічує найновіші Skills через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` за спаданням).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|rating|downloads|trending` (типово: newest). Застарілі псевдоніми сортування встановлення все ще працюють для сумісності.
  - `--json` (машиночитний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізається до 50 символів).

### `inspect @owner/slug`

- Отримує метадані навички та файли версії без встановлення.
- `--version <version>`: переглянути певну версію (типово: latest).
- `--tag <tag>`: переглянути позначену тегом версію (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-200).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файла (лише текстові файли; ліміт 200 КБ).
- `--json`: машиночитний вивід.

### `install @owner/slug`

- Визначає найновішу версію для названого власника й навички.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені Skills; спочатку виконайте `clawhub unpin <skill>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застаріле `.clawdhub`)

### `uninstall <skill>`

- Видаляє `<workdir>/<dir>/<slug>` і запис із lockfile.
- Надсилає телеметрію за найкращою спробою під час входу, щоб поточні лічильники встановлень можна було
  деактивувати.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): вимагає `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`).
- Показує `pinned` поруч зі Skills, замороженими за допомогою `clawhub pin`, включно з необов'язковою причиною.

### `pin <skill>`

- Позначає встановлену навичку як закріплену в lockfile.
- `--reason <text>` записує, чому навичку заморожено.
- Закріплені Skills пропускаються `update --all` і відхиляються прямим `update <skill>`.
- Закріплені Skills також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <skill>`

- Вилучає закріплення lockfile з установленої навички, щоб майбутні оновлення могли її змінювати.

### `update [@owner/slug]` / `update --all`

- Обчислює відбиток із локальних файлів.
- Якщо відбиток збігається з відомою версією: без підказки.
- Якщо відбиток не збігається:
  - типово відмовляється
  - перезаписує з `--force` (або через підказку, якщо інтерактивно)
- Закріплені Skills ніколи не оновлюються через `--force`.
- `update <skill>` швидко завершується помилкою для закріплених Skills і каже спочатку виконати `clawhub unpin <skill>`.
- `update --all` пропускає закріплені slug і друкує підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Порівнює відбиток локального пакета з ClawHub і успішно завершується, коли
  вміст уже опубліковано.
- Нові Skills типово отримують `1.0.0`; змінені Skills типово отримують наступну patch-
  версію.
- `--version <version>` явно вибирає версію та публікує, навіть коли
  вміст збігається з наявною версією.
- `--dry-run` визначає публікацію без завантаження; `--json` друкує
  машиночитний результат.
- `--owner <handle>` публікує під handle видавця організації/користувача, коли
  актор має доступ видавця.
- `--migrate-owner` переміщує наявну навичку до `--owner` під час публікації нової
  версії. Потрібен доступ admin/owner для обох видавців.
- Поведінку власника та перевірки пояснено в `docs/publishing.md`.
- Публікація навички означає, що її випущено під `MIT-0` на ClawHub.
- Опубліковані Skills можна вільно використовувати, змінювати й розповсюджувати без зазначення авторства.
- ClawHub не підтримує платні Skills або ціноутворення для окремих Skills.
- Застарілий псевдонім: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Багаторазовий workflow ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
викликає `skill publish` для одного `skill_path` або для кожної безпосередньої папки навички
під `root` (типово: `skills`). Він пропускає незмінені Skills і використовує
ту саму автоматичну поведінку patch-версії.

Установіть `dry_run: true`, щоб попередньо переглянути без токена. Справжні публікації потребують
секрету `clawhub_token`.

### `sync`

- Сканує поточний workdir, налаштований каталог Skills і будь-які
  папки `--root <dir>` на наявність локальних папок навичок, що містять `SKILL.md` або
  `skill.md`.
- Порівнює відбиток кожної локальної навички з ClawHub і публікує лише нові або
  змінені Skills.
- Нові Skills публікуються як `1.0.0`; змінені Skills типово публікуються з наступною patch-версією.
  Використовуйте `--bump minor|major` для пакетів оновлень, які мають перейти на
  більший крок semver.
- `--dry-run` показує план публікації без завантаження; `--json` друкує
  машиночитний план.
- `--all` публікує кожну нову або змінену навичку без підказок. Без
  `--all` інтерактивні термінали дають змогу вибрати Skills для публікації.
- `--owner <handle>` публікує під handle видавця організації/користувача, коли
  актор має доступ видавця.
- `sync` є лише односторонньою публікацією. Він не встановлює, не оновлює, не завантажує й не
  повідомляє телеметрію встановлень/завантажень.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Вимагає `clawhub login`.
- Запускає ClawHub ClawScan через `POST /api/v1/skills/-/scan`, потім опитує, доки сканування не стане термінальним.
- Сканування асинхронні й можуть потребувати часу для завершення. Поки вони в черзі, індикатор у терміналі показує поточну пріоритезовану позицію сканування та скільки сканувань попереду.
- Опубліковані сканування потребують доступу власника або керування видавцем. Модератори/admins можуть використовувати той самий backend через `clawhub-admin`.
- `--update` дійсний лише з `--slug`; він записує успішні результати опублікованого сканування назад до вибраної версії.
- `--output <file.zip>` завантажує повний архів звіту з `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.
- `--json` друкує повну відповідь опитування для автоматизації.
- Сканування локальних шляхів більше не підтримуються. Завантажте нову версію, потім використайте `scan download`, щоб отримати збережені результати сканування для цієї поданої версії.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Вимагає `clawhub login`.
- Завантажує збережений ZIP-звіт сканування для поданої версії навички або plugin, включно з версіями, які було заблоковано або приховано перевірками безпеки ClawHub.
- Завантаження навичок використовують slug навички й типово мають `--kind skill`.
- Завантаження Plugin використовують назву пакета й потребують `--kind plugin`.
- `--version` обов'язковий, щоб автори переглядали точну подану версію, яку ClawHub заблокував.
- `--output <file.zip>` вибирає шлях призначення.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub постачає офіційний багаторазовий workflow за адресою
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/skill-publish.yml)
для репозиторіїв навичок і репозиторіїв каталогів.

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
- Передайте `skill_path: skills/review-helper`, щоб обробити одну папку навички.
- `owner` відповідає прапорцю CLI `--owner`; пропустіть його, щоб публікувати як автентифікований користувач.
- Публікація Skills V1 використовує `clawhub_token`; довірена публікація GitHub OIDC наразі доступна лише для пакетів.

### `delete <skill>`

- Без `--version` м’яко видаляє skill (власник, модератор або адміністратор).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда друкує час завершення резервування.
- `--version <version>` назавжди видаляє одну належну власнику версію, що не є останньою, через fail-closed,
  маршрут для конкретної версії.
  Видалені версії не можна відновити або повторно опублікувати. Опублікуйте заміну перед видаленням
  поточної останньої версії. Працівники платформи не обходять право власності для цього потоку лише для версій.
- `--reason <text>` записує примітку модерації для м’якого видалення всього skill і журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <skill>`

- Відновлює прихований skill (власник, модератор або адміністратор).
- Відновлення версій не існує; назавжди видалені версії не можна відновити.
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує примітку модерації для skill і журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <skill>`

- Приховує skill (власник, модератор або адміністратор).
- Псевдонім для `delete`.

### `unhide <skill>`

- Скасовує приховування skill (власник, модератор або адміністратор).
- Псевдонім для `undelete`.

### `skill rename <skill> <new-name>`

- Перейменовує належний власнику skill і зберігає попередній slug як псевдонім переспрямування.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source> <target>`

- Об’єднує один належний власнику skill з іншим належним власнику skill.
- Вихідний slug перестає публічно відображатися та стає псевдонімом переспрямування до цілі.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Робочий процес передавання права власності.
- Передавання користувацьким handle створює запит в очікуванні, який одержувач приймає.
- Передавання handle організації/видавця застосовується негайно лише тоді, коли виконавець має
  адміністраторський доступ і до поточного власника, і до видавця призначення.
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
- Використовуйте це для плагінів та інших записів сімейств пакетів; верхньорівневий `search` залишається поверхнею пошуку skill.
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
- Використовуйте це для метаданих плагіна, сумісності, перевірки, джерела та інспектування версій/файлів.
- `--version <version>`: інспектувати конкретну версію (типово: останню).
- `--tag <tag>`: інспектувати версію з тегом (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для виведення (1-100).
- `--files`: перелічити файли вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машиночитаний вивід.

### `package download <name>`

- Визначає версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує артефакт із `downloadUrl` резолвера.
- Перевіряє ClawHub SHA-256 для всіх артефактів.
- Для артефактів ClawPack npm-pack також перевіряє цілісність npm `sha512`,
  npm shasum і назву/версію `package.json` tarball.
- Застарілі ZIP-версії завантажуються через застарілий ZIP-маршрут.
- Прапорці:
  - `--version <version>`: завантажити конкретну версію.
  - `--tag <tag>`: завантажити версію з тегом (типово: `latest`).
  - `-o, --output <path>`: вихідний файл або каталог.
  - `--force`: перезаписати наявний вихідний файл.
  - `--json`: машиночитаний вивід.

Приклади:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Обчислює ClawHub SHA-256, цілісність npm `sha512` і npm shasum для локального
  артефакта.
- З `--package` визначає очікувані метадані з ClawHub і порівнює
  локальний файл із метаданими опублікованого артефакта.
- З прямими прапорцями дайджестів перевіряє без мережевого запиту.
- Прапорці:
  - `--package <name>`: назва пакета для визначення очікуваних метаданих артефакта.
  - `--version <version>` або `--tag <tag>`: очікувана версія пакета.
  - `--sha256 <hex>`: очікуваний ClawHub SHA-256.
  - `--npm-integrity <sri>`: очікувана цілісність npm.
  - `--npm-shasum <sha1>`: очікуваний npm shasum.
  - `--json`: машиночитаний вивід.

Приклади:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Запускає вбудований у ClawHub CLI Plugin Inspector для локальної теки пакета плагіна.
- Типово виконує офлайн/статичну перевірку, без пошуку або імпорту локального
  checkout OpenClaw.
- Жорсткі помилки сумісності завершуються з ненульовим кодом. Знахідки рівня лише попередження
  друкуються, але завершуються з нульовим кодом.
- Прапорці:
  - `--out <dir>`: записати звіти Plugin Inspector у цей каталог.
  - `--openclaw <path>`: інспектувати відносно явного локального checkout OpenClaw.
  - `--runtime`: увімкнути runtime-захоплення; імпортує код плагіна.
  - `--allow-execute`: дозволити runtime-захоплення в ізольованому робочому просторі.
  - `--no-mock-sdk`: вимкнути імітований OpenClaw SDK під час runtime-захоплення.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package validate ./example-plugin
```

Якщо перевірка повідомляє про знахідку пакета, маніфесту, імпорту SDK або артефакта, див.
[виправлення перевірки Plugin](/clawhub/plugin-validation-fixes), потім повторно запустіть команду.

### `package delete <name>`

- Без `--version` м’яко видаляє пакет і всі випуски.
- `--version <version>` назавжди видаляє один належний власнику випуск, що не є останнім, через fail-closed,
  маршрут для конкретної версії.
  Видалені версії не можна відновити або повторно опублікувати. Опублікуйте заміну перед видаленням
  поточної останньої версії. Цей потік лише для версій вимагає власника пакета або адміністратора
  видавця організації; працівники платформи не обходять право власності на пакет.
- М’яке видалення всього пакета вимагає власника пакета, власника/адміністратора видавця організації, модератора
  платформи або адміністратора платформи.
- Прапорці:
  - `--version <version>`: назавжди видалити одну версію, що не є останньою.
  - `--yes`: пропустити підтвердження.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Відновлює м’яко видалений пакет і випуски.
- Відновлення версій не існує; назавжди видалені версії не можна відновити.
- Вимагає власника пакета, власника/адміністратора видавця організації, модератора платформи
  або адміністратора платформи.
- Викликає `POST /api/v1/packages/{name}/undelete`.
- Прапорці:
  - `--yes`: пропустити підтвердження.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Передає пакет іншому видавцю.
- Вимагає адміністраторського доступу і до поточного власника пакета, і до видавця
  призначення, якщо це не виконує адміністратор платформи.
- Назви scoped-пакетів мають передаватися відповідному власнику scope.
- Викликає `POST /api/v1/packages/{name}/transfer`.
- Прапорці:
  - `--to <owner>`: handle видавця призначення.
  - `--reason <text>`: необов’язкова причина для аудиту.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Автентифікована команда для повідомлення модераторам про пакет.
- Викликає `POST /api/v1/packages/{name}/report`.
- Звіти діють на рівні пакета, можуть бути прив’язані до версії та стають видимими
  модераторам для розгляду.
- Звіти самі по собі автоматично не приховують пакети й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета для прикріплення до звіту.
  - `--reason <text>`: обов’язкова причина звіту.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда власника для перевірки видимості модерації пакета.
- Викликає `GET /api/v1/packages/{name}/moderation`.
- Показує поточний стан сканування пакета, кількість відкритих звітів, стан ручної
  модерації останнього випуску, стан блокування завантажень і причини модерації.
- Прапорці:
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Перевіряє, чи готовий пакет до майбутнього споживання OpenClaw.
- Викликає `GET /api/v1/packages/{name}/readiness`.
- Повідомляє про блокери для офіційного статусу, доступності ClawPack, дайджесту артефакта,
  походження джерела, сумісності з OpenClaw, цільових хостів, метаданих середовища
  та стану сканування.
- Прапорці:
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Показує орієнтований на оператора стан міграції для пакета, який може замінити
  вбудований плагін OpenClaw.
- Викликає ту саму обчислену кінцеву точку готовності, що й `package readiness`, але друкує
  стан, зосереджений на міграції, останню версію, стан офіційного пакета, перевірки та
  блокери.
- Прапорці:
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Створює видавця організації, що належить автентифікованому користувачу.
- Handle нормалізується до нижнього регістру та може передаватися з `@` або без нього.
- Новостворені видавці організацій типово не є довіреними/офіційними.
- Завершується помилкою, якщо handle уже використовується наявним видавцем, користувачем або зарезервованим маршрутом.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Публікує code Plugin або bundle Plugin через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний ClawPack tarball npm-pack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  реальних маркерів bundle OpenClaw, як-от `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` обробляються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує видобутий вміст `package/` лише для перевірки та
  попереднього заповнення метаданих.
- Папки code Plugin перед завантаженням пакуються в npm tarball ClawPack, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки bundle Plugin і далі
  використовують шлях публікації видобутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, визначеного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли origin remote вказує на GitHub.
- Зовнішні code Plugin повинні явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як fallback для перевірки публікації.
- `--dry-run` показує попередній перегляд визначеного payload публікації без завантаження.
- `--json` виводить машиночитаний результат для CI.
- `--owner <handle>` публікує під user або org publisher handle, коли actor має publisher access.
- Імена scoped packages повинні відповідати вибраному owner. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендований локальний процес

Спочатку використайте `--dry-run`, щоб підтвердити визначені метадані пакета та
атрибуцію джерела перед створенням live release:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процес для локальної папки

Для code Plugin публікація папки збирає та завантажує артефакт ClawPack із
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім code Plugin потрібна невелика кількість метаданих OpenClaw у
`package.json`. Цього мінімального manifest достатньо для успішної публікації:

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

- `package.json.version` — це версія release вашого пакета, але вона не використовується як
  fallback для перевірки сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` — необов’язкові метадані.
  ClawHub може показувати їх, коли вони наявні, але для публікації вони не потрібні.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додаткові поля, якщо ви хочете опублікувати
  детальніші метадані сумісності.
- Якщо ви використовуєте старіший release CLI `clawhub`, оновіться перед публікацією, щоб
  локальні preflight-перевірки запускалися перед завантаженням.
- Якщо перевірка повідомляє код remediation, див.
  [виправлення перевірки Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub також постачає офіційний reusable workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/package-publish.yml)
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

- Reusable workflow за замовчуванням встановлює `source` на репозиторій caller.
- Для monorepo передайте `source_path`, щоб workflow опублікував папку пакета
  Plugin, наприклад `source_path: extensions/codex`.
- Закріпіть reusable workflow на стабільному tag або повному commit SHA. Не запускайте публікацію release з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не забруднював стан.
- Реальні публікації мають бути обмежені довіреними подіями, як-от `workflow_dispatch` або tag pushes.
- Trusted publishing без секрету працює лише на `workflow_dispatch`; tag pushes усе ще потребують `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, недовірених пакетів або emergency publishes.
- Workflow завантажує результат JSON як артефакт і надає його як outputs workflow.

### `package trusted-publisher get <name>`

- Показує конфігурацію trusted publisher GitHub Actions для пакета.
- Використовуйте це після встановлення конфігурації, щоб підтвердити репозиторій, ім’я файлу workflow
  і необов’язковий environment pin.
- Прапорці:
  - `--json`: машиночитаний результат.

Приклад:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Прикріплює або замінює конфігурацію trusted publisher GitHub Actions для наявного
  пакета.
- Пакет спершу потрібно створити через звичайну ручну або token-authenticated
  `clawhub package publish`.
- Після встановлення конфігурації майбутні підтримувані публікації GitHub Actions можуть використовувати
  OIDC/trusted publishing без довготривалого token ClawHub.
- `--repository <repo>` має бути `owner/repo`.
- `--workflow-filename <file>` має відповідати імені файлу workflow у
  `.github/workflows/`.
- `--environment <name>` є необов’язковим. Коли налаштовано, environment GitHub Actions
  у claim OIDC має точно збігатися.
- ClawHub перевіряє налаштований репозиторій GitHub під час виконання цієї команди.
  Публічні репозиторії можна перевірити через публічні метадані GitHub. Приватні
  репозиторії потребують, щоб ClawHub мав доступ GitHub до цього репозиторію, наприклад
  через майбутнє встановлення GitHub App ClawHub або іншу авторизовану
  інтеграцію GitHub.
- Прапорці:
  - `--repository <repo>`: репозиторій GitHub, наприклад `openclaw/example-plugin`.
  - `--workflow-filename <file>`: ім’я файлу workflow, наприклад `package-publish.yml`.
  - `--environment <name>`: необов’язковий environment GitHub Actions із точним збігом.
  - `--json`: машиночитаний результат.

Приклад:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Видаляє конфігурацію trusted publisher з пакета.
- Використовуйте це як rollback, якщо workflow, репозиторій або environment pin потрібно
  вимкнути чи створити заново.
- Майбутні реальні публікації повинні використовувати звичайну authenticated publishing, доки конфігурацію
  не буде встановлено знову.
- Прапорці:
  - `--json`: машиночитаний результат.

Приклад:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Телеметрія встановлення

- Надсилається після `clawhub install <slug>` за наявності входу в систему, якщо не встановлено
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- Надсилання звітів виконується за принципом best-effort. Команди встановлення не завершуються помилкою, якщо телеметрія
  недоступна.
- Подробиці: `docs/telemetry.md`.
