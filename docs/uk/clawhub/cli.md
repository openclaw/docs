---
read_when:
    - Використання ClawHub CLI
    - Налагодження встановлення, оновлення, публікації або синхронізації
summary: 'Довідник CLI: команди, прапорці, конфігурація, файл блокування, поведінка синхронізації.'
x-i18n:
    generated_at: "2026-05-11T20:24:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
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
- `--dir <dir>`: каталог установлення в межах workdir (типово: `skills`)
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

Коли будь-яку з цих змінних задано, CLI спрямовує вихідні запити через
вказаний проксі. `HTTPS_PROXY` використовується для HTTPS-запитів, `HTTP_PROXY`
для звичайного HTTP. `NO_PROXY` / `no_proxy` враховується, щоб обходити проксі для
конкретних хостів або доменів.

Це потрібно в системах, де прямі вихідні з’єднання заблоковані
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
- Застарілий резервний шлях: якщо `clawhub/config.json` ще не існує, але існує `clawdhub/config.json`, CLI повторно використовує застарілий шлях
- перевизначення: `CLAWHUB_CONFIG_PATH` (застарілий `CLAWDHUB_CONFIG_PATH`)

## Команди

### `login` / `auth login`

- Типово: відкриває браузер на `<site>/cli/auth` і завершує через зворотний виклик loopback.
- Headless: `clawhub login --token clh_...`
- Віддалений/headless інтерактивний режим: `clawhub login --device` виводить код і чекає, доки ви авторизуєте його на `<site>/cli/device`.

### `whoami`

- Перевіряє збережений токен через `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Додає/видаляє Skill з ваших виділених.
- Викликає `POST /api/v1/stars/<slug>` і `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускає підтвердження.

### `search <query...>`

- Викликає `/api/v1/search?q=...`.
- Пошук віддає перевагу точним збігам токенів slug/назви перед популярністю завантажень. Окремий токен slug, як-от `map`, збігається з `personal-map` сильніше, ніж підрядок усередині `amap`.
- Завантаження є невеликим апріорним показником популярності, а не гарантією найвищої позиції.
- Якщо Skill має з’являтися, але не з’являється, виконайте `clawhub inspect <slug>` після входу, щоб перевірити видимі власнику діагностичні дані модерації перед перейменуванням метаданих.

### `explore`

- Показує найновіші Skills через `/api/v1/skills?limit=...&sort=createdAt` (відсортовано за `createdAt` desc).
- Прапорці:
  - `--limit <n>` (1-200, типово: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (типово: newest)
  - `--json` (машиночитаний вивід)
- Вивід: `<slug>  v<version>  <age>  <summary>` (summary обрізається до 50 символів).

### `inspect <slug>`

- Отримує метадані Skill і файли версії без установлення.
- `--version <version>`: перевірити конкретну версію (типово: latest).
- `--tag <tag>`: перевірити версію з тегом (наприклад, `latest`).
- `--versions`: показати історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій для показу (1-200).
- `--files`: показати файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файлу (лише текстові файли; ліміт 200 КБ).
- `--json`: машиночитаний вивід.

### `install <slug>`

- Визначає останню версію через `/api/v1/skills/<slug>`.
- Завантажує zip через `/api/v1/download`.
- Розпаковує в `<workdir>/<dir>/<slug>`.
- Відмовляється перезаписувати закріплені Skills; спершу виконайте `clawhub unpin <slug>`.
- Записує:
  - `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (застарілий `.clawdhub`)

### `uninstall <slug>`

- Видаляє `<workdir>/<dir>/<slug>` і видаляє запис із lockfile.
- Інтерактивно: запитує підтвердження.
- Неінтерактивно (`--no-input`): потребує `--yes`.

### `list`

- Зчитує `<workdir>/.clawhub/lock.json` (застарілий `.clawdhub`).
- Показує `pinned` поруч із навичками, замороженими через `clawhub pin`, включно з необов’язковою причиною.

### `pin <slug>`

- Позначає встановлену навичку як закріплену у файлі блокування.
- `--reason <text>` записує, чому навичку заморожено.
- Закріплені навички пропускаються `update --all` і відхиляються прямим `update <slug>`.
- Закріплені навички також відхиляють `install --force`, щоб локальні байти не можна було випадково замінити.

### `unpin <slug>`

- Видаляє закріплення у файлі блокування для встановленої навички, щоб майбутні оновлення могли її змінювати.

### `update [slug]` / `update --all`

- Обчислює відбиток за локальними файлами.
- Якщо відбиток збігається з відомою версією: без запиту.
- Якщо відбиток не збігається:
  - типово відмовляє
  - перезаписує з `--force` (або із запитом, якщо інтерактивно)
- Закріплені навички ніколи не оновлюються через `--force`.
- `update <slug>` швидко завершується помилкою для закріплених слагів і повідомляє спершу виконати `clawhub unpin <slug>`.
- `update --all` пропускає закріплені слаги й друкує підсумок того, що залишилося замороженим.

### `skill publish <path>`

- Публікує через `POST /api/v1/skills` (multipart).
- Потребує semver: `--version 1.2.3`.
- `--owner <handle>` публікує під дескриптором видавця організації/користувача, коли
  актор має доступ видавця.
- `--migrate-owner` переміщує наявну навичку до `--owner` під час публікації нової
  версії. Потребує доступу адміністратора/власника в обох видавців.
- Поведінку власника та перевірки пояснено в `docs/publishing.md`.
- Публікація навички означає, що її випущено під `MIT-0` на ClawHub.
- Опубліковані навички можна вільно використовувати, змінювати й поширювати без зазначення авторства.
- ClawHub не підтримує платні навички або ціноутворення для окремих навичок.
- Застарілий псевдонім: `publish <path>`.

### `delete <slug>`

- М’яко видаляє навичку (власник, модератор або адміністратор).
- Викликає `DELETE /api/v1/skills/{slug}`.
- М’яке видалення, ініційоване власником, резервує слаг на 30 днів; команда друкує час завершення терміну.
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

- Перейменовує належну вам навичку й зберігає попередній слаг як псевдонім переспрямування.
- Викликає `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускає підтвердження.

### `skill merge <source-slug> <target-slug>`

- Об’єднує одну належну вам навичку з іншою належною вам навичкою.
- Вихідний слаг припиняє публічно відображатися й стає псевдонімом переспрямування до цільового.
- Викликає `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускає підтвердження.

### `skill rescan <slug>`

- Запитує повторне сканування безпеки для останньої опублікованої версії навички.
- Власники та адміністратори видавця можуть повторно сканувати власні навички до ліміту
  відновлення для кожної версії.
- Модератори й адміністратори платформи можуть повторно сканувати будь-яку навичку, і їх не блокує
  ліміт відновлення власника, хоча одночасно для однієї версії може виконуватися лише одне повторне сканування.
- Викликає `POST /api/v1/skills/{slug}/rescan`.
- Прапорці:
  - `--yes`: пропустити підтвердження.
  - `--json`: машинозчитуваний вивід.

Приклад:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- Робочий процес передавання власності.
- Передавання дескрипторам користувачів створює очікуваний запит, який отримувач приймає.
- Передавання дескрипторам організацій/видавців застосовується негайно лише тоді, коли актор має
  адміністративний доступ і до поточного власника, і до видавця призначення.
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
- Використовуйте це для плагінів та інших записів сімейства пакетів; верхньорівневий `search` залишається поверхнею пошуку навичок.
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
- Використовуйте це для метаданих плагіна, сумісності, перевірки, джерела та інспекції версії/файлів.
- `--version <version>`: інспектувати конкретну версію (типово: остання).
- `--tag <tag>`: інспектувати версію з тегом (наприклад, `latest`).
- `--versions`: перелічити історію версій (перша сторінка).
- `--limit <n>`: максимальна кількість версій у списку (1-100).
- `--files`: перелічити файли для вибраної версії.
- `--file <path>`: отримати сирий вміст файла (лише текстові файли; ліміт 200 КБ).
- `--json`: машинозчитуваний вивід.

### `package download <name>`

- Розв’язує версію пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Завантажує артефакт із `downloadUrl` розв’язувача.
- Перевіряє ClawHub SHA-256 для всіх артефактів.
- Для артефактів ClawPack npm-pack також перевіряє цілісність npm `sha512`,
  npm shasum і name/version у `package.json` tarball-архіву.
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
  артефакта.
- З `--package` розв’язує очікувані метадані з ClawHub і порівнює
  локальний файл із метаданими опублікованого артефакта.
- З прямими прапорцями дайджестів перевіряє без мережевого пошуку.
- Прапорці:
  - `--package <name>`: назва пакета для розв’язання очікуваних метаданих артефакта.
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
  - `--json`: машинно-читаний вивід.

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
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Передає пакет іншому видавцю.
- Потребує доступу адміністратора і до поточного власника пакета, і до цільового
  видавця, якщо дію не виконує адміністратор платформи.
- Імена пакетів зі scope мають передаватися відповідному власнику scope.
- Викликає `POST /api/v1/packages/{name}/transfer`.
- Прапорці:
  - `--to <owner>`: handle цільового видавця.
  - `--reason <text>`: необов’язкова причина для аудиту.
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- Запитує повторне сканування безпеки для останнього опублікованого релізу пакета.
- Власники й адміністратори видавця можуть повторно сканувати власні пакети в межах
  ліміту відновлення на реліз.
- Модератори й адміністратори платформи можуть повторно сканувати будь-який пакет і не блокуються
  лімітом відновлення власника, хоча одночасно для одного релізу може виконуватися лише одне повторне сканування.
- Викликає `POST /api/v1/packages/{name}/rescan`.
- Прапорці:
  - `--yes`: пропустити підтвердження.
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Автентифікована команда для повідомлення модераторам про пакет.
- Викликає `POST /api/v1/packages/{name}/report`.
- Звіти стосуються рівня пакета, необов’язково прив’язуються до версії та стають видимими
  модераторам для розгляду.
- Звіти самі по собі не приховують пакети автоматично й не блокують завантаження.
- Прапорці:
  - `--version <version>`: необов’язкова версія пакета, яку потрібно додати до звіту.
  - `--reason <text>`: обов’язкова причина звіту.
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- Команда власника/видавця для оскарження модерації релізу.
- Викликає `POST /api/v1/packages/{name}/appeal`.
- Оскарження приймаються для релізів у карантині, відкликаних, підозрілих або шкідливих
  релізів.
- Прапорці:
  - `--version <version>`: обов’язкова версія пакета.
  - `--message <text>`: обов’язкове повідомлення оскарження.
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Команда власника для перевірки видимості модерації пакета.
- Викликає `GET /api/v1/packages/{name}/moderation`.
- Показує поточний стан сканування пакета, кількість відкритих звітів, стан ручної
  модерації останнього релізу, стан блокування завантаження та причини модерації.
- Прапорці:
  - `--json`: машинно-читаний вивід.

Приклад:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Перевіряє, чи пакет готовий до майбутнього використання OpenClaw.
- Викликає `GET /api/v1/packages/{name}/readiness`.
- Повідомляє про блокери для офіційного статусу, доступності ClawPack, дайджесту артефакта,
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
  вбудований OpenClaw plugin.
- Викликає ту саму обчислювану кінцеву точку готовності, що й `package readiness`, але виводить
  стан, орієнтований на міграцію, останню версію, стан офіційного пакета, перевірки та
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
  справжніх маркерів bundle OpenClaw, як-от `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` і `.cursor-plugin/plugin.json`.
- Джерела `.tgz` розглядаються як ClawPack. CLI завантажує точні байти npm-pack
  і використовує витягнутий вміст `package/` лише для перевірки й попереднього заповнення
  метаданих.
- Папки code-plugin пакуються в tarball ClawPack npm перед завантаженням, щоб
  інсталяції OpenClaw могли перевірити точний артефакт. Папки bundle-plugin і далі
  використовують шлях публікації витягнутих файлів.
- Для джерел GitHub атрибуція джерела автоматично заповнюється з репозиторію, resolved commit, ref і subpath.
- Для локальних папок атрибуція джерела автоматично визначається з локального git, коли віддалений origin вказує на GitHub.
- Зовнішні code plugins мають явно оголошувати `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
  Верхньорівневий `package.json.version` не використовується як fallback для перевірки публікації.
- `--dry-run` попередньо показує визначений payload публікації без завантаження.
- `--json` виводить машинно-читаний результат для CI.
- `--owner <handle>` публікує під handle користувача або видавця організації, коли actor має доступ видавця.
- Імена пакетів зі scope мають відповідати вибраному власнику. Див. `docs/publishing.md`.
- Наявні прапорці (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) і далі працюють як перевизначення.
- Приватні репозиторії GitHub потребують `GITHUB_TOKEN`.

#### Рекомендований локальний процес

Спочатку використайте `--dry-run`, щоб підтвердити визначені метадані пакета та
атрибуцію джерела перед створенням живого релізу:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процес для локальної папки

Для code plugins публікація папки збирає та завантажує артефакт ClawPack з
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Мінімальний `package.json` для `--family code-plugin`

Зовнішнім code plugins потрібен невеликий обсяг метаданих OpenClaw у
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

- `package.json.version` — це версія релізу вашого пакета, але вона не використовується як
  fallback для перевірки сумісності/збірки OpenClaw.
- `openclaw.hostTargets` і `openclaw.environment` — необов’язкові метадані.
  ClawHub може показувати їх, якщо вони наявні, але вони не потрібні для публікації.
- `openclaw.compat.minGatewayVersion` і
  `openclaw.build.pluginSdkVersion` — необов’язкові додаткові поля, якщо ви хочете опублікувати
  докладніші метадані сумісності.
- Якщо ви використовуєте старіший реліз CLI `clawhub`, оновіться перед публікацією, щоб
  локальні попередні перевірки виконувалися перед завантаженням.

#### GitHub Actions

ClawHub також постачає офіційний повторно використовуваний workflow за адресою
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
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

- Повторно використовуваний workflow за замовчуванням встановлює `source` на репозиторій caller.
- Для monorepos передайте `source_path`, щоб workflow опублікував папку пакета plugin,
  наприклад `source_path: extensions/codex`.
- Зафіксуйте повторно використовуваний workflow на стабільному tag або повному commit SHA. Не запускайте публікацію релізу з `@main`.
- `pull_request` має використовувати `dry_run: true`, щоб CI не вносив забруднювальних змін.
- Справжні публікації мають бути обмежені довіреними подіями, як-от `workflow_dispatch` або push тегів.
- Довірена публікація без секрету працює лише для `workflow_dispatch`; push тегів усе ще потребує `clawhub_token`.
- Тримайте `clawhub_token` доступним для першої публікації, недовірених пакетів або аварійних публікацій.
- Workflow завантажує результат JSON як артефакт і надає його як outputs workflow.

### `sync`

- Сканує локальні папки Skills і публікує нові/змінені.
- Коренями можуть бути будь-які папки: каталог skills або одна папка skill із `SKILL.md`.
- Автоматично додає корені skill Clawdbot, коли наявний `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (основний agent)
  - `routing.agents.*.workspace/skills` (для кожного agent)
  - `~/.clawdbot/skills` (спільні)
  - `skills.load.extraDirs` (спільні packs)
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

- Надсилається під час `sync`, коли виконано вхід, якщо тільки не встановлено `CLAWHUB_DISABLE_TELEMETRY=1` (застаріле `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Подробиці: `docs/telemetry.md`.
