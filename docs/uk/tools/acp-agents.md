---
read_when:
    - Запуск середовищ для кодування через ACP
    - Налаштування прив’язаних до розмов сеансів ACP у каналах обміну повідомленнями
    - Прив’язування розмови каналу повідомлень до постійного сеансу ACP
    - Усунення несправностей бекенду ACP, підключення Plugin або доставки завершень
    - Виконання команд /acp із чату
sidebarTitle: ACP agents
summary: Запускайте зовнішні середовища для кодування (Claude Code, Cursor, Gemini CLI, явний Codex ACP, OpenClaw ACP, OpenCode) через бекенд ACP
title: ACP-агенти
x-i18n:
    generated_at: "2026-05-11T20:59:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

Сеанси [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
дають OpenClaw змогу запускати зовнішні coding harnesses (наприклад Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI та інші
підтримувані ACPX harnesses) через backend Plugin для ACP.

Кожен spawn сеансу ACP відстежується як [фонове завдання](/uk/automation/tasks).

<Note>
**ACP — це шлях зовнішнього harness, а не типовий шлях Codex.** Нативний
app-server Plugin Codex володіє елементами керування `/codex ...` і типовим
вбудованим runtime `openai/gpt-*` для agent turns; ACP володіє
елементами керування `/acp ...` і сеансами `sessions_spawn({ runtime: "acp" })`.

Якщо ви хочете, щоб Codex або Claude Code підключався як зовнішній MCP-клієнт
безпосередньо до наявних розмов каналів OpenClaw, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.
</Note>

## Яка сторінка мені потрібна?

| Ви хочете…                                                                                      | Використовуйте                       | Примітки                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати або керувати Codex у поточній розмові                                                | `/codex bind`, `/codex threads`       | Нативний шлях app-server Codex, коли Plugin `codex` увімкнено; включає прив’язані відповіді чату, пересилання зображень, model/fast/permissions, stop і steer controls. ACP є явним fallback |
| Запустити Claude Code, Gemini CLI, явний Codex ACP або інший зовнішній harness _через_ OpenClaw | Ця сторінка                           | Сеанси, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, елементи керування runtime                                                                    |
| Надати сеанс OpenClaw Gateway _як_ ACP-сервер для редактора або клієнта                         | [`openclaw acp`](/uk/cli/acp)            | Режим bridge. IDE/клієнт спілкується з ACP до OpenClaw через stdio/WebSocket                                                                                                                  |
| Повторно використати локальний AI CLI як текстову fallback-модель                               | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Без інструментів OpenClaw, без елементів керування ACP, без runtime harness                                                                                                           |

## Чи працює це одразу?

Так, після встановлення офіційного ACP runtime Plugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source checkouts можуть використовувати локальний workspace Plugin `extensions/acpx` після
`pnpm install`. Запустіть `/acp doctor` для перевірки готовності.

OpenClaw навчає агентів ACP spawning лише тоді, коли ACP **справді
придатний до використання**: ACP має бути ввімкнений, dispatch не має бути
вимкнений, поточний сеанс не має бути заблокований sandbox, і runtime backend має бути
завантажений. Якщо ці умови не виконано, ACP Plugin Skills і
підказки ACP для `sessions_spawn` залишаються прихованими, щоб агент не пропонував
недоступний backend.

<AccordionGroup>
  <Accordion title="Проблеми першого запуску">
    - Якщо `plugins.allow` задано, це обмежувальний інвентар Plugin, і він **обов’язково** має включати `acpx`; інакше встановлений ACP backend навмисно блокується, а `/acp doctor` повідомляє про відсутній запис allowlist.
    - Адаптер Codex ACP постачається з Plugin `acpx` і запускається локально, коли це можливо.
    - Codex ACP працює з ізольованим `CODEX_HOME`; OpenClaw копіює лише довірені записи проєкту з конфігурації Codex хоста й довіряє активному workspace, залишаючи auth, notifications і hooks у конфігурації хоста.
    - Інші адаптери цільових harness усе ще можуть завантажуватися на вимогу через `npx` під час першого використання.
    - Vendor auth усе одно має існувати на хості для цього harness.
    - Якщо на хості немає npm або доступу до мережі, завантаження адаптера першого запуску не вдаються, доки caches не будуть попередньо прогріті або адаптер не буде встановлено іншим способом.

  </Accordion>
  <Accordion title="Передумови runtime">
    ACP запускає справжній зовнішній процес harness. OpenClaw володіє routing,
    станом фонових завдань, delivery, bindings і policy; harness
    володіє своїм provider login, model catalog, поведінкою файлової системи та
    нативними інструментами.

    Перш ніж звинувачувати OpenClaw, перевірте:

    - `/acp doctor` повідомляє про ввімкнений, справний backend.
    - Target id дозволено `acp.allowedAgents`, коли цей allowlist задано.
    - Команда harness може запуститися на Gateway host.
    - Provider auth наявний для цього harness (`claude`, `codex`, `gemini`, `opencode`, `droid` тощо).
    - Вибрана модель існує для цього harness - model ids не переносяться між harnesses.
    - Запитаний `cwd` існує та доступний, або пропустіть `cwd` і дозвольте backend використати типовий.
    - Permission mode відповідає роботі. Неінтерактивні сеанси не можуть натискати нативні permission prompts, тому coding runs із великою кількістю write/exec зазвичай потребують ACPX permission profile, який може працювати headlessly.

  </Accordion>
</AccordionGroup>

Інструменти OpenClaw Plugin і вбудовані інструменти OpenClaw **не** надаються
ACP harnesses за замовчуванням. Увімкніть явні MCP bridges у
[ACP agents - setup](/uk/tools/acp-agents-setup) лише тоді, коли harness
має викликати ці інструменти безпосередньо.

## Підтримувані цілі harness

З backend `acpx` використовуйте ці harness ids як цілі `/acp spawn <id>`
або `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | Типовий backend                               | Примітки                                                                           |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Адаптер Claude Code ACP                        | Потребує Claude Code auth на хості.                                                 |
| `codex`    | Адаптер Codex ACP                              | Лише явний ACP fallback, коли нативний `/codex` недоступний або запитано ACP.        |
| `copilot`  | Адаптер GitHub Copilot ACP                     | Потребує Copilot CLI/runtime auth.                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Перевизначте команду acpx, якщо локальне встановлення надає інший ACP entrypoint.    |
| `droid`    | Factory Droid CLI                              | Потребує Factory/Droid auth або `FACTORY_API_KEY` у середовищі harness.             |
| `gemini`   | Адаптер Gemini CLI ACP                         | Потребує Gemini CLI auth або налаштування API key.                                  |
| `iflow`    | iFlow CLI                                      | Доступність адаптера та керування моделлю залежать від встановленого CLI.           |
| `kilocode` | Kilo Code CLI                                  | Доступність адаптера та керування моделлю залежать від встановленого CLI.           |
| `kimi`     | Kimi/Moonshot CLI                              | Потребує Kimi/Moonshot auth на хості.                                                |
| `kiro`     | Kiro CLI                                       | Доступність адаптера та керування моделлю залежать від встановленого CLI.           |
| `opencode` | Адаптер OpenCode ACP                           | Потребує OpenCode CLI/provider auth.                                                |
| `openclaw` | Bridge OpenClaw Gateway через `openclaw acp`   | Дозволяє ACP-aware harness звертатися назад до сеансу OpenClaw Gateway.             |
| `pi`       | Pi/вбудований OpenClaw runtime                 | Використовується для OpenClaw-native експериментів із harness.                      |
| `qwen`     | Qwen Code / Qwen CLI                           | Потребує Qwen-compatible auth на хості.                                             |

Користувацькі aliases агентів acpx можна налаштувати в самому acpx, але policy OpenClaw
усе одно перевіряє `acp.allowedAgents` і будь-яке
зіставлення `agents.list[].runtime.acp.agent` перед dispatch.

## Runbook оператора

Швидкий flow `/acp` із чату:

<Steps>
  <Step title="Spawn">
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
  <Step title="Steer">
    Без заміни контексту: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Зупинка">
    `/acp cancel` (поточний turn) або `/acp close` (сеанс + bindings).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Деталі життєвого циклу">
    - Spawn створює або відновлює ACP runtime session, записує ACP metadata у session store OpenClaw і може створити фонове завдання, коли run належить parent.
    - ACP sessions, що належать parent, розглядаються як фонова робота навіть тоді, коли runtime session є persistent; completion і cross-surface delivery проходять через parent task notifier, а не поводяться як звичайний user-facing chat session.
    - Task maintenance закриває terminal або orphaned parent-owned one-shot ACP sessions. Persistent ACP sessions зберігаються, доки залишається активна прив’язка розмови; stale persistent sessions без активної прив’язки закриваються, щоб їх не можна було непомітно відновити після завершення owning task або зникнення його task record.
    - Прив’язані follow-up messages надходять безпосередньо до ACP session, доки binding не буде закрито, unfocused, reset або expired.
    - Gateway commands залишаються локальними. `/acp ...`, `/status` і `/unfocus` ніколи не надсилаються як звичайний prompt text до прив’язаного ACP harness.
    - `cancel` перериває активний turn, коли backend підтримує cancellation; це не видаляє binding або session metadata.
    - `close` завершує ACP session з точки зору OpenClaw і видаляє binding. Harness усе ще може зберігати власну upstream history, якщо він підтримує resume.
    - Plugin acpx очищає належні OpenClaw wrapper і adapter process trees після `close` та прибирає stale належні OpenClaw ACPX orphans під час запуску Gateway.
    - Idle runtime workers можуть бути очищені після `acp.runtime.ttlMinutes`; збережені session metadata залишаються доступними для `/acp sessions`.

  </Accordion>
  <Accordion title="Правила routing для нативного Codex">
    Natural-language triggers, які мають routing до **нативного Codex
    Plugin**, коли його ввімкнено:

    - "Прив’яжи цей Discord channel до Codex."
    - "Прикріпи цей chat до Codex thread `<id>`."
    - "Покажи Codex threads, потім прив’яжи цей."

    Нативна прив’язка розмови Codex є типовим шляхом керування чатом.
    Динамічні інструменти OpenClaw й надалі виконуються через OpenClaw, тоді як
    нативні для Codex інструменти, як-от shell/apply-patch, виконуються всередині Codex.
    Для нативних для Codex подій інструментів OpenClaw ін’єктує для кожного ходу нативний
    ретранслятор хуків, щоб хуки плагінів могли блокувати `before_tool_call`, спостерігати
    `after_tool_call` і маршрутизувати події Codex `PermissionRequest`
    через схвалення OpenClaw. Хуки Codex `Stop` ретранслюються до
    OpenClaw `before_agent_finalize`, де плагіни можуть запросити ще один
    прохід моделі до того, як Codex фіналізує свою відповідь. Ретранслятор залишається
    навмисно консервативним: він не змінює аргументи нативних для Codex інструментів
    і не переписує записи треду Codex. Використовуйте явний ACP лише
    тоді, коли вам потрібна модель runtime/session ACP. Межа підтримки
    вбудованого Codex задокументована в
    [контракті підтримки Codex harness v1](/uk/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Шпаргалка з вибору моделі / провайдера / runtime">
    - `openai-codex/*` - застарілий маршрут моделі Codex OAuth/subscription, відновлюваний doctor.
    - `openai/*` - нативний вбудований runtime сервера застосунку Codex для ходів агента OpenAI.
    - `/codex ...` - нативне керування розмовою Codex.
    - `/acp ...` або `runtime: "acp"` - явне керування ACP/acpx.

  </Accordion>
  <Accordion title="Тригери природною мовою для маршрутизації ACP">
    Тригери, які мають спрямовувати до ACP runtime:

    - "Запусти це як одноразову сесію Claude Code ACP і підсумуй результат."
    - "Використай Gemini CLI для цього завдання в треді, а потім збережи подальші відповіді в тому самому треді."
    - "Запусти Codex через ACP у фоновому треді."

    OpenClaw вибирає `runtime: "acp"`, визначає harness `agentId`,
    прив’язується до поточної розмови або треду, коли це підтримується, і
    маршрутизує подальші повідомлення до цієї сесії до закриття/закінчення строку дії. Codex іде
    цим шляхом лише тоді, коли ACP/acpx указано явно або нативний Plugin Codex
    недоступний для запитаної операції.

    Для `sessions_spawn`, `runtime: "acp"` рекламується лише тоді, коли ACP
    увімкнено, запитувач не перебуває в sandbox, і завантажено backend
    ACP runtime. `acp.dispatch.enabled=false` призупиняє автоматичну
    відправку тредів ACP, але не приховує й не блокує явні
    виклики `sessions_spawn({ runtime: "acp" })`. Він націлюється на id ACP harness, як-от `codex`,
    `claude`, `droid`, `gemini` або `opencode`. Не передавайте звичайний
    id агента з конфігурації OpenClaw із `agents_list`, якщо цей запис
    явно не налаштовано з `agents.list[].runtime.type="acp"`;
    інакше використовуйте типовий runtime субагента. Коли агент OpenClaw
    налаштований із `runtime.type="acp"`, OpenClaw використовує
    `runtime.acp.agent` як базовий id harness.

  </Accordion>
</AccordionGroup>

## ACP проти субагентів

Використовуйте ACP, коли вам потрібен зовнішній runtime harness. Використовуйте **нативний
сервер застосунку Codex** для прив’язки/керування розмовою Codex, коли Plugin `codex`
увімкнено. Використовуйте **субагентів**, коли вам потрібні нативні для OpenClaw
делеговані запуски.

| Область       | Сесія ACP                             | Запуск субагента                   |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Backend Plugin ACP (наприклад, acpx) | Нативний runtime субагента OpenClaw |
| Ключ сесії    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Основні команди | `/acp ...`                          | `/subagents ...`                   |
| Інструмент spawn | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (типовий runtime) |

Див. також [Субагенти](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування сесіями OpenClaw ACP.
2. Офіційний runtime Plugin `@openclaw/acpx`.
3. Адаптер Claude ACP.
4. Runtime/session механізми на боці Claude.

ACP Claude — це **harness-сесія** з керуванням ACP, відновленням сесії,
відстеженням фонових завдань і необов’язковою прив’язкою розмови/треду.

CLI backends — це окремі текстові локальні резервні runtime - див.
[CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- **Потрібні `/acp spawn`, прив’язувані сесії, runtime-керування або тривала робота harness?** Використовуйте ACP.
- **Потрібен простий локальний текстовий fallback через сирий CLI?** Використовуйте CLI backends.

## Прив’язані сесії

### Ментальна модель

- **Поверхня чату** - місце, де люди продовжують спілкування (канал Discord, тема Telegram, чат iMessage).
- **Сесія ACP** - тривалий runtime-стан Codex/Claude/Gemini, до якого OpenClaw маршрутизує.
- **Дочірній тред/тема** - необов’язкова додаткова поверхня обміну повідомленнями, створювана лише через `--thread ...`.
- **Робочий простір runtime** - розташування файлової системи (`cwd`, repo checkout, backend workspace), де працює harness. Незалежне від поверхні чату.

### Прив’язки поточної розмови

`/acp spawn <harness> --bind here` закріплює поточну розмову за
створеною сесією ACP - без дочірнього треду, та сама поверхня чату. OpenClaw і далі
володіє транспортом, автентифікацією, безпекою та доставкою. Подальші повідомлення в цій
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
    - `--bind here` і `--thread ...` взаємовиключні.
    - `--bind here` працює лише на каналах, які оголошують прив’язку поточної розмови; інакше OpenClaw повертає зрозуміле повідомлення про непідтримуваність. Прив’язки зберігаються після перезапусків Gateway.
    - У Discord `spawnSessions` керує створенням дочірнього треду для `--thread auto|here` - не для `--bind here`.
    - Якщо ви створюєте сесію для іншого агента ACP без `--cwd`, OpenClaw типово успадковує робочий простір **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) відступають до типового значення backend; інші помилки доступу (наприклад, `EACCES`) показуються як помилки spawn.
    - Команди керування Gateway залишаються локальними у прив’язаних розмовах - команди `/acp ...` обробляються OpenClaw навіть тоді, коли звичайний текст подальших повідомлень маршрутизується до прив’язаної сесії ACP; `/status` і `/unfocus` також залишаються локальними, коли обробку команд увімкнено для цієї поверхні.

  </Accordion>
  <Accordion title="Сесії, прив’язані до треду">
    Коли прив’язки тредів увімкнено для адаптера каналу:

    - OpenClaw прив’язує тред до цільової сесії ACP.
    - Подальші повідомлення в цьому треді маршрутизуються до прив’язаної сесії ACP.
    - Вивід ACP доставляється назад у той самий тред.
    - Unfocus/close/archive/idle-timeout або завершення max-age видаляє прив’язку.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` і `/unfocus` є командами Gateway, а не промптами до ACP harness.

    Обов’язкові feature flags для ACP, прив’язаного до треду:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` увімкнено типово (установіть `false`, щоб призупинити автоматичну відправку тредів ACP; явні виклики `sessions_spawn({ runtime: "acp" })` і далі працюють).
    - Створення сесій тредів адаптера каналу увімкнено (типово: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Підтримка прив’язки тредів залежить від адаптера. Якщо активний адаптер каналу
    не підтримує прив’язки тредів, OpenClaw повертає зрозуміле
    повідомлення про непідтримуваність/недоступність.

  </Accordion>
  <Accordion title="Канали з підтримкою тредів">
    - Будь-який адаптер каналу, що надає можливість прив’язки session/thread.
    - Поточна вбудована підтримка: треди/канали **Discord**, теми **Telegram** (теми форумів у групах/супергрупах і теми DM).
    - Канали Plugin можуть додавати підтримку через той самий інтерфейс прив’язки.

  </Accordion>
</AccordionGroup>

## Постійні прив’язки каналів

Для неефемерних робочих процесів налаштовуйте постійні прив’язки ACP у
записах верхнього рівня `bindings[]`.

### Модель прив’язки

<ParamField path="bindings[].type" type='"acp"'>
  Позначає постійну прив’язку розмови ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Визначає цільову розмову. Форми для кожного каналу:

- **Канал/тред Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Канал/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Надавайте перевагу стабільним id Slack; прив’язки каналів також збігаються з відповідями всередині тредів цього каналу.
- **Тема форуму Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
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

### Типові значення runtime для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити типові значення ACP для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Пріоритет перевизначень для прив’язаних сесій ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Глобальні типові значення ACP (наприклад, `acp.backend`)

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

- OpenClaw забезпечує наявність налаштованої сесії ACP перед використанням.
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованої сесії ACP.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ сесії ACP на місці.
- Тимчасові прив’язки часу виконання (наприклад, створені потоками фокусування на гілці) усе ще застосовуються там, де вони є.
- Для міжагентних запусків ACP без явного `cwd` OpenClaw успадковує робочий простір цільового агента з конфігурації агента.
- Відсутні успадковані шляхи робочого простору відступають до стандартного cwd бекенда; невідсутні збої доступу показуються як помилки запуску.

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
    для сесій ACP. Якщо `agentId` пропущено, OpenClaw використовує
    `acp.defaultAgent`, коли його налаштовано. `mode: "session"` вимагає
    `thread: true`, щоб зберігати постійну прив’язану розмову.
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
  Ідентифікатор цільового harness ACP. Відступає до `acp.defaultAgent`, якщо задано.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Запитати потік прив’язки гілки там, де це підтримується.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` є одноразовим; `"session"` є постійним. Якщо `thread: true`, а
  `mode` пропущено, OpenClaw може за замовчуванням використовувати постійну поведінку відповідно до
  шляху часу виконання. `mode: "session"` вимагає `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Запитаний робочий каталог часу виконання (перевіряється політикою
  бекенда/часу виконання). Якщо пропущено, запуск ACP успадковує робочий простір цільового агента,
  коли його налаштовано; відсутні успадковані шляхи відступають до стандартних значень
  бекенда, тоді як реальні помилки доступу повертаються.
</ParamField>
<ParamField path="label" type="string">
  Видима оператору мітка, що використовується в тексті сесії/банера.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Відновити наявну сесію ACP замість створення нової. Агент
  відтворює історію розмови через `session/load`. Вимагає
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` транслює підсумки перебігу початкового запуску ACP назад до
  сесії-запитувача як системні події. Прийняті відповіді включають
  `streamLogPath`, що вказує на JSONL-журнал у межах сесії
  (`<sessionId>.acp-stream.jsonl`), який можна відстежувати для повної історії ретрансляції.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Перериває дочірній хід ACP після N секунд. `0` залишає хід на
  шляху Gateway без тайм-ауту. Те саме значення застосовується до запуску
  Gateway і часу виконання ACP, щоб завислі або такі, що вичерпали квоту, harness не
  займали лінію батьківського агента нескінченно.
</ParamField>
<ParamField path="model" type="string">
  Явне перевизначення моделі для дочірньої сесії ACP. Запуски Codex ACP
  нормалізують посилання OpenClaw Codex, як-от `openai-codex/gpt-5.4`, до конфігурації запуску
  Codex ACP перед `session/new`; слеш-форми, як-от
  `openai-codex/gpt-5.4/high`, також задають зусилля міркування Codex ACP.
  Інші harness мають оголошувати ACP `models` і підтримувати
  `session/set_model`; інакше OpenClaw/acpx завершується з чіткою помилкою, а не
  мовчки відступає до стандартного значення цільового агента.
</ParamField>
<ParamField path="thinking" type="string">
  Явне зусилля thinking/reasoning. Для Codex ACP `minimal` зіставляється з
  низьким зусиллям, `low`/`medium`/`high`/`xhigh` зіставляються напряму, а `off`
  пропускає перевизначення зусилля міркування під час запуску.
</ParamField>

## Режими прив’язки запуску та гілки

<Tabs>
  <Tab title="--bind here|off">
    | Режим  | Поведінка                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Прив’язати поточну активну розмову на місці; завершитися з помилкою, якщо активної немає. |
    | `off`  | Не створювати прив’язку поточної розмови.                          |

    Примітки:

    - `--bind here` — найпростіший операторський шлях для "зробити цей канал або чат підтримуваним Codex."
    - `--bind here` не створює дочірню гілку.
    - `--bind here` доступний лише в каналах, які надають підтримку прив’язки поточної розмови.
    - `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Режим  | Поведінка                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | В активній гілці: прив’язати цю гілку. Поза гілкою: створити/прив’язати дочірню гілку, якщо підтримується. |
    | `here` | Вимагати поточну активну гілку; завершитися з помилкою, якщо ви не в ній.                                                  |
    | `off`  | Без прив’язки. Сесія запускається неприв’язаною.                                                                 |

    Примітки:

    - На поверхнях без прив’язки гілок стандартна поведінка фактично є `off`.
    - Запуск із прив’язкою до гілки вимагає підтримки політики каналу:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Використовуйте `--bind here`, коли хочете закріпити поточну розмову без створення дочірньої гілки.

  </Tab>
</Tabs>

## Модель доставки

Сесії ACP можуть бути або інтерактивними робочими просторами, або фоновою
роботою, якою володіє батьківський процес. Шлях доставки залежить від цієї форми.

<AccordionGroup>
  <Accordion title="Інтерактивні сесії ACP">
    Інтерактивні сесії призначені для продовження розмови на видимій
    поверхні чату:

    - `/acp spawn ... --bind here` прив’язує поточну розмову до сесії ACP.
    - `/acp spawn ... --thread ...` прив’язує гілку/тему каналу до сесії ACP.
    - Постійні налаштовані `bindings[].type="acp"` маршрутизують відповідні розмови до тієї самої сесії ACP.

    Подальші повідомлення у прив’язаній розмові маршрутизуються безпосередньо до
    сесії ACP, а вивід ACP доставляється назад у той самий
    канал/гілку/тему.

    Що OpenClaw надсилає до harness:

    - Звичайні прив’язані подальші повідомлення надсилаються як текст prompt, плюс вкладення лише тоді, коли harness/бекенд їх підтримує.
    - Команди керування `/acp` і локальні команди Gateway перехоплюються перед відправленням ACP.
    - Події завершення, згенеровані часом виконання, матеріалізуються для кожної цілі. Агенти OpenClaw отримують внутрішній конверт runtime-context OpenClaw; зовнішні harness ACP отримують звичайний prompt із дочірнім результатом та інструкцією. Сирий конверт `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ніколи не має надсилатися зовнішнім harness або зберігатися як текст транскрипту користувача ACP.
    - Записи транскрипту ACP використовують видимий користувачу текст тригера або звичайний prompt завершення. Внутрішні метадані подій залишаються структурованими в OpenClaw, де це можливо, і не трактуються як створений користувачем вміст чату.

  </Accordion>
  <Accordion title="Батьківські одноразові сесії ACP">
    Одноразові сесії ACP, запущені іншим агентським запуском, є фоновими
    дочірніми процесами, подібними до під-агентів:

    - Батьківський процес запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Дочірній процес виконується у власній сесії harness ACP.
    - Дочірні ходи виконуються в тій самій фоновій лінії, що використовується нативними запусками під-агентів, тому повільний harness ACP не блокує непов’язану роботу основної сесії.
    - Завершення повідомляється назад через шлях оголошення виконання завдання. OpenClaw перетворює внутрішні метадані завершення на звичайний prompt ACP перед надсиланням його зовнішньому harness, тому harness не бачать маркерів контексту часу виконання, призначених лише для OpenClaw.
    - Батьківський процес переписує дочірній результат звичайним голосом асистента, коли корисна відповідь для користувача.

    **Не** трактуйте цей шлях як одноранговий чат між батьківським
    і дочірнім процесами. Дочірній процес уже має канал завершення назад до
    батьківського.

  </Accordion>
  <Accordion title="sessions_send і доставка A2A">
    `sessions_send` може націлюватися на іншу сесію після запуску. Для звичайних
    однорангових сесій OpenClaw використовує шлях подальшого звернення агент-до-агента (A2A)
    після впровадження повідомлення:

    - Дочекатися відповіді цільової сесії.
    - За потреби дозволити запитувачу й цілі обмінятися обмеженою кількістю подальших ходів.
    - Попросити ціль створити повідомлення-оголошення.
    - Доставити це оголошення до видимого каналу або гілки.

    Цей шлях A2A є резервним для однорангових надсилань, де відправнику потрібне
    видиме подальше повідомлення. Він залишається ввімкненим, коли непов’язана сесія може
    бачити ціль ACP і надсилати їй повідомлення, наприклад за широких
    налаштувань `tools.sessions.visibility`.

    OpenClaw пропускає подальше звернення A2A лише тоді, коли запитувач є
    батьківським процесом власного одноразового дочірнього ACP, яким він володіє. У такому разі
    запуск A2A поверх завершення завдання може розбудити батьківський процес із
    результатом дочірнього, переслати відповідь батьківського назад у дочірній і
    створити цикл відлуння між батьківським і дочірнім процесами. Результат `sessions_send` повідомляє
    `delivery.status="skipped"` для цього випадку дочірнього процесу, яким володіє батьківський, бо
    шлях завершення вже відповідає за результат.

  </Accordion>
  <Accordion title="Відновити наявну сесію">
    Використовуйте `resumeSessionId`, щоб продовжити попередню сесію ACP замість
    запуску з нуля. Агент відтворює історію розмови через
    `session/load`, тож продовжує з повним контекстом попереднього.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Поширені випадки використання:

    - Передати сесію Codex з ноутбука на телефон — скажіть агенту продовжити з того місця, де ви зупинилися.
    - Продовжити сесію кодування, яку ви почали інтерактивно в CLI, тепер безголово через свого агента.
    - Продовжити роботу, перервану перезапуском gateway або тайм-аутом бездіяльності.

    Примітки:

    - `resumeSessionId` застосовується лише коли `runtime: "acp"`; стандартний час виконання під-агента ігнорує це поле лише для ACP.
    - `streamTo` застосовується лише коли `runtime: "acp"`; стандартний час виконання під-агента ігнорує це поле лише для ACP.
    - `resumeSessionId` є локальним для хоста ідентифікатором відновлення ACP/harness, а не ключем сесії каналу OpenClaw; OpenClaw усе ще перевіряє політику запуску ACP і політику цільового агента перед відправленням, тоді як бекенд ACP або harness володіє авторизацією для завантаження цього upstream-ідентифікатора.
    - `resumeSessionId` відновлює історію upstream-розмови ACP; `thread` і `mode` усе ще нормально застосовуються до нової сесії OpenClaw, яку ви створюєте, тому `mode: "session"` усе ще вимагає `thread: true`.
    - Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
    - Якщо ідентифікатор сесії не знайдено, запуск завершується з чіткою помилкою — без мовчазного відступу до нової сесії.

  </Accordion>
  <Accordion title="Smoke-тест після розгортання">
    Після розгортання gateway виконайте живу наскрізну перевірку, а не
    покладайтеся на модульні тести:

    1. Перевірте розгорнуту версію Gateway і коміт на цільовому хості.
    2. Відкрийте тимчасовий сеанс мосту ACPX до живого агента.
    3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Перевірте `accepted=yes`, справжній `childSessionKey` і відсутність помилки валідатора.
    5. Очистьте тимчасовий сеанс мосту.

    Залиште перевірку на `mode: "run"` і пропустіть `streamTo: "parent"` -
    прив’язані до потоку шляхи `mode: "session"` і stream-relay є окремими
    повнішими інтеграційними проходами.

  </Accordion>
</AccordionGroup>

## Сумісність із пісочницею

Сеанси ACP наразі виконуються в середовищі виконання хоста, **а не** всередині
пісочниці OpenClaw.

<Warning>
**Межа безпеки:**

- Зовнішній harness може читати/писати відповідно до власних дозволів CLI і вибраного `cwd`.
- Політика пісочниці OpenClaw **не** обгортає виконання harness ACP.
- OpenClaw усе ще застосовує функціональні обмеження ACP, дозволених агентів, власність сеансів, прив’язки каналів і політику доставки Gateway.
- Використовуйте `runtime: "subagent"` для нативної роботи OpenClaw із примусовим застосуванням пісочниці.

</Warning>

Поточні обмеження:

- Якщо сеанс запитувача перебуває в пісочниці, породження ACP блокується як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.

## Визначення цільового сеансу

Більшість дій `/acp` приймають необов’язкову ціль сеансу (`session-key`,
`session-id` або `session-label`).

**Порядок визначення:**

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - пробує ключ
   - потім UUID-подібний ідентифікатор сеансу
   - потім мітку
2. Поточна прив’язка потоку (якщо ця розмова/потік прив’язана до сеансу ACP).
3. Резервний поточний сеанс запитувача.

Прив’язки поточної розмови й прив’язки потоку обидві беруть участь у
кроці 2.

Якщо ціль не визначено, OpenClaw повертає зрозумілу помилку
(`Unable to resolve session target: ...`).

## Елементи керування ACP

| Команда              | Що вона робить                                           | Приклад                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створює сеанс ACP; необов’язкова поточна прив’язка або прив’язка потоку. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує поточний turn для цільового сеансу.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає інструкцію steer до запущеного сеансу.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сеанс і відв’язує цілі потоку.                   | `/acp close`                                                  |
| `/acp status`        | Показує backend, режим, стан, параметри середовища виконання, можливості. | `/acp status`                                                 |
| `/acp set-mode`      | Установлює режим середовища виконання для цільового сеансу. | `/acp set-mode plan`                                          |
| `/acp set`           | Записує загальний параметр конфігурації середовища виконання. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Установлює перевизначення робочого каталогу середовища виконання. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Установлює профіль політики схвалення.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Установлює час очікування середовища виконання (секунди). | `/acp timeout 120`                                            |
| `/acp model`         | Установлює перевизначення моделі середовища виконання.    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів середовища виконання сеансу. | `/acp reset-options`                                          |
| `/acp sessions`      | Перелічує нещодавні сеанси ACP зі сховища.                | `/acp sessions`                                               |
| `/acp doctor`        | Стан backend, можливості, практичні виправлення.          | `/acp doctor`                                                 |
| `/acp install`       | Друкує детерміновані кроки встановлення й увімкнення.     | `/acp install`                                                |

`/acp status` показує ефективні параметри середовища виконання, а також ідентифікатори сеансу на рівні середовища виконання та
backend. Помилки непідтримуваних елементів керування відображаються
зрозуміло, коли backend не має відповідної можливості. `/acp sessions` читає
сховище для поточного прив’язаного сеансу або сеансу запитувача; токени цілі
(`session-key`, `session-id` або `session-label`) визначаються через
виявлення сеансів Gateway, включно з власними для агента коренями `session.store`.

### Зіставлення параметрів середовища виконання

`/acp` має зручні команди й загальний setter. Еквівалентні
операції:

| Команда                      | Зіставляється з                      | Примітки                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ключ конфігурації середовища виконання `model` | Для Codex ACP OpenClaw нормалізує `openai-codex/<model>` до ідентифікатора моделі адаптера й зіставляє суфікси reasoning зі slash, як-от `openai-codex/gpt-5.4/high`, із `reasoning_effort`.                |
| `/acp set thinking <level>`  | канонічний параметр `thinking`       | OpenClaw надсилає еквівалент, оголошений backend, коли він наявний, віддаючи перевагу `thinking`, потім `effort`, `reasoning_effort` або `thought_level`. Для Codex ACP адаптер зіставляє значення з `reasoning_effort`. |
| `/acp permissions <profile>` | канонічний параметр `permissionProfile` | OpenClaw надсилає еквівалент, оголошений backend, коли він наявний, як-от `approval_policy`, `permission_profile`, `permissions` або `permission_mode`.                                                   |
| `/acp timeout <seconds>`     | канонічний параметр `timeoutSeconds` | OpenClaw надсилає еквівалент, оголошений backend, коли він наявний, як-от `timeout` або `timeout_seconds`.                                                                                                 |
| `/acp cwd <path>`            | перевизначення cwd середовища виконання | Пряме оновлення.                                                                                                                                                                                           |
| `/acp set <key> <value>`     | загальне                             | `key=cwd` використовує шлях перевизначення cwd.                                                                                                                                                            |
| `/acp reset-options`         | очищає всі перевизначення середовища виконання | -                                                                                                                                                                                                          |

## harness acpx, налаштування plugin і дозволи

Для конфігурації harness acpx (псевдоніми Claude Code / Codex / Gemini CLI),
мостів MCP plugin-tools і OpenClaw-tools, а також режимів дозволів ACP
див.
[Агенти ACP - налаштування](/uk/tools/acp-agents-setup).

## Усунення несправностей

| Симптом                                                                     | Ймовірна причина                                                                                                           | Виправлення                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend plugin відсутній, вимкнений або заблокований `plugins.allow`.                                                       | Установіть і ввімкніть backend plugin, додайте `acpx` до `plugins.allow`, коли цей список дозволених задано, потім запустіть `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                                                                 | Установіть `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Автоматичне надсилання зі звичайних повідомлень потоку вимкнено.                                                               | Установіть `acp.dispatch.enabled=true`, щоб відновити автоматичну маршрутизацію потоків; явні виклики `sessions_spawn({ runtime: "acp" })` і далі працюють.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Агента немає у списку дозволених.                                                                                                | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Backend plugin відсутній, вимкнений, заблокований політикою дозволу/заборони або його налаштований виконуваний файл недоступний.        | Установіть/увімкніть backend plugin, повторно запустіть `/acp doctor` і перевірте помилку встановлення бекенда або політики, якщо стан лишається несправним.                                           |
| Команду harness не знайдено                                                   | CLI адаптера не встановлено, зовнішній plugin відсутній або початкове отримання `npx` завершилося невдало для не-Codex адаптера. | Запустіть `/acp doctor`, установіть/попередньо прогрійте адаптер на хості Gateway або явно налаштуйте команду агента acpx.                                                      |
| Модель не знайдено з боку harness                                            | Ідентифікатор моделі чинний для іншого провайдера/harness, але не для цієї цілі ACP.                                                | Використайте модель, яку перелічує цей harness, налаштуйте модель у harness або пропустіть перевизначення.                                                                            |
| Помилка автентифікації постачальника з боку harness                                          | OpenClaw справний, але в цільовий CLI/провайдер не виконано вхід.                                                     | Увійдіть або надайте потрібний ключ провайдера в середовищі хоста Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Неправильний токен ключа/ідентифікатора/мітки.                                                                                                | Запустіть `/acp sessions`, скопіюйте точний ключ/мітку й повторіть спробу.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної прив’язуваної розмови.                                                            | Перейдіть до цільового чату/каналу й повторіть спробу або використайте створення без прив’язки.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості прив’язування ACP до поточної розмови.                                                             | Використайте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте `bindings[]` верхнього рівня або перейдіть до підтримуваного каналу.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом потоку.                                                                         | Перейдіть до цільового потоку або використайте `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Інший користувач володіє активною ціллю прив’язки.                                                                           | Переприв’яжіть як власник або використайте іншу розмову чи потік.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язування потоків.                                                                               | Використайте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP працює на боці хоста; сеанс запитувача ізольований у sandbox.                                                              | Використайте `runtime="subagent"` із sandboxed сеансів або запустіть створення ACP з non-sandboxed сеансу.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` запитано для runtime ACP.                                                                         | Використайте `runtime="subagent"` для обов’язкової sandbox-ізоляції або використайте ACP із `sandbox="inherit"` з non-sandboxed сеансу.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Цільовий harness не надає загального перемикання моделей ACP.                                                        | Використайте harness, який оголошує ACP `models`/`session/set_model`, використайте посилання на моделі Codex ACP або налаштуйте модель безпосередньо в harness, якщо він має власний прапорець запуску. |
| Відсутні метадані ACP для прив’язаного сеансу                                      | Застарілі/видалені метадані сеансу ACP.                                                                                    | Створіть знову за допомогою `/acp spawn`, потім повторно прив’яжіть/сфокусуйте потік.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує записи/виконання в неінтерактивному сеансі ACP.                                                    | Установіть `plugins.entries.acpx.config.permissionMode` на `approve-all` і перезапустіть gateway. Див. [Налаштування дозволів](/uk/tools/acp-agents-setup#permission-configuration). |
| Сеанс ACP рано завершується з малим обсягом виводу                                  | Запити дозволів заблоковані `permissionMode`/`nonInteractivePermissions`.                                        | Перевірте журнали gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для м’якої деградації встановіть `nonInteractivePermissions=deny`.        |
| Сеанс ACP безстроково зависає після завершення роботи                       | Процес harness завершився, але сеанс ACP не повідомив про завершення.                                                    | Оновіть OpenClaw; поточне очищення acpx прибирає застарілі процеси обгортки й адаптера, що належать OpenClaw, під час закриття та запуску Gateway.                                             |
| Harness бачить `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Внутрішня оболонка події просочилася через межу ACP.                                                                | Оновіть OpenClaw і повторно запустіть потік завершення; зовнішні harness мають отримувати лише звичайні підказки завершення.                                                          |

## Пов’язане

- [Агенти ACP - налаштування](/uk/tools/acp-agents-setup)
- [Надсилання агенту](/uk/tools/agent-send)
- [Бекенди CLI](/uk/gateway/cli-backends)
- [Codex harness](/uk/plugins/codex-harness)
- [Runtime Codex harness](/uk/plugins/codex-harness-runtime)
- [Інструменти sandbox для кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (режим мосту)](/uk/cli/acp)
- [Субагенти](/uk/tools/subagents)
