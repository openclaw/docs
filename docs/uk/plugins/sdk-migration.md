---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте плагін до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний SDK Plugin
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:04:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів
із цільовими, задокументованими імпортами. Якщо ваш плагін було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широко відкриті поверхні, які дозволяли плагінам імпортувати
все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** - єдиний імпорт, який повторно експортував десятки
  допоміжних функцій. Його було запроваджено, щоб старі плагіни на основі хуків працювали, поки
  будувалася нова архітектура плагінів.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий barrel runtime-допоміжних функцій, який
  змішував системні події, стан Heartbeat, черги доставки, допоміжні функції fetch/proxy,
  файлові допоміжні функції, типи схвалення та непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** - широкий barrel сумісності конфігурації,
  який досі містить застарілі прямі допоміжні функції load/write протягом вікна міграції.
- **`openclaw/extension-api`** - міст, який надавав плагінам прямий доступ до
  host-side допоміжних функцій, як-от вбудований агентний runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - вилучений bundled
  хук розширення лише для embedded-runner, який міг спостерігати події embedded-runner, як-от
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони досі працюють у runtime,
але нові плагіни не повинні їх використовувати, а наявні плагіни мають мігрувати до того,
як наступний major-реліз їх вилучить. API реєстрації фабрики розширень лише для embedded-runner
було вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає й не переінтерпретовує задокументовану поведінку плагінів у тій самій
зміні, яка вводить заміну. Ламальні зміни контракту спочатку мають пройти через
адаптер сумісності, діагностику, документацію та вікно знецінення.
Це стосується імпортів SDK, полів маніфесту, setup API, хуків і поведінки
runtime-реєстрації.

<Warning>
  Шар зворотної сумісності буде вилучено в майбутньому major-релізі.
  Плагіни, які досі імпортують із цих поверхонь, зламаються, коли це станеться.
  Застарілі реєстрації фабрик вбудованих розширень уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** - імпорт однієї допоміжної функції завантажував десятки непов’язаних модулів
- **Циклічні залежності** - широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** - не було способу зрозуміти, які експорти стабільні, а які внутрішні

Сучасний SDK плагінів виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні provider seams для bundled каналів також вилучено.
Channel-branded допоміжні seams були приватними скороченнями mono-repo, а не стабільними
контрактами плагінів. Натомість використовуйте вузькі generic SDK subpaths. Усередині bundled
робочого простору плагіна тримайте provider-owned допоміжні функції у власному `api.ts` або
`runtime-api.ts` цього плагіна.

Поточні bundled приклади провайдерів:

- Anthropic тримає Claude-specific допоміжні функції stream у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI тримає builders провайдера, допоміжні функції default-model і realtime provider
  builders у власному `api.ts`
- OpenRouter тримає provider builder і допоміжні функції onboarding/config у власному
  `api.ts`

## План міграції Talk і realtime voice

Код realtime voice, telephony, meeting і browser Talk переходить від
surface-local обліку turn до спільного контролера Talk-сесій, експортованого з
`openclaw/plugin-sdk/realtime-voice`. Новий контролер володіє спільною
обгорткою подій Talk, станом активного turn, станом capture, станом output-audio, недавньою
історією подій і відхиленням stale-turn. Плагіни провайдерів мають і далі володіти
vendor-specific realtime сесіями; surface-плагіни мають і далі володіти особливостями capture,
playback, telephony і meeting.

Ця міграція Talk навмисно є breaking-clean:

1. Тримайте спільні controller/runtime primitives у
   `plugin-sdk/realtime-voice`.
2. Перенесіть bundled surfaces на спільний контролер: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime і native push-to-talk.
3. Замініть старі сімейства Talk RPC на фінальні API `talk.session.*` і
   `talk.client.*`.
4. Оголосіть один live канал подій Talk у Gateway
   `hello-ok.features.events`: `talk.event`.
5. Видаліть старий realtime HTTP endpoint і будь-який шлях request-time instruction
   override.

Новий код не повинен викликати `createTalkEventSequencer(...)` напряму, якщо він не
реалізує низькорівневий adapter або test fixture. Надавайте перевагу спільному контролеру,
щоб події в межах turn не могли емітитися без turn id, stale виклики `turnEnd` /
`turnCancel` не могли очистити новіший активний turn, а події життєвого циклу output-audio
лишалися узгодженими між telephony, meetings, browser relay, managed-room
handoff і native Talk clients.

Цільова форма публічного API:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Browser-owned WebRTC/provider-websocket сесії використовують `talk.client.create`,
бо браузер володіє provider negotiation і media transport, тоді як
Gateway володіє credentials, instructions і tool policy. `talk.session.*` є
спільною Gateway-managed поверхнею для gateway-relay realtime, gateway-relay
transcription і managed-room native STT/TTS сесій.

Застарілі конфіги, які розміщували realtime selectors поруч із `talk.provider` /
`talk.providers`, слід виправити за допомогою `openclaw doctor --fix`; runtime Talk
не переінтерпретовує конфігурацію speech/TTS provider як конфігурацію realtime provider.

Підтримувані комбінації `talk.session.create` навмисно невеликі:

| Режим           | Transport       | Brain           | Власник            | Примітки                                                                                                          |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider audio, з’єднаний через Gateway; виклики інструментів маршрутизуються через agent-consult tool. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Лише streaming STT; викликачі надсилають input audio й отримують transcript events.                               |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Кімнати в стилі push-to-talk і walkie-talkie, де клієнт володіє capture/playback, а Gateway володіє turn state.   |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only режим кімнати для довірених first-party surfaces, які виконують Gateway tool actions напряму.          |

Мапа вилучених методів:

| Старий                           | Новий                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Уніфікований словник керування також навмисно вузький:

  | Метод                           | Застосовується до                                      | Контракт                                                                                                                                                                                             |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Додати фрагмент аудіо PCM у base64 до сесії провайдера, що належить тому самому з'єднанню Gateway.                                                                                                  |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Почати хід користувача в керованій кімнаті.                                                                                                                                                         |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершити активний хід після перевірки застарілого ходу.                                                                                                                                            |
  | `talk.session.cancelTurn`       | усі сесії, якими володіє Gateway                        | Скасувати активну роботу захоплення/провайдера/агента/TTS для ходу.                                                                                                                                 |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Зупинити аудіовихід асистента без обов'язкового завершення ходу користувача.                                                                                                                        |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершити виклик інструмента провайдера, виданий relay; передайте `options.willContinue` для проміжного виводу або `options.suppressResponse`, щоб задовольнити виклик без іншої відповіді асистента. |
  | `talk.session.steer`            | сесії Talk з підтримкою агента                          | Надіслати усне керування `status`, `steer`, `cancel` або `followup` до активного вбудованого запуску, визначеного із сесії Talk.                                                                     |
  | `talk.session.close`            | усі уніфіковані сесії                                   | Зупинити relay-сесії або відкликати стан керованої кімнати, а потім забути ідентифікатор уніфікованої сесії.                                                                                        |

  Не додавайте в core особливі випадки для провайдерів або платформ, щоб це запрацювало.
  Core володіє семантикою сесій Talk. Plugin провайдерів володіють налаштуванням сесій постачальників.
  Voice-call і Google Meet володіють адаптерами телефонії/зустрічей. Браузерні та нативні
  застосунки володіють UX захоплення/відтворення пристрою.

  ## Політика сумісності

  Для зовнішніх plugins робота із сумісністю відбувається в такому порядку:

  1. додати новий контракт
  2. залишити стару поведінку підключеною через адаптер сумісності
  3. вивести діагностику або попередження, що називає старий шлях і заміну
  4. покрити обидва шляхи тестами
  5. задокументувати застарівання та шлях міграції
  6. видаляти лише після оголошеного вікна міграції, зазвичай у major-релізі

  Мейнтейнери можуть перевірити поточну чергу міграції за допомогою
  `pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
  компактних підрахунків, `--owner <id>` для одного Plugin або власника сумісності, і
  `pnpm plugins:boundary-report:ci`, коли CI-гейт має падати через прострочені
  записи сумісності, зарезервовані імпорти SDK між власниками або невикористані зарезервовані
  підшляхи SDK. Звіт групує застарілі
  записи сумісності за датою видалення, підраховує локальні посилання в коді/документації,
  показує зарезервовані імпорти SDK між власниками та підсумовує приватний
  міст SDK memory-host, щоб очищення сумісності залишалося явним, а не
  покладалося на ситуативні пошуки. Зарезервовані підшляхи SDK мають мати відстежене використання власником;
  невикористані зарезервовані експорти helper слід видалити з публічного SDK.

  Якщо поле маніфесту все ще приймається, автори plugins можуть продовжувати його використовувати, доки
  документація й діагностика не скажуть протилежне. Новий код має віддавати перевагу задокументованій
  заміні, але наявні plugins не мають ламатися під час звичайних minor-
  релізів.

  ## Як мігрувати

  <Steps>
  <Step title="Перенесіть helper для завантаження/запису конфігурації runtime">
    Вбудовані plugins мають припинити напряму викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Віддавайте перевагу конфігурації, яку
    вже було передано в активний шлях виклику. Довгоживучі handlers, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агента мають використовувати `ctx.getRuntimeConfig()` з контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, все ще бачив оновлену
    конфігурацію runtime.

    Записи конфігурації мають проходити через транзакційні helper і вибирати
    політику після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли викликач знає,
    що зміна потребує чистого перезапуску gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач володіє
    подальшою дією та свідомо хоче придушити planner перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими helper сумісності
    для зовнішніх plugins протягом вікна міграції та один раз попереджають із
    кодом сумісності `runtime-config-load-write`. Вбудовані plugins і код runtime
    репозиторію захищені scanner guardrails у
    `pnpm check:deprecated-api-usage` і
    `pnpm check:no-runtime-action-load-config`: нове використання у production plugin
    одразу завершується помилкою, прямі записи конфігурації завершуються помилкою, методи сервера gateway мають використовувати
    знімок runtime запиту, runtime helper для надсилання/дії/клієнта каналу
    мають отримувати конфігурацію зі своєї межі, а довгоживучі модулі runtime мають
    нуль дозволених ambient-викликів `loadConfig()`.

    Новий код plugin також має уникати імпорту широкого
    compatibility barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, що відповідає задачі:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Твердження щодо вже завантаженої конфігурації та пошук конфігурації входу plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного знімка runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Helper сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиць Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime helper політики груп | `openclaw/plugin-sdk/runtime-group-policy` |
    | Визначення введення секретів | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сесії | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані plugins та їхні тести захищені scanner-guard від широкого
    barrel, щоб імпорти й mocks залишалися локальними до потрібної їм поведінки. Широкий
    barrel досі існує для зовнішньої сумісності, але новий код не має
    залежати від нього.

  </Step>

  <Step title="Перенесіть вбудовані розширення результатів інструментів до middleware">
    Вбудовані plugins мають замінити handlers результатів інструментів лише для embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` на
    runtime-нейтральне middleware.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Одночасно оновіть маніфест plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Встановлені plugins також можуть реєструвати middleware результатів інструментів, коли вони
    явно ввімкнені та оголошують кожен цільовий runtime у
    `contracts.agentToolResultMiddleware`. Неоголошені реєстрації встановленого middleware
    відхиляються.

  </Step>

  <Step title="Перенесіть approval-native handlers до capability facts">
    Plugins каналів із підтримкою approval тепер надають нативну поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний реєстр runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі старого підключення `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` було видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render на `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout каналу; core більше не читає
      approval auth hooks звідти
    - Реєструйте runtime-об'єкти, якими володіє канал, як-от клієнти, токени або застосунки Bolt,
      через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте reroute-повідомлення, якими володіє plugin, з native approval handlers;
      core тепер володіє повідомленнями про маршрутизацію в інше місце з фактичних результатів доставки
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` щодо поточного layout approval capability.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows wrapper">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв'язані Windows
    `.cmd`/`.bat` wrappers тепер fail closed, якщо ви явно не передасте
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
    `allowShellFallback` і натомість обробіть викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Пошукайте у своєму plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на сфокусовані імпорти">
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

    Для host-side helper використовуйте інжектований runtime plugin замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших застарілих допоміжних bridge-функцій:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні функції сховища сеансів | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` усе ще існує для сумісності із зовнішніми
    інтеграціями, але новий код має імпортувати сфокусовану поверхню допоміжних
    функцій, яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні функції пробудження, подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в пам’яті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Допоміжні функції безпечних локальних файлових/медійних шляхів | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні функції proxy та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політик диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання схвалення | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні функції payload відповіді схвалення та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні функції безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальне для процесу асинхронне блокування | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові блокування | `openclaw/plugin-sdk/file-lock` |

    Вбудовані плагіни захищені сканером від `infra-runtime`, тому код репозиторію
    не може регресувати до широкого barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються як псевдоніми сумісності
    протягом вікна міграції, але нові плагіни мають використовувати назви маршрутів,
    які безпосередньо описують поведінку:

    | Старий помічник | Сучасний помічник |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні функції маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для нативних схвалень, приглушення відповідей, вхідної дедуплікації,
    доставки Cron і маршрутизації сеансів.

    Не додавайте нових використань `ChannelMessagingAdapter.parseExplicitTarget` або
    допоміжних функцій loaded-route на основі парсера (`parseExplicitTargetForLoadedChannel`
    чи `resolveRouteTargetForLoadedChannel`) або
    `resolveChannelRouteTargetWithParser(...)` з `plugin-sdk/channel-route`.
    Ці hooks застаріли й залишаються лише для старіших плагінів протягом
    вікна міграції. Нові плагіни каналів мають використовувати
    `messaging.targetResolver.resolveTarget(...)` для нормалізації ідентифікатора цілі
    та fallback у разі directory-miss, `messaging.inferTargetChatType(...)`, коли core
    потребує раннього типу peer, і `messaging.resolveOutboundSessionRoute(...)`
    для provider-native ідентичності сеансу та гілки.

  </Step>

  <Step title="Build and test">
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
  | `plugin-sdk/core` | Застарілий парасольковий реекспорт для визначень/збірників входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та збірники входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Перекладач налаштування, запити списку дозволених, збірники статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | `createSetupTranslator`, безпечні для імпорту адаптери патчів налаштування, допоміжні засоби приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім адаптера налаштування | Використовуйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох акаунтів | Допоміжні засоби списку акаунтів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку акаунтів | Допоміжні засоби пошуку акаунтів і резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби акаунтів | Допоміжні засоби списку акаунтів/дій акаунта |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви сполучення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Зв’язування префікса відповіді, набору тексту та доставки джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації та допоміжні засоби доступу DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Збірники схем конфігурації | Спільні примітиви схеми конфігурації каналу та лише універсальний збірник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише вбудовані plugins, підтримувані OpenClaw; нові plugins мають визначати локальні для Plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих plugins |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного конверта | Спільні допоміжні засоби маршруту й збірника конверта |
  | `plugin-sdk/channel-inbound` | Допоміжні засоби отримання вхідних повідомлень | Побудова контексту, форматування, корені, виконавці, підготовлене надсилання відповіді та предикати диспетчеризації |
  | `plugin-sdk/messaging-targets` | Застарілий шлях імпорту парсингу цілі | Використовуйте `plugin-sdk/channel-targets` для універсальних допоміжних засобів парсингу цілі, `plugin-sdk/channel-route` для порівняння маршрутів і належні Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` для специфічного для провайдера розв’язання цілі |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Допоміжні засоби життєвого циклу вихідних повідомлень | Адаптери повідомлень, квитанції, допоміжні засоби надійного надсилання, допоміжні засоби живого попереднього перегляду/стримінгу, параметри відповіді, допоміжні засоби життєвого циклу, вихідна ідентичність і планування корисного навантаження |
  | `plugin-sdk/channel-streaming` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки потоків | Допоміжні засоби життєвого циклу прив’язки потоків і адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби корисного навантаження медіа | Збірник корисного навантаження медіа агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застаріла прокладка сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Допоміжні засоби логера/середовища runtime, тайм-ауту, повторної спроби та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/хуків/http/інтерактивності Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра хуків | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби ледачого runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби runtime CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway, допоміжний засіб запуску готовності event loop і допоміжні засоби патчів статусу каналу |
  | `plugin-sdk/config-runtime` | Застаріла прокладка сумісності конфігурації | Надавайте перевагу `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Резервно-стабільні допоміжні засоби перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів схвалення | Корисне навантаження схвалення exec/Plugin, допоміжні засоби можливостей/профілів схвалення, нативна маршрутизація/runtime схвалення та форматування структурованого шляху відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби автентифікації схвалення | Розв’язання схвалювача, авторизація дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби профілю/фільтра нативного схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки схвалення | Адаптери нативної можливості/доставки схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway схвалення | Спільний допоміжний засіб розв’язання Gateway схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалення | Легкі допоміжні засоби завантаження нативного адаптера схвалення для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалення | Ширші допоміжні засоби runtime обробника схвалення; надавайте перевагу вужчим стикам адаптера/Gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі схвалення | Допоміжні засоби прив’язки нативної цілі/акаунта схвалення |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді схвалення | Допоміжні засоби корисного навантаження відповіді схвалення exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-контексту каналу | Універсальні допоміжні засоби реєстрації/отримання/спостереження runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, шлюзування DM, обмежених коренем файлів/шляхів, зовнішнього вмісту та збору секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби runtime SSRF | Закріплений диспетчер, захищений fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби пробудження, події та видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | Кеші дедуплікації в пам’яті |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних шляхів локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Допоміжні засоби політики схвалень exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби шлюзування діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/проксі | `resolveFetch`, допоміжні засоби проксі, допоміжні засоби параметрів EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби повторних спроб | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених і мапінг введення | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Допоміжні засоби шлюзування команд і поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Парсинг введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби захисту тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідна диспетчеризація, Heartbeat, планувальник відповіді, поділ на фрагменти |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповіді | Фіналізація, диспетчеризація провайдера та допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `createChannelHistoryWindow`; застарілі експорти сумісності map-helper, як-от `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментів відповіді | Допоміжні засоби поділу тексту/markdown на фрагменти |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища й updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключів сеансів | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключів сеансів |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Побудовники зведень стану каналу/облікового запису, типові значення стану середовища виконання, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розпізнавача цілей | Спільні допоміжні засоби розпізнавача цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації слагів/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запитів | Витягування рядкових URL із подібних до запитів вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із тайм-аутом | Запускач команд із тайм-аутом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування корисного навантаження інструмента | Витягування нормалізованих корисних навантажень з об’єктів результатів інструмента |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Журналювач підсистеми та допоміжні засоби редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби таблиць Markdown | Допоміжні засоби режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи відповідей на повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локального/самостійно розміщеного провайдера | Допоміжні засоби виявлення/налаштування самостійно розміщеного провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісного самостійно розміщеного провайдера | Ті самі допоміжні засоби виявлення/налаштування самостійно розміщеного провайдера |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби автентифікації провайдера в середовищі виконання | Допоміжні засоби розв’язання API-ключів у середовищі виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключів провайдера | Допоміжні засоби підключення API-ключів/запису профілів |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результатів автентифікації провайдера | Стандартний побудовник результатів автентифікації OAuth |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та об’єднання сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби змінних середовища провайдера | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик відтворення, допоміжні засоби кінцевих точок провайдера та допоміжні засоби нормалізації ідентифікаторів моделей |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі підключення провайдера | Допоміжні засоби конфігурації підключення |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні допоміжні засоби можливостей HTTP/кінцевих точок провайдера, зокрема допоміжні засоби multipart-форм для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби веб-отримання провайдера | Допоміжні засоби реєстрації/кешування провайдера веб-отримання |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації вебпошуку провайдера | Вузькі допоміжні засоби конфігурації/облікових даних вебпошуку для провайдерів, яким не потрібне підключення ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту вебпошуку провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних вебпошуку, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також обмежені за областю сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби вебпошуку провайдера | Допоміжні засоби реєстрації/кешування/середовища виконання провайдера вебпошуку |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, а також очищення схем і діагностика DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Допоміжні засоби нативного транспорту провайдера, як-от захищене отримання, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/збереження медіа, визначення розмірів відео на базі ffprobe та побудовники корисного навантаження медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби аварійного перемикання, вибору кандидатів і повідомлень про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдера розуміння медіа та експортовані для провайдерів допоміжні засоби зображень/аудіо |
  | `plugin-sdk/text-runtime` | Застарілий широкий експорт сумісності тексту | Використовуйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` і `logging-core` |
  | `plugin-sdk/text-chunking` | Допоміжні засоби поділу тексту на фрагменти | Допоміжний засіб поділу вихідного тексту на фрагменти |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдера мовлення та експортовані для провайдерів допоміжні засоби директив, реєстру, валідації й OpenAI-сумісний побудовник TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдера мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи провайдера, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдера, допоміжні засоби реєстру/розв’язання, допоміжні засоби сеансів мосту, спільні черги відповідного мовлення агента, голосове керування активним запуском, здоров’я транскрипту/подій, приглушення луни, зіставлення консультаційних запитань, координація примусових консультацій, відстеження контексту ходу, відстеження активності виводу та швидкі допоміжні засоби консультації контексту |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдера генерації зображень, допоміжні засоби ресурсів зображень/data URL і OpenAI-сумісний побудовник провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, аварійне перемикання, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби аварійного перемикання, пошук провайдера та розбір посилань на моделі |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби аварійного перемикання, пошук провайдера та розбір посилань на моделі |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних відповідей | Нормалізація/скорочення корисного навантаження інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви схеми конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експортовані елементи преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану каналу | Спільні допоміжні засоби знімків/зведень стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації списку дозволених | Допоміжні засоби редагування/читання конфігурації списку дозволених |
  | `plugin-sdk/group-access` | Допоміжні засоби групового доступу | Спільні допоміжні засоби рішень щодо групового доступу |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі фасади сумісності | Використовуйте `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Допоміжні засоби захисту Direct-DM | Вузькі допоміжні засоби політики захисту перед шифруванням |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширень | Примітиви пасивного каналу/стану та допоміжні примітиви навколишнього проксі |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Застарілий псевдонім шляху Webhook | Використовуйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Застарілий повторний експорт сумісності Zod | Імпортуйте `zod` з `zod` напряму |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання рушія пам’яті | Фасад середовища виконання індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-embedding-registry` | Реєстр вкладень пам’яті | Легковагові допоміжні засоби реєстру провайдерів вкладень пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експортовані елементи базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій вкладень хоста пам’яті | Контракти вкладень пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби пакетної/віддаленої обробки; конкретні віддалені провайдери містяться в Plugin, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експортовані елементи рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експортовані елементи рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім подій пам’яті | Використовуйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті | Допоміжні засоби стану хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Середовище виконання CLI хоста пам’яті | Допоміжні засоби середовища виконання CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Основне середовище виконання хоста пам’яті | Допоміжні засоби основного середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста пам’яті | Допоміжні засоби файлів/середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім основного середовища виконання хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів основного середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Застарілий псевдонім файлів/середовища виконання пам’яті | Використовуйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого Markdown | Спільні допоміжні засоби керованого Markdown для Plugin, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад середовища виконання менеджера пошуку Active Memory |
  | `plugin-sdk/memory-host-status` | Застарілий псевдонім стану хоста пам’яті | Використовуйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий локальний для репозиторію модуль повторного експорту сумісності; використовуйте сфокусовані локальні для репозиторію тестові підшляхи, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є спільною підмножиною для міграції, а не повною
поверхнею SDK. Інвентар точок входу компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета генеруються з
публічної підмножини.

Зарезервовані допоміжні шви вбудованих плагінів вилучено з публічної карти
експортів SDK, окрім явно задокументованих фасадів сумісності, як-от
застарілий шим `plugin-sdk/discord`, збережений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Специфічні для власника допоміжні засоби
містяться всередині пакета плагіна-власника; спільна поведінка хоста має
переходити через загальні контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо не можете
знайти експорт, перевірте джерело в `src/plugin-sdk/` або запитайте
супровідників, який загальний контракт має ним володіти.

## Активні застарівання

Вужчі застарівання, що застосовуються до SDK плагінів, контракту
постачальника, поверхні середовища виконання та маніфесту. Кожне з них ще
працює сьогодні, але буде вилучене в майбутньому мажорному випуску. Запис
під кожним пунктом зіставляє старий API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="Допоміжні збирачі довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти - лише імпорт із вужчого підшляху. `command-auth`
    реекспортує їх як заглушки сумісності.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби фільтрації згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` - повертає
    єдиний об'єкт рішення замість двох окремих викликів.

    Низхідні плагіни каналів (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Шим середовища виконання каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` є шимом сумісності для старіших
    плагінів каналів. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об'єктів
    середовища виконання.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими експортами каналу "actions". Натомість
    надавайте можливості через семантичну поверхню `presentation` - плагіни
    каналів оголошують, що вони відображають (картки, кнопки, селекти), а не
    які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний засіб tool() постачальника вебпошуку → createTool() у плагіні">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в плагіні
    постачальника. OpenClaw більше не потребує допоміжного засобу SDK для
    реєстрації обгортки інструмента.

  </Accordion>

  <Accordion title="Текстові конверти каналів → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского текстового
    конверта запиту з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Плагіни каналів прикріплюють метадані маршрутизації (тред, тему,
    відповідь на, реакції) як типізовані поля замість конкатенації їх у рядок
    запиту. Допоміжний засіб `formatAgentEnvelope(...)` досі підтримується для
    синтезованих конвертів, звернених до асистента, але вхідні текстові
    конверти поступово вилучаються.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    власний плагін каналу, який додатково обробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Хук deactivate → gateway_stop">
    **Старе**: `api.on("deactivate", handler)`.

    **Нове**: `api.on("gateway_stop", handler)`. Подія та контекст є тим
    самим контрактом очищення під час завершення роботи; змінюється лише назва
    хука.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` лишається підключеним як застарілий псевдонім сумісності до
    після 2026-08-16.

  </Accordion>

  <Accordion title="Хук subagent_spawning → прив'язування треду в core">
    **Старе**: `api.on("subagent_spawning", handler)`, що повертає
    `threadBindingReady` або `deliveryOrigin`.

    **Нове**: дозвольте core готувати прив'язки субагентів `thread: true`
    через адаптер прив'язування сеансу каналу. Використовуйте
    `api.on("subagent_spawned", handler)` лише для спостереження після запуску.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` і
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` лишаються лише як
    застарілі поверхні сумісності, доки зовнішні плагіни мігрують.

  </Accordion>

  <Accordion title="Типи виявлення постачальників → типи каталогу постачальників">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий псевдонім          | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` - плагіни
    постачальників мають використовувати явні хуки постачальника, як-от
    `buildReplayPolicy`, `normalizeToolSchemas` і `wrapStreamFn`, а не
    статичний об'єкт.

  </Accordion>

  <Accordion title="Хуки політики мислення → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі
    збережені значення за рангом профілю.

    Контекст містить `provider`, `modelId`, необов'язкові об'єднані дані
    `reasoning` і необов'язкові об'єднані факти `compat` моделі. Плагіни
    постачальників можуть використовувати ці факти каталогу, щоб надавати
    профіль для конкретної моделі лише тоді, коли налаштований контракт запиту
    це підтримує.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати
    протягом вікна застарівання, але не комбінуються з результатом профілю.

  </Accordion>

  <Accordion title="Зовнішні постачальники автентифікації → contracts.externalAuthProviders">
    **Старе**: реалізація хуків зовнішньої автентифікації без оголошення
    постачальника в маніфесті плагіна.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті плагіна
    **і** реалізуйте `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук змінних середовища постачальника → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук змінних середовища в
    `setup.providers[].envVars` у маніфесті. Це консолідує метадані
    середовища налаштування/статусу в одному місці та уникає запуску
    середовища виконання плагіна лише для відповіді на пошуки змінних
    середовища.

    `providerAuthEnvVars` лишається підтримуваним через адаптер сумісності,
    доки вікно застарівання не закриється.

  </Accordion>

  <Accordion title="Реєстрація плагіна пам'яті → registerMemoryCapability">
    **Старе**: три окремі виклики -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API стану пам'яті -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один реєстраційний виклик. Додаткові допоміжні засоби
    запитів і корпусу (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) не зачеплені.

  </Accordion>

  <Accordion title="API постачальника embedding для пам'яті">
    **Старе**: `api.registerMemoryEmbeddingProvider(...)` плюс
    `contracts.memoryEmbeddingProviders`.

    **Нове**: `api.registerEmbeddingProvider(...)` плюс
    `contracts.embeddingProviders`.

    Загальний контракт постачальника embedding можна повторно використовувати
    поза пам'яттю, і він є підтримуваним шляхом для нових постачальників.
    Специфічний для пам'яті API реєстрації лишається підключеним як
    застаріла сумісність, доки наявні постачальники мігрують. Інспекція
    плагінів повідомляє про невбудоване використання як борг сумісності.

  </Accordion>

  <Accordion title="Типи повідомлень сеансу субагента перейменовано">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод середовища виконання `readSession` застарів на користь
    `getSessionMessages`. Та сама сигнатура; старий метод передає виклик до
    нового.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав активний аксесор
    task-flow.

    **Нове**: `runtime.tasks.managedFlows` зберігає кероване середовище
    виконання мутацій TaskFlow для плагінів, які створюють, оновлюють,
    скасовують або запускають дочірні завдання з потоку. Використовуйте
    `runtime.tasks.flows`, коли плагіну потрібні лише читання на основі DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Вбудовані фабрики розширень → middleware результатів інструментів агента">
    Описано в "Як мігрувати → Мігруйте вбудовані розширення результатів
    інструментів до middleware" вище. Додано тут для повноти: вилучений шлях
    лише для вбудованого runner
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком середовищ
    виконання в `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, реекспортований з `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Віддавайте перевагу
    канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні розширень (усередині вбудованих плагінів
каналів/постачальників у `extensions/`) відстежуються у власних барелях
`api.ts` і `runtime-api.ts`. Вони не впливають на контракти сторонніх
плагінів і не перелічені тут. Якщо ви споживаєте локальний барель
вбудованого плагіна безпосередньо, прочитайте коментарі про застарівання в
цьому барелі перед оновленням.
</Note>

## Графік вилучення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять попередження під час виконання              |
| **Наступний мажорний реліз** | Застарілі поверхні буде видалено; плагіни, які все ще їх використовують, не працюватимуть |

Усі основні плагіни вже перенесено. Зовнішні плагіни мають виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища під час роботи над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) - створіть свій перший плагін
- [Огляд SDK](/uk/plugins/sdk-overview) - повний довідник імпортів підшляхів
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) - створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) - створення плагінів провайдерів
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - поглиблений огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) - довідник схеми маніфесту
