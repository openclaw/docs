---
read_when:
    - Редагування тексту системного промпта, списку інструментів або розділів часу/Heartbeat
    - Зміна поведінки початкового налаштування робочого простору або впровадження Skills
summary: Що містить системний промпт OpenClaw і як він збирається
title: Системний промпт
x-i18n:
    generated_at: "2026-05-03T17:03:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw створює власний системний prompt для кожного запуску агента. Prompt **належить OpenClaw** і не використовує типовий prompt pi-coding-agent.

Prompt збирається OpenClaw і вставляється в кожен запуск агента.

Provider plugins можуть додавати cache-aware інструкції для prompt без заміни
повного prompt, що належить OpenClaw. Provider runtime може:

- замінити невеликий набір іменованих основних секцій (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- вставити **стабільний префікс** над межею кешу prompt
- вставити **динамічний суфікс** під межею кешу prompt

Використовуйте внески, що належать provider, для налаштувань, специфічних для сімейств моделей. Залишайте застарілу
мутацію prompt `before_prompt_build` для сумісності або справді глобальних змін prompt,
а не для звичайної поведінки provider.

Оверлей сімейства OpenAI GPT-5 зберігає основне правило виконання малим і додає
специфічні для моделі інструкції щодо фіксації persona, стислого виводу, дисципліни інструментів,
паралельного пошуку, покриття результатів, перевірки, відсутнього контексту та
гігієни terminal-tool.

## Структура

Prompt навмисно компактний і використовує фіксовані секції:

- **Інструменти**: нагадування про structured-tool як джерело істини плюс runtime-інструкції з використання інструментів.
- **Схильність до виконання**: компактні інструкції щодо доведення до кінця: діяти в межах поточного ходу на
  actionable запити, продовжувати до завершення або блокування, відновлюватися після слабких результатів інструментів,
  перевіряти змінний стан наживо та верифікувати перед фіналізацією.
- **Безпека**: коротке нагадування guardrail, щоб уникати power-seeking поведінки або обходу нагляду.
- **Skills** (коли доступні): пояснює моделі, як завантажувати інструкції Skills на вимогу.
- **Самооновлення OpenClaw**: як безпечно інспектувати config через
  `config.schema.lookup`, виправляти config через `config.patch`, замінювати повний
  config через `config.apply` і запускати `update.run` лише на явний запит користувача.
  Інструмент `gateway` лише для owner також відмовляється переписувати
  `tools.exec.ask` / `tools.exec.security`, включно із застарілими alias `tools.bash.*`,
  які нормалізуються до цих захищених exec-шляхів.
- **Робоча область**: робочий каталог (`agents.defaults.workspace`).
- **Документація**: локальний шлях до документації OpenClaw (repo або npm package) і коли її читати.
- **Файли робочої області (вставлені)**: вказує, що bootstrap-файли додано нижче.
- **Пісочниця** (коли ввімкнено): вказує sandboxed runtime, шляхи sandbox і чи доступний elevated exec.
- **Поточні дата й час**: локальний час користувача, часовий пояс і формат часу.
- **Теги відповіді**: необов’язковий синтаксис тегів відповіді для підтримуваних provider.
- **Heartbeats**: prompt Heartbeat і поведінка ack, коли Heartbeat увімкнено для типового агента.
- **Runtime**: host, OS, Node, модель, корінь repo (коли виявлено), рівень мислення (один рядок).
- **Міркування**: поточний рівень видимості + підказка перемикача /reasoning.

OpenClaw тримає великий стабільний контент, включно з **Контекстом проєкту**, над
внутрішньою межею кешу prompt. Нестабільні секції каналу/сесії, такі як
інструкції embedding Control UI, **Повідомлення**, **Голос**, **Контекст групового чату**,
**Реакції**, **Heartbeats** і **Runtime**, додаються під цією межею,
щоб локальні backend з prefix cache могли повторно використовувати стабільний префікс робочої області
між ходами каналу. Описи інструментів так само мають уникати вбудовування поточних
назв каналів, коли прийнята schema вже містить цю runtime-деталь.

Секція Інструментів також містить runtime-інструкції для довготривалої роботи:

- використовуйте cron для майбутніх follow-up (`check back later`, нагадування, recurring work)
  замість sleep loops через `exec`, трюків із затримкою `yieldMs` або повторного polling `process`
- використовуйте `exec` / `process` лише для команд, які запускаються зараз і продовжують працювати
  у фоновому режимі
- коли ввімкнено автоматичне пробудження після завершення, запустіть команду один раз і покладайтеся на
  push-based wake path, коли вона виводить output або завершується з помилкою
- використовуйте `process` для logs, status, input або intervention, коли потрібно
  інспектувати запущену команду
- якщо завдання більше, надавайте перевагу `sessions_spawn`; завершення sub-agent є
  push-based і автоматично оголошується requester
- не опитуйте `subagents list` / `sessions_list` у циклі лише для очікування
  завершення

Коли ввімкнено експериментальний інструмент `update_plan`, Інструменти також вказують
моделі використовувати його лише для нетривіальної багатокрокової роботи, тримати рівно один
крок `in_progress` і не повторювати весь план після кожного оновлення.

Safety guardrails у системному prompt мають рекомендаційний характер. Вони спрямовують поведінку моделі, але не забезпечують примусового виконання policy. Для жорсткого enforcement використовуйте tool policy, exec approvals, sandboxing і channel allowlists; operators можуть вимикати їх за задумом.

У каналах із native approval cards/buttons runtime prompt тепер каже
агентові спочатку покладатися на цей native approval UI. Він має включати ручну
команду `/approve` лише тоді, коли результат інструмента каже, що chat approvals недоступні або
manual approval є єдиним шляхом.

## Режими prompt

OpenClaw може рендерити менші системні prompt для sub-agents. Runtime встановлює
`promptMode` для кожного запуску (це не user-facing config):

- `full` (типово): включає всі секції вище.
- `minimal`: використовується для sub-agents; пропускає **Skills**, **Memory Recall**, **Самооновлення OpenClaw**,
  **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** і **Heartbeats**. Інструменти, **Безпека**,
  Робоча область, Sandbox, Поточні дата й час (коли відомо), Runtime і вставлений
  context залишаються доступними.
- `none`: повертає лише базовий рядок identity.

Коли `promptMode=minimal`, додаткові вставлені prompt позначаються як **Subagent
Context** замість **Group Chat Context**.

Для запусків channel auto-reply OpenClaw може пропускати загальну секцію **Silent Replies**,
коли direct/group chat context уже містить вирішену
специфічну для розмови поведінку `NO_REPLY`. Це уникає повторення механіки token
і в глобальному системному prompt, і в channel context.

## Знімки prompt

OpenClaw зберігає committed prompt snapshots для Codex runtime happy path у
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Вони рендерять
вибрані app-server thread/turn params плюс реконструйований model-bound prompt
layer stack для Telegram direct, Discord group і heartbeat turns. Цей stack
містить pinned Codex `gpt-5.5` model prompt fixture, згенерований з форми model catalog/cache Codex,
developer text дозволів Codex happy-path,
інструкції developer OpenClaw, turn-scoped інструкції collaboration-mode,
коли OpenClaw їх надає, user turn input і посилання на dynamic tool
specs.

Оновіть pinned Codex model prompt fixture через
`pnpm prompt:snapshots:sync-codex-model`. Типово script шукає
runtime cache Codex у `$CODEX_HOME/models_cache.json`, потім
`~/.codex/models_cache.json`, і лише після цього fallback до домовленості maintainer Codex
checkout у `~/code/codex/codex-rs/models-manager/models.json`. Якщо
жодне з цих джерел не існує, команда завершується без зміни committed
fixture. Передайте `--catalog <path>`, щоб оновити зі specific `models_cache.json`
або `models.json` file.

Ці snapshots усе ще не є byte-for-byte raw OpenAI request capture. Codex
може додавати runtime-owned workspace context, такий як `AGENTS.md`, environment
context, memories, app/plugin instructions і вбудовані Default
collaboration-mode instructions усередині Codex runtime після того, як OpenClaw надсилає
thread і turn params.

Перегенеруйте їх за допомогою `pnpm prompt:snapshots:gen` і перевірте drift через
`pnpm prompt:snapshots:check`. CI запускає drift check у додатковому
boundary shard, щоб зміни prompt і snapshot updates залишалися прив’язаними до того самого
PR.

## Bootstrap-вставка робочої області

Bootstrap-файли обрізаються та додаються під **Контекстом проєкту**, щоб модель бачила identity і profile context без потреби явних reads:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (лише для абсолютно нових робочих областей)
- `MEMORY.md`, коли наявний

Усі ці файли **вставляються у context window** на кожному ході, якщо
не застосовується file-specific gate. `HEARTBEAT.md` пропускається у звичайних запусках, коли
heartbeats вимкнено для типового агента або
`agents.defaults.heartbeat.includeSystemPromptSection` має значення false. Тримайте вставлені
файли стислими — особливо `MEMORY.md`, який може з часом зростати й призводити до
неочікувано високого використання context і частішої Compaction.

Коли сесія працює на native Codex harness, Codex завантажує `AGENTS.md`
через власне project-doc discovery. OpenClaw все одно визначає решту
bootstrap-файлів і передає їх як Codex config instructions, тому `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` і
`MEMORY.md` зберігають ту саму роль workspace-context без дублювання
`AGENTS.md`.

<Note>
Щоденні файли `memory/*.md` **не** є частиною звичайного bootstrap Project Context. У звичайних ходах до них звертаються за потреби через інструменти `memory_search` і `memory_get`, тому вони не враховуються в context window, якщо модель явно їх не читає. Bare `/new` і `/reset` turns є винятком: runtime може додати recent daily memory як одноразовий startup-context block для цього першого turn.
</Note>

Великі файли обрізаються з marker. Максимальний розмір на файл контролюється
`agents.defaults.bootstrapMaxChars` (типово: 12000). Загальний вставлений bootstrap
content по всіх файлах обмежується `agents.defaults.bootstrapTotalMaxChars`
(типово: 60000). Відсутні файли вставляють короткий missing-file marker. Коли відбувається truncation,
OpenClaw може вставити warning block у Project Context; керуйте цим через
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
типово: `once`).

Сесії sub-agent вставляють лише `AGENTS.md` і `TOOLS.md` (інші bootstrap-файли
відфільтровуються, щоб тримати context sub-agent малим).

Internal hooks можуть перехоплювати цей крок через `agent:bootstrap`, щоб змінити або замінити
вставлені bootstrap-файли (наприклад, замінити `SOUL.md` на alternate persona).

Якщо ви хочете, щоб агент звучав менш generic, почніть із
[Посібника з особистості SOUL.md](/uk/concepts/soul).

Щоб перевірити, скільки додає кожен вставлений файл (raw vs injected, truncation, плюс tool schema overhead), використовуйте `/context list` або `/context detail`. Див. [Контекст](/uk/concepts/context).

## Обробка часу

Системний prompt включає спеціальну секцію **Поточні дата й час**, коли
часовий пояс користувача відомий. Щоб зберегти prompt cache-stable, тепер вона містить лише
**часовий пояс** (без динамічного clock або формату часу).

Використовуйте `session_status`, коли агенту потрібен поточний час; status card
містить timestamp line. Той самий інструмент може необов’язково встановити per-session model
override (`model=default` очищає його).

Налаштовується через:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Повний опис поведінки див. у [Дата й час](/uk/date-time).

## Skills

Коли існують eligible Skills, OpenClaw вставляє компактний **список доступних Skills**
(`formatSkillsForPrompt`), який містить **шлях до файлу** для кожного Skill. Prompt
інструктує модель використовувати `read`, щоб завантажити SKILL.md за вказаним
розташуванням (workspace, managed або bundled). Якщо немає eligible Skills,
секція Skills пропускається.

Eligibility включає gates metadata Skill, перевірки runtime environment/config
і effective agent skill allowlist, коли налаштовано `agents.defaults.skills` або
`agents.list[].skills`.

Plugin-bundled Skills є eligible лише коли ввімкнено Plugin-власник.
Це дає змогу tool plugins надавати глибші operating guides без вбудовування всіх цих
інструкцій безпосередньо в кожен опис інструмента.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Це зберігає базовий prompt малим, водночас дозволяючи targeted використання Skill.

Бюджет списку Skills належить підсистемі Skills:

- Глобальне типове значення: `skills.limits.maxSkillsPromptChars`
- Перевизначення для агента: `agents.list[].skillsLimits.maxSkillsPromptChars`

Загальні обмежені фрагменти часу виконання використовують іншу поверхню:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Цей поділ відокремлює визначення розміру Skills від визначення розміру читання/впровадження під час виконання, як-от `memory_get`, результати live-інструментів і оновлення AGENTS.md після Compaction.

## Документація

Системний prompt містить розділ **Документація**. Коли локальна документація доступна, він указує на локальний каталог документації OpenClaw (`docs/` у Git checkout або документацію з комплектного npm-пакета). Якщо локальна документація недоступна, він повертається до [https://docs.openclaw.ai](https://docs.openclaw.ai).

Той самий розділ також містить розташування вихідного коду OpenClaw. Git checkouts надають локальний корінь вихідного коду, щоб агент міг безпосередньо інспектувати код. Інсталяції пакетів містять URL вихідного коду на GitHub і вказують агенту переглядати вихідний код там, коли документація неповна або застаріла. Prompt також зазначає публічне дзеркало документації, спільноту Discord і ClawHub ([https://clawhub.ai](https://clawhub.ai)) для пошуку Skills. Він вказує моделі спершу звертатися до документації щодо поведінки, команд, конфігурації або архітектури OpenClaw і запускати `openclaw status` самостійно, коли це можливо (запитуючи користувача лише тоді, коли не має доступу). Зокрема для конфігурації він спрямовує агентів до дії інструмента `gateway` `config.schema.lookup` для точної документації та обмежень на рівні полів, а потім до `docs/gateway/configuration.md` і `docs/gateway/configuration-reference.md` для ширших настанов.

## Пов’язане

- [Час виконання агента](/uk/concepts/agent)
- [Робочий простір агента](/uk/concepts/agent-workspace)
- [Рушій контексту](/uk/concepts/context-engine)
