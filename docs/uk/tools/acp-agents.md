---
read_when:
    - Запуск середовищ кодування через ACP
    - Налаштування сеансів ACP, прив’язаних до розмов, у каналах обміну повідомленнями
    - Прив’язування розмови каналу повідомлень до постійного сеансу ACP
    - Усунення проблем із бекендом ACP, підключенням Plugin або доставленням завершень
    - Керування командами /acp із чату
sidebarTitle: ACP agents
summary: Запускайте зовнішні середовища кодування (Claude Code, Cursor, Gemini CLI, явний Codex ACP, OpenClaw ACP, OpenCode) через ACP-бекенд
title: Агенти ACP
x-i18n:
    generated_at: "2026-05-06T02:40:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
дозволяють OpenClaw запускати зовнішні середовища для кодування (наприклад Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI та інші
підтримувані ACPX-середовища) через ACP backend plugin.

Кожен запуск ACP-сесії відстежується як [фонове завдання](/uk/automation/tasks).

<Note>
**ACP — це шлях для зовнішніх середовищ, а не стандартний шлях Codex.** Власний
plugin сервера застосунку Codex відповідає за керування `/codex ...` і
вбудований runtime `agentRuntime.id: "codex"`; ACP відповідає за
керування `/acp ...` і сесії `sessions_spawn({ runtime: "acp" })`.

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP-клієнт
безпосередньо до наявних розмов каналів OpenClaw, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.
</Note>

## Яка сторінка мені потрібна?

| Ви хочете…                                                                                      | Використовуйте                       | Нотатки                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати або керувати Codex у поточній розмові                                                | `/codex bind`, `/codex threads`      | Власний шлях сервера застосунку Codex, коли plugin `codex` увімкнено; охоплює прив’язані відповіді чату, пересилання зображень, модель/швидкий режим/дозволи, зупинку та керування напрямом. ACP — явний fallback |
| Запустити Claude Code, Gemini CLI, явний Codex ACP або інше зовнішнє середовище _через_ OpenClaw | Ця сторінка                          | Сесії, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, керування runtime                                                                                   |
| Надати сесію OpenClaw Gateway _як_ ACP-сервер для редактора або клієнта                         | [`openclaw acp`](/uk/cli/acp)           | Режим моста. IDE/клієнт спілкується ACP з OpenClaw через stdio/WebSocket                                                                                                                            |
| Повторно використати локальний AI CLI як текстову fallback-модель                               | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Без інструментів OpenClaw, без керування ACP, без runtime середовища                                                                                                                         |

## Чи працює це одразу після встановлення?

Так, після встановлення офіційного ACP runtime plugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Вихідні checkout-и можуть використовувати локальний workspace plugin `extensions/acpx` після
`pnpm install`. Запустіть `/acp doctor` для перевірки готовності.

OpenClaw повідомляє агентам про запуск ACP лише тоді, коли ACP **справді
придатний до використання**: ACP має бути увімкнено, dispatch не має бути вимкнено, поточна
сесія не має бути заблокована sandbox-ом, і має бути
завантажений runtime backend. Якщо ці умови не виконано, ACP plugin skills і
підказки ACP для `sessions_spawn` залишаються прихованими, щоб агент не пропонував
недоступний backend.

<AccordionGroup>
  <Accordion title="Пастки першого запуску">
    - Якщо задано `plugins.allow`, це обмежувальний інвентар plugin-ів і він **обов’язково** має містити `acpx`; інакше встановлений ACP backend навмисно блокується, а `/acp doctor` повідомляє про відсутній запис у allowlist.
    - Адаптер Codex ACP постачається з plugin-ом `acpx` і за можливості запускається локально.
    - Інші адаптери цільових середовищ усе ще можуть завантажуватися на вимогу через `npx` під час першого використання.
    - Автентифікація постачальника все одно має існувати на хості для цього середовища.
    - Якщо на хості немає npm або доступу до мережі, завантаження адаптера під час першого запуску завершується помилкою, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

  </Accordion>
  <Accordion title="Передумови runtime">
    ACP запускає справжній процес зовнішнього середовища. OpenClaw відповідає за маршрутизацію,
    стан фонових завдань, доставку, прив’язки та політику; середовище
    відповідає за свій provider login, каталог моделей, поведінку файлової системи та
    власні інструменти.

    Перш ніж звинувачувати OpenClaw, перевірте:

    - `/acp doctor` повідомляє про увімкнений і справний backend.
    - Цільовий id дозволено `acp.allowedAgents`, коли цей allowlist задано.
    - Команда середовища може запускатися на хості Gateway.
    - Автентифікація постачальника наявна для цього середовища (`claude`, `codex`, `gemini`, `opencode`, `droid` тощо).
    - Вибрана модель існує для цього середовища - id моделей не переносяться між середовищами.
    - Запитаний `cwd` існує та доступний, або пропустіть `cwd` і дозвольте backend-у використати стандартний варіант.
    - Режим дозволів відповідає роботі. Неінтерактивні сесії не можуть натискати нативні запити дозволів, тому запуски кодування з великою кількістю запису/виконання зазвичай потребують профілю дозволів ACPX, який може працювати без участі користувача.

  </Accordion>
</AccordionGroup>

Інструменти plugin-ів OpenClaw і вбудовані інструменти OpenClaw **не** надаються
ACP-середовищам за замовчуванням. Увімкніть явні MCP-мости в
[Налаштування ACP-агентів](/uk/tools/acp-agents-setup) лише тоді, коли середовище
має викликати ці інструменти напряму.

## Підтримувані цільові середовища

З backend-ом `acpx` використовуйте ці id середовищ як цілі `/acp spawn <id>`
або `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id середовища | Типовий backend                              | Нотатки                                                                              |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `claude`      | Адаптер Claude Code ACP                      | Потребує автентифікації Claude Code на хості.                                        |
| `codex`       | Адаптер Codex ACP                            | Лише явний ACP fallback, коли власний `/codex` недоступний або запитано ACP.         |
| `copilot`     | Адаптер GitHub Copilot ACP                   | Потребує автентифікації Copilot CLI/runtime.                                         |
| `cursor`      | Cursor CLI ACP (`cursor-agent acp`)          | Перевизначте команду acpx, якщо локальне встановлення надає іншу ACP entrypoint.     |
| `droid`       | Factory Droid CLI                            | Потребує автентифікації Factory/Droid або `FACTORY_API_KEY` в оточенні середовища.   |
| `gemini`      | Адаптер Gemini CLI ACP                       | Потребує автентифікації Gemini CLI або налаштування API key.                         |
| `iflow`       | iFlow CLI                                    | Доступність адаптера та керування моделлю залежать від установленого CLI.            |
| `kilocode`    | Kilo Code CLI                                | Доступність адаптера та керування моделлю залежать від установленого CLI.            |
| `kimi`        | Kimi/Moonshot CLI                            | Потребує автентифікації Kimi/Moonshot на хості.                                      |
| `kiro`        | Kiro CLI                                     | Доступність адаптера та керування моделлю залежать від установленого CLI.            |
| `opencode`    | Адаптер OpenCode ACP                         | Потребує автентифікації OpenCode CLI/provider.                                       |
| `openclaw`    | Міст OpenClaw Gateway через `openclaw acp`   | Дає ACP-сумісному середовищу змогу звертатися назад до сесії OpenClaw Gateway.       |
| `pi`          | Pi/вбудований runtime OpenClaw               | Використовується для експериментів із OpenClaw-native середовищами.                  |
| `qwen`        | Qwen Code / Qwen CLI                         | Потребує Qwen-сумісної автентифікації на хості.                                      |

Власні псевдоніми агентів acpx можна налаштувати в самому acpx, але політика OpenClaw
усе одно перевіряє `acp.allowedAgents` і будь-яке зіставлення
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
    Продовжуйте в прив’язаній розмові або треді (або явно вкажіть
    ключ сесії).
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
    `/acp cancel` (поточний хід) або `/acp close` (сесія + прив’язки).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Деталі життєвого циклу">
    - Запуск створює або відновлює ACP runtime session, записує ACP metadata у сховище сесій OpenClaw і може створити фонове завдання, коли запуск належить батьківському об’єкту.
    - ACP-сесії, що належать батьківському об’єкту, розглядаються як фонова робота навіть тоді, коли runtime session є persistent; завершення та доставка між поверхнями проходять через notifier батьківського завдання, а не поводяться як звичайна користувацька chat session.
    - Обслуговування завдань закриває terminal або orphaned одноразові ACP-сесії, що належать батьківському об’єкту. Persistent ACP-сесії зберігаються, доки лишається активна прив’язка розмови; застарілі persistent-сесії без активної прив’язки закриваються, щоб їх не можна було непомітно відновити після завершення завдання-власника або зникнення його запису завдання.
    - Прив’язані follow-up повідомлення надходять безпосередньо до ACP-сесії, доки прив’язку не буде закрито, знято з фокуса, скинуто або доки її строк дії не завершиться.
    - Команди Gateway залишаються локальними. `/acp ...`, `/status` і `/unfocus` ніколи не надсилаються як звичайний текст prompt-а до прив’язаного ACP-середовища.
    - `cancel` перериває активний хід, коли backend підтримує cancellation; це не видаляє прив’язку або metadata сесії.
    - `close` завершує ACP-сесію з погляду OpenClaw і видаляє прив’язку. Середовище все ще може зберігати власну upstream-історію, якщо підтримує resume.
    - Неактивні runtime workers можуть очищатися після `acp.runtime.ttlMinutes`; збережена metadata сесії лишається доступною для `/acp sessions`.

  </Accordion>
  <Accordion title="Правила власної маршрутизації Codex">
    Тригери природною мовою, які мають маршрутизуватися до **власного plugin-а Codex**,
    коли його увімкнено:

    - "Прив’яжи цей канал Discord до Codex."
    - "Підключи цей чат до треду Codex `<id>`."
    - "Покажи треди Codex, потім прив’яжи цей."

    Власна прив’язка розмов Codex є стандартним шляхом керування чатом.
    Динамічні інструменти OpenClaw і далі виконуються через OpenClaw, тоді як
    Codex-native інструменти, як-от shell/apply-patch, виконуються всередині Codex.
    Для подій Codex-native інструментів OpenClaw впроваджує per-turn native
    hook relay, щоб plugin hooks могли блокувати `before_tool_call`, спостерігати за
    `after_tool_call` і маршрутизувати події Codex `PermissionRequest`
    через approvals OpenClaw. Хуки Codex `Stop` ретранслюються до
    OpenClaw `before_agent_finalize`, де plugin-и можуть попросити ще один
    model pass перед тим, як Codex фіналізує свою відповідь. Relay залишається
    навмисно консервативним: він не змінює аргументи Codex-native інструментів
    і не переписує записи тредів Codex. Використовуйте явний ACP лише тоді,
    коли вам потрібна модель ACP runtime/session. Межа вбудованої підтримки Codex
    задокументована в
    [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Шпаргалка з вибору моделі / провайдера / runtime">
    - `openai-codex/*` - маршрут PI Codex OAuth/підписки.
    - `openai/*` плюс `agentRuntime.id: "codex"` - нативний вбудований runtime сервера застосунку Codex.
    - `/codex ...` - нативне керування розмовою Codex.
    - `/acp ...` або `runtime: "acp"` - явне керування ACP/acpx.

  </Accordion>
  <Accordion title="Тригери природною мовою для маршрутизації ACP">
    Тригери, які мають маршрутизуватися до runtime ACP:

    - "Запустити це як одноразову сесію Claude Code ACP і підсумувати результат."
    - "Використати Gemini CLI для цього завдання в треді, а потім зберігати подальші повідомлення в тому самому треді."
    - "Запустити Codex через ACP у фоновому треді."

    OpenClaw вибирає `runtime: "acp"`, визначає harness `agentId`,
    прив’язується до поточної розмови або треду, коли це підтримується, і
    маршрутизує подальші повідомлення до цієї сесії до закриття або завершення строку дії. Codex
    іде цим шляхом лише коли ACP/acpx задано явно або нативний Codex
    plugin недоступний для запитаної операції.

    Для `sessions_spawn`, `runtime: "acp"` оголошується лише коли ACP
    увімкнено, requester не перебуває в sandbox, і backend runtime ACP
    завантажено. `acp.dispatch.enabled=false` призупиняє автоматичну
    диспетчеризацію тредів ACP, але не приховує й не блокує явні
    виклики `sessions_spawn({ runtime: "acp" })`. Він націлюється на id harness ACP, як-от `codex`,
    `claude`, `droid`, `gemini` або `opencode`. Не передавайте звичайний
    id агента OpenClaw config з `agents_list`, якщо цей запис не
    налаштовано явно з `agents.list[].runtime.type="acp"`;
    інакше використовуйте стандартний runtime sub-agent. Коли агент OpenClaw
    налаштований з `runtime.type="acp"`, OpenClaw використовує
    `runtime.acp.agent` як базовий id harness.

  </Accordion>
</AccordionGroup>

## ACP проти sub-agents

Використовуйте ACP, коли потрібен зовнішній runtime harness. Використовуйте **нативний
сервер застосунку Codex** для прив’язування/керування розмовою Codex, коли `codex`
plugin увімкнено. Використовуйте **sub-agents**, коли потрібні нативні для OpenClaw
делеговані запуски.

| Область       | Сесія ACP                             | Запуск sub-agent                   |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Backend plugin ACP (наприклад acpx)   | Нативний runtime sub-agent OpenClaw |
| Ключ сесії    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Основні команди | `/acp ...`                          | `/subagents ...`                   |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (стандартний runtime) |

Див. також [Sub-agents](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування сесіями OpenClaw ACP.
2. Офіційний runtime plugin `@openclaw/acpx`.
3. Адаптер Claude ACP.
4. Механізм runtime/сесій на боці Claude.

ACP Claude - це **сесія harness** з елементами керування ACP, відновленням сесії,
відстеженням фонових завдань і необов’язковим прив’язуванням розмови/треду.

CLI backends - це окремі локальні резервні runtime лише для тексту - див.
[CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- **Потрібні `/acp spawn`, сесії з можливістю прив’язування, елементи керування runtime або постійна робота harness?** Використовуйте ACP.
- **Потрібен простий локальний текстовий fallback через raw CLI?** Використовуйте CLI backends.

## Прив’язані сесії

### Ментальна модель

- **Поверхня чату** - місце, де люди продовжують спілкуватися (канал Discord, тема Telegram, чат iMessage).
- **Сесія ACP** - довготривалий стан runtime Codex/Claude/Gemini, до якого OpenClaw маршрутизує.
- **Дочірній тред/тема** - необов’язкова додаткова поверхня обміну повідомленнями, створена лише через `--thread ...`.
- **Робоча область runtime** - розташування файлової системи (`cwd`, checkout репозиторію, робоча область backend), де запускається harness. Не залежить від поверхні чату.

### Прив’язки поточної розмови

`/acp spawn <harness> --bind here` закріплює поточну розмову за
створеною сесією ACP - без дочірнього треду, та сама поверхня чату. OpenClaw продовжує
володіти транспортом, автентифікацією, безпекою та доставкою. Подальші повідомлення в цій
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
  <Accordion title="Правила прив’язування та взаємовиключність">
    - `--bind here` і `--thread ...` є взаємовиключними.
    - `--bind here` працює лише на каналах, які оголошують прив’язування поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язки зберігаються після перезапусків Gateway.
    - У Discord `spawnSessions` контролює створення дочірнього треду для `--thread auto|here` - не для `--bind here`.
    - Якщо ви запускаєте до іншого агента ACP без `--cwd`, OpenClaw типово успадковує робочу область **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) fallback до стандартного значення backend; інші помилки доступу (наприклад `EACCES`) показуються як помилки spawn.
    - Команди керування Gateway залишаються локальними у прив’язаних розмовах - команди `/acp ...` обробляються OpenClaw навіть коли звичайний подальший текст маршрутизується до прив’язаної сесії ACP; `/status` і `/unfocus` також залишаються локальними, коли обробку команд увімкнено для цієї поверхні.

  </Accordion>
  <Accordion title="Сесії, прив’язані до тредів">
    Коли прив’язки тредів увімкнено для адаптера каналу:

    - OpenClaw прив’язує тред до цільової сесії ACP.
    - Подальші повідомлення в цьому треді маршрутизуються до прив’язаної сесії ACP.
    - Вивід ACP доставляється назад у той самий тред.
    - Unfocus/close/archive/idle-timeout або завершення строку max-age видаляє прив’язку.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` і `/unfocus` є командами Gateway, а не prompt для harness ACP.

    Обов’язкові feature flags для прив’язаного до треду ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` увімкнено типово (задайте `false`, щоб призупинити автоматичну диспетчеризацію тредів ACP; явні виклики `sessions_spawn({ runtime: "acp" })` все ще працюють).
    - Увімкнено створення тредових сесій адаптером каналу (типово: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Підтримка прив’язування тредів залежить від адаптера. Якщо активний адаптер
    каналу не підтримує прив’язування тредів, OpenClaw повертає чітке
    повідомлення про непідтримуваність/недоступність.

  </Accordion>
  <Accordion title="Канали з підтримкою тредів">
    - Будь-який адаптер каналу, що надає можливість прив’язування сесії/треду.
    - Поточна вбудована підтримка: треди/канали **Discord**, теми **Telegram** (форумні теми в групах/супергрупах і DM topics).
    - Канали Plugin можуть додати підтримку через той самий інтерфейс прив’язування.

  </Accordion>
</AccordionGroup>

## Постійні прив’язки каналів

Для неефемерних workflow налаштовуйте постійні прив’язки ACP у
записах верхнього рівня `bindings[]`.

### Модель прив’язки

<ParamField path="bindings[].type" type='"acp"'>
  Позначає постійну прив’язку розмови ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Ідентифікує цільову розмову. Форми для окремих каналів:

- **Канал/тред Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Форумна тема Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/група:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Надавайте перевагу `chat_id:*` або `chat_identifier:*` для стабільних прив’язок груп.
- **iMessage DM/група:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Надавайте перевагу `chat_id:*` для стабільних прив’язок груп.

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

### Стандартні runtime для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити стандартні значення ACP для агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Пріоритет перевизначень для прив’язаних сесій ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Глобальні стандартні значення ACP (наприклад `acp.backend`)

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
- Тимчасові прив’язки runtime (наприклад створені потоками thread-focus) все ще застосовуються там, де вони наявні.
- Для cross-agent ACP spawns без явного `cwd` OpenClaw успадковує робочу область цільового агента з конфігурації агента.
- Відсутні успадковані шляхи робочої області fallback до стандартного cwd backend; невідсутні помилки доступу показуються як помилки spawn.

## Запуск сесій ACP

Два способи запустити сесію ACP:

<Tabs>
  <Tab title="З sessions_spawn">
    Використовуйте `runtime: "acp"`, щоб запустити сесію ACP з turn агента або
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
    `runtime` за замовчуванням має значення `subagent`, тому явно задайте `runtime: "acp"`
    для сесій ACP. Якщо `agentId` пропущено, OpenClaw використовує
    `acp.defaultAgent`, коли його налаштовано. `mode: "session"` потребує
    `thread: true`, щоб зберігати постійну прив'язану розмову.
    </Note>

  </Tab>
  <Tab title="З команди /acp">
    Використовуйте `/acp spawn` для явного операторського керування з чату.

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

    Див. [слеш-команди](/uk/tools/slash-commands).

  </Tab>
</Tabs>

### Параметри `sessions_spawn`

<ParamField path="task" type="string" required>
  Початковий prompt, надісланий до сесії ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Має бути `"acp"` для сесій ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Ідентифікатор цільового harness ACP. Повертається до `acp.defaultAgent`, якщо його задано.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Запитати потік прив'язування thread, де це підтримується.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` є одноразовим; `"session"` є постійним. Якщо `thread: true` і
  `mode` пропущено, OpenClaw може за замовчуванням використовувати постійну поведінку відповідно до
  шляху runtime. `mode: "session"` потребує `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Запитаний робочий каталог runtime (перевіряється політикою backend/runtime).
  Якщо пропущено, запуск ACP успадковує робочу область цільового агента,
  коли її налаштовано; відсутні успадковані шляхи повертаються до
  типових значень backend, тоді як справжні помилки доступу повертаються.
</ParamField>
<ParamField path="label" type="string">
  Мітка для оператора, що використовується в тексті сесії/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Відновити наявну сесію ACP замість створення нової. Агент
  відтворює історію розмови через `session/load`. Потребує
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` передає зведення прогресу початкового запуску ACP назад до
  сесії-запитувача як системні події. Прийняті відповіді включають
  `streamLogPath`, що вказує на JSONL-журнал у межах сесії
  (`<sessionId>.acp-stream.jsonl`), який можна відстежувати для повної історії ретрансляції.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Перериває дочірній хід ACP після N секунд. `0` залишає хід на
  шляху gateway без тайм-ауту. Те саме значення застосовується до запуску
  Gateway і runtime ACP, щоб завислі або вичерпані за квотою harness не
  займали лінію батьківського агента безстроково.
</ParamField>
<ParamField path="model" type="string">
  Явне перевизначення моделі для дочірньої сесії ACP. Запуски Codex ACP
  нормалізують посилання OpenClaw Codex, як-от `openai-codex/gpt-5.4`, у конфігурацію
  запуску Codex ACP перед `session/new`; slash-форми, як-от
  `openai-codex/gpt-5.4/high`, також задають reasoning effort Codex ACP.
  Інші harness мають оголошувати ACP `models` і підтримувати
  `session/set_model`; інакше OpenClaw/acpx завершується з чіткою помилкою замість
  тихого повернення до типової моделі цільового агента.
</ParamField>
<ParamField path="thinking" type="string">
  Явне зусилля thinking/reasoning. Для Codex ACP `minimal` відповідає
  низькому зусиллю, `low`/`medium`/`high`/`xhigh` відповідають напряму, а `off`
  пропускає перевизначення reasoning-effort під час запуску.
</ParamField>

## Режими прив'язування й thread під час запуску

<Tabs>
  <Tab title="--bind here|off">
    | Режим  | Поведінка                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Прив'язати поточну активну розмову на місці; помилка, якщо активної немає. |
    | `off`  | Не створювати прив'язування поточної розмови.                          |

    Примітки:

    - `--bind here` є найпростішим операторським шляхом для "зробити цей канал або чат підкріпленим Codex."
    - `--bind here` не створює дочірній thread.
    - `--bind here` доступний лише в каналах, які надають підтримку прив'язування поточної розмови.
    - `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Режим  | Поведінка                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | В активному thread: прив'язати цей thread. Поза thread: створити/прив'язати дочірній thread, коли підтримується. |
    | `here` | Вимагати поточний активний thread; помилка, якщо ви не в ньому.                                      |
    | `off`  | Без прив'язування. Сесія запускається неприв'язаною.                                                 |

    Примітки:

    - На поверхнях без прив'язування thread типова поведінка фактично є `off`.
    - Запуск, прив'язаний до thread, потребує підтримки політики каналу:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Використовуйте `--bind here`, коли хочете закріпити поточну розмову без створення дочірнього thread.

  </Tab>
</Tabs>

## Модель доставки

Сесії ACP можуть бути або інтерактивними робочими областями, або
фоновою роботою, що належить батьківському процесу. Шлях доставки залежить від цієї форми.

<AccordionGroup>
  <Accordion title="Інтерактивні сесії ACP">
    Інтерактивні сесії призначені для продовження спілкування на видимій
    поверхні чату:

    - `/acp spawn ... --bind here` прив'язує поточну розмову до сесії ACP.
    - `/acp spawn ... --thread ...` прив'язує thread/тему каналу до сесії ACP.
    - Налаштовані постійні `bindings[].type="acp"` маршрутизують відповідні розмови до тієї самої сесії ACP.

    Подальші повідомлення у прив'язаній розмові маршрутизуються безпосередньо до
    сесії ACP, а вихідні дані ACP доставляються назад у той самий
    канал/thread/тему.

    Що OpenClaw надсилає до harness:

    - Звичайні прив'язані подальші повідомлення надсилаються як текст prompt, плюс вкладення лише тоді, коли harness/backend їх підтримує.
    - Керівні команди `/acp` і локальні команди Gateway перехоплюються до відправлення в ACP.
    - Події завершення, згенеровані runtime, матеріалізуються для кожної цілі. Агенти OpenClaw отримують внутрішній envelope runtime-context OpenClaw; зовнішні harness ACP отримують звичайний prompt з дочірнім результатом та інструкцією. Сирий envelope `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ніколи не має надсилатися до зовнішніх harness або зберігатися як текст користувацького транскрипту ACP.
    - Записи транскрипту ACP використовують видимий користувачу текст тригера або звичайний prompt завершення. Внутрішні метадані подій залишаються структурованими в OpenClaw, де це можливо, і не розглядаються як вміст чату, написаний користувачем.

  </Accordion>
  <Accordion title="Одноразові сесії ACP, що належать батьківському процесу">
    Одноразові сесії ACP, запущені іншим запуском агента, є фоновими
    дочірніми процесами, подібно до sub-agents:

    - Батьківський процес просить виконати роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Дочірній процес виконується у власній сесії harness ACP.
    - Дочірні ходи виконуються на тій самій фоновій лінії, яку використовують нативні запуски sub-agent, тому повільний harness ACP не блокує непов'язану роботу основної сесії.
    - Завершення звітується назад через шлях оголошення завершення завдання. OpenClaw перетворює внутрішні метадані завершення на звичайний prompt ACP перед надсиланням до зовнішнього harness, тому harness не бачать маркери runtime context, призначені лише для OpenClaw.
    - Батьківський процес переписує дочірній результат звичайним голосом assistant, коли корисна відповідь для користувача.

    **Не** розглядайте цей шлях як peer-to-peer чат між батьківським
    і дочірнім процесами. Дочірній процес уже має канал завершення назад до
    батьківського процесу.

  </Accordion>
  <Accordion title="sessions_send і доставка A2A">
    `sessions_send` може націлюватися на іншу сесію після запуску. Для звичайних
    peer-сесій OpenClaw використовує шлях подальшого повідомлення agent-to-agent (A2A)
    після вставлення повідомлення:

    - Дочекатися відповіді цільової сесії.
    - За потреби дозволити запитувачу й цілі обмінятися обмеженою кількістю подальших ходів.
    - Попросити ціль створити повідомлення-оголошення.
    - Доставити це оголошення до видимого каналу або thread.

    Цей шлях A2A є резервним для peer-надсилань, де відправнику потрібне
    видиме подальше повідомлення. Він залишається ввімкненим, коли непов'язана сесія може
    бачити й надсилати повідомлення до цілі ACP, наприклад за широких
    налаштувань `tools.sessions.visibility`.

    OpenClaw пропускає подальше повідомлення A2A лише тоді, коли запитувач є
    батьківським процесом власного одноразового дочірнього ACP, що належить цьому батьківському процесу. У такому разі
    запуск A2A поверх завершення завдання може розбудити батьківський процес
    результатом дочірнього процесу, переслати відповідь батьківського процесу назад у дочірній процес і
    створити echo loop між батьківським і дочірнім процесами. Результат `sessions_send` повідомляє
    `delivery.status="skipped"` для цього випадку власного дочірнього процесу, тому що
    шлях завершення вже відповідає за результат.

  </Accordion>
  <Accordion title="Відновлення наявної сесії">
    Використовуйте `resumeSessionId`, щоб продовжити попередню сесію ACP замість
    запуску з нуля. Агент відтворює історію розмови через
    `session/load`, тому продовжує з повним контекстом того, що було раніше.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Типові сценарії використання:

    - Передайте сесію Codex з ноутбука на телефон - скажіть агенту продовжити з місця, де ви зупинилися.
    - Продовжте сесію кодування, яку ви почали інтерактивно в CLI, тепер headless через свого агента.
    - Продовжте роботу, яку було перервано перезапуском gateway або тайм-аутом простою.

    Примітки:

    - `resumeSessionId` застосовується лише коли `runtime: "acp"`; типовий runtime sub-agent ігнорує це поле, призначене лише для ACP.
    - `streamTo` застосовується лише коли `runtime: "acp"`; типовий runtime sub-agent ігнорує це поле, призначене лише для ACP.
    - `resumeSessionId` є локальним для хоста ідентифікатором відновлення ACP/harness, а не ключем сесії каналу OpenClaw; OpenClaw все одно перевіряє політику запуску ACP і політику цільового агента перед відправленням, тоді як ACP backend або harness відповідає за авторизацію завантаження цього upstream id.
    - `resumeSessionId` відновлює історію розмови upstream ACP; `thread` і `mode` усе ще звичайно застосовуються до нової сесії OpenClaw, яку ви створюєте, тому `mode: "session"` усе ще потребує `thread: true`.
    - Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
    - Якщо ідентифікатор сесії не знайдено, запуск завершується чіткою помилкою - без тихого повернення до нової сесії.

  </Accordion>
  <Accordion title="Smoke test після розгортання">
    Після розгортання gateway виконайте live end-to-end перевірку, а не
    покладайтеся на unit tests:

    1. Перевірте розгорнуту версію gateway і commit на цільовому хості.
    2. Відкрийте тимчасову bridge-сесію ACPX до live-агента.
    3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Перевірте `accepted=yes`, справжній `childSessionKey` і відсутність помилки validator.
    5. Очистьте тимчасову bridge-сесію.

    Тримайте gate на `mode: "run"` і пропустіть `streamTo: "parent"` -
    прив'язаний до thread `mode: "session"` і шляхи stream-relay є окремими
    багатшими інтеграційними проходами.

  </Accordion>
</AccordionGroup>

## Сумісність sandbox

Сесії ACP наразі виконуються на runtime хоста, **не** всередині
sandbox OpenClaw.

<Warning>
**Межа безпеки:**

- Зовнішня обв’язка може читати/записувати відповідно до власних дозволів CLI і вибраного `cwd`.
- Політика пісочниці OpenClaw **не** обгортає виконання обв’язки ACP.
- OpenClaw і надалі застосовує функціональні обмеження ACP, дозволених агентів, власність сеансу, прив’язки каналів і політику доставки Gateway.
- Використовуйте `runtime: "subagent"` для нативної роботи OpenClaw із застосуванням пісочниці.

</Warning>

Поточні обмеження:

- Якщо сеанс запитувача перебуває в пісочниці, породження ACP блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.

## Визначення цільового сеансу

Більшість дій `/acp` приймають необов’язкову ціль сеансу (`session-key`,
`session-id` або `session-label`).

**Порядок визначення:**

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує ключ
   - потім ідентифікатор сеансу у формі UUID
   - потім мітку
2. Поточна прив’язка потоку (якщо ця розмова/потік прив’язана до сеансу ACP).
3. Резервний варіант поточного сеансу запитувача.

Прив’язки поточної розмови та прив’язки потоку обидві беруть участь у
кроці 2.

Якщо ціль не визначено, OpenClaw повертає зрозумілу помилку
(`Unable to resolve session target: ...`).

## Елементи керування ACP

| Команда              | Що вона робить                                           | Приклад                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створює сеанс ACP; необов’язкова поточна прив’язка або прив’язка потоку. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує поточний хід для цільового сеансу.               | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає інструкцію steer до запущеного сеансу.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сеанс і відв’язує цілі потоку.                   | `/acp close`                                                  |
| `/acp status`        | Показує бекенд, режим, стан, параметри середовища виконання, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Встановлює режим середовища виконання для цільового сеансу. | `/acp set-mode plan`                                          |
| `/acp set`           | Записує загальний параметр конфігурації середовища виконання. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Встановлює перевизначення робочого каталогу середовища виконання. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Встановлює профіль політики схвалення.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Встановлює тайм-аут середовища виконання (секунди).       | `/acp timeout 120`                                            |
| `/acp model`         | Встановлює перевизначення моделі середовища виконання.    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів середовища виконання сеансу. | `/acp reset-options`                                          |
| `/acp sessions`      | Показує останні сеанси ACP зі сховища.                    | `/acp sessions`                                               |
| `/acp doctor`        | Стан бекенда, можливості, практичні виправлення.          | `/acp doctor`                                                 |
| `/acp install`       | Друкує детерміновані кроки встановлення та ввімкнення.    | `/acp install`                                                |

`/acp status` показує ефективні параметри середовища виконання, а також ідентифікатори сеансу рівня середовища виконання та
рівня бекенда. Помилки непідтримуваних елементів керування відображаються
чітко, коли бекенд не має потрібної можливості. `/acp sessions` читає
сховище для поточного прив’язаного сеансу або сеансу запитувача; токени цілі
(`session-key`, `session-id` або `session-label`) визначаються через
виявлення сеансів gateway, включно з користувацькими коренями `session.store`
для кожного агента.

### Зіставлення параметрів середовища виконання

`/acp` має зручні команди та загальний setter. Еквівалентні
операції:

| Команда                      | Зіставляється з                      | Примітки                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | ключ конфігурації середовища виконання `model` | Для Codex ACP OpenClaw нормалізує `openai-codex/<model>` до ідентифікатора моделі адаптера та зіставляє суфікси reasoning через скісну риску, як-от `openai-codex/gpt-5.4/high`, з `reasoning_effort`. |
| `/acp set thinking <level>`  | ключ конфігурації середовища виконання `thinking` | Для Codex ACP OpenClaw надсилає відповідний `reasoning_effort`, якщо адаптер його підтримує.                                                                             |
| `/acp permissions <profile>` | ключ конфігурації середовища виконання `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | ключ конфігурації середовища виконання `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | перевизначення cwd середовища виконання | Пряме оновлення.                                                                                                                                                                 |
| `/acp set <key> <value>`     | загальне                              | `key=cwd` використовує шлях перевизначення cwd.                                                                                                                                          |
| `/acp reset-options`         | очищає всі перевизначення середовища виконання | -                                                                                                                                                                              |

## обв’язка acpx, налаштування Plugin і дозволи

Для конфігурації обв’язки acpx (псевдоніми Claude Code / Codex / Gemini CLI),
MCP-мостів plugin-tools і OpenClaw-tools, а також режимів дозволів ACP див.
[Агенти ACP - налаштування](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Симптом                                                                     | Ймовірна причина                                                                                                           | Виправлення                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend plugin відсутній, вимкнений або заблокований `plugins.allow`.                                                       | Установіть і ввімкніть backend plugin, додайте `acpx` до `plugins.allow`, коли цей allowlist задано, потім запустіть `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                                                                 | Установіть `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Автоматичне надсилання зі звичайних повідомлень потоку вимкнено.                                                               | Установіть `acp.dispatch.enabled=true`, щоб відновити автоматичну маршрутизацію потоків; явні виклики `sessions_spawn({ runtime: "acp" })` і далі працюють.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Агента немає в allowlist.                                                                                                | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` повідомляє, що backend не готовий одразу після запуску                 | Backend plugin відсутній, вимкнений, заблокований політикою allow/deny або його налаштований виконуваний файл недоступний.        | Установіть/увімкніть backend plugin, повторно запустіть `/acp doctor` і перевірте помилку встановлення backend або політики, якщо він залишається несправним.                                           |
| Команду обв’язки не знайдено                                                   | Adapter CLI не встановлено, зовнішній plugin відсутній або перше завантаження `npx` не вдалося для адаптера не Codex. | Запустіть `/acp doctor`, установіть/попередньо прогрійте адаптер на хості Gateway або явно налаштуйте команду агента acpx.                                                      |
| Модель не знайдено від обв’язки                                            | Ідентифікатор моделі дійсний для іншого провайдера/обв’язки, але не для цієї цілі ACP.                                                | Використайте модель зі списку цієї обв’язки, налаштуйте модель в обв’язці або пропустіть перевизначення.                                                                            |
| Помилка автентифікації постачальника від обв’язки                                          | OpenClaw справний, але цільовий CLI/провайдер не ввійшов у систему.                                                     | Увійдіть або надайте потрібний ключ провайдера в середовищі хоста Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Хибний ключ/id/токен мітки.                                                                                                | Запустіть `/acp sessions`, скопіюйте точний ключ/мітку, повторіть спробу.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної придатної до прив’язування розмови.                                                            | Перейдіть до цільового чату/каналу й повторіть спробу або використайте запуск без прив’язки.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості ACP-прив’язки поточної розмови.                                                             | Використайте `/acp spawn ... --thread ...`, де підтримується, налаштуйте `bindings[]` верхнього рівня або перейдіть до підтримуваного каналу.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом потоку.                                                                         | Перейдіть до цільового потоку або використайте `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язки.                                                                           | Переприв’яжіть як власник або використайте іншу розмову чи потік.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язки потоку.                                                                               | Використайте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Середовище виконання ACP працює на боці хоста; сесія запитувача перебуває в sandbox.                                                              | Використайте `runtime="subagent"` із sandboxed сесій або запустіть ACP spawn із non-sandboxed сесії.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` запитано для середовища виконання ACP.                                                                         | Використайте `runtime="subagent"` для обов’язкового sandboxing або ACP з `sandbox="inherit"` із non-sandboxed сесії.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Цільова обв’язка не надає загального перемикання моделей ACP.                                                        | Використайте обв’язку, яка оголошує ACP `models`/`session/set_model`, використайте посилання на моделі ACP Codex або налаштуйте модель безпосередньо в обв’язці, якщо вона має власний прапорець запуску. |
| Відсутні метадані ACP для прив’язаної сесії                                      | Застарілі/видалені метадані сесії ACP.                                                                                    | Створіть заново за допомогою `/acp spawn`, потім переприв’яжіть/сфокусуйте потік.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує записи/exec у неінтерактивній сесії ACP.                                                    | Установіть `plugins.entries.acpx.config.permissionMode` на `approve-all` і перезапустіть gateway. Див. [Налаштування дозволів](/uk/tools/acp-agents-setup#permission-configuration). |
| Сесія ACP завершується помилкою на початку з малим обсягом виводу                                  | Запити дозволів заблоковано `permissionMode`/`nonInteractivePermissions`.                                        | Перевірте журнали gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для коректної деградації встановіть `nonInteractivePermissions=deny`.        |
| Сесія ACP безкінечно зависає після завершення роботи                       | Процес обв’язки завершився, але сесія ACP не повідомила про завершення.                                                    | Відстежуйте за допомогою `ps aux \| grep acpx`; завершуйте застарілі процеси вручну.                                                                                                       |
| Обв’язка бачить `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Внутрішній конверт події просочився через межу ACP.                                                                | Оновіть OpenClaw і повторно запустіть потік завершення; зовнішні обв’язки мають отримувати лише звичайні підказки завершення.                                                          |

## Пов’язане

- [Агенти ACP - налаштування](/uk/tools/acp-agents-setup)
- [Надсилання агенту](/uk/tools/agent-send)
- [Backend-и CLI](/uk/gateway/cli-backends)
- [Обв’язка Codex](/uk/plugins/codex-harness)
- [Інструменти sandbox для кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (режим bridge)](/uk/cli/acp)
- [Субагенти](/uk/tools/subagents)
