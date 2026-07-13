---
read_when:
    - Вы хотите запускать или создавать файлы рабочих процессов .prose
    - Вы хотите включить плагин OpenProse
    - Вам нужно понять, как OpenProse сопоставляется с примитивами OpenClaw
sidebarTitle: OpenProse
summary: OpenProse — это формат рабочих процессов для многоагентных сеансов ИИ, в котором основным форматом служит Markdown. В OpenClaw он поставляется как плагин со слеш-командой /prose и набором Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-13T20:11:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse — это переносимый формат рабочих процессов, ориентированный прежде всего на Markdown, для оркестрации сеансов ИИ. В OpenClaw он поставляется как плагин, устанавливающий пакет Skills OpenProse и слеш-команду `/prose`. Программы хранятся в файлах `.prose` и могут запускать несколько субагентов с явно заданным потоком управления.

<CardGroup cols={3}>
  <Card title="Установка" icon="download" href="#install">
    Включите плагин OpenProse и перезапустите Gateway.
  </Card>
  <Card title="Запуск программы" icon="play" href="#slash-command">
    Используйте `/prose run`, чтобы выполнить файл `.prose` или удалённую программу.
  </Card>
  <Card title="Написание программ" icon="pencil" href="#example-parallel-research-and-synthesis">
    Создавайте многоагентные рабочие процессы с параллельными и последовательными этапами.
  </Card>
</CardGroup>

## Установка

<Steps>
  <Step title="Включите плагин">
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
  <Step title="Проверьте установку">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` должен отображаться как включённый. Теперь в чате доступна команда Skills `/prose`.

  </Step>
</Steps>

При работе с клоном репозитория плагин можно установить напрямую:
`openclaw plugins install ./extensions/open-prose`

## Слеш-команда

OpenProse регистрирует `/prose` как команду Skills, которую может вызывать пользователь:

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
Прямые URL загружаются без изменений с помощью инструмента `web_fetch`.

Удалённые запуски верхнего уровня задаются явно. Удалённые импорты внутри программы `.prose` являются транзитивными зависимостями кода: прежде чем OpenProse загрузит какую-либо удалённую цель `use`, он показывает разрешённый список импортов и требует, чтобы оператор для этого запуска ответил в точности `approve remote prose imports`.

## Возможности

- Многоагентное исследование и обобщение с явно заданным параллелизмом.
- Воспроизводимые рабочие процессы с безопасным подтверждением действий (проверка кода, разбор инцидентов, конвейеры обработки содержимого).
- Многократно используемые программы `.prose`, которые можно запускать в поддерживаемых средах выполнения агентов.

## Пример: параллельное исследование и обобщение

```prose
# Исследование и обобщение с двумя агентами, работающими параллельно.

input topic: "Что нам следует исследовать?"

agent researcher:
  model: sonnet
  prompt: "Вы проводите тщательное исследование и указываете источники."

agent writer:
  model: opus
  prompt: "Вы пишете краткое резюме."

parallel:
  findings = session: researcher
    prompt: "Исследуйте {topic}."
  draft = session: writer
    prompt: "Кратко изложите {topic}."

session "Объедините результаты исследования и черновик в окончательный ответ."
  context: { findings, draft }
```

## Сопоставление со средой выполнения OpenClaw

Программы OpenProse сопоставляются с примитивами OpenClaw:

| Концепция OpenProse        | Инструмент OpenClaw                              |
| ------------------------- | ----------------------------------------------- |
| Запуск сеанса / инструмент Task | `sessions_spawn`                                |
| Чтение / запись файла     | `read` / `write`                                |
| Веб-запрос                | `web_fetch` (`exec` + curl, когда требуется POST) |

<Warning>
  Если ваш список разрешённых инструментов блокирует `sessions_spawn`, `read`, `write` или `web_fetch`, программы OpenProse завершатся с ошибкой. Проверьте
  [конфигурацию списка разрешённых инструментов](/ru/gateway/config-tools).
</Warning>

## Расположение файлов

OpenProse хранит состояние в `.prose/` вашей рабочей области:

```text
.prose/
├── .env                      # конфигурация (ключ=значение), например OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # копия выполняемой программы
│       ├── state.md          # состояние выполнения
│       ├── bindings/
│       ├── imports/          # вложенные запуски удалённых программ
│       └── agents/
└── agents/                   # постоянные агенты в области проекта
```

Постоянные агенты пользовательского уровня, общие для разных проектов, находятся по адресу:

```text
~/.prose/agents/
```

## Бэкенды состояния

<AccordionGroup>
  <Accordion title="filesystem (по умолчанию)">
    Состояние записывается в `.prose/runs/...` рабочей области. Дополнительные зависимости не требуются.
  </Accordion>
  <Accordion title="in-context">
    Временное состояние хранится в окне контекста; выберите этот бэкенд с помощью `--in-context`.
    Подходит для небольших краткоживущих программ.
  </Accordion>
  <Accordion title="sqlite (экспериментальный)">
    Выберите с помощью `--state=sqlite`. Требуется исполняемый файл `sqlite3` в `PATH`
    (если он отсутствует, используется filesystem); состояние сохраняется в
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (экспериментальный)">
    Выберите с помощью `--state=postgres`. Требуются `psql` и строка подключения в
    `OPENPROSE_POSTGRES_URL` (задайте её в `.prose/.env`).

    <Warning>
      Учётные данные Postgres попадают в журналы субагентов. Используйте отдельную базу данных с минимальными привилегиями.
    </Warning>

  </Accordion>
</AccordionGroup>

## Безопасность

Рассматривайте файлы `.prose` как код. Проверяйте их перед запуском, включая удалённые импорты `use`. Запросы `/prose run https://...` верхнего уровня задаются явно, но для транзитивных удалённых импортов перед их загрузкой или выполнением требуется подтверждение при каждом запуске. Используйте списки разрешённых инструментов OpenClaw и этапы подтверждения для управления побочными эффектами. Для детерминированных рабочих процессов с подтверждением действий сравните с
[Lobster](/ru/tools/lobster).

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Справочник по Skills" href="/ru/tools/skills" icon="puzzle-piece">
    Как загружается пакет Skills OpenProse и какие ограничения применяются.
  </Card>
  <Card title="Субагенты" href="/ru/tools/subagents" icon="users">
    Встроенный уровень многоагентной координации OpenClaw.
  </Card>
  <Card title="Преобразование текста в речь" href="/ru/tools/tts" icon="volume-high">
    Добавьте аудиовывод в свои рабочие процессы.
  </Card>
  <Card title="Слеш-команды" href="/ru/tools/slash-commands" icon="terminal">
    Все доступные команды чата, включая /prose.
  </Card>
</CardGroup>

Официальный сайт: [https://www.prose.md](https://www.prose.md)
