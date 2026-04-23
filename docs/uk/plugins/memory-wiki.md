---
read_when:
    - Вам потрібні стійкі знання понад прості нотатки в MEMORY.md
    - Ви налаштовуєте вбудований plugin memory-wiki
    - Ви хочете зрозуміти wiki_search, wiki_get або bridge-режим
summary: 'memory-wiki: скомпільоване сховище знань із provenance, claims, dashboards і bridge-режимом'
title: Вікі пам’яті
x-i18n:
    generated_at: "2026-04-23T21:02:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` — це вбудований plugin, який перетворює стійку пам’ять на скомпільоване
сховище знань.

Він **не** замінює активний plugin пам’яті. Активний plugin пам’яті й далі
відповідає за recall, promotion, indexing і Dreaming. `memory-wiki` працює поруч із ним
і компілює стійкі знання в навігаційну wiki з детермінованими сторінками,
структурованими claims, provenance, dashboards і машинозчитуваними digests.

Використовуйте його, коли хочете, щоб пам’ять поводилася більше як підтримуваний шар знань, а
не як просто купа файлів Markdown.

## Що він додає

- Окреме wiki-сховище з детермінованою структурою сторінок
- Структуровані метадані claims і evidence, а не лише прозовий текст
- Provenance, confidence, contradictions і open questions на рівні сторінки
- Скомпільовані digests для споживачів agent/runtime
- Нативні для wiki інструменти search/get/apply/lint
- Необов’язковий bridge-режим, що імпортує публічні артефакти з активного plugin пам’яті
- Необов’язковий render-режим, дружній до Obsidian, та інтеграцію з CLI

## Як це поєднується з пам’яттю

Думайте про цей поділ так:

| Шар                                                     | Відповідає за                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Активний plugin пам’яті (`memory-core`, QMD, Honcho тощо) | Recall, semantic search, promotion, Dreaming, runtime пам’яті                             |
| `memory-wiki`                                           | Скомпільовані wiki-сторінки, syntheses з багатим provenance, dashboards, wiki-специфічні search/get/apply |

Якщо активний plugin пам’яті надає спільні артефакти recall, OpenClaw може шукати
в обох шарах за один прохід через `memory_search corpus=all`.

Коли вам потрібне ранжування, provenance або прямий доступ до сторінки, специфічні для wiki, використовуйте
нативні інструменти wiki.

## Рекомендований гібридний шаблон

Сильне типове налаштування для локально-орієнтованих середовищ:

- QMD як активний backend пам’яті для recall і широкого semantic search
- `memory-wiki` у режимі `bridge` для стійких синтезованих сторінок знань

Цей поділ добре працює, тому що кожен шар зберігає свою спеціалізацію:

- QMD зберігає доступними для пошуку сирі нотатки, експорт сесій і додаткові колекції
- `memory-wiki` компілює стабільні сутності, claims, dashboards і вихідні сторінки

Практичне правило:

- використовуйте `memory_search`, коли потрібен один широкий прохід recall по пам’яті
- використовуйте `wiki_search` і `wiki_get`, коли потрібні результати wiki з урахуванням provenance
- використовуйте `memory_search corpus=all`, коли хочете, щоб спільний пошук охоплював обидва шари

Якщо bridge-режим повідомляє про нуль експортованих артефактів, це означає, що активний plugin пам’яті
наразі ще не надає публічні bridge-входи. Спочатку запустіть `openclaw wiki doctor`,
а потім переконайтеся, що активний plugin пам’яті підтримує публічні артефакти.

## Режими сховища

`memory-wiki` підтримує три режими сховища:

### `isolated`

Власне сховище, власні джерела, без залежності від `memory-core`.

Використовуйте це, коли хочете, щоб wiki була власним куруваним сховищем знань.

### `bridge`

Читає публічні артефакти пам’яті та події пам’яті з активного plugin пам’яті
через публічні межі plugin SDK.

Використовуйте це, коли хочете, щоб wiki компілювала й упорядковувала
експортовані артефакти plugin пам’яті без доступу до приватних внутрішніх частин plugin.

Bridge-режим може індексувати:

- експортовані артефакти пам’яті
- звіти Dreaming
- щоденні нотатки
- кореневі файли пам’яті
- журнали подій пам’яті

### `unsafe-local`

Явний аварійний режим для локальних приватних шляхів на тій самій машині.

Цей режим навмисно експериментальний і непереносний. Використовуйте його лише тоді, коли
розумієте межу довіри й справді потребуєте доступу до локальної файлової системи, який
bridge-режим не може надати.

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

Керований вміст залишається всередині згенерованих блоків. Блоки людських нотаток зберігаються.

Основні групи сторінок:

- `sources/` для імпортованих сирих матеріалів і сторінок, підтримуваних bridge
- `entities/` для стійких речей, людей, систем, проєктів і об’єктів
- `concepts/` для ідей, абстракцій, шаблонів і політик
- `syntheses/` для скомпільованих підсумків і підтримуваних rollup
- `reports/` для згенерованих dashboards

## Структуровані claims і evidence

Сторінки можуть містити структурований frontmatter `claims`, а не лише довільний текст.

Кожен claim може включати:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Записи evidence можуть включати:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Саме це робить wiki радше шаром переконань, ніж пасивним
дампом нотаток. Claims можна відстежувати, оцінювати, оскаржувати й пов’язувати назад із джерелами.

## Конвеєр compile

Крок compile читає wiki-сторінки, нормалізує summaries і створює стабільні
артефакти для машинного використання в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ці digests існують для того, щоб агенти й runtime-код не мусили парсити Markdown-сторінки.

Скомпільований вивід також забезпечує:

- первинне індексування wiki для потоків search/get
- пошук claim-id назад до сторінок-власників
- компактні доповнення prompt
- генерацію звітів/dashboard

## Dashboards і звіти про стан

Коли ввімкнено `render.createDashboards`, compile підтримує dashboards у
`reports/`.

Вбудовані звіти включають:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Ці звіти відстежують такі речі, як:

- кластери нотаток про суперечності
- кластери конкуруючих claims
- claims без структурованого evidence
- сторінки та claims із низькою confidence
- застарілість або невідому актуальність
- сторінки з нерозв’язаними питаннями

## Пошук і отримання

`memory-wiki` підтримує два backend пошуку:

- `shared`: використовувати спільний потік пошуку пам’яті, коли він доступний
- `local`: шукати локально в wiki

Він також підтримує три corpus:

- `wiki`
- `memory`
- `all`

Важлива поведінка:

- `wiki_search` і `wiki_get` використовують скомпільовані digests як перший прохід, коли це можливо
- claim ids можуть розв’язуватися назад до сторінки-власника
- contested/stale/fresh claims впливають на ранжування
- мітки provenance можуть зберігатися в результатах

Практичне правило:

- використовуйте `memory_search corpus=all` для одного широкого проходу recall
- використовуйте `wiki_search` + `wiki_get`, коли вам важливі специфічні для wiki ранжування,
  provenance або структура переконань на рівні сторінки

## Інструменти агента

Plugin реєструє такі інструменти:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Що вони роблять:

- `wiki_status`: поточний режим сховища, стан, доступність CLI Obsidian
- `wiki_search`: пошук по сторінках wiki і, за відповідної конфігурації, по спільних corpus пам’яті
- `wiki_get`: читання сторінки wiki за id/path або резервний перехід до shared memory corpus
- `wiki_apply`: вузькі зміни synthesis/metadata без довільного редагування сторінок
- `wiki_lint`: структурні перевірки, прогалини provenance, суперечності, відкриті питання

Plugin також реєструє невиключне доповнення memory corpus, тож спільні
`memory_search` і `memory_get` можуть досягати wiki, коли активний plugin
пам’яті підтримує вибір corpus.

## Поведінка prompt і контексту

Коли ввімкнено `context.includeCompiledDigestPrompt`, розділи prompt пам’яті
додають компактний скомпільований знімок із `agent-digest.json`.

Цей знімок навмисно маленький і високосигнальний:

- лише верхні сторінки
- лише верхні claims
- кількість суперечностей
- кількість питань
- кваліфікатори confidence/freshness

Це opt-in, оскільки змінює форму prompt і здебільшого корисне для рушіїв контексту
або застарілих механізмів складання prompt, які явно споживають доповнення пам’яті.

## Конфігурація

Розміщуйте config в `plugins.entries.memory-wiki.config`:

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
- `bridge.readMemoryArtifacts`: імпортувати публічні артефакти активного plugin пам’яті
- `bridge.followMemoryEvents`: включати журнали подій у bridge-режимі
- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`
- `context.includeCompiledDigestPrompt`: додавати компактний знімок digest до розділів prompt пам’яті
- `render.createBacklinks`: генерувати детерміновані пов’язані блоки
- `render.createDashboards`: генерувати сторінки dashboard

### Приклад: QMD + bridge mode

Використовуйте це, коли хочете мати QMD для recall, а `memory-wiki` — для підтримуваного
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

- QMD як відповідальний за recall в активній пам’яті
- `memory-wiki` зосередженим на скомпільованих сторінках і dashboards
- незмінну форму prompt, доки ви свідомо не ввімкнете prompts із compiled digest

## CLI

`memory-wiki` також надає поверхню CLI верхнього рівня:

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

Повний довідник команд див. у [CLI: wiki](/uk/cli/wiki).

## Підтримка Obsidian

Коли `vault.renderMode` має значення `obsidian`, plugin записує Markdown, дружній до Obsidian,
і може за бажанням використовувати офіційний CLI `obsidian`.

Підтримувані робочі процеси включають:

- перевірку статусу
- пошук у сховищі
- відкриття сторінки
- виклик команди Obsidian
- перехід до щоденної нотатки

Це необов’язково. Wiki і далі працює в native-режимі без Obsidian.

## Рекомендований робочий процес

1. Залиште активний plugin пам’яті для recall/promotion/Dreaming.
2. Увімкніть `memory-wiki`.
3. Починайте з режиму `isolated`, якщо вам не потрібен саме bridge-режим.
4. Використовуйте `wiki_search` / `wiki_get`, коли важливий provenance.
5. Використовуйте `wiki_apply` для вузьких synthesis або оновлень metadata.
6. Запускайте `wiki_lint` після суттєвих змін.
7. Увімкніть dashboards, якщо хочете бачити застарілість/суперечності.

## Пов’язана документація

- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: memory](/uk/cli/memory)
- [CLI: wiki](/uk/cli/wiki)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
