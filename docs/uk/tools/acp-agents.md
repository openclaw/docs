---
read_when:
    - Запуск coding harness через ACP
    - Налаштування ACP-сесій, прив’язаних до розмови, у каналах обміну повідомленнями
    - Прив’язка розмови в каналі повідомлень до постійної ACP-сесії
    - Усунення проблем із бекендом ACP, підключенням plugin або доставкою завершення
    - Керування командами /acp з чату
sidebarTitle: ACP agents
summary: Запускайте зовнішні coding harness (Claude Code, Cursor, Gemini CLI, явний Codex ACP, OpenClaw ACP, OpenCode) через бекенд ACP
title: ACP агенти
x-i18n:
    generated_at: "2026-04-27T14:21:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 399aed931ad19c681049e1345d4636e73a47dfd0448e2699d95e8ce0184f60ed
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) сесії
дають OpenClaw змогу запускати зовнішні coding harness (наприклад Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI та інші
підтримувані ACPX harness) через plugin бекенду ACP.

Кожен запуск ACP-сесії відстежується як [фонове завдання](/uk/automation/tasks).

<Note>
**ACP — це шлях зовнішнього harness, а не типовий шлях Codex.** Власний
plugin app-server Codex керує командами `/codex ...` і вбудованим
runtime `agentRuntime.id: "codex"`; ACP керує
командами `/acp ...` і сесіями `sessions_spawn({ runtime: "acp" })`.

Якщо ви хочете, щоб Codex або Claude Code підключалися як зовнішній MCP-клієнт
безпосередньо до наявних розмов OpenClaw у каналах, використовуйте
[`openclaw mcp serve`](/uk/cli/mcp) замість ACP.
</Note>

## Яка сторінка мені потрібна?

| Ви хочете…                                                                                    | Використовуйте це                     | Примітки                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Прив’язати або керувати Codex у поточній розмові                                              | `/codex bind`, `/codex threads`       | Власний шлях app-server Codex, коли plugin `codex` увімкнено; включає прив’язані відповіді чату, пересилання зображень, model/fast/permissions, керування зупинкою та steer. ACP є явним резервним варіантом |
| Запустити Claude Code, Gemini CLI, явний Codex ACP або інший зовнішній harness _через_ OpenClaw | Ця сторінка                           | Сесії, прив’язані до чату, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, фонові завдання, керування runtime                                                                             |
| Надати сесію OpenClaw Gateway _як_ ACP-сервер для редактора або клієнта                       | [`openclaw acp`](/uk/cli/acp)            | Режим мосту. IDE/клієнт використовує ACP до OpenClaw через stdio/WebSocket                                                                                                                    |
| Повторно використовувати локальний AI CLI як резервну текстову модель                         | [CLI Backends](/uk/gateway/cli-backends) | Не ACP. Без інструментів OpenClaw, без елементів керування ACP, без runtime harness                                                                                                          |

## Це працює одразу після встановлення?

Зазвичай так. Свіжі встановлення постачаються з увімкненим за замовчуванням
вбудованим plugin runtime `acpx`, який використовує локально прив’язаний бінарний файл `acpx`, що OpenClaw перевіряє
та самостійно відновлює під час запуску. Виконайте `/acp doctor` для перевірки готовності.

OpenClaw повідомляє агентам про запуск ACP лише тоді, коли ACP **дійсно
придатний до використання**: ACP має бути ввімкнено, dispatch не має бути вимкнено,
поточна сесія не має бути заблокована пісочницею, і має бути
завантажений runtime бекенду. Якщо ці умови не виконуються, Skills plugin ACP і
вказівки ACP для `sessions_spawn` залишаються прихованими, щоб агент не пропонував
недоступний бекенд.

<AccordionGroup>
  <Accordion title="Підводні камені першого запуску">
    - Якщо встановлено `plugins.allow`, це обмежувальний інвентар plugins, і він **обов’язково** має містити `acpx`; інакше вбудоване значення за замовчуванням навмисно блокується, а `/acp doctor` повідомляє про відсутній запис у allowlist.
    - Адаптери цільових harness (Codex, Claude тощо) можуть бути завантажені за потреби через `npx` під час першого використання.
    - Автентифікація постачальника все одно має бути наявною на хості для цього harness.
    - Якщо хост не має npm або доступу до мережі, перші завантаження адаптерів завершаться невдачею, доки кеші не буде прогріто або адаптер не буде встановлено іншим способом.
  </Accordion>
  <Accordion title="Передумови runtime">
    ACP запускає реальний процес зовнішнього harness. OpenClaw керує маршрутизацією,
    станом фонового завдання, доставкою, прив’язками та політикою; harness
    керує своїм входом provider, каталогом моделей, поведінкою файлової системи та
    власними інструментами.

    Перш ніж звинувачувати OpenClaw, перевірте:

    - `/acp doctor` повідомляє про увімкнений, здоровий бекенд.
    - Цільовий id дозволений через `acp.allowedAgents`, якщо цей allowlist задано.
    - Команда harness може запускатися на хості Gateway.
    - Для цього harness наявна автентифікація provider (`claude`, `codex`, `gemini`, `opencode`, `droid` тощо).
    - Вибрана модель існує для цього harness — id моделей не є переносними між harness.
    - Запитаний `cwd` існує та доступний, або не вказуйте `cwd`, щоб бекенд використав типове значення.
    - Режим дозволів відповідає роботі. Неінтерактивні сесії не можуть натискати нативні запити дозволів, тому coding-запускам з інтенсивним записом/виконанням зазвичай потрібен профіль дозволів ACPX, який може працювати без взаємодії.

  </Accordion>
</AccordionGroup>

Інструменти plugin OpenClaw і вбудовані інструменти OpenClaw **не** відкриваються
ACP harness за замовчуванням. Увімкніть явні MCP-мости в
[ACP агенти — налаштування](/uk/tools/acp-agents-setup) лише тоді, коли
harness має викликати ці інструменти безпосередньо.

## Підтримувані цілі harness

Із вбудованим бекендом `acpx` використовуйте ці id harness як цілі
`/acp spawn <id>` або `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | Типовий бекенд                                 | Примітки                                                                              |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `claude`   | ACP-адаптер Claude Code                        | Потребує автентифікації Claude Code на хості.                                         |
| `codex`    | ACP-адаптер Codex                              | Явний резервний ACP лише тоді, коли власний `/codex` недоступний або запитано ACP.    |
| `copilot`  | ACP-адаптер GitHub Copilot                     | Потребує автентифікації Copilot CLI/runtime.                                          |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Перевизначте команду acpx, якщо локальне встановлення надає іншу точку входу ACP.     |
| `droid`    | CLI Factory Droid                              | Потребує автентифікації Factory/Droid або `FACTORY_API_KEY` у середовищі harness.     |
| `gemini`   | ACP-адаптер Gemini CLI                         | Потребує автентифікації Gemini CLI або налаштування ключа API.                        |
| `iflow`    | iFlow CLI                                      | Доступність адаптера та керування моделлю залежать від установленого CLI.             |
| `kilocode` | CLI Kilo Code                                  | Доступність адаптера та керування моделлю залежать від установленого CLI.             |
| `kimi`     | CLI Kimi/Moonshot                              | Потребує автентифікації Kimi/Moonshot на хості.                                       |
| `kiro`     | CLI Kiro                                       | Доступність адаптера та керування моделлю залежать від установленого CLI.             |
| `opencode` | ACP-адаптер OpenCode                           | Потребує автентифікації OpenCode CLI/provider.                                        |
| `openclaw` | Міст OpenClaw Gateway через `openclaw acp`     | Дозволяє ACP-сумісному harness підключатися назад до сесії OpenClaw Gateway.          |
| `pi`       | Pi/вбудований runtime OpenClaw                 | Використовується для експериментів із власними harness OpenClaw.                      |
| `qwen`     | Qwen Code / Qwen CLI                           | Потребує сумісної з Qwen автентифікації на хості.                                     |

Власні псевдоніми агентів acpx можна налаштувати в самому acpx, але політика
OpenClaw все одно перевіряє `acp.allowedAgents` і будь-яке зіставлення
`agents.list[].runtime.acp.agent` перед dispatch.

## Інструкція для оператора

Швидкий потік `/acp` із чату:

<Steps>
  <Step title="Запуск">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, або явне
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Робота">
    Продовжуйте в прив’язаній розмові або потоці (або вкажіть ключ
    сесії явно).
  </Step>
  <Step title="Перевірка стану">
    `/acp status`
  </Step>
  <Step title="Налаштування">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Коригування">
    Без заміни контексту: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Зупинка">
    `/acp cancel` (поточний хід) або `/acp close` (сесія + прив’язки).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Подробиці життєвого циклу">
    - Запуск створює або відновлює runtime-сесію ACP, записує метадані ACP у сховище сесій OpenClaw і може створити фонове завдання, якщо запуск належить батьківському елементу.
    - Прив’язані подальші повідомлення надходять безпосередньо до ACP-сесії, доки прив’язку не буде закрито, знято з фокуса, скинуто або вона не завершиться.
    - Команди Gateway залишаються локальними. `/acp ...`, `/status` і `/unfocus` ніколи не надсилаються як звичайний текст запиту до прив’язаного ACP harness.
    - `cancel` перериває активний хід, якщо бекенд підтримує скасування; це не видаляє прив’язку чи метадані сесії.
    - `close` завершує ACP-сесію з погляду OpenClaw і видаляє прив’язку. Harness усе ще може зберігати власну upstream-історію, якщо підтримує відновлення.
    - Неактивні працівники runtime підлягають очищенню після `acp.runtime.ttlMinutes`; збережені метадані сесії залишаються доступними для `/acp sessions`.
  </Accordion>
  <Accordion title="Правила маршрутизації власного Codex">
    Тригери природною мовою, які мають маршрутизуватися до **власного plugin Codex**,
    коли його увімкнено:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Власна прив’язка розмови Codex є типовим шляхом керування чатом.
    Динамічні інструменти OpenClaw усе ще виконуються через OpenClaw, тоді як
    власні інструменти Codex, як-от shell/apply-patch, виконуються всередині Codex.
    Для подій власних інструментів Codex OpenClaw інжектує
    relay нативних hooks на кожен хід, щоб hooks plugin могли блокувати `before_tool_call`, спостерігати
    `after_tool_call` і маршрутизувати події Codex `PermissionRequest`
    через механізм погодження OpenClaw. Hooks Codex `Stop` ретранслюються до
    OpenClaw `before_agent_finalize`, де plugins можуть запросити ще один
    прохід моделі перед тим, як Codex фіналізує відповідь. Relay
    навмисно залишається консервативним: він не змінює аргументи власних
    інструментів Codex і не переписує записи потоків Codex. Використовуйте явний ACP лише
    тоді, коли вам потрібна модель runtime/сесії ACP. Межа підтримки
    вбудованого Codex задокументована в
    [контракті підтримки Codex harness v1](/uk/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Шпаргалка з вибору model / provider / runtime">
    - `openai-codex/*` — шлях OAuth/підписки PI Codex.
    - `openai/*` плюс `agentRuntime.id: "codex"` — вбудований runtime власного app-server Codex.
    - `/codex ...` — власне керування розмовою Codex.
    - `/acp ...` або `runtime: "acp"` — явне керування ACP/acpx.
  </Accordion>
  <Accordion title="Тригери природною мовою для маршрутизації ACP">
    Тригери, які мають маршрутизуватися до runtime ACP:

    - "Run this as a one-shot Claude Code ACP session and summarize the result."
    - "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
    - "Run Codex through ACP in a background thread."

    OpenClaw вибирає `runtime: "acp"`, визначає `agentId` harness,
    прив’язується до поточної розмови або потоку, коли це підтримується, і
    маршрутизує подальші повідомлення до цієї сесії до закриття/завершення строку дії. Codex іде цим
    шляхом лише тоді, коли ACP/acpx задано явно або власний plugin Codex
    недоступний для запитаної операції.

    Для `sessions_spawn` `runtime: "acp"` рекламується лише тоді, коли ACP
    увімкнено, запитувач не перебуває в пісочниці та завантажено
    runtime бекенд ACP. `acp.dispatch.enabled=false` призупиняє автоматичний
    dispatch потоків ACP, але не приховує і не блокує явні
    виклики `sessions_spawn({ runtime: "acp" })`. Це націлюється на id harness ACP, такі як `codex`,
    `claude`, `droid`, `gemini` або `opencode`. Не передавайте звичайний
    id агента config OpenClaw з `agents_list`, якщо цей запис
    не налаштовано явно з `agents.list[].runtime.type="acp"`; інакше
    використовуйте типовий runtime субагента. Коли агент OpenClaw
    налаштований з `runtime.type="acp"`, OpenClaw використовує
    `runtime.acp.agent` як базовий id harness.

  </Accordion>
</AccordionGroup>

## ACP порівняно із субагентами

Використовуйте ACP, коли вам потрібен runtime зовнішнього harness. Використовуйте **власний app-server
Codex** для прив’язки/керування розмовою Codex, коли plugin `codex`
увімкнено. Використовуйте **субагентів**, коли вам потрібні власні
делеговані запуски OpenClaw.

| Область       | ACP-сесія                            | Запуск субагента                   |
| ------------- | ------------------------------------ | ---------------------------------- |
| Runtime       | plugin бекенду ACP (наприклад acpx)  | Власний runtime субагента OpenClaw |
| Ключ сесії    | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`  |
| Основні команди | `/acp ...`                         | `/subagents ...`                   |
| Інструмент запуску | `sessions_spawn` з `runtime:"acp"` | `sessions_spawn` (типовий runtime) |

Див. також [Sub-agents](/uk/tools/subagents).

## Як ACP запускає Claude Code

Для Claude Code через ACP стек такий:

1. Площина керування ACP-сесії OpenClaw.
2. Вбудований plugin runtime `acpx`.
3. ACP-адаптер Claude.
4. Машинерія runtime/сесії на боці Claude.

ACP Claude — це **сесія harness** з керуванням ACP, відновленням сесії,
відстеженням фонових завдань і необов’язковою прив’язкою розмови/потоку.

CLI-бекенди — це окремі локальні резервні runtime лише для тексту — див.
[CLI Backends](/uk/gateway/cli-backends).

Для операторів практичне правило таке:

- **Потрібні `/acp spawn`, сесії з можливістю прив’язки, керування runtime або постійна робота harness?** Використовуйте ACP.
- **Потрібен простий локальний текстовий резервний варіант через сирий CLI?** Використовуйте CLI-бекенди.

## Прив’язані сесії

### Ментальна модель

- **Поверхня чату** — місце, де люди продовжують спілкування (канал Discord, тема Telegram, чат iMessage).
- **ACP-сесія** — стійкий стан runtime Codex/Claude/Gemini, до якого маршрутизує OpenClaw.
- **Дочірній потік/тема** — необов’язкова додаткова поверхня обміну повідомленнями, що створюється лише через `--thread ...`.
- **Робочий простір runtime** — розташування у файловій системі (`cwd`, checkout репозиторію, робочий простір бекенду), де працює harness. Воно не залежить від поверхні чату.

### Прив’язки поточної розмови

`/acp spawn <harness> --bind here` прив’язує поточну розмову до
запущеної ACP-сесії — без дочірнього потоку, на тій самій поверхні чату. OpenClaw продовжує
керувати транспортом, автентифікацією, безпекою та доставкою. Подальші повідомлення в цій
розмові маршрутизуються до тієї самої сесії; `/new` і `/reset` скидають
сесію на місці; `/acp close` видаляє прив’язку.

Приклади:

```text
/codex bind                                              # власна прив’язка Codex, спрямовувати майбутні повідомлення сюди
/codex model gpt-5.4                                     # налаштувати прив’язаний власний потік Codex
/codex stop                                              # керувати активним власним ходом Codex
/acp spawn codex --bind here                             # явний резервний ACP для Codex
/acp spawn codex --thread auto                           # може створити дочірній потік/тему і прив’язати там
/acp spawn codex --bind here --cwd /workspace/repo       # та сама прив’язка чату, Codex працює в /workspace/repo
```

<AccordionGroup>
  <Accordion title="Правила прив’язки та взаємовиключність">
    - `--bind here` і `--thread ...` є взаємовиключними.
    - `--bind here` працює лише на каналах, які оголошують підтримку прив’язки поточної розмови; інакше OpenClaw повертає чітке повідомлення про непідтримуваність. Прив’язки зберігаються після перезапусків gateway.
    - У Discord `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити дочірній потік для `--thread auto|here` — не для `--bind here`.
    - Якщо ви запускаєте інший ACP-агент без `--cwd`, OpenClaw типово успадковує робочий простір **цільового агента**. Відсутні успадковані шляхи (`ENOENT`/`ENOTDIR`) переводять на типове значення бекенду; інші помилки доступу (наприклад `EACCES`) повертаються як помилки запуску.
    - Команди керування Gateway залишаються локальними в прив’язаних розмовах — команди `/acp ...` обробляються OpenClaw, навіть коли звичайний текст подальших повідомлень маршрутизується до прив’язаного ACP harness; `/status` і `/unfocus` також залишаються локальними щоразу, коли для цієї поверхні увімкнено обробку команд.
  </Accordion>
  <Accordion title="Сесії, прив’язані до потоків">
    Коли прив’язки потоків увімкнено для адаптера каналу:

    - OpenClaw прив’язує потік до цільової ACP-сесії.
    - Подальші повідомлення в цьому потоці маршрутизуються до прив’язаної ACP-сесії.
    - Вивід ACP доставляється назад у той самий потік.
    - Зняття фокуса/закриття/архівування/тайм-аут неактивності або завершення максимального віку видаляє прив’язку.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` і `/unfocus` — це команди Gateway, а не запити до ACP harness.

    Необхідні прапорці можливостей для ACP, прив’язаного до потоку:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` увімкнено за замовчуванням (задайте `false`, щоб призупинити автоматичний dispatch потоків ACP; явні виклики `sessions_spawn({ runtime: "acp" })` усе одно працюють).
    - Увімкнено прапорець створення ACP-потоків в адаптері каналу (залежить від адаптера):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Підтримка прив’язки потоків залежить від адаптера. Якщо активний
    адаптер каналу не підтримує прив’язки потоків, OpenClaw повертає чітке
    повідомлення про непідтримуваність/недоступність.

  </Accordion>
  <Accordion title="Канали з підтримкою потоків">
    - Будь-який адаптер каналу, який надає можливість прив’язки сесії/потоку.
    - Поточна вбудована підтримка: **Discord** потоки/канали, **Telegram** теми (форумні теми в групах/супергрупах і теми в DM).
    - Канали plugin можуть додати підтримку через той самий інтерфейс прив’язки.
  </Accordion>
</AccordionGroup>

## Постійні прив’язки каналів

Для неефемерних робочих процесів налаштуйте постійні прив’язки ACP у
записах верхнього рівня `bindings[]`.

### Модель прив’язки

<ParamField path="bindings[].type" type='"acp"'>
  Позначає постійну прив’язку розмови ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Ідентифікує цільову розмову. Форми для різних каналів:

- **Канал/потік Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Форумна тема Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/група BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Для стабільних прив’язок груп надавайте перевагу `chat_id:*` або `chat_identifier:*`.
- **DM/група iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Для стабільних прив’язок груп надавайте перевагу `chat_id:*`.
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  id власника-агента OpenClaw.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Необов’язкове перевизначення ACP.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  Необов’язкова мітка для операторів.
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  Необов’язковий робочий каталог runtime.
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  Необов’язкове перевизначення бекенду.
  </ParamField>

### Типові значення runtime для кожного агента

Використовуйте `agents.list[].runtime`, щоб один раз визначити типові значення ACP для кожного агента:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, наприклад `codex` або `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Пріоритет перевизначень для прив’язаних ACP-сесій:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Глобальні типові значення ACP (наприклад `acp.backend`)

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

- OpenClaw забезпечує існування налаштованої ACP-сесії перед використанням.
- Повідомлення в цьому каналі або темі маршрутизуються до налаштованої ACP-сесії.
- У прив’язаних розмовах `/new` і `/reset` скидають той самий ключ ACP-сесії на місці.
- Тимчасові прив’язки runtime (наприклад створені потоками фокусування) усе ще застосовуються, якщо вони наявні.
- Для міжагентних запусків ACP без явного `cwd` OpenClaw успадковує робочий простір цільового агента з config агента.
- Відсутні шляхи успадкованого робочого простору переводяться на типове значення cwd бекенду; помилки доступу для наявних шляхів повертаються як помилки запуску.

## Запуск ACP-сесій

Є два способи запустити ACP-сесію:

<Tabs>
  <Tab title="Із sessions_spawn">
    Використовуйте `runtime: "acp"`, щоб запускати ACP-сесію з ходу агента або
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
    `runtime` типово дорівнює `subagent`, тому для ACP-сесій явно задавайте `runtime: "acp"`.
    Якщо `agentId` не вказано, OpenClaw використовує
    `acp.defaultAgent`, якщо його налаштовано. `mode: "session"` потребує
    `thread: true`, щоб зберігати постійну прив’язану розмову.
    </Note>

  </Tab>
  <Tab title="Із команди /acp">
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
  Початковий запит, надісланий до ACP-сесії.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Для ACP-сесій має бути `"acp"`.
</ParamField>
<ParamField path="agentId" type="string">
  id цільового ACP harness. Якщо задано, інакше використовується `acp.defaultAgent`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Запитати потік прив’язки до потоку, де це підтримується.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` — одноразовий режим; `"session"` — постійний. Якщо `thread: true` і
  `mode` не вказано, OpenClaw може за замовчуванням використовувати постійну поведінку залежно від
  шляху runtime. `mode: "session"` потребує `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Запитаний робочий каталог runtime (перевіряється політикою бекенду/runtime).
  Якщо не вказано, запуск ACP успадковує робочий простір цільового агента,
  якщо його налаштовано; відсутні успадковані шляхи переводяться на типові
  значення бекенду, а справжні помилки доступу повертаються.
</ParamField>
<ParamField path="label" type="string">
  Мітка для оператора, що використовується в тексті сесії/банера.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Відновити наявну ACP-сесію замість створення нової. Агент
  відтворює історію своєї розмови через `session/load`. Потребує
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` транслює підсумки перебігу початкового запуску ACP назад до
  сесії запитувача як системні події. Допустимі відповіді включають
  `streamLogPath`, що вказує на JSONL-журнал у межах сесії
  (`<sessionId>.acp-stream.jsonl`), який можна читати в реальному часі для повної історії relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Перериває дочірній хід ACP через N секунд. `0` залишає хід на
  шляху gateway без тайм-ауту. Те саме значення застосовується до запуску Gateway
  і runtime ACP, щоб завислі harness, у яких вичерпано квоту, не
  займали смугу батьківського агента безкінечно.
</ParamField>
<ParamField path="model" type="string">
  Явне перевизначення model для дочірньої ACP-сесії. Запуски Codex ACP
  нормалізують посилання Codex OpenClaw, такі як `openai-codex/gpt-5.4`, до конфігурації запуску Codex
  ACP перед `session/new`; форми зі слешем, такі як
  `openai-codex/gpt-5.4/high`, також задають зусилля reasoning Codex ACP.
  Інші harness мають оголошувати ACP `models` і підтримувати
  `session/set_model`; інакше OpenClaw/acpx завершується з чіткою помилкою замість
  мовчазного повернення до типового агента-цілі.
</ParamField>
<ParamField path="thinking" type="string">
  Явне зусилля thinking/reasoning. Для Codex ACP `minimal` зіставляється з
  низьким рівнем effort, `low`/`medium`/`high`/`xhigh` зіставляються напряму, а `off`
  пропускає перевизначення стартового reasoning-effort.
</ParamField>

## Режими прив’язки та потоків запуску

<Tabs>
  <Tab title="--bind here|off">
    | Режим | Поведінка                                                              |
    | ----- | ---------------------------------------------------------------------- |
    | `here` | Прив’язати поточну активну розмову на місці; якщо активної немає — помилка. |
    | `off`  | Не створювати прив’язку поточної розмови.                             |

    Примітки:

    - `--bind here` — найпростіший шлях для оператора для сценарію «зробити цей канал або чат на базі Codex».
    - `--bind here` не створює дочірній потік.
    - `--bind here` доступний лише на каналах, які підтримують прив’язку поточної розмови.
    - `--bind` і `--thread` не можна поєднувати в одному виклику `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Режим | Поведінка                                                                                           |
    | ----- | --------------------------------------------------------------------------------------------------- |
    | `auto` | В активному потоці: прив’язати цей потік. Поза потоком: створити/прив’язати дочірній потік, якщо підтримується. |
    | `here` | Вимагати поточний активний потік; якщо ви не в потоці — помилка.                                   |
    | `off`  | Без прив’язки. Сесія запускається без прив’язки.                                                   |

    Примітки:

    - На поверхнях без прив’язки потоків типова поведінка фактично дорівнює `off`.
    - Запуск із прив’язкою до потоку потребує підтримки політики каналу:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Використовуйте `--bind here`, якщо хочете прив’язати поточну розмову без створення дочірнього потоку.

  </Tab>
</Tabs>

## Модель доставки

ACP-сесії можуть бути або інтерактивними робочими просторами, або
фоновою роботою, що належить батьківському елементу. Шлях доставки залежить від цієї форми.

<AccordionGroup>
  <Accordion title="Інтерактивні ACP-сесії">
    Інтерактивні сесії призначені для продовження спілкування на видимій
    поверхні чату:

    - `/acp spawn ... --bind here` прив’язує поточну розмову до ACP-сесії.
    - `/acp spawn ... --thread ...` прив’язує потік/тему каналу до ACP-сесії.
    - Постійні налаштовані `bindings[].type="acp"` маршрутизують відповідні розмови до тієї самої ACP-сесії.

    Подальші повідомлення в прив’язаній розмові маршрутизуються безпосередньо до
    ACP-сесії, а вивід ACP доставляється назад у той самий
    канал/потік/тему.

    Що OpenClaw надсилає до harness:

    - Звичайні прив’язані подальші повідомлення надсилаються як текст запиту, а вкладення — лише коли їх підтримує harness/бекенд.
    - Команди керування `/acp` і локальні команди Gateway перехоплюються до dispatch ACP.
    - Події завершення, згенеровані runtime, матеріалізуються залежно від цілі. Агенти OpenClaw отримують внутрішній envelope контексту runtime OpenClaw; зовнішні ACP harness отримують звичайний запит із результатом дочірнього елемента та інструкцією. Сирий envelope `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ніколи не має надсилатися до зовнішніх harness або зберігатися як текст користувацької стенограми ACP.
    - Записи стенограми ACP використовують видимий для користувача текст тригера або звичайний запит завершення. Внутрішні метадані подій, де можливо, залишаються структурованими в OpenClaw і не розглядаються як створений користувачем вміст чату.

  </Accordion>
  <Accordion title="Одноразові ACP-сесії, що належать батьківському елементу">
    Одноразові ACP-сесії, запущені іншим агентом, є фоновими
    дочірніми елементами, подібно до субагентів:

    - Батьківський елемент запитує роботу через `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Дочірній елемент виконується у власній ACP-сесії harness.
    - Дочірні ходи виконуються на тій самій фоновій смузі, що й власні запуски субагентів, тож повільний ACP harness не блокує непов’язану роботу основної сесії.
    - Завершення повертається через шлях сповіщення про завершення завдання. OpenClaw перетворює внутрішні метадані завершення на звичайний ACP-запит перед надсиланням до зовнішнього harness, тому harness не бачать маркерів контексту runtime, що належать лише OpenClaw.
    - Батьківський елемент переписує результат дочірнього елемента звичайним голосом помічника, коли потрібна відповідь для користувача.

    **Не** розглядайте цей шлях як peer-to-peer чат між батьківським
    і дочірнім елементами. Дочірній елемент уже має канал завершення назад до
    батьківського.

  </Accordion>
  <Accordion title="sessions_send і доставка A2A">
    `sessions_send` може націлюватися на іншу сесію після запуску. Для звичайних
    peer-сесій OpenClaw використовує шлях подальшої взаємодії agent-to-agent (A2A)
    після інжекції повідомлення:

    - Очікує на відповідь цільової сесії.
    - За потреби дає змогу запитувачу й цілі обмінятися обмеженою кількістю подальших ходів.
    - Просить цільову сесію створити повідомлення для сповіщення.
    - Доставляє це сповіщення у видимий канал або потік.

    Цей шлях A2A є резервним варіантом для peer-надсилань, коли відправнику потрібне
    видиме подальше повідомлення. Він залишається увімкненим, коли непов’язана сесія може
    бачити й надсилати повідомлення до цілі ACP, наприклад за широких
    налаштувань `tools.sessions.visibility`.

    OpenClaw пропускає подальшу взаємодію A2A лише тоді, коли запитувач є
    батьківським елементом власного одноразового дочірнього елемента ACP. У такому разі
    запуск A2A поверх завершення завдання може розбудити батьківський елемент результатом
    дочірнього, переслати відповідь батьківського назад у дочірній елемент і
    створити цикл відлуння батьківського/дочірнього елементів. Результат `sessions_send` у такому випадку
    повідомляє `delivery.status="skipped"` для цього випадку дочірнього елемента, що належить власнику, оскільки
    шлях завершення вже відповідає за результат.

  </Accordion>
  <Accordion title="Відновлення наявної сесії">
    Використовуйте `resumeSessionId`, щоб продовжити попередню ACP-сесію замість
    запуску з нуля. Агент відтворює історію своєї розмови через
    `session/load`, тож продовжує з повним контекстом попередньої роботи.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Типові сценарії використання:

    - Передати сесію Codex з ноутбука на телефон — попросіть агента продовжити з того місця, де ви зупинилися.
    - Продовжити coding-сесію, яку ви почали інтерактивно в CLI, а тепер — безголово через агента.
    - Повернутися до роботи, яку було перервано через перезапуск gateway або тайм-аут бездіяльності.

    Примітки:

    - `resumeSessionId` потребує `runtime: "acp"` — повертає помилку, якщо використовується з runtime субагента.
    - `resumeSessionId` відновлює upstream-історію розмови ACP; `thread` і `mode` як і раніше застосовуються до нової сесії OpenClaw, яку ви створюєте, тому `mode: "session"` усе ще потребує `thread: true`.
    - Цільовий агент має підтримувати `session/load` (Codex і Claude Code підтримують).
    - Якщо id сесії не знайдено, запуск завершується з чіткою помилкою — без мовчазного повернення до нової сесії.

  </Accordion>
  <Accordion title="Smoke test після розгортання">
    Після розгортання gateway виконайте live-перевірку end-to-end замість
    довіри лише до модульних тестів:

    1. Перевірте версію розгорнутого gateway і коміт на цільовому хості.
    2. Відкрийте тимчасову bridge-сесію ACPX до live-агента.
    3. Попросіть цього агента викликати `sessions_spawn` з `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` і завданням `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Переконайтеся, що є `accepted=yes`, реальний `childSessionKey` і немає помилки validator.
    5. Приберіть тимчасову bridge-сесію.

    Тримайте перевірку на `mode: "run"` і пропускайте `streamTo: "parent"` —
    шляхи `mode: "session"`, прив’язані до потоку, і stream-relay — це окремі
    ширші інтеграційні перевірки.

  </Accordion>
</AccordionGroup>

## Сумісність із пісочницею

ACP-сесії наразі виконуються в runtime хоста, **а не** всередині
пісочниці OpenClaw.

<Warning>
**Межа безпеки:**

- Зовнішній harness може читати/записувати відповідно до власних дозволів CLI та вибраного `cwd`.
- Політика пісочниці OpenClaw **не** обгортає виконання ACP harness.
- OpenClaw усе ще забезпечує feature gates ACP, дозволені агенти, володіння сесіями, прив’язки каналів і політику доставки Gateway.
- Використовуйте `runtime: "subagent"` для власної роботи OpenClaw із примусовим застосуванням пісочниці.
  </Warning>

Поточні обмеження:

- Якщо сесія запитувача знаходиться в пісочниці, запуски ACP блокуються як для `sessions_spawn({ runtime: "acp" })`, так і для `/acp spawn`.
- `sessions_spawn` з `runtime: "acp"` не підтримує `sandbox: "require"`.

## Визначення цільової сесії

Більшість дій `/acp` приймають необов’язкову ціль сесії (`session-key`,
`session-id` або `session-label`).

**Порядок визначення:**

1. Явний аргумент цілі (або `--session` для `/acp steer`)
   - спочатку пробує ключ
   - потім session id у форматі UUID
   - потім мітку
2. Поточна прив’язка потоку (якщо ця розмова/потік прив’язані до ACP-сесії).
3. Резервний варіант — поточна сесія запитувача.

Прив’язки поточної розмови й прив’язки потоків обидві беруть участь у
кроці 2.

Якщо жодну ціль не вдається визначити, OpenClaw повертає чітку помилку
(`Unable to resolve session target: ...`).

## Елементи керування ACP

| Команда              | Що вона робить                                            | Приклад                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Створює ACP-сесію; необов’язкова поточна прив’язка або прив’язка до потоку. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Скасовує хід у процесі для цільової сесії.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Надсилає інструкцію steer до запущеної сесії.             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Закриває сесію та відв’язує цілі потоків.                 | `/acp close`                                                  |
| `/acp status`        | Показує бекенд, режим, стан, параметри runtime, можливості. | `/acp status`                                               |
| `/acp set-mode`      | Установлює режим runtime для цільової сесії.              | `/acp set-mode plan`                                          |
| `/acp set`           | Універсальний запис параметра конфігурації runtime.       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Установлює перевизначення робочого каталогу runtime.      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Установлює профіль політики погодження.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Установлює тайм-аут runtime (секунди).                    | `/acp timeout 120`                                            |
| `/acp model`         | Установлює перевизначення моделі runtime.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Видаляє перевизначення параметрів runtime для сесії.      | `/acp reset-options`                                          |
| `/acp sessions`      | Показує список нещодавніх ACP-сесій зі сховища.           | `/acp sessions`                                               |
| `/acp doctor`        | Стан бекенду, можливості, дії для виправлення.            | `/acp doctor`                                                 |
| `/acp install`       | Виводить детерміновані кроки встановлення й увімкнення.   | `/acp install`                                                |

`/acp status` показує фактичні параметри runtime, а також ідентифікатори сесії
на рівні runtime і бекенду. Помилки unsupported-control чітко
повідомляються, коли бекенд не має потрібної можливості. `/acp sessions` читає
сховище для поточної прив’язаної сесії або сесії запитувача; токени цілі
(`session-key`, `session-id` або `session-label`) визначаються через
виявлення сесій gateway, включно з користувацькими коренями `session.store`
для окремих агентів.

### Зіставлення параметрів runtime

`/acp` має зручні команди й універсальний setter. Еквівалентні
операції:

| Команда                      | Зіставляється з                      | Примітки                                                                                                                                                                         |
| ---------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ключем конфігурації runtime `model`  | Для Codex ACP OpenClaw нормалізує `openai-codex/<model>` до id моделі адаптера та зіставляє суфікси reasoning зі слешем, такі як `openai-codex/gpt-5.4/high`, з `reasoning_effort`. |
| `/acp set thinking <level>`  | ключем конфігурації runtime `thinking` | Для Codex ACP OpenClaw надсилає відповідний `reasoning_effort`, якщо адаптер його підтримує.                                                                                   |
| `/acp permissions <profile>` | ключем конфігурації runtime `approval_policy` | —                                                                                                                                                                        |
| `/acp timeout <seconds>`     | ключем конфігурації runtime `timeout` | —                                                                                                                                                                          |
| `/acp cwd <path>`            | перевизначенням cwd runtime          | Пряме оновлення.                                                                                                                                                                 |
| `/acp set <key> <value>`     | універсально                         | `key=cwd` використовує шлях перевизначення cwd.                                                                                                                                  |
| `/acp reset-options`         | очищає всі перевизначення runtime    | —                                                                                                                                                                                |

## acpx harness, налаштування plugin і дозволи

Щоб дізнатися про конфігурацію harness acpx (псевдоніми Claude Code / Codex / Gemini CLI),
MCP-мости для інструментів plugin та інструментів OpenClaw, а також режими дозволів ACP,
див.
[ACP агенти — налаштування](/uk/tools/acp-agents-setup).

## Усунення проблем

| Симптом                                                                     | Імовірна причина                                                                | Виправлення                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | plugin бекенду відсутній, вимкнений або заблокований через `plugins.allow`.     | Установіть і ввімкніть plugin бекенду, додайте `acpx` до `plugins.allow`, якщо цей allowlist задано, а потім виконайте `/acp doctor`.                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP глобально вимкнено.                                                         | Установіть `acp.enabled=true`.                                                                                                                                            |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Автоматичний dispatch зі звичайних повідомлень у потоках вимкнено.              | Установіть `acp.dispatch.enabled=true`, щоб відновити автоматичну маршрутизацію потоків; явні виклики `sessions_spawn({ runtime: "acp" })` усе одно працюють.           |
| `ACP agent "<id>" is not allowed by policy`                                 | Агента немає в allowlist.                                                       | Використайте дозволений `agentId` або оновіть `acp.allowedAgents`.                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | Перевірка залежностей plugin або самовідновлення все ще триває.                 | Трохи зачекайте й повторно виконайте `/acp doctor`; якщо стан нездоровий не зникає, перевірте помилку встановлення бекенду та політику allow/deny plugin.               |
| Harness command not found                                                   | CLI адаптера не встановлено або перше завантаження через `npx` не вдалося.      | Установіть/прогрійте адаптер на хості Gateway або явно налаштуйте команду агента acpx.                                                                                   |
| Model-not-found from the harness                                            | id моделі дійсний для іншого provider/harness, але не для цієї ACP-цілі.        | Використайте модель, яку показує цей harness, налаштуйте модель у harness або не задавайте перевизначення.                                                               |
| Vendor auth error from the harness                                          | OpenClaw працює нормально, але цільовий CLI/provider не увійшов у систему.      | Увійдіть у систему або надайте потрібний ключ provider у середовищі хоста Gateway.                                                                                       |
| `Unable to resolve session target: ...`                                     | Неправильний токен key/id/label.                                                | Виконайте `/acp sessions`, скопіюйте точний key/label і повторіть спробу.                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` використано без активної розмови, яку можна прив’язати.           | Перейдіть у цільовий чат/канал і повторіть спробу або використайте запуск без прив’язки.                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | Адаптер не має можливості ACP-прив’язки поточної розмови.                       | Використовуйте `/acp spawn ... --thread ...`, де це підтримується, налаштуйте `bindings[]` верхнього рівня або перейдіть у підтримуваний канал.                         |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` використано поза контекстом потоку.                             | Перейдіть у цільовий потік або використайте `--thread auto`/`off`.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Активна ціль прив’язки належить іншому користувачу.                             | Переприв’яжіть як власник або використайте іншу розмову чи потік.                                                                                                         |
| `Thread bindings are unavailable for <channel>.`                            | Адаптер не має можливості прив’язки потоків.                                    | Використовуйте `--thread off` або перейдіть до підтримуваного адаптера/каналу.                                                                                            |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | runtime ACP працює на хості; сесія запитувача знаходиться в пісочниці.          | Використовуйте `runtime="subagent"` із сесій у пісочниці або запускайте ACP із сесії поза пісочницею.                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Для runtime ACP запитано `sandbox="require"`.                                   | Використовуйте `runtime="subagent"` для обов’язкової пісочниці або ACP із `sandbox="inherit"` із сесії поза пісочницею.                                                  |
| `Cannot apply --model ... did not advertise model support`                  | Цільовий harness не надає загального ACP-перемикання model.                     | Використовуйте harness, який оголошує ACP `models`/`session/set_model`, використовуйте посилання на моделі Codex ACP або налаштуйте модель безпосередньо в harness, якщо він має власний прапорець запуску. |
| Missing ACP metadata for bound session                                      | Застарілі/видалені метадані ACP-сесії.                                          | Створіть знову через `/acp spawn`, а потім повторно прив’яжіть/сфокусуйте потік.                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` блокує запис/виконання в неінтерактивній ACP-сесії.            | Установіть `plugins.entries.acpx.config.permissionMode` у `approve-all` і перезапустіть gateway. Див. [Permission configuration](/uk/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Запити дозволів блокуються через `permissionMode`/`nonInteractivePermissions`.  | Перевірте журнали gateway на `AcpRuntimeError`. Для повних дозволів установіть `permissionMode=approve-all`; для м’якого деградування установіть `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Процес harness завершився, але ACP-сесія не повідомила про завершення.          | Контролюйте через `ps aux \| grep acpx`; завершіть застарілі процеси вручну.                                                                                              |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Внутрішній envelope події витік через межу ACP.                                 | Оновіть OpenClaw і повторно виконайте потік завершення; зовнішні harness мають отримувати лише звичайні запити завершення.                                               |

## Пов’язані матеріали

- [ACP агенти — налаштування](/uk/tools/acp-agents-setup)
- [Agent send](/uk/tools/agent-send)
- [CLI Backends](/uk/gateway/cli-backends)
- [Codex harness](/uk/plugins/codex-harness)
- [Multi-agent sandbox tools](/uk/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (режим мосту)](/uk/cli/acp)
- [Sub-agents](/uk/tools/subagents)
