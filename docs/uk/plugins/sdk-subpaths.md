---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту плагіна
    - Аудит підшляхів вбудованих плагінів і допоміжних інтерфейсів
summary: 'Каталог підшляхів SDK Plugin: які імпорти де розташовані, згруповано за областями'
title: Підшляхи SDK Pluginа
x-i18n:
    generated_at: "2026-07-16T18:24:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK плагінів надається як набір вузькоспеціалізованих публічних підшляхів у
`openclaw/plugin-sdk/`. На цій сторінці наведено каталог часто використовуваних підшляхів, згрупованих за
призначенням. Поверхню визначають три файли:

- `scripts/lib/plugin-sdk-entrypoints.json`: підтримуваний перелік точок входу,
  які компілює система збирання.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: локальні для репозиторію
  тестові та внутрішні підшляхи. Експорти пакета — це перелік без цього списку.
- `src/plugin-sdk/entrypoints.ts`: метадані класифікації для застарілих
  підшляхів, зарезервованих вбудованих допоміжних засобів, підтримуваних вбудованих фасадів і
  публічних поверхонь, що належать плагінам.

Супровідники перевіряють кількість публічних експортів за допомогою `pnpm plugin-sdk:surface`, а
активні зарезервовані підшляхи допоміжних засобів — за допомогою `pnpm plugins:boundary-report:summary`;
невикористовувані зарезервовані експорти допоміжних засобів спричиняють помилку у звіті CI, а не залишаються в
публічному SDK як неактивний борг сумісності.

Посібник зі створення плагінів див. у розділі [Огляд SDK плагінів](/uk/plugins/sdk-overview).

## Точка входу плагіна

| Підшлях                        | Основні експорти                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Допоміжні засоби для елементів постачальника міграції, як-от `createMigrationItem`, константи причин, позначки стану елементів, допоміжні засоби редагування конфіденційних даних і `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Допоміжні засоби міграції середовища виконання, як-от `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Реєстрація перевірок стану Doctor, виявлення, виправлення, вибір, рівні серйозності та типи результатів для вбудованих споживачів даних про стан                                                                                |
| `plugin-sdk/config-schema`     | Застаріле. Коренева схема Zod `openclaw.json` (`OpenClawSchema`); натомість визначайте локальні для плагіна схеми та перевіряйте їх за допомогою `plugin-sdk/json-schema-runtime`                                                  |

### Застарілі засоби сумісності та тестування

Застарілі підшляхи залишаються експортованими для старіших плагінів, але новий код має використовувати
наведені нижче вузькоспеціалізовані підшляхи SDK. Підтримуваний список:
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI відхиляє імпорти з нього у
виробничому коді вбудованих компонентів. Широкі модулі реекспорту, як-от `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` і
`plugin-sdk/text-runtime`, призначені лише для сумісності, а `plugin-sdk/zod` є
реекспортом для сумісності: імпортуйте `zod` безпосередньо з `zod`. Широкі доменні
модулі реекспорту `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` і
`plugin-sdk/security-runtime` також застаріли; натомість слід використовувати вузькоспеціалізовані
підшляхи.

Підшляхи тестових допоміжних засобів OpenClaw на основі Vitest призначені лише для репозиторію й більше не є
експортами пакета: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` і `testing`. Приватні поверхні вбудованих допоміжних засобів
`ssrf-runtime-internal` і `codex-native-task-runtime` також призначені лише для
репозиторію.

### Зарезервовані підшляхи допоміжних засобів вбудованих плагінів

`plugin-sdk/codex-mcp-projection` — єдиний зарезервований підшлях: поверхня
сумісності, що належить плагіну, для вбудованого плагіна Codex, а не універсальний API SDK.
Імпорти між плагінами різних власників блокуються запобіжними обмеженнями контракту пакета, а
CI завершується помилкою, коли зарезервований підшлях перестають імпортувати.
`plugin-sdk/codex-native-task-runtime` призначений лише для репозиторію і не є експортом
пакета.

`src/plugin-sdk/entrypoints.ts` також відстежує підтримувані вбудовані фасади — точки входу
SDK, які надаються відповідними вбудованими плагінами, доки їх не замінять універсальні контракти:
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` і `plugin-sdk/zalouser`. Деякі з них також
застаріли для нового коду; див. примітки до відповідних рядків нижче.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Допоміжний засіб перевірки кешованої JSON Schema для схем, якими керують плагіни |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, перекладач налаштування, запити щодо списку дозволів, побудовники стану налаштування |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації кількох облікових записів і шлюзу дій, допоміжні засоби резервного переходу до стандартного облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікаторів облікових записів |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів і резервного переходу до стандартного |
    | `plugin-sdk/account-helpers` | Вузькоспеціалізовані допоміжні засоби для списку облікових записів і дій з обліковими записами |
    | `plugin-sdk/access-groups` | Допоміжні засоби аналізу списку дозволів для груп доступу та діагностики груп із прихованими даними |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналів, а також Zod і прямі побудовники JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації каналів OpenClaw лише для підтримуваних вбудованих плагінів |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Канонічні ідентифікатори вбудованих/офіційних каналів чату, а також мітки/псевдоніми форматувальника для плагінів, яким потрібно розпізнавати текст із префіксом конверта без жорсткого кодування власної таблиці. |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації вбудованих каналів |
    | `plugin-sdk/telegram-command-config` | Застарілі нормалізація назв/описів команд Telegram і перевірки на дублікати/конфлікти; у новому коді плагінів використовуйте локальне для плагіна опрацювання конфігурації команд |
    | `plugin-sdk/command-gating` | Вузькоспеціалізовані допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Експериментальний високорівневий розпізнавач середовища виконання вхідного потоку каналу та побудовники фактів маршруту для перенесених шляхів отримання даних каналом. Віддавайте йому перевагу замість формування ефективних списків дозволів, списків дозволених команд і застарілих проєкцій у кожному плагіні. Див. [API вхідного потоку каналу](/uk/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Контракти життєвого циклу повідомлень, а також параметри конвеєра відповідей, підтвердження, попередній перегляд/потокове передавання наживо, допоміжні засоби життєвого циклу, вихідна ідентичність, планування корисного навантаження, надійне надсилання та допоміжні засоби контексту надсилання повідомлень. Див. [API вихідного потоку каналу](/uk/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Застарілий псевдонім сумісності для `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Застарілий псевдонім сумісності для `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби побудови вхідного маршруту та конверта |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-inbound` для засобів запуску вхідного потоку та предикатів диспетчеризації, а `plugin-sdk/channel-outbound` — для допоміжних засобів доставлення повідомлень. |
    | `plugin-sdk/messaging-targets` | Застарілий псевдонім аналізу цілі; використовуйте `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіаданих і стану розміщених медіаданих |
    | `plugin-sdk/outbound-send-deps` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Вузькоспеціалізовані допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Життєвий цикл прив’язки гілок і допоміжні засоби адаптера |
    | `plugin-sdk/agent-media-payload` | Кореневі каталоги та завантажувачі корисного навантаження медіаданих агента |
    | `plugin-sdk/conversation-runtime` | Застарілий широкий модуль експорту для прив’язки розмов/гілок, спарювання та допоміжних засобів налаштованих прив’язок; віддавайте перевагу спеціалізованим підшляхам прив’язки, як-от `plugin-sdk/thread-bindings-runtime` і `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення групової політики середовища виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімків/зведень стану каналів |
    | `plugin-sdk/channel-config-primitives` | Вузькоспеціалізовані примітиви схеми конфігурації каналів |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналів |
    | `plugin-sdk/channel-plugin-common` | Спільні попередні експорти плагінів каналів |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації списку дозволів |
    | `plugin-sdk/group-access` | Застарілі допоміжні засоби ухвалення рішень щодо групового доступу; використовуйте `resolveChannelMessageIngress` з `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі фасади сумісності. Використовуйте `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Вузькоспеціалізовані допоміжні засоби політики перевірки перед криптографічним опрацюванням для прямих повідомлень |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові плагіни мають використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності Telegram для визначення облікових записів заради відстежуваної сумісності власника; нові плагіни мають використовувати впроваджені допоміжні засоби середовища виконання або загальні підшляхи SDK каналів |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові плагіни мають використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби семантичного представлення й доставлення повідомлень, а також застарілих інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Спільні допоміжні засоби вхідного потоку для класифікації подій, побудови контексту, форматування, кореневих каталогів, усунення брязкоту, зіставлення згадок, політики згадок і журналювання вхідного потоку |
    | `plugin-sdk/channel-inbound-debounce` | Вузькоспеціалізовані допоміжні засоби усунення брязкоту у вхідному потоці |
    | `plugin-sdk/channel-mention-gating` | Вузькоспеціалізовані допоміжні засоби політики згадок, маркерів згадок і тексту згадок без ширшої поверхні середовища виконання вхідного потоку |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Застарілі фасади сумісності. Використовуйте `plugin-sdk/channel-inbound` або `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Застарілий фасад сумісності. Використовуйте `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналів, а також застарілі допоміжні засоби нативних схем, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршрутів, визначення цілей на основі аналізатора, перетворення ідентифікаторів гілок на рядки, ключі маршрутів для дедуплікації/компактного подання, типи проаналізованих цілей і допоміжні засоби порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Допоміжні засоби аналізу цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналів |
    | `plugin-sdk/channel-feedback` | Підключення зворотного зв’язку/реакцій |
  </Accordion>

Застарілі сімейства допоміжних засобів каналів залишаються доступними лише для
сумісності опублікованих плагінів. План вилучення такий: зберігати їх протягом
періоду міграції зовнішніх плагінів, використовувати для плагінів репозиторію та
вбудованих плагінів `channel-inbound` і `channel-outbound`, а потім вилучити
підшляхи сумісності під час наступного масштабного очищення SDK. Це стосується
старих сімейств повідомлень і середовища виконання каналів, потокового передавання
каналами, прямого доступу до особистих повідомлень, відокремлених допоміжних засобів
для вхідних даних, параметрів відповіді та шляхів сполучення.

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад середовища виконання LM Studio для типових параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби налаштування локальних/самостійно розміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Застарілі допоміжні засоби налаштування самостійно розміщених провайдерів, сумісних з OpenAI; використовуйте `plugin-sdk/provider-setup` або допоміжні засоби налаштування, що належать плагінам |
    | `plugin-sdk/cli-backend` | Типові параметри бекенду CLI та константи сторожового таймера |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби середовища виконання для автентифікації провайдера: локальний цикл OAuth, обмін токенами, збереження автентифікації та визначення ключа API |
    | `plugin-sdk/provider-oauth-runtime` | Загальні типи зворотного виклику OAuth провайдера, відтворення сторінки зворотного виклику, допоміжні засоби PKCE/стану, розбір вхідних даних авторизації, допоміжні засоби завершення строку дії токена та переривання |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби початкового налаштування за допомогою ключа API та запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату автентифікації OAuth |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, допоміжні засоби імпорту автентифікації OpenAI Codex, застарілий експорт сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик повторного відтворення, допоміжні засоби кінцевих точок провайдера та спільні допоміжні засоби нормалізації ідентифікаторів моделей |
    | `plugin-sdk/provider-catalog-live-runtime` | Допоміжні засоби актуального каталогу моделей провайдера для захищеного виявлення на зразок `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, фільтрування ідентифікаторів моделей, кеш TTL і статичний резервний варіант |
    | `plugin-sdk/provider-catalog-runtime` | Хук середовища виконання для розширення каталогу провайдера та точки інтеграції реєстру провайдерів плагінів для перевірок контрактів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/можливостей кінцевих точок провайдера, помилки HTTP провайдера та допоміжні засоби multipart-форм для транскрибування аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору веботримання, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера веботримання |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних вебпошуку для провайдерів, яким не потрібне підключення активації плагіна |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних вебпошуку, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також засоби встановлення/отримання облікових даних у межах області дії |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/середовища виконання провайдера вебпошуку |
    | `plugin-sdk/embedding-providers` | Загальні типи провайдерів вбудовування та допоміжні засоби читання, зокрема `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` і `listEmbeddingProviders(...)`; плагіни реєструють провайдерів через `api.registerEmbeddingProvider(...)`, щоб забезпечити дотримання належності маніфесту |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, а також очищення схем і діагностика DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Типи знімків використання провайдера, спільні допоміжні засоби отримання даних про використання та засоби отримання даних від провайдерів, як-от `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків, сумісність викликів інструментів у вигляді звичайного тексту та спільні допоміжні засоби обгорток Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Загальнодоступні спільні допоміжні засоби обгорток потоків провайдерів, зокрема `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, а також утиліти потоків, сумісних з Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Власні допоміжні засоби транспорту провайдера, як-от захищене отримання, видобування тексту результатів інструментів, перетворення транспортних повідомлень і доступні для запису потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби внесення змін до конфігурації початкового налаштування |
    | `plugin-sdk/global-singleton` | Допоміжні засоби локальних для процесу одиночних екземплярів/мап/кешів |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації груп і розбору команд |
  </Accordion>

Знімки використання провайдера зазвичай містять одне або кілька вікон квоти `windows`, кожне з
міткою, відсотком використання та необов’язковим часом скидання. Провайдери, які замість
вікон квоти зі скиданням надають текст про баланс або стан облікового запису, мають повертати
`summary` із порожнім масивом `windows`, а не вигадувати відсоткові значення.
OpenClaw показує цей підсумковий текст у виведенні стану; використовуйте `error`, лише якщо
кінцева точка використання завершилася помилкою або не повернула придатних даних про використання.

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | Застаріла широка поверхня авторизації команд (`resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, і допоміжні засоби авторизації відправника); використовуйте авторизацію на вході каналу/в середовищі виконання або допоміжні засоби стану команд |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілів/фільтрів власного затвердження виконання |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки власного затвердження |
    | `plugin-sdk/approval-gateway-runtime` | Спільний визначник Gateway затвердження |
    | `plugin-sdk/approval-reference-runtime` | Детермінований допоміжний засіб стійкого локатора для обмежених транспортом зворотних викликів затвердження |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні засоби завантаження адаптерів власного затвердження для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби середовища виконання обробників затвердження; віддавайте перевагу вужчим точкам інтеграції адаптера/Gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби власної цілі затвердження, прив’язки облікового запису, шлюзу маршруту, резервного пересилання та приглушення локального власного запиту на затвердження виконання |
    | `plugin-sdk/approval-reaction-runtime` | Жорстко задані прив’язки реакцій затвердження, корисні навантаження запитів реакцій, сховища цілей реакцій, допоміжні засоби тексту підказок реакцій та експорт сумісності для приглушення локального власного запиту на затвердження виконання |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби корисного навантаження відповіді на затвердження виконання/плагіна |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби корисного навантаження затвердження виконання/плагіна, конструктори можливостей затвердження, допоміжні засоби автентифікації/профілю затвердження, допоміжні засоби маршрутизації/середовища виконання власного затвердження та допоміжні засоби структурованого відображення затвердження, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Застарілі вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/command-auth-native` | Власна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби цілей власних сеансів |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команди та поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Допоміжні засоби відкладеного потоку входу для автентифікації провайдера в приватному каналі та сполучення Web UI за кодом пристрою |
    | `plugin-sdk/channel-secret-runtime` | Застаріла широка поверхня контракту секретів (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, типи цілей секретів); віддавайте перевагу спеціалізованим підшляхам нижче |
    | `plugin-sdk/channel-secret-basic-runtime` | Вузькі експорти контракту секретів і конструктори реєстру цілей для поверхонь секретів каналів/плагінів, не пов’язаних із TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Вузькі допоміжні засоби призначення вкладених секретів TTS каналу |
    | `plugin-sdk/secret-ref-runtime` | Вузька типізація SecretRef, визначення та пошук шляху цілі плану для контракту секретів/розбору конфігурації |
    | `plugin-sdk/secret-provider-integration` | Контракти лише типів для маніфесту інтеграції провайдера SecretRef і наборів параметрів для плагінів, які публікують зовнішні набори параметрів провайдерів секретів |
    | `plugin-sdk/security-runtime` | Застарілий широкий агрегувальний модуль для довіри, шлюзу прямих повідомлень, обмежених коренем допоміжних засобів файлів/шляхів, зокрема записів лише зі створенням, синхронної/асинхронної атомарної заміни файлів, записів у сусідні тимчасові файли, резервного переміщення між пристроями, допоміжних засобів приватного файлового сховища, захисту від батьківських символічних посилань, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і допоміжних засобів збирання секретів; віддавайте перевагу спеціалізованим підшляхам безпеки/SSRF/секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби списку дозволених хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби закріпленого диспетчера без широкої поверхні середовища виконання інфраструктури |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби закріпленого диспетчера, захищеного від SSRF отримання, помилок SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введених секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів/цілей Webhook і приведення необробленого websocket/тіла |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру/тайм-ауту тіла запиту та `runDetachedWebhookWork` для відстежуваного опрацювання після підтвердження |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Допоміжні засоби середовища виконання, журналювання й резервного копіювання, попередження про шляхи встановлення плагінів і допоміжні засоби процесів |
    | `plugin-sdk/runtime-env` | Вузькоспеціалізовані допоміжні засоби для змінних середовища виконання, журналювання, тайм-аутів, повторних спроб і затримок між ними |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю та стандартних значень, розбору URL-адрес CDP і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/agent-harness-task-runtime` | Універсальні допоміжні засоби життєвого циклу завдань і доставлення результатів виконання для агентів на основі каркаса, що використовують видану хостом область завдання |
    | `plugin-sdk/codex-mcp-projection` | Зарезервований вбудований допоміжний засіб Codex для проєктування користувацької конфігурації сервера MCP у конфігурацію потоку Codex; не для сторонніх плагінів |
    | `plugin-sdk/codex-native-task-runtime` | Локальний для репозиторію вбудований допоміжний засіб Codex для підключення нативного дзеркала завдань і середовища виконання; не є експортом пакета |
    | `plugin-sdk/channel-runtime-context` | Універсальні допоміжні засоби реєстрації та пошуку контексту середовища виконання каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові плагіни мають імпортувати `plugin-sdk/run-command` безпосередньо |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові плагіни мають імпортувати універсальні підшляхи SDK безпосередньо |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Застарілий широкий модуль реекспорту для допоміжних засобів команд, хуків, HTTP та інтерактивної взаємодії плагінів; віддавайте перевагу спеціалізованим підшляхам середовища виконання плагінів |
    | `plugin-sdk/hook-runtime` | Застарілий широкий модуль реекспорту для допоміжних засобів конвеєра вебхуків і внутрішніх хуків; віддавайте перевагу спеціалізованим підшляхам середовища виконання хуків і плагінів |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби відкладеного імпорту й прив’язування середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/node-host` | Допоміжні засоби визначення виконуваних файлів на хості Node і відновлення PTY |
    | `plugin-sdk/cli-runtime` | Застарілий широкий модуль реекспорту для форматування CLI, очікування, версій, виклику з аргументами та відкладених груп команд; віддавайте перевагу спеціалізованим підшляхам CLI і середовища виконання |
    | `plugin-sdk/qa-runner-runtime` | Підтримуваний фасад, що надає сценарії контролю якості плагінів через інтерфейс команд CLI |
    | `plugin-sdk/tts-runtime` | Підтримуваний фасад для схем конфігурації синтезу мовлення та допоміжних засобів середовища виконання |
    | `plugin-sdk/gateway-method-runtime` | Зарезервований допоміжний засіб диспетчеризації методів Gateway для HTTP-маршрутів плагінів, які оголошують `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, допоміжний засіб запуску клієнта після готовності циклу подій, RPC Gateway для CLI, помилки протоколу Gateway, визначення оголошеної адреси хоста LAN і допоміжні засоби оновлення стану каналу |
    | `plugin-sdk/config-contracts` | Спеціалізована конфігураційна поверхня лише з типами для форм конфігурації плагінів, як-от `OpenClawConfig`, а також типів конфігурації каналів і провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби конфігурації плагінів у середовищі виконання, як-от `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Спільні рядки підказок метаданих доставлення для інструмента повідомлень |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і тестові засоби встановлення знімків |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого текстового модуля реекспорту |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби середовища виконання для вхідних повідомлень і відповідей, поділ на фрагменти, диспетчеризація, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькоспеціалізовані допоміжні засоби диспетчеризації та завершення відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби короткочасної історії відповідей. Новий код обробки циклів повідомлень має використовувати `createChannelHistoryWindow`; низькорівневі допоміжні засоби мап залишаються лише застарілими експортами сумісності |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькоспеціалізовані допоміжні засоби поділу тексту й Markdown на фрагменти |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби робочого процесу сеансів (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), допоміжні засоби відновлення та життєвого циклу (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), допоміжні засоби маркерів для перехідних значень `sessionFile`, обмежене читання нещодавнього тексту стенограми користувача й асистента за ідентичністю сеансу, допоміжні засоби шляху до сховища сеансів і ключа сеансу, а також читання часу оновлення без широких імпортів запису й обслуговування конфігурації |
    | `plugin-sdk/session-transcript-runtime` | Ідентичність стенограми, допоміжні засоби визначення цілі, читання та запису в межах області, проєктування видимих записів повідомлень, публікація оновлень, блокування запису й ключі влучень у пам’ять стенограми |
    | `plugin-sdk/sqlite-runtime` | Спеціалізовані допоміжні засоби схеми агента SQLite, шляхів і транзакцій для власного середовища виконання без керування життєвим циклом бази даних |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху, завантаження та збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів стану та OAuth |
    | `plugin-sdk/plugin-state-runtime` | Типи ключового стану SQLite для побічних процесів плагінів, а також централізовані параметри підключення, перевірене обслуговування WAL і допоміжні засоби атомарної міграції STRICT-схем для баз даних, що належать плагінам |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язування маршрутів, ключів сеансів і облікових записів, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення стану каналів і облікових записів, стандартні значення стану середовища виконання та допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації слагів і рядків |
    | `plugin-sdk/request-url` | Видобування рядкових URL-адрес із вхідних даних, подібних до fetch або запиту |
    | `plugin-sdk/run-command` | Засіб запуску команд з обмеженням часу та нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні засоби читання параметрів інструментів і CLI |
    | `plugin-sdk/tool-plugin` | Визначення простого типізованого плагіна інструмента агента та надання статичних метаданих для генерування маніфесту |
    | `plugin-sdk/tool-payload` | Видобування нормалізованих корисних навантажень з об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Видобування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/sandbox` | Типи бекенду пісочниці та допоміжні засоби команд SSH/OpenShell, зокрема попередня перевірка команд виконання зі швидким припиненням у разі помилки |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів для тимчасових завантажень і приватні захищені тимчасові робочі простори |
    | `plugin-sdk/logging-core` | Допоміжні засоби журналювання підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі та сеансу, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби визначення конфігурації провайдера розмовного режиму |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання та запису стану JSON |
    | `plugin-sdk/json-unsafe-integers` | Допоміжні засоби розбору JSON, що зберігають небезпечні цілочисельні літерали як рядки |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового кешу дедуплікації |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби середовища виконання, сеансів і диспетчеризації відповідей ACP |
    | `plugin-sdk/acp-runtime-backend` | Легковагові допоміжні засоби реєстрації бекенду ACP і диспетчеризації відповідей для плагінів, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язування ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Застарілі примітиви схеми конфігурації середовища виконання агента; імпортуйте примітиви схеми з підтримуваної поверхні, що належить плагіну |
    | `plugin-sdk/boolean-param` | Засіб читання булевого параметра з нечітким розпізнаванням |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби початкового налаштування пристрою й токенів сполучення, зокрема `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, стану та фонового проксі |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповідей команд і провайдерів `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру, побудови та серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довірених плагінів для низькорівневих каркасів агентів: типи каркаса, допоміжні засоби коригування та переривання активного запуску, допоміжні засоби мосту інструментів OpenClaw, допоміжні засоби політики інструментів плану середовища виконання, класифікація результатів термінала, допоміжні засоби форматування й деталізації перебігу роботи інструментів та утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Застарілий фасад визначення кінцевих точок, що належить провайдеру Z.AI; використовуйте публічний API плагіна Z.AI |
    | `plugin-sdk/async-lock-runtime` | Локальний для процесу допоміжний засіб асинхронного блокування невеликих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеження паралельності асинхронних завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам’яті та з постійним сховищем |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб спорожнення черги вихідних доставлень, що очікують |
    | `plugin-sdk/file-access-runtime` | Безпечні допоміжні засоби шляхів до локальних файлів і джерел медіаданих |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби пробудження, подій і видимості Heartbeat |
    | `plugin-sdk/expect-runtime` | Допоміжний засіб перевірки обов’язкового значення для доведених інваріантів середовища виконання |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби захищених токенів і UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/exec-approvals-runtime` | Допоміжні засоби файлів політики схвалення виконання без широкого модуля реекспорту інфраструктури середовища виконання |
    | `plugin-sdk/infra-runtime` | Застарілий адаптер сумісності; використовуйте спеціалізовані підшляхи середовища виконання вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців, подій і контексту трасування |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування та спільної класифікації помилок, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, проксі, параметрів EnvHttpProxyAgent і закріпленого пошуку |
    | `plugin-sdk/runtime-fetch` | Fetch середовища виконання з урахуванням диспетчера без імпортів проксі та захищеного fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Допоміжні засоби очищення URL-адрес даних вбудованих зображень і визначення сигнатур без широкої поверхні середовища виконання медіаданих |
    | `plugin-sdk/response-limit-runtime` | Засоби читання тіла відповіді з обмеженнями за кількістю байтів, часом простою та кінцевим терміном без широкої поверхні середовища виконання медіаданих |
    | `plugin-sdk/session-binding-runtime` | Стан прив’язування поточної розмови без налаштованої маршрутизації прив’язувань або сховищ сполучення |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту й фільтрування додаткового контексту без широких імпортів конфігурації та безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькоспеціалізовані примітивні допоміжні засоби приведення й нормалізації записів і рядків без імпортів Markdown та журналювання |
    | `plugin-sdk/html-entity-runtime` | Однопрохідне декодування HTML5-сутностей, завершених крапкою з комою, без широких текстових утиліт |
    | `plugin-sdk/text-utility-runtime` | Низькорівневі допоміжні засоби для тексту та шляхів, зокрема екранування п’яти HTML-сутностей |
    | `plugin-sdk/widget-html` | Виявлення повного документа, перевірка розміру й помилки вхідних даних інструментів для самодостатніх HTML-віджетів |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації імен хостів і хостів SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації та виконання повторних спроб |
    | `plugin-sdk/agent-runtime` | Застарілий широкий модуль реекспорту для допоміжних засобів каталогів, ідентичності та робочих просторів агентів, зокрема `resolveAgentDir`, `resolveDefaultAgentDir` і застарілого експорту сумісності `resolveOpenClawAgentDir`; віддавайте перевагу спеціалізованим підшляхам агентів і середовища виконання |
    | `plugin-sdk/directory-runtime` | Запит і дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Застарілий широкий модуль експорту медіа, що включає `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` і застарілий `fetchRemoteMedia`; натомість використовуйте `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` і підшляхи середовища виконання можливостей, а коли URL має стати медіа OpenClaw, перед зчитуванням буфера віддавайте перевагу допоміжним функціям сховища |
    | `plugin-sdk/media-mime` | Вузькоспеціалізовані допоміжні функції для нормалізації MIME, зіставлення розширень файлів, визначення MIME й типів медіа |
    | `plugin-sdk/media-store` | Вузькоспеціалізовані допоміжні функції сховища медіа, як-от `saveMediaBuffer` і `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції резервного перемикання для генерування медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розпізнавання медіа, а також орієнтовані на провайдери експорти допоміжних функцій для зображень, аудіо й структурованого видобування |
    | `plugin-sdk/text-chunking` | Поділ вихідного тексту на фрагменти й діапазони зі збереженням зміщень, поділ Markdown на фрагменти та допоміжні функції рендерингу, токенізація HTML-тегів з урахуванням лапок, перетворення таблиць Markdown, видалення тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також орієнтовані на провайдери експорти директив, реєстру, перевірки, конструктора TTS, сумісного з OpenAI, і допоміжних функцій мовлення |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, реєстр, директива, нормалізація й експорти допоміжних функцій мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрибування в реальному часі, допоміжні функції реєстру та спільна допоміжна функція сеансу WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Допоміжна функція початкового налаштування профілю реального часу для обмеженого впровадження контексту `IDENTITY.md`, `USER.md` і `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосового зв’язку в реальному часі, допоміжні функції реєстру та спільні допоміжні функції поведінки голосового зв’язку в реальному часі, зокрема відстеження активності виведення |
    | `plugin-sdk/image-generation` | Типи провайдерів генерування зображень, допоміжні функції для ресурсів зображень і URL-адрес даних, а також конструктор провайдера зображень, сумісного з OpenAI |
    | `plugin-sdk/image-generation-core` | Спільні типи, резервне перемикання, автентифікація й допоміжні функції реєстру для генерування зображень |
    | `plugin-sdk/music-generation` | Типи провайдера, запиту й результату генерування музики |
    | `plugin-sdk/music-generation-core` | Застарілі спільні типи генерування музики, допоміжні функції резервного перемикання, пошук провайдера й аналіз посилань на модель; віддавайте перевагу поверхням музичних провайдерів, що належать плагінам |
    | `plugin-sdk/video-generation` | Типи провайдера, запиту й результату генерування відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерування відео, допоміжні функції резервного перемикання, пошук провайдера й аналіз посилань на модель |
    | `plugin-sdk/transcripts` | Спільні типи провайдерів джерел транскриптів, допоміжні функції реєстру, дескриптори сеансів і метадані висловлювань |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні функції встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Спільні допоміжні функції віддаленого й локального завантаження медіа |
    | `plugin-sdk/zod` | Застарілий повторний експорт для сумісності; імпортуйте `zod` безпосередньо з `zod` |
    | `plugin-sdk/plugin-test-api` | Мінімальна локальна для репозиторію допоміжна функція `createTestPluginApi` для модульних тестів прямої реєстрації плагінів без імпорту мостів до тестових допоміжних функцій репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Локальні для репозиторію фікстури контрактів нативного адаптера середовища виконання агента для тестів автентифікації, доставлення, резервного перемикання, перехоплювачів інструментів, накладання запитів, схем і проєкції транскриптів |
    | `plugin-sdk/channel-test-helpers` | Локальні для репозиторію орієнтовані на канали тестові допоміжні функції для загальних контрактів дій, налаштування й стану, перевірок каталогів, життєвого циклу запуску облікового запису, передавання конфігурації надсилання, імітацій середовища виконання, проблем зі станом, вихідного доставлення та реєстрації перехоплювачів |
    | `plugin-sdk/channel-target-testing` | Локальний для репозиторію спільний набір випадків помилок визначення цілі для тестів каналів |
    | `plugin-sdk/channel-contract-testing` | Локальні для репозиторію вузькоспеціалізовані допоміжні функції тестування контрактів каналів без широкого тестового модуля експорту |
    | `plugin-sdk/plugin-test-contracts` | Локальні для репозиторію допоміжні функції контрактів пакета плагіна, реєстрації, публічних артефактів, прямого імпорту, API середовища виконання й побічних ефектів імпорту |
    | `plugin-sdk/plugin-state-test-runtime` | Локальні для репозиторію тестові допоміжні функції сховища стану плагіна, черги вхідних даних і бази даних стану |
    | `plugin-sdk/provider-test-contracts` | Локальні для репозиторію допоміжні функції контрактів середовища виконання провайдера, автентифікації, виявлення, початкового налаштування, каталогу, майстра, медіаможливостей, політики повторного відтворення, STT аудіо в реальному часі, вебпошуку й отримання даних, а також потокового передавання |
    | `plugin-sdk/provider-http-test-mocks` | Локальні для репозиторію необов’язкові імітації HTTP й автентифікації Vitest для тестів провайдерів, що використовують `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Локальні для репозиторію допоміжні функції для додавання метаданих до фікстур корисного навантаження відповіді |
    | `plugin-sdk/sqlite-runtime-testing` | Локальні для репозиторію допоміжні функції життєвого циклу SQLite для власних тестів |
    | `plugin-sdk/test-fixtures` | Локальні для репозиторію фікстури загального перехоплення середовища виконання CLI, контексту пісочниці, записувача навичок, повідомлень агента, системних подій, перезавантаження модулів, шляхів до вбудованих плагінів, тексту термінала, поділу на фрагменти, токенів автентифікації й типізованих випадків |
    | `plugin-sdk/test-node-mocks` | Локальні для репозиторію цільові допоміжні функції імітації вбудованих модулів Node для використання у фабриках Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Застарілий фасад середовища виконання індексування й пошуку пам’яті; віддавайте перевагу незалежним від постачальника підшляхам хоста пам’яті |
    | `plugin-sdk/memory-core-host-embedding-registry` | Полегшені допоміжні функції реєстру провайдерів векторних подань пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти базового рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти векторних подань хоста пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні функції пакетного й віддаленого оброблення. `registerMemoryEmbeddingProvider` на цій поверхні застарілий; для нових провайдерів використовуйте загальний API провайдера векторних подань. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія зберігання хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Застарілі мультимодальні допоміжні функції хоста пам’яті; віддавайте перевагу незалежним від постачальника підшляхам хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Застарілі допоміжні функції запитів хоста пам’яті; віддавайте перевагу незалежним від постачальника підшляхам хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції стану хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції середовища виконання CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні допоміжні функції середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів і середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Незалежний від постачальника псевдонім основних допоміжних функцій середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Незалежний від постачальника псевдонім допоміжних функцій журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції керованого Markdown для плагінів, пов’язаних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад середовища виконання Active Memory для доступу до диспетчера пошуку |
    | `plugin-sdk/memory-host-status` | Застарілий псевдонім сумісності; використовуйте `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи допоміжних функцій вбудованих плагінів">
    Зарезервовані підшляхи SDK допоміжних функцій вбудованих плагінів — це вузькі
    поверхні для коду вбудованих плагінів, що належать конкретним власникам.
    Їх відстежують в інвентарі SDK, щоб збирання пакетів і створення псевдонімів
    залишалися детермінованими, але вони не є загальними API для розроблення
    плагінів. Нові повторно використовувані контракти хоста мають застосовувати
    загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` і
    `plugin-sdk/plugin-config-runtime`.

    | Підшлях | Власник і призначення |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Допоміжна функція вбудованого плагіна Codex для проєктування користувацької конфігурації сервера MCP у конфігурацію потоку сервера застосунку Codex (зарезервований експорт пакета) |
    | `plugin-sdk/codex-native-task-runtime` | Допоміжна функція вбудованого плагіна Codex для віддзеркалення нативних субагентів сервера застосунку Codex у стан завдань OpenClaw (лише локальна для репозиторію, не є експортом пакета) |

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Огляд SDK плагінів](/uk/plugins/sdk-overview)
- [Налаштування SDK плагінів](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
