---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK Overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-05T18:49:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ea8cc1343b2dc1b4243b0562d19bebb1fdf7eb5065220b17e87cfd8aecc3e
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Огляд Plugin SDK

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка є
довідником про **що імпортувати** і **що можна реєструвати**.

<Tip>
  **Шукаєте покроковий посібник?**
  - Перший plugin? Почніть із [Getting Started](/uk/plugins/building-plugins)
  - Plugin каналу? Дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  - Plugin постачальника? Дивіться [Provider Plugins](/uk/plugins/sdk-provider-plugins)
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий
запуск і запобігає проблемам із циклічними залежностями. Для специфічних для
каналів допоміжних засобів entry/build віддавайте перевагу
`openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої узагальненої поверхні та спільних помічників, таких як
`buildChannelConfigSchema`.

Не додавайте й не використовуйте зручні шви, названі на честь постачальників,
такі як `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, або
допоміжні шви з брендуванням каналів. Вбудовані plugins мають компонувати
узагальнені підшляхи SDK у власних barrel-файлах `api.ts` або `runtime-api.ts`,
а ядро має або використовувати ці локальні barrel-файли plugin, або додавати
вузький узагальнений контракт SDK, коли потреба справді є міжканальною.

Згенерована карта експортів усе ще містить невеликий набір допоміжних швів
вбудованих plugins, таких як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Ці
підшляхи існують лише для підтримки та сумісності вбудованих plugins; вони
навмисно не включені до загальної таблиці нижче і не є рекомендованим шляхом
імпорту для нових сторонніх plugins.

## Довідник підшляхів

Найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список
із понад 200 підшляхів міститься у `scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні підшляхи вбудованих plugins усе ще з’являються в цьому
згенерованому списку. Розглядайте їх як поверхні деталей реалізації/сумісності,
якщо лише сторінка документації явно не просуває одну з них як публічну.

### Entry plugin

| Підшлях                    | Ключові експорти                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні помічники майстра налаштування, підказки списку дозволених, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Помічники для конфігурації/обмеження дій для кількох облікових записів, помічники резервного переходу на типовий обліковий запис |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, помічники нормалізації id облікового запису |
    | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису + резервного переходу до типового |
    | `plugin-sdk/account-helpers` | Вузькі помічники для списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Помічники нормалізації/валідації користувацьких команд Telegram із резервною підтримкою вбудованого контракту |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Спільні помічники для маршрутизації вхідних повідомлень + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні помічники запису й диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Помічники розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні помічники завантаження вихідних медіа |
    | `plugin-sdk/outbound-runtime` | Помічники вихідної ідентичності/делегування надсилання |
    | `plugin-sdk/thread-bindings-runtime` | Помічники життєвого циклу та адаптерів прив’язок потоків |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник медіа-пейлоаду агента |
    | `plugin-sdk/conversation-runtime` | Помічники прив’язки розмови/потоку, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Помічник знімка конфігурації часу виконання |
    | `plugin-sdk/runtime-group-policy` | Помічники визначення group-policy під час виконання |
    | `plugin-sdk/channel-status` | Спільні помічники знімка/зведення статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви config-schema каналу |
    | `plugin-sdk/channel-config-writes` | Помічники авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні прелюд-експорти plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Помічники редагування/читання конфігурації списку дозволених |
    | `plugin-sdk/group-access` | Спільні помічники рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні помічники auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Помічники нормалізації/скорочення пейлоаду інтерактивних відповідей |
    | `plugin-sdk/channel-inbound` | Debounce, зіставлення згадок, помічники envelope |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Помічники розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
  </Accordion>

  <Accordion title="Підшляхи постачальників">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Добірні помічники налаштування локальних/self-hosted постачальників |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані помічники налаштування self-hosted постачальника, сумісного з OpenAI |
    | `plugin-sdk/provider-auth-runtime` | Помічники визначення API-ключа під час виконання для plugins постачальників |
    | `plugin-sdk/provider-auth-api-key` | Помічники онбордингу/запису профілю для API-ключів |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні помічники інтерактивного входу для plugins постачальників |
    | `plugin-sdk/provider-env-vars` | Помічники пошуку env vars auth постачальника |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, помічники endpoint постачальників і помічники нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Узагальнені помічники HTTP/можливостей endpoint постачальника |
    | `plugin-sdk/provider-web-fetch` | Помічники реєстрації/кешу постачальника web-fetch |
    | `plugin-sdk/provider-web-search` | Помічники реєстрації/кешу/конфігурації постачальника web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та помічники сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібне |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні помічники обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Помічники виправлення конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Помічники локальних для процесу singleton/map/cache |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, помічники реєстру команд, помічники авторизації відправника |
    | `plugin-sdk/approval-auth-runtime` | Помічники визначення approver і auth дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Помічники профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери native approval capability/delivery |
    | `plugin-sdk/approval-native-runtime` | Помічники native approval target + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Помічники пейлоаду відповіді exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Native command auth + помічники native session-target |
    | `plugin-sdk/command-detection` | Спільні помічники визначення команд |
    | `plugin-sdk/command-surface` | Помічники нормалізації тіла команди й командної поверхні |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Спільні помічники довіри, DM gating, external-content і збору секретів |
    | `plugin-sdk/ssrf-policy` | Помічники allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-runtime` | Помічники pinned-dispatcher, fetch із захистом SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Помічники розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Помічники запитів/цілей webhook |
    | `plugin-sdk/webhook-request-guards` | Помічники розміру тіла запиту/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широка поверхня помічників runtime/logging/backup/install plugin |
    | `plugin-sdk/runtime-env` | Вузькі помічники env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні помічники команд/hook/http/interactive plugin |
    | `plugin-sdk/hook-runtime` | Спільні помічники pipeline webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Помічники лінивого імпорту/прив’язки runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Помічники виконання процесів |
    | `plugin-sdk/cli-runtime` | Помічники форматування CLI, очікування та версії |
    | `plugin-sdk/gateway-runtime` | Помічники клієнта gateway і виправлення статусу каналу |
    | `plugin-sdk/config-runtime` | Помічники завантаження/запису конфігурації |
    | `plugin-sdk/telegram-command-config` | Нормалізація імен/описів команд Telegram та перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/approval-runtime` | Помічники exec/plugin approval, побудовники approval-capability, помічники auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні помічники runtime для вхідних повідомлень/відповідей, chunking, dispatch, heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники dispatch/finalize відповіді |
    | `plugin-sdk/reply-history` | Спільні помічники reply-history для коротких вікон, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі помічники chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Помічники шляху сховища сесії + updated-at |
    | `plugin-sdk/state-paths` | Помічники шляхів до директорій state/OAuth |
    | `plugin-sdk/routing` | Помічники маршруту/ключа сесії/прив’язки облікового запису, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні помічники зведення статусу каналу/облікового запису, типові значення runtime-state і помічники метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні помічники визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягуйте рядкові URL з вхідних даних на кшталт fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-send` | Витягуйте канонічні поля цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні помічники шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Помічники logger підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Помічники режиму таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі помічники читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Помічники повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Помічники дискового кешу дедуплікації |
    | `plugin-sdk/acp-runtime` | Помічники runtime/session ACP і dispatch відповіді |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema runtime агента |
    | `plugin-sdk/boolean-param` | Читач параметрів для нестрогих булевих значень |
    | `plugin-sdk/dangerous-name-runtime` | Помічники визначення збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Помічники bootstrap пристрою і токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви для passive-channel і статусних помічників |
    | `plugin-sdk/models-provider-runtime` | Помічники `/models` command/provider reply |
    | `plugin-sdk/skill-commands-runtime` | Помічники переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Помічники реєстру/build/serialize native command |
    | `plugin-sdk/provider-zai-endpoint` | Помічники визначення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Помічники системних подій/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі помічники обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Помічники діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні помічники класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Помічники обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/host-runtime` | Помічники нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Помічники конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Помічники директорії/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація директорій на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні помічники fetch/transform/store медіа, а також побудовники медіа-пейлоаду |
    | `plugin-sdk/media-understanding` | Типи постачальників media understanding, а також експорти помічників зображень/аудіо для постачальників |
    | `plugin-sdk/text-runtime` | Спільні помічники тексту/markdown/logging, такі як видалення видимого для асистента тексту, render/chunking/table-помічники markdown, помічники редагування, помічники тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Помічник chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи постачальників мовлення, а також помічники директив, реєстру та валідації для постачальників |
    | `plugin-sdk/speech-core` | Спільні типи постачальників мовлення, реєстр, директиви та помічники нормалізації |
    | `plugin-sdk/realtime-transcription` | Типи постачальників realtime transcription і помічники реєстру |
    | `plugin-sdk/realtime-voice` | Типи постачальників realtime voice і помічники реєстру |
    | `plugin-sdk/image-generation` | Типи постачальників генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, failover, auth і помічники реєстру |
    | `plugin-sdk/video-generation` | Типи постачальників/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, помічники failover, пошук постачальника і розбір model-ref |
    | `plugin-sdk/webhook-targets` | Помічники реєстру цілей webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Помічники нормалізації шляху webhook |
    | `plugin-sdk/web-media` | Спільні помічники завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для користувачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів вбудованого memory-core для manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Експорти embedding engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Помічники статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помічники runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Помічники core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів вбудованого memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані допоміжні підшляхи вбудованих компонентів">
    | Сімейство | Поточні підшляхи | Призначене використання |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки вбудованого browser plugin |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper/runtime вбудованого Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper/runtime вбудованого LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів вбудованого IRC |
    | Специфічні для каналу помічники | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Шви сумісності/допоміжні шви вбудованих каналів |
    | Специфічні для auth/plugin помічники | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Допоміжні шви вбудованих можливостей/plugins; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                            | Що реєструє                    |
| ------------------------------------------------ | ------------------------------ |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)      |
| `api.registerChannel(...)`                       | Канал повідомлень              |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT    |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова transcription realtime |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні сесії realtime voice  |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео   |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень            |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                |
| `api.registerWebFetchProvider(...)`              | Постачальник web fetch / scrape |
| `api.registerWebSearchProvider(...)`             | Вебпошук                       |

### Tools і команди

| Метод                          | Що реєструє                                   |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent tool (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)          |

### Інфраструктура

| Метод                                         | Що реєструє           |
| --------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook події            |
| `api.registerHttpRoute(params)`                | HTTP endpoint gateway |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод gateway     |
| `api.registerCli(registrar, opts?)`            | Підкоманду CLI        |
| `api.registerService(service)`                 | Фоновий сервіс        |
| `api.registerInteractiveHandler(registration)` | Інтерактивний handler |

Зарезервовані простори імен core admin (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається
призначити вужчу область gateway method. Для методів, що належать plugin,
віддавайте перевагу префіксам, специфічним для plugin.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать registrar
- `descriptors`: дескриптори команд на етапі розбору, що використовуються для
  довідки кореневого CLI, маршрутизації та лінивої реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною в
звичайному шляху кореневого CLI, надайте `descriptors`, які охоплюють кожен
корінь команди верхнього рівня, що надається цим registrar.

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

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива
реєстрація кореневого CLI. Цей сумісний eager-шлях усе ще підтримується, але
він не встановлює placeholders на основі descriptor для лінивого завантаження
на етапі розбору.

### Ексклюзивні слоти

| Метод                                      | Що реєструє                          |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один) |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції prompt пам’яті     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану скидання пам’яті      |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті              |

### Адаптери embeddings пам’яті

| Метод                                          | Що реєструє                                      |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embeddings пам’яті для активного plugin |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними для plugins пам’яті.
- `registerMemoryEmbeddingProvider` дозволяє активному plugin пам’яті
  зареєструвати один або кілька id адаптерів embeddings (наприклад `openai`,
  `gemini` або користувацький id, визначений plugin).
- Користувацька конфігурація, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно зареєстрованих
  id цих адаптерів.

### Події та життєвий цикл

| Метод                                       | Що робить                    |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований hook життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови     |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handlers із нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler бере диспетчеризацію на себе, handlers із нижчим пріоритетом і типовий шлях диспетчеризації моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює це значення, handlers із нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як пропуск `cancel`), а не перевизначенням.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id plugin                                                                                   |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                               |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                 |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                      |
| `api.rootDir`            | `string?`                 | Коренева директорія plugin (необов’язково)                                                  |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, коли доступний)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація plugin з `plugins.entries.<id>.config`                                         |
| `api.runtime`            | `PluginRuntime`           | [Помічники runtime](/uk/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначити шлях відносно кореня plugin                                                       |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх
імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшений entry лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Публічні поверхні вбудованих plugins, що завантажуються через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), тепер віддають
перевагу активному знімку конфігурації runtime, коли OpenClaw уже запущено. Якщо
знімка runtime ще немає, вони переходять до резервного варіанту з визначеним
файлом конфігурації на диску.

Plugins постачальників також можуть надавати вузький локальний barrel-контракт
plugin, коли помічник навмисно є специфічним для постачальника і ще не належить
до узагальненого підшляху SDK. Поточний вбудований приклад: постачальник
Anthropic зберігає свої помічники потоку Claude у власному публічному шві
`api.ts` / `contract-api.ts` замість того, щоб просувати логіку beta-header і
`service_tier` Anthropic до узагальненого контракту `plugin-sdk/*`.

Інші поточні вбудовані приклади:

- `@openclaw/openai-provider`: `api.ts` експортує побудовники постачальника,
  помічники типових моделей і побудовники realtime-постачальників
- `@openclaw/openrouter-provider`: `api.ts` експортує побудовник постачальника, а також
  помічники онбордингу/конфігурації

<Warning>
  Production-код extensions також має уникати імпортів
  `openclaw/plugin-sdk/<other-plugin>`. Якщо помічник справді є спільним,
  просуньте його до нейтрального підшляху SDK, такого як
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість того щоб жорстко зв’язувати два plugins.
</Warning>

## Пов’язане

- [Entry Points](/uk/plugins/sdk-entrypoints) — параметри `definePluginEntry` і `defineChannelPluginEntry`
- [Runtime Helpers](/uk/plugins/sdk-runtime) — повний довідник простору імен `api.runtime`
- [Setup and Config](/uk/plugins/sdk-setup) — пакування, маніфести, схеми конфігурації
- [Testing](/uk/plugins/sdk-testing) — утиліти тестування та правила lint
- [SDK Migration](/uk/plugins/sdk-migration) — міграція із застарілих поверхонь
- [Plugin Internals](/uk/plugins/architecture) — глибока архітектура та модель можливостей
