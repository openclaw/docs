---
read_when:
    - Выбор правильного подпути plugin-sdk для импорта Plugin
    - Аудит подпутей bundled-plugin и вспомогательных поверхностей
summary: 'Каталог подпутей Plugin SDK: где находятся импорты, сгруппировано по областям'
title: Подпути Plugin SDK
x-i18n:
    generated_at: "2026-06-28T23:32:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK плагинов предоставляется как набор узких публичных подпутей в
`openclaw/plugin-sdk/`. На этой странице перечислены часто используемые подпути, сгруппированные по
назначению. Сгенерированный реестр точек входа компилятора находится в
`scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакета являются публичным подмножеством
после исключения локальных для репозитория тестовых/внутренних подпутей, перечисленных в
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Сопровождающие могут проверять
количество публичных экспортов с помощью `pnpm plugin-sdk:surface` и активные зарезервированные
вспомогательные подпути с помощью `pnpm plugins:boundary-report:summary`; неиспользуемые
зарезервированные вспомогательные экспорты приводят к сбою отчета CI, а не остаются в публичном SDK
как неактивный долг совместимости.

Руководство по созданию плагинов см. в разделе [Обзор Plugin SDK](/ru/plugins/sdk-overview).

## Точка входа плагина

| Подпуть                        | Ключевые экспорты                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Вспомогательные элементы провайдера миграции, такие как `createMigrationItem`, константы причин, маркеры статуса элементов, помощники редактирования и `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Вспомогательные средства миграции времени выполнения, такие как `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` и `writeMigrationReport`                                              |
| `plugin-sdk/health`            | Типы регистрации проверок работоспособности Doctor, обнаружения, исправления, выбора, серьезности и находок для встроенных потребителей работоспособности                                               |

### Устаревшая совместимость и тестовые помощники

Устаревшие подпути остаются экспортируемыми для старых плагинов, но новый код должен использовать
сфокусированные подпути SDK ниже. Поддерживаемый список находится в
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI отклоняет производственные импорты
встроенных плагинов из него. Широкие barrel-экспорты, такие как `compat`, `config-types`,
`infra-runtime`, `text-runtime` и `zod`, предназначены только для совместимости. Импортируйте `zod`
напрямую из `zod`.

Подпути тестовых помощников OpenClaw на базе Vitest предназначены только для локального использования
в репозитории и больше не являются экспортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` и `testing`.

### Зарезервированные подпути помощников встроенных плагинов

Эти подпути являются принадлежащими плагинам поверхностями совместимости для соответствующих
встроенных плагинов, а не общими API SDK: `plugin-sdk/codex-mcp-projection` и
`plugin-sdk/codex-native-task-runtime`. Импорты расширений между разными владельцами блокируются
ограничениями контракта пакета.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Корневой экспорт схемы `openclaw.json` Zod (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кэшированный помощник проверки JSON Schema для схем, принадлежащих plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Общие помощники мастера настройки, переводчик настройки, запросы allowlist, построители статуса настройки |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним совместимости; используйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помощники конфигурации с несколькими аккаунтами/шлюза действий, помощники резервного выбора аккаунта по умолчанию |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помощники нормализации account-id |
    | `plugin-sdk/account-resolution` | Помощники поиска аккаунта и резервного выбора по умолчанию |
    | `plugin-sdk/account-helpers` | Узкие помощники списка аккаунтов/действий аккаунта |
    | `plugin-sdk/access-groups` | Помощники разбора allowlist группы доступа и диагностики групп с редактированием секретных данных |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Общие примитивы схемы конфигурации канала, а также построители Zod и прямые построители JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схемы конфигурации каналов OpenClaw в комплекте только для поддерживаемых встроенных plugin |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонические идентификаторы встроенных/официальных чат-каналов, а также метки/псевдонимы форматтера для plugins, которым нужно распознавать текст с префиксом конверта без жесткого задания собственной таблицы. |
    | `plugin-sdk/channel-config-schema-legacy` | Устаревший псевдоним совместимости для схем конфигурации встроенных каналов |
    | `plugin-sdk/telegram-command-config` | Помощники нормализации/проверки пользовательских команд Telegram с резервным поведением по контракту встроенного компонента |
    | `plugin-sdk/command-gating` | Узкие помощники шлюза авторизации команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Устаревший низкоуровневый фасад совместимости входящего потока канала. Новые пути получения должны использовать `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Экспериментальный высокоуровневый резолвер среды выполнения входящего потока канала и построители фактов маршрута для мигрированных путей получения каналов. Предпочитайте его сборке эффективных allowlist, allowlist команд и устаревших проекций в каждом plugin. См. [API входящего потока канала](/ru/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракты жизненного цикла сообщений, а также параметры конвейера ответов, квитанции, предпросмотр/потоковая передача в реальном времени, помощники жизненного цикла, исходящая идентичность, планирование полезной нагрузки, устойчивые отправки и помощники контекста отправки сообщений. См. [API исходящего потока канала](/ru/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также устаревшие фасады диспетчеризации ответов. |
    | `plugin-sdk/channel-message-runtime` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также устаревшие фасады диспетчеризации ответов. |
    | `plugin-sdk/inbound-envelope` | Общие помощники входящего маршрута и построителя конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-inbound` для входящих исполнителей и предикатов диспетчеризации, а `plugin-sdk/channel-outbound` для помощников доставки сообщений. |
    | `plugin-sdk/messaging-targets` | Устаревший псевдоним разбора цели; используйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Общие помощники загрузки исходящих медиа и состояния размещенных медиа |
    | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Узкие помощники нормализации опросов |
    | `plugin-sdk/thread-bindings-runtime` | Помощники жизненного цикла привязки тредов и адаптеров |
    | `plugin-sdk/agent-media-payload` | Устаревший построитель полезной нагрузки медиа агента |
    | `plugin-sdk/conversation-runtime` | Помощники привязки, сопряжения и настроенной привязки беседы/треда |
    | `plugin-sdk/runtime-config-snapshot` | Помощник снимка конфигурации среды выполнения |
    | `plugin-sdk/runtime-group-policy` | Помощники разрешения политики групп в среде выполнения |
    | `plugin-sdk/channel-status` | Общие помощники снимка/сводки статуса канала |
    | `plugin-sdk/channel-config-primitives` | Узкие примитивы схемы конфигурации канала |
    | `plugin-sdk/channel-config-writes` | Помощники авторизации записи конфигурации канала |
    | `plugin-sdk/channel-plugin-common` | Общие экспорты прелюдии plugin канала |
    | `plugin-sdk/allowlist-config-edit` | Помощники редактирования/чтения конфигурации allowlist |
    | `plugin-sdk/group-access` | Общие помощники принятия решений о групповом доступе |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Узкие помощники политики защиты прямых DM до шифрования |
    | `plugin-sdk/discord` | Устаревший фасад совместимости Discord для опубликованного `@openclaw/discord@2026.3.13` и отслеживаемой совместимости владельца; новые plugins должны использовать универсальные подпути SDK канала |
    | `plugin-sdk/telegram-account` | Устаревший фасад совместимости разрешения аккаунтов Telegram для отслеживаемой совместимости владельца; новые plugins должны использовать внедренные помощники среды выполнения или универсальные подпути SDK канала |
    | `plugin-sdk/zalouser` | Устаревший фасад совместимости Zalo Personal для опубликованных пакетов Lark/Zalo, которые все еще импортируют авторизацию команд отправителя; новые plugins должны использовать `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантическое представление сообщений, доставка и устаревшие помощники интерактивных ответов. См. [Представление сообщений](/ru/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Общие входящие помощники для классификации событий, построения контекста, форматирования, корней, debounce, сопоставления упоминаний, политики упоминаний и входящего логирования |
    | `plugin-sdk/channel-inbound-debounce` | Узкие помощники входящего debounce |
    | `plugin-sdk/channel-mention-gating` | Узкие помощники политики упоминаний, маркера упоминания и текста упоминания без более широкой поверхности входящей среды выполнения |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound` или `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типы результатов ответа |
    | `plugin-sdk/channel-actions` | Помощники действий сообщений канала, а также устаревшие помощники нативных схем, сохраненные для совместимости plugin |
    | `plugin-sdk/channel-route` | Общая нормализация маршрутов, разрешение целей на основе парсера, преобразование thread-id в строку, ключи маршрутов dedupe/compact, типы разобранных целей и помощники сравнения маршрутов/целей |
    | `plugin-sdk/channel-targets` | Помощники разбора целей; вызывающие сравнение маршрутов должны использовать `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типы контрактов канала |
    | `plugin-sdk/channel-feedback` | Связка обратной связи/реакций |
    | `plugin-sdk/channel-secret-runtime` | Узкие помощники контрактов секретов, такие как `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, и типы целей секретов |
  </Accordion>

Устаревшие семейства вспомогательных функций каналов остаются доступны только для
совместимости опубликованных Plugin. План удаления таков: сохранить их на время окна
миграции внешних Plugin, оставить репозиторные/встроенные Plugin на `channel-inbound` и
`channel-outbound`, затем удалить подпути совместимости в следующей крупной
очистке SDK. Это относится к старым семействам сообщения/среды выполнения канала, потоковой передачи канала, доступа к прямым DM, ответвления входящих вспомогательных функций, параметров ответа
и пути связывания.

  <Accordion title="Подпути провайдеров">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Поддерживаемый фасад провайдера LM Studio для настройки, обнаружения каталога и подготовки модели во время выполнения |
    | `plugin-sdk/lmstudio-runtime` | Поддерживаемый фасад среды выполнения LM Studio для локальных значений сервера по умолчанию, обнаружения моделей, заголовков запросов и вспомогательных средств для загруженных моделей |
    | `plugin-sdk/provider-setup` | Подобранные вспомогательные средства настройки локальных/самостоятельно размещаемых провайдеров |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусированные вспомогательные средства настройки самостоятельно размещаемых OpenAI-совместимых провайдеров |
    | `plugin-sdk/cli-backend` | Значения по умолчанию для бэкенда CLI + константы watchdog |
    | `plugin-sdk/provider-auth-runtime` | Вспомогательные средства разрешения API-ключей во время выполнения для плагинов провайдеров |
    | `plugin-sdk/provider-oauth-runtime` | Общие типы обратных вызовов OAuth для провайдеров, рендеринг страницы обратного вызова, вспомогательные средства PKCE/state, разбор входных данных авторизации, вспомогательные средства истечения срока действия токенов и вспомогательные средства прерывания |
    | `plugin-sdk/provider-auth-api-key` | Вспомогательные средства онбординга API-ключа/записи профиля, такие как `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартный построитель результата OAuth-аутентификации |
    | `plugin-sdk/provider-env-vars` | Вспомогательные средства поиска переменных окружения для аутентификации провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, вспомогательные средства импорта аутентификации OpenAI Codex, устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители политик повторного воспроизведения, вспомогательные средства конечных точек провайдеров и общие вспомогательные средства нормализации идентификаторов моделей |
    | `plugin-sdk/provider-catalog-live-runtime` | Вспомогательные средства живого каталога моделей провайдера для защищенного обнаружения в стиле `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фильтрация идентификаторов моделей, TTL-кэш и статический резервный вариант |
    | `plugin-sdk/provider-catalog-runtime` | Хук среды выполнения для расширения каталога провайдера и швы реестра плагинов провайдеров для контрактных тестов |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Общие вспомогательные средства возможностей HTTP/конечных точек провайдеров, HTTP-ошибки провайдеров и вспомогательные средства multipart-форм для транскрипции аудио |
    | `plugin-sdk/provider-web-fetch-contract` | Узкие вспомогательные средства контракта конфигурации/выбора web-fetch, такие как `enablePluginInConfig` и `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Вспомогательные средства регистрации/кэша провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Узкие вспомогательные средства конфигурации/учетных данных web-search для провайдеров, которым не нужна проводка включения плагина |
    | `plugin-sdk/provider-web-search-contract` | Узкие вспомогательные средства контракта конфигурации/учетных данных web-search, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а также setter/getter для учетных данных с заданной областью |
    | `plugin-sdk/provider-web-search` | Вспомогательные средства регистрации/кэша/среды выполнения провайдера web-search |
    | `plugin-sdk/embedding-providers` | Общие типы провайдеров эмбеддингов и вспомогательные средства чтения, включая `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` и `listEmbeddingProviders(...)`; плагины регистрируют провайдеров через `api.registerEmbeddingProvider(...)`, чтобы право владения манифестом принудительно соблюдалось |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` и очистка схем + диагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типы снимков использования провайдера, общие вспомогательные средства получения использования и выборщики провайдеров, такие как `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы оберток потоков, совместимость вызовов инструментов в простом тексте и общие вспомогательные средства оберток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публичные общие вспомогательные средства оберток потоков провайдеров, включая `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` и утилиты потоков, совместимые с Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Вспомогательные средства нативного транспорта провайдера, такие как защищенный fetch, преобразования транспортных сообщений и записываемые потоки транспортных событий |
    | `plugin-sdk/provider-onboard` | Вспомогательные средства исправления конфигурации онбординга |
    | `plugin-sdk/global-singleton` | Вспомогательные средства локальных для процесса singleton/map/cache |
    | `plugin-sdk/group-activation` | Узкие вспомогательные средства режима активации группы и разбора команд |
  </Accordion>

Снимки использования провайдера обычно сообщают об одном или нескольких квотных `windows`, каждый из которых содержит
метку, использованный процент и необязательное время сброса. Провайдеры, которые предоставляют баланс или
текст состояния учетной записи вместо сбрасываемых квотных окон, должны возвращать
`summary` с пустым массивом `windows`, а не фабриковать проценты.
OpenClaw отображает этот текст сводки в выводе состояния; используйте `error` только тогда, когда
конечная точка использования завершилась с ошибкой или не вернула пригодных данных об использовании.

  <Accordion title="Подпути аутентификации и безопасности">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, вспомогательные средства реестра команд, включая форматирование меню динамических аргументов, вспомогательные средства авторизации отправителя |
    | `plugin-sdk/command-status` | Построители сообщений команд/справки, такие как `buildCommandsMessagePaginated` и `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Вспомогательные средства разрешения утверждающего и аутентификации действий в том же чате |
    | `plugin-sdk/approval-client-runtime` | Вспомогательные средства профилей/фильтров нативного утверждения exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптеры нативных возможностей/доставки утверждений |
    | `plugin-sdk/approval-gateway-runtime` | Общее вспомогательное средство разрешения Gateway утверждений |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковесные вспомогательные средства загрузки нативного адаптера утверждений для горячих точек входа каналов |
    | `plugin-sdk/approval-handler-runtime` | Более широкие вспомогательные средства среды выполнения обработчика утверждений; предпочитайте более узкие швы адаптера/Gateway, когда их достаточно |
    | `plugin-sdk/approval-native-runtime` | Вспомогательные средства нативной цели утверждения, привязки учетной записи, route-gate, резервной пересылки и подавления локального нативного запроса exec |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки реакций утверждения, payload запросов реакций, хранилища целей реакций и экспорт совместимости для подавления локального нативного запроса exec |
    | `plugin-sdk/approval-reply-runtime` | Вспомогательные средства payload ответа утверждения exec/plugin |
    | `plugin-sdk/approval-runtime` | Вспомогательные средства payload утверждения exec/plugin, вспомогательные средства маршрутизации/среды выполнения нативного утверждения и вспомогательные средства структурированного отображения утверждений, такие как `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Узкие вспомогательные средства сброса дедупликации входящих ответов |
    | `plugin-sdk/channel-contract-testing` | Узкие вспомогательные средства контрактных тестов каналов без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативная аутентификация команд, форматирование меню динамических аргументов и вспомогательные средства нативной цели сеанса |
    | `plugin-sdk/command-detection` | Общие вспомогательные средства обнаружения команд |
    | `plugin-sdk/command-primitives-runtime` | Легковесные предикаты текста команд для горячих путей каналов |
    | `plugin-sdk/command-surface` | Нормализация тела команды и вспомогательные средства поверхности команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Узкие вспомогательные средства сбора secret-contract для поверхностей секретов каналов/плагинов |
    | `plugin-sdk/secret-ref-runtime` | Узкие вспомогательные средства `coerceSecretRef` и типизации SecretRef для разбора secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Type-only манифест интеграции провайдера SecretRef и контракты preset для плагинов, публикующих внешние preset провайдеров секретов |
    | `plugin-sdk/security-runtime` | Общие вспомогательные средства доверия, gating DM, файлов/путей с ограничением корнем, включая записи только при создании, sync/async атомарную замену файлов, sibling temp-записи, резервный перенос между устройствами, вспомогательные средства private file-store, guards родительских symlink, external-content, редактирование чувствительного текста, сравнение секретов за постоянное время и вспомогательные средства сбора секретов |
    | `plugin-sdk/ssrf-policy` | Вспомогательные средства allowlist хостов и политики SSRF для частных сетей |
    | `plugin-sdk/ssrf-dispatcher` | Узкие вспомогательные средства pinned-dispatcher без широкой поверхности infra runtime |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, ошибка SSRF и вспомогательные средства политики SSRF |
    | `plugin-sdk/secret-input` | Вспомогательные средства разбора ввода секрета |
    | `plugin-sdk/webhook-ingress` | Вспомогательные средства запросов/целей Webhook и приведение raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Вспомогательные средства размера/тайм-аута тела запроса |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкие вспомогательные средства среды выполнения, журналирования, резервного копирования и установки плагинов |
    | `plugin-sdk/runtime-env` | Узкие вспомогательные средства env среды выполнения, логгера, таймаута, повторов и backoff |
    | `plugin-sdk/browser-config` | Поддерживаемый фасад конфигурации браузера для нормализованного профиля/значений по умолчанию, разбора CDP URL и вспомогательных средств аутентификации управления браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Универсальные вспомогательные средства жизненного цикла задач и доставки завершения для агентов на базе harness, использующих область задачи, выданную хостом |
    | `plugin-sdk/codex-mcp-projection` | Зарезервированное встроенное вспомогательное средство Codex для проецирования конфигурации MCP-сервера пользователя в конфигурацию потока Codex; не для сторонних плагинов |
    | `plugin-sdk/codex-native-task-runtime` | Приватное встроенное вспомогательное средство Codex для привязки зеркала нативной задачи/среды выполнения; не для сторонних плагинов |
    | `plugin-sdk/channel-runtime-context` | Универсальные вспомогательные средства регистрации и поиска runtime-context канала |
    | `plugin-sdk/matrix` | Устаревший фасад совместимости Matrix для старых сторонних пакетов каналов; новые плагины должны импортировать `plugin-sdk/run-command` напрямую |
    | `plugin-sdk/mattermost` | Устаревший фасад совместимости Mattermost для старых сторонних пакетов каналов; новые плагины должны импортировать универсальные подпути SDK напрямую |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Общие вспомогательные средства команд, хуков, HTTP и интерактивных возможностей плагина |
    | `plugin-sdk/hook-runtime` | Общие вспомогательные средства конвейера Webhook/внутренних хуков |
    | `plugin-sdk/lazy-runtime` | Вспомогательные средства ленивого импорта/привязки среды выполнения, такие как `createLazyRuntimeModule`, `createLazyRuntimeMethod` и `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Вспомогательные средства выполнения процессов |
    | `plugin-sdk/cli-runtime` | Вспомогательные средства форматирования CLI, ожидания, версии, вызова аргументов и ленивых групп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Общие идентификаторы сценариев QA для живого транспорта, вспомогательные средства базового покрытия и выбора сценариев |
    | `plugin-sdk/gateway-method-runtime` | Зарезервированное вспомогательное средство диспетчеризации методов Gateway для HTTP-маршрутов плагинов, объявляющих `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клиент Gateway, вспомогательное средство запуска клиента с готовым циклом событий, gateway CLI RPC, ошибки протокола gateway и вспомогательные средства patch для статуса канала |
    | `plugin-sdk/config-contracts` | Сфокусированная только типовая поверхность конфигурации для форм конфигурации плагинов, таких как `OpenClawConfig`, и типов конфигурации каналов/провайдеров |
    | `plugin-sdk/plugin-config-runtime` | Вспомогательные средства поиска конфигурации плагина в среде выполнения, такие как `requireRuntimeConfig`, `resolvePluginConfigObject` и `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Транзакционные вспомогательные средства изменения конфигурации, такие как `mutateConfigFile`, `replaceConfigFile` и `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Общие строки подсказок метаданных доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Вспомогательные средства снимка конфигурации текущего процесса, такие как `getRuntimeConfig`, `getRuntimeConfigSnapshot`, и сеттеры снимков для тестов |
    | `plugin-sdk/telegram-command-config` | Нормализация имени/описания команд Telegram и проверки дублей/конфликтов, даже когда встроенная поверхность контракта Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Обнаружение автоссылок на файловые ссылки без широкого text barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки реакций подтверждения, полезные нагрузки prompt реакций, хранилища целей реакций и экспорт совместимости для подавления локального нативного exec prompt |
    | `plugin-sdk/approval-runtime` | Вспомогательные средства подтверждения exec/плагинов, построители возможностей подтверждения, вспомогательные средства auth/профилей, вспомогательные средства нативной маршрутизации/среды выполнения и форматирование пути структурированного отображения подтверждения |
    | `plugin-sdk/reply-runtime` | Общие вспомогательные средства среды выполнения входящих сообщений/ответов, разбиение на фрагменты, диспетчеризация, Heartbeat, планировщик ответов |
    | `plugin-sdk/reply-dispatch-runtime` | Узкие вспомогательные средства диспетчеризации/завершения ответа и меток беседы |
    | `plugin-sdk/reply-history` | Общие вспомогательные средства истории ответов для короткого окна. Новый код message-turn должен использовать `createChannelHistoryWindow`; низкоуровневые вспомогательные средства map остаются только устаревшими экспортами совместимости |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Узкие вспомогательные средства разбиения текста/markdown |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства workflow сеансов (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ограниченные чтения недавнего текста transcript пользователя/ассистента по идентичности сеанса, устаревшие вспомогательные средства пути хранилища сеансов/session-key, чтения updated-at и переходные вспомогательные средства совместимости целого хранилища/пути файла |
    | `plugin-sdk/session-transcript-runtime` | Идентичность transcript, scoped вспомогательные средства цели/чтения/записи, публикация обновлений, блокировки записи и ключи попаданий памяти transcript |
    | `plugin-sdk/sqlite-runtime` | Сфокусированные вспомогательные средства схемы агента SQLite, путей и транзакций для first-party среды выполнения |
    | `plugin-sdk/cron-store-runtime` | Вспомогательные средства пути/загрузки/сохранения хранилища Cron |
    | `plugin-sdk/state-paths` | Вспомогательные средства путей каталогов state/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типы sidecar keyed-state SQLite для плагина, а также централизованная настройка pragma подключения и обслуживания WAL для баз данных, принадлежащих плагинам |
    | `plugin-sdk/routing` | Вспомогательные средства привязки маршрута/session-key/аккаунта, такие как `resolveAgentRoute`, `buildAgentSessionKey` и `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Общие вспомогательные средства сводки статуса канала/аккаунта, значения по умолчанию runtime-state и вспомогательные средства метаданных issue |
    | `plugin-sdk/target-resolver-runtime` | Общие вспомогательные средства target resolver |
    | `plugin-sdk/string-normalization-runtime` | Вспомогательные средства нормализации slug/строк |
    | `plugin-sdk/request-url` | Извлечение строковых URL из fetch/request-подобных входных данных |
    | `plugin-sdk/run-command` | Исполнитель команд с таймаутом и нормализованными результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Общие средства чтения параметров инструментов/CLI |
    | `plugin-sdk/tool-plugin` | Определение простого типизированного плагина agent-tool и предоставление статических метаданных для генерации манифеста |
    | `plugin-sdk/tool-payload` | Извлечение нормализованных полезных нагрузок из объектов результата инструмента |
    | `plugin-sdk/tool-send` | Извлечение канонических полей цели отправки из аргументов инструмента |
    | `plugin-sdk/sandbox` | Типы sandbox backend и вспомогательные средства команд SSH/OpenShell, включая fail-fast preflight для exec-команд |
    | `plugin-sdk/temp-path` | Общие вспомогательные средства путей временной загрузки и приватные безопасные временные рабочие области |
    | `plugin-sdk/logging-core` | Логгер подсистемы и вспомогательные средства редактирования секретов |
    | `plugin-sdk/markdown-table-runtime` | Вспомогательные средства режима таблиц Markdown и преобразования |
    | `plugin-sdk/model-session-runtime` | Вспомогательные средства переопределения модели/сеанса, такие как `applyModelOverrideToSessionEntry` и `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Вспомогательные средства разрешения конфигурации talk-провайдера |
    | `plugin-sdk/json-store` | Небольшие вспомогательные средства чтения/записи состояния JSON |
    | `plugin-sdk/json-unsafe-integers` | Вспомогательные средства разбора JSON, сохраняющие небезопасные целочисленные литералы как строки |
    | `plugin-sdk/file-lock` | Вспомогательные средства реентерабельной блокировки файлов |
    | `plugin-sdk/persistent-dedupe` | Вспомогательные средства дискового кэша дедупликации |
    | `plugin-sdk/acp-runtime` | Вспомогательные средства среды выполнения/сеансов ACP и диспетчеризации ответов |
    | `plugin-sdk/acp-runtime-backend` | Легковесные вспомогательные средства регистрации ACP backend и диспетчеризации ответов для плагинов, загружаемых при запуске |
    | `plugin-sdk/acp-binding-resolve-runtime` | Разрешение привязок ACP только для чтения без импортов запуска жизненного цикла |
    | `plugin-sdk/agent-config-primitives` | Узкие примитивы схемы конфигурации среды выполнения агента |
    | `plugin-sdk/boolean-param` | Нестрогий читатель boolean-параметров |
    | `plugin-sdk/dangerous-name-runtime` | Вспомогательные средства разрешения совпадений опасных имен |
    | `plugin-sdk/device-bootstrap` | Вспомогательные средства начальной настройки устройства и pairing token |
    | `plugin-sdk/extension-shared` | Общие примитивы вспомогательных средств passive-channel, статуса и ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Вспомогательные средства ответов команды/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Вспомогательные средства перечисления команд Skills |
    | `plugin-sdk/native-command-registry` | Вспомогательные средства реестра/сборки/сериализации нативных команд |
    | `plugin-sdk/agent-harness` | Экспериментальная поверхность доверенных плагинов для низкоуровневых agent harness: типы harness, вспомогательные средства steer/abort активного запуска, вспомогательные средства bridge инструментов OpenClaw, вспомогательные средства политики инструментов runtime-plan, классификация terminal outcome, вспомогательные средства форматирования/детализации прогресса инструментов и утилиты результата попытки |
    | `plugin-sdk/provider-zai-endpoint` | Устаревший фасад обнаружения endpoint, принадлежащего провайдеру Z.AI; используйте публичный API плагина Z.AI |
    | `plugin-sdk/async-lock-runtime` | Process-local вспомогательное средство async lock для небольших файлов состояния среды выполнения |
    | `plugin-sdk/channel-activity-runtime` | Вспомогательное средство телеметрии активности канала |
    | `plugin-sdk/concurrency-runtime` | Вспомогательное средство ограниченной конкуренции асинхронных задач |
    | `plugin-sdk/dedupe-runtime` | Вспомогательные средства in-memory кэша дедупликации |
    | `plugin-sdk/delivery-queue-runtime` | Вспомогательное средство drain для исходящих pending-delivery |
    | `plugin-sdk/file-access-runtime` | Вспомогательные средства безопасных путей локальных файлов и media-source |
    | `plugin-sdk/heartbeat-runtime` | Вспомогательные средства wake, event и visibility для Heartbeat |
    | `plugin-sdk/number-runtime` | Вспомогательное средство числового приведения |
    | `plugin-sdk/secure-random-runtime` | Вспомогательные средства безопасных token/UUID |
    | `plugin-sdk/system-event-runtime` | Вспомогательные средства очереди системных событий |
    | `plugin-sdk/transport-ready-runtime` | Вспомогательное средство ожидания готовности транспорта |
    | `plugin-sdk/exec-approvals-runtime` | Вспомогательные средства файлов политики exec-подтверждений без широкого infra-runtime barrel |
    | `plugin-sdk/infra-runtime` | Устаревший shim совместимости; используйте сфокусированные подпути среды выполнения выше |
    | `plugin-sdk/collection-runtime` | Небольшие вспомогательные средства ограниченного кэша |
    | `plugin-sdk/diagnostic-runtime` | Вспомогательные средства диагностических флагов, событий и trace-context |
    | `plugin-sdk/error-runtime` | Граф ошибок, форматирование, общие вспомогательные средства классификации ошибок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обернутый fetch, proxy, опция EnvHttpProxyAgent и вспомогательные средства pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware fetch среды выполнения без импортов proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Санитайзер inline image data URL и вспомогательные средства sniffing сигнатур без широкой поверхности media runtime |
    | `plugin-sdk/response-limit-runtime` | Ограниченный читатель тела ответа без широкой поверхности media runtime |
    | `plugin-sdk/session-binding-runtime` | Текущее состояние привязки беседы без configured binding routing или хранилищ pairing |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства session-store без широких импортов записи/обслуживания конфигурации |
    | `plugin-sdk/sqlite-runtime` | Сфокусированные вспомогательные средства схемы агента SQLite, путей и транзакций без средств управления жизненным циклом базы данных |
    | `plugin-sdk/context-visibility-runtime` | Разрешение видимости контекста и фильтрация дополнительного контекста без широких импортов конфигурации/безопасности |
    | `plugin-sdk/string-coerce-runtime` | Узкие вспомогательные средства приведения и нормализации примитивных record/строк без импортов markdown/журналирования |
    | `plugin-sdk/host-runtime` | Вспомогательные средства нормализации hostname и SCP host |
    | `plugin-sdk/retry-runtime` | Вспомогательные средства конфигурации повторов и исполнителя повторов |
    | `plugin-sdk/agent-runtime` | Вспомогательные средства каталогов/идентичности/рабочих областей агента, включая `resolveAgentDir`, `resolveDefaultAgentDir` и устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запрос/дедупликация каталогов на базе конфигурации |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Подпути возможностей и тестирования">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Общие помощники для получения, преобразования и хранения медиа, включая `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` и устаревший `fetchRemoteMedia`; предпочитайте помощники хранилища чтению буфера, когда URL должен стать медиа OpenClaw |
    | `plugin-sdk/media-mime` | Узкая нормализация MIME, сопоставление расширений файлов, определение MIME и помощники для видов медиа |
    | `plugin-sdk/media-store` | Узкие помощники хранилища медиа, такие как `saveMediaBuffer` и `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Общие помощники отказоустойчивости генерации медиа, выбора кандидатов и сообщений об отсутствующей модели |
    | `plugin-sdk/media-understanding` | Типы провайдеров понимания медиа, а также экспорты помощников для провайдеров изображений, аудио и структурированного извлечения |
    | `plugin-sdk/text-chunking` | Помощники разбиения и рендеринга текста и markdown, преобразование таблиц markdown, удаление тегов директив и утилиты безопасного текста |
    | `plugin-sdk/text-chunking` | Помощник разбиения исходящего текста |
    | `plugin-sdk/speech` | Типы провайдеров речи, а также экспорты директив, реестра, валидации, OpenAI-совместимого конструктора TTS и речевых помощников для провайдеров |
    | `plugin-sdk/speech-core` | Общие типы провайдеров речи, реестр, директива, нормализация и экспорты речевых помощников |
    | `plugin-sdk/realtime-transcription` | Типы провайдеров транскрипции в реальном времени, помощники реестра и общий помощник сессии WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Помощник начальной загрузки профиля реального времени для ограниченного внедрения контекста `IDENTITY.md`, `USER.md` и `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типы провайдеров голоса в реальном времени, помощники реестра и общие помощники поведения голоса в реальном времени, включая отслеживание активности вывода |
    | `plugin-sdk/image-generation` | Типы провайдеров генерации изображений, а также помощники URL для ресурсов/данных изображений и OpenAI-совместимый конструктор провайдера изображений |
    | `plugin-sdk/image-generation-core` | Общие типы генерации изображений, отказоустойчивость, аутентификация и помощники реестра |
    | `plugin-sdk/music-generation` | Типы провайдера, запроса и результата генерации музыки |
    | `plugin-sdk/music-generation-core` | Общие типы генерации музыки, помощники отказоустойчивости, поиск провайдера и разбор ссылки на модель |
    | `plugin-sdk/video-generation` | Типы провайдера, запроса и результата генерации видео |
    | `plugin-sdk/video-generation-core` | Общие типы генерации видео, помощники отказоустойчивости, поиск провайдера и разбор ссылки на модель |
    | `plugin-sdk/transcripts` | Общие типы провайдера источника транскриптов, помощники реестра, дескрипторы сессий и метаданные высказываний |
    | `plugin-sdk/webhook-targets` | Реестр целевых Webhook и помощники установки маршрутов |
    | `plugin-sdk/webhook-path` | Устаревший псевдоним совместимости; используйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Общие помощники загрузки удаленных/локальных медиа |
    | `plugin-sdk/zod` | Устаревший реэкспорт совместимости; импортируйте `zod` напрямую из `zod` |
    | `plugin-sdk/testing` | Локальный для репозитория устаревший barrel совместимости для унаследованных тестов OpenClaw. Новые тесты репозитория должны вместо этого импортировать сфокусированные локальные тестовые подпути, такие как `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` или `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальный для репозитория минимальный помощник `createTestPluginApi` для модульных тестов прямой регистрации плагинов без импорта мостов тестовых помощников репозитория |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальные для репозитория фикстуры контрактов нативного адаптера среды выполнения агента для тестов аутентификации, доставки, резервного пути, tool-hook, prompt-overlay, схемы и проекции транскрипта |
    | `plugin-sdk/channel-test-helpers` | Локальные для репозитория тестовые помощники, ориентированные на каналы, для общих контрактов действий/настройки/статуса, проверок каталогов, жизненного цикла запуска учетной записи, потоковой передачи send-config, моков среды выполнения, проблем статуса, исходящей доставки и регистрации хуков |
    | `plugin-sdk/channel-target-testing` | Локальный для репозитория общий набор случаев ошибок разрешения цели для тестов каналов |
    | `plugin-sdk/plugin-test-contracts` | Локальные для репозитория помощники контрактов пакета плагина, регистрации, публичного артефакта, прямого импорта, API среды выполнения и побочных эффектов импорта |
    | `plugin-sdk/provider-test-contracts` | Локальные для репозитория помощники контрактов среды выполнения провайдера, аутентификации, обнаружения, подключения, каталога, мастера, возможностей медиа, политики воспроизведения, live-audio STT в реальном времени, web-search/fetch и потоков |
    | `plugin-sdk/provider-http-test-mocks` | Локальные для репозитория opt-in HTTP/аутентификационные моки Vitest для тестов провайдеров, которые проверяют `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Локальные для репозитория универсальные фикстуры захвата среды выполнения CLI, контекста песочницы, автора skill, agent-message, system-event, перезагрузки модуля, пути встроенного плагина, terminal-text, разбиения, auth-token и typed-case |
    | `plugin-sdk/test-node-mocks` | Локальные для репозитория сфокусированные помощники моков встроенных модулей Node для использования внутри фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Подпути памяти">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхность встроенных помощников memory-core для менеджера/конфигурации/файлов/помощников CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад среды выполнения индекса/поиска памяти |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легковесные помощники реестра провайдеров эмбеддингов памяти |
    | `plugin-sdk/memory-core-host-engine-foundation` | Экспорты фундаментального движка хоста памяти |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракты эмбеддингов хоста памяти, доступ к реестру, локальный провайдер и универсальные пакетные/удаленные помощники. `registerMemoryEmbeddingProvider` на этой поверхности устарел; для новых провайдеров используйте универсальный API провайдера эмбеддингов. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Экспорты движка QMD хоста памяти |
    | `plugin-sdk/memory-core-host-engine-storage` | Экспорты движка хранилища хоста памяти |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные помощники хоста памяти |
    | `plugin-sdk/memory-core-host-query` | Помощники запросов хоста памяти |
    | `plugin-sdk/memory-core-host-secret` | Помощники секретов хоста памяти |
    | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Помощники статуса хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помощники среды выполнения CLI хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-core` | Помощники базовой среды выполнения хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-files` | Помощники файлов/среды выполнения хоста памяти |
    | `plugin-sdk/memory-host-core` | Вендор-нейтральный псевдоним для помощников базовой среды выполнения хоста памяти |
    | `plugin-sdk/memory-host-events` | Вендор-нейтральный псевдоним для помощников журнала событий хоста памяти |
    | `plugin-sdk/memory-host-files` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Общие помощники управляемого markdown для плагинов, смежных с памятью |
    | `plugin-sdk/memory-host-search` | Фасад среды выполнения Active Memory для доступа к search-manager |
    | `plugin-sdk/memory-host-status` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервированные подпути встроенных помощников">
    Зарезервированные подпути SDK встроенных помощников — это узкие поверхности,
    специфичные для владельца, для кода встроенных плагинов. Они отслеживаются в
    инвентаре SDK, чтобы сборки пакетов и псевдонимы оставались детерминированными,
    но они не являются общими API для разработки плагинов. Новые переиспользуемые
    контракты хоста должны использовать универсальные подпути SDK, такие как
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
    `plugin-sdk/plugin-config-runtime`.

    | Подпуть | Владелец и назначение |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Помощник встроенного плагина Codex для проецирования пользовательской конфигурации сервера MCP в конфигурацию потока app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Помощник встроенного плагина Codex для зеркалирования нативных субагентов app-server Codex в состояние задач OpenClaw |

  </Accordion>
</AccordionGroup>

## Связано

- [Обзор Plugin SDK](/ru/plugins/sdk-overview)
- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание плагинов](/ru/plugins/building-plugins)
