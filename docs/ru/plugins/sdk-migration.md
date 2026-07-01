---
read_when:
    - Вы видите предупреждение OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Вы видите предупреждение OPENCLAW_EXTENSION_API_DEPRECATED
    - Вы использовали api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Вы обновляете Plugin до современной архитектуры Plugin
    - Вы поддерживаете внешний Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдите с устаревшего слоя обратной совместимости на современный SDK Plugin
title: Миграция SDK Plugin
x-i18n:
    generated_at: "2026-07-01T08:23:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перешел от широкого слоя обратной совместимости к современной архитектуре Plugin
с точечными, документированными импортами. Если ваш Plugin был создан до
новой архитектуры, это руководство поможет выполнить миграцию.

## Что меняется

Старая система Plugin предоставляла две полностью открытые поверхности, которые позволяли Plugin импортировать
все необходимое из одной точки входа:

- **`openclaw/plugin-sdk/compat`** - единый импорт, который повторно экспортировал десятки
  вспомогательных функций. Он был введен, чтобы старые Plugin на основе хуков продолжали работать, пока
  создавалась новая архитектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий runtime-barrel с вспомогательными средствами, который
  смешивал системные события, состояние Heartbeat, очереди доставки, вспомогательные средства fetch/proxy,
  файловые helpers, типы подтверждений и несвязанные утилиты.
- **`openclaw/plugin-sdk/config-runtime`** - широкий config-barrel совместимости,
  который все еще содержит устаревшие прямые helpers загрузки/записи в течение окна миграции.
- **`openclaw/extension-api`** - мост, который давал Plugin прямой доступ к
  host-side helpers, таким как встроенный runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** - удаленный хук bundled
  extension только для embedded-runner, который мог наблюдать события embedded-runner, такие как
  `tool_result`.

Широкие поверхности импорта теперь **устарели**. Они все еще работают во время выполнения,
но новые Plugin не должны их использовать, а существующие Plugin должны выполнить миграцию до того,
как следующий major-release удалит их. API регистрации extension factory только для embedded-runner
удален; вместо него используйте middleware для результатов инструментов.

OpenClaw не удаляет и не переинтерпретирует документированное поведение Plugin в том же
изменении, которое вводит замену. Ломающие изменения контракта должны сначала пройти
через адаптер совместимости, диагностику, документацию и окно устаревания.
Это относится к импортам SDK, полям manifest, API настройки, хукам и поведению
регистрации во время выполнения.

<Warning>
  Слой обратной совместимости будет удален в будущем major-release.
  Plugin, которые все еще импортируют из этих поверхностей, сломаются, когда это произойдет.
  Устаревшие регистрации embedded extension factory уже больше не загружаются.
</Warning>

## Почему это изменилось

Старый подход создавал проблемы:

- **Медленный запуск** - импорт одного helper загружал десятки несвязанных модулей
- **Циклические зависимости** - широкие повторные экспорты упрощали создание циклов импортов
- **Неясная поверхность API** - невозможно было понять, какие экспорты стабильны, а какие внутренние

Современный SDK Plugin исправляет это: каждый путь импорта (`openclaw/plugin-sdk/\<subpath\>`)
является небольшим, самодостаточным модулем с ясным назначением и документированным контрактом.

Устаревшие удобные provider-поверхности для bundled channels также удалены.
Channel-branded helper seams были приватными shortcut в mono-repo, а не стабильными
контрактами Plugin. Используйте вместо них узкие generic subpaths SDK. Внутри bundled
workspace Plugin держите provider-owned helpers в собственном `api.ts` или
`runtime-api.ts` этого Plugin.

Текущие примеры bundled providers:

- Anthropic хранит Claude-specific stream helpers в собственной поверхности `api.ts` /
  `contract-api.ts`
- OpenAI хранит provider builders, default-model helpers и realtime provider
  builders в собственном `api.ts`
- OpenRouter хранит provider builder и helpers onboarding/config в собственном
  `api.ts`

## План миграции Talk и голосовой связи в реальном времени

Код realtime voice, telephony, meetings и browser Talk перемещается из
surface-local учета turn в общий контроллер сессии Talk, экспортируемый
`openclaw/plugin-sdk/realtime-voice`. Новый контроллер владеет общей оболочкой событий Talk,
активным состоянием turn, состоянием capture, состоянием output-audio, недавней
историей событий и отклонением stale-turn. Provider Plugin должны продолжать владеть
vendor-specific realtime sessions; surface Plugin должны продолжать владеть capture,
playback, telephony и особенностями meetings.

Эта миграция Talk намеренно является breaking-clean:

1. Оставьте общие primitives controller/runtime в
   `plugin-sdk/realtime-voice`.
2. Переведите bundled surfaces на общий контроллер: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime и native push-to-talk.
3. Замените старые семейства Talk RPC финальным API `talk.session.*` и
   `talk.client.*`.
4. Объявляйте один live-канал событий Talk в Gateway
   `hello-ok.features.events`: `talk.event`.
5. Удалите старый realtime HTTP endpoint и любой путь request-time переопределения
   инструкций.

Новый код не должен вызывать `createTalkEventSequencer(...)` напрямую, если только он не
реализует низкоуровневый adapter или test fixture. Предпочитайте общий контроллер,
чтобы turn-scoped события не могли испускаться без turn id, stale вызовы `turnEnd` /
`turnCancel` не могли очистить более новый активный turn, а события жизненного цикла
output-audio оставались согласованными между telephony, meetings, browser relay, managed-room
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
потому что браузер владеет provider negotiation и media transport, тогда как
Gateway владеет credentials, instructions и tool policy. `talk.session.*` является
общей Gateway-managed surface для gateway-relay realtime, gateway-relay
transcription и managed-room native STT/TTS sessions.

Устаревшие configs, которые размещали realtime selectors рядом с `talk.provider` /
`talk.providers`, следует исправить с помощью `openclaw doctor --fix`; runtime Talk
не переинтерпретирует config provider speech/TTS как config realtime provider.

Поддерживаемые комбинации `talk.session.create` намеренно ограничены:

| Режим           | Транспорт       | Brain           | Владелец           | Примечания                                                                                                        |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex provider audio передается через Gateway; вызовы инструментов маршрутизируются через tool agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Только streaming STT; вызывающие стороны отправляют входное audio и получают события transcript.                   |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Комнаты в стиле push-to-talk и walkie-talkie, где client владеет capture/playback, а Gateway владеет состоянием turn. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only room mode для trusted first-party surfaces, которые напрямую выполняют tool actions Gateway.            |

Карта удаленных методов:

| Старый                           | Новый                                                    |
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

Унифицированный словарь управления также намеренно узкий:

  | Метод                          | Применяется к                                              | Контракт                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Добавить фрагмент аудио PCM в base64 к сеансу провайдера, принадлежащему тому же подключению Gateway.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Начать пользовательский ход managed-room.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершить активный ход после проверки устаревшего хода.                                                                                                                                         |
  | `talk.session.cancelTurn`       | все сеансы, принадлежащие Gateway                              | Отменить активную работу захвата/провайдера/агента/TTS для хода.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Остановить аудиовывод ассистента, не обязательно завершая пользовательский ход.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершить вызов инструмента провайдера, выданный ретранслятором; передайте `options.willContinue` для промежуточного вывода или `options.suppressResponse`, чтобы удовлетворить вызов без еще одного ответа ассистента. |
  | `talk.session.steer`            | сеансы Talk с поддержкой агента                              | Отправить голосовое управляющее действие `status`, `steer`, `cancel` или `followup` в активный встроенный запуск, разрешенный из сеанса Talk.                                                                |
  | `talk.session.close`            | все унифицированные сеансы                                    | Остановить сеансы ретранслятора или отозвать состояние managed-room, затем забыть идентификатор унифицированного сеанса.                                                                                                    |

  Не добавляйте в ядро специальные случаи для провайдеров или платформ, чтобы это работало.
  Ядро владеет семантикой сеансов Talk. Plugin провайдеров владеют настройкой сеансов поставщиков.
  Голосовые вызовы и Google Meet владеют адаптерами телефонии/встреч. Браузерные и нативные
  приложения владеют UX захвата/воспроизведения устройства.

  ## Политика совместимости

  Для внешних плагинов работа по совместимости выполняется в таком порядке:

  1. добавить новый контракт
  2. сохранить старое поведение, подключенное через адаптер совместимости
  3. выдавать диагностическое сообщение или предупреждение с названием старого пути и замены
  4. покрыть оба пути тестами
  5. задокументировать устаревание и путь миграции
  6. удалить только после объявленного окна миграции, обычно в мажорном выпуске

  Сопровождающие могут проверить текущую очередь миграций с помощью
  `pnpm plugins:boundary-report`. Используйте `pnpm plugins:boundary-report:summary` для
  компактных счетчиков, `--owner <id>` для одного Plugin или владельца совместимости и
  `pnpm plugins:boundary-report:ci`, когда CI-гейт должен падать из-за просроченных
  записей совместимости, зарезервированных импортов SDK между владельцами или неиспользуемых
  зарезервированных подпутей SDK. Отчет группирует устаревшие
  записи совместимости по дате удаления, считает локальные ссылки в коде/документации,
  показывает зарезервированные импорты SDK между владельцами и суммирует приватный
  мост SDK memory-host, чтобы очистка совместимости оставалась явной, а не
  полагалась на разовые поиски. Зарезервированные подпути SDK должны иметь отслеженное использование владельцами;
  неиспользуемые экспорты зарезервированных помощников следует удалить из публичного SDK.

  Если поле манифеста все еще принимается, авторы плагинов могут продолжать использовать его, пока
  документация и диагностика не скажут обратное. Новый код должен предпочитать документированную
  замену, но существующие плагины не должны ломаться во время обычных минорных
  выпусков.

  ## Как выполнить миграцию

  <Steps>
  <Step title="Мигрируйте помощники загрузки/записи конфигурации среды выполнения">
    Встроенным плагинам следует прекратить напрямую вызывать
    `api.runtime.config.loadConfig()` и
    `api.runtime.config.writeConfigFile(...)`. Предпочитайте конфигурацию, которая уже
    была передана в активный путь вызова. Долгоживущие обработчики, которым нужен
    текущий снимок процесса, могут использовать `api.runtime.config.current()`. Долгоживущие
    агентские инструменты должны использовать `ctx.getRuntimeConfig()` из контекста инструмента внутри
    `execute`, чтобы инструмент, созданный до записи конфигурации, все равно видел обновленную
    конфигурацию среды выполнения.

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

    Используйте `afterWrite: { mode: "restart", reason: "..." }`, когда вызывающая сторона знает,
    что изменение требует чистого перезапуска gateway, и
    `afterWrite: { mode: "none", reason: "..." }` только когда вызывающая сторона владеет
    последующим действием и намеренно хочет подавить планировщик перезагрузки.
    Результаты мутации включают типизированную сводку `followUp` для тестов и логирования;
    gateway остается ответственным за применение или планирование перезапуска.
    `loadConfig` и `writeConfigFile` остаются устаревшими помощниками совместимости
    для внешних плагинов на время окна миграции и один раз предупреждают с
    кодом совместимости `runtime-config-load-write`. Встроенные плагины и код среды выполнения
    репозитория защищены ограничителями сканера в
    `pnpm check:deprecated-api-usage` и
    `pnpm check:no-runtime-action-load-config`: новое использование в production-коде Plugin
    сразу завершается ошибкой, прямые записи конфигурации завершаются ошибкой, методы сервера gateway должны использовать
    снимок среды выполнения запроса, помощники отправки/действий/клиента runtime-канала
    должны получать конфигурацию из своей границы, а долгоживущие runtime-модули имеют
    ноль разрешенных фоновых вызовов `loadConfig()`.

    Новый код Plugin также должен избегать импорта широкого
    совместимого барреля `openclaw/plugin-sdk/config-runtime`. Используйте узкий
    подпуть SDK, соответствующий задаче:

    | Потребность | Импорт |
    | --- | --- |
    | Типы конфигурации, такие как `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Утверждения уже загруженной конфигурации и поиск конфигурации plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Чтение текущего снимка среды выполнения | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфигурации | `openclaw/plugin-sdk/config-mutation` |
    | Помощники хранилища сеансов | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфигурация таблицы Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-помощники групповой политики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Разрешение секретного ввода | `openclaw/plugin-sdk/secret-input-runtime` |
    | Переопределения модели/сеанса | `openclaw/plugin-sdk/model-session-runtime` |

    Встроенные плагины и их тесты защищены сканером от широкого
    барреля, чтобы импорты и моки оставались локальными для нужного им поведения. Широкий
    баррель все еще существует для внешней совместимости, но новый код не должен
    зависеть от него.

  </Step>

  <Step title="Мигрируйте встроенные расширения результатов инструментов на middleware">
    Встроенные плагины должны заменить обработчики результатов инструментов
    `api.registerEmbeddedExtensionFactory(...)`, предназначенные только для embedded-runner,
    на runtime-нейтральное middleware.

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

    Установленные плагины также могут регистрировать middleware результатов инструментов, когда они
    явно включены и объявляют каждую целевую среду выполнения в
    `contracts.agentToolResultMiddleware`. Необъявленные регистрации установленного middleware
    отклоняются.

  </Step>

  <Step title="Мигрируйте обработчики native-одобрений на факты capability">
    Channel-плагины, поддерживающие одобрения, теперь раскрывают native-поведение одобрений через
    `approvalCapability.nativeRuntime` плюс общий реестр runtime-контекста.

    Ключевые изменения:

    - Замените `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесите auth/delivery, относящиеся к одобрениям, со старой проводки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` удален из публичного контракта channel-plugin;
      перенесите поля delivery/native/render в `approvalCapability`
    - `plugin.auth` остается только для потоков входа/выхода канала; auth-хуки одобрений
      там больше не читаются ядром
    - Регистрируйте runtime-объекты, принадлежащие каналу, такие как клиенты, токены или приложения Bolt,
      через `openclaw/plugin-sdk/channel-runtime-context`
    - Не отправляйте принадлежащие Plugin уведомления о перенаправлении из native-обработчиков одобрений;
      ядро теперь владеет уведомлениями routed-elsewhere на основе фактических результатов доставки
    - При передаче `channelRuntime` в `createChannelManager(...)` предоставляйте
      реальную поверхность `createPluginRuntime().channel`. Частичные заглушки отклоняются.

    См. `/plugins/sdk-channel-plugins` для текущей структуры approval capability.

  </Step>

  <Step title="Проверьте fallback-поведение Windows wrapper">
    Если ваш Plugin использует `openclaw/plugin-sdk/windows-spawn`, неразрешенные Windows
    `.cmd`/`.bat` wrapper теперь fail-closed, если вы явно не передадите
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

    Если ваша вызывающая сторона не полагается намеренно на shell fallback, не задавайте
    `allowShellFallback` и вместо этого обработайте выброшенную ошибку.

  </Step>

  <Step title="Найдите устаревшие импорты">
    Найдите в своем Plugin импорты из любой устаревшей поверхности:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замените на сфокусированные импорты">
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

    Для host-side помощников используйте внедренную среду выполнения Plugin вместо прямого импорта:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Такой же шаблон применяется к другим устаревшим вспомогательным функциям моста:

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
    `openclaw/plugin-sdk/infra-runtime` по-прежнему существует для внешней
    совместимости, но новый код должен импортировать узкую поверхность вспомогательных функций,
    которая ему действительно нужна:

    | Потребность | Импорт |
    | --- | --- |
    | Вспомогательные функции очереди системных событий | `openclaw/plugin-sdk/system-event-runtime` |
    | Вспомогательные функции пробуждения Heartbeat, событий и видимости | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Опустошение очереди ожидающих доставок | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрия активности канала | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кэши дедупликации | `openclaw/plugin-sdk/dedupe-runtime` |
    | Вспомогательные функции безопасных путей к локальным файлам и медиа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch с учетом диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Вспомогательные функции прокси и защищенного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типы политики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типы запроса и разрешения подтверждения | `openclaw/plugin-sdk/approval-runtime` |
    | Вспомогательные функции полезной нагрузки ответа на подтверждение и команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Вспомогательные функции форматирования ошибок | `openclaw/plugin-sdk/error-runtime` |
    | Ожидания готовности транспорта | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Вспомогательные функции безопасных токенов | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ограниченная конкурентность асинхронных задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числовое приведение | `openclaw/plugin-sdk/number-runtime` |
    | Локальная для процесса асинхронная блокировка | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файловые блокировки | `openclaw/plugin-sdk/file-lock` |

    Встроенные плагины защищены сканером от `infra-runtime`, поэтому код репозитория
    не может вернуться к широкому barrel.

  </Step>

  <Step title="Перенесите вспомогательные функции маршрутов каналов">
    Новый код маршрутов каналов должен использовать `openclaw/plugin-sdk/channel-route`.
    Старые имена route-key и comparable-target остаются псевдонимами совместимости
    на время окна миграции, но новые плагины должны использовать имена маршрутов,
    которые напрямую описывают поведение:

    | Старая вспомогательная функция | Современная вспомогательная функция |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Современные вспомогательные функции маршрутов единообразно нормализуют `{ channel, to, accountId, threadId }`
    для нативных подтверждений, подавления ответов, входящей дедупликации,
    доставки Cron и маршрутизации сеансов.

    Не добавляйте новые использования `ChannelMessagingAdapter.parseExplicitTarget` или
    вспомогательных функций загруженных маршрутов на базе парсера (`parseExplicitTargetForLoadedChannel`
    или `resolveRouteTargetForLoadedChannel`), а также
    `resolveChannelRouteTargetWithParser(...)` из `plugin-sdk/channel-route`.
    Эти хуки устарели и остаются только для старых плагинов на время
    окна миграции. Новые плагины каналов должны использовать
    `messaging.targetResolver.resolveTarget(...)` для нормализации id цели
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

  <Accordion title="Таблица распространенных путей импорта">
  | Путь импорта | Назначение | Ключевые экспорты |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Каноническая вспомогательная функция точки входа Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Устаревший общий реэкспорт для определений/сборщиков точек входа канала | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Экспорт корневой схемы конфигурации | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Вспомогательная функция точки входа одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусированные определения и сборщики точек входа канала | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Общие вспомогательные функции мастера настройки | Переводчик настройки, запросы списка разрешений, сборщики статуса настройки |
  | `plugin-sdk/setup-runtime` | Runtime-вспомогательные функции на этапе настройки | `createSetupTranslator`, безопасные для импорта адаптеры патчей настройки, вспомогательные функции заметок поиска, `promptResolvedAllowFrom`, `splitSetupEntries`, делегированные прокси настройки |
  | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним адаптера настройки | Используйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Вспомогательные функции инструментов настройки | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Вспомогательные функции для нескольких аккаунтов | Вспомогательные функции списка аккаунтов/конфигурации/шлюза действий |
  | `plugin-sdk/account-id` | Вспомогательные функции account-id | `DEFAULT_ACCOUNT_ID`, нормализация account-id |
  | `plugin-sdk/account-resolution` | Вспомогательные функции поиска аккаунтов | Поиск аккаунта + вспомогательные функции отката к значению по умолчанию |
  | `plugin-sdk/account-helpers` | Узкие вспомогательные функции аккаунтов | Вспомогательные функции списка аккаунтов/действий аккаунта |
  | `plugin-sdk/channel-setup` | Адаптеры мастера настройки | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примитивы сопряжения DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Связка префикса ответа, индикации набора и доставки источника | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптеров конфигурации и вспомогательные функции доступа к DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Сборщики схем конфигурации | Общие примитивы схемы конфигурации канала и только универсальный сборщик |
  | `plugin-sdk/bundled-channel-config-schema` | Встроенные схемы конфигурации | Только встроенные plugins, поддерживаемые OpenClaw; новые plugins должны определять локальные для Plugin схемы |
  | `plugin-sdk/channel-config-schema-legacy` | Устаревшие встроенные схемы конфигурации | Только псевдоним совместимости; используйте `plugin-sdk/bundled-channel-config-schema` для поддерживаемых встроенных plugins |
  | `plugin-sdk/telegram-command-config` | Вспомогательные функции конфигурации команд Telegram | Нормализация имени команды, обрезка описания, проверка дубликатов/конфликтов |
  | `plugin-sdk/channel-policy` | Разрешение политики групп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Вспомогательные функции входящего конверта | Общие вспомогательные функции маршрута + сборщика конверта |
  | `plugin-sdk/channel-inbound` | Вспомогательные функции приема входящих сообщений | Построение контекста, форматирование, корни, раннеры, подготовленная отправка ответа и предикаты отправки |
  | `plugin-sdk/messaging-targets` | Устаревший путь импорта разбора целей | Используйте `plugin-sdk/channel-targets` для универсальных вспомогательных функций разбора целей, `plugin-sdk/channel-route` для сравнения маршрутов и принадлежащие Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` для зависящего от провайдера разрешения целей |
  | `plugin-sdk/outbound-media` | Вспомогательные функции исходящих медиа | Общая загрузка исходящих медиа |
  | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Вспомогательные функции жизненного цикла исходящих сообщений | Адаптеры сообщений, квитанции, вспомогательные функции надежной отправки, вспомогательные функции live preview/streaming, параметры ответа, вспомогательные функции жизненного цикла, исходящая идентичность и планирование полезной нагрузки |
  | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Вспомогательные функции привязок тредов | Жизненный цикл привязок тредов и вспомогательные функции адаптеров |
  | `plugin-sdk/agent-media-payload` | Устаревшие вспомогательные функции полезной нагрузки медиа | Сборщик полезной нагрузки медиа агента для устаревших раскладок полей |
  | `plugin-sdk/channel-runtime` | Устаревший shim совместимости | Только устаревшие runtime-утилиты канала |
  | `plugin-sdk/channel-send-result` | Типы результата отправки | Типы результата ответа |
  | `plugin-sdk/runtime-store` | Постоянное хранилище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкие runtime-вспомогательные функции | Вспомогательные функции runtime/логирования/резервного копирования/установки Plugin |
  | `plugin-sdk/runtime-env` | Узкие вспомогательные функции runtime-окружения | Вспомогательные функции логгера/runtime-окружения, тайм-аута, повтора и backoff |
  | `plugin-sdk/plugin-runtime` | Общие runtime-вспомогательные функции Plugin | Вспомогательные функции команд/hooks/http/интерактивности Plugin |
  | `plugin-sdk/hook-runtime` | Вспомогательные функции конвейера hook | Общие вспомогательные функции конвейера webhook/внутренних hook |
  | `plugin-sdk/lazy-runtime` | Вспомогательные функции ленивого runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Вспомогательные функции процессов | Общие вспомогательные функции exec |
  | `plugin-sdk/cli-runtime` | Runtime-вспомогательные функции CLI | Форматирование команд, ожидания, вспомогательные функции версий |
  | `plugin-sdk/gateway-runtime` | Вспомогательные функции Gateway | Клиент Gateway, вспомогательная функция запуска готового event loop и вспомогательные функции патча статуса канала |
  | `plugin-sdk/config-runtime` | Устаревший shim совместимости конфигурации | Предпочитайте `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` и `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Вспомогательные функции команд Telegram | Стабильные при откате вспомогательные функции проверки команд Telegram, когда поверхность встроенного контракта Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Вспомогательные функции запросов подтверждения | Полезная нагрузка подтверждения exec/Plugin, вспомогательные функции возможностей/профилей подтверждения, native-маршрутизация/runtime подтверждения и форматирование пути структурированного отображения подтверждения |
  | `plugin-sdk/approval-auth-runtime` | Вспомогательные функции auth подтверждения | Разрешение подтверждающего, auth действий в том же чате |
  | `plugin-sdk/approval-client-runtime` | Вспомогательные функции клиента подтверждения | Вспомогательные функции профиля/фильтра native exec-подтверждения |
  | `plugin-sdk/approval-delivery-runtime` | Вспомогательные функции доставки подтверждений | Native-адаптеры возможностей/доставки подтверждений |
  | `plugin-sdk/approval-gateway-runtime` | Вспомогательные функции approval gateway | Общая вспомогательная функция разрешения approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Вспомогательные функции адаптера подтверждений | Легковесные вспомогательные функции загрузки native-адаптера подтверждений для горячих точек входа канала |
  | `plugin-sdk/approval-handler-runtime` | Вспомогательные функции обработчика подтверждений | Более широкие runtime-вспомогательные функции обработчика подтверждений; предпочитайте более узкие адаптерные/Gateway-границы, когда их достаточно |
  | `plugin-sdk/approval-native-runtime` | Вспомогательные функции цели подтверждения | Вспомогательные функции привязки native-цели/аккаунта подтверждения |
  | `plugin-sdk/approval-reply-runtime` | Вспомогательные функции ответа подтверждения | Вспомогательные функции полезной нагрузки ответа подтверждения exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Вспомогательные функции runtime-контекста канала | Универсальные вспомогательные функции регистрации/получения/наблюдения runtime-контекста канала |
  | `plugin-sdk/security-runtime` | Вспомогательные функции безопасности | Общие вспомогательные функции доверия, шлюза DM, ограниченных корнем файлов/путей, внешнего контента и сбора секретов |
  | `plugin-sdk/ssrf-policy` | Вспомогательные функции политики SSRF | Вспомогательные функции списка разрешенных хостов и политики частной сети |
  | `plugin-sdk/ssrf-runtime` | Runtime-вспомогательные функции SSRF | Закрепленный dispatcher, защищенный fetch, вспомогательные функции политики SSRF |
  | `plugin-sdk/system-event-runtime` | Вспомогательные функции системных событий | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Вспомогательные функции Heartbeat | Пробуждение, событие и вспомогательные функции видимости Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Вспомогательные функции очереди доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Вспомогательные функции активности канала | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Вспомогательные функции дедупликации | Кэши дедупликации в памяти |
  | `plugin-sdk/file-access-runtime` | Вспомогательные функции доступа к файлам | Вспомогательные функции безопасных путей к локальным файлам/медиа |
  | `plugin-sdk/transport-ready-runtime` | Вспомогательные функции готовности транспорта | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Вспомогательные функции политики подтверждения exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Вспомогательные функции ограниченного кэша | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Вспомогательные функции шлюза диагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Вспомогательные функции форматирования ошибок | `formatUncaughtError`, `isApprovalNotFoundError`, вспомогательные функции графа ошибок |
  | `plugin-sdk/fetch-runtime` | Вспомогательные функции обернутого fetch/proxy | `resolveFetch`, вспомогательные функции proxy, вспомогательные функции параметров EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Вспомогательные функции нормализации хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Вспомогательные функции повторов | `RetryConfig`, `retryAsync`, раннеры политик |
  | `plugin-sdk/allow-from` | Форматирование списка разрешений и сопоставление ввода | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюз команд и вспомогательные функции поверхности команд | `resolveControlCommandGate`, вспомогательные функции авторизации отправителя, вспомогательные функции реестра команд, включая форматирование меню динамических аргументов |
  | `plugin-sdk/command-status` | Рендереры статуса/справки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Разбор ввода секретов | Вспомогательные функции ввода секретов |
  | `plugin-sdk/webhook-ingress` | Вспомогательные функции запросов Webhook | Утилиты целей Webhook |
  | `plugin-sdk/webhook-request-guards` | Вспомогательные функции защиты тела Webhook | Вспомогательные функции чтения/лимита тела запроса |
  | `plugin-sdk/reply-runtime` | Общий runtime ответов | Входящая отправка, heartbeat, планировщик ответов, разбиение на фрагменты |
  | `plugin-sdk/reply-dispatch-runtime` | Узкие вспомогательные функции отправки ответов | Финализация, отправка провайдеру и вспомогательные функции меток бесед |
  | `plugin-sdk/reply-history` | Вспомогательные функции истории ответов | `createChannelHistoryWindow`; устаревшие экспорты совместимости map-вспомогательных функций, такие как `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` и `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планирование ссылок ответа | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Вспомогательные функции фрагментов ответа | Вспомогательные функции разбиения текста/markdown на фрагменты |
  | `plugin-sdk/session-store-runtime` | Вспомогательные функции хранилища сессий | Вспомогательные функции пути хранилища + updated-at |
  | `plugin-sdk/state-paths` | Вспомогательные функции путей состояния | Вспомогательные функции каталогов состояния и OAuth |
  | `plugin-sdk/routing` | Вспомогательные функции маршрутизации/ключа сеанса | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, вспомогательные функции нормализации ключа сеанса |
  | `plugin-sdk/status-helpers` | Вспомогательные функции статуса канала | Построители сводки статуса канала/аккаунта, значения по умолчанию состояния среды выполнения, вспомогательные функции метаданных проблем |
  | `plugin-sdk/target-resolver-runtime` | Вспомогательные функции разрешения цели | Общие вспомогательные функции разрешения цели |
  | `plugin-sdk/string-normalization-runtime` | Вспомогательные функции нормализации строк | Вспомогательные функции нормализации slug/строк |
  | `plugin-sdk/request-url` | Вспомогательные функции URL запроса | Извлечение строковых URL из входных данных, похожих на запрос |
  | `plugin-sdk/run-command` | Вспомогательные функции команд с тайм-аутом | Средство запуска команд с таймингом и нормализованными stdout/stderr |
  | `plugin-sdk/param-readers` | Средства чтения параметров | Общие средства чтения параметров tool/CLI |
  | `plugin-sdk/tool-payload` | Извлечение payload инструмента | Извлечение нормализованных payload из объектов результата инструмента |
  | `plugin-sdk/tool-send` | Извлечение отправки инструмента | Извлечение канонических полей цели отправки из аргументов инструмента |
  | `plugin-sdk/temp-path` | Вспомогательные функции временных путей | Общие вспомогательные функции путей временной загрузки |
  | `plugin-sdk/logging-core` | Вспомогательные функции логирования | Логгер подсистемы и вспомогательные функции редактирования секретов |
  | `plugin-sdk/markdown-table-runtime` | Вспомогательные функции Markdown-таблиц | Вспомогательные функции режима Markdown-таблиц |
  | `plugin-sdk/reply-payload` | Типы ответа на сообщение | Типы payload ответа |
  | `plugin-sdk/provider-setup` | Подобранные вспомогательные функции настройки локальных/self-hosted провайдеров | Вспомогательные функции обнаружения/настройки self-hosted провайдеров |
  | `plugin-sdk/self-hosted-provider-setup` | Специализированные вспомогательные функции настройки OpenAI-совместимых self-hosted провайдеров | Те же вспомогательные функции обнаружения/настройки self-hosted провайдеров |
  | `plugin-sdk/provider-auth-runtime` | Вспомогательные функции аутентификации провайдера в среде выполнения | Вспомогательные функции разрешения API-ключей в среде выполнения |
  | `plugin-sdk/provider-auth-api-key` | Вспомогательные функции настройки API-ключа провайдера | Вспомогательные функции онбординга API-ключа/записи профиля |
  | `plugin-sdk/provider-auth-result` | Вспомогательные функции результата аутентификации провайдера | Стандартный построитель результата OAuth-аутентификации |
  | `plugin-sdk/provider-selection-runtime` | Вспомогательные функции выбора провайдера | Выбор настроенного или автоматического провайдера и слияние сырой конфигурации провайдера |
  | `plugin-sdk/provider-env-vars` | Вспомогательные функции env-var провайдера | Вспомогательные функции поиска env-var аутентификации провайдера |
  | `plugin-sdk/provider-model-shared` | Общие вспомогательные функции модели/повтора провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители политики повторов, вспомогательные функции endpoint провайдера и вспомогательные функции нормализации model-id |
  | `plugin-sdk/provider-catalog-shared` | Общие вспомогательные функции каталога провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчи онбординга провайдера | Вспомогательные функции конфигурации онбординга |
  | `plugin-sdk/provider-http` | Вспомогательные функции HTTP провайдера | Общие вспомогательные функции возможностей HTTP/endpoint провайдера, включая вспомогательные функции multipart-формы для транскрипции аудио |
  | `plugin-sdk/provider-web-fetch` | Вспомогательные функции web-fetch провайдера | Вспомогательные функции регистрации/кэша провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Вспомогательные функции конфигурации web-search провайдера | Узкие вспомогательные функции конфигурации/учетных данных web-search для провайдеров, которым не нужна связка включения Plugin |
  | `plugin-sdk/provider-web-search-contract` | Вспомогательные функции контракта web-search провайдера | Узкие вспомогательные функции контракта конфигурации/учетных данных web-search, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, и scoped-сеттеры/геттеры учетных данных |
  | `plugin-sdk/provider-web-search` | Вспомогательные функции web-search провайдера | Вспомогательные функции регистрации/кэша/среды выполнения провайдера web-search |
  | `plugin-sdk/provider-tools` | Вспомогательные функции совместимости инструментов/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` и очистка схем + диагностика DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Вспомогательные функции использования провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` и другие вспомогательные функции использования провайдера |
  | `plugin-sdk/provider-stream` | Вспомогательные функции оберток потока провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы оберток потока и общие вспомогательные функции оберток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Вспомогательные функции транспорта провайдера | Вспомогательные функции нативного транспорта провайдера, такие как защищенный fetch, извлечение текста результата инструмента, преобразования транспортных сообщений и записываемые потоки транспортных событий |
  | `plugin-sdk/keyed-async-queue` | Упорядоченная асинхронная очередь | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Общие вспомогательные функции медиа | Вспомогательные функции получения/преобразования/хранения медиа, определение размеров видео на базе ffprobe и построители media payload |
  | `plugin-sdk/media-generation-runtime` | Общие вспомогательные функции генерации медиа | Общие вспомогательные функции failover, выбор кандидата и сообщения об отсутствующей модели для генерации изображений/видео/музыки |
  | `plugin-sdk/media-understanding` | Вспомогательные функции понимания медиа | Типы провайдеров понимания медиа плюс экспорты вспомогательных функций изображений/аудио для провайдеров |
  | `plugin-sdk/text-runtime` | Устаревший широкий экспорт совместимости текста | Используйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` и `logging-core` |
  | `plugin-sdk/text-chunking` | Вспомогательные функции разбиения текста | Вспомогательная функция разбиения исходящего текста |
  | `plugin-sdk/speech` | Вспомогательные функции речи | Типы речевых провайдеров плюс директива, реестр, вспомогательные функции валидации для провайдеров и OpenAI-совместимый построитель TTS |
  | `plugin-sdk/speech-core` | Общее ядро речи | Типы речевых провайдеров, реестр, директивы, нормализация |
  | `plugin-sdk/realtime-transcription` | Вспомогательные функции транскрипции в реальном времени | Типы провайдеров, вспомогательные функции реестра и общий вспомогательный объект WebSocket-сеанса |
  | `plugin-sdk/realtime-voice` | Вспомогательные функции голоса в реальном времени | Типы провайдеров, вспомогательные функции реестра/разрешения, вспомогательные функции bridge-сеанса, общие очереди ответа агента голосом, голосовое управление активным запуском, здоровье транскрипта/событий, подавление эха, сопоставление вопросов консультации, координация принудительной консультации, отслеживание turn-context, отслеживание активности вывода и вспомогательные функции быстрой консультации контекста |
  | `plugin-sdk/image-generation` | Вспомогательные функции генерации изображений | Типы провайдеров генерации изображений плюс вспомогательные функции image asset/data URL и OpenAI-совместимый построитель провайдера изображений |
  | `plugin-sdk/image-generation-core` | Общее ядро генерации изображений | Типы генерации изображений, failover, аутентификация и вспомогательные функции реестра |
  | `plugin-sdk/music-generation` | Вспомогательные функции генерации музыки | Типы провайдера/запроса/результата генерации музыки |
  | `plugin-sdk/music-generation-core` | Общее ядро генерации музыки | Типы генерации музыки, вспомогательные функции failover, поиск провайдера и разбор model-ref |
  | `plugin-sdk/video-generation` | Вспомогательные функции генерации видео | Типы провайдера/запроса/результата генерации видео |
  | `plugin-sdk/video-generation-core` | Общее ядро генерации видео | Типы генерации видео, вспомогательные функции failover, поиск провайдера и разбор model-ref |
  | `plugin-sdk/interactive-runtime` | Вспомогательные функции интерактивного ответа | Нормализация/сведение payload интерактивного ответа |
  | `plugin-sdk/channel-config-primitives` | Примитивы конфигурации канала | Узкие примитивы схемы конфигурации канала |
  | `plugin-sdk/channel-config-writes` | Вспомогательные функции записи конфигурации канала | Вспомогательные функции авторизации записи конфигурации канала |
  | `plugin-sdk/channel-plugin-common` | Общая преамбула канала | Экспорты общей преамбулы Plugin канала |
  | `plugin-sdk/channel-status` | Вспомогательные функции статуса канала | Общие вспомогательные функции снимка/сводки статуса канала |
  | `plugin-sdk/allowlist-config-edit` | Вспомогательные функции конфигурации allowlist | Вспомогательные функции редактирования/чтения конфигурации allowlist |
  | `plugin-sdk/group-access` | Вспомогательные функции группового доступа | Общие вспомогательные функции решений о групповом доступе |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости | Используйте `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Вспомогательные функции защиты Direct-DM | Узкие вспомогательные функции политики защиты до шифрования |
  | `plugin-sdk/extension-shared` | Общие вспомогательные функции расширений | Примитивы passive-channel/status и ambient proxy |
  | `plugin-sdk/webhook-targets` | Вспомогательные функции целей Webhook | Реестр целей Webhook и вспомогательные функции установки маршрутов |
  | `plugin-sdk/webhook-path` | Устаревший псевдоним пути Webhook | Используйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Общие вспомогательные функции веб-медиа | Вспомогательные функции загрузки удаленных/локальных медиа |
  | `plugin-sdk/zod` | Устаревший реэкспорт совместимости Zod | Импортируйте `zod` из `zod` напрямую |
  | `plugin-sdk/memory-core` | Вспомогательные функции встроенного memory-core | Поверхность вспомогательных функций менеджера памяти/конфигурации/файлов/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад среды выполнения движка памяти | Фасад среды выполнения индекса/поиска памяти |
  | `plugin-sdk/memory-core-host-embedding-registry` | Реестр embedding памяти | Легковесные вспомогательные функции реестра провайдеров embedding памяти |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовый движок хоста памяти | Экспорты базового движка хоста памяти |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Движок embedding хоста памяти | Контракты embedding памяти, доступ к реестру, локальный провайдер и общие вспомогательные функции batch/remote; конкретные удаленные провайдеры находятся в владеющих ими Plugin |
  | `plugin-sdk/memory-core-host-engine-qmd` | Движок QMD хоста памяти | Экспорты движка QMD хоста памяти |
  | `plugin-sdk/memory-core-host-engine-storage` | Движок хранения хоста памяти | Экспорты движка хранения хоста памяти |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные вспомогательные функции хоста памяти | Мультимодальные вспомогательные функции хоста памяти |
  | `plugin-sdk/memory-core-host-query` | Вспомогательные функции запросов хоста памяти | Вспомогательные функции запросов хоста памяти |
  | `plugin-sdk/memory-core-host-secret` | Вспомогательные функции секретов хоста памяти | Вспомогательные функции секретов хоста памяти |
  | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним событий памяти | Используйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Вспомогательные функции статуса хоста памяти | Вспомогательные функции статуса хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-cli` | Среда выполнения CLI хоста памяти | Вспомогательные функции среды выполнения CLI хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-core` | Базовая среда выполнения хоста памяти | Вспомогательные функции базовой среды выполнения хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-files` | Вспомогательные функции файлов/среды выполнения хоста памяти | Вспомогательные функции файлов/среды выполнения хоста памяти |
  | `plugin-sdk/memory-host-core` | Псевдоним базовой среды выполнения хоста памяти | Нейтральный к поставщику псевдоним вспомогательных функций базовой среды выполнения хоста памяти |
  | `plugin-sdk/memory-host-events` | Псевдоним журнала событий хоста памяти | Нейтральный к поставщику псевдоним вспомогательных функций журнала событий хоста памяти |
  | `plugin-sdk/memory-host-files` | Устаревший псевдоним файлов/среды выполнения памяти | Используйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Вспомогательные функции managed markdown | Общие вспомогательные функции managed-markdown для Plugin, смежных с памятью |
  | `plugin-sdk/memory-host-search` | Фасад поиска Active Memory | Ленивый фасад среды выполнения менеджера поиска active-memory |
  | `plugin-sdk/memory-host-status` | Устаревший псевдоним статуса хоста памяти | Используйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Тестовые утилиты | Устаревший локальный для репозитория barrel совместимости; используйте специализированные локальные для репозитория тестовые subpath, такие как `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` и `plugin-sdk/test-fixtures` |
</Accordion>

Эта таблица намеренно содержит общий миграционный поднабор, а не всю
поверхность SDK. Инвентарь точек входа компилятора находится в
`scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакетов генерируются из
публичного поднабора.

Зарезервированные вспомогательные швы встроенных плагинов удалены из публичной
карты экспортов SDK, за исключением явно документированных фасадов
совместимости, таких как устаревшая прослойка `plugin-sdk/discord`, сохраненная
для опубликованного пакета `@openclaw/discord@2026.3.13`. Вспомогательные
средства, специфичные для владельца, находятся внутри пакета плагина-владельца;
общее поведение хоста должно проходить через универсальные контракты SDK, такие
как `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
`plugin-sdk/plugin-config-runtime`.

Используйте самый узкий импорт, соответствующий задаче. Если вы не можете
найти экспорт, проверьте исходный код в `src/plugin-sdk/` или спросите
сопровождающих, какой универсальный контракт должен владеть этой функцией.

## Активные устаревания

Более узкие устаревания, применимые ко всему SDK плагинов, контракту
провайдера, runtime-поверхности и манифесту. Каждое из них все еще работает
сегодня, но будет удалено в будущей мажорной версии. Запись под каждым пунктом
сопоставляет старый API с его канонической заменой.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Старое (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Новое (`openclaw/plugin-sdk/command-status`)**: те же сигнатуры, те же
    экспорты — только импортируются из более узкого подпути. `command-auth`
    реэкспортирует их как заглушки совместимости.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Старое**: `resolveInboundMentionRequirement({ facts, policy })` и
    `shouldDropInboundForMention(...)` из
    `openclaw/plugin-sdk/channel-inbound` или
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Новое**: `resolveInboundMentionDecision({ facts, policy })` — возвращает
    один объект решения вместо двух раздельных вызовов.

    Нижестоящие плагины каналов (Slack, Discord, Matrix, MS Teams) уже
    переключились.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` — это прослойка совместимости для
    старых плагинов каналов. Не импортируйте ее из нового кода; используйте
    `openclaw/plugin-sdk/channel-runtime-context` для регистрации runtime-
    объектов.

    Вспомогательные средства `channelActions*` в
    `openclaw/plugin-sdk/channel-actions` устарели вместе с сырыми экспортами
    "actions" каналов. Вместо этого раскрывайте возможности через семантическую
    поверхность `presentation`: плагины каналов объявляют, что они отображают
    (карточки, кнопки, списки выбора), а не какие сырые имена действий они
    принимают.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Старое**: фабрика `tool()` из `openclaw/plugin-sdk/provider-web-search`.

    **Новое**: реализуйте `createTool(...)` напрямую в плагине провайдера.
    OpenClaw больше не нужен вспомогательный SDK-код для регистрации обертки
    инструмента.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Старое**: `formatInboundEnvelope(...)` (и
    `ChannelMessageForAgent.channelEnvelope`) для построения плоской
    текстовой оболочки подсказки из входящих сообщений канала.

    **Новое**: `BodyForAgent` плюс структурированные блоки пользовательского
    контекста. Плагины каналов прикрепляют маршрутные метаданные (тред, тема,
    ответ-на, реакции) как типизированные поля вместо конкатенации их в строку
    подсказки. Вспомогательное средство `formatAgentEnvelope(...)` все еще
    поддерживается для синтезированных оболочек, обращенных к ассистенту, но
    входящие текстовые оболочки выводятся из использования.

    Затронутые области: `inbound_claim`, `message_received` и любой
    пользовательский плагин канала, который постобрабатывал текст
    `channelEnvelope`.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Старое**: `api.on("deactivate", handler)`.

    **Новое**: `api.on("gateway_stop", handler)`. Событие и контекст являются
    тем же контрактом очистки при завершении работы; меняется только имя hook.

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

    `deactivate` остается подключенным как устаревший alias совместимости до
    периода после 2026-08-16.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **Старое**: `api.on("subagent_spawning", handler)`, возвращающий
    `threadBindingReady` или `deliveryOrigin`.

    **Новое**: позвольте core подготавливать привязки субагентов
    `thread: true` через адаптер привязки сессий канала. Используйте
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
    устаревшие поверхности совместимости, пока внешние плагины мигрируют.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Четыре alias типа discovery теперь являются тонкими обертками над типами
    эпохи каталога:

    | Старый alias               | Новый тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс устаревший статический набор `ProviderCapabilities`: плагины
    провайдеров должны использовать явные hooks провайдера, такие как
    `buildReplayPolicy`, `normalizeToolSchemas` и `wrapStreamFn`, а не
    статический объект.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Старое** (три отдельных hook в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` и
    `resolveDefaultThinkingLevel(ctx)`.

    **Новое**: один `resolveThinkingProfile(ctx)`, который возвращает
    `ProviderThinkingProfile` с каноническим `id`, необязательным `label` и
    ранжированным списком уровней. OpenClaw автоматически понижает устаревшие
    сохраненные значения по рангу профиля.

    Контекст включает `provider`, `modelId`, необязательные объединенные факты
    `reasoning` и необязательные объединенные факты модели `compat`. Плагины
    провайдеров могут использовать эти факты каталога, чтобы раскрывать
    профиль, специфичный для модели, только когда настроенный контракт запроса
    это поддерживает.

    Реализуйте один hook вместо трех. Устаревшие hooks продолжают работать в
    течение окна устаревания, но не компонуются с результатом профиля.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **Старое**: реализация hooks внешней аутентификации без объявления
    провайдера в манифесте плагина.

    **Новое**: объявите `contracts.externalAuthProviders` в манифесте плагина
    **и** реализуйте `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Старое** поле манифеста: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Новое**: отразите тот же поиск env-var в `setup.providers[].envVars` в
    манифесте. Это объединяет метаданные env для setup/status в одном месте и
    позволяет не запускать runtime плагина только для ответа на запросы поиска
    env-var.

    `providerAuthEnvVars` остается поддерживаемым через адаптер совместимости,
    пока окно устаревания не закроется.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Старое**: три отдельных вызова:
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Новое**: один вызов в API memory-state:
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Те же слоты, один вызов регистрации. Аддитивные вспомогательные средства
    подсказок и корпуса (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) не затронуты.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Старое**: `api.registerMemoryEmbeddingProvider(...)` плюс
    `contracts.memoryEmbeddingProviders`.

    **Новое**: `api.registerEmbeddingProvider(...)` плюс
    `contracts.embeddingProviders`.

    Универсальный контракт embedding-провайдера можно повторно использовать за
    пределами памяти, и это поддерживаемый путь для новых провайдеров.
    Специфичный для памяти API регистрации остается подключенным как
    устаревшая совместимость, пока существующие провайдеры мигрируют.
    Инспекция плагинов сообщает об использовании во не встроенных плагинах как
    о долге совместимости.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Два устаревших alias типа все еще экспортируются из
    `src/plugins/runtime/types.ts`:

    | Старое                       | Новое                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` устарел в пользу `getSessionMessages`. Та же
    сигнатура; старый метод вызывает новый.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старое**: `runtime.tasks.flow` (в единственном числе) возвращал live-
    accessor task-flow.

    **Новое**: `runtime.tasks.managedFlows` сохраняет runtime мутаций
    управляемого TaskFlow для плагинов, которые создают, обновляют, отменяют
    или запускают дочерние задачи из flow. Используйте `runtime.tasks.flows`,
    когда плагину нужны только чтения на основе DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Рассмотрено выше в разделе "Как мигрировать → Перенесите встроенные
    расширения tool-result в middleware". Включено здесь для полноты:
    удаленный путь только для embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` заменен на
    `api.registerAgentToolResultMiddleware(...)` с явным списком runtime в
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType`, реэкспортируемый из `openclaw/plugin-sdk`, теперь
    является однострочным alias для `OpenClawConfig`. Предпочитайте
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
Устаревания уровня расширений (внутри встроенных плагинов каналов/провайдеров
в `extensions/`) отслеживаются внутри их собственных barrels `api.ts` и
`runtime-api.ts`. Они не влияют на контракты сторонних плагинов и здесь не
перечислены. Если вы напрямую используете локальный barrel встроенного плагина,
прочитайте комментарии об устаревании в этом barrel перед обновлением.
</Note>

## График удаления

| Когда                  | Что происходит                                                                    |
| ---------------------- | --------------------------------------------------------------------------------- |
| **Сейчас**             | Устаревшие поверхности выводят предупреждения во время выполнения                 |
| **Следующий major-релиз** | Устаревшие поверхности будут удалены; Plugin, которые всё еще их используют, завершатся с ошибкой |

Все основные Plugin уже перенесены. Внешним Plugin следует перейти на новый API
до следующего major-релиза.

## Временное подавление предупреждений

Задайте эти переменные окружения, пока работаете над миграцией:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Это временный аварийный выход, а не постоянное решение.

## Связанные материалы

- [Начало работы](/ru/plugins/building-plugins) - создайте свой первый Plugin
- [Обзор SDK](/ru/plugins/sdk-overview) - полный справочник импортов подпутей
- [Канальные Plugin](/ru/plugins/sdk-channel-plugins) - создание канальных Plugin
- [Провайдерские Plugin](/ru/plugins/sdk-provider-plugins) - создание провайдерских Plugin
- [Внутреннее устройство Plugin](/ru/plugins/architecture) - глубокий разбор архитектуры
- [Манифест Plugin](/ru/plugins/manifest) - справочник схемы манифеста
