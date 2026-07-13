---
read_when:
    - Вы запустили `clawhub package validate`, и вам нужно исправить замечания по плагину
    - ClawHub отклонил публикацию пакета плагина или выдал предупреждение о ней
    - Вы обновляете метаданные пакета плагина перед выпуском
summary: Устраните замечания проверки пакета плагина ClawHub перед публикацией
title: Исправления проверки плагинов
x-i18n:
    generated_at: "2026-07-13T19:35:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Исправление ошибок проверки плагинов

ClawHub проверяет пакеты плагинов перед публикацией, а также может показывать результаты
автоматического сканирования пакетов. На этой странице описаны результаты, предназначенные для авторов, то есть
проблемы, которые автор плагина может исправить в метаданных пакета, манифесте, импортах SDK
или опубликованном артефакте.

Здесь не рассматриваются внутренние результаты проверки покрытия Plugin Inspector. Если полный отчёт
содержит коды обслуживания сканера без рекомендаций по исправлению для автора, они
предназначены для сопровождающих OpenClaw, а не для авторов плагинов.

После применения любого исправления повторно выполните:

```bash
clawhub package validate <path-to-plugin>
```

## Результаты для авторов

| Код                                     | С чего начать                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Добавить метаданные пакета](/ru/clawhub/plugin-validation-fixes#package-json-missing)                                                |
| `package-openclaw-metadata-missing`     | [Добавить блок openclaw в пакет](/ru/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                               |
| `package-openclaw-entry-missing`        | [Объявить точки входа пакета OpenClaw](/ru/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                            |
| `package-entrypoint-missing`            | [Опубликовать объявленную точку входа](/ru/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                |
| `package-install-metadata-incomplete`   | [Заполнить метаданные установки](/ru/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                             |
| `package-plugin-api-compat-missing`     | [Объявить совместимость API плагина](/ru/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                            |
| `package-min-host-version-drift`        | [Согласовать минимальную версию хоста](/ru/clawhub/plugin-validation-fixes#package-min-host-version-drift)                            |
| `package-manifest-version-drift`        | [Согласовать версии пакета и манифеста](/ru/clawhub/plugin-validation-fixes#package-manifest-version-drift)                           |
| `package-openclaw-unsupported-metadata` | [Удалить неподдерживаемые метаданные пакета OpenClaw](/ru/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)       |
| `package-npm-pack-unavailable`          | [Сделать npm-артефакт пригодным для упаковки](/ru/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                        |
| `package-npm-pack-entrypoint-missing`   | [Включить точки входа в результат npm pack](/ru/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Включить метаданные в результат npm pack](/ru/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                     |
| `manifest-name-missing`                 | [Добавить отображаемое имя манифеста](/ru/clawhub/plugin-validation-fixes#manifest-name-missing)                                     |
| `manifest-unknown-fields`               | [Удалить неподдерживаемые поля манифеста](/ru/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                |
| `manifest-unknown-contracts`            | [Удалить неподдерживаемые ключи контрактов](/ru/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                           |
| `legacy-root-sdk-import`                | [Заменить импорты из корня SDK](/ru/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                          |
| `reserved-sdk-import`                   | [Удалить зарезервированные импорты SDK](/ru/clawhub/plugin-validation-fixes#reserved-sdk-import)                                     |
| `sdk-load-session-store`                | [Заменить доступ ко всему хранилищу сеансов](/ru/clawhub/plugin-validation-fixes#sdk-load-session-store)                              |
| `sdk-session-store-write`               | [Заменить запись всего хранилища сеансов](/ru/clawhub/plugin-validation-fixes#sdk-session-store-write)                                |
| `sdk-session-file-helper`               | [Заменить вспомогательные функции путей к файлам сеанса](/ru/clawhub/plugin-validation-fixes#sdk-session-file-helper)                 |
| `sdk-session-transcript-file-target`    | [Заменить устаревшие целевые файлы расшифровки сеанса](/ru/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)        |
| `sdk-session-transcript-low-level`      | [Заменить низкоуровневые вспомогательные функции расшифровки](/ru/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)   |
| `legacy-before-agent-start`             | [Заменить before_agent_start](/ru/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                         |
| `provider-auth-env-vars`                | [Перенести переменные среды провайдера в метаданные настройки](/ru/clawhub/plugin-validation-fixes#provider-auth-env-vars)            |
| `channel-env-vars`                      | [Продублировать переменные среды канала в текущих метаданных](/ru/clawhub/plugin-validation-fixes#channel-env-vars)                   |
| `security-manifest-schema-unavailable`  | [Удалить недоступные ссылки на схему манифеста безопасности](/ru/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Удалить неподдерживаемые файлы манифеста безопасности](/ru/clawhub/plugin-validation-fixes#unrecognized-security-manifest)           |

## Метаданные пакета

### package-json-missing

В корне пакета отсутствует `package.json`, поэтому ClawHub не может определить
npm-пакет, версию, точки входа или метаданные OpenClaw.

- Добавьте `package.json` с `name`, `version` и `type`.
- Добавьте блок `openclaw`, если пакет содержит плагин OpenClaw.
- Минимальный пример пакета приведён в разделе [Создание плагинов](/ru/plugins/building-plugins),
  а различия между пакетом и манифестом — в разделе [Манифест плагина](/ru/plugins/manifest#manifest-versus-packagejson).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Пакет содержит `package.json`, но в нём не объявлены метаданные пакета
OpenClaw.

- Добавьте `package.json#openclaw`.
- Включите метаданные точки входа, например `openclaw.extensions` или
  `openclaw.runtimeExtensions`.
- Добавьте метаданные совместимости и установки, если пакет будет опубликован или
  установлен через ClawHub.
- См. [Поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Метаданные пакета существуют, но в них не объявлена точка входа среды выполнения
OpenClaw.

- Добавьте `openclaw.extensions` для нативных точек входа плагина.
- Добавьте `openclaw.runtimeExtensions`, если опубликованный пакет должен загружать собранный
  JavaScript.
- Все пути к точкам входа должны находиться внутри каталога пакета.
- См. [Точки входа плагина](/ru/plugins/sdk-entrypoints) и
  [Поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

В пакете объявлена точка входа OpenClaw, но указанный файл отсутствует
в проверяемом пакете.

- Проверьте каждый путь в `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` и `openclaw.runtimeSetupEntry`.
- Соберите пакет, если точка входа создаётся в `dist`.
- Обновите метаданные, если точка входа была перемещена.
- См. [Точки входа плагина](/ru/plugins/sdk-entrypoints).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub не может определить, как следует устанавливать или обновлять пакет.

- Заполните `openclaw.install`, указав поддерживаемый источник установки, например
  `clawhubSpec`, `npmSpec` или `localPath`.
- Задайте `openclaw.install.defaultChoice`, если доступно несколько источников
  установки.
- Используйте `openclaw.install.minHostVersion` для минимальной версии хоста OpenClaw.
- См. [Поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

В пакете не объявлен поддерживаемый диапазон API плагинов OpenClaw.

- Добавьте `openclaw.compat.pluginApi` в `package.json`.
- Укажите версию API плагинов OpenClaw или минимальную версию semver, с которой пакет был собран и
  протестирован.
- Не смешивайте это с версией пакета. Версия пакета описывает выпуск
  плагина, а `openclaw.compat.pluginApi` — контракт API хоста.
- См. [Поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Минимальная версия хоста в пакете не соответствует метаданным версии OpenClaw,
для которой был собран пакет.

- Проверьте `openclaw.install.minHostVersion`.
- Проверьте все метаданные сборки OpenClaw в пакете, например версию OpenClaw,
  использованную при выпуске.
- Согласуйте минимальную версию хоста с диапазоном версий хоста, который пакет
  фактически поддерживает.
- См. [Поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Версия пакета не совпадает с версией в манифесте плагина.

- Предпочтительно использовать `package.json#version` в качестве версии выпуска пакета.
- Если `openclaw.plugin.json` также содержит `version`, обновите его до совпадающего значения или удалите
  устаревшие метаданные версии манифеста, если метаданные пакета являются авторитетными.
- После изменения опубликованных метаданных опубликуйте новую версию пакета.
- См. [Манифест плагина](/ru/plugins/manifest).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Блок `package.json#openclaw` содержит поля, которые не поддерживаются
в метаданных пакета OpenClaw.

- Удалите неподдерживаемые поля, например `openclaw.bundle`.
- Храните метаданные нативного плагина в `openclaw.plugin.json`.
- Храните точки входа пакета, сведения о совместимости, установке, настройке и каталоге
  в поддерживаемых полях `package.json#openclaw`.
- См. [Поля package.json, влияющие на обнаружение](/ru/plugins/manifest#packagejson-fields-that-affect-discovery).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

## Опубликованный артефакт

### package-npm-pack-unavailable

Пакет невозможно упаковать в артефакт, который ClawHub должен проверить или
опубликовать.

- Выполните `npm pack --dry-run` из корня пакета.
- Исправьте недопустимые метаданные пакета, неработающие скрипты жизненного цикла или записи о файлах,
  из-за которых упаковка завершается с ошибкой.
- Удалите `private: true`, если этот пакет предназначен для публичной публикации.
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Пакет можно упаковать, но упакованный артефакт не содержит
файлы точек входа, объявленные в `package.json#openclaw`.

- Выполните `npm pack --dry-run` и проверьте файлы, которые будут включены.
- Соберите генерируемые точки входа перед упаковкой.
- Обновите `files`, `.npmignore` или выходные данные сборки, чтобы объявленные точки входа были
  включены.
- См. [Точки входа плагина](/ru/plugins/sdk-entrypoints).
- Повторно выполните `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

В упакованном артефакте отсутствуют метаданные OpenClaw, имеющиеся в исходном
пакете.

- Запустите `npm pack --dry-run` и проверьте включённые файлы метаданных.
- Убедитесь, что `package.json` включает блок `openclaw` в упакованном артефакте.
- Убедитесь, что `openclaw.plugin.json` включён, если пакет является нативным
  плагином OpenClaw.
- Обновите `files` или `.npmignore`, чтобы метаданные пакета не исключались.
- См. [Создание плагинов](/ru/plugins/building-plugins).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Метаданные манифеста

### manifest-name-missing

В манифесте нативного плагина отсутствует отображаемое имя.

- Добавьте непустое поле `name` в `openclaw.plugin.json`.
- Используйте в `name` понятный человеку текст, а `id` оставьте стабильным машинным идентификатором.
- См. [Манифест плагина](/ru/plugins/manifest).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Манифест плагина содержит поля верхнего уровня, которые OpenClaw не поддерживает.

- Сверьте каждое поле верхнего уровня со
  [справочником полей манифеста](/ru/plugins/manifest#top-level-field-reference).
- Удалите пользовательские поля из `openclaw.plugin.json`.
- Перенесите метаданные пакета или установки в поддерживаемые поля `package.json#openclaw`,
  а не в манифест.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

В манифесте объявлены неподдерживаемые ключи внутри `contracts`.

- Сверьте каждый ключ в `contracts` со
  [справочником контрактов](/ru/plugins/manifest#contracts-reference).
- Удалите неподдерживаемые ключи контрактов.
- Перенесите поведение среды выполнения в код регистрации плагина, а `contracts`
  ограничьте статическими метаданными о принадлежности возможностей.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Миграция SDK и совместимости

### legacy-root-sdk-import

Плагин импортирует из устаревшего корневого агрегирующего модуля SDK:
`openclaw/plugin-sdk`.

- Замените импорты из корневого агрегирующего модуля на целевые импорты из общедоступных подпутей.
- Используйте `openclaw/plugin-sdk/plugin-entry` для `definePluginEntry`.
- Используйте `openclaw/plugin-sdk/channel-core` для вспомогательных средств точек входа каналов.
- Используйте [Соглашения об импорте](/ru/plugins/building-plugins#import-conventions) и
  [Подпути SDK плагинов](/ru/plugins/sdk-subpaths), чтобы найти точный импорт.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Плагин импортирует путь SDK, зарезервированный для встроенных плагинов или внутренней
совместимости.

- Замените зарезервированные внутренние импорты SDK OpenClaw на документированные общедоступные
  подпути `openclaw/plugin-sdk/*`.
- Если для этого поведения нет общедоступного SDK, оставьте вспомогательное средство внутри своего пакета или
  запросите общедоступный API OpenClaw.
- Используйте [Подпути SDK плагинов](/ru/plugins/sdk-subpaths) и
  [Миграцию SDK](/ru/plugins/sdk-migration), чтобы выбрать поддерживаемый импорт.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Плагин всё ещё использует устаревшее вспомогательное средство для всего хранилища сеансов
`loadSessionStore`.

- Используйте `getSessionEntry(...)` или `listSessionEntries(...)` при чтении состояния
  сеанса.
- Используйте `patchSessionEntry(...)` или `upsertSessionEntry(...)` при записи состояния
  сеанса.
- Не загружайте, не изменяйте и не сохраняйте объект всего хранилища сеансов.
- Сохраняйте `loadSessionStore(...)` только пока заявленный диапазон совместимости
  всё ещё поддерживает старые версии OpenClaw, которым он необходим.
- См. [API среды выполнения](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути SDK плагинов](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Плагин всё ещё использует устаревшее вспомогательное средство записи всего хранилища сеансов, например
`saveSessionStore` или `updateSessionStore`.

- Используйте `patchSessionEntry(...)` при обновлении полей существующей записи
  сеанса.
- Используйте `upsertSessionEntry(...)` при замене или создании записи сеанса.
- Не загружайте, не изменяйте и не сохраняйте объект всего хранилища сеансов.
- Сохраняйте вспомогательные средства записи всего хранилища только пока заявленный диапазон совместимости
  всё ещё поддерживает старые версии OpenClaw, которым они необходимы.
- См. [API среды выполнения](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути SDK плагинов](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Плагин всё ещё использует устаревшие вспомогательные средства для путей к файлам сеансов, например
`resolveSessionFilePath` или `resolveAndPersistSessionFile`.

- Используйте `getSessionEntry(...)` для чтения метаданных сеанса по идентификаторам агента и
  сеанса.
- Используйте `patchSessionEntry(...)` или `upsertSessionEntry(...)` для сохранения метаданных
  сеанса.
- Используйте идентификатор транскрипта или вспомогательные средства целевого объекта, когда код подготавливает
  операцию с транскриптом.
- Не сохраняйте устаревшие пути к файлам транскриптов и не полагайтесь на них.
- См. [API среды выполнения](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути SDK плагинов](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Плагин всё ещё использует устаревшее вспомогательное средство целевого файла транскрипта
`resolveSessionTranscriptLegacyFileTarget`.

- Используйте `resolveSessionTranscriptIdentity(...)`, когда коду требуется только общедоступный
  идентификатор сеанса.
- Используйте `resolveSessionTranscriptTarget(...)`, когда коду требуется структурированный
  целевой объект операции с транскриптом.
- Не считывайте и не создавайте напрямую устаревшие целевые объекты файлов транскриптов.
- Сохраняйте устаревшее вспомогательное средство только пока заявленный диапазон совместимости всё ещё
  поддерживает старые версии OpenClaw, которым оно необходимо.
- См. [API среды выполнения](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути SDK плагинов](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Плагин всё ещё использует устаревшие низкоуровневые вспомогательные средства для транскриптов, например
`appendSessionTranscriptMessage` или `emitSessionTranscriptUpdate`.

- Используйте `appendSessionTranscriptMessageByIdentity(...)` для добавления данных в транскрипт.
- Используйте `publishSessionTranscriptUpdateByIdentity(...)` для уведомлений об обновлении
  транскрипта.
- Отдавайте предпочтение структурированному интерфейсу среды выполнения для транскриптов, чтобы OpenClaw мог применять
  правильные границы транзакций и корректно обрабатывать идентификаторы.
- Сохраняйте низкоуровневые вспомогательные средства для транскриптов только пока заявленный диапазон совместимости
  всё ещё поддерживает старые версии OpenClaw, которым они необходимы.
- См. [API среды выполнения](/ru/plugins/sdk-runtime#agent-session-state) и
  [Подпути SDK плагинов](/ru/plugins/sdk-subpaths).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Плагин всё ещё использует устаревший перехватчик `before_agent_start`.

- Перенесите переопределение модели или провайдера в `before_model_resolve`.
- Перенесите изменение запроса или контекста в `before_prompt_build`.
- Сохраняйте `before_agent_start` только пока заявленный диапазон совместимости всё ещё
  поддерживает старые версии OpenClaw, которым он необходим.
- См. [Перехватчики](/ru/plugins/hooks) и
  [Совместимость плагинов](/ru/plugins/compatibility).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Манифест всё ещё использует устаревшие метаданные аутентификации провайдера `providerAuthEnvVars`.

- Продублируйте метаданные переменных среды провайдера в `setup.providers[].envVars`.
- Сохраняйте `providerAuthEnvVars` только как метаданные совместимости, пока поддерживаемому диапазону
  OpenClaw они всё ещё необходимы.
- См. [справочник по настройке](/ru/plugins/manifest#setup-reference) и
  [Миграцию SDK](/ru/plugins/sdk-migration).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Манифест использует устаревшие или более ранние метаданные переменных среды канала без актуальных
метаданных настройки или конфигурации, ожидаемых ClawHub.

- Храните метаданные переменных среды канала в декларативном виде, чтобы OpenClaw мог проверять состояние настройки,
  не загружая среду выполнения канала.
- Перенесите настройку канала через переменные среды в актуальные метаданные настройки, конфигурации канала или
  канала пакета, используемые структурой вашего плагина.
- Сохраняйте `channelEnvVars` только как метаданные совместимости, пока они всё ещё необходимы старым поддерживаемым
  версиям OpenClaw.
- См. [Манифест плагина](/ru/plugins/manifest) и
  [Плагины каналов](/ru/plugins/sdk-channel-plugins).
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Манифест безопасности

### security-manifest-schema-unavailable

Пакет поставляет `openclaw.security.json` со ссылкой на схему, которую ClawHub
не распознаёт как доступную.

- Удалите URL-адрес схемы, если он носит только рекомендательный характер.
- Используйте документированную версионированную схему только после того, как OpenClaw опубликует её.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Пакет поставляет неподдерживаемый файл манифеста безопасности.

- Удалите `openclaw.security.json`, пока OpenClaw не задокументирует версионированную схему манифеста безопасности
  и поведение ClawHub.
- До появления контракта манифеста документируйте поведение, связанное с безопасностью, в общедоступной документации пакета или
  README.
- Повторно запустите `clawhub package validate <path-to-plugin>`.

## Связанные материалы

- [CLI ClawHub](/ru/clawhub/cli)
- [Публикация в ClawHub](/ru/clawhub/publishing)
- [Создание плагинов](/ru/plugins/building-plugins)
- [Манифест плагина](/ru/plugins/manifest)
- [Точки входа плагина](/ru/plugins/sdk-entrypoints)
- [Совместимость плагинов](/ru/plugins/compatibility)
