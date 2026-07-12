---
read_when:
    - Sicherheitsaudit-Ergebnisse von ClawHub verstehen
    - Entscheidung, ob ein Skill oder Plugin installiert werden soll
    - Erläuterung des ClawHub-Prüfstatus, der Risikostufe oder der Feststellungen
sidebarTitle: Security Audits
summary: So verstehen Sie die Ergebnisse der ClawHub-Sicherheitsprüfung, bevor Sie ein Skill oder Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-12T01:30:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsprüfungen

Die Sicherheitsprüfungen von ClawHub helfen Ihnen bei der Entscheidung, ob ein Skill oder Plugin sicher genug
für die Installation ist. Sie zeigen, was ein Release bewirkt, welche Berechtigungen es anfordert und
ob etwas besondere Aufmerksamkeit erfordert, bevor es auf Dateien, Konten,
Anmeldedaten, Code oder externe Dienste zugreifen kann.

Prüfungen sind aussagekräftige Sicherheitssignale, aber keine Garantie dafür, dass ein Release
risikofrei ist. Prüfen Sie stets sorgfältig, bevor Sie vertraulichen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Zulässige Nutzung](/clawhub/acceptable-usage)
und [Moderation und Kontosicherheit](/clawhub/moderation).

## Vor der Installation zu prüfen

Prüfen Sie vor der Installation:

- den Gesamtstatus der Prüfung
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Eigentümer, Quelle, Version, Änderungsprotokoll, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Prüfstatus

Der Prüfstatus gibt an, wie Sie auf das Prüfungsergebnis reagieren sollten:

| Status      | Bedeutung                                                                       |
| ----------- | ------------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein erkennbares Problem oberhalb einer niedrigen Risikostufe gefunden. |
| `Review`    | Lesen Sie vor der Installation die Befunde. Das Release kann dennoch legitim sein. |
| `Warn`      | Lassen Sie besondere Vorsicht walten. ClawHub hat ein schwerwiegendes Problem oder Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                             |
| `Pending`   | Die Prüfungen sind noch nicht abgeschlossen.                                    |
| `Error`     | Die Prüfung konnte nicht abgeschlossen werden.                                  |

Ein `Pass` ist beruhigend, ersetzt jedoch nicht Ihre eigene Einschätzung. Dies gilt
insbesondere für Werkzeuge, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder
auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den möglichen Schadensradius: wie weitreichend die Befugnisse des Releases erscheinen, wenn
Sie es wie vorgesehen verwenden.

| Risikostufe | Bedeutung                                                                       |
| ----------- | ------------------------------------------------------------------------------- |
| `Low`       | Es wurden nur geringe vertrauliche Befugnisse oder Auswirkungen auf Benutzer festgestellt. |
| `Medium`    | Das Release verfügt über bedeutende Befugnisse, etwa Kontozugriff oder Datenänderungen. |
| `High`      | Das Release verfügt über weitreichende Befugnisse, schwerwiegende Befunde oder bösartige Signale. |

Risikostufe und Prüfstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht steckt hierin?“
- Der Prüfstatus fragt: „Wie sollte ich mit diesem Ergebnis umgehen?“

Ein Skill zum Veröffentlichen kann beispielsweise `Review` mit dem Risiko `Medium` anzeigen. Das
bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill seinem Zweck zu entsprechen scheint, aber
mit bedeutenden Kontoberechtigungen handeln kann.

## Befunde

Befunde erläutern, warum ein bestimmtes Prüfungsergebnis angezeigt wurde. Jeder Befund enthält üblicherweise:

- was er bedeutet
- warum er gekennzeichnet wurde
- den relevanten Inhalt des Skills oder Plugins
- eine Empfehlung

Befunde können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem
Schweregrad tragen stärker zur Risikostufe und zum Prüfstatus bei.

Befunde mit geringer Konfidenz werden aus der öffentlichen Prüfungsübersicht ausgeblendet, damit die Seite
auf aussagekräftige Nachweise ausgerichtet bleibt.

## Was ClawHub prüft

ClawHub prüft eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Fähigkeitsmetadaten

Die zentrale Frage ist die Stimmigkeit: Passen Name, Zusammenfassung, Metadaten, angeforderte
Berechtigungen und tatsächliche Inhalte zu dem, was Benutzer vernünftigerweise erwarten würden?

Weitreichende Funktionen sind nicht automatisch bedenklich. Viele nützliche Werkzeuge benötigen Anmeldedaten,
lokale Befehle, Provider-APIs oder Paketinstallationen. Die Prüfung stellt fest, ob diese
Befugnisse zu erwarten, offengelegt und verhältnismäßig sind.

Artefaktseiten verweisen unter folgendem Pfad auf die vollständige Prüfung:

```text
/<owner>/skills/<slug>/security-audit
```

Die Prüfungsseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Prüfungsstapel. VirusTotal ist ein
vertrauenswürdiger Branchenstandard für Dateireputation und Malware-Scans, und unsere
Partnerschaft ermöglicht ClawHub, die Prüfung von Skills und Plugins um umfassendere
Sicherheitsinformationen zu ergänzen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Erkennungen durch Scan-Engines und
Reputationssignale, die die agentenbezogene Prüfung von ClawHub ergänzen. Wenn die Anzahl der
Herstellererkennungen verfügbar ist, fasst die Prüfung sie in verständlicher Sprache zusammen, beispielsweise:

```text
62/62 vendors flagged this skill as clean.
```

oder:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wenn ClawHub keine Telemetrie zur Anzahl der Herstellererkennungen zusammenfassen kann, gibt die Prüfung Folgendes an:

```text
No VirusTotal findings
```

VirusTotal bleibt eine Telemetriequelle. Es ersetzt nicht die eigene artefaktbezogene
Risikoanalyse von ClawHub.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan unterstützt, dem eigenen Sicherheitsprüfungssystem
von ClawHub. Es prüft jedes Release als für Agenten bestimmtes Artefakt: Anweisungen,
Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, Signale statischer Scans,
SkillSpector-Befunde, VirusTotal-Telemetrie und vom Herausgeber bereitgestellten Kontext.
Signale statischer Scans dienen als interner Kontext für diese Prüfung; sie sind weder ein
eigenständiger öffentlicher Prüfungsabschnitt noch ein die Installation blockierendes Urteil.

Die Risikoanalyse verwendet die
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als Maßstab für Risiken wie Prompt-Injection, Werkzeugmissbrauch, Offenlegung von Anmeldedaten,
unsichere Ausführung, Manipulation des Speichers oder Kontexts und übermäßige Handlungsautonomie.

ClawScan stuft eine bedrohlich wirkende Fähigkeit nicht automatisch als bösartig ein.
Es prüft, ob die Fähigkeit offengelegt wurde, dem vorgesehenen Zweck entspricht und durch
den angegebenen Anwendungsfall des Releases gerechtfertigt ist.
