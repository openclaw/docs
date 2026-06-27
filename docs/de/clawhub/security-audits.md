---
read_when:
    - ClawHub-Sicherheitsauditergebnisse verstehen
    - Entscheiden, ob ein Skill oder Plugin installiert werden soll
    - ClawHub-Auditstatus, Risikostufe oder Feststellungen erklären
sidebarTitle: Security Audits
summary: Wie Sie die Ergebnisse von ClawHub-Sicherheitsaudits verstehen, bevor Sie ein Skill oder Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-06-27T17:16:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

ClawHub-Sicherheitsaudits helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug für die Installation ist. Sie zeigen, was ein Release tut, welche Berechtigungen es anfordert und ob etwas besondere Aufmerksamkeit verdient, bevor es auf Dateien, Konten, Zugangsdaten, Code oder externe Dienste zugreifen kann.

Audits sind starke Sicherheitssignale, aber sie garantieren nicht, dass ein Release risikofrei ist. Entscheiden Sie immer sorgfältig, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/de/clawhub/security), [Zulässige Nutzung](/de/clawhub/acceptable-usage) und [Moderation und Kontosicherheit](/de/clawhub/moderation).

## Was Sie vor der Installation prüfen sollten

Prüfen Sie vor der Installation:

- den allgemeinen Auditstatus
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Zugangsdaten, Berechtigungen oder Umgebungsvariablen
- Besitzer, Quelle, Version, Changelog, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Auditstatus

Der Auditstatus sagt Ihnen, wie Sie auf das Auditergebnis reagieren sollten:

| Status      | Bedeutung                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem über niedrigem Risiko gefunden.                                  |
| `Review`    | Lesen Sie vor der Installation die Befunde. Das Release kann dennoch legitim sein.                |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit hoher Auswirkung oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                                               |
| `Pending`   | Die Audits sind noch nicht abgeschlossen.                                                         |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                                                      |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihre eigene Einschätzung. Das ist besonders wichtig für Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den Wirkungsbereich: wie viel Macht das Release offenbar hat, wenn Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Low`       | Es wurde wenig sensible Berechtigung oder Auswirkung auf Benutzer gefunden. |
| `Medium`    | Das Release hat relevante Berechtigungen, etwa Kontozugriff oder Datenänderungen. |
| `High`      | Das Release hat Berechtigungen mit hoher Auswirkung, schwerwiegende Befunde oder bösartige Signale. |

Risikostufe und Auditstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht steckt hier?“
- Der Auditstatus fragt: „Was sollte ich mit diesem Ergebnis tun?“

Ein veröffentlichender Skill kann beispielsweise `Review` mit `Medium`-Risiko anzeigen. Das bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckkonform erscheint, aber mit relevanter Kontoberechtigung handeln kann.

## Befunde

Befunde erklären, warum ein Auditergebnis angezeigt wurde. Jeder Befund enthält üblicherweise:

- was er bedeutet
- warum er markiert wurde
- den relevanten Skill- oder Plugin-Inhalt
- eine Empfehlung

Befunde können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem Schweregrad tragen stärker zur Risikostufe und zum Auditstatus bei.

Befunde mit geringer Sicherheit werden aus der öffentlichen Audit-Zusammenfassung ausgeblendet, damit die Seite auf nützliche Nachweise fokussiert bleibt.

## Was ClawHub prüft

ClawHub auditiert eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Fähigkeitsmetadaten

Die Hauptfrage ist Kohärenz: Stimmen Name, Zusammenfassung, Metadaten, angeforderte Berechtigungen und tatsächlicher Inhalt mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Mächtiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Zugangsdaten, lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf das vollständige Audit unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Auditseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-Stack. VirusTotal ist ein vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scanning, und unsere Partnerschaft ermöglicht ClawHub, Skill- und Plugin-Reviews um breitere Sicherheitsinformationen zu ergänzen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Engine-Treffer und Reputationssignale, die ClawHubs agentenbewusste Review ergänzen. Wenn Zählungen von Hersteller-Engines verfügbar sind, fasst das Audit sie in verständlicher Sprache zusammen, zum Beispiel:

```text
62/62 vendors flagged this skill as clean.
```

oder:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wenn ClawHub keine Herstellerzählungs-Telemetrie zusammenfassen kann, sagt das Audit:

```text
No VirusTotal findings
```

VirusTotal bleibt Telemetrie. Es ersetzt nicht ClawHubs eigene artefaktbewusste Risikoanalyse.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan betrieben, ClawHubs eigenem Sicherheitsauditsystem. Sie prüft jedes Release als agentenorientiertes Artefakt: Anweisungen, Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, statische Scan-Signale, SkillSpector-Befunde, VirusTotal-Telemetrie und vom Publisher bereitgestellten Kontext. Statische Scan-Signale sind interner Kontext für diese Review; sie sind kein eigenständiger öffentlicher Auditabschnitt und kein installationsblockierendes Urteil.

Die Risikoanalyse verwendet die [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) als Linse für Risiken wie Prompt Injection, Tool-Missbrauch, Offenlegung von Zugangsdaten, unsichere Ausführung, Memory- oder Context-Poisoning und übermäßige Eigenständigkeit.

ClawScan behandelt eine gefährlich wirkende Fähigkeit nicht automatisch als bösartig. Es fragt, ob die Fähigkeit offengelegt, zweckkonform und durch den angegebenen Anwendungsfall des Releases gestützt ist.
