---
read_when:
    - Ви хочете використовувати CLI memory-wiki
    - Ви документуєте або змінюєте `openclaw wiki`
summary: Довідка CLI для `openclaw wiki` (стан сховища memory-wiki, пошук, компіляція, lint, застосування, міст і допоміжні засоби Obsidian)
title: вікі
x-i18n:
    generated_at: "2026-04-23T06:19:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Перегляд і підтримка сховища `memory-wiki`.

Надається вбудованим Plugin `memory-wiki`.

Пов’язане:

- [Plugin Memory Wiki](/uk/plugins/memory-wiki)
- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: memory](/uk/cli/memory)

## Для чого це потрібно

Використовуйте `openclaw wiki`, коли вам потрібне скомпільоване сховище знань із:

- пошуком і читанням сторінок, нативними для вікі
- синтезами з багатим походженням даних
- звітами про суперечності та актуальність
- імпортом через міст з активного Plugin пам’яті
- необов’язковими допоміжними засобами CLI для Obsidian

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

Переглянути поточний режим сховища, його стан і доступність CLI Obsidian.

Спочатку використовуйте це, якщо ви не впевнені, чи сховище ініціалізовано, чи режим bridge
працює коректно, або чи доступна інтеграція з Obsidian.

### `wiki doctor`

Запустити перевірки стану вікі й показати проблеми конфігурації або сховища.

Типові проблеми включають:

- увімкнений режим bridge без публічних артефактів пам’яті
- невалідний або відсутній макет сховища
- відсутній зовнішній CLI Obsidian, коли очікується режим Obsidian

### `wiki init`

Створити макет сховища вікі та стартові сторінки.

Це ініціалізує кореневу структуру, включно з індексами верхнього рівня та каталогами
кешу.

### `wiki ingest <path-or-url>`

Імпортувати вміст до шару джерел вікі.

Примітки:

- імпорт URL контролюється `ingest.allowUrlIngest`
- імпортовані сторінки джерел зберігають походження даних у frontmatter
- за наявності відповідного налаштування після імпорту може запускатися автокомпіляція

### `wiki compile`

Перебудувати індекси, пов’язані блоки, dashboard і скомпільовані дайджести.

Це записує стабільні машинно-орієнтовані артефакти до:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Якщо ввімкнено `render.createDashboards`, compile також оновлює сторінки звітів.

### `wiki lint`

Перевірити сховище та повідомити про:

- структурні проблеми
- прогалини в походженні даних
- суперечності
- відкриті питання
- сторінки/твердження з низькою впевненістю
- застарілі сторінки/твердження

Запускайте це після суттєвих оновлень вікі.

### `wiki search <query>`

Шукати вміст вікі.

Поведінка залежить від конфігурації:

- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`

Використовуйте `wiki search`, коли вам потрібні ранжування, специфічне для вікі, або деталі походження даних.
Для одного широкого проходу спільного пошуку віддавайте перевагу `openclaw memory search`, коли
активний Plugin пам’яті надає спільний пошук.

### `wiki get <lookup>`

Прочитати сторінку вікі за id або відносним шляхом.

Приклади:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Застосувати вузькі зміни без довільного редагування сторінок.

Підтримувані сценарії включають:

- створення/оновлення сторінки синтезу
- оновлення метаданих сторінки
- приєднання id джерел
- додавання питань
- додавання суперечностей
- оновлення впевненості/статусу
- запис структурованих тверджень

Ця команда існує для того, щоб вікі могла безпечно розвиватися без ручного редагування
керованих блоків.

### `wiki bridge import`

Імпортувати публічні артефакти пам’яті з активного Plugin пам’яті до сторінок джерел,
що підтримуються bridge.

Використовуйте це в режимі `bridge`, коли хочете, щоб до сховища вікі було підтягнуто
останні експортовані артефакти пам’яті.

### `wiki unsafe-local import`

Імпортувати з явно налаштованих локальних шляхів у режимі `unsafe-local`.

Це навмисно експериментальна функція й працює лише в межах тієї самої машини.

### `wiki obsidian ...`

Допоміжні команди Obsidian для сховищ, що працюють у режимі, дружньому до Obsidian.

Підкоманди:

- `status`
- `search`
- `open`
- `command`
- `daily`

Для них потрібен офіційний CLI `obsidian` у `PATH`, коли
увімкнено `obsidian.useOfficialCli`.

## Практичні поради щодо використання

- Використовуйте `wiki search` + `wiki get`, коли важливі походження даних і ідентичність сторінки.
- Використовуйте `wiki apply` замість ручного редагування керованих згенерованих розділів.
- Використовуйте `wiki lint`, перш ніж довіряти суперечливому вмісту або вмісту з низькою впевненістю.
- Використовуйте `wiki compile` після масових імпортів або змін у джерелах, коли вам одразу потрібні свіжі
  dashboard і скомпільовані дайджести.
- Використовуйте `wiki bridge import`, коли режим bridge залежить від нових експортованих артефактів пам’яті.

## Пов’язані налаштування конфігурації

Поведінка `openclaw wiki` визначається такими параметрами:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Повну модель конфігурації див. у [Plugin Memory Wiki](/uk/plugins/memory-wiki).
