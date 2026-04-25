---
read_when:
    - Einrichten autonomer Agent-Workflows, die ohne Aufforderung für jede einzelne Aufgabe ausgeführt werden
    - Festlegen, was der Agent eigenständig tun kann und wofür eine menschliche Genehmigung erforderlich ist
    - Strukturierung von Multi-Programm-Agenten mit klaren Grenzen und Eskalationsregeln
summary: Dauerhafte Handlungsbefugnis für autonome Agentenprogramme definieren
title: Daueraufträge
x-i18n:
    generated_at: "2026-04-25T13:40:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

Daueraufträge gewähren Ihrem Agenten **dauerhafte Handlungsbefugnis** für definierte Programme. Anstatt jedes Mal einzelne Aufgabenanweisungen zu geben, definieren Sie Programme mit klarem Umfang, Auslösern und Eskalationsregeln — und der Agent führt sie innerhalb dieser Grenzen autonom aus.

Das ist der Unterschied zwischen der Anweisung an Ihren Assistenten „Sende jeden Freitag den Wochenbericht“ und der Erteilung einer Dauerbefugnis: „Du bist für den Wochenbericht verantwortlich. Erstelle ihn jeden Freitag, versende ihn und eskaliere nur, wenn etwas nicht stimmt.“

## Warum Daueraufträge?

**Ohne Daueraufträge:**

- Sie müssen den Agenten für jede Aufgabe einzeln auffordern
- Der Agent bleibt zwischen Anfragen untätig
- Routinearbeiten werden vergessen oder verzögern sich
- Sie werden zum Engpass

**Mit Daueraufträgen:**

- Der Agent arbeitet innerhalb definierter Grenzen autonom
- Routinearbeiten erfolgen planmäßig ohne Aufforderung
- Sie müssen sich nur bei Ausnahmen und Genehmigungen einschalten
- Der Agent nutzt Leerlaufzeit produktiv

## So funktionieren sie

Daueraufträge werden in den Dateien Ihres [Agent Workspace](/de/concepts/agent-workspace) definiert. Der empfohlene Ansatz ist, sie direkt in `AGENTS.md` aufzunehmen (das in jeder Sitzung automatisch eingefügt wird), damit der Agent sie immer im Kontext hat. Bei größeren Konfigurationen können Sie sie auch in einer eigenen Datei wie `standing-orders.md` ablegen und aus `AGENTS.md` darauf verweisen.

Jedes Programm legt Folgendes fest:

1. **Umfang** — was der Agent tun darf
2. **Auslöser** — wann ausgeführt wird (Zeitplan, Ereignis oder Bedingung)
3. **Genehmigungsschranken** — was vor der Ausführung eine menschliche Freigabe erfordert
4. **Eskalationsregeln** — wann gestoppt und um Hilfe gebeten werden muss

Der Agent lädt diese Anweisungen in jeder Sitzung über die Bootstrap-Dateien des Workspace (siehe [Agent Workspace](/de/concepts/agent-workspace) für die vollständige Liste automatisch eingefügter Dateien) und führt sie in Kombination mit [Cron-Jobs](/de/automation/cron-jobs) zur zeitbasierten Durchsetzung aus.

<Tip>
Legen Sie Daueraufträge in `AGENTS.md` ab, damit sie garantiert in jeder Sitzung geladen werden. Der Workspace-Bootstrap fügt `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` automatisch ein — aber keine beliebigen Dateien in Unterverzeichnissen.
</Tip>

## Anatomie eines Dauerauftrags

```markdown
## Programm: Wöchentlicher Statusbericht

**Befugnis:** Daten zusammenstellen, Bericht erstellen, an Stakeholder zustellen
**Auslöser:** Jeden Freitag um 16 Uhr (durch Cron-Job erzwungen)
**Genehmigungsschranke:** Keine für Standardberichte. Auffälligkeiten zur menschlichen Prüfung markieren.
**Eskalation:** Wenn die Datenquelle nicht verfügbar ist oder Metriken ungewöhnlich wirken (>2σ vom Normalwert)

### Ausführungsschritte

1. Metriken aus konfigurierten Quellen abrufen
2. Mit Vorwoche und Zielen vergleichen
3. Bericht in Reports/weekly/YYYY-MM-DD.md erstellen
4. Zusammenfassung über den konfigurierten Kanal zustellen
5. Abschluss in Agent/Logs/ protokollieren

### Was NICHT zu tun ist

- Keine Berichte an externe Parteien senden
- Quelldaten nicht verändern
- Zustellung nicht auslassen, wenn Metriken schlecht aussehen — korrekt berichten
```

## Daueraufträge + Cron-Jobs

Daueraufträge definieren, **was** der Agent tun darf. [Cron-Jobs](/de/automation/cron-jobs) definieren, **wann** es geschieht. Sie arbeiten zusammen:

```
Dauerauftrag: „Du bist für die tägliche Inbox-Triage verantwortlich“
    ↓
Cron-Job (täglich 8 Uhr): „Führe die Inbox-Triage gemäß Daueraufträgen aus“
    ↓
Agent: Liest Daueraufträge → führt Schritte aus → meldet Ergebnisse
```

Der Prompt des Cron-Jobs sollte auf den Dauerauftrag verweisen, anstatt ihn zu duplizieren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Führe die tägliche Inbox-Triage gemäß Daueraufträgen aus. Prüfe E-Mails auf neue Benachrichtigungen. Parse, kategorisiere und persistiere jeden Eintrag. Melde dem Eigentümer eine Zusammenfassung. Unbekanntes eskalieren."
```

## Beispiele

### Beispiel 1: Inhalte & Social Media (Wöchentlicher Zyklus)

```markdown
## Programm: Inhalte & Social Media

**Befugnis:** Inhalte entwerfen, Beiträge planen, Interaktionsberichte erstellen
**Genehmigungsschranke:** Alle Beiträge erfordern in den ersten 30 Tagen die Prüfung durch den Eigentümer, danach dauerhafte Freigabe
**Auslöser:** Wöchentlicher Zyklus (Montagsprüfung → Entwürfe unter der Woche → Freitagsbriefing)

### Wöchentlicher Zyklus

- **Montag:** Plattformmetriken und Publikumsinteraktion prüfen
- **Dienstag–Donnerstag:** Social-Posts entwerfen, Blog-Inhalte erstellen
- **Freitag:** Wöchentliches Marketing-Briefing erstellen → an Eigentümer zustellen

### Inhaltsregeln

- Tonalität muss zur Marke passen (siehe SOUL.md oder Leitfaden zur Markenstimme)
- Sich in öffentlich sichtbaren Inhalten niemals als KI ausgeben
- Metriken einbeziehen, wenn verfügbar
- Auf Mehrwert für das Publikum fokussieren, nicht auf Eigenwerbung
```

### Beispiel 2: Finanzoperationen (Ereignisgesteuert)

```markdown
## Programm: Finanzverarbeitung

**Befugnis:** Transaktionsdaten verarbeiten, Berichte erstellen, Zusammenfassungen senden
**Genehmigungsschranke:** Keine für Analysen. Empfehlungen erfordern die Genehmigung des Eigentümers.
**Auslöser:** Neue Datendatei erkannt ODER geplanter monatlicher Zyklus

### Wenn neue Daten eintreffen

1. Neue Datei im festgelegten Eingabeverzeichnis erkennen
2. Alle Transaktionen parsen und kategorisieren
3. Mit Budgetzielen vergleichen
4. Markieren: ungewöhnliche Posten, Schwellenwertüberschreitungen, neue wiederkehrende Belastungen
5. Bericht im festgelegten Ausgabeverzeichnis erstellen
6. Zusammenfassung über den konfigurierten Kanal an den Eigentümer zustellen

### Eskalationsregeln

- Einzelposten > 500 $: sofortige Warnung
- Kategorie > 20 % über Budget: im Bericht markieren
- Nicht erkennbare Transaktion: Eigentümer um Kategorisierung bitten
- Verarbeitung nach 2 Wiederholungen fehlgeschlagen: Fehler melden, nicht raten
```

### Beispiel 3: Überwachung & Warnungen (Kontinuierlich)

```markdown
## Programm: Systemüberwachung

**Befugnis:** Systemzustand prüfen, Dienste neu starten, Warnungen senden
**Genehmigungsschranke:** Dienste automatisch neu starten. Eskalieren, wenn der Neustart zweimal fehlschlägt.
**Auslöser:** Jeder Heartbeat-Zyklus

### Prüfungen

- Antworten der Health-Endpunkte der Dienste
- Freier Speicherplatz über Schwellenwert
- Ausstehende Aufgaben nicht veraltet (>24 Stunden)
- Zustellungskanäle funktionsfähig

### Reaktionsmatrix

| Bedingung        | Aktion                    | Eskalieren?              |
| ---------------- | ------------------------- | ------------------------ |
| Dienst ausgefallen | Automatisch neu starten | Nur wenn Neustart 2x fehlschlägt |
| Speicherplatz < 10 % | Eigentümer warnen     | Ja                       |
| Veraltete Aufgabe > 24 h | Eigentümer erinnern | Nein                    |
| Kanal offline    | Protokollieren und im nächsten Zyklus erneut versuchen | Wenn > 2 Stunden offline |
```

## Das Muster Ausführen–Verifizieren–Berichten

Daueraufträge funktionieren am besten in Kombination mit strikter Ausführungsdisziplin. Jede Aufgabe in einem Dauerauftrag sollte diesem Ablauf folgen:

1. **Ausführen** — Die eigentliche Arbeit erledigen (die Anweisung nicht nur bestätigen)
2. **Verifizieren** — Bestätigen, dass das Ergebnis korrekt ist (Datei existiert, Nachricht zugestellt, Daten geparst)
3. **Berichten** — Dem Eigentümer mitteilen, was getan und was verifiziert wurde

```markdown
### Ausführungsregeln

- Jede Aufgabe folgt Ausführen–Verifizieren–Berichten. Keine Ausnahmen.
- „Ich kümmere mich darum“ ist keine Ausführung. Tun Sie es und berichten Sie dann.
- „Erledigt“ ohne Verifizierung ist nicht akzeptabel. Belegen Sie es.
- Wenn die Ausführung fehlschlägt: einmal mit angepasstem Ansatz erneut versuchen.
- Wenn es weiterhin fehlschlägt: Fehler mit Diagnose melden. Niemals stillschweigend scheitern.
- Niemals unbegrenzt wiederholen — maximal 3 Versuche, dann eskalieren.
```

Dieses Muster verhindert den häufigsten Fehler von Agenten: eine Aufgabe zu bestätigen, ohne sie abzuschließen.

## Multi-Programm-Architektur

Bei Agenten, die mehrere Themenbereiche verwalten, sollten Daueraufträge als getrennte Programme mit klaren Grenzen organisiert werden:

```markdown
## Programm 1: [Bereich A] (Wöchentlich)

...

## Programm 2: [Bereich B] (Monatlich + On-Demand)

...

## Programm 3: [Bereich C] (Nach Bedarf)

...

## Eskalationsregeln (Alle Programme)

- [Gemeinsame Eskalationskriterien]
- [Genehmigungsschranken, die für alle Programme gelten]
```

Jedes Programm sollte Folgendes haben:

- Seine eigene **Auslöserkadenz** (wöchentlich, monatlich, ereignisgesteuert, kontinuierlich)
- Seine eigenen **Genehmigungsschranken** (manche Programme benötigen mehr Aufsicht als andere)
- Klare **Grenzen** (der Agent sollte wissen, wo ein Programm endet und ein anderes beginnt)

## Best Practices

### Empfohlen

- Mit engem Befugnisrahmen beginnen und ihn mit wachsendem Vertrauen erweitern
- Für risikoreiche Aktionen explizite Genehmigungsschranken definieren
- Abschnitte „Was NICHT zu tun ist“ aufnehmen — Grenzen sind genauso wichtig wie Berechtigungen
- Mit Cron-Jobs für verlässliche zeitbasierte Ausführung kombinieren
- Agentenprotokolle wöchentlich prüfen, um zu verifizieren, dass Daueraufträge befolgt werden
- Daueraufträge anpassen, wenn sich Ihre Anforderungen ändern — sie sind lebende Dokumente

### Vermeiden

- Am ersten Tag weitreichende Befugnisse erteilen („tu einfach, was du für richtig hältst“)
- Eskalationsregeln auslassen — jedes Programm braucht eine Klausel für „wann stoppen und fragen“
- Davon ausgehen, dass sich der Agent mündliche Anweisungen merkt — alles in die Datei schreiben
- Themen in einem einzigen Programm vermischen — getrennte Programme für getrennte Bereiche
- Vergessen, mit Cron-Jobs durchzusetzen — Daueraufträge ohne Auslöser werden zu Vorschlägen

## Verwandt

- [Automation & Tasks](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Cron Jobs](/de/automation/cron-jobs) — zeitliche Durchsetzung für Daueraufträge
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte für Lebenszyklusereignisse von Agenten
- [Webhooks](/de/automation/cron-jobs#webhooks) — eingehende HTTP-Ereignisauslöser
- [Agent Workspace](/de/concepts/agent-workspace) — wo Daueraufträge gespeichert werden, einschließlich der vollständigen Liste automatisch eingefügter Bootstrap-Dateien (`AGENTS.md`, `SOUL.md` usw.)
