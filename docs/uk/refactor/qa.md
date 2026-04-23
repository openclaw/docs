---
read_when:
    - Рефакторинг визначень QA-сценаріїв або коду harness qa-lab
    - Перенесення поведінки QA між markdown-сценаріями та логікою harness на TypeScript
summary: План рефакторингу QA для каталогу сценаріїв і консолідації harness
title: Рефакторинг QA
x-i18n:
    generated_at: "2026-04-23T21:09:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ca2257d24ad4face71897d986fd85bea901dcf805894e7b0cfe02f96e2eb95a
    source_path: refactor/qa.md
    workflow: 15
---

Статус: закладну міграцію вже виконано.

## Мета

Перевести QA OpenClaw з моделі розділених визначень до єдиного джерела істини для:

- metadata сценаріїв
- prompt-ів, які надсилаються моделі
- setup і teardown
- логіки harness
- перевірок і критеріїв успіху
- artifacts і підказок для звітів

Бажаний кінцевий стан — це універсальний QA harness, який завантажує потужні файли визначень сценаріїв замість того, щоб жорстко кодувати більшість поведінки на TypeScript.

## Поточний стан

Основне джерело істини тепер міститься в `qa/scenarios/index.md` плюс по одному файлу на
сценарій у `qa/scenarios/<theme>/*.md`.

Реалізовано:

- `qa/scenarios/index.md`
  - canonical metadata QA pack
  - identity оператора
  - kickoff mission
- `qa/scenarios/<theme>/*.md`
  - один markdown-файл на сценарій
  - metadata сценарію
  - прив’язки handler-ів
  - execution config, специфічний для сценарію
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser markdown pack + валідація zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - рендеринг plan з markdown pack
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - seed для згенерованих compatibility-файлів плюс `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - вибір виконуваних сценаріїв через прив’язки handler-ів, визначені в markdown
- QA bus protocol + UI
  - універсальні inline-вкладення для рендерингу image/video/audio/file

Поверхні, що все ще залишаються розділеними:

- `extensions/qa-lab/src/suite.ts`
  - усе ще володіє більшістю виконуваної custom-логіки handler-ів
- `extensions/qa-lab/src/report.ts`
  - усе ще виводить структуру звіту з runtime-виводу

Отже, проблему розділення джерела істини вже виправлено, але виконання все ще здебільшого спирається на handler-и, а не є повністю декларативним.

## Як виглядає реальна поверхня сценаріїв

Читання поточного suite показує кілька окремих класів сценаріїв.

### Проста взаємодія

- channel baseline
- DM baseline
- threaded follow-up
- model switch
- approval followthrough
- reaction/edit/delete

### Мутація конфігурації та runtime

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### Перевірки файлової системи та репозиторію

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### Оркестрація пам’яті

- memory recall
- memory tools in channel context
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory dreaming sweep

### Інтеграція інструментів і Plugin

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### Багатоходові сценарії та кілька учасників

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

Ці категорії важливі, тому що вони визначають вимоги до DSL. Плаского списку з prompt + очікуваним текстом недостатньо.

## Напрям

### Єдине джерело істини

Використовувати `qa/scenarios/index.md` плюс `qa/scenarios/<theme>/*.md` як
авторське джерело істини.

Pack має залишатися:

- читабельним для людини під час review
- придатним для машинного парсингу
- достатньо багатим, щоб керувати:
  - виконанням suite
  - bootstrap QA workspace
  - metadata QA Lab UI
  - docs/discovery prompt-ами
  - генерацією звітів

### Бажаний формат авторства

Використовувати markdown як top-level-формат, із структурованим YAML усередині.

Рекомендована форма:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - override-и model/provider
  - prerequisites
- prose-секції
  - objective
  - notes
  - debugging hints
- fenced YAML blocks
  - setup
  - steps
  - assertions
  - cleanup

Це дає:

- кращу читабельність PR, ніж величезний JSON
- багатший контекст, ніж чистий YAML
- суворий парсинг і валідацію zod

Сирий JSON припустимий лише як проміжна згенерована форма.

## Пропонована форма файлу сценарію

Приклад:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.5
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Можливості runner-а, які має покривати DSL

На основі поточного suite універсальному runner-у потрібно більше, ніж просто виконання prompt-ів.

### Дії середовища та setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Дії ходу агента

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Дії конфігурації та runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Дії з файлами та artifacts

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Дії з пам’яттю та Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Дії MCP

- `mcp.callTool`

### Перевірки

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Змінні та посилання на artifacts

DSL має підтримувати збережені виходи та подальші посилання на них.

Приклади з поточного suite:

- створити thread, а потім повторно використати `threadId`
- створити session, а потім повторно використати `sessionKey`
- згенерувати image, а потім прикріпити файл на наступному ході
- згенерувати рядок-маркер wake, а потім перевірити, що він з’являється пізніше

Потрібні можливості:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- типізовані посилання для paths, session keys, thread id, marker-ів, output інструментів

Без підтримки змінних harness і далі буде “витікати” логіку сценаріїв назад у TypeScript.

## Що має залишитися аварійними винятками

Повністю чистий декларативний runner нереалістичний на фазі 1.

Деякі сценарії за своєю природою важкі з погляду оркестрації:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- discovery-report evaluation

Поки що для них слід використовувати явні custom handler-и.

Рекомендоване правило:

- 85-90% декларативно
- явні кроки `customHandler` для складного залишку
- лише іменовані й задокументовані custom handler-и
- жодного анонімного inline-коду у файлі сценарію

Це збереже чистоту універсального engine, але все одно дасть змогу рухатися вперед.

## Зміна архітектури

### Поточний стан

Markdown сценаріїв уже є джерелом істини для:

- виконання suite
- bootstrap-файлів workspace
- каталогу сценаріїв QA Lab UI
- metadata звітів
- discovery prompt-ів

Згенерована сумісність:

- seeded workspace і далі включає `QA_KICKOFF_TASK.md`
- seeded workspace і далі включає `QA_SCENARIO_PLAN.md`
- seeded workspace тепер також включає `QA_SCENARIOS.md`

## План рефакторингу

### Фаза 1: loader і schema

Завершено.

- додано `qa/scenarios/index.md`
- сценарії розділено на `qa/scenarios/<theme>/*.md`
- додано parser для вмісту іменованого markdown YAML pack
- додано валідацію через zod
- споживачів переключено на parsed pack
- видалено `qa/seed-scenarios.json` і `qa/QA_KICKOFF_TASK.md` на рівні репозиторію

### Фаза 2: універсальний engine

- розділити `extensions/qa-lab/src/suite.ts` на:
  - loader
  - engine
  - registry дій
  - registry перевірок
  - custom handlers
- залишити наявні helper-функції як операції engine

Результат:

- engine виконує прості декларативні сценарії

Почати зі сценаріїв, які здебільшого складаються з prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Результат:

- перші реальні markdown-визначені сценарії, що постачаються через універсальний engine

### Фаза 4: міграція сценаріїв середньої складності

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Результат:

- доведена підтримка variables, artifacts, tool assertions, request-log assertions

### Фаза 5: складні сценарії залишаються на custom handlers

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Результат:

- той самий формат авторства, але з явними блоками custom-step там, де це потрібно

### Фаза 6: видалення hardcoded scenario map

Щойно покриття pack стане достатньо хорошим:

- прибрати більшість TypeScript-розгалужень, специфічних для сценаріїв, з `extensions/qa-lab/src/suite.ts`

## Fake Slack / підтримка rich media

Поточний QA bus орієнтований насамперед на текст.

Відповідні файли:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Сьогодні QA bus підтримує:

- text
- reactions
- threads

Він ще не моделює inline media attachments.

### Потрібний транспортний контракт

Додати універсальну модель вкладень QA bus:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Потім додати `attachments?: QaBusAttachment[]` до:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Чому спочатку універсально

Не будуйте модель media лише для Slack.

Натомість:

- одна універсальна транспортна модель QA
- кілька renderer-ів поверх неї
  - поточний чат QA Lab
  - майбутній fake Slack web
  - будь-які інші перегляди fake transport

Це запобігає дублюванню логіки й дозволяє media-сценаріям залишатися незалежними від транспорту.

### Яка робота потрібна в UI

Оновити UI QA, щоб він рендерив:

- inline preview зображення
- inline audio player
- inline video player
- chip файлового вкладення

Поточний UI вже вміє рендерити threads і reactions, тож рендеринг вкладень має нашаровуватися на ту саму модель картки повідомлення.

### Які сценарії відкриває media transport

Коли вкладення потечуть через QA bus, ми зможемо додати багатші fake-chat-сценарії:

- inline image reply у fake Slack
- розуміння audio attachment
- розуміння video attachment
- змішаний порядок вкладень
- thread reply зі збереженням media

## Рекомендація

Наступний шматок реалізації має бути таким:

1. додати markdown scenario loader + zod schema
2. згенерувати поточний каталог із markdown
3. спочатку мігрувати кілька простих сценаріїв
4. додати універсальну підтримку вкладень у QA bus
5. відрендерити inline image у QA UI
6. а потім розширити це на audio і video

Це найменший шлях, який доводить обидві цілі:

- універсальний QA, визначений через markdown
- багатші fake messaging surfaces

## Відкриті питання

- чи мають файли сценаріїв дозволяти вбудовані markdown-шаблони prompt-ів із інтерполяцією змінних
- чи мають setup/cleanup бути іменованими секціями чи просто впорядкованими списками дій
- чи мають посилання на artifacts бути строго типізованими в схемі чи базуватися на рядках
- чи мають custom handler-и жити в одному registry чи в registry для кожної поверхні окремо
- чи має згенерований JSON-файл сумісності залишатися закоміченим під час міграції
