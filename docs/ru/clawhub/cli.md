---
read_when:
    - Использование CLI ClawHub
    - Отладка установки, обновления или публикации
summary: 'Справочник CLI: команды, флаги, конфигурация и поведение lockfile.'
x-i18n:
    generated_at: "2026-06-30T22:26:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119900fddb8c80213eb12060c07026527a1ff851546c632bf1f7a909659b1945
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Пакет CLI: `clawhub`, бинарный файл: `clawhub`.

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

- `--workdir <dir>`: рабочий каталог (по умолчанию: cwd; откатывается к рабочему пространству Clawdbot, если оно настроено)
- `--dir <dir>`: каталог установки внутри workdir (по умолчанию: `skills`)
- `--site <url>`: базовый URL для входа через браузер (по умолчанию: `https://clawhub.ai`)
- `--registry <url>`: базовый URL API (по умолчанию: обнаруженный, иначе `https://clawhub.ai`)
- `--no-input`: отключить запросы

Эквиваленты переменных окружения:

- `CLAWHUB_SITE` (устаревшее `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (устаревшее `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (устаревшее `CLAWDHUB_WORKDIR`)

### HTTP-прокси

CLI учитывает стандартные переменные окружения HTTP-прокси для систем за
корпоративными прокси или в ограниченных сетях:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Когда задана любая из этих переменных, CLI направляет исходящие запросы через
указанный прокси. `HTTPS_PROXY` используется для HTTPS-запросов, `HTTP_PROXY`
для обычного HTTP. `NO_PROXY` / `no_proxy` учитывается для обхода прокси для
конкретных хостов или доменов.

Это требуется в системах, где прямые исходящие соединения заблокированы
(например, контейнеры Docker, Hetzner VPS с доступом в интернет только через
прокси, корпоративные брандмауэры).

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
- Устаревший резервный вариант: если `clawhub/config.json` еще не существует, но `clawdhub/config.json` существует, CLI повторно использует устаревший путь
- переопределение: `CLAWHUB_CONFIG_PATH` (устаревшее `CLAWDHUB_CONFIG_PATH`)

## Команды

### `login` / `auth login`

- По умолчанию: открывает браузер на `<site>/cli/auth` и завершает вход через callback local loopback.
- Без графического интерфейса: `clawhub login --token clh_...`
- Удаленный/безголовый интерактивный режим: `clawhub login --device` выводит код и ждет, пока вы авторизуете его на `<site>/cli/device`.

### `whoami`

- Проверяет сохраненный токен через `/api/v1/whoami`.

### `token`

- Выводит сохраненный API-токен в stdout.
- Полезно для передачи локального токена входа в команды настройки секретов CI.

### `star <skill>` / `unstar <skill>`

- Добавляет/удаляет навык из ваших выделенных.
- Вызывает `POST /api/v1/stars/<slug>` и `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускает подтверждение.

### `search <query...>`

- Вызывает `/api/v1/search?q=...`.
- Вывод включает slug навыка, handle владельца, отображаемое имя и оценку релевантности.
- Поиск отдает приоритет точным совпадениям токенов slug/имени перед популярностью загрузок. Отдельный токен slug, такой как `map`, сильнее соответствует `personal-map`, чем подстроке внутри `amap`.
- Популярность является небольшим предварительным фактором ранжирования, а не гарантией верхней позиции.
- Если навык должен появляться, но не появляется, выполните `clawhub inspect @owner/slug` после входа, чтобы проверить видимую владельцу диагностику модерации перед переименованием метаданных.

### `explore`

- Выводит новейшие Skills через `/api/v1/skills?limit=...&sort=createdAt` (сортировка по `createdAt` по убыванию).
- Флаги:
  - `--limit <n>` (1-200, по умолчанию: 25)
  - `--sort newest|updated|rating|downloads|trending` (по умолчанию: newest). Устаревшие алиасы сортировки установки по-прежнему работают для совместимости.
  - `--json` (машиночитаемый вывод)
- Вывод: `<slug>  v<version>  <age>  <summary>` (summary обрезается до 50 символов).

### `inspect @owner/slug`

- Получает метаданные навыка и файлы версии без установки.
- `--version <version>`: проверить конкретную версию (по умолчанию: latest).
- `--tag <tag>`: проверить версию с тегом (например, `latest`).
- `--versions`: вывести историю версий (первая страница).
- `--limit <n>`: максимальное число версий для вывода (1-200).
- `--files`: вывести файлы выбранной версии.
- `--file <path>`: получить сырое содержимое файла (только текстовые файлы; лимит 200 КБ).
- `--json`: машиночитаемый вывод.

### `install @owner/slug`

- Определяет последнюю версию для указанного владельца и навыка.
- Скачивает zip через `/api/v1/download`.
- Извлекает в `<workdir>/<dir>/<slug>`.
- Отказывается перезаписывать закрепленные Skills; сначала выполните `clawhub unpin <skill>`.
- Записывает:
  - `<workdir>/.clawhub/lock.json` (устаревшее `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (устаревшее `.clawdhub`)

### `uninstall <skill>`

- Удаляет `<workdir>/<dir>/<slug>` и удаляет запись из lockfile.
- Отправляет телеметрию по возможности, если выполнен вход, чтобы текущие счетчики установок могли быть
  деактивированы.
- Интерактивно: запрашивает подтверждение.
- Неинтерактивно (`--no-input`): требует `--yes`.

### `list`

- Читает `<workdir>/.clawhub/lock.json` (устаревшее `.clawdhub`).
- Показывает `pinned` рядом со Skills, замороженными с помощью `clawhub pin`, включая необязательную причину.

### `pin <skill>`

- Помечает установленный навык как закрепленный в lockfile.
- `--reason <text>` записывает, почему навык заморожен.
- Закрепленные Skills пропускаются `update --all` и отклоняются прямым `update <skill>`.
- Закрепленные Skills также отклоняют `install --force`, чтобы локальные байты не могли быть случайно заменены.

### `unpin <skill>`

- Удаляет закрепление из lockfile для установленного навыка, чтобы будущие обновления могли его изменить.

### `update [@owner/slug]` / `update --all`

- Вычисляет fingerprint по локальным файлам.
- Если fingerprint совпадает с известной версией: запроса нет.
- Если fingerprint не совпадает:
  - по умолчанию отказывает
  - перезаписывает с `--force` (или после запроса, если интерактивно)
- Закрепленные Skills никогда не обновляются через `--force`.
- `update <skill>` быстро завершается с ошибкой для закрепленных Skills и сообщает сначала выполнить `clawhub unpin <skill>`.
- `update --all` пропускает закрепленные slug и выводит сводку того, что осталось замороженным.

### `skill publish <path>`

- Сравнивает fingerprint локального бандла с ClawHub и успешно завершается, когда
  содержимое уже опубликовано.
- Новые Skills по умолчанию получают `1.0.0`; измененные Skills по умолчанию получают следующую patch-
  версию.
- `--version <version>` явно выбирает версию и публикует даже тогда, когда
  содержимое совпадает с существующей версией.
- `--dry-run` выполняет публикацию без загрузки; `--json` выводит
  машиночитаемый результат.
- `--owner <handle>` публикует под handle издателя организации/пользователя, когда
  actor имеет доступ издателя.
- `--migrate-owner` переносит существующий навык в `--owner` при публикации новой
  версии. Требует доступа admin/owner у обоих издателей.
- Поведение владельца и проверки объясняется в `docs/publishing.md`.
- Публикация навыка означает, что он выпускается под `MIT-0` на ClawHub.
- Опубликованные Skills можно свободно использовать, изменять и распространять без указания авторства.
- ClawHub не поддерживает платные Skills или цены для отдельных Skills.
- Устаревший алиас: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Переиспользуемый workflow ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
вызывает `skill publish` для одного `skill_path` или для каждой непосредственной папки навыка
под `root` (по умолчанию: `skills`). Он пропускает неизмененные Skills и использует
то же автоматическое поведение patch-версии.

Задайте `dry_run: true` для предварительного просмотра без токена. Реальные публикации требуют секрет
`clawhub_token`.

### `sync`

- Сканирует текущий workdir, настроенный каталог Skills и любые
  папки `--root <dir>` на наличие локальных папок Skills, содержащих `SKILL.md` или
  `skill.md`.
- Сравнивает fingerprint каждого локального навыка с ClawHub и публикует только новые или
  измененные Skills.
- Новые Skills публикуются как `1.0.0`; измененные Skills по умолчанию публикуются со следующей patch-версией.
  Используйте `--bump minor|major` для пакетов обновлений, которые должны перейти на
  более крупный шаг semver.
- `--dry-run` показывает план публикации без загрузки; `--json` выводит
  машиночитаемый план.
- `--all` публикует каждый новый или измененный навык без запроса. Без
  `--all` интерактивные терминалы позволяют выбрать Skills для публикации.
- `--owner <handle>` публикует под handle издателя организации/пользователя, когда
  actor имеет доступ издателя.
- `sync` выполняет только одностороннюю публикацию. Он не устанавливает, не обновляет, не скачивает и не
  отправляет телеметрию установок/загрузок.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Требует `clawhub login`.
- Запускает ClawHub ClawScan через `POST /api/v1/skills/-/scan`, затем опрашивает до терминального состояния сканирования.
- Сканирования асинхронны и могут занять время. Пока задача в очереди, индикатор терминала показывает текущую приоритетную позицию сканирования и сколько сканирований впереди.
- Опубликованные сканирования требуют владения или доступа к управлению издателем. Модераторы/администраторы могут использовать тот же backend через `clawhub-admin`.
- `--update` допустим только с `--slug`; он записывает успешные результаты опубликованного сканирования обратно в выбранную версию.
- `--output <file.zip>` скачивает полный архив отчета с `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` и `README.md`.
- `--json` выводит полный ответ опроса для автоматизации.
- Сканирования локальных путей больше не поддерживаются. Загрузите новую версию, затем используйте `scan download`, чтобы получить сохраненные результаты сканирования для этой отправленной версии.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Требует `clawhub login`.
- Скачивает сохраненный ZIP-отчет сканирования для отправленной версии навыка или Plugin, включая версии, которые были заблокированы или скрыты проверками безопасности ClawHub.
- Загрузки Skills используют slug навыка и по умолчанию `--kind skill`.
- Загрузки Plugin используют имя пакета и требуют `--kind plugin`.
- `--version` обязателен, чтобы авторы проверяли точную отправленную версию, которую ClawHub заблокировал.
- `--output <file.zip>` выбирает путь назначения.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub поставляет официальный переиспользуемый workflow по адресу
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/skill-publish.yml)
для репозиториев Skills и репозиториев каталогов.

Типовая настройка каталога:

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
- Передайте `skill_path: skills/review-helper`, чтобы обработать одну папку навыка.
- `owner` соответствует флагу CLI `--owner`; опустите его, чтобы публиковать как аутентифицированный пользователь.
- Публикация Skills V1 использует `clawhub_token`; доверенная публикация GitHub OIDC пока доступна только для пакетов.

### `delete <skill>`

- Без `--version` выполняет мягкое удаление навыка (владелец, модератор или администратор).
- Вызывает `DELETE /api/v1/skills/{slug}`.
- Мягкое удаление, инициированное владельцем, резервирует slug на 30 дней; команда выводит время истечения срока.
- `--version <version>` безвозвратно удаляет одну принадлежащую владельцу версию, не являющуюся последней, через fail-closed,
  маршрут, привязанный к конкретной версии.
  Удаленные версии нельзя восстановить или опубликовать повторно. Опубликуйте замену перед удалением
  текущей последней версии. Сотрудники платформы не обходят право владения для этого потока только для версий.
- `--reason <text>` записывает модераторскую заметку для мягкого удаления всего навыка и в журнал аудита.
- `--note <text>` — псевдоним для `--reason`.
- `--yes` пропускает подтверждение.

### `undelete <skill>`

- Восстанавливает скрытый навык (владелец, модератор или администратор).
- Восстановления версии нет; безвозвратно удаленные версии нельзя восстановить.
- Вызывает `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записывает модераторскую заметку для навыка и в журнал аудита.
- `--note <text>` — псевдоним для `--reason`.
- `--yes` пропускает подтверждение.

### `hide <skill>`

- Скрывает навык (владелец, модератор или администратор).
- Псевдоним для `delete`.

### `unhide <skill>`

- Отменяет скрытие навыка (владелец, модератор или администратор).
- Псевдоним для `undelete`.

### `skill rename <skill> <new-name>`

- Переименовывает принадлежащий владельцу навык и сохраняет предыдущий slug как псевдоним перенаправления.
- Вызывает `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускает подтверждение.

### `skill merge <source> <target>`

- Объединяет один принадлежащий владельцу навык с другим принадлежащим владельцу навыком.
- Исходный slug больше не отображается публично и становится псевдонимом перенаправления на целевой навык.
- Вызывает `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускает подтверждение.

### `transfer`

- Рабочий процесс передачи владения.
- Передачи на пользовательские handle создают ожидающий запрос, который получатель принимает.
- Передачи на handle организаций/издателей применяются немедленно только тогда, когда у действующего лица есть
  административный доступ и к текущему владельцу, и к целевому издателю.
- Подкоманды:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Просматривает единый каталог пакетов или выполняет поиск в нем через `GET /api/v1/packages` и `GET /api/v1/packages/search`.
- Используйте это для плагинов и других записей семейств пакетов; верхнеуровневый `search` остается поверхностью поиска навыков.
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
- Используйте это для метаданных плагина, совместимости, проверки, источника и просмотра версий/файлов.
- `--version <version>`: проверить конкретную версию (по умолчанию: latest).
- `--tag <tag>`: проверить версию с тегом (например, `latest`).
- `--versions`: вывести историю версий (первая страница).
- `--limit <n>`: максимальное число версий для вывода (1-100).
- `--files`: вывести файлы для выбранной версии.
- `--file <path>`: получить необработанное содержимое файла (только текстовые файлы; лимит 200 КБ).
- `--json`: машиночитаемый вывод.

### `package download <name>`

- Разрешает версию пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Загружает артефакт из `downloadUrl` резолвера.
- Проверяет ClawHub SHA-256 для всех артефактов.
- Для артефактов ClawPack npm-pack также проверяет целостность npm `sha512`,
  npm shasum и имя/версию в `package.json` тарбола.
- Устаревшие ZIP-версии загружаются через устаревший ZIP-маршрут.
- Флаги:
  - `--version <version>`: загрузить конкретную версию.
  - `--tag <tag>`: загрузить версию с тегом (по умолчанию: `latest`).
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

- Запускает встроенный в ClawHub CLI Plugin Inspector для локальной папки пакета плагина.
- По умолчанию выполняет офлайн/статическую проверку, без поиска или импорта локального
  checkout OpenClaw.
- Жесткие ошибки совместимости завершаются с ненулевым кодом. Findings только с предупреждениями выводятся, но
  завершаются с нулевым кодом.
- Флаги:
  - `--out <dir>`: записать отчеты Plugin Inspector в этот каталог.
  - `--openclaw <path>`: проверить относительно явного локального checkout OpenClaw.
  - `--runtime`: включить захват runtime; импортирует код плагина.
  - `--allow-execute`: разрешить захват runtime в изолированном рабочем пространстве.
  - `--no-mock-sdk`: отключить имитируемый OpenClaw SDK во время захвата runtime.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package validate ./example-plugin
```

Если проверка сообщает finding пакета, манифеста, импорта SDK или артефакта, см.
[Исправления проверки Plugin](/clawhub/plugin-validation-fixes), затем повторно запустите команду.

### `package delete <name>`

- Без `--version` выполняет мягкое удаление пакета и всех релизов.
- `--version <version>` безвозвратно удаляет один принадлежащий владельцу релиз, не являющийся последним, через fail-closed,
  маршрут, привязанный к конкретной версии.
  Удаленные версии нельзя восстановить или опубликовать повторно. Опубликуйте замену перед удалением
  текущей последней версии. Этот поток только для версий требует владельца пакета или администратора издателя организации;
  сотрудники платформы не обходят право владения пакетом.
- Мягкое удаление всего пакета требует владельца пакета, владельца/администратора издателя организации, модератора
  платформы или администратора платформы.
- Флаги:
  - `--version <version>`: безвозвратно удалить одну не последнюю версию.
  - `--yes`: пропустить подтверждение.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Восстанавливает мягко удаленный пакет и релизы.
- Восстановления версии нет; безвозвратно удаленные версии нельзя восстановить.
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
  издателю, если действие не выполняет администратор платформы.
- Имена scoped-пакетов должны передаваться соответствующему владельцу scope.
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
- Жалобы относятся к уровню пакета, могут быть необязательно привязаны к версии и становятся видимыми
  модераторам для проверки.
- Жалобы сами по себе не скрывают пакеты автоматически и не блокируют загрузки.
- Флаги:
  - `--version <version>`: необязательная версия пакета для привязки к жалобе.
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
  модерации последнего релиза, состояние блокировки загрузок и причины модерации.
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
  происхождения источника, совместимости с OpenClaw, целевых хостов, метаданных окружения
  и состояния сканирования.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Показывает ориентированный на оператора статус миграции для пакета, который может заменить
  встроенный плагин OpenClaw.
- Вызывает тот же вычисляемый endpoint готовности, что и `package readiness`, но выводит
  статус с фокусом на миграцию, последнюю версию, состояние официального пакета, проверки и
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

- Публикует Plugin кода или пакетный Plugin через `POST /api/v1/packages`.
- `<source>` принимает:
  - Путь к локальной папке: `./my-plugin`
  - Локальный tarball ClawPack, созданный npm-pack: `./my-plugin-1.2.3.tgz`
  - Репозиторий GitHub: `owner/repo` или `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метаданные автоматически определяются из `package.json`, `openclaw.plugin.json` и
  настоящих маркеров пакета OpenClaw, таких как `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` и `.cursor-plugin/plugin.json`.
- Источники `.tgz` обрабатываются как ClawPack. CLI загружает точные байты
  npm-pack и использует извлеченное содержимое `package/` только для проверки и
  предварительного заполнения метаданных.
- Папки Plugin кода перед загрузкой упаковываются в npm tarball ClawPack, чтобы
  установки OpenClaw могли проверить точный артефакт. Папки пакетных Plugin по-прежнему
  используют путь публикации извлеченных файлов.
- Для источников GitHub указание источника автоматически заполняется из репозитория, разрешенного коммита, ref и подпути.
- Для локальных папок указание источника автоматически определяется из локального git, когда origin remote указывает на GitHub.
- Внешние Plugin кода должны явно объявлять `openclaw.compat.pluginApi` и
  `openclaw.build.openclawVersion`.
  Верхнеуровневый `package.json.version` не используется как резервное значение для проверки публикации.
- `--dry-run` показывает предварительный просмотр разрешенной полезной нагрузки публикации без загрузки.
- `--json` выводит машиночитаемый результат для CI.
- `--owner <handle>` публикует от имени пользовательского или организационного идентификатора издателя, когда у действующего пользователя есть доступ издателя.
- Имена scoped-пакетов должны соответствовать выбранному владельцу. См. `docs/publishing.md`.
- Существующие флаги (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) по-прежнему работают как переопределения.
- Для приватных репозиториев GitHub требуется `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендуемый локальный процесс

Сначала используйте `--dry-run`, чтобы подтвердить разрешенные метаданные пакета и
указание источника перед созданием реального релиза:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процесс для локальной папки

Для Plugin кода публикация папки собирает и загружает артефакт ClawPack из
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Минимальный `package.json` для `--family code-plugin`

Внешним Plugin кода нужен небольшой объем метаданных OpenClaw в
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
  резервное значение для проверки совместимости/сборки OpenClaw.
- `openclaw.hostTargets` и `openclaw.environment` — необязательные метаданные.
  ClawHub может показывать их при наличии, но они не обязательны для публикации.
- `openclaw.compat.minGatewayVersion` и
  `openclaw.build.pluginSdkVersion` — необязательные дополнительные поля, если вы хотите опубликовать
  более подробные метаданные совместимости.
- Если вы используете более старый релиз CLI `clawhub`, обновитесь перед публикацией, чтобы
  локальные предварительные проверки выполнялись до загрузки.
- Если проверка сообщает код исправления, см.
  [Исправления проверки Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub также поставляет официальный переиспользуемый workflow по адресу
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/package-publish.yml)
для репозиториев Plugin.

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

- Переиспользуемый workflow по умолчанию задает `source` как репозиторий вызывающего workflow.
- Для монорепозиториев передайте `source_path`, чтобы workflow публиковал
  папку пакета Plugin, например `source_path: extensions/codex`.
- Закрепляйте переиспользуемый workflow на стабильном теге или полном SHA коммита. Не запускайте публикацию релиза из `@main`.
- `pull_request` должен использовать `dry_run: true`, чтобы CI не создавал побочных изменений.
- Реальные публикации должны быть ограничены доверенными событиями, такими как `workflow_dispatch` или push тегов.
- Доверенная публикация без секрета работает только с `workflow_dispatch`; для push тегов по-прежнему нужен `clawhub_token`.
- Держите `clawhub_token` доступным для первой публикации, недоверенных пакетов или экстренных публикаций.
- Workflow загружает JSON-результат как артефакт и предоставляет его как выходные значения workflow.

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
- Пакет сначала должен быть создан через обычную ручную или token-аутентифицированную
  `clawhub package publish`.
- После настройки конфигурации будущие поддерживаемые публикации GitHub Actions могут использовать
  OIDC/доверенную публикацию без долгоживущего токена ClawHub.
- `--repository <repo>` должен быть `owner/repo`.
- `--workflow-filename <file>` должен совпадать с именем файла workflow в
  `.github/workflows/`.
- `--environment <name>` необязателен. Если он настроен, environment GitHub Actions
  в claim OIDC должен точно совпадать.
- ClawHub проверяет настроенный репозиторий GitHub при выполнении этой команды.
  Публичные репозитории можно проверить через публичные метаданные GitHub. Для приватных
  репозиториев ClawHub должен иметь доступ GitHub к этому репозиторию, например
  через будущую установку ClawHub GitHub App или другую авторизованную
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
  не будет настроена снова.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Телеметрия установки

- Отправляется после `clawhub install <slug>`, когда выполнен вход, если только
  не задано `CLAWHUB_DISABLE_TELEMETRY=1`.
- Отправка выполняется по принципу best-effort. Команды установки не завершаются с ошибкой, если телеметрия
  недоступна.
- Подробности: `docs/telemetry.md`.
