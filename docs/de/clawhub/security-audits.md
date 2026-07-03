---
read_when:
    - ClawHub-Sicherheitsauditergebnisse verstehen
    - Entscheiden, ob Sie eine Skill oder ein Plugin installieren sollten
    - ClawHub-Auditstatus, Risikostufe oder Ergebnisse erklären
sidebarTitle: Security Audits
summary: So verstehen Sie die Ergebnisse der ClawHub-Sicherheitsprüfung, bevor Sie einen Skill oder ein Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-03T23:29:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsprüfungen

ClawHub-Sicherheitsprüfungen helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug ist,
um installiert zu werden. Sie zeigen, was ein Release tut, welche Befugnisse es anfordert und
ob etwas besondere Aufmerksamkeit verdient, bevor es auf Dateien, Konten,
Anmeldedaten, Code oder externe Dienste zugreifen kann.

Prüfungen sind starke Sicherheitssignale, aber keine Garantie dafür, dass ein Release
risikofrei ist. Nutzen Sie immer Ihr eigenes Urteilsvermögen, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Akzeptable Nutzung](/clawhub/acceptable-usage)
und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was vor der Installation zu prüfen ist

Prüfen Sie vor der Installation:

- den gesamten Prüfstatus
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Eigentümer, Quelle, Version, Changelog, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Prüfstatus

Der Prüfstatus sagt Ihnen, wie Sie auf das Prüfergebnis reagieren sollten:

| Status      | Bedeutung                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb eines niedrigen Risikos gefunden. |
| `Review`    | Lesen Sie die Befunde vor der Installation. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit hoher Auswirkung oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                         |
| `Pending`   | Die Prüfungen sind noch nicht abgeschlossen.                                |
| `Error`     | Die Prüfung konnte nicht abgeschlossen werden.                              |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihr eigenes Urteilsvermögen. Das ist
vor allem bei Tools wichtig, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder
auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den möglichen Wirkungsbereich: wie viel Macht das Release zu haben scheint, wenn
Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                       |
| ----------- | ------------------------------------------------------------------------------- |
| `Low`       | Es wurden wenig sensible Befugnisse oder geringe Auswirkungen auf Benutzer gefunden. |
| `Medium`    | Das Release hat relevante Befugnisse, etwa Kontozugriff oder Datenänderungen.   |
| `High`      | Das Release hat Befugnisse mit hoher Auswirkung, schwerwiegende Befunde oder bösartige Signale. |

Risikostufe und Prüfstatus beantworten unterschiedliche Fragen:

- Risikostufe fragt: „Wie viel Macht steckt hier?“
- Prüfstatus fragt: „Was sollte ich mit diesem Ergebnis tun?“

Beispielsweise kann ein Veröffentlichungs-Skill `Review` mit Risiko `Medium` anzeigen. Das bedeutet
nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckkonform wirkt, aber
mit relevanten Kontobefugnissen handeln kann.

## Befunde

Befunde erklären, warum ein Prüfergebnis angezeigt wurde. Jeder Befund enthält normalerweise:

- was er bedeutet
- warum er markiert wurde
- den relevanten Skill- oder Plugin-Inhalt
- eine Empfehlung

Befunde können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem
Schweregrad tragen stärker zur Risikostufe und zum Prüfstatus bei.

Befunde mit geringer Sicherheit werden aus der öffentlichen Prüfzusammenfassung ausgeblendet, damit die Seite
auf nützliche Belege fokussiert bleibt.

## Was ClawHub prüft

ClawHub prüft eingereichte Release-Artefakte, einschließlich:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Fähigkeitsmetadaten

Die Hauptfrage ist Kohärenz: Stimmen Name, Zusammenfassung, Metadaten, angeforderte
Befugnisse und tatsächlicher Inhalt mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Leistungsstarkes Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten,
lokale Befehle, Provider-APIs oder Paketinstallationen. Die Prüfung kontrolliert, ob diese
Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf die vollständige Prüfung unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Prüfseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Prüf-Stack. VirusTotal ist ein
vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scanning, und unsere
Partnerschaft ermöglicht es ClawHub, die Prüfung von Skills und Plugins um breitere Sicherheitsinformationen
zu ergänzen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Engine-Treffer und
Reputationssignale, die ClawHubs agentenbewusste Prüfung ergänzen. Wenn Zählungen von Anbieter-Engines
verfügbar sind, fasst die Prüfung sie in einfacher Sprache zusammen, zum Beispiel:

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

VirusTotal bleibt Telemetrie. Es ersetzt nicht ClawHubs eigene artefaktbewusste
Risikoanalyse.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan unterstützt, ClawHubs eigenem Sicherheitsprüfungssystem.
Es prüft jedes Release als agentenorientiertes Artefakt: Anweisungen,
Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, statische Scan-Signale,
SkillSpector-Befunde, VirusTotal-Telemetrie und vom Publisher bereitgestellten Kontext.
Statische Scan-Signale sind interner Kontext für diese Prüfung; sie sind kein
eigenständiger öffentlicher Prüfabschnitt und kein installierungsblockierendes Urteil.

Die Risikoanalyse verwendet die
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als Blickwinkel für Risiken wie Prompt-Injection, Tool-Missbrauch, Offenlegung von Anmeldedaten,
unsichere Ausführung, Memory- oder Kontextvergiftung und übermäßige Eigenständigkeit.

ClawScan behandelt eine gefährlich wirkende Fähigkeit nicht automatisch als bösartig.
Es fragt, ob die Fähigkeit offengelegt, zweckkonform und durch den angegebenen Anwendungsfall
des Releases gestützt ist.
