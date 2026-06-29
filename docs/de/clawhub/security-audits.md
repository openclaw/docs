---
read_when:
    - ClawHub-Sicherheitsauditergebnisse verstehen
    - Entscheiden, ob ein Skill oder Plugin installiert werden soll
    - ClawHub-Auditstatus, Risikostufe oder Befunde erklären
sidebarTitle: Security Audits
summary: So verstehen Sie ClawHub-Sicherheitsauditergebnisse, bevor Sie ein Skill oder Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-06-28T22:32:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

ClawHub-Sicherheitsaudits helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug
für die Installation ist. Sie zeigen, was ein Release tut, welche Befugnisse es anfordert und
ob etwas besondere Aufmerksamkeit erfordert, bevor es auf Dateien, Konten,
Anmeldedaten, Code oder externe Dienste zugreifen kann.

Audits sind starke Sicherheitssignale, aber keine Garantie dafür, dass ein Release
risikofrei ist. Nutzen Sie immer Ihr eigenes Urteil, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/de/clawhub/security), [Akzeptable Nutzung](/de/clawhub/acceptable-usage)
und [Moderation und Kontosicherheit](/de/clawhub/moderation).

## Was Sie vor der Installation prüfen sollten

Prüfen Sie vor der Installation:

- den gesamten Audit-Status
- die Risikostufe
- alle aufgeführten Feststellungen
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Eigentümer, Quelle, Version, Änderungsprotokoll, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Audit-Status

Der Audit-Status gibt an, wie Sie auf das Audit-Ergebnis reagieren sollten:

| Status      | Bedeutung                                                                  |
| ----------- | -------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem über geringem Risiko gefunden.            |
| `Review`    | Lesen Sie vor der Installation die Feststellungen. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit hoher Auswirkung oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                        |
| `Pending`   | Audits sind noch nicht abgeschlossen.                                      |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                               |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihr eigenes Urteil. Das ist am
wichtigsten bei Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder
auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den möglichen Schaden: wie viel Macht das Release zu haben scheint, wenn
Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                       |
| ----------- | ------------------------------------------------------------------------------- |
| `Low`       | Es wurden nur wenige sensible Befugnisse oder Auswirkungen auf Benutzer gefunden. |
| `Medium`    | Das Release hat bedeutende Befugnisse, etwa Kontozugriff oder Datenänderungen.  |
| `High`      | Das Release hat Befugnisse mit hoher Auswirkung, schwerwiegende Feststellungen oder bösartige Signale. |

Risikostufe und Audit-Status beantworten unterschiedliche Fragen:

- Risikostufe fragt: „Wie viel Macht steckt hier?“
- Audit-Status fragt: „Was soll ich mit diesem Ergebnis tun?“

Beispielsweise kann ein Veröffentlichungs-Skill `Review` mit `Medium`-Risiko anzeigen. Das bedeutet
nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckkonform erscheint, aber
mit bedeutenden Kontobefugnissen handeln kann.

## Feststellungen

Feststellungen erklären, warum ein Audit-Ergebnis angezeigt wurde. Jede Feststellung enthält in der Regel:

- was sie bedeutet
- warum sie markiert wurde
- den relevanten Skill- oder Plugin-Inhalt
- eine Empfehlung

Feststellungen können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Feststellungen mit höherem
Schweregrad tragen stärker zur Risikostufe und zum Audit-Status bei.

Feststellungen mit geringer Vertrauenswürdigkeit werden aus der öffentlichen Audit-Zusammenfassung ausgeblendet, damit die Seite
auf nützliche Nachweise fokussiert bleibt.

## Was ClawHub prüft

ClawHub auditiert eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Funktionsmetadaten

Die Hauptfrage ist Kohärenz: Stimmen Name, Zusammenfassung, Metadaten, angeforderte
Befugnisse und tatsächlicher Inhalt mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Leistungsfähiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten,
lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese
Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf das vollständige Audit unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Audit-Seite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-Stack. VirusTotal ist ein
vertrauenswürdiger Industriestandard für Dateireputation und Malware-Scanning, und unsere
Partnerschaft ermöglicht ClawHub, die Prüfung von Skills und Plugins um umfassendere Sicherheitsinformationen zu ergänzen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Engine-Treffer und
Reputationssignale, die die agentenbewusste Prüfung von ClawHub ergänzen. Wenn Zählungen von
Vendor-Engines verfügbar sind, fasst das Audit sie in verständlicher Sprache zusammen, zum Beispiel:

```text
62/62 vendors flagged this skill as clean.
```

oder:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wenn ClawHub keine Vendor-Zählungs-Telemetrie zusammenfassen kann, steht im Audit:

```text
No VirusTotal findings
```

VirusTotal bleibt Telemetrie. Es ersetzt nicht die eigene artefaktbewusste
Risikoanalyse von ClawHub.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan betrieben, ClawHubs eigenem Sicherheitsaudit-
System. Es prüft jedes Release als agentenorientiertes Artefakt: Anweisungen,
Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, statische Scan-Signale,
SkillSpector-Feststellungen, VirusTotal-Telemetrie und vom Herausgeber bereitgestellten Kontext.
Statische Scan-Signale sind interner Kontext für diese Prüfung; sie sind kein
eigenständiger öffentlicher Audit-Abschnitt oder installierungsblockierendes Urteil.

Die Risikoanalyse verwendet die
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als Perspektive für Risiken wie Prompt-Injection, Tool-Missbrauch, Offenlegung von Anmeldedaten,
unsichere Ausführung, Vergiftung von Speicher oder Kontext und übermäßige Handlungsfähigkeit.

ClawScan behandelt eine gefährlich wirkende Fähigkeit nicht automatisch als bösartig.
Es fragt, ob die Fähigkeit offengelegt, zweckkonform und durch den angegebenen Anwendungsfall
des Releases gestützt ist.
