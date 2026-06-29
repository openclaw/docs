---
read_when:
    - Использование CLI ClawHub
    - Отладка установки, обновления или публикации
summary: 'Справочник CLI: команды, флаги, конфигурация и поведение lockfile.'
x-i18n:
    generated_at: "2026-06-28T22:39:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a20b288bab0e81c9ba63e054adc35b66c9013da1e0b310401b3f931c2d0b2a1
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Пакет CLI: `clawhub`, bin: `clawhub`.

Установите его глобально с помощью npm или pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Затем проверьте его:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Глобальные флаги

- `--workdir <dir>`: рабочий каталог (по умолчанию: cwd; откатывается к рабочей области Clawdbot, если она настроена)
- `--dir <dir>`: каталог установки внутри workdir (по умолчанию: `skills`)
- `--site <url>`: базовый URL для входа через браузер (по умолчанию: `https://clawhub.ai`)
- `--registry <url>`: базовый URL API (по умолчанию: обнаруженный, иначе `https://clawhub.ai`)
- `--no-input`: отключить запросы

Эквиваленты env:

- `CLAWHUB_SITE` (устаревший `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (устаревший `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (устаревший `CLAWDHUB_WORKDIR`)

### HTTP-прокси

CLI учитывает стандартные переменные окружения HTTP-прокси для систем за
корпоративными прокси или в сетях с ограничениями:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Когда задана любая из этих переменных, CLI направляет исходящие запросы через
указанный прокси. `HTTPS_PROXY` используется для HTTPS-запросов, `HTTP_PROXY`
для обычного HTTP. `NO_PROXY` / `no_proxy` учитывается для обхода прокси для
конкретных хостов или доменов.

Это требуется в системах, где прямые исходящие подключения заблокированы
(например, Docker-контейнеры, Hetzner VPS с доступом в интернет только через прокси, корпоративные
межсетевые экраны).

Пример:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Если переменная прокси не задана, поведение не меняется (прямые подключения).

## Файл конфигурации

Хранит ваш API-токен + кэшированный URL реестра.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` или `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Устаревший резервный вариант: если `clawhub/config.json` еще не существует, но существует `clawdhub/config.json`, CLI повторно использует устаревший путь
- переопределение: `CLAWHUB_CONFIG_PATH` (устаревший `CLAWDHUB_CONFIG_PATH`)

## Команды

### `login` / `auth login`

- По умолчанию: открывает браузер на `<site>/cli/auth` и завершает вход через callback loopback.
- Headless: `clawhub login --token clh_...`
- Удаленный/headless интерактивный режим: `clawhub login --device` печатает код и ожидает, пока вы авторизуете его на `<site>/cli/device`.

### `whoami`

- Проверяет сохраненный токен через `/api/v1/whoami`.

### `token`

- Печатает сохраненный API-токен в stdout.
- Полезно для передачи локального токена входа в команды настройки секретов CI через pipe.

### `star <skill>` / `unstar <skill>`

- Добавляет/удаляет skill из ваших избранных.
- Вызывает `POST /api/v1/stars/<slug>` и `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускает подтверждение.

### `search <query...>`

- Вызывает `/api/v1/search?q=...`.
- Вывод включает slug skill, handle владельца, отображаемое имя и оценку релевантности.
- Поиск отдает приоритет точным совпадениям токенов slug/имени перед популярностью скачиваний. Отдельный токен slug, такой как `map`, сопоставляется с `personal-map` сильнее, чем подстрока внутри `amap`.
- Популярность — небольшой ранжирующий prior, а не гарантия верхней позиции.
- Если skill должен появляться, но не появляется, выполните `clawhub inspect @owner/slug` после входа, чтобы проверить видимую владельцу модерационную диагностику перед переименованием метаданных.

### `explore`

- Выводит список новейших skills через `/api/v1/skills?limit=...&sort=createdAt` (сортировка по `createdAt` по убыванию).
- Флаги:
  - `--limit <n>` (1-200, по умолчанию: 25)
  - `--sort newest|updated|rating|downloads|trending` (по умолчанию: newest). Устаревшие псевдонимы сортировки установки по-прежнему работают для совместимости.
  - `--json` (машиночитаемый вывод)
- Вывод: `<slug>  v<version>  <age>  <summary>` (summary обрезается до 50 символов).

### `inspect @owner/slug`

- Получает метаданные skill и файлы версии без установки.
- `--version <version>`: проверить конкретную версию (по умолчанию: latest).
- `--tag <tag>`: проверить версию с тегом (например, `latest`).
- `--versions`: вывести историю версий (первая страница).
- `--limit <n>`: максимальное число версий в списке (1-200).
- `--files`: вывести список файлов для выбранной версии.
- `--file <path>`: получить исходное содержимое файла (только текстовые файлы; лимит 200 КБ).
- `--json`: машиночитаемый вывод.

### `install @owner/slug`

- Определяет последнюю версию для указанного владельца и skill.
- Загружает zip через `/api/v1/download`.
- Извлекает в `<workdir>/<dir>/<slug>`.
- Отказывается перезаписывать закрепленные skills; сначала выполните `clawhub unpin <skill>`.
- Записывает:
  - `<workdir>/.clawhub/lock.json` (устаревший `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (устаревший `.clawdhub`)

### `uninstall <skill>`

- Удаляет `<workdir>/<dir>/<slug>` и удаляет запись из lockfile.
- Отправляет телеметрию best-effort, если выполнен вход, чтобы текущие счетчики установок можно было
  деактивировать.
- Интерактивный режим: запрашивает подтверждение.
- Неинтерактивный режим (`--no-input`): требует `--yes`.

### `list`

- Читает `<workdir>/.clawhub/lock.json` (устаревший `.clawdhub`).
- Показывает `pinned` рядом со skills, замороженными через `clawhub pin`, включая необязательную причину.

### `pin <skill>`

- Помечает установленный skill как закрепленный в lockfile.
- `--reason <text>` записывает, почему skill заморожен.
- Закрепленные skills пропускаются `update --all` и отклоняются прямым `update <skill>`.
- Закрепленные skills также отклоняют `install --force`, чтобы локальные байты нельзя было случайно заменить.

### `unpin <skill>`

- Удаляет закрепление из lockfile для установленного skill, чтобы будущие обновления могли его изменить.

### `update [@owner/slug]` / `update --all`

- Вычисляет fingerprint из локальных файлов.
- Если fingerprint совпадает с известной версией: без запроса.
- Если fingerprint не совпадает:
  - отказывается по умолчанию
  - перезаписывает с `--force` (или по запросу, если интерактивно)
- Закрепленные skills никогда не обновляются через `--force`.
- `update <skill>` быстро завершается с ошибкой для закрепленных skills и предлагает сначала выполнить `clawhub unpin <skill>`.
- `update --all` пропускает закрепленные slug и печатает сводку о том, что осталось замороженным.

### `skill publish <path>`

- Сравнивает fingerprint локального bundle с ClawHub и успешно завершается, когда
  содержимое уже опубликовано.
- Для новых skills по умолчанию используется `1.0.0`; для измененных skills по умолчанию используется следующая patch
  version.
- `--version <version>` явно выбирает версию и публикует, даже когда
  содержимое совпадает с существующей версией.
- `--dry-run` выполняет разрешение публикации без загрузки; `--json` печатает
  машиночитаемый результат.
- `--owner <handle>` публикует под handle издателя организации/пользователя, когда
  actor имеет доступ издателя.
- `--migrate-owner` переносит существующий skill в `--owner`, одновременно публикуя новую
  версию. Требует доступа admin/owner у обоих издателей.
- Поведение владельца и ревью объясняется в `docs/publishing.md`.
- Публикация skill означает, что он выпускается на ClawHub под `MIT-0`.
- Опубликованные skills можно свободно использовать, изменять и распространять без указания авторства.
- ClawHub не поддерживает платные skills или pricing для отдельных skills.
- Устаревший псевдоним: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Переиспользуемый workflow ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
вызывает `skill publish` для одного `skill_path` или для каждой непосредственной папки skill
под `root` (по умолчанию: `skills`). Он пропускает неизмененные skills и использует
то же поведение автоматической patch-версии.

Установите `dry_run: true` для предварительного просмотра без токена. Реальные публикации требуют
секрет `clawhub_token`.

### `sync`

- Сканирует текущий workdir, настроенный каталог skills и любые
  папки `--root <dir>` на наличие локальных папок skill, содержащих `SKILL.md` или
  `skill.md`.
- Сравнивает fingerprint каждого локального skill с ClawHub и публикует только новые или
  измененные skills.
- Новые skills публикуются как `1.0.0`; измененные skills по умолчанию публикуют следующую patch version.
  Используйте `--bump minor|major` для пакетов обновлений, которые должны перейти на более крупный шаг semver.
- `--dry-run` показывает план публикации без загрузки; `--json` печатает
  машиночитаемый план.
- `--all` публикует каждый новый или измененный skill без запроса. Без
  `--all` интерактивные терминалы позволяют выбрать skills для публикации.
- `--owner <handle>` публикует под handle издателя организации/пользователя, когда
  actor имеет доступ издателя.
- `sync` — только односторонняя публикация. Он не устанавливает, не обновляет, не скачивает и не
  сообщает телеметрию установок/скачиваний.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Требует `clawhub login`.
- Запускает ClawHub ClawScan через `POST /api/v1/skills/-/scan`, затем опрашивает до терминального состояния сканирования.
- Сканирования асинхронны и могут занимать время. Пока задача в очереди, terminal spinner показывает текущую приоритетную позицию сканирования и сколько сканирований впереди.
- Опубликованные сканирования требуют права собственности или управленческого доступа издателя. Модераторы/admins могут использовать тот же backend через `clawhub-admin`.
- `--update` допустим только с `--slug`; он записывает успешные результаты опубликованного сканирования обратно в выбранную версию.
- `--output <file.zip>` скачивает полный архив отчета с `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` и `README.md`.
- `--json` печатает полный ответ опроса для автоматизации.
- Сканирования локального пути больше не поддерживаются. Загрузите новую версию, затем используйте `scan download`, чтобы получить сохраненные результаты сканирования для этой отправленной версии.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Требует `clawhub login`.
- Скачивает сохраненный ZIP-отчет сканирования для отправленной версии skill или plugin, включая версии, заблокированные или скрытые проверками безопасности ClawHub.
- Загрузки skill используют slug skill и по умолчанию `--kind skill`.
- Загрузки plugin используют имя пакета и требуют `--kind plugin`.
- `--version` обязателен, чтобы авторы проверяли точную отправленную версию, которую ClawHub заблокировал.
- `--output <file.zip>` выбирает путь назначения.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub поставляет официальный переиспользуемый workflow по адресу
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/skill-publish.yml)
для репозиториев skills и каталогов.

Типичная настройка каталога:

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

Примечания:

- `root` по умолчанию равен `skills` для репозиториев каталогов.
- Передайте `skill_path: skills/review-helper`, чтобы обработать одну папку skill.
- `owner` соответствует флагу CLI `--owner`; опустите его, чтобы публиковать как аутентифицированный пользователь.
- Публикация skills V1 использует `clawhub_token`; доверенная публикация GitHub OIDC пока доступна только для пакетов.

### `delete <skill>`

- Без `--version` мягко удаляет навык (владелец, модератор или администратор).
- Вызывает `DELETE /api/v1/skills/{slug}`.
- Мягкие удаления, инициированные владельцем, резервируют короткое имя на 30 дней; команда выводит время истечения срока.
- `--version <version>` безвозвратно удаляет одну принадлежащую владельцу версию, не являющуюся последней, через маршрут для конкретной версии, который при сбое отказывает в доступе.
  Удаленные версии нельзя восстановить или опубликовать заново. Опубликуйте замену перед удалением
  текущей последней версии. Сотрудники платформы не обходят проверку владения для этого потока только для версии.
- `--reason <text>` записывает модераторскую заметку для мягкого удаления всего навыка и журнала аудита.
- `--note <text>` является псевдонимом для `--reason`.
- `--yes` пропускает подтверждение.

### `undelete <skill>`

- Восстановить скрытый навык (владелец, модератор или администратор).
- Восстановления версии нет; безвозвратно удаленные версии нельзя восстановить.
- Вызывает `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записывает модераторскую заметку для навыка и журнала аудита.
- `--note <text>` является псевдонимом для `--reason`.
- `--yes` пропускает подтверждение.

### `hide <skill>`

- Скрыть навык (владелец, модератор или администратор).
- Псевдоним для `delete`.

### `unhide <skill>`

- Отобразить навык (владелец, модератор или администратор).
- Псевдоним для `undelete`.

### `skill rename <skill> <new-name>`

- Переименовать принадлежащий владельцу навык и сохранить прежнее короткое имя как псевдоним перенаправления.
- Вызывает `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускает подтверждение.

### `skill merge <source> <target>`

- Объединить один принадлежащий владельцу навык с другим принадлежащим владельцу навыком.
- Исходное короткое имя перестает отображаться публично и становится псевдонимом перенаправления на целевой навык.
- Вызывает `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускает подтверждение.

### `transfer`

- Рабочий процесс передачи владения.
- Передачи на пользовательские имена создают ожидающий запрос, который получатель принимает.
- Передачи на имена организаций/издателей применяются сразу только когда у действующего пользователя есть
  административный доступ и к текущему владельцу, и к целевому издателю.
- Подкоманды:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Конечные точки:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Просматривает или ищет в едином каталоге пакетов через `GET /api/v1/packages` и `GET /api/v1/packages/search`.
- Используйте это для plugins и других записей семейств пакетов; верхнеуровневый `search` остается поверхностью поиска навыков.
- Флаги:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, по умолчанию: 25)
  - `--json`

Примеры:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Получает метаданные пакета без установки.
- Используйте это для метаданных Plugin, совместимости, проверки, исходного кода и просмотра версий/файлов.
- `--version <version>`: проверить конкретную версию (по умолчанию: последнюю).
- `--tag <tag>`: проверить версию с тегом (например, `latest`).
- `--versions`: вывести историю версий (первая страница).
- `--limit <n>`: максимальное число версий для вывода (1-100).
- `--files`: вывести файлы для выбранной версии.
- `--file <path>`: получить необработанное содержимое файла (только текстовые файлы; ограничение 200 КБ).
- `--json`: вывод в машиночитаемом формате.

### `package download <name>`

- Разрешает версию пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Скачивает артефакт из `downloadUrl` резолвера.
- Проверяет ClawHub SHA-256 для всех артефактов.
- Для артефактов ClawPack npm-pack также проверяет целостность npm `sha512`,
  npm shasum и имя/версию в `package.json` архива tarball.
- Устаревшие ZIP-версии скачиваются через устаревший ZIP-маршрут.
- Флаги:
  - `--version <version>`: скачать конкретную версию.
  - `--tag <tag>`: скачать версию с тегом (по умолчанию: `latest`).
  - `-o, --output <path>`: выходной файл или каталог.
  - `--force`: перезаписать существующий выходной файл.
  - `--json`: вывод в машиночитаемом формате.

Примеры:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Вычисляет ClawHub SHA-256, целостность npm `sha512` и npm shasum для локального
  артефакта.
- С `--package` разрешает ожидаемые метаданные из ClawHub и сравнивает
  локальный файл с опубликованными метаданными артефакта.
- С прямыми флагами дайджеста проверяет без сетевого запроса.
- Флаги:
  - `--package <name>`: имя пакета для разрешения ожидаемых метаданных артефакта.
  - `--version <version>` или `--tag <tag>`: ожидаемая версия пакета.
  - `--sha256 <hex>`: ожидаемый ClawHub SHA-256.
  - `--npm-integrity <sri>`: ожидаемая целостность npm.
  - `--npm-shasum <sha1>`: ожидаемый npm shasum.
  - `--json`: вывод в машиночитаемом формате.

Примеры:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Запускает встроенный в ClawHub CLI инспектор Plugin для локальной папки пакета Plugin.
- По умолчанию выполняет автономную/статическую проверку, без поиска или импорта локальной
  рабочей копии OpenClaw.
- При критических ошибках совместимости команда завершается с ненулевым кодом. Замечания только уровня предупреждения выводятся,
  но команда завершается с нулевым кодом.
- Флаги:
  - `--out <dir>`: записать отчеты инспектора Plugin в этот каталог.
  - `--openclaw <path>`: проверять относительно явной локальной рабочей копии OpenClaw.
  - `--runtime`: включить захват среды выполнения; импортирует код Plugin.
  - `--allow-execute`: разрешить захват среды выполнения в изолированном рабочем пространстве.
  - `--no-mock-sdk`: отключить имитированный OpenClaw SDK во время захвата среды выполнения.
  - `--json`: вывод в машиночитаемом формате.

Пример:

```bash
clawhub package validate ./example-plugin
```

Если проверка сообщает о проблеме пакета, манифеста, импорта SDK или артефакта, см.
[исправления проверки Plugin](/ru/clawhub/plugin-validation-fixes), затем запустите команду повторно.

### `package delete <name>`

- Без `--version` мягко удаляет пакет и все выпуски.
- `--version <version>` безвозвратно удаляет один принадлежащий владельцу выпуск, не являющийся последним, через маршрут для конкретной версии, который при сбое отказывает в доступе.
  Удаленные версии нельзя восстановить или опубликовать заново. Опубликуйте замену перед удалением
  текущей последней версии. Для этого потока только для версии требуется владелец пакета или администратор издателя организации; сотрудники платформы не обходят владение пакетом.
- Мягкое удаление всего пакета требует владельца пакета, владельца/администратора издателя организации, модератора платформы
  или администратора платформы.
- Флаги:
  - `--version <version>`: безвозвратно удалить одну версию, не являющуюся последней.
  - `--yes`: пропустить подтверждение.
  - `--json`: вывод в машиночитаемом формате.

Пример:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Восстанавливает мягко удаленный пакет и выпуски.
- Восстановления версии нет; безвозвратно удаленные версии нельзя восстановить.
- Требуется владелец пакета, владелец/администратор издателя организации, модератор платформы
  или администратор платформы.
- Вызывает `POST /api/v1/packages/{name}/undelete`.
- Флаги:
  - `--yes`: пропустить подтверждение.
  - `--json`: вывод в машиночитаемом формате.

Пример:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Передает пакет другому издателю.
- Требуется административный доступ и к текущему владельцу пакета, и к целевому
  издателю, если действие не выполняется администратором платформы.
- Имена пакетов с областью должны передаваться соответствующему владельцу области.
- Вызывает `POST /api/v1/packages/{name}/transfer`.
- Флаги:
  - `--to <owner>`: имя целевого издателя.
  - `--reason <text>`: необязательная причина для аудита.
  - `--json`: вывод в машиночитаемом формате.

Пример:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Аутентифицированная команда для жалобы на пакет модераторам.
- Вызывает `POST /api/v1/packages/{name}/report`.
- Жалобы относятся к уровню пакета, при необходимости привязываются к версии и становятся видимыми
  модераторам для рассмотрения.
- Жалобы сами по себе не скрывают пакеты автоматически и не блокируют скачивания.
- Флаги:
  - `--version <version>`: необязательная версия пакета для прикрепления к жалобе.
  - `--reason <text>`: обязательная причина жалобы.
  - `--json`: вывод в машиночитаемом формате.

Пример:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда владельца для проверки видимости модерации пакета.
- Вызывает `GET /api/v1/packages/{name}/moderation`.
- Показывает текущее состояние сканирования пакета, число открытых жалоб, состояние ручной
  модерации последнего выпуска, состояние блокировки скачивания и причины модерации.
- Флаги:
  - `--json`: вывод в машиночитаемом формате.

Пример:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Проверяет, готов ли пакет к будущему использованию OpenClaw.
- Вызывает `GET /api/v1/packages/{name}/readiness`.
- Сообщает блокирующие факторы для официального статуса, доступности ClawPack, дайджеста артефакта,
  происхождения исходного кода, совместимости с OpenClaw, целевых сред хоста, метаданных окружения
  и состояния сканирования.
- Флаги:
  - `--json`: вывод в машиночитаемом формате.

Пример:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Показывает ориентированное на оператора состояние миграции для пакета, который может заменить
  встроенный OpenClaw plugin.
- Вызывает ту же вычисляемую конечную точку готовности, что и `package readiness`, но выводит
  состояние с фокусом на миграцию, последнюю версию, состояние официального пакета, проверки и
  блокирующие факторы.
- Флаги:
  - `--json`: вывод в машиночитаемом формате.

Пример:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Создает издателя организации, принадлежащего аутентифицированному пользователю.
- Имя нормализуется к нижнему регистру и может передаваться с `@` или без него.
- Новые издатели организаций по умолчанию не являются доверенными/официальными.
- Завершается ошибкой, если имя уже используется существующим издателем, пользователем или зарезервированным маршрутом.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Публикует кодовый плагин или пакетный плагин через `POST /api/v1/packages`.
- `<source>` принимает:
  - Путь к локальной папке: `./my-plugin`
  - Локальный tarball npm-pack ClawPack: `./my-plugin-1.2.3.tgz`
  - Репозиторий GitHub: `owner/repo` или `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метаданные автоматически определяются из `package.json`, `openclaw.plugin.json` и
  реальных маркеров пакета OpenClaw, таких как `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` и `.cursor-plugin/plugin.json`.
- Источники `.tgz` обрабатываются как ClawPack. CLI загружает точные байты
  npm-pack и использует извлеченное содержимое `package/` только для проверки и
  предварительного заполнения метаданных.
- Папки кодовых плагинов упаковываются в npm-tarball ClawPack перед загрузкой,
  чтобы установки OpenClaw могли проверить точный артефакт. Папки пакетных
  плагинов по-прежнему используют путь публикации извлеченных файлов.
- Для источников GitHub атрибуция источника автоматически заполняется из репозитория, разрешенного коммита, ref и подпути.
- Для локальных папок атрибуция источника автоматически определяется из локального git, когда удаленный origin указывает на GitHub.
- Внешние кодовые плагины должны явно объявлять `openclaw.compat.pluginApi` и
  `openclaw.build.openclawVersion`.
  Верхнеуровневый `package.json.version` не используется как запасной вариант для проверки публикации.
- `--dry-run` предварительно показывает разрешенную полезную нагрузку публикации без загрузки.
- `--json` выводит машиночитаемый результат для CI.
- `--owner <handle>` публикует под handle издателя пользователя или организации, когда у действующего лица есть доступ издателя.
- Имена пакетов со scope должны соответствовать выбранному владельцу. См. `docs/publishing.md`.
- Существующие флаги (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) по-прежнему работают как переопределения.
- Для приватных репозиториев GitHub требуется `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендуемый локальный процесс

Сначала используйте `--dry-run`, чтобы подтвердить разрешенные метаданные пакета и
атрибуцию источника перед созданием реального выпуска:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процесс для локальной папки

Для кодовых плагинов публикация папки собирает и загружает артефакт ClawPack из
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Минимальный `package.json` для `--family code-plugin`

Внешним кодовым плагинам требуется небольшой объем метаданных OpenClaw в
`package.json`. Этого минимального манифеста достаточно для успешной публикации:

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

Обязательные поля:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Примечания:

- `package.json.version` — это версия выпуска вашего пакета, но она не используется как
  запасной вариант для проверки совместимости/сборки OpenClaw.
- `openclaw.hostTargets` и `openclaw.environment` — необязательные метаданные.
  ClawHub может отображать их при наличии, но они не обязательны для публикации.
- `openclaw.compat.minGatewayVersion` и
  `openclaw.build.pluginSdkVersion` — необязательные дополнительные поля, если вы хотите опубликовать
  более подробные метаданные совместимости.
- Если вы используете более старый выпуск CLI `clawhub`, обновитесь перед публикацией, чтобы
  локальные предварительные проверки выполнялись до загрузки.
- Если проверка сообщает код исправления, см.
  [Исправления проверки Plugin](/ru/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub также поставляет официальный переиспользуемый workflow по адресу
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/package-publish.yml)
для репозиториев плагинов.

Типичная настройка вызывающего workflow:

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

Примечания:

- Переиспользуемый workflow по умолчанию задает `source` как вызывающий репозиторий.
- Для монорепозиториев передайте `source_path`, чтобы workflow опубликовал папку
  пакета плагина, например `source_path: extensions/codex`.
- Закрепляйте переиспользуемый workflow на стабильном теге или полном SHA коммита. Не запускайте публикацию релиза из `@main`.
- `pull_request` должен использовать `dry_run: true`, чтобы CI не создавала загрязняющих изменений.
- Реальные публикации должны быть ограничены доверенными событиями, такими как `workflow_dispatch` или push тегов.
- Доверенная публикация без секрета работает только на `workflow_dispatch`; для push тегов по-прежнему нужен `clawhub_token`.
- Держите `clawhub_token` доступным для первой публикации, недоверенных пакетов или аварийных публикаций.
- Workflow загружает результат JSON как артефакт и предоставляет его как выходные данные workflow.

### `package trusted-publisher get <name>`

- Показывает конфигурацию доверенного издателя GitHub Actions для пакета.
- Используйте это после задания конфигурации, чтобы подтвердить репозиторий, имя файла workflow
  и необязательную привязку environment.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Прикрепляет или заменяет конфигурацию доверенного издателя GitHub Actions для существующего
  пакета.
- Пакет сначала должен быть создан через обычную ручную или token-authenticated
  `clawhub package publish`.
- После задания конфигурации будущие поддерживаемые публикации GitHub Actions могут использовать
  OIDC/доверенную публикацию без долгоживущего токена ClawHub.
- `--repository <repo>` должен быть `owner/repo`.
- `--workflow-filename <file>` должен совпадать с именем файла workflow в
  `.github/workflows/`.
- `--environment <name>` необязателен. Если он настроен, environment GitHub Actions
  в утверждении OIDC должен точно совпадать.
- ClawHub проверяет настроенный репозиторий GitHub при выполнении этой команды.
  Публичные репозитории можно проверить через публичные метаданные GitHub. Для приватных
  репозиториев ClawHub должен иметь доступ GitHub к этому репозиторию, например
  через будущую установку GitHub App ClawHub или другую авторизованную
  интеграцию GitHub.
- Флаги:
  - `--repository <repo>`: репозиторий GitHub, например `openclaw/example-plugin`.
  - `--workflow-filename <file>`: имя файла workflow, например `package-publish.yml`.
  - `--environment <name>`: необязательный environment GitHub Actions с точным совпадением.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Удаляет конфигурацию доверенного издателя из пакета.
- Используйте это как откат, если workflow, репозиторий или привязку environment нужно
  отключить или создать заново.
- Будущие реальные публикации должны использовать обычную аутентифицированную публикацию, пока конфигурация
  не будет задана снова.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Телеметрия установки

- Отправляется после `clawhub install <slug>` при выполненном входе, если только
  не задано `CLAWHUB_DISABLE_TELEMETRY=1`.
- Отправка выполняется по принципу best-effort. Команды установки не завершаются с ошибкой, если телеметрия
  недоступна.
- Подробности: `docs/telemetry.md`.
