---
read_when:
    - Використання ClawHub CLI
    - Налагодження встановлення, оновлення, публікації або синхронізації
summary: 'Довідник CLI: команди, прапорці, конфігурація, файл блокування, поведінка синхронізації.'
x-i18n:
    generated_at: "2026-05-12T23:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Пакет CLI: `clawhub`, виконуваний файл: `clawhub`.

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

- `--workdir <dir>`: робочий каталог (типово: cwd; повертається до робочої області Clawdbot, якщо її налаштовано)
- `--dir <dir>`: каталог установлення всередині workdir (типово: `skills`)
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

Коли встановлено будь-яку з цих змінних, CLI спрямовує вихідні запити через
зазначений проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується, щоб обходити проксі для
певних хостів або доменів.

Це потрібно в системах, де прямі вихідні з’єднання заблоковані
(наприклад, контейнери Docker, Hetzner VPS з доступом до інтернету лише через проксі,
корпоративні міжмережеві екрани).

Приклад:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Коли жодну змінну проксі не встановлено, поведінка не змінюється (прямі з’єднання).

## Файл конфігурації

Зберігає ваш API-токен і кешовану URL-адресу реєстру.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` або `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Застарілий резервний варіант: якщо `clawhub/config.json` ще не існує, але існує `clawdhub/config.json`, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застарілий `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- Типово: відкриває браузер на `<site>/cli/auth` і завершує через зворотний виклик loopback.
- Без графічного інтерфейсу: `clawhub login --token clh_...`
- Віддалений/інтерактивний режим без графічного інтерфейсу: `clawhub login --device` виводить код і чекає, поки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Додає/видаляє skill з ваших виділених.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Пошук надає перевагу точним збігам токенів slug/назви перед популярністю завантажень. Окремий токен slug, як-от `map`, сильніше відповідає `personal-map`, ніж підрядку всередині `amap`.
- Завантаження є невеликим попереднім показником популярності, а не гарантією найвищої позиції.
- Якщо skill має з’являтися, але не з’являється, запустіть `clawhub inspect <slug>` після входу, щоб перевірити видиму для власника діагностику модерації перед перейменуванням метаданих.

### `explore`

- Виводить список найновіших skills через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` у спадному порядку).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (типово: newest)
  - `--json` (машиночитаний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізається до 50 символів).

### `inspect <slug>`

- Отримує метадані skill і файли версії без установлення.
- `--version <version>`: перевірити конкретну версію (типово: latest).
- `--tag <tag>`: перевірити версію з тегом (наприклад, `latest`).
- `--versions`: показати історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-200).
- `--files`: показати файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файлу (лише текстові файли; обмеження 200KB).
- `--json`: машиночитаний вивід.

### `install <slug>`

- Визначає останню версію через `/api/v1/skills/<slug>`.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені skills; спершу запустіть `clawhub unpin <slug>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застарілий `.clawdhub`)

### `uninstall <slug>`

- Видаляє `<workdir>/<dir>/<slug>` і запис із lockfile.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): потребує `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`).
- Показує `pinned` поруч зі skills, замороженими через `clawhub pin`, включно з необов’язковою причиною.

### `pin <slug>`

- Позначає встановлений skill як закріплений у lockfile.
- `--reason <text>` записує, чому skill заморожено.
- Закріплені skills пропускаються `update --all` і відхиляються прямим `update <slug>`.
- Закріплені skills також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <slug>`

- Прибирає закріплення з lockfile для встановленого skill, щоб майбутні оновлення могли його змінювати.

### `update [slug]` / `update --all`

- Обчислює відбиток за локальними файлами.
- Якщо відбиток збігається з відомою версією: без запиту.
- Якщо відбиток не збігається:
  - типово відмовляє
  - перезаписує з `--force` (або після запиту, якщо інтерактивно)
- Закріплені skills ніколи не оновлюються через `--force`.
- `update <slug>` швидко завершується з помилкою для закріплених slug і повідомляє спочатку запустити `clawhub unpin <slug>`.
- `update --all` пропускає закріплені slug і виводить підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Публікує через `POST /api/v1/skills` (multipart).
- Потребує semver: `--version 1.2.3`.
- `--owner <handle>` публікує від імені видавця організації/користувача, коли
  actor має доступ видавця.
- `--migrate-owner` переносить наявний skill до `--owner` під час публікації нової
  версії. Потребує доступу admin/owner для обох видавців.
- Поведінку власника й перевірки пояснено в `docs/publishing.md`.
- Публікація skill означає, що його випущено під `MIT-0` на ClawHub.
- Опубліковані skills можна вільно використовувати, змінювати й поширювати без зазначення авторства.
- ClawHub не підтримує платні skills або ціноутворення для окремих skills.
- `--clawscan-note <text>` додає примітку ClawScan. Ця примітка дає ClawScan
  контекст для поведінки, яка інакше може виглядати незвично, наприклад доступ до мережі,
  доступ до native host або облікові дані, специфічні для провайдера. Примітка зберігається у
  опублікованій версії.
- Застарілий псевдонім: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- М’яко видаляє skill (owner, moderator або admin).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда виводить час завершення.
- `--reason <text>` записує примітку модерації для skill і журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <slug>`

- Відновлює прихований skill (owner, moderator або admin).
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує примітку модерації для skill і журналу аудиту.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <slug>`

- Приховує skill (owner, moderator або admin).
- Псевдонім для `delete`.

### `unhide <slug>`

- Відображає прихований skill (owner, moderator або admin).
- Псевдонім для `undelete`.

### `skill rename <slug> <new-slug>`

- Перейменовує власний skill і зберігає попередній slug як псевдонім перенаправлення.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source-slug> <target-slug>`

- Об’єднує один власний skill з іншим власним skill.
- Вихідний slug припиняє публічно відображатися й стає псевдонімом перенаправлення до цільового.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Робочий процес передавання права власності.
- Передавання до user handles створює очікуваний запит, який отримувач приймає.
- Передавання до org/publisher handles застосовується негайно лише тоді, коли actor має
  доступ admin і до поточного власника, і до цільового видавця.
- Підкоманди:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Переглядає або шукає в уніфікованому каталозі пакетів через `GET /api/v1/packages` і `GET /api/v1/packages/search`.
- Використовуйте це для plugins та інших записів сімейства пакетів; верхньорівневий `search` залишається поверхнею пошуку skills.
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
- `--tag <tag>`: перевірити позначену тегом версію (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файлу (лише текстові файли; обмеження 200KB).
- `--json`: машинозчитуваний вивід.

### `package download <name>`

- Визначає версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує артефакт із `downloadUrl` резолвера.
- Перевіряє ClawHub SHA-256 для всіх артефактів.
- Для артефактів ClawPack npm-pack також перевіряє npm `sha512` integrity,
  npm shasum і name/version у `package.json` tarball.
- Застарілі ZIP-версії завантажуються через застарілий ZIP-маршрут.
- Прапорці:
  - `--version <version>`: завантажити конкретну версію.
  - `--tag <tag>`: завантажити версію з тегом (типово: `latest`).
  - `-o, --output <path>`: вихідний файл або директорія.
  - `--force`: перезаписати наявний вихідний файл.
  - `--json`: машинозчитуваний вивід.

Приклади:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Обчислює ClawHub SHA-256, npm `sha512` integrity і npm shasum для локального
  артефакту.
- З `--package` визначає очікувані метадані з ClawHub і порівнює
  локальний файл з метаданими опублікованого артефакту.
- З прямими прапорцями дайджесту перевіряє без мережевого пошуку.
- Прапорці:
  - `--package <name>`: назва пакета для визначення очікуваних метаданих артефакту.
  - `--version <version>` або `--tag <tag>`: очікувана версія пакета.
  - `--sha256 <hex>`: очікуваний ClawHub SHA-256.
  - `--npm-integrity <sri>`: очікувана npm integrity.
  - `--npm-shasum <sha1>`: очікуваний npm shasum.
  - `--json`: машинозчитуваний вивід.

Приклади:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- М’яко видаляє пакет і всі випуски.
- Потребує власника пакета, власника/адміністратора видавця організації, модератора платформи
  або адміністратора платформи.
- Прапорці:
  - `--yes`: пропустити підтвердження.
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Відновлює м’яко видалений пакет і випуски.
- Потребує власника пакета, власника/адміністратора видавця організації, модератора платформи
  або адміністратора платформи.
- Викликає `POST /api/v1/packages/{name}/undelete`.
- Прапорці:
  - `--yes`: пропустити підтвердження.
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Передає пакет іншому видавцю.
- Потребує адміністраторського доступу як до поточного власника пакета, так і до цільового
  видавця, якщо дію не виконує адміністратор платформи.
- Імена пакетів з областю видимості мають передаватися відповідному власнику області.
- Викликає `POST /api/v1/packages/{name}/transfer`.
- Прапорці:
  - `--to <owner>`: ідентифікатор цільового видавця.
  - `--reason <text>`: необов’язкова причина для аудиту.
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Автентифікована команда для надсилання скарги на пакет модераторам.
- Викликає `POST /api/v1/packages/{name}/report`.
- Скарги стосуються рівня пакета, необов’язково прив’язуються до версії та стають видимими
  модераторам для розгляду.
- Скарги самі по собі не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета, яку потрібно додати до скарги.
  - `--reason <text>`: обов’язкова причина скарги.
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда власника для перевірки видимості модерації пакета.
- Викликає `GET /api/v1/packages/{name}/moderation`.
- Показує поточний стан сканування пакета, кількість відкритих скарг, стан ручної
  модерації останнього випуску, стан блокування завантажень і причини модерації.
- Прапорці:
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Перевіряє, чи пакет готовий до майбутнього використання в OpenClaw.
- Викликає `GET /api/v1/packages/{name}/readiness`.
- Повідомляє про блокери для офіційного статусу, доступності ClawPack, дайджесту артефакту,
  походження джерела, сумісності з OpenClaw, цільових хостів, метаданих середовища
  та стану сканування.
- Прапорці:
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Показує орієнтований на оператора стан міграції для пакета, який може замінити
  вбудований plugin OpenClaw.
- Викликає ту саму обчислювану кінцеву точку готовності, що й `package readiness`, але виводить
  стан, зосереджений на міграції, останню версію, стан офіційного пакета, перевірки та
  блокери.
- Прапорці:
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Публікує code plugin або bundle plugin через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний tarball ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  реальних маркерів bundle OpenClaw, таких як `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` обробляються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для перевірки та
  попереднього заповнення метаданих.
- Папки code-plugin пакуються в npm tarball ClawPack перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки bundle-plugin і далі
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, вирішеного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли віддалене джерело origin вказує на GitHub.
- Зовнішні code plugins мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневе `package.json.version` не використовується як резервне значення для перевірки публікації.
- `--dry-run` попередньо показує вирішене корисне навантаження публікації без завантаження.
- `--json` видає машинно-читаний вивід для CI.
- `--owner <handle>` публікує під ідентифікатором користувача або видавця організації, коли виконавець має доступ видавця.
- `--clawscan-note <text>` додає примітку ClawScan. Ця примітка надає ClawScan
  контекст для поведінки, яка інакше може виглядати незвично, наприклад доступ до мережі,
  доступ до нативного хоста або облікові дані, специфічні для провайдера. Примітка зберігається у
  опублікованому випуску.
- Імена пакетів з областю видимості мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Рекомендований локальний потік

Спочатку використайте `--dry-run`, щоб підтвердити вирішені метадані пакета й
атрибуцію джерела перед створенням реального випуску:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Потік локальної папки

Для code plugins публікація папки створює й завантажує артефакт ClawPack з
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім code plugins потрібна невелика кількість метаданих OpenClaw у
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

- `package.json.version` — це версія випуску вашого пакета, але вона не використовується як
  резервне значення для перевірки сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` — необов’язкові метадані.
  ClawHub може показувати їх, коли вони присутні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додаткові поля, якщо ви хочете опублікувати
  докладніші метадані сумісності.
- Якщо ви використовуєте старіший випуск CLI `clawhub`, оновіться перед публікацією, щоб
  локальні попередні перевірки виконувалися до завантаження.

#### GitHub Actions

ClawHub також постачає офіційний повторно використовуваний workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
для репозиторіїв plugins.

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
  plugin, наприклад `source_path: extensions/codex`.
- Закріпіть повторно використовуваний workflow на стабільному тегу або повному SHA коміту. Не запускайте публікацію випусків з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не забруднював стан.
- Реальні публікації слід обмежити довіреними подіями, такими як `workflow_dispatch` або push тегів.
- Довірена публікація без секрету працює лише для `workflow_dispatch`; push тегів усе одно потребує `clawhub_token`.
- Залишайте `clawhub_token` доступним для першої публікації, недовірених пакетів або аварійних публікацій.
- Workflow завантажує JSON-результат як артефакт і надає його як вихідні дані workflow.

### `sync`

- Сканує локальні папки skills і публікує нові/змінені.
- Коренями можуть бути будь-які папки: каталог skills або одна папка skill з `SKILL.md`.
- Автоматично додає корені skills Clawdbot, коли присутній `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (головний агент)
  - `routing.agents.*.workspace/skills` (для кожного агента)
  - `~/.clawdbot/skills` (спільні)
  - `skills.load.extraDirs` (спільні пакети)
- Дотримується `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` і `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Прапорці:
  - `--root <dir...>` додаткові корені сканування
  - `--all` завантажувати без запитів
  - `--dry-run` лише показати план
  - `--bump patch|minor|major` (за замовчуванням: patch)
  - `--changelog <text>` (неінтерактивно)
  - `--tags a,b,c` (за замовчуванням: latest)
  - `--concurrency <n>` (за замовчуванням: 4)

Телеметрія:

- Надсилається під час `sync`, коли виконано вхід, якщо не встановлено `CLAWHUB_DISABLE_TELEMETRY=1` (застаріле `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Докладніше: `docs/telemetry.md`.
