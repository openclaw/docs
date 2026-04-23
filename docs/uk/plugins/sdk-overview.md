---
read_when:
    - Вам потрібно знати, з якого subpath SDK імпортувати】【”】【analysis to=final code_block=None  ақәascii_fix_REASONING
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний export SDK
sidebarTitle: SDK overview
summary: Import map, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-23T21:03:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: efe676e4907428459ed3e30dd2e1df891eae0f0f1e87b0a850eb45140572a348
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між Plugins і core. Ця сторінка є
довідником для **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший Plugin? Почніть з [Створення Plugins](/uk/plugins/building-plugins).
- Plugin каналу? Див. [Plugins каналів](/uk/plugins/sdk-channel-plugins).
- Plugin провайдера? Див. [Plugins провайдерів](/uk/plugins/sdk-provider-plugins).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного subpath:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен subpath — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для entry/build helper-ів, специфічних для каналів,
віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої umbrella-поверхні та спільних helper-ів, як-от
`buildChannelConfigSchema`.

<Warning>
  Не імпортуйте provider- або channel-брендовані convenience-seam-и (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані Plugins композують універсальні subpath-и SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачам core слід або використовувати ці plugin-local
  barrel-и, або додавати вузький універсальний контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір helper-seam-ів для bundled Plugin (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється у
згенерованій export map. Вони існують лише для супроводу bundled Plugin і
не рекомендуються як шляхи імпорту для нових сторонніх Plugins.
</Warning>

## Довідник subpath-ів

Найуживаніші subpath-и, згруповані за призначенням. Згенерований повний список із
200+ subpath-ів міститься в `scripts/lib/plugin-sdk-entrypoints.json`; зарезервовані
helper-subpath-и bundled Plugin там теж присутні, але є деталлю реалізації,
якщо тільки якась сторінка документації явно не рекомендує їх.

### Entry Plugin

| Subpath                     | Key exports                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpath-и каналів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Root Zod-схема `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні helper-и setup wizard, prompts allowlist, builders статусу setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper-и multi-account config/action-gate, helper-и fallback для default-account |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper-и нормалізації account-id |
    | `plugin-sdk/account-resolution` | Lookup account + helper-и fallback до default |
    | `plugin-sdk/account-helpers` | Вузькі helper-и list/action для account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Helper-и нормалізації/валідації кастомних команд Telegram з fallback до bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі helper-и authorization gate для команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper-и життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні helper-и для побудови inbound route + envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні helper-и для inbound record-and-dispatch |
    | `plugin-sdk/messaging-targets` | Helper-и парсингу/зіставлення target |
    | `plugin-sdk/outbound-media` | Спільні helper-и завантаження outbound media |
    | `plugin-sdk/outbound-runtime` | Helper-и outbound identity, send delegate і планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі helper-и нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper-и життєвого циклу та adapter для thread-binding |
    | `plugin-sdk/agent-media-payload` | Застарілий builder media payload агента |
    | `plugin-sdk/conversation-runtime` | Helper-и conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Helper runtime config snapshot |
    | `plugin-sdk/runtime-group-policy` | Helper-и розв’язання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні helper-и snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі primitives схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Helper-и authorization для config-write каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-export-и Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Helper-и редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні helper-и рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні helper-и auth/guard для direct-DM |
    | `plugin-sdk/interactive-runtime` | Semantic presentation повідомлень, доставка та helper-и застарілої interactive reply. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibility barrel для inbound debounce, mention matching, helper-ів mention-policy та envelope |
    | `plugin-sdk/channel-mention-gating` | Вузькі helper-и mention-policy без ширшої inbound runtime-поверхні |
    | `plugin-sdk/channel-location` | Helper-и контексту й форматування location каналу |
    | `plugin-sdk/channel-logging` | Helper-и логування каналу для inbound drop і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів reply |
    | `plugin-sdk/channel-actions` | Helper-и дій повідомлень каналу, а також застарілі helper-и native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-targets` | Helper-и парсингу/зіставлення target |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Wiring feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі helper-и secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Subpath-и провайдерів">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Добірні helper-и setup для локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані helper-и setup для self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper-и runtime-розв’язання API-ключів для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Helper-и onboarding/profile-write для API-ключів, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний builder результату OAuth auth |
    | `plugin-sdk/provider-auth-login` | Спільні helper-и інтерактивного login для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Helper-и пошуку env vars для auth провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и replay-policy, helper-и endpoint провайдерів і helper-и нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні helper-и HTTP/endpoint capability для провайдерів, зокрема helper-и multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі helper-и контракту config/selection для web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper-и реєстрації/cache/runtime для web-fetch провайдерів |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі helper-и config/credential для web-search провайдерів, яким не потрібне ввімкнення Plugin у wiring |
    | `plugin-sdk/provider-web-search-contract` | Вузькі helper-и контракту config/credential для web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped setter/getter-и облікових даних |
    | `plugin-sdk/provider-web-search` | Helper-и реєстрації/cache/runtime для web-search провайдерів |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + diagnostics і helper-и compat для xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні helper-и wrapper для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Native helper-и provider transport, такі як guarded fetch, transport message transforms і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Helper-и patch конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Helper-и process-local singleton/map/cache |
  </Accordion>

  <Accordion title="Subpath-и auth і security">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper-и registry команд, helper-и авторизації відправника |
    | `plugin-sdk/command-status` | Builder-и повідомлень command/help, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Розв’язання approver і helper-и same-chat action-auth |
    | `plugin-sdk/approval-client-runtime` | Native helper-и profile/filter для exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native adapter-и capability/delivery для approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний helper розв’язання approval gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі helper-и завантаження native approval adapter для гарячих channel entrypoint |
    | `plugin-sdk/approval-handler-runtime` | Ширші helper-и runtime для approval handler; віддавайте перевагу вужчим adapter/gateway seam-ам, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Native helper-и target + account-binding для approval |
    | `plugin-sdk/approval-reply-runtime` | Helper-и reply payload для exec/plugin approval |
    | `plugin-sdk/command-auth-native` | Native command auth + native helper-и session-target |
    | `plugin-sdk/command-detection` | Спільні helper-и виявлення команд |
    | `plugin-sdk/command-surface` | Helper-и нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі helper-и збирання secret-contract для secret-поверхонь channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі helper-и `coerceSecretRef` і типізації SecretRef для парсингу secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні helper-и trust, DM gating, external-content і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Helper-и allowlist хостів і SSRF policy для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі helper-и pinned-dispatcher без широкої infra runtime-поверхні |
    | `plugin-sdk/ssrf-runtime` | Helper-и pinned-dispatcher, SSRF-guarded fetch і SSRF policy |
    | `plugin-sdk/secret-input` | Helper-и парсингу secret input |
    | `plugin-sdk/webhook-ingress` | Helper-и request/target для webhook |
    | `plugin-sdk/webhook-request-guards` | Helper-и розміру тіла запиту/timeout |
  </Accordion>

  <Accordion title="Subpath-и runtime і storage">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі helper-и runtime/logging/backup/plugin-install |
    | `plugin-sdk/runtime-env` | Вузькі helper-и runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Універсальні helper-и реєстрації та lookup runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні helper-и plugin command/hook/http/interactive |
    | `plugin-sdk/hook-runtime` | Спільні helper-и pipeline webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Helper-и lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper-и exec процесів |
    | `plugin-sdk/cli-runtime` | Helper-и форматування, wait і version для CLI |
    | `plugin-sdk/gateway-runtime` | Helper-и клієнта Gateway і patch channel-status |
    | `plugin-sdk/config-runtime` | Helper-и load/write конфігурації та helper-и lookup plugin-config |
    | `plugin-sdk/telegram-command-config` | Helper-и нормалізації name/description команд Telegram і перевірки duplicate/conflict, навіть коли поверхня bundled Telegram contract недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для file-reference без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helper-и exec/plugin approval, builder-и approval-capability, helper-и auth/profile, native routing/runtime |
    | `plugin-sdk/reply-runtime` | Спільні inbound/reply runtime helper-и, chunking, dispatch, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-и dispatch/finalize для reply |
    | `plugin-sdk/reply-history` | Спільні helper-и короткого вікна history для reply, такі як `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі helper-и chunking для text/markdown |
    | `plugin-sdk/session-store-runtime` | Helper-и path + updated-at для session store |
    | `plugin-sdk/state-paths` | Helper-и шляхів state/OAuth dir |
    | `plugin-sdk/routing` | Helper-и route/session-key/account binding, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні helper-и summary статусу channel/account, типові значення runtime-state і helper-и metadata проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні helper-и target resolver |
    | `plugin-sdk/string-normalization-runtime` | Helper-и slug/string normalization |
    | `plugin-sdk/request-url` | Витяг рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Runner команд із timeout і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені readers параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витяг нормалізованих payload-ів із об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витяг канонічних полів send target з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні helper-и шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Helper-и subsystem logger і redaction |
    | `plugin-sdk/markdown-table-runtime` | Helper-и режиму Markdown table |
    | `plugin-sdk/json-store` | Невеликі helper-и читання/запису JSON state |
    | `plugin-sdk/file-lock` | Re-entrant helper-и file-lock |
    | `plugin-sdk/persistent-dedupe` | Helper-и disk-backed dedupe cache |
    | `plugin-sdk/acp-runtime` | Helper-и ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Read-only розв’язання ACP binding без import-ів startup lifecycle |
    | `plugin-sdk/agent-config-primitives` | Вузькі primitives схеми конфігурації agent runtime |
    | `plugin-sdk/boolean-param` | Loose reader boolean-параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Helper-и розв’язання dangerous-name matching |
    | `plugin-sdk/device-bootstrap` | Helper-и device bootstrap і pairing token |
    | `plugin-sdk/extension-shared` | Спільні primitives helper-ів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helper-и відповідей `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Helper-и переліку команд Skill |
    | `plugin-sdk/native-command-registry` | Helper-и registry/build/serialize для native команд |
    | `plugin-sdk/agent-harness` | Експериментальна trusted-plugin-поверхня для низькорівневих harness агента: типи harness, helper-и steer/abort для active-run, helper-и bridge інструментів OpenClaw і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Helper-и виявлення endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper-и system event/heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі helper-и bounded cache |
    | `plugin-sdk/diagnostic-runtime` | Helper-и діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Helper-и graph/formatting/error classification, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper-и wrapped fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware runtime fetch без import-ів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader обмеженого response-body без широкої media runtime-поверхні |
    | `plugin-sdk/session-binding-runtime` | Поточний стан conversation binding без configured binding routing або pairing store |
    | `plugin-sdk/session-store-runtime` | Helper-и читання session-store без широких import-ів config writes/maintenance |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання context visibility і фільтрація supplemental context без широких import-ів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі helper-и coercion і normalization для primitive record/string без import-ів markdown/logging |
    | `plugin-sdk/host-runtime` | Helper-и нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Helper-и конфігурації retry і retry runner |
    | `plugin-sdk/agent-runtime` | Helper-и agent dir/identity/workspace |
    | `plugin-sdk/directory-runtime` | Query/dedup directory на основі config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath-и capabilities і testing">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні helper-и fetch/transform/store для media плюс builder-и media payload |
    | `plugin-sdk/media-generation-runtime` | Спільні helper-и failover для media-generation, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів media understanding плюс provider-facing export-и helper-ів image/audio |
    | `plugin-sdk/text-runtime` | Спільні helper-и text/markdown/logging, такі як assistant-visible-text stripping, helper-и render/chunking/table для markdown, helper-и redaction, helper-и directive-tag і safe-text utilities |
    | `plugin-sdk/text-chunking` | Helper chunking для outbound text |
    | `plugin-sdk/speech` | Типи speech provider плюс provider-facing helper-и directive, registry і validation |
    | `plugin-sdk/speech-core` | Спільні типи speech provider, registry, directive і helper-и normalization |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів realtime transcription, helper-и registry і спільний helper WebSocket session |
    | `plugin-sdk/realtime-voice` | Типи провайдерів realtime voice і helper-и registry |
    | `plugin-sdk/image-generation` | Типи провайдерів image generation |
    | `plugin-sdk/image-generation-core` | Спільні типи image-generation, helper-и failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи provider/request/result для music generation |
    | `plugin-sdk/music-generation-core` | Спільні типи music-generation, helper-и failover, lookup провайдерів і парсинг model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для video generation |
    | `plugin-sdk/video-generation-core` | Спільні типи video-generation, helper-и failover, lookup провайдерів і парсинг model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр webhook target і helper-и встановлення route |
    | `plugin-sdk/webhook-path` | Helper-и нормалізації webhook path |
    | `plugin-sdk/web-media` | Спільні helper-и завантаження віддалених/локальних media |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath-и пам’яті">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Вбудована helper-поверхня memory-core для helper-ів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime facade індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export-и foundation engine для memory host |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding для memory host, доступ до registry, локальний provider і універсальні helper-и batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export-и QMD engine для memory host |
    | `plugin-sdk/memory-core-host-engine-storage` | Export-и storage engine для memory host |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodal helper-и для memory host |
    | `plugin-sdk/memory-core-host-query` | Query helper-и для memory host |
    | `plugin-sdk/memory-core-host-secret` | Secret helper-и для memory host |
    | `plugin-sdk/memory-core-host-events` | Helper-и journal подій для memory host |
    | `plugin-sdk/memory-core-host-status` | Helper-и status для memory host |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper-и CLI runtime для memory host |
    | `plugin-sdk/memory-core-host-runtime-core` | Базові helper-и runtime для memory host |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper-и file/runtime для memory host |
    | `plugin-sdk/memory-host-core` | Vendor-neutral alias для базових helper-ів runtime memory host |
    | `plugin-sdk/memory-host-events` | Vendor-neutral alias для helper-ів journal подій memory host |
    | `plugin-sdk/memory-host-files` | Vendor-neutral alias для helper-ів file/runtime memory host |
    | `plugin-sdk/memory-host-markdown` | Спільні helper-и managed-markdown для plugin-ів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Active Memory runtime facade для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutral alias для helper-ів status memory host |
    | `plugin-sdk/memory-lancedb` | Вбудована helper-поверхня memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані bundled-helper subpath-и">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper-и підтримки bundled browser Plugin (`browser-support` залишається compatibility barrel) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Helper/runtime-поверхня bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Helper/runtime-поверхня bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Helper-поверхня bundled IRC |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Compatibility/helper seam-и bundled channel |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Helper seam-и bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API реєстрації

Callback `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | What it registers                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)              |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий executor агента |
| `api.registerCliBackend(...)`                    | Локальний inference backend CLI       |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями           |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis        |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова realtime-транскрипція        |
| `api.registerRealtimeVoiceProvider(...)`         | Двосторонні realtime-голосові сесії   |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                       |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape          |
| `api.registerWebSearchProvider(...)`             | Web search                            |

### Інструменти та команди

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)          |

### Інфраструктура

| Method                                          | What it registers                       |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Event hook                              |
| `api.registerHttpRoute(params)`                 | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                       |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                          |
| `api.registerService(service)`                  | Фоновий сервіс                          |
| `api.registerInteractiveHandler(registration)`  | Interactive handler                     |
| `api.registerEmbeddedExtensionFactory(factory)` | Extension factory для embedded-runner Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Additive prompt section, суміжна з пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`   | Additive corpus для пошуку/читання пам’яті |

<Note>
  Зарезервовані core admin namespace-и (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо Plugin намагається призначити
  для методу Gateway вужчу scope. Для методів, якими володіє Plugin, віддавайте перевагу префіксам, специфічним для Plugin.
</Note>

<Accordion title="Коли використовувати registerEmbeddedExtensionFactory">
  Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли Plugin потребує Pi-native
  часової семантики подій під час embedded-запусків OpenClaw — наприклад асинхронних переписувань `tool_result`, які мають відбутися до того, як буде надіслано фінальне повідомлення з результатом інструмента.

Наразі це seam для bundled Plugin: лише bundled Plugins можуть реєструвати його,
і вони мають оголошувати `contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Для всього, що не потребує цього нижчого рівня seam, залишайте звичайні hooks Plugin OpenClaw.
</Accordion>

### Metadata реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види top-level metadata:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: parse-time descriptor-и команд, які використовуються для root CLI help,
  routing і lazy-реєстрації CLI Plugin

Якщо ви хочете, щоб команда Plugin залишалася lazy-loaded у звичайному root CLI path,
надайте `descriptors`, які покривають кожен top-level command root, відкритий цим
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, коли вам не потрібна lazy-реєстрація в root CLI.
Цей eager-шлях сумісності все ще підтримується, але він не встановлює
placeholders на основі descriptor-ів для parse-time lazy loading.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дозволяє Plugin володіти типовою конфігурацією для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend-а стає префіксом provider у model ref на кшталт `codex-cli/gpt-5`.
- `config` backend-а використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Користувацька конфігурація все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типових значень Plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує суміснісних переписувань після merge
  (наприклад нормалізації старих форм flags).

### Exclusive slots

| Method                                     | What it registers                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (активним може бути лише один). Callback `assemble()` отримує `availableTools` і `citationsMode`, щоб engine міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфікована memory capability                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Builder prompt section для пам’яті                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush для пам’яті                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime для пам’яті                                                                                                                               |

### Adapters embedding для пам’яті

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding для пам’яті активного Plugin |

- `registerMemoryCapability` — це рекомендований exclusive API memory-plugin.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб companion Plugins могли споживати експортовані memory artifacts через
  `openclaw/plugin-sdk/memory-host-core` замість доступу до приватної розкладки конкретного
  Plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні з legacy exclusive API memory-plugin.
- `registerMemoryEmbeddingProvider` дозволяє активному Plugin пам’яті реєструвати один
  або більше id embedding-adapter-ів (наприклад `openai`, `gemini` або custom
  id, визначений Plugin).
- Користувацька конфігурація, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, розв’язується відносно цих зареєстрованих
  id adapter-ів.

### Події та життєвий цикл

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований lifecycle hook    |
| `api.onConversationBindingResolved(handler)` | Callback прив’язки conversation |

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и нижчого пріоритету пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як і пропуск `block`), а не як override.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и нижчого пріоритету пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як і пропуск `block`), а не як override.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler бере на себе dispatch, handler-и нижчого пріоритету та типовий шлях model dispatch пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и нижчого пріоритету пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як і пропуск `cancel`), а не як override.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна inbound-маршрутизація thread/topic. `metadata` залишайте для channel-specific extra-даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж використовувати fallback до channel-specific `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для startup-стану, яким володіє Gateway, замість покладання на внутрішні hooks `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID Plugin                                                                                   |
| `api.name`               | `string`                  | Display name                                                                                |
| `api.version`            | `string?`                 | Версія Plugin (необов’язково)                                                               |
| `api.description`        | `string?`                 | Опис Plugin (необов’язково)                                                                 |
| `api.source`             | `string`                  | Шлях до джерела Plugin                                                                      |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (необов’язково)                                                    |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot конфігурації (активний runtime snapshot у пам’яті, коли доступний)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація Plugin з `plugins.entries.<id>.config`                                         |
| `api.runtime`            | `PluginRuntime`           | [Helper-и runtime](/uk/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger з обмеженою областю (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/setup до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня Plugin                                                      |

## Угода щодо внутрішніх модулів

Усередині вашого Plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```text
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Ніколи не імпортуйте власний Plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Маршрутизуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Facade-loaded публічні поверхні bundled Plugin (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли) віддають перевагу
активному runtime snapshot конфігурації, коли OpenClaw уже запущено. Якщо runtime
snapshot ще не існує, вони використовують fallback до розв’язаного файла конфігурації на диску.

Plugins провайдерів можуть відкривати вузький plugin-local contract barrel, коли
helper навмисно є provider-specific і поки що не належить до універсального SDK
subpath. Приклади вбудованих:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і stream-helper-ів `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-и провайдера,
  helper-и типових моделей і builder-и realtime provider.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder провайдера
  плюс helper-и onboarding/config.

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді є спільним, підніміть його до нейтрального SDK subpath,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  capability-орієнтованої поверхні, замість того щоб жорстко зв’язувати два Plugins між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper-и runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору імен `api.runtime`.
  </Card>
  <Card title="Setup і конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня будова Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель можливостей.
  </Card>
</CardGroup>
