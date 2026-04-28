---
read_when:
    - Ви бачите попередження `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ви бачите попередження `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-28T03:09:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 330ae4446c56e1a596e6c1b8e198a98bb03b616104efd1b25b4285c2700166c3
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin із цілеспрямованими, документованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві широко відкриті поверхні, які дозволяли Plugin імпортувати все, що їм було потрібно, з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб старіші Plugin на основі хуків продовжували працювати, поки розроблялася нова архітектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel допоміжних засобів runtime, який змішував системні події, стан Heartbeat, черги доставки, допоміжні засоби fetch/proxy, файлові допоміжні засоби, типи схвалення та не пов’язані між собою утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації, який під час вікна міграції все ще містить застарілі допоміжні засоби прямого load/write.
- **`openclaw/extension-api`** — міст, який надавав Plugin прямий доступ до допоміжних засобів на боці хоста, як-от вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений хук комплектного розширення лише для Pi, який міг спостерігати за подіями embedded-runner, такими як `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання, але нові Plugin не повинні їх використовувати, а наявні Plugin мають перейти до міграції до того, як їх буде вилучено в наступному мажорному випуску. API реєстрації фабрики вбудованого розширення лише для Pi вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає і не переосмислює документовану поведінку Plugin в тій самій зміні, яка запроваджує заміну. Зміни контракту, що ламають сумісність, спочатку мають пройти через адаптер сумісності, діагностику, документацію та вікно застарівання. Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки реєстрації runtime.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних випусків.
  Plugin, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрики вбудованого розширення лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Неочевидна поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які — внутрішніми

Сучасний Plugin SDK виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) є невеликим самодостатнім модулем із чітким призначенням і документованим контрактом.

Застарілі seams зручності provider для комплектних каналів також зникли.
Допоміжні seams із брендуванням каналу були приватними скороченнями mono-repo, а не стабільними контрактами Plugin. Натомість використовуйте вузькі узагальнені subpath SDK. Усередині робочого простору комплектного Plugin зберігайте допоміжні засоби, що належать provider, у власному `api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади комплектних provider:

- Anthropic зберігає допоміжні засоби потоку, специфічні для Claude, у власному seam `api.ts` / `contract-api.ts`
- OpenAI зберігає builder-и provider, допоміжні засоби моделей за замовчуванням і builder-и realtime provider у власному `api.ts`
- OpenRouter зберігає builder provider і допоміжні засоби onboarding/config у власному `api.ts`

## Політика сумісності

Для зовнішніх Plugin робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключену через адаптер сумісності
3. вивести діагностику або попередження, яке вказує старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати застарівання і шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному випуску

Якщо поле маніфесту все ще приймається, автори Plugin можуть і далі використовувати його, доки документація та діагностика не скажуть інакше. Новий код має надавати перевагу документованій заміні, але наявні Plugin не повинні ламатися під час звичайних мінорних випусків.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть допоміжні засоби load/write конфігурації runtime">
    Комплектні Plugin мають припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку
    вже було передано в активний шлях виклику. Довгоживучі обробники, яким
    потрібен поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агента мають використовувати `ctx.getRuntimeConfig()` із контексту інструмента в
    `execute`, щоб інструмент, створений до запису конфігурації, усе одно бачив
    оновлену конфігурацію runtime.

    Записи конфігурації мають проходити через транзакційні допоміжні засоби й
    обирати політику після запису:

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
    подальшими діями й навмисно хоче придушити планувальник перезавантаження.
    Результати мутації містять типізоване зведення `followUp` для тестів і логування;
    Gateway як і раніше відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються як застарілі допоміжні
    засоби сумісності для зовнішніх Plugin на час вікна міграції та один раз
    попереджають із кодом сумісності `runtime-config-load-write`. Комплектні Plugin і код
    runtime репозиторію захищені scanner guardrails у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання production Plugin
    одразу завершується помилкою, прямий запис конфігурації завершується помилкою, методи сервера Gateway мають використовувати
    знімок runtime запиту, допоміжні засоби send/action/client runtime-каналу
    мають отримувати конфігурацію зі своєї межі, а довгоживучі модулі runtime мають
    нуль дозволених ambient викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    barrel сумісності `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    subpath SDK, що відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Already-loaded перевірки конфігурації та пошук конфігурації запису Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного знімка runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиць Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Допоміжні засоби runtime політики груп | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Комплектні Plugin та їхні тести захищені scanner-обмеженнями від широкого
    barrel, щоб імпорти та mocks залишалися локальними щодо потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен від нього залежати.

  </Step>

  <Step title="Перенесіть розширення результатів інструментів Pi на middleware">
    Комплектні Plugin мають замінити обробники результатів інструментів лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` на
    middleware, нейтральне до runtime.

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

    Зовнішні Plugin не можуть реєструвати middleware результатів інструментів, тому що воно може
    переписувати результат інструмента з високим рівнем довіри до того, як модель його побачить.

  </Step>

  <Step title="Перенесіть approval-native обробники на факти capability">
    Plugin каналів із підтримкою approval тепер розкривають нативну поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний registry контексту runtime.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічну для approval auth/delivery із застарілої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного
      контракту channel-plugin; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків channel login/logout; approval auth
      hooks там більше не зчитуються core
    - Реєструйте об’єкти runtime, що належать каналу, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення reroute notice, що належать Plugin, із нативних approval-обробників;
      core тепер сам володіє повідомленнями routed-elsewhere notice на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` до `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Поточну структуру capability approval див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку wrappers Windows">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані wrappers Windows
    `.cmd`/`.bat` тепер завершуються в закритий спосіб, якщо ви явно не передасте
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
    `allowShellFallback` і натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму Plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на цілеспрямовані імпорти">
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
    сумісності, але новий код має імпортувати цілеспрямовану поверхню допоміжних засобів,
    яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги відкладеної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в пам’яті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні засоби шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | `fetch` з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби proxy і guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання approval | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні засоби payload відповіді approval і команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування в межах процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Комплектні Plugin захищені scanner-обмеженнями від `infra-runtime`, тому код репозиторію
    не може знову повернутися до широкого barrel.

  </Step>

  <Step title="Перенесіть допоміжні засоби маршрутів каналу">
    Новий код маршрутизації каналу має використовувати `openclaw/plugin-sdk/channel-route`.
    Старіші назви route-key і comparable-target залишаються як псевдоніми сумісності
    на час вікна міграції, але нові Plugin мають використовувати назви маршрутів,
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
    для нативних approval, придушення відповідей, дедуплікації вхідних повідомлень,
    доставки Cron і маршрутизації сесій. Якщо ваш Plugin використовує власну граматику
    цільових об’єктів, застосовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати
    цей parser до того самого контракту цільового маршруту.

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
  | `plugin-sdk/core` | Застарілий umbrella повторний експорт для визначень/builder-ів входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб входу для одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цілеспрямовані визначення і builder-и входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Підказки allowlist, builder-и статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту patch-адаптери налаштування, допоміжні засоби нотаток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку/конфігурації/action-gate облікових записів |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби lookup облікових записів | Допоміжні засоби lookup облікових записів + fallback до значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/account-action |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Прив’язка префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder-и схем конфігурації | Спільні примітиви схем конфігурації каналу і лише узагальнений builder |
  | `plugin-sdk/bundled-channel-config-schema` | Комплектні схеми конфігурації | Лише для комплектних Plugin, які підтримує OpenClaw; нові Plugin мають визначати локальні схеми Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі комплектні схеми конфігурації | Лише псевдонім сумісності; для підтримуваних комплектних Plugin використовуйте `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання опису, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політик груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби статусу облікових записів і життєвого циклу потоку чернеток | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернеток |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного envelope | Спільні допоміжні засоби builder-ів route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей outbound send | Полегшений lookup `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound runtime | Допоміжні засоби outbound delivery, identity/send delegate, session, formatting і планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби thread-binding | Життєвий цикл thread-binding і допоміжні засоби адаптера |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби payload медіа | Builder payload медіа агента для застарілих layouts полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів send | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/logging/backup/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Допоміжні засоби logger/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/хуків/http/interactive Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби pipeline хуків | Спільні допоміжні засоби pipeline Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесу | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Допоміжні засоби клієнта Gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Стабільні fallback-допоміжні засоби валідації команд Telegram, коли поверхня контракту комплектного Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби prompt approval | Payload виконання/Plugin approval, допоміжні засоби capability/profile approval, нативні допоміжні засоби routing/runtime approval і форматування шляху структурованого відображення approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth approval | Розв’язання approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approval | Допоміжні засоби profile/filter для нативного exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки approval | Адаптери capability/delivery нативного approval |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway approval | Спільний допоміжний засіб gateway-resolution approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера approval | Полегшені допоміжні засоби завантаження нативного адаптера approval для гарячих entrypoint-ів каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника approval | Ширші допоміжні засоби runtime обробника approval; надавайте перевагу вужчим seams адаптера/Gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей approval | Допоміжні засоби binding цілі/облікового запису нативного approval |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді approval | Допоміжні засоби payload відповіді exec/Plugin approval |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби контексту runtime каналу | Узагальнені допоміжні засоби register/get/watch для контексту runtime каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби runtime SSRF | Pinned-dispatcher, guarded fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій Heartbeat і видимості |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | Кеші дедуплікації в пам’яті |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Безпечні допоміжні засоби шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування командами і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби registry команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір secret input | Допоміжні засоби secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідний dispatch, Heartbeat, планувальник відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch відповідей | Фіналізація, dispatch provider і допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk відповіді | Допоміжні засоби chunking тексту/Markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Builder-и зведення статусу каналу/облікового запису, значення за замовчуванням стану runtime, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розв’язання цілей | Спільні допоміжні засоби розв’язання цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запитів | Витягання рядкових URL із входів, подібних до request |
  | `plugin-sdk/run-command` | Допоміжні засоби timed command | Виконавець timed command із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Поширені читачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягання payload інструмента | Витягання нормалізованих payload із об’єктів результатів інструмента |
  | `plugin-sdk/tool-send` | Витягання send інструмента | Витягання канонічних полів цілі send з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби logging | Допоміжні засоби logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби Markdown-table | Допоміжні засоби режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted provider | Допоміжні засоби виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Цілеспрямовані допоміжні засоби налаштування self-hosted provider, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth provider runtime | Допоміжні засоби розв’язання API-ключів runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключів provider | Допоміжні засоби onboarding/profile-write для API-ключів |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result provider | Стандартний builder auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу provider | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору provider | Вибір provider configured-or-auto і злиття сирої конфігурації provider |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var provider | Допоміжні засоби lookup env-var auth provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби model/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и replay-policy, допоміжні засоби endpoint provider і нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding provider | Допоміжні засоби конфігурації onboarding |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP provider | Узагальнені допоміжні засоби HTTP/можливостей endpoint provider, зокрема допоміжні засоби multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch provider | Допоміжні засоби реєстрації/кешу provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search provider | Вузькі допоміжні засоби конфігурації/облікових даних web-search для provider, яким не потрібна прив’язка enable Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search provider | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search provider | Допоміжні засоби реєстрації/кешу/runtime provider web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби compat інструментів/схем provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби compat xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання provider |
  | `plugin-sdk/provider-stream` | Допоміжні засоби wrapper потоку provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи wrapper-ів потоку і спільні допоміжні засоби wrapper-ів Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту provider | Нативні допоміжні засоби транспорту provider, такі як guarded fetch, перетворення повідомлень транспорту і доступні для запису потоки подій транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/зберігання медіа плюс builder-и payload медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи provider media understanding плюс експорти допоміжних засобів для роботи із зображенням/аудіо для provider |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого для асистента тексту, допоміжні засоби render/chunking/table для Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив, утиліти безпечного тексту та пов’язані допоміжні засоби тексту/logging |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжний засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи provider мовлення плюс допоміжні засоби директив, registry, валідації для provider і builder TTS, сумісний з OpenAI |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи provider мовлення, registry, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції realtime | Типи provider, допоміжні засоби registry і спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу realtime | Типи provider, допоміжні засоби registry/розв’язання і допоміжні засоби bridge session |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи provider генерації зображень плюс допоміжні засоби image asset/data URL і builder provider зображень, сумісний з OpenAI |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні засоби failover, auth і registry |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи provider/request/result для генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, lookup provider і розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи provider/request/result для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, lookup provider і розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних відповідей | Нормалізація/зведення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби config-write каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експорти преамбули channel Plugin |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу груп | Спільні допоміжні засоби ухвалення рішень group-access |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширень | Примітиви passive-channel/status і ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Registry цілей Webhook і допоміжні засоби встановлення route |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів Webhook | Допоміжні засоби нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для користувачів Plugin SDK |
  | `plugin-sdk/memory-core` | Комплектні допоміжні засоби memory-core | Поверхня допоміжних засобів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embeddings хоста пам’яті | Контракти embeddings пам’яті, доступ до registry, локальний provider і узагальнені batch/remote допоміжні засоби; конкретні remote provider живуть у своїх Plugin-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста пам’яті | Допоміжні засоби multimodal хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста пам’яті | Допоміжні засоби secret хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні засоби CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Допоміжні засоби core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті | Допоміжні засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Нейтральний до vendor псевдонім для допоміжних засобів core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний до vendor псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний до vendor псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого Markdown | Спільні допоміжні засоби керованого Markdown для суміжних із пам’яттю Plugin |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний до vendor псевдонім для допоміжних засобів статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Комплектні допоміжні засоби memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Застарілий широкий barrel сумісності; надавайте перевагу цілеспрямованим test subpath, таким як `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно охоплює поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 entrypoint-ів міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі seams допоміжних засобів комплектних Plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки комплектних Plugin і сумісності, але навмисно
опущені з таблиці поширеної міграції та не є рекомендованою ціллю для
нового коду Plugin.

Те саме правило застосовується і до інших сімейств комплектних допоміжних засобів, зокрема:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні комплектних допоміжних засобів/Plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню
допоміжних засобів токенів: `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в усьому Plugin SDK, контракті provider,
поверхні runtime і маніфесті. Кожен із них іще працює сьогодні, але буде вилучений
у майбутньому мажорному випуску. Запис під кожним елементом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="builder-и довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортуються з вужчого subpath. `command-auth`
    повторно експортує їх як compat stubs.

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

    Залежні Plugin каналів (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="shim channel runtime і допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    Plugin каналів. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами каналу типу "actions". Натомість розкривайте
    можливості через семантичну поверхню `presentation` — Plugin каналів
    декларують, що саме вони рендерять (картки, кнопки, selects), а не які сирі
    назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний засіб tool() для provider web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в Plugin provider.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації wrapper-а інструмента.

  </Accordion>

  <Accordion title="Текстові envelopes каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского текстового prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Plugin каналів додають метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжний засіб
    `formatAgentEnvelope(...)` іще підтримується для синтезованих envelopes,
    орієнтованих на асистента, але від вхідних текстових envelopes поступово відмовляються.

    Затронуті області: `inbound_claim`, `message_received` і будь-який власний
    Plugin каналу, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи discovery provider → типи каталогу provider">
    Чотири псевдоніми типів discovery тепер є тонкими обгортками над
    типами епохи catalog:

    | Старий псевдонім           | Новий тип                |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Плюс застарілий статичний набір `ProviderCapabilities` — Plugin provider
    мають приєднувати факти capability через контракт runtime provider,
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

    Реалізуйте один хук замість трьох. Застарілі хуки й надалі працюють під час
    вікна застарівання, але не композуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth provider → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення provider у маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
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

  <Accordion title="Lookup env-var provider → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий lookup env-var у `setup.providers[].envVars`
    у маніфесті. Це об’єднує метадані env налаштування/статусу в одному
    місці й дає змогу уникнути запуску runtime Plugin лише для відповіді на
    lookup env-var.

    `providerAuthEnvVars` і надалі підтримується через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація Plugin пам’яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик на API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, єдиний виклик реєстрації. Адитивні допоміжні засоби пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплено.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів іще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                        | Нове                           |
    | ---------------------------- | ------------------------------ |
    | `SubagentReadSessionParams`  | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`  | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав accessor live task-flow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає DTO-базований доступ до TaskFlow,
    який є безпечним для імпорту й не потребує завантаження повного runtime задач.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Перенесіть розширення результатів інструментів Pi на
    middleware". Для повноти тут також зазначено: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним
    списком runtime у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований з `openclaw/plugin-sdk`, тепер є
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
Застарівання на рівні extension (усередині комплектних Plugin каналів/provider у
`extensions/`) відстежуються у власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugin і тут не перелічені.
Якщо ви напряму використовуєте локальний barrel комплектного Plugin, перед
оновленням прочитайте коментарі про застарівання в цьому barrel.
</Note>

## Часова шкала вилучення

| Коли                  | Що відбувається                                                         |
| --------------------- | ----------------------------------------------------------------------- |
| **Зараз**             | Застарілі поверхні виводять попередження runtime                        |
| **Наступний мажорний випуск** | Застарілі поверхні буде вилучено; Plugin, які все ще їх використовують, завершаться помилкою |

Усі core Plugin уже мігровано. Зовнішнім Plugin слід виконати міграцію
до наступного мажорного випуску.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створення вашого першого Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Plugin каналів](/uk/plugins/sdk-channel-plugins) — створення Plugin каналів
- [Plugin provider](/uk/plugins/sdk-provider-plugins) — створення Plugin provider
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
