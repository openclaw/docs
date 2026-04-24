---
read_when:
    - Dodawanie lub modyfikowanie analizowania lokalizacji kanału
    - Używanie pól kontekstu lokalizacji w promptach agentów lub narzędziach
summary: Analizowanie lokalizacji kanału przychodzącego (Telegram/WhatsApp/Matrix) i pól kontekstu
title: Analizowanie lokalizacji kanału
x-i18n:
    generated_at: "2026-04-24T08:58:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
---

OpenClaw normalizuje udostępnione lokalizacje z kanałów czatu do postaci:

- zwięzłego tekstu współrzędnych dołączanego do treści przychodzącej, oraz
- ustrukturyzowanych pól w ładunku kontekstu automatycznej odpowiedzi. Etykiety, adresy oraz podpisy/komentarze dostarczane przez kanał są renderowane w prompcie przez współdzielony blok JSON z niezaufanymi metadanymi, a nie wprost w treści użytkownika.

Obecnie obsługiwane:

- **Telegram** (pinezki lokalizacji + miejsca + lokalizacje na żywo)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` z `geo_uri`)

## Formatowanie tekstu

Lokalizacje są renderowane jako przyjazne wiersze bez nawiasów:

- Pinezka:
  - `📍 48.858844, 2.294351 ±12m`
- Nazwane miejsce:
  - `📍 48.858844, 2.294351 ±12m`
- Udostępnianie na żywo:
  - `🛰 Lokalizacja na żywo: 48.858844, 2.294351 ±12m`

Jeśli kanał zawiera etykietę, adres lub podpis/komentarz, są one zachowywane w ładunku kontekstu i pojawiają się w prompcie jako ograniczony blok JSON z niezaufanymi danymi:

````text
Lokalizacja (niezaufane metadane):
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

## Pola kontekstu

Gdy lokalizacja jest obecna, do `ctx` dodawane są te pola:

- `LocationLat` (liczba)
- `LocationLon` (liczba)
- `LocationAccuracy` (liczba, metry; opcjonalne)
- `LocationName` (ciąg znaków; opcjonalne)
- `LocationAddress` (ciąg znaków; opcjonalne)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (wartość logiczna)
- `LocationCaption` (ciąg znaków; opcjonalne)

Renderer promptów traktuje `LocationName`, `LocationAddress` i `LocationCaption` jako niezaufane metadane i serializuje je przez tę samą ograniczoną ścieżkę JSON używaną dla innego kontekstu kanału.

## Uwagi dotyczące kanałów

- **Telegram**: miejsca są mapowane do `LocationName/LocationAddress`; lokalizacje na żywo używają `live_period`.
- **WhatsApp**: `locationMessage.comment` i `liveLocationMessage.caption` wypełniają `LocationCaption`.
- **Matrix**: `geo_uri` jest analizowane jako lokalizacja typu pinezka; wysokość jest ignorowana, a `LocationIsLive` zawsze ma wartość false.

## Powiązane

- [Polecenie lokalizacji (węzły)](/pl/nodes/location-command)
- [Przechwytywanie obrazu](/pl/nodes/camera)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
