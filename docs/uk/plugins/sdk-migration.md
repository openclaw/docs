---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовуєте `api.registerEmbeddedExtensionFactory`
    - Ви оновлюєте Plugin до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейти із застарілого шару зворотної сумісності на сучасний SDK Plugin
title: Міграція SDK Plugin
x-i18n:
    generated_at: "2026-04-25T00:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccf6e736c2a7cb54f9249d92b27edcecfabda14c64d88a8932a69565e246c33c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із цільовими, документованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широкі поверхні, які дозволяли Plugin імпортувати
будь-що потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки
  допоміжних функцій. Його було запроваджено, щоб зберегти працездатність старіших
  плагінів на основі hook, поки будувалася нова архітектура плагінів.
- **`openclaw/extension-api`** — міст, який надавав Plugin прямий доступ до
  допоміжних функцій на боці хоста, таких як вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — hook вбудованого extension
  лише для Pi, який міг спостерігати події вбудованого runner, такі як `tool_result`.

Ці поверхні тепер **застарілі**. Вони все ще працюють під час виконання, але нові
Plugin не повинні їх використовувати, а наявні мають перейти на новий підхід до того,
як наступний мажорний випуск їх видалить.

OpenClaw не видаляє і не переосмислює документовану поведінку Plugin у тій самій
зміні, де вводиться заміна. Зміни контракту, що ламають сумісність, спочатку мають
пройти через адаптер сумісності, діагностику, документацію та період застарівання.
Це стосується імпортів SDK, полів manifest, API налаштування, hook і поведінки
реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних випусків.
  Plugin, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний SDK Plugin виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і документованим контрактом.

Застарілі зручні seams provider для вбудованих каналів також зникли. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
допоміжні channel-branded seams і
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями monorepo, а не
стабільними контрактами Plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині
робочого простору вбудованого Plugin зберігайте допоміжні функції, що належать provider, у власному
`api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади вбудованих provider:

- Anthropic зберігає допоміжні функції потокової передачі, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI зберігає builder-и provider, допоміжні функції типових моделей і builder-и provider
  реального часу у власному `api.ts`
- OpenRouter зберігає builder provider і допоміжні функції onboarding/config у власному
  `api.ts`

## Політика сумісності

Для зовнішніх Plugin робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку через адаптер сумісності
3. вивести діагностичне повідомлення або попередження, яке вказує старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати застарівання та шлях міграції
6. видаляти лише після оголошеного вікна міграції, зазвичай у мажорному випуску

Якщо поле manifest усе ще приймається, автори Plugin можуть продовжувати його використовувати,
доки документація та діагностика не скажуть інше. Новому коду слід віддавати перевагу
документованій заміні, але наявні Plugin не повинні ламатися під час звичайних мінорних
випусків.

## Як виконати міграцію

<Steps>
  <Step title="Мігруйте розширення Pi tool-result на middleware">
    Вбудовані Plugin мають замінити обробники tool-result лише для Pi через
    `api.registerEmbeddedExtensionFactory(...)` на middleware, нейтральне до runtime.

    ```typescript
    // Before: Pi-only compatibility hook
    api.registerEmbeddedExtensionFactory((pi) => {
      pi.on("tool_result", async (event) => {
        return compactToolResult(event);
      });
    });

    // After: Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть manifest Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Залишайте `contracts.embeddedExtensionFactories` лише для вбудованого коду сумісності,
    якому все ще потрібні прямі події вбудованого runner Pi. Зовнішні Plugin
    не можуть реєструвати middleware tool-result, оскільки воно може переписувати високодовірений
    вивід інструмента до того, як його побачить модель.

  </Step>

  <Step title="Мігруйте native-обробники підтвердження на capability facts">
    Channel Plugin із підтримкою підтверджень тепер надають нативну поведінку підтвердження через
    `approvalCapability.nativeRuntime` плюс спільний реєстр runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для підтверджень, зі застарілої прив’язки `plugin.auth` /
      `plugin.approvals` до `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу channel; hook авторизації підтверджень
      там більше не зчитуються core
    - Реєструйте об’єкти runtime, що належать channel, такі як клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення про перенаправлення, що належать Plugin, з native-обробників підтвердження;
      тепер core керує сповіщеннями routed-elsewhere на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові stub відхиляються.

    Поточну структуру capability підтвердження див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте поведінку резервного варіанта wrapper у Windows">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, невизначені wrapper `.cmd`/`.bat` у Windows
    тепер завершуються без резервного переходу, якщо ви явно не передасте
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

    Якщо ваш виклик не покладається навмисно на резервний перехід через shell, не задавайте
    `allowShellFallback` і натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Виконайте пошук у своєму Plugin для імпортів із будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть цільовими імпортами">
    Кожен експорт зі старої поверхні зіставляється з конкретним сучасним шляхом імпорту:

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

    Для допоміжних функцій на боці хоста використовуйте впроваджений runtime Plugin замість прямого
    імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших допоміжних функцій застарілого bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

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
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічна допоміжна функція точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий парасольковий повторний експорт для визначень/builder-ів точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжна функція точки входу для одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та builder-и точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування | Запити allowlist, builder-и стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні функції runtime під час налаштування | Безпечні для імпорту адаптери patch для налаштування, допоміжні функції для lookup note, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні функції адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні функції інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні функції для кількох облікових записів | Допоміжні функції списку облікових записів/конфігурації/action-gate |
  | `plugin-sdk/account-id` | Допоміжні функції account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису | Допоміжні функції пошуку облікового запису + резервного типового значення |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні функції для облікових записів | Допоміжні функції списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви підключення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + логіка typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder-и схем конфігурації | Типи схем конфігурації каналів |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції конфігурації команд Telegram | Нормалізація назв команд, обрізання опису, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні функції стану облікового запису та життєвого циклу чернеткового потоку | `createAccountStatusSink`, допоміжні функції фіналізації чернеткового попереднього перегляду |
  | `plugin-sdk/inbound-envelope` | Допоміжні функції вхідного envelope | Спільні допоміжні функції маршруту + builder-а envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні функції вхідних відповідей | Спільні допоміжні функції record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні функції розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні функції вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідного runtime | Допоміжні функції вихідної ідентичності/send delegate і планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції thread-binding | Допоміжні функції життєвого циклу та адаптера thread-binding |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні функції media payload | Builder media payload агента для застарілих схем полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні функції runtime | Допоміжні функції runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні функції середовища runtime | Допоміжні функції logger/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції runtime Plugin | Допоміжні функції команд/hook/http/interactive для Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні функції конвеєра hook | Спільні допоміжні функції конвеєра webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні функції процесів | Спільні допоміжні функції exec |
  | `plugin-sdk/cli-runtime` | Допоміжні функції runtime CLI | Форматування команд, очікування, допоміжні функції версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні функції Gateway | Допоміжні функції клієнта Gateway і patch стану каналів |
  | `plugin-sdk/config-runtime` | Допоміжні функції конфігурації | Допоміжні функції завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції команд Telegram | Допоміжні функції перевірки команд Telegram зі стабільним резервним варіантом, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні функції запитів на підтвердження | Payload підтвердження exec/plugin, допоміжні функції capability/profile підтвердження, нативні допоміжні функції маршрутизації/runtime підтвердження |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні функції auth для підтвердження | Визначення користувача, що підтверджує, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні функції клієнта підтвердження | Допоміжні функції profile/filter для нативного підтвердження exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні функції доставки підтверджень | Адаптери capability/delivery нативного підтвердження |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні функції Gateway для підтвердження | Спільна допоміжна функція визначення approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні функції адаптера підтвердження | Легковагові допоміжні функції завантаження адаптера нативного підтвердження для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні функції обробника підтвердження | Ширші допоміжні функції runtime обробника підтвердження; віддавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні функції цілей підтвердження | Допоміжні функції нативного зв’язування цілі/облікового запису підтвердження |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні функції відповіді на підтвердження | Допоміжні функції payload відповіді на підтвердження exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні функції channel runtime-context | Загальні допоміжні функції register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Допоміжні функції безпеки | Спільні допоміжні функції trust, обмеження DM, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні функції політики SSRF | Допоміжні функції allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні функції runtime SSRF | Допоміжні функції pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні функції обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні функції обмеження діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні функції форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні функції графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні функції wrapped fetch/proxy | `resolveFetch`, допоміжні функції proxy |
  | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні функції retry | `RetryConfig`, `retryAsync`, запускальники політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Обмеження команд і допоміжні функції поверхні команд | `resolveControlCommandGate`, допоміжні функції авторизації відправника, допоміжні функції реєстру команд |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір secret input | Допоміжні функції secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні функції запитів Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні функції guard для тіла запиту Webhook | Допоміжні функції читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідний dispatch, Heartbeat, планувальник відповіді, розбиття на частини |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch відповіді | Фіналізація, dispatch provider і допоміжні функції міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні функції історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні функції частин відповіді | Допоміжні функції розбиття тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні функції сховища сесій | Допоміжні функції шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні функції шляхів стану | Допоміжні функції каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні функції маршрутизації/ключів сесій | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні функції нормалізації ключів сесій |
  | `plugin-sdk/status-helpers` | Допоміжні функції стану каналів | Builder-и підсумків стану каналу/облікового запису, типові значення runtime-state, допоміжні функції метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні функції визначення цілі | Спільні допоміжні функції target resolver |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації рядків | Допоміжні функції нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні функції URL-адрес запитів | Витягування рядкових URL-адрес із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні функції команд із таймером | Запускальник команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Загальні читачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягування нормалізованих payload із об’єктів результату інструмента |
  | `plugin-sdk/tool-send` | Витягування send інструмента | Витягування канонічних полів цілі send з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні функції тимчасових шляхів | Спільні допоміжні функції тимчасових шляхів для завантаження |
  | `plugin-sdk/logging-core` | Допоміжні функції logging | Допоміжні функції logger підсистеми та редагування конфіденційних даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні функції таблиць Markdown | Допоміжні функції режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локального/self-hosted provider | Допоміжні функції виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні функції налаштування self-hosted provider, сумісного з OpenAI | Ті самі допоміжні функції виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні функції runtime auth для provider | Допоміжні функції визначення API-ключа під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні функції налаштування API-ключа provider | Допоміжні функції onboarding/запису profile для API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні функції auth-result для provider | Стандартний builder auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні функції інтерактивного входу provider | Спільні допоміжні функції інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні функції вибору provider | Вибір provider за конфігурацією або автоматично та злиття сирої конфігурації provider |
  | `plugin-sdk/provider-env-vars` | Допоміжні функції env var для provider | Допоміжні функції пошуку env var auth для provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні функції моделей/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и політики replay, допоміжні функції endpoint provider і нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні функції каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding для provider | Допоміжні функції конфігурації onboarding |
  | `plugin-sdk/provider-http` | Допоміжні функції HTTP для provider | Загальні допоміжні функції HTTP/можливостей endpoint для provider, включно з допоміжними функціями multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні функції web-fetch для provider | Допоміжні функції реєстрації/кешу provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні функції конфігурації web-search для provider | Вузькі допоміжні функції конфігурації/облікових даних web-search для provider, яким не потрібна прив’язка вмикання Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні функції контракту web-search для provider | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter-и облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні функції web-search для provider | Допоміжні функції реєстрації/кешу/runtime для provider web-search |
  | `plugin-sdk/provider-tools` | Допоміжні функції сумісності інструментів/схем provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні функції usage для provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні функції usage для provider |
  | `plugin-sdk/provider-stream` | Допоміжні функції обгорток потоку provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні функції обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні функції транспорту provider | Нативні допоміжні функції транспорту provider, такі як guarded fetch, перетворення транспортних повідомлень і потоки подій writable transport |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні функції медіа | Допоміжні функції отримання/перетворення/збереження медіа плюс builder-и media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції генерації медіа | Спільні допоміжні функції failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні функції розуміння медіа | Типи provider для розуміння медіа плюс експорти допоміжних функцій зображень/аудіо для provider |
  | `plugin-sdk/text-runtime` | Спільні допоміжні функції тексту | Вилучення видимого асистенту тексту, допоміжні функції рендерингу/розбиття/таблиць markdown, редагування конфіденційних даних, допоміжні функції тегів директив, утиліти безпечного тексту та пов’язані допоміжні функції тексту/logging |
  | `plugin-sdk/text-chunking` | Допоміжні функції розбиття тексту | Допоміжна функція розбиття вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні функції мовлення | Типи provider мовлення плюс допоміжні функції директив, реєстру та перевірки для provider |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи provider мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні функції транскрибування в реальному часі | Типи provider, допоміжні функції реєстру та спільна допоміжна функція сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні функції голосу в реальному часі | Типи provider, допоміжні функції реєстру/визначення та допоміжні функції bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні функції failover, auth і реєстру |
  | `plugin-sdk/music-generation` | Допоміжні функції генерації музики | Типи provider/запитів/результатів генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні функції failover, пошук provider і розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні функції генерації відео | Типи provider/запитів/результатів генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні функції failover, пошук provider і розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні функції інтерактивних відповідей | Нормалізація/зменшення payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні функції запису конфігурації каналу | Допоміжні функції авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Експорти спільного prelude channel plugin |
  | `plugin-sdk/channel-status` | Допоміжні функції стану каналу | Спільні допоміжні функції snapshot/summary стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні функції конфігурації allowlist | Допоміжні функції редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні функції доступу до груп | Спільні допоміжні функції ухвалення рішень щодо доступу до груп |
  | `plugin-sdk/direct-dm` | Допоміжні функції прямих DM | Спільні допоміжні функції auth/guard для прямих DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні функції extension | Примітиви допоміжних функцій passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні функції цілей Webhook | Реєстр цілей Webhook і допоміжні функції встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні функції шляху Webhook | Допоміжні функції нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні функції вебмедіа | Допоміжні функції завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для користувачів SDK Plugin |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні функції memory-core | Поверхня допоміжних функцій memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Рушій foundation хоста пам’яті | Експорти рушія foundation хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний provider і загальні допоміжні функції batch/remote; конкретні remote provider містяться у Plugin-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій storage хоста пам’яті | Експорти рушія storage хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні функції multimodal хоста пам’яті | Допоміжні функції multimodal хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста пам’яті | Допоміжні функції запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста пам’яті | Допоміжні функції секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста пам’яті | Допоміжні функції журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні функції стану хоста пам’яті | Допоміжні функції стану хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI хоста пам’яті | Допоміжні функції runtime CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Допоміжні функції core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста пам’яті | Допоміжні функції файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Нейтральний щодо вендора псевдонім для допоміжних функцій core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний щодо вендора псевдонім для допоміжних функцій журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний щодо вендора псевдонім для допоміжних функцій файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні функції керованого markdown | Спільні допоміжні функції керованого markdown для Plugin, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім стану хоста пам’яті | Нейтральний щодо вендора псевдонім для допоміжних функцій стану хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Вбудовані допоміжні функції memory-lancedb | Поверхня допоміжних функцій memory-lancedb |
  | `plugin-sdk/testing` | Тестові утиліти | Допоміжні функції та mock-и для тестування |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не всю поверхню
SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі допоміжні seams для вбудованих Plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони залишаються експортованими для
підтримки та сумісності вбудованих Plugin, але навмисно
опущені з таблиці поширеної міграції й не є рекомендованою ціллю для
нового коду Plugin.

Те саме правило застосовується до інших сімейств вбудованих допоміжних функцій, таких як:

- допоміжні функції підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих допоміжних функцій/Plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню допоміжних функцій токенів
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в SDK Plugin, контракті provider,
поверхні runtime і manifest. Кожне з них усе ще працює сьогодні, але буде видалене
в одному з майбутніх мажорних випусків. Запис під кожним елементом зіставляє старий API з його
канонічною заміною.

<AccordionGroup>
  <Accordion title="builder-и довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — просто імпортуються з вужчого підшляху. `command-auth`
    повторно експортує їх як compat-заглушки.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні функції обмеження згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об’єкт рішення замість двох розділених викликів.

    Downstream channel Plugin (Slack, Discord, Matrix, Microsoft Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="shim channel runtime і допоміжні функції дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    channel Plugin. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів runtime.

    Допоміжні функції `channelActions*` в `openclaw/plugin-sdk/channel-actions`
    застарівають разом із сирими експортами channel "actions". Натомість показуйте можливості
    через семантичну поверхню `presentation` — channel Plugin оголошують, що саме вони
    відображають (картки, кнопки, списки вибору), а не те, які сирі назви
    дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжна функція tool() provider web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в Plugin provider.
    OpenClaw більше не потребує допоміжної функції SDK для реєстрації обгортки інструмента.

  </Accordion>

  <Accordion title="Текстові plaintext channel envelope → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского plaintext prompt
    envelope із вхідних channel-повідомлень.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача. Channel
    Plugin додають метадані маршрутизації (гілка, тема, reply-to, реакції) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжна функція
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих
    envelope, видимих асистенту, але вхідні plaintext envelope поступово
    виводяться з ужитку.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який власний
    channel Plugin, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи discovery provider → типи каталогу provider">
    Чотири псевдоніми типів discovery тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий псевдонім           | Новий тип               |
    | -------------------------- | ----------------------- |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`  |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext`|
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult` |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog` |

    Плюс застарілий статичний набір `ProviderCapabilities` — Plugin provider
    мають прикріплювати capability facts через контракт runtime provider,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Hook політики thinking → resolveThinkingProfile">
    **Старе** (три окремі hook на `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені значення
    за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hook продовжують працювати протягом
    періоду застарівання, але не поєднуються з результатом профілю.

  </Accordion>

  <Accordion title="Резервний варіант зовнішнього OAuth provider → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення provider у manifest Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у manifest Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" виводить попередження під час виконання й буде видалений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env var для provider → setup.providers[].envVars">
    **Старе** поле manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: продублюйте той самий пошук env var у `setup.providers[].envVars`
    в manifest. Це об’єднує метадані env налаштування/стану в одному
    місці й дозволяє уникнути запуску runtime Plugin лише для відповіді на
    запити пошуку env var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до завершення періоду застарівання.

  </Accordion>

  <Accordion title="Реєстрація memory Plugin → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик до API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові допоміжні функції memory
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="Типи повідомлень сесії субагента перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                           |
    | --------------------------- | ------------------------------ |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` застарів на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав accessor живого TaskFlow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає доступ до TaskFlow на основі DTO,
    який безпечний для імпорту та не вимагає завантаження повного runtime завдань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → middleware agent tool-result">
    Розглянуто вище в розділі "Як виконати міграцію → Мігруйте розширення Pi tool-result на
    middleware". Додано тут для повноти: шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` застарів на користь
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime в
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований із `openclaw/plugin-sdk`, тепер є
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
Застарівання на рівні extension (усередині вбудованих channel/provider Plugin у
`extensions/`) відстежуються у власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugin і тут не перелічені.
Якщо ви споживаєте локальний barrel вбудованого Plugin напряму, прочитайте
коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Часова шкала видалення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять попередження під час виконання             |
| **Наступний мажорний випуск** | Застарілі поверхні буде видалено; Plugin, які все ще їх використовують, перестануть працювати |

Усі core Plugin уже мігровані. Зовнішні Plugin мають виконати міграцію
до наступного мажорного випуску.

## Тимчасове придушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створення вашого першого Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Channel Plugin](/uk/plugins/sdk-channel-plugins) — створення channel Plugin
- [Provider Plugin](/uk/plugins/sdk-provider-plugins) — створення provider Plugin
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибокий огляд архітектури
- [Manifest Plugin](/uk/plugins/manifest) — довідник зі схеми manifest
