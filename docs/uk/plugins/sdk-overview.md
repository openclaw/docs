---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-07T20:09:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a41bd82d165dfbb7fbd6e4528cf322e9133a51efe55fa8518a7a0a626d9d30
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

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для channel
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core`
залишайте для ширшої узагальненої поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Не додавайте і не використовуйте зручні шви з назвами provider, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шви з брендингом channel. Bundled plugins мають компонувати загальні
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а core
має або використовувати ці локальні barrel-файли plugin, або додавати вузький загальний SDK
контракт, коли потреба справді є міжchannel-ною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних
швів bundled-plugin, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності bundled-plugin; вони
навмисно не включені до загальної таблиці нижче і не є рекомендованим
шляхом імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи bundled-plugin усе ще з’являються в цьому
згенерованому списку. Розглядайте їх як поверхні деталей реалізації/сумісності, якщо лише сторінка документації
явно не просуває одну з них як публічну.

### Plugin entry

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
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, підказки allowlist, побудовники стану налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для конфігурації/гейтів дій з кількома акаунтами та резервного використання акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук акаунта + допоміжні засоби резервного використання акаунта за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списків акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram з резервною bundled-contract підтримкою |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршрутизації вхідних повідомлень + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення target |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної ідентичності/делегування надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Життєвий цикл thread-binding і допоміжні засоби adapter |
    | `plugin-sdk/agent-media-payload` | Legacy побудовник agent media payload |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби binding розмов/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення group-policy під час runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary статусу channel |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації channel |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації channel |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти prelude plugin channel |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби прийняття рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби нормалізації/скорочення payload інтерактивних відповідей |
    | `plugin-sdk/channel-inbound` | Допоміжні засоби debounce вхідних повідомлень, зіставлення mention, політики mention і envelope |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення target |
    | `plugin-sdk/channel-contract` | Типи контракту channel |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи provider">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted provider, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Стандарти конфігурації backend CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API key під час runtime для provider plugins |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API key, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для provider plugins |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env vars для auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби endpoint provider і допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/endpoint capability для provider |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби contract для конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування web-fetch provider |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби contract для конфігурації/облікових даних web-search, такі як `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime web-search provider |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика і допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні засоби wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver і auth дій у тому самому chat |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Adapter-и можливостей/доставки native approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження adapter native approval для гарячих entrypoint-ів channel |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime для handler approval; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповідей для exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Native auth команд + допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-surface` | Нормалізація тіла команд і допоміжні засоби поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього контенту та збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і SSRF policy приватних мереж |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із SSRF-захистом і SSRF policy |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби webhook request/target |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби для розміру body request/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку runtime-context channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби для команд/hook/http/interactive plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy імпорту/binding runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби client gateway і patch статусу channel |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація name/description команд Telegram і перевірки дублікатів/конфліктів, навіть коли bundled Telegram contract surface недоступна |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, побудовники approval-capability, допоміжні засоби auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, chunking, dispatch, heartbeat, планувальник reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize для reply |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби short-window reply-history, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби path сховища сесій + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні засоби path для state/OAuth директорій |
    | `plugin-sdk/routing` | Допоміжні засоби для route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби summary статусу channel/account, стандарти runtime-state і допоміжні засоби метаданих issues |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби resolver target |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягування рядкових URL із fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Запуск команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні рідери параметрів tool/CLI |
    | `plugin-sdk/tool-send` | Витягування канонічних полів target надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби path тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму markdown-таблиць |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON state |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідних file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби disk-backed dedupe cache |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime agent |
    | `plugin-sdk/boolean-param` | Рідер вільних boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення відповідності небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви для passive-channel, status і ambient proxy helper |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби для переліку Skills command |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native команд |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy і допоміжні засоби pinned lookup |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконання retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/workspace agent |
    | `plugin-sdk/directory-runtime` | Запит/усунення дублікатів директорій на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також побудовники media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи provider для розуміння медіа, а також provider-oriented експорти допоміжних засобів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту/markdown/logging, такі як видалення тексту, видимого помічнику, допоміжні засоби render/chunking/table для markdown, редагування чутливих даних, допоміжні засоби тегів директив і утиліти safe-text |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech provider, а також provider-oriented допоміжні засоби для директив, реєстру й валідації |
    | `plugin-sdk/speech-core` | Спільні типи speech provider, а також допоміжні засоби реєстру, директив і нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи provider для realtime transcription і допоміжні засоби реєстру |
    | `plugin-sdk/realtime-voice` | Типи provider для realtime voice і допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи provider для генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи image-generation, а також допоміжні засоби failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи music-generation, допоміжні засоби failover, пошук provider і розбір model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи video-generation, допоміжні засоби failover, пошук provider і розбір model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр webhook target і допоміжні засоби встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації webhook path |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторний експорт `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи memory">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI helper-ів |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексації/пошуку memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine для host memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти embedding engine для host memory |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine для host memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine для host memory |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби для host memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів для host memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret для host memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій для host memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу для host memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI для host memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime для host memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime для host memory |
    | `plugin-sdk/memory-host-core` | Vendor-neutral псевдонім для допоміжних засобів core runtime host memory |
    | `plugin-sdk/memory-host-events` | Vendor-neutral псевдонім для допоміжних засобів журналу подій host memory |
    | `plugin-sdk/memory-host-files` | Vendor-neutral псевдонім для допоміжних засобів file/runtime host memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для plugins, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Active memory runtime facade для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutral псевдонім для допоміжних засобів статусу host memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin (`browser-support` залишається barrel-файлом сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби, специфічні для channel | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/допоміжні засоби bundled channel |
    | Допоміжні засоби, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви допоміжних засобів bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` із такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                     |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)       |
| `api.registerCliBackend(...)`                    | Локальний CLI backend inference |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями     |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT     |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова transcription realtime |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні сеанси voice realtime |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео    |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень             |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                 |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape     |
| `api.registerWebSearchProvider(...)`             | Web search                      |

### Інструменти та команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент agent (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)         |

### Інфраструктура

| Method                                         | Що реєструє                          |
| ---------------------------------------------- | ------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Event hook                           |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                   |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                       |
| `api.registerService(service)`                 | Фонова служба                        |
| `api.registerInteractiveHandler(registration)` | Інтерактивний handler                |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивний розділ prompt, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний корпус пошуку/читання memory |

Зарезервовані простори імен core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область gateway method. Для методів, що належать plugin,
віддавайте перевагу префіксам, специфічним для plugin.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для кореневої довідки CLI,
  маршрутизації та лінивої реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною у звичайному кореневому шляху CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, який відкриває цей
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
        description: "Керуйте акаунтами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей eager шлях сумісності залишається підтримуваним, але він не встановлює
placeholder-и на основі descriptors для лінивого завантаження під час парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає plugin змогу володіти стандартною конфігурацією для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом provider у model ref, наприклад `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  стандартів plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписування для сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                          |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один) |
| `api.registerMemoryCapability(capability)` | Єдину можливість memory              |
| `api.registerMemoryPromptSection(builder)` | Побудовник розділу prompt memory     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush memory          |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memory               |

### Адаптери embedding для memory

| Method                                         | Що реєструє                                     |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding для memory активного plugin |

- `registerMemoryCapability` — це рекомендований API ексклюзивного memory-plugin.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugins могли споживати експортовані memory artifacts через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватного
  layout конкретного memory plugin.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це legacy-сумісні API ексклюзивного memory-plugin.
- `registerMemoryEmbeddingProvider` дає активному memory plugin змогу зареєструвати один
  або більше id adapter embedding (наприклад, `openai`, `gemini` або власний id,
  визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно зареєстрованих id
  цих adapter.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований lifecycle hook   |
| `api.onConversationBindingResolved(handler)` | Колбек binding розмови       |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є фінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є фінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є фінальним. Щойно будь-який handler заявляє про диспетчеризацію, handler-и з нижчим пріоритетом і стандартний шлях диспетчеризації моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є фінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID plugin                                                                                  |
| `api.name`               | `string`                  | Назва для відображення                                                                      |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                     |
| `api.rootDir`            | `string?`                 | Коренева директорія plugin (необов’язково)                                                 |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot конфігурації (активний snapshot runtime в пам’яті, коли доступний)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація plugin із `plugins.entries.<id>.config`                                       |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                           |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення path відносно кореня plugin                                                     |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Внутрішні експорти лише для runtime
  index.ts          # Entry point plugin
  setup-entry.ts    # Легковаговий entry лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні bundled plugin (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) тепер віддають перевагу
активному snapshot конфігурації runtime, якщо OpenClaw уже запущено. Якщо snapshot runtime
ще не існує, вони повертаються до визначеного файлу конфігурації на диску.

Provider plugins також можуть надавати вузький barrel локального контракту plugin, коли допоміжний засіб
навмисно є специфічним для provider і ще не належить до загального
підшляху SDK. Поточний bundled приклад: provider Anthropic зберігає свої
допоміжні засоби Claude stream у власному публічному шві `api.ts` / `contract-api.ts` замість
просування логіки Anthropic beta-header і `service_tier` до загального
контракту `plugin-sdk/*`.

Інші поточні bundled приклади:

- `@openclaw/openai-provider`: `api.ts` експортує побудовники provider,
  допоміжні засоби стандартних моделей і побудовники realtime provider
- `@openclaw/openrouter-provider`: `api.ts` експортує побудовник provider, а також
  допоміжні засоби онбордингу/конфігурації

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, перемістіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість жорсткого зв’язування двох plugins.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — детальна архітектура та модель можливостей
