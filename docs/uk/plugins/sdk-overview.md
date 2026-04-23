---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-23T02:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947f309c36e0a4d9c20639f5e18bc1b9d9e07af333414741ad36f24017716ae1
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugins і core. Ця сторінка є
довідником щодо **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
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

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий
запуск і запобігає проблемам із циклічними залежностями. Для специфічних для channel
допоміжних засобів входу/збирання надавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої узагальнювальної поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Не додавайте і не використовуйте зручні seams з назвами providers, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні seams із брендуванням channel. Вбудовані plugins мають компонувати узагальнені
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а core
має або використовувати ці локальні для plugin barrel-файли, або додавати вузький узагальнений SDK
контракт, коли потреба справді є міжканальною.

Згенерована карта експорту все ще містить невеликий набір допоміжних
seams для вбудованих plugins, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для супроводу вбудованих plugins і сумісності; їх
навмисно пропущено в поширеній таблиці нижче, і вони не є рекомендованим
шляхом імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи для вбудованих plugins усе ще з’являються в цьому
згенерованому списку. Розглядайте їх як деталі реалізації/поверхні сумісності, якщо лише сторінка документації
явно не просуває один із них як публічний.

### Вхід plugin

| Subpath                     | Ключові експорти                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи channel">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, підказки allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби multi-account config/action-gate, допоміжні засоби резервного варіанта облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук облікового запису + допоміжні засоби резервного варіанта за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервним варіантом контракту вбудованого plugin |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації потоку чернетки |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршрутизації вхідних даних і побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної ідентичності, делегата надсилання та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок thread і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіа-payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки conversation/thread, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення group-policy у runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/зведення статусу channel |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації channel |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації channel |
    | `plugin-sdk/channel-plugin-common` | Спільні експортовані елементи prelude для channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби ухвалення рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для прямого DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивних відповідей. Див. [Message Presentation](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Барель сумісності для debounce вхідних даних, зіставлення mention, допоміжних засобів mention-policy та допоміжних засобів envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy без ширшої поверхні runtime вхідних даних |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту та форматування розташування channel |
    | `plugin-sdk/channel-logging` | Допоміжні засоби журналювання channel для відкидання вхідних даних і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями channel, а також застарілі допоміжні засоби native schema, збережені для сумісності plugin |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контрактів channel |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей secret |
  </Accordion>

  <Accordion title="Підшляхи provider">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локального/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted provider, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням backend CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-key у runtime для provider plugins |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-key, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату auth OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для provider plugins |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env-var для auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби endpoint provider і допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Узагальнені допоміжні засоби HTTP/можливостей endpoint provider |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби contract config/selection для web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування provider для web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credential для web-search для providers, яким не потрібне підключення enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби contract config/credential для web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і засоби встановлення/отримання credential з областю дії |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime provider для web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту provider, такі як guarded fetch, перетворення транспортних повідомлень і потоки подій транспорту з можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби виправлення конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень command/help, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і auth для дій у тому самому chat |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки native approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні засоби завантаження адаптера native approval для гарячих entrypoint channel |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime обробника approval; надавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Допоміжні засоби native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби типізації `coerceSecretRef` і SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, external-content і збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для allowlist хостів і приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення secret |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Узагальнені допоміжні засоби реєстрації та пошуку runtime-context channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби command/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway і виправлення статусу channel |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису config і пошуку config plugin |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назви/опису команди Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, побудовники можливостей approval, допоміжні засоби auth/profile, допоміжні засоби native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, chunking, dispatch, Heartbeat, планувальник відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби reply-history для короткого вікна, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язки route/session-key/account, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення статусу channel/account, значення runtime-state за замовчуванням і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягування рядкових URL із вхідних даних типу fetch/request |
    | `plugin-sdk/run-command` | Timed runner команд із нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені засоби читання параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe зберігання на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий засіб читання boolean param |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів dangerous-name |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токена pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді provider для команди `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, допоміжні засоби steer/abort для active-run, допоміжні засоби мосту інструментів OpenClaw і утиліти результатів attempt |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби прапорців і подій діагностики |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби wrapped fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Засіб читання обмеженого body відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації налаштованих binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби читання session-store без широких імпортів запису/обслуговування config |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і хоста SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби config retry і runner retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/усунення дублікатів каталогу на основі config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також побудовники media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover генерації медіа, вибір candidate і повідомлення про відсутню model |
    | `plugin-sdk/media-understanding` | Типи provider для розуміння медіа, а також експорти допоміжних засобів image/audio для provider |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, такі як видалення assistant-visible-text, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування, допоміжні засоби directive-tag і утиліти safe-text |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи provider для speech, а також допоміжні засоби directive, registry і validation для provider |
    | `plugin-sdk/speech-core` | Спільні типи provider для speech, допоміжні засоби registry, directive і normalizaton |
    | `plugin-sdk/realtime-transcription` | Типи provider для realtime transcription, допоміжні засоби registry і спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи provider для realtime voice і допоміжні засоби registry |
    | `plugin-sdk/image-generation` | Типи provider для генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошук provider і розбір model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошук provider і розбір model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів вбудованого memory-core для manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до registry, локальний provider і узагальнені пакетні/віддалені допоміжні засоби |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Вендорно-нейтральний псевдонім для допоміжних засобів core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Вендорно-нейтральний псевдонім для допоміжних засобів журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Вендорно-нейтральний псевдонім для допоміжних засобів файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для plugins, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до manager пошуку |
    | `plugin-sdk/memory-host-status` | Вендорно-нейтральний псевдонім для допоміжних засобів статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів вбудованого memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи допоміжних засобів для вбудованих plugins">
    | Family | Поточні підшляхи | Призначене використання |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки вбудованого browser plugin (`browser-support` залишається barrel сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів вбудованого IRC |
    | Допоміжні засоби, специфічні для channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Поверхні сумісності/допоміжних засобів вбудованих channel |
    | Допоміжні засоби, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Поверхні допоміжних засобів вбудованих функцій/plugins; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                          |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Виведення тексту (LLM)               |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend виведення CLI      |
| `api.registerChannel(...)`                       | Канал повідомлень                    |
| `api.registerSpeechProvider(...)`                | Text-to-speech / синтез STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в realtime     |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні сеанси голосу в realtime   |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео         |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                  |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                     |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                      |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape          |
| `api.registerWebSearchProvider(...)`             | Вебпошук                             |

### Інструменти та команди

| Method                          | Що реєструє                                 |
| ------------------------------- | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)        |

### Інфраструктура

| Method                                          | Що реєструє                            |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук події                              |
| `api.registerHttpRoute(params)`                 | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                      |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                         |
| `api.registerService(service)`                  | Фонова служба                          |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                 |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрика extension вбудованого runner для Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивна секція prompt, суміжна з memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний corpus пошуку/читання memory |

Зарезервовані простори назв admin у core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область методу Gateway. Для методів, що належать plugin,
надавайте перевагу префіксам, специфічним для plugin.

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin потребує нативного для Pi
таймінгу подій під час вбудованих запусків OpenClaw, наприклад для асинхронних переписувань `tool_result`,
які мають відбутися до того, як буде надіслано фінальне повідомлення з результатом інструмента.
Сьогодні це surface для вбудованих plugins: лише вбудовані plugins можуть реєструвати її, і
вони мають оголошувати `contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Залишайте звичайні хук-и OpenClaw plugin для всього,
що не потребує цього низькорівневого seam.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі розбору, що використовуються для кореневої довідки CLI,
  маршрутизації та відкладеної реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася відкладено завантажуваною у звичайному кореневому шляху CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що його відкриває
цей registrar.

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
        description: "Керування обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, коли вам не потрібна відкладена реєстрація кореневого CLI.
Цей eager-шлях сумісності залишається підтримуваним, але він не встановлює
placeholder-и на основі descriptor для відкладеного завантаження на етапі розбору.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає змогу plugin володіти конфігурацією за замовчуванням для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом provider у посиланнях на model, як-от `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значення plugin за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань для сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану можливість memory                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції prompt для memory                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану flush для memory                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для memory                                                                                                                          |

### Адаптери embedding для memory

| Method                                         | Що реєструє                                |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного plugin |

- `registerMemoryCapability` — це пріоритетний API ексклюзивного memory-plugin.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugins могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватного
  layout конкретного memory plugin.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні зі спадщиною API ексклюзивного memory-plugin.
- `registerMemoryEmbeddingProvider` дає змогу активному memory plugin реєструвати один
  або кілька id адаптерів embedding (наприклад, `openai`, `gemini` або користувацький id,
  визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки conversation |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере dispatch на себе, обробники з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація вхідних thread/topic. Залишайте `metadata` для специфічних для channel додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для channel `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні hook-и `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id plugin                                                                                    |
| `api.name`               | `string`                  | Відображувана назва                                                                          |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                                |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                  |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                       |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                     |
| `api.config`             | `OpenClawConfig`          | Поточний знімок config (активний знімок runtime у пам’яті, якщо доступний)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для plugin config з `plugins.entries.<id>.config`                                 |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                             |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin                                                      |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшений entry лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production code. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих plugins, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), тепер надають перевагу
активному знімку config runtime, якщо OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до визначеного config-файлу на диску.

Plugins provider також можуть відкривати вузький локальний barrel контракту plugin, коли
допоміжний засіб навмисно є специфічним для provider і ще не належить до узагальненого підшляху SDK.
Поточний вбудований приклад: provider Anthropic зберігає свої допоміжні засоби потоку Claude
у власному публічному seam `api.ts` / `contract-api.ts` замість
просування логіки бета-заголовка Anthropic і `service_tier` в узагальнений
контракт `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує побудовники provider,
  допоміжні засоби моделей за замовчуванням і побудовники realtime provider
- `@openclaw/openrouter-provider`: `api.ts` експортує побудовник provider, а також
  допоміжні засоби онбордингу/config

<Warning>
  Production code extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, перенесіть його в нейтральний підшлях SDK,
  такий як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншу
  surface, орієнтовану на можливості, замість зв’язування двох plugins між собою.
</Warning>

## Пов’язані матеріали

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору назв `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми config
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих surfaces
- [Plugin Internals](/uk/plugins/architecture) — поглиблена архітектура та модель можливостей
