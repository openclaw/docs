---
read_when:
    - Вам потрібні сталі знання поза межами звичайних нотаток MEMORY.md
    - Ви налаштовуєте вбудований Plugin memory-wiki
    - Ви хочете зрозуміти wiki_search, wiki_get або режим bridge
summary: 'memory-wiki: скомпільоване сховище знань із походженням, твердженнями, панелями моніторингу та режимом моста'
title: Вікі пам’яті
x-i18n:
    generated_at: "2026-06-27T17:54:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` — це вбудований плагін, який перетворює довготривалу пам’ять на скомпільоване
сховище знань.

Він **не** замінює плагін активної пам’яті. Плагін активної пам’яті й надалі
відповідає за пригадування, просування, індексацію та dreaming. `memory-wiki` працює поруч із ним
і компілює довготривалі знання в навіговну wiki з детермінованими сторінками,
структурованими твердженнями, походженням, панелями та машинозчитуваними дайджестами.

Використовуйте його, коли хочете, щоб пам’ять поводилася радше як підтримуваний шар знань, а
не як купа Markdown-файлів.

## Що він додає

- Окреме wiki-сховище з детермінованою розкладкою сторінок
- Структуровані метадані тверджень і доказів, а не лише прозу
- Походження, впевненість, суперечності та відкриті питання на рівні сторінки
- Скомпільовані дайджести для споживачів агентів/середовища виконання
- Wiki-нативні інструменти пошуку/отримання/застосування/lint
- Імпорти Open Knowledge Format у скомпільовані wiki-концепти
- Опційний режим мосту, який імпортує публічні артефакти з плагіна активної пам’яті
- Опційний режим рендерингу, дружній до Obsidian, та інтеграція CLI

## Як він поєднується з пам’яттю

Уявляйте поділ так:

| Шар                                                    | Відповідає за                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Плагін активної пам’яті (`memory-core`, QMD, Honcho тощо) | Пригадування, семантичний пошук, просування, dreaming, середовище виконання пам’яті         |
| `memory-wiki`                                           | Скомпільовані wiki-сторінки, синтези з багатим походженням, панелі, wiki-специфічні search/get/apply |

Якщо плагін активної пам’яті надає спільні артефакти пригадування, OpenClaw може шукати
в обох шарах за один прохід через `memory_search corpus=all`.

Коли потрібне wiki-специфічне ранжування, походження або прямий доступ до сторінок, використовуйте
натомість wiki-нативні інструменти.

## Рекомендований гібридний шаблон

Сильний типовий варіант для локальних-first налаштувань:

- QMD як бекенд активної пам’яті для пригадування та широкого семантичного пошуку
- `memory-wiki` у режимі `bridge` для довготривалих синтезованих сторінок знань

Такий поділ добре працює, бо кожен шар лишається сфокусованим:

- QMD зберігає raw-нотатки, експорти сесій і додаткові колекції доступними для пошуку
- `memory-wiki` компілює стабільні сутності, твердження, панелі та сторінки джерел

Практичне правило:

- використовуйте `memory_search`, коли потрібен один широкий прохід пригадування по пам’яті
- використовуйте `wiki_search` і `wiki_get`, коли потрібні wiki-результати з урахуванням походження
- використовуйте `memory_search corpus=all`, коли хочете, щоб спільний пошук охоплював обидва шари

Якщо режим мосту повідомляє про нуль експортованих артефактів, плагін активної пам’яті
ще не надає публічні вхідні дані мосту. Спочатку запустіть `openclaw wiki doctor`,
потім підтвердьте, що плагін активної пам’яті підтримує публічні артефакти.

Коли режим мосту активний і `bridge.readMemoryArtifacts` увімкнено,
`openclaw wiki status`, `openclaw wiki doctor` і `openclaw wiki bridge
import` читають через запущений Gateway. Це узгоджує перевірки мосту в CLI
з контекстом плагіна пам’яті в середовищі виконання. Якщо міст вимкнено або читання артефактів
вимкнене, ці команди зберігають локальну/offline поведінку.

## Режими сховища

`memory-wiki` підтримує три режими сховища:

### `isolated`

Власне сховище, власні джерела, без залежності від `memory-core`.

Використовуйте це, коли хочете, щоб wiki була власним кураторованим сховищем знань.

### `bridge`

Читає публічні артефакти пам’яті та події пам’яті з плагіна активної пам’яті
через публічні межі plugin SDK.

Використовуйте це, коли хочете, щоб wiki компілювала й організовувала
експортовані артефакти плагіна пам’яті, не звертаючись до приватних внутрішніх частин плагіна.

Режим мосту може індексувати:

- експортовані артефакти пам’яті
- звіти сновидінь
- щоденні нотатки
- кореневі файли пам’яті
- журнали подій пам’яті

### `unsafe-local`

Явний аварійний вихід для приватних локальних шляхів на тій самій машині.

Цей режим навмисно експериментальний і непереносний. Використовуйте його лише тоді, коли
розумієте межу довіри та конкретно потребуєте локального доступу до файлової системи, якого
не може надати режим мосту.

## Структура сховища

Плагін ініціалізує сховище так:

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

Керований вміст лишається всередині згенерованих блоків. Блоки людських нотаток зберігаються.

Основні групи сторінок:

- `sources/` для імпортованого raw-матеріалу та сторінок, підкріплених мостом
- `entities/` для довготривалих речей, людей, систем, проєктів і об’єктів
- `concepts/` для ідей, абстракцій, шаблонів і політик
- `syntheses/` для скомпільованих підсумків і підтримуваних зведень
- `reports/` для згенерованих панелей

## Імпорти Open Knowledge Format

`memory-wiki` може імпортувати розпаковані набори Open Knowledge Format через:

```bash
openclaw wiki okf import ./bundles/ga4
```

Це найчистіше підходить, коли каталог даних, crawler документації або
агент збагачення вже створює OKF: зберігайте OKF як переносний артефакт обміну,
а потім дозвольте `memory-wiki` перетворити його на нативні для OpenClaw сторінки концептів і
скомпільовані дайджести.

Імпортер дотримується форми OKF v0.1:

- незарезервовані файли `.md` є документами концептів
- кожному імпортованому концепту потрібне непорожнє поле frontmatter `type`
- невідомі значення OKF `type` приймаються
- зарезервовані файли `index.md` і `log.md` не імпортуються як концепти
- зламані або зовнішні markdown-посилання зберігаються

Імпортовані сторінки концептів сплощуються під `concepts/`, щоб наявні шляхи compile,
search, get, dashboard і prompt-digest бачили їх без додавання другого
wiki-дерева. Кожна сторінка зберігає оригінальний ID концепту OKF, шлях джерела, `type`,
`resource`, `tags`, часову мітку та повний producer frontmatter. Внутрішні OKF-посилання
переписуються на згенеровані wiki-сторінки концептів і також виводяться як структуровані
записи `relationships` з `kind: okf-link`.

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

Саме це змушує wiki діяти радше як шар переконань, ніж пасивний
скид нотаток. Твердження можна відстежувати, оцінювати, оскаржувати та повертати до джерел.

## Метадані сутностей для агентів

Сторінки сутностей також можуть містити routing metadata для використання агентами. Це generic
frontmatter, тому він працює для людей, команд, систем, проєктів або будь-якого іншого
типу сутності.

Поширені поля:

- `entityType`: наприклад `person`, `team`, `system` або `project`
- `canonicalId`: стабільний ключ ідентичності, що використовується між alias та імпортами
- `aliases`: імена, handles або labels, які мають розв’язуватися до тієї самої сторінки
- `privacyTier`: `public`, `local-private`, `sensitive` або `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: компактні підказки routing
- `lastRefreshedAt`: часова мітка оновлення джерела, окрема від часу редагування сторінки
- `personCard`: опційна person-specific routing card з handles, socials,
  emails, timezone, lane, ask-for, avoid-asking-for, confidence і privacy
- `relationships`: типізовані ребра до пов’язаних сторінок із target, kind, weight,
  confidence, evidence kind, privacy tier і note

Для people wiki агенту зазвичай варто починати з
`reports/person-agent-directory.md`, потім відкрити сторінку людини через `wiki_get`
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

## Конвеєр компіляції

Крок компіляції читає wiki-сторінки, нормалізує підсумки та виводить стабільні
machine-facing артефакти в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ці дайджести існують, щоб агентам і коду середовища виконання не доводилося scrape Markdown
сторінки.

Скомпільований вивід також живить:

- перший прохід wiki-індексації для потоків search/get
- lookup claim-id назад до сторінок-власників
- компактні prompt supplements
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

- кластери нотаток із суперечностями
- конкуруючі кластери тверджень
- твердження без структурованих доказів
- сторінки й твердження з низькою впевненістю
- застаріла або невідома свіжість
- сторінки з невирішеними питаннями
- картки routing для людей/сутностей
- структуровані ребра зв’язків
- покриття класів доказів
- непублічні privacy tiers, які потребують перевірки перед використанням

## Пошук і отримання

`memory-wiki` підтримує два бекенди пошуку:

- `shared`: використовувати спільний потік пошуку пам’яті, коли доступний
- `local`: шукати wiki локально

Він також підтримує три корпуси:

- `wiki`
- `memory`
- `all`

Важлива поведінка:

- `wiki_search` і `wiki_get` використовують скомпільовані дайджести як перший прохід, коли це можливо
- ID тверджень можуть розв’язуватися назад до сторінки-власника
- оскаржені/застарілі/свіжі твердження впливають на ранжування
- labels походження можуть зберігатися в результатах
- режим пошуку може зміщувати ранжування для пошуку людей, routing питань, source
  evidence або raw claims

Практичне правило:

- використовуйте `memory_search corpus=all` для одного широкого проходу пригадування
- використовуйте `wiki_search` + `wiki_get`, коли важливі wiki-специфічне ранжування,
  походження або структура переконань на рівні сторінки

Режими пошуку:

- `auto`: збалансований типовий режим
- `find-person`: підсилює person-like сутності, alias, handles, socials і
  canonical IDs
- `route-question`: підсилює agent cards, підказки ask-for, підказки best-used-for і
  контекст зв’язків
- `source-evidence`: підсилює сторінки джерел і structured evidence metadata
- `raw-claim`: підсилює відповідні структуровані твердження та повертає claim/evidence
  metadata в результатах

Коли результат збігається зі структурованим твердженням, `wiki_search` може повернути
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` і `evidenceSourceIds` у своєму details payload. Текстовий вивід
також містить компактні рядки `Claim:` і `Evidence:`, коли вони доступні.

## Інструменти агентів

Плагін реєструє ці інструменти:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Що вони роблять:

- `wiki_status`: поточний режим сховища, стан, доступність Obsidian CLI
- `wiki_search`: шукає wiki-сторінки та, коли налаштовано, спільні корпуси пам’яті;
  приймає `mode` для пошуку людей, routing питань, source evidence або raw
  claim drilldown
- `wiki_get`: читає wiki-сторінку за id/path або fallback до спільного корпусу пам’яті
- `wiki_apply`: вузькі мутації synthesis/metadata без довільної хірургії сторінок
- `wiki_lint`: структурні перевірки, прогалини походження, суперечності, відкриті питання

Plugin також реєструє неексклюзивне доповнення корпусу пам’яті, тож спільні
`memory_search` і `memory_get` можуть звертатися до вікі, коли Plugin активної пам’яті
підтримує вибір корпусу.

## Поведінка промпта й контексту

Коли ввімкнено `context.includeCompiledDigestPrompt`, розділи промпта пам’яті
додають компактний скомпільований знімок з `agent-digest.json`.

Цей знімок навмисно малий і містить лише найважливіше:

- лише головні сторінки
- лише головні твердження
- кількість суперечностей
- кількість запитань
- кваліфікатори впевненості/свіжості

Це опціонально, бо змінює форму промпта й переважно корисне для контекстних
рушіїв або застарілого складання промптів, які явно споживають доповнення пам’яті.

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
- `bridge.readMemoryArtifacts`: імпортувати публічні артефакти Plugin активної пам’яті
- `bridge.followMemoryEvents`: включати журнали подій у режимі bridge
- `search.backend`: `shared` або `local`
- `search.corpus`: `wiki`, `memory` або `all`
- `context.includeCompiledDigestPrompt`: додавати компактний знімок дайджесту до розділів промпта пам’яті
- `render.createBacklinks`: генерувати детерміновані пов’язані блоки
- `render.createDashboards`: генерувати сторінки панелей

### Приклад: QMD + режим bridge

Використовуйте це, коли потрібен QMD для пригадування, а `memory-wiki` — для підтримуваного
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

- QMD відповідальним за пригадування активної пам’яті
- `memory-wiki` зосередженим на скомпільованих сторінках і панелях
- форму промпта незмінною, доки ви навмисно не ввімкнете промпти скомпільованого дайджесту

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

Коли `vault.renderMode` має значення `obsidian`, Plugin записує Markdown, сумісний з Obsidian,
і за бажанням може використовувати офіційний CLI `obsidian`.

Підтримувані робочі процеси охоплюють:

- перевірку стану
- пошук у сховищі
- відкриття сторінки
- виклик команди Obsidian
- перехід до щоденної нотатки

Це необов’язково. Вікі й далі працює в нативному режимі без Obsidian.

## Рекомендований робочий процес

1. Залиште свій Plugin активної пам’яті для пригадування/просування/Dreaming.
2. Увімкніть `memory-wiki`.
3. Почніть з режиму `isolated`, якщо вам явно не потрібен режим bridge.
4. Використовуйте `wiki_search` / `wiki_get`, коли важливе походження даних.
5. Використовуйте `wiki_apply` для вузьких синтезів або оновлень метаданих.
6. Запускайте `wiki_lint` після суттєвих змін.
7. Увімкніть панелі, якщо потрібна видимість застарілості/суперечностей.

## Пов’язані документи

- [Огляд пам’яті](/uk/concepts/memory)
- [CLI: memory](/uk/cli/memory)
- [CLI: wiki](/uk/cli/wiki)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
