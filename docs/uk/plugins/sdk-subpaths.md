---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту плагіна
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Plugin SDK підшляхи
x-i18n:
    generated_at: "2026-07-01T20:35:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin доступний як набір вузьких публічних підшляхів у
`openclaw/plugin-sdk/`. На цій сторінці каталогізовано поширені підшляхи,
згруповані за призначенням. Згенерований інвентар точок входу компілятора
міститься в `scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета є
публічною підмножиною після віднімання локальних для репозиторію тестових і
внутрішніх підшляхів, перелічених у
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Мейнтейнери можуть
перевіряти кількість публічних експортів за допомогою `pnpm plugin-sdk:surface`
і активні зарезервовані підшляхи допоміжних модулів за допомогою
`pnpm plugins:boundary-report:summary`; невикористані зарезервовані експорти
допоміжних модулів спричиняють збій звіту CI, а не залишаються в публічному SDK
як неактивний борг сумісності.

Посібник з розробки Plugin див. у [огляді SDK Plugin](/uk/plugins/sdk-overview).

## Точка входу Plugin

| Підшлях                       | Ключові експорти                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`     | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`             | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`    | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`   | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`        | Допоміжні модулі елементів постачальника міграцій, як-от `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні модулі редагування та `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Допоміжні модулі міграцій під час виконання, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                |
| `plugin-sdk/health`           | Реєстрація перевірок справності Doctor, виявлення, виправлення, вибір, серйозність і типи знахідок для вбудованих споживачів справності                                |

### Застаріла сумісність і тестові допоміжні модулі

Застарілі підшляхи залишаються експортованими для старіших Plugin, але новий код
має використовувати наведені нижче сфокусовані підшляхи SDK. Підтримуваний
список міститься в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI
відхиляє виробничі імпорти з нього у вбудованих модулях. Широкі агрегувальні
експорти, як-от `compat`, `config-types`, `infra-runtime`, `text-runtime` і
`zod`, призначені лише для сумісності. Імпортуйте `zod` безпосередньо з `zod`.

Підшляхи тестових допоміжних модулів OpenClaw на базі Vitest є лише локальними
для репозиторію й більше не є експортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` і `testing`.

### Зарезервовані підшляхи допоміжних модулів вбудованих Plugin

Ці підшляхи є поверхнями сумісності, що належать Plugin, для відповідних
вбудованих Plugin, а не загальними API SDK: `plugin-sdk/codex-mcp-projection` і
`plugin-sdk/codex-native-task-runtime`. Імпорти розширень між власниками
блокуються запобіжниками контракту пакета.

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої схеми Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кешований помічник перевірки JSON Schema для схем, що належать Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники майстра налаштування, перекладач налаштування, запити списку дозволених, збирачі статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Застарілий сумісний псевдонім; використовуйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники конфігурації кількох облікових записів і шлюзу дій, помічники резервного варіанта облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису та резервного варіанта за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі помічники списку облікових записів і дій облікового запису |
    | `plugin-sdk/access-groups` | Помічники розбору списку дозволених груп доступу та редагованої діагностики груп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також збирачі Zod і прямі JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації каналів OpenClaw у комплекті лише для підтримуваних комплектних Plugin |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонічні ідентифікатори комплектних/офіційних чат-каналів, а також мітки/псевдоніми форматера для Plugin, яким потрібно розпізнавати текст із префіксом конверта без жорстко закодованої власної таблиці. |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий сумісний псевдонім для схем конфігурації комплектних каналів |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/перевірки користувацьких команд Telegram із резервним варіантом за комплектним контрактом |
    | `plugin-sdk/command-gating` | Вузькі помічники шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Застарілий низькорівневий сумісний фасад вхідного потоку каналу. Нові шляхи отримання мають використовувати `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Експериментальний високорівневий резолвер runtime вхідного потоку каналу та збирачі фактів маршруту для мігрованих шляхів отримання каналом. Надавайте перевагу цьому замість збирання ефективних списків дозволених, списків дозволених команд і застарілих проєкцій у кожному Plugin. Див. [API вхідного потоку каналу](/uk/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракти життєвого циклу повідомлень, а також параметри конвеєра відповідей, квитанції, живий попередній перегляд/стримінг, помічники життєвого циклу, вихідна ідентичність, планування payload, довговічні надсилання та помічники контексту надсилання повідомлень. Див. [API вихідного потоку каналу](/uk/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Застарілий сумісний псевдонім для `plugin-sdk/channel-outbound` плюс застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/channel-message-runtime` | Застарілий сумісний псевдонім для `plugin-sdk/channel-outbound` плюс застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/inbound-envelope` | Спільні помічники вхідного маршруту та збирача конвертів |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-inbound` для вхідних виконавців і предикатів диспетчеризації, а `plugin-sdk/channel-outbound` для помічників доставки повідомлень. |
    | `plugin-sdk/messaging-targets` | Застарілий псевдонім розбору цілей; використовуйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження вихідних медіа та стану розміщених медіа |
    | `plugin-sdk/outbound-send-deps` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу прив’язок потоків і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий збирач payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Прив’язка розмов/потоків, поєднання та помічники налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Помічник знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Помічники розв’язання runtime політики груп |
    | `plugin-sdk/channel-status` | Спільні помічники знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання конфігурації списку дозволених |
    | `plugin-sdk/group-access` | Спільні помічники рішень доступу груп |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі сумісні фасади. Використовуйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Вузькі помічники політики захисту direct-DM до криптографії |
    | `plugin-sdk/discord` | Застарілий сумісний фасад Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові Plugin мають використовувати загальні підшляхи SDK каналу |
    | `plugin-sdk/telegram-account` | Застарілий сумісний фасад розв’язання облікових записів Telegram для відстежуваної сумісності власника; нові Plugin мають використовувати інжектовані помічники runtime або загальні підшляхи SDK каналу |
    | `plugin-sdk/zalouser` | Застарілий сумісний фасад Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові Plugin мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантична презентація повідомлень, доставка та застарілі помічники інтерактивних відповідей. Див. [Презентація повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Спільні вхідні помічники для класифікації подій, побудови контексту, форматування, коренів, debounce, зіставлення згадок, політики згадок і вхідного логування |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі помічники debounce для вхідного потоку |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники політики згадок, маркера згадки та тексту згадки без ширшої поверхні runtime вхідного потоку |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Застарілі сумісні фасади. Використовуйте `plugin-sdk/channel-inbound` або `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Застарілий сумісний фасад. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Помічники дій повідомлень каналу, а також застарілі помічники нативної схеми, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршрутів, розв’язання цілей на основі парсера, перетворення thread-id на рядок, ключі маршрутів для дедуплікації/стиснення, типи розібраних цілей і помічники порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Помічники розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Підключення відгуків/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники контрактів секретів, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

Застарілі сімейства помічників каналів залишаються доступними лише для
сумісності з опублікованими Plugin. План видалення такий: зберігати їх протягом
вікна міграції зовнішніх Plugin, тримати репозиторій/комплектні Plugin на
`channel-inbound` і `channel-outbound`, а потім видалити сумісні підшляхи під час
наступного великого очищення SDK. Це стосується старих сімейств channel
message/runtime, channel streaming, direct-DM access, фрагментованих вхідних
помічників, reply-options і pairing-path.

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для стандартних параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісних self-hosted провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime для визначення API-ключів у провайдерських plugins |
    | `plugin-sdk/provider-oauth-runtime` | Узагальнені типи OAuth-callback для провайдерів, рендеринг сторінки callback, допоміжні засоби PKCE/state, розбір authorization-input, допоміжні засоби завершення строку дії токенів і допоміжні засоби переривання |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби onboarding/profile-write для API-ключів, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор OAuth auth-result |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env-var для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, допоміжні засоби імпорту автентифікації OpenAI Codex, застарілий сумісний експорт `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби provider-endpoint і спільні допоміжні засоби нормалізації model-id |
    | `plugin-sdk/provider-catalog-live-runtime` | Допоміжні засоби live-каталогу моделей провайдера для захищеного виявлення у стилі `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фільтрація model-id, кеш TTL і статичний fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу провайдера та межі реєстру plugin-provider для contract-тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Узагальнені допоміжні засоби HTTP/endpoint capability для провайдерів, HTTP-помилки провайдера та допоміжні засоби multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту config/selection для web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби registration/cache для web-fetch провайдера |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credential для web-search у провайдерах, яким не потрібне підключення plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту config/credential для web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped credential setters/getters |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби registration/cache/runtime для web-search провайдера |
    | `plugin-sdk/embedding-providers` | Загальні типи провайдерів embeddings і допоміжні засоби читання, зокрема `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` і `listEmbeddingProviders(...)`; plugins реєструють провайдерів через `api.registerEmbeddingProvider(...)`, щоб забезпечувати володіння manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` і очищення схем + діагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типи знімків використання провайдера, спільні допоміжні засоби отримання використання та fetchers провайдерів, як-от `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper, сумісність plain-text tool-call і спільні допоміжні засоби wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публічні спільні допоміжні засоби provider stream wrapper, зокрема `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` і stream-утиліти, сумісні з Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби native provider transport, як-от захищений fetch, витягування тексту tool-result, перетворення transport-повідомлень і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch для onboarding config |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму group activation і розбору команд |
  </Accordion>

Знімки використання провайдера зазвичай повідомляють про одне або кілька quota `windows`, кожне з
міткою, використаним відсотком і необов’язковим часом скидання. Провайдери, які надають текст балансу або
стану облікового запису замість скиданих quota windows, мають повертати
`summary` з порожнім масивом `windows`, а не вигадувати відсотки.
OpenClaw показує цей текст summary у status output; використовуйте `error` лише тоді, коли
usage endpoint завершився помилкою або не повернув придатних даних про використання.

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби sender-authorization |
    | `plugin-sdk/command-status` | Конструктори повідомлень command/help, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і same-chat action-auth |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби native exec approval profile/filter |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери native approval capability/delivery |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб approval gateway-resolution |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження native approval adapter для гарячих channel entrypoints |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-допоміжні засоби approval handler; віддавайте перевагу вужчим adapter/gateway межам, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target, account-binding, route-gate, forwarding fallback і придушення local native exec prompt |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко закодовані прив’язки approval reaction, payloads reaction prompt, сховища reaction target і сумісний експорт для придушення local native exec prompt |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload для exec/plugin approval reply |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload для exec/plugin approval, native approval routing/runtime і структуровані допоміжні засоби відображення approval, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання inbound reply dedupe |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби contract-тестів каналів без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native command auth, форматування меню динамічних аргументів і допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати command text для гарячих channel paths |
    | `plugin-sdk/command-surface` | Нормалізація command-body і допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Lazy-допоміжні засоби provider auth login flow для private channel і Web UI device-code pairing |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для channel/plugin secret surfaces |
    | `plugin-sdk/secret-ref-runtime` | Вузькі `coerceSecretRef` і допоміжні засоби типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef provider integration manifest і preset contracts для plugins, що публікують зовнішні secret provider presets |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби trust, DM gating, root-bounded file/path, зокрема create-only writes, sync/async atomic file replacement, sibling temp writes, cross-device move fallback, private file-store helpers, symlink-parent guards, external-content, редагування чутливого тексту, constant-time secret comparison і допоміжні засоби secret-collection |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби host allowlist і private-network SSRF policy |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF error і допоміжні засоби SSRF policy |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Webhook request/target helpers і raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби request body size/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі помічники runtime, журналювання, резервного копіювання та встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі помічники env runtime, logger, timeout, retry та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованих профілю/стандартних значень, розбору CDP URL і помічників автентифікації керування браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Загальні помічники життєвого циклу завдань і доставки завершення для агентів на базі harness, що використовують область завдання, видану хостом |
    | `plugin-sdk/codex-mcp-projection` | Зарезервований вбудований помічник Codex для проєктування конфігурації користувацького MCP-сервера в конфігурацію потоку Codex; не для сторонніх Plugin |
    | `plugin-sdk/codex-native-task-runtime` | Приватний вбудований помічник Codex для дзеркала нативних завдань і з’єднання runtime; не для сторонніх Plugin |
    | `plugin-sdk/channel-runtime-context` | Загальні помічники реєстрації та пошуку runtime-контексту каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові Plugin мають імпортувати `plugin-sdk/run-command` напряму |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові Plugin мають імпортувати загальні підшляхи SDK напряму |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні помічники команд, hook, http та інтерактивної роботи Plugin |
    | `plugin-sdk/hook-runtime` | Спільні помічники конвеєра webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Помічники відкладеного імпорту та прив’язки runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Помічники виконання процесів |
    | `plugin-sdk/cli-runtime` | Помічники форматування CLI, очікування, версії, виклику аргументів і відкладених груп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Спільні ідентифікатори live-сценаріїв QA для транспорту, помічники базового покриття та помічник вибору сценаріїв |
    | `plugin-sdk/gateway-method-runtime` | Зарезервований помічник диспетчеризації методів Gateway для HTTP-маршрутів Plugin, що оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, помічник запуску клієнта після готовності циклу подій, gateway CLI RPC, помилки протоколу Gateway, визначення рекламованого LAN-хоста та помічники patch для статусу каналу |
    | `plugin-sdk/config-contracts` | Сфокусована type-only поверхня конфігурації для форм конфігурації Plugin, як-от `OpenClawConfig` і типи конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Помічники пошуку конфігурації Plugin у runtime, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Помічники транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Спільні рядки підказок metadata доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Помічники знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і set-методи тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого text barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко задані прив’язки реакцій схвалення, payload запиту реакції, сховища цілей реакцій і експорт сумісності для приглушення запиту локального нативного exec |
    | `plugin-sdk/approval-runtime` | Помічники схвалення exec/Plugin, побудовники approval-capability, помічники auth/profile, нативні помічники routing/runtime і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні помічники inbound/reply runtime, chunking, dispatch, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники dispatch/finalize відповіді та міток розмов |
    | `plugin-sdk/reply-history` | Спільні помічники історії відповідей у короткому вікні. Новий код message-turn має використовувати `createChannelHistoryWindow`; низькорівневі помічники map залишаються лише застарілими експортами сумісності |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі помічники chunking тексту/Markdown |
    | `plugin-sdk/session-store-runtime` | Помічники workflow сесій (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), обмежені читання тексту нещодавнього transcript користувача/асистента за ідентичністю сесії, застарілі помічники шляху сховища сесій/session-key, читання updated-at і перехідні помічники сумісності whole-store/file-path |
    | `plugin-sdk/session-transcript-runtime` | Ідентичність transcript, scoped-помічники target/read/write, публікація оновлень, блокування запису та ключі влучань пам’яті transcript |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані помічники agent-schema, шляхів і транзакцій SQLite для first-party runtime |
    | `plugin-sdk/cron-store-runtime` | Помічники шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Помічники шляхів директорій стану/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типи keyed-state для sidecar SQLite Plugin плюс централізоване налаштування connection pragma та обслуговування WAL для баз даних, власником яких є Plugin |
    | `plugin-sdk/routing` | Помічники прив’язки route/session-key/account, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні помічники зведення статусу каналу/облікового запису, стандартні значення runtime-state і помічники issue metadata |
    | `plugin-sdk/target-resolver-runtime` | Спільні помічники resolver цілей |
    | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витяг рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні reader-и параметрів tool/CLI |
    | `plugin-sdk/tool-plugin` | Визначення простого typed agent-tool Plugin і надання статичних metadata для генерації маніфесту |
    | `plugin-sdk/tool-payload` | Витяг нормалізованих payload із об’єктів результату tool |
    | `plugin-sdk/tool-send` | Витяг канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/sandbox` | Типи backend sandbox і помічники команд SSH/OpenShell, включно з fail-fast preflight команди exec |
    | `plugin-sdk/temp-path` | Спільні помічники шляхів temp-download і приватні безпечні тимчасові робочі простори |
    | `plugin-sdk/logging-core` | Logger підсистем і помічники редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Помічники режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Помічники перевизначення model/session, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Помічники розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі помічники читання/запису стану JSON |
    | `plugin-sdk/json-unsafe-integers` | Помічники розбору JSON, що зберігають небезпечні цілочисельні літерали як рядки |
    | `plugin-sdk/file-lock` | Помічники реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Помічники дискового cache дедуплікації |
    | `plugin-sdk/acp-runtime` | Помічники ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легкі помічники реєстрації ACP backend і reply-dispatch для Plugin, завантажених під час startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання прив’язок ACP без імпортів lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema для agent runtime |
    | `plugin-sdk/boolean-param` | Нестрогий reader boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Помічники розв’язання збігів dangerous-name |
    | `plugin-sdk/device-bootstrap` | Помічники bootstrap пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви помічників passive-channel, status та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Помічники відповіді команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Помічники переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Помічники registry/build/serialize нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, помічники steer/abort активного запуску, помічники bridge tool OpenClaw, помічники політики tool runtime-plan, класифікація terminal outcome, помічники форматування/деталізації progress tool і утиліти результату спроби |
    | `plugin-sdk/provider-zai-endpoint` | Застарілий фасад виявлення endpoint, власником якого є провайдер Z.AI; використовуйте публічний API Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Помічник process-local async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Помічник telemetry активності каналу |
    | `plugin-sdk/concurrency-runtime` | Помічник обмеженої concurrency async-завдань |
    | `plugin-sdk/dedupe-runtime` | Помічники in-memory cache дедуплікації |
    | `plugin-sdk/delivery-queue-runtime` | Помічник drain для outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Помічники безпечних шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Помічники wake, event і visibility Heartbeat |
    | `plugin-sdk/number-runtime` | Помічник numeric coercion |
    | `plugin-sdk/secure-random-runtime` | Помічники secure token/UUID |
    | `plugin-sdk/system-event-runtime` | Помічники черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Помічник очікування готовності транспорту |
    | `plugin-sdk/exec-approvals-runtime` | Помічники файлів політики схвалень exec без широкого infra-runtime barrel |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані підшляхи runtime вище |
    | `plugin-sdk/collection-runtime` | Невеликі помічники bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Помічники diagnostic flag, event і trace-context |
    | `plugin-sdk/error-runtime` | Error graph, форматування, спільні помічники класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і помічники pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer inline image data URL і помічники signature sniffing без широкої media runtime surface |
    | `plugin-sdk/response-limit-runtime` | Bounded reader response-body без широкої media runtime surface |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без налаштованого binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Помічники session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані помічники agent-schema, шляхів і транзакцій SQLite без контролів життєвого циклу бази даних |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація supplemental context без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі помічники coercion і нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Помічники нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Помічники конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Помічники директорії/ідентичності/робочого простору агента, включно з `resolveAgentDir`, `resolveDefaultAgentDir` і застарілим експортом сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Config-backed запит/дедуплікація директорій |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні помічники для отримання, перетворення та зберігання медіа, зокрема `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` і застарілий `fetchRemoteMedia`; віддавайте перевагу помічникам зберігання перед читанням буферів, коли URL має стати медіа OpenClaw |
    | `plugin-sdk/media-mime` | Вузька нормалізація MIME, зіставлення розширень файлів, виявлення MIME і помічники типів медіа |
    | `plugin-sdk/media-store` | Вузькі помічники сховища медіа, як-от `saveMediaBuffer` і `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Спільні помічники перемикання після збою для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти помічників для зображень, аудіо та структурованого витягання, орієнтовані на провайдерів |
    | `plugin-sdk/text-chunking` | Помічники фрагментації й рендерингу тексту та markdown, перетворення таблиць markdown, вилучення тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Помічник фрагментації вихідного тексту |
    | `plugin-sdk/speech` | Типи мовних провайдерів, а також експорти директив, реєстру, валідації, OpenAI-сумісного конструктора TTS і мовних помічників, орієнтовані на провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи мовних провайдерів, реєстр, директива, нормалізація й експорти мовних помічників |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, помічники реєстру та спільний помічник сеансу WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Помічник початкового завантаження профілю реального часу для обмеженого впровадження контексту `IDENTITY.md`, `USER.md` і `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типи голосових провайдерів реального часу, помічники реєстру та спільні помічники поведінки голосу в реальному часі, зокрема відстеження вихідної активності |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, помічники URL ресурсів/даних зображень і OpenAI-сумісний конструктор провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, помічники перемикання після збою, автентифікації та реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, помічники перемикання після збою, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, помічники перемикання після збою, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/transcripts` | Спільні типи провайдерів джерел транскриптів, помічники реєстру, дескриптори сеансів і метадані висловлювань |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і помічники встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Спільні помічники завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Застарілий реекспорт сумісності; імпортуйте `zod` з `zod` напряму |
    | `plugin-sdk/testing` | Репозиторійний локальний застарілий barrel сумісності для застарілих тестів OpenClaw. Нові тести репозиторію натомість мають імпортувати сфокусовані локальні тестові підшляхи, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Репозиторійний локальний мінімальний помічник `createTestPluginApi` для модульних тестів прямої реєстрації Plugin без імпорту мостів репозиторійних тестових помічників |
    | `plugin-sdk/agent-runtime-test-contracts` | Репозиторійні локальні фікстури контрактів нативного адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Репозиторійні локальні тестові помічники, орієнтовані на канали, для загальних контрактів дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, потоків send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Репозиторійний локальний спільний набір випадків помилок розв'язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Репозиторійні локальні помічники контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Репозиторійні локальні помічники контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, майстра, можливостей медіа, політики replay, realtime STT live-audio, web-search/fetch і потоку |
    | `plugin-sdk/provider-http-test-mocks` | Репозиторійні локальні opt-in HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Репозиторійні локальні загальні фікстури захоплення CLI runtime, контексту sandbox, записувача Skills, agent-message, system-event, перезавантаження модуля, шляху bundled Plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Репозиторійні локальні сфокусовані помічники моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам'яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня bundled memory-core помічників для помічників менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам'яті |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легкі помічники реєстру провайдерів embedding для пам'яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation-рушія хоста пам'яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам'яті, доступ до реєстру, локальний провайдер і загальні batch/remote помічники. `registerMemoryEmbeddingProvider` на цій поверхні застарів; використовуйте загальний API провайдера embedding для нових провайдерів. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD-рушія хоста пам'яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам'яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам'яті |
    | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам'яті |
    | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам'яті |
    | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Помічники статусу хоста пам'яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помічники CLI runtime хоста пам'яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Помічники core runtime хоста пам'яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/runtime хоста пам'яті |
    | `plugin-sdk/memory-host-core` | Вендорно-нейтральний псевдонім для помічників core runtime хоста пам'яті |
    | `plugin-sdk/memory-host-events` | Вендорно-нейтральний псевдонім для помічників журналу подій хоста пам'яті |
    | `plugin-sdk/memory-host-files` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Спільні помічники managed-markdown для суміжних із пам'яттю plugins |
    | `plugin-sdk/memory-host-search` | Фасад runtime active memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Зарезервовані підшляхи SDK bundled-helper — це вузькі owner-specific поверхні для
    коду bundled Plugin. Вони відстежуються в інвентарі SDK, щоб збірки
    пакета та псевдоніми залишалися детермінованими, але вони не є загальними API
    для авторства Plugin. Нові багаторазові контракти хоста мають використовувати загальні підшляхи SDK,
    як-от `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і
    `plugin-sdk/plugin-config-runtime`.

    | Підшлях | Власник і призначення |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Помічник bundled Codex Plugin для проєктування конфігурації MCP-сервера користувача в конфігурацію потоку Codex app-server |
    | `plugin-sdk/codex-native-task-runtime` | Помічник bundled Codex Plugin для віддзеркалення нативних subagents Codex app-server у стан завдань OpenClaw |

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
