---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте плагін до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній плагін OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності до сучасного SDK плагінів
title: Міграція SDK плагінів
x-i18n:
    generated_at: "2026-04-07T20:09:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 155a8b14bc345319c8516ebdb8a0ccdea2c5f7fa07dad343442996daee21ecad
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція SDK плагінів

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної
архітектури плагінів зі сфокусованими, задокументованими імпортами. Якщо ваш
плагін був створений до появи нової архітектури, цей посібник допоможе вам
виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широко відкриті поверхні, які дозволяли
плагінам імпортувати все, що їм потрібно, з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував
  десятки допоміжних функцій. Його було введено, щоб старіші плагіни на базі
  хуків продовжували працювати, поки створювалася нова архітектура плагінів.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до
  допоміжних функцій на боці хоста, таких як вбудований запускник агента.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час виконання,
але нові плагіни не повинні їх використовувати, а наявні плагіни мають
мігрувати до того, як наступний мажорний реліз їх видалить.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних
  релізів. Плагіни, які все ще імпортують із цих поверхонь, перестануть
  працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки
  не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти полегшували створення
  циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є
  стабільними, а які внутрішніми

Сучасний SDK плагінів це виправляє: кожен шлях імпорту
(`openclaw/plugin-sdk/\<subpath\>`) — це невеликий, самодостатній модуль із
чітким призначенням і задокументованим контрактом.

Застарілі зручні шви провайдерів для вбудованих каналів також прибрано.
Імпорти на кшталт `openclaw/plugin-sdk/slack`,
`openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`,
`openclaw/plugin-sdk/whatsapp`, брендовані для каналів допоміжні шви та
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями для
монорепозиторію, а не стабільними контрактами плагінів. Натомість
використовуйте вузькі узагальнені підшляхи SDK. Усередині робочого простору
вбудованих плагінів зберігайте допоміжні функції, що належать провайдеру, у
власному `api.ts` або `runtime-api.ts` цього плагіна.

Поточні приклади вбудованих провайдерів:

- Anthropic зберігає специфічні для Claude допоміжні функції потоків у
  власному шві `api.ts` / `contract-api.ts`
- OpenAI зберігає конструктори провайдерів, допоміжні функції моделей за
  замовчуванням і конструктори realtime-провайдерів у власному `api.ts`
- OpenRouter зберігає конструктор провайдера та допоміжні функції
  онбордингу/конфігурації у власному `api.ts`

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть approval-native обробники на capability facts">
    Плагіни каналів із підтримкою погодження тепер надають нативну поведінку
    погодження через `approvalCapability.nativeRuntime` разом зі спільним
    реєстром runtime-контексту.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть автентифікацію/доставку, специфічну для погоджень, зі
      застарілої зв’язки `plugin.auth` / `plugin.approvals` на
      `approvalCapability`
    - `ChannelPlugin.approvals` було видалено з публічного контракту
      channel-plugin; перенесіть поля delivery/native/render до
      `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу каналів; хуки
      автентифікації погоджень там більше не читаються ядром
    - Реєструйте об’єкти runtime, що належать каналу, як-от клієнти, токени
      або застосунки Bolt, через
      `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення reroute, що належать плагіну, з native
      approval-обробників; тепер ядро саме відповідає за повідомлення
      routed-elsewhere на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)`
      надавайте реальну поверхню `createPluginRuntime().channel`. Часткові
      заглушки відхиляються.

    Актуальну структуру approval capability див. у
    `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш плагін використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані
    Windows-обгортки `.cmd`/`.bat` тепер завершуються в закритому режимі, якщо
    ви явно не передасте `allowShellFallback: true`.

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

    Якщо ваш код навмисно не покладається на резервний варіант через оболонку,
    не встановлюйте `allowShellFallback` і натомість обробляйте згенеровану
    помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму плагіні імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх сфокусованими імпортами">
    Кожен експорт зі старої поверхні відповідає певному сучасному шляху
    імпорту:

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

    Для допоміжних функцій на боці хоста використовуйте інжектований runtime
    плагіна замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується і до інших застарілих допоміжних функцій
    bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні функції сховища сесій | `api.runtime.agent.session.*` |

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
  | Шлях імпорту | Призначення | Основні експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічна допоміжна функція точки входу плагіна | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий зонтичний повторний експорт для визначень/конструкторів входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжна функція точки входу одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та конструктори входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування | Запити allowlist, конструктори статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні функції runtime для етапу налаштування | Безпечні для імпорту адаптери patch для налаштування, допоміжні функції note для lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні функції адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні функції інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні функції для кількох облікових записів | Допоміжні функції списку облікових записів/конфігурації/action-gate |
  | `plugin-sdk/account-id` | Допоміжні функції account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису | Допоміжні функції пошуку облікового запису + резервний вибір за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні функції для облікових записів | Допоміжні функції списку облікових записів/account-action |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + зв’язування typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Типи схем конфігурації каналу |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублювання/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики для груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Відстеження статусу облікового запису | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Допоміжні функції inbound envelope | Спільні допоміжні функції route + конструкторів envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні функції inbound reply | Спільні допоміжні функції record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні функції розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні функції outbound media | Спільне завантаження outbound media |
  | `plugin-sdk/outbound-runtime` | Допоміжні функції outbound runtime | Допоміжні функції outbound identity/send delegate |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції thread-binding | Життєвий цикл thread-binding і допоміжні функції адаптера |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні функції media payload | Конструктор agent media payload для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище плагіна | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні функції runtime | Допоміжні функції runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні функції середовища runtime | Logger/runtime env, допоміжні функції timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції runtime плагіна | Допоміжні функції commands/hooks/http/interactive для плагіна |
  | `plugin-sdk/hook-runtime` | Допоміжні функції конвеєра hook | Спільні допоміжні функції конвеєра webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні функції процесів | Спільні допоміжні функції exec |
  | `plugin-sdk/cli-runtime` | Допоміжні функції CLI runtime | Форматування команд, очікування, допоміжні функції версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні функції gateway | Допоміжні функції клієнта gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Допоміжні функції конфігурації | Допоміжні функції завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції команд Telegram | Допоміжні функції перевірки команд Telegram зі стабільним резервним варіантом, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні функції prompt для погоджень | Payload погодження exec/plugin, допоміжні функції approval capability/profile, допоміжні функції маршрутизації/runtime native approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні функції auth для погоджень | Визначення approver, auth для дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні функції клієнта погоджень | Допоміжні функції profile/filter для native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні функції доставки погоджень | Адаптери native approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні функції gateway для погоджень | Спільна допоміжна функція gateway-resolution для погоджень |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні функції адаптера погоджень | Полегшені допоміжні функції завантаження native approval adapter для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні функції approval handler | Ширші допоміжні функції runtime для approval handler; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні функції target для погоджень | Допоміжні функції зв’язування native approval target/account |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні функції reply для погоджень | Допоміжні функції payload відповіді для exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Допоміжні функції runtime-context каналу | Узагальнені допоміжні функції register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Допоміжні функції безпеки | Спільні допоміжні функції довіри, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні функції політики SSRF | Допоміжні функції allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні функції SSRF runtime | Pinned-dispatcher, guarded fetch, допоміжні функції політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні функції обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичного gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні функції форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні функції графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch/proxy | `resolveFetch`, допоміжні функції proxy |
  | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні функції retry | `RetryConfig`, `retryAsync`, runners політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating команд і допоміжні функції поверхні команд | `resolveControlCommandGate`, допоміжні функції авторизації відправника, допоміжні функції реєстру команд |
  | `plugin-sdk/secret-input` | Розбір секретних входів | Допоміжні функції secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні функції запитів webhook | Утиліти target для webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні функції guard для тіла webhook | Допоміжні функції читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Inbound dispatch, heartbeat, planner відповіді, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch відповіді | Допоміжні функції finalize + dispatch до провайдера |
  | `plugin-sdk/reply-history` | Допоміжні функції історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні функції chunk відповіді | Допоміжні функції chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні функції сховища сесій | Шлях сховища + допоміжні функції updated-at |
  | `plugin-sdk/state-paths` | Допоміжні функції шляхів стану | Допоміжні функції каталогів state та OAuth |
  | `plugin-sdk/routing` | Допоміжні функції routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні функції нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні функції статусу каналу | Конструктори зведень статусу каналу/облікового запису, значення runtime-state за замовчуванням, допоміжні функції метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні функції target resolver | Спільні допоміжні функції target resolver |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації рядків | Допоміжні функції нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні функції URL запиту | Витягування рядкових URL із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні функції команд із таймером | Runner команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Поширені читачі параметрів tool/CLI |
  | `plugin-sdk/tool-send` | Витягування надсилання tool | Витягування канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні функції тимчасових шляхів | Спільні допоміжні функції шляхів для тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні функції логування | Допоміжні функції логера підсистеми та редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні функції Markdown-таблиць | Допоміжні функції режимів Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локальних/self-hosted провайдерів | Допоміжні функції виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдерів, сумісних з OpenAI | Ті самі допоміжні функції виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні функції runtime auth провайдера | Допоміжні функції визначення API-ключа в runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні функції налаштування API-ключа провайдера | Допоміжні функції онбордингу/profile-write для API-ключів |
  | `plugin-sdk/provider-auth-result` | Допоміжні функції auth-result провайдера | Стандартний конструктор OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Допоміжні функції інтерактивного входу провайдера | Спільні допоміжні функції інтерактивного входу |
  | `plugin-sdk/provider-env-vars` | Допоміжні функції env vars провайдера | Допоміжні функції пошуку auth env-var провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні функції моделей/replay провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні функції endpoint провайдера та нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні функції каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches онбордингу провайдера | Допоміжні функції конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні функції HTTP провайдера | Узагальнені допоміжні функції HTTP/можливостей endpoint для провайдера |
  | `plugin-sdk/provider-web-fetch` | Допоміжні функції web-fetch провайдера | Допоміжні функції реєстрації/кешу web-fetch провайдера |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні функції контракту web-search провайдера | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped credential setters/getters |
  | `plugin-sdk/provider-web-search` | Допоміжні функції web-search провайдера | Допоміжні функції реєстрації/кешу/runtime для web-search провайдера |
  | `plugin-sdk/provider-tools` | Допоміжні функції сумісності tool/schema провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні функції використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні функції використання провайдерів |
  | `plugin-sdk/provider-stream` | Допоміжні функції обгортки потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні функції обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні функції media | Допоміжні функції fetch/transform/store для media, а також конструктори media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції media-generation | Спільні допоміжні функції failover, вибір кандидатів і повідомлення про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні функції media-understanding | Типи провайдерів media-understanding, а також орієнтовані на провайдера допоміжні функції для зображень/аудіо |
  | `plugin-sdk/text-runtime` | Спільні допоміжні функції тексту | Видалення видимого для асистента тексту, render/chunking/table для markdown, допоміжні функції редагування чутливих даних, directive-tag, безпечний текст та пов’язані допоміжні функції тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні функції chunking тексту | Допоміжна функція chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні функції speech | Типи провайдерів speech, а також орієнтовані на провайдера допоміжні функції directive, registry і validation |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи провайдерів speech, registry, directives, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні функції realtime transcription | Типи провайдерів і допоміжні функції registry |
  | `plugin-sdk/realtime-voice` | Допоміжні функції realtime voice | Типи провайдерів і допоміжні функції registry |
  | `plugin-sdk/image-generation-core` | Спільне ядро image-generation | Типи image-generation, failover, auth і допоміжні функції registry |
  | `plugin-sdk/music-generation` | Допоміжні функції music-generation | Типи провайдера/запиту/результату для генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро music-generation | Типи music-generation, допоміжні функції failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні функції video-generation | Типи провайдера/запиту/результату для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро video-generation | Типи video-generation, допоміжні функції failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні функції інтерактивної відповіді | Нормалізація/скорочення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Допоміжні функції запису конфігурації каналу | Допоміжні функції авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Експорти спільної преамбули channel plugin |
  | `plugin-sdk/channel-status` | Допоміжні функції статусу каналу | Спільні допоміжні функції snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні функції конфігурації allowlist | Допоміжні функції редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні функції доступу до груп | Спільні допоміжні функції ухвалення рішень group-access |
  | `plugin-sdk/direct-dm` | Допоміжні функції direct-DM | Спільні допоміжні функції auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні функції extension | Примітиви пасивного каналу/статусу та ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні функції target для webhook | Допоміжні функції реєстру webhook target і встановлення route |
  | `plugin-sdk/webhook-path` | Допоміжні функції шляхів webhook | Допоміжні функції нормалізації шляхів webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні функції web media | Допоміжні функції завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів SDK плагінів |
  | `plugin-sdk/memory-core` | Допоміжні функції вбудованого memory-core | Поверхня допоміжних функцій memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад memory engine | Runtime-фасад індексації/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine хоста пам’яті | Експорти foundation engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста пам’яті | Експорти embedding engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста пам’яті | Експорти QMD engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста пам’яті | Експорти storage engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні функції хоста пам’яті | Мультимодальні допоміжні функції хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні функції query хоста пам’яті | Допоміжні функції query хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні функції secret хоста пам’яті | Допоміжні функції secret хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста пам’яті | Допоміжні функції журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста пам’яті | Допоміжні функції статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні функції CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Допоміжні функції core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста пам’яті | Допоміжні функції файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних функцій core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних функцій журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних функцій файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні функції керованого markdown | Спільні допоміжні функції керованого markdown для суміжних із пам’яттю плагінів |
  | `plugin-sdk/memory-host-search` | Фасад пошуку активної пам’яті | Лінивий runtime-фасад search-manager активної пам’яті |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних функцій статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Допоміжні функції вбудованого memory-lancedb | Поверхня допоміжних функцій memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні функції та mock-об’єкти для тестування |
</Accordion>

Ця таблиця навмисно охоплює лише поширену підмножину для міграції, а не
повну поверхню SDK. Повний список із понад 200 точок входу знаходиться в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі шви допоміжних функцій вбудованих плагінів,
такі як `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й далі експортуються для
підтримки та сумісності вбудованих плагінів, але навмисно не включені до
таблиці поширеної міграції й не є рекомендованою ціллю для нового коду
плагінів.

Те саме правило застосовується до інших сімейств допоміжних функцій для
вбудованих компонентів, таких як:

- допоміжні функції підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper/plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню допоміжних
функцій токенів `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете
знайти потрібний експорт, перевірте вихідний код у `src/plugin-sdk/` або
запитайте в Discord.

## Графік видалення

| Коли | Що відбувається |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз** | Застарілі поверхні виводять попередження під час виконання |
| **Наступний мажорний реліз** | Застарілі поверхні буде видалено; плагіни, які все ще їх використовують, перестануть працювати |

Усі core-плагіни вже мігровано. Зовнішнім плагінам слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший плагін
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів за subpath
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
- [Внутрішня будова плагінів](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест плагіна](/uk/plugins/manifest) — довідник зі схеми маніфесту
