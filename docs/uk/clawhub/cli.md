---
read_when:
    - Використання CLI ClawHub
    - Налагодження встановлення, оновлення або публікації
summary: 'Довідник CLI: команди, прапорці, конфігурація та поведінка lockfile.'
x-i18n:
    generated_at: "2026-07-03T17:39:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
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
- `--dir <dir>`: каталог встановлення під workdir (типово: `skills`)
- `--site <url>`: базова URL-адреса для входу через браузер (типово: `https://clawhub.ai`)
- `--registry <url>`: базова URL-адреса API (типово: виявлена, інакше `https://clawhub.ai`)
- `--no-input`: вимкнути запити

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

Коли будь-яку з цих змінних установлено, CLI спрямовує вихідні запити через
зазначений проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується, щоб обходити проксі для
певних хостів або доменів.

Це потрібно в системах, де прямі вихідні з’єднання заблоковано
(наприклад, контейнери Docker, Hetzner VPS з інтернетом лише через проксі,
корпоративні фаєрволи).

Приклад:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Коли змінну проксі не встановлено, поведінка не змінюється (прямі з’єднання).

## Файл конфігурації

Зберігає ваш API-токен + кешовану URL-адресу реєстру.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` або `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Застарілий резервний шлях: якщо `clawhub/config.json` ще не існує, але існує `clawdhub/config.json`, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застаріле `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- Типово: відкриває браузер на `<site>/cli/auth` і завершує через loopback callback.
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
- Вивід містить slug навички, handle власника, відображуване ім’я та оцінку релевантності.
- Пошук віддає перевагу точним збігам токенів slug/імені перед популярністю завантажень. Окремий токен slug, як-от `map`, відповідає `personal-map` сильніше, ніж підрядку всередині `amap`.
- Популярність є невеликим попереднім чинником ранжування, а не гарантією верхньої позиції.
- Якщо навичка має з’являтися, але не з’являється, виконайте `clawhub inspect @owner/slug` після входу, щоб перевірити видимі власнику діагностики модерації перед перейменуванням метаданих.

### `explore`

- Перелічує найновіші навички через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` спадно).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|rating|downloads|trending` (типово: newest). Застарілі псевдоніми сортування встановлення все ще працюють для сумісності.
  - `--json` (машиночитний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізається до 50 символів).

### `inspect @owner/slug`

- Отримує метадані навички та файли версії без встановлення.
- `--version <version>`: перевірити конкретну версію (типово: latest).
- `--tag <tag>`: перевірити позначену тегом версію (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-200).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; обмеження 200 КБ).
- `--json`: машиночитний вивід.

### `install @owner/slug`

- Визначає latest-версію для вказаного власника й навички.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені навички; спочатку виконайте `clawhub unpin <skill>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застаріле `.clawdhub`)

### `uninstall <skill>`

- Видаляє `<workdir>/<dir>/<slug>` і запис із lockfile.
- Надсилає telemetry за принципом best-effort після входу, щоб поточні лічильники встановлень можна було
  деактивувати.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): потребує `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`).
- Показує `pinned` поруч із навичками, замороженими через `clawhub pin`, включно з необов’язковою причиною.

### `pin <skill>`

- Позначає встановлену навичку як закріплену в lockfile.
- `--reason <text>` записує, чому навичку заморожено.
- Закріплені навички пропускаються `update --all` і відхиляються прямим `update <skill>`.
- Закріплені навички також відхиляють `install --force`, щоб локальні байти не могли бути випадково замінені.

### `unpin <skill>`

- Видаляє закріплення lockfile зі встановленої навички, щоб майбутні оновлення могли її змінювати.

### `update [@owner/slug]` / `update --all`

- Обчислює fingerprint з локальних файлів.
- Якщо fingerprint збігається з відомою версією: без запиту.
- Якщо fingerprint не збігається:
  - типово відмовляється
  - перезаписує з `--force` (або запитом, якщо інтерактивно)
- Закріплені навички ніколи не оновлюються через `--force`.
- `update <skill>` швидко завершується помилкою для закріплених навичок і повідомляє спочатку виконати `clawhub unpin <skill>`.
- `update --all` пропускає закріплені slug і друкує підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Порівнює fingerprint локального bundle з ClawHub і успішно завершується, коли
  вміст уже опубліковано.
- Нові навички типово отримують `1.0.0`; змінені навички типово отримують наступну patch-
  версію.
- `--version <version>` явно вибирає версію та публікує навіть тоді, коли
  вміст збігається з наявною версією.
- `--dry-run` визначає публікацію без завантаження; `--json` друкує
  машиночитний результат.
- `--owner <handle>` публікує під handle видавця org/user, коли
  actor має доступ видавця.
- `--migrate-owner` переносить наявну навичку до `--owner` під час публікації нової
  версії. Потребує доступу admin/owner в обох видавців.
- Поведінку власника та перевірки пояснено в `docs/publishing.md`.
- Публікація навички означає, що вона випущена на ClawHub під `MIT-0`.
- Опубліковані навички можна безкоштовно використовувати, змінювати й поширювати без зазначення авторства.
- ClawHub не підтримує платні навички або ціноутворення за окремі навички.
- Застарілий псевдонім: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Багаторазово використовуваний workflow ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
викликає `skill publish` для одного `skill_path` або для кожної безпосередньої папки навички
під `root` (типово: `skills`). Він пропускає незмінені навички та використовує
таку саму автоматичну поведінку patch-версій.

Установіть `dry_run: true`, щоб попередньо переглянути без токена. Реальні публікації потребують
секрет `clawhub_token`.

### `sync`

- Сканує поточний workdir, налаштований каталог навичок і будь-які
  папки `--root <dir>` на локальні папки навичок, що містять `SKILL.md` або
  `skill.md`.
- Порівнює fingerprint кожної локальної навички з ClawHub і публікує лише нові або
  змінені навички.
- Нові навички публікуються як `1.0.0`; змінені навички типово публікуються як наступна patch-версія.
  Використовуйте `--bump minor|major` для пакетів оновлень, які мають перейти на
  більший крок semver.
- `--dry-run` показує план публікації без завантаження; `--json` друкує
  машиночитний план.
- `--all` публікує кожну нову або змінену навичку без запиту. Без
  `--all` інтерактивні термінали дають змогу вибрати навички для публікації.
- `--owner <handle>` публікує під handle видавця org/user, коли
  actor має доступ видавця.
- `sync` є лише односторонньою публікацією. Він не встановлює, не оновлює, не завантажує і не
  повідомляє telemetry встановлень/завантажень.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Потребує `clawhub login`.
- Запускає ClawHub ClawScan через `POST /api/v1/skills/-/scan`, потім опитує, доки scan не стане terminal.
- Scans є асинхронними й можуть потребувати часу для завершення. Поки вони в черзі, terminal spinner показує поточну пріоритетну позицію scan і скільки scans попереду.
- Опубліковані scans потребують права власності або доступу до керування видавцем. Модератори/admins можуть використовувати той самий backend через `clawhub-admin`.
- `--update` чинний лише з `--slug`; він записує успішні результати опублікованого scan назад у вибрану версію.
- `--output <file.zip>` завантажує повний архів звіту з `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` і `README.md`.
- `--json` друкує повну відповідь опитування для автоматизації.
- Сканування локального шляху більше не підтримується. Завантажте нову версію, потім використайте `scan download`, щоб отримати збережені результати scan для цієї поданої версії.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Потребує `clawhub login`.
- Завантажує збережений ZIP-звіт scan для поданої версії навички або plugin, включно з версіями, які були заблоковані або приховані перевірками безпеки ClawHub.
- Завантаження навичок використовують slug навички та типово мають `--kind skill`.
- Завантаження Plugin використовують назву пакета та потребують `--kind plugin`.
- `--version` є обов’язковим, щоб автори перевіряли точну подану версію, яку ClawHub заблокував.
- `--output <file.zip>` вибирає шлях призначення.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub постачає офіційний багаторазово використовуваний workflow за адресою
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
для репозиторіїв навичок і репозиторіїв catalog.

Типове налаштування catalog:

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

- `root` типово дорівнює `skills` для репозиторіїв catalog.
- Передайте `skill_path: skills/review-helper`, щоб обробити одну папку навички.
- `owner` відповідає прапорцю CLI `--owner`; пропустіть його, щоб публікувати як автентифікований користувач.
- Публікація навичок V1 використовує `clawhub_token`; trusted publishing через GitHub OIDC наразі доступний лише для пакетів.

### `delete <skill>`

- Без `--version` м’яко видалити навичку (власник, модератор або адміністратор).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда виводить час завершення резервування.
- `--version <version>` остаточно видаляє одну власну не найновішу версію через fail-closed,
  специфічний для версії маршрут.
  Видалені версії не можна відновити або повторно опублікувати. Опублікуйте заміну перед видаленням
  поточної найновішої версії. Працівники платформи не обходять право власності для цього потоку лише для версії.
- `--reason <text>` записує примітку модерації для м’якого видалення всієї навички та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <skill>`

- Відновити приховану навичку (власник, модератор або адміністратор).
- Відновлення версії не існує; остаточно видалені версії не можна відновити.
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує примітку модерації для навички та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <skill>`

- Приховати навичку (власник, модератор або адміністратор).
- Псевдонім для `delete`.

### `unhide <skill>`

- Скасувати приховування навички (власник, модератор або адміністратор).
- Псевдонім для `undelete`.

### `skill rename <skill> <new-name>`

- Перейменувати власну навичку й зберегти попередній slug як псевдонім перенаправлення.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source> <target>`

- Об’єднати одну власну навичку з іншою власною навичкою.
- Вихідний slug припиняє публічно відображатися й стає псевдонімом перенаправлення до цільової навички.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Робочий процес передавання права власності.
- Передавання до handle користувачів створює запит в очікуванні, який одержувач приймає.
- Передавання до handle організацій/видавців застосовується негайно лише тоді, коли виконавець має
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
- Використовуйте це для plugins та інших записів родини пакетів; верхньорівнева команда `search` залишається поверхнею пошуку навичок.
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
- Використовуйте це для метаданих plugin, сумісності, перевірки, джерела та інспекції версій/файлів.
- `--version <version>`: інспектувати конкретну версію (типово: latest).
- `--tag <tag>`: інспектувати версію з тегом (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файлу (лише текстові файли; обмеження 200 КБ).
- `--json`: машинозчитуваний вивід.

### `package download <name>`

- Визначає версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує артефакт із `downloadUrl` резолвера.
- Перевіряє ClawHub SHA-256 для всіх артефактів.
- Для артефактів ClawPack npm-pack також перевіряє цілісність npm `sha512`,
  npm shasum і name/version у `package.json` tarball.
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
- З прямими прапорцями digest перевіряє без мережевого запиту.
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

- Запускає вбудований у ClawHub CLI Plugin Inspector для локальної теки пакета plugin.
- Типово виконує офлайн/статичну перевірку без пошуку або імпорту локального
  checkout OpenClaw.
- Жорсткі помилки сумісності завершуються ненульовим кодом. Знахідки лише з попередженнями виводяться, але
  завершуються з нульовим кодом.
- Прапорці:
  - `--out <dir>`: записати звіти Plugin Inspector у цей каталог.
  - `--openclaw <path>`: інспектувати щодо явного локального checkout OpenClaw.
  - `--runtime`: увімкнути захоплення runtime; імпортує код plugin.
  - `--allow-execute`: дозволити захоплення runtime в ізольованому робочому просторі.
  - `--no-mock-sdk`: вимкнути мокований OpenClaw SDK під час захоплення runtime.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package validate ./example-plugin
```

Якщо перевірка повідомляє знахідку щодо пакета, маніфесту, імпорту SDK або артефакту, див.
[виправлення перевірки Plugin](/clawhub/plugin-validation-fixes), а потім повторно запустіть команду.

### `package delete <name>`

- Без `--version` м’яко видаляє пакет і всі релізи.
- `--version <version>` остаточно видаляє один власний не найновіший реліз через fail-closed,
  специфічний для версії маршрут.
  Видалені версії не можна відновити або повторно опублікувати. Опублікуйте заміну перед видаленням
  поточної найновішої версії. Цей потік лише для версії вимагає власника пакета або адміністратора видавця організації; працівники платформи не обходять право власності на пакет.
- М’яке видалення всього пакета вимагає власника пакета, власника/адміністратора видавця організації, модератора платформи
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
- Відновлення версії не існує; остаточно видалені версії не можна відновити.
- Вимагає власника пакета, власника/адміністратора видавця організації, модератора платформи
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
- Вимагає адміністративного доступу і до поточного власника пакета, і до цільового
  видавця, якщо це не виконує адміністратор платформи.
- Назви scoped packages потрібно передавати відповідному власнику scope.
- Викликає `POST /api/v1/packages/{name}/transfer`.
- Прапорці:
  - `--to <owner>`: handle цільового видавця.
  - `--reason <text>`: необов’язкова причина аудиту.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Автентифікована команда для повідомлення модераторам про пакет.
- Викликає `POST /api/v1/packages/{name}/report`.
- Повідомлення діють на рівні пакета, можуть бути прив’язані до версії й стають видимими
  модераторам для розгляду.
- Повідомлення самі по собі не приховують пакети автоматично й не блокують завантаження.
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
- Повідомляє про блокери для офіційного статусу, доступності ClawPack, digest артефакту,
  походження джерела, сумісності з OpenClaw, цільових хостів, метаданих середовища
  і стану сканування.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Показує орієнтований на оператора стан міграції для пакета, який може замінити
  вбудований OpenClaw plugin.
- Викликає ту саму обчислену кінцеву точку готовності, що й `package readiness`, але виводить
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
- Handle нормалізується до нижнього регістру й може передаватися з `@` або без нього.
- Новостворені видавці організацій типово не є довіреними/офіційними.
- Завершується помилкою, якщо handle уже використовується наявним видавцем, користувачем або зарезервованим маршрутом.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Публікує кодовий plugin або bundle plugin через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний tarball ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  справжніх маркерів bundle OpenClaw, таких як `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` обробляються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для валідації та
  попереднього заповнення метаданих.
- Папки кодових plugins пакуються в tarball ClawPack npm перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки bundle plugins і далі
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, визначеного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли origin remote вказує на GitHub.
- Зовнішні кодові plugins мають явно оголосити `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як fallback для валідації публікації.
- `--dry-run` попередньо показує визначене корисне навантаження публікації без завантаження.
- `--json` виводить машинозчитуваний результат для CI.
- `--owner <handle>` публікує під handle видавця користувача або організації, коли actor має доступ видавця.
- Імена scoped packages мають відповідати вибраному owner. Див. `docs/publishing.md`.
- Наявні flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендований локальний процес

Спочатку використайте `--dry-run`, щоб підтвердити визначені метадані пакета й
атрибуцію джерела перед створенням реального release:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процес для локальної папки

Для кодових plugins публікація папки створює та завантажує артефакт ClawPack з
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім кодовим plugins потрібна невелика кількість метаданих OpenClaw у
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

- `package.json.version` — це release version вашого пакета, але вона не використовується як
  fallback для валідації сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` — необов’язкові метадані.
  ClawHub може показувати їх, якщо вони наявні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додаткові поля, якщо ви хочете опублікувати
  докладніші метадані сумісності.
- Якщо ви використовуєте старіший release CLI `clawhub`, оновіться перед публікацією, щоб
  локальні preflight checks виконувалися перед завантаженням.
- Якщо валідація повідомляє код remediation, див.
  [Виправлення валідації Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub також постачає офіційний reusable workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
для репозиторіїв plugins.

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

- Reusable workflow за замовчуванням задає `source` як репозиторій caller.
- Для monorepos передайте `source_path`, щоб workflow публікував папку пакета plugin,
  наприклад `source_path: extensions/codex`.
- Pin reusable workflow до стабільного tag або повного commit SHA. Не запускайте release publishing з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не створював зайвих змін.
- Справжні публікації слід обмежити trusted events, такими як `workflow_dispatch` або tag pushes.
- Trusted publishing без secret працює лише на `workflow_dispatch`; tag pushes усе ще потребують `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, untrusted packages або break-glass publishes.
- Workflow завантажує JSON-результат як артефакт і надає його як workflow outputs.

### `package trusted-publisher get <name>`

- Показує конфігурацію trusted publisher GitHub Actions для пакета.
- Використовуйте це після налаштування конфігурації, щоб підтвердити репозиторій, назву workflow-файлу
  і необов’язковий environment pin.
- Flags:
  - `--json`: машинозчитуваний результат.

Приклад:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Приєднує або замінює конфігурацію trusted publisher GitHub Actions для наявного
  пакета.
- Пакет спочатку має бути створений через звичайну ручну або token-authenticated
  `clawhub package publish`.
- Після налаштування конфігурації майбутні підтримувані публікації GitHub Actions можуть використовувати
  OIDC/trusted publishing без довгоживучого token ClawHub.
- `--repository <repo>` має бути `owner/repo`.
- `--workflow-filename <file>` має відповідати імені workflow-файлу в
  `.github/workflows/`.
- `--environment <name>` є необов’язковим. Коли налаштовано, environment GitHub Actions
  у claim OIDC має точно збігатися.
- ClawHub перевіряє налаштований репозиторій GitHub під час виконання цієї команди.
  Публічні репозиторії можна перевірити через публічні метадані GitHub. Приватні
  репозиторії потребують, щоб ClawHub мав доступ GitHub до цього репозиторію, наприклад
  через майбутню інсталяцію GitHub App ClawHub або іншу авторизовану
  інтеграцію GitHub.
- Flags:
  - `--repository <repo>`: репозиторій GitHub, наприклад `openclaw/example-plugin`.
  - `--workflow-filename <file>`: назва workflow-файлу, наприклад `package-publish.yml`.
  - `--environment <name>`: необов’язковий environment GitHub Actions із точним збігом.
  - `--json`: машинозчитуваний результат.

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
- Майбутні справжні публікації мають використовувати звичайну authenticated publishing, доки конфігурацію не буде
  налаштовано знову.
- Flags:
  - `--json`: машинозчитуваний результат.

Приклад:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Телеметрія інсталяції

- Надсилається після `clawhub install <slug>` після входу в систему, якщо
  не задано `CLAWHUB_DISABLE_TELEMETRY=1`.
- Звітування виконується за принципом best-effort. Команди install не завершуються помилкою, якщо телеметрія
  недоступна.
- Докладніше: `docs/telemetry.md`.
