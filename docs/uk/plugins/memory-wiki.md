---
read_when:
    - Вам потрібні сталі знання, ширші за звичайні нотатки MEMORY.md
    - Ви налаштовуєте вбудований Plugin memory-wiki
    - Ви хочете зрозуміти wiki_search, wiki_get або режим мосту
summary: 'memory-wiki: скомпільоване сховище знань із походженням, твердженнями, панелями моніторингу та режимом моста'
title: Вікі пам’яті
x-i18n:
    generated_at: "2026-04-29T19:21:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` — це вбудований Plugin, який перетворює довготривалу пам’ять на скомпільоване
сховище знань.

Він **не** замінює Plugin Active Memory. Plugin Active Memory і далі
відповідає за пригадування, просування, індексування та Dreaming. `memory-wiki` працює поруч із ним
і компілює довготривалі знання в навігаційну вікі з детермінованими сторінками,
структурованими твердженнями, походженням, панелями моніторингу та машинозчитуваними дайджестами.

Використовуйте його, коли хочете, щоб пам’ять поводилася радше як підтримуваний шар знань, а
не як купа Markdown-файлів.

## Що він додає

- Окреме вікі-сховище з детермінованим макетом сторінок
- Метадані структурованих тверджень і доказів, а не лише прозу
- Походження, впевненість, суперечності та відкриті питання на рівні сторінки
- Скомпільовані дайджести для споживачів агентів/середовища виконання
- Вікі-нативні інструменти search/get/apply/lint
- Необов’язковий режим bridge, який імпортує публічні артефакти з Plugin Active Memory
- Необов’язковий режим рендерингу, дружній до Obsidian, та інтеграція з CLI

## Як він поєднується з пам’яттю

Уявляйте цей поділ так:

| Шар                                                     | Відповідає за                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho тощо)  | Пригадування, семантичний пошук, просування, Dreaming, середовище виконання пам’яті        |
| `memory-wiki`                                           | Скомпільовані вікі-сторінки, синтези з багатим походженням, панелі, вікі-специфічні search/get/apply |

Якщо Plugin Active Memory відкриває спільні артефакти пригадування, OpenClaw може шукати
в обох шарах за один прохід за допомогою `memory_search corpus=all`.

Коли потрібне вікі-специфічне ранжування, походження або прямий доступ до сторінок, використовуйте
натомість вікі-нативні інструменти.

## Рекомендований гібридний шаблон

Надійний типовий варіант для локальних setup-first конфігурацій:

- QMD як backend Active Memory для пригадування та широкого семантичного пошуку
- `memory-wiki` у режимі `bridge` для довготривалих синтезованих сторінок знань

Такий поділ добре працює, бо кожен шар зберігає чіткий фокус:

- QMD зберігає необроблені нотатки, експорти сесій і додаткові колекції доступними для пошуку
- `memory-wiki` компілює стабільні сутності, твердження, панелі та сторінки джерел

Практичне правило:

- використовуйте `memory_search`, коли потрібен один широкий прохід пригадування по пам’яті
- використовуйте `wiki_search` і `wiki_get`, коли потрібні вікі-результати з урахуванням походження
- використовуйте `memory_search corpus=all`, коли хочете, щоб спільний пошук охоплював обидва шари

Якщо режим bridge повідомляє про нуль експортованих артефактів, Plugin Active Memory
поки що не відкриває публічні вхідні дані bridge. Спершу запустіть `openclaw wiki doctor`,
а потім підтвердьте, що Plugin Active Memory підтримує публічні артефакти.

Коли режим bridge активний і `bridge.readMemoryArtifacts` увімкнено,
`openclaw wiki status`, `openclaw wiki doctor` і `openclaw wiki bridge
import` читають через запущений Gateway. Це узгоджує CLI-перевірки bridge
з контекстом Plugin пам’яті в середовищі виконання. Якщо bridge вимкнено або читання артефактів
вимкнене, ці команди зберігають свою локальну/offline поведінку.

## Режими сховища

`memory-wiki` підтримує три режими сховища:

### `isolated`

Власне сховище, власні джерела, без залежності від `memory-core`.

Використовуйте це, коли хочете, щоб вікі була окремим кураторованим сховищем знань.

### `bridge`

Читає публічні артефакти пам’яті та події пам’яті з Plugin Active Memory
через публічні шви plugin SDK.

Використовуйте це, коли хочете, щоб вікі компілювала й упорядковувала
експортовані артефакти Plugin пам’яті, не звертаючись до приватних внутрішніх частин Plugin.

Режим bridge може індексувати:

- експортовані артефакти пам’яті
- звіти dream
- щоденні нотатки
- кореневі файли пам’яті
- журнали подій пам’яті

### `unsafe-local`

Явний escape hatch для приватних локальних шляхів на тій самій машині.

Цей режим навмисно експериментальний і непортативний. Використовуйте його лише тоді, коли
розумієте межу довіри та конкретно потребуєте доступу до локальної файлової системи, якого
режим bridge надати не може.

## Макет сховища

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

- `sources/` для імпортованих необроблених матеріалів і сторінок, підтриманих bridge
- `entities/` для довготривалих речей, людей, систем, проєктів і об’єктів
- `concepts/` для ідей, абстракцій, шаблонів і політик
- `syntheses/` для скомпільованих підсумків і підтримуваних зведень
- `reports/` для згенерованих панелей

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

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Саме це робить вікі радше шаром переконань, ніж пасивним
dump нотаток. Твердження можна відстежувати, оцінювати, оскаржувати та пов’язувати назад із джерелами.

## Метадані сутностей для агентів

Сторінки сутностей також можуть містити маршрутні метадані для використання агентами. Це generic
frontmatter, тому він працює для людей, команд, систем, проєктів або будь-якого іншого
типу сутності.

Поширені поля:

- `entityType`: наприклад `person`, `team`, `system` або `project`
- `canonicalId`: стабільний ключ ідентичності, що використовується між aliases та імпортами
- `aliases`: імена, handles або labels, які мають резолвитися в ту саму сторінку
- `privacyTier`: `public`, `local-private`, `sensitive` або `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: компактні підказки маршрутизації
- `lastRefreshedAt`: позначка часу оновлення джерела, окрема від часу редагування сторінки
- `personCard`: необов’язкова маршрутна картка, специфічна для людини, з handles, socials,
  emails, timezone, lane, ask-for, avoid-asking-for, confidence і privacy
- `relationships`: типізовані ребра до пов’язаних сторінок із target, kind, weight,
  confidence, evidence kind, privacy tier і note

Для вікі людей агент зазвичай має починати з
`reports/person-agent-directory.md`, потім відкривати сторінку людини через `wiki_get`,
перш ніж використовувати контактні дані або виведені факти.

Приклад:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Конвеєр компіляції

Крок компіляції читає вікі-сторінки, нормалізує підсумки та видає стабільні
машинні артефакти в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ці дайджести існують, щоб агентам і runtime-коду не потрібно було scrape Markdown-сторінки.

Скомпільований вивід також забезпечує:

- первинне вікі-індексування для потоків search/get
- lookup claim-id назад до сторінок-власників
- компактні доповнення до prompt
- генерацію звітів/панелей

## Панелі та звіти про стан

Коли `render.createDashboards` увімкнено, compile підтримує панелі в
`reports/`.

Вбудовані звіти містять:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Ці звіти відстежують такі речі, як:

- кластери нотаток про суперечності
- конкуруючі кластери тверджень
- твердження без структурованих доказів
- сторінки й твердження з низькою впевненістю
- застарілу або невідому актуальність
- сторінки з нерозв’язаними питаннями
- маршрутні картки людей/сутностей
- структуровані ребра взаємозв’язків
- покриття класів доказів
- непублічні privacy tiers, які потребують перевірки перед використанням

## Пошук і отримання

`memory-wiki` підтримує два backend пошуку:

- `shared`: використовувати спільний потік пошуку пам’яті, коли доступно
- `local`: шукати у вікі локально

Він також підтримує три corpora:

- `wiki`
- `memory`
- `all`

Важлива поведінка:

- `wiki_search` і `wiki_get` за можливості використовують скомпільовані дайджести як перший прохід
- claim ids можуть резолвитися назад до сторінки-власника
- contested/stale/fresh claims впливають на ранжування
- labels походження можуть зберігатися в результатах
- режим пошуку може зміщувати ранжування для пошуку людей, маршрутизації питань, source
  evidence або raw claims

Практичне правило:

- використовуйте `memory_search corpus=all` для одного широкого проходу пригадування
- використовуйте `wiki_search` + `wiki_get`, коли вам важливі вікі-специфічне ранжування,
  походження або структура переконань на рівні сторінки

Режими пошуку:

- `auto`: збалансоване типове значення
- `find-person`: підсилює person-like entities, aliases, handles, socials і
  canonical IDs
- `route-question`: підсилює картки агентів, ask-for hints, best-used-for hints і
  контекст взаємозв’язків
- `source-evidence`: підсилює сторінки джерел і метадані структурованих доказів
- `raw-claim`: підсилює відповідні структуровані твердження та повертає claim/evidence
  metadata в результатах

Коли результат відповідає структурованому твердженню, `wiki_search` може повертати
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` і `evidenceSourceIds` у своєму details payload. Текстовий вивід
також містить компактні рядки `Claim:` і `Evidence:`, коли доступно.

## Інструменти для агентів

Plugin реєструє ці інструменти:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Що вони роблять:

- `wiki_status`: поточний режим сховища, стан, доступність Obsidian CLI
- `wiki_search`: шукає вікі-сторінки та, коли налаштовано, спільні corpora пам’яті;
  приймає `mode` для пошуку людей, маршрутизації питань, source evidence або raw
  claim drilldown
- `wiki_get`: читає вікі-сторінку за id/path або повертається до спільного corpus пам’яті
- `wiki_apply`: вузькі мутації синтезу/метаданих без довільної хірургії сторінок
- `wiki_lint`: структурні перевірки, прогалини походження, суперечності, відкриті питання

Plugin також реєструє неексклюзивне доповнення corpus пам’яті, щоб спільні
`memory_search` і `memory_get` могли досягати вікі, коли Plugin Active Memory
підтримує вибір corpus.

## Поведінка prompt і контексту

Коли `context.includeCompiledDigestPrompt` увімкнено, розділи prompt пам’яті
додають компактний скомпільований snapshot з `agent-digest.json`.

Цей snapshot навмисно малий і високосигнальний:

- лише top pages
- лише top claims
- кількість суперечностей
- кількість питань
- qualifiers впевненості/актуальності

Це opt-in, бо змінює форму prompt і переважно корисне для context
engines або legacy prompt assembly, які явно споживають доповнення пам’яті.

## Конфігурація

Розмістіть config у `plugins.entries.memory-wiki.config`:

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
- `bridge.readMemoryArtifacts`: імпортувати публічні артефакти Plugin активної пам’яті
- `bridge.followMemoryEvents`: включати журнали подій у режимі bridge
- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`
- `context.includeCompiledDigestPrompt`: додавати компактний знімок дайджесту до розділів підказки пам’яті
- `render.createBacklinks`: генерувати детерміновані пов’язані блоки
- `render.createDashboards`: генерувати сторінки панелей огляду

### Приклад: QMD + режим bridge

Використовуйте це, коли вам потрібен QMD для пригадування та `memory-wiki` для підтримуваного
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

- QMD відповідальним за пригадування активної пам’яті
- `memory-wiki` зосередженим на скомпільованих сторінках і панелях огляду
- форму підказки незмінною, доки ви навмисно не ввімкнете підказки скомпільованого дайджесту

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

Див. [CLI: wiki](/uk/cli/wiki), щоб отримати повний довідник команд.

## Підтримка Obsidian

Коли `vault.renderMode` дорівнює `obsidian`, Plugin записує дружній до Obsidian
Markdown і може додатково використовувати офіційний CLI `obsidian`.

Підтримувані робочі процеси включають:

- перевірку статусу
- пошук у сховищі
- відкриття сторінки
- виклик команди Obsidian
- перехід до щоденної нотатки

Це необов’язково. Вікі й далі працює в режимі native без Obsidian.

## Рекомендований робочий процес

1. Залиште ваш Plugin активної пам’яті для пригадування/просування/Dreaming.
2. Увімкніть `memory-wiki`.
3. Почніть із режиму `isolated`, якщо вам явно не потрібен режим bridge.
4. Використовуйте `wiki_search` / `wiki_get`, коли важливе походження.
5. Використовуйте `wiki_apply` для вузьких синтезів або оновлень метаданих.
6. Запускайте `wiki_lint` після суттєвих змін.
7. Увімкніть панелі огляду, якщо вам потрібна видимість застарілого або суперечностей.

## Пов’язана документація

- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: memory](/uk/cli/memory)
- [CLI: wiki](/uk/cli/wiki)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
