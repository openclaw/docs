---
read_when:
    - ClawHub-Sicherheitsauditergebnisse verstehen
    - Entscheidung, ob ein Skill oder Plugin installiert werden soll
    - ClawHub-Auditstatus, Risikostufe oder Feststellungen erläutern
sidebarTitle: Security Audits
summary: So verstehen Sie die Ergebnisse der ClawHub-Sicherheitsprüfung, bevor Sie Skills oder Plugins installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-24T03:41:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsprüfungen

ClawHub-Sicherheitsprüfungen helfen Ihnen bei der Entscheidung, ob ein Skill oder Plugin sicher genug
für die Installation ist. Sie zeigen, was ein Release tut, welche Berechtigungen es anfordert und
ob etwas besondere Aufmerksamkeit erfordert, bevor es auf Dateien, Konten,
Anmeldedaten, Code oder externe Dienste zugreifen kann.

Prüfungen sind starke Sicherheitssignale, aber keine Garantie dafür, dass ein Release
risikofrei ist. Wägen Sie stets sorgfältig ab, bevor Sie vertraulichen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Zulässige Nutzung](/clawhub/acceptable-usage)
und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was vor der Installation zu prüfen ist

Prüfen Sie vor der Installation:

- den Gesamtstatus der Prüfung
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Eigentümer, Quelle, Version, Änderungsprotokoll, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Prüfstatus

Der Prüfstatus gibt an, wie Sie auf das Prüfergebnis reagieren sollten:

| Status      | Bedeutung                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb einer niedrigen Risikostufe gefunden.                                |
| `Review`    | Lesen Sie vor der Installation die Befunde. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit erheblichen Auswirkungen oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                           |
| `Pending`   | Die Prüfungen sind noch nicht abgeschlossen.                                             |
| `Error`     | Die Prüfung konnte nicht abgeschlossen werden.                                         |

Ein `Pass` ist beruhigend, ersetzt aber nicht Ihre eigene Einschätzung. Dies ist
besonders wichtig bei Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder
auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den Schadensradius: wie viel Macht das Release bei
bestimmungsgemäßer Verwendung offenbar hat.

| Risikostufe | Bedeutung                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Es wurden nur wenige vertrauliche Berechtigungen oder Auswirkungen auf Benutzer festgestellt.                          |
| `Medium`   | Das Release verfügt über erhebliche Berechtigungen, etwa Kontozugriff oder die Möglichkeit, Daten zu ändern. |
| `High`     | Das Release verfügt über Berechtigungen mit großen Auswirkungen oder weist schwerwiegende Befunde beziehungsweise bösartige Signale auf. |

Risikostufe und Prüfstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht steckt hierin?“
- Der Prüfstatus fragt: „Was sollte ich aufgrund dieses Ergebnisses tun?“

Beispielsweise kann ein Skill zum Veröffentlichen `Review` bei einem Risiko der Stufe `Medium` anzeigen. Das
bedeutet nicht, dass er bösartig ist. Es bedeutet, dass der Skill seinem Zweck zu entsprechen scheint, aber
mit erheblichen Kontoberechtigungen handeln kann.

## Befunde

Befunde erläutern, warum ein bestimmtes Prüfergebnis angezeigt wurde. Jeder Befund enthält üblicherweise:

- was er bedeutet
- warum er markiert wurde
- die relevanten Inhalte des Skills oder Plugins
- eine Empfehlung

Befunde können mit `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem
Schweregrad tragen stärker zur Risikostufe und zum Prüfstatus bei.

Befunde mit geringer Konfidenz werden in der öffentlichen Prüfungsübersicht ausgeblendet, damit die Seite
auf aussagekräftige Nachweise fokussiert bleibt.

## Was ClawHub prüft

ClawHub prüft eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Funktionsmetadaten

Die zentrale Frage ist die Stimmigkeit: Stimmen Name, Zusammenfassung, Metadaten, angeforderte
Berechtigungen und tatsächliche Inhalte mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Leistungsstarkes Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten,
lokale Befehle, Provider-APIs oder Paketinstallationen. Die Prüfung untersucht, ob diese
Befugnisse erwartbar, offengelegt und verhältnismäßig sind.

Artefaktseiten verlinken auf die vollständige Prüfung unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Prüfseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Prüfungsstapel. VirusTotal ist ein
vertrauenswürdiger Branchenstandard für die Bewertung der Vertrauenswürdigkeit von Dateien und für Malware-Scans. Durch unsere
Partnerschaft kann ClawHub die Prüfung von Skills und Plugins um umfassendere Sicherheitsinformationen
ergänzen.

VirusTotal ist besonders nützlich für bekannte bösartige Artefakte, Treffer von Scan-Engines und
Reputationssignale, die die agentenbezogene Prüfung von ClawHub ergänzen. Wenn die Anzahl der
Bewertungen durch Anbieter-Engines verfügbar ist, fasst die Prüfung sie in verständlicher Sprache zusammen, zum
Beispiel:

```text
62/62 Anbieter stuften diesen Skill als sauber ein.
```

oder:

```text
2/64 Anbieter stuften diesen Skill als bösartig ein, 1/64 stuften ihn als verdächtig und 61/64 als sauber ein.
```

Wenn ClawHub keine Telemetriedaten zu Anbieterbewertungen zusammenfassen kann, lautet die Prüfung:

```text
Keine VirusTotal-Befunde
```

VirusTotal bleibt eine Telemetriequelle. Es ersetzt nicht die eigene artefaktbezogene
Risikoanalyse von ClawHub.

## Risikoanalyse

Die Risikoanalyse wird intern von ClawScan unterstützt, dem eigenen Sicherheitsprüfungssystem
von ClawHub. Es prüft jedes Release als für Agenten bestimmtes Artefakt: Anweisungen,
Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, Signale statischer Scans,
SkillSpector-Befunde, VirusTotal-Telemetrie und vom Herausgeber bereitgestellten Kontext.
Signale statischer Scans dienen als interner Kontext für diese Prüfung; sie sind weder ein
eigenständiger öffentlicher Prüfungsabschnitt noch ein installationsblockierendes Urteil.

Die Risikoanalyse verwendet die
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als Bezugsrahmen für Risiken wie Prompt-Injection, missbräuchliche Tool-Nutzung, Offenlegung von Anmeldedaten,
unsichere Ausführung, Manipulation des Speichers oder Kontexts und übermäßige Handlungsautonomie.

ClawScan stuft eine bedrohlich wirkende Fähigkeit nicht automatisch als bösartig ein.
Es prüft, ob die Fähigkeit offengelegt ist, dem Zweck entspricht und durch den
angegebenen Anwendungsfall des Releases gerechtfertigt wird.
