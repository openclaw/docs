---
read_when:
    - Ви хочете використовувати CLI memory-wiki
    - Ви документуєте або змінюєте `openclaw wiki`
summary: Довідник CLI для `openclaw wiki` (статус, пошук, компіляція, lint, застосування, bridge і допоміжні засоби Obsidian для сховища memory-wiki)
title: Вікі
x-i18n:
    generated_at: "2026-04-23T20:49:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76289ee6732c4baaaa50dd14d97b20b454b43a2444d0eb278cf832893058a44f
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Перегляд і обслуговування сховища `memory-wiki`.

Надається вбудованим plugin `memory-wiki`.

Пов’язане:

- [Plugin Memory Wiki](/uk/plugins/memory-wiki)
- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: memory](/uk/cli/memory)

## Для чого це потрібно

Використовуйте `openclaw wiki`, коли вам потрібне скомпільоване сховище знань із:

- пошуком і читанням сторінок, нативними для wiki
- синтезами з багатим provenance
- звітами про суперечності та актуальність
- bridge-імпортом з активного plugin пам’яті
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

Переглянути поточний режим сховища, стан і доступність CLI Obsidian.

Використовуйте це спочатку, коли не впевнені, чи сховище ініціалізовано, чи bridge-режим
справний, або чи доступна інтеграція з Obsidian.

### `wiki doctor`

Запустити перевірки стану wiki та показати проблеми конфігурації або сховища.

Типові проблеми включають:

- bridge-режим увімкнено без публічних артефактів пам’яті
- невалідна або відсутня структура сховища
- відсутній зовнішній CLI Obsidian, коли очікується режим Obsidian

### `wiki init`

Створити структуру сховища wiki та стартові сторінки.

Це ініціалізує кореневу структуру, включно з індексами верхнього рівня та cache-каталогами.

### `wiki ingest <path-or-url>`

Імпортувати вміст до вихідного шару wiki.

Примітки:

- URL-ingest контролюється через `ingest.allowUrlIngest`
- імпортовані вихідні сторінки зберігають provenance у frontmatter
- після ingest може автоматично запускатися compile, якщо це ввімкнено

### `wiki compile`

Перебудувати індекси, пов’язані блоки, dashboards і скомпільовані дайджести.

Це записує стабільні артефакти для машинного використання до:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Якщо ввімкнено `render.createDashboards`, compile також оновлює сторінки звітів.

### `wiki lint`

Перевірити сховище lint-ом і повідомити про:

- структурні проблеми
- прогалини provenance
- суперечності
- відкриті питання
- сторінки/твердження з низькою впевненістю
- застарілі сторінки/твердження

Запускайте це після суттєвих оновлень wiki.

### `wiki search <query>`

Шукати вміст wiki.

Поведінка залежить від конфігурації:

- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`

Використовуйте `wiki search`, коли вам потрібне специфічне для wiki ранжування або деталі provenance.
Для одного широкого спільного проходу пошуку краще використовуйте `openclaw memory search`, коли
активний plugin пам’яті надає спільний пошук.

### `wiki get <lookup>`

Прочитати сторінку wiki за id або відносним шляхом.

Приклади:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Застосувати вузькі зміни без вільного редагування сторінки.

Підтримувані сценарії включають:

- створення/оновлення сторінки синтезу
- оновлення метаданих сторінки
- прикріплення source id
- додавання питань
- додавання суперечностей
- оновлення confidence/status
- запис структурованих тверджень

Ця команда існує, щоб wiki могла безпечно розвиватися без ручного редагування
керованих блоків.

### `wiki bridge import`

Імпортувати публічні артефакти пам’яті з активного plugin пам’яті до вихідних сторінок,
підтримуваних bridge.

Використовуйте це в режимі `bridge`, коли хочете підтягнути до сховища wiki
найновіші експортовані артефакти пам’яті.

### `wiki unsafe-local import`

Імпортувати з явно налаштованих локальних шляхів у режимі `unsafe-local`.

Це навмисно експериментальна можливість і працює лише на тій самій машині.

### `wiki obsidian ...`

Допоміжні команди Obsidian для сховищ, що працюють у режимі, дружньому до Obsidian.

Підкоманди:

- `status`
- `search`
- `open`
- `command`
- `daily`

Вони потребують офіційного CLI `obsidian` у `PATH`, коли
ввімкнено `obsidian.useOfficialCli`.

## Практичні рекомендації щодо використання

- Використовуйте `wiki search` + `wiki get`, коли важливі provenance та ідентичність сторінки.
- Використовуйте `wiki apply` замість ручного редагування керованих згенерованих розділів.
- Використовуйте `wiki lint`, перш ніж довіряти суперечливому або низьковпевненому вмісту.
- Використовуйте `wiki compile` після масових імпортів або змін джерел, коли вам одразу потрібні свіжі
  dashboards і скомпільовані дайджести.
- Використовуйте `wiki bridge import`, коли bridge-режим залежить від щойно експортованих артефактів пам’яті.

## Пов’язані елементи конфігурації

Поведінка `openclaw wiki` визначається такими налаштуваннями:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Повну модель конфігурації див. у [plugin Memory Wiki](/uk/plugins/memory-wiki).
