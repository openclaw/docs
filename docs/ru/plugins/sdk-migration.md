---
read_when:
    - Вы видите предупреждение OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Вы видите предупреждение OPENCLAW_EXTENSION_API_DEPRECATED
    - Вы использовали api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Вы обновляете Plugin до современной архитектуры Plugin
    - Вы поддерживаете внешний плагин OpenClaw
sidebarTitle: Migrate to SDK
summary: Переход с устаревшего слоя обратной совместимости на современный SDK Plugin
title: Миграция Plugin SDK
x-i18n:
    generated_at: "2026-06-28T23:31:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перешел от широкого слоя обратной совместимости к современной Plugin
архитектуре с узкими, документированными импортами. Если ваш Plugin был создан
до новой архитектуры, это руководство поможет выполнить миграцию.

## Что меняется

Старая система Plugin предоставляла две широкие поверхности, которые позволяли
Plugin импортировать все необходимое из одной точки входа:

- **`openclaw/plugin-sdk/compat`** - единый импорт, который повторно экспортировал десятки
  вспомогательных функций. Он был введен, чтобы старые Plugin на основе хуков
  продолжали работать, пока создавалась новая Plugin архитектура.
- **`openclaw/plugin-sdk/infra-runtime`** - широкий runtime-barrel вспомогательных средств,
  который смешивал системные события, состояние Heartbeat, очереди доставки,
  вспомогательные средства fetch/proxy, файловые вспомогательные средства,
  типы утверждений и несвязанные утилиты.
- **`openclaw/plugin-sdk/config-runtime`** - широкий barrel совместимости конфигурации,
  который в период миграции все еще содержит устаревшие прямые вспомогательные
  средства загрузки/записи.
- **`openclaw/extension-api`** - мост, который давал Plugin прямой доступ к
  вспомогательным средствам на стороне хоста, например встроенному запускателю агента.
- **`api.registerEmbeddedExtensionFactory(...)`** - удаленный bundled-хук расширений только для embedded-runner,
  который мог наблюдать события embedded-runner, такие как
  `tool_result`.

Широкие поверхности импорта теперь **устарели**. Они все еще работают во время выполнения,
но новые Plugin не должны их использовать, а существующим Plugin следует мигрировать до того,
как следующий мажорный релиз удалит их. API регистрации фабрики расширений только для
embedded-runner был удален; вместо него используйте middleware результатов инструментов.

OpenClaw не удаляет и не переинтерпретирует документированное поведение Plugin в том же
изменении, которое вводит замену. Ломающие изменения контракта сначала должны пройти
через адаптер совместимости, диагностику, документацию и окно устаревания.
Это относится к импортам SDK, полям манифеста, setup API, хукам и поведению
регистрации во время выполнения.

<Warning>
  Слой обратной совместимости будет удален в будущем мажорном релизе.
  Plugin, которые все еще импортируют из этих поверхностей, после этого сломаются.
  Legacy-регистрации фабрик embedded extension уже больше не загружаются.
</Warning>

## Почему это изменилось

Старый подход создавал проблемы:

- **Медленный запуск** - импорт одной вспомогательной функции загружал десятки несвязанных модулей
- **Циклические зависимости** - широкие повторные экспорты упрощали создание циклов импортов
- **Неясная поверхность API** - нельзя было понять, какие экспорты стабильны, а какие внутренние

Современный plugin SDK исправляет это: каждый путь импорта (`openclaw/plugin-sdk/\<subpath\>`)
представляет собой небольшой, самодостаточный модуль с понятным назначением и документированным контрактом.

Legacy-поверхности удобства провайдеров для bundled-каналов также удалены.
Вспомогательные поверхности с брендингом каналов были приватными ярлыками mono-repo, а не стабильными
контрактами Plugin. Используйте вместо них узкие универсальные подпути SDK. Внутри рабочей области bundled
Plugin держите вспомогательные средства, принадлежащие провайдеру, в собственном `api.ts` или
`runtime-api.ts` этого Plugin.

Текущие примеры bundled-провайдеров:

- Anthropic держит потоковые вспомогательные средства, специфичные для Claude, в собственной поверхности `api.ts` /
  `contract-api.ts`
- OpenAI держит builder-функции провайдера, вспомогательные средства моделей по умолчанию и builder-функции
  realtime-провайдера в собственном `api.ts`
- OpenRouter держит builder-функцию провайдера и вспомогательные средства onboarding/config в собственном
  `api.ts`

## План миграции Talk и realtime-голоса

Код realtime-голоса, телефонии, встреч и браузерного Talk перемещается от локального для поверхности учета ходов
к общему контроллеру Talk-сессии, экспортируемому из
`openclaw/plugin-sdk/realtime-voice`. Новый контроллер владеет общей оболочкой событий Talk,
состоянием активного хода, состоянием захвата, состоянием output-audio, недавней
историей событий и отклонением устаревших ходов. Provider Plugin должны продолжать владеть
realtime-сессиями конкретного вендора; surface Plugin должны продолжать владеть особенностями захвата,
воспроизведения, телефонии и встреч.

Эта миграция Talk намеренно выполняется как чистое ломающие изменение:

1. Держите общий контроллер/runtime-примитивы в
   `plugin-sdk/realtime-voice`.
2. Переведите bundled-поверхности на общий контроллер: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime и native push-to-talk.
3. Замените старые семейства Talk RPC финальными API `talk.session.*` и
   `talk.client.*`.
4. Объявите один live-канал событий Talk в Gateway
   `hello-ok.features.events`: `talk.event`.
5. Удалите старый realtime HTTP endpoint и любой путь переопределения инструкций
   во время запроса.

Новый код не должен вызывать `createTalkEventSequencer(...)` напрямую, если только он
не реализует низкоуровневый adapter или test fixture. Предпочитайте общий контроллер,
чтобы события в области хода нельзя было отправить без turn id, устаревшие вызовы `turnEnd` /
`turnCancel` не могли очистить более новый активный ход, а события жизненного цикла output-audio
оставались согласованными в телефонии, встречах, browser relay, managed-room
handoff и native Talk client.

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

WebRTC/provider-websocket сессии, которыми владеет браузер, используют `talk.client.create`,
поскольку браузер владеет согласованием с провайдером и медиатранспортом, а
Gateway владеет учетными данными, инструкциями и политикой инструментов. `talk.session.*` - это
общая управляемая Gateway поверхность для gateway-relay realtime, gateway-relay
transcription и managed-room native STT/TTS сессий.

Legacy-конфигурации, которые размещали realtime-селекторы рядом с `talk.provider` /
`talk.providers`, следует исправить с помощью `openclaw doctor --fix`; runtime Talk
не переинтерпретирует конфигурацию провайдера speech/TTS как конфигурацию realtime-провайдера.

Поддерживаемые комбинации `talk.session.create` намеренно ограничены:

| Режим           | Транспорт       | Brain           | Владелец           | Примечания                                                                                                        |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-duplex аудио провайдера передается через Gateway; вызовы инструментов маршрутизируются через инструмент agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Только streaming STT; вызывающие стороны отправляют входное аудио и получают события transcript.                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Комнаты в стиле push-to-talk и walkie-talkie, где client владеет захватом/воспроизведением, а Gateway владеет состоянием хода. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Режим комнаты только для администраторов для доверенных first-party поверхностей, которые напрямую выполняют действия инструментов Gateway. |

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

Единый словарь управления также намеренно узкий:

  | Метод                          | Применяется к                                           | Контракт                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Добавляет фрагмент аудио PCM в base64 в сеанс провайдера, принадлежащий тому же подключению Gateway.                                                                                     |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Запускает пользовательский ход managed-room.                                                                                                                                             |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Завершает активный ход после проверки устаревшего хода.                                                                                                                                  |
  | `talk.session.cancelTurn`       | все сеансы, принадлежащие Gateway                       | Отменяет активную работу захвата, провайдера, агента и TTS для хода.                                                                                                                     |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Останавливает аудиовывод ассистента, не обязательно завершая пользовательский ход.                                                                                                       |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Завершает вызов инструмента провайдера, выданный ретранслятором; передайте `options.willContinue` для промежуточного вывода или `options.suppressResponse`, чтобы удовлетворить вызов без еще одного ответа ассистента. |
  | `talk.session.steer`            | сеансы Talk с поддержкой агента                         | Отправляет речевой управляющий сигнал `status`, `steer`, `cancel` или `followup` в активный встроенный запуск, разрешенный из сеанса Talk.                                               |
  | `talk.session.close`            | все унифицированные сеансы                              | Останавливает сеансы ретранслятора или отзывает состояние managed-room, затем забывает идентификатор унифицированного сеанса.                                                            |

  Не добавляйте в ядро особые случаи для провайдеров или платформ, чтобы это работало.
  Ядро владеет семантикой сеансов Talk. Provider plugins владеют настройкой сеансов поставщиков.
  Голосовые вызовы и Google Meet владеют адаптерами телефонии и встреч. Браузерные и нативные
  приложения владеют UX захвата и воспроизведения на устройстве.

  ## Политика совместимости

  Для внешних plugins работа над совместимостью выполняется в таком порядке:

  1. добавить новый контракт
  2. сохранить старое поведение, подключенное через адаптер совместимости
  3. вывести диагностическое сообщение или предупреждение, называющее старый путь и замену
  4. покрыть оба пути тестами
  5. задокументировать устаревание и путь миграции
  6. удалить только после объявленного окна миграции, обычно в мажорном выпуске

  Сопровождающие могут проверить текущую очередь миграции с помощью
  `pnpm plugins:boundary-report`. Используйте `pnpm plugins:boundary-report:summary` для
  компактных счетчиков, `--owner <id>` для одного Plugin или владельца совместимости и
  `pnpm plugins:boundary-report:ci`, когда CI-гейт должен падать из-за просроченных
  записей совместимости, межвладельческих зарезервированных импортов SDK или неиспользуемых
  зарезервированных подпутей SDK. Отчет группирует устаревшие
  записи совместимости по дате удаления, подсчитывает локальные ссылки в коде и документации,
  показывает межвладельческие зарезервированные импорты SDK и суммирует приватный
  мост SDK для хоста памяти, чтобы очистка совместимости оставалась явной, а не
  полагалась на разовые поиски. Зарезервированные подпути SDK должны иметь отслеживаемое использование владельцем;
  неиспользуемые экспортируемые зарезервированные вспомогательные функции следует удалять из публичного SDK.

  Если поле манифеста все еще принимается, авторы plugins могут продолжать его использовать, пока
  документация и диагностика не скажут иного. Новый код должен предпочитать задокументированную
  замену, но существующие plugins не должны ломаться во время обычных минорных
  релизов.

  ## Как выполнить миграцию

  <Steps>
  <Step title="Мигрируйте вспомогательные функции загрузки и записи конфигурации runtime">
    Bundled plugins должны перестать напрямую вызывать
    `api.runtime.config.loadConfig()` и
    `api.runtime.config.writeConfigFile(...)`. Предпочитайте конфигурацию, которая уже была
    передана в активный путь вызова. Долгоживущие обработчики, которым нужен
    текущий снимок процесса, могут использовать `api.runtime.config.current()`. Долгоживущие
    инструменты агента должны использовать `ctx.getRuntimeConfig()` из контекста инструмента внутри
    `execute`, чтобы инструмент, созданный до записи конфигурации, все равно видел обновленную
    runtime-конфигурацию.

    Записи конфигурации должны проходить через транзакционные вспомогательные функции и выбирать
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
    `afterWrite: { mode: "none", reason: "..." }` только тогда, когда вызывающая сторона владеет
    последующим действием и намеренно хочет подавить планировщик перезагрузки.
    Результаты мутации включают типизированную сводку `followUp` для тестов и логирования;
    gateway остается ответственным за применение или планирование перезапуска.
    `loadConfig` и `writeConfigFile` остаются устаревшими вспомогательными функциями совместимости
    для внешних plugins на период окна миграции и один раз предупреждают с
    кодом совместимости `runtime-config-load-write`. Bundled plugins и runtime-код репозитория
    защищены ограничителями сканера в
    `pnpm check:deprecated-api-usage` и
    `pnpm check:no-runtime-action-load-config`: новое использование в production-коде Plugin
    сразу завершается ошибкой, прямые записи конфигурации завершаются ошибкой, методы gateway-сервера должны использовать
    runtime-снимок запроса, runtime-вспомогательные функции отправки, действия и клиента канала
    должны получать конфигурацию со своей границы, а долгоживущие runtime-модули имеют
    ноль разрешенных фоновых вызовов `loadConfig()`.

    Новый код Plugin также должен избегать импорта широкого
    barrel совместимости `openclaw/plugin-sdk/config-runtime`. Используйте узкий
    подпуть SDK, соответствующий задаче:

    | Потребность | Импорт |
    | --- | --- |
    | Типы конфигурации, такие как `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Проверки уже загруженной конфигурации и поиск конфигурации точки входа Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Чтение текущего runtime-снимка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфигурации | `openclaw/plugin-sdk/config-mutation` |
    | Вспомогательные функции хранилища сеансов | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфигурация таблиц Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-вспомогательные функции групповой политики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Разрешение секретного ввода | `openclaw/plugin-sdk/secret-input-runtime` |
    | Переопределения модели и сеанса | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins и их тесты защищены сканером от широкого
    barrel, чтобы импорты и моки оставались локальными для нужного им поведения. Широкий
    barrel все еще существует для внешней совместимости, но новый код не должен
    от него зависеть.

  </Step>

  <Step title="Мигрируйте встроенные расширения результатов инструментов в middleware">
    Bundled plugins должны заменить обработчики результатов инструментов
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

    Установленные plugins также могут регистрировать middleware результатов инструментов, когда они
    явно включены и объявляют каждый целевой runtime в
    `contracts.agentToolResultMiddleware`. Необъявленные регистрации middleware установленных Plugin
    отклоняются.

  </Step>

  <Step title="Мигрируйте approval-native обработчики на факты возможностей">
    Plugins каналов с поддержкой подтверждений теперь раскрывают нативное поведение подтверждений через
    `approvalCapability.nativeRuntime` и общий реестр runtime-контекста.

    Ключевые изменения:

    - Замените `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесите auth/delivery для подтверждений со старой проводки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` удален из публичного контракта channel-plugin;
      перенесите поля delivery/native/render на `approvalCapability`
    - `plugin.auth` остается только для потоков входа и выхода канала; хуки auth
      подтверждений там больше не читаются ядром
    - Регистрируйте runtime-объекты, принадлежащие каналу, такие как клиенты, токены или приложения Bolt,
      через `openclaw/plugin-sdk/channel-runtime-context`
    - Не отправляйте уведомления о перенаправлении, принадлежащие Plugin, из нативных обработчиков подтверждений;
      теперь ядро владеет уведомлениями о доставке в другое место на основе фактических результатов доставки
    - При передаче `channelRuntime` в `createChannelManager(...)` предоставляйте
      настоящий интерфейс `createPluginRuntime().channel`. Частичные заглушки отклоняются.

    См. `/plugins/sdk-channel-plugins` для текущей структуры возможностей подтверждений.

  </Step>

  <Step title="Проверьте fallback-поведение обертки Windows">
    Если ваш Plugin использует `openclaw/plugin-sdk/windows-spawn`, неразрешенные обертки Windows
    `.cmd`/`.bat` теперь fail closed, если вы явно не передадите
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
    Найдите в вашем Plugin импорты из любой из устаревших поверхностей:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замените на сфокусированные импорты">
    Каждый экспорт из старой поверхности соответствует конкретному современному пути импорта:

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

    Для вспомогательных функций на стороне хоста используйте внедренный runtime Plugin вместо прямого импорта:

    ```typescript
    // До (устаревший мост extension-api)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // После (внедренная среда выполнения)
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

  <Step title="Замените широкие импорты infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` по-прежнему существует для внешней
    совместимости, но новый код должен импортировать специализированную поверхность
    вспомогательных функций, которая ему действительно нужна:

    | Потребность | Импорт |
    | --- | --- |
    | Вспомогательные функции очереди системных событий | `openclaw/plugin-sdk/system-event-runtime` |
    | Вспомогательные функции пробуждения, событий и видимости Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Осушение очереди ожидающей доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрия активности канала | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кэши дедупликации в памяти | `openclaw/plugin-sdk/dedupe-runtime` |
    | Вспомогательные функции безопасных локальных путей к файлам/медиа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch с учетом диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Вспомогательные функции прокси и защищенного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типы политики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типы запроса/разрешения утверждения | `openclaw/plugin-sdk/approval-runtime` |
    | Вспомогательные функции полезной нагрузки ответа на утверждение и команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Вспомогательные функции форматирования ошибок | `openclaw/plugin-sdk/error-runtime` |
    | Ожидания готовности транспорта | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Вспомогательные функции безопасных токенов | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ограниченный параллелизм асинхронных задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числовое приведение | `openclaw/plugin-sdk/number-runtime` |
    | Локальная для процесса асинхронная блокировка | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файловые блокировки | `openclaw/plugin-sdk/file-lock` |

    Встроенные plugins защищены сканером от `infra-runtime`, поэтому код репозитория
    не может вернуться к широкому barrel.

  </Step>

  <Step title="Перенесите вспомогательные функции маршрутов каналов">
    Новый код маршрутов каналов должен использовать `openclaw/plugin-sdk/channel-route`.
    Старые имена route-key и comparable-target остаются как псевдонимы
    совместимости на время окна миграции, но новые plugins должны использовать имена
    маршрутов, которые напрямую описывают поведение:

    | Старая вспомогательная функция | Современная вспомогательная функция |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Современные вспомогательные функции маршрутов последовательно нормализуют `{ channel, to, accountId, threadId }`
    для нативных утверждений, подавления ответов, входящей дедупликации,
    доставки cron и маршрутизации сессий.

    Не добавляйте новые использования `ChannelMessagingAdapter.parseExplicitTarget` или
    вспомогательных функций загруженных маршрутов на основе парсера (`parseExplicitTargetForLoadedChannel`
    или `resolveRouteTargetForLoadedChannel`), а также
    `resolveChannelRouteTargetWithParser(...)` из `plugin-sdk/channel-route`.
    Эти хуки устарели и остаются только для старых plugins на время
    окна миграции. Новые plugins каналов должны использовать
    `messaging.targetResolver.resolveTarget(...)` для нормализации id цели
    и fallback при промахе в каталоге, `messaging.inferTargetChatType(...)`, когда ядру
    рано нужен тип peer, и `messaging.resolveOutboundSessionRoute(...)`
    для нативной для провайдера сессии и идентичности треда.

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
  | `plugin-sdk/core` | Устаревший общий реэкспорт для определений/сборщиков точек входа каналов | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Экспорт корневой схемы конфигурации | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Вспомогательная функция точки входа одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусированные определения и сборщики точек входа каналов | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Общие вспомогательные функции мастера настройки | Переводчик настройки, запросы списка разрешений, сборщики статуса настройки |
  | `plugin-sdk/setup-runtime` | Вспомогательные функции среды выполнения на этапе настройки | `createSetupTranslator`, безопасные для импорта адаптеры патчей настройки, вспомогательные функции заметок поиска, `promptResolvedAllowFrom`, `splitSetupEntries`, делегированные прокси настройки |
  | `plugin-sdk/setup-adapter-runtime` | Устаревший псевдоним адаптера настройки | Используйте `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Вспомогательные функции инструментов настройки | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Вспомогательные функции нескольких аккаунтов | Вспомогательные функции списка аккаунтов/конфигурации/шлюза действий |
  | `plugin-sdk/account-id` | Вспомогательные функции идентификатора аккаунта | `DEFAULT_ACCOUNT_ID`, нормализация идентификатора аккаунта |
  | `plugin-sdk/account-resolution` | Вспомогательные функции поиска аккаунта | Вспомогательные функции поиска аккаунта и резервного значения по умолчанию |
  | `plugin-sdk/account-helpers` | Узкие вспомогательные функции аккаунтов | Вспомогательные функции списка аккаунтов/действий аккаунта |
  | `plugin-sdk/channel-setup` | Адаптеры мастера настройки | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а также `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примитивы связывания DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префикс ответа, индикация набора и привязка доставки источника | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптеров конфигурации и вспомогательные функции доступа к DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Сборщики схем конфигурации | Общие примитивы схемы конфигурации канала и только универсальный сборщик |
  | `plugin-sdk/bundled-channel-config-schema` | Встроенные схемы конфигурации | Только поддерживаемые OpenClaw встроенные плагины; новые плагины должны определять локальные схемы плагина |
  | `plugin-sdk/channel-config-schema-legacy` | Устаревшие встроенные схемы конфигурации | Только псевдоним совместимости; используйте `plugin-sdk/bundled-channel-config-schema` для поддерживаемых встроенных плагинов |
  | `plugin-sdk/telegram-command-config` | Вспомогательные функции конфигурации команд Telegram | Нормализация имен команд, обрезка описаний, проверка дубликатов/конфликтов |
  | `plugin-sdk/channel-policy` | Разрешение политики групп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Вспомогательные функции входящего конверта | Общие вспомогательные функции маршрута и сборщика конвертов |
  | `plugin-sdk/channel-inbound` | Вспомогательные функции входящего приема | Построение контекста, форматирование, корни, запускатели, подготовленная отправка ответа и предикаты отправки |
  | `plugin-sdk/messaging-targets` | Устаревший путь импорта разбора целей | Используйте `plugin-sdk/channel-targets` для универсальных вспомогательных функций разбора целей, `plugin-sdk/channel-route` для сравнения маршрутов и принадлежащие Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` для провайдер-специфичного разрешения целей |
  | `plugin-sdk/outbound-media` | Вспомогательные функции исходящих медиа | Общая загрузка исходящих медиа |
  | `plugin-sdk/outbound-send-deps` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Вспомогательные функции жизненного цикла исходящих сообщений | Адаптеры сообщений, квитанции, вспомогательные функции надежной отправки, вспомогательные функции live preview/streaming, параметры ответа, вспомогательные функции жизненного цикла, исходящая идентичность и планирование полезной нагрузки |
  | `plugin-sdk/channel-streaming` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Устаревший фасад совместимости | Используйте `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Вспомогательные функции привязки потоков | Жизненный цикл привязки потоков и вспомогательные функции адаптеров |
  | `plugin-sdk/agent-media-payload` | Устаревшие вспомогательные функции полезной нагрузки медиа | Сборщик полезной нагрузки медиа агента для устаревших компоновок полей |
  | `plugin-sdk/channel-runtime` | Устаревшая прослойка совместимости | Только устаревшие утилиты среды выполнения канала |
  | `plugin-sdk/channel-send-result` | Типы результата отправки | Типы результата ответа |
  | `plugin-sdk/runtime-store` | Постоянное хранилище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкие вспомогательные функции среды выполнения | Вспомогательные функции среды выполнения/логирования/резервного копирования/установки плагинов |
  | `plugin-sdk/runtime-env` | Узкие вспомогательные функции окружения среды выполнения | Вспомогательные функции логгера/окружения среды выполнения, тайм-аута, повторной попытки и экспоненциальной задержки |
  | `plugin-sdk/plugin-runtime` | Общие вспомогательные функции среды выполнения Plugin | Вспомогательные функции команд/хуков/http/интерактивных возможностей Plugin |
  | `plugin-sdk/hook-runtime` | Вспомогательные функции конвейера хуков | Общие вспомогательные функции конвейера Webhook/внутренних хуков |
  | `plugin-sdk/lazy-runtime` | Вспомогательные функции ленивой среды выполнения | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Вспомогательные функции процессов | Общие вспомогательные функции exec |
  | `plugin-sdk/cli-runtime` | Вспомогательные функции среды выполнения CLI | Форматирование команд, ожидания, вспомогательные функции версий |
  | `plugin-sdk/gateway-runtime` | Вспомогательные функции Gateway | Клиент Gateway, вспомогательная функция запуска с готовым циклом событий и вспомогательные функции патчей статуса канала |
  | `plugin-sdk/config-runtime` | Устаревшая прослойка совместимости конфигурации | Предпочитайте `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` и `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Вспомогательные функции команд Telegram | Резервно-стабильные вспомогательные функции проверки команд Telegram, когда поверхность контракта встроенного Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Вспомогательные функции запросов подтверждения | Полезная нагрузка подтверждения exec/Plugin, вспомогательные функции возможностей/профилей подтверждения, нативная маршрутизация/среда выполнения подтверждений и форматирование пути структурированного отображения подтверждений |
  | `plugin-sdk/approval-auth-runtime` | Вспомогательные функции авторизации подтверждений | Разрешение подтверждающего, авторизация действий в том же чате |
  | `plugin-sdk/approval-client-runtime` | Вспомогательные функции клиента подтверждений | Вспомогательные функции нативного профиля/фильтра подтверждения exec |
  | `plugin-sdk/approval-delivery-runtime` | Вспомогательные функции доставки подтверждений | Нативные адаптеры возможностей/доставки подтверждений |
  | `plugin-sdk/approval-gateway-runtime` | Вспомогательные функции Gateway подтверждений | Общая вспомогательная функция разрешения Gateway подтверждений |
  | `plugin-sdk/approval-handler-adapter-runtime` | Вспомогательные функции адаптера подтверждений | Легковесные вспомогательные функции загрузки нативного адаптера подтверждений для горячих точек входа каналов |
  | `plugin-sdk/approval-handler-runtime` | Вспомогательные функции обработчика подтверждений | Более широкие вспомогательные функции среды выполнения обработчика подтверждений; предпочитайте более узкие границы адаптера/Gateway, когда их достаточно |
  | `plugin-sdk/approval-native-runtime` | Вспомогательные функции цели подтверждений | Вспомогательные функции привязки нативной цели/аккаунта подтверждений |
  | `plugin-sdk/approval-reply-runtime` | Вспомогательные функции ответа на подтверждение | Вспомогательные функции полезной нагрузки ответа на подтверждение exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Вспомогательные функции runtime-контекста канала | Универсальные вспомогательные функции регистрации/получения/наблюдения runtime-контекста канала |
  | `plugin-sdk/security-runtime` | Вспомогательные функции безопасности | Общие вспомогательные функции доверия, ограничения DM, ограниченных корнем файлов/путей, внешнего содержимого и сбора секретов |
  | `plugin-sdk/ssrf-policy` | Вспомогательные функции политики SSRF | Вспомогательные функции списка разрешенных хостов и политики частной сети |
  | `plugin-sdk/ssrf-runtime` | Вспомогательные функции среды выполнения SSRF | Закрепленный диспетчер, защищенный fetch, вспомогательные функции политики SSRF |
  | `plugin-sdk/system-event-runtime` | Вспомогательные функции системных событий | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Вспомогательные функции Heartbeat | Вспомогательные функции пробуждения, события и видимости Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Вспомогательные функции очереди доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Вспомогательные функции активности канала | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Вспомогательные функции дедупликации | Кэши дедупликации в памяти |
  | `plugin-sdk/file-access-runtime` | Вспомогательные функции доступа к файлам | Вспомогательные функции безопасных путей к локальным файлам/медиа |
  | `plugin-sdk/transport-ready-runtime` | Вспомогательные функции готовности транспорта | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Вспомогательные функции политики подтверждений exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Вспомогательные функции ограниченного кэша | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Вспомогательные функции ограничения диагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Вспомогательные функции форматирования ошибок | `formatUncaughtError`, `isApprovalNotFoundError`, вспомогательные функции графа ошибок |
  | `plugin-sdk/fetch-runtime` | Обернутые вспомогательные функции fetch/proxy | `resolveFetch`, вспомогательные функции proxy, вспомогательные функции параметров EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Вспомогательные функции нормализации хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Вспомогательные функции повторных попыток | `RetryConfig`, `retryAsync`, запускатели политик |
  | `plugin-sdk/allow-from` | Форматирование списка разрешений и сопоставление входных данных | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Ограничение команд и вспомогательные функции поверхности команд | `resolveControlCommandGate`, вспомогательные функции авторизации отправителя, вспомогательные функции реестра команд, включая форматирование меню динамических аргументов |
  | `plugin-sdk/command-status` | Рендереры статуса/справки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Разбор ввода секретов | Вспомогательные функции ввода секретов |
  | `plugin-sdk/webhook-ingress` | Вспомогательные функции запросов Webhook | Утилиты целей Webhook |
  | `plugin-sdk/webhook-request-guards` | Вспомогательные функции защиты тела Webhook | Вспомогательные функции чтения/лимита тела запроса |
  | `plugin-sdk/reply-runtime` | Общая среда выполнения ответов | Входящая отправка, Heartbeat, планировщик ответов, разбиение на фрагменты |
  | `plugin-sdk/reply-dispatch-runtime` | Узкие вспомогательные функции отправки ответов | Завершение, отправка провайдеру и вспомогательные функции меток разговоров |
  | `plugin-sdk/reply-history` | Вспомогательные функции истории ответов | `createChannelHistoryWindow`; устаревшие экспорты совместимости map-helper, такие как `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` и `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планирование ссылки ответа | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Вспомогательные функции фрагментов ответа | Вспомогательные функции разбиения текста/markdown на фрагменты |
  | `plugin-sdk/session-store-runtime` | Вспомогательные функции хранилища сессий | Путь хранилища и вспомогательные функции updated-at |
  | `plugin-sdk/state-paths` | Вспомогательные функции путей состояния | Вспомогательные функции каталогов состояния и OAuth |
  | `plugin-sdk/routing` | Вспомогательные средства маршрутизации/ключей сессий | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, вспомогательные средства нормализации ключей сессий |
  | `plugin-sdk/status-helpers` | Вспомогательные средства статуса канала | Построители сводок статуса канала/аккаунта, значения по умолчанию состояния среды выполнения, вспомогательные средства метаданных проблем |
  | `plugin-sdk/target-resolver-runtime` | Вспомогательные средства распознавателя целей | Общие вспомогательные средства распознавателя целей |
  | `plugin-sdk/string-normalization-runtime` | Вспомогательные средства нормализации строк | Вспомогательные средства нормализации slug/строк |
  | `plugin-sdk/request-url` | Вспомогательные средства URL запроса | Извлекают строковые URL из входных данных, похожих на запрос |
  | `plugin-sdk/run-command` | Вспомогательные средства команд с тайм-аутом | Исполнитель команд с тайм-аутом и нормализованными stdout/stderr |
  | `plugin-sdk/param-readers` | Средства чтения параметров | Общие средства чтения параметров инструментов/CLI |
  | `plugin-sdk/tool-payload` | Извлечение полезной нагрузки инструмента | Извлекает нормализованные полезные нагрузки из объектов результата инструмента |
  | `plugin-sdk/tool-send` | Извлечение отправки инструмента | Извлекает канонические поля цели отправки из аргументов инструмента |
  | `plugin-sdk/temp-path` | Вспомогательные средства временных путей | Общие вспомогательные средства путей временной загрузки |
  | `plugin-sdk/logging-core` | Вспомогательные средства журналирования | Подсистемный журналировщик и вспомогательные средства редактирования чувствительных данных |
  | `plugin-sdk/markdown-table-runtime` | Вспомогательные средства Markdown-таблиц | Вспомогательные средства режимов Markdown-таблиц |
  | `plugin-sdk/reply-payload` | Типы ответа на сообщение | Типы полезной нагрузки ответа |
  | `plugin-sdk/provider-setup` | Курируемые вспомогательные средства настройки локальных/самостоятельно размещаемых провайдеров | Вспомогательные средства обнаружения/настройки самостоятельно размещаемых провайдеров |
  | `plugin-sdk/self-hosted-provider-setup` | Специализированные вспомогательные средства настройки OpenAI-совместимых самостоятельно размещаемых провайдеров | Те же вспомогательные средства обнаружения/настройки самостоятельно размещаемых провайдеров |
  | `plugin-sdk/provider-auth-runtime` | Вспомогательные средства аутентификации провайдера в среде выполнения | Вспомогательные средства разрешения API-ключей в среде выполнения |
  | `plugin-sdk/provider-auth-api-key` | Вспомогательные средства настройки API-ключей провайдера | Вспомогательные средства онбординга API-ключей/записи профилей |
  | `plugin-sdk/provider-auth-result` | Вспомогательные средства результата аутентификации провайдера | Стандартный построитель результата аутентификации OAuth |
  | `plugin-sdk/provider-selection-runtime` | Вспомогательные средства выбора провайдера | Выбор настроенного или автоматического провайдера и слияние необработанной конфигурации провайдера |
  | `plugin-sdk/provider-env-vars` | Вспомогательные средства env-var провайдера | Вспомогательные средства поиска env-var аутентификации провайдера |
  | `plugin-sdk/provider-model-shared` | Общие вспомогательные средства моделей/повтора провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, общие построители политик повтора, вспомогательные средства конечных точек провайдера и вспомогательные средства нормализации идентификаторов моделей |
  | `plugin-sdk/provider-catalog-shared` | Общие вспомогательные средства каталога провайдеров | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчи онбординга провайдера | Вспомогательные средства конфигурации онбординга |
  | `plugin-sdk/provider-http` | Вспомогательные средства HTTP провайдера | Общие вспомогательные средства возможностей HTTP/конечных точек провайдера, включая вспомогательные средства multipart-формы для транскрипции аудио |
  | `plugin-sdk/provider-web-fetch` | Вспомогательные средства web-fetch провайдера | Вспомогательные средства регистрации/кэша провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Вспомогательные средства конфигурации веб-поиска провайдера | Узкие вспомогательные средства конфигурации/учетных данных веб-поиска для провайдеров, которым не нужна связка включения Plugin |
  | `plugin-sdk/provider-web-search-contract` | Вспомогательные средства контракта веб-поиска провайдера | Узкие вспомогательные средства контракта конфигурации/учетных данных веб-поиска, такие как `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, и ограниченные по области сеттеры/геттеры учетных данных |
  | `plugin-sdk/provider-web-search` | Вспомогательные средства веб-поиска провайдера | Вспомогательные средства регистрации/кэша/среды выполнения провайдера веб-поиска |
  | `plugin-sdk/provider-tools` | Вспомогательные средства совместимости инструментов/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` и очистка схем + диагностика DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Вспомогательные средства использования провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` и другие вспомогательные средства использования провайдера |
  | `plugin-sdk/provider-stream` | Вспомогательные средства оберток потоков провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типы оберток потоков и общие вспомогательные средства оберток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Вспомогательные средства транспорта провайдера | Вспомогательные средства нативного транспорта провайдера, такие как защищенный fetch, преобразования транспортных сообщений и записываемые потоки транспортных событий |
  | `plugin-sdk/keyed-async-queue` | Упорядоченная асинхронная очередь | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Общие вспомогательные средства медиа | Вспомогательные средства получения/преобразования/хранения медиа, определение размеров видео на базе ffprobe и построители полезных нагрузок медиа |
  | `plugin-sdk/media-generation-runtime` | Общие вспомогательные средства генерации медиа | Общие вспомогательные средства переключения при сбоях, выбор кандидатов и сообщения об отсутствующей модели для генерации изображений/видео/музыки |
  | `plugin-sdk/media-understanding` | Вспомогательные средства понимания медиа | Типы провайдеров понимания медиа, а также экспорты вспомогательных средств изображений/аудио для провайдеров |
  | `plugin-sdk/text-runtime` | Устаревший широкий экспорт совместимости текста | Используйте `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` и `logging-core` |
  | `plugin-sdk/text-chunking` | Вспомогательные средства разбиения текста | Вспомогательное средство разбиения исходящего текста |
  | `plugin-sdk/speech` | Вспомогательные средства речи | Типы речевых провайдеров, а также вспомогательные средства директив, реестра и валидации для провайдеров, и OpenAI-совместимый построитель TTS |
  | `plugin-sdk/speech-core` | Общее ядро речи | Типы речевых провайдеров, реестр, директивы, нормализация |
  | `plugin-sdk/realtime-transcription` | Вспомогательные средства транскрипции в реальном времени | Типы провайдеров, вспомогательные средства реестра и общий вспомогательный компонент WebSocket-сессии |
  | `plugin-sdk/realtime-voice` | Вспомогательные средства голоса в реальном времени | Типы провайдеров, вспомогательные средства реестра/разрешения, вспомогательные средства мостовых сессий, общие очереди ответной речи агента, голосовое управление активным запуском, состояние здоровья транскрипта/событий, подавление эха, сопоставление консультационных вопросов, координация принудительной консультации, отслеживание контекста хода, отслеживание активности вывода и вспомогательные средства быстрой консультации по контексту |
  | `plugin-sdk/image-generation` | Вспомогательные средства генерации изображений | Типы провайдеров генерации изображений, а также вспомогательные средства ресурсов изображений/data URL и OpenAI-совместимый построитель провайдера изображений |
  | `plugin-sdk/image-generation-core` | Общее ядро генерации изображений | Типы генерации изображений, переключение при сбоях, аутентификация и вспомогательные средства реестра |
  | `plugin-sdk/music-generation` | Вспомогательные средства генерации музыки | Типы провайдеров/запросов/результатов генерации музыки |
  | `plugin-sdk/music-generation-core` | Общее ядро генерации музыки | Типы генерации музыки, вспомогательные средства переключения при сбоях, поиск провайдера и разбор model-ref |
  | `plugin-sdk/video-generation` | Вспомогательные средства генерации видео | Типы провайдеров/запросов/результатов генерации видео |
  | `plugin-sdk/video-generation-core` | Общее ядро генерации видео | Типы генерации видео, вспомогательные средства переключения при сбоях, поиск провайдера и разбор model-ref |
  | `plugin-sdk/interactive-runtime` | Вспомогательные средства интерактивных ответов | Нормализация/сокращение полезной нагрузки интерактивного ответа |
  | `plugin-sdk/channel-config-primitives` | Примитивы конфигурации канала | Узкие примитивы схемы конфигурации канала |
  | `plugin-sdk/channel-config-writes` | Вспомогательные средства записи конфигурации канала | Вспомогательные средства авторизации записи конфигурации канала |
  | `plugin-sdk/channel-plugin-common` | Общая преамбула канала | Общие экспорты преамбулы Plugin канала |
  | `plugin-sdk/channel-status` | Вспомогательные средства статуса канала | Общие вспомогательные средства снимка/сводки статуса канала |
  | `plugin-sdk/allowlist-config-edit` | Вспомогательные средства конфигурации allowlist | Вспомогательные средства редактирования/чтения конфигурации allowlist |
  | `plugin-sdk/group-access` | Вспомогательные средства группового доступа | Общие вспомогательные средства принятия решений о групповом доступе |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Устаревшие фасады совместимости | Используйте `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Вспомогательные средства защиты Direct-DM | Узкие вспомогательные средства политики защиты до шифрования |
  | `plugin-sdk/extension-shared` | Общие вспомогательные средства расширений | Примитивы пассивного канала/статуса и вспомогательных средств ambient proxy |
  | `plugin-sdk/webhook-targets` | Вспомогательные средства целей Webhook | Реестр целей Webhook и вспомогательные средства установки маршрутов |
  | `plugin-sdk/webhook-path` | Устаревший псевдоним пути Webhook | Используйте `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Общие вспомогательные средства веб-медиа | Вспомогательные средства загрузки удаленных/локальных медиа |
  | `plugin-sdk/zod` | Устаревший реэкспорт совместимости Zod | Импортируйте `zod` из `zod` напрямую |
  | `plugin-sdk/memory-core` | Встроенные вспомогательные средства memory-core | Поверхность вспомогательных средств менеджера памяти/конфигурации/файлов/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад среды выполнения движка памяти | Фасад среды выполнения индекса/поиска памяти |
  | `plugin-sdk/memory-core-host-embedding-registry` | Реестр embedding памяти | Легковесные вспомогательные средства реестра провайдеров embedding памяти |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-движок хоста памяти | Экспорты foundation-движка хоста памяти |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Движок embedding хоста памяти | Контракты embedding памяти, доступ к реестру, локальный провайдер и общие вспомогательные средства пакетной/удаленной обработки; конкретные удаленные провайдеры находятся в своих владеющих plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-движок хоста памяти | Экспорты QMD-движка хоста памяти |
  | `plugin-sdk/memory-core-host-engine-storage` | Движок хранения хоста памяти | Экспорты движка хранения хоста памяти |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальные вспомогательные средства хоста памяти | Мультимодальные вспомогательные средства хоста памяти |
  | `plugin-sdk/memory-core-host-query` | Вспомогательные средства запросов хоста памяти | Вспомогательные средства запросов хоста памяти |
  | `plugin-sdk/memory-core-host-secret` | Вспомогательные средства секретов хоста памяти | Вспомогательные средства секретов хоста памяти |
  | `plugin-sdk/memory-core-host-events` | Устаревший псевдоним событий памяти | Используйте `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Вспомогательные средства статуса хоста памяти | Вспомогательные средства статуса хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-cli` | Среда выполнения CLI хоста памяти | Вспомогательные средства среды выполнения CLI хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-core` | Основная среда выполнения хоста памяти | Вспомогательные средства основной среды выполнения хоста памяти |
  | `plugin-sdk/memory-core-host-runtime-files` | Вспомогательные средства файлов/среды выполнения хоста памяти | Вспомогательные средства файлов/среды выполнения хоста памяти |
  | `plugin-sdk/memory-host-core` | Псевдоним основной среды выполнения хоста памяти | Нейтральный к поставщику псевдоним вспомогательных средств основной среды выполнения хоста памяти |
  | `plugin-sdk/memory-host-events` | Псевдоним журнала событий хоста памяти | Нейтральный к поставщику псевдоним вспомогательных средств журнала событий хоста памяти |
  | `plugin-sdk/memory-host-files` | Устаревший псевдоним файлов/среды выполнения памяти | Используйте `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Вспомогательные средства управляемого Markdown | Общие вспомогательные средства управляемого Markdown для plugins, смежных с памятью |
  | `plugin-sdk/memory-host-search` | Фасад поиска Active Memory | Ленивый фасад среды выполнения менеджера поиска Active Memory |
  | `plugin-sdk/memory-host-status` | Устаревший псевдоним статуса хоста памяти | Используйте `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Тестовые утилиты | Локальный для репозитория устаревший баррель совместимости; используйте специализированные локальные для репозитория тестовые подпути, такие как `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` и `plugin-sdk/test-fixtures` |
</Accordion>

Эта таблица намеренно содержит общий миграционный поднабор, а не всю поверхность SDK. Инвентаризация точек входа компилятора находится в
`scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакетов генерируются из
публичного поднабора.

Зарезервированные вспомогательные стыки bundled-plugin были удалены из карты
экспортов публичного SDK, за исключением явно документированных фасадов
совместимости, таких как устаревший shim `plugin-sdk/discord`, сохраненный для
опубликованного пакета `@openclaw/discord@2026.3.13`. Вспомогательные средства,
специфичные для владельца, находятся внутри пакета Plugin-владельца; общее
поведение хоста должно проходить через универсальные контракты SDK, такие как
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` и
`plugin-sdk/plugin-config-runtime`.

Используйте самый узкий импорт, который соответствует задаче. Если вы не можете
найти экспорт, проверьте исходный код в `src/plugin-sdk/` или спросите
сопровождающих, какому универсальному контракту он должен принадлежать.

## Активные устаревания

Более узкие устаревания, которые применяются ко всему SDK Plugin, контракту
провайдера, runtime-поверхности и манифесту. Каждое из них сегодня все еще
работает, но будет удалено в будущей мажорной версии. Запись под каждым пунктом
сопоставляет старый API с его канонической заменой.

<AccordionGroup>
  <Accordion title="Помощники построения справки command-auth → command-status">
    **Старое (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Новое (`openclaw/plugin-sdk/command-status`)**: те же сигнатуры, те же
    экспорты - просто импортируются из более узкого подпути. `command-auth`
    реэкспортирует их как заглушки совместимости.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Помощники проверки упоминаний → resolveInboundMentionDecision">
    **Старое**: `resolveInboundMentionRequirement({ facts, policy })` и
    `shouldDropInboundForMention(...)` из
    `openclaw/plugin-sdk/channel-inbound` или
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Новое**: `resolveInboundMentionDecision({ facts, policy })` - возвращает
    единый объект решения вместо двух раздельных вызовов.

    Нижестоящие плагины каналов (Slack, Discord, Matrix, MS Teams) уже
    переключились.

  </Accordion>

  <Accordion title="Shim runtime канала и помощники действий канала">
    `openclaw/plugin-sdk/channel-runtime` - это shim совместимости для старых
    плагинов каналов. Не импортируйте его из нового кода; используйте
    `openclaw/plugin-sdk/channel-runtime-context` для регистрации runtime-
    объектов.

    Помощники `channelActions*` в `openclaw/plugin-sdk/channel-actions`
    устарели вместе с сырыми экспортами канальных "actions". Вместо этого
    выставляйте возможности через семантическую поверхность `presentation` -
    плагины каналов объявляют, что они отображают (карточки, кнопки, выборы), а
    не какие сырые имена действий они принимают.

  </Accordion>

  <Accordion title="Помощник tool() провайдера веб-поиска → createTool() в Plugin">
    **Старое**: фабрика `tool()` из `openclaw/plugin-sdk/provider-web-search`.

    **Новое**: реализуйте `createTool(...)` напрямую в Plugin провайдера.
    OpenClaw больше не нужен помощник SDK для регистрации обертки инструмента.

  </Accordion>

  <Accordion title="Plaintext-конверты канала → BodyForAgent">
    **Старое**: `formatInboundEnvelope(...)` (и
    `ChannelMessageForAgent.channelEnvelope`) для построения плоского plaintext-
    конверта промпта из входящих сообщений канала.

    **Новое**: `BodyForAgent` плюс структурированные блоки пользовательского
    контекста. Плагины каналов прикрепляют метаданные маршрутизации (поток,
    тема, ответ-на, реакции) как типизированные поля, а не объединяют их в
    строку промпта. Помощник `formatAgentEnvelope(...)` все еще поддерживается
    для синтезированных конвертов, обращенных к ассистенту, но входящие
    plaintext-конверты постепенно выводятся.

    Затронутые области: `inbound_claim`, `message_received` и любой
    пользовательский Plugin канала, который постобрабатывал текст
    `channelEnvelope`.

  </Accordion>

  <Accordion title="Хук deactivate → gateway_stop">
    **Старое**: `api.on("deactivate", handler)`.

    **Новое**: `api.on("gateway_stop", handler)`. Событие и контекст являются
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

  <Accordion title="Хук subagent_spawning → привязка потока в core">
    **Старое**: `api.on("subagent_spawning", handler)`, возвращающий
    `threadBindingReady` или `deliveryOrigin`.

    **Новое**: позвольте core подготавливать привязки субагентов `thread: true`
    через адаптер привязки сессий канала. Используйте
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

  <Accordion title="Типы обнаружения провайдеров → типы каталога провайдеров">
    Четыре псевдонима типов обнаружения теперь являются тонкими обертками над
    типами эпохи каталога:

    | Старый псевдоним          | Новый тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс устаревший статический набор `ProviderCapabilities` - плагины
    провайдеров должны использовать явные хуки провайдера, такие как
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

    Контекст включает `provider`, `modelId`, необязательные объединенные факты
    `reasoning` и необязательные объединенные факты `compat` модели. Плагины
    провайдеров могут использовать эти факты каталога, чтобы выставлять профиль,
    специфичный для модели, только когда настроенный контракт запроса это
    поддерживает.

    Реализуйте один хук вместо трех. Устаревшие хуки продолжают работать в
    течение окна устаревания, но не компонуются с результатом профиля.

  </Accordion>

  <Accordion title="Внешние провайдеры auth → contracts.externalAuthProviders">
    **Старое**: реализация внешних хуков auth без объявления провайдера в
    манифесте Plugin.

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

    **Новое**: отзеркальте тот же поиск env-var в `setup.providers[].envVars`
    в манифесте. Это объединяет метаданные env для setup/status в одном месте и
    позволяет не запускать runtime Plugin только для ответа на запросы поиска
    env-var.

    `providerAuthEnvVars` остается поддерживаемым через адаптер совместимости,
    пока окно устаревания не закроется.

  </Accordion>

  <Accordion title="Регистрация Plugin памяти → registerMemoryCapability">
    **Старое**: три отдельных вызова -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Новое**: один вызов в API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Те же слоты, один вызов регистрации. Аддитивные помощники промпта и корпуса
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) не
    затронуты.

  </Accordion>

  <Accordion title="API провайдера эмбеддингов памяти">
    **Старое**: `api.registerMemoryEmbeddingProvider(...)` плюс
    `contracts.memoryEmbeddingProviders`.

    **Новое**: `api.registerEmbeddingProvider(...)` плюс
    `contracts.embeddingProviders`.

    Универсальный контракт провайдера эмбеддингов можно повторно использовать
    вне памяти, и это поддерживаемый путь для новых провайдеров. Специфичный
    для памяти API регистрации остается подключенным как устаревшая
    совместимость, пока существующие провайдеры мигрируют. Отчеты инспекции
    Plugin помечают небандлированное использование как долг совместимости.

  </Accordion>

  <Accordion title="Типы сообщений сессий субагентов переименованы">
    Два устаревших псевдонима типов все еще экспортируются из
    `src/plugins/runtime/types.ts`:

    | Старое                        | Новое                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` устарел в пользу `getSessionMessages`. Та же
    сигнатура; старый метод вызывает новый.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старое**: `runtime.tasks.flow` (в единственном числе) возвращал live-
    accessor task-flow.

    **Новое**: `runtime.tasks.managedFlows` сохраняет управляемый runtime
    мутаций TaskFlow для плагинов, которые создают, обновляют, отменяют или
    запускают дочерние задачи из flow. Используйте `runtime.tasks.flows`, когда
    Plugin нужны только чтения на основе DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики встроенных расширений → middleware agent tool-result">
    Рассмотрено выше в "Как мигрировать → Миграция встроенных расширений
    tool-result на middleware". Включено здесь для полноты: удаленный путь
    `api.registerEmbeddedExtensionFactory(...)`, предназначенный только для
    embedded-runner, заменен на `api.registerAgentToolResultMiddleware(...)` с
    явным списком runtime в `contracts.agentToolResultMiddleware`.
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
Устаревания уровня расширений (внутри бандлированных плагинов каналов/
провайдеров в `extensions/`) отслеживаются внутри их собственных barrels
`api.ts` и `runtime-api.ts`. Они не влияют на контракты сторонних плагинов и не
перечислены здесь. Если вы напрямую используете локальный barrel бандлированного
Plugin, прочитайте комментарии об устаревании в этом barrel перед обновлением.
</Note>

## График удаления

| Когда                  | Что происходит                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Сейчас**             | Устаревшие интерфейсы выводят предупреждения во время выполнения        |
| **Следующий мажорный релиз** | Устаревшие интерфейсы будут удалены; Plugin, которые все еще их используют, перестанут работать |

Все основные Plugin уже перенесены. Внешним Plugin следует выполнить миграцию
до следующего мажорного релиза.

## Временное подавление предупреждений

Задайте эти переменные окружения, пока работаете над миграцией:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Это временная аварийная мера, а не постоянное решение.

## Связанные материалы

- [Начало работы](/ru/plugins/building-plugins) - создайте свой первый Plugin
- [Обзор SDK](/ru/plugins/sdk-overview) - полный справочник импортов по подпутям
- [Канальные Plugin](/ru/plugins/sdk-channel-plugins) - создание канальных Plugin
- [Провайдерские Plugin](/ru/plugins/sdk-provider-plugins) - создание провайдерских Plugin
- [Внутреннее устройство Plugin](/ru/plugins/architecture) - подробный разбор архитектуры
- [Манифест Plugin](/ru/plugins/manifest) - справочник схемы манифеста
