---
read_when:
    - ClawHub-Sicherheitsaudit-Ergebnisse verstehen
    - Entscheiden, ob Sie ein Skill oder ein Plugin installieren sollen
    - ClawHub-Auditstatus, Risikostufe oder Befunde erklären
sidebarTitle: Security Audits
summary: So verstehen Sie die ClawHub-Sicherheitsaudit-Ergebnisse, bevor Sie einen Skill oder ein Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-04T17:57:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

ClawHub-Sicherheitsaudits helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug für die Installation ist. Sie zeigen, was ein Release tut, welche Befugnisse es anfordert und ob etwas besondere Aufmerksamkeit erfordert, bevor es auf Dateien, Konten, Anmeldedaten, Code oder externe Dienste zugreifen kann.

Audits sind starke Sicherheitssignale, aber sie garantieren nicht, dass ein Release risikofrei ist. Nutzen Sie immer Ihr eigenes Urteilsvermögen, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Akzeptable Nutzung](/clawhub/acceptable-usage) und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was Sie vor der Installation prüfen sollten

Prüfen Sie vor der Installation:

- den allgemeinen Auditstatus
- die Risikostufe
- alle aufgeführten Findings
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Owner, Quelle, Version, Changelog, Downloads, Stars und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Auditstatus

Der Auditstatus gibt an, wie Sie auf das Auditergebnis reagieren sollten:

| Status      | Bedeutung                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb eines niedrigen Risikos gefunden. |
| `Review`    | Lesen Sie die Findings vor der Installation. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit hoher Auswirkung oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                       |
| `Pending`   | Audits sind noch nicht abgeschlossen.                                      |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                               |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihr eigenes Urteilsvermögen. Das ist besonders wichtig für Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den Blast Radius: wie viel Macht das Release offenbar hat, wenn Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                    |
| ----------- | ---------------------------------------------------------------------------- |
| `Low`       | Es wurden nur geringe sensible Befugnisse oder geringe Auswirkungen auf Nutzer gefunden. |
| `Medium`    | Das Release hat bedeutende Befugnisse, etwa Kontozugriff oder Datenänderungen. |
| `High`      | Das Release hat Befugnisse mit hoher Auswirkung, schwerwiegende Findings oder bösartige Signale. |

Risikostufe und Auditstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht ist hier vorhanden?“
- Der Auditstatus fragt: „Was sollte ich mit diesem Ergebnis tun?“

Ein Veröffentlichungs-Skill kann zum Beispiel `Review` mit `Medium`-Risiko anzeigen. Das bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckkonform erscheint, aber mit bedeutenden Kontobefugnissen handeln kann.

## Findings

Findings erklären, warum ein Auditergebnis angezeigt wurde. Jedes Finding enthält in der Regel:

- was es bedeutet
- warum es markiert wurde
- den relevanten Skill- oder Plugin-Inhalt
- eine Empfehlung

Findings können als `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Findings mit höherem Schweregrad tragen stärker zur Risikostufe und zum Auditstatus bei.

Findings mit geringer Zuverlässigkeit werden aus der öffentlichen Audit-Zusammenfassung ausgeblendet, damit die Seite auf nützliche Nachweise fokussiert bleibt.

## Was ClawHub prüft

ClawHub auditiert eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Fähigkeitsmetadaten

Die Hauptfrage ist Kohärenz: Passen Name, Zusammenfassung, Metadaten, angeforderte Befugnisse und tatsächlicher Inhalt zu dem, was Nutzer vernünftigerweise erwarten würden?

Leistungsfähiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten, lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf das vollständige Audit unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Auditseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-Stack. VirusTotal ist ein vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scanning, und unsere Partnerschaft ermöglicht es ClawHub, die Prüfung von Skills und Plugins um breitere Sicherheitsinformationen zu ergänzen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Engine-Treffer und Reputationssignale, die ClawHubs agentenbewusste Prüfung ergänzen. Wenn Anbieter-Engine-Zählungen verfügbar sind, fasst das Audit sie in verständlicher Sprache zusammen, zum Beispiel:

```text
62/62 vendors flagged this skill as clean.
```

oder:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wenn ClawHub keine Anbieterzählungs-Telemetrie zum Zusammenfassen hat, lautet das Audit:

```text
No VirusTotal findings
```

VirusTotal bleibt Telemetrie. Es ersetzt nicht ClawHubs eigene artefaktbewusste Risikoanalyse.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan unterstützt, ClawHubs eigenem Sicherheitsauditsystem. Es prüft jedes Release als agentenorientiertes Artefakt: Anweisungen, Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, statische Scan-Signale, SkillSpector-Findings, VirusTotal-Telemetrie und vom Publisher bereitgestellten Kontext. Statische Scan-Signale sind interner Kontext für diese Prüfung; sie sind kein eigenständiger öffentlicher Auditabschnitt und kein installierungsblockierendes Urteil.

Die Risikoanalyse verwendet die [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) als Perspektive auf Risiken wie Prompt Injection, Tool-Missbrauch, Offenlegung von Anmeldedaten, unsichere Ausführung, Memory- oder Kontextvergiftung und übermäßige Handlungsmacht.

ClawScan behandelt eine gefährlich wirkende Fähigkeit nicht automatisch als bösartig. Es fragt, ob die Fähigkeit offengelegt, zweckkonform und durch den angegebenen Anwendungsfall des Releases gestützt ist.
