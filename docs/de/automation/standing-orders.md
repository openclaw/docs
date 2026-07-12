---
read_when:
    - Einrichten autonomer Agenten-Workflows, die ohne Aufforderung für jede einzelne Aufgabe ausgeführt werden
    - Festlegen, was der Agent selbstständig tun kann und wofür eine menschliche Genehmigung erforderlich ist
    - Strukturierung von Agenten mit mehreren Programmen durch klare Grenzen und Eskalationsregeln
summary: Definieren Sie dauerhafte Betriebsbefugnisse für autonome Agentenprogramme
title: Daueraufträge
x-i18n:
    generated_at: "2026-07-12T01:22:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Daueraufträge erteilen Ihrem Agenten **dauerhafte Handlungsbefugnis** für festgelegte Programme. Statt den Agenten für jede Aufgabe einzeln anzuweisen, definieren Sie Programme mit eindeutigem Umfang, Auslösern und Eskalationsregeln. Der Agent führt sie innerhalb dieser Grenzen autonom aus: „Sie sind für den wöchentlichen Bericht verantwortlich. Erstellen und versenden Sie ihn jeden Freitag und eskalieren Sie nur, wenn etwas ungewöhnlich erscheint.“

## Warum Daueraufträge sinnvoll sind

**Ohne Daueraufträge:** Sie weisen den Agenten bei jeder Aufgabe einzeln an, Routinearbeiten werden vergessen oder verzögern sich und Sie werden zum Engpass.

**Mit Daueraufträgen:** Der Agent arbeitet innerhalb definierter Grenzen autonom, Routinearbeiten erfolgen planmäßig und Sie werden nur bei Ausnahmen und erforderlichen Genehmigungen einbezogen.

## Funktionsweise

Daueraufträge werden in den Dateien Ihres [Agenten-Arbeitsbereichs](/de/concepts/agent-workspace) definiert. Es wird empfohlen, sie direkt in `AGENTS.md` aufzunehmen. Diese Datei wird automatisch in jede Sitzung eingefügt, sodass dem Agenten die Daueraufträge stets als Kontext vorliegen. Bei umfangreicheren Konfigurationen können Sie sie auch in einer eigenen Datei wie `standing-orders.md` ablegen und aus `AGENTS.md` darauf verweisen.

Jedes Programm legt Folgendes fest:

1. **Umfang** – wozu der Agent berechtigt ist
2. **Auslöser** – wann die Ausführung erfolgt (Zeitplan, Ereignis oder Bedingung)
3. **Genehmigungsschranken** – was vor der Ausführung eine menschliche Freigabe erfordert
4. **Eskalationsregeln** – wann die Ausführung angehalten und um Hilfe gebeten werden muss

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Arbeitsbereichs. Eine vollständige Liste der automatisch eingefügten Dateien finden Sie unter [Agenten-Arbeitsbereich](/de/concepts/agent-workspace). Er führt sie in Verbindung mit [Cron-Aufträgen](/de/automation/cron-jobs) zur zeitgesteuerten Durchsetzung aus.

<Tip>
Speichern Sie Daueraufträge in `AGENTS.md`, damit sie garantiert in jeder Sitzung geladen werden. Der Arbeitsbereich-Bootstrap fügt `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` automatisch ein – nicht jedoch beliebige Dateien in Unterverzeichnissen.
</Tip>

## Aufbau eines Dauerauftrags

```markdown
## Programm: Wöchentlicher Statusbericht

**Befugnis:** Daten zusammenstellen, Bericht erstellen, an Beteiligte übermitteln
**Auslöser:** Jeden Freitag um 16 Uhr (durch einen Cron-Auftrag durchgesetzt)
**Genehmigungsschranke:** Keine für Standardberichte. Auffälligkeiten zur menschlichen Prüfung kennzeichnen.
**Eskalation:** Wenn die Datenquelle nicht verfügbar ist oder Kennzahlen ungewöhnlich erscheinen (>2σ von der Norm)

### Ausführungsschritte

1. Kennzahlen aus konfigurierten Quellen abrufen
2. Mit der Vorwoche und den Zielwerten vergleichen
3. Bericht unter Reports/weekly/YYYY-MM-DD.md erstellen
4. Zusammenfassung über den konfigurierten Kanal übermitteln
5. Abschluss unter Agent/Logs/ protokollieren

### Was NICHT zu tun ist

- Berichte nicht an externe Parteien senden
- Quelldaten nicht verändern
- Übermittlung nicht auslassen, wenn Kennzahlen schlecht ausfallen – korrekt berichten
```

## Daueraufträge in Verbindung mit Cron-Aufträgen

Daueraufträge definieren, **wozu** der Agent berechtigt ist. [Cron-Aufträge](/de/automation/cron-jobs) definieren, **wann** dies geschieht. Beide greifen ineinander:

```text
Dauerauftrag: „Sie sind für die tägliche Posteingangssichtung verantwortlich“
    ↓
Cron-Auftrag (täglich um 8 Uhr): „Posteingangssichtung gemäß Daueraufträgen ausführen“
    ↓
Agent: Liest Daueraufträge → führt Schritte aus → meldet Ergebnisse
```

Die Anweisung des Cron-Auftrags sollte auf den Dauerauftrag verweisen, statt ihn zu duplizieren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Tägliche Posteingangssichtung gemäß Daueraufträgen ausführen. E-Mails auf neue Warnmeldungen prüfen. Jeden Eintrag analysieren, kategorisieren und dauerhaft speichern. Dem Verantwortlichen eine Zusammenfassung melden. Unbekannte Fälle eskalieren."
```

## Beispiele

### Beispiel 1: Inhalte und soziale Medien (wöchentlicher Zyklus)

```markdown
## Programm: Inhalte und soziale Medien

**Befugnis:** Inhalte entwerfen, Beiträge einplanen, Interaktionsberichte zusammenstellen
**Genehmigungsschranke:** In den ersten 30 Tagen müssen alle Beiträge vom Verantwortlichen geprüft werden, danach gilt eine dauerhafte Freigabe
**Auslöser:** Wöchentlicher Zyklus (Prüfung am Montag → Entwürfe zur Wochenmitte → Kurzbericht am Freitag)

### Wöchentlicher Zyklus

- **Montag:** Plattformkennzahlen und Interaktionen der Zielgruppe prüfen
- **Dienstag–Donnerstag:** Beiträge für soziale Medien entwerfen, Bloginhalte erstellen
- **Freitag:** Wöchentlichen Marketing-Kurzbericht zusammenstellen → an den Verantwortlichen übermitteln

### Inhaltsregeln

- Der Schreibstil muss zur Marke passen (siehe SOUL.md oder Leitfaden zur Markensprache)
- In öffentlich sichtbaren Inhalten niemals als KI zu erkennen geben
- Kennzahlen einbeziehen, sofern verfügbar
- Den Mehrwert für die Zielgruppe statt Eigenwerbung in den Mittelpunkt stellen
```

### Beispiel 2: Finanzvorgänge (ereignisgesteuert)

```markdown
## Programm: Finanzielle Verarbeitung

**Befugnis:** Transaktionsdaten verarbeiten, Berichte erstellen, Zusammenfassungen senden
**Genehmigungsschranke:** Keine für Analysen. Empfehlungen erfordern die Genehmigung des Verantwortlichen.
**Auslöser:** Neue Datendatei erkannt ODER planmäßiger monatlicher Zyklus

### Wenn neue Daten eintreffen

1. Neue Datei im festgelegten Eingabeverzeichnis erkennen
2. Alle Transaktionen analysieren und kategorisieren
3. Mit Budgetvorgaben vergleichen
4. Kennzeichnen: ungewöhnliche Posten, Schwellenwertüberschreitungen, neue wiederkehrende Belastungen
5. Bericht im festgelegten Ausgabeverzeichnis erstellen
6. Zusammenfassung über den konfigurierten Kanal an den Verantwortlichen übermitteln

### Eskalationsregeln

- Einzelposten > $500: sofortige Warnmeldung
- Kategorie überschreitet das Budget um 20 %: im Bericht kennzeichnen
- Nicht zuordenbare Transaktion: Verantwortlichen um Kategorisierung bitten
- Verarbeitung nach 2 Wiederholungsversuchen fehlgeschlagen: Fehler melden, keine Vermutungen anstellen
```

### Beispiel 3: Überwachung und Warnmeldungen (kontinuierlich)

```markdown
## Programm: Systemüberwachung

**Befugnis:** Systemzustand prüfen, Dienste neu starten, Warnmeldungen senden
**Genehmigungsschranke:** Dienste automatisch neu starten. Eskalieren, wenn der Neustart zweimal fehlschlägt.
**Auslöser:** Bei jedem Heartbeat-Zyklus

### Prüfungen

- Zustandsendpunkte der Dienste antworten
- Freier Speicherplatz liegt über dem Schwellenwert
- Ausstehende Aufgaben sind nicht veraltet (>24 Stunden)
- Übermittlungskanäle sind betriebsbereit

### Reaktionsmatrix

| Bedingung                 | Aktion                                      | Eskalieren?                         |
| ------------------------- | ------------------------------------------- | ----------------------------------- |
| Dienst ausgefallen        | Automatisch neu starten                     | Nur wenn der Neustart 2-mal fehlschlägt |
| Freier Speicherplatz < 10 % | Verantwortlichen warnen                   | Ja                                  |
| Veraltete Aufgabe > 24 Std. | Verantwortlichen erinnern                 | Nein                                |
| Kanal offline             | Protokollieren und im nächsten Zyklus erneut versuchen | Wenn länger als 2 Stunden offline |
```

## Muster „Ausführen–Prüfen–Melden“

Daueraufträge funktionieren am besten in Verbindung mit strikter Ausführungsdisziplin. Jede Aufgabe in einem Dauerauftrag sollte diesem Ablauf folgen:

1. **Ausführen** – Die eigentliche Arbeit erledigen (die Anweisung nicht nur bestätigen)
2. **Prüfen** – Bestätigen, dass das Ergebnis korrekt ist (Datei vorhanden, Nachricht übermittelt, Daten analysiert)
3. **Melden** – Dem Verantwortlichen mitteilen, was erledigt und was geprüft wurde

```markdown
### Ausführungsregeln

- Jede Aufgabe folgt dem Muster „Ausführen–Prüfen–Melden“. Keine Ausnahmen.
- „Ich werde das erledigen“ ist keine Ausführung. Erledigen Sie es und melden Sie anschließend das Ergebnis.
- „Erledigt“ ohne Prüfung ist nicht akzeptabel. Erbringen Sie einen Nachweis.
- Wenn die Ausführung fehlschlägt: einmal mit angepasstem Vorgehen erneut versuchen.
- Wenn sie weiterhin fehlschlägt: Fehler einschließlich Diagnose melden. Fehler niemals stillschweigend übergehen.
- Wiederholungsversuche niemals unbegrenzt fortsetzen – höchstens 3 Versuche, danach eskalieren.
```

Dieses Muster verhindert die häufigste Fehlerart bei Agenten: eine Aufgabe zu bestätigen, ohne sie abzuschließen.

## Architektur mit mehreren Programmen

Organisieren Sie Daueraufträge für Agenten, die mehrere Aufgabenbereiche verwalten, als getrennte Programme mit klaren Grenzen:

```markdown
## Programm 1: [Bereich A] (Wöchentlich)

...

## Programm 2: [Bereich B] (Monatlich + bei Bedarf)

...

## Programm 3: [Bereich C] (Nach Bedarf)

...

## Eskalationsregeln (Alle Programme)

- [Gemeinsame Eskalationskriterien]
- [Programmübergreifend geltende Genehmigungsschranken]
```

Jedes Programm sollte Folgendes besitzen:

- Einen eigenen **Ausführungsrhythmus** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Genehmigungsschranken** (einige Programme benötigen mehr Aufsicht als andere)
- Klare **Abgrenzungen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Bewährte Vorgehensweisen

### Empfohlen

- Mit eng begrenzten Befugnissen beginnen und diese mit zunehmendem Vertrauen erweitern
- Ausdrückliche Genehmigungsschranken für risikoreiche Aktionen definieren
- Abschnitte mit „Was NICHT zu tun ist“ einfügen – Grenzen sind ebenso wichtig wie Berechtigungen
- Für eine zuverlässige zeitgesteuerte Ausführung mit Cron-Aufträgen kombinieren
- Agentenprotokolle wöchentlich prüfen, um die Einhaltung der Daueraufträge zu bestätigen
- Daueraufträge an Ihre sich ändernden Anforderungen anpassen – sie sind lebende Dokumente

### Zu vermeiden

- Am ersten Tag weitreichende Befugnisse erteilen („Tun Sie, was immer Sie für das Beste halten“)
- Eskalationsregeln auslassen – jedes Programm benötigt eine Klausel dazu, wann die Ausführung anzuhalten und nachzufragen ist
- Davon ausgehen, dass der Agent sich an mündliche Anweisungen erinnert – alles in der Datei festhalten
- Aufgabenbereiche in einem einzigen Programm vermischen – getrennte Programme für getrennte Bereiche verwenden
- Die Durchsetzung mit Cron-Aufträgen vergessen – Daueraufträge ohne Auslöser werden zu bloßen Empfehlungen

## Verwandte Themen

- [Automatisierung](/de/automation): alle Automatisierungsmechanismen auf einen Blick.
- [Cron-Aufträge](/de/automation/cron-jobs): zeitliche Durchsetzung von Daueraufträgen.
- [Hooks](/de/automation/hooks): ereignisgesteuerte Skripte für Lebenszyklusereignisse des Agenten.
- [Webhooks](/de/automation/cron-jobs#webhooks): Auslöser für eingehende HTTP-Ereignisse.
- [Agenten-Arbeitsbereich](/de/concepts/agent-workspace): Speicherort der Daueraufträge einschließlich der vollständigen Liste automatisch eingefügter Bootstrap-Dateien (`AGENTS.md`, `SOUL.md` usw.).
