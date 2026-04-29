---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповані за розділами'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-29T19:09:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60fe10982b9aa01af76bfbd72475168c8138f68dd410b4488b6b6c4c00097e53
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  Ця сторінка каталогізує часто використовувані підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів зберігається в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також є там, але вони є деталлю
  реалізації, якщо сторінка документації явно не підносить їх до публічного контракту. Мейнтейнери можуть перевіряти активні
  зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти провалюють CI-звіт замість того, щоб залишатися в публічному SDK
  як неактивний борг сумісності.

  Посібник з авторства плагінів див. у [огляді Plugin SDK](/uk/plugins/sdk-overview).

  ## Вхідна точка Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів плагінів; для нових тестів розширень віддавайте перевагу сфокусованим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний mock builder `OpenClawPluginApi` для unit-тестів прямої реєстрації плагіна                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для профілів автентифікації, придушення доставки, класифікації fallback, хуків інструментів, накладень промптів, схем і відновлення транскрипта |
  | `plugin-sdk/channel-test-helpers`         | Тестові помічники для життєвого циклу облікового запису каналу, каталогу, send-config, mock runtime, хуків, bundled entry каналу, часової позначки конверта, відповіді pairing і загальних контрактів каналу   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів для випадків помилок розв’язання цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Помічники контрактів реєстрації плагіна, package manifest, публічного артефакту, runtime API, побічного ефекту імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime плагіна, registry, provider-registration, setup-wizard і runtime task-flow для тестів                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Помічники контрактів provider runtime, автентифікації, discovery, onboard, каталогу, медіаможливостей, політики replay, realtime STT live-audio, web-search/fetch і wizard                 |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in HTTP/auth mocks Vitest для тестів провайдера, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, одноразового HTTP-сервера, вхідного запиту, live-test, тимчасової файлової системи та керування часом                                        |
  | `plugin-sdk/test-fixtures`                | Узагальнені тестові фікстури CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, термінала, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Сфокусовані помічники mock для вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Помічники елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, помічники редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Runtime-помічники міграції, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники setup wizard, промпти allowlist, builders статусу setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники multi-account config/action-gate, помічники fallback для default-account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації account-id |
    | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису та default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі помічники account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та узагальнений builder |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled каналів OpenClaw лише для підтримуваних bundled plugins |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації bundled-channel |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/валідації користувацьких команд Telegram із fallback bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі помічники gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, помічники життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні помічники inbound route і envelope builder |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні помічники record-and-dispatch для inbound |
    | `plugin-sdk/messaging-targets` | Помічники parsing/matching цілей |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук outbound send залежностей для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Помічники outbound delivery, identity, send delegate, session, formatting і payload planning |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу thread-binding і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий builder медіакорисного навантаження агента |
    | `plugin-sdk/conversation-runtime` | Помічники conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Помічник runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | Помічники розв’язання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні помічники snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації channel config-write |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання allowlist config |
    | `plugin-sdk/group-access` | Спільні помічники рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні помічники direct-DM auth/guard |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові плагіни мають використовувати узагальнені підшляхи channel SDK |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності Telegram account-resolution для відстежуваної сумісності власника; нові плагіни мають використовувати інжектовані runtime-помічники або узагальнені підшляхи channel SDK |
    | `plugin-sdk/interactive-runtime` | Семантична презентація повідомлень, доставка та застарілі помічники interactive reply. Див. [Презентація повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, помічників mention-policy і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі помічники inbound debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники mention-policy, mention marker і mention text без ширшої surface inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі помічники форматування inbound envelope |
    | `plugin-sdk/channel-location` | Помічники context і formatting для channel location |
    | `plugin-sdk/channel-logging` | Помічники logging каналу для inbound drops і typing/ack failures |
    | `plugin-sdk/channel-send-result` | Типи результату reply |
    | `plugin-sdk/channel-actions` | Помічники message-action каналу, а також застарілі помічники native schema, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільні помічники нормалізації route, parser-driven target resolution, stringification thread-id, dedupe/compact route keys, типів parsed-target і порівняння route/target |
    | `plugin-sdk/channel-targets` | Помічники parsing цілей; викликачі порівняння route мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи постачальників">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад постачальника LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для локальних стандартних параметрів сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби налаштування локальних/самостійно розміщених постачальників |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування сумісних з OpenAI самостійно розміщених постачальників |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенду CLI + константи сторожового контролю |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключів під час виконання для plugin постачальників |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби початкового налаштування API-ключів/запису профілів, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для plugin постачальників |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації постачальника |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик повторного відтворення, допоміжні засоби endpoint постачальника та допоміжні засоби нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук розширення каталогу постачальника та шви реєстру plugin-постачальників для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні допоміжні засоби можливостей HTTP/endpoint постачальника, HTTP-помилки постачальника та допоміжні засоби multipart-форми для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування постачальника web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних вебпошуку для постачальників, яким не потрібне підключення ввімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних вебпошуку, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped setters/getters облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime постачальника вебпошуку |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту постачальника, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації початкового налаштування |
    | `plugin-sdk/global-singleton` | Допоміжні засоби singleton/map/cache у межах процесу |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправників |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтрів нативного затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки затверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway для затверджень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні засоби завантаження нативного адаптера затверджень для гарячих entrypoint каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime обробника затверджень; віддавайте перевагу вужчим швам адаптера/Gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі затвердження + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на затвердження exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload затвердження exec/plugin, нативні допоміжні засоби маршрутизації/runtime затверджень і допоміжні засоби структурованого відображення затверджень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби контрактного тестування каналів без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної цілі сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команди та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналів/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, обмеження DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої runtime-поверхні інфраструктури |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, захищеного від SSRF fetch, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів/цілей Webhook і приведення сирого websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі помічники середовища виконання, журналювання, резервного копіювання та встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі помічники env середовища виконання, logger, timeout, retry та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору URL CDP та помічників автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Загальні помічники реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні помічники команд, хуків, http та інтерактивних можливостей plugin |
    | `plugin-sdk/hook-runtime` | Спільні помічники конвеєра webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Помічники лінивого імпорту/прив’язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Помічники виконання процесів |
    | `plugin-sdk/cli-runtime` | Помічники форматування CLI, очікування, версії, виклику з аргументами та лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, помічник запуску клієнта після готовності циклу подій, CLI RPC Gateway, помилки протоколу Gateway та помічники виправлень статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації plugin, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Помічники пошуку plugin-config у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Помічники транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Помічники знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на посилання файлів без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Помічники схвалення exec/plugin, побудовники можливостей схвалення, помічники auth/profile, помічники native routing/runtime і форматування шляхів структурованого відображення схвалень |
    | `plugin-sdk/reply-runtime` | Спільні помічники середовища виконання inbound/reply, поділу на фрагменти, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники dispatch/finalize відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні помічники історії відповідей короткого вікна та маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі помічники поділу text/markdown на фрагменти |
    | `plugin-sdk/session-store-runtime` | Помічники шляху сховища сесій, session-key, updated-at і зміни сховища |
    | `plugin-sdk/cron-store-runtime` | Помічники шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Помічники шляхів каталогів стану/OAuth |
    | `plugin-sdk/routing` | Помічники маршруту/session-key/прив’язування акаунта, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні помічники підсумку статусу каналу/акаунта, типові значення runtime-state і помічники метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні помічники resolver цілей |
    | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload із об’єктів результату tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з args tool |
    | `plugin-sdk/temp-path` | Спільні помічники шляху тимчасового завантаження |
    | `plugin-sdk/logging-core` | Помічники logger підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Помічники режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Помічники перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Помічники розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі помічники читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Помічники реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Помічники дискового dedupe cache |
    | `plugin-sdk/acp-runtime` | Помічники середовища виконання/сесії ACP і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легковажні помічники реєстрації backend ACP і reply-dispatch для plugins, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язування ACP лише для читання без імпортів запуску lifecycle |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema середовища виконання агента |
    | `plugin-sdk/boolean-param` | Нестрогий читач булевого параметра |
    | `plugin-sdk/dangerous-name-runtime` | Помічники розв’язання збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Помічники початкового налаштування пристрою та токенів парування |
    | `plugin-sdk/extension-shared` | Спільні примітиви пасивного каналу, статусу та помічника ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Помічники відповіді команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Помічники переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Помічники registry/build/serialize нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агентів: типи harness, помічники steer/abort для active-run, помічники bridge tool OpenClaw, помічники політики tool runtime-plan, класифікація результатів термінала, помічники форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Помічники виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Помічник локального для процесу async lock для невеликих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Помічник телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Помічник обмеженої конкурентності async tasks |
    | `plugin-sdk/dedupe-runtime` | Помічники in-memory dedupe cache |
    | `plugin-sdk/delivery-queue-runtime` | Помічник drain вихідних pending-delivery |
    | `plugin-sdk/file-access-runtime` | Помічники безпечних шляхів локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Помічники подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Помічник числового приведення |
    | `plugin-sdk/secure-random-runtime` | Помічники безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Помічники черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Помічник очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані підшляхи середовища виконання вище |
    | `plugin-sdk/collection-runtime` | Невеликі помічники bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Помічники діагностичних прапорців, подій і trace-context |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні помічники класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і помічники pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware fetch середовища виконання без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого response-body без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язування розмови без налаштованої маршрутизації прив’язувань або сховищ парування |
    | `plugin-sdk/session-store-runtime` | Помічники session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі помічники приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Помічники нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Помічники конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Помічники каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація directory на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання/перетворення/зберігання медіа, визначення розмірів відео на основі ffprobe та побудовники медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, призначені для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/markdown/логування, як-от видалення видимого для асистента тексту, допоміжні засоби рендерингу/нарізання на фрагменти/таблиць markdown, допоміжні засоби редагування, директивних тегів і безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб нарізання вихідного тексту на фрагменти |
    | `plugin-sdk/speech` | Типи мовленнєвих провайдерів, а також експорти директив, реєстру, валідації, OpenAI-сумісного побудовника TTS і допоміжних мовленнєвих засобів, призначені для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовленнєвих провайдерів, реєстр, директива, нормалізація та експорти допоміжних мовленнєвих засобів |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби URL-адрес ресурсів/даних зображень і OpenAI-сумісний побудовник провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK Plugin |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів Plugin. Нові тести розширень мають натомість імпортувати цільові підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту містків тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для тестів автентифікації, доставки, резервного сценарію, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові допоміжні засоби для загальних контрактів дій/налаштування/стану, тверджень щодо каталогів, життєвого циклу запуску акаунта, потоків send-config, моків runtime, проблем стану, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір сценаріїв помилок розв’язання цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, wizard, медіаможливостей, політики повторного відтворення, realtime STT live-audio, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Опційні HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту пісочниці, записувача skill, повідомлень агента, системних подій, перезавантаження модулів, шляху до вбудованого Plugin, тексту термінала, нарізання на фрагменти, токена автентифікації та типізованих кейсів |
    | `plugin-sdk/test-node-mocks` | Цільові допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня вбудованих допоміжних засобів memory-core для допоміжних засобів менеджера/config/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embeddings хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote допоміжні засоби |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Вендорно-нейтральний псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Вендорно-нейтральний псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Вендорно-нейтральний псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для суміжних із пам’яттю Plugin |
    | `plugin-sdk/memory-host-search` | Фасад runtime active memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Вендорно-нейтральний псевдонім для допоміжних засобів стану хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих допоміжних засобів">
    Наразі немає зарезервованих підшляхів SDK для вбудованих допоміжних засобів. Специфічні для власника
    допоміжні засоби містяться всередині пакета Plugin-власника, тоді як багаторазові контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд SDK Plugin](/uk/plugins/sdk-overview)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
