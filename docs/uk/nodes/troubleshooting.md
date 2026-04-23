---
read_when:
    - Node підключений, але інструменти camera/canvas/screen/exec не працюють大发官网 to=functions.read 凤凰大参考  天天中彩票提款json  content={"path":"docs/help/node-troubleshooting.md","offset":1,"limit":400}
    - Вам потрібна ментальна модель відмінностей між pairing Node і approvals
summary: Усунення несправностей pairing Node, вимог до переднього плану, дозволів і збоїв інструментів
title: Усунення несправностей Node
x-i18n:
    generated_at: "2026-04-23T20:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e93ca2a1f87e6c997b91d2a9d9a97b9b58828ef1842fe3c5d439325dbc47c990
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Використовуйте цю сторінку, коли Node видно у status, але інструменти Node не працюють.

## Command ladder

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім виконайте перевірки, специфічні для Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Ознаки здорового стану:

- Node підключений і paired для role `node`.
- `nodes describe` містить capability, яку ви викликаєте.
- Exec approvals показують очікуваний режим/allowlist.

## Вимоги до переднього плану

`canvas.*`, `camera.*` і `screen.*` працюють лише на передньому плані на iOS/Android Node.

Швидка перевірка й виправлення:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Якщо ви бачите `NODE_BACKGROUND_UNAVAILABLE`, переведіть застосунок Node на передній план і повторіть спробу.

## Матриця дозволів

| Capability                   | iOS                                     | Android                                      | macOS node app                | Типовий код помилки           |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Камера (+ мікрофон для аудіо кліпу)     | Камера (+ мікрофон для аудіо кліпу)          | Камера (+ мікрофон для аудіо кліпу) | `*_PERMISSION_REQUIRED` |
| `screen.record`              | Запис екрана (+ мікрофон за потреби)    | Запит на захоплення екрана (+ мікрофон за потреби) | Запис екрана             | `*_PERMISSION_REQUIRED`       |
| `location.get`               | While Using або Always (залежить від режиму) | Foreground/Background location залежно від режиму | Дозвіл на геолокацію     | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (шлях хоста Node)                   | n/a (шлях хоста Node)                        | Потрібні exec approvals       | `SYSTEM_RUN_DENIED`           |

## Pairing проти approvals

Це різні фільтри:

1. **Device pairing**: чи може цей Node підключитися до gateway?
2. **Gateway node command policy**: чи дозволено RPC command ID через `gateway.nodes.allowCommands` / `denyCommands` і типові значення платформи?
3. **Exec approvals**: чи може цей Node локально запустити конкретну shell-команду?

Швидкі перевірки:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Якщо pairing відсутній, спочатку схваліть pairing пристрою Node.
Якщо в `nodes describe` немає команди, перевірте gateway node command policy і чи Node взагалі оголосив цю команду під час connect.
Якщо pairing у нормі, але `system.run` завершується помилкою, виправте exec approvals/allowlist на цьому Node.

Pairing Node — це фільтр ідентичності/довіри, а не поверхня схвалення для кожної команди окремо. Для `system.run` політика для конкретного Node живе у файлі exec approvals цього Node (`openclaw approvals get --node ...`), а не в записі pairing gateway.

Для запусків `host=node`, що спираються на approvals, gateway також прив’язує виконання до
підготовленого канонічного `systemRunPlan`. Якщо пізніший виклик змінює command/cwd або
метадані сесії перед тим, як схвалений запуск буде переслано, gateway відхиляє
запуск як невідповідність approval замість того, щоб довіряти відредагованому payload.

## Поширені коди помилок Node

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок працює у фоні; переведіть його на передній план.
- `CAMERA_DISABLED` → перемикач камери вимкнений у налаштуваннях Node.
- `*_PERMISSION_REQUIRED` → бракує або відхилено дозвіл ОС.
- `LOCATION_DISABLED` → режим геолокації вимкнено.
- `LOCATION_PERMISSION_REQUIRED` → запитаний режим геолокації не надано.
- `LOCATION_BACKGROUND_UNAVAILABLE` → застосунок у фоні, але є лише дозвіл While Using.
- `SYSTEM_RUN_DENIED: approval required` → запит exec потребує явного схвалення.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано режимом allowlist.
  На хостах Windows Node форми shell-wrapper, як-от `cmd.exe /c ...`, вважаються allowlist miss у
  режимі allowlist, якщо їх не схвалено через ask flow.

## Швидкий цикл відновлення

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Якщо все ще не вдається:

- Повторно схваліть device pairing.
- Знову відкрийте застосунок Node (на передньому плані).
- Повторно надайте дозволи ОС.
- Повторно створіть/налаштуйте політику exec approval.

Пов’язане:

- [/nodes/index](/uk/nodes/index)
- [/nodes/camera](/uk/nodes/camera)
- [/nodes/location-command](/uk/nodes/location-command)
- [/tools/exec-approvals](/uk/tools/exec-approvals)
- [/gateway/pairing](/uk/gateway/pairing)
