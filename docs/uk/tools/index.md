---
read_when:
    - Ви хочете зрозуміти, які інструменти надає OpenClaw
    - Вам потрібно налаштувати, дозволити або заборонити інструменти
    - Ви обираєте між вбудованими інструментами, skills і plugins
summary: 'Огляд інструментів і Plugins OpenClaw: що може робити агент і як його розширювати'
title: Інструменти та Plugins
x-i18n:
    generated_at: "2026-04-23T21:15:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

Усе, що агент робить понад генерацію тексту, відбувається через **інструменти**.
Інструменти — це спосіб, у який агент читає файли, запускає команди, переглядає веб,
надсилає повідомлення та взаємодіє з пристроями.

## Інструменти, skills і Plugins

OpenClaw має три шари, які працюють разом:

<Steps>
  <Step title="Інструменти — це те, що викликає агент">
    Інструмент — це типізована функція, яку агент може викликати (наприклад `exec`, `browser`,
    `web_search`, `message`). OpenClaw постачається з набором **вбудованих інструментів**, а
    plugins можуть реєструвати додаткові.

    Агент бачить інструменти як структуровані визначення функцій, надіслані до model API.

  </Step>

  <Step title="Skills навчають агента, коли і як">
    Skill — це markdown-файл (`SKILL.md`), що вставляється в системний запит.
    Skills дають агенту контекст, обмеження і покрокові вказівки для
    ефективного використання інструментів. Skills живуть у вашому робочому просторі, у спільних теках
    або постачаються всередині Plugins.

    [Довідник зі Skills](/uk/tools/skills) | [Створення Skills](/uk/tools/creating-skills)

  </Step>

  <Step title="Plugins пакують усе разом">
    Plugin — це пакет, який може реєструвати будь-яку комбінацію можливостей:
    канали, провайдерів моделей, інструменти, skills, мовлення, realtime transcription,
    realtime voice, media understanding, генерацію зображень, генерацію відео,
    web fetch, web search та інше. Деякі Plugins — **core** (постачаються з
    OpenClaw), інші — **external** (публікуються спільнотою в npm).

    [Установлення і налаштування Plugins](/uk/tools/plugin) | [Створіть власний](/uk/plugins/building-plugins)

  </Step>
</Steps>

## Вбудовані інструменти

Ці інструменти постачаються з OpenClaw і доступні без встановлення будь-яких Plugins:

| Інструмент                                 | Що він робить                                                        | Сторінка                                                     |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Запускає shell-команди, керує фоновими процесами                     | [Exec](/uk/tools/exec), [Exec Approvals](/uk/tools/exec-approvals) |
| `code_execution`                           | Запускає sandboxed remote Python analysis                            | [Code Execution](/uk/tools/code-execution)                      |
| `browser`                                  | Керує browser на базі Chromium (перехід, клік, screenshot)           | [Browser](/uk/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Пошук у вебі, пошук дописів X, отримання вмісту сторінок             | [Web](/uk/tools/web), [Web Fetch](/uk/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Файловий I/O у робочому просторі                                     |                                                              |
| `apply_patch`                              | Patch-і файлів з кількома фрагментами                                | [Apply Patch](/uk/tools/apply-patch)                            |
| `message`                                  | Надсилає повідомлення в усі канали                                   | [Agent Send](/uk/tools/agent-send)                              |
| `canvas`                                   | Керує node Canvas (present, eval, snapshot)                          |                                                              |
| `nodes`                                    | Виявляє та націлює pair-пристрої                                     |                                                              |
| `cron` / `gateway`                         | Керує запланованими завданнями; перевіряє, patch-ить, перезапускає або оновлює gateway |                                                              |
| `image` / `image_generate`                 | Аналізує або генерує зображення                                      | [Генерація зображень](/uk/tools/image-generation)               |
| `music_generate`                           | Генерує музичні треки                                                | [Генерація музики](/uk/tools/music-generation)                  |
| `video_generate`                           | Генерує відео                                                        | [Генерація відео](/uk/tools/video-generation)                   |
| `tts`                                      | Одноразове перетворення text-to-speech                               | [TTS](/uk/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Керування сесіями, статус і оркестрація субагентів                   | [Субагенти](/uk/tools/subagents)                                |
| `session_status`                           | Легковагове зчитування у стилі `/status` і перевизначення моделі для сесії | [Інструменти сесії](/uk/concepts/session-tool)                 |

Для роботи із зображеннями використовуйте `image` для аналізу і `image_generate` для генерації або редагування. Якщо ви націлюєтеся на `openai/*`, `google/*`, `fal/*` або іншого нетипового провайдера зображень, спочатку налаштуйте автентифікацію/API key цього провайдера.

Для роботи з музикою використовуйте `music_generate`. Якщо ви націлюєтеся на `google/*`, `minimax/*` або іншого нетипового музичного провайдера, спочатку налаштуйте автентифікацію/API key цього провайдера.

Для роботи з відео використовуйте `video_generate`. Якщо ви націлюєтеся на `qwen/*` або іншого нетипового провайдера відео, спочатку налаштуйте автентифікацію/API key цього провайдера.

Для workflow-driven генерації аудіо використовуйте `music_generate`, коли його
реєструє Plugin на кшталт ComfyUI. Це відокремлено від `tts`, який є text-to-speech.

`session_status` — це легковаговий інструмент status/readback у групі sessions.
Він відповідає на запитання у стилі `/status` про поточну сесію і може
за бажанням установлювати перевизначення моделі для сесії; `model=default` очищає це
перевизначення. Як і `/status`, він може дозаповнювати неповні лічильники токенів/кешу і
мітку активної runtime-моделі з останнього запису використання transcript.

`gateway` — це owner-only runtime tool для операцій gateway:

- `config.schema.lookup` для одного path-scoped піддерева конфігурації перед редагуванням
- `config.get` для поточного знімка конфігурації + hash
- `config.patch` для часткових оновлень конфігурації з перезапуском
- `config.apply` лише для повної заміни конфігурації
- `update.run` для явного self-update + restart

Для часткових змін віддавайте перевагу `config.schema.lookup`, а потім `config.patch`. Використовуйте
`config.apply` лише тоді, коли ви свідомо замінюєте всю конфігурацію.
Інструмент також відмовляється змінювати `tools.exec.ask` або `tools.exec.security`;
застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec.

### Інструменти, надані Plugin

Plugins можуть реєструвати додаткові інструменти. Деякі приклади:

- [Diffs](/uk/tools/diffs) — переглядач і рендерер diff
- [LLM Task](/uk/tools/llm-task) — крок LLM лише з JSON для структурованого виводу
- [Lobster](/uk/tools/lobster) — typed workflow runtime з resumable approvals
- [Music Generation](/uk/tools/music-generation) — спільний інструмент `music_generate` з workflow-backed провайдерами
- [OpenProse](/uk/prose) — markdown-first orchestration робочих процесів
- [Tokenjuice](/uk/tools/tokenjuice) — компактні результати інструментів `exec` і `bash` з великою кількістю шуму

## Конфігурація інструментів

### Allow і deny списки

Керуйте тим, які інструменти агент може викликати, через `tools.allow` / `tools.deny` у
конфігурації. Deny завжди має пріоритет над allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Профілі інструментів

`tools.profile` встановлює базовий allowlist до застосування `allow`/`deny`.
Перевизначення для кожного агента: `agents.list[].tools.profile`.

| Профіль      | Що він включає                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`       | Без обмежень (те саме, що не встановлено)                                                                                                       |
| `coding`     | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging`  | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                       |
| `minimal`    | Лише `session_status`                                                                                                                           |

Профілі `coding` і `messaging` також дозволяють налаштовані bundle MCP tools
під ключем Plugin `bundle-mcp`. Додайте `tools.deny: ["bundle-mcp"]`, коли ви
хочете, щоб профіль зберіг свої звичайні вбудовані інструменти, але приховав усі налаштовані MCP tools.
Профіль `minimal` не включає bundle MCP tools.

### Групи інструментів

Використовуйте скорочення `group:*` у списках allow/deny:

| Група             | Інструменти                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`   | exec, process, code_execution (`bash` приймається як псевдонім для `exec`)                               |
| `group:fs`        | read, write, edit, apply_patch                                                                            |
| `group:sessions`  | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`    | memory_search, memory_get                                                                                 |
| `group:web`       | web_search, x_search, web_fetch                                                                           |
| `group:ui`        | browser, canvas                                                                                           |
| `group:automation`| cron, gateway                                                                                             |
| `group:messaging` | message                                                                                                   |
| `group:nodes`     | nodes                                                                                                     |
| `group:agents`    | agents_list                                                                                               |
| `group:media`     | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`  | Усі вбудовані інструменти OpenClaw (без інструментів Plugin)                                              |

`sessions_history` повертає обмежений, safety-filtered вигляд recall. Він видаляє
теґи thinking, каркас `<relevant-memories>`, XML-пейлоади викликів інструментів у звичайному тексті
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і усіченими блоками викликів інструментів),
понижений каркас викликів інструментів, leaked ASCII/full-width токени
керування моделлю і некоректний XML викликів інструментів MiniMax з тексту помічника, а потім застосовує
редагування/усікання і за потреби placeholder-и для надто великих рядків замість того, щоб поводитися
як сирий дамп transcript.

### Обмеження, специфічні для провайдера

Використовуйте `tools.byProvider`, щоб обмежувати інструменти для конкретних провайдерів без
зміни глобальних типових значень:

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
