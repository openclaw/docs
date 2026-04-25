---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту в plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-25T02:02:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b6d3603a94328d94981642f94e43913f6d5476b1f6a0970baf23bed7e11105
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог поширених підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також там присутні, але є деталлю
  реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з написання plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Вхід plugin

  | Підшлях                    | Ключові експорти                                                                                                                       |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, запити allowlist, побудова статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції багатоакаунтної конфігурації/обмеження дій і резервного переходу до акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку акаунта + резервного переходу до акаунта за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції для списків акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram з резервною підтримкою bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні функції життєвого циклу/фіналізації потоку чернеток |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції маршрутизації вхідних повідомлень і побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису й диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідної доставки, ідентичності, делегата надсилання, сесій, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки розмов/потоків, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації часу виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення групової політики часу виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції знімка/зведення статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції рішень щодо доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції автентифікації/захисту прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні функції інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для допоміжних функцій debounce вхідних повідомлень, зіставлення згадок, політики згадок і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні функції debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції політики згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні функції форматування inbound envelope |
    | `plugin-sdk/channel-location` | Допоміжні функції контексту й форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні функції логування каналу для відкинутих вхідних повідомлень і помилок typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій із повідомленнями каналу, а також застарілі нативні допоміжні функції схем, збережені для сумісності plugin |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Прив’язка feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції контракту секретів, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдера, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Значення CLI backend за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-ключа під час виконання для plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу API-ключа/запису профілю, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку auth env var для провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні функції endpoint провайдера та функції нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/можливостей endpoint провайдера, помилки provider HTTP і допоміжні функції multipart form для транскрибування аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування web-fetch провайдера |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для провайдерів, яким не потрібна логіка ввімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/runtime для web-search провайдера |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні функції обгорток для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Нативні допоміжні функції транспорту провайдера, такі як guarded fetch, перетворення transport message і потоки подій writable transport |
    | `plugin-sdk/provider-onboard` | Допоміжні функції патчингу конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра нативного затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки нативного затвердження |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція визначення Gateway для затвердження |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні функції завантаження адаптера нативного затвердження для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні функції runtime для обробника затвердження; надавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції нативного затвердження цілі + прив’язки акаунта |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді на затвердження exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні функції payload затвердження exec/plugin, допоміжні функції маршрутизації/runtime нативного затвердження та структуровані допоміжні функції відображення затвердження, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд + допоміжні функції цілі нативної сесії |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні функції нормалізації тіла команди та поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання secret-contract для поверхонь секретів каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції `coerceSecretRef` і типізації SecretRef для парсингу secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, DM gating, зовнішнього вмісту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції pinned dispatcher без широкої інфраструктурної runtime-поверхні |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned dispatcher, fetch із захистом SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції парсингу секретного введення |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції обмеження розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції runtime/логування/резервного копіювання/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні функції реєстрації та пошуку runtime-контексту каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції команд/хуків/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції pipeline для webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy import/прив’язки runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта Gateway і патчингу статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації та пошуку конфігурації plugin |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня bundled Telegram contract недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для посилань на файли без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні функції затвердження exec/plugin, конструктори approval-capability, допоміжні функції auth/profile, допоміжні функції native routing/runtime і форматування структурованого шляху відображення затвердження |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції inbound/reply runtime, chunking, dispatch, Heartbeat, planner відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції коротковіконної історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху сховища сесій + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції маршруту/ключа сесії/прив’язки акаунта, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції зведення статусу каналу/акаунта, типові значення runtime-state та допоміжні функції метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягання рядкових URL з fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Запускач команд із таймінгом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягання нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягання канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів до тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні функції logger підсистем і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму та перетворення таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису JSON-стану |
    | `plugin-sdk/file-lock` | Допоміжні функції повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції кешу дедуплікації з дисковим зберіганням |
    | `plugin-sdk/acp-runtime` | Допоміжні функції runtime/сесій ACP і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Лише для читання: визначення прив’язок ACP без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції визначення збігу небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції початкового налаштування пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних функцій passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції відповіді провайдера/команди `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні функції реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні функції steer/abort активного запуску, допоміжні функції мосту tool OpenClaw, допоміжні функції форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні функції системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні функції класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого тіла відповіді без широкої media runtime-поверхні |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації налаштованих прив’язок або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції читання сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні функції приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запити/дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store для медіа, а також конструктори media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні функції сховища медіа, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також орієнтовані на провайдера експорти допоміжних функцій для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції text/markdown/logging, такі як вилучення тексту, видимого асистенту, допоміжні функції рендерингу/chunking/таблиць Markdown, редагування чутливих даних, допоміжні функції тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також орієнтовані на провайдера експорти директив, реєстру, валідації та допоміжних функцій мовлення |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, реєстр, директива, нормалізація та експорти допоміжних функцій мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні функції реєстру та спільна допоміжна функція WebSocket-сесії |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні функції реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні функції failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні функції failover, пошуку провайдера і парсингу model-ref |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні функції failover, пошуку провайдера і парсингу model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні функції реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних функцій bundled memory-core для manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote допоміжні функції |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Багатомодальні допоміжні функції хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні допоміжні функції runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для основних допоміжних функцій runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних функцій журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних функцій файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції керованого Markdown для plugin, пов’язаних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Runtime facade Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних функцій статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних функцій bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні функції підтримки bundled browser plugin (`browser-support` залишається barrel сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних функцій/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних функцій/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних функцій bundled IRC |
    | Допоміжні функції для окремих каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/допоміжних функцій bundled каналів |
    | Допоміжні функції для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви допоміжних функцій bundled можливостей/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugin](/uk/plugins/building-plugins)
