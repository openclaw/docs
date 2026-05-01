---
read_when:
    - Запуск середовищ кодування через ACP
    - Налаштування сеансів ACP, прив’язаних до розмов, у каналах обміну повідомленнями
    - Прив’язування розмови в каналі повідомлень до постійного сеансу ACP
    - Усунення несправностей бекенда ACP, підключення Plugin або доставки завершень
    - Керування командами /acp із чату
sidebarTitle: ACP agents
summary: Запуск зовнішніх середовищ кодування (Claude Code, Cursor, Gemini CLI, явний Codex ACP, OpenClaw ACP, OpenCode) через бекенд ACP
title: ACP-агенти
x-i18n:
    generated_at: "2026-05-01T07:53:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) сеанси
дають OpenClaw змогу запускати зовнішні кодувальні обгортки (наприклад Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI та інші
підтримувані ACPX-обгортки) через backend-plugin ACP.

Кожен запуск ACP-сеансу відстежується як [фонове завдання](/uk/automation/tasks).

<Note>
**ACP — це шлях зовнішньої обгортки, а не стандартний шлях Codex.** Native
app-server plugin Codex відповідає за керування `/codex ...` і
вбудований runtime `agentRuntime.id: "codex"`; ACP відповідає за
керування `/acp ...` і сеанси `sessions_spawn({ runtime: "acp" })`.

Якщо ви хочете, щоб Codex або Claude Code під’єднувалися як зовнішній MCP-клієнт
безпосередньо до наявних розмов каналів OpenClaw, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.
</Note>

## Яка сторінка мені потрібна?

| Ви хочете…                                                                                    | Використовуйте                        | Примітки                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати або керувати Codex у поточній розмові                                              | `/codex bind`, `/codex threads`       | Native шлях app-server Codex, коли `codex` plugin увімкнено; включає прив’язані відповіді чату, пересилання зображень, модель/швидкий режим/дозволи, зупинку та керування напрямом. ACP є явним fallback |
| Запустити Claude Code, Gemini CLI, явний Codex ACP або іншу зовнішню обгортку _через_ OpenClaw | Ця сторінка                           | Прив’язані до чату сеанси, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, керування runtime                                                                            |
| Надати сеанс OpenClaw Gateway _як_ ACP-сервер для редактора або клієнта                       | [`openclaw acp`](/uk/cli/acp)            | Режим bridge. IDE/клієнт спілкується з OpenClaw через ACP поверх stdio/WebSocket                                                                                                             |
| Повторно використати локальний AI CLI як текстову fallback-модель                             | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Без інструментів OpenClaw, без керування ACP, без runtime обгортки                                                                                                                   |

## Чи працює це одразу?

Зазвичай так. Свіжі встановлення постачаються з bundled runtime-plugin `acpx`, увімкненим
за замовчуванням, із plugin-local pinned binary `acpx`, який OpenClaw перевіряє
та самовідновлює відразу після того, як HTTP-listener Gateway стає активним. Запустіть
`/acp doctor` для перевірки готовності.

OpenClaw навчає агентів запуску ACP лише тоді, коли ACP **справді
придатний до використання**: ACP має бути увімкнений, dispatch не має бути вимкнений, поточний
сеанс не має бути заблокований sandbox, а runtime backend має бути
завантажений. Якщо ці умови не виконано, ACP plugin skills і
підказки ACP для `sessions_spawn` залишаються прихованими, щоб агент не пропонував
недоступний backend.

<AccordionGroup>
  <Accordion title="Підводні камені першого запуску">
    - Якщо встановлено `plugins.allow`, це обмежувальний інвентар plugin і він **обов’язково** має містити `acpx`; інакше bundled default навмисно блокується, а `/acp doctor` повідомляє про відсутній запис allowlist.
    - Bundled ACP-адаптер Codex розгортається разом із plugin `acpx` і, коли можливо, запускається локально.
    - Інші адаптери цільових обгорток можуть усе ще завантажуватися на вимогу через `npx` під час першого використання.
    - Vendor auth усе ще має існувати на host для цієї обгортки.
    - Якщо host не має npm або доступу до мережі, перші завантаження адаптерів не вдаватимуться, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

  </Accordion>
  <Accordion title="Передумови runtime">
    ACP запускає справжній процес зовнішньої обгортки. OpenClaw відповідає за маршрутизацію,
    стан фонових завдань, доставлення, прив’язки та policy; обгортка
    відповідає за свій provider login, каталог моделей, поведінку файлової системи та
    native tools.

    Перш ніж звинувачувати OpenClaw, перевірте:

    - `/acp doctor` повідомляє про увімкнений і справний backend.
    - Target id дозволений `acp.allowedAgents`, коли цей allowlist встановлено.
    - Команда обгортки може запуститися на host Gateway.
    - Для цієї обгортки наявна provider auth (`claude`, `codex`, `gemini`, `opencode`, `droid` тощо).
    - Вибрана модель існує для цієї обгортки — model ids не переносяться між обгортками.
    - Запитаний `cwd` існує й доступний, або пропустіть `cwd` і дозвольте backend використати default.
    - Режим дозволів відповідає роботі. Неінтерактивні сеанси не можуть натискати native permission prompts, тому кодувальні запуски з інтенсивним write/exec зазвичай потребують профілю дозволів ACPX, який може продовжувати роботу headlessly.

  </Accordion>
</AccordionGroup>

Інструменти OpenClaw plugin і вбудовані інструменти OpenClaw **не** надаються
ACP-обгорткам за замовчуванням. Увімкніть явні MCP bridges у
[Налаштування ACP-агентів](/uk/tools/acp-agents-setup) лише тоді, коли обгортка
має викликати ці інструменти безпосередньо.

## Підтримувані цілі обгорток

Із bundled backend `acpx` використовуйте ці harness ids як цілі `/acp spawn <id>`
або `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | Типовий backend                              | Примітки                                                                           |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | ACP-адаптер Claude Code                      | Потребує auth Claude Code на host.                                                 |
| `codex`    | ACP-адаптер Codex                            | Лише явний ACP fallback, коли native `/codex` недоступний або запитано ACP.        |
| `copilot`  | ACP-адаптер GitHub Copilot                   | Потребує auth Copilot CLI/runtime.                                                 |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)          | Перевизначте команду acpx, якщо локальне встановлення надає інший ACP entrypoint.  |
| `droid`    | Factory Droid CLI                            | Потребує auth Factory/Droid або `FACTORY_API_KEY` в environment обгортки.          |
| `gemini`   | ACP-адаптер Gemini CLI                       | Потребує auth Gemini CLI або налаштування API key.                                 |
| `iflow`    | iFlow CLI                                    | Доступність адаптера та керування моделлю залежать від встановленого CLI.          |
| `kilocode` | Kilo Code CLI                                | Доступність адаптера та керування моделлю залежать від встановленого CLI.          |
| `kimi`     | Kimi/Moonshot CLI                            | Потребує auth Kimi/Moonshot на host.                                               |
| `kiro`     | Kiro CLI                                     | Доступність адаптера та керування моделлю залежать від встановленого CLI.          |
| `opencode` | ACP-адаптер OpenCode                         | Потребує auth OpenCode CLI/provider.                                               |
| `openclaw` | Bridge OpenClaw Gateway через `openclaw acp` | Дає ACP-aware обгортці змогу звертатися назад до сеансу OpenClaw Gateway.          |
| `pi`       | Pi/вбудований runtime OpenClaw               | Використовується для native для OpenClaw експериментів з обгортками.               |
| `qwen`     | Qwen Code / Qwen CLI                         | Потребує Qwen-compatible auth на host.                                             |

Власні псевдоніми агентів acpx можна налаштувати в самому acpx, але policy OpenClaw
усе одно перевіряє `acp.allowedAgents` і будь-яке
зіставлення `agents.list[].runtime.acp.agent` перед dispatch.

## Runbook оператора

Швидкий потік `/acp` із чату:

<Steps>
  <Step title="Запуск">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` або явний
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Робота">
    Продовжуйте у прив’язаній розмові або thread (або явно вкажіть session
    key).
  </Step>
  <Step title="Перевірка стану">
    `/acp status`
  </Step>
  <Step title="Налаштування">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Спрямування">
    Без заміни контексту: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Зупинка">
    `/acp cancel` (поточний turn) або `/acp close` (сеанс + прив’язки).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Подробиці життєвого циклу">
    - Spawn створює або відновлює ACP runtime session, записує ACP metadata у сховище сеансів OpenClaw і може створити фонове завдання, коли запуск належить parent.
    - Parent-owned ACP-сеанси розглядаються як фонова робота, навіть коли runtime session є persistent; completion і cross-surface delivery проходять через parent task notifier, а не поводяться як звичайний user-facing chat session.
    - Task maintenance закриває terminal або orphaned parent-owned one-shot ACP-сеанси. Persistent ACP-сеанси зберігаються, доки залишається активна прив’язка розмови; stale persistent сеанси без активної прив’язки закриваються, щоб їх не можна було тихо відновити після завершення owning task або зникнення його task record.
    - Прив’язані follow-up messages ідуть безпосередньо до ACP-сеансу, доки прив’язку не буде закрито, unfocused, reset або доки вона не expired.
    - Команди Gateway залишаються локальними. `/acp ...`, `/status` і `/unfocus` ніколи не надсилаються як звичайний prompt text до прив’язаної ACP-обгортки.
    - `cancel` перериває active turn, коли backend підтримує скасування; він не видаляє прив’язку або session metadata.
    - `close` завершує ACP-сеанс із погляду OpenClaw і видаляє прив’язку. Обгортка все ще може зберігати власну upstream history, якщо підтримує resume.
    - Idle runtime workers можуть бути очищені після `acp.runtime.ttlMinutes`; збережена session metadata лишається доступною для `/acp sessions`.

  </Accordion>
  <Accordion title="Правила маршрутизації native Codex">
    Тригери природною мовою, які мають маршрутизуватися до **native Codex
    plugin**, коли він увімкнений:

    - "Прив’яжи цей Discord channel до Codex."
    - "Приєднай цей chat до Codex thread `<id>`."
    - "Покажи Codex threads, потім прив’яжи цей."

    Native прив’язка розмов Codex є стандартним шляхом chat-control.
    Динамічні інструменти OpenClaw усе ще виконуються через OpenClaw, тоді як
    native інструменти Codex, як-от shell/apply-patch, виконуються всередині Codex.
    Для подій native інструментів Codex OpenClaw ін’єктує per-turn native
    hook relay, щоб plugin hooks могли блокувати `before_tool_call`, спостерігати
    `after_tool_call` і маршрутизувати події Codex `PermissionRequest`
    через approvals OpenClaw. Hooks Codex `Stop` ретранслюються до
    OpenClaw `before_agent_finalize`, де plugins можуть запросити ще один
    model pass до того, як Codex фіналізує свою відповідь. Relay залишається
    навмисно консервативним: він не змінює arguments native інструментів Codex
    і не переписує records thread Codex. Використовуйте явний ACP лише
    тоді, коли вам потрібна модель ACP runtime/session. Межу підтримки вбудованого Codex
    задокументовано в
    [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Шпаргалка вибору моделі / провайдера / runtime">
    - `openai-codex/*` — маршрут PI Codex OAuth/підписки.
    - `openai/*` плюс `agentRuntime.id: "codex"` — вбудований runtime нативного сервера застосунку Codex.
    - `/codex ...` — керування нативною розмовою Codex.
    - `/acp ...` або `runtime: "acp"` — явне керування ACP/acpx.

  </Accordion>
  <Accordion title="Тригери природною мовою для маршрутизації ACP">
    Тригери, які мають маршрутизуватися до ACP runtime:

    - "Запусти це як одноразовий сеанс Claude Code ACP і підсумуй результат."
    - "Використай Gemini CLI для цього завдання в гілці, а потім тримай подальші відповіді в тій самій гілці."
    - "Запусти Codex через ACP у фоновій гілці."

    OpenClaw вибирає `runtime: "acp"`, визначає harness `agentId`,
    прив’язується до поточної розмови або гілки, коли це підтримується, і
    маршрутизує подальші повідомлення до цього сеансу до закриття/закінчення строку дії. Codex
    іде цим шляхом лише коли ACP/acpx вказано явно або нативний Codex
    Plugin недоступний для запитаної операції.

    Для `sessions_spawn`, `runtime: "acp"` оголошується лише коли ACP
    увімкнено, запитувач не ізольований у пісочниці, і завантажено ACP runtime
    backend. `acp.dispatch.enabled=false` призупиняє автоматичне
    диспетчеризування ACP-гілок, але не приховує й не блокує явні
    виклики `sessions_spawn({ runtime: "acp" })`. Він націлюється на ACP harness ids, як-от `codex`,
    `claude`, `droid`, `gemini` або `opencode`. Не передавайте звичайний
    id агента конфігурації OpenClaw з `agents_list`, якщо цей запис
    не налаштований явно з `agents.list[].runtime.type="acp"`;
    інакше використовуйте стандартний runtime під-агента. Коли агент OpenClaw
    налаштований із `runtime.type="acp"`, OpenClaw використовує
    `runtime.acp.agent` як базовий harness id.

  </Accordion>
</AccordionGroup>

## ACP проти під-агентів

Використовуйте ACP, коли вам потрібен зовнішній harness runtime. Використовуйте **нативний
сервер застосунку Codex** для прив’язування/керування розмовами Codex, коли `codex`
Plugin увімкнено. Використовуйте **під-агентів**, коли вам потрібні нативні для OpenClaw
делеговані запуски.

| Область       | Сеанс ACP                             | Запуск під-агента                  |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP backend Plugin (наприклад acpx)   | Нативний runtime під-агента OpenClaw |
| Ключ сеансу   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Основні команди | `/acp ...`                          | `/subagents ...`                   |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (стандартний runtime) |

Див. також [Під-агенти](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування сеансом OpenClaw ACP.
2. Вбудований runtime Plugin `acpx`.
3. Адаптер Claude ACP.
4. Runtime/сеансний механізм на стороні Claude.

ACP Claude — це **harness-сеанс** із засобами керування ACP, відновленням сеансу,
відстеженням фонових завдань і необов’язковим прив’язуванням розмови/гілки.

CLI backend-и — це окремі текстові локальні резервні runtime-и — див.
[CLI backend-и](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- **Потрібні `/acp spawn`, прив’язувані сеанси, засоби керування runtime або постійна робота harness?** Використовуйте ACP.
- **Потрібен простий локальний текстовий резерв через сирий CLI?** Використовуйте CLI backend-и.

## Прив’язані сеанси

### Ментальна модель

- **Поверхня чату** — де люди продовжують розмову (канал Discord, тема Telegram, чат iMessage).
- **Сеанс ACP** — довговічний runtime-стан Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **Дочірня гілка/тема** — необов’язкова додаткова поверхня повідомлень, створена лише через `--thread ...`.
- **Робочий простір runtime** — розташування файлової системи (`cwd`, checkout репозиторію, робочий простір backend), де працює harness. Незалежний від поверхні чату.

### Прив’язки поточної розмови

`/acp spawn <harness> --bind here` закріплює поточну розмову за
створеним сеансом ACP — без дочірньої гілки, та сама поверхня чату. OpenClaw продовжує
володіти транспортом, автентифікацією, безпекою й доставкою. Подальші повідомлення в цій
розмові маршрутизуються до того самого сеансу; `/new` і `/reset` скидають
сеанс на місці; `/acp close` видаляє прив’язку.

Приклади:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Правила прив’язування та взаємовиключність">
    - `--bind here` і `--thread ...` є взаємовиключними.
    - `--bind here` працює лише в каналах, які оголошують прив’язування поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язки зберігаються після перезапусків Gateway.
    - У Discord, `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірню гілку для `--thread auto|here` — не для `--bind here`.
    - Якщо ви запускаєте інший ACP-агент без `--cwd`, OpenClaw стандартно успадковує робочий простір **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) відступають до стандартного backend; інші помилки доступу (наприклад `EACCES`) показуються як помилки запуску.
    - Команди керування Gateway лишаються локальними у прив’язаних розмовах — команди `/acp ...` обробляє OpenClaw, навіть коли звичайний текст подальших повідомлень маршрутизується до прив’язаного сеансу ACP; `/status` і `/unfocus` також лишаються локальними, коли для цієї поверхні ввімкнена обробка команд.

  </Accordion>
  <Accordion title="Сеанси, прив’язані до гілки">
    Коли прив’язки гілок увімкнені для адаптера каналу:

    - OpenClaw прив’язує гілку до цільового сеансу ACP.
    - Подальші повідомлення в цій гілці маршрутизуються до прив’язаного сеансу ACP.
    - Вивід ACP доставляється назад у ту саму гілку.
    - Втрата фокуса/закриття/архівування/тайм-аут простою або закінчення максимального віку видаляє прив’язку.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` і `/unfocus` — це команди Gateway, а не prompts до ACP harness.

    Обов’язкові прапорці функцій для ACP, прив’язаного до гілки:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` стандартно увімкнено (задайте `false`, щоб призупинити автоматичне диспетчеризування ACP-гілок; явні виклики `sessions_spawn({ runtime: "acp" })` і далі працюють).
    - Увімкнений прапорець створення ACP-гілок адаптера каналу (залежить від адаптера):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Підтримка прив’язування гілок залежить від адаптера. Якщо активний адаптер
    каналу не підтримує прив’язки гілок, OpenClaw повертає чітке
    повідомлення про непідтримуваність/недоступність.

  </Accordion>
  <Accordion title="Канали з підтримкою гілок">
    - Будь-який адаптер каналу, який надає можливість прив’язування сеансу/гілки.
    - Поточна вбудована підтримка: гілки/канали **Discord**, теми **Telegram** (теми форуму в групах/супергрупах і теми DM).
    - Канали Plugin можуть додати підтримку через той самий інтерфейс прив’язування.

  </Accordion>
</AccordionGroup>

## Постійні прив’язки каналів

Для неефемерних workflow налаштовуйте постійні прив’язки ACP у
записах верхнього рівня `bindings[]`.

### Модель прив’язування

<ParamField path="bindings[].type" type='"acp"'>
  Позначає постійну прив’язку розмови ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Ідентифікує цільову розмову. Форми за каналами:

- **Канал/гілка Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Тема форуму Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/група BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Надавайте перевагу `chat_id:*` або `chat_identifier:*` для стабільних прив’язок груп.
- **DM/група iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Надавайте перевагу `chat_id:*` для стабільних прив’язок груп.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id агента-власника OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Необов’язкове перевизначення ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Необов’язкова мітка для оператора.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Необов’язковий робочий каталог runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Необов’язкове перевизначення backend.
</ParamField>

### Стандартні налаштування runtime для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити стандартні налаштування ACP для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Пріоритет перевизначення для прив’язаних сеансів ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Глобальні стандартні налаштування ACP (наприклад `acp.backend`)

### Приклад

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Поведінка

- OpenClaw гарантує, що налаштований сеанс ACP існує перед використанням.
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованого сеансу ACP.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ сеансу ACP на місці.
- Тимчасові runtime-прив’язки (наприклад створені потоками фокусування гілки) і далі застосовуються там, де присутні.
- Для міжагентних ACP-запусків без явного `cwd`, OpenClaw успадковує робочий простір цільового агента з конфігурації агента.
- Відсутні успадковані шляхи робочого простору відступають до стандартного cwd backend; невідсутні збої доступу показуються як помилки запуску.

## Запуск сеансів ACP

Два способи запустити сеанс ACP:

<Tabs>
  <Tab title="З sessions_spawn">
    Використовуйте `runtime: "acp"`, щоб запустити сеанс ACP з ходу агента або
    виклику інструмента.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` за замовчуванням має значення `subagent`, тому для сеансів ACP явно задавайте `runtime: "acp"`. Якщо `agentId` не вказано, OpenClaw використовує `acp.defaultAgent`, коли це налаштовано. `mode: "session"` потребує `thread: true`, щоб зберегти постійну прив’язану розмову.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Використовуйте `/acp spawn` для явного керування оператором із чату.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Ключові прапорці:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Див. [Слеш-команди](/uk/tools/slash-commands).

  </Tab>
</Tabs>

### Параметри `sessions_spawn`

<ParamField path="task" type="string" required>
  Початковий промпт, надісланий до сеансу ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Для сеансів ACP має бути `"acp"`.
</ParamField>
<ParamField path="agentId" type="string">
  Ідентифікатор цільової оболонки ACP. Повертається до `acp.defaultAgent`, якщо його задано.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Запитує потік прив’язування розмови там, де це підтримується.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` — одноразовий режим; `"session"` — постійний. Якщо `thread: true`, а `mode` не вказано, OpenClaw може за замовчуванням вибрати постійну поведінку відповідно до шляху runtime. `mode: "session"` потребує `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Запитаний робочий каталог runtime (перевіряється політикою бекенда/runtime). Якщо не вказано, запуск ACP успадковує робочий простір цільового агента, коли це налаштовано; відсутні успадковані шляхи повертаються до стандартних значень бекенда, тоді як реальні помилки доступу повертаються.
</ParamField>
<ParamField path="label" type="string">
  Видима оператору мітка, що використовується в тексті сеансу/банера.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Відновлює наявний сеанс ACP замість створення нового. Агент відтворює історію розмови через `session/load`. Потребує `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` транслює початкові підсумки перебігу запуску ACP назад до сеансу-запитувача як системні події. Прийняті відповіді містять `streamLogPath`, що вказує на прив’язаний до сеансу JSONL-журнал (`<sessionId>.acp-stream.jsonl`), який можна відстежувати для повної історії ретрансляції.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Перериває дочірній хід ACP після N секунд. `0` залишає хід на шляху Gateway без тайм-ауту. Те саме значення застосовується до запуску Gateway і runtime ACP, щоб завислі або вичерпані за квотою оболонки не займали чергу батьківського агента безстроково.
</ParamField>
<ParamField path="model" type="string">
  Явне перевизначення моделі для дочірнього сеансу ACP. Запуски Codex ACP нормалізують посилання OpenClaw Codex, як-от `openai-codex/gpt-5.4`, до стартової конфігурації Codex ACP перед `session/new`; слеш-форми на кшталт `openai-codex/gpt-5.4/high` також задають reasoning effort Codex ACP. Інші оболонки мають оголошувати ACP `models` і підтримувати `session/set_model`; інакше OpenClaw/acpx явно завершується помилкою, замість мовчки повертатися до стандартного агента цільового агента.
</ParamField>
<ParamField path="thinking" type="string">
  Явне зусилля мислення/міркування. Для Codex ACP `minimal` відповідає низькому зусиллю, `low`/`medium`/`high`/`xhigh` відповідають напряму, а `off` пропускає стартове перевизначення reasoning effort.
</ParamField>

## Режими прив’язування й розмови під час запуску

<Tabs>
  <Tab title="--bind here|off">
    | Режим  | Поведінка                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Прив’язати поточну активну розмову на місці; помилка, якщо активної розмови немає. |
    | `off`  | Не створювати прив’язування поточної розмови.                          |

    Нотатки:

    - `--bind here` — найпростіший шлях оператора для «зробити цей канал або чат підтримуваним Codex».
    - `--bind here` не створює дочірню розмову.
    - `--bind here` доступний лише на каналах, які надають підтримку прив’язування поточної розмови.
    - `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Режим  | Поведінка                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | В активній розмові: прив’язати цю розмову. Поза розмовою: створити/прив’язати дочірню розмову, якщо підтримується. |
    | `here` | Вимагати поточну активну розмову; помилка, якщо користувач не в розмові.                             |
    | `off`  | Без прив’язування. Сеанс запускається неприв’язаним.                                                 |

    Нотатки:

    - На поверхнях без прив’язування розмов стандартна поведінка фактично є `off`.
    - Запуск із прив’язуванням до розмови потребує підтримки політики каналу:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Використовуйте `--bind here`, коли потрібно закріпити поточну розмову без створення дочірньої розмови.

  </Tab>
</Tabs>

## Модель доставки

Сеанси ACP можуть бути інтерактивними робочими просторами або фоновою роботою, що належить батьківському сеансу. Шлях доставки залежить від цієї форми.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Інтерактивні сеанси призначені для продовження розмови на видимій чат-поверхні:

    - `/acp spawn ... --bind here` прив’язує поточну розмову до сеансу ACP.
    - `/acp spawn ... --thread ...` прив’язує розмову/тему каналу до сеансу ACP.
    - Постійно налаштовані `bindings[].type="acp"` спрямовують відповідні розмови до того самого сеансу ACP.

    Подальші повідомлення в прив’язаній розмові спрямовуються безпосередньо до сеансу ACP, а вивід ACP доставляється назад у той самий канал/розмову/тему.

    Що OpenClaw надсилає до оболонки:

    - Звичайні прив’язані подальші повідомлення надсилаються як текст промпта, плюс вкладення лише тоді, коли оболонка/бекенд їх підтримує.
    - Команди керування `/acp` і локальні команди Gateway перехоплюються до відправлення в ACP.
    - Події завершення, згенеровані runtime, матеріалізуються для кожної цілі. Агенти OpenClaw отримують внутрішню обгортку runtime-контексту OpenClaw; зовнішні оболонки ACP отримують звичайний промпт із дочірнім результатом та інструкцією. Необроблена обгортка `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ніколи не має надсилатися до зовнішніх оболонок або зберігатися як текст користувацької стенограми ACP.
    - Записи стенограми ACP використовують видимий користувачу текст тригера або звичайний промпт завершення. Внутрішні метадані подій за можливості залишаються структурованими в OpenClaw і не трактуються як чат-вміст, створений користувачем.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Одноразові сеанси ACP, запущені іншим запуском агента, є фоновими дочірніми сеансами, подібними до субагентів:

    - Батьківський сеанс запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Дочірній сеанс виконується у власному сеансі оболонки ACP.
    - Дочірні ходи виконуються в тій самій фоновій черзі, що й нативні запуски субагентів, тому повільна оболонка ACP не блокує непов’язану роботу основного сеансу.
    - Завершення повідомляється назад через шлях оголошення завершення завдання. OpenClaw перетворює внутрішні метадані завершення на звичайний промпт ACP перед надсиланням до зовнішньої оболонки, тому оболонки не бачать маркерів runtime-контексту, призначених лише для OpenClaw.
    - Батьківський сеанс переписує дочірній результат звичайним голосом асистента, коли корисна відповідь для користувача.

    **Не** трактуйте цей шлях як peer-to-peer чат між батьківським і дочірнім сеансами. Дочірній сеанс уже має канал завершення назад до батьківського.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` може націлитися на інший сеанс після запуску. Для звичайних однорангових сеансів OpenClaw використовує шлях подальшого повідомлення agent-to-agent (A2A) після впровадження повідомлення:

    - Дочекатися відповіді цільового сеансу.
    - За бажанням дозволити запитувачу й цілі обмінятися обмеженою кількістю подальших ходів.
    - Попросити ціль створити повідомлення-оголошення.
    - Доставити це оголошення у видимий канал або розмову.

    Цей шлях A2A є fallback для однорангових надсилань, де відправнику потрібне видиме подальше повідомлення. Він залишається ввімкненим, коли непов’язаний сеанс може бачити ціль ACP і надсилати їй повідомлення, наприклад за широких налаштувань `tools.sessions.visibility`.

    OpenClaw пропускає подальший A2A лише тоді, коли запитувач є батьківським сеансом власного одноразового дочірнього сеансу ACP, що належить батьківському. У такому разі запуск A2A поверх завершення завдання може розбудити батьківський сеанс результатом дочірнього, переслати відповідь батьківського назад у дочірній і створити цикл відлуння між батьківським і дочірнім. Результат `sessions_send` повідомляє `delivery.status="skipped"` для цього випадку власного дочірнього сеансу, бо шлях завершення вже відповідає за результат.

  </Accordion>
  <Accordion title="Resume an existing session">
    Використовуйте `resumeSessionId`, щоб продовжити попередній сеанс ACP замість початку з нуля. Агент відтворює історію розмови через `session/load`, тому продовжує з повним контекстом того, що було раніше.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Типові випадки використання:

    - Передайте сеанс Codex із ноутбука на телефон — скажіть своєму агенту продовжити з місця, де ви зупинилися.
    - Продовжте сеанс програмування, який ви інтерактивно почали в CLI, тепер безголово через свого агента.
    - Відновіть роботу, перервану перезапуском gateway або тайм-аутом бездіяльності.

    Нотатки:

    - `resumeSessionId` застосовується лише коли `runtime: "acp"`; стандартний runtime субагента ігнорує це поле, призначене лише для ACP.
    - `streamTo` застосовується лише коли `runtime: "acp"`; стандартний runtime субагента ігнорує це поле, призначене лише для ACP.
    - `resumeSessionId` — це локальний для хоста ідентифікатор відновлення ACP/оболонки, а не ключ сеансу каналу OpenClaw; OpenClaw все одно перевіряє політику запуску ACP і політику цільового агента перед відправленням, тоді як бекенд або оболонка ACP відповідає за авторизацію завантаження цього upstream id.
    - `resumeSessionId` відновлює історію upstream-розмови ACP; `thread` і `mode` усе одно нормально застосовуються до нового сеансу OpenClaw, який ви створюєте, тому `mode: "session"` усе ще потребує `thread: true`.
    - Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
    - Якщо ідентифікатор сеансу не знайдено, запуск завершується з чіткою помилкою — без мовчазного fallback до нового сеансу.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Після розгортання gateway виконайте живу наскрізну перевірку, а не покладайтеся на unit-тести:

    1. Перевірте розгорнуту версію gateway і коміт на цільовому хості.
    2. Відкрийте тимчасовий сеанс мосту ACPX до живого агента.
    3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Перевірте `accepted=yes`, реальний `childSessionKey` і відсутність помилки валідатора.
    5. Приберіть тимчасовий сеанс мосту.

    Тримайте gate на `mode: "run"` і пропустіть `streamTo: "parent"` — прив’язаний до розмови `mode: "session"` і шляхи потокової ретрансляції є окремими, багатшими інтеграційними проходами.

  </Accordion>
</AccordionGroup>

## Сумісність із sandbox

Сеанси ACP наразі виконуються в runtime хоста, **не** всередині sandbox OpenClaw.

<Warning>
**Межа безпеки:**

- Зовнішній harness може читати/писати відповідно до власних дозволів CLI і вибраного `cwd`.
- Політика sandbox OpenClaw **не** обгортає виконання ACP harness.
- OpenClaw і далі застосовує feature gates ACP, дозволених агентів, володіння сеансом, прив'язки каналів і політику доставки Gateway.
- Використовуйте `runtime: "subagent"` для нативної роботи OpenClaw із застосуванням sandbox.

</Warning>

Поточні обмеження:

- Якщо сеанс запитувача sandboxed, створення ACP блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.

## Розв'язання цілі сеансу

Більшість дій `/acp` приймають необов'язкову ціль сеансу (`session-key`,
`session-id` або `session-label`).

**Порядок розв'язання:**

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - пробує ключ
   - потім UUID-подібний ідентифікатор сеансу
   - потім мітку
2. Поточна прив'язка потоку (якщо ця розмова/потік прив'язана до сеансу ACP).
3. Резервний варіант: поточний сеанс запитувача.

Прив'язки поточної розмови й прив'язки потоку обидві беруть участь у
кроці 2.

Якщо ціль не розв'язується, OpenClaw повертає чітку помилку
(`Unable to resolve session target: ...`).

## Елементи керування ACP

| Команда              | Що робить                                                | Приклад                                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створює сеанс ACP; необов'язкова поточна прив'язка або прив'язка потоку. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує поточний turn для цільового сеансу.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає інструкцію steer до запущеного сеансу.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сеанс і скасовує прив'язку цілей потоку.        | `/acp close`                                                  |
| `/acp status`        | Показує бекенд, режим, стан, параметри runtime, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Встановлює режим runtime для цільового сеансу.           | `/acp set-mode plan`                                          |
| `/acp set`           | Записує загальний параметр конфігурації runtime.         | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Встановлює перевизначення робочого каталогу runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Встановлює профіль політики схвалень.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Встановлює тайм-аут runtime (секунди).                   | `/acp timeout 120`                                            |
| `/acp model`         | Встановлює перевизначення моделі runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів runtime сеансу.        | `/acp reset-options`                                          |
| `/acp sessions`      | Перелічує нещодавні сеанси ACP зі сховища.               | `/acp sessions`                                               |
| `/acp doctor`        | Стан бекенда, можливості, дієві виправлення.             | `/acp doctor`                                                 |
| `/acp install`       | Друкує детерміновані кроки встановлення та ввімкнення.   | `/acp install`                                                |

`/acp status` показує ефективні параметри runtime, а також ідентифікатори сеансу
рівня runtime і рівня бекенда. Помилки непідтримуваних елементів керування
чітко відображаються, коли бекенд не має відповідної можливості. `/acp sessions` читає
сховище для поточного прив'язаного сеансу або сеансу запитувача; токени цілі
(`session-key`, `session-id` або `session-label`) розв'язуються через
виявлення сеансів gateway, включно з користувацькими коренями `session.store`
для кожного агента.

### Зіставлення параметрів runtime

`/acp` має зручні команди й загальний setter. Еквівалентні
операції:

| Команда                      | Зіставляється з                      | Примітки                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ключ конфігурації runtime `model`    | Для Codex ACP OpenClaw нормалізує `openai-codex/<model>` до ідентифікатора моделі адаптера та зіставляє суфікси reasoning зі slash, як-от `openai-codex/gpt-5.4/high`, із `reasoning_effort`. |
| `/acp set thinking <level>`  | ключ конфігурації runtime `thinking` | Для Codex ACP OpenClaw надсилає відповідний `reasoning_effort`, якщо адаптер його підтримує.                                                                                      |
| `/acp permissions <profile>` | ключ конфігурації runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | ключ конфігурації runtime `timeout`  | —                                                                                                                                                                                |
| `/acp cwd <path>`            | перевизначення cwd runtime           | Пряме оновлення.                                                                                                                                                                 |
| `/acp set <key> <value>`     | загальне                             | `key=cwd` використовує шлях перевизначення cwd.                                                                                                                                   |
| `/acp reset-options`         | очищує всі перевизначення runtime    | —                                                                                                                                                                                |

## acpx harness, налаштування plugin і дозволи

Для конфігурації acpx harness (псевдоніми Claude Code / Codex / Gemini CLI),
MCP-мостів plugin-tools і OpenClaw-tools, а також режимів дозволів ACP
див.
[Агенти ACP — налаштування](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Ознака                                                                      | Ймовірна причина                                                                                                          | Виправлення                                                                                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend Plugin відсутній, вимкнений або заблокований `plugins.allow`.                                                     | Встановіть і ввімкніть backend Plugin, додайте `acpx` до `plugins.allow`, коли цей список дозволених значень задано, потім запустіть `/acp doctor`.                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                                                                   | Установіть `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Автоматичне відправлення зі звичайних повідомлень потоку вимкнено.                                                        | Установіть `acp.dispatch.enabled=true`, щоб відновити автоматичну маршрутизацію потоків; явні виклики `sessions_spawn({ runtime: "acp" })` досі працюють.               |
| `ACP agent "<id>" is not allowed by policy`                                 | Агента немає у списку дозволених.                                                                                         | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                        |
| `/acp doctor` reports backend not ready right after startup                 | Перевірка залежностей Plugin або самовідновлення ще виконується.                                                          | Трохи зачекайте й повторно запустіть `/acp doctor`; якщо стан лишається несправним, перевірте помилку встановлення backend і політику дозволу/заборони Plugin.          |
| Harness command not found                                                   | Adapter CLI не встановлено, підготовлені залежності Plugin відсутні або перше отримання через `npx` для не-Codex адаптера не вдалося. | Запустіть `/acp doctor`, відновіть залежності Plugin, установіть/попередньо прогрійте адаптер на хості Gateway або явно налаштуйте команду агента acpx.                  |
| Model-not-found from the harness                                            | Ідентифікатор моделі дійсний для іншого провайдера/harness, але не для цієї ACP цілі.                                    | Використайте модель зі списку цього harness, налаштуйте модель у harness або пропустіть перевизначення.                                                                 |
| Vendor auth error from the harness                                          | OpenClaw справний, але цільовий CLI/провайдер не авторизований.                                                           | Увійдіть або надайте потрібний ключ провайдера в середовищі хоста Gateway.                                                                                               |
| `Unable to resolve session target: ...`                                     | Некоректний ключ/ідентифікатор/токен мітки.                                                                               | Запустіть `/acp sessions`, скопіюйте точний ключ/мітку та повторіть спробу.                                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної прив’язуваної розмови.                                                             | Перейдіть до цільового чату/каналу й повторіть спробу або використайте запуск без прив’язки.                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості ACP-прив’язки поточної розмови.                                                                 | Використайте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте верхньорівневі `bindings[]` або перейдіть до підтримуваного каналу.                          |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом потоку.                                                                       | Перейдіть до цільового потоку або використайте `--thread auto`/`off`.                                                                                                    |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язки.                                                                        | Повторно прив’яжіть як власник або використайте іншу розмову чи потік.                                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язки потоку.                                                                               | Використайте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                             |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Середовище виконання ACP працює на боці хоста; сесія запитувача ізольована.                                               | Використайте `runtime="subagent"` з ізольованих сесій або запустіть ACP spawn з неізольованої сесії.                                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для середовища виконання ACP запитано `sandbox="require"`.                                                                | Використайте `runtime="subagent"` для обов’язкової ізоляції або використайте ACP із `sandbox="inherit"` з неізольованої сесії.                                           |
| `Cannot apply --model ... did not advertise model support`                  | Цільовий harness не надає загального перемикання моделей ACP.                                                             | Використайте harness, який оголошує ACP `models`/`session/set_model`, використайте посилання на моделі Codex ACP або налаштуйте модель безпосередньо в harness, якщо він має власний прапорець запуску. |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані ACP сесії.                                                                                    | Створіть її заново через `/acp spawn`, потім повторно прив’яжіть/сфокусуйте потік.                                                                                       |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує записи/виконання в неінтерактивній ACP сесії.                                                     | Установіть `plugins.entries.acpx.config.permissionMode` на `approve-all` і перезапустіть gateway. Див. [Налаштування дозволів](/uk/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Запити дозволів заблоковано через `permissionMode`/`nonInteractivePermissions`.                                           | Перевірте журнали gateway на наявність `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для плавної деградації встановіть `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але ACP сесія не повідомила про завершення.                                                    | Відстежуйте через `ps aux \| grep acpx`; завершіть застарілі процеси вручну.                                                                                             |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Внутрішній конверт події просочився через межу ACP.                                                                       | Оновіть OpenClaw і повторно запустіть потік завершення; зовнішні harness мають отримувати лише звичайні запити завершення.                                               |

## Пов’язане

- [ACP агенти — налаштування](/uk/tools/acp-agents-setup)
- [Надсилання агенту](/uk/tools/agent-send)
- [CLI бекенди](/uk/gateway/cli-backends)
- [Codex harness](/uk/plugins/codex-harness)
- [Інструменти ізоляції для кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (режим bridge)](/uk/cli/acp)
- [Підагенти](/uk/tools/subagents)
