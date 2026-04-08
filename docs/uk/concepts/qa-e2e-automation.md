---
read_when:
    - Розширення qa-lab або qa-channel
    - Додавання QA-сценаріїв із прив’язкою до репозиторію
    - Створення більш реалістичної QA-автоматизації навколо панелі Gateway
summary: Форма приватної QA-автоматизації для qa-lab, qa-channel, початково заповнених сценаріїв і звітів про протокол
title: QA E2E Automation
x-i18n:
    generated_at: "2026-04-08T16:50:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e248009148c4dcd1c3e7f9dab768b272b743ba1d406f79c89cb71074e2b76a4a
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E Automation

Приватний стек QA призначений для того, щоб перевіряти OpenClaw у більш реалістичний,
орієнтований на канали спосіб, ніж це може зробити один модульний тест.

Поточні складові:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями для DM, каналу, треду,
  реакцій, редагування та видалення.
- `extensions/qa-lab`: UI налагодження та QA-шина для спостереження за транскриптом,
  ін’єкції вхідних повідомлень і експорту звіту Markdown.
- `qa/`: початкові ресурси з прив’язкою до репозиторію для стартового завдання та базових QA-сценаріїв.

Поточний робочий процес QA-оператора — це двопанельний сайт QA:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує транскрипт у стилі Slack і план сценарію.

Запустіть це так:

```bash
pnpm qa:lab:up
```

Це збирає сайт QA, запускає lane Gateway на основі Docker і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу та записувати, що спрацювало, що не
спрацювало або що залишилося заблокованим.

Щоб швидше ітерувати UI QA Lab без перебудови образу Docker щоразу,
запустіть стек із bind-mounted бандлом QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає сервіси Docker на попередньо зібраному образі та bind-mount
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перебудовує цей бандл при змінах, а браузер автоматично перезавантажується, коли
змінюється хеш ресурсу QA Lab.

## Початкові ресурси з прив’язкою до репозиторію

Початкові ресурси зберігаються в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту. Базовий список має залишатися достатньо широким, щоб охоплювати:

- чати в DM і каналах
- поведінку тредів
- життєвий цикл дій із повідомленнями
- cron callbacks
- виклик пам’яті
- перемикання моделей
- передачу підзадачі субагенту
- читання репозиторію та документації
- одне невелике завдання на збірку, наприклад Lobster Invaders

## Звітування

`qa-lab` експортує звіт про протокол у Markdown на основі спостережуваної часової шкали шини.
Звіт має відповідати на такі запитання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які сценарії продовження варто додати

Для перевірок характеру та стилю виконайте той самий сценарій на кількох live refs моделей
і створіть оцінений звіт Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model minimax/MiniMax-M2.7,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model qwen/qwen3.6-plus,thinking=high \
  --model xiaomi/mimo-v2-pro,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high
```

Команда запускає локальні дочірні процеси QA gateway, а не Docker. Сценарії
оцінювання характеру мають задавати персону через `SOUL.md`, а потім виконувати звичайні
ходи користувача, такі як чат, допомога з робочим простором і невеликі файлові завдання. Кандидатній моделі
не слід повідомляти, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім звертається до моделей-оцінювачів у fast mode з
міркуванням `xhigh`, щоб ранжувати запуски за природністю, вайбом і гумором.
Для кандидатних запусків за замовчуванням використовується thinking `high`, а для моделей OpenAI — `xhigh`,
якщо вони це підтримують. Замініть конкретного кандидата inline через
`--model provider/model,thinking=<level>`. `--thinking <level>` як і раніше задає
глобальний резервний варіант, а старіша форма `--model-thinking <provider/model=level>` збережена
для сумісності.
Для референсів кандидатів OpenAI за замовчуванням використовується fast mode, щоб застосовувалася
пріоритетна обробка там, де це підтримує провайдер. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому кандидату або оцінювачу потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної кандидатної моделі. Тривалість кандидатів і оцінювачів
записується у звіт для аналізу бенчмарків, але в prompts для оцінювачів прямо вказано
не ранжувати за швидкістю.
Якщо не передано жодного кандидатного `--model`, для оцінювання характеру за замовчуванням використовуються
`openai/gpt-5.4`, `openai/gpt-5.2`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `minimax/MiniMax-M2.7`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, `qwen/qwen3.6-plus`, `xiaomi/mimo-v2-pro` і
`google/gemini-3.1-pro-preview`.
Якщо не передано жодного `--judge-model`, то за замовчуванням оцінювачами є
`openai/gpt-5.4,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язана документація

- [Testing](/uk/help/testing)
- [QA Channel](/uk/channels/qa-channel)
- [Dashboard](/web/dashboard)
