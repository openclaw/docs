---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T20:12:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f66fa1c9f9398ae2124dc4b92d3b11a07800616f452409d12e851a6fb0bcd675
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено поширені підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також є там, але вони є деталлю
  реалізації, якщо сторінка документації явно не виносить їх на рівень публічного API. Супровідники можуть перевіряти активні
  зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти призводять до помилки у звіті CI, а не залишаються в публічному SDK
  як неактивний борг сумісності.

  Посібник з розробки Plugin див. у [огляді SDK Plugin](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів Plugin; для нових тестів розширень надавайте перевагу сфокусованим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний builder моків `OpenClawPluginApi` для модульних тестів прямої реєстрації Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Нативні fixtures контрактів адаптера agent-runtime для профілів автентифікації, пригнічення доставки, класифікації fallback, хуків інструментів, накладень промптів, схем і відновлення transcript |
  | `plugin-sdk/channel-test-helpers`         | Помічники тестів життєвого циклу облікового запису каналу, каталогу, send-config, runtime-мока, хуків, точки входу bundled channel, timestamp envelope, pairing reply і generic channel contract   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів випадків помилок target-resolution каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Помічники контрактів реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, side-effect імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures для тестів runtime Plugin, registry, provider-registration, setup-wizard і runtime task-flow                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Помічники контрактів provider runtime, auth, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch і wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in HTTP/auth моки Vitest для тестів провайдера, що перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Fixtures тестового середовища, fetch/network, disposable HTTP server, incoming request, live-test, temporary filesystem і time-control                                        |
  | `plugin-sdk/test-fixtures`                | Generic fixtures для CLI, sandbox, skill, agent-message, system-event, module reload, bundled plugin path, terminal, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Сфокусовані помічники моків вбудованих модулів Node для використання у factory Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Помічники елементів migration provider, як-от `createMigrationItem`, константи причин, маркери стану елементів, помічники редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Runtime-помічники міграції, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                         |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт Zod-схеми кореневого `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники setup wizard, allowlist prompts, builder-и стану setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники multi-account config/action-gate, помічники fallback облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації account-id |
    | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису та default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі помічники account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та generic builder |
    | `plugin-sdk/bundled-channel-config-schema` | Bundled схеми конфігурації каналів OpenClaw лише для підтримуваних bundled plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для bundled-channel config schemas |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/валідації користувацьких команд Telegram із bundled-contract fallback |
    | `plugin-sdk/command-gating` | Вузькі помічники gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, помічники життєвого циклу/finalization draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні помічники inbound route та builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні помічники record-and-dispatch для inbound |
    | `plugin-sdk/messaging-targets` | Помічники parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей outbound send для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Помічники outbound delivery, identity, send delegate, session, formatting і payload planning |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу thread-binding і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий builder agent media payload |
    | `plugin-sdk/conversation-runtime` | Помічники conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Помічник snapshot runtime-конфігурації |
    | `plugin-sdk/runtime-group-policy` | Помічники вирішення runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні помічники snapshot/summary стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації channel config-write |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання allowlist config |
    | `plugin-sdk/group-access` | Спільні помічники рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні помічники direct-DM auth/guard |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13`; нові plugins мають використовувати generic підшляхи SDK каналу |
    | `plugin-sdk/interactive-runtime` | Помічники semantic message presentation, delivery і застарілих interactive reply. Див. [подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, помічників mention-policy і envelope helpers |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі помічники inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники mention-policy, mention marker і mention text без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі помічники форматування inbound envelope |
    | `plugin-sdk/channel-location` | Контекст місця каналу та помічники форматування |
    | `plugin-sdk/channel-logging` | Помічники логування каналу для inbound drops і typing/ack failures |
    | `plugin-sdk/channel-send-result` | Типи результатів reply |
    | `plugin-sdk/channel-actions` | Помічники channel message-action, а також застарілі помічники native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршрутів, parser-driven target resolution, stringification thread-id, dedupe/compact route keys, типи parsed-target і помічники порівняння route/target |
    | `plugin-sdk/channel-targets` | Помічники parsing цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад середовища виконання LM Studio для локальних стандартних параметрів сервера, виявлення моделей, заголовків запитів і допоміжних функцій для завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні функції налаштування локальних/самостійно розгорнутих провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні функції налаштування самостійно розгорнутих OpenAI-сумісних провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції розв’язання API-ключів під час виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу API-ключів/запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик відтворення, допоміжні функції кінцевих точок провайдерів і допоміжні функції нормалізації ID моделей, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук середовища виконання для доповнення каталогу провайдера та шви реєстру Plugin-провайдерів для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції можливостей HTTP/кінцевих точок провайдерів, HTTP-помилки провайдерів і допоміжні функції multipart-форм для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також обмежені за областю сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/середовища виконання провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика та допоміжні функції сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні функції обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні функції нативного транспорту провайдерів, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні функції патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції локальних для процесу singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації груп і парсингу команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції розв’язання затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра нативного затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки затверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція розв’язання Gateway для затверджень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні функції завантаження нативного адаптера затверджень для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні функції середовища виконання обробника затверджень; надавайте перевагу вужчим швам адаптера/Gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції нативної цілі затвердження + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді затвердження exec/Plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні функції payload затвердження exec/Plugin, допоміжні функції маршрутизації/середовища виконання нативних затверджень і допоміжні функції структурованого відображення затверджень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контрактів каналів без широкого barrel для тестування |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні функції нативної цілі сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команд і допоміжні функції поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання контрактів секретів для поверхонь секретів каналів/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції `coerceSecretRef` і типізації SecretRef для парсингу контрактів секретів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, обмеження DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції списку дозволених хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції закріпленого диспетчера без широкої інфраструктурної поверхні середовища виконання |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції закріпленого диспетчера, захищеного від SSRF fetch, помилок SSRF і політик SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції парсингу введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі Webhook і приведення сирого websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру/тайм-ауту тіла запиту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби для середовища виконання, журналювання, резервного копіювання та встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби для env середовища виконання, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору URL CDP і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Допоміжні засоби реєстрації та пошуку generic контексту середовища виконання каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд Plugin, hook, http та інтерактивної взаємодії |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, RPC CLI Gateway, помилки протоколу Gateway і допоміжні засоби patch статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації Plugin, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації Plugin у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і тестові setter знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для посилань на файли без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/Plugin, побудовники можливостей схвалення, допоміжні засоби auth/profile, native routing/runtime і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби середовища виконання inbound/reply, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді та міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/Markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, ключа сесії, updated-at і зміни сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби route/session-key/account binding, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку статусу каналу/облікового запису, типові значення стану середовища виконання та допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв’язувача цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягує рядкові URL з fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Виконавець команд із тайм-аутом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні reader параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витягує нормалізовані payload з об’єктів результату інструмента |
    | `plugin-sdk/tool-send` | Витягує канонічні поля цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистем і редагування секретних даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму й перетворення Markdown-таблиць |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації talk-провайдера |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON-стану |
    | `plugin-sdk/file-lock` | Допоміжні засоби реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового dedupe-кешу |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби середовища виконання/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-runtime-backend` | Легкі допоміжні засоби реєстрації бекенду ACP і dispatch відповідей для Plugin, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання ACP binding лише для читання без імпортів запуску lifecycle |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації середовища виконання агента |
    | `plugin-sdk/boolean-param` | Нестрогий reader булевого параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання зіставлення небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби перелічення команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації native команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довірених Plugin для низькорівневих harness агентів: типи harness, допоміжні засоби steer/abort active-run, допоміжні засоби мосту інструментів OpenClaw, допоміжні засоби політики інструментів runtime-plan, класифікація результатів термінала, допоміжні засоби форматування/деталізації перебігу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб локального для процесу async lock для невеликих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої concurrency async-завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби in-memory dedupe-кешу |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain для outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий compatibility shim; використовуйте наведені вище спеціалізовані підшляхи середовища виконання |
    | `plugin-sdk/collection-runtime` | Допоміжні засоби невеликого обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних flag, event і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби wrapped fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений reader response-body без широкої media runtime surface |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding розмови без налаштованого binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення й нормалізації примітивних записів/рядків без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry та виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуп директорії на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні помічники отримання/перетворення/зберігання медіа, а також конструктори медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі помічники сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні помічники резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти помічників для зображень/аудіо, орієнтовані на провайдерів |
    | `plugin-sdk/text-runtime` | Спільні помічники для тексту/markdown/журналювання, як-от вилучення видимого для асистента тексту, помічники рендерингу/розбиття/таблиць markdown, помічники редагування, помічники тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Помічник розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи мовних провайдерів, а також орієнтовані на провайдерів експорти директив, реєстру, валідації, OpenAI-сумісного конструктора TTS і мовних помічників |
    | `plugin-sdk/speech-core` | Спільні типи мовних провайдерів, експорти реєстру, директив, нормалізації та мовних помічників |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, помічники реєстру та спільний помічник WebSocket-сеансу |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та помічники реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також помічники ресурсів зображень/data URL і OpenAI-сумісний конструктор провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та помічники реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, помічники резервного перемикання, пошук провайдера та розбір посилань на модель |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, помічники резервного перемикання, пошук провайдера та розбір посилань на модель |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і помічники встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Помічники нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні помічники завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | Широкий compatibility barrel для застарілих тестів plugin. Нові тести розширень натомість мають імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний помічник `createTestPluginApi` для unit-тестів прямої реєстрації plugin без імпорту мостів тестових помічників репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канал тестові помічники для загальних контрактів дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, потоків send-config, runtime-моків, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок визначення цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Помічники контрактів пакета plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Помічники контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, майстра, медіа-можливостей, політики replay, live-audio realtime STT, web-search/fetch і потоків |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення CLI runtime, контексту sandbox, записувача skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal-text, розбиття, auth-token і типізованих випадків |
    | `plugin-sdk/test-node-mocks` | Сфокусовані помічники моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня bundled memory-core помічників для помічників manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія foundation хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote помічники |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Помічники журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Помічники статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помічники CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Помічники core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для core runtime помічників хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для помічників журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для помічників файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні помічники managed-markdown для plugins, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Runtime-фасад Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для помічників статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Наразі немає зарезервованих підшляхів SDK bundled-helper. Власницькі
    помічники живуть у пакеті plugin власника, а повторно використовувані контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
