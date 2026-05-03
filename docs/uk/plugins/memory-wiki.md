---
read_when:
    - Вам потрібні сталі знання за межами звичайних нотаток MEMORY.md
    - Ви налаштовуєте вбудований Plugin memory-wiki
    - Ви хочете зрозуміти wiki_search, wiki_get або режим мосту
summary: 'memory-wiki: скомпільоване сховище знань із походженням, твердженнями, панелями моніторингу та режимом мосту'
title: Вікі пам’яті
x-i18n:
    generated_at: "2026-05-03T22:56:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` — це вбудований Plugin, який перетворює довготривалу пам’ять на скомпільоване
сховище знань.

Він **не** замінює Plugin active memory. Plugin active memory і далі
відповідає за recall, promotion, indexing і dreaming. `memory-wiki` працює поруч із ним
і компілює довготривалі знання в навіговну вікі з детермінованими сторінками,
структурованими твердженнями, provenance, dashboards і machine-readable digests.

Використовуйте його, коли хочете, щоб пам’ять поводилася радше як підтримуваний шар знань,
а не як купа Markdown-файлів.

## Що він додає

- Окреме вікі-сховище з детермінованим макетом сторінок
- Метадані структурованих тверджень і доказів, а не лише прозу
- Provenance, confidence, contradictions і open questions на рівні сторінки
- Скомпільовані digests для agent/runtime-споживачів
- Вікі-нативні інструменти search/get/apply/lint
- Необов’язковий bridge mode, який імпортує публічні artifacts з Plugin active memory
- Необов’язковий Obsidian-friendly режим рендерингу та інтеграція з CLI

## Як це поєднується з пам’яттю

Уявляйте цей поділ так:

| Шар                                                    | Відповідає за                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin active memory (`memory-core`, QMD, Honcho тощо) | Recall, semantic search, promotion, dreaming, memory runtime                               |
| `memory-wiki`                                           | Скомпільовані вікі-сторінки, provenance-rich syntheses, dashboards, wiki-specific search/get/apply |

Якщо Plugin active memory надає спільні recall artifacts, OpenClaw може шукати
в обох шарах за один прохід через `memory_search corpus=all`.

Коли потрібні вікі-специфічне ранжування, provenance або прямий доступ до сторінок, використовуйте
натомість вікі-нативні інструменти.

## Рекомендований гібридний шаблон

Сильний типовий варіант для local-first налаштувань:

- QMD як backend active memory для recall і широкого semantic search
- `memory-wiki` у режимі `bridge` для довготривалих синтезованих сторінок знань

Такий поділ добре працює, бо кожен шар лишається сфокусованим:

- QMD зберігає raw notes, session exports і додаткові collections доступними для пошуку
- `memory-wiki` компілює stable entities, claims, dashboards і source pages

Практичне правило:

- використовуйте `memory_search`, коли потрібен один широкий recall-прохід пам’яттю
- використовуйте `wiki_search` і `wiki_get`, коли потрібні provenance-aware вікі-результати
- використовуйте `memory_search corpus=all`, коли хочете, щоб спільний пошук охоплював обидва шари

Якщо bridge mode повідомляє про нуль експортованих artifacts, Plugin active memory наразі
ще не надає публічні bridge inputs. Спершу запустіть `openclaw wiki doctor`,
а потім підтвердьте, що Plugin active memory підтримує публічні artifacts.

Коли bridge mode активний і `bridge.readMemoryArtifacts` увімкнено,
`openclaw wiki status`, `openclaw wiki doctor` і `openclaw wiki bridge
import` читають через запущений Gateway. Це тримає CLI bridge checks узгодженими
з runtime-контекстом Plugin memory. Якщо bridge вимкнено або читання artifacts
вимкнене, ці команди зберігають свою локальну/offline поведінку.

## Режими сховища

`memory-wiki` підтримує три режими сховища:

### `isolated`

Власне сховище, власні джерела, без залежності від `memory-core`.

Використовуйте це, коли хочете, щоб вікі була власним куруваним сховищем знань.

### `bridge`

Читає публічні memory artifacts і memory events з Plugin active memory
через публічні plugin SDK seams.

Використовуйте це, коли хочете, щоб вікі компілювала й упорядковувала
експортовані artifacts Plugin memory без доступу до приватних внутрішніх частин Plugin.

Bridge mode може індексувати:

- експортовані memory artifacts
- dream reports
- daily notes
- memory root files
- memory event logs

### `unsafe-local`

Явний escape hatch для локальних приватних шляхів на тій самій машині.

Цей режим навмисно експериментальний і непортативний. Використовуйте його лише тоді, коли
розумієте trust boundary і конкретно потребуєте доступу до локальної файлової системи, якого
bridge mode не може надати.

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

Керований вміст лишається всередині generated blocks. Human note blocks зберігаються.

Основні групи сторінок:

- `sources/` для імпортованого raw material і bridge-backed pages
- `entities/` для довготривалих речей, людей, систем, проєктів і об’єктів
- `concepts/` для ідей, абстракцій, шаблонів і політик
- `syntheses/` для скомпільованих підсумків і підтримуваних rollups
- `reports/` для згенерованих dashboards

## Структуровані твердження й докази

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

Саме це змушує вікі поводитися радше як belief layer, ніж як пасивний
dump нотаток. Claims можна відстежувати, оцінювати, оскаржувати та розв’язувати назад до джерел.

## Метадані сутностей для агентів

Сторінки сутностей також можуть містити routing metadata для використання агентами. Це generic
frontmatter, тому він працює для людей, команд, систем, проєктів або будь-якого іншого
типу сутності.

Поширені поля:

- `entityType`: наприклад `person`, `team`, `system` або `project`
- `canonicalId`: стабільний identity key, що використовується між aliases та imports
- `aliases`: імена, handles або labels, які мають розв’язуватися в ту саму сторінку
- `privacyTier`: `public`, `local-private`, `sensitive` або `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: стислі routing hints
- `lastRefreshedAt`: timestamp оновлення джерела, окремий від часу редагування сторінки
- `personCard`: необов’язкова routing card для людей із handles, socials,
  emails, timezone, lane, ask-for, avoid-asking-for, confidence і privacy
- `relationships`: typed edges до пов’язаних сторінок із target, kind, weight,
  confidence, evidence kind, privacy tier і note

Для people wiki агент зазвичай має починати з
`reports/person-agent-directory.md`, потім відкривати сторінку людини через `wiki_get`
перед використанням контактних даних або виведених фактів.

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

## Compile pipeline

Compile-крок читає вікі-сторінки, нормалізує summaries і створює стабільні
machine-facing artifacts у:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ці digests існують, щоб agents і runtime code не мусили scrape Markdown
сторінки.

Скомпільований output також живить:

- first-pass wiki indexing для search/get flows
- claim-id lookup назад до owning pages
- compact prompt supplements
- генерування reports/dashboards

## Dashboards і звіти про стан

Коли `render.createDashboards` увімкнено, compile підтримує dashboards у
`reports/`.

Вбудовані reports містять:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Ці reports відстежують такі речі, як:

- contradiction note clusters
- competing claim clusters
- claims без структурованих доказів
- сторінки й claims із низькою confidence
- stale або unknown freshness
- сторінки з unresolved questions
- person/entity routing cards
- structured relationship edges
- evidence class coverage
- non-public privacy tiers, які потребують review перед використанням

## Пошук і отримання

`memory-wiki` підтримує два search backends:

- `shared`: використовувати shared memory search flow, коли доступно
- `local`: шукати вікі локально

Він також підтримує три corpora:

- `wiki`
- `memory`
- `all`

Важлива поведінка:

- `wiki_search` і `wiki_get` використовують compiled digests як перший прохід, коли можливо
- claim ids можуть розв’язуватися назад до owning page
- contested/stale/fresh claims впливають на ranking
- provenance labels можуть зберігатися в results
- search mode може зміщувати ranking для person lookup, question routing, source
  evidence або raw claims

Практичне правило:

- використовуйте `memory_search corpus=all` для одного широкого recall-проходу
- використовуйте `wiki_search` + `wiki_get`, коли важливі wiki-specific ranking,
  provenance або page-level belief structure

Search modes:

- `auto`: збалансований типовий режим
- `find-person`: підсилює person-like entities, aliases, handles, socials і
  canonical IDs
- `route-question`: підсилює agent cards, ask-for hints, best-used-for hints і
  relationship context
- `source-evidence`: підсилює source pages і structured evidence metadata
- `raw-claim`: підсилює matching structured claims і повертає claim/evidence
  metadata в results

Коли result відповідає structured claim, `wiki_search` може повернути
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` і `evidenceSourceIds` у своєму details payload. Text output
також містить компактні рядки `Claim:` і `Evidence:`, коли вони доступні.

## Інструменти агента

Plugin реєструє ці інструменти:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Що вони роблять:

- `wiki_status`: поточний vault mode, health, доступність Obsidian CLI
- `wiki_search`: шукає wiki pages і, коли налаштовано, shared memory corpora;
  приймає `mode` для person lookup, question routing, source evidence або raw
  claim drilldown
- `wiki_get`: читає wiki page за id/path або fallback до shared memory corpus
- `wiki_apply`: вузькі synthesis/metadata mutations без freeform page surgery
- `wiki_lint`: structural checks, provenance gaps, contradictions, open questions

Plugin також реєструє non-exclusive memory corpus supplement, тому shared
`memory_search` і `memory_get` можуть діставатися до вікі, коли Plugin active memory
підтримує corpus selection.

## Поведінка prompt і context

Коли `context.includeCompiledDigestPrompt` увімкнено, memory prompt sections
додають compact compiled snapshot з `agent-digest.json`.

Цей snapshot навмисно малий і high-signal:

- лише top pages
- лише top claims
- contradiction count
- question count
- confidence/freshness qualifiers

Це opt-in, бо змінює prompt shape і переважно корисне для context
engines або legacy prompt assembly, які явно споживають memory supplements.

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
- `bridge.readMemoryArtifacts`: імпортувати публічні артефакти plugin Active Memory
- `bridge.followMemoryEvents`: включати журнали подій у режимі bridge
- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`
- `context.includeCompiledDigestPrompt`: додавати компактний знімок дайджесту до розділів memory prompt
- `render.createBacklinks`: генерувати детерміновані пов’язані блоки
- `render.createDashboards`: генерувати сторінки панелей керування

### Приклад: QMD + режим bridge

Використовуйте це, коли вам потрібен QMD для пригадування і `memory-wiki` для підтримуваного
шару знань:

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

- QMD керує пригадуванням Active Memory
- `memory-wiki` зосереджений на скомпільованих сторінках і панелях керування
- форма prompt лишається незмінною, доки ви навмисно не ввімкнете prompt скомпільованого дайджесту

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

Див. [CLI: wiki](/uk/cli/wiki) для повного довідника команд.

## Підтримка Obsidian

Коли `vault.renderMode` має значення `obsidian`, plugin записує зручний для Obsidian
Markdown і може додатково використовувати офіційний CLI `obsidian`.

Підтримувані робочі процеси включають:

- перевірку статусу
- пошук у сховищі
- відкриття сторінки
- виклик команди Obsidian
- перехід до щоденної нотатки

Це необов’язково. Wiki і надалі працює в native-режимі без Obsidian.

## Рекомендований робочий процес

1. Залиште свій plugin Active Memory для пригадування/просування/Dreaming.
2. Увімкніть `memory-wiki`.
3. Почніть із режиму `isolated`, якщо вам явно не потрібен режим bridge.
4. Використовуйте `wiki_search` / `wiki_get`, коли важливе походження.
5. Використовуйте `wiki_apply` для вузьких синтезів або оновлень метаданих.
6. Запускайте `wiki_lint` після суттєвих змін.
7. Увімкніть панелі керування, якщо хочете бачити застарілість/суперечності.

## Пов’язані документи

- [Огляд Memory](/uk/concepts/memory)
- [CLI: memory](/uk/cli/memory)
- [CLI: wiki](/uk/cli/wiki)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
