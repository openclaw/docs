---
read_when:
    - ClawHub-Sicherheitsauditergebnisse verstehen
    - Entscheidung, ob ein Skill oder Plugin installiert werden soll
    - Erläuterung des Auditstatus, der Risikostufe oder der Ergebnisse von ClawHub
sidebarTitle: Security Audits
summary: So verstehen Sie die Ergebnisse der ClawHub-Sicherheitsprüfung, bevor Sie einen Skill oder ein Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-12T15:04:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

ClawHub-Sicherheitsaudits helfen Ihnen bei der Entscheidung, ob ein Skill oder Plugin sicher genug für die Installation ist. Sie zeigen, was ein Release tut, welche Berechtigungen es anfordert und ob etwas besondere Aufmerksamkeit erfordert, bevor es auf Dateien, Konten, Anmeldedaten, Code oder externe Dienste zugreifen kann.

Audits sind aussagekräftige Sicherheitssignale, garantieren jedoch nicht, dass ein Release risikofrei ist. Wägen Sie stets sorgfältig ab, bevor Sie vertraulichen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Zulässige Nutzung](/de/clawhub/acceptable-usage) und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was Sie vor der Installation prüfen sollten

Prüfen Sie vor der Installation:

- den allgemeinen Auditstatus
- die Risikostufe
- alle aufgeführten Feststellungen
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Eigentümer, Quelle, Version, Änderungsprotokoll, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Auditstatus

Der Auditstatus gibt an, wie Sie auf das Auditergebnis reagieren sollten:

| Status      | Bedeutung                                                                        |
| ----------- | -------------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb der niedrigen Risikostufe gefunden.    |
| `Review`    | Lesen Sie vor der Installation die Feststellungen. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit erheblichen Auswirkungen oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                              |
| `Pending`   | Die Audits sind noch nicht abgeschlossen.                                        |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                                     |

Ein `Pass` ist beruhigend, ersetzt jedoch nicht Ihre eigene Beurteilung. Dies ist besonders wichtig für Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den möglichen Schadensumfang: wie viele Befugnisse das Release offenbar besitzt, wenn Sie es bestimmungsgemäß verwenden.

| Risikostufe | Bedeutung                                                                        |
| ----------- | -------------------------------------------------------------------------------- |
| `Low`       | Es wurden kaum sensible Befugnisse oder Auswirkungen auf Benutzer festgestellt. |
| `Medium`    | Das Release verfügt über bedeutende Befugnisse, etwa Kontozugriff oder Datenänderungen. |
| `High`      | Das Release verfügt über Befugnisse mit erheblichen Auswirkungen, weist schwerwiegende Feststellungen oder bösartige Signale auf. |

Risikostufe und Auditstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viele Befugnisse sind hier vorhanden?“
- Der Auditstatus fragt: „Wie sollte ich mit diesem Ergebnis umgehen?“

Ein Skill zum Veröffentlichen kann beispielsweise `Review` mit dem Risiko `Medium` anzeigen. Das bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill offenbar seinem Zweck entspricht, aber mit bedeutenden Kontoberechtigungen handeln kann.

## Feststellungen

Feststellungen erläutern, warum ein Auditergebnis angezeigt wurde. Jede Feststellung enthält üblicherweise:

- was sie bedeutet
- warum sie gekennzeichnet wurde
- die relevanten Inhalte des Skills oder Plugins
- eine Empfehlung

Feststellungen können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Feststellungen mit höherem Schweregrad wirken sich stärker auf Risikostufe und Auditstatus aus.

Feststellungen mit geringer Zuverlässigkeit werden in der öffentlichen Auditübersicht ausgeblendet, damit die Seite auf aussagekräftige Nachweise ausgerichtet bleibt.

## Was ClawHub prüft

ClawHub auditiert eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Funktionsmetadaten

Die zentrale Frage ist die Schlüssigkeit: Stimmen Name, Zusammenfassung, Metadaten, angeforderte Berechtigungen und tatsächlicher Inhalt mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Leistungsfähiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten, lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese Befugnisse erwartbar, offengelegt und verhältnismäßig sind.

Artefaktseiten verweisen unter folgendem Pfad auf das vollständige Audit:

```text
/<owner>/skills/<slug>/security-audit
```

Die Auditseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-System. VirusTotal ist ein vertrauenswürdiger Branchenstandard für die Bewertung der Reputation von Dateien und das Scannen auf Malware. Durch unsere Partnerschaft kann ClawHub die Prüfung von Skills und Plugins um umfassendere Sicherheitsinformationen ergänzen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Treffer von Scan-Engines und Reputationssignale, die die agentenbezogene Prüfung von ClawHub ergänzen. Wenn die Anzahl der Ergebnisse von Anbieter-Engines verfügbar ist, fasst das Audit sie in verständlicher Sprache zusammen, beispielsweise:

```text
62/62 Anbieter haben diesen Skill als unbedenklich eingestuft.
```

oder:

```text
2/64 Anbieter haben diesen Skill als bösartig, 1/64 als verdächtig und 61/64 als unbedenklich eingestuft.
```

Wenn ClawHub keine Telemetrie zu Anbieterzahlen zusammenfassen kann, steht im Audit:

```text
Keine VirusTotal-Feststellungen
```

VirusTotal bleibt eine Telemetriequelle. Es ersetzt nicht die artefaktbezogene Risikoanalyse von ClawHub.

## Risikoanalyse

Die Risikoanalyse basiert intern auf ClawScan, dem eigenen Sicherheitsauditsystem von ClawHub. Es prüft jedes Release als agentenbezogenes Artefakt: Anweisungen, Metadaten, deklarierte Berechtigungen, Dateien, Funktionssignale, Signale statischer Scans, SkillSpector-Feststellungen, VirusTotal-Telemetrie und vom Herausgeber bereitgestellten Kontext. Signale statischer Scans sind interner Kontext für diese Prüfung; sie stellen weder einen eigenständigen öffentlichen Auditabschnitt noch ein die Installation blockierendes Urteil dar.

Die Risikoanalyse verwendet die
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als Bezugsrahmen für Risiken wie Prompt-Injection, Missbrauch von Tools, Offenlegung von Anmeldedaten, unsichere Ausführung, Manipulation von Speicher oder Kontext sowie übermäßige Handlungsautonomie.

ClawScan stuft eine beunruhigend wirkende Funktion nicht automatisch als bösartig ein. Es prüft, ob die Funktion offengelegt ist, dem vorgesehenen Zweck entspricht und durch den angegebenen Anwendungsfall des Releases gerechtfertigt ist.
