---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть з застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-28T01:06:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0620977a2ded8518b00fa7b14c8860ff351530926af76c02d08c699028f0fbc3
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із цільовими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві дуже широкі поверхні, які дозволяли плагінам імпортувати все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб старі плагіни на основі хуків продовжували працювати, поки створювалася нова архітектура плагінів.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel runtime-допоміжних засобів, який змішував системні події, стан Heartbeat, черги доставки, допоміжні засоби fetch/proxy, файлові допоміжні засоби, типи погодження та не пов’язані між собою утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації, який під час вікна міграції все ще містить застарілі прямі допоміжні засоби load/write.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до допоміжних засобів на боці хоста, таких як вбудований засіб запуску агентів.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений хук bundled extension лише для Pi, який міг спостерігати за подіями embedded runner, такими як `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання, але нові плагіни не повинні їх використовувати, а наявні плагіни слід мігрувати до наступного мажорного релізу, у якому їх буде вилучено. API реєстрації фабрики embedded extension лише для Pi було вилучено; замість нього використовуйте middleware результатів інструментів.

OpenClaw не вилучає й не переосмислює задокументовану поведінку плагінів у тій самій зміні, де з’являється заміна. Зміни контрактів, які порушують сумісність, спершу мають проходити через адаптер сумісності, діагностику, документацію та вікно застарівання. Це стосується імпортів SDK, полів маніфесту, API setup, хуків і поведінки реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Плагіни, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрики embedded extension лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) — це невеликий самодостатній модуль із чітким призначенням і задокументованим контрактом.

Застарілі зручні шви provider для bundled channels також прибрано.
Шви допоміжних засобів, прив’язані до бренду каналу, були приватними скороченнями mono-repo, а не стабільними контрактами плагінів. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині робочого простору bundled plugin залишайте допоміжні засоби, що належать provider, у власному `api.ts` або `runtime-api.ts` цього плагіна.

Поточні приклади bundled provider:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власному шві `api.ts` / `contract-api.ts`
- OpenAI зберігає builder-и provider, допоміжні засоби моделей за замовчуванням і builder-и realtime provider у власному `api.ts`
- OpenRouter зберігає builder provider і допоміжні засоби onboarding/config у власному `api.ts`

## Політика сумісності

Для зовнішніх плагінів робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. залишити стару поведінку, підключену через адаптер сумісності
3. виводити діагностику або попередження, яке називає старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати застарівання та шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори плагінів можуть продовжувати його використовувати, доки документація й діагностика не скажуть інакше. Новий код має надавати перевагу задокументованій заміні, але наявні плагіни не повинні ламатися під час звичайних мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Міграція runtime-допоміжних засобів load/write конфігурації">
    Bundled plugins повинні припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації,
    яку вже було передано в активний шлях виклику. Довгоживучі обробники, яким
    потрібен поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі інструменти агента мають використовувати `ctx.getRuntimeConfig()` із контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе одно бачив
    оновлену runtime-конфігурацію.

    Запис конфігурації має проходити через транзакційні допоміжні засоби та
    вибирати політику після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли
    викликач знає, що зміна потребує чистого перезапуску Gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач
    володіє подальшими діями й навмисно хоче придушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    Gateway, як і раніше, відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими допоміжними
    засобами сумісності для зовнішніх плагінів протягом вікна міграції та
    один раз попереджають із кодом сумісності `runtime-config-load-write`. Bundled plugins і код runtime репозиторію
    захищені scanner-обмеженнями в
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання production plugin
    одразу завершується помилкою, прямий запис конфігурації завершується помилкою,
    методи сервера Gateway повинні використовувати знімок runtime із запиту,
    допоміжні засоби send/action/client runtime channel повинні отримувати конфігурацію зі своєї межі,
    а довгоживучі runtime-модулі повинні мати
    нуль дозволених ambient-викликів `loadConfig()`.

    Новий код плагінів також повинен уникати імпорту широкого
    barrel сумісності `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, який відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації точки входу плагіна | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime-знімка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Запис конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиць Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Допоміжні засоби runtime-політики груп | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделей/сесій | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins і їхні тести захищені scanner-перевірками від широкого
    barrel, щоб імпорти й моки залишалися локальними для потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен від нього залежати.

  </Step>

  <Step title="Міграція розширень результатів інструментів Pi на middleware">
    Bundled plugins повинні замінити обробники результатів інструментів Pi-only
    `api.registerEmbeddedExtensionFactory(...)` на
    runtime-neutral middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть маніфест плагіна:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні плагіни не можуть реєструвати middleware результатів інструментів, оскільки воно може
    переписувати високодовірений вивід інструментів до того, як модель його побачить.

  </Step>

  <Step title="Міграція approval-native обробників на факти можливостей">
    Плагіни каналів із підтримкою approval тепер надають native-поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-контексту.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі старої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` було вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу каналу; approval
      hooks там більше не зчитуються ядром
    - Реєструйте runtime-об’єкти, що належать каналу, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення reroute, що належать плагіну, з native approval handlers;
      ядро тепер саме відповідає за сповіщення routed-elsewhere на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` до `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Актуальне компонування approval capability див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірка fallback-поведінки Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`,
    нерозв’язані Windows-обгортки `.cmd`/`.bat` тепер завершуються без fallback, якщо ви явно не передасте
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

    Якщо ваш викликач не покладається навмисно на shell fallback, не встановлюйте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у вашому плагіні імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
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

    Для допоміжних засобів на боці хоста використовуйте інжектований runtime плагіна замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших застарілих допоміжних засобів bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні засоби сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` усе ще існує для зовнішньої
    сумісності, але новий код має імпортувати цільову поверхню допоміжних засобів,
    яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги відкладеної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні засоби шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби proxy і guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання approval | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні засоби payload відповіді approval і команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена паралельність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числова коерція | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування в межах процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Bundled plugins захищені scanner-перевірками від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel.

  </Step>

  <Step title="Міграція допоміжних засобів маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старіші назви route-key і comparable-target залишаються як псевдоніми сумісності
    протягом вікна міграції, але нові плагіни мають використовувати назви маршрутів,
    які безпосередньо описують поведінку:

    | Старий допоміжний засіб | Сучасний допоміжний засіб |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні засоби маршрутів послідовно нормалізують `{ channel, to, accountId, threadId }`
    для native approvals, придушення відповідей, дедуплікації вхідних повідомлень,
    доставки Cron і маршрутизації сесій. Якщо ваш plugin підтримує власну граматику цілей,
    використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    парсер до того самого контракту цілей маршруту.

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
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу плагіна | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-повторний експорт для визначень/builder-ів точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення й builder-и точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра setup | Запити allowlist, builder-и статусу setup |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час setup | Безпечні для імпорту адаптери patch setup, допоміжні засоби приміток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані proxy setup |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментарію setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікових записів + fallback до значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій з обліковими записами |
  | `plugin-sdk/channel-setup` | Адаптери майстра setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Підключення префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder-и схем конфігурації | Спільні примітиви схем конфігурації каналів і лише узагальнений builder |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі bundled-схеми конфігурації | Лише bundled-сумісність; нові плагіни повинні визначати локальні для плагіна схеми |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби статусу облікового запису та життєвого циклу потоку чернеток | `createAccountStatusSink`, допоміжні засоби завершення попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби inbound envelope | Спільні допоміжні засоби маршрутів + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби inbound reply | Спільні допоміжні засоби запису й диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби outbound media | Спільне завантаження outbound media |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей outbound send | Полегшений пошук `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound runtime | Допоміжні засоби outbound delivery, identity/send delegate, сесій, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби thread-binding | Допоміжні засоби життєвого циклу thread-binding і адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Builder media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналів |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище плагіна | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/встановлення плагіна |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env | Logger/runtime env, допоміжні засоби timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime плагіна | Допоміжні засоби команд/хуків/http/interactive плагіна |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hook | Спільні допоміжні засоби конвеєра webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Допоміжні засоби клієнта Gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Стабільні fallback-допоміжні засоби перевірки команд Telegram, коли bundled-контрактна поверхня Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби prompt approval | Payload підтвердження exec/plugin, допоміжні засоби capability/profile approval, native approval routing/runtime і форматування шляху відображення структурованого approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth approval | Розв’язання approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approval | Допоміжні засоби profile/filter native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки approval | Адаптери native approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway approval | Спільний допоміжний засіб розв’язання approval Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера approval | Полегшені допоміжні засоби завантаження адаптера native approval для hot-точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника approval | Ширші допоміжні засоби runtime обробника approval; надавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей approval | Допоміжні засоби прив’язки native approval target/account |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді approval | Допоміжні засоби payload відповіді на approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context каналу | Узагальнені допоміжні засоби register/get/watch для runtime-context каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, DM gating, external-content і збирання secret |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Допоміжні засоби pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Безпечні допоміжні засоби шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування командами й допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір secret input | Допоміжні засоби secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби захисту тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Inbound dispatch, Heartbeat, planner відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби finalize, dispatch provider і міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань на відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk відповідей | Допоміжні засоби chunking тексту/Markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху до сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів state і OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключів сесій | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключів сесій |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Builder-и підсумків статусу каналу/облікового запису, значення runtime-state за замовчуванням, допоміжні засоби метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розв’язання цілей | Спільні допоміжні засоби розв’язання цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Поширені читачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload tool | Витягування нормалізованих payload з об’єктів результатів tool |
  | `plugin-sdk/tool-send` | Витягування send tool | Витягування канонічних полів цілей надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби логування | Допоміжні засоби logger підсистем і редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби таблиць Markdown | Допоміжні засоби режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload відповідей |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби setup локальних/self-hosted provider | Допоміжні засоби виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби setup self-hosted provider, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth provider під час runtime | Допоміжні засоби розв’язання API-ключів під час runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби setup API-ключів provider | Допоміжні засоби onboarding/запису профілю API-ключів |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result provider | Стандартний builder auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу provider | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору provider | Вибір provider із конфігурації або автоматично та злиття сирої конфігурації provider |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var provider | Допоміжні засоби пошуку auth env-var provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и replay-policy, допоміжні засоби endpoint provider і допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch-и onboarding provider | Допоміжні засоби конфігурації onboarding |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP provider | Узагальнені допоміжні засоби HTTP/capability endpoint provider, включно з допоміжними засобами multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch provider | Допоміжні засоби реєстрації/кешу web-fetch provider |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search provider | Вузькі допоміжні засоби конфігурації/облікових даних web-search для provider, яким не потрібне підключення enable plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search provider | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter-и облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search provider | Допоміжні засоби реєстрації/кешу/runtime web-search provider |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності tool/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби usage provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби usage provider |
  | `plugin-sdk/provider-stream` | Допоміжні засоби wrapper stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи wrapper-ів stream і спільні допоміжні засоби wrapper-ів Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту provider | Допоміжні засоби нативного транспорту provider, такі як guarded fetch, трансформації transport message і потоки подій writable transport |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби fetch/transform/store media плюс builder-и payload media |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації media | Спільні допоміжні засоби failover, вибору candidate і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи provider media understanding плюс експорти допоміжних засобів зображень/аудіо для provider |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого для асистента тексту, допоміжні засоби render/chunking/table Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив, утиліти безпечного тексту та пов’язані допоміжні засоби тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжний засіб chunking outbound text |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи provider мовлення плюс експорти допоміжних засобів директив, реєстру та валідації для provider |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи provider мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрибування в реальному часі | Типи provider, допоміжні засоби реєстру та спільний допоміжний засіб сесій WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи provider, допоміжні засоби реєстру/розв’язання та допоміжні засоби bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні засоби failover, auth і реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи provider/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошуку provider і розбору model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи provider/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошуку provider і розбору model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби interactive reply | Нормалізація/скорочення payload interactive reply |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Експорти спільного prelude channel plugin |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу груп | Спільні допоміжні засоби рішень group-access |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви passive-channel/status і ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляху Webhook | Допоміжні засоби нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Допоміжні засоби bundled memory-core | Поверхня допоміжних засобів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime memory engine | Фасад runtime індексу/пошуку memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine хоста memory | Експорти foundation engine хоста memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста memory | Контракти embedding memory, доступ до реєстру, локальний provider і узагальнені batch/remote helper-и; конкретні remote provider живуть у своїх плагінах-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста memory | Експорти QMD engine хоста memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста memory | Експорти storage engine хоста memory |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста memory | Допоміжні засоби multimodal хоста memory |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби query хоста memory | Допоміжні засоби query хоста memory |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста memory | Допоміжні засоби secret хоста memory |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста memory | Допоміжні засоби журналу подій хоста memory |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста memory | Допоміжні засоби статусу хоста memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста memory | Допоміжні засоби CLI runtime хоста memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста memory | Допоміжні засоби core runtime хоста memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime хоста memory | Допоміжні засоби file/runtime хоста memory |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста memory | Нейтральний щодо вендора псевдонім для допоміжних засобів core runtime хоста memory |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста memory | Нейтральний щодо вендора псевдонім для допоміжних засобів журналу подій хоста memory |
  | `plugin-sdk/memory-host-files` | Псевдонім file/runtime хоста memory | Нейтральний щодо вендора псевдонім для допоміжних засобів file/runtime хоста memory |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого Markdown | Спільні допоміжні засоби керованого Markdown для плагінів, суміжних із memory |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста memory | Нейтральний щодо вендора псевдонім для допоміжних засобів статусу хоста memory |
  | `plugin-sdk/memory-lancedb` | Допоміжні засоби bundled memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Застарілий широкий barrel сумісності; надавайте перевагу цільовим тестовим підшляхам, таким як `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі шви допоміжних засобів bundled plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки bundled plugin і сумісності, але навмисно
не включені до поширеної таблиці міграції та не є рекомендованою ціллю для
нового коду плагінів.

Те саме правило застосовується й до інших сімейств bundled-helper, таких як:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- bundled helper/plugin поверхні, як-от `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` зараз надає вузьку поверхню допоміжних засобів токенів:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в межах Plugin SDK, контракту provider,
поверхні runtime і маніфесту. Кожне з них усе ще працює сьогодні, але буде вилучене
в одному з майбутніх мажорних релізів. Запис під кожним пунктом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="builder-и довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого підшляху. `command-auth`
    повторно експортує їх як сумісні stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби gating згадувань → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох розділених викликів.

    Downstream channel plugins (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim channel runtime і допоміжні засоби channel actions">
    `openclaw/plugin-sdk/channel-runtime` — це сумісний shim для старіших
    channel plugins. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime-об’єктів.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами каналів "actions". Натомість надавайте можливості
    через семантичну поверхню `presentation` — channel plugins
    оголошують, що саме вони відображають (cards, buttons, selects), а не які сирі
    назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний засіб tool() provider web search → createTool() у плагіні">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider plugin.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації wrapper-а tool.

  </Accordion>

  <Accordion title="Простотекстові channel envelope → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского prompt
    envelope простим текстом із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Channel plugins прикріплюють метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжний засіб
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих
    envelope, видимих асистенту, але вхідні простотекстові envelope вже
    поступово виводяться з ужитку.

    Зони впливу: `inbound_claim`, `message_received` і будь-який користувацький
    channel plugin, який післяобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення provider → типи каталогу provider">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над
    типами епохи catalog:

    | Старий псевдонім            | Новий тип                 |
    | --------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`    | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`  | `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult`   | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery`   | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` — provider plugins
    мають прикріплювати факти можливостей через контракт runtime provider,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Хуки політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені значення за
    рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати протягом
    вікна застарівання, але не поєднуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth provider → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення provider у маніфесті плагіна.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті плагіна
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "auth fallback" виводить попередження під час runtime і буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env-var provider → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    у маніфесті. Це об’єднує метадані env setup/status в одному
    місці й дозволяє уникнути запуску runtime плагіна лише для відповіді на
    запити щодо env-var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація memory plugin → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові допоміжні засоби memory
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачіпаються.

  </Accordion>

  <Accordion title="Перейменовано типи повідомлень сесії subagent">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                        | Нове                           |
    | ---------------------------- | ------------------------------ |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав живий accessor task-flow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає доступ до TaskFlow на основі DTO,
    який є безпечним для імпорту й не потребує завантаження повного runtime завдань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики embedded extension → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Міграція розширень результатів інструментів Pi на
    middleware". Додано тут для повноти: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований із `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Надавайте перевагу канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні extension (усередині bundled channel/provider plugins у
`extensions/`) відстежуються у власних barrel-файлах `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх плагінів і тут не перелічені.
Якщо ви безпосередньо споживаєте локальний barrel bundled plugin, перед
оновленням прочитайте коментарі про застарівання в цьому barrel.
</Note>

## Хронологія вилучення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять попередження під час runtime               |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; плагіни, які все ще їх використовують, завершаться з помилкою |

Усі core plugins уже мігровано. Зовнішнім плагінам слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язані матеріали

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Плагіни provider](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня будова плагінів](/uk/plugins/architecture) — детальний розбір архітектури
- [Маніфест Plugin](/uk/plugins/manifest) — довідник зі схеми маніфесту
