---
read_when:
    - Вам нужны постоянные знания за пределами простых заметок MEMORY.md
    - Вы настраиваете встроенный plugin memory-wiki
    - Вы хотите понять wiki_search, wiki_get или режим bridge
summary: 'memory-wiki: скомпилированное хранилище знаний с происхождением данных, утверждениями, панелями мониторинга и режимом моста'
title: Вики памяти
x-i18n:
    generated_at: "2026-06-28T23:18:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` — это встроенный плагин, который превращает долговременную память в скомпилированное
хранилище знаний.

Он **не** заменяет плагин активной памяти. Плагин активной памяти по-прежнему
отвечает за recall, promotion, индексирование и dreaming. `memory-wiki` работает рядом с ним
и компилирует долговременные знания в навигируемую wiki с детерминированными страницами,
структурированными утверждениями, происхождением, dashboards и машиночитаемыми digest.

Используйте его, когда хотите, чтобы память работала скорее как поддерживаемый слой знаний,
а не как набор Markdown-файлов.

## Что он добавляет

- Отдельное wiki-хранилище с детерминированной структурой страниц
- Структурированные метаданные утверждений и доказательств, а не только прозу
- Происхождение, уверенность, противоречия и открытые вопросы на уровне страниц
- Скомпилированные digest для потребителей-агентов и runtime
- Нативные wiki-инструменты search/get/apply/lint
- Импорт Open Knowledge Format в скомпилированные wiki-концепты
- Необязательный режим bridge, который импортирует публичные артефакты из плагина активной памяти
- Необязательный режим рендеринга, удобный для Obsidian, и интеграция с CLI

## Как это сочетается с памятью

Разделение можно понимать так:

| Слой                                                    | Отвечает за                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Плагин активной памяти (`memory-core`, QMD, Honcho и т. д.) | Recall, семантический поиск, promotion, dreaming, runtime памяти                          |
| `memory-wiki`                                           | Скомпилированные wiki-страницы, синтезы с богатым происхождением, dashboards, wiki-специфичные search/get/apply |

Если плагин активной памяти предоставляет общие артефакты recall, OpenClaw может искать
по обоим слоям за один проход с `memory_search corpus=all`.

Когда вам нужен wiki-специфичный ranking, происхождение или прямой доступ к страницам, используйте
вместо этого нативные wiki-инструменты.

## Рекомендуемый гибридный паттерн

Хороший вариант по умолчанию для local-first установок:

- QMD как backend активной памяти для recall и широкого семантического поиска
- `memory-wiki` в режиме `bridge` для долговременных синтезированных страниц знаний

Такое разделение хорошо работает, потому что каждый слой остается сфокусированным:

- QMD сохраняет доступными для поиска сырые заметки, экспорты сессий и дополнительные коллекции
- `memory-wiki` компилирует стабильные сущности, утверждения, dashboards и исходные страницы

Практическое правило:

- используйте `memory_search`, когда нужен один широкий проход recall по памяти
- используйте `wiki_search` и `wiki_get`, когда нужны wiki-результаты с учетом происхождения
- используйте `memory_search corpus=all`, когда общий поиск должен охватывать оба слоя

Если режим bridge сообщает о нуле экспортированных артефактов, значит плагин активной памяти
пока не предоставляет публичные bridge-входы. Сначала выполните `openclaw wiki doctor`,
затем убедитесь, что плагин активной памяти поддерживает публичные артефакты.

Когда режим bridge активен и `bridge.readMemoryArtifacts` включен,
`openclaw wiki status`, `openclaw wiki doctor` и `openclaw wiki bridge
import` читают данные через работающий Gateway. Это сохраняет CLI-проверки bridge согласованными
с runtime-контекстом плагина памяти. Если bridge отключен или чтение артефактов
выключено, эти команды сохраняют свое локальное/offline поведение.

## Режимы хранилища

`memory-wiki` поддерживает три режима хранилища:

### `isolated`

Собственное хранилище, собственные источники, без зависимости от `memory-core`.

Используйте это, когда хотите, чтобы wiki была собственным курируемым хранилищем знаний.

### `bridge`

Читает публичные артефакты памяти и события памяти из плагина активной памяти
через публичные швы plugin SDK.

Используйте это, когда хотите, чтобы wiki компилировала и организовывала
экспортированные артефакты плагина памяти, не обращаясь к приватным внутренностям плагина.

Режим bridge может индексировать:

- экспортированные артефакты памяти
- отчеты dream
- ежедневные заметки
- корневые файлы памяти
- журналы событий памяти

### `unsafe-local`

Явный аварийный выход для локальных приватных путей на той же машине.

Этот режим намеренно экспериментальный и непереносимый. Используйте его только когда
понимаете границу доверия и вам действительно нужен доступ к локальной файловой системе,
который режим bridge предоставить не может.

## Структура хранилища

Плагин инициализирует хранилище так:

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

Управляемый контент остается внутри сгенерированных блоков. Блоки человеческих заметок сохраняются.

Основные группы страниц:

- `sources/` для импортированного сырого материала и страниц, поддерживаемых bridge
- `entities/` для долговременных вещей, людей, систем, проектов и объектов
- `concepts/` для идей, абстракций, паттернов и политик
- `syntheses/` для скомпилированных сводок и поддерживаемых rollup
- `reports/` для сгенерированных dashboards

## Импорт Open Knowledge Format

`memory-wiki` может импортировать распакованные наборы Open Knowledge Format с помощью:

```bash
openclaw wiki okf import ./bundles/ga4
```

Это самый чистый вариант, когда каталог данных, crawler документации или
агент обогащения уже производит OKF: оставьте OKF переносимым артефактом обмена,
а затем позвольте `memory-wiki` превратить его в нативные для OpenClaw страницы концептов и
скомпилированные digest.

Импортер следует форме OKF v0.1:

- незарезервированные `.md` файлы являются документами концептов
- каждому импортированному концепту нужно непустое поле frontmatter `type`
- неизвестные значения OKF `type` принимаются
- зарезервированные файлы `index.md` и `log.md` не импортируются как концепты
- сломанные или внешние markdown-ссылки сохраняются

Импортированные страницы концептов уплощаются в `concepts/`, чтобы существующие пути compile,
search, get, dashboard и prompt-digest видели их без добавления второго
wiki-дерева. Каждая страница сохраняет исходный OKF concept ID, путь источника, `type`,
`resource`, `tags`, timestamp и полный producer frontmatter. Внутренние OKF-ссылки
переписываются на сгенерированные wiki-страницы концептов и также выводятся как структурированные
записи `relationships` с `kind: okf-link`.

## Структурированные утверждения и доказательства

Страницы могут содержать структурированный frontmatter `claims`, а не только произвольный текст.

Каждое утверждение может включать:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Записи доказательств могут включать:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Именно это заставляет wiki работать скорее как слой убеждений, чем как пассивная
свалка заметок. Утверждения можно отслеживать, оценивать, оспаривать и привязывать обратно к источникам.

## Метаданные сущностей для агентов

Страницы сущностей также могут содержать routing-метаданные для использования агентами. Это общий
frontmatter, поэтому он работает для людей, команд, систем, проектов или любых других
типов сущностей.

Распространенные поля:

- `entityType`: например `person`, `team`, `system` или `project`
- `canonicalId`: стабильный ключ идентичности, используемый между alias и импортами
- `aliases`: имена, handles или labels, которые должны разрешаться в ту же страницу
- `privacyTier`: `public`, `local-private`, `sensitive` или `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: компактные routing-подсказки
- `lastRefreshedAt`: timestamp обновления источника, отдельный от времени редактирования страницы
- `personCard`: необязательная person-специфичная routing-карточка с handles, socials,
  emails, timezone, lane, ask-for, avoid-asking-for, confidence и privacy
- `relationships`: типизированные ребра к связанным страницам с target, kind, weight,
  confidence, evidence kind, privacy tier и note

Для people wiki агенту обычно следует начинать с
`reports/person-agent-directory.md`, затем открыть страницу человека через `wiki_get`
перед использованием контактных данных или выведенных фактов.

Пример:

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

Шаг compile читает wiki-страницы, нормализует сводки и выводит стабильные
машинно-ориентированные артефакты в:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Эти digest существуют, чтобы агентам и runtime-коду не приходилось извлекать данные из Markdown-страниц.

Скомпилированный вывод также обеспечивает:

- первичное wiki-индексирование для потоков search/get
- lookup claim-id обратно к страницам-владельцам
- компактные prompt-дополнения
- генерацию отчетов/dashboard

## Dashboards и health-отчеты

Когда `render.createDashboards` включен, compile поддерживает dashboards в
`reports/`.

Встроенные отчеты включают:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Эти отчеты отслеживают такие вещи, как:

- кластеры заметок с противоречиями
- конкурирующие кластеры утверждений
- утверждения без структурированных доказательств
- страницы и утверждения с низкой уверенностью
- устаревшая или неизвестная свежесть
- страницы с нерешенными вопросами
- routing-карточки людей/сущностей
- структурированные ребра отношений
- покрытие классов доказательств
- непубличные privacy tiers, которые требуют проверки перед использованием

## Поиск и извлечение

`memory-wiki` поддерживает два backend поиска:

- `shared`: использовать общий поток поиска по памяти, когда он доступен
- `local`: искать wiki локально

Он также поддерживает три корпуса:

- `wiki`
- `memory`
- `all`

Важное поведение:

- `wiki_search` и `wiki_get` используют скомпилированные digest как первый проход, когда это возможно
- claim ids могут разрешаться обратно к странице-владельцу
- contest/stale/fresh claims влияют на ranking
- метки происхождения могут сохраняться в результатах
- режим поиска может смещать ranking для поиска людей, question routing, source
  evidence или raw claims

Практическое правило:

- используйте `memory_search corpus=all` для одного широкого прохода recall
- используйте `wiki_search` + `wiki_get`, когда важны wiki-специфичный ranking,
  происхождение или структура убеждений на уровне страниц

Режимы поиска:

- `auto`: сбалансированное значение по умолчанию
- `find-person`: усиливает человекоподобные сущности, alias, handles, socials и
  canonical IDs
- `route-question`: усиливает agent cards, ask-for hints, best-used-for hints и
  контекст отношений
- `source-evidence`: усиливает страницы источников и структурированные метаданные доказательств
- `raw-claim`: усиливает совпадающие структурированные утверждения и возвращает метаданные claim/evidence
  в результатах

Когда результат совпадает со структурированным утверждением, `wiki_search` может вернуть
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` и `evidenceSourceIds` в своем details payload. Текстовый вывод
также включает компактные строки `Claim:` и `Evidence:`, когда они доступны.

## Инструменты агента

Плагин регистрирует эти инструменты:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Что они делают:

- `wiki_status`: текущий режим хранилища, health, доступность Obsidian CLI
- `wiki_search`: поиск wiki-страниц и, при настройке, общих memory corpora;
  принимает `mode` для поиска людей, question routing, source evidence или raw
  claim drilldown
- `wiki_get`: читает wiki-страницу по id/path или fallback к общему memory corpus
- `wiki_apply`: узкие мутации synthesis/metadata без произвольной правки страниц
- `wiki_lint`: структурные проверки, пробелы происхождения, противоречия, открытые вопросы

Плагин также регистрирует неэксклюзивное дополнение корпуса памяти, поэтому общие
`memory_search` и `memory_get` могут обращаться к wiki, когда плагин активной памяти
поддерживает выбор корпуса.

## Поведение prompt и контекста

Когда включен `context.includeCompiledDigestPrompt`, разделы prompt памяти
добавляют компактный скомпилированный снимок из `agent-digest.json`.

Этот снимок намеренно небольшой и содержит только наиболее значимую информацию:

- только ключевые страницы
- только ключевые утверждения
- количество противоречий
- количество вопросов
- квалификаторы уверенности/свежести

Это опционально, потому что меняет форму prompt и в основном полезно для движков
контекста или устаревшей сборки prompt, которые явно используют дополнения памяти.

## Конфигурация

Разместите конфигурацию в `plugins.entries.memory-wiki.config`:

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

Ключевые переключатели:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` или `obsidian`
- `bridge.readMemoryArtifacts`: импортировать публичные артефакты плагина активной памяти
- `bridge.followMemoryEvents`: включать журналы событий в режиме bridge
- `search.backend`: `shared` или `local`
- `search.corpus`: `wiki`, `memory` или `all`
- `context.includeCompiledDigestPrompt`: добавлять компактный снимок digest в разделы prompt памяти
- `render.createBacklinks`: генерировать детерминированные связанные блоки
- `render.createDashboards`: генерировать страницы dashboard

### Пример: QMD + режим bridge

Используйте это, когда вам нужен QMD для извлечения и `memory-wiki` для поддерживаемого
слоя знаний:

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

Это сохраняет:

- QMD ответственным за извлечение активной памяти
- `memory-wiki` сосредоточенным на скомпилированных страницах и dashboard
- форму prompt неизменной, пока вы намеренно не включите prompts скомпилированного digest

## CLI

`memory-wiki` также предоставляет поверхность CLI верхнего уровня:

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

См. [CLI: wiki](/ru/cli/wiki) для полного справочника команд.

## Поддержка Obsidian

Когда `vault.renderMode` равен `obsidian`, плагин записывает Markdown, удобный для Obsidian,
и при необходимости может использовать официальный CLI `obsidian`.

Поддерживаемые рабочие процессы включают:

- проверку состояния
- поиск в vault
- открытие страницы
- вызов команды Obsidian
- переход к ежедневной заметке

Это опционально. Wiki продолжает работать в нативном режиме без Obsidian.

## Рекомендуемый рабочий процесс

1. Оставьте ваш плагин активной памяти для извлечения/продвижения/Dreaming.
2. Включите `memory-wiki`.
3. Начните с режима `isolated`, если вам явно не нужен режим bridge.
4. Используйте `wiki_search` / `wiki_get`, когда важна происхождение данных.
5. Используйте `wiki_apply` для узких синтезов или обновлений метаданных.
6. Запускайте `wiki_lint` после значимых изменений.
7. Включите dashboards, если вам нужна видимость устаревания/противоречий.

## Связанные документы

- [Обзор памяти](/ru/concepts/memory)
- [CLI: memory](/ru/cli/memory)
- [CLI: wiki](/ru/cli/wiki)
- [Обзор Plugin SDK](/ru/plugins/sdk-overview)
