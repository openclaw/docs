---
read_when:
    - Ви хочете зрозуміти, які інструменти надає OpenClaw
    - Потрібно налаштувати, дозволити або заборонити інструменти
    - Ви обираєте між вбудованими інструментами, Skills і plugins
summary: 'Огляд інструментів і плагінів OpenClaw: що може робити агент і як розширити його можливості'
title: Інструменти та плагіни
x-i18n:
    generated_at: "2026-05-11T21:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

Усе, що агент робить поза генеруванням тексту, відбувається через **інструменти**.
Інструменти — це те, як агент читає файли, запускає команди, переглядає веб, надсилає
повідомлення та взаємодіє з пристроями.

## Інструменти, Skills і plugins

OpenClaw має три шари, які працюють разом:

<Steps>
  <Step title="Інструменти — це те, що викликає агент">
    Інструмент — це типізована функція, яку агент може викликати (наприклад, `exec`, `browser`,
    `web_search`, `message`). OpenClaw постачається з набором **вбудованих інструментів**, а
    plugins можуть реєструвати додаткові.

    Агент бачить інструменти як структуровані визначення функцій, надіслані до API моделі.

  </Step>

  <Step title="Skills навчають агента, коли і як діяти">
    Skill — це markdown-файл (`SKILL.md`), який вставляється в системний prompt.
    Skills надають агенту контекст, обмеження та покрокові вказівки для
    ефективного використання інструментів. Skills зберігаються у вашому workspace, у спільних папках
    або постачаються всередині plugins.

    [Довідник Skills](/uk/tools/skills) | [Створення Skills](/uk/tools/creating-skills)

  </Step>

  <Step title="Plugins пакують усе разом">
    Plugin — це пакет, який може реєструвати будь-яку комбінацію можливостей:
    канали, провайдери моделей, інструменти, Skills, мовлення, транскрипцію в реальному часі,
    голос у реальному часі, розуміння медіа, генерування зображень, генерування відео,
    web fetch, web search тощо. Деякі plugins є **core** (постачаються з
    OpenClaw), інші — **зовнішні** (публікуються спільнотою в npm).

    [Установлення та налаштування plugins](/uk/tools/plugin) | [Створіть власний](/uk/plugins/building-plugins)

  </Step>
</Steps>

## Вбудовані інструменти

Ці інструменти постачаються з OpenClaw і доступні без установлення будь-яких plugins:

| Інструмент                                 | Що він робить                                                        | Сторінка                                                     |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Запускає shell-команди, керує фоновими процесами                    | [Exec](/uk/tools/exec), [Схвалення Exec](/uk/tools/exec-approvals) |
| `code_execution`                           | Запускає sandboxed віддалений аналіз Python                         | [Виконання коду](/uk/tools/code-execution)                      |
| `browser`                                  | Керує браузером Chromium (навігація, клік, скриншот)                | [Браузер](/uk/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Шукає в вебі, шукає дописи X, отримує вміст сторінок                | [Веб](/uk/tools/web), [Web Fetch](/uk/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Файловий ввід/вивід у workspace                                     |                                                              |
| `apply_patch`                              | Багатофрагментні патчі файлів                                       | [Apply Patch](/uk/tools/apply-patch)                            |
| `message`                                  | Надсилає повідомлення через усі канали                              | [Надсилання агентом](/uk/tools/agent-send)                      |
| `nodes`                                    | Виявляє та вибирає спарені пристрої                                 |                                                              |
| `cron` / `gateway`                         | Керує запланованими завданнями; перевіряє, патчить, перезапускає або оновлює Gateway |                                                              |
| `image` / `image_generate`                 | Аналізує або генерує зображення                                     | [Генерування зображень](/uk/tools/image-generation)             |
| `music_generate`                           | Генерує музичні треки                                               | [Генерування музики](/uk/tools/music-generation)                |
| `video_generate`                           | Генерує відео                                                       | [Генерування відео](/uk/tools/video-generation)                 |
| `tts`                                      | Одноразове перетворення тексту на мовлення                          | [TTS](/uk/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Керування сесіями, статус і оркестрація підагентів                  | [Підагенти](/uk/tools/subagents)                                |
| `session_status`                           | Легкий readback у стилі `/status` і перевизначення моделі сесії     | [Інструменти сесії](/uk/concepts/session-tool)                  |

Для роботи із зображеннями використовуйте `image` для аналізу та `image_generate` для генерування або редагування. Якщо ви цілитеся в `openai/*`, `google/*`, `fal/*` або іншого нестандартного провайдера зображень, спершу налаштуйте auth/API key цього провайдера.

Для роботи з музикою використовуйте `music_generate`. Якщо ви цілитеся в `google/*`, `minimax/*` або іншого нестандартного провайдера музики, спершу налаштуйте auth/API key цього провайдера.

Для роботи з відео використовуйте `video_generate`. Якщо ви цілитеся в `qwen/*` або іншого нестандартного провайдера відео, спершу налаштуйте auth/API key цього провайдера.

Для генерування аудіо, керованого workflow, використовуйте `music_generate`, коли plugin, як-от
ComfyUI, реєструє його. Це окремо від `tts`, який є перетворенням тексту на мовлення.

`session_status` — це легкий інструмент статусу/readback у групі сесій.
Він відповідає на запитання в стилі `/status` про поточну сесію і може
необов’язково встановити перевизначення моделі для окремої сесії; `model=default` очищає це
перевизначення. Як і `/status`, він може дозаповнювати розріджені лічильники токенів/кешу та
мітку активної runtime-моделі з останнього запису використання в transcript.

`gateway` — це runtime-інструмент лише для власника для операцій Gateway:

- `config.schema.lookup` для одного path-scoped піддерева config перед редагуваннями
- `config.get` для поточного знімка config + hash
- `config.patch` для часткових оновлень config із перезапуском
- `config.apply` лише для повної заміни config
- `update.run` для явного self-update + restart

Для часткових змін віддавайте перевагу `config.schema.lookup`, а потім `config.patch`. Використовуйте
`config.apply` лише тоді, коли ви навмисно замінюєте весь config.
Для ширшої документації щодо config читайте [Конфігурація](/uk/gateway/configuration) і
[Довідник конфігурації](/uk/gateway/configuration-reference).
Інструмент також відмовляється змінювати `tools.exec.ask` або `tools.exec.security`;
застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec.

### Інструменти, надані plugins

Plugins можуть реєструвати додаткові інструменти. Кілька прикладів:

- [Canvas](/uk/plugins/reference/canvas) — експериментальний bundled plugin для керування node Canvas і рендерингу A2UI
- [Diffs](/uk/tools/diffs) — переглядач і renderer diff
- [LLM Task](/uk/tools/llm-task) — LLM-крок лише з JSON для структурованого виводу
- [Lobster](/uk/tools/lobster) — типізований runtime workflow із resumable approvals
- [Генерування музики](/uk/tools/music-generation) — спільний інструмент `music_generate` із провайдерами на основі workflow
- [OpenProse](/uk/prose) — оркестрація workflow з markdown-first підходом
- [Tokenjuice](/uk/tools/tokenjuice) — стискає шумні результати інструментів `exec` і `bash`

Інструменти plugins усе ще створюються через `api.registerTool(...)` і оголошуються в
списку `contracts.tools` manifest plugin. OpenClaw захоплює валідований
дескриптор інструмента під час discovery і кешує його за джерелом plugin та contract, тому
подальше планування інструментів може пропускати завантаження runtime plugin. Виконання інструмента все одно завантажує
plugin-власник і викликає live зареєстровану реалізацію.

[Пошук інструментів](/uk/tools/tool-search) — це компактна поверхня
для великих каталогів. Замість додавання кожної schema інструмента OpenClaw, MCP або client
до prompt, OpenClaw може надати моделі ізольований runtime Node
з `openclaw.tools.search`, `openclaw.tools.describe` і
`openclaw.tools.call`. Виклики все одно проходять назад через Gateway, тому політика
інструментів, схвалення, hooks і журнали сесій залишаються авторитетними.

## Налаштування інструментів

### Списки дозволів і заборон

Керуйте тим, які інструменти агент може викликати, через `tools.allow` / `tools.deny` у
config. Заборона завжди має перевагу над дозволом.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw fails closed, коли явний allowlist не дає жодних придатних до виклику інструментів.
Наприклад, `tools.allow: ["query_db"]` працює лише якщо завантажений plugin фактично
реєструє `query_db`. Якщо жоден вбудований інструмент, plugin або bundled MCP tool не відповідає
allowlist, запуск зупиняється до виклику моделі, а не продовжується як
text-only запуск, який міг би галюцинувати результати інструментів.

### Профілі інструментів

`tools.profile` задає базовий allowlist перед застосуванням `allow`/`deny`.
Перевизначення для окремого агента: `agents.list[].tools.profile`.

| Профіль     | Що він включає                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Усі core та необов’язкові інструменти plugins; необмежена базова лінія для ширшого доступу command/control                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Лише `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` навмисно вузький для агентів, сфокусованих на каналах.
Він не включає ширші інструменти command/control, як-от filesystem, runtime,
browser, canvas, nodes, cron і керування Gateway. Використовуйте `tools.profile: "full"`
як необмежену базову лінію для ширшого доступу command/control, а потім звужуйте
доступ за допомогою `tools.allow` / `tools.deny`, коли потрібно.
</Note>

`coding` включає легкі вебінструменти (`web_search`, `web_fetch`, `x_search`),
але не повний інструмент керування browser. Автоматизація browser може керувати реальними
сесіями та logged-in профілями, тому додавайте її явно через
`tools.alsoAllow: ["browser"]` або per-agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Налаштування `tools.exec` або `tools.fs` під обмежувальним профілем (`messaging`, `minimal`) не розширює allowlist профілю неявно. Додайте явні записи `tools.alsoAllow` (наприклад, `["exec", "process"]` для exec або `["read", "write", "edit"]` для fs), коли хочете, щоб обмежувальний профіль використовував ці налаштовані секції. OpenClaw записує попередження під час запуску, коли секція config присутня без відповідного grant `alsoAllow`.
</Note>

Профілі `coding` і `messaging` також дозволяють налаштовані bundle MCP tools
під ключем plugin `bundle-mcp`. Додайте `tools.deny: ["bundle-mcp"]`, коли
хочете, щоб профіль зберіг свої звичайні built-ins, але приховував усі налаштовані MCP tools.
Профіль `minimal` не включає bundle MCP tools.

Приклад (найширша поверхня інструментів за замовчуванням):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Групи інструментів

Використовуйте скорочення `group:*` у списках allow/deny:

| Група              | Інструменти                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` приймається як псевдонім для `exec`)                                |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas, коли увімкнено вбудований Plugin Canvas                                                  |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Усі вбудовані інструменти OpenClaw (не включає інструменти Plugin)                                        |

`sessions_history` повертає обмежене, відфільтроване з міркувань безпеки подання пригадування. Воно вилучає
теги мислення, службову розмітку `<relevant-memories>`, XML-навантаження
викликів інструментів у звичайному тексті (зокрема `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і усічені блоки викликів інструментів),
понижену службову розмітку викликів інструментів, витокові ASCII/повноширинні
керівні токени моделі та некоректний XML викликів інструментів MiniMax із тексту
асистента, а потім застосовує редагування/усічення й можливі плейсхолдери
для надмірно великих рядків замість того, щоб діяти як сирий дамп стенограми.

### Обмеження для окремих провайдерів

Використовуйте `tools.byProvider`, щоб обмежувати інструменти для конкретних провайдерів без
зміни глобальних значень за замовчуванням:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
