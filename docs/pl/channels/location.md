---
read_when:
    - Dodawanie lub modyfikowanie parsowania lokalizacji kanału
    - Używanie pól kontekstu lokalizacji w promptach agentów lub narzędziach
summary: Parsowanie lokalizacji z kanałów przychodzących (Telegram/WhatsApp/Matrix) i pola kontekstu
title: Parsowanie lokalizacji kanału
x-i18n:
    generated_at: "2026-04-05T13:43:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# Parsowanie lokalizacji kanału

OpenClaw normalizuje współdzielone lokalizacje z kanałów czatu do postaci:

- czytelnego dla człowieka tekstu dołączanego do treści przychodzącej oraz
- ustrukturyzowanych pól w ładunku kontekstu automatycznej odpowiedzi.

Obecnie obsługiwane:

- **Telegram** (pinezki lokalizacji + miejsca + lokalizacje na żywo)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` z `geo_uri`)

## Formatowanie tekstu

Lokalizacje są renderowane jako przyjazne wiersze bez nawiasów:

- Pinezka:
  - `📍 48.858844, 2.294351 ±12m`
- Nazwane miejsce:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Udostępnianie na żywo:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Jeśli kanał zawiera podpis/komentarz, jest on dołączany w następnym wierszu:

```
📍 48.858844, 2.294351 ±12m
Meet here
```

## Pola kontekstu

Gdy lokalizacja jest obecna, te pola są dodawane do `ctx`:

- `LocationLat` (liczba)
- `LocationLon` (liczba)
- `LocationAccuracy` (liczba, metry; opcjonalnie)
- `LocationName` (ciąg znaków; opcjonalnie)
- `LocationAddress` (ciąg znaków; opcjonalnie)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (wartość logiczna)

## Uwagi dotyczące kanałów

- **Telegram**: miejsca są mapowane do `LocationName/LocationAddress`; lokalizacje na żywo używają `live_period`.
- **WhatsApp**: `locationMessage.comment` i `liveLocationMessage.caption` są dołączane jako wiersz podpisu.
- **Matrix**: `geo_uri` jest parsowane jako lokalizacja pinezki; wysokość jest ignorowana, a `LocationIsLive` ma zawsze wartość false.
