---
read_when:
    - Ви хочете зрозуміти, що означає «контекст» в OpenClaw
    - Ви налагоджуєте, чому модель «знає» щось (або забула це)
    - Ви хочете зменшити накладні витрати контексту (/context, /status, /compact)
summary: 'Контекст: що бачить модель, як він формується та як його перевірити'
title: Контекст
x-i18n:
    generated_at: "2026-04-23T20:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 928e237462ba772c44883dcbd5575ac2af472291c059618bac8244f9b2ccd72f
    source_path: concepts/context.md
    workflow: 15
---

«Контекст» — це **все, що OpenClaw надсилає моделі для одного запуску**. Він обмежений **вікном контексту** моделі (лімітом токенів).

Проста ментальна модель для початківців:

- **Системний prompt** (побудований OpenClaw): правила, інструменти, список Skills, час/runtime і впроваджені файли workspace.
- **Історія розмови**: ваші повідомлення + повідомлення асистента для цієї session.
- **Виклики/результати інструментів + вкладення**: вивід команд, читання файлів, зображення/аудіо тощо.

Контекст _не те саме_, що «memory»: memory може зберігатися на диску й повторно завантажуватися пізніше; контекст — це те, що знаходиться всередині поточного вікна моделі.

## Швидкий старт (перевірка контексту)

- `/status` → швидкий огляд «наскільки заповнене моє вікно?» + налаштування session.
- `/context list` → що впроваджується + приблизні розміри (для кожного файлу + загалом).
- `/context detail` → глибший розбір: розміри для кожного файлу, кожної schema інструмента, кожного запису Skill і розмір системного prompt.
- `/usage tokens` → додавати footer із використанням до звичайних відповідей.
- `/compact` → підсумувати старішу історію в компактний запис, щоб звільнити місце у вікні.

Див. також: [Slash-команди](/uk/tools/slash-commands), [Використання токенів і вартість](/uk/reference/token-use), [Compaction](/uk/concepts/compaction).

## Приклад виводу

Значення різняться залежно від моделі, provider, політики інструментів і вмісту вашого workspace.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## Що враховується у вікні контексту

Усе, що отримує модель, враховується, зокрема:

- Системний prompt (усі розділи).
- Історія розмови.
- Виклики інструментів + результати інструментів.
- Вкладення/транскрипти (зображення/аудіо/файли).
- Підсумки Compaction і артефакти pruning.
- Provider-«обгортки» або приховані заголовки (невидимі, але все одно враховуються).

## Як OpenClaw будує системний prompt

Системний prompt **належить OpenClaw** і перебудовується на кожному запуску. Він включає:

- Список інструментів + короткі описи.
- Список Skills (лише метадані; див. нижче).
- Розташування workspace.
- Час (UTC + перетворений час користувача, якщо налаштовано).
- Метадані runtime (host/OS/model/thinking).
- Впроваджені bootstrap-файли workspace в розділі **Project Context**.

Повний розбір: [Системний Prompt](/uk/concepts/system-prompt).

## Впроваджені файли workspace (Project Context)

Типово OpenClaw впроваджує фіксований набір файлів workspace (якщо вони існують):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (лише під час першого запуску)

Великі файли обрізаються для кожного файлу окремо за допомогою `agents.defaults.bootstrapMaxChars` (типово `12000` символів). OpenClaw також застосовує загальне обмеження на впровадження bootstrap для всіх файлів через `agents.defaults.bootstrapTotalMaxChars` (типово `60000` символів). `/context` показує розміри **raw і injected**, а також те, чи відбулося обрізання.

Коли відбувається обрізання, runtime може впровадити попереджувальний блок прямо в prompt у розділі Project Context. Це налаштовується через `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; типово `once`).

## Skills: впроваджуються чи завантажуються на вимогу

Системний prompt включає компактний **список Skills** (назва + опис + розташування). Цей список має реальні накладні витрати.

Інструкції Skill _не_ включаються типово. Очікується, що модель викличе `read` для `SKILL.md` Skill **лише за потреби**.

## Інструменти: є два типи вартості

Інструменти впливають на контекст двома способами:

1. **Текст списку інструментів** у системному prompt (те, що ви бачите як “Tooling”).
2. **Schema інструментів** (JSON). Вони надсилаються моделі, щоб вона могла викликати інструменти. Вони враховуються в контексті, навіть якщо ви не бачите їх як звичайний текст.

`/context detail` показує розбір найбільших schema інструментів, щоб ви могли побачити, що домінує.

## Команди, директиви та "inline shortcuts"

Slash-команди обробляються Gateway. Є кілька різних типів поведінки:

- **Окремі команди**: повідомлення, яке містить лише `/...`, виконується як команда.
- **Директиви**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` видаляються до того, як модель побачить повідомлення.
  - Повідомлення лише з директивами зберігають налаштування session.
  - Inline-директиви у звичайному повідомленні працюють як підказки для конкретного повідомлення.
- **Inline shortcuts** (лише для відправників з allowlist): певні токени `/...` усередині звичайного повідомлення можуть виконуватися негайно (приклад: “hey /status”), і видаляються до того, як модель побачить решту тексту.

Докладніше: [Slash-команди](/uk/tools/slash-commands).

## Sessions, Compaction і pruning (що зберігається)

Що саме зберігається між повідомленнями, залежить від механізму:

- **Звичайна історія** зберігається в транскрипті session, доки не буде compacted/pruned згідно з політикою.
- **Compaction** зберігає summary у транскрипті й залишає недавні повідомлення недоторканими.
- **Pruning** видаляє старі результати інструментів з prompt _у пам’яті_ для запуску, але не переписує транскрипт.

Документація: [Session](/uk/concepts/session), [Compaction](/uk/concepts/compaction), [Pruning session](/uk/concepts/session-pruning).

Типово OpenClaw використовує вбудований рушій контексту `legacy` для збирання та
Compaction. Якщо ви встановите Plugin, який надає `kind: "context-engine"`, і
виберете його через `plugins.slots.contextEngine`, OpenClaw делегує збирання
контексту, `/compact` і пов’язані lifecycle-хуки контексту субагента цьому
рушію. `ownsCompaction: false` не вмикає автоматичний fallback на рушій legacy;
активний рушій усе одно має коректно реалізовувати `compact()`. Див.
[Context Engine](/uk/concepts/context-engine) для повного
pluggable-інтерфейсу, lifecycle-хуків і конфігурації.

## Що насправді показує `/context`

`/context` надає перевагу останньому звіту про системний prompt, **побудований під час запуску**, якщо він доступний:

- `System prompt (run)` = захоплено з останнього вбудованого запуску (з підтримкою інструментів) і збережено в session store.
- `System prompt (estimate)` = обчислено на льоту, коли звіту про запуск немає (або коли використовується CLI-backend, який не створює такий звіт).

У будь-якому разі він показує розміри та основних учасників; він **не** виводить повний системний prompt або schema інструментів.

## Пов’язане

- [Context Engine](/uk/concepts/context-engine) — кастомне впровадження контексту через Plugin-и
- [Compaction](/uk/concepts/compaction) — підсумовування довгих розмов
- [Системний Prompt](/uk/concepts/system-prompt) — як будується системний prompt
- [Цикл агента](/uk/concepts/agent-loop) — повний цикл виконання агента
