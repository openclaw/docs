---
read_when:
    - ClawHub-Sicherheitsauditergebnisse verstehen
    - Entscheidung, ob ein Skill oder Plugin installiert werden soll
    - Erläuterung des ClawHub-Prüfstatus, der Risikostufe oder der Feststellungen
sidebarTitle: Security Audits
summary: So verstehen Sie die Ergebnisse der ClawHub-Sicherheitsprüfung, bevor Sie einen Skill oder ein Plugin installieren.
title: Sicherheitsaudits
x-i18n:
    generated_at: "2026-07-16T12:36:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Sicherheitsaudits

ClawHub-Sicherheitsaudits helfen Ihnen bei der Entscheidung, ob ein Skill oder Plugin für die
Installation ausreichend sicher ist. Sie zeigen, was ein Release bewirkt, welche Berechtigungen es anfordert und
ob etwas besondere Aufmerksamkeit erfordert, bevor es auf Dateien, Konten,
Anmeldedaten, Code oder externe Dienste zugreifen kann.

Audits sind aussagekräftige Sicherheitssignale, bieten jedoch keine Garantie dafür, dass ein Release
risikofrei ist. Wägen Sie stets sorgfältig ab, bevor Sie vertraulichen Zugriff gewähren.

Siehe auch [Sicherheit](/clawhub/security), [Zulässige Nutzung](/de/clawhub/acceptable-usage)
und [Moderation und Kontosicherheit](/clawhub/moderation).

## Was vor der Installation zu prüfen ist

Prüfen Sie vor der Installation:

- den Gesamtstatus des Audits
- die Risikostufe
- alle aufgeführten Befunde
- erforderliche Anmeldedaten, Berechtigungen oder Umgebungsvariablen
- Eigentümer, Quelle, Version, Änderungsprotokoll, Downloads, Sterne und andere Vertrauenssignale

Installieren Sie nur Inhalte, die Sie verstehen und denen Sie vertrauen.

## Auditstatus

Der Auditstatus gibt an, wie Sie auf das Auditergebnis reagieren sollten:

| Status      | Bedeutung                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Es wurde kein sichtbares Problem oberhalb einer niedrigen Risikostufe gefunden.                                |
| `Review`    | Lesen Sie vor der Installation die Befunde. Das Release kann dennoch legitim sein. |
| `Warn`      | Seien Sie besonders vorsichtig. ClawHub hat ein Problem mit hohen Auswirkungen oder ein Warnsignal gefunden. |
| `Malicious` | Nicht installieren.                                                           |
| `Pending`   | Die Audits sind noch nicht abgeschlossen.                                             |
| `Error`     | Das Audit konnte nicht abgeschlossen werden.                                         |

Ein `Pass` ist beruhigend, ersetzt jedoch nicht Ihre eigene Einschätzung. Dies ist
besonders wichtig bei Tools, die Inhalte veröffentlichen, Daten bearbeiten, Befehle ausführen, Dateien lesen oder
auf Produktionssysteme zugreifen können.

## Risikostufe

Die Risikostufe beschreibt den potenziellen Schadensumfang: wie viel Macht das Release offenbar besitzt, wenn
Sie es bestimmungsgemäß verwenden.

| Risikostufe | Bedeutung                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Es wurden nur geringe vertrauliche Berechtigungen oder Auswirkungen auf Benutzer festgestellt.                          |
| `Medium`   | Das Release verfügt über erhebliche Berechtigungen, etwa Kontozugriff oder die Möglichkeit zu Datenänderungen. |
| `High`     | Das Release verfügt über Berechtigungen mit hohen Auswirkungen, schwerwiegende Befunde oder Anzeichen für böswilliges Verhalten. |

Risikostufe und Auditstatus beantworten unterschiedliche Fragen:

- Die Risikostufe fragt: „Wie viel Macht ist hier vorhanden?“
- Der Auditstatus fragt: „Was sollte ich mit diesem Ergebnis tun?“

Beispielsweise kann ein Skill zum Veröffentlichen `Review` bei einem Risiko von `Medium` anzeigen. Das
bedeutet nicht, dass er böswillig ist. Es bedeutet, dass der Skill seinem Zweck zu entsprechen scheint, aber
mit erheblichen Kontoberechtigungen handeln kann.

## Befunde

Befunde erläutern, warum ein Auditergebnis angezeigt wurde. Jeder Befund enthält üblicherweise:

- was er bedeutet
- warum er gekennzeichnet wurde
- die relevanten Inhalte des Skills oder Plugins
- eine Empfehlung

Befunde können als `Info`, `Low`, `Medium`, `High` oder `Critical` gekennzeichnet sein. Befunde mit höherem
Schweregrad fließen stärker in die Risikostufe und den Auditstatus ein.

Befunde mit geringer Konfidenz werden in der öffentlichen Auditzusammenfassung ausgeblendet, damit die Seite
auf aussagekräftige Nachweise ausgerichtet bleibt.

## Was ClawHub prüft

ClawHub prüft eingereichte Release-Artefakte, darunter:

- Skill-Anweisungen oder Plugin-Metadaten
- deklarierte Umgebungsvariablen und Berechtigungen
- Installationsanweisungen und Paketmetadaten
- enthaltene Dateien und Dateimanifeste
- Kompatibilitäts- und Funktionsmetadaten

Die zentrale Frage ist die Stimmigkeit: Stimmen Name, Zusammenfassung, Metadaten, angeforderte
Berechtigungen und tatsächliche Inhalte mit dem überein, was Benutzer vernünftigerweise erwarten würden?

Leistungsfähiges Verhalten ist nicht automatisch schlecht. Viele nützliche Tools benötigen Anmeldedaten,
lokale Befehle, Provider-APIs oder Paketinstallationen. Das Audit prüft, ob diese
Möglichkeiten erwartet werden, offengelegt sind und in einem angemessenen Verhältnis stehen.

Artefaktseiten verlinken auf das vollständige Audit unter:

```text
/<owner>/skills/<slug>/security-audit
```

Die Auditseite kombiniert:

1. SkillSpector
2. VirusTotal
3. Risikoanalyse

## VirusTotal

ClawHub verwendet VirusTotal als Malware-Telemetrie im Audit-System. VirusTotal ist ein
vertrauenswürdiger Branchenstandard für die Bewertung der Vertrauenswürdigkeit von Dateien und für Malware-Scans, und unsere
Partnerschaft ermöglicht ClawHub, die Prüfung von Skills und Plugins um umfassendere Sicherheitsinformationen zu
ergänzen.

VirusTotal ist besonders nützlich für bekannte schädliche Artefakte, Treffer von Scan-Engines und
Reputationssignale, die die agentenbezogene Prüfung von ClawHub ergänzen. Wenn die Anzahl der
Anbieter-Engines verfügbar ist, fasst das Audit sie in verständlicher Sprache zusammen, beispielsweise:

```text
62/62 Anbieter haben diesen Skill als unbedenklich eingestuft.
```

oder:

```text
2/64 Anbieter haben diesen Skill als schädlich eingestuft, 1/64 als verdächtig und 61/64 als unbedenklich.
```

Wenn ClawHub keine Anbieteranzahl-Telemetrie zur Zusammenfassung vorliegen hat, gibt das Audit Folgendes aus:

```text
Keine VirusTotal-Befunde
```

VirusTotal bleibt Telemetrie. Es ersetzt nicht die eigene artefaktbezogene
Risikoanalyse von ClawHub.

## Risikoanalyse

Die Risikoanalyse basiert intern auf ClawScan, dem eigenen Sicherheitsaudit-
System von ClawHub. Es prüft jedes Release als für Agenten bestimmtes Artefakt: Anweisungen,
Metadaten, deklarierte Berechtigungen, Dateien, Fähigkeitssignale, Signale statischer Scans,
SkillSpector-Befunde, VirusTotal-Telemetrie und vom Herausgeber bereitgestellten Kontext.
Signale statischer Scans dienen als interner Kontext für diese Prüfung; sie sind weder ein
eigenständiger öffentlicher Auditabschnitt noch ein die Installation blockierendes Urteil.

Die Risikoanalyse verwendet die
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als Bezugsrahmen für Risiken wie Prompt-Injection, Tool-Missbrauch, Offenlegung von Anmeldedaten,
unsichere Ausführung, Vergiftung von Speicher oder Kontext und übermäßige Handlungsautonomie.

ClawScan stuft eine bedrohlich wirkende Fähigkeit nicht automatisch als böswillig ein.
Es prüft, ob die Fähigkeit offengelegt ist, dem Zweck entspricht und durch
den angegebenen Anwendungsfall des Releases gestützt wird.
