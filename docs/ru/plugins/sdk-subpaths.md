---
read_when:
    - Выбор правильного подпути plugin-sdk для импорта Plugin
    - Аудит подпутей bundled-плагинов и вспомогательных поверхностей
summary: 'Каталог подпутей Plugin SDK: какие импорты где находятся, сгруппированные по областям'
title: Подпути SDK Plugin
x-i18n:
    generated_at: "2026-07-04T10:54:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin предоставляется как набор узких публичных подпутей в
`openclaw/plugin-sdk/`. На этой странице перечислены часто используемые подпути,
сгруппированные по назначению. Сгенерированный инвентарь точек входа компилятора находится в
`scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакета являются публичным подмножеством
после исключения локальных для репозитория тестовых/внутренних подпутей, перечисленных в
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Сопровождающие могут проверять
количество публичных экспортов с помощью `pnpm plugin-sdk:surface` и активные зарезервированные
подпути вспомогательных модулей с помощью `pnpm plugins:boundary-report:summary`; неиспользуемые
зарезервированные вспомогательные экспорты приводят к ошибке CI-отчета, а не остаются в публичном SDK как
неактивный долг совместимости.

Руководство по созданию Plugin см. в разделе [Обзор SDK Plugin](/ru/plugins/sdk-overview).

## Точка входа Plugin

| Подпуть                        | Ключевые экспорты                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Вспомогательные элементы поставщика миграций, такие как `createMigrationItem`, константы причин, маркеры статусов элементов, вспомогательные средства маскирования и `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Вспомогательные средства миграции во время выполнения, такие как `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` и `writeMigrationReport` |
| `plugin-sdk/health`            | Типы регистрации, обнаружения, исправления, выбора, уровня серьезности и результатов doctor-проверок работоспособности для комплектных потребителей состояния           |

### Устаревшая совместимость и тестовые вспомогательные средства

Устаревшие подпути остаются экспортируемыми для старых Plugin, но в новом коде следует использовать
сфокусированные подпути SDK ниже. Поддерживаемый список находится в
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI отклоняет производственные импорты комплектных
Plugin из него. Широкие агрегирующие модули, такие как `compat`, `config-types`,
`infra-runtime`, `text-runtime` и `zod`, предназначены только для совместимости. Импортируйте `zod`
напрямую из `zod`.

Подпути тестовых вспомогательных средств OpenClaw на базе Vitest являются только локальными для репозитория и больше
не являются экспортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` и `testing`.

### Зарезервированные подпути вспомогательных средств комплектных Plugin

Эти подпути являются принадлежащими Plugin поверхностями совместимости для соответствующих комплектных
Plugin, а не общими API SDK: `plugin-sdk/codex-mcp-projection` и
`plugin-sdk/codex-native-task-runtime`. Импорты расширений между владельцами блокируются
ограничениями контракта пакета.

<AccordionGroup>
  <Accordion title="Подпути каналов">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Экспорт корневой схемы Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Вспомогательная функция кэшированной валидации JSON Schema для схем, принадлежащих Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, плюс `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Общие вспомогательные функции мастера настройки, транслятор настройки, запросы списка разрешений, построители статуса настройки |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Устаревший совместимый псевдоним; используйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Вспомогательные функции конфигурации нескольких аккаунтов и шлюза действий, вспомогательные функции резервного перехода на аккаунт по умолчанию |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, вспомогательные функции нормализации идентификатора аккаунта |
    | `plugin-sdk/account-resolution` | Вспомогательные функции поиска аккаунта и резервного перехода на значение по умолчанию |
    | `plugin-sdk/account-helpers` | Узкие вспомогательные функции для списков аккаунтов и действий аккаунта |
    | `plugin-sdk/access-groups` | Вспомогательные функции разбора списков разрешений групп доступа и редактированной диагностики групп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Общие примитивы схемы конфигурации канала, а также построители Zod и прямые построители JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схемы конфигурации встроенных каналов OpenClaw только для поддерживаемых встроенных Plugin |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонические идентификаторы встроенных/официальных чат-каналов, а также метки форматтера и псевдонимы для Plugin, которым нужно распознавать текст с префиксом конверта без жестко заданной собственной таблицы. |
    | `plugin-sdk/channel-config-schema-legacy` | Устаревший совместимый псевдоним для схем конфигурации встроенных каналов |
    | `plugin-sdk/telegram-command-config` | Вспомогательные функции нормализации и валидации пользовательских команд Telegram с резервным переходом на встроенный контракт |
    | `plugin-sdk/command-gating` | Узкие вспомогательные функции шлюза авторизации команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Устаревший низкоуровневый фасад совместимости входа канала. Новые пути приема должны использовать `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Экспериментальный высокоуровневый runtime-резолвер входа канала и построители фактов маршрута для мигрированных путей приема канала. Предпочитайте его сборке эффективных списков разрешений, списков разрешенных команд и устаревших проекций в каждом Plugin. См. [API входа канала](/ru/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракты жизненного цикла сообщений, а также параметры reply pipeline, подтверждения, live preview/streaming, вспомогательные функции жизненного цикла, исходящая идентичность, планирование payload, надежные отправки и вспомогательные функции контекста отправки сообщений. См. [API исходящего канала](/ru/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Устаревший совместимый псевдоним для `plugin-sdk/channel-outbound` плюс устаревшие фасады dispatch ответов. |
    | `plugin-sdk/channel-message-runtime` | Устаревший совместимый псевдоним для `plugin-sdk/channel-outbound` плюс устаревшие фасады dispatch ответов. |
    | `plugin-sdk/inbound-envelope` | Общие вспомогательные функции построения входящего маршрута и конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-inbound` для входящих runners и предикатов dispatch, а `plugin-sdk/channel-outbound` для вспомогательных функций доставки сообщений. |
    | `plugin-sdk/messaging-targets` | Устаревший псевдоним разбора целей; используйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Общие вспомогательные функции загрузки исходящих медиа и состояния размещенных медиа |
    | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Узкие вспомогательные функции нормализации опросов |
    | `plugin-sdk/thread-bindings-runtime` | Вспомогательные функции жизненного цикла привязок потоков и адаптеров |
    | `plugin-sdk/agent-media-payload` | Устаревший построитель payload медиа агента |
    | `plugin-sdk/conversation-runtime` | Вспомогательные функции привязки бесед/потоков, связывания и настроенной привязки |
    | `plugin-sdk/runtime-config-snapshot` | Вспомогательная функция снимка конфигурации runtime |
    | `plugin-sdk/runtime-group-policy` | Вспомогательные функции разрешения групповой политики runtime |
    | `plugin-sdk/channel-status` | Общие вспомогательные функции снимка и сводки статуса канала |
    | `plugin-sdk/channel-config-primitives` | Узкие примитивы схемы конфигурации канала |
    | `plugin-sdk/channel-config-writes` | Вспомогательные функции авторизации записи конфигурации канала |
    | `plugin-sdk/channel-plugin-common` | Общие экспорты prelude для Plugin канала |
    | `plugin-sdk/allowlist-config-edit` | Вспомогательные функции редактирования и чтения конфигурации списка разрешений |
    | `plugin-sdk/group-access` | Общие вспомогательные функции принятия решений о доступе групп |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Узкие вспомогательные функции политики защитной проверки direct-DM перед шифрованием |
    | `plugin-sdk/discord` | Устаревший фасад совместимости Discord для опубликованного `@openclaw/discord@2026.3.13` и отслеживаемой совместимости владельца; новые Plugin должны использовать общие подпути SDK каналов |
    | `plugin-sdk/telegram-account` | Устаревший фасад совместимости разрешения аккаунтов Telegram для отслеживаемой совместимости владельца; новые Plugin должны использовать внедренные вспомогательные функции runtime или общие подпути SDK каналов |
    | `plugin-sdk/zalouser` | Устаревший фасад совместимости Zalo Personal для опубликованных пакетов Lark/Zalo, которые все еще импортируют авторизацию команд отправителя; новые Plugin должны использовать `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантическое представление сообщений, доставка и устаревшие вспомогательные функции интерактивных ответов. См. [Представление сообщений](/ru/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Общие вспомогательные функции для классификации событий, построения контекста, форматирования, корней, debounce, сопоставления упоминаний, политики упоминаний и входящего логирования |
    | `plugin-sdk/channel-inbound-debounce` | Узкие вспомогательные функции входящего debounce |
    | `plugin-sdk/channel-mention-gating` | Узкие вспомогательные функции политики упоминаний, маркера упоминания и текста упоминания без более широкой поверхности входящего runtime |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound` или `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типы результата ответа |
    | `plugin-sdk/channel-actions` | Вспомогательные функции действий сообщений канала, а также устаревшие вспомогательные функции нативной схемы, сохраненные для совместимости Plugin |
    | `plugin-sdk/channel-route` | Общая нормализация маршрутов, управляемое парсером разрешение целей, строковое представление идентификаторов потоков, дедупликация/компактные ключи маршрутов, типы разобранных целей и вспомогательные функции сравнения маршрутов/целей |
    | `plugin-sdk/channel-targets` | Вспомогательные функции разбора целей; вызывающий код сравнения маршрутов должен использовать `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типы контрактов каналов |
    | `plugin-sdk/channel-feedback` | Связка feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Узкие вспомогательные функции secret-contract, такие как `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, и типы secret-целей |
  </Accordion>

Устаревшие семейства вспомогательных функций каналов остаются доступными только для
совместимости опубликованных Plugin. План удаления: сохранить их на время окна
миграции внешних Plugin, держать Plugin из репозитория и встроенные Plugin на
`channel-inbound` и `channel-outbound`, затем удалить совместимые подпути при
следующей крупной очистке SDK. Это относится к старым семействам channel
message/runtime, channel streaming, direct-DM access, раздробленным входящим
вспомогательным функциям, reply-options и pairing-path.

  <Accordion title="Подпути поставщиков">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Поддерживаемый фасад поставщика LM Studio для настройки, обнаружения каталога и подготовки модели во время выполнения |
    | `plugin-sdk/lmstudio-runtime` | Поддерживаемый фасад времени выполнения LM Studio для локальных настроек сервера по умолчанию, обнаружения моделей, заголовков запросов и вспомогательных средств для загруженных моделей |
    | `plugin-sdk/provider-setup` | Отобранные вспомогательные средства настройки локальных и самостоятельно размещенных поставщиков |
    | `plugin-sdk/self-hosted-provider-setup` | Специализированные вспомогательные средства настройки самостоятельно размещенных поставщиков, совместимых с OpenAI |
    | `plugin-sdk/cli-backend` | Настройки серверной части CLI по умолчанию + константы сторожевого процесса |
    | `plugin-sdk/provider-auth-runtime` | Вспомогательные средства разрешения API-ключей во время выполнения для плагинов поставщиков |
    | `plugin-sdk/provider-oauth-runtime` | Универсальные типы обратных вызовов OAuth поставщика, отрисовка страницы обратного вызова, вспомогательные средства PKCE/состояния, разбор входных данных авторизации, вспомогательные средства срока действия токенов и вспомогательные средства прерывания |
    | `plugin-sdk/provider-auth-api-key` | Вспомогательные средства первичной настройки API-ключей и записи профиля, например `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартный построитель результата авторизации OAuth |
    | `plugin-sdk/provider-env-vars` | Вспомогательные средства поиска переменных окружения авторизации поставщика |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, вспомогательные средства импорта авторизации OpenAI Codex, устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители политик повторного воспроизведения, вспомогательные средства конечных точек поставщика и общие вспомогательные средства нормализации идентификаторов моделей |
    | `plugin-sdk/provider-catalog-live-runtime` | Вспомогательные средства живого каталога моделей поставщика для защищенного обнаружения в стиле `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фильтрация идентификаторов моделей, кэш TTL и статический резервный вариант |
    | `plugin-sdk/provider-catalog-runtime` | Хук времени выполнения для расширения каталога поставщика и стыки реестра плагинов поставщиков для контрактных тестов |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Универсальные вспомогательные средства возможностей HTTP/конечных точек поставщика, ошибки HTTP поставщика и вспомогательные средства multipart-форм для расшифровки аудио |
    | `plugin-sdk/provider-web-fetch-contract` | Узкие вспомогательные средства контракта конфигурации/выбора веб-загрузки, например `enablePluginInConfig` и `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Вспомогательные средства регистрации/кэша поставщика веб-загрузки |
    | `plugin-sdk/provider-web-search-config-contract` | Узкие вспомогательные средства конфигурации/учетных данных веб-поиска для поставщиков, которым не нужна связка включения Plugin |
    | `plugin-sdk/provider-web-search-contract` | Узкие вспомогательные средства контракта конфигурации/учетных данных веб-поиска, например `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а также ограниченные по области сеттеры/геттеры учетных данных |
    | `plugin-sdk/provider-web-search` | Вспомогательные средства регистрации/кэша/времени выполнения поставщика веб-поиска |
    | `plugin-sdk/embedding-providers` | Общие типы поставщиков эмбеддингов и вспомогательные средства чтения, включая `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` и `listEmbeddingProviders(...)`; плагины регистрируют поставщиков через `api.registerEmbeddingProvider(...)`, чтобы соблюдалось владение манифестом |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` и очистка схем + диагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типы снимков использования поставщика, общие вспомогательные средства получения использования и средства получения поставщика, например `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы оберток потоков, совместимость вызовов инструментов в простом тексте и общие вспомогательные средства оберток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публичные общие вспомогательные средства оберток потоков поставщика, включая `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` и утилиты потоков, совместимые с Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Вспомогательные средства собственного транспорта поставщика, например защищенная выборка, извлечение текста результата инструмента, преобразования транспортных сообщений и записываемые потоки транспортных событий |
    | `plugin-sdk/provider-onboard` | Вспомогательные средства исправления конфигурации первичной настройки |
    | `plugin-sdk/global-singleton` | Вспомогательные средства локальных для процесса синглтонов/карт/кэшей |
    | `plugin-sdk/group-activation` | Узкие вспомогательные средства режима активации групп и разбора команд |
  </Accordion>

Снимки использования поставщика обычно сообщают об одном или нескольких квотных `windows`, каждое из которых содержит
метку, процент использования и необязательное время сброса. Поставщики, которые предоставляют текст баланса или
состояния учетной записи вместо сбрасываемых квотных окон, должны возвращать
`summary` с пустым массивом `windows`, а не фабриковать проценты.
OpenClaw отображает этот сводный текст в выводе состояния; используйте `error` только когда
конечная точка использования завершилась с ошибкой или не вернула пригодных данных об использовании.

  <Accordion title="Подпути авторизации и безопасности">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, вспомогательные средства реестра команд, включая форматирование динамического меню аргументов, вспомогательные средства авторизации отправителя |
    | `plugin-sdk/command-status` | Построители сообщений команд/справки, например `buildCommandsMessagePaginated` и `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Вспомогательные средства разрешения утверждающего и авторизации действий в том же чате |
    | `plugin-sdk/approval-client-runtime` | Вспомогательные средства собственных профилей/фильтров утверждения выполнения |
    | `plugin-sdk/approval-delivery-runtime` | Собственные адаптеры возможностей/доставки утверждений |
    | `plugin-sdk/approval-gateway-runtime` | Общий вспомогательный инструмент разрешения Gateway утверждений |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковесные вспомогательные средства загрузки собственного адаптера утверждений для горячих точек входа каналов |
    | `plugin-sdk/approval-handler-runtime` | Более широкие вспомогательные средства времени выполнения обработчика утверждений; предпочитайте более узкие стыки адаптера/Gateway, когда их достаточно |
    | `plugin-sdk/approval-native-runtime` | Вспомогательные средства собственной цели утверждения, привязки учетной записи, шлюза маршрутов, резервной пересылки и подавления локальной собственной подсказки выполнения |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки реакций утверждения, полезные нагрузки подсказок реакций, хранилища целей реакций, вспомогательные средства текста подсказок реакций и экспорт совместимости для подавления локальной собственной подсказки выполнения |
    | `plugin-sdk/approval-reply-runtime` | Вспомогательные средства полезной нагрузки ответа на утверждение выполнения/Plugin |
    | `plugin-sdk/approval-runtime` | Вспомогательные средства полезной нагрузки утверждения выполнения/Plugin, собственные вспомогательные средства маршрутизации/времени выполнения утверждений и вспомогательные средства структурированного отображения утверждений, например `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Узкие вспомогательные средства сброса дедупликации входящих ответов |
    | `plugin-sdk/channel-contract-testing` | Узкие вспомогательные средства контрактных тестов каналов без широкого тестового барреля |
    | `plugin-sdk/command-auth-native` | Собственная авторизация команд, форматирование динамического меню аргументов и собственные вспомогательные средства цели сеанса |
    | `plugin-sdk/command-detection` | Общие вспомогательные средства обнаружения команд |
    | `plugin-sdk/command-primitives-runtime` | Легковесные предикаты текста команд для горячих путей каналов |
    | `plugin-sdk/command-surface` | Нормализация тела команды и вспомогательные средства поверхности команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Ленивые вспомогательные средства потока входа авторизации поставщика для приватного канала и сопряжения кода устройства веб-интерфейса |
    | `plugin-sdk/channel-secret-runtime` | Узкие вспомогательные средства сбора контрактов секретов для поверхностей секретов каналов/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Узкие вспомогательные средства `coerceSecretRef` и типизации SecretRef для разбора контракта секретов/конфигурации |
    | `plugin-sdk/secret-provider-integration` | Только типовой манифест интеграции поставщика SecretRef и контракты пресетов для плагинов, которые публикуют внешние пресеты поставщиков секретов |
    | `plugin-sdk/security-runtime` | Общие вспомогательные средства доверия, ограничения личных сообщений, ограниченных корнем файлов/путей, включая записи только при создании, синхронную/асинхронную атомарную замену файлов, записи во временные файлы рядом, резервное перемещение между устройствами, вспомогательные средства приватного файлового хранилища, защиты родительских символических ссылок, внешний контент, редактирование чувствительного текста, сравнение секретов за постоянное время и вспомогательные средства сбора секретов |
    | `plugin-sdk/ssrf-policy` | Вспомогательные средства списка разрешенных хостов и политики SSRF для приватных сетей |
    | `plugin-sdk/ssrf-dispatcher` | Узкие вспомогательные средства закрепленного диспетчера без широкой инфраструктурной поверхности времени выполнения |
    | `plugin-sdk/ssrf-runtime` | Закрепленный диспетчер, защищенная от SSRF выборка, ошибка SSRF и вспомогательные средства политики SSRF |
    | `plugin-sdk/secret-input` | Вспомогательные средства разбора ввода секретов |
    | `plugin-sdk/webhook-ingress` | Вспомогательные средства запроса/цели Webhook и приведение необработанного websocket/тела |
    | `plugin-sdk/webhook-request-guards` | Вспомогательные средства размера/тайм-аута тела запроса |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкие вспомогательные средства для среды выполнения, журналирования, резервного копирования и установки plugin |
    | `plugin-sdk/runtime-env` | Узкие вспомогательные средства для env среды выполнения, logger, timeout, retry и backoff |
    | `plugin-sdk/browser-config` | Поддерживаемый фасад конфигурации браузера для нормализованного профиля/значений по умолчанию, разбора CDP URL и вспомогательных средств аутентификации управления браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Универсальные вспомогательные средства жизненного цикла задач и доставки завершения для агентов на базе harness, использующих область задачи, выданную хостом |
    | `plugin-sdk/codex-mcp-projection` | Зарезервированное вспомогательное средство встроенного Codex для проецирования пользовательской конфигурации MCP-сервера в конфигурацию потока Codex; не для сторонних plugins |
    | `plugin-sdk/codex-native-task-runtime` | Приватное вспомогательное средство встроенного Codex для зеркала native task и wiring среды выполнения; не для сторонних plugins |
    | `plugin-sdk/channel-runtime-context` | Универсальные вспомогательные средства регистрации и поиска runtime-context канала |
    | `plugin-sdk/matrix` | Устаревший фасад совместимости Matrix для старых сторонних пакетов каналов; новые plugins должны импортировать `plugin-sdk/run-command` напрямую |
    | `plugin-sdk/mattermost` | Устаревший фасад совместимости Mattermost для старых сторонних пакетов каналов; новые plugins должны импортировать универсальные подпути SDK напрямую |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Общие вспомогательные средства команд, хуков, HTTP и интерактивных возможностей plugin |
    | `plugin-sdk/hook-runtime` | Общие вспомогательные средства конвейера webhook/внутренних хуков |
    | `plugin-sdk/lazy-runtime` | Вспомогательные средства ленивого импорта/привязки среды выполнения, такие как `createLazyRuntimeModule`, `createLazyRuntimeMethod` и `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Вспомогательные средства exec процессов |
    | `plugin-sdk/cli-runtime` | Вспомогательные средства форматирования CLI, ожидания, версии, вызова с аргументами и ленивых групп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Общие идентификаторы сценариев QA live-транспорта, вспомогательные средства базового покрытия и выбора сценариев |
    | `plugin-sdk/gateway-method-runtime` | Зарезервированное вспомогательное средство диспетчеризации методов Gateway для HTTP-маршрутов plugin, объявляющих `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клиент Gateway, вспомогательное средство запуска клиента, готового к циклу событий, RPC Gateway CLI, ошибки протокола Gateway, разрешение объявленного LAN-хоста и вспомогательные средства patch статуса канала |
    | `plugin-sdk/config-contracts` | Сфокусированная поверхность конфигурации только типов для форм конфигурации plugin, таких как `OpenClawConfig`, и типов конфигурации каналов/провайдеров |
    | `plugin-sdk/plugin-config-runtime` | Вспомогательные средства поиска runtime plugin-config, такие как `requireRuntimeConfig`, `resolvePluginConfigObject` и `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Вспомогательные средства транзакционного изменения конфигурации, такие как `mutateConfigFile`, `replaceConfigFile` и `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Общие строки подсказок метаданных доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Вспомогательные средства снимка конфигурации текущего процесса, такие как `getRuntimeConfig`, `getRuntimeConfigSnapshot`, и сеттеры тестовых снимков |
    | `plugin-sdk/telegram-command-config` | Нормализация имен/описаний команд Telegram и проверки дубликатов/конфликтов, даже когда поверхность встроенного контракта Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Обнаружение autolink ссылок на файлы без широкого text barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки реакций подтверждения, payload запросов реакций, хранилища целей реакций, вспомогательные средства текста подсказок реакций и экспорт совместимости для подавления локального native exec prompt |
    | `plugin-sdk/approval-runtime` | Вспомогательные средства подтверждения exec/plugin, построители approval-capability, вспомогательные средства auth/profile, native routing/runtime и форматирование пути структурированного отображения подтверждения |
    | `plugin-sdk/reply-runtime` | Общие вспомогательные средства входящей/ответной среды выполнения, разбиение на фрагменты, dispatch, heartbeat, планировщик ответов |
    | `plugin-sdk/reply-dispatch-runtime` | Узкие вспомогательные средства dispatch/finalize ответов и меток бесед |
    | `plugin-sdk/reply-history` | Общие вспомогательные средства истории ответов в коротком окне. Новый код message-turn должен использовать `createChannelHistoryWindow`; низкоуровневые map helpers остаются только устаревшими экспортами совместимости |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Узкие вспомогательные средства разбиения текста/Markdown на фрагменты |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства workflow сессий (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ограниченное чтение текста недавних транскриптов пользователя/ассистента по идентичности сессии, вспомогательные средства пути устаревшего хранилища сессий/ключа сессии, чтение updated-at и вспомогательные средства совместимости только на переходный период для всего хранилища/пути файла |
    | `plugin-sdk/session-transcript-runtime` | Идентичность транскрипта, вспомогательные средства scoped target/read/write, публикация обновлений, блокировки записи и ключи попаданий памяти транскрипта |
    | `plugin-sdk/sqlite-runtime` | Сфокусированные вспомогательные средства схемы агента SQLite, путей и транзакций для first-party среды выполнения |
    | `plugin-sdk/cron-store-runtime` | Вспомогательные средства пути/загрузки/сохранения хранилища Cron |
    | `plugin-sdk/state-paths` | Вспомогательные средства путей каталогов state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типы keyed-state SQLite sidecar plugin, а также централизованная настройка connection pragma и обслуживания WAL для баз данных, принадлежащих plugin |
    | `plugin-sdk/routing` | Вспомогательные средства привязки маршрута/ключа сессии/аккаунта, такие как `resolveAgentRoute`, `buildAgentSessionKey` и `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Общие вспомогательные средства сводки статуса канала/аккаунта, значения по умолчанию runtime-state и вспомогательные средства метаданных issue |
    | `plugin-sdk/target-resolver-runtime` | Общие вспомогательные средства разрешения целей |
    | `plugin-sdk/string-normalization-runtime` | Вспомогательные средства нормализации slug/строк |
    | `plugin-sdk/request-url` | Извлечение строковых URL из входных данных, похожих на fetch/request |
    | `plugin-sdk/run-command` | Исполнитель команд с тайм-аутом и нормализованными результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Общие считыватели параметров tool/CLI |
    | `plugin-sdk/tool-plugin` | Определение простого типизированного plugin agent-tool и предоставление статических метаданных для генерации manifest |
    | `plugin-sdk/tool-payload` | Извлечение нормализованных payload из объектов результата tool |
    | `plugin-sdk/tool-send` | Извлечение канонических полей цели отправки из аргументов tool |
    | `plugin-sdk/sandbox` | Типы backend песочницы и вспомогательные средства команд SSH/OpenShell, включая preflight команды exec с быстрым отказом |
    | `plugin-sdk/temp-path` | Общие вспомогательные средства путей temp-download и приватные secure temp workspaces |
    | `plugin-sdk/logging-core` | Logger подсистем и вспомогательные средства редактирования |
    | `plugin-sdk/markdown-table-runtime` | Режим таблиц Markdown и вспомогательные средства преобразования |
    | `plugin-sdk/model-session-runtime` | Вспомогательные средства переопределения модели/сессии, такие как `applyModelOverrideToSessionEntry` и `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Вспомогательные средства разрешения конфигурации talk provider |
    | `plugin-sdk/json-store` | Малые вспомогательные средства чтения/записи JSON-состояния |
    | `plugin-sdk/json-unsafe-integers` | Вспомогательные средства разбора JSON, сохраняющие небезопасные целочисленные литералы как строки |
    | `plugin-sdk/file-lock` | Вспомогательные средства реентерабельных файловых блокировок |
    | `plugin-sdk/persistent-dedupe` | Вспомогательные средства dedupe-кэша на диске |
    | `plugin-sdk/acp-runtime` | Вспомогательные средства среды выполнения/сессии ACP и dispatch ответов |
    | `plugin-sdk/acp-runtime-backend` | Легковесные вспомогательные средства регистрации backend ACP и dispatch ответов для plugins, загружаемых при запуске |
    | `plugin-sdk/acp-binding-resolve-runtime` | Разрешение привязки ACP только для чтения без импортов запуска жизненного цикла |
    | `plugin-sdk/agent-config-primitives` | Узкие примитивы config-schema среды выполнения агента |
    | `plugin-sdk/boolean-param` | Свободный считыватель boolean-параметров |
    | `plugin-sdk/dangerous-name-runtime` | Вспомогательные средства разрешения сопоставления опасных имен |
    | `plugin-sdk/device-bootstrap` | Вспомогательные средства начальной загрузки устройства и токена сопряжения |
    | `plugin-sdk/extension-shared` | Общие примитивы вспомогательных средств passive-channel, статуса и ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Вспомогательные средства ответов команд/провайдеров `/models` |
    | `plugin-sdk/skill-commands-runtime` | Вспомогательные средства перечисления команд Skill |
    | `plugin-sdk/native-command-registry` | Вспомогательные средства реестра/сборки/сериализации native command |
    | `plugin-sdk/agent-harness` | Экспериментальная поверхность trusted-plugin для низкоуровневых agent harnesses: типы harness, вспомогательные средства steer/abort активного запуска, вспомогательные средства OpenClaw tool bridge, вспомогательные средства политики tool runtime-plan, классификация terminal outcome, вспомогательные средства форматирования/деталей прогресса tool и утилиты результата попытки |
    | `plugin-sdk/provider-zai-endpoint` | Устаревший фасад обнаружения endpoint, принадлежащий провайдеру Z.AI; используйте публичный API plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Локальный для процесса вспомогательный async lock для малых файлов состояния среды выполнения |
    | `plugin-sdk/channel-activity-runtime` | Вспомогательное средство телеметрии активности канала |
    | `plugin-sdk/concurrency-runtime` | Вспомогательное средство ограниченной конкурентности async-задач |
    | `plugin-sdk/dedupe-runtime` | Вспомогательные средства dedupe-кэша в памяти и с постоянным хранилищем |
    | `plugin-sdk/delivery-queue-runtime` | Вспомогательное средство drain ожидающей исходящей доставки |
    | `plugin-sdk/file-access-runtime` | Вспомогательные средства путей безопасных локальных файлов и источников медиа |
    | `plugin-sdk/heartbeat-runtime` | Вспомогательные средства wake, event и visibility для Heartbeat |
    | `plugin-sdk/number-runtime` | Вспомогательное средство числового приведения |
    | `plugin-sdk/secure-random-runtime` | Вспомогательные средства безопасных токенов/UUID |
    | `plugin-sdk/system-event-runtime` | Вспомогательные средства очереди системных событий |
    | `plugin-sdk/transport-ready-runtime` | Вспомогательное средство ожидания готовности транспорта |
    | `plugin-sdk/exec-approvals-runtime` | Вспомогательные средства файлов политики подтверждения exec без широкого infra-runtime barrel |
    | `plugin-sdk/infra-runtime` | Устаревший shim совместимости; используйте сфокусированные подпути runtime выше |
    | `plugin-sdk/collection-runtime` | Малые вспомогательные средства ограниченного кэша |
    | `plugin-sdk/diagnostic-runtime` | Вспомогательные средства диагностического флага, события и trace-context |
    | `plugin-sdk/error-runtime` | Граф ошибок, форматирование, общие вспомогательные средства классификации ошибок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обернутый fetch, proxy, опция EnvHttpProxyAgent и вспомогательные средства закрепленного lookup |
    | `plugin-sdk/runtime-fetch` | Осведомленный о dispatcher runtime fetch без импортов proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer URL встроенных данных изображения и вспомогательные средства sniffing сигнатуры без широкой поверхности media runtime |
    | `plugin-sdk/response-limit-runtime` | Ограниченный reader тела ответа без широкой поверхности media runtime |
    | `plugin-sdk/session-binding-runtime` | Текущее состояние привязки беседы без маршрутизации настроенных привязок или хранилищ pairing |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства session-store без широких импортов записи/обслуживания конфигурации |
    | `plugin-sdk/sqlite-runtime` | Сфокусированные вспомогательные средства схемы агента SQLite, путей и транзакций без управления жизненным циклом базы данных |
    | `plugin-sdk/context-visibility-runtime` | Разрешение видимости контекста и фильтрация дополнительного контекста без широких импортов config/security |
    | `plugin-sdk/string-coerce-runtime` | Узкие вспомогательные средства приведения и нормализации примитивных record/string без импортов markdown/logging |
    | `plugin-sdk/host-runtime` | Вспомогательные средства нормализации hostname и SCP host |
    | `plugin-sdk/retry-runtime` | Вспомогательные средства конфигурации retry и runner retry |
    | `plugin-sdk/agent-runtime` | Вспомогательные средства каталога агента/идентичности/workspace, включая `resolveAgentDir`, `resolveDefaultAgentDir` и устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запрос/дедупликация каталогов на базе конфигурации |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Подпути возможностей и тестирования">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Общие помощники для получения, преобразования и сохранения медиа, включая `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` и устаревший `fetchRemoteMedia`; предпочитайте помощники хранилища перед чтением буфера, когда URL должен стать медиа OpenClaw |
    | `plugin-sdk/media-mime` | Узкая нормализация MIME, сопоставление расширений файлов, определение MIME и помощники для типов медиа |
    | `plugin-sdk/media-store` | Узкие помощники хранилища медиа, такие как `saveMediaBuffer` и `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Общие помощники аварийного переключения генерации медиа, выбор кандидатов и сообщения об отсутствующей модели |
    | `plugin-sdk/media-understanding` | Типы провайдеров понимания медиа, а также экспорты помощников для изображений, аудио и структурированного извлечения, предназначенные для провайдеров |
    | `plugin-sdk/text-chunking` | Помощники разбиения и рендеринга текста и Markdown, преобразование таблиц Markdown, удаление тегов директив и утилиты безопасного текста |
    | `plugin-sdk/text-chunking` | Помощник разбиения исходящего текста |
    | `plugin-sdk/speech` | Типы речевых провайдеров, а также экспорты директив, реестра, валидации, OpenAI-совместимого конструктора TTS и речевых помощников, предназначенные для провайдеров |
    | `plugin-sdk/speech-core` | Общие типы речевых провайдеров, реестр, директивы, нормализация и экспорты речевых помощников |
    | `plugin-sdk/realtime-transcription` | Типы провайдеров транскрипции в реальном времени, помощники реестра и общий помощник WebSocket-сессии |
    | `plugin-sdk/realtime-bootstrap-context` | Помощник начальной загрузки профиля реального времени для ограниченного внедрения контекста `IDENTITY.md`, `USER.md` и `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типы провайдеров голоса в реальном времени, помощники реестра и общие помощники поведения голоса в реальном времени, включая отслеживание активности вывода |
    | `plugin-sdk/image-generation` | Типы провайдеров генерации изображений, а также помощники для ресурсов изображений/data URL и OpenAI-совместимый конструктор провайдера изображений |
    | `plugin-sdk/image-generation-core` | Общие типы генерации изображений, аварийное переключение, аутентификация и помощники реестра |
    | `plugin-sdk/music-generation` | Типы провайдера, запроса и результата генерации музыки |
    | `plugin-sdk/music-generation-core` | Общие типы генерации музыки, помощники аварийного переключения, поиск провайдера и разбор model-ref |
    | `plugin-sdk/video-generation` | Типы провайдера, запроса и результата генерации видео |
    | `plugin-sdk/video-generation-core` | Общие типы генерации видео, помощники аварийного переключения, поиск провайдера и разбор model-ref |
    | `plugin-sdk/transcripts` | Общие типы провайдеров источников стенограмм, помощники реестра, дескрипторы сессий и метаданные высказываний |
    | `plugin-sdk/webhook-targets` | Реестр целей Webhook и помощники установки маршрутов |
    | `plugin-sdk/webhook-path` | Устаревший псевдоним совместимости; используйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Общие помощники загрузки удаленных/локальных медиа |
    | `plugin-sdk/zod` | Устаревший реэкспорт совместимости; импортируйте `zod` напрямую из `zod` |
    | `plugin-sdk/testing` | Локальный для репозитория устаревший barrel совместимости для legacy-тестов OpenClaw. Новые тесты репозитория должны вместо этого импортировать сфокусированные локальные тестовые подпути, такие как `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` или `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальный для репозитория минимальный помощник `createTestPluginApi` для unit-тестов прямой регистрации Plugin без импорта мостов тестовых помощников репозитория |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальные для репозитория фикстуры контрактов нативного адаптера agent-runtime для тестов аутентификации, доставки, fallback, tool-hook, prompt-overlay, схемы и проекции стенограммы |
    | `plugin-sdk/channel-test-helpers` | Локальные для репозитория тестовые помощники, ориентированные на каналы, для контрактов общих действий/настройки/статуса, проверок каталогов, жизненного цикла запуска аккаунта, передачи send-config, моков runtime, проблем статуса, исходящей доставки и регистрации хуков |
    | `plugin-sdk/channel-target-testing` | Локальный для репозитория общий набор кейсов ошибок разрешения целей для тестов каналов |
    | `plugin-sdk/plugin-test-contracts` | Локальные для репозитория помощники контрактов пакета Plugin, регистрации, публичного артефакта, прямого импорта, runtime API и побочных эффектов импорта |
    | `plugin-sdk/provider-test-contracts` | Локальные для репозитория помощники контрактов runtime провайдера, аутентификации, discovery, onboard, каталога, мастера, возможностей медиа, политики replay, realtime STT live-audio, web-search/fetch и stream |
    | `plugin-sdk/provider-http-test-mocks` | Локальные для репозитория opt-in HTTP/auth моки Vitest для тестов провайдеров, которые проверяют `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Локальные для репозитория универсальные фикстуры захвата CLI runtime, контекста песочницы, writer для Skills, agent-message, system-event, перезагрузки модуля, пути bundled plugin, terminal-text, разбиения, auth-token и типизированных кейсов |
    | `plugin-sdk/test-node-mocks` | Локальные для репозитория сфокусированные помощники моков встроенных модулей Node для использования внутри фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Подпути памяти">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхность bundled memory-core помощников для помощников менеджера/конфигурации/файлов/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime индекса/поиска памяти |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легковесные помощники реестра провайдеров эмбеддингов памяти |
    | `plugin-sdk/memory-core-host-engine-foundation` | Экспорты foundation engine хоста памяти |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракты эмбеддингов хоста памяти, доступ к реестру, локальный провайдер и универсальные batch/remote помощники. `registerMemoryEmbeddingProvider` на этой поверхности устарел; используйте общий API провайдера эмбеддингов для новых провайдеров. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Экспорты QMD engine хоста памяти |
    | `plugin-sdk/memory-core-host-engine-storage` | Экспорты storage engine хоста памяти |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные помощники хоста памяти |
    | `plugin-sdk/memory-core-host-query` | Помощники запросов хоста памяти |
    | `plugin-sdk/memory-core-host-secret` | Помощники secret хоста памяти |
    | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Помощники статуса хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помощники CLI runtime хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-core` | Помощники core runtime хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-files` | Помощники файлов/runtime хоста памяти |
    | `plugin-sdk/memory-host-core` | Нейтральный к поставщику псевдоним для помощников core runtime хоста памяти |
    | `plugin-sdk/memory-host-events` | Нейтральный к поставщику псевдоним для помощников журнала событий хоста памяти |
    | `plugin-sdk/memory-host-files` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Общие помощники managed-markdown для Plugins, смежных с памятью |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступа к search-manager |
    | `plugin-sdk/memory-host-status` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервированные подпути bundled-helper">
    Зарезервированные подпути SDK bundled-helper — это узкие поверхности, специфичные для владельца, для
    кода bundled plugin. Они отслеживаются в инвентаре SDK, чтобы сборки
    пакетов и алиасы оставались детерминированными, но они не являются общими API
    для авторинга Plugin. Новые переиспользуемые контракты хоста должны использовать общие подпути SDK,
    такие как `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
    `plugin-sdk/plugin-config-runtime`.

    | Подпуть | Владелец и назначение |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Помощник bundled Codex plugin для проецирования пользовательской конфигурации MCP-сервера в конфигурацию потока app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Помощник bundled Codex plugin для зеркалирования нативных subagents app-server Codex в состояние задач OpenClaw |

  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Обзор Plugin SDK](/ru/plugins/sdk-overview)
- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание Plugins](/ru/plugins/building-plugins)
