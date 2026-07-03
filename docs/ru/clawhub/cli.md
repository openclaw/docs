---
read_when:
    - Использование CLI ClawHub
    - Отладка установки, обновления или публикации
summary: 'Справочник CLI: команды, флаги, конфигурация и поведение lock-файла.'
x-i18n:
    generated_at: "2026-07-03T09:49:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Пакет CLI: `clawhub`, исполняемый файл: `clawhub`.

Установите его глобально через npm или pnpm:

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

- `--workdir <dir>`: рабочий каталог (по умолчанию: cwd; при наличии настройки использует рабочую область Clawdbot как резервный вариант)
- `--dir <dir>`: каталог установки внутри workdir (по умолчанию: `skills`)
- `--site <url>`: базовый URL для входа через браузер (по умолчанию: `https://clawhub.ai`)
- `--registry <url>`: базовый URL API (по умолчанию: обнаруженный, иначе `https://clawhub.ai`)
- `--no-input`: отключить запросы ввода

Эквиваленты в переменных окружения:

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
для обычного HTTP. `NO_PROXY` / `no_proxy` учитывается для обхода прокси для
конкретных хостов или доменов.

Это требуется в системах, где прямые исходящие подключения заблокированы
(например, контейнеры Docker, VPS Hetzner с интернетом только через прокси,
корпоративные файрволы).

Пример:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Если переменная прокси не задана, поведение не меняется (прямые подключения).

## Файл конфигурации

Хранит ваш API-токен и кэшированный URL реестра.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` или `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Устаревший резервный путь: если `clawhub/config.json` еще не существует, но существует `clawdhub/config.json`, CLI повторно использует устаревший путь
- переопределение: `CLAWHUB_CONFIG_PATH` (устаревшее `CLAWDHUB_CONFIG_PATH`)

## Команды

### `login` / `auth login`

- По умолчанию: открывает браузер на `<site>/cli/auth` и завершает вход через callback local loopback.
- Без браузера: `clawhub login --token clh_...`
- Удаленный/безбраузерный интерактивный режим: `clawhub login --device` выводит код и ожидает, пока вы авторизуете его на `<site>/cli/device`.

### `whoami`

- Проверяет сохраненный токен через `/api/v1/whoami`.

### `token`

- Выводит сохраненный API-токен в stdout.
- Полезно для передачи локального токена входа в команды настройки секретов CI через pipe.

### `star <skill>` / `unstar <skill>`

- Добавляет/удаляет навык из ваших избранных.
- Вызывает `POST /api/v1/stars/<slug>` и `DELETE /api/v1/stars/<slug>`.
- `--yes` пропускает подтверждение.

### `search <query...>`

- Вызывает `/api/v1/search?q=...`.
- Вывод включает slug навыка, handle владельца, отображаемое имя и оценку релевантности.
- Поиск отдает предпочтение точным совпадениям токенов slug/имени перед популярностью загрузок. Отдельный токен slug, например `map`, сильнее соответствует `personal-map`, чем подстроке внутри `amap`.
- Популярность является небольшим предварительным фактором ранжирования, а не гарантией верхней позиции.
- Если навык должен отображаться, но не отображается, выполните `clawhub inspect @owner/slug` после входа, чтобы проверить видимую владельцу диагностику модерации перед переименованием метаданных.

### `explore`

- Перечисляет новейшие навыки через `/api/v1/skills?limit=...&sort=createdAt` (сортировка по `createdAt` desc).
- Флаги:
  - `--limit <n>` (1-200, по умолчанию: 25)
  - `--sort newest|updated|rating|downloads|trending` (по умолчанию: newest). Устаревшие псевдонимы сортировки установки продолжают работать для совместимости.
  - `--json` (машиночитаемый вывод)
- Вывод: `<slug>  v<version>  <age>  <summary>` (сводка обрезается до 50 символов).

### `inspect @owner/slug`

- Получает метаданные навыка и файлы версии без установки.
- `--version <version>`: проверить конкретную версию (по умолчанию: latest).
- `--tag <tag>`: проверить версию с тегом (например, `latest`).
- `--versions`: показать историю версий (первая страница).
- `--limit <n>`: максимум версий в списке (1-200).
- `--files`: перечислить файлы выбранной версии.
- `--file <path>`: получить необработанное содержимое файла (только текстовые файлы; ограничение 200 КБ).
- `--json`: машиночитаемый вывод.

### `install @owner/slug`

- Определяет latest-версию для указанного владельца и навыка.
- Загружает zip через `/api/v1/download`.
- Извлекает в `<workdir>/<dir>/<slug>`.
- Отказывается перезаписывать закрепленные навыки; сначала выполните `clawhub unpin <skill>`.
- Записывает:
  - `<workdir>/.clawhub/lock.json` (устаревшее `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (устаревшее `.clawdhub`)

### `uninstall <skill>`

- Удаляет `<workdir>/<dir>/<slug>` и удаляет запись из lockfile.
- По возможности отправляет телеметрию при выполненном входе, чтобы текущие счетчики установок можно было
  деактивировать.
- Интерактивно: запрашивает подтверждение.
- Неинтерактивно (`--no-input`): требует `--yes`.

### `list`

- Читает `<workdir>/.clawhub/lock.json` (устаревшее `.clawdhub`).
- Показывает `pinned` рядом с навыками, замороженными через `clawhub pin`, включая необязательную причину.

### `pin <skill>`

- Помечает установленный навык как закрепленный в lockfile.
- `--reason <text>` записывает, почему навык заморожен.
- Закрепленные навыки пропускаются командой `update --all` и отклоняются прямой командой `update <skill>`.
- Закрепленные навыки также отклоняют `install --force`, чтобы локальные байты нельзя было случайно заменить.

### `unpin <skill>`

- Удаляет закрепление lockfile с установленного навыка, чтобы будущие обновления могли его изменять.

### `update [@owner/slug]` / `update --all`

- Вычисляет fingerprint по локальным файлам.
- Если fingerprint совпадает с известной версией: без запроса.
- Если fingerprint не совпадает:
  - по умолчанию отказывается
  - перезаписывает с `--force` (или по запросу, если интерактивно)
- Закрепленные навыки никогда не обновляются через `--force`.
- `update <skill>` быстро завершается с ошибкой для закрепленных навыков и сообщает, что сначала нужно выполнить `clawhub unpin <skill>`.
- `update --all` пропускает закрепленные slug и выводит сводку о том, что осталось замороженным.

### `skill publish <path>`

- Сравнивает fingerprint локального пакета с ClawHub и успешно завершается, когда
  содержимое уже опубликовано.
- Для новых навыков по умолчанию используется `1.0.0`; для измененных навыков по умолчанию используется следующая patch-
  версия.
- `--version <version>` явно выбирает версию и публикует, даже когда
  содержимое совпадает с существующей версией.
- `--dry-run` выполняет разрешение публикации без загрузки; `--json` выводит
  машиночитаемый результат.
- `--owner <handle>` публикует под handle издателя org/user, когда у
  действующего пользователя есть доступ издателя.
- `--migrate-owner` перемещает существующий навык в `--owner`, публикуя новую
  версию. Требует доступа admin/owner у обоих издателей.
- Поведение владельца и проверки объясняется в `docs/publishing.md`.
- Публикация навыка означает, что он выпускается под `MIT-0` на ClawHub.
- Опубликованные навыки можно бесплатно использовать, изменять и распространять без указания авторства.
- ClawHub не поддерживает платные навыки или цены для отдельных навыков.
- Устаревший псевдоним: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Переиспользуемый workflow ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
вызывает `skill publish` для одного `skill_path` или для каждой непосредственной папки навыка
под `root` (по умолчанию: `skills`). Он пропускает неизмененные навыки и использует
то же автоматическое поведение patch-версии.

Задайте `dry_run: true`, чтобы предварительно просмотреть без токена. Реальные публикации требуют
секрет `clawhub_token`.

### `sync`

- Сканирует текущий workdir, настроенный каталог skills и любые
  папки `--root <dir>` на наличие локальных папок навыков, содержащих `SKILL.md` или
  `skill.md`.
- Сравнивает fingerprint каждого локального навыка с ClawHub и публикует только новые или
  измененные навыки.
- Новые навыки публикуются как `1.0.0`; измененные навыки по умолчанию публикуют следующую patch-версию.
  Используйте `--bump minor|major` для пакетов обновлений, которые должны перейти на
  более крупный semver-шаг.
- `--dry-run` показывает план публикации без загрузки; `--json` выводит
  машиночитаемый план.
- `--all` публикует каждый новый или измененный навык без запроса. Без
  `--all` интерактивные терминалы позволяют выбрать навыки для публикации.
- `--owner <handle>` публикует под handle издателя org/user, когда у
  действующего пользователя есть доступ издателя.
- `sync` выполняет только одностороннюю публикацию. Он не устанавливает, не обновляет, не загружает и не
  сообщает телеметрию установок/загрузок.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Требует `clawhub login`.
- Запускает ClawHub ClawScan через `POST /api/v1/skills/-/scan`, затем опрашивает до терминального состояния сканирования.
- Сканирования асинхронны и могут занять время. Пока они в очереди, индикатор в терминале показывает текущую приоритетную позицию сканирования и сколько сканирований впереди.
- Для сканирований опубликованных версий требуется владение или доступ к управлению издателем. Модераторы/admins могут использовать тот же backend через `clawhub-admin`.
- `--update` допустим только с `--slug`; он записывает успешные результаты сканирования опубликованной версии обратно в выбранную версию.
- `--output <file.zip>` загружает полный архив отчета с `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` и `README.md`.
- `--json` выводит полный ответ опроса для автоматизации.
- Сканирования локального пути больше не поддерживаются. Загрузите новую версию, затем используйте `scan download`, чтобы получить сохраненные результаты сканирования для этой отправленной версии.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Требует `clawhub login`.
- Загружает сохраненный ZIP-отчет сканирования для отправленной версии навыка или Plugin, включая версии, которые были заблокированы или скрыты проверками безопасности ClawHub.
- Загрузки навыков используют slug навыка и по умолчанию `--kind skill`.
- Загрузки Plugin используют имя пакета и требуют `--kind plugin`.
- `--version` обязателен, чтобы авторы проверяли именно ту отправленную версию, которую ClawHub заблокировал.
- `--output <file.zip>` выбирает путь назначения.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub поставляет официальный переиспользуемый workflow по адресу
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml)
для репозиториев навыков и репозиториев каталогов.

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
- Передайте `skill_path: skills/review-helper`, чтобы обработать одну папку навыка.
- `owner` соответствует флагу CLI `--owner`; опустите его, чтобы публиковать от имени аутентифицированного пользователя.
- Публикация навыков V1 использует `clawhub_token`; доверенная публикация GitHub OIDC пока доступна только для пакетов.

### `delete <skill>`

- Без `--version` мягко удаляет навык (владелец, модератор или администратор).
- Вызывает `DELETE /api/v1/skills/{slug}`.
- Мягкое удаление, инициированное владельцем, резервирует slug на 30 дней; команда выводит время истечения.
- `--version <version>` окончательно удаляет одну принадлежащую владельцу не последнюю версию через fail-closed,
  версионно-специфичный маршрут.
  Удаленные версии нельзя восстановить или опубликовать повторно. Опубликуйте замену перед удалением
  текущей последней версии. Сотрудники платформы не обходят владение в этом потоке только для версий.
- `--reason <text>` записывает заметку модерации при мягком удалении всего навыка и в журнал аудита.
- `--note <text>` — псевдоним для `--reason`.
- `--yes` пропускает подтверждение.

### `undelete <skill>`

- Восстановить скрытый навык (владелец, модератор или администратор).
- Восстановления версии нет; окончательно удаленные версии нельзя восстановить.
- Вызывает `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` записывает заметку модерации для навыка и в журнал аудита.
- `--note <text>` — псевдоним для `--reason`.
- `--yes` пропускает подтверждение.

### `hide <skill>`

- Скрыть навык (владелец, модератор или администратор).
- Псевдоним для `delete`.

### `unhide <skill>`

- Показать навык снова (владелец, модератор или администратор).
- Псевдоним для `undelete`.

### `skill rename <skill> <new-name>`

- Переименовать принадлежащий владельцу навык и сохранить прежний slug как псевдоним перенаправления.
- Вызывает `POST /api/v1/skills/{slug}/rename`.
- `--yes` пропускает подтверждение.

### `skill merge <source> <target>`

- Объединить один принадлежащий владельцу навык с другим принадлежащим владельцу навыком.
- Исходный slug перестает публично отображаться и становится псевдонимом перенаправления на целевой.
- Вызывает `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` пропускает подтверждение.

### `transfer`

- Рабочий процесс передачи владения.
- Передачи на пользовательские handle создают ожидающий запрос, который принимает получатель.
- Передачи на handle организации/издателя применяются немедленно только когда у действующего пользователя есть
  доступ администратора и к текущему владельцу, и к целевому издателю.
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

- Просматривает единый каталог пакетов или ищет в нем через `GET /api/v1/packages` и `GET /api/v1/packages/search`.
- Используйте это для плагинов и других записей семейства пакетов; верхнеуровневый `search` остается поверхностью поиска навыков.
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
- `--limit <n>`: максимум версий для вывода (1-100).
- `--files`: вывести файлы для выбранной версии.
- `--file <path>`: получить необработанное содержимое файла (только текстовые файлы; лимит 200 КБ).
- `--json`: машиночитаемый вывод.

### `package download <name>`

- Разрешает версию пакета через
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Скачивает артефакт из `downloadUrl` резолвера.
- Проверяет ClawHub SHA-256 для всех артефактов.
- Для артефактов ClawPack npm-pack также проверяет целостность npm `sha512`,
  npm shasum и имя/версию в `package.json` tarball.
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
- С прямыми флагами дайджеста выполняет проверку без сетевого запроса.
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
- По умолчанию выполняет офлайн/статическую проверку без поиска или импорта локального
  checkout OpenClaw.
- Жесткие ошибки совместимости завершаются ненулевым кодом. Предупреждения только выводятся, но
  завершаются с нулевым кодом.
- Флаги:
  - `--out <dir>`: записать отчеты Plugin Inspector в этот каталог.
  - `--openclaw <path>`: проверить относительно явно указанного локального checkout OpenClaw.
  - `--runtime`: включить захват runtime; импортирует код плагина.
  - `--allow-execute`: разрешить захват runtime в изолированном рабочем пространстве.
  - `--no-mock-sdk`: отключить имитированный OpenClaw SDK во время захвата runtime.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package validate ./example-plugin
```

Если проверка сообщает о находке в пакете, манифесте, импорте SDK или артефакте, см.
[исправления проверки Plugin](/clawhub/plugin-validation-fixes), затем запустите команду повторно.

### `package delete <name>`

- Без `--version` мягко удаляет пакет и все релизы.
- `--version <version>` окончательно удаляет один принадлежащий владельцу не последний релиз через fail-closed,
  версионно-специфичный маршрут.
  Удаленные версии нельзя восстановить или опубликовать повторно. Опубликуйте замену перед удалением
  текущей последней версии. Этот поток только для версий требует владельца пакета или администратора
  издателя организации; сотрудники платформы не обходят владение пакетом.
- Мягкое удаление всего пакета требует владельца пакета, владельца/администратора издателя организации, модератора
  платформы или администратора платформы.
- Флаги:
  - `--version <version>`: окончательно удалить одну не последнюю версию.
  - `--yes`: пропустить подтверждение.
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Восстанавливает мягко удаленный пакет и релизы.
- Восстановления версии нет; окончательно удаленные версии нельзя восстановить.
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
- Требует доступа администратора и к текущему владельцу пакета, и к целевому
  издателю, если действие не выполняет администратор платформы.
- Имена пакетов со scope должны передаваться соответствующему владельцу scope.
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
- Жалобы относятся к уровню пакета, могут быть дополнительно привязаны к версии и становятся видимыми
  модераторам для проверки.
- Жалобы сами по себе не скрывают пакеты автоматически и не блокируют скачивания.
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
- Показывает текущее состояние сканирования пакета, количество открытых жалоб, состояние ручной
  модерации последнего релиза, состояние блокировки скачивания и причины модерации.
- Флаги:
  - `--json`: машиночитаемый вывод.

Пример:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Проверяет, готов ли пакет к будущему использованию OpenClaw.
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

- Показывает ориентированный на оператора статус миграции для пакета, который может заменить
  встроенный плагин OpenClaw.
- Вызывает ту же вычисляемую конечную точку готовности, что и `package readiness`, но выводит
  статус, ориентированный на миграцию, последнюю версию, состояние официального пакета, проверки и
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

- Публикует кодовый Plugin или bundle Plugin через `POST /api/v1/packages`.
- `<source>` принимает:
  - Путь к локальной папке: `./my-plugin`
  - Локальный tarball ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Репозиторий GitHub: `owner/repo` или `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- Метаданные автоматически определяются из `package.json`, `openclaw.plugin.json` и
  настоящих маркеров bundle OpenClaw, таких как `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` и `.cursor-plugin/plugin.json`.
- Источники `.tgz` обрабатываются как ClawPack. CLI загружает точные байты
  npm-pack и использует извлеченное содержимое `package/` только для валидации и
  предварительного заполнения метаданных.
- Папки кодовых Plugin упаковываются в npm tarball ClawPack перед загрузкой, чтобы
  установки OpenClaw могли проверить точный артефакт. Папки bundle Plugin по-прежнему
  используют путь публикации извлеченных файлов.
- Для источников GitHub атрибуция источника автоматически заполняется из репозитория, разрешенного коммита, ref и подпути.
- Для локальных папок атрибуция источника автоматически определяется из локального git, когда origin remote указывает на GitHub.
- Внешние кодовые Plugin должны явно объявлять `openclaw.compat.pluginApi` и
  `openclaw.build.openclawVersion`.
  Верхнеуровневое значение `package.json.version` не используется как запасной вариант для валидации публикации.
- `--dry-run` предварительно показывает разрешенную полезную нагрузку публикации без загрузки.
- `--json` выводит машиночитаемый результат для CI.
- `--owner <handle>` публикует под пользовательским или организационным handle издателя, когда у актера есть доступ издателя.
- Имена пакетов со scope должны соответствовать выбранному владельцу. См. `docs/publishing.md`.
- Существующие флаги (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) по-прежнему работают как переопределения.
- Для приватных репозиториев GitHub требуется `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Рекомендуемый локальный процесс

Сначала используйте `--dry-run`, чтобы подтвердить разрешенные метаданные пакета и
атрибуцию источника перед созданием настоящего релиза:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Процесс для локальной папки

Для кодовых Plugin публикация папки собирает и загружает артефакт ClawPack из
папки пакета:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Минимальный `package.json` для `--family code-plugin`

Внешним кодовым Plugin требуется небольшой объем метаданных OpenClaw в
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
  запасной вариант для валидации совместимости/сборки OpenClaw.
- `openclaw.hostTargets` и `openclaw.environment` — необязательные метаданные.
  ClawHub может показывать их при наличии, но они не требуются для публикации.
- `openclaw.compat.minGatewayVersion` и
  `openclaw.build.pluginSdkVersion` — необязательные дополнительные поля, если вы хотите публиковать
  более подробные метаданные совместимости.
- Если вы используете более старый релиз CLI `clawhub`, обновитесь перед публикацией, чтобы
  локальные предварительные проверки выполнялись до загрузки.
- Если валидация сообщает код исправления, см.
  [Исправления валидации Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub также поставляет официальный переиспользуемый workflow по адресу
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)
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

- Переиспользуемый workflow по умолчанию задает `source` как вызывающий репозиторий.
- Для монорепозиториев передайте `source_path`, чтобы workflow публиковал папку пакета
  Plugin, например `source_path: extensions/codex`.
- Закрепляйте переиспользуемый workflow на стабильном теге или полном SHA коммита. Не запускайте публикацию релиза из `@main`.
- `pull_request` должен использовать `dry_run: true`, чтобы CI не загрязнял состояние.
- Реальные публикации следует ограничивать доверенными событиями, такими как `workflow_dispatch` или push тегов.
- Доверенная публикация без секрета работает только на `workflow_dispatch`; для push тегов по-прежнему нужен `clawhub_token`.
- Держите `clawhub_token` доступным для первой публикации, недоверенных пакетов или аварийных публикаций.
- Workflow загружает JSON-результат как артефакт и предоставляет его как выходные данные workflow.

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
- Пакет должен быть сначала создан через обычную ручную или token-authenticated
  публикацию `clawhub package publish`.
- После настройки конфигурации будущие поддерживаемые публикации GitHub Actions могут использовать
  OIDC/доверенную публикацию без долгоживущего токена ClawHub.
- `--repository <repo>` должен быть `owner/repo`.
- `--workflow-filename <file>` должен совпадать с именем файла workflow в
  `.github/workflows/`.
- `--environment <name>` необязателен. Если он настроен, environment GitHub Actions
  в OIDC claim должен совпадать точно.
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

- Отправляется после `clawhub install <slug>` при входе в систему, если не задано
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- Отправка выполняется по возможности. Команды установки не завершаются ошибкой, если телеметрия
  недоступна.
- Подробности: `docs/telemetry.md`.
