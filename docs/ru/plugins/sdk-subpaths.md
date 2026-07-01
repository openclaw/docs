---
read_when:
    - Выбор правильного подпути plugin-sdk для импорта Plugin
    - Аудит подпутей встроенных Plugin и вспомогательных поверхностей
summary: 'Каталог подпутей Plugin SDK: какие импорты где находятся, сгруппировано по областям'
title: Подпути Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:17:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK плагинов предоставляется как набор узких публичных подпутей в
`openclaw/plugin-sdk/`. На этой странице перечислены часто используемые подпути,
сгруппированные по назначению. Сгенерированный инвентарь точек входа компилятора
находится в `scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакета — это
публичное подмножество после вычитания локальных для репозитория тестовых и
внутренних подпутей, перечисленных в
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Сопровождающие могут
проверить количество публичных экспортов с помощью `pnpm plugin-sdk:surface` и
активные зарезервированные подпути вспомогательных модулей с помощью
`pnpm plugins:boundary-report:summary`; неиспользуемые зарезервированные экспорты
вспомогательных модулей приводят к сбою CI-отчета, а не остаются в публичном SDK
как неактивный долг совместимости.

Руководство по созданию плагинов см. в [обзоре Plugin SDK](/ru/plugins/sdk-overview).

## Точка входа плагина

| Подпуть                        | Ключевые экспорты                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Вспомогательные элементы провайдера миграций, такие как `createMigrationItem`, константы причин, маркеры статуса элементов, помощники редактирования и `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Вспомогательные средства миграций во время выполнения, такие как `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` и `writeMigrationReport`                   |
| `plugin-sdk/health`            | Регистрация, обнаружение, исправление, выбор, серьезность и типы находок для health-check Doctor, используемые встроенными потребителями проверки состояния             |

### Устаревшая совместимость и тестовые вспомогательные средства

Устаревшие подпути остаются экспортируемыми для старых плагинов, но новый код
должен использовать специализированные подпути SDK ниже. Поддерживаемый список
находится в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI
отклоняет производственные импорты встроенных плагинов из него. Широкие barrels,
такие как `compat`, `config-types`, `infra-runtime`, `text-runtime` и `zod`,
предназначены только для совместимости. Импортируйте `zod` напрямую из `zod`.

Подпути тестовых вспомогательных средств OpenClaw на базе Vitest являются только
локальными для репозитория и больше не экспортируются пакетом:
`agent-runtime-test-contracts`, `channel-contract-testing`,
`channel-target-testing`, `channel-test-helpers`, `plugin-test-api`,
`plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks` и
`testing`.

### Зарезервированные подпути вспомогательных модулей встроенных плагинов

Эти подпути являются поверхностями совместимости, принадлежащими плагинам для
соответствующих встроенных плагинов, а не общими API SDK:
`plugin-sdk/codex-mcp-projection` и `plugin-sdk/codex-native-task-runtime`.
Импорты расширений между владельцами блокируются средствами защиты контракта
пакета.

<AccordionGroup>
  <Accordion title="Подпути каналов">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Экспорт корневой схемы Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кэшируемый помощник проверки JSON Schema для схем, принадлежащих plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Общие помощники мастера настройки, транслятор настройки, запросы allowlist, построители статуса настройки |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним совместимости; используйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помощники multi-account конфигурации/action-gate, помощники резервного default-account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помощники нормализации account-id |
    | `plugin-sdk/account-resolution` | Помощники поиска аккаунта и резервного значения по умолчанию |
    | `plugin-sdk/account-helpers` | Узкие помощники account-list/account-action |
    | `plugin-sdk/access-groups` | Помощники разбора allowlist групп доступа и редактированной диагностики групп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Общие примитивы схемы конфигурации канала, а также построители Zod и прямые построители JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схемы конфигурации bundled-каналов OpenClaw только для поддерживаемых bundled plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонические идентификаторы bundled/official чат-каналов, а также метки/псевдонимы форматтера для plugins, которым нужно распознавать текст с envelope-префиксом без жестко заданной собственной таблицы. |
    | `plugin-sdk/channel-config-schema-legacy` | Устаревший псевдоним совместимости для схем конфигурации bundled-каналов |
    | `plugin-sdk/telegram-command-config` | Помощники нормализации/проверки пользовательских команд Telegram с резервом bundled-contract |
    | `plugin-sdk/command-gating` | Узкие помощники шлюза авторизации команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Устаревший низкоуровневый фасад совместимости для входящих данных канала. Новые пути приема должны использовать `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Экспериментальный высокоуровневый runtime-резолвер входящих данных канала и построители route fact для мигрированных путей приема канала. Предпочитайте его сборке эффективных allowlists, allowlists команд и legacy-проекций в каждом plugin. См. [API входящих данных канала](/ru/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракты жизненного цикла сообщений, а также параметры reply pipeline, квитанции, live preview/streaming, помощники жизненного цикла, исходящая идентичность, планирование payload, долговечные отправки и помощники контекста отправки сообщений. См. [API исходящих данных канала](/ru/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также legacy-фасады reply-dispatch. |
    | `plugin-sdk/channel-message-runtime` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также legacy-фасады reply-dispatch. |
    | `plugin-sdk/inbound-envelope` | Общие помощники входящего маршрута и построителя envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-inbound` для inbound runners и предикатов dispatch, а `plugin-sdk/channel-outbound` для помощников доставки сообщений. |
    | `plugin-sdk/messaging-targets` | Устаревший псевдоним разбора целей; используйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Общие помощники загрузки исходящих медиа и состояния hosted-media |
    | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Узкие помощники нормализации poll |
    | `plugin-sdk/thread-bindings-runtime` | Помощники жизненного цикла и адаптера thread-binding |
    | `plugin-sdk/agent-media-payload` | Legacy-построитель agent media payload |
    | `plugin-sdk/conversation-runtime` | Помощники conversation/thread binding, pairing и configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Помощник снимка runtime-конфигурации |
    | `plugin-sdk/runtime-group-policy` | Помощники разрешения runtime group-policy |
    | `plugin-sdk/channel-status` | Общие помощники снимка/сводки состояния канала |
    | `plugin-sdk/channel-config-primitives` | Узкие примитивы схемы конфигурации канала |
    | `plugin-sdk/channel-config-writes` | Помощники авторизации записи конфигурации канала |
    | `plugin-sdk/channel-plugin-common` | Общие экспорты прелюдии channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Помощники редактирования/чтения конфигурации allowlist |
    | `plugin-sdk/group-access` | Общие помощники решения group-access |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Узкие помощники политики pre-crypto guard для direct-DM |
    | `plugin-sdk/discord` | Устаревший фасад совместимости Discord для опубликованного `@openclaw/discord@2026.3.13` и отслеживаемой совместимости владельца; новые plugins должны использовать общие подпути channel SDK |
    | `plugin-sdk/telegram-account` | Устаревший фасад совместимости разрешения аккаунтов Telegram для отслеживаемой совместимости владельца; новые plugins должны использовать внедренные runtime-помощники или общие подпути channel SDK |
    | `plugin-sdk/zalouser` | Устаревший фасад совместимости Zalo Personal для опубликованных пакетов Lark/Zalo, которые все еще импортируют авторизацию команд отправителя; новые plugins должны использовать `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантическое представление и доставка сообщений, а также legacy-помощники интерактивных ответов. См. [Представление сообщений](/ru/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Общие inbound-помощники для классификации событий, построения контекста, форматирования, корней, debounce, сопоставления упоминаний, mention-policy и inbound-журналирования |
    | `plugin-sdk/channel-inbound-debounce` | Узкие помощники inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Узкие помощники mention-policy, маркеров упоминаний и текста упоминаний без более широкой поверхности inbound runtime |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound` или `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типы результата ответа |
    | `plugin-sdk/channel-actions` | Помощники действий сообщений канала, а также устаревшие помощники нативных схем, сохраненные для совместимости plugin |
    | `plugin-sdk/channel-route` | Общие помощники нормализации маршрутов, управляемого парсером разрешения целей, строкового представления thread-id, dedupe/compact ключей маршрута, типов parsed-target и сравнения route/target |
    | `plugin-sdk/channel-targets` | Помощники разбора целей; вызывающие сравнение маршрутов должны использовать `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типы контрактов канала |
    | `plugin-sdk/channel-feedback` | Связка feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Узкие помощники secret-contract, такие как `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, и типы целей secret |
  </Accordion>

Устаревшие семейства помощников каналов остаются доступными только для
совместимости опубликованных plugins. План удаления: сохранить их на время окна
миграции внешних plugins, держать repo/bundled plugins на `channel-inbound` и
`channel-outbound`, затем удалить подпути совместимости при следующей крупной
очистке SDK. Это относится к старым семействам channel message/runtime, channel
streaming, direct-DM access, inbound helper splinter, reply-options
и pairing-path.

  <Accordion title="Подпути провайдера">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Поддерживаемый фасад провайдера LM Studio для настройки, обнаружения каталога и подготовки модели во время выполнения |
    | `plugin-sdk/lmstudio-runtime` | Поддерживаемый фасад времени выполнения LM Studio для локальных серверных значений по умолчанию, обнаружения моделей, заголовков запросов и вспомогательных функций для загруженных моделей |
    | `plugin-sdk/provider-setup` | Отобранные вспомогательные функции настройки локальных/самостоятельно размещаемых провайдеров |
    | `plugin-sdk/self-hosted-provider-setup` | Специализированные вспомогательные функции настройки самостоятельно размещаемых OpenAI-совместимых провайдеров |
    | `plugin-sdk/cli-backend` | Значения по умолчанию для бэкенда CLI + константы watchdog |
    | `plugin-sdk/provider-auth-runtime` | Вспомогательные функции разрешения API-ключей во время выполнения для плагинов провайдеров |
    | `plugin-sdk/provider-oauth-runtime` | Универсальные типы OAuth-колбэков провайдера, рендеринг страницы колбэка, вспомогательные функции PKCE/state, разбор authorization-input, вспомогательные функции истечения срока действия токенов и вспомогательные функции прерывания |
    | `plugin-sdk/provider-auth-api-key` | Вспомогательные функции онбординга API-ключей/записи профилей, такие как `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартный построитель результата OAuth-аутентификации |
    | `plugin-sdk/provider-env-vars` | Вспомогательные функции поиска env-var для аутентификации провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, вспомогательные функции импорта аутентификации OpenAI Codex, устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители replay-policy, вспомогательные функции endpoint провайдера и общие вспомогательные функции нормализации model-id |
    | `plugin-sdk/provider-catalog-live-runtime` | Вспомогательные функции живого каталога моделей провайдера для защищенного обнаружения в стиле `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фильтрация model-id, TTL-кэш и статический fallback |
    | `plugin-sdk/provider-catalog-runtime` | Хук времени выполнения для расширения каталога провайдера и швы реестра plugin-provider для контрактных тестов |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Универсальные вспомогательные функции HTTP/endpoint-возможностей провайдера, HTTP-ошибки провайдера и вспомогательные функции multipart form для аудиотранскрипции |
    | `plugin-sdk/provider-web-fetch-contract` | Узкие вспомогательные функции контракта конфигурации/выбора web-fetch, такие как `enablePluginInConfig` и `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Вспомогательные функции регистрации/кэша провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Узкие вспомогательные функции конфигурации/учетных данных web-search для провайдеров, которым не нужна проводка plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Узкие вспомогательные функции контракта конфигурации/учетных данных web-search, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а также scoped setters/getters учетных данных |
    | `plugin-sdk/provider-web-search` | Вспомогательные функции регистрации/кэша/времени выполнения провайдера web-search |
    | `plugin-sdk/embedding-providers` | Общие типы провайдеров embedding и вспомогательные функции чтения, включая `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` и `listEmbeddingProviders(...)`; плагины регистрируют провайдеров через `api.registerEmbeddingProvider(...)`, поэтому владение манифестом принудительно соблюдается |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` и очистка схем DeepSeek/Gemini/OpenAI + диагностика |
    | `plugin-sdk/provider-usage` | Типы снимков использования провайдера, общие вспомогательные функции получения использования и fetcher-функции провайдеров, такие как `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы stream wrapper, совместимость plain-text tool-call и общие вспомогательные wrapper-функции Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публичные общие вспомогательные функции provider stream wrapper, включая `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` и stream-утилиты Anthropic/DeepSeek/OpenAI-совместимых провайдеров |
    | `plugin-sdk/provider-transport-runtime` | Вспомогательные функции native provider transport, такие как защищенный fetch, извлечение текста tool-result, преобразования transport-сообщений и записываемые потоки transport-событий |
    | `plugin-sdk/provider-onboard` | Вспомогательные функции патчинга конфигурации онбординга |
    | `plugin-sdk/global-singleton` | Вспомогательные функции process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Узкие вспомогательные функции режима активации группы и разбора команд |
  </Accordion>

Снимки использования провайдера обычно сообщают об одном или нескольких quota-`windows`, каждый из которых содержит
метку, процент использования и необязательное время сброса. Провайдеры, которые предоставляют текст баланса или
состояния учетной записи вместо сбрасываемых окон квоты, должны возвращать
`summary` с пустым массивом `windows`, а не фабриковать проценты.
OpenClaw отображает этот текст summary в выводе статуса; используйте `error` только когда
endpoint использования завершился с ошибкой или не вернул пригодных данных об использовании.

  <Accordion title="Подпути аутентификации и безопасности">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, вспомогательные функции реестра команд, включая форматирование меню динамических аргументов, вспомогательные функции авторизации отправителя |
    | `plugin-sdk/command-status` | Построители сообщений команд/справки, такие как `buildCommandsMessagePaginated` и `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Разрешение approver и вспомогательные функции action-auth в том же чате |
    | `plugin-sdk/approval-client-runtime` | Вспомогательные функции профиля/фильтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native-адаптеры approval capability/delivery |
    | `plugin-sdk/approval-gateway-runtime` | Общая вспомогательная функция разрешения approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковесные вспомогательные функции загрузки native approval adapter для горячих точек входа каналов |
    | `plugin-sdk/approval-handler-runtime` | Более широкие вспомогательные функции времени выполнения approval handler; предпочитайте более узкие швы adapter/gateway, когда их достаточно |
    | `plugin-sdk/approval-native-runtime` | Вспомогательные функции native approval target, account-binding, route-gate, forwarding fallback и подавления local native exec prompt |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки approval reaction, payload запросов reaction, хранилища reaction target и экспорт совместимости для подавления local native exec prompt |
    | `plugin-sdk/approval-reply-runtime` | Вспомогательные функции payload ответа exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Вспомогательные функции payload exec/plugin approval, вспомогательные функции маршрутизации/времени выполнения native approval и вспомогательные функции структурированного отображения approval, такие как `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Узкие вспомогательные функции сброса дедупликации входящих ответов |
    | `plugin-sdk/channel-contract-testing` | Узкие вспомогательные функции контрактных тестов каналов без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native command auth, форматирование меню динамических аргументов и вспомогательные функции native session-target |
    | `plugin-sdk/command-detection` | Общие вспомогательные функции обнаружения команд |
    | `plugin-sdk/command-primitives-runtime` | Легковесные предикаты текста команд для горячих путей каналов |
    | `plugin-sdk/command-surface` | Нормализация command-body и вспомогательные функции command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Узкие вспомогательные функции сбора secret-contract для поверхностей секретов каналов/плагинов |
    | `plugin-sdk/secret-ref-runtime` | Узкие `coerceSecretRef` и вспомогательные функции типизации SecretRef для разбора secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef provider integration manifest и контракты preset для плагинов, публикующих внешние preset провайдеров секретов |
    | `plugin-sdk/security-runtime` | Общие вспомогательные функции trust, DM gating, root-bounded file/path, включая записи create-only, синхронную/асинхронную атомарную замену файлов, sibling temp writes, fallback перемещения между устройствами, вспомогательные функции private file-store, защиты symlink-parent, external-content, редактирование sensitive text, constant-time сравнение секретов и вспомогательные функции secret-collection |
    | `plugin-sdk/ssrf-policy` | Вспомогательные функции host allowlist и политики SSRF для private-network |
    | `plugin-sdk/ssrf-dispatcher` | Узкие вспомогательные функции pinned-dispatcher без широкой поверхности infra runtime |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, ошибка SSRF и вспомогательные функции политики SSRF |
    | `plugin-sdk/secret-input` | Вспомогательные функции разбора secret input |
    | `plugin-sdk/webhook-ingress` | Вспомогательные функции Webhook request/target и приведение raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Вспомогательные функции размера/таймаута тела запроса |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкие вспомогательные средства среды выполнения, логирования, резервного копирования и установки плагинов |
    | `plugin-sdk/runtime-env` | Узкие вспомогательные средства окружения среды выполнения, логгера, тайм-аутов, повторов и экспоненциальной задержки |
    | `plugin-sdk/browser-config` | Поддерживаемый фасад конфигурации браузера для нормализованных профилей/значений по умолчанию, разбора URL CDP и вспомогательных средств авторизации управления браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Универсальные вспомогательные средства жизненного цикла задач и доставки завершения для агентов на основе harness, использующих область задачи, выданную хостом |
    | `plugin-sdk/codex-mcp-projection` | Зарезервированное встроенное вспомогательное средство Codex для проецирования пользовательской конфигурации MCP-сервера в конфигурацию потока Codex; не для сторонних плагинов |
    | `plugin-sdk/codex-native-task-runtime` | Приватное встроенное вспомогательное средство Codex для нативного зеркала задач и связки среды выполнения; не для сторонних плагинов |
    | `plugin-sdk/channel-runtime-context` | Универсальные вспомогательные средства регистрации и поиска runtime-контекста канала |
    | `plugin-sdk/matrix` | Устаревший фасад совместимости Matrix для старых сторонних пакетов каналов; новые плагины должны импортировать `plugin-sdk/run-command` напрямую |
    | `plugin-sdk/mattermost` | Устаревший фасад совместимости Mattermost для старых сторонних пакетов каналов; новые плагины должны импортировать универсальные подпути SDK напрямую |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Общие вспомогательные средства команд, хуков, HTTP и интерактивных функций плагинов |
    | `plugin-sdk/hook-runtime` | Общие вспомогательные средства конвейера webhook/внутренних хуков |
    | `plugin-sdk/lazy-runtime` | Вспомогательные средства ленивого импорта/привязки среды выполнения, такие как `createLazyRuntimeModule`, `createLazyRuntimeMethod` и `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Вспомогательные средства выполнения процессов |
    | `plugin-sdk/cli-runtime` | Вспомогательные средства форматирования CLI, ожидания, версии, вызова аргументов и ленивых групп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Общие идентификаторы сценариев QA для live-транспорта, вспомогательные средства базового покрытия и выбора сценариев |
    | `plugin-sdk/gateway-method-runtime` | Зарезервированное вспомогательное средство диспетчеризации методов Gateway для HTTP-маршрутов плагина, объявляющих `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клиент Gateway, вспомогательное средство запуска клиента с готовым циклом событий, CLI RPC Gateway, ошибки протокола Gateway, разрешение объявленного LAN-хоста и вспомогательные средства патчей статуса канала |
    | `plugin-sdk/config-contracts` | Сфокусированная type-only поверхность конфигурации для форм конфигурации плагинов, таких как `OpenClawConfig`, и типов конфигурации каналов/провайдеров |
    | `plugin-sdk/plugin-config-runtime` | Вспомогательные средства поиска конфигурации плагина в среде выполнения, такие как `requireRuntimeConfig`, `resolvePluginConfigObject` и `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Вспомогательные средства транзакционной мутации конфигурации, такие как `mutateConfigFile`, `replaceConfigFile` и `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Общие строки подсказок метаданных доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Вспомогательные средства снимка текущей конфигурации процесса, такие как `getRuntimeConfig`, `getRuntimeConfigSnapshot`, и тестовые сеттеры снимков |
    | `plugin-sdk/telegram-command-config` | Нормализация имен/описаний команд Telegram и проверки дубликатов/конфликтов, даже когда встроенная контрактная поверхность Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Обнаружение автоссылок на ссылки файлов без широкого текстового barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки реакций подтверждения, payloads запросов реакций, хранилища целей реакций и экспорт совместимости для подавления локального нативного exec-запроса |
    | `plugin-sdk/approval-runtime` | Вспомогательные средства подтверждений exec/плагинов, построители возможностей подтверждения, вспомогательные средства авторизации/профилей, нативной маршрутизации/среды выполнения и форматирования пути структурированного отображения подтверждения |
    | `plugin-sdk/reply-runtime` | Общие вспомогательные средства среды выполнения входящих сообщений/ответов, разбиение на фрагменты, диспетчеризация, Heartbeat, планировщик ответов |
    | `plugin-sdk/reply-dispatch-runtime` | Узкие вспомогательные средства диспетчеризации/финализации ответов и меток бесед |
    | `plugin-sdk/reply-history` | Общие вспомогательные средства истории ответов с коротким окном. Новый код message-turn должен использовать `createChannelHistoryWindow`; низкоуровневые вспомогательные средства карт остаются только устаревшими экспортами совместимости |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Узкие вспомогательные средства разбиения текста/Markdown на фрагменты |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства рабочих процессов сессий (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ограниченные чтения текста недавних транскриптов пользователя/ассистента по идентичности сессии, устаревшие вспомогательные средства пути хранилища сессий/ключа сессии, чтения updated-at и переходные вспомогательные средства совместимости всего хранилища/пути файла |
    | `plugin-sdk/session-transcript-runtime` | Идентичность транскрипта, вспомогательные средства целевого доступа/чтения/записи в области, публикация обновлений, блокировки записи и ключи попаданий памяти транскрипта |
    | `plugin-sdk/sqlite-runtime` | Сфокусированные вспомогательные средства схемы агента, путей и транзакций SQLite для собственной среды выполнения |
    | `plugin-sdk/cron-store-runtime` | Вспомогательные средства пути/загрузки/сохранения хранилища Cron |
    | `plugin-sdk/state-paths` | Вспомогательные средства путей каталогов состояния/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типы keyed-state для sidecar SQLite плагина плюс централизованная настройка pragma соединения и обслуживания WAL для баз данных, принадлежащих плагину |
    | `plugin-sdk/routing` | Вспомогательные средства привязки маршрута/ключа сессии/аккаунта, такие как `resolveAgentRoute`, `buildAgentSessionKey` и `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Общие вспомогательные средства сводки статуса канала/аккаунта, значения по умолчанию состояния среды выполнения и вспомогательные средства метаданных issue |
    | `plugin-sdk/target-resolver-runtime` | Общие вспомогательные средства разрешателя целей |
    | `plugin-sdk/string-normalization-runtime` | Вспомогательные средства нормализации slug/строк |
    | `plugin-sdk/request-url` | Извлечение строковых URL из fetch/request-подобных входных данных |
    | `plugin-sdk/run-command` | Запуск команд с таймером и нормализованными результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Общие считыватели параметров инструментов/CLI |
    | `plugin-sdk/tool-plugin` | Определение простого типизированного плагина agent-tool и предоставление статических метаданных для генерации манифеста |
    | `plugin-sdk/tool-payload` | Извлечение нормализованных payloads из объектов результата инструмента |
    | `plugin-sdk/tool-send` | Извлечение канонических полей цели отправки из аргументов инструмента |
    | `plugin-sdk/sandbox` | Типы backend песочницы и вспомогательные средства команд SSH/OpenShell, включая fail-fast preflight exec-команд |
    | `plugin-sdk/temp-path` | Общие вспомогательные средства путей временной загрузки и приватные безопасные временные рабочие области |
    | `plugin-sdk/logging-core` | Логгер подсистемы и вспомогательные средства редактирования секретов |
    | `plugin-sdk/markdown-table-runtime` | Вспомогательные средства режима и преобразования таблиц Markdown |
    | `plugin-sdk/model-session-runtime` | Вспомогательные средства переопределения модели/сессии, такие как `applyModelOverrideToSessionEntry` и `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Вспомогательные средства разрешения конфигурации talk-провайдера |
    | `plugin-sdk/json-store` | Небольшие вспомогательные средства чтения/записи состояния JSON |
    | `plugin-sdk/json-unsafe-integers` | Вспомогательные средства разбора JSON, сохраняющие небезопасные целочисленные литералы как строки |
    | `plugin-sdk/file-lock` | Реентерабельные вспомогательные средства блокировки файлов |
    | `plugin-sdk/persistent-dedupe` | Вспомогательные средства дискового dedupe-кэша |
    | `plugin-sdk/acp-runtime` | Вспомогательные средства среды выполнения/сессий ACP и диспетчеризации ответов |
    | `plugin-sdk/acp-runtime-backend` | Легковесные вспомогательные средства регистрации backend ACP и диспетчеризации ответов для плагинов, загружаемых при запуске |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only разрешение привязок ACP без импортов запуска жизненного цикла |
    | `plugin-sdk/agent-config-primitives` | Узкие примитивы схемы конфигурации среды выполнения агента |
    | `plugin-sdk/boolean-param` | Нестрогий считыватель булевых параметров |
    | `plugin-sdk/dangerous-name-runtime` | Вспомогательные средства разрешения совпадений опасных имен |
    | `plugin-sdk/device-bootstrap` | Вспомогательные средства начальной настройки устройства и токенов сопряжения |
    | `plugin-sdk/extension-shared` | Общие примитивы пассивного канала, статуса и вспомогательного ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Вспомогательные средства ответов команды/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Вспомогательные средства перечисления команд Skills |
    | `plugin-sdk/native-command-registry` | Вспомогательные средства реестра/сборки/сериализации нативных команд |
    | `plugin-sdk/agent-harness` | Экспериментальная поверхность доверенных плагинов для низкоуровневых agent harnesses: типы harness, вспомогательные средства steer/abort активного запуска, вспомогательные средства моста инструментов OpenClaw, вспомогательные средства политики инструментов runtime-plan, классификация terminal outcome, вспомогательные средства форматирования/детализации прогресса инструментов и утилиты результата попытки |
    | `plugin-sdk/provider-zai-endpoint` | Устаревший фасад обнаружения endpoint, принадлежащего провайдеру Z.AI; используйте публичный API плагина Z.AI |
    | `plugin-sdk/async-lock-runtime` | Вспомогательное средство process-local async lock для небольших файлов состояния среды выполнения |
    | `plugin-sdk/channel-activity-runtime` | Вспомогательное средство телеметрии активности канала |
    | `plugin-sdk/concurrency-runtime` | Вспомогательное средство ограниченной конкурентности асинхронных задач |
    | `plugin-sdk/dedupe-runtime` | Вспомогательные средства in-memory dedupe-кэша |
    | `plugin-sdk/delivery-queue-runtime` | Вспомогательное средство drain для исходящих pending-delivery |
    | `plugin-sdk/file-access-runtime` | Вспомогательные средства безопасных путей локальных файлов и источников медиа |
    | `plugin-sdk/heartbeat-runtime` | Вспомогательные средства пробуждения, событий и видимости Heartbeat |
    | `plugin-sdk/number-runtime` | Вспомогательное средство числового приведения |
    | `plugin-sdk/secure-random-runtime` | Вспомогательные средства безопасных токенов/UUID |
    | `plugin-sdk/system-event-runtime` | Вспомогательные средства очереди системных событий |
    | `plugin-sdk/transport-ready-runtime` | Вспомогательное средство ожидания готовности транспорта |
    | `plugin-sdk/exec-approvals-runtime` | Вспомогательные средства файлов политики подтверждений exec без широкого barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Устаревший shim совместимости; используйте сфокусированные подпути среды выполнения выше |
    | `plugin-sdk/collection-runtime` | Небольшие вспомогательные средства ограниченного кэша |
    | `plugin-sdk/diagnostic-runtime` | Вспомогательные средства диагностических флагов, событий и trace-context |
    | `plugin-sdk/error-runtime` | Граф ошибок, форматирование, общие вспомогательные средства классификации ошибок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обернутый fetch, proxy, опция EnvHttpProxyAgent и вспомогательные средства закрепленного lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без импортов proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Санитайзер inline image data URL и вспомогательные средства signature sniffing без широкой поверхности среды выполнения медиа |
    | `plugin-sdk/response-limit-runtime` | Ограниченный считыватель response-body без широкой поверхности среды выполнения медиа |
    | `plugin-sdk/session-binding-runtime` | Текущее состояние привязки беседы без настроенной маршрутизации привязок или хранилищ сопряжений |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства хранилища сессий без широких импортов записи/обслуживания конфигурации |
    | `plugin-sdk/sqlite-runtime` | Сфокусированные вспомогательные средства схемы агента, путей и транзакций SQLite без управления жизненным циклом базы данных |
    | `plugin-sdk/context-visibility-runtime` | Разрешение видимости контекста и фильтрация дополнительного контекста без широких импортов конфигурации/безопасности |
    | `plugin-sdk/string-coerce-runtime` | Узкие вспомогательные средства приведения и нормализации примитивных record/строк без импортов markdown/логирования |
    | `plugin-sdk/host-runtime` | Вспомогательные средства нормализации hostname и SCP host |
    | `plugin-sdk/retry-runtime` | Вспомогательные средства конфигурации повторов и runner повторов |
    | `plugin-sdk/agent-runtime` | Вспомогательные средства каталога/идентичности/рабочей области агента, включая `resolveAgentDir`, `resolveDefaultAgentDir` и устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запрос/дедупликация каталогов на основе конфигурации |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Подпути возможностей и тестирования">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Общие вспомогательные средства для получения, преобразования и сохранения медиа, включая `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` и устаревший `fetchRemoteMedia`; когда URL должен стать медиа OpenClaw, предпочитайте вспомогательные средства хранилища перед чтением буфера |
    | `plugin-sdk/media-mime` | Узкая нормализация MIME, сопоставление расширений файлов, определение MIME и вспомогательные средства для типов медиа |
    | `plugin-sdk/media-store` | Узкие вспомогательные средства хранилища медиа, такие как `saveMediaBuffer` и `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Общие вспомогательные средства отказоустойчивости генерации медиа, выбора кандидатов и сообщений об отсутствующей модели |
    | `plugin-sdk/media-understanding` | Типы провайдеров понимания медиа, а также экспорты вспомогательных средств для изображений, аудио и структурированного извлечения, предназначенные для провайдеров |
    | `plugin-sdk/text-chunking` | Вспомогательные средства разбиения и рендеринга текста и markdown, преобразование таблиц markdown, удаление тегов директив и утилиты безопасного текста |
    | `plugin-sdk/text-chunking` | Вспомогательное средство разбиения исходящего текста |
    | `plugin-sdk/speech` | Типы речевых провайдеров, а также экспорты директив, реестра, валидации, OpenAI-совместимого конструктора TTS и речевых вспомогательных средств, предназначенные для провайдеров |
    | `plugin-sdk/speech-core` | Общие типы речевых провайдеров, реестр, директива, нормализация и экспорты речевых вспомогательных средств |
    | `plugin-sdk/realtime-transcription` | Типы провайдеров транскрипции в реальном времени, вспомогательные средства реестра и общий помощник сеанса WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Вспомогательное средство начальной загрузки профиля реального времени для ограниченной инъекции контекста `IDENTITY.md`, `USER.md` и `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типы провайдеров голоса в реальном времени, вспомогательные средства реестра и общие вспомогательные средства поведения голоса в реальном времени, включая отслеживание активности вывода |
    | `plugin-sdk/image-generation` | Типы провайдеров генерации изображений, а также вспомогательные средства URL изображений-ресурсов/данных и OpenAI-совместимый конструктор провайдера изображений |
    | `plugin-sdk/image-generation-core` | Общие типы генерации изображений, отказоустойчивость, auth и вспомогательные средства реестра |
    | `plugin-sdk/music-generation` | Типы провайдера, запроса и результата генерации музыки |
    | `plugin-sdk/music-generation-core` | Общие типы генерации музыки, вспомогательные средства отказоустойчивости, поиск провайдера и разбор model-ref |
    | `plugin-sdk/video-generation` | Типы провайдера, запроса и результата генерации видео |
    | `plugin-sdk/video-generation-core` | Общие типы генерации видео, вспомогательные средства отказоустойчивости, поиск провайдера и разбор model-ref |
    | `plugin-sdk/transcripts` | Общие типы провайдеров источников транскриптов, вспомогательные средства реестра, дескрипторы сеансов и метаданные высказываний |
    | `plugin-sdk/webhook-targets` | Реестр целей Webhook и вспомогательные средства установки маршрутов |
    | `plugin-sdk/webhook-path` | Устаревший псевдоним совместимости; используйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Общие вспомогательные средства загрузки удаленных/локальных медиа |
    | `plugin-sdk/zod` | Устаревший реэкспорт совместимости; импортируйте `zod` напрямую из `zod` |
    | `plugin-sdk/testing` | Локальный для репозитория устаревший barrel совместимости для наследуемых тестов OpenClaw. Новые тесты репозитория должны вместо этого импортировать сфокусированные локальные тестовые подпути, такие как `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` или `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальный для репозитория минимальный помощник `createTestPluginApi` для модульных тестов прямой регистрации плагинов без импорта мостов тестовых вспомогательных средств репозитория |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальные для репозитория фикстуры контрактов нативного адаптера среды выполнения агента для тестов auth, доставки, fallback, tool-hook, prompt-overlay, схемы и проекции транскрипта |
    | `plugin-sdk/channel-test-helpers` | Локальные для репозитория тестовые вспомогательные средства, ориентированные на каналы, для контрактов общих действий/настройки/статуса, проверок каталогов, жизненного цикла запуска учетной записи, потоков send-config, моков среды выполнения, проблем статуса, исходящей доставки и регистрации хуков |
    | `plugin-sdk/channel-target-testing` | Локальный для репозитория общий набор случаев ошибок разрешения целей для тестов каналов |
    | `plugin-sdk/plugin-test-contracts` | Локальные для репозитория вспомогательные средства контрактов пакета Plugin, регистрации, публичного артефакта, прямого импорта, runtime API и побочных эффектов импорта |
    | `plugin-sdk/provider-test-contracts` | Локальные для репозитория вспомогательные средства контрактов среды выполнения провайдера, auth, обнаружения, onboard, каталога, мастера, возможностей медиа, политики воспроизведения, realtime STT live-audio, web-search/fetch и stream |
    | `plugin-sdk/provider-http-test-mocks` | Локальные для репозитория opt-in HTTP/auth моки Vitest для тестов провайдера, которые проверяют `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Локальные для репозитория общие фикстуры захвата среды выполнения CLI, контекста sandbox, автора Skills, agent-message, system-event, перезагрузки модуля, пути встроенного плагина, terminal-text, разбиения, auth-token и typed-case |
    | `plugin-sdk/test-node-mocks` | Локальные для репозитория сфокусированные вспомогательные средства моков встроенных модулей Node для использования внутри фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Подпути памяти">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхность встроенных вспомогательных средств memory-core для помощников manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад среды выполнения индекса/поиска памяти |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легковесные вспомогательные средства реестра провайдеров эмбеддингов памяти |
    | `plugin-sdk/memory-core-host-engine-foundation` | Экспорты foundational-движка хоста памяти |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракты эмбеддингов хоста памяти, доступ к реестру, локальный провайдер и общие batch/remote помощники. `registerMemoryEmbeddingProvider` на этой поверхности устарел; для новых провайдеров используйте общий API провайдера эмбеддингов. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Экспорты QMD-движка хоста памяти |
    | `plugin-sdk/memory-core-host-engine-storage` | Экспорты движка хранилища хоста памяти |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные вспомогательные средства хоста памяти |
    | `plugin-sdk/memory-core-host-query` | Вспомогательные средства запросов хоста памяти |
    | `plugin-sdk/memory-core-host-secret` | Вспомогательные средства секретов хоста памяти |
    | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Вспомогательные средства статуса хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-cli` | Вспомогательные средства среды выполнения CLI хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-core` | Вспомогательные средства базовой среды выполнения хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-files` | Вспомогательные средства файлов/среды выполнения хоста памяти |
    | `plugin-sdk/memory-host-core` | Вендорно-нейтральный псевдоним для вспомогательных средств базовой среды выполнения хоста памяти |
    | `plugin-sdk/memory-host-events` | Вендорно-нейтральный псевдоним для вспомогательных средств журнала событий хоста памяти |
    | `plugin-sdk/memory-host-files` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Общие вспомогательные средства managed-markdown для смежных с памятью плагинов |
    | `plugin-sdk/memory-host-search` | Фасад среды выполнения Active Memory для доступа к search-manager |
    | `plugin-sdk/memory-host-status` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервированные подпути встроенных помощников">
    Зарезервированные подпути SDK встроенных помощников — это узкие, специфичные для владельца поверхности для
    кода встроенных плагинов. Они отслеживаются в инвентаре SDK, чтобы сборки
    пакетов и псевдонимы оставались детерминированными, но они не являются общими API
    для разработки плагинов. Новые переиспользуемые контракты хоста должны использовать общие подпути SDK,
    такие как `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
    `plugin-sdk/plugin-config-runtime`.

    | Подпуть | Владелец и назначение |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Вспомогательное средство встроенного плагина Codex для проекции пользовательской конфигурации MCP-сервера в конфигурацию потока app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Вспомогательное средство встроенного плагина Codex для зеркалирования нативных субагентов app-server Codex в состояние задач OpenClaw |

  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Обзор Plugin SDK](/ru/plugins/sdk-overview)
- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание плагинов](/ru/plugins/building-plugins)
