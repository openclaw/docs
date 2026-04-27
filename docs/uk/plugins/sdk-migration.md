---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний SDK plugin
title: Міграція SDK plugin
x-i18n:
    generated_at: "2026-04-27T11:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a35b5e78262c690217d80d800d68c2a5453ac23a19124ff85a95666a689fbc0
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури plugin
із цільовими, задокументованими імпортами. Якщо ваш plugin було створено до
появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система plugin надавала дві широкі поверхні, які дозволяли plugin імпортувати
будь-що потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який реекспортував десятки
  helper. Його було запроваджено, щоб старіші plugin на основі hook продовжували працювати,
  поки будувалася нова архітектура plugin.
- **`openclaw/extension-api`** — міст, який надавав plugin прямий доступ до
  helper на боці хоста, таких як вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений hook вбудованого
  extension лише для Pi, який міг спостерігати події embedded-runner, як-от
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють у runtime,
але нові plugin не повинні їх використовувати, а наявні plugin мають мігрувати до
того, як наступний мажорний реліз їх вилучить. API реєстрації фабрики вбудованого extension
лише для Pi уже вилучено; замість нього використовуйте middleware результатів інструментів.

OpenClaw не вилучає і не переосмислює задокументовану поведінку plugin у тій самій
зміні, де з’являється заміна. Зміни контракту, що ламають сумісність, спочатку мають пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів маніфесту, API налаштування, hook і поведінки
реєстрації в runtime.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Plugin, які все ще імпортують із цих поверхонь, зламаються, коли це станеться.
  Реєстрації factory вбудованого extension лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** — імпорт одного helper завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі реекспорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний SDK plugin виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams провайдерів для вбудованих каналів також зникли.
Фірмові helper seams каналів були приватними shortcut усередині монорепозиторію, а не стабільними
контрактами plugin. Натомість використовуйте вузькі загальні subpath SDK. Усередині workspace
вбудованого plugin helper, що належать провайдеру, слід залишати у власному `api.ts` або
`runtime-api.ts` цього plugin.

Приклади поточних вбудованих провайдерів:

- Anthropic зберігає helper потоків, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI зберігає builder провайдера, helper моделей за замовчуванням і builder
  realtime-провайдера у власному `api.ts`
- OpenRouter зберігає builder провайдера та helper онбордингу/конфігурації у власному
  `api.ts`

## Політика сумісності

Для зовнішніх plugin робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключену через адаптер сумісності
3. додати діагностичне повідомлення або попередження, яке називає старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати застарівання і шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори plugin можуть і далі ним користуватися,
доки документація й діагностика не скажуть інакше. Новий код має віддавати перевагу
задокументованій заміні, але наявні plugin не повинні ламатися в межах звичайних мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Мігруйте Pi tool-result extension на middleware">
    Вбудовані plugin мають замінити обробники результатів інструментів
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi на
    middleware, нейтральне до runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть маніфест plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні plugin не можуть реєструвати middleware результатів інструментів, оскільки воно може
    переписувати високодовірений вивід інструментів до того, як його побачить модель.

  </Step>

  <Step title="Мігруйте approval-native обробники на capability facts">
    Plugin каналів із підтримкою підтверджень тепер розкривають нативну поведінку підтверджень через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть автентифікацію/доставку, специфічну для підтверджень, із застарілої прив’язки `plugin.auth` /
      `plugin.approvals` до `approvalCapability`
    - `ChannelPlugin.approvals` було вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу каналу; hook
      автентифікації підтверджень там більше не зчитуються ядром
    - Реєструйте об’єкти runtime, що належать каналу, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення reroute notice, що належать plugin, із нативних обробників підтверджень;
      ядро тепер саме відповідає за routed-elsewhere notices на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Див. `/plugins/sdk-channel-plugins`, щоб ознайомитися з поточною структурою
    approval capability.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозпізнані Windows
    wrapper `.cmd`/`.bat` тепер завершуються за принципом fail closed, якщо ви явно не передасте
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

    Якщо ваш виклик навмисно не покладається на shell fallback, не задавайте
    `allowShellFallback`, а замість цього обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у вашому plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на цільові імпорти">
    Кожен експорт зі старої поверхні відповідає конкретному сучасному шляху імпорту:

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

    Для helper на боці хоста використовуйте інжектований runtime plugin замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших helper застарілого bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Зберіть і протестуйте">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Довідник шляхів імпорту

  <Accordion title="Таблиця поширених шляхів імпорту">
  | Import path | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний helper точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-реекспорт для визначень/builder точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення й builder точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helper майстра налаштування | Prompt allowlist, builder статусу налаштування |
  | `plugin-sdk/setup-runtime` | Helper runtime для налаштування | Безпечні для імпорту адаптери patch налаштування, helper приміток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Helper адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper для кількох облікових записів | Helper списку облікових записів/конфігурації/action-gate |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Helper пошуку облікових записів | Helper пошуку облікового запису + fallback для облікового запису за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі helper облікових записів | Helper списку облікових записів/account-action |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pairing для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Прив’язка префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder схем конфігурації | Спільні примітиви схем конфігурації каналів і лише загальний builder |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації вбудованих plugin | Лише для вбудованої сумісності; нові plugin мають визначати локальні схеми plugin |
  | `plugin-sdk/telegram-command-config` | Helper конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper статусу облікового запису та життєвого циклу draft stream | `createAccountStatusSink`, helper фіналізації draft preview |
  | `plugin-sdk/inbound-envelope` | Helper вхідного envelope | Спільні helper побудови route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper вхідної відповіді | Спільні helper record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Helper розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Helper вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Helper залежностей вихідного надсилання | Полегшений lookup `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Helper вихідного runtime | Helper outbound-доставки, делегата identity/send, сесії, форматування й планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper прив’язок тредів | Helper життєвого циклу прив’язок тредів і адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі helper payload медіа | Builder payload медіа агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helper runtime | Helper runtime/логування/резервного копіювання/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі helper env runtime | Helper logger/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helper runtime plugin | Helper команд/hook/http/interactive для plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Спільні helper pipeline webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helper lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper процесів | Спільні helper exec |
  | `plugin-sdk/cli-runtime` | Helper CLI runtime | Helper форматування команд, очікування, версій |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Helper клієнта Gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Helper конфігурації | Helper завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Helper команд Telegram | Стабільні fallback-helper валідації команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helper prompt підтвердження | Payload exec/plugin approval, helper approval capability/profile, helper маршрутизації/runtime нативних підтверджень і форматування шляху структурованого відображення підтвердження |
  | `plugin-sdk/approval-auth-runtime` | Helper auth підтвердження | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Helper клієнта підтвердження | Helper профілю/фільтра нативного exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Helper доставки підтвердження | Адаптери capability/delivery нативних підтверджень |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway для підтвердження | Спільний helper визначення approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper адаптера підтвердження | Полегшені helper завантаження адаптера нативних підтверджень для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Helper обробника підтвердження | Ширші helper runtime обробника підтверджень; віддавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helper цілей підтвердження | Helper прив’язки цілей/облікових записів нативних підтверджень |
  | `plugin-sdk/approval-reply-runtime` | Helper відповіді на підтвердження | Helper payload відповіді exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context каналу | Загальні helper register/get/watch для runtime-context каналу |
  | `plugin-sdk/security-runtime` | Helper безпеки | Спільні helper trust, gating DM, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Helper політики SSRF | Helper allowlist хостів і політики приватних мереж |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/collection-runtime` | Helper обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helper графа помилок |
  | `plugin-sdk/fetch-runtime` | Helper обгорнутого fetch/proxy | `resolveFetch`, helper проксі |
  | `plugin-sdk/host-runtime` | Helper нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper gating команд і поверхні команд | `resolveControlCommandGate`, helper авторизації відправника, helper реєстру команд включно з форматуванням dynamic argument menu |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір секретного вводу | Helper секретного вводу |
  | `plugin-sdk/webhook-ingress` | Helper запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard тіла Webhook-запиту | Helper читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідний dispatch, Heartbeat, planner відповідей, розбиття на частини |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper dispatch відповіді | Helper finalize, dispatch провайдера й міток розмов |
  | `plugin-sdk/reply-history` | Helper історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань на відповідь | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper частин відповіді | Helper розбиття тексту/Markdown на частини |
  | `plugin-sdk/session-store-runtime` | Helper сховища сесій | Helper шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Helper шляхів стану | Helper каталогів стану й OAuth |
  | `plugin-sdk/routing` | Helper маршрутизації/ключів сесій | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper нормалізації ключів сесій |
  | `plugin-sdk/status-helpers` | Helper статусу каналу | Builder зведення статусу каналу/облікового запису, значення runtime-state за замовчуванням, helper метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Helper визначення цілей | Спільні helper визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Helper нормалізації рядків | Helper нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helper URL запитів | Витяг рядкових URL із request-like входів |
  | `plugin-sdk/run-command` | Helper команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витяг payload tool | Витяг нормалізованих payload з об’єктів результату інструментів |
  | `plugin-sdk/tool-send` | Витяг надсилання tool | Витяг канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Helper тимчасових шляхів | Спільні helper шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Helper логування | Helper логера підсистеми й редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Helper Markdown-таблиць | Helper режимів Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповіді повідомлення | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Добірні helper налаштування локального/self-hosted провайдера | Helper виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові helper налаштування self-hosted провайдера, сумісного з OpenAI | Ті самі helper виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime провайдера | Helper визначення API-key у runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper налаштування API-key провайдера | Helper онбордингу/запису профілю API-key |
  | `plugin-sdk/provider-auth-result` | Helper auth-result провайдера | Стандартний builder OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Helper інтерактивного входу провайдера | Спільні helper інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Helper вибору провайдера | Вибір провайдера configured-or-auto і злиття raw-конфігурацій провайдера |
  | `plugin-sdk/provider-env-vars` | Helper env-var провайдера | Helper пошуку auth env-var провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні helper моделі/replay провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder політики replay, helper endpoint провайдера та helper нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні helper каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch онбордингу провайдера | Helper конфігурації онбордингу |
  | `plugin-sdk/provider-http` | HTTP helper провайдера | Загальні helper HTTP/можливостей endpoint провайдера, включно з helper multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch провайдера | Helper реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper конфігурації web-search провайдера | Вузькі helper конфігурації/облікових даних web-search для провайдерів, яким не потрібна прив’язка enable plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper контракту web-search провайдера | Вузькі helper контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter облікових даних із областю дії |
  | `plugin-sdk/provider-web-search` | Helper web-search провайдера | Helper реєстрації/кешу/runtime провайдера web-search |
  | `plugin-sdk/provider-tools` | Helper сумісності tool/schema провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика і helper сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper usage провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helper usage провайдера |
  | `plugin-sdk/provider-stream` | Helper wrapper потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи wrapper потоків і спільні helper wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper транспорту провайдера | Helper нативного транспорту провайдера, як-от guarded fetch, перетворення transport message і потоки подій writable transport |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні helper медіа | Helper fetch/transform/store медіа плюс builder payload медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні helper генерації медіа | Спільні helper failover, вибору candidate і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Helper media-understanding | Типи провайдера media understanding плюс експорти helper зображень/аудіо для провайдера |
  | `plugin-sdk/text-runtime` | Спільні helper тексту | Видалення видимого для асистента тексту, helper рендерингу/розбиття/таблиць Markdown, helper редагування чутливих даних, helper тегів директив, безпечні текстові утиліти та пов’язані helper тексту/логування |
  | `plugin-sdk/text-chunking` | Helper розбиття тексту | Helper розбиття вихідного тексту на частини |
  | `plugin-sdk/speech` | Helper мовлення | Типи провайдера мовлення плюс helper директив, реєстру та валідації для провайдера |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдера мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Helper транскрипції в реальному часі | Типи провайдера, helper реєстру та спільний helper сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Helper голосу в реальному часі | Типи провайдера, helper реєстру/визначення та helper bridge-сесій |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, helper failover, auth і реєстру |
  | `plugin-sdk/music-generation` | Helper генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helper failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/video-generation` | Helper генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helper failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/interactive-runtime` | Helper інтерактивної відповіді | Нормалізація/згортання payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper запису конфігурації каналу | Helper авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Експорти спільного prelude channel plugin |
  | `plugin-sdk/channel-status` | Helper статусу каналу | Спільні helper snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Helper конфігурації allowlist | Helper редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Helper доступу до груп | Спільні helper прийняття рішень group-access |
  | `plugin-sdk/direct-dm` | Helper direct-DM | Спільні helper auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні helper extension | Примітиви helper passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper цілей Webhook | Реєстр цілей Webhook і helper встановлення route |
  | `plugin-sdk/webhook-path` | Helper шляхів Webhook | Helper нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні helper вебмедіа | Helper завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Реекспорт Zod | Реекспортований `zod` для споживачів SDK plugin |
  | `plugin-sdk/memory-core` | Вбудовані helper memory-core | Поверхня helper менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime memory engine | Фасад runtime індексації/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий engine хоста пам’яті | Експорти foundation engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста пам’яті | Контракти embeddings пам’яті, доступ до реєстру, локальний провайдер і загальні helper batch/remote; конкретні віддалені провайдери живуть у plugin-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста пам’яті | Експорти QMD engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста пам’яті | Експорти storage engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodal helper хоста пам’яті | Multimodal helper хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Helper query хоста пам’яті | Helper query хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Secret helper хоста пам’яті | Secret helper хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Helper журналу подій хоста пам’яті | Helper журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Helper статусу хоста пам’яті | Helper статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Helper CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Helper core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper файлів/runtime хоста пам’яті | Helper файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Нейтральний до постачальника псевдонім для helper core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний до постачальника псевдонім для helper журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний до постачальника псевдонім для helper файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Helper керованого Markdown | Спільні helper керованого Markdown для plugin, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Lazy-фасад runtime менеджера пошуку active memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний до постачальника псевдонім для helper статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Вбудовані helper memory-lancedb | Поверхня helper memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Helper тестування та mock-об’єкти |
</Accordion>

Ця таблиця навмисно містить лише поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 точок входу зберігається в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі helper seams для вбудованих plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки вбудованих plugin і сумісності, але навмисно пропущені в таблиці
поширеної міграції й не є рекомендованою ціллю для нового коду plugin.

Те саме правило застосовується до інших сімейств вбудованих helper, таких як:

- helper підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper/plugin, як-от `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню token-helper:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в межах SDK plugin, контракту провайдера,
поверхні runtime і маніфесту. Кожне з них досі працює сьогодні, але буде вилучене
в одному з майбутніх мажорних релізів. Запис під кожним пунктом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="builder довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортуються з вужчого subpath. `command-auth`
    реекспортує їх як compat stub.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper керування згадуваннями → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об’єкт рішення замість двох окремих викликів.

    Плагіни каналів нижнього рівня (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Channel runtime shim і helper дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    plugin каналів. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Helper `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами канальних "actions". Натомість
    розкривайте можливості через семантичну поверхню `presentation` — plugin
    каналів оголошують, що саме вони рендерять (cards, buttons, selects), а не
    які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="helper tool() провайдера web search → createTool() у plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в plugin провайдера.
    OpenClaw більше не потребує helper SDK для реєстрації wrapper інструмента.

  </Accordion>

  <Accordion title="Текстові plaintext channel envelope → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского plaintext prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки user-context. Плагіни
    каналів додають метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Helper
    `formatAgentEnvelope(...)` і далі підтримується для синтезованих
    envelope, видимих асистенту, але plaintext envelope для вхідних повідомлень
    поступово виводяться з використання.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    кастомний plugin каналу, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи discovery провайдера → типи catalog провайдера">
    Чотири псевдоніми типів discovery тепер є тонкими обгортками над типами
    епохи catalog:

    | Старий псевдонім          | Новий тип                |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Плюс застарілий статичний контейнер `ProviderCapabilities` — plugin
    провайдерів мають додавати capability facts через контракт runtime провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Hook політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі hook на `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені
    значення за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hook і далі працюють протягом
    вікна застарівання, але не поєднуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "auth fallback" виводить попередження в runtime і буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env-var провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: продублюйте той самий пошук env-var у `setup.providers[].envVars`
    маніфесту. Це об’єднує метадані env для setup/status в одному
    місці й дозволяє не запускати runtime plugin лише для відповіді на
    запити пошуку env-var.

    `providerAuthEnvVars` і далі підтримується через адаптер сумісності,
    доки не закриється вікно застарівання.

  </Accordion>

  <Accordion title="Реєстрація plugin пам’яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у memory-state API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові helper пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачіпаються.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав live-accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає доступ до TaskFlow на основі DTO,
    який безпечний для імпорту й не потребує завантаження повного runtime
    завдань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики embedded extension → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Мігруйте Pi tool-result extension на
    middleware". Наведено тут для повноти: вилучений шлях
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime в
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, реекспортований із `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Віддавайте перевагу канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні extension (усередині вбудованих plugin каналів/провайдерів у
`extensions/`) відстежуються у власних barrel `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх plugin і тут не перелічені.
Якщо ви напряму використовуєте локальний barrel вбудованого plugin, прочитайте
коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Графік вилучення

| Коли                   | Що відбувається                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять попередження в runtime                      |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; plugin, які все ще їх використовують, перестануть працювати |

Усі core plugin уже мігровано. Зовнішні plugin мають виконати міграцію
до наступного мажорного релізу.

## Тимчасове придушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту subpath
- [Plugins каналів](/uk/plugins/sdk-channel-plugins) — створення plugin каналів
- [Plugins провайдерів](/uk/plugins/sdk-provider-plugins) — створення plugin провайдерів
- [Внутрішня будова plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест plugin](/uk/plugins/manifest) — довідник схеми маніфесту
