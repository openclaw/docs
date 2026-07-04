---
read_when:
    - ClawHub-Sicherheitsaudit-Ergebnisse verstehen
    - Entscheiden, ob Sie ein Skill oder Plugin installieren sollten
    - ClawHub-Prüfstatus, Risikostufe oder Befunde erklären
sidebarTitle: Security Audits
summary: So verstehen Sie ClawHub-Sicherheitsauditergebnisse, bevor Sie einen Skill oder ein Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-04T20:28:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

Sicherheitsaudits von ClawHub helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug ist, um installiert zu werden. Sie zeigen, was ein Release tut, welche Befugnisse es anfordert und ob etwas besondere Aufmerksamkeit verdient, bevor es auf Dateien, Konten, Zugangsdaten, Code oder externe Dienste zugreifen kann.

Audits sind starke Sicherheitssignale, aber sie garantieren nicht, dass ein Release risikofrei ist. Nutzen Sie immer Ihr eigenes Urteilsvermögen, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Akzeptable Nutzung](/clawhub/acceptable-usage) und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was vor der Installation zu prüfen ist

Prüfen Sie vor der Installation:

- den allgemeinen Auditstatus
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Zugangsdaten, Berechtigungen oder Umgebungsvariablen
- Owner, Quelle, Version, Changelog, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Auditstatus

Der Auditstatus zeigt Ihnen, wie Sie auf das Auditergebnis reagieren sollten:

| Status      | Bedeutung                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb eines niedrigen Risikos gefunden. |
| `Review`    | Lesen Sie vor der Installation die Befunde. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit großer Auswirkung oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                       |
| `Pending`   | Die Audits sind noch nicht abgeschlossen.                                 |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                              |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihr eigenes Urteilsvermögen. Das ist besonders wichtig bei Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den Auswirkungsbereich: wie viel Macht das Release zu haben scheint, wenn Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                     |
| ----------- | ----------------------------------------------------------------------------- |
| `Low`       | Es wurden nur geringe sensible Befugnisse oder Auswirkungen auf Benutzer gefunden. |
| `Medium`    | Das Release hat relevante Befugnisse, etwa Kontozugriff oder Datenänderungen. |
| `High`      | Das Release hat Befugnisse mit großer Auswirkung, schwerwiegende Befunde oder bösartige Signale. |

Risikostufe und Auditstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht steckt hier?“
- Der Auditstatus fragt: „Was sollte ich mit diesem Ergebnis tun?“

Beispielsweise kann ein Veröffentlichungs-Skill `Review` mit Risiko `Medium` anzeigen. Das bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckorientiert wirkt, aber mit relevanten Kontobefugnissen handeln kann.

## Befunde

Befunde erklären, warum ein Auditergebnis angezeigt wurde. Jeder Befund enthält in der Regel:

- was er bedeutet
- warum er markiert wurde
- die relevanten Skill- oder Plugin-Inhalte
- eine Empfehlung

Befunde können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem Schweregrad tragen stärker zur Risikostufe und zum Auditstatus bei.

Befunde mit geringer Konfidenz werden aus der öffentlichen Audit-Zusammenfassung ausgeblendet, damit die Seite auf nützliche Nachweise fokussiert bleibt.

## Was ClawHub prüft

ClawHub auditiert eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Fähigkeitsmetadaten

Die Hauptfrage ist Kohärenz: Stimmen Name, Zusammenfassung, Metadaten, angeforderte Befugnisse und tatsächliche Inhalte mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Leistungsfähiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Zugangsdaten, lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf das vollständige Audit unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Auditseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-Stack. VirusTotal ist ein vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scanning, und unsere Partnerschaft ermöglicht ClawHub, umfassendere Security Intelligence zur Prüfung von Skills und Plugins hinzuzufügen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Engine-Treffer und Reputationssignale, die ClawHubs agentenbewusste Prüfung ergänzen. Wenn Vendor-Engine-Zählungen verfügbar sind, fasst das Audit sie in einfacher Sprache zusammen, zum Beispiel:

```text
62/62 vendors flagged this skill as clean.
```

oder:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wenn ClawHub keine Vendor-Zählungs-Telemetrie zusammenfassen kann, sagt das Audit:

```text
No VirusTotal findings
```

VirusTotal bleibt Telemetrie. Es ersetzt nicht ClawHubs eigene artefaktbewusste Risikoanalyse.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan unterstützt, ClawHubs eigenem Sicherheitsauditsystem. Sie prüft jedes Release als agentenbezogenes Artefakt: Anweisungen, Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, statische Scan-Signale, SkillSpector-Befunde, VirusTotal-Telemetrie und vom Publisher bereitgestellten Kontext. Statische Scan-Signale sind interner Kontext für diese Prüfung; sie sind kein eigenständiger öffentlicher Auditabschnitt und kein installationsblockierendes Urteil.

Die Risikoanalyse verwendet die [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) als Perspektive für Risiken wie Prompt Injection, Tool-Missbrauch, Offenlegung von Zugangsdaten, unsichere Ausführung, Memory- oder Context-Poisoning und übermäßige Handlungsfähigkeit.

ClawScan behandelt eine gefährlich wirkende Fähigkeit nicht automatisch als bösartig. Es fragt, ob die Fähigkeit offengelegt, zweckorientiert und durch den angegebenen Anwendungsfall des Releases gestützt ist.
