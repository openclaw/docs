---
read_when:
    - Unterstützung für Standort-Nodes oder eine Berechtigungs-UI hinzufügen
    - Android-Standortberechtigungen oder Vordergrundverhalten gestalten
summary: Standortbefehl für Nodes (location.get), Berechtigungsmodi und Vordergrundverhalten unter Android
title: Standortbefehl
x-i18n:
    generated_at: "2026-05-06T06:55:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Kurzfassung

- `location.get` ist ein Node-Befehl (über `node.invoke`).
- Standardmäßig deaktiviert.
- Android-App-Einstellungen verwenden eine Auswahl: Aus / Während der Nutzung.
- Separater Schalter: Genauer Standort.

## Warum eine Auswahl (nicht nur ein Schalter)

OS-Berechtigungen haben mehrere Ebenen. Wir können in der App eine Auswahl bereitstellen, aber das OS entscheidet weiterhin über die tatsächlich gewährte Berechtigung.

- iOS/macOS können **Während der Nutzung** oder **Immer** in Systemabfragen/Einstellungen anzeigen.
- Die Android-App unterstützt derzeit nur Standortzugriff im Vordergrund.
- Genauer Standort ist eine separate Berechtigung (iOS 14+ „Genau“, Android „fine“ vs. „coarse“).

Die Auswahl in der UI steuert unseren angeforderten Modus; die tatsächliche Berechtigung liegt in den OS-Einstellungen.

## Einstellungsmodell

Pro Node-Gerät:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI-Verhalten:

- Die Auswahl von `whileUsing` fordert Vordergrundberechtigung an.
- Wenn das OS die angeforderte Ebene verweigert, auf die höchste gewährte Ebene zurücksetzen und den Status anzeigen.

## Berechtigungszuordnung (node.permissions)

Optional. macOS-Node meldet `location` über die Berechtigungszuordnung; iOS/Android können dies auslassen.

## Befehl: `location.get`

Aufgerufen über `node.invoke`.

Parameter (vorgeschlagen):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Antwort-Payload:

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

- `LOCATION_DISABLED`: Auswahl ist aus.
- `LOCATION_PERMISSION_REQUIRED`: Berechtigung für den angeforderten Modus fehlt.
- `LOCATION_BACKGROUND_UNAVAILABLE`: App läuft im Hintergrund, aber nur Während der Nutzung ist erlaubt.
- `LOCATION_TIMEOUT`: Keine Positionsbestimmung innerhalb der Zeit.
- `LOCATION_UNAVAILABLE`: Systemfehler / keine Provider.

## Verhalten im Hintergrund

- Android-App verweigert `location.get`, während sie im Hintergrund läuft.
- Halten Sie OpenClaw geöffnet, wenn Sie unter Android Standort anfordern.
- Andere Node-Plattformen können abweichen.

## Modell-/Tooling-Integration

- Tool-Oberfläche: Das `nodes`-Tool fügt die Aktion `location_get` hinzu (Node erforderlich).
- CLI: `openclaw nodes location get --node <id>`.
- Agent-Richtlinien: Nur aufrufen, wenn der Benutzer Standort aktiviert hat und den Umfang versteht.

## UX-Text (vorgeschlagen)

- Aus: „Standortfreigabe ist deaktiviert.“
- Während der Nutzung: „Nur wenn OpenClaw geöffnet ist.“
- Genauer Standort: „Genauen GPS-Standort verwenden. Deaktivieren, um ungefähren Standort zu teilen.“

## Verwandt

- [Channel-Standortparsing](/de/channels/location)
- [Kameraaufnahme](/de/nodes/camera)
- [Sprechmodus](/de/nodes/talk)
