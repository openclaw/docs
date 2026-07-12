---
read_when:
    - Sie möchten, dass der Agent über den Chat ein Skill erstellt oder aktualisiert
    - Sie müssen einen generierten Skill-Entwurf prüfen, übernehmen, ablehnen oder unter Quarantäne stellen.
    - Sie konfigurieren Genehmigung, Autonomie, Speicher oder Limits für Skill Workshop
sidebarTitle: Skill Workshop
summary: Workspace-Skills durch die Überprüfung im Skill Workshop erstellen und aktualisieren
title: Skills-Workshop
x-i18n:
    generated_at: "2026-07-12T02:15:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop ist der kontrollierte Weg von OpenClaw zum Erstellen und Aktualisieren von
Skills im Arbeitsbereich. Agenten und Betreiber schreiben über diesen
Weg niemals direkt in `SKILL.md` – sie erstellen einen **Vorschlag** (einen ausstehenden Entwurf mit Inhalt, Zielzuordnung,
Scannerstatus, Hashes und Rollback-Metadaten), der erst durch seine Anwendung zu einem aktiven
Skill wird.

Skill Workshop schreibt ausschließlich Skills im Arbeitsbereich. Gebündelte,
Plugin-, ClawHub-, Extra-Root-, verwaltete, persönliche Agenten- oder System-Skills werden niemals verändert.

## Funktionsweise

- **Zuerst der Vorschlag:** Generierte Inhalte werden als `PROPOSAL.md` gespeichert, nicht als
  `SKILL.md`.
- **Nur die Anwendung schreibt aktive Daten:** Erstellen, Aktualisieren und Überarbeiten verändern niemals
  aktive Skills.
- **Auf den Arbeitsbereich beschränkt:** Neue Skills werden im Stammverzeichnis `skills/` des Arbeitsbereichs erstellt; Aktualisierungen
  sind nur für beschreibbare Skills im Arbeitsbereich zulässig.
- **Kein Überschreiben:** Das Erstellen schlägt fehl, wenn der Ziel-Skill bereits vorhanden ist.
- **An Hash gebunden:** Aktualisierungsvorschläge werden an den aktuellen Hash des Ziels gebunden und werden
  `stale`, wenn sich der aktive Skill vor der Anwendung ändert.
- **Durch Scanner abgesichert:** Vor dem Schreiben führt die Anwendung den Sicherheitsscanner erneut aus.
- **Wiederherstellbar:** Vor Änderungen an aktiven Dateien schreibt die Anwendung Rollback-Metadaten.
- **Einheitliche Oberflächen:** Chat, CLI und Gateway rufen denselben Dienst auf.

## Lebenszyklus

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Nur ein Vorschlag mit dem Status `pending` kann überarbeitet, angewendet, abgelehnt oder unter Quarantäne gestellt werden.

## Lebenszyklusverwaltung

Das Gateway erfasst die aggregierte Nutzung von Skills in der gemeinsamen Zustandsdatenbank. Einmal
täglich überprüft es Skills, die durch Skill Workshop erstellt und angewendet wurden. Skills, die länger als
30 Tage nicht verwendet wurden, erhalten den Status `stale`; nach 90 Tagen erhalten sie den Status `archived` und werden
nicht mehr in neue Skill-Snapshots von Agenten aufgenommen. Die Dateien archivierter Skills bleiben auf
dem Datenträger unverändert. Manuell erstellte Skills werden niemals verwaltet; nur Skills, die über Vorschläge von Skill
Workshop erstellt wurden, nehmen an der Lebenszyklusverwaltung teil.

Angeheftete Skills überspringen Lebenszyklusübergänge. Ein Skill mit dem Status `stale` kehrt zu `active`
zurück, nachdem er verwendet wurde und der nächste Durchlauf stattgefunden hat. Archivierte Skills kehren nur durch eine
explizite Wiederherstellung zurück:

Lebenszyklusübergänge und Wiederherstellungen gelten für neue Sitzungen; laufende Sitzungen behalten
ihren aktuellen Skill-Snapshot.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Alle Verwaltungsbefehle akzeptieren `--json`. Der Status meldet außerdem deterministisch ermittelte
Überschneidungskandidaten ausschließlich als Vorschläge; Skills werden niemals zusammengeführt und kein Modell wird aufgerufen.

## Chat

Bitten Sie den Agenten um den gewünschten Skill; er ruft `skill_workshop` auf und gibt eine
Vorschlags-ID zurück.

### Aus kürzlich ausgeführten Arbeiten lernen

Verwenden Sie `/learn`, um die aktuelle Unterhaltung oder benannte Quellen in einen
standardgeleiteten Skill-Vorschlag umzuwandeln:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Ohne Anforderung bittet `/learn` den Agenten, den wiederverwendbaren Arbeitsablauf aus
der aktuellen Unterhaltung zu extrahieren. Mit einer Anforderung behandelt der Agent Pfade, URLs, eingefügte
Notizen und Verweise auf die Unterhaltung als Quellen und berücksichtigt dabei Anforderungen an Schwerpunkt, Umfang und
Benennung. Er sammelt die Quellen mit seinen vorhandenen Werkzeugen und ruft anschließend
`skill_workshop` mit `action: "create"` auf.

Der resultierende Vorschlag bleibt `pending`; `/learn` wendet ihn niemals an. Prüfen und
wenden Sie ihn über den normalen Genehmigungsablauf oder mit `openclaw skills workshop` an.

Erstellen:

```text
Erstelle einen Skill namens morning-catchup, der meine Posteingangsroutine am Montag ausführt.
```

Einen vorhandenen Skill im Arbeitsbereich aktualisieren:

```text
Aktualisiere trip-planning, damit vor der Buchung auch Sitzpläne geprüft werden.
```

Einen ausstehenden Vorschlag iterativ bearbeiten:

```text
Zeige mir den Vorschlag morning-catchup.
Überarbeite ihn so, dass auch alle als dringend markierten Elemente gekennzeichnet werden.
Wende den Vorschlag morning-catchup an.
```

Vom Agenten initiierte Aktionen `apply`, `reject` und `quarantine` zeigen standardmäßig
eine Genehmigungsaufforderung an. Setzen Sie `skills.workshop.approvalPolicy` in
vertrauenswürdigen Umgebungen auf `"auto"`, um sie zu überspringen.

Die Aufforderung nennt die Vorschlags-ID und den Ziel-Skill und zeigt die Beschreibung des Vorschlags,
die Anzahl der unterstützenden Dateien sowie die Größe des Inhalts. Genehmigungsanfragen sind zeitlich so begrenzt,
dass sie vor dem Watchdog des Agentenwerkzeugs abgeschlossen werden. Wenn vor Ablauf der
Aufforderung keine Entscheidung eingeht, wird die Lebenszyklusaktion nicht ausgeführt: Der Vorschlag bleibt ausstehend
und unverändert. Treffen Sie die Entscheidung später in der Skill-Workshop-Benutzeroberfläche oder führen Sie
`openclaw skills workshop apply|reject|quarantine <proposal-id>` aus. Agenten sollten
eine abgelaufene Lebenszyklusaktion nicht wiederholt in einer Schleife ausführen.

## CLI

```bash
# Erstellen
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Tägliche Posteingangsaufarbeitung: sichten, archivieren, hervorheben, entwerfen, planen" \
  --proposal ./PROPOSAL.md

# Vorhandenen Skill im Arbeitsbereich aktualisieren
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

Jeder Unterbefehl akzeptiert `--agent <id>` (Zielarbeitsbereich; standardmäßig
zunächst aus dem aktuellen Arbeitsverzeichnis abgeleitet, danach der Standard-Agent) und `--json` (strukturierte Ausgabe).
`propose-create`, `propose-update` und `revise` akzeptieren außerdem `--goal <text>` und
`--evidence <text>`, um zusammen mit `--proposal` den Kontext des Vorschlags zu erfassen.

## Vorschlagsinhalt

Solange der Vorschlag aussteht, wird er als `PROPOSAL.md` mit ausschließlich für Vorschläge bestimmten
Frontmatter-Feldern gespeichert:

```markdown
---
name: "morning-catchup"
description: "Tägliche Posteingangsaufarbeitung: sichten, archivieren, hervorheben, entwerfen, planen"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Bei der Anwendung schreibt Skill Workshop die aktive `SKILL.md` und entfernt die
ausschließlich für Vorschläge bestimmten Felder: `status`, die Vorschlags-`version` und das Vorschlags-`date`.

## Unterstützende Dateien

Verwenden Sie `--proposal-dir`, wenn der vorgeschlagene Skill neben
`PROPOSAL.md` weitere Dateien benötigt:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Freitagsrückblick: Statistiken, Höhepunkte, die drei wichtigsten Punkte der nächsten Woche" \
  --proposal-dir ./weekly-update-proposal
```

Das Verzeichnis muss `PROPOSAL.md` enthalten. Unterstützende Dateien müssen sich unter
`assets/`, `examples/`, `references/`, `scripts/` oder `templates/` befinden. Skill
Workshop scannt, hasht und speichert sie zusammen mit dem Vorschlag und schreibt sie erst bei der
Anwendung neben die aktive `SKILL.md`.

Abgelehnte Pfade unterstützender Dateien: absolute Pfade, ausgeblendete Pfadsegmente, Pfadüberschreitungen,
sich überschneidende Pfade, ausführbare Dateien, Nicht-UTF-8-Text, Nullbytes
und Pfade außerhalb der standardmäßigen Unterstützungsverzeichnisse.

## Agentenwerkzeug

Das Modell verwendet `skill_workshop` mit einer erforderlichen `action`:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Weitere Parameter gelten abhängig von der Aktion:

| Parameter                  | Verwendet von                                         | Hinweise                                                              |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                         | Für `create` erforderlich; löst andernfalls einen ausstehenden Vorschlag anhand des Namens auf |
| `description`              | `create`, `update`, `revise`                          | Maximal 160 Byte                                                      |
| `skill_name`               | `update`                                              | Name oder Schlüssel des vorhandenen Skills                            |
| `proposal_content`         | `create`, `update`, `revise`                          | Als `PROPOSAL.md` gespeichert; durch `skills.workshop.maxSkillBytes` begrenzt |
| `support_files`            | `create`, `update`, `revise`                          | Array aus `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                          | Freitextkontext                                                       |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine`  | Zielvorschlag                                                         |
| `reason`                   | `apply`, `reject`, `quarantine`                       | Optional                                                              |
| `query`, `status`, `limit` | `list`                                                | Filtern/Paginieren; `limit` maximal 50, Standardwert 20               |

Agenten müssen `skill_workshop` für generierte Skill-Arbeiten verwenden. Sie dürfen
Vorschlagsdateien nicht über `write`, `edit`, `exec`, Shell-Befehle
oder direkte Dateisystemoperationen erstellen oder ändern.

<Note>
`skill_workshop` ist ein integriertes Agentenwerkzeug und in
`tools.profile: "coding"` enthalten. Wenn eine strengere Richtlinie es ausblendet, fügen Sie
`skill_workshop` zur aktiven Liste `tools.allow` hinzu oder verwenden Sie
`tools.alsoAllow: ["skill_workshop"]`, wenn der Geltungsbereich ein Profil ohne
explizites `tools.allow` verwendet. In Sandbox-Ausführungen wird das hostseitige
Skill-Workshop-Werkzeug nicht erstellt. Führen Sie Aktionen zur Prüfung von Vorschlägen daher in einer normalen hostseitigen
Agentensitzung oder über die CLI aus.
</Note>

## Vorgeschlagene Skills

OpenClaw erkennt dauerhafte Anweisungen wie „beim nächsten Mal“, „merken Sie sich“ und reaktive Korrekturen,
wenn ein interaktiver Durchlauf endet, einschließlich fehlgeschlagener Durchläufe. Beim nächsten Durchlauf bietet der Agent an,
den zuletzt erkannten Arbeitsablauf über `skill_workshop` zu speichern; der Benutzer entscheidet, ob ein
Vorschlag erstellt wird. Dieser integrierte Vorschlag erstellt oder ändert selbst keinen Skill. Aktivieren Sie
`skills.workshop.autonomous.enabled`, um stattdessen direkt ausstehende Vorschläge zu erstellen.

## Genehmigung und Autonomie

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Einstellung                | Standardwert | Auswirkung                                                                                                                                                             |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`      | Erstellt direkt ausstehende Vorschläge, anstatt beim nächsten Durchlauf anzubieten, den zuletzt erkannten Arbeitsablauf zu speichern.                                  |
| `allowSymlinkTargetWrites` | `false`      | Ermöglicht der Anwendung, über Symlinks von Skills im Arbeitsbereich zu schreiben, deren tatsächliches Ziel in `skills.load.allowSymlinkTargets` aufgeführt ist.       |
| `approvalPolicy`           | `"pending"`  | `"pending"` erfordert vor vom Agenten initiierten Aktionen `apply`, `reject` oder `quarantine` eine Genehmigungsaufforderung. `"auto"` überspringt die Aufforderung (der Agent muss die Aktion dennoch aufrufen). |
| `maxPending`               | `50`         | Begrenzt ausstehende und unter Quarantäne gestellte Vorschläge pro Arbeitsbereich (1–200).                                                                              |
| `maxSkillBytes`            | `40000`      | Begrenzt die Größe des Vorschlagsinhalts in Byte (1024–200000).                                                                                                        |

Die autonome Erfassung erkennt zukunftsgerichtete Regeln (beispielsweise „von nun an“) und reaktive
Korrekturen (beispielsweise „das habe ich nicht verlangt“). Sie gruppiert neue Anweisungen nach Thema in bis
zu drei Vorschläge pro Durchlauf, ordnet übereinstimmende Begriffe vorhandenen beschreibbaren Skills im Arbeitsbereich zu und
überarbeitet ihren eigenen ausstehenden Vorschlag, wenn eine weitere Korrektur denselben Skill betrifft.

Vorschlagsbeschreibungen sind unabhängig von
`maxSkillBytes` stets auf 160 Byte begrenzt.

## Gateway-Methoden

| Methode                            | Geltungsbereich  |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
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

`requestRevision` ist nur über den Gateway verfügbar (ohne entsprechendes CLI- oder Agentenwerkzeug): Die Methode
leitet frei formulierte Überarbeitungsanweisungen an die Chatsitzung des zuständigen Agenten weiter,
anstatt `PROPOSAL.md` direkt zu ersetzen. Dies ist für Benutzeroberflächen vorgesehen, die den Agenten
zu einer Überarbeitung auffordern, statt wortwörtlich neue Inhalte einzureichen.

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
- `proposals.json`: Index für schnelle Auflistungen, der aus den Vorschlagsordnern neu erstellt werden kann.
- `PROPOSAL.md`: ausstehender Skill-Vorschlag.
- `rollback.json`: Wiederherstellungsmetadaten, die vor der Anwendung von Änderungen auf die aktiven Dateien geschrieben werden.

## Grenzwerte

| Grenzwert                       | Wert                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Beschreibung                    | 160 Byte                                                                     |
| Vorschlagsinhalt                | `skills.workshop.maxSkillBytes` (Standardwert 40.000; feste Obergrenze 1 MiB) |
| Unterstützungsdateien           | 64 pro Vorschlag                                                             |
| Größe der Unterstützungsdateien | jeweils 256 KiB, insgesamt 2 MiB                                              |
| Ausstehende + isolierte Vorschläge | `skills.workshop.maxPending` pro Arbeitsbereich (Standardwert 50)           |

## Fehlerbehebung

| Problem                                        | Lösung                                                                                                                                                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Kürzen Sie `description` auf höchstens 160 Byte.                                                                                                                                                                             |
| `Skill proposal content is too large`          | Kürzen Sie den Vorschlagsinhalt oder erhöhen Sie `skills.workshop.maxSkillBytes`.                                                                                                                                             |
| `Target skill changed after proposal creation` | Überarbeiten Sie den Vorschlag anhand des aktuellen Ziels oder erstellen Sie einen neuen Vorschlag.                                                                                                                          |
| `Proposal scan failed`                         | Prüfen Sie die Scannerbefunde und überarbeiten oder isolieren Sie anschließend den Vorschlag.                                                                                                                                |
| `untrusted symlink target`                     | Konfigurieren Sie `skills.load.allowSymlinkTargets` und aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur für bewusst gemeinsam genutzte Skill-Stammverzeichnisse.                                                |
| `Support file paths must be under one of...`   | Verschieben Sie Unterstützungsdateien nach `assets/`, `examples/`, `references/`, `scripts/` oder `templates/`.                                                                                                              |
| Vorschlag erscheint nicht in der Liste         | Prüfen Sie den mit `--agent` ausgewählten Arbeitsbereich und `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| Agent kann `skill_workshop` nicht aufrufen     | Prüfen Sie die aktive Werkzeugrichtlinie und den Ausführungsmodus. `coding` umfasst das Werkzeug; restriktive `tools.allow`-Richtlinien müssen es ausdrücklich aufführen, und Sandbox-Ausführungen müssen eine normale hostseitige Agentensitzung oder die CLI verwenden. |

### Diagnose der Werkzeugrichtlinie

Wenn die autonome Erfassung aktiviert ist, führt `openclaw doctor` für den
Standardagenten die Prüfung `core/doctor/skill-workshop-tool-policy` aus. Wenn die Richtlinie
`skill_workshop` ausblendet, nennt die Warnung die erste ausschließende Konfigurationsebene und
die genaue erforderliche Änderung an `allow` oder `alsoAllow`. Ältere Betriebsanleitungen verwenden möglicherweise noch
`openclaw plugins inspect skill-workshop`; dieser Befehl erklärt nun, dass Skill
Workshop integriert ist, und gibt gegebenenfalls denselben Richtlinienhinweis aus.

## Verwandte Themen

- [Skills](/de/tools/skills) für Ladereihenfolge, Vorrang und Sichtbarkeit
- [Skills erstellen](/de/tools/creating-skills) für die Grundlagen einer manuell erstellten `SKILL.md`
- [Skills-Konfiguration](/de/tools/skills-config) für das vollständige `skills.workshop`-Schema
- [Skills-CLI](/de/cli/skills) für `openclaw skills`-Befehle
