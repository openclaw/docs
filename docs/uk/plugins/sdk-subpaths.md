---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих плагінів і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-30T03:17:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці каталогізовано часто використовувані підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані підшляхи допоміжних засобів bundled-plugin наведені там, але є деталлю
  реалізації, якщо сторінка документації явно не просуває їх. Мейнтейнери можуть перевіряти активні
  зарезервовані підшляхи допоміжних засобів за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти провалюють звіт CI замість того, щоб залишатися в публічному SDK
  як пасивний борг сумісності.

  Посібник зі створення Plugin див. в [Огляді Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів Plugin; для нових тестів розширень віддавайте перевагу сфокусованим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний mock builder `OpenClawPluginApi` для прямих модульних тестів реєстрації Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для профілів автентифікації, приглушення доставки, класифікації fallback, хуків інструментів, накладок prompt, схем і відновлення transcript |
  | `plugin-sdk/channel-test-helpers`         | Допоміжні засоби для тестів життєвого циклу облікового запису каналу, каталогу, send-config, runtime mock, hook, точки входу bundled channel, timestamp envelope, відповіді pairing і загального контракту каналу   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів для випадків помилок розв’язання цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби для контрактів реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічного ефекту імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime Plugin, registry, provider-registration, setup-wizard і runtime task-flow для тестів                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Допоміжні засоби для контрактів runtime provider, автентифікації, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch і wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Необов’язкові HTTP/auth mocks Vitest для тестів provider, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, одноразового HTTP-сервера, вхідного запиту, live-test, тимчасової файлової системи та time-control                                        |
  | `plugin-sdk/test-fixtures`                | Загальні тестові фікстури CLI, sandbox, skill, agent-message, system-event, module reload, шляху bundled Plugin, terminal, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Сфокусовані допоміжні засоби mock для вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Допоміжні засоби елементів provider міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні засоби редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Допоміжні засоби runtime міграції, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Підшляхи каналу">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт Zod-схеми кореневого `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, prompts allowlist, builders статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби multi-account config/action-gate, допоміжні засоби fallback для default-account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису й default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та загальний builder |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled каналів OpenClaw лише для підтримуваних bundled Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий alias сумісності для схем конфігурації bundled-channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, допоміжні засоби життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби inbound route + envelope builder |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби inbound record-and-dispatch |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей outbound send для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби планування outbound delivery, identity, send delegate, session, formatting і payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий builder agent media payload |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації channel config-write |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти prelude Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання allowlist config |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для direct-DM |
    | `plugin-sdk/discord` | Застарілий facade сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові Plugin мають використовувати загальні підшляхи SDK каналу |
    | `plugin-sdk/telegram-account` | Застарілий facade сумісності розв’язання облікового запису Telegram для відстежуваної сумісності власника; нові Plugin мають використовувати injected runtime helpers або загальні підшляхи SDK каналу |
    | `plugin-sdk/zalouser` | Застарілий facade сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові Plugin мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби семантичного представлення повідомлень, доставки та застарілих interactive reply. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, допоміжних засобів mention-policy і envelope helpers |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, маркерів згадки та тексту згадки без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування inbound envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту та форматування місця каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для inbound drops і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби message-action каналу, а також застарілі допоміжні засоби native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршруту, parser-driven розв’язання цілей, перетворення thread-id на рядок, dedupe/compact route keys, типи parsed-target і допоміжні засоби порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби парсингу цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдера">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад середовища виконання LM Studio для стандартних параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби налаштування локальних/самостійно розміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісних самостійно розміщених провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключів під час виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/API-ключа та запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політики replay, допоміжні засоби кінцевих точок провайдера та допоміжні засоби нормалізації ідентифікаторів моделей, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу провайдера та шви реєстру plugin-провайдерів для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні допоміжні засоби можливостей HTTP/кінцевих точок провайдера, HTTP-помилки провайдера та допоміжні засоби multipart-форм для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/середовища виконання провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібне |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і same-chat автентифікації дій |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра нативного exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативної можливості/доставлення approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway для approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативного адаптера approval для гарячих entrypoint-ів каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби середовища виконання обробника approval; надавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі approval + прив’язування облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload exec/plugin approval, допоміжні засоби маршрутизації/середовища виконання нативного approval і допоміжні засоби структурованого відображення approval, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої runtime-поверхні infra |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, SSRF-захищений fetch, SSRF-помилка та політика SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook-запиту/цілі та приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби для середовища виконання, логування, резервного копіювання та встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби для середовища виконання, середовища, логера, тайм-ауту, повторних спроб і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованих профілю/стандартних значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Допоміжні засоби реєстрації та пошуку загального контексту середовища виконання каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд, хуків, HTTP та інтерактивної роботи Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику з аргументами та лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта, готового до циклу подій, CLI RPC Gateway, помилки протоколу Gateway та допоміжні засоби виправлення стану каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише з типами для форм конфігурації Plugin, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації Plugin у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення виконання/Plugin, побудовники можливостей схвалення, допоміжні засоби автентифікації/профілю, допоміжні засоби нативної маршрутизації/середовища виконання та форматування шляхів структурованого відображення схвалень |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби середовища виконання для вхідних повідомлень/відповідей, розбиття на частини, диспетчеризація, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації/фіналізації відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби короткого вікна історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби розбиття тексту/Markdown на частини |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сеансів, ключа сеансу, часу оновлення та зміни сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сеансу/прив’язування облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення стану каналу/облікового запису, стандартні значення стану середовища виконання та допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв’язувача цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витяг рядкових URL з fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні зчитувачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витяг нормалізованих payload з об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витяг канонічних полів цілі надсилання з аргументів інструменту |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби логера підсистеми та редагування секретів |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сеансу, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації з підтримкою на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби середовища виконання/сеансу ACP і диспетчеризації відповідей |
    | `plugin-sdk/acp-runtime-backend` | Легковажні допоміжні засоби реєстрації бекенда ACP і диспетчеризації відповідей для Plugin, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язування ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації середовища виконання агента |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів сполучення |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, стану та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довіреного Plugin для низькорівневих harness агентів: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби моста інструментів OpenClaw, допоміжні засоби політик інструментів плану середовища виконання, класифікація результатів термінала, допоміжні засоби форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб локального для процесу асинхронного блокування для невеликих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності асинхронних завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб спорожнення черги очікуваних вихідних доставок |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій Heartbeat і видимості |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище сфокусовані підшляхи середовища виконання |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорів, подій і контексту трасування |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби закріпленого lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений читач тіла відповіді без широкої поверхні середовища виконання медіа |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язування розмови без налаштованої маршрутизації прив’язувань або сховищ сполучення |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сеансів без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення й нормалізації примітивних записів/рядків без імпортів markdown/логування |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації повторних спроб і виконавця повторних спроб |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочої області агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні помічники для отримання/перетворення/збереження медіа, визначення розмірів відео на основі ffprobe та побудовники медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі помічники сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні помічники аварійного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти помічників зображень/аудіо для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні помічники для тексту/markdown/логування, як-от вилучення тексту, видимого асистенту, помічники рендерингу/розбиття/таблиць markdown, помічники редагування, помічники тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Помічник розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також експорти директив, реєстру, валідації, побудовника TTS, сумісного з OpenAI, і помічників мовлення для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, реєстр, директиви, нормалізація та експорти помічників мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, помічники реєстру та спільний помічник сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та помічники реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також помічники ресурсів зображень/data URL і побудовник провайдера зображень, сумісний з OpenAI |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, аварійне перемикання, автентифікація та помічники реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, помічники аварійного перемикання, пошук провайдера та розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, помічники аварійного перемикання, пошук провайдера та розбір model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і помічники встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Помічники нормалізації шляхів Webhook |
    | `plugin-sdk/web-media` | Спільні помічники завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів plugin. Нові тести extension мають натомість імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний помічник `createTestPluginApi` для модульних тестів прямої реєстрації plugin без імпорту мостів тестових помічників репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Тестові помічники, орієнтовані на канали, для загальних контрактів actions/setup/status, перевірок каталогу, життєвого циклу запуску облікового запису, потоків send-config, runtime-моків, проблем стану, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Помічники контрактів пакета plugin, реєстрації, публічного артефакту, прямого імпорту, API runtime та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Помічники контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, майстра, медіа-можливостей, політики відтворення, live-audio STT у реальному часі, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Опційні HTTP/auth моки Vitest для тестів провайдерів, що перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту sandbox, автора skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусовані помічники моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня помічників bundled memory-core для помічників manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія основи хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote помічники |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Помічники журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Помічники стану хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помічники CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Помічники core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Вендор-нейтральний псевдонім для помічників core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Вендор-нейтральний псевдонім для помічників журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Вендор-нейтральний псевдонім для помічників файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні помічники managed-markdown для plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Вендор-нейтральний псевдонім для помічників стану хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Наразі немає зарезервованих підшляхів SDK bundled-helper. Помічники, специфічні для власника,
    містяться всередині пакета plugin власника, тоді як повторно використовувані контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugin](/uk/plugins/building-plugins)
