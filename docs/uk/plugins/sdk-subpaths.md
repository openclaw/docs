---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-29T04:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ca42dc1b56245b8d26924eb2b957dac872fd0e2db4b62978ab2e2e15dcde3dc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено поширені підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи для вбудованих Plugin також наведені там, але вони є
  деталлю реалізації, якщо сторінка документації явно не просуває їх. Мейнтейнери можуть перевіряти активні
  зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти спричиняють помилку звіту CI, а не залишаються в публічному SDK
  як неактивний борг сумісності.

  Посібник зі створення Plugin див. у [Огляді Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів Plugin; для нових тестів розширень надавайте перевагу цільовим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний builder mock `OpenClawPluginApi` для unit-тестів прямої реєстрації Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для профілів автентифікації, приглушення доставки, класифікації fallback, хуків інструментів, накладень prompt, схем і відновлення transcript |
  | `plugin-sdk/channel-test-helpers`         | Помічники тестування життєвого циклу облікового запису каналу, каталогу, send-config, runtime mock, hook, точки входу вбудованого каналу, timestamp envelope, відповіді pairing і загального контракту каналу   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів для випадків помилок розв’язання цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Помічники контрактів реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічного ефекту імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime Plugin, registry, реєстрації provider, setup-wizard і runtime task-flow для тестів                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Помічники контрактів runtime provider, auth, discovery, onboard, catalog, медіаможливостей, replay policy, realtime STT live-audio, web-search/fetch і wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in HTTP/auth mocks Vitest для тестів provider, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, одноразового HTTP-сервера, вхідного запиту, live-test, тимчасової файлової системи та керування часом                                        |
  | `plugin-sdk/test-fixtures`                | Загальні тестові фікстури CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху вбудованого Plugin, terminal, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Цільові помічники mock для вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Помічники елементів provider міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, помічники редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Runtime-помічники міграції, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                         |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники setup wizard, prompt allowlist, builders статусу setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники config/action-gate для кількох облікових записів, помічники fallback для облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації account-id |
    | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису та fallback за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі помічники account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та generic builder |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації вбудованих каналів OpenClaw лише для підтримуваних вбудованих Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий alias сумісності для схем конфігурації bundled-channel |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/валідації користувацьких команд Telegram з fallback bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі помічники authorization gate для команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, помічники життєвого циклу/finalization draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні помічники inbound route і envelope builder |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні помічники record-and-dispatch для inbound |
    | `plugin-sdk/messaging-targets` | Помічники parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей outbound send для адаптерів каналу |
    | `plugin-sdk/outbound-runtime` | Помічники outbound delivery, identity, send delegate, session, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу thread-binding і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий builder agent media payload |
    | `plugin-sdk/conversation-runtime` | Помічники conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Помічник snapshot runtime config |
    | `plugin-sdk/runtime-group-policy` | Помічники розв’язання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні помічники snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації channel config-write |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти prelude для Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання allowlist config |
    | `plugin-sdk/group-access` | Спільні помічники ухвалення рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні помічники direct-DM auth/guard |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові Plugin мають використовувати загальні підшляхи SDK каналу |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв’язання облікового запису Telegram для відстежуваної сумісності власника; нові Plugin мають використовувати injected runtime helpers або загальні підшляхи SDK каналу |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі помічники interactive reply. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, помічників mention-policy і envelope helpers |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі помічники inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники mention-policy, mention marker і mention text без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі помічники форматування inbound envelope |
    | `plugin-sdk/channel-location` | Контекст розташування каналу та помічники форматування |
    | `plugin-sdk/channel-logging` | Помічники logging каналу для inbound drops і typing/ack failures |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Помічники message-action каналу, а також застарілі помічники native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні помічники нормалізації route, parser-driven target resolution, stringification thread-id, ключів dedupe/compact route, типів parsed-target і порівняння route/target |
    | `plugin-sdk/channel-targets` | Помічники parsing цілей; виклики порівняння route мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для стандартних параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісних self-hosted провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime для визначення API-ключів для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу API-ключів/запису профілів, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик повторного відтворення, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу провайдера та шви реєстру plugin-провайдерів для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби можливостей HTTP/endpoint провайдера, HTTP-помилки провайдера та допоміжні засоби multipart-форм для транскрибування аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, і scoped сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика та допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і придатні для запису потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби singleton/map/cache, локальні для процесу |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації груп і парсингу команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби нативного профілю/фільтра схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставлення схвалення |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway схвалення |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативного адаптера схвалення для гарячих entrypoint каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime обробника схвалень; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Нативна ціль схвалення + допоміжні засоби прив’язування облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді схвалення exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload схвалення exec/plugin, нативні допоміжні засоби маршрутизації/runtime схвалення та допоміжні засоби структурованого відображення схвалення, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби контрактного тестування каналів без широкого barrel для тестування |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної цілі сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання контракту секретів для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для парсингу контракту секретів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM-gating, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої runtime-поверхні infra |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, SSRF-захищеного fetch, SSRF-помилки та SSRF-політики |
    | `plugin-sdk/secret-input` | Допоміжні засоби парсингу введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook-запиту/цілі та приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання/журналювання/резервного копіювання/встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища виконання env, логера, таймауту, повторних спроб і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/стандартних значень, розбору URL CDP і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Універсальні допоміжні засоби реєстрації та пошуку контексту середовища виконання каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/хуків/http/інтерактивної роботи Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив'язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, RPC CLI шлюзу, помилки протоколу шлюзу та допоміжні засоби латок статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише з типами для форм конфігурації плагінів, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації Plugin у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли пакетна контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби затвердження exec/Plugin, побудовники можливостей затвердження, допоміжні засоби автентифікації/профілів, нативні допоміжні засоби маршрутизації/середовища виконання та форматування шляхів структурованого відображення затверджень |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби середовища виконання вхідних повідомлень/відповідей, розбиття на частини, диспетчеризація, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації/фіналізації відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби короткого вікна історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби розбиття тексту/markdown на частини |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сеансів, ключа сеансу, часу оновлення та зміни сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сеансу/прив'язування облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення статусу каналу/облікового запису, стандартні значення стану середовища виконання та допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв'язувача цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягання рядкових URL з fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Запускач команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні зчитувачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витягання нормалізованих payload з об'єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витягання канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби логера підсистем і редагування конфіденційних даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сеансу, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв'язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно-вхідного блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби середовища виконання/сеансу ACP і диспетчеризації відповідей |
    | `plugin-sdk/acp-runtime-backend` | Легковагові допоміжні засоби реєстрації бекенда ACP і диспетчеризації відповідей для плагінів, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв'язання прив'язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації середовища виконання агента |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв'язання зіставлення небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токена спарювання |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, статусу та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповідей команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довіреного Plugin для низькорівневих агентських harness: типи harness, допоміжні засоби скеровування/переривання активного запуску, допоміжні засоби моста інструментів OpenClaw, допоміжні засоби політик інструментів runtime-plan, класифікація результатів термінала, допоміжні засоби форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб локального для процесу асинхронного блокування для малих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкуренції асинхронних задач |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам'яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб спорожнення черги очікуваної вихідної доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій Heartbeat і видимості |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище сфокусовані підшляхи середовища виконання |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного прапорця, події та контексту трасування |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch, proxy та закріпленого пошуку |
    | `plugin-sdk/runtime-fetch` | Fetch середовища виконання з урахуванням диспетчера без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений зчитувач тіла відповіді без широкої поверхні середовища виконання медіа |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив'язування розмови без налаштованої маршрутизації прив'язок або сховищ спарювання |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сеансів без широких імпортів записів/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв'язання видимості контексту та фільтрація додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації примітивних записів/рядків без імпортів markdown/журналювання |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації повторних спроб і запуску повторних спроб |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання, перетворення та зберігання медіа, а також конструктори медіанавантажень |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдера розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, призначені для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/markdown/журналювання, як-от видалення тексту, видимого асистенту, допоміжні засоби рендерингу/фрагментації/таблиць markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб фрагментації вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдера мовлення, а також експорти директив, реєстру, валідації, OpenAI-сумісного конструктора TTS і допоміжних засобів мовлення, призначені для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдера мовлення, реєстр, директива, нормалізація та експорти допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдера транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень, а також допоміжні засоби для ресурсів зображень/data URL і OpenAI-сумісний конструктор провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK плагінів |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів плагінів. Нові тести розширень мають натомість імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації плагінів без імпорту мостів допоміжних засобів тестування репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера середовища виконання агента для тестів автентифікації, доставлення, fallback, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали допоміжні засоби тестування для загальних контрактів дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, потоків конфігурації надсилання, моків середовища виконання, проблем статусу, вихідного доставлення та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Спільний набір тестів випадків помилок розв’язання цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета плагіна, реєстрації, публічного артефакту, прямого імпорту, API середовища виконання та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів середовища виконання провайдера, автентифікації, виявлення, onboarding, каталогу, майстра, медіаможливостей, політики replay, живого аудіо STT у реальному часі, вебпошуку/отримання та stream |
    | `plugin-sdk/provider-http-test-mocks` | Необов’язкові HTTP/автентифікаційні моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення середовища виконання CLI, контексту пісочниці, записувача Skills, повідомлення агента, системної події, перезавантаження модуля, шляху вбудованого плагіна, термінального тексту, фрагментації, токена автентифікації та типізованих випадків |
    | `plugin-sdk/test-node-mocks` | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Вбудована поверхня допоміжних засобів memory-core для допоміжних засобів менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія основи хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби пакетної/віддаленої обробки |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби мультимодальності хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби середовища виконання CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби основного середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів основного середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад середовища виконання Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих допоміжних засобів">
    Наразі немає зарезервованих підшляхів SDK для вбудованих допоміжних засобів. Допоміжні засоби, специфічні для власника,
    розміщуються всередині пакета плагіна-власника, тоді як повторно використовувані контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд SDK плагінів](/uk/plugins/sdk-overview)
- [Налаштування SDK плагінів](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
