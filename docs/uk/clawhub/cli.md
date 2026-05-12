---
read_when:
    - Використання CLI ClawHub
    - Налагодження встановлення, оновлення, публікації або синхронізації
summary: 'Довідник CLI: команди, прапорці, конфігурація, lock-файл, поведінка синхронізації.'
x-i18n:
    generated_at: "2026-05-12T04:09:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42231f76dee1ffc66585e72ce3d370658a362225ad858e7c72726f991287aa2
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

- `--workdir <dir>`: робочий каталог (типово: cwd; повертається до робочого простору Clawdbot, якщо його налаштовано)
- `--dir <dir>`: каталог встановлення в межах workdir (типово: `skills`)
- `--site <url>`: базовий URL для входу через браузер (типово: `https://clawhub.ai`)
- `--registry <url>`: базовий URL API (типово: виявлений, інакше `https://clawhub.ai`)
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

Коли встановлено будь-яку з цих змінних, CLI спрямовує вихідні запити через
вказаний проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується для обходу проксі для
певних хостів або доменів.

Це потрібно в системах, де прямі вихідні з’єднання заблоковано
(наприклад, Docker-контейнери, Hetzner VPS з інтернетом лише через проксі,
корпоративні брандмауери).

Приклад:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Коли жодну змінну проксі не встановлено, поведінка не змінюється (прямі з’єднання).

## Файл конфігурації

Зберігає ваш API-токен і кешований URL реєстру.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` або `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Застарілий резервний варіант: якщо `clawhub/config.json` ще не існує, але існує `clawdhub/config.json`, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застарілий `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- Типово: відкриває браузер на `<site>/cli/auth` і завершує через зворотний виклик loopback.
- Headless: `clawhub login --token clh_...`
- Віддалений/headless інтерактивний режим: `clawhub login --device` виводить код і чекає, доки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Додає/видаляє Skills з ваших виділених.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Пошук надає перевагу точним збігам токенів slug/name перед популярністю завантажень. Окремий токен slug, як-от `map`, збігається з `personal-map` сильніше, ніж підрядок усередині `amap`.
- Завантаження є невеликим попереднім показником популярності, а не гарантією найвищого місця.
- Якщо Skills має з’являтися, але не з’являється, виконайте `clawhub inspect <slug>` після входу, щоб перевірити видиму власнику діагностику модерації перед перейменуванням метаданих.

### `explore`

- Перелічує найновіші Skills через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` за спаданням).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (типово: newest)
  - `--json` (машиночитаний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізається до 50 символів).

### `inspect <slug>`

- Отримує метадані Skills і файли версії без встановлення.
- `--version <version>`: перевірити певну версію (типово: latest).
- `--tag <tag>`: перевірити позначену тегом версію (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для списку (1-200).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файлу (лише текстові файли; обмеження 200 КБ).
- `--json`: машиночитаний вивід.

### `install <slug>`

- Визначає найновішу версію через `/api/v1/skills/<slug>`.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені Skills; спочатку виконайте `clawhub unpin <slug>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застарілий `.clawdhub`)

### `uninstall <slug>`

- Видаляє `<workdir>/<dir>/<slug>` і видаляє запис із lockfile.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): потребує `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`).
- Показує `pinned` поруч із навичками, замороженими за допомогою `clawhub pin`, зокрема необов’язкову причину.

### `pin <slug>`

- Позначає встановлену навичку як закріплену у lockfile.
- `--reason <text>` записує, чому навичку заморожено.
- Закріплені навички пропускаються `update --all` і відхиляються прямим `update <slug>`.
- Закріплені навички також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <slug>`

- Видаляє закріплення з lockfile для встановленої навички, щоб майбутні оновлення могли її змінювати.

### `update [slug]` / `update --all`

- Обчислює відбиток із локальних файлів.
- Якщо відбиток збігається з відомою версією: без запиту.
- Якщо відбиток не збігається:
  - відмовляє за замовчуванням
  - перезаписує з `--force` (або після запиту, якщо інтерактивно)
- Закріплені навички ніколи не оновлюються через `--force`.
- `update <slug>` швидко завершується помилкою для закріплених slug і повідомляє спочатку виконати `clawhub unpin <slug>`.
- `update --all` пропускає закріплені slug і друкує підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Публікує через `POST /api/v1/skills` (multipart).
- Потребує semver: `--version 1.2.3`.
- `--owner <handle>` публікує під handle видавця організації/користувача, коли
  актор має доступ видавця.
- `--migrate-owner` переносить наявну навичку до `--owner` під час публікації нової
  версії. Потребує доступу адміністратора/власника в обох видавців.
- Поведінку власника й перевірки пояснено в `docs/publishing.md`.
- Публікація навички означає, що її випущено під `MIT-0` на ClawHub.
- Опубліковані навички можна вільно використовувати, змінювати й поширювати без зазначення авторства.
- ClawHub не підтримує платні навички або ціноутворення для окремих навичок.
- `--clawscan-note <text>` додає примітку ClawScan. Ця примітка надає ClawScan
  контекст для поведінки, яка інакше може виглядати незвично, як-от доступ до мережі,
  доступ до нативного хоста або облікові дані, специфічні для провайдера. Примітка зберігається у
  опублікованій версії.
- Застарілий псевдонім: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- М’яко видаляє навичку (власник, модератор або адміністратор).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда друкує час завершення резервування.
- `--reason <text>` записує примітку модерації для навички та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <slug>`

- Відновлює приховану навичку (власник, модератор або адміністратор).
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує примітку модерації для навички та журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <slug>`

- Приховує навичку (власник, модератор або адміністратор).
- Псевдонім для `delete`.

### `unhide <slug>`

- Скасовує приховування навички (власник, модератор або адміністратор).
- Псевдонім для `undelete`.

### `skill rename <slug> <new-slug>`

- Перейменовує власну навичку й зберігає попередній slug як псевдонім перенаправлення.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source-slug> <target-slug>`

- Об’єднує одну власну навичку з іншою власною навичкою.
- Вихідний slug припиняє відображатися публічно й стає псевдонімом перенаправлення до цільового.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Робочий процес передавання права власності.
- Передавання до handle користувачів створює запит в очікуванні, який отримувач приймає.
- Передавання до handle організацій/видавців застосовуються негайно лише тоді, коли актор має
  доступ адміністратора і до поточного власника, і до видавця призначення.
- Підкоманди:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Кінцеві точки:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Переглядає або шукає в уніфікованому каталозі пакетів через `GET /api/v1/packages` і `GET /api/v1/packages/search`.
- Використовуйте це для plugins та інших записів сімейств пакетів; верхньорівневий `search` залишається поверхнею пошуку навичок.
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
  - `--limit <n>` (1-100, за замовчуванням: 25)
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
- `--version <version>`: інспектувати конкретну версію (за замовчуванням: найновіша).
- `--tag <tag>`: інспектувати версію з тегом (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файла (лише текстові файли; ліміт 200 КБ).
- `--json`: машинозчитуваний вивід.

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
  - `--tag <tag>`: завантажити версію з тегом (за замовчуванням: `latest`).
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
  артефакта.
- З `--package` визначає очікувані метадані з ClawHub і порівнює
  локальний файл із метаданими опублікованого артефакта.
- З прямими прапорцями дайджесту перевіряє без мережевого пошуку.
- Прапорці:
  - `--package <name>`: назва пакета для визначення очікуваних метаданих артефакта.
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

### `package delete <name>`

- М’яко видаляє пакет і всі релізи.
- Потребує власника пакета, власника/адміністратора видавця організації, модератора платформи
  або адміністратора платформи.
- Прапорці:
  - `--yes`: пропустити підтвердження.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Відновлює м’яко видалений пакет і релізи.
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
- Потребує адміністративного доступу як до поточного власника пакета, так і до цільового
  видавця, якщо дію не виконує адміністратор платформи.
- Імена пакетів із простором імен мають передаватися відповідному власнику простору імен.
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
- Скарги діють на рівні пакета, за потреби прив’язуються до версії та стають видимими
  модераторам для розгляду.
- Скарги самі по собі не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета, яку потрібно додати до скарги.
  - `--reason <text>`: обов’язкова причина скарги.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда власника для перевірки видимості пакета в модерації.
- Викликає `GET /api/v1/packages/{name}/moderation`.
- Показує поточний стан сканування пакета, кількість відкритих скарг, стан ручної
  модерації останнього релізу, стан блокування завантажень і причини модерації.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

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
  - `--json`: машинозчитуваний вивід.

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
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Публікує кодовий плагін або пакетний плагін через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний npm-pack tarball ClawPack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  справжніх маркерів пакета OpenClaw, як-от `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` обробляються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для перевірки та попереднього
  заповнення метаданих.
- Папки кодових плагінів пакуються в npm tarball ClawPack перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки пакетних плагінів усе ще
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, визначеного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли origin remote вказує на GitHub.
- Зовнішні кодові плагіни мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як резервне значення для перевірки публікації.
- `--dry-run` показує попередній перегляд визначеного payload публікації без завантаження.
- `--json` виводить машинозчитуваний результат для CI.
- `--owner <handle>` публікує під дескриптором користувача або організаційного видавця, коли актор має доступ видавця.
- `--clawscan-note <text>` додає нотатку ClawScan. Ця нотатка дає ClawScan
  контекст для поведінки, яка інакше може виглядати незвично, як-от доступ до мережі,
  доступ до нативного хоста або облікові дані, специфічні для провайдера. Нотатка зберігається в
  опублікованому релізі.
- Імена пакетів із простором імен мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
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

Для кодових плагінів публікація папки створює та завантажує артефакт ClawPack з
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім кодовим плагінам потрібна невелика кількість метаданих OpenClaw у
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
  резервне значення для перевірки сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` — необов’язкові метадані.
  ClawHub може показувати їх, коли вони присутні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додаткові поля, якщо ви хочете опублікувати
  докладніші метадані сумісності.
- Якщо ви використовуєте старіший реліз CLI `clawhub`, оновіться перед публікацією, щоб
  локальні попередні перевірки виконувалися перед завантаженням.

#### GitHub Actions

ClawHub також постачає офіційний повторно використовуваний workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/53b64d1d911106dab570eb6260e6ee977e9eefcd/.github/workflows/package-publish.yml)
для репозиторіїв плагінів.

Типове налаштування викликача:

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

- Повторно використовуваний workflow за замовчуванням задає `source` як репозиторій викликача.
- Для монорепозиторіїв передайте `source_path`, щоб workflow опублікував папку пакета
  плагіна, наприклад `source_path: extensions/codex`.
- Закріпіть повторно використовуваний workflow на стабільному тегу або повному SHA коміту. Не запускайте публікацію релізів із `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не забруднював стан.
- Справжні публікації мають бути обмежені довіреними подіями, як-от `workflow_dispatch` або push тегів.
- Довірена публікація без секрету працює лише для `workflow_dispatch`; push тегів усе ще потребує `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, недовірених пакетів або екстрених публікацій.
- Workflow завантажує JSON-результат як артефакт і надає його як outputs workflow.

### `sync`

- Сканує локальні папки Skills і публікує нові/змінені.
- Коренями можуть бути будь-які папки: каталог Skills або одна папка Skills із `SKILL.md`.
- Автоматично додає корені Skills Clawdbot, коли наявний `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (основний агент)
  - `routing.agents.*.workspace/skills` (для кожного агента)
  - `~/.clawdbot/skills` (спільні)
  - `skills.load.extraDirs` (спільні пакети)
- Враховує `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` і `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Прапорці:
  - `--root <dir...>` додаткові корені сканування
  - `--all` завантажувати без запиту
  - `--dry-run` лише показати план
  - `--bump patch|minor|major` (за замовчуванням: patch)
  - `--changelog <text>` (неінтерактивно)
  - `--tags a,b,c` (за замовчуванням: latest)
  - `--concurrency <n>` (за замовчуванням: 4)

Телеметрія:

- Надсилається під час `sync`, коли виконано вхід, якщо не встановлено `CLAWHUB_DISABLE_TELEMETRY=1` (застаріле `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Подробиці: `docs/telemetry.md`.
