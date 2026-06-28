---
read_when:
    - Редагування IPC-контрактів або IPC застосунку в рядку меню
summary: Архітектура IPC у macOS для застосунку OpenClaw, транспорту вузла шлюзу та PeekabooBridge
title: macOS IPC
x-i18n:
    generated_at: "2026-06-28T00:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Архітектура IPC OpenClaw для macOS

**Поточна модель:** локальний Unix-сокет з’єднує **хост-службу node** з **застосунком macOS** для схвалень exec + `system.run`. Існує налагоджувальний CLI `openclaw-mac` для перевірок виявлення/підключення; дії агента й надалі проходять через WebSocket Gateway і `node.invoke`. Автоматизація UI використовує PeekabooBridge.

## Цілі

- Єдиний екземпляр GUI-застосунку, який володіє всією роботою, пов’язаною з TCC (сповіщення, запис екрана, мікрофон, мовлення, AppleScript).
- Невелика поверхня для автоматизації: Gateway + команди node, а також PeekabooBridge для автоматизації UI.
- Передбачувані дозволи: завжди той самий підписаний bundle ID, запущений через launchd, тому дозволи TCC зберігаються.

## Як це працює

### Gateway + транспорт node

- Застосунок запускає Gateway (локальний режим) і підключається до нього як node.
- Дії агента виконуються через `node.invoke` (наприклад, `system.run`, `system.notify`, `canvas.*`).
- Поширені команди Mac node включають `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` і `system.notify`.
- Node повідомляє мапу `permissions`, щоб агенти могли бачити, чи доступний доступ до екрана,
  камери, мікрофона, мовлення, автоматизації або спеціальних можливостей.

### Служба node + IPC застосунку

- Безголова хост-служба node підключається до WebSocket Gateway.
- Запити `system.run` пересилаються до застосунку macOS через локальний Unix-сокет.
- Застосунок виконує exec у контексті UI, за потреби показує запит і повертає вивід.

Діаграма (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (автоматизація UI)

- Автоматизація UI використовує окремий UNIX-сокет із назвою `bridge.sock` і JSON-протокол PeekabooBridge.
- Порядок пріоритету хостів (на стороні клієнта): Peekaboo.app → Claude.app → OpenClaw.app → локальне виконання.
- Безпека: хости bridge вимагають дозволений TeamID; аварійний вихід лише для DEBUG з тим самим UID захищено змінною `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (конвенція Peekaboo).
- Див.: [Використання PeekabooBridge](/uk/platforms/mac/peekaboo) для деталей.

## Операційні потоки

- Перезапуск/перезбирання: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Завершує наявні екземпляри
  - Swift build + package
  - Записує/бутстрапить/запускає LaunchAgent через kickstart
- Єдиний екземпляр: застосунок завершує роботу раніше, якщо вже запущено інший екземпляр із тим самим bundle ID.

## Нотатки щодо посилення захисту

- Надавайте перевагу вимозі збігу TeamID для всіх привілейованих поверхонь.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (лише DEBUG) може дозволити викликачів із тим самим UID для локальної розробки.
- Уся комунікація залишається лише локальною; мережеві сокети не відкриваються.
- Запити TCC походять лише з bundle GUI-застосунку; зберігайте підписаний bundle ID стабільним між перезбираннями.
- Посилення IPC: режим сокета `0600`, токен, перевірки peer-UID, challenge/response HMAC, короткий TTL.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Потік IPC macOS (схвалення Exec)](/uk/tools/exec-approvals-advanced#macos-ipc-flow)
