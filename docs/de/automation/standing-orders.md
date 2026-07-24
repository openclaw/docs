---
read_when:
    - Autonome Agenten-Workflows einrichten, die ohne Aufforderung für jede einzelne Aufgabe ausgeführt werden
    - Festlegen, was der Agent selbstständig tun kann und wofür eine menschliche Genehmigung erforderlich ist
    - Strukturierung von Multi-Programm-Agenten mit klaren Grenzen und Eskalationsregeln
summary: Definieren Sie dauerhafte Handlungsbefugnisse für autonome Agentenprogramme
title: Daueraufträge
x-i18n:
    generated_at: "2026-07-24T04:46:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Daueraufträge erteilen Ihrem Agenten **dauerhafte Handlungsbefugnis** für definierte Programme. Anstatt den Agenten für jede Aufgabe aufzufordern, definieren Sie Programme mit klarem Umfang, Auslösern und Eskalationsregeln, und der Agent führt sie innerhalb dieser Grenzen autonom aus: „Sie sind für den wöchentlichen Bericht verantwortlich. Erstellen und versenden Sie ihn jeden Freitag und eskalieren Sie nur, wenn etwas nicht stimmt.“

## Warum Daueraufträge

**Ohne Daueraufträge:** Sie müssen den Agenten zu jeder Aufgabe auffordern, Routinearbeiten werden vergessen oder verzögert, und Sie werden zum Engpass.

**Mit Daueraufträgen:** Der Agent arbeitet innerhalb definierter Grenzen autonom, Routinearbeiten werden planmäßig erledigt, und Sie werden nur bei Ausnahmen und Genehmigungen einbezogen.

## Funktionsweise

Daueraufträge werden in den Dateien Ihres [Agent-Arbeitsbereichs](/de/concepts/agent-workspace) definiert. Es wird empfohlen, sie direkt in `AGENTS.md` aufzunehmen (das in jeder Sitzung automatisch eingefügt wird), damit sie dem Agenten stets als Kontext vorliegen. Umfangreichere Konfigurationen können Sie auch in einer eigenen Datei wie `standing-orders.md` ablegen und aus `AGENTS.md` darauf verweisen.

Jedes Programm legt Folgendes fest:

1. **Umfang** – wozu der Agent befugt ist
2. **Auslöser** – wann die Ausführung erfolgt (Zeitplan, Ereignis oder Bedingung)
3. **Genehmigungspunkte** – was vor der Ausführung eine menschliche Freigabe erfordert
4. **Eskalationsregeln** – wann der Agent anhalten und um Hilfe bitten muss

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Arbeitsbereichs (die vollständige Liste der automatisch eingefügten Dateien finden Sie unter [Agent-Arbeitsbereich](/de/concepts/agent-workspace)) und führt sie in Verbindung mit [Cron-Jobs](/de/automation/cron-jobs) zur zeitgesteuerten Durchsetzung aus.

<Tip>
Legen Sie Daueraufträge in `AGENTS.md` ab, um sicherzustellen, dass sie in jeder Sitzung geladen werden. Der Arbeitsbereich-Bootstrap fügt `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` automatisch ein – jedoch keine beliebigen Dateien in Unterverzeichnissen.
</Tip>

## Aufbau eines Dauerauftrags

```markdown
## Programm: Wöchentlicher Statusbericht

**Befugnis:** Daten zusammenstellen, Bericht erstellen, an Stakeholder übermitteln
**Auslöser:** Jeden Freitag um 16 Uhr (durch Cron-Job erzwungen)
**Genehmigungspunkt:** Keiner für Standardberichte. Auffälligkeiten zur menschlichen Prüfung kennzeichnen.
**Eskalation:** Wenn eine Datenquelle nicht verfügbar ist oder Kennzahlen ungewöhnlich erscheinen (>2σ von der Norm)

### Ausführungsschritte

1. Kennzahlen aus konfigurierten Quellen abrufen
2. Mit der Vorwoche und den Zielwerten vergleichen
3. Bericht in Reports/weekly/YYYY-MM-DD.md erstellen
4. Zusammenfassung über den konfigurierten Kanal übermitteln
5. Abschluss in Agent/Logs/ protokollieren

### Was NICHT zu tun ist

- Berichte nicht an externe Parteien senden
- Quelldaten nicht verändern
- Übermittlung nicht auslassen, wenn Kennzahlen schlecht aussehen – korrekt berichten
```

## Daueraufträge plus Cron-Jobs

Daueraufträge definieren, **was** der Agent tun darf. [Cron-Jobs](/de/automation/cron-jobs) definieren, **wann** es geschieht. Sie wirken zusammen:

```text
Dauerauftrag: „Sie sind für die tägliche Posteingangssichtung verantwortlich“
    ↓
Cron-Job (täglich um 8 Uhr): „Posteingangssichtung gemäß den Daueraufträgen ausführen“
    ↓
Agent: Liest Daueraufträge → führt Schritte aus → berichtet Ergebnisse
```

Die Aufforderung des Cron-Jobs sollte auf den Dauerauftrag verweisen, anstatt ihn zu duplizieren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Tägliche Posteingangssichtung gemäß den Daueraufträgen ausführen. E-Mails auf neue Warnmeldungen prüfen. Jedes Element analysieren, kategorisieren und dauerhaft speichern. Dem Verantwortlichen eine Zusammenfassung übermitteln. Unbekannte Fälle eskalieren."
```

## Beispiele

### Beispiel 1: Inhalte und soziale Medien (wöchentlicher Zyklus)

```markdown
## Programm: Inhalte und soziale Medien

**Befugnis:** Inhalte entwerfen, Beiträge planen, Interaktionsberichte zusammenstellen
**Genehmigungspunkt:** Alle Beiträge erfordern in den ersten 30 Tagen die Prüfung durch den Verantwortlichen, danach gilt eine dauerhafte Genehmigung
**Auslöser:** Wöchentlicher Zyklus (Prüfung am Montag → Entwürfe zur Wochenmitte → Kurzbericht am Freitag)

### Wöchentlicher Zyklus

- **Montag:** Plattformkennzahlen und Interaktionen der Zielgruppe prüfen
- **Dienstag–Donnerstag:** Beiträge für soziale Medien entwerfen, Bloginhalte erstellen
- **Freitag:** Wöchentlichen Marketing-Kurzbericht zusammenstellen → an den Verantwortlichen übermitteln

### Inhaltsregeln

- Der Ton muss zur Marke passen (siehe SOUL.md oder Leitfaden zur Markensprache)
- In öffentlich sichtbaren Inhalten niemals als KI ausgeben
- Kennzahlen einbeziehen, sofern verfügbar
- Auf den Nutzen für die Zielgruppe konzentrieren, nicht auf Eigenwerbung
```

### Beispiel 2: Finanzvorgänge (ereignisgesteuert)

```markdown
## Programm: Finanzverarbeitung

**Befugnis:** Transaktionsdaten verarbeiten, Berichte erstellen, Zusammenfassungen senden
**Genehmigungspunkt:** Keiner für Analysen. Empfehlungen erfordern die Genehmigung des Verantwortlichen.
**Auslöser:** Neue Datendatei erkannt ODER geplanter monatlicher Zyklus

### Beim Eingang neuer Daten

1. Neue Datei im vorgesehenen Eingabeverzeichnis erkennen
2. Alle Transaktionen analysieren und kategorisieren
3. Mit den Budgetzielen vergleichen
4. Kennzeichnen: ungewöhnliche Posten, Grenzwertüberschreitungen, neue wiederkehrende Belastungen
5. Bericht im vorgesehenen Ausgabeverzeichnis erstellen
6. Zusammenfassung über den konfigurierten Kanal an den Verantwortlichen übermitteln

### Eskalationsregeln

- Einzelner Posten > $500: sofortige Warnung
- Kategorie > 20% über dem Budget: im Bericht kennzeichnen
- Nicht zuordenbare Transaktion: Verantwortlichen um Kategorisierung bitten
- Verarbeitung nach 2 Wiederholungsversuchen fehlgeschlagen: Fehler melden, nicht raten
```

### Beispiel 3: Überwachung und Warnmeldungen (kontinuierlich)

```markdown
## Programm: Systemüberwachung

**Befugnis:** Systemzustand prüfen, Dienste neu starten, Warnmeldungen senden
**Genehmigungspunkt:** Dienste automatisch neu starten. Eskalieren, wenn der Neustart zweimal fehlschlägt.
**Auslöser:** Bei jedem Heartbeat-Zyklus

### Prüfungen

- Zustandsendpunkte der Dienste antworten
- Freier Speicherplatz liegt über dem Grenzwert
- Ausstehende Aufgaben sind nicht veraltet (>24 Stunden)
- Übermittlungskanäle sind betriebsbereit

### Reaktionsmatrix

| Bedingung              | Aktion                                      | Eskalieren?                          |
| ---------------------- | ------------------------------------------- | ------------------------------------ |
| Dienst ausgefallen     | Automatisch neu starten                     | Nur wenn Neustart 2x fehlschlägt     |
| Speicherplatz < 10%    | Verantwortlichen warnen                     | Ja                                   |
| Veraltete Aufgabe > 24h | Verantwortlichen erinnern                  | Nein                                 |
| Kanal offline          | Protokollieren und im nächsten Zyklus erneut versuchen | Wenn > 2 Stunden offline |
```

## Ausführen-Prüfen-Berichten-Muster

Daueraufträge funktionieren am besten in Verbindung mit strikter Ausführungsdisziplin. Jede Aufgabe in einem Dauerauftrag sollte diesem Ablauf folgen:

1. **Ausführen** – Die eigentliche Arbeit erledigen (die Anweisung nicht nur bestätigen)
2. **Prüfen** – Bestätigen, dass das Ergebnis korrekt ist (Datei vorhanden, Nachricht übermittelt, Daten analysiert)
3. **Berichten** – Dem Verantwortlichen mitteilen, was erledigt und was geprüft wurde

```markdown
### Ausführungsregeln

- Jede Aufgabe folgt dem Muster Ausführen–Prüfen–Berichten. Keine Ausnahmen.
- „Ich werde das erledigen“ ist keine Ausführung. Erledigen Sie es und berichten Sie anschließend.
- „Erledigt“ ohne Prüfung ist nicht akzeptabel. Belegen Sie es.
- Wenn die Ausführung fehlschlägt: einmal mit angepasstem Ansatz erneut versuchen.
- Wenn sie weiterhin fehlschlägt: Fehler mit Diagnose melden. Niemals unbemerkt fehlschlagen.
- Niemals unbegrenzt erneut versuchen – maximal 3 Versuche, dann eskalieren.
```

Dieses Muster verhindert den häufigsten Fehlermodus von Agenten: eine Aufgabe zu bestätigen, ohne sie abzuschließen.

## Architektur mit mehreren Programmen

Für Agenten, die mehrere Aufgabenbereiche verwalten, sollten Daueraufträge als separate Programme mit klaren Grenzen organisiert werden:

```markdown
## Programm 1: [Bereich A] (Wöchentlich)

...

## Programm 2: [Bereich B] (Monatlich + bei Bedarf)

...

## Programm 3: [Bereich C] (Nach Bedarf)

...

## Eskalationsregeln (Alle Programme)

- [Gemeinsame Eskalationskriterien]
- [Genehmigungspunkte, die für alle Programme gelten]
```

Jedes Programm sollte Folgendes haben:

- Einen eigenen **Ausführungsrhythmus** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Eigene **Genehmigungspunkte** (einige Programme erfordern mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Bewährte Vorgehensweisen

### Empfohlen

- Mit eng begrenzter Befugnis beginnen und sie mit wachsendem Vertrauen erweitern
- Explizite Genehmigungspunkte für risikoreiche Aktionen definieren
- Abschnitte „Was NICHT zu tun ist“ aufnehmen – Grenzen sind ebenso wichtig wie Berechtigungen
- Für eine zuverlässige zeitgesteuerte Ausführung mit Cron-Jobs kombinieren
- Agentenprotokolle wöchentlich prüfen, um sicherzustellen, dass die Daueraufträge eingehalten werden
- Daueraufträge an veränderte Anforderungen anpassen – sie sind lebendige Dokumente

### Vermeiden

- Am ersten Tag weitreichende Befugnisse erteilen („tun Sie, was Sie für am besten halten“)
- Eskalationsregeln auslassen – jedes Programm benötigt eine Klausel dazu, wann angehalten und nachgefragt werden muss
- Davon ausgehen, dass der Agent sich an mündliche Anweisungen erinnert – alles in der Datei festhalten
- Aufgabenbereiche in einem einzigen Programm vermischen – separate Programme für separate Bereiche verwenden
- Die Durchsetzung mit Cron-Jobs vergessen – Daueraufträge ohne Auslöser werden zu Vorschlägen

## Verwandte Themen

- [Automatisierung](/de/automation): alle Automatisierungsmechanismen auf einen Blick.
- [Cron-Jobs](/de/automation/cron-jobs): zeitgesteuerte Durchsetzung von Daueraufträgen.
- [Hooks](/de/automation/hooks): ereignisgesteuerte Skripte für Ereignisse im Lebenszyklus des Agenten.
- [Webhooks](/de/automation/cron-jobs#webhooks): Auslöser für eingehende HTTP-Ereignisse.
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace): Speicherort der Daueraufträge einschließlich der vollständigen Liste automatisch eingefügter Bootstrap-Dateien (`AGENTS.md`, `SOUL.md` usw.).
