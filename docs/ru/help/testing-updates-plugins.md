---
read_when:
    - Изменение поведения обновления OpenClaw, doctor, приемки пакетов или установки Plugin
    - Подготовка или утверждение релиз-кандидата
    - Отладка регрессий при обновлении пакета, очистке зависимостей Plugin или установке Plugin
sidebarTitle: Update and plugin tests
summary: Как OpenClaw проверяет пути обновления, миграции пакетов и поведение установки/обновления Plugin
title: 'Тестирование: обновления и plugins'
x-i18n:
    generated_at: "2026-06-28T23:03:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Это специализированный контрольный список для проверки обновлений и Plugin. Цель
простая: доказать, что устанавливаемый пакет может обновлять реальное состояние
пользователя, исправлять устаревшее legacy-состояние через `doctor` и по-прежнему
устанавливать, загружать, обновлять и удалять Plugin из поддерживаемых источников.

Для более общей карты средств запуска тестов см. [Тестирование](/ru/help/testing). Для ключей live-провайдеров
и наборов тестов, обращающихся к сети, см. [Live-тестирование](/ru/help/testing-live).

## Что мы защищаем

Тесты обновлений и Plugin защищают эти контракты:

- Архив пакета полон, содержит допустимый `dist/postinstall-inventory.json`
  и не зависит от распакованных файлов репозитория.
- Пользователь может перейти со старого опубликованного пакета на пакет-кандидат
  без потери конфигурации, агентов, сеансов, рабочих пространств, allowlist-списков Plugin или
  конфигурации каналов.
- `openclaw doctor --fix --non-interactive` владеет путями очистки и исправления
  legacy-состояния. Запуск не должен обрастать скрытыми миграциями совместимости для устаревшего
  состояния Plugin.
- Установки Plugin работают из локальных каталогов, git-репозиториев, npm-пакетов и
  пути реестра ClawHub.
- npm-зависимости Plugin устанавливаются в один управляемый npm-проект на Plugin,
  сканируются до доверия и удаляются через npm при удалении, чтобы поднятые
  зависимости не оставались.
- Обновление Plugin стабильно, когда ничего не изменилось: записи установки, разрешенный
  источник, схема установленных зависимостей и включенное состояние остаются неизменными.

## Локальное доказательство во время разработки

Начинайте узко:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Для изменений установки, удаления, зависимостей или инвентаря пакета Plugin также
запустите сфокусированные тесты, покрывающие отредактированный шов:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Перед тем как любой Docker-канал пакета использует архив, докажите артефакт пакета:

```bash
pnpm release:check
```

`release:check` запускает проверки расхождения конфигурации/документации/API, записывает dist-инвентарь
пакета, запускает `npm pack --dry-run`, отклоняет запрещенные упакованные файлы, устанавливает
архив во временный префикс, запускает postinstall и проверяет smoke-тестами entrypoint-ы
встроенных каналов.

## Docker-каналы

Docker-каналы являются доказательством на уровне продукта. Они устанавливают или обновляют реальный
пакет внутри Linux-контейнеров и проверяют поведение через команды CLI,
запуск Gateway, HTTP-зонды, статус RPC и состояние файловой системы.

Используйте сфокусированные каналы во время итераций:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Важные каналы:

- `test:docker:plugins` проверяет smoke-тест установки Plugin, установки из локальной папки,
  поведение пропуска обновления локальной папки, локальные папки с предварительно установленными
  зависимостями, установки пакетов `file:`, git-установки с выполнением CLI, обновления
  движущейся git-ссылки, установки из npm-реестра с поднятыми транзитивными
  зависимостями, no-op обновления npm, отклонение некорректных метаданных npm-пакета,
  установки из локальной фикстуры ClawHub и no-op обновления, поведение обновления marketplace,
  а также включение/инспекцию Claude-бандла. Установите `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, чтобы
  держать блок ClawHub герметичным/офлайн.
- `test:docker:plugin-lifecycle-matrix` устанавливает пакет-кандидат в пустой
  контейнер, прогоняет npm Plugin через установку, инспекцию, отключение, включение,
  явное обновление, явный откат версии и удаление после удаления кода Plugin.
  Он логирует метрики RSS и CPU для каждой фазы.
- `test:docker:plugin-update` проверяет, что неизмененный установленный Plugin
  не переустанавливается и не теряет метаданные установки во время `openclaw plugins update`.
- `test:docker:upgrade-survivor` устанавливает архив-кандидат поверх загрязненной
  фикстуры старого пользователя, запускает обновление пакета плюс неинтерактивный doctor, затем запускает
  loopback Gateway и проверяет сохранение состояния.
- `test:docker:published-upgrade-survivor` сначала устанавливает опубликованную базовую версию,
  настраивает ее через встроенный рецепт `openclaw config set`, обновляет ее до
  архива-кандидата, запускает doctor, проверяет legacy-очистку, запускает Gateway и
  зондирует `/healthz`, `/readyz` и статус RPC.
- `test:docker:update-restart-auth` устанавливает пакет-кандидат, запускает
  управляемый Gateway с token-auth, снимает env аутентификации gateway вызывающей стороны для
  `openclaw update --yes --json` и требует, чтобы команда обновления кандидата
  перезапустила Gateway перед обычными зондами.
- `test:docker:update-migration` — опубликованный update-канал с большим объемом очистки. Он
  начинает с настроенного пользовательского состояния в стиле Discord/Telegram, запускает baseline
  doctor, чтобы настроенные зависимости Plugin получили шанс материализоваться, подсевает
  legacy-мусор зависимостей Plugin для настроенного упакованного Plugin, обновляет до
  архива-кандидата и требует, чтобы post-update doctor удалил legacy
  корни зависимостей.

Полезные варианты published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Доступные сценарии: `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` и `versioned-runtime-deps`. В агрегированных запусках
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` раскрывается во все сценарии
по форме зарегистрированных issues, включая миграцию установки configured-plugin.

Полная миграция обновления намеренно отделена от Full Release CI. Используйте
ручной workflow `Update Migration`, когда релизный вопрос звучит так: «может ли каждый
опубликованный стабильный релиз начиная с 2026.4.23 обновиться до этого кандидата и
очистить мусор зависимостей Plugin?»:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance — это нативный для GitHub пакетный gate. Он разрешает один пакет-кандидат
в архив `package-under-test`, записывает версию и SHA-256, затем
запускает переиспользуемые Docker E2E-каналы против именно этого архива. Ref harness
отделен от ref источника пакета, поэтому текущая тестовая логика может проверять
более старые доверенные релизы.

Источники кандидатов:

- `source=npm`: проверить `openclaw@beta`, `openclaw@latest` или точную
  опубликованную версию.
- `source=ref`: упаковать доверенную ветку, тег или коммит с выбранным текущим
  harness.
- `source=url`: проверить публичный HTTPS-архив с обязательным `package_sha256`.
  Этот путь отклоняет учетные данные URL, нестандартные HTTPS-порты, частные/внутренние
  имена хостов или DNS/IP-результаты, IP-пространство special-use и небезопасные redirects.
- `source=trusted-url`: проверить HTTPS-архив с обязательными
  `package_sha256` и `trusted_source_id` по maintainer-owned политике
  в `.github/package-trusted-sources.json`. Используйте это для enterprise/private
  зеркал вместо ослабления `source=url` через input-level allow-private
  switch. Bearer auth, когда настроен политикой, использует фиксированный
  секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: переиспользовать архив, загруженный другим запуском Actions.

Full Release Validation по умолчанию использует `source=artifact`, построенный из
разрешенного release SHA. Для доказательства после публикации передайте
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, чтобы та же матрица обновлений
целилась вместо этого в отгруженный npm-пакет.

Release checks вызывают Package Acceptance с набором package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Когда включен release soak, они также передают:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Это удерживает миграцию пакета, переключение канала обновления, устойчивость к поврежденному managed-plugin,
очистку устаревших зависимостей Plugin, офлайн-покрытие Plugin,
поведение обновления Plugin и пакетную QA Telegram на одном разрешенном артефакте, не
заставляя стандартный пакетный gate релиза проходить каждый опубликованный релиз.

`last-stable-4` разрешается в четыре последних стабильных npm-опубликованных релиза OpenClaw.
Release package acceptance закрепляет `2026.4.23` как первую границу совместимости plugin-update,
`2026.5.2` как границу churn архитектуры Plugin, а
`2026.4.15` как более старую baseline-версию published-update из 2026.4.1x; resolver
дедуплицирует pins, которые уже входят в последние четыре. Для исчерпывающего покрытия
миграции опубликованных обновлений используйте `all-since-2026.4.23` в отдельном workflow Update
Migration вместо Full Release CI. `release-history` остается
доступным для ручной более широкой выборки, когда вам также нужна legacy-якорная дата
до этой границы.

Когда выбрано несколько baseline-версий published-upgrade survivor, переиспользуемый
Docker workflow шардирует каждую baseline-версию в отдельную целевую runner job. Каждый
baseline shard все еще запускает выбранный набор сценариев, но логи и артефакты остаются
по baseline, а wall time ограничивается самым медленным shard вместо одной большой
последовательной job.

Запустите профиль пакета вручную при проверке кандидата перед релизом:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Используйте `suite_profile=product`, когда релизный вопрос включает MCP-каналы,
очистку cron/subagent, веб-поиск OpenAI или OpenWebUI. Используйте `suite_profile=full`
только когда вам нужно полное Docker-покрытие release-path.

## Стандарт релиза

Для релиз-кандидатов стандартный стек доказательств таков:

1. `pnpm check:changed` и `pnpm test:changed` для регрессий на уровне исходного кода.
2. `pnpm release:check` для целостности артефакта пакета.
3. Профиль Package Acceptance `package` или пользовательские package-каналы release-check
   для контрактов install/update/restart/plugin.
4. Кросс-OS release checks для OS-специфичного установщика, onboarding и поведения
   платформы.
5. Live-наборы только когда измененная поверхность затрагивает поведение провайдера или hosted-service.

На машинах maintainer широкие gates и Docker/package доказательство продукта должны запускаться
в Testbox, если явно не выполняется локальное доказательство.

## Legacy-совместимость

Послабления совместимости узкие и ограничены по времени:

- Пакеты до `2026.4.25` включительно, включая `2026.4.25-beta.*`, могут терпимо относиться
  к уже отгруженным пробелам в метаданных пакета в Package Acceptance.
- Опубликованный пакет `2026.4.26` может предупреждать о локальных build metadata stamp
  файлах, которые уже были отгружены.
- Более поздние пакеты должны удовлетворять современным контрактам. Те же пробелы приводят к сбою вместо
  предупреждения или пропуска.

Не добавляйте новые startup migrations для этих старых форм. Добавьте или расширьте исправление doctor,
затем докажите его с помощью `upgrade-survivor`, `published-upgrade-survivor` или
`update-restart-auth`, когда команда обновления владеет перезапуском.

## Добавление покрытия

При изменении поведения обновления или Plugin добавляйте покрытие на самом низком слое, который
может отказать по правильной причине:

- Чистая логика путей или метаданных: модульный тест рядом с исходным кодом.
- Поведение инвентаря пакета или упакованных файлов: тест `package-dist-inventory` или проверка tarball.
- Поведение установки/обновления CLI: проверка Docker lane или фикстура.
- Поведение миграции опубликованного релиза: сценарий `published-upgrade-survivor`.
- Поведение перезапуска, принадлежащее обновлению: `update-restart-auth`.
- Поведение источника реестра/пакета: фикстура `test:docker:plugins` или сервер фикстур ClawHub.
- Поведение компоновки зависимостей или очистки: проверяйте как выполнение в runtime, так и границу файловой системы. npm-зависимости могут быть подняты внутрь управляемого npm-проекта Plugin, поэтому тесты должны доказывать, что сканируется/очищается именно этот проект, а не предполагать только дерево `node_modules`, локальное для пакета Plugin.

По умолчанию держите новые Docker-фикстуры герметичными. Используйте локальные реестры фикстур и поддельные пакеты, если только цель теста не состоит в проверке поведения живого реестра.

## Разбор сбоев

Начните с идентичности артефакта:

- Сводка Package Acceptance `resolve_package`: источник, версия, SHA-256 и имя артефакта.
- Docker-артефакты: `.artifacts/docker-tests/**/summary.json`, `failures.json`, логи lane и команды повторного запуска.
- Сводка upgrade survivor: `.artifacts/upgrade-survivor/summary.json`, включая базовую версию, версию-кандидат, сценарий, тайминги фаз и шаги рецепта.

Предпочитайте повторный запуск той же самой упавшей lane с тем же артефактом пакета, а не повторный запуск всего релизного зонта.
