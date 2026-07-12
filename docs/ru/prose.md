---
read_when:
    - Вы хотите запускать или создавать файлы рабочих процессов .prose
    - Вы хотите включить плагин OpenProse
    - Вам нужно понять, как OpenProse сопоставляется с примитивами OpenClaw
sidebarTitle: OpenProse
summary: OpenProse — это ориентированный на Markdown формат рабочих процессов для многоагентных сеансов ИИ. В OpenClaw он поставляется как плагин с командой `/prose` и набором Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T11:45:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse — это переносимый формат рабочих процессов, ориентированный на Markdown и предназначенный для оркестрации сеансов ИИ. В OpenClaw он поставляется как Plugin, устанавливающий пакет Skills OpenProse и слеш-команду `/prose`. Программы хранятся в файлах `.prose` и могут запускать несколько субагентов с явно заданным потоком управления.

<CardGroup cols={3}>
  <Card title="Установка" icon="download" href="#install">
    Включите Plugin OpenProse и перезапустите Gateway.
  </Card>
  <Card title="Запуск программы" icon="play" href="#slash-command">
    Используйте `/prose run`, чтобы выполнить файл `.prose` или удалённую программу.
  </Card>
  <Card title="Создание программ" icon="pencil" href="#example-parallel-research-and-synthesis">
    Создавайте многоагентные рабочие процессы с параллельными и последовательными шагами.
  </Card>
</CardGroup>

## Установка

<Steps>
  <Step title="Включите Plugin">
    OpenProse входит в комплект поставки, но по умолчанию отключён. Включите его:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Перезапустите Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Проверьте">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` должен отображаться как включённый. Теперь команда Skills `/prose`
    доступна в чате.

  </Step>
</Steps>

Из рабочей копии репозитория Plugin можно установить напрямую:
`openclaw plugins install ./extensions/open-prose`

## Слеш-команда

OpenProse регистрирует `/prose` как пользовательскую команду Skills:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` преобразуется в `https://p.prose.md/<handle>/<slug>`.
Прямые URL загружаются без изменений с помощью инструмента `web_fetch`.

Удалённые запуски верхнего уровня задаются явно. Удалённые импорты внутри программы `.prose` являются транзитивными зависимостями кода: прежде чем OpenProse загрузит любую удалённую цель `use`, он показывает список разрешённых импортов и требует, чтобы оператор для этого запуска ответил в точности `approve remote prose imports`.

## Возможности

- Многоагентное исследование и обобщение с явно заданным параллелизмом.
- Воспроизводимые рабочие процессы с безопасным подтверждением действий (проверка кода, разбор инцидентов, конвейеры контента).
- Повторно используемые программы `.prose`, которые можно запускать в поддерживаемых средах выполнения агентов.

## Пример: параллельное исследование и обобщение

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

## Сопоставление со средой выполнения OpenClaw

Программы OpenProse сопоставляются с примитивами OpenClaw:

| Концепция OpenProse       | Инструмент OpenClaw                              |
| ------------------------- | ----------------------------------------------- |
| Создание сеанса / инструмент задач | `sessions_spawn`                         |
| Чтение / запись файлов    | `read` / `write`                                |
| Веб-загрузка              | `web_fetch` (`exec` + curl, когда требуется POST) |

<Warning>
  Если ваш список разрешённых инструментов блокирует `sessions_spawn`, `read`, `write` или
  `web_fetch`, программы OpenProse завершатся с ошибкой. Проверьте
  [конфигурацию списка разрешённых инструментов](/ru/gateway/config-tools).
</Warning>

## Расположение файлов

OpenProse хранит состояние в каталоге `.prose/` вашей рабочей области:

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

Постоянные агенты уровня пользователя, общие для разных проектов, хранятся по адресу:

```text
~/.prose/agents/
```

## Хранилища состояния

<AccordionGroup>
  <Accordion title="файловая система (по умолчанию)">
    Состояние записывается в `.prose/runs/...` в рабочей области. Дополнительные
    зависимости не требуются.
  </Accordion>
  <Accordion title="в контексте">
    Временное состояние хранится в окне контекста; выберите этот вариант с помощью `--in-context`.
    Подходит для небольших кратковременных программ.
  </Accordion>
  <Accordion title="sqlite (экспериментально)">
    Выберите с помощью `--state=sqlite`. Требуется исполняемый файл `sqlite3` в `PATH`
    (при его отсутствии используется файловая система); состояние сохраняется в
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (экспериментально)">
    Выберите с помощью `--state=postgres`. Требуются `psql` и строка подключения в
    `OPENPROSE_POSTGRES_URL` (задайте её в `.prose/.env`).

    <Warning>
      Учётные данные Postgres попадают в журналы субагентов. Используйте отдельную
      базу данных с минимальными привилегиями.
    </Warning>

  </Accordion>
</AccordionGroup>

## Безопасность

Относитесь к файлам `.prose` как к коду. Проверяйте их перед запуском, включая удалённые импорты `use`. Запросы верхнего уровня `/prose run https://...` задаются явно, однако транзитивные удалённые импорты требуют подтверждения для каждого запуска до их загрузки или выполнения. Используйте списки разрешённых инструментов OpenClaw и шлюзы подтверждения, чтобы контролировать побочные эффекты. Для детерминированных рабочих процессов с подтверждением действий сравните с [Lobster](/ru/tools/lobster).

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Справочник по Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Как загружается пакет Skills OpenProse и какие ограничения применяются.
  </Card>
  <Card title="Субагенты" href="/ru/tools/subagents" icon="users">
    Встроенный уровень координации нескольких агентов в OpenClaw.
  </Card>
  <Card title="Преобразование текста в речь" href="/ru/tools/tts" icon="volume-high">
    Добавьте аудиовывод в свои рабочие процессы.
  </Card>
  <Card title="Слеш-команды" href="/ru/tools/slash-commands" icon="terminal">
    Все доступные команды чата, включая /prose.
  </Card>
</CardGroup>

Официальный сайт: [https://www.prose.md](https://www.prose.md)
