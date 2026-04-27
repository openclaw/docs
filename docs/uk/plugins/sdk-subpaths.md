---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту в плагіні
    - Аудит підшляхів вбудованих плагінів і допоміжних поверхонь
summary: 'Каталог підшляхів SDK Plugin: які імпорти де розміщені, згруповано за областями'
title: Підшляхи SDK Plugin
x-i18n:
    generated_at: "2026-04-27T12:53:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 422e88943203df6f86d63d113fafeee487b420f795d4373619874ccf58edc0f4
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  SDK Plugin надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  Ця сторінка каталогізує найуживаніші підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів розміщено в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи вбудованих плагінів також наведені там, але є
  деталлю реалізації, якщо тільки якась сторінка документації явно не просуває їх.

  Посібник з авторингу плагінів див. у [Огляд SDK Plugin](/uk/plugins/sdk-overview).

  ## Точка входу плагіна

  | Підшлях                        | Ключові експорти                                                                                                                                       |
  | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                   |
  | `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                |
  | `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                      |
  | `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                     |
  | `plugin-sdk/migration`         | Допоміжні елементи провайдера міграцій, як-от `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні засоби редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime` | Допоміжні засоби міграції середовища виконання, як-от `copyMigrationFileItem` і `writeMigrationReport`                                              |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої схеми Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби wizard setup, запити списку дозволів, побудовники стану setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби багатoоблікової конфігурації/обмеження дій, допоміжні засоби резервного типового облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації id облікового запису |
    | `plugin-sdk/account-resolution` | Пошук облікового запису + допоміжні засоби резервного типового значення |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та універсальний побудовник |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації вбудованих каналів, лише для сумісності вбудованих компонентів |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації власних команд Telegram із резервним механізмом контрактів вбудованих компонентів |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби авторизаційних обмежень команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби побудови вхідного маршруту + envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної доставки, ідентичності, делегата надсилання, сеансу, форматування та планування корисного навантаження |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding та адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник media payload для agent |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби binding розмови/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації середовища виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання group-policy середовища виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти плагінів каналів |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби читання/редагування конфігурації списку дозволів |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби автентифікації/захисту прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивної відповіді. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для debounce вхідних повідомлень, зіставлення згадок, допоміжних засобів політики згадок і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок і тексту згадок без ширшої поверхні вхідного runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідних envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту розташування каналу й форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для відкидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналу, а також застарілі допоміжні схеми native, збережені для сумісності плагінів |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Прив’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для setup, виявлення каталогу та підготовки моделей під час роботи |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для локальних типових налаштувань сервера, виявлення моделей, заголовків запитів і допоміжних засобів завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби setup для локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби setup self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-ключів під час роботи для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби onboarding/запису профілю API-ключа, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env vars автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації id моделей, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні допоміжні засоби HTTP/можливостей endpoint провайдера, помилки HTTP провайдера та допоміжні засоби multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контрактів конфігурації/вибору web fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web search для провайдерів, яким не потрібне підключення enable плагіна |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контрактів конфігурації/облікових даних web search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter облікових даних з обмеженою областю |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime провайдера web search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібне |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні допоміжні засоби обгорток для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби native transport провайдера, як-от guarded fetch, трансформації transport message і потоки подій transport із можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування динамічного меню аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання approver і авторизації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки native approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження адаптера native approval для hot точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime для обробника approval; надавайте перевагу вужчим adapter/gateway seam, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей native approval + binding облікових записів |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповідей на exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload exec/plugin approval, допоміжні засоби маршрутизації/runtime native approval і структуровані допоміжні засоби відображення approval, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання dedupe вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контрактів каналів без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native-автентифікація команд, форматування динамічного меню аргументів і допоміжні засоби цілей native session |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для hot шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команд і допоміжні засоби поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналу/плагіна |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, обмеження DM, зовнішнього контенту, порівняння секретів у сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch із захистом SSRF, помилка SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів/цілей Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби обмеження розміру тіла запиту/timeout |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/plugin-install |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env середовища виконання, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованих профілів/типових значень, розбору URL CDP і допоміжних засобів автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Універсальні допоміжні засоби реєстрації та пошуку контексту runtime каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/хуків/http/interactive для плагінів |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline внутрішніх/Webhook-хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy імпорту/binding runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, wait, version, invocation аргументів і lazy груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, CLI RPC Gateway, помилки протоколу Gateway і допоміжні засоби patch стану каналів |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису конфігурації та пошуку конфігурації плагіна |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назв/описів команд Telegram і перевірок дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, побудовники можливостей approval, допоміжні засоби auth/profile, native routing/runtime і форматування структурованих шляхів відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime для вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби short-window історії відповідей, як-от `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сеансів + `updated-at` |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/binding ключа сеансу/облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку стану каналів/облікових записів, типові значення стану runtime і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв’язання цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягує рядкові URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Запускач команд із тайм-аутом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Типові зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягує нормалізовані payload із об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витягує канонічні поля цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистем і редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/json-store` | Допоміжні засоби читання/запису малого JSON-стану |
    | `plugin-sdk/file-lock` | Повторно вхідні допоміжні засоби блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe зберігання на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/session ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання binding ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime agent |
    | `plugin-sdk/boolean-param` | Зчитувач параметра loose boolean |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токена сполучення |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповідей команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native-команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness agent: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби bridge інструментів OpenClaw, допоміжні засоби політики інструментів runtime plan, класифікація terminal outcome, допоміжні засоби форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Допоміжні засоби малого обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби прапорців і подій діагностики |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Fetch середовища виконання з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений зчитувач тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding розмови без configured binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби читання сховища сеансів без широких імпортів запису/супроводу конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації імен хостів і хостів SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору agent |
    | `plugin-sdk/directory-runtime` | Запит/усунення дублікатів каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також побудовники media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover генерації медіа, вибір candidate і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів image/audio для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, як-от видалення тексту, видимого assistant, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також експорти допоміжних засобів директив, реєстру, валідації та мовлення для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, експорти допоміжних засобів реєстру, директив, нормалізації та мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів вбудованого memory-core для менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія foundation для хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embeddings для хоста пам’яті, доступ до реєстру, локальний провайдер і універсальні допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD для хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища для хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби для хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів для хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів для хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій для хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану для хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI для хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні допоміжні засоби runtime для хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime для хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для основних допоміжних засобів runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних засобів стану хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів вбудованого memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи допоміжних засобів вбудованих компонентів">
    | Сімейство | Поточні підшляхи | Призначене використання |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки вбудованого browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів вбудованого IRC |
    | Допоміжні засоби, специфічні для каналів | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі seam сумісності/допоміжних засобів вбудованих каналів. Нові плагіни мають імпортувати універсальні підшляхи SDK або локальні barrel-файли плагіна. |
    | Допоміжні засоби auth/специфічні для плагінів | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam допоміжних засобів вбудованих можливостей/плагінів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язано

- [Огляд SDK Plugin](/uk/plugins/sdk-overview)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
