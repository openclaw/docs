---
read_when:
    - Sie möchten, dass der Agent im Chat einen Skill erstellt oder aktualisiert
    - Sie müssen einen generierten Skill-Entwurf prüfen, anwenden, ablehnen oder unter Quarantäne stellen
    - Sie konfigurieren Genehmigung, Autonomie, Speicher oder Limits für den Skill Workshop
    - Sie möchten verstehen, wo Vorschläge zum selbstständigen Lernen geprüft werden
sidebarTitle: Skill Workshop
summary: Workspace-Skills durch die Überprüfung im Skill Workshop erstellen und aktualisieren
title: Skill-Workshop
x-i18n:
    generated_at: "2026-07-16T13:20:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop ist der geregelte Weg von OpenClaw zum Erstellen und Aktualisieren von
Skills im Arbeitsbereich. Agenten und Operatoren schreiben über diesen Weg niemals
`SKILL.md` direkt – sie erstellen einen **Vorschlag** (einen ausstehenden Entwurf mit
Inhalt, Zielbindung, Scannerstatus, Hashes und Rollback-Metadaten), der erst beim
Anwenden zu einem aktiven Skill wird.

Skill Workshop schreibt ausschließlich Skills im Arbeitsbereich. Gebündelte,
Plugin-, ClawHub-, Extra-Root-, verwaltete, persönliche Agenten- oder System-Skills
werden niemals verändert.

## Funktionsweise

- **Zuerst der Vorschlag:** Generierte Inhalte werden als `PROPOSAL.md` gespeichert, nicht
  als `SKILL.md`.
- **Anwenden ist der einzige aktive Schreibvorgang:** Erstellen, Aktualisieren und Überarbeiten ändern
  niemals aktive Skills.
- **Auf den Arbeitsbereich beschränkt:** Erstellungen zielen auf den `skills/`-Stamm des Arbeitsbereichs; Aktualisierungen
  sind nur für beschreibbare Skills im Arbeitsbereich zulässig.
- **Kein Überschreiben:** Die Erstellung schlägt fehl, wenn der Ziel-Skill bereits vorhanden ist.
- **An Hash gebunden:** Aktualisierungsvorschläge werden an den aktuellen Ziel-Hash gebunden und werden
  `stale`, wenn sich der aktive Skill vor dem Anwenden ändert.
- **Durch Scanner abgesichert:** Vor dem Schreiben führt die Anwendung den Sicherheitsscanner erneut aus.
- **Wiederherstellbar:** Vor jeder Änderung aktiver Dateien schreibt die Anwendung Rollback-Metadaten.
- **Einheitliche Oberflächen:** Chat, CLI und Gateway rufen denselben Dienst auf.

## Lebenszyklus

```text
erstellen/aktualisieren -> ausstehend
überarbeiten            -> ausstehend
anwenden                 -> angewendet
ablehnen                 -> abgelehnt
unter Quarantäne stellen -> unter Quarantäne
Zieländerung             -> veraltet
```

Nur ein `pending`-Vorschlag kann überarbeitet, angewendet, abgelehnt oder unter Quarantäne gestellt werden.

## Lebenszyklus-Kuratierung

Das Gateway erfasst die aggregierte Skill-Nutzung in der gemeinsamen Zustandsdatenbank. Einmal
täglich überprüft es Skills, die von Skill Workshop erstellt und angewendet wurden. Skills, die
länger als 30 Tage nicht verwendet wurden, werden `stale`; nach 90 Tagen werden sie
`archived` und nicht mehr in neue Skill-Snapshots von Agenten aufgenommen. Die Dateien
archivierter Skills bleiben auf dem Datenträger unverändert. Manuell erstellte Skills werden niemals
kuratiert; nur Skills, die durch Vorschläge von Skill Workshop erstellt wurden, werden in die
Lebenszyklus-Kuratierung aufgenommen.

Angeheftete Skills umgehen Lebenszyklusübergänge. Ein veralteter Skill kehrt zu `active`
zurück, nachdem er verwendet wurde und der nächste Durchlauf stattgefunden hat. Archivierte Skills
kehren nur durch eine explizite Wiederherstellung zurück:

Lebenszyklusübergänge und Wiederherstellungen gelten für neue Sitzungen; laufende Sitzungen behalten
ihren aktuellen Skill-Snapshot.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Alle Kuratorbefehle akzeptieren `--json`. Der Status meldet außerdem deterministische
Überschneidungskandidaten ausschließlich als Vorschläge; er führt niemals Skills zusammen und ruft
kein Modell auf.

## Chat

Bitten Sie den Agenten um den gewünschten Skill; er ruft `skill_workshop` auf und gibt eine
Vorschlags-ID zurück.

### Aus kürzlich ausgeführter Arbeit lernen

Verwenden Sie `/learn`, um die aktuelle Unterhaltung oder benannte Quellen in einen
standardgeleiteten Skill-Vorschlag umzuwandeln:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Ohne Anforderung weist `/learn` den Agenten an, den wiederverwendbaren Arbeitsablauf aus
der aktuellen Unterhaltung zu extrahieren. Bei einer Anforderung behandelt der Agent Pfade, URLs,
eingefügte Notizen und Verweise auf Unterhaltungen als Quellen und berücksichtigt dabei Vorgaben zu
Schwerpunkt, Umfang und Benennung. Er sammelt die Quellen mit seinen vorhandenen Tools und ruft
anschließend `skill_workshop` mit `action: "create"` auf.

Der resultierende Vorschlag bleibt `pending`; `/learn` wendet ihn niemals an.
Prüfen Sie ihn und wenden Sie ihn über den normalen Genehmigungsablauf oder mit
`openclaw skills workshop` an.

Erstellen:

```text
Erstelle einen Skill namens morning-catchup, der meine montägliche Posteingangsroutine ausführt.
```

Einen vorhandenen Skill im Arbeitsbereich aktualisieren:

```text
Aktualisiere trip-planning, sodass vor der Buchung auch Sitzpläne geprüft werden.
```

Einen ausstehenden Vorschlag iterativ bearbeiten:

```text
Zeige mir den Vorschlag morning-catchup.
Überarbeite ihn so, dass auch alles als dringend Markierte gekennzeichnet wird.
Wende den Vorschlag morning-catchup an.
```

Vom Agenten initiierte Vorgänge für `apply`, `reject` und
`quarantine` werden standardmäßig ohne zusätzliche Genehmigungsaufforderung ausgeführt.
Setzen Sie `skills.workshop.approvalPolicy` auf `"pending"`, um vor diesen Aktionen eine Genehmigung
durch den Operator zu verlangen.

Wenn eine Genehmigung erforderlich ist, nennt die Aufforderung die Vorschlags-ID und den Ziel-Skill
und zeigt die Vorschlagsbeschreibung, die Anzahl der Begleitdateien und die Größe des Textkörpers.
Genehmigungsanfragen sind zeitlich so begrenzt, dass sie vor dem Watchdog des Agenten-Tools
abgeschlossen werden. Wenn vor Ablauf der Aufforderung keine Entscheidung eintrifft, wird die
Lebenszyklusaktion nicht ausgeführt: Der Vorschlag bleibt ausstehend und unverändert. Treffen Sie
die Entscheidung später in der Benutzeroberfläche von Skill Workshop oder führen Sie
`openclaw skills workshop apply|reject|quarantine <proposal-id>` aus. Agenten sollten eine abgelaufene Lebenszyklusaktion nicht in einer Schleife
wiederholen.

## CLI

```bash
# Erstellen
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Tägliche Posteingangsaufarbeitung: sichten, archivieren, hervorheben, entwerfen, planen" \
  --proposal ./PROPOSAL.md

# Einen vorhandenen Skill im Arbeitsbereich aktualisieren
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Auflisten und prüfen
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Vor der Genehmigung überarbeiten
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Abschließen
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplikat"
openclaw skills workshop quarantine <proposal-id> --reason "Sicherheitsprüfung erforderlich"
```

Jeder Unterbefehl akzeptiert `--agent <id>` (Zielarbeitsbereich; standardmäßig aus dem
aktuellen Arbeitsverzeichnis abgeleitet, danach der Standardagent) und `--json`
(strukturierte Ausgabe). `propose-create`, `propose-update` und `revise`
akzeptieren außerdem `--goal <text>` und `--evidence <text>`, um den Vorschlagskontext
zusammen mit `--proposal` aufzuzeichnen.

## Vorschlagsinhalt

Solange der Vorschlag aussteht, wird er als `PROPOSAL.md` mit ausschließlich für Vorschläge
bestimmtem Frontmatter gespeichert:

```markdown
---
name: "morning-catchup"
description: "Tägliche Posteingangsaufarbeitung: sichten, archivieren, hervorheben, entwerfen, planen"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Beim Anwenden schreibt Skill Workshop den aktiven `SKILL.md` und entfernt die ausschließlich
für Vorschläge bestimmten Felder: `status`, Vorschlags-`version` und
Vorschlags-`date`.

## Begleitdateien

Verwenden Sie `--proposal-dir`, wenn der vorgeschlagene Skill Dateien neben
`PROPOSAL.md` benötigt:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Freitagsabschluss: Statistiken, Höhepunkte, die drei wichtigsten Punkte der nächsten Woche" \
  --proposal-dir ./weekly-update-proposal
```

Das Verzeichnis muss `PROPOSAL.md` enthalten. Begleitdateien müssen sich unter
`assets/`, `examples/`, `references/`, `scripts/` oder
`templates/` befinden. Skill Workshop scannt, hasht und speichert sie zusammen mit dem
Vorschlag und schreibt sie erst beim Anwenden neben den aktiven `SKILL.md`.

Abgelehnte Pfade für Begleitdateien: absolute Pfade, verborgene Pfadsegmente, Pfadtraversierung,
überlappende Pfade, ausführbare Dateien, Text, der nicht UTF-8-kodiert ist, Nullbytes und Pfade
außerhalb der standardmäßigen Begleitordner.

## Agenten-Tool

Das Modell verwendet `skill_workshop` mit einem erforderlichen `action`:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Weitere Parameter gelten abhängig von der Aktion:

| Parameter                  | Verwendet von                                         | Hinweise                                                              |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Für `create` erforderlich; löst andernfalls einen ausstehenden Vorschlag nach Namen auf |
| `description`              | `create`, `update`, `revise`                         | Max. 160 Byte                                                         |
| `skill_name`               | `update`                                             | Name oder Schlüssel des vorhandenen Skills                            |
| `proposal_content`         | `create`, `update`, `revise`                         | Als `PROPOSAL.md` gespeichert; durch `skills.workshop.maxSkillBytes` begrenzt |
| `support_files`            | `create`, `update`, `revise`                         | Array aus `{ path, content }`                                          |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Freitextkontext                                                        |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Zielvorschlag                                                          |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Optional                                                              |
| `query`, `status`, `limit` | `list`                                               | Filtern/paginieren; `limit` max. 50, Standardwert 20       |

Agenten müssen `skill_workshop` für generierte Skill-Arbeit verwenden. Sie dürfen
Vorschlagsdateien nicht über `write`, `edit`, `exec`,
Shell-Befehle oder direkte Dateisystemoperationen erstellen oder ändern.

<Note>
`skill_workshop` ist ein integriertes Agenten-Tool und in
`tools.profile: "coding"` enthalten. Wenn eine strengere Richtlinie es ausblendet, fügen Sie
`skill_workshop` zur aktiven Liste `tools.allow` hinzu oder verwenden Sie
`tools.alsoAllow: ["skill_workshop"]`, wenn der Geltungsbereich ein Profil ohne explizites
`tools.allow` verwendet. In Sandbox-Ausführungen wird das hostseitige
Skill-Workshop-Tool nicht erstellt. Führen Sie Aktionen zur Prüfung von Vorschlägen daher in einer
normalen hostseitigen Agentensitzung oder über die CLI aus.
</Note>

## Vorgeschlagene Skills

OpenClaw erkennt dauerhafte Anweisungen wie „beim nächsten Mal“, „merken Sie sich“ und reaktive
Korrekturen, wenn eine interaktive Ausführung endet, einschließlich fehlgeschlagener Ausführungen.
Bei der nächsten Ausführung bietet der Agent an, den zuletzt erkannten Arbeitsablauf über
`skill_workshop` zu speichern; die Person entscheidet, ob ein Vorschlag erstellt wird. Dieser
integrierte Vorschlag erstellt oder ändert von sich aus keinen Skill. Aktivieren Sie
`skills.workshop.autonomous.enabled`, um stattdessen direkt ausstehende Vorschläge zu erstellen. In der Control UI
bietet die Registerkarte „Workshop“ dieselbe Einstellung als Umschalter **Self-learning** in der
Seitenkopfzeile sowie als Aktivierungsschaltfläche auf der leeren Vorschlagstafel an.

### Frühere Sitzungen durchsuchen

Die Control UI kann ältere Arbeiten prüfen, ohne autonomes Selbstlernen zu aktivieren.
Öffnen Sie **Plugins → Workshop** und wählen Sie **Find skill ideas**. Der Scan beginnt mit
den neuesten infrage kommenden Sitzungen und prüft ein begrenztes Zeitfenster substanzieller Arbeit.
Cron-, Heartbeat-, Hook-, Subagenten-, ACP-, Plugin-eigene und interne Prüfsitzungen sowie
Unterhaltungen mit weniger als sechs Modellausführungen werden übersprungen.

Der Prüfer verwendet das konfigurierte Modell des ausgewählten Agenten und erhält ein
um Geheimnisse bereinigtes und größenbegrenztes Transkriptpaket. Dabei gilt derselbe konservative
Maßstab wie bei der Erfahrungsprüfung: ein konkretes Wiederherstellungsmuster oder ein stabiler
Ablauf, der mindestens zwei zukünftige Modell- oder Tool-Aufrufe vermeiden würde. Routinearbeiten
und einmalige Fakten sollten keinen Vorschlag erzeugen.

Ein Scan kann höchstens drei ausstehende Vorschläge erstellen oder überarbeiten. Er kann keinen
aktiven Skill anwenden, ablehnen, unter Quarantäne stellen oder bearbeiten. Der Workshop zeigt die
kumulierte Abdeckung an, beispielsweise **20 sessions reviewed · Jun 18–today · 2 ideas found**.
Wählen Sie **Scan earlier work**, um ab dem gespeicherten Cursor der ältesten Sitzung fortzufahren.
Nachdem der verfügbare Verlauf vollständig ausgeschöpft wurde, wird die Aktion zu
**Scan new work**.

Die historische Überprüfung erfolgt manuell, selbst wenn
`skills.workshop.autonomous.enabled` auf `false` gesetzt ist. Jeder Klick startet einen Modelldurchlauf,
sodass die Preis- und Datenverarbeitungsbedingungen des Providers gelten. Der Cursor und die Abdeckungszahlen
werden in der gemeinsam genutzten OpenClaw-Zustandsdatenbank gespeichert; Transkriptinhalte werden nicht
in den Scanstatus kopiert.

Bei aktivierter autonomer Erfassung kann OpenClaw außerdem nach erfolgreicher,
umfangreicher Arbeit und nachdem das gesamte Agentensystem inaktiv geworden ist, eine konservative Überprüfung durchführen. Diese isolierte Überprüfung kann höchstens
einen ausstehenden Vorschlag erstellen oder überarbeiten. Sie kann weder ein aktives Skill aktualisieren noch einen
Vorschlag anwenden, ablehnen oder unter Quarantäne stellen, selbst wenn `approvalPolicy` auf `"auto"` gesetzt ist.

Informationen zur Aktivierung, Eignung, zum Datenschutz und zu den Kosten,
zum Schwellenwert für Vorschläge sowie zur Fehlerbehebung finden Sie unter [Selbstlernen](/tools/self-learning).

## Genehmigung und Autonomie

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Einstellung                    | Standardwert  | Wirkung                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | Erstellt ausstehende Vorschläge aus ausdrücklichen Korrekturen und nach einer Inaktivitätsverzögerung aus umfangreicher abgeschlossener Arbeit mit wiederverwendbarer Wiederherstellung oder bedeutenden Einsparungen bei Hin- und Rückläufen.   |
| `allowSymlinkTargetWrites` | `false`  | Ermöglicht beim Anwenden Schreibzugriffe über Symlinks von Workspace-Skills, deren tatsächliches Ziel in `skills.load.allowSymlinkTargets` aufgeführt ist.                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` überspringt eine zusätzliche Aufforderung für vom Agenten initiierte Aktionen `apply`, `reject` oder `quarantine` (der Agent muss die Aktion weiterhin aufrufen). `"pending"` erfordert eine Genehmigung. |
| `maxPending`               | `50`     | Begrenzt ausstehende und unter Quarantäne gestellte Vorschläge pro Workspace (1-200).                                                                                                       |
| `maxSkillBytes`            | `40000`  | Begrenzt die Größe des Vorschlagstexts in Byte (1024-200000).                                                                                                                     |

Die autonome Erfassung erkennt prospektive Regeln (zum Beispiel „von nun an“) und reaktive
Korrekturen (zum Beispiel „das ist nicht das, worum ich gebeten habe“). Sie gruppiert neue Anweisungen thematisch in bis
zu drei Vorschläge pro Durchlauf, leitet Übereinstimmungen im Vokabular an vorhandene beschreibbare Workspace-Skills weiter und
überarbeitet ihren eigenen ausstehenden Vorschlag, wenn eine weitere Korrektur dasselbe Skill betrifft.

Bei erfolgreicher umfangreicher Arbeit ohne ausdrückliche Korrektur entscheidet ein isolierter Durchlauf des ausgewählten
Modells, ob der abgeschlossene Verlauf den konservativen Schwellenwert für Vorschläge überschreitet. Das
Vordergrundmodell wird nicht zum Lernen aufgefordert, bevor es antwortet. Die Hintergrundüberprüfung bewahrt den
Vordergrunddurchlauf als Herkunftsnachweis des Vorschlags, kann nicht auf allgemeine Agentenwerkzeuge zugreifen und keine Entscheidungen
über den Lebenszyklus treffen. Die Überprüfung beginnt erst, wenn die Vordergrund-Laufzeitumgebung sowohl ihr exakt aufgelöstes Modell
als auch die tatsächliche Verfügbarkeit von `skill_workshop` meldet. Eine restriktive oder unbekannte Werkzeugrichtlinie
schlägt daher sicher fehl und erstellt keinen Vorschlag.

Das vollständige Verhalten der autonomen Überprüfung und das Sicherheitsmodell finden Sie unter
[Selbstlernen](/tools/self-learning).

Vorschlagsbeschreibungen sind unabhängig von
`maxSkillBytes` stets auf 160 Byte begrenzt.

## Gateway-Methoden

| Methode                             | Geltungsbereich            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` ist ausschließlich für den Gateway bestimmt (kein entsprechender CLI-Befehl oder Agentenwerkzeug): Die Methode
leitet Freitextanweisungen zur Überarbeitung an die Chatsitzung des zuständigen Agenten weiter,
anstatt `PROPOSAL.md` direkt zu ersetzen. Dies ist für Benutzeroberflächen vorgesehen, die den Agenten
zu einer Überarbeitung auffordern, anstatt wortgetreu neue Inhalte zu übermitteln.

`historyStatus` und `historyScan` sind Unterstützungsmethoden der Control UI. `historyScan`
akzeptiert `direction: "older" | "newer"`; Ergebnisse bleiben dabei immer als ausstehende
Vorschläge erhalten.

## Speicherung

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Standardmäßiges Zustandsverzeichnis: `~/.openclaw`.

- `proposal.json`: kanonischer Vorschlagsdatensatz.
- `proposals.json`: schneller Auflistungsindex, der aus Vorschlagsordnern neu erstellt werden kann.
- `PROPOSAL.md`: ausstehender Skill-Vorschlag.
- `rollback.json`: Wiederherstellungsmetadaten, die geschrieben werden, bevor die Anwendung aktive Dateien ändert.

## Grenzwerte

| Grenzwert                           | Wert                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| Beschreibung                     | 160 Byte                                                            |
| Vorschlagstext                   | `skills.workshop.maxSkillBytes` (Standardwert 40.000; feste Obergrenze 1 MiB) |
| Unterstützungsdateien                   | 64 pro Vorschlag                                                      |
| Größe der Unterstützungsdateien               | jeweils 256 KiB, insgesamt 2 MiB                                            |
| Ausstehende + unter Quarantäne gestellte Vorschläge | `skills.workshop.maxPending` pro Workspace (Standardwert 50)              |

## Fehlerbehebung

| Problem                                        | Lösung                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Kürzen Sie `description` auf höchstens 160 Byte.                                                                                                                                                                 |
| `Skill proposal content is too large`          | Kürzen Sie den Vorschlagstext oder erhöhen Sie `skills.workshop.maxSkillBytes`.                                                                                                                                         |
| `Target skill changed after proposal creation` | Überarbeiten Sie den Vorschlag anhand des aktuellen Ziels oder erstellen Sie einen neuen Vorschlag.                                                                                                                                   |
| `Proposal scan failed`                         | Prüfen Sie die Scanner-Ergebnisse und überarbeiten Sie anschließend den Vorschlag oder stellen Sie ihn unter Quarantäne.                                                                                                                                           |
| `untrusted symlink target`                     | Konfigurieren Sie `skills.load.allowSymlinkTargets` und aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur für bewusst gemeinsam genutzte Skill-Stammverzeichnisse.                                                                  |
| `Support file paths must be under one of...`   | Verschieben Sie Unterstützungsdateien nach `assets/`, `examples/`, `references/`, `scripts/` oder `templates/`.                                                                                                                |
| Vorschlag wird nicht in der Liste angezeigt                 | Überprüfen Sie den ausgewählten `--agent`-Workspace und `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| Agent kann `skill_workshop` nicht aufrufen             | Überprüfen Sie die aktive Werkzeugrichtlinie und den Ausführungsmodus. `coding` umfasst das Werkzeug; restriktive `tools.allow`-Richtlinien müssen es ausdrücklich aufführen, und Sandbox-Ausführungen müssen eine normale hostseitige Agentensitzung oder die CLI verwenden. |

### Diagnose der Werkzeugrichtlinie

Wenn die autonome Erfassung aktiviert ist, führt `openclaw doctor`
die Prüfung `core/doctor/skill-workshop-tool-policy` für den Standardagenten aus. Wenn die Richtlinie
`skill_workshop` ausblendet, nennt die Warnung die erste ausschließende Konfigurationsebene und
die genaue erforderliche Änderung an `allow` oder `alsoAllow`. Ältere Betriebsanleitungen verwenden möglicherweise noch
`openclaw plugins inspect skill-workshop`; dieser Befehl erklärt nun, dass Skill
Workshop integriert ist, und gibt gegebenenfalls denselben Richtlinienhinweis aus.

## Verwandte Themen

- [Skills](/de/tools/skills) für Ladereihenfolge, Vorrang und Sichtbarkeit
- [Selbstlernen](/tools/self-learning) für konservative Skill-Vorschläge nach Ausführungen
- [Skills erstellen](/de/tools/creating-skills) für die Grundlagen handgeschriebener `SKILL.md`
- [Skills-Konfiguration](/de/tools/skills-config) für das vollständige `skills.workshop`-Schema
- [Skills-CLI](/de/cli/skills) für `openclaw skills`-Befehle
