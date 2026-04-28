---
read_when:
    - Ви бачите попередження `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ви бачите попередження `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть з застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-28T01:35:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12ae567cd2a450bf58a9418af21432dcf8df014b82b4d8c85b5793582e197c38
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із цільовими, документованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві надто широкі поверхні, які дозволяли плагінам імпортувати все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки допоміжних функцій. Його було запроваджено, щоб старіші hook-based плагіни продовжували працювати під час розробки нової архітектури плагінів.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel-файл допоміжних функцій рантайму, який змішував системні події, стан Heartbeat, черги доставки, допоміжні функції fetch/proxy, допоміжні файлові функції, типи approval та не пов’язані між собою утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel-файл сумісності для конфігурації, який під час перехідного періоду все ще містить застарілі прямі допоміжні функції load/write.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до хостових допоміжних функцій, таких як вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений hook реєстрації вбудованих розширень лише для Pi, який міг спостерігати події embedded-runner, такі як `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють у рантаймі, але нові плагіни не повинні їх використовувати, а наявні плагіни мають перейти на новий підхід до того, як у наступному мажорному релізі їх буде вилучено. API реєстрації фабрики вбудованих розширень лише для Pi було вилучено; замість нього використовуйте middleware для результатів інструментів.

OpenClaw не вилучає і не переосмислює документовану поведінку плагінів у тій самій зміні, де запроваджується заміна. Зміни контрактів, що ламають сумісність, спочатку мають проходити через адаптер сумісності, діагностику, документацію та період застарівання. Це стосується імпортів SDK, полів маніфесту, API налаштування, hook-ів і поведінки реєстрації в рантаймі.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Плагіни, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрик вбудованих розширень лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти полегшували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які — внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) є невеликим, самодостатнім модулем із чітким призначенням і документованим контрактом.

Застарілі зручні seams провайдерів для вбудованих каналів також прибрано.
Брендовані під канал helper-seams були приватними скороченнями монорепозиторію, а не стабільними контрактами плагінів. Використовуйте натомість вузькі універсальні підшляхи SDK. Усередині робочого простору вбудованого Plugin зберігайте helper-и, що належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього плагіна.

Поточні приклади вбудованих провайдерів:

- Anthropic зберігає helpers потоків, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI зберігає builders провайдерів, helpers моделей за замовчуванням і
  builders realtime-провайдерів у власному `api.ts`
- OpenRouter зберігає helper-и builder-а провайдера та onboarding/config у
  власному `api.ts`

## Політика сумісності

Для зовнішніх плагінів робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку через адаптер сумісності
3. вивести діагностику або попередження, яке вказує старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати застарівання та шлях міграції
6. вилучати лише після оголошеного періоду міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори плагінів можуть і далі його використовувати, доки документація й діагностика не скажуть інакше. Новий код має надавати перевагу документованій заміні, але наявні плагіни не повинні ламатися в межах звичайних мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть допоміжні функції load/write конфігурації рантайму">
    Вбудовані плагіни повинні припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації,
    яку вже було передано в активний шлях виклику. Довгоживучі обробники, яким
    потрібен поточний знімок процесу, можуть використовувати `api.runtime.config.current()`.
    Довгоживучі інструменти агента мають використовувати `ctx.getRuntimeConfig()` із
    контексту інструмента всередині `execute`, щоб інструмент, створений до запису
    конфігурації, все одно бачив оновлену конфігурацію рантайму.

    Запис конфігурації має виконуватися через транзакційні helper-и з вибором
    політики після запису:

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
    відповідає за подальші дії та свідомо хоче придушити planner перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    сам Gateway, як і раніше, відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються як застарілі helper-и сумісності
    для зовнішніх плагінів на час перехідного періоду та одноразово показують попередження
    з кодом сумісності `runtime-config-load-write`. Вбудовані плагіни та код
    рантайму репозиторію захищені guardrails сканера в
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання в production-плагінах
    одразу завершується помилкою, прямий запис конфігурації завершується помилкою,
    методи сервера Gateway мають використовувати знімок рантайму запиту,
    helpers runtime channel send/action/client мають отримувати конфігурацію зі
    свого boundary, а довгоживучі модулі рантайму мають нульову допустиму кількість
    ambient-викликів `loadConfig()`.

    Новий код плагінів також не повинен імпортувати широкий сумісний barrel
    `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький підшлях
    SDK, який відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації запису плагіна | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного знімка рантайму | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Запис конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Helpers сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиць Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpers рантайму групової політики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Визначення secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані плагіни та їхні тести захищені сканером від широкого
    barrel-файла, щоб імпорти та mocks залишалися локальними щодо потрібної їм поведінки. Широкий
    barrel-файл усе ще існує для зовнішньої сумісності, але новий код не повинен
    від нього залежати.

  </Step>

  <Step title="Перенесіть розширення результатів інструментів Pi на middleware">
    Вбудовані плагіни повинні замінити
    обробники результатів інструментів Pi-only
    `api.registerEmbeddedExtensionFactory(...)`
    на runtime-neutral middleware.

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

    Зовнішні плагіни не можуть реєструвати middleware для результатів інструментів, оскільки воно може
    переписувати високодовірений вивід інструмента до того, як модель його побачить.

  </Step>

  <Step title="Перенесіть approval-native обробники на capability facts">
    Плагіни каналів із підтримкою approval тепер відкривають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічні для approval auth/delivery зі старої зв’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного
      контракту channel-plugin; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout каналу; approval
      hooks там більше не зчитуються core
    - Реєструйте об’єкти рантайму, що належать каналу, такі як clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте reroute-повідомлення, що належать плагіну, з native approval handlers;
      тепер core відповідає за routed-elsewhere notices на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Поточне компонування approval capability дивіться в `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`,
    невизначені wrappers Windows `.cmd`/`.bat` тепер завершуються безпечним блокуванням,
    якщо ви явно не передасте `allowShellFallback: true`.

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
    `allowShellFallback` і натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму плагіні імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на цільові імпорти">
    Кожен експорт зі старої поверхні відповідає певному сучасному шляху імпорту:

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

    Для helper-ів на стороні хоста використовуйте інжектований runtime плагіна замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших helper-ів застарілого bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` усе ще існує для зовнішньої
    сумісності, але новий код має імпортувати цільову поверхню helper-ів, яка
    йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Helpers черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги відкладеної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні helpers шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers proxy та guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання approval | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers payload відповіді approval і команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування в межах процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Вбудовані плагіни захищені сканером від `infra-runtime`, тому код репозиторію
    не може знову повернутися до широкого barrel-файла.

  </Step>

  <Step title="Перенесіть helpers маршрутів каналу">
    Новий код маршрутів каналу має використовувати `openclaw/plugin-sdk/channel-route`.
    Старіші назви route-key і comparable-target залишаються як сумісні
    аліаси на час перехідного періоду, але нові плагіни мають використовувати
    назви маршрутів, які безпосередньо описують поведінку:

    | Старий helper | Сучасний helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні helpers маршрутів послідовно нормалізують `{ channel, to, accountId, threadId }`
    у native approvals, придушенні відповідей, дедуплікації вхідних повідомлень,
    доставці Cron і маршрутизації сесій. Якщо ваш Plugin має власну граматику
    target, використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб
    адаптувати цей parser до того самого контракту target маршруту.

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
  | `plugin-sdk/plugin-entry` | Канонічний helper точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella re-export для визначень/білдерів входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper точки входу одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та білдери входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helper-и майстра налаштування | Allowlist prompts, builders статусу налаштування |
  | `plugin-sdk/setup-runtime` | Helpers рантайму під час налаштування | Безпечні для імпорту adapters patch налаштування, helper-и lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | Helpers setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers для кількох облікових записів | Helper-и списку облікових записів/конфігурації/action-gate |
  | `plugin-sdk/account-id` | Helpers account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Helpers пошуку облікового запису | Helper-и пошуку облікового запису + fallback до значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі helper-и облікового запису | Helper-и списку облікових записів/account-action |
  | `plugin-sdk/channel-setup` | Adapters майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + wiring друку | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики adapter-ів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders схем конфігурації | Спільні примітиви схеми конфігурації каналу та лише універсальний builder |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише для вбудованих плагінів, які підтримує OpenClaw; нові плагіни мають визначати локальні для плагіна схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише alias сумісності; для підтримуваних вбудованих плагінів використовуйте `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Helpers конфігурації команд Telegram | Нормалізація імен команд, обрізання опису, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики Group/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers статусу облікового запису та життєвого циклу draft stream | `createAccountStatusSink`, helper-и фіналізації preview чернеток |
  | `plugin-sdk/inbound-envelope` | Helpers вхідного envelope | Спільні helper-и побудови route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers вхідних відповідей | Спільні helper-и record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Парсинг цілей повідомлень | Helper-и парсингу/зіставлення target |
  | `plugin-sdk/outbound-media` | Helpers вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Helpers залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту всього outbound runtime |
  | `plugin-sdk/outbound-runtime` | Helpers outbound runtime | Helper-и outbound-доставки, identity/send delegate, session, formatting і планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers thread-binding | Helper-и життєвого циклу thread-binding та adapter-ів |
  | `plugin-sdk/agent-media-payload` | Застарілі helper-и media payload | Builder media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий compatibility shim | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helpers рантайму | Helper-и runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Вузькі helper-и runtime env | Helper-и logger/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helper-и Plugin runtime | Helper-и команд/hooks/http/interactive плагіна |
  | `plugin-sdk/hook-runtime` | Helpers pipeline hook-ів | Спільні helper-и pipeline webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helpers lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers процесу | Спільні helper-и exec |
  | `plugin-sdk/cli-runtime` | Helpers CLI runtime | Форматування команд, очікування, helper-и версій |
  | `plugin-sdk/gateway-runtime` | Helpers Gateway | Helper-и клієнта Gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Застарілий compatibility shim конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helpers команд Telegram | Helpers валідації команд Telegram зі стабільним fallback, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helpers prompt approval | Payload approval exec/plugin, helper-и capability/profile approval, helper-и native approval routing/runtime і форматування шляху відображення structured approval |
  | `plugin-sdk/approval-auth-runtime` | Helpers auth approval | Розв’язання approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Helpers клієнта approval | Helper-и profile/filter native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Helpers доставки approval | Adapters native approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Helpers Gateway approval | Спільний helper розв’язання approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers approval adapter | Легкі helper-и завантаження native approval adapter для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Helpers обробника approval | Ширші helper-и runtime обробника approval; надавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helpers target approval | Helper-и прив’язки target/account native approval |
  | `plugin-sdk/approval-reply-runtime` | Helpers відповіді approval | Helper-и payload відповіді approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers channel runtime-context | Універсальні helper-и register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Helpers безпеки | Спільні helper-и trust, DM gating, external-content і secret-collection |
  | `plugin-sdk/ssrf-policy` | Helpers політики SSRF | Helper-и allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Helpers SSRF runtime | Helper-и pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/system-event-runtime` | Helpers системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helpers Heartbeat | Helpers подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helpers черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helpers активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helpers дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Helpers доступу до файлів | Безпечні helper-и шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Helpers готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helpers обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helper-и графа помилок |
  | `plugin-sdk/fetch-runtime` | Helpers обгорнутого fetch/proxy | `resolveFetch`, helper-и proxy |
  | `plugin-sdk/host-runtime` | Helpers нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers retry | `RetryConfig`, `retryAsync`, runners політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Мапінг вводу allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування командами та helper-и поверхні команд | `resolveControlCommandGate`, helper-и авторизації відправника, helper-и реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Парсинг secret input | Helper-и secret input |
  | `plugin-sdk/webhook-ingress` | Helpers запитів Webhook | Утиліти target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers guard для тіла запиту Webhook | Helper-и читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Inbound dispatch, Heartbeat, planner відповіді, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-и dispatch відповіді | Фіналізація, dispatch провайдера та helper-и міток conversation |
  | `plugin-sdk/reply-history` | Helpers історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers chunk відповіді | Helper-и chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers сховища сесій | Helper-и шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Helpers шляхів стану | Helper-и каталогів стану та OAuth |
  | `plugin-sdk/routing` | Helpers routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper-и нормалізації session-key |
  | `plugin-sdk/status-helpers` | Helpers статусу каналу | Builders підсумку статусу каналу/облікового запису, значення за замовчуванням стану рантайму, helper-и метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers resolver-а target | Спільні helper-и resolver-а target |
  | `plugin-sdk/string-normalization-runtime` | Helpers нормалізації рядків | Helper-и нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helpers URL запиту | Витягування рядкових URL із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Helpers команд із тайм-аутом | Runner команд із тайм-аутом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Readers параметрів | Загальні readers параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягування нормалізованих payload із об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Helpers тимчасових шляхів | Спільні helper-и шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Helpers логування | Логер підсистеми та helper-и редагування |
  | `plugin-sdk/markdown-table-runtime` | Helpers таблиць Markdown | Helpers режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські helper-и налаштування локального/self-hosted провайдера | Helper-и виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові helper-и налаштування self-hosted провайдера, сумісного з OpenAI | Ті самі helper-и виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/provider-auth-runtime` | Helpers auth рантайму провайдера | Helpers визначення API-ключа в рантаймі |
  | `plugin-sdk/provider-auth-api-key` | Helpers налаштування API-ключа провайдера | Helper-и onboarding/profile-write для API-ключа |
  | `plugin-sdk/provider-auth-result` | Helpers auth-result провайдера | Стандартний builder auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers інтерактивного входу провайдера | Спільні helper-и інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Helpers вибору провайдера | Вибір провайдера configured-or-auto та злиття сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Helpers env-var провайдера | Helpers пошуку auth env-var провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні helper-и model/replay провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders replay-policy, helper-и endpoint провайдера та helper-и нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні helper-и каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding провайдера | Helpers конфігурації onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP провайдера | Універсальні helper-и HTTP/endpoint capability провайдера, включно з helper-ами multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch провайдера | Helper-и реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers конфігурації web-search провайдера | Вузькі helper-и конфігурації/облікових даних web-search для провайдерів, яким не потрібна зв’язка enable plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers контракту web-search провайдера | Вузькі helper-и контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter-и облікових даних |
  | `plugin-sdk/provider-web-search` | Helpers web-search провайдера | Helper-и реєстрації/кешу/runtime провайдера web-search |
  | `plugin-sdk/provider-tools` | Helpers сумісності tool/schema провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також helper-и сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers usage провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helper-и usage провайдера |
  | `plugin-sdk/provider-stream` | Helpers обгортки stream провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні helper-и wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers транспорту провайдера | Нативні helper-и транспорту провайдера, такі як guarded fetch, перетворення transport message і writable потоки подій транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні helpers медіа | Helper-и fetch/transform/store медіа, а також builders media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні helper-и генерації медіа | Спільні helper-и failover, вибору candidate та повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Helpers media-understanding | Типи провайдера media understanding, а також exports helper-ів для зображень/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Спільні текстові helper-и | Видалення тексту, видимого асистенту, helper-и render/chunking/table Markdown, helper-и редагування, helper-и тегів директив, утиліти safe-text і пов’язані helper-и text/logging |
  | `plugin-sdk/text-chunking` | Helpers text chunking | Helper chunking вихідного тексту |
  | `plugin-sdk/speech` | Helpers мовлення | Типи speech-провайдера, а також helper-и директив, реєстру й валідації для провайдерів |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи speech-провайдера, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Helpers транскрипції в реальному часі | Типи провайдера, helper-и реєстру та спільний helper WebSocket session |
  | `plugin-sdk/realtime-voice` | Helpers голосу в реальному часі | Типи провайдера, helper-и реєстру/визначення та helper-и bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, helper-и failover, auth і реєстру |
  | `plugin-sdk/music-generation` | Helpers генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helper-и failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/video-generation` | Helpers генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helper-и failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers інтерактивної відповіді | Нормалізація/зведення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpers запису конфігурації каналу | Helpers авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Exports спільного prelude channel plugin |
  | `plugin-sdk/channel-status` | Helpers статусу каналу | Спільні helper-и snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Helpers конфігурації allowlist | Helper-и edit/read конфігурації allowlist |
  | `plugin-sdk/group-access` | Helpers доступу до груп | Спільні helper-и рішень group-access |
  | `plugin-sdk/direct-dm` | Helpers Direct-DM | Спільні helper-и auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні helper-и extension | Примітиви helper-ів passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpers target Webhook | Реєстр target Webhook і helper-и встановлення route |
  | `plugin-sdk/webhook-path` | Helpers шляху Webhook | Helper-и нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні helper-и web media | Helper-и завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Re-export Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані helper-и memory-core | Поверхня helper-ів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine хоста пам’яті | Exports foundation engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і універсальні helper-и batch/remote; конкретні віддалені провайдери живуть у плагінах-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста пам’яті | Exports QMD engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста пам’яті | Exports storage engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helper-и хоста пам’яті | Мультимодальні helper-и хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Helpers запитів хоста пам’яті | Helpers запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Helpers secret хоста пам’яті | Helpers secret хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Helpers журналу подій хоста пам’яті | Helpers журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Helpers статусу хоста пам’яті | Helpers статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Helpers CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Helpers core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers file/runtime хоста пам’яті | Helpers file/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Аліас core runtime хоста пам’яті | Нейтральний щодо постачальника alias для helper-ів core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Аліас журналу подій хоста пам’яті | Нейтральний щодо постачальника alias для helper-ів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Аліас file/runtime хоста пам’яті | Нейтральний щодо постачальника alias для helper-ів file/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Helpers керованого markdown | Спільні helper-и керованого markdown для плагінів, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий runtime-фасад search-manager Active Memory |
  | `plugin-sdk/memory-host-status` | Аліас статусу хоста пам’яті | Нейтральний щодо постачальника alias для helper-ів статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Вбудовані helper-и memory-lancedb | Поверхня helper-ів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Застарілий широкий barrel сумісності; надавайте перевагу цільовим підшляхам тестування, таким як `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є поширеною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі helper-seams для вбудованих плагінів, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки вбудованих плагінів і сумісності, але навмисно не включені до
поширеної таблиці міграції та не є рекомендованою ціллю для нового коду
плагінів.

Те саме правило застосовується до інших сімейств вбудованих helper-ів, таких як:

- helper-и підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper-ів/плагінів, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню helper-ів токена
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, що відповідає завданню. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, що застосовуються в межах Plugin SDK, контракту провайдера,
поверхні рантайму та маніфесту. Кожне з них іще працює сьогодні, але буде вилучене
в одному з майбутніх мажорних релізів. Запис під кожним пунктом зіставляє старий API
з його канонічною заміною.

<AccordionGroup>
  <Accordion title="builders довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого підшляху. `command-auth`
    повторно експортує їх як compatibility stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helpers керування згадками → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох розділених викликів.

    Downstream channel plugins (Slack, Discord, Matrix, Microsoft Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim channel runtime і helpers channel actions">
    `openclaw/plugin-sdk/channel-runtime` — це compatibility shim для старіших
    channel plugins. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    рантайму.

    Helpers `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами каналу "actions". Натомість відкривайте
    можливості через семантичну поверхню `presentation` — channel plugins
    оголошують, що саме вони рендерять (cards, buttons, selects), а не які сирі
    назви actions вони приймають.

  </Accordion>

  <Accordion title="Helper tool() провайдера web search → createTool() у плагіні">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в plugin провайдера.
    OpenClaw більше не потребує helper-а SDK для реєстрації обгортки tool.

  </Accordion>

  <Accordion title="Текстові plaintext envelopes каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского plaintext prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки user-context. Channel
    plugins додають метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Helper
    `formatAgentEnvelope(...)` і далі підтримується для синтезованих
    assistant-facing envelopes, але plaintext envelopes для вхідних повідомлень поступово
    вилучаються.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який custom
    channel plugin, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдера → типи каталогу провайдерів">
    Чотири alias-и типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий alias               | Новий тип                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний пакет `ProviderCapabilities` — provider plugins
    мають прикріплювати capability facts через контракт runtime провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Hooks політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі hook-и в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує рівень застарілих
    збережених значень за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hook-и продовжують працювати
    протягом періоду застарівання, але не композуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "auth fallback" виводить попередження в рантаймі і буде вилучений.

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
    у маніфесті. Це об’єднує метадані env для setup/status в одному
    місці й дає змогу не запускати runtime плагіна лише для відповіді на
    пошук env-var.

    `providerAuthEnvVars` і далі підтримується через адаптер сумісності
    до завершення періоду застарівання.

  </Accordion>

  <Accordion title="Реєстрація плагіна пам’яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у API state пам’яті —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові helper-и пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплено.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі alias-и типів і далі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод рантайму `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод делегує виклик
    новому.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (однина) повертав accessor живого task-flow.

    **Нове**: `runtime.tasks.flows` (множина) повертає доступ до TaskFlow на основі DTO,
    який є безпечним для імпорту та не потребує завантаження повного runtime завдань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в "Як виконати міграцію → Перенесіть розширення результатів інструментів Pi на
    middleware". Тут наведено для повноти: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime у
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований із `openclaw/plugin-sdk`, тепер є
    однорядковим alias для `OpenClawConfig`. Надавайте перевагу канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні extension (усередині вбудованих channel/provider plugins у
`extensions/`) відстежуються у їхніх власних barrel-файлах `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх плагінів і тут не перелічені.
Якщо ви безпосередньо використовуєте локальний barrel вбудованого плагіна,
перед оновленням прочитайте коментарі про застарівання в цьому barrel-файлі.
</Note>

## Часова шкала вилучення

| Коли                   | Що відбувається                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять попередження в рантаймі                     |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; плагіни, які все ще їх використовують, перестануть працювати |

Усі core plugins уже мігровано. Зовнішні плагіни мають виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний механізм, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
