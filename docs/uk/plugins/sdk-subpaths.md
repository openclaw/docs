---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-05-03T08:53:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено поширені підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи для вбудованих Plugin наведені там, але є деталлю
  реалізації, якщо сторінка документації явно не підносить їх до публічної поверхні. Мейнтейнери можуть перевіряти активні
  зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти провалюють CI-звіт замість того, щоб залишатися в публічному SDK
  як неактивний борг сумісності.

  Посібник зі створення Plugin див. в [Огляді Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий агрегувальний модуль сумісності для застарілих тестів Plugin; для нових тестів Plugin надавайте перевагу цільовим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний конструктор мока `OpenClawPluginApi` для модульних тестів прямої реєстрації Plugin                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера середовища виконання агента для профілів автентифікації, придушення доставки, класифікації резервного сценарію, хуків інструментів, накладень промптів, схем і відновлення транскрипту |
  | `plugin-sdk/channel-test-helpers`         | Помічники тестів життєвого циклу акаунта каналу, каталогу, конфігурації надсилання, мока середовища виконання, хука, точки входу вбудованого каналу, часової мітки конверта, відповіді спарювання та загального контракту каналу   |
  | `plugin-sdk/channel-target-testing`       | Спільний тестовий набір випадків помилок розв'язання цілей каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Помічники контрактів для реєстрації Plugin, маніфесту пакета, публічного артефакту, API середовища виконання, побічних ефектів імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури для тестів середовища виконання Plugin, реєстру, реєстрації провайдерів, майстра налаштування та потоку завдань середовища виконання                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Помічники контрактів середовища виконання провайдера, автентифікації, виявлення, первинного налаштування, каталогу, можливостей медіа, політики повторного відтворення, аудіо наживо для STT у реальному часі, веб-пошуку/отримання та майстра                 |
  | `plugin-sdk/provider-http-test-mocks`     | Опційні HTTP/автентифікаційні моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, отримання даних/мережі, одноразового HTTP-сервера, вхідного запиту, живого тесту, тимчасової файлової системи та керування часом                                        |
  | `plugin-sdk/test-fixtures`                | Загальні тестові фікстури для CLI, пісочниці, Skills, повідомлення агента, системної події, перезавантаження модуля, шляху вбудованого Plugin, термінала, розбиття на фрагменти, токена автентифікації та типізованих випадків                   |
  | `plugin-sdk/test-node-mocks`              | Цільові помічники моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Помічники елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, помічники редагування з приховуванням даних і `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Помічники міграції під час виконання, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники майстра налаштування, підказки списку дозволених, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники конфігурації кількох акаунтів/шлюзу дій, помічники резервного вибору акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації ідентифікаторів акаунтів |
    | `plugin-sdk/account-resolution` | Помічники пошуку акаунтів і резервного вибору за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі помічники списків акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу плюс конструктори Zod і безпосередні конструктори JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації вбудованих каналів OpenClaw лише для підтримуваних вбудованих Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий аліас сумісності для схем конфігурації вбудованих каналів |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/перевірки користувацьких команд Telegram із резервним варіантом вбудованого контракту |
    | `plugin-sdk/command-gating` | Вузькі помічники шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, помічники життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні помічники вхідного маршруту та конструктора конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні помічники запису та диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Помічники парсингу/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Помічники вихідної доставки, ідентичності, делегата надсилання, сеансу, форматування та планування корисного навантаження |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу прив'язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор корисного навантаження медіа агента |
    | `plugin-sdk/conversation-runtime` | Помічники прив'язки розмов/потоків, спарювання та налаштованих прив'язок |
    | `plugin-sdk/runtime-config-snapshot` | Помічник знімка конфігурації середовища виконання |
    | `plugin-sdk/runtime-group-policy` | Помічники розв'язання групової політики середовища виконання |
    | `plugin-sdk/channel-status` | Спільні помічники знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні базові експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання конфігурації списку дозволених |
    | `plugin-sdk/group-access` | Спільні помічники ухвалення рішень щодо доступу груп |
    | `plugin-sdk/direct-dm` | Спільні помічники автентифікації/захисту прямих DM |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; новим Plugin слід використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв'язання акаунтів Telegram для відстежуваної сумісності власника; новим Plugin слід використовувати інжектовані помічники середовища виконання або загальні підшляхи SDK каналів |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; новим Plugin слід використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Помічники семантичного подання повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Агрегувальний модуль сумісності для вхідного дебаунсу, зіставлення згадок, помічників політики згадок і помічників конвертів |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі помічники вхідного дебаунсу |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники політики згадок, маркерів згадок і тексту згадок без ширшої поверхні вхідного середовища виконання |
    | `plugin-sdk/channel-envelope` | Вузькі помічники форматування вхідного конверта |
    | `plugin-sdk/channel-location` | Помічники контексту розташування каналу та форматування |
    | `plugin-sdk/channel-logging` | Помічники журналювання каналу для відкинутих вхідних повідомлень і помилок індикації набору тексту/підтвердження |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Помічники дій із повідомленнями каналу, а також застарілі нативні помічники схем, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні помічники нормалізації маршрутів, розв'язання цілей на основі парсера, перетворення ідентифікаторів потоків на рядки, дедуплікації/компактизації ключів маршрутів, типи розібраних цілей і помічники порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Помічники парсингу цілей; тим, хто виконує порівняння маршрутів, слід використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналів |
    | `plugin-sdk/channel-feedback` | Зв'язування відгуків/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники контрактів секретів, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи секретних цілей |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для типових параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних функцій завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні функції налаштування локальних/самостійно розміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування самостійно розміщених OpenAI-сумісних провайдерів |
    | `plugin-sdk/cli-backend` | Типові параметри бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-ключа під час виконання для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу API-ключа/запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку змінних середовища для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик replay, допоміжні функції кінцевих точок провайдера та допоміжні функції нормалізації ID моделей, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу провайдера та стики реєстру Plugin-провайдерів для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції можливостей HTTP/кінцевих точок провайдера, HTTP-помилки провайдера та допоміжні функції multipart-форми для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped setters/getters для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешу/runtime для провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика та допоміжні функції сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні функції обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні функції нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні функції патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції singleton/map/cache, локальні для процесу |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, зокрема динамічне форматування меню аргументів, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра нативного затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативної можливості/доставки затверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція визначення Gateway для затверджень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні функції завантаження адаптера нативних затверджень для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-допоміжні функції обробника затверджень; віддавайте перевагу вужчим стикам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції нативної цілі затвердження + прив’язування облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді на затвердження exec/Plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні функції payload затвердження exec/Plugin, допоміжні функції маршрутизації/runtime нативних затверджень і допоміжні функції структурованого відображення затверджень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, динамічне форматування меню аргументів і допоміжні функції нативної цілі сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні функції command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання secret-contract для поверхонь секретів каналів/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, обмеження DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції pinned-dispatcher без широкої runtime-поверхні інфраструктури |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch із SSRF-захистом, помилка SSRF і допоміжні функції політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі Webhook і raw-приведення websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/plugin-install |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованих профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` безпосередньо |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати загальні підшляхи SDK безпосередньо |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби відкладеного імпорту/прив’язування runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і відкладених груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта після готовності event-loop, gateway CLI RPC, помилки протоколу gateway і допоміжні засоби патчів стану каналу |
    | `plugin-sdk/config-types` | Type-only поверхня конфігурації для форм конфігурації plugin, як-от `OpenClawConfig` і типи конфігурації каналу/провайдера |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації plugin у runtime, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Транзакційні допоміжні засоби зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команди Telegram і перевірки дублікатів/конфліктів, навіть коли bundled поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/plugin, конструктори approval-capability, допоміжні засоби auth/profile, native routing/runtime helpers і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, розбиття на фрагменти, dispatch, heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби reply dispatch/finalize та міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби короткого вікна історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби розбиття тексту/Markdown на фрагменти |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сеансів, session-key, updated-at і зміни сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/load/save сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/session-key/account binding, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення стану каналу/облікового запису, типові значення runtime-state і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розпізнавача цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-like входів |
    | `plugin-sdk/run-command` | Засіб запуску команд з таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payloads з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів temp-download |
    | `plugin-sdk/logging-core` | Допоміжні засоби логера підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення model/session, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Re-entrant допоміжні засоби file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового dedupe-кеша |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/session і reply-dispatch ACP |
    | `plugin-sdk/acp-runtime-backend` | Легковагові допоміжні засоби реєстрації backend ACP і reply-dispatch для startup-loaded plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання прив’язки ACP без імпортів lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий читач булевого параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання зіставлення dangerous-name |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токена спарювання |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді для команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби registry/build/serialize для native command |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, допоміжні засоби steer/abort для active-run, допоміжні засоби моста tool OpenClaw, допоміжні засоби політики tool runtime-plan, класифікація результату термінала, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Process-local допоміжний засіб async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої concurrency асинхронних задач |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби in-memory dedupe-кеша |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain для вихідних pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних token/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані підшляхи runtime вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кеша |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного прапорця, події та trace-context |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений читач response-body без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Стан прив’язки поточної розмови без configured binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів config writes/maintenance |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry та засобу запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогів/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Config-backed запит/dedup каталогу |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні помічники для отримання/перетворення/збереження медіа, визначення розмірів відео на основі ffprobe та побудовники медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі помічники медіасховища, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні помічники резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти помічників зображень/аудіо для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні помічники для тексту/markdown/логування, як-от вилучення видимого для асистента тексту, помічники рендерингу/chunking/таблиць markdown, помічники редагування, помічники тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Помічник chunking для вихідного тексту |
    | `plugin-sdk/speech` | Типи мовленнєвих провайдерів, а також експорти директив, реєстру, валідації, сумісного з OpenAI побудовника TTS і мовленнєвих помічників для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовленнєвих провайдерів, реєстр, директива, нормалізація та експорти мовленнєвих помічників |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, помічники реєстру та спільний помічник сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та помічники реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також помічники URL ресурсів/даних зображень і сумісний з OpenAI побудовник провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та помічники реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, помічники резервного перемикання, пошук провайдера та розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, помічники резервного перемикання, пошук провайдера та розбір model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і помічники встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Помічники нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні помічники завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK Plugin |
    | `plugin-sdk/testing` | Широкий compatibility barrel для застарілих тестів плагінів. Нові тести розширень натомість мають імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний помічник `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту містків тестових помічників репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схеми та проєкції transcript |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові помічники для загальних контрактів дій/setup/status, перевірок каталогів, життєвого циклу запуску облікового запису, threading send-config, runtime mocks, проблем статусу, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Помічники контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Помічники контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, майстра, медіаможливостей, політики replay, realtime STT live-audio, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Опціональні HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Узагальнені фікстури захоплення CLI runtime, sandbox context, writer Skills, agent-message, system-event, module reload, шляху до bundled plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусовані помічники mock для вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня bundled memory-core помічників для manager/config/file/CLI помічників |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія основи хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote помічники |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD-рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Помічники журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Помічники статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помічники CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Помічники core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Vendor-neutral alias для помічників core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Vendor-neutral alias для помічників журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Vendor-neutral alias для помічників файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні помічники managed-markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime active memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutral alias для помічників статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Наразі зарезервованих підшляхів SDK bundled-helper немає. Помічники,
    специфічні для власника, розміщуються всередині пакета Plugin-власника, тоді як
    багаторазові контракти хоста використовують загальні підшляхи SDK, як-от
    `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд SDK Plugin](/uk/plugins/sdk-overview)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
