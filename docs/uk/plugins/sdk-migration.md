---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-27T14:19:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ef7690f48fae9286ae2d994e9e85af63f20eddf0d6cfef7c51be72929afd006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів
зі сфокусованими, документованими імпортами. Якщо ваш Plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широкі поверхні, які дозволяли Plugin імпортувати
все необхідне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки
  допоміжних функцій. Його було запроваджено, щоб старіші плагіни на основі хуків
  продовжували працювати під час розробки нової архітектури плагінів.
- **`openclaw/extension-api`** — міст, який надавав Plugin прямий доступ до
  допоміжних функцій на боці хоста, таких як вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений хук для вбудованих
  розширень лише для Pi, який міг спостерігати за подіями embedded-runner, такими як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання,
але нові Plugin не повинні їх використовувати, а наявним Plugin слід виконати міграцію до
того, як у наступному мажорному випуску їх буде вилучено. API реєстрації фабрики
вбудованих розширень лише для Pi було вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає і не переосмислює документовану поведінку Plugin у тій самій
зміні, яка вводить заміну. Зміни контракту, що порушують сумісність, спочатку
мають пройти через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки
реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних випусків.
  Plugin, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрики вбудованих розширень лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які — внутрішніми

Сучасний Plugin SDK виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і документованим контрактом.

Застарілі зручні шви провайдерів для вбудованих каналів також зникли.
Допоміжні шви з брендуванням каналів були приватними скороченнями mono-repo, а не стабільними
контрактами Plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині
робочого простору вбудованого Plugin залишайте допоміжні функції, що належать провайдеру, у власному `api.ts` або
`runtime-api.ts` цього Plugin.

Поточні приклади вбудованих провайдерів:

- Anthropic зберігає допоміжні функції потоків, специфічні для Claude, у власному шві `api.ts` /
  `contract-api.ts`
- OpenAI зберігає builder-и провайдера, допоміжні функції моделі за замовчуванням і builder-и
  провайдера реального часу у власному `api.ts`
- OpenRouter зберігає builder провайдера та допоміжні функції onboarding/config у власному
  `api.ts`

## Політика сумісності

Для зовнішніх Plugin робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. залишити стару поведінку підключеною через адаптер сумісності
3. вивести діагностичне повідомлення або попередження з указанням старого шляху та заміни
4. покрити тестами обидва шляхи
5. задокументувати застарівання та шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному випуску

Якщо поле маніфесту все ще приймається, автори Plugin можуть і надалі його використовувати,
доки документація й діагностика не повідомлять про інше. Новий код має віддавати перевагу
документованій заміні, але наявні Plugin не повинні ламатися під час звичайних мінорних
випусків.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть допоміжні функції завантаження/запису конфігурації під час виконання">
    Вбудовані Plugin повинні припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку вже
    передано в активний шлях виклику. Довгоживучі обробники, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агента повинні використовувати `ctx.getRuntimeConfig()` із контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе одно бачив
    оновлену конфігурацію виконання.

    Запис конфігурації має проходити через транзакційні допоміжні функції з вибором
    політики після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли викликач
    знає, що зміна потребує чистого перезапуску gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач сам
    контролює подальші дії і свідомо хоче вимкнути planner перезавантаження.
    Результати мутації містять типізоване зведення `followUp` для тестів і логування;
    gateway, як і раніше, відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими допоміжними
    функціями сумісності для зовнішніх Plugin протягом вікна міграції та виводять
    однократне попередження з кодом сумісності `runtime-config-load-write`. Вбудовані Plugin і
    код runtime у репозиторії захищені guardrail-сканерами в
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання у production Plugin
    завершується негайною помилкою, прямий запис конфігурації завершується помилкою, серверні методи gateway
    мають використовувати знімок runtime запиту, допоміжні функції надсилання/дії/клієнта каналу runtime
    мають отримувати конфігурацію зі свого граничного шару, а довгоживучі runtime-модулі
    мають нульову дозволену кількість фонових викликів `loadConfig()`.

    Новий код Plugin також повинен уникати імпорту широкого
    compat-barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, що відповідає потрібному завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації точки входу Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного знімка runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Запис конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні функції сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація Markdown-таблиць | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Допоміжні функції політики груп runtime | `openclaw/plugin-sdk/runtime-group-policy` |
    | Визначення секретного вводу | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сесії | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані Plugin і їхні тести захищені сканерами від використання широкого
    barrel, тому імпорти й mock-и залишаються локальними до потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен
    від нього залежати.

  </Step>

  <Step title="Перенесіть розширення результатів інструментів Pi на middleware">
    Вбудовані Plugin повинні замінити обробники результатів інструментів лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` на middleware, нейтральне до runtime.

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

    Зовнішні Plugin не можуть реєструвати middleware результатів інструментів, оскільки воно
    може переписувати високодовірений вивід інструмента до того, як його побачить модель.

  </Step>

  <Step title="Перенесіть обробники з нативним approval на факти можливостей">
    Plugin каналів із підтримкою approval тепер відкривають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-context.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічні для approval auth/delivery зі застарілого зв’язування `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу каналу; approval auth
      hooks там більше не зчитуються ядром
    - Реєструйте об’єкти runtime, що належать каналу, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення reroute notice, що належать Plugin, із нативних обробників approval;
      ядро тепер саме відповідає за повідомлення routed-elsewhere notice на основі фактичних результатів доставки
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Поточне компонування можливостей approval див. в `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, невизначені Windows
    wrapper-и `.cmd`/`.bat` тепер завершуються закрито, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // До
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Після
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Установлюйте це лише для довірених викликачів сумісності, які свідомо
      // допускають резервний перехід через оболонку.
      allowShellFallback: true,
    });
    ```

    Якщо ваш викликач не покладається свідомо на резервний перехід через оболонку, не встановлюйте
    `allowShellFallback` і натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму Plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх на сфокусовані імпорти">
    Кожен експорт зі старої поверхні відповідає певному сучасному шляху імпорту:

    ```typescript
    // До (застарілий шар зворотної сумісності)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Після (сучасні сфокусовані імпорти)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для допоміжних функцій на боці хоста використовуйте впроваджений runtime Plugin замість
    прямого імпорту:

    ```typescript
    // До (застарілий міст extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Після (впроваджений runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших застарілих допоміжних функцій мосту:

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
  | Import path | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічна допоміжна функція точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий узагальнений повторний експорт для визначень/builder-ів входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт схеми кореневої конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжна функція точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та builder-и входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування | Підказки allowlist, builder-и статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні функції runtime під час налаштування | Безпечні для імпорту адаптери patch налаштування, допоміжні функції приміток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні функції адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні функції інструментарію налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні функції для кількох облікових записів | Допоміжні функції списку/конфігурації облікових записів/контролю дій |
  | `plugin-sdk/account-id` | Допоміжні функції account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікових записів | Допоміжні функції пошуку облікового запису + резервного вибору за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні функції облікових записів | Допоміжні функції списку облікових записів/дій з обліковими записами |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Зв’язування префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder-и схем конфігурації | Спільні примітиви схеми конфігурації каналу та лише загальний builder |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації вбудованих модулів | Лише для сумісності вбудованих модулів; нові Plugin повинні визначати локальні схеми Plugin |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні функції стану облікового запису та життєвого циклу потоку чернеток | `createAccountStatusSink`, допоміжні функції фіналізації попереднього перегляду чернеток |
  | `plugin-sdk/inbound-envelope` | Допоміжні функції вхідного envelope | Спільні допоміжні функції маршрутів + builder-а envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні функції вхідних відповідей | Спільні допоміжні функції record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні функції розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні функції вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Допоміжні функції залежностей вихідного надсилання | Полегшений пошук `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні функції outbound runtime | Допоміжні функції outbound delivery, делегата identity/send, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції thread-binding | Допоміжні функції життєвого циклу thread-binding та адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні функції media payload | Builder media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні функції runtime | Допоміжні функції runtime/логування/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні функції runtime env | Logger/runtime env, допоміжні функції timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції runtime Plugin | Допоміжні функції команд/хуків/http/інтерактивності Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні функції конвеєра хуків | Спільні допоміжні функції конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні функції процесів | Спільні допоміжні функції exec |
  | `plugin-sdk/cli-runtime` | Допоміжні функції CLI runtime | Форматування команд, очікування, допоміжні функції версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні функції Gateway | Допоміжні функції клієнта Gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Допоміжні функції конфігурації | Допоміжні функції завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції команд Telegram | Допоміжні функції перевірки команд Telegram зі стабільним резервним варіантом, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні функції approval prompt | Допоміжні функції payload approval exec/Plugin, approval capability/profile, нативної маршрутизації/runtime approval і форматування шляху відображення структурованого approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні функції approval auth | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні функції approval client | Допоміжні функції профілю/фільтра нативного approval exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні функції approval delivery | Адаптери нативних approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні функції approval gateway | Спільна допоміжна функція визначення approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні функції адаптера approval | Полегшені допоміжні функції завантаження адаптера нативного approval для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні функції approval handler | Ширші допоміжні функції runtime обробника approval; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні функції цілей approval | Допоміжні функції прив’язки нативної цілі/облікового запису approval |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні функції відповіді approval | Допоміжні функції payload відповіді approval exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні функції channel runtime-context | Загальні допоміжні функції register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Допоміжні функції безпеки | Спільні допоміжні функції довіри, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні функції політики SSRF | Допоміжні функції allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні функції SSRF runtime | Допоміжні функції pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/collection-runtime` | Допоміжні функції обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні функції контролю діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні функції форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні функції графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch/proxy | `resolveFetch`, допоміжні функції proxy |
  | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні функції retry | `RetryConfig`, `retryAsync`, виконавці policy |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вводу allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Допоміжні функції контролю команд і поверхні команд | `resolveControlCommandGate`, допоміжні функції авторизації відправника, допоміжні функції реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір secret input | Допоміжні функції secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні функції запитів Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні функції guard для тіла запиту Webhook | Допоміжні функції читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Вхідна диспетчеризація, Heartbeat, planner відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції диспетчеризації відповідей | Допоміжні функції finalize, диспетчеризації провайдера та міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні функції історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповідей | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні функції фрагментації відповідей | Допоміжні функції фрагментації тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні функції сховища сесій | Допоміжні функції шляху сховища + `updated-at` |
  | `plugin-sdk/state-paths` | Допоміжні функції шляхів state | Допоміжні функції каталогів state та OAuth |
  | `plugin-sdk/routing` | Допоміжні функції маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні функції нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні функції статусу каналу | Builder-и зведень статусу каналу/облікового запису, типові значення runtime-state, допоміжні функції метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні функції визначення цілей | Спільні допоміжні функції визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації рядків | Допоміжні функції нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні функції URL запиту | Витягування рядкових URL із вхідних даних, схожих на запит |
  | `plugin-sdk/run-command` | Допоміжні функції timed command | Виконавець timed command із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Типові зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягування нормалізованих payload з об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні функції тимчасових шляхів | Спільні допоміжні функції шляху тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні функції логування | Допоміжні функції logger підсистеми та редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні функції Markdown-таблиць | Допоміжні функції режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповідей |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локального/self-hosted провайдера | Допоміжні функції виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдера, сумісного з OpenAI | Ті самі допоміжні функції виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні функції auth провайдера під час runtime | Допоміжні функції визначення API-key під час runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні функції налаштування API-key провайдера | Допоміжні функції onboarding/запису профілю для API-key |
  | `plugin-sdk/provider-auth-result` | Допоміжні функції auth-result провайдера | Стандартний builder OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Допоміжні функції інтерактивного входу провайдера | Спільні допоміжні функції інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні функції вибору провайдера | Вибір провайдера configured-or-auto і злиття сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні функції env var провайдера | Допоміжні функції пошуку env var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні функції моделі/повтору провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и replay-policy, допоміжні функції endpoint провайдера та нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні функції каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні функції конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні функції HTTP провайдера | Загальні допоміжні функції HTTP/можливостей endpoint провайдера, зокрема допоміжні функції multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні функції web-fetch провайдера | Допоміжні функції реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні функції конфігурації web-search провайдера | Вузькі допоміжні функції конфігурації/облікових даних web-search для провайдерів, яким не потрібне зв’язування ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні функції контракту web-search провайдера | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter-и облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні функції web-search провайдера | Допоміжні функції реєстрації/кешу/runtime провайдера web-search |
  | `plugin-sdk/provider-tools` | Допоміжні функції compat інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика та допоміжні функції compat для xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні функції використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні функції використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні функції обгорток потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні функції обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні функції транспорту провайдера | Нативні допоміжні функції транспорту провайдера, такі як guarded fetch, перетворення transport message і writable потоки подій транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні функції медіа | Допоміжні функції fetch/transform/store для медіа, а також builder-и media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції генерації медіа | Спільні допоміжні функції failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні функції розуміння медіа | Типи провайдера розуміння медіа та експорти допоміжних функцій зображення/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Спільні допоміжні функції тексту | Видалення тексту, видимого асистенту, допоміжні функції рендерингу/chunking/таблиць markdown, редагування чутливих даних, допоміжні функції directive-tag, утиліти safe-text та пов’язані допоміжні функції тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні функції фрагментації тексту | Допоміжна функція фрагментації вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні функції мовлення | Типи провайдера мовлення та експорти допоміжних функцій directive, registry і validation для провайдерів |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдера мовлення, registry, directives, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні функції транскрибування в реальному часі | Типи провайдера, допоміжні функції registry та спільна допоміжна функція сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні функції голосу в реальному часі | Типи провайдера, допоміжні функції registry/визначення та допоміжні функції bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні функції failover, auth і registry |
  | `plugin-sdk/music-generation` | Допоміжні функції генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні функції failover, пошуку провайдера та розбору model-ref |
  | `plugin-sdk/video-generation` | Допоміжні функції генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні функції failover, пошуку провайдера та розбору model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні функції інтерактивних відповідей | Нормалізація/редукція payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви schema конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні функції запису конфігурації каналу | Допоміжні функції авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Експорти спільної преамбули channel Plugin |
  | `plugin-sdk/channel-status` | Допоміжні функції статусу каналу | Спільні допоміжні функції snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні функції конфігурації allowlist | Допоміжні функції редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні функції доступу до групи | Спільні допоміжні функції рішень щодо group-access |
  | `plugin-sdk/direct-dm` | Допоміжні функції direct-DM | Спільні допоміжні функції auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні функції розширень | Примітиви passive-channel/status і ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні функції цілей Webhook | Допоміжні функції registry цілей Webhook та встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні функції шляху Webhook | Допоміжні функції нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні функції вебмедіа | Допоміжні функції завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні функції memory-core | Поверхня допоміжних функцій менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до registry, локальний провайдер і загальні batch/remote допоміжні функції; конкретні remote-провайдери містяться у Plugin-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні функції хоста пам’яті | Мультимодальні допоміжні функції хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста пам’яті | Допоміжні функції запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста пам’яті | Допоміжні функції секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста пам’яті | Допоміжні функції журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста пам’яті | Допоміжні функції статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні функції CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Базовий runtime хоста пам’яті | Допоміжні функції базового runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста пам’яті | Допоміжні функції файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім базового runtime хоста пам’яті | Нейтральний до постачальника псевдонім для допоміжних функцій базового runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний до постачальника псевдонім для допоміжних функцій журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний до постачальника псевдонім для допоміжних функцій файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні функції керованого markdown | Спільні допоміжні функції керованого markdown для Plugin, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку Active Memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний до постачальника псевдонім для допоміжних функцій статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Вбудовані допоміжні функції memory-lancedb | Поверхня допоміжних функцій memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні функції тестування та mock-и |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не повну
поверхню SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі допоміжні шви для вбудованих Plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки та сумісності вбудованих Plugin, але навмисно не включені до
поширеної таблиці міграції й не є рекомендованою ціллю для
нового коду Plugin.

Те саме правило стосується інших сімейств вбудованих допоміжних модулів, зокрема:

- допоміжних функцій підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- вбудованих поверхонь допоміжних модулів/Plugin, таких як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` зараз надає вузьку поверхню
допоміжних функцій токена: `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерельний код у `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються до Plugin SDK, контракту провайдера,
поверхні runtime і маніфесту. Кожен із них усе ще працює сьогодні, але буде вилучений
у майбутньому мажорному випуску. Запис під кожним елементом зіставляє старий API з його
канонічною заміною.

<AccordionGroup>
  <Accordion title="builder-и довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортуються з вужчого підшляху. `command-auth`
    повторно експортує їх як compat-заглушки.

    ```typescript
    // До
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Після
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні функції контролю згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об’єкт рішення замість двох окремих викликів.

    Downstream channel Plugin (Slack, Discord, Matrix, MS Teams) уже
    перейшли на це.

  </Accordion>

  <Accordion title="Shim channel runtime і допоміжні функції дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це compat-shim для старіших
    channel Plugin. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Допоміжні функції `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими експортами каналу типу "actions". Натомість
    відкривайте можливості через семантичну поверхню `presentation` — channel Plugin
    оголошують, що саме вони рендерять (картки, кнопки, списки вибору), а не
    які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжна функція tool() для провайдера web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в Plugin провайдера.
    OpenClaw більше не потрібна допоміжна функція SDK для реєстрації обгортки інструмента.

  </Accordion>

  <Accordion title="Прості текстові envelope каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского простого текстового prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки user-context. Channel
    Plugin прикріплюють метадані маршрутизації (гілка, тема, reply-to, реакції) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжна функція
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих
    envelope, видимих асистенту, але вхідні прості текстові envelope
    поступово виводяться з ужитку.

    Зони впливу: `inbound_claim`, `message_received` і будь-який користувацький
    channel Plugin, який додатково обробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдера → типи каталогу провайдера">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над
    типами епохи каталогу:

    | Старий псевдонім          | Новий тип                |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    А також застарілий статичний набір `ProviderCapabilities` — Plugin провайдерів
    повинні прикріплювати факти можливостей через контракт runtime провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Хуки політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені значення
    за рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати протягом
    вікна застарівання, але не комбінуються з результатом профілю.

  </Accordion>

  <Accordion title="Резервний варіант зовнішнього OAuth провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "резервної auth" видає попередження під час виконання і буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env var провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: відобразіть той самий пошук env var у `setup.providers[].envVars`
    в маніфесті. Це консолідує метадані env налаштування/статусу в одному
    місці й дозволяє не запускати runtime Plugin лише для відповіді на
    пошук env var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація Plugin пам’яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у memory-state API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові допоміжні функції пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) це не зачіпає.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                        | Нове                           |
    | ---------------------------- | ------------------------------ |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` застарів на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає доступ до TaskFlow на основі DTO,
    безпечний для імпорту й не потребує завантаження повного task runtime.

    ```typescript
    // До
    const flow = api.runtime.tasks.flow(ctx);
    // Після
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Перенесіть розширення результатів інструментів Pi на
    middleware". Додано тут для повноти: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований із `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Віддавайте перевагу канонічній назві.

    ```typescript
    // До
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Після
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні extension (усередині вбудованих channel/provider Plugin у
`extensions/`) відстежуються у їхніх власних barrel-файлах `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugin і тут не перелічені.
Якщо ви напряму використовуєте локальний barrel вбудованого Plugin, прочитайте
коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Графік вилучення

| Коли                  | Що відбувається                                                        |
| --------------------- | ---------------------------------------------------------------------- |
| **Зараз**             | Застарілі поверхні видають попередження під час виконання              |
| **Наступний мажорний випуск** | Застарілі поверхні буде вилучено; Plugin, які все ще їх використовують, перестануть працювати |

Усі основні Plugin уже мігровано. Зовнішнім Plugin слід виконати міграцію
до наступного мажорного випуску.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий запасний варіант, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Channel Plugin](/uk/plugins/sdk-channel-plugins) — створення channel Plugin
- [Provider Plugin](/uk/plugins/sdk-provider-plugins) — створення provider Plugin
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибокий огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) — довідник зі схеми маніфесту
