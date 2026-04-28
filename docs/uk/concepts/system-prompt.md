---
read_when:
    - Редагування тексту системного промпта, списку інструментів або розділів часу/Heartbeat
    - Зміна поведінки ініціалізації робочого простору або впровадження Skills
summary: Що містить системний промпт OpenClaw і як його збирають
title: Системний промпт
x-i18n:
    generated_at: "2026-04-28T23:57:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw створює власний системний prompt для кожного запуску агента. Prompt **належить OpenClaw** і не використовує стандартний prompt pi-coding-agent.

Prompt збирається OpenClaw і вставляється в кожен запуск агента.

Provider plugins можуть додавати cache-aware вказівки для prompt, не замінюючи
повний prompt, що належить OpenClaw. Provider runtime може:

- замінювати невеликий набір іменованих основних секцій (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- вставляти **стабільний префікс** над межею кешу prompt
- вставляти **динамічний суфікс** під межею кешу prompt

Використовуйте provider-owned внески для налаштування, специфічного для родин моделей. Залишайте застарілу
мутацію prompt `before_prompt_build` для сумісності або справді глобальних змін prompt,
а не для звичайної поведінки провайдера.

Оверлей родини OpenAI GPT-5 зберігає основне правило виконання невеликим і додає
модельно-специфічні вказівки щодо persona latching, стислого виводу, дисципліни інструментів,
паралельного пошуку, покриття deliverable, перевірки, відсутнього контексту та
гігієни terminal-tool.

## Структура

Prompt навмисно компактний і використовує фіксовані секції:

- **Інструменти**: нагадування про structured-tool як source-of-truth плюс runtime-вказівки щодо використання інструментів.
- **Ухил виконання**: компактні вказівки щодо доведення до кінця: діяти в межах поточного ходу для
  actionable requests, продовжувати до завершення або блокування, відновлюватися після слабких результатів інструментів,
  перевіряти змінний стан наживо та перевіряти перед фіналізацією.
- **Безпека**: коротке нагадування про guardrail, щоб уникати power-seeking behavior або обходу нагляду.
- **Skills** (коли доступні): повідомляє моделі, як завантажувати інструкції Skills на вимогу.
- **Самооновлення OpenClaw**: як безпечно переглядати config за допомогою
  `config.schema.lookup`, виправляти config через `config.patch`, замінювати повний
  config через `config.apply` і запускати `update.run` лише за явним запитом користувача.
  Owner-only інструмент `gateway` також відмовляється переписувати
  `tools.exec.ask` / `tools.exec.security`, зокрема застарілі псевдоніми `tools.bash.*`,
  які нормалізуються до цих захищених exec-шляхів.
- **Робоча область**: робочий каталог (`agents.defaults.workspace`).
- **Документація**: локальний шлях до документації OpenClaw (репозиторій або npm-пакет) і коли її читати.
- **Файли робочої області (вставлені)**: вказує, що bootstrap-файли включено нижче.
- **Sandbox** (коли ввімкнено): вказує sandboxed runtime, sandbox-шляхи та чи доступний elevated exec.
- **Поточна дата й час**: локальний час користувача, часовий пояс і формат часу.
- **Теги відповіді**: необов’язковий синтаксис тегів відповіді для підтримуваних провайдерів.
- **Heartbeats**: Heartbeat prompt і поведінка ack, коли Heartbeats увімкнено для агента за замовчуванням.
- **Runtime**: host, OS, node, model, корінь репозиторію (коли виявлено), рівень thinking (один рядок).
- **Reasoning**: поточний рівень видимості + підказка перемикача /reasoning.

OpenClaw тримає великий стабільний вміст, зокрема **Контекст проєкту**, над
внутрішньою межею кешу prompt. Мінливі секції каналу/сесії, як-от
вбудовані вказівки Control UI, **Messaging**, **Voice**, **Контекст групового чату**,
**Reactions**, **Heartbeats** і **Runtime**, додаються під цією межею,
щоб локальні бекенди з prefix caches могли повторно використовувати стабільний префікс робочої області
між ходами каналу. Описи інструментів так само мають уникати вбудовування поточних
назв каналів, коли прийнята схема вже містить цю runtime-деталь.

Секція Інструменти також містить runtime-вказівки для тривалої роботи:

- використовуйте cron для майбутнього follow-up (`check back later`, нагадування, повторювана робота)
  замість циклів `exec` sleep, трюків із затримкою `yieldMs` або повторного опитування `process`
- використовуйте `exec` / `process` лише для команд, які стартують зараз і продовжують виконуватися
  у фоні
- коли ввімкнено автоматичне пробудження після завершення, запускайте команду один раз і покладайтеся на
  push-based wake path, коли вона видає вивід або завершується помилкою
- використовуйте `process` для логів, статусу, вводу або втручання, коли потрібно
  оглянути запущену команду
- якщо завдання більше, віддавайте перевагу `sessions_spawn`; завершення sub-agent є
  push-based і автоматично повідомляє requester
- не опитуйте `subagents list` / `sessions_list` у циклі лише для очікування
  завершення

Коли експериментальний інструмент `update_plan` увімкнено, Інструменти також повідомляють
моделі використовувати його лише для нетривіальної багатокрокової роботи, тримати рівно один
крок `in_progress` і не повторювати весь план після кожного оновлення.

Safety guardrails у системному prompt мають рекомендаційний характер. Вони спрямовують поведінку моделі, але не забезпечують примусове дотримання політики. Для жорсткого enforcement використовуйте policy інструментів, exec approvals, sandboxing і channel allowlists; оператори можуть вимикати їх за дизайном.

На каналах із native approval cards/buttons runtime prompt тепер повідомляє
агенту спершу покладатися на цей native approval UI. Він має включати ручну
команду `/approve` лише тоді, коли результат інструмента каже, що chat approvals недоступні або
ручне approval є єдиним шляхом.

## Режими prompt

OpenClaw може рендерити менші системні prompts для sub-agents. Runtime задає
`promptMode` для кожного запуску (це не user-facing config):

- `full` (за замовчуванням): містить усі секції вище.
- `minimal`: використовується для sub-agents; пропускає **Skills**, **Memory Recall**, **Самооновлення OpenClaw**,
  **Model Aliases**, **User Identity**, **Теги відповіді**,
  **Messaging**, **Silent Replies** і **Heartbeats**. Інструменти, **Безпека**,
  робоча область, Sandbox, Поточна дата й час (коли відомо), Runtime і вставлений
  контекст залишаються доступними.
- `none`: повертає лише базовий рядок ідентичності.

Коли `promptMode=minimal`, додаткові вставлені prompts позначаються як **Контекст subagent**
замість **Контекст групового чату**.

Для запусків channel auto-reply OpenClaw може пропускати загальну секцію **Silent Replies**,
коли контекст direct/group chat уже містить розв’язану
conversation-specific поведінку `NO_REPLY`. Це дає змогу уникнути повторення token mechanics
і в глобальному системному prompt, і в контексті каналу.

## Bootstrap-вставлення робочої області

Bootstrap-файли обрізаються й додаються під **Контекст проєкту**, щоб модель бачила ідентичність і профільний контекст без явних читань:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (лише для абсолютно нових робочих областей)
- `MEMORY.md`, коли присутній

Усі ці файли **вставляються у вікно контексту** на кожному ході, якщо
не застосовується file-specific gate. `HEARTBEAT.md` пропускається у звичайних запусках, коли
Heartbeats вимкнено для агента за замовчуванням або
`agents.defaults.heartbeat.includeSystemPromptSection` має значення false. Тримайте вставлені
файли стислими — особливо `MEMORY.md`, який може зростати з часом і призводити до
неочікувано високого використання контексту та частішої Compaction.

<Note>
Щоденні файли `memory/*.md` **не** є частиною звичайного bootstrap Контексту проєкту. У звичайних ходах до них звертаються на вимогу через інструменти `memory_search` і `memory_get`, тому вони не враховуються у вікні контексту, якщо модель явно їх не читає. Голі ходи `/new` і `/reset` є винятком: runtime може додати недавню щоденну пам’ять як одноразовий блок startup-context для цього першого ходу.
</Note>

Великі файли обрізаються з маркером. Максимальний розмір на файл керується
`agents.defaults.bootstrapMaxChars` (за замовчуванням: 12000). Загальний вставлений bootstrap
вміст у всіх файлах обмежено `agents.defaults.bootstrapTotalMaxChars`
(за замовчуванням: 60000). Відсутні файли вставляють короткий маркер missing-file. Коли відбувається обрізання,
OpenClaw може вставити warning block у Контекст проєкту; керуйте цим через
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
за замовчуванням: `once`).

Сесії sub-agent вставляють лише `AGENTS.md` і `TOOLS.md` (інші bootstrap-файли
відфільтровуються, щоб зберегти контекст sub-agent невеликим).

Внутрішні hooks можуть перехопити цей крок через `agent:bootstrap`, щоб змінити або замінити
вставлені bootstrap-файли (наприклад, замінити `SOUL.md` на альтернативну persona).

Якщо ви хочете, щоб агент звучав менш generic, почніть із
[Посібника з особистості SOUL.md](/uk/concepts/soul).

Щоб перевірити, скільки додає кожен вставлений файл (raw vs injected, truncation, плюс tool schema overhead), використовуйте `/context list` або `/context detail`. Див. [Контекст](/uk/concepts/context).

## Обробка часу

Системний prompt містить окрему секцію **Поточна дата й час**, коли
часовий пояс користувача відомий. Щоб зберегти cache-stable prompt, тепер вона містить лише
**часовий пояс** (без динамічного годинника або формату часу).

Використовуйте `session_status`, коли агенту потрібен поточний час; status card
містить рядок timestamp. Той самий інструмент може необов’язково встановлювати per-session model
override (`model=default` очищає його).

Налаштовуйте через:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Повні подробиці поведінки див. у [Дата й час](/uk/date-time).

## Skills

Коли існують eligible Skills, OpenClaw вставляє компактний **список доступних Skills**
(`formatSkillsForPrompt`), який містить **шлях до файлу** для кожної Skill. Prompt
інструктує модель використовувати `read`, щоб завантажити SKILL.md у вказаному
розташуванні (workspace, managed або bundled). Якщо eligible Skills немає, секція
Skills пропускається.

Eligibility включає skill metadata gates, runtime environment/config checks
і effective agent skill allowlist, коли налаштовано `agents.defaults.skills` або
`agents.list[].skills`.

Plugin-bundled Skills eligible лише тоді, коли їхній owning plugin увімкнено.
Це дає tool plugins змогу надавати глибші operating guides без вбудовування всіх
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

Це зберігає base prompt малим, водночас даючи змогу targeted skill usage.

Бюджет списку Skills належить підсистемі Skills:

- Глобальне значення за замовчуванням: `skills.limits.maxSkillsPromptChars`
- Перевизначення на агента: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generic bounded runtime excerpts використовують іншу surface:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Такий поділ тримає sizing Skills окремо від runtime read/injection sizing, як-от
`memory_get`, live tool results і оновлення AGENTS.md після Compaction.

## Документація

Системний prompt містить секцію **Документація**. Коли локальна документація доступна, вона
вказує на локальний каталог документації OpenClaw (`docs/` у Git checkout або bundled npm
package docs). Якщо локальна документація недоступна, використовується fallback на
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Та сама секція також містить розташування source OpenClaw. Git checkouts показують локальний
source root, щоб агент міг безпосередньо переглядати код. Package installs містять GitHub
source URL і повідомляють агенту переглядати source там, коли документація неповна або
застаріла. Prompt також згадує public docs mirror, community Discord і ClawHub
([https://clawhub.ai](https://clawhub.ai)) для пошуку Skills. Він повідомляє моделі
спершу звертатися до документації щодо поведінки OpenClaw, команд, конфігурації або архітектури, а також
самостійно запускати `openclaw status`, коли можливо (питаючи користувача лише тоді, коли не має доступу).
Спеціально для configuration він спрямовує агентів до дії інструмента `gateway`
`config.schema.lookup` для точних field-level docs і constraints, а потім до
`docs/gateway/configuration.md` і `docs/gateway/configuration-reference.md`
для ширших вказівок.

## Пов’язане

- [Runtime агента](/uk/concepts/agent)
- [Робоча область агента](/uk/concepts/agent-workspace)
- [Рушій контексту](/uk/concepts/context-engine)
