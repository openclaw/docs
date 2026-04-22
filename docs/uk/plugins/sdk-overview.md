---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-22T17:55:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d010d8c8df684325b481e9e7b0709a079be4db10452fe64d29e2a2ccbbbf10e8
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка є
довідником для **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
  - Перший plugin? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Plugin каналу? Дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Plugin провайдера? Дивіться [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build надавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої узагальненої поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Не додавайте й не покладайтеся на зручні шляхи, названі за провайдерами, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шляхи, брендовані каналами. Вбудовані plugins мають компонувати
узагальнені підшляхи SDK усередині власних barrel-файлів `api.ts` або `runtime-api.ts`, а ядро
має або використовувати ці локальні barrel-файли plugin, або додавати вузький узагальнений SDK
контракт, коли потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних шляхів
вбудованих plugins, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності вбудованих plugins; вони
навмисно не включені до поширеної таблиці нижче і не є рекомендованим
шляхом імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів знаходиться в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи вбудованих plugins усе ще з’являються в цьому згенерованому списку.
Розглядайте їх як поверхні деталей реалізації/сумісності, якщо лише сторінка документації
не просуває якийсь із них явно як публічний.

### Точка входу plugin

| Subpath                     | Ключові експорти                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Кореневий експорт Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, allowlist-підказки, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для мультиакаунтної конфігурації/action-gate, допоміжні засоби fallback для акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук акаунта + допоміжні засоби fallback до значення за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback на вбудований контракт |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації чернеток потоків |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршрутизації вхідних повідомлень + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідного медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної ідентичності, send delegate і планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків і adapter |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіа payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки conversation/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення group-policy у runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби визначення group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби interactive reply. Див. [Message Presentation](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibility barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних засобів mention-policy і допоміжних засобів envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту місцезнаходження каналу та форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для відкинутих вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби message-action каналу, а також застарілі власні допоміжні засоби схем, збережені для сумісності plugins |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-контракту, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням для CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключа в runtime для plugins провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для plugins провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку auth env-var для провайдерів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Узагальнені допоміжні засоби HTTP/можливостей endpoint провайдера |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування web-fetch провайдерів |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне зв’язування увімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter облікових даних з обмеженою областю дії |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime для web-search провайдерів |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні засоби wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспортного рівня провайдера, такі як guarded fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Визначення approver і допоміжні засоби action-auth для того самого чату |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native adapter можливостей/доставки approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні засоби завантаження native adapter approval для гарячих channel entrypoint |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби approval handler runtime; надавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target + прив’язки акаунта |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Native command auth + native допоміжні засоби session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-surface` | Нормалізація command-body і допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-контракту для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для парсингу secret-контракту/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби trust, DM gating, external-content і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для host allowlist і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої infra runtime surface |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch із SSRF-захистом і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби парсингу secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook request/target |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби для розміру body request/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Узагальнені допоміжні засоби реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби command/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування і версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація імені/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, побудовники approval-capability, допоміжні засоби auth/profile, native routing/runtime helpers |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, chunking, dispatch, Heartbeat, планувальник відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби short-window reply-history, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/Markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху session store + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій State/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язки route/session-key/акаунта, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку статусу каналу/акаунта, значення за замовчуванням для runtime-state і допоміжні засоби метаданих issues |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Запускач команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені readers параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload із об’єктів результату tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів send target з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби subsystem logger і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON state |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби dedupe-кешу з дисковим збереженням |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації agent runtime |
    | `plugin-sdk/boolean-param` | Нестрогий reader булевого параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою і токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native command |
    | `plugin-sdk/agent-harness` | Експериментальна surface trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort активного запуску, місток tool OpenClaw і утиліти результатів attempt |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader body відповіді з обмеженням без широкої media runtime surface |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без routing configured binding або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби читання session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Допоміжні засоби визначення видимості контексту і фільтрації додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення і нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/усунення дублікатів директорій на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також побудовники медіа payload |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також provider-facing експорти допоміжних засобів зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/Markdown/logging, такі як вилучення тексту, видимого асистенту, допоміжні засоби render/chunking/table для Markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech-провайдерів, а також provider-facing допоміжні засоби directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи speech-провайдерів, registry, directive і допоміжні засоби нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів realtime transcription і допоміжні засоби registry |
    | `plugin-sdk/realtime-voice` | Типи провайдерів realtime voice і допоміжні засоби registry |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, failover, auth і допоміжні засоби registry |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошуку провайдера і парсингу model-ref |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошуку провайдера і парсингу model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру Webhook target і встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддаленого/локального медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для користувачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів вбудованого memory-core для manager/config/file/CLI helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексу/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до registry, локальний provider і узагальнені допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби query хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби CLI runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для допоміжних засобів core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для допоміжних засобів file/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для plugins, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Runtime facade Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для допоміжних засобів статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів вбудованого memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки вбудованого browser plugin (`browser-support` залишається compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper вбудованого IRC |
    | Допоміжні засоби, специфічні для каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Вбудовані compatibility/helper seams для каналів |
    | Допоміжні засоби, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Вбудовані feature/plugin helper seams; `plugin-sdk/github-copilot-token` зараз експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Callback `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що він реєструє                      |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)            |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний CLI backend для inference  |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями          |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis       |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова realtime transcription      |
| `api.registerRealtimeVoiceProvider(...)`         | Двосторонні сесії realtime voice     |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео         |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                  |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                     |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                      |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape         |
| `api.registerWebSearchProvider(...)`             | Вебпошук                             |

### Інструменти та команди

| Method                          | Що він реєструє                               |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)          |

### Інфраструктура

| Method                                          | Що він реєструє                         |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук події                              |
| `api.registerHttpRoute(params)`                 | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                      |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                         |
| `api.registerService(service)`                  | Фонова служба                          |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний handler                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрика extension вбудованого runner Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивна секція prompt, суміжна з memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний корпус пошуку/читання memory |

Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область gateway method. Для методів,
що належать plugin, надавайте перевагу префіксам, специфічним для plugin.

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin потрібен нативний для Pi
таймінг подій під час вбудованих запусків OpenClaw, наприклад асинхронні переписування `tool_result`,
які мають відбутися до того, як буде надіслано фінальне повідомлення з результатом tool.
Сьогодні це seam для вбудованих plugins: лише вбудовані plugins можуть реєструвати такий factory, і
вони мають оголосити `contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Для всього, що
не потребує цього нижчого рівня seam, залишайте звичайні хуки plugin OpenClaw.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд для етапу парсингу, що використовуються для кореневої довідки CLI,
  маршрутизації та lazy-реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася lazy-loaded у звичайному шляху кореневого CLI,
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

Використовуйте `commands` окремо лише тоді, коли вам не потрібна lazy-реєстрація в кореневому CLI.
Цей eager compatibility path залишається підтримуваним, але він не встановлює
placeholders, що підтримуються descriptors, для lazy loading на етапі парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає plugin змогу володіти конфігурацією за замовчуванням для локального
CLI backend ШІ, такого як `codex-cli`.

- `id` backend стає префіксом provider у model refs, таких як `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  значення plugin за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань сумісності після об’єднання
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що він реєструє                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Контекстний рушій (одночасно активний лише один). Callback `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Єдину можливість memory                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції prompt для memory                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush для memory                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime для memory                                                                                                                                 |

### Adapters вбудовування memory

| Method                                         | Що він реєструє                               |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter вбудовування memory для активного plugin |

- `registerMemoryCapability` — це рекомендований API ексклюзивного plugin для memory.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб plugins-компаньйони могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core`, не звертаючись до приватного
  layout конкретного plugin memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застарілі, але сумісні API ексклюзивного plugin memory.
- `registerMemoryEmbeddingProvider` дає активному plugin memory змогу реєструвати один
  або кілька id adapter вбудовування (наприклад, `openai`, `gemini` або визначений plugin користувацький id).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно зареєстрованих id цих
  adapter.

### Події та життєвий цикл

| Method                                       | Що він робить                |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Callback прив’язки conversation |

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як якщо не вказати `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як якщо не вказати `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler заявляє про dispatch, handlers із нижчим пріоритетом і типовий шлях model dispatch пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як якщо не вказати `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного потоку/теми. `metadata` залишайте для додаткових даних, специфічних для каналу.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID plugin                                                                                  |
| `api.name`               | `string`                  | Відображувана назва                                                                        |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                     |
| `api.rootDir`            | `string?`                 | Коренева директорія plugin (необов’язково)                                                 |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime в пам’яті, якщо доступний)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація plugin з `plugins.entries.<id>.config`                                        |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                           |
| `api.logger`             | `PluginLogger`            | Logger з обмеженою областю (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня plugin                                                     |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх користувачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу plugin
  setup-entry.ts    # Легка точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  із production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих plugins, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), тепер надають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже запущений. Якщо знімка runtime
ще не існує, вони повертаються до розв’язуваного файла конфігурації на диску.

Plugins провайдерів також можуть експортувати вузький локальний barrel контракту plugin, коли
допоміжний засіб навмисно є специфічним для провайдера й поки що не належить до узагальненого підшляху SDK.
Поточний вбудований приклад: провайдер Anthropic зберігає свої допоміжні засоби Claude
stream у власному публічному seam `api.ts` / `contract-api.ts`, замість того щоб
просувати логіку Anthropic beta-header і `service_tier` до узагальненого
контракту `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує побудовники провайдерів,
  допоміжні засоби моделей за замовчуванням і побудовники realtime-провайдерів
- `@openclaw/openrouter-provider`: `api.ts` експортує побудовник провайдера, а також
  допоміжні засоби онбордингу/конфігурації

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, просувайте його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  surface, орієнтованої на можливість, замість зв’язування двох plugins між собою.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — тестові утиліти та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих surface
- [Plugin Internals](/uk/plugins/architecture) — глибока архітектура і модель можливостей plugin
