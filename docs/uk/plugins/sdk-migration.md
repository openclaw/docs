---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Міграція із застарілого шару зворотної сумісності на сучасний SDK Plugin
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:31:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із цільовими, задокументованими імпортами. Якщо ваш плагін було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широко відкриті поверхні, які дозволяли плагінам імпортувати все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** - єдиний імпорт, який реекспортував десятки
  допоміжних функцій. Його було введено, щоб старі плагіни на основі хуків продовжували працювати, поки створювалася
  нова архітектура плагінів.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий набір runtime-допоміжних засобів, який
  змішував системні події, стан Heartbeat, черги доставки, допоміжні засоби fetch/proxy,
  файлові допоміжні засоби, типи схвалення та непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** - широкий набір для сумісності конфігурації,
  який досі містить застарілі прямі допоміжні засоби завантаження/запису під час вікна
  міграції.
- **`openclaw/extension-api`** - міст, який давав плагінам прямий доступ до
  допоміжних засобів на боці хоста, як-от вбудований запуск агентів.
- **`api.registerEmbeddedExtensionFactory(...)`** - вилучений хук комплектного
  розширення лише для вбудованого запуску, який міг спостерігати події вбудованого запуску, як-от
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони досі працюють під час виконання,
але нові плагіни не повинні їх використовувати, а наявні плагіни мають мігрувати до того, як
наступний major-реліз їх вилучить. API реєстрації фабрики розширень лише для вбудованого запуску
було вилучено; натомість використовуйте middleware для результатів інструментів.

OpenClaw не вилучає й не переінтерпретовує задокументовану поведінку плагінів у тій самій
зміні, яка вводить заміну. Критичні зміни контракту мають спочатку пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки
реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде вилучено в майбутньому major-релізі.
  Плагіни, які досі імпортують із цих поверхонь, зламаються, коли це станеться.
  Застарілі реєстрації фабрик вбудованих розширень уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** - імпорт одного допоміжного засобу завантажував десятки непов’язаних модулів
- **Циклічні залежності** - широкі реекспорти спрощували створення циклів імпорту
- **Нечітка поверхня API** - не було способу визначити, які експорти стабільні, а які внутрішні

Сучасний SDK плагінів це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні шви провайдерів для комплектних каналів також вилучено.
Допоміжні шви з брендуванням каналів були приватними скороченнями монорепозиторію, а не стабільними
контрактами плагінів. Натомість використовуйте вузькі універсальні підшляхи SDK. Усередині комплектного
робочого простору плагіна тримайте допоміжні засоби, що належать провайдеру, у власному `api.ts` або
`runtime-api.ts` цього плагіна.

Поточні приклади комплектних провайдерів:

- Anthropic тримає специфічні для Claude stream-допоміжні засоби у власному шві `api.ts` /
  `contract-api.ts`
- OpenAI тримає builder-и провайдера, допоміжні засоби моделі за замовчуванням і builder-и realtime-провайдера
  у власному `api.ts`
- OpenRouter тримає builder провайдера та допоміжні засоби onboarding/config у власному
  `api.ts`

## План міграції Talk і голосу в реальному часі

Код голосу в реальному часі, телефонії, зустрічей і браузерного Talk переходить від
локального для поверхні обліку turn до спільного контролера сеансів Talk, який експортується з
`openclaw/plugin-sdk/realtime-voice`. Новий контролер володіє спільною
оболонкою подій Talk, активним станом turn, станом захоплення, станом вихідного аудіо, нещодавньою
історією подій і відхиленням застарілих turn. Плагіни провайдерів мають і далі володіти
vendor-специфічними realtime-сеансами; плагіни поверхонь мають і далі володіти захопленням,
відтворенням, телефонією та особливостями зустрічей.

Ця міграція Talk навмисно є чистою і з breaking-змінами:

1. Тримайте спільні примітиви контролера/runtime у
   `plugin-sdk/realtime-voice`.
2. Переведіть комплектні поверхні на спільний контролер: браузерний relay,
   передавання managed-room, voice-call realtime, voice-call streaming STT, Google
   Meet realtime і нативний push-to-talk.
3. Замініть старі сімейства RPC Talk на фінальні API `talk.session.*` і
   `talk.client.*`.
4. Оголосіть один live-канал подій Talk у Gateway
   `hello-ok.features.events`: `talk.event`.
5. Видаліть старий realtime HTTP endpoint і будь-який шлях перевизначення інструкцій
   під час запиту.

Новий код не повинен викликати `createTalkEventSequencer(...)` напряму, якщо він не
реалізує низькорівневий адаптер або тестову фікстуру. Надавайте перевагу спільному контролеру,
щоб події в межах turn не могли надсилатися без turn id, застарілі виклики `turnEnd` /
`turnCancel` не могли очистити новіший активний turn, а події життєвого циклу вихідного аудіо
залишалися узгодженими для телефонії, зустрічей, браузерного relay, передавання managed-room
і нативних клієнтів Talk.

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

Сеанси WebRTC/provider-websocket, якими володіє браузер, використовують `talk.client.create`,
тому що браузер володіє узгодженням провайдера та медіатранспортом, тоді як
Gateway володіє обліковими даними, інструкціями та політикою інструментів. `talk.session.*` є
спільною поверхнею під керуванням Gateway для gateway-relay realtime, gateway-relay
транскрипції та нативних STT/TTS-сеансів managed-room.

Застарілі конфігурації, які розміщували realtime-селектори поруч із `talk.provider` /
`talk.providers`, слід виправити за допомогою `openclaw doctor --fix`; runtime Talk
не переінтерпретовує конфігурацію провайдера speech/TTS як конфігурацію realtime-провайдера.

Підтримувані комбінації `talk.session.create` навмисно невеликі:

| Режим           | Транспорт       | Brain           | Власник            | Примітки                                                                                                          |
| --------------- | --------------- | --------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Повнодуплексне аудіо провайдера передається через Gateway; виклики інструментів маршрутизуються через інструмент agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Лише потоковий STT; викликачі надсилають вхідне аудіо й отримують події transcript.                              |
| `stt-tts`       | `managed-room`  | `agent-consult` | Нативна/клієнтська кімната | Кімнати в стилі push-to-talk і walkie-talkie, де клієнт володіє захопленням/відтворенням, а Gateway володіє станом turn. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Нативна/клієнтська кімната | Режим кімнати лише для адміністраторів для довірених first-party поверхонь, які виконують дії інструментів Gateway напряму. |

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

  | Метод                           | Застосовується до                                      | Контракт                                                                                                                                                                                                  |
  | ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Додати аудіофрагмент base64 PCM до сеансу провайдера, що належить тому самому підключенню Gateway.                                                                                                        |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Розпочати хід користувача в керованій кімнаті.                                                                                                                                                            |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершити активний хід після перевірки застарілого ходу.                                                                                                                                                  |
  | `talk.session.cancelTurn`       | усі сеанси, якими володіє Gateway                       | Скасувати активну роботу захоплення/провайдера/агента/TTS для ходу.                                                                                                                                       |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Зупинити аудіовихід асистента без обов’язкового завершення ходу користувача.                                                                                                                              |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершити виклик інструмента провайдера, створений релеєм; передайте `options.willContinue` для проміжного виводу або `options.suppressResponse`, щоб задовольнити виклик без іншої відповіді асистента. |
  | `talk.session.steer`            | сеанси Talk з агентною підтримкою                       | Надіслати усний керівний сигнал `status`, `steer`, `cancel` або `followup` до активного вбудованого запуску, визначеного із сеансу Talk.                                                                  |
  | `talk.session.close`            | усі уніфіковані сеанси                                  | Зупинити релейні сеанси або відкликати стан керованої кімнати, а потім забути ідентифікатор уніфікованого сеансу.                                                                                         |

  Не вводьте в ядрі спеціальні випадки для провайдера або платформи, щоб це працювало.
  Ядро володіє семантикою сеансів Talk. Provider plugins володіють налаштуванням сеансів постачальників.
  Голосові виклики та Google Meet володіють адаптерами телефонії/зустрічей. Браузерні й нативні
  застосунки володіють UX захоплення/відтворення пристрою.

  ## Політика сумісності

  Для зовнішніх plugins робота із сумісністю відбувається в такому порядку:

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
  покладалося на ad hoc пошуки. Зарезервовані підшляхи SDK повинні мати відстежене використання власниками;
  невикористані зарезервовані експорти helper слід видалити з публічного SDK.

  Якщо поле маніфесту все ще приймається, автори plugins можуть продовжувати його використовувати, доки
  документація та діагностика не скажуть інакше. Новий код має надавати перевагу задокументованій
  заміні, але наявні plugins не мають ламатися під час звичайних minor-релізів.

  ## Як мігрувати

  <Steps>
  <Step title="Мігруйте helper для завантаження/запису runtime-конфігурації">
    Вбудованим plugins слід припинити викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)` напряму. Надавайте перевагу конфігурації, яку вже
    передано в активний шлях виклику. Довготривалі обробники, яким потрібен
    поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довготривалі
    інструменти агента повинні використовувати `ctx.getRuntimeConfig()` з контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе ще бачив оновлену
    runtime-конфігурацію.

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

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли викликаюча сторона знає,
    що зміна потребує чистого перезапуску gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликаюча сторона володіє
    подальшими діями та навмисно хоче приглушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими helper сумісності
    для зовнішніх plugins протягом вікна міграції та один раз попереджають із
    кодом сумісності `runtime-config-load-write`. Вбудовані plugins і runtime-код
    репозиторію захищені scanner guardrails у
    `pnpm check:deprecated-api-usage` і
    `pnpm check:no-runtime-action-load-config`: нове production-використання plugin
    одразу падає, прямі записи конфігурації падають, методи gateway server мають використовувати
    runtime-знімок запиту, runtime helper для надсилання/дії/клієнта каналів
    мають отримувати конфігурацію зі своєї межі, а довготривалі runtime-модулі мають
    нуль дозволених ambient-викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    compatibility barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, що відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Уже завантажені твердження конфігурації та пошук plugin-entry конфігурації | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime-знімка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Helper сховища сеансів | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація Markdown-таблиці | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime helper для групової політики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделі/сеансу | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані plugins та їхні тести захищені сканером від широкого
    barrel, щоб імпорти й моки залишалися локальними для потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен
    залежати від нього.

  </Step>

  <Step title="Мігруйте вбудовані розширення результатів інструментів на middleware">
    Вбудовані plugins мають замінити обробники результатів інструментів
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

    Установлені plugins також можуть реєструвати middleware результатів інструментів, коли вони
    явно ввімкнені та оголошують кожен цільовий runtime у
    `contracts.agentToolResultMiddleware`. Неоголошені реєстрації встановленого middleware
    відхиляються.

  </Step>

  <Step title="Мігруйте approval-native обробники на capability facts">
    Канальні plugins з підтримкою approvals тепер надають нативну поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний registry runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі старого підключення `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render на `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout каналу; hooks auth для approval
      там більше не читаються ядром
    - Реєструйте runtime-об’єкти, якими володіє канал, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте plugin-owned повідомлення про reroute з нативних approval handlers;
      ядро тепер володіє routed-elsewhere повідомленнями з фактичних результатів delivery
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточного layout approval capability.

  </Step>

  <Step title="Аудит fallback-поведінки Windows wrapper">
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

    Якщо ваша викликаюча сторона не покладається навмисно на shell fallback, не встановлюйте
    `allowShellFallback` і натомість обробіть викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Пошукайте у своєму Plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на сфокусовані імпорти">
    Кожен export зі старої поверхні відповідає конкретному сучасному шляху імпорту:

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

    Для host-side helper використовуйте injected plugin runtime замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується до інших застарілих допоміжних засобів bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні засоби сховища сеансів | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` досі існує для зовнішньої
    сумісності, але новий код має імпортувати цільову поверхню допоміжних засобів,
    яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби пробудження, подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в пам'яті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Допоміжні засоби безпечних шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби проксі та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запитів/розв'язання схвалень | `openclaw/plugin-sdk/approval-runtime` |
    | Корисне навантаження відповіді на схвалення та допоміжні засоби команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальне для процесу асинхронне блокування | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові блокування | `openclaw/plugin-sdk/file-lock` |

    Вбудовані плагіни захищені сканером від `infra-runtime`, тож код репозиторію
    не може повернутися до широкого barrel.

  </Step>

  <Step title="Мігруйте допоміжні засоби маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються сумісними
    псевдонімами протягом вікна міграції, але нові плагіни мають використовувати назви маршрутів,
    які прямо описують поведінку:

    | Старий допоміжний засіб | Сучасний допоміжний засіб |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні засоби маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для нативних схвалень, приглушення відповідей, вхідної дедуплікації,
    доставки cron і маршрутизації сеансів.

    Не додавайте нові використання `ChannelMessagingAdapter.parseExplicitTarget` або
    допоміжних засобів loaded-route на основі парсера (`parseExplicitTargetForLoadedChannel`
    чи `resolveRouteTargetForLoadedChannel`) або
    `resolveChannelRouteTargetWithParser(...)` з `plugin-sdk/channel-route`.
    Ці hooks застарілі й залишаються лише для старіших плагінів протягом
    вікна міграції. Нові плагіни каналів мають використовувати
    `messaging.targetResolver.resolveTarget(...)` для нормалізації ідентифікатора цілі
    та fallback у разі промаху каталогу, `messaging.inferTargetChatType(...)`, коли core
    потребує раннього типу peer, і `messaging.resolveOutboundSessionRoute(...)`
    для нативної для провайдера ідентичності сеансу й thread.

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
  | `plugin-sdk/core` | Застарілий парасольковий реекспорт для визначень/будівників входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб входу одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення входу каналу та будівники | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Перекладач налаштування, запити списку дозволених, будівники стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | `createSetupTranslator`, безпечні для імпорту адаптери патчів налаштування, допоміжні засоби приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Застарілий псевдонім адаптера налаштування | Використовуйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікового запису + стандартного fallback |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви спарювання DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, індикація набору та зв’язування доставки джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації та допоміжні засоби доступу DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Будівники схем конфігурації | Спільні примітиви схеми конфігурації каналу та лише загальний будівник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише вбудовані plugins, підтримувані OpenClaw; нові plugins мають визначати локальні для Plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих plugins |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назви команди, обрізання опису, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного envelope | Спільні допоміжні засоби маршруту + будівника envelope |
  | `plugin-sdk/channel-inbound` | Допоміжні засоби вхідного отримання | Побудова контексту, форматування, корені, виконавці, підготовлена відправка відповіді та предикати відправки |
  | `plugin-sdk/messaging-targets` | Застарілий шлях імпорту парсингу цілей | Використовуйте `plugin-sdk/channel-targets` для загальних допоміжних засобів парсингу цілей, `plugin-sdk/channel-route` для порівняння маршрутів і належні Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` для розв’язання цілей, специфічного для провайдера |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Допоміжні засоби життєвого циклу вихідних повідомлень | Адаптери повідомлень, квитанції, допоміжні засоби надійного надсилання, допоміжні засоби live preview/streaming, параметри відповіді, допоміжні засоби життєвого циклу, вихідна ідентичність і планування payload |
  | `plugin-sdk/channel-streaming` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Застарілий фасад сумісності | Використовуйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки потоків | Життєвий цикл прив’язки потоків і допоміжні засоби адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Будівник agent media payload для застарілих розкладок полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/backup/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env runtime | Logger/runtime env, timeout, retry та backoff helpers |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/hooks/http/interactive Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hooks | Спільні допоміжні засоби конвеєра webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway, допоміжний засіб запуску з готовим event loop і допоміжні засоби патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Fallback-стабільні допоміжні засоби перевірки команд Telegram, коли вбудована поверхня контракту Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів схвалення | Payload схвалення exec/Plugin, допоміжні засоби capability/profile для схвалення, нативні допоміжні засоби маршрутизації/runtime схвалень і форматування шляху структурованого відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth схвалення | Розв’язання approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Нативні допоміжні засоби profile/filter схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки схвалення | Нативні адаптери capability/delivery схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби gateway схвалення | Спільний допоміжний засіб розв’язання gateway схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалення | Легкі допоміжні засоби завантаження нативного адаптера схвалення для гарячих entrypoints каналів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалення | Ширші допоміжні засоби runtime обробника схвалення; надавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі схвалення | Нативні допоміжні засоби прив’язки цілі/облікового запису схвалення |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді схвалення | Допоміжні засоби payload відповіді схвалення exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context каналу | Загальні допоміжні засоби register/get/watch runtime-context каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, DM gating, обмежених коренем файлів/шляхів, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Pinned-dispatcher, guarded fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Heartbeat wake, event і visibility helpers |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory dedupe caches |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних шляхів локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Допоміжні засоби політики схвалення exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби gating діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy, допоміжні засоби параметрів EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, policy runners |
  | `plugin-sdk/allow-from` | Форматування списку дозволених і мапінг введення | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Command gating і допоміжні засоби command-surface | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Парсинг введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідна відправка, Heartbeat, планувальник відповіді, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби відправки відповіді | Завершення, відправка провайдера та допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `createChannelHistoryWindow`; застарілі експорти сумісності map-helper, як-от `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментів відповіді | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів state і OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключів сеансів | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключів сеансів |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Збирачі підсумків статусу каналу/облікового запису, стандартні значення стану середовища виконання, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розпізнавача цілі | Спільні допоміжні засоби розпізнавача цілі |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витяг рядкових URL з вхідних даних, подібних до запиту |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із тайм-аутом | Запускач команд із тайм-аутом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витяг корисного навантаження інструмента | Витяг нормалізованих корисних навантажень з об’єктів результатів інструмента |
  | `plugin-sdk/tool-send` | Витяг надсилання інструмента | Витяг канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Допоміжні засоби журналера підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби Markdown-таблиць | Допоміжні засоби режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповіді на повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Підібрані допоміжні засоби налаштування локального/самостійно розміщеного провайдера | Допоміжні засоби виявлення/налаштування самостійно розміщеного провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування OpenAI-сумісного самостійно розміщеного провайдера | Ті самі допоміжні засоби виявлення/налаштування самостійно розміщеного провайдера |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби автентифікації провайдера в середовищі виконання | Допоміжні засоби розпізнавання API-ключа в середовищі виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу/запису профілю для API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результату автентифікації провайдера | Стандартний збирач результату OAuth-автентифікації |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та злиття необробленої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var провайдера | Допоміжні засоби пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/повторного відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні збирачі політик повторного відтворення, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдерів | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні допоміжні засоби можливостей HTTP/endpoint провайдера, зокрема допоміжні засоби multipart-форми для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу web-fetch провайдера |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/середовища виконання web-search провайдера |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` і очищення схем DeepSeek/Gemini/OpenAI + діагностика |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Допоміжні засоби нативного транспорту провайдера, як-от захищений fetch, витяг тексту результату інструмента, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/збереження медіа, перевірка розмірів відео на базі ffprobe та збирачі корисного навантаження медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби відмовостійкого перемикання, вибору кандидатів і повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдерів розуміння медіа плюс експорти допоміжних засобів зображень/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Застарілий широкий експорт сумісності тексту | Використовуйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` і `logging-core` |
  | `plugin-sdk/text-chunking` | Допоміжні засоби фрагментації тексту | Допоміжний засіб фрагментації вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення плюс директива, реєстр, допоміжні засоби валідації для провайдерів і OpenAI-сумісний збирач TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрибування в реальному часі | Типи провайдерів, допоміжні засоби реєстру та спільний допоміжний засіб сеансу WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдерів, допоміжні засоби реєстру/розпізнавання, допоміжні засоби bridge-сеансу, спільні черги відповіді голосом агента, керування голосом активного запуску, справність transcript/event, придушення echo, зіставлення consult-питань, координація forced-consult, відстеження контексту ходу, відстеження активності виводу та допоміжні засоби швидкого context consult |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдерів генерації зображень плюс допоміжні засоби URL ресурсів/даних зображень і OpenAI-сумісний збирач провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, відмовостійке перемикання, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби відмовостійкого перемикання, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби відмовостійкого перемикання, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/скорочення корисного навантаження інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви схеми конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експорти преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби знімка/підсумку статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби групового доступу | Спільні допоміжні засоби рішень щодо групового доступу |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Застарілі фасади сумісності | Використовуйте `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Допоміжні засоби guard для Direct-DM | Вузькі допоміжні засоби pre-crypto guard policy |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширення | Примітиви пасивного каналу/статусу та ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Застарілий псевдонім шляху Webhook | Використовуйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Застарілий повторний експорт сумісності Zod | Імпортуйте `zod` з `zod` напряму |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання рушія пам’яті | Фасад середовища виконання індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-embedding-registry` | Реєстр embedding пам’яті | Легкі допоміжні засоби реєстру провайдерів embedding пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-рушій хоста пам’яті | Експорти foundation-рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-рушій хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби batch/remote; конкретні віддалені провайдери живуть у власних plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-рушій хоста пам’яті | Експорти QMD-рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Застарілий псевдонім подій пам’яті | Використовуйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Середовище виконання CLI хоста пам’яті | Допоміжні засоби середовища виконання CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Середовище виконання ядра хоста пам’яті | Допоміжні засоби середовища виконання ядра хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста пам’яті | Допоміжні засоби файлів/середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім середовища виконання ядра хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів середовища виконання ядра хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Застарілий псевдонім файлів/середовища виконання пам’яті | Використовуйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для суміжних із пам’яттю plugins |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад середовища виконання менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Застарілий псевдонім статусу хоста пам’яті | Використовуйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Тестові утиліти | Repo-local застарілий barrel сумісності; використовуйте сфокусовані repo-local тестові підшляхи, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є спільною підмножиною міграції, а не повною
поверхнею SDK. Інвентар точок входу компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета генеруються з
публічної підмножини.

Зарезервовані допоміжні точки інтеграції для вбудованих плагінів вилучено з
публічної карти експортів SDK, окрім явно задокументованих фасадів сумісності,
як-от застарілого shim `plugin-sdk/discord`, збереженого для опублікованого
пакета `@openclaw/discord@2026.3.13`. Специфічні для власника допоміжні
засоби містяться всередині пакета плагіна-власника; спільна поведінка хоста
має проходити через загальні контракти SDK, як-от
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і
`plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо не можете
знайти експорт, перевірте вихідний код у `src/plugin-sdk/` або запитайте
супровідників, якому загальному контракту він має належати.

## Активні застарілі API

Вужчі застарілі API, що застосовуються в SDK плагінів, контракті провайдера,
runtime-поверхні та маніфесті. Кожен із них досі працює сьогодні, але буде
вилучений у майбутньому мажорному релізі. Запис під кожним елементом зіставляє
старий API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="допоміжні збирачі command-auth → command-status">
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

  <Accordion title="допоміжні засоби керування згадками → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` - повертає
    один об'єкт рішення замість двох розділених викликів.

    Низхідні плагіни каналів (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="shim runtime каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` є shim сумісності для старіших
    плагінів каналів. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime-
    об'єктів.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застарілі разом із сирими експортами каналу "actions". Натомість
    оголошуйте можливості через семантичну поверхню `presentation` - плагіни
    каналів декларують, що вони рендерять (картки, кнопки, вибірки), а не які
    сирі назви дій приймають.

  </Accordion>

  <Accordion title="допоміжний tool() провайдера вебпошуку → createTool() у плагіні">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в плагіні провайдера.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки
    інструмента.

  </Accordion>

  <Accordion title="текстові конверти каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского текстового
    конверта prompt із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Плагіни каналів додають метадані маршрутизації (гілка, тема, відповідь на,
    реакції) як типізовані поля замість конкатенації їх у рядок prompt. Допоміжний
    засіб `formatAgentEnvelope(...)` досі підтримується для синтезованих
    конвертів, спрямованих до асистента, але вхідні текстові конверти
    поступово виводяться з використання.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    кастомний плагін каналу, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Старе**: `api.on("deactivate", handler)`.

    **Нове**: `api.on("gateway_stop", handler)`. Подія та контекст є тим самим
    контрактом очищення під час завершення роботи; змінюється лише назва hook.

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

  <Accordion title="hook subagent_spawning → прив'язування гілки в core">
    **Старе**: `api.on("subagent_spawning", handler)`, що повертає
    `threadBindingReady` або `deliveryOrigin`.

    **Нове**: дозвольте core підготувати прив'язування субагента `thread: true`
    через адаптер прив'язування сесії каналу. Використовуйте
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
    застарілі поверхні сумісності, поки зовнішні плагіни мігрують.

  </Accordion>

  <Accordion title="типи виявлення провайдерів → типи каталогу провайдерів">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий псевдонім          | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` - плагіни
    провайдерів мають використовувати явні hooks провайдера, як-от
    `buildReplayPolicy`, `normalizeToolSchemas` і `wrapStreamFn`, замість
    статичного об'єкта.

  </Accordion>

  <Accordion title="hooks політики мислення → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі збережені
    значення за рангом профілю.

    Контекст містить `provider`, `modelId`, необов'язкове об'єднане
    `reasoning` і необов'язкові об'єднані факти `compat` моделі. Плагіни
    провайдерів можуть використовувати ці факти каталогу, щоб надавати
    специфічний для моделі профіль лише тоді, коли налаштований контракт
    запиту це підтримує.

    Реалізуйте один hook замість трьох. Застарілі hooks продовжують працювати
    протягом вікна застарівання, але не компонуються з результатом профілю.

  </Accordion>

  <Accordion title="зовнішні провайдери автентифікації → contracts.externalAuthProviders">
    **Старе**: реалізація hooks зовнішньої автентифікації без оголошення
    провайдера в маніфесті плагіна.

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

  <Accordion title="пошук env-var провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у
    `setup.providers[].envVars` у маніфесті. Це консолідує env-метадані
    setup/status в одному місці й уникає запуску runtime плагіна лише для
    відповідей на запити пошуку env-var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності,
    доки не закриється вікно застарівання.

  </Accordion>

  <Accordion title="реєстрація плагіна пам'яті → registerMemoryCapability">
    **Старе**: три окремі виклики -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові допоміжні засоби prompt і
    корпусу (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    не зачіпаються.

  </Accordion>

  <Accordion title="API провайдера embedding для пам'яті">
    **Старе**: `api.registerMemoryEmbeddingProvider(...)` плюс
    `contracts.memoryEmbeddingProviders`.

    **Нове**: `api.registerEmbeddingProvider(...)` плюс
    `contracts.embeddingProviders`.

    Загальний контракт провайдера embedding придатний для повторного
    використання поза пам'яттю і є підтримуваним шляхом для нових провайдерів.
    Специфічний для пам'яті API реєстрації залишається підключеним як
    застаріла сумісність, поки наявні провайдери мігрують. Інспекція плагінів
    повідомляє про невбудоване використання як борг сумісності.

  </Accordion>

  <Accordion title="типи повідомлень сесії субагента перейменовано">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` застарілий на користь `getSessionMessages`.
    Та сама сигнатура; старий метод викликає новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (однина) повертав живий accessor task-flow.

    **Нове**: `runtime.tasks.managedFlows` зберігає managed TaskFlow mutation
    runtime для плагінів, які створюють, оновлюють, скасовують або запускають
    дочірні завдання з flow. Використовуйте `runtime.tasks.flows`, коли плагіну
    потрібні лише читання на основі DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="фабрики вбудованих розширень → middleware результатів інструментів агента">
    Описано вище в "Як мігрувати → Мігруйте вбудовані розширення результатів
    інструментів до middleware". Додано тут для повноти: вилучений шлях лише
    для embedded-runner `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime у
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="псевдонім OpenClawSchemaType → OpenClawConfig">
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
Застарілі API рівня розширень (усередині вбудованих плагінів
каналів/провайдерів під `extensions/`) відстежуються у власних barrels
`api.ts` і `runtime-api.ts`. Вони не впливають на контракти сторонніх
плагінів і не перелічені тут. Якщо ви напряму використовуєте локальний barrel
вбудованого плагіна, прочитайте коментарі про застарівання в цьому barrel перед
оновленням.
</Note>

## Графік вилучення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні видають попередження під час виконання               |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; Plugin-и, які все ще їх використовують, не працюватимуть |

Усі основні Plugin-и вже перенесено. Зовнішні Plugin-и мають мігрувати
до наступного мажорного релізу.

## Тимчасове придушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний механізм, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) - створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) - повний довідник імпортів підшляхів
- [Plugin-и каналів](/uk/plugins/sdk-channel-plugins) - створення Plugin-ів каналів
- [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins) - створення Plugin-ів провайдерів
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) - поглиблений огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) - довідник схеми маніфесту
