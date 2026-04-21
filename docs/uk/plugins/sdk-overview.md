---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати.
    - Вам потрібен довідник з усіх методів реєстрації в OpenClawPluginApi.
    - Ви шукаєте конкретний експорт SDK.
sidebarTitle: SDK Overview
summary: Мапа імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-21T20:37:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16ef34e4ad4550967d06ea6bd94b3400431c0fb536bf267cc4e8a09ec9483695
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugin-ами та ядром. Ця сторінка є
довідником з **того, що імпортувати**, і **того, що можна зареєструвати**.

<Tip>
  **Шукаєте покроковий посібник?**
  - Перший plugin? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Channel plugin? Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Provider plugin? Див. [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Правило імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для channel
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої парасолькової поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Не додавайте і не використовуйте зручні шари з назвами provider-ів, такі як
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шари, брендові для channel. Вбудовані plugin-и мають компонувати узагальнені
підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`, а ядро
має або використовувати ці локальні для plugin-а barrel-файли, або додавати вузький узагальнений контракт SDK,
коли така потреба справді є між channel-ами.

Згенерована мапа експорту все ще містить невеликий набір допоміжних
шарів для вбудованих plugin-ів, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності вбудованих plugin-ів; вони
навмисно не включені до загальної таблиці нижче й не є рекомендованим
шляхом імпорту для нових сторонніх plugin-ів.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із
понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи для вбудованих plugin-ів усе ще з’являються в цьому згенерованому списку.
Розглядайте їх як поверхні деталей реалізації/сумісності, якщо лише сторінка документації
явно не позначає одну з них як публічну.

### Entry plugin-а

| Підшлях                    | Ключові експорти                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи channel">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, підказки allowlist, збирачі статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для мультиакаунтної конфігурації/гейтів дій, допоміжні засоби резервного вибору акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку акаунта + резервного вибору за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервною підтримкою контракту вбудованих plugin-ів |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби гейту авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршрутизації вхідних повідомлень + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й dispatch для вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної ідентичності, делегата надсилання та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий builder payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки conversation/thread, pairing та налаштованих binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення policy груп у runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary статусу channel |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації channel |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації channel |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти channel plugin-ів |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень щодо доступу груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби семантичного представлення повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Message Presentation](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для debounce вхідних повідомлень, зіставлення згадок, допоміжних засобів policy згадок і допоміжних засобів envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби policy згадок без ширшої surface runtime вхідних повідомлень |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту розташування channel та форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування channel для відкидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями channel, а також застарілі допоміжні засоби нативної схеми, збережені для сумісності plugin-ів |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту channel |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби контракту secret, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей secret |
  </Accordion>

  <Accordion title="Підшляхи provider">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted provider, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Значення CLI backend за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключа в runtime для provider plugin-ів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний builder результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для provider plugin-ів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env-var auth provider-а |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и policy повторного відтворення, допоміжні засоби endpoint provider-а та допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Узагальнені допоміжні засоби HTTP/capability endpoint provider-а |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування provider-а web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для provider-ів, яким не потрібне підключення enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter-и облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime provider-а web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні засоби wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Нативні допоміжні засоби транспорту provider-а, такі як guarded fetch, перетворення транспортних повідомлень і потоки подій транспорту із можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби локального для процесу singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Builder-и повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення approver-а та auth дій у тому ж чаті |
    | `plugin-sdk/approval-client-runtime` | Нативні допоміжні засоби профілю/фільтра approval для exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери capability/delivery approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway для approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені нативні допоміжні засоби завантаження адаптера approval для гарячих entrypoint-ів channel |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime handler-а approval; віддавайте перевагу вужчим шарам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Нативні допоміжні засоби цілі approval + прив’язки акаунта |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді approval для exec/plugin |
    | `plugin-sdk/command-auth-native` | Нативний auth команд + нативні допоміжні засоби session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команди та поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-контрактів для поверхонь secret channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для парсингу secret-контрактів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, гейтингу DM, зовнішнього вмісту та збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби policy SSRF для allowlist хостів і приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні runtime infra |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF і policy SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби парсингу secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/установлення plugin-ів |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Узагальнені допоміжні засоби реєстрації та пошуку runtime-context channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive plugin-а |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy-імпорту/прив’язки runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування та версії |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway і patch статусу channel |
    | `plugin-sdk/config-runtime` | Допоміжні засоби завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації імені/опису команд Telegram та перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel-а text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби approval для exec/plugin, builder-и capability approval, допоміжні засоби auth/profile, нативної маршрутизації/runtime |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime для вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії відповідей, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій + `updated-at` |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби summary статусу channel/акаунта, значення стану runtime за замовчуванням і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби resolver-а цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із входів, подібних до fetch/request |
    | `plugin-sdk/run-command` | Runner команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger-а підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/сесії ACP і dispatch відповіді |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Зчитувач нестрогих boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби початкового налаштування пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповідей команд/provider-ів `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби мосту tool OpenClaw і утиліти результатів attempt |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні засоби системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy та pinned lookup |
    | `plugin-sdk/runtime-fetch` | Fetch runtime з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Зчитувач обмеженого body відповіді без широкої поверхні runtime медіа |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації налаштованих binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби читання сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення й нормалізації примітивних record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і runner-а retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація директорій на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи capability і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store медіа, а також builder-и payload медіа |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи provider-а для розуміння медіа, а також provider-орієнтовані експорти допоміжних засобів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, такі як вилучення тексту, видимого асистенту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи provider-а мовлення, а також provider-орієнтовані допоміжні засоби директив, реєстру і валідації |
    | `plugin-sdk/speech-core` | Спільні допоміжні засоби типів, реєстру, директив і нормалізації provider-а мовлення |
    | `plugin-sdk/realtime-transcription` | Типи provider-а транскрипції в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/realtime-voice` | Типи provider-а голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи provider-а генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні допоміжні засоби типів, failover, auth і реєстру генерації зображень |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні допоміжні засоби типів генерації музики, failover, пошуку provider-а та парсингу model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні допоміжні засоби типів генерації відео, failover, пошуку provider-а та парсингу model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів вбудованого memory-core для менеджера/конфігурації/файлів/допоміжних засобів CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до реєстру, локальний provider і узагальнені допоміжні засоби batch/remote |
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
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для допоміжних засобів core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для plugin-ів, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних засобів статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів вбудованого memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих helper-ів">
    | Родина | Поточні підшляхи | Призначене використання |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки вбудованого browser plugin-а (`browser-support` залишається barrel-ом сумісності) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper-ів/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper-ів/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper-ів вбудованого IRC |
    | Специфічні для channel helper-и | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шари сумісності/helper-ів вбудованих channel |
    | Специфічні для auth/plugin helper-и | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шари helper-ів вбудованих функцій/plugin-ів; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` із такими
методами:

### Реєстрація capability

| Метод                                            | Що реєструє                            |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)              |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend inference CLI        |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями            |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео           |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                    |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                       |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                        |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape            |
| `api.registerWebSearchProvider(...)`             | Вебпошук                               |

### Tools і команди

| Метод                          | Що реєструє                                  |
| ------------------------------ | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)           |

### Інфраструктура

| Метод                                         | Що реєструє                            |
| --------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`    | Hook подій                             |
| `api.registerHttpRoute(params)`               | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`    | RPC-метод Gateway                      |
| `api.registerCli(registrar, opts?)`           | Підкоманда CLI                         |
| `api.registerService(service)`                | Фонова служба                          |
| `api.registerInteractiveHandler(registration)` | Інтерактивний handler                  |
| `api.registerMemoryPromptSupplement(builder)` | Адитивний розділ prompt, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)` | Адитивний corpus для пошуку/читання memory |

Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
вужчу область видимості методу Gateway. Для методів, що належать plugin-у,
віддавайте перевагу префіксам, специфічним для plugin-а.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать registrar-у
- `descriptors`: дескриптори команд на етапі парсингу, які використовуються для кореневої довідки CLI,
  маршрутизації та lazy-реєстрації CLI plugin-а

Якщо ви хочете, щоб команда plugin-а залишалася lazy-loaded у звичайному кореневому шляху CLI,
надайте `descriptors`, що охоплюють кожен корінь команди верхнього рівня, який відкриває
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
        description: "Керування акаунтами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, коли вам не потрібна lazy-реєстрація кореневого CLI.
Цей eager-шлях сумісності залишається підтримуваним, але він не встановлює
placeholder-и на основі descriptor для lazy-завантаження на етапі парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає plugin-у змогу володіти конфігурацією за замовчуванням для локального
AI CLI backend, такого як `codex-cli`.

- `id` backend-у стає префіксом provider-а в model ref, наприклад `codex-cli/gpt-5`.
- `config` backend-у використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має перевагу. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  значення plugin-а за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань для сумісності після злиття
  (наприклад, для нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що реєструє                                                                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (лише один активний одночасно). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб engine міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану capability memory                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | Builder розділу prompt для memory                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush для memory                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для memory                                                                                                                            |

### Адаптери embedding для Memory

| Метод                                         | Що реєструє                                  |
| --------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для Memory для активного plugin-а |

- `registerMemoryCapability` — це рекомендований API ексклюзивного plugin-а memory.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugin-и могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватного layout
  конкретного plugin-а memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застарілі, але сумісні API ексклюзивних plugin-ів memory.
- `registerMemoryEmbeddingProvider` дає активному plugin-у memory змогу зареєструвати один
  або більше id адаптерів embedding (наприклад, `openai`, `gemini` або користувацький id,
  визначений plugin-ом).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно зареєстрованих id цих
  адаптерів.

### Події та життєвий цикл

| Метод                                       | Що робить                 |
| ------------------------------------------- | ------------------------- |
| `api.on(hookName, handler, opts?)`          | Типізований hook життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки conversation |

### Семантика рішень hook-ів

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler заявляє про dispatch, handler-и з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID plugin-а                                                                                 |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin-а (необов’язково)                                                             |
| `api.description`        | `string?`                 | Опис plugin-а (необов’язково)                                                               |
| `api.source`             | `string`                  | Шлях до джерела plugin-а                                                                    |
| `api.rootDir`            | `string?`                 | Коренева директорія plugin-а (необов’язково)                                                |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot конфігурації (активний snapshot runtime у пам’яті, якщо доступний)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для plugin-а конфігурація з `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня plugin-а                                                   |

## Внутрішня угода щодо модулів

Усередині вашого plugin-а використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу plugin-а
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих plugin-ів, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), тепер віддають перевагу
активному snapshot конфігурації runtime, коли OpenClaw уже запущений. Якщо snapshot
runtime ще не існує, вони повертаються до визначеного файла конфігурації на диску.

Plugin-и provider-ів також можуть надавати вузький локальний barrel контракту plugin-а, коли
допоміжний засіб навмисно є специфічним для provider-а і ще не належить до
узагальненого підшляху SDK. Поточний вбудований приклад: provider Anthropic зберігає свої
допоміжні засоби потоку Claude у власному публічному шарі `api.ts` / `contract-api.ts` замість
просування логіки beta-header Anthropic і `service_tier` до узагальненого
контракту `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує builder-и provider-а,
  допоміжні засоби моделей за замовчуванням і builder-и provider-а realtime
- `@openclaw/openrouter-provider`: `api.ts` експортує builder provider-а, а також
  допоміжні засоби onboarding/config

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, просуньте його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на capability, замість того щоб зв’язувати два plugin-и між собою.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — детальна архітектура та модель capability
