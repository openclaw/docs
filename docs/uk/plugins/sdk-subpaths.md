---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-05-02T15:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено часто використовувані підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також присутні там, але є деталлю
  реалізації, якщо сторінка документації явно не робить їх публічними. Мейнтейнерам доступний аудит активних
  зарезервованих допоміжних підшляхів через `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти провалюють CI-звіт замість того, щоб залишатися в публічному SDK
  як неактивний борг сумісності.

  Посібник зі створення Plugin див. в [огляді Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів Plugin; для нових тестів extension віддавайте перевагу сфокусованим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний mock builder `OpenClawPluginApi` для прямих модульних тестів реєстрації Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Нативні contract fixtures адаптера agent-runtime для профілів автентифікації, пригнічення доставки, класифікації fallback, tool hooks, prompt overlays, schemas і відновлення transcript |
  | `plugin-sdk/channel-test-helpers`         | Тестові помічники для життєвого циклу акаунта каналу, каталогу, send-config, runtime mock, hook, точки входу bundled channel, timestamp конверта, відповіді pairing і generic channel contract   |
  | `plugin-sdk/channel-target-testing`       | Спільний тестовий набір для випадків помилок розв’язання цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Помічники contract для реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічного ефекту імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures для тестів runtime Plugin, registry, реєстрації provider, setup-wizard і runtime task-flow                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Помічники contract для runtime provider, auth, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch і wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Опційні Vitest HTTP/auth mocks для тестів provider, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Fixtures тестового середовища, fetch/network, disposable HTTP server, incoming request, live-test, тимчасової файлової системи та time-control                                        |
  | `plugin-sdk/test-fixtures`                | Загальні тестові fixtures для CLI, sandbox, skill, agent-message, system-event, module reload, шляху bundled Plugin, terminal, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Сфокусовані помічники Node builtin mock для використання всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Помічники елементів migration provider, як-от `createMigrationItem`, константи причин, маркери стану елементів, помічники редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Помічники runtime migration, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт Zod-схеми кореневого `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники майстра налаштування, allowlist prompts, builders стану налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники multi-account config/action-gate, помічники fallback для default-account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації account-id |
    | `plugin-sdk/account-resolution` | Помічники пошуку акаунта + default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі помічники account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також builders для Zod і прямого JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled OpenClaw channel лише для підтримуваних bundled Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий alias сумісності для схем bundled-channel config |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/валідації користувацьких команд Telegram з fallback bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі помічники authorization gate для команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, помічники життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні помічники inbound route + envelope builder |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні помічники record-and-dispatch для inbound |
    | `plugin-sdk/messaging-targets` | Помічники parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук outbound send dependency для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Помічники outbound delivery, identity, send delegate, session, formatting і payload planning |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу thread-binding та адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий builder agent media payload |
    | `plugin-sdk/conversation-runtime` | Помічники conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Помічник runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | Помічники розв’язання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні помічники snapshot/summary стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації channel config-write |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти channel Plugin prelude |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання allowlist config |
    | `plugin-sdk/group-access` | Спільні помічники ухвалення рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні помічники direct-DM auth/guard |
    | `plugin-sdk/discord` | Застарілий facade сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; новим Plugin слід використовувати generic channel SDK subpaths |
    | `plugin-sdk/telegram-account` | Застарілий facade сумісності розв’язання акаунта Telegram для відстежуваної сумісності власника; новим Plugin слід використовувати injected runtime helpers або generic channel SDK subpaths |
    | `plugin-sdk/zalouser` | Застарілий facade сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команди відправника; новим Plugin слід використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Помічники semantic message presentation, delivery і застарілих interactive reply. Див. [презентацію повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, помічників mention-policy та envelope helpers |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі помічники inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники mention-policy, mention marker і mention text без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі помічники форматування inbound envelope |
    | `plugin-sdk/channel-location` | Помічники контексту й форматування channel location |
    | `plugin-sdk/channel-logging` | Помічники channel logging для inbound drops і typing/ack failures |
    | `plugin-sdk/channel-send-result` | Типи результатів reply |
    | `plugin-sdk/channel-actions` | Помічники channel message-action, а також застарілі native schema helpers, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні помічники нормалізації route, parser-driven target resolution, stringification thread-id, dedupe/compact route keys, типи parsed-target і порівняння route/target |
    | `plugin-sdk/channel-targets` | Помічники parsing цілей; виклики порівняння route мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи channel contract |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для типових налаштувань локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісного self-hosted провайдера |
    | `plugin-sdk/cli-backend` | Типові налаштування бекенду CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-ключів під час виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/API-ключів і запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env-змінних автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик replay, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу провайдера та шви реєстру plugin-провайдера для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні допоміжні засоби можливостей HTTP/endpoint провайдера, HTTP-помилки провайдера та допоміжні засоби multipart-форми для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також засоби встановлення/отримання облікових даних з обмеженою областю дії |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання approver та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра нативного затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативної можливості/доставки затверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання Gateway для затверджень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативного адаптера затверджень для гарячих entrypoint каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-допоміжні засоби обробника затверджень; надавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі затвердження + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на затвердження exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload затвердження exec/plugin, допоміжні засоби routing/runtime нативних затверджень і допоміжні засоби структурованого відображення затверджень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контрактів каналів без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналу/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі `coerceSecretRef` і допоміжні засоби типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики allowlist хостів і SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої infra runtime-поверхні |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-захищений fetch, SSRF-помилка та допоміжні засоби SSRF-політики |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook-запиту/цілі та raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру/таймауту тіла запиту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби для середовища виконання, логування, резервного копіювання та встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби для середовища виконання, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Допоміжні засоби реєстрації та пошуку загального runtime-контексту каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби для команд/хуків/http/інтерактивних можливостей Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI для форматування, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта, готового до циклу подій, Gateway CLI RPC, помилки протоколу Gateway і допоміжні засоби патчів статусу каналів |
    | `plugin-sdk/config-types` | Type-only поверхня конфігурації для форм Plugin-конфігурації, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку Plugin-конфігурації в середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сеттери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команди Telegram і перевірки дублікатів/конфліктів, навіть коли bundled поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на посилання файлів без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/Plugin, builder-и approval-capability, допоміжні засоби auth/profile, native routing/runtime і форматування шляху відображення структурованого схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби середовища виконання для inbound/reply, поділу на частини, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби reply dispatch/finalize і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби та маркери коротковіконної історії відповідей, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби поділу тексту/Markdown на частини |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, session-key, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язування маршруту/session-key/облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення статусу каналу/облікового запису, типові значення runtime-state і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв’язувача цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягувати рядкові URL із fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Засіб запуску команд із тайм-аутом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні reader-и параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягувати нормалізовані payload-и з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягувати канонічні поля цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger-а підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення model/session, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації talk-провайдера |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового кешу дедуплікації |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби середовища виконання/сесії ACP і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легковагі допоміжні засоби реєстрації backend ACP і reply-dispatch для Plugin, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання прив’язок ACP без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema середовища виконання агента |
    | `plugin-sdk/boolean-param` | Reader нечіткого булевого параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів сполучення |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, статусу та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби registry/build/serialize для native command |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довіреного Plugin для низькорівневих агентських harness: типи harness, допоміжні засоби steer/abort для active-run, допоміжні засоби bridge інструментів OpenClaw, допоміжні засоби політики інструментів runtime-plan, класифікація результатів термінала, допоміжні засоби форматування/деталізації перебігу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для малих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкуретності async-завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain для outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби події та видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних token/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий compatibility shim; використовуйте сфокусовані підшляхи середовища виконання вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорів, подій і trace-context |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, параметр EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений reader тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без налаштованої routing прив’язок або сховищ сполучення |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації примітивних record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і runner-а retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація директорій на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання, перетворення й збереження медіа, визначення розмірів відео на основі ffprobe та побудовники медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби медіасховища, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби відмовостійкості для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, призначені для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/Markdown/журналювання, як-от вилучення тексту, видимого асистенту, допоміжні засоби рендерингу/розбиття на фрагменти/таблиць Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб розбиття вихідного тексту на фрагменти |
    | `plugin-sdk/speech` | Типи мовних провайдерів, а також експорти директив, реєстру, валідації, OpenAI-сумісного побудовника TTS і мовних допоміжних засобів, призначені для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовних провайдерів, реєстр, директива, нормалізація та експорти мовних допоміжних засобів |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби для ресурсів зображень/data URL і OpenAI-сумісний побудовник провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби відмовостійкості, автентифікації та реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби відмовостійкості, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби відмовостійкості, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів plugin. Нові тести розширень мають натомість імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для модульних тестів прямої реєстрації plugin без імпорту мостів тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові допоміжні засоби для загальних контрактів дій/налаштування/статусу, тверджень щодо каталогів, життєвого циклу запуску облікового запису, потоків send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, автентифікації, виявлення, onboarding, каталогу, майстра, медіаможливостей, політики replay, realtime STT live-audio, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Опційні моки HTTP/автентифікації Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту пісочниці, writer Skills, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для допоміжних засобів менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime для індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти базового рушія хоста пам’яті |
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
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для plugins, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime активної пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Наразі зарезервованих підшляхів SDK bundled-helper немає. Допоміжні засоби,
    специфічні для власника, розташовані всередині пакета plugin-власника, тоді як багаторазові контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
