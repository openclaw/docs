---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту в плагіні
    - Аудит підшляхів вбудованих плагінів і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: де розташовані які імпорти, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-27T11:02:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8afc807a8c4ad7955cc110e38fafb368f8764bcf2c568f5ce69eccc682b038c7
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  Ця сторінка каталогізує найуживаніші підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані підшляхи helper вбудованих плагінів також присутні там, але є
  деталлю реалізації, якщо лише якась сторінка документації явно не рекомендує їх.

  Посібник зі створення плагінів див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу плагіна

  | Підшлях                       | Основні експорти                                                                                                                                      |
  | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`     | `definePluginEntry`                                                                                                                                   |
  | `plugin-sdk/core`             | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`               |
  | `plugin-sdk/config-schema`    | `OpenClawSchema`                                                                                                                                      |
  | `plugin-sdk/provider-entry`   | `defineSingleProviderPluginEntry`                                                                                                                     |
  | `plugin-sdk/migration`        | Хелпери елементів провайдера міграції, такі як `createMigrationItem`, константи причин, маркери стану елемента, хелпери редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime` | Хелпери міграції runtime, такі як `copyMigrationFileItem` і `writeMigrationReport`                                                                  |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої схеми Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні хелпери майстра налаштування, запити allowlist, builder-и стану налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Хелпери конфігурації/перевірок дій для кількох облікових записів, хелпери резервного переходу до облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, хелпери нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Хелпери пошуку облікового запису + резервного переходу до значення за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі хелпери списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та узагальнений builder |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації вбудованих каналів лише для сумісності з вбудованими компонентами |
    | `plugin-sdk/telegram-command-config` | Хелпери нормалізації/валідації користувацьких команд Telegram із резервним переходом до вбудованого контракту |
    | `plugin-sdk/command-gating` | Вузькі хелпери перевірки авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, хелпери життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні хелпери маршруту вхідних повідомлень + builder конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні хелпери запису та dispatch вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Хелпери парсингу/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні хелпери завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Хелпери доставки вихідних повідомлень, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі хелпери нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Хелпери життєвого циклу та адаптера прив’язок thread |
    | `plugin-sdk/agent-media-payload` | Застарілий builder payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Хелпери прив’язки розмов/thread, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Хелпер знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Хелпери визначення групової політики runtime |
    | `plugin-sdk/channel-status` | Спільні хелпери знімка/підсумку стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Хелпери авторизації записів конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти плагінів каналів |
    | `plugin-sdk/allowlist-config-edit` | Хелпери редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні хелпери рішень щодо доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні хелпери auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне подання повідомлень, доставка та застарілі хелпери інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для debounce вхідних повідомлень, зіставлення згадок, хелперів політики згадок і хелперів конверта |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі хелпери debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі хелпери політики згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі хелпери форматування вхідного конверта |
    | `plugin-sdk/channel-location` | Хелпери контексту та форматування location каналу |
    | `plugin-sdk/channel-logging` | Хелпери логування каналів для відкидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Хелпери дій із повідомленнями каналу, а також застарілі хелпери нативних схем, збережені для сумісності плагінів |
    | `plugin-sdk/channel-targets` | Хелпери парсингу/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контрактів каналів |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери секретних контрактів, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи секретних цілей |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Відібрані хелпери налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані хелпери налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням backend CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Хелпери визначення API-ключа runtime для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Хелпери онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний builder результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні інтерактивні хелпери входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Хелпери пошуку auth env var провайдерів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и політики replay, хелпери ендпойнтів провайдерів і хелпери нормалізації ідентифікаторів моделей, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Узагальнені хелпери HTTP/можливостей ендпойнтів провайдерів, помилки HTTP провайдерів і хелпери multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі хелпери контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Хелпери реєстрації/кешування провайдерів web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі хелпери конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення плагіна |
    | `plugin-sdk/provider-web-search-contract` | Вузькі хелпери контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter-и облікових даних з областями видимості |
    | `plugin-sdk/provider-web-search` | Хелпери реєстрації/кешування/runtime провайдерів web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та хелпери сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні хелпери обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Хелпери нативного транспорту провайдера, такі як guarded fetch, перетворення транспортних повідомлень і придатні до запису потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Хелпери patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Хелпери process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі хелпери режиму активації груп і парсингу команд |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, хелпери реєстру команд, включно з форматуванням меню динамічних аргументів, хелпери авторизації відправника |
    | `plugin-sdk/command-status` | Builder-и повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Хелпери визначення approver і auth дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Хелпери профілю/фільтра нативного схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативних можливостей/доставки схвалення |
    | `plugin-sdk/approval-gateway-runtime` | Спільний хелпер визначення approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені хелпери завантаження адаптера нативного схвалення для гарячих entrypoint каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші хелпери runtime handler схвалення; віддавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Хелпери нативних цілей схвалення + прив’язки облікових записів |
    | `plugin-sdk/approval-reply-runtime` | Хелпери payload відповіді для схвалення exec/плагіна |
    | `plugin-sdk/approval-runtime` | Хелпери payload схвалення exec/плагіна, хелпери маршрутизації/runtime нативного схвалення та хелпери структурованого відображення схвалень, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі хелпери скидання dedupe вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі хелпери тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативний auth команд, форматування меню динамічних аргументів і хелпери нативних цілей сесії |
    | `plugin-sdk/command-detection` | Спільні хелпери виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команд і хелпери поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери збирання секретних контрактів для поверхонь секретів каналу/плагіна |
    | `plugin-sdk/secret-ref-runtime` | Вузькі хелпери `coerceSecretRef` і типізації SecretRef для парсингу секретних контрактів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні хелпери довіри, перевірок DM, зовнішнього вмісту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Хелпери політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі хелпери pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch із захистом SSRF і хелпери політики SSRF |
    | `plugin-sdk/secret-input` | Хелпери парсингу секретного вводу |
    | `plugin-sdk/webhook-ingress` | Хелпери запитів/цілей Webhook |
    | `plugin-sdk/webhook-request-guards` | Хелпери розміру тіла запиту/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі хелпери runtime/логування/резервного копіювання/встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі хелпери середовища runtime, логера, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Узагальнені хелпери реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні хелпери команд/хуків/http/interactive плагінів |
    | `plugin-sdk/hook-runtime` | Спільні хелпери pipeline webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Хелпери лінивого імпорту/прив’язки runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Хелпери exec процесів |
    | `plugin-sdk/cli-runtime` | Хелпери форматування CLI, wait, version, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Хелпери клієнта Gateway і patch стану каналу |
    | `plugin-sdk/config-runtime` | Хелпери завантаження/запису конфігурації та пошуку конфігурації плагіна |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файли без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Хелпери схвалення exec/плагіна, builder-и можливостей схвалення, хелпери auth/профілю, хелпери нативної маршрутизації/runtime і форматування шляху структурованого відображення схвалень |
    | `plugin-sdk/reply-runtime` | Спільні хелпери runtime вхідних повідомлень/відповідей, розбиття на частини, dispatch, Heartbeat, planner відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі хелпери dispatch/finalize відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні хелпери історії відповідей короткого вікна, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі хелпери розбиття тексту/markdown на частини |
    | `plugin-sdk/session-store-runtime` | Хелпери шляху сховища сесій + `updated-at` |
    | `plugin-sdk/state-paths` | Хелпери шляхів каталогів state/OAuth |
    | `plugin-sdk/routing` | Хелпери маршруту/ключа сесії/прив’язки облікового запису, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні хелпери підсумку стану каналу/облікового запису, значення runtime-state за замовчуванням і хелпери метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні хелпери визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Хелпери нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із вводів, подібних до fetch/request |
    | `plugin-sdk/run-command` | Запускач команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені reader-и параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload із об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні хелпери тимчасових шляхів завантаження |
    | `plugin-sdk/logging-core` | Хелпери логера підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Хелпери режиму таблиць markdown і перетворення |
    | `plugin-sdk/json-store` | Невеликі хелпери читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Реентерабельні хелпери file-lock |
    | `plugin-sdk/persistent-dedupe` | Хелпери кешу dedupe зберігання на диску |
    | `plugin-sdk/acp-runtime` | Хелпери runtime/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only визначення прив’язок ACP без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Reader логічних параметрів із вільною інтерпретацією |
    | `plugin-sdk/dangerous-name-runtime` | Хелпери визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Хелпери початкового налаштування пристрою та токена pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви пасивного каналу, стану та ambient proxy helper |
    | `plugin-sdk/models-provider-runtime` | Хелпери відповіді команди `/models` / провайдера |
    | `plugin-sdk/skill-commands-runtime` | Хелпери переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Хелпери реєстру/build/serialize нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, хелпери steer/abort активного запуску, хелпери мосту інструментів OpenClaw, хелпери політики інструментів runtime-plan, класифікація фінального результату, хелпери форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Хелпери виявлення ендпойнта Z.A.I |
    | `plugin-sdk/infra-runtime` | Хелпери системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі хелпери обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Хелпери діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні хелпери класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Хелпери обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader обмеженого тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації налаштованих прив’язок або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Хелпери читання сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі хелпери приведення/нормалізації примітивних record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Хелпери нормалізації hostname і хоста SCP |
    | `plugin-sdk/retry-runtime` | Хелпери конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Хелпери каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні хелпери fetch/transform/store медіа плюс builder-и payload медіа |
    | `plugin-sdk/media-store` | Вузькі хелпери сховища медіа, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні хелпери failover генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера розуміння медіа плюс експорти image/audio helper для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні хелпери text/markdown/logging, такі як вилучення видимого асистенту тексту, хелпери render/chunking/table markdown, хелпери редагування, хелпери тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Хелпер розбиття вихідного тексту на частини |
    | `plugin-sdk/speech` | Типи speech provider плюс експорти директив, реєстру, валідації та speech helper для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи speech provider, реєстр, директива, нормалізація та експорти speech helper |
    | `plugin-sdk/realtime-transcription` | Типи провайдера транскрипції в реальному часі, хелпери реєстру та спільний хелпер сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера голосу в реальному часі та хелпери реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, хелпери failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, хелпери failover, пошук провайдера та парсинг model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, хелпери failover, пошук провайдера та парсинг model-ref |
    | `plugin-sdk/webhook-targets` | Хелпери реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Хелпери нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні хелпери завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня helper memory-core вбудованих компонентів для хелперів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і узагальнені batch/remote helper |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні хелпери хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Хелпери запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Хелпери секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Хелпери журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Хелпери стану хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Хелпери CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні хелпери runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Хелпери файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для основних хелперів runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для хелперів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для хелперів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні хелпери керованого markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для хелперів стану хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня helper memory-lancedb вбудованих компонентів |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи helper вбудованих компонентів">
    | Сімейство | Поточні підшляхи | Призначене використання |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Хелпери підтримки вбудованого плагіна браузера. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` лишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper вбудованого IRC |
    | Специфічні для каналу helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Застарілі seams сумісності/helper вбудованих каналів. Нові плагіни мають імпортувати узагальнені підшляхи SDK або локальні barrel-файли плагінів. |
    | Специфічні для auth/плагіна helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams helper вбудованих функцій/плагінів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
