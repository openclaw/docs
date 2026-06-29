---
read_when:
    - Вы хотите поставить системное событие в очередь, не создавая задание Cron
    - Необходимо включить или отключить Heartbeat
    - Вы хотите просмотреть записи о присутствии системы
summary: Справочник CLI для `openclaw system` (системные события, Heartbeat, присутствие)
title: Система
x-i18n:
    generated_at: "2026-06-28T22:47:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Вспомогательные команды системного уровня для Gateway: постановка системных событий в очередь, управление Heartbeat
и просмотр presence.

Все подкоманды `system` используют Gateway RPC и принимают общие флаги клиента:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Общие команды

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

По умолчанию ставит системное событие в очередь в **основном** сеансе. Следующий Heartbeat
вставит его в prompt как строку `System:`. Используйте `--mode now`, чтобы запустить
Heartbeat немедленно; `next-heartbeat` ожидает следующего запланированного тика.

Передайте `--session-key`, чтобы нацелиться на конкретный сеанс (например, чтобы передать
завершение async-задачи обратно в канал, который ее запустил).

> **Исключение по времени с `--session-key`:** когда указан `--session-key`,
> `--mode next-heartbeat` сворачивается в немедленное целевое пробуждение вместо
> ожидания следующего запланированного тика. Целевые пробуждения используют intent Heartbeat
> `immediate`, поэтому они обходят not-due gate раннера, который иначе
> отложил бы (и фактически отбросил) пробуждение с intent `event`. Если нужна отложенная
> доставка, не указывайте `--session-key`, чтобы событие попало в основной сеанс и
> было доставлено со следующим регулярным Heartbeat.

Флаги:

- `--text <text>`: обязательный текст системного события.
- `--mode <mode>`: `now` или `next-heartbeat` (по умолчанию).
- `--session-key <sessionKey>`: необязательно; нацелиться на конкретный сеанс агента
  вместо основного сеанса агента. Ключи, которые не принадлежат
  разрешенному агенту, откатываются к основному сеансу агента.
- `--json`: машиночитаемый вывод.
- `--url`, `--token`, `--timeout`, `--expect-final`: общие флаги Gateway RPC.

## `system heartbeat last|enable|disable`

Управление Heartbeat:

- `last`: показать последнее событие Heartbeat.
- `enable`: снова включить Heartbeat (используйте это, если он был отключен).
- `disable`: приостановить Heartbeat.

Флаги:

- `--json`: машиночитаемый вывод.
- `--url`, `--token`, `--timeout`, `--expect-final`: общие флаги Gateway RPC.

## `system presence`

Выводит текущие записи system presence, о которых знает Gateway (узлы,
экземпляры и похожие строки статуса).

Флаги:

- `--json`: машиночитаемый вывод.
- `--url`, `--token`, `--timeout`, `--expect-final`: общие флаги Gateway RPC.

## Примечания

- Требуется запущенный Gateway, доступный по вашей текущей конфигурации (локальной или удаленной).
- Системные события эфемерны и не сохраняются между перезапусками.

## Связанные материалы

- [Справочник CLI](/ru/cli)
