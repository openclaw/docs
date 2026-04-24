---
read_when:
    - Dodawanie obsługi lokalizacji Node lub interfejsu uprawnień
    - Projektowanie uprawnień lokalizacji Androida lub zachowania na pierwszym planie
summary: Polecenie lokalizacji dla Nodes (`location.get`), tryby uprawnień i zachowanie Androida na pierwszym planie
title: Polecenie lokalizacji
x-i18n:
    generated_at: "2026-04-24T09:19:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## TL;DR

- `location.get` to polecenie Node (przez `node.invoke`).
- Domyślnie wyłączone.
- Ustawienia aplikacji Android używają selektora: Off / While Using.
- Osobny przełącznik: Precise Location.

## Dlaczego selektor (a nie tylko przełącznik)

Uprawnienia systemu operacyjnego są wielopoziomowe. Możemy udostępnić selektor w aplikacji, ale faktyczny poziom uprawnień nadal ustala system operacyjny.

- iOS/macOS mogą pokazywać **While Using** lub **Always** w promptach systemowych/Ustawieniach.
- Aplikacja Android obecnie obsługuje tylko lokalizację na pierwszym planie.
- Dokładna lokalizacja to osobne uprawnienie (iOS 14+ „Precise”, Android „fine” vs „coarse”).

Selektor w interfejsie użytkownika steruje trybem, o który prosimy; faktyczne uprawnienie znajduje się w ustawieniach systemu operacyjnego.

## Model ustawień

Per urządzenie Node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Zachowanie interfejsu użytkownika:

- Wybranie `whileUsing` żąda uprawnienia lokalizacji na pierwszym planie.
- Jeśli system operacyjny odmówi żądanego poziomu, wróć do najwyższego przyznanego poziomu i pokaż status.

## Mapowanie uprawnień (`node.permissions`)

Opcjonalne. Node na macOS raportuje `location` przez mapę uprawnień; iOS/Android mogą to pomijać.

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

Payload odpowiedzi:

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
- `LOCATION_PERMISSION_REQUIRED`: brak wymaganego uprawnienia dla żądanego trybu.
- `LOCATION_BACKGROUND_UNAVAILABLE`: aplikacja działa w tle, ale dozwolone jest tylko While Using.
- `LOCATION_TIMEOUT`: nie uzyskano pozycji na czas.
- `LOCATION_UNAVAILABLE`: awaria systemu / brak dostawców.

## Zachowanie w tle

- Aplikacja Android odrzuca `location.get`, gdy działa w tle.
- Podczas żądania lokalizacji na Androidzie trzymaj OpenClaw otwarte.
- Inne platformy Node mogą zachowywać się inaczej.

## Integracja modelu/narzędzi

- Powierzchnia narzędzi: narzędzie `nodes` dodaje akcję `location_get` (wymagany Node).
- CLI: `openclaw nodes location get --node <id>`.
- Wytyczne dla agentów: wywołuj tylko wtedy, gdy użytkownik włączył lokalizację i rozumie jej zakres.

## Tekst UX (sugerowany)

- Off: „Udostępnianie lokalizacji jest wyłączone.”
- While Using: „Tylko gdy OpenClaw jest otwarty.”
- Precise: „Użyj dokładnej lokalizacji GPS. Wyłącz, aby udostępniać przybliżoną lokalizację.”

## Powiązane

- [Parsowanie lokalizacji kanału](/pl/channels/location)
- [Przechwytywanie kamerą](/pl/nodes/camera)
- [Tryb Talk](/pl/nodes/talk)
