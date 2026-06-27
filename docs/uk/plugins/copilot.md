---
read_when:
    - Ви хочете використовувати harness GitHub Copilot SDK для агента
    - Вам потрібні приклади конфігурації для середовища виконання `copilot`
    - Ви під’єднуєте агента до підпискового Copilot (github / openclaw / copilot) і хочете запускати його через Copilot CLI
summary: Запускайте вбудовані ходи агента OpenClaw через зовнішній harness GitHub Copilot SDK
title: Стенд Copilot SDK
x-i18n:
    generated_at: "2026-06-27T17:52:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Зовнішній plugin `@openclaw/copilot` дає OpenClaw змогу запускати вбудовані ходи
агента Copilot за підпискою через GitHub Copilot CLI (`@github/copilot-sdk`)
замість вбудованого PI harness.

Використовуйте Copilot SDK harness, коли потрібно, щоб сеанс Copilot CLI володів
низькорівневим циклом агента: нативним виконанням інструментів, нативним ущільненням
(`infiniteSessions`) і станом потоку, керованим CLI, у `copilotHome`.
OpenClaw і далі володіє каналами чату, файлами сеансів, вибором моделі,
динамічними інструментами OpenClaw (через міст), затвердженнями, доставкою медіа,
видимим дзеркалом транскрипту, побічними запитаннями `/btw` (обробляються
вбудованим у дерево резервним PI fallback — див.
[Побічні запитання (`/btw`)](#side-questions-btw)) і `openclaw doctor`.

Щоб зрозуміти ширший поділ між моделлю, провайдером і runtime, почніть з
[Runtime агента](/uk/concepts/agent-runtimes).

## Вимоги

- OpenClaw зі встановленим plugin `@openclaw/copilot`.
- Якщо ваша конфігурація використовує `plugins.allow`, додайте `copilot` (id
  маніфесту, оголошений plugin). Обмежувальний allowlist, який використовує
  npm-стиль назви пакета `@openclaw/copilot`, залишить plugin заблокованим,
  і runtime не завантажиться навіть із `agentRuntime.id: "copilot"`.
- Підписка GitHub Copilot, яка може керувати Copilot CLI (або запис
  `gitHubToken` env / auth-profile для безголових запусків / запусків cron).
- Доступний для запису каталог `copilotHome`. Harness за замовчуванням
  використовує `<agentDir>/copilot`, коли OpenClaw надає каталог агента, інакше
  `~/.openclaw/agents/<agentId>/copilot` для повної ізоляції на рівні агента.

`openclaw doctor` запускає [контракт doctor](#doctor) plugin для декларативного
володіння станом сеансу та майбутніх міграцій сумісності. Він не запускає
перевірки середовища Copilot CLI.

## Встановлення Plugin

Runtime Copilot є зовнішнім plugin, тому основний пакет `openclaw` не несе
залежність `@github/copilot-sdk` або її платформоспецифічний CLI-бінарник
`@github/copilot-<platform>-<arch>`. Разом вони додають приблизно 260 МБ, тож
встановлюйте їх лише для агентів, які явно обирають цей runtime:

```bash
openclaw plugins install @openclaw/copilot
```

Майстер встановлює plugin під час першого вибору моделі `github-copilot/*` **і**
коли ваша конфігурація підключає модель (або її провайдера) до runtime агента
Copilot через `agentRuntime: { id: "copilot" }` (див. [Швидкий старт](#quickstart)
нижче). Без явного підключення openclaw використовує свій вбудований провайдер
GitHub Copilot і ніколи не встановлює runtime plugin.

Runtime визначає SDK у такому порядку:

1. `import("@github/copilot-sdk")` зі встановленого пакета `@openclaw/copilot`.
2. Добре відомий резервний каталог `~/.openclaw/npm-runtime/copilot/` (застаріла
   ціль встановлення на вимогу).

Відсутній SDK показує одну помилку з кодом `COPILOT_SDK_MISSING` і командою
перевстановлення plugin, наведеною вище.

## Швидкий старт

Закріпіть одну модель (або одного провайдера) за harness:

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

Обидва маршрути рівнозначні. Використовуйте `agentRuntime.id` в одному записі
моделі, коли лише цю модель потрібно маршрутизувати через harness; задайте
`agentRuntime.id` для провайдера, коли кожна модель цього провайдера має його
використовувати.

`github-copilot/auto` — переносна початкова точка. Іменовані моделі Copilot
залежать від політик облікового запису та організації, тому закріплюйте таку
модель лише після підтвердження, що автентифікований Copilot CLI її показує.

## Підтримувані провайдери

Harness оголошує підтримку канонічного провайдера `github-copilot` (того самого
id, яким володіє `extensions/github-copilot`):

- `github-copilot`

Він також підтримує користувацькі записи `models.providers`, коли вибрана модель
має непорожній `baseUrl` і одну з таких форм API:

- `openai-responses`
- `openai-completions`
- `ollama` (OpenAI-сумісні completions)
- `azure-openai-responses`
- `anthropic-messages`

Нативні id провайдерів, як-от `openai`, `anthropic`, `google` і `ollama`,
залишаються у власності їхніх нативних runtime. Використовуйте окремий
користувацький id провайдера, коли маршрутизуєте endpoint через Copilot BYOK.

Endpoint Copilot BYOK мають бути HTTPS URL у публічній мережі. Harness дає
Copilot SDK URL проксі local loopback для кожної спроби, а потім пересилає
трафік провайдера через захищений fetch-шлях OpenClaw, щоб DNS pinning і
політика SSRF залишалися у власності OpenClaw. Використовуйте нативний runtime
OpenClaw для локальних Ollama, LM Studio або LAN-серверів моделей.

## BYOK

Copilot BYOK використовує контракт користувацького провайдера рівня сеансу в
SDK. OpenClaw передає визначений endpoint моделі, API key, режим bearer-token,
headers, id моделі та ліміти context/output, не переносячи логіку транспорту
провайдера в core.

Наприклад:

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

Сеанси BYOK мають окремі ключі від сеансів підписки та від інших endpoint або
відбитків облікових даних. Ротація ключа, headers, моделі або endpoint створює
новий сеанс Copilot SDK замість відновлення несумісного стану.

## Автентифікація

Пріоритет на рівні агента, застосований під час `runCopilotAttempt`:

1. **Явний `useLoggedInUser: true`** у вхідних даних спроби. Використовує
   користувача Copilot CLI, що увійшов у систему та визначений у `copilotHome`
   агента.
2. **Явний `gitHubToken`** у вхідних даних спроби (з `profileId` +
   `profileVersion`). Корисно для прямих викликів CLI і тестів, де викликач
   хоче обійти визначення auth-profile.
3. **Визначені контрактом `resolvedApiKey` + `authProfileId`** із форми
   `EmbeddedRunAttemptParams`. Це **основний production-шлях**: core визначає
   налаштований auth profile агента `github-copilot` (через
   `src/infra/provider-usage.auth.ts:resolveProviderAuths`) перед викликом
   harness, а harness напряму споживає обидва поля. Завдяки цьому auth profile
   `github-copilot:<profile>` працює end-to-end для безголових / cron /
   мультипрофільних налаштувань без env vars.
4. **Резерв через env-var** для прямих запусків CLI / внутрішніх тестових
   запусків, де auth profile не налаштований. Runtime перевіряє такі змінні
   в порядку пріоритету, віддзеркалюючи постачений провайдер `github-copilot`
   (`extensions/github-copilot/auth.ts`) і документоване налаштування Copilot SDK:
   1. `OPENCLAW_GITHUB_TOKEN` -- перевизначення, специфічне для harness; задайте
      його, щоб закріпити token для OpenClaw harness, не порушуючи
      загальносистемну конфігурацію `gh` / Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` -- стандартна env var Copilot SDK / CLI.
   3. `GH_TOKEN` -- стандартна env var `gh` CLI (відповідає наявному пріоритету
      провайдера `github-copilot`).
   4. `GITHUB_TOKEN` -- загальний резервний GitHub token.

   Перемагає перше непорожнє значення; порожні рядки вважаються відсутніми.
   Синтезований id профілю пулу має вигляд `env:<NAME>`, а profileVersion є
   незворотним sha256-відбитком token, тому ротація значення env чисто скидає
   пул клієнтів.

5. **Типовий `useLoggedInUser`**, коли немає жодного сигналу token.

Кожен агент отримує окремий `copilotHome`, щоб tokens, сеанси та конфігурація
Copilot CLI не витікали між агентами на одній машині. Типове значення —
`<agentDir>/copilot`, коли host передає harness каталог агента (ізолюючи стан SDK
від `models.json` / `auth-profiles.json` OpenClaw у тому самому каталозі), або
`~/.openclaw/agents/<agentId>/copilot` в іншому разі. Перевизначайте через
`copilotHome: <path>` у вхідних даних спроби, коли потрібне користувацьке
розташування (наприклад, спільний mount для міграції).

Live-тести harness використовують `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`, коли
потрібен прямий token. Спільне налаштування live-тестів навмисно очищає
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` і `GITHUB_TOKEN` після підготовки реальних
auth profiles в ізольованому test home, тому передавання значення `gh auth token`
через спеціальну змінну live-test уникає хибних пропусків, не відкриваючи token
для непов’язаних наборів тестів.

## Поверхня конфігурації

Harness читає свою конфігурацію з вхідних даних кожної спроби
(`runCopilotAttempt({...})`) плюс невеликого набору типових env значень усередині
`extensions/copilot/src/`:

- `copilotHome` — каталог стану CLI на рівні агента (типові значення
  задокументовано вище).
- `model` — рядок або `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  Якщо пропущено, OpenClaw використовує звичайний вибір моделі агента, а harness
  перевіряє, що визначений провайдер підтримується.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Мапиться з
  визначення `ThinkLevel` / `ReasoningLevel` OpenClaw в
  `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — необов’язкове перевизначення для блоку SDK
  `infiniteSessions`, керованого `harness.compact`. Типові значення безпечно
  залишати як є.
- `hooksConfig` — необов’язкова конфігурація сумісності нативного Copilot SDK
  `SessionHooks` для callback tool/MCP, user-prompt, session і error.
  Вона окрема від переносних lifecycle hooks OpenClaw.
- `permissionPolicy` — необов’язкове перевизначення handler SDK
  `onPermissionRequest`, що використовується для вбудованих типів інструментів
  SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Типово
  використовується `rejectAllPolicy` як запобіжна сітка; на практиці SDK ніколи
  не викликає жоден із цих типів, бо кожен інструмент OpenClaw, переданий через
  міст, реєструється з `overridesBuiltInTool: true` і `skipPermission: true`,
  тому 100% викликів інструментів проходять через обгорнутий `execute()` OpenClaw.
  Див. [Дозволи та ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — необов’язковий прапорець телеметрії сеансу SDK.

Hooks plugin OpenClaw не потребують специфічної для Copilot конфігурації спроби.
Harness запускає `before_prompt_build` (і застарілий compatibility hook
`before_agent_start`), `llm_input`, `llm_output` і `agent_end` через стандартні
допоміжні засоби harness. Успішні ущільнення SDK також запускають
`before_compaction` і `after_compaction`. Інструменти OpenClaw, передані через
міст, і далі запускають `before_tool_call` і повідомляють `after_tool_call`;
`hooksConfig` залишається для нативних callback лише SDK, які не мають
переносного еквівалента.

Решті OpenClaw не потрібно знати про ці поля. Інші plugins, канали та core-код
бачать лише стандартну форму `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Коли виконується `harness.compact`, Copilot SDK harness:

1. Відновлює відстежуваний сеанс SDK без продовження незавершеної роботи.
2. Викликає RPC ущільнення історії, прив’язаний до сеансу SDK.
3. Повертає результат ущільнення SDK без запису маркерних файлів сумісності
   під workspace.

Дзеркало транскрипту з боку OpenClaw (див. нижче) і далі отримує повідомлення
після ущільнення, тож історія чату, видима користувачеві, залишається узгодженою.

## Дзеркалювання транскрипту

`runCopilotAttempt` подвійно записує дзеркальовані повідомлення кожного ходу до
аудитного транскрипту OpenClaw через
`extensions/copilot/src/dual-write-transcripts.ts`. Дзеркало scoped на рівні
сеансу (`copilot:${sessionId}`) і використовує ідентичність на рівні повідомлення
(`${role}:${sha256_16(role,content)}`), тому повторні емісії записів із попередніх
ходів збігаються з наявними ключами на диску й не дублюються.

Дзеркало обгорнуте двома шарами стримування помилок, щоб збій запису транскрипту
не міг провалити спробу: внутрішньою best-effort обгорткою і defense-in-depth
`.catch(...)` на рівні спроби. Збої логуються, але не показуються.

## Побічні запитання (`/btw`)

`/btw` **не** є нативним у цій обв’язці. `createCopilotAgentHarness()`
навмисно залишає `harness.runSideQuestion` невизначеним, тому диспетчер
`/btw` OpenClaw (`src/agents/btw.ts`) переходить до того самого внутрішнього
резервного шляху PI, який він використовує для кожного середовища виконання,
що не є Codex: налаштований постачальник моделі викликається напряму з
коротким промптом побічного запитання й передає потік відповіді назад через
`streamSimple` (без CLI-сеансу, без додаткового слота пулу).

Це зберігає CLI-сеанси Copilot зарезервованими для основного циклу ходу агента
та робить поведінку `/btw` ідентичною до інших середовищ виконання на базі PI.
Контракт перевіряється в
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
у `describe("runSideQuestion")`.

## Doctor

`extensions/copilot/doctor-contract-api.ts` автоматично завантажується
`src/plugins/doctor-contract-registry.ts`. Він додає:

- Порожній `legacyConfigRules` (без вилучених полів на етапі MVP).
- `normalizeCompatibilityConfig` без дії (залишено, щоб майбутні вилучення
  полів мали стабільне внутрішнє місце).
- Один запис `sessionRouteStateOwners`, який заявляє постачальника
  `github-copilot`; runtime `copilot`; ключ CLI-сеансу `copilot`; префікс
  профілю автентифікації `github-copilot:`.

## Обмеження

- Обв’язка заявляє `github-copilot` плюс невласні користувацькі ідентифікатори
  постачальників BYOK. Нативні ідентифікатори постачальників, що належать
  маніфесту, залишаються у своєму runtime навіть тоді, коли `agentRuntime.id`
  примусово встановлено в `copilot`.
- Обв’язка не надає TUI; TUI PI не змінюється й залишається резервним варіантом
  для всіх runtime, які не мають парної поверхні.
- Стан PI-сеансу не мігрується, коли агент перемикається на `copilot`.
  Вибір відбувається для кожної спроби; наявні PI-сеанси залишаються чинними.
- `ask_user` використовує той самий шлях промпта й відповіді OpenClaw, що й
  обв’язка Codex. Коли Copilot SDK запитує введення користувача, OpenClaw
  публікує блокувальний промпт в активний канал/TUI, а наступне поставлене в
  чергу повідомлення користувача завершує запит SDK.

## Дозволи та ask_user

Застосування дозволів для мостових інструментів OpenClaw відбувається
**всередині обгортки інструмента**, а не через callback SDK
`onPermissionRequest`. Той самий `wrapToolWithBeforeToolCallHook`, який
використовує PI (`src/agents/pi-tools.before-tool-call.ts`), застосовується
`createOpenClawCodingTools` до кожного інструмента кодування: виявлення циклів,
політики довірених Plugin, хуки before-tool-call і двофазні затвердження Plugin
через Gateway (`plugin.approval.request`) виконуються тим самим шляхом коду,
що й нативні спроби PI.

Щоб ця обгортка володіла рішенням, SDK Tool, який повертає
`convertOpenClawToolToSdkTool`, позначається так:

- `overridesBuiltInTool: true` — замінює вбудований інструмент Copilot CLI з
  тією самою назвою (edit, read, write, bash, …), щоб кожен виклик інструмента
  маршрутизувався назад до OpenClaw.
- `skipPermission: true` — повідомляє SDK не викликати
  `onPermissionRequest({kind: "custom-tool"})` перед запуском інструмента.
  Обгорнутий `execute()` виконує багатшу перевірку політики OpenClaw
  внутрішньо; промпт на рівні SDK або обходив би застосування правил OpenClaw
  (якщо дозволяти все), або блокував би кожен виклик інструмента (якщо
  відхиляти все) — жоден варіант не відповідає паритету з PI.

Внутрішня обв’язка codex використовує той самий поділ: мостові інструменти
OpenClaw обгортаються (`extensions/codex/src/app-server/dynamic-tools.ts`), а
_власні_ нативні види затверджень codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) маршрутизуються через
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Еквівалент у Copilot
SDK — fail-closed `rejectAllPolicy` для будь-якого виду, що не є
`custom-tool`, який коли-небудь доходить до `onPermissionRequest` — є тією
самою запобіжною сіткою, і на практиці вона не спрацьовує, бо
`overridesBuiltInTool: true` витісняє кожен вбудований інструмент.

Щоб рівень обгорнутих інструментів ухвалював рішення політики, еквівалентні PI,
обв’язка передає повний контекст інструмента спроби PI до
`createOpenClawCodingTools` — ідентичність (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, …), канал/маршрутизацію (`groupId`,
`currentChannelId`, `replyToMode`, перемикачі message-tool), автентифікацію
(`authProfileStore`), ідентичність запуску (`sessionKey`/`runSessionKey`,
похідні від `sandboxSessionKey`, `runId`), контекст моделі (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) і хуки запуску
(`onToolOutcome`, `onYield`). Без цих полів allowlist-и тільки для власника
непомітно поводяться як deny-by-default, політики довіри Plugin не можуть
визначити правильну область, а `session_status: "current"` розв’язується в
застарілий ключ sandbox. Побудовник мосту розташований у
`extensions/copilot/src/tool-bridge.ts` і віддзеркалює авторитетний виклик PI у
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt` уже
розв’язує контекст sandbox через спільний шов `resolveSandboxContext`, передає
SDK ефективний робочий каталог і пересилає `sandbox` плюс робочу область
породження subagent у міст інструментів. Міст також передає обмежені елементи
керування побудовою інструментів, які може забезпечити на межі SDK:
`includeCoreTools`, allowlist інструментів runtime і `toolConstructionPlan`.

Міст також використовує спільний helper поверхні інструментів обв’язки з
`openclaw/plugin-sdk/agent-harness-tool-runtime` для паритету з PI. Коли
увімкнено пошук інструментів, SDK бачить компактні інструменти керування плюс
прихований виконавець каталогу замість кожної схеми інструмента OpenClaw. Коли
увімкнено режим коду, helper будує ту саму контрольну поверхню режиму коду й
життєвий цикл каталогу, які використовують інші обв’язки агентів. Економні
типові налаштування локальних моделей, фільтрація схем, сумісна з runtime,
гідратація каталогів і очищення каталогу залишаються в спільному helper, щоб
обв’язки Copilot і суміжні з Codex не розходилися.

### GitHub-токен рівня сеансу

Контракт Copilot SDK розрізняє GitHub-токен **рівня клієнта**
(`CopilotClientOptions.gitHubToken`, що використовується для автентифікації
самого процесу CLI) і токен **рівня сеансу** (`SessionConfig.gitHubToken`, який
визначає виключення контенту, маршрутизацію моделі та квоту для цього сеансу й
враховується як у `createSession`, так і в `resumeSession`). Обв’язка один раз
розв’язує автентифікацію через `resolveCopilotAuth` і встановлює обидва поля,
коли режим автентифікації — `gitHubToken` (явний `auth.gitHubToken` або
розв’язаний за контрактом `resolvedApiKey` з налаштованого профілю
автентифікації `github-copilot`). Коли розв’язаний режим —
`useLoggedInUser`, поле рівня сеансу пропускається, щоб SDK і далі виводив
ідентичність із виконаного входу.

`ask_user` використовує `SessionConfig.onUserInputRequest`. Міст приймає
індекси або мітки варіантів для запитів із фіксованим вибором, приймає
відповіді у вільній формі, коли запит SDK це дозволяє, і скасовує очікуваний
запит, коли спробу OpenClaw перервано.

## Пов’язане

- [Runtime агентів](/uk/concepts/agent-runtimes)
- [Обв’язка Codex](/uk/plugins/codex-harness)
- [Plugin обв’язки агентів (довідник SDK)](/uk/plugins/sdk-agent-harness)
