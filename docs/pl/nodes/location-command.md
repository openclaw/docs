---
read_when:
    - Dodawanie obsługi węzła lokalizacji lub interfejsu uprawnień
    - Projektowanie uprawnień do lokalizacji lub działania na pierwszym planie w systemie Android
summary: Polecenie lokalizacji dla węzłów, tryby uprawnień platformy i konfiguracja GeoClue w systemie Linux
title: Polecenie lokalizacji
x-i18n:
    generated_at: "2026-07-16T18:36:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## W skrócie

- `location.get` jest poleceniem Node, wywoływanym za pośrednictwem `node.invoke` lub `openclaw nodes location get`.
- Domyślnie wyłączone.
- Zewnętrzne kompilacje na Androida używają selektora: Wyłączone / Podczas używania / Zawsze. Kompilacje z Google Play nadal oferują opcje Wyłączone / Podczas używania.
- Dokładna lokalizacja jest osobnym przełącznikiem.

## Dlaczego selektor (a nie tylko przełącznik)

Uprawnienia systemu operacyjnego do lokalizacji mają wiele poziomów. Dokładna lokalizacja również stanowi osobne uprawnienie systemowe („Precise” w systemie iOS 14+, „fine” i „coarse” w systemie Android). Selektor w aplikacji określa żądany tryb, ale o faktycznie przyznanym uprawnieniu nadal decyduje system operacyjny.

## Model ustawień

Dla każdego urządzenia Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Działanie interfejsu:

- Wybranie opcji `whileUsing` powoduje zażądanie uprawnienia do lokalizacji podczas używania aplikacji.
- Wybranie opcji `always` w zewnętrznej kompilacji na Androida najpierw powoduje zażądanie uprawnienia do lokalizacji podczas używania aplikacji, następnie wyświetla objaśnienie dostępu w tle i otwiera ustawienia aplikacji w systemie Android, aby umożliwić osobne przyznanie uprawnienia **Allow all the time**.
- Kompilacje na Androida z Google Play nie deklarują uprawnienia do lokalizacji w tle ani nie wyświetlają opcji `always`.
- Jeśli system operacyjny odmówi żądanego poziomu, aplikacja powraca do najwyższego przyznanego poziomu i wyświetla stan.

## Mapowanie uprawnień (node.permissions)

Opcjonalne. Node systemu macOS zgłasza `location` za pośrednictwem mapy `permissions` w `node.list`/`node.describe`; systemy iOS i Android mogą je pomijać.

## Polecenie: `location.get`

Wywoływane za pośrednictwem `node.invoke` lub pomocnika CLI:

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
- `LOCATION_PERMISSION_REQUIRED`: brak uprawnienia wymaganego dla żądanego trybu.
- `LOCATION_BACKGROUND_UNAVAILABLE`: aplikacja działa w tle, ale przyznano wyłącznie dostęp podczas używania.
- `LOCATION_TIMEOUT`: nie udało się ustalić położenia w wymaganym czasie.
- `LOCATION_UNAVAILABLE`: błąd systemu lub brak dostawców.

## Działanie w tle

- Zewnętrzne kompilacje na Androida akceptują `location.get` w tle tylko wtedy, gdy użytkownik wybrał `Always`, a system Android przyznał dostęp do lokalizacji w tle. Istniejąca trwała usługa Node dodaje typ usługi `location` i podczas działania informuje o `Location: Always`.
- Kompilacje na Androida z Google Play oraz tryb `While Using` odrzucają `location.get`, gdy aplikacja działa w tle.
- Inne platformy Node mogą działać inaczej.

## Host Node w systemie Linux

Dołączony Plugin Linux Node dodaje `location.get` do usługi CLI `openclaw node`, również na hostach bez interfejsu graficznego, na których nie ma aplikacji komputerowej dla systemu Linux. Lokalizacja jest domyślnie wyłączona. Należy ją włączyć we wpisie Pluginu, a następnie ponownie uruchomić usługę Node:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

Należy zainstalować GeoClue2 i jego wersję demonstracyjną `where-am-i` (`geoclue-2-demo` w systemach Debian i Ubuntu). Użytkownik usługi Node musi być dopuszczony przez zasady GeoClue hosta i agenta autoryzacji.

Plugin używa `where-am-i` zamiast sekwencji wywołań `busctl`. GeoClue wiąże utworzenie klienta, właściwości, uruchomienie, aktualizacje i zatrzymanie z jednym połączeniem klienta D-Bus; wersja demonstracyjna zachowuje cały ten cykl życia, natomiast osobne podprocesy `busctl` tego nie zapewniają. Nie dodaje się żadnej zależności npm.

Linux mapuje `coarse`, `balanced` i `precise` na poziomy dokładności GeoClue: `4`, `6` i `8`. Weryfikuje `maxAgeMs` względem zwróconego znacznika czasu. Wersja demonstracyjna GeoClue nie udostępnia wybranego dostawcy, dlatego `source` ma wartość `unknown`; `isPrecise` ma wartość true tylko wtedy, gdy zgłoszona dokładność wynosi 100 metrów lub mniej.

Linux używa tych samych stabilnych błędów: `LOCATION_DISABLED`, `LOCATION_TIMEOUT` i `LOCATION_UNAVAILABLE`.

## Integracja z modelem i narzędziami

- Narzędzie agenta: akcja `location_get` narzędzia `nodes` (wymagany Node).
- CLI: `openclaw nodes location get --node <id>`.
- Wytyczne dla agenta: wywoływać tylko wtedy, gdy użytkownik włączył lokalizację i rozumie zakres jej udostępniania.

## Teksty interfejsu (sugerowane)

- Wyłączone: „Udostępnianie lokalizacji jest wyłączone”.
- Podczas używania: „Tylko gdy aplikacja OpenClaw jest otwarta”.
- Zawsze: „Zezwalaj na żądane sprawdzanie lokalizacji, gdy aplikacja OpenClaw działa w tle”.
- Dokładna: „Używaj dokładnej lokalizacji GPS. Wyłącz tę opcję, aby udostępniać przybliżoną lokalizację”.

## Powiązane

- [Omówienie węzłów](/pl/nodes)
- [Analizowanie lokalizacji kanału](/pl/channels/location)
- [Przechwytywanie obrazu z kamery](/pl/nodes/camera)
- [Tryb rozmowy](/pl/nodes/talk)
