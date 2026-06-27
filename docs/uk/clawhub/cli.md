---
read_when:
    - Використання CLI ClawHub
    - Налагодження встановлення, оновлення або публікації
summary: 'Довідник CLI: команди, прапорці, конфігурація та поведінка lockfile.'
x-i18n:
    generated_at: "2026-06-27T17:15:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9c6c152cbe121f55969aeda0b990b444325e49ce6613745ef094a78d2d2cfce4
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Пакет CLI: `clawhub`, bin: `clawhub`.

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
- `--dir <dir>`: каталог установлення всередині workdir (типово: `skills`)
- `--site <url>`: базова URL-адреса для входу через браузер (типово: `https://clawhub.ai`)
- `--registry <url>`: базова URL-адреса API (типово: виявлена, інакше `https://clawhub.ai`)
- `--no-input`: вимкнути підказки

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
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується, щоб обходити проксі для
певних хостів або доменів.

Це потрібно в системах, де прямі вихідні з’єднання заблоковано
(наприклад, контейнери Docker, Hetzner VPS з інтернетом лише через проксі,
корпоративні брандмауери).

Приклад:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Коли жодну змінну проксі не задано, поведінка не змінюється (прямі з’єднання).

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
- Віддалений/безголовий інтерактивний режим: `clawhub login --device` друкує код і чекає, доки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `token`

- Друкує збережений API-токен у stdout.
- Корисно для передавання локального токена входу в команди налаштування секретів CI.

### `star <skill>` / `unstar <skill>`

- Додає/вилучає навичку з ваших виділених.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Вивід містить slug навички, handle власника, відображувану назву та оцінку релевантності.
- Пошук надає перевагу точним збігам токенів slug/назви перед популярністю завантажень. Окремий токен slug, як-от `map`, відповідає `personal-map` сильніше, ніж підрядок усередині `amap`.
- Популярність є невеликим попереднім фактором ранжування, а не гарантією верхньої позиції.
- Якщо навичка має з’являтися, але не з’являється, виконайте `clawhub inspect @owner/slug` після входу, щоб перевірити видиму власнику діагностику модерації перед перейменуванням метаданих.

### `explore`

- Перелічує найновіші навички через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` desc).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|rating|downloads|trending` (типово: newest). Застарілі псевдоніми сортування встановлення досі працюють для сумісності.
  - `--json` (машиночитаний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (зведення обрізано до 50 символів).

### `inspect @owner/slug`

- Отримує метадані навички та файли версії без установлення.
- `--version <version>`: переглянути певну версію (типово: latest).
- `--tag <tag>`: переглянути теговану версію (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-200).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машиночитаний вивід.

### `install @owner/slug`

- Визначає найновішу версію для названого власника й навички.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені навички; спочатку виконайте `clawhub unpin <skill>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застарілий `.clawdhub`)

### `uninstall <skill>`

- Вилучає `<workdir>/<dir>/<slug>` і видаляє запис із lockfile.
- Надсилає телеметрію за принципом найкращого зусилля під час входу, щоб поточні лічильники встановлень можна було
  деактивувати.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): потребує `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`).
- Показує `pinned` поруч із навичками, замороженими через `clawhub pin`, включно з необов’язковою причиною.

### `pin <skill>`

- Позначає встановлену навичку як закріплену в lockfile.
- `--reason <text>` записує, чому навичку заморожено.
- Закріплені навички пропускаються `update --all` і відхиляються прямим `update <skill>`.
- Закріплені навички також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <skill>`

- Вилучає закріплення lockfile з установленої навички, щоб майбутні оновлення могли її змінювати.

### `update [@owner/slug]` / `update --all`

- Обчислює fingerprint із локальних файлів.
- Якщо fingerprint відповідає відомій версії: без підказки.
- Якщо fingerprint не відповідає:
  - типово відмовляється
  - перезаписує з `--force` (або після підказки, якщо інтерактивно)
- Закріплені навички ніколи не оновлюються через `--force`.
- `update <skill>` швидко завершується помилкою для закріплених навичок і повідомляє спочатку виконати `clawhub unpin <skill>`.
- `update --all` пропускає закріплені slug і друкує зведення того, що лишилося замороженим.

### `skill publish <path>`

- Порівнює fingerprint локального пакета з ClawHub і успішно завершується, коли
  вміст уже опубліковано.
- Нові навички типово отримують `1.0.0`; змінені навички типово отримують наступну patch-
  версію.
- `--version <version>` явно вибирає версію та публікує навіть тоді, коли
  вміст збігається з наявною версією.
- `--dry-run` визначає публікацію без завантаження; `--json` друкує
  машиночитаний результат.
- `--owner <handle>` публікує від імені handle видавця org/user, коли
  актор має доступ видавця.
- `--migrate-owner` переміщує наявну навичку до `--owner` під час публікації нової
  версії. Потребує доступу admin/owner для обох видавців.
- Поведінку власника та перевірки пояснено в `docs/publishing.md`.
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

Багаторазово використовуваний робочий процес ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
викликає `skill publish` для одного `skill_path` або для кожної безпосередньої папки навички
під `root` (типово: `skills`). Він пропускає незмінені навички та використовує
ту саму автоматичну поведінку patch-версій.

Задайте `dry_run: true`, щоб переглянути попередній результат без токена. Реальні публікації потребують
секрету `clawhub_token`.

### `sync`

- Сканує поточний workdir, налаштований каталог навичок і будь-які
  папки `--root <dir>` на наявність локальних папок навичок, що містять `SKILL.md` або
  `skill.md`.
- Порівнює fingerprint кожної локальної навички з ClawHub і публікує лише нові або
  змінені навички.
- Нові навички публікуються як `1.0.0`; змінені навички типово публікують наступну patch-версію.
  Використовуйте `--bump minor|major` для пакетів оновлень, які мають перейти на
  більший крок semver.
- `--dry-run` показує план публікації без завантаження; `--json` друкує
  машиночитаний план.
- `--all` публікує кожну нову або змінену навичку без підказок. Без
  `--all` інтерактивні термінали дають змогу вибрати навички для публікації.
- `--owner <handle>` публікує від імені handle видавця org/user, коли
  актор має доступ видавця.
- `sync` є лише односторонньою публікацією. Він не встановлює, не оновлює, не завантажує і не
  повідомляє телеметрію встановлень/завантажень.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Потребує `clawhub login`.
- Запускає ClawHub ClawScan через `POST /api/v1/skills/-/scan`, потім опитує, доки сканування не стане термінальним.
- Сканування асинхронні й можуть потребувати часу для завершення. Під час перебування в черзі спінер термінала показує поточну пріоритетну позицію сканування та скільки сканувань попереду.
- Опубліковані сканування потребують доступу власника або керування видавцем. Модератори/admins можуть використовувати той самий backend через `clawhub-admin`.
- `--update` чинний лише з `--slug`; він записує успішні результати опублікованого сканування назад до вибраної версії.
- `--output <file.zip>` завантажує повний архів звіту з `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.
- `--json` друкує повну відповідь опитування для автоматизації.
- Сканування локального шляху більше не підтримуються. Завантажте нову версію, потім використайте `scan download`, щоб отримати збережені результати сканування для цієї поданої версії.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Потребує `clawhub login`.
- Завантажує збережений ZIP-звіт сканування для поданої версії навички або Plugin, включно з версіями, які були заблоковані або приховані перевірками безпеки ClawHub.
- Завантаження навичок використовують slug навички й типово мають `--kind skill`.
- Завантаження Plugin використовують назву пакета й потребують `--kind plugin`.
- `--version` обов’язковий, щоб автори переглядали точну подану версію, яку ClawHub заблокував.
- `--output <file.zip>` вибирає шлях призначення.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub постачає офіційний багаторазово використовуваний робочий процес за адресою
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/bdb23c3a9ffe77cb4184fdd13897ce535fb2d703/.github/workflows/skill-publish.yml)
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

- `root` типово дорівнює `skills` для репозиторіїв каталогів.
- Передайте `skill_path: skills/review-helper`, щоб обробити одну папку навички.
- `owner` відповідає прапорцю CLI `--owner`; пропустіть його, щоб публікувати як автентифікований користувач.
- Публікація навичок V1 використовує `clawhub_token`; довірена публікація GitHub OIDC наразі доступна лише для пакетів.

### `delete <skill>`

- Без `--version` м’яко видаляє навичку (власник, модератор або адміністратор).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда виводить час завершення резервування.
- `--version <version>` остаточно видаляє одну власну не найновішу версію через fail-closed,
  маршрут, специфічний для версії.
  Видалені версії не можна відновити або опублікувати повторно. Опублікуйте заміну перед видаленням
  поточної найновішої версії. Працівники платформи не обходять право власності для цього потоку лише для версій.
- `--reason <text>` записує примітку модерації для м’якого видалення всієї навички та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <skill>`

- Відновлює приховану навичку (власник, модератор або адміністратор).
- Відновлення версії не підтримується; остаточно видалені версії не можна відновити.
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує примітку модерації для навички та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <skill>`

- Приховує навичку (власник, модератор або адміністратор).
- Псевдонім для `delete`.

### `unhide <skill>`

- Скасовує приховування навички (власник, модератор або адміністратор).
- Псевдонім для `undelete`.

### `skill rename <skill> <new-name>`

- Перейменовує власну навичку та зберігає попередній slug як псевдонім перенаправлення.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source> <target>`

- Об’єднує одну власну навичку з іншою власною навичкою.
- Вихідний slug припиняє публічно відображатися та стає псевдонімом перенаправлення на ціль.
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
- Використовуйте це для plugins та інших записів сімейства пакетів; верхньорівнева команда `search` залишається поверхнею пошуку навичок.
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
- Використовуйте це для метаданих Plugin, сумісності, перевірки, джерела та інспекції версій/файлів.
- `--version <version>`: інспектувати конкретну версію (типово: latest).
- `--tag <tag>`: інспектувати версію з тегом (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машинозчитуваний вивід.

### `package download <name>`

- Розв’язує версію пакета через
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
  - `--json`: машинозчитуваний вивід.

Приклади:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Обчислює ClawHub SHA-256, цілісність npm `sha512` і npm shasum для локального
  артефакту.
- З `--package` розв’язує очікувані метадані з ClawHub і порівнює
  локальний файл із метаданими опублікованого артефакту.
- З прямими прапорцями дайджесту перевіряє без мережевого запиту.
- Прапорці:
  - `--package <name>`: назва пакета для розв’язання очікуваних метаданих артефакту.
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

- Запускає вбудований у ClawHub CLI Plugin Inspector для локальної теки пакета Plugin.
- Типово виконує офлайн/статичну перевірку, без пошуку або імпорту локального
  checkout OpenClaw.
- Критичні помилки сумісності завершуються ненульовим кодом. Попередження лише друкуються, але
  завершуються нульовим кодом.
- Прапорці:
  - `--out <dir>`: записати звіти Plugin Inspector до цього каталогу.
  - `--openclaw <path>`: інспектувати відносно явного локального checkout OpenClaw.
  - `--runtime`: увімкнути захоплення runtime; імпортує код Plugin.
  - `--allow-execute`: дозволити захоплення runtime в ізольованому робочому просторі.
  - `--no-mock-sdk`: вимкнути імітований OpenClaw SDK під час захоплення runtime.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package validate ./example-plugin
```

Якщо перевірка повідомляє про знахідку щодо пакета, маніфесту, імпорту SDK або артефакту, див.
[виправлення перевірки Plugin](/uk/clawhub/plugin-validation-fixes), а потім повторно запустіть команду.

### `package delete <name>`

- Без `--version` м’яко видаляє пакет і всі релізи.
- `--version <version>` остаточно видаляє один власний не найновіший реліз через fail-closed,
  маршрут, специфічний для версії.
  Видалені версії не можна відновити або опублікувати повторно. Опублікуйте заміну перед видаленням
  поточної найновішої версії. Цей потік лише для версій потребує власника пакета або
  адміністратора видавця організації; працівники платформи не обходять право власності на пакет.
- М’яке видалення всього пакета потребує власника пакета, власника/адміністратора видавця організації, модератора платформи
  або адміністратора платформи.
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

- Відновлює м’яко видалений пакет і релізи.
- Відновлення версії не підтримується; остаточно видалені версії не можна відновити.
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
- Потребує адміністраторського доступу і до поточного власника пакета, і до видавця
  призначення, якщо це не виконує адміністратор платформи.
- Імена пакетів із scope мають передаватися відповідному власнику scope.
- Викликає `POST /api/v1/packages/{name}/transfer`.
- Прапорці:
  - `--to <owner>`: handle видавця призначення.
  - `--reason <text>`: необов’язкова причина для аудиту.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Автентифікована команда для повідомлення модераторам про пакет.
- Викликає `POST /api/v1/packages/{name}/report`.
- Повідомлення стосуються рівня пакета, можуть бути необов’язково прив’язані до версії та стають видимими
  модераторам для розгляду.
- Повідомлення самі собою не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета, яку потрібно прикріпити до повідомлення.
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
  модерації найновішого релізу, стан блокування завантажень і причини модерації.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Перевіряє, чи пакет готовий до майбутнього споживання OpenClaw.
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
  вбудований Plugin OpenClaw.
- Викликає ту саму обчислену кінцеву точку готовності, що й `package readiness`, але друкує
  сфокусований на міграції стан, найновішу версію, стан офіційного пакета, перевірки та
  блокери.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Створює видавця організації, власником якого є автентифікований користувач.
- Handle нормалізується до нижнього регістру, і його можна передавати з `@` або без нього.
- Новостворені видавці організацій типово не є довіреними/офіційними.
- Завершується помилкою, якщо handle уже використовується наявним видавцем, користувачем або зарезервованим маршрутом.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Публікує кодовий Plugin або bundle Plugin через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  справжніх маркерів bundle OpenClaw, як-от `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` розглядаються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для валідації та
  попереднього заповнення метаданих.
- Папки кодових Plugin пакуються в npm tarball ClawPack перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки bundle Plugin усе ще
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, визначеного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли origin remote вказує на GitHub.
- Зовнішні кодові Plugin мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як fallback для валідації публікації.
- `--dry-run` показує попередній перегляд визначеного payload публікації без завантаження.
- `--json` виводить машиночитний результат для CI.
- `--owner <handle>` публікує під handle видавця користувача або організації, коли актор має доступ видавця.
- Імена scoped package мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендований локальний потік

Спочатку використайте `--dry-run`, щоб підтвердити визначені метадані пакета й
атрибуцію джерела перед створенням реального релізу:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Потік локальної папки

Для кодових Plugin публікація папки створює й завантажує артефакт ClawPack з
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім кодовим Plugin потрібна невелика кількість метаданих OpenClaw у
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
- `openclaw.hostTargets` і `openclaw.environment` — необов’язкові метадані.
  ClawHub може показувати їх, коли вони присутні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додаткові поля, якщо ви хочете опублікувати
  докладніші метадані сумісності.
- Якщо ви використовуєте старіший реліз CLI `clawhub`, оновіться перед публікацією, щоб
  локальні preflight-перевірки запускалися перед завантаженням.
- Якщо валідація повідомляє код виправлення, див.
  [Виправлення валідації Plugin](/uk/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub також постачає офіційний reusable workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/bdb23c3a9ffe77cb4184fdd13897ce535fb2d703/.github/workflows/package-publish.yml)
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

- Reusable workflow за замовчуванням встановлює `source` на репозиторій виклику.
- Для monorepo передайте `source_path`, щоб workflow публікував папку пакета
  Plugin, наприклад `source_path: extensions/codex`.
- Закріпіть reusable workflow на стабільному тегу або повному SHA коміту. Не запускайте публікацію релізів з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не створював забруднювальних змін.
- Реальні публікації мають бути обмежені довіреними подіями, як-от `workflow_dispatch` або push тегів.
- Довірена публікація без секрету працює лише для `workflow_dispatch`; push тегів усе ще потребує `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, недовірених пакетів або аварійних публікацій.
- Workflow завантажує JSON-результат як артефакт і надає його як outputs workflow.

### `package trusted-publisher get <name>`

- Показує конфігурацію довіреного видавця GitHub Actions для пакета.
- Використовуйте це після налаштування конфігурації, щоб підтвердити репозиторій, назву файлу workflow
  і необов’язкове закріплення середовища.
- Прапорці:
  - `--json`: машиночитний результат.

Приклад:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Додає або замінює конфігурацію довіреного видавця GitHub Actions для наявного
  пакета.
- Пакет спочатку має бути створений через звичайну ручну або token-authenticated
  `clawhub package publish`.
- Після встановлення конфігурації майбутні підтримувані публікації GitHub Actions можуть використовувати
  OIDC/довірену публікацію без довгострокового токена ClawHub.
- `--repository <repo>` має бути `owner/repo`.
- `--workflow-filename <file>` має відповідати імені файлу workflow у
  `.github/workflows/`.
- `--environment <name>` є необов’язковим. Коли його налаштовано, середовище GitHub Actions
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
  - `--json`: машиночитний результат.

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
- Майбутні реальні публікації мають використовувати звичайну автентифіковану публікацію, доки конфігурацію не буде
  встановлено знову.
- Прапорці:
  - `--json`: машиночитний результат.

Приклад:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Телеметрія інсталяції

- Надсилається після `clawhub install <slug>`, коли користувач увійшов у систему, якщо
  `CLAWHUB_DISABLE_TELEMETRY=1` не встановлено.
- Звітування виконується за принципом best-effort. Команди інсталяції не завершуються з помилкою, якщо телеметрія
  недоступна.
- Докладніше: `docs/telemetry.md`.
