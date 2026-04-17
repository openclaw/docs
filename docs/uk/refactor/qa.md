---
x-i18n:
    generated_at: "2026-04-17T15:05:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbb2c70c82da7f6f12d90e25666635ff4147c52e8a94135e902d1de4f5cbccca
    source_path: refactor/qa.md
    workflow: 15
---

# Рефакторинг QA

Статус: закладено фундаментальну міграцію.

## Мета

Перевести OpenClaw QA з моделі розділених визначень на єдине джерело істини:

- метадані сценарію
- підказки, що надсилаються моделі
- налаштування та завершення
- логіка каркаса
- перевірки й критерії успіху
- артефакти та підказки для звіту

Бажаний кінцевий стан — універсальний QA-каркас, який завантажує потужні файли визначення сценаріїв замість того, щоб жорстко кодувати більшість поведінки в TypeScript.

## Поточний стан

Основне джерело істини тепер міститься в `qa/scenarios/index.md` і по одному файлу на
сценарій у `qa/scenarios/<theme>/*.md`.

Реалізовано:

- `qa/scenarios/index.md`
  - канонічні метадані QA-пакета
  - ідентичність оператора
  - стартова місія
- `qa/scenarios/<theme>/*.md`
  - один markdown-файл на сценарій
  - метадані сценарію
  - прив’язки обробників
  - конфігурація виконання, специфічна для сценарію
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown-парсер пакета + zod-валідація
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - рендеринг плану з markdown-пакета
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - заповнює згенеровані файли сумісності та `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - вибирає виконувані сценарії через прив’язки обробників, визначені в markdown
- протокол QA bus + UI
  - універсальні вбудовані вкладення для рендерингу зображення/відео/аудіо/файлів

Поверхні, що залишаються розділеними:

- `extensions/qa-lab/src/suite.ts`
  - досі містить більшість виконуваної логіки кастомних обробників
- `extensions/qa-lab/src/report.ts`
  - досі виводить структуру звіту з результатів виконання

Отже, проблему розділення джерела істини виправлено, але виконання все ще здебільшого спирається на обробники, а не є повністю декларативним.

## Який насправді вигляд має поверхня сценаріїв

Читання поточного набору показує кілька різних класів сценаріїв.

### Проста взаємодія

- базовий сценарій каналу
- базовий сценарій DM
- подальша взаємодія в треді
- перемикання моделі
- завершення після схвалення
- реакція/редагування/видалення

### Зміна конфігурації та середовища виконання

- `config patch` для вимкнення Skills
- пробудження після `config apply restart`
- перемикання можливостей після `config restart`
- перевірка дрейфу інвентаря середовища виконання

### Перевірки файлової системи та репозиторію

- звіт про виявлення `source/docs`
- збирання Lobster Invaders
- пошук артефакта згенерованого зображення

### Оркестрація пам’яті

- відтворення з пам’яті
- інструменти пам’яті в контексті каналу
- резервний сценарій у разі збою пам’яті
- ранжування пам’яті сесії
- ізоляція пам’яті тредів
- прохід Dreaming по пам’яті

### Інтеграція інструментів і плагінів

- виклик `MCP plugin-tools`
- видимість skill
- гаряче встановлення skill
- нативна генерація зображень
- повний цикл обробки зображення
- розпізнавання зображення з вкладення

### Багатокрокові та багатокористувацькі сценарії

- передача до субагента
- fanout-синтез субагента
- потоки відновлення після перезапуску

Ці категорії важливі, тому що вони визначають вимоги до DSL. Плоского списку з підказкою + очікуваним текстом недостатньо.

## Напрям

### Єдине джерело істини

Використовувати `qa/scenarios/index.md` і `qa/scenarios/<theme>/*.md` як авторське
джерело істини.

Пакет має залишатися:

- читабельним для людини під час рев’ю
- придатним для машинного розбору
- достатньо багатим, щоб керувати:
  - виконанням набору
  - початковим налаштуванням QA workspace
  - метаданими QA Lab UI
  - підказками для документації/виявлення
  - генерацією звітів

### Бажаний формат авторингу

Використовувати markdown як формат верхнього рівня зі структурованим YAML усередині.

Рекомендована форма:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - посилання на docs
  - посилання на код
  - перевизначення моделі/провайдера
  - передумови
- розділи прози
  - objective
  - notes
  - debugging hints
- fenced YAML-блоки
  - setup
  - steps
  - assertions
  - cleanup

Це дає:

- кращу читабельність PR, ніж гігантський JSON
- багатший контекст, ніж чистий YAML
- строгий парсинг і zod-валідацію

Сирий JSON прийнятний лише як проміжна згенерована форма.

## Запропонована форма файла сценарію

Приклад:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
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

## Можливості раннера, які має покривати DSL

На основі поточного набору універсальному раннеру потрібно більше, ніж просто виконання підказок.

### Дії середовища та налаштування

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

### Дії конфігурації та середовища виконання

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Дії з файлами та артефактами

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

## Змінні та посилання на артефакти

DSL має підтримувати збережені результати та подальші посилання на них.

Приклади з поточного набору:

- створити тред, а потім повторно використати `threadId`
- створити сесію, а потім повторно використати `sessionKey`
- згенерувати зображення, а потім прикріпити файл у наступному ході
- згенерувати рядок-маркер пробудження, а потім перевірити, що він з’являється пізніше

Потрібні можливості:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- типізовані посилання для шляхів, ключів сесій, id тредів, маркерів, результатів інструментів

Без підтримки змінних каркас і далі витікатиме логікою сценаріїв назад у TypeScript.

## Що має залишитися як запасні механізми

Повністю чистий декларативний раннер нереалістичний на фазі 1.

Деякі сценарії за своєю природою потребують важкої оркестрації:

- прохід Dreaming по пам’яті
- пробудження після `config apply restart`
- перемикання можливостей після `config restart`
- визначення артефакта згенерованого зображення за часовою міткою/шляхом
- оцінювання discovery-report

Поки що вони мають використовувати явні кастомні обробники.

Рекомендоване правило:

- 85-90% декларативно
- явні кроки `customHandler` для складного залишку
- лише іменовані й задокументовані кастомні обробники
- жодного анонімного вбудованого коду у файлі сценарію

Це дозволяє зберегти чистоту універсального рушія та водночас рухатися вперед.

## Архітектурна зміна

### Поточний стан

Markdown сценаріїв уже є джерелом істини для:

- виконання набору
- файлів початкового налаштування workspace
- каталогу сценаріїв QA Lab UI
- метаданих звіту
- підказок для виявлення

Згенерована сумісність:

- заповнений workspace усе ще містить `QA_KICKOFF_TASK.md`
- заповнений workspace усе ще містить `QA_SCENARIO_PLAN.md`
- заповнений workspace тепер також містить `QA_SCENARIOS.md`

## План рефакторингу

### Фаза 1: завантажувач і схема

Готово.

- додано `qa/scenarios/index.md`
- розділено сценарії в `qa/scenarios/<theme>/*.md`
- додано парсер для іменованого markdown YAML-вмісту пакета
- виконано валідацію через zod
- споживачів переведено на розібраний пакет
- видалено репозиторний `qa/seed-scenarios.json` і `qa/QA_KICKOFF_TASK.md`

### Фаза 2: універсальний рушій

- розділити `extensions/qa-lab/src/suite.ts` на:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- зберегти наявні допоміжні функції як операції рушія

Результат:

- рушій виконує прості декларативні сценарії

Почати зі сценаріїв, які здебільшого є послідовністю prompt + wait + assert:

- подальша взаємодія в треді
- розпізнавання зображення з вкладення
- видимість та виклик skill
- базовий сценарій каналу

Результат:

- перші реальні сценарії, визначені в markdown, постачаються через універсальний рушій

### Фаза 4: міграція сценаріїв середньої складності

- повний цикл генерації зображення
- інструменти пам’яті в контексті каналу
- ранжування пам’яті сесії
- передача до субагента
- fanout-синтез субагента

Результат:

- доведено підтримку змінних, артефактів, перевірок інструментів і перевірок request-log

### Фаза 5: залишити складні сценарії на кастомних обробниках

- прохід Dreaming по пам’яті
- пробудження після `config apply restart`
- перемикання можливостей після `config restart`
- дрейф інвентаря середовища виконання

Результат:

- той самий формат авторингу, але з явними блоками кастомних кроків там, де це потрібно

### Фаза 6: видалити жорстко закодовану карту сценаріїв

Щойно покриття пакета стане достатнім:

- прибрати більшість TypeScript-розгалужень, специфічних для сценаріїв, з `extensions/qa-lab/src/suite.ts`

## Підтримка фальшивого Slack / насичених медіа

Поточний QA bus орієнтований насамперед на текст.

Відповідні файли:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Сьогодні QA bus підтримує:

- текст
- реакції
- треди

Він ще не моделює вбудовані медіавкладення.

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

Не потрібно будувати модель медіа лише для Slack.

Натомість:

- одна універсальна модель QA transport
- кілька рендерерів поверх неї
  - поточний чат QA Lab
  - майбутній веб фальшивого Slack
  - будь-які інші вигляди фальшивого транспорту

Це запобігає дублюванню логіки й дозволяє медіасценаріям залишатися незалежними від конкретного транспорту.

### Яка робота потрібна в UI

Оновити QA UI, щоб він рендерив:

- вбудований попередній перегляд зображення
- вбудований аудіоплеєр
- вбудований відеоплеєр
- чип вкладеного файла

Поточний UI уже вміє рендерити треди та реакції, тому рендеринг вкладень має нашаровуватися на ту саму модель картки повідомлення.

### Яку роботу над сценаріями відкриває медіатранспорт

Щойно вкладення почнуть проходити через QA bus, ми зможемо додати багатші сценарії фальшивого чату:

- вбудована відповідь із зображенням у фальшивому Slack
- розпізнавання аудіовкладення
- розпізнавання відеовкладення
- змішаний порядок вкладень
- відповідь у треді зі збереженням медіа

## Рекомендація

Наступний етап реалізації має бути таким:

1. додати markdown-завантажувач сценаріїв + zod-схему
2. згенерувати поточний каталог із markdown
3. спочатку мігрувати кілька простих сценаріїв
4. додати універсальну підтримку вкладень у QA bus
5. реалізувати вбудований рендеринг зображень у QA UI
6. потім розширити на аудіо та відео

Це найменший шлях, який доводить обидві цілі:

- універсальний QA, визначений через markdown
- багатші поверхні фальшивих повідомлень

## Відкриті питання

- чи мають файли сценаріїв дозволяти вбудовані markdown-шаблони підказок з інтерполяцією змінних
- чи мають setup/cleanup бути іменованими розділами, чи просто впорядкованими списками дій
- чи мають посилання на артефакти бути строго типізованими в схемі, чи базуватися на рядках
- чи мають кастомні обробники жити в одному реєстрі, чи в окремих реєстрах для кожної surface
- чи має згенерований JSON-файл сумісності залишатися закоміченим під час міграції
