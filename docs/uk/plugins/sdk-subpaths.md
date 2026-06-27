---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:06:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin відкрито як набір вузьких публічних підшляхів у
`openclaw/plugin-sdk/`. Ця сторінка каталогізує часто використовувані підшляхи, згруповані за
призначенням. Згенерований інвентар точок входу компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета є публічною підмножиною
після віднімання локальних для репозиторію тестових/внутрішніх підшляхів, перелічених у
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Супровідники можуть перевірити
кількість публічних експортів за допомогою `pnpm plugin-sdk:surface` і активні зарезервовані
допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані зарезервовані
допоміжні експорти провалюють звіт CI замість того, щоб залишатися в публічному SDK як
неактивний борг сумісності.

Посібник зі створення Plugin див. у [Огляді SDK Plugin](/uk/plugins/sdk-overview).

## Вхід Plugin

| Підшлях                       | Ключові експорти                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Допоміжні елементи постачальника міграцій, як-от `createMigrationItem`, константи причин, маркери стану елементів, допоміжні засоби редагування та `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Допоміжні засоби міграцій середовища виконання, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                             |
| `plugin-sdk/health`            | Реєстрація, виявлення, виправлення, вибір, серйозність і типи знахідок перевірок справності Doctor для вбудованих споживачів справності                                 |

### Застаріла сумісність і тестові допоміжні засоби

Застарілі підшляхи залишаються експортованими для старіших Plugin, але новий код має використовувати
цільові підшляхи SDK нижче. Підтримуваний список міститься в
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI відхиляє вбудовані
виробничі імпорти з нього. Широкі barrel-експорти, як-от `compat`, `config-types`,
`infra-runtime`, `text-runtime` і `zod`, призначені лише для сумісності. Імпортуйте `zod`
безпосередньо з `zod`.

Підшляхи тестових допоміжних засобів OpenClaw на базі Vitest є лише локальними для репозиторію і
більше не є експортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` і `testing`.

### Зарезервовані допоміжні підшляхи вбудованого Plugin

Ці підшляхи є поверхнями сумісності, якими володіє Plugin, для відповідного вбудованого
Plugin, а не загальними API SDK: `plugin-sdk/codex-mcp-projection` і
`plugin-sdk/codex-native-task-runtime`. Імпорти розширень між різними власниками блокуються
запобіжниками контракту пакета.

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Кешований помічник перевірки JSON Schema для схем, якими володіє плагін |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники майстра налаштування, перекладач налаштування, запити списку дозволених, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники конфігурації з кількома обліковими записами та шлюзу дій, помічники резервного вибору типового облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису та резервного вибору типового |
    | `plugin-sdk/account-helpers` | Вузькі помічники списку облікових записів і дій облікового запису |
    | `plugin-sdk/access-groups` | Помічники розбору списку дозволених груп доступу та редагованої діагностики груп |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також побудовники Zod і прямі побудовники JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації каналів OpenClaw лише для підтримуваних вбудованих плагінів |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонічні ідентифікатори вбудованих/офіційних чат-каналів, а також мітки форматування/псевдоніми для плагінів, яким потрібно розпізнавати текст із префіксом конверта без жорсткого кодування власної таблиці. |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації вбудованих каналів |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/перевірки користувацьких команд Telegram із резервним контрактом вбудованого пакета |
    | `plugin-sdk/command-gating` | Вузькі помічники шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Застарілий низькорівневий фасад сумісності для вхідного каналу. Нові шляхи отримання мають використовувати `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Експериментальний високорівневий резолвер середовища виконання вхідного каналу та побудовники фактів маршруту для перенесених шляхів отримання каналом. Надавайте перевагу цьому замість складання ефективних списків дозволених, списків дозволених команд і застарілих проєкцій у кожному плагіні. Див. [API вхідного каналу](/uk/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракти життєвого циклу повідомлень, а також параметри конвеєра відповідей, квитанції, live-попередній перегляд/стримінг, помічники життєвого циклу, вихідна ідентичність, планування корисного навантаження, довговічні надсилання та помічники контексту надсилання повідомлень. Див. [API вихідного каналу](/uk/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Застарілий псевдонім сумісності для `plugin-sdk/channel-outbound`, а також застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/channel-message-runtime` | Застарілий псевдонім сумісності для `plugin-sdk/channel-outbound`, а також застарілі фасади диспетчеризації відповідей. |
    | `plugin-sdk/inbound-envelope` | Спільні помічники вхідного маршруту та побудовника конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-inbound` для вхідних виконавців і предикатів диспетчеризації, а `plugin-sdk/channel-outbound` — для помічників доставлення повідомлень. |
    | `plugin-sdk/messaging-targets` | Застарілий псевдонім розбору цілі; використовуйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження вихідних медіа та стану розміщених медіа |
    | `plugin-sdk/outbound-send-deps` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Вузькі помічники нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу прив’язки потоку та адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медійного корисного навантаження агента |
    | `plugin-sdk/conversation-runtime` | Помічники прив’язки розмови/потоку, парування та налаштованої прив’язки |
    | `plugin-sdk/runtime-config-snapshot` | Помічник знімка конфігурації середовища виконання |
    | `plugin-sdk/runtime-group-policy` | Помічники розв’язання групової політики середовища виконання |
    | `plugin-sdk/channel-status` | Спільні помічники знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні вступні експорти плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання конфігурації списку дозволених |
    | `plugin-sdk/group-access` | Спільні помічники рішень щодо доступу груп |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі фасади сумісності. Використовуйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Вузькі помічники політики захисту прямого DM перед криптографією |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові плагіни мають використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв’язання облікового запису Telegram для відстежуваної сумісності власника; нові плагіни мають використовувати ін’єктовані помічники середовища виконання або загальні підшляхи SDK каналів |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові плагіни мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантичне подання повідомлень, доставлення та застарілі помічники інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Спільні вхідні помічники для класифікації подій, побудови контексту, форматування, коренів, debounce, зіставлення згадок, політики згадок і вхідного журналювання |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі помічники debounce для вхідних подій |
    | `plugin-sdk/channel-mention-gating` | Вузькі помічники політики згадок, маркера згадок і тексту згадок без ширшої поверхні вхідного середовища виконання |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Застарілі фасади сумісності. Використовуйте `plugin-sdk/channel-inbound` або `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Помічники дій із повідомленнями каналу, а також застарілі помічники нативної схеми, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршруту, розв’язання цілі на основі парсера, перетворення ідентифікатора потоку на рядок, ключі дедуплікації/компактного маршруту, типи розібраної цілі та помічники порівняння маршруту/цілі |
    | `plugin-sdk/channel-targets` | Помічники розбору цілі; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Під’єднання відгуків/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники секретного контракту, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи секретних цілей |
  </Accordion>

Застарілі сімейства помічників каналів залишаються доступними лише для
сумісності з опублікованими плагінами. План вилучення такий: зберігати їх
упродовж вікна міграції зовнішніх плагінів, тримати репозиторні/вбудовані
плагіни на `channel-inbound` і `channel-outbound`, а потім вилучити підшляхи
сумісності під час наступного великого очищення SDK. Це стосується старих
сімейств повідомлень/середовища виконання каналу, стримінгу каналу, доступу
direct-DM, відокремлених вхідних помічників, параметрів відповідей
і шляхів парування.

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для стандартних параметрів локального сервера, виявлення моделей, заголовків запитів і помічників для завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські помічники налаштування локальних/самостійно розміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані помічники налаштування OpenAI-сумісних самостійно розміщених провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Помічники runtime для розв’язання API-ключів для Plugin провайдерів |
    | `plugin-sdk/provider-oauth-runtime` | Загальні типи callback провайдера OAuth, рендеринг callback-сторінки, помічники PKCE/state, розбір authorization-input, помічники закінчення строку дії токена та помічники скасування |
    | `plugin-sdk/provider-auth-api-key` | Помічники onboarding/запису профілю API-ключа, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний builder результату автентифікації OAuth |
    | `plugin-sdk/provider-env-vars` | Помічники пошуку env-var автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, помічники імпорту автентифікації OpenAI Codex, застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders replay-policy, помічники provider-endpoint і спільні помічники нормалізації model-id |
    | `plugin-sdk/provider-catalog-live-runtime` | Помічники живого каталогу моделей провайдера для захищеного виявлення у стилі `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фільтрація model-id, TTL-кеш і статичний fallback |
    | `plugin-sdk/provider-catalog-runtime` | Runtime hook розширення каталогу провайдера та шви реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні помічники можливостей HTTP/endpoint провайдера, HTTP-помилки провайдера та помічники multipart-форми для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі помічники контракту config/selection для web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Помічники реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі помічники config/credential для web-search для провайдерів, яким не потрібне підключення plugin-enable |
    | `plugin-sdk/provider-web-search-contract` | Вузькі помічники контракту config/credential для web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
    | `plugin-sdk/provider-web-search` | Помічники реєстрації/кешу/runtime провайдера web-search |
    | `plugin-sdk/embedding-providers` | Загальні типи провайдерів embedding і помічники читання, зокрема `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` і `listEmbeddingProviders(...)`; plugins реєструють провайдерів через `api.registerEmbeddingProvider(...)`, щоб забезпечити володіння manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` і очищення схем + діагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типи snapshot використання провайдера, спільні помічники отримання використання та fetchers провайдера, як-от `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper, сумісність plain-text tool-call і спільні помічники wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Публічні спільні помічники provider stream wrapper, зокрема `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` і утиліти stream, сумісні з Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Помічники нативного транспорту провайдера, як-от захищений fetch, перетворення transport message і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Помічники patch для onboarding config |
    | `plugin-sdk/global-singleton` | Помічники process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі помічники режиму активації групи та розбору команд |
  </Accordion>

Snapshot використання провайдера зазвичай повідомляє одне або кілька quota `windows`, кожне з
міткою, відсотком використання та необов’язковим часом скидання. Провайдери, які показують текст балансу або
стану облікового запису замість quota windows зі скиданням, мають повертати
`summary` з порожнім масивом `windows`, а не вигадувати відсотки.
OpenClaw показує цей текст summary у status output; використовуйте `error` лише тоді, коли
endpoint використання завершився помилкою або не повернув придатних даних про використання.

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, помічники реєстру команд, зокрема форматування меню динамічних аргументів, помічники авторизації відправника |
    | `plugin-sdk/command-status` | Builders повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Помічники розв’язання approver і same-chat action-auth |
    | `plugin-sdk/approval-client-runtime` | Помічники профілю/фільтра нативного exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки нативного approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний помічник розв’язання Gateway для approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі помічники завантаження нативного approval adapter для гарячих entrypoints каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-помічники approval handler; надавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Помічники нативного approval target, account-binding, route-gate, forwarding fallback і придушення локального native exec prompt |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко закодовані bindings реакцій approval, payloads reaction prompt, stores reaction target і експорт сумісності для придушення локального native exec prompt |
    | `plugin-sdk/approval-reply-runtime` | Помічники payload відповіді exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Помічники payload exec/plugin approval, помічники routing/runtime нативного approval і помічники структурованого відображення approval, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі помічники скидання dedupe для вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі помічники тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і помічники нативного session-target |
    | `plugin-sdk/command-detection` | Спільні помічники виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих channel paths |
    | `plugin-sdk/command-surface` | Нормалізація command-body і помічники command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі помічники збирання secret-contract для поверхонь secret каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі помічники `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/secret-provider-integration` | Type-only manifest інтеграції провайдера SecretRef і preset contracts для plugins, які публікують зовнішні presets secret provider |
    | `plugin-sdk/security-runtime` | Спільні помічники trust, DM gating, root-bounded file/path, зокрема create-only writes, синхронна/асинхронна атомарна заміна файлів, sibling temp writes, fallback переміщення між пристроями, помічники приватного file-store, guards symlink-parent, external-content, редагування sensitive text, constant-time порівняння secret і помічники secret-collection |
    | `plugin-sdk/ssrf-policy` | Помічники host allowlist і політики SSRF для private-network |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі помічники pinned-dispatcher без широкої infra runtime surface |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-guarded fetch, SSRF error і помічники SSRF policy |
    | `plugin-sdk/secret-input` | Помічники розбору secret input |
    | `plugin-sdk/webhook-ingress` | Помічники Webhook request/target і raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Помічники розміру/timeout тіла запиту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі помічники середовища виконання, журналювання, резервного копіювання та встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі помічники env середовища виконання, журналера, тайм-ауту, повторної спроби та backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованих профілів/типових значень, розбору CDP URL і помічників автентифікації керування браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Загальні помічники життєвого циклу завдання та доставки завершення для агентів на базі harness, що використовують видану host область завдання |
    | `plugin-sdk/codex-mcp-projection` | Зарезервований вбудований помічник Codex для проєктування користувацької конфігурації MCP-сервера в конфігурацію потоку Codex; не для сторонніх plugins |
    | `plugin-sdk/codex-native-task-runtime` | Приватний вбудований помічник Codex для дзеркала native task і зв’язування середовища виконання; не для сторонніх plugins |
    | `plugin-sdk/channel-runtime-context` | Загальні помічники реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` напряму |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати загальні підшляхи SDK напряму |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні помічники команд plugin, hooks, HTTP та інтерактивних можливостей |
    | `plugin-sdk/hook-runtime` | Спільні помічники pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Помічники лінивого імпорту/прив’язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Помічники виконання процесів |
    | `plugin-sdk/cli-runtime` | Помічники форматування CLI, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/qa-live-transport-scenarios` | Спільні ids live transport QA scenarios, помічники базового покриття та помічник вибору сценарію |
    | `plugin-sdk/gateway-method-runtime` | Зарезервований помічник dispatch методів Gateway для HTTP-маршрутів plugin, які оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, помічник запуску клієнта, готового до циклу подій, gateway CLI RPC, помилки протоколу gateway і помічники patch для статусу каналу |
    | `plugin-sdk/config-contracts` | Сфокусована type-only поверхня конфігурації для форм конфігурації plugin, як-от `OpenClawConfig` і типи конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Runtime-помічники пошуку конфігурації plugin, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Транзакційні помічники зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Спільні рядки підказок метаданих доставки message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Помічники знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і setters знімків для тестів |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для посилань на файли без широкого text barrel |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко закодовані прив’язки реакцій схвалення, payloads запитів реакцій, сховища цілей реакцій і експорт сумісності для локального приглушення native exec prompt |
    | `plugin-sdk/approval-runtime` | Помічники схвалення exec/plugin, побудовники можливостей схвалення, помічники автентифікації/профілю, помічники native routing/runtime і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні помічники inbound/reply runtime, chunking, dispatch, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники dispatch/finalize відповіді та міток розмов |
    | `plugin-sdk/reply-history` | Спільні помічники історії відповідей для короткого вікна. Новий код message-turn має використовувати `createChannelHistoryWindow`; нижчорівневі map-помічники залишаються лише застарілими експортами сумісності |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі помічники chunking для text/markdown |
    | `plugin-sdk/session-store-runtime` | Помічники workflow сесій (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), обмежене читання нещодавнього тексту transcript користувача/асистента за ідентичністю сесії, legacy-помічники шляху session store/session-key, читання updated-at і transition-only помічники сумісності whole-store/file-path |
    | `plugin-sdk/session-transcript-runtime` | Ідентичність transcript, scoped помічники цілі/читання/запису, публікація оновлень, блокування запису та ключі збігів пам’яті transcript |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані помічники SQLite для agent-schema, шляхів і транзакцій у first-party runtime |
    | `plugin-sdk/cron-store-runtime` | Помічники шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Помічники шляхів каталогів State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типи keyed-state для sidecar SQLite plugin плюс централізоване налаштування connection pragma і обслуговування WAL для баз даних, що належать plugin |
    | `plugin-sdk/routing` | Помічники прив’язки route/session-key/account, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні помічники підсумку статусу channel/account, типові значення runtime-state і помічники метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні помічники resolver цілі |
    | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягнення рядкових URL з inputs, подібних до fetch/request |
    | `plugin-sdk/run-command` | Runner команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні readers параметрів tool/CLI |
    | `plugin-sdk/tool-plugin` | Визначення простого типізованого agent-tool plugin і надання статичних метаданих для генерації manifest |
    | `plugin-sdk/tool-payload` | Витягнення нормалізованих payloads з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягнення канонічних полів цілі надсилання з args tool |
    | `plugin-sdk/sandbox` | Типи backend sandbox і помічники команд SSH/OpenShell, зокрема fail-fast preflight для exec command |
    | `plugin-sdk/temp-path` | Спільні помічники шляхів temp-download і приватні безпечні тимчасові workspaces |
    | `plugin-sdk/logging-core` | Журналер підсистеми та помічники редагування |
    | `plugin-sdk/markdown-table-runtime` | Помічники режиму таблиць Markdown і конвертації |
    | `plugin-sdk/model-session-runtime` | Помічники перевизначення model/session, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Помічники розв’язання конфігурації Talk provider |
    | `plugin-sdk/json-store` | Невеликі помічники читання/запису стану JSON |
    | `plugin-sdk/json-unsafe-integers` | Помічники розбору JSON, що зберігають небезпечні цілочисельні літерали як рядки |
    | `plugin-sdk/file-lock` | Re-entrant помічники блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Помічники disk-backed cache для dedupe |
    | `plugin-sdk/acp-runtime` | Помічники ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Легковагові помічники реєстрації backend ACP і reply-dispatch для plugins, завантажених під час startup |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання прив’язок ACP без імпортів lifecycle startup |
    | `plugin-sdk/agent-config-primitives` | Вузькі primitives config-schema для agent runtime |
    | `plugin-sdk/boolean-param` | Reader вільного boolean param |
    | `plugin-sdk/dangerous-name-runtime` | Помічники розв’язання збігів dangerous-name |
    | `plugin-sdk/device-bootstrap` | Помічники bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні primitives пасивного каналу, статусу та ambient proxy helper |
    | `plugin-sdk/models-provider-runtime` | Помічники відповіді `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Помічники списку команд Skill |
    | `plugin-sdk/native-command-registry` | Помічники registry/build/serialize для native command |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, помічники steer/abort активного запуску, помічники bridge для tool OpenClaw, помічники політики tool runtime-plan, класифікація terminal outcome, помічники форматування/деталізації прогресу tool і утиліти результату спроби |
    | `plugin-sdk/provider-zai-endpoint` | Застарілий фасад provider-owned виявлення endpoint Z.AI; використовуйте публічний API plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Process-local помічник async lock для невеликих файлів runtime state |
    | `plugin-sdk/channel-activity-runtime` | Помічник telemetry активності каналу |
    | `plugin-sdk/concurrency-runtime` | Помічник обмеженої concurrency async tasks |
    | `plugin-sdk/dedupe-runtime` | Помічники in-memory dedupe cache |
    | `plugin-sdk/delivery-queue-runtime` | Помічник drain для outbound pending-delivery |
    | `plugin-sdk/file-access-runtime` | Безпечні помічники шляхів local-file і media-source |
    | `plugin-sdk/heartbeat-runtime` | Помічники wake, event і visibility для Heartbeat |
    | `plugin-sdk/number-runtime` | Помічник numeric coercion |
    | `plugin-sdk/secure-random-runtime` | Помічники secure token/UUID |
    | `plugin-sdk/system-event-runtime` | Помічники queue системних подій |
    | `plugin-sdk/transport-ready-runtime` | Помічник очікування готовності transport |
    | `plugin-sdk/exec-approvals-runtime` | Помічники файлу політики exec approval без широкого barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані підшляхи runtime вище |
    | `plugin-sdk/collection-runtime` | Невеликі помічники bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Помічники diagnostic flag, event і trace-context |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні помічники класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і помічники pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer inline image data URL і помічники signature sniffing без широкої media runtime surface |
    | `plugin-sdk/response-limit-runtime` | Bounded reader response-body без широкої media runtime surface |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без configured binding routing або pairing stores |
    | `plugin-sdk/session-store-runtime` | Помічники session-store без широких імпортів config writes/maintenance |
    | `plugin-sdk/sqlite-runtime` | Сфокусовані помічники SQLite для agent-schema, шляхів і транзакцій без керування lifecycle бази даних |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання visibility контексту та фільтрація supplemental context без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі помічники coercion і нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Помічники нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Помічники retry config і retry runner |
    | `plugin-sdk/agent-runtime` | Помічники dir/identity/workspace агента, зокрема `resolveAgentDir`, `resolveDefaultAgentDir` і застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Config-backed query/dedup каталогу |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання, перетворення та збереження медіа, зокрема `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` і застарілий `fetchRemoteMedia`; коли URL має стати медіа OpenClaw, надавайте перевагу допоміжним засобам сховища перед читанням буфера |
    | `plugin-sdk/media-mime` | Вузька нормалізація MIME, зіставлення розширень файлів, визначення MIME та допоміжні засоби для типів медіа |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` і `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби аварійного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів для зображень, аудіо та структурованого витягування, орієнтовані на провайдера |
    | `plugin-sdk/text-chunking` | Допоміжні засоби поділу й рендерингу тексту та markdown, перетворення таблиць markdown, вилучення тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб поділу вихідного тексту |
    | `plugin-sdk/speech` | Типи мовленнєвих провайдерів, а також експорти директив, реєстру, валідації, сумісного з OpenAI конструктора TTS і допоміжних мовленнєвих засобів, орієнтовані на провайдера |
    | `plugin-sdk/speech-core` | Спільні типи мовленнєвих провайдерів, реєстр, директиви, нормалізація та експорти допоміжних мовленнєвих засобів |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Допоміжний засіб початкового налаштування профілю в реальному часі для обмеженого впровадження контексту `IDENTITY.md`, `USER.md` і `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типи голосових провайдерів реального часу, допоміжні засоби реєстру та спільні допоміжні засоби голосової поведінки в реальному часі, зокрема відстеження активності виводу |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби для ресурсів зображень/data URL і сумісний з OpenAI конструктор провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, аварійне перемикання, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів, запитів і результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби аварійного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдерів, запитів і результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби аварійного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/transcripts` | Спільні типи провайдерів джерел транскриптів, допоміжні засоби реєстру, дескриптори сеансів і метадані висловлювань |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Застарілий повторний експорт для сумісності; імпортуйте `zod` безпосередньо з `zod` |
    | `plugin-sdk/testing` | Локальний для репозиторію застарілий агрегувальний модуль сумісності для застарілих тестів OpenClaw. Нові тести репозиторію натомість мають імпортувати сфокусовані локальні тестові підшляхи, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Локальний для репозиторію мінімальний допоміжний засіб `createTestPluginApi` для модульних тестів прямої реєстрації Plugin без імпорту мостів тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальні для репозиторію фікстури контрактів нативного адаптера середовища виконання агента для тестів автентифікації, доставки, резервного режиму, хуків інструментів, накладення промптів, схем і проєкції транскриптів |
    | `plugin-sdk/channel-test-helpers` | Локальні для репозиторію тестові допоміжні засоби, орієнтовані на канали, для загальних контрактів дій/налаштування/стану, перевірок каталогів, життєвого циклу запуску облікового запису, передавання конфігурації в потоках, моків середовища виконання, проблем стану, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Локальний для репозиторію спільний набір тестів випадків помилок розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Локальні для репозиторію допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, API середовища виконання та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Локальні для репозиторію допоміжні засоби контрактів середовища виконання провайдера, автентифікації, виявлення, адаптації, каталогу, майстра, можливостей медіа, політики відтворення, живого аудіо STT у реальному часі, вебпошуку/отримання та потоку |
    | `plugin-sdk/provider-http-test-mocks` | Локальні для репозиторію опційні HTTP/автентифікаційні моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Локальні для репозиторію загальні фікстури захоплення середовища виконання CLI, контексту пісочниці, записувача Skills, повідомлення агента, системної події, перезавантаження модуля, шляху bundled Plugin, тексту термінала, поділу на фрагменти, токена автентифікації та типізованих випадків |
    | `plugin-sdk/test-node-mocks` | Локальні для репозиторію сфокусовані допоміжні засоби моків вбудованих модулів Node для використання у фабриках Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня bundled допоміжних засобів memory-core для допоміжних засобів менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-embedding-registry` | Легкі допоміжні засоби реєстру провайдерів embedding пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія основи хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби batch/remote. `registerMemoryEmbeddingProvider` на цій поверхні застарілий; для нових провайдерів використовуйте загальний API провайдера embedding. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби середовища виконання CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби основного середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів основного середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для Plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад середовища виконання Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    Зарезервовані підшляхи SDK bundled-helper — це вузькі власницькі поверхні для
    коду bundled Plugin. Вони відстежуються в інвентарі SDK, щоб збірки
    пакетів і псевдоніми залишалися детермінованими, але це не загальні API для
    створення Plugin. Нові багаторазові контракти хоста мають використовувати загальні підшляхи SDK,
    як-от `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і
    `plugin-sdk/plugin-config-runtime`.

    | Підшлях | Власник і призначення |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Допоміжний засіб bundled Codex Plugin для проєктування конфігурації MCP-сервера користувача в конфігурацію потоку app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Допоміжний засіб bundled Codex Plugin для віддзеркалення нативних підлеглих агентів app-server Codex у стан завдання OpenClaw |

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
