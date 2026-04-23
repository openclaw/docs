---
read_when:
    - Додавання підтримки location для вузла або UI дозволів
    - Проєктування дозволів location на Android або поведінки foreground
summary: Команда location для вузлів (`location.get`), режими дозволів і поведінка foreground на Android
title: Команда location
x-i18n:
    generated_at: "2026-04-23T20:59:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f605d29e6f57d6b1351758815d17bfe62776dad8a6860885852ea0378073fbe
    source_path: nodes/location-command.md
    workflow: 15
---

# Команда location (вузли)

## TL;DR

- `location.get` — це команда вузла (через `node.invoke`).
- Типово вимкнено.
- Налаштування застосунку Android використовують selector: Off / While Using.
- Окремий перемикач: Precise Location.

## Чому selector (а не просто перемикач)

Дозволи ОС мають кілька рівнів. Ми можемо показати selector у застосунку, але фактичний дозвіл усе одно визначає ОС.

- iOS/macOS можуть показувати **While Using** або **Always** у системних prompt-ах/Settings.
- Застосунок Android наразі підтримує лише foreground location.
- Precise location — це окремий дозвіл (iOS 14+ “Precise”, Android “fine” проти “coarse”).

Selector у UI керує режимом, який ми запитуємо; фактичний grant живе в налаштуваннях ОС.

## Модель налаштувань

Для кожного вузлового пристрою:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Поведінка UI:

- Вибір `whileUsing` запитує дозвіл на foreground location.
- Якщо ОС відхиляє запитаний рівень, повертатися до найвищого наданого рівня й показувати стан.

## Відображення дозволів (`node.permissions`)

Необов’язково. Вузол macOS повідомляє `location` через карту дозволів; iOS/Android можуть його не включати.

## Команда: `location.get`

Викликається через `node.invoke`.

Параметри (рекомендовано):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload відповіді:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Помилки (сталі коди):

- `LOCATION_DISABLED`: selector вимкнений.
- `LOCATION_PERMISSION_REQUIRED`: відсутній дозвіл для запитаного режиму.
- `LOCATION_BACKGROUND_UNAVAILABLE`: застосунок у background, але дозволено лише While Using.
- `LOCATION_TIMEOUT`: не вдалося отримати fix вчасно.
- `LOCATION_UNAVAILABLE`: системна помилка / немає provider-ів.

## Поведінка у background

- Застосунок Android відхиляє `location.get`, коли він у background.
- Тримайте OpenClaw відкритим, коли запитуєте location на Android.
- Інші платформи вузлів можуть поводитися інакше.

## Інтеграція моделі/інструментів

- Поверхня інструментів: інструмент `nodes` додає дію `location_get` (потрібен вузол).
- CLI: `openclaw nodes location get --node <id>`.
- Настанови для агента: викликайте лише коли користувач увімкнув location і розуміє область доступу.

## Текст у UX (рекомендовано)

- Off: “Передавання location вимкнено.”
- While Using: “Лише коли OpenClaw відкритий.”
- Precise: “Використовувати точну GPS-location. Вимкніть, щоб ділитися приблизною location.”
