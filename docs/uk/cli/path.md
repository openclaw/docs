---
read_when:
    - Ви хочете прочитати або записати кінцевий елемент у файлі робочого простору з термінала
    - Ви пишете скрипти для стану робочої області й хочете стабільну схему адресації, незалежну від типу.
    - Ви налагоджуєте шлях `oc://` (перевірте синтаксис, подивіться, до чого він розв’язується)
summary: Довідник CLI для `openclaw path` (перегляд і редагування файлів робочого простору через схему адресації `oc://`)
title: Шлях
x-i18n:
    generated_at: "2026-06-27T17:22:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Наданий плагіном shell-доступ до адресної основи `oc://`: одна
схема шляхів із диспетчеризацією за типом для інспектування й редагування
адресованих файлів робочого простору
(markdown, jsonc, jsonl, yaml/yml/lobster). Користувачі самостійного хостингу, автори плагінів
і розширення редакторів використовують її, щоб читати, знаходити або оновлювати вузьку
ділянку без власноручного створення парсерів для кожного типу файлів.

CLI віддзеркалює публічні дієслова цієї основи:

- `resolve` є конкретним і повертає один збіг.
- `find` є дієсловом для множинних збігів із шаблонами, об’єднаннями, предикатами та
  позиційним розгортанням.
- `set` приймає лише конкретні шляхи або маркери вставлення; шаблони з wildcard
  відхиляються перед записом.

`path` надається вбудованим опційним плагіном `oc-path`. Увімкніть його перед
першим використанням:

```bash
openclaw plugins enable oc-path
```

## Навіщо це використовувати

Стан OpenClaw розподілений між редагованим людьми markdown, конфігурацією JSONC із коментарями,
журналами JSONL лише для додавання та файлами workflow/spec у YAML. Shell-скриптам, хукам
і агентам часто потрібне одне невелике значення з цих файлів: ключ frontmatter,
налаштування плагіна, поле запису журналу, крок YAML або пункт списку під іменованим
розділом.

`openclaw path` дає таким викликачам стабільну адресу замість одноразового grep,
regex або парсера для кожного типу файлів. Той самий шлях `oc://` можна перевірити,
розв’язати, знайти, виконати пробно й записати з термінала, що робить вузьку
автоматизацію простішою для рев’ю та безпечнішою для повторного запуску. Це особливо корисно, коли
потрібно оновити один листовий вузол, зберігаючи решту коментарів файлу,
закінчення рядків і навколишнє форматування.

Використовуйте це, коли потрібна сутність має логічну адресу, але фізична форма файлу
відрізняється:

- Хук хоче прочитати одне налаштування з JSONC із коментарями, не втрачаючи коментарів,
  коли записує значення назад.
- Скрипт обслуговування хоче знайти кожне відповідне поле події в журналі JSONL
  без завантаження всього журналу у власний парсер.
- Розширення редактора хоче перейти до розділу markdown або пункту списку за
  slug, а потім відрендерити точний рядок, до якого він розв’язався.
- Агент хоче пробно виконати крихітне редагування робочого простору перед застосуванням, із
  видимими під час рев’ю зміненими байтами.

Ймовірно, вам не потрібен `openclaw path` для звичайних редагувань цілих файлів, складних
міграцій конфігурації або записів, специфічних для пам’яті. Для них слід використовувати команду
або плагін власника. `path` призначений для малих, адресованих файлових операцій, де
повторювана команда термінала зрозуміліша за ще один спеціальний парсер.

## Як це використовується

Прочитати одне значення з редагованого людьми конфігураційного файлу:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Переглянути запис без торкання диска:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Знайти відповідні записи в журналі JSONL лише для додавання:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Адресувати інструкцію в markdown за розділом і пунктом, а не за номером
рядка:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Перевірити шлях у CI або preflight-скрипті перед тим, як скрипт читатиме чи записуватиме:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Ці команди призначені для копіювання в shell-скрипти. Використовуйте `--json`, коли
викликачу потрібен структурований вивід, і `--human`, коли результат переглядає
людина.

## Як це працює

`openclaw path` робить чотири речі:

1. Розбирає адресу `oc://` на слоти: файл, розділ, пункт, поле та
   опційну сесію.
2. Вибирає адаптер типу файлу за розширенням цілі (`.md`, `.jsonc`,
   `.jsonl`, `.yaml`, `.yml`, `.lobster` і пов’язаними alias).
3. Розв’язує слоти відносно AST цього типу файлу: заголовки/пункти markdown,
   ключі об’єктів/індекси масивів JSONC, рядкові записи JSONL або вузли map/sequence
   YAML.
4. Для `set` виводить відредаговані байти через той самий адаптер, щоб незмінені
   частини файлу зберігали свої коментарі, закінчення рядків і близьке форматування
   там, де тип це підтримує.

`resolve` і `set` потребують однієї конкретної цілі. `find` є дослідницьким
дієсловом: воно розгортає wildcard, об’єднання, предикати та ordinals у конкретні
збіги, які можна інспектувати перед вибором одного для запису.

## Підкоманди

| Підкоманда              | Призначення                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Надрукувати конкретний збіг за шляхом (або "не знайдено").                       |
| `find <pattern>`        | Перелічити збіги для шляху з wildcard / об’єднанням / предикатом.                   |
| `set <oc-path> <value>` | Записати листовий вузол або ціль вставлення за конкретним шляхом. Підтримує `--dry-run`.   |
| `validate <oc-path>`    | Лише розбір; надрукувати структурний розклад (файл / розділ / пункт / поле).      |
| `emit <file>`           | Провести файл через round-trip `parseXxx` + `emitXxx` (діагностика байтової точності). |

## Глобальні прапорці

| Прапорець       | Призначення                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Розв’язати файловий слот відносно цього каталогу (типово: `process.cwd()`). |
| `--file <path>` | Перевизначити розв’язаний шлях файлового слота (абсолютний доступ).                |
| `--json`        | Примусово виводити JSON (типово, коли stdout не є TTY).                    |
| `--human`       | Примусово виводити людський формат (типово, коли stdout є TTY).                       |
| `--dry-run`     | (лише для `set`) надрукувати байти, які були б записані, без запису.   |
| `--diff`        | (з `set --dry-run`) надрукувати unified diff замість повних байтів.   |

## Синтаксис `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Правила слотів: `field` потребує `item`, а `item` потребує `section`. Для всіх
чотирьох слотів:

- **Сегменти в лапках** — `"a/b.c"` зберігає розділювачі `/` і `.`.
  Вміст є байтовим літералом; `"` і `\` не дозволені всередині лапок.
  Файловий слот також враховує лапки: `oc://"skills/email-drafter"/Tools/$last`
  трактує `skills/email-drafter` як один файловий шлях.
- **Предикати** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Числові операції потребують, щоб обидві сторони приводилися до скінченних чисел.
- **Об’єднання** — `{a,b,c}` збігається з будь-якою з альтернатив.
- **Wildcards** — `*` (один підсегмент) і `**` (нуль або більше,
  рекурсивно). `find` приймає їх; `resolve` і `set` відхиляють їх як
  неоднозначні.
- **Позиційні** — `$first` / `$last` розв’язуються до першого / останнього індексу або
  оголошеного ключа.
- **Ordinal** — `#N` для N-го збігу за порядком у документі.
- **Маркери вставлення** — `+`, `+key`, `+nnn` для вставлення за ключем / індексом
  (використовуйте з `set`).
- **Область сесії** — `?session=cron-daily` тощо. Ортогональна до вкладеності
  слотів. Значення сесії є raw, не percent-decoded; вони не можуть містити
  контрольні символи або зарезервовані розділювачі query (`?`, `&`, `%`).

Зарезервовані символи (`?`, `&`, `%`) поза сегментами в лапках, предикатах або об’єднаннях
відхиляються. Контрольні символи (U+0000-U+001F, U+007F) відхиляються
будь-де, зокрема в query-значенні `session`.

`formatOcPath(parseOcPath(path)) === path` гарантовано для канонічних шляхів.
Неканонічні query-параметри ігноруються, окрім першого непорожнього
значення `session=`.

## Адресація за типом файлу

| Тип               | Модель адресації                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | Розділи H2 за slug, пункти списку за slug або `#N`, frontmatter через `[frontmatter]`.                 |
| JSONC/JSON        | Ключі об’єктів та індекси масивів; крапки розділяють вкладені підсегменти, якщо вони не в лапках.                        |
| JSONL             | Адреси рядків верхнього рівня (`L1`, `L2`, `$first`, `$last`), потім спуск у стилі JSONC всередині рядка. |
| YAML/YML/.lobster | Ключі map та індекси sequence; коментарі й flow style обробляються API YAML-документа.        |

`resolve` повертає структурований збіг: `root`, `node`, `leaf` або
`insertion-point`, із номером рядка на основі 1. Листові значення подаються як текст
плюс `leafType`, щоб автори плагінів могли рендерити прев’ю без залежності від
форми AST конкретного типу.

## Контракт мутації

`set` записує одну конкретну ціль:

- Значення frontmatter Markdown і поля пунктів `- key: value` є рядковими leaf.
  Вставлення Markdown додають розділи, ключі frontmatter або пункти розділу й
  рендерять канонічну markdown-форму для зміненого файлу.
- Записи листових вузлів JSONC приводять рядкове значення до наявного типу leaf
  (`string`, скінченний `number`, `true`/`false` або `null`). Використовуйте `--value-json`,
  коли заміна leaf у JSONC/JSON/JSONL має парсити `<value>` як JSON і
  може змінювати форму, наприклад замінюючи рядковий shorthand SecretRef на
  об’єкт. Вставлення об’єктів і масивів JSONC парсять `<value>` як JSON і використовують
  шлях редагування `jsonc-parser` для звичайних записів leaf, зберігаючи коментарі та
  близьке форматування.
- Записи leaf у JSONL приводяться як JSONC всередині рядка. Заміна всього рядка та
  append парсять `<value>` як JSON. Відрендерений JSONL зберігає домінантну для файлу
  угоду закінчень рядків LF/CRLF.
- Записи leaf у YAML приводяться до наявного scalar-типу (`string`, скінченний
  `number`, `true`/`false` або `null`). Вставлення YAML використовують API документа
  вбудованого пакета `yaml` для оновлень map/sequence. Некоректні YAML-документи
  з помилками парсера відхиляються перед мутацією з `parse-error`.

Використовуйте `--dry-run` перед видимими для користувача записами, коли точні байти мають значення. Ця
основа зберігає байт-ідентичний вивід для round-trip parse/emit, але
мутація може канонізувати відредаговану ділянку або файл залежно від типу.
Додайте `--diff`, коли хочете отримати прев’ю як сфокусований патч before/after замість
повного відрендереного файлу.

## Приклади

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Більше прикладів граматики:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Рецепти за типом файлу

Ті самі п’ять дієслів працюють для всіх типів; схема адресації виконує диспетчеризацію за розширенням файлу. У наведених нижче прикладах використовуються фікстури з опису PR.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Предикат `[frontmatter]` адресує блок YAML frontmatter; `tools` зіставляється із заголовком `## Tools` через slug, а листи елементів зберігають свою slug-форму навіть тоді, коли джерело використовує підкреслення (`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Редагування JSONC проходять через `jsonc-parser`, тому коментарі й пробіли зберігаються після `set`. Спочатку запустіть із `--dry-run`, щоб переглянути байти перед внесенням змін.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Кожен рядок є записом. Адресуйте за предикатом (`[event=action]`), коли не знаєте номер рядка, або за канонічним сегментом `LN`, коли знаєте.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML використовує API `Document` пакета `yaml`, а не самописний парсер, тому звичайні цикли parse/emit зберігають коментарі й авторську структуру, а розв’язані шляхи використовують ту саму модель ключів мапи / індексів послідовності, що й JSONC. Той самий адаптер обробляє файли `.yaml`, `.yml` і `.lobster`.

## Довідник підкоманд

### `resolve <oc-path>`

Зчитує один лист або вузол. Wildcards відхиляються — для них використовуйте `find`. Завершується з кодом `0` у разі збігу, `1` у разі коректного промаху, `2` у разі помилки парсингу або відхиленого шаблону.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Перелічує всі збіги для шаблону з wildcard / предикатом / об’єднанням. Завершується з кодом `0`, якщо є принаймні один збіг, і `1`, якщо збігів немає. Wildcards у слоті файлу відхиляються з `OC_PATH_FILE_WILDCARD_UNSUPPORTED` — передайте конкретний файл (globbing для кількох файлів є майбутньою функцією).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Записує лист. Поєднуйте з `--dry-run`, щоб попередньо переглянути байти, які було б записано, не змінюючи файл. Додайте `--diff` для попереднього перегляду unified diff. Завершується з кодом `0` у разі успішного запису, `1`, якщо субстрат відхиляє операцію (наприклад, спрацював sentinel-запобіжник), `2` у разі помилок парсингу.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Маркер вставлення `+key` створює дочірній елемент із вказаною назвою, якщо його ще не існує; `+nnn` і простий `+` працюють відповідно для індексованого вставлення та додавання в кінець.

### `validate <oc-path>`

Перевірка лише парсингу. Без доступу до файлової системи. Корисно, коли потрібно підтвердити, що шлях шаблону має правильну форму перед підстановкою змінних, або коли потрібен структурний розбір для налагодження:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Завершується з кодом `0`, коли шлях валідний, `1`, коли невалідний (зі структурованими `code` і `message`), `2` у разі помилок аргументів.

### `emit <file>`

Пропускає файл через парсер і емітер відповідного типу. Для коректного файлу вихід має бути байт-у-байт ідентичним вхідним даним — розбіжність указує на баг парсера або спрацювання sentinel. Корисно для налагодження поведінки субстрату на реальних вхідних даних.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Коди завершення

| Код | Значення                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Успіх. (`resolve` / `find`: принаймні один збіг. `set`: запис успішний.) |
| `1`  | Немає збігу, або `set` відхилено субстратом (без помилки системного рівня).      |
| `2`  | Помилка аргументів або парсингу.                                                   |

## Режим виводу

`openclaw path` враховує TTY: на терміналі виводить зручний для читання текст, а коли stdout передано в pipe або перенаправлено — JSON. `--json` і `--human` перевизначають автоматичне визначення.

## Примітки

- `set` записує байти через emit-шлях субстрату, який автоматично застосовує redaction-sentinel-запобіжник. Лист, що містить `__OPENCLAW_REDACTED__` (дослівно або як підрядок), відхиляється під час запису.
- Парсинг JSONC і редагування листів використовують локальну для Plugin залежність `jsonc-parser`, тому коментарі й форматування зберігаються під час звичайних записів листів, а не проходять через самописний шлях parser/re-render.
- `path` не знає про LKG. Якщо файл відстежується LKG, наступний виклик observe вирішує, чи виконувати promote / recover. `set --batch` для атомарного multi-set через життєвий цикл LKG promote/recover заплановано разом із субстратом LKG-recovery.

## Пов’язане

- [Довідник CLI](/uk/cli)
