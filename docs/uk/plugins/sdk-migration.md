---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до версії OpenClaw 2026.4.25
    - Ви оновлюєте plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Мігруйте із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури plugin
із сфокусованими, задокументованими імпортами. Якщо ваш plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система plugin надавала дві широко відкриті поверхні, які дозволяли plugin імпортувати
все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** - один імпорт, який повторно експортував десятки
  допоміжних функцій. Його було запроваджено, щоб старі hook-based plugin продовжували працювати, поки
  будувалася нова архітектура plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий barrel допоміжних runtime-функцій, який
  змішував системні події, стан heartbeat, черги доставлення, допоміжні функції fetch/proxy,
  допоміжні функції для файлів, типи схвалення та непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** - широкий barrel сумісності конфігурації,
  який досі містить застарілі прямі допоміжні функції завантаження/запису протягом вікна
  міграції.
- **`openclaw/extension-api`** - міст, який давав plugin прямий доступ до
  host-side допоміжних функцій, як-от вбудований agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - видалений bundled extension hook лише для Pi,
  який міг спостерігати події embedded-runner, такі як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони досі працюють у runtime,
але нові plugin не повинні їх використовувати, а наявні plugin мають виконати міграцію до того,
як наступний major release їх видалить. API реєстрації embedded extension factory
лише для Pi було видалено; натомість використовуйте middleware для tool-result.

OpenClaw не видаляє і не переінтерпретовує задокументовану поведінку plugin у тій самій
зміні, яка запроваджує заміну. Зміни контракту, що порушують сумісність, спочатку мають пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів manifest, setup API, hooks і runtime-поведінки
реєстрації.

<Warning>
  Шар зворотної сумісності буде видалено в майбутньому major release.
  Plugin, які досі імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації embedded extension factory лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** - імпорт однієї допоміжної функції завантажував десятки непов’язаних модулів
- **Циклічні залежності** - широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** - не було способу визначити, які експорти стабільні, а які внутрішні

Сучасний plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі provider convenience seams для bundled channels також видалено.
Channel-branded helper seams були приватними скороченнями mono-repo, а не стабільними
контрактами plugin. Натомість використовуйте вузькі generic SDK subpaths. Усередині bundled
plugin workspace тримайте provider-owned допоміжні функції у власному `api.ts` або
`runtime-api.ts` цього plugin.

Поточні приклади bundled provider:

- Anthropic зберігає специфічні для Claude stream helper у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI зберігає provider builders, default-model helpers і realtime provider
  builders у власному `api.ts`
- OpenRouter зберігає provider builder і onboarding/config helpers у власному
  `api.ts`

## План міграції Talk і realtime voice

Код realtime voice, телефонії, зустрічей і browser Talk переходить від
surface-local обліку turn до спільного Talk session controller, що експортується з
`openclaw/plugin-sdk/realtime-voice`. Новий controller володіє спільним конвертом подій Talk,
станом active turn, станом capture, станом output-audio, нещодавньою
історією подій і відхиленням stale-turn. Provider plugins мають і надалі володіти
vendor-specific realtime sessions; surface plugins мають і надалі володіти capture,
playback, особливостями телефонії та зустрічей.

Ця міграція Talk навмисно є breaking-clean:

1. Залишити спільні controller/runtime primitives у
   `plugin-sdk/realtime-voice`.
2. Перевести bundled surfaces на спільний controller: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime і native push-to-talk.
3. Замінити старі сімейства Talk RPC на фінальні API `talk.session.*` і
   `talk.client.*`.
4. Оголосити один live Talk event channel у Gateway
   `hello-ok.features.events`: `talk.event`.
5. Видалити старий realtime HTTP endpoint і будь-який шлях request-time instruction
   override.

Новий код не повинен викликати `createTalkEventSequencer(...)` напряму, якщо він не
реалізує низькорівневий adapter або test fixture. Надавайте перевагу спільному controller,
щоб turn-scoped events не могли надсилатися без turn id, stale `turnEnd` /
`turnCancel` виклики не могли очистити новіший active turn, а події життєвого циклу
output-audio залишалися узгодженими в телефонії, зустрічах, browser relay, managed-room
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
```

Browser-owned WebRTC/provider-websocket sessions використовують `talk.client.create`,
бо browser володіє provider negotiation і media transport, тоді як
Gateway володіє credentials, instructions і tool policy. `talk.session.*` є
спільною Gateway-managed поверхнею для gateway-relay realtime, gateway-relay
transcription і managed-room native STT/TTS sessions.

Застарілі конфігурації, які розміщували realtime selectors поруч із `talk.provider` /
`talk.providers`, слід виправити за допомогою `openclaw doctor --fix`; runtime Talk
не переінтерпретовує speech/TTS provider config як realtime provider config.

Підтримувані комбінації `talk.session.create` навмисно нечисленні:

| Режим           | Transport       | Brain           | Власник            | Примітки                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider audio передається через Gateway; tool calls маршрутизуються через agent-consult tool.         |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Лише streaming STT; callers надсилають input audio й отримують transcript events.                                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Кімнати в стилі push-to-talk і walkie-talkie, де client володіє capture/playback, а Gateway володіє turn state.    |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only room mode для довірених first-party surfaces, які виконують Gateway tool actions напряму.               |

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

| Метод                           | Застосовується до                                      | Контракт                                                                                                                                                                                |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Додати base64 PCM audio chunk до provider session, що належить тому самому Gateway connection.                                                                                          |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                | Почати managed-room user turn.                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                | Завершити active turn після stale-turn validation.                                                                                                                                       |
| `talk.session.cancelTurn`       | усі Gateway-owned sessions                            | Скасувати active capture/provider/agent/TTS work для turn.                                                                                                                              |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                              | Зупинити assistant audio output без обов’язкового завершення user turn.                                                                                                                 |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                              | Завершити provider tool call, згенерований relay; передайте `options.willContinue` для interim output або `options.suppressResponse`, щоб задовольнити call без ще однієї assistant response. |
| `talk.session.close`            | усі unified sessions                                  | Зупинити relay sessions або відкликати managed-room state, потім забути unified session id.                                                                                             |

  Не додавайте спеціальні випадки для провайдерів або платформ у core, щоб це запрацювало.
  Core відповідає за семантику сесії Talk. Plugin провайдерів відповідають за налаштування сесій постачальників.
  Voice-call і Google Meet відповідають за адаптери телефонії/зустрічей. Browser і native
  apps відповідають за UX захоплення/відтворення на пристрої.

  ## Політика сумісності

  Для зовнішніх Plugin робота із сумісністю виконується в такому порядку:

  1. додати новий контракт
  2. зберегти стару поведінку, під’єднану через адаптер сумісності
  3. видати діагностику або попередження, що називає старий шлях і заміну
  4. покрити обидва шляхи тестами
  5. задокументувати застарівання та шлях міграції
  6. видаляти лише після оголошеного вікна міграції, зазвичай у major-релізі

  Мейнтейнери можуть перевірити поточну чергу міграції за допомогою
  `pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
  стислих підрахунків, `--owner <id>` для одного Plugin або власника сумісності, і
  `pnpm plugins:boundary-report:ci`, коли CI-гейт має падати через прострочені
  записи сумісності, міжвласницькі зарезервовані імпорти SDK або невикористані зарезервовані
  підшляхи SDK. Звіт групує застарілі
  записи сумісності за датою видалення, підраховує локальні посилання в коді/документації,
  показує міжвласницькі зарезервовані імпорти SDK і підсумовує приватний
  міст SDK memory-host, щоб очищення сумісності залишалося явним, а не
  спиралося на разові пошуки. Зарезервовані підшляхи SDK повинні мати відстежуване використання власниками;
  невикористані зарезервовані експорти helper слід видаляти з публічного SDK.

  Якщо поле manifest усе ще приймається, автори Plugin можуть продовжувати його використовувати, доки
  документація й діагностика не скажуть інакше. Новий код має віддавати перевагу задокументованій
  заміні, але наявні Plugin не повинні ламатися під час звичайних minor-релізів.

  ## Як мігрувати

  <Steps>
  <Step title="Мігруйте helper для завантаження/запису runtime config">
    Вбудовані Plugin мають припинити викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)` напряму. Віддавайте перевагу config, який уже було
    передано в активний шлях виклику. Довгоживучі handlers, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    agent tools мають використовувати `ctx.getRuntimeConfig()` із контексту tool всередині
    `execute`, щоб tool, створений до запису config, усе ще бачив оновлений
    runtime config.

    Записи config мають проходити через транзакційні helpers і вибирати
    політику після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли викликачу відомо,
    що зміна потребує чистого перезапуску gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише коли викликач відповідає за
    подальшу дію й навмисно хоче придушити reload planner.
    Результати mutation містять типізований підсумок `followUp` для тестів і логування;
    gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими helpers сумісності
    для зовнішніх Plugin протягом вікна міграції й один раз попереджають із
    кодом сумісності `runtime-config-load-write`. Вбудовані Plugin і runtime-код репозиторію
    захищені scanner guardrails у
    `pnpm check:deprecated-api-usage` і
    `pnpm check:no-runtime-action-load-config`: нове production-використання в Plugin
    одразу падає, прямі записи config падають, методи gateway server мають використовувати
    runtime snapshot запиту, runtime helpers для channel send/action/client
    мають отримувати config зі своєї boundary, а довгоживучі runtime modules мають
    нуль дозволених ambient-викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    compatibility barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, що відповідає задачі:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи config, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertions для вже завантаженого config і пошук config для plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи config | `openclaw/plugin-sdk/config-mutation` |
    | Helpers session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime helpers для group policy | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані Plugin і їхні тести захищені сканером від широкого
    barrel, щоб імпорти й mocks залишалися локальними до потрібної поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не має
    залежати від нього.

  </Step>

  <Step title="Мігруйте Pi tool-result extensions до middleware">
    Вбудовані Plugin мають замінити Pi-only
    handlers результатів tool `api.registerEmbeddedExtensionFactory(...)` на
    runtime-neutral middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть manifest Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні Plugin не можуть реєструвати tool-result middleware, бо воно може
    переписати high-trust вихідні дані tool до того, як їх побачить модель.

  </Step>

  <Step title="Мігруйте approval-native handlers до capability facts">
    Channel Plugin із підтримкою approval тепер відкривають native approval behavior через
    `approvalCapability.nativeRuntime` плюс спільний runtime-context registry.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть approval-specific auth/delivery зі старого wiring `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render на `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу channel; approval auth
      hooks там більше не читаються core
    - Реєструйте runtime objects, якими володіє channel, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте plugin-owned reroute notices з native approval handlers;
      core тепер відповідає за routed-elsewhere notices із фактичних delivery results
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню surface `createPluginRuntime().channel`. Partial stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` щодо поточного layout approval capability.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows wrapper">
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

    Якщо ваш викликач не покладається навмисно на shell fallback, не встановлюйте
    `allowShellFallback`, а натомість обробіть викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму Plugin імпорти з будь-якої із застарілих surfaces:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на сфокусовані імпорти">
    Кожен export зі старої surface відповідає певному сучасному шляху імпорту:

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

    Для host-side helpers використовуйте injected plugin runtime замість прямого
    імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий pattern застосовується до інших legacy bridge helpers:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` усе ще існує для зовнішньої
    сумісності, але новий код має імпортувати сфокусовану surface helper, яка
    справді потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Helpers system event queue | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers Heartbeat wake, event і visibility | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pending delivery queue drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Channel activity telemetry | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory dedupe caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpers безпечних local-file/media paths | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers proxy і guarded fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи SSRF dispatcher policy | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи approval request/resolution | `openclaw/plugin-sdk/approval-runtime` |
    | Helpers approval reply payload і command | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування transport readiness | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers secure token | `openclaw/plugin-sdk/secure-random-runtime` |
    | Bounded async task concurrency | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numeric coercion | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | File locks | `openclaw/plugin-sdk/file-lock` |

    Вбудовані Plugin захищені сканером від `infra-runtime`, тому код репозиторію
    не може регресувати до широкого barrel.

  </Step>

  <Step title="Мігруйте helpers channel route">
    Новий код channel route має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються compatibility
    aliases протягом вікна міграції, але нові Plugin мають використовувати назви route,
    які прямо описують поведінку:

    | Стара допоміжна функція | Сучасна допоміжна функція |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні функції маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для вбудованих схвалень, приглушення відповідей, дедуплікації вхідних повідомлень,
    доставки cron і маршрутизації сеансів. Якщо ваш плагін має власну граматику цілей,
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

  <Accordion title="Поширена таблиця шляхів імпорту">
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий загальний реекспорт для визначень/побудовників входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та побудовники входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити списку дозволених, побудовники стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту адаптери патчів налаштування, допоміжні засоби нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім адаптера налаштування | Використовуйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Пошук облікового запису + допоміжні засоби резервного варіанта за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій з обліковим записом |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви сполучення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, набір тексту та зв’язування доставки джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації та допоміжні засоби доступу DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Побудовники схем конфігурації | Спільні примітиви схеми конфігурації каналу та лише універсальний побудовник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише вбудовані plugins, які підтримує OpenClaw; нові plugins мають визначати локальні для Plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих plugins |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики групи/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби стану облікового запису та життєвого циклу потоку чернеток | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного конверта | Спільні допоміжні засоби маршруту + побудовника конверта |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби запису й диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound runtime | Допоміжні засоби вихідної доставки, делегата ідентичності/надсилання, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язування потоків | Життєвий цикл прив’язування потоків і допоміжні засоби адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби payload медіа | Побудовник payload медіа агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застаріла прокладка сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/журналювання/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env runtime | Допоміжні засоби logger/runtime env, тайм-ауту, повтору та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/хуків/http/інтерактивності Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра хуків | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway, допоміжний засіб запуску готовності event loop і допоміжні засоби патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застаріла прокладка сумісності конфігурації | Надавайте перевагу `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Резервно-стабільні допоміжні засоби перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів затвердження | Payload затвердження exec/Plugin, допоміжні засоби можливостей/профілю затвердження, нативна маршрутизація/runtime затвердження та форматування структурованого шляху відображення затвердження |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth затвердження | Розв’язання затверджувача, auth дії в тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта затвердження | Допоміжні засоби нативного профілю/фільтра затвердження exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки затвердження | Нативні адаптери можливостей/доставки затвердження |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби approval gateway | Спільний допоміжний засіб розв’язання approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера затвердження | Легкі допоміжні засоби завантаження нативного адаптера затвердження для гарячих entrypoints каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника затвердження | Ширші допоміжні засоби runtime обробника затвердження; надавайте перевагу вужчим adapter/gateway seam, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі затвердження | Допоміжні засоби нативної прив’язки цілі/облікового запису затвердження |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді затвердження | Допоміжні засоби payload відповіді затвердження exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context каналу | Універсальні допоміжні засоби register/get/watch runtime-context каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, gating DM, обмежених коренем файлів/шляхів, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Pinned-dispatcher, guarded fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби пробудження, події та видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби gating діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy, допоміжні засоби опцій EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби повторів | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вхідних даних списку дозволених | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Допоміжні засоби gating команд і поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Вхідна диспетчеризація, heartbeat, планувальник відповіді, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби фіналізації, диспетчеризації провайдера та міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk відповіді | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби session store | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану й OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Побудовники зведення стану каналу/облікового запису, значення runtime-state за замовчуванням, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розв’язувача цілей | Спільні допоміжні засоби розв’язувача цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL із request-like вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Видобування payload інструмента | Видобування нормалізованих payload з об'єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Видобування надсилання інструмента | Видобування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби для шляхів тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Допоміжні засоби для логера підсистеми та редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби Markdown-таблиць | Допоміжні засоби режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локального/self-hosted постачальника | Допоміжні засоби виявлення/налаштування self-hosted постачальника |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісного self-hosted постачальника | Ті самі допоміжні засоби виявлення/налаштування self-hosted постачальника |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime-автентифікації постачальника | Допоміжні засоби runtime-визначення API-ключа |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа постачальника | Допоміжні засоби онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result постачальника | Стандартний builder OAuth auth-result |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору постачальника | Вибір налаштованого або автоматичного постачальника та об'єднання raw-конфігурації постачальника |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var постачальника | Допоміжні засоби пошуку env-var автентифікації постачальника |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделі/відтворення постачальника | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders політик відтворення, допоміжні засоби endpoint постачальника та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу постачальника | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу постачальника | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | HTTP-допоміжні засоби постачальника | Універсальні допоміжні засоби HTTP/endpoint capabilities постачальника, зокрема допоміжні засоби multipart-форм для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch постачальника | Допоміжні засоби реєстрації/кешу web-fetch постачальника |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search постачальника | Вузькі допоміжні засоби конфігурації/облікових даних web-search для постачальників, яким не потрібне підключення ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search постачальника | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search постачальника | Допоміжні засоби реєстрації/кешу/runtime web-search постачальника |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем постачальника | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, а також очищення схем Gemini і діагностика |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання постачальника | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання постачальника |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток stream постачальника | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream та спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби transport постачальника | Нативні допоміжні засоби transport постачальника, як-от захищений fetch, перетворення транспортних повідомлень і writable transport event streams |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби fetch/transform/store для media, визначення розмірів відео через ffprobe та builders payload для media |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації media | Спільні допоміжні засоби failover, вибір кандидатів і повідомлення про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння media | Типи постачальників розуміння media, а також provider-facing експорти допоміжних засобів для зображень/аудіо |
  | `plugin-sdk/text-runtime` | Застарілий широкий експорт сумісності тексту | Використовуйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` і `logging-core` |
  | `plugin-sdk/text-chunking` | Допоміжні засоби розбиття тексту | Допоміжний засіб розбиття вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи постачальників мовлення, а також provider-facing допоміжні засоби директив, реєстру, валідації та OpenAI-сумісний builder TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи постачальників мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи постачальників, допоміжні засоби реєстру та спільний допоміжний засіб WebSocket-сесії |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи постачальників, допоміжні засоби реєстру/визначення, допоміжні засоби bridge-сесій, спільні черги talk-back агента, стан транскриптів/подій, придушення відлуння та допоміжні засоби швидкого звернення до контексту |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи постачальників генерації зображень, а також допоміжні засоби image asset/data URL і OpenAI-сумісний builder постачальника зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, auth і допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи постачальника/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук постачальника та parsing model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи постачальника/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук постачальника та parsing model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/скорочення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви schema конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експорти преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу груп | Спільні допоміжні засоби ухвалення рішень щодо доступу груп |
  | `plugin-sdk/direct-dm` | Допоміжні засоби Direct-DM | Спільні допоміжні засоби auth/guard для Direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви допоміжних засобів passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Застарілий alias шляху Webhook | Використовуйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Застарілий re-export сумісності Zod | Імпортуйте `zod` з `zod` напряму |
  | `plugin-sdk/memory-core` | Bundled допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам'яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад memory engine | Runtime-фасад індексу/пошуку пам'яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine хоста пам'яті | Експорти foundation engine хоста пам'яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine хоста пам'яті | Контракти embeddings пам'яті, доступ до реєстру, локальний постачальник і універсальні batch/remote допоміжні засоби; конкретні віддалені постачальники живуть у своїх Plugin-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD engine хоста пам'яті | Експорти QMD engine хоста пам'яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Storage engine хоста пам'яті | Експорти storage engine хоста пам'яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста пам'яті | Допоміжні засоби multimodal хоста пам'яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби query хоста пам'яті | Допоміжні засоби query хоста пам'яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста пам'яті | Допоміжні засоби secret хоста пам'яті |
  | `plugin-sdk/memory-core-host-events` | Застарілий alias подій пам'яті | Використовуйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам'яті | Допоміжні засоби статусу хоста пам'яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам'яті | Допоміжні засоби CLI runtime хоста пам'яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам'яті | Допоміжні засоби core runtime хоста пам'яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime хоста пам'яті | Допоміжні засоби file/runtime хоста пам'яті |
  | `plugin-sdk/memory-host-core` | Alias core runtime хоста пам'яті | Vendor-neutral alias для допоміжних засобів core runtime хоста пам'яті |
  | `plugin-sdk/memory-host-events` | Alias event journal хоста пам'яті | Vendor-neutral alias для допоміжних засобів event journal хоста пам'яті |
  | `plugin-sdk/memory-host-files` | Застарілий alias file/runtime пам'яті | Використовуйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби managed markdown | Спільні допоміжні засоби managed-markdown для plugins, суміжних із пам'яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Lazy runtime-фасад search-manager Active Memory |
  | `plugin-sdk/memory-host-status` | Застарілий alias статусу хоста пам'яті | Використовуйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Тестові утиліти | Repo-local застарілий barrel сумісності; використовуйте сфокусовані repo-local тестові subpaths, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно містить спільну підмножину для міграції, а не всю
поверхню SDK. Інвентар точки входу компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакетів генеруються з
публічної підмножини.

Зарезервовані допоміжні шви вбудованих plugin виведено з публічної мапи
експортів SDK, окрім явно задокументованих фасадів сумісності, як-от
застарілий shim `plugin-sdk/discord`, залишений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Допоміжні засоби, специфічні для власника,
містяться всередині пакета plugin-власника; спільну поведінку host слід
проводити через загальні контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, що відповідає завданню. Якщо не можете знайти
експорт, перевірте джерело в `src/plugin-sdk/` або запитайте maintainer, який
загальний контракт має ним володіти.

## Активні застаріння

Вужчі застаріння, що застосовуються в SDK plugin, контракті provider,
runtime-поверхні та manifest. Кожне з них досі працює сьогодні, але буде
видалене в майбутньому major-релізі. Запис під кожним пунктом зіставляє старий
API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="допоміжні builder-и command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти - просто імпортовані з вужчого підшляху. `command-auth`
    реекспортує їх як compat stub-и.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби gating для mention → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` - повертає
    один об'єкт рішення замість двох розділених викликів.

    Нижчестоящі channel plugins (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim runtime channel і допоміжні засоби channel actions">
    `openclaw/plugin-sdk/channel-runtime` є shim сумісності для старіших
    channel plugins. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime
    об'єктів.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застарілі разом із сирими channel-експортами "actions". Натомість
    надавайте capabilities через семантичну поверхню `presentation` - channel plugins
    оголошують, що вони відтворюють (cards, buttons, selects), а не які сирі
    назви actions вони приймають.

  </Accordion>

  <Accordion title="Допоміжний tool() для provider web search → createTool() на plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо на provider plugin.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації tool wrapper.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского plaintext prompt
    envelope з вхідних channel messages.

    **Нове**: `BodyForAgent` плюс структуровані блоки user-context. Channel
    plugins прикріплюють routing metadata (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у prompt string. Допоміжний
    `formatAgentEnvelope(...)` досі підтримується для синтезованих
    assistant-facing envelopes, але вхідні plaintext envelopes поступово
    виводяться.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    користувацький channel plugin, що постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи provider discovery → типи provider catalog">
    Чотири псевдоніми типів discovery тепер є тонкими обгортками над
    типами епохи catalog:

    | Старий псевдонім          | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` - provider plugins
    мають використовувати явні provider hooks, як-от `buildReplayPolicy`,
    `normalizeToolSchemas` і `wrapStreamFn`, а не статичний об'єкт.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Старе** (три окремі hooks на `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі збережені
    значення за рангом profile.

    Реалізуйте один hook замість трьох. Застарілі hooks продовжують працювати
    протягом вікна застаріння, але не компонуються з результатом profile.

  </Accordion>

  <Accordion title="Fallback для external OAuth provider → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення provider у manifest plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у manifest plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" видає попередження під час runtime і буде видалений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук provider env-var → setup.providers[].envVars">
    **Старе** поле manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    у manifest. Це консолідує metadata setup/status env в одному місці й
    уникає запуску plugin runtime лише для відповіді на env-var
    lookups.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до закриття вікна застаріння.

  </Accordion>

  <Accordion title="Реєстрація memory plugin → registerMemoryCapability">
    **Старе**: три окремі виклики -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик на API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі slots, один виклик реєстрації. Додаткові memory helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="Типи subagent session messages перейменовано">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` застарів на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав live task-flow accessor.

    **Нове**: `runtime.tasks.managedFlows` зберігає managed TaskFlow mutation
    runtime для plugins, які створюють, оновлюють, скасовують або запускають
    дочірні tasks із flow. Використовуйте `runtime.tasks.flows`, коли plugin
    потрібні лише reads на основі DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики embedded extension → middleware agent tool-result">
    Розглянуто в розділі "Як мігрувати → Міграція Pi tool-result extensions на
    middleware" вище. Додано тут для повноти: видалений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним runtime
    list у `contracts.agentToolResultMiddleware`.
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
Застаріння рівня extension (усередині вбудованих channel/provider plugins у
`extensions/`) відстежуються в їхніх власних barrel-файлах `api.ts` і
`runtime-api.ts`. Вони не впливають на контракти сторонніх plugins і тут не
перелічені. Якщо ви напряму споживаєте локальний barrel вбудованого plugin,
прочитайте коментарі про застаріння в цьому barrel перед оновленням.
</Note>

## Графік видалення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні видають runtime-попередження                         |
| **Наступний major-реліз** | Застарілі поверхні буде видалено; plugins, що досі їх використовують, зазнають збою |

Усі core plugins уже мігровано. Зовнішні plugins мають мігрувати
до наступного major-релізу.

## Тимчасове приглушення попереджень

Встановіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов'язане

- [Початок роботи](/uk/plugins/building-plugins) - створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) - повний довідник імпорту підшляхів
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) - створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) - створення provider plugins
- [Внутрішня архітектура plugin](/uk/plugins/architecture) - поглиблений огляд архітектури
- [Manifest plugin](/uk/plugins/manifest) - довідник схеми manifest
