---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів SDK Plugin: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:23:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK надається як набір вузьких публічних підшляхів у
`openclaw/plugin-sdk/`. На цій сторінці наведено поширені підшляхи, згруповані за
призначенням. Згенерований інвентар точок входу компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета є публічною підмножиною
після вилучення локальних для репозиторію тестових/внутрішніх підшляхів,
перелічених у `scripts/lib/plugin-sdk-private-local-only-subpaths.json`.
Супровідники можуть перевірити кількість публічних експортів за допомогою
`pnpm plugin-sdk:surface`, а активні зарезервовані підшляхи допоміжних засобів —
за допомогою `pnpm plugins:boundary-report:summary`; невикористані зарезервовані
експорти допоміжних засобів провалюють звіт CI замість того, щоб залишатися в
публічному SDK як неактивний борг сумісності.

Посібник зі створення Plugin див. у [огляді Plugin SDK](/uk/plugins/sdk-overview).

## Точка входу Plugin

| Підшлях                       | Ключові експорти                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Допоміжні засоби елементів постачальника міграції, як-от `createMigrationItem`, константи причин, маркери стану елементів, допоміжні засоби редагування та `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Допоміжні засоби міграції під час виконання, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                               |
| `plugin-sdk/health`            | Реєстрація, виявлення, виправлення, вибір, серйозність і типи знахідок перевірок справності Doctor для вбудованих споживачів справності                               |

### Застарілі допоміжні засоби сумісності та тестування

Застарілі підшляхи залишаються експортованими для старіших plugins, але новий код
має використовувати спеціалізовані підшляхи SDK нижче. Підтримуваний список
міститься в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI відхиляє
виробничі імпорти вбудованих компонентів із нього. Широкі барелі, як-от `compat`,
`config-types`, `infra-runtime`, `text-runtime` і `zod`, призначені лише для
сумісності. Імпортуйте `zod` безпосередньо з `zod`.

Підшляхи тестових допоміжних засобів OpenClaw на базі Vitest є лише локальними
для репозиторію і більше не є експортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` і `testing`.

### Зарезервовані підшляхи допоміжних засобів вбудованих plugins

Ці підшляхи є поверхнями сумісності, що належать plugins для відповідного
вбудованого Plugin, а не загальними API SDK: `plugin-sdk/codex-mcp-projection` і
`plugin-sdk/codex-native-task-runtime`. Імпорти розширень між різними власниками
блокуються обмеженнями контракту пакета.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої схеми Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Допоміжний засіб кешованої валідації JSON Schema для схем, що належать plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, транслятор налаштування, запити списку дозволених, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації кількох облікових записів і шлюзу дій, допоміжні засоби резервного використання облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису та резервного використання значення за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби списку облікових записів і дій з обліковими записами |
    | `plugin-sdk/access-groups` | Допоміжні засоби розбору списку дозволених для груп доступу та редагованої діагностики груп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також побудовники Zod і прямі побудовники JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації каналів OpenClaw у комплекті лише для підтримуваних plugins у комплекті |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонічні ідентифікатори чат-каналів у комплекті/офіційних чат-каналів, а також мітки/псевдоніми форматера для plugins, яким потрібно розпізнавати текст із префіксом конверта без жорстко закодованої власної таблиці. |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації каналів у комплекті |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервним використанням контракту комплекту |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Застарілий низькорівневий фасад сумісності вхідних даних каналу. Нові шляхи приймання мають використовувати `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Експериментальний високорівневий runtime-розв’язувач вхідних даних каналу та побудовники фактів маршруту для мігрованих шляхів приймання каналу. Віддавайте перевагу цьому замість збирання ефективних списків дозволених, списків дозволених команд і застарілих проєкцій у кожному plugin. Див. [API вхідних даних каналу](/uk/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракти життєвого циклу повідомлень, а також параметри конвеєра відповідей, квитанції, попередній перегляд/стримінг наживо, допоміжні засоби життєвого циклу, вихідна ідентичність, планування payload, довговічні надсилання та допоміжні засоби контексту надсилання повідомлень. Див. [API вихідних даних каналу](/uk/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Застарілий псевдонім сумісності для `plugin-sdk/channel-outbound` плюс застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/channel-message-runtime` | Застарілий псевдонім сумісності для `plugin-sdk/channel-outbound` плюс застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби побудови вхідного маршруту та конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-inbound` для вхідних runner і предикатів диспетчеризації, а `plugin-sdk/channel-outbound` — для допоміжних засобів доставлення повідомлень. |
    | `plugin-sdk/messaging-targets` | Застарілий псевдонім розбору цілей; використовуйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа та стану розміщених медіа |
    | `plugin-sdk/outbound-send-deps` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язування розмов/потоків, спарювання та налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка runtime-конфігурації |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання runtime-політики груп |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/зведення статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації списку дозволених |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби ухвалення рішень щодо доступу груп |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі фасади сумісності. Використовуйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Вузькі допоміжні засоби політики захисту прямих DM до криптографії |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові plugins мають використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв’язання облікових записів Telegram для відстежуваної сумісності власника; нові plugins мають використовувати інжектовані runtime-допоміжні засоби або загальні підшляхи SDK каналів |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові plugins мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставлення та застарілі допоміжні засоби інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Спільні вхідні допоміжні засоби для класифікації подій, побудови контексту, форматування, коренів, debounce, зіставлення згадок, політики згадок і вхідного логування |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce для вхідних даних |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркера згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Застарілі фасади сумісності. Використовуйте `plugin-sdk/channel-inbound` або `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій з повідомленнями каналу, а також застарілі допоміжні засоби нативної схеми, збережені для сумісності plugin |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршруту, розв’язання цілей на основі парсера, перетворення thread-id на рядок, dedupe/компактні ключі маршрутів, типи розібраних цілей і допоміжні засоби порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; викликачі порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Під’єднання feedback/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби контракту секретів, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

Застарілі сімейства допоміжних засобів каналів залишаються доступними лише для
сумісності з опублікованими Plugin. План вилучення такий: зберігати їх протягом
періоду міграції зовнішніх Plugin, тримати репозиторні/вбудовані Plugin на `channel-inbound` і
`channel-outbound`, а потім вилучити підшляхи сумісності під час наступного великого
очищення SDK. Це стосується старих сімейств повідомлень/середовища виконання каналів,
потокового передавання каналів, доступу до прямих DM, відокремлених вхідних допоміжних засобів, reply-options
і pairing-path.

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад середовища виконання LM Studio для локальних стандартних значень сервера, виявлення моделей, заголовків запитів і допоміжних засобів завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Стандартні значення бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключів під час виконання для Plugin провайдерів |
    | `plugin-sdk/provider-oauth-runtime` | Загальні типи OAuth callback провайдерів, рендеринг callback-сторінки, допоміжні засоби PKCE/state, розбір authorization-input, допоміжні засоби закінчення строку дії токенів і допоміжні засоби переривання |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби onboarding/API-key запису профілів, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний будівник результату автентифікації OAuth |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env-var автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, допоміжні засоби імпорту автентифікації OpenAI Codex, застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні будівники replay-policy, допоміжні засоби provider-endpoint і спільні допоміжні засоби нормалізації model-id |
    | `plugin-sdk/provider-catalog-live-runtime` | Допоміжні засоби live-каталогу моделей провайдера для захищеного виявлення у стилі `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фільтрування model-id, TTL-кеш і статичний fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtime hook доповнення каталогу провайдера та шви реєстру plugin-provider для contract tests |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/endpoint capabilities провайдера, HTTP-помилки провайдера та допоміжні засоби multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту config/selection для web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credential для web-search у провайдерів, яким не потрібне з'єднання plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту config/credential для web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped credential setters/getters |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/runtime для provider web-search |
    | `plugin-sdk/embedding-providers` | Загальні типи embedding-провайдерів і допоміжні засоби читання, зокрема `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` і `listEmbeddingProviders(...)`; Plugin реєструють провайдерів через `api.registerEmbeddingProvider(...)`, щоб забезпечити право власності manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` і очищення схем + діагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типи snapshot використання провайдера, спільні допоміжні засоби отримання usage і provider fetchers, як-от `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper, сумісність plain-text tool-call і спільні допоміжні засоби wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публічні спільні допоміжні засоби provider stream wrapper, зокрема `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` і stream-утиліти, сумісні з Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби native provider transport, як-от захищений fetch, видобування тексту tool-result, перетворення transport message і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch для onboarding config |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму group activation і розбору команд |
  </Accordion>

Snapshots використання провайдера зазвичай повідомляють одне або кілька quota `windows`, кожне з
міткою, використаним відсотком і необов'язковим часом скидання. Провайдери, які надають текст балансу або
account-state замість quota windows зі скиданням, мають повертати
`summary` з порожнім масивом `windows`, а не вигадувати відсотки.
OpenClaw показує цей summary text у status output; використовуйте `error` лише тоді, коли
usage endpoint завершився невдало або не повернув придатних даних usage.

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Будівники command/help message, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і same-chat action-auth |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native approval capability/delivery adapters |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб approval gateway-resolution |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження native approval adapter для hot channel entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби approval handler runtime; надавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Native approval target, account-binding, route-gate, forwarding fallback і допоміжні засоби придушення local native exec prompt |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко закодовані прив'язки approval reaction, payloads reaction prompt, сховища reaction target і експорт сумісності для придушення local native exec prompt |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload для відповіді exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload для exec/plugin approval, допоміжні засоби native approval routing/runtime і допоміжні засоби structured approval display, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання inbound reply dedupe |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби channel contract test без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native command auth, форматування меню динамічних аргументів і допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати command text для hot channel paths |
    | `plugin-sdk/command-surface` | Нормалізація command-body і допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для secret surfaces каналів/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef provider integration manifest і preset contracts для Plugin, які публікують зовнішні secret provider presets |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби trust, DM gating, root-bounded file/path, зокрема create-only writes, sync/async atomic file replacement, sibling temp writes, cross-device move fallback, private file-store helpers, symlink-parent guards, external-content, редагування sensitive text, constant-time secret comparison і допоміжні засоби secret-collection |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби host allowlist і private-network SSRF policy |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої infra runtime surface |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF error і допоміжні засоби SSRF policy |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook request/target і raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби request body size/timeout |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання/журналювання/резервного копіювання/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env середовища виконання, logger, timeout, retry та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованих profile/defaults, розбору CDP URL і допоміжних засобів auth для керування браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Узагальнені допоміжні засоби життєвого циклу завдань і доставки завершення для агентів на основі harness, які використовують видану host область завдання |
    | `plugin-sdk/codex-mcp-projection` | Зарезервований вбудований допоміжний засіб Codex для проєктування конфігурації MCP-сервера користувача в конфігурацію thread Codex; не для сторонніх plugins |
    | `plugin-sdk/codex-native-task-runtime` | Приватний вбудований допоміжний засіб Codex для native task mirror/runtime wiring; не для сторонніх plugins |
    | `plugin-sdk/channel-runtime-context` | Узагальнені допоміжні засоби реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` напряму |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати узагальнені підшляхи SDK напряму |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби command/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби ледачого імпорту/прив’язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI для форматування, очікування, версії, argument-invocation і ледачих груп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Спільні ідентифікатори сценаріїв QA live transport, допоміжні засоби baseline coverage і допоміжний засіб вибору сценарію |
    | `plugin-sdk/gateway-method-runtime` | Зарезервований допоміжний засіб диспетчеризації методів Gateway для HTTP-маршрутів plugin, які оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта, готового до event loop, gateway CLI RPC, помилки протоколу gateway, визначення рекламованого LAN host і допоміжні засоби patch статусу каналу |
    | `plugin-sdk/config-contracts` | Сфокусована type-only поверхня конфігурації для форм конфігурації plugin, як-от `OpenClawConfig` і типи конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку plugin-config у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Транзакційні допоміжні засоби мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Спільні рядки підказок метаданих доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і setters знімків для тестів |
    | `plugin-sdk/telegram-command-config` | Нормалізація command-name/description Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для посилань на файли без широкого text barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко закодовані прив’язки реакцій схвалення, payloads підказок реакцій, сховища цілей реакцій і експорт сумісності для локального придушення підказок native exec |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/plugin, побудовники approval-capability, допоміжні засоби auth/profile, допоміжні засоби native routing/runtime і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні inbound/reply допоміжні засоби середовища виконання, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповідей і conversation-label |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби історії відповідей для короткого вікна. Новий код message-turn має використовувати `createChannelHistoryWindow`; нижчерівневі map helpers залишаються лише застарілими експортами сумісності |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking для text/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби workflow сесій (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), обмежені читання тексту нещодавньої user/assistant transcript за ідентичністю сесії, застарілі допоміжні засоби path/session-key сховища сесій, читання updated-at і transition-only допоміжні засоби сумісності whole-store/file-path |
    | `plugin-sdk/session-transcript-runtime` | Ідентичність transcript, scoped допоміжні засоби target/read/write, публікація оновлень, блокування запису й ключі transcript memory hit |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані допоміжні засоби SQLite для agent-schema, path і транзакцій для first-party середовища виконання |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби path/load/save сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів dir State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типи keyed-state SQLite sidecar plugin плюс централізоване налаштування connection pragma та обслуговування WAL для баз даних, якими володіє plugin |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язування route/session-key/account, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку статусу channel/account, стандартні значення runtime-state і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби resolver цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/string |
    | `plugin-sdk/request-url` | Витяг рядкових URL з inputs, подібних до fetch/request |
    | `plugin-sdk/run-command` | Засіб запуску команд із таймаутом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні readers параметрів tool/CLI |
    | `plugin-sdk/tool-plugin` | Визначення простого типізованого agent-tool plugin і відкриття статичних метаданих для генерації manifest |
    | `plugin-sdk/tool-payload` | Витяг нормалізованих payloads з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витяг канонічних полів цілі надсилання з args tool |
    | `plugin-sdk/sandbox` | Типи backend sandbox і допоміжні засоби команд SSH/OpenShell, включно з fail-fast preflight команди exec |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів temp-download і приватні secure temp workspaces |
    | `plugin-sdk/logging-core` | Logger підсистеми й допоміжні засоби редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби override model/session, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби визначення конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/json-unsafe-integers` | Допоміжні засоби розбору JSON, які зберігають unsafe integer literals як рядки |
    | `plugin-sdk/file-lock` | Re-entrant допоміжні засоби file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового dedupe cache |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легковагі допоміжні засоби реєстрації backend ACP і reply-dispatch для plugins, завантажених під час startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only визначення ACP binding без імпортів lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | Вузькі primitives config-schema середовища виконання агента |
    | `plugin-sdk/boolean-param` | Loose reader boolean param |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів dangerous-name |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби device bootstrap і pairing token |
    | `plugin-sdk/extension-shared` | Спільні primitives допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді command/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби listing команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби registry/build/serialize для native command |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, допоміжні засоби steer/abort для active-run, допоміжні засоби bridge OpenClaw tool, допоміжні засоби policy для runtime-plan tool, класифікація terminal outcome, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Застарілий фасад виявлення endpoint, яким володіє провайдер Z.AI; використовуйте публічний API plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб telemetry активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб bounded async task concurrency |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби in-memory dedupe cache |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби wake, event і visibility для Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб numeric coercion |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби secure token/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби queue системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності transport |
    | `plugin-sdk/exec-approvals-runtime` | Допоміжні засоби файлів policy для exec approval без широкого infra-runtime barrel |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані підшляхи середовища виконання вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби diagnostic flag, event і trace-context |
    | `plugin-sdk/error-runtime` | Error graph, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer inline image data URL і допоміжні засоби signature sniffing без широкої media runtime surface |
    | `plugin-sdk/response-limit-runtime` | Bounded reader response-body без широкої media runtime surface |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язування conversation без configured binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів config writes/maintenance |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані допоміжні засоби SQLite для agent-schema, path і транзакцій без засобів керування lifecycle бази даних |
    | `plugin-sdk/context-visibility-runtime` | Визначення context visibility і фільтрація supplemental context без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби primitive record/string coercion і normalization без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби retry config і retry runner |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби agent dir/identity/workspace, включно з `resolveAgentDir`, `resolveDefaultAgentDir` і застарілим експортом сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація directory на основі config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби отримання, перетворення й збереження медіа, зокрема `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` і застарілий `fetchRemoteMedia`; віддавайте перевагу допоміжним засобам сховища перед читанням буферів, коли URL має стати медіа OpenClaw |
    | `plugin-sdk/media-mime` | Вузька нормалізація MIME, зіставлення розширень файлів, виявлення MIME і допоміжні засоби типу медіа |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби медіасховища, як-от `saveMediaBuffer` і `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби відмовостійкості генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи постачальників розуміння медіа, а також експорти допоміжних засобів для зображень, аудіо та структурованого видобування, орієнтовані на постачальників |
    | `plugin-sdk/text-chunking` | Допоміжні засоби розбиття й рендерингу тексту та markdown, перетворення markdown-таблиць, видалення тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи постачальників мовлення, а також експорти директив, реєстру, валідації, сумісного з OpenAI конструктора TTS і допоміжних засобів мовлення, орієнтовані на постачальників |
    | `plugin-sdk/speech-core` | Спільні типи постачальників мовлення, реєстр, директива, нормалізація й експорти допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи постачальників транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Допоміжний засіб початкового завантаження профілю реального часу для обмеженого впровадження контексту `IDENTITY.md`, `USER.md` і `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типи постачальників голосу в реальному часі, допоміжні засоби реєстру та спільні допоміжні засоби поведінки голосу в реальному часі, зокрема відстеження вихідної активності |
    | `plugin-sdk/image-generation` | Типи постачальників генерації зображень, а також допоміжні засоби URL зображувальних ресурсів/даних і сумісний з OpenAI конструктор постачальника зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, відмовостійкість, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи постачальника, запиту та результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби відмовостійкості, пошук постачальника та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи постачальника, запиту та результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби відмовостійкості, пошук постачальника та розбір посилань на моделі |
    | `plugin-sdk/transcripts` | Спільні типи постачальників джерел транскриптів, допоміжні засоби реєстру, дескриптори сесій і метадані висловлювань |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Застарілий реекспорт сумісності; імпортуйте `zod` із `zod` безпосередньо |
    | `plugin-sdk/testing` | Репозиторійно-локальний застарілий барель сумісності для застарілих тестів OpenClaw. Нові тести репозиторію мають натомість імпортувати сфокусовані локальні тестові підшляхи, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Репозиторійно-локальний мінімальний допоміжний засіб `createTestPluginApi` для модульних тестів прямої реєстрації plugin без імпорту мостів тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Репозиторійно-локальні фікстури контрактів нативного адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схеми та проєкції транскриптів |
    | `plugin-sdk/channel-test-helpers` | Репозиторійно-локальні тестові допоміжні засоби, орієнтовані на канали, для контрактів загальних дій/налаштування/статусу, тверджень щодо каталогів, життєвого циклу запуску облікового запису, потоків send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Репозиторійно-локальний спільний набір випадків помилок розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Репозиторійно-локальні допоміжні засоби контрактів пакета plugin, реєстрації, публічного артефакту, прямого імпорту, API runtime і побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Репозиторійно-локальні допоміжні засоби контрактів runtime постачальника, автентифікації, виявлення, onboard, каталогу, майстра, медіаможливостей, політики replay, realtime STT live-audio, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Репозиторійно-локальні opt-in HTTP/Auth моки Vitest для тестів постачальників, що перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Репозиторійно-локальні загальні фікстури захоплення runtime CLI, sandbox-контексту, записувача skill, agent-message, system-event, перезавантаження модуля, шляху до bundled plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Репозиторійно-локальні сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для допоміжних засобів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime для індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-embedding-registry` | Полегшені допоміжні засоби реєстру постачальників embedding пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundational-рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний постачальник і загальні batch/remote допоміжні засоби. `registerMemoryEmbeddingProvider` на цій поверхні застарів; використовуйте загальний API постачальника embedding для нових постачальників. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD-рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Вендорно-нейтральний псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Вендорно-нейтральний псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime активної пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled допоміжних засобів">
    Зарезервовані підшляхи SDK bundled допоміжних засобів — це вузькі
    поверхні, специфічні для власників, для коду bundled plugin. Вони
    відстежуються в інвентарі SDK, щоб складання пакетів і псевдоніми
    залишалися детермінованими, але це не загальні API для створення
    plugin. Нові повторно використовувані контракти хоста мають
    використовувати загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

    | Підшлях | Власник і призначення |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Допоміжний засіб bundled Codex plugin для проєктування конфігурації MCP-сервера користувача в конфігурацію потоку app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Допоміжний засіб bundled Codex plugin для віддзеркалення нативних субагентів app-server Codex у стан задач OpenClaw |

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
