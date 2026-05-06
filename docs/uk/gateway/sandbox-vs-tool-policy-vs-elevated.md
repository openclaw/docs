---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Чому інструмент заблоковано: середовище виконання пісочниці, політика дозволу/заборони інструментів і шлюзи підвищеного виконання'
title: Пісочниця, політика інструментів і підвищені права
x-i18n:
    generated_at: "2026-05-06T05:29:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw має три пов’язані (але різні) елементи керування:

1. **Пісочниця** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) визначає, **де запускаються інструменти** (бекенд пісочниці чи хост).
2. **Політика інструментів** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) визначає, **які інструменти доступні/дозволені**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) — це **аварійний вихід лише для exec**, щоб запускати поза пісочницею, коли ви в пісочниці (`gateway` за замовчуванням або `node`, коли ціль exec налаштована на `node`).

## Швидке налагодження

Використовуйте інспектор, щоб побачити, що OpenClaw _насправді_ робить:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Він виводить:

- ефективний режим/область дії пісочниці/доступ до робочої області
- чи поточний сеанс зараз у пісочниці (main проти non-main)
- ефективні allow/deny для інструментів пісочниці (і чи походять вони від агента/глобальних налаштувань/типових значень)
- запобіжники elevated та шляхи ключів для виправлення

## Пісочниця: де запускаються інструменти

Пісочниця керується через `agents.defaults.sandbox.mode`:

- `"off"`: усе запускається на хості.
- `"non-main"`: лише non-main сеанси запускаються в пісочниці (поширений "сюрприз" для груп/каналів).
- `"all"`: усе запускається в пісочниці.

Див. [Пісочниця](/uk/gateway/sandboxing) для повної матриці (область дії, монтування робочої області, образи).

### Bind-монтування (швидка перевірка безпеки)

- `docker.binds` _пробиває_ файлову систему пісочниці: усе, що ви монтуєте, видно всередині контейнера з установленим вами режимом (`:ro` або `:rw`).
- Якщо режим пропущено, типовим є читання-запис; для вихідного коду/секретів надавайте перевагу `:ro`.
- `scope: "shared"` ігнорує bind-монтування для окремих агентів (застосовуються лише глобальні bind-монтування).
- OpenClaw перевіряє джерела bind-монтувань двічі: спочатку нормалізований шлях джерела, потім ще раз після розв’язання через найглибшого наявного предка. Виходи через батьківські symlink не обходять перевірки заблокованих шляхів або дозволених коренів.
- Неіснуючі кінцеві шляхи все одно перевіряються безпечно. Якщо `/workspace/alias-out/new-file` розв’язується через symlink-батька до заблокованого шляху або за межі налаштованих дозволених коренів, bind-монтування відхиляється.
- Bind-монтування `/var/run/docker.sock` фактично передає пісочниці контроль над хостом; робіть це лише свідомо.
- Доступ до робочої області (`workspaceAccess: "ro"`/`"rw"`) не залежить від режимів bind-монтувань.

## Політика інструментів: які інструменти існують/можуть викликатися

Важливі два рівні:

- **Профіль інструментів**: `tools.profile` і `agents.list[].tools.profile` (базовий список дозволів)
- **Профіль інструментів провайдера**: `tools.byProvider[provider].profile` і `agents.list[].tools.byProvider[provider].profile`
- **Глобальна/агентна політика інструментів**: `tools.allow`/`tools.deny` і `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Політика інструментів провайдера**: `tools.byProvider[provider].allow/deny` і `agents.list[].tools.byProvider[provider].allow/deny`
- **Політика інструментів пісочниці** (застосовується лише в пісочниці): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` і `agents.list[].tools.sandbox.tools.*`

Практичні правила:

- `deny` завжди перемагає.
- Якщо `allow` непорожній, усе інше вважається заблокованим.
- Політика інструментів — це жорстка зупинка: `/exec` не може обійти заборонений інструмент `exec`.
- `/exec` лише змінює типові значення сеансу для авторизованих відправників; він не надає доступ до інструментів.
  Ключі інструментів провайдера приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).

### Групи інструментів (скорочення)

Політики інструментів (глобальні, агентні, пісочниці) підтримують записи `group:*`, які розгортаються в кілька інструментів:

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
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: усі вбудовані інструменти OpenClaw (крім Plugin-провайдерів)

## Elevated: "запуск на хості" лише для exec

Elevated **не** надає додаткових інструментів; він впливає лише на `exec`.

- Якщо ви в пісочниці, `/elevated on` (або `exec` з `elevated: true`) запускає поза пісочницею (схвалення все ще можуть застосовуватися).
- Використовуйте `/elevated full`, щоб пропустити схвалення exec для сеансу.
- Якщо ви вже запускаєте напряму, elevated фактично нічого не змінює (але все одно проходить через запобіжники).
- Elevated **не** обмежується Skills і **не** перевизначає allow/deny для інструментів.
- Elevated не надає довільних міжхостових перевизначень із `host=auto`; він дотримується звичайних правил цілі exec і зберігає `node` лише тоді, коли налаштована/сеансова ціль уже є `node`.
- `/exec` відокремлений від elevated. Він лише коригує типові значення exec для сеансу авторизованих відправників.

Запобіжники:

- Увімкнення: `tools.elevated.enabled` (і, за потреби, `agents.list[].tools.elevated.enabled`)
- Списки дозволених відправників: `tools.elevated.allowFrom.<provider>` (і, за потреби, `agents.list[].tools.elevated.allowFrom.<provider>`)

Див. [Режим Elevated](/uk/tools/elevated).

## Поширені виправлення "ув’язнення в пісочниці"

### "Tool X blocked by sandbox tool policy"

Ключі для виправлення (виберіть один):

- Вимкнути пісочницю: `agents.defaults.sandbox.mode=off` (або для окремого агента `agents.list[].sandbox.mode=off`)
- Дозволити інструмент усередині пісочниці:
  - вилучити його з `tools.sandbox.tools.deny` (або з агентного `agents.list[].tools.sandbox.tools.deny`)
  - або додати його до `tools.sandbox.tools.allow` (або до агентного allow)

### "I thought this was main, why is it sandboxed?"

У режимі `"non-main"` ключі груп/каналів _не_ є main. Використовуйте ключ main-сеансу (показаний `sandbox explain`) або змініть режим на `"off"`.

## Пов’язане

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник пісочниці (режими, області дії, бекенди, образи)
- [Пісочниця та інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення й пріоритети для окремих агентів
- [Режим Elevated](/uk/tools/elevated)
