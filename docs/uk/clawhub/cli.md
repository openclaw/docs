---
read_when:
    - Використання ClawHub CLI
    - Налагодження встановлення, оновлення, публікування або синхронізації
summary: 'Довідник CLI: команди, прапорці, конфігурація, файл блокування, поведінка синхронізації.'
x-i18n:
    generated_at: "2026-05-13T04:17:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98c1886f2df29dd9489d18d4813f0f7df6c365b47888035fe12d2b05871cdf17
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

- `--workdir <dir>`: робочий каталог (за замовчуванням: cwd; повертається до робочого простору Clawdbot, якщо налаштовано)
- `--dir <dir>`: каталог установлення в межах робочого каталогу (за замовчуванням: `skills`)
- `--site <url>`: базова URL-адреса для входу через браузер (за замовчуванням: `https://clawhub.ai`)
- `--registry <url>`: базова URL-адреса API (за замовчуванням: виявляється автоматично, інакше `https://clawhub.ai`)
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

Коли встановлено будь-яку з цих змінних, CLI спрямовує вихідні запити через
зазначений проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується, щоб обходити проксі для
певних хостів або доменів.

Це потрібно в системах, де прямі вихідні з'єднання заблоковано
(наприклад, контейнери Docker, Hetzner VPS з доступом до інтернету лише через проксі,
корпоративні брандмауери).

Приклад:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Коли змінну проксі не встановлено, поведінка не змінюється (прямі з'єднання).

## Файл конфігурації

Зберігає ваш API-токен і кешовану URL-адресу реєстру.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` або `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Застарілий резервний варіант: якщо `clawhub/config.json` ще не існує, але `clawdhub/config.json` існує, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застаріле `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- За замовчуванням: відкриває браузер на `<site>/cli/auth` і завершує через callback loopback.
- Без графічного інтерфейсу: `clawhub login --token clh_...`
- Віддалено/інтерактивно без графічного інтерфейсу: `clawhub login --device` виводить код і очікує, доки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Додає навичку до ваших виділених або вилучає її звідти.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Пошук надає перевагу точним збігам токенів слага/назви перед популярністю завантажень. Окремий токен слага, як-от `map`, збігається з `personal-map` сильніше, ніж із підрядком усередині `amap`.
- Завантаження є невеликим попереднім сигналом популярності, а не гарантією верхньої позиції.
- Якщо навичка має з'являтися, але не з'являється, виконайте `clawhub inspect <slug>` після входу, щоб перевірити видиму власнику діагностику модерації перед перейменуванням метаданих.

### `explore`

- Виводить найновіші навички через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за спаданням `createdAt`).
- Прапорці:
  - `--limit <n>` (1-200, за замовчуванням: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (за замовчуванням: newest)
  - `--json` (машиночитаний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (зведення обрізається до 50 символів).

### `inspect <slug>`

- Отримує метадані навички та файли версії без установлення.
- `--version <version>`: перевірити певну версію (за замовчуванням: найновішу).
- `--tag <tag>`: перевірити версію з тегом (наприклад, `latest`).
- `--versions`: вивести історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для виведення (1-200).
- `--files`: вивести файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; обмеження 200 КБ).
- `--json`: машиночитаний вивід.

### `install <slug>`

- Визначає найновішу версію через `/api/v1/skills/<slug>`.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені навички; спершу виконайте `clawhub unpin <slug>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застаріле `.clawdhub`)

### `uninstall <slug>`

- Видаляє `<workdir>/<dir>/<slug>` і запис із lockfile.
- Інтерактивний режим: запитує підтвердження.
- Неінтерактивний режим (`--no-input`): потребує `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`).
- Показує `pinned` поруч із skills, замороженими через `clawhub pin`, включно з необов’язковою причиною.

### `pin <slug>`

- Позначає встановлений skill як закріплений у lockfile.
- `--reason <text>` записує, чому skill заморожено.
- Закріплені skills пропускаються `update --all` і відхиляються прямим `update <slug>`.
- Закріплені skills також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <slug>`

- Видаляє закріплення з lockfile для встановленого skill, щоб майбутні оновлення могли його змінювати.

### `update [slug]` / `update --all`

- Обчислює fingerprint із локальних файлів.
- Якщо fingerprint відповідає відомій версії: без запиту.
- Якщо fingerprint не відповідає:
  - за замовчуванням відмовляє
  - перезаписує з `--force` (або після запиту, якщо інтерактивно)
- Закріплені skills ніколи не оновлюються через `--force`.
- `update <slug>` швидко завершується помилкою для закріплених slugs і повідомляє спочатку виконати `clawhub unpin <slug>`.
- `update --all` пропускає закріплені slugs і друкує підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Публікує через `POST /api/v1/skills` (multipart).
- Потрібен semver: `--version 1.2.3`.
- `--owner <handle>` публікує під handle видавця org/user, коли
  actor має доступ видавця.
- `--migrate-owner` переносить наявний skill до `--owner` під час публікації нової
  версії. Потрібен доступ admin/owner для обох видавців.
- Поведінку власника й перевірки пояснено в `docs/publishing.md`.
- Публікація skill означає, що він випускається на ClawHub під `MIT-0`.
- Опубліковані skills можна вільно використовувати, змінювати й поширювати без зазначення авторства.
- ClawHub не підтримує платні skills або ціноутворення для окремих skills.
- `--clawscan-note <text>` додає примітку ClawScan. Ця примітка дає ClawScan
  контекст для поведінки, яка інакше може виглядати незвично, як-от доступ до мережі,
  доступ до native host або облікові дані, специфічні для provider. Примітка зберігається в
  опублікованій версії.
- Застарілий alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- М’яко видаляє skill (owner, moderator або admin).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда друкує час завершення.
- `--reason <text>` записує примітку moderation для skill і журналу аудиту.
- `--note <text>` є alias для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <slug>`

- Відновлює прихований skill (owner, moderator або admin).
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує примітку moderation для skill і журналу аудиту.
- `--note <text>` є alias для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <slug>`

- Приховує skill (owner, moderator або admin).
- Alias для `delete`.

### `unhide <slug>`

- Скасовує приховування skill (owner, moderator або admin).
- Alias для `undelete`.

### `skill rename <slug> <new-slug>`

- Перейменовує власний skill і зберігає попередній slug як alias перенаправлення.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source-slug> <target-slug>`

- Об’єднує один власний skill з іншим власним skill.
- Source slug більше не відображається публічно й стає alias перенаправлення до target.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Робочий процес передавання ownership.
- Передавання до user handles створює очікуваний запит, який приймає одержувач.
- Передавання до org/publisher handles застосовується негайно лише тоді, коли actor має
  admin-доступ і до поточного власника, і до видавця призначення.
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
- `--version <version>`: перевірити конкретну версію (за замовчуванням: latest).
- `--tag <tag>`: перевірити позначену тегом версію (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для переліку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати raw-вміст файлу (лише текстові файли; обмеження 200KB).
- `--json`: машинозчитуваний вивід.

### `package download <name>`

- Визначає версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує артефакт із `downloadUrl` resolver.
- Перевіряє ClawHub SHA-256 для всіх артефактів.
- Для артефактів ClawPack npm-pack також перевіряє npm `sha512` integrity,
  npm shasum і name/version у `package.json` tarball.
- Застарілі ZIP-версії завантажуються через застарілий ZIP route.
- Прапорці:
  - `--version <version>`: завантажити конкретну версію.
  - `--tag <tag>`: завантажити позначену тегом версію (за замовчуванням: `latest`).
  - `-o, --output <path>`: файл або каталог виводу.
  - `--force`: перезаписати наявний файл виводу.
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
  локальний файл із метаданими опублікованого артефакту.
- З прямими прапорцями digest перевіряє без мережевого lookup.
- Прапорці:
  - `--package <name>`: назва пакета для визначення очікуваних метаданих артефакту.
  - `--version <version>` or `--tag <tag>`: очікувана версія пакета.
  - `--sha256 <hex>`: очікуваний ClawHub SHA-256.
  - `--npm-integrity <sri>`: очікувана npm integrity.
  - `--npm-shasum <sha1>`: очікувана npm shasum.
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
  - `--json`: машиночитаний вивід.

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
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Передає пакет іншому видавцю.
- Потребує адміністративного доступу як до поточного власника пакета, так і до цільового
  видавця, якщо дію не виконує адміністратор платформи.
- Імена пакетів з областю мають передаватися відповідному власнику області.
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
- Повідомлення мають рівень пакета, можуть необов’язково бути прив’язані до версії та стають видимими
  для модераторів на розгляд.
- Повідомлення самі по собі не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета, яку потрібно прикріпити до повідомлення.
  - `--reason <text>`: обов’язкова причина повідомлення.
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда власника для перевірки видимості пакета для модерації.
- Викликає `GET /api/v1/packages/{name}/moderation`.
- Показує поточний стан сканування пакета, кількість відкритих повідомлень, стан ручної
  модерації останнього релізу, стан блокування завантаження та причини модерації.
- Прапорці:
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Перевіряє, чи готовий пакет до майбутнього використання в OpenClaw.
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
  вбудований плагін OpenClaw.
- Викликає ту саму обчислену кінцеву точку готовності, що й `package readiness`, але виводить
  стан, сфокусований на міграції, останню версію, стан офіційного пакета, перевірки та
  блокери.
- Прапорці:
  - `--json`: машиночитаний вивід.

Приклад:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Публікує кодовий плагін або пакетний плагін через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний tarball ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  реальних маркерів пакета OpenClaw, таких як `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` обробляються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнений вміст `package/` лише для валідації та
  попереднього заповнення метаданих.
- Папки кодових плагінів пакуються в npm tarball ClawPack перед завантаженням, щоб
  встановлення OpenClaw могли перевірити точний артефакт. Папки пакетних плагінів усе ще
  використовують шлях публікації витягнених файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, розв’язаного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли віддалений origin вказує на GitHub.
- Зовнішні кодові плагіни мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як резервний варіант для валідації публікації.
- `--dry-run` попередньо показує розв’язане корисне навантаження публікації без завантаження.
- `--json` виводить машиночитаний результат для CI.
- `--owner <handle>` публікує під дескриптором користувача або видавця організації, коли актор має доступ видавця.
- `--clawscan-note <text>` додає примітку ClawScan. Ця примітка надає ClawScan
  контекст для поведінки, яка інакше може виглядати незвично, наприклад доступ до мережі,
  доступ до нативного хоста або облікові дані, специфічні для провайдера. Примітка зберігається в
  опублікованому релізі.
- Імена пакетів з областю мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) досі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Рекомендований локальний процес

Спочатку використайте `--dry-run`, щоб підтвердити розв’язані метадані пакета та
атрибуцію джерела перед створенням реального релізу:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процес для локальної папки

Для кодових плагінів публікація папки збирає й завантажує артефакт ClawPack з
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

- `package.json.version` є версією релізу вашого пакета, але не використовується як
  резервний варіант для валідації сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
  ClawHub може показувати їх, коли вони наявні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` є необов’язковими додатковими полями, якщо ви хочете опублікувати
  детальніші метадані сумісності.
- Якщо ви використовуєте старіший реліз CLI `clawhub`, оновіться перед публікацією, щоб
  локальні передпольотні перевірки виконувалися до завантаження.

#### GitHub Actions

ClawHub також постачає офіційний багаторазовий workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f0a6789c31d5a1666d25173927356dd5be7738bc/.github/workflows/package-publish.yml)
для репозиторіїв плагінів.

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

- Багаторазовий workflow за замовчуванням встановлює `source` як репозиторій викликача.
- Для монорепозиторіїв передайте `source_path`, щоб workflow публікував папку пакета
  плагіна, наприклад `source_path: extensions/codex`.
- Закріплюйте багаторазовий workflow на стабільному тегу або повному SHA коміту. Не запускайте публікацію релізів з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не створював побічних змін.
- Реальні публікації слід обмежити довіреними подіями, такими як `workflow_dispatch` або push тегів.
- Довірена публікація без секрету працює лише для `workflow_dispatch`; push тегів усе ще потребують `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, недовірених пакетів або аварійних публікацій.
- Workflow завантажує результат JSON як артефакт і надає його як вихідні дані workflow.

### `sync`

- Сканує локальні папки Skills і публікує нові/змінені.
- Коренями можуть бути будь-які папки: каталог skills або одна папка skill із `SKILL.md`.
- Автоматично додає корені skills Clawdbot, коли наявний `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (основний агент)
  - `routing.agents.*.workspace/skills` (для кожного агента)
  - `~/.clawdbot/skills` (спільні)
  - `skills.load.extraDirs` (спільні пакети)
- Враховує `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` і `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Прапорці:
  - `--root <dir...>` додаткові корені сканування
  - `--all` завантажити без запиту
  - `--dry-run` лише показати план
  - `--bump patch|minor|major` (за замовчуванням: patch)
  - `--changelog <text>` (неінтерактивно)
  - `--tags a,b,c` (за замовчуванням: latest)
  - `--concurrency <n>` (за замовчуванням: 4)

Телеметрія:

- Надсилається під час `sync`, коли виконано вхід, якщо не встановлено `CLAWHUB_DISABLE_TELEMETRY=1` (застаріле `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Подробиці: `docs/telemetry.md`.
