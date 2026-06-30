---
read_when:
    - Використання CLI ClawHub
    - Налагодження встановлення, оновлення або публікації
summary: 'Довідник CLI: команди, прапорці, конфігурація та поведінка lockfile.'
x-i18n:
    generated_at: "2026-06-30T22:31:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119900fddb8c80213eb12060c07026527a1ff851546c632bf1f7a909659b1945
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Пакет CLI: `clawhub`, бінарний файл: `clawhub`.

Установіть його глобально за допомогою npm або pnpm:

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
- `--dir <dir>`: каталог установлення в межах workdir (типово: `skills`)
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
вказаний проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується, щоб обійти проксі для
певних хостів або доменів.

Це потрібно в системах, де прямі вихідні підключення заблоковано
(наприклад, Docker-контейнери, Hetzner VPS з інтернетом лише через проксі,
корпоративні брандмауери).

Приклад:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Коли жодну змінну проксі не задано, поведінка не змінюється (прямі підключення).

## Файл конфігурації

Зберігає ваш API-токен і кешовану URL-адресу реєстру.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` або `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Застарілий запасний шлях: якщо `clawhub/config.json` ще не існує, але `clawdhub/config.json` існує, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застаріле `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- Типово: відкриває браузер на `<site>/cli/auth` і завершує через зворотний виклик loopback.
- Без графічного інтерфейсу: `clawhub login --token clh_...`
- Віддалено/інтерактивно без графічного інтерфейсу: `clawhub login --device` друкує код і чекає, доки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `token`

- Друкує збережений API-токен у stdout.
- Корисно для передавання локального токена входу в команди налаштування секретів CI.

### `star <skill>` / `unstar <skill>`

- Додає/видаляє навичку з ваших виділених.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Вивід містить slug навички, handle власника, відображувану назву та оцінку релевантності.
- Пошук надає перевагу точним збігам токенів slug/назви перед популярністю завантажень. Окремий токен slug, як-от `map`, збігається з `personal-map` сильніше, ніж підрядок усередині `amap`.
- Популярність є невеликим попереднім чинником ранжування, а не гарантією верхньої позиції.
- Якщо навичка має з’являтися, але не з’являється, запустіть `clawhub inspect @owner/slug`, увійшовши в систему, щоб перевірити видиму власнику модераційну діагностику перед перейменуванням метаданих.

### `explore`

- Показує найновіші навички через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` desc).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|rating|downloads|trending` (типово: newest). Застарілі псевдоніми сортування встановлення все ще працюють для сумісності.
  - `--json` (машиночитний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізано до 50 символів).

### `inspect @owner/slug`

- Отримує метадані навички та файли версії без установлення.
- `--version <version>`: переглянути певну версію (типово: latest).
- `--tag <tag>`: переглянути версію з тегом (наприклад, `latest`).
- `--versions`: показати історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для показу (1-200).
- `--files`: показати файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машиночитний вивід.

### `install @owner/slug`

- Визначає останню версію для вказаного власника та навички.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені навички; спершу запустіть `clawhub unpin <skill>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застаріле `.clawdhub`)

### `uninstall <skill>`

- Видаляє `<workdir>/<dir>/<slug>` і видаляє запис із lockfile.
- Надсилає телеметрію за принципом найкращого зусилля, коли ви ввійшли в систему, щоб поточні лічильники встановлень можна було
  деактивувати.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): вимагає `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`).
- Показує `pinned` поруч із навичками, замороженими через `clawhub pin`, включно з необов’язковою причиною.

### `pin <skill>`

- Позначає встановлену навичку як закріплену в lockfile.
- `--reason <text>` записує, чому навичку заморожено.
- Закріплені навички пропускаються `update --all` і відхиляються прямим `update <skill>`.
- Закріплені навички також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <skill>`

- Видаляє закріплення lockfile з установленої навички, щоб майбутні оновлення могли її змінювати.

### `update [@owner/slug]` / `update --all`

- Обчислює відбиток із локальних файлів.
- Якщо відбиток збігається з відомою версією: без підказки.
- Якщо відбиток не збігається:
  - відмовляється типово
  - перезаписує з `--force` (або за підказкою, якщо інтерактивно)
- Закріплені навички ніколи не оновлюються через `--force`.
- `update <skill>` швидко завершується помилкою для закріплених навичок і каже спершу запустити `clawhub unpin <skill>`.
- `update --all` пропускає закріплені slug і друкує підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Порівнює відбиток локального пакета з ClawHub і успішно завершує роботу, коли
  вміст уже опубліковано.
- Нові навички типово отримують `1.0.0`; змінені навички типово отримують наступну patch-
  версію.
- `--version <version>` явно вибирає версію та публікує навіть тоді, коли
  вміст збігається з наявною версією.
- `--dry-run` визначає публікацію без завантаження; `--json` друкує
  машиночитний результат.
- `--owner <handle>` публікує під handle видавця org/user, коли
  актор має доступ видавця.
- `--migrate-owner` переносить наявну навичку до `--owner` під час публікації нової
  версії. Потрібен доступ admin/owner в обох видавців.
- Поведінку власника й рев’ю пояснено в `docs/publishing.md`.
- Публікація навички означає, що її випущено під `MIT-0` на ClawHub.
- Опубліковані навички можна безкоштовно використовувати, змінювати та поширювати без зазначення авторства.
- ClawHub не підтримує платні навички або ціноутворення для окремих навичок.
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
під `root` (типово: `skills`). Він пропускає незмінені навички й використовує
ту саму автоматичну поведінку patch-версії.

Задайте `dry_run: true`, щоб переглянути без токена. Реальні публікації потребують
секрета `clawhub_token`.

### `sync`

- Сканує поточний workdir, налаштований каталог навичок і будь-які
  папки `--root <dir>` на наявність локальних папок навичок, що містять `SKILL.md` або
  `skill.md`.
- Порівнює відбиток кожної локальної навички з ClawHub і публікує лише нові або
  змінені навички.
- Нові навички публікуються як `1.0.0`; змінені навички типово публікують наступну patch-версію.
  Використовуйте `--bump minor|major` для пакетів оновлень, які мають перейти на
  більший крок semver.
- `--dry-run` показує план публікації без завантаження; `--json` друкує
  машиночитний план.
- `--all` публікує кожну нову або змінену навичку без підказок. Без
  `--all` інтерактивні термінали дають змогу вибрати навички для публікації.
- `--owner <handle>` публікує під handle видавця org/user, коли
  актор має доступ видавця.
- `sync` є лише односторонньою публікацією. Він не встановлює, не оновлює, не завантажує та не
  звітує телеметрію встановлень/завантажень.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Вимагає `clawhub login`.
- Запускає ClawHub ClawScan через `POST /api/v1/skills/-/scan`, потім опитує, доки сканування не стане термінальним.
- Сканування асинхронні й можуть потребувати часу для завершення. Поки вони в черзі, спінер термінала показує поточну пріоритетну позицію сканування та скільки сканувань попереду.
- Опубліковані сканування потребують права власності або доступу до керування видавцем. Модератори/admins можуть використовувати той самий бекенд через `clawhub-admin`.
- `--update` дійсний лише з `--slug`; він записує успішні результати опублікованого сканування назад у вибрану версію.
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
- Завантажує збережений ZIP-звіт сканування для поданої версії навички або plugin, включно з версіями, які були заблоковані або приховані перевірками безпеки ClawHub.
- Завантаження навичок використовують slug навички й типово мають `--kind skill`.
- Завантаження Plugin використовують назву пакета й вимагають `--kind plugin`.
- `--version` обов’язковий, щоб автори перевіряли точну подану версію, яку ClawHub заблокував.
- `--output <file.zip>` вибирає шлях призначення.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub постачає офіційний багаторазовий workflow за адресою
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/skill-publish.yml)
для репозиторіїв навичок і каталогів.

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

- `root` типово дорівнює `skills` для репозиторіїв каталогів.
- Передайте `skill_path: skills/review-helper`, щоб обробити одну папку навички.
- `owner` відповідає прапорцю CLI `--owner`; пропустіть його, щоб публікувати як автентифікований користувач.
- Публікація навичок V1 використовує `clawhub_token`; довірена публікація GitHub OIDC наразі призначена лише для пакетів.

### `delete <skill>`

- Без `--version` м’яко видаляє навичку (власник, модератор або адміністратор).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда виводить час завершення резервування.
- `--version <version>` остаточно видаляє одну власну не найновішу версію через fail-closed,
  специфічний для версії маршрут.
  Видалені версії неможливо відновити або опублікувати повторно. Опублікуйте заміну перед видаленням
  поточної найновішої версії. Персонал платформи не обходить право власності для цього потоку лише для версій.
- `--reason <text>` записує модераційну примітку для м’якого видалення всієї навички та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <skill>`

- Відновлює приховану навичку (власник, модератор або адміністратор).
- Відновлення версії після видалення не передбачено; остаточно видалені версії неможливо відновити.
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує модераційну примітку для навички та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <skill>`

- Приховує навичку (власник, модератор або адміністратор).
- Псевдонім для `delete`.

### `unhide <skill>`

- Скасовує приховування навички (власник, модератор або адміністратор).
- Псевдонім для `undelete`.

### `skill rename <skill> <new-name>`

- Перейменовує власну навичку та зберігає попередній slug як псевдонім переспрямування.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source> <target>`

- Об’єднує одну власну навичку з іншою власною навичкою.
- Вихідний slug більше не відображається публічно й стає псевдонімом переспрямування на ціль.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Робочий процес передавання права власності.
- Передавання на дескриптори користувачів створює запит в очікуванні, який приймає одержувач.
- Передавання на дескриптори організацій/видавців застосовується негайно лише тоді, коли виконавець має
  адміністраторський доступ і до поточного власника, і до цільового видавця.
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
- Використовуйте це для плагінів та інших записів родини пакетів; верхньорівневий `search` залишається поверхнею пошуку навичок.
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

- Отримує метадані пакета без установлення.
- Використовуйте це для метаданих плагіна, сумісності, перевірки, джерела та інспекції версій/файлів.
- `--version <version>`: перевірити конкретну версію (типово: найновіша).
- `--tag <tag>`: перевірити версію з тегом (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машиночитаний вивід.

### `package download <name>`

- Визначає версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує артефакт із `downloadUrl` резолвера.
- Перевіряє ClawHub SHA-256 для всіх артефактів.
- Для артефактів ClawPack npm-pack також перевіряє цілісність npm `sha512`,
  npm shasum і назву/версію в `package.json` tarball.
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
  артефакту.
- З `--package` визначає очікувані метадані з ClawHub і порівнює
  локальний файл із метаданими опублікованого артефакту.
- З прямими прапорцями дайджестів виконує перевірку без мережевого пошуку.
- Прапорці:
  - `--package <name>`: назва пакета для визначення очікуваних метаданих артефакту.
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

- Запускає вбудований у ClawHub CLI Plugin Inspector для локальної папки пакета плагіна.
- Типово використовує офлайн/статичну перевірку без пошуку або імпорту локального
  checkout OpenClaw.
- Критичні помилки сумісності завершуються ненульовим кодом. Знахідки лише з попередженнями виводяться, але
  завершуються нульовим кодом.
- Прапорці:
  - `--out <dir>`: записати звіти Plugin Inspector у цей каталог.
  - `--openclaw <path>`: перевірити відносно явного локального checkout OpenClaw.
  - `--runtime`: увімкнути захоплення часу виконання; імпортує код плагіна.
  - `--allow-execute`: дозволити захоплення часу виконання в ізольованому робочому просторі.
  - `--no-mock-sdk`: вимкнути імітований OpenClaw SDK під час захоплення часу виконання.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package validate ./example-plugin
```

Якщо перевірка повідомляє про знахідку в пакеті, маніфесті, імпорті SDK або артефакті, див.
[виправлення перевірки Plugin](/clawhub/plugin-validation-fixes), потім повторно запустіть команду.

### `package delete <name>`

- Без `--version` м’яко видаляє пакет і всі релізи.
- `--version <version>` остаточно видаляє один власний не найновіший реліз через fail-closed,
  специфічний для версії маршрут.
  Видалені версії неможливо відновити або опублікувати повторно. Опублікуйте заміну перед видаленням
  поточної найновішої версії. Цей потік лише для версій вимагає власника пакета або адміністратора видавця організації; персонал платформи не обходить право власності на пакет.
- М’яке видалення всього пакета вимагає власника пакета, власника/адміністратора видавця організації, модератора
  платформи або адміністратора платформи.
- Прапорці:
  - `--version <version>`: остаточно видалити одну не найновішу версію.
  - `--yes`: пропустити підтвердження.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Відновлює м’яко видалений пакет і релізи.
- Відновлення версії після видалення не передбачено; остаточно видалені версії неможливо відновити.
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
- Вимагає адміністраторського доступу і до поточного власника пакета, і до цільового
  видавця, якщо дія не виконується адміністратором платформи.
- Імена scoped-пакетів мають передаватися відповідному власнику scope.
- Викликає `POST /api/v1/packages/{name}/transfer`.
- Прапорці:
  - `--to <owner>`: дескриптор цільового видавця.
  - `--reason <text>`: необов’язкова причина для аудиту.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Автентифікована команда для повідомлення модераторам про пакет.
- Викликає `POST /api/v1/packages/{name}/report`.
- Звіти створюються на рівні пакета, за потреби прив’язуються до версії та стають видимими
  модераторам для розгляду.
- Звіти самі собою не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета, яку слід прикріпити до звіту.
  - `--reason <text>`: обов’язкова причина звіту.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда власника для перевірки видимості модерації пакета.
- Викликає `GET /api/v1/packages/{name}/moderation`.
- Показує поточний стан сканування пакета, кількість відкритих звітів, стан ручної модерації
  найновішого релізу, стан блокування завантажень і причини модерації.
- Прапорці:
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Перевіряє, чи готовий пакет до майбутнього споживання OpenClaw.
- Викликає `GET /api/v1/packages/{name}/readiness`.
- Повідомляє про блокери для офіційного статусу, доступності ClawPack, дайджесту артефакту,
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
  bundled-плагін OpenClaw.
- Викликає ту саму обчислювану кінцеву точку готовності, що й `package readiness`, але виводить
  орієнтований на міграцію стан, найновішу версію, стан офіційного пакета, перевірки та
  блокери.
- Прапорці:
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Створює видавця організації, власником якого є автентифікований користувач.
- Дескриптор нормалізується до нижнього регістру та може передаватися з `@` або без нього.
- Новостворені видавці організацій типово не є довіреними/офіційними.
- Завершується помилкою, якщо дескриптор уже використовується наявним видавцем, користувачем або зарезервованим маршрутом.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Публікує кодовий Plugin або bundle Plugin через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний npm-pack tarball ClawPack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  реальних маркерів bundle OpenClaw, як-от `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` обробляються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для перевірки та
  попереднього заповнення метаданих.
- Папки кодових Plugin пакуються в npm tarball ClawPack перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки bundle Plugin і далі
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, визначеного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли origin remote вказує на GitHub.
- Зовнішні кодові Plugin мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як fallback для перевірки публікації.
- `--dry-run` попередньо показує визначене навантаження публікації без завантаження.
- `--json` виводить машинозчитуваний результат для CI.
- `--owner <handle>` публікує під дескриптором видавця користувача або організації, коли актор має доступ видавця.
- Імена scoped пакетів мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендований локальний потік

Спершу використайте `--dry-run`, щоб підтвердити визначені метадані пакета та
атрибуцію джерела перед створенням реального релізу:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Потік локальної папки

Для кодових Plugin публікація папки збирає та завантажує артефакт ClawPack з
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім кодовим Plugin потрібен невеликий обсяг метаданих OpenClaw у
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
  fallback для перевірки сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
  ClawHub може показувати їх, коли вони наявні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додаткові поля, якщо ви хочете опублікувати
  детальніші метадані сумісності.
- Якщо ви використовуєте старіший реліз CLI `clawhub`, оновіться перед публікацією, щоб
  локальні preflight-перевірки виконувалися до завантаження.
- Якщо перевірка повідомляє код виправлення, див.
  [виправлення перевірки Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub також постачає офіційний багаторазовий workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/package-publish.yml)
для репозиторіїв Plugin.

Типове налаштування виклику:

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

- Багаторазовий workflow за замовчуванням задає `source` як репозиторій виклику.
- Для монорепозиторіїв передайте `source_path`, щоб workflow публікував
  папку пакета Plugin, наприклад `source_path: extensions/codex`.
- Закріпіть багаторазовий workflow на стабільному тегу або повному SHA коміту. Не запускайте публікацію релізу з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не засмічував стан.
- Реальні публікації мають бути обмежені довіреними подіями, як-от `workflow_dispatch` або push тегів.
- Довірена публікація без секрету працює лише на `workflow_dispatch`; push тегів усе ще потребує `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, недовірених пакетів або аварійних публікацій.
- Workflow завантажує результат JSON як артефакт і надає його як вихідні дані workflow.

### `package trusted-publisher get <name>`

- Показує конфігурацію довіреного видавця GitHub Actions для пакета.
- Використовуйте це після налаштування конфігурації, щоб підтвердити репозиторій, ім’я файлу workflow
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
- Пакет спершу має бути створений через звичайний ручний або автентифікований токеном
  `clawhub package publish`.
- Після налаштування конфігурації майбутні підтримувані публікації GitHub Actions можуть використовувати
  OIDC/довірену публікацію без довготривалого токена ClawHub.
- `--repository <repo>` має бути `owner/repo`.
- `--workflow-filename <file>` має відповідати імені файлу workflow у
  `.github/workflows/`.
- `--environment <name>` є необов’язковим. Коли налаштовано, середовище GitHub Actions
  у claim OIDC має точно збігатися.
- ClawHub перевіряє налаштований репозиторій GitHub під час виконання цієї команди.
  Публічні репозиторії можна перевірити через публічні метадані GitHub. Приватні
  репозиторії потребують, щоб ClawHub мав доступ GitHub до цього репозиторію, наприклад
  через майбутнє встановлення GitHub App ClawHub або іншу авторизовану
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
  вимкнути чи створити повторно.
- Майбутні реальні публікації мають використовувати звичайну автентифіковану публікацію, доки конфігурацію не буде
  налаштовано знову.
- Прапорці:
  - `--json`: машинозчитуваний результат.

Приклад:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Телеметрія встановлення

- Надсилається після `clawhub install <slug>`, коли виконано вхід, якщо тільки
  не встановлено `CLAWHUB_DISABLE_TELEMETRY=1`.
- Звітування виконується за принципом best-effort. Команди встановлення не завершуються помилкою, якщо телеметрія
  недоступна.
- Подробиці: `docs/telemetry.md`.
