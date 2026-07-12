---
read_when:
    - Ви хочете використовувати CLI memory-wiki
    - Ви документуєте або змінюєте `openclaw wiki`
summary: Довідник CLI для `openclaw wiki` (стан сховища memory-wiki, пошук, компіляція, перевірка, застосування, міст, імпорт ChatGPT і допоміжні засоби Obsidian)
title: Вікі
x-i18n:
    generated_at: "2026-07-12T13:07:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Перевіряйте та обслуговуйте сховище `memory-wiki`. Надається вбудованим плагіном `memory-wiki`.

Пов’язані матеріали: [плагін Memory Wiki](/uk/plugins/memory-wiki), [огляд пам’яті](/uk/concepts/memory), [CLI: пам’ять](/uk/cli/memory)

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
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Вибір агента

Коли значення `plugins.entries.memory-wiki.config.vault.scope` дорівнює `agent`, виберіть
сховище за допомогою параметра верхнього рівня `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

У конфігурації з кількома налаштованими агентами параметр `--agent` є обов’язковим для операцій
CLI, щоб команда не могла читати або записувати довільне сховище за замовчуванням. Якщо
налаштовано лише одного агента, він залишається агентом за замовчуванням. Невідомі ідентифікатори агентів
спричиняють помилку до початку операції зі сховищем. Параметр не змінює вибраний
шлях, коли значення `vault.scope` дорівнює `global`.

Клієнти Gateway дотримуються того самого правила: передавайте `agentId` у запитах `wiki.*`,
які працюють зі сховищем, у багатоагентній конфігурації зі сховищами на рівні агентів. Відсутній або невідомий ідентифікатор є
помилкою. Ходи агента, інструменти вікі, доповнення корпусу пам’яті та скомпільовані дайджести
запитів уже містять контекст активного агента середовища виконання.

## Команди

### `wiki status`

Показує режим і область сховища, визначеного агента, стан справності та доступність CLI Obsidian. Спочатку використовуйте цю команду, щоб перевірити, чи ініціалізовано потрібне сховище, чи справний режим мосту та чи доступна інтеграція з Obsidian.

Коли режим мосту активний і налаштований на читання артефактів пам’яті, ця команда опитує запущений Gateway, тому бачить той самий контекст активного плагіна пам’яті, що й пам’ять агента або середовища виконання.

### `wiki doctor`

Запускає перевірки справності вікі та повідомляє про способи усунення проблем. Завершується з ненульовим кодом, якщо стан незадовільний.

Коли режим мосту активний і налаштований на читання артефактів пам’яті, ця команда опитує запущений Gateway перед формуванням звіту. Вимкнені імпорти мосту та конфігурації мосту, які не читають артефакти пам’яті, залишаються локальними й автономними.

Типові проблеми:

- режим мосту ввімкнено без загальнодоступних артефактів пам’яті
- неприпустима або відсутня структура сховища
- відсутній зовнішній CLI Obsidian, коли очікується режим Obsidian

### `wiki init`

Створює структуру сховища вікі та початкові сторінки, зокрема індекси верхнього рівня й каталоги кешу.

### `wiki ingest <path>`

Імпортує локальний файл Markdown або текстовий файл у каталог `sources/` вікі як сторінку джерела. `<path>` має бути шляхом до локального файлу; імпорт із URL наразі не підтримується. Двійкові файли відхиляються.

Імпортовані сторінки джерел містять метадані походження у frontmatter (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Після імпорту сховище завжди компілюється повторно.

Прапорець: `--title <title>` замінює заголовок джерела (за замовчуванням визначається з імені файлу).

### `wiki okf import <path>`

Імпортує розпакований пакет Open Knowledge Format у сторінки концепцій вікі.

Імпортер читає кожен незарезервований документ концепції `.md` у дереві каталогів OKF, вимагає непорожнє поле `type` і трактує невідомі значення `type` OKF як загальні концепції. Зарезервовані файли OKF `index.md` і `log.md` не імпортуються як концепції.

Імпортовані сторінки розміщуються без ієрархії в `concepts/`, тому наявні процеси компіляції, пошуку, отримання, створення дайджестів і панелей вікі відразу їх бачать. Початковий ідентифікатор концепції OKF, `type`, `resource`, `tags`, часова позначка, шлях до джерела та повний frontmatter зберігаються у frontmatter сторінки. Внутрішні посилання Markdown OKF переписуються на створені сторінки вікі; пошкоджені або зовнішні посилання залишаються без змін. Після імпорту сховище завжди компілюється повторно.

Приклади:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Перебудовує індекси, пов’язані блоки, панелі та скомпільовані дайджести. Записує стабільні машинозчитувані артефакти до:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Якщо `render.createDashboards` увімкнено, компіляція також оновлює сторінки звітів.

### `wiki lint`

Перевіряє сховище та записує звіт, що охоплює:

- структурні проблеми (пошкоджені посилання, відсутні або дубльовані ідентифікатори, відсутній тип сторінки чи заголовок, неприпустимий frontmatter)
- прогалини в походженні (відсутні ідентифікатори джерел, відсутні відомості про походження імпорту)
- суперечності (позначені суперечності, конфліктні твердження)
- відкриті питання
- сторінки та твердження з низьким рівнем упевненості
- застарілі сторінки та твердження

Запускайте цю команду після суттєвих оновлень вікі.

### `wiki search <query>`

Шукає вміст вікі. Поведінка залежить від конфігурації:

- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` або `raw-claim`

Використовуйте `wiki search` для ранжування та відстеження походження, специфічних для вікі. Для одного широкого спільного пошуку в пам’яті віддавайте перевагу `openclaw memory search`, коли активний плагін пам’яті надає спільний пошук.

Режими пошуку:

- `find-person`: псевдоніми, імена користувачів, профілі в соціальних мережах, канонічні ідентифікатори та сторінки людей
- `route-question`: підказки про те, до кого звертатися й для чого найкраще використовувати, а також контекст зв’язків
- `source-evidence`: сторінки джерел і структуровані поля доказів
- `raw-claim`: текст структурованого твердження з метаданими твердження та доказів

Приклади:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Текстовий вивід містить рядки `Claim:` і `Evidence:`, коли результат відповідає структурованому твердженню. Вивід JSON додатково надає `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` і `evidenceSourceIds` для детальнішого аналізу агентом.

### `wiki get <lookup>`

Читає сторінку вікі за ідентифікатором або відносним шляхом.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Застосовує точкові зміни без довільного редагування сторінки:

- `apply synthesis <title>`: створює або оновлює сторінку синтезу з керованим текстом підсумку
- `apply metadata <lookup>`: оновлює метадані наявної сторінки

Обидві команди приймають `--source-id`, `--contradiction`, `--question` (кожен параметр можна повторювати), `--confidence <n>` (0–1) і `--status <status>`. `apply metadata` також приймає `--clear-confidence` для видалення збереженого значення рівня впевненості. Це підтримуваний спосіб розвивати сторінки вікі, не порушуючи керовані згенеровані блоки.

### `wiki bridge import`

Імпортує загальнодоступні артефакти пам’яті з активного плагіна пам’яті до сторінок джерел, що працюють через міст. Використовуйте цю команду в режимі `bridge`, щоб завантажити до сховища вікі найновіші експортовані артефакти пам’яті.

Для активного читання артефактів мосту CLI спрямовує імпорт через RPC Gateway, щоб використовувати контекст плагіна пам’яті середовища виконання. Якщо імпорти мосту вимкнено або читання артефактів неактивне, команда зберігає локальну й автономну поведінку з нульовим імпортом. Оновлення індексу після імпорту контролюється параметром `ingest.autoCompile`.

### `wiki unsafe-local import`

Імпортує з явно налаштованих локальних шляхів (`unsafeLocal.paths`) у режимі `unsafe-local`. Навмисно експериментальна функція, призначена лише для використання на тому самому комп’ютері. Оновлення індексу після імпорту контролюється параметром `ingest.autoCompile`.

### `wiki chatgpt import`

Імпортує експорт ChatGPT до чернеток сторінок джерел вікі.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Прапорець         | Типове значення | Опис                                                                  |
| ----------------- | --------------- | --------------------------------------------------------------------- |
| `--export <path>` | (обов’язковий)  | Каталог експорту ChatGPT або шлях до `conversations.json`.            |
| `--dry-run`       | `false`         | Попередньо показує кількість створених, оновлених і пропущених сторінок без їх записування. |

Імпорт без `--dry-run`, який змінює будь-яку сторінку, реєструє ідентифікатор запуску імпорту, показаний у підсумку та потрібний для відкочування.

### `wiki chatgpt rollback <run-id>`

Відкочує раніше застосований запуск імпорту ChatGPT, видаляючи створені ним сторінки та відновлюючи перезаписані. Не виконує жодних дій (і повідомляє `alreadyRolledBack`), якщо запуск уже було відкочено.

### `wiki obsidian ...`

Допоміжні команди Obsidian для сховищ, що працюють у сумісному з Obsidian режимі: `status`, `search`, `open`, `command`, `daily`. Коли `obsidian.useOfficialCli` увімкнено, для них потрібен офіційний CLI `obsidian` у `PATH`.

Перевірка конфігурації відхиляє `obsidian.useOfficialCli: true`, коли
значення `vault.scope` дорівнює `agent`, оскільки `obsidian.vaultName` є одним глобальним параметром,
а не зіставленням для кожного агента. Відтворення Markdown, сумісне з Obsidian, залишається
доступним.

## Практичні рекомендації щодо використання

- Використовуйте `wiki search` разом із `wiki get`, коли важливі походження та ідентичність сторінки.
- Використовуйте `wiki apply` замість ручного редагування керованих згенерованих розділів.
- Використовуйте `wiki lint`, перш ніж довіряти суперечливому вмісту або вмісту з низьким рівнем упевненості.
- Використовуйте `wiki compile` після масових імпортів або змін джерел, якщо вам негайно потрібні оновлені панелі та скомпільовані дайджести.
- Використовуйте `wiki okf import`, коли каталог даних, експорт документації або конвеєр збагачення агента вже створює пакети Markdown OKF.
- Використовуйте `wiki bridge import`, коли режим мосту залежить від нещодавно експортованих артефактів пам’яті.

## Пов’язані параметри конфігурації

На поведінку `openclaw wiki` впливають:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Повну модель конфігурації див. у документації [плагіна Memory Wiki](/uk/plugins/memory-wiki).

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [Вікі пам’яті](/uk/plugins/memory-wiki)
