---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-06T12:17:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dfd7a632101c2f6da8ba43b3cb4e673794ebaed00908ae897059fe115782f54
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugins і core. Ця сторінка є
довідником щодо **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
  - Перший plugin? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Channel plugin? Дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Provider plugin? Дивіться [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий
запуск і запобігає проблемам із циклічними залежностями. Для специфічних для
каналів допоміжних функцій entry/build віддавайте перевагу
`openclaw/plugin-sdk/channel-core`; використовуйте `openclaw/plugin-sdk/core`
для ширшої узагальненої поверхні та спільних допоміжних функцій, таких як
`buildChannelConfigSchema`.

Не додавайте і не використовуйте іменовані за provider зручні шари, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шари з брендуванням channel. Bundled plugins мають компонувати
загальні підшляхи SDK у власних barrels `api.ts` або `runtime-api.ts`, а core
має або використовувати ці локальні barrels plugin, або додавати вузький
загальний контракт SDK, коли потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних шарів
bundled-plugin, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки bundled-plugin і сумісності; їх навмисно
не включено до загальної таблиці нижче, і вони не є рекомендованим шляхом
імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів знаходиться в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи bundled-plugin усе ще з’являються в цьому
згенерованому списку. Розглядайте їх як деталі реалізації або поверхні
сумісності, якщо тільки сторінка документації явно не позначає одну з них як
публічну.

### Вхід plugin

| Subpath                     | Ключові експорти                                                                                                                      |
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
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції для конфігурації та action gate мультиакаунтів, допоміжні функції fallback для акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку акаунта + fallback до акаунта за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції для списку акаунтів/дій із акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схем конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram із fallback на bundled contract |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції маршрутизації вхідних подій + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису й диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення target |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції для вихідної ідентичності та send delegate |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу та адаптерів thread-binding |
    | `plugin-sdk/agent-media-payload` | Застарілий builder payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки conversation/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення policy груп під час runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви schema конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції рішень щодо доступу груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції авторизації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні функції нормалізації/зведення payload інтерактивних відповідей |
    | `plugin-sdk/channel-inbound` | Debounce, зіставлення згадок, допоміжні функції envelope |
    | `plugin-sdk/channel-send-result` | Типи результатів reply |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення target |
    | `plugin-sdk/channel-contract` | Типи контрактів channel |
    | `plugin-sdk/channel-feedback` | Налаштування feedback/reaction |
  </Accordion>

  <Accordion title="Підшляхи provider">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локальних/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted provider, сумісних з OpenAI |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API key під час runtime для provider plugins |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції onboarding/profile-write для API key, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний builder auth-result для OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для provider plugins |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку env vars для авторизації provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и replay-policy, допоміжні функції endpoint provider і нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/capability endpoint provider |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування provider web-fetch |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/конфігурації provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні функції wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Допоміжні функції patch конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні функції process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи авторизації та безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, допоміжні функції авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення approver та action-auth у тому ж чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери native approval capability/delivery |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді на approval exec/plugin |
    | `plugin-sdk/command-auth-native` | Допоміжні функції native command auth + native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції визначення команд |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні функції command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, DM gating, external-content і збору секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned-dispatcher, fetch із захистом SSRF та політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції webhook request/target |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції для розміру body request/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широка поверхня допоміжних функцій runtime/logging/backup/plugin-install |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції для команд/hook/http/interactive plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy import/binding runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, wait і version |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команд Telegram і перевірки на дублікати/конфлікти, навіть коли поверхня bundled Telegram contract недоступна |
    | `plugin-sdk/approval-runtime` | Допоміжні функції approval exec/plugin, builder-и approval capability, допоміжні функції auth/profile, допоміжні функції native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції runtime для inbound/reply, chunking, dispatch, heartbeat, planner reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize reply |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції коротковіконної history reply, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху session store + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні функції шляху до каталогу state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції summary статусу channel/account, значення runtime-state за замовчуванням і допоміжні функції метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції визначення target |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягування URL-адрес рядків із fetch/request-like input |
    | `plugin-sdk/run-command` | Запуск команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-send` | Витягування канонічних полів target відправлення з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів до тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні функції subsystem logger і redaction |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису JSON state |
    | `plugin-sdk/file-lock` | Допоміжні функції повторно-вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції дискового dedupe cache |
    | `plugin-sdk/acp-runtime` | Допоміжні функції ACP runtime/session і reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий читач boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції визначення збігу небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції device bootstrap і токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви для passive-channel і допоміжні функції статусу |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції відповіді `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні функції реєстру/build/serialize native commands |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції визначення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні функції system event/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого cache |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні функції класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні функції wrapped fetch, proxy і pinned lookup |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит до каталогу на основі config/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store медіа плюс builder-и payload медіа |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover для генерації медіа, вибір candidate і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи provider для розуміння медіа плюс експорти допоміжних функцій для provider для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції для text/markdown/logging, такі як видалення видимого асистенту тексту, рендеринг/chunking/table helpers markdown, redaction helpers, directive-tag helpers і safe-text utilities |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech provider плюс експорти допоміжних функцій для provider для directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи speech provider, registry, directive і допоміжні функції normalізації |
    | `plugin-sdk/realtime-transcription` | Типи provider для realtime transcription і допоміжні функції registry |
    | `plugin-sdk/realtime-voice` | Типи provider для realtime voice і допоміжні функції registry |
    | `plugin-sdk/image-generation` | Типи provider для генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, failover, auth і допоміжні функції registry |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні функції failover, пошуку provider і розбору model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні функції failover, пошуку provider і розбору model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні функції реєстру webhook target і встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи memory">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Допоміжна поверхня bundled memory-core для manager/config/file/CLI helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексування/пошуку memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine memory host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти embedding engine memory host |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine memory host |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine memory host |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні функції multimodal memory host |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції query memory host |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції secret memory host |
    | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій memory host |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції status memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції CLI runtime memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні функції core runtime memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції file/runtime memory host |
    | `plugin-sdk/memory-host-core` | Нейтральний до вендора alias для допоміжних функцій core runtime memory host |
    | `plugin-sdk/memory-host-events` | Нейтральний до вендора alias для допоміжних функцій журналу подій memory host |
    | `plugin-sdk/memory-host-files` | Нейтральний до вендора alias для допоміжних функцій file/runtime memory host |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції managed-markdown для plugins, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Активна runtime facade memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до вендора alias для допоміжних функцій status memory host |
    | `plugin-sdk/memory-lancedb` | Допоміжна поверхня bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні функції підтримки bundled browser plugin (`browser-support` залишається barrel сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Допоміжна/runtime surface bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Допоміжна/runtime surface bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Допоміжна surface bundled IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шари сумісності/допоміжні шари bundled channel |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Допоміжні шари bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Callback `register(api)` отримує об’єкт `OpenClawPluginApi` із такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                     |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)        |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями     |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis  |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція realtime  |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні голосові сесії realtime |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео    |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень             |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                 |
| `api.registerWebFetchProvider(...)`              | Provider для web fetch / scrape |
| `api.registerWebSearchProvider(...)`             | Пошук у вебі                    |

### Інструменти та команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)         |

### Інфраструктура

| Method                                         | Що реєструє                            |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook події                             |
| `api.registerHttpRoute(params)`                | HTTP endpoint gateway                  |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод gateway                      |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                         |
| `api.registerService(service)`                 | Фонова служба                          |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                 |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивний розділ prompt, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний corpus пошуку/читання memory |

Зарезервовані простори імен адміністратора core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область gateway method. Віддавайте перевагу префіксам, специфічним для plugin, для
методів, що належать plugin.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для
  довідки кореневого CLI, маршрутизації та відкладеної реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною у звичайному
шляху кореневого CLI, надайте `descriptors`, які покривають кожен корінь
команди верхнього рівня, відкритий цим registrar.

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

Використовуйте лише `commands` тільки тоді, коли вам не потрібна лінива
реєстрація кореневого CLI. Цей eager-шлях сумісності все ще підтримується,
але він не встановлює placeholders на основі descriptors для лінивого
завантаження під час парсингу.

### Ексклюзивні слоти

| Method                                     | Що реєструє                         |
| ------------------------------------------ | ----------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один) |
| `api.registerMemoryPromptSection(builder)` | Builder розділу prompt memory       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush для memory     |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime memory              |

### Адаптери embedding для memory

| Method                                         | Що реєструє                                      |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного plugin |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними для plugins memory.
- `registerMemoryEmbeddingProvider` дозволяє активному plugin memory реєструвати один
  або кілька id адаптерів embedding (наприклад `openai`, `gemini` або
  custom id, визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих
  зареєстрованих id адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                  |
| -------------------------------------------- | -------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований hook життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Callback прив’язки conversation |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як і пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як і пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере dispatch на себе, обробники з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як і пропуск `cancel`), а не як перевизначення.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID plugin                                                                                   |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                               |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                 |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                      |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                    |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot конфігурації (активний snapshot runtime в пам’яті, якщо доступний)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для plugin конфігурація з `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні функції runtime](/uk/plugins/sdk-runtime)                                           |
| `api.logger`             | `PluginLogger`            | Logger з областю дії (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin                                                     |

## Угода щодо внутрішніх модулів

Усередині свого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшений entry лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні bundled plugin (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) тепер надають
перевагу активному snapshot конфігурації runtime, коли OpenClaw уже запущено.
Якщо snapshot runtime ще не існує, вони використовують fallback до визначеного
на диску файлу конфігурації.

Provider plugins також можуть відкривати вузький локальний barrel контракту plugin,
коли допоміжна функція навмисно є специфічною для provider і поки що не належить
до загального підшляху SDK. Поточний bundled-приклад: provider Anthropic тримає
свої допоміжні функції потоку Claude у власному публічному шарі `api.ts` / `contract-api.ts`
замість просування логіки beta-header Anthropic і `service_tier` у загальний
контракт `plugin-sdk/*`.

Інші поточні bundled-приклади:

- `@openclaw/openai-provider`: `api.ts` експортує builder-и provider,
  допоміжні функції моделей за замовчуванням і builder-и provider realtime
- `@openclaw/openrouter-provider`: `api.ts` експортує builder provider, а також
  допоміжні функції onboarding/config

<Warning>
  Production-код extension також має уникати імпортів
  `openclaw/plugin-sdk/<other-plugin>`. Якщо допоміжна функція справді спільна,
  перенесіть її до нейтрального підшляху SDK, наприклад
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на capability, замість жорсткого зв’язування двох plugins.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — поглиблена архітектура та модель можливостей
