---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте плагін до сучасної архітектури плагінів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний SDK для Plugin
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-05-06T01:53:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1c7521e14a7fb640a0c970cf19fa151e954af0ef14cb8bd8a71d194e5a003ef
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури plugin
із вузькими, документованими імпортами. Якщо ваш plugin було створено до
нової архітектури, цей посібник допоможе вам мігрувати.

## Що змінюється

Стара система plugin надавала дві дуже відкриті поверхні, які дозволяли plugin імпортувати
усе потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який реекспортував десятки
  допоміжних функцій. Його було введено, щоб старі hook-based plugins продовжували працювати, поки
  будувалася нова архітектура plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel runtime-допоміжних функцій, який
  змішував системні події, стан heartbeat, черги доставлення, fetch/proxy-допоміжні функції,
  файлові допоміжні функції, типи затверджень і непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації,
  який усе ще містить застарілі прямі допоміжні функції завантаження/запису під час вікна
  міграції.
- **`openclaw/extension-api`** — міст, який надавав plugin прямий доступ до
  host-side допоміжних функцій, як-от вбудований запуск agent.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений Pi-only hook bundled
  extension, який міг спостерігати за подіями embedded-runner, такими як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час runtime,
але нові plugins не повинні їх використовувати, а наявні plugins мають мігрувати до того,
як наступний major release їх вилучить. API реєстрації Pi-only embedded extension factory
було вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає і не переінтерпретовує документовану поведінку plugin у тій самій
зміні, яка вводить заміну. Зміни контракту, що порушують сумісність, мають спершу пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів manifest, API налаштування, hooks і поведінки
runtime-реєстрації.

<Warning>
  Шар зворотної сумісності буде вилучено в майбутньому major release.
  Plugins, які все ще імпортують із цих поверхонь, зламаються, коли це станеться.
  Pi-only реєстрації embedded extension factory вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки непов’язаних модулів
- **Циклічні залежності** — широкі реекспорти полегшували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти стабільні, а які внутрішні

Сучасний plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і документованим контрактом.

Legacy provider convenience seams для bundled channels також зникли.
Channel-branded helper seams були приватними shortcuts monorepo, а не стабільними
контрактами plugin. Натомість використовуйте вузькі generic SDK subpaths. Усередині workspace bundled
plugin тримайте provider-owned helpers у власному `api.ts` або
`runtime-api.ts` цього plugin.

Поточні приклади bundled provider:

- Anthropic тримає Claude-specific stream helpers у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI тримає provider builders, default-model helpers і realtime provider
  builders у власному `api.ts`
- OpenRouter тримає provider builder і onboarding/config helpers у власному
  `api.ts`

## План міграції Talk і realtime voice

Код realtime voice, telephony, meeting і browser Talk переходить від
surface-local обліку turn до спільного controller сесій Talk, експортованого з
`openclaw/plugin-sdk/realtime-voice`. Новий controller володіє спільною
обгорткою подій Talk, active turn state, capture state, output-audio state, recent
event history і stale-turn rejection. Provider plugins мають і надалі володіти
vendor-specific realtime sessions; surface plugins мають і надалі володіти capture,
playback, telephony і meeting quirks.

Ця міграція Talk навмисно є breaking-clean:

1. Тримайте спільні controller/runtime primitives у
   `plugin-sdk/realtime-voice`.
2. Перенесіть bundled surfaces на спільний controller: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime і native push-to-talk.
3. Замініть старі сімейства Talk RPC на фінальні API `talk.session.*` і
   `talk.client.*`.
4. Оголосіть один live канал подій Talk у Gateway
   `hello-ok.features.events`: `talk.event`.
5. Видаліть старий realtime HTTP endpoint і будь-який шлях override інструкцій
   під час запиту.

Новий код не повинен викликати `createTalkEventSequencer(...)` напряму, якщо він не
реалізує низькорівневий adapter або test fixture. Надавайте перевагу спільному controller,
щоб turn-scoped events не могли бути надіслані без turn id, застарілі виклики `turnEnd` /
`turnCancel` не могли очистити новіший active turn, а lifecycle-події output-audio
залишалися узгодженими між telephony, meetings, browser relay, managed-room
handoff і native Talk clients.

Цільова форма публічного API така:

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
`talk.providers`, слід виправити за допомогою `openclaw doctor --fix`; runtime Talk
не переінтерпретовує конфігурацію speech/TTS provider як конфігурацію realtime provider.

Підтримувані комбінації `talk.session.create` навмисно невеликі:

| Режим           | Транспорт       | Brain           | Власник            | Примітки                                                                                                          |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider audio передається через Gateway; виклики інструментів маршрутизуються через agent-consult tool. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Лише streaming STT; callers надсилають input audio й отримують transcript events.                                 |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Кімнати у стилі push-to-talk і walkie-talkie, де client володіє capture/playback, а Gateway володіє turn state.   |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only room mode для довірених first-party surfaces, які напряму виконують Gateway tool actions.              |

Мапа вилучених методів:

| Старий                           | Новий                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` або `talk.session.cancelTurn` |
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
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершити active turn після stale-turn validation.                                             |
| `talk.session.cancelTurn`       | усі Gateway-owned sessions                              | Скасувати активну роботу capture/provider/agent/TTS для turn.                                  |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Зупинити assistant audio output без обов’язкового завершення user turn.                        |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершити provider tool call, надісланий relay.                                                |
| `talk.session.close`            | усі unified sessions                                    | Зупинити relay sessions або відкликати managed-room state, потім забути unified session id.    |

Не додавайте provider або platform special cases у core, щоб це запрацювало.
Core володіє семантикою сесій Talk. Provider plugins володіють vendor session setup.
Voice-call і Google Meet володіють telephony/meeting adapters. Browser і native
apps володіють device capture/playback UX.

## Політика сумісності

Для зовнішніх plugins робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. залишити стару поведінку підключеною через adapter сумісності
3. видавати diagnostic або warning, що називає старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати застарівання й шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у major release

  Супровідники можуть перевірити поточну чергу міграції за допомогою
  `pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
  стислих підрахунків, `--owner <id>` для одного Plugin або власника сумісності, а також
  `pnpm plugins:boundary-report:ci`, коли CI gate має падати на прострочених
  записах сумісності, зарезервованих імпортах SDK між власниками або невикористаних
  зарезервованих підшляхах SDK. Звіт групує застарілі
  записи сумісності за датою видалення, рахує локальні посилання в коді/документації,
  показує зарезервовані імпорти SDK між власниками та підсумовує приватний
  міст SDK для memory-host, щоб очищення сумісності лишалося явним, а не
  покладалося на ситуативні пошуки. Зарезервовані підшляхи SDK мають мати відстежене використання власником;
  невикористані зарезервовані експорти допоміжних функцій слід видалити з публічного SDK.

  Якщо поле маніфесту все ще приймається, автори Plugin можуть продовжувати його використовувати, доки
  документація й діагностика не скажуть інакше. Новий код має віддавати перевагу задокументованій
  заміні, але наявні Plugins не повинні ламатися під час звичайних мінорних
  релізів.

  ## Як виконати міграцію

  <Steps>
  <Step title="Мігруйте допоміжні функції завантаження/запису runtime-конфігурації">
    Вбудовані Plugins мають припинити напряму викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Віддавайте перевагу конфігурації, яку
    вже передано в активний шлях виклику. Довгоживучі обробники, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агента мають використовувати `ctx.getRuntimeConfig()` з контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе ще бачив оновлену
    runtime-конфігурацію.

    Записи конфігурації мають проходити через транзакційні допоміжні функції та вибирати
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
    подальшими діями й навмисно хоче придушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    Gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими допоміжними функціями сумісності
    для зовнішніх Plugins протягом вікна міграції й один раз попереджають із
    кодом сумісності `runtime-config-load-write`. Вбудовані Plugins і runtime-код репозиторію
    захищені обмеженнями сканера в
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання у production Plugin
    відразу падає, прямі записи конфігурації падають, серверні методи Gateway мають використовувати
    runtime-знімок запиту, runtime-допоміжні функції надсилання/action/client для каналів
    мають отримувати конфігурацію зі своєї межі, а довгоживучі runtime-модулі мають
    нуль дозволених неявних викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    barrel сумісності `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, який відповідає задачі:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime-знімка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні функції сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація Markdown-таблиць | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-допоміжні функції групових політик | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання секретного вводу | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сесії | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані Plugins і їхні тести захищені сканером від широкого
    barrel, щоб імпорти й моки лишалися локальними для потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не має
    від нього залежати.

  </Step>

  <Step title="Мігруйте розширення результатів інструментів Pi на middleware">
    Вбудовані Plugins мають замінити лише Pi-орієнтовані
    обробники результатів інструментів `api.registerEmbeddedExtensionFactory(...)`
    на runtime-нейтральне middleware.

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

    Зовнішні Plugins не можуть реєструвати middleware результатів інструментів, оскільки воно може
    переписати високодовірений вивід інструмента до того, як модель його побачить.

  </Step>

  <Step title="Мігруйте approval-native обробники на факти capability">
    Канальні Plugins із підтримкою approval тепер надають native-поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний реєстр runtime-контексту.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі застарілої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render на `approvalCapability`
    - `plugin.auth` лишається тільки для потоків login/logout каналу; hooks auth для approval
      там більше не читаються core
    - Реєструйте runtime-об’єкти, що належать каналу, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте належні Plugin повідомлення про reroute з native-обробників approval;
      core тепер володіє routed-elsewhere повідомленнями з фактичних результатів доставки
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточного макета approval capability.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    `.cmd`/`.bat` wrappers тепер безпечно падають, якщо ви явно не передасте
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
    Знайдіть у своєму Plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть сфокусованими імпортами">
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

    Для допоміжних функцій на боці host використовуйте інжектований runtime Plugin замість прямого
    імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших застарілих допоміжних функцій bridge:

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

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` усе ще існує для зовнішньої
    сумісності, але новий код має імпортувати сфокусовану допоміжну поверхню, яка йому
    справді потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні функції подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги pending delivery | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні функції шляхів local-file/media | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні функції proxy і guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання approval | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні функції payload відповіді approval і команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні функції безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена concurrency асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальний для процесу асинхронний lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | File locks | `openclaw/plugin-sdk/file-lock` |

    Вбудовані Plugins захищені сканером від `infra-runtime`, тому код репозиторію
    не може регресувати до широкого barrel.

  </Step>

  <Step title="Мігруйте допоміжні функції route каналів">
    Новий код route каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target лишаються псевдонімами сумісності
    протягом вікна міграції, але нові Plugins мають використовувати назви route,
    які безпосередньо описують поведінку:

    | Стара допоміжна функція | Сучасна допоміжна функція |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні засоби маршрутів послідовно нормалізують `{ channel, to, accountId, threadId }`
    для нативних затверджень, придушення відповідей, дедуплікації вхідних повідомлень,
    доставки cron і маршрутизації сеансів. Якщо ваш plugin має власну граматику цілей,
    використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
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

  <Accordion title="Common import path table">
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб для точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий парасольковий реекспорт для визначень/будівників точок входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та будівники точок входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити списку дозволених, будівники стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime на етапі налаштування | Безпечні для імпорту адаптери патчів налаштування, допоміжні засоби нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису | Допоміжні засоби пошуку облікового запису й резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікового запису | Допоміжні засоби списку облікових записів/дій з обліковим записом |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви спарювання DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, індикація набору та підключення доставки джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації та допоміжні засоби доступу DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Будівники схем конфігурації | Спільні примітиви схеми конфігурації каналу й лише універсальний будівник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише вбудовані plugins, підтримувані OpenClaw; нові plugins мають визначати локальні схеми Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих plugins |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація імен команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби стану облікового запису та життєвого циклу потоку чернетки | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного конверта | Спільні допоміжні засоби маршруту та будівника конверта |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідної відповіді | Спільні допоміжні засоби запису й диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного вихідного runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби вихідної доставки, делегата ідентичності/надсилання, сеансу, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки потоків | Допоміжні засоби життєвого циклу прив’язки потоків і адаптера |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби медіа payload | Будівник медіа payload агента для застарілих компонувань полів |
  | `plugin-sdk/channel-runtime` | Застаріла прокладка сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/інсталяції Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Допоміжні засоби логера/середовища runtime, тайм-ауту, повтору та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/hooks/http/інтерактивності Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hook | Спільні допоміжні засоби конвеєра webhook/внутрішнього hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби runtime CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway, допоміжний засіб запуску з готовим циклом подій і допоміжні засоби патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застаріла прокладка сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Резервно-стабільні допоміжні засоби перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів схвалення | Допоміжні засоби payload схвалення exec/Plugin, можливостей/профілів схвалення, нативної маршрутизації/runtime схвалень і форматування шляху структурованого відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби автентифікації схвалення | Розв’язання approver, авторизація дії в тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби нативного профілю/фільтра схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки схвалень | Нативні адаптери можливостей/доставки схвалень |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway для схвалень | Спільний допоміжний засіб розв’язання Gateway для схвалень |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалень | Легкі допоміжні засоби завантаження нативного адаптера схвалень для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалень | Ширші допоміжні засоби runtime обробника схвалень; надавайте перевагу вужчим адаптерним/Gateway seams, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей схвалення | Допоміжні засоби прив’язки нативної цілі/облікового запису схвалення |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді на схвалення | Допоміжні засоби payload відповіді схвалення exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context каналу | Універсальні допоміжні засоби register/get/watch для runtime-context каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, шлюзування DM, обмежених коренем файлів/шляхів, зовнішнього вмісту та збору секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби runtime SSRF | Закріплений dispatcher, захищений fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних локальних шляхів до файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби шлюзування діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy, допоміжні засоби параметрів EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби повтору | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вхідних даних списку дозволених | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Допоміжні засоби шлюзування команд і командної поверхні | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби захисту тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідна диспетчеризація, Heartbeat, планувальник відповідей, поділ на фрагменти |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповіді | Фіналізація, диспетчеризація провайдера та допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилання відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментів відповіді | Допоміжні засоби поділу тексту/markdown на фрагменти |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сеансів | Допоміжні засоби шляху сховища та updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби директорій стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Будівники підсумку стану каналу/облікового запису, значення за замовчуванням runtime-state, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розв’язувача цілей | Спільні допоміжні засоби розв’язувача цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL з request-like вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Спільні читачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягує нормалізовані payload-и з об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягує канонічні поля цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Допоміжні засоби журналера підсистеми та редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби таблиць Markdown | Допоміжні засоби режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи відповіді на повідомлення | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Підібрані допоміжні засоби налаштування локальних/самостійно розміщених провайдерів | Допоміжні засоби виявлення/конфігурації самостійно розміщених провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісних самостійно розміщених провайдерів | Ті самі допоміжні засоби виявлення/конфігурації самостійно розміщених провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime-автентифікації провайдера | Допоміжні засоби runtime-розв’язання API-ключа |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби onboarding та запису профілю для API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result провайдера | Стандартний побудовник OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу провайдера | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та злиття сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var провайдера | Допоміжні засоби пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей провайдера/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding провайдера | Допоміжні засоби конфігурації onboarding |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні допоміжні засоби HTTP/endpoint-можливостей провайдера, зокрема допоміжні засоби multipart-форми транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу web-fetch провайдера |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/runtime для web-search провайдера |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Нативні допоміжні засоби транспорту провайдера, як-от захищений fetch, трансформації транспортних повідомлень і writable потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Впорядкована async-черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/трансформації/зберігання медіа, визначення розмірів відео на базі ffprobe та побудовники payload медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибір кандидатів і повідомлення про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдерів розуміння медіа та експорти допоміжних засобів для зображень/аудіо, призначені для провайдерів |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого для асистента тексту, допоміжні засоби рендерингу/розбиття/таблиць Markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби directive-tag, утиліти безпечного тексту та пов’язані допоміжні засоби тексту/журналювання |
  | `plugin-sdk/text-chunking` | Допоміжні засоби розбиття тексту | Допоміжний засіб розбиття вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення та призначені для провайдерів допоміжні засоби директив, реєстру, валідації, а також OpenAI-сумісний побудовник TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи провайдерів, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдерів, допоміжні засоби реєстру/розв’язання, допоміжні засоби bridge-сесій, спільні черги відповіді голосом агента, стан транскрипта/подій, приглушення луни та швидкі допоміжні засоби консультації контексту |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдерів генерації зображень, допоміжні засоби asset/data URL зображень і OpenAI-сумісний побудовник провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/редукція payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Експорти спільної преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації списку дозволів | Допоміжні засоби редагування/читання конфігурації списку дозволів |
  | `plugin-sdk/group-access` | Допоміжні засоби групового доступу | Спільні допоміжні засоби рішень щодо групового доступу |
  | `plugin-sdk/direct-dm` | Допоміжні засоби Direct-DM | Спільні допоміжні засоби auth/guard для Direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширень | Примітиви допоміжних засобів пасивного каналу/статусу та ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів Webhook | Допоміжні засоби нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Реекспорт Zod | Реекспортований `zod` для споживачів SDK Plugin |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад рушія пам’яті | Runtime-фасад індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-рушій хоста пам’яті | Експорти foundation-рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote допоміжні засоби; конкретні віддалені провайдери містяться в їхніх власних Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-рушій хоста пам’яті | Експорти QMD-рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні засоби CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Допоміжні засоби core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті | Допоміжні засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Alias core runtime хоста пам’яті | Vendor-neutral alias для допоміжних засобів core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Alias журналу подій хоста пам’яті | Vendor-neutral alias для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Alias файлів/runtime хоста пам’яті | Vendor-neutral alias для допоміжних засобів файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Керовані допоміжні засоби Markdown | Спільні допоміжні засоби managed-markdown для Plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку active memory | Лінивий runtime-фасад менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Alias статусу хоста пам’яті | Vendor-neutral alias для допоміжних засобів статусу хоста пам’яті |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий широкий barrel сумісності; віддавайте перевагу сфокусованим тестовим subpath, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є спільною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні шви вбудованих plugin вилучено з карти експорту
публічного SDK, за винятком явно задокументованих фасадів сумісності, як-от
застарілого shim `plugin-sdk/discord`, збереженого для опублікованого пакета
`@openclaw/discord@2026.3.13`. Допоміжні засоби, специфічні для власника,
містяться всередині пакета plugin-власника; спільна поведінка хоста має
проходити через загальні контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете
знайти експорт, перевірте джерело в `src/plugin-sdk/` або запитайте
maintainer-ів, який загальний контракт має ним володіти.

## Активні застаріння

Вужчі застаріння, що застосовуються до всього plugin SDK, контракту провайдера,
runtime-поверхні та маніфесту. Кожне з них усе ще працює сьогодні, але буде
видалене в майбутньому major-релізі. Запис під кожним пунктом зіставляє старий
API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — просто імпортовані з вужчого підшляху. `command-auth`
    повторно експортує їх як compat-заглушки.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби mention gating → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об’єкт рішення замість двох окремих викликів.

    Низхідні channel plugins (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Channel runtime shim і допоміжні засоби channel actions">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    channel plugins. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime-об’єктів.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими експортами channel "actions". Натомість
    відкривайте можливості через семантичну поверхню `presentation` — channel plugins
    оголошують, що вони рендерять (картки, кнопки, вибір), а не які сирі
    назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний tool() провайдера вебпошуку → createTool() у plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider plugin.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки інструмента.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского plaintext prompt
    envelope з вхідних channel-повідомлень.

    **Нове**: `BodyForAgent` плюс структуровані блоки user-context. Channel plugins
    прикріплюють routing metadata (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у prompt string. Допоміжний засіб
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих
    assistant-facing envelopes, але вхідні plaintext envelopes
    поступово вилучаються.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який власний
    channel plugin, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдерів → типи каталогу провайдерів">
    Чотири aliases типів виявлення тепер є тонкими обгортками над
    типами catalog-era:

    | Старий alias              | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` — provider plugins
    мають використовувати явні provider hooks, як-от `buildReplayPolicy`,
    `normalizeToolSchemas` і `wrapStreamFn`, а не статичний об’єкт.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі
    збережені значення за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hooks продовжують працювати
    протягом вікна застаріння, але не компонуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" виводить попередження під час виконання й буде видалений.

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
    у маніфесті. Це об’єднує метадані setup/status env в одному
    місці й уникає запуску plugin runtime лише для відповіді на
    пошуки env-var.

    `providerAuthEnvVars` залишається підтримуваним через adapter сумісності
    до закриття вікна застаріння.

  </Accordion>

  <Accordion title="Реєстрація memory plugin → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі slots, один виклик реєстрації. Additive memory helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="Типи повідомлень subagent session перейменовано">
    Два застарілі aliases типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` застарів на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (однина) повертав live task-flow accessor.

    **Нове**: `runtime.tasks.managedFlows` зберігає managed TaskFlow mutation
    runtime для plugins, які створюють, оновлюють, скасовують або запускають
    дочірні tasks з flow. Використовуйте `runtime.tasks.flows`, коли plugin
    потрібні лише читання на основі DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Вбудовані фабрики extension → middleware результатів agent tools">
    Розглянуто вище в "Як мігрувати → Мігруйте Pi tool-result extensions на
    middleware". Додано тут для повноти: видалений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований з `openclaw/plugin-sdk`, тепер є
    однорядковим alias для `OpenClawConfig`. Віддавайте перевагу канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застаріння рівня extension (усередині вбудованих channel/provider plugins під
`extensions/`) відстежуються всередині їхніх власних barrels `api.ts` і
`runtime-api.ts`. Вони не впливають на контракти third-party plugin і не
перелічені тут. Якщо ви споживаєте локальний barrel вбудованого plugin
безпосередньо, прочитайте коментарі про застаріння в цьому barrel перед
оновленням.
</Note>

## Графік видалення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять runtime-попередження                        |
| **Наступний major-реліз** | Застарілі поверхні буде видалено; plugins, які все ще їх використовують, не працюватимуть |

Усі core plugins уже мігровано. Зовнішні plugins мають мігрувати
до наступного major-релізу.

## Тимчасове придушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повна довідка імпортів підшляхів
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибокий огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) — довідка схеми маніфесту
