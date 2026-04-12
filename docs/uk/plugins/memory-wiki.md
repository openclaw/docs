---
read_when:
    - Вам потрібні постійні знання, що виходять за межі простих нотаток у `MEMORY.md`
    - Ви налаштовуєте вбудований Plugin memory-wiki
    - Ви хочете зрозуміти `wiki_search`, `wiki_get` або режим bridge
summary: 'memory-wiki: скомпільоване сховище знань із provenance, claims, dashboards і режимом bridge'
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-12T16:12:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Memory Wiki

`memory-wiki` — це вбудований Plugin, який перетворює довготривалу пам’ять на скомпільоване
сховище знань.

Він **не** замінює Plugin active memory. Plugin active memory і далі
відповідає за recall, promotion, indexing і Dreaming. `memory-wiki` працює поруч
із ним і компілює довготривалі знання в навігаційну wiki з детермінованими сторінками,
структурованими claims, provenance, dashboards і машинозчитуваними digest-ами.

Використовуйте його, якщо хочете, щоб пам’ять працювала більше як підтримуваний
рівень знань, а не як купа файлів Markdown.

## Що він додає

- Виділене сховище wiki з детермінованою структурою сторінок
- Структуровані метадані claims і evidence, а не лише прозовий текст
- Provenance, confidence, contradictions і open questions на рівні сторінки
- Скомпільовані digest-и для агентів/компонентів runtime
- Власні для wiki інструменти search/get/apply/lint
- Необов’язковий режим bridge, який імпортує публічні артефакти з Plugin active memory
- Необов’язковий режим рендерингу, дружній до Obsidian, та інтеграція з CLI

## Як це поєднується з пам’яттю

Уявіть цей поділ так:

| Рівень                                                  | Відповідає за                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Plugin active memory (`memory-core`, QMD, Honcho тощо)  | Recall, semantic search, promotion, Dreaming, runtime пам’яті                             |
| `memory-wiki`                                           | Скомпільовані wiki-сторінки, синтези з багатим provenance, dashboards, wiki-специфічні search/get/apply |

Якщо Plugin active memory надає спільні артефакти recall, OpenClaw може шукати
в обох рівнях за один прохід через `memory_search corpus=all`.

Коли вам потрібні wiki-специфічне ранжування, provenance або прямий доступ до сторінки,
замість цього використовуйте власні інструменти wiki.

## Рекомендований гібридний шаблон

Надійний варіант за замовчуванням для локальних конфігурацій — це:

- QMD як backend active memory для recall і широкого semantic search
- `memory-wiki` у режимі `bridge` для довготривалих синтезованих сторінок знань

Такий поділ добре працює, тому що кожен рівень зберігає свою спеціалізацію:

- QMD зберігає можливість пошуку по сирих нотатках, експортам сеансів і додаткових колекціях
- `memory-wiki` компілює стабільні сутності, claims, dashboards і сторінки джерел

Практичне правило:

- використовуйте `memory_search`, коли хочете один широкий прохід recall по пам’яті
- використовуйте `wiki_search` і `wiki_get`, коли вам потрібні wiki-результати з урахуванням provenance
- використовуйте `memory_search corpus=all`, коли хочете, щоб спільний пошук охоплював обидва рівні

Якщо режим bridge повідомляє про нуль експортованих артефактів, Plugin active memory
зараз іще не надає публічні bridge-входи. Спочатку виконайте `openclaw wiki doctor`,
потім підтвердьте, що Plugin active memory підтримує публічні артефакти.

## Режими сховища

`memory-wiki` підтримує три режими сховища:

### `isolated`

Власне сховище, власні джерела, без залежності від `memory-core`.

Використовуйте це, якщо хочете, щоб wiki була окремим куруваним сховищем знань.

### `bridge`

Читає публічні артефакти пам’яті та memory events із Plugin active memory
через публічні шви Plugin SDK.

Використовуйте це, якщо хочете, щоб wiki компілювала й упорядковувала
експортовані артефакти Plugin memory без звернення до приватних внутрішніх
компонентів Plugin.

Режим bridge може індексувати:

- експортовані артефакти пам’яті
- dream reports
- daily notes
- кореневі файли пам’яті
- журнали memory events

### `unsafe-local`

Явний аварійний варіант для доступу до локальних приватних шляхів на тій самій машині.

Цей режим навмисно є експериментальним і непереносним. Використовуйте його лише тоді,
коли розумієте межу довіри та справді потребуєте доступу до локальної файлової системи,
який режим bridge не може надати.

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

Керований вміст зберігається всередині згенерованих блоків. Блоки нотаток,
створені людиною, зберігаються.

Основні групи сторінок:

- `sources/` для імпортованих сирих матеріалів і сторінок, що підтримуються bridge
- `entities/` для довготривалих речей, людей, систем, проєктів і об’єктів
- `concepts/` для ідей, абстракцій, шаблонів і політик
- `syntheses/` для скомпільованих зведень і підтримуваних зведених матеріалів
- `reports/` для згенерованих dashboards

## Структуровані claims і evidence

Сторінки можуть містити структурований frontmatter `claims`, а не лише довільний текст.

Кожен claim може містити:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Записи evidence можуть містити:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Саме це змушує wiki діяти радше як рівень переконань, а не як пасивне
сховище нотаток. Claims можна відстежувати, оцінювати, оскаржувати й пов’язувати
назад із джерелами.

## Конвеєр компіляції

Крок compile читає wiki-сторінки, нормалізує зведення та створює стабільні
машинно-орієнтовані артефакти в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ці digest-и існують для того, щоб агентам і коду runtime не доводилося
парсити сторінки Markdown.

Скомпільований вивід також забезпечує:

- первинне wiki-індексування для потоків search/get
- пошук claim-id назад до сторінок-власників
- компактні доповнення до prompt
- генерацію reports/dashboard

## Dashboards і звіти про стан

Коли ввімкнено `render.createDashboards`, compile підтримує dashboards у `reports/`.

Вбудовані звіти включають:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Ці звіти відстежують такі речі, як:

- кластери нотаток про contradictions
- кластери конкуруючих claims
- claims без структурованого evidence
- сторінки й claims із низьким confidence
- застарілість або невідому актуальність
- сторінки з невирішеними питаннями

## Пошук і отримання

`memory-wiki` підтримує два backend-и пошуку:

- `shared`: використовувати спільний потік пошуку в пам’яті, якщо він доступний
- `local`: шукати в wiki локально

Він також підтримує три corpus:

- `wiki`
- `memory`
- `all`

Важлива поведінка:

- `wiki_search` і `wiki_get` використовують скомпільовані digest-и як перший прохід, коли це можливо
- id claims можуть повертати перехід назад до сторінки-власника
- contested/stale/fresh claims впливають на ранжування
- мітки provenance можуть зберігатися в результатах

Практичне правило:

- використовуйте `memory_search corpus=all` для одного широкого проходу recall
- використовуйте `wiki_search` + `wiki_get`, коли вам важливі wiki-специфічне ранжування,
  provenance або структура переконань на рівні сторінки

## Інструменти агента

Plugin реєструє такі інструменти:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Що вони роблять:

- `wiki_status`: поточний режим сховища, стан, доступність Obsidian CLI
- `wiki_search`: пошук по wiki-сторінках і, за налаштуванням, по спільних corpus пам’яті
- `wiki_get`: читання wiki-сторінки за id/шляхом або повернення до спільного corpus пам’яті
- `wiki_apply`: вузькі мутації syntheses/metadata без довільного редагування сторінки
- `wiki_lint`: структурні перевірки, прогалини provenance, contradictions, open questions

Plugin також реєструє невиключне доповнення corpus пам’яті, тому спільні
`memory_search` і `memory_get` можуть звертатися до wiki, коли Plugin active memory
підтримує вибір corpus.

## Поведінка prompt і контексту

Коли ввімкнено `context.includeCompiledDigestPrompt`, розділи prompt пам’яті
додають компактний скомпільований знімок із `agent-digest.json`.

Цей знімок навмисно малий і високосигнальний:

- лише верхні сторінки
- лише верхні claims
- кількість contradictions
- кількість питань
- qualifiers confidence/freshness

Це опція за вибором, бо вона змінює форму prompt і головним чином корисна для
рушіїв контексту або застарілих механізмів збирання prompt, які явно споживають
доповнення пам’яті.

## Конфігурація

Розміщуйте конфігурацію в `plugins.entries.memory-wiki.config`:

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

Основні перемикачі:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` або `obsidian`
- `bridge.readMemoryArtifacts`: імпортувати публічні артефакти Plugin active memory
- `bridge.followMemoryEvents`: включати журнали подій у режимі bridge
- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`
- `context.includeCompiledDigestPrompt`: додавати компактний знімок digest до розділів prompt пам’яті
- `render.createBacklinks`: генерувати детерміновані related-блоки
- `render.createDashboards`: генерувати dashboard-сторінки

### Приклад: QMD + режим bridge

Використовуйте це, коли хочете QMD для recall, а `memory-wiki` — для підтримуваного
рівня знань:

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

- QMD відповідає за recall в active memory
- `memory-wiki` зосереджений на скомпільованих сторінках і dashboards
- форму prompt незмінною, доки ви свідомо не ввімкнете prompts скомпільованого digest

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

Повний довідник команд див. у [CLI: wiki](/cli/wiki).

## Підтримка Obsidian

Коли `vault.renderMode` має значення `obsidian`, Plugin записує Markdown,
дружній до Obsidian, і за потреби може використовувати офіційний CLI `obsidian`.

Підтримувані робочі процеси включають:

- перевірку стану
- пошук по сховищу
- відкриття сторінки
- виклик команди Obsidian
- перехід до daily note

Це необов’язково. Wiki і далі працює в режимі native без Obsidian.

## Рекомендований робочий процес

1. Залиште свій Plugin active memory для recall/promotion/Dreaming.
2. Увімкніть `memory-wiki`.
3. Почніть із режиму `isolated`, якщо тільки вам явно не потрібен режим bridge.
4. Використовуйте `wiki_search` / `wiki_get`, коли provenance має значення.
5. Використовуйте `wiki_apply` для вузьких оновлень syntheses або metadata.
6. Запускайте `wiki_lint` після суттєвих змін.
7. Увімкніть dashboards, якщо хочете бачити застарілість/contradictions.

## Пов’язані документи

- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
