---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній плагін OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний SDK Plugin
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-07-04T15:35:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin
із цільовими, задокументованими імпортами. Якщо ваш Plugin було створено до
нової архітектури, цей посібник допоможе вам мігрувати.

## Що змінюється

Стара система Plugin надавала дві широко відкриті поверхні, які давали змогу Plugin імпортувати
все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** - один імпорт, який повторно експортував десятки
  допоміжних засобів. Його було запроваджено, щоб старіші Plugin на основі хуків працювали, поки
  будувалася нова архітектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий barrel runtime-допоміжних засобів, який
  змішував системні події, стан Heartbeat, черги доставлення, допоміжні засоби fetch/proxy,
  допоміжні засоби для файлів, типи схвалення та непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** - широкий barrel сумісності конфігурації,
  який досі містить застарілі прямі допоміжні засоби завантаження/запису протягом
  вікна міграції.
- **`openclaw/extension-api`** - міст, який давав Plugin прямий доступ до
  допоміжних засобів на боці хоста, як-от вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** - видалений хук bundled
  розширення лише для embedded-runner, який міг спостерігати події embedded-runner, такі як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони досі працюють під час виконання,
але нові Plugin не повинні їх використовувати, а наявні Plugin мають мігрувати до того,
як наступний major-реліз їх видалить. API реєстрації фабрики розширення лише для
embedded-runner було видалено; натомість використовуйте middleware для результатів інструментів.

OpenClaw не видаляє й не переінтерпретовує задокументовану поведінку Plugin у тій самій
зміні, яка вводить заміну. Зміни контракту, що порушують сумісність, мають спершу пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки
реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде видалено в майбутньому major-релізі.
  Plugin, які досі імпортують із цих поверхонь, після цього зламаються.
  Застарілі реєстрації фабрик вбудованих розширень уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** - імпорт одного допоміжного засобу завантажував десятки непов’язаних модулів
- **Циклічні залежності** - широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** - не було способу визначити, які експорти стабільні, а які внутрішні

Сучасний SDK Plugin це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є малим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні шви provider для bundled каналів також видалено.
Допоміжні шви з брендингом каналу були приватними скороченнями mono-repo, а не стабільними
контрактами Plugin. Натомість використовуйте вузькі generic підшляхи SDK. Усередині bundled
робочого простору Plugin тримайте допоміжні засоби, що належать provider, у власному `api.ts` або
`runtime-api.ts` цього Plugin.

Поточні bundled приклади provider:

- Anthropic тримає допоміжні засоби потоків, специфічні для Claude, у власному шві `api.ts` /
  `contract-api.ts`
- OpenAI тримає builders provider, допоміжні засоби default-model і builders realtime provider
  у власному `api.ts`
- OpenRouter тримає builder provider і допоміжні засоби onboarding/config у власному
  `api.ts`

## План міграції Talk і голосу реального часу

Код Talk для голосу реального часу, телефонії, зустрічей і браузера переходить від
локального для поверхні обліку ходів до спільного контролера сесії Talk, який експортує
`openclaw/plugin-sdk/realtime-voice`. Новий контролер володіє спільним
envelope подій Talk, станом активного ходу, станом захоплення, станом вихідного аудіо, нещодавньою
історією подій і відхиленням застарілих ходів. Plugin provider мають і далі володіти
realtime-сесіями, специфічними для постачальника; Plugin поверхонь мають і далі володіти нюансами
захоплення, відтворення, телефонії та зустрічей.

Ця міграція Talk навмисно є чистою зі змінами, що порушують сумісність:

1. Тримайте спільний контролер/runtime-примітиви в
   `plugin-sdk/realtime-voice`.
2. Переведіть bundled поверхні на спільний контролер: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime і native push-to-talk.
3. Замініть старі сімейства RPC Talk на фінальний API `talk.session.*` і
   `talk.client.*`.
4. Оголосіть один live-канал подій Talk у Gateway
   `hello-ok.features.events`: `talk.event`.
5. Видаліть старий realtime HTTP endpoint і будь-який шлях перевизначення інструкцій
   під час запиту.

Новий код не повинен викликати `createTalkEventSequencer(...)` напряму, якщо тільки він не
реалізує низькорівневий adapter або тестову fixture. Віддавайте перевагу спільному контролеру,
щоб події в межах ходу не могли бути emitted без id ходу, застарілі виклики `turnEnd` /
`turnCancel` не могли очистити новіший активний хід, а події життєвого циклу вихідного аудіо
лишалися узгодженими в телефонії, зустрічах, browser relay, managed-room
handoff і native клієнтах Talk.

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

Сесії WebRTC/provider-websocket, якими володіє браузер, використовують `talk.client.create`,
бо браузер володіє узгодженням provider і медіатранспортом, тоді як
Gateway володіє credentials, інструкціями та політикою інструментів. `talk.session.*` є
спільною керованою Gateway поверхнею для gateway-relay realtime, gateway-relay
transcription і managed-room native STT/TTS сесій.

Застарілі конфігурації, які розміщували realtime selectors поруч із `talk.provider` /
`talk.providers`, слід виправити за допомогою `openclaw doctor --fix`; runtime Talk
не переінтерпретовує конфігурацію speech/TTS provider як конфігурацію realtime provider.

Підтримувані комбінації `talk.session.create` навмисно невеликі:

| Режим           | Транспорт       | Brain           | Власник            | Примітки                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Повнодуплексне аудіо provider передається через Gateway; виклики інструментів маршрутизуються через інструмент agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Лише streaming STT; callers надсилають вхідне аудіо й отримують події транскрипту.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Кімнати в стилі push-to-talk і walkie-talkie, де client володіє захопленням/відтворенням, а Gateway володіє станом ходу. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Режим кімнати лише для admin для довірених first-party поверхонь, які виконують дії інструментів Gateway напряму. |

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

Уніфікований контрольний словник також навмисно вузький:

  | Метод                           | Застосовується до                                       | Контракт                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Додати фрагмент аудіо PCM у base64 до сеансу провайдера, що належить тому самому підключенню Gateway.                                                                                   |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Почати користувацький хід managed-room.                                                                                                                                                 |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершити активний хід після перевірки на застарілий хід.                                                                                                                               |
  | `talk.session.cancelTurn`       | усі сеанси, що належать Gateway                         | Скасувати активну роботу захоплення/провайдера/агента/TTS для ходу.                                                                                                                     |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Зупинити аудіовихід асистента, не обов’язково завершуючи користувацький хід.                                                                                                            |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершити виклик інструмента провайдера, згенерований relay; передайте `options.willContinue` для проміжного виводу або `options.suppressResponse`, щоб виконати виклик без ще однієї відповіді асистента. |
  | `talk.session.steer`            | сеанси Talk із підтримкою агента                        | Надіслати усне керування `status`, `steer`, `cancel` або `followup` до активного вбудованого запуску, визначеного із сеансу Talk.                                                       |
  | `talk.session.close`            | усі уніфіковані сеанси                                  | Зупинити relay-сеанси або відкликати стан managed-room, а потім забути уніфікований ідентифікатор сеансу.                                                                               |

  Не додавайте в core спеціальні випадки для провайдерів або платформ, щоб це працювало.
  Core володіє семантикою сеансів Talk. Plugin провайдерів володіють налаштуванням сеансів постачальників.
  Голосові виклики та Google Meet володіють адаптерами телефонії/зустрічей. Браузерні й нативні
  застосунки володіють UX захоплення/відтворення пристроїв.

  ## Політика сумісності

  Для зовнішніх Plugin робота із сумісністю відбувається в такому порядку:

  1. додати новий контракт
  2. зберегти стару поведінку, підключену через адаптер сумісності
  3. видати діагностику або попередження, що називає старий шлях і заміну
  4. покрити обидва шляхи тестами
  5. задокументувати застарівання та шлях міграції
  6. видаляти лише після оголошеного вікна міграції, зазвичай у major-релізі

  Мейнтейнери можуть перевірити поточну чергу міграції за допомогою
  `pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
  компактних підрахунків, `--owner <id>` для одного Plugin або власника сумісності, і
  `pnpm plugins:boundary-report:ci`, коли CI-гейт має падати через прострочені
  записи сумісності, міжвласницькі зарезервовані імпорти SDK або невикористані зарезервовані
  підшляхи SDK. Звіт групує застарілі
  записи сумісності за датою видалення, рахує локальні посилання в коді/документації,
  показує міжвласницькі зарезервовані імпорти SDK і підсумовує приватний
  міст SDK memory-host, щоб очищення сумісності залишалося явним, а не
  покладалося на ситуативні пошуки. Зарезервовані підшляхи SDK повинні мати відстежене використання власником;
  невикористані зарезервовані експорти helper слід видалити з публічного SDK.

  Якщо поле маніфесту все ще приймається, автори Plugin можуть продовжувати його використовувати, доки
  документація й діагностика не скажуть інакше. Новий код має віддавати перевагу задокументованій
  заміні, але наявні Plugin не повинні ламатися під час звичайних minor-релізів.

  ## Як мігрувати

  <Steps>
  <Step title="Мігруйте helper для завантаження/запису runtime-конфігурації">
    Вбудовані Plugin мають припинити напряму викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Віддавайте перевагу конфігурації, яку
    вже передано в активний шлях виклику. Довготривалі обробники, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довготривалі
    інструменти агента мають використовувати `ctx.getRuntimeConfig()` з контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, все одно бачив оновлену
    runtime-конфігурацію.

    Записи конфігурації повинні проходити через транзакційні helper і вибирати
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
    подальшою дією й навмисно хоче придушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    Gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими helper сумісності
    для зовнішніх Plugin протягом вікна міграції й один раз попереджають із
    кодом сумісності `runtime-config-load-write`. Вбудовані Plugin і runtime-код репозиторію
    захищені scanner-обмеженнями в
    `pnpm check:deprecated-api-usage` і
    `pnpm check:no-runtime-action-load-config`: нове production-використання Plugin
    одразу падає, прямі записи конфігурації падають, методи сервера Gateway повинні використовувати
    runtime-знімок запиту, runtime-helper надсилання/action/client каналів
    повинні отримувати конфігурацію зі своєї межі, а довготривалі runtime-модулі мають
    нуль дозволених ambient-викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    compatibility-barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, що відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime-знімка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Helper сховища сеансів | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиць Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-helper групової політики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Визначення секретного вводу | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сеансу | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані Plugin та їхні тести захищені scanner від широкого
    barrel, щоб імпорти й моки залишалися локальними до потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен
    від нього залежати.

  </Step>

  <Step title="Мігруйте вбудовані розширення результатів інструментів до middleware">
    Вбудовані Plugin повинні замінити обробники результатів інструментів
    `api.registerEmbeddedExtensionFactory(...)`, призначені лише для embedded-runner,
    на runtime-нейтральне middleware.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Одночасно оновіть маніфест Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Установлені Plugin також можуть реєструвати middleware результатів інструментів, коли вони
    явно ввімкнені й оголошують кожен цільовий runtime у
    `contracts.agentToolResultMiddleware`. Неоголошені реєстрації middleware встановлених Plugin
    відхиляються.

  </Step>

  <Step title="Мігруйте approval-native обробники до фактів capability">
    Channel Plugin із підтримкою approval тепер показують нативну поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний реєстр runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічні для approval auth/delivery зі старої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render на `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу каналу; approval auth
      hooks там більше не читаються core
    - Реєструйте runtime-об’єкти, що належать каналу, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення про reroute, що належать Plugin, із native approval handlers;
      core тепер володіє повідомленнями routed-elsewhere на основі фактичних результатів доставки
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточної структури approval capability.

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
    `allowShellFallback` і натомість обробіть викинуту помилку.

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

    Для host-side helper використовуйте інжектований runtime Plugin замість прямого імпорту:

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
    | допоміжні функції сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` досі існує для зовнішньої
    сумісності, але новий код має імпортувати зосереджену допоміжну поверхню, яка
    йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні функції пробудження, подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в пам’яті та з постійним бекендом | `openclaw/plugin-sdk/dedupe-runtime` |
    | Допоміжні функції безпечних локальних шляхів файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні функції проксі та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/вирішення схвалення | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні функції payload відповіді на схвалення та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні функції захищених токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальний для процесу асинхронний lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові locks | `openclaw/plugin-sdk/file-lock` |

    Вбудовані плагіни захищені сканером від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel-імпорту.

  </Step>

  <Step title="Migrate channel route helpers">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються як псевдоніми
    сумісності протягом вікна міграції, але нові плагіни мають використовувати назви
    маршрутів, які безпосередньо описують поведінку:

    | Старий helper | Сучасний helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні функції маршрутизації узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для нативних схвалень, приглушення відповідей, вхідної дедуплікації,
    доставки Cron і маршрутизації сесій.

    Не додавайте нові використання `ChannelMessagingAdapter.parseExplicitTarget` або
    parser-backed допоміжних функцій завантажених маршрутів (`parseExplicitTargetForLoadedChannel`
    чи `resolveRouteTargetForLoadedChannel`) або
    `resolveChannelRouteTargetWithParser(...)` з `plugin-sdk/channel-route`.
    Ці hooks застаріли й залишаються лише для старіших плагінів протягом
    вікна міграції. Нові канальні плагіни мають використовувати
    `messaging.targetResolver.resolveTarget(...)` для нормалізації target id
    і fallback у разі directory-miss, `messaging.inferTargetChatType(...)`, коли core
    потребує раннього типу peer, і `messaging.resolveOutboundSessionRoute(...)`
    для provider-native сесії та ідентичності thread.

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
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб для точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий узагальнений реекспорт для визначень/будівників точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та будівники точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Перекладач налаштування, підказки списку дозволених, будівники стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби середовища виконання під час налаштування | `createSetupTranslator`, безпечні для імпорту адаптери патчів налаштування, допоміжні засоби нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім адаптера налаштування | Використовуйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби ідентифікатора облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація ідентифікатора облікового запису |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису | Допоміжні засоби пошуку облікового запису та резервного типового значення |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікового запису | Допоміжні засоби списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви сполучення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Зв’язування префікса відповіді, індикації набору та доставки джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації та допоміжні засоби доступу DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Будівники схем конфігурації | Лише спільні примітиви схеми конфігурації каналів і універсальний будівник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише вбудовані Plugin-и, які підтримує OpenClaw; нові Plugin-и мають визначати локальні схеми Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих Plugin-ів |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного конверта | Спільні допоміжні засоби маршруту та будівника конверта |
  | `plugin-sdk/channel-inbound` | Допоміжні засоби приймання вхідних даних | Побудова контексту, форматування, корені, виконавці, підготовлена диспетчеризація відповідей і предикати диспетчеризації |
  | `plugin-sdk/messaging-targets` | Застарілий шлях імпорту розбору цілей | Використовуйте `plugin-sdk/channel-targets` для універсальних допоміжних засобів розбору цілей, `plugin-sdk/channel-route` для порівняння маршрутів і належні Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` для визначення цілей, специфічного для провайдера |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Допоміжні засоби життєвого циклу вихідних повідомлень | Адаптери повідомлень, квитанції, допоміжні засоби надійного надсилання, допоміжні засоби live preview/потокового передавання, параметри відповіді, допоміжні засоби життєвого циклу, вихідна ідентичність і планування корисного навантаження |
  | `plugin-sdk/channel-streaming` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язування потоків | Життєвий цикл прив’язування потоків і допоміжні засоби адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби корисного навантаження медіа | Будівник корисного навантаження медіа агента для застарілих компонувань полів |
  | `plugin-sdk/channel-runtime` | Застаріла прокладка сумісності | Лише застарілі утиліти середовища виконання каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання | Допоміжні засоби середовища виконання/журналювання/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища виконання | Допоміжні засоби журналера/середовища виконання, тайм-ауту, повторних спроб і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби середовища виконання Plugin | Допоміжні засоби команд/хуків/http/інтерактивності Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра хуків | Спільні допоміжні засоби конвеєра webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби ледачого середовища виконання | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби середовища виконання CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway, допоміжний засіб запуску з готовим циклом подій, визначення рекламованого хоста LAN і допоміжні засоби патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застаріла прокладка сумісності конфігурації | Віддавайте перевагу `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Резервно-стабільні допоміжні засоби перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби підказок затвердження | Корисне навантаження затвердження exec/Plugin, допоміжні засоби можливостей/профілів затвердження, нативна маршрутизація/середовище виконання затвердження та форматування структурованого шляху відображення затвердження |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби автентифікації затвердження | Визначення затверджувача, автентифікація дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта затвердження | Допоміжні засоби нативного профілю/фільтра затвердження exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки затвердження | Нативні адаптери можливостей/доставки затвердження |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway затвердження | Спільний допоміжний засіб визначення Gateway затвердження |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера затвердження | Легкі допоміжні засоби завантаження нативного адаптера затвердження для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника затвердження | Ширші допоміжні засоби середовища виконання обробника затвердження; віддавайте перевагу вужчим межам адаптера/Gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей затвердження | Нативні допоміжні засоби прив’язування цілі/облікового запису затвердження |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді затвердження | Допоміжні засоби корисного навантаження відповіді затвердження exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби контексту середовища виконання каналу | Універсальні допоміжні засоби реєстрації/отримання/відстеження контексту середовища виконання каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, шлюзування DM, обмежених коренем файлів/шляхів, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби середовища виконання SSRF | Закріплений диспетчер, захищений fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби пробудження, подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | Кеші дедуплікації в пам’яті та з підтримкою постійного сховища |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних локальних шляхів файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Допоміжні засоби політики затвердження exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби шлюзування діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/проксі | `resolveFetch`, допоміжні засоби проксі, допоміжні засоби параметрів EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби повторних спроб | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених і зіставлення введення | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюзування команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування динамічного меню аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби захисту тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільне середовище виконання відповідей | Вхідна диспетчеризація, heartbeat, планувальник відповідей, розбиття на фрагменти |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Фіналізація, диспетчеризація провайдера та допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `createChannelHistoryWindow`; застарілі експорти сумісності допоміжних засобів map, як-от `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментів відповіді | Допоміжні засоби фрагментації тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сеансів | Допоміжні засоби шляху сховища та updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Побудовники зведень статусу каналу/облікового запису, типові значення runtime-state, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розпізнавача цілі | Спільні допоміжні засоби розпізнавача цілі |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягують рядкові URL з подібних до запиту вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із тайм-аутом | Запускач команд із тайм-аутом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витяг payload інструмента | Витягує нормалізовані payload з об’єктів результатів інструмента |
  | `plugin-sdk/tool-send` | Витяг надсилання інструмента | Витягує канонічні поля цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Реєстратор підсистеми та допоміжні засоби редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби Markdown-таблиць | Допоміжні засоби режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локального/self-hosted провайдера | Допоміжні засоби виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісного self-hosted провайдера | Ті самі допоміжні засоби виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime-автентифікації провайдера | Допоміжні засоби розв’язання API-ключа під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу/API-ключа та запису профілю |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result провайдера | Стандартний побудовник auth-result OAuth |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та злиття сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var провайдера | Допоміжні засоби пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделі/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні засоби provider-endpoint і допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдерів | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні допоміжні засоби HTTP/endpoint capability провайдера, зокрема допоміжні засоби multipart-форми для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/runtime провайдера web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` і очищення схеми DeepSeek/Gemini/OpenAI + діагностика |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, витяг тексту tool-result, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/збереження медіа, визначення розмірів відео через ffprobe і побудовники медіа-payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдера розуміння медіа плюс експортовані для провайдерів допоміжні засоби зображень/аудіо |
  | `plugin-sdk/text-runtime` | Застарілий широкий експорт сумісності тексту | Використовуйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` і `logging-core` |
  | `plugin-sdk/text-chunking` | Допоміжні засоби поділу тексту на фрагменти | Допоміжний засіб поділу вихідного тексту на фрагменти |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдера мовлення плюс експортовані для провайдерів допоміжні засоби директив, реєстру, валідації та OpenAI-сумісний побудовник TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдера мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи провайдера, допоміжні засоби реєстру та спільний допоміжний засіб WebSocket-сесії |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдера, допоміжні засоби реєстру/розв’язання, допоміжні засоби мостової сесії, спільні черги agent talk-back, голосове керування active-run, стан transcript/event, приглушення відлуння, зіставлення consult-питань, координація forced-consult, відстеження turn-context, відстеження активності виводу та швидкі допоміжні засоби context consult |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдера генерації зображень плюс допоміжні засоби image asset/data URL і OpenAI-сумісний побудовник провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/скорочення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна прелюдія каналу | Спільні експорти прелюдії Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації списку дозволених | Допоміжні засоби редагування/читання конфігурації списку дозволених |
  | `plugin-sdk/group-access` | Допоміжні засоби групового доступу | Спільні допоміжні засоби рішень щодо групового доступу |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі фасади сумісності | Використовуйте `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Допоміжні засоби захисту Direct-DM | Вузькі допоміжні засоби політики докриптографічного захисту |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширення | Примітиви passive-channel/status і допоміжні примітиви ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Застарілий псевдонім шляху Webhook | Використовуйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web-медіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Застарілий повторний експорт сумісності Zod | Імпортуйте `zod` з `zod` напряму |
  | `plugin-sdk/memory-core` | Допоміжні засоби bundled memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад рушія пам’яті | Runtime-фасад індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-embedding-registry` | Реєстр embedding пам’яті | Легкі допоміжні засоби реєстру провайдерів embedding пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-рушій хоста пам’яті | Експорти foundation-рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби batch/remote; конкретні віддалені провайдери живуть у своїх Plugins-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-рушій хоста пам’яті | Експорти QMD-рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста пам’яті | Допоміжні засоби secret хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім подій пам’яті | Використовуйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні засоби CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Допоміжні засоби core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті | Допоміжні засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Застарілий псевдонім файлів/runtime пам’яті | Використовуйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого Markdown | Спільні допоміжні засоби managed-markdown для суміжних із пам’яттю Plugins |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий runtime-фасад search-manager Active Memory |
  | `plugin-sdk/memory-host-status` | Застарілий псевдонім статусу хоста пам’яті | Використовуйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Тестові утиліти | Локальний для репозиторію застарілий barrel сумісності; використовуйте сфокусовані локальні для репозиторію тестові підшляхи, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є спільною підмножиною міграції, а не повною поверхнею
SDK. Інвентар точок входу компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета генеруються з
публічної підмножини.

Зарезервовані допоміжні шви bundled-плагінів вилучено з мапи експортів
публічного SDK, за винятком явно задокументованих фасадів сумісності, як-от
застарілої прокладки `plugin-sdk/discord`, збереженої для опублікованого
пакета `@openclaw/discord@2026.3.13`. Допоміжні засоби, специфічні для
власника, містяться всередині пакета плагіна-власника; спільна поведінка хоста
має проходити через загальні контракти SDK, такі як
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і
`plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо не можете
знайти експорт, перевірте джерело в `src/plugin-sdk/` або запитайте
супровідників, який загальний контракт має ним володіти.

## Активні застаріння

Вужчі застаріння, що застосовуються в усьому SDK плагінів, контракті
провайдера, runtime-поверхні та маніфесті. Кожне з них досі працює сьогодні,
але буде вилучене в майбутньому мажорному випуску. Запис під кожним елементом
зіставляє старий API з його канонічною заміною.

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

  <Accordion title="Допоміжні засоби обмеження згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` - повертає
    один об'єкт рішення замість двох окремих викликів.

    Нижчі за потоком channel-плагіни (Slack, Discord, Matrix, MS Teams) уже
    перейшли на нього.

  </Accordion>

  <Accordion title="Прокладка runtime каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` є прокладкою сумісності для старіших
    channel-плагінів. Не імпортуйте її з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime-
    об'єктів.

    Допоміжні засоби `channelActions*` в `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими channel-експортами "actions". Натомість
    виставляйте можливості через семантичну поверхню `presentation` - channel-
    плагіни оголошують, що вони рендерять (картки, кнопки, списки вибору), а
    не які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний tool() провайдера вебпошуку → createTool() у плагіні">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider-плагіні.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки
    інструмента.

  </Accordion>

  <Accordion title="Plaintext-конверти каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского plaintext-
    конверта prompt з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Channel-плагіни прикріплюють метадані маршрутизації (тред, тема,
    відповідь на, реакції) як типізовані поля замість конкатенації їх у рядок
    prompt. Допоміжний засіб `formatAgentEnvelope(...)` досі підтримується для
    синтезованих конвертів, спрямованих до асистента, але вхідні plaintext-
    конверти поступово вилучаються.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    кастомний channel-плагін, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Хук deactivate → gateway_stop">
    **Старе**: `api.on("deactivate", handler)`.

    **Нове**: `api.on("gateway_stop", handler)`. Подія та контекст є тим самим
    контрактом очищення під час завершення роботи; змінюється лише назва хука.

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

    `deactivate` залишається підключеним як застарілий псевдонім сумісності до
    часу після 2026-08-16.

  </Accordion>

  <Accordion title="Хук subagent_spawning → прив'язка треду в core">
    **Старе**: `api.on("subagent_spawning", handler)`, що повертає
    `threadBindingReady` або `deliveryOrigin`.

    **Нове**: дозвольте core підготувати прив'язки субагента `thread: true`
    через адаптер прив'язки сесії каналу. Використовуйте
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` залишаються лише як
    застарілі поверхні сумісності, доки зовнішні плагіни мігрують.

  </Accordion>

  <Accordion title="Типи виявлення провайдера → типи каталогу провайдера">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий псевдонім          | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` - provider-плагіни
    мають використовувати явні хуки провайдера, такі як `buildReplayPolicy`,
    `normalizeToolSchemas` і `wrapStreamFn`, а не статичний об'єкт.

  </Accordion>

  <Accordion title="Хуки політики мислення → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі
    збережені значення за рангом профілю.

    Контекст містить `provider`, `modelId`, необов'язково об'єднаний
    `reasoning` і необов'язково об'єднані факти `compat` моделі. Provider-
    плагіни можуть використовувати ці факти каталогу, щоб виставляти профіль,
    специфічний для моделі, лише коли налаштований контракт запиту це
    підтримує.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати
    протягом вікна застаріння, але не компонуються з результатом профілю.

  </Accordion>

  <Accordion title="Зовнішні auth-провайдери → contracts.externalAuthProviders">
    **Старе**: реалізація зовнішніх auth-хуків без оголошення провайдера в
    маніфесті плагіна.

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

  <Accordion title="Пошук env-var провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у
    `setup.providers[].envVars` у маніфесті. Це консолідує метадані env для
    setup/status в одному місці та уникає запуску runtime плагіна лише для
    відповіді на пошуки env-var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності,
    доки вікно застаріння не закриється.

  </Accordion>

  <Accordion title="Реєстрація memory-плагіна → registerMemoryCapability">
    **Старе**: три окремі виклики -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Адитивні допоміжні засоби prompt і
    корпусу (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    не зачеплені.

  </Accordion>

  <Accordion title="API провайдера embedding для memory">
    **Старе**: `api.registerMemoryEmbeddingProvider(...)` плюс
    `contracts.memoryEmbeddingProviders`.

    **Нове**: `api.registerEmbeddingProvider(...)` плюс
    `contracts.embeddingProviders`.

    Загальний контракт embedding-провайдера придатний для повторного
    використання поза memory і є підтримуваним шляхом для нових провайдерів.
    API реєстрації, специфічний для memory, залишається підключеним як
    застаріла сумісність, доки наявні провайдери мігрують. Інспекція плагінів
    повідомляє про використання не-bundled плагінами як борг сумісності.

  </Accordion>

  <Accordion title="Типи повідомлень сесії субагента перейменовано">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` застарів на користь `getSessionMessages`. Та
    сама сигнатура; старий метод викликає новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (однина) повертав live-аксесор task-flow.

    **Нове**: `runtime.tasks.managedFlows` зберігає runtime мутацій керованого
    TaskFlow для плагінів, які створюють, оновлюють, скасовують або запускають
    дочірні задачі з flow. Використовуйте `runtime.tasks.flows`, коли плагіну
    потрібні лише читання на основі DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Вбудовані фабрики розширень → middleware результатів інструментів агента">
    Описано вище в "Як мігрувати → Мігруйте вбудовані розширення результатів
    інструментів на middleware". Додано тут для повноти: вилучений шлях лише
    для embedded-runner `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime у
    `contracts.agentToolResultMiddleware`.
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
Застаріння рівня розширень (усередині bundled channel/provider-плагінів у
`extensions/`) відстежуються всередині їхніх власних barrel-файлів `api.ts` і
`runtime-api.ts`. Вони не впливають на контракти сторонніх плагінів і тут не
перелічені. Якщо ви споживаєте локальний barrel bundled-плагіна напряму,
прочитайте коментарі про застаріння в цьому barrel перед оновленням.
</Note>

## Графік вилучення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Зараз**              | Застарілі інтерфейси видають попередження під час виконання            |
| **Наступний мажорний реліз** | Застарілі інтерфейси буде вилучено; Plugin-и, які досі їх використовують, не працюватимуть |

Усі основні Plugin-и вже мігровано. Зовнішні Plugin-и мають мігрувати
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища під час роботи над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий запасний вихід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) - створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) - повний довідник імпортів підшляхів
- [Plugin-и каналів](/uk/plugins/sdk-channel-plugins) - створення Plugin-ів каналів
- [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins) - створення Plugin-ів провайдерів
- [Внутрішня архітектура Plugin-ів](/uk/plugins/architecture) - поглиблений огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) - довідник схеми маніфесту
