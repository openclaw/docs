---
read_when:
    - Использование CLI ClawHub
    - Отладка установки, обновления или публикации
summary: 'Справочник CLI: команды, флаги, конфигурация и поведение lockfile.'
x-i18n:
    generated_at: "2026-07-03T17:32:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
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
- `--no-input`: отключить запросы ввода

Эквиваленты переменных окружения:

- `CLAWHUB_SITE` (устаревшее `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (устаревшее `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (устаревшее `CLAWDHUB_WORKDIR`)

### HTTP-прокси

CLI учитывает стандартные переменные окружения HTTP-прокси для систем за
корпоративными прокси или в сетях с ограничениями:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Когда задана любая из этих переменных, CLI направляет исходящие запросы через
указанный прокси. `HTTPS_PROXY` используется для HTTPS-запросов, `HTTP_PROXY`
для обычного HTTP. `NO_PROXY` / `no_proxy` учитывается, чтобы обходить прокси для
конкретных хостов или доменов.

Это требуется в системах, где прямые исходящие соединения заблокированы
(например, Docker-контейнеры, VPS Hetzner с доступом в интернет только через
прокси, корпоративные межсетевые экраны).

Пример:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Если переменная прокси не задана, поведение не меняется (прямые соединения).

## Файл конфигурации

Хранит ваш API-токен и кэшированный URL реестра.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` или `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Устаревший резервный путь: если `clawhub/config.json` еще не существует, но существует `clawdhub/config.json`, CLI переиспользует устаревший путь
- переопределение: `CLAWHUB_CONFIG_PATH` (устаревшее `CLAWDHUB_CONFIG_PATH`)

## Команды

### `login` / `auth login`

- По умолчанию: открывает браузер на `<site>/cli/auth` и завершает вход через callback local loopback.
- Без графического интерфейса: `clawhub login --token clh_...`
- Удаленный/безголовый интерактивный режим: `clawhub login --device` выводит код и ждет, пока вы авторизуете его на `<site>/cli/device`.

### `whoami`

- Проверяет сохраненный токен через `/api/v1/whoami`.

### `token`

- Печатает сохраненный API-токен в stdout.
- Полезно для передачи локального токена входа в команды настройки секретов CI.

### `star <skill>` / `unstar <skill>`

- Добавляет или удаляет skill из ваших избранных.
- Вызывает `POST /api/v1/stars/<slug>` и `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускает подтверждение.

### `search <query...>`

- Вызывает `/api/v1/search?q=...`.
- Вывод включает slug skill, handle владельца, отображаемое имя и оценку релевантности.
- Поиск отдает предпочтение точным совпадениям токенов slug/имени перед популярностью загрузок. Отдельный токен slug, например `map`, соответствует `personal-map` сильнее, чем подстроке внутри `amap`.
- Популярность — небольшой априорный фактор ранжирования, а не гарантия верхней позиции.
- Если skill должен отображаться, но не отображается, выполните `clawhub inspect @owner/slug` после входа, чтобы проверить видимую владельцу диагностику модерации перед переименованием метаданных.

### `explore`

- Перечисляет новейшие skills через `/api/v1/skills?limit=...&sort=createdAt` (сортировка по `createdAt` по убыванию).
- Флаги:
  - `--limit <n>` (1-200, по умолчанию: 25)
  - `--sort newest|updated|rating|downloads|trending` (по умолчанию: newest). Устаревшие псевдонимы сортировки установки продолжают работать для совместимости.
  - `--json` (машиночитаемый вывод)
- Вывод: `<slug>  v<version>  <age>  <summary>` (summary обрезается до 50 символов).

### `inspect @owner/slug`

- Получает метаданные skill и файлы версии без установки.
- `--version <version>`: проверить конкретную версию (по умолчанию: latest).
- `--tag <tag>`: проверить помеченную тегом версию (например, `latest`).
- `--versions`: вывести историю версий (первая страница).
- `--limit <n>`: максимальное число версий в списке (1-200).
- `--files`: вывести список файлов для выбранной версии.
- `--file <path>`: получить сырое содержимое файла (только текстовые файлы; лимит 200 КБ).
- `--json`: машиночитаемый вывод.

### `install @owner/slug`

- Определяет последнюю версию для указанного владельца и skill.
- Скачивает zip через `/api/v1/download`.
- Извлекает в `<workdir>/<dir>/<slug>`.
- Отказывается перезаписывать закрепленные skills; сначала выполните `clawhub unpin <skill>`.
- Записывает:
  - `<workdir>/.clawhub/lock.json` (устаревшее `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (устаревшее `.clawdhub`)

### `uninstall <skill>`

- Удаляет `<workdir>/<dir>/<slug>` и удаляет запись из lockfile.
- Отправляет телеметрию по возможности, пока выполнен вход, чтобы текущие счетчики установок можно было
  деактивировать.
- Интерактивный режим: запрашивает подтверждение.
- Неинтерактивный режим (`--no-input`): требует `--yes`.

### `list`

- Читает `<workdir>/.clawhub/lock.json` (устаревшее `.clawdhub`).
- Показывает `pinned` рядом со skills, замороженными через `clawhub pin`, включая необязательную причину.

### `pin <skill>`

- Помечает установленный skill как закрепленный в lockfile.
- `--reason <text>` записывает, почему skill заморожен.
- Закрепленные skills пропускаются `update --all` и отклоняются при прямом `update <skill>`.
- Закрепленные skills также отклоняют `install --force`, чтобы локальные байты не были случайно заменены.

### `unpin <skill>`

- Удаляет закрепление lockfile с установленного skill, чтобы будущие обновления могли изменить его.

### `update [@owner/slug]` / `update --all`

- Вычисляет fingerprint по локальным файлам.
- Если fingerprint совпадает с известной версией: без запроса.
- Если fingerprint не совпадает:
  - по умолчанию отказывается
  - перезаписывает с `--force` (или по запросу, если интерактивно)
- Закрепленные skills никогда не обновляются с `--force`.
- `update <skill>` быстро завершается с ошибкой для закрепленных skills и сообщает, что сначала нужно выполнить `clawhub unpin <skill>`.
- `update --all` пропускает закрепленные slugs и печатает сводку о том, что осталось замороженным.

### `skill publish <path>`

- Сравнивает fingerprint локального bundle с ClawHub и успешно завершается, когда
  содержимое уже опубликовано.
- Новые skills по умолчанию получают `1.0.0`; измененные skills по умолчанию получают следующую patch-
  версию.
- `--version <version>` явно выбирает версию и публикует, даже когда
  содержимое совпадает с существующей версией.
- `--dry-run` вычисляет публикацию без загрузки; `--json` печатает
  машиночитаемый результат.
- `--owner <handle>` публикует от имени handle издателя org/user, когда
  actor имеет доступ издателя.
- `--migrate-owner` переносит существующий skill в `--owner` при публикации новой
  версии. Требует доступа admin/owner у обоих издателей.
- Поведение владельцев и проверки объясняется в `docs/publishing.md`.
- Публикация skill означает, что он выпускается под `MIT-0` на ClawHub.
- Опубликованные skills можно свободно использовать, изменять и распространять без указания авторства.
- ClawHub не поддерживает платные skills или ценообразование для отдельных skills.
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
внутри `root` (по умолчанию: `skills`). Он пропускает неизмененные skills и использует то же
поведение автоматической patch-версии.

Установите `dry_run: true`, чтобы предварительно посмотреть результат без токена. Для настоящих публикаций требуется
секрет `clawhub_token`.

### `sync`

- Сканирует текущий workdir, настроенный каталог skills и любые
  папки `--root <dir>` на наличие локальных папок skills, содержащих `SKILL.md` или
  `skill.md`.
- Сравнивает fingerprint каждого локального skill с ClawHub и публикует только новые или
  измененные skills.
- Новые skills публикуются как `1.0.0`; измененные skills по умолчанию публикуют следующую patch-версию.
  Используйте `--bump minor|major` для пакетов обновлений, которые должны перейти на
  более крупный шаг semver.
- `--dry-run` показывает план публикации без загрузки; `--json` печатает
  машиночитаемый план.
- `--all` публикует каждый новый или измененный skill без запроса. Без
  `--all` интерактивные терминалы позволяют выбрать skills для публикации.
- `--owner <handle>` публикует от имени handle издателя org/user, когда
  actor имеет доступ издателя.
- `sync` — только односторонняя публикация. Он не устанавливает, не обновляет, не скачивает и не
  сообщает телеметрию установок/загрузок.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Требует `clawhub login`.
- Запускает ClawHub ClawScan через `POST /api/v1/skills/-/scan`, затем опрашивает до терминального состояния scan.
- Scans асинхронны и могут потребовать времени для завершения. Пока scan находится в очереди, индикатор в терминале показывает текущую приоритетную позицию scan и сколько scans впереди.
- Для опубликованных scans требуется владение или доступ к управлению издателем. Модераторы/admins могут использовать тот же backend через `clawhub-admin`.
- `--update` допустим только с `--slug`; он записывает успешные результаты опубликованного scan обратно в выбранную версию.
- `--output <file.zip>` скачивает полный архив отчета с `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` и `README.md`.
- `--json` печатает полный ответ опроса для автоматизации.
- Scans локального пути больше не поддерживаются. Загрузите новую версию, затем используйте `scan download`, чтобы получить сохраненные результаты scan для этой отправленной версии.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Требует `clawhub login`.
- Скачивает ZIP сохраненного отчета scan для отправленной версии skill или plugin, включая версии, которые были заблокированы или скрыты проверками безопасности ClawHub.
- Скачивания skill используют slug skill и по умолчанию `--kind skill`.
- Скачивания Plugin используют имя пакета и требуют `--kind plugin`.
- `--version` обязателен, чтобы авторы проверяли точную отправленную версию, которую ClawHub заблокировал.
- `--output <file.zip>` выбирает путь назначения.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub поставляет официальный переиспользуемый workflow по адресу
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
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

- Без `--version` выполняет мягкое удаление skill (владелец, модератор или администратор).
- Вызывает `DELETE /api/v1/skills/{slug}`.
- Мягкие удаления, инициированные владельцем, резервируют slug на 30 дней; команда выводит время истечения.
- `--version <version>` безвозвратно удаляет одну принадлежащую владельцу не самую новую версию через fail-closed,
  версионированный маршрут.
  Удаленные версии нельзя восстановить или опубликовать повторно. Опубликуйте замену перед удалением
  текущей самой новой версии. Сотрудники платформы не обходят право владения для этого потока только для версий.
- `--reason <text>` записывает модераторскую заметку для мягкого удаления всего skill и журнала аудита.
- `--note <text>` — псевдоним для `--reason`.
- `--yes` пропускает подтверждение.

### `undelete <skill>`

- Восстанавливает скрытый skill (владелец, модератор или администратор).
- Отмены удаления версии нет; безвозвратно удаленные версии нельзя восстановить.
- Вызывает `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записывает модераторскую заметку для skill и журнала аудита.
- `--note <text>` — псевдоним для `--reason`.
- `--yes` пропускает подтверждение.

### `hide <skill>`

- Скрывает skill (владелец, модератор или администратор).
- Псевдоним для `delete`.

### `unhide <skill>`

- Отображает skill (владелец, модератор или администратор).
- Псевдоним для `undelete`.

### `skill rename <skill> <new-name>`

- Переименовывает принадлежащий владельцу skill и сохраняет предыдущий slug как псевдоним перенаправления.
- Вызывает `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускает подтверждение.

### `skill merge <source> <target>`

- Объединяет один принадлежащий владельцу skill с другим принадлежащим владельцу skill.
- Исходный slug перестает публично отображаться и становится псевдонимом перенаправления к целевому.
- Вызывает `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускает подтверждение.

### `transfer`

- Рабочий процесс передачи права владения.
- Передачи пользовательским handle создают ожидающий запрос, который получатель принимает.
- Передачи handle организаций/издателей применяются немедленно только когда у действующего пользователя есть
  административный доступ и к текущему владельцу, и к целевому издателю.
- Подкоманды:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Эндпоинты:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Просматривает или ищет в едином каталоге пакетов через `GET /api/v1/packages` и `GET /api/v1/packages/search`.
- Используйте это для plugins и других записей семейства пакетов; верхнеуровневый `search` остается поверхностью поиска skill.
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
- Используйте это для метаданных plugin, совместимости, проверки, исходного кода и инспекции версий/файлов.
- `--version <version>`: проверить конкретную версию (по умолчанию: latest).
- `--tag <tag>`: проверить версию с тегом (например, `latest`).
- `--versions`: вывести историю версий (первая страница).
- `--limit <n>`: максимальное число версий в списке (1-100).
- `--files`: вывести список файлов для выбранной версии.
- `--file <path>`: получить необработанное содержимое файла (только текстовые файлы; лимит 200 КБ).
- `--json`: машиночитаемый вывод.

### `package download <name>`

- Разрешает версию пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Скачивает артефакт из `downloadUrl` резолвера.
- Проверяет ClawHub SHA-256 для всех артефактов.
- Для артефактов ClawPack npm-pack также проверяет целостность npm `sha512`,
  npm shasum и имя/версию `package.json` tarball.
- Устаревшие ZIP-версии скачиваются через устаревший ZIP-маршрут.
- Флаги:
  - `--version <version>`: скачать конкретную версию.
  - `--tag <tag>`: скачать версию с тегом (по умолчанию: `latest`).
  - `-o, --output <path>`: выходной файл или каталог.
  - `--force`: перезаписать существующий выходной файл.
  - `--json`: машиночитаемый вывод.

Примеры:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Вычисляет ClawHub SHA-256, целостность npm `sha512` и npm shasum для локального
  артефакта.
- С `--package` разрешает ожидаемые метаданные из ClawHub и сравнивает
  локальный файл с метаданными опубликованного артефакта.
- С прямыми флагами дайджеста проверяет без сетевого запроса.
- Флаги:
  - `--package <name>`: имя пакета для разрешения ожидаемых метаданных артефакта.
  - `--version <version>` или `--tag <tag>`: ожидаемая версия пакета.
  - `--sha256 <hex>`: ожидаемый ClawHub SHA-256.
  - `--npm-integrity <sri>`: ожидаемая целостность npm.
  - `--npm-shasum <sha1>`: ожидаемый npm shasum.
  - `--json`: машиночитаемый вывод.

Примеры:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Запускает встроенный в ClawHub CLI Plugin Inspector для локальной папки пакета plugin.
- По умолчанию использует офлайн/статическую валидацию, без поиска или импорта локального
  checkout OpenClaw.
- Жесткие ошибки совместимости завершаются ненулевым кодом. Находки только с предупреждениями выводятся, но
  завершаются нулевым кодом.
- Флаги:
  - `--out <dir>`: записать отчеты Plugin Inspector в этот каталог.
  - `--openclaw <path>`: проверять относительно явного локального checkout OpenClaw.
  - `--runtime`: включить runtime-захват; импортирует код plugin.
  - `--allow-execute`: разрешить runtime-захват в изолированной рабочей области.
  - `--no-mock-sdk`: отключить имитированный OpenClaw SDK во время runtime-захвата.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package validate ./example-plugin
```

Если валидация сообщает о находке в пакете, манифесте, импорте SDK или артефакте, см.
[исправления валидации Plugin](/clawhub/plugin-validation-fixes), затем повторно выполните команду.

### `package delete <name>`

- Без `--version` выполняет мягкое удаление пакета и всех релизов.
- `--version <version>` безвозвратно удаляет один принадлежащий владельцу не самый новый релиз через fail-closed,
  версионированный маршрут.
  Удаленные версии нельзя восстановить или опубликовать повторно. Опубликуйте замену перед удалением
  текущей самой новой версии. Этот поток только для версий требует владельца пакета или администратора
  издателя организации; сотрудники платформы не обходят право владения пакетом.
- Мягкое удаление всего пакета требует владельца пакета, владельца/администратора издателя организации, модератора
  платформы или администратора платформы.
- Флаги:
  - `--version <version>`: безвозвратно удалить одну не самую новую версию.
  - `--yes`: пропустить подтверждение.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Восстанавливает мягко удаленный пакет и релизы.
- Отмены удаления версии нет; безвозвратно удаленные версии нельзя восстановить.
- Требует владельца пакета, владельца/администратора издателя организации, модератора платформы
  или администратора платформы.
- Вызывает `POST /api/v1/packages/{name}/undelete`.
- Флаги:
  - `--yes`: пропустить подтверждение.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Передает пакет другому издателю.
- Требует административного доступа и к текущему владельцу пакета, и к целевому
  издателю, если это не выполняется администратором платформы.
- Имена scoped-пакетов должны передаваться владельцу соответствующего scope.
- Вызывает `POST /api/v1/packages/{name}/transfer`.
- Флаги:
  - `--to <owner>`: handle целевого издателя.
  - `--reason <text>`: необязательная причина для аудита.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Аутентифицированная команда для отправки жалобы на пакет модераторам.
- Вызывает `POST /api/v1/packages/{name}/report`.
- Жалобы относятся к уровню пакета, при необходимости привязываются к версии и становятся видимыми
  модераторам для проверки.
- Жалобы сами по себе не скрывают пакеты автоматически и не блокируют скачивания.
- Флаги:
  - `--version <version>`: необязательная версия пакета для прикрепления к жалобе.
  - `--reason <text>`: обязательная причина жалобы.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Команда владельца для проверки видимости модерации пакета.
- Вызывает `GET /api/v1/packages/{name}/moderation`.
- Показывает текущее состояние сканирования пакета, число открытых жалоб, состояние ручной
  модерации последнего релиза, состояние блокировки скачивания и причины модерации.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Проверяет, готов ли пакет к будущему потреблению OpenClaw.
- Вызывает `GET /api/v1/packages/{name}/readiness`.
- Сообщает о блокерах для официального статуса, доступности ClawPack, дайджеста артефакта,
  происхождения исходного кода, совместимости с OpenClaw, целевых хостов, метаданных окружения
  и состояния сканирования.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Показывает ориентированное на оператора состояние миграции для пакета, который может заменить
  встроенный plugin OpenClaw.
- Вызывает тот же вычисляемый эндпоинт готовности, что и `package readiness`, но выводит
  ориентированный на миграцию статус, последнюю версию, состояние официального пакета, проверки и
  блокеры.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Создает издателя организации, принадлежащего аутентифицированному пользователю.
- Handle нормализуется к нижнему регистру и может передаваться с `@` или без него.
- Новые издатели организаций по умолчанию не являются доверенными/официальными.
- Завершается ошибкой, если handle уже используется существующим издателем, пользователем или зарезервированным маршрутом.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Публикует кодовый plugin или пакетный plugin через `POST /api/v1/packages`.
- `<source>` принимает:
  - Путь к локальной папке: `./my-plugin`
  - Локальный npm-pack tarball ClawPack: `./my-plugin-1.2.3.tgz`
  - Репозиторий GitHub: `owner/repo` или `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метаданные автоматически определяются из `package.json`, `openclaw.plugin.json` и
  настоящих маркеров пакетного OpenClaw, таких как `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` и `.cursor-plugin/plugin.json`.
- Источники `.tgz` рассматриваются как ClawPack. CLI загружает точные байты
  npm-pack и использует извлеченное содержимое `package/` только для валидации и
  предварительного заполнения метаданных.
- Папки кодовых plugins перед загрузкой упаковываются в npm tarball ClawPack,
  чтобы установки OpenClaw могли проверить точный артефакт. Папки пакетных plugins по-прежнему
  используют путь публикации извлеченных файлов.
- Для источников GitHub атрибуция источника автоматически заполняется из репозитория, разрешенного коммита, ref и подпути.
- Для локальных папок атрибуция источника автоматически определяется из локального git, когда origin remote указывает на GitHub.
- Внешние кодовые plugins должны явно объявлять `openclaw.compat.pluginApi` и
  `openclaw.build.openclawVersion`.
  Верхнеуровневый `package.json.version` не используется как fallback для валидации публикации.
- `--dry-run` предварительно показывает разрешенную полезную нагрузку публикации без загрузки.
- `--json` выводит машиночитаемый результат для CI.
- `--owner <handle>` публикует под пользовательским или организационным handle издателя, когда у участника есть доступ издателя.
- Имена scoped-пакетов должны соответствовать выбранному владельцу. См. `docs/publishing.md`.
- Существующие флаги (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) по-прежнему работают как переопределения.
- Для приватных репозиториев GitHub требуется `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендуемый локальный поток

Сначала используйте `--dry-run`, чтобы подтвердить разрешенные метаданные пакета и
атрибуцию источника перед созданием реального релиза:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Поток с локальной папкой

Для кодовых plugins публикация папки собирает и загружает артефакт ClawPack из
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Минимальный `package.json` для `--family code-plugin`

Внешним кодовым plugins требуется небольшой объем метаданных OpenClaw в
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

- `package.json.version` — это версия релиза вашего пакета, но она не используется как
  fallback для валидации совместимости/сборки OpenClaw.
- `openclaw.hostTargets` и `openclaw.environment` — необязательные метаданные.
  ClawHub может отображать их при наличии, но они не требуются для публикации.
- `openclaw.compat.minGatewayVersion` и
  `openclaw.build.pluginSdkVersion` — необязательные дополнительные поля, если вы хотите опубликовать
  более подробные метаданные совместимости.
- Если вы используете старый релиз CLI `clawhub`, обновитесь перед публикацией, чтобы
  локальные предварительные проверки выполнялись до загрузки.
- Если валидация сообщает код исправления, см.
  [исправления валидации Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub также поставляет официальный переиспользуемый workflow по адресу
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
для репозиториев plugins.

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
- Для монорепозиториев передайте `source_path`, чтобы workflow публиковал папку пакета plugin,
  например `source_path: extensions/codex`.
- Зафиксируйте переиспользуемый workflow на стабильном теге или полном SHA коммита. Не запускайте публикацию релиза из `@main`.
- `pull_request` должен использовать `dry_run: true`, чтобы CI не вносил побочных изменений.
- Реальные публикации следует ограничивать доверенными событиями, такими как `workflow_dispatch` или push тегов.
- Доверенная публикация без секрета работает только на `workflow_dispatch`; для push тегов по-прежнему нужен `clawhub_token`.
- Держите `clawhub_token` доступным для первой публикации, недоверенных пакетов или экстренных публикаций.
- Workflow загружает JSON-результат как артефакт и предоставляет его как outputs workflow.

### `package trusted-publisher get <name>`

- Показывает конфигурацию доверенного издателя GitHub Actions для пакета.
- Используйте это после настройки конфигурации, чтобы подтвердить репозиторий, имя файла workflow
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
- Пакет сначала должен быть создан через обычный ручной или токен-аутентифицированный
  `clawhub package publish`.
- После настройки конфигурации будущие поддерживаемые публикации GitHub Actions могут использовать
  OIDC/доверенную публикацию без долгоживущего токена ClawHub.
- `--repository <repo>` должен быть `owner/repo`.
- `--workflow-filename <file>` должен совпадать с именем файла workflow в
  `.github/workflows/`.
- `--environment <name>` необязателен. Когда он настроен, environment GitHub Actions
  в claim OIDC должен совпадать точно.
- ClawHub проверяет настроенный репозиторий GitHub при выполнении этой команды.
  Публичные репозитории можно проверить через публичные метаданные GitHub. Приватные
  репозитории требуют, чтобы ClawHub имел доступ GitHub к этому репозиторию, например
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
- Будущие реальные публикации должны использовать обычную аутентифицированную публикацию, пока конфигурация не будет
  настроена снова.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Телеметрия установки

- Отправляется после `clawhub install <slug>` при входе в систему, если не задано
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- Отчетность выполняется по принципу best-effort. Команды установки не завершаются ошибкой, если телеметрия
  недоступна.
- Подробности: `docs/telemetry.md`.
