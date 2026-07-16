---
read_when:
    - Выбор подходящего подпути plugin-sdk для импорта плагина
    - Аудит подпутей встроенных плагинов и вспомогательных интерфейсов
summary: 'Каталог подпутей SDK плагинов: где находятся разные импорты, с группировкой по областям'
title: Подпути SDK плагинов
x-i18n:
    generated_at: "2026-07-16T16:37:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK плагинов предоставляется в виде набора узких публичных подпутей в
`openclaw/plugin-sdk/`. На этой странице перечислены часто используемые подпути,
сгруппированные по назначению. Поверхность определяют три файла:

- `scripts/lib/plugin-sdk-entrypoints.json`: поддерживаемый перечень точек входа,
  компилируемых при сборке.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: локальные для репозитория
  тестовые и внутренние подпути. Экспорты пакета представляют собой перечень за вычетом этого списка.
- `src/plugin-sdk/entrypoints.ts`: метаданные классификации для устаревших
  подпутей, зарезервированных встроенных вспомогательных средств, поддерживаемых встроенных фасадов и
  публичных поверхностей, принадлежащих плагинам.

Сопровождающие проверяют количество публичных экспортов с помощью `pnpm plugin-sdk:surface`, а
активные зарезервированные подпути вспомогательных средств — с помощью `pnpm plugins:boundary-report:summary`;
неиспользуемые экспорты зарезервированных вспомогательных средств приводят к сбою отчёта CI, а не остаются в
публичном SDK в виде неактивного долга совместимости.

Руководство по созданию плагинов см. в разделе [Обзор SDK плагинов](/ru/plugins/sdk-overview).

## Точка входа плагина

| Подпуть                        | Основные экспорты                                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Вспомогательные средства элементов поставщика миграции, такие как `createMigrationItem`, константы причин, маркеры состояния элементов, вспомогательные средства редактирования конфиденциальных данных и `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Вспомогательные средства миграции среды выполнения, такие как `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` и `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Регистрация проверок работоспособности Doctor, обнаружение, исправление, выбор, серьёзность и типы результатов для встроенных потребителей данных о работоспособности                                                                                |
| `plugin-sdk/config-schema`     | Устарело. Корневая схема Zod `openclaw.json` (`OpenClawSchema`); вместо неё определяйте локальные схемы плагина и проверяйте их с помощью `plugin-sdk/json-schema-runtime`                                                  |

### Устаревшие средства совместимости и тестирования

Устаревшие подпути остаются экспортируемыми для старых плагинов, однако новый код должен использовать
приведённые ниже специализированные подпути SDK. Поддерживаемый список находится в
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI отклоняет
производственные импорты встроенных компонентов из него. Широкие агрегирующие модули, такие как `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` и
`plugin-sdk/text-runtime`, предназначены только для совместимости, а `plugin-sdk/zod` является
повторным экспортом для совместимости: импортируйте `zod` напрямую из `zod`. Широкие
агрегирующие модули доменов `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` и
`plugin-sdk/security-runtime` также устарели; вместо них следует использовать специализированные
подпути.

Подпути вспомогательных средств тестирования OpenClaw на основе Vitest предназначены только для репозитория и
больше не экспортируются из пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` и `testing`. Закрытые поверхности встроенных вспомогательных средств
`ssrf-runtime-internal` и `codex-native-task-runtime` также предназначены
только для репозитория.

### Зарезервированные подпути вспомогательных средств встроенных плагинов

`plugin-sdk/codex-mcp-projection` — единственный зарезервированный подпуть: принадлежащая плагину
поверхность совместимости для встроенного плагина Codex, а не API SDK общего назначения.
Импорты между плагинами разных владельцев блокируются средствами контроля контрактов пакетов, а
CI завершается с ошибкой, если зарезервированный подпуть перестаёт импортироваться.
`plugin-sdk/codex-native-task-runtime` предназначен только для репозитория и не
экспортируется из пакета.

`src/plugin-sdk/entrypoints.ts` также отслеживает поддерживаемые встроенные фасады — точки входа SDK,
реализуемые соответствующим встроенным плагином до их замены универсальными контрактами:
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` и `plugin-sdk/zalouser`. Некоторые из них также
устарели для нового кода; см. примечания к соответствующим строкам ниже.

  <AccordionGroup>
  <Accordion title="Подпути каналов">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Кэшируемый вспомогательный модуль проверки JSON Schema для схем, принадлежащих плагинам |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Общие вспомогательные модули мастера настройки, транслятор настройки, запросы для списков разрешений, построители состояния настройки |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним для совместимости; используйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Вспомогательные модули для конфигурации нескольких учётных записей и шлюза действий, а также для отката к учётной записи по умолчанию |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, вспомогательные модули нормализации идентификаторов учётных записей |
    | `plugin-sdk/account-resolution` | Вспомогательные модули поиска учётной записи и отката к значению по умолчанию |
    | `plugin-sdk/account-helpers` | Узкоспециализированные вспомогательные модули для списков учётных записей и действий с ними |
    | `plugin-sdk/access-groups` | Разбор списка разрешений для групп доступа и вспомогательные модули диагностики групп с редактированием конфиденциальных данных |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Устаревший фасад для совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Общие примитивы схем конфигурации каналов, а также построители Zod и непосредственные построители JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Встроенные схемы конфигурации каналов OpenClaw только для сопровождаемых встроенных плагинов |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонические идентификаторы встроенных и официальных каналов чата, а также метки и псевдонимы форматирования для плагинов, которым требуется распознавать текст с префиксом конверта без жёсткого кодирования собственной таблицы. |
    | `plugin-sdk/channel-config-schema-legacy` | Устаревший псевдоним для совместимости со схемами конфигурации встроенных каналов |
    | `plugin-sdk/telegram-command-config` | Устаревшая нормализация имён и описаний команд Telegram, а также проверки дубликатов и конфликтов; в коде новых плагинов используйте локальную для плагина обработку конфигурации команд |
    | `plugin-sdk/command-gating` | Узкоспециализированные вспомогательные модули шлюза авторизации команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Экспериментальный высокоуровневый распознаватель среды выполнения входящего потока канала и построители фактов маршрута для перенесённых путей приёма каналов. Предпочитайте его самостоятельной сборке действующих списков разрешений, списков разрешённых команд и устаревших проекций в каждом плагине. См. [API входящего потока каналов](/ru/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Устаревший фасад для совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракты жизненного цикла сообщений, а также параметры конвейера ответов, подтверждения, интерактивный предпросмотр и потоковая передача, вспомогательные модули жизненного цикла, исходящая идентификация, планирование полезной нагрузки, надёжная отправка и вспомогательные модули контекста отправки сообщений. См. [API исходящего потока каналов](/ru/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Устаревший псевдоним для совместимости с `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Устаревший псевдоним для совместимости с `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Общие вспомогательные модули построения входящих маршрутов и конвертов |
    | `plugin-sdk/inbound-reply-dispatch` | Устаревший фасад для совместимости. Используйте `plugin-sdk/channel-inbound` для обработчиков входящих данных и предикатов диспетчеризации, а `plugin-sdk/channel-outbound` — для вспомогательных модулей доставки сообщений. |
    | `plugin-sdk/messaging-targets` | Устаревший псевдоним разбора цели; используйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Общие вспомогательные модули загрузки исходящих медиафайлов и состояния размещённых медиафайлов |
    | `plugin-sdk/outbound-send-deps` | Устаревший фасад для совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Устаревший фасад для совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Узкоспециализированные вспомогательные модули нормализации опросов |
    | `plugin-sdk/thread-bindings-runtime` | Жизненный цикл привязки потоков обсуждения и вспомогательные модули адаптеров |
    | `plugin-sdk/agent-media-payload` | Корневые каталоги и загрузчики полезной нагрузки медиафайлов агента |
    | `plugin-sdk/conversation-runtime` | Устаревший общий модуль экспорта для привязки бесед и потоков обсуждения, сопряжения и вспомогательных модулей настроенных привязок; предпочитайте специализированные подпути привязки, такие как `plugin-sdk/thread-bindings-runtime` и `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Вспомогательные модули разрешения групповой политики во время выполнения |
    | `plugin-sdk/channel-status` | Общие вспомогательные модули снимков и сводок состояния каналов |
    | `plugin-sdk/channel-config-primitives` | Узкоспециализированные примитивы схем конфигурации каналов |
    | `plugin-sdk/channel-config-writes` | Вспомогательные модули авторизации записи конфигурации каналов |
    | `plugin-sdk/channel-plugin-common` | Общие экспорты прелюдии плагинов каналов |
    | `plugin-sdk/allowlist-config-edit` | Вспомогательные модули редактирования и чтения конфигурации списков разрешений |
    | `plugin-sdk/group-access` | Устаревшие вспомогательные модули принятия решений о групповом доступе; используйте `resolveChannelMessageIngress` из `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады для совместимости. Используйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Узкоспециализированные вспомогательные модули политики предварительной криптографической проверки прямых личных сообщений |
    | `plugin-sdk/discord` | Устаревший фасад совместимости Discord для опубликованного `@openclaw/discord@2026.3.13` и отслеживаемой совместимости владельца; новые плагины должны использовать универсальные подпути SDK каналов |
    | `plugin-sdk/telegram-account` | Устаревший фасад совместимости разрешения учётных записей Telegram для отслеживаемой совместимости владельца; новые плагины должны использовать внедрённые вспомогательные модули среды выполнения или универсальные подпути SDK каналов |
    | `plugin-sdk/zalouser` | Устаревший фасад совместимости Zalo Personal для опубликованных пакетов Lark/Zalo, которые по-прежнему импортируют авторизацию команд отправителя; новые плагины должны использовать универсальные подпути SDK каналов |
    | `plugin-sdk/interactive-runtime` | Вспомогательные модули семантического представления и доставки сообщений, а также устаревших интерактивных ответов. См. [Представление сообщений](/ru/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Общие вспомогательные модули для классификации событий входящего потока, построения контекста, форматирования, корневых каталогов, устранения дребезга, сопоставления упоминаний, политики упоминаний и журналирования входящего потока |
    | `plugin-sdk/channel-inbound-debounce` | Узкоспециализированные вспомогательные модули устранения дребезга входящего потока |
    | `plugin-sdk/channel-mention-gating` | Узкоспециализированные вспомогательные модули политики упоминаний, маркеров упоминаний и текста упоминаний без более широкой поверхности среды выполнения входящего потока |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Устаревшие фасады для совместимости. Используйте `plugin-sdk/channel-inbound` или `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Устаревший фасад для совместимости. Используйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Устаревший фасад для совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Устаревший фасад для совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типы результатов ответов |
    | `plugin-sdk/channel-actions` | Вспомогательные модули действий с сообщениями каналов, а также устаревшие вспомогательные модули нативных схем, сохранённые для совместимости плагинов |
    | `plugin-sdk/channel-route` | Общая нормализация маршрутов, разрешение целей на основе парсера, преобразование идентификаторов потоков обсуждения в строки, ключи маршрутов для дедупликации и компактного представления, типы разобранных целей и вспомогательные модули сравнения маршрутов и целей |
    | `plugin-sdk/channel-targets` | Вспомогательные модули разбора целей; вызывающий код для сравнения маршрутов должен использовать `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типы контрактов каналов |
    | `plugin-sdk/channel-feedback` | Подключение обратной связи и реакций |
  </Accordion>

Устаревшие семейства вспомогательных функций каналов остаются доступными только для
совместимости опубликованных плагинов. План удаления: сохранить их на период миграции
внешних плагинов, оставить плагины репозитория и встроенные плагины на `channel-inbound` и
`channel-outbound`, а затем удалить подпути совместимости при следующей крупной
очистке SDK. Это относится к устаревшим семействам сообщений/среды выполнения каналов,
потоковой передачи каналов, прямого доступа к личным сообщениям, разрозненных вспомогательных функций для входящих сообщений, параметров ответа
и путей сопряжения.

  <Accordion title="Подпути провайдеров">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Поддерживаемый фасад провайдера LM Studio для настройки, обнаружения каталога и подготовки моделей во время выполнения |
    | `plugin-sdk/lmstudio-runtime` | Поддерживаемый фасад среды выполнения LM Studio для значений локального сервера по умолчанию, обнаружения моделей, заголовков запросов и вспомогательных функций для загруженных моделей |
    | `plugin-sdk/provider-setup` | Проверенные вспомогательные функции настройки локальных и самостоятельно размещаемых провайдеров |
    | `plugin-sdk/self-hosted-provider-setup` | Устаревшие вспомогательные функции настройки самостоятельно размещаемых провайдеров, совместимых с OpenAI; используйте `plugin-sdk/provider-setup` или принадлежащие плагинам вспомогательные функции настройки |
    | `plugin-sdk/cli-backend` | Значения по умолчанию для бэкенда CLI и константы сторожевого таймера |
    | `plugin-sdk/provider-auth-runtime` | Вспомогательные функции среды выполнения для аутентификации провайдеров: OAuth-поток с обратным подключением, обмен токенами, сохранение аутентификации и разрешение API-ключей |
    | `plugin-sdk/provider-oauth-runtime` | Универсальные типы обратных вызовов OAuth провайдеров, отрисовка страницы обратного вызова, вспомогательные функции PKCE/состояния, разбор входных данных авторизации, вспомогательные функции срока действия токенов и прерывания |
    | `plugin-sdk/provider-auth-api-key` | Вспомогательные функции подключения с API-ключом и записи профиля, такие как `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартный построитель результата аутентификации OAuth |
    | `plugin-sdk/provider-env-vars` | Вспомогательные функции поиска переменных окружения для аутентификации провайдеров |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, вспомогательные функции импорта аутентификации OpenAI Codex, устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители политик повторного воспроизведения, вспомогательные функции конечных точек провайдеров и общие вспомогательные функции нормализации идентификаторов моделей |
    | `plugin-sdk/provider-catalog-live-runtime` | Вспомогательные функции актуального каталога моделей провайдеров для защищённого обнаружения в стиле `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фильтрация идентификаторов моделей, TTL-кеш и статический резервный вариант |
    | `plugin-sdk/provider-catalog-runtime` | Перехватчик среды выполнения для расширения каталога провайдеров и точки сопряжения реестра провайдеров плагинов для контрактных тестов |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Универсальные вспомогательные функции возможностей HTTP/конечных точек провайдеров, ошибки HTTP провайдеров и вспомогательные функции multipart-форм для транскрибирования аудио |
    | `plugin-sdk/provider-web-fetch-contract` | Узкоспециализированные вспомогательные функции контракта конфигурации и выбора веб-загрузки, такие как `enablePluginInConfig` и `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Вспомогательные функции регистрации и кеширования провайдеров веб-загрузки |
    | `plugin-sdk/provider-web-search-config-contract` | Узкоспециализированные вспомогательные функции конфигурации и учётных данных веб-поиска для провайдеров, которым не требуется подключение механизма включения плагинов |
    | `plugin-sdk/provider-web-search-contract` | Узкоспециализированные вспомогательные функции контракта конфигурации и учётных данных веб-поиска, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а также ограниченные областью видимости средства задания и получения учётных данных |
    | `plugin-sdk/provider-web-search` | Вспомогательные функции регистрации, кеширования и среды выполнения провайдеров веб-поиска |
    | `plugin-sdk/embedding-providers` | Общие типы провайдеров векторных представлений и вспомогательные функции чтения, включая `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` и `listEmbeddingProviders(...)`; плагины регистрируют провайдеров через `api.registerEmbeddingProvider(...)`, чтобы обеспечить соблюдение владения манифестом |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, а также очистка и диагностика схем DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типы снимков использования провайдеров, общие вспомогательные функции получения данных об использовании и средства получения данных для провайдеров, такие как `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы обёрток потоков, совместимость вызовов инструментов в обычном тексте и общие вспомогательные функции обёрток Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Публичные общие вспомогательные функции обёрток потоков провайдеров, включая `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, а также утилиты потоков, совместимых с Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Вспомогательные функции нативного транспорта провайдеров, такие как защищённая выборка, извлечение текста результатов инструментов, преобразование транспортных сообщений и доступные для записи потоки транспортных событий |
    | `plugin-sdk/provider-onboard` | Вспомогательные функции изменения конфигурации подключения |
    | `plugin-sdk/global-singleton` | Локальные для процесса вспомогательные функции одиночек, отображений и кешей |
    | `plugin-sdk/group-activation` | Узкоспециализированные вспомогательные функции режима активации групп и разбора команд |
  </Accordion>

Снимки использования провайдеров обычно содержат одно или несколько окон квоты `windows`, каждое
с меткой, процентом использования и необязательным временем сброса. Провайдеры, предоставляющие баланс или
текст состояния учётной записи вместо сбрасываемых окон квоты, должны возвращать
`summary` с пустым массивом `windows`, а не создавать вымышленные проценты.
OpenClaw отображает этот сводный текст в выводе состояния; используйте `error`, только если
конечная точка использования завершилась с ошибкой или не вернула пригодных данных об использовании.

  <Accordion title="Подпути аутентификации и безопасности">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/command-auth` | Устаревшая широкая поверхность авторизации команд (`resolveControlCommandGate`, вспомогательные функции реестра команд, включая форматирование меню динамических аргументов, вспомогательные функции авторизации отправителя); используйте авторизацию при входе в канал или во время выполнения либо вспомогательные функции состояния команд |
    | `plugin-sdk/command-status` | Построители сообщений команд и справки, такие как `buildCommandsMessagePaginated` и `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Вспомогательные функции определения утверждающего лица и авторизации действий в том же чате |
    | `plugin-sdk/approval-client-runtime` | Вспомогательные функции профилей и фильтров нативного подтверждения выполнения |
    | `plugin-sdk/approval-delivery-runtime` | Адаптеры возможностей и доставки нативных подтверждений |
    | `plugin-sdk/approval-gateway-runtime` | Общий разрешитель Gateway подтверждений |
    | `plugin-sdk/approval-reference-runtime` | Детерминированная вспомогательная функция устойчивого локатора для обратных вызовов подтверждений в транспортах с ограничениями |
    | `plugin-sdk/approval-handler-adapter-runtime` | Облегчённые вспомогательные функции загрузки нативных адаптеров подтверждений для горячих точек входа каналов |
    | `plugin-sdk/approval-handler-runtime` | Более широкие вспомогательные функции среды выполнения обработчиков подтверждений; когда достаточно более узких точек сопряжения адаптера/Gateway, предпочитайте их |
    | `plugin-sdk/approval-native-runtime` | Вспомогательные функции цели нативного подтверждения, привязки учётной записи, шлюза маршрутизации, резервной пересылки и подавления локальных нативных запросов на подтверждение выполнения |
    | `plugin-sdk/approval-reaction-runtime` | Жёстко заданные привязки реакций подтверждения, полезные нагрузки запросов на реакцию, хранилища целей реакций, вспомогательные функции текста подсказок реакций и экспорт совместимости для подавления локальных нативных запросов на подтверждение выполнения |
    | `plugin-sdk/approval-reply-runtime` | Вспомогательные функции полезной нагрузки ответа на подтверждение выполнения/плагина |
    | `plugin-sdk/approval-runtime` | Вспомогательные функции полезной нагрузки подтверждения выполнения/плагина, построители возможностей подтверждения, вспомогательные функции аутентификации и профилей подтверждения, вспомогательные функции маршрутизации и среды выполнения нативных подтверждений, а также вспомогательные функции структурированного отображения подтверждений, такие как `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Устаревшие узкоспециализированные вспомогательные функции сброса дедупликации входящих ответов |
    | `plugin-sdk/command-auth-native` | Вспомогательные функции нативной авторизации команд, форматирования меню динамических аргументов и целей нативных сеансов |
    | `plugin-sdk/command-detection` | Общие вспомогательные функции обнаружения команд |
    | `plugin-sdk/command-primitives-runtime` | Облегчённые предикаты текста команд для горячих путей каналов |
    | `plugin-sdk/command-surface` | Вспомогательные функции нормализации тела команды и поверхности команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Вспомогательные функции ленивого потока входа для аутентификации провайдера при сопряжении приватного канала и Web UI с помощью кода устройства |
    | `plugin-sdk/channel-secret-runtime` | Устаревшая широкая поверхность контракта секретов (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, типы целей секретов); предпочитайте специализированные подпути ниже |
    | `plugin-sdk/channel-secret-basic-runtime` | Узкоспециализированные экспорты контракта секретов и построители реестра целей для поверхностей секретов каналов/плагинов, не относящихся к TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Узкоспециализированные вспомогательные функции назначения вложенных секретов TTS каналов |
    | `plugin-sdk/secret-ref-runtime` | Узкоспециализированная типизация SecretRef, разрешение и поиск пути цели плана для разбора контракта секретов/конфигурации |
    | `plugin-sdk/secret-provider-integration` | Контракты манифеста интеграции провайдера SecretRef и предустановок только для типов для плагинов, публикующих предустановки внешних провайдеров секретов |
    | `plugin-sdk/security-runtime` | Устаревший широкий модуль экспорта для доверия, ограничения личных сообщений, вспомогательных функций файлов/путей в пределах корня, включая запись только при создании, синхронную/асинхронную атомарную замену файлов, запись во временные файлы рядом с целевыми, резервное перемещение между устройствами, вспомогательные функции приватных файловых хранилищ, защиту от символьных ссылок в родительских каталогах, внешний контент, редактирование конфиденциального текста, сравнение секретов за постоянное время и вспомогательные функции сбора секретов; предпочитайте специализированные подпути безопасности/SSRF/секретов |
    | `plugin-sdk/ssrf-policy` | Вспомогательные функции списка разрешённых хостов и политики SSRF для частных сетей |
    | `plugin-sdk/ssrf-dispatcher` | Узкоспециализированные вспомогательные функции закреплённого диспетчера без широкой поверхности инфраструктурной среды выполнения |
    | `plugin-sdk/ssrf-runtime` | Вспомогательные функции закреплённого диспетчера, защищённой от SSRF выборки, ошибок SSRF и политики SSRF |
    | `plugin-sdk/secret-input` | Вспомогательные функции разбора входных данных секретов |
    | `plugin-sdk/webhook-ingress` | Вспомогательные функции запросов/целей Webhook и приведение необработанных данных WebSocket/тела |
    | `plugin-sdk/webhook-request-guards` | Вспомогательные функции размера тела запроса/тайм-аута и `runDetachedWebhookWork` для отслеживаемой обработки после подтверждения |
  </Accordion>

  <Accordion title="Подпути среды выполнения и хранилища">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/runtime` | Вспомогательные средства среды выполнения, ведения журналов и резервного копирования, предупреждения о путях установки плагинов и вспомогательные средства для процессов |
    | `plugin-sdk/runtime-env` | Узкоспециализированные вспомогательные средства для переменных окружения среды выполнения, журналирования, тайм-аутов, повторных попыток и экспоненциальной задержки |
    | `plugin-sdk/browser-config` | Поддерживаемый фасад конфигурации браузера для нормализованного профиля и значений по умолчанию, разбора URL-адресов CDP и вспомогательных средств аутентификации управления браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Универсальные вспомогательные средства жизненного цикла задач и доставки результатов выполнения для агентов на базе средств управления, использующих область задачи, назначенную хостом |
    | `plugin-sdk/codex-mcp-projection` | Зарезервированное встроенное вспомогательное средство Codex для проецирования пользовательской конфигурации сервера MCP в конфигурацию потока Codex; не предназначено для сторонних плагинов |
    | `plugin-sdk/codex-native-task-runtime` | Встроенное вспомогательное средство Codex, локальное для репозитория, для нативной интеграции зеркалирования задач и среды выполнения; не экспортируется из пакета |
    | `plugin-sdk/channel-runtime-context` | Универсальные вспомогательные средства регистрации и поиска контекста среды выполнения канала |
    | `plugin-sdk/matrix` | Устаревший фасад совместимости Matrix для старых сторонних пакетов каналов; новые плагины должны импортировать `plugin-sdk/run-command` напрямую |
    | `plugin-sdk/mattermost` | Устаревший фасад совместимости Mattermost для старых сторонних пакетов каналов; новые плагины должны импортировать универсальные подпути SDK напрямую |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Устаревший общий модуль экспорта для вспомогательных средств команд, перехватчиков, HTTP и интерактивного взаимодействия плагинов; предпочтительны специализированные подпути среды выполнения плагинов |
    | `plugin-sdk/hook-runtime` | Устаревший общий модуль экспорта для вспомогательных средств Webhook и конвейера внутренних перехватчиков; предпочтительны специализированные подпути среды выполнения перехватчиков и плагинов |
    | `plugin-sdk/lazy-runtime` | Вспомогательные средства отложенного импорта и привязки среды выполнения, такие как `createLazyRuntimeModule`, `createLazyRuntimeMethod` и `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Вспомогательные средства выполнения процессов |
    | `plugin-sdk/node-host` | Вспомогательные средства разрешения исполняемых файлов на хосте Node и возобновления PTY |
    | `plugin-sdk/cli-runtime` | Устаревший общий модуль экспорта для форматирования CLI, ожидания, версий, вызова с аргументами и отложенной загрузки групп команд; предпочтительны специализированные подпути CLI и среды выполнения |
    | `plugin-sdk/qa-runner-runtime` | Поддерживаемый фасад, предоставляющий сценарии контроля качества плагинов через интерфейс команд CLI |
    | `plugin-sdk/tts-runtime` | Поддерживаемый фасад для схем конфигурации преобразования текста в речь и вспомогательных средств среды выполнения |
    | `plugin-sdk/gateway-method-runtime` | Зарезервированное вспомогательное средство диспетчеризации методов Gateway для HTTP-маршрутов плагинов, объявляющих `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клиент Gateway, вспомогательное средство запуска клиента после готовности цикла событий, RPC Gateway для CLI, ошибки протокола Gateway, разрешение объявленного хоста локальной сети и вспомогательные средства изменения состояния канала |
    | `plugin-sdk/config-contracts` | Специализированная поверхность конфигурации только с типами для форм конфигурации плагинов, таких как `OpenClawConfig`, и типов конфигурации каналов и провайдеров |
    | `plugin-sdk/plugin-config-runtime` | Вспомогательные средства конфигурации плагинов среды выполнения, такие как `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` и `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Вспомогательные средства транзакционного изменения конфигурации, такие как `mutateConfigFile`, `replaceConfigFile` и `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Общие строки подсказок метаданных доставки для инструментов сообщений |
    | `plugin-sdk/runtime-config-snapshot` | Вспомогательные средства снимка конфигурации текущего процесса, такие как `getRuntimeConfig`, `getRuntimeConfigSnapshot`, а также средства задания тестовых снимков |
    | `plugin-sdk/text-autolink-runtime` | Обнаружение автоматических ссылок на файловые ссылки без общего текстового модуля экспорта |
    | `plugin-sdk/reply-runtime` | Общие вспомогательные средства среды выполнения для входящих сообщений и ответов, разбиение на части, диспетчеризация, Heartbeat, планировщик ответов |
    | `plugin-sdk/reply-dispatch-runtime` | Узкоспециализированные вспомогательные средства диспетчеризации и завершения ответов, а также меток бесед |
    | `plugin-sdk/reply-history` | Общие вспомогательные средства краткосрочной истории ответов. Новый код обработки сообщений должен использовать `createChannelHistoryWindow`; низкоуровневые вспомогательные средства для ассоциативных массивов остаются только устаревшими экспортами совместимости |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Узкоспециализированные вспомогательные средства разбиения текста и Markdown на части |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства рабочих процессов сеансов (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), вспомогательные средства восстановления и жизненного цикла (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), вспомогательные средства маркеров для переходных значений `sessionFile`, ограниченное чтение недавнего текста расшифровки сообщений пользователя и ассистента по идентификатору сеанса, вспомогательные средства путей хранилища сеансов и ключей сеансов, а также чтение времени обновления без импорта общих операций записи и обслуживания конфигурации |
    | `plugin-sdk/session-transcript-runtime` | Идентификация расшифровок, ограниченные областью вспомогательные средства назначения, чтения и записи, проекция видимых записей сообщений, публикация обновлений, блокировки записи и ключи попаданий в память расшифровок |
    | `plugin-sdk/sqlite-runtime` | Специализированные вспомогательные средства схемы агентов SQLite, путей и транзакций для собственной среды выполнения без средств управления жизненным циклом базы данных |
    | `plugin-sdk/cron-store-runtime` | Вспомогательные средства пути, загрузки и сохранения хранилища Cron |
    | `plugin-sdk/state-paths` | Вспомогательные средства путей каталогов состояния и OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типы состояния «ключ — значение» для вспомогательной базы SQLite плагина, а также централизованные директивы подключения, проверенное обслуживание WAL и вспомогательные средства атомарной миграции схемы STRICT для баз данных, принадлежащих плагинам |
    | `plugin-sdk/routing` | Вспомогательные средства привязки маршрутов, ключей сеансов и учётных записей, такие как `resolveAgentRoute`, `buildAgentSessionKey` и `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Общие вспомогательные средства сводки состояния каналов и учётных записей, значения состояния среды выполнения по умолчанию и вспомогательные средства метаданных проблем |
    | `plugin-sdk/target-resolver-runtime` | Общие вспомогательные средства разрешения целей |
    | `plugin-sdk/string-normalization-runtime` | Вспомогательные средства нормализации кратких имён и строк |
    | `plugin-sdk/request-url` | Извлечение строковых URL-адресов из входных данных, подобных fetch/request |
    | `plugin-sdk/run-command` | Средство запуска команд с ограничением по времени и нормализованными результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Общие средства чтения параметров инструментов и CLI |
    | `plugin-sdk/tool-plugin` | Определение простого типизированного плагина инструмента агента и предоставление статических метаданных для создания манифеста |
    | `plugin-sdk/tool-payload` | Извлечение нормализованных полезных данных из объектов результатов инструментов |
    | `plugin-sdk/tool-send` | Извлечение канонических полей цели отправки из аргументов инструмента |
    | `plugin-sdk/sandbox` | Типы серверной части песочницы и вспомогательные средства команд SSH/OpenShell, включая предварительную проверку команды выполнения с немедленным прекращением при ошибке |
    | `plugin-sdk/temp-path` | Общие вспомогательные средства путей временных загрузок и закрытые защищённые временные рабочие пространства |
    | `plugin-sdk/logging-core` | Вспомогательные средства журналирования и редактирования конфиденциальных данных подсистемы |
    | `plugin-sdk/markdown-table-runtime` | Режим таблиц Markdown и вспомогательные средства преобразования |
    | `plugin-sdk/model-session-runtime` | Вспомогательные средства переопределения модели и сеанса, такие как `applyModelOverrideToSessionEntry` и `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Вспомогательные средства разрешения конфигурации провайдера разговорного взаимодействия |
    | `plugin-sdk/json-store` | Небольшие вспомогательные средства чтения и записи состояния JSON |
    | `plugin-sdk/json-unsafe-integers` | Вспомогательные средства разбора JSON, сохраняющие небезопасные целочисленные литералы в виде строк |
    | `plugin-sdk/file-lock` | Вспомогательные средства реентерабельной блокировки файлов |
    | `plugin-sdk/persistent-dedupe` | Вспомогательные средства дискового кэша устранения дубликатов |
    | `plugin-sdk/acp-runtime` | Вспомогательные средства среды выполнения и сеансов ACP, а также диспетчеризации ответов |
    | `plugin-sdk/acp-runtime-backend` | Облегчённые вспомогательные средства регистрации серверной части ACP и диспетчеризации ответов для плагинов, загружаемых при запуске |
    | `plugin-sdk/acp-binding-resolve-runtime` | Разрешение привязок ACP только для чтения без импорта средств запуска жизненного цикла |
    | `plugin-sdk/agent-config-primitives` | Устаревшие примитивы схем конфигурации среды выполнения агентов; импортируйте примитивы схемы из поддерживаемой поверхности, принадлежащей плагину |
    | `plugin-sdk/boolean-param` | Средство чтения слабо типизированного логического параметра |
    | `plugin-sdk/dangerous-name-runtime` | Вспомогательные средства разрешения сопоставлений с опасными именами |
    | `plugin-sdk/device-bootstrap` | Вспомогательные средства первоначальной настройки устройства и токенов сопряжения, включая `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Общие примитивы вспомогательных средств пассивного канала, состояния и фонового прокси |
    | `plugin-sdk/models-provider-runtime` | Вспомогательные средства ответов команд и провайдеров `/models` |
    | `plugin-sdk/skill-commands-runtime` | Вспомогательные средства вывода списка команд Skills |
    | `plugin-sdk/native-command-registry` | Вспомогательные средства реестра, построения и сериализации нативных команд |
    | `plugin-sdk/agent-harness` | Экспериментальная поверхность доверенных плагинов для низкоуровневых средств управления агентами: типы средств управления, вспомогательные средства перенаправления и прерывания активного запуска, вспомогательные средства моста инструментов OpenClaw, вспомогательные средства политики инструментов плана среды выполнения, классификация конечных результатов, вспомогательные средства форматирования и детализации хода выполнения инструментов и утилиты результатов попыток |
    | `plugin-sdk/provider-zai-endpoint` | Устаревший фасад обнаружения конечных точек, принадлежащий провайдеру Z.AI; используйте общедоступный API плагина Z.AI |
    | `plugin-sdk/async-lock-runtime` | Локальное для процесса вспомогательное средство асинхронной блокировки небольших файлов состояния среды выполнения |
    | `plugin-sdk/channel-activity-runtime` | Вспомогательное средство телеметрии активности каналов |
    | `plugin-sdk/concurrency-runtime` | Вспомогательное средство ограничения параллелизма асинхронных задач |
    | `plugin-sdk/dedupe-runtime` | Вспомогательные средства кэша устранения дубликатов в памяти и с постоянным хранилищем |
    | `plugin-sdk/delivery-queue-runtime` | Вспомогательное средство выгрузки ожидающих исходящих доставок |
    | `plugin-sdk/file-access-runtime` | Безопасные вспомогательные средства путей к локальным файлам и источникам мультимедиа |
    | `plugin-sdk/heartbeat-runtime` | Вспомогательные средства пробуждения, событий и видимости Heartbeat |
    | `plugin-sdk/expect-runtime` | Вспомогательное средство проверки обязательного значения для доказуемых инвариантов среды выполнения |
    | `plugin-sdk/number-runtime` | Вспомогательное средство числового приведения |
    | `plugin-sdk/secure-random-runtime` | Вспомогательные средства защищённых токенов и UUID |
    | `plugin-sdk/system-event-runtime` | Вспомогательные средства очереди системных событий |
    | `plugin-sdk/transport-ready-runtime` | Вспомогательное средство ожидания готовности транспорта |
    | `plugin-sdk/exec-approvals-runtime` | Вспомогательные средства файлов политики подтверждения выполнения без общего модуля экспорта среды выполнения инфраструктуры |
    | `plugin-sdk/infra-runtime` | Устаревшая прослойка совместимости; используйте специализированные подпути среды выполнения, указанные выше |
    | `plugin-sdk/collection-runtime` | Небольшие вспомогательные средства ограниченного кэша |
    | `plugin-sdk/diagnostic-runtime` | Вспомогательные средства диагностических флагов, событий и контекста трассировки |
    | `plugin-sdk/error-runtime` | Граф ошибок, форматирование, общие вспомогательные средства классификации ошибок, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Вспомогательные средства обёрнутого fetch, прокси, параметра EnvHttpProxyAgent и закреплённого поиска |
    | `plugin-sdk/runtime-fetch` | Учитывающий диспетчер fetch среды выполнения без импорта прокси и защищённого fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Вспомогательные средства очистки URL-адресов встроенных данных изображений и определения сигнатур без общей поверхности среды выполнения мультимедиа |
    | `plugin-sdk/response-limit-runtime` | Средства чтения тела ответа с ограничениями по объёму в байтах, времени бездействия и предельному сроку без общей поверхности среды выполнения мультимедиа |
    | `plugin-sdk/session-binding-runtime` | Текущее состояние привязки беседы без настроенной маршрутизации привязок или хранилищ сопряжения |
    | `plugin-sdk/context-visibility-runtime` | Разрешение видимости контекста и фильтрация дополнительного контекста без общего импорта конфигурации и средств безопасности |
    | `plugin-sdk/string-coerce-runtime` | Узкоспециализированные примитивные вспомогательные средства приведения и нормализации записей и строк без импорта Markdown и журналирования |
    | `plugin-sdk/html-entity-runtime` | Однопроходное декодирование HTML5-сущностей, завершаемых точкой с запятой, без общих текстовых утилит |
    | `plugin-sdk/text-utility-runtime` | Низкоуровневые вспомогательные средства для текста и путей, включая экранирование пяти HTML-сущностей |
    | `plugin-sdk/widget-html` | Обнаружение полного документа, проверка размера и ошибки входных данных инструмента для автономных HTML-виджетов |
    | `plugin-sdk/host-runtime` | Вспомогательные средства нормализации имён хостов и хостов SCP |
    | `plugin-sdk/retry-runtime` | Вспомогательные средства конфигурации и выполнения повторных попыток |
    | `plugin-sdk/agent-runtime` | Устаревший общий модуль экспорта для вспомогательных средств каталога, идентификации и рабочего пространства агента, включая `resolveAgentDir`, `resolveDefaultAgentDir` и устаревший экспорт совместимости `resolveOpenClawAgentDir`; предпочтительны специализированные подпути агента и среды выполнения |
    | `plugin-sdk/directory-runtime` | Запрос и устранение дубликатов каталогов на основе конфигурации |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Подпути возможностей и тестирования">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Устаревший общий модуль экспорта для мультимедиа, включающий `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` и устаревший `fetchRemoteMedia`; предпочтительно использовать `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` и подпути среды выполнения возможностей, а когда URL должен стать медиафайлом OpenClaw, перед чтением буфера предпочтительно использовать вспомогательные функции хранилища |
    | `plugin-sdk/media-mime` | Узкоспециализированные вспомогательные функции для нормализации MIME, сопоставления расширений файлов, определения MIME и определения типа мультимедиа |
    | `plugin-sdk/media-store` | Узкоспециализированные вспомогательные функции хранилища мультимедиа, такие как `saveMediaBuffer` и `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Общие вспомогательные функции переключения при сбоях генерации мультимедиа, выбора кандидатов и формирования сообщений об отсутствующей модели |
    | `plugin-sdk/media-understanding` | Типы провайдеров анализа мультимедиа, а также предназначенные для провайдеров экспорты вспомогательных функций обработки изображений, аудио и извлечения структурированных данных |
    | `plugin-sdk/text-chunking` | Разбиение исходящего текста и диапазонов с сохранением смещений, разбиение Markdown и вспомогательные функции рендеринга, токенизация HTML-тегов с учетом кавычек, преобразование таблиц Markdown, удаление тегов директив и утилиты безопасной обработки текста |
    | `plugin-sdk/speech` | Типы провайдеров речи, а также предназначенные для провайдеров экспорты директив, реестра, проверки, конструктора TTS с совместимостью с OpenAI и вспомогательных функций речи |
    | `plugin-sdk/speech-core` | Общие типы провайдеров речи, реестр, директива, нормализация и экспорты вспомогательных функций речи |
    | `plugin-sdk/realtime-transcription` | Типы провайдеров транскрибирования в реальном времени, вспомогательные функции реестра и общая вспомогательная функция сеанса WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Вспомогательная функция начальной настройки профиля реального времени для ограниченного внедрения контекста `IDENTITY.md`, `USER.md` и `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типы провайдеров голосовой связи в реальном времени, вспомогательные функции реестра и общие вспомогательные функции поведения голосовой связи в реальном времени, включая отслеживание активности вывода |
    | `plugin-sdk/image-generation` | Типы провайдеров генерации изображений, вспомогательные функции для ресурсов изображений и URL данных, а также конструктор провайдера изображений с совместимостью с OpenAI |
    | `plugin-sdk/image-generation-core` | Общие типы генерации изображений, а также вспомогательные функции переключения при сбоях, аутентификации и реестра |
    | `plugin-sdk/music-generation` | Типы провайдера, запроса и результата генерации музыки |
    | `plugin-sdk/music-generation-core` | Устаревшие общие типы генерации музыки, вспомогательные функции переключения при сбоях, поиск провайдера и разбор ссылки на модель; предпочтительно использовать поверхности музыкальных провайдеров, принадлежащие плагинам |
    | `plugin-sdk/video-generation` | Типы провайдера, запроса и результата генерации видео |
    | `plugin-sdk/video-generation-core` | Общие типы генерации видео, вспомогательные функции переключения при сбоях, поиск провайдера и разбор ссылки на модель |
    | `plugin-sdk/transcripts` | Общие типы провайдеров источников транскриптов, вспомогательные функции реестра, дескрипторы сеансов и метаданные реплик |
    | `plugin-sdk/webhook-targets` | Реестр целей Webhook и вспомогательные функции установки маршрутов |
    | `plugin-sdk/webhook-path` | Устаревший псевдоним совместимости; используйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Общие вспомогательные функции удаленной и локальной загрузки мультимедиа |
    | `plugin-sdk/zod` | Устаревший реэкспорт совместимости; импортируйте `zod` непосредственно из `zod` |
    | `plugin-sdk/plugin-test-api` | Минимальная локальная для репозитория вспомогательная функция `createTestPluginApi` для модульных тестов прямой регистрации плагинов без импорта связующих вспомогательных функций тестирования репозитория |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальные для репозитория фикстуры контрактов адаптера нативной среды выполнения агентов для тестов аутентификации, доставки, резервного поведения, перехватчиков инструментов, наложения промптов, схем и проекции транскриптов |
    | `plugin-sdk/channel-test-helpers` | Локальные для репозитория вспомогательные функции тестирования каналов для общих контрактов действий, настройки и состояния, проверок каталогов, жизненного цикла запуска учетных записей, передачи конфигурации отправки, имитаций среды выполнения, проблем состояния, исходящей доставки и регистрации перехватчиков |
    | `plugin-sdk/channel-target-testing` | Локальный для репозитория общий набор тестов ошибочных сценариев разрешения целей для тестирования каналов |
    | `plugin-sdk/channel-contract-testing` | Локальные для репозитория узкоспециализированные вспомогательные функции тестирования контрактов каналов без общего модуля экспорта для тестирования |
    | `plugin-sdk/plugin-test-contracts` | Локальные для репозитория вспомогательные функции контрактов пакета плагина, регистрации, публичных артефактов, прямого импорта, API среды выполнения и побочных эффектов импорта |
    | `plugin-sdk/plugin-state-test-runtime` | Локальные для репозитория вспомогательные функции тестирования хранилища состояния плагина, очереди входящих данных и базы данных состояния |
    | `plugin-sdk/provider-test-contracts` | Локальные для репозитория вспомогательные функции контрактов среды выполнения провайдера, аутентификации, обнаружения, первоначальной настройки, каталога, мастера, мультимедийных возможностей, политики повторного воспроизведения, распознавания речи в реальном времени из живого аудиопотока, веб-поиска и получения данных, а также потоковой передачи |
    | `plugin-sdk/provider-http-test-mocks` | Локальные для репозитория подключаемые имитации HTTP и аутентификации Vitest для тестов провайдеров, использующих `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Локальные для репозитория вспомогательные функции прикрепления метаданных к фикстурам полезной нагрузки ответов |
    | `plugin-sdk/sqlite-runtime-testing` | Локальные для репозитория вспомогательные функции жизненного цикла SQLite для тестов собственной разработки |
    | `plugin-sdk/test-fixtures` | Локальные для репозитория фикстуры общего перехвата среды выполнения CLI, контекста песочницы, средства записи навыков, сообщений агентов, системных событий, перезагрузки модулей, пути встроенного плагина, терминального текста, разбиения на части, токенов аутентификации и типизированных сценариев |
    | `plugin-sdk/test-node-mocks` | Локальные для репозитория специализированные вспомогательные функции имитации встроенных модулей Node для использования внутри фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Подпути памяти">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/memory-core` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Устаревший фасад среды выполнения индексирования и поиска в памяти; предпочтительно использовать независимые от поставщика подпути хоста памяти |
    | `plugin-sdk/memory-core-host-embedding-registry` | Облегченные вспомогательные функции реестра провайдеров векторных представлений памяти |
    | `plugin-sdk/memory-core-host-engine-foundation` | Экспорты базового движка хоста памяти |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракты векторных представлений хоста памяти, доступ к реестру, локальный провайдер и общие вспомогательные функции пакетной и удаленной обработки. `registerMemoryEmbeddingProvider` на этой поверхности устарел; для новых провайдеров используйте общий API провайдера векторных представлений. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Экспорты движка QMD хоста памяти |
    | `plugin-sdk/memory-core-host-engine-storage` | Экспорты движка хранения хоста памяти |
    | `plugin-sdk/memory-core-host-multimodal` | Устаревшие мультимодальные вспомогательные функции хоста памяти; предпочтительно использовать независимые от поставщика подпути хоста памяти |
    | `plugin-sdk/memory-core-host-query` | Устаревшие вспомогательные функции запросов хоста памяти; предпочтительно использовать независимые от поставщика подпути хоста памяти |
    | `plugin-sdk/memory-core-host-secret` | Вспомогательные функции секретов хоста памяти |
    | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Вспомогательные функции состояния хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-cli` | Вспомогательные функции среды выполнения CLI хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-core` | Вспомогательные функции основной среды выполнения хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-files` | Вспомогательные функции файлов и среды выполнения хоста памяти |
    | `plugin-sdk/memory-host-core` | Независимый от поставщика псевдоним вспомогательных функций основной среды выполнения хоста памяти |
    | `plugin-sdk/memory-host-events` | Независимый от поставщика псевдоним вспомогательных функций журнала событий хоста памяти |
    | `plugin-sdk/memory-host-files` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Общие вспомогательные функции управляемого Markdown для плагинов, связанных с памятью |
    | `plugin-sdk/memory-host-search` | Фасад среды выполнения активной памяти для доступа к диспетчеру поиска |
    | `plugin-sdk/memory-host-status` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервированные подпути встроенных вспомогательных функций">
    Зарезервированные подпути SDK встроенных вспомогательных функций — это узкие
    поверхности, относящиеся к конкретным владельцам и предназначенные для кода
    встроенных плагинов. Они учитываются в инвентаре SDK, чтобы сборки пакетов
    и создание псевдонимов оставались детерминированными, но не являются API общего
    назначения для разработки плагинов. Новые переиспользуемые контракты хоста должны использовать общие подпути SDK,
    такие как `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` и
    `plugin-sdk/plugin-config-runtime`.

    | Подпуть | Владелец и назначение |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Вспомогательная функция встроенного плагина Codex для проекции пользовательской конфигурации сервера MCP в конфигурацию потока сервера приложения Codex (зарезервированный экспорт пакета) |
    | `plugin-sdk/codex-native-task-runtime` | Вспомогательная функция встроенного плагина Codex для зеркального отображения нативных субагентов сервера приложения Codex в состояние задач OpenClaw (только локально для репозитория, не является экспортом пакета) |

  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Обзор SDK плагинов](/ru/plugins/sdk-overview)
- [Настройка SDK плагинов](/ru/plugins/sdk-setup)
- [Создание плагинов](/ru/plugins/building-plugins)
