---
read_when:
    - Вы запустили clawhub package validate и должны исправить замечания по Plugin
    - ClawHub отклонил публикацию пакета Plugin или выдал предупреждение
    - Вы обновляете метаданные пакета Plugin перед релизом
summary: Исправить замечания проверки пакета Plugin ClawHub перед публикацией
title: Исправления проверки Plugin
x-i18n:
    generated_at: "2026-07-03T02:53:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Исправления валидации Plugin

ClawHub проверяет пакеты Plugin перед публикацией, а также может показывать результаты автоматизированного сканирования пакетов. Эта страница описывает результаты, предназначенные для авторов, то есть результаты, которые автор Plugin может исправить в метаданных пакета, манифесте, импортах SDK или опубликованном артефакте.

Она не описывает внутренние результаты покрытия Plugin Inspector. Если полный отчет содержит коды обслуживания сканера без рекомендаций по исправлению для автора, они предназначены для мейнтейнеров OpenClaw, а не для авторов Plugin.

После применения любого исправления запустите повторно:

```bash
clawhub package validate <path-to-plugin>
```

## Результаты для авторов

| Код                                     | С чего начать                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Добавьте метаданные пакета](/ru/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Добавьте блок openclaw в пакете](/ru/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Объявите точки входа пакета OpenClaw](/ru/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Опубликуйте объявленную точку входа](/ru/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Заполните метаданные установки](/ru/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Объявите совместимость с API Plugin](/ru/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Согласуйте минимальную версию хоста](/ru/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Согласуйте версии пакета и манифеста](/ru/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Удалите неподдерживаемые метаданные пакета OpenClaw](/ru/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Сделайте npm-артефакт пригодным для упаковки](/ru/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Включите точки входа в вывод npm pack](/ru/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Включите метаданные в вывод npm pack](/ru/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Добавьте отображаемое имя манифеста](/ru/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Удалите неподдерживаемые поля манифеста](/ru/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Удалите неподдерживаемые ключи контрактов](/ru/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Замените корневые импорты SDK](/ru/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Удалите зарезервированные импорты SDK](/ru/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Замените доступ ко всему хранилищу сеанса](/ru/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Замените записи во все хранилище сеанса](/ru/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Замените помощники для путей к файлам сеанса](/ru/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Замените устаревшие файловые цели транскрипта](/ru/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Замените низкоуровневые помощники транскрипта](/ru/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Замените before_agent_start](/ru/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Перенесите env vars провайдера в метаданные настройки](/ru/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Отразите env vars канала в текущих метаданных](/ru/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Удалите ссылки на недоступные схемы манифеста безопасности](/ru/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Удалите неподдерживаемые файлы манифеста безопасности](/ru/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Метаданные пакета

### package-json-missing

Корень пакета не содержит `package.json`, поэтому ClawHub не может определить npm-пакет, версию, точки входа или метаданные OpenClaw.

- Добавьте `package.json` с `name`, `version` и `type`.
- Добавьте блок `openclaw`, если пакет поставляет Plugin OpenClaw.
- Используйте [Создание Plugin](/ru/plugins/building-plugins) как минимальный пример пакета и [Манифест Plugin](/ru/plugins/manifest#manifest-versus-packagejson) для разделения пакета и манифеста.
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

В пакете есть `package.json`, но он не объявляет метаданные пакета OpenClaw.

- Добавьте `package.json#openclaw`.
- Включите метаданные точки входа, например `openclaw.extensions` или `openclaw.runtimeExtensions`.
- Добавьте метаданные совместимости и установки, если пакет будет опубликован или установлен через ClawHub.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метаданные пакета существуют, но они не объявляют точку входа среды выполнения OpenClaw.

- Добавьте `openclaw.extensions` для точек входа нативного Plugin.
- Добавьте `openclaw.runtimeExtensions`, если опубликованный пакет должен загружать собранный JavaScript.
- Держите все пути точек входа внутри каталога пакета.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints) и [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Пакет объявляет точку входа OpenClaw, но указанный файл отсутствует в проверяемом пакете.

- Проверьте каждый путь в `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` и `openclaw.runtimeSetupEntry`.
- Соберите пакет, если точка входа генерируется в `dist`.
- Обновите метаданные, если точка входа переместилась.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не может определить, как пакет должен устанавливаться или обновляться.

- Заполните `openclaw.install` поддерживаемым источником установки, например `clawhubSpec`, `npmSpec` или `localPath`.
- Задайте `openclaw.install.defaultChoice`, если доступно более одного источника установки.
- Используйте `openclaw.install.minHostVersion` для минимальной версии хоста OpenClaw.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Пакет не объявляет диапазон API Plugin OpenClaw, который он поддерживает.

- Добавьте `openclaw.compat.pluginApi` в `package.json`.
- Используйте версию API Plugin OpenClaw или минимальную semver-версию, под которую вы собирали и тестировали.
- Держите это отдельно от версии пакета. Версия пакета описывает выпуск Plugin; `openclaw.compat.pluginApi` описывает контракт API хоста.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Минимальная версия хоста пакета не совпадает с метаданными версии OpenClaw, под которую был собран пакет.

- Проверьте `openclaw.install.minHostVersion`.
- Проверьте любые метаданные сборки OpenClaw в пакете, например версию OpenClaw, использованную во время выпуска.
- Согласуйте минимальную версию хоста с диапазоном версий хоста, который пакет фактически поддерживает.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версия пакета и версия манифеста Plugin не совпадают.

- Предпочитайте `package.json#version` как версию выпуска пакета.
- Если `openclaw.plugin.json` также содержит `version`, обновите ее, чтобы она совпадала, или удалите устаревшие метаданные версии манифеста, если метаданные пакета являются авторитетными.
- Опубликуйте новую версию пакета после изменения опубликованных метаданных.
- См. [Манифест Plugin](/ru/plugins/manifest).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` содержит поля, которые не являются поддерживаемыми метаданными пакета OpenClaw.

- Удалите неподдерживаемые поля, например `openclaw.bundle`.
- Держите метаданные нативного Plugin в `openclaw.plugin.json`.
- Держите точки входа пакета, совместимость, установку, настройку и метаданные каталога в поддерживаемых полях `package.json#openclaw`.
- См. [поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

## Опубликованный артефакт

### package-npm-pack-unavailable

Пакет нельзя упаковать в артефакт, который ClawHub проверял бы или публиковал.

- Запустите `npm pack --dry-run` из корня пакета.
- Исправьте недопустимые метаданные пакета, сломанные сценарии жизненного цикла или записи файлов, из-за которых упаковка завершается ошибкой.
- Удалите `private: true`, если этот пакет предназначен для публичной публикации.
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можно упаковать, но упакованный артефакт не содержит файлы точек входа, объявленные в `package.json#openclaw`.

- Запустите `npm pack --dry-run` и проверьте файлы, которые будут включены.
- Соберите сгенерированные точки входа перед упаковкой.
- Обновите `files`, `.npmignore` или вывод сборки, чтобы объявленные точки входа были включены.
- См. [Точки входа Plugin](/ru/plugins/sdk-entrypoints).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

В упакованном артефакте отсутствуют метаданные OpenClaw, которые есть в исходном пакете.

- Запустите `npm pack --dry-run` и проверьте включенные файлы метаданных.
- Убедитесь, что `package.json` содержит блок `openclaw` в упакованном артефакте.
- Убедитесь, что `openclaw.plugin.json` включен, если пакет является нативным Plugin OpenClaw.
- Обновите `files` или `.npmignore`, чтобы метаданные пакета не исключались.
- См. [Создание Plugin](/ru/plugins/building-plugins).
- Запустите повторно `clawhub package validate <path-to-plugin>`.

## Метаданные манифеста

### manifest-name-missing

Нативный манифест Plugin не содержит отображаемое имя.

- Добавьте непустое поле `name` в `openclaw.plugin.json`.
- Оставьте `name` человекочитаемым, а `id` — стабильным машинным идентификатором.
- См. [манифест Plugin](/ru/plugins/manifest).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Манифест Plugin содержит поля верхнего уровня, которые OpenClaw не поддерживает.

- Сравните каждое поле верхнего уровня со
  [справочником полей манифеста](/ru/plugins/manifest#top-level-field-reference).
- Удалите пользовательские поля из `openclaw.plugin.json`.
- Перенесите метаданные пакета или установки в поддерживаемые поля
  `package.json#openclaw` вместо манифеста.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Манифест объявляет неподдерживаемые ключи внутри `contracts`.

- Сравните каждый ключ в `contracts` со
  [справочником contracts](/ru/plugins/manifest#contracts-reference).
- Удалите неподдерживаемые ключи контрактов.
- Перенесите поведение среды выполнения в код регистрации Plugin, а `contracts`
  ограничьте статическими метаданными владения возможностями.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## SDK и миграция совместимости

### legacy-root-sdk-import

Plugin импортирует из устаревшего корневого barrel SDK:
`openclaw/plugin-sdk`.

- Замените импорты из корневого barrel на точечные импорты из публичных подпутей.
- Используйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Используйте `openclaw/plugin-sdk/channel-core` для вспомогательных средств точки входа канала.
- Используйте [соглашения об импорте](/ru/plugins/building-plugins#import-conventions) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths), чтобы найти узкий импорт.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin импортирует путь SDK, зарезервированный для встроенных Plugins или внутренней
совместимости.

- Замените зарезервированные внутренние импорты SDK OpenClaw на документированные публичные
  подпути `openclaw/plugin-sdk/*`.
- Если у поведения нет публичного SDK, оставьте вспомогательное средство внутри своего пакета или
  запросите публичный API OpenClaw.
- Используйте [подпути Plugin SDK](/ru/plugins/sdk-subpaths) и
  [миграцию SDK](/ru/plugins/sdk-migration), чтобы выбрать поддерживаемый импорт.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin все еще использует устаревшее вспомогательное средство всего хранилища сессий
`loadSessionStore`.

- Используйте `getSessionEntry(...)` или `listSessionEntries(...)` при чтении состояния
  сессии.
- Используйте `patchSessionEntry(...)` или `upsertSessionEntry(...)` при записи состояния
  сессии.
- Избегайте загрузки, изменения и сохранения всего объекта хранилища сессий.
- Оставляйте `loadSessionStore(...)` только пока объявленный диапазон совместимости
  все еще поддерживает старые версии OpenClaw, которым оно требуется.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin все еще использует устаревшее вспомогательное средство записи всего хранилища сессий, например
`saveSessionStore` или `updateSessionStore`.

- Используйте `patchSessionEntry(...)` при обновлении полей в существующей записи
  сессии.
- Используйте `upsertSessionEntry(...)` при замене или создании записи сессии.
- Избегайте загрузки, изменения и сохранения всего объекта хранилища сессий.
- Оставляйте вспомогательные средства записи всего хранилища только пока объявленный диапазон совместимости
  все еще поддерживает старые версии OpenClaw, которым они требуются.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin все еще использует устаревшие вспомогательные средства путей файлов сессий, например
`resolveSessionFilePath` или `resolveAndPersistSessionFile`.

- Используйте `getSessionEntry(...)`, чтобы читать метаданные сессии по идентичности агента и сессии.
- Используйте `patchSessionEntry(...)` или `upsertSessionEntry(...)`, чтобы сохранять метаданные сессии.
- Используйте идентичность транскрипта или вспомогательные средства цели, когда код подготавливает
  операцию транскрипта.
- Не сохраняйте и не полагайтесь на устаревшие пути файлов транскриптов.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin все еще использует устаревшее вспомогательное средство цели файла транскрипта
`resolveSessionTranscriptLegacyFileTarget`.

- Используйте `resolveSessionTranscriptIdentity(...)`, когда коду нужна только публичная
  идентичность сессии.
- Используйте `resolveSessionTranscriptTarget(...)`, когда коду нужна структурированная
  цель операции транскрипта.
- Избегайте прямого чтения или создания устаревших целей файлов транскриптов.
- Оставляйте устаревшее вспомогательное средство только пока объявленный диапазон совместимости все еще
  поддерживает старые версии OpenClaw, которым оно требуется.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin все еще использует устаревшие низкоуровневые вспомогательные средства транскриптов, например
`appendSessionTranscriptMessage` или `emitSessionTranscriptUpdate`.

- Используйте `appendSessionTranscriptMessageByIdentity(...)` для добавления к транскрипту.
- Используйте `publishSessionTranscriptUpdateByIdentity(...)` для уведомлений об обновлении
  транскрипта.
- Предпочитайте структурированную поверхность среды выполнения транскриптов, чтобы OpenClaw мог применять
  корректные границы транзакций и обработку идентичности.
- Оставляйте низкоуровневые вспомогательные средства транскриптов только пока объявленный диапазон совместимости
  все еще поддерживает старые версии OpenClaw, которым они требуются.
- См. [Runtime API](/ru/plugins/sdk-runtime#agent-session-state) и
  [подпути Plugin SDK](/ru/plugins/sdk-subpaths).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin все еще использует устаревший hook `before_agent_start`.

- Перенесите работу с переопределением модели или провайдера в `before_model_resolve`.
- Перенесите работу с изменением prompt или контекста в `before_prompt_build`.
- Оставляйте `before_agent_start` только пока объявленный диапазон совместимости все еще
  поддерживает старые версии OpenClaw, которым он требуется.
- См. [Hooks](/ru/plugins/hooks) и
  [совместимость Plugin](/ru/plugins/compatibility).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Манифест все еще использует устаревшие метаданные авторизации провайдера `providerAuthEnvVars`.

- Отразите метаданные переменных окружения провайдера в `setup.providers[].envVars`.
- Оставляйте `providerAuthEnvVars` только как метаданные совместимости, пока поддерживаемому
  диапазону OpenClaw это все еще нужно.
- См. [справочник setup](/ru/plugins/manifest#setup-reference) и
  [миграцию SDK](/ru/plugins/sdk-migration).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Манифест использует устаревшие или старые метаданные переменных окружения канала без текущих
метаданных setup или config, которые ожидает ClawHub.

- Оставляйте метаданные переменных окружения канала декларативными, чтобы OpenClaw мог проверять статус
  настройки без загрузки среды выполнения канала.
- Отразите настройку канала через переменные окружения в текущих метаданных setup, config канала или
  метаданных канала пакета, используемых формой вашего Plugin.
- Оставляйте `channelEnvVars` только как метаданные совместимости, пока старые поддерживаемые
  версии OpenClaw все еще требуют их.
- См. [манифест Plugin](/ru/plugins/manifest) и
  [Plugins каналов](/ru/plugins/sdk-channel-plugins).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## Манифест безопасности

### security-manifest-schema-unavailable

Пакет поставляет `openclaw.security.json` со ссылкой на схему, которую ClawHub
не распознает как доступную.

- Удалите URL схемы, если он носит только рекомендательный характер.
- Используйте документированную версионированную схему только после того, как OpenClaw опубликует ее.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет поставляет неподдерживаемый файл манифеста безопасности.

- Удалите `openclaw.security.json`, пока OpenClaw не документирует версионированную схему манифеста
  безопасности и поведение ClawHub.
- Документируйте чувствительное к безопасности поведение в публичной документации пакета или
  README, пока контракт манифеста не существует.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## Связанные материалы

- [CLI ClawHub](/ru/clawhub/cli)
- [публикация ClawHub](/ru/clawhub/publishing)
- [создание Plugins](/ru/plugins/building-plugins)
- [манифест Plugin](/ru/plugins/manifest)
- [точки входа Plugin](/ru/plugins/sdk-entrypoints)
- [совместимость Plugin](/ru/plugins/compatibility)
