---
read_when:
    - Використання CLI ClawHub
    - Налагодження встановлення, оновлення, публікації або синхронізації
summary: 'Довідник CLI: команди, прапорці, конфігурація, файл блокування, поведінка синхронізації.'
x-i18n:
    generated_at: "2026-05-11T22:19:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: abbe12a07f8947f8c65ba6eaae6fa6ff7fb8bfb12fbcb339abccd12225a2e791
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

- `--workdir <dir>`: робочий каталог (типово: cwd; повертається до робочого простору Clawdbot, якщо налаштовано)
- `--dir <dir>`: каталог установлення всередині workdir (типово: `skills`)
- `--site <url>`: базова URL-адреса для входу через браузер (типово: `https://clawhub.ai`)
- `--registry <url>`: базова URL-адреса API (типово: виявляється автоматично, інакше `https://clawhub.ai`)
- `--no-input`: вимкнути запити

Еквіваленти змінних середовища:

- `CLAWHUB_SITE` (застаріле `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (застаріле `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (застаріле `CLAWDHUB_WORKDIR`)

### HTTP-проксі

CLI враховує стандартні змінні середовища HTTP-проксі для систем за
корпоративними проксі або в мережах з обмеженнями:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Коли встановлено будь-яку з цих змінних, CLI спрямовує вихідні запити через
зазначений проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується, щоб оминати проксі для
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

Коли не встановлено жодної змінної проксі, поведінка не змінюється (прямі з’єднання).

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
- Без інтерфейсу: `clawhub login --token clh_...`
- Віддалений/безінтерфейсний інтерактивний режим: `clawhub login --device` друкує код і чекає, доки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Додає/видаляє skill з ваших виділених.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Пошук віддає перевагу точним збігам токенів slug/назви перед популярністю завантажень. Окремий токен slug, як-от `map`, відповідає `personal-map` сильніше, ніж підрядок усередині `amap`.
- Завантаження є невеликим попереднім показником популярності, а не гарантією верхньої позиції.
- Якщо skill має з’являтися, але не з’являється, виконайте `clawhub inspect <slug>` після входу, щоб перевірити видиму власнику модераційну діагностику перед перейменуванням метаданих.

### `explore`

- Показує найновіші skills через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` спадно).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (типово: newest)
  - `--json` (машинозчитуваний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізається до 50 символів).

### `inspect <slug>`

- Отримує метадані skill і файли версії без установлення.
- `--version <version>`: перевірити певну версію (типово: latest).
- `--tag <tag>`: перевірити позначену тегом версію (наприклад, `latest`).
- `--versions`: показати історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для показу (1-200).
- `--files`: показати файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машинозчитуваний вивід.

### `install <slug>`

- Визначає останню версію через `/api/v1/skills/<slug>`.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені skills; спочатку виконайте `clawhub unpin <slug>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застаріле `.clawdhub`)

### `uninstall <slug>`

- Видаляє `<workdir>/<dir>/<slug>` і запис із lockfile.
- Інтерактивний режим: запитує підтвердження.
- Неінтерактивний режим (`--no-input`): потребує `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`).
- Показує `pinned` поруч із навичками, замороженими через `clawhub pin`, включно з необов’язковою причиною.

### `pin <slug>`

- Позначає встановлену навичку як закріплену у lockfile.
- `--reason <text>` записує, чому навичку заморожено.
- Закріплені навички пропускаються командою `update --all` і відхиляються прямою командою `update <slug>`.
- Закріплені навички також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <slug>`

- Прибирає закріплення з lockfile для встановленої навички, щоб майбутні оновлення могли її змінювати.

### `update [slug]` / `update --all`

- Обчислює fingerprint з локальних файлів.
- Якщо fingerprint збігається з відомою версією: без запиту.
- Якщо fingerprint не збігається:
  - типово відмовляє
  - перезаписує з `--force` (або за запитом, якщо інтерактивно)
- Закріплені навички ніколи не оновлюються через `--force`.
- `update <slug>` швидко завершується помилкою для закріплених slug і повідомляє, що спершу потрібно виконати `clawhub unpin <slug>`.
- `update --all` пропускає закріплені slug і друкує підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Публікує через `POST /api/v1/skills` (multipart).
- Вимагає semver: `--version 1.2.3`.
- `--owner <handle>` публікує під handle видавця організації/користувача, коли
  actor має доступ видавця.
- `--migrate-owner` переміщує наявну навичку до `--owner` під час публікації нової
  версії. Вимагає доступу admin/owner для обох видавців.
- Поведінку власника та перевірки пояснено в `docs/publishing.md`.
- Публікація навички означає, що її випущено під `MIT-0` на ClawHub.
- Опубліковані навички можна вільно використовувати, змінювати й поширювати без зазначення авторства.
- ClawHub не підтримує платні навички або ціноутворення для окремих навичок.
- `--clawscan-note <text>` додає примітку ClawScan. Ця примітка надає ClawScan
  контекст для поведінки, яка інакше може виглядати незвично, наприклад доступ до мережі,
  доступ до native host або облікові дані, специфічні для провайдера. Примітка зберігається у
  опублікованій версії.
- Застарілий псевдонім: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- М’яко видаляє навичку (owner, moderator або admin).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда друкує час завершення терміну.
- `--reason <text>` записує модераційну примітку для навички та audit log.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <slug>`

- Відновлює приховану навичку (owner, moderator або admin).
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує модераційну примітку для навички та audit log.
- `--note <text>` є псевдонімом для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <slug>`

- Приховує навичку (owner, moderator або admin).
- Псевдонім для `delete`.

### `unhide <slug>`

- Скасовує приховування навички (owner, moderator або admin).
- Псевдонім для `undelete`.

### `skill rename <slug> <new-slug>`

- Перейменовує власну навичку й зберігає попередній slug як redirect alias.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source-slug> <target-slug>`

- Об’єднує одну власну навичку з іншою власною навичкою.
- Вихідний slug припиняє публічно відображатися та стає redirect alias до цільового.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Workflow передавання права власності.
- Передавання до user handles створює pending request, який приймає одержувач.
- Передавання до org/publisher handles застосовується негайно лише тоді, коли actor має
  доступ admin і до поточного власника, і до цільового видавця.
- Підкоманди:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Ендпоїнти:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Переглядає або шукає в уніфікованому каталозі пакетів через `GET /api/v1/packages` і `GET /api/v1/packages/search`.
- Використовуйте це для plugins та інших записів сімейства пакетів; верхньорівневий `search` залишається поверхнею пошуку навичок.
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
- Використовуйте це для метаданих plugin, сумісності, верифікації, джерела та перегляду версій/файлів.
- `--version <version>`: перевірити конкретну версію (типово: latest).
- `--tag <tag>`: перевірити tagged version (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машинозчитуваний вивід.

### `package download <name>`

- Визначає версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує артефакт з `downloadUrl` резолвера.
- Перевіряє ClawHub SHA-256 для всіх артефактів.
- Для артефактів ClawPack npm-pack також перевіряє npm `sha512` integrity,
  npm shasum і name/version у `package.json` тарбола.
- Застарілі ZIP-версії завантажуються через застарілий ZIP route.
- Прапорці:
  - `--version <version>`: завантажити конкретну версію.
  - `--tag <tag>`: завантажити tagged version (типово: `latest`).
  - `-o, --output <path>`: вихідний файл або каталог.
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
- З прямими прапорцями digest перевіряє без мережевого lookup.
- Прапорці:
  - `--package <name>`: назва пакета для визначення очікуваних метаданих артефакту.
  - `--version <version>` або `--tag <tag>`: очікувана версія пакета.
  - `--sha256 <hex>`: очікуваний ClawHub SHA-256.
  - `--npm-integrity <sri>`: очікуваний npm integrity.
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
- Імена пакетів з областю видимості мають передаватися відповідному власнику області видимості.
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
- Повідомлення стосуються рівня пакета, за потреби прив’язуються до версії та стають видимими
  модераторам для перевірки.
- Повідомлення самі по собі не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета, яку потрібно додати до повідомлення.
  - `--reason <text>`: обов’язкова причина повідомлення.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда власника для перевірки видимості пакета в модерації.
- Викликає `GET /api/v1/packages/{name}/moderation`.
- Показує поточний стан сканування пакета, кількість відкритих повідомлень, стан ручної
  модерації останнього релізу, стан блокування завантажень і причини модерації.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Перевіряє, чи готовий пакет до майбутнього використання OpenClaw.
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
  вбудований Plugin OpenClaw.
- Викликає ту саму обчислювану кінцеву точку готовності, що й `package readiness`, але виводить
  стан, зосереджений на міграції, останню версію, стан офіційного пакета, перевірки та
  блокери.
- Прапорці:
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Публікує кодовий Plugin або пакетний Plugin через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний tarball ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  реальних маркерів пакета OpenClaw, як-от `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` обробляються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для валідації та попереднього
  заповнення метаданих.
- Папки кодових Plugin пакуються в tarball ClawPack npm перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки пакетних Plugin усе ще
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, визначеного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли origin remote вказує на GitHub.
- Зовнішні кодові Plugin мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як резервне значення для валідації публікації.
- `--dry-run` попередньо показує визначене корисне навантаження публікації без завантаження.
- `--json` виводить машинозчитуваний результат для CI.
- `--owner <handle>` публікує під дескриптором видавця користувача або організації, коли виконавець має доступ видавця.
- `--clawscan-note <text>` додає примітку ClawScan. Ця примітка дає ClawScan
  контекст для поведінки, яка інакше може виглядати незвично, наприклад доступ до мережі,
  доступ до нативного хоста або облікові дані, специфічні для провайдера. Примітка зберігається в
  опублікованому релізі.
- Імена пакетів з областю видимості мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і надалі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Рекомендований локальний процес

Спершу використайте `--dry-run`, щоб підтвердити визначені метадані пакета та
атрибуцію джерела перед створенням реального релізу:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процес для локальної папки

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
  резервне значення для валідації сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` — необов’язкові метадані.
  ClawHub може показувати їх, коли вони наявні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додаткові поля, якщо ви хочете опублікувати
  докладніші метадані сумісності.
- Якщо ви використовуєте старіший реліз CLI `clawhub`, оновіться перед публікацією, щоб
  локальні попередні перевірки виконувалися до завантаження.

#### GitHub Actions

ClawHub також постачає офіційний повторно використовуваний workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c51cfe2459f3482c315a7c8c71b2efd2637bb0e8/.github/workflows/package-publish.yml)
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

- Повторно використовуваний workflow за замовчуванням встановлює `source` на репозиторій виклику.
- Для монорепозиторіїв передайте `source_path`, щоб workflow публікував папку пакета
  Plugin, наприклад `source_path: extensions/codex`.
- Закріпіть повторно використовуваний workflow за стабільним тегом або повним SHA коміту. Не запускайте публікацію релізів з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не створював побічних змін.
- Реальні публікації слід обмежувати довіреними подіями, як-от `workflow_dispatch` або пуші тегів.
- Довірена публікація без секрету працює лише для `workflow_dispatch`; пуші тегів усе ще потребують `clawhub_token`.
- Зберігайте `clawhub_token` доступним для першої публікації, недовірених пакетів або аварійних публікацій.
- Workflow завантажує результат JSON як артефакт і надає його як вихідні дані workflow.

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
  - `--all` завантажити без запиту
  - `--dry-run` лише показати план
  - `--bump patch|minor|major` (за замовчуванням: patch)
  - `--changelog <text>` (неінтерактивно)
  - `--tags a,b,c` (за замовчуванням: latest)
  - `--concurrency <n>` (за замовчуванням: 4)

Телеметрія:

- Надсилається під час `sync`, коли виконано вхід, якщо не встановлено `CLAWHUB_DISABLE_TELEMETRY=1` (застаріле `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Докладніше: `docs/telemetry.md`.
