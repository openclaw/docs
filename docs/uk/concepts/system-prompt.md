---
read_when:
    - Редагування тексту системного промпта, списку інструментів або розділів часу/Heartbeat
    - Зміна поведінки ініціалізації робочого простору або ін’єкції Skills
summary: Що містить системний промпт OpenClaw і як його формують
title: Системний промпт
x-i18n:
    generated_at: "2026-05-02T22:39:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw створює власний системний prompt для кожного запуску агента. Prompt є **власністю OpenClaw** і не використовує типовий prompt pi-coding-agent.

Prompt збирається OpenClaw і впроваджується в кожен запуск агента.

Provider plugins можуть додавати cache-aware вказівки до prompt без заміни
повного prompt, що належить OpenClaw. Provider runtime може:

- замінювати невеликий набір іменованих основних розділів (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- вставляти **стабільний префікс** над межею кешу prompt
- вставляти **динамічний суфікс** під межею кешу prompt

Використовуйте внески, що належать provider, для налаштувань, специфічних для сімейств моделей. Залишайте застарілу
мутацію prompt `before_prompt_build` для сумісності або справді глобальних змін prompt,
а не для звичайної поведінки provider.

Overlay сімейства OpenAI GPT-5 зберігає основне правило виконання малим і додає
специфічні для моделі вказівки для persona latching, стислого виводу, дисципліни роботи з інструментами,
паралельного пошуку, покриття deliverable, перевірки, відсутнього контексту та
гігієни terminal-tool.

## Структура

Prompt навмисно компактний і використовує фіксовані розділи:

- **Інструменти**: нагадування про джерело істини для structured-tool плюс runtime-вказівки щодо використання інструментів.
- **Пріоритет виконання**: компактні вказівки щодо доведення до кінця: діяти в межах поточного turn для
  actionable requests, продовжувати до завершення або блокування, відновлюватися після слабких результатів інструментів,
  перевіряти мінливий стан наживо та перевіряти перед фіналізацією.
- **Безпека**: коротке нагадування guardrail, щоб уникати power-seeking behavior або обходу oversight.
- **Skills** (коли доступні): пояснює моделі, як завантажувати інструкції Skills на вимогу.
- **Самооновлення OpenClaw**: як безпечно перевіряти config за допомогою
  `config.schema.lookup`, змінювати config через `config.patch`, замінювати повний
  config через `config.apply` і запускати `update.run` лише за явним запитом користувача.
  Інструмент `gateway`, доступний лише owner, також відмовляється переписувати
  `tools.exec.ask` / `tools.exec.security`, включно із застарілими псевдонімами `tools.bash.*`,
  які нормалізуються до цих захищених exec-шляхів.
- **Workspace**: робочий каталог (`agents.defaults.workspace`).
- **Документація**: локальний шлях до документації OpenClaw (репозиторій або npm-пакет) і коли її читати.
- **Файли Workspace (вставлені)**: вказує, що bootstrap-файли включено нижче.
- **Sandbox** (коли ввімкнено): вказує sandboxed runtime, sandbox paths і чи доступний elevated exec.
- **Поточна дата й час**: локальний час користувача, часовий пояс і формат часу.
- **Reply Tags**: необов’язковий синтаксис reply tag для підтримуваних providers.
- **Heartbeats**: prompt Heartbeat і поведінка ack, коли Heartbeats увімкнено для default agent.
- **Runtime**: host, OS, Node, model, repo root (коли виявлено), thinking level (один рядок).
- **Reasoning**: поточний рівень видимості + підказка перемикача /reasoning.

OpenClaw тримає великий стабільний вміст, зокрема **Project Context**, над
внутрішньою межею кешу prompt. Мінливі розділи каналу/сесії, як-от
вбудовані вказівки Control UI, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats** і **Runtime**, додаються під цією межею,
щоб локальні бекенди з prefix cache могли повторно використовувати стабільний префікс workspace
між turns каналу. Описи інструментів так само мають уникати вбудовування поточних
назв каналів, коли прийнята schema вже несе цю runtime-деталь.

Розділ Tooling також містить runtime-вказівки для тривалої роботи:

- використовувати Cron для майбутнього follow-up (`check back later`, reminders, recurring work)
  замість циклів `exec` sleep, delay tricks `yieldMs` або повторного polling `process`
- використовувати `exec` / `process` лише для команд, які стартують зараз і продовжують виконуватися
  у фоновому режимі
- коли ввімкнено automatic completion wake, запускати команду один раз і покладатися на
  push-based wake path, коли вона виводить output або завершується з помилкою
- використовувати `process` для логів, status, input або intervention, коли потрібно
  перевірити команду, що виконується
- якщо завдання більше, віддавати перевагу `sessions_spawn`; завершення sub-agent є
  push-based і автоматично повідомляє requester
- не опитувати `subagents list` / `sessions_list` у циклі лише для очікування
  завершення

Коли експериментальний інструмент `update_plan` увімкнено, Tooling також каже
моделі використовувати його лише для нетривіальної багатоетапної роботи, тримати рівно один
крок `in_progress` і не повторювати весь план після кожного оновлення.

Safety guardrails у системному prompt мають рекомендаційний характер. Вони спрямовують поведінку моделі, але не забезпечують примусове дотримання політик. Для жорсткого enforcement використовуйте tool policy, exec approvals, sandboxing і channel allowlists; оператори можуть вимикати їх за задумом.

На каналах із native approval cards/buttons runtime prompt тепер каже
агенту спершу покладатися на цей native approval UI. Він має включати ручну
команду `/approve` лише тоді, коли результат інструмента каже, що chat approvals недоступні або
manual approval є єдиним шляхом.

## Режими prompt

OpenClaw може відтворювати менші системні prompts для sub-agents. Runtime задає
`promptMode` для кожного запуску (це не user-facing config):

- `full` (default): включає всі розділи вище.
- `minimal`: використовується для sub-agents; пропускає **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** і **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (коли відомо), Runtime і вставлений
  context залишаються доступними.
- `none`: повертає лише базовий рядок identity.

Коли `promptMode=minimal`, додаткові вставлені prompts позначаються як **Subagent
Context** замість **Group Chat Context**.

Для запусків channel auto-reply OpenClaw може пропускати загальний розділ **Silent Replies**,
коли контекст direct/group chat уже містить визначену для цієї розмови
поведінку `NO_REPLY`. Це уникає повторення token mechanics
і в глобальному системному prompt, і в контексті каналу.

## Знімки prompt

OpenClaw зберігає закомічені знімки prompt для happy path Codex runtime у
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Вони відтворюють
вибрані params thread/turn app-server плюс реконструйований stack шарів prompt, прив’язаних до моделі,
для Telegram direct, Discord group і Heartbeat turns. Цей stack
містить закріплений fixture model prompt Codex `gpt-5.5`, згенерований із форми
model catalog/cache Codex, developer text permission happy-path Codex,
інструкції OpenClaw для developer, user turn input і посилання на динамічні
tool specs.

Оновіть закріплений fixture Codex model prompt за допомогою
`pnpm prompt:snapshots:sync-codex-model`. За замовчуванням скрипт шукає
runtime cache Codex у `$CODEX_HOME/models_cache.json`, потім
`~/.codex/models_cache.json`, і лише після цього переходить до конвенції checkout Codex
maintainer за адресою `~/code/codex/codex-rs/models-manager/models.json`. Якщо
жодного з цих джерел не існує, команда завершується без зміни закоміченого
fixture. Передайте `--catalog <path>`, щоб оновити з конкретного файлу `models_cache.json`
або `models.json`.

Ці знімки все ще не є byte-for-byte raw OpenAI request capture. Codex
може додавати workspace context, що належить runtime, як-от `AGENTS.md`, environment
context, memories, інструкції app/plugin і майбутні collaboration-mode
instructions усередині Codex runtime після того, як OpenClaw надішле params thread і turn.

Повторно згенеруйте їх за допомогою `pnpm prompt:snapshots:gen` і перевірте drift через
`pnpm prompt:snapshots:check`. CI запускає drift check у додатковому
boundary shard, щоб зміни prompt і оновлення snapshot залишалися прикріпленими до того самого
PR.

## Вставлення Workspace bootstrap

Bootstrap-файли обрізаються й додаються в **Project Context**, щоб модель бачила identity і profile context без потреби в явному читанні:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (лише в абсолютно нових workspaces)
- `MEMORY.md`, коли наявний

Усі ці файли **вставляються у context window** на кожному turn, якщо
не застосовується специфічний для файлу gate. `HEARTBEAT.md` пропускається у звичайних запусках, коли
Heartbeats вимкнено для default agent або
`agents.defaults.heartbeat.includeSystemPromptSection` має значення false. Тримайте вставлені
файли стислими — особливо `MEMORY.md`, який може зростати з часом і призводити до
неочікувано великого використання контексту та частішого Compaction.

Коли сесія працює на native Codex harness, Codex завантажує `AGENTS.md`
через власне discovery project-doc. OpenClaw все ще знаходить решту
bootstrap-файлів і передає їх як config instructions Codex, тому `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` і
`MEMORY.md` зберігають ту саму роль workspace-context без дублювання
`AGENTS.md`.

<Note>
Щоденні файли `memory/*.md` **не** є частиною звичайного bootstrap Project Context. У звичайних turns до них звертаються на вимогу через інструменти `memory_search` і `memory_get`, тому вони не враховуються в context window, якщо модель явно їх не читає. Голі turns `/new` і `/reset` є винятком: runtime може додати recent daily memory на початок як одноразовий блок startup-context для цього першого turn.
</Note>

Великі файли обрізаються з маркером. Максимальний розмір на файл контролюється
`agents.defaults.bootstrapMaxChars` (default: 12000). Загальний вставлений bootstrap
content по всіх файлах обмежений `agents.defaults.bootstrapTotalMaxChars`
(default: 60000). Відсутні файли вставляють короткий missing-file marker. Коли відбувається truncation,
OpenClaw може вставити warning block у Project Context; керуйте цим через
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
default: `once`).

Сесії sub-agent вставляють лише `AGENTS.md` і `TOOLS.md` (інші bootstrap-файли
фільтруються, щоб зберегти context sub-agent малим).

Внутрішні hooks можуть перехоплювати цей крок через `agent:bootstrap`, щоб змінити або замінити
вставлені bootstrap-файли (наприклад, замінити `SOUL.md` на альтернативну persona).

Якщо ви хочете зробити звучання агента менш generic, почніть із
[Посібника з особистості SOUL.md](/uk/concepts/soul).

Щоб перевірити, скільки вносить кожен вставлений файл (raw проти injected, truncation, плюс overhead tool schema), використовуйте `/context list` або `/context detail`. Див. [Context](/uk/concepts/context).

## Обробка часу

Системний prompt включає окремий розділ **Current Date & Time**, коли
часовий пояс користувача відомий. Щоб зберегти prompt cache-stable, тепер він містить лише
**часовий пояс** (без динамічного годинника або формату часу).

Використовуйте `session_status`, коли агенту потрібен поточний час; status card
містить рядок timestamp. Той самий інструмент може необов’язково встановити per-session model
override (`model=default` очищає його).

Налаштуйте через:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Повні деталі поведінки див. у [Date & Time](/uk/date-time).

## Skills

Коли існують придатні Skills, OpenClaw вставляє компактний **список доступних Skills**
(`formatSkillsForPrompt`), який містить **шлях до файлу** для кожного Skill. Prompt
інструктує модель використовувати `read`, щоб завантажити SKILL.md у вказаному
розташуванні (workspace, managed або bundled). Якщо придатних Skills немає, розділ
Skills пропускається.

Придатність охоплює metadata gates Skills, перевірки runtime environment/config
і ефективний agent skill allowlist, коли налаштовано `agents.defaults.skills` або
`agents.list[].skills`.

Skills, що постачаються з Plugin, придатні лише тоді, коли їхній власний Plugin увімкнено.
Це дає tool plugins змогу надавати глибші операційні посібники без вбудовування всіх
цих вказівок безпосередньо в кожен опис інструмента.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Це зберігає базовий prompt малим, але все одно дає змогу використовувати цільові Skills.

Бюджет списку Skills належить підсистемі Skills:

- Глобальне default: `skills.limits.maxSkillsPromptChars`
- Per-agent override: `agents.list[].skillsLimits.maxSkillsPromptChars`

Загальні обмежені runtime excerpts використовують іншу surface:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Такий поділ відокремлює визначення розміру Skills від визначення розміру читання/ін’єкції під час виконання, як-от `memory_get`, результати інструментів наживо та оновлення AGENTS.md після Compaction.

## Документація

Системний промпт містить розділ **Документація**. Коли локальна документація доступна, він указує на локальний каталог документації OpenClaw (`docs/` у Git checkout або документація, вбудована в npm-пакет). Якщо локальна документація недоступна, він використовує резервний варіант
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Той самий розділ також містить розташування вихідного коду OpenClaw. Git checkout відкриває локальний корінь вихідного коду, щоб агент міг безпосередньо переглядати код. Установлення з пакета містять GitHub URL вихідного коду й указують агенту переглядати джерело там, коли документація неповна або застаріла. Промпт також згадує публічне дзеркало документації, спільноту Discord і ClawHub
([https://clawhub.ai](https://clawhub.ai)) для пошуку Skills. Він указує моделі спочатку звертатися до документації щодо поведінки, команд, конфігурації або архітектури OpenClaw, а також самостійно запускати `openclaw status`, коли це можливо (запитуючи користувача лише тоді, коли їй бракує доступу).
Саме для конфігурації він скеровує агентів до дії інструмента `gateway`
`config.schema.lookup` для точної документації на рівні полів і обмежень, а потім до
`docs/gateway/configuration.md` і `docs/gateway/configuration-reference.md`
для ширших рекомендацій.

## Пов’язане

- [Середовище виконання агента](/uk/concepts/agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Рушій контексту](/uk/concepts/context-engine)
