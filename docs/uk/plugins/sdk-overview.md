---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати.
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi.
    - Ви шукаєте конкретний експорт SDK.
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-23T03:31:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugin-ами та core. Ця сторінка є
довідником про **що імпортувати** і **що можна зареєструвати**.

<Tip>
  **Шукаєте покроковий посібник?**
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

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
хелперів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core`
залишайте для ширшої umbrella-поверхні та спільних хелперів, таких як
`buildChannelConfigSchema`.

Не додавайте й не використовуйте seam-и з provider-орієнтованими назвами для зручності, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
брендовані для каналу seam-и хелперів. Вбудовані plugin-и мають компонувати загальні
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а core
має або використовувати ці локальні для plugin-а barrel-файли, або додавати вузький загальний SDK
контракт, коли потреба справді охоплює кілька каналів.

Згенерована карта експортів усе ще містить невеликий набір seam-ів хелперів для вбудованих plugin-ів,
таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності вбудованих plugin-ів; їх
навмисно не включено до поширеної таблиці нижче, і вони не є рекомендованими
шляхами імпорту для нових сторонніх plugin-ів.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані підшляхи хелперів для вбудованих plugin-ів усе ще з’являються в цьому згенерованому списку.
Вважайте їх деталями реалізації/поверхнями сумісності, якщо лише сторінка документації
явно не позначає один із них як публічний.

### Точка входу plugin-а

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
    | `plugin-sdk/config-schema` | Кореневий експорт Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні хелпери майстра налаштування, підказки allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Хелпери для конфігурації та action-gate з кількома обліковими записами, хелпери fallback для облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, хелпери нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Пошук облікового запису + хелпери fallback до облікового запису за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі хелпери списку облікових записів / дій з обліковим записом |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Хелпери нормалізації/валідації користувацьких команд Telegram із fallback на контракт вбудованого plugin-а |
    | `plugin-sdk/command-gating` | Вузькі хелпери gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, хелпери життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні хелпери побудови вхідного маршруту та envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні хелпери запису та диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Хелпери парсингу/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні хелпери завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Хелпери вихідної ідентичності, send delegate і планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі хелпери нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Хелпери життєвого циклу прив’язок потоку та адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор media payload агента |
    | `plugin-sdk/conversation-runtime` | Хелпери прив’язки conversation/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Хелпер snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Хелпери визначення group-policy у runtime |
    | `plugin-sdk/channel-status` | Спільні хелпери snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Хелпери авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin-а |
    | `plugin-sdk/allowlist-config-edit` | Хелпери редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні хелпери рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні хелпери auth/guard для прямого DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі хелпери інтерактивних відповідей. Див. [Message Presentation](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для debounce вхідних повідомлень, зіставлення згадок, хелперів mention-policy та хелперів envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі хелпери mention-policy без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-location` | Хелпери контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Хелпери логування каналу для пропусків inbound і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Хелпери message-action каналу, а також застарілі хелпери нативної schema, збережені для сумісності plugin-ів |
    | `plugin-sdk/channel-targets` | Хелпери парсингу/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери secret-контракту, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи provider-ів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські хелпери налаштування локальних/self-hosted provider-ів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані хелпери налаштування self-hosted provider-ів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Хелпери визначення API key у runtime для provider plugin-ів |
    | `plugin-sdk/provider-auth-api-key` | Хелпери онбордингу/запису профілю API key, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні хелпери інтерактивного входу для provider plugin-ів |
    | `plugin-sdk/provider-env-vars` | Хелпери пошуку env vars auth для provider-ів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, хелпери endpoint provider-а та хелпери нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні хелпери HTTP/endpoint capability provider-а, зокрема хелпери multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі хелпери контракту config/selection для web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Хелпери реєстрації/кешу provider-а web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі хелпери config/credential для web-search для provider-ів, яким не потрібне підключення enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі хелпери контракту config/credential для web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для credentials |
    | `plugin-sdk/provider-web-search` | Хелпери реєстрації/кешу/runtime provider-а web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення schema Gemini + діагностика, а також хелпери сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні хелпери обгорток для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Нативні хелпери транспорту provider-а, такі як guarded fetch, перетворення transport message і потоки подій writable transport |
    | `plugin-sdk/provider-onboard` | Хелпери patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Хелпери process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, хелпери реєстру команд, хелпери авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори команд/довідкових повідомлень, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Хелпери визначення approver-а та auth дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Хелпери профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native адаптери capability/delivery для approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний хелпер визначення approval Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові хелпери завантаження native адаптера approval для hot entrypoint-ів каналу |
    | `plugin-sdk/approval-handler-runtime` | Ширші хелпери runtime обробника approval; віддавайте перевагу вужчим seam-ам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Native хелпери target + account-binding для approval |
    | `plugin-sdk/approval-reply-runtime` | Хелпери payload відповіді для exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Native auth команд + native хелпери session-target |
    | `plugin-sdk/command-detection` | Спільні хелпери виявлення команд |
    | `plugin-sdk/command-surface` | Хелпери нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери збирання secret-контрактів для secret-поверхонь channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі хелпери `coerceSecretRef` і типізації SecretRef для парсингу secret-контрактів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні хелпери довіри, DM gating, зовнішнього вмісту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Хелпери політики SSRF для host allowlist і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі хелпери pinned-dispatcher без широкої infra runtime-поверхні |
    | `plugin-sdk/ssrf-runtime` | Хелпери pinned-dispatcher, fetch із захистом SSRF та політики SSRF |
    | `plugin-sdk/secret-input` | Хелпери парсингу secret input |
    | `plugin-sdk/webhook-ingress` | Хелпери запитів/цілей Webhook |
    | `plugin-sdk/webhook-request-guards` | Хелпери розміру body/тайм-ауту запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі хелпери runtime/logging/backup/встановлення plugin-ів |
    | `plugin-sdk/runtime-env` | Вузькі хелпери runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні хелпери реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні хелпери команд/хуків/http/interactive для plugin-ів |
    | `plugin-sdk/hook-runtime` | Спільні хелпери pipeline для Webhook/внутрішніх hook-ів |
    | `plugin-sdk/lazy-runtime` | Хелпери lazy імпорту/прив’язування runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Хелпери exec процесів |
    | `plugin-sdk/cli-runtime` | Хелпери форматування CLI, очікування та версій |
    | `plugin-sdk/gateway-runtime` | Хелпери Gateway client і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Хелпери завантаження/запису конфігурації та пошуку конфігурації plugin-а |
    | `plugin-sdk/telegram-command-config` | Хелпери нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Хелпери exec/plugin approval, конструктори capability approval, хелпери auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні хелпери inbound/reply runtime, chunking, dispatch, Heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі хелпери dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні хелпери reply-history для короткого вікна, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі хелпери chunking для text/markdown |
    | `plugin-sdk/session-store-runtime` | Хелпери шляху session store + updated-at |
    | `plugin-sdk/state-paths` | Хелпери шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Хелпери route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні хелпери summary статусу каналу/облікового запису, значення runtime-state за замовчуванням і хелпери metadata проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні хелпери визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Хелпери нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягання URL-рядків із вхідних даних типу fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягання нормалізованих payload із об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягання канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні хелпери шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Хелпери logger-а підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Хелпери режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі хелпери читання/запису JSON state |
    | `plugin-sdk/file-lock` | Хелпери повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Хелпери dedupe cache з дисковим зберіганням |
    | `plugin-sdk/acp-runtime` | Хелпери ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення ACP binding лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Хелпери визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Хелпери bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви хелперів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Хелпери відповіді для команди `/models` / provider-а |
    | `plugin-sdk/skill-commands-runtime` | Хелпери списку команд Skills |
    | `plugin-sdk/native-command-registry` | Хелпери реєстру/build/serialize для native команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness-ів агента: типи harness, хелпери steer/abort для active-run, хелпери моста tool OpenClaw і утиліти результатів attempt |
    | `plugin-sdk/provider-zai-endpoint` | Хелпери виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Хелпери системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі хелпери обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Хелпери діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Хелпери графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Хелпери обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого body відповіді без широкої media runtime-поверхні |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding conversation без configured binding routing або pairing store |
    | `plugin-sdk/session-store-runtime` | Хелпери читання session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі хелпери приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Хелпери нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Хелпери конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Хелпери каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи capability і тестування">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні хелпери fetch/transform/store для медіа, а також конструктори media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні хелпери failover для media generation, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи provider-а media understanding, а також provider-facing експорти хелперів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні хелпери text/markdown/logging, такі як видалення видимого для асистента тексту, хелпери render/chunking/table для Markdown, хелпери редагування чутливих даних, хелпери тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Хелпер chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech provider-а, а також provider-facing хелпери директив, реєстру та валідації |
    | `plugin-sdk/speech-core` | Спільні типи speech provider-а, хелпери реєстру, директив і нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи provider-а realtime transcription, хелпери реєстру та спільний хелпер WebSocket session |
    | `plugin-sdk/realtime-voice` | Типи provider-а realtime voice і хелпери реєстру |
    | `plugin-sdk/image-generation` | Типи provider-а image generation |
    | `plugin-sdk/image-generation-core` | Спільні типи image generation, хелпери failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи provider-а/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, хелпери failover, пошук provider-а та парсинг model-ref |
    | `plugin-sdk/video-generation` | Типи provider-а/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, хелпери failover, пошук provider-а та парсинг model-ref |
    | `plugin-sdk/webhook-targets` | Хелпери реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Хелпери нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні хелпери завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня хелперів bundled memory-core для хелперів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексу/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до реєстру, локальний provider і загальні хелпери batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні хелпери хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Хелпери запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Secret-хелпери хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Хелпери журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Хелпери статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Хелпери CLI runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Хелпери core runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Хелпери file/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Vendor-neutral псевдонім для хелперів core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Vendor-neutral псевдонім для хелперів журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Vendor-neutral псевдонім для хелперів file/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні хелпери managed-markdown для plugin-ів, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Active Memory runtime facade для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutral псевдонім для хелперів статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня хелперів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Хелпери підтримки bundled browser plugin-а (`browser-support` залишається barrel-файлом сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня хелперів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня хелперів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня хелперів bundled IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam-и сумісності/хелперів bundled channel |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam-и хелперів bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capability

| Method                                           | What it registers                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)             |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний CLI backend inference       |
| `api.registerChannel(...)`                       | Канал повідомлень                     |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                       |
| `api.registerWebFetchProvider(...)`              | Provider веб-отримання / скрапінгу    |
| `api.registerWebSearchProvider(...)`             | Вебпошук                              |

### Tools і команди

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)            |

### Інфраструктура

| Method                                          | What it registers                       |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook подій                              |
| `api.registerHttpRoute(params)`                 | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                       |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                          |
| `api.registerService(service)`                  | Фонова служба                           |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрика розширень вбудованого runner-а Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Додатковий розділ prompt-а, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Додатковий корпус для пошуку/читання memory |

Зарезервовані core admin-простори імен (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область gateway method. Для методів,
що належать plugin-у, віддавайте перевагу префіксам, специфічним для plugin-а.

Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin-у потрібен
власний для Pi таймінг подій під час вбудованих запусків OpenClaw, наприклад асинхронні перезаписи
`tool_result`, які мають відбутися до того, як буде надіслано фінальне повідомлення про результат tool.
Сьогодні це seam для bundled plugin-ів: лише bundled plugin-и можуть реєструвати такий seam, і
вони мають оголосити `contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Залишайте звичайні hook-и plugin-ів OpenClaw для всього,
що не потребує цього seam нижчого рівня.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, що належать реєстратору
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для кореневої довідки CLI,
  маршрутизації та lazy-реєстрації CLI plugin-а

Якщо ви хочете, щоб команда plugin-а залишалася lazy-loaded у звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команд верхнього рівня, що їх відкриває
цей реєстратор.

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

Використовуйте лише `commands`, якщо вам не потрібна lazy-реєстрація кореневого CLI.
Цей eager-шлях сумісності залишається підтримуваним, але він не встановлює
placeholder-и на основі descriptor для lazy loading на етапі парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає plugin-у змогу володіти конфігурацією за замовчуванням для локального
AI CLI backend, такого як `codex-cli`.

- `id` backend-а стає префіксом provider-а в посиланнях на моделі, наприклад `codex-cli/gpt-5`.
- `config` backend-а використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значення за замовчуванням plugin-а перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує перезаписів сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | What it registers                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до prompt-а. |
| `api.registerMemoryCapability(capability)` | Уніфікована capability memory                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt-а для memory                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush для memory                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для memory                                                                                                                                |

### Адаптери embedding для memory

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного plugin-а |

- `registerMemoryCapability` — це рекомендований API ексклюзивного memory-plugin-а.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugin-и могли використовувати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватного
  компонування конкретного memory plugin-а.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застарілі, але сумісні API ексклюзивного memory-plugin-а.
- `registerMemoryEmbeddingProvider` дає активному memory plugin-у змогу реєструвати один
  або кілька ідентифікаторів адаптерів embedding (наприклад, `openai`, `gemini` або користувацький
  ідентифікатор, визначений plugin-ом).
- Користувацька конфігурація, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно зареєстрованих
  ідентифікаторів адаптерів.

### Події та життєвий цикл

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований hook життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки conversation |

### Семантика рішень hook-ів

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере dispatch на себе, обробники з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного thread/topic. `metadata` залишайте для додаткових даних, специфічних для каналу.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні hook-и `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор plugin-а                                                                      |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin-а (необов’язково)                                                             |
| `api.description`        | `string?`                 | Опис plugin-а (необов’язково)                                                               |
| `api.source`             | `string`                  | Шлях до джерела plugin-а                                                                    |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin-а (необов’язково)                                                  |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot конфігурації (активний snapshot runtime у пам’яті, коли доступний)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для plugin-а, з `plugins.entries.<id>.config`                      |
| `api.runtime`            | `PluginRuntime`           | [Хелпери runtime](/uk/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger з обмеженою областю (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легковагове вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin-а                                                   |

## Угода щодо внутрішніх модулів

Усередині вашого plugin-а використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу plugin-а
  setup-entry.ts    # Легковагова точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  із production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні bundled plugin-ів, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), тепер віддають перевагу
активному snapshot конфігурації runtime, коли OpenClaw уже запущено. Якщо snapshot runtime
ще не існує, вони повертаються до визначеного файла конфігурації на диску.

Provider plugin-и також можуть надавати вузький локальний barrel контракту plugin-а, коли
хелпер навмисно є специфічним для provider-а і ще не належить до загального
підшляху SDK. Поточний bundled-приклад: provider Anthropic зберігає свої
хелпери потоку Claude у власному публічному seam `api.ts` / `contract-api.ts` замість
того, щоб просувати логіку бета-заголовків Anthropic і `service_tier` до загального
контракту `plugin-sdk/*`.

Інші поточні bundled-приклади:

- `@openclaw/openai-provider`: `api.ts` експортує конструктори provider-ів,
  хелпери моделей за замовчуванням і конструктори realtime provider-ів
- `@openclaw/openrouter-provider`: `api.ts` експортує конструктор provider-а, а також
  хелпери onboarding/config

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо хелпер справді є спільним, перемістіть його до нейтрального підшляху SDK,
  наприклад `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  capability-орієнтованої поверхні, замість того щоб жорстко зв’язувати два plugin-и між собою.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — детальна архітектура й модель capability
