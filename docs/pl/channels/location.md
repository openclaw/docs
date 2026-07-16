---
read_when:
    - Dodawanie lub modyfikowanie parsowania lokalizacji kanału
    - Używanie pól kontekstu lokalizacji w promptach agenta lub narzędziach
summary: Analizowanie lokalizacji kanału i przenośne ładunki lokalizacji wychodzącej
title: Analizowanie lokalizacji kanału
x-i18n:
    generated_at: "2026-07-16T17:59:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw normalizuje udostępnione lokalizacje z kanałów czatu do postaci:

- zwięzłego tekstu ze współrzędnymi dołączanego do treści wiadomości przychodzącej oraz
- ustrukturyzowanych pól w ładunku kontekstu automatycznej odpowiedzi. Etykiety, adresy i podpisy/komentarze dostarczone przez kanał są renderowane w prompcie przez wspólny blok JSON niezaufanych metadanych, a nie bezpośrednio w treści wiadomości użytkownika.

Obecnie obsługiwane:

- **LINE** (wiadomości z lokalizacją zawierające tytuł/adres)
- **Matrix** (`m.location` z `geo_uri`)
- **Telegram** (pinezki lokalizacji, miejsca i lokalizacje na żywo)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Formatowanie tekstu

Lokalizacje są renderowane jako czytelne wiersze bez nawiasów. Współrzędne mają sześć miejsc po przecinku, a dokładność jest zaokrąglana do pełnych metrów:

- Pinezka:
  - `📍 48.858844, 2.294351 ±12m`
- Nazwane miejsce (w tym samym wierszu; nazwa/adres trafiają wyłącznie do bloku metadanych):
  - `📍 48.858844, 2.294351 ±12m`
- Udostępnianie na żywo:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Jeśli kanał zawiera etykietę, adres albo podpis/komentarz, element ten jest zachowywany w ładunku kontekstu i pojawia się w prompcie jako wydzielony blok niezaufanego JSON-u (nieobecne pola są pomijane):

````text
Lokalizacja (niezaufane metadane):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Wieża Eiffla",
  "address": "Champ de Mars, Paryż",
  "caption": "Spotkajmy się tutaj"
}
```
````

## Pola kontekstu

Gdy lokalizacja jest obecna, do `ctx` dodawane są następujące pola:

- `LocationLat` (liczba)
- `LocationLon` (liczba)
- `LocationAccuracy` (liczba, metry; opcjonalne)
- `LocationName` (ciąg znaków; opcjonalne)
- `LocationAddress` (ciąg znaków; opcjonalne)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (wartość logiczna)
- `LocationCaption` (ciąg znaków; opcjonalne)

Gdy kanał nie ustawia jawnego źródła, OpenClaw określa je automatycznie: udostępnienia na żywo stają się `live`, lokalizacje z nazwą lub adresem stają się `place`, a wszystkie pozostałe — `pin`.

Mechanizm renderowania promptu traktuje `LocationName`, `LocationAddress` i `LocationCaption` jako niezaufane metadane i serializuje je za pomocą tej samej ograniczonej ścieżki JSON, która jest używana dla pozostałego kontekstu kanału.

## Ładunki wychodzące

Narzędzie wiadomości i Plugin SDK używają tego samego formatu `NormalizedLocation` dla przenośnych lokalizacji wychodzących. Ładunek zawierający wyłącznie współrzędne reprezentuje pinezkę. Kanały z natywną obsługą miejsc mogą mapować `name` wraz z `address` na kartę miejsca.

Telegram obecnie udostępnia tę funkcję przez `message(action="send")`. Jej pierwsza implementacja jest celowo samodzielna: ładunków lokalizacji nie można łączyć z tekstem ani multimediami, a niekompletne pary danych miejsca powodują błąd zamiast cichego pominięcia nazwy lub adresu. Nieobsługiwane kanały nie udostępniają parametru lokalizacji.

## Uwagi dotyczące kanałów

- **LINE**: pola `title`/`address` wiadomości z lokalizacją są mapowane na `LocationName`/`LocationAddress`; brak lokalizacji na żywo.
- **Matrix**: `geo_uri` jest analizowane jako lokalizacja pinezki; parametr `u` (niepewność) jest mapowany na `LocationAccuracy`, treść zdarzenia wypełnia `LocationCaption`, wysokość jest ignorowana, a `LocationIsLive` zawsze ma wartość false.
- **Telegram**: miejsca są mapowane na `LocationName`/`LocationAddress`; lokalizacje na żywo są wykrywane za pomocą `live_period`.
- **WhatsApp**: `locationMessage.comment` i `liveLocationMessage.caption` wypełniają `LocationCaption`.

## Powiązane

- [Polecenie lokalizacji (węzły)](/pl/nodes/location-command)
- [Przechwytywanie obrazu z kamery](/pl/nodes/camera)
- [Interpretowanie multimediów](/pl/nodes/media-understanding)
