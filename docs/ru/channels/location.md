---
read_when:
    - Добавление или изменение разбора расположения каналов
    - Использование полей контекста местоположения в подсказках или инструментах агента
summary: Разбор местоположения входящих каналов (Telegram/WhatsApp/Matrix) и поля контекста
title: Разбор местоположения канала
x-i18n:
    generated_at: "2026-06-28T22:34:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 16
---

OpenClaw нормализует общие местоположения из каналов чата в:

- краткий текст с координатами, добавляемый к входящему телу сообщения, и
- структурированные поля в полезной нагрузке контекста автоматического ответа. Предоставленные каналом метки, адреса и подписи/комментарии отображаются в prompt через общий JSON-блок недоверенных метаданных, а не встроенно в тело сообщения пользователя.

Сейчас поддерживаются:

- **Telegram** (метки местоположения + места + live-местоположения)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`m.location` с `geo_uri`)

## Форматирование текста

Местоположения отображаются как понятные строки без скобок:

- Метка:
  - `📍 48.858844, 2.294351 ±12m`
- Именованное место:
  - `📍 48.858844, 2.294351 ±12m`
- Live-геопозиция:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Если канал включает метку, адрес или подпись/комментарий, они сохраняются в полезной нагрузке контекста и появляются в prompt как огражденный недоверенный JSON:

````text
Location (untrusted metadata):
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

## Поля контекста

Когда местоположение присутствует, эти поля добавляются в `ctx`:

- `LocationLat` (число)
- `LocationLon` (число)
- `LocationAccuracy` (число, метры; необязательно)
- `LocationName` (строка; необязательно)
- `LocationAddress` (строка; необязательно)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (логическое значение)
- `LocationCaption` (строка; необязательно)

Рендерер prompt обрабатывает `LocationName`, `LocationAddress` и `LocationCaption` как недоверенные метаданные и сериализует их через тот же ограниченный JSON-путь, который используется для другого контекста канала.

## Примечания по каналам

- **Telegram**: места сопоставляются с `LocationName/LocationAddress`; live-местоположения используют `live_period`.
- **WhatsApp**: `locationMessage.comment` и `liveLocationMessage.caption` заполняют `LocationCaption`.
- **Matrix**: `geo_uri` разбирается как местоположение-метка; высота игнорируется, а `LocationIsLive` всегда false.

## Связанные материалы

- [Команда местоположения (узлы)](/ru/nodes/location-command)
- [Съемка с камеры](/ru/nodes/camera)
- [Понимание медиа](/ru/nodes/media-understanding)
