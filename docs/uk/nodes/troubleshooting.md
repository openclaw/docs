---
read_when:
    - Node підключено, але інструменти camera/canvas/screen/exec не працюють
    - Вам потрібна ментальна модель сполучення вузла на противагу затвердженням
summary: Усунення проблем зі сполученням Node, вимогами до роботи на передньому плані, дозволами та збоями інструментів
title: Усунення несправностей Node
x-i18n:
    generated_at: "2026-05-11T20:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Використовуйте цю сторінку, коли Node видно у статусі, але інструменти Node не працюють.

## Сходи команд

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

Ознаки справного стану:

- Node підключено та спарено для ролі `node`.
- `nodes describe` містить capability, яку ви викликаєте.
- Погодження exec показують очікуваний режим/allowlist.

## Вимоги переднього плану

`canvas.*`, `camera.*` і `screen.*` працюють лише на передньому плані на iOS/Android Node.

Швидка перевірка та виправлення:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Якщо ви бачите `NODE_BACKGROUND_UNAVAILABLE`, переведіть застосунок Node на передній план і повторіть спробу.

## Матриця дозволів

| Capability                   | iOS                                         | Android                                            | застосунок Node для macOS      | Типовий код помилки            |
| ---------------------------- | ------------------------------------------- | -------------------------------------------------- | ------------------------------ | ------------------------------ |
| `camera.snap`, `camera.clip` | Камера (+ мікрофон для аудіо кліпу)         | Камера (+ мікрофон для аудіо кліпу)                | Камера (+ мікрофон для аудіо кліпу) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Запис екрана (+ мікрофон необов’язково)     | Запит на захоплення екрана (+ мікрофон необов’язково) | Запис екрана                   | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Під час використання або завжди (залежить від режиму) | Геолокація переднього/фонового плану залежно від режиму | Дозвіл на геолокацію           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | н/д (шлях хоста Node)                       | н/д (шлях хоста Node)                              | Потрібні погодження exec       | `SYSTEM_RUN_DENIED`            |

## Спарення проти погоджень

Це різні шлюзи:

1. **Спарення пристрою**: чи може цей Node підключитися до Gateway?
2. **Політика команд Gateway для Node**: чи дозволено ID команди RPC через `gateway.nodes.allowCommands` / `denyCommands` і стандартні налаштування платформи?
3. **Погодження exec**: чи може цей Node локально виконати конкретну команду shell?

Швидкі перевірки:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Якщо спарення відсутнє, спочатку погодьте пристрій Node.
Якщо в `nodes describe` бракує команди, перевірте політику команд Gateway для Node і чи Node справді оголосив цю команду під час підключення.
Якщо спарення справне, але `system.run` завершується з помилкою, виправте погодження exec/allowlist на цьому Node.

Спарення Node — це шлюз ідентичності/довіри, а не поверхня погодження для кожної команди. Для `system.run` політика конкретного Node зберігається у файлі погоджень exec цього Node (`openclaw approvals get --node ...`), а не в записі спарення Gateway.

Для запусків `host=node`, підкріплених погодженням, Gateway також прив’язує виконання до
підготовленого канонічного `systemRunPlan`. Якщо пізніший викликач змінює команду/cwd або
метадані сесії до пересилання погодженого запуску, Gateway відхиляє
запуск як невідповідність погодження, замість того щоб довіряти зміненому payload.

## Поширені коди помилок Node

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок у фоновому режимі; переведіть його на передній план.
- `CAMERA_DISABLED` → перемикач камери вимкнено в налаштуваннях Node.
- `*_PERMISSION_REQUIRED` → дозвіл ОС відсутній/відхилений.
- `LOCATION_DISABLED` → режим геолокації вимкнено.
- `LOCATION_PERMISSION_REQUIRED` → запитаний режим геолокації не надано.
- `LOCATION_BACKGROUND_UNAVAILABLE` → застосунок у фоновому режимі, але є лише дозвіл «Під час використання».
- `SYSTEM_RUN_DENIED: approval required` → запит exec потребує явного погодження.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано режимом allowlist.
  На хостах Windows Node форми shell-wrapper на кшталт `cmd.exe /c ...` розглядаються як промахи allowlist у
  режимі allowlist, якщо їх не погоджено через ask flow.

## Швидкий цикл відновлення

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Якщо проблема лишається:

- Повторно погодьте спарення пристрою.
- Повторно відкрийте застосунок Node (передній план).
- Повторно надайте дозволи ОС.
- Відтворіть/налаштуйте політику погоджень exec.

## Пов’язане

- [Огляд Node](/uk/nodes)
- [Camera Node](/uk/nodes/camera)
- [Команда геолокації](/uk/nodes/location-command)
- [Погодження exec](/uk/tools/exec-approvals)
- [Спарення Gateway](/uk/gateway/pairing)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
- [Усунення несправностей каналу](/uk/channels/troubleshooting)
