---
read_when:
    - Ви хочете запускати або створювати файли робочих процесів .prose
    - Ви хочете ввімкнути плагін OpenProse
    - Вам потрібно зрозуміти, як OpenProse зіставляється з примітивами OpenClaw
sidebarTitle: OpenProse
summary: OpenProse — це орієнтований насамперед на Markdown формат робочих процесів для багатоагентних сеансів ШІ. В OpenClaw він постачається як плагін із командою `/prose` та набором Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T13:40:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse — це портативний формат робочих процесів, орієнтований насамперед на Markdown, для оркестрації сеансів ШІ. В OpenClaw він постачається як Plugin, що встановлює пакет Skills OpenProse і команду з косою рискою `/prose`. Програми зберігаються у файлах `.prose` і можуть запускати кілька підагентів із явно заданим потоком керування.

<CardGroup cols={3}>
  <Card title="Встановлення" icon="download" href="#install">
    Увімкніть Plugin OpenProse і перезапустіть Gateway.
  </Card>
  <Card title="Запуск програми" icon="play" href="#slash-command">
    Використовуйте `/prose run`, щоб виконати файл `.prose` або віддалену програму.
  </Card>
  <Card title="Написання програм" icon="pencil" href="#example-parallel-research-and-synthesis">
    Створюйте багатоагентні робочі процеси з паралельними й послідовними кроками.
  </Card>
</CardGroup>

## Встановлення

<Steps>
  <Step title="Увімкніть Plugin">
    OpenProse входить до комплекту, але за замовчуванням вимкнений. Увімкніть його:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Перезапустіть Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Перевірте">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` має відображатися як увімкнений. Команда Skills `/prose` тепер доступна в чаті.

  </Step>
</Steps>

Із робочої копії репозиторію Plugin можна встановити безпосередньо:
`openclaw plugins install ./extensions/open-prose`

## Команда з косою рискою

OpenProse реєструє `/prose` як команду Skills, яку може викликати користувач:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` перетворюється на `https://p.prose.md/<handle>/<slug>`.
Прямі URL завантажуються без змін за допомогою інструмента `web_fetch`.

Віддалені запуски верхнього рівня є явними. Віддалені імпорти всередині програми `.prose` є транзитивними залежностями коду: перш ніж OpenProse завантажить будь-яку віддалену ціль `use`, він показує список визначених імпортів і вимагає, щоб оператор для цього запуску відповів точно `approve remote prose imports`.

## Можливості

- Багатоагентні дослідження й узагальнення з явно заданим паралелізмом.
- Відтворювані робочі процеси з безпечним підтвердженням (перевірка коду, сортування інцидентів, конвеєри вмісту).
- Повторно використовувані програми `.prose`, які можна запускати в підтримуваних середовищах виконання агентів.

## Приклад: паралельне дослідження й узагальнення

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## Відображення на середовище виконання OpenClaw

Програми OpenProse відображаються на примітиви OpenClaw:

| Концепція OpenProse                 | Інструмент OpenClaw                              |
| ----------------------------------- | ----------------------------------------------- |
| Створення сеансу / інструмент Task | `sessions_spawn`                                |
| Читання / запис файлів             | `read` / `write`                                |
| Завантаження з вебу                | `web_fetch` (`exec` + curl, коли потрібен POST) |

<Warning>
  Якщо ваш список дозволених інструментів блокує `sessions_spawn`, `read`, `write` або
  `web_fetch`, програми OpenProse завершуватимуться з помилкою. Перевірте
  [конфігурацію списку дозволених інструментів](/uk/gateway/config-tools).
</Warning>

## Розташування файлів

OpenProse зберігає стан у каталозі `.prose/` вашого робочого простору:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Постійні агенти рівня користувача, спільні для різних проєктів, зберігаються тут:

```text
~/.prose/agents/
```

## Сховища стану

<AccordionGroup>
  <Accordion title="файлова система (за замовчуванням)">
    Стан записується до `.prose/runs/...` у робочому просторі. Додаткові залежності не потрібні.
  </Accordion>
  <Accordion title="у контексті">
    Тимчасовий стан зберігається у вікні контексту; виберіть за допомогою `--in-context`.
    Підходить для невеликих короткочасних програм.
  </Accordion>
  <Accordion title="sqlite (експериментальний)">
    Виберіть за допомогою `--state=sqlite`. Потрібен виконуваний файл `sqlite3` у `PATH`
    (за його відсутності використовується файлова система); стан зберігається в
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (експериментальний)">
    Виберіть за допомогою `--state=postgres`. Потрібні `psql` і рядок підключення в
    `OPENPROSE_POSTGRES_URL` (задайте його в `.prose/.env`).

    <Warning>
      Облікові дані Postgres потрапляють до журналів підагентів. Використовуйте окрему базу даних із мінімально необхідними привілеями.
    </Warning>

  </Accordion>
</AccordionGroup>

## Безпека

Ставтеся до файлів `.prose` як до коду. Перевіряйте їх перед запуском, зокрема віддалені імпорти `use`. Запити верхнього рівня `/prose run https://...` є явними, але транзитивні віддалені імпорти потребують підтвердження для кожного запуску, перш ніж їх буде завантажено або виконано. Використовуйте списки дозволених інструментів OpenClaw і шлюзи підтвердження для контролю побічних ефектів. Для детермінованих робочих процесів із підтвердженням порівняйте з [Lobster](/uk/tools/lobster).

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Довідник Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Як завантажується пакет Skills OpenProse і які обмеження застосовуються.
  </Card>
  <Card title="Підагенті" href="/uk/tools/subagents" icon="users">
    Власний рівень багатоагентної координації OpenClaw.
  </Card>
  <Card title="Синтез мовлення" href="/uk/tools/tts" icon="volume-high">
    Додайте аудіовихід до своїх робочих процесів.
  </Card>
  <Card title="Команди з косою рискою" href="/uk/tools/slash-commands" icon="terminal">
    Усі доступні команди чату, зокрема /prose.
  </Card>
</CardGroup>

Офіційний сайт: [https://www.prose.md](https://www.prose.md)
