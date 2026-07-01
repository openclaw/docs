---
read_when:
    - Вы видите предупреждение OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Вы видите предупреждение OPENCLAW_EXTENSION_API_DEPRECATED
    - Вы использовали api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Вы обновляете Plugin до современной архитектуры Plugin
    - Вы поддерживаете внешний Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдите с устаревшего слоя обратной совместимости на современный SDK Plugin
title: Миграция Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:16:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перешел от широкого слоя обратной совместимости к современной архитектуре Plugin
с точечными, документированными импортами. Если ваш Plugin был создан до
новой архитектуры, это руководство поможет выполнить миграцию.

## Что меняется

Старая система Plugin предоставляла две широко открытые поверхности, которые позволяли Plugin импортировать
все необходимое из одной точки входа:

- **`openclaw/plugin-sdk/compat`** - единый импорт, который повторно экспортировал десятки
  вспомогательных функций. Он был введен, чтобы старые Plugin на основе хуков продолжали работать, пока
  создавалась новая архитектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий runtime-barrel со вспомогательными средствами, который
  смешивал системные события, состояние Heartbeat, очереди доставки, вспомогательные средства fetch/proxy,
  файловые вспомогательные средства, типы approvals и несвязанные утилиты.
- **`openclaw/plugin-sdk/config-runtime`** - широкий barrel совместимости конфигурации,
  который все еще содержит устаревшие прямые вспомогательные средства загрузки/записи на время
  окна миграции.
- **`openclaw/extension-api`** - мост, который давал Plugin прямой доступ к
  вспомогательным средствам на стороне хоста, таким как встроенный runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** - удаленный хук bundled extension только для embedded-runner,
  который мог наблюдать события embedded-runner, такие как
  `tool_result`.

Широкие поверхности импорта теперь **устарели**. Они все еще работают во время выполнения,
но новые Plugin не должны их использовать, а существующим Plugin следует мигрировать до того, как
следующий major release их удалит. API регистрации extension factory только для embedded-runner
удален; вместо него используйте middleware для результатов инструментов.

OpenClaw не удаляет и не переинтерпретирует документированное поведение Plugin в том же
изменении, которое вводит замену. Ломающие изменения контрактов сначала должны пройти через
адаптер совместимости, диагностику, документацию и окно устаревания.
Это относится к импортам SDK, полям manifest, setup API, хукам и поведению
runtime-регистрации.

<Warning>
  Слой обратной совместимости будет удален в будущем major release.
  Plugin, которые все еще импортируют из этих поверхностей, сломаются, когда это произойдет.
  Устаревшие регистрации embedded extension factory уже больше не загружаются.
</Warning>

## Почему это изменилось

Старый подход создавал проблемы:

- **Медленный запуск** - импорт одного вспомогательного средства загружал десятки несвязанных модулей
- **Циклические зависимости** - широкие повторные экспорты упрощали создание циклов импорта
- **Неясная поверхность API** - невозможно было понять, какие экспорты стабильны, а какие внутренние

Современный SDK Plugin исправляет это: каждый путь импорта (`openclaw/plugin-sdk/\<subpath\>`)
является небольшим, самодостаточным модулем с ясным назначением и документированным контрактом.

Устаревшие удобные provider-seam для bundled channels также удалены.
Channel-branded вспомогательные seam были приватными shortcut внутри monorepo, а не стабильными
контрактами Plugin. Вместо них используйте узкие generic subpath SDK. Внутри bundled
рабочей области Plugin держите provider-owned вспомогательные средства в собственном `api.ts` или
`runtime-api.ts` этого Plugin.

Текущие примеры bundled providers:

- Anthropic держит специфичные для Claude вспомогательные средства stream в собственном seam `api.ts` /
  `contract-api.ts`
- OpenAI держит provider builders, вспомогательные средства default-model и realtime provider
  builders в собственном `api.ts`
- OpenRouter держит provider builder и вспомогательные средства onboarding/config в собственном
  `api.ts`

## План миграции Talk и голоса в реальном времени

Код realtime voice, telephony, meeting и browser Talk переносится с
локального для поверхности учета turn на общий контроллер Talk session, экспортируемый из
`openclaw/plugin-sdk/realtime-voice`. Новый контроллер владеет общим envelope событий Talk,
состоянием active turn, состоянием capture, состоянием output-audio, недавней
историей событий и отклонением stale-turn. Provider Plugin должны по-прежнему владеть
vendor-specific realtime sessions; surface Plugin должны по-прежнему владеть особенностями capture,
playback, telephony и meeting.

Эта миграция Talk намеренно выполняется как чистое ломающие изменение:

1. Сохранить общий controller/runtime primitives в
   `plugin-sdk/realtime-voice`.
2. Перевести bundled surfaces на общий контроллер: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime и native push-to-talk.
3. Заменить старые семейства Talk RPC на финальный API `talk.session.*` и
   `talk.client.*`.
4. Объявить один live-канал событий Talk в Gateway
   `hello-ok.features.events`: `talk.event`.
5. Удалить старый realtime HTTP endpoint и любой путь request-time instruction
   override.

Новый код не должен вызывать `createTalkEventSequencer(...)` напрямую, если только он не
реализует низкоуровневый adapter или test fixture. Предпочитайте общий контроллер,
чтобы события в области turn нельзя было отправить без turn id, stale-вызовы `turnEnd` /
`turnCancel` не могли очистить более новый active turn, а события жизненного цикла output-audio
оставались согласованными в telephony, meetings, browser relay, managed-room
handoff и native Talk clients.

Целевая форма публичного API:

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

Browser-owned WebRTC/provider-websocket sessions используют `talk.client.create`,
потому что browser владеет provider negotiation и media transport, а
Gateway владеет credentials, instructions и tool policy. `talk.session.*` — это
общая Gateway-managed поверхность для gateway-relay realtime, gateway-relay
transcription и managed-room native STT/TTS sessions.

Устаревшие конфигурации, которые размещали realtime selectors рядом с `talk.provider` /
`talk.providers`, следует исправить с помощью `openclaw doctor --fix`; runtime Talk
не переинтерпретирует конфигурацию speech/TTS provider как конфигурацию realtime provider.

Поддерживаемые комбинации `talk.session.create` намеренно малочисленны:

| Режим           | Транспорт       | Brain           | Владелец           | Примечания                                                                                                         |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider audio передается через Gateway; tool calls маршрутизируются через инструмент agent-consult.   |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Только streaming STT; вызывающие отправляют входное audio и получают события transcript.                           |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Комнаты в стиле push-to-talk и walkie-talkie, где client владеет capture/playback, а Gateway владеет состоянием turn. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Режим комнаты только для администраторов, для доверенных first-party surfaces, которые напрямую выполняют Gateway tool actions. |

Карта удаленных методов:

| Старый                           | Новый                                                    |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` или `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Унифицированный словарь управления также намеренно узкий:

  | Метод                          | Применяется к                                           | Контракт                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Добавляет фрагмент PCM-аудио в base64 к сеансу провайдера, принадлежащему тому же подключению Gateway.                                                                                   |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Начинает пользовательский ход в управляемой комнате.                                                                                                                                     |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершает активный ход после проверки устаревшего хода.                                                                                                                                  |
  | `talk.session.cancelTurn`       | все сеансы, принадлежащие Gateway                       | Отменяет активную работу захвата/провайдера/агента/TTS для хода.                                                                                                                         |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Останавливает аудиовывод ассистента без обязательного завершения пользовательского хода.                                                                                                 |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершает вызов инструмента провайдера, созданный ретранслятором; передайте `options.willContinue` для промежуточного вывода или `options.suppressResponse`, чтобы выполнить вызов без еще одного ответа ассистента. |
  | `talk.session.steer`            | сеансы Talk с агентной поддержкой                       | Отправляет речевое управляющее действие `status`, `steer`, `cancel` или `followup` в активный встроенный запуск, определенный из сеанса Talk.                                             |
  | `talk.session.close`            | все унифицированные сеансы                              | Останавливает сеансы ретранслятора или отзывает состояние управляемой комнаты, затем забывает унифицированный идентификатор сеанса.                                                       |

  Не добавляйте в ядро особые случаи для провайдеров или платформ, чтобы это
  заработало. Ядро владеет семантикой сеансов Talk. Плагины провайдеров владеют
  настройкой сеансов поставщика. Голосовые вызовы и Google Meet владеют
  адаптерами телефонии/встреч. Браузерные и нативные приложения владеют UX
  захвата/воспроизведения устройств.

  ## Политика совместимости

  Для внешних плагинов работа над совместимостью выполняется в таком порядке:

  1. добавить новый контракт
  2. оставить старое поведение подключенным через адаптер совместимости
  3. вывести диагностику или предупреждение с названием старого пути и замены
  4. покрыть оба пути тестами
  5. задокументировать устаревание и путь миграции
  6. удалять только после объявленного окна миграции, обычно в мажорном релизе

  Сопровождающие могут проверить текущую очередь миграции с помощью
  `pnpm plugins:boundary-report`. Используйте `pnpm plugins:boundary-report:summary`
  для компактных счетчиков, `--owner <id>` для одного плагина или владельца
  совместимости и `pnpm plugins:boundary-report:ci`, когда CI-gate должен
  падать из-за просроченных записей совместимости, межвладельческих
  зарезервированных импортов SDK или неиспользуемых зарезервированных подпутей
  SDK. Отчет группирует устаревшие записи совместимости по дате удаления,
  подсчитывает локальные ссылки в коде/документации, показывает межвладельческие
  зарезервированные импорты SDK и резюмирует приватный SDK-мост memory-host, чтобы
  очистка совместимости оставалась явной, а не опиралась на разовые поиски.
  Зарезервированные подпути SDK должны иметь отслеживаемое использование
  владельцем; неиспользуемые экспорты зарезервированных помощников следует
  удалять из публичного SDK.

  Если поле манифеста все еще принимается, авторы плагинов могут продолжать
  использовать его, пока документация и диагностика не скажут обратное. Новый код
  должен предпочитать задокументированную замену, но существующие плагины не
  должны ломаться во время обычных минорных релизов.

  ## Как выполнить миграцию

  <Steps>
  <Step title="Мигрируйте помощники загрузки/записи конфигурации среды выполнения">
    Встроенным плагинам следует перестать вызывать
    `api.runtime.config.loadConfig()` и
    `api.runtime.config.writeConfigFile(...)` напрямую. Предпочитайте
    конфигурацию, которая уже была передана в активный путь вызова. Долгоживущие
    обработчики, которым нужен текущий снимок процесса, могут использовать
    `api.runtime.config.current()`. Долгоживущие агентные инструменты должны
    использовать `ctx.getRuntimeConfig()` из контекста инструмента внутри
    `execute`, чтобы инструмент, созданный до записи конфигурации, все равно видел
    обновленную конфигурацию среды выполнения.

    Записи конфигурации должны проходить через транзакционные помощники и выбирать
    политику после записи:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Используйте `afterWrite: { mode: "restart", reason: "..." }`, когда вызывающий
    код знает, что изменение требует чистого перезапуска gateway, и
    `afterWrite: { mode: "none", reason: "..." }` только когда вызывающий код
    владеет последующим действием и намеренно хочет подавить планировщик
    перезагрузки. Результаты мутации включают типизированную сводку `followUp` для
    тестов и журналирования; gateway остается ответственным за применение или
    планирование перезапуска. `loadConfig` и `writeConfigFile` остаются
    устаревшими помощниками совместимости для внешних плагинов на время окна
    миграции и один раз предупреждают с кодом совместимости
    `runtime-config-load-write`. Встроенные плагины и код среды выполнения
    репозитория защищены сканерными ограничителями в
    `pnpm check:deprecated-api-usage` и
    `pnpm check:no-runtime-action-load-config`: новое использование в
    производственном коде плагинов сразу приводит к сбою, прямые записи
    конфигурации приводят к сбою, методы сервера gateway должны использовать
    снимок среды выполнения запроса, помощники отправки/действий/клиентов каналов
    среды выполнения должны получать конфигурацию со своей границы, а для
    долгоживущих модулей среды выполнения разрешено ноль внешних вызовов
    `loadConfig()`.

    Новому коду плагинов также следует избегать импорта широкого barrel
    совместимости `openclaw/plugin-sdk/config-runtime`. Используйте узкий подпуть
    SDK, соответствующий задаче:

    | Потребность | Импорт |
    | --- | --- |
    | Типы конфигурации, такие как `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Утверждения уже загруженной конфигурации и поиск конфигурации входа плагина | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Чтение текущих снимков среды выполнения | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфигурации | `openclaw/plugin-sdk/config-mutation` |
    | Помощники хранилища сеансов | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфигурация таблиц Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Помощники среды выполнения групповой политики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Разрешение ввода секретов | `openclaw/plugin-sdk/secret-input-runtime` |
    | Переопределения моделей/сеансов | `openclaw/plugin-sdk/model-session-runtime` |

    Встроенные плагины и их тесты защищены сканером от широкого barrel, чтобы
    импорты и моки оставались локальными для нужного им поведения. Широкий barrel
    все еще существует для внешней совместимости, но новый код не должен от него
    зависеть.

  </Step>

  <Step title="Мигрируйте встроенные расширения результатов инструментов в middleware">
    Встроенные плагины должны заменить обработчики результатов инструментов
    `api.registerEmbeddedExtensionFactory(...)`, предназначенные только для
    встроенного runner, на middleware, нейтральное к среде выполнения.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Одновременно обновите манифест плагина:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Установленные плагины также могут регистрировать middleware результатов
    инструментов, когда они явно включены и объявляют каждую целевую среду
    выполнения в `contracts.agentToolResultMiddleware`. Необъявленные регистрации
    установленного middleware отклоняются.

  </Step>

  <Step title="Мигрируйте нативные обработчики утверждений на факты возможностей">
    Плагины каналов с поддержкой утверждений теперь раскрывают нативное поведение
    утверждений через `approvalCapability.nativeRuntime` плюс общий реестр
    контекста среды выполнения.

    Ключевые изменения:

    - Замените `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесите auth/delivery, специфичные для утверждений, со старой связки
      `plugin.auth` / `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` удален из публичного контракта плагина канала;
      перенесите поля delivery/native/render на `approvalCapability`
    - `plugin.auth` остается только для потоков входа/выхода канала; хуки auth
      для утверждений там больше не читаются ядром
    - Регистрируйте объекты среды выполнения, принадлежащие каналу, такие как
      клиенты, токены или приложения Bolt, через
      `openclaw/plugin-sdk/channel-runtime-context`
    - Не отправляйте уведомления о перенаправлении, принадлежащие плагину, из
      нативных обработчиков утверждений; теперь ядро владеет уведомлениями о
      маршрутизации в другое место на основе фактических результатов доставки
    - При передаче `channelRuntime` в `createChannelManager(...)` предоставьте
      настоящую поверхность `createPluginRuntime().channel`. Частичные заглушки
      отклоняются.

    См. `/plugins/sdk-channel-plugins` для текущей структуры возможностей
    утверждений.

  </Step>

  <Step title="Проверьте fallback-поведение Windows-обертки">
    Если ваш плагин использует `openclaw/plugin-sdk/windows-spawn`, неразрешенные
    Windows-обертки `.cmd`/`.bat` теперь завершаются закрыто, если вы явно не
    передадите `allowShellFallback: true`.

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

    Если вызывающий код не полагается намеренно на fallback через shell, не
    задавайте `allowShellFallback` и вместо этого обработайте выброшенную ошибку.

  </Step>

  <Step title="Найдите устаревшие импорты">
    Найдите в своем плагине импорты из любой устаревшей поверхности:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замените на сфокусированные импорты">
    Каждый экспорт из старой поверхности сопоставляется с конкретным современным
    путем импорта:

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

    Для помощников на стороне хоста используйте внедренную среду выполнения
    плагина вместо прямого импорта:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Тот же шаблон применяется к другим устаревшим вспомогательным функциям моста:

    | Старый импорт | Современный эквивалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | вспомогательные функции хранилища сессий | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` по-прежнему существует для внешней
    совместимости, но новый код должен импортировать специализированную
    поверхность вспомогательных функций, которая ему действительно нужна:

    | Потребность | Импорт |
    | --- | --- |
    | Вспомогательные функции очереди системных событий | `openclaw/plugin-sdk/system-event-runtime` |
    | Вспомогательные функции Heartbeat для пробуждения, событий и видимости | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Опустошение очереди ожидающей доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрия активности канала | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кэши дедупликации в памяти | `openclaw/plugin-sdk/dedupe-runtime` |
    | Вспомогательные функции безопасных локальных путей к файлам и медиа | `openclaw/plugin-sdk/file-access-runtime` |
    | Выборка с учетом диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Вспомогательные функции прокси и защищенной выборки | `openclaw/plugin-sdk/fetch-runtime` |
    | Типы политики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типы запроса и разрешения подтверждения | `openclaw/plugin-sdk/approval-runtime` |
    | Вспомогательные функции полезной нагрузки ответа подтверждения и команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Вспомогательные функции форматирования ошибок | `openclaw/plugin-sdk/error-runtime` |
    | Ожидание готовности транспорта | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Вспомогательные функции безопасных токенов | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ограниченная конкурентность асинхронных задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числовое приведение | `openclaw/plugin-sdk/number-runtime` |
    | Локальная для процесса асинхронная блокировка | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файловые блокировки | `openclaw/plugin-sdk/file-lock` |

    Для встроенных plugins действует защита сканером от `infra-runtime`, поэтому
    код репозитория не может регрессировать к широкому barrel-экспорту.

  </Step>

  <Step title="Migrate channel route helpers">
    Новый код маршрутов каналов должен использовать `openclaw/plugin-sdk/channel-route`.
    Более старые имена route-key и comparable-target остаются алиасами
    совместимости на время окна миграции, но новые plugins должны использовать
    имена маршрутов, которые напрямую описывают поведение:

    | Старый помощник | Современный помощник |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Современные вспомогательные функции маршрутов единообразно нормализуют `{ channel, to, accountId, threadId }`
    для нативных подтверждений, подавления ответов, входящей дедупликации,
    доставки Cron и маршрутизации сессий.

    Не добавляйте новые использования `ChannelMessagingAdapter.parseExplicitTarget` или
    вспомогательных функций загруженных маршрутов на основе парсера (`parseExplicitTargetForLoadedChannel`
    или `resolveRouteTargetForLoadedChannel`) либо
    `resolveChannelRouteTargetWithParser(...)` из `plugin-sdk/channel-route`.
    Эти хуки устарели и остаются только для более старых plugins на время
    окна миграции. Новые plugins каналов должны использовать
    `messaging.targetResolver.resolveTarget(...)` для нормализации идентификатора цели
    и резервного поведения при отсутствии в каталоге, `messaging.inferTargetChatType(...)`, когда ядру
    заранее нужен тип собеседника, и `messaging.resolveOutboundSessionRoute(...)`
    для нативной для провайдера идентичности сессии и ветки.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Справочник путей импорта

  <Accordion title="Common import path table">
  | Путь импорта | Назначение | Ключевые экспорты |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонический вспомогательный модуль точки входа Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Устаревший зонтичный реэкспорт для определений/конструкторов точек входа каналов | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Экспорт схемы корневой конфигурации | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Вспомогательный модуль точки входа для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Специализированные определения и конструкторы точек входа каналов | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Общие вспомогательные модули мастера настройки | Переводчик настройки, запросы allowlist, конструкторы статуса настройки |
  | `plugin-sdk/setup-runtime` | Вспомогательные модули среды выполнения на этапе настройки | `createSetupTranslator`, безопасные для импорта адаптеры патчей настройки, вспомогательные модули заметок поиска, `promptResolvedAllowFrom`, `splitSetupEntries`, делегированные прокси настройки |
  | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним адаптера настройки | Используйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Вспомогательные модули инструментов настройки | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Вспомогательные модули для нескольких учетных записей | Вспомогательные модули списка учетных записей/конфигурации/шлюза действий |
  | `plugin-sdk/account-id` | Вспомогательные модули идентификаторов учетных записей | `DEFAULT_ACCOUNT_ID`, нормализация идентификатора учетной записи |
  | `plugin-sdk/account-resolution` | Вспомогательные модули поиска учетных записей | Вспомогательные модули поиска учетных записей и резервного значения по умолчанию |
  | `plugin-sdk/account-helpers` | Узкие вспомогательные модули учетных записей | Вспомогательные модули списка учетных записей/действий с учетной записью |
  | `plugin-sdk/channel-setup` | Адаптеры мастера настройки | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примитивы сопряжения DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префикс ответа, ввод текста и привязка доставки источника | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптеров конфигурации и вспомогательные модули доступа к DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Конструкторы схем конфигурации | Общие примитивы схемы конфигурации каналов и только универсальный конструктор |
  | `plugin-sdk/bundled-channel-config-schema` | Встроенные схемы конфигурации | Только поддерживаемые OpenClaw встроенные plugins; новые plugins должны определять локальные для plugin схемы |
  | `plugin-sdk/channel-config-schema-legacy` | Устаревшие встроенные схемы конфигурации | Только псевдоним совместимости; используйте `plugin-sdk/bundled-channel-config-schema` для поддерживаемых встроенных plugins |
  | `plugin-sdk/telegram-command-config` | Вспомогательные модули конфигурации команд Telegram | Нормализация имен команд, обрезка описаний, проверка дубликатов/конфликтов |
  | `plugin-sdk/channel-policy` | Разрешение политики групп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Вспомогательные модули входящих конвертов | Общие вспомогательные модули маршрута и конструктора конвертов |
  | `plugin-sdk/channel-inbound` | Вспомогательные модули приема входящих данных | Построение контекста, форматирование, корни, исполнители, подготовленная отправка ответов и предикаты отправки |
  | `plugin-sdk/messaging-targets` | Устаревший путь импорта разбора цели | Используйте `plugin-sdk/channel-targets` для универсальных вспомогательных модулей разбора цели, `plugin-sdk/channel-route` для сравнения маршрутов и принадлежащие plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` для разрешения целей, специфичных для провайдера |
  | `plugin-sdk/outbound-media` | Вспомогательные модули исходящих медиа | Общая загрузка исходящих медиа |
  | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Вспомогательные модули жизненного цикла исходящих сообщений | Адаптеры сообщений, квитанции, вспомогательные модули надежной отправки, вспомогательные модули live preview/streaming, параметры ответа, вспомогательные модули жизненного цикла, исходящая идентификация и планирование полезной нагрузки |
  | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Вспомогательные модули привязки потоков | Вспомогательные модули жизненного цикла привязки потоков и адаптеров |
  | `plugin-sdk/agent-media-payload` | Устаревшие вспомогательные модули полезной нагрузки медиа | Конструктор полезной нагрузки медиа агента для устаревших компоновок полей |
  | `plugin-sdk/channel-runtime` | Устаревший shim совместимости | Только утилиты среды выполнения устаревших каналов |
  | `plugin-sdk/channel-send-result` | Типы результата отправки | Типы результата ответа |
  | `plugin-sdk/runtime-store` | Постоянное хранилище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкие вспомогательные модули среды выполнения | Вспомогательные модули среды выполнения/журналирования/резервного копирования/установки plugin |
  | `plugin-sdk/runtime-env` | Узкие вспомогательные модули env среды выполнения | Вспомогательные модули регистратора/env среды выполнения, тайм-аута, повтора и backoff |
  | `plugin-sdk/plugin-runtime` | Общие вспомогательные модули среды выполнения plugin | Вспомогательные модули команд/hooks/http/interactive для plugin |
  | `plugin-sdk/hook-runtime` | Вспомогательные модули конвейера hook | Общие вспомогательные модули конвейера Webhook/внутренних hook |
  | `plugin-sdk/lazy-runtime` | Вспомогательные модули ленивой среды выполнения | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Вспомогательные модули процессов | Общие вспомогательные модули exec |
  | `plugin-sdk/cli-runtime` | Вспомогательные модули среды выполнения CLI | Форматирование команд, ожидания, вспомогательные модули версий |
  | `plugin-sdk/gateway-runtime` | Вспомогательные модули Gateway | Клиент Gateway, вспомогательный модуль запуска после готовности event loop, разрешение объявленного LAN-хоста и вспомогательные модули патчей статуса канала |
  | `plugin-sdk/config-runtime` | Устаревший shim совместимости конфигурации | Предпочитайте `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` и `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Вспомогательные модули команд Telegram | Стабильные при fallback вспомогательные модули проверки команд Telegram, когда поверхность контракта встроенного Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Вспомогательные модули запросов одобрения | Полезная нагрузка одобрения exec/plugin, вспомогательные модули возможностей/профиля одобрения, собственная маршрутизация одобрений/вспомогательные модули среды выполнения и форматирование пути структурированного отображения одобрений |
  | `plugin-sdk/approval-auth-runtime` | Вспомогательные модули auth одобрения | Разрешение утверждающего, авторизация действия в том же чате |
  | `plugin-sdk/approval-client-runtime` | Вспомогательные модули клиента одобрения | Вспомогательные модули профиля/filter собственного одобрения exec |
  | `plugin-sdk/approval-delivery-runtime` | Вспомогательные модули доставки одобрения | Адаптеры возможностей/доставки собственного одобрения |
  | `plugin-sdk/approval-gateway-runtime` | Вспомогательные модули Gateway для одобрения | Общий вспомогательный модуль разрешения Gateway для одобрения |
  | `plugin-sdk/approval-handler-adapter-runtime` | Вспомогательные модули адаптеров одобрения | Легковесные вспомогательные модули загрузки собственного адаптера одобрения для горячих точек входа каналов |
  | `plugin-sdk/approval-handler-runtime` | Вспомогательные модули обработчиков одобрения | Более широкие вспомогательные модули среды выполнения обработчика одобрения; предпочитайте более узкие адаптерные/Gateway-сопряжения, когда их достаточно |
  | `plugin-sdk/approval-native-runtime` | Вспомогательные модули цели одобрения | Вспомогательные модули привязки цели/учетной записи собственного одобрения |
  | `plugin-sdk/approval-reply-runtime` | Вспомогательные модули ответа на одобрение | Вспомогательные модули полезной нагрузки ответа на одобрение exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Вспомогательные модули runtime-context канала | Универсальные вспомогательные модули register/get/watch runtime-context канала |
  | `plugin-sdk/security-runtime` | Вспомогательные модули безопасности | Общие вспомогательные модули доверия, ограничения DM, файлов/путей в пределах корня, внешнего содержимого и сбора секретов |
  | `plugin-sdk/ssrf-policy` | Вспомогательные модули политики SSRF | Вспомогательные модули allowlist хостов и политики частной сети |
  | `plugin-sdk/ssrf-runtime` | Вспомогательные модули среды выполнения SSRF | Закрепленный dispatcher, защищенный fetch, вспомогательные модули политики SSRF |
  | `plugin-sdk/system-event-runtime` | Вспомогательные модули системных событий | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Вспомогательные модули Heartbeat | Вспомогательные модули пробуждения, события и видимости Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Вспомогательные модули очереди доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Вспомогательные модули активности канала | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Вспомогательные модули дедупликации | In-memory кэши дедупликации |
  | `plugin-sdk/file-access-runtime` | Вспомогательные модули доступа к файлам | Вспомогательные модули безопасных путей локальных файлов/медиа |
  | `plugin-sdk/transport-ready-runtime` | Вспомогательные модули готовности транспорта | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Вспомогательные модули политики одобрения exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Вспомогательные модули ограниченного кэша | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Вспомогательные модули диагностического gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Вспомогательные модули форматирования ошибок | `formatUncaughtError`, `isApprovalNotFoundError`, вспомогательные модули графа ошибок |
  | `plugin-sdk/fetch-runtime` | Вспомогательные модули обернутого fetch/proxy | `resolveFetch`, вспомогательные модули proxy, вспомогательные модули параметров EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Вспомогательные модули нормализации хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Вспомогательные модули повтора | `RetryConfig`, `retryAsync`, исполнители политик |
  | `plugin-sdk/allow-from` | Форматирование allowlist и сопоставление ввода | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Вспомогательные модули gating команд и поверхности команд | `resolveControlCommandGate`, вспомогательные модули авторизации отправителя, вспомогательные модули реестра команд, включая форматирование меню динамических аргументов |
  | `plugin-sdk/command-status` | Рендереры статуса/справки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Разбор ввода секрета | Вспомогательные модули ввода секрета |
  | `plugin-sdk/webhook-ingress` | Вспомогательные модули запросов Webhook | Утилиты целей Webhook |
  | `plugin-sdk/webhook-request-guards` | Вспомогательные модули защиты тела Webhook | Вспомогательные модули чтения/лимита тела запроса |
  | `plugin-sdk/reply-runtime` | Общая среда выполнения ответов | Входящая отправка, Heartbeat, планировщик ответов, разбиение на фрагменты |
  | `plugin-sdk/reply-dispatch-runtime` | Узкие вспомогательные модули отправки ответов | Завершение, отправка провайдеру и вспомогательные модули меток разговора |
  | `plugin-sdk/reply-history` | Вспомогательные модули истории ответов | `createChannelHistoryWindow`; устаревшие экспорты совместимости map-helper, такие как `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` и `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планирование ссылок ответов | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Вспомогательные модули фрагментов ответов | Вспомогательные модули разбиения текста/markdown на фрагменты |
  | `plugin-sdk/session-store-runtime` | Вспомогательные модули хранилища сеансов | Вспомогательные модули пути хранилища и updated-at |
  | `plugin-sdk/state-paths` | Вспомогательные модули путей состояния | Вспомогательные модули каталогов состояния и OAuth |
  | `plugin-sdk/routing` | Помощники маршрутизации/ключей сессий | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, помощники нормализации ключей сессий |
  | `plugin-sdk/status-helpers` | Помощники статуса канала | Построители сводок статуса канала/аккаунта, значения по умолчанию состояния среды выполнения, помощники метаданных проблем |
  | `plugin-sdk/target-resolver-runtime` | Помощники разрешения целей | Общие помощники разрешения целей |
  | `plugin-sdk/string-normalization-runtime` | Помощники нормализации строк | Помощники нормализации slug/строк |
  | `plugin-sdk/request-url` | Помощники URL запроса | Извлечение строковых URL из входных данных, похожих на запросы |
  | `plugin-sdk/run-command` | Помощники команд с тайм-аутом | Запускатель команд с тайм-аутом и нормализованными stdout/stderr |
  | `plugin-sdk/param-readers` | Средства чтения параметров | Общие средства чтения параметров инструментов/CLI |
  | `plugin-sdk/tool-payload` | Извлечение полезной нагрузки инструмента | Извлечение нормализованных полезных нагрузок из объектов результата инструмента |
  | `plugin-sdk/tool-send` | Извлечение отправки инструмента | Извлечение канонических полей цели отправки из аргументов инструмента |
  | `plugin-sdk/temp-path` | Помощники временных путей | Общие помощники путей временных загрузок |
  | `plugin-sdk/logging-core` | Помощники журналирования | Регистратор подсистемы и помощники редактирования секретов |
  | `plugin-sdk/markdown-table-runtime` | Помощники Markdown-таблиц | Помощники режимов Markdown-таблиц |
  | `plugin-sdk/reply-payload` | Типы ответов на сообщения | Типы полезной нагрузки ответа |
  | `plugin-sdk/provider-setup` | Курируемые помощники настройки локального/самостоятельно размещенного провайдера | Помощники обнаружения/настройки самостоятельно размещенного провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Специализированные помощники настройки OpenAI-совместимого самостоятельно размещенного провайдера | Те же помощники обнаружения/настройки самостоятельно размещенного провайдера |
  | `plugin-sdk/provider-auth-runtime` | Помощники аутентификации провайдера в среде выполнения | Помощники разрешения API-ключей в среде выполнения |
  | `plugin-sdk/provider-auth-api-key` | Помощники настройки API-ключей провайдера | Помощники онбординга API-ключей/записи профилей |
  | `plugin-sdk/provider-auth-result` | Помощники результата аутентификации провайдера | Стандартный построитель результата аутентификации OAuth |
  | `plugin-sdk/provider-selection-runtime` | Помощники выбора провайдера | Выбор настроенного или автоматического провайдера и слияние необработанной конфигурации провайдера |
  | `plugin-sdk/provider-env-vars` | Помощники env-var провайдера | Помощники поиска env-var аутентификации провайдера |
  | `plugin-sdk/provider-model-shared` | Общие помощники моделей/повтора провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители политик повтора, помощники конечных точек провайдера и помощники нормализации model-id |
  | `plugin-sdk/provider-catalog-shared` | Общие помощники каталога провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчи онбординга провайдера | Помощники конфигурации онбординга |
  | `plugin-sdk/provider-http` | HTTP-помощники провайдера | Универсальные помощники возможностей HTTP/конечных точек провайдера, включая помощники multipart-форм для транскрипции аудио |
  | `plugin-sdk/provider-web-fetch` | Помощники web-fetch провайдера | Помощники регистрации/кэша провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Помощники конфигурации web-search провайдера | Узкие помощники конфигурации/учетных данных web-search для провайдеров, которым не нужна связка включения плагина |
  | `plugin-sdk/provider-web-search-contract` | Помощники контракта web-search провайдера | Узкие помощники контракта конфигурации/учетных данных web-search, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, и ограниченные по области сеттеры/геттеры учетных данных |
  | `plugin-sdk/provider-web-search` | Помощники web-search провайдера | Помощники регистрации/кэша/среды выполнения провайдера web-search |
  | `plugin-sdk/provider-tools` | Помощники совместимости инструментов/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` и очистка схем DeepSeek/Gemini/OpenAI + диагностика |
  | `plugin-sdk/provider-usage` | Помощники использования провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` и другие помощники использования провайдера |
  | `plugin-sdk/provider-stream` | Помощники оберток потока провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы оберток потоков и общие помощники оберток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Помощники транспорта провайдера | Нативные помощники транспорта провайдера, такие как защищенный fetch, извлечение текста результата инструмента, преобразования транспортных сообщений и записываемые потоки транспортных событий |
  | `plugin-sdk/keyed-async-queue` | Упорядоченная асинхронная очередь | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Общие помощники медиа | Помощники получения/преобразования/хранения медиа, определение размеров видео на основе ffprobe и построители полезной нагрузки медиа |
  | `plugin-sdk/media-generation-runtime` | Общие помощники генерации медиа | Общие помощники отработки отказа, выбор кандидатов и сообщения об отсутствующих моделях для генерации изображений/видео/музыки |
  | `plugin-sdk/media-understanding` | Помощники понимания медиа | Типы провайдеров понимания медиа плюс экспорты помощников изображений/аудио для провайдеров |
  | `plugin-sdk/text-runtime` | Устаревший широкий экспорт совместимости текста | Используйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` и `logging-core` |
  | `plugin-sdk/text-chunking` | Помощники разбиения текста | Помощник разбиения исходящего текста |
  | `plugin-sdk/speech` | Помощники речи | Типы речевых провайдеров плюс ориентированные на провайдера помощники директив, реестра и проверки, а также OpenAI-совместимый построитель TTS |
  | `plugin-sdk/speech-core` | Общее ядро речи | Типы речевых провайдеров, реестр, директивы, нормализация |
  | `plugin-sdk/realtime-transcription` | Помощники транскрипции в реальном времени | Типы провайдеров, помощники реестра и общий помощник сессии WebSocket |
  | `plugin-sdk/realtime-voice` | Помощники голоса в реальном времени | Типы провайдеров, помощники реестра/разрешения, помощники мостовых сессий, общие очереди ответа агента голосом, голосовое управление активным запуском, состояние транскрипта/событий, подавление эха, сопоставление уточняющих вопросов, координация принудительной консультации, отслеживание контекста хода, отслеживание активности вывода и помощники быстрой консультации по контексту |
  | `plugin-sdk/image-generation` | Помощники генерации изображений | Типы провайдеров генерации изображений плюс помощники asset/data URL изображений и OpenAI-совместимый построитель провайдера изображений |
  | `plugin-sdk/image-generation-core` | Общее ядро генерации изображений | Типы генерации изображений, отработка отказа, аутентификация и помощники реестра |
  | `plugin-sdk/music-generation` | Помощники генерации музыки | Типы провайдеров/запросов/результатов генерации музыки |
  | `plugin-sdk/music-generation-core` | Общее ядро генерации музыки | Типы генерации музыки, помощники отработки отказа, поиск провайдера и разбор model-ref |
  | `plugin-sdk/video-generation` | Помощники генерации видео | Типы провайдеров/запросов/результатов генерации видео |
  | `plugin-sdk/video-generation-core` | Общее ядро генерации видео | Типы генерации видео, помощники отработки отказа, поиск провайдера и разбор model-ref |
  | `plugin-sdk/interactive-runtime` | Помощники интерактивных ответов | Нормализация/сокращение полезной нагрузки интерактивного ответа |
  | `plugin-sdk/channel-config-primitives` | Примитивы конфигурации канала | Узкие примитивы схемы конфигурации канала |
  | `plugin-sdk/channel-config-writes` | Помощники записи конфигурации канала | Помощники авторизации записи конфигурации канала |
  | `plugin-sdk/channel-plugin-common` | Общая прелюдия канала | Экспорты общей прелюдии плагина канала |
  | `plugin-sdk/channel-status` | Помощники статуса канала | Общие помощники снимка/сводки статуса канала |
  | `plugin-sdk/allowlist-config-edit` | Помощники конфигурации списка разрешений | Помощники редактирования/чтения конфигурации списка разрешений |
  | `plugin-sdk/group-access` | Помощники доступа групп | Общие помощники принятия решений о доступе групп |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости | Используйте `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Помощники защитной политики Direct-DM | Узкие помощники защитной политики до криптографии |
  | `plugin-sdk/extension-shared` | Общие помощники расширений | Примитивы помощников пассивного канала/статуса и окружающего прокси |
  | `plugin-sdk/webhook-targets` | Помощники целей Webhook | Реестр целей Webhook и помощники установки маршрутов |
  | `plugin-sdk/webhook-path` | Устаревший псевдоним пути Webhook | Используйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Общие помощники веб-медиа | Помощники загрузки удаленных/локальных медиа |
  | `plugin-sdk/zod` | Устаревший реэкспорт совместимости Zod | Импортируйте `zod` из `zod` напрямую |
  | `plugin-sdk/memory-core` | Встроенные помощники memory-core | Поверхность помощников менеджера памяти/конфигурации/файлов/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад среды выполнения движка памяти | Фасад среды выполнения индекса/поиска памяти |
  | `plugin-sdk/memory-core-host-embedding-registry` | Реестр эмбеддингов памяти | Легковесные помощники реестра провайдеров эмбеддингов памяти |
  | `plugin-sdk/memory-core-host-engine-foundation` | Фундаментальный движок хоста памяти | Экспорты фундаментального движка хоста памяти |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Движок эмбеддингов хоста памяти | Контракты эмбеддингов памяти, доступ к реестру, локальный провайдер и универсальные batch/remote помощники; конкретные удаленные провайдеры находятся в своих владеющих плагинах |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-движок хоста памяти | Экспорты QMD-движка хоста памяти |
  | `plugin-sdk/memory-core-host-engine-storage` | Движок хранилища хоста памяти | Экспорты движка хранилища хоста памяти |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные помощники хоста памяти | Мультимодальные помощники хоста памяти |
  | `plugin-sdk/memory-core-host-query` | Помощники запросов хоста памяти | Помощники запросов хоста памяти |
  | `plugin-sdk/memory-core-host-secret` | Помощники секретов хоста памяти | Помощники секретов хоста памяти |
  | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним событий памяти | Используйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Помощники статуса хоста памяти | Помощники статуса хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-cli` | Среда выполнения CLI хоста памяти | Помощники среды выполнения CLI хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-core` | Основная среда выполнения хоста памяти | Помощники основной среды выполнения хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-files` | Помощники файлов/среды выполнения хоста памяти | Помощники файлов/среды выполнения хоста памяти |
  | `plugin-sdk/memory-host-core` | Псевдоним основной среды выполнения хоста памяти | Нейтральный к поставщику псевдоним помощников основной среды выполнения хоста памяти |
  | `plugin-sdk/memory-host-events` | Псевдоним журнала событий хоста памяти | Нейтральный к поставщику псевдоним помощников журнала событий хоста памяти |
  | `plugin-sdk/memory-host-files` | Устаревший псевдоним файлов/среды выполнения памяти | Используйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Помощники управляемого markdown | Общие помощники управляемого markdown для плагинов, смежных с памятью |
  | `plugin-sdk/memory-host-search` | Фасад поиска Active Memory | Ленивый фасад среды выполнения менеджера поиска Active Memory |
  | `plugin-sdk/memory-host-status` | Устаревший псевдоним статуса хоста памяти | Используйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Утилиты тестирования | Локальный для репозитория устаревший barrel совместимости; используйте специализированные локальные подпути тестов репозитория, такие как `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` и `plugin-sdk/test-fixtures` |
</Accordion>

Эта таблица намеренно охватывает общий миграционный поднабор, а не всю
поверхность SDK. Инвентарь точек входа компилятора находится в
`scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакета генерируются из
публичного поднабора.

Зарезервированные вспомогательные швы встроенных Plugin выведены из публичной
карты экспортов SDK, за исключением явно задокументированных фасадов
совместимости, таких как устаревший shim `plugin-sdk/discord`, сохраненный для
опубликованного пакета `@openclaw/discord@2026.3.13`. Вспомогательные средства,
специфичные для владельца, находятся внутри пакета соответствующего Plugin;
общее поведение хоста должно проходить через универсальные контракты SDK,
такие как `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
`plugin-sdk/plugin-config-runtime`.

Используйте самый узкий импорт, подходящий для задачи. Если вы не можете найти
экспорт, проверьте исходный код в `src/plugin-sdk/` или спросите
сопровождающих, какому универсальному контракту он должен принадлежать.

## Активные устаревания

Более узкие устаревания, применимые ко всему SDK Plugin, контракту провайдера,
поверхности runtime и манифесту. Каждое из них сегодня еще работает, но будет
удалено в будущей мажорной версии. Запись под каждым пунктом сопоставляет
старый API с его канонической заменой.

<AccordionGroup>
  <Accordion title="Сборщики справки command-auth → command-status">
    **Старое (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Новое (`openclaw/plugin-sdk/command-status`)**: те же сигнатуры, те же
    экспорты — просто импортируются из более узкого подпути. `command-auth`
    реэкспортирует их как заглушки совместимости.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Вспомогательные средства фильтрации упоминаний → resolveInboundMentionDecision">
    **Старое**: `resolveInboundMentionRequirement({ facts, policy })` и
    `shouldDropInboundForMention(...)` из
    `openclaw/plugin-sdk/channel-inbound` или
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Новое**: `resolveInboundMentionDecision({ facts, policy })` — возвращает
    единый объект решения вместо двух раздельных вызовов.

    Нижестоящие канальные Plugin (Slack, Discord, Matrix, MS Teams) уже
    переключились.

  </Accordion>

  <Accordion title="Shim runtime канала и вспомогательные средства действий канала">
    `openclaw/plugin-sdk/channel-runtime` — это shim совместимости для старых
    канальных Plugin. Не импортируйте его из нового кода; используйте
    `openclaw/plugin-sdk/channel-runtime-context` для регистрации объектов
    runtime.

    Вспомогательные средства `channelActions*` в
    `openclaw/plugin-sdk/channel-actions` устарели вместе с сырыми экспортами
    канальных "actions". Вместо этого раскрывайте возможности через
    семантическую поверхность `presentation`: канальные Plugin объявляют, что
    они отображают (карточки, кнопки, селекты), а не какие сырые имена действий
    они принимают.

  </Accordion>

  <Accordion title="Вспомогательное средство tool() провайдера веб-поиска → createTool() в Plugin">
    **Старое**: фабрика `tool()` из
    `openclaw/plugin-sdk/provider-web-search`.

    **Новое**: реализуйте `createTool(...)` непосредственно в провайдерском
    Plugin. OpenClaw больше не нужен вспомогательный компонент SDK для
    регистрации обертки инструмента.

  </Accordion>

  <Accordion title="Текстовые конверты канала → BodyForAgent">
    **Старое**: `formatInboundEnvelope(...)` (и
    `ChannelMessageForAgent.channelEnvelope`) для построения плоского
    текстового конверта prompt из входящих сообщений канала.

    **Новое**: `BodyForAgent` плюс структурированные блоки пользовательского
    контекста. Канальные Plugin прикрепляют метаданные маршрутизации (тред,
    тема, ответ на сообщение, реакции) как типизированные поля вместо
    конкатенации их в строку prompt. Вспомогательное средство
    `formatAgentEnvelope(...)` по-прежнему поддерживается для синтезированных
    конвертов, обращенных к ассистенту, но входящие текстовые конверты
    постепенно выводятся из использования.

    Затронутые области: `inbound_claim`, `message_received` и любой
    пользовательский канальный Plugin, который постобрабатывал текст
    `channelEnvelope`.

  </Accordion>

  <Accordion title="Хук deactivate → gateway_stop">
    **Старое**: `api.on("deactivate", handler)`.

    **Новое**: `api.on("gateway_stop", handler)`. Событие и контекст остаются
    тем же контрактом очистки при завершении работы; меняется только имя хука.

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

    `deactivate` остается подключенным как устаревший псевдоним совместимости
    до периода после 2026-08-16.

  </Accordion>

  <Accordion title="Хук subagent_spawning → привязка треда в core">
    **Старое**: `api.on("subagent_spawning", handler)`, возвращающий
    `threadBindingReady` или `deliveryOrigin`.

    **Новое**: позвольте core подготовить привязки субагентов `thread: true`
    через адаптер привязки сессии канала. Используйте
    `api.on("subagent_spawned", handler)` только для наблюдения после запуска.

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
    `PluginHookSubagentSpawningResult` и
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` остаются только как
    устаревшие поверхности совместимости, пока внешние Plugin мигрируют.

  </Accordion>

  <Accordion title="Типы обнаружения провайдеров → типы каталога провайдеров">
    Четыре псевдонима типов обнаружения теперь являются тонкими обертками над
    типами эпохи каталога:

    | Старый псевдоним          | Новый тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс устаревший статический набор `ProviderCapabilities`: провайдерские
    Plugin должны использовать явные хуки провайдера, такие как
    `buildReplayPolicy`, `normalizeToolSchemas` и `wrapStreamFn`, а не
    статический объект.

  </Accordion>

  <Accordion title="Хуки политики thinking → resolveThinkingProfile">
    **Старое** (три отдельных хука в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` и
    `resolveDefaultThinkingLevel(ctx)`.

    **Новое**: единый `resolveThinkingProfile(ctx)`, который возвращает
    `ProviderThinkingProfile` с каноническим `id`, необязательным `label` и
    ранжированным списком уровней. OpenClaw автоматически понижает устаревшие
    сохраненные значения по рангу профиля.

    Контекст включает `provider`, `modelId`, необязательные объединенные
    `reasoning` и необязательные объединенные факты `compat` модели.
    Провайдерские Plugin могут использовать эти факты каталога, чтобы
    раскрывать профиль, специфичный для модели, только когда настроенный
    контракт запроса это поддерживает.

    Реализуйте один хук вместо трех. Устаревшие хуки продолжают работать в
    течение окна устаревания, но не комбинируются с результатом профиля.

  </Accordion>

  <Accordion title="Внешние провайдеры аутентификации → contracts.externalAuthProviders">
    **Старое**: реализация хуков внешней аутентификации без объявления
    провайдера в манифесте Plugin.

    **Новое**: объявите `contracts.externalAuthProviders` в манифесте Plugin
    **и** реализуйте `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Поиск env-var провайдера → setup.providers[].envVars">
    **Старое** поле манифеста: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Новое**: отразите тот же поиск env-var в `setup.providers[].envVars` в
    манифесте. Это консолидирует метаданные env для setup/status в одном месте
    и избегает запуска runtime Plugin только для ответа на запросы env-var.

    `providerAuthEnvVars` остается поддерживаемым через адаптер совместимости
    до закрытия окна устаревания.

  </Accordion>

  <Accordion title="Регистрация Plugin памяти → registerMemoryCapability">
    **Старое**: три отдельных вызова —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Новое**: один вызов в API состояния памяти —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Те же слоты, один вызов регистрации. Аддитивные вспомогательные средства
    prompt и корпуса (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) не затронуты.

  </Accordion>

  <Accordion title="API провайдера embedding для памяти">
    **Старое**: `api.registerMemoryEmbeddingProvider(...)` плюс
    `contracts.memoryEmbeddingProviders`.

    **Новое**: `api.registerEmbeddingProvider(...)` плюс
    `contracts.embeddingProviders`.

    Универсальный контракт провайдера embedding можно повторно использовать
    вне памяти, и это поддерживаемый путь для новых провайдеров. API
    регистрации, специфичный для памяти, остается подключенным как устаревшая
    совместимость, пока существующие провайдеры мигрируют. Инспекция Plugin
    сообщает об использовании вне встроенных Plugin как о долге совместимости.

  </Accordion>

  <Accordion title="Типы сообщений сессии субагента переименованы">
    Два устаревших псевдонима типов все еще экспортируются из
    `src/plugins/runtime/types.ts`:

    | Старое                       | Новое                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` устарел в пользу `getSessionMessages`. Та же
    сигнатура; старый метод проксирует вызов в новый.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старое**: `runtime.tasks.flow` (в единственном числе) возвращал живой
    accessor task-flow.

    **Новое**: `runtime.tasks.managedFlows` сохраняет runtime управляемой
    мутации TaskFlow для Plugin, которые создают, обновляют, отменяют или
    запускают дочерние задачи из flow. Используйте `runtime.tasks.flows`,
    когда Plugin нужны только чтения на основе DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики встроенных extension → middleware результатов инструментов агента">
    Рассмотрено выше в разделе "Как мигрировать → Миграция встроенных
    расширений результатов инструментов в middleware". Включено здесь для
    полноты: удаленный путь только для встроенного runner
    `api.registerEmbeddedExtensionFactory(...)` заменен на
    `api.registerAgentToolResultMiddleware(...)` с явным списком runtime в
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдоним OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, реэкспортируемый из `openclaw/plugin-sdk`, теперь
    является однострочным псевдонимом для `OpenClawConfig`. Предпочитайте
    каноническое имя.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Устаревания уровня extension (внутри встроенных канальных/провайдерских Plugin
в `extensions/`) отслеживаются внутри их собственных barrel-файлов `api.ts` и
`runtime-api.ts`. Они не влияют на контракты сторонних Plugin и не перечислены
здесь. Если вы напрямую используете локальный barrel встроенного Plugin,
прочитайте комментарии об устаревании в этом barrel перед обновлением.
</Note>

## График удаления

| Когда                  | Что происходит                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Сейчас**             | Устаревшие интерфейсы выводят предупреждения во время выполнения                       |
| **Следующий мажорный выпуск** | Устаревшие интерфейсы будут удалены; плагины, которые все еще их используют, перестанут работать |

Все основные плагины уже перенесены. Внешним плагинам следует выполнить
миграцию до следующего мажорного выпуска.

## Временное подавление предупреждений

Задайте эти переменные окружения, пока работаете над миграцией:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Это временный аварийный обход, а не постоянное решение.

## Связанные материалы

- [Начало работы](/ru/plugins/building-plugins) - создайте свой первый плагин
- [Обзор SDK](/ru/plugins/sdk-overview) - полный справочник импортов по подпутям
- [Канальные плагины](/ru/plugins/sdk-channel-plugins) - создание канальных плагинов
- [Провайдерские плагины](/ru/plugins/sdk-provider-plugins) - создание провайдерских плагинов
- [Внутреннее устройство плагинов](/ru/plugins/architecture) - подробный разбор архитектуры
- [Манифест плагина](/ru/plugins/manifest) - справочник схемы манифеста
