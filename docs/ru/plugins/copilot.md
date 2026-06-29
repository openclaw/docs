---
read_when:
    - Вы хотите использовать harness GitHub Copilot SDK для агента
    - Вам нужны примеры конфигурации для среды выполнения `copilot`
    - Вы подключаете агента к Copilot по подписке (github / openclaw / copilot) и хотите, чтобы он запускался через Copilot CLI
summary: Запускайте ходы встроенного агента OpenClaw через внешний каркас GitHub Copilot SDK
title: Обвязка Copilot SDK
x-i18n:
    generated_at: "2026-06-28T23:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Внешний plugin `@openclaw/copilot` позволяет OpenClaw выполнять встроенные агентские ходы Copilot по подписке через GitHub Copilot CLI (`@github/copilot-sdk`) вместо встроенного PI harness.

Используйте Copilot SDK harness, когда нужно, чтобы сеанс Copilot CLI владел низкоуровневым агентским циклом: нативное выполнение инструментов, нативная Compaction (`infiniteSessions`) и состояние потока, управляемое CLI, в `copilotHome`. OpenClaw по-прежнему владеет чат-каналами, файлами сеансов, выбором модели, динамическими инструментами OpenClaw (через мост), approvals, доставкой медиа, видимым зеркалом transcript, побочными вопросами `/btw` (обрабатываются встроенным PI fallback — см. [Побочные вопросы (`/btw`)](#side-questions-btw)) и `openclaw doctor`.

Общее разделение моделей, провайдеров и runtime см. в разделе [Агентские runtime](/ru/concepts/agent-runtimes).

## Требования

- OpenClaw с установленным plugin `@openclaw/copilot`.
- Если ваша конфигурация использует `plugins.allow`, включите `copilot` (id манифеста, объявленный plugin). Ограничительный allowlist, использующий npm-имя пакета `@openclaw/copilot`, оставит plugin заблокированным, и runtime не загрузится даже с `agentRuntime.id: "copilot"`.
- Подписка GitHub Copilot, которая может запускать Copilot CLI (или запись `gitHubToken` env / auth-profile для headless / cron-запусков).
- Доступный для записи каталог `copilotHome`. По умолчанию harness использует `<agentDir>/copilot`, когда OpenClaw предоставляет каталог агента, иначе `~/.openclaw/agents/<agentId>/copilot` для полной изоляции каждого агента.

`openclaw doctor` запускает [doctor contract](#doctor) plugin для декларативного владения состоянием сеанса и будущих миграций совместимости. Он не запускает проверки окружения Copilot CLI.

## Установка Plugin

Copilot runtime является внешним plugin, поэтому основной пакет `openclaw` не несет зависимость `@github/copilot-sdk` или ее платформенно-специфичный CLI-бинарник `@github/copilot-<platform>-<arch>`. Вместе они добавляют примерно 260 МБ, поэтому устанавливайте их только для агентов, которые явно выбирают этот runtime:

```bash
openclaw plugins install @openclaw/copilot
```

Мастер устанавливает plugin при первом выборе модели `github-copilot/*` **и** когда ваша конфигурация подключает модель (или ее провайдер) к агентскому runtime Copilot через `agentRuntime: { id: "copilot" }` (см. [Быстрый старт](#quickstart) ниже). Без явного подключения openclaw использует встроенный провайдер GitHub Copilot и никогда не устанавливает runtime plugin.

Runtime разрешает SDK в следующем порядке:

1. `import("@github/copilot-sdk")` из установленного пакета `@openclaw/copilot`.
2. Хорошо известный резервный каталог `~/.openclaw/npm-runtime/copilot/` (устаревшая цель установки по требованию).

Отсутствующий SDK дает одну ошибку с кодом `COPILOT_SDK_MISSING` и командой переустановки plugin выше.

## Быстрый старт

Закрепите одну модель (или одного провайдера) за harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Оба маршрута эквивалентны. Используйте `agentRuntime.id` в записи одной модели, когда только эта модель должна маршрутизироваться через harness; задайте `agentRuntime.id` на провайдере, когда все модели этого провайдера должны его использовать.

`github-copilot/auto` — переносимая отправная точка. Именованные модели Copilot зависят от политики учетной записи и организации, поэтому закрепляйте такую модель только после подтверждения, что аутентифицированный Copilot CLI ее предоставляет.

## Поддерживаемые провайдеры

Harness объявляет поддержку канонического провайдера `github-copilot` (тот же id, которым владеет `extensions/github-copilot`):

- `github-copilot`

Он также поддерживает пользовательские записи `models.providers`, когда выбранная модель имеет непустой `baseUrl` и одну из следующих форм API:

- `openai-responses`
- `openai-completions`
- `ollama` (OpenAI-совместимые completions)
- `azure-openai-responses`
- `anthropic-messages`

Нативные id провайдеров, такие как `openai`, `anthropic`, `google` и `ollama`, остаются во владении их нативных runtime. Используйте отдельный пользовательский id провайдера при маршрутизации endpoint через Copilot BYOK.

Copilot BYOK endpoints должны быть публичными HTTPS URL в сети. Harness передает Copilot SDK URL loopback-прокси для каждой попытки, затем пересылает трафик провайдера через защищенный путь fetch OpenClaw, чтобы DNS pinning и SSRF-политика оставались во владении OpenClaw. Используйте нативный runtime OpenClaw для локального Ollama, LM Studio или LAN-серверов моделей.

## BYOK

Copilot BYOK использует контракт пользовательского провайдера уровня сеанса из SDK. OpenClaw передает разрешенный endpoint модели, API-ключ, режим bearer-token, заголовки, id модели и лимиты контекста/вывода, не перенося транспортную логику провайдера в core.

Например:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Сеансы BYOK ключуются отдельно от сеансов подписки и от других endpoints или отпечатков учетных данных. Ротация ключа, заголовков, модели или endpoint создает новый сеанс Copilot SDK вместо возобновления несовместимого состояния.

## Аутентификация

Приоритет для каждого агента, применяемый во время `runCopilotAttempt`:

1. **Явное `useLoggedInUser: true`** во входных данных попытки. Использует вошедшего пользователя Copilot CLI, разрешенного в `copilotHome` агента.
2. **Явное `gitHubToken`** во входных данных попытки (с `profileId` + `profileVersion`). Полезно для прямых вызовов CLI и тестов, где вызывающая сторона хочет обойти разрешение auth-profile.
3. **Разрешенные контрактом `resolvedApiKey` + `authProfileId`** из формы `EmbeddedRunAttemptParams`. Это **основной производственный путь**: core разрешает настроенный для агента auth profile `github-copilot` (через `src/infra/provider-usage.auth.ts:resolveProviderAuths`) перед вызовом harness, а harness напрямую потребляет оба поля. Благодаря этому auth profile `github-copilot:<profile>` работает end-to-end для headless / cron / многопрофильных конфигураций без env vars.
4. **Резервный env-var** для прямых запусков CLI / dogfood, где auth profile не настроен. Runtime проверяет следующие переменные в порядке приоритета, отражая поставляемый провайдер `github-copilot` (`extensions/github-copilot/auth.ts`) и документированную настройку Copilot SDK:
   1. `OPENCLAW_GITHUB_TOKEN` -- переопределение, специфичное для harness; задайте его, чтобы закрепить токен для OpenClaw harness, не затрагивая общесистемную конфигурацию `gh` / Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` -- стандартная env var Copilot SDK / CLI.
   3. `GH_TOKEN` -- стандартная env var `gh` CLI (совпадает с существующим приоритетом провайдера `github-copilot`).
   4. `GITHUB_TOKEN` -- общий резервный токен GitHub.

   Побеждает первое непустое значение; пустые строки считаются отсутствующими. Синтезированный id профиля пула имеет вид `env:<NAME>`, а profileVersion является необратимым sha256-отпечатком токена, поэтому ротация значения env корректно сбрасывает пул клиентов.

5. **`useLoggedInUser` по умолчанию**, когда сигнал токена недоступен.

Каждый агент получает выделенный `copilotHome`, поэтому токены, сеансы и конфигурация Copilot CLI не перетекают между агентами на одной машине. По умолчанию используется `<agentDir>/copilot`, когда хост передает harness каталог агента (изолируя состояние SDK от `models.json` / `auth-profiles.json` OpenClaw в том же каталоге), или `~/.openclaw/agents/<agentId>/copilot` в остальных случаях. Переопределите через `copilotHome: <path>` во входных данных попытки, когда нужно пользовательское расположение (например, общий mount для миграции).

Live-тесты harness используют `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`, когда нужен прямой токен. Общая настройка live-тестов намеренно очищает `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` и `GITHUB_TOKEN` после подготовки реальных auth profiles в изолированном тестовом home, поэтому передача значения `gh auth token` через выделенную переменную live-теста помогает избежать ложных пропусков, не раскрывая токен несвязанным наборам тестов.

## Поверхность конфигурации

Harness читает свою конфигурацию из входных данных каждой попытки (`runCopilotAttempt({...})`) плюс небольшого набора env defaults внутри `extensions/copilot/src/`:

- `copilotHome` — каталог состояния CLI для каждого агента (значения по умолчанию описаны выше).
- `model` — строка или `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Если опущено, OpenClaw использует обычный выбор модели агента, а harness проверяет, что разрешенный провайдер поддерживается.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Сопоставляется из разрешения `ThinkLevel` / `ReasoningLevel` OpenClaw в `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — необязательное переопределение для блока SDK `infiniteSessions`, которым управляет `harness.compact`. Значения по умолчанию безопасно оставлять как есть.
- `hooksConfig` — необязательная конфигурация совместимости нативного Copilot SDK `SessionHooks` для обратных вызовов инструментов/MCP, пользовательского prompt, сеанса и ошибок. Она отделена от переносимых lifecycle hooks OpenClaw.
- `permissionPolicy` — необязательное переопределение обработчика SDK `onPermissionRequest`, используемого для встроенных видов инструментов SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). По умолчанию используется `rejectAllPolicy` как защитная сетка; на практике SDK никогда не вызывает ни один из этих видов, потому что каждый подключенный через мост инструмент OpenClaw зарегистрирован с `overridesBuiltInTool: true` и `skipPermission: true`, поэтому 100% вызовов инструментов проходят через обернутый OpenClaw `execute()`. См. [Разрешения и ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — необязательный флаг телеметрии сеанса SDK.

Hooks plugin OpenClaw не требуют специфичной для Copilot конфигурации попытки. Harness запускает `before_prompt_build` (и устаревший compatibility hook `before_agent_start`), `llm_input`, `llm_output` и `agent_end` через стандартные helpers harness. Успешные Compaction SDK также запускают `before_compaction` и `after_compaction`. Подключенные через мост инструменты OpenClaw продолжают запускать `before_tool_call` и сообщать `after_tool_call`; `hooksConfig` остается для нативных callback только SDK, у которых нет переносимого эквивалента.

Остальным частям OpenClaw не нужно знать об этих полях. Другие plugins, каналы и core-код видят только стандартную форму `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Когда выполняется `harness.compact`, Copilot SDK harness:

1. Возобновляет отслеживаемый сеанс SDK без продолжения ожидающей работы.
2. Вызывает RPC сжатия истории, scoped to session, из SDK.
3. Возвращает результат Compaction SDK без записи файлов-маркеров совместимости в рабочей области.

Зеркало transcript на стороне OpenClaw (см. ниже) продолжает получать сообщения после Compaction, поэтому пользовательская история чата остается согласованной.

## Зеркалирование transcript

`runCopilotAttempt` выполняет двойную запись mirrorable-сообщений каждого хода в audit transcript OpenClaw через `extensions/copilot/src/dual-write-transcripts.ts`. Зеркало scoped to session (`copilot:${sessionId}`) и использует идентичность сообщения (`${role}:${sha256_16(role,content)}`), чтобы повторные эмиты записей предыдущих ходов сталкивались с существующими on-disk keys и не дублировались.

Зеркало обернуто двумя уровнями containment отказов, поэтому сбой записи transcript не может провалить попытку: внутренней best-effort-оберткой и defense-in-depth `.catch(...)` на уровне попытки. Сбои логируются, но не выводятся наружу.

## Побочные вопросы (`/btw`)

`/btw` **не** является нативной функцией в этом harness. `createCopilotAgentHarness()`
намеренно оставляет `harness.runSideQuestion` неопределенным, поэтому диспетчер
OpenClaw для `/btw` (`src/agents/btw.ts`) переходит к тому же встроенному
резервному пути PI, который используется для любой среды выполнения, отличной
от Codex: настроенный поставщик модели вызывается напрямую с коротким промптом
для дополнительного вопроса, а ответ передается потоково через `streamSimple`
(без CLI-сессии и без дополнительного слота в пуле).

Так CLI-сессии Copilot остаются зарезервированными для основного цикла хода
агента, а поведение `/btw` остается идентичным другим средам выполнения на базе
PI. Контракт проверяется в
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
в разделе `describe("runSideQuestion")`.

## Doctor

`extensions/copilot/doctor-contract-api.ts` автоматически загружается
`src/plugins/doctor-contract-registry.ts`. Он добавляет:

- Пустой `legacyConfigRules` (на этапе MVP нет устаревших полей).
- `normalizeCompatibilityConfig` без действий (оставлен, чтобы у будущих
  выводов полей из эксплуатации было стабильное встроенное место).
- Одну запись `sessionRouteStateOwners`, заявляющую поставщика
  `github-copilot`; среду выполнения `copilot`; ключ CLI-сессии `copilot`;
  префикс профиля авторизации `github-copilot:`.

## Ограничения

- Harness заявляет `github-copilot` плюс непринадлежащие пользовательские
  идентификаторы поставщиков BYOK. Нативные идентификаторы поставщиков,
  принадлежащие манифесту, остаются на своей среде выполнения даже когда
  `agentRuntime.id` принудительно установлен в `copilot`.
- Harness не предоставляет TUI; TUI в PI не затрагивается и остается
  резервным вариантом для любых сред выполнения, у которых нет парной
  поверхности.
- Состояние PI-сессии не мигрируется, когда агент переключается на `copilot`.
  Выбор выполняется для каждой попытки; существующие PI-сессии остаются
  действительными.
- `ask_user` использует тот же путь OpenClaw с промптом и ответом, что и
  harness Codex. Когда Copilot SDK запрашивает ввод пользователя, OpenClaw
  публикует блокирующий промпт в активный канал/TUI, а следующее сообщение
  пользователя в очереди завершает запрос SDK.

## Разрешения и ask_user

Применение разрешений для мостовых инструментов OpenClaw происходит
**внутри обертки инструмента**, а не через callback `onPermissionRequest`
в SDK. Тот же `wrapToolWithBeforeToolCallHook`, который использует PI
(`src/agents/pi-tools.before-tool-call.ts`), применяется
`createOpenClawCodingTools` ко всем инструментам для кодинга: обнаружение
циклов, политики доверенных Plugin, хуки before-tool-call и двухфазные
подтверждения Plugin через Gateway (`plugin.approval.request`) выполняются
тем же самым путем кода, что и в нативных попытках PI.

Чтобы эта обертка владела решением, SDK Tool, возвращаемый
`convertOpenClawToolToSdkTool`, помечается так:

- `overridesBuiltInTool: true` — заменяет встроенный инструмент Copilot CLI
  с тем же именем (edit, read, write, bash, …), чтобы каждый вызов
  инструмента маршрутизировался обратно в OpenClaw.
- `skipPermission: true` — сообщает SDK не вызывать
  `onPermissionRequest({kind: "custom-tool"})` перед вызовом инструмента.
  Обернутый `execute()` выполняет более богатую проверку политики OpenClaw
  внутри; промпт уровня SDK либо обошел бы применение правил OpenClaw
  (если разрешить все), либо блокировал бы каждый вызов инструмента
  (если отклонять все) — ни один вариант не соответствует паритету с PI.

Встроенный harness codex использует такое же разделение: мостовые инструменты
OpenClaw оборачиваются (`extensions/codex/src/app-server/dynamic-tools.ts`),
а _собственные_ нативные виды подтверждений codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) маршрутизируются через
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Эквивалент в Copilot
SDK — политика `rejectAllPolicy`, которая закрывается отказом для любого вида,
отличного от `custom-tool`, если он когда-либо дойдет до `onPermissionRequest`,
— является той же защитной сеткой, и на практике она не срабатывает, потому что
`overridesBuiltInTool: true` вытесняет каждый встроенный инструмент.

Чтобы слой обернутых инструментов принимал решения по политикам, эквивалентные
PI, harness передает полный контекст инструмента попытки PI в
`createOpenClawCodingTools` — идентичность (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), канал/маршрутизацию
(`groupId`, `currentChannelId`, `replyToMode`, переключатели
message-tool), авторизацию (`authProfileStore`), идентичность запуска
(`sessionKey`/`runSessionKey`, полученные из `sandboxSessionKey`,
`runId`), контекст модели (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`) и хуки запуска (`onToolOutcome`,
`onYield`). Без этих полей allowlist только для владельца незаметно
ведут себя как deny-by-default, политики доверия Plugin не могут разрешиться
в правильную область, а `session_status: "current"` разрешается в устаревший
ключ sandbox. Сборщик моста находится в
`extensions/copilot/src/tool-bridge.ts` и зеркалирует авторитетный вызов PI
в `src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt`
уже разрешает контекст sandbox через общий seam `resolveSandboxContext`,
передает SDK эффективный рабочий каталог и пересылает `sandbox` вместе с
рабочим пространством subagent-spawn в мост инструментов. Мост также передает
ограниченные элементы управления построением инструментов, которые он может
обеспечить на границе SDK: `includeCoreTools`, allowlist инструментов среды
выполнения и `toolConstructionPlan`.

Мост также использует общий вспомогательный инструмент поверхности инструментов
harness из `openclaw/plugin-sdk/agent-harness-tool-runtime` для паритета с PI.
Когда включен поиск инструментов, SDK видит компактные управляющие инструменты
плюс скрытый исполнитель каталога вместо каждой схемы инструмента OpenClaw.
Когда включен режим кода, вспомогательный модуль строит ту же управляющую
поверхность режима кода и жизненный цикл каталога, которые используются
другими agent harness. Экономные настройки по умолчанию для локальных моделей,
фильтрация схем, совместимая со средой выполнения, гидратация каталогов и
очистка каталога остаются в общем вспомогательном модуле, чтобы harness Copilot
и соседние с Codex harness не расходились.

### Токен GitHub уровня сессии

Контракт Copilot SDK различает GitHub-токен **уровня клиента**
(`CopilotClientOptions.gitHubToken`, используется для аутентификации самого
процесса CLI) и токен **уровня сессии**
(`SessionConfig.gitHubToken`, который определяет исключение контента,
маршрутизацию модели и квоту для этой сессии и учитывается как при
`createSession`, так и при `resumeSession`). Harness один раз разрешает
авторизацию через `resolveCopilotAuth` и задает оба поля, когда режим
авторизации равен `gitHubToken` (явный `auth.gitHubToken` или
`resolvedApiKey`, разрешенный по контракту из настроенного профиля авторизации
`github-copilot`). Когда разрешенный режим равен `useLoggedInUser`, поле
уровня сессии опускается, чтобы SDK продолжал выводить идентичность из
вошедшей учетной записи.

`ask_user` использует `SessionConfig.onUserInputRequest`. Мост принимает
индексы или метки вариантов для запросов с фиксированным выбором, принимает
ответы в свободной форме, когда запрос SDK их допускает, и отменяет ожидающий
запрос, когда попытка OpenClaw прерывается.

## Связанные материалы

- [Среды выполнения агента](/ru/concepts/agent-runtimes)
- [Harness Codex](/ru/plugins/codex-harness)
- [Plugin для agent harness (справочник SDK)](/ru/plugins/sdk-agent-harness)
