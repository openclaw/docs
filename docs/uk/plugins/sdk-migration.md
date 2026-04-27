---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте плагін до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній плагін OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть зі застарілого шару зворотної сумісності на сучасний SDK плагінів
title: Міграція SDK плагінів
x-i18n:
    generated_at: "2026-04-27T20:08:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19e2e5af310234544a3e1ae7a440554f9134f407c6bc896e58b134ed4376b2b3
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів зі сфокусованими, задокументованими імпортами. Якщо ваш плагін було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві дуже широкі поверхні, які дозволяли плагінам імпортувати все необхідне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки допоміжних функцій. Його було запроваджено, щоб старіші hook-орієнтовані плагіни продовжували працювати, поки будувалася нова архітектура плагінів.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel допоміжних функцій runtime, який поєднував системні події, стан Heartbeat, черги доставки, допоміжні функції fetch/proxy, файлові допоміжні функції, типи approvals і не пов’язані між собою утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації, який під час вікна міграції все ще містить застарілі прямі допоміжні функції load/write.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до helper-функцій на боці хоста, таких як вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений hook для вбудованих розширень лише для Pi, який міг спостерігати за подіями embedded runner, такими як `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час runtime, але нові плагіни не повинні їх використовувати, а наявним плагінам слід виконати міграцію до того, як наступний мажорний реліз їх вилучить. API реєстрації factory вбудованих розширень лише для Pi було вилучено; натомість використовуйте middleware для результатів інструментів.

OpenClaw не вилучає і не переосмислює задокументовану поведінку плагінів у тій самій зміні, яка вводить заміну. Зміни контракту, що ламають сумісність, спочатку мають проходити через адаптер сумісності, діагностику, документацію та вікно застарівання. Це стосується імпортів SDK, полів маніфесту, API setup, hooks і поведінки реєстрації runtime.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Плагіни, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації factory вбудованих розширень лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** — імпорт однієї helper-функції завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які exports були стабільними, а які внутрішніми

Сучасний SDK плагінів виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams провайдера для вбудованих каналів також прибрано.
Допоміжні seams із брендуванням каналу були приватними скороченнями mono-repo, а не стабільними контрактами плагінів. Натомість використовуйте вузькі загальні subpath SDK. Усередині workspace вбудованого плагіна зберігайте helper-функції, що належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього плагіна.

Приклади поточних вбудованих провайдерів:

- Anthropic зберігає helper-функції потоку, специфічні для Claude, у власному seam `api.ts` / `contract-api.ts`
- OpenAI зберігає builder-и провайдера, helper-функції моделі за замовчуванням і builder-и realtime-провайдера у власному `api.ts`
- OpenRouter зберігає builder провайдера та helper-функції онбордингу/конфігурації у власному `api.ts`

## Політика сумісності

Для зовнішніх плагінів робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключивши її через адаптер сумісності
3. вивести діагностику або попередження з указанням старого шляху та заміни
4. покрити тестами обидва шляхи
5. задокументувати застарівання та шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори плагінів можуть і надалі його використовувати, доки документація та діагностика не скажуть інакше. Новий код має надавати перевагу задокументованій заміні, але наявні плагіни не повинні ламатися під час звичайних мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть helper-функції load/write конфігурації runtime">
    Вбудовані плагіни мають припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Натомість віддавайте перевагу конфігурації, яку вже передано в активний шлях виклику. Довгоживучі обробники, яким потрібен поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі інструменти агента мають використовувати `ctx.getRuntimeConfig()` із контексту інструмента всередині `execute`, щоб інструмент, створений до запису конфігурації, усе одно бачив оновлену конфігурацію runtime.

    Запис конфігурації має відбуватися через транзакційні helper-функції з вибором політики після запису:

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
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач сам відповідає
    за наступні дії та свідомо хоче вимкнути планувальник перезавантаження.
    Результати мутацій містять типізований підсумок `followUp` для тестів і логування;
    Gateway як і раніше відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються як застарілі helper-функції сумісності
    для зовнішніх плагінів протягом вікна міграції та один раз показують попередження з
    кодом сумісності `runtime-config-load-write`. Вбудовані плагіни та код runtime репозиторію
    захищені scanner-обмеженнями у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання виробничими плагінами
    відразу завершується помилкою, прямі записи конфігурації завершуються помилкою, методи сервера gateway мають використовувати snapshot runtime запиту, helper-функції send/action/client каналу runtime мають отримувати конфігурацію зі своєї межі, а довгоживучі модулі runtime мають нульову допустиму кількість ambient-викликів `loadConfig()`.

    Новий код плагінів також має уникати імпорту широкого barrel сумісності
    `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький subpath SDK, який відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації запису плагіна | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного snapshot runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Helper-функції сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиць Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper-функції runtime для політики груп | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сесії | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані плагіни та їхні тести захищені scanner-перевірками від широкого
    barrel, тому імпорти й mocks залишаються локальними для потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен від нього залежати.

  </Step>

  <Step title="Перенесіть розширення результатів інструментів Pi на middleware">
    Вбудовані плагіни мають замінити обробники результатів інструментів лише для Pi через
    `api.registerEmbeddedExtensionFactory(...)` на runtime-нейтральне middleware.

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
    переписувати високодовірений вивід інструмента до того, як його побачить модель.

  </Step>

  <Step title="Перенесіть approval-native handlers на capability facts">
    Плагіни каналів із підтримкою approval тепер надають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-context.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі старої прив’язки `plugin.auth` /
      `plugin.approvals` до `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу в channel; approval
      hooks там більше не зчитуються ядром
    - Реєструйте об’єкти runtime, що належать каналу, такі як клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення reroute, що належать плагіну, із native approval handlers;
      тепер ядро саме відповідає за routed-elsewhere notices на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Поточну структуру capability approval див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш плагін використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    wrapper-и `.cmd`/`.bat` тепер завершуються із закритою відмовою, якщо ви явно не передасте
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
    Виконайте пошук у своєму плагіні імпортів із будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх сфокусованими імпортами">
    Кожен export зі старої поверхні відповідає певному сучасному шляху імпорту:

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

    Для helper-функцій на боці хоста використовуйте інжектований runtime плагіна замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших legacy helper-функцій bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper-функції сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` усе ще існує для зовнішньої
    сумісності, але новий код має імпортувати сфокусовану поверхню helper-функцій,
    яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Helper-функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper-функції подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Зливання черги відкладеної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні helper-функції шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper-функції proxy і guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання approval | `openclaw/plugin-sdk/approval-runtime` |
    | Payload відповіді approval і helper-функції команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper-функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper-функції безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування локального процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Вбудовані плагіни захищені scanner-перевірками від `infra-runtime`, тож код репозиторію
    не може повернутися до широкого barrel.

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
  | Import path | Призначення | Ключові exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний helper для входу плагіна | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-реекспорт для визначень/builders входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper для входу одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та builders входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helper-функції майстра налаштування | Підказки allowlist, builders статусу налаштування |
  | `plugin-sdk/setup-runtime` | Helper-функції runtime під час налаштування | Безпечні для імпорту setup patch adapters, helper-функції lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | Helper-функції setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper-функції інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper-функції для кількох облікових записів | Helper-функції списку/конфігурації/шлюзу дій облікових записів |
  | `plugin-sdk/account-id` | Helper-функції account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Helper-функції пошуку облікового запису | Helper-функції пошуку облікового запису + fallback до значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі helper-функції для облікових записів | Helper-функції списку облікових записів/дій облікових записів |
  | `plugin-sdk/channel-setup` | Adapters майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pairing для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Підключення префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory config adapter | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders схем конфігурації | Спільні примітиви схеми конфігурації каналу та лише загальний builder |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації вбудованих плагінів | Лише для сумісності вбудованих плагінів; нові плагіни мають визначати локальні схеми плагіна |
  | `plugin-sdk/telegram-command-config` | Helper-функції конфігурації команд Telegram | Нормалізація імен команд, обрізання опису, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper-функції статусу облікового запису та життєвого циклу draft stream | `createAccountStatusSink`, helper-функції завершення preview чернетки |
  | `plugin-sdk/inbound-envelope` | Helper-функції вхідного envelope | Спільні helper-функції маршрутизації + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper-функції вхідної відповіді | Спільні helper-функції запису та dispatch |
  | `plugin-sdk/messaging-targets` | Парсинг цілей повідомлень | Helper-функції парсингу/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Helper-функції вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Helper-функції залежностей outbound send | Полегшений пошук `resolveOutboundSendDep` без імпорту всього outbound runtime |
  | `plugin-sdk/outbound-runtime` | Helper-функції outbound runtime | Helper-функції outbound delivery, delegate identity/send, session, formatting і планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper-функції thread-binding | Helper-функції життєвого циклу та adapters thread-binding |
  | `plugin-sdk/agent-media-payload` | Застарілі helper-функції media payload | Builder media payload агента для застарілих layout полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результату send | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище плагіна | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helper-функції runtime | Helper-функції runtime/logging/backup/встановлення плагінів |
  | `plugin-sdk/runtime-env` | Вузькі helper-функції runtime env | Helper-функції logger/runtime env, timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helper-функції runtime плагіна | Helper-функції команд/hooks/http/interactive плагіна |
  | `plugin-sdk/hook-runtime` | Helper-функції pipeline hooks | Спільні helper-функції pipeline webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helper-функції lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper-функції процесу | Спільні helper-функції exec |
  | `plugin-sdk/cli-runtime` | Helper-функції CLI runtime | Форматування команд, очікування, helper-функції версій |
  | `plugin-sdk/gateway-runtime` | Helper-функції Gateway | Helper-функції клієнта Gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper-функції команд Telegram | Стабільні helper-функції перевірки команд Telegram із fallback, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helper-функції prompts approval | Payload approval exec/plugin, helper-функції capability/profile approval, helper-функції маршрутизації/runtime native approval і форматування шляху структурованого відображення approval |
  | `plugin-sdk/approval-auth-runtime` | Helper-функції auth approval | Розв’язання approver, auth дій у тому ж чаті |
  | `plugin-sdk/approval-client-runtime` | Helper-функції клієнта approval | Helper-функції profile/filter native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Helper-функції delivery approval | Adapters capability/delivery native approval |
  | `plugin-sdk/approval-gateway-runtime` | Helper-функції Gateway approval | Спільна helper-функція gateway-resolution approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper-функції adapters approval | Полегшені helper-функції завантаження adapter native approval для hot entrypoint каналів |
  | `plugin-sdk/approval-handler-runtime` | Helper-функції handlers approval | Ширші helper-функції runtime handlers approval; надавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helper-функції цілей approval | Helper-функції native approval target/account binding |
  | `plugin-sdk/approval-reply-runtime` | Helper-функції відповіді approval | Helper-функції payload відповіді approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper-функції runtime-context каналу | Загальні helper-функції register/get/watch для runtime-context каналу |
  | `plugin-sdk/security-runtime` | Helper-функції безпеки | Спільні helper-функції trust, DM gating, external-content і збирання секретів |
  | `plugin-sdk/ssrf-policy` | Helper-функції політики SSRF | Helper-функції allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Helper-функції SSRF runtime | Helper-функції pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/system-event-runtime` | Helper-функції системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper-функції Heartbeat | Helper-функції подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helper-функції черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper-функції активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper-функції дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Helper-функції доступу до файлів | Безпечні helper-функції шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Helper-функції готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helper-функції обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper-функції керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper-функції форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helper-функції графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті helper-функції fetch/proxy | `resolveFetch`, helper-функції proxy |
  | `plugin-sdk/host-runtime` | Helper-функції нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper-функції retry | `RetryConfig`, `retryAsync`, runners політики |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper-функції gating команд і поверхні команд | `resolveControlCommandGate`, helper-функції авторизації відправника, helper-функції реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Renderers статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Парсинг secret input | Helper-функції secret input |
  | `plugin-sdk/webhook-ingress` | Helper-функції запиту Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper-функції guards тіла запиту Webhook | Helper-функції читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Inbound dispatch, Heartbeat, planner відповіді, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-функції dispatch відповіді | Helper-функції finalize, dispatch провайдера та міток розмов |
  | `plugin-sdk/reply-history` | Helper-функції історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper-функції chunk відповіді | Helper-функції chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Helper-функції сховища сесій | Helper-функції шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Helper-функції шляхів стану | Helper-функції каталогів стану та OAuth |
  | `plugin-sdk/routing` | Helper-функції маршрутизації/ключів сесії | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper-функції нормалізації ключів сесії |
  | `plugin-sdk/status-helpers` | Helper-функції статусу каналу | Builders підсумку статусу каналу/облікового запису, значення за замовчуванням для runtime-state, helper-функції метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Helper-функції розв’язання цілей | Спільні helper-функції target resolver |
  | `plugin-sdk/string-normalization-runtime` | Helper-функції нормалізації рядків | Helper-функції нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helper-функції URL запиту | Витягування рядкових URL із request-подібних входів |
  | `plugin-sdk/run-command` | Helper-функції команд із таймером | Runner команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Readers параметрів | Загальні readers параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягування нормалізованих payload із об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування send інструмента | Витягування канонічних полів цілі send з аргументів інструмента |
  | `plugin-sdk/temp-path` | Helper-функції тимчасових шляхів | Спільні helper-функції шляхів для тимчасових завантажень |
  | `plugin-sdk/logging-core` | Helper-функції логування | Helper-функції logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Helper-функції таблиць Markdown | Helper-функції режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Добірні helper-функції налаштування локальних/self-hosted провайдерів | Helper-функції виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані helper-функції налаштування self-hosted провайдерів, сумісних з OpenAI | Ті самі helper-функції виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Helper-функції auth провайдера для runtime | Helper-функції розв’язання API-ключа під час runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper-функції налаштування API-ключа провайдера | Helper-функції онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Helper-функції auth-result провайдера | Стандартний builder auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helper-функції інтерактивного входу провайдера | Спільні helper-функції інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Helper-функції вибору провайдера | Вибір налаштованого або автоматичного провайдера та об’єднання сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Helper-функції env vars провайдера | Helper-функції пошуку env vars auth провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні helper-функції моделей/replay провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders політики replay, helper-функції endpoint провайдера та helper-функції нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні helper-функції каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Helper-функції конфігурації онбордингу |
  | `plugin-sdk/provider-http` | HTTP helper-функції провайдера | Загальні helper-функції HTTP/можливостей endpoint провайдера, включно з helper-функціями multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Helper-функції web-fetch провайдера | Helper-функції реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper-функції конфігурації web-search провайдера | Вузькі helper-функції конфігурації/облікових даних web-search для провайдерів, яким не потрібна прив’язка ввімкнення плагіна |
  | `plugin-sdk/provider-web-search-contract` | Helper-функції контракту web-search провайдера | Вузькі helper-функції контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Helper-функції web-search провайдера | Helper-функції реєстрації/кешу/runtime провайдера web-search |
  | `plugin-sdk/provider-tools` | Helper-функції сумісності tool/schema провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + diagnostics і helper-функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper-функції usage провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helper-функції usage провайдера |
  | `plugin-sdk/provider-stream` | Helper-функції wrappers потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи wrappers потоків і спільні helper-функції wrappers для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper-функції транспорту провайдера | Нативні helper-функції транспорту провайдера, такі як guarded fetch, перетворення транспортних повідомлень і writable event streams транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні helper-функції медіа | Helper-функції fetch/transform/store медіа та builders payload медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні helper-функції генерації медіа | Спільні helper-функції failover, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Helper-функції розуміння медіа | Типи провайдерів розуміння медіа та provider-facing exports helper-функцій зображень/аудіо |
  | `plugin-sdk/text-runtime` | Спільні text helper-функції | Видалення видимого для асистента тексту, helper-функції render/chunking/table для markdown, helper-функції редагування, helper-функції тегів директив, утиліти безпечного тексту та пов’язані helper-функції тексту/логування |
  | `plugin-sdk/text-chunking` | Helper-функції chunking тексту | Helper-функція chunking вихідного тексту |
  | `plugin-sdk/speech` | Helper-функції мовлення | Типи провайдерів мовлення та provider-facing helper-функції directives, registry і validation |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, registry, directives, нормалізація |
  | `plugin-sdk/realtime-transcription` | Helper-функції realtime-транскрибування | Типи провайдерів, helper-функції registry і спільна helper-функція сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Helper-функції realtime voice | Типи провайдерів, helper-функції registry/resolution і helper-функції bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, helper-функції failover, auth і registry |
  | `plugin-sdk/music-generation` | Helper-функції генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helper-функції failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/video-generation` | Helper-функції генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helper-функції failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/interactive-runtime` | Helper-функції інтерактивної відповіді | Нормалізація/зменшення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper-функції запису конфігурації каналу | Helper-функції авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Exports спільного prelude channel plugin |
  | `plugin-sdk/channel-status` | Helper-функції статусу каналу | Спільні helper-функції snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Helper-функції конфігурації allowlist | Helper-функції редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Helper-функції доступу до груп | Спільні helper-функції рішень group-access |
  | `plugin-sdk/direct-dm` | Helper-функції direct-DM | Спільні helper-функції auth/guard direct-DM |
  | `plugin-sdk/extension-shared` | Спільні helper-функції розширень | Примітиви passive-channel/status і ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Helper-функції цілей Webhook | Реєстр цілей Webhook і helper-функції встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Helper-функції шляху Webhook | Helper-функції нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні helper-функції web media | Helper-функції завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Реекспорт Zod | Повторно експортований `zod` для споживачів SDK плагінів |
  | `plugin-sdk/memory-core` | Вбудовані helper-функції memory-core | Поверхня helper-функцій менеджера memory, конфігурації, файлів і CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія memory | Фасад runtime індексу/пошуку memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста memory | Exports базового рушія хоста memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-рушій хоста memory | Контракти embedding memory, доступ до registry, локальний провайдер і загальні helper-функції batch/remote; конкретні remote-провайдери знаходяться у плагінах, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-рушій хоста memory | Exports QMD-рушія хоста memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста memory | Exports рушія сховища хоста memory |
  | `plugin-sdk/memory-core-host-multimodal` | Багатомодальні helper-функції хоста memory | Багатомодальні helper-функції хоста memory |
  | `plugin-sdk/memory-core-host-query` | Query helper-функції хоста memory | Query helper-функції хоста memory |
  | `plugin-sdk/memory-core-host-secret` | Secret helper-функції хоста memory | Secret helper-функції хоста memory |
  | `plugin-sdk/memory-core-host-events` | Helper-функції журналу подій хоста memory | Helper-функції журналу подій хоста memory |
  | `plugin-sdk/memory-core-host-status` | Helper-функції статусу хоста memory | Helper-функції статусу хоста memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста memory | CLI runtime helper-функції хоста memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Базовий runtime хоста memory | Базові runtime helper-функції хоста memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper-функції файлів/runtime хоста memory | Helper-функції файлів/runtime хоста memory |
  | `plugin-sdk/memory-host-core` | Псевдонім базового runtime хоста memory | Нейтральний до вендора псевдонім для базових runtime helper-функцій хоста memory |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста memory | Нейтральний до вендора псевдонім для helper-функцій журналу подій хоста memory |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста memory | Нейтральний до вендора псевдонім для helper-функцій файлів/runtime хоста memory |
  | `plugin-sdk/memory-host-markdown` | Helper-функції керованого markdown | Спільні helper-функції керованого markdown для плагінів, суміжних із memory |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Lazy runtime-фасад менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста memory | Нейтральний до вендора псевдонім для helper-функцій статусу хоста memory |
  | `plugin-sdk/memory-lancedb` | Вбудовані helper-функції memory-lancedb | Поверхня helper-функцій memory-lancedb |
  | `plugin-sdk/testing` | Тестові утиліти | Test helpers і mocks |
</Accordion>

Ця таблиця навмисно є поширеною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із понад 200 entrypoint-ів міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі seams helper-функцій вбудованих плагінів, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки та сумісності вбудованих плагінів, але навмисно
не включені до поширеної таблиці міграції й не є рекомендованою ціллю для
нового коду плагінів.

Те саме правило застосовується й до інших сімейств helper-функцій вбудованих плагінів, таких як:

- helper-функції підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper-функцій/плагінів, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню helper-функцій токена:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти export,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в усьому SDK плагінів, контракті провайдера,
поверхні runtime і маніфесті. Кожне з них іще працює сьогодні, але буде вилучене
в одному з майбутніх мажорних релізів. Запис під кожним елементом зіставляє старий API з його
канонічною заміною.

<AccordionGroup>
  <Accordion title="builders довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    exports — лише імпортовані з вужчого subpath. `command-auth`
    повторно експортує їх як compat stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper-функції gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох окремих викликів.

    Downstream channel-плагіни (Slack, Discord, Matrix, Microsoft Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim channel runtime і helper-функції дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    channel-плагінів. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів runtime.

    Helper-функції `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими exports каналу «actions». Натомість розкривайте
    можливості через семантичну поверхню `presentation` — channel-плагіни
    оголошують, що саме вони відображають (cards, buttons, selects), а не які сирі
    назви дій вони приймають.

  </Accordion>

  <Accordion title="Helper-функція tool() провайдера web search → createTool() у плагіні">
    **Старе**: factory `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в плагіні провайдера.
    OpenClaw більше не потребує helper-функції SDK для реєстрації wrapper-а інструмента.

  </Accordion>

  <Accordion title="Текстові channel envelope у відкритому вигляді → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для створення плоского текстового prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` разом зі структурованими блоками контексту користувача.
    Channel-плагіни прикріплюють метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Helper-функція
    `formatAgentEnvelope(...)` іще підтримується для синтезованих envelope,
    видимих асистенту, але вхідні текстові envelope у відкритому вигляді
    поступово виводяться з ужитку.

    Порушені ділянки: `inbound_claim`, `message_received` і будь-який власний
    channel-плагін, який виконував постобробку тексту `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдера → типи каталогу провайдера">
    Чотири псевдоніми типів виявлення тепер є тонкими wrappers над типами епохи
    каталогу:

    | Старий псевдонім           | Новий тип                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` — плагіни провайдера
    мають прикріплювати факти capability через контракт runtime провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Hooks політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковою `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені
    значення за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hooks продовжують працювати під час
    вікна застарівання, але не комбінуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті плагіна.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті плагіна
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    «auth fallback» показує попередження під час runtime і буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env vars провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env vars у `setup.providers[].envVars`
    у маніфесті. Це консолідує метадані env для setup/status в одному
    місці й дає змогу уникнути запуску runtime плагіна лише для відповіді на
    пошук env vars.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація плагіна memory → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові helper-функції memory
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) це не зачіпає.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (однина) повертав live accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (множина) повертає доступ до TaskFlow на основі DTO,
    який є безпечним для імпорту й не вимагає завантаження повного runtime завдань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factory вбудованих розширень → middleware результатів інструментів агента">
    Розглянуто вище в розділі «Як виконати міграцію → Перенесіть розширення результатів інструментів Pi на
    middleware». Додано тут для повноти: вилучений шлях лише для Pi
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
Застарівання на рівні розширень (усередині вбудованих channel/provider плагінів у
`extensions/`) відстежуються у їхніх власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх плагінів і тут не перелічені.
Якщо ви напряму використовуєте локальний barrel вбудованого плагіна, прочитайте
коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Хронологія вилучення

| Коли                   | Що відбувається                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні показують попередження під час runtime               |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; плагіни, які все ще їх використовують, перестануть працювати |

Усі core-плагіни вже мігровано. Зовнішнім плагінам слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове вимкнення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший плагін
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
- [Внутрішня будова плагінів](/uk/plugins/architecture) — глибокий огляд архітектури
- [Маніфест плагіна](/uk/plugins/manifest) — довідник схеми маніфесту
