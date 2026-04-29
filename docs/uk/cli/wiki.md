---
read_when:
    - Ви хочете використовувати CLI memory-wiki
    - Ви документуєте або змінюєте `openclaw wiki`
summary: Довідник CLI для `openclaw wiki` (стан сховища memory-wiki, search, compile, lint, apply, bridge і допоміжні засоби Obsidian)
title: Вікі
x-i18n:
    generated_at: "2026-04-29T19:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Переглядайте та підтримуйте сховище `memory-wiki`.

Надається вбудованим plugin `memory-wiki`.

Пов’язано:

- [Plugin Memory Wiki](/uk/plugins/memory-wiki)
- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: пам’ять](/uk/cli/memory)

## Для чого це потрібно

Використовуйте `openclaw wiki`, коли потрібне скомпільоване сховище знань із:

- wiki-орієнтованим пошуком і читанням сторінок
- синтезами з багатою інформацією про походження
- звітами про суперечності та актуальність
- мостовими імпортами з active memory plugin
- необов’язковими помічниками Obsidian CLI

## Поширені команди

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
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

Перевіряє поточний режим сховища, стан працездатності та доступність Obsidian CLI.

Спершу використовуйте це, якщо не впевнені, чи ініціалізовано сховище, чи справний bridge mode, або чи доступна інтеграція з Obsidian.

Коли bridge mode активний і налаштований на читання артефактів пам’яті, ця команда опитує запущений Gateway, тому бачить той самий контекст active memory plugin, що й пам’ять агента/середовища виконання.

### `wiki doctor`

Запускає перевірки стану wiki та показує проблеми конфігурації або сховища.

Коли bridge mode активний і налаштований на читання артефактів пам’яті, ця команда опитує запущений Gateway перед побудовою звіту. Вимкнені bridge-імпорти та bridge-конфігурації, що не читають артефакти пам’яті, залишаються локальними/офлайн.

Типові проблеми:

- bridge mode увімкнено без публічних артефактів пам’яті
- недійсна або відсутня структура сховища
- відсутній зовнішній Obsidian CLI, коли очікується режим Obsidian

### `wiki init`

Створює структуру wiki-сховища та початкові сторінки.

Це ініціалізує кореневу структуру, зокрема індекси верхнього рівня та каталоги кешу.

### `wiki ingest <path-or-url>`

Імпортує вміст у джерельний шар wiki.

Примітки:

- імпорт URL керується `ingest.allowUrlIngest`
- імпортовані сторінки джерел зберігають походження у frontmatter
- автоматична компіляція може запускатися після імпорту, якщо її ввімкнено

### `wiki compile`

Перебудовує індекси, пов’язані блоки, дашборди та скомпільовані дайджести.

Це записує стабільні машинно-орієнтовані артефакти в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Якщо `render.createDashboards` увімкнено, компіляція також оновлює сторінки звітів.

### `wiki lint`

Перевіряє сховище та звітує про:

- структурні проблеми
- прогалини в походженні
- суперечності
- відкриті питання
- сторінки/твердження з низькою впевненістю
- застарілі сторінки/твердження

Запускайте це після значущих оновлень wiki.

### `wiki search <query>`

Шукає вміст wiki.

Поведінка залежить від конфігурації:

- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` або
  `raw-claim`

Використовуйте `wiki search`, коли потрібне специфічне для wiki ранжування або подробиці походження. Для одного широкого спільного проходу пригадування надавайте перевагу `openclaw memory search`, коли active memory plugin надає спільний пошук.

Режими пошуку допомагають агенту вибрати правильну поверхню:

- `find-person`: псевдоніми, handles, соцмережі, канонічні ID та сторінки людей
- `route-question`: підказки, кого запитати/для чого найкраще використовувати, і контекст зв’язків
- `source-evidence`: сторінки джерел і структуровані поля доказів
- `raw-claim`: структурований текст твердження з метаданими твердження/доказів

Приклади:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Текстовий вивід містить рядки `Claim:` і `Evidence:`, коли результат відповідає структурованому твердженню. JSON-вивід додатково надає `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` і `evidenceSourceIds` для деталізації на боці агента.

### `wiki get <lookup>`

Читає wiki-сторінку за id або відносним шляхом.

Приклади:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Застосовує вузькі мутації без довільного редагування сторінок.

Підтримувані сценарії:

- створення/оновлення сторінки синтезу
- оновлення метаданих сторінки
- прикріплення ID джерел
- додавання питань
- додавання суперечностей
- оновлення впевненості/статусу
- запис структурованих тверджень

Ця команда існує, щоб wiki могла безпечно розвиватися без ручного редагування керованих блоків.

### `wiki bridge import`

Імпортує публічні артефакти пам’яті з active memory plugin у source pages, підтримувані bridge.

Використовуйте це в режимі `bridge`, коли потрібно втягнути до wiki-сховища найновіші експортовані артефакти пам’яті.

Для активного читання bridge-артефактів CLI маршрутизує імпорт через Gateway RPC, щоб імпорт використовував контекст memory plugin середовища виконання. Якщо bridge-імпорти вимкнено або читання артефактів вимкнено, команда зберігає локальну/офлайн поведінку нульового імпорту.

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

Вони потребують офіційного CLI `obsidian` у `PATH`, коли ввімкнено `obsidian.useOfficialCli`.

## Практичні поради з використання

- Використовуйте `wiki search` + `wiki get`, коли важливі походження та ідентичність сторінки.
- Використовуйте `wiki apply` замість ручного редагування керованих згенерованих секцій.
- Використовуйте `wiki lint`, перш ніж довіряти суперечливому вмісту або вмісту з низькою впевненістю.
- Використовуйте `wiki compile` після масових імпортів або змін джерел, коли потрібні свіжі дашборди та скомпільовані дайджести негайно.
- Використовуйте `wiki bridge import`, коли bridge mode залежить від щойно експортованих артефактів пам’яті.

## Зв’язки з конфігурацією

Поведінка `openclaw wiki` формується такими параметрами:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Див. [Plugin Memory Wiki](/uk/plugins/memory-wiki) для повної моделі конфігурації.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Memory wiki](/uk/plugins/memory-wiki)
