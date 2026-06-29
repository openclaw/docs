---
read_when:
    - Вы хотите запускать или писать файлы рабочих процессов .prose
    - Вы хотите включить Plugin OpenProse
    - Вам нужно понять, как OpenProse сопоставляется с примитивами OpenClaw
sidebarTitle: OpenProse
summary: OpenProse — это ориентированный прежде всего на Markdown формат рабочего процесса для многоагентных ИИ-сеансов. В OpenClaw он поставляется как Plugin со слеш-командой /prose и пакетом Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-06-28T23:34:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse — это переносимый, ориентированный на Markdown формат рабочих процессов для оркестрации AI-сеансов. В OpenClaw он поставляется как плагин, который устанавливает набор Skills OpenProse и слеш-команду `/prose`. Программы находятся в файлах `.prose` и могут запускать несколько субагентов с явным потоком управления.

<CardGroup cols={3}>
  <Card title="Установка" icon="download" href="#install">
    Включите плагин OpenProse и перезапустите Gateway.
  </Card>
  <Card title="Запуск программы" icon="play" href="#slash-command">
    Используйте `/prose run`, чтобы выполнить файл `.prose` или удаленную программу.
  </Card>
  <Card title="Написание программ" icon="pencil" href="#example">
    Создавайте многоагентные рабочие процессы с параллельными и последовательными шагами.
  </Card>
</CardGroup>

## Установка

<Steps>
  <Step title="Включите плагин">
    Встроенные плагины по умолчанию отключены. Включите OpenProse:

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

    Вы должны увидеть `open-prose` в статусе включенного. Команда Skills `/prose` теперь
    доступна в чате.

  </Step>
</Steps>

Для локального checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Слеш-команда

OpenProse регистрирует `/prose` как вызываемую пользователем команду Skills:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` разрешается в `https://p.prose.md/<handle>/<slug>`.
Прямые URL загружаются как есть с помощью инструмента `web_fetch`.

Удаленные запуски верхнего уровня выполняются явно. Удаленные импорты внутри программы `.prose` являются
транзитивными зависимостями кода: прежде чем OpenProse загрузит любую удаленную цель `use`,
он показывает разрешенный список импортов и требует, чтобы оператор ответил точно
`approve remote prose imports` для этого запуска.

## Что он может делать

- Многоагентные исследования и синтез с явным параллелизмом.
- Повторяемые рабочие процессы с безопасными подтверждениями (ревью кода, триаж инцидентов, контентные конвейеры).
- Переиспользуемые программы `.prose`, которые можно запускать в поддерживаемых средах выполнения агентов.

## Пример: параллельное исследование и синтез

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

| Концепция OpenProse       | Инструмент OpenClaw |
| ------------------------- | ------------------- |
| Spawn session / Task tool | `sessions_spawn`    |
| File read / write         | `read` / `write`    |
| Web fetch                 | `web_fetch`         |

<Warning>
  Если allowlist инструментов блокирует `sessions_spawn`, `read`, `write` или
  `web_fetch`, программы OpenProse завершатся ошибкой. Проверьте вашу
  [конфигурацию allowlist инструментов](/ru/gateway/config-tools).
</Warning>

## Расположения файлов

OpenProse хранит состояние в `.prose/` в вашем workspace:

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

Постоянные агенты уровня пользователя находятся в:

```text
~/.prose/agents/
```

## Бэкенды состояния

<AccordionGroup>
  <Accordion title="файловая система (по умолчанию)">
    Состояние записывается в `.prose/runs/...` в workspace. Дополнительные
    зависимости не требуются.
  </Accordion>
  <Accordion title="в контексте">
    Временное состояние хранится в окне контекста. Подходит для небольших, короткоживущих
    программ.
  </Accordion>
  <Accordion title="sqlite (экспериментально)">
    Требуется бинарный файл `sqlite3` в `PATH`.
  </Accordion>
  <Accordion title="postgres (экспериментально)">
    Требуются `psql` и строка подключения.

    <Warning>
      Учетные данные Postgres попадают в журналы субагентов. Используйте выделенную
      базу данных с минимально необходимыми привилегиями.
    </Warning>

  </Accordion>
</AccordionGroup>

## Безопасность

Относитесь к файлам `.prose` как к коду. Проверяйте их перед запуском, включая удаленные
импорты `use`. Запросы верхнего уровня `/prose run https://...` выполняются явно, но
транзитивные удаленные импорты требуют подтверждения для каждого запуска перед загрузкой или
выполнением. Используйте allowlist инструментов OpenClaw и шлюзы подтверждения для контроля
побочных эффектов. Для детерминированных рабочих процессов с подтверждениями сравните с
[Lobster](/ru/tools/lobster).

## См. также

<CardGroup cols={2}>
  <Card title="Справочник Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Как загружается набор Skills OpenProse и какие шлюзы применяются.
  </Card>
  <Card title="Субагенты" href="/ru/tools/subagents" icon="users">
    Нативный слой многоагентной координации OpenClaw.
  </Card>
  <Card title="Преобразование текста в речь" href="/ru/tools/tts" icon="volume-high">
    Добавьте аудиовывод в свои рабочие процессы.
  </Card>
  <Card title="Слеш-команды" href="/ru/tools/slash-commands" icon="terminal">
    Все доступные команды чата, включая /prose.
  </Card>
</CardGroup>

Официальный сайт: [https://www.prose.md](https://www.prose.md)
