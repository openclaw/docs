---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Чому tool заблоковано: runtime sandbox, політика allow/deny для tools і шлюзи підвищеного exec'
title: Sandbox проти політики tools проти elevated
x-i18n:
    generated_at: "2026-04-23T20:54:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5525901fef8c3cb78780e37ba7e8029cc39155e871f27f2b783cd47cf9c30bac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw має три пов’язані (але різні) механізми керування:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) вирішує, **де виконуються tools** (backend sandbox чи хост).
2. **Політика tools** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) вирішує, **які tools доступні/дозволені**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) — це **лише для exec аварійний обхід**, щоб виконувати поза sandbox, коли ви в sandbox (`gateway` типово або `node`, коли ціль exec налаштована на `node`).

## Швидке налагодження

Використовуйте inspector, щоб побачити, що OpenClaw _насправді_ робить:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Він виводить:

- ефективний режим sandbox/область дії/доступ до робочого простору
- чи сесія зараз працює в sandbox (main чи non-main)
- ефективний allow/deny для tools у sandbox (і чи він походить від agent/global/default)
- шлюзи elevated і шляхи ключів для виправлення

## Sandbox: де виконуються tools

Sandboxing керується через `agents.defaults.sandbox.mode`:

- `"off"`: усе виконується на хості.
- `"non-main"`: у sandbox працюють лише не-main сесії (типовий «сюрприз» для groups/channels).
- `"all"`: усе працює в sandbox.

Повну матрицю (область дії, монтування робочого простору, образи) див. у [Sandboxing](/uk/gateway/sandboxing).

### Bind mounts (швидка перевірка безпеки)

- `docker.binds` _пробиває_ файлову систему sandbox: усе, що ви змонтуєте, буде видиме всередині контейнера з указаним режимом (`:ro` або `:rw`).
- Якщо режим не вказано, типовим є читання-запис; для source/секретів надавайте перевагу `:ro`.
- `scope: "shared"` ігнорує bind для кожного агента окремо (застосовуються лише глобальні bind).
- OpenClaw двічі валідує джерела bind: спочатку за нормалізованим шляхом джерела, а потім ще раз після розв’язання через найглибшого наявного предка. Виходи через батьківський symlink не обходять перевірки blocked-path або allowed-root.
- Неіснуючі leaf-шляхи також перевіряються безпечно. Якщо `/workspace/alias-out/new-file` розв’язується через symlink-батька до заблокованого шляху або поза налаштованими дозволеними коренями, bind відхиляється.
- Прив’язування `/var/run/docker.sock` фактично передає контроль над хостом sandbox; робіть це лише свідомо.
- Доступ до робочого простору (`workspaceAccess: "ro"`/`"rw"`) не залежить від режимів bind.

## Політика tools: які tools існують/можуть викликатися

Важливі два рівні:

- **Профіль tools**: `tools.profile` і `agents.list[].tools.profile` (базовий allowlist)
- **Профіль tools провайдера**: `tools.byProvider[provider].profile` і `agents.list[].tools.byProvider[provider].profile`
- **Глобальна/для агента політика tools**: `tools.allow`/`tools.deny` і `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Політика tools провайдера**: `tools.byProvider[provider].allow/deny` і `agents.list[].tools.byProvider[provider].allow/deny`
- **Політика tools sandbox** (застосовується лише в sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` і `agents.list[].tools.sandbox.tools.*`

Практичні правила:

- `deny` завжди має пріоритет.
- Якщо `allow` не порожній, усе інше вважається заблокованим.
- Політика tools — це жорстка зупинка: `/exec` не може перевизначити заборонений tool `exec`.
- `/exec` лише змінює типові значення сесії для авторизованих відправників; він не надає доступу до tools.
  Ключі tools провайдера приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.5`).

### Групи tools (скорочення)

Політики tools (глобальні, для агента, sandbox) підтримують записи `group:*`, які розгортаються в кілька tools:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Доступні групи:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` приймається як
  псевдонім для `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: усі вбудовані tools OpenClaw (без Plugin провайдерів)

## Elevated: лише для exec «запустити на хості»

Elevated **не** надає додаткових tools; він впливає лише на `exec`.

- Якщо ви в sandbox, `/elevated on` (або `exec` з `elevated: true`) запускає виконання поза sandbox (при цьому схвалення все одно можуть застосовуватися).
- Використовуйте `/elevated full`, щоб пропустити схвалення exec для сесії.
- Якщо ви вже виконуєтесь напряму, elevated фактично нічого не змінює (але все одно проходить через шлюзи).
- Elevated **не** має області дії Skills і **не** перевизначає allow/deny для tools.
- Elevated не надає довільних міжхостових перевизначень із `host=auto`; він дотримується звичайних правил цілі exec і лише зберігає `node`, коли налаштована/сесійна ціль уже є `node`.
- `/exec` відокремлений від elevated. Він лише коригує типові параметри exec для кожної сесії для авторизованих відправників.

Шлюзи:

- Увімкнення: `tools.elevated.enabled` (і, за потреби, `agents.list[].tools.elevated.enabled`)
- Allowlist відправників: `tools.elevated.allowFrom.<provider>` (і, за потреби, `agents.list[].tools.elevated.allowFrom.<provider>`)

Див. [Elevated Mode](/uk/tools/elevated).

## Поширені виправлення «sandbox jail»

### «Tool X blocked by sandbox tool policy»

Ключі для виправлення (оберіть один):

- Вимкнути sandbox: `agents.defaults.sandbox.mode=off` (або для конкретного агента `agents.list[].sandbox.mode=off`)
- Дозволити tool усередині sandbox:
  - видалити його з `tools.sandbox.tools.deny` (або `agents.list[].tools.sandbox.tools.deny` для агента)
  - або додати його до `tools.sandbox.tools.allow` (або до allow для агента)

### «Я думав, це main, чому воно в sandbox?»

У режимі `"non-main"` ключі group/channel _не_ є main. Використовуйте ключ main session (показується через `sandbox explain`) або перемкніть режим на `"off"`.

## Див. також

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник по sandbox (режими, області дії, backend, образи)
- [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для кожного агента та пріоритети
- [Elevated Mode](/uk/tools/elevated)
