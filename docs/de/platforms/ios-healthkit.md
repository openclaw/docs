---
read_when:
    - HealthKit-Zusammenfassungen auf einem iPhone-Node aktivieren
    - Aufrufen von health.summary oder Fehlerbehebung bei fehlenden Zustandsmetriken
    - Überprüfen, welche Gesundheitsdaten ein iPhone verlassen können
summary: Datenschutzgeschützte HealthKit-Zusammenfassungen über einen iPhone-Node aktivieren und aufrufen
title: HealthKit-Zusammenfassungen
x-i18n:
    generated_at: "2026-07-16T13:13:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit-Zusammenfassungen

OpenClaw kann von einem verbundenen iPhone-Node eine schreibgeschützte Zusammenfassung des aktuellen Kalendertags anfordern. Das iPhone berechnet die aggregierten Daten auf dem Gerät und gibt nur Schritte, Schlafdauer, durchschnittliche Ruheherzfrequenz sowie Anzahl und Dauer der Trainings zurück. Einzelne HealthKit-Proben, Quellen, Metadaten, klinische Aufzeichnungen, die Datenerfassung im Hintergrund und Schreibvorgänge werden nicht unterstützt.

Diese Funktion ist standardmäßig deaktiviert. Sie erfordert eine separate Einwilligung auf dem iPhone und eine Autorisierung auf dem Gateway.

## Voraussetzungen

- Ein iPhone, auf dem die OpenClaw-iOS-App ausgeführt wird und auf dem laut HealthKit Gesundheitsdaten verfügbar sind.
- Ein verbundener und genehmigter iPhone-Node. Siehe [Einrichtung der iOS-App](/de/platforms/ios).
- Ein aktuelles Gateway, das den iPhone-Node erreichen kann.
- Lesbare Health-Daten für alle Messwerte, die Sie abrufen möchten. Eine Apple Watch kann Daten zum Health-Datenspeicher des iPhones beitragen, die OpenClaw-watchOS-App ist für HealthKit-Zusammenfassungen jedoch nicht erforderlich.

## Zugriff aktivieren

### 1. Gateway-Befehl autorisieren

Fügen Sie `health.summary` zum vorhandenen Array `gateway.nodes.allowCommands` in `openclaw.json` hinzu. Behalten Sie alle bereits vorhandenen Befehle bei:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` wird als besonders datenschutzrelevant eingestuft und ist gemäß der Standardeinstellung der iOS-Plattform niemals zulässig. Ein Eintrag in `gateway.nodes.denyCommands` überschreibt den Zulassungseintrag. Siehe [Node-Befehlsrichtlinie](/de/nodes#command-policy).

### 2. Freigabe auf dem iPhone aktivieren

In der iOS-App:

1. Öffnen Sie **Settings -> Permissions -> Privacy & Access -> Health Summaries**.
2. Tippen Sie auf **Enable & Share Summaries**.
3. Lesen Sie den Hinweis und wählen Sie anschließend im Berechtigungsdialog von Apple aus, welche Health-Kategorien OpenClaw lesen darf.

Der Schalter erfasst Ihre ausdrückliche Entscheidung zur Freigabe für OpenClaw. Er bedeutet nicht, dass Apple jede angeforderte Kategorie freigegeben hat.

Durch das Aktivieren von HealthKit-Zusammenfassungen wird `health.summary` zur deklarierten Befehlsoberfläche des Nodes hinzugefügt. Genehmigen Sie die daraus resultierende Aktualisierung der Node-Kopplung:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Überprüfen Sie anschließend, ob das verbundene iPhone tatsächlich einen Befehl `health.summary` bereitstellt:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Heutige Zusammenfassung anfordern

Nur `today` wird unterstützt. Der Zeitraum reicht von der lokalen Mitternacht bis zum Zeitpunkt der Anforderung und basiert auf dem aktuellen Kalender und der Zeitzone des iPhones.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Agenten können denselben Befehl mit dem Tool `nodes` aufrufen:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

Die Zusammenfassungsnutzlast enthält:

| Feld                     | Bedeutung                                            |
| ------------------------ | ---------------------------------------------------- |
| `period`                 | Immer `today`                                      |
| `startISO`               | Lokaler Tagesbeginn, als ISO-Zeitpunkt codiert       |
| `endISO`                 | Zeitpunkt der Anforderung, als ISO-Zeitpunkt codiert |
| `timeZoneIdentifier`     | Zeitzonenkennung des iPhones                         |
| `stepCount`              | Gerundete kumulierte Schrittzahl                     |
| `sleepDurationMinutes`   | Deduplizierte Schlafzeit, auf heute begrenzt         |
| `restingHeartRateBpm`    | Durchschnittliche Ruheherzfrequenz                   |
| `workoutCount`           | Trainings, die heute begonnen haben                  |
| `workoutDurationMinutes` | Gesamtdauer dieser Trainings                         |

Messwertfelder sind optional und werden ausgelassen, wenn HealthKit keinen lesbaren Wert zurückgibt. Schlafphasen und sich überschneidende Quellen werden vor der Berechnung der Dauer zusammengeführt, sodass dieselbe Minute nicht doppelt gezählt wird.

## Datenschutzverhalten

- Die Aggregation erfolgt auf dem iPhone. Rohdatenproben verlassen das Gerät nicht.
- Die angeforderten aggregierten Daten verlassen das iPhone über Ihr Gateway. Wenn ein Agent sie anfordert, erreichen sie den konfigurierten KI-Provider und können im Chatverlauf verbleiben. Ein direkter CLI-Aufruf gibt sie an den CLI-Bediener zurück.
- OpenClaw fordert ausschließlich Lesezugriff an. Es kann keine Health-Daten hinzufügen oder ändern.
- OpenClaw liest HealthKit nur, wenn `health.summary` aufgerufen wird. Es findet keine Erfassung von Gesundheitsdaten im Hintergrund statt.
- HealthKit gibt absichtlich nicht preis, ob der Lesezugriff verweigert wurde. Ein fehlender Messwert kann auf einen verweigerten Zugriff, fehlende passende Proben oder einen nicht verfügbaren Datentyp hinweisen. OpenClaw kann diese Fälle nicht unterscheiden.
- Die Zusammenfassung dient dem persönlichen Gesundheits- und Fitnesskontext, nicht der Diagnose oder medizinischen Beratung.

Um die Freigabe zu beenden, kehren Sie zu **Health Summaries** zurück und tippen Sie auf **Disable**. Das iPhone entfernt daraufhin die Health-Funktion und den Befehl `health.summary` aus seiner Node-Oberfläche. Sie können außerdem `health.summary` aus `gateway.nodes.allowCommands` entfernen, um die Zugriffssperre auch auf der Gateway-Seite zu schließen.

## Fehlerbehebung

### Der Befehl wird vom Node nicht deklariert

Vergewissern Sie sich, dass HealthKit-Zusammenfassungen in der iOS-App aktiviert sind und das iPhone verbunden ist. Führen Sie `openclaw nodes pending` aus, genehmigen Sie alle Funktionsaktualisierungen und prüfen Sie anschließend erneut `openclaw nodes describe --node "<iPhone name>"`.

### Der Befehl erfordert eine ausdrückliche Aktivierung

Fügen Sie `health.summary` zu `gateway.nodes.allowCommands` hinzu. Prüfen Sie außerdem, dass `gateway.nodes.denyCommands` den Eintrag nicht enthält; die Sperrliste hat Vorrang.

### `HEALTH_ACCESS_DISABLED`

Der Freigabeschalter in der App ist deaktiviert. Aktivieren Sie **Health Summaries** auf dem iPhone unter **Privacy & Access**.

### Die Zusammenfassung ist erfolgreich, aber Messwerte fehlen

Öffnen Sie die Health-App von Apple und vergewissern Sie sich, dass für heute Daten vorhanden sind. Überprüfen Sie den Zugriff von OpenClaw in den Health-Einstellungen von Apple, betrachten Sie ein leeres Ergebnis jedoch nicht als Beleg dafür, dass der Zugriff verweigert wurde: HealthKit verbirgt diese Unterscheidung absichtlich.

### Ältere Zeiträume schlagen fehl

Der Befehl akzeptiert nur `{"period":"today"}`. Mehrtägige und historische Zusammenfassungen werden nicht unterstützt.

## Verwandte Themen

- [iOS-App](/de/platforms/ios)
- [Nodes](/de/nodes)
- [Referenz zur Gateway-Konfiguration](/de/gateway/configuration-reference#gateway)
- [Sicherheitsaudit](/de/gateway/security)
