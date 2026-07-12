---
read_when:
    - Einrichten autonomer Agenten-Workflows, die ohne Aufforderung für jede einzelne Aufgabe ausgeführt werden
    - Festlegen, was der Agent selbstständig tun kann und wofür eine menschliche Genehmigung erforderlich ist
    - Strukturierung von Multi-Programm-Agenten mit klaren Grenzen und Eskalationsregeln
summary: Definieren Sie dauerhafte operative Befugnisse für autonome Agentenprogramme
title: Daueraufträge
x-i18n:
    generated_at: "2026-07-12T14:58:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Daueraufträge erteilen Ihrem Agenten **dauerhafte Handlungsbefugnis** für definierte Programme. Statt den Agenten bei jeder Aufgabe einzeln anzuweisen, definieren Sie Programme mit eindeutigem Umfang, Auslösern und Eskalationsregeln. Der Agent führt sie innerhalb dieser Grenzen autonom aus: „Sie sind für den wöchentlichen Bericht verantwortlich. Erstellen und versenden Sie ihn jeden Freitag, und eskalieren Sie nur, wenn etwas ungewöhnlich erscheint.“

## Warum Daueraufträge

**Ohne Daueraufträge:** Sie weisen den Agenten bei jeder Aufgabe einzeln an, Routinearbeiten werden vergessen oder verzögert, und Sie werden zum Engpass.

**Mit Daueraufträgen:** Der Agent arbeitet innerhalb definierter Grenzen autonom, Routinearbeiten werden planmäßig erledigt, und Sie werden nur bei Ausnahmen und erforderlichen Genehmigungen einbezogen.

## Funktionsweise

Daueraufträge werden in den Dateien Ihres [Agent-Arbeitsbereichs](/de/concepts/agent-workspace) definiert. Es wird empfohlen, sie direkt in `AGENTS.md` aufzunehmen (die Datei wird in jeder Sitzung automatisch eingefügt), damit sie dem Agenten stets als Kontext zur Verfügung stehen. Für umfangreichere Konfigurationen können Sie sie auch in einer eigenen Datei wie `standing-orders.md` ablegen und aus `AGENTS.md` darauf verweisen.

Jedes Programm legt Folgendes fest:

1. **Umfang** - wozu der Agent berechtigt ist
2. **Auslöser** - wann die Ausführung erfolgt (Zeitplan, Ereignis oder Bedingung)
3. **Genehmigungsschranken** - was vor der Ausführung eine menschliche Freigabe erfordert
4. **Eskalationsregeln** - wann der Agent anhalten und um Hilfe bitten muss

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Arbeitsbereichs (die vollständige Liste der automatisch eingefügten Dateien finden Sie unter [Agent-Arbeitsbereich](/de/concepts/agent-workspace)) und führt sie in Kombination mit [Cron-Jobs](/de/automation/cron-jobs) zur zeitgesteuerten Durchsetzung aus.

<Tip>
Legen Sie Daueraufträge in `AGENTS.md` ab, um sicherzustellen, dass sie in jeder Sitzung geladen werden. Der Arbeitsbereich-Bootstrap fügt `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` automatisch ein – jedoch keine beliebigen Dateien in Unterverzeichnissen.
</Tip>

## Aufbau eines Dauerauftrags

```markdown
## Programm: Wöchentlicher Statusbericht

**Befugnis:** Daten zusammenstellen, Bericht erstellen und an Beteiligte übermitteln
**Auslöser:** Jeden Freitag um 16 Uhr (über einen Cron-Job durchgesetzt)
**Genehmigungsschranke:** Keine für Standardberichte. Auffälligkeiten zur menschlichen Prüfung kennzeichnen.
**Eskalation:** Wenn eine Datenquelle nicht verfügbar ist oder Kennzahlen ungewöhnlich erscheinen (>2σ von der Norm)

### Ausführungsschritte

1. Kennzahlen aus den konfigurierten Quellen abrufen
2. Mit der Vorwoche und den Zielwerten vergleichen
3. Bericht unter Reports/weekly/YYYY-MM-DD.md erstellen
4. Zusammenfassung über den konfigurierten Kanal übermitteln
5. Abschluss unter Agent/Logs/ protokollieren

### Was NICHT zu tun ist

- Berichte nicht an externe Parteien senden
- Quelldaten nicht ändern
- Die Übermittlung nicht auslassen, wenn Kennzahlen schlecht aussehen – korrekt berichten
```

## Daueraufträge und Cron-Jobs

Daueraufträge definieren, **wozu** der Agent berechtigt ist. [Cron-Jobs](/de/automation/cron-jobs) definieren, **wann** dies geschieht. Sie wirken zusammen:

```text
Dauerauftrag: „Sie sind für die tägliche Posteingangssichtung verantwortlich“
    ↓
Cron-Job (täglich um 8 Uhr): „Posteingangssichtung gemäß den Daueraufträgen ausführen“
    ↓
Agent: Liest Daueraufträge → führt Schritte aus → meldet Ergebnisse
```

Der Prompt des Cron-Jobs sollte auf den Dauerauftrag verweisen, statt ihn zu duplizieren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Tägliche Posteingangssichtung gemäß den Daueraufträgen ausführen. E-Mails auf neue Warnmeldungen prüfen. Jedes Element analysieren, kategorisieren und dauerhaft speichern. Dem Verantwortlichen eine Zusammenfassung melden. Unbekannte Fälle eskalieren."
```

## Beispiele

### Beispiel 1: Inhalte und soziale Medien (wöchentlicher Zyklus)

```markdown
## Programm: Inhalte und soziale Medien

**Befugnis:** Inhalte entwerfen, Beiträge planen und Interaktionsberichte zusammenstellen
**Genehmigungsschranke:** Alle Beiträge erfordern in den ersten 30 Tagen die Prüfung durch den Verantwortlichen, danach gilt eine dauerhafte Freigabe
**Auslöser:** Wöchentlicher Zyklus (Prüfung am Montag → Entwürfe unter der Woche → Kurzbericht am Freitag)

### Wöchentlicher Zyklus

- **Montag:** Plattformkennzahlen und Publikumsinteraktionen prüfen
- **Dienstag–Donnerstag:** Beiträge für soziale Medien entwerfen und Blog-Inhalte erstellen
- **Freitag:** Wöchentlichen Marketing-Kurzbericht zusammenstellen → an den Verantwortlichen übermitteln

### Inhaltsregeln

- Der Sprachstil muss zur Marke passen (siehe SOUL.md oder Leitfaden zur Markenstimme)
- In öffentlich sichtbaren Inhalten niemals als KI auftreten
- Kennzahlen einbeziehen, sofern verfügbar
- Auf den Mehrwert für das Publikum konzentrieren, nicht auf Eigenwerbung
```

### Beispiel 2: Finanzvorgänge (ereignisgesteuert)

```markdown
## Programm: Finanzverarbeitung

**Befugnis:** Transaktionsdaten verarbeiten, Berichte erstellen und Zusammenfassungen senden
**Genehmigungsschranke:** Keine für Analysen. Empfehlungen erfordern die Genehmigung des Verantwortlichen.
**Auslöser:** Neue Datendatei erkannt ODER planmäßiger monatlicher Zyklus

### Wenn neue Daten eingehen

1. Neue Datei im vorgesehenen Eingabeverzeichnis erkennen
2. Alle Transaktionen analysieren und kategorisieren
3. Mit den Budgetzielen vergleichen
4. Kennzeichnen: ungewöhnliche Posten, Schwellenwertüberschreitungen, neue wiederkehrende Abbuchungen
5. Bericht im vorgesehenen Ausgabeverzeichnis erstellen
6. Zusammenfassung über den konfigurierten Kanal an den Verantwortlichen übermitteln

### Eskalationsregeln

- Einzelner Posten > $500: sofortige Warnmeldung
- Kategorie um 20% über dem Budget: im Bericht kennzeichnen
- Nicht identifizierbare Transaktion: Verantwortlichen um Kategorisierung bitten
- Verarbeitung nach 2 Wiederholungsversuchen fehlgeschlagen: Fehler melden, nicht raten
```

### Beispiel 3: Überwachung und Warnmeldungen (kontinuierlich)

```markdown
## Programm: Systemüberwachung

**Befugnis:** Systemzustand prüfen, Dienste neu starten und Warnmeldungen senden
**Genehmigungsschranke:** Dienste automatisch neu starten. Eskalieren, wenn der Neustart zweimal fehlschlägt.
**Auslöser:** Bei jedem Heartbeat-Zyklus

### Prüfungen

- Endpunkte zur Dienstzustandsprüfung antworten
- Freier Speicherplatz liegt über dem Schwellenwert
- Ausstehende Aufgaben sind nicht veraltet (>24 Stunden)
- Übermittlungskanäle sind funktionsfähig

### Reaktionsmatrix

| Bedingung                   | Aktion                                      | Eskalieren?                              |
| --------------------------- | ------------------------------------------- | ---------------------------------------- |
| Dienst nicht verfügbar      | Automatisch neu starten                     | Nur wenn der Neustart 2-mal fehlschlägt |
| Freier Speicherplatz < 10%  | Verantwortlichen warnen                     | Ja                                       |
| Veraltete Aufgabe > 24h     | Verantwortlichen erinnern                   | Nein                                     |
| Kanal offline               | Protokollieren und im nächsten Zyklus erneut versuchen | Wenn länger als 2 Stunden offline |
```

## Ausführen-Prüfen-Melden-Muster

Daueraufträge funktionieren am besten in Verbindung mit strenger Ausführungsdisziplin. Jede Aufgabe eines Dauerauftrags sollte diesem Ablauf folgen:

1. **Ausführen** - Die eigentliche Arbeit erledigen (die Anweisung nicht nur bestätigen)
2. **Prüfen** - Bestätigen, dass das Ergebnis korrekt ist (Datei vorhanden, Nachricht übermittelt, Daten analysiert)
3. **Melden** - Dem Verantwortlichen mitteilen, was erledigt und was geprüft wurde

```markdown
### Ausführungsregeln

- Jede Aufgabe folgt dem Muster Ausführen-Prüfen-Melden. Keine Ausnahmen.
- „Ich werde das erledigen“ ist keine Ausführung. Erledigen Sie es und melden Sie anschließend das Ergebnis.
- „Erledigt“ ohne Prüfung ist nicht akzeptabel. Weisen Sie es nach.
- Wenn die Ausführung fehlschlägt: einmal mit einer angepassten Vorgehensweise erneut versuchen.
- Wenn sie weiterhin fehlschlägt: Fehler mit Diagnose melden. Niemals stillschweigend scheitern.
- Niemals unbegrenzt wiederholen – höchstens 3 Versuche, danach eskalieren.
```

Dieses Muster verhindert den häufigsten Fehlermodus eines Agenten: eine Aufgabe zu bestätigen, ohne sie abzuschließen.

## Architektur mit mehreren Programmen

Für Agenten, die mehrere Aufgabenbereiche verwalten, sollten Daueraufträge als separate Programme mit klaren Grenzen organisiert werden:

```markdown
## Programm 1: [Bereich A] (Wöchentlich)

...

## Programm 2: [Bereich B] (Monatlich + auf Anforderung)

...

## Programm 3: [Bereich C] (Bei Bedarf)

...

## Eskalationsregeln (Alle Programme)

- [Gemeinsame Eskalationskriterien]
- [Genehmigungsschranken, die programmübergreifend gelten]
```

Jedes Programm sollte Folgendes besitzen:

- Einen eigenen **Auslöserrhythmus** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Genehmigungsschranken** (einige Programme benötigen mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Bewährte Vorgehensweisen

### Empfohlen

- Beginnen Sie mit eng begrenzten Befugnissen und erweitern Sie sie mit wachsendem Vertrauen
- Definieren Sie explizite Genehmigungsschranken für risikoreiche Aktionen
- Fügen Sie Abschnitte mit „Was NICHT zu tun ist“ ein – Grenzen sind ebenso wichtig wie Berechtigungen
- Kombinieren Sie Daueraufträge mit Cron-Jobs für eine zuverlässige zeitgesteuerte Ausführung
- Prüfen Sie die Agentenprotokolle wöchentlich, um sicherzustellen, dass die Daueraufträge eingehalten werden
- Aktualisieren Sie Daueraufträge, wenn sich Ihre Anforderungen ändern – sie sind lebende Dokumente

### Zu vermeiden

- Erteilen Sie nicht gleich am ersten Tag weitreichende Befugnisse („Tun Sie, was Sie für am besten halten“)
- Lassen Sie Eskalationsregeln nicht aus – jedes Programm benötigt eine Klausel dazu, wann anzuhalten und nachzufragen ist
- Gehen Sie nicht davon aus, dass der Agent sich an mündliche Anweisungen erinnert – schreiben Sie alles in die Datei
- Vermischen Sie keine Aufgabenbereiche in einem einzigen Programm – verwenden Sie separate Programme für separate Bereiche
- Vergessen Sie nicht die Durchsetzung durch Cron-Jobs – Daueraufträge ohne Auslöser werden zu bloßen Empfehlungen

## Verwandte Themen

- [Automatisierung](/de/automation): alle Automatisierungsmechanismen auf einen Blick.
- [Cron-Jobs](/de/automation/cron-jobs): zeitgesteuerte Durchsetzung von Daueraufträgen.
- [Hooks](/de/automation/hooks): ereignisgesteuerte Skripte für Ereignisse im Lebenszyklus eines Agenten.
- [Webhooks](/de/automation/cron-jobs#webhooks): eingehende HTTP-Ereignisauslöser.
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace): der Speicherort von Daueraufträgen, einschließlich der vollständigen Liste der automatisch eingefügten Bootstrap-Dateien (`AGENTS.md`, `SOUL.md` usw.).
