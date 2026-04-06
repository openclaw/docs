---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-06T15:31:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a08fa2d63e82ec921d63310eeede4ef868c452471402a55a1133deeaf78db0a8
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між плагінами та core. Ця сторінка —
довідник про **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
  - Перший плагін? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Плагін каналу? Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Плагін провайдера? Див. [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Правило імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналів
entry/build helper-ів віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої umbrella-поверхні та спільних helper-ів, таких як
`buildChannelConfigSchema`.

Не додавайте й не використовуйте convenience-seam-інтерфейси з назвами провайдерів, як-от
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
helper-seam-інтерфейси з брендуванням каналів. Вбудовані плагіни повинні комбінувати загальні
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а core
має або використовувати ці локальні barrel-файли плагіна, або додавати вузький загальний контракт SDK,
коли потреба справді є міжканальною.

Згенерована карта export-ів усе ще містить невеликий набір helper-seam-інтерфейсів для вбудованих плагінів,
таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки вбудованих плагінів і сумісності; вони
навмисно не включені до загальної таблиці нижче й не є рекомендованим
шляхом імпорту для нових сторонніх плагінів.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані helper-підшляхи вбудованих плагінів усе ще з’являються в цьому згенерованому списку.
Розглядайте їх як деталі реалізації/поверхні сумісності, якщо лише сторінка документації
явно не просуває якийсь із них як публічний.

### Точка входу плагіна

| Subpath                     | Key exports                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні helper-и майстра налаштування, запити allowlist, збирачі статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper-и багатoоблікової конфігурації/action-gate і helper-и резервного повернення до типового облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper-и нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук облікового запису + helper-и резервного повернення до типового |
    | `plugin-sdk/account-helpers` | Вузькі helper-и списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схем конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Helper-и нормалізації/валідації кастомних команд Telegram із резервною підтримкою вбудованого контракту |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні helper-и побудови вхідних маршрутів і envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні helper-и запису та диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Helper-и розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні helper-и завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Helper-и делегування вихідної ідентичності/надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Helper-и життєвого циклу та адаптерів прив’язок потоків |
    | `plugin-sdk/agent-media-payload` | Застарілий builder медіапейлоада агента |
    | `plugin-sdk/conversation-runtime` | Helper-и прив’язки розмови/потоку, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Helper знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Helper-и розв’язання групової політики runtime |
    | `plugin-sdk/channel-status` | Спільні helper-и знімків/підсумків статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви config-schema каналу |
    | `plugin-sdk/channel-config-writes` | Helper-и авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти prelude для плагінів каналів |
    | `plugin-sdk/allowlist-config-edit` | Helper-и читання/редагування конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні helper-и рішень доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні helper-и auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Helper-и нормалізації/скорочення інтерактивних payload-ів відповіді |
    | `plugin-sdk/channel-inbound` | Debounce, зіставлення згадок, helper-и envelope |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper-и розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські helper-и налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані helper-и налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI-бекендів + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper-и розв’язання API-ключів у runtime для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Helper-и онбордингу/запису профілю API-ключів, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний builder результату OAuth-auth |
    | `plugin-sdk/provider-auth-login` | Спільні helper-и інтерактивного входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Helper-и пошуку env vars для auth провайдерів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и replay-policy, helper-и endpoint-ів провайдерів і helper-и нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні helper-и HTTP/можливостей endpoint-ів провайдерів |
    | `plugin-sdk/provider-web-fetch` | Helper-и реєстрації/кешування web-fetch провайдерів |
    | `plugin-sdk/provider-web-search` | Helper-и реєстрації/кешування/конфігурації web-search провайдерів |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + diagnostics, а також helper-и сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібне |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper-ів і спільні helper-и wrapper-ів для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper-и патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Helper-и process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper-и реєстру команд, helper-и авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Helper-и розв’язання того, хто схвалює, і action-auth у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Helper-и профілів/фільтрів native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки native approval |
    | `plugin-sdk/approval-native-runtime` | Helper-и цілей native approval + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Helper-и payload-ів відповіді для exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Native command auth + helper-и цілей native session |
    | `plugin-sdk/command-detection` | Спільні helper-и виявлення команд |
    | `plugin-sdk/command-surface` | Helper-и нормалізації тіла команди та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Спільні helper-и довіри, DM-gating, external-content і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Helper-и allowlist хостів і SSRF-політики приватних мереж |
    | `plugin-sdk/ssrf-runtime` | Helper-и pinned-dispatcher, fetch із SSRF-захистом і SSRF-політики |
    | `plugin-sdk/secret-input` | Helper-и розбору секретних входів |
    | `plugin-sdk/webhook-ingress` | Helper-и webhook-запитів/цілей |
    | `plugin-sdk/webhook-request-guards` | Helper-и розміру тіла запиту/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховищ">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі helper-и runtime/logging/backup/встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі helper-и env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні helper-и команд/хуків/http/interactive для плагінів |
    | `plugin-sdk/hook-runtime` | Спільні helper-и пайплайна webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Helper-и lazy import/binding runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper-и exec процесів |
    | `plugin-sdk/cli-runtime` | Helper-и форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Helper-и клієнта шлюзу та patch-ів статусу каналу |
    | `plugin-sdk/config-runtime` | Helper-и завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Helper-и нормалізації назв/описів команд Telegram і перевірок дублікатів/конфліктів, навіть коли surface вбудованого контракту Telegram недоступний |
    | `plugin-sdk/approval-runtime` | Helper-и exec/plugin approval, builder-и approval-capability, helper-и auth/profile, helper-и native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні helper-и runtime для inbound/reply, chunking, dispatch, heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-и dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні helper-и короткого вікна історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі helper-и chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Helper-и шляхів сховища сесій + updated-at |
    | `plugin-sdk/state-paths` | Helper-и шляхів для state/OAuth-каталогів |
    | `plugin-sdk/routing` | Helper-и маршруту/ключа сесії/прив’язки облікового запису, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні helper-и підсумків статусу каналу/облікового запису, типові значення runtime-state і helper-и метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні helper-и розв’язання цілей |
    | `plugin-sdk/string-normalization-runtime` | Helper-и нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витяг рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Runner команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-send` | Витяг канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні helper-и шляхів до тимчасових завантажень |
    | `plugin-sdk/logging-core` | Helper-и subsystem logger і redaction |
    | `plugin-sdk/markdown-table-runtime` | Helper-и режиму markdown-таблиць |
    | `plugin-sdk/json-store` | Невеликі helper-и читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Re-entrant helper-и file-lock |
    | `plugin-sdk/persistent-dedupe` | Helper-и дискового dedupe-кешу |
    | `plugin-sdk/acp-runtime` | Helper-и runtime/сесій ACP і reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Helper-и розв’язання збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Helper-и device bootstrap і pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви helper-ів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helper-и відповіді команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Helper-и списку команд Skills |
    | `plugin-sdk/native-command-registry` | Helper-и реєстру/build/serialize native command |
    | `plugin-sdk/provider-zai-endpoint` | Helper-и визначення endpoint-ів Z.AI |
    | `plugin-sdk/infra-runtime` | Helper-и системних подій/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі helper-и обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Helper-и diagnostic flag і event |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні helper-и класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнуті helper-и fetch, proxy і pinned lookup |
    | `plugin-sdk/host-runtime` | Helper-и нормалізації hostname і SCP-хостів |
    | `plugin-sdk/retry-runtime` | Helper-и конфігурації retry і runner-а retry |
    | `plugin-sdk/agent-runtime` | Helper-и каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогу з опорою на конфігурацію |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні helper-и fetch/transform/store для медіа, а також builder-и медіапейлоадів |
    | `plugin-sdk/media-generation-runtime` | Спільні helper-и failover для генерації медіа, вибір candidate-ів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів media understanding і provider-facing експорти helper-ів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні helper-и тексту/markdown/logging, такі як видалення тексту, видимого асистенту, helper-и render/chunking/table для markdown, helper-и redaction, helper-и directive-tag і safe-text |
    | `plugin-sdk/text-chunking` | Helper chunking для вихідного тексту |
    | `plugin-sdk/speech` | Типи speech-провайдерів і provider-facing helper-и directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи speech-провайдерів, helper-и registry, directive і normalization |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів realtime transcription і helper-и registry |
    | `plugin-sdk/realtime-voice` | Типи провайдерів realtime voice і helper-и registry |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, helper-и failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, helper-и failover, пошук провайдера і розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, helper-и failover, пошук провайдера і розбір model-ref |
    | `plugin-sdk/webhook-targets` | Helper-и реєстру цілей webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Helper-и нормалізації шляхів webhook |
    | `plugin-sdk/web-media` | Спільні helper-и завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня helper-ів вбудованого memory-core для helper-ів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти engine векторних подань хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helper-и хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Helper-и запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Helper-и секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Helper-и журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Helper-и статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper-и CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper-и core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper-и файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до вендора псевдонім для helper-ів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до вендора псевдонім для helper-ів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до вендора псевдонім для helper-ів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні helper-и керованого markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Активний фасад runtime пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до вендора псевдонім для helper-ів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня helper-ів вбудованого memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих helper-ів">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper-и підтримки вбудованого browser plugin (`browser-support` залишається barrel-файлом сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper-ів/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper-ів/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper-ів вбудованого IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Поверхні сумісності/helper-ів вбудованих каналів |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Поверхні helper-ів вбудованих функцій/плагінів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | What it registers                |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)        |
| `api.registerCliBackend(...)`                    | Локальний CLI-бекенд inference   |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями      |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова realtime transcription  |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні сесії realtime voice   |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео     |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень              |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                 |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                  |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape     |
| `api.registerWebSearchProvider(...)`             | Вебпошук                         |

### Інструменти та команди

| Method                          | What it registers                                      |
| ------------------------------- | ------------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)                     |

### Інфраструктура

| Method                                         | What it registers                          |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Хук подій                                  |
| `api.registerHttpRoute(params)`                | HTTP-endpoint шлюзу                        |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод шлюзу                            |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                             |
| `api.registerService(service)`                 | Фоновий сервіс                             |
| `api.registerInteractiveHandler(registration)` | Інтерактивний handler                      |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивний розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний корпус пошуку/читання пам’яті    |

Зарезервовані простори імен адміністрування core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
вужчий scope методу шлюзу. Віддавайте перевагу специфічним для плагіна префіксам для
методів, що належать плагіну.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі розбору, які використовуються для кореневої довідки CLI,
  маршрутизації та lazy-реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася lazy-loaded у звичайному шляху кореневого CLI,
надайте `descriptors`, які покривають кожен корінь команди верхнього рівня, що відкривається
цим registrar.

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

Використовуйте лише `commands`, тільки якщо вам не потрібна lazy-реєстрація кореневого CLI.
Цей eager-шлях сумісності все ще підтримується, але він не встановлює
placeholders на основі descriptor для lazy loading на етапі розбору.

### Реєстрація CLI-бекенду

`api.registerCliBackend(...)` дає плагіну змогу володіти типовою конфігурацією для локального
AI CLI-бекенду, такого як `codex-cli`.

- `id` бекенду стає префіксом провайдера в посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` бекенду використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача як і раніше має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типового значення плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, коли бекенду потрібні переписування сумісності після злиття
  (наприклад, нормалізація старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | What it registers                        |
| ------------------------------------------ | ---------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один) |
| `api.registerMemoryPromptSection(builder)` | Builder розділу prompt пам’яті           |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану скидання пам’яті          |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                  |

### Адаптери векторних подань пам’яті

| Method                                         | What it registers                                   |
| ---------------------------------------------- | --------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер векторних подань пам’яті для активного плагіна |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними для плагінів пам’яті.
- `registerMemoryEmbeddingProvider` дає активному плагіну пам’яті змогу реєструвати один
  або кілька id адаптерів векторних подань (наприклад, `openai`, `gemini` або
  користувацький id, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, розв’язується відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler заявляє про диспетчеризацію, handler-и з нижчим пріоритетом і типовий шлях диспетчеризації моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як пропуск `cancel`), а не перевизначенням.

### Поля об’єкта API

| Field                    | Type                      | Description                                                                                      |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | id плагіна                                                                                       |
| `api.name`               | `string`                  | Відображувана назва                                                                              |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                                   |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                     |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                          |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                        |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний in-memory знімок runtime, коли доступний)                |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Helper-и runtime](/uk/plugins/sdk-runtime)                                                         |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня плагіна                                                          |

## Угода щодо внутрішніх модулів

Усередині вашого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Легка точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні вбудованих плагінів (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) тепер надають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до розв’язаного файла конфігурації на диску.

Плагіни провайдерів також можуть відкривати вузький локальний barrel-контракт плагіна, коли
helper навмисно є специфічним для провайдера і поки що не належить до загального підшляху SDK.
Поточний вбудований приклад: провайдер Anthropic зберігає свої helper-и потоку Claude
у власному публічному seam `api.ts` / `contract-api.ts` замість того, щоб просувати логіку
Anthropic beta-header і `service_tier` у загальний контракт
`plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує builder-и провайдера,
  helper-и типових моделей і builder-и realtime-провайдерів
- `@openclaw/openrouter-provider`: `api.ts` експортує builder провайдера та
  helper-и онбордингу/конфігурації

<Warning>
  Production-код розширень також повинен уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді є спільним, підніміть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  surface, орієнтованої на можливості, замість того, щоб зв’язувати два плагіни між собою.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та lint-правила
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих surface-інтерфейсів
- [Plugin Internals](/uk/plugins/architecture) — поглиблена архітектура та модель можливостей плагінів
