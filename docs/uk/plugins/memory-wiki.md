---
read_when:
    - Вам потрібні постійні знання, що виходять за межі простих нотаток MEMORY.md
    - Ви налаштовуєте вбудований Plugin memory-wiki
    - Ви хочете зрозуміти wiki_search, wiki_get або режим мосту
summary: 'memory-wiki: скомпільоване сховище знань із даними про походження, твердженнями, інформаційними панелями та режимом мосту'
title: Вікі пам’яті
x-i18n:
    generated_at: "2026-04-28T11:19:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76e783930fbe1bbeeac309dda5a3075cab0e062338cf084a2a493e0afe7e0d87
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` — це bundled Plugin, який перетворює довготривалу пам’ять на скомпільоване
сховище знань.

Він **не** замінює Plugin Active Memory. Plugin Active Memory і далі
відповідає за recall, promotion, indexing і Dreaming. `memory-wiki` працює поруч із ним
і компілює довготривалі знання в навігаційну вікі з детермінованими сторінками,
структурованими твердженнями, походженням, дашбордами та машинозчитуваними дайджестами.

Використовуйте його, коли хочете, щоб пам’ять поводилася радше як підтримуваний шар знань, а
не як купа Markdown-файлів.

## Що він додає

- Окреме сховище вікі з детермінованою структурою сторінок
- Структуровані метадані тверджень і доказів, а не лише текст
- Походження, упевненість, суперечності та відкриті питання на рівні сторінок
- Скомпільовані дайджести для агентів і споживачів runtime
- Вікі-рідні інструменти пошуку/get/apply/lint
- Необов’язковий режим bridge, який імпортує публічні артефакти з Plugin Active Memory
- Необов’язковий режим render, зручний для Obsidian, та інтеграція з CLI

## Як він поєднується з пам’яттю

Поділ можна уявити так:

| Шар                                                     | Відповідає за                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho тощо)  | Recall, семантичний пошук, promotion, Dreaming, runtime пам’яті                            |
| `memory-wiki`                                           | Скомпільовані вікі-сторінки, синтези з багатим походженням, дашборди, специфічні для вікі search/get/apply |

Якщо Plugin Active Memory надає спільні артефакти recall, OpenClaw може шукати
в обох шарах за один прохід за допомогою `memory_search corpus=all`.

Коли вам потрібне специфічне для вікі ранжування, походження або прямий доступ до сторінок, використовуйте
натомість вікі-рідні інструменти.

## Рекомендований гібридний патерн

Надійний стандартний варіант для local-first налаштувань:

- QMD як бекенд Active Memory для recall і широкого семантичного пошуку
- `memory-wiki` у режимі `bridge` для довготривалих синтезованих сторінок знань

Такий поділ добре працює, бо кожен шар залишається сфокусованим:

- QMD зберігає сирі нотатки, експорти сесій і додаткові колекції доступними для пошуку
- `memory-wiki` компілює стабільні сутності, твердження, дашборди та сторінки джерел

Практичне правило:

- використовуйте `memory_search`, коли потрібен один широкий прохід recall по пам’яті
- використовуйте `wiki_search` і `wiki_get`, коли потрібні вікі-результати з урахуванням походження
- використовуйте `memory_search corpus=all`, коли хочете, щоб спільний пошук охоплював обидва шари

Якщо режим bridge повідомляє про нуль експортованих артефактів, Plugin Active Memory наразі
ще не надає публічні bridge-входи. Спершу запустіть `openclaw wiki doctor`,
а потім підтвердьте, що Plugin Active Memory підтримує публічні артефакти.

Коли режим bridge активний і `bridge.readMemoryArtifacts` увімкнено,
`openclaw wiki status`, `openclaw wiki doctor` та `openclaw wiki bridge
import` читають через запущений Gateway. Це узгоджує CLI-перевірки bridge
з контекстом runtime Plugin пам’яті. Якщо bridge вимкнено або читання артефактів
вимкнено, ці команди зберігають свою локальну/offline поведінку.

## Режими сховища

`memory-wiki` підтримує три режими сховища:

### `isolated`

Власне сховище, власні джерела, без залежності від `memory-core`.

Використовуйте це, коли хочете, щоб вікі була власним curated сховищем знань.

### `bridge`

Читає публічні артефакти пам’яті та події пам’яті з Plugin Active Memory
через публічні шви plugin SDK.

Використовуйте це, коли хочете, щоб вікі компілювала та впорядковувала
експортовані артефакти Plugin пам’яті, не звертаючись до приватних внутрішніх частин Plugin.

Режим bridge може індексувати:

- експортовані артефакти пам’яті
- звіти Dreaming
- щоденні нотатки
- кореневі файли пам’яті
- журнали подій пам’яті

### `unsafe-local`

Явний аварійний вихід для приватних локальних шляхів на тій самій машині.

Цей режим навмисно експериментальний і непереносний. Використовуйте його лише тоді, коли
розумієте межу довіри й вам справді потрібен доступ до локальної файлової системи, який
режим bridge не може надати.

## Структура сховища

Plugin ініціалізує сховище так:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Керований вміст залишається всередині згенерованих блоків. Людські блоки нотаток зберігаються.

Основні групи сторінок:

- `sources/` для імпортованого сирого матеріалу та сторінок, підтриманих bridge
- `entities/` для довготривалих речей, людей, систем, проєктів і об’єктів
- `concepts/` для ідей, абстракцій, патернів і політик
- `syntheses/` для скомпільованих підсумків і підтримуваних зведень
- `reports/` для згенерованих дашбордів

## Структуровані твердження та докази

Сторінки можуть містити структурований frontmatter `claims`, а не лише довільний текст.

Кожне твердження може містити:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Записи доказів можуть містити:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Саме це робить вікі радше шаром переконань, ніж пасивним
смітником нотаток. Твердження можна відстежувати, оцінювати, оскаржувати й повертати до джерел.

## Пайплайн компіляції

Крок компіляції читає вікі-сторінки, нормалізує підсумки та випускає стабільні
машинні артефакти в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ці дайджести існують, щоб агентам і runtime-коду не доводилося скрейпити Markdown-сторінки.

Скомпільований вихід також забезпечує:

- первинне вікі-індексування для потоків search/get
- пошук за claim-id назад до сторінок-власників
- компактні доповнення prompt
- генерацію звітів/дашбордів

## Дашборди та звіти про стан

Коли `render.createDashboards` увімкнено, compile підтримує дашборди в
`reports/`.

Вбудовані звіти містять:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Ці звіти відстежують такі речі, як:

- кластери нотаток із суперечностями
- кластери конкуруючих тверджень
- твердження без структурованих доказів
- сторінки та твердження з низькою впевненістю
- застарілість або невідома актуальність
- сторінки з нерозв’язаними питаннями

## Пошук і отримання

`memory-wiki` підтримує два бекенди пошуку:

- `shared`: використовувати спільний потік пошуку пам’яті, коли він доступний
- `local`: шукати у вікі локально

Він також підтримує три корпуси:

- `wiki`
- `memory`
- `all`

Важлива поведінка:

- `wiki_search` і `wiki_get` за можливості використовують скомпільовані дайджести як перший прохід
- id тверджень можуть переходити назад до сторінки-власника
- спірні/застарілі/свіжі твердження впливають на ранжування
- мітки походження можуть зберігатися в результатах

Практичне правило:

- використовуйте `memory_search corpus=all` для одного широкого проходу recall
- використовуйте `wiki_search` + `wiki_get`, коли для вас важливі специфічне для вікі ранжування,
  походження або структура переконань на рівні сторінки

## Інструменти агента

Plugin реєструє ці інструменти:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Що вони роблять:

- `wiki_status`: поточний режим сховища, стан, доступність Obsidian CLI
- `wiki_search`: пошук вікі-сторінок і, якщо налаштовано, спільних корпусів пам’яті
- `wiki_get`: читання вікі-сторінки за id/path або fallback до спільного корпусу пам’яті
- `wiki_apply`: вузькі зміни синтезу/метаданих без довільної хірургії сторінок
- `wiki_lint`: структурні перевірки, прогалини походження, суперечності, відкриті питання

Plugin також реєструє неексклюзивне доповнення корпусу пам’яті, тож спільні
`memory_search` і `memory_get` можуть діставатися вікі, коли Plugin Active Memory
підтримує вибір корпусу.

## Поведінка prompt і контексту

Коли `context.includeCompiledDigestPrompt` увімкнено, секції prompt пам’яті
додають компактний скомпільований знімок з `agent-digest.json`.

Цей знімок навмисно малий і з високою корисністю:

- лише найважливіші сторінки
- лише найважливіші твердження
- кількість суперечностей
- кількість питань
- кваліфікатори впевненості/свіжості

Це opt-in, бо воно змінює форму prompt і переважно корисне для рушіїв контексту
або legacy-складання prompt, які явно споживають доповнення пам’яті.

## Конфігурація

Розмістіть конфігурацію в `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Ключові перемикачі:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` або `obsidian`
- `bridge.readMemoryArtifacts`: імпортувати публічні артефакти Plugin Active Memory
- `bridge.followMemoryEvents`: включати журнали подій у режимі bridge
- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`
- `context.includeCompiledDigestPrompt`: додавати компактний знімок дайджесту до секцій prompt пам’яті
- `render.createBacklinks`: генерувати детерміновані пов’язані блоки
- `render.createDashboards`: генерувати сторінки дашбордів

### Приклад: режим QMD + bridge

Використовуйте це, коли хочете QMD для recall і `memory-wiki` для підтримуваного
шару знань:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Це зберігає:

- QMD відповідальним за recall Active Memory
- `memory-wiki` сфокусованим на скомпільованих сторінках і дашбордах
- форму prompt незмінною, доки ви навмисно не ввімкнете скомпільовані digest prompts

## CLI

`memory-wiki` також надає верхньорівневу CLI-поверхню:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Див. [CLI: wiki](/uk/cli/wiki) для повного довідника команд.

## Підтримка Obsidian

Коли `vault.renderMode` дорівнює `obsidian`, Plugin записує Markdown,
зручний для Obsidian, і може необов’язково використовувати офіційний CLI `obsidian`.

Підтримувані робочі процеси:

- перевірка стану
- пошук у сховищі
- відкриття сторінки
- виклик команди Obsidian
- перехід до щоденної нотатки

Це необов’язково. Вікі й далі працює в native-режимі без Obsidian.

## Рекомендований робочий процес

1. Залиште свій Plugin Active Memory для recall/promotion/Dreaming.
2. Увімкніть `memory-wiki`.
3. Почніть з режиму `isolated`, якщо вам явно не потрібен режим bridge.
4. Використовуйте `wiki_search` / `wiki_get`, коли походження має значення.
5. Використовуйте `wiki_apply` для вузьких синтезів або оновлень метаданих.
6. Запускайте `wiki_lint` після змістовних змін.
7. Увімкніть дашборди, якщо хочете бачити застарілість/суперечності.

## Пов’язані документи

- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: memory](/uk/cli/memory)
- [CLI: wiki](/uk/cli/wiki)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
