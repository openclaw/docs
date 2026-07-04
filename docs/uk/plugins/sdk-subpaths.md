---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих плагінів і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: де розміщені які імпорти, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-07-04T11:01:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin надається як набір вузьких публічних підшляхів у
`openclaw/plugin-sdk/`. На цій сторінці наведено поширені підшляхи, згруповані за
призначенням. Згенерований інвентар точок входу компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета є публічною підмножиною
після віднімання локальних для репозиторію тестових/внутрішніх підшляхів,
перелічених у `scripts/lib/plugin-sdk-private-local-only-subpaths.json`.
Супровідники можуть перевірити кількість публічних експортів за допомогою
`pnpm plugin-sdk:surface`, а активні зарезервовані підшляхи допоміжних засобів —
за допомогою `pnpm plugins:boundary-report:summary`; невикористані зарезервовані
експорти допоміжних засобів спричиняють збій звіту CI, а не залишаються в
публічному SDK як неактивний борг сумісності.

Посібник з розробки Plugin див. у [огляді SDK Plugin](/uk/plugins/sdk-overview).

## Вхід Plugin

| Підшлях                       | Ключові експорти                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`     | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`             | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`    | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`   | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`        | Допоміжні засоби елементів постачальника міграції, як-от `createMigrationItem`, константи причин, маркери стану елементів, допоміжні засоби редагування та `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Допоміжні засоби міграції під час виконання, як-от `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` і `writeMigrationReport` |
| `plugin-sdk/health`           | Реєстрація перевірок справності Doctor, виявлення, виправлення, вибір, серйозність і типи знахідок для вбудованих споживачів справності                                |

### Застаріла сумісність і тестові допоміжні засоби

Застарілі підшляхи залишаються експортованими для старіших Plugins, але новий код
має використовувати наведені нижче спеціалізовані підшляхи SDK. Підтримуваний
список міститься в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI
відхиляє виробничі імпорти вбудованих компонентів із нього. Широкі barrels, як-от
`compat`, `config-types`, `infra-runtime`, `text-runtime` і `zod`, призначені лише
для сумісності. Імпортуйте `zod` безпосередньо з `zod`.

Підшляхи тестових допоміжних засобів OpenClaw на базі Vitest є лише локальними
для репозиторію й більше не є експортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` і `testing`.

### Зарезервовані підшляхи допоміжних засобів вбудованих Plugins

Ці підшляхи є поверхнями сумісності, що належать Plugin, для відповідного
вбудованого Plugin, а не загальними API SDK: `plugin-sdk/codex-mcp-projection` і
`plugin-sdk/codex-native-task-runtime`. Імпорти розширень між різними власниками
блокуються запобіжниками контракту пакета.

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кешований допоміжний засіб перевірки JSON Schema для схем, що належать плагінам |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, перекладач налаштування, запити списку дозволених, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації кількох облікових записів і шлюзу дій, допоміжні засоби резервного переходу до стандартного облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису та резервного переходу до стандартного |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби списку облікових записів і дій з обліковими записами |
    | `plugin-sdk/access-groups` | Допоміжні засоби розбору списку дозволених для груп доступу та замаскованої діагностики груп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналів, а також побудовники Zod і прямі побудовники JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації каналів OpenClaw лише для підтримуваних вбудованих плагінів |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонічні ідентифікатори вбудованих/офіційних чат-каналів, а також мітки форматування/псевдоніми для плагінів, яким потрібно розпізнавати текст із префіксом конверта без жорстко закодованої власної таблиці. |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації bundled-channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/перевірки користувацьких команд Telegram із резервним варіантом вбудованого контракту |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Застарілий низькорівневий фасад сумісності для вхідного трафіку каналу. Нові шляхи отримання мають використовувати `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Експериментальний високорівневий розв’язувач середовища виконання вхідного трафіку каналу та побудовники фактів маршруту для мігрованих шляхів отримання каналу. Надавайте йому перевагу замість складання ефективних списків дозволених, списків дозволених команд і застарілих проєкцій у кожному плагіні. Див. [API вхідного трафіку каналу](/uk/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракти життєвого циклу повідомлень, а також параметри конвеєра відповідей, підтвердження, живий попередній перегляд/потокове передавання, допоміжні засоби життєвого циклу, вихідна ідентичність, планування корисного навантаження, надійні надсилання та допоміжні засоби контексту надсилання повідомлень. Див. [API вихідного трафіку каналу](/uk/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Застарілий псевдонім сумісності для `plugin-sdk/channel-outbound`, а також застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/channel-message-runtime` | Застарілий псевдонім сумісності для `plugin-sdk/channel-outbound`, а також застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби вхідного маршруту та побудовника конвертів |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-inbound` для вхідних раннерів і предикатів диспетчеризації, а `plugin-sdk/channel-outbound` — для допоміжних засобів доставки повідомлень. |
    | `plugin-sdk/messaging-targets` | Застарілий псевдонім розбору цілей; використовуйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа та стану розміщених медіа |
    | `plugin-sdk/outbound-send-deps` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язування гілок і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіакорисного навантаження агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язування розмов/гілок, спарювання та налаштованого прив’язування |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації середовища виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання групової політики середовища виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналів |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти преамбули плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації списку дозволених |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби ухвалення рішень щодо доступу груп |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі фасади сумісності. Використовуйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Вузькі допоміжні засоби політики захисту прямого DM до шифрування |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові плагіни мають використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв’язання облікових записів Telegram для відстежуваної сумісності власника; нові плагіни мають використовувати інжектовані допоміжні засоби середовища виконання або загальні підшляхи SDK каналів |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові плагіни мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Спільні вхідні допоміжні засоби для класифікації подій, побудови контексту, форматування, коренів, debounce, зіставлення згадок, політики згадок і вхідного журналювання |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі вхідні допоміжні засоби debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркера згадки та тексту згадки без ширшої поверхні вхідного середовища виконання |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Застарілі фасади сумісності. Використовуйте `plugin-sdk/channel-inbound` або `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій з повідомленнями каналу, а також застарілі допоміжні засоби нативної схеми, залишені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби нормалізації маршрутів, розв’язання цілей на основі парсера, перетворення thread-id на рядок, ключів дедуплікації/компактних маршрутів, типів розібраних цілей і порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; викликачі порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналів |
    | `plugin-sdk/channel-feedback` | Підключення відгуків/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби контрактів секретів, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

Застарілі сімейства допоміжних засобів каналів залишаються доступними лише для
сумісності з опублікованими плагінами. План видалення такий: зберігати їх
протягом вікна міграції зовнішніх плагінів, тримати репозиторні/вбудовані
плагіни на `channel-inbound` і `channel-outbound`, а потім видалити підшляхи
сумісності під час наступного великого очищення SDK. Це стосується старих
сімейств повідомлень/середовища виконання каналів, потокового передавання
каналу, доступу direct-DM, відокремлених вхідних допоміжних засобів,
reply-options і pairing-path.

  <Accordion title="Підшляхи провайдера">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад середовища виконання LM Studio для типових значень локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локальних/самостійно розміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісних самостійно розміщених провайдерів |
    | `plugin-sdk/cli-backend` | Типові значення бекенду CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби вирішення API-ключів під час виконання для плагінів провайдерів |
    | `plugin-sdk/provider-oauth-runtime` | Загальні типи зворотних викликів OAuth провайдерів, рендеринг сторінки зворотного виклику, допоміжні засоби PKCE/state, розбір authorization-input, допоміжні засоби строку дії токенів і допоміжні засоби скасування |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу API-ключів/запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату автентифікації OAuth |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, допоміжні засоби імпорту автентифікації OpenAI Codex, застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик повторного відтворення, допоміжні засоби endpoint провайдера та спільні допоміжні засоби нормалізації model-id |
    | `plugin-sdk/provider-catalog-live-runtime` | Допоміжні засоби живого каталогу моделей провайдера для захищеного виявлення у стилі `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фільтрація model-id, кеш TTL і статичний fallback |
    | `plugin-sdk/provider-catalog-runtime` | Хук середовища виконання для доповнення каталогу провайдера та шви реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби можливостей HTTP/endpoint провайдера, HTTP-помилки провайдера та допоміжні засоби multipart-форми для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення плагіна |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped setters/getters облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/середовища виконання провайдера web-search |
    | `plugin-sdk/embedding-providers` | Загальні типи провайдерів embeddings і допоміжні засоби читання, зокрема `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` і `listEmbeddingProviders(...)`; плагіни реєструють провайдерів через `api.registerEmbeddingProvider(...)`, щоб забезпечувалося володіння маніфестом |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` і очищення схем DeepSeek/Gemini/OpenAI + діагностика |
    | `plugin-sdk/provider-usage` | Типи знімків використання провайдера, спільні допоміжні засоби отримання використання та fetchers провайдерів, як-от `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку, сумісність викликів інструментів у plain-text і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публічні спільні допоміжні засоби обгорток потоку провайдера, зокрема `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` і потокові утиліти, сумісні з Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, витягування тексту результату інструмента, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Допоміжні засоби вузького режиму активації груп і розбору команд |
  </Accordion>

Знімки використання провайдера зазвичай повідомляють про одне або кілька quota `windows`, кожне з
міткою, відсотком використання та необов’язковим часом скидання. Провайдери, які надають текст балансу або
стану облікового запису замість скидних quota windows, мають повертати
`summary` з порожнім масивом `windows`, а не вигадувати відсотки.
OpenClaw показує цей текст підсумку у виводі статусу; використовуйте `error` лише тоді, коли
endpoint використання завершився помилкою або не повернув придатних даних використання.

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і same-chat action-auth |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра нативного схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери нативної можливості/доставки схвалень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway для схвалень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні засоби завантаження нативного адаптера схвалень для гарячих entrypoints каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби середовища виконання обробника схвалень; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі схвалення, прив’язки облікового запису, route-gate, fallback пересилання та приглушення локального нативного prompt exec |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко закодовані прив’язки реакцій схвалення, payloads prompt реакцій, сховища цілей реакцій, допоміжні засоби тексту підказок реакцій і експорт сумісності для приглушення локального нативного prompt exec |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді схвалення exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload схвалення exec/plugin, нативні допоміжні засоби маршрутизації/середовища виконання схвалень і допоміжні засоби структурованого відображення схвалень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання dedupe для вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого barrel тестування |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і нативні допоміжні засоби session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Lazy допоміжні засоби потоку входу автентифікації провайдера для приватного каналу та сполучення Web UI device-code |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналу/плагіна |
    | `plugin-sdk/secret-ref-runtime` | Вузькі `coerceSecretRef` і допоміжні засоби типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Type-only маніфест інтеграції провайдера SecretRef і контракти preset для плагінів, що публікують зовнішні preset провайдерів секретів |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, gating DM, root-bounded файлів/шляхів, зокрема записи create-only, синхронна/асинхронна атомарна заміна файлів, записи sibling temp, fallback переміщення між пристроями, допоміжні засоби приватного file-store, guards батьків symlink, external-content, редагування чутливого тексту, порівняння секретів за сталий час і допоміжні засоби збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні інфраструктурного середовища виконання |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, захищений SSRF fetch, помилка SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення необробленого websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру/тайм-ауту тіла запиту |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/журналювання/резервного копіювання/інсталяції Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби для runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Загальні допоміжні засоби життєвого циклу завдань і доставки завершення для агентів на базі harness, що використовують видану хостом область завдання |
    | `plugin-sdk/codex-mcp-projection` | Зарезервований допоміжний засіб bundled Codex для проєктування користувацької конфігурації MCP-сервера в конфігурацію Codex thread; не для сторонніх plugins |
    | `plugin-sdk/codex-native-task-runtime` | Приватний допоміжний засіб bundled Codex для native task mirror/runtime wiring; не для сторонніх plugins |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` напряму |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати загальні підшляхи SDK напряму |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/інтерактивності Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime import/binding, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесу |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і lazy command-group |
    | `plugin-sdk/qa-live-transport-scenarios` | Спільні ідентифікатори сценаріїв QA live transport, допоміжні засоби baseline coverage і вибору сценарію |
    | `plugin-sdk/gateway-method-runtime` | Зарезервований допоміжний засіб dispatch методів Gateway для HTTP-маршрутів Plugin, що оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта, готового до event loop, gateway CLI RPC, помилки протоколу gateway, визначення advertised LAN host і допоміжні засоби patch статусу каналу |
    | `plugin-sdk/config-contracts` | Сфокусована type-only поверхня конфігурації для форм конфігурації Plugin, як-от `OpenClawConfig`, і типів конфігурації каналу/провайдера |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку runtime plugin-config, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Транзакційні допоміжні засоби мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Спільні рядки підказок метаданих доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня bundled контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого text barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко закодовані прив’язки реакцій затвердження, payload підказок реакцій, сховища цілей реакцій, допоміжні засоби тексту підказок реакцій і експорт сумісності для придушення локальної native exec підказки |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби затвердження exec/Plugin, побудовники approval-capability, допоміжні засоби auth/profile, native routing/runtime і форматування структурованого шляху відображення затвердження |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби reply dispatch/finalize і conversation-label |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби short-window reply-history. Новий код message-turn має використовувати `createChannelHistoryWindow`; нижчорівневі допоміжні засоби map залишаються лише застарілими експортами сумісності |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session workflow (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), обмежене читання тексту нещодавнього transcript користувача/асистента за ідентичністю session, допоміжні засоби legacy session store path/session-key, читання updated-at і перехідні допоміжні засоби сумісності whole-store/file-path |
    | `plugin-sdk/session-transcript-runtime` | Ідентичність transcript, допоміжні засоби scoped target/read/write, публікація оновлень, write locks і ключі transcript memory hit |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані допоміжні засоби SQLite agent-schema, path і transaction для first-party runtime |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби path/load/save сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типи keyed-state для sidecar SQLite Plugin плюс централізовані pragma підключення і налаштування обслуговування WAL для баз даних, якими володіє Plugin |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язки route/session-key/account, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку статусу channel/account, типові значення runtime-state і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягувати рядкові URL з fetch/request-like inputs |
    | `plugin-sdk/run-command` | Timed command runner з нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-plugin` | Визначити простий typed agent-tool Plugin і відкрити статичні метадані для генерації manifest |
    | `plugin-sdk/tool-payload` | Витягувати нормалізовані payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягувати канонічні поля send target з аргументів tool |
    | `plugin-sdk/sandbox` | Типи sandbox backend і допоміжні засоби команд SSH/OpenShell, зокрема fail-fast exec command preflight |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів temp-download і приватні secure temp workspaces |
    | `plugin-sdk/logging-core` | Допоміжні засоби subsystem logger і redaction |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму Markdown table і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби model/session override, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації talk provider |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON state |
    | `plugin-sdk/json-unsafe-integers` | Допоміжні засоби розбору JSON, що зберігають небезпечні цілочисельні літерали як рядки |
    | `plugin-sdk/file-lock` | Допоміжні засоби re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби dedupe cache з дисковою підтримкою |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легкі допоміжні засоби реєстрації ACP backend і reply-dispatch для plugins, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання прив’язок ACP без lifecycle startup imports |
    | `plugin-sdk/agent-config-primitives` | Вузькі primitives schema конфігурації agent runtime |
    | `plugin-sdk/boolean-param` | Вільний читач boolean параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання dangerous-name matching |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою і pairing token |
    | `plugin-sdk/extension-shared` | Спільні primitives допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skill |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби registry/build/serialize native command |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, допоміжні засоби active-run steer/abort, допоміжні засоби OpenClaw tool bridge, допоміжні засоби політики runtime-plan tool, класифікація terminal outcome, допоміжні засоби форматування/деталізації прогресу tool і утиліти attempt result |
    | `plugin-sdk/provider-zai-endpoint` | Застарілий фасад виявлення endpoint, яким володіє провайдер Z.AI; використовуйте публічний API Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Process-local async lock helper для малих файлів runtime state |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб telemetry активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб bounded async task concurrency |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби in-memory і persistent-backed dedupe cache |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечного local-file і media-source path |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat wake, event і visibility |
    | `plugin-sdk/number-runtime` | Допоміжний засіб numeric coercion |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби secure token/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби system event queue |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування transport readiness |
    | `plugin-sdk/exec-approvals-runtime` | Допоміжні засоби файлу політики exec approval без широкого infra-runtime barrel |
    | `plugin-sdk/infra-runtime` | Застарілий compatibility shim; використовуйте сфокусовані підшляхи runtime вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби diagnostic flag, event і trace-context |
    | `plugin-sdk/error-runtime` | Error graph, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Допоміжні засоби inline image data URL sanitizer і signature sniffing без широкої поверхні media runtime |
    | `plugin-sdk/response-limit-runtime` | Bounded response-body reader без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без configured binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів config writes/maintenance |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані допоміжні засоби SQLite agent-schema, path і transaction без засобів керування database lifecycle |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання context visibility і фільтрування supplemental context без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби primitive record/string coercion і normalization без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби retry config і retry runner |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби agent dir/identity/workspace, зокрема `resolveAgentDir`, `resolveDefaultAgentDir` і застарілий compatibility export `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Directory query/dedup на базі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання, перетворення та збереження медіа, зокрема `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` і застарілий `fetchRemoteMedia`; віддавайте перевагу допоміжним засобам сховища перед читанням буфера, коли URL має стати медіа OpenClaw |
    | `plugin-sdk/media-mime` | Вузька нормалізація MIME, зіставлення розширень файлів, визначення MIME та допоміжні засоби для типів медіа |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби медіасховища, як-от `saveMediaBuffer` і `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів для зображень, аудіо та структурованого витягання, орієнтовані на провайдерів |
    | `plugin-sdk/text-chunking` | Допоміжні засоби поділу й рендерингу тексту та markdown, перетворення таблиць markdown, видалення тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб поділу вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також експорти директив, реєстру, валідації, OpenAI-сумісного конструктора TTS і допоміжних засобів мовлення, орієнтовані на провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, реєстр, директиви, нормалізація та експорти допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Допоміжний засіб початкового завантаження профілю реального часу для обмеженого впровадження контексту `IDENTITY.md`, `USER.md` і `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі, допоміжні засоби реєстру та спільні допоміжні засоби поведінки голосу в реальному часі, зокрема відстеження активності виводу |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби URL для графічних ресурсів/даних зображень і OpenAI-сумісний конструктор провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера, запиту та результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на модель |
    | `plugin-sdk/video-generation` | Типи провайдера, запиту та результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби резервного перемикання, пошук провайдера та розбір посилань на модель |
    | `plugin-sdk/transcripts` | Спільні типи провайдерів джерел транскриптів, допоміжні засоби реєстру, дескриптори сеансів і метадані висловлювань |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Застарілий реекспорт сумісності; імпортуйте `zod` безпосередньо з `zod` |
    | `plugin-sdk/testing` | Локальний для репозиторію застарілий barrel сумісності для застарілих тестів OpenClaw. Нові тести репозиторію мають натомість імпортувати сфокусовані локальні тестові підшляхи, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальний для репозиторію мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту мостів тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальні для репозиторію фікстури контрактів нативного адаптера середовища виконання агента для тестів автентифікації, доставки, резервного варіанта, перехоплення інструментів, накладання prompt, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Локальні для репозиторію тестові допоміжні засоби, орієнтовані на канали, для контрактів загальних дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, потоків конфігурації надсилання, mock середовища виконання, проблем статусу, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Локальний для репозиторію спільний набір випадків помилок розв’язання цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Локальні для репозиторію допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, API середовища виконання та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Локальні для репозиторію допоміжні засоби контрактів середовища виконання провайдера, автентифікації, виявлення, onboard, каталогу, майстра, медіаможливостей, політики повторного відтворення, realtime STT live-audio, web-search/fetch і потоку |
    | `plugin-sdk/provider-http-test-mocks` | Локальні для репозиторію opt-in HTTP/auth mock Vitest для тестів провайдерів, що перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Локальні для репозиторію загальні фікстури захоплення середовища виконання CLI, контексту sandbox, автора Skills, повідомлень агента, системних подій, перезавантаження модулів, шляху bundled Plugin, тексту термінала, поділу на фрагменти, auth-token і типізованих випадків |
    | `plugin-sdk/test-node-mocks` | Локальні для репозиторію сфокусовані допоміжні засоби mock для вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня bundled memory-core допоміжних засобів для manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легкі допоміжні засоби реєстру провайдерів embedding пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти базового рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote допоміжні засоби. `registerMemoryEmbeddingProvider` на цій поверхні застарів; використовуйте загальний API провайдера embedding для нових провайдерів. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби середовища виконання CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби основного середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів основного середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для Plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад середовища виконання Active memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled допоміжних засобів">
    Зарезервовані підшляхи SDK для bundled допоміжних засобів — це вузькі поверхні, специфічні для власника,
    для коду bundled Plugin. Вони відстежуються в інвентарі SDK, щоб збірки
    пакетів і псевдоніми залишалися детермінованими, але вони не є загальними API
    для створення Plugin. Нові повторно використовувані контракти хоста мають використовувати загальні підшляхи SDK,
    як-от `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і
    `plugin-sdk/plugin-config-runtime`.

    | Підшлях | Власник і призначення |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Допоміжний засіб bundled Plugin Codex для проєктування конфігурації MCP-сервера користувача в конфігурацію thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Допоміжний засіб bundled Plugin Codex для дзеркалювання нативних субагентів app-server Codex у стан завдання OpenClaw |

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
