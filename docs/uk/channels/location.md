---
read_when:
    - Додавання або змінення розбору розташування каналу
    - Використання полів контексту розташування в запитах агента або інструментах
summary: Розбір розташування вхідного каналу (Telegram/WhatsApp/Matrix) і поля контексту
title: Розбір розташування каналу
x-i18n:
    generated_at: "2026-04-23T22:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw нормалізує спільні геолокації з чат-каналів у:

- стислий текст координат, доданий до тіла вхідного повідомлення, і
- структуровані поля в корисному навантаженні контексту автовідповіді. Надані каналом мітки, адреси та підписи/коментарі відображаються в запиті через спільний JSON-блок ненадійних метаданих, а не вбудовуються безпосередньо в тіло повідомлення користувача.

Наразі підтримуються:

- **Telegram** (позначки геолокації + місця проведення + live locations)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` з `geo_uri`)

## Форматування тексту

Геолокації відображаються як зрозумілі рядки без дужок:

- Позначка:
  - `📍 48.858844, 2.294351 ±12m`
- Іменоване місце:
  - `📍 48.858844, 2.294351 ±12m`
- Поширення live location:
  - `🛰 Геолокація в реальному часі: 48.858844, 2.294351 ±12m`

Якщо канал містить мітку, адресу або підпис/коментар, це зберігається в корисному навантаженні контексту й з’являється в запиті як огороджений ненадійний JSON:

````text
Геолокація (ненадійні метадані):
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

Коли присутня геолокація, до `ctx` додаються такі поля:

- `LocationLat` (число)
- `LocationLon` (число)
- `LocationAccuracy` (число, метри; необов’язково)
- `LocationName` (рядок; необов’язково)
- `LocationAddress` (рядок; необов’язково)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (булеве значення)
- `LocationCaption` (рядок; необов’язково)

Рендерер запитів обробляє `LocationName`, `LocationAddress` і `LocationCaption` як ненадійні метадані та серіалізує їх через той самий обмежений шлях JSON, що використовується для іншого контексту каналу.

## Примітки щодо каналів

- **Telegram**: місця проведення зіставляються з `LocationName/LocationAddress`; для live locations використовується `live_period`.
- **WhatsApp**: `locationMessage.comment` і `liveLocationMessage.caption` заповнюють `LocationCaption`.
- **Matrix**: `geo_uri` розбирається як геолокація-позначка; висота ігнорується, а `LocationIsLive` завжди має значення false.

## Пов’язане

- [Команда location (вузли)](/uk/nodes/location-command)
- [Захоплення зображення з камери](/uk/nodes/camera)
- [Розуміння медіа](/uk/nodes/media-understanding)
