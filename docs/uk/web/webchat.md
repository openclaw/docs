---
read_when:
    - Налагодження або налаштування доступу до WebChat
summary: Статичний хостинг WebChat для loopback і використання Gateway WS для інтерфейсу чату
title: WebChat
x-i18n:
    generated_at: "2026-04-24T21:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Стан: інтерфейс чату SwiftUI для macOS/iOS напряму взаємодіє з Gateway WebSocket.

## Що це таке

- Нативний інтерфейс чату для gateway (без вбудованого браузера та без локального статичного сервера).
- Використовує ті самі сесії та правила маршрутизації, що й інші канали.
- Детермінована маршрутизація: відповіді завжди повертаються до WebChat.

## Швидкий старт

1. Запустіть gateway.
2. Відкрийте інтерфейс WebChat (застосунок macOS/iOS) або вкладку чату в Control UI.
3. Переконайтеся, що налаштовано коректний шлях автентифікації gateway (типово — shared-secret,
   навіть для loopback).

## Як це працює (поведінка)

- Інтерфейс підключається до Gateway WebSocket і використовує `chat.history`, `chat.send` та `chat.inject`.
- `chat.history` обмежений для стабільності: Gateway може обрізати довгі текстові поля, пропускати важкі метадані та замінювати надто великі записи на `[chat.history omitted: message too large]`.
- `chat.history` також нормалізується для відображення: із видимого тексту прибираються контекст OpenClaw лише для runtime,
  вхідні envelope-обгортки, вбудовані теги директив доставки
  на кшталт `[[reply_to_*]]` і `[[audio_as_voice]]`, XML-пейлоади викликів інструментів у звичайному тексті
  (включно з `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` і
  обрізаними блоками викликів інструментів), а також
  витоки ASCII/повноширинних керувальних токенів моделі; записи assistant, у яких увесь видимий текст складається лише з точного
  тихого токена `NO_REPLY` / `no_reply`, пропускаються.
- `chat.inject` напряму додає нотатку assistant до транскрипту та транслює її в інтерфейс (без запуску агента).
- Перервані запуски можуть залишати частковий вивід assistant видимим в інтерфейсі.
- Gateway зберігає перерваний частковий текст assistant в історії транскрипту, коли існує буферизований вивід, і позначає такі записи метаданими переривання.
- Історія завжди отримується з gateway (без локального відстеження файлів).
- Якщо gateway недоступний, WebChat працює лише в режимі читання.

## Панель інструментів агентів у Control UI

- Панель Tools у `/agents` в Control UI має два окремі подання:
  - **Available Right Now** використовує `tools.effective(sessionKey=...)` і показує, що поточна
    сесія реально може використовувати під час runtime, включно з core-, Plugin- та channel-власними інструментами.
  - **Tool Configuration** використовує `tools.catalog` і залишається зосередженою на профілях, перевизначеннях та
    семантиці каталогу.
- Доступність під час runtime прив’язана до сесії. Перемикання сесій для того самого агента може змінювати
  список **Available Right Now**.
- Редактор конфігурації не означає доступність під час runtime; ефективний доступ і надалі визначається пріоритетом
  політик (`allow`/`deny`, перевизначеннями для окремого агента та provider/channel).

## Віддалене використання

- У віддаленому режимі Gateway WebSocket тунелюється через SSH/Tailscale.
- Вам не потрібно запускати окремий сервер WebChat.

## Довідник з конфігурації (WebChat)

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри WebChat:

- `gateway.webchat.chatHistoryMaxChars`: максимальна кількість символів для текстових полів у відповідях `chat.history`. Коли запис транскрипту перевищує цей ліміт, Gateway обрізає довгі текстові поля та може замінити надто великі повідомлення заповнювачем. Клієнт також може надсилати `maxChars` для окремого запиту, щоб перевизначити це значення за замовчуванням для одного виклику `chat.history`.

Пов’язані глобальні параметри:

- `gateway.port`, `gateway.bind`: хост/порт WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  автентифікація WebSocket через shared-secret.
- `gateway.auth.allowTailscale`: вкладка чату браузерного Control UI може використовувати заголовки ідентифікації Tailscale
  Serve, якщо це увімкнено.
- `gateway.auth.mode: "trusted-proxy"`: автентифікація через reverse-proxy для браузерних клієнтів за identity-aware **не-loopback** джерелом proxy (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: ціль віддаленого gateway.
- `session.*`: сховище сесій і типові значення основного ключа.

## Пов’язане

- [Control UI](/uk/web/control-ui)
- [Dashboard](/uk/web/dashboard)
