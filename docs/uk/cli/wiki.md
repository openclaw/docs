---
read_when:
    - Ви хочете використовувати CLI memory-wiki
    - Ви документуєте або змінюєте `openclaw wiki`
summary: Довідник CLI для `openclaw wiki` (стан сховища memory-wiki, пошук, компіляція, лінтинг, застосування, bridge і допоміжні інструменти Obsidian)
title: Вікі
x-i18n:
    generated_at: "2026-04-28T11:08:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9d25a16125ac201ba5856acdb9eeda43725c30815507b17a96702a2ce3d6c91
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Перевіряйте й підтримуйте сховище `memory-wiki`.

Надається вбудованим Plugin `memory-wiki`.

Пов’язане:

- [Plugin Memory Wiki](/uk/plugins/memory-wiki)
- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: пам’ять](/uk/cli/memory)

## Для чого це

Використовуйте `openclaw wiki`, коли вам потрібне скомпільоване сховище знань із:

- пошуком, нативним для wiki, і читанням сторінок
- синтезами з багатим походженням даних
- звітами про суперечності та актуальність
- bridge-імпортами з Plugin активної пам’яті
- необов’язковими допоміжними засобами Obsidian CLI

## Поширені команди

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Команди

### `wiki status`

Перевіряє поточний режим сховища, стан справності та доступність Obsidian CLI.

Використовуйте це спочатку, коли не впевнені, чи ініціалізовано сховище, чи
справний bridge-режим, або чи доступна інтеграція з Obsidian.

Коли bridge-режим активний і налаштований на читання артефактів пам’яті, ця команда
запитує запущений Gateway, тож бачить той самий контекст Plugin активної пам’яті, що й
пам’ять агента/середовища виконання.

### `wiki doctor`

Запускає перевірки справності wiki й показує проблеми конфігурації або сховища.

Коли bridge-режим активний і налаштований на читання артефактів пам’яті, ця команда
запитує запущений Gateway перед побудовою звіту. Вимкнені bridge-імпорти
та bridge-конфігурації, що не читають артефакти пам’яті, залишаються локальними/офлайн.

Типові проблеми:

- bridge-режим увімкнено без публічних артефактів пам’яті
- недійсна або відсутня структура сховища
- відсутній зовнішній Obsidian CLI, коли очікується режим Obsidian

### `wiki init`

Створює структуру сховища wiki та стартові сторінки.

Це ініціалізує кореневу структуру, включно з індексами верхнього рівня та каталогами
кешу.

### `wiki ingest <path-or-url>`

Імпортує вміст у вихідний шар wiki.

Примітки:

- імпорт URL контролюється `ingest.allowUrlIngest`
- імпортовані вихідні сторінки зберігають походження у frontmatter
- авто-компіляція може запускатися після імпорту, коли її ввімкнено

### `wiki compile`

Перебудовує індекси, пов’язані блоки, панелі та скомпільовані дайджести.

Це записує стабільні машинно-орієнтовані артефакти до:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Якщо `render.createDashboards` увімкнено, компіляція також оновлює сторінки звітів.

### `wiki lint`

Перевіряє сховище й звітує про:

- структурні проблеми
- прогалини в походженні
- суперечності
- відкриті питання
- сторінки/твердження з низькою впевненістю
- застарілі сторінки/твердження

Запускайте це після змістовних оновлень wiki.

### `wiki search <query>`

Шукає вміст wiki.

Поведінка залежить від конфігурації:

- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`

Використовуйте `wiki search`, коли потрібне специфічне для wiki ранжування або деталі походження.
Для одного широкого проходу спільного пригадування віддавайте перевагу `openclaw memory search`, коли
Plugin активної пам’яті надає спільний пошук.

### `wiki get <lookup>`

Читає сторінку wiki за id або відносним шляхом.

Приклади:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Застосовує вузькі мутації без довільного хірургічного редагування сторінок.

Підтримувані сценарії охоплюють:

- створення/оновлення сторінки синтезу
- оновлення метаданих сторінки
- прикріплення source ids
- додавання питань
- додавання суперечностей
- оновлення впевненості/статусу
- запис структурованих тверджень

Ця команда існує, щоб wiki могла безпечно розвиватися без ручного редагування
керованих блоків.

### `wiki bridge import`

Імпортує публічні артефакти пам’яті з Plugin активної пам’яті у вихідні сторінки,
підтримувані bridge.

Використовуйте це в режимі `bridge`, коли хочете підтягнути до сховища wiki найновіші
експортовані артефакти пам’яті.

Для активного читання bridge-артефактів CLI маршрутизує імпорт через Gateway RPC,
щоб імпорт використовував контекст Plugin пам’яті середовища виконання. Якщо bridge-імпорти
вимкнено або читання артефактів вимкнено, команда зберігає локальну/офлайн
поведінку нульового імпорту.

### `wiki unsafe-local import`

Імпортує з явно налаштованих локальних шляхів у режимі `unsafe-local`.

Це навмисно експериментально й лише для тієї самої машини.

### `wiki obsidian ...`

Допоміжні команди Obsidian для сховищ, що працюють у режимі, дружньому до Obsidian.

Підкоманди:

- `status`
- `search`
- `open`
- `command`
- `daily`

Вони потребують офіційного CLI `obsidian` у `PATH`, коли
`obsidian.useOfficialCli` увімкнено.

## Практичні поради з використання

- Використовуйте `wiki search` + `wiki get`, коли походження та ідентичність сторінки важливі.
- Використовуйте `wiki apply` замість ручного редагування керованих згенерованих розділів.
- Використовуйте `wiki lint`, перш ніж довіряти суперечливому вмісту або вмісту з низькою впевненістю.
- Використовуйте `wiki compile` після масових імпортів або змін джерел, коли хочете негайно отримати свіжі
  панелі та скомпільовані дайджести.
- Використовуйте `wiki bridge import`, коли bridge-режим залежить від щойно експортованих артефактів пам’яті.

## Прив’язки до конфігурації

Поведінку `openclaw wiki` формують:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Див. [Plugin Memory Wiki](/uk/plugins/memory-wiki) для повної моделі конфігурації.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Memory wiki](/uk/plugins/memory-wiki)
