---
read_when:
    - Використання CLI ClawHub
    - Налагодження встановлення, оновлення, публікації або синхронізації
summary: 'Довідник CLI: команди, прапорці, конфігурація, файл блокування, поведінка синхронізації.'
x-i18n:
    generated_at: "2026-05-13T05:32:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33d1874fbb65602a7a3b19838a45b4715fa1edd4edc8873a3e4b53bd122e6774
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

- `--workdir <dir>`: робочий каталог (за замовчуванням: cwd; повертається до робочої області Clawdbot, якщо налаштовано)
- `--dir <dir>`: каталог встановлення у workdir (за замовчуванням: `skills`)
- `--site <url>`: базова URL-адреса для входу через браузер (за замовчуванням: `https://clawhub.ai`)
- `--registry <url>`: базова URL-адреса API (за замовчуванням: виявляється автоматично, інакше `https://clawhub.ai`)
- `--no-input`: вимкнути підказки

Еквіваленти змінних середовища:

- `CLAWHUB_SITE` (застаріле `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (застаріле `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (застаріле `CLAWDHUB_WORKDIR`)

### HTTP-проксі

CLI підтримує стандартні змінні середовища HTTP-проксі для систем за
корпоративними проксі або в обмежених мережах:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Коли встановлено будь-яку з цих змінних, CLI спрямовує вихідні запити через
зазначений проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується для обходу проксі для
певних хостів або доменів.

Це потрібно в системах, де прямі вихідні з'єднання заблоковані
(наприклад, контейнери Docker, Hetzner VPS з інтернетом лише через проксі,
корпоративні брандмауери).

Приклад:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Якщо жодну змінну проксі не встановлено, поведінка не змінюється (прямі з'єднання).

## Файл конфігурації

Зберігає ваш API-токен і кешовану URL-адресу реєстру.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` або `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Застарілий резервний шлях: якщо `clawhub/config.json` ще не існує, але `clawdhub/config.json` існує, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застаріле `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- За замовчуванням: відкриває браузер на `<site>/cli/auth` і завершує через зворотний виклик loopback.
- Без інтерфейсу: `clawhub login --token clh_...`
- Віддалено/інтерактивно без інтерфейсу: `clawhub login --device` виводить код і чекає, поки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Додає/видаляє навичку з ваших виділених.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Пошук віддає перевагу точним збігам токенів slug/назви перед популярністю завантажень. Окремий токен slug, як-от `map`, відповідає `personal-map` сильніше, ніж підрядок усередині `amap`.
- Завантаження є невеликим попереднім сигналом популярності, а не гарантією верхньої позиції.
- Якщо навичка має з'являтися, але не з'являється, виконайте `clawhub inspect <slug>` після входу, щоб перевірити видимі власнику діагностичні дані модерації перед перейменуванням метаданих.

### `explore`

- Виводить найновіші навички через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за спаданням `createdAt`).
- Прапорці:
  - `--limit <n>` (1-200, за замовчуванням: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (за замовчуванням: newest)
  - `--json` (машинозчитуваний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізається до 50 символів).

### `inspect <slug>`

- Отримує метадані навички та файли версії без установлення.
- `--version <version>`: перевірити конкретну версію (за замовчуванням: latest).
- `--tag <tag>`: перевірити позначену тегом версію (наприклад, `latest`).
- `--versions`: вивести історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-200).
- `--files`: вивести файли для вибраної версії.
- `--file <path>`: отримати необроблений вміст файлу (лише текстові файли; обмеження 200 КБ).
- `--json`: машинозчитуваний вивід.

### `install <slug>`

- Визначає останню версію через `/api/v1/skills/<slug>`.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені навички; спочатку виконайте `clawhub unpin <slug>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застаріле `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застаріле `.clawdhub`)

### `uninstall <slug>`

- Видаляє `<workdir>/<dir>/<slug>` і запис із lockfile.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): вимагає `--yes`.

### `list`

- Читає `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`).
- Показує `pinned` поруч зі Skills, зафіксованими через `clawhub pin`, включно з необов’язковою причиною.

### `pin <slug>`

- Позначає встановлений skill як закріплений у lockfile.
- `--reason <text>` записує, чому skill заморожено.
- Закріплені Skills пропускаються `update --all` і відхиляються прямим `update <slug>`.
- Закріплені Skills також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <slug>`

- Видаляє закріплення lockfile з установленого skill, щоб майбутні оновлення могли його змінювати.

### `update [slug]` / `update --all`

- Обчислює fingerprint з локальних файлів.
- Якщо fingerprint збігається з відомою версією: без запиту.
- Якщо fingerprint не збігається:
  - типово відмовляє
  - перезаписує з `--force` (або із запитом, якщо інтерактивно)
- Закріплені Skills ніколи не оновлюються через `--force`.
- `update <slug>` швидко завершується помилкою для закріплених slug і повідомляє спочатку запустити `clawhub unpin <slug>`.
- `update --all` пропускає закріплені slug і друкує підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Публікує через `POST /api/v1/skills` (multipart).
- Потребує semver: `--version 1.2.3`.
- `--owner <handle>` публікує під handle видавця org/user, коли
  актор має доступ видавця.
- `--migrate-owner` переміщує наявний skill до `--owner`, одночасно публікуючи нову
  версію. Потребує доступу admin/owner для обох видавців.
- Поведінку власника й перевірки пояснено в `docs/publishing.md`.
- Публікація skill означає, що його випущено під `MIT-0` на ClawHub.
- Опубліковані Skills можна вільно використовувати, змінювати й поширювати без зазначення авторства.
- ClawHub не підтримує платні Skills або ціноутворення для окремих Skills.
- `--clawscan-note <text>` додає нотатку ClawScan. Ця нотатка надає ClawScan
  контекст для поведінки, яка інакше може виглядати незвичною, як-от доступ до мережі,
  доступ до native host або облікові дані, специфічні для провайдера. Нотатка зберігається у
  опублікованій версії.
- Застарілий alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- М’яко видаляє skill (owner, moderator або admin).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’які видалення, ініційовані власником, резервують slug на 30 днів; команда друкує час завершення строку.
- `--reason <text>` записує модераційну нотатку для skill і audit log.
- `--note <text>` є alias для `--reason`.
- `--yes` пропускає підтвердження.

### `undelete <slug>`

- Відновлює прихований skill (owner, moderator або admin).
- Викликає `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записує модераційну нотатку для skill і audit log.
- `--note <text>` є alias для `--reason`.
- `--yes` пропускає підтвердження.

### `hide <slug>`

- Приховує skill (owner, moderator або admin).
- Alias для `delete`.

### `unhide <slug>`

- Скасовує приховування skill (owner, moderator або admin).
- Alias для `undelete`.

### `skill rename <slug> <new-slug>`

- Перейменовує власний skill і зберігає попередній slug як redirect alias.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source-slug> <target-slug>`

- Об’єднує один власний skill з іншим власним skill.
- Вихідний slug припиняє публічно відображатися й стає redirect alias до цільового.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `transfer`

- Робочий процес передавання права власності.
- Передавання до user handles створює запит в очікуванні, який отримувач приймає.
- Передавання до org/publisher handles застосовується негайно лише тоді, коли актор має
  admin-доступ і до поточного власника, і до цільового видавця.
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
- Використовуйте це для plugins та інших записів родини пакетів; верхньорівневий `search` залишається поверхнею пошуку skill.
- Flags:
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

- Отримує metadata пакета без установлення.
- Використовуйте це для metadata Plugin, compatibility, verification, source та перегляду версій/файлів.
- `--version <version>`: перевірити конкретну версію (типово: latest).
- `--tag <tag>`: перевірити версію з тегом (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимум версій у списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати raw-вміст файлу (лише текстові файли; ліміт 200KB).
- `--json`: машинозчитуваний output.

### `package download <name>`

- Розв’язує версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує artifact з `downloadUrl` resolver.
- Перевіряє ClawHub SHA-256 для всіх artifacts.
- Для artifacts ClawPack npm-pack також перевіряє npm `sha512` integrity,
  npm shasum і name/version у `package.json` tarball.
- Застарілі ZIP-версії завантажуються через застарілий ZIP route.
- Flags:
  - `--version <version>`: завантажити конкретну версію.
  - `--tag <tag>`: завантажити версію з тегом (типово: `latest`).
  - `-o, --output <path>`: вихідний файл або directory.
  - `--force`: перезаписати наявний вихідний файл.
  - `--json`: машинозчитуваний output.

Приклади:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Обчислює ClawHub SHA-256, npm `sha512` integrity і npm shasum для локального
  artifact.
- З `--package` розв’язує очікувані metadata з ClawHub і порівнює
  локальний файл з metadata опублікованого artifact.
- З прямими flags digest перевіряє без мережевого lookup.
- Flags:
  - `--package <name>`: name пакета для розв’язання очікуваних metadata artifact.
  - `--version <version>` або `--tag <tag>`: очікувана версія пакета.
  - `--sha256 <hex>`: очікуваний ClawHub SHA-256.
  - `--npm-integrity <sri>`: очікувана npm integrity.
  - `--npm-shasum <sha1>`: очікуваний npm shasum.
  - `--json`: машинозчитуваний output.

Приклади:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- М’яко видаляє пакет і всі релізи.
- Потребує прав власника пакета, власника/адміністратора видавця організації, модератора платформи
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
- Потребує прав власника пакета, власника/адміністратора видавця організації, модератора платформи
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
- Скарги діють на рівні пакета, можуть бути необов’язково прив’язані до версії та стають видимими
  модераторам для розгляду.
- Скарги самі по собі не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета, яку слід прикріпити до скарги.
  - `--reason <text>`: обов’язкова причина скарги.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда власника для перевірки видимості модерації пакета.
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

- Перевіряє, чи пакет готовий до майбутнього використання OpenClaw.
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
  вбудований plugin OpenClaw.
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

- Публікує кодовий plugin або пакетний plugin через `POST /api/v1/packages`.
- `<source>` приймає:
  - Шлях до локальної папки: `./my-plugin`
  - Локальний npm-pack tarball ClawPack: `./my-plugin-1.2.3.tgz`
  - Репозиторій GitHub: `owner/repo` або `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метадані автоматично визначаються з `package.json`, `openclaw.plugin.json` і
  справжніх маркерів пакета OpenClaw, як-от `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` розглядаються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для валідації та попереднього
  заповнення метаданих.
- Папки кодових plugin пакуються в npm tarball ClawPack перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки пакетних plugin і далі
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, визначеного коміту, ref і підшляху.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли віддалений origin вказує на GitHub.
- Зовнішні кодові plugins мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як fallback для валідації публікації.
- `--dry-run` попередньо показує визначене навантаження публікації без завантаження.
- `--json` виводить машинозчитуваний результат для CI.
- `--owner <handle>` публікує під дескриптором видавця користувача або організації, коли виконавець має доступ видавця.
- `--clawscan-note <text>` додає примітку ClawScan. Ця примітка дає ClawScan
  контекст щодо поведінки, яка інакше може виглядати незвично, наприклад доступ до мережі,
  доступ до нативного хоста або облікові дані, специфічні для провайдера. Примітка зберігається в
  опублікованому релізі.
- Імена пакетів з областю видимості мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Рекомендований локальний процес

Спочатку використайте `--dry-run`, щоб підтвердити визначені метадані пакета та
атрибуцію джерела перед створенням реального релізу:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процес для локальної папки

Для кодових plugins публікація папки створює та завантажує артефакт ClawPack із
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім кодовим plugins потрібен невеликий обсяг метаданих OpenClaw у
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
  ClawHub може показувати їх, коли вони присутні, але вони не обов’язкові для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додатки, якщо ви хочете опублікувати
  детальніші метадані сумісності.
- Якщо ви використовуєте старіший реліз CLI `clawhub`, оновіться перед публікацією, щоб
  локальні передпольотні перевірки виконувалися перед завантаженням.

#### GitHub Actions

ClawHub також постачає офіційний багаторазовий workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ddaad62cc7852eb8274022ae8a6d7527d169ae8/.github/workflows/package-publish.yml)
для репозиторіїв plugins.

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

- Багаторазовий workflow за замовчуванням встановлює `source` на репозиторій викликача.
- Для монорепозиторіїв передайте `source_path`, щоб workflow опублікував папку пакета
  plugin, наприклад `source_path: extensions/codex`.
- Закріплюйте багаторазовий workflow за стабільним тегом або повним SHA коміту. Не запускайте публікацію релізу з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не створював забруднення.
- Реальні публікації мають бути обмежені довіреними подіями, як-от `workflow_dispatch` або push тегів.
- Довірена публікація без секрету працює лише для `workflow_dispatch`; push тегів усе ще потребує `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, недовірених пакетів або аварійних публікацій.
- Workflow завантажує JSON-результат як артефакт і надає його як вихідні дані workflow.

### `sync`

- Сканує локальні папки Skills і публікує нові/змінені.
- Коренями можуть бути будь-які папки: каталог Skills або одна папка Skills із `SKILL.md`.
- Автоматично додає корені Skills Clawdbot, коли присутній `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (основний агент)
  - `routing.agents.*.workspace/skills` (для кожного агента)
  - `~/.clawdbot/skills` (спільні)
  - `skills.load.extraDirs` (спільні пакети)
- Поважає `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` і `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
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
- Докладніше: `docs/telemetry.md`.
