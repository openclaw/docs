---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-29T13:54:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02c86fd840e7f68ea86d7b7710278a942e4f0c69154c17393d449790e5474a4f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено часто використовувані підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin наведені там, але вони є деталлю
  реалізації, якщо сторінка документації явно не рекомендує їх. Maintainers можуть перевіряти активні
  зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти спричиняють збій звіту CI замість того, щоб залишатися в публічному SDK
  як неактивний борг сумісності.

  Посібник зі створення Plugin див. у [Огляд SDK Plugin](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів Plugin; для нових тестів розширень віддавайте перевагу сфокусованим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний builder mock `OpenClawPluginApi` для прямих unit-тестів реєстрації Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури contract власного адаптера agent-runtime для профілів auth, придушення доставки, класифікації fallback, хуків інструментів, накладень prompt, схем і відновлення транскрипту |
  | `plugin-sdk/channel-test-helpers`         | Допоміжні засоби тестування contract каналу для життєвого циклу облікового запису каналу, каталогу, send-config, mock runtime, hook, точки входу bundled channel, timestamp конверта, відповіді pairing та generic channel   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів випадків помилок розв’язання цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби contract для реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime Plugin, registry, реєстрації provider, setup-wizard і runtime task-flow для тестів                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Допоміжні засоби contract для runtime provider, auth, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch і wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in HTTP/auth mocks Vitest для тестів provider, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, disposable HTTP server, incoming request, live-test, тимчасової файлової системи та керування часом                                        |
  | `plugin-sdk/test-fixtures`                | Generic фікстури тестів CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Сфокусовані допоміжні засоби mock для вбудованих Node-модулів для використання всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Допоміжні засоби елементів provider міграції, як-от `createMigrationItem`, constants причин, markers стану елементів, допоміжні засоби редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Допоміжні засоби runtime міграції, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                         |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт Zod schema кореневого `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби setup wizard, allowlist prompts, builders стану налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби multi-account config/action-gate, допоміжні засоби default-account fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису та default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні primitives schema конфігурації каналу та generic builder |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled OpenClaw channel лише для підтримуваних bundled plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий alias сумісності для схем bundled-channel config |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із bundled-contract fallback |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, допоміжні засоби життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби inbound route і builder конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби inbound record-and-dispatch |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легковаговий пошук залежностей outbound send для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound delivery, identity, send delegate, session, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий builder agent media payload |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі primitives schema конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude exports Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard direct-DM |
    | `plugin-sdk/discord` | Застарілий facade сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності owner; нові plugins мають використовувати generic підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий facade сумісності розв’язання облікового запису Telegram для відстежуваної сумісності owner; нові plugins мають використовувати injected runtime helpers або generic підшляхи SDK каналів |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби semantic message presentation, delivery та застарілих interactive replies. Див. [Презентація повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, mention-policy helpers і envelope helpers |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, mention marker і mention text без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування inbound envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби context і formatting розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби logging каналу для inbound drops і typing/ack failures |
    | `plugin-sdk/channel-send-result` | Типи результату reply |
    | `plugin-sdk/channel-actions` | Допоміжні засоби message-action каналу, а також застарілі native schema helpers, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільна нормалізація route, parser-driven target resolution, stringification thread-id, dedupe/compact route keys, типи parsed-target і допоміжні засоби порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби parsing цілей; виклики порівняння route мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи contract каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад виконання LM Studio для локальних стандартних значень сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби для налаштування локальних/саморозміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісних саморозміщених провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні значення бекенду CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-ключів під час виконання для provider plugins |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу API-ключів/запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний збирач результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для provider plugins |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні збирачі політик повторного відтворення, допоміжні засоби кінцевих точок провайдера та допоміжні засоби нормалізації ідентифікаторів моделей, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук розширення каталогу провайдера та межі реєстру plugin-провайдера для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби можливостей HTTP/кінцевих точок провайдера, HTTP-помилки провайдера та допоміжні засоби multipart-форм для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped-сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/виконання провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch для конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби singleton/map/cache у межах процесу |
    | `plugin-sdk/group-activation` | Допоміжні засоби вузького режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема динамічне форматування меню аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Збирачі повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби нативних профілів/фільтрів затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативних можливостей/доставки затверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання approval Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативного адаптера затверджень для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби виконання обробника затверджень; віддавайте перевагу вужчим межам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі затвердження + прив’язування облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на затвердження exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload затвердження exec/plugin, допоміжні засоби маршрутизації/виконання нативних затверджень і допоміжні засоби структурованого відображення затверджень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби контрактних тестів каналів без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, динамічне форматування меню аргументів і допоміжні засоби нативної цілі сесії |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання контрактів секретів для поверхонь секретів каналів/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби типізації `coerceSecretRef` і SecretRef для розбору контракту секретів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, обмеження DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої runtime-поверхні інфраструктури |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, SSRF-захищеного fetch, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору вводу секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook-запитів/цілей і raw-приведення websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/логування/резервного копіювання/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, логера, тайм-ауту, повторної спроби та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і допоміжних засобів auth для керування браузером |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку runtime-контексту каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive для Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив'язування runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта з готовим циклом подій, CLI RPC Gateway, помилки протоколу Gateway і допоміжні засоби патчів статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише з типами для форм конфігурації Plugin, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку runtime-конфігурації Plugin, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімків конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація імен/описів команд Telegram та перевірки дублікатів/конфліктів, навіть коли вбудована контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на посилання файлів без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/Plugin, будівники approval-capability, допоміжні засоби auth/профілю, нативні допоміжні засоби маршрутизації/runtime і форматування шляху структурованого відображення схвалень |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, поділ на фрагменти, диспетчеризація, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації/фіналізації відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби поділу тексту/markdown на фрагменти |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, ключа сесії, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сесії/прив'язування акаунта, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку статусу каналу/акаунта, типові значення runtime-state і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби резолвера цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Засіб запуску команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні зчитувачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об'єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби логера підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв'язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації з підтримкою на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/сесії та reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легковагі допоміжні засоби реєстрації ACP backend і reply-dispatch для Plugin, завантажених під час startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв'язання прив'язувань ACP лише для читання без імпортів lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | Вузькі runtime-примітиви схеми конфігурації агента |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв'язання збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів спарювання |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, статусу та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довіреного Plugin для низькорівневих harness агентів: типи harness, допоміжні засоби steering/abort активного запуску, допоміжні засоби bridge інструментів OpenClaw, допоміжні засоби політики інструментів runtime-plan, класифікація результатів термінала, допоміжні засоби форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для малих файлів runtime-стану |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеження паралельності асинхронних задач |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам'яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб draining очікуваних вихідних доставок |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій Heartbeat і видимості |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий compatibility shim; використовуйте наведені вище сфокусовані підшляхи runtime |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців, подій і trace-context |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений зчитувач тіла відповіді без широкої media runtime поверхні |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив'язування розмови без налаштованої маршрутизації прив'язувань або сховищ спарювання |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв'язання видимості контексту та фільтрування додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації повторних спроб і runner повторних спроб |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби отримання/перетворення/зберігання медіа, визначення розмірів відео на базі ffprobe та збирачі медіанавантаження |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, орієнтовані на провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/markdown/логування, як-от вилучення видимого для асистента тексту, допоміжні засоби рендерингу/розбиття на фрагменти/таблиць markdown, допоміжні засоби редагування, допоміжні засоби тегів-директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб розбиття вихідного тексту на фрагменти |
    | `plugin-sdk/speech` | Типи мовленнєвих провайдерів, а також експорти директив, реєстру, валідації, збирача TTS, сумісного з OpenAI, і допоміжних засобів мовлення, орієнтовані на провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовленнєвих провайдерів, реєстр, директива, нормалізація та експорти допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби URL для ресурсів/даних зображень і збирач провайдера зображень, сумісний з OpenAI |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів plugin. Нові тести розширень мають натомість імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для модульних тестів прямої реєстрації plugin без імпорту мостів тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові допоміжні засоби для загальних контрактів дій/налаштування/стану, перевірок каталогів, життєвого циклу запуску облікового запису, потоків send-config, runtime-моків, проблем стану, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, майстра, можливостей медіа, політики відтворення, realtime STT live-audio, web-search/fetch і потоку |
    | `plugin-sdk/provider-http-test-mocks` | Опціональні HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту пісочниці, автора skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Вбудована поверхня допоміжних засобів memory-core для допоміжних засобів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія foundation хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote допоміжні засоби |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для суміжних із пам’яттю plugin |
    | `plugin-sdk/memory-host-search` | Runtime-фасад активної пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для допоміжних засобів стану хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих допоміжних засобів">
    Наразі зарезервованих підшляхів SDK для вбудованих допоміжних засобів немає. Допоміжні засоби, специфічні для власника,
    розташовані всередині пакета plugin власника, тоді як повторно використовувані контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugin](/uk/plugins/building-plugins)
