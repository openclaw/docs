---
read_when:
    - ClawHub-Sicherheitsaudit-Ergebnisse verstehen
    - Entscheiden, ob ein Skill oder Plugin installiert werden soll
    - Erläuterung des ClawHub-Auditstatus, der Risikostufe oder der Befunde
sidebarTitle: Security Audits
summary: Wie Sie die Ergebnisse der ClawHub-Sicherheitsprüfung verstehen, bevor Sie ein Skill oder Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-01T05:34:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

ClawHub-Sicherheitsaudits helfen Ihnen zu entscheiden, ob ein Skill oder Plugin sicher genug
für die Installation ist. Sie zeigen, was ein Release tut, welche Berechtigungen es anfordert und
ob etwas besondere Aufmerksamkeit verdient, bevor es auf Dateien, Konten,
Anmeldedaten, Code oder externe Dienste zugreifen kann.

Audits sind starke Sicherheitssignale, aber keine Garantie dafür, dass ein Release
risikofrei ist. Treffen Sie immer eine eigene Einschätzung, bevor Sie sensiblen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Akzeptable Nutzung](/de/clawhub/acceptable-usage)
und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was Sie vor der Installation prüfen sollten

Prüfen Sie vor der Installation:

- den gesamten Auditstatus
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Eigentümer, Quelle, Version, Changelog, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Auditstatus

Der Auditstatus zeigt Ihnen, wie Sie auf das Auditergebnis reagieren sollten:

| Status      | Bedeutung                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb eines niedrigen Risikos gefunden. |
| `Review`    | Lesen Sie die Befunde vor der Installation. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit hoher Auswirkung oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                       |
| `Pending`   | Die Audits sind noch nicht abgeschlossen.                                 |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                              |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihre eigene Einschätzung. Das ist
besonders wichtig für Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder
auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den Wirkungsbereich: wie viel Macht das Release offenbar hat, wenn
Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Es wurde wenig sensible Berechtigung oder Auswirkung auf Nutzer gefunden.       |
| `Medium`   | Das Release hat relevante Berechtigungen, etwa Kontozugriff oder Datenänderungen. |
| `High`     | Das Release hat Berechtigungen mit hoher Auswirkung, schwerwiegende Befunde oder bösartige Signale. |

Risikostufe und Auditstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht ist hier vorhanden?“
- Der Auditstatus fragt: „Was sollte ich mit diesem Ergebnis tun?“

Beispielsweise kann ein Veröffentlichungs-Skill `Review` mit `Medium`-Risiko anzeigen. Das bedeutet
nicht, dass er bösartig ist. Es bedeutet, dass der Skill zweckentsprechend erscheint, aber
mit relevanten Kontoberechtigungen handeln kann.

## Befunde

Befunde erklären, warum ein Auditergebnis angezeigt wurde. Jeder Befund enthält normalerweise:

- was er bedeutet
- warum er markiert wurde
- den relevanten Skill- oder Plugin-Inhalt
- eine Empfehlung

Befunde können als `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem
Schweregrad tragen stärker zur Risikostufe und zum Auditstatus bei.

Befunde mit geringer Konfidenz werden aus der öffentlichen Audit-Zusammenfassung ausgeblendet, damit die Seite
auf nützliche Belege fokussiert bleibt.

## Was ClawHub prüft

ClawHub auditiert eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Funktionsmetadaten

Die Hauptfrage ist Kohärenz: Passen Name, Zusammenfassung, Metadaten, angeforderte
Berechtigungen und tatsächlicher Inhalt zu dem, was Nutzer vernünftigerweise erwarten würden?

Mächtiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten,
lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese
Macht erwartet, offengelegt und verhältnismäßig ist.

Artefaktseiten verlinken auf das vollständige Audit unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Auditseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-Stack. VirusTotal ist ein
vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scanning, und unsere
Partnerschaft ermöglicht ClawHub, umfassendere Sicherheitsinformationen zur Skill- und Plugin-
Prüfung hinzuzufügen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Engine-Treffer und
Reputationssignale, die ClawHubs agentenbewusste Prüfung ergänzen. Wenn Zählwerte von Anbieter-
Engines verfügbar sind, fasst das Audit sie in einfacher Sprache zusammen, zum Beispiel:

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

VirusTotal bleibt Telemetrie. Es ersetzt nicht ClawHubs eigene artefaktbewusste
Risikoanalyse.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan betrieben, ClawHubs eigenem Sicherheitsaudit-
System. Es prüft jedes Release als agentenorientiertes Artefakt: Anweisungen,
Metadaten, deklarierte Berechtigungen, Dateien, Funktionssignale, statische Scan-Signale,
SkillSpector-Befunde, VirusTotal-Telemetrie und vom Herausgeber bereitgestellten Kontext.
Statische Scan-Signale sind interner Kontext für diese Prüfung; sie sind kein
eigenständiger öffentlicher Auditabschnitt und kein installationsblockierendes Urteil.

Die Risikoanalyse verwendet die
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als Perspektive für Risiken wie Prompt-Injection, Tool-Missbrauch, Offenlegung von Anmeldedaten,
unsichere Ausführung, Memory- oder Context-Poisoning und übermäßige Handlungsautonomie.

ClawScan behandelt eine bedrohlich wirkende Fähigkeit nicht automatisch als bösartig.
Es fragt, ob die Fähigkeit offengelegt, zweckentsprechend und durch den angegebenen Anwendungsfall
des Releases gestützt ist.
