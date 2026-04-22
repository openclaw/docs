---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібна довідка з усіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідка з API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-22T20:41:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: da39299358c341cffe3e7adc6026cc5dca284514421d7dc1b641d9c0d3c98151
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugin-ами та ядром. Ця сторінка —
довідник про **що імпортувати** і **що можна реєструвати**.

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

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для channel
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте
для ширшої поверхні umbrella та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Не додавайте і не покладайтеся на зручні шви з назвами provider-ів, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шви з брендуванням channel-ів. Вбудовані plugin-и мають компонувати загальні
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а ядро
має або використовувати ці локальні для plugin-ів barrel-файли, або додавати вузький загальний контракт SDK, якщо потреба справді є міжchannel-ною.

Згенерована карта експорту все ще містить невеликий набір допоміжних
швів вбудованих plugin-ів, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки вбудованих plugin-ів і сумісності; їх
навмисно не включено до поширеної таблиці нижче, і вони не є
рекомендованим шляхом імпорту для нових сторонніх plugin-ів.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
200+ підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи вбудованих plugin-ів усе ще з’являються в цьому
згенерованому списку. Розглядайте їх як деталі реалізації/поверхні сумісності,
якщо на сторінці документації явно не зазначено один із них як публічний.

### Вхід plugin-а

| Subpath                     | Key exports                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи channel-ів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, підказки allowlist, білдери статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для конфігурації/керування multi-account і резервного використання облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + резервного використання за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схем конфігурації channel-ів |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації Telegram custom-command із резервною підтримкою bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршрутизації inbound + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й диспетчеризації inbound-відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення target |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження outbound media |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound identity, send delegate і планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding і adapter |
    | `plugin-sdk/agent-media-payload` | Застарілий білдер payload медіа agent-а |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби binding conversation/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення group-policy під час runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary стану channel-а |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви schema конфігурації channel-ів |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації channel-а |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin-ів |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби читання/редагування конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби ухвалення рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивних відповідей. Див. [Message Presentation](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для inbound debounce, mention matching, допоміжних засобів mention-policy і envelope helpers |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту та форматування розташування channel-а |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування channel-а для відкинутих inbound і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями channel-а, а також застарілі native schema helpers, збережені для сумісності plugin-ів |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення target |
    | `plugin-sdk/channel-contract` | Типи контракту channel-а |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи provider-ів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локальних/self-hosted provider-ів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted provider-ів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням для CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API key під час runtime для provider plugin-ів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API key, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний білдер OAuth auth-result |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для provider plugin-ів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку auth env var для provider-ів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні білдери replay-policy, допоміжні засоби provider endpoint, і допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/endpoint capability для provider-ів |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту config/selection для web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування web-fetch provider-ів |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credential для web-search для provider-ів, яким не потрібне підключення enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту config/credential для web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter-и обмежених credential |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime для web-search provider-ів |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper, а також спільні допоміжні засоби wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби native transport provider-ів, такі як guarded fetch, перетворення transport message і потоки подій writable transport |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Білдери повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і auth допоміжних дій у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери native approval capability/delivery |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення approval Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні засоби завантаження native approval adapter для гарячих entrypoint-ів channel-ів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби approval handler runtime; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target + прив’язки облікових записів |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповідей exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Допоміжні засоби native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, external-content і збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби host allowlist і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом від SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів/target для Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-аутів |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/install plugin-ів |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive для plugin-ів |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline для Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec process |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування і версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway і patch статусу channel-а |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису config і пошуку config plugin-ів |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назв/описів Telegram command і перевірки дублікатів/конфліктів, навіть коли поверхня bundled Telegram contract недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, білдери approval capability, допоміжні засоби auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, chunking, dispatch, Heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби short-window reply-history, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху session store + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби route/session-key/прив’язки облікових записів, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби summary статусу channel-а/облікового запису, значення runtime-state за замовчуванням і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягує рядкові URL із входів, подібних до fetch/request |
    | `plugin-sdk/run-command` | Запускач команд із таймінгом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягує нормалізовані payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягує канонічні поля target відправлення з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистем і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби disk-backed кешу дедуплікації |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації runtime agent-а |
    | `plugin-sdk/boolean-param` | Гнучкий зчитувач boolean параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді provider-а/команди `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native command |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness agent-ів: типи harness, допоміжні засоби steer/abort для active-run, допоміжні засоби мосту OpenClaw tool і утиліти результатів attempt |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби прапорців і подій діагностики |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Зчитувач обмеженого response body без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без routing налаштованих прив’язок або pairing store |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби читання session-store без широких імпортів запису/обслуговування config |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту і фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/workspace agent-а |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів із підтримкою config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store медіа, а також білдери media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибору candidate і повідомлень про відсутню model |
    | `plugin-sdk/media-understanding` | Типи provider-ів Media understanding, а також provider-facing експорти допоміжних засобів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, такі як видалення видимого для асистента тексту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування чутливих даних, directive-tag helpers і safe-text utilities |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи Speech provider-ів, а також provider-facing допоміжні засоби directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи Speech provider-ів, а також допоміжні засоби registry, directive і normalization |
    | `plugin-sdk/realtime-transcription` | Типи provider-ів Realtime transcription і допоміжні засоби registry |
    | `plugin-sdk/realtime-voice` | Типи provider-ів Realtime voice і допоміжні засоби registry |
    | `plugin-sdk/image-generation` | Типи provider-ів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, а також допоміжні засоби failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, а також допоміжні засоби failover, пошуку provider-а і розбору model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, а також допоміжні засоби failover, пошуку provider-а і розбору model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру target-ів Webhook і встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для користувачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексу/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до registry, локальний provider і загальні допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби status хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби CLI runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Vendor-neutral псевдонім для допоміжних засобів core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Vendor-neutral псевдонім для допоміжних засобів журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Vendor-neutral псевдонім для допоміжних засобів file/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого Markdown для plugin-ів, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Active Memory runtime facade для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutral псевдонім для допоміжних засобів status хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin-а (`browser-support` лишається barrel сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби для конкретних channel-ів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/допоміжні шви bundled channel-ів |
    | Допоміжні засоби для auth/plugin-ів | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви допоміжних засобів bundled feature/plugin-ів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | What it registers                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Виведення тексту (LLM)                |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець agent-а |
| `api.registerCliBackend(...)`                    | Локальний CLI backend для inference   |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями           |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                       |
| `api.registerWebFetchProvider(...)`              | Provider веб-отримання / скрейпінгу   |
| `api.registerWebSearchProvider(...)`             | Вебпошук                              |

### Інструменти й команди

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент agent-а (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)            |

### Інфраструктура

| Method                                          | What it registers                       |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Подієвий hook                           |
| `api.registerHttpRoute(params)`                 | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                       |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                          |
| `api.registerService(service)`                  | Фонова служба                           |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний handler                   |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрика extension embedded-runner для Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивний розділ prompt, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний корпус memory search/read     |

Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди лишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область видимості методу Gateway. Для
методів, що належать plugin-у, віддавайте перевагу префіксам, специфічним для plugin-а.

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin-у потрібен нативний для Pi
таймінг подій під час embedded-запусків OpenClaw, наприклад асинхронні
перезаписи `tool_result`, які мають відбутися до того, як буде надіслано
фінальне повідомлення про результат tool. Наразі це шов bundled-plugin: лише bundled plugin-и можуть реєструвати його, і
вони мають оголошувати `contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Для всього, що не потребує цього нижчорівневого шва,
використовуйте звичайні hook-и plugin-ів OpenClaw.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі розбору, що використовуються для кореневої довідки CLI,
  маршрутизації та лінивої реєстрації CLI plugin-ів

Якщо ви хочете, щоб команда plugin-а залишалася ліниво завантажуваною у звичайному кореневому шляху CLI,
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
        description: "Керуйте обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей eager шлях сумісності залишається підтримуваним, але він не встановлює
заповнювачі з підтримкою descriptor для лінивого завантаження на етапі розбору.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає plugin-у змогу володіти конфігурацією за замовчуванням для локального
AI CLI backend, такого як `codex-cli`.

- Backend `id` стає префіксом provider-а в посиланнях на model, як-от `codex-cli/gpt-5`.
- `config` backend-а використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Користувацька config усе одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значення plugin-а за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує сумісних перезаписів після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | What it registers                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб engine міг адаптувати доповнення prompt. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість memory                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Білдер розділу prompt для memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush для memory                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime для memory                                                                                                                                    |

### Adapters embedding для memory

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding для memory для активного plugin-а |

- `registerMemoryCapability` — рекомендований API ексклюзивного plugin-а memory.
- `registerMemoryCapability` також може експонувати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugin-и могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватного
  layout конкретного plugin-а memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні зі спадщиною API ексклюзивних plugin-ів memory.
- `registerMemoryEmbeddingProvider` дає активному plugin-у memory змогу зареєструвати один
  або більше id adapter-ів embedding (наприклад, `openai`, `gemini` або користувацький
  id, визначений plugin-ом).
- Користувацька config, як-от `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно зареєстрованих id цих
  adapter-ів.

### Події та життєвий цикл

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований hook життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки conversation |

### Семантика рішень hook-ів

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює його, handler-и з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює його, handler-и з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler заявляє про dispatch, handler-и з нижчим пріоритетом і типовий шлях model dispatch пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює його, handler-и з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна inbound маршрутизація thread/topic. Зберігайте `metadata` для специфічних для channel додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для channel `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні hook-и `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID plugin-а                                                                                 |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin-а (необов’язково)                                                             |
| `api.description`        | `string?`                 | Опис plugin-а (необов’язково)                                                               |
| `api.source`             | `string`                  | Шлях до джерела plugin-а                                                                    |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin-а (необов’язково)                                                  |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot config (активний runtime snapshot у пам’яті, якщо доступний)             |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для plugin-а config з `plugins.entries.<id>.config`                             |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin-а                                                   |

## Угода щодо внутрішніх модулів

У межах вашого plugin-а використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу plugin-а
  setup-entry.ts    # Полегшений entry лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  із production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні bundled plugin-ів, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), тепер віддають перевагу
активному snapshot config runtime, якщо OpenClaw уже запущено. Якщо snapshot runtime
ще не існує, вони повертаються до визначеного config-файлу на диску.

Provider plugin-и також можуть експортувати вузький локальний barrel контракту plugin-а, коли
допоміжний засіб навмисно є специфічним для provider-а і ще не належить до загального підшляху SDK.
Поточний bundled-приклад: provider Anthropic зберігає свої допоміжні засоби Claude
stream у власному публічному шві `api.ts` / `contract-api.ts` замість
просування логіки Anthropic beta-header і `service_tier` у загальний
контракт `plugin-sdk/*`.

Інші поточні bundled-приклади:

- `@openclaw/openai-provider`: `api.ts` експортує білдери provider-ів,
  допоміжні засоби моделей за замовчуванням і білдери realtime provider-ів
- `@openclaw/openrouter-provider`: `api.ts` експортує білдер provider-а, а також
  допоміжні засоби onboarding/config

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, просуньте його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  surface, орієнтованої на можливості, замість зв’язування двох plugin-ів між собою.
</Warning>

## Пов’язані матеріали

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми config
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих surface
- [Plugin Internals](/uk/plugins/architecture) — поглиблена архітектура і модель можливостей
