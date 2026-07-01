---
read_when:
    - Выбор правильного подпути plugin-sdk для импорта Plugin
    - Аудит подпутей встроенных Plugin и вспомогательных поверхностей
summary: 'Каталог подпутей Plugin SDK: какие импорты где находятся, сгруппировано по областям'
title: Подпути Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:23:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin предоставляется как набор узких публичных подпутей в
`openclaw/plugin-sdk/`. На этой странице перечислены часто используемые подпути, сгруппированные по
назначению. Сгенерированный инвентарь точек входа компилятора находится в
`scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакета — это публичное подмножество
после вычитания локальных для репозитория тестовых/внутренних подпутей, перечисленных в
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Сопровождающие могут проверять
количество публичных экспортов с помощью `pnpm plugin-sdk:surface` и активные зарезервированные
подпути вспомогательных модулей с помощью `pnpm plugins:boundary-report:summary`; неиспользуемые зарезервированные
вспомогательные экспорты приводят к сбою отчета CI, а не остаются в публичном SDK как
спящий долг совместимости.

Руководство по созданию Plugin см. в [обзоре SDK Plugin](/ru/plugins/sdk-overview).

## Точка входа Plugin

| Подпуть                        | Ключевые экспорты                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Вспомогательные элементы поставщика миграции, такие как `createMigrationItem`, константы причин, маркеры статуса элементов, вспомогательные средства редактирования и `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Вспомогательные средства миграции во время выполнения, такие как `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` и `writeMigrationReport`                  |
| `plugin-sdk/health`            | Регистрация, обнаружение, исправление, выбор, серьезность и типы находок для проверок работоспособности doctor, используемых встроенными потребителями работоспособности |

### Устаревшая совместимость и тестовые вспомогательные средства

Устаревшие подпути остаются экспортируемыми для старых plugins, но в новом коде следует использовать
целевые подпути SDK ниже. Поддерживаемый список находится в
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI отклоняет производственные
импорты встроенных компонентов из него. Широкие barrel-экспорты, такие как `compat`, `config-types`,
`infra-runtime`, `text-runtime` и `zod`, предназначены только для совместимости. Импортируйте `zod`
напрямую из `zod`.

Подпути тестовых вспомогательных средств OpenClaw на базе Vitest являются только локальными для репозитория и
больше не являются экспортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` и `testing`.

### Зарезервированные подпути вспомогательных средств встроенных plugins

Эти подпути являются поверхностями совместимости, принадлежащими plugin, для соответствующего встроенного
plugin, а не общими API SDK: `plugin-sdk/codex-mcp-projection` и
`plugin-sdk/codex-native-task-runtime`. Импорты расширений между владельцами блокируются
защитными правилами контракта пакета.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Экспорт корневой схемы Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кэшируемый помощник проверки JSON Schema для схем, принадлежащих Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Общие помощники мастера настройки, транслятор настройки, запросы списков разрешений, построители статуса настройки |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним совместимости; используйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помощники конфигурации с несколькими учетными записями и шлюза действий, помощники резервного перехода к учетной записи по умолчанию |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помощники нормализации идентификатора учетной записи |
    | `plugin-sdk/account-resolution` | Помощники поиска учетной записи и резервного перехода к значению по умолчанию |
    | `plugin-sdk/account-helpers` | Узкие помощники списка учетных записей и действий учетной записи |
    | `plugin-sdk/access-groups` | Помощники разбора списков разрешений групп доступа и отредактированной диагностики групп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Общие примитивы схемы конфигурации канала, а также построители Zod и прямые построители JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Встроенные схемы конфигурации каналов OpenClaw только для сопровождаемых встроенных plugins |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонические идентификаторы встроенных/официальных чат-каналов, а также метки форматтера и псевдонимы для plugins, которым нужно распознавать текст с префиксом конверта без жестко заданной собственной таблицы. |
    | `plugin-sdk/channel-config-schema-legacy` | Устаревший псевдоним совместимости для встроенных схем конфигурации каналов |
    | `plugin-sdk/telegram-command-config` | Помощники нормализации/проверки пользовательских команд Telegram с резервным переходом по встроенному контракту |
    | `plugin-sdk/command-gating` | Узкие помощники шлюза авторизации команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Устаревший низкоуровневый фасад совместимости входящего потока канала. Новые пути приема должны использовать `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Экспериментальный высокоуровневый преобразователь среды выполнения входящего потока канала и построители фактов маршрута для перенесенных путей приема канала. Предпочитайте его сборке эффективных списков разрешений, списков разрешенных команд и устаревших проекций в каждом Plugin. См. [API входящего потока канала](/ru/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракты жизненного цикла сообщений, а также параметры конвейера ответов, квитанции, предпросмотр/потоковая передача в реальном времени, помощники жизненного цикла, исходящая идентичность, планирование полезной нагрузки, надежные отправки и помощники контекста отправки сообщений. См. [API исходящего канала](/ru/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также устаревшие фасады диспетчеризации ответов. |
    | `plugin-sdk/channel-message-runtime` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также устаревшие фасады диспетчеризации ответов. |
    | `plugin-sdk/inbound-envelope` | Общие помощники входящего маршрута и построителя конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-inbound` для входящих исполнителей и предикатов диспетчеризации, а `plugin-sdk/channel-outbound` — для помощников доставки сообщений. |
    | `plugin-sdk/messaging-targets` | Устаревший псевдоним разбора целей; используйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Общие помощники загрузки исходящих медиа и состояния размещенных медиа |
    | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Узкие помощники нормализации опросов |
    | `plugin-sdk/thread-bindings-runtime` | Помощники жизненного цикла привязок потоков и адаптеров |
    | `plugin-sdk/agent-media-payload` | Устаревший построитель полезной нагрузки медиа агента |
    | `plugin-sdk/conversation-runtime` | Помощники привязки беседы/потока, связывания и настроенных привязок |
    | `plugin-sdk/runtime-config-snapshot` | Помощник снимка конфигурации среды выполнения |
    | `plugin-sdk/runtime-group-policy` | Помощники разрешения групповой политики среды выполнения |
    | `plugin-sdk/channel-status` | Общие помощники снимка/сводки статуса канала |
    | `plugin-sdk/channel-config-primitives` | Узкие примитивы схемы конфигурации канала |
    | `plugin-sdk/channel-config-writes` | Помощники авторизации записи конфигурации канала |
    | `plugin-sdk/channel-plugin-common` | Общие экспорты прелюдии Plugin канала |
    | `plugin-sdk/allowlist-config-edit` | Помощники редактирования/чтения конфигурации списка разрешений |
    | `plugin-sdk/group-access` | Общие помощники принятия решений о групповом доступе |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Узкие помощники политики предварительной криптографической защиты прямых личных сообщений |
    | `plugin-sdk/discord` | Устаревший фасад совместимости Discord для опубликованного `@openclaw/discord@2026.3.13` и отслеживаемой совместимости владельца; новые plugins должны использовать универсальные подпути SDK каналов |
    | `plugin-sdk/telegram-account` | Устаревший фасад совместимости разрешения учетных записей Telegram для отслеживаемой совместимости владельца; новые plugins должны использовать внедренные помощники среды выполнения или универсальные подпути SDK каналов |
    | `plugin-sdk/zalouser` | Устаревший фасад совместимости Zalo Personal для опубликованных пакетов Lark/Zalo, которые все еще импортируют авторизацию команд отправителя; новые plugins должны использовать `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантическое представление сообщений, доставка и устаревшие помощники интерактивных ответов. См. [Представление сообщений](/ru/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Общие входящие помощники для классификации событий, построения контекста, форматирования, корней, устранения дребезга, сопоставления упоминаний, политики упоминаний и входящего журналирования |
    | `plugin-sdk/channel-inbound-debounce` | Узкие помощники устранения дребезга входящего потока |
    | `plugin-sdk/channel-mention-gating` | Узкие помощники политики упоминаний, маркеров упоминаний и текста упоминаний без более широкой поверхности входящей среды выполнения |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound` или `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типы результата ответа |
    | `plugin-sdk/channel-actions` | Помощники действий сообщений канала, а также устаревшие помощники нативной схемы, сохраненные для совместимости Plugin |
    | `plugin-sdk/channel-route` | Общая нормализация маршрутов, управляемое парсером разрешение целей, преобразование идентификаторов потоков в строки, ключи маршрутов для дедупликации/компактного представления, типы разобранных целей и помощники сравнения маршрутов/целей |
    | `plugin-sdk/channel-targets` | Помощники разбора целей; вызывающие стороны сравнения маршрутов должны использовать `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типы контрактов каналов |
    | `plugin-sdk/channel-feedback` | Связка обратной связи/реакций |
    | `plugin-sdk/channel-secret-runtime` | Узкие помощники контракта секретов, такие как `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, и типы целей секретов |
  </Accordion>

Устаревшие семейства помощников каналов остаются доступны только для
совместимости опубликованных plugins. План удаления: сохранять их в течение
окна миграции внешних plugins, держать plugins в репозитории/встроенные plugins на `channel-inbound` и
`channel-outbound`, затем удалить подпути совместимости во время следующей крупной
очистки SDK. Это относится к старым семействам сообщений/среды выполнения канала, потоковой передачи канала,
доступа к прямым личным сообщениям, раздробленных входящих помощников, параметров ответа
и путей связывания.

  <Accordion title="Подпути провайдера">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Поддерживаемый фасад провайдера LM Studio для настройки, обнаружения каталога и подготовки моделей во время выполнения |
    | `plugin-sdk/lmstudio-runtime` | Поддерживаемый фасад выполнения LM Studio для локальных значений сервера по умолчанию, обнаружения моделей, заголовков запросов и вспомогательных средств для загруженных моделей |
    | `plugin-sdk/provider-setup` | Подобранные вспомогательные средства настройки локальных/самостоятельно размещаемых провайдеров |
    | `plugin-sdk/self-hosted-provider-setup` | Специализированные вспомогательные средства настройки самостоятельно размещаемых OpenAI-совместимых провайдеров |
    | `plugin-sdk/cli-backend` | Значения по умолчанию для бэкенда CLI + константы watchdog |
    | `plugin-sdk/provider-auth-runtime` | Вспомогательные средства разрешения API-ключей во время выполнения для Plugin провайдеров |
    | `plugin-sdk/provider-oauth-runtime` | Универсальные типы обратных вызовов OAuth провайдера, отрисовка страницы обратного вызова, вспомогательные средства PKCE/состояния, разбор входных данных авторизации, вспомогательные средства истечения срока действия токенов и вспомогательные средства прерывания |
    | `plugin-sdk/provider-auth-api-key` | Вспомогательные средства онбординга API-ключей/записи профиля, такие как `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартный построитель результата OAuth-аутентификации |
    | `plugin-sdk/provider-env-vars` | Вспомогательные средства поиска env-var аутентификации провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, вспомогательные средства импорта аутентификации OpenAI Codex, устаревший совместимый экспорт `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители replay-policy, вспомогательные средства endpoint провайдера и общие вспомогательные средства нормализации model-id |
    | `plugin-sdk/provider-catalog-live-runtime` | Вспомогательные средства live-каталога моделей провайдера для защищенного обнаружения в стиле `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фильтрация model-id, TTL-кэш и статический fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук расширения каталога провайдера и швы реестра plugin-provider для контрактных тестов |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Универсальные вспомогательные средства возможностей HTTP/endpoint провайдера, HTTP-ошибки провайдера и вспомогательные средства multipart-форм аудиотранскрипции |
    | `plugin-sdk/provider-web-fetch-contract` | Узкие вспомогательные средства контракта конфигурации/выбора web-fetch, такие как `enablePluginInConfig` и `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Вспомогательные средства регистрации/кэширования провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Узкие вспомогательные средства конфигурации/учетных данных web-search для провайдеров, которым не нужна связка включения Plugin |
    | `plugin-sdk/provider-web-search-contract` | Узкие вспомогательные средства контракта конфигурации/учетных данных web-search, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а также scoped-сеттеры/геттеры учетных данных |
    | `plugin-sdk/provider-web-search` | Вспомогательные средства регистрации/кэширования/runtime провайдера web-search |
    | `plugin-sdk/embedding-providers` | Общие типы провайдеров embeddings и вспомогательные средства чтения, включая `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` и `listEmbeddingProviders(...)`; plugins регистрируют провайдеров через `api.registerEmbeddingProvider(...)`, чтобы обеспечивалось владение манифестом |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` и очистка схем DeepSeek/Gemini/OpenAI + диагностика |
    | `plugin-sdk/provider-usage` | Типы снимков использования провайдера, общие вспомогательные средства получения использования и fetcher-процедуры провайдера, такие как `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы stream-оберток, совместимость tool-call в plain-text и общие вспомогательные обертки Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публичные общие вспомогательные средства оберток stream провайдера, включая `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` и stream-утилиты Anthropic/DeepSeek/OpenAI-compatible |
    | `plugin-sdk/provider-transport-runtime` | Вспомогательные средства нативного транспорта провайдера, такие как защищенный fetch, извлечение текста tool-result, преобразования транспортных сообщений и записываемые потоки транспортных событий |
    | `plugin-sdk/provider-onboard` | Вспомогательные средства исправления конфигурации онбординга |
    | `plugin-sdk/global-singleton` | Вспомогательные средства process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Узкие вспомогательные средства режима активации группы и разбора команд |
  </Accordion>

Снимки использования провайдера обычно сообщают одно или несколько quota `windows`, каждое с
меткой, процентом использования и необязательным временем сброса. Провайдеры, которые предоставляют текст баланса или
состояния аккаунта вместо сбрасываемых quota windows, должны возвращать
`summary` с пустым массивом `windows`, а не фабриковать проценты.
OpenClaw отображает этот текст summary в выводе состояния; используйте `error` только когда
endpoint использования завершился ошибкой или не вернул пригодных данных использования.

  <Accordion title="Подпути аутентификации и безопасности">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, вспомогательные средства реестра команд, включая форматирование меню динамических аргументов, вспомогательные средства авторизации отправителя |
    | `plugin-sdk/command-status` | Построители сообщений команд/справки, такие как `buildCommandsMessagePaginated` и `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Вспомогательные средства разрешения утверждающего и action-auth в том же чате |
    | `plugin-sdk/approval-client-runtime` | Вспомогательные средства профиля/фильтра нативного exec-утверждения |
    | `plugin-sdk/approval-delivery-runtime` | Нативные адаптеры возможностей/доставки утверждений |
    | `plugin-sdk/approval-gateway-runtime` | Общее вспомогательное средство разрешения Gateway утверждений |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковесные вспомогательные средства загрузки нативного адаптера утверждений для горячих точек входа каналов |
    | `plugin-sdk/approval-handler-runtime` | Более широкие runtime-вспомогательные средства обработчика утверждений; предпочитайте более узкие швы adapter/gateway, когда их достаточно |
    | `plugin-sdk/approval-native-runtime` | Вспомогательные средства нативной цели утверждения, привязки аккаунта, route-gate, forwarding fallback и подавления локального нативного exec-промпта |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки реакций утверждения, payload-промпты реакций, хранилища целей реакций и совместимый экспорт для подавления локального нативного exec-промпта |
    | `plugin-sdk/approval-reply-runtime` | Вспомогательные средства payload ответа exec/plugin-утверждения |
    | `plugin-sdk/approval-runtime` | Вспомогательные средства payload exec/plugin-утверждения, нативные вспомогательные средства маршрутизации/runtime утверждений и вспомогательные средства структурированного отображения утверждений, такие как `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Узкие вспомогательные средства сброса dedupe входящих ответов |
    | `plugin-sdk/channel-contract-testing` | Узкие вспомогательные средства контрактных тестов канала без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативная аутентификация команд, форматирование меню динамических аргументов и нативные вспомогательные средства session-target |
    | `plugin-sdk/command-detection` | Общие вспомогательные средства обнаружения команд |
    | `plugin-sdk/command-primitives-runtime` | Легковесные предикаты текста команд для горячих путей каналов |
    | `plugin-sdk/command-surface` | Нормализация тела команды и вспомогательные средства command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Узкие вспомогательные средства сбора secret-contract для поверхностей секретов каналов/plugin |
    | `plugin-sdk/secret-ref-runtime` | Узкие вспомогательные средства `coerceSecretRef` и типизации SecretRef для разбора secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Type-only манифест интеграции провайдера SecretRef и контракты preset для plugins, публикующих внешние presets провайдеров секретов |
    | `plugin-sdk/security-runtime` | Общие вспомогательные средства доверия, DM gating, ограниченных корнем файлов/путей, включая записи только при создании, синхронную/асинхронную атомарную замену файлов, sibling temp writes, fallback перемещения между устройствами, вспомогательные средства приватного файлового хранилища, защиты родительских symlink, внешний контент, редактирование чувствительного текста, сравнение секретов за constant-time и вспомогательные средства сбора секретов |
    | `plugin-sdk/ssrf-policy` | Вспомогательные средства allowlist хостов и политики SSRF для частных сетей |
    | `plugin-sdk/ssrf-dispatcher` | Узкие вспомогательные средства pinned-dispatcher без широкой infra runtime-поверхности |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-защищенный fetch, ошибка SSRF и вспомогательные средства политики SSRF |
    | `plugin-sdk/secret-input` | Вспомогательные средства разбора ввода секретов |
    | `plugin-sdk/webhook-ingress` | Вспомогательные средства Webhook-запросов/целей и приведение raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Вспомогательные средства размера/timeout тела запроса |
  </Accordion>

  <Accordion title="Подпути времени выполнения и хранилища">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкие вспомогательные средства времени выполнения, журналирования, резервного копирования и установки Plugin |
    | `plugin-sdk/runtime-env` | Узкие вспомогательные средства окружения времени выполнения, логгера, тайм-аута, повторных попыток и backoff |
    | `plugin-sdk/browser-config` | Поддерживаемый фасад конфигурации браузера для нормализованного профиля/значений по умолчанию, разбора CDP URL и вспомогательных средств аутентификации управления браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Универсальные вспомогательные средства жизненного цикла задачи и доставки завершения для агентов на основе harness, использующих выданную хостом область задачи |
    | `plugin-sdk/codex-mcp-projection` | Зарезервированное bundled-вспомогательное средство Codex для проецирования пользовательской конфигурации MCP-сервера в конфигурацию потока Codex; не для сторонних plugins |
    | `plugin-sdk/codex-native-task-runtime` | Приватное bundled-вспомогательное средство Codex для зеркала нативных задач и связки времени выполнения; не для сторонних plugins |
    | `plugin-sdk/channel-runtime-context` | Универсальные вспомогательные средства регистрации и поиска контекста времени выполнения канала |
    | `plugin-sdk/matrix` | Устаревший фасад совместимости Matrix для старых сторонних пакетов каналов; новым plugins следует импортировать `plugin-sdk/run-command` напрямую |
    | `plugin-sdk/mattermost` | Устаревший фасад совместимости Mattermost для старых сторонних пакетов каналов; новым plugins следует импортировать универсальные подпути SDK напрямую |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Общие вспомогательные средства команд, хуков, HTTP и интерактивных функций Plugin |
    | `plugin-sdk/hook-runtime` | Общие вспомогательные средства конвейера webhook/внутренних хуков |
    | `plugin-sdk/lazy-runtime` | Вспомогательные средства ленивого импорта/привязки времени выполнения, такие как `createLazyRuntimeModule`, `createLazyRuntimeMethod` и `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Вспомогательные средства exec-процесса |
    | `plugin-sdk/cli-runtime` | Вспомогательные средства форматирования CLI, ожидания, версии, вызова аргументов и ленивых групп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Общие идентификаторы сценариев QA live transport, вспомогательные средства базового покрытия и выбора сценариев |
    | `plugin-sdk/gateway-method-runtime` | Зарезервированное вспомогательное средство диспетчеризации методов Gateway для HTTP-маршрутов Plugin, объявляющих `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клиент Gateway, вспомогательное средство запуска клиента с готовым event loop, Gateway CLI RPC, ошибки протокола Gateway и вспомогательные средства patch статуса канала |
    | `plugin-sdk/config-contracts` | Сфокусированная type-only поверхность конфигурации для форм конфигурации Plugin, таких как `OpenClawConfig`, и типов конфигурации каналов/провайдеров |
    | `plugin-sdk/plugin-config-runtime` | Вспомогательные средства поиска конфигурации Plugin во время выполнения, такие как `requireRuntimeConfig`, `resolvePluginConfigObject` и `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Транзакционные вспомогательные средства изменения конфигурации, такие как `mutateConfigFile`, `replaceConfigFile` и `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Общие строки подсказок метаданных доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Вспомогательные средства снимка конфигурации текущего процесса, такие как `getRuntimeConfig`, `getRuntimeConfigSnapshot`, и сеттеры снимков для тестов |
    | `plugin-sdk/telegram-command-config` | Нормализация имени/описания команд Telegram и проверки дубликатов/конфликтов, даже когда bundled-поверхность контракта Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Обнаружение autolink ссылок на файлы без широкого text barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки reaction для approval, payload prompt для reaction, хранилища целей reaction и экспорт совместимости для подавления локального нативного exec prompt |
    | `plugin-sdk/approval-runtime` | Вспомогательные средства approval для exec/Plugin, конструкторы approval capability, вспомогательные средства auth/profile, нативные вспомогательные средства маршрутизации/времени выполнения и форматирование структурированного пути отображения approval |
    | `plugin-sdk/reply-runtime` | Общие вспомогательные средства входящих сообщений/ответов во время выполнения, chunking, dispatch, Heartbeat, планировщик ответов |
    | `plugin-sdk/reply-dispatch-runtime` | Узкие вспомогательные средства dispatch/finalize ответов и меток бесед |
    | `plugin-sdk/reply-history` | Общие вспомогательные средства истории ответов для короткого окна. Новый код message-turn должен использовать `createChannelHistoryWindow`; низкоуровневые map-вспомогательные средства остаются только устаревшими экспортами совместимости |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Узкие вспомогательные средства chunking текста/Markdown |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства session workflow (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ограниченное чтение недавнего текста транскрипта пользователя/ассистента по идентичности сессии, вспомогательные средства legacy session store path/session-key, чтение updated-at и transition-only вспомогательные средства совместимости whole-store/file-path |
    | `plugin-sdk/session-transcript-runtime` | Идентичность транскрипта, вспомогательные средства target/read/write с областью, публикация обновлений, блокировки записи и ключи попаданий памяти транскрипта |
    | `plugin-sdk/sqlite-runtime` | Сфокусированные вспомогательные средства схемы агента SQLite, путей и транзакций для first-party времени выполнения |
    | `plugin-sdk/cron-store-runtime` | Вспомогательные средства пути/загрузки/сохранения хранилища Cron |
    | `plugin-sdk/state-paths` | Вспомогательные средства путей каталогов состояния/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типы Plugin sidecar SQLite keyed-state, а также централизованная pragma подключения и настройка обслуживания WAL для баз данных, принадлежащих Plugin |
    | `plugin-sdk/routing` | Вспомогательные средства маршрутов, session-key и привязки аккаунтов, такие как `resolveAgentRoute`, `buildAgentSessionKey` и `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Общие вспомогательные средства сводки статуса канала/аккаунта, значения по умолчанию runtime-state и вспомогательные средства метаданных issue |
    | `plugin-sdk/target-resolver-runtime` | Общие вспомогательные средства target resolver |
    | `plugin-sdk/string-normalization-runtime` | Вспомогательные средства нормализации slug/строк |
    | `plugin-sdk/request-url` | Извлечение строковых URL из fetch/request-like входных данных |
    | `plugin-sdk/run-command` | Средство запуска команд с таймингом и нормализованными результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Общие средства чтения параметров tool/CLI |
    | `plugin-sdk/tool-plugin` | Определение простого типизированного agent-tool Plugin и раскрытие статических метаданных для генерации манифеста |
    | `plugin-sdk/tool-payload` | Извлечение нормализованных payload из объектов результата tool |
    | `plugin-sdk/tool-send` | Извлечение канонических полей цели send из аргументов tool |
    | `plugin-sdk/sandbox` | Типы backend sandbox и вспомогательные средства команд SSH/OpenShell, включая preflight exec-команды с быстрым отказом |
    | `plugin-sdk/temp-path` | Общие вспомогательные средства путей temp-download и приватные безопасные временные рабочие области |
    | `plugin-sdk/logging-core` | Логгер подсистем и вспомогательные средства редактирования чувствительных данных |
    | `plugin-sdk/markdown-table-runtime` | Вспомогательные средства режима и преобразования Markdown-таблиц |
    | `plugin-sdk/model-session-runtime` | Вспомогательные средства переопределения модели/сессии, такие как `applyModelOverrideToSessionEntry` и `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Вспомогательные средства разрешения конфигурации провайдера Talk |
    | `plugin-sdk/json-store` | Небольшие вспомогательные средства чтения/записи JSON-состояния |
    | `plugin-sdk/json-unsafe-integers` | Вспомогательные средства разбора JSON, сохраняющие небезопасные целочисленные литералы как строки |
    | `plugin-sdk/file-lock` | Вспомогательные средства реентерабельной блокировки файлов |
    | `plugin-sdk/persistent-dedupe` | Вспомогательные средства dedupe-кэша на диске |
    | `plugin-sdk/acp-runtime` | Вспомогательные средства времени выполнения/сессии ACP и reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легковесная регистрация backend ACP и вспомогательные средства reply-dispatch для plugins, загруженных при запуске |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only разрешение привязок ACP без импортов запуска жизненного цикла |
    | `plugin-sdk/agent-config-primitives` | Узкие примитивы схемы конфигурации времени выполнения агента |
    | `plugin-sdk/boolean-param` | Нестрогий reader boolean-параметра |
    | `plugin-sdk/dangerous-name-runtime` | Вспомогательные средства разрешения совпадений dangerous-name |
    | `plugin-sdk/device-bootstrap` | Вспомогательные средства bootstrap устройства и токенов pairing |
    | `plugin-sdk/extension-shared` | Общие примитивы passive-channel, статуса и ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Вспомогательные средства ответов команды/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Вспомогательные средства перечисления команд Skills |
    | `plugin-sdk/native-command-registry` | Вспомогательные средства registry/build/serialize для нативных команд |
    | `plugin-sdk/agent-harness` | Экспериментальная поверхность trusted-plugin для низкоуровневых agent harnesses: типы harness, вспомогательные средства steer/abort active-run, вспомогательные средства моста инструментов OpenClaw, вспомогательные средства политики инструментов runtime-plan, классификация terminal outcome, вспомогательные средства форматирования/детализации прогресса tool и утилиты результата попытки |
    | `plugin-sdk/provider-zai-endpoint` | Устаревший фасад обнаружения endpoint, принадлежащего провайдеру Z.AI; используйте публичный API Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Вспомогательное средство process-local async lock для небольших файлов состояния времени выполнения |
    | `plugin-sdk/channel-activity-runtime` | Вспомогательное средство телеметрии активности канала |
    | `plugin-sdk/concurrency-runtime` | Вспомогательное средство ограниченной concurrency асинхронных задач |
    | `plugin-sdk/dedupe-runtime` | Вспомогательные средства in-memory dedupe-кэша |
    | `plugin-sdk/delivery-queue-runtime` | Вспомогательное средство drain исходящей pending-delivery |
    | `plugin-sdk/file-access-runtime` | Вспомогательные средства безопасных путей локальных файлов и media-source |
    | `plugin-sdk/heartbeat-runtime` | Вспомогательные средства wake, event и visibility для Heartbeat |
    | `plugin-sdk/number-runtime` | Вспомогательное средство числового приведения |
    | `plugin-sdk/secure-random-runtime` | Вспомогательные средства безопасных token/UUID |
    | `plugin-sdk/system-event-runtime` | Вспомогательные средства очереди системных событий |
    | `plugin-sdk/transport-ready-runtime` | Вспомогательное средство ожидания готовности transport |
    | `plugin-sdk/exec-approvals-runtime` | Вспомогательные средства файлов политики approval для exec без широкого infra-runtime barrel |
    | `plugin-sdk/infra-runtime` | Устаревшая shim совместимости; используйте сфокусированные подпути времени выполнения выше |
    | `plugin-sdk/collection-runtime` | Небольшие вспомогательные средства ограниченного кэша |
    | `plugin-sdk/diagnostic-runtime` | Вспомогательные средства diagnostic flag, event и trace-context |
    | `plugin-sdk/error-runtime` | Error graph, форматирование, общие вспомогательные средства классификации ошибок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обернутый fetch, proxy, опция EnvHttpProxyAgent и вспомогательные средства pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware fetch времени выполнения без импортов proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer inline image data URL и вспомогательные средства sniffing сигнатуры без широкой поверхности media runtime |
    | `plugin-sdk/response-limit-runtime` | Ограниченный reader тела ответа без широкой поверхности media runtime |
    | `plugin-sdk/session-binding-runtime` | Текущее состояние привязки беседы без configured binding routing или pairing stores |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства session-store без широких импортов записи/обслуживания конфигурации |
    | `plugin-sdk/sqlite-runtime` | Сфокусированные вспомогательные средства схемы агента SQLite, путей и транзакций без управления жизненным циклом базы данных |
    | `plugin-sdk/context-visibility-runtime` | Разрешение видимости контекста и фильтрация дополнительного контекста без широких импортов конфигурации/безопасности |
    | `plugin-sdk/string-coerce-runtime` | Узкие вспомогательные средства приведения и нормализации primitive record/string без импортов markdown/logging |
    | `plugin-sdk/host-runtime` | Вспомогательные средства нормализации hostname и SCP host |
    | `plugin-sdk/retry-runtime` | Вспомогательные средства конфигурации retry и runner повторных попыток |
    | `plugin-sdk/agent-runtime` | Вспомогательные средства каталогов/идентичности/рабочей области агента, включая `resolveAgentDir`, `resolveDefaultAgentDir` и устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запрос/дедупликация каталогов на основе конфигурации |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Подпути возможностей и тестирования">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Общие вспомогательные средства для получения, преобразования и хранения медиа, включая `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` и устаревший `fetchRemoteMedia`; предпочитайте вспомогательные средства хранилища чтению буфера, когда URL должен стать медиа OpenClaw |
    | `plugin-sdk/media-mime` | Узкая нормализация MIME, сопоставление расширений файлов, определение MIME и вспомогательные средства типа медиа |
    | `plugin-sdk/media-store` | Узкие вспомогательные средства хранилища медиа, такие как `saveMediaBuffer` и `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Общие вспомогательные средства резервного переключения генерации медиа, выбора кандидатов и сообщений об отсутствующей модели |
    | `plugin-sdk/media-understanding` | Типы провайдеров понимания медиа и экспорты вспомогательных средств для провайдеров для изображений, аудио и структурированного извлечения |
    | `plugin-sdk/text-chunking` | Вспомогательные средства разбиения и рендеринга текста и markdown, преобразование таблиц markdown, удаление тегов директив и утилиты безопасного текста |
    | `plugin-sdk/text-chunking` | Вспомогательное средство разбиения исходящего текста |
    | `plugin-sdk/speech` | Типы провайдеров речи, а также экспорты директив, реестра, валидации, OpenAI-совместимого конструктора TTS и речевых вспомогательных средств для провайдеров |
    | `plugin-sdk/speech-core` | Общие типы провайдеров речи, реестр, директива, нормализация и экспорты речевых вспомогательных средств |
    | `plugin-sdk/realtime-transcription` | Типы провайдеров транскрипции в реальном времени, вспомогательные средства реестра и общий помощник сессий WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Вспомогательное средство начальной загрузки профиля в реальном времени для ограниченного внедрения контекста `IDENTITY.md`, `USER.md` и `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типы провайдеров голоса в реальном времени, вспомогательные средства реестра и общие вспомогательные средства поведения голоса в реальном времени, включая отслеживание активности вывода |
    | `plugin-sdk/image-generation` | Типы провайдеров генерации изображений, вспомогательные средства URL для ресурсов/данных изображений и OpenAI-совместимый конструктор провайдера изображений |
    | `plugin-sdk/image-generation-core` | Общие типы генерации изображений, резервное переключение, аутентификация и вспомогательные средства реестра |
    | `plugin-sdk/music-generation` | Типы провайдеров, запросов и результатов генерации музыки |
    | `plugin-sdk/music-generation-core` | Общие типы генерации музыки, вспомогательные средства резервного переключения, поиск провайдера и разбор ссылок на модели |
    | `plugin-sdk/video-generation` | Типы провайдеров, запросов и результатов генерации видео |
    | `plugin-sdk/video-generation-core` | Общие типы генерации видео, вспомогательные средства резервного переключения, поиск провайдера и разбор ссылок на модели |
    | `plugin-sdk/transcripts` | Общие типы провайдеров источников транскриптов, вспомогательные средства реестра, дескрипторы сессий и метаданные реплик |
    | `plugin-sdk/webhook-targets` | Реестр целей Webhook и вспомогательные средства установки маршрутов |
    | `plugin-sdk/webhook-path` | Устаревший псевдоним совместимости; используйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Общие вспомогательные средства загрузки удаленных/локальных медиа |
    | `plugin-sdk/zod` | Устаревший реэкспорт совместимости; импортируйте `zod` напрямую из `zod` |
    | `plugin-sdk/testing` | Устаревший совместимый barrel внутри репозитория для устаревших тестов OpenClaw. Новые тесты репозитория должны вместо этого импортировать сфокусированные локальные тестовые подпути, такие как `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` или `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Минимальное вспомогательное средство `createTestPluginApi` внутри репозитория для модульных тестов прямой регистрации Plugin без импорта мостов тестовых вспомогательных средств репозитория |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативные фикстуры контрактов адаптера agent-runtime внутри репозитория для тестов аутентификации, доставки, резервного режима, tool-hook, prompt-overlay, схемы и проекции транскрипта |
    | `plugin-sdk/channel-test-helpers` | Ориентированные на каналы тестовые вспомогательные средства внутри репозитория для контрактов общих действий/настройки/статуса, проверок каталогов, жизненного цикла запуска учетной записи, поточности send-config, mock-объектов runtime, проблем статуса, исходящей доставки и регистрации hook |
    | `plugin-sdk/channel-target-testing` | Общий набор тестов случаев ошибок разрешения целей внутри репозитория для тестов каналов |
    | `plugin-sdk/plugin-test-contracts` | Вспомогательные средства контрактов внутри репозитория для пакета Plugin, регистрации, публичного артефакта, прямого импорта, runtime API и побочных эффектов импорта |
    | `plugin-sdk/provider-test-contracts` | Вспомогательные средства контрактов внутри репозитория для runtime провайдера, аутентификации, обнаружения, onboard, каталога, мастера, возможностей медиа, политики replay, realtime STT live-audio, web-search/fetch и stream |
    | `plugin-sdk/provider-http-test-mocks` | Подключаемые mock-объекты Vitest HTTP/аутентификации внутри репозитория для тестов провайдеров, которые используют `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Общие фикстуры внутри репозитория для захвата runtime CLI, контекста песочницы, writer Skills, agent-message, system-event, перезагрузки модуля, пути bundled Plugin, terminal-text, chunking, auth-token и typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусированные вспомогательные средства mock для встроенных модулей Node внутри репозитория для использования в фабриках Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Подпути памяти">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхность вспомогательных средств bundled memory-core для вспомогательных средств менеджера/конфигурации/файлов/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime индекса/поиска памяти |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легковесные вспомогательные средства реестра провайдеров embedding памяти |
    | `plugin-sdk/memory-core-host-engine-foundation` | Экспорты foundation-движка хоста памяти |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракты embedding хоста памяти, доступ к реестру, локальный провайдер и общие batch/remote вспомогательные средства. `registerMemoryEmbeddingProvider` на этой поверхности устарел; используйте общий API провайдера embedding для новых провайдеров. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Экспорты QMD-движка хоста памяти |
    | `plugin-sdk/memory-core-host-engine-storage` | Экспорты движка хранилища хоста памяти |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные вспомогательные средства хоста памяти |
    | `plugin-sdk/memory-core-host-query` | Вспомогательные средства запросов хоста памяти |
    | `plugin-sdk/memory-core-host-secret` | Вспомогательные средства секретов хоста памяти |
    | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Вспомогательные средства статуса хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-cli` | Вспомогательные средства runtime CLI хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-core` | Вспомогательные средства core runtime хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-files` | Вспомогательные средства файлов/runtime хоста памяти |
    | `plugin-sdk/memory-host-core` | Нейтральный к поставщику псевдоним вспомогательных средств core runtime хоста памяти |
    | `plugin-sdk/memory-host-events` | Нейтральный к поставщику псевдоним вспомогательных средств журнала событий хоста памяти |
    | `plugin-sdk/memory-host-files` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Общие вспомогательные средства managed-markdown для смежных с памятью Plugin |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active memory для доступа к search-manager |
    | `plugin-sdk/memory-host-status` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервированные подпути bundled-helper">
    Зарезервированные подпути SDK bundled-helper — это узкие поверхности, специфичные для владельца, для
    кода bundled Plugin. Они отслеживаются в инвентаре SDK, чтобы сборки
    пакетов и псевдонимы оставались детерминированными, но они не являются общими API
    для разработки Plugin. Новые переиспользуемые контракты хоста должны использовать общие подпути SDK,
    такие как `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
    `plugin-sdk/plugin-config-runtime`.

    | Подпуть | Владелец и назначение |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Вспомогательное средство bundled Codex Plugin для проекции пользовательской конфигурации MCP-сервера в конфигурацию thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Вспомогательное средство bundled Codex Plugin для зеркалирования нативных subagents app-server Codex в состояние задач OpenClaw |

  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Обзор Plugin SDK](/ru/plugins/sdk-overview)
- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание Plugin](/ru/plugins/building-plugins)
