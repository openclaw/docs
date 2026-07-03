---
read_when:
    - ClawHub-Sicherheitsauditergebnisse verstehen
    - Entscheiden, ob ein Skill oder Plugin installiert werden soll
    - Erklärung von ClawHub-Auditstatus, Risikostufe oder Befunden
sidebarTitle: Security Audits
summary: So verstehen Sie ClawHub-Sicherheitsaudit-Ergebnisse, bevor Sie einen Skill oder ein Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-03T09:30:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsprüfungen

ClawHub-Sicherheitsprüfungen helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug ist, um installiert zu werden. Sie zeigen, was ein Release tut, welche Befugnisse es anfordert und ob etwas besondere Aufmerksamkeit verdient, bevor es auf Dateien, Konten, Anmeldedaten, Code oder externe Dienste zugreifen kann.

Prüfungen sind starke Sicherheitssignale, aber keine Garantie dafür, dass ein Release risikofrei ist. Nutzen Sie immer Ihr eigenes Urteil, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Akzeptable Nutzung](/de/clawhub/acceptable-usage) und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was vor der Installation zu prüfen ist

Prüfen Sie vor der Installation:

- den Gesamtstatus der Prüfung
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Inhaber, Quelle, Version, Änderungsprotokoll, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Prüfstatus

Der Prüfstatus sagt Ihnen, wie Sie auf das Prüfungsergebnis reagieren sollten:

| Status      | Bedeutung                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------ |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb eines niedrigen Risikos gefunden.                 |
| `Review`    | Lesen Sie die Befunde vor der Installation. Das Release kann dennoch legitim sein.          |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit hoher Auswirkung oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                                        |
| `Pending`   | Die Prüfungen sind noch nicht abgeschlossen.                                                |
| `Error`     | Die Prüfung konnte nicht abgeschlossen werden.                                              |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihr eigenes Urteil. Das ist besonders wichtig für Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den Wirkungsbereich: wie viel Macht das Release offenbar hat, wenn Sie es bestimmungsgemäß verwenden.

| Risikostufe | Bedeutung                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------ |
| `Low`       | Es wurden nur geringe sensible Befugnisse oder Auswirkungen auf Benutzer gefunden.          |
| `Medium`    | Das Release hat nennenswerte Befugnisse, etwa Kontozugriff oder Datenänderungen.           |
| `High`      | Das Release hat Befugnisse mit hoher Auswirkung, schwere Befunde oder bösartige Signale.   |

Risikostufe und Prüfstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht steckt hier?“
- Der Prüfstatus fragt: „Was soll ich mit diesem Ergebnis tun?“

Beispielsweise kann ein Publishing-Skill `Review` mit `Medium`-Risiko anzeigen. Das bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckentsprechend wirkt, aber mit nennenswerten Kontobefugnissen handeln kann.

## Befunde

Befunde erklären, warum ein Prüfungsergebnis angezeigt wurde. Jeder Befund enthält üblicherweise:

- was er bedeutet
- warum er markiert wurde
- die relevanten Skill- oder Plugin-Inhalte
- eine Empfehlung

Befunde können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem Schweregrad tragen stärker zur Risikostufe und zum Prüfstatus bei.

Befunde mit geringer Vertrauenswürdigkeit werden aus der öffentlichen Prüfzusammenfassung ausgeblendet, damit die Seite auf nützliche Belege fokussiert bleibt.

## Was ClawHub prüft

ClawHub prüft eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Capability-Metadaten

Die zentrale Frage ist Kohärenz: Stimmen Name, Zusammenfassung, Metadaten, angeforderte Befugnisse und tatsächliche Inhalte mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Mächtiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten, lokale Befehle, Provider-APIs oder Paketinstallationen. Die Prüfung kontrolliert, ob diese Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf die vollständige Prüfung unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Prüfseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Prüfstack. VirusTotal ist ein vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scanning, und unsere Partnerschaft ermöglicht es ClawHub, die Prüfung von Skills und Plugins um breitere Sicherheitsinformationen zu erweitern.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Engine-Treffer und Reputationssignale, die ClawHubs agentenbewusste Prüfung ergänzen. Wenn Zählungen von Anbieter-Engines verfügbar sind, fasst die Prüfung sie in klarer Sprache zusammen, zum Beispiel:

```text
62/62 vendors flagged this skill as clean.
```

oder:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wenn ClawHub keine Anbieterzählungs-Telemetrie zum Zusammenfassen hat, sagt die Prüfung:

```text
No VirusTotal findings
```

VirusTotal bleibt Telemetrie. Es ersetzt nicht ClawHubs eigene artefaktbewusste Risikoanalyse.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan betrieben, ClawHubs eigenem System für Sicherheitsprüfungen. Es prüft jedes Release als agentenorientiertes Artefakt: Anweisungen, Metadaten, deklarierte Berechtigungen, Dateien, Capability-Signale, statische Scan-Signale, SkillSpector-Befunde, VirusTotal-Telemetrie und vom Publisher bereitgestellten Kontext. Statische Scan-Signale sind interner Kontext für diese Prüfung; sie sind kein eigenständiger öffentlicher Prüfabschnitt und kein installationsblockierendes Urteil.

Die Risikoanalyse verwendet die [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) als Perspektive auf Risiken wie Prompt Injection, Tool-Missbrauch, Offenlegung von Anmeldedaten, unsichere Ausführung, Memory- oder Kontextvergiftung und übermäßige Agency.

ClawScan behandelt eine gefährlich wirkende Capability nicht automatisch als bösartig. Es fragt, ob die Capability offengelegt, zweckentsprechend und durch den angegebenen Anwendungsfall des Releases gestützt ist.
