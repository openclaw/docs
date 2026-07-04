---
read_when:
    - ClawHub-Sicherheitsaudit-Ergebnisse verstehen
    - Entscheiden, ob ein Skill oder Plugin installiert werden soll
    - Erläuterung von ClawHub-Auditstatus, Risikostufe oder Befunden
sidebarTitle: Security Audits
summary: So verstehen Sie die Ergebnisse von ClawHub-Sicherheitsaudits, bevor Sie einen Skill oder ein Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-04T10:33:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

ClawHub-Sicherheitsaudits helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug ist, um installiert zu werden. Sie zeigen, was ein Release tut, welche Befugnisse es anfordert und ob etwas besondere Aufmerksamkeit verdient, bevor es auf Dateien, Konten, Zugangsdaten, Code oder externe Dienste zugreifen kann.

Audits sind starke Sicherheitssignale, aber keine Garantie dafür, dass ein Release risikofrei ist. Nutzen Sie immer Ihr eigenes Urteilsvermögen, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Akzeptable Nutzung](/clawhub/acceptable-usage) und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was Sie vor der Installation prüfen sollten

Prüfen Sie vor der Installation:

- den allgemeinen Audit-Status
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Zugangsdaten, Berechtigungen oder Umgebungsvariablen
- Eigentümer, Quelle, Version, Changelog, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Audit-Status

Der Audit-Status sagt Ihnen, wie Sie auf das Audit-Ergebnis reagieren sollten:

| Status      | Bedeutung                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb eines niedrigen Risikos gefunden. |
| `Review`    | Lesen Sie die Befunde vor der Installation. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit hoher Auswirkung oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                       |
| `Pending`   | Die Audits sind noch nicht abgeschlossen.                                  |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                               |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihr eigenes Urteilsvermögen. Das ist besonders wichtig bei Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den Wirkungsbereich: wie viel Macht das Release zu haben scheint, wenn Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                  |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Es wurden nur geringe sensible Befugnisse oder Auswirkungen auf Benutzer gefunden. |
| `Medium`   | Das Release hat erhebliche Befugnisse, etwa Kontozugriff oder Datenänderungen. |
| `High`     | Das Release hat Befugnisse mit hoher Auswirkung, schwerwiegende Befunde oder bösartige Signale. |

Risikostufe und Audit-Status beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht steckt hier?“
- Der Audit-Status fragt: „Was sollte ich mit diesem Ergebnis tun?“

Zum Beispiel kann ein Publishing-Skill `Review` mit `Medium`-Risiko anzeigen. Das bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckorientiert wirkt, aber mit erheblichen Kontobefugnissen handeln kann.

## Befunde

Befunde erklären, warum ein Audit-Ergebnis angezeigt wurde. Jeder Befund enthält in der Regel:

- was er bedeutet
- warum er markiert wurde
- den relevanten Skill- oder Plugin-Inhalt
- eine Empfehlung

Befunde können als `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem Schweregrad tragen stärker zur Risikostufe und zum Audit-Status bei.

Befunde mit niedriger Zuverlässigkeit werden aus der öffentlichen Audit-Zusammenfassung ausgeblendet, damit die Seite auf nützliche Nachweise fokussiert bleibt.

## Was ClawHub prüft

ClawHub auditiert eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Fähigkeitsmetadaten

Die Hauptfrage ist Kohärenz: Passen Name, Zusammenfassung, Metadaten, angeforderte Befugnisse und tatsächlicher Inhalt zu dem, was Benutzer vernünftigerweise erwarten würden?

Mächtiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Zugangsdaten, lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf das vollständige Audit unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Audit-Seite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-Stack. VirusTotal ist ein vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scanning, und unsere Partnerschaft ermöglicht es ClawHub, die Prüfung von Skills und Plugins um breitere Sicherheitsinformationen zu erweitern.

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

Die Risikoanalyse wird intern von ClawScan betrieben, ClawHubs eigenem Sicherheitsaudit-System. Es prüft jedes Release als agentenorientiertes Artefakt: Anweisungen, Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, statische Scan-Signale, SkillSpector-Befunde, VirusTotal-Telemetrie und vom Herausgeber bereitgestellten Kontext. Statische Scan-Signale sind interner Kontext für diese Prüfung; sie sind kein eigenständiger öffentlicher Audit-Abschnitt und kein installationsblockierendes Urteil.

Die Risikoanalyse nutzt die [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) als Perspektive für Risiken wie Prompt Injection, Tool-Missbrauch, Offenlegung von Zugangsdaten, unsichere Ausführung, Memory- oder Kontextvergiftung und übermäßige Handlungsfähigkeit.

ClawScan behandelt eine bedrohlich wirkende Fähigkeit nicht automatisch als bösartig. Es fragt, ob die Fähigkeit offengelegt, zweckorientiert und durch den angegebenen Anwendungsfall des Releases gestützt ist.
