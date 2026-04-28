---
read_when:
    - Ви бачите попередження `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ви бачите попередження `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція на Plugin SDK
x-i18n:
    generated_at: "2026-04-28T03:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: d53609fd0b55d1349a1666a5d11a6276bca6534bcbaa064493e5ff1cf8eb784e
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin із цільовими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві широкі поверхні, які дозволяли Plugin імпортувати будь-що потрібне з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який реекспортував десятки допоміжних засобів. Його було запроваджено, щоб старіші Plugins на основі хуків продовжували працювати, поки будувалася нова архітектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel допоміжних засобів runtime, який змішував системні події, стан Heartbeat, черги доставки, допоміжні засоби fetch/proxy, файлові допоміжні засоби, типи схвалення та не пов’язані між собою утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації, який і далі містить застарілі прямі допоміжні засоби load/write протягом перехідного періоду міграції.
- **`openclaw/extension-api`** — міст, який надавав Plugins прямий доступ до допоміжних засобів на боці хоста, таких як вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений хук bundled extension лише для Pi, який міг спостерігати події embedded-runner, такі як `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання, але нові Plugins не повинні їх використовувати, а наявні Plugins мають виконати міграцію до того, як у наступному мажорному релізі їх буде вилучено. API реєстрації embedded extension factory лише для Pi було вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає і не переосмислює задокументовану поведінку Plugin у тій самій зміні, яка вводить заміну. Зламні зміни контрактів спочатку мають пройти через адаптер сумісності, діагностику, документацію та період застарівання. Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки реєстрації runtime.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Plugins, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації embedded extension factory лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі реекспорти полегшували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експортовані елементи були стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams постачальників для bundled channels також прибрано.
Допоміжні seams із брендуванням channel були приватними скороченнями mono-repo, а не стабільними контрактами Plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині bundled workspace Plugin зберігайте допоміжні засоби, що належать постачальнику, у власному `api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади bundled provider:

- Anthropic зберігає допоміжні засоби потоку, специфічні для Claude, у власному seam `api.ts` / `contract-api.ts`
- OpenAI зберігає конструктори provider, допоміжні засоби default-model і конструктори realtime provider у власному `api.ts`
- OpenRouter зберігає конструктор provider і допоміжні засоби onboarding/config у власному `api.ts`

## Політика сумісності

Для зовнішніх Plugins робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. залишити стару поведінку підключеною через адаптер сумісності
3. надсилати діагностику або попередження, яке називає старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати застарівання і шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Супровідники можуть перевірити поточну чергу міграції за допомогою
`pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
компактних підрахунків, `--owner <id>` для одного Plugin або власника сумісності, і
`pnpm plugins:boundary-report:ci`, коли CI gate має завершуватися помилкою через прострочені
записи сумісності, зарезервовані імпорти SDK між різними власниками або невикористані зарезервовані SDK
subpaths без класифікації dormant. Звіт групує застарілі
записи сумісності за датою вилучення, підраховує посилання в локальному коді/документації,
показує зарезервовані імпорти SDK між різними власниками, класифікує dormant зарезервовані SDK
subpaths і підсумовує приватний memory-host SDK bridge, щоб очищення сумісності залишалося явним, а не спиралося на ad hoc пошуки.

Якщо поле маніфесту все ще приймається, автори Plugin можуть продовжувати його використовувати, доки документація та діагностика не повідомлять інше. Новий код має надавати перевагу задокументованій заміні, але наявні Plugins не повинні ламатися під час звичайних мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть допоміжні засоби load/write конфігурації runtime">
    Bundled plugins повинні припинити напряму викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку
    вже було передано в активний шлях виклику. Довгоживучі обробники, яким
    потрібен поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агента повинні використовувати `ctx.getRuntimeConfig()` із контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе одно бачив оновлену
    конфігурацію runtime.

    Записи конфігурації мають проходити через транзакційні допоміжні засоби та вибирати
    політику after-write:

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
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач контролює
    подальші дії та свідомо хоче вимкнути планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і журналювання;
    Gateway і надалі відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються як застарілі допоміжні засоби
    сумісності для зовнішніх Plugins протягом періоду міграції та один раз попереджають за допомогою
    коду сумісності `runtime-config-load-write`. Bundled plugins і код
    runtime репозиторію захищені scanner guardrails у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання production Plugin
    одразу завершується помилкою, прямі записи конфігурації завершуються помилкою,
    методи сервера Gateway повинні використовувати snapshot runtime запиту,
    допоміжні засоби send/action/client runtime channel повинні отримувати конфігурацію зі своєї boundary,
    а довгоживучі модулі runtime повинні мати
    нуль дозволених ambient викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    barrel сумісності `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, який відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації запису Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного snapshot runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиці Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Допоміжні засоби runtime політики груп | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins та їхні тести захищені scanner-обмеженнями від широкого
    barrel, щоб імпорти й mocks залишалися локальними для потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен від нього залежати.

  </Step>

  <Step title="Перенесіть Pi tool-result extensions на middleware">
    Bundled plugins повинні замінити обробники tool-result лише для Pi з
    `api.registerEmbeddedExtensionFactory(...)`
    на middleware, нейтральне до runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
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

    Зовнішні Plugins не можуть реєструвати middleware результатів інструментів, тому що воно
    може переписувати високодовірений вивід інструмента до того, як його побачить модель.

  </Step>

  <Step title="Перенесіть approval-native handlers на capability facts">
    Plugins channel із підтримкою approval тепер надають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-context.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі застарілої логіки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту
      channel-plugin; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout channel; approval
      hooks там більше не читаються ядром
    - Реєструйте об’єкти runtime, що належать channel, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення reroute, що належать Plugin, із native approval handlers;
      тепер ядро відповідає за сповіщення routed-elsewhere на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Дивіться `/plugins/sdk-channel-plugins`, щоб ознайомитися з поточним
    компонуванням approval capability.

  </Step>

  <Step title="Перевірте резервну поведінку wrapper у Windows">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані wrapper-и Windows
    `.cmd`/`.bat` тепер завершуються в закритому режимі, якщо ви явно не передасте
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

    Якщо ваш викликач навмисно не покладається на shell fallback, не встановлюйте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

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

    Для допоміжних засобів на боці хоста використовуйте injected runtime Plugin замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших застарілих допоміжних засобів bridge:

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
    сумісності, але новий код має імпортувати ту цільову поверхню допоміжних засобів,
    яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності channel | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні засоби шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби proxy і guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання approval | `openclaw/plugin-sdk/approval-runtime` |
    | Payload відповіді approval і допоміжні засоби команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування в межах процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові блокування | `openclaw/plugin-sdk/file-lock` |

    Bundled plugins захищені scanner-обмеженнями від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel.

  </Step>

  <Step title="Перенесіть допоміжні засоби маршрутів channel">
    Новий код маршрутів channel має використовувати `openclaw/plugin-sdk/channel-route`.
    Старіші назви route-key і comparable-target залишаються як псевдоніми сумісності
    протягом перехідного періоду міграції, але нові Plugins мають використовувати назви маршрутів,
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
    для native approvals, придушення відповідей, дедуплікації вхідних даних,
    доставки Cron і маршрутизації сесій. Якщо ваш Plugin має власну граматику
    target, використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    parser до того самого контракту target маршруту.

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
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-реекспорт для визначень/конструкторів входу channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб входу single-provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та конструктори входу channel | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Підказки allowlist, конструктори стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Import-safe адаптери patch налаштування, допоміжні засоби приміток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментарію setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби мультиакаунтів | Допоміжні засоби списку/config/action-gate акаунтів |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку акаунтів | Допоміжні засоби пошуку акаунта + fallback за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби акаунтів | Допоміжні засоби списку акаунтів/account-action |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Логіка префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем config | Спільні примітиви схеми config channel і лише загальний конструктор |
  | `plugin-sdk/bundled-channel-config-schema` | Схеми config для bundled | Лише для bundled plugins, які підтримує OpenClaw; нові Plugins мають визначати локальні схеми Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі bundled схеми config | Лише псевдонім сумісності; для підтримуваних bundled plugins використовуйте `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби config команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби стану акаунта та життєвого циклу потоку чернеток | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернеток |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби inbound envelope | Спільні допоміжні засоби route + побудови envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби inbound reply | Спільні допоміжні засоби record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Парсинг цілей повідомлень | Допоміжні засоби парсингу/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби outbound media | Спільне завантаження outbound media |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей outbound send | Легковагий пошук `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound runtime | Допоміжні засоби outbound delivery, delegate ідентичності/send, session, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби thread-binding | Допоміжні засоби життєвого циклу thread-binding і адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Конструктор media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів send | Типи результатів reply |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env | Logger/runtime env, таймаут, retry та допоміжні засоби backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/hooks/http/interactive Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби pipeline хуків | Спільні допоміжні засоби pipeline Webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Допоміжні засоби клієнта Gateway і patch стану channel |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності config | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби перевірки команд Telegram зі стабільним fallback, коли поверхня контракту bundled Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби prompt approval | Payload схвалення exec/plugin, допоміжні засоби capability/profile approval, native approval routing/runtime і форматування шляху відображення structured approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth approval | Розв’язання approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approval | Допоміжні засоби profile/filter native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки approval | Адаптери capability/delivery native approval |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway approval | Спільний допоміжний засіб gateway-resolution approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера approval | Легковагі допоміжні засоби завантаження адаптера native approval для hot entrypoints channel |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника approval | Ширші допоміжні засоби runtime обробника approval; надавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей approval | Допоміжні засоби binding цілей/акаунтів native approval |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді approval | Допоміжні засоби payload відповіді схвалення exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context channel | Загальні допоміжні засоби register/get/watch runtime-context channel |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Допоміжні засоби pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності channel | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Безпечні допоміжні засоби шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Парсинг secret input | Допоміжні засоби secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Inbound dispatch, Heartbeat, планувальник reply, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch reply | Фіналізація, dispatch provider і допоміжні засоби міток conversation |
  | `plugin-sdk/reply-history` | Допоміжні засоби reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань reply | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk reply | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану channel | Конструктори підсумку стану channel/account, значення за замовчуванням runtime-state, допоміжні засоби метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розв’язання target | Спільні допоміжні засоби розв’язання target |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягання рядкових URL із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби timed command | Виконавець timed command із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягання payload інструмента | Витягання нормалізованих payload з об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягання send інструмента | Витягання канонічних полів цілі send з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби temp path | Спільні допоміжні засоби шляху тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби logging | Допоміжні засоби logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби markdown-table | Допоміжні засоби режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload reply |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted provider | Допоміжні засоби виявлення/config self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted provider, сумісного з OpenAI | Ті самі допоміжні засоби виявлення/config self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth provider runtime | Допоміжні засоби розв’язання API-ключа runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа provider | Допоміжні засоби onboarding/profile-write API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result provider | Стандартний конструктор auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу provider | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору provider | Вибір provider configured-or-auto і об’єднання raw config provider |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var provider | Допоміжні засоби пошуку env-var auth provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби model/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик replay, допоміжні засоби endpoint provider і допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding provider | Допоміжні засоби config onboarding |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP provider | Загальні допоміжні засоби HTTP/endpoint capability provider, зокрема допоміжні засоби multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch provider | Допоміжні засоби реєстрації/кешу provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби config web-search provider | Вузькі допоміжні засоби config/облікових даних web-search для providers, яким не потрібна логіка plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search provider | Вузькі допоміжні засоби контракту config/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search provider | Допоміжні засоби реєстрації/кешу/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби compat tool/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби compat xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби usage provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби usage provider |
  | `plugin-sdk/provider-stream` | Допоміжні засоби wrapper потоку provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи wrapper потоку та спільні допоміжні засоби wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту provider | Допоміжні засоби нативного транспорту provider, такі як guarded fetch, перетворення повідомлень транспорту та writable потоки подій транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби fetch/transform/store media, а також конструктори payload media |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації media | Спільні допоміжні засоби failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи provider для media understanding, а також експорти допоміжних засобів зображення/аудіо для providers |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text | Видалення видимого для асистента тексту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування, допоміжні засоби тегів директив, безпечні текстові утиліти та пов’язані допоміжні засоби text/logging |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking text | Допоміжний засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи speech provider, а також допоміжні засоби директив, реєстру, валідації для providers і конструктор TTS, сумісний з OpenAI |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи speech provider, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби realtime transcription | Типи provider, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби realtime voice | Типи provider, допоміжні засоби реєстру/розв’язання та допоміжні засоби bridge session |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи provider генерації зображень, а також допоміжні засоби image asset/data URL і конструктор provider зображень, сумісний з OpenAI |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні засоби failover, auth і реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи provider/request/result для генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук provider і парсинг model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи provider/request/result для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук provider і парсинг model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної reply | Нормалізація/редукція payload інтерактивної reply |
  | `plugin-sdk/channel-config-primitives` | Примітиви config channel | Вузькі примітиви config-schema channel |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби config-write channel | Допоміжні засоби авторизації config-write channel |
  | `plugin-sdk/channel-plugin-common` | Спільний прелюд channel | Спільні експорти прелюду Plugin channel |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану channel | Спільні допоміжні засоби snapshot/summary стану channel |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби config allowlist | Допоміжні засоби редагування/читання config allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби рішень group-access |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви passive-channel/status і ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення route |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляху Webhook | Допоміжні засоби нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Реекспорт zod | Реекспортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Допоміжні засоби bundled memory-core | Поверхня допоміжних засобів менеджера memory/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія memory | Фасад runtime індексування/пошуку memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine хоста memory | Експорти foundation engine хоста memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста memory | Контракти embedding memory, доступ до реєстру, локальний provider і загальні допоміжні засоби batch/remote; конкретні remote providers живуть у Plugins, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста memory | Експорти QMD engine хоста memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста memory | Експорти storage engine хоста memory |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста memory | Мультимодальні допоміжні засоби хоста memory |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста memory | Допоміжні засоби запитів хоста memory |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста memory | Допоміжні засоби секретів хоста memory |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста memory | Допоміжні засоби журналу подій хоста memory |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста memory | Допоміжні засоби стану хоста memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста memory | Допоміжні засоби CLI runtime хоста memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста memory | Допоміжні засоби core runtime хоста memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime хоста memory | Допоміжні засоби file/runtime хоста memory |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів core runtime хоста memory |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста memory |
  | `plugin-sdk/memory-host-files` | Псевдонім file/runtime хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів file/runtime хоста memory |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для Plugins, суміжних із memory |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім стану хоста memory | Нейтральний до постачальника псевдонім для допоміжних засобів стану хоста memory |
  | `plugin-sdk/memory-lancedb` | Допоміжні засоби bundled memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Застарілий широкий barrel сумісності; надавайте перевагу цільовим підшляхам тестування, таким як `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 entrypoints міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список і далі містить деякі seams допоміжних засобів bundled-plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й далі експортуються для
підтримки bundled-plugin і сумісності, але навмисно
не включені до таблиці поширеної міграції та не є рекомендованою ціллю для
нового коду Plugin.

Те саме правило застосовується до інших сімейств bundled-helper, таких як:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні bundled helper/plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку
поверхню допоміжних засобів токенів `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, що застосовуються в усьому Plugin SDK, контракті provider,
поверхні runtime та маніфесті. Кожне з них усе ще працює сьогодні, але буде вилучене
в одному з майбутніх мажорних релізів. Запис під кожним елементом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="Допоміжні засоби побудови довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортуються з вужчого subpath. `command-auth`
    реекспортує їх як compat stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох окремих викликів.

    Низхідні Plugins channel (Slack, Discord, Matrix, MS Teams) уже
    перейшли на нього.

  </Accordion>

  <Accordion title="Shim runtime channel і допоміжні засоби дій channel">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    Plugins channel. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів runtime.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із raw експортами channel "actions". Натомість надавайте можливості
    через семантичну поверхню `presentation` — Plugins channel
    оголошують, що вони рендерять (cards, buttons, selects), а не те,
    які raw назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний засіб tool() provider web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в Plugin provider.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації wrapper інструмента.

  </Accordion>

  <Accordion title="Текстові channel envelope без структури → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского текстового prompt
    envelope із вхідних повідомлень channel.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача. Plugins channel
    додають метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжний засіб
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих envelope,
    орієнтованих на асистента, але вхідні текстові envelope поступово
    виводяться з ужитку.

    Уражені області: `inbound_claim`, `message_received` і будь-який власний
    Plugin channel, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення provider → типи каталогу provider">
    Чотири псевдоніми типів discovery тепер є тонкими обгортками над
    типами епохи каталогу:

    | Старий псевдонім            | Новий тип                 |
    | --------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`    | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`  | `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult`   | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery`   | `ProviderPluginCatalog`   |

    Плюс застарілий статичний пакет `ProviderCapabilities` — Plugins provider
    мають додавати факти можливостей через контракт runtime provider,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Хуки політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені значення
    за рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати протягом
    періоду застарівання, але не поєднуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth provider → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення provider у маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "auth fallback" надсилає попередження під час виконання і буде вилучений.

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

    **Нове**: відобразіть той самий пошук env-var у `setup.providers[].envVars`
    у маніфесті. Це консолідує метадані env для setup/status в одному
    місці та дає змогу уникнути запуску runtime Plugin лише для відповіді на
    пошуки env-var.

    `providerAuthEnvVars` і надалі підтримується через адаптер сумісності
    до завершення періоду застарівання.

  </Accordion>

  <Accordion title="Реєстрація memory Plugin → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Адитивні допоміжні засоби memory
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачіпаються.

  </Accordion>

  <Accordion title="Перейменовано типи повідомлень сесії subagent">
    Два застарілі псевдоніми типів і далі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                        | Нове                           |
    | ---------------------------- | ------------------------------ |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає доступ до TaskFlow на основі DTO,
    який є import-safe і не потребує завантаження повного runtime завдань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Перенесіть Pi tool-result extensions на
    middleware". Додано тут для повноти: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, реекспортований із `openclaw/plugin-sdk`, тепер є
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
Застарівання на рівні extension (усередині bundled Plugins channel/provider у
`extensions/`) відстежуються у власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugins і тут не перелічені.
Якщо ви напряму споживаєте локальний barrel bundled Plugin, прочитайте
коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Часова шкала вилучення

| Коли                   | Що відбувається                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| **Зараз**              | Застарілі поверхні надсилають попередження під час виконання             |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; Plugins, які все ще їх використовують, завершаться помилкою |

Усі core Plugins уже мігровано. Зовнішні Plugins мають виконати міграцію
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
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Plugins Channel](/uk/plugins/sdk-channel-plugins) — створення Plugins channel
- [Plugins Provider](/uk/plugins/sdk-provider-plugins) — створення Plugins provider
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник зі схеми маніфесту
