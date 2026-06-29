---
read_when:
    - Настройка частоты Heartbeat или сообщений
    - Выбор между Heartbeat и Cron для запланированных задач
sidebarTitle: Heartbeat
summary: Сообщения опроса Heartbeat и правила уведомлений
title: Heartbeat
x-i18n:
    generated_at: "2026-06-28T22:57:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat или cron?** См. [Automation](/ru/automation), чтобы понять, когда использовать каждый вариант.
</Note>

Heartbeat запускает **периодические ходы агента** в основной сессии, чтобы модель могла показать все, что требует внимания, не засыпая вас сообщениями.

Heartbeat — это запланированный ход основной сессии, он **не** создает записи [фоновой задачи](/ru/automation/tasks). Записи задач предназначены для отделенной работы (запуски ACP, субагенты, изолированные задания cron).

Устранение неполадок: [Запланированные задачи](/ru/automation/cron-jobs#troubleshooting)

## Быстрый старт (для начинающих)

<Steps>
  <Step title="Выберите интервал">
    Оставьте heartbeats включенными (по умолчанию `30m`, или `1h` для Anthropic OAuth/аутентификации по токену, включая повторное использование Claude CLI) либо задайте собственный интервал.
  </Step>
  <Step title="Добавьте HEARTBEAT.md (необязательно)">
    Создайте короткий контрольный список `HEARTBEAT.md` или блок `tasks:` в рабочей области агента.
  </Step>
  <Step title="Решите, куда должны отправляться сообщения heartbeat">
    `target: "none"` используется по умолчанию; задайте `target: "last"`, чтобы направлять их последнему контакту.
  </Step>
  <Step title="Необязательная настройка">
    - Включите доставку рассуждений heartbeat для прозрачности.
    - Используйте облегченный начальный контекст, если запускам heartbeat нужен только `HEARTBEAT.md`.
    - Включите изолированные сессии, чтобы не отправлять полную историю разговора при каждом heartbeat.
    - Ограничьте heartbeats активными часами (локальное время).

  </Step>
</Steps>

Пример конфигурации:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Значения по умолчанию

- Интервал: `30m` (или `1h`, когда обнаруженным режимом аутентификации является Anthropic OAuth/аутентификация по токену, включая повторное использование Claude CLI). Задайте `agents.defaults.heartbeat.every` или `agents.list[].heartbeat.every` для отдельного агента; используйте `0m`, чтобы отключить.
- Тело промпта (настраивается через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Тайм-аут: ходы heartbeat без явного значения используют `agents.defaults.timeoutSeconds`, если он задан. Иначе они используют интервал heartbeat с ограничением в 600 секунд. Задайте `agents.defaults.heartbeat.timeoutSeconds` или `agents.list[].heartbeat.timeoutSeconds` для отдельного агента, если heartbeat должен выполняться дольше.
- Промпт heartbeat отправляется **дословно** как сообщение пользователя. Системный промпт включает раздел "Heartbeat" только когда heartbeats включены для агента по умолчанию, а запуск помечается внутренне.
- Когда heartbeats отключены с помощью `0m`, обычные запуски также исключают `HEARTBEAT.md` из начального контекста, чтобы модель не видела инструкции, предназначенные только для heartbeat.
- Активные часы (`heartbeat.activeHours`) проверяются в настроенном часовом поясе. За пределами окна heartbeats пропускаются до следующего тика внутри окна.
- Heartbeats автоматически откладываются, пока работа cron активна или стоит в очереди. Задайте `heartbeat.skipWhenBusy: true`, чтобы также откладывать агента при наличии его собственных субагентов с ключом сессии или вложенных командных линий; соседние агенты больше не приостанавливаются только потому, что у другого агента выполняется работа субагента.

## Для чего нужен промпт heartbeat

Промпт по умолчанию намеренно широкий:

- **Фоновые задачи**: "Consider outstanding tasks" побуждает агента просмотреть последующие действия (входящие, календарь, напоминания, работу в очереди) и показать все срочное.
- **Проверка человека**: "Checkup sometimes on your human during day time" побуждает иногда отправлять легкое сообщение "что-нибудь нужно?", но избегает ночного спама благодаря вашему настроенному локальному часовому поясу (см. [Часовой пояс](/ru/concepts/timezone)).

Heartbeat может реагировать на завершенные [фоновые задачи](/ru/automation/tasks), но сам запуск heartbeat не создает запись задачи.

Если вы хотите, чтобы heartbeat выполнял что-то очень конкретное (например, "check Gmail PubSub stats" или "verify gateway health"), задайте `agents.defaults.heartbeat.prompt` (или `agents.list[].heartbeat.prompt`) с пользовательским телом (отправляется дословно).

## Контракт ответа

- Если ничего не требует внимания, ответьте **`HEARTBEAT_OK`**.
- Запуски heartbeat с доступом к инструментам могут вместо этого вызвать `heartbeat_respond` с `notify: false`, чтобы не показывать обновление, или `notify: true` плюс `notificationText` для оповещения. Если структурированный ответ инструмента присутствует, он имеет приоритет над текстовым запасным вариантом.
- Во время запусков heartbeat OpenClaw воспринимает `HEARTBEAT_OK` как подтверждение, когда он находится в **начале или конце** ответа. Токен удаляется, а ответ отбрасывается, если оставшееся содержимое имеет размер **≤ `ackMaxChars`** (по умолчанию 300).
- Если `HEARTBEAT_OK` находится в **середине** ответа, он не обрабатывается особым образом.
- Для оповещений **не** включайте `HEARTBEAT_OK`; возвращайте только текст оповещения.

Вне heartbeats случайный `HEARTBEAT_OK` в начале/конце сообщения удаляется и журналируется; сообщение, состоящее только из `HEARTBEAT_OK`, отбрасывается.

## Конфигурация

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Область действия и приоритет

- `agents.defaults.heartbeat` задает глобальное поведение Heartbeat.
- `agents.list[].heartbeat` объединяется поверх; если у какого-либо агента есть блок `heartbeat`, Heartbeat выполняют **только эти агенты**.
- `channels.defaults.heartbeat` задает параметры видимости по умолчанию для всех каналов.
- `channels.<channel>.heartbeat` переопределяет параметры канала по умолчанию.
- `channels.<channel>.accounts.<id>.heartbeat` (каналы с несколькими аккаунтами) переопределяет настройки для каждого канала.

### Heartbeat для отдельных агентов

Если какая-либо запись `agents.list[]` включает блок `heartbeat`, Heartbeat выполняют **только эти агенты**. Блок отдельного агента объединяется поверх `agents.defaults.heartbeat` (поэтому можно один раз задать общие значения по умолчанию и переопределять их для каждого агента).

Пример: два агента, Heartbeat выполняет только второй агент.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Пример активных часов

Ограничьте Heartbeat рабочими часами в определенном часовом поясе:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Вне этого окна (до 9:00 или после 22:00 по восточному времени) Heartbeat пропускается. Следующий запланированный тик внутри окна выполнится как обычно.

### Настройка 24/7

Если нужно, чтобы Heartbeat выполнялся весь день, используйте один из этих вариантов:

- Полностью опустите `activeHours` (без ограничения временным окном; это поведение по умолчанию).
- Задайте окно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте одинаковое время `start` и `end` (например, с `08:00` до `08:00`). Это считается окном нулевой ширины, поэтому Heartbeat всегда пропускается.
</Warning>

### Пример с несколькими аккаунтами

Используйте `accountId`, чтобы выбрать конкретный аккаунт в каналах с несколькими аккаунтами, таких как Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Примечания к полям

<ParamField path="every" type="string">
  Интервал Heartbeat (строка длительности; единица по умолчанию = минуты).
</ParamField>
<ParamField path="model" type="string">
  Необязательное переопределение модели для запусков Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Если включено, также доставляет отдельное сообщение `Thinking`, когда оно доступно (та же форма, что и у `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Если true, запуски Heartbeat используют облегченный начальный контекст и сохраняют только `HEARTBEAT.md` из файлов начальной загрузки рабочей области.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Если true, каждый Heartbeat выполняется в новом сеансе без предыдущей истории разговора. Использует тот же шаблон изоляции, что и cron `sessionTarget: "isolated"`. Значительно снижает стоимость токенов для каждого Heartbeat. Сочетайте с `lightContext: true` для максимальной экономии. Маршрутизация доставки по-прежнему использует контекст основного сеанса.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Если true, запуски Heartbeat откладываются на дополнительных занятых линиях этого агента: его собственном подагенте с ключом сеанса или вложенной командной работе. Линии Cron всегда откладывают Heartbeat даже без этого флага, поэтому хосты с локальными моделями не запускают подсказки Cron и Heartbeat одновременно.
</ParamField>
<ParamField path="session" type="string">
  Необязательный ключ сеанса для запусков Heartbeat.

- `main` (по умолчанию): основной сеанс агента.
- Явный ключ сеанса (скопируйте из `openclaw sessions --json` или из [CLI сеансов](/ru/cli/sessions)).
- Форматы ключей сеансов: см. [Сеансы](/ru/concepts/session) и [Группы](/ru/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставить в последний использованный внешний канал.
- явный канал: любой настроенный канал или id Plugin, например `discord`, `matrix`, `telegram` или `whatsapp`.
- `none` (по умолчанию): выполнить Heartbeat, но **не доставлять** наружу.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Управляет поведением доставки напрямую/в личные сообщения. `allow`: разрешить доставку Heartbeat напрямую/в личные сообщения. `block`: подавить доставку напрямую/в личные сообщения (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необязательное переопределение получателя (id, зависящий от канала, например E.164 для WhatsApp или id чата Telegram). Для тем/веток Telegram используйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необязательный идентификатор учетной записи для каналов с несколькими учетными записями. Когда `target: "last"`, идентификатор учетной записи применяется к определенному последнему каналу, если он поддерживает учетные записи; иначе он игнорируется. Если идентификатор учетной записи не соответствует настроенной учетной записи для определенного канала, доставка пропускается.

</ParamField>
<ParamField path="prompt" type="string">
  Переопределяет тело промпта по умолчанию (не объединяется).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальное число символов, допустимое после `HEARTBEAT_OK` перед доставкой.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Если true, подавляет предупреждающие payload-данные об ошибках инструментов во время запусков Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Максимальное число секунд, допустимое для хода агента Heartbeat до его прерывания. Оставьте неустановленным, чтобы использовать `agents.defaults.timeoutSeconds`, если он задан; иначе будет использоваться частота Heartbeat, ограниченная 600 секундами.

</ParamField>
<ParamField path="activeHours" type="object">
  Ограничивает запуски Heartbeat временным окном. Объект с `start` (HH:MM, включительно; используйте `00:00` для начала дня), `end` (HH:MM, не включительно; `24:00` разрешено для конца дня) и необязательным `timezone`.

- Пропущено или `"user"`: использует ваш `agents.defaults.userTimezone`, если он задан, иначе откатывается к часовому поясу системы хоста.
- `"local"`: всегда использует часовой пояс системы хоста.
- Любой идентификатор IANA (например, `America/New_York`): используется напрямую; если он недействителен, откатывается к поведению `"user"`, описанному выше.
- `start` и `end` не должны быть равны для активного окна; равные значения считаются окном нулевой ширины (всегда вне окна).
- Вне активного окна Heartbeat пропускается до следующего тика внутри окна.

</ParamField>

## Поведение доставки

<AccordionGroup>
  <Accordion title="Маршрутизация сеанса и цели">
    - Heartbeat по умолчанию запускается в основном сеансе агента (`agent:<id>:<mainKey>`) или в `global`, когда `session.scope = "global"`. Задайте `session`, чтобы переопределить его конкретным сеансом канала (Discord/WhatsApp/и т. д.).
    - `session` влияет только на контекст запуска; доставка управляется через `target` и `to`.
    - Чтобы доставить в конкретный канал/получателю, задайте `target` + `to`. При `target: "last"` доставка использует последний внешний канал для этого сеанса.
    - Доставки Heartbeat по умолчанию разрешают прямые/DM-цели. Задайте `directPolicy: "block"`, чтобы подавить отправки прямым целям, при этом все равно выполняя ход Heartbeat.
    - Если основная очередь, полоса целевого сеанса, полоса cron или активная задача cron заняты, Heartbeat пропускается и повторяется позже.
    - Если `skipWhenBusy: true`, привязанный к ключу сеанса субагент этого агента и вложенные полосы также откладывают запуски Heartbeat. Занятые полосы других агентов не откладывают этого агента.
    - Если `target` не разрешается во внешнее назначение, запуск все равно происходит, но исходящее сообщение не отправляется.

  </Accordion>
  <Accordion title="Видимость и поведение пропуска">
    - Если `showOk`, `showAlerts` и `useIndicator` все отключены, запуск заранее пропускается как `reason=alerts-disabled`.
    - Если отключена только доставка оповещений, OpenClaw все равно может запустить Heartbeat, обновить временные метки задач с наступившим сроком, восстановить временную метку простоя сеанса и подавить внешний payload оповещения.
    - Если определенная цель Heartbeat поддерживает индикацию набора текста, OpenClaw показывает набор текста, пока запуск Heartbeat активен. Используется та же цель, в которую Heartbeat отправил бы вывод чата, и это отключается через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Жизненный цикл сеанса и аудит">
    - Ответы только от Heartbeat **не** поддерживают сеанс активным. Метаданные Heartbeat могут обновлять строку сеанса, но истечение по простою использует `lastInteractionAt` из последнего реального сообщения пользователя/канала, а ежедневное истечение использует `sessionStartedAt`.
    - История Control UI и WebChat скрывает промпты Heartbeat и подтверждения только с OK. Базовая расшифровка сеанса все равно может содержать эти ходы для аудита/повтора.
    - Отсоединенные [фоновые задачи](/ru/automation/tasks) могут поставить системное событие в очередь и разбудить Heartbeat, когда основной сеанс должен быстро что-то заметить. Такое пробуждение не делает запуск Heartbeat фоновой задачей.

  </Accordion>
</AccordionGroup>

## Элементы управления видимостью

По умолчанию подтверждения `HEARTBEAT_OK` подавляются, а содержимое оповещений доставляется. Это можно настроить для каждого канала или каждой учетной записи:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Приоритет: для учетной записи → для канала → значения по умолчанию канала → встроенные значения по умолчанию.

### Что делает каждый флаг

- `showOk`: отправляет подтверждение `HEARTBEAT_OK`, когда модель возвращает ответ только с OK.
- `showAlerts`: отправляет содержимое оповещения, когда модель возвращает ответ не с OK.
- `useIndicator`: создает события индикатора для поверхностей статуса UI.

Если **все три** равны false, OpenClaw полностью пропускает запуск Heartbeat (без вызова модели).

### Примеры для канала и для учетной записи

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Распространенные шаблоны

| Цель                                     | Конфигурация                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Поведение по умолчанию (OK без сообщений, оповещения включены) | _(конфигурация не требуется)_                                                            |
| Полностью безмолвно (без сообщений, без индикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Только индикатор (без сообщений)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK только в одном канале                 | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необязательно)

Если в рабочей области существует файл `HEARTBEAT.md`, промпт по умолчанию говорит агенту прочитать его. Думайте о нем как о своем «чеклисте Heartbeat»: небольшом, стабильном и безопасном для учета каждые 30 минут.

При обычных запусках `HEARTBEAT.md` внедряется только когда руководство Heartbeat включено для агента по умолчанию. Отключение частоты Heartbeat через `0m` или установка `includeSystemPromptSection: false` исключает его из обычного bootstrap-контекста.

В нативном harness Codex содержимое `HEARTBEAT.md` не внедряется в ход. Если файл существует и содержит не только пробельные символы, инструкции режима совместной работы Heartbeat указывают Codex на файл и говорят прочитать его перед продолжением.

Если `HEARTBEAT.md` существует, но фактически пуст (только пустые строки, комментарии Markdown/HTML, заголовки Markdown вроде `# Heading`, маркеры fence или пустые заготовки чеклиста), OpenClaw пропускает запуск Heartbeat, чтобы сэкономить вызовы API. Такой пропуск сообщается как `reason=empty-heartbeat-file`. Если файл отсутствует, Heartbeat все равно запускается, и модель решает, что делать.

Держите его крошечным (короткий чеклист или напоминания), чтобы избежать раздувания промпта.

Пример `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` также поддерживает небольшой структурированный блок `tasks:` для интервальных проверок внутри самого Heartbeat.

Пример:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Поведение">
    - OpenClaw разбирает блок `tasks:` и проверяет каждую задачу по ее собственному `interval`.
    - В промпт Heartbeat для этого тика включаются только задачи, **срок** которых наступил.
    - Если нет задач с наступившим сроком, Heartbeat полностью пропускается (`reason=no-tasks-due`), чтобы избежать лишнего вызова модели.
    - Содержимое `HEARTBEAT.md`, не относящееся к задачам, сохраняется и добавляется как дополнительный контекст после списка задач с наступившим сроком.
    - Временные метки последнего запуска задач хранятся в состоянии сеанса (`heartbeatTaskState`), поэтому интервалы переживают обычные перезапуски.
    - Временные метки задач продвигаются только после того, как запуск Heartbeat завершит свой обычный путь ответа. Пропущенные запуски `empty-heartbeat-file` / `no-tasks-due` не помечают задачи как завершенные.

  </Accordion>
</AccordionGroup>

Режим задач полезен, когда вы хотите, чтобы один файл Heartbeat содержал несколько периодических проверок без оплаты всех проверок на каждом тике.

### Может ли агент обновлять HEARTBEAT.md?

Да — если вы его попросите.

`HEARTBEAT.md` — это обычный файл в рабочей области агента, поэтому вы можете сказать агенту (в обычном чате) что-то вроде:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

Если вы хотите, чтобы это происходило проактивно, можно также включить явную строку в свой промпт Heartbeat, например: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
Не помещайте секреты (ключи API, номера телефонов, приватные токены) в `HEARTBEAT.md` — он становится частью контекста промпта.
</Warning>

## Ручное пробуждение (по требованию)

Вы можете поставить системное событие в очередь и запустить немедленный Heartbeat с помощью:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Если `heartbeat` настроен у нескольких агентов, ручное пробуждение немедленно запускает Heartbeat каждого из этих агентов.

Используйте `--mode next-heartbeat`, чтобы дождаться следующего запланированного тика.

## Доставка рассуждений (необязательно)

По умолчанию Heartbeat доставляет только итоговый payload «ответа».

Если нужна прозрачность, включите:

- `agents.defaults.heartbeat.includeReasoning: true`

Когда это включено, Heartbeat также будет доставлять отдельное сообщение с префиксом `Thinking` (та же форма, что и `/reasoning on`). Это может быть полезно, когда агент управляет несколькими сеансами/codexes и вы хотите видеть, почему он решил написать вам, но также может раскрывать больше внутренних деталей, чем вам нужно. В групповых чатах лучше оставлять это отключенным.

## Учет стоимости

Heartbeat запускает полные ходы агента. Более короткие интервалы расходуют больше токенов. Чтобы снизить стоимость:

- Используйте `isolatedSession: true`, чтобы не отправлять полную историю разговора (~100K токенов уменьшаются до ~2-5K за запуск).
- Используйте `lightContext: true`, чтобы ограничить bootstrap-файлы только `HEARTBEAT.md`.
- Задайте более дешевую `model` (например, `ollama/llama3.2:1b`).
- Держите `HEARTBEAT.md` небольшим.
- Используйте `target: "none"`, если вам нужны только обновления внутреннего состояния.

## Переполнение контекста после Heartbeat

Если Heartbeat ранее оставил существующий сеанс на локальной модели меньшего размера, например модели Ollama с окном 32k, а следующий ход основного сеанса сообщает о переполнении контекста, сбросьте runtime-модель сеанса обратно на настроенную основную модель. Сообщение сброса OpenClaw указывает на это, когда последняя runtime-модель совпадает с настроенной `heartbeat.model`.

Текущие Heartbeat сохраняют существующую runtime-модель общего сеанса после завершения запуска. Вы все равно можете использовать `isolatedSession: true`, чтобы запускать Heartbeat в новом сеансе, сочетать это с `lightContext: true` для минимального промпта или выбрать модель Heartbeat с достаточно большим окном контекста для общего сеанса.

## Связанные материалы

- [Автоматизация](/ru/automation) — все механизмы автоматизации в кратком обзоре
- [Фоновые задачи](/ru/automation/tasks) — как отслеживается отсоединенная работа
- [Часовой пояс](/ru/concepts/timezone) — как часовой пояс влияет на планирование Heartbeat
- [Устранение неполадок](/ru/automation/cron-jobs#troubleshooting) — отладка проблем автоматизации
