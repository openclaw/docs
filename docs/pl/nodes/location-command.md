---
read_when:
    - Dodajesz obsługę lokalizacji węzła lub interfejs uprawnień
    - Projektujesz uprawnienia lokalizacji Androida lub zachowanie na pierwszym planie
summary: Polecenie lokalizacji dla węzłów (`location.get`), tryby uprawnień i zachowanie aplikacji Android na pierwszym planie
title: Polecenie lokalizacji
x-i18n:
    generated_at: "2026-04-05T13:58:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Polecenie lokalizacji (węzły)

## TL;DR

- `location.get` to polecenie węzła (przez `node.invoke`).
- Domyślnie wyłączone.
- Ustawienia aplikacji Android używają selektora: Wyłączone / Podczas używania.
- Osobny przełącznik: Dokładna lokalizacja.

## Dlaczego selektor, a nie tylko przełącznik

Uprawnienia systemu operacyjnego mają wiele poziomów. Możemy udostępnić selektor w aplikacji, ale to system operacyjny nadal decyduje o faktycznie przyznanym dostępie.

- iOS/macOS mogą udostępniać **Podczas używania** lub **Zawsze** w promptach systemowych / Ustawieniach.
- Aplikacja Android obecnie obsługuje tylko lokalizację na pierwszym planie.
- Dokładna lokalizacja to osobne uprawnienie (iOS 14+ „Precise”, Android „fine” vs „coarse”).

Selektor w UI steruje żądanym przez nas trybem; faktycznie przyznany poziom znajduje się w ustawieniach systemu operacyjnego.

## Model ustawień

Dla każdego urządzenia węzła:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Zachowanie UI:

- Wybranie `whileUsing` powoduje żądanie uprawnienia lokalizacji na pierwszym planie.
- Jeśli system operacyjny odmówi żądanego poziomu, wróć do najwyższego przyznanego poziomu i pokaż status.

## Mapowanie uprawnień (`node.permissions`)

Opcjonalne. Węzeł macOS zgłasza `location` przez mapę uprawnień; iOS/Android mogą to pomijać.

## Polecenie: `location.get`

Wywoływane przez `node.invoke`.

Parametry (sugerowane):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Ładunek odpowiedzi:

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

Błędy (stabilne kody):

- `LOCATION_DISABLED`: selektor jest wyłączony.
- `LOCATION_PERMISSION_REQUIRED`: brakuje uprawnienia dla żądanego trybu.
- `LOCATION_BACKGROUND_UNAVAILABLE`: aplikacja działa w tle, ale dozwolone jest tylko `whileUsing`.
- `LOCATION_TIMEOUT`: nie udało się ustalić pozycji w wyznaczonym czasie.
- `LOCATION_UNAVAILABLE`: błąd systemu / brak dostawców.

## Zachowanie w tle

- Aplikacja Android odrzuca `location.get`, gdy działa w tle.
- Podczas żądania lokalizacji na Androidzie trzymaj OpenClaw otwarte.
- Na innych platformach węzłów zachowanie może się różnić.

## Integracja z modelem/narzędziami

- Powierzchnia narzędzia: narzędzie `nodes` dodaje akcję `location_get` (wymagany węzeł).
- CLI: `openclaw nodes location get --node <id>`.
- Wytyczne dla agentów: wywołuj tylko wtedy, gdy użytkownik włączył lokalizację i rozumie zakres.

## Tekst UX (sugerowany)

- Wyłączone: „Udostępnianie lokalizacji jest wyłączone.”
- Podczas używania: „Tylko gdy OpenClaw jest otwarte.”
- Dokładna lokalizacja: „Używaj dokładnej lokalizacji GPS. Wyłącz, aby udostępniać przybliżoną lokalizację.”
