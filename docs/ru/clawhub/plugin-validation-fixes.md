---
read_when:
    - Вы запустили `clawhub package validate`, и вам нужно исправить замечания Plugin.
    - ClawHub отклонил публикацию пакета Plugin или выдал предупреждение
    - Вы обновляете метаданные пакета Plugin перед релизом
summary: Исправьте замечания проверки пакета Plugin ClawHub перед публикацией
title: Исправления валидации Plugin
x-i18n:
    generated_at: "2026-07-01T15:29:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Исправления валидации Plugin

ClawHub валидирует пакеты Plugin перед публикацией, а также может показывать выводы из
автоматических сканирований пакета. Эта страница описывает выводы для авторов, то есть
выводы, которые автор Plugin может исправить в метаданных пакета, манифесте, импортах SDK
или опубликованном артефакте.

Она не описывает внутренние выводы покрытия Plugin Inspector. Если полный отчет
содержит служебные коды сканера без рекомендаций по исправлению для автора, они
предназначены для сопровождающих OpenClaw, а не для авторов Plugin.

После применения любого исправления повторно запустите:

```bash
clawhub package validate <path-to-plugin>
```

## Выводы для авторов

| Код                                     | С чего начать                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Добавьте метаданные пакета](/ru/clawhub/plugin-validation-fixes#package-json-missing)                                         |
| `package-openclaw-metadata-missing`     | [Добавьте блок openclaw пакета](/ru/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                         |
| `package-openclaw-entry-missing`        | [Объявите точки входа пакета OpenClaw](/ru/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                     |
| `package-entrypoint-missing`            | [Опубликуйте объявленную точку входа](/ru/clawhub/plugin-validation-fixes#package-entrypoint-missing)                          |
| `package-install-metadata-incomplete`   | [Заполните метаданные установки](/ru/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                      |
| `package-plugin-api-compat-missing`     | [Объявите совместимость API Plugin](/ru/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                     |
| `package-min-host-version-drift`        | [Согласуйте минимальную версию хоста](/ru/clawhub/plugin-validation-fixes#package-min-host-version-drift)                      |
| `package-manifest-version-drift`        | [Согласуйте версии пакета и манифеста](/ru/clawhub/plugin-validation-fixes#package-manifest-version-drift)                     |
| `package-openclaw-unsupported-metadata` | [Удалите неподдерживаемые метаданные пакета OpenClaw](/ru/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Сделайте артефакт npm пригодным для упаковки](/ru/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)               |
| `package-npm-pack-entrypoint-missing`   | [Включите точки входа в вывод npm pack](/ru/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)               |
| `package-npm-pack-metadata-missing`     | [Включите метаданные в вывод npm pack](/ru/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                  |
| `manifest-name-missing`                 | [Добавьте отображаемое имя в манифест](/ru/clawhub/plugin-validation-fixes#manifest-name-missing)                              |
| `manifest-unknown-fields`               | [Удалите неподдерживаемые поля манифеста](/ru/clawhub/plugin-validation-fixes#manifest-unknown-fields)                         |
| `manifest-unknown-contracts`            | [Удалите неподдерживаемые ключи контрактов](/ru/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                    |
| `legacy-root-sdk-import`                | [Замените корневые импорты SDK](/ru/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                    |
| `reserved-sdk-import`                   | [Удалите зарезервированные импорты SDK](/ru/clawhub/plugin-validation-fixes#reserved-sdk-import)                               |
| `sdk-load-session-store`                | [Замените доступ ко всему хранилищу сеанса](/ru/clawhub/plugin-validation-fixes#sdk-load-session-store)                        |
| `sdk-session-store-write`               | [Замените записи всего хранилища сеанса](/ru/clawhub/plugin-validation-fixes#sdk-session-store-write)                          |
| `sdk-session-file-helper`               | [Замените помощники путей к файлам сеанса](/ru/clawhub/plugin-validation-fixes#sdk-session-file-helper)                        |
| `sdk-session-transcript-file-target`    | [Замените устаревшие файловые назначения транскрипта](/ru/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)  |
| `sdk-session-transcript-low-level`      | [Замените низкоуровневые помощники транскрипта](/ru/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)          |
| `legacy-before-agent-start`             | [Замените before_agent_start](/ru/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                   |
| `provider-auth-env-vars`                | [Перенесите переменные среды провайдера в метаданные настройки](/ru/clawhub/plugin-validation-fixes#provider-auth-env-vars)    |
| `channel-env-vars`                      | [Отразите переменные среды канала в текущих метаданных](/ru/clawhub/plugin-validation-fixes#channel-env-vars)                  |
| `security-manifest-schema-unavailable`  | [Удалите ссылки на недоступные схемы манифеста безопасности](/ru/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Удалите неподдерживаемые файлы манифеста безопасности](/ru/clawhub/plugin-validation-fixes#unrecognized-security-manifest)    |

## Метаданные пакета

### package-json-missing

Корень пакета не содержит `package.json`, поэтому ClawHub не может определить
пакет npm, версию, точки входа или метаданные OpenClaw.

- Добавьте `package.json` с `name`, `version` и `type`.
- Добавьте блок `openclaw`, если пакет поставляет Plugin OpenClaw.
- Используйте [Создание Plugin](/ru/plugins/building-plugins) как минимальный пример пакета
  и [Манифест Plugin](/ru/plugins/manifest#manifest-versus-packagejson)
  для разделения пакета и манифеста.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

В пакете есть `package.json`, но он не объявляет метаданные пакета
OpenClaw.

- Добавьте `package.json#openclaw`.
- Включите метаданные точек входа, такие как `openclaw.extensions` или
  `openclaw.runtimeExtensions`.
- Добавьте метаданные совместимости и установки, если пакет будет опубликован или
  установлен через ClawHub.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метаданные пакета существуют, но они не объявляют runtime-точку входа
OpenClaw.

- Добавьте `openclaw.extensions` для нативных точек входа Plugin.
- Добавьте `openclaw.runtimeExtensions`, когда опубликованный пакет должен загружать собранный
  JavaScript.
- Держите все пути точек входа внутри каталога пакета.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints) и
  [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет объявляет точку входа OpenClaw, но указанный файл отсутствует
в проверяемом пакете.

- Проверьте каждый путь в `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` и `openclaw.runtimeSetupEntry`.
- Соберите пакет, если точка входа генерируется в `dist`.
- Обновите метаданные, если точка входа была перемещена.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не может определить, как пакет должен устанавливаться или обновляться.

- Заполните `openclaw.install` поддерживаемым источником установки, например
  `clawhubSpec`, `npmSpec` или `localPath`.
- Установите `openclaw.install.defaultChoice`, если доступно более одного источника
  установки.
- Используйте `openclaw.install.minHostVersion` для минимальной версии хоста OpenClaw.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не объявляет диапазон API Plugin OpenClaw, который он поддерживает.

- Добавьте `openclaw.compat.pluginApi` в `package.json`.
- Используйте версию API Plugin OpenClaw или нижнюю границу semver, с которой вы
  собирали и тестировали.
- Держите это отдельно от версии пакета. Версия пакета описывает
  выпуск Plugin; `openclaw.compat.pluginApi` описывает контракт API хоста.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Минимальная версия хоста в пакете не соответствует метаданным версии OpenClaw,
с которой пакет был собран.

- Проверьте `openclaw.install.minHostVersion`.
- Проверьте любые метаданные сборки OpenClaw в пакете, например версию OpenClaw,
  использованную во время выпуска.
- Согласуйте минимальную версию хоста с диапазоном версий хоста, который пакет
  фактически поддерживает.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версия пакета и версия манифеста Plugin не совпадают.

- Предпочитайте `package.json#version` как версию выпуска пакета.
- Если `openclaw.plugin.json` также содержит `version`, обновите ее для совпадения или удалите
  устаревшие метаданные версии манифеста, когда метаданные пакета являются авторитетными.
- Опубликуйте новую версию пакета после изменения опубликованных метаданных.
- См. [Манифест Plugin](/ru/plugins/manifest).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` содержит поля, которые не поддерживаются
как метаданные пакета OpenClaw.

- Удалите неподдерживаемые поля, такие как `openclaw.bundle`.
- Держите метаданные нативного Plugin в `openclaw.plugin.json`.
- Держите точки входа пакета, совместимость, установку, настройку и метаданные каталога
  в поддерживаемых полях `package.json#openclaw`.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Опубликованный артефакт

### package-npm-pack-unavailable

Пакет нельзя упаковать в артефакт, который ClawHub будет проверять или
публиковать.

- Запустите `npm pack --dry-run` из корня пакета.
- Исправьте недопустимые метаданные пакета, сломанные lifecycle-скрипты или записи files, из-за которых
  упаковка завершается ошибкой.
- Удалите `private: true`, если этот пакет предназначен для публичной публикации.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можно упаковать, но упакованный артефакт не включает
файлы точек входа, объявленные в `package.json#openclaw`.

- Запустите `npm pack --dry-run` и проверьте файлы, которые будут включены.
- Соберите генерируемые точки входа перед упаковкой.
- Обновите `files`, `.npmignore` или вывод сборки, чтобы объявленные точки входа
  были включены.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

В упакованном артефакте отсутствуют метаданные OpenClaw, которые существуют в вашем исходном
пакете.

- Запустите `npm pack --dry-run` и проверьте включенные файлы метаданных.
- Убедитесь, что `package.json` включает блок `openclaw` в упакованном артефакте.
- Убедитесь, что `openclaw.plugin.json` включен, когда пакет является нативным
  Plugin OpenClaw.
- Обновите `files` или `.npmignore`, чтобы метаданные пакета не исключались.
- См. [Создание Plugin](/ru/plugins/building-plugins).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Метаданные манифеста

### manifest-name-missing

Нативный манифест Plugin не содержит отображаемое имя.

- Добавьте непустое поле `name` в `openclaw.plugin.json`.
- Оставьте `name` человекочитаемым, а `id` используйте как стабильный машинный идентификатор.
- См. [манифест Plugin](/ru/plugins/manifest).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Манифест Plugin содержит поля верхнего уровня, которые OpenClaw не поддерживает.

- Сравните каждое поле верхнего уровня со
  [справочником полей манифеста](/ru/plugins/manifest#top-level-field-reference).
- Удалите пользовательские поля из `openclaw.plugin.json`.
- Вместо манифеста перенесите метаданные пакета или установки в поддерживаемые поля `package.json#openclaw`.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Манифест объявляет неподдерживаемые ключи внутри `contracts`.

- Сравните каждый ключ в `contracts` со
  [справочником contracts](/ru/plugins/manifest#contracts-reference).
- Удалите неподдерживаемые ключи contracts.
- Перенесите поведение времени выполнения в код регистрации Plugin, а `contracts`
  ограничьте статическими метаданными владения возможностями.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Миграция SDK и совместимости

### legacy-root-sdk-import

Plugin импортирует из устаревшего корневого barrel SDK:
`openclaw/plugin-sdk`.

- Замените импорты из корневого barrel на точечные импорты из публичных подпутей.
- Используйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Используйте `openclaw/plugin-sdk/channel-core` для вспомогательных функций точки входа канала.
- Используйте [соглашения об импортах](/ru/plugins/building-plugins#import-conventions) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths), чтобы найти узкий импорт.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin импортирует путь SDK, зарезервированный для bundled plugins или внутренней
совместимости.

- Замените зарезервированные внутренние импорты OpenClaw SDK на документированные публичные
  подпути `openclaw/plugin-sdk/*`.
- Если для поведения нет публичного SDK, оставьте вспомогательную функцию внутри своего пакета или
  запросите публичный API OpenClaw.
- Используйте [подпути Plugin SDK](/ru/plugins/sdk-subpaths) и
  [миграцию SDK](/ru/plugins/sdk-migration), чтобы выбрать поддерживаемый импорт.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin все еще использует устаревшую вспомогательную функцию для всего хранилища сеанса
`loadSessionStore`.

- Используйте `getSessionEntry(...)` или `listSessionEntries(...)` при чтении состояния
  сеанса.
- Используйте `patchSessionEntry(...)` или `upsertSessionEntry(...)` при записи состояния
  сеанса.
- Избегайте загрузки, изменения и сохранения всего объекта хранилища сеанса.
- Оставляйте `loadSessionStore(...)` только пока объявленный диапазон совместимости
  все еще поддерживает более старые версии OpenClaw, которым она требуется.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin все еще использует устаревшую вспомогательную функцию записи всего хранилища сеанса, такую как
`saveSessionStore` или `updateSessionStore`.

- Используйте `patchSessionEntry(...)` при обновлении полей существующей записи
  сеанса.
- Используйте `upsertSessionEntry(...)` при замене или создании записи сеанса.
- Избегайте загрузки, изменения и сохранения всего объекта хранилища сеанса.
- Оставляйте вспомогательные функции записи всего хранилища только пока объявленный диапазон совместимости
  все еще поддерживает более старые версии OpenClaw, которым они требуются.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin все еще использует устаревшие вспомогательные функции для путей файлов сеансов, такие как
`resolveSessionFilePath` или `resolveAndPersistSessionFile`.

- Используйте `getSessionEntry(...)`, чтобы читать метаданные сеанса по идентичности агента и сеанса.
- Используйте `patchSessionEntry(...)` или `upsertSessionEntry(...)`, чтобы сохранять метаданные сеанса.
- Используйте идентичность транскрипта или вспомогательные функции цели, когда код подготавливает
  операцию с транскриптом.
- Не сохраняйте и не полагайтесь на устаревшие пути файлов транскриптов.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin все еще использует устаревшую вспомогательную функцию цели файла транскрипта
`resolveSessionTranscriptLegacyFileTarget`.

- Используйте `resolveSessionTranscriptIdentity(...)`, когда коду нужна только публичная
  идентичность сеанса.
- Используйте `resolveSessionTranscriptTarget(...)`, когда коду нужна структурированная
  цель операции с транскриптом.
- Избегайте прямого чтения или конструирования устаревших целей файлов транскриптов.
- Оставляйте устаревшую вспомогательную функцию только пока объявленный диапазон совместимости все еще
  поддерживает более старые версии OpenClaw, которым она требуется.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin все еще использует устаревшие низкоуровневые вспомогательные функции транскриптов, такие как
`appendSessionTranscriptMessage` или `emitSessionTranscriptUpdate`.

- Используйте `appendSessionTranscriptMessageByIdentity(...)` для добавления в транскрипт.
- Используйте `publishSessionTranscriptUpdateByIdentity(...)` для уведомлений об обновлении
  транскрипта.
- Предпочитайте структурированную поверхность времени выполнения транскрипта, чтобы OpenClaw мог применять
  корректные границы транзакций и обработку идентичности.
- Оставляйте низкоуровневые вспомогательные функции транскриптов только пока объявленный диапазон совместимости
  все еще поддерживает более старые версии OpenClaw, которым они требуются.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin все еще использует устаревший hook `before_agent_start`.

- Перенесите работу по переопределению модели или провайдера в `before_model_resolve`.
- Перенесите работу по изменению prompt или контекста в `before_prompt_build`.
- Оставляйте `before_agent_start` только пока объявленный диапазон совместимости все еще
  поддерживает более старые версии OpenClaw, которым он требуется.
- См. [Hooks](/ru/plugins/hooks) и
  [совместимость Plugin](/ru/plugins/compatibility).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Манифест все еще использует устаревшие метаданные аутентификации провайдера `providerAuthEnvVars`.

- Отразите метаданные env-var провайдера в `setup.providers[].envVars`.
- Оставляйте `providerAuthEnvVars` только как метаданные совместимости, пока поддерживаемый
  диапазон OpenClaw все еще нуждается в них.
- См. [справочник setup](/ru/plugins/manifest#setup-reference) и
  [миграцию SDK](/ru/plugins/sdk-migration).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Манифест использует устаревшие или более старые метаданные env-var канала без текущих
метаданных setup или config, которые ожидает ClawHub.

- Оставляйте метаданные env-var канала декларативными, чтобы OpenClaw мог проверять статус setup
  без загрузки времени выполнения канала.
- Отразите setup канала, управляемый env, в текущих setup, config канала или
  метаданных канала пакета, используемых формой вашего Plugin.
- Оставляйте `channelEnvVars` только как метаданные совместимости, пока более старые поддерживаемые
  версии OpenClaw все еще требуют их.
- См. [манифест Plugin](/ru/plugins/manifest) и
  [канальные Plugin](/ru/plugins/sdk-channel-plugins).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Манифест безопасности

### security-manifest-schema-unavailable

Пакет поставляет `openclaw.security.json` со ссылкой на схему, которую ClawHub
не распознает как доступную.

- Удалите URL схемы, если он имеет только рекомендательный характер.
- Используйте документированную версионированную схему только после того, как OpenClaw опубликует ее.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет поставляет неподдерживаемый файл манифеста безопасности.

- Удалите `openclaw.security.json`, пока OpenClaw не задокументирует версионированную схему манифеста безопасности
  и поведение ClawHub.
- Документируйте чувствительное к безопасности поведение в публичной документации пакета или
  README, пока контракт манифеста не существует.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Связано

- [ClawHub CLI](/ru/clawhub/cli)
- [публикация ClawHub](/ru/clawhub/publishing)
- [создание plugins](/ru/plugins/building-plugins)
- [манифест Plugin](/ru/plugins/manifest)
- [точки входа Plugin](/ru/plugins/sdk-entrypoints)
- [совместимость Plugin](/ru/plugins/compatibility)
