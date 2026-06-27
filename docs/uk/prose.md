---
read_when:
    - Ви хочете запускати або писати файли робочих процесів .prose
    - Ви хочете ввімкнути Plugin OpenProse
    - Вам потрібно зрозуміти, як OpenProse зіставляється з примітивами OpenClaw
sidebarTitle: OpenProse
summary: OpenProse — це орієнтований на Markdown формат робочих процесів для багатоагентних AI-сесій. В OpenClaw він постачається як plugin із slash-командою /prose та пакетом Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:08:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse — це переносний, орієнтований на Markdown формат робочих процесів для оркестрації сеансів ШІ. В OpenClaw він постачається як plugin, що встановлює пакет Skills OpenProse і slash-команду `/prose`. Програми зберігаються у файлах `.prose` і можуть запускати кілька субагентів із явним керуванням потоком виконання.

<CardGroup cols={3}>
  <Card title="Установлення" icon="download" href="#install">
    Увімкніть plugin OpenProse і перезапустіть Gateway.
  </Card>
  <Card title="Запустити програму" icon="play" href="#slash-command">
    Використовуйте `/prose run`, щоб виконати файл `.prose` або віддалену програму.
  </Card>
  <Card title="Написання програм" icon="pencil" href="#example">
    Створюйте багатоагентні робочі процеси з паралельними та послідовними кроками.
  </Card>
</CardGroup>

## Установлення

<Steps>
  <Step title="Увімкніть plugin">
    Вбудовані plugins за замовчуванням вимкнені. Увімкніть OpenProse:

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

    Ви маєте побачити, що `open-prose` увімкнено. Команда Skills `/prose` тепер доступна в чаті.

  </Step>
</Steps>

Для локальної копії: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Slash-команда

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

`/prose run <handle/slug>` розпізнається як `https://p.prose.md/<handle>/<slug>`. Прямі URL отримуються без змін за допомогою інструмента `web_fetch`.

Верхньорівневі віддалені запуски є явними. Віддалені імпорти всередині програми `.prose` є транзитивними залежностями коду: перш ніж OpenProse отримає будь-яку віддалену ціль `use`, він показує розпізнаний список імпортів і вимагає, щоб оператор для цього запуску відповів точно `approve remote prose imports`.

## Що він може робити

- Багатоагентне дослідження та синтез із явним паралелізмом.
- Повторювані робочі процеси, безпечні щодо схвалень (перевірка коду, тріаж інцидентів, конвеєри контенту).
- Повторно використовувані програми `.prose`, які можна запускати в підтримуваних агентних runtime.

## Приклад: паралельне дослідження та синтез

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

## Зіставлення runtime OpenClaw

Програми OpenProse зіставляються з примітивами OpenClaw:

| Концепція OpenProse       | Інструмент OpenClaw |
| ------------------------- | ------------------- |
| Запуск сеансу / інструмент Task | `sessions_spawn` |
| Читання / запис файлів    | `read` / `write`    |
| Отримання з вебу          | `web_fetch`         |

<Warning>
  Якщо ваш список дозволених інструментів блокує `sessions_spawn`, `read`, `write` або
  `web_fetch`, програми OpenProse завершуватимуться з помилкою. Перевірте вашу
  [конфігурацію списку дозволених інструментів](/uk/gateway/config-tools).
</Warning>

## Розташування файлів

OpenProse зберігає стан у `.prose/` у вашому робочому просторі:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Постійні агенти рівня користувача розміщуються тут:

```text
~/.prose/agents/
```

## Бекенди стану

<AccordionGroup>
  <Accordion title="файлова система (за замовчуванням)">
    Стан записується до `.prose/runs/...` у робочому просторі. Додаткові залежності не потрібні.
  </Accordion>
  <Accordion title="у контексті">
    Тимчасовий стан зберігається у вікні контексту. Підходить для малих, короткотривалих програм.
  </Accordion>
  <Accordion title="sqlite (експериментально)">
    Потрібен бінарний файл `sqlite3` у `PATH`.
  </Accordion>
  <Accordion title="postgres (експериментально)">
    Потрібні `psql` і рядок підключення.

    <Warning>
      Облікові дані Postgres потрапляють до журналів субагентів. Використовуйте окрему базу даних із мінімальними привілеями.
    </Warning>

  </Accordion>
</AccordionGroup>

## Безпека

Ставтеся до файлів `.prose` як до коду. Перевіряйте їх перед запуском, включно з віддаленими імпортами `use`. Верхньорівневі запити `/prose run https://...` є явними, але транзитивні віддалені імпорти потребують схвалення для кожного запуску, перш ніж їх буде отримано або виконано. Використовуйте списки дозволених інструментів OpenClaw і шлюзи схвалення, щоб контролювати побічні ефекти. Для детермінованих робочих процесів із керуванням схваленнями порівняйте з [Lobster](/uk/tools/lobster).

## Пов’язане

<CardGroup cols={2}>
  <Card title="Довідник Skills" href="/uk/tools/skills" icon="puzzle-piece">
    Як завантажується пакет Skills OpenProse і які шлюзи застосовуються.
  </Card>
  <Card title="Субагенти" href="/uk/tools/subagents" icon="users">
    Власний шар багатоагентної координації OpenClaw.
  </Card>
  <Card title="Перетворення тексту на мовлення" href="/uk/tools/tts" icon="volume-high">
    Додайте аудіовихід до своїх робочих процесів.
  </Card>
  <Card title="Slash-команди" href="/uk/tools/slash-commands" icon="terminal">
    Усі доступні команди чату, включно з /prose.
  </Card>
</CardGroup>

Офіційний сайт: [https://www.prose.md](https://www.prose.md)
