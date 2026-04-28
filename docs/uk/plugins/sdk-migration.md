---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Мігруйте із застарілого шару зворотної сумісності на сучасний SDK Plugin
title: Міграція SDK Plugin
x-i18n:
    generated_at: "2026-04-28T00:34:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3c04ccf641cbcaf34c015d079e5403be738a87fc4bddd974b14455c9cafe0ee
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури plugin
із цільовими, задокументованими імпортами. Якщо ваш Plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система plugin надавала дві широкі поверхні, які дозволяли plugins імпортувати
все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки
  допоміжних засобів. Його було запроваджено, щоб старіші plugins на основі hook-ів
  продовжували працювати, поки будувалася нова архітектура plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel допоміжних засобів середовища виконання,
  який змішував системні події, стан Heartbeat, черги доставки, допоміжні засоби fetch/proxy,
  файлові допоміжні засоби, типи схвалення та не пов’язані між собою утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації,
  який усе ще містить застарілі прямі допоміжні засоби load/write протягом
  вікна міграції.
- **`openclaw/extension-api`** — міст, який надавав plugins прямий доступ до
  допоміжних засобів на боці хоста, таких як вбудований виконавець агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений hook вбудованого
  extension лише для Pi, який міг спостерігати за подіями вбудованого виконавця, такими як
  `tool_result`.

Широкі поверхні імпорту тепер **deprecated**. Вони все ще працюють у середовищі виконання,
але нові plugins не повинні їх використовувати, а наявні plugins повинні виконати міграцію до
того, як наступний мажорний реліз їх видалить. API реєстрації фабрики вбудованого extension
лише для Pi було вилучено; замість нього використовуйте middleware результатів інструментів.

OpenClaw не видаляє й не переосмислює задокументовану поведінку plugin у тій самій
зміні, яка вводить заміну. Зміни контрактів із порушенням сумісності спочатку
мають пройти через адаптер сумісності, diagnostics, docs і вікно застарівання.
Це стосується імпортів SDK, полів маніфесту, API setup, hook-ів і поведінки
реєстрації середовища виконання.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Plugins, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрики вбудованого extension лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний SDK Plugin це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі допоміжні з’єднання зручності provider для вбудованих channels також зникли.
Допоміжні з’єднання з брендуванням channel були приватними скороченнями mono-repo, а не стабільними
контрактами plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині
робочого простору вбудованого plugin тримайте допоміжні засоби, що належать provider, у власному
`api.ts` або `runtime-api.ts` цього plugin.

Поточні приклади вбудованих provider:

- Anthropic зберігає допоміжні засоби потоку, специфічні для Claude, у власному з’єднанні `api.ts` /
  `contract-api.ts`
- OpenAI зберігає побудовники provider, допоміжні засоби моделей за замовчуванням і побудовники
  provider реального часу у власному `api.ts`
- OpenRouter зберігає побудовник provider і допоміжні засоби онбордингу/конфігурації у власному
  `api.ts`

## Політика сумісності

Для зовнішніх plugins робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. залишити стару поведінку підключеною через адаптер сумісності
3. вивести diagnostic або warning, який називає старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати застарівання та шлях міграції
6. видаляти лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори plugins можуть і далі використовувати його,
доки docs і diagnostics не скажуть інакше. Новий код має надавати перевагу
задокументованій заміні, але наявні plugins не повинні ламатися під час звичайних
мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Виконайте міграцію допоміжних засобів load/write конфігурації середовища виконання">
    Вбудовані plugins мають припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку вже
    було передано в активний шлях виклику. Довгоживучі обробники, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агента мають використовувати `ctx.getRuntimeConfig()` із контексту інструмента в
    `execute`, щоб інструмент, створений до запису конфігурації, усе одно бачив
    оновлену конфігурацію середовища виконання.

    Запис конфігурації має виконуватися через транзакційні допоміжні засоби з
    вибором політики після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли викликач знає,
    що зміна потребує чистого перезапуску Gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач сам керує
    наступним кроком і свідомо хоче приглушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і журналювання;
    Gateway і далі відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються як застарілі допоміжні засоби
    сумісності для зовнішніх plugins протягом вікна міграції та один раз попереджають
    із кодом сумісності `runtime-config-load-write`. Вбудовані plugins і код
    середовища виконання репозиторію захищені обмеженнями сканера в
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання plugin у production
    одразу завершується помилкою, прямі записи конфігурації завершуються помилкою,
    методи сервера gateway мають використовувати знімок середовища виконання запиту,
    допоміжні засоби send/action/client середовища виконання channel
    мають отримувати конфігурацію зі своєї межі, а довгоживучі модулі середовища виконання
    мають нуль допустимих фонових викликів `loadConfig()`.

    Новий код plugin також повинен уникати імпорту широкого
    barrel сумісності `openclaw/plugin-sdk/config-runtime`. Використовуйте
    вузький підшлях SDK, що відповідає задачі:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації запису plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного знімка середовища виконання | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиць Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Допоміжні засоби середовища виконання політики груп | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сесії | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані plugins та їхні тести захищені сканером від цього широкого
    barrel, щоб імпорти й mock-и залишалися локальними для потрібної їм поведінки. Широкий
    barrel і далі існує для зовнішньої сумісності, але новий код не повинен від нього залежати.

  </Step>

  <Step title="Виконайте міграцію Pi extension результатів інструментів на middleware">
    Вбудовані plugins мають замінити обробники результатів інструментів
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi
    на middleware, нейтральне до середовища виконання.

    ```typescript
    // Динамічні інструменти середовища виконання Pi і Codex
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

    Зовнішні plugins не можуть реєструвати middleware результатів інструментів, оскільки воно
    може переписувати високодовірений вивід інструментів до того, як модель його побачить.

  </Step>

  <Step title="Виконайте міграцію native-обробників схвалення на факти можливостей">
    Plugins channel із можливістю схвалення тепер надають native-поведінку схвалення через
    `approvalCapability.nativeRuntime` плюс спільний реєстр контексту середовища виконання.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для схвалення, зі застарілої зв’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу channel; auth
      hook-и схвалення там більше не зчитуються core
    - Реєструйте об’єкти середовища виконання, що належать channel, такі як clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення reroute, що належать plugin, з native-обробників схвалення;
      core тепер сам володіє сповіщеннями routed-elsewhere з фактичних результатів доставки
    - Передаючи `channelRuntime` до `createChannelManager(...)`, надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Поточну структуру можливостей схвалення дивіться в `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку оболонки Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`,
    нерозв’язані wrappers Windows `.cmd`/`.bat` тепер завершуються відмовою за замовчуванням, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // До
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Після
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Установлюйте це лише для довірених сумісних викликачів, які свідомо
      // допускають резервний перехід через shell.
      allowShellFallback: true,
    });
    ```

    Якщо ваш викликач свідомо не покладається на резервний перехід через shell, не встановлюйте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх цільовими імпортами">
    Кожен експорт зі старої поверхні відповідає конкретному сучасному шляху імпорту:

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

    Для допоміжних засобів на боці хоста використовуйте впроваджене середовище виконання plugin замість
    прямого імпорту:

    ```typescript
    // До (застарілий міст extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Після (впроваджене середовище виконання)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Та сама схема застосовується й до інших застарілих допоміжних засобів моста:

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
    сумісності, але новий код повинен імпортувати цільову поверхню допоміжних засобів,
    яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Злив черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності channel | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні засоби шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби proxy і захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання схвалення | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні засоби payload відповіді на схвалення та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування в межах процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Вбудовані plugins захищені сканером від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel.

  </Step>

  <Step title="Виконайте міграцію допоміжних засобів маршрутів channel">
    Новий код маршрутів channel повинен використовувати `openclaw/plugin-sdk/channel-route`.
    Старіші назви route-key і comparable-target залишаються як псевдоніми
    сумісності протягом вікна міграції, але нові plugins повинні використовувати назви маршрутів,
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

    Сучасні допоміжні засоби маршрутів послідовно нормалізують
    `{ channel, to, accountId, threadId }` для native-схвалень, приглушення відповідей, дедуплікації вхідних даних,
    доставки Cron і маршрутизації сесій. Якщо ваш Plugin володіє власною граматикою
    цілей, використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    parser до того самого контракту цілі маршруту.

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
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-повторний експорт для визначень/побудовників точки входу channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та побудовники точки входу channel | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра setup | Запити allowlist, побудовники статусу setup |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби середовища виконання під час setup | Безпечні для імпорту адаптери patch setup, допоміжні засоби приміток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі setup |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку/конфігурації/шлюзу дій облікових записів |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікових записів + резервного використання за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій над обліковими записами |
  | `plugin-sdk/channel-setup` | Адаптери майстра setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pairing для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Зв’язування префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Побудовники схем конфігурації | Спільні примітиви схеми конфігурації channel і лише загальний побудовник |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації вбудованих channel | Лише сумісність для вбудованих; нові plugins мають визначати локальні схеми plugin |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби статусу облікового запису та життєвого циклу потоку чернеток | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби inbound envelope | Спільні допоміжні засоби маршруту + побудовника envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби inbound reply | Спільні допоміжні засоби запису й dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби outbound media | Спільне завантаження outbound media |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей outbound send | Полегшений пошук `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound runtime | Допоміжні засоби outbound доставки, identity/send delegate, сесій, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язок потоків | Допоміжні засоби життєвого циклу та адаптера прив’язок потоків |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Побудовник media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти середовища виконання channel |
  | `plugin-sdk/channel-send-result` | Типи результатів send | Типи результатів reply |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання | Допоміжні засоби runtime/logging/backup/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env | Logger/runtime env, timeout, retry та допоміжні засоби backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби середовища виконання plugin | Допоміжні засоби команд/hooks/http/interactive plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби pipeline hook | Спільні допоміжні засоби pipeline Webhook/внутрішніх hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесу | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби середовища виконання CLI | Форматування команд, очікування, допоміжні засоби версії |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Допоміжні засоби клієнта Gateway та patch статусу channel |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби перевірки команд Telegram зі стабільним резервним варіантом, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів схвалення | Payload схвалення exec/plugin, допоміжні засоби capability/profile схвалення, native-маршрутизація/середовище виконання схвалення та форматування шляху структурованого відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth схвалення | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби profile/filter native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки схвалення | Адаптери capability/delivery native approval |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway схвалення | Спільний допоміжний засіб визначення Gateway схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалення | Полегшені допоміжні засоби завантаження адаптера native approval для гарячих точок входу channel |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалення | Ширші допоміжні засоби середовища виконання обробника схвалення; надавайте перевагу вужчим з’єднанням adapter/gateway, якщо їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей схвалення | Допоміжні засоби прив’язки цілі/облікового запису native approval |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби reply схвалення | Допоміжні засоби payload відповіді на схвалення exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context channel | Загальні допоміжні засоби register/get/watch runtime-context channel |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, обмеження DM, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Допоміжні засоби pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності channel | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Безпечні допоміжні засоби шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби керування diagnostics | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політики |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Допоміжні засоби командного gating і поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Засоби відтворення статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір secret input | Допоміжні засоби secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільне середовище виконання reply | Inbound dispatch, Heartbeat, планувальник reply, розбиття на частини |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch reply | Допоміжні засоби фіналізації, dispatch provider і міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії reply | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань reply | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk для reply | Допоміжні засоби chunk для text/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану й OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу channel | Побудовники підсумків статусу channel/account, значення runtime-state за замовчуванням, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілей | Спільні допоміжні засоби визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із вимірюванням часу | Виконавець команд із вимірюванням часу з нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Засоби читання параметрів | Загальні засоби читання параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягування нормалізованих payload з об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування send інструмента | Витягування канонічних полів цілі send з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби logging | Допоміжні засоби logger підсистеми та редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби таблиць Markdown | Допоміжні засоби режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload reply |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби setup локального/self-hosted provider | Допоміжні засоби виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби setup self-hosted provider, сумісного з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth provider у середовищі виконання | Допоміжні засоби визначення API-key у середовищі виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби setup API-key provider | Допоміжні засоби онбордингу/запису профілю API-key |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result provider | Стандартний побудовник OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу provider | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору provider | Вибір provider з конфігурації або автоматично та злиття сирих конфігурацій provider |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var provider | Допоміжні засоби пошуку auth env-var provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби endpoint provider та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу provider | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP provider | Загальні допоміжні засоби HTTP/capability endpoint provider, включно з допоміжними засобами multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch provider | Допоміжні засоби реєстрації/кешу provider для web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search provider | Вузькі допоміжні засоби конфігурації/облікових даних web-search для provider, яким не потрібна зв’язка ввімкнення plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search provider | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search provider | Допоміжні засоби реєстрації/кешу/середовища виконання provider для web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності tool/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + diagnostics і допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби usage provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби usage provider |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток stream provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби transport provider | Допоміжні засоби native transport provider, такі як guarded fetch, перетворення повідомлень transport і потоки подій transport із можливістю запису |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби fetch/transform/store для media плюс побудовники payload media |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації media | Спільні допоміжні засоби failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи provider для media understanding плюс експортовані допоміжні засоби для зображень/аудіо, орієнтовані на provider |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого для асистента тексту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби тегів directive, утиліти safe-text та пов’язані допоміжні засоби тексту/logging |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжний засіб chunking для outbound text |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи provider для speech плюс допоміжні засоби directive, registry і validation, орієнтовані на provider |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи provider для speech, registry, directives, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрибування в реальному часі | Типи provider, допоміжні засоби registry і спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи provider, допоміжні засоби registry/визначення та допоміжні засоби bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні засоби failover, auth і registry |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи provider/request/result для генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук provider і розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи provider/request/result для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук provider і розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних reply | Нормалізація/скорочення payload інтерактивних reply |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації channel | Вузькі примітиви `channel config-schema` |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації channel | Допоміжні засоби авторизації запису конфігурації channel |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude channel | Експорти спільного prelude channel plugin |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу channel | Спільні допоміжні засоби знімка/підсумку статусу channel |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби рішень щодо group-access |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви пасивного channel/status і ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення route |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляху Webhook | Допоміжні засоби нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів SDK Plugin |
  | `plugin-sdk/memory-core` | Допоміжні засоби вбудованого memory-core | Поверхня допоміжних засобів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання рушія memory | Фасад середовища виконання index/search для memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine хоста memory | Експорти foundation engine хоста memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста memory | Контракти embeddings memory, доступ до registry, локальний provider і загальні допоміжні засоби batch/remote; конкретні remote providers знаходяться у plugins-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста memory | Експорти QMD engine хоста memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста memory | Експорти storage engine хоста memory |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста memory | Мультимодальні допоміжні засоби хоста memory |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби query хоста memory | Допоміжні засоби query хоста memory |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста memory | Допоміжні засоби secret хоста memory |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста memory | Допоміжні засоби журналу подій хоста memory |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста memory | Допоміжні засоби статусу хоста memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Середовище виконання CLI хоста memory | Допоміжні засоби середовища виконання CLI хоста memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Основне середовище виконання хоста memory | Допоміжні засоби основного середовища виконання хоста memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста memory | Допоміжні засоби файлів/середовища виконання хоста memory |
  | `plugin-sdk/memory-host-core` | Псевдонім основного середовища виконання хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів основного середовища виконання хоста memory |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста memory |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/середовища виконання хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/середовища виконання хоста memory |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для plugins, суміжних із memory |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Lazy-фасад середовища виконання менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів статусу хоста memory |
  | `plugin-sdk/memory-lancedb` | Допоміжні засоби вбудованого memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні засоби тестування та mock-и |
</Accordion>

Ця таблиця навмисно є поширеною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із понад 200 точок входу розміщено в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі допоміжні з’єднання для вбудованих plugins, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
супроводу вбудованих plugins і сумісності, але навмисно пропущені з поширеної
таблиці міграції та не є рекомендованою ціллю для нового коду plugin.

Те саме правило стосується інших сімейств вбудованих допоміжних засобів, таких як:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих допоміжних засобів/plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню допоміжних засобів токенів:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, що відповідає задачі. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в SDK Plugin, контракті provider,
поверхні середовища виконання та маніфесті. Кожне з них усе ще працює сьогодні,
але буде вилучене в одному з майбутніх мажорних релізів. Запис під кожним
елементом відображає старий API на його канонічну заміну.

<AccordionGroup>
  <Accordion title="Побудовники довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого підшляху. `command-auth`
    повторно експортує їх як сумісні stubs.

    ```typescript
    // До
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Після
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об’єкт рішення замість двох розділених викликів.

    Нижчерозташовані plugins channel (Slack, Discord, Matrix, Microsoft Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim середовища виконання channel і допоміжні засоби дій channel">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    plugins channel. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    середовища виконання.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    deprecated разом із сирими експортами channel "actions". Натомість надавайте можливості
    через семантичну поверхню `presentation` — plugins channel
    оголошують, що саме вони відтворюють (картки, кнопки, списки вибору), а не
    які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний засіб tool() provider для web search → createTool() у plugin">
    **Старе**: фабрика `tool()` із `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в plugin provider.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки інструмента.

  </Accordion>

  <Accordion title="Текстові в plaintext envelope channel → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского plaintext prompt
    envelope з вхідних повідомлень channel.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача. Plugins
    channel додають метадані маршрутизації (потік, тема, reply-to, реакції) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжний засіб
    `formatAgentEnvelope(...)` і далі підтримується для синтезованих envelope,
    видимих асистенту, але вхідні plaintext envelope поступово виводяться з ужитку.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який власний
    Plugin channel, який виконував постобробку тексту `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи discovery provider → типи каталогу provider">
    Чотири псевдоніми типів discovery тепер є тонкими обгортками над типами
    епохи catalog:

    | Старий псевдонім          | Новий тип                |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Плюс застарілий статичний контейнер `ProviderCapabilities` — plugins provider
    мають прив’язувати факти можливостей через контракт середовища виконання provider,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Hook-и політики thinking → resolveThinkingProfile">
    **Старе** (три окремі hook-и в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені значення
    за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hook-и продовжують працювати протягом
    вікна застарівання, але не композуються з результатом профілю.

  </Accordion>

  <Accordion title="Резервний шлях зовнішнього OAuth provider → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення provider у маніфесті plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "auth fallback" виводить warning у середовищі виконання і буде вилучений.

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

    **Нове**: продублюйте той самий пошук env-var у `setup.providers[].envVars`
    маніфесту. Це об’єднує метадані env setup/status в одному
    місці й дозволяє уникнути запуску середовища виконання plugin лише для відповіді на
    запити env-var.

    `providerAuthEnvVars` і далі підтримується через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація memory plugin → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик на API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові допоміжні засоби memory
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                        | Нове                             |
    | ---------------------------- | -------------------------------- |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    Метод середовища виконання `readSession` є deprecated на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (однина) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (множина) повертає DTO-орієнтований доступ до TaskFlow,
    безпечний для імпорту й такий, що не вимагає завантаження повного runtime задач.

    ```typescript
    // До
    const flow = api.runtime.tasks.flow(ctx);
    // Після
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих extension → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Виконайте міграцію Pi extension результатів інструментів на
    middleware". Тут включено для повноти: вилучений шлях
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime у
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований із `openclaw/plugin-sdk`, тепер є
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
Застарівання на рівні extension (усередині вбудованих channel/provider plugins у
`extensions/`) відстежуються у власних barrel-файлах `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх plugins і тут не перелічені.
Якщо ви безпосередньо споживаєте локальний barrel вбудованого plugin, прочитайте
коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Хронологія видалення

| Коли                   | Що відбувається                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять warnings під час виконання                  |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; plugins, які все ще їх використовують, завершаться помилкою |

Усі основні plugins уже мігровано. Зовнішні plugins мають виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Plugins channel](/uk/plugins/sdk-channel-plugins) — створення plugins channel
- [Plugins provider](/uk/plugins/sdk-provider-plugins) — створення plugins provider
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
