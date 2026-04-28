---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція на Plugin SDK
x-i18n:
    generated_at: "2026-04-28T01:47:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d7a656413c7829ba65c81c5d1a96ebea9835ec205b4a08ec0ea6d53ce15141c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із цільовими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві надто широкі поверхні, які дозволяли Plugin імпортувати все необхідне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб старіші hook-орієнтовані Plugin продовжували працювати, поки створювалася нова архітектура плагінів.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel-файл допоміжних засобів runtime, який змішував системні події, стан Heartbeat, черги доставки, допоміжні засоби fetch/proxy, файлові допоміжні засоби, типи approvals та не пов’язані між собою утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel-файл сумісності для конфігурації, який у період міграції все ще містить застарілі прямі допоміжні засоби load/write.
- **`openclaw/extension-api`** — міст, який надавав Plugin прямий доступ до допоміжних засобів на боці хоста, наприклад до вбудованого runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений hook для вбудованих розширень лише для Pi, який міг спостерігати за подіями embedded runner, такими як `tool_result`.

Ці широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють у runtime, але нові Plugin не повинні їх використовувати, а наявні Plugin слід перенести до того, як у наступному мажорному релізі їх буде видалено. API реєстрації фабрики вбудованих розширень лише для Pi вже видалено; натомість використовуйте middleware для результатів інструментів.

OpenClaw не видаляє і не переосмислює задокументовану поведінку Plugin у тій самій зміні, у якій запроваджується заміна. Зміни контрактів із порушенням сумісності спочатку мають пройти через адаптер сумісності, діагностику, документацію та період застарівання. Це стосується імпортів SDK, полів маніфесту, API налаштування, hook-ів і поведінки реєстрації runtime.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Plugin, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрик вбудованих розширень лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти полегшували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) — це невеликий, самодостатній модуль із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams постачальників для вбудованих каналів також зникли.
Допоміжні seams, прив’язані до бренду каналу, були приватними скороченнями монорепозиторію, а не стабільними контрактами Plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині робочого простору вбудованого Plugin зберігайте допоміжні засоби, що належать постачальнику, у власному `api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади вбудованих постачальників:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власному seam `api.ts` / `contract-api.ts`
- OpenAI зберігає конструктори постачальників, допоміжні засоби моделей за замовчуванням і конструктори realtime-постачальників у власному `api.ts`
- OpenRouter зберігає конструктор постачальника та допоміжні засоби онбордингу/конфігурації у власному `api.ts`

## Політика сумісності

Для зовнішніх Plugin робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключивши її через адаптер сумісності
3. вивести діагностичне повідомлення або попередження, яке вказує старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати застарівання та шлях міграції
6. видаляти лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори Plugin можуть і далі його використовувати, доки документація й діагностика не скажуть інакше. Новий код має віддавати перевагу задокументованій заміні, але наявні Plugin не повинні ламатися під час звичайних мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Мігруйте допоміжні засоби load/write конфігурації runtime">
    Вбудовані Plugin повинні припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку
    вже передано в активний шлях виклику. Довгоживучі обробники, яким потрібен
    поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агента повинні використовувати `ctx.getRuntimeConfig()` із контексту інструмента в
    `execute`, щоб інструмент, створений до запису конфігурації, усе одно бачив
    оновлену конфігурацію runtime.

    Запис конфігурації має проходити через транзакційні допоміжні засоби з вибором
    політики після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли код, що викликає,
    знає, що зміна потребує чистого перезапуску Gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли код, що викликає, сам керує
    подальшими діями та свідомо хоче придушити планувальник перезавантаження.
    Результати мутації містять типізоване резюме `followUp` для тестів і логування;
    Gateway і далі відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються як застарілі
    допоміжні засоби сумісності для зовнішніх Plugin упродовж вікна міграції та один раз
    попереджають із кодом сумісності `runtime-config-load-write`. Вбудовані Plugin і код runtime
    репозиторію захищені guardrails сканера в
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання Plugin у production
    завершується помилкою одразу, прямі записи конфігурації завершуються помилкою, методи сервера Gateway повинні використовувати
    snapshot runtime запиту, допоміжні засоби send/action/client каналу runtime
    повинні отримувати конфігурацію зі своєї межі, а довгоживучі модулі runtime мають
    нульову дозволену кількість ambient-викликів `loadConfig()`.

    Новий код Plugin також не повинен імпортувати широкий
    barrel-файл сумісності `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, що відповідає конкретному завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації запису Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного snapshot runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Запис конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація Markdown-таблиць | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Допоміжні засоби runtime для політик груп | `openclaw/plugin-sdk/runtime-group-policy` |
    | Визначення секретного вводу | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сесії | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані Plugin та їхні тести захищені сканером від широкого
    barrel-файлу, тому імпорти й mocks залишаються локальними до потрібної їм поведінки. Широкий
    barrel-файл усе ще існує для зовнішньої сумісності, але новий код не повинен
    від нього залежати.

  </Step>

  <Step title="Мігруйте розширення Pi для результатів інструментів на middleware">
    Вбудовані Plugin повинні замінити обробники
    `api.registerEmbeddedExtensionFactory(...)` для результатів інструментів лише для Pi на
    runtime-нейтральне middleware.

    ```typescript
    // Динамічні інструменти runtime Pi і Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть маніфест Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні Plugin не можуть реєструвати middleware для результатів інструментів, оскільки воно може
    переписувати високодовірений вивід інструмента до того, як модель його побачить.

  </Step>

  <Step title="Мігруйте обробники з native approvals на capability facts">
    Plugin каналів із підтримкою approvals тепер надають native-поведінку approvals через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром контексту runtime.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approvals, зі старого підключення `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного
      контракту Plugin каналу; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу з каналу; approvals auth
      hook-и там більше не зчитуються ядром
    - Реєструйте об’єкти runtime, що належать каналу, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення про reroute, що належать Plugin, із native-обробників approvals;
      тепер ядро відповідає за сповіщення routed-elsewhere на основі фактичних результатів доставки
    - Коли передаєте `channelRuntime` у `createChannelManager(...)`, надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Поточну структуру capability approvals дивіться в `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте поведінку fallback для Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, невизначені Windows
    wrapper-и `.cmd`/`.bat` тепер закриваються без fallback, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // До
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Після
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Встановлюйте це лише для довірених сумісних викликів, які навмисно
      // допускають fallback через shell.
      allowShellFallback: true,
    });
    ```

    Якщо ваш код, що викликає, не покладається навмисно на fallback через shell, не встановлюйте
    `allowShellFallback` і натомість обробіть згенеровану помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму Plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх цільовими імпортами">
    Кожен експорт зі старої поверхні відповідає певному сучасному шляху імпорту:

    ```typescript
    // До (застарілий шар зворотної сумісності)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Після (сучасні цільові імпорти)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для допоміжних засобів на боці хоста використовуйте впроваджений runtime Plugin замість прямого імпорту:

    ```typescript
    // До (застарілий міст extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Після (впроваджений runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших застарілих допоміжних засобів мосту:

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
    сумісності, але новий код повинен імпортувати ту цільову поверхню допоміжних засобів,
    яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги відкладеної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні засоби шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби proxy і захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політик SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запитів і розв’язання approvals | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні засоби payload відповіді approvals і команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування в межах процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Вбудовані Plugin захищені сканером від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel-файлу.

  </Step>

  <Step title="Мігруйте допоміжні засоби маршрутів каналів">
    Новий код маршрутів каналів повинен використовувати `openclaw/plugin-sdk/channel-route`.
    Старіші назви route-key і comparable-target залишаються як псевдоніми
    сумісності протягом вікна міграції, але нові Plugin повинні використовувати назви
    маршрутів, які безпосередньо описують поведінку:

    | Старий допоміжний засіб | Сучасний допоміжний засіб |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні засоби маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для native approvals, придушення відповідей, дедуплікації вхідних повідомлень,
    доставки Cron і маршрутизації сесій. Якщо ваш Plugin має власну граматику
    цільових адрес, використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    parser до того самого контракту цільового маршруту.

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
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб для входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-реекспорт для визначень/конструкторів входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб входу для одного постачальника | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та конструктори входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Prompts allowlist, конструктори статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime на етапі налаштування | Безпечні для імпорту адаптери patch налаштування, допоміжні засоби нотаток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для багатьох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/action-gate |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікових записів + fallback до значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій облікових записів |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Логіка префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Спільні примітиви схем конфігурації каналів і лише загальний конструктор |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише для вбудованих Plugin, які підтримує OpenClaw; нові Plugin повинні визначати локальні для Plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; для підтримуваних вбудованих Plugin використовуйте `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація імен команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби статусу облікового запису та життєвого циклу draft stream | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду draft |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби inbound envelope | Спільні допоміжні засоби побудови route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби inbound reply | Спільні допоміжні засоби record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби outbound media | Спільне завантаження outbound media |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей outbound send | Полегшений пошук `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound runtime | Допоміжні засоби outbound delivery, делегата identity/send, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби thread-binding | Допоміжні засоби життєвого циклу та адаптера thread-binding |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Конструктор media payload агента для застарілих схем полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів send | Типи результатів reply |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/logging/backup/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env | Logger/runtime env, timeout, retry і допоміжні засоби backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/hook-ів/http/interactive для Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби pipeline hook-ів | Спільні допоміжні засоби pipeline webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Допоміжні засоби клієнта Gateway та patch-ів статусу каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби перевірки команд Telegram зі стабільним fallback, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби prompts approvals | Payload approval для exec/Plugin, допоміжні засоби capability/profile approvals, native routing/runtime approvals і форматування структурованого шляху відображення approvals |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth approvals | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approvals | Допоміжні засоби profile/filter native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки approvals | Адаптери capability/delivery native approvals |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway approvals | Спільний допоміжний засіб визначення approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера approvals | Полегшені допоміжні засоби завантаження адаптера native approvals для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника approvals | Ширші допоміжні засоби runtime для обробника approvals; надавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей approvals | Допоміжні засоби прив’язки native-цілей/облікових записів approvals |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби reply approvals | Допоміжні засоби payload reply approvals для exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби channel runtime-context | Загальні допоміжні засоби register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політик SSRF | Допоміжні засоби allowlist хостів і політик приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Pinned-dispatcher, guarded fetch, допоміжні засоби політик SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій Heartbeat і видимості |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Безпечні допоміжні засоби шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вводу allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування командами та допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір secret input | Допоміжні засоби secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guards тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Inbound dispatch, Heartbeat, планувальник reply, розбиття на частини |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch reply | Фіналізація, dispatch постачальника та допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань reply | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби частин reply | Допоміжні засоби розбиття тексту/markdown на частини |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів state і OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Конструктори зведення статусу каналу/облікового запису, значення за замовчуванням для runtime-state, допоміжні засоби метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілі | Спільні допоміжні засоби target resolver |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL з request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби timed command | Виконавець timed command із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Загальні читачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload tool | Витягування нормалізованих payload із об’єктів результатів tool |
  | `plugin-sdk/tool-send` | Витягування send tool | Витягування канонічних полів цілі send з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів до тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби Logging | Допоміжні засоби логера підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби Markdown-таблиць | Допоміжні засоби режимів Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload reply |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted постачальників | Допоміжні засоби виявлення/конфігурації self-hosted постачальників |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted постачальників, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted постачальників |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth постачальника в runtime | Допоміжні засоби визначення API-key у runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-key постачальника | Допоміжні засоби онбордингу/запису профілю API-key |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result постачальника | Стандартний конструктор OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу постачальника | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору постачальника | Вибір постачальника configured-or-auto та об’єднання сирих конфігурацій постачальників |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var постачальника | Допоміжні засоби пошуку auth env-var постачальника |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделі/replay постачальника | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик replay, допоміжні засоби endpoint постачальника та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу постачальників | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу постачальника | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP постачальника | Загальні допоміжні засоби HTTP/можливостей endpoint постачальника, зокрема допоміжні засоби multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch постачальника | Допоміжні засоби реєстрації/кешування постачальників web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search постачальника | Вузькі допоміжні засоби конфігурації/облікових даних web-search для постачальників, яким не потрібне підключення enable Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search постачальника | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search постачальника | Допоміжні засоби реєстрації/кешування/runtime постачальника web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби compat для tool/schema постачальника | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби compat xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби usage постачальника | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби usage постачальника |
  | `plugin-sdk/provider-stream` | Допоміжні засоби wrapper-ів stream постачальника | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи wrapper-ів stream і спільні допоміжні засоби wrapper-ів Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби transport постачальника | Допоміжні засоби native transport постачальника, як-от guarded fetch, трансформації повідомлень transport і writable event streams transport |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби fetch/transform/store media, а також конструктори payload media |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації media | Спільні допоміжні засоби failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи постачальника media understanding, а також експорти допоміжних засобів зображень/аудіо для постачальників |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text | Видалення тексту, видимого асистенту, допоміжні засоби рендерингу/розбиття/таблиць markdown, допоміжні засоби редагування, допоміжні засоби directive-tag, утиліти safe-text та пов’язані допоміжні засоби text/logging |
  | `plugin-sdk/text-chunking` | Допоміжні засоби розбиття text | Допоміжний засіб розбиття outbound text |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи постачальника speech, а також допоміжні засоби directives, registry, validation для постачальників і конструктор TTS, сумісний з OpenAI |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи постачальника speech, registry, directives, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрибування в realtime | Типи постачальника, допоміжні засоби registry і спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в realtime | Типи постачальника, допоміжні засоби registry/визначення та допоміжні засоби bridge session |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи постачальника генерації зображень, а також допоміжні засоби image asset/data URL |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні засоби failover, auth і registry |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи постачальника/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук постачальника та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи постачальника/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук постачальника та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних reply | Нормалізація/скорочення payload інтерактивних reply |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналів | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналів | Допоміжні засоби авторизації запису конфігурації каналів |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Експорти спільного prelude Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби рішень щодо group-access |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви пасивного каналу/статусу та ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення route |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів Webhook | Допоміжні засоби нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Реекспорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера memory/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime facade рушія memory | Runtime facade індексування/пошуку memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій memory host | Експорти базового рушія memory host |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embeddings для memory host | Контракти embeddings для memory, доступ до registry, локальний постачальник і загальні batch/remote helper-и; конкретні remote-постачальники живуть у власних Plugin |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD для memory host | Експорти рушія QMD для memory host |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища memory host | Експорти рушія сховища memory host |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal для memory host | Допоміжні засоби multimodal для memory host |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби query для memory host | Допоміжні засоби query для memory host |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret для memory host | Допоміжні засоби secret для memory host |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій memory host | Допоміжні засоби журналу подій memory host |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу memory host | Допоміжні засоби статусу memory host |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime memory host | Допоміжні засоби CLI runtime memory host |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime memory host | Допоміжні засоби core runtime memory host |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime memory host | Допоміжні засоби файлів/runtime memory host |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime memory host | Нейтральний до вендора псевдонім для допоміжних засобів core runtime memory host |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій memory host | Нейтральний до вендора псевдонім для допоміжних засобів журналу подій memory host |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime memory host | Нейтральний до вендора псевдонім для допоміжних засобів файлів/runtime memory host |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для Plugin, суміжних із memory |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий runtime facade менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу memory host | Нейтральний до вендора псевдонім для допоміжних засобів статусу memory host |
  | `plugin-sdk/memory-lancedb` | Вбудовані допоміжні засоби memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Застарілий широкий barrel сумісності; надавайте перевагу цільовим підшляхам тестування, таким як `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 точок входу наведено в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі допоміжні seams для вбудованих Plugin, наприклад
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки вбудованих Plugin і сумісності, але навмисно
не включені до загальної таблиці міграції та не є рекомендованою ціллю для
нового коду Plugin.

Те саме правило застосовується до інших сімейств вбудованих helper-ів, наприклад:

- helper-и підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper-ів/Plugin, як-от `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню helper-ів для токенів:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає конкретному завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, що застосовуються в усьому Plugin SDK, контракті постачальника,
поверхні runtime і маніфесті. Кожен із них досі працює сьогодні, але буде видалений
у майбутньому мажорному релізі. Запис під кожним пунктом зіставляє старий API з його
канонічною заміною.

<AccordionGroup>
  <Accordion title="Конструктори довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортуються з вужчого підшляху. `command-auth`
    повторно експортує їх як compat stubs.

    ```typescript
    // До
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Після
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper-и gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох окремих викликів.

    Downstream Plugin каналів (Slack, Discord, Matrix, Microsoft Teams) уже
    перейшли на це.

  </Accordion>

  <Accordion title="Shim channel runtime і helper-и дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    Plugin каналів. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Helper-и `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами каналів "actions". Натомість відкривайте можливості
    через семантичну поверхню `presentation` — Plugin каналів
    оголошують, що саме вони рендерять (картки, кнопки, select-и), а не які сирі
    назви дій вони приймають.

  </Accordion>

  <Accordion title="Helper tool() постачальника Web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в Plugin постачальника.
    OpenClaw більше не потребує helper-а SDK для реєстрації wrapper-а tool.

  </Accordion>

  <Accordion title="Текстові plaintext channel envelope-и → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского plaintext prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача. Plugin
    каналів додають метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Helper
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих
    envelope-ів, видимих асистенту, але plaintext envelope-и для вхідних повідомлень
    поступово вилучаються.

    Зони впливу: `inbound_claim`, `message_received` і будь-який кастомний
    Plugin каналу, який виконував постобробку тексту `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення постачальників → типи каталогу постачальників">
    Чотири псевдоніми типів виявлення тепер є тонкими wrapper-ами над
    типами епохи каталогу:

    | Старий псевдонім           | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний пакет `ProviderCapabilities` — Plugin постачальників
    повинні додавати факти можливостей через контракт runtime постачальника,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Hook-и політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі hook-и в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені
    значення за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hook-и продовжують працювати протягом
    вікна застарівання, але не композиціонуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього постачальника OAuth → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення постачальника в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
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

  <Accordion title="Пошук env-var постачальника → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    у маніфесті. Це об’єднує метадані env для setup/status в одному
    місці й дає змогу не запускати runtime Plugin лише для відповіді на
    пошук env-var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація Plugin memory → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові helper-и memory
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачіпаються.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (однина) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (множина) повертає DTO-орієнтований доступ до TaskFlow,
    який безпечний для імпорту й не вимагає завантаження всього task runtime.

    ```typescript
    // До
    const flow = api.runtime.tasks.flow(ctx);
    // Після
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Мігруйте розширення Pi для результатів інструментів на
    middleware". Тут наведено для повноти: вилучений шлях
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi замінено на
    `api.registerAgentToolResultMiddleware(...)` із явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований з `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Надавайте перевагу канонічній назві.

    ```typescript
    // До
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Після
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні extension (усередині вбудованих Plugin каналів/постачальників у
`extensions/`) відстежуються у власних barrel-файлах `api.ts` і `runtime-api.ts`.
Вони не впливають на сторонні контракти Plugin і тут не перелічені.
Якщо ви безпосередньо споживаєте локальний barrel вбудованого Plugin, перед оновленням
прочитайте коментарі про застарівання в цьому barrel-файлі.
</Note>

## Часова шкала вилучення

| Коли                   | Що відбувається                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**                | Застарілі поверхні виводять попередження в runtime                               |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; Plugin, які все ще їх використовують, завершаться помилкою |

Усі основні Plugin уже мігровано. Зовнішні Plugin повинні виконати міграцію
до наступного мажорного релізу.

## Тимчасове придушення попереджень

Під час роботи над міграцією встановіть ці змінні середовища:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Plugin каналів](/uk/plugins/sdk-channel-plugins) — створення Plugin каналів
- [Plugin постачальників](/uk/plugins/sdk-provider-plugins) — створення Plugin постачальників
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибокий розбір архітектури
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
