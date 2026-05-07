---
read_when:
    - Запуск середовищ для кодування через ACP
    - Налаштування прив’язаних до розмови сесій ACP у каналах обміну повідомленнями
    - Прив’язування розмови в каналі повідомлень до постійного сеансу ACP
    - Усунення несправностей бекенду ACP, підключення Plugin або доставки завершень
    - Виконання команд /acp з чату
sidebarTitle: ACP agents
summary: Запускайте зовнішні середовища для програмування (Claude Code, Cursor, Gemini CLI, явний Codex ACP, OpenClaw ACP, OpenCode) через бекенд ACP
title: Агенти ACP
x-i18n:
    generated_at: "2026-05-07T15:14:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

Сеанси [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
дають OpenClaw змогу запускати зовнішні середовища для написання коду
(наприклад Pi, Claude Code, Cursor, Copilot, Droid, OpenClaw ACP, OpenCode,
Gemini CLI та інші підтримувані ACPX-середовища) через ACP backend plugin.

Кожен запуск ACP-сеансу відстежується як [фонова задача](/uk/automation/tasks).

<Note>
**ACP - це шлях зовнішнього середовища, а не типовий шлях Codex.** Нативний
Codex app-server plugin відповідає за елементи керування `/codex ...` і
вбудований runtime `agentRuntime.id: "codex"`; ACP відповідає за елементи
керування `/acp ...` і сеанси `sessions_spawn({ runtime: "acp" })`.

Якщо ви хочете, щоб Codex або Claude Code підключався як зовнішній MCP-клієнт
безпосередньо до наявних розмов каналів OpenClaw, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.
</Note>

## Яка сторінка мені потрібна?

| Ви хочете…                                                                                      | Використовуйте                       | Примітки                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати або керувати Codex у поточній розмові                                                | `/codex bind`, `/codex threads`      | Нативний шлях Codex app-server, коли plugin `codex` увімкнено; включає прив’язані відповіді чату, пересилання зображень, модель/швидкий режим/дозволи, зупинку та керування. ACP - явний fallback |
| Запустити Claude Code, Gemini CLI, явний Codex ACP або інше зовнішнє середовище _через_ OpenClaw | Ця сторінка                          | Сеанси, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові задачі, елементи керування runtime                                                                    |
| Надати сеанс OpenClaw Gateway _як_ ACP-сервер для редактора або клієнта                         | [`openclaw acp`](/uk/cli/acp)           | Режим bridge. IDE/клієнт спілкується з OpenClaw через ACP поверх stdio/WebSocket                                                                                                             |
| Повторно використати локальний AI CLI як текстову fallback-модель                               | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Без інструментів OpenClaw, без елементів керування ACP, без runtime середовища                                                                                                      |

## Чи працює це відразу після встановлення?

Так, після встановлення офіційного ACP runtime plugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source checkouts можуть використовувати локальний workspace plugin `extensions/acpx` після
`pnpm install`. Запустіть `/acp doctor` для перевірки готовності.

OpenClaw навчає агентів запуску ACP лише тоді, коли ACP **справді
придатний до використання**: ACP має бути увімкнено, dispatch не має бути
вимкнено, поточний сеанс не має бути заблокований sandbox, і runtime backend
має бути завантажений. Якщо ці умови не виконано, ACP plugin skills і
підказки ACP для `sessions_spawn` залишаються прихованими, щоб агент не
пропонував недоступний backend.

<AccordionGroup>
  <Accordion title="Типові проблеми першого запуску">
    - Якщо `plugins.allow` задано, це обмежувальний інвентар plugins, і він **має** містити `acpx`; інакше встановлений ACP backend навмисно блокується, а `/acp doctor` повідомляє про відсутній запис allowlist.
    - Адаптер Codex ACP постачається разом із plugin `acpx` і, коли можливо, запускається локально.
    - Codex ACP працює з ізольованим `CODEX_HOME`; OpenClaw копіює лише довірені записи проєктів із конфігурації Codex на хості та довіряє активному workspace, залишаючи auth, notifications і hooks у конфігурації хоста.
    - Інші адаптери цільових середовищ усе ще можуть завантажуватися на вимогу через `npx` під час першого використання.
    - Vendor auth усе одно має існувати на хості для цього середовища.
    - Якщо на хості немає npm або доступу до мережі, перші завантаження адаптерів завершуються невдачею, доки кеші не буде попередньо прогріто або адаптер не буде встановлено іншим способом.

  </Accordion>
  <Accordion title="Передумови runtime">
    ACP запускає справжній процес зовнішнього середовища. OpenClaw відповідає
    за маршрутизацію, стан фонових задач, доставку, прив’язки та політику;
    середовище відповідає за вхід до свого провайдера, каталог моделей,
    поведінку файлової системи та нативні інструменти.

    Перш ніж звинувачувати OpenClaw, перевірте:

    - `/acp doctor` повідомляє про увімкнений і справний backend.
    - Цільовий id дозволений `acp.allowedAgents`, коли цей allowlist задано.
    - Команда середовища може запускатися на хості Gateway.
    - Provider auth наявний для цього середовища (`claude`, `codex`, `gemini`, `opencode`, `droid` тощо).
    - Вибрана модель існує для цього середовища - model ids не переносяться між середовищами.
    - Запитаний `cwd` існує та доступний, або пропустіть `cwd` і дозвольте backend використати типовий каталог.
    - Режим дозволів відповідає роботі. Неінтерактивні сеанси не можуть натискати нативні запити дозволів, тому запуски кодування з великою кількістю запису/виконання зазвичай потребують профілю дозволів ACPX, який може працювати headlessly.

  </Accordion>
</AccordionGroup>

Інструменти OpenClaw plugin та вбудовані інструменти OpenClaw **не**
надаються ACP-середовищам за замовчуванням. Увімкніть явні MCP bridges в
[ACP agents - налаштування](/uk/tools/acp-agents-setup) лише тоді, коли середовище
має викликати ці інструменти безпосередньо.

## Підтримувані цільові середовища

З backend `acpx` використовуйте ці harness ids як цілі `/acp spawn <id>`
або `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | Типовий backend                               | Примітки                                                                            |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                       | Потребує Claude Code auth на хості.                                                 |
| `codex`    | Codex ACP adapter                             | Явний ACP fallback лише тоді, коли нативний `/codex` недоступний або запитано ACP.  |
| `copilot`  | GitHub Copilot ACP adapter                    | Потребує Copilot CLI/runtime auth.                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)           | Перевизначте команду acpx, якщо локальне встановлення надає інший ACP entrypoint.   |
| `droid`    | Factory Droid CLI                             | Потребує Factory/Droid auth або `FACTORY_API_KEY` у середовищі виконання.           |
| `gemini`   | Gemini CLI ACP adapter                        | Потребує Gemini CLI auth або налаштування API key.                                  |
| `iflow`    | iFlow CLI                                     | Доступність адаптера та керування моделлю залежать від установленого CLI.           |
| `kilocode` | Kilo Code CLI                                 | Доступність адаптера та керування моделлю залежать від установленого CLI.           |
| `kimi`     | Kimi/Moonshot CLI                             | Потребує Kimi/Moonshot auth на хості.                                               |
| `kiro`     | Kiro CLI                                      | Доступність адаптера та керування моделлю залежать від установленого CLI.           |
| `opencode` | OpenCode ACP adapter                          | Потребує OpenCode CLI/provider auth.                                                |
| `openclaw` | OpenClaw Gateway bridge через `openclaw acp`  | Дає ACP-aware середовищу змогу звертатися назад до сеансу OpenClaw Gateway.         |
| `pi`       | Pi/embedded OpenClaw runtime                  | Використовується для нативних експериментів OpenClaw із середовищами.               |
| `qwen`     | Qwen Code / Qwen CLI                          | Потребує Qwen-compatible auth на хості.                                             |

Custom acpx agent aliases можна налаштувати в самому acpx, але політика OpenClaw
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
    Продовжуйте у прив’язаній розмові або thread (або вкажіть ключ
    сеансу явно).
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
  <Accordion title="Деталі життєвого циклу">
    - Spawn створює або відновлює ACP runtime session, записує ACP metadata у сховище сеансів OpenClaw і може створити фонову задачу, коли запуск належить parent.
    - ACP-сеанси, що належать parent, розглядаються як фонова робота навіть тоді, коли runtime session є persistent; completion і доставка між surface проходять через parent task notifier, а не поводяться як звичайний чат-сеанс для користувача.
    - Обслуговування задач закриває terminal або orphaned parent-owned one-shot ACP-сеанси. Persistent ACP-сеанси зберігаються, доки лишається активна прив’язка розмови; застарілі persistent-сеанси без активної прив’язки закриваються, щоб їх не можна було тихо відновити після завершення owning task або зникнення її task record.
    - Прив’язані follow-up messages надходять безпосередньо до ACP-сеансу, доки прив’язку не буде закрито, розфокусовано, скинуто або доки її строк дії не спливе.
    - Команди Gateway залишаються локальними. `/acp ...`, `/status` і `/unfocus` ніколи не надсилаються як звичайний текст prompt до прив’язаного ACP-середовища.
    - `cancel` перериває активний turn, коли backend підтримує cancellation; він не видаляє binding або session metadata.
    - `close` завершує ACP-сеанс з погляду OpenClaw і видаляє binding. Середовище все ще може зберігати власну upstream history, якщо підтримує resume.
    - Plugin acpx очищає належні OpenClaw wrapper і adapter process trees після `close` та прибирає застарілі належні OpenClaw ACPX orphans під час запуску Gateway.
    - Idle runtime workers можуть очищатися після `acp.runtime.ttlMinutes`; збережені session metadata залишаються доступними для `/acp sessions`.

  </Accordion>
  <Accordion title="Правила нативної маршрутизації Codex">
    Тригери природною мовою, які мають спрямовуватися до **нативного Codex
    plugin**, коли його ввімкнено:

    - "Прив’яжи цей Discord канал до Codex."
    - "Прикріпи цей чат до Codex thread `<id>`."
    - "Покажи Codex threads, а потім прив’яжи цей."

    Власне прив’язування розмов Codex є стандартним шляхом керування чатом.
    Динамічні інструменти OpenClaw і далі виконуються через OpenClaw, тоді як
    власні інструменти Codex, як-от shell/apply-patch, виконуються всередині Codex.
    Для подій власних інструментів Codex OpenClaw впроваджує ретранслятор власних
    хуків на кожен хід, щоб хуки Plugin могли блокувати `before_tool_call`, спостерігати
    `after_tool_call` і маршрутизувати події Codex `PermissionRequest`
    через схвалення OpenClaw. Хуки Codex `Stop` ретранслюються до
    OpenClaw `before_agent_finalize`, де plugins можуть запросити ще один
    прохід моделі перед тим, як Codex фіналізує відповідь. Ретранслятор лишається
    навмисно консервативним: він не змінює аргументи власних інструментів Codex
    і не переписує записи потоків Codex. Використовуйте явний ACP лише
    тоді, коли потрібна модель runtime/сесії ACP. Межу підтримки вбудованого Codex
    задокументовано в
    [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Шпаргалка з вибору моделі / провайдера / runtime">
    - `openai-codex/*` - застарілий маршрут моделі Codex OAuth/підписки, який виправляє doctor.
    - `openai/*` - вбудований runtime власного app-server Codex для ходів агента OpenAI.
    - `/codex ...` - власне керування розмовою Codex.
    - `/acp ...` або `runtime: "acp"` - явне керування ACP/acpx.

  </Accordion>
  <Accordion title="Тригери природною мовою для маршрутизації ACP">
    Тригери, які мають маршрутизуватися до runtime ACP:

    - "Запусти це як одноразову сесію Claude Code ACP і підсумуй результат."
    - "Використай Gemini CLI для цього завдання в потоці, а подальші звернення залишай у тому самому потоці."
    - "Запусти Codex через ACP у фоновому потоці."

    OpenClaw вибирає `runtime: "acp"`, розв’язує harness `agentId`,
    прив’язується до поточної розмови або потоку, коли це підтримується, і
    маршрутизує подальші звернення до цієї сесії до закриття/закінчення строку дії. Codex
    проходить цим шляхом лише тоді, коли ACP/acpx указано явно або власний
    plugin Codex недоступний для запитаної операції.

    Для `sessions_spawn`, `runtime: "acp"` оголошується лише тоді, коли ACP
    увімкнено, запитувач не перебуває в пісочниці, а backend runtime ACP
    завантажено. `acp.dispatch.enabled=false` призупиняє автоматичну
    диспетчеризацію потоків ACP, але не приховує й не блокує явні виклики
    `sessions_spawn({ runtime: "acp" })`. Він націлюється на ідентифікатори harness ACP, як-от `codex`,
    `claude`, `droid`, `gemini` або `opencode`. Не передавайте звичайний
    ідентифікатор агента конфігурації OpenClaw з `agents_list`, якщо цей запис не
    налаштовано явно з `agents.list[].runtime.type="acp"`;
    інакше використовуйте стандартний runtime під-агента. Коли агент OpenClaw
    налаштовано з `runtime.type="acp"`, OpenClaw використовує
    `runtime.acp.agent` як базовий ідентифікатор harness.

  </Accordion>
</AccordionGroup>

## ACP проти під-агентів

Використовуйте ACP, коли потрібен зовнішній harness runtime. Використовуйте **власний Codex
app-server** для прив’язування/керування розмовою Codex, коли plugin `codex`
увімкнено. Використовуйте **під-агентів**, коли потрібні делеговані запускання,
власні для OpenClaw.

| Область       | Сесія ACP                             | Запуск під-агента                  |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Backend plugin ACP (наприклад acpx)   | Власний runtime під-агента OpenClaw |
| Ключ сесії    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Основні команди | `/acp ...`                          | `/subagents ...`                   |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (стандартний runtime) |

Див. також [Під-агенти](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування сесією ACP OpenClaw.
2. Офіційний runtime plugin `@openclaw/acpx`.
3. Адаптер Claude ACP.
4. Механізми runtime/сесії на боці Claude.

ACP Claude — це **сесія harness** з керуванням ACP, відновленням сесії,
відстеженням фонових завдань і необов’язковим прив’язуванням розмови/потоку.

Backend-и CLI — це окремі текстові локальні fallback runtime-и - див.
[Backend-и CLI](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- **Потрібні `/acp spawn`, сесії з прив’язуванням, керування runtime або тривала робота harness?** Використовуйте ACP.
- **Потрібен простий локальний текстовий fallback через сирий CLI?** Використовуйте backend-и CLI.

## Прив’язані сесії

### Ментальна модель

- **Поверхня чату** - місце, де люди продовжують спілкуватися (канал Discord, тема Telegram, чат iMessage).
- **Сесія ACP** - тривалий стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **Дочірній потік/тема** - необов’язкова додаткова поверхня повідомлень, створювана лише через `--thread ...`.
- **Робочий простір runtime** - розташування у файловій системі (`cwd`, checkout репозиторію, робочий простір backend), де працює harness. Незалежний від поверхні чату.

### Прив’язування поточної розмови

`/acp spawn <harness> --bind here` закріплює поточну розмову за
створеною сесією ACP - без дочірнього потоку, та сама поверхня чату. OpenClaw і далі
володіє транспортом, автентифікацією, безпекою та доставкою. Подальші повідомлення в цій
розмові маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають
сесію на місці; `/acp close` видаляє прив’язування.

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
  <Accordion title="Правила прив’язування та ексклюзивність">
    - `--bind here` і `--thread ...` є взаємовиключними.
    - `--bind here` працює лише на каналах, які оголошують прив’язування поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язування зберігаються після перезапусків gateway.
    - У Discord `spawnSessions` обмежує створення дочірніх потоків для `--thread auto|here` - не для `--bind here`.
    - Якщо ви створюєте сесію для іншого агента ACP без `--cwd`, OpenClaw за замовчуванням успадковує робочий простір **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) повертаються до стандартного значення backend; інші помилки доступу (наприклад, `EACCES`) показуються як помилки створення.
    - Команди керування Gateway залишаються локальними в прив’язаних розмовах - команди `/acp ...` обробляються OpenClaw навіть тоді, коли звичайний текст подальшого звернення маршрутизується до прив’язаної сесії ACP; `/status` і `/unfocus` також залишаються локальними, коли обробку команд увімкнено для цієї поверхні.

  </Accordion>
  <Accordion title="Сесії, прив’язані до потоку">
    Коли прив’язування потоків увімкнено для адаптера каналу:

    - OpenClaw прив’язує потік до цільової сесії ACP.
    - Подальші повідомлення в цьому потоці маршрутизуються до прив’язаної сесії ACP.
    - Вивід ACP доставляється назад у той самий потік.
    - Unfocus/close/archive/idle-timeout або закінчення max-age видаляє прив’язування.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` і `/unfocus` є командами Gateway, а не prompt-ами до harness ACP.

    Обов’язкові feature flags для ACP, прив’язаного до потоку:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` увімкнено за замовчуванням (установіть `false`, щоб призупинити автоматичну диспетчеризацію потоків ACP; явні виклики `sessions_spawn({ runtime: "acp" })` і далі працюють).
    - Увімкнено створення сесій потоків адаптером каналу (за замовчуванням: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Підтримка прив’язування потоків залежить від адаптера. Якщо активний адаптер
    каналу не підтримує прив’язування потоків, OpenClaw повертає чітке
    повідомлення про непідтримуваність/недоступність.

  </Accordion>
  <Accordion title="Канали з підтримкою потоків">
    - Будь-який адаптер каналу, який надає можливість прив’язування сесій/потоків.
    - Поточна вбудована підтримка: потоки/канали **Discord**, теми **Telegram** (форумні теми в групах/супергрупах і теми DM).
    - Канали Plugin можуть додати підтримку через той самий інтерфейс прив’язування.

  </Accordion>
</AccordionGroup>

## Постійні прив’язування каналів

Для неефемерних робочих процесів налаштуйте постійні прив’язування ACP у
записах верхнього рівня `bindings[]`.

### Модель прив’язування

<ParamField path="bindings[].type" type='"acp"'>
  Позначає постійне прив’язування розмови ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Ідентифікує цільову розмову. Форми для окремих каналів:

- **Канал/потік Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Форумна тема Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/група BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Віддавайте перевагу `chat_id:*` або `chat_identifier:*` для стабільних групових прив’язувань.
- **DM/група iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Віддавайте перевагу `chat_id:*` для стабільних групових прив’язувань.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Ідентифікатор агента-власника OpenClaw.
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
- `agents.list[].runtime.acp.agent` (ідентифікатор harness, наприклад `codex` або `claude`)
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

- OpenClaw забезпечує існування налаштованого сеансу ACP перед використанням.
- Повідомлення в цьому каналі або темі спрямовуються до налаштованого сеансу ACP.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ сеансу ACP на місці.
- Тимчасові прив’язки середовища виконання (наприклад, створені потоками фокусування на треді) усе ще застосовуються там, де вони наявні.
- Для міжагентних запусків ACP без явного `cwd` OpenClaw успадковує робочий простір цільового агента з конфігурації агента.
- Відсутні успадковані шляхи робочого простору повертаються до типового cwd бекенда; невідсутні помилки доступу відображаються як помилки запуску.

## Запуск сеансів ACP

Два способи запустити сеанс ACP:

<Tabs>
  <Tab title="From sessions_spawn">
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
    `runtime` за замовчуванням має значення `subagent`, тому задайте `runtime: "acp"` явно
    для сеансів ACP. Якщо `agentId` пропущено, OpenClaw використовує
    `acp.defaultAgent`, коли його налаштовано. `mode: "session"` вимагає
    `thread: true`, щоб зберігати сталу прив’язану розмову.
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

    Див. [Slash-команди](/uk/tools/slash-commands).

  </Tab>
</Tabs>

### Параметри `sessions_spawn`

<ParamField path="task" type="string" required>
  Початковий prompt, надісланий до сеансу ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Має бути `"acp"` для сеансів ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Ідентифікатор цільового harness ACP. Повертається до `acp.defaultAgent`, якщо задано.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Запитати потік прив’язки треду, де це підтримується.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` є одноразовим; `"session"` є сталим. Якщо `thread: true` і
  `mode` пропущено, OpenClaw може за замовчуванням використовувати сталу поведінку для
  шляху середовища виконання. `mode: "session"` вимагає `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Запитаний робочий каталог середовища виконання (перевіряється політикою бекенда/середовища
  виконання). Якщо пропущено, запуск ACP успадковує робочий простір цільового агента,
  коли його налаштовано; відсутні успадковані шляхи повертаються до типових значень
  бекенда, тоді як реальні помилки доступу повертаються.
</ParamField>
<ParamField path="label" type="string">
  Мітка для оператора, що використовується в тексті сеансу/банера.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Відновити наявний сеанс ACP замість створення нового. Агент
  відтворює історію своєї розмови через `session/load`. Вимагає
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` транслює початкові зведення прогресу запуску ACP назад до
  сеансу запитувача як системні події. Прийняті відповіді містять
  `streamLogPath`, що вказує на scoped до сеансу журнал JSONL
  (`<sessionId>.acp-stream.jsonl`), який можна переглядати через tail для повної історії ретрансляції.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Перериває хід дочірнього ACP через N секунд. `0` залишає хід на
  шляху Gateway без тайм-ауту. Те саме значення застосовується до запуску
  Gateway і середовища виконання ACP, щоб завислі або вичерпані за квотою harness не
  займали лінію батьківського агента безстроково.
</ParamField>
<ParamField path="model" type="string">
  Явне перевизначення моделі для дочірнього сеансу ACP. Запуски Codex ACP
  нормалізують refs OpenClaw Codex, як-от `openai-codex/gpt-5.4`, до стартової
  конфігурації Codex ACP перед `session/new`; slash-форми, як-от
  `openai-codex/gpt-5.4/high`, також задають reasoning effort Codex ACP.
  Інші harness мають оголошувати ACP `models` і підтримувати
  `session/set_model`; інакше OpenClaw/acpx чітко завершується з помилкою замість
  тихого повернення до типової моделі цільового агента.
</ParamField>
<ParamField path="thinking" type="string">
  Явне thinking/reasoning effort. Для Codex ACP `minimal` відповідає
  низькому effort, `low`/`medium`/`high`/`xhigh` відображаються напряму, а `off`
  пропускає стартове перевизначення reasoning-effort.
</ParamField>

## Режими прив’язки запуску й треду

<Tabs>
  <Tab title="--bind here|off">
    | Режим  | Поведінка                                                              |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Прив’язати поточну активну розмову на місці; завершитися з помилкою, якщо активної немає. |
    | `off`  | Не створювати прив’язку поточної розмови.                              |

    Примітки:

    - `--bind here` — найпростіший операторський шлях для «зробити цей канал або чат підтримуваним Codex».
    - `--bind here` не створює дочірній тред.
    - `--bind here` доступний лише на каналах, що надають підтримку прив’язки поточної розмови.
    - `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Режим  | Поведінка                                                                                           |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | В активному треді: прив’язати цей тред. Поза тредом: створити/прив’язати дочірній тред, коли підтримується. |
    | `here` | Вимагати поточний активний тред; завершитися з помилкою, якщо ви не в ньому.                        |
    | `off`  | Без прив’язки. Сеанс запускається неприв’язаним.                                                     |

    Примітки:

    - На поверхнях без прив’язки тредів типова поведінка фактично є `off`.
    - Запуск із прив’язкою до треду вимагає підтримки політики каналу:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Використовуйте `--bind here`, коли хочете закріпити поточну розмову без створення дочірнього треду.

  </Tab>
</Tabs>

## Модель доставки

Сеанси ACP можуть бути інтерактивними робочими просторами або фоновою
роботою, що належить батьківському агенту. Шлях доставки залежить від цієї форми.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Інтерактивні сеанси призначені для продовження розмови на видимій
    поверхні чату:

    - `/acp spawn ... --bind here` прив’язує поточну розмову до сеансу ACP.
    - `/acp spawn ... --thread ...` прив’язує тред/тему каналу до сеансу ACP.
    - Сталі налаштовані `bindings[].type="acp"` спрямовують відповідні розмови до того самого сеансу ACP.

    Подальші повідомлення в прив’язаній розмові спрямовуються безпосередньо до
    сеансу ACP, а вивід ACP доставляється назад до того самого
    каналу/треду/теми.

    Що OpenClaw надсилає до harness:

    - Звичайні прив’язані подальші повідомлення надсилаються як текст prompt, плюс вкладення лише тоді, коли harness/бекенд їх підтримує.
    - Команди керування `/acp` і локальні команди Gateway перехоплюються перед відправленням ACP.
    - Події завершення, згенеровані середовищем виконання, матеріалізуються для кожної цілі. Агенти OpenClaw отримують внутрішній runtime-context envelope OpenClaw; зовнішні harness ACP отримують звичайний prompt із дочірнім результатом та інструкцією. Сирий envelope `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ніколи не має надсилатися до зовнішніх harness або зберігатися як текст користувацького transcript ACP.
    - Записи transcript ACP використовують видимий користувачу текст тригера або звичайний prompt завершення. Метадані внутрішніх подій залишаються структурованими в OpenClaw, де це можливо, і не трактуються як вміст чату, написаний користувачем.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Одноразові сеанси ACP, запущені іншим запуском агента, є фоновими
    дочірніми процесами, подібними до субагентів:

    - Батьківський агент запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Дочірній агент працює у власному сеансі harness ACP.
    - Дочірні ходи виконуються на тій самій фоновій лінії, що й нативні запуски субагентів, тому повільний harness ACP не блокує непов’язану роботу основного сеансу.
    - Звіти про завершення повертаються через шлях оголошення task-completion. OpenClaw перетворює внутрішні метадані завершення на звичайний prompt ACP перед надсиланням до зовнішнього harness, тож harness не бачать маркерів runtime context, призначених лише для OpenClaw.
    - Батьківський агент переписує дочірній результат звичайним голосом асистента, коли відповідь для користувача доречна.

    **Не** трактуйте цей шлях як peer-to-peer чат між батьківським і
    дочірнім агентом. Дочірній агент уже має канал завершення назад до
    батьківського.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` може націлюватися на інший сеанс після запуску. Для звичайних
    peer-сеансів OpenClaw використовує шлях подальших повідомлень agent-to-agent (A2A)
    після ін’єкції повідомлення:

    - Дочекатися відповіді цільового сеансу.
    - За потреби дозволити запитувачу й цілі обмінятися обмеженою кількістю подальших ходів.
    - Попросити ціль створити повідомлення-оголошення.
    - Доставити це оголошення до видимого каналу або треду.

    Цей шлях A2A є fallback для peer-надсилань, де відправнику потрібне
    видиме подальше повідомлення. Він залишається увімкненим, коли непов’язаний сеанс може
    бачити ціль ACP і надсилати їй повідомлення, наприклад за широких
    налаштувань `tools.sessions.visibility`.

    OpenClaw пропускає подальше повідомлення A2A лише тоді, коли запитувач є
    батьківським агентом власного одноразового дочірнього ACP, що належить батьківському агенту. У цьому випадку
    запуск A2A поверх task completion може розбудити батьківський агент результатом
    дочірнього, переслати відповідь батьківського назад у дочірній і
    створити echo loop між батьківським і дочірнім агентами. Результат `sessions_send` повідомляє
    `delivery.status="skipped"` для цього випадку owned-child, бо
    шлях завершення вже відповідає за результат.

  </Accordion>
  <Accordion title="Resume an existing session">
    Використовуйте `resumeSessionId`, щоб продовжити попередній сеанс ACP замість
    початку з нуля. Агент відтворює історію своєї розмови через
    `session/load`, тож продовжує з повним контекстом того, що було раніше.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Поширені сценарії використання:

    - Передати сеанс Codex із вашого ноутбука на телефон — скажіть агенту продовжити з місця, де ви зупинилися.
    - Продовжити сеанс кодування, який ви почали інтерактивно в CLI, тепер без інтерфейсу через вашого агента.
    - Продовжити роботу, перервану перезапуском gateway або тайм-аутом простою.

    Примітки:

    - `resumeSessionId` застосовується лише коли `runtime: "acp"`; типове середовище виконання субагента ігнорує це поле, призначене лише для ACP.
    - `streamTo` застосовується лише коли `runtime: "acp"`; типове середовище виконання субагента ігнорує це поле, призначене лише для ACP.
    - `resumeSessionId` — це локальний для хоста id відновлення ACP/harness, а не ключ сеансу каналу OpenClaw; OpenClaw усе ще перевіряє політику запуску ACP і політику цільового агента перед відправленням, тоді як ACP-бекенд або harness відповідає за авторизацію завантаження цього upstream id.
    - `resumeSessionId` відновлює історію upstream-розмови ACP; `thread` і `mode` усе ще застосовуються звичайно до нового сеансу OpenClaw, який ви створюєте, тож `mode: "session"` усе ще вимагає `thread: true`.
    - Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
    - Якщо id сеансу не знайдено, запуск завершується чіткою помилкою — без тихого fallback до нового сеансу.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Після розгортання gateway запустіть живу наскрізну перевірку, а не
    покладайтеся на unit tests:

    1. Перевірте версію розгорнутого Gateway і коміт на цільовому хості.
    2. Відкрийте тимчасовий сеанс мосту ACPX до живого агента.
    3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Перевірте `accepted=yes`, реальний `childSessionKey` і відсутність помилки валідатора.
    5. Очистьте тимчасовий сеанс мосту.

    Тримайте gate на `mode: "run"` і пропустіть `streamTo: "parent"` -
    прив'язаний до потоку `mode: "session"` і шляхи ретрансляції потоку є окремими
    розширеними інтеграційними проходами.

  </Accordion>
</AccordionGroup>

## Сумісність із пісочницею

Сеанси ACP наразі працюють у середовищі виконання хоста, **не** всередині
пісочниці OpenClaw.

<Warning>
**Межа безпеки:**

- Зовнішній стенд може читати/записувати відповідно до власних дозволів CLI і вибраного `cwd`.
- Політика пісочниці OpenClaw **не** обгортає виконання стенда ACP.
- OpenClaw і далі забезпечує gates функцій ACP, дозволених агентів, володіння сеансами, прив'язки каналів і політику доставки Gateway.
- Використовуйте `runtime: "subagent"` для нативної роботи OpenClaw із примусовим застосуванням пісочниці.

</Warning>

Поточні обмеження:

- Якщо сеанс запитувача працює в пісочниці, створення ACP заблоковане як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.

## Визначення цільового сеансу

Більшість дій `/acp` приймають необов'язкову ціль сеансу (`session-key`,
`session-id` або `session-label`).

**Порядок визначення:**

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - пробує ключ
   - потім UUID-подібний ідентифікатор сеансу
   - потім мітку
2. Поточна прив'язка потоку (якщо ця розмова/потік прив'язана до сеансу ACP).
3. Резервний варіант поточного сеансу запитувача.

Прив'язки поточної розмови й прив'язки потоку обидві беруть участь у
кроці 2.

Якщо ціль не визначено, OpenClaw повертає зрозумілу помилку
(`Unable to resolve session target: ...`).

## Елементи керування ACP

| Команда              | Що робить                                                | Приклад                                                       |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створює сеанс ACP; необов'язкова поточна прив'язка або прив'язка потоку. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує поточний хід для цільового сеансу.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає інструкцію steer до запущеного сеансу.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сеанс і відв'язує цілі потоку.                  | `/acp close`                                                  |
| `/acp status`        | Показує бекенд, режим, стан, параметри середовища виконання, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Установлює режим середовища виконання для цільового сеансу. | `/acp set-mode plan`                                          |
| `/acp set`           | Записує загальний параметр конфігурації середовища виконання. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Установлює перевизначення робочого каталогу середовища виконання. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Установлює профіль політики схвалення.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Установлює тайм-аут середовища виконання (у секундах).   | `/acp timeout 120`                                            |
| `/acp model`         | Установлює перевизначення моделі середовища виконання.   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів середовища виконання сеансу. | `/acp reset-options`                                          |
| `/acp sessions`      | Показує останні сеанси ACP зі сховища.                   | `/acp sessions`                                               |
| `/acp doctor`        | Стан бекенда, можливості, дієві виправлення.             | `/acp doctor`                                                 |
| `/acp install`       | Виводить детерміновані кроки встановлення й увімкнення.  | `/acp install`                                                |

`/acp status` показує ефективні параметри середовища виконання, а також ідентифікатори сеансів на рівні середовища виконання й
бекенда. Помилки непідтримуваних елементів керування відображаються
зрозуміло, коли бекенд не має потрібної можливості. `/acp sessions` читає
сховище для поточного прив'язаного сеансу або сеансу запитувача; токени цілі
(`session-key`, `session-id` або `session-label`) визначаються через
виявлення сеансів gateway, включно з користувацькими коренями `session.store`
для кожного агента.

### Відображення параметрів середовища виконання

`/acp` має зручні команди та загальний setter. Еквівалентні
операції:

| Команда                      | Відображається на                     | Примітки                                                                                                                                                                       |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | ключ конфігурації середовища виконання `model` | Для Codex ACP OpenClaw нормалізує `openai-codex/<model>` до ідентифікатора моделі адаптера й відображає суфікси reasoning зі slash, як-от `openai-codex/gpt-5.4/high`, на `reasoning_effort`. |
| `/acp set thinking <level>`  | ключ конфігурації середовища виконання `thinking` | Для Codex ACP OpenClaw надсилає відповідний `reasoning_effort`, де адаптер його підтримує.                                                                                     |
| `/acp permissions <profile>` | ключ конфігурації середовища виконання `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | ключ конфігурації середовища виконання `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | перевизначення cwd середовища виконання | Пряме оновлення.                                                                                                                                                              |
| `/acp set <key> <value>`     | загальне                              | `key=cwd` використовує шлях перевизначення cwd.                                                                                                                               |
| `/acp reset-options`         | очищає всі перевизначення середовища виконання | -                                                                                                                                                                              |

## Стенд acpx, налаштування plugin і дозволи

Для конфігурації стенда acpx (псевдоніми Claude Code / Codex / Gemini CLI),
мостів MCP plugin-tools і OpenClaw-tools, а також режимів
дозволів ACP див.
[Агенти ACP - налаштування](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Симптом                                                                     | Ймовірна причина                                                                                                           | Виправлення                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Бекенд-Plugin відсутній, вимкнений або заблокований через `plugins.allow`.                                                       | Установіть і ввімкніть бекенд-Plugin, додайте `acpx` до `plugins.allow`, якщо цей список дозволів задано, потім запустіть `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                                                                 | Установіть `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Автоматичну диспетчеризацію зі звичайних повідомлень потоку вимкнено.                                                               | Установіть `acp.dispatch.enabled=true`, щоб відновити автоматичну маршрутизацію потоків; явні виклики `sessions_spawn({ runtime: "acp" })` і далі працюють.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Агента немає у списку дозволених.                                                                                                | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Бекенд-Plugin відсутній, вимкнений, заблокований політикою дозволу/заборони або його налаштований виконуваний файл недоступний.        | Установіть/увімкніть бекенд-Plugin, повторно запустіть `/acp doctor` і перевірте помилку встановлення бекенда або політики, якщо він залишається несправним.                                           |
| Команду обв’язки не знайдено                                                   | CLI адаптера не встановлено, зовнішній Plugin відсутній або перше завантаження `npx` не вдалося для адаптера, що не є Codex. | Запустіть `/acp doctor`, установіть/попередньо прогрійте адаптер на хості Gateway або явно налаштуйте команду агента acpx.                                                      |
| Модель не знайдено з обв’язки                                            | Ідентифікатор моделі чинний для іншого провайдера/обв’язки, але не для цієї цілі ACP.                                                | Використайте модель зі списку цієї обв’язки, налаштуйте модель в обв’язці або пропустіть перевизначення.                                                                            |
| Помилка автентифікації постачальника з обв’язки                                          | OpenClaw справний, але цільовий CLI/провайдер не ввійшов у систему.                                                     | Увійдіть або надайте потрібний ключ провайдера в середовищі хоста Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Неправильний токен ключа/ідентифікатора/мітки.                                                                                                | Запустіть `/acp sessions`, скопіюйте точний ключ/мітку й повторіть спробу.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної прив’язуваної розмови.                                                            | Перейдіть до цільового чату/каналу й повторіть спробу або скористайтеся запуском без прив’язки.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості ACP-прив’язки до поточної розмови.                                                             | Використайте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте `bindings[]` верхнього рівня або перейдіть до підтримуваного каналу.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом потоку.                                                                         | Перейдіть до цільового потоку або використайте `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язки.                                                                           | Переприв’яжіть як власник або використайте іншу розмову чи потік.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язки потоків.                                                                               | Використайте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Середовище виконання ACP працює на боці хоста; сеанс запитувача ізольовано в sandbox.                                                              | Використайте `runtime="subagent"` із sandbox-сеансів або запустіть ACP spawn із сеансу без sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` запитано для середовища виконання ACP.                                                                         | Використайте `runtime="subagent"` для обов’язкового sandbox або ACP з `sandbox="inherit"` із сеансу без sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Цільова обв’язка не надає загального перемикання моделей ACP.                                                        | Використайте обв’язку, що оголошує ACP `models`/`session/set_model`, використайте посилання на моделі Codex ACP або налаштуйте модель безпосередньо в обв’язці, якщо вона має власний прапорець запуску. |
| Відсутні метадані ACP для прив’язаного сеансу                                      | Застарілі/видалені метадані сеансу ACP.                                                                                    | Створіть знову через `/acp spawn`, потім переприв’яжіть/сфокусуйте потік.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує записи/виконання в неінтерактивному сеансі ACP.                                                    | Установіть `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Див. [Налаштування дозволів](/uk/tools/acp-agents-setup#permission-configuration). |
| Сеанс ACP завершується з помилкою рано й майже без виводу                                  | Запити дозволів заблоковано через `permissionMode`/`nonInteractivePermissions`.                                        | Перевірте журнали gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для поступової деградації встановіть `nonInteractivePermissions=deny`.        |
| Сеанс ACP зависає на невизначений час після завершення роботи                       | Процес обв’язки завершився, але сеанс ACP не повідомив про завершення.                                                    | Оновіть OpenClaw; поточне очищення acpx закриває застарілі процеси обгортки й адаптера, що належать OpenClaw, під час закриття та запуску Gateway.                                             |
| Обв’язка бачить `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Внутрішній конверт події просочився через межу ACP.                                                                | Оновіть OpenClaw і повторно запустіть потік завершення; зовнішні обв’язки мають отримувати лише звичайні підказки завершення.                                                          |

## Пов’язане

- [Агенти ACP - налаштування](/uk/tools/acp-agents-setup)
- [Надсилання агенту](/uk/tools/agent-send)
- [Бекенди CLI](/uk/gateway/cli-backends)
- [Обв’язка Codex](/uk/plugins/codex-harness)
- [Інструменти sandbox для кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (режим bridge)](/uk/cli/acp)
- [Субагенти](/uk/tools/subagents)
