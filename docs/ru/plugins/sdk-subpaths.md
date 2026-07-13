---
read_when:
    - Выбор подходящего подпути plugin-sdk для импорта плагина
    - Аудит подпутей встроенных плагинов и вспомогательных интерфейсов
summary: 'Каталог подпутей SDK плагинов: расположение импортов по областям'
title: Подпути SDK плагинов
x-i18n:
    generated_at: "2026-07-13T18:26:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 2028d215511516b0589946a0cd8145f3c005ba211c5ec130e440b513ebd0d4b3
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK плагинов предоставляется в виде набора узкоспециализированных публичных подпутей в
`openclaw/plugin-sdk/`. На этой странице перечислены часто используемые подпути, сгруппированные по
назначению. Поверхность определяют три файла:

- `scripts/lib/plugin-sdk-entrypoints.json`: поддерживаемый перечень точек входа,
  компилируемых при сборке.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: локальные для репозитория
  тестовые и внутренние подпути. Экспорты пакета — это перечень за вычетом данного списка.
- `src/plugin-sdk/entrypoints.ts`: метаданные классификации для устаревших
  подпутей, зарезервированных встроенных вспомогательных модулей, поддерживаемых встроенных фасадов и
  публичных поверхностей, принадлежащих плагинам.

Сопровождающие проверяют количество публичных экспортов с помощью `pnpm plugin-sdk:surface`, а
активные зарезервированные подпути вспомогательных модулей — с помощью `pnpm plugins:boundary-report:summary`;
неиспользуемые зарезервированные экспорты вспомогательных модулей приводят к сбою отчёта CI, а не остаются в
публичном SDK в виде неактивного долга совместимости.

Руководство по созданию плагинов см. в разделе [Обзор SDK плагинов](/ru/plugins/sdk-overview).

## Точка входа плагина

| Подпуть                        | Основные экспорты                                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Вспомогательные средства для элементов поставщика миграции, например `createMigrationItem`, константы причин, маркеры состояния элементов, средства редактирования конфиденциальных данных и `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Вспомогательные средства миграции среды выполнения, например `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` и `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Регистрация проверок работоспособности Doctor, обнаружение, исправление, выбор, уровни серьёзности и типы результатов для встроенных потребителей данных о работоспособности                                                                                |
| `plugin-sdk/config-schema`     | Устарело. Корневая схема Zod `openclaw.json` (`OpenClawSchema`); вместо неё определяйте локальные схемы плагина и проверяйте их с помощью `plugin-sdk/json-schema-runtime`                                                  |

### Устаревшие средства совместимости и тестирования

Устаревшие подпути остаются экспортируемыми для старых плагинов, но в новом коде следует использовать
специализированные подпути SDK, приведённые ниже. Поддерживаемый список:
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI отклоняет
производственные импорты встроенных компонентов из него. Общие файлы реэкспорта, такие как `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` и
`plugin-sdk/text-runtime`, предназначены только для совместимости, а `plugin-sdk/zod` является
реэкспортом для совместимости: импортируйте `zod` непосредственно из `zod`. Общие файлы реэкспорта
доменов `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` и
`plugin-sdk/security-runtime` также устарели; вместо них следует использовать специализированные
подпути.

Подпути вспомогательных средств тестирования OpenClaw на базе Vitest предназначены только для репозитория и
больше не экспортируются из пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` и `testing`. Закрытые поверхности встроенных вспомогательных модулей
`ssrf-runtime-internal` и `codex-native-task-runtime` также предназначены только для
репозитория.

### Зарезервированные подпути вспомогательных модулей встроенного плагина

`plugin-sdk/codex-mcp-projection` — единственный зарезервированный подпуть: принадлежащая плагину
поверхность совместимости для встроенного плагина Codex, а не универсальный API SDK.
Импорты между плагинами с разными владельцами блокируются ограничениями контракта пакета, а
CI завершается с ошибкой, если зарезервированный подпуть перестаёт импортироваться.
`plugin-sdk/codex-native-task-runtime` предназначен только для репозитория и не является экспортом
пакета.

`src/plugin-sdk/entrypoints.ts` также отслеживает поддерживаемые встроенные фасады — точки входа
SDK, реализация которых предоставляется соответствующим встроенным плагином, пока их не заменят универсальные
контракты: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` и `plugin-sdk/zalouser`. Некоторые из них также
устарели для нового кода; см. примечания к соответствующим строкам ниже.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Вспомогательная функция проверки кэшированной схемы JSON для схем, принадлежащих плагинам |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Общие вспомогательные функции мастера настройки, переводчик настройки, запросы списков разрешений, построители состояния настройки |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним для совместимости; используйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Вспомогательные функции конфигурации нескольких учётных записей и шлюза действий, а также резервного выбора учётной записи по умолчанию |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, вспомогательные функции нормализации идентификатора учётной записи |
    | `plugin-sdk/account-resolution` | Вспомогательные функции поиска учётной записи и резервного выбора по умолчанию |
    | `plugin-sdk/account-helpers` | Узкоспециализированные вспомогательные функции для списка учётных записей и действий с ними |
    | `plugin-sdk/access-groups` | Вспомогательные функции разбора списка разрешённых групп доступа и диагностики групп с сокрытием конфиденциальных данных |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Общие примитивы схемы конфигурации канала, а также Zod и непосредственные построители JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схемы конфигурации каналов OpenClaw для поддерживаемых встроенных плагинов |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонические идентификаторы встроенных и официальных каналов чата, а также метки и псевдонимы форматировщика для плагинов, которым требуется распознавать текст с префиксом конверта без жёстко заданной собственной таблицы. |
    | `plugin-sdk/channel-config-schema-legacy` | Устаревший псевдоним совместимости для схем конфигурации встроенных каналов |
    | `plugin-sdk/telegram-command-config` | Устаревшие нормализация названий и описаний команд Telegram и проверки дубликатов и конфликтов; в новом коде плагинов используйте локальную обработку конфигурации команд |
    | `plugin-sdk/command-gating` | Узкоспециализированные вспомогательные функции шлюза авторизации команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Низкоуровневая поверхность совместимости для входящих данных канала. Новые пути приёма должны использовать `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Экспериментальный высокоуровневый преобразователь среды выполнения для входящих данных канала и построители фактов маршрута для перенесённых путей приёма каналов. Предпочитайте его самостоятельной сборке действующих списков разрешений, списков разрешённых команд и устаревших проекций в каждом плагине. См. [API входящих данных канала](/ru/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракты жизненного цикла сообщений, а также параметры конвейера ответов, подтверждения, интерактивный предпросмотр и потоковая передача, вспомогательные функции жизненного цикла, идентификация исходящих сообщений, планирование полезной нагрузки, надёжная отправка и вспомогательные функции контекста отправки сообщений. См. [API исходящих данных канала](/ru/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также устаревшие фасады диспетчеризации ответов. |
    | `plugin-sdk/channel-message-runtime` | Устаревший псевдоним совместимости для `plugin-sdk/channel-outbound`, а также устаревшие фасады диспетчеризации ответов. |
    | `plugin-sdk/inbound-envelope` | Общие вспомогательные функции построения входящего маршрута и конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-inbound` для обработчиков входящих данных и предикатов диспетчеризации, а `plugin-sdk/channel-outbound` — для вспомогательных функций доставки сообщений. |
    | `plugin-sdk/messaging-targets` | Устаревший псевдоним разбора цели; используйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Общие вспомогательные функции загрузки исходящих медиафайлов и состояния размещённых медиафайлов |
    | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Узкоспециализированные вспомогательные функции нормализации опросов |
    | `plugin-sdk/thread-bindings-runtime` | Вспомогательные функции жизненного цикла и адаптера привязки цепочек сообщений |
    | `plugin-sdk/agent-media-payload` | Корневые каталоги и загрузчики полезных нагрузок медиафайлов агента |
    | `plugin-sdk/conversation-runtime` | Устаревший общий модуль реэкспорта вспомогательных функций привязки бесед и цепочек сообщений, сопряжения и настроенных привязок; предпочитайте специализированные подпути привязки, такие как `plugin-sdk/thread-bindings-runtime` и `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Вспомогательные функции разрешения групповой политики во время выполнения |
    | `plugin-sdk/channel-status` | Общие вспомогательные функции снимка и сводки состояния канала |
    | `plugin-sdk/channel-config-primitives` | Узкоспециализированные примитивы схемы конфигурации канала |
    | `plugin-sdk/channel-config-writes` | Вспомогательные функции авторизации записи конфигурации канала |
    | `plugin-sdk/channel-plugin-common` | Общие экспорты прелюдии плагина канала |
    | `plugin-sdk/allowlist-config-edit` | Вспомогательные функции изменения и чтения конфигурации списка разрешений |
    | `plugin-sdk/group-access` | Устаревшие вспомогательные функции принятия решений о групповом доступе; используйте `resolveChannelMessageIngress` из `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Узкоспециализированные вспомогательные функции политики предварительной криптографической проверки прямых сообщений |
    | `plugin-sdk/discord` | Устаревший фасад совместимости Discord для опубликованного `@openclaw/discord@2026.3.13` и отслеживаемой совместимости владельца; новые плагины должны использовать универсальные подпути SDK каналов |
    | `plugin-sdk/telegram-account` | Устаревший фасад совместимости разрешения учётных записей Telegram для отслеживаемой совместимости владельца; новые плагины должны использовать внедрённые вспомогательные функции среды выполнения или универсальные подпути SDK каналов |
    | `plugin-sdk/zalouser` | Устаревший фасад совместимости Zalo Personal для опубликованных пакетов Lark/Zalo, которые всё ещё импортируют авторизацию команд отправителя; новые плагины должны использовать универсальные подпути SDK каналов |
    | `plugin-sdk/interactive-runtime` | Семантическое представление и доставка сообщений, а также устаревшие вспомогательные функции интерактивных ответов. См. [Представление сообщений](/ru/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Общие вспомогательные функции для классификации событий, построения контекста, форматирования, корневых каталогов, устранения дребезга, сопоставления упоминаний, политики упоминаний и журналирования входящих данных |
    | `plugin-sdk/channel-inbound-debounce` | Узкоспециализированные вспомогательные функции устранения дребезга входящих данных |
    | `plugin-sdk/channel-mention-gating` | Узкоспециализированные вспомогательные функции политики упоминаний, маркеров упоминаний и текста упоминаний без более широкой поверхности среды выполнения входящих данных |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Устаревшие фасады совместимости. Используйте `plugin-sdk/channel-inbound` или `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости. Используйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типы результатов ответа |
    | `plugin-sdk/channel-actions` | Вспомогательные функции действий с сообщениями канала, а также устаревшие вспомогательные функции нативных схем, сохранённые для совместимости плагинов |
    | `plugin-sdk/channel-route` | Общие функции нормализации маршрутов, разрешения целей на основе синтаксического анализатора, преобразования идентификаторов цепочек сообщений в строки, формирования дедуплицированных и компактных ключей маршрутов, типы разобранных целей и вспомогательные функции сравнения маршрутов и целей |
    | `plugin-sdk/channel-targets` | Вспомогательные функции разбора целей; вызывающий код для сравнения маршрутов должен использовать `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типы контрактов каналов |
    | `plugin-sdk/channel-feedback` | Подключение обратной связи и реакций |
  </Accordion>

Устаревшие семейства вспомогательных средств каналов остаются доступными только для
совместимости опубликованных плагинов. План удаления: сохранять их в течение окна
миграции внешних плагинов, использовать в плагинах репозитория и встроенных плагинах `channel-inbound` и
`channel-outbound`, а затем удалить подпути совместимости при следующей крупной
очистке SDK. Это относится к старым семействам сообщений/среды выполнения каналов,
потоковой передачи каналов, прямого доступа к личным сообщениям, отдельных вспомогательных средств для входящих сообщений, параметров ответов
и путей сопряжения.

  <Accordion title="Подпути провайдеров">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Поддерживаемый фасад провайдера LM Studio для настройки, обнаружения каталога и подготовки модели во время выполнения |
    | `plugin-sdk/lmstudio-runtime` | Поддерживаемый фасад среды выполнения LM Studio для значений по умолчанию локального сервера, обнаружения моделей, заголовков запросов и вспомогательных функций для загруженных моделей |
    | `plugin-sdk/provider-setup` | Отобранные вспомогательные функции настройки локальных и самостоятельно размещаемых провайдеров |
    | `plugin-sdk/self-hosted-provider-setup` | Устаревшие вспомогательные функции настройки самостоятельно размещаемых провайдеров, совместимых с OpenAI; используйте `plugin-sdk/provider-setup` или вспомогательные функции настройки, принадлежащие плагину |
    | `plugin-sdk/cli-backend` | Значения по умолчанию бэкенда CLI и константы сторожевого таймера |
    | `plugin-sdk/provider-auth-runtime` | Вспомогательные функции среды выполнения для аутентификации провайдера: OAuth-поток с обратным вызовом на loopback-интерфейс, обмен токенов, сохранение данных аутентификации и разрешение API-ключа |
    | `plugin-sdk/provider-oauth-runtime` | Универсальные типы обратного вызова OAuth провайдера, отрисовка страницы обратного вызова, вспомогательные функции PKCE/состояния, разбор входных данных авторизации, вспомогательные функции срока действия токена и прерывания |
    | `plugin-sdk/provider-auth-api-key` | Вспомогательные функции первоначальной настройки с API-ключом и записи профиля, такие как `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартный построитель результата аутентификации OAuth |
    | `plugin-sdk/provider-env-vars` | Вспомогательные функции поиска переменных среды для аутентификации провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, вспомогательные функции импорта аутентификации OpenAI Codex, устаревший экспорт совместимости `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители политик повторного воспроизведения, вспомогательные функции конечных точек провайдеров и общие вспомогательные функции нормализации идентификаторов моделей |
    | `plugin-sdk/provider-catalog-live-runtime` | Вспомогательные функции актуального каталога моделей провайдера для защищённого обнаружения в стиле `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фильтрация идентификаторов моделей, кеш с TTL и статический резервный вариант |
    | `plugin-sdk/provider-catalog-runtime` | Перехватчик среды выполнения для расширения каталога провайдера и точки интеграции реестра провайдеров плагинов для контрактных тестов |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Универсальные вспомогательные функции HTTP и возможностей конечных точек провайдера, ошибки HTTP провайдера и вспомогательные функции multipart-форм для транскрибирования аудио |
    | `plugin-sdk/provider-web-fetch-contract` | Узкие вспомогательные функции контракта конфигурации и выбора веб-загрузки, такие как `enablePluginInConfig` и `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Вспомогательные функции регистрации и кеширования провайдера веб-загрузки |
    | `plugin-sdk/provider-web-search-config-contract` | Узкие вспомогательные функции конфигурации и учётных данных веб-поиска для провайдеров, которым не требуется подключение логики включения плагина |
    | `plugin-sdk/provider-web-search-contract` | Узкие вспомогательные функции контракта конфигурации и учётных данных веб-поиска, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а также ограниченные по области функции задания и получения учётных данных |
    | `plugin-sdk/provider-web-search` | Вспомогательные функции регистрации, кеширования и среды выполнения провайдера веб-поиска |
    | `plugin-sdk/embedding-providers` | Общие типы провайдеров эмбеддингов и вспомогательные функции чтения, включая `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` и `listEmbeddingProviders(...)`; плагины регистрируют провайдеров через `api.registerEmbeddingProvider(...)`, чтобы обеспечить соблюдение владения манифестом |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, а также очистка схем и диагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типы снимков использования провайдеров, общие вспомогательные функции получения данных об использовании и функции получения данных от провайдеров, такие как `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы оболочек потоков, совместимость вызовов инструментов в виде обычного текста и общие вспомогательные функции оболочек Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Общедоступные вспомогательные функции общей оболочки потоков провайдеров, включая `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, а также потоковые утилиты, совместимые с Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Вспомогательные функции нативного транспорта провайдера, такие как защищённая загрузка, извлечение текста результата инструмента, преобразования транспортных сообщений и доступные для записи потоки транспортных событий |
    | `plugin-sdk/provider-onboard` | Вспомогательные функции исправления конфигурации первоначальной настройки |
    | `plugin-sdk/global-singleton` | Вспомогательные функции локальных для процесса одиночек, отображений и кешей |
    | `plugin-sdk/group-activation` | Узкие вспомогательные функции режима активации группы и разбора команд |
  </Accordion>

Снимки использования провайдера обычно содержат одно или несколько окон квоты `windows`, каждое с
меткой, процентом использования и необязательным временем сброса. Провайдеры, предоставляющие сведения о балансе или
текст состояния учётной записи вместо сбрасываемых окон квоты, должны возвращать
`summary` с пустым массивом `windows`, а не создавать фиктивные проценты.
OpenClaw отображает этот сводный текст в выводе состояния; используйте `error`, только когда
конечная точка использования завершилась с ошибкой или не вернула пригодных данных об использовании.

  <Accordion title="Подпути аутентификации и безопасности">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/command-auth` | Устаревшая широкая поверхность авторизации команд (`resolveControlCommandGate`, вспомогательные функции реестра команд, включая форматирование меню динамических аргументов, и вспомогательные функции авторизации отправителя); используйте авторизацию на входе канала или во время выполнения либо вспомогательные функции состояния команд |
    | `plugin-sdk/command-status` | Построители сообщений команд и справки, такие как `buildCommandsMessagePaginated` и `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Разрешение утверждающих лиц и вспомогательные функции авторизации действий в том же чате |
    | `plugin-sdk/approval-client-runtime` | Вспомогательные функции профилей и фильтров утверждения нативного выполнения |
    | `plugin-sdk/approval-delivery-runtime` | Адаптеры возможностей и доставки нативных утверждений |
    | `plugin-sdk/approval-gateway-runtime` | Общий разрешитель Gateway для утверждений |
    | `plugin-sdk/approval-reference-runtime` | Детерминированная вспомогательная функция устойчивого локатора для ограниченных транспортом обратных вызовов утверждения |
    | `plugin-sdk/approval-handler-adapter-runtime` | Облегчённые вспомогательные функции загрузки адаптера нативных утверждений для горячих точек входа каналов |
    | `plugin-sdk/approval-handler-runtime` | Более широкие вспомогательные функции среды выполнения обработчика утверждений; предпочитайте более узкие точки интеграции адаптера и Gateway, когда их достаточно |
    | `plugin-sdk/approval-native-runtime` | Вспомогательные функции цели нативного утверждения, привязки учётной записи, шлюза маршрута, резервной переадресации и подавления локального запроса на нативное выполнение |
    | `plugin-sdk/approval-reaction-runtime` | Жёстко заданные привязки реакций утверждения, полезные нагрузки запросов реакций, хранилища целей реакций, вспомогательные функции текста подсказок реакций и экспорт совместимости для подавления локального запроса на нативное выполнение |
    | `plugin-sdk/approval-reply-runtime` | Вспомогательные функции полезной нагрузки ответа на утверждение выполнения или плагина |
    | `plugin-sdk/approval-runtime` | Вспомогательные функции полезной нагрузки утверждения выполнения или плагина, построители возможностей утверждения, вспомогательные функции авторизации и профилей утверждения, вспомогательные функции маршрутизации и среды выполнения нативных утверждений, а также вспомогательные функции структурированного отображения утверждений, такие как `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Устаревшие узкие вспомогательные функции сброса дедупликации входящих ответов |
    | `plugin-sdk/command-auth-native` | Авторизация нативных команд, форматирование меню динамических аргументов и вспомогательные функции цели нативного сеанса |
    | `plugin-sdk/command-detection` | Общие вспомогательные функции обнаружения команд |
    | `plugin-sdk/command-primitives-runtime` | Облегчённые предикаты текста команд для горячих путей каналов |
    | `plugin-sdk/command-surface` | Вспомогательные функции нормализации тела команды и поверхности команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Вспомогательные функции ленивого потока входа для аутентификации провайдера при сопряжении приватного канала и Web UI с помощью кода устройства |
    | `plugin-sdk/channel-secret-runtime` | Устаревшая широкая поверхность контракта секретов (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, типы целей секретов); предпочитайте специализированные подпути ниже |
    | `plugin-sdk/channel-secret-basic-runtime` | Узкие экспорты контракта секретов и построители реестра целей для поверхностей секретов каналов и плагинов, не относящихся к TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Узкие вспомогательные функции назначения секретов вложенного TTS канала |
    | `plugin-sdk/secret-ref-runtime` | Узкая типизация SecretRef, разрешение и поиск пути цели плана для разбора контракта секретов и конфигурации |
    | `plugin-sdk/secret-provider-integration` | Доступные только на уровне типов контракты манифеста интеграции провайдера SecretRef и предустановок для плагинов, публикующих внешние предустановки провайдеров секретов |
    | `plugin-sdk/security-runtime` | Устаревший широкий объединяющий экспорт для доверия, ограничения личных сообщений, ограниченных корнем вспомогательных функций файлов и путей, включая запись только при создании, синхронную и асинхронную атомарную замену файлов, запись во временные файлы рядом с целевыми, резервное перемещение между устройствами, вспомогательные функции приватного файлового хранилища, защиту от символьных ссылок в родительских путях, внешний контент, редактирование конфиденциального текста, сравнение секретов за постоянное время и вспомогательные функции сбора секретов; предпочитайте специализированные подпути безопасности, SSRF и секретов |
    | `plugin-sdk/ssrf-policy` | Вспомогательные функции списка разрешённых хостов и политики SSRF для частных сетей |
    | `plugin-sdk/ssrf-dispatcher` | Узкие вспомогательные функции закреплённого диспетчера без широкой поверхности инфраструктурной среды выполнения |
    | `plugin-sdk/ssrf-runtime` | Вспомогательные функции закреплённого диспетчера, защищённой от SSRF загрузки, ошибок SSRF и политики SSRF |
    | `plugin-sdk/secret-input` | Вспомогательные функции разбора входных данных секретов |
    | `plugin-sdk/webhook-ingress` | Вспомогательные функции запросов и целей Webhook, а также приведение необработанных данных websocket и тела запроса |
    | `plugin-sdk/webhook-request-guards` | Вспомогательные функции размера тела запроса и тайм-аута |
  </Accordion>

  <Accordion title="Подпути среды выполнения и хранилища">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/runtime` | Вспомогательные средства среды выполнения, журналирования и резервного копирования, предупреждения о путях установки плагинов и вспомогательные средства для процессов |
    | `plugin-sdk/runtime-env` | Узкоспециализированные вспомогательные средства для переменных окружения среды выполнения, журналирования, тайм-аутов, повторных попыток и задержек между ними |
    | `plugin-sdk/browser-config` | Поддерживаемый фасад конфигурации браузера для нормализованного профиля и значений по умолчанию, разбора URL CDP и вспомогательных средств аутентификации управления браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Универсальные вспомогательные средства жизненного цикла задач и доставки результатов для агентов на основе среды-обвязки, использующих выданную хостом область задачи |
    | `plugin-sdk/codex-mcp-projection` | Зарезервированное встроенное вспомогательное средство Codex для преобразования пользовательской конфигурации сервера MCP в конфигурацию потока Codex; не предназначено для сторонних плагинов |
    | `plugin-sdk/codex-native-task-runtime` | Встроенное вспомогательное средство Codex в локальном репозитории для подключения нативного зеркалирования задач и среды выполнения; не экспортируется пакетом |
    | `plugin-sdk/channel-runtime-context` | Универсальные вспомогательные средства регистрации и поиска контекста среды выполнения канала |
    | `plugin-sdk/matrix` | Устаревший фасад совместимости Matrix для старых сторонних пакетов каналов; новые плагины должны импортировать `plugin-sdk/run-command` напрямую |
    | `plugin-sdk/mattermost` | Устаревший фасад совместимости Mattermost для старых сторонних пакетов каналов; новые плагины должны импортировать универсальные подпути SDK напрямую |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Устаревший общий модуль реэкспорта для вспомогательных средств команд, перехватчиков, HTTP и интерактивных функций плагинов; предпочитайте специализированные подпути среды выполнения плагинов |
    | `plugin-sdk/hook-runtime` | Устаревший общий модуль реэкспорта для вспомогательных средств Webhook и конвейера внутренних перехватчиков; предпочитайте специализированные подпути среды выполнения перехватчиков и плагинов |
    | `plugin-sdk/lazy-runtime` | Вспомогательные средства отложенного импорта и привязки среды выполнения, такие как `createLazyRuntimeModule`, `createLazyRuntimeMethod` и `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Вспомогательные средства выполнения процессов |
    | `plugin-sdk/cli-runtime` | Устаревший общий модуль реэкспорта для форматирования CLI, ожидания, версии, вызова с аргументами и отложенной загрузки групп команд; предпочитайте специализированные подпути CLI и среды выполнения |
    | `plugin-sdk/qa-live-transport-scenarios` | Общие идентификаторы сценариев QA для активных транспортов, вспомогательные средства базового покрытия и выбора сценариев |
    | `plugin-sdk/qa-runner-runtime` | Поддерживаемый фасад, предоставляющий сценарии QA плагинов через интерфейс команд CLI |
    | `plugin-sdk/tts-runtime` | Поддерживаемый фасад для схем конфигурации преобразования текста в речь и вспомогательных средств среды выполнения |
    | `plugin-sdk/gateway-method-runtime` | Зарезервированное вспомогательное средство диспетчеризации методов Gateway для HTTP-маршрутов плагинов, объявляющих `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клиент Gateway, вспомогательное средство запуска клиента после готовности цикла событий, RPC Gateway для CLI, ошибки протокола Gateway, разрешение объявленного хоста LAN и вспомогательные средства обновления состояния каналов |
    | `plugin-sdk/config-contracts` | Специализированный конфигурационный интерфейс только для типов форм конфигурации плагинов, таких как `OpenClawConfig`, а также типов конфигурации каналов и провайдеров |
    | `plugin-sdk/plugin-config-runtime` | Вспомогательные средства поиска конфигурации плагинов во время выполнения, такие как `requireRuntimeConfig`, `resolvePluginConfigObject` и `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Вспомогательные средства транзакционного изменения конфигурации, такие как `mutateConfigFile`, `replaceConfigFile` и `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Общие строки-подсказки метаданных доставки инструментов сообщений |
    | `plugin-sdk/runtime-config-snapshot` | Вспомогательные средства моментального снимка конфигурации текущего процесса, такие как `getRuntimeConfig`, `getRuntimeConfigSnapshot`, а также средства установки тестовых снимков |
    | `plugin-sdk/text-autolink-runtime` | Обнаружение автоссылок на файловые ссылки без общего текстового модуля реэкспорта |
    | `plugin-sdk/reply-runtime` | Общие вспомогательные средства среды выполнения входящих сообщений и ответов, разбиение на части, диспетчеризация, Heartbeat и планировщик ответов |
    | `plugin-sdk/reply-dispatch-runtime` | Узкоспециализированные вспомогательные средства диспетчеризации и завершения ответов, а также меток бесед |
    | `plugin-sdk/reply-history` | Общие вспомогательные средства краткосрочной истории ответов. Новый код обработки сообщений должен использовать `createChannelHistoryWindow`; низкоуровневые вспомогательные средства карт остаются только устаревшими экспортами совместимости |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Узкоспециализированные вспомогательные средства разбиения текста и Markdown на части |
    | `plugin-sdk/session-store-runtime` | Вспомогательные средства рабочего процесса сеансов (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), восстановления и жизненного цикла (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), вспомогательные средства маркеров для переходных значений `sessionFile`, ограниченное чтение текста недавних расшифровок пользователя и ассистента по идентификатору сеанса, вспомогательные средства пути к хранилищу сеансов и ключа сеанса, а также чтение времени обновления без общих импортов записи и обслуживания конфигурации |
    | `plugin-sdk/session-transcript-runtime` | Идентификация расшифровок, вспомогательные средства целевого объекта, чтения и записи с учетом области, проекция видимых записей сообщений, публикация обновлений, блокировки записи и ключи попаданий в память расшифровок |
    | `plugin-sdk/sqlite-runtime` | Специализированные вспомогательные средства схемы агентов SQLite, путей и транзакций для собственной среды выполнения без элементов управления жизненным циклом базы данных |
    | `plugin-sdk/cron-store-runtime` | Вспомогательные средства пути, загрузки и сохранения хранилища Cron |
    | `plugin-sdk/state-paths` | Вспомогательные средства путей к каталогам состояния и OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типы состояния по ключу для вспомогательной SQLite плагина, а также централизованная настройка прагм подключения и обслуживания WAL для баз данных, принадлежащих плагинам |
    | `plugin-sdk/routing` | Вспомогательные средства привязки маршрутов, ключей сеансов и учетных записей, такие как `resolveAgentRoute`, `buildAgentSessionKey` и `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Общие вспомогательные средства сводки состояния каналов и учетных записей, значения состояния среды выполнения по умолчанию и вспомогательные средства метаданных проблем |
    | `plugin-sdk/target-resolver-runtime` | Общие вспомогательные средства разрешения целевых объектов |
    | `plugin-sdk/string-normalization-runtime` | Вспомогательные средства нормализации слагов и строк |
    | `plugin-sdk/request-url` | Извлечение строковых URL из входных данных, подобных fetch или request |
    | `plugin-sdk/run-command` | Средство запуска команд с ограничением по времени и нормализованными результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Общие средства чтения параметров инструментов и CLI |
    | `plugin-sdk/tool-plugin` | Определение простого типизированного плагина инструментов агента и предоставление статических метаданных для генерации манифеста |
    | `plugin-sdk/tool-payload` | Извлечение нормализованных полезных нагрузок из объектов результатов инструментов |
    | `plugin-sdk/tool-send` | Извлечение канонических полей цели отправки из аргументов инструмента |
    | `plugin-sdk/sandbox` | Типы серверной части песочницы и вспомогательные средства команд SSH/OpenShell, включая предварительную проверку команды выполнения с немедленным завершением при ошибке |
    | `plugin-sdk/temp-path` | Общие вспомогательные средства путей временной загрузки и закрытые безопасные временные рабочие пространства |
    | `plugin-sdk/logging-core` | Вспомогательные средства журналирования подсистем и редактирования конфиденциальных данных |
    | `plugin-sdk/markdown-table-runtime` | Режим таблиц Markdown и вспомогательные средства преобразования |
    | `plugin-sdk/model-session-runtime` | Вспомогательные средства переопределения модели и сеанса, такие как `applyModelOverrideToSessionEntry` и `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Вспомогательные средства разрешения конфигурации провайдера разговорного режима |
    | `plugin-sdk/json-store` | Небольшие вспомогательные средства чтения и записи состояния JSON |
    | `plugin-sdk/json-unsafe-integers` | Вспомогательные средства разбора JSON, сохраняющие небезопасные целочисленные литералы в виде строк |
    | `plugin-sdk/file-lock` | Вспомогательные средства реентерабельной блокировки файлов |
    | `plugin-sdk/persistent-dedupe` | Вспомогательные средства дискового кеша дедупликации |
    | `plugin-sdk/acp-runtime` | Вспомогательные средства среды выполнения и сеансов ACP, а также диспетчеризации ответов |
    | `plugin-sdk/acp-runtime-backend` | Облегчённые вспомогательные средства регистрации серверной части ACP и диспетчеризации ответов для плагинов, загружаемых при запуске |
    | `plugin-sdk/acp-binding-resolve-runtime` | Разрешение привязок ACP только для чтения без импортов запуска жизненного цикла |
    | `plugin-sdk/agent-config-primitives` | Устаревшие примитивы схемы конфигурации среды выполнения агента; импортируйте примитивы схемы из поддерживаемого интерфейса, принадлежащего плагину |
    | `plugin-sdk/boolean-param` | Нестрогое средство чтения логического параметра |
    | `plugin-sdk/dangerous-name-runtime` | Вспомогательные средства разрешения сопоставления опасных имён |
    | `plugin-sdk/device-bootstrap` | Вспомогательные средства начальной настройки устройства и токенов сопряжения, включая `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Общие примитивы вспомогательных средств пассивных каналов, состояния и фонового прокси |
    | `plugin-sdk/models-provider-runtime` | Вспомогательные средства ответов команд и провайдеров `/models` |
    | `plugin-sdk/skill-commands-runtime` | Вспомогательные средства вывода списка команд Skills |
    | `plugin-sdk/native-command-registry` | Вспомогательные средства реестра, построения и сериализации нативных команд |
    | `plugin-sdk/agent-harness` | Экспериментальный интерфейс доверенных плагинов для низкоуровневых сред-обвязок агентов: типы среды-обвязки, вспомогательные средства управления и прерывания активного запуска, вспомогательные средства моста инструментов OpenClaw, политики инструментов плана среды выполнения, классификация исходов терминала, вспомогательные средства форматирования и детализации хода выполнения инструментов и утилиты результатов попыток |
    | `plugin-sdk/provider-zai-endpoint` | Устаревший фасад обнаружения конечных точек, принадлежащий провайдеру Z.AI; используйте общедоступный API плагина Z.AI |
    | `plugin-sdk/async-lock-runtime` | Локальное для процесса вспомогательное средство асинхронной блокировки небольших файлов состояния среды выполнения |
    | `plugin-sdk/channel-activity-runtime` | Вспомогательное средство телеметрии активности каналов |
    | `plugin-sdk/concurrency-runtime` | Вспомогательное средство ограниченного параллелизма асинхронных задач |
    | `plugin-sdk/dedupe-runtime` | Вспомогательные средства кеша дедупликации в памяти и с постоянным хранилищем |
    | `plugin-sdk/delivery-queue-runtime` | Вспомогательное средство опустошения очереди ожидающих исходящих доставок |
    | `plugin-sdk/file-access-runtime` | Безопасные вспомогательные средства путей к локальным файлам и источникам медиа |
    | `plugin-sdk/heartbeat-runtime` | Вспомогательные средства пробуждения, событий и видимости Heartbeat |
    | `plugin-sdk/expect-runtime` | Вспомогательное средство проверки обязательного значения для доказуемых инвариантов среды выполнения |
    | `plugin-sdk/number-runtime` | Вспомогательное средство числового приведения |
    | `plugin-sdk/secure-random-runtime` | Вспомогательные средства безопасных токенов и UUID |
    | `plugin-sdk/system-event-runtime` | Вспомогательные средства очереди системных событий |
    | `plugin-sdk/transport-ready-runtime` | Вспомогательное средство ожидания готовности транспорта |
    | `plugin-sdk/exec-approvals-runtime` | Вспомогательные средства файла политики подтверждения выполнения без общего модуля реэкспорта инфраструктурной среды выполнения |
    | `plugin-sdk/infra-runtime` | Устаревшая прослойка совместимости; используйте специализированные подпути среды выполнения выше |
    | `plugin-sdk/collection-runtime` | Небольшие вспомогательные средства ограниченного кеша |
    | `plugin-sdk/diagnostic-runtime` | Вспомогательные средства диагностических флагов, событий и контекста трассировки |
    | `plugin-sdk/error-runtime` | Граф ошибок, форматирование, общие вспомогательные средства классификации ошибок, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Вспомогательные средства обёрнутого fetch, прокси, параметров EnvHttpProxyAgent и закреплённого поиска |
    | `plugin-sdk/runtime-fetch` | Учитывающий диспетчер fetch среды выполнения без импортов прокси и защищённого fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Вспомогательные средства очистки URL данных встроенных изображений и распознавания сигнатур без общего интерфейса среды выполнения медиа |
    | `plugin-sdk/response-limit-runtime` | Средство чтения тела ответа с ограничением без общего интерфейса среды выполнения медиа |
    | `plugin-sdk/session-binding-runtime` | Текущее состояние привязки беседы без настроенной маршрутизации привязок или хранилищ сопряжений |
    | `plugin-sdk/context-visibility-runtime` | Разрешение видимости контекста и фильтрация дополнительного контекста без общих импортов конфигурации и безопасности |
    | `plugin-sdk/string-coerce-runtime` | Узкоспециализированные примитивные вспомогательные средства приведения и нормализации записей и строк без импортов Markdown и журналирования |
    | `plugin-sdk/text-utility-runtime` | Низкоуровневые вспомогательные средства для текста и путей, включая экранирование пяти сущностей HTML |
    | `plugin-sdk/host-runtime` | Вспомогательные средства нормализации имени хоста и хоста SCP |
    | `plugin-sdk/retry-runtime` | Вспомогательные средства конфигурации и запуска повторных попыток |
    | `plugin-sdk/agent-runtime` | Устаревший общий модуль реэкспорта для вспомогательных средств каталогов, идентификации и рабочих пространств агентов, включая `resolveAgentDir`, `resolveDefaultAgentDir` и устаревший экспорт совместимости `resolveOpenClawAgentDir`; предпочитайте специализированные подпути агентов и среды выполнения |
    | `plugin-sdk/directory-runtime` | Запрос и дедупликация каталогов на основе конфигурации |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Подпути возможностей и тестирования">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Устаревший общий модуль экспорта для мультимедиа, включающий `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` и устаревший `fetchRemoteMedia`; предпочитайте `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` и подпути среды выполнения возможностей, а когда URL должен преобразовываться в мультимедиа OpenClaw, перед чтением буфера предпочитайте вспомогательные функции хранилища |
    | `plugin-sdk/media-mime` | Узконаправленные вспомогательные функции для нормализации MIME, сопоставления расширений файлов, определения MIME и типов мультимедиа |
    | `plugin-sdk/media-store` | Узконаправленные вспомогательные функции хранилища мультимедиа, такие как `saveMediaBuffer` и `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Общие вспомогательные функции переключения при сбоях генерации мультимедиа, выбора кандидатов и формирования сообщений об отсутствующей модели |
    | `plugin-sdk/media-understanding` | Типы провайдеров анализа мультимедиа, а также экспорты предназначенных для провайдеров вспомогательных функций обработки изображений, аудио и извлечения структурированных данных |
    | `plugin-sdk/text-chunking` | Разбиение исходящего текста и диапазонов на фрагменты с сохранением смещений, вспомогательные функции разбиения и рендеринга Markdown, преобразование таблиц Markdown, удаление тегов директив и утилиты безопасной обработки текста |
    | `plugin-sdk/speech` | Типы провайдеров речи, а также экспорты предназначенных для провайдеров директив, реестра, проверки, конструктора TTS, совместимого с OpenAI, и вспомогательных функций речи |
    | `plugin-sdk/speech-core` | Общие типы провайдеров речи, реестр, директивы, нормализация и экспорты вспомогательных функций речи |
    | `plugin-sdk/realtime-transcription` | Типы провайдеров транскрибирования в реальном времени, вспомогательные функции реестра и общая вспомогательная функция сеанса WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Вспомогательная функция начальной настройки профиля реального времени для ограниченного внедрения контекста `IDENTITY.md`, `USER.md` и `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типы провайдеров голосовой связи в реальном времени, вспомогательные функции реестра и общие вспомогательные функции поведения голосовой связи в реальном времени, включая отслеживание активности вывода |
    | `plugin-sdk/image-generation` | Типы провайдеров генерации изображений, вспомогательные функции для ресурсов изображений и URL данных, а также конструктор провайдера изображений, совместимого с OpenAI |
    | `plugin-sdk/image-generation-core` | Общие типы генерации изображений, а также вспомогательные функции переключения при сбоях, аутентификации и реестра |
    | `plugin-sdk/music-generation` | Типы провайдера, запроса и результата генерации музыки |
    | `plugin-sdk/music-generation-core` | Устаревшие общие типы генерации музыки, вспомогательные функции переключения при сбоях, поиска провайдера и разбора ссылки на модель; предпочитайте поверхности музыкальных провайдеров, принадлежащие плагинам |
    | `plugin-sdk/video-generation` | Типы провайдера, запроса и результата генерации видео |
    | `plugin-sdk/video-generation-core` | Общие типы генерации видео, вспомогательные функции переключения при сбоях, поиска провайдера и разбора ссылки на модель |
    | `plugin-sdk/transcripts` | Общие типы провайдеров источников транскриптов, вспомогательные функции реестра, дескрипторы сеансов и метаданные высказываний |
    | `plugin-sdk/webhook-targets` | Реестр целевых объектов Webhook и вспомогательные функции установки маршрутов |
    | `plugin-sdk/webhook-path` | Устаревший псевдоним совместимости; используйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Общие вспомогательные функции удалённой и локальной загрузки мультимедиа |
    | `plugin-sdk/zod` | Устаревший повторный экспорт для совместимости; импортируйте `zod` непосредственно из `zod` |
    | `plugin-sdk/testing` | Локальный для репозитория устаревший общий модуль экспорта совместимости для прежних тестов OpenClaw. Новые тесты репозитория должны вместо него импортировать специализированные локальные тестовые подпути, такие как `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` или `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальная для репозитория минимальная вспомогательная функция `createTestPluginApi` для модульных тестов прямой регистрации плагинов без импорта мостов тестовых вспомогательных функций репозитория |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальные для репозитория фикстуры контракта нативного адаптера среды выполнения агента для тестов аутентификации, доставки, резервного поведения, перехватчиков инструментов, наложения подсказок, схемы и проекции транскриптов |
    | `plugin-sdk/channel-test-helpers` | Локальные для репозитория ориентированные на каналы тестовые вспомогательные функции для общих контрактов действий, настройки и состояния, проверок каталогов, жизненного цикла запуска учётной записи, передачи конфигурации отправки, имитаций среды выполнения, проблем состояния, исходящей доставки и регистрации перехватчиков |
    | `plugin-sdk/channel-target-testing` | Локальный для репозитория общий набор тестов ошибочных случаев разрешения целевых объектов для тестов каналов |
    | `plugin-sdk/channel-contract-testing` | Локальные для репозитория узконаправленные вспомогательные функции тестирования контрактов каналов без общего тестового модуля экспорта |
    | `plugin-sdk/plugin-test-contracts` | Локальные для репозитория вспомогательные функции контрактов пакета плагина, регистрации, публичных артефактов, прямого импорта, API среды выполнения и побочных эффектов импорта |
    | `plugin-sdk/plugin-state-test-runtime` | Локальные для репозитория вспомогательные функции тестирования хранилища состояния плагина, очереди входящих данных и базы данных состояния |
    | `plugin-sdk/provider-test-contracts` | Локальные для репозитория вспомогательные функции контрактов среды выполнения провайдера, аутентификации, обнаружения, первоначальной настройки, каталога, мастера, возможностей мультимедиа, политики повторного воспроизведения, передачи аудио для STT в реальном времени, веб-поиска и получения данных, а также потоковой передачи |
    | `plugin-sdk/provider-http-test-mocks` | Локальные для репозитория подключаемые имитации HTTP и аутентификации Vitest для тестов провайдеров, использующих `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Локальные для репозитория вспомогательные функции прикрепления метаданных к фикстурам полезной нагрузки ответа |
    | `plugin-sdk/sqlite-runtime-testing` | Локальные для репозитория вспомогательные функции жизненного цикла SQLite для тестов основной кодовой базы |
    | `plugin-sdk/test-fixtures` | Локальные для репозитория фикстуры общего перехвата среды выполнения CLI, контекста песочницы, средства записи навыков, сообщений агента, системных событий, перезагрузки модулей, пути встроенного плагина, текста терминала, разбиения на фрагменты, токена аутентификации и типизированных случаев |
    | `plugin-sdk/test-node-mocks` | Локальные для репозитория специализированные вспомогательные функции имитации встроенных модулей Node для использования внутри фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Подпути памяти">
    | Подпуть | Основные экспорты |
    | --- | --- |
    | `plugin-sdk/memory-core` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Устаревший фасад среды выполнения индексирования и поиска в памяти; предпочитайте нейтральные к поставщику подпути узла памяти |
    | `plugin-sdk/memory-core-host-embedding-registry` | Облегчённые вспомогательные функции реестра провайдеров векторных представлений памяти |
    | `plugin-sdk/memory-core-host-engine-foundation` | Экспорты базового движка узла памяти |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракты векторных представлений узла памяти, доступ к реестру, локальный провайдер и общие вспомогательные функции пакетной и удалённой обработки. `registerMemoryEmbeddingProvider` на этой поверхности устарел; для новых провайдеров используйте общий API провайдера векторных представлений. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Экспорты движка QMD узла памяти |
    | `plugin-sdk/memory-core-host-engine-storage` | Экспорты механизма хранения узла памяти |
    | `plugin-sdk/memory-core-host-multimodal` | Устаревшие мультимодальные вспомогательные функции узла памяти; предпочитайте нейтральные к поставщику подпути узла памяти |
    | `plugin-sdk/memory-core-host-query` | Устаревшие вспомогательные функции запросов узла памяти; предпочитайте нейтральные к поставщику подпути узла памяти |
    | `plugin-sdk/memory-core-host-secret` | Вспомогательные функции секретов узла памяти |
    | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Вспомогательные функции состояния узла памяти |
    | `plugin-sdk/memory-core-host-runtime-cli` | Вспомогательные функции среды выполнения CLI узла памяти |
    | `plugin-sdk/memory-core-host-runtime-core` | Основные вспомогательные функции среды выполнения узла памяти |
    | `plugin-sdk/memory-core-host-runtime-files` | Вспомогательные функции файлов и среды выполнения узла памяти |
    | `plugin-sdk/memory-host-core` | Нейтральный к поставщику псевдоним основных вспомогательных функций среды выполнения узла памяти |
    | `plugin-sdk/memory-host-events` | Нейтральный к поставщику псевдоним вспомогательных функций журнала событий узла памяти |
    | `plugin-sdk/memory-host-files` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Общие вспомогательные функции управляемого Markdown для плагинов, связанных с памятью |
    | `plugin-sdk/memory-host-search` | Фасад среды выполнения Active Memory для доступа к диспетчеру поиска |
    | `plugin-sdk/memory-host-status` | Устаревший псевдоним совместимости; используйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервированные подпути встроенных вспомогательных функций">
    Зарезервированные подпути SDK встроенных вспомогательных функций — это узконаправленные поверхности для кода
    встроенных плагинов, относящиеся к конкретным владельцам. Они учитываются в реестре SDK, чтобы сборки
    пакетов и создание псевдонимов оставались детерминированными, однако они не являются универсальными API
    для разработки плагинов. Новые переиспользуемые контракты узла должны использовать общие подпути SDK,
    такие как `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` и
    `plugin-sdk/plugin-config-runtime`.

    | Подпуть | Владелец и назначение |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Вспомогательная функция встроенного плагина Codex для проецирования пользовательской конфигурации сервера MCP в конфигурацию потока сервера приложений Codex (зарезервированный экспорт пакета) |
    | `plugin-sdk/codex-native-task-runtime` | Вспомогательная функция встроенного плагина Codex для зеркального отображения нативных субагентов сервера приложений Codex в состоянии задач OpenClaw (только локально для репозитория, не является экспортом пакета) |

  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Обзор SDK плагинов](/ru/plugins/sdk-overview)
- [Настройка SDK плагинов](/ru/plugins/sdk-setup)
- [Создание плагинов](/ru/plugins/building-plugins)
