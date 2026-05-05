---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-05-05T19:13:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdd2487ef0b4f9de205a5d23508895e244ac3c84f760c9e1f419f9eada52011b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK для плагінів надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено часто використовувані підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи для вбудованих плагінів також є там, але вони є деталлю
  реалізації, якщо сторінка документації явно не підносить їх. Мейнтейнерам можна перевіряти активні
  зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти спричиняють збій звіту CI, замість того щоб залишатися в публічному SDK
  як неактивний борг сумісності.

  Посібник зі створення плагінів див. у [огляді SDK для Plugin](/uk/plugins/sdk-overview).

  ## Вхідна точка Plugin

  | Підшлях                                   | Основні експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів плагінів; для нових тестів розширень надавайте перевагу сфокусованим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний mock builder `OpenClawPluginApi` для прямих модульних тестів реєстрації плагінів                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для профілів автентифікації, приглушення доставки, класифікації fallback, хуків інструментів, накладень промптів, схем і відновлення транскрипта |
  | `plugin-sdk/channel-test-helpers`         | Допоміжні засоби для тестів життєвого циклу облікового запису каналу, каталогу, send-config, runtime mock, хуків, вбудованої вхідної точки каналу, часової позначки envelope, відповіді pairing і загального контракту каналу   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів для випадків помилок визначення цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби для контрактів реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічного ефекту імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime Plugin, реєстру, реєстрації провайдера, майстра налаштування та runtime task-flow для тестів                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Допоміжні засоби для контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, можливостей медіа, політики replay, realtime STT live-audio, web-search/fetch і майстра                 |
  | `plugin-sdk/provider-http-test-mocks`     | Необов’язкові HTTP/auth mock для Vitest у тестах провайдерів, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, одноразового HTTP-сервера, вхідного запиту, live-test, тимчасової файлової системи та керування часом                                        |
  | `plugin-sdk/test-fixtures`                | Загальні тестові фікстури CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху вбудованого Plugin, термінала, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Сфокусовані допоміжні засоби для mock вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Допоміжні засоби для елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні засоби редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Runtime-допоміжні засоби міграції, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, allowlist-промпти, builders статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби multi-account config/action-gate, допоміжні засоби fallback для default-account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також builders Zod і прямі JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації вбудованих каналів OpenClaw лише для підтримуваних вбудованих плагінів |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий alias сумісності для схем конфігурації bundled-channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback для bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, допоміжні засоби життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби inbound route + envelope builder |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби record-and-dispatch для inbound |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей outbound send для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound delivery, identity, send delegate, session, formatting і payload planning |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий builder agent media payload |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації channel config-write |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії channel Plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання allowlist config |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби ухвалення рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби direct-DM auth/guard |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; новим плагінам слід використовувати загальні підшляхи SDK каналу |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності визначення облікового запису Telegram для відстежуваної сумісності власника; новим плагінам слід використовувати ін’єктовані runtime-допоміжні засоби або загальні підшляхи SDK каналу |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які все ще імпортують авторизацію команд відправника; новим плагінам слід використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби семантичного представлення повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, допоміжних засобів mention-policy і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, mention marker і mention text без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування inbound envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту розташування каналу та форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для inbound drops і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів reply |
    | `plugin-sdk/channel-actions` | Допоміжні засоби message-action каналу, а також застарілі native schema helpers, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільна нормалізація route, parser-driven target resolution, stringification thread-id, ключі dedupe/compact route, типи parsed-target і допоміжні засоби порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби parsing цілей; викликачам route comparison слід використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад виконання LM Studio для локальних типових налаштувань сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Підібрані допоміжні засоби налаштування локальних/самостійно розміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісних самостійно розміщених провайдерів |
    | `plugin-sdk/cli-backend` | Типові налаштування бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-ключів під час виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби onboarding/API-key profile-write, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик replay, допоміжні засоби provider-endpoint і допоміжні засоби нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук виконання для розширення каталогу провайдерів і межі реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Узагальнені допоміжні засоби можливостей HTTP/endpoint провайдерів, HTTP-помилки провайдерів і допоміжні засоби multipart-форми для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/виконання провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream, а також спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдерів, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні засоби локальних для процесу singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та парсингу команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання approver і автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра нативного схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативної можливості/доставки схвалень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання Gateway для схвалень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативного адаптера схвалень для гарячих entrypoint каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби виконання обробника схвалень; віддавайте перевагу вужчим межам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі схвалення + прив’язування облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді схвалення exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload схвалення exec/plugin, допоміжні засоби маршрутизації/виконання нативних схвалень і допоміжні засоби структурованого відображення схвалень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби типізації `coerceSecretRef` і SecretRef для парсингу secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, блокування DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби списку дозволених хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої інфраструктурної поверхні виконання |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, захищений SSRF fetch, помилка SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби парсингу введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру/таймауту тіла запиту |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/логування/резервного копіювання/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime, logger, timeout, retry та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованих профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Допоміжні засоби реєстрації та пошуку загального runtime-контексту каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` напряму |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати загальні підшляхи SDK напряму |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд Plugin/hook/http/інтерактивної взаємодії |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язування runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику з аргументами та лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта, готового до циклу подій, Gateway CLI RPC, помилки протоколу Gateway і допоміжні засоби патчів стану каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації Plugin, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку runtime-конфігурації Plugin, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли bundled поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/Plugin, збирачі можливостей схвалення, допоміжні засоби auth/profile, native routing/runtime і форматування шляху структурованого відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, поділ на фрагменти, dispatch, heartbeat, планувальник reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби reply dispatch/finalize і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії reply і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби поділу тексту/markdown на фрагменти |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, session-key, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/session-key/прив’язування акаунта, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку стану каналу/акаунта, типові значення runtime-state і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв’язувача цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Засіб запуску команд з обмеженням часу з нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі send з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування секретів |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Реентерабельні допоміжні засоби file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації з підтримкою диска |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легковагові допоміжні засоби реєстрації backend ACP і reply-dispatch для plugins, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання прив’язування ACP без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі primitives схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий читач boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання зіставлення небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та token сполучення |
    | `plugin-sdk/extension-shared` | Спільні primitives для passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби reply для команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби registry/build/serialize для native команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, допоміжні засоби active-run steer/abort, допоміжні засоби bridge tool OpenClaw, допоміжні засоби політики tool runtime-plan, класифікація результатів terminal, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів attempt |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб telemetry активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої concurrency асинхронних task |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби in-memory кешу дедуплікації |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain для outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних token/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий compatibility shim; використовуйте сфокусовані підшляхи runtime вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби diagnostic flag, event і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений читач response-body без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язування розмови без configured binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів записів/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і засобу запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби dir/identity/workspace агента, включно з `resolveAgentDir`, `resolveDefaultAgentDir` і застарілим експортом сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація directory на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання/перетворення/зберігання медіа, визначення розмірів відео на основі ffprobe та побудовники медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби медіасховища, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби відмовостійкості генерації медіа, вибір кандидатів і повідомлення про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів зображень/аудіо для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/Markdown/логування, як-от вилучення видимого для асистента тексту, допоміжні засоби рендерингу/розбиття/таблиць Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також експорти директив, реєстру, валідації, побудовника TTS, сумісного з OpenAI, і допоміжних засобів мовлення для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, реєстр, директива, нормалізація та експорти допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб WebSocket-сесії |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби для URL ресурсів/даних зображень і побудовник провайдера зображень, сумісний з OpenAI |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, відмовостійкість, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби відмовостійкості, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби відмовостійкості, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | Широкий сумісний barrel для застарілих тестів Plugin. Нові тести розширень натомість мають імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту мостів допоміжних засобів тестування репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера runtime агента для тестів автентифікації, доставлення, fallback, tool-hook, prompt-overlay, схеми та проекції transcript |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали допоміжні засоби тестування для загальних контрактів дій/налаштування/статусу, перевірок директорій, життєвого циклу запуску облікового запису, потоків send-config, моків runtime, проблем статусу, вихідного доставлення та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, автентифікації, discovery, onboard, каталогу, майстра, медіаможливостей, політики replay, realtime STT live-audio, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Необов’язкові HTTP/auth моки Vitest для тестів провайдера, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту sandbox, автора Skills, повідомлення агента, системної події, перезавантаження модуля, шляху bundled Plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для допоміжних засобів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти базового рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embeddings хоста пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD-рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого Markdown для Plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Runtime-фасад active memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Наразі немає зарезервованих підшляхів SDK для bundled-helper. Специфічні для власника
    допоміжні засоби розміщуються всередині пакета Plugin власника, тоді як багаторазові контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
