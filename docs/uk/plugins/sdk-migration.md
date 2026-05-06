---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin відповідно до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Міграція із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-05-06T02:51:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із вузько сфокусованими, задокументованими імпортами. Якщо ваш плагін було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві надто відкриті поверхні, які дозволяли плагінам імпортувати все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** - єдиний імпорт, який повторно експортував десятки
  допоміжних функцій. Його було введено, щоб старі плагіни на основі хуків продовжували працювати, поки
  будувалася нова архітектура плагінів.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий barrel для runtime-допоміжних засобів, який
  змішував системні події, стан heartbeat, черги доставки, допоміжні засоби fetch/proxy,
  допоміжні засоби для файлів, типи approval та непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** - широкий barrel сумісності конфігурації,
  який досі містить застарілі прямі допоміжні засоби завантаження/запису протягом вікна міграції.
- **`openclaw/extension-api`** - міст, який давав плагінам прямий доступ до
  host-side допоміжних засобів, як-от вбудований agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - видалений bundled
  extension hook лише для Pi, який міг спостерігати події embedded-runner, такі як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони досі працюють під час runtime,
але нові плагіни не повинні їх використовувати, а наявні плагіни мають виконати міграцію до того,
як наступний major release їх видалить. API реєстрації Pi-only embedded extension factory
було видалено; натомість використовуйте middleware для tool-result.

OpenClaw не видаляє й не переінтерпретовує задокументовану поведінку плагінів у тій самій
зміні, яка вводить заміну. Зміни контракту, що ламають сумісність, спершу мають пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів manifest, API setup, hooks і поведінки
runtime-реєстрації.

<Warning>
  Шар зворотної сумісності буде видалено в майбутньому major release.
  Плагіни, які досі імпортують із цих поверхонь, зламаються, коли це станеться.
  Реєстрації Pi-only embedded extension factory вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** - імпорт одного допоміжного засобу завантажував десятки непов’язаних модулів
- **Циклічні залежності** - широкі повторні експорти спрощували створення import cycles
- **Нечітка поверхня API** - не було способу зрозуміти, які експорти стабільні, а які внутрішні

Сучасний plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чіткою метою та задокументованим контрактом.

Застарілі provider convenience seams для bundled channels також зникли.
Channel-branded допоміжні seams були приватними mono-repo shortcuts, а не стабільними
контрактами плагінів. Натомість використовуйте вузькі generic SDK subpaths. Усередині bundled
plugin workspace тримайте provider-owned допоміжні засоби у власному `api.ts` або
`runtime-api.ts` цього плагіна.

Поточні приклади bundled providers:

- Anthropic тримає Claude-specific stream helpers у власному `api.ts` /
  `contract-api.ts` seam
- OpenAI тримає provider builders, default-model helpers і realtime provider
  builders у власному `api.ts`
- OpenRouter тримає provider builder і onboarding/config helpers у власному
  `api.ts`

## План міграції Talk і голосу в реальному часі

Код Realtime voice, telephony, meeting і browser Talk переходить від
surface-local turn bookkeeping до спільного контролера Talk sessions, який експортується з
`openclaw/plugin-sdk/realtime-voice`. Новий контролер володіє спільним Talk
event envelope, active turn state, capture state, output-audio state, recent
event history і stale-turn rejection. Provider plugins мають і надалі володіти
vendor-specific realtime sessions; surface plugins мають і надалі володіти capture,
playback, telephony і meeting quirks.

Ця міграція Talk навмисно є breaking-clean:

1. Зберігайте спільні controller/runtime primitives у
   `plugin-sdk/realtime-voice`.
2. Переведіть bundled surfaces на спільний controller: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime і native push-to-talk.
3. Замініть старі сімейства Talk RPC на фінальні API `talk.session.*` і
   `talk.client.*`.
4. Оголосіть один live Talk event channel у Gateway
   `hello-ok.features.events`: `talk.event`.
5. Видаліть старий realtime HTTP endpoint і будь-який request-time instruction
   override path.

Новий код не повинен напряму викликати `createTalkEventSequencer(...)`, якщо тільки він не
реалізує low-level adapter або test fixture. Віддавайте перевагу спільному controller,
щоб turn-scoped events не могли надсилатися без turn id, застарілі виклики `turnEnd` /
`turnCancel` не могли очистити новіший active turn, а lifecycle events для output-audio
залишалися узгодженими в telephony, meetings, browser relay, managed-room
handoff і native Talk clients.

Цільова форма public API така:

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
```

Browser-owned WebRTC/provider-websocket sessions використовують `talk.client.create`,
тому що browser володіє provider negotiation і media transport, тоді як
Gateway володіє credentials, instructions і tool policy. `talk.session.*` є
спільною Gateway-managed surface для gateway-relay realtime, gateway-relay
transcription і managed-room native STT/TTS sessions.

Legacy configs, які розміщували realtime selectors поруч із `talk.provider` /
`talk.providers`, слід виправляти за допомогою `openclaw doctor --fix`; runtime Talk
не переінтерпретовує speech/TTS provider config як realtime provider config.

Підтримувані комбінації `talk.session.create` навмисно обмежені:

| Режим           | Transport       | Brain           | Власник            | Примітки                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider audio, передане через Gateway; tool calls маршрутизуються через agent-consult tool.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Лише streaming STT; callers надсилають input audio й отримують transcript events.                                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk і walkie-talkie style rooms, де client володіє capture/playback, а Gateway володіє turn state.        |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only room mode для довірених first-party surfaces, які напряму виконують Gateway tool actions.               |

Мапа видалених методів:

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

| Метод                           | Застосовується до                                      | Контракт                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Додати base64 PCM audio chunk до provider session, що належить тому самому Gateway connection. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Почати managed-room user turn.                                                                |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершити active turn після stale-turn validation.                                            |
| `talk.session.cancelTurn`       | all Gateway-owned sessions                              | Скасувати active capture/provider/agent/TTS work для turn.                                    |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Зупинити assistant audio output без обов’язкового завершення user turn.                       |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершити provider tool call, який згенерував relay.                                          |
| `talk.session.close`            | all unified sessions                                    | Зупинити relay sessions або відкликати managed-room state, а потім забути unified session id. |

Не вводьте provider або platform special cases у core, щоб це запрацювало.
Core володіє Talk session semantics. Provider plugins володіють vendor session setup.
Voice-call і Google Meet володіють telephony/meeting adapters. Browser і native
apps володіють device capture/playback UX.

## Політика сумісності

Для зовнішніх плагінів робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключену через compatibility adapter
3. вивести diagnostic або warning, що називає старий шлях і заміну
4. покрити обидва шляхи в tests
5. задокументувати deprecation і migration path
6. видалити лише після оголошеного migration window, зазвичай у major release

  Супровідники можуть перевірити поточну чергу міграції за допомогою
  `pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
  стислих лічильників, `--owner <id>` для одного Plugin або власника сумісності, а також
  `pnpm plugins:boundary-report:ci`, коли CI-гейт має завершуватися помилкою через прострочені
  записи сумісності, міжвласницькі зарезервовані імпорти SDK або невикористані зарезервовані
  підшляхи SDK. Звіт групує застарілі
  записи сумісності за датою видалення, підраховує локальні посилання в коді/документації,
  показує міжвласницькі зарезервовані імпорти SDK і підсумовує приватний
  міст SDK хоста пам’яті, щоб очищення сумісності залишалося явним, а не
  покладалося на ситуативні пошуки. Зарезервовані підшляхи SDK мають мати відстежене використання власником;
  невикористані зарезервовані допоміжні експорти слід видаляти з публічного SDK.

  Якщо поле маніфесту все ще приймається, автори Plugin можуть продовжувати його використовувати, доки
  документація й діагностика не скажуть інше. Новий код має надавати перевагу задокументованій
  заміні, але наявні плагіни не повинні ламатися під час звичайних мінорних
  релізів.

  ## Як мігрувати

  <Steps>
  <Step title="Мігруйте допоміжні засоби завантаження/запису конфігурації runtime">
    Вбудовані плагіни мають припинити напряму викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку
    вже було передано в активний шлях виклику. Довгоживучі обробники, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агента мають використовувати `ctx.getRuntimeConfig()` із контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе ще бачив оновлену
    runtime-конфігурацію.

    Записи конфігурації мають проходити через транзакційні допоміжні засоби й вибирати
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
    що зміна потребує чистого перезапуску Gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач володіє
    подальшими діями й навмисно хоче приглушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і журналювання;
    Gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими допоміжними засобами сумісності
    для зовнішніх плагінів протягом вікна міграції та один раз попереджають із
    кодом сумісності `runtime-config-load-write`. Вбудовані плагіни й runtime-код репозиторію
    захищені сканерними обмеженнями в
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання у виробничому Plugin
    одразу завершується помилкою, прямі записи конфігурації завершуються помилкою, методи сервера Gateway мають використовувати
    runtime-знімок запиту, допоміжні засоби runtime для надсилання/дій/клієнта каналу
    мають отримувати конфігурацію зі своєї межі, а довгоживучі runtime-модулі мають
    нуль дозволених фонових викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    compatibility-barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, що відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Твердження щодо вже завантаженої конфігурації та пошук конфігурації входу Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime-знімка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація Markdown-таблиці | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-допоміжні засоби групової політики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Вирішення секретного введення | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сесії | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані плагіни та їхні тести захищені сканером від широкого
    barrel, щоб імпорти й mocks залишалися локальними для потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен
    залежати від нього.

  </Step>

  <Step title="Мігруйте розширення результатів інструментів Pi до middleware">
    Вбудовані плагіни мають замінити Pi-only
    обробники результатів інструментів `api.registerEmbeddedExtensionFactory(...)` на
    runtime-нейтральне middleware.

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

    Зовнішні плагіни не можуть реєструвати middleware результатів інструментів, оскільки воно може
    переписувати високодовірений вивід інструмента до того, як його побачить модель.

  </Step>

  <Step title="Мігруйте обробники з нативними approvals до фактів capability">
    Канальні плагіни з підтримкою approvals тепер показують нативну поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний реєстр runtime-контексту.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approvals, зі старої прив’язки `plugin.auth` /
      `plugin.approvals` до `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту канального Plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу каналу; approval auth
      hooks там більше не читаються core
    - Реєструйте runtime-об’єкти, що належать каналу, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення про reroute, що належать Plugin, із нативних обробників approval;
      core тепер володіє повідомленнями routed-elsewhere на основі фактичних результатів доставки
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      реальну поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` щодо поточної структури approval capability.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
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

    Якщо ваш викликач навмисно не покладається на shell fallback, не встановлюйте
    `allowShellFallback` і натомість обробіть викинуту помилку.

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

    Для допоміжних засобів на боці хоста використовуйте ін’єктований runtime Plugin замість прямого
    імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших старих допоміжних засобів bridge:

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
    сумісності, але новий код має імпортувати сфокусовану поверхню допоміжних засобів, яка
    йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory dedupe caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні засоби шляхів локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби proxy й guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/вирішення approval | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні засоби payload відповіді approval і команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкуренція async-завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | File locks | `openclaw/plugin-sdk/file-lock` |

    Вбудовані плагіни захищені сканером від `infra-runtime`, тому код репозиторію
    не може регресувати до широкого barrel.

  </Step>

  <Step title="Мігруйте допоміжні засоби маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі імена route-key і comparable-target залишаються aliases сумісності
    протягом вікна міграції, але нові плагіни мають використовувати імена маршрутів,
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

    Сучасні допоміжні засоби маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для нативних підтверджень, придушення відповідей, дедуплікації вхідних повідомлень,
    доставлення cron і маршрутизації сеансів. Якщо ваш плагін має власну граматику цілей,
    використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    парсер до того самого контракту цілі маршруту.

  </Step>

  <Step title="Зберіть і протестуйте">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Довідник шляхів імпорту

  <Accordion title="Common import path table">
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний помічник точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий об'єднаний реекспорт для визначень/будівників точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Помічник точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та будівники точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні помічники майстра налаштування | Запити списку дозволених, будівники статусу налаштування |
  | `plugin-sdk/setup-runtime` | Runtime-помічники часу налаштування | Безпечні для імпорту адаптери патчів налаштування, помічники приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Помічники адаптерів налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Помічники інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Помічники кількох акаунтів | Помічники списку акаунтів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Помічники ідентифікаторів акаунтів | `DEFAULT_ACCOUNT_ID`, нормалізація ідентифікаторів акаунтів |
  | `plugin-sdk/account-resolution` | Помічники пошуку акаунтів | Пошук акаунта + помічники резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі помічники акаунтів | Помічники списку акаунтів/дій акаунта |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM-сполучення | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, індикація набору та зв'язування доставлення джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації та помічники доступу до DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Будівники схем конфігурації | Лише спільні примітиви схеми конфігурації каналів і загальний будівник |
  | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації в комплекті | Лише підтримувані OpenClaw plugins у комплекті; нові plugins мають визначати локальні для plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації в комплекті | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних plugins у комплекті |
  | `plugin-sdk/telegram-command-config` | Помічники конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв'язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Помічники статусу акаунта та життєвого циклу чернеткового потоку | `createAccountStatusSink`, помічники фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Помічники вхідних envelope | Спільні помічники маршруту + будівника envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Помічники вхідних відповідей | Спільні помічники запису й диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілі повідомлення | Помічники розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Помічники вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Помічники залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного вихідного runtime |
  | `plugin-sdk/outbound-runtime` | Помічники вихідного runtime | Помічники вихідного доставлення, делегата ідентичності/надсилання, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Помічники прив'язування потоків | Помічники життєвого циклу прив'язування потоків і адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі помічники media payload | Будівник media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі runtime-помічники | Помічники runtime/логування/резервного копіювання/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі помічники runtime-середовища | Помічники логера/runtime-середовища, тайм-ауту, повтору та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні runtime-помічники plugin | Помічники команд/hooks/http/інтерактивних функцій plugin |
  | `plugin-sdk/hook-runtime` | Помічники конвеєра hook | Спільні помічники конвеєра webhook/внутрішніх hook |
  | `plugin-sdk/lazy-runtime` | Ледачі runtime-помічники | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Помічники процесів | Спільні помічники exec |
  | `plugin-sdk/cli-runtime` | Runtime-помічники CLI | Форматування команд, очікування, помічники версій |
  | `plugin-sdk/gateway-runtime` | Помічники Gateway | Клієнт Gateway, помічник запуску готовності циклу подій і помічники патчів статусу каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Віддавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Помічники команд Telegram | Резервно стабільні помічники перевірки команд Telegram, коли поверхня контракту Telegram у комплекті недоступна |
  | `plugin-sdk/approval-runtime` | Помічники запитів схвалення | Payload схвалення exec/plugin, помічники можливостей/профілю схвалення, нативна маршрутизація/ runtime схвалення та форматування шляху структурованого відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Помічники авторизації схвалення | Розв'язання approver, авторизація дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Помічники клієнта схвалення | Помічники нативного профілю/фільтра схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Помічники доставлення схвалення | Нативні адаптери можливостей/доставлення схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Помічники Gateway схвалення | Спільний помічник розв'язання Gateway схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Помічники адаптерів схвалення | Легкі помічники завантаження нативних адаптерів схвалення для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Помічники обробників схвалення | Ширші runtime-помічники обробників схвалення; віддавайте перевагу вужчим адаптерним/Gateway-швам, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Помічники цілей схвалення | Нативні помічники прив'язування цілі/акаунта схвалення |
  | `plugin-sdk/approval-reply-runtime` | Помічники відповіді схвалення | Помічники payload відповіді схвалення exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Помічники runtime-контексту каналу | Загальні помічники реєстрації/отримання/спостереження runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Помічники безпеки | Спільні помічники довіри, DM-шлюзування, root-обмежених файлів/шляхів, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Помічники політики SSRF | Помічники списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Runtime-помічники SSRF | Закріплений dispatcher, захищений fetch, помічники політики SSRF |
  | `plugin-sdk/system-event-runtime` | Помічники системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Помічники Heartbeat | Помічники подій Heartbeat і видимості |
  | `plugin-sdk/delivery-queue-runtime` | Помічники черги доставлення | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Помічники активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Помічники дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Помічники доступу до файлів | Помічники безпечних шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Помічники готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Помічники обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Помічники діагностичного шлюзування | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Помічники форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, помічники графа помилок |
  | `plugin-sdk/fetch-runtime` | Помічники обгорнутого fetch/проксі | `resolveFetch`, помічники проксі, помічники опцій EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Помічники нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Помічники повторів | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення введення списку дозволених | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюзування команд і помічники командної поверхні | `resolveControlCommandGate`, помічники авторизації відправника, помічники реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Помічники введення секретів |
  | `plugin-sdk/webhook-ingress` | Помічники Webhook-запитів | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Помічники захисту тіла Webhook | Помічники читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідна диспетчеризація, Heartbeat, планувальник відповідей, поділ на фрагменти |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники диспетчеризації відповідей | Фіналізація, диспетчеризація провайдера та помічники міток розмов |
  | `plugin-sdk/reply-history` | Помічники історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Помічники фрагментів відповіді | Помічники поділу тексту/markdown на фрагменти |
  | `plugin-sdk/session-store-runtime` | Помічники сховища сесій | Помічники шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Помічники шляхів стану | Помічники каталогів стану та OAuth |
  | `plugin-sdk/routing` | Помічники routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, помічники нормалізації session-key |
  | `plugin-sdk/status-helpers` | Помічники статусу каналу | Будівники зведення статусу каналу/акаунта, стандартні значення runtime-стану, помічники метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Помічники розв'язувача цілей | Спільні помічники розв'язувача цілей |
  | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації рядків | Помічники нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Помічники URL запиту | Витягання рядкових URL з input, схожих на запит |
  | `plugin-sdk/run-command` | Помічники команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Видобування корисного навантаження інструмента | Видобуває нормалізовані корисні навантаження з об'єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Видобування надсилання інструмента | Видобуває канонічні поля цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів для тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Допоміжні засоби логера підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби Markdown-таблиць | Допоміжні засоби режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповіді повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/самостійно розміщеного провайдера | Допоміжні засоби виявлення/налаштування самостійно розміщеного провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісного самостійно розміщеного провайдера | Ті самі допоміжні засоби виявлення/налаштування самостійно розміщеного провайдера |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби автентифікації середовища виконання провайдера | Допоміжні засоби визначення API-ключів у середовищі виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу/запису профілю для API-ключів |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результату автентифікації провайдера | Стандартний побудовник результату автентифікації OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу провайдера | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та об'єднання необробленої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби змінних середовища провайдера | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик відтворення, допоміжні засоби кінцевих точок провайдера та допоміжні засоби нормалізації ідентифікаторів моделей |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | HTTP-допоміжні засоби провайдера | Загальні допоміжні засоби можливостей HTTP/кінцевих точок провайдера, зокрема допоміжні засоби multipart-форм для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації вебпошуку провайдера | Вузькі допоміжні засоби конфігурації/облікових даних вебпошуку для провайдерів, яким не потрібне підключення ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту вебпошуку провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних вебпошуку, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і обмежені за областю сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби вебпошуку провайдера | Допоміжні засоби реєстрації/кешу/середовища виконання провайдера вебпошуку |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгортки потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Нативні допоміжні засоби транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/зберігання медіа, визначення розмірів відео на основі ffprobe та побудовники корисного навантаження медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби аварійного перемикання, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдера розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, орієнтовані на провайдера |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Вилучення видимого для асистента тексту, допоміжні засоби рендерингу/нарізання/таблиць Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив, утиліти безпечного тексту та пов'язані допоміжні засоби тексту/журналювання |
  | `plugin-sdk/text-chunking` | Допоміжні засоби нарізання тексту | Допоміжний засіб нарізання вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдера мовлення, а також орієнтовані на провайдера допоміжні засоби директив, реєстру й валідації та OpenAI-сумісний побудовник TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдера мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи провайдера, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдера, допоміжні засоби реєстру/визначення, допоміжні засоби мостових сесій, спільні черги відповіді голосом агента, справність транскрипта/подій, приглушення відлуння та швидкі допоміжні засоби консультації контексту |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдера генерації зображень, а також допоміжні засоби ресурсів зображень/data URL і OpenAI-сумісний побудовник провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, аварійне перемикання, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби аварійного перемикання, пошук провайдера та розбір посилань на модель |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби аварійного перемикання, пошук провайдера та розбір посилань на модель |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/скорочення корисного навантаження інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви схеми конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експорти преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану каналу | Спільні допоміжні засоби знімка/підсумку стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації списку дозволених | Допоміжні засоби редагування/читання конфігурації списку дозволених |
  | `plugin-sdk/group-access` | Допоміжні засоби групового доступу | Спільні допоміжні засоби ухвалення рішень щодо групового доступу |
  | `plugin-sdk/direct-dm` | Допоміжні засоби прямих DM | Спільні допоміжні засоби автентифікації/захисту прямих DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширення | Примітиви допоміжних засобів пасивного каналу/стану та зовнішнього проксі |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляху Webhook | Допоміжні засоби нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів SDK Plugin |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам'яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання рушія пам'яті | Фасад середовища виконання індексу/пошуку пам'яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам'яті | Експорти базового рушія хоста пам'яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій вбудовувань хоста пам'яті | Контракти вбудовувань пам'яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби пакетної/віддаленої обробки; конкретні віддалені провайдери живуть у Plugin, які ними володіють |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам'яті | Експорти рушія QMD хоста пам'яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам'яті | Експорти рушія сховища хоста пам'яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам'яті | Мультимодальні допоміжні засоби хоста пам'яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам'яті | Допоміжні засоби запитів хоста пам'яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам'яті | Допоміжні засоби секретів хоста пам'яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам'яті | Допоміжні засоби журналу подій хоста пам'яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам'яті | Допоміжні засоби стану хоста пам'яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Середовище виконання CLI хоста пам'яті | Допоміжні засоби середовища виконання CLI хоста пам'яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Основне середовище виконання хоста пам'яті | Допоміжні засоби основного середовища виконання хоста пам'яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста пам'яті | Допоміжні засоби файлів/середовища виконання хоста пам'яті |
  | `plugin-sdk/memory-host-core` | Псевдонім основного середовища виконання хоста пам'яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів основного середовища виконання хоста пам'яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам'яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам'яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/середовища виконання хоста пам'яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/середовища виконання хоста пам'яті |
  | `plugin-sdk/memory-host-markdown` | Керовані допоміжні засоби Markdown | Спільні допоміжні засоби керованого Markdown для Plugin, суміжних із пам'яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад середовища виконання менеджера пошуку активної пам'яті |
  | `plugin-sdk/memory-host-status` | Псевдонім стану хоста пам'яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів стану хоста пам'яті |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий широкий барель сумісності; віддавайте перевагу спеціалізованим тестовим підшляхам, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно містить спільну підмножину для міграції, а не повну
поверхню SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні шви вбудованих plugin вилучено з публічної карти
експорту SDK, за винятком явно задокументованих фасадів сумісності, таких як
застарілий shim `plugin-sdk/discord`, збережений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Допоміжні засоби, специфічні для власника,
містяться всередині пакета plugin-власника; спільна поведінка хоста має
переходити через загальні контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, що відповідає завданню. Якщо не можете знайти
експорт, перевірте вихідний код у `src/plugin-sdk/` або запитайте
супровідників, який загальний контракт має ним володіти.

## Активні застарівання

Вужчі застарівання, що застосовуються до SDK plugin, контракту провайдера,
runtime-поверхні та маніфесту. Кожне з них усе ще працює сьогодні, але буде
видалене в майбутньому мажорному випуску. Запис під кожним пунктом зіставляє
старий API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="Допоміжні побудовники command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти - просто імпортовані з вужчого підшляху. `command-auth`
    реекспортує їх як заглушки сумісності.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби gating для згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` - повертає
    єдиний об'єкт рішення замість двох окремих викликів.

    Нижчі channel plugins (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim runtime каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` є shim сумісності для старіших
    channel plugins. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime
    об'єктів.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими експортами канальних "actions". Натомість
    надавайте можливості через семантичну поверхню `presentation` - channel plugins
    оголошують, що вони рендерять (картки, кнопки, селекти), а не які сирі
    назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний tool() провайдера вебпошуку → createTool() у plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider plugin.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки
    інструмента.

  </Accordion>

  <Accordion title="Відкритотекстові конверти каналів → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского
    відкритотекстового prompt-конверта з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Channel plugins додають метадані маршрутизації (тред, тему, відповідь-на,
    реакції) як типізовані поля замість конкатенації їх у prompt-рядок.
    Допоміжний засіб `formatAgentEnvelope(...)` усе ще підтримується для
    синтезованих конвертів, спрямованих до assistant, але вхідні відкритотекстові
    конверти поступово виводяться з використання.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    власний channel plugin, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдерів → типи каталогу провайдерів">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий псевдонім          | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` - provider plugins
    мають використовувати явні хуки провайдера, як-от `buildReplayPolicy`,
    `normalizeToolSchemas` і `wrapStreamFn`, а не статичний об'єкт.

  </Accordion>

  <Accordion title="Хуки політики мислення → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі збережені
    значення за рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати
    протягом вікна застарівання, але не компонуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" виводить попередження під час runtime і буде видалений.

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

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    у маніфесті. Це консолідує env-метадані налаштування/статусу в одному
    місці та уникає запуску runtime plugin лише для відповіді на пошуки
    env-var.

    `providerAuthEnvVars` лишається підтримуваним через адаптер сумісності,
    доки не закриється вікно застарівання.

  </Accordion>

  <Accordion title="Реєстрація memory plugin → registerMemoryCapability">
    **Старе**: три окремі виклики -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, єдиний виклик реєстрації. Адитивні допоміжні засоби пам'яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="Типи повідомлень сесій subagent перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` застарів на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав live task-flow accessor.

    **Нове**: `runtime.tasks.managedFlows` зберігає managed runtime мутацій
    TaskFlow для plugins, які створюють, оновлюють, скасовують або запускають
    дочірні задачі з flow. Використовуйте `runtime.tasks.flows`, коли plugin
    потребує лише читання на основі DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Вбудовані фабрики extension → middleware результатів інструментів agent">
    Розглянуто вище в "Як мігрувати → Перенесіть Pi extensions результатів
    інструментів на middleware". Включено тут для повноти: видалений шлях лише
    для Pi `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, реекспортований з `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Надавайте перевагу
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
Застарівання рівня extension (усередині вбудованих channel/provider plugins під
`extensions/`) відстежуються всередині їхніх власних barrels `api.ts` і
`runtime-api.ts`. Вони не впливають на контракти сторонніх plugins і тут не
перелічені. Якщо ви напряму споживаєте локальний barrel вбудованого plugin,
прочитайте коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Графік видалення

| Коли                   | Що відбувається                                                       |
| ---------------------- | -------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять попередження runtime                     |
| **Наступний мажорний випуск** | Застарілі поверхні буде видалено; plugins, які все ще їх використовують, завершаться помилкою |

Усі core plugins уже мігровано. Зовнішні plugins мають мігрувати до наступного
мажорного випуску.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов'язане

- [Початок роботи](/uk/plugins/building-plugins) - створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) - повна довідка імпортів підшляхів
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) - створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) - створення provider plugins
- [Внутрішній устрій Plugin](/uk/plugins/architecture) - глибокий огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) - довідка схеми маніфесту
