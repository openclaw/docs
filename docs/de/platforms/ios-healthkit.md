---
read_when:
    - HealthKit-Zusammenfassungen auf einem iOS-Node aktivieren
    - Aufrufen von health.summary oder Fehlerbehebung bei fehlenden Integritätsmetriken
    - Überprüfen, welche Gesundheitsdaten ein iOS-Gerät verlassen können
summary: Datenschutzgeschützte HealthKit-Zusammenfassungen von einem iOS-Node aktivieren und aufrufen
title: HealthKit-Zusammenfassungen
x-i18n:
    generated_at: "2026-07-24T03:57:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8ac13d2870c55e2083a5e3a14c3d04238c2780a9e83d091f31923eb738476af
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit-Zusammenfassungen

OpenClaw kann von einer verbundenen iPhone- oder iPad-Node eine schreibgeschützte Zusammenfassung des aktuellen Kalendertags anfordern. Das Gerät berechnet das Aggregat lokal und gibt nur die Schrittzahl, Schlafdauer, durchschnittliche Ruheherzfrequenz sowie Anzahl und Dauer der Trainings zurück. Einzelne HealthKit-Proben, Quellen, Metadaten, klinische Aufzeichnungen, Hintergrundimport und Schreibvorgänge werden nicht unterstützt.

Diese Funktion ist standardmäßig deaktiviert. Sie erfordert eine separate Einwilligung auf dem iOS-Gerät und eine Autorisierung am Gateway.

## Voraussetzungen

- Ein iPhone oder iPad, auf dem die OpenClaw-iOS-App ausgeführt wird und für das HealthKit Gesundheitsdaten als verfügbar meldet.
- Eine verbundene und genehmigte iOS-Node. Siehe [Einrichtung der iOS-App](/de/platforms/ios).
- Ein aktuelles Gateway, das die iOS-Node erreichen kann.
- Lesbare Gesundheitsdaten für alle Metriken, die Sie anzeigen möchten. Eine Apple Watch kann Daten zum Apple-Health-Speicher beitragen, die OpenClaw-watchOS-App ist für HealthKit-Zusammenfassungen jedoch nicht erforderlich.

## Zugriff aktivieren

### 1. Gateway-Befehl autorisieren

Fügen Sie `health.summary` zum vorhandenen Array `gateway.nodes.commands.allow` in
`openclaw.json` hinzu. Behalten Sie alle bereits vorhandenen Befehle bei:

```json5
{
  gateway: {
    nodes: {
      commands: { allow: ["health.summary"] },
    },
  },
}
```

`health.summary` ist als besonders datenschutzrelevant eingestuft und wird von der
Standardeinstellung der iOS-Plattform niemals zugelassen. Ein Eintrag in `gateway.nodes.commands.deny` setzt den
Zulassungseintrag außer Kraft. Siehe [Node-Befehlsrichtlinie](/de/nodes#command-policy).

### 2. Freigabe auf dem iOS-Gerät aktivieren

In der iOS-App:

1. Öffnen Sie **Settings -> Permissions** und suchen Sie im stets sichtbaren Abschnitt **Apple Health** nach **Apple Health Summaries**.
2. Tippen Sie auf **Enable Apple Health Summaries**.
3. Lesen Sie den Hinweis und wählen Sie anschließend im Berechtigungsdialog von Apple aus, welche Health-Kategorien OpenClaw lesen darf.

Der Schalter erfasst Ihre ausdrückliche Entscheidung zur Freigabe für OpenClaw. Er bedeutet nicht,
dass Apple jede angeforderte Kategorie genehmigt hat.

Durch die Aktivierung der Health-Zusammenfassungen wird `health.summary` zur deklarierten Befehlsoberfläche
der Node hinzugefügt. Genehmigen Sie die dadurch entstandene Aktualisierung der Node-Kopplung:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Prüfen Sie anschließend, ob das verbundene iOS-Gerät tatsächlich einen
`health.summary`-Befehl bereitstellt:

```bash
openclaw nodes describe --node "<iOS device name>"
```

## Heutige Zusammenfassung anfordern

Es wird nur `today` unterstützt. Der Zeitraum reicht von der lokalen Mitternacht bis zum Zeitpunkt der Anfrage
und verwendet den aktuellen Kalender und die aktuelle Zeitzone des iOS-Geräts.

```bash
openclaw nodes invoke \
  --node "<iOS device name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Agenten können denselben Befehl mit dem Tool `nodes` aufrufen:

```json
{
  "action": "invoke",
  "node": "<iOS device name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

Die Zusammenfassungsnutzlast enthält:

| Feld                     | Bedeutung                                              |
| ------------------------ | ------------------------------------------------------ |
| `period`                 | Immer `today`                                         |
| `startISO`               | Lokaler Tagesbeginn, als ISO-Zeitpunkt codiert         |
| `endISO`                 | Zeitpunkt der Anfrage, als ISO-Zeitpunkt codiert       |
| `timeZoneIdentifier`     | Zeitzonenkennung des iOS-Geräts                        |
| `stepCount`              | Gerundete kumulierte Schrittzahl                       |
| `sleepDurationMinutes`   | Deduplizierte Schlafzeit, auf den heutigen Tag begrenzt |
| `restingHeartRateBpm`    | Durchschnittliche Ruheherzfrequenz                     |
| `workoutCount`           | Heute begonnene Trainings                              |
| `workoutDurationMinutes` | Gesamtdauer dieser Trainings                           |

Metrikfelder sind optional und werden ausgelassen, wenn HealthKit keinen lesbaren
Wert zurückgibt. Schlafphasen und sich überschneidende Quellen werden vor der Berechnung
der Dauer zusammengeführt, sodass dieselbe Minute nicht doppelt gezählt wird.

## Datenschutzverhalten

- Die Aggregation erfolgt auf dem iOS-Gerät. Rohproben verlassen das Gerät nicht.
- Das angeforderte Aggregat verlässt das Gerät über Ihr Gateway. Wenn ein Agent
  es anfordert, gelangt das Aggregat zum konfigurierten KI-Provider und kann im
  Chatverlauf verbleiben. Bei einem direkten CLI-Aufruf wird es an die Person zurückgegeben, die die CLI bedient.
- OpenClaw fordert ausschließlich Lesezugriff an. Es kann keine Gesundheitsdaten hinzufügen oder ändern.
- OpenClaw liest HealthKit nur, wenn `health.summary` aufgerufen wird. Es findet kein
  Hintergrundimport von Gesundheitsdaten statt.
- HealthKit legt absichtlich nicht offen, ob der Lesezugriff verweigert wurde. Eine
  fehlende Metrik kann auf einen verweigerten Zugriff, fehlende passende Proben oder einen nicht verfügbaren
  Datentyp zurückzuführen sein. OpenClaw kann diese Fälle nicht unterscheiden.
- Die Zusammenfassung dient dem persönlichen Gesundheits- und Fitnesskontext, nicht der Diagnose oder
  medizinischen Beratung.

Um die Freigabe zu beenden, kehren Sie zu **Apple Health Summaries** zurück und tippen Sie auf **Turn Off Summaries**.
Das iOS-Gerät entfernt anschließend die Health-Fähigkeit und den Befehl `health.summary` von seiner
Node-Oberfläche. Sie können außerdem `health.summary` aus
`gateway.nodes.commands.allow` entfernen, um die Gateway-Seite der Zugriffssperre zu schließen.

## Fehlerbehebung

### Befehl ist von der Node nicht deklariert

Vergewissern Sie sich, dass Apple-Health-Zusammenfassungen in der iOS-App aktiviert sind und das Gerät verbunden ist.
Führen Sie `openclaw nodes pending` aus, genehmigen Sie etwaige Aktualisierungen der Fähigkeiten und prüfen Sie anschließend
`openclaw nodes describe --node "<iOS device name>"` erneut.

### Befehl erfordert ausdrückliche Zustimmung

Fügen Sie `health.summary` zu `gateway.nodes.commands.allow` hinzu. Prüfen Sie außerdem, dass
`gateway.nodes.commands.deny` den Eintrag nicht enthält; die Sperrliste hat Vorrang.

### `HEALTH_ACCESS_DISABLED`

Der Freigabeschalter in der App ist deaktiviert. Aktivieren Sie auf dem iOS-Gerät **Apple Health Summaries** unter
**Settings -> Permissions -> Apple Health**.

### Zusammenfassung ist erfolgreich, aber Metriken fehlen

Öffnen Sie Apples Health-App und vergewissern Sie sich, dass für heute Daten vorhanden sind. Überprüfen Sie
den Zugriff von OpenClaw in den Health-Einstellungen von Apple. Betrachten Sie ein leeres Ergebnis jedoch nicht
als Beleg dafür, dass der Zugriff verweigert wurde: HealthKit verbirgt diese Unterscheidung absichtlich.

### Ältere Zeiträume schlagen fehl

Der Befehl akzeptiert nur `{"period":"today"}`. Mehrtägige und historische
Zusammenfassungen werden nicht unterstützt.

## Verwandte Themen

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Referenz zur Gateway-Konfiguration](/de/gateway/configuration-reference#gateway)
- [Sicherheitsaudit](/de/gateway/security)
