---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту плагіна
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-29T05:39:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6830e451e9db504c9293992d50ba4bcb149d31d2e54d29f925f01ad4243ed95
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено поширені підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin зʼявляються там, але є деталлю
  реалізації, якщо сторінка документації явно не робить їх рекомендованими. Супровідники можуть перевіряти активні
  зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти провалюють CI-звіт замість того, щоб залишатися в публічному SDK
  як неактивний борг сумісності.

  Посібник зі створення Plugin див. у [огляді SDK Plugin](/uk/plugins/sdk-overview).

  ## Вхід Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів Plugin; для нових тестів extension віддавайте перевагу цільовим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний побудовник mock `OpenClawPluginApi` для unit-тестів прямої реєстрації Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для профілів автентифікації, приглушення доставки, класифікації fallback, hooks інструментів, prompt overlays, схем і відновлення transcript |
  | `plugin-sdk/channel-test-helpers`         | Допоміжні засоби тестування життєвого циклу облікового запису каналу, каталогу, send-config, runtime mock, hook, входу bundled channel, timestamp envelope, відповіді pairing і загального контракту каналу   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів для випадків помилок розпізнавання цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби контрактів для реєстрації Plugin, package manifest, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури для тестів runtime Plugin, registry, provider-registration, setup-wizard і runtime task-flow                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Допоміжні засоби контрактів для runtime провайдера, автентифікації, discovery, onboard, catalog, media capability, replay policy, realtime STT live-audio, web-search/fetch і wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in HTTP/auth mocks Vitest для тестів провайдера, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, disposable HTTP server, incoming request, live-test, тимчасової файлової системи та time-control                                        |
  | `plugin-sdk/test-fixtures`                | Загальні тестові фікстури CLI, sandbox, skill, agent-message, system-event, module reload, шляху bundled plugin, terminal, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Цільові допоміжні засоби mock для вбудованих модулів Node для використання у фабриках Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Допоміжні засоби елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери стану елементів, допоміжні засоби редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Допоміжні засоби runtime migration, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                         |

  <AccordionGroup>
  <Accordion title="Підшляхи каналу">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби setup wizard, allowlist prompts, побудовники setup status |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації/action-gate для кількох облікових записів, допоміжні засоби fallback для default-account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та загальний побудовник |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled каналів OpenClaw лише для супроводжуваних bundled plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий alias сумісності для схем конфігурації bundled-channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби authorization gate для команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, допоміжні засоби життєвого циклу/finalization draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби inbound route + envelope builder |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби record-and-dispatch для inbound |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей outbound send для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound delivery, identity, send delegate, session, formatting і payload planning |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding та адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник agent media payload |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розвʼязання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації channel config-write |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel Plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання allowlist config |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для direct-DM |
    | `plugin-sdk/discord` | Застарілий facade сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові plugins мають використовувати загальні підшляхи SDK каналу |
    | `plugin-sdk/telegram-account` | Застарілий facade сумісності розпізнавання облікового запису Telegram для відстежуваної сумісності власника; нові plugins мають використовувати injected runtime helpers або загальні підшляхи SDK каналу |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби interactive reply. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, допоміжних засобів mention-policy і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, маркера mention і тексту mention без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування inbound envelope |
    | `plugin-sdk/channel-location` | Контекст розташування каналу та допоміжні засоби форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби logging каналу для inbound drops і typing/ack failures |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби message-action каналу, а також застарілі native schema helpers, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільна нормалізація route, розпізнавання цілі на основі parser, stringification thread-id, ключі route для dedupe/compact, типи parsed-target і допоміжні засоби порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби parsing цілей; виклики порівняння route мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад середовища виконання LM Studio для стандартних параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локальних/самостійно розміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісних самостійно розміщених провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенду CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключів під час виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик повторного відтворення, допоміжні засоби кінцевих точок провайдера та допоміжні засоби нормалізації ідентифікаторів моделей, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу провайдера та точки стику реєстру plugin-провайдерів для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби можливостей HTTP/кінцевих точок провайдера, HTTP-помилки провайдера та допоміжні засоби multipart-форм для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також засоби встановлення/отримання облікових даних у межах області |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/середовища виконання провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків, а також спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і доступні для запису потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби синглтонів/мап/кешів у межах процесу |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілів/фільтрів нативного затвердження виконання |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки затверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway затверджень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативних адаптерів затвердження для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби середовища виконання обробника затверджень; надавайте перевагу вужчим точкам стику адаптера/Gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі затвердження + прив’язування облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на затвердження виконання/Plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload затвердження виконання/Plugin, нативні допоміжні засоби маршрутизації/середовища виконання затверджень, а також допоміжні засоби структурованого відображення затверджень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби цілі нативного сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналів/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби типізації `coerceSecretRef` і SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, обмеження DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів зі сталим часом виконання та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби закріпленого диспетчера без широкої поверхні інфраструктурного середовища виконання |
    | `plugin-sdk/ssrf-runtime` | Закріплений диспетчер, SSRF-захищений fetch, помилка SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook-запитів/цілей і приведення сирого websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру/тайм-ауту тіла запиту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання/журналювання/резервного копіювання/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env середовища виконання, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Допоміжні засоби реєстрації та пошуку загального runtime-контексту каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/хуків/http/інтерактивності Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив'язування runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, RPC CLI Gateway, помилки протоколу Gateway і допоміжні засоби патчів статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише типів для форм конфігурації Plugin, як-от `OpenClawConfig`, і типів конфігурації каналу/провайдера |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку runtime-конфігурації Plugin, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сеттери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на посилання файлів без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/Plugin, конструктори approval-capability, допоміжні засоби auth/profile, native routing/runtime і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime для вхідних повідомлень/відповідей, фрагментації, диспетчеризації, Heartbeat, планувальника відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації/фіналізації відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби фрагментації тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сеансів, ключа сеансу, часу оновлення та мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогу State/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби прив'язування маршруту/ключа сеансу/облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення статусу каналу/облікового запису, типові значення runtime-state і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби резолвера цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витяг рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Запускач команд із тайм-аутом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витяг нормалізованих payload із об'єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витяг канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і конвертації |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сеансу, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв'язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового dedupe-кешу |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/сеансу ACP і диспетчеризації відповідей |
    | `plugin-sdk/acp-runtime-backend` | Легковагові допоміжні засоби реєстрації бекенда ACP і диспетчеризації відповідей для Plugin, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв'язання прив'язок ACP лише для читання без імпортів lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий читач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв'язання збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів сполучення |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації native команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довірених Plugin для низькорівневих harness агента: типи harness, допоміжні засоби спрямування/переривання active-run, допоміжні засоби bridge інструментів OpenClaw, допоміжні засоби політики інструментів runtime-plan, класифікація результату термінала, допоміжні засоби форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для малих файлів runtime-стану |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності async-завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби dedupe-кешу в пам'яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб спорожнення черги вихідних pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів до локальних файлів і медіаджерел |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані runtime-підшляхи вище |
    | `plugin-sdk/collection-runtime` | Допоміжні засоби малого обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного прапорця, події та trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch із підтримкою dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений reader тіла відповіді без широкої media runtime поверхні |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив'язки розмови без налаштованого маршрутизування прив'язок або сховищ сполучення |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв'язання видимості контексту та фільтрація додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації примітивних record/рядків без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації імені хоста та SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуп каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання/перетворення/збереження медіа, а також побудовники медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби медіасховища, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів зображень/аудіо для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/Markdown/логування, як-от вилучення видимого для асистента тексту, допоміжні засоби рендерингу/розбиття/таблиць Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи мовленнєвих провайдерів, а також експорти директив, реєстру, валідації, побудовника TTS, сумісного з OpenAI, і мовленнєвих допоміжних засобів для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовленнєвих провайдерів, реєстр, директива, нормалізація та експорти мовленнєвих допоміжних засобів |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби URL-адрес ресурсів/даних зображень і побудовник провайдера зображень, сумісний з OpenAI |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляхів Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK plugin |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів plugin. Нові тести розширень натомість мають імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації plugin без імпорту містків тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові допоміжні засоби для загальних контрактів дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, потоків send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, майстра, медіаможливостей, політики replay, STT live-audio у реальному часі, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Необов’язкові HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту sandbox, записувача skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal-text, розбиття, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для допоміжних засобів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote допоміжні засоби |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для допоміжних засобів file/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для суміжних із пам’яттю plugins |
    | `plugin-sdk/memory-host-search` | Фасад runtime активної пам’яті для доступу search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Наразі немає зарезервованих підшляхів SDK bundled-helper. Допоміжні засоби,
    специфічні для власника, містяться всередині пакета plugin-власника, тоді як
    багаторазові контракти хоста використовують загальні підшляхи SDK, як-от
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд SDK plugin](/uk/plugins/sdk-overview)
- [Налаштування SDK plugin](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
