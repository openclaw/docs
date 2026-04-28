---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T11:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f9939a84decc6d5ff34662044af97b8c9da838b0d2791b2cd0cfa15d181fdd7
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено часто використовувані підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також є там, але вони є деталлю
  реалізації, якщо сторінка документації явно не просуває їх. Супровідники можуть перевіряти активні
  зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти провалюють звіт CI, а не залишаються в публічному SDK
  як неактивний борг сумісності.

  Посібник з авторства Plugin див. у [Огляд SDK Plugin](/uk/plugins/sdk-overview).

  ## Вхідна точка Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів Plugin; для нових тестів розширень віддавайте перевагу сфокусованим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний побудовник mock `OpenClawPluginApi` для прямих unit-тестів реєстрації Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів адаптера нативного agent-runtime для профілів автентифікації, приглушення доставки, класифікації fallback, хуків інструментів, накладок prompt, схем і відновлення transcript |
  | `plugin-sdk/channel-test-helpers`         | Допоміжні засоби для тестування життєвого циклу облікового запису каналу, каталогу, send-config, mock runtime, хуків, вхідної точки bundled каналу, timestamp конверта, відповіді pairing та загального контракту каналу   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів випадків помилок розв’язання цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби контрактів реєстрації Plugin, маніфесту пакета, публічного artifact, API runtime, побічних ефектів імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime Plugin, registry, реєстрації provider, setup-wizard і runtime task-flow для тестів                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Допоміжні засоби контрактів runtime provider, автентифікації, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch і wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in Vitest HTTP/auth mocks для тестів provider, що перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, одноразового HTTP-сервера, вхідного запиту, live-test, тимчасової файлової системи та керування часом                                        |
  | `plugin-sdk/test-fixtures`                | Загальні фікстури тестів CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху bundled Plugin, terminal, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Сфокусовані допоміжні засоби mock для вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Допоміжні засоби елементів provider міграції, як-от `createMigrationItem`, константи причин, маркери стану елементів, допоміжні засоби редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Допоміжні засоби міграції runtime, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                         |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт схеми Zod кореневого `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби setup wizard, prompt allowlist, побудовники стану setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби multi-account config/action-gate, допоміжні засоби default-account fallback |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби lookup облікового запису та default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та загальний побудовник |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled каналів OpenClaw лише для підтримуваних bundled Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий alias сумісності для схем конфігурації bundled-channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби inbound route та побудовника envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й dispatch inbound |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легкий lookup залежностей outbound send для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound delivery, identity, send delegate, session, formatting і payload planning |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding та адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник agent media payload |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання group-policy runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви config-schema каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації config-write каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти prelude Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання config allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard direct-DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби семантичного представлення повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, matching mention, допоміжних засобів mention-policy та envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, маркерів mention і тексту mention без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування inbound envelope |
    | `plugin-sdk/channel-location` | Контекст розташування каналу та допоміжні засоби форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для inbound drops і помилок typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби message-action каналу, а також застарілі допоміжні засоби нативної схеми, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби нормалізації route, розв’язання цілі на основі parser, перетворення thread-id у рядок, дедуплікації/компактизації ключів route, типи parsed-target і порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби parsing цілей; викликачі порівняння route мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад постачальника LM Studio для налаштування, виявлення каталогу та підготовки моделі під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для типових параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/самостійно розміщених постачальників |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування самостійно розміщених постачальників, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові параметри backend CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Runtime-допоміжні засоби розв’язання API-ключів для Plugin постачальників |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби onboarding/запису профілю API-ключа, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний збирач результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin постачальників |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env-var автентифікації постачальника |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні збирачі replay-policy, допоміжні засоби provider-endpoint і допоміжні засоби нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу постачальника та seams реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні допоміжні засоби можливостей HTTP/endpoint постачальника, HTTP-помилки постачальника та допоміжні засоби multipart-форми для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту config/selection для web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу постачальника web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credential для web-search для постачальників, яким не потрібне підключення plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту config/credential для web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/runtime постачальника web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібне |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні засоби wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту постачальника, як-от guarded fetch, перетворення транспортних повідомлень і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів onboarding-конфігурації |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Збирачі повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання approver і action-auth у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра нативного підтвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативних можливостей/доставки підтверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання approval Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативного approval adapter для гарячих entrypoint каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-допоміжні засоби approval handler; віддавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі підтвердження + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на підтвердження exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload підтвердження exec/plugin, допоміжні засоби маршрутизації/runtime нативного підтвердження та допоміжні засоби структурованого відображення підтвердження, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної цілі сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація command-body і допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналу/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі `coerceSecretRef` і допоміжні засоби типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, external-content, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої runtime-поверхні infra |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF-помилка та допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook-запиту/цілі та приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру/таймауту тіла запиту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі помічники для середовища виконання, журналювання, резервного копіювання та встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі помічники для середовища виконання env, logger, timeout, retry та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і помічників автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Загальні помічники реєстрації та пошуку контексту середовища виконання каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні помічники команд, хуків, HTTP та інтерактивної роботи Plugin |
    | `plugin-sdk/hook-runtime` | Спільні помічники конвеєра Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Помічники лінивого імпорту/прив’язки середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Помічники виконання процесів |
    | `plugin-sdk/cli-runtime` | Помічники форматування CLI, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, RPC CLI Gateway, помилки протоколу Gateway та помічники патчів статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише на рівні типів для форм конфігурації Plugin, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Помічники пошуку конфігурації Plugin у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Помічники транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Помічники знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Помічники затвердження exec/Plugin, конструктори можливостей затвердження, помічники auth/profile, помічники нативної маршрутизації/середовища виконання та форматування структурованого шляху відображення затвердження |
    | `plugin-sdk/reply-runtime` | Спільні помічники середовища виконання для вхідних повідомлень/відповідей, поділу на фрагменти, диспетчеризації, Heartbeat, планувальника відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники диспетчеризації/фіналізації відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні помічники коротковіконної історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі помічники поділу тексту/markdown на фрагменти |
    | `plugin-sdk/session-store-runtime` | Помічники шляху сховища сесій, ключа сесії, updated-at і зміни сховища |
    | `plugin-sdk/cron-store-runtime` | Помічники шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Помічники шляхів каталогів стану/OAuth |
    | `plugin-sdk/routing` | Помічники маршруту/ключа сесії/прив’язки акаунта, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні помічники зведення статусу каналу/акаунта, типові значення стану середовища виконання та помічники метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні помічники розв’язувача цілей |
    | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Видобування рядкових URL з inputs, подібних до fetch/request |
    | `plugin-sdk/run-command` | Запускач команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні зчитувачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Видобування нормалізованих payload з об’єктів результату інструмента |
    | `plugin-sdk/tool-send` | Видобування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні помічники шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Помічники logger підсистем і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Помічники режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Помічники перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Помічники розв’язання конфігурації провайдера talk |
    | `plugin-sdk/json-store` | Невеликі помічники читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Помічники повторно вхідного блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Помічники кешу дедуплікації з дисковою підтримкою |
    | `plugin-sdk/acp-runtime` | Помічники середовища виконання/сесії ACP і диспетчеризації відповідей |
    | `plugin-sdk/acp-runtime-backend` | Легкі помічники реєстрації бекенда ACP і диспетчеризації відповідей для Plugin, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації середовища виконання агента |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Помічники розв’язання зіставлення небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Помічники bootstrap пристрою і токенів сполучення |
    | `plugin-sdk/extension-shared` | Спільні примітиви помічників пасивного каналу, статусу та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Помічники відповідей команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Помічники переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Помічники реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довірених Plugin для низькорівневих harness агентів: типи harness, помічники керування/скасування активного запуску, помічники мосту інструментів OpenClaw, помічники політик інструментів плану середовища виконання, класифікація результатів термінала, помічники форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Помічники виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Помічник локального для процесу async lock для малих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Помічник телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Помічник обмеженої конкурентності асинхронних завдань |
    | `plugin-sdk/dedupe-runtime` | Помічники кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Помічник drain очікуваних вихідних доставок |
    | `plugin-sdk/file-access-runtime` | Помічники безпечних шляхів до локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Помічники подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Помічник числового приведення |
    | `plugin-sdk/secure-random-runtime` | Помічники безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Помічники черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Помічник очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище сфокусовані підшляхи середовища виконання |
    | `plugin-sdk/collection-runtime` | Невеликі помічники обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Помічники діагностичних прапорців, подій і контексту трасування |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні помічники класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy і помічники pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений зчитувач тіла відповіді без широкої поверхні середовища виконання медіа |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без налаштованої маршрутизації прив’язок або сховищ сполучення |
    | `plugin-sdk/session-store-runtime` | Помічники сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту і фільтрування додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі помічники приведення й нормалізації примітивних записів/рядків без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Помічники нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Помічники конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Помічники каталогу агента/ідентичності/робочого простору |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability and testing subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби отримання, перетворення й збереження медіа, а також побудовники медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби резервного перемикання для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера розуміння медіа, а також експорти допоміжних засобів зображень і аудіо для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту, markdown і журналювання, як-от вилучення тексту, видимого асистенту, допоміжні засоби рендерингу, поділу на фрагменти й таблиць markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб поділу вихідного тексту на фрагменти |
    | `plugin-sdk/speech` | Типи мовленнєвого провайдера, а також експорти директив, реєстру, валідації, побудовника TTS, сумісного з OpenAI, і допоміжних засобів мовлення для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовленнєвого провайдера, реєстр, директива, нормалізація й експорти допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдера транскрипції в реальному часі, допоміжні засоби реєстру й спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера голосу в реальному часі й допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень, а також допоміжні засоби URL зображувальних ресурсів/даних і побудовник провайдера зображень, сумісний з OpenAI |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація й допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби резервного перемикання, пошук провайдера й розбір посилань на модель |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби резервного перемикання, пошук провайдера й розбір посилань на модель |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів Plugin. Нові тести розширень мають натомість імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту мостів тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера середовища виконання агента для тестів автентифікації, доставки, fallback, hook інструментів, prompt overlay, схеми й проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові допоміжні засоби для загальних контрактів дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, потоків send-config, моків середовища виконання, проблем статусу, вихідної доставки й реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, API середовища виконання й побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів середовища виконання провайдера, автентифікації, виявлення, onboard, каталогу, майстра, медіаможливостей, політики відтворення, живого аудіо realtime STT, вебпошуку/отримання й потоку |
    | `plugin-sdk/provider-http-test-mocks` | Опціональні HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення середовища виконання CLI, контексту пісочниці, записувача skill, повідомлення агента, системної події, перезавантаження модуля, шляху до bundled Plugin, термінального тексту, поділу на фрагменти, auth-токена й типізованих cases |
    | `plugin-sdk/test-node-mocks` | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Memory subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня bundled допоміжних засобів memory-core для допоміжних засобів менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation-рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embeddings хоста пам’яті, доступ до реєстру, локальний провайдер і загальні пакетні/віддалені допоміжні засоби |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD-рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби середовища виконання CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів core середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для Plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад середовища виконання активної пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Reserved bundled-helper subpaths">
    Наразі немає зарезервованих підшляхів SDK для bundled допоміжних засобів. Допоміжні засоби, специфічні для власника,
    розташовані всередині пакета Plugin-власника, а багаторазові контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
