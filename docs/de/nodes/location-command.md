---
read_when:
    - Unterstützung für Standort-Nodes oder eine Berechtigungsoberfläche hinzufügen
    - Android-Standortberechtigungen oder Vordergrundverhalten gestalten
summary: Standortbefehl für Nodes (location.get), Berechtigungsmodi und Android-Vordergrundverhalten
title: Standortbefehl
x-i18n:
    generated_at: "2026-07-12T15:28:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## Kurzfassung

- `location.get` ist ein Node-Befehl, der über `node.invoke` oder `openclaw nodes location get` aufgerufen wird.
- Standardmäßig deaktiviert.
- Android-Builds von Drittanbietern verwenden eine Auswahl: Aus / Während der Nutzung / Immer. Play-Builds bieten weiterhin Aus / Während der Nutzung.
- Der genaue Standort ist ein separater Schalter.

## Warum eine Auswahl (und nicht nur ein Schalter)

Betriebssystemberechtigungen für den Standort haben mehrere Stufen. Der genaue Standort ist ebenfalls eine separate Betriebssystemberechtigung (ab iOS 14 „Precise“, unter Android „fine“ gegenüber „coarse“). Die Auswahl in der App bestimmt den angeforderten Modus, das Betriebssystem entscheidet jedoch weiterhin über die tatsächlich erteilte Berechtigung.

## Einstellungsmodell

Pro Node-Gerät:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Verhalten der Benutzeroberfläche:

- Bei Auswahl von `whileUsing` wird die Berechtigung für die Nutzung im Vordergrund angefordert.
- Bei Auswahl von `always` fordert der Android-Drittanbieter-Build zunächst die Berechtigung für die Nutzung im Vordergrund an, erläutert den Hintergrundzugriff und öffnet anschließend die Android-App-Einstellungen für die separate Berechtigung **Allow all the time**.
- Android-Play-Builds deklarieren keine Berechtigung für den Standortzugriff im Hintergrund und zeigen `always` nicht an.
- Wenn das Betriebssystem die angeforderte Stufe verweigert, wechselt die App zur höchsten erteilten Stufe zurück und zeigt den Status an.

## Berechtigungszuordnung (node.permissions)

Optional. Der macOS-Node meldet `location` über die `permissions`-Zuordnung in `node.list`/`node.describe`; unter iOS/Android kann diese Angabe fehlen.

## Befehl: `location.get`

Aufruf über `node.invoke` oder die CLI-Hilfsfunktion:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Parameter:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Die CLI-Flags werden direkt zugeordnet: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Antwortnutzlast:

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

Fehler (stabile Codes):

- `LOCATION_DISABLED`: Die Auswahl ist auf „Aus“ gestellt.
- `LOCATION_PERMISSION_REQUIRED`: Die Berechtigung für den angeforderten Modus fehlt.
- `LOCATION_BACKGROUND_UNAVAILABLE`: Die App befindet sich im Hintergrund, aber es wurde nur „Während der Nutzung“ gewährt.
- `LOCATION_TIMEOUT`: Keine rechtzeitige Standortbestimmung.
- `LOCATION_UNAVAILABLE`: Systemfehler oder keine Provider verfügbar.

## Verhalten im Hintergrund

- Android-Builds von Drittanbietern akzeptieren `location.get` im Hintergrund nur, wenn der Benutzer `Always` ausgewählt und Android den Standortzugriff im Hintergrund gewährt hat. Der vorhandene persistente Node-Dienst fügt den Diensttyp `location` hinzu und weist während seiner Aktivität auf `Location: Always` hin.
- Android-Play-Builds und der Modus `While Using` verweigern `location.get`, während sich die App im Hintergrund befindet.
- Andere Node-Plattformen können sich anders verhalten.

## Modell-/Tooling-Integration

- Agenten-Tool: die Aktion `location_get` des Tools `nodes` (Node erforderlich).
- CLI: `openclaw nodes location get --node <id>`.
- Agentenrichtlinien: Nur aufrufen, wenn der Benutzer den Standort aktiviert hat und den Umfang versteht.

## UX-Text (Vorschlag)

- Aus: „Die Standortfreigabe ist deaktiviert.“
- Während der Nutzung: „Nur wenn OpenClaw geöffnet ist.“
- Immer: „Angeforderte Standortprüfungen zulassen, während OpenClaw im Hintergrund ausgeführt wird.“
- Genauer Standort: „Genauen GPS-Standort verwenden. Deaktivieren Sie diese Option, um den ungefähren Standort zu teilen.“

## Verwandte Themen

- [Node-Übersicht](/de/nodes)
- [Standortanalyse für Kanäle](/de/channels/location)
- [Kameraaufnahme](/de/nodes/camera)
- [Sprechmodus](/de/nodes/talk)
