---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібна довідка з усіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпортів, довідка з API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-22T18:24:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bfe442b41b41c03081e4a206ede6b8ae62b920096a69cf46d5843f2217e4a6c
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugin і ядром. Ця сторінка —
довідник з **того, що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте покроковий посібник?**
  - Перший plugin? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Channel plugin? Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Provider plugin? Див. [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для допоміжних функцій
побудови/точок входу, специфічних для channel, надавайте перевагу
`openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої поверхні-парасольки та спільних допоміжних функцій, таких як
`buildChannelConfigSchema`.

Не додавайте й не використовуйте зручні seams з назвами provider, наприклад
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні seams із брендуванням channel. Вбудовані plugin мають компонувати
загальні підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а
ядро має або використовувати ці локальні для plugin barrel-файли, або додавати
вузький загальний контракт SDK, коли потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних seams для
вбудованих plugin, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності вбудованих plugin; їх
навмисно пропущено в загальній таблиці нижче, і вони не є рекомендованим
шляхом імпорту для нових сторонніх plugin.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи для вбудованих plugin усе ще з’являються в
цьому згенерованому списку. Вважайте їх деталями реалізації/поверхнями
сумісності, якщо сторінка документації явно не просуває якийсь із них як
публічний.

### Точка входу plugin

| Subpath                     | Ключові експорти                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи Channel">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, підказки allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції для конфігурації/контролю дій мультиакаунтів, допоміжні функції резервного переходу до акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку акаунта + резервного переходу до акаунта за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції для списку акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схем конфігурації channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram із резервним переходом до вбудованого контракту |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні функції життєвого циклу/фіналізації чернетки потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції побудови вхідних маршрутів і envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису та диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідної ідентичності, делегата надсилання та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу прив’язок потоків і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіа-payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки conversation/thread, pairing і налаштованих binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення group-policy під час виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції знімка/підсумку статусу channel |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації channel |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації channel |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції читання/редагування конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції авторизації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні функції інтерактивних відповідей. Див. [Message Presentation](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для debounce вхідних повідомлень, зіставлення згадок, допоміжних функцій mention-policy і envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції mention-policy без ширшої поверхні runtime для вхідних повідомлень |
    | `plugin-sdk/channel-location` | Допоміжні функції контексту та форматування розташування channel |
    | `plugin-sdk/channel-logging` | Допоміжні функції журналювання channel для скидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій із повідомленнями channel, а також застарілі допоміжні функції native schema, збережені для сумісності plugin |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту channel |
    | `plugin-sdk/channel-feedback` | Підключення відгуків/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції контракту секретів, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи Provider">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локального/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted provider, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-key під час виконання для provider plugin |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу API-key/запису профілю, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для provider plugin |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку env var для автентифікації provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні функції endpoint provider і нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції можливостей HTTP/endpoint для provider |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування web-fetch provider |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для provider, яким не потрібне підключення ввімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/runtime для web-search provider |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні функції обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Власні допоміжні функції транспорту provider, такі як guarded fetch, перетворення транспортних повідомлень і потоки подій транспорту для запису |
    | `plugin-sdk/provider-onboard` | Допоміжні функції патчу конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення того, хто схвалює, і авторизації дій у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Власні допоміжні функції профілю/фільтра схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Власні адаптери можливостей/доставки схвалення |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція визначення Gateway для схвалення |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагі допоміжні функції завантаження власного адаптера схвалення для гарячих точок входу channel |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні функції runtime обробника схвалення; надавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Власні допоміжні функції цілі схвалення + прив’язки акаунта |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді для схвалення exec/plugin |
    | `plugin-sdk/command-auth-native` | Власна автентифікація команд + власні допоміжні функції target сесії |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-surface` | Допоміжні функції нормалізації тіла команди та surface команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збору secret-contract для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції типізації `coerceSecretRef` і SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, шлюзу DM, зовнішнього вмісту та збору секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції pinned-dispatcher без широкої surface runtime інфраструктури |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned-dispatcher, fetch із захистом SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції runtime/журналювання/резервного копіювання/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні функції реєстрації та пошуку runtime-context channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції команд/хуків/http/інтерактивності plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції pipeline Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції лінивого імпорту/прив’язки runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта Gateway і патчів статусу channel |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли surface контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні функції схвалення exec/plugin, побудовники можливостей схвалення, допоміжні функції auth/profile, власні допоміжні функції маршрутизації/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції runtime для вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize для відповідей |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції short-window історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху session store + `updated-at` |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції маршрутизації/ключа сесії/прив’язки акаунта, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції підсумку статусу channel/акаунта, типові значення state runtime і допоміжні функції метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із вводів, подібних до fetch/request |
    | `plugin-sdk/run-command` | Виконувач команд із таймуванням та нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload із об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні функції logger підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні функції повторно-вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції dedupe-кешу з дисковим зберіганням |
    | `plugin-sdk/acp-runtime` | Допоміжні функції runtime/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції визначення збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції початкового налаштування пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних функцій пасивного channel, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції відповіді command/provider для `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні функції реєстру/побудови/серіалізації власних команд |
    | `plugin-sdk/agent-harness` | Експериментальна surface trusted-plugin для низькорівневих agent harness: типи harness, допоміжні функції steer/abort активного запуску, допоміжні функції мосту tool OpenClaw і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні функції системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні функції класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні функції fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач тіла відповіді з обмеженням без широкої surface runtime медіа |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації налаштованих binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції читання session store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Допоміжні функції визначення видимості контексту та фільтрації додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні функції приведення й нормалізації примітивних record/рядків без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і виконувача retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/усунення дублікатів каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store для медіа, а також побудовники media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи provider для розуміння медіа, а також орієнтовані на provider експорти допоміжних функцій для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції text/markdown/logging, такі як видалення видимого для асистента тексту, допоміжні функції render/chunking/table для markdown, допоміжні функції редагування чутливих даних, directive-tag helpers і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech provider, а також орієнтовані на provider допоміжні функції directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні допоміжні функції типів, registry, directive і normalization для speech provider |
    | `plugin-sdk/realtime-transcription` | Типи provider для realtime transcription і допоміжні функції registry |
    | `plugin-sdk/realtime-voice` | Типи provider для realtime voice і допоміжні функції registry |
    | `plugin-sdk/image-generation` | Типи provider для генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні допоміжні функції типів, failover, auth і registry для генерації зображень |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні допоміжні функції типів, failover, пошуку provider і розбору model-ref для генерації музики |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні допоміжні функції типів, failover, пошуку provider і розбору model-ref для генерації відео |
    | `plugin-sdk/webhook-targets` | Допоміжні функції реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Вбудована допоміжна surface `memory-core` для допоміжних функцій manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти рушія foundation для хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding для хоста Memory, доступ до registry, локальний provider і загальні допоміжні функції batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD для хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища для хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні функції хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції runtime CLI хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні функції основного runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для допоміжних функцій основного runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних функцій журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних функцій файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції керованого markdown для plugin, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних функцій статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Вбудована допоміжна surface `memory-lancedb` |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні функції підтримки вбудованого browser plugin (`browser-support` залишається barrel сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Допоміжна/runtime surface вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Допоміжна/runtime surface вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Допоміжна surface вбудованого IRC |
    | Допоміжні функції, специфічні для Channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Поверхні сумісності/допоміжних функцій вбудованих channel |
    | Допоміжні функції, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Поверхні допоміжних функцій вбудованих можливостей/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                           |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)             |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend inference для CLI   |
| `api.registerChannel(...)`                       | Канал повідомлень                     |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова realtime transcription       |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні сесії realtime voice         |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                       |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape           |
| `api.registerWebSearchProvider(...)`             | Пошук у вебі                          |

### Tools і команди

| Method                          | Що реєструє                                 |
| ------------------------------- | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)        |

### Інфраструктура

| Method                                          | Що реєструє                             |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук подій                               |
| `api.registerHttpRoute(params)`                 | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                       |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                          |
| `api.registerService(service)`                  | Фонова служба                           |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрика extension embedded-runner для Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивна секція prompt, суміжна з memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний corpus пошуку/читання memory  |

Зарезервовані простори імен адміністратора ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область видимості методу Gateway. Для методів, що належать plugin,
надавайте перевагу префіксам, специфічним для plugin.

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin потрібен
власний для Pi таймінг подій під час embedded-запусків OpenClaw, наприклад
асинхронні переписування `tool_result`, які мають відбутися до того, як буде
виведено фінальне повідомлення результату tool. Сьогодні це seam вбудованих plugin:
зареєструвати її можуть лише вбудовані plugin, і вони мають оголосити
`contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Для всього, що не потребує цього нижчорівневого seam,
залишайтеся на звичайних хуках plugin OpenClaw.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для кореневої довідки CLI,
  маршрутизації та лінивої реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною у звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що експонується цим
registrar.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Керування акаунтами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація кореневого CLI.
Цей eager-шлях сумісності залишається підтримуваним, але він не встановлює
заповнювачі на основі descriptor для лінивого завантаження на етапі парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає plugin змогу володіти типовою конфігурацією для локального
AI CLI backend, такого як `codex-cli`.

- `id` backend стає префіксом provider у model ref, наприклад `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  типового значення plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати додавання до prompt. |
| `api.registerMemoryCapability(capability)` | Єдину можливість memory                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції prompt для memory                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання memory                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime memory                                                                                                                                    |

### Адаптери embedding для memory

| Method                                         | Що реєструє                                        |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного plugin |

- `registerMemoryCapability` — це пріоритетний API ексклюзивного memory-plugin.
- `registerMemoryCapability` також може експонувати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugin могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватної
  структури конкретного memory plugin.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застаріло-сумісні API ексклюзивного memory-plugin.
- `registerMemoryEmbeddingProvider` дає активному memory plugin змогу зареєструвати один
  або кілька id адаптерів embedding (наприклад `openai`, `gemini` або користувацький id,
  визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек визначення прив’язки conversation |

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як і пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як і пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере на себе dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як і пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного thread/topic. `metadata` залишайте для додаткових даних, специфічних для channel.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId` перед тим, як переходити до специфічного для channel `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID plugin                                                                                  |
| `api.name`               | `string`                  | Відображувана назва                                                                        |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                     |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                   |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime в пам’яті, коли доступний)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація plugin із `plugins.entries.<id>.config`, специфічна для plugin                |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні функції runtime](/uk/plugins/sdk-runtime)                                          |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легковаге вікно запуску/налаштування до повного входу |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin                                                    |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Фасадно завантажувані публічні поверхні вбудованих plugin (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні файли входу) тепер надають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до визначеного файлу конфігурації на диску.

Provider plugin також можуть експонувати вузький локальний barrel контракту plugin, коли
допоміжна функція навмисно є специфічною для provider і ще не належить до загального
підшляху SDK. Поточний вбудований приклад: provider Anthropic зберігає свої
допоміжні функції потоків Claude у власному публічному seam `api.ts` / `contract-api.ts`
замість просування логіки beta-header Anthropic і `service_tier` до загального
контракту `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує побудовники provider,
  допоміжні функції типових моделей і побудовники realtime provider
- `@openclaw/openrouter-provider`: `api.ts` експортує побудовник provider, а також
  допоміжні функції онбордингу/конфігурації

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо якась допоміжна функція справді є спільною, просуньте її до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливість, замість жорсткого зв’язування двох plugin.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — тестові утиліти та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — поглиблена архітектура та модель можливостей
