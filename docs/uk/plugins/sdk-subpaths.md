---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: де розміщені імпорти, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-05-06T01:10:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 988368c92a74a670b3b5ad372e7f60c54826189049f1d9bea252e76ad771686a
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK для plugin надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
На цій сторінці наведено поширені підшляхи, згруповані за призначенням. Згенерований
повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
зарезервовані допоміжні підшляхи bundled-plugin також є там, але вони є деталлю
реалізації, якщо сторінка документації явно не робить їх публічними. Мейнтейнер може перевірити активні
зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
зарезервовані допоміжні експорти провалюють звіт CI, а не залишаються в публічному SDK
як пасивний борг сумісності.

Посібник зі створення plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

## Вхідна точка Plugin

| Підшлях                                   | Ключові експорти                                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів plugin; для нових тестів розширень надавайте перевагу цільовим тестовим підшляхам                                                                     |
| `plugin-sdk/plugin-test-api`              | Мінімальний конструктор mock `OpenClawPluginApi` для unit-тестів прямої реєстрації plugin                                                                                           |
| `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для профілів автентифікації, пригнічення доставки, класифікації fallback, хуків інструментів, накладок prompt, схем і відновлення transcript |
| `plugin-sdk/channel-test-helpers`         | Допоміжні засоби тестування життєвого циклу облікового запису каналу, каталогу, send-config, runtime mock, hook, входу bundled channel, timestamp envelope, pairing reply і загальних контрактів каналу   |
| `plugin-sdk/channel-target-testing`       | Спільний набір тестів випадків помилок розв’язання цілі каналу                                                                                                                       |
| `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби контрактів реєстрації plugin, package manifest, публічного artifact, runtime API, side-effect імпорту та прямого імпорту                                                  |
| `plugin-sdk/plugin-test-runtime`          | Фікстури для тестів runtime plugin, registry, provider-registration, setup-wizard і runtime task-flow                                                                      |
| `plugin-sdk/provider-test-contracts`      | Допоміжні засоби контрактів provider runtime, auth, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch і wizard                 |
| `plugin-sdk/provider-http-test-mocks`     | Opt-in Vitest HTTP/auth mocks для тестів provider, які перевіряють `plugin-sdk/provider-http`                                                                                    |
| `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, одноразового HTTP-сервера, incoming request, live-test, тимчасової файлової системи й time-control                                        |
| `plugin-sdk/test-fixtures`                | Загальні фікстури тестів CLI, sandbox, skill, agent-message, system-event, module reload, шляху bundled plugin, terminal, chunking, auth-token і typed-case                   |
| `plugin-sdk/test-node-mocks`              | Цільові допоміжні засоби mock для вбудованих модулів Node, які використовуються всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
| `plugin-sdk/migration`                    | Допоміжні засоби елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери стану елементів, допоміжні засоби редагування та `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | Runtime-допоміжні засоби міграції, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, підказки списку дозволених, збирачі статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції конфігурації з кількома обліковими записами та gate дій, допоміжні функції резервного переходу до стандартного облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису й резервного переходу до стандартного |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції списку облікових записів і дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Допоміжні функції застарілого конвеєра відповідей. Новий код конвеєра відповідей каналу має використовувати `createChannelMessageReplyPipeline` і `resolveChannelMessageSourceReplyDeliveryMode` з `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також Zod і прямі збирачі JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled-каналів OpenClaw лише для підтримуваних bundled plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації bundled-каналів |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram з резервним переходом до bundled-контракту |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` і застарілі допоміжні функції життєвого циклу потоку чернеток. Новий код фіналізації preview має використовувати `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Недорогі допоміжні функції контракту життєвого циклу повідомлень, як-от `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, фасади сумісності, виведення можливості durable-final, допоміжні функції доказу можливостей для можливостей надсилання/отримання/побічних ефектів, `MessageReceiveContext`, докази політики підтвердження отримання, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, докази можливостей live-preview і live-finalizer, стан durable-відновлення, `RenderedMessageBatch`, типи підтверджень отримання повідомлень і допоміжні функції id підтверджень. Див. [API повідомлень каналу](/uk/plugins/sdk-channel-message). Застарілий `createChannelTurnReplyPipeline` лишається лише для диспетчерів сумісності. |
    | `plugin-sdk/channel-message-runtime` | Допоміжні функції доставлення під час виконання, які можуть завантажувати outbound-доставлення, зокрема `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` і `recordChannelMessageReplyDispatch`. Використовуйте з runtime-модулів моніторингу/надсилання, а не з hot-файлів bootstrap Plugin. |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції inbound-маршруту та збирача envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілі спільні допоміжні функції запису й диспетчеризації inbound, предикати visible/final диспетчеризації та застаріла сумісність `deliverDurableInboundReplyPayload` для підготовлених диспетчерів каналів. Новий код отримання/диспетчеризації каналу має імпортувати допоміжні функції життєвого циклу runtime з `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження outbound-медіа |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей outbound-надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції outbound-доставлення, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу thread-binding і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий збирач медіа-payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язування розмови/потоку, pair і налаштованого binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція snapshot runtime-конфігурації |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції розв’язання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви config-schema каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації списку дозволених |
    | `plugin-sdk/group-access` | Спільні допоміжні функції прийняття рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції авторизації/guard для direct-DM |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної owner-сумісності; нові plugins мають використовувати загальні підшляхи SDK каналу |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв’язання облікових записів Telegram для відстежуваної owner-сумісності; нові plugins мають використовувати інжектовані runtime-допоміжні функції або загальні підшляхи SDK каналу |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові plugins мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставлення та застарілі допоміжні функції інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, зіставлення згадок, допоміжних функцій mention-policy і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні функції inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції mention-policy, маркера згадки й тексту згадки без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні функції форматування inbound envelope |
    | `plugin-sdk/channel-location` | Контекст розташування каналу та допоміжні функції форматування |
    | `plugin-sdk/channel-logging` | Допоміжні функції журналювання каналу для inbound drop і помилок typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій з повідомленнями каналу, а також застарілі допоміжні функції native-схеми, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршрутів, розв’язання цілей на основі парсера, перетворення thread-id на рядок, dedupe/compact ключі маршрутів, типи parsed-target і допоміжні функції порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` і типи secret-цілей |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад середовища виконання LM Studio для стандартних значень локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локальних/самостійно розгорнутих провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування самостійно розгорнутих провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Стандартні значення бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-ключів під час виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/API-ключів і запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політики повторного відтворення, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації ідентифікаторів моделей, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук середовища виконання для доповнення каталогу провайдерів і registry Plugin провайдерів для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби можливостей HTTP/endpoint провайдера, HTTP-помилки провайдера та допоміжні засоби multipart-форм для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне зв’язування ввімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/середовища виконання провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків, а також спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдерів, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби виправлення конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби singleton/map/cache, локальні для процесу |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби registry команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання approver і автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра нативного схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки схвалень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання Gateway для схвалень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативних адаптерів схвалень для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби середовища виконання обробника схвалень; надавайте перевагу вужчим seams адаптера/Gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі схвалення + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на схвалення exec/Plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload схвалення exec/Plugin, допоміжні засоби маршрутизації/середовища виконання нативних схвалень і допоміжні засоби структурованого відображення схвалень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби контрактних тестів каналів без широкого barrel для тестування |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної цілі сесії |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналів/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, gated доступу до DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої infra-поверхні середовища виконання |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, SSRF-захищеного fetch, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook-запиту/цілі та приведення сирого websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/логування/резервного копіювання/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime, логера, тайм-ауту, повторної спроби та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL та допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Допоміжні засоби реєстрації та пошуку generic runtime-context каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` напряму |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати generic підшляхи SDK напряму |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/інтерактивності plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язки runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику з аргументами та лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта, готового до event loop, RPC CLI gateway, помилки протоколу gateway і допоміжні засоби patch статусу каналу |
    | `plugin-sdk/config-types` | Type-only поверхня конфігурації для форм конфігурації plugin, як-от `OpenClawConfig`, і типів конфігурації каналу/провайдера |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації plugin під час runtime, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби snapshot конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і setters тестових snapshot |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команди Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/plugin, builders можливостей схвалення, допоміжні засоби auth/profile, native routing/runtime і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні runtime допоміжні засоби inbound/reply, chunking, dispatch, Heartbeat, планувальник reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби reply dispatch/finalize і conversation-label |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби short-window reply-history і markers, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сеансів, ключа сеансу, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/load/save сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби route/session-key/account binding, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку статусу каналу/облікового запису, типові значення runtime-state і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витяг рядкових URL з fetch/request-like входів |
    | `plugin-sdk/run-command` | Runner команд із тайм-аутом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні readers параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витяг нормалізованих payload з об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витяг канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби subsystem logger і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сеансу, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації talk provider |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/session і reply-dispatch ACP |
    | `plugin-sdk/acp-runtime-backend` | Легкі допоміжні засоби реєстрації backend ACP і reply-dispatch для plugins, завантажених під час startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання binding ACP без імпортів startup життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі primitives схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий reader булевого параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання зіставлення dangerous-name |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні primitives допоміжних засобів passive-channel, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби reply для команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skill |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби registry/build/serialize native commands |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агентів: типи harness, допоміжні засоби steer/abort active-run, допоміжні засоби bridge інструментів OpenClaw, допоміжні засоби політик інструментів runtime-plan, класифікація результатів термінала, допоміжні засоби форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для малих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб bounded async task concurrency |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу dedupe в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain pending-delivery outbound |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб numeric coercion |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних token/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий compatibility shim; використовуйте наведені вище сфокусовані підшляхи runtime |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби diagnostic flag, event і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, опція EnvHttpProxyAgent і pinned lookup helpers |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Bounded reader response-body без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding розмови без configured binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів записів/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація supplemental context без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби coercion і нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації повторних спроб і retry runner |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/workspace агента, зокрема `resolveAgentDir`, `resolveDefaultAgentDir` і застарілий compatibility export `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запит/дедуп директорії на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання/перетворення/зберігання медіа, визначення розмірів відео на основі ffprobe та побудовники медіанавантажень |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби медіасховища, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, орієнтовані на провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/Markdown/журналювання, як-от вилучення видимого для асистента тексту, допоміжні засоби рендерингу/розбиття/таблиць Markdown, допоміжні засоби редагування конфіденційних даних, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи мовленнєвих провайдерів, а також експорти директив, реєстру, валідації, сумісного з OpenAI побудовника TTS і допоміжних засобів мовлення, орієнтовані на провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовленнєвих провайдерів, реєстр, директива, нормалізація та експорти допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби для ресурсів зображень/data URL і сумісний з OpenAI побудовник провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на модель |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на модель |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK Plugin |
    | `plugin-sdk/testing` | Широкий compatibility barrel для застарілих тестів Plugin. Нові тести Plugin мають натомість імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту мостів тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для тестів автентифікації, доставки, резервного варіанта, перехоплення інструментів, накладання промпта, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові допоміжні засоби для загальних контрактів дій/налаштування/статусу, тверджень щодо директорій, життєвого циклу запуску облікового запису, потоків конфігурації надсилання, моків runtime, проблем статусу, вихідної доставки та реєстрації перехоплень |
    | `plugin-sdk/channel-target-testing` | Спільний набір тестів випадків помилок визначення цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, автентифікації, виявлення, підключення, каталогу, майстра, можливостей медіа, політики повторного відтворення, живого аудіо STT у реальному часі, вебпошуку/отримання та потоку |
    | `plugin-sdk/provider-http-test-mocks` | Опціональні HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту пісочниці, записувача skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal-text, розбиття, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для допоміжних засобів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія foundation хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embeddings хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote допоміжні засоби |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника alias для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника alias для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника alias для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для Plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника alias для допоміжних засобів статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Наразі немає зарезервованих підшляхів SDK bundled-helper. Специфічні для власника
    допоміжні засоби містяться всередині пакета Plugin, якому вони належать, тоді як багаторазові контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд SDK Plugin](/uk/plugins/sdk-overview)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
