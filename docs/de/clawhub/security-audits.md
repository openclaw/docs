---
read_when:
    - ClawHub-Sicherheitsaudit-Ergebnisse verstehen
    - Entscheiden, ob ein Skill oder Plugin installiert werden soll
    - ClawHub-Auditstatus, Risikostufe oder Befunde erklären
sidebarTitle: Security Audits
summary: So verstehen Sie die Ergebnisse der ClawHub-Sicherheitsprüfung, bevor Sie ein Skill oder Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-04T06:27:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

ClawHub-Sicherheitsaudits helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug zur Installation ist. Sie zeigen, was ein Release tut, welche Berechtigungen es anfordert und ob etwas besondere Aufmerksamkeit erfordert, bevor es auf Dateien, Konten, Anmeldedaten, Code oder externe Dienste zugreifen kann.

Audits sind starke Sicherheitssignale, aber keine Garantie dafür, dass ein Release risikofrei ist. Verwenden Sie immer Ihr eigenes Urteilsvermögen, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Akzeptable Nutzung](/clawhub/acceptable-usage) und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was vor der Installation zu prüfen ist

Prüfen Sie vor der Installation:

- den gesamten Auditstatus
- die Risikostufe
- alle aufgeführten Feststellungen
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Besitzer, Quelle, Version, Changelog, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Auditstatus

Der Auditstatus sagt Ihnen, wie Sie auf das Auditergebnis reagieren sollten:

| Status      | Bedeutung                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb eines niedrigen Risikos gefunden.                     |
| `Review`    | Lesen Sie die Feststellungen vor der Installation. Das Release kann dennoch legitim sein.       |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein schwerwiegendes Problem oder Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                                            |
| `Pending`   | Audits sind noch nicht abgeschlossen.                                                          |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                                                    |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihr eigenes Urteilsvermögen. Dies ist besonders wichtig für Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den Wirkungsbereich: wie viel Macht das Release offenbar hat, wenn Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------- |
| `Low`       | Es wurde wenig sensible Berechtigung oder Auswirkung auf Benutzer gefunden.                          |
| `Medium`    | Das Release hat relevante Berechtigungen, etwa Kontozugriff oder Datenänderungen.                    |
| `High`      | Das Release hat Berechtigungen mit hoher Auswirkung, schwerwiegende Feststellungen oder bösartige Signale. |

Risikostufe und Auditstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht steckt hier?“
- Der Auditstatus fragt: „Was sollte ich mit diesem Ergebnis tun?“

Zum Beispiel kann ein Veröffentlichungs-Skill `Review` mit `Medium`-Risiko anzeigen. Das bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckorientiert erscheint, aber mit relevanten Kontoberechtigungen handeln kann.

## Feststellungen

Feststellungen erklären, warum ein Auditergebnis angezeigt wurde. Jede Feststellung enthält in der Regel:

- was sie bedeutet
- warum sie markiert wurde
- den relevanten Skill- oder Plugin-Inhalt
- eine Empfehlung

Feststellungen können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Feststellungen mit höherem Schweregrad tragen stärker zur Risikostufe und zum Auditstatus bei.

Feststellungen mit geringer Zuverlässigkeit werden aus der öffentlichen Audit-Zusammenfassung ausgeblendet, damit die Seite auf nützliche Nachweise fokussiert bleibt.

## Was ClawHub prüft

ClawHub auditiert eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Capability-Metadaten

Die Hauptfrage ist Kohärenz: Stimmen Name, Zusammenfassung, Metadaten, angeforderte Berechtigungen und tatsächlicher Inhalt mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Mächtiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten, lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf das vollständige Audit unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Auditseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-Stack. VirusTotal ist ein vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scanning, und unsere Partnerschaft ermöglicht ClawHub, die Prüfung von Skills und Plugins um breitere Sicherheitsinformationen zu ergänzen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Engine-Treffer und Reputationssignale, die ClawHubs agentenbewusste Prüfung ergänzen. Wenn Zählungen von Anbieter-Engines verfügbar sind, fasst das Audit sie in einfacher Sprache zusammen, zum Beispiel:

```text
62/62 vendors flagged this skill as clean.
```

oder:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wenn ClawHub keine Anbieterzählungs-Telemetrie zusammenfassen kann, sagt das Audit:

```text
No VirusTotal findings
```

VirusTotal bleibt Telemetrie. Es ersetzt nicht ClawHubs eigene artefaktbewusste Risikoanalyse.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan unterstützt, ClawHubs eigenem Sicherheitsauditsystem. Sie prüft jedes Release als agentengerichtetes Artefakt: Anweisungen, Metadaten, deklarierte Berechtigungen, Dateien, Capability-Signale, statische Scan-Signale, SkillSpector-Feststellungen, VirusTotal-Telemetrie und vom Publisher bereitgestellten Kontext. Statische Scan-Signale sind interner Kontext für diese Prüfung; sie sind kein eigenständiger öffentlicher Auditabschnitt und kein installationsblockierendes Urteil.

Die Risikoanalyse verwendet die [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) als Perspektive auf Risiken wie Prompt Injection, Tool-Missbrauch, Offenlegung von Anmeldedaten, unsichere Ausführung, Memory- oder Context-Poisoning und übermäßige Handlungsautonomie.

ClawScan behandelt eine gefährlich wirkende Capability nicht automatisch als bösartig. Es fragt, ob die Capability offengelegt, zweckorientiert und durch den angegebenen Anwendungsfall des Releases gestützt ist.
