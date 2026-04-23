---
read_when:
    - Хостинг PeekabooBridge в OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
summary: Інтеграція PeekabooBridge для автоматизації UI на macOS
title: Peekaboo bridge
x-i18n:
    generated_at: "2026-04-23T21:01:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebd4efbf2a1c45e59795fca8b746b859a8bfd7370ec24aa94da84a94e1f6544c
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (автоматизація UI на macOS)

OpenClaw може хостити **PeekabooBridge** як локальний брокер автоматизації UI, що враховує дозволи.
Це дозволяє CLI `peekaboo` керувати автоматизацією UI, повторно використовуючи
дозволи TCC macOS app.

## Що це таке (і чим не є)

- **Host**: OpenClaw.app може виступати як host PeekabooBridge.
- **Client**: використовуйте CLI `peekaboo` (окремої поверхні `openclaw ui ...` немає).
- **UI**: візуальні overlay лишаються в Peekaboo.app; OpenClaw — це тонкий broker host.

## Увімкнення bridge

У macOS app:

- Settings → **Enable Peekaboo Bridge**

Коли bridge увімкнено, OpenClaw запускає локальний UNIX socket server. Якщо його вимкнено, host
зупиняється, і `peekaboo` повертається до інших доступних host-ів.

## Порядок виявлення client-ом

Клієнти Peekaboo зазвичай пробують host-и в такому порядку:

1. Peekaboo.app (повний UX)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий broker)

Використовуйте `peekaboo bridge status --verbose`, щоб побачити, який host активний і який
шлях socket використовується. Ви можете перевизначити це так:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека й дозволи

- Bridge перевіряє **підписи коду викликача**; застосовується allowlist TeamID
  (TeamID host-а Peekaboo + TeamID app OpenClaw).
- Запити мають timeout приблизно через 10 секунд.
- Якщо бракує потрібних дозволів, bridge повертає зрозуміле повідомлення про помилку
  замість запуску System Settings.

## Поведінка snapshot (автоматизація)

Snapshots зберігаються в пам’яті й автоматично спливають через короткий час.
Якщо вам потрібне довше зберігання, повторно захопіть їх із client-а.

## Усунення несправностей

- Якщо `peekaboo` повідомляє “bridge client is not authorized”, переконайтеся, що client
  підписано належним чином, або запускайте host із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  **лише** в режимі debug.
- Якщо host-и не знаходяться, відкрийте один із host app-ів (Peekaboo.app або OpenClaw.app)
  і переконайтеся, що надано дозволи.
