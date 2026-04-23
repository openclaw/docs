---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідка з API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-23T17:31:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8635973d4c4081675ef104b9079667882ff1c6f8f7f73bcd1516222259bc1569
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між plugins і core. Ця сторінка є
довідником щодо **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший plugin? Почніть із [Створення plugins](/uk/plugins/building-plugins).
- Channel plugin? Див. [Channel plugins](/uk/plugins/sdk-channel-plugins).
- Provider plugin? Див. [Provider plugins](/uk/plugins/sdk-provider-plugins).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий
запуск і запобігає проблемам із циклічними залежностями. Для специфічних для channel
хелперів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core`
залишайте для ширшої umbrella-поверхні та спільних хелперів, таких як
`buildChannelConfigSchema`.

<Warning>
  Не імпортуйте branded convenience seams для provider або channel (наприклад,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані plugins компонують загальні підшляхи SDK всередині власних barrel-файлів `api.ts` /
  `runtime-api.ts`; споживачам core слід або використовувати ці локальні для plugin
  barrel-файли, або додати вузький загальний контракт SDK, коли потреба справді є
  крос-канальною.

Невеликий набір helper seams для bundled-plugin (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється у
згенерованій мапі експортів. Вони існують лише для підтримки bundled-plugin і
не рекомендовані як шляхи імпорту для нових сторонніх plugins.
</Warning>

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`; зарезервовані
helper-підшляхи bundled-plugin також там присутні, але є деталлю реалізації,
якщо лише сторінка документації явно не рекомендує їх.

### Вхід plugin

| Subpath                     | Ключові експорти                                                                                                                       |
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
    | `plugin-sdk/config-schema` | Експорт кореневої схеми Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні хелпери майстра налаштування, запити allowlist, builders статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Хелпери multi-account config/action-gate, хелпери fallback для облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, хелпери нормалізації account-id |
    | `plugin-sdk/account-resolution` | Пошук облікового запису + хелпери fallback за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі хелпери account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схем конфігурації channel |
    | `plugin-sdk/telegram-command-config` | Хелпери нормалізації/валідації користувацьких команд Telegram із fallback до bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі хелпери шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, хелпери життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні хелпери маршрутизації inbound + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні хелпери record-and-dispatch для inbound |
    | `plugin-sdk/messaging-targets` | Хелпери розбору/зіставлення target |
    | `plugin-sdk/outbound-media` | Спільні хелпери завантаження outbound media |
    | `plugin-sdk/outbound-runtime` | Хелпери outbound identity, send delegate та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі хелпери нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Хелпери життєвого циклу thread-binding та adapter |
    | `plugin-sdk/agent-media-payload` | Legacy builder payload медіа agent |
    | `plugin-sdk/conversation-runtime` | Хелпери conversation/thread binding, pairing та configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Хелпер знімка runtime config |
    | `plugin-sdk/runtime-group-policy` | Хелпери визначення runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні хелпери знімка/підсумку статусу channel |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схем конфігурації channel |
    | `plugin-sdk/channel-config-writes` | Хелпери авторизації запису конфігурації channel |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Хелпери редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні хелпери рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні хелпери auth/guard для direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та legacy-хелпери інтерактивних reply. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibility barrel для inbound debounce, mention matching, хелперів mention-policy та хелперів envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі хелпери mention-policy без ширшої runtime-поверхні inbound |
    | `plugin-sdk/channel-location` | Хелпери контексту та форматування розташування channel |
    | `plugin-sdk/channel-logging` | Хелпери логування channel для пропусків inbound і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів reply |
    | `plugin-sdk/channel-actions` | Хелпери message-action для channel, а також застарілі хелпери native schema, збережені для сумісності plugin |
    | `plugin-sdk/channel-targets` | Хелпери розбору/зіставлення target |
    | `plugin-sdk/channel-contract` | Типи контрактів channel |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, та типи secret target |
  </Accordion>

  <Accordion title="Підшляхи provider">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські хелпери налаштування локальних/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані хелпери налаштування self-hosted provider, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення CLI backend за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Хелпери визначення runtime API-key для provider plugins |
    | `plugin-sdk/provider-auth-api-key` | Хелпери онбордингу/запису профілю API-key, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний builder результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні хелпери інтерактивного входу для provider plugins |
    | `plugin-sdk/provider-env-vars` | Хелпери пошуку env var автентифікації provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders replay-policy, хелпери endpoint provider і хелпери нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні хелпери HTTP/можливостей endpoint provider, зокрема хелпери multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі хелпери контракту config/selection для web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Хелпери реєстрації/кешу provider для web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі хелпери config/credential для web-search для provider, яким не потрібне підключення enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі хелпери контракту config/credential для web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
    | `plugin-sdk/provider-web-search` | Хелпери реєстрації/кешу/runtime provider для web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також хелпери сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні хелпери wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Хелпери native transport provider, такі як guarded fetch, transport message transforms і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Хелпери patch конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Хелпери process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і security">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, хелпери реєстру команд, хелпери авторизації відправника |
    | `plugin-sdk/command-status` | Builders повідомлень command/help, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Визначення approver і хелпери action-auth у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Хелпери профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native adapter для можливостей/доставки approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний хелпер визначення approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені хелпери завантаження native approval adapter для hot entrypoints channel |
    | `plugin-sdk/approval-handler-runtime` | Ширші хелпери runtime для approval handler; віддавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Хелпери native approval target + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Хелпери payload reply для approval exec/plugin |
    | `plugin-sdk/command-auth-native` | Native auth команд + хелпери native session-target |
    | `plugin-sdk/command-detection` | Спільні хелпери виявлення команд |
    | `plugin-sdk/command-surface` | Хелпери нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі хелпери збирання secret-contract для surfaces секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі хелпери типізації `coerceSecretRef` і SecretRef для парсингу secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні хелпери trust, DM gating, external-content і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Хелпери політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі хелпери pinned-dispatcher без широкої runtime-поверхні infra |
    | `plugin-sdk/ssrf-runtime` | Хелпери pinned-dispatcher, SSRF-guarded fetch і політики SSRF |
    | `plugin-sdk/secret-input` | Хелпери парсингу secret input |
    | `plugin-sdk/webhook-ingress` | Хелпери запиту/target для Webhook |
    | `plugin-sdk/webhook-request-guards` | Хелпери розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і storage">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі хелпери runtime/logging/backup/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі хелпери runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні хелпери реєстрації та пошуку runtime-context channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні хелпери команд/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні хелпери pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Хелпери lazy імпорту/binding runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Хелпери виконання процесів |
    | `plugin-sdk/cli-runtime` | Хелпери форматування, очікування і версій CLI |
    | `plugin-sdk/gateway-runtime` | Хелпери клієнта Gateway і patch статусу channel |
    | `plugin-sdk/config-runtime` | Хелпери завантаження/запису config і пошуку config plugin |
    | `plugin-sdk/telegram-command-config` | Хелпери нормалізації назви/опису команд Telegram і перевірки дублікатів/конфліктів, навіть коли surface контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Хелпери approval exec/plugin, builders можливостей approval, хелпери auth/profile, хелпери native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні хелпери inbound/reply runtime, chunking, dispatch, Heartbeat, planner reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі хелпери dispatch/finalize для reply |
    | `plugin-sdk/reply-history` | Спільні хелпери коротковіконної історії reply, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі хелпери chunking для text/markdown |
    | `plugin-sdk/session-store-runtime` | Хелпери шляху session store + `updated-at` |
    | `plugin-sdk/state-paths` | Хелпери шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Хелпери route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні хелпери підсумку статусу channel/account, значення runtime-state за замовчуванням і хелпери метаданих issues |
    | `plugin-sdk/target-resolver-runtime` | Спільні хелпери resolver для target |
    | `plugin-sdk/string-normalization-runtime` | Хелпери нормалізації slug/string |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Runner команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені readers параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів target для send з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні хелпери шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Хелпери logger підсистем і редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Хелпери режиму Markdown-таблиць |
    | `plugin-sdk/json-store` | Невеликі хелпери читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Хелпери повторного входу для file-lock |
    | `plugin-sdk/persistent-dedupe` | Хелпери кешу dedupe з дисковим зберіганням |
    | `plugin-sdk/acp-runtime` | Хелпери runtime/session і reply-dispatch для ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | Лише для читання: визначення ACP binding без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схем runtime config agent |
    | `plugin-sdk/boolean-param` | Гнучкий reader boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Хелпери визначення збігів dangerous-name |
    | `plugin-sdk/device-bootstrap` | Хелпери bootstrap пристрою і токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви helper для passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Хелпери reply для команди `/models` і provider |
    | `plugin-sdk/skill-commands-runtime` | Хелпери виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Хелпери реєстру/build/serialize для native command |
    | `plugin-sdk/agent-harness` | Експериментальна trusted-plugin surface для низькорівневих agent harnesses: типи harness, хелпери steer/abort для active-run, хелпери bridge tools OpenClaw і утиліти результатів attempt |
    | `plugin-sdk/provider-zai-endpoint` | Хелпери виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Хелпери системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі хелпери bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Хелпери діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні хелпери класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнуті хелпери fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader обмеженого response-body без широкої runtime-поверхні media |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding розмови без routing configured binding або pairing stores |
    | `plugin-sdk/session-store-runtime` | Хелпери читання session-store без широких імпортів запису/обслуговування config |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту і фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі хелпери приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Хелпери нормалізації hostname і хостів SCP |
    | `plugin-sdk/retry-runtime` | Хелпери config retry і runner retry |
    | `plugin-sdk/agent-runtime` | Хелпери каталогу/ідентичності/workspace agent |
    | `plugin-sdk/directory-runtime` | Запит каталогу з опорою на config/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи capability і testing">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні хелпери fetch/transform/store для media, а також builders payload для media |
    | `plugin-sdk/media-generation-runtime` | Спільні хелпери failover для генерації media, вибір candidate і повідомлення про відсутню model |
    | `plugin-sdk/media-understanding` | Типи provider для media understanding, а також експорти helper для image/audio, орієнтовані на provider |
    | `plugin-sdk/text-runtime` | Спільні хелпери text/markdown/logging, такі як прибирання assistant-visible-text, хелпери render/chunking/table для markdown, хелпери редагування чутливих даних, хелпери тегів directive і утиліти safe-text |
    | `plugin-sdk/text-chunking` | Хелпер chunking для outbound text |
    | `plugin-sdk/speech` | Типи provider для speech, а також helper-експорти для directive, registry і validation, орієнтовані на provider |
    | `plugin-sdk/speech-core` | Спільні типи provider для speech, а також хелпери registry, directive і normalization |
    | `plugin-sdk/realtime-transcription` | Типи provider для realtime transcription, хелпери registry і спільний helper сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи provider для realtime voice і хелпери registry |
    | `plugin-sdk/image-generation` | Типи provider для генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, хелпери failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, хелпери failover, пошук provider і парсинг model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, хелпери failover, пошук provider і парсинг model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр Webhook target і хелпери встановлення route |
    | `plugin-sdk/webhook-path` | Хелпери нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні хелпери завантаження віддалених/локальних media |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня хелперів bundled memory-core для manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексу/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти engine foundation для хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding для хоста Memory, доступ до registry, локальний provider і загальні хелпери batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти engine QMD для хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти engine storage для хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні хелпери хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Хелпери запитів хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Хелпери секретів хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Хелпери журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Хелпери статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Хелпери runtime CLI хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Хелпери core runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Хелпери файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для хелперів core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для хелперів журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для хелперів файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні хелпери managed-markdown для plugins, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Runtime facade Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для хелперів статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня хелперів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Хелпери підтримки bundled browser plugin (`browser-support` лишається compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper bundled IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seams сумісності/хелперів для bundled channel |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams хелперів для bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                            |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)              |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець agent |
| `api.registerCliBackend(...)`                    | Локальний backend inference для CLI    |
| `api.registerChannel(...)`                       | Канал повідомлень                      |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в realtime       |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні голосові сесії realtime       |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео           |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                    |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                       |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                        |
| `api.registerWebFetchProvider(...)`              | Provider для web fetch / scrape        |
| `api.registerWebSearchProvider(...)`             | Веб-пошук                              |

### Tools і команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agent (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацьку команду (обходить LLM)         |

### Інфраструктура

| Method                                          | Що реєструє                            |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук подій                              |
| `api.registerHttpRoute(params)`                 | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                      |
| `api.registerCli(registrar, opts?)`             | Підкоманду CLI                         |
| `api.registerService(service)`                  | Фоновий сервіс                         |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний handler                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрику extension embedded-runner для Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивний суміжний із memory розділ prompt |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний корпус memory search/read    |

<Note>
  Зарезервовані простори назв адміністрування core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
  вужчу область методу Gateway. Для методів, що належать plugin,
  віддавайте перевагу префіксам, специфічним для plugin.
</Note>

<Accordion title="Коли використовувати registerEmbeddedExtensionFactory">
  Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin потребує Pi-native
  синхронізації подій під час embedded-запусків OpenClaw — наприклад, для асинхронних переписувань `tool_result`,
  які мають відбутися до того, як буде надіслано фінальне повідомлення з результатом tool.

Це нині seam для bundled-plugin: лише bundled plugins можуть реєструвати його,
і вони мають оголосити `contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Для всього, що не потребує цього нижчорівневого seam,
використовуйте звичайні hooks plugin OpenClaw.
</Accordion>

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для кореневої довідки CLI,
  маршрутизації та lazy-реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася lazy-loaded у звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команд верхнього рівня, що експонує
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

Використовуйте лише `commands`, коли вам не потрібна lazy-реєстрація кореневого CLI.
Цей eager-сумісний шлях усе ще підтримується, але він не встановлює
placeholders на основі descriptor для lazy loading на етапі парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає plugin змогу володіти конфігурацією за замовчуванням для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом provider у model refs на кшталт `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  значення plugin за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Механізм контексту (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб механізм міг налаштовувати доповнення prompt. |
| `api.registerMemoryCapability(capability)` | Єдину можливість memory                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder розділу prompt для memory                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush для memory                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime для memory                                                                                                                           |

### Adapters embedding для memory

| Method                                         | Що реєструє                                   |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding для memory для активного plugin |

- `registerMemoryCapability` — це пріоритетний API ексклюзивного plugin для memory.
- `registerMemoryCapability` також може експонувати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugins могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної структури
  конкретного plugin для memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застаріло-сумісні API ексклюзивного plugin для memory.
- `registerMemoryEmbeddingProvider` дає активному plugin для memory змогу зареєструвати
  один або кілька id adapter embedding (наприклад `openai`, `gemini` або користувацький id,
  визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  id adapter.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик binding розмови |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler заявляє про dispatch, handlers із нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація inbound thread/topic. `metadata` залишайте для extras, специфічних для channel.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до `metadata`, специфічних для channel.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні hooks `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID plugin                                                                                  |
| `api.name`               | `string`                  | Відображувана назва                                                                        |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                     |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                   |
| `api.config`             | `OpenClawConfig`          | Поточний знімок config (активний runtime-знімок у пам’яті, коли доступний)                |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація plugin з `plugins.entries.<id>.config`                                        |
| `api.runtime`            | `PluginRuntime`           | [Хелпери runtime](/uk/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger з відповідною областю (`debug`, `info`, `warn`, `error`)                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin                                                    |

## Угода щодо внутрішніх модулів

У межах вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні runtime-експорти
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшена точка входу лише для setup (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні surfaces bundled plugin, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), віддають перевагу
активному runtime-знімку config, коли OpenClaw уже запущено. Якщо runtime-знімок
ще не існує, вони повертаються до визначеного config-файлу на диску.

Provider plugins можуть експортувати вузький локальний контрактний barrel plugin, коли
helper навмисно є специфічним для provider і ще не належить до загального підшляху SDK.
Приклади bundled:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і хелперів stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builders provider,
  хелпери model за замовчуванням і builders provider для realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder provider
  разом із хелперами onboarding/config.

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді є спільним, підніміть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  capability-орієнтованої surface, замість того щоб жорстко зв’язувати два plugins.
</Warning>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Хелпери runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору назв `api.runtime`.
  </Card>
  <Card title="Налаштування і config" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми config.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих surfaces.
  </Card>
  <Card title="Внутрішня будова plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель можливостей.
  </Card>
</CardGroup>
