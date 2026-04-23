---
read_when:
    - Додавання або змінення розбору розташування каналу
    - Використання полів контексту розташування в підказках агентів або інструментах
summary: Розбір розташування у вхідних каналах (Telegram/WhatsApp/Matrix) і поля контексту
title: Розбір розташування каналу
x-i18n:
    generated_at: "2026-04-23T20:44:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b486758929a3dcc7c5f0d9223891b129df353ba0b70ceaf8cfdd12735080abdc
    source_path: channels/location.md
    workflow: 15
---

OpenClaw нормалізує спільні геодані з чат-каналів у:

- стислий текст координат, доданий до вхідного тіла повідомлення, і
- структуровані поля в payload контексту автовідповіді. Надані каналом мітки, адреси та підписи/коментарі відображаються в prompt через спільний JSON-блок недовірених метаданих, а не вбудовано в тіло повідомлення користувача.

Наразі підтримуються:

- **Telegram** (мітки розташування + venues + live locations)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` з `geo_uri`)

## Форматування тексту

Розташування відображаються як зрозумілі рядки без дужок:

- Мітка:
  - `📍 48.858844, 2.294351 ±12m`
- Іменоване місце:
  - `📍 48.858844, 2.294351 ±12m`
- Жива трансляція розташування:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Якщо канал містить мітку, адресу або підпис/коментар, це зберігається в payload контексту й з’являється в prompt як обмежений недовірений JSON:

````text
Розташування (недовірені метадані):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## Поля контексту

Коли присутнє розташування, до `ctx` додаються такі поля:

- `LocationLat` (number)
- `LocationLon` (number)
- `LocationAccuracy` (number, метри; необов’язково)
- `LocationName` (string; необов’язково)
- `LocationAddress` (string; необов’язково)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (string; необов’язково)

Рендерер prompt трактує `LocationName`, `LocationAddress` і `LocationCaption` як недовірені метадані та серіалізує їх через той самий обмежений JSON-шлях, що й для іншого контексту каналу.

## Примітки щодо каналів

- **Telegram**: venues мапляться на `LocationName/LocationAddress`; live locations використовують `live_period`.
- **WhatsApp**: `locationMessage.comment` і `liveLocationMessage.caption` заповнюють `LocationCaption`.
- **Matrix**: `geo_uri` розбирається як pin-розташування; висота ігнорується, а `LocationIsLive` завжди має значення false.
