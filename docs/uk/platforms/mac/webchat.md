---
read_when:
    - Налагодження вигляду mac WebChat або loopback-порту
summary: Як застосунок mac вбудовує Gateway WebChat і як його налагоджувати
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-23T21:01:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50775f8eb7ec87afb48a2f192abc1515954a8e846bf3371143d3f4e903b796bd
    source_path: platforms/mac/webchat.md
    workflow: 15
---

Застосунок macOS у рядку меню вбудовує UI WebChat як нативний SwiftUI view. Він
підключається до Gateway і за замовчуванням використовує **основну сесію** для вибраного
агента (із перемикачем сесій для інших сесій).

- **Локальний режим**: підключається безпосередньо до локального WebSocket Gateway.
- **Віддалений режим**: переспрямовує контрольний порт Gateway через SSH і використовує цей
  tunnel як площину даних.

## Запуск і налагодження

- Вручну: меню Lobster → “Open Chat”.
- Автовідкриття для тестування:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Журнали: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Як це підключено

- Площина даних: методи WS Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` і події `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` повертає нормалізовані для відображення рядки транскрипту: inline directive
  tags прибираються з видимого тексту, XML payload викликів інструментів у plain-text
  (включно з `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів), а також
  витеклі ASCII/full-width токени керування моделлю прибираються, чисті
  рядки assistant із silent-token на кшталт точного `NO_REPLY` / `no_reply`
  пропускаються, а надто великі рядки можуть замінюватися заповнювачами.
- Сесія: за замовчуванням використовується основна сесія (`main`, або `global`, коли scope є
  global). UI може перемикатися між сесіями.
- Onboarding використовує окрему сесію, щоб відокремити початкове налаштування.

## Поверхня безпеки

- Віддалений режим переспрямовує через SSH лише контрольний порт WebSocket Gateway.

## Відомі обмеження

- UI оптимізовано для чат-сесій (це не повноцінна браузерна пісочниця).
