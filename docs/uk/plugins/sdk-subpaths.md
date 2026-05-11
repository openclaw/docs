---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту в Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областю'
title: Підшляхи SDK Plugin
x-i18n:
    generated_at: "2026-05-11T20:51:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK надається як набір вузьких публічних підшляхів у
`openclaw/plugin-sdk/`. На цій сторінці каталогізовано поширено використовувані підшляхи, згруповані за
призначенням. Згенерований інвентар вхідних точок компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета є публічною підмножиною
після віднімання repo-local тестових/внутрішніх підшляхів, перелічених у
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainers можуть перевіряти
кількість публічних експортів за допомогою `pnpm plugin-sdk:surface`, а активні зарезервовані
допоміжні підшляхи — за допомогою `pnpm plugins:boundary-report:summary`; невикористані зарезервовані
допоміжні експорти призводять до помилки CI-звіту замість того, щоб залишатися в публічному SDK як
неактивний борг сумісності.

Посібник з авторингу Plugin див. у [огляді Plugin SDK](/uk/plugins/sdk-overview).

## Вхід Plugin

| Підшлях                        | Ключові експорти                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Допоміжні елементи постачальника міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні засоби редагування та `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Допоміжні засоби міграції runtime, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                          |

### Застаріла сумісність і тестові допоміжні засоби

Ці підшляхи залишаються експортами пакета для старіших plugins і тестових наборів OpenClaw,
але новий код не повинен додавати імпорти з них: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` і `zod`. У новому коді Plugin імпортуйте `zod` безпосередньо з `zod`.
`plugin-test-runtime` досі є активним вузько спрямованим тестовим допоміжним підшляхом.

### Застарілі невикористані публічні підшляхи

Ці публічні підшляхи існували щонайменше один місяць і наразі не мають
production-імпортів із bundled extensions. Вони залишаються доступними для імпорту заради сумісності,
але новий код Plugin має натомість використовувати вузько спрямовані, активно споживані підшляхи SDK:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` і `zalouser`.

### Застарілі рідкісні публічні підшляхи

Публічні підшляхи, які наразі використовуються лише одним або двома власниками bundled plugins, також
застарілі для нового коду Plugin. Вони залишаються експортами пакета заради сумісності,
але новий код має надавати перевагу активно спільним SDK seams або API пакетів,
що належать plugin. Maintainers відстежують точний набір у
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`, а поточний бюджет —
за допомогою `pnpm plugin-sdk:surface`.

### Застарілі широкі barrels

Ці широкі re-export barrels залишаються придатними для збирання для вихідного коду OpenClaw і
перевірок сумісності, але новий код має надавати перевагу вузько спрямованим підшляхам SDK:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` і
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
і `text-runtime` залишаються експортами пакета лише для зворотної сумісності; натомість використовуйте
вузько спрямовані підшляхи channel/runtime, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` і `logging-core`.

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кешований помічник валідації JSON Schema для схем, що належать Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники майстра налаштування, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники конфігурації кількох акаунтів/action-gate, помічники резервного стандартного акаунта |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації account-id |
    | `plugin-sdk/account-resolution` | Помічники пошуку акаунта та резервного стандартного акаунта |
    | `plugin-sdk/account-helpers` | Вузькі помічники списку акаунтів/дій акаунта |
    | `plugin-sdk/access-groups` | Помічники розбору allowlist груп доступу та редагованої діагностики груп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Застарілі помічники конвеєра відповідей. Новий код конвеєра відповідей каналу має використовувати `createChannelMessageReplyPipeline` і `resolveChannelMessageSourceReplyDeliveryMode` з `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також побудовники Zod і прямих JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації каналів OpenClaw лише для підтримуваних вбудованих Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації вбудованих каналів |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/валідації користувацьких команд Telegram із резервним вбудованим контрактом |
    | `plugin-sdk/command-gating` | Вузькі помічники шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Застарілий фасад сумісності низькорівневого входу каналу. Нові шляхи отримання мають використовувати `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Експериментальний високорівневий runtime-резолвер входу каналу та побудовники фактів маршруту для мігрованих шляхів отримання каналу. Надавайте цьому перевагу замість збирання ефективних allowlist, allowlist команд і застарілих проєкцій у кожному Plugin. Див. [API входу каналу](/uk/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` і застарілі помічники життєвого циклу потоку чернеток. Новий код фіналізації попереднього перегляду має використовувати `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Дешеві помічники контракту життєвого циклу повідомлень, як-от `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, виведення можливості durable-final, помічники доказу можливостей для можливостей надсилання/отримання/побічних ефектів, `MessageReceiveContext`, докази політики ack для отримання, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, докази можливостей live-preview і live-finalizer, стан надійного відновлення, `RenderedMessageBatch`, типи квитанцій повідомлень і помічники id квитанцій. Див. [API повідомлень каналу](/uk/plugins/sdk-channel-message). Застарілі фасади диспетчеризації відповідей призначені лише для сумісності. |
    | `plugin-sdk/channel-message-runtime` | Runtime-помічники доставки, які можуть завантажувати вихідну доставку, зокрема `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` і `withDurableMessageSendContext`. Застарілі мости диспетчеризації відповідей залишаються доступними для імпорту лише для диспетчерів сумісності. Використовуйте з runtime-модулів моніторингу/надсилання, а не з гарячих файлів початкового завантаження Plugin. |
    | `plugin-sdk/inbound-envelope` | Спільні помічники побудови вхідного маршруту та envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілі спільні помічники запису й диспетчеризації вхідних даних, предикати видимої/фінальної диспетчеризації та застаріла сумісність `deliverDurableInboundReplyPayload` для підготовлених диспетчерів каналів. Новий код отримання/диспетчеризації каналу має імпортувати runtime-помічники життєвого циклу з `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Помічники розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Помічники вихідної ідентичності, делегата надсилання, сесії, форматування та планування payload. Прямі помічники доставки, як-от `deliverOutboundPayloads`, є застарілою підкладкою сумісності; використовуйте `plugin-sdk/channel-message-runtime` для нових шляхів надсилання. |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Помічники прив’язки розмов/потоків, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Помічник runtime-знімка конфігурації |
    | `plugin-sdk/runtime-group-policy` | Runtime-помічники вирішення політики груп |
    | `plugin-sdk/channel-status` | Спільні помічники знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні помічники рішень доступу груп |
    | `plugin-sdk/direct-dm` | Спільні помічники auth/guard для direct-DM |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові Plugin мають використовувати загальні підшляхи SDK каналу |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності вирішення акаунта Telegram для відстежуваної сумісності власника; нові Plugin мають використовувати ін’єктовані runtime-помічники або загальні підшляхи SDK каналу |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові Plugin мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі помічники інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для вхідного debounce, зіставлення згадок, помічників політики згадок і помічників envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі помічники вхідного debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники політики згадок, маркерів згадок і тексту згадок без ширшої поверхні вхідного runtime |
    | `plugin-sdk/channel-envelope` | Вузькі помічники форматування вхідного envelope |
    | `plugin-sdk/channel-location` | Контекст розташування каналу та помічники форматування |
    | `plugin-sdk/channel-logging` | Помічники журналювання каналу для вхідних відкидань і помилок typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Помічники дій повідомлень каналу, а також застарілі помічники нативних схем, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршрутів, кероване парсером вирішення цілей, перетворення thread-id на рядок, ключі маршрутів для dedupe/compact, типи розібраних цілей і помічники порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Помічники розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення відгуків/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники контракту секретів, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки runtime-моделей |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для типових значень локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локальних/самостійно розгорнутих провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісних самостійно розгорнутих провайдерів |
    | `plugin-sdk/cli-backend` | Типові значення бекенду CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Runtime-допоміжні засоби розпізнавання API-ключів для provider plugins |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу API-ключів/запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth-автентифікації |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик повторного відтворення, допоміжні засоби кінцевих точок провайдера та спільні допоміжні засоби нормалізації ідентифікаторів моделей |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук розширення каталогу провайдера та шви реєстру plugin-провайдерів для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби можливостей HTTP/кінцевих точок провайдера, HTTP-помилки провайдера та допоміжні засоби multipart-форм для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, і засоби встановлення/отримання облікових даних в обмеженій області |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, а також очищення схем Gemini + діагностика |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків, а також спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і потоки транспортних подій із можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch для конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби singleton/map/cache, локальні для процесу |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розпізнавання затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра нативного затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативних можливостей/доставки затверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розпізнавання Gateway затверджень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативного адаптера затверджень для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-допоміжні засоби обробника затверджень; надавайте перевагу вужчим швам адаптера/Gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі затвердження + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді затвердження exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload затвердження exec/plugin, допоміжні засоби маршрутизації/runtime нативних затверджень і допоміжні засоби структурованого відображення затверджень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контрактів каналу без широкого тестового barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної цілі сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команди та поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-контрактів для поверхонь секретів каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-контракту/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, gating для DM, обмежених коренем файлів/шляхів, включно із записами лише для створення, синхронною/асинхронною атомарною заміною файлів, записами до sibling temp, fallback для переміщення між пристроями, допоміжними засобами приватного file-store, захистами symlink-parent, external-content, редагуванням чутливого тексту, порівнянням секретів за сталий час і допоміжними засобами збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої runtime-поверхні інфраструктури |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-захищений fetch, помилка SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/таймауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/логування/резервного копіювання/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime-середовища, логера, тайм-ауту, повтору та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Допоміжні засоби реєстрації та пошуку generic runtime-контексту каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` напряму |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати generic підшляхи SDK напряму |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/інтерактивної роботи plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline webhook/внутрішніх hooks |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого runtime-імпорту/прив'язування, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI-форматування, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Gateway-клієнт, допоміжний засіб запуску клієнта, готового до циклу подій, Gateway CLI RPC, помилки Gateway-протоколу та допоміжні засоби patch для стану каналу |
    | `plugin-sdk/config-contracts` | Сфокусована type-only поверхня конфігурації для форм конфігурації plugin, як-от `OpenClawConfig` і типи конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби runtime-пошуку конфігурації plugin, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби snapshot конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і сетери тестових snapshot |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли bundled contract surface Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для посилань на файли без широкого текстового barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/plugin, білдери approval-capability, допоміжні засоби auth/profile, native routing/runtime і форматування шляху відображення структурованого схвалення |
    | `plugin-sdk/reply-runtime` | Спільні runtime-допоміжні засоби для вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, session-key, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби прив'язування маршруту/session-key/облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення стану каналу/облікового запису, типові значення runtime-state і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби resolver цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягує рядкові URL з fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Runner команд з таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні reader-и параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягує нормалізовані payload-и з об'єктів результату tool |
    | `plugin-sdk/tool-send` | Витягує канонічні поля цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень і приватні безпечні тимчасові workspaces |
    | `plugin-sdk/logging-core` | Підсистемний logger і допоміжні засоби редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і конвертації |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення model/session, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби resolution конфігурації talk-провайдера |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON-стану |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно-вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового dedupe-кешу |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легковагі допоміжні засоби реєстрації ACP backend і reply-dispatch для plugins, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only resolution ACP binding без lifecycle startup imports |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви runtime config-schema агента |
    | `plugin-sdk/boolean-param` | Нестрогий reader boolean-параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби resolution збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, стану й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді для команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skill |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native-команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, допоміжні засоби steer/abort для active-run, допоміжні засоби OpenClaw tool bridge, допоміжні засоби runtime-plan tool policy, класифікація terminal outcome, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Застарілий фасад виявлення provider-owned endpoint Z.AI; використовуйте публічний API Z.AI plugin |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих runtime state files |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності async-завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби in-memory dedupe-кешу |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain для outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat wake, event і visibility |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних token/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий compatibility shim; використовуйте сфокусовані runtime-підшляхи вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби diagnostic flag, event і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без proxy/guarded-fetch imports |
    | `plugin-sdk/response-limit-runtime` | Обмежений reader response-body без широкої media runtime surface |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив'язування розмови без configured binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких imports запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Resolution visibility контексту та фільтрація додаткового контексту без широких imports config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби coercion і normalization primitive record/string без imports markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби retry config і retry runner |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/workspace агента, включно з `resolveAgentDir`, `resolveDefaultAgentDir` і застарілим compatibility export `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні помічники для отримання/перетворення/збереження медіа, визначення розмірів відео на базі ffprobe та побудовники медіа-навантажень |
    | `plugin-sdk/media-mime` | Вузька нормалізація MIME, зіставлення розширень файлів, визначення MIME та помічники для типів медіа |
    | `plugin-sdk/media-store` | Вузькі помічники медіасховища, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні помічники резервного перемикання генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи постачальників розуміння медіа, а також експорти помічників для зображень/аудіо/структурованого витягання, орієнтовані на постачальників |
    | `plugin-sdk/text-chunking` | Помічники розбиття/рендерингу тексту й markdown, перетворення markdown-таблиць, вилучення тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Помічник розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи постачальників мовлення, а також експорти директив, реєстру, валідації, сумісного з OpenAI побудовника TTS і помічників мовлення, орієнтовані на постачальників |
    | `plugin-sdk/speech-core` | Спільні типи постачальників мовлення, реєстр, директива, нормалізація та експорти помічників мовлення |
    | `plugin-sdk/realtime-transcription` | Типи постачальників транскрипції в реальному часі, помічники реєстру та спільний помічник сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи постачальників голосу в реальному часі та помічники реєстру |
    | `plugin-sdk/image-generation` | Типи постачальників генерації зображень, а також помічники URL зображувальних ресурсів/даних і сумісний з OpenAI побудовник постачальника зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та помічники реєстру |
    | `plugin-sdk/music-generation` | Типи постачальників/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, помічники резервного перемикання, пошук постачальника та розбір посилань на модель |
    | `plugin-sdk/video-generation` | Типи постачальників/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, помічники резервного перемикання, пошук постачальника та розбір посилань на модель |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і помічники встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Спільні помічники завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Застарілий реекспорт сумісності; імпортуйте `zod` із `zod` напряму |
    | `plugin-sdk/testing` | Локальний для репозиторію застарілий barrel сумісності для спадкових тестів OpenClaw. Нові тести репозиторію мають натомість імпортувати сфокусовані локальні тестові підшляхи, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальний для репозиторію мінімальний помічник `createTestPluginApi` для модульних тестів прямої реєстрації Plugin без імпорту мостів тестових помічників репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальні для репозиторію фікстури контрактів нативного адаптера agent-runtime для тестів автентифікації, доставки, fallback, хуків інструментів, накладання підказок, схем і проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Локальні для репозиторію тестові помічники, орієнтовані на канали, для загальних контрактів дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, потоків send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Локальний для репозиторію спільний набір тестів випадків помилок розв'язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Локальні для репозиторію помічники контрактів пакета Plugin, реєстрації, публічних артефактів, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Локальні для репозиторію помічники контрактів runtime постачальника, автентифікації, виявлення, onboard, каталогу, майстра, медіаможливостей, політики відтворення, realtime STT live-audio, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Локальні для репозиторію opt-in HTTP/auth моки Vitest для тестів постачальників, що перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Локальні для репозиторію загальні фікстури захоплення CLI runtime, контексту sandbox, автора skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal-text, chunking, auth-token і типізованих випадків |
    | `plugin-sdk/test-node-mocks` | Локальні для репозиторію сфокусовані помічники моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам'яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня bundled memory-core помічників для помічників менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам'яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам'яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам'яті, доступ до реєстру, локальний постачальник і загальні пакетні/віддалені помічники |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам'яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам'яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам'яті |
    | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам'яті |
    | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам'яті |
    | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Помічники статусу хоста пам'яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помічники CLI runtime хоста пам'яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Помічники core runtime хоста пам'яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/runtime хоста пам'яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для помічників core runtime хоста пам'яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для помічників журналу подій хоста пам'яті |
    | `plugin-sdk/memory-host-files` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Спільні помічники managed-markdown для суміжних із пам'яттю plugins |
    | `plugin-sdk/memory-host-search` | Фасад runtime активної пам'яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Наразі немає зарезервованих підшляхів SDK для bundled-helper. Специфічні для власника
    помічники живуть усередині пакета Plugin власника, тоді як придатні до повторного використання контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов'язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
