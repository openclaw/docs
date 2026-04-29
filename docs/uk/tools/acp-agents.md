---
read_when:
    - Запуск середовищ для кодування через ACP
    - Налаштування ACP-сеансів, прив’язаних до розмови, у каналах обміну повідомленнями
    - Прив’язування розмови в каналі повідомлень до постійного сеансу ACP
    - Усунення несправностей бекенда ACP, підключення плагіна або доставки завершення
    - Керування командами /acp з чату
sidebarTitle: ACP agents
summary: Запускайте зовнішні середовища для кодування (Claude Code, Cursor, Gemini CLI, явний Codex ACP, OpenClaw ACP, OpenCode) через бекенд ACP
title: Агенти ACP
x-i18n:
    generated_at: "2026-04-29T03:42:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[сеанси Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
дають OpenClaw змогу запускати зовнішні середовища кодування (наприклад Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI та інші
підтримувані середовища ACPX) через backend-плагін ACP.

Кожен запуск сеансу ACP відстежується як [фонове завдання](/uk/automation/tasks).

<Note>
**ACP — це шлях для зовнішніх середовищ, а не стандартний шлях Codex.**
Нативний app-server плагін Codex відповідає за елементи керування `/codex ...` і
вбудований runtime `agentRuntime.id: "codex"`; ACP відповідає за
елементи керування `/acp ...` і сеанси `sessions_spawn({ runtime: "acp" })`.

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP-клієнт
безпосередньо до наявних розмов каналів OpenClaw, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.
</Note>

## Яка сторінка мені потрібна?

| Ви хочете…                                                                                     | Використовуйте                        | Примітки                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати або керувати Codex у поточній розмові                                                | `/codex bind`, `/codex threads`       | Нативний app-server шлях Codex, коли плагін `codex` увімкнено; включає прив’язані відповіді в чаті, пересилання зображень, model/fast/permissions, stop і steer controls. ACP — явний fallback |
| Запустити Claude Code, Gemini CLI, явний Codex ACP або інше зовнішнє середовище _через_ OpenClaw | Ця сторінка                           | Сеанси, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, runtime controls                                                                            |
| Надати сеанс OpenClaw Gateway _як_ ACP-сервер для редактора або клієнта                         | [`openclaw acp`](/uk/cli/acp)            | Режим мосту. IDE/клієнт спілкується ACP з OpenClaw через stdio/WebSocket                                                                                                                     |
| Повторно використати локальний AI CLI як текстову fallback-модель                               | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Без інструментів OpenClaw, без елементів керування ACP, без runtime середовища                                                                                                      |

## Чи працює це одразу після встановлення?

Зазвичай так. Свіжі встановлення постачаються з увімкненим за замовчуванням
вбудованим runtime-плагіном `acpx` із закріпленим локальним для плагіна
бінарним файлом `acpx`, який OpenClaw перевіряє та самостійно відновлює під час запуску.
Запустіть `/acp doctor`, щоб перевірити готовність.

OpenClaw повідомляє агентам про запуск ACP лише тоді, коли ACP **справді
придатний до використання**: ACP має бути увімкнено, dispatch не має бути
вимкнено, поточний сеанс не має бути заблокований sandbox, а runtime backend має бути
завантажений. Якщо ці умови не виконано, Skills плагіна ACP і підказки ACP для
`sessions_spawn` залишаються прихованими, щоб агент не пропонував недоступний backend.

<AccordionGroup>
  <Accordion title="Типові проблеми першого запуску">
    - Якщо `plugins.allow` задано, це обмежувальний інвентар плагінів і він **має** включати `acpx`; інакше вбудований типовий варіант навмисно блокується, а `/acp doctor` повідомляє про відсутній запис allowlist.
    - Вбудований адаптер Codex ACP постачається разом із плагіном `acpx` і запускається локально, коли це можливо.
    - Інші адаптери цільових середовищ можуть усе ще завантажуватися на вимогу через `npx` під час першого використання.
    - Авторизація постачальника все одно має існувати на хості для цього середовища.
    - Якщо хост не має npm або доступу до мережі, перше завантаження адаптера завершується невдачею, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

  </Accordion>
  <Accordion title="Передумови runtime">
    ACP запускає реальний процес зовнішнього середовища. OpenClaw відповідає за маршрутизацію,
    стан фонових завдань, доставку, прив’язки та політику; середовище
    відповідає за свій provider login, model catalog, поведінку файлової системи та
    нативні інструменти.

    Перш ніж звинувачувати OpenClaw, перевірте:

    - `/acp doctor` повідомляє про увімкнений справний backend.
    - Цільовий id дозволено `acp.allowedAgents`, коли цей allowlist задано.
    - Команда середовища може запуститися на хості Gateway.
    - Авторизація постачальника наявна для цього середовища (`claude`, `codex`, `gemini`, `opencode`, `droid` тощо).
    - Вибрана модель існує для цього середовища — model ids не переносяться між середовищами.
    - Запитаний `cwd` існує й доступний, або пропустіть `cwd` і дозвольте backend використовувати типовий.
    - Режим дозволів відповідає роботі. Неінтерактивні сеанси не можуть натискати нативні запити дозволів, тому coding-запуски з великою кількістю запису/виконання зазвичай потребують профілю дозволів ACPX, який може працювати без участі користувача.

  </Accordion>
</AccordionGroup>

Інструменти плагінів OpenClaw і вбудовані інструменти OpenClaw **не** надаються
середовищам ACP за замовчуванням. Увімкніть явні MCP-мости в
[агентах ACP — налаштування](/uk/tools/acp-agents-setup) лише тоді, коли середовище
має викликати ці інструменти напряму.

## Підтримувані цільові середовища

З вбудованим backend `acpx` використовуйте ці harness ids як цілі `/acp spawn <id>`
або `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | Типовий backend                              | Примітки                                                                           |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | ACP-адаптер Claude Code                      | Потребує авторизації Claude Code на хості.                                         |
| `codex`    | ACP-адаптер Codex                            | Явний ACP fallback лише коли нативний `/codex` недоступний або запитано ACP.       |
| `copilot`  | ACP-адаптер GitHub Copilot                   | Потребує авторизації Copilot CLI/runtime.                                          |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)          | Перевизначте команду acpx, якщо локальне встановлення надає іншу ACP entrypoint.   |
| `droid`    | Factory Droid CLI                            | Потребує авторизації Factory/Droid або `FACTORY_API_KEY` в environment середовища. |
| `gemini`   | ACP-адаптер Gemini CLI                       | Потребує авторизації Gemini CLI або налаштування API key.                          |
| `iflow`    | iFlow CLI                                    | Доступність адаптера та керування моделлю залежать від установленого CLI.          |
| `kilocode` | Kilo Code CLI                                | Доступність адаптера та керування моделлю залежать від установленого CLI.          |
| `kimi`     | Kimi/Moonshot CLI                            | Потребує авторизації Kimi/Moonshot на хості.                                       |
| `kiro`     | Kiro CLI                                     | Доступність адаптера та керування моделлю залежать від установленого CLI.          |
| `opencode` | ACP-адаптер OpenCode                         | Потребує авторизації OpenCode CLI/provider.                                        |
| `openclaw` | Міст OpenClaw Gateway через `openclaw acp`   | Дає ACP-aware середовищу змогу звертатися назад до сеансу OpenClaw Gateway.        |
| `pi`       | Pi/вбудований runtime OpenClaw               | Використовується для експериментів із нативними для OpenClaw середовищами.         |
| `qwen`     | Qwen Code / Qwen CLI                         | Потребує Qwen-compatible авторизації на хості.                                     |

Користувацькі псевдоніми агентів acpx можна налаштувати в самому acpx, але політика OpenClaw
все одно перевіряє `acp.allowedAgents` і будь-яке зіставлення
`agents.list[].runtime.acp.agent` перед dispatch.

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
    - Spawn створює або відновлює runtime-сеанс ACP, записує metadata ACP у сховище сеансів OpenClaw і може створити фонове завдання, коли запуск належить parent.
    - ACP-сеанси, що належать parent, розглядаються як фонова робота навіть тоді, коли runtime-сеанс є persistent; завершення та доставка між поверхнями проходять через notifier parent task, а не поводяться як звичайний видимий користувачу chat session.
    - Обслуговування завдань закриває terminal або orphaned one-shot ACP-сеанси, що належать parent. Persistent ACP-сеанси зберігаються, доки залишається активна прив’язка розмови; застарілі persistent-сеанси без активної прив’язки закриваються, щоб їх не можна було непомітно відновити після завершення owning task або зникнення його task record.
    - Прив’язані follow-up повідомлення йдуть напряму до ACP-сеансу, доки прив’язку не закрито, не unfocused, не reset або не expired.
    - Команди Gateway залишаються локальними. `/acp ...`, `/status` і `/unfocus` ніколи не надсилаються як звичайний prompt text до прив’язаного ACP-середовища.
    - `cancel` перериває активний turn, коли backend підтримує cancellation; він не видаляє metadata прив’язки або сеансу.
    - `close` завершує ACP-сеанс з точки зору OpenClaw і видаляє прив’язку. Середовище все ще може зберігати власну upstream history, якщо підтримує resume.
    - Idle runtime workers підлягають очищенню після `acp.runtime.ttlMinutes`; збережена metadata сеансу залишається доступною для `/acp sessions`.

  </Accordion>
  <Accordion title="Правила маршрутизації нативного Codex">
    Тригери природною мовою, які мають маршрутизуватися до **нативного плагіна Codex**,
    коли його увімкнено:

    - "Прив’яжи цей канал Discord до Codex."
    - "Прикріпи цей чат до thread Codex `<id>`."
    - "Покажи threads Codex, а потім прив’яжи цей."

    Нативна прив’язка розмови Codex є типовим шляхом керування чатом.
    Динамічні інструменти OpenClaw все ще виконуються через OpenClaw, тоді як
    нативні інструменти Codex, як-от shell/apply-patch, виконуються всередині Codex.
    Для подій нативних інструментів Codex OpenClaw впроваджує native hook relay
    для кожного turn, щоб hooks плагінів могли блокувати `before_tool_call`, спостерігати
    `after_tool_call` і маршрутизувати події Codex `PermissionRequest`
    через approvals OpenClaw. Hooks Codex `Stop` ретранслюються до
    OpenClaw `before_agent_finalize`, де плагіни можуть запросити ще один
    model pass перед тим, як Codex finalize свою відповідь. Relay залишається
    навмисно консервативним: він не змінює arguments нативних інструментів Codex
    і не переписує thread records Codex. Використовуйте явний ACP лише
    тоді, коли вам потрібна модель runtime/session ACP. Межу вбудованої підтримки Codex
    задокументовано в
    [контракті підтримки середовища Codex v1](/uk/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Шпаргалка з вибору моделі / провайдера / runtime">
    - `openai-codex/*` — маршрут PI Codex OAuth/підписки.
    - `openai/*` плюс `agentRuntime.id: "codex"` — нативний вбудований runtime app-server Codex.
    - `/codex ...` — нативне керування розмовою Codex.
    - `/acp ...` або `runtime: "acp"` — явне керування ACP/acpx.

  </Accordion>
  <Accordion title="Тригери природною мовою для маршрутизації ACP">
    Тригери, які мають маршрутизуватися до ACP runtime:

    - "Запусти це як одноразову сесію Claude Code ACP і підсумуй результат."
    - "Використай Gemini CLI для цього завдання в треді, а потім тримай подальші відповіді в тому самому треді."
    - "Запусти Codex через ACP у фоновому треді."

    OpenClaw вибирає `runtime: "acp"`, визначає harness `agentId`,
    прив’язується до поточної розмови або треду, коли це підтримується, і
    маршрутизує подальші повідомлення до цієї сесії до закриття або завершення терміну дії. Codex
    іде цим шляхом лише коли ACP/acpx указано явно або нативний Codex
    plugin недоступний для запитаної операції.

    Для `sessions_spawn`, `runtime: "acp"` оголошується лише коли ACP
    увімкнено, запитувач не ізольований у sandbox, і runtime
    backend ACP завантажено. `acp.dispatch.enabled=false` призупиняє автоматичну
    диспетчеризацію ACP-тредів, але не приховує й не блокує явні
    виклики `sessions_spawn({ runtime: "acp" })`. Він націлюється на ACP harness id, як-от `codex`,
    `claude`, `droid`, `gemini` або `opencode`. Не передавайте звичайний
    id агента з конфігурації OpenClaw з `agents_list`, якщо цей запис не
    налаштований явно з `agents.list[].runtime.type="acp"`;
    інакше використовуйте стандартний runtime субагента. Коли агент OpenClaw
    налаштований з `runtime.type="acp"`, OpenClaw використовує
    `runtime.acp.agent` як базовий harness id.

  </Accordion>
</AccordionGroup>

## ACP проти субагентів

Використовуйте ACP, коли потрібен зовнішній harness runtime. Використовуйте **нативний Codex
app-server** для прив’язки/керування розмовами Codex, коли `codex`
plugin увімкнено. Використовуйте **субагентів**, коли потрібні нативні для OpenClaw
делеговані запуски.

| Область       | Сесія ACP                             | Запуск субагента                  |
| ------------- | ------------------------------------- | -------------------------------- |
| Runtime       | ACP backend plugin (наприклад acpx)   | Нативний runtime субагента OpenClaw |
| Ключ сесії    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>` |
| Основні команди | `/acp ...`                          | `/subagents ...`                 |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (стандартний runtime) |

Див. також [Субагенти](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування сесією ACP OpenClaw.
2. Вбудований runtime plugin `acpx`.
3. Адаптер Claude ACP.
4. Механізми runtime/сесії на боці Claude.

ACP Claude — це **harness-сесія** з елементами керування ACP, відновленням сесії,
відстеженням фонових завдань і необов’язковою прив’язкою до розмови/треду.

CLI backend-и — це окремі текстові локальні fallback runtime-и; див.
[CLI Backend-и](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- **Потрібні `/acp spawn`, прив’язувані сесії, елементи керування runtime або тривала робота harness?** Використовуйте ACP.
- **Потрібен простий локальний текстовий fallback через сирий CLI?** Використовуйте CLI backend-и.

## Прив’язані сесії

### Ментальна модель

- **Поверхня чату** — місце, де люди продовжують спілкуватися (канал Discord, тема Telegram, чат iMessage).
- **Сесія ACP** — стійкий стан runtime Codex/Claude/Gemini, до якого OpenClaw маршрутизує повідомлення.
- **Дочірній тред/тема** — необов’язкова додаткова поверхня повідомлень, створена лише через `--thread ...`.
- **Робочий простір runtime** — розташування у файловій системі (`cwd`, checkout репозиторію, робочий простір backend), де виконується harness. Не залежить від поверхні чату.

### Прив’язки до поточної розмови

`/acp spawn <harness> --bind here` закріплює поточну розмову за
створеною сесією ACP — без дочірнього треду, на тій самій поверхні чату. OpenClaw продовжує
керувати транспортом, auth, безпекою та доставкою. Подальші повідомлення в цій
розмові маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають
сесію на місці; `/acp close` видаляє прив’язку.

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
  <Accordion title="Правила прив’язки та взаємовиключність">
    - `--bind here` і `--thread ...` є взаємовиключними.
    - `--bind here` працює лише на каналах, які оголошують прив’язку до поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язки зберігаються після перезапусків gateway.
    - У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній тред для `--thread auto|here`, а не для `--bind here`.
    - Якщо ви створюєте сесію для іншого ACP-агента без `--cwd`, OpenClaw за замовчуванням успадковує робочий простір **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) fallback-яться до стандартного backend; інші помилки доступу (наприклад, `EACCES`) відображаються як помилки створення.
    - Команди керування Gateway лишаються локальними у прив’язаних розмовах — команди `/acp ...` обробляються OpenClaw навіть коли звичайний текст подальших повідомлень маршрутизується до прив’язаної сесії ACP; `/status` і `/unfocus` також лишаються локальними, коли обробку команд увімкнено для цієї поверхні.

  </Accordion>
  <Accordion title="Сесії, прив’язані до треду">
    Коли прив’язки тредів увімкнені для адаптера каналу:

    - OpenClaw прив’язує тред до цільової сесії ACP.
    - Подальші повідомлення в цьому треді маршрутизуються до прив’язаної сесії ACP.
    - Вивід ACP доставляється назад у той самий тред.
    - Unfocus/close/archive/idle-timeout або завершення max-age видаляє прив’язку.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` і `/unfocus` — це команди Gateway, а не prompts для ACP harness.

    Обов’язкові feature flags для ACP, прив’язаного до треду:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` увімкнено за замовчуванням (задайте `false`, щоб призупинити автоматичну диспетчеризацію ACP-тредів; явні виклики `sessions_spawn({ runtime: "acp" })` і далі працюють).
    - Увімкнений прапорець створення ACP-тредів в адаптері каналу (залежить від адаптера):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Підтримка прив’язки тредів залежить від адаптера. Якщо активний адаптер
    каналу не підтримує прив’язки тредів, OpenClaw повертає чітке
    повідомлення про непідтримуваність/недоступність.

  </Accordion>
  <Accordion title="Канали з підтримкою тредів">
    - Будь-який адаптер каналу, який надає capability прив’язки сесії/треду.
    - Поточна вбудована підтримка: треди/канали **Discord**, теми **Telegram** (форумні теми в групах/супергрупах і теми DM).
    - Канали Plugin можуть додавати підтримку через той самий інтерфейс прив’язки.

  </Accordion>
</AccordionGroup>

## Стійкі прив’язки каналів

Для неефемерних workflow налаштовуйте стійкі прив’язки ACP у
записах верхнього рівня `bindings[]`.

### Модель прив’язки

<ParamField path="bindings[].type" type='"acp"'>
  Позначає стійку прив’язку розмови ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Визначає цільову розмову. Форми для окремих каналів:

- **Канал/тред Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Форумна тема Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
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

### Стандартні значення runtime для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити стандартні значення ACP для агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Пріоритет перевизначення для прив’язаних сесій ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Глобальні стандартні значення ACP (наприклад, `acp.backend`)

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

- OpenClaw гарантує, що налаштована сесія ACP існує перед використанням.
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованої сесії ACP.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ сесії ACP на місці.
- Тимчасові прив’язки runtime (наприклад, створені flow фокусування треду) і далі застосовуються там, де наявні.
- Для міжагентних створень ACP без явного `cwd` OpenClaw успадковує робочий простір цільового агента з конфігурації агента.
- Відсутні успадковані шляхи робочого простору fallback-яться до стандартного cwd backend; невідсутні помилки доступу відображаються як помилки створення.

## Запуск сесій ACP

Два способи запустити сесію ACP:

<Tabs>
  <Tab title="З sessions_spawn">
    Використовуйте `runtime: "acp"`, щоб запустити сесію ACP з ходу агента або
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
    `runtime` за замовчуванням має значення `subagent`, тому задавайте `runtime: "acp"` явно
    для сеансів ACP. Якщо `agentId` пропущено, OpenClaw використовує
    `acp.defaultAgent`, коли його налаштовано. `mode: "session"` вимагає
    `thread: true`, щоб зберігати постійну прив’язану розмову.
    </Note>

  </Tab>
  <Tab title="З команди /acp">
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

    Див. [Slash commands](/uk/tools/slash-commands).

  </Tab>
</Tabs>

### Параметри `sessions_spawn`

<ParamField path="task" type="string" required>
  Початковий запит, надісланий до сеансу ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Має бути `"acp"` для сеансів ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Ідентифікатор цільового середовища ACP. Повертається до `acp.defaultAgent`, якщо його задано.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Запитати потік прив’язки розмови там, де це підтримується.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` є одноразовим; `"session"` є постійним. Якщо `thread: true` і
  `mode` пропущено, OpenClaw може за замовчуванням використовувати постійну поведінку відповідно до
  шляху runtime. `mode: "session"` вимагає `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Запитаний робочий каталог runtime (перевіряється політикою backend/runtime).
  Якщо пропущено, запуск ACP успадковує робочий простір цільового агента,
  коли його налаштовано; відсутні успадковані шляхи повертаються до стандартних
  значень backend, а реальні помилки доступу повертаються.
</ParamField>
<ParamField path="label" type="string">
  Видима оператору мітка, що використовується в тексті сеансу/банера.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Відновити наявний сеанс ACP замість створення нового. Агент
  повторно відтворює історію розмови через `session/load`. Вимагає
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` транслює початкові зведення прогресу запуску ACP назад до
  сеансу-запитувача як системні події. Прийняті відповіді містять
  `streamLogPath`, що вказує на журнал JSONL у межах сеансу
  (`<sessionId>.acp-stream.jsonl`), який можна відстежувати для повної історії ретрансляції.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Перериває дочірній хід ACP після N секунд. `0` залишає хід на шляху
  Gateway без тайм-ауту. Те саме значення застосовується до запуску Gateway
  і runtime ACP, щоб завислі або вичерпані за квотою середовища не
  займали лінію батьківського агента безстроково.
</ParamField>
<ParamField path="model" type="string">
  Явне перевизначення моделі для дочірнього сеансу ACP. Запуски Codex ACP
  нормалізують посилання Codex OpenClaw, як-от `openai-codex/gpt-5.4`, у конфігурацію
  запуску Codex ACP перед `session/new`; форми slash, як-от
  `openai-codex/gpt-5.4/high`, також задають зусилля міркування Codex ACP.
  Інші середовища мають оголошувати ACP `models` і підтримувати
  `session/set_model`; інакше OpenClaw/acpx завершується з чіткою помилкою замість
  тихого повернення до стандартного агента цілі.
</ParamField>
<ParamField path="thinking" type="string">
  Явне зусилля мислення/міркування. Для Codex ACP `minimal` відповідає
  низькому зусиллю, `low`/`medium`/`high`/`xhigh` відображаються напряму, а `off`
  пропускає перевизначення зусилля міркування під час запуску.
</ParamField>

## Режими прив’язки та потоку запуску

<Tabs>
  <Tab title="--bind here|off">
    | Режим | Поведінка                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Прив’язати поточну активну розмову на місці; завершитися з помилкою, якщо активної немає. |
    | `off`  | Не створювати прив’язку поточної розмови.                              |

    Примітки:

    - `--bind here` — найпростіший операторський шлях для "зробити цей канал або чат підтримуваним Codex."
    - `--bind here` не створює дочірній потік.
    - `--bind here` доступний лише в каналах, які надають підтримку прив’язки поточної розмови.
    - `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Режим | Поведінка                                                                                         |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | В активному потоці: прив’язати цей потік. Поза потоком: створити/прив’язати дочірній потік, якщо підтримується. |
    | `here` | Вимагати поточний активний потік; завершитися з помилкою, якщо ви не в ньому.                    |
    | `off`  | Без прив’язки. Сеанс запускається неприв’язаним.                                                  |

    Примітки:

    - На поверхнях без прив’язки потоків стандартна поведінка фактично є `off`.
    - Запуск із прив’язкою до потоку вимагає підтримки політики каналу:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Використовуйте `--bind here`, коли потрібно закріпити поточну розмову без створення дочірнього потоку.

  </Tab>
</Tabs>

## Модель доставки

Сеанси ACP можуть бути або інтерактивними робочими просторами, або фоновою
роботою, що належить батьківському сеансу. Шлях доставки залежить від цієї форми.

<AccordionGroup>
  <Accordion title="Інтерактивні сеанси ACP">
    Інтерактивні сеанси призначені для продовження спілкування на видимій
    чат-поверхні:

    - `/acp spawn ... --bind here` прив’язує поточну розмову до сеансу ACP.
    - `/acp spawn ... --thread ...` прив’язує потік/тему каналу до сеансу ACP.
    - Постійно налаштовані `bindings[].type="acp"` спрямовують відповідні розмови до того самого сеансу ACP.

    Подальші повідомлення в прив’язаній розмові спрямовуються безпосередньо до
    сеансу ACP, а вивід ACP доставляється назад у той самий
    канал/потік/тему.

    Що OpenClaw надсилає до середовища:

    - Звичайні прив’язані подальші повідомлення надсилаються як текст запиту, плюс вкладення лише тоді, коли середовище/backend їх підтримує.
    - Команди керування `/acp` і локальні команди Gateway перехоплюються перед відправленням ACP.
    - Події завершення, згенеровані runtime, матеріалізуються для кожної цілі. Агенти OpenClaw отримують внутрішній конверт runtime-context OpenClaw; зовнішні середовища ACP отримують звичайний запит із результатом дочірнього сеансу та інструкцією. Необроблений конверт `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ніколи не має надсилатися до зовнішніх середовищ або зберігатися як текст транскрипту користувача ACP.
    - Записи транскрипту ACP використовують видимий користувачу текст тригера або звичайний запит завершення. Внутрішні метадані подій залишаються структурованими в OpenClaw там, де це можливо, і не розглядаються як створений користувачем вміст чату.

  </Accordion>
  <Accordion title="Одноразові сеанси ACP, що належать батьківському сеансу">
    Одноразові сеанси ACP, запущені іншим агентом, виконуються як фонові
    дочірні сеанси, подібно до субагентів:

    - Батьківський сеанс запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Дочірній сеанс виконується у власному сеансі середовища ACP.
    - Дочірні ходи виконуються на тій самій фоновій лінії, що й власні запуски субагентів, тому повільне середовище ACP не блокує непов’язану роботу головного сеансу.
    - Завершення повідомляється назад через шлях оголошення завершення завдання. OpenClaw перетворює внутрішні метадані завершення на звичайний запит ACP перед надсиланням до зовнішнього середовища, тому середовища не бачать маркери контексту runtime, специфічні для OpenClaw.
    - Батьківський сеанс переписує результат дочірнього сеансу звичайним голосом асистента, коли корисна відповідь для користувача.

    **Не** розглядайте цей шлях як peer-to-peer чат між батьківським і
    дочірнім сеансами. Дочірній сеанс уже має канал завершення назад до
    батьківського.

  </Accordion>
  <Accordion title="sessions_send і доставка A2A">
    `sessions_send` може націлюватися на інший сеанс після запуску. Для звичайних
    peer-сеансів OpenClaw використовує шлях подальших повідомлень agent-to-agent (A2A)
    після вставлення повідомлення:

    - Дочекатися відповіді цільового сеансу.
    - За потреби дозволити запитувачу й цілі обмінятися обмеженою кількістю подальших ходів.
    - Попросити ціль створити повідомлення оголошення.
    - Доставити це оголошення у видимий канал або потік.

    Цей шлях A2A є fallback для peer-надсилань, де відправнику потрібне
    видиме подальше повідомлення. Він залишається ввімкненим, коли непов’язаний сеанс може
    бачити й надсилати повідомлення цілі ACP, наприклад за широких
    налаштувань `tools.sessions.visibility`.

    OpenClaw пропускає подальше повідомлення A2A лише тоді, коли запитувач є
    батьківським сеансом власного одноразового дочірнього сеансу ACP, що належить батьківському сеансу.
    У такому разі запуск A2A поверх завершення завдання може пробудити батьківський сеанс
    результатом дочірнього, переслати відповідь батьківського сеансу назад у дочірній
    і створити цикл відлуння батько/дитина. Результат `sessions_send` повідомляє
    `delivery.status="skipped"` для цього випадку власного дочірнього сеансу, оскільки
    шлях завершення вже відповідає за результат.

  </Accordion>
  <Accordion title="Відновлення наявного сеансу">
    Використовуйте `resumeSessionId`, щоб продовжити попередній сеанс ACP замість
    початку з нуля. Агент повторно відтворює історію розмови через
    `session/load`, тому продовжує з повним контекстом того, що було раніше.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Типові випадки використання:

    - Передайте сеанс Codex зі свого ноутбука на телефон — скажіть агенту продовжити з місця, де ви зупинилися.
    - Продовжте сеанс кодування, який ви почали інтерактивно в CLI, тепер у headless-режимі через свого агента.
    - Продовжте роботу, перервану перезапуском Gateway або тайм-аутом бездіяльності.

    Примітки:

    - `resumeSessionId` застосовується лише коли `runtime: "acp"`; стандартний runtime субагента ігнорує це поле, специфічне для ACP.
    - `streamTo` застосовується лише коли `runtime: "acp"`; стандартний runtime субагента ігнорує це поле, специфічне для ACP.
    - `resumeSessionId` є локальним для хоста ідентифікатором відновлення ACP/середовища, а не ключем сеансу каналу OpenClaw; OpenClaw усе одно перевіряє політику запуску ACP і політику цільового агента перед відправленням, тоді як backend або середовище ACP відповідає за авторизацію завантаження цього upstream-ідентифікатора.
    - `resumeSessionId` відновлює upstream-історію розмови ACP; `thread` і `mode` усе ще застосовуються звичайно до нового сеансу OpenClaw, який ви створюєте, тому `mode: "session"` усе ще вимагає `thread: true`.
    - Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
    - Якщо ідентифікатор сеансу не знайдено, запуск завершується з чіткою помилкою — без тихого fallback до нового сеансу.

  </Accordion>
  <Accordion title="Smoke-тест після розгортання">
    Після розгортання Gateway виконайте live end-to-end перевірку, а не
    покладайтеся на модульні тести:

    1. Перевірте версію розгорнутого Gateway і commit на цільовому хості.
    2. Відкрийте тимчасовий сеанс мосту ACPX до live-агента.
    3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Перевірте `accepted=yes`, справжній `childSessionKey` і відсутність помилки валідатора.
    5. Очистьте тимчасовий сеанс мосту.

    Тримайте gate на `mode: "run"` і пропустіть `streamTo: "parent"` —
    прив’язаний до потоку `mode: "session"` і шляхи ретрансляції stream є окремими
    багатшими інтеграційними проходами.

  </Accordion>
</AccordionGroup>

## Сумісність із sandbox

Сеанси ACP наразі виконуються в runtime хоста, **не** всередині
sandbox OpenClaw.

<Warning>
**Межа безпеки:**

- Зовнішня обв'язка може читати/писати відповідно до власних дозволів CLI і вибраного `cwd`.
- Політика ізоляції OpenClaw **не** обгортає виконання обв'язки ACP.
- OpenClaw усе одно застосовує функціональні обмеження ACP, дозволених агентів, володіння сеансом, прив'язки каналів і політику доставлення Gateway.
- Використовуйте `runtime: "subagent"` для роботи, нативної для OpenClaw, із примусовою ізоляцією.

</Warning>

Поточні обмеження:

- Якщо сеанс запитувача ізольований, створення ACP блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.

## Визначення цільового сеансу

Більшість дій `/acp` приймають необов'язкову ціль сеансу (`session-key`,
`session-id` або `session-label`).

**Порядок визначення:**

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - пробує ключ
   - потім UUID-подібний ідентифікатор сеансу
   - потім мітку
2. Поточна прив'язка гілки (якщо ця розмова/гілка прив'язана до сеансу ACP).
3. Резервний варіант поточного сеансу запитувача.

Прив'язки поточної розмови й прив'язки гілки обидві беруть участь у
кроці 2.

Якщо ціль не визначено, OpenClaw повертає зрозумілу помилку
(`Unable to resolve session target: ...`).

## Елементи керування ACP

| Команда              | Що робить                                                | Приклад                                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створює сеанс ACP; необов'язкова поточна прив'язка або прив'язка гілки. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує поточний хід для цільового сеансу.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає керівну інструкцію до запущеного сеансу.        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сеанс і відв'язує цілі гілки.                   | `/acp close`                                                  |
| `/acp status`        | Показує бекенд, режим, стан, параметри runtime, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Задає режим runtime для цільового сеансу.                | `/acp set-mode plan`                                          |
| `/acp set`           | Записує універсальний параметр конфігурації runtime.     | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Задає перевизначення робочого каталогу runtime.          | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Задає профіль політики схвалення.                        | `/acp permissions strict`                                     |
| `/acp timeout`       | Задає тайм-аут runtime (секунди).                        | `/acp timeout 120`                                            |
| `/acp model`         | Задає перевизначення моделі runtime.                     | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів runtime для сеансу.    | `/acp reset-options`                                          |
| `/acp sessions`      | Показує нещодавні сеанси ACP зі сховища.                 | `/acp sessions`                                               |
| `/acp doctor`        | Стан бекенду, можливості, практичні виправлення.         | `/acp doctor`                                                 |
| `/acp install`       | Друкує детерміновані кроки встановлення й увімкнення.    | `/acp install`                                                |

`/acp status` показує ефективні параметри runtime, а також ідентифікатори
сеансу рівня runtime і рівня бекенду. Помилки непідтримуваних елементів
керування відображаються зрозуміло, коли бекенд не має відповідної
можливості. `/acp sessions` читає сховище для поточного прив'язаного
сеансу або сеансу запитувача; цільові токени (`session-key`, `session-id`
або `session-label`) визначаються через виявлення сеансів gateway,
включно з власними для агента коренями `session.store`.

### Відповідність параметрів runtime

`/acp` має зручні команди й універсальний setter. Еквівалентні операції:

| Команда                      | Відповідає                            | Примітки                                                                                                                                                                          |
| ---------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ключ конфігурації runtime `model`     | Для Codex ACP OpenClaw нормалізує `openai-codex/<model>` до ідентифікатора моделі адаптера й зіставляє суфікси reasoning через скісну риску, як-от `openai-codex/gpt-5.4/high`, з `reasoning_effort`. |
| `/acp set thinking <level>`  | ключ конфігурації runtime `thinking`  | Для Codex ACP OpenClaw надсилає відповідний `reasoning_effort`, якщо адаптер його підтримує.                                                                                      |
| `/acp permissions <profile>` | ключ конфігурації runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | ключ конфігурації runtime `timeout`   | —                                                                                                                                                                                |
| `/acp cwd <path>`            | перевизначення cwd runtime            | Пряме оновлення.                                                                                                                                                                 |
| `/acp set <key> <value>`     | універсальне                          | `key=cwd` використовує шлях перевизначення cwd.                                                                                                                                   |
| `/acp reset-options`         | очищає всі перевизначення runtime     | —                                                                                                                                                                                |

## Обв'язка acpx, налаштування Plugin і дозволи

Конфігурацію обв'язки acpx (псевдоніми Claude Code / Codex / Gemini CLI),
MCP-мости plugin-tools і OpenClaw-tools, а також режими дозволів ACP див.
у розділі
[Агенти ACP — налаштування](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Симптом | Імовірна причина | Виправлення |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | Бекенд-Plugin відсутній, вимкнений або заблокований `plugins.allow`. | Установіть і ввімкніть бекенд-Plugin, додайте `acpx` до `plugins.allow`, коли задано цей список дозволів, потім запустіть `/acp doctor`. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP глобально вимкнено. | Установіть `acp.enabled=true`. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Автоматичну диспетчеризацію зі звичайних повідомлень потоку вимкнено. | Установіть `acp.dispatch.enabled=true`, щоб відновити автоматичну маршрутизацію потоків; явні виклики `sessions_spawn({ runtime: "acp" })` і надалі працюють. |
| `ACP agent "<id>" is not allowed by policy` | Агента немає у списку дозволів. | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`. |
| `/acp doctor` reports backend not ready right after startup | Перевірка залежностей Plugin або самовідновлення ще триває. | Зачекайте трохи й повторно запустіть `/acp doctor`; якщо стан лишається несправним, перевірте помилку встановлення бекенда та політику дозволу/заборони Plugin. |
| Harness command not found | CLI адаптера не встановлено, залежності підготовленого Plugin відсутні або перше отримання через `npx` не вдалося для адаптера, відмінного від Codex. | Запустіть `/acp doctor`, відновіть залежності Plugin, установіть/прогрійте адаптер на хості Gateway або явно налаштуйте команду агента acpx. |
| Model-not-found from the harness | Ідентифікатор моделі дійсний для іншого провайдера/обв’язки, але не для цієї цілі ACP. | Використайте модель зі списку цієї обв’язки, налаштуйте модель в обв’язці або пропустіть перевизначення. |
| Vendor auth error from the harness | OpenClaw справний, але цільовий CLI/провайдер не ввійшов у систему. | Увійдіть або надайте потрібний ключ провайдера в середовищі хоста Gateway. |
| `Unable to resolve session target: ...` | Неправильний токен ключа/ідентифікатора/мітки. | Запустіть `/acp sessions`, скопіюйте точний ключ/мітку й повторіть спробу. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної прив’язуваної розмови. | Перейдіть до цільового чату/каналу й повторіть спробу або використайте запуск без прив’язки. |
| `Conversation bindings are unavailable for <channel>.` | Адаптер не має можливості ACP-прив’язки до поточної розмови. | Використайте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте верхньорівневі `bindings[]` або перейдіть до підтримуваного каналу. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` використано поза контекстом потоку. | Перейдіть до цільового потоку або використайте `--thread auto`/`off`. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Інший користувач володіє активною ціллю прив’язки. | Повторно прив’яжіть як власник або використайте іншу розмову чи потік. |
| `Thread bindings are unavailable for <channel>.` | Адаптер не має можливості прив’язки потоків. | Використайте `--thread off` або перейдіть до підтримуваного адаптера/каналу. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | Середовище виконання ACP працює на боці хоста; сеанс запитувача ізольований. | Використайте `runtime="subagent"` з ізольованих сеансів або запустіть ACP spawn із неізольованого сеансу. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | `sandbox="require"` запитано для середовища виконання ACP. | Використайте `runtime="subagent"` для обов’язкової ізоляції або ACP з `sandbox="inherit"` із неізольованого сеансу. |
| `Cannot apply --model ... did not advertise model support` | Цільова обв’язка не надає загального перемикання моделей ACP. | Використайте обв’язку, яка оголошує ACP `models`/`session/set_model`, використайте посилання моделей Codex ACP або налаштуйте модель безпосередньо в обв’язці, якщо вона має власний прапорець запуску. |
| Missing ACP metadata for bound session | Застарілі/видалені метадані сеансу ACP. | Створіть повторно за допомогою `/acp spawn`, потім повторно прив’яжіть/сфокусуйте потік. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` блокує записи/виконання в неінтерактивному сеансі ACP. | Установіть `plugins.entries.acpx.config.permissionMode` на `approve-all` і перезапустіть gateway. Див. [Налаштування дозволів](/uk/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output | Запити дозволів заблоковані `permissionMode`/`nonInteractivePermissions`. | Перевірте журнали gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для м’якої деградації встановіть `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work | Процес обв’язки завершився, але сеанс ACP не повідомив про завершення. | Відстежуйте через `ps aux \| grep acpx`; завершуйте застарілі процеси вручну. |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | Внутрішня оболонка подій просочилася через межу ACP. | Оновіть OpenClaw і повторно запустіть потік завершення; зовнішні обв’язки мають отримувати лише звичайні підказки завершення. |

## Пов’язане

- [Агенти ACP — налаштування](/uk/tools/acp-agents-setup)
- [Надсилання агенту](/uk/tools/agent-send)
- [CLI бекенди](/uk/gateway/cli-backends)
- [Обв’язка Codex](/uk/plugins/codex-harness)
- [Інструменти ізоляції кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (режим моста)](/uk/cli/acp)
- [Субагенти](/uk/tools/subagents)
