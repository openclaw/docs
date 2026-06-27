---
read_when:
    - Ви хочете використовувати CLI memory-wiki
    - Ви документуєте або змінюєте `openclaw wiki`
summary: Довідник CLI для `openclaw wiki` (стан сховища memory-wiki, пошук, компіляція, lint, застосування, міст і помічники Obsidian)
title: Вікі
x-i18n:
    generated_at: "2026-06-27T17:23:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Перевіряйте й підтримуйте сховище `memory-wiki`.

Надається вбудованим Plugin `memory-wiki`.

Пов’язано:

- [Plugin Memory Wiki](/uk/plugins/memory-wiki)
- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: пам’ять](/uk/cli/memory)

## Для чого це

Використовуйте `openclaw wiki`, коли потрібне скомпільоване сховище знань із:

- wiki-нативним пошуком і читанням сторінок
- синтезами з багатим походженням даних
- звітами про суперечності й актуальність
- мостовими імпортами з активного Plugin пам’яті
- необов’язковими помічниками Obsidian CLI

## Поширені команди

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
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

Перевірити поточний режим сховища, стан і доступність Obsidian CLI.

Скористайтеся цим спершу, якщо не впевнені, чи ініціалізовано сховище, чи
справний режим мосту, або чи доступна інтеграція з Obsidian.

Коли режим мосту активний і налаштований на читання артефактів пам’яті, ця
команда опитує запущений Gateway, тож бачить той самий контекст активного Plugin
пам’яті, що й пам’ять агента/середовища виконання.

### `wiki doctor`

Запустити перевірки стану wiki й показати проблеми конфігурації або сховища.

Коли режим мосту активний і налаштований на читання артефактів пам’яті, ця
команда опитує запущений Gateway перед побудовою звіту. Вимкнені мостові
імпорти й конфігурації мосту, які не читають артефакти пам’яті, залишаються
локальними/офлайн.

Типові проблеми:

- режим мосту ввімкнено без публічних артефактів пам’яті
- недійсна або відсутня структура сховища
- відсутній зовнішній Obsidian CLI, коли очікується режим Obsidian

### `wiki init`

Створити структуру wiki-сховища й початкові сторінки.

Це ініціалізує кореневу структуру, включно з індексами верхнього рівня та
каталогами кешу.

### `wiki ingest <path-or-url>`

Імпортувати вміст у вихідний шар wiki.

Примітки:

- URL-імпорт контролюється `ingest.allowUrlIngest`
- імпортовані вихідні сторінки зберігають походження у frontmatter
- автоматична компіляція може запускатися після імпорту, коли її ввімкнено

### `wiki okf import <path>`

Імпортувати розпакований пакет Open Knowledge Format у концептуальні сторінки wiki.

Імпортер читає кожен незарезервований концептуальний документ `.md` у дереві
каталогів OKF, вимагає непорожнього поля `type` і трактує невідомі значення OKF
`type` як загальні концепти. Зарезервовані OKF-файли `index.md` і `log.md` не
імпортуються як концепти.

Імпортовані сторінки сплощуються під `concepts/`, тому наявні потоки wiki для
компіляції, пошуку, отримання, дайджестів і панелей одразу їх бачать. Оригінальні
ідентифікатор концепту OKF, `type`, `resource`, `tags`, позначка часу, шлях
джерела й повний frontmatter зберігаються у frontmatter сторінки. Внутрішні
markdown-посилання OKF переписуються на згенеровані wiki-сторінки; пошкоджені
або зовнішні посилання лишаються без змін.

Приклади:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Перебудувати індекси, пов’язані блоки, панелі й скомпільовані дайджести.

Це записує стабільні машинно-орієнтовані артефакти до:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Якщо `render.createDashboards` увімкнено, компіляція також оновлює сторінки звітів.

### `wiki lint`

Перевірити сховище й повідомити про:

- структурні проблеми
- прогалини в походженні даних
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
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` або
  `raw-claim`

Використовуйте `wiki search`, коли потрібні специфічне для wiki ранжування або
деталі походження даних. Для одного широкого проходу спільного пригадування
віддавайте перевагу `openclaw memory search`, коли активний Plugin пам’яті
надає спільний пошук.

Режими пошуку допомагають агенту вибрати правильну поверхню:

- `find-person`: псевдоніми, handles, соцмережі, канонічні ідентифікатори та сторінки людей
- `route-question`: підказки ask-for/best-used-for і контекст взаємозв’язків
- `source-evidence`: вихідні сторінки та структуровані поля доказів
- `raw-claim`: структурований текст твердження з метаданими твердження/доказів

Приклади:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Текстовий вивід містить рядки `Claim:` і `Evidence:`, коли результат відповідає
структурованому твердженню. JSON-вивід додатково надає `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` і
`evidenceSourceIds` для детального аналізу на боці агента.

### `wiki get <lookup>`

Прочитати wiki-сторінку за ідентифікатором або відносним шляхом.

Приклади:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Застосувати вузькі зміни без довільної ручної правки сторінок.

Підтримувані потоки включають:

- створення/оновлення сторінки синтезу
- оновлення метаданих сторінки
- прикріплення ідентифікаторів джерел
- додавання питань
- додавання суперечностей
- оновлення впевненості/статусу
- запис структурованих тверджень

Ця команда існує, щоб wiki могла безпечно розвиватися без ручного редагування
керованих блоків.

### `wiki bridge import`

Імпортувати публічні артефакти пам’яті з активного Plugin пам’яті у вихідні
сторінки, підтримані мостом.

Використовуйте це в режимі `bridge`, коли потрібно підтягнути до wiki-сховища
найновіші експортовані артефакти пам’яті.

Для активних читань мостових артефактів CLI маршрутизує імпорт через Gateway RPC,
щоб імпорт використовував контекст Plugin пам’яті середовища виконання. Якщо
мостові імпорти вимкнено або читання артефактів вимкнене, команда зберігає
локальну/офлайн поведінку нульового імпорту.

### `wiki unsafe-local import`

Імпортувати з явно налаштованих локальних шляхів у режимі `unsafe-local`.

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

- Використовуйте `wiki search` + `wiki get`, коли важливі походження даних та ідентичність сторінки.
- Використовуйте `wiki apply` замість ручного редагування керованих згенерованих розділів.
- Використовуйте `wiki lint`, перш ніж довіряти суперечливому або низьковпевненому вмісту.
- Використовуйте `wiki compile` після масових імпортів або змін джерел, коли
  потрібні свіжі панелі й скомпільовані дайджести негайно.
- Використовуйте `wiki okf import`, коли каталог даних, експорт документації або
  конвеєр збагачення агента вже створює markdown-пакети OKF.
- Використовуйте `wiki bridge import`, коли режим мосту залежить від
  нещодавно експортованих артефактів пам’яті.

## Зв’язки з конфігурацією

Поведінку `openclaw wiki` визначають:

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
