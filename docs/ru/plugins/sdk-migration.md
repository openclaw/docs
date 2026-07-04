---
read_when:
    - Вы видите предупреждение OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Вы видите предупреждение OPENCLAW_EXTENSION_API_DEPRECATED
    - Вы использовали api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Вы обновляете plugin до современной архитектуры plugin
    - Вы поддерживаете внешний Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Переход с устаревшего слоя обратной совместимости на современный SDK Plugin
title: Миграция Plugin SDK
x-i18n:
    generated_at: "2026-07-04T10:53:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перешел от широкого слоя обратной совместимости к современной
архитектуре плагинов с узкими документированными импортами. Если ваш плагин был
создан до новой архитектуры, это руководство поможет выполнить миграцию.

## Что меняется

Старая система плагинов предоставляла две широко открытые поверхности, которые
позволяли плагинам импортировать все необходимое из одной точки входа:

- **`openclaw/plugin-sdk/compat`** - единый импорт, который повторно экспортировал
  десятки вспомогательных функций. Он был введен, чтобы старые плагины на основе
  хуков продолжали работать, пока строилась новая архитектура плагинов.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий набор runtime-вспомогательных
  средств, который смешивал системные события, состояние Heartbeat, очереди доставки,
  вспомогательные средства fetch/proxy, файловые вспомогательные средства,
  типы подтверждений и несвязанные утилиты.
- **`openclaw/plugin-sdk/config-runtime`** - широкий набор совместимости конфигурации,
  который все еще содержит устаревшие прямые вспомогательные средства load/write
  в период миграции.
- **`openclaw/extension-api`** - мост, который давал плагинам прямой доступ к
  host-вспомогательным средствам, таким как встроенный runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** - удаленный хук bundled-расширения
  только для embedded-runner, который мог наблюдать события embedded-runner,
  например `tool_result`.

Широкие поверхности импорта теперь **устарели**. Они все еще работают во время
выполнения, но новые плагины не должны их использовать, а существующим плагинам
следует выполнить миграцию до того, как следующий major-релиз удалит их. API
регистрации фабрики расширений только для embedded-runner был удален; вместо
него используйте middleware для результатов инструментов.

OpenClaw не удаляет и не переосмысливает документированное поведение плагинов
в том же изменении, которое вводит замену. Ломающие изменения контрактов должны
сначала проходить через адаптер совместимости, диагностику, документацию и период
устаревания. Это относится к импортам SDK, полям манифеста, setup API, хукам
и поведению runtime-регистрации.

<Warning>
  Слой обратной совместимости будет удален в будущем major-релизе.
  Плагины, которые все еще импортируют из этих поверхностей, сломаются, когда это произойдет.
  Устаревшие регистрации фабрик встроенных расширений уже больше не загружаются.
</Warning>

## Почему это изменилось

Старый подход создавал проблемы:

- **Медленный запуск** - импорт одного вспомогательного средства загружал десятки несвязанных модулей
- **Циклические зависимости** - широкие повторные экспорты упрощали создание циклов импорта
- **Неясная поверхность API** - нельзя было понять, какие экспорты стабильны, а какие внутренние

Современный SDK плагинов исправляет это: каждый путь импорта (`openclaw/plugin-sdk/\<subpath\>`)
представляет собой небольшой самодостаточный модуль с четкой целью и документированным контрактом.

Устаревшие удобные provider-seam для bundled-каналов также удалены.
Вспомогательные seam с брендингом каналов были приватными mono-repo shortcuts,
а не стабильными контрактами плагинов. Вместо них используйте узкие универсальные
подпути SDK. Внутри рабочего пространства bundled-плагина держите вспомогательные
средства, принадлежащие провайдеру, в собственном `api.ts` или `runtime-api.ts`
этого плагина.

Текущие примеры bundled-провайдеров:

- Anthropic держит stream-вспомогательные средства, специфичные для Claude, в собственном seam
  `api.ts` / `contract-api.ts`
- OpenAI держит builder'ы провайдера, вспомогательные средства моделей по умолчанию
  и realtime builder'ы провайдера в собственном `api.ts`
- OpenRouter держит builder провайдера и onboarding/config-вспомогательные средства
  в собственном `api.ts`

## План миграции Talk и realtime-голоса

Код realtime-голоса, телефонии, встреч и браузерного Talk переносится с
локального для поверхности учета turn'ов на общий контроллер Talk-сессий,
экспортируемый из `openclaw/plugin-sdk/realtime-voice`. Новый контроллер владеет
общей оболочкой событий Talk, состоянием активного turn, состоянием захвата,
состоянием output-audio, недавней историей событий и отклонением устаревших turn'ов.
Плагины провайдеров должны продолжать владеть vendor-специфичными realtime-сессиями;
плагины поверхностей должны продолжать владеть особенностями захвата, воспроизведения,
телефонии и встреч.

Эта миграция Talk намеренно является чисто ломающей:

1. Сохранить общий контроллер/runtime-примитивы в
   `plugin-sdk/realtime-voice`.
2. Перевести bundled-поверхности на общий контроллер: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime и native push-to-talk.
3. Заменить старые семейства Talk RPC на финальные API `talk.session.*` и
   `talk.client.*`.
4. Объявить один живой канал событий Talk в Gateway
   `hello-ok.features.events`: `talk.event`.
5. Удалить старый realtime HTTP endpoint и любой request-time путь переопределения инструкций.

Новый код не должен вызывать `createTalkEventSequencer(...)` напрямую, если только
он не реализует низкоуровневый адаптер или test fixture. Предпочитайте общий
контроллер, чтобы события в области turn не могли выпускаться без id turn,
устаревшие вызовы `turnEnd` / `turnCancel` не могли очистить более новый
активный turn, а события жизненного цикла output-audio оставались согласованными
для телефонии, встреч, browser relay, managed-room handoff и native Talk-клиентов.

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

WebRTC/provider-websocket-сессии, принадлежащие браузеру, используют `talk.client.create`,
потому что браузер владеет согласованием с провайдером и медиатранспортом, тогда как
Gateway владеет учетными данными, инструкциями и политикой инструментов. `talk.session.*` -
это общая управляемая Gateway поверхность для gateway-relay realtime, gateway-relay
transcription и managed-room native STT/TTS-сессий.

Устаревшие конфигурации, которые размещали realtime-селекторы рядом с `talk.provider` /
`talk.providers`, следует исправлять с помощью `openclaw doctor --fix`; runtime Talk
не переосмысливает конфигурацию speech/TTS-провайдера как конфигурацию realtime-провайдера.

Поддерживаемые комбинации `talk.session.create` намеренно ограничены:

| Режим           | Транспорт       | Brain           | Владелец           | Примечания                                                                                                         |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex аудио провайдера передается через Gateway; вызовы инструментов маршрутизируются через инструмент agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Только streaming STT; вызывающие стороны отправляют входное аудио и получают события транскрипта.                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Комнаты в стиле push-to-talk и walkie-talkie, где клиент владеет захватом/воспроизведением, а Gateway владеет состоянием turn. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only режим комнаты для доверенных first-party поверхностей, которые напрямую выполняют действия инструментов Gateway. |

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

Унифицированный словарь управления также намеренно узок:

  | Метод                          | Применяется к                                           | Контракт                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Добавляет фрагмент PCM-аудио в base64 к сессии провайдера, принадлежащей тому же подключению Gateway.                                                                                    |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Запускает пользовательский ход в управляемой комнате.                                                                                                                                    |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершает активный ход после проверки устаревшего хода.                                                                                                                                  |
  | `talk.session.cancelTurn`       | все сессии, принадлежащие Gateway                       | Отменяет активную работу захвата, провайдера, агента и TTS для хода.                                                                                                                     |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Останавливает аудиовывод ассистента, не обязательно завершая пользовательский ход.                                                                                                       |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершает вызов инструмента провайдера, выданный ретранслятором; передайте `options.willContinue` для промежуточного вывода или `options.suppressResponse`, чтобы выполнить вызов без еще одного ответа ассистента. |
  | `talk.session.steer`            | сессии Talk на базе агента                              | Отправляет голосовое управляющее действие `status`, `steer`, `cancel` или `followup` в активный встроенный запуск, определенный из сессии Talk.                                          |
  | `talk.session.close`            | все унифицированные сессии                              | Останавливает сессии ретранслятора или отзывает состояние управляемой комнаты, затем забывает идентификатор унифицированной сессии.                                                      |

  Не вводите в core специальные случаи для провайдеров или платформ, чтобы это работало.
  Core владеет семантикой сессий Talk. Plugin провайдера владеют настройкой сессий поставщика.
  Голосовой вызов и Google Meet владеют адаптерами телефонии и встреч. Браузерные и нативные
  приложения владеют UX захвата и воспроизведения на устройстве.

  ## Политика совместимости

  Для внешних Plugin работа с совместимостью выполняется в таком порядке:

  1. добавить новый контракт
  2. сохранить старое поведение, подключенное через адаптер совместимости
  3. выдать диагностическое сообщение или предупреждение, называющее старый путь и замену
  4. покрыть оба пути тестами
  5. задокументировать устаревание и путь миграции
  6. удалить только после объявленного окна миграции, обычно в мажорном релизе

  Мейнтейнеры могут проверить текущую очередь миграции с помощью
  `pnpm plugins:boundary-report`. Используйте `pnpm plugins:boundary-report:summary` для
  компактных счетчиков, `--owner <id>` для одного Plugin или владельца совместимости и
  `pnpm plugins:boundary-report:ci`, когда CI-гейт должен падать из-за просроченных
  записей совместимости, зарезервированных импортов SDK между владельцами или неиспользуемых зарезервированных
  подпутей SDK. Отчет группирует устаревшие
  записи совместимости по дате удаления, считает локальные ссылки в коде и документации,
  показывает зарезервированные импорты SDK между владельцами и суммирует приватный
  мост SDK memory-host, чтобы очистка совместимости оставалась явной, а не
  полагалась на разовые поиски. Зарезервированные подпути SDK должны иметь отслеженное использование владельцем;
  неиспользуемые зарезервированные экспорты помощников следует удалить из публичного SDK.

  Если поле манифеста все еще принимается, авторы Plugin могут продолжать использовать его, пока
  документация и диагностика не скажут иное. Новый код должен предпочитать задокументированную
  замену, но существующие Plugin не должны ломаться во время обычных минорных
  релизов.

  ## Как мигрировать

  <Steps>
  <Step title="Перенесите помощники загрузки/записи runtime-конфига">
    Встроенные Plugin должны перестать напрямую вызывать
    `api.runtime.config.loadConfig()` и
    `api.runtime.config.writeConfigFile(...)`. Предпочитайте конфиг, который уже
    был передан в активный путь вызова. Долгоживущие обработчики, которым нужен
    текущий снимок процесса, могут использовать `api.runtime.config.current()`. Долгоживущие
    инструменты агента должны использовать `ctx.getRuntimeConfig()` из контекста инструмента внутри
    `execute`, чтобы инструмент, созданный до записи конфига, все равно видел обновленный
    runtime-конфиг.

    Записи конфига должны проходить через транзакционные помощники и выбирать
    политику после записи:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Используйте `afterWrite: { mode: "restart", reason: "..." }`, когда вызывающая сторона знает,
    что изменение требует чистого перезапуска Gateway, и
    `afterWrite: { mode: "none", reason: "..." }` только когда вызывающая сторона владеет
    последующим действием и намеренно хочет подавить планировщик перезагрузки.
    Результаты мутации включают типизированную сводку `followUp` для тестов и логирования;
    Gateway остается ответственным за применение или планирование перезапуска.
    `loadConfig` и `writeConfigFile` остаются устаревшими помощниками совместимости
    для внешних Plugin в течение окна миграции и один раз предупреждают с
    кодом совместимости `runtime-config-load-write`. Встроенные Plugin и runtime-код репозитория
    защищены сканирующими ограничителями в
    `pnpm check:deprecated-api-usage` и
    `pnpm check:no-runtime-action-load-config`: новое использование в production Plugin
    сразу завершается ошибкой, прямые записи конфига завершаются ошибкой, методы сервера Gateway должны использовать
    runtime-снимок запроса, runtime-помощники отправки/действия/клиента канала
    должны получать конфиг от своей границы, а у долгоживущих runtime-модулей
    ноль разрешенных окружающих вызовов `loadConfig()`.

    Новый код Plugin также должен избегать импорта широкого
    совместимого барреля `openclaw/plugin-sdk/config-runtime`. Используйте узкий
    подпуть SDK, соответствующий задаче:

    | Потребность | Импорт |
    | --- | --- |
    | Типы конфига, такие как `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Проверки уже загруженного конфига и поиск конфига plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Чтение текущего runtime-снимка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфига | `openclaw/plugin-sdk/config-mutation` |
    | Помощники хранилища сессий | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфиг таблиц Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-помощники групповой политики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Разрешение секретного ввода | `openclaw/plugin-sdk/secret-input-runtime` |
    | Переопределения моделей/сессий | `openclaw/plugin-sdk/model-session-runtime` |

    Встроенные Plugin и их тесты защищены сканером от широкого
    барреля, чтобы импорты и моки оставались локальными для нужного им поведения. Широкий
    баррель по-прежнему существует для внешней совместимости, но новый код не должен
    зависеть от него.

  </Step>

  <Step title="Перенесите встроенные расширения результатов инструментов в middleware">
    Встроенные Plugin должны заменить обработчики результатов инструментов только для embedded-runner
    `api.registerEmbeddedExtensionFactory(...)`
    runtime-нейтральным middleware.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Одновременно обновите манифест Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Установленные Plugin также могут регистрировать middleware результатов инструментов, когда они
    явно включены и объявляют каждый целевой runtime в
    `contracts.agentToolResultMiddleware`. Необъявленные регистрации установленного middleware
    отклоняются.

  </Step>

  <Step title="Перенесите обработчики нативных approval на capability-факты">
    Канальные Plugin с поддержкой approval теперь раскрывают нативное поведение approval через
    `approvalCapability.nativeRuntime` плюс общий реестр runtime-контекста.

    Ключевые изменения:

    - Замените `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесите auth/delivery, специфичные для approval, со старой проводки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` удален из публичного контракта channel-plugin;
      перенесите поля delivery/native/render в `approvalCapability`
    - `plugin.auth` остается только для потоков входа/выхода канала; хуки auth
      для approval там больше не читаются core
    - Регистрируйте принадлежащие каналу runtime-объекты, такие как клиенты, токены или приложения Bolt,
      через `openclaw/plugin-sdk/channel-runtime-context`
    - Не отправляйте принадлежащие Plugin уведомления о перенаправлении из нативных обработчиков approval;
      core теперь владеет уведомлениями о маршрутизации в другое место из фактических результатов доставки
    - При передаче `channelRuntime` в `createChannelManager(...)` предоставьте
      настоящую поверхность `createPluginRuntime().channel`. Частичные стабы отклоняются.

    См. `/plugins/sdk-channel-plugins` для текущей структуры capability approval.

  </Step>

  <Step title="Проверьте fallback-поведение Windows-обертки">
    Если ваш Plugin использует `openclaw/plugin-sdk/windows-spawn`, неразрешенные Windows
    `.cmd`/`.bat`-обертки теперь fail closed, если вы явно не передадите
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

    Если ваш вызывающий код не полагается намеренно на shell fallback, не задавайте
    `allowShellFallback` и вместо этого обработайте выброшенную ошибку.

  </Step>

  <Step title="Найдите устаревшие импорты">
    Найдите в своем Plugin импорты из любой из устаревших поверхностей:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замените фокусированными импортами">
    Каждый экспорт из старой поверхности сопоставляется с конкретным современным путем импорта:

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

    Для помощников на стороне хоста используйте внедренный runtime Plugin вместо прямого импорта:

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
    | вспомогательные функции хранилища сеансов | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замените широкие импорты infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` все еще существует для внешней
    совместимости, но новый код должен импортировать точечную поверхность вспомогательных функций,
    которая ему действительно нужна:

    | Потребность | Импорт |
    | --- | --- |
    | Вспомогательные функции очереди системных событий | `openclaw/plugin-sdk/system-event-runtime` |
    | Вспомогательные функции пробуждения Heartbeat, событий и видимости | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Опустошение очереди ожидающей доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрия активности канала | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кэши дедупликации в памяти и с постоянным хранилищем | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безопасные вспомогательные функции путей к локальным файлам/медиа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch с учетом диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Вспомогательные функции прокси и защищенного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типы политики SSRF-диспетчера | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типы запроса/разрешения утверждения | `openclaw/plugin-sdk/approval-runtime` |
    | Полезная нагрузка ответа на утверждение и вспомогательные функции команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Вспомогательные функции форматирования ошибок | `openclaw/plugin-sdk/error-runtime` |
    | Ожидания готовности транспорта | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Вспомогательные функции безопасных токенов | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ограниченная конкурентность асинхронных задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числовое приведение | `openclaw/plugin-sdk/number-runtime` |
    | Процессно-локальная асинхронная блокировка | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файловые блокировки | `openclaw/plugin-sdk/file-lock` |

    Встроенные plugins защищены сканером от `infra-runtime`, поэтому код репозитория
    не может откатиться к широкому barrel-экспорту.

  </Step>

  <Step title="Перенесите вспомогательные функции маршрутов каналов">
    Новый код маршрутов каналов должен использовать `openclaw/plugin-sdk/channel-route`.
    Старые имена route-key и comparable-target остаются совместимыми
    псевдонимами на время окна миграции, но новые plugins должны использовать имена маршрутов,
    которые напрямую описывают поведение:

    | Старая вспомогательная функция | Современная вспомогательная функция |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Современные вспомогательные функции маршрутов единообразно нормализуют `{ channel, to, accountId, threadId }`
    для нативных утверждений, подавления ответов, дедупликации входящих сообщений,
    доставки cron и маршрутизации сеансов.

    Не добавляйте новые использования `ChannelMessagingAdapter.parseExplicitTarget` или
    вспомогательных функций загруженных маршрутов на основе парсера (`parseExplicitTargetForLoadedChannel`
    или `resolveRouteTargetForLoadedChannel`) либо
    `resolveChannelRouteTargetWithParser(...)` из `plugin-sdk/channel-route`.
    Эти хуки устарели и остаются только для старых plugins на время
    окна миграции. Новые plugins каналов должны использовать
    `messaging.targetResolver.resolveTarget(...)` для нормализации идентификатора цели
    и fallback при отсутствии в каталоге, `messaging.inferTargetChatType(...)`, когда ядру
    заранее нужен тип собеседника, и `messaging.resolveOutboundSessionRoute(...)`
    для нативной для провайдера идентичности сеанса и треда.

  </Step>

  <Step title="Соберите и протестируйте">
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
  | `plugin-sdk/plugin-entry` | Канонический помощник точки входа Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Устаревший общий реэкспорт для определений/построителей точек входа каналов | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Экспорт корневой схемы конфигурации | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Помощник точки входа для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Специализированные определения и построители точек входа каналов | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Общие помощники мастера настройки | Транслятор настройки, запросы allowlist, построители статуса настройки |
  | `plugin-sdk/setup-runtime` | Runtime-помощники времени настройки | `createSetupTranslator`, import-safe адаптеры патчей настройки, помощники lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, делегированные прокси настройки |
  | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним адаптера настройки | Используйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Помощники инструментов настройки | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Помощники нескольких аккаунтов | Помощники списка аккаунтов/конфигурации/действий-gate |
  | `plugin-sdk/account-id` | Помощники идентификаторов аккаунтов | `DEFAULT_ACCOUNT_ID`, нормализация идентификаторов аккаунтов |
  | `plugin-sdk/account-resolution` | Помощники поиска аккаунтов | Помощники поиска аккаунта и fallback по умолчанию |
  | `plugin-sdk/account-helpers` | Узкие помощники аккаунтов | Помощники списка аккаунтов/действий аккаунта |
  | `plugin-sdk/channel-setup` | Адаптеры мастера настройки | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примитивы связывания DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Связка префикса ответа, индикации набора и доставки источника | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптеров конфигурации и помощники доступа к DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Построители схем конфигурации | Общие примитивы схем конфигурации каналов и только универсальный построитель |
  | `plugin-sdk/bundled-channel-config-schema` | Схемы конфигурации встроенных Plugins | Только встроенные Plugins, поддерживаемые OpenClaw; новые Plugins должны определять локальные для Plugin схемы |
  | `plugin-sdk/channel-config-schema-legacy` | Устаревшие схемы конфигурации встроенных Plugins | Только псевдоним совместимости; используйте `plugin-sdk/bundled-channel-config-schema` для поддерживаемых встроенных Plugins |
  | `plugin-sdk/telegram-command-config` | Помощники конфигурации команд Telegram | Нормализация имен команд, обрезка описаний, проверка дубликатов/конфликтов |
  | `plugin-sdk/channel-policy` | Разрешение политики групп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Помощники входящих конвертов | Общие помощники построения маршрутов и конвертов |
  | `plugin-sdk/channel-inbound` | Помощники приема входящих сообщений | Построение контекста, форматирование, корни, исполнители, подготовленная отправка ответов и предикаты диспетчеризации |
  | `plugin-sdk/messaging-targets` | Устаревший путь импорта разбора целевых объектов | Используйте `plugin-sdk/channel-targets` для универсальных помощников разбора целевых объектов, `plugin-sdk/channel-route` для сравнения маршрутов и принадлежащие Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` для разрешения целевых объектов, специфичных для провайдера |
  | `plugin-sdk/outbound-media` | Помощники исходящих медиа | Общая загрузка исходящих медиа |
  | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Помощники жизненного цикла исходящих сообщений | Адаптеры сообщений, квитанции, помощники надежной отправки, помощники live preview/streaming, параметры ответа, помощники жизненного цикла, исходящая идентичность и планирование payload |
  | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Помощники привязки потоков | Помощники жизненного цикла и адаптеров привязки потоков |
  | `plugin-sdk/agent-media-payload` | Устаревшие помощники payload медиа | Построитель payload медиа агента для устаревших схем полей |
  | `plugin-sdk/channel-runtime` | Устаревший shim совместимости | Только устаревшие утилиты runtime каналов |
  | `plugin-sdk/channel-send-result` | Типы результата отправки | Типы результата ответа |
  | `plugin-sdk/runtime-store` | Постоянное хранилище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкие runtime-помощники | Помощники runtime/логирования/резервного копирования/установки Plugin |
  | `plugin-sdk/runtime-env` | Узкие помощники окружения runtime | Помощники логгера/окружения runtime, тайм-аута, повторов и backoff |
  | `plugin-sdk/plugin-runtime` | Общие runtime-помощники Plugin | Помощники команд/хуков/http/интерактивности Plugin |
  | `plugin-sdk/hook-runtime` | Помощники конвейера хуков | Общие помощники конвейера Webhook/внутренних хуков |
  | `plugin-sdk/lazy-runtime` | Ленивые runtime-помощники | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Помощники процессов | Общие exec-помощники |
  | `plugin-sdk/cli-runtime` | Runtime-помощники CLI | Форматирование команд, ожидания, помощники версий |
  | `plugin-sdk/gateway-runtime` | Помощники Gateway | Клиент Gateway, помощник запуска готового event loop, разрешение объявленного LAN-хоста и помощники патчей статуса каналов |
  | `plugin-sdk/config-runtime` | Устаревший shim совместимости конфигурации | Предпочитайте `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` и `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Помощники команд Telegram | Fallback-стабильные помощники проверки команд Telegram, когда поверхность контракта встроенного Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Помощники запросов одобрения | Payload одобрения exec/Plugin, помощники возможностей/профилей одобрения, помощники нативной маршрутизации/ runtime одобрений и форматирование структурированного пути отображения одобрения |
  | `plugin-sdk/approval-auth-runtime` | Помощники авторизации одобрения | Разрешение утверждающего, авторизация действий в том же чате |
  | `plugin-sdk/approval-client-runtime` | Помощники клиента одобрения | Помощники профилей/фильтров нативного exec-одобрения |
  | `plugin-sdk/approval-delivery-runtime` | Помощники доставки одобрения | Нативные адаптеры возможностей/доставки одобрений |
  | `plugin-sdk/approval-gateway-runtime` | Помощники Gateway для одобрений | Общий помощник разрешения Gateway для одобрений |
  | `plugin-sdk/approval-handler-adapter-runtime` | Помощники адаптеров одобрения | Легкие помощники загрузки нативных адаптеров одобрения для горячих точек входа каналов |
  | `plugin-sdk/approval-handler-runtime` | Помощники обработчиков одобрения | Более широкие runtime-помощники обработчиков одобрения; предпочитайте более узкие швы адаптера/Gateway, когда их достаточно |
  | `plugin-sdk/approval-native-runtime` | Помощники целевого объекта одобрения | Помощники привязки нативного целевого объекта/аккаунта одобрения |
  | `plugin-sdk/approval-reply-runtime` | Помощники ответов одобрения | Помощники payload ответа одобрения exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Помощники runtime-контекста канала | Универсальные помощники регистрации/получения/наблюдения runtime-контекста канала |
  | `plugin-sdk/security-runtime` | Помощники безопасности | Общие помощники доверия, gating DM, файлов/путей в пределах корня, внешнего содержимого и сбора секретов |
  | `plugin-sdk/ssrf-policy` | Помощники политики SSRF | Помощники политики allowlist хостов и частных сетей |
  | `plugin-sdk/ssrf-runtime` | Runtime-помощники SSRF | Помощники pinned-dispatcher, guarded fetch и политики SSRF |
  | `plugin-sdk/system-event-runtime` | Помощники системных событий | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Помощники Heartbeat | Помощники пробуждения, событий и видимости Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Помощники очереди доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Помощники активности каналов | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Помощники дедупликации | Кэши дедупликации в памяти и с постоянным хранилищем |
  | `plugin-sdk/file-access-runtime` | Помощники доступа к файлам | Помощники безопасных путей к локальным файлам/медиа |
  | `plugin-sdk/transport-ready-runtime` | Помощники готовности транспорта | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Помощники политики exec-одобрений | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Помощники ограниченного кэша | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Помощники диагностического gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Помощники форматирования ошибок | `formatUncaughtError`, `isApprovalNotFoundError`, помощники графа ошибок |
  | `plugin-sdk/fetch-runtime` | Помощники обернутого fetch/proxy | `resolveFetch`, помощники proxy, помощники параметров EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Помощники нормализации хостов | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Помощники повторов | `RetryConfig`, `retryAsync`, исполнители политик |
  | `plugin-sdk/allow-from` | Форматирование allowlist и сопоставление ввода | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Помощники gating команд и командной поверхности | `resolveControlCommandGate`, помощники авторизации отправителя, помощники реестра команд, включая форматирование меню динамических аргументов |
  | `plugin-sdk/command-status` | Рендереры статуса/справки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Разбор ввода секретов | Помощники ввода секретов |
  | `plugin-sdk/webhook-ingress` | Помощники запросов Webhook | Утилиты целевых объектов Webhook |
  | `plugin-sdk/webhook-request-guards` | Помощники защиты тела Webhook | Помощники чтения/лимитов тела запроса |
  | `plugin-sdk/reply-runtime` | Общий runtime ответов | Входящая диспетчеризация, Heartbeat, планировщик ответов, разбиение на фрагменты |
  | `plugin-sdk/reply-dispatch-runtime` | Узкие помощники диспетчеризации ответов | Финализация, диспетчеризация провайдера и помощники меток бесед |
  | `plugin-sdk/reply-history` | Помощники истории ответов | `createChannelHistoryWindow`; устаревшие экспорты совместимости map-помощников, такие как `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` и `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планирование ссылок ответа | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Помощники фрагментов ответа | Помощники разбиения текста/markdown на фрагменты |
  | `plugin-sdk/session-store-runtime` | Помощники хранилища сессий | Помощники пути хранилища и updated-at |
  | `plugin-sdk/state-paths` | Помощники путей состояния | Помощники каталогов состояния и OAuth |
  | `plugin-sdk/routing` | Помощники маршрутизации/ключей сеанса | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, помощники нормализации ключей сеанса |
  | `plugin-sdk/status-helpers` | Помощники статуса канала | Сборщики сводок статуса канала/аккаунта, значения по умолчанию для состояния runtime-среды, помощники метаданных проблемы |
  | `plugin-sdk/target-resolver-runtime` | Помощники разрешения цели | Общие помощники разрешения цели |
  | `plugin-sdk/string-normalization-runtime` | Помощники нормализации строк | Помощники нормализации slug/строк |
  | `plugin-sdk/request-url` | Помощники URL запроса | Извлечение строковых URL из входных данных, похожих на запрос |
  | `plugin-sdk/run-command` | Помощники команд с тайм-аутом | Исполнитель команд с тайм-аутом и нормализованными stdout/stderr |
  | `plugin-sdk/param-readers` | Средства чтения параметров | Общие средства чтения параметров инструментов/CLI |
  | `plugin-sdk/tool-payload` | Извлечение полезной нагрузки инструмента | Извлечение нормализованных полезных нагрузок из объектов результата инструмента |
  | `plugin-sdk/tool-send` | Извлечение отправки инструмента | Извлечение канонических полей цели отправки из аргументов инструмента |
  | `plugin-sdk/temp-path` | Помощники временных путей | Общие помощники путей временной загрузки |
  | `plugin-sdk/logging-core` | Помощники журналирования | Журналировщик подсистемы и помощники редактирования чувствительных данных |
  | `plugin-sdk/markdown-table-runtime` | Помощники Markdown-таблиц | Помощники режима Markdown-таблиц |
  | `plugin-sdk/reply-payload` | Типы ответа на сообщение | Типы полезной нагрузки ответа |
  | `plugin-sdk/provider-setup` | Подобранные помощники настройки локального/self-hosted провайдера | Помощники обнаружения/конфигурации self-hosted провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Целевые помощники настройки OpenAI-совместимого self-hosted провайдера | Те же помощники обнаружения/конфигурации self-hosted провайдера |
  | `plugin-sdk/provider-auth-runtime` | Помощники runtime-аутентификации провайдера | Помощники разрешения API-ключей во время выполнения |
  | `plugin-sdk/provider-auth-api-key` | Помощники настройки API-ключа провайдера | Помощники онбординга API-ключа/записи профиля |
  | `plugin-sdk/provider-auth-result` | Помощники результата аутентификации провайдера | Стандартный сборщик результата OAuth-аутентификации |
  | `plugin-sdk/provider-selection-runtime` | Помощники выбора провайдера | Выбор настроенного или автоматического провайдера и объединение необработанной конфигурации провайдера |
  | `plugin-sdk/provider-env-vars` | Помощники env-var провайдера | Помощники поиска переменных окружения для аутентификации провайдера |
  | `plugin-sdk/provider-model-shared` | Общие помощники моделей/повтора провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие сборщики политики повтора, помощники endpoint провайдера и помощники нормализации идентификаторов моделей |
  | `plugin-sdk/provider-catalog-shared` | Общие помощники каталога провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчи онбординга провайдера | Помощники конфигурации онбординга |
  | `plugin-sdk/provider-http` | HTTP-помощники провайдера | Универсальные помощники возможностей HTTP/endpoint провайдера, включая помощники multipart-формы для транскрипции аудио |
  | `plugin-sdk/provider-web-fetch` | Помощники web-fetch провайдера | Помощники регистрации/кэша провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Помощники конфигурации web-search провайдера | Узкие помощники конфигурации/учетных данных web-search для провайдеров, которым не нужна связка включения Plugin |
  | `plugin-sdk/provider-web-search-contract` | Помощники контракта web-search провайдера | Узкие помощники контракта конфигурации/учетных данных web-search, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а также scoped-сеттеры/геттеры учетных данных |
  | `plugin-sdk/provider-web-search` | Помощники web-search провайдера | Помощники регистрации/кэша/runtime web-search провайдера |
  | `plugin-sdk/provider-tools` | Помощники совместимости инструментов/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` и очистка схем + диагностика DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Помощники использования провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` и другие помощники использования провайдера |
  | `plugin-sdk/provider-stream` | Помощники оберток потока провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы оберток потоков и общие помощники оберток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Помощники транспорта провайдера | Помощники нативного транспорта провайдера, такие как защищенный fetch, извлечение текста результата инструмента, преобразования транспортных сообщений и записываемые потоки транспортных событий |
  | `plugin-sdk/keyed-async-queue` | Упорядоченная асинхронная очередь | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Общие помощники медиа | Помощники загрузки/преобразования/хранения медиа, определение размеров видео на базе ffprobe и сборщики полезной нагрузки медиа |
  | `plugin-sdk/media-generation-runtime` | Общие помощники генерации медиа | Общие помощники failover, выбор кандидатов и сообщения об отсутствующей модели для генерации изображений/видео/музыки |
  | `plugin-sdk/media-understanding` | Помощники понимания медиа | Типы провайдера понимания медиа плюс экспорты помощников изображений/аудио для провайдеров |
  | `plugin-sdk/text-runtime` | Устаревший широкий экспорт совместимости текста | Используйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` и `logging-core` |
  | `plugin-sdk/text-chunking` | Помощники разбиения текста | Помощник разбиения исходящего текста |
  | `plugin-sdk/speech` | Помощники речи | Типы речевого провайдера плюс предназначенные для провайдера помощники директив, реестра и валидации, а также OpenAI-совместимый сборщик TTS |
  | `plugin-sdk/speech-core` | Общее ядро речи | Типы речевого провайдера, реестр, директивы, нормализация |
  | `plugin-sdk/realtime-transcription` | Помощники транскрипции в реальном времени | Типы провайдера, помощники реестра и общий помощник WebSocket-сеанса |
  | `plugin-sdk/realtime-voice` | Помощники голоса в реальном времени | Типы провайдера, помощники реестра/разрешения, помощники мостового сеанса, общие очереди обратной речи агента, голосовое управление активным запуском, работоспособность транскрипта/событий, подавление эха, сопоставление консультационных вопросов, координация принудительной консультации, отслеживание контекста хода, отслеживание активности вывода и помощники быстрой консультации по контексту |
  | `plugin-sdk/image-generation` | Помощники генерации изображений | Типы провайдера генерации изображений плюс помощники URL ресурсов/данных изображений и OpenAI-совместимый сборщик провайдера изображений |
  | `plugin-sdk/image-generation-core` | Общее ядро генерации изображений | Типы генерации изображений, failover, аутентификация и помощники реестра |
  | `plugin-sdk/music-generation` | Помощники генерации музыки | Типы провайдера/запроса/результата генерации музыки |
  | `plugin-sdk/music-generation-core` | Общее ядро генерации музыки | Типы генерации музыки, помощники failover, поиск провайдера и разбор model-ref |
  | `plugin-sdk/video-generation` | Помощники генерации видео | Типы провайдера/запроса/результата генерации видео |
  | `plugin-sdk/video-generation-core` | Общее ядро генерации видео | Типы генерации видео, помощники failover, поиск провайдера и разбор model-ref |
  | `plugin-sdk/interactive-runtime` | Помощники интерактивного ответа | Нормализация/сокращение полезной нагрузки интерактивного ответа |
  | `plugin-sdk/channel-config-primitives` | Примитивы конфигурации канала | Узкие примитивы схемы конфигурации канала |
  | `plugin-sdk/channel-config-writes` | Помощники записи конфигурации канала | Помощники авторизации записи конфигурации канала |
  | `plugin-sdk/channel-plugin-common` | Общая прелюдия канала | Общие экспорты прелюдии Plugin канала |
  | `plugin-sdk/channel-status` | Помощники статуса канала | Общие помощники снимка/сводки статуса канала |
  | `plugin-sdk/allowlist-config-edit` | Помощники конфигурации allowlist | Помощники редактирования/чтения конфигурации allowlist |
  | `plugin-sdk/group-access` | Помощники группового доступа | Общие помощники решений группового доступа |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости | Используйте `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Помощники защиты Direct-DM | Узкие помощники политики защиты до crypto |
  | `plugin-sdk/extension-shared` | Общие помощники расширения | Примитивы пассивного канала/статуса и помощники ambient-прокси |
  | `plugin-sdk/webhook-targets` | Помощники целей Webhook | Реестр целей Webhook и помощники установки маршрута |
  | `plugin-sdk/webhook-path` | Устаревший псевдоним пути Webhook | Используйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Общие помощники веб-медиа | Помощники загрузки удаленных/локальных медиа |
  | `plugin-sdk/zod` | Устаревший реэкспорт совместимости Zod | Импортируйте `zod` из `zod` напрямую |
  | `plugin-sdk/memory-core` | Встроенные помощники memory-core | Поверхность помощников менеджера памяти/конфигурации/файлов/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад движка памяти | Runtime-фасад индекса/поиска памяти |
  | `plugin-sdk/memory-core-host-embedding-registry` | Реестр embedding памяти | Легковесные помощники реестра провайдеров embedding памяти |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-движок хоста памяти | Экспорты foundation-движка хоста памяти |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Embedding-движок хоста памяти | Контракты embedding памяти, доступ к реестру, локальный провайдер и универсальные batch/remote-помощники; конкретные удаленные провайдеры находятся в Plugin, которым они принадлежат |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-движок хоста памяти | Экспорты QMD-движка хоста памяти |
  | `plugin-sdk/memory-core-host-engine-storage` | Движок хранилища хоста памяти | Экспорты движка хранилища хоста памяти |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные помощники хоста памяти | Мультимодальные помощники хоста памяти |
  | `plugin-sdk/memory-core-host-query` | Помощники запросов хоста памяти | Помощники запросов хоста памяти |
  | `plugin-sdk/memory-core-host-secret` | Помощники секретов хоста памяти | Помощники секретов хоста памяти |
  | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним событий памяти | Используйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Помощники статуса хоста памяти | Помощники статуса хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI-runtime хоста памяти | Помощники CLI-runtime хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-core` | Core-runtime хоста памяти | Помощники core-runtime хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-files` | Файловые/runtime-помощники хоста памяти | Файловые/runtime-помощники хоста памяти |
  | `plugin-sdk/memory-host-core` | Псевдоним core-runtime хоста памяти | Вендор-нейтральный псевдоним помощников core-runtime хоста памяти |
  | `plugin-sdk/memory-host-events` | Псевдоним журнала событий хоста памяти | Вендор-нейтральный псевдоним помощников журнала событий хоста памяти |
  | `plugin-sdk/memory-host-files` | Устаревший псевдоним файловой/runtime-памяти | Используйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Помощники управляемого markdown | Общие помощники managed-markdown для Plugin, смежных с памятью |
  | `plugin-sdk/memory-host-search` | Фасад поиска Active Memory | Ленивый runtime-фасад менеджера поиска active-memory |
  | `plugin-sdk/memory-host-status` | Устаревший псевдоним статуса хоста памяти | Используйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Тестовые утилиты | Локальный для репозитория устаревший barrel совместимости; используйте специализированные локальные подпути тестов репозитория, такие как `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` и `plugin-sdk/test-fixtures` |
</Accordion>

Эта таблица намеренно содержит общий миграционный поднабор, а не всю
поверхность SDK. Инвентарь точек входа компилятора находится в
`scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакетов генерируются из
публичного поднабора.

Зарезервированные вспомогательные стыки встроенных Plugin удалены из карты
экспортов публичного SDK, кроме явно документированных фасадов совместимости,
таких как устаревшая прослойка `plugin-sdk/discord`, сохраненная для
опубликованного пакета `@openclaw/discord@2026.3.13`. Вспомогательные
средства, специфичные для владельца, находятся внутри пакета соответствующего
Plugin; общее поведение хоста должно проходить через универсальные контракты
SDK, такие как `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
`plugin-sdk/plugin-config-runtime`.

Используйте самый узкий импорт, соответствующий задаче. Если вы не можете
найти экспорт, проверьте исходный код в `src/plugin-sdk/` или спросите
мейнтейнеров, какой универсальный контракт должен владеть этой возможностью.

## Активные устаревания

Более узкие устаревания, применимые ко всему SDK Plugin, контракту поставщика,
поверхности среды выполнения и манифесту. Каждое из них сегодня все еще
работает, но будет удалено в будущей мажорной версии. Запись под каждым
элементом сопоставляет старый API с его канонической заменой.

<AccordionGroup>
  <Accordion title="Вспомогательные построители справки command-auth → command-status">
    **Старое (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Новое (`openclaw/plugin-sdk/command-status`)**: те же сигнатуры, те же
    экспорты - просто импортируются из более узкого подпути. `command-auth`
    повторно экспортирует их как заглушки совместимости.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Вспомогательные средства проверки упоминаний → resolveInboundMentionDecision">
    **Старое**: `resolveInboundMentionRequirement({ facts, policy })` и
    `shouldDropInboundForMention(...)` из
    `openclaw/plugin-sdk/channel-inbound` или
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Новое**: `resolveInboundMentionDecision({ facts, policy })` - возвращает
    единый объект решения вместо двух отдельных вызовов.

    Нижестоящие Plugin каналов (Slack, Discord, Matrix, MS Teams) уже
    переключились.

  </Accordion>

  <Accordion title="Прослойка среды выполнения канала и вспомогательные средства действий канала">
    `openclaw/plugin-sdk/channel-runtime` - это прослойка совместимости для
    старых Plugin каналов. Не импортируйте ее из нового кода; используйте
    `openclaw/plugin-sdk/channel-runtime-context` для регистрации объектов
    среды выполнения.

    Вспомогательные средства `channelActions*` в `openclaw/plugin-sdk/channel-actions`
    устарели вместе с сырыми экспортами канала "actions". Вместо этого
    раскрывайте возможности через семантическую поверхность `presentation` -
    Plugin каналов объявляют, что они отображают (карточки, кнопки, списки
    выбора), а не какие сырые имена действий они принимают.

  </Accordion>

  <Accordion title="Вспомогательное средство tool() поставщика веб-поиска → createTool() в Plugin">
    **Старое**: фабрика `tool()` из `openclaw/plugin-sdk/provider-web-search`.

    **Новое**: реализуйте `createTool(...)` напрямую в Plugin поставщика.
    OpenClaw больше не нужен вспомогательный метод SDK для регистрации
    обертки инструмента.

  </Accordion>

  <Accordion title="Текстовые конверты каналов → BodyForAgent">
    **Старое**: `formatInboundEnvelope(...)` (и
    `ChannelMessageForAgent.channelEnvelope`) для создания плоского текстового
    конверта промпта из входящих сообщений канала.

    **Новое**: `BodyForAgent` плюс структурированные блоки пользовательского
    контекста. Plugin каналов прикрепляют метаданные маршрутизации (ветка,
    тема, ответ-на, реакции) как типизированные поля вместо конкатенации их в
    строку промпта. Вспомогательное средство `formatAgentEnvelope(...)` все
    еще поддерживается для синтезированных конвертов, обращенных к ассистенту,
    но входящие текстовые конверты выводятся из использования.

    Затронутые области: `inbound_claim`, `message_received` и любой
    пользовательский Plugin канала, который постобрабатывал текст
    `channelEnvelope`.

  </Accordion>

  <Accordion title="Хук deactivate → gateway_stop">
    **Старое**: `api.on("deactivate", handler)`.

    **Новое**: `api.on("gateway_stop", handler)`. Событие и контекст
    представляют тот же контракт очистки при завершении работы; меняется
    только имя хука.

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
    до даты после 2026-08-16.

  </Accordion>

  <Accordion title="Хук subagent_spawning → привязка потока ядром">
    **Старое**: `api.on("subagent_spawning", handler)`, возвращающий
    `threadBindingReady` или `deliveryOrigin`.

    **Новое**: позвольте ядру подготавливать привязки подагента `thread: true`
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

  <Accordion title="Типы обнаружения поставщиков → типы каталога поставщиков">
    Четыре псевдонима типов обнаружения теперь являются тонкими обертками над
    типами эпохи каталога:

    | Старый псевдоним          | Новый тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс устаревший статический набор `ProviderCapabilities` - Plugin
    поставщиков должны использовать явные хуки поставщика, такие как
    `buildReplayPolicy`, `normalizeToolSchemas` и `wrapStreamFn`, а не
    статический объект.

  </Accordion>

  <Accordion title="Хуки политики мышления → resolveThinkingProfile">
    **Старое** (три отдельных хука в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` и
    `resolveDefaultThinkingLevel(ctx)`.

    **Новое**: единый `resolveThinkingProfile(ctx)`, который возвращает
    `ProviderThinkingProfile` с каноническим `id`, необязательным `label` и
    ранжированным списком уровней. OpenClaw автоматически понижает устаревшие
    сохраненные значения по рангу профиля.

    Контекст включает `provider`, `modelId`, необязательные объединенные факты
    `reasoning` и необязательные объединенные факты `compat` модели. Plugin
    поставщиков могут использовать эти факты каталога, чтобы раскрывать
    профиль, специфичный для модели, только когда настроенный контракт запроса
    это поддерживает.

    Реализуйте один хук вместо трех. Устаревшие хуки продолжают работать в
    течение окна устаревания, но не компонуются с результатом профиля.

  </Accordion>

  <Accordion title="Внешние поставщики аутентификации → contracts.externalAuthProviders">
    **Старое**: реализация хуков внешней аутентификации без объявления
    поставщика в манифесте Plugin.

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

  <Accordion title="Поиск env-var поставщика → setup.providers[].envVars">
    **Старое** поле манифеста: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Новое**: зеркально перенесите тот же поиск env-var в `setup.providers[].envVars`
    в манифесте. Это объединяет метаданные env для настройки и статуса в одном
    месте и позволяет не запускать среду выполнения Plugin только для ответа
    на запросы env-var.

    `providerAuthEnvVars` остается поддерживаемым через адаптер совместимости
    до закрытия окна устаревания.

  </Accordion>

  <Accordion title="Регистрация Plugin памяти → registerMemoryCapability">
    **Старое**: три отдельных вызова -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Новое**: один вызов в API состояния памяти -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Те же слоты, один вызов регистрации. Аддитивные вспомогательные средства
    промптов и корпуса (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) не затронуты.

  </Accordion>

  <Accordion title="API поставщика эмбеддингов памяти">
    **Старое**: `api.registerMemoryEmbeddingProvider(...)` плюс
    `contracts.memoryEmbeddingProviders`.

    **Новое**: `api.registerEmbeddingProvider(...)` плюс
    `contracts.embeddingProviders`.

    Универсальный контракт поставщика эмбеддингов можно повторно использовать
    вне памяти, и это поддерживаемый путь для новых поставщиков. API
    регистрации, специфичный для памяти, остается подключенным как устаревшая
    совместимость, пока существующие поставщики мигрируют. Отчеты инспекции
    Plugin отмечают невстроенное использование как долг совместимости.

  </Accordion>

  <Accordion title="Типы сообщений сессии подагента переименованы">
    Два устаревших псевдонима типов все еще экспортируются из
    `src/plugins/runtime/types.ts`:

    | Старое                       | Новое                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод среды выполнения `readSession` устарел в пользу
    `getSessionMessages`. Сигнатура та же; старый метод передает вызов в
    новый.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старое**: `runtime.tasks.flow` (в единственном числе) возвращал живой
    аксессор task-flow.

    **Новое**: `runtime.tasks.managedFlows` сохраняет управляемую среду
    выполнения мутаций TaskFlow для Plugin, которые создают, обновляют,
    отменяют или запускают дочерние задачи из потока. Используйте
    `runtime.tasks.flows`, когда Plugin нужны только чтения на основе DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики встроенных расширений → middleware результатов инструментов агента">
    Описано выше в разделе "Как мигрировать → Перенесите встроенные расширения
    результатов инструментов в middleware". Добавлено здесь для полноты:
    удаленный путь `api.registerEmbeddedExtensionFactory(...)`, предназначенный
    только для встроенного runner, заменен на
    `api.registerAgentToolResultMiddleware(...)` с явным списком сред
    выполнения в `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдоним OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно экспортируемый из `openclaw/plugin-sdk`,
    теперь является однострочным псевдонимом для `OpenClawConfig`.
    Предпочитайте каноническое имя.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Устаревания уровня расширений (внутри встроенных Plugin каналов и поставщиков
в `extensions/`) отслеживаются в их собственных баррелях `api.ts` и
`runtime-api.ts`. Они не влияют на контракты сторонних Plugin и здесь не
перечислены. Если вы напрямую используете локальный баррель встроенного
Plugin, перед обновлением прочитайте комментарии об устаревании в этом
барреле.
</Note>

## График удаления

| Когда                  | Что происходит                                                         |
| ---------------------- | ---------------------------------------------------------------------- |
| **Сейчас**             | Устаревшие интерфейсы выдают предупреждения во время выполнения        |
| **Следующий мажорный выпуск** | Устаревшие интерфейсы будут удалены; Plugin, которые все еще их используют, перестанут работать |

Все основные Plugin уже были мигрированы. Внешним Plugin следует мигрировать
до следующего мажорного выпуска.

## Временное подавление предупреждений

Задайте эти переменные окружения на время миграции:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Это временный запасной выход, а не постоянное решение.

## Связанные материалы

- [Начало работы](/ru/plugins/building-plugins) - создайте свой первый Plugin
- [Обзор SDK](/ru/plugins/sdk-overview) - полный справочник импортов подпутей
- [Plugin каналов](/ru/plugins/sdk-channel-plugins) - создание Plugin каналов
- [Plugin провайдеров](/ru/plugins/sdk-provider-plugins) - создание Plugin провайдеров
- [Внутреннее устройство Plugin](/ru/plugins/architecture) - подробный разбор архитектуры
- [Манифест Plugin](/ru/plugins/manifest) - справочник схемы манифеста
