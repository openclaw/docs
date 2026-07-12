---
read_when:
    - Sie möchten, dass der Agent im Chat einen Skill erstellt oder aktualisiert
    - Sie müssen einen generierten Skill-Entwurf prüfen, anwenden, ablehnen oder unter Quarantäne stellen.
    - Sie konfigurieren Genehmigungen, Autonomie, Speicher oder Limits für Skill Workshop
sidebarTitle: Skill Workshop
summary: Workspace-Skills durch die Überprüfung im Skill Workshop erstellen und aktualisieren
title: Skill-Workshop
x-i18n:
    generated_at: "2026-07-12T16:06:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop ist der kontrollierte OpenClaw-Prozess zum Erstellen und Aktualisieren von
Workspace-Skills. Agenten und Operatoren schreiben über diesen Prozess niemals direkt in
`SKILL.md` – sie erstellen einen **Vorschlag** (einen ausstehenden Entwurf mit Inhalt,
Zielbindung, Scannerstatus, Hashes und Rollback-Metadaten), der erst nach seiner
Anwendung zu einem aktiven Skill wird.

Skill Workshop schreibt ausschließlich Workspace-Skills. Gebündelte,
Plugin-, ClawHub-, Extra-Root-, verwaltete, persönliche Agenten- oder System-Skills werden niemals verändert.

## Funktionsweise

- **Zuerst der Vorschlag:** Generierte Inhalte werden als `PROPOSAL.md` und nicht als
  `SKILL.md` gespeichert.
- **Nur die Anwendung schreibt aktive Daten:** Erstellen, Aktualisieren und Überarbeiten ändern
  niemals aktive Skills.
- **Auf den Workspace beschränkt:** Erstellungen zielen auf das Workspace-Stammverzeichnis `skills/`; Aktualisierungen
  sind nur für beschreibbare Workspace-Skills zulässig.
- **Kein Überschreiben:** Die Erstellung schlägt fehl, wenn der Ziel-Skill bereits vorhanden ist.
- **An Hash gebunden:** Aktualisierungsvorschläge werden an den aktuellen Ziel-Hash gebunden und werden
  `stale`, wenn sich der aktive Skill vor der Anwendung ändert.
- **Durch Scanner abgesichert:** Vor dem Schreiben führt die Anwendung den Sicherheitsscanner erneut aus.
- **Wiederherstellbar:** Vor Änderungen an aktiven Dateien schreibt die Anwendung Rollback-Metadaten.
- **Konsistente Oberflächen:** Chat, CLI und Gateway rufen denselben Dienst auf.

## Lebenszyklus

```text
erstellen/aktualisieren -> ausstehend
überarbeiten            -> ausstehend
anwenden                 -> angewendet
ablehnen                 -> abgelehnt
unter Quarantäne stellen -> unter Quarantäne gestellt
Zieländerung             -> veraltet
```

Nur ein `pending` Vorschlag kann überarbeitet, angewendet, abgelehnt oder unter Quarantäne gestellt werden.

## Lebenszyklus-Kuratierung

Das Gateway erfasst die aggregierte Skill-Nutzung in der gemeinsamen Zustandsdatenbank. Einmal
täglich überprüft es Skills, die mit Skill Workshop erstellt und angewendet wurden. Skills, die länger als
30 Tage nicht verwendet wurden, werden `stale`; nach 90 Tagen werden sie `archived` und
nicht mehr in neue Skill-Snapshots von Agenten aufgenommen. Die Dateien archivierter Skills bleiben auf
dem Datenträger unverändert. Manuell erstellte Skills werden niemals kuratiert; nur Skills, die durch Vorschläge von Skill
Workshop erstellt wurden, werden in die Lebenszyklus-Kuratierung aufgenommen.

Angeheftete Skills umgehen Lebenszyklusübergänge. Ein veralteter Skill wird wieder `active`,
nachdem er verwendet wurde und der nächste Bereinigungslauf stattfindet. Archivierte Skills werden nur durch eine
explizite Wiederherstellung zurückgeführt:

Lebenszyklusübergänge und Wiederherstellungen gelten für neue Sitzungen; laufende Sitzungen behalten
ihren aktuellen Skill-Snapshot.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Alle Kuratorbefehle akzeptieren `--json`. Der Status meldet außerdem deterministisch ermittelte
Überschneidungskandidaten ausschließlich als Vorschläge; er führt niemals Skills zusammen und ruft kein Modell auf.

## Chat

Bitten Sie den Agenten um den gewünschten Skill; er ruft `skill_workshop` auf und gibt eine
Vorschlags-ID zurück.

### Aus kürzlich ausgeführter Arbeit lernen

Verwenden Sie `/learn`, um die aktuelle Unterhaltung oder benannte Quellen in einen
standardgeleiteten Skill-Vorschlag umzuwandeln:

```text
/learn
/learn docs/runbook.md und https://example.com/guide; Schwerpunkt auf Wiederherstellung
```

Ohne Anfrage weist `/learn` den Agenten an, den wiederverwendbaren Ablauf aus der
aktuellen Unterhaltung herauszuarbeiten. Mit einer Anfrage behandelt der Agent Pfade, URLs, eingefügte
Notizen und Verweise auf Unterhaltungen als Quellen und berücksichtigt dabei Anforderungen an Schwerpunkt, Umfang und
Benennung. Er erfasst die Quellen mit seinen vorhandenen Werkzeugen und ruft anschließend
`skill_workshop` mit `action: "create"` auf.

Der resultierende Vorschlag bleibt `pending`; `/learn` wendet ihn niemals an. Prüfen Sie ihn und
wenden Sie ihn über den normalen Genehmigungsablauf oder mit `openclaw skills workshop` an.

Erstellen:

```text
Erstelle einen Skill namens morning-catchup, der meine Posteingangsroutine am Montag ausführt.
```

Einen vorhandenen Workspace-Skill aktualisieren:

```text
Aktualisiere trip-planning, sodass vor der Buchung auch Sitzpläne geprüft werden.
```

Einen ausstehenden Vorschlag iterativ bearbeiten:

```text
Zeige mir den Vorschlag morning-catchup.
Überarbeite ihn so, dass außerdem alles als dringend Markierte gekennzeichnet wird.
Wende den Vorschlag morning-catchup an.
```

Vom Agenten initiierte Aktionen `apply`, `reject` und `quarantine` zeigen standardmäßig eine
Genehmigungsaufforderung an. Setzen Sie `skills.workshop.approvalPolicy` in
vertrauenswürdigen Umgebungen auf `"auto"`, um sie zu überspringen.

Die Aufforderung nennt die Vorschlags-ID und den Ziel-Skill und zeigt die Beschreibung des
Vorschlags, die Anzahl der Begleitdateien und die Größe des Inhalts. Genehmigungsanfragen sind zeitlich so
begrenzt, dass sie vor dem Watchdog des Agentenwerkzeugs abgeschlossen werden. Wenn vor Ablauf der
Aufforderung keine Entscheidung eingeht, wird die Lebenszyklusaktion nicht ausgeführt: Der Vorschlag bleibt
ausstehend und unverändert. Entscheiden Sie später in der Skill-Workshop-Benutzeroberfläche oder führen Sie
`openclaw skills workshop apply|reject|quarantine <proposal-id>` aus. Agenten sollten
eine abgelaufene Lebenszyklusaktion nicht wiederholt in einer Schleife versuchen.

## CLI

```bash
# Erstellen
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Tägliche Posteingangsaufarbeitung: sichten, archivieren, hervorheben, entwerfen, planen" \
  --proposal ./PROPOSAL.md

# Einen vorhandenen Workspace-Skill aktualisieren
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

Jeder Unterbefehl akzeptiert `--agent <id>` (Ziel-Workspace; standardmäßig zunächst aus dem
aktuellen Arbeitsverzeichnis abgeleitet, dann der Standard-Agent) und `--json` (strukturierte Ausgabe).
`propose-create`, `propose-update` und `revise` akzeptieren außerdem `--goal <text>` und
`--evidence <text>`, um den Vorschlagskontext zusammen mit `--proposal` zu erfassen.

## Vorschlagsinhalt

Solange der Vorschlag ausstehend ist, wird er als `PROPOSAL.md` mit ausschließlich für Vorschläge bestimmten
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

## Begleitdateien

Verwenden Sie `--proposal-dir`, wenn der vorgeschlagene Skill neben
`PROPOSAL.md` weitere Dateien benötigt:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Freitagsabschluss: Statistiken, Höhepunkte, die drei wichtigsten Punkte der nächsten Woche" \
  --proposal-dir ./weekly-update-proposal
```

Das Verzeichnis muss `PROPOSAL.md` enthalten. Begleitdateien müssen sich unter
`assets/`, `examples/`, `references/`, `scripts/` oder `templates/` befinden. Skill
Workshop scannt, hasht und speichert sie mit dem Vorschlag und schreibt sie erst bei
der Anwendung neben die aktive `SKILL.md`.

Abgelehnte Pfade für Begleitdateien: absolute Pfade, versteckte Pfadsegmente,
Pfadtraversierung, sich überschneidende Pfade, ausführbare Dateien, Text ohne UTF-8-Kodierung, Nullbytes
und Pfade außerhalb der standardmäßigen Begleitordner.

## Agentenwerkzeug

Das Modell verwendet `skill_workshop` mit einer erforderlichen `action`:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Weitere Parameter gelten abhängig von der Aktion:

| Parameter                  | Verwendet von                                         | Hinweise                                                                    |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                         | Für `create` erforderlich; löst andernfalls einen ausstehenden Vorschlag anhand des Namens auf |
| `description`              | `create`, `update`, `revise`                          | Max. 160 Byte                                                               |
| `skill_name`               | `update`                                              | Name oder Schlüssel eines vorhandenen Skills                                |
| `proposal_content`         | `create`, `update`, `revise`                          | Als `PROPOSAL.md` gespeichert; durch `skills.workshop.maxSkillBytes` begrenzt |
| `support_files`            | `create`, `update`, `revise`                          | Array aus `{ path, content }`                                                |
| `goal`, `evidence`         | `create`, `update`, `revise`                          | Freitextkontext                                                              |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine`  | Zielvorschlag                                                                |
| `reason`                   | `apply`, `reject`, `quarantine`                       | Optional                                                                    |
| `query`, `status`, `limit` | `list`                                                | Filtern/paginieren; `limit` max. 50, Standardwert 20                        |

Agenten müssen `skill_workshop` für generierte Skill-Arbeit verwenden. Sie dürfen
Vorschlagsdateien nicht über `write`, `edit`, `exec`, Shell-
Befehle oder direkte Dateisystemoperationen erstellen oder ändern.

<Note>
`skill_workshop` ist ein integriertes Agentenwerkzeug und in
`tools.profile: "coding"` enthalten. Wenn eine strengere Richtlinie es ausblendet, fügen Sie
`skill_workshop` zur aktiven Liste `tools.allow` hinzu oder verwenden Sie
`tools.alsoAllow: ["skill_workshop"]`, wenn der Geltungsbereich ein Profil ohne
explizites `tools.allow` verwendet. In Sandbox-Ausführungen wird das hostseitige
Skill-Workshop-Werkzeug nicht erstellt; führen Sie Aktionen zur Vorschlagsprüfung daher in einer normalen hostseitigen
Agentensitzung oder über die CLI aus.
</Note>

## Vorgeschlagene Skills

OpenClaw erkennt dauerhafte Anweisungen wie „beim nächsten Mal“, „merken Sie sich“ und reaktive Korrekturen,
wenn eine interaktive Runde endet, einschließlich fehlgeschlagener Runden. In der nächsten Runde bietet der Agent an,
den zuletzt erkannten Ablauf über `skill_workshop` zu speichern; der Benutzer entscheidet, ob ein
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

| Einstellung                | Standardwert | Auswirkung                                                                                                                                                            |
| -------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`      | Erstellt direkt ausstehende Vorschläge, statt in der nächsten Runde den zuletzt erkannten Ablauf zum Speichern anzubieten.                                             |
| `allowSymlinkTargetWrites` | `false`      | Ermöglicht bei der Anwendung das Schreiben über Symlinks von Workspace-Skills, deren tatsächliches Ziel in `skills.load.allowSymlinkTargets` aufgeführt ist.          |
| `approvalPolicy`           | `"pending"`  | `"pending"` erfordert vor vom Agenten initiierten Aktionen `apply`, `reject` oder `quarantine` eine Genehmigungsaufforderung. `"auto"` überspringt die Aufforderung (der Agent muss die Aktion weiterhin aufrufen). |
| `maxPending`               | `50`         | Begrenzt ausstehende und unter Quarantäne gestellte Vorschläge pro Workspace (1-200).                                                                                  |
| `maxSkillBytes`            | `40000`      | Begrenzt die Größe des Vorschlagsinhalts in Byte (1024-200000).                                                                                                       |

Die autonome Erfassung erkennt vorausschauende Regeln (zum Beispiel „von nun an“) und reaktive
Korrekturen (zum Beispiel „das ist nicht das, worum ich gebeten habe“). Sie gruppiert neue Anweisungen nach Thema in bis
zu drei Vorschläge pro Runde, leitet passende Begriffe an vorhandene beschreibbare Workspace-Skills weiter und
überarbeitet ihren eigenen ausstehenden Vorschlag, wenn eine weitere Korrektur auf denselben Skill abzielt.

Vorschlagsbeschreibungen sind unabhängig von
`maxSkillBytes` immer auf 160 Byte begrenzt.

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

`requestRevision` ist nur über den Gateway verfügbar (ohne Entsprechung in der CLI oder den Agent-Tools): Die Methode
leitet Freitext-Anweisungen zur Überarbeitung an die Chat-Sitzung des zuständigen Agenten weiter,
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
- `proposals.json`: schneller Auflistungsindex, der aus den Vorschlagsordnern neu erstellt werden kann.
- `PROPOSAL.md`: ausstehender Skill-Vorschlag.
- `rollback.json`: Wiederherstellungsmetadaten, die geschrieben werden, bevor die Anwendung Änderungen an aktiven Dateien vornimmt.

## Grenzwerte

| Grenzwert                       | Wert                                                                 |
| ------------------------------- | -------------------------------------------------------------------- |
| Beschreibung                    | 160 Byte                                                             |
| Vorschlagsinhalt                | `skills.workshop.maxSkillBytes` (Standardwert 40,000; feste Obergrenze 1 MiB) |
| Unterstützende Dateien          | 64 pro Vorschlag                                                     |
| Größe unterstützender Dateien   | jeweils 256 KiB, insgesamt 2 MiB                                     |
| Ausstehende + unter Quarantäne gestellte Vorschläge | `skills.workshop.maxPending` pro Workspace (Standardwert 50)         |

## Fehlerbehebung

| Problem                                        | Lösung                                                                                                                                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Kürzen Sie `description` auf höchstens 160 Byte.                                                                                                                                                            |
| `Skill proposal content is too large`          | Kürzen Sie den Vorschlagsinhalt oder erhöhen Sie `skills.workshop.maxSkillBytes`.                                                                                                                           |
| `Target skill changed after proposal creation` | Überarbeiten Sie den Vorschlag anhand des aktuellen Ziel-Skills oder erstellen Sie einen neuen Vorschlag.                                                                                                   |
| `Proposal scan failed`                         | Prüfen Sie die Ergebnisse des Scanners und überarbeiten Sie anschließend den Vorschlag oder stellen Sie ihn unter Quarantäne.                                                                               |
| `untrusted symlink target`                     | Konfigurieren Sie `skills.load.allowSymlinkTargets` und aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur für bewusst gemeinsam genutzte Skill-Stammverzeichnisse.                              |
| `Support file paths must be under one of...`   | Verschieben Sie unterstützende Dateien nach `assets/`, `examples/`, `references/`, `scripts/` oder `templates/`.                                                                                            |
| Vorschlag wird nicht in der Liste angezeigt    | Prüfen Sie den ausgewählten `--agent`-Workspace und `OPENCLAW_STATE_DIR`.                                                                                                                                   |
| Agent kann `skill_workshop` nicht aufrufen     | Prüfen Sie die aktive Tool-Richtlinie und den Ausführungsmodus. `coding` enthält das Tool; restriktive `tools.allow`-Richtlinien müssen es ausdrücklich aufführen, und Sandbox-Ausführungen müssen eine normale hostseitige Agent-Sitzung oder die CLI verwenden. |

### Tool-Richtliniendiagnose

Wenn die autonome Erfassung aktiviert ist, führt `openclaw doctor` für den
Standard-Agenten die Prüfung `core/doctor/skill-workshop-tool-policy` aus. Wenn die Richtlinie
`skill_workshop` ausblendet, nennt die Warnung die erste ausschließende Konfigurationsebene und
die genaue erforderliche Änderung an `allow` oder `alsoAllow`. Ältere Betriebshandbücher verwenden möglicherweise noch
`openclaw plugins inspect skill-workshop`; dieser Befehl erklärt nun, dass Skill
Workshop integriert ist, und gibt gegebenenfalls denselben Richtlinienhinweis aus.

## Verwandte Themen

- [Skills](/de/tools/skills) für Ladereihenfolge, Vorrang und Sichtbarkeit
- [Skills erstellen](/de/tools/creating-skills) für die Grundlagen einer manuell erstellten `SKILL.md`
- [Skills-Konfiguration](/de/tools/skills-config) für das vollständige `skills.workshop`-Schema
- [Skills-CLI](/de/cli/skills) für `openclaw skills`-Befehle
