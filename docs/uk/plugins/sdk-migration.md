---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте Plugin до сучасної архітектури Plugin-ів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-23T21:03:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a0c836c42498d74d4ae11f2614d00b05cb9867761b8725c49c99b7dbfcc8ec9
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin-ів
із фокусованими, задокументованими import-ами. Якщо ваш Plugin було створено до
появи нової архітектури, цей посібник допоможе виконати міграцію.

## Що змінюється

Стара система Plugin-ів надавала дві широко відкриті поверхні, які дозволяли Plugin-ам імпортувати
все, що їм було потрібно, з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один import, що реекспортував десятки
  helper-ів. Його було введено, щоб старіші Plugin-и на основі hook-ів продовжували працювати, поки
  будувалася нова архітектура Plugin-ів.
- **`openclaw/extension-api`** — міст, який давав Plugin-ам прямий доступ до
  helper-ів на стороні host, таких як embedded agent runner.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час runtime, але нові
Plugin-и не повинні їх використовувати, а наявні Plugin-и слід мігрувати до того, як наступний
major release їх видалить.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх major release.
  Plugin-и, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** — import одного helper-а завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі реекспорти полегшували створення циклів import-ів
- **Неясна поверхня API** — не було способу зрозуміти, які exports є стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях import (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Legacy seam-и зручності provider-ів для bundled channel-ів також зникли. Import-и
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
брендовані для channel helper seam-и та
`openclaw/plugin-sdk/telegram-core` були приватними shortcut-ами mono-repo, а не
стабільними контрактами Plugin-ів. Натомість використовуйте вузькі загальні subpath-и SDK. Усередині
workspace bundled Plugin-ів тримайте helper-и, якими володіє provider, у власному
`api.ts` або `runtime-api.ts` цього Plugin-а.

Поточні bundled-приклади provider-ів:

- Anthropic тримає helper-и stream, специфічні для Claude, у власному seam
  `api.ts` / `contract-api.ts`
- OpenAI тримає builder-и provider-а, helper-и типових моделей і builder-и
  realtime provider-ів у власному `api.ts`
- OpenRouter тримає builder provider-а та helper-и onboarding/config у власному
  `api.ts`

## Як мігрувати

<Steps>
  <Step title="Перенесіть approval-native handler-и на capability facts">
    Plugin-и channel-ів, що підтримують approvals, тепер надають native approval behavior через
    `approvalCapability.nativeRuntime` плюс спільний registry runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approvals, зі застарілого зв’язування `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` було видалено з публічного контракту
      channel-plugin; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout channel-ів; approval auth
      hook-и там більше не зчитуються core
    - Реєструйте об’єкти runtime, що належать channel-у, такі як clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте Plugin-власні reroute notices із native approval handler-ів;
      core тепер сам відповідає за notices routed-elsewhere на основі фактичних результатів delivery
    - Коли передаєте `channelRuntime` у `createChannelManager(...)`, надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Поточний layout capability approvals див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    wrapper-и `.cmd`/`.bat` тепер завершуються fail-closed, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Якщо ваш викликач навмисно не покладається на shell fallback, не задавайте
    `allowShellFallback`, а натомість обробляйте кинутий виняток.

  </Step>

  <Step title="Знайдіть застарілі import-и">
    Пошукайте у своєму Plugin-і import-и з будь-якої з застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх на фокусовані import-и">
    Кожен export зі старої поверхні відповідає конкретному сучасному шляху import:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для helper-ів на стороні host використовуйте injected runtime Plugin-а замість
    прямого import:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших legacy bridge helper-ів:

    | Старий import | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper-и session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Зберіть і протестуйте">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Довідник шляхів import

  <Accordion title="Таблиця поширених шляхів import">
  | Шлях import | Призначення | Ключові exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний helper entry Plugin-а | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella re-export для визначень/builders entry channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої schema config | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entry для одного provider-а | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та builders entry channel | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helper-и wizard setup | Prompt-и allowlist і builders статусу setup |
  | `plugin-sdk/setup-runtime` | Helper-и runtime під час setup | Безпечні для import адаптери patch setup, helper-и notes lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані proxy setup |
  | `plugin-sdk/setup-adapter-runtime` | Helper-и адаптера setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper-и інструментів setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper-и багатообліковості | Helper-и списку/config/action-gate облікових записів |
  | `plugin-sdk/account-id` | Helper-и account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Helper-и lookup облікових записів | Helper-и lookup облікового запису + default-fallback |
  | `plugin-sdk/account-helpers` | Вузькі helper-и облікових записів | Helper-и list/account-action облікових записів |
  | `plugin-sdk/channel-setup` | Адаптери wizard setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring префікса reply + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders schema config | Типи schema config channel |
  | `plugin-sdk/telegram-command-config` | Helper-и config команд Telegram | Нормалізація назв команд, trimming описів, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання policy груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper-и статусу облікового запису та життєвого циклу потоку draft | `createAccountStatusSink`, helper-и фіналізації preview draft |
  | `plugin-sdk/inbound-envelope` | Helper-и inbound envelope | Спільні helper-и builder route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper-и inbound reply | Спільні helper-и record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір messaging targets | Helper-и розбору/зіставлення target |
  | `plugin-sdk/outbound-media` | Helper-и outbound media | Спільне завантаження outbound media |
  | `plugin-sdk/outbound-runtime` | Helper-и runtime outbound | Helper-и identity/send delegate outbound і планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper-и thread-binding | Helper-и життєвого циклу thread-binding і адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі helper-и payload media | Builder payload media агента для застарілих layout полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише legacy-утиліти runtime channel |
  | `plugin-sdk/channel-send-result` | Типи результату send | Типи результату reply |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin-а | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helper-и runtime | Helper-и runtime/logging/backup/install Plugin-ів |
  | `plugin-sdk/runtime-env` | Вузькі helper-и env runtime | Helper-и logger/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helper-и runtime Plugin-а | Helper-и commands/hooks/http/interactive Plugin-а |
  | `plugin-sdk/hook-runtime` | Helper-и pipeline hook | Спільні helper-и pipeline webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helper-и lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper-и process | Спільні helper-и exec |
  | `plugin-sdk/cli-runtime` | Helper-и runtime CLI | Helper-и форматування команд, waits, версій |
  | `plugin-sdk/gateway-runtime` | Helper-и Gateway | Helper-и client Gateway і patch статусу channel |
  | `plugin-sdk/config-runtime` | Helper-и config | Helper-и load/write config |
  | `plugin-sdk/telegram-command-config` | Helper-и команд Telegram | Helper-и валідації команд Telegram зі стабільним fallback, коли surface контракту bundled Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helper-и prompt approval | Payload exec/plugin approval, helper-и capability/profile approval, native helper-и routing/runtime approval |
  | `plugin-sdk/approval-auth-runtime` | Helper-и auth approval | Розв’язання approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Helper-и client approval | Helper-и native exec approval profile/filter |
  | `plugin-sdk/approval-delivery-runtime` | Helper-и delivery approval | Адаптери native capability/delivery approval |
  | `plugin-sdk/approval-gateway-runtime` | Helper-и Gateway approval | Спільний helper розв’язання gateway approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper-и адаптера approval | Легковагові helper-и завантаження адаптера native approval для hot entrypoint-ів channel |
  | `plugin-sdk/approval-handler-runtime` | Helper-и handler approval | Ширші helper-и runtime handler approval; віддавайте перевагу вужчим seam-ам adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helper-и target approval | Helper-и native target/account binding approval |
  | `plugin-sdk/approval-reply-runtime` | Helper-и reply approval | Helper-и payload reply exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Helper-и channel runtime-context | Загальні helper-и register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Helper-и безпеки | Спільні helper-и trust, DM gating, external-content і collection секретів |
  | `plugin-sdk/ssrf-policy` | Helper-и policy SSRF | Helper-и allowlist host і policy приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Helper-и runtime SSRF | Helper-и pinned-dispatcher, guarded fetch, policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper-и bounded cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper-и gating діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper-и форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helper-и graph помилок |
  | `plugin-sdk/fetch-runtime` | Helper-и wrapped fetch/proxy | `resolveFetch`, helper-и proxy |
  | `plugin-sdk/host-runtime` | Helper-и нормалізації host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper-и retry | `RetryConfig`, `retryAsync`, runners policy |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Мапінг вводу allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating команд і helper-и поверхні команд | `resolveControlCommandGate`, helper-и авторизації відправника, helper-и registry команд |
  | `plugin-sdk/command-status` | Renderers status/help команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір вводу secret | Helper-и вводу secret |
  | `plugin-sdk/webhook-ingress` | Helper-и запитів webhook | Утиліти target webhook |
  | `plugin-sdk/webhook-request-guards` | Helper-и guard тіла webhook | Helper-и читання/ліміту тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime reply | Inbound dispatch, heartbeat, planner reply, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-и dispatch reply | Helper-и finalize + dispatch provider-а |
  | `plugin-sdk/reply-history` | Helper-и history reply | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань reply | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper-и chunk reply | Helper-и chunking text/markdown |
  | `plugin-sdk/session-store-runtime` | Helper-и сховища сесій | Helper-и шляху store + updated-at |
  | `plugin-sdk/state-paths` | Helper-и шляхів state | Helper-и каталогів state і OAuth |
  | `plugin-sdk/routing` | Helper-и routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper-и нормалізації session-key |
  | `plugin-sdk/status-helpers` | Helper-и статусу channel | Builders summary статусу channel/account, типові значення runtime-state, helper-и metadata issues |
  | `plugin-sdk/target-resolver-runtime` | Helper-и resolver target | Спільні helper-и resolver target |
  | `plugin-sdk/string-normalization-runtime` | Helper-и нормалізації рядків | Helper-и нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helper-и URL запиту | Витяг string URL із request-подібних входів |
  | `plugin-sdk/run-command` | Helper-и timed command | Runner timed command з нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Поширені читачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витяг payload tool | Витяг нормалізованих payload із об’єктів результату tool |
  | `plugin-sdk/tool-send` | Витяг send tool | Витяг канонічних полів цілі send з args tool |
  | `plugin-sdk/temp-path` | Helper-и temp path | Спільні helper-и шляхів temp-download |
  | `plugin-sdk/logging-core` | Helper-и логування | Helper-и logger підсистеми та редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Helper-и markdown-table | Helper-и режиму markdown table |
  | `plugin-sdk/reply-payload` | Типи reply message | Типи payload reply |
  | `plugin-sdk/provider-setup` | Кураторські helper-и setup локальних/self-hosted provider-ів | Helper-и discovery/config self-hosted provider-ів |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані helper-и setup self-hosted provider-ів, сумісних з OpenAI | Ті самі helper-и discovery/config self-hosted provider-ів |
  | `plugin-sdk/provider-auth-runtime` | Helper-и runtime auth provider-а | Helper-и runtime розв’язання API key |
  | `plugin-sdk/provider-auth-api-key` | Helper-и setup API key provider-а | Helper-и onboarding/profile-write для API key |
  | `plugin-sdk/provider-auth-result` | Helper-и result auth provider-а | Стандартний builder result auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper-и інтерактивного login provider-а | Спільні helper-и інтерактивного login |
  | `plugin-sdk/provider-env-vars` | Helper-и env var provider-а | Helper-и lookup env var auth provider-а |
  | `plugin-sdk/provider-model-shared` | Спільні helper-и моделі/replay provider-а | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders policy replay, helper-и endpoint provider-а та helper-и нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні helper-и каталогу provider-а | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Патчі onboarding provider-а | Helper-и config для onboarding |
| `plugin-sdk/provider-http` | HTTP helper-и provider-а | Загальні helper-и HTTP/можливостей endpoint provider-а, зокрема helper-и multipart form для audio transcription |
| `plugin-sdk/provider-web-fetch` | Helper-и web-fetch provider-а | Helper-и реєстрації/кешу provider-а web-fetch |
| `plugin-sdk/provider-web-search-config-contract` | Helper-и config web-search provider-а | Вузькі helper-и config/облікових даних web-search для provider-ів, яким не потрібне зв’язування plugin-enable |
| `plugin-sdk/provider-web-search-contract` | Helper-и контракту web-search provider-а | Вузькі helper-и контракту config/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter-и облікових даних |
| `plugin-sdk/provider-web-search` | Helper-и web-search provider-а | Helper-и реєстрації/кешу/runtime provider-а web-search |
| `plugin-sdk/provider-tools` | Helper-и сумісності tool/schema provider-а | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення schema Gemini + diagnostics, а також helper-и сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helper-и usage provider-а | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helper-и usage provider-а |
| `plugin-sdk/provider-stream` | Helper-и wrapper-ів stream provider-а | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи wrapper-ів stream і спільні helper-и wrapper-ів Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helper-и transport provider-а | Helper-и нативного transport provider-а, такі як guarded fetch, перетворення transport message і writable transport event streams |
| `plugin-sdk/keyed-async-queue` | Впорядкована async queue | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Спільні helper-и media | Helper-и fetch/transform/store для media плюс builder-и payload media |
| `plugin-sdk/media-generation-runtime` | Спільні helper-и генерації media | Спільні helper-и failover, вибір кандидатів і повідомлення про відсутню модель для генерації image/video/music |
| `plugin-sdk/media-understanding` | Helper-и media-understanding | Типи provider-а media understanding плюс exports helper-ів image/audio для provider-а |
| `plugin-sdk/text-runtime` | Спільні helper-и text | Видалення тексту, видимого assistant-у, helper-и render/chunking/table для markdown, helper-и редагування чутливих даних, helper-и tag-ів директив, утиліти safe-text та пов’язані helper-и text/logging |
| `plugin-sdk/text-chunking` | Helper-и chunking text | Helper outbound text chunking |
| `plugin-sdk/speech` | Helper-и speech | Типи provider-а speech плюс helper-и directive, registry і validation для provider-а |
| `plugin-sdk/speech-core` | Спільне ядро speech | Типи provider-а speech, registry, directives, normalization |
| `plugin-sdk/realtime-transcription` | Helper-и realtime transcription | Типи provider-а, helper-и registry і спільний helper WebSocket session |
| `plugin-sdk/realtime-voice` | Helper-и realtime voice | Типи provider-а і helper-и registry |
| `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, auth і helper-и registry |
| `plugin-sdk/music-generation` | Helper-и генерації музики | Типи provider/request/result для генерації музики |
| `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helper-и failover, lookup provider-а та розбір model-ref |
| `plugin-sdk/video-generation` | Helper-и генерації відео | Типи provider/request/result для генерації відео |
| `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helper-и failover, lookup provider-а та розбір model-ref |
| `plugin-sdk/interactive-runtime` | Helper-и інтерактивної reply | Нормалізація/зведення payload інтерактивної reply |
| `plugin-sdk/channel-config-primitives` | Примітиви config channel | Вузькі примітиви schema config channel |
| `plugin-sdk/channel-config-writes` | Helper-и запису config channel | Helper-и авторизації запису config channel |
| `plugin-sdk/channel-plugin-common` | Спільний prelude channel | Спільні exports prelude Plugin-а channel |
| `plugin-sdk/channel-status` | Helper-и статусу channel | Спільні helper-и snapshot/summary статусу channel |
| `plugin-sdk/allowlist-config-edit` | Helper-и config allowlist | Helper-и редагування/читання config allowlist |
| `plugin-sdk/group-access` | Helper-и доступу до груп | Спільні helper-и рішень щодо group-access |
| `plugin-sdk/direct-dm` | Helper-и direct-DM | Спільні helper-и auth/guard direct-DM |
| `plugin-sdk/extension-shared` | Спільні helper-и extension | Примітиви helper-ів passive-channel/status і ambient proxy |
| `plugin-sdk/webhook-targets` | Helper-и target webhook | Registry target webhook і helper-и встановлення route |
| `plugin-sdk/webhook-path` | Helper-и шляху webhook | Helper-и нормалізації шляху webhook |
| `plugin-sdk/web-media` | Спільні helper-и web media | Helper-и завантаження віддалених/локальних media |
| `plugin-sdk/zod` | Реекспорт Zod | Реекспортований `zod` для споживачів Plugin SDK |
| `plugin-sdk/memory-core` | Helper-и bundled memory-core | Поверхня helper-ів manager/config/file/CLI для memory |
| `plugin-sdk/memory-core-engine-runtime` | Runtime facade engine memory | Runtime facade index/search memory |
| `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine host memory | Exports foundation engine host memory |
| `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine host memory | Контракти embedding memory, доступ до registry, локальний provider і загальні helper-и batch/remote; конкретні remote provider-и знаходяться у Plugin-ах, яким вони належать |
| `plugin-sdk/memory-core-host-engine-qmd` | QMD engine host memory | Exports QMD engine host memory |
| `plugin-sdk/memory-core-host-engine-storage` | Storage engine host memory | Exports storage engine host memory |
| `plugin-sdk/memory-core-host-multimodal` | Multimodal helper-и host memory | Multimodal helper-и host memory |
| `plugin-sdk/memory-core-host-query` | Query helper-и host memory | Query helper-и host memory |
| `plugin-sdk/memory-core-host-secret` | Secret helper-и host memory | Secret helper-и host memory |
| `plugin-sdk/memory-core-host-events` | Helper-и journal подій host memory | Helper-и journal подій host memory |
| `plugin-sdk/memory-core-host-status` | Helper-и статусу host memory | Helper-и статусу host memory |
| `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime host memory | Helper-и CLI runtime host memory |
| `plugin-sdk/memory-core-host-runtime-core` | Core runtime host memory | Helper-и core runtime host memory |
| `plugin-sdk/memory-core-host-runtime-files` | File/runtime helper-и host memory | File/runtime helper-и host memory |
| `plugin-sdk/memory-host-core` | Alias core runtime host memory | Нейтральний до vendor-а alias для helper-ів core runtime host memory |
| `plugin-sdk/memory-host-events` | Alias journal подій host memory | Нейтральний до vendor-а alias для helper-ів journal подій host memory |
| `plugin-sdk/memory-host-files` | Alias file/runtime host memory | Нейтральний до vendor-а alias для helper-ів file/runtime host memory |
| `plugin-sdk/memory-host-markdown` | Helper-и керованого markdown | Спільні helper-и керованого markdown для Plugin-ів, суміжних із memory |
| `plugin-sdk/memory-host-search` | Facade пошуку Active Memory | Lazy facade runtime search-manager для Active Memory |
| `plugin-sdk/memory-host-status` | Alias статусу host memory | Нейтральний до vendor-а alias для helper-ів статусу host memory |
| `plugin-sdk/memory-lancedb` | Helper-и bundled memory-lancedb | Поверхня helper-ів memory-lancedb |
| `plugin-sdk/testing` | Утиліти тестування | Helper-и та mocks для тестування |
</Accordion>

Ця таблиця навмисно охоплює лише поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 entrypoint-ів знаходиться в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі seam-и helper-ів bundled Plugin-ів, наприклад
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки bundled Plugin-ів і сумісності, але навмисно
не включені до таблиці поширеної міграції та не є рекомендованою ціллю для
нового коду Plugin-ів.

Те саме правило стосується й інших сімейств bundled helper-ів, таких як:

- helper-и підтримки browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- bundled helper/plugin поверхні на кшталт `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню helper-ів token:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий import, який відповідає завданню. Якщо ви не можете знайти export,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Часова шкала видалення

| Коли                   | Що відбувається                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| **Зараз**              | Застарілі поверхні генерують попередження під час runtime                |
| **Наступний major release** | Застарілі поверхні буде видалено; Plugin-и, які все ще їх використовують, завершуватимуться помилкою |

Усі core Plugin-и вже мігровано. Зовнішнім Plugin-ам слід виконати міграцію
до наступного major release.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний обхід, а не постійне рішення.

## Пов’язане

- [Getting Started](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [SDK Overview](/uk/plugins/sdk-overview) — повний довідник import-ів за subpath
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення Plugin-ів channel
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення Plugin-ів provider
- [Plugin Internals](/uk/plugins/architecture) — поглиблений розбір архітектури
- [Plugin Manifest](/uk/plugins/manifest) — довідник schema manifest
