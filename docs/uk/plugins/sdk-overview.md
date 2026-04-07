---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-07T18:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d9b78dab757747cfa0e315376af72040ef79453129c0fa051c4c9dd948060f
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка є
довідником щодо **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте практичний посібник?**
  - Перший plugin? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Plugin каналу? Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Plugin провайдера? Див. [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода про імпорт

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий, самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої парасолькової поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Не додавайте й не використовуйте зручні шари з назвами провайдерів, як-от
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шари з брендуванням каналів. Вбудовані plugins мають компонувати загальні
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а ядро
має або використовувати ці локальні для plugin barrel-файли, або додати вузький загальний SDK
контракт, коли потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних
шарів для вбудованих plugins, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки вбудованих plugins і сумісності; вони
навмисно не включені до загальної таблиці нижче й не є рекомендованим
шляхом імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи для вбудованих plugins усе ще з’являються в цьому згенерованому списку.
Ставтеся до них як до деталей реалізації/поверхонь сумісності, якщо якась сторінка документації
явно не позначає один із них як публічний.

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
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, запити списку дозволених, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для мультиакаунтної конфігурації/гейтінгу дій, допоміжні засоби резервного переходу до акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікатора акаунта |
    | `plugin-sdk/account-resolution` | Пошук акаунта + допоміжні засоби резервного переходу до значення за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схем конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервною сумісністю для вбудованого контракту |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби побудови вхідного маршруту та envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби для вихідної ідентичності/делегатів надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор медіа-пейлоаду агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби для прив’язки розмови/потоку, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення політик груп у runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімків/зведень статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви schema конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби читання/редагування конфігурації списку дозволених |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби прийняття рішень щодо групового доступу |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби авторизації/захисту прямих DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби нормалізації/зведення пейлоадів інтерактивних відповідей |
    | `plugin-sdk/channel-inbound` | Вхідний debounce, зіставлення згадок, допоміжні засоби політики згадок і допоміжні засоби envelope |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення відгуків/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби секретного контракту, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, а також типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключів у runtime для plugins провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю для API-ключів, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для plugins провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env vars для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/можливостей endpoint провайдера |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування web-fetch провайдерів |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter-и облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime web-search провайдерів |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper-ів і спільні допоміжні wrapper-и для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Визначення approver-а та допоміжні засоби action-auth у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери доставлення/можливостей native approval |
    | `plugin-sdk/approval-handler-runtime` | Спільні допоміжні засоби runtime обробника approval, зокрема capability-driven завантаження native approval |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей native approval + прив’язки акаунтів |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби пейлоаду відповіді для exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Native command auth + допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команд і командної поверхні |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів каналів/plugins |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього контенту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби host allowlist і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, SSRF-захищеного fetch і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору секретного вводу |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілей webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби для розміру тіла запиту/таймаутів |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/логування/резервних копій/встановлення plugins |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive для plugins |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби пайплайна webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy import/binding runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта gateway і патчів статусу каналів |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублювання/конфліктів, навіть якщо поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, конструктори approval-capability, допоміжні засоби auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби вхідного/reply runtime, chunking, dispatch, heartbeat, planner відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize для відповідей |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху до session store + updated-at |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язки route/session-key/account, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення статусу каналів/акаунтів, значення runtime-state за замовчуванням і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витяг рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tools/CLI |
    | `plugin-sdk/tool-send` | Витяг канонічних полів цілей надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування конфіденційних даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму markdown-таблиць |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON state |
    | `plugin-sdk/file-lock` | Реентрантні допоміжні засоби file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби disk-backed dedupe cache |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/session ACP і reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви пасивного каналу, статусу й ambient proxy helper |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби команд `/models` і відповідей провайдерів |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native команд |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби wrapped fetch, proxy і pinned lookup |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/усунення дублікатів каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store медіа плюс конструктори медіа-пейлоадів |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів Media understanding плюс орієнтовані на провайдерів експорти допоміжних засобів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/markdown/логування, такі як видалення видимого асистенту тексту, допоміжні засоби render/chunking/table для markdown, редагування конфіденційних даних, допоміжні засоби тегів директив і безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech-провайдерів плюс орієнтовані на провайдерів допоміжні засоби директив, реєстру та валідації |
    | `plugin-sdk/speech-core` | Спільні типи speech-провайдерів, реєстру, директив і допоміжні засоби нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів realtime transcription і допоміжні засоби реєстру |
    | `plugin-sdk/realtime-voice` | Типи провайдерів realtime voice і допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошук провайдерів і розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошук провайдерів і розбір model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляхів webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Реекспортований `zod` для користувачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів вбудованого memory-core для manager/config/file/CLI helper-ів |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти embedding engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби query хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Вендорно-нейтральний псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Вендорно-нейтральний псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Вендорно-нейтральний псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для plugins, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime активної пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Вендорно-нейтральний псевдонім для допоміжних засобів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів вбудованого memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих helper-ів">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки вбудованого browser plugin (`browser-support` лишається barrel-ом сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper-ів/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper-ів/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper-ів вбудованого IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шари helper-ів/сумісності для вбудованих каналів |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шари helper-ів для вбудованих функцій/plugins; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                     |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)       |
| `api.registerCliBackend(...)`                    | Локальний inference-бекенд CLI  |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями     |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT     |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова realtime transcription |
| `api.registerRealtimeVoiceProvider(...)`         | Двосторонні сесії realtime voice |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео    |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень             |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                 |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape    |
| `api.registerWebSearchProvider(...)`             | Вебпошук                        |

### Tools і команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)         |

### Інфраструктура

| Method                                         | Що реєструє                           |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук подій                             |
| `api.registerHttpRoute(params)`                | HTTP endpoint gateway                 |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод gateway                     |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                        |
| `api.registerService(service)`                 | Фоновий сервіс                        |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивний розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний корпус пошуку/читання пам’яті |

Зарезервовані простори імен адміністратора ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область методу gateway. Для методів, що належать plugin, віддавайте перевагу префіксам,
специфічним для plugin.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, що належать registrar
- `descriptors`: дескриптори команд на етапі розбору, які використовуються для кореневої довідки CLI,
  маршрутизації та lazy-реєстрації plugin CLI

Якщо ви хочете, щоб команда plugin залишалася lazy-loaded у звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, відкритий цим
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

Використовуйте лише `commands`, якщо вам не потрібна lazy-реєстрація кореневого CLI.
Цей сумісний eager-шлях і далі підтримується, але він не встановлює
placeholder-и на основі descriptor для lazy loading на етапі розбору.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дозволяє plugin керувати конфігурацією за замовчуванням для локального
CLI backend AI, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в model ref, наприклад `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значення за замовчуванням plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписування сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                          |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context engine (лише один активний одночасно) |
| `api.registerMemoryCapability(capability)` | Єдину можливість пам’яті             |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt пам’яті   |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану flush для пам’яті     |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті              |

### Адаптери embedding для пам’яті

| Method                                         | Що реєструє                                   |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного plugin |

- `registerMemoryCapability` — рекомендований API ексклюзивного plugin пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб супровідні plugins могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної
  структури конкретного plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застарілі, але сумісні API ексклюзивного plugin пам’яті.
- `registerMemoryEmbeddingProvider` дозволяє активному plugin пам’яті зареєструвати один
  або кілька id адаптерів embedding (наприклад, `openai`, `gemini` або власний
  id, визначений plugin).
- Користувацька конфігурація, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови     |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановить це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановить це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник візьме dispatch на себе, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановить це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як пропуск `cancel`), а не перевизначенням.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                      |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор plugin                                                                       |
| `api.name`               | `string`                  | Відображувана назва                                                                        |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                             |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                               |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                    |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                  |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, якщо доступний)         |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація plugin з `plugins.entries.<id>.config`                                       |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                          |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin                                                   |

## Угода про внутрішні модулі

У межах вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Внутрішні runtime-експорти
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшений entry лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Для внутрішніх імпортів використовуйте `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні вбудованих plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні entry-файли) тепер віддають перевагу
активному знімку конфігурації runtime, якщо OpenClaw уже запущено. Якщо знімка runtime
ще не існує, вони повертаються до визначеного файлу конфігурації на диску.

Plugins провайдерів також можуть надавати вузький локальний barrel контракту plugin, якщо
helper навмисно є специфічним для провайдера й поки що не належить до загального
підшляху SDK. Поточний приклад серед вбудованих: провайдер Anthropic зберігає свої helper-и
Claude stream у власному публічному шарі `api.ts` / `contract-api.ts` замість
просування логіки Anthropic beta-header і `service_tier` до загального
контракту `plugin-sdk/*`.

Інші поточні приклади серед вбудованих:

- `@openclaw/openai-provider`: `api.ts` експортує конструктори провайдерів,
  helper-и моделей за замовчуванням і конструктори realtime-провайдерів
- `@openclaw/openrouter-provider`: `api.ts` експортує конструктор провайдера та
  helper-и онбордингу/конфігурації

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді є спільним, перенесіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або до іншої
  поверхні, орієнтованої на можливості, замість жорсткого зв’язування двох plugins.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — поглиблена архітектура та модель можливостей
