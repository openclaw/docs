---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній плагін OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний SDK Plugin
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:22:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної
архітектури Plugin із цілеспрямованими, задокументованими імпортами. Якщо ваш
Plugin було створено до появи нової архітектури, цей посібник допоможе вам
виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві широко відкриті поверхні, які давали Plugin
змогу імпортувати все потрібне з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** - єдиний імпорт, який повторно експортував десятки
  допоміжних засобів. Його було запроваджено, щоб старі Plugin на основі хуків
  продовжували працювати, поки будувалася нова архітектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий barrel із допоміжними засобами
  runtime, який змішував системні події, стан Heartbeat, черги доставлення,
  допоміжні засоби fetch/proxy, файлові допоміжні засоби, типи затвердження та
  непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** - широкий barrel сумісності конфігурації,
  який досі містить застарілі прямі допоміжні засоби завантаження/запису під час
  міграційного вікна.
- **`openclaw/extension-api`** - міст, який надавав Plugin прямий доступ до
  допоміжних засобів на боці хоста, як-от вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** - вилучений хук bundled
  extension лише для embedded-runner, який міг спостерігати події
  embedded-runner, як-от `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час
runtime, але нові Plugin не повинні їх використовувати, а наявні Plugin мають
мігрувати до того, як наступний major release їх вилучить. API реєстрації
extension factory лише для embedded-runner вилучено; натомість використовуйте
middleware для результатів інструментів.

OpenClaw не вилучає й не переінтерпретовує задокументовану поведінку Plugin у тій
самій зміні, яка вводить заміну. Критичні зміни контракту мають спершу пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання. Це
стосується імпортів SDK, полів manifest, API налаштування, хуків і поведінки
реєстрації runtime.

<Warning>
  Шар зворотної сумісності буде вилучено в майбутньому major release.
  Plugin-и, які досі імпортують із цих поверхонь, зламаються, коли це станеться.
  Застарілі реєстрації embedded extension factory вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** - імпорт одного допоміжного засобу завантажував десятки
  непов’язаних модулів
- **Циклічні залежності** - широкі повторні експорти полегшували створення циклів
  імпорту
- **Нечітка поверхня API** - не було способу визначити, які експорти стабільні, а
  які внутрішні

Сучасний SDK Plugin це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є малим, самодостатнім модулем із чітким призначенням і задокументованим
контрактом.

Застарілі зручні seams провайдера для bundled channels також вилучено.
Допоміжні seams із брендом channel були приватними shortcut у mono-repo, а не
стабільними контрактами Plugin. Натомість використовуйте вузькі generic
subpaths SDK. Усередині workspace bundled Plugin тримайте допоміжні засоби, що
належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади bundled provider:

- Anthropic тримає специфічні для Claude допоміжні засоби stream у власному seam
  `api.ts` / `contract-api.ts`
- OpenAI тримає builder-и провайдера, допоміжні засоби default-model і builder-и
  realtime provider у власному `api.ts`
- OpenRouter тримає builder провайдера та допоміжні засоби onboarding/config у
  власному `api.ts`

## План міграції Talk і realtime voice

Код realtime voice, telephony, meeting і browser Talk переходить від локального
для поверхні обліку turn до спільного controller сеансів Talk, експортованого з
`openclaw/plugin-sdk/realtime-voice`. Новий controller володіє спільним
конвертом подій Talk, станом active turn, станом capture, станом output-audio,
недавною історією подій і відхиленням stale-turn. Provider Plugin мають і далі
володіти vendor-specific realtime sessions; surface Plugin мають і далі
володіти особливостями capture, playback, telephony і meeting.

Ця міграція Talk навмисно є breaking-clean:

1. Тримайте спільні примітиви controller/runtime у
   `plugin-sdk/realtime-voice`.
2. Переведіть bundled surfaces на спільний controller: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime і native push-to-talk.
3. Замініть старі сімейства RPC Talk остаточним API `talk.session.*` і
   `talk.client.*`.
4. Оголосіть один live channel подій Talk у Gateway
   `hello-ok.features.events`: `talk.event`.
5. Видаліть старий realtime HTTP endpoint і будь-який шлях request-time
   instruction override.

Новий код не повинен викликати `createTalkEventSequencer(...)` напряму, якщо він
не реалізує низькорівневий adapter або test fixture. Надавайте перевагу
спільному controller, щоб події в межах turn не могли надсилатися без turn id,
stale виклики `turnEnd` / `turnCancel` не могли очистити новіший active turn, а
події життєвого циклу output-audio залишалися узгодженими між telephony,
meetings, browser relay, managed-room handoff і native клієнтами Talk.

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

Browser-owned WebRTC/provider-websocket sessions використовують `talk.client.create`,
тому що browser володіє negotiation провайдера й media transport, тоді як
Gateway володіє credentials, instructions і tool policy. `talk.session.*` є
спільною поверхнею, керованою Gateway, для gateway-relay realtime, gateway-relay
transcription і managed-room native STT/TTS sessions.

Застарілі config, які розміщували realtime selectors поруч із `talk.provider` /
`talk.providers`, слід виправити за допомогою `openclaw doctor --fix`; runtime
Talk не переінтерпретовує config провайдера speech/TTS як config realtime
provider.

Підтримувані комбінації `talk.session.create` навмисно малі:

| Режим           | Транспорт       | Brain           | Власник            | Примітки                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex audio провайдера передається через Gateway; виклики інструментів маршрутизуються через інструмент agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Лише streaming STT; callers надсилають input audio й отримують події transcript.                                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Кімнати у стилі push-to-talk і walkie-talkie, де клієнт володіє capture/playback, а Gateway володіє turn state.   |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only room mode для trusted first-party surfaces, які виконують дії інструментів Gateway напряму.            |

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

  | Метод                          | Застосовується до                                      | Контракт                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Додати аудіофрагмент PCM у base64 до сеансу провайдера, що належить тому самому зʼєднанню Gateway.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Почати користувацький хід у керованій кімнаті.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершити активний хід після перевірки застарілого ходу.                                                                                                                                         |
  | `talk.session.cancelTurn`       | усі сеанси, якими володіє Gateway                              | Скасувати активну роботу захоплення/провайдера/агента/TTS для ходу.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Зупинити аудіовихід асистента без обовʼязкового завершення користувацького ходу.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершити виклик інструмента провайдера, виданий relay; передайте `options.willContinue` для проміжного виводу або `options.suppressResponse`, щоб задовольнити виклик без ще однієї відповіді асистента. |
  | `talk.session.steer`            | сеанси Talk з підтримкою агента                              | Надіслати голосове керування `status`, `steer`, `cancel` або `followup` до активного вбудованого запуску, визначеного із сеансу Talk.                                                                |
  | `talk.session.close`            | усі уніфіковані сеанси                                    | Зупинити сеанси relay або відкликати стан керованої кімнати, а потім забути уніфікований ідентифікатор сеансу.                                                                                                    |

  Не додавайте в core спеціальні випадки для провайдерів або платформ, щоб це запрацювало.
  Core володіє семантикою сеансів Talk. Provider plugins володіють налаштуванням сеансів постачальників.
  Voice-call і Google Meet володіють адаптерами телефонії/зустрічей. Браузер і нативні
  застосунки володіють UX захоплення/відтворення пристроїв.

  ## Політика сумісності

  Для зовнішніх plugins робота із сумісністю виконується в такому порядку:

  1. додайте новий контракт
  2. залиште стару поведінку підключеною через адаптер сумісності
  3. видайте діагностику або попередження, що називає старий шлях і заміну
  4. покрийте обидва шляхи тестами
  5. задокументуйте застарівання та шлях міграції
  6. видаляйте лише після оголошеного вікна міграції, зазвичай у major-релізі

  Maintainers можуть перевірити поточну чергу міграції за допомогою
  `pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
  стислих підрахунків, `--owner <id>` для одного Plugin або власника сумісності та
  `pnpm plugins:boundary-report:ci`, коли CI-gate має падати через прострочені
  записи сумісності, зарезервовані SDK-імпорти між власниками або невикористані зарезервовані SDK
  підшляхи. Звіт групує застарілі
  записи сумісності за датою видалення, підраховує локальні посилання в коді/документації,
  показує зарезервовані SDK-імпорти між власниками та підсумовує приватний
  міст SDK memory-host, щоб очищення сумісності залишалося явним, а не
  спиралося на ad hoc-пошуки. Зарезервовані SDK-підшляхи мають мати відстежене використання власником;
  невикористані зарезервовані експорти helpers слід видалити з публічного SDK.

  Якщо поле manifest досі приймається, автори plugins можуть продовжувати його використовувати, доки
  документація й діагностика не скажуть інакше. Новий код має віддавати перевагу задокументованій
  заміні, але наявні plugins не повинні ламатися під час звичайних minor-релізів.

  ## Як мігрувати

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Bundled plugins мають припинити напряму викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку вже
    передано в активний шлях виклику. Довготривалі handlers, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довготривалі
    інструменти агента мають використовувати `ctx.getRuntimeConfig()` із контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, все одно бачив оновлену
    runtime-конфігурацію.

    Записи конфігурації мають проходити через транзакційні helpers і вибирати
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
    подальшою дією та навмисно хоче придушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими compatibility
    helpers для зовнішніх plugins протягом вікна міграції та один раз попереджають із
    кодом сумісності `runtime-config-load-write`. Bundled plugins і runtime-код репозиторію
    захищені scanner guardrails у
    `pnpm check:deprecated-api-usage` і
    `pnpm check:no-runtime-action-load-config`: нове production-використання plugin
    одразу падає, прямі записи конфігурації падають, методи gateway server мають використовувати
    runtime-знімок запиту, runtime helpers для channel send/action/client
    мають отримувати конфігурацію зі своєї межі, а довготривалі runtime-модулі мають
    нуль дозволених ambient-викликів `loadConfig()`.

    Новий код plugin також має уникати імпорту широкого
    compatibility barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    SDK-підшлях, що відповідає задачі:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime-знімка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Helpers сховища сеансів | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація Markdown-таблиць | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime helpers політики груп | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розвʼязання секретного вводу | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделей/сеансів | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins та їхні тести захищені scanner від широкого
    barrel, щоб імпорти й mocks залишалися локальними для потрібної їм поведінки. Широкий
    barrel досі існує для зовнішньої сумісності, але новий код не повинен
    залежати від нього.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Bundled plugins мають замінити handlers результатів інструментів, призначені лише для embedded-runner,
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

    Одночасно оновіть manifest plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Встановлені plugins також можуть реєструвати middleware результатів інструментів, коли вони
    явно ввімкнені та оголошують кожен цільовий runtime у
    `contracts.agentToolResultMiddleware`. Неоголошені реєстрації middleware встановлених plugins
    відхиляються.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Plugins каналів із підтримкою approvals тепер виставляють нативну поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний registry runtime-контексту.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі старого wiring `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render на `approvalCapability`
    - `plugin.auth` залишається лише для flows входу/виходу каналу; approval auth
      hooks там більше не читаються core
    - Реєструйте runtime-обʼєкти, якими володіє канал, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте notices про reroute, якими володіє plugin, із нативних approval handlers;
      core тепер володіє notices routed-elsewhere з фактичних результатів доставки
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню surface `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточного компонування approval capability.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозвʼязані Windows
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
    `allowShellFallback` і натомість обробіть thrown error.

  </Step>

  <Step title="Find deprecated imports">
    Знайдіть у своєму plugin імпорти з будь-якої застарілої surface:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Кожен export зі старої surface відповідає конкретному сучасному шляху імпорту:

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

    Для host-side helpers використовуйте injected plugin runtime замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується до інших застарілих допоміжних функцій мосту:

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

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` досі існує для зовнішньої
    сумісності, але новий код має імпортувати цільову поверхню допоміжних
    функцій, яка йому справді потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні функції пробудження Heartbeat, подій і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Допоміжні функції безпечних шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні функції проксі та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політик диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запитів/розв’язань затвердження | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні функції payload відповіді на затвердження та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні функції безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальний для процесу асинхронний lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Вбудовані плагіни захищені сканером від `infra-runtime`, тому код репозиторію
    не може регресувати до широкого barrel.

  </Step>

  <Step title="Migrate channel route helpers">
    Новий код маршрутів каналу має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються як псевдоніми
    сумісності протягом вікна міграції, але нові плагіни мають використовувати
    назви маршрутів, які прямо описують поведінку:

    | Старий помічник | Сучасний помічник |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні функції маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для нативних затверджень, придушення відповідей, вхідної дедуплікації,
    доставки Cron і маршрутизації сесій.

    Не додавайте нових використань `ChannelMessagingAdapter.parseExplicitTarget` або
    допоміжних функцій loaded-route на основі парсера (`parseExplicitTargetForLoadedChannel`
    чи `resolveRouteTargetForLoadedChannel`), або
    `resolveChannelRouteTargetWithParser(...)` з `plugin-sdk/channel-route`.
    Ці hooks застаріли й залишаються лише для старіших плагінів протягом
    вікна міграції. Нові плагіни каналів мають використовувати
    `messaging.targetResolver.resolveTarget(...)` для нормалізації target id
    і fallback у разі промаху довідника, `messaging.inferTargetChatType(...)`, коли core
    потрібен ранній тип peer, і `messaging.resolveOutboundSessionRoute(...)`
    для provider-native ідентичності сесії та треду.

  </Step>

  <Step title="Build and test">
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
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий загальний реекспорт для визначень і побудовників точок входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та побудовники точок входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Транслятор налаштування, запити списку дозволених, побудовники стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби середовища виконання під час налаштування | `createSetupTranslator`, безпечні для імпорту адаптери патчів налаштування, допоміжні засоби нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім адаптера налаштування | Використовуйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментарію налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів, конфігурації та шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби ідентифікатора облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація ідентифікатора облікового запису |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису | Допоміжні засоби пошуку облікового запису та резервного типового значення |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікового запису | Допоміжні засоби списку облікових записів і дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви сполучення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, індикація набору та зв’язування доставлення з джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації та допоміжні засоби доступу DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Побудовники схем конфігурації | Лише спільні примітиви схем конфігурації каналів і загальний побудовник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише підтримувані OpenClaw вбудовані Plugin; нові Plugin мають визначати локальні для Plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих Plugin |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів і конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики групи/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного конверта | Спільні допоміжні засоби маршруту та побудовника конвертів |
  | `plugin-sdk/channel-inbound` | Допоміжні засоби приймання вхідних повідомлень | Побудова контексту, форматування, корені, виконувачі, підготовлене відправлення відповіді та предикати відправлення |
  | `plugin-sdk/messaging-targets` | Застарілий шлях імпорту для розбору цілей | Використовуйте `plugin-sdk/channel-targets` для загальних допоміжних засобів розбору цілей, `plugin-sdk/channel-route` для порівняння маршрутів і належні Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` для специфічного для провайдера розв’язання цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Допоміжні засоби життєвого циклу вихідного повідомлення | Адаптери повідомлень, квитанції, допоміжні засоби надійного надсилання, допоміжні засоби живого попереднього перегляду/потокового передавання, параметри відповіді, допоміжні засоби життєвого циклу, вихідна ідентичність і планування корисного навантаження |
  | `plugin-sdk/channel-streaming` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки потоків | Життєвий цикл прив’язки потоків і допоміжні засоби адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби корисного навантаження медіа | Побудовник корисного навантаження медіа агента для застарілих структур полів |
  | `plugin-sdk/channel-runtime` | Застаріла прокладка сумісності | Лише застарілі утиліти середовища виконання каналу |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання | Допоміжні засоби середовища виконання, журналювання, резервного копіювання та встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища виконання | Допоміжні засоби журналера/середовища виконання, тайм-ауту, повтору та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби середовища виконання Plugin | Допоміжні засоби команд, хуків, HTTP та інтерактивності Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра хуків | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого середовища виконання | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби середовища виконання CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway, допоміжний засіб запуску з готовим циклом подій, розв’язання оголошеного LAN-хоста та допоміжні засоби патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застаріла прокладка сумісності конфігурації | Надавайте перевагу `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Стабільні щодо резервного варіанта допоміжні засоби перевірки команд Telegram, коли поверхня вбудованого контракту Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів схвалення | Корисне навантаження схвалення exec/Plugin, допоміжні засоби можливостей/профілів схвалення, маршрутизація/середовище виконання нативного схвалення та форматування шляху структурованого відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби авторизації схвалення | Розв’язання особи, що схвалює, авторизація дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби профілю/фільтра нативного схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставлення схвалення | Адаптери можливостей/доставлення нативного схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway схвалення | Спільний допоміжний засіб розв’язання Gateway схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалення | Легкі допоміжні засоби завантаження адаптера нативного схвалення для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалення | Ширші допоміжні засоби середовища виконання обробника схвалення; надавайте перевагу вужчим адаптерним/Gateway межам, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі схвалення | Допоміжні засоби прив’язки нативної цілі схвалення/облікового запису |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді схвалення | Допоміжні засоби корисного навантаження відповіді схвалення exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-контексту каналу | Загальні допоміжні засоби реєстрації/отримання/спостереження runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, шлюзу DM, обмежених коренем файлів/шляхів, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби середовища виконання SSRF | Закріплений диспетчер, захищений fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби пробудження, подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставлення | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | Кеші дедуплікації в пам’яті |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних шляхів локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Допоміжні засоби політики схвалення exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби шлюзу діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/проксі | `resolveFetch`, допоміжні засоби проксі, допоміжні засоби параметрів EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби повторів | `RetryConfig`, `retryAsync`, виконувачі політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених і зіставлення вводу | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюз команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір секретного вводу | Допоміжні засоби секретного вводу |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби захисту тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільне середовище виконання відповіді | Вхідне відправлення, Heartbeat, планувальник відповіді, поділ на фрагменти |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби відправлення відповіді | Фіналізація, відправлення провайдера та допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `createChannelHistoryWindow`; застарілі експорти сумісності map-допоміжників, як-от `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилання відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментів відповіді | Допоміжні засоби поділу тексту/markdown на фрагменти |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сеансів | Допоміжні засоби шляху сховища та updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключа сеансу | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключа сеансу |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Побудовники підсумків стану каналу/облікового запису, стандартні значення стану виконання, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби резолвера цілей | Спільні допоміжні засоби резолвера цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації слагів/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягування рядкових URL із вхідних даних, подібних до запитів |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із тайм-аутом | Виконавець команд із тайм-аутом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування корисного навантаження інструмента | Витягування нормалізованих корисних навантажень з об’єктів результатів інструмента |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Допоміжні засоби журналера підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби Markdown-таблиць | Допоміжні засоби режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповіді на повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локального/самостійно розгорнутого провайдера | Допоміжні засоби виявлення/конфігурації самостійно розгорнутого провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісного самостійно розгорнутого провайдера | Ті самі допоміжні засоби виявлення/конфігурації самостійно розгорнутого провайдера |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби автентифікації провайдера під час виконання | Допоміжні засоби розв’язання API-ключа під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результату автентифікації провайдера | Стандартний побудовник результату автентифікації OAuth |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та об’єднання необробленої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби змінних середовища провайдера | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделі/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик відтворення, допоміжні засоби кінцевих точок провайдера та допоміжні засоби нормалізації ID моделей |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Узагальнені допоміжні засоби можливостей HTTP/кінцевих точок провайдера, зокрема допоміжні засоби multipart-форми транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації веб-пошуку провайдера | Вузькі допоміжні засоби конфігурації/облікових даних веб-пошуку для провайдерів, яким не потрібне підключення ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту веб-пошуку провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних веб-пошуку, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також обмежені за областю сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби веб-пошуку провайдера | Допоміжні засоби реєстрації/кешу/виконання провайдера веб-пошуку |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, а також очищення схем і діагностика DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Нативні допоміжні засоби транспорту провайдера, як-от захищений fetch, витягування тексту результату інструмента, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/збереження медіа, визначення розмірів відео на основі ffprobe та побудовники корисних навантажень медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби перемикання після збою, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів зображень/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Застарілий широкий експорт сумісності тексту | Використовуйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` і `logging-core` |
  | `plugin-sdk/text-chunking` | Допоміжні засоби розбиття тексту | Допоміжний засіб розбиття вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення, а також орієнтовані на провайдерів допоміжні засоби директив, реєстру й валідації та OpenAI-сумісний побудовник TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи провайдерів, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдерів, допоміжні засоби реєстру/розв’язання, допоміжні засоби bridge-сесій, спільні черги зворотного мовлення агента, голосове керування активним запуском, стан транскрипту/події, приглушення відлуння, зіставлення консультаційних запитань, координація примусової консультації, відстеження контексту ходу, відстеження вихідної активності та допоміжні засоби швидкої консультації контексту |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдерів генерації зображень, а також допоміжні засоби ресурсів зображень/data URL і OpenAI-сумісний побудовник провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, перемикання після збою, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби перемикання після збою, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби перемикання після збою, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/зведення корисного навантаження інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви схеми конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Експорти спільної преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану каналу | Спільні допоміжні засоби знімка/підсумку стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації списку дозволених | Допоміжні засоби редагування/читання конфігурації списку дозволених |
  | `plugin-sdk/group-access` | Допоміжні засоби групового доступу | Спільні допоміжні засоби рішень щодо групового доступу |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі фасади сумісності | Використовуйте `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Допоміжні засоби захисту Direct-DM | Вузькі допоміжні засоби докриптографічної політики захисту |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширень | Примітиви пасивного каналу/стану та допоміжні примітиви навколишнього проксі |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Застарілий псевдонім шляху webhook | Використовуйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби веб-медіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Застарілий реекспорт сумісності Zod | Імпортуйте `zod` з `zod` напряму |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад виконання рушія пам’яті | Фасад виконання індексації/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-embedding-registry` | Реєстр embeddings пам’яті | Легкі допоміжні засоби реєстру провайдерів embeddings пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embeddings хоста пам’яті | Контракти embeddings пам’яті, доступ до реєстру, локальний провайдер і узагальнені допоміжні засоби пакетної/віддаленої обробки; конкретні віддалені провайдери розміщені у своїх власних plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім подій пам’яті | Використовуйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті | Допоміжні засоби стану хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Виконання CLI хоста пам’яті | Допоміжні засоби виконання CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Основне виконання хоста пам’яті | Допоміжні засоби основного виконання хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/виконання хоста пам’яті | Допоміжні засоби файлів/виконання хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім основного виконання хоста пам’яті | Нейтральний щодо постачальника псевдонім допоміжних засобів основного виконання хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний щодо постачальника псевдонім допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Застарілий псевдонім файлів/виконання пам’яті | Використовуйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Керовані допоміжні засоби markdown | Спільні допоміжні засоби керованого markdown для plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад виконання менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Застарілий псевдонім стану хоста пам’яті | Використовуйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Тестові утиліти | Локальний для репозиторію застарілий barrel сумісності; використовуйте сфокусовані локальні для репозиторію тестові підшляхи, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно містить спільну підмножину для міграції, а не всю
поверхню SDK. Інвентаризація entrypoint компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакетів генеруються з
публічної підмножини.

Зарезервовані допоміжні seams для bundled-plugin вилучено з публічної мапи
експортів SDK, окрім явно задокументованих facade сумісності, як-от
застарілий shim `plugin-sdk/discord`, збережений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Допоміжні засоби, специфічні для власника,
містяться всередині пакета Plugin-власника; спільну поведінку хоста слід
переносити через generic контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий import, що відповідає завданню. Якщо не можете знайти
export, перевірте джерело в `src/plugin-sdk/` або запитайте maintainers, який
generic контракт має ним володіти.

## Активні застарілі API

Вужчі застарілі API, що застосовуються до plugin SDK, provider contract,
runtime surface і manifest. Кожен із них усе ще працює сьогодні, але буде
видалений у майбутньому major release. Запис під кожним пунктом зіставляє
старий API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі signatures, ті самі
    exports - просто імпортуються з вужчого subpath. `command-auth`
    повторно експортує їх як compat stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` - повертає один
    об'єкт decision замість двох окремих викликів.

    Downstream channel plugins (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` є compatibility shim для старіших
    channel plugins. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime
    objects.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застарілі разом із raw "actions" channel exports. Надавайте capabilities
    через семантичну поверхню `presentation` натомість - channel plugins
    оголошують, що вони рендерять (cards, buttons, selects), а не які raw
    action names вони приймають.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Старе**: factory `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider plugin.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації tool wrapper.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского plaintext prompt
    envelope з inbound channel messages.

    **Нове**: `BodyForAgent` плюс структуровані user-context blocks. Channel
    plugins додають routing metadata (thread, topic, reply-to, reactions) як
    typed fields замість конкатенації їх у prompt string. Допоміжний засіб
    `formatAgentEnvelope(...)` і далі підтримується для synthesized
    assistant-facing envelopes, але inbound plaintext envelopes поступово
    виводяться з використання.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який custom
    channel plugin, що постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Старе**: `api.on("deactivate", handler)`.

    **Нове**: `api.on("gateway_stop", handler)`. Подія і context є тим самим
    shutdown cleanup contract; змінюється лише назва hook.

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

    `deactivate` залишається підключеним як застарілий compatibility alias до
    після 2026-08-16.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **Старе**: `api.on("subagent_spawning", handler)`, що повертає
    `threadBindingReady` або `deliveryOrigin`.

    **Нове**: дозвольте core підготувати `thread: true` subagent bindings через
    channel session-binding adapter. Використовуйте `api.on("subagent_spawned", handler)`
    лише для спостереження після запуску.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` залишаються лише як
    застарілі compatibility surfaces, доки external plugins мігрують.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Чотири discovery type aliases тепер є тонкими wrappers над типами
    catalog-era:

    | Старий alias              | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс legacy static bag `ProviderCapabilities` - provider plugins
    мають використовувати явні provider hooks, як-от `buildReplayPolicy`,
    `normalizeToolSchemas` і `wrapStreamFn`, замість static object.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує stale stored values
    за rank профілю.

    Context містить `provider`, `modelId`, необов'язковий merged `reasoning`
    і необов'язкові merged model `compat` facts. Provider plugins можуть
    використовувати ці catalog facts, щоб expose model-specific profile лише
    тоді, коли налаштований request contract це підтримує.

    Реалізуйте один hook замість трьох. Legacy hooks продовжують працювати
    протягом deprecation window, але не compose з profile result.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **Старе**: реалізація external auth hooks без оголошення provider
    у plugin manifest.

    **Нове**: оголосіть `contracts.externalAuthProviders` у plugin manifest
    **і** реалізуйте `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Старе** поле manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий env-var lookup у `setup.providers[].envVars`
    у manifest. Це консолідує setup/status env metadata в одному місці й
    уникає запуску plugin runtime лише для відповіді на env-var lookups.

    `providerAuthEnvVars` залишається підтримуваним через compatibility adapter
    до закриття deprecation window.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Старе**: три окремі виклики -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у memory-state API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі slots, один registration call. Additive prompt і corpus helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) не
    зачеплені.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Старе**: `api.registerMemoryEmbeddingProvider(...)` плюс
    `contracts.memoryEmbeddingProviders`.

    **Нове**: `api.registerEmbeddingProvider(...)` плюс
    `contracts.embeddingProviders`.

    Generic embedding provider contract можна повторно використовувати поза memory,
    і це підтримуваний шлях для нових providers. Memory-specific registration API
    залишається підключеним як застаріла сумісність, доки наявні providers мігрують.
    Plugin inspection reports non-bundled usage as compatibility debt.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Два legacy type aliases досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime method `readSession` застарілий на користь
    `getSessionMessages`. Та сама signature; старий method викликає новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (однина) повертав live task-flow accessor.

    **Нове**: `runtime.tasks.managedFlows` зберігає managed TaskFlow mutation
    runtime для plugins, які створюють, оновлюють, скасовують або запускають child tasks
    з flow. Використовуйте `runtime.tasks.flows`, коли plugin потребує лише DTO-based reads.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Розглянуто в розділі "Як мігрувати → Мігруйте embedded tool-result extensions до
    middleware" вище. Додано тут для повноти: видалений embedded-runner-only
    шлях `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним runtime
    list у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
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
Застарілі API рівня extension (всередині bundled channel/provider plugins у
`extensions/`) відстежуються у власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на third-party plugin contracts і не наведені тут. Якщо ви
споживаєте local barrel bundled plugin напряму, прочитайте deprecation comments
у цьому barrel перед оновленням.
</Note>

## Графік видалення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні видають попередження під час виконання              |
| **Наступний мажорний випуск** | Застарілі поверхні буде видалено; плагіни, які досі їх використовують, не працюватимуть |

Усі основні плагіни вже мігровано. Зовнішнім плагінам слід мігрувати
до наступного мажорного випуску.

## Тимчасове придушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) - створіть свій перший плагін
- [Огляд SDK](/uk/plugins/sdk-overview) - повна довідка імпортів підшляхів
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) - створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) - створення плагінів провайдерів
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - поглиблений огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) - довідка зі схеми маніфесту
