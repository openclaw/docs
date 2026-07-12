---
read_when:
    - Dodawanie obsługi lokalizacji węzła lub interfejsu uprawnień
    - Projektowanie uprawnień do lokalizacji lub działania na pierwszym planie w systemie Android
summary: Polecenie lokalizacji dla węzłów (location.get), tryby uprawnień i działanie Androida na pierwszym planie
title: Polecenie lokalizacji
x-i18n:
    generated_at: "2026-07-12T15:16:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## W skrócie

- `location.get` to polecenie Node, wywoływane za pomocą `node.invoke` lub `openclaw nodes location get`.
- Domyślnie wyłączone.
- Zewnętrzne kompilacje dla systemu Android używają selektora: Wyłączone / Podczas używania / Zawsze. Kompilacje z Google Play nadal oferują opcje Wyłączone / Podczas używania.
- Dokładna lokalizacja ma osobny przełącznik.

## Dlaczego selektor (a nie zwykły przełącznik)

Uprawnienia systemu operacyjnego do lokalizacji mają wiele poziomów. Dokładna lokalizacja również jest osobnym uprawnieniem systemowym (w systemie iOS 14+ „Dokładna”, w systemie Android „dokładna” i „przybliżona”). Selektor w aplikacji określa żądany tryb, ale ostatecznie to system operacyjny decyduje o faktycznie przyznanym uprawnieniu.

## Model ustawień

Dla każdego urządzenia Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Zachowanie interfejsu:

- Wybranie opcji `whileUsing` powoduje żądanie uprawnienia do lokalizacji na pierwszym planie.
- Wybranie opcji `always` w zewnętrznej kompilacji dla systemu Android najpierw powoduje żądanie uprawnienia do lokalizacji na pierwszym planie, następnie wyświetla objaśnienie dostępu w tle i otwiera ustawienia aplikacji w systemie Android, aby można było osobno przyznać uprawnienie **Allow all the time**.
- Kompilacje z Google Play nie deklarują uprawnienia do lokalizacji w tle ani nie wyświetlają opcji `always`.
- Jeśli system operacyjny odmówi przyznania żądanego poziomu, aplikacja powraca do najwyższego przyznanego poziomu i wyświetla stan.

## Mapowanie uprawnień (node.permissions)

Opcjonalne. Node systemu macOS zgłasza `location` za pośrednictwem mapy `permissions` w `node.list`/`node.describe`; systemy iOS i Android mogą je pomijać.

## Polecenie: `location.get`

Wywoływane za pomocą `node.invoke` lub pomocniczego polecenia CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Parametry:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Flagi CLI są mapowane bezpośrednio: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Dane odpowiedzi:

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: aplikacja działa w tle, ale przyznano uprawnienie tylko Podczas używania.
- `LOCATION_TIMEOUT`: nie udało się ustalić lokalizacji w wyznaczonym czasie.
- `LOCATION_UNAVAILABLE`: błąd systemu lub brak dostawców lokalizacji.

## Działanie w tle

- Zewnętrzne kompilacje dla systemu Android akceptują wywołanie `location.get` w tle tylko wtedy, gdy użytkownik wybrał opcję `Always`, a system Android przyznał uprawnienie do lokalizacji w tle. Istniejąca trwała usługa Node dodaje typ usługi `location` i podczas działania informuje o ustawieniu `Location: Always`.
- Kompilacje z Google Play oraz tryb `While Using` odrzucają wywołanie `location.get`, gdy aplikacja działa w tle.
- Inne platformy Node mogą działać inaczej.

## Integracja z modelem i narzędziami

- Narzędzie agenta: akcja `location_get` narzędzia `nodes` (wymagany Node).
- CLI: `openclaw nodes location get --node <id>`.
- Wytyczne dla agenta: wywołuj tylko wtedy, gdy użytkownik włączył lokalizację i rozumie zakres jej udostępniania.

## Teksty interfejsu użytkownika (sugerowane)

- Wyłączone: „Udostępnianie lokalizacji jest wyłączone”.
- Podczas używania: „Tylko gdy aplikacja OpenClaw jest otwarta”.
- Zawsze: „Zezwalaj na żądane sprawdzanie lokalizacji, gdy aplikacja OpenClaw działa w tle”.
- Dokładna: „Używaj dokładnej lokalizacji GPS. Wyłącz, aby udostępniać przybliżoną lokalizację”.

## Powiązane

- [Omówienie węzłów](/pl/nodes)
- [Analizowanie lokalizacji kanału](/pl/channels/location)
- [Przechwytywanie obrazu z kamery](/pl/nodes/camera)
- [Tryb rozmowy](/pl/nodes/talk)
