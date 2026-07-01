---
read_when:
    - Выбор правильного подпути plugin-sdk для импорта Plugin
    - Аудит подпутей bundled-Plugin и вспомогательных поверхностей
summary: 'Каталог подпутей Plugin SDK: какие импорты где находятся, сгруппированные по областям'
title: Подпути Plugin SDK
x-i18n:
    generated_at: "2026-07-01T20:28:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK для Plugin предоставляется как набор узких публичных подпутей в
`openclaw/plugin-sdk/`. На этой странице перечислены часто используемые подпути,
сгруппированные по назначению. Сгенерированный реестр точек входа компилятора
находится в `scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакета являются
публичным подмножеством после вычитания локальных для репозитория тестовых и
внутренних подпутей, перечисленных в
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Сопровождающие могут
проверить количество публичных экспортов с помощью `pnpm plugin-sdk:surface`, а
активные зарезервированные подпути вспомогательных функций — с помощью
`pnpm plugins:boundary-report:summary`; неиспользуемые зарезервированные
экспорты вспомогательных функций проваливают отчет CI, а не остаются в публичном
SDK как неактивный долг совместимости.

Руководство по созданию Plugin см. в разделе [Обзор SDK Plugin](/ru/plugins/sdk-overview).

## Точка входа Plugin

| Подпуть                        | Ключевые экспорты                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Вспомогательные элементы поставщика миграций, такие как `createMigrationItem`, константы причин, маркеры статуса элементов, вспомогательные функции редактирования и `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Вспомогательные функции миграции во время выполнения, такие как `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` и `writeMigrationReport`                   |
| `plugin-sdk/health`            | Типы для регистрации проверок работоспособности Doctor, обнаружения, исправления, выбора, серьезности и находок для встроенных потребителей состояния                  |

### Устаревшая совместимость и тестовые вспомогательные функции

Устаревшие подпути остаются экспортируемыми для старых Plugin, но новый код
должен использовать более специализированные подпути SDK ниже. Поддерживаемый
список находится в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI
отклоняет их импорты из встроенного производственного кода. Широкие barrels,
такие как `compat`, `config-types`, `infra-runtime`, `text-runtime` и `zod`,
предназначены только для совместимости. Импортируйте `zod` напрямую из `zod`.

Подпути тестовых вспомогательных функций OpenClaw на базе Vitest являются только
локальными для репозитория и больше не экспортируются из пакета:
`agent-runtime-test-contracts`, `channel-contract-testing`,
`channel-target-testing`, `channel-test-helpers`, `plugin-test-api`,
`plugin-test-contracts`, `plugin-test-runtime`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks` и
`testing`.

### Зарезервированные подпути вспомогательных функций встроенных Plugin

Эти подпути являются поверхностями совместимости, принадлежащими Plugin, для
соответствующего встроенного Plugin, а не общими API SDK:
`plugin-sdk/codex-mcp-projection` и `plugin-sdk/codex-native-task-runtime`.
Импорты расширений между владельцами блокируются защитными ограничениями
контракта пакета.

<AccordionGroup>
  <Accordion title="Подпути каналов">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Экспорт корневой схемы Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кэшируемый помощник валидации JSON Schema для схем, которыми владеет Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Общие помощники мастера настройки, транслятор настройки, запросы allowlist, сборщики статуса настройки |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним совместимости; используйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помощники для конфигурации нескольких аккаунтов и шлюза действий, помощники fallback для аккаунта по умолчанию |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помощники нормализации account-id |
    | `plugin-sdk/account-resolution` | Помощники поиска аккаунта и fallback к значению по умолчанию |
    | `plugin-sdk/account-helpers` | Узкие помощники для списка аккаунтов и действий аккаунта |
    | `plugin-sdk/access-groups` | Помощники разбора allowlist групп доступа и редактированной диагностики групп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Общие примитивы схемы конфигурации канала, а также сборщики Zod и прямые сборщики JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схемы конфигурации каналов OpenClaw из комплекта только для поддерживаемых комплектных плагинов |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонические идентификаторы комплектных/официальных чат-каналов, а также метки форматтера и псевдонимы для плагинов, которым нужно распознавать текст с префиксом envelope без жестко заданной собственной таблицы. |
    | `plugin-sdk/channel-config-schema-legacy` | Устаревший псевдоним совместимости для схем конфигурации комплектных каналов |
    | `plugin-sdk/telegram-command-config` | Помощники нормализации/валидации пользовательских команд Telegram с fallback по комплектному контракту |
    | `plugin-sdk/command-gating` | Узкие помощники шлюза авторизации команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Устаревший низкоуровневый фасад совместимости входящего потока канала. Новые пути приема должны использовать `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Экспериментальный высокоуровневый runtime-resolver входящего потока канала и сборщики фактов маршрута для мигрированных путей приема канала. Предпочитайте его вместо сборки эффективных allowlist, allowlist команд и legacy-проекций в каждом Plugin. См. [API входящего потока канала](/ru/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракты жизненного цикла сообщений, а также параметры конвейера ответов, квитанции, live-превью/стриминг, помощники жизненного цикла, исходящая идентичность, планирование payload, надежные отправки и помощники контекста отправки сообщений. См. [API исходящего потока канала](/ru/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также legacy-фасады диспетчеризации ответов. |
    | `plugin-sdk/channel-message-runtime` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также legacy-фасады диспетчеризации ответов. |
    | `plugin-sdk/inbound-envelope` | Общие помощники входящего маршрута и сборщика envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-inbound` для inbound runners и предикатов dispatch, а `plugin-sdk/channel-outbound` для помощников доставки сообщений. |
    | `plugin-sdk/messaging-targets` | Устаревший псевдоним разбора целей; используйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Общие помощники загрузки исходящих медиа и состояния hosted-media |
    | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Узкие помощники нормализации poll |
    | `plugin-sdk/thread-bindings-runtime` | Помощники жизненного цикла привязки тредов и адаптеров |
    | `plugin-sdk/agent-media-payload` | Legacy-сборщик payload медиа агента |
    | `plugin-sdk/conversation-runtime` | Помощники привязки conversation/thread, pairing и настроенной привязки |
    | `plugin-sdk/runtime-config-snapshot` | Помощник снапшота runtime-конфигурации |
    | `plugin-sdk/runtime-group-policy` | Помощники разрешения runtime group-policy |
    | `plugin-sdk/channel-status` | Общие помощники снапшота/сводки статуса канала |
    | `plugin-sdk/channel-config-primitives` | Узкие примитивы схемы конфигурации канала |
    | `plugin-sdk/channel-config-writes` | Помощники авторизации записи конфигурации канала |
    | `plugin-sdk/channel-plugin-common` | Общие prelude-экспорты Plugin канала |
    | `plugin-sdk/allowlist-config-edit` | Помощники редактирования/чтения конфигурации allowlist |
    | `plugin-sdk/group-access` | Общие помощники принятия решений о доступе группы |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Узкие помощники политики guard для direct-DM до crypto |
    | `plugin-sdk/discord` | Устаревший фасад совместимости Discord для опубликованного `@openclaw/discord@2026.3.13` и отслеживаемой совместимости владельца; новые плагины должны использовать общие подпути SDK канала |
    | `plugin-sdk/telegram-account` | Устаревший фасад совместимости разрешения аккаунтов Telegram для отслеживаемой совместимости владельца; новые плагины должны использовать внедренные runtime-помощники или общие подпути SDK канала |
    | `plugin-sdk/zalouser` | Устаревший фасад совместимости Zalo Personal для опубликованных пакетов Lark/Zalo, которые все еще импортируют авторизацию команд отправителя; новые плагины должны использовать `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантическое представление сообщений, доставка и legacy-помощники интерактивных ответов. См. [Представление сообщений](/ru/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Общие входящие помощники для классификации событий, построения контекста, форматирования, roots, debounce, сопоставления упоминаний, mention-policy и входящего логирования |
    | `plugin-sdk/channel-inbound-debounce` | Узкие помощники inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Узкие помощники mention-policy, маркера упоминания и текста упоминания без более широкой поверхности inbound runtime |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound` или `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типы результата ответа |
    | `plugin-sdk/channel-actions` | Помощники действий с сообщениями канала, а также устаревшие помощники native-схем, сохраненные для совместимости плагинов |
    | `plugin-sdk/channel-route` | Общая нормализация маршрута, управляемое парсером разрешение цели, преобразование thread-id в строку, ключи маршрута dedupe/compact, типы parsed-target и помощники сравнения маршрутов/целей |
    | `plugin-sdk/channel-targets` | Помощники разбора целей; вызывающий код сравнения маршрутов должен использовать `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типы контракта канала |
    | `plugin-sdk/channel-feedback` | Подключение feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Узкие помощники secret-contract, такие как `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, и типы secret target |
  </Accordion>

Устаревшие семейства помощников каналов остаются доступными только для
совместимости опубликованных плагинов. План удаления: сохранить их на время
окна миграции внешних плагинов, держать репозиторные/комплектные плагины на
`channel-inbound` и `channel-outbound`, затем удалить подпути совместимости в
следующей крупной очистке SDK. Это относится к старым семействам channel
message/runtime, channel streaming, direct-DM access, раздробленных inbound
helpers, reply-options и pairing-path.

  <Accordion title="Подпути провайдеров">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Поддерживаемый фасад провайдера LM Studio для настройки, обнаружения каталога и подготовки моделей во время выполнения |
    | `plugin-sdk/lmstudio-runtime` | Поддерживаемый фасад времени выполнения LM Studio для локальных настроек сервера по умолчанию, обнаружения моделей, заголовков запросов и помощников для загруженных моделей |
    | `plugin-sdk/provider-setup` | Подобранные помощники настройки локальных/самостоятельно размещаемых провайдеров |
    | `plugin-sdk/self-hosted-provider-setup` | Специализированные помощники настройки самостоятельно размещаемого OpenAI-совместимого провайдера |
    | `plugin-sdk/cli-backend` | Настройки CLI-бэкенда по умолчанию + константы watchdog |
    | `plugin-sdk/provider-auth-runtime` | Помощники разрешения API-ключей во время выполнения для Plugin провайдеров |
    | `plugin-sdk/provider-oauth-runtime` | Общие типы обратных вызовов OAuth провайдера, рендеринг страницы обратного вызова, помощники PKCE/состояния, разбор входных данных авторизации, помощники истечения срока токена и помощники прерывания |
    | `plugin-sdk/provider-auth-api-key` | Помощники онбординга API-ключей/записи профиля, такие как `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартный построитель результата OAuth-аутентификации |
    | `plugin-sdk/provider-env-vars` | Помощники поиска переменных окружения для аутентификации провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, помощники импорта аутентификации OpenAI Codex, устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители политик replay, помощники конечных точек провайдеров и общие помощники нормализации ID моделей |
    | `plugin-sdk/provider-catalog-live-runtime` | Помощники каталога моделей live-провайдера для защищенного обнаружения в стиле `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фильтрация ID моделей, TTL-кэш и статический fallback |
    | `plugin-sdk/provider-catalog-runtime` | Хук времени выполнения для расширения каталога провайдеров и швы реестра Plugin-провайдеров для контрактных тестов |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Общие HTTP-помощники/помощники возможностей конечных точек провайдеров, HTTP-ошибки провайдеров и помощники multipart-форм для аудиотранскрипции |
    | `plugin-sdk/provider-web-fetch-contract` | Узкие помощники контракта конфигурации/выбора web-fetch, такие как `enablePluginInConfig` и `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Помощники регистрации/кэша провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Узкие помощники конфигурации/учетных данных web-search для провайдеров, которым не нужна обвязка включения Plugin |
    | `plugin-sdk/provider-web-search-contract` | Узкие помощники контракта конфигурации/учетных данных web-search, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а также ограниченные по области сеттеры/геттеры учетных данных |
    | `plugin-sdk/provider-web-search` | Помощники регистрации/кэша/времени выполнения провайдера web-search |
    | `plugin-sdk/embedding-providers` | Общие типы провайдеров эмбеддингов и помощники чтения, включая `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` и `listEmbeddingProviders(...)`; Plugin регистрируют провайдеров через `api.registerEmbeddingProvider(...)`, чтобы обеспечивалось владение манифестом |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, а также очистка схем и диагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типы снимков использования провайдера, общие помощники получения данных об использовании и загрузчики провайдеров, такие как `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы оберток потоков, совместимость вызовов инструментов plain-text и общие помощники оберток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публичные общие помощники оберток потоков провайдеров, включая `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` и утилиты потоков, совместимые с Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Помощники нативного транспорта провайдеров, такие как защищенный fetch, извлечение текста результата инструмента, преобразования транспортных сообщений и доступные для записи потоки транспортных событий |
    | `plugin-sdk/provider-onboard` | Помощники патчей конфигурации онбординга |
    | `plugin-sdk/global-singleton` | Помощники локальных для процесса singleton/map/cache |
    | `plugin-sdk/group-activation` | Узкие помощники режима активации групп и разбора команд |
  </Accordion>

Снимки использования провайдера обычно сообщают об одном или нескольких quota `windows`, каждый из которых содержит
метку, процент использования и необязательное время сброса. Провайдеры, которые предоставляют текст баланса или
состояния учетной записи вместо сбрасываемых quota windows, должны возвращать
`summary` с пустым массивом `windows`, а не фабриковать проценты.
OpenClaw отображает этот текст summary в выводе статуса; используйте `error` только тогда, когда
конечная точка использования завершилась ошибкой или не вернула пригодных данных об использовании.

  <Accordion title="Подпути аутентификации и безопасности">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, помощники реестра команд, включая форматирование меню динамических аргументов, помощники авторизации отправителя |
    | `plugin-sdk/command-status` | Построители сообщений команд/справки, такие как `buildCommandsMessagePaginated` и `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Помощники разрешения утверждающих и аутентификации действий в том же чате |
    | `plugin-sdk/approval-client-runtime` | Помощники профиля/фильтра утверждений нативного exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптеры нативных возможностей/доставки утверждений |
    | `plugin-sdk/approval-gateway-runtime` | Общий помощник разрешения Gateway утверждений |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковесные помощники загрузки нативного адаптера утверждений для горячих entrypoint каналов |
    | `plugin-sdk/approval-handler-runtime` | Более широкие помощники времени выполнения обработчика утверждений; предпочитайте более узкие швы adapter/gateway, когда их достаточно |
    | `plugin-sdk/approval-native-runtime` | Нативная цель утверждения, привязка учетной записи, gate маршрута, fallback пересылки и помощники подавления локального нативного запроса exec |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки реакций утверждения, payload запросов реакции, хранилища целей реакции и экспорт совместимости для подавления локального нативного запроса exec |
    | `plugin-sdk/approval-reply-runtime` | Помощники payload ответов утверждений exec/Plugin |
    | `plugin-sdk/approval-runtime` | Помощники payload утверждений exec/Plugin, помощники маршрутизации/времени выполнения нативных утверждений и помощники структурированного отображения утверждений, такие как `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Узкие помощники сброса дедупликации входящих ответов |
    | `plugin-sdk/channel-contract-testing` | Узкие помощники контрактных тестов каналов без широкого barrel тестирования |
    | `plugin-sdk/command-auth-native` | Нативная аутентификация команд, форматирование меню динамических аргументов и помощники нативных целей сеансов |
    | `plugin-sdk/command-detection` | Общие помощники обнаружения команд |
    | `plugin-sdk/command-primitives-runtime` | Легковесные предикаты текста команд для горячих путей каналов |
    | `plugin-sdk/command-surface` | Нормализация тела команды и помощники поверхности команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Ленивые помощники процесса входа для аутентификации провайдера при сопряжении приватного канала и Web UI с device-code |
    | `plugin-sdk/channel-secret-runtime` | Узкие помощники сбора secret-contract для поверхностей секретов каналов/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Узкие помощники типизации `coerceSecretRef` и SecretRef для разбора secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Манифест интеграции провайдера SecretRef только на уровне типов и контракты предустановок для Plugin, публикующих внешние предустановки провайдеров секретов |
    | `plugin-sdk/security-runtime` | Общие помощники доверия, gating DM, ограниченных корнем файлов/путей, включая записи только с созданием, синхронную/асинхронную атомарную замену файлов, записи во временные sibling-файлы, fallback перемещения между устройствами, помощники приватного файлового хранилища, guards родительских symlink, внешний контент, редактирование чувствительного текста, сравнение секретов за постоянное время и помощники сбора секретов |
    | `plugin-sdk/ssrf-policy` | Помощники allowlist хостов и политики SSRF для приватных сетей |
    | `plugin-sdk/ssrf-dispatcher` | Узкие помощники pinned-dispatcher без широкой поверхности времени выполнения инфраструктуры |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, защищенный от SSRF fetch, ошибка SSRF и помощники политики SSRF |
    | `plugin-sdk/secret-input` | Помощники разбора ввода секретов |
    | `plugin-sdk/webhook-ingress` | Помощники запросов/целей Webhook и приведение raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Помощники размера/таймаута тела запроса |
  </Accordion>

  <Accordion title="Подпути среды выполнения и хранилища">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкие вспомогательные средства среды выполнения, журналирования, резервного копирования и установки Plugin |
    | `plugin-sdk/runtime-env` | Узкие вспомогательные средства окружения среды выполнения, логгера, тайм-аута, повторных попыток и экспоненциальной задержки |
    | `plugin-sdk/browser-config` | Поддерживаемый фасад конфигурации браузера для нормализованных профиля и значений по умолчанию, разбора CDP URL и вспомогательных средств аутентификации управления браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Универсальные вспомогательные средства жизненного цикла задач и доставки завершения для агентов на основе harness, использующих область задачи, выданную хостом |
    | `plugin-sdk/codex-mcp-projection` | Зарезервированное встроенное вспомогательное средство Codex для проецирования пользовательской конфигурации MCP-сервера в конфигурацию потока Codex; не для сторонних plugins |
    | `plugin-sdk/codex-native-task-runtime` | Частное встроенное вспомогательное средство Codex для проводки зеркала собственных задач и среды выполнения; не для сторонних plugins |
    | `plugin-sdk/channel-runtime-context` | Универсальные вспомогательные средства регистрации и поиска runtime-контекста канала |
    | `plugin-sdk/matrix` | Устаревший фасад совместимости Matrix для старых сторонних пакетов каналов; новые plugins должны импортировать `plugin-sdk/run-command` напрямую |
    | `plugin-sdk/mattermost` | Устаревший фасад совместимости Mattermost для старых сторонних пакетов каналов; новые plugins должны импортировать универсальные подпути SDK напрямую |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Общие вспомогательные средства команд, hook, HTTP и интерактивного режима Plugin |
    | `plugin-sdk/hook-runtime` | Общие вспомогательные средства конвейера Webhook и внутренних hook |
    | `plugin-sdk/lazy-runtime` | Вспомогательные средства ленивого импорта и привязки среды выполнения, такие как `createLazyRuntimeModule`, `createLazyRuntimeMethod` и `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Вспомогательные средства выполнения процессов |
    | `plugin-sdk/cli-runtime` | Вспомогательные средства CLI для форматирования, ожидания, версии, вызова с аргументами и ленивых групп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Общие идентификаторы live-сценариев QA транспорта, вспомогательные средства базового покрытия и выбора сценариев |
    | `plugin-sdk/gateway-method-runtime` | Зарезервированное вспомогательное средство диспетчеризации методов Gateway для HTTP-маршрутов Plugin, объявляющих `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клиент Gateway, вспомогательное средство запуска клиента, готового к циклу событий, RPC Gateway CLI, ошибки протокола Gateway, разрешение объявленного LAN-хоста и вспомогательные средства патча статуса канала |
    | `plugin-sdk/config-contracts` | Узкая поверхность конфигурации только для типов для форм конфигурации Plugin, таких как `OpenClawConfig`, и типов конфигурации каналов/провайдеров |
    | `plugin-sdk/plugin-config-runtime` | Вспомогательные средства поиска конфигурации Plugin в среде выполнения, такие как `requireRuntimeConfig`, `resolvePluginConfigObject` и `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Транзакционные вспомогательные средства изменения конфигурации, такие как `mutateConfigFile`, `replaceConfigFile` и `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Общие строки подсказок метаданных доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Вспомогательные средства снимка конфигурации текущего процесса, такие как `getRuntimeConfig`, `getRuntimeConfigSnapshot`, и сеттеры тестовых снимков |
    | `plugin-sdk/telegram-command-config` | Нормализация имени и описания команд Telegram, а также проверки дубликатов и конфликтов, даже когда встроенная контрактная поверхность Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Обнаружение автоссылок на файловые ссылки без широкого текстового barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жестко заданные привязки реакций утверждения, payload реакционного prompt, хранилища целей реакций и экспорт совместимости для локального подавления prompt собственных exec-команд |
    | `plugin-sdk/approval-runtime` | Вспомогательные средства утверждения exec/Plugin, построители возможностей утверждения, вспомогательные средства auth/profile, вспомогательные средства native-маршрутизации/среды выполнения и форматирование структурированного пути отображения утверждения |
    | `plugin-sdk/reply-runtime` | Общие вспомогательные средства входящей обработки/ответов в среде выполнения, разбиение на части, диспетчеризация, Heartbeat, планировщик ответов |
    | `plugin-sdk/reply-dispatch-runtime` | Узкие вспомогательные средства диспетчеризации/финализации ответов и меток разговоров |
    | `plugin-sdk/reply-history` | Общие вспомогательные средства истории ответов с коротким окном. Новый код message-turn должен использовать `createChannelHistoryWindow`; низкоуровневые map-вспомогательные средства остаются только устаревшими экспортами совместимости |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Узкие вспомогательные средства разбиения текста/Markdown |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства workflow сессий (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ограниченное чтение недавнего текста transcript пользователя/ассистента по идентичности сессии, вспомогательные средства устаревшего пути хранилища сессий/ключа сессии, чтение updated-at и переходные вспомогательные средства совместимости whole-store/file-path |
    | `plugin-sdk/session-transcript-runtime` | Идентичность transcript, вспомогательные средства scoped target/read/write, публикация обновлений, блокировки записи и ключи попаданий памяти transcript |
    | `plugin-sdk/sqlite-runtime` | Узкие вспомогательные средства SQLite для agent-schema, путей и транзакций для среды выполнения первого уровня |
    | `plugin-sdk/cron-store-runtime` | Вспомогательные средства пути/загрузки/сохранения хранилища Cron |
    | `plugin-sdk/state-paths` | Вспомогательные средства путей каталогов состояния/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типы keyed-state для sidecar SQLite Plugin, а также централизованная настройка pragma соединения и обслуживания WAL для баз данных, принадлежащих Plugin |
    | `plugin-sdk/routing` | Вспомогательные средства привязки маршрута/ключа сессии/учетной записи, такие как `resolveAgentRoute`, `buildAgentSessionKey` и `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Общие вспомогательные средства сводки статуса канала/учетной записи, значения по умолчанию runtime-state и вспомогательные средства метаданных issue |
    | `plugin-sdk/target-resolver-runtime` | Общие вспомогательные средства разрешения target |
    | `plugin-sdk/string-normalization-runtime` | Вспомогательные средства нормализации slug/строк |
    | `plugin-sdk/request-url` | Извлечение строковых URL из fetch/request-подобных входных данных |
    | `plugin-sdk/run-command` | Исполнитель команд с таймингом и нормализованными результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Общие считыватели параметров tool/CLI |
    | `plugin-sdk/tool-plugin` | Определение простого типизированного Plugin agent-tool и предоставление статических метаданных для генерации manifest |
    | `plugin-sdk/tool-payload` | Извлечение нормализованных payload из объектов результата tool |
    | `plugin-sdk/tool-send` | Извлечение канонических полей цели отправки из аргументов tool |
    | `plugin-sdk/sandbox` | Типы backend песочницы и вспомогательные средства команд SSH/OpenShell, включая fail-fast preflight exec-команды |
    | `plugin-sdk/temp-path` | Общие вспомогательные средства путей временных загрузок и частные безопасные временные рабочие области |
    | `plugin-sdk/logging-core` | Логгер подсистемы и вспомогательные средства редактирования секретов |
    | `plugin-sdk/markdown-table-runtime` | Вспомогательные средства режима таблиц Markdown и преобразования |
    | `plugin-sdk/model-session-runtime` | Вспомогательные средства переопределения модели/сессии, такие как `applyModelOverrideToSessionEntry` и `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Вспомогательные средства разрешения конфигурации провайдера Talk |
    | `plugin-sdk/json-store` | Небольшие вспомогательные средства чтения/записи состояния JSON |
    | `plugin-sdk/json-unsafe-integers` | Вспомогательные средства разбора JSON, сохраняющие небезопасные целочисленные литералы как строки |
    | `plugin-sdk/file-lock` | Вспомогательные средства повторно входящих файловых блокировок |
    | `plugin-sdk/persistent-dedupe` | Вспомогательные средства дискового кэша дедупликации |
    | `plugin-sdk/acp-runtime` | Вспомогательные средства среды выполнения/сессий ACP и диспетчеризации ответов |
    | `plugin-sdk/acp-runtime-backend` | Легковесные вспомогательные средства регистрации backend ACP и диспетчеризации ответов для plugins, загружаемых при запуске |
    | `plugin-sdk/acp-binding-resolve-runtime` | Разрешение привязок ACP только для чтения без импортов startup жизненного цикла |
    | `plugin-sdk/agent-config-primitives` | Узкие примитивы config-schema среды выполнения агента |
    | `plugin-sdk/boolean-param` | Нестрогий считыватель boolean-параметров |
    | `plugin-sdk/dangerous-name-runtime` | Вспомогательные средства разрешения совпадений опасных имен |
    | `plugin-sdk/device-bootstrap` | Вспомогательные средства bootstrap устройства и pairing-токенов |
    | `plugin-sdk/extension-shared` | Общие примитивы вспомогательных средств passive-channel, статуса и ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Вспомогательные средства ответов команды/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Вспомогательные средства вывода списка команд Skills |
    | `plugin-sdk/native-command-registry` | Вспомогательные средства registry/build/serialize native-команд |
    | `plugin-sdk/agent-harness` | Экспериментальная поверхность trusted-plugin для низкоуровневых agent harnesses: типы harness, вспомогательные средства управления/прерывания active-run, вспомогательные средства моста инструментов OpenClaw, вспомогательные средства политики runtime-plan tool, классификация terminal outcome, вспомогательные средства форматирования/детализации хода tool и утилиты результата попытки |
    | `plugin-sdk/provider-zai-endpoint` | Устаревший фасад обнаружения endpoint, принадлежащий провайдеру Z.AI; используйте публичный API Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Вспомогательное средство process-local async-блокировки для небольших файлов состояния среды выполнения |
    | `plugin-sdk/channel-activity-runtime` | Вспомогательное средство телеметрии активности канала |
    | `plugin-sdk/concurrency-runtime` | Вспомогательное средство ограниченной конкурентности async-задач |
    | `plugin-sdk/dedupe-runtime` | Вспомогательные средства in-memory кэша дедупликации |
    | `plugin-sdk/delivery-queue-runtime` | Вспомогательное средство drain исходящей pending-delivery |
    | `plugin-sdk/file-access-runtime` | Вспомогательные средства безопасных путей локальных файлов и media-source |
    | `plugin-sdk/heartbeat-runtime` | Вспомогательные средства пробуждения, событий и видимости Heartbeat |
    | `plugin-sdk/number-runtime` | Вспомогательное средство числового приведения |
    | `plugin-sdk/secure-random-runtime` | Вспомогательные средства безопасных токенов/UUID |
    | `plugin-sdk/system-event-runtime` | Вспомогательные средства очереди системных событий |
    | `plugin-sdk/transport-ready-runtime` | Вспомогательное средство ожидания готовности транспорта |
    | `plugin-sdk/exec-approvals-runtime` | Вспомогательные средства файлов политики утверждений exec без широкого barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Устаревшая прослойка совместимости; используйте узкие runtime-подпути выше |
    | `plugin-sdk/collection-runtime` | Небольшие вспомогательные средства ограниченного кэша |
    | `plugin-sdk/diagnostic-runtime` | Вспомогательные средства диагностических флагов, событий и trace-context |
    | `plugin-sdk/error-runtime` | Граф ошибок, форматирование, общие вспомогательные средства классификации ошибок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обернутый fetch, proxy, опция EnvHttpProxyAgent и вспомогательные средства pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без импортов proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Санитайзер inline image data URL и вспомогательные средства sniffing подписи без широкой runtime-поверхности media |
    | `plugin-sdk/response-limit-runtime` | Ограниченный считыватель response-body без широкой runtime-поверхности media |
    | `plugin-sdk/session-binding-runtime` | Текущее состояние привязки разговора без настроенной маршрутизации привязок или хранилищ pairing |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства session-store без широких импортов записи/обслуживания конфигурации |
    | `plugin-sdk/sqlite-runtime` | Узкие вспомогательные средства SQLite для agent-schema, путей и транзакций без управления жизненным циклом базы данных |
    | `plugin-sdk/context-visibility-runtime` | Разрешение видимости контекста и фильтрация дополнительного контекста без широких импортов конфигурации/безопасности |
    | `plugin-sdk/string-coerce-runtime` | Узкие вспомогательные средства приведения и нормализации primitive record/string без импортов markdown/logging |
    | `plugin-sdk/host-runtime` | Вспомогательные средства нормализации hostname и SCP host |
    | `plugin-sdk/retry-runtime` | Вспомогательные средства конфигурации retry и исполнителя retry |
    | `plugin-sdk/agent-runtime` | Вспомогательные средства каталогов/идентичности/рабочих областей агента, включая `resolveAgentDir`, `resolveDefaultAgentDir` и устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запрос/дедупликация каталогов на основе конфигурации |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Подпути возможностей и тестирования">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Общие помощники для получения, преобразования и сохранения медиа, включая `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` и устаревший `fetchRemoteMedia`; предпочитайте помощники хранилища чтению буферов, когда URL должен стать медиа OpenClaw |
    | `plugin-sdk/media-mime` | Узкая нормализация MIME, сопоставление расширений файлов, определение MIME и помощники типов медиа |
    | `plugin-sdk/media-store` | Узкие помощники хранилища медиа, такие как `saveMediaBuffer` и `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Общие помощники отказоустойчивости генерации медиа, выбор кандидатов и сообщения об отсутствующей модели |
    | `plugin-sdk/media-understanding` | Типы провайдеров понимания медиа, а также экспорты помощников для изображений, аудио и структурированного извлечения, предназначенные для провайдеров |
    | `plugin-sdk/text-chunking` | Помощники разбиения и рендеринга текста и Markdown, преобразование таблиц Markdown, удаление тегов директив и утилиты безопасного текста |
    | `plugin-sdk/text-chunking` | Помощник разбиения исходящего текста |
    | `plugin-sdk/speech` | Типы речевых провайдеров, а также экспорты директив, реестра, валидации, OpenAI-совместимого конструктора TTS и речевых помощников, предназначенные для провайдеров |
    | `plugin-sdk/speech-core` | Общие типы речевых провайдеров, реестр, директивы, нормализация и экспорты речевых помощников |
    | `plugin-sdk/realtime-transcription` | Типы провайдеров транскрипции в реальном времени, помощники реестра и общий помощник сеанса WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Помощник начальной загрузки профиля реального времени для ограниченного внедрения контекста `IDENTITY.md`, `USER.md` и `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типы голосовых провайдеров реального времени, помощники реестра и общие помощники поведения голоса в реальном времени, включая отслеживание активности вывода |
    | `plugin-sdk/image-generation` | Типы провайдеров генерации изображений, а также помощники URL данных/ресурсов изображений и OpenAI-совместимый конструктор провайдера изображений |
    | `plugin-sdk/image-generation-core` | Общие типы генерации изображений, отказоустойчивость, аутентификация и помощники реестра |
    | `plugin-sdk/music-generation` | Типы провайдера, запроса и результата генерации музыки |
    | `plugin-sdk/music-generation-core` | Общие типы генерации музыки, помощники отказоустойчивости, поиск провайдера и разбор ссылки на модель |
    | `plugin-sdk/video-generation` | Типы провайдера, запроса и результата генерации видео |
    | `plugin-sdk/video-generation-core` | Общие типы генерации видео, помощники отказоустойчивости, поиск провайдера и разбор ссылки на модель |
    | `plugin-sdk/transcripts` | Общие типы провайдеров источников транскриптов, помощники реестра, дескрипторы сеансов и метаданные высказываний |
    | `plugin-sdk/webhook-targets` | Реестр целей Webhook и помощники установки маршрутов |
    | `plugin-sdk/webhook-path` | Устаревший псевдоним совместимости; используйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Общие помощники загрузки удаленных/локальных медиа |
    | `plugin-sdk/zod` | Устаревший реэкспорт совместимости; импортируйте `zod` напрямую из `zod` |
    | `plugin-sdk/testing` | Локальный для репозитория устаревший barrel совместимости для устаревших тестов OpenClaw. Новые тесты репозитория должны вместо этого импортировать специализированные локальные тестовые подпути, такие как `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` или `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальный для репозитория минимальный помощник `createTestPluginApi` для модульных тестов прямой регистрации Plugin без импорта мостов тестовых помощников репозитория |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальные для репозитория фикстуры контрактов нативного адаптера среды выполнения агента для тестов аутентификации, доставки, fallback, хуков инструментов, наложения промпта, схемы и проекции транскрипта |
    | `plugin-sdk/channel-test-helpers` | Локальные для репозитория тестовые помощники, ориентированные на каналы, для контрактов общих действий/настройки/статуса, проверок каталогов, жизненного цикла запуска учетной записи, потоков send-config, моков среды выполнения, проблем статуса, исходящей доставки и регистрации хуков |
    | `plugin-sdk/channel-target-testing` | Локальный для репозитория общий набор тестов случаев ошибок разрешения целей для тестов каналов |
    | `plugin-sdk/plugin-test-contracts` | Локальные для репозитория помощники контрактов пакета Plugin, регистрации, публичного артефакта, прямого импорта, runtime API и побочных эффектов импорта |
    | `plugin-sdk/provider-test-contracts` | Локальные для репозитория помощники контрактов среды выполнения провайдера, аутентификации, обнаружения, onboard, каталога, мастера, возможностей медиа, политики replay, realtime STT live-audio, web-search/fetch и потоковой передачи |
    | `plugin-sdk/provider-http-test-mocks` | Локальные для репозитория подключаемые HTTP/auth моки Vitest для тестов провайдеров, которые используют `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Локальные для репозитория универсальные фикстуры захвата среды выполнения CLI, контекста sandbox, автора Skills, agent-message, system-event, перезагрузки модулей, пути встроенного Plugin, terminal-text, разбиения на фрагменты, auth-token и типизированных случаев |
    | `plugin-sdk/test-node-mocks` | Локальные для репозитория специализированные помощники моков встроенных модулей Node для использования внутри фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Подпути памяти">
    | Подпуть | Ключевые экспорты |
    | --- | --- |
    | `plugin-sdk/memory-core` | Встроенная поверхность помощников memory-core для помощников менеджера/конфигурации/файлов/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад среды выполнения индекса/поиска памяти |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легковесные помощники реестра провайдеров эмбеддингов памяти |
    | `plugin-sdk/memory-core-host-engine-foundation` | Экспорты foundation-движка хоста памяти |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракты эмбеддингов хоста памяти, доступ к реестру, локальный провайдер и универсальные пакетные/удаленные помощники. `registerMemoryEmbeddingProvider` на этой поверхности устарел; используйте универсальный API провайдера эмбеддингов для новых провайдеров. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Экспорты QMD-движка хоста памяти |
    | `plugin-sdk/memory-core-host-engine-storage` | Экспорты движка хранилища хоста памяти |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные помощники хоста памяти |
    | `plugin-sdk/memory-core-host-query` | Помощники запросов хоста памяти |
    | `plugin-sdk/memory-core-host-secret` | Помощники секретов хоста памяти |
    | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Помощники статуса хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помощники среды выполнения CLI хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-core` | Помощники базовой среды выполнения хоста памяти |
    | `plugin-sdk/memory-core-host-runtime-files` | Помощники файлов/среды выполнения хоста памяти |
    | `plugin-sdk/memory-host-core` | Нейтральный к поставщику псевдоним для помощников базовой среды выполнения хоста памяти |
    | `plugin-sdk/memory-host-events` | Нейтральный к поставщику псевдоним для помощников журнала событий хоста памяти |
    | `plugin-sdk/memory-host-files` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Общие помощники управляемого Markdown для Plugin, смежных с памятью |
    | `plugin-sdk/memory-host-search` | Фасад среды выполнения Active Memory для доступа к менеджеру поиска |
    | `plugin-sdk/memory-host-status` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервированные подпути встроенных помощников">
    Зарезервированные подпути SDK встроенных помощников — это узкие, специфичные для владельцев поверхности для
    кода встроенных Plugin. Они отслеживаются в инвентаре SDK, чтобы сборки
    пакетов и псевдонимы оставались детерминированными, но они не являются общими API
    для авторов Plugin. Новые переиспользуемые контракты хоста должны использовать универсальные подпути SDK,
    такие как `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
    `plugin-sdk/plugin-config-runtime`.

    | Подпуть | Владелец и назначение |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Встроенный помощник Plugin Codex для проецирования пользовательской конфигурации сервера MCP в конфигурацию потока app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Встроенный помощник Plugin Codex для зеркалирования нативных субагентов app-server Codex в состояние задач OpenClaw |

  </Accordion>
</AccordionGroup>

## Связанное

- [Обзор Plugin SDK](/ru/plugins/sdk-overview)
- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание Plugin](/ru/plugins/building-plugins)
