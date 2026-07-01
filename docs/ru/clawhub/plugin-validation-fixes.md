---
read_when:
    - Вы запустили `clawhub package validate`, и вам нужно исправить замечания по Plugin
    - ClawHub отклонил публикацию пакета plugin или выдал предупреждение
    - Вы обновляете метаданные пакета Plugin перед релизом
summary: Исправить замечания проверки пакета Plugin ClawHub перед публикацией
title: Исправления проверки Plugin
x-i18n:
    generated_at: "2026-07-01T20:31:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Исправления валидации Plugin

ClawHub валидирует пакеты Plugin перед публикацией, а также может показывать результаты автоматических сканирований пакетов. На этой странице описаны находки для авторов, то есть находки, которые автор Plugin может исправить в метаданных пакета, манифесте, импортах SDK или опубликованном артефакте.

Она не охватывает внутренние находки покрытия Plugin Inspector. Если полный отчет содержит коды обслуживания сканера без рекомендаций по исправлению для автора, они предназначены для сопровождающих OpenClaw, а не для авторов Plugin.

После применения любого исправления повторно выполните:

```bash
clawhub package validate <path-to-plugin>
```

## Находки для авторов

| Код                                     | С чего начать                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Добавьте метаданные пакета](/ru/clawhub/plugin-validation-fixes#package-json-missing)                                            |
| `package-openclaw-metadata-missing`     | [Добавьте блок openclaw в пакет](/ru/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                           |
| `package-openclaw-entry-missing`        | [Объявите точки входа пакета OpenClaw](/ru/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                        |
| `package-entrypoint-missing`            | [Опубликуйте объявленную точку входа](/ru/clawhub/plugin-validation-fixes#package-entrypoint-missing)                             |
| `package-install-metadata-incomplete`   | [Заполните метаданные установки](/ru/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                         |
| `package-plugin-api-compat-missing`     | [Объявите совместимость API Plugin](/ru/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                        |
| `package-min-host-version-drift`        | [Согласуйте минимальную версию хоста](/ru/clawhub/plugin-validation-fixes#package-min-host-version-drift)                         |
| `package-manifest-version-drift`        | [Согласуйте версии пакета и манифеста](/ru/clawhub/plugin-validation-fixes#package-manifest-version-drift)                        |
| `package-openclaw-unsupported-metadata` | [Удалите неподдерживаемые метаданные пакета OpenClaw](/ru/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)  |
| `package-npm-pack-unavailable`          | [Сделайте npm-артефакт пригодным для упаковки](/ru/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                  |
| `package-npm-pack-entrypoint-missing`   | [Включите точки входа в вывод npm pack](/ru/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Включите метаданные в вывод npm pack](/ru/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                     |
| `manifest-name-missing`                 | [Добавьте отображаемое имя манифеста](/ru/clawhub/plugin-validation-fixes#manifest-name-missing)                                  |
| `manifest-unknown-fields`               | [Удалите неподдерживаемые поля манифеста](/ru/clawhub/plugin-validation-fixes#manifest-unknown-fields)                            |
| `manifest-unknown-contracts`            | [Удалите неподдерживаемые ключи контракта](/ru/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                        |
| `legacy-root-sdk-import`                | [Замените корневые импорты SDK](/ru/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                       |
| `reserved-sdk-import`                   | [Удалите зарезервированные импорты SDK](/ru/clawhub/plugin-validation-fixes#reserved-sdk-import)                                  |
| `sdk-load-session-store`                | [Замените доступ ко всему хранилищу сеанса](/ru/clawhub/plugin-validation-fixes#sdk-load-session-store)                           |
| `sdk-session-store-write`               | [Замените записи всего хранилища сеанса](/ru/clawhub/plugin-validation-fixes#sdk-session-store-write)                             |
| `sdk-session-file-helper`               | [Замените помощники путей к файлам сеанса](/ru/clawhub/plugin-validation-fixes#sdk-session-file-helper)                           |
| `sdk-session-transcript-file-target`    | [Замените устаревшие целевые файлы transcript](/ru/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)            |
| `sdk-session-transcript-low-level`      | [Замените низкоуровневые помощники transcript](/ru/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)              |
| `legacy-before-agent-start`             | [Замените before_agent_start](/ru/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                      |
| `provider-auth-env-vars`                | [Перенесите env vars провайдера в метаданные настройки](/ru/clawhub/plugin-validation-fixes#provider-auth-env-vars)               |
| `channel-env-vars`                      | [Отразите env vars канала в текущих метаданных](/ru/clawhub/plugin-validation-fixes#channel-env-vars)                             |
| `security-manifest-schema-unavailable`  | [Удалите недоступные ссылки на схему манифеста безопасности](/ru/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Удалите неподдерживаемые файлы манифеста безопасности](/ru/clawhub/plugin-validation-fixes#unrecognized-security-manifest)       |

## Метаданные пакета

### package-json-missing

Корень пакета не содержит `package.json`, поэтому ClawHub не может определить npm-пакет, версию, точки входа или метаданные OpenClaw.

- Добавьте `package.json` с `name`, `version` и `type`.
- Добавьте блок `openclaw`, когда пакет поставляет Plugin OpenClaw.
- Используйте [Создание Plugin](/ru/plugins/building-plugins) как минимальный пример пакета и [Манифест Plugin](/ru/plugins/manifest#manifest-versus-packagejson) для разделения пакета и манифеста.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

В пакете есть `package.json`, но он не объявляет метаданные пакета OpenClaw.

- Добавьте `package.json#openclaw`.
- Включите метаданные точек входа, например `openclaw.extensions` или `openclaw.runtimeExtensions`.
- Добавьте метаданные совместимости и установки, когда пакет будет опубликован или установлен через ClawHub.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метаданные пакета существуют, но не объявляют runtime-точку входа OpenClaw.

- Добавьте `openclaw.extensions` для точек входа native Plugin.
- Добавьте `openclaw.runtimeExtensions`, когда опубликованный пакет должен загружать собранный JavaScript.
- Держите все пути точек входа внутри каталога пакета.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints) и [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет объявляет точку входа OpenClaw, но указанный файл отсутствует в валидируемом пакете.

- Проверьте каждый путь в `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` и `openclaw.runtimeSetupEntry`.
- Соберите пакет, если точка входа генерируется в `dist`.
- Обновите метаданные, если точка входа была перемещена.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не может определить, как пакет должен устанавливаться или обновляться.

- Заполните `openclaw.install` поддерживаемым источником установки, например `clawhubSpec`, `npmSpec` или `localPath`.
- Задайте `openclaw.install.defaultChoice`, когда доступно более одного источника установки.
- Используйте `openclaw.install.minHostVersion` для минимальной версии хоста OpenClaw.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не объявляет диапазон API Plugin OpenClaw, который он поддерживает.

- Добавьте `openclaw.compat.pluginApi` в `package.json`.
- Используйте версию API Plugin OpenClaw или нижнюю границу semver, относительно которой вы выполняли сборку и тестирование.
- Держите это отдельно от версии пакета. Версия пакета описывает выпуск Plugin; `openclaw.compat.pluginApi` описывает контракт API хоста.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Минимальная версия хоста пакета не соответствует метаданным версии OpenClaw, относительно которых был собран пакет.

- Проверьте `openclaw.install.minHostVersion`.
- Проверьте любые метаданные сборки OpenClaw в пакете, например версию OpenClaw, использованную во время выпуска.
- Согласуйте минимальную версию хоста с диапазоном версий хоста, который пакет фактически поддерживает.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версия пакета и версия манифеста Plugin не совпадают.

- Предпочитайте `package.json#version` как версию выпуска пакета.
- Если в `openclaw.plugin.json` также есть `version`, обновите ее, чтобы она совпадала, или удалите устаревшие метаданные версии манифеста, когда метаданные пакета являются авторитетным источником.
- Опубликуйте новую версию пакета после изменения опубликованных метаданных.
- См. [Манифест Plugin](/ru/plugins/manifest).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` содержит поля, которые не поддерживаются как метаданные пакета OpenClaw.

- Удалите неподдерживаемые поля, например `openclaw.bundle`.
- Держите метаданные native Plugin в `openclaw.plugin.json`.
- Держите точки входа пакета, совместимость, установку, настройку и метаданные каталога в поддерживаемых полях `package.json#openclaw`.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## Опубликованный артефакт

### package-npm-pack-unavailable

Пакет нельзя упаковать в артефакт, который ClawHub проверил бы или опубликовал.

- Выполните `npm pack --dry-run` из корня пакета.
- Исправьте недопустимые метаданные пакета, сломанные lifecycle scripts или записи files, из-за которых упаковка завершается ошибкой.
- Удалите `private: true`, если этот пакет предназначен для публичной публикации.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можно упаковать, но упакованный артефакт не содержит файлы точек входа, объявленные в `package.json#openclaw`.

- Выполните `npm pack --dry-run` и проверьте файлы, которые будут включены.
- Соберите сгенерированные точки входа перед упаковкой.
- Обновите `files`, `.npmignore` или вывод сборки, чтобы объявленные точки входа были включены.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

В упакованном артефакте отсутствуют метаданные OpenClaw, которые существуют в вашем исходном пакете.

- Выполните `npm pack --dry-run` и проверьте включенные файлы метаданных.
- Убедитесь, что `package.json` содержит блок `openclaw` в упакованном артефакте.
- Убедитесь, что `openclaw.plugin.json` включен, когда пакет является native Plugin OpenClaw.
- Обновите `files` или `.npmignore`, чтобы метаданные пакета не исключались.
- См. [Создание Plugin](/ru/plugins/building-plugins).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## Метаданные манифеста

### manifest-name-missing

Манифест нативного plugin не включает отображаемое имя.

- Добавьте непустое поле `name` в `openclaw.plugin.json`.
- Сделайте `name` читаемым для человека, а `id` оставьте стабильным машинным идентификатором.
- См. [Манифест plugin](/ru/plugins/manifest).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

В манифесте plugin есть поля верхнего уровня, которые OpenClaw не поддерживает.

- Сравните каждое поле верхнего уровня со
  [справочником полей манифеста](/ru/plugins/manifest#top-level-field-reference).
- Удалите пользовательские поля из `openclaw.plugin.json`.
- Переместите метаданные пакета или установки в поддерживаемые поля `package.json#openclaw`
  вместо манифеста.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Манифест объявляет неподдерживаемые ключи внутри `contracts`.

- Сравните каждый ключ в `contracts` со
  [справочником contracts](/ru/plugins/manifest#contracts-reference).
- Удалите неподдерживаемые ключи контрактов.
- Переместите поведение runtime в код регистрации plugin, а `contracts`
  ограничьте статическими метаданными владения возможностями.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## Миграция SDK и совместимости

### legacy-root-sdk-import

Plugin импортирует из устаревшего корневого барреля SDK:
`openclaw/plugin-sdk`.

- Замените импорты из корневого барреля на сфокусированные импорты из публичных подпутей.
- Используйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Используйте `openclaw/plugin-sdk/channel-core` для вспомогательных функций точки входа канала.
- Используйте [Соглашения об импорте](/ru/plugins/building-plugins#import-conventions) и
  [Подпути Plugin SDK](/ru/plugins/sdk-subpaths), чтобы найти узкий импорт.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin импортирует путь SDK, зарезервированный для встроенных plugins или внутренней
совместимости.

- Замените зарезервированные внутренние импорты SDK OpenClaw на документированные публичные
  подпути `openclaw/plugin-sdk/*`.
- Если для поведения нет публичного SDK, оставьте вспомогательную функцию внутри вашего пакета или
  запросите публичный API OpenClaw.
- Используйте [Подпути Plugin SDK](/ru/plugins/sdk-subpaths) и
  [Миграцию SDK](/ru/plugins/sdk-migration), чтобы выбрать поддерживаемый импорт.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin всё ещё использует устаревшую вспомогательную функцию всего хранилища сессий
`loadSessionStore`.

- Используйте `getSessionEntry(...)` или `listSessionEntries(...)` при чтении состояния
  сессии.
- Используйте `patchSessionEntry(...)` или `upsertSessionEntry(...)` при записи состояния
  сессии.
- Избегайте загрузки, изменения и сохранения всего объекта хранилища сессий.
- Сохраняйте `loadSessionStore(...)` только пока ваш объявленный диапазон совместимости
  всё ещё поддерживает более старые версии OpenClaw, которым она требуется.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin всё ещё использует устаревшую вспомогательную функцию записи всего хранилища сессий, такую как
`saveSessionStore` или `updateSessionStore`.

- Используйте `patchSessionEntry(...)` при обновлении полей в существующей записи
  сессии.
- Используйте `upsertSessionEntry(...)` при замене или создании записи сессии.
- Избегайте загрузки, изменения и сохранения всего объекта хранилища сессий.
- Сохраняйте вспомогательные функции записи всего хранилища только пока ваш объявленный диапазон совместимости
  всё ещё поддерживает более старые версии OpenClaw, которым они требуются.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin всё ещё использует устаревшие вспомогательные функции путей к файлам сессий, такие как
`resolveSessionFilePath` или `resolveAndPersistSessionFile`.

- Используйте `getSessionEntry(...)`, чтобы читать метаданные сессии по идентичности агента и сессии.
- Используйте `patchSessionEntry(...)` или `upsertSessionEntry(...)`, чтобы сохранять метаданные сессии.
- Используйте идентичность расшифровки или вспомогательные функции цели, когда код готовит
  операцию расшифровки.
- Не сохраняйте устаревшие пути к файлам расшифровок и не полагайтесь на них.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin всё ещё использует устаревшую вспомогательную функцию цели файла расшифровки
`resolveSessionTranscriptLegacyFileTarget`.

- Используйте `resolveSessionTranscriptIdentity(...)`, когда коду нужна только публичная
  идентичность сессии.
- Используйте `resolveSessionTranscriptTarget(...)`, когда коду нужна структурированная
  цель операции расшифровки.
- Избегайте прямого чтения или конструирования устаревших целей файлов расшифровок.
- Сохраняйте устаревшую вспомогательную функцию только пока ваш объявленный диапазон совместимости всё ещё
  поддерживает более старые версии OpenClaw, которым она требуется.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin всё ещё использует устаревшие низкоуровневые вспомогательные функции расшифровки, такие как
`appendSessionTranscriptMessage` или `emitSessionTranscriptUpdate`.

- Используйте `appendSessionTranscriptMessageByIdentity(...)` для добавления в расшифровку.
- Используйте `publishSessionTranscriptUpdateByIdentity(...)` для уведомлений об обновлении
  расшифровки.
- Предпочитайте структурированную поверхность runtime для расшифровок, чтобы OpenClaw мог применять
  корректные границы транзакций и обработку идентичности.
- Сохраняйте низкоуровневые вспомогательные функции расшифровки только пока ваш объявленный диапазон совместимости
  всё ещё поддерживает более старые версии OpenClaw, которым они требуются.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin всё ещё использует устаревший hook `before_agent_start`.

- Переместите работу по переопределению модели или провайдера в `before_model_resolve`.
- Переместите работу по изменению prompt или context в `before_prompt_build`.
- Сохраняйте `before_agent_start` только пока ваш объявленный диапазон совместимости всё ещё
  поддерживает более старые версии OpenClaw, которым он требуется.
- См. [Hooks](/ru/plugins/hooks) и
  [Совместимость plugin](/ru/plugins/compatibility).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Манифест всё ещё использует устаревшие метаданные авторизации провайдера `providerAuthEnvVars`.

- Отразите метаданные env-var провайдера в `setup.providers[].envVars`.
- Сохраняйте `providerAuthEnvVars` только как метаданные совместимости, пока ваш поддерживаемый
  диапазон OpenClaw всё ещё нуждается в них.
- См. [справочник setup](/ru/plugins/manifest#setup-reference) и
  [Миграцию SDK](/ru/plugins/sdk-migration).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Манифест использует устаревшие или более старые метаданные env-var канала без текущих
метаданных setup или config, которые ожидает ClawHub.

- Держите метаданные env-var канала декларативными, чтобы OpenClaw мог проверять статус setup
  без загрузки runtime канала.
- Отразите настройку канала на основе env в текущих метаданных setup, config канала или
  метаданных канала пакета, используемых формой вашего plugin.
- Сохраняйте `channelEnvVars` только как метаданные совместимости, пока более старые поддерживаемые
  версии OpenClaw всё ещё требуют их.
- См. [Манифест plugin](/ru/plugins/manifest) и
  [Канальные plugins](/ru/plugins/sdk-channel-plugins).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## Манифест безопасности

### security-manifest-schema-unavailable

Пакет поставляет `openclaw.security.json` со ссылкой на схему, которую ClawHub
не распознаёт как доступную.

- Удалите URL схемы, если он только рекомендательный.
- Используйте документированную версионированную схему только после того, как OpenClaw опубликует её.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет поставляет неподдерживаемый файл манифеста безопасности.

- Удалите `openclaw.security.json`, пока OpenClaw не задокументирует версионированную схему манифеста безопасности
  и поведение ClawHub.
- Документируйте чувствительное к безопасности поведение в публичной документации вашего пакета или
  README, пока контракт манифеста не существует.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## Связанное

- [ClawHub CLI](/ru/clawhub/cli)
- [Публикация ClawHub](/ru/clawhub/publishing)
- [Создание plugins](/ru/plugins/building-plugins)
- [Манифест plugin](/ru/plugins/manifest)
- [Точки входа plugin](/ru/plugins/sdk-entrypoints)
- [Совместимость plugin](/ru/plugins/compatibility)
