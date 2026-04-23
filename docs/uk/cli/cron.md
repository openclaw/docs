---
read_when:
    - Вам потрібні заплановані завдання та пробудження
    - Ви налагоджуєте виконання Cron і логи
summary: Довідник CLI для `openclaw cron` (планування та запуск фонових завдань)
title: Cron
x-i18n:
    generated_at: "2026-04-23T20:46:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f83605fce0888b14a148f2eb521a0d70343c535c80c67ba21a7985aa58716c5a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Керуйте завданнями Cron для планувальника Gateway.

Пов’язане:

- Завдання Cron: [Завдання Cron](/uk/automation/cron-jobs)

Порада: запустіть `openclaw cron --help`, щоб побачити повну поверхню команд.

Примітка: `openclaw cron list` і `openclaw cron show <job-id>` показують попередній
перегляд визначеного маршруту доставки. Для `channel: "last"` попередній перегляд показує, чи
було маршрут визначено з main/current session, чи він завершиться fail-closed.

Примітка: ізольовані завдання `cron add` типово використовують доставку `--announce`. Використовуйте `--no-deliver`, щоб залишити
вивід внутрішнім. `--deliver` залишається застарілим псевдонімом для `--announce`.

Примітка: доставка ізольованого cron chat є спільною. `--announce` — це резервна
доставка runner для фінальної відповіді; `--no-deliver` вимикає цей резервний варіант, але
не прибирає інструмент `message` агента, коли доступний маршрут чату.

Примітка: одноразові завдання (`--at`) типово видаляються після успішного виконання. Використовуйте `--keep-after-run`, щоб зберегти їх.

Примітка: `--session` підтримує `main`, `isolated`, `current` і `session:<id>`.
Використовуйте `current`, щоб прив’язати до активної session під час створення, або `session:<id>` для
явного сталого ключа session.

Примітка: для одноразових CLI-завдань datetimes `--at` без зміщення трактуються як UTC, якщо ви також не передасте
`--tz <iana>`, який інтерпретує цей локальний wall-clock time у вказаному часовому поясі.

Примітка: повторювані завдання тепер використовують експоненційний retry backoff після послідовних помилок (30s → 1m → 5m → 15m → 60m), а після наступного успішного запуску повертаються до звичайного розкладу.

Примітка: `openclaw cron run` тепер повертається, щойно ручний запуск поставлено в чергу на виконання. Успішні відповіді містять `{ ok: true, enqueued: true, runId }`; використовуйте `openclaw cron runs --id <job-id>`, щоб відстежити підсумковий результат.

Примітка: `openclaw cron run <job-id>` типово виконує примусовий запуск. Використовуйте `--due`, щоб зберегти
старішу поведінку «запускати лише якщо настав час».

Примітка: ізольовані ходи cron пригнічують застарілі відповіді лише з підтвердженням. Якщо
перший результат — це лише проміжне оновлення стану, і жоден дочірній запуск субагента
не відповідає за підсумкову відповідь, cron повторно формує prompt один раз для реального результату перед доставкою.

Примітка: якщо ізольований запуск повертає лише тихий токен (`NO_REPLY` /
`no_reply`), cron пригнічує пряму вихідну доставку, а також резервний шлях
summary у черзі, тож назад у чат нічого не публікується.

Примітка: `cron add|edit --model ...` використовує для завдання цю вибрану дозволену модель.
Якщо модель не дозволена, cron виводить попередження і повертається до вибору
моделі агента/типової моделі для завдання. Налаштовані fallback chains усе ще застосовуються, але звичайне
перевизначення моделі без явного списку резервних варіантів для конкретного завдання більше не додає
основну модель агента як приховану додаткову ціль повторної спроби.

Примітка: пріоритет моделі для ізольованого cron такий: спочатку перевизначення Gmail-hook, потім
`--model` для конкретного завдання, потім будь-яке збережене перевизначення моделі cron-session, а потім звичайний
вибір агента/типової моделі.

Примітка: fast mode ізольованого cron слідує за визначеним вибором live model. Конфігурація
моделі `params.fastMode` застосовується типово, але збережене перевизначення session `fastMode` усе ще має пріоритет над конфігурацією.

Примітка: якщо ізольований запуск викидає `LiveSessionModelSwitchError`, cron зберігає
перемкнений provider/model (і перевизначення switched auth profile, якщо воно є) перед
повторною спробою. Зовнішній цикл retry обмежений 2 switch retries після початкової
спроби, а потім переривається замість нескінченного циклу.

Примітка: сповіщення про помилки спочатку використовують `delivery.failureDestination`, потім
глобальний `cron.failureDestination`, і нарешті повертаються до основної
цілі announce завдання, якщо жодну явну failure destination не налаштовано.

Примітка: retention/pruning керується в конфігурації:

- `cron.sessionRetention` (типово `24h`) очищає завершені isolated run sessions.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` очищають `~/.openclaw/cron/runs/<jobId>.jsonl`.

Примітка щодо оновлення: якщо у вас є старіші cron-завдання з часів до поточного формату доставки/сховища, запустіть
`openclaw doctor --fix`. Doctor тепер нормалізує застарілі поля cron (`jobId`, `schedule.cron`,
поля доставки верхнього рівня, включно із застарілим `threadId`, псевдоніми доставки `provider` у payload) і мігрує прості
резервні Webhook-завдання `notify: true` до явної доставки Webhook, коли налаштовано `cron.webhook`.

## Типові редагування

Оновити параметри доставки без зміни повідомлення:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Вимкнути доставку для ізольованого завдання:

```bash
openclaw cron edit <job-id> --no-deliver
```

Увімкнути полегшений bootstrap-контекст для ізольованого завдання:

```bash
openclaw cron edit <job-id> --light-context
```

Оголосити в конкретний канал:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Створити ізольоване завдання з полегшеним bootstrap-контекстом:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` застосовується лише до ізольованих завдань agent-turn. Для запусків cron полегшений режим залишає bootstrap-контекст порожнім замість впровадження повного набору bootstrap workspace.

Примітка про відповідальність за доставку:

- Доставка ізольованого cron chat є спільною. Агент може надсилати напряму за допомогою
  інструмента `message`, коли доступний маршрут чату.
- `announce` резервно доставляє фінальну відповідь лише тоді, коли агент не надіслав
  напряму до визначеної цілі. `webhook` надсилає завершений payload на URL.
  `none` вимикає резервну доставку runner.

## Типові команди адміністрування

Ручний запуск:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Записи `cron runs` містять діагностику доставки з очікуваною ціллю cron,
визначеною ціллю, надсиланнями інструмента message, використанням резервного варіанта і станом доставки.

Переналаштування агента/session:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Налаштування доставки:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Примітка про доставку помилок:

- `delivery.failureDestination` підтримується для ізольованих завдань.
- Завдання main-session можуть використовувати `delivery.failureDestination` лише тоді, коли основний
  режим доставки — `webhook`.
- Якщо ви не задаєте жодної failure destination, а завдання вже робить announce у
  канал, сповіщення про помилки повторно використовують ту саму announce-ціль.
