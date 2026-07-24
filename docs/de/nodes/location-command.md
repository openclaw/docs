---
read_when:
    - Unterstützung für Standort-Nodes oder eine Berechtigungsoberfläche hinzufügen
    - Android-Standortberechtigungen oder Vordergrundverhalten entwerfen
summary: Standortbefehl für Nodes, Berechtigungsmodi der Plattform und GeoClue-Einrichtung unter Linux
title: Standortbefehl
x-i18n:
    generated_at: "2026-07-24T05:03:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` ist ein Node-Befehl, der über `node.invoke` oder `openclaw nodes location get` aufgerufen wird.
- Standardmäßig deaktiviert.
- Android-Builds von Drittanbietern verwenden eine Auswahl: Aus / Während der Nutzung / Immer. Play-Builds bieten weiterhin Aus / Während der Nutzung.
- Der genaue Standort wird über einen separaten Schalter gesteuert.

## Warum eine Auswahl (und nicht nur ein Schalter)

Die Standortberechtigungen des Betriebssystems haben mehrere Stufen. Auch der genaue Standort ist eine separate Betriebssystemberechtigung (ab iOS 14 „Genau“, unter Android „genau“ gegenüber „ungefähr“). Die Auswahl in der App bestimmt den angeforderten Modus, doch das Betriebssystem entscheidet weiterhin über die tatsächlich erteilte Berechtigung.

## Einstellungsmodell

Pro Node-Gerät:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UI-Verhalten:

- Bei Auswahl von `whileUsing` wird die Vordergrundberechtigung angefordert.
- Bei Auswahl von `always` im Android-Build eines Drittanbieters wird zuerst die Vordergrundberechtigung angefordert, anschließend der Hintergrundzugriff erläutert und dann die Android-App-Einstellungen für die separate Berechtigung **Allow all the time** geöffnet.
- Android-Play-Builds deklarieren keine Berechtigung für den Standortzugriff im Hintergrund und zeigen `always` nicht an.
- Wenn das Betriebssystem die angeforderte Stufe verweigert, setzt die App die Auswahl auf die höchste erteilte Stufe zurück und zeigt den Status an.

## Berechtigungszuordnung (node.permissions)

Optional. Der macOS-Node meldet `location` über die `permissions`-Zuordnung für `node.list`/`node.describe`; unter iOS/Android kann diese Angabe fehlen.

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

- `LOCATION_DISABLED`: Die Auswahl ist auf „Aus“ gesetzt.
- `LOCATION_PERMISSION_REQUIRED`: Die Berechtigung für den angeforderten Modus fehlt.
- `LOCATION_BACKGROUND_UNAVAILABLE`: Die App befindet sich im Hintergrund, aber es wurde nur „Während der Nutzung“ gewährt.
- `LOCATION_TIMEOUT`: Innerhalb der vorgegebenen Zeit wurde keine Position ermittelt.
- `LOCATION_UNAVAILABLE`: Systemfehler oder keine Provider.

## Verhalten im Hintergrund

- Android-Builds von Drittanbietern akzeptieren `location.get` im Hintergrund nur, wenn der Benutzer `Always` ausgewählt und Android den Standortzugriff im Hintergrund gewährt hat. Der vorhandene persistente Node-Dienst fügt den Diensttyp `location` hinzu und weist während der Aktivität auf `Location: Always` hin.
- Android-Play-Builds und der Modus `While Using` verweigern `location.get`, während sich die App im Hintergrund befindet.
- Andere Node-Plattformen können sich abweichend verhalten.

## Linux-Node-Host

Das gebündelte Linux-Node-Plugin fügt dem CLI-Dienst `openclaw node` die Funktion `location.get` hinzu, einschließlich Headless-Hosts ohne die Linux-Desktop-App. Der Standort ist standardmäßig deaktiviert. Aktivieren Sie ihn im Plugin-Eintrag und starten Sie anschließend den Node-Dienst neu:

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

Installieren Sie GeoClue2 und dessen Demo `where-am-i` (`geoclue-2-demo` unter Debian und Ubuntu). Der Benutzer des Node-Dienstes muss durch die GeoClue-Richtlinie und den Autorisierungs-Agenten des Hosts zugelassen sein.

Das Plugin verwendet `where-am-i` anstelle einer Folge von `busctl`-Aufrufen. GeoClue bindet die Client-Erstellung, Eigenschaften, den Start, Aktualisierungen und das Beenden an eine einzige D-Bus-Clientverbindung; die Demo hält diesen Lebenszyklus zusammen, einzelne `busctl`-Unterprozesse hingegen nicht. Es wird keine npm-Abhängigkeit hinzugefügt.

Linux ordnet `coarse`, `balanced` und `precise` den GeoClue-Genauigkeitsstufen `4`, `6` und `8` zu. `maxAgeMs` wird anhand des zurückgegebenen Zeitstempels validiert. Die GeoClue-Demo stellt den ausgewählten Provider nicht bereit, daher ist `source` gleich `unknown`; `isPrecise` ist nur dann wahr, wenn die gemeldete Genauigkeit 100 Meter oder besser beträgt.

Linux verwendet dieselben stabilen Fehler: `LOCATION_DISABLED`, `LOCATION_TIMEOUT` und `LOCATION_UNAVAILABLE`.

## Modell-/Tooling-Integration

- Agent-Tool: die Aktion `location_get` des Tools `nodes` (Node erforderlich).
- CLI: `openclaw nodes location get --node <id>`.
- Agent-Richtlinien: Nur aufrufen, wenn der Benutzer den Standort aktiviert hat und den Umfang versteht.

## UX-Text (Vorschlag)

- Aus: „Die Standortfreigabe ist deaktiviert.“
- Während der Nutzung: „Nur wenn OpenClaw geöffnet ist.“
- Immer: „Angeforderte Standortabfragen zulassen, während OpenClaw im Hintergrund ausgeführt wird.“
- Genau: „Den genauen GPS-Standort verwenden. Deaktivieren Sie den Schalter, um den ungefähren Standort zu teilen.“

## Verwandte Themen

- [Node-Übersicht](/de/nodes)
- [Analyse von Kanalstandorten](/de/channels/location)
- [Kameraaufnahme](/de/nodes/camera)
- [Sprechmodus](/de/nodes/talk)
