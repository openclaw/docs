---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і поверхонь допоміжних функцій
summary: 'Каталог підшляхів Plugin SDK: де розташовані імпорти, згруповані за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:31:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin доступний як набір вузьких публічних підшляхів у
`openclaw/plugin-sdk/`. На цій сторінці наведено часто використовувані підшляхи, згруповані за
призначенням. Згенерований інвентар точок входу компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета є публічною підмножиною
після віднімання локальних для репозиторію тестових/внутрішніх підшляхів, перелічених у
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Мейнтейнери можуть перевіряти
кількість публічних експортів за допомогою `pnpm plugin-sdk:surface`, а активні зарезервовані
допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані зарезервовані
допоміжні експорти провалюють звіт CI замість того, щоб залишатися в публічному SDK як
сплячий суміснісний борг.

Посібник з авторства плагінів див. в [Огляд SDK Plugin](/uk/plugins/sdk-overview).

## Точка входу Plugin

| Підшлях                        | Ключові експорти                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Допоміжні елементи постачальника міграцій, як-от `createMigrationItem`, константи причин, маркери стану елементів, допоміжні засоби редагування та `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Допоміжні засоби міграції під час виконання, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                              |
| `plugin-sdk/health`            | Реєстрація, виявлення, відновлення, вибір, серйозність і типи знахідок перевірок справності Doctor для вбудованих споживачів справності                                               |

### Застаріла сумісність і тестові допоміжні засоби

Застарілі підшляхи залишаються експортованими для старіших плагінів, але новий код має використовувати
сфокусовані підшляхи SDK нижче. Підтримуваний список міститься в
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI відхиляє вбудовані
виробничі імпорти з нього. Широкі барелі, як-от `compat`, `config-types`,
`infra-runtime`, `text-runtime` і `zod`, призначені лише для сумісності. Імпортуйте `zod`
безпосередньо з `zod`.

Підшляхи тестових допоміжних засобів OpenClaw на базі Vitest є лише локальними для репозиторію і більше
не є експортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` і `testing`.

### Зарезервовані допоміжні підшляхи вбудованих плагінів

Ці підшляхи є суміснісними поверхнями, якими володіють відповідні вбудовані
плагіни, а не загальними API SDK: `plugin-sdk/codex-mcp-projection` і
`plugin-sdk/codex-native-task-runtime`. Імпорти розширень між різними власниками блокуються
запобіжниками контракту пакета.

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кешований помічник перевірки JSON Schema для схем, що належать плагінам |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники майстра налаштування, перекладач налаштування, запити allowlist, побудовники стану налаштування |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Застарілий сумісний псевдонім; використовуйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники конфігурації кількох облікових записів/брами дій, помічники резервного стандартного облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису та резервного стандартного значення |
    | `plugin-sdk/account-helpers` | Вузькі помічники списку облікових записів/дій облікового запису |
    | `plugin-sdk/access-groups` | Помічники розбору allowlist груп доступу та редагованої діагностики груп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також побудовники Zod і прямі JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації вбудованих каналів OpenClaw лише для підтримуваних вбудованих плагінів |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонічні ідентифікатори вбудованих/офіційних чат-каналів, а також мітки/псевдоніми форматера для плагінів, яким потрібно розпізнавати текст із префіксом конверта без жорстко закодованої власної таблиці. |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий сумісний псевдонім для схем конфігурації вбудованих каналів |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/перевірки власних команд Telegram із резервним контрактом вбудованого пакета |
    | `plugin-sdk/command-gating` | Вузькі помічники брами авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Застарілий низькорівневий сумісний фасад вхідного потоку каналу. Нові шляхи отримання мають використовувати `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Експериментальний високорівневий runtime-резолвер вхідного потоку каналу та побудовники фактів маршруту для мігрованих шляхів отримання каналів. Надавайте перевагу цьому замість складання ефективних allowlist, allowlist команд і застарілих проєкцій у кожному плагіні. Див. [API вхідного потоку каналу](/uk/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракти життєвого циклу повідомлень, а також параметри конвеєра відповідей, квитанції, live-попередній перегляд/стримінг, помічники життєвого циклу, вихідна ідентичність, планування payload, надійні надсилання та помічники контексту надсилання повідомлень. Див. [API вихідного каналу](/uk/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Застарілий сумісний псевдонім для `plugin-sdk/channel-outbound`, а також застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/channel-message-runtime` | Застарілий сумісний псевдонім для `plugin-sdk/channel-outbound`, а також застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/inbound-envelope` | Спільні помічники побудови вхідного маршруту й конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-inbound` для вхідних runner-ів і предикатів диспетчеризації, а `plugin-sdk/channel-outbound` для помічників доставки повідомлень. |
    | `plugin-sdk/messaging-targets` | Застарілий псевдонім розбору цілей; використовуйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження вихідних медіа та стану розміщених медіа |
    | `plugin-sdk/outbound-send-deps` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу прив’язок потоків і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Помічники прив’язки розмови/потоку, парування та налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Помічник знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Помічники розв’язання політики груп runtime |
    | `plugin-sdk/channel-status` | Спільні помічники знімка/підсумку стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні помічники ухвалення рішень щодо доступу груп |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі сумісні фасади. Використовуйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Вузькі помічники політики захисту direct-DM до криптографії |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові плагіни мають використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв’язання облікового запису Telegram для відстежуваної сумісності власника; нові плагіни мають використовувати інʼєктовані runtime-помічники або загальні підшляхи SDK каналів |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові плагіни мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантичне подання повідомлень, доставка та застарілі помічники інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Спільні вхідні помічники для класифікації подій, побудови контексту, форматування, коренів, debounce, зіставлення згадок, політики згадок і вхідного логування |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі вхідні помічники debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники політики згадок, маркера згадки та тексту згадки без ширшої поверхні вхідного runtime |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Застарілі сумісні фасади. Використовуйте `plugin-sdk/channel-inbound` або `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Помічники дій із повідомленнями каналу, а також застарілі помічники native-схем, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільні помічники нормалізації маршруту, parser-driven розв’язання цілі, перетворення thread-id на рядок, ключів маршруту для дедуплікації/compact, типів розібраних цілей і порівняння маршруту/цілі |
    | `plugin-sdk/channel-targets` | Помічники розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування відгуків/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники контракту секретів, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

Застарілі сімейства помічників каналів залишаються доступними лише для
сумісності з опублікованими плагінами. План вилучення такий: зберігати їх
протягом вікна міграції зовнішніх плагінів, тримати репозиторні/вбудовані
плагіни на `channel-inbound` і `channel-outbound`, а потім вилучити сумісні
підшляхи під час наступного великого очищення SDK. Це стосується старих
сімейств channel message/runtime, channel streaming, direct-DM access,
відокремлених inbound helper, reply-options і pairing-path.

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки runtime-моделі |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для стандартних параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби налаштування локальних/самостійно розміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісних самостійно розміщених провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенду CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Runtime-допоміжні засоби розв’язання API-ключів для provider plugins |
    | `plugin-sdk/provider-oauth-runtime` | Загальні типи callback для OAuth провайдерів, відтворення callback-сторінки, допоміжні засоби PKCE/state, розбір authorization-input, допоміжні засоби закінчення строку дії токенів і допоміжні засоби переривання |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби onboarding/profile-write для API-ключів, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник OAuth auth-result |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, допоміжні засоби імпорту автентифікації OpenAI Codex, застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби provider-endpoint і спільні допоміжні засоби нормалізації model-id |
    | `plugin-sdk/provider-catalog-live-runtime` | Допоміжні засоби live-каталогу моделей провайдера для захищеного виявлення у стилі `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фільтрування model-id, TTL-кеш і статичний fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу провайдера та шви реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби можливостей HTTP/endpoint провайдера, HTTP-помилки провайдера та допоміжні засоби multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/runtime провайдера web-search |
    | `plugin-sdk/embedding-providers` | Загальні типи провайдерів embedding і допоміжні засоби читання, зокрема `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` і `listEmbeddingProviders(...)`; plugins реєструють провайдерів через `api.registerEmbeddingProvider(...)`, щоб забезпечити володіння маніфестом |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` і очищення схем + діагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типи знімків використання провайдера, спільні допоміжні засоби отримання використання та fetchers провайдерів, як-от `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper, сумісність plain-text tool-call і спільні допоміжні засоби wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публічні спільні допоміжні засоби provider stream wrapper, зокрема `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` і stream-утиліти, сумісні з Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, витягування тексту tool-result, перетворення transport message і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch для конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Допоміжні засоби вузького режиму активації групи та розбору команд |
  </Accordion>

Знімки використання провайдера зазвичай повідомляють про одне або кілька quota `windows`, кожне з
міткою, відсотком використання та необов’язковим часом скидання. Провайдери, які надають текст про баланс або
стан облікового запису замість quota windows, які можна скидати, мають повертати
`summary` з порожнім масивом `windows`, а не вигадувати відсотки.
OpenClaw показує цей текст summary у status output; використовуйте `error` лише тоді, коли
usage endpoint завершився помилкою або не повернув придатних даних використання.

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема динамічне форматування меню аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Розв’язання approver і допоміжні засоби same-chat action-auth |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби profile/filter для native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки native approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження адаптера native approval для hot channel entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-допоміжні засоби approval handler; віддавайте перевагу вужчим adapter/gateway швам, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target, account-binding, route-gate, forwarding fallback і приглушення local native exec prompt |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко задані прив’язки approval reaction, payloads reaction prompt, stores reaction target і експорт сумісності для приглушення local native exec prompt |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload для exec/plugin approval reply |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload для exec/plugin approval, routing/runtime допоміжні засоби native approval і допоміжні засоби structured approval display, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби reset для inbound reply dedupe |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native command auth, динамічне форматування меню аргументів і допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для hot channel paths |
    | `plugin-sdk/command-surface` | Нормалізація command-body і допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь secret каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Type-only маніфест інтеграції провайдера SecretRef і preset-контракти для plugins, які публікують зовнішні presets провайдерів secret |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, root-bounded file/path, зокрема записи create-only, sync/async атомарна заміна файлів, sibling temp writes, fallback для переміщення між пристроями, допоміжні засоби private file-store, symlink-parent guards, external-content, редагування чутливого тексту, constant-time порівняння secret і допоміжні засоби secret-collection |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби host allowlist і політики private-network SSRF |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої infra runtime surface |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, SSRF-guarded fetch, SSRF error і SSRF policy |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook request/target і raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби request body size/timeout |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання/журналювання/резервного копіювання/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env середовища виконання, логера, тайм-ауту, повторної спроби та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Загальні допоміжні засоби життєвого циклу завдань і доставки завершення для агентів на основі harness, що використовують видану хостом область завдання |
    | `plugin-sdk/codex-mcp-projection` | Зарезервований комплектний допоміжний засіб Codex для проєктування конфігурації MCP-сервера користувача в конфігурацію потоку Codex; не для сторонніх plugins |
    | `plugin-sdk/codex-native-task-runtime` | Приватний комплектний допоміжний засіб Codex для wiring рідного дзеркала завдань/середовища виконання; не для сторонніх plugins |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку контексту середовища виконання каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` безпосередньо |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати загальні підшляхи SDK безпосередньо |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд Plugin/hook/http/інтерактивної роботи |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику з аргументами та лінивих груп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Спільні ідентифікатори сценаріїв QA живого транспорту, допоміжні засоби базового покриття та допоміжний засіб вибору сценарію |
    | `plugin-sdk/gateway-method-runtime` | Зарезервований допоміжний засіб диспетчеризації методів Gateway для HTTP-маршрутів Plugin, які оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта, готового до event loop, gateway CLI RPC, помилки протоколу gateway і допоміжні засоби patch статусу каналу |
    | `plugin-sdk/config-contracts` | Сфокусована поверхня конфігурації лише для типів для форм конфігурації Plugin, як-от `OpenClawConfig` і типи конфігурації каналу/провайдера |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації Plugin у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Транзакційні допоміжні засоби мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Спільні рядки підказок метаданих доставки інструментів повідомлень |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли комплектна поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на посилання файлів без широкого текстового barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко закодовані прив’язки реакцій схвалення, payload реакції prompt, сховища цілей реакцій і експорт сумісності для локального приглушення рідного prompt виконання |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/Plugin, побудовники approval-capability, допоміжні засоби auth/profile, допоміжні засоби рідної маршрутизації/середовища виконання та форматування шляху структурованого відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби середовища виконання вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби історії відповідей із коротким вікном. Новий код message-turn має використовувати `createChannelHistoryWindow`; нижчорівневі допоміжні засоби map залишаються лише застарілими експортами сумісності |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби workflow сесій (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), обмежені читання тексту нещодавньої стенограми користувача/асистента за ідентичністю сесії, застарілі допоміжні засоби шляху сховища сесій/session-key, читання updated-at і сумісні допоміжні засоби всього сховища/шляху файлу лише для переходу |
    | `plugin-sdk/session-transcript-runtime` | Ідентичність стенограми, допоміжні засоби scoped target/read/write, публікація оновлень, блокування запису та ключі влучань пам’яті стенограми |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані допоміжні засоби схеми агента SQLite, шляхів і транзакцій для first-party середовища виконання |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій стану/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типи keyed-state для sidecar SQLite Plugin плюс централізоване налаштування pragma з’єднання та обслуговування WAL для баз даних, якими володіє Plugin |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сесії/прив’язки акаунта, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення статусу каналу/акаунта, типові значення стану середовища виконання та допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби resolver цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витяг рядкових URL з inputs, подібних до fetch/request |
    | `plugin-sdk/run-command` | Runner команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-plugin` | Визначення простого типізованого Plugin інструмента агента та надання статичних метаданих для генерації маніфесту |
    | `plugin-sdk/tool-payload` | Витяг нормалізованих payload з об’єктів результату tool |
    | `plugin-sdk/tool-send` | Витяг канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/sandbox` | Типи backend пісочниці та допоміжні засоби команд SSH/OpenShell, включно з preflight швидкого провалу exec-команди |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень і приватні безпечні тимчасові робочі простори |
    | `plugin-sdk/logging-core` | Логер підсистеми та допоміжні засоби редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/json-unsafe-integers` | Допоміжні засоби розбору JSON, що зберігають небезпечні цілочисельні літерали як рядки |
    | `plugin-sdk/file-lock` | Допоміжні засоби реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового кешу dedupe |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби середовища виконання/сесії ACP і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легкі допоміжні засоби реєстрації backend ACP і reply-dispatch для plugins, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання прив’язок ACP без імпортів lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації середовища виконання агента |
    | `plugin-sdk/boolean-param` | Читач loose boolean параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання зіставлення небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби початкового налаштування пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, статусу та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації рідних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби bridge інструментів OpenClaw, допоміжні засоби політики інструментів runtime-plan, класифікація terminal outcome, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Застарілий фасад виявлення endpoint, яким володіє провайдер Z.AI; використовуйте публічний API Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Process-local допоміжний засіб async lock для невеликих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеження concurrency асинхронних завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби in-memory кешу dedupe |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain вихідної pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів до локальних файлів і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби пробудження, подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб numeric coercion |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/exec-approvals-runtime` | Допоміжні засоби файлів політики схвалення exec без широкого barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані підшляхи середовища виконання вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорів, подій і trace-context |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer URL inline image data і допоміжні засоби sniffing сигнатур без широкої поверхні media runtime |
    | `plugin-sdk/response-limit-runtime` | Обмежений reader тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації configured binding або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані допоміжні засоби схеми агента SQLite, шляхів і транзакцій без controls життєвого циклу бази даних |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрування supplemental context без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби coercion і нормалізації примітивного record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації повторних спроб і runner повторних спроб |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/робочого простору агента, включно з `resolveAgentDir`, `resolveDefaultAgentDir` і застарілим експортом сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Config-backed запит директорій/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні помічники для отримання/перетворення/збереження медіа, зокрема `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` і застарілий `fetchRemoteMedia`; віддавайте перевагу помічникам сховища перед читанням буферів, коли URL має стати медіа OpenClaw |
    | `plugin-sdk/media-mime` | Вузька нормалізація MIME, зіставлення розширень файлів, виявлення MIME та помічники типів медіа |
    | `plugin-sdk/media-store` | Вузькі помічники медіасховища, як-от `saveMediaBuffer` і `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Спільні помічники резервного перемикання генерації медіа, вибір кандидатів і повідомлення про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти помічників для провайдерів щодо зображень/аудіо/структурованого витягання |
    | `plugin-sdk/text-chunking` | Помічники розбиття/рендерингу тексту й markdown, перетворення таблиць markdown, видалення тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Помічник розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи мовленнєвих провайдерів, а також експорти директив, реєстру, валідації, OpenAI-сумісного збирача TTS і мовленнєвих помічників для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовленнєвих провайдерів, реєстр, директива, нормалізація та експорти мовленнєвих помічників |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, помічники реєстру та спільний помічник сесії WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Помічник початкового завантаження профілю в реальному часі для обмеженого впровадження контексту `IDENTITY.md`, `USER.md` і `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі, помічники реєстру та спільні помічники поведінки голосу в реальному часі, зокрема відстеження активності виводу |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також помічники URL даних/ресурсів зображень і OpenAI-сумісний збирач провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та помічники реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, помічники резервного перемикання, пошук провайдера та розбір посилань на модель |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, помічники резервного перемикання, пошук провайдера та розбір посилань на модель |
    | `plugin-sdk/transcripts` | Спільні типи провайдерів джерел транскриптів, помічники реєстру, дескриптори сесій і метадані висловлювань |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і помічники встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Спільні помічники завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Застарілий реекспорт сумісності; імпортуйте `zod` напряму з `zod` |
    | `plugin-sdk/testing` | Локальний для репозиторію застарілий barrel сумісності для застарілих тестів OpenClaw. Нові тести репозиторію мають натомість імпортувати сфокусовані локальні тестові підшляхи, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальний для репозиторію мінімальний помічник `createTestPluginApi` для модульних тестів прямої реєстрації Plugin без імпорту містків тестових помічників репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальні для репозиторію фікстури контрактів нативного адаптера agent-runtime для тестів автентифікації, доставлення, резервного режиму, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Локальні для репозиторію тестові помічники, орієнтовані на канали, для контрактів загальних дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, потоків send-config, моків runtime, проблем статусу, вихідного доставлення та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Локальний для репозиторію спільний набір тестів випадків помилок визначення цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Локальні для репозиторію помічники контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Локальні для репозиторію помічники контрактів runtime провайдера, автентифікації, виявлення, onboarding, каталогу, майстра, можливостей медіа, політики replay, STT live-audio в реальному часі, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Локальні для репозиторію opt-in HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Локальні для репозиторію загальні фікстури захоплення runtime CLI, контексту sandbox, записувача skill, agent-message, system-event, перезавантаження модуля, шляху bundled Plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Локальні для репозиторію сфокусовані помічники моків вбудованих засобів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня помічників bundled memory-core для помічників менеджера/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легкі помічники реєстру провайдерів embedding пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote помічники. `registerMemoryEmbeddingProvider` на цій поверхні застарілий; для нових провайдерів використовуйте загальний API провайдера embedding. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Помічники secret хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Помічники статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помічники CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Помічники core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Помічники file/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Вендорно-нейтральний псевдонім для помічників core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Вендорно-нейтральний псевдонім для помічників журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Спільні помічники managed-markdown для суміжних із пам’яттю Plugin |
    | `plugin-sdk/memory-host-search` | Фасад runtime активної пам’яті для доступу search-manager |
    | `plugin-sdk/memory-host-status` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Зарезервовані підшляхи SDK bundled-helper — це вузькі поверхні, специфічні для власника, для
    bundled коду Plugin. Їх відстежують в інвентарі SDK, щоб збірки
    пакетів і aliasing залишалися детермінованими, але це не загальні API
    для створення Plugin. Нові повторно використовувані контракти хоста мають використовувати загальні підшляхи SDK,
    як-от `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і
    `plugin-sdk/plugin-config-runtime`.

    | Підшлях | Власник і призначення |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Помічник bundled Plugin Codex для проєктування конфігурації MCP-сервера користувача в конфігурацію потоку Codex app-server |
    | `plugin-sdk/codex-native-task-runtime` | Помічник bundled Plugin Codex для віддзеркалення нативних subagents Codex app-server у стан задач OpenClaw |

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
